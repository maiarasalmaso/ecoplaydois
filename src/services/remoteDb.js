import { createClient } from '@supabase/supabase-js';

// Get configuration from env or localStorage (for dynamic setup)
const getStoredConfig = () => {
  try {
    const stored = localStorage.getItem('ecoplay-db-config');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const storedConfig = getStoredConfig();

const supabaseUrl = storedConfig?.url || import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = storedConfig?.key || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY;

// Auto-detect provider if keys are present, otherwise default to local
const hasSupabaseKeys = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
const provider = storedConfig?.provider || import.meta.env.VITE_DB_PROVIDER || (hasSupabaseKeys ? 'supabase' : 'local');
const fallbackUrl = import.meta.env.VITE_SUPABASE_FALLBACK_URL;
const fallbackAnonKey = import.meta.env.VITE_SUPABASE_FALLBACK_ANON_KEY || supabaseAnonKey;
const fetchTimeoutMs = Number(import.meta.env.VITE_DB_FETCH_TIMEOUT_MS || 12_000);
const authStorageKey = import.meta.env.VITE_SUPABASE_AUTH_STORAGE_KEY || 'ecoplay.supabase.auth';

const customFetch = async (input, init) => {
  const timeout = Number.isFinite(fetchTimeoutMs) ? fetchTimeoutMs : 12_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(0, timeout));
  try {
    return await fetch(input, { ...(init || {}), signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const makeClient = (url, key) => {
  if (!url || !key) return null;
  return createClient(url, key, {
    global: { fetch: customFetch },
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: authStorageKey },
  });
};

const canUseSupabase = provider === 'supabase' && Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
const supabase = canUseSupabase ? makeClient(supabaseUrl, supabaseAnonKey) : null;
const supabaseFallback = provider === 'supabase' ? makeClient(fallbackUrl, fallbackAnonKey) : null;
const supabaseRealtime =
  supabase || (provider === 'supabase' && Boolean(supabaseUrl) && Boolean(supabaseAnonKey) ? makeClient(supabaseUrl, supabaseAnonKey) : null);

const isTransientError = (error) => {
  const msg = String(error?.message || '').toLowerCase();
  const status = Number(error?.status || 0);
  if (status >= 500) return true;
  if (status === 0) return true;
  if (msg.includes('failed to fetch')) return true;
  if (msg.includes('networkerror')) return true;
  if (msg.includes('timeout')) return true;
  if (msg.includes('abort')) return true;
  return false;
};

const withFailover = async (fn) => {
  if (!supabase) return { enabled: false, data: null };
  try {
    const data = await fn(supabase);
    return { enabled: true, data };
  } catch (error) {
    if (!supabaseFallback || !isTransientError(error)) throw error;
    const data = await fn(supabaseFallback);
    return { enabled: true, data };
  }
};

const normalizeEmail = (email) => (email || '').trim().toLowerCase();
const normalizeUsername = (username) => (username || '').trim().toLowerCase();

const profileToRow = (profile) => ({
  local_user_id: profile.id,
  username: profile.username || profile.name,
  name: profile.name,
  email: normalizeEmail(profile.email),
  avatar: profile.avatar || null,
  streak: profile.streak ?? 0,
  last_login_date: profile.lastLoginDate || null
});

const profileRowToInternal = (row) => ({
  id: row?.local_user_id,
  username: row?.username ?? null,
  name: row?.name ?? null,
  email: row?.email ?? null,
  avatar: row?.avatar ?? null,
  streak: row?.streak ?? 0,
  lastLoginDate: row?.last_login_date ?? null,
});

const progressRowToInternal = (row) => ({
  score: row?.score ?? 0,
  badges: row?.badges ?? [],
  badgeUnlocks: row?.badge_unlocks ?? {},
  stats: row?.stats ?? {},
  completedLevels: row?.completed_levels ?? {},
  lastDailyXpDate: row?.last_daily_xp_date ?? null,
  unclaimedRewards: row?.unclaimed_rewards ?? []
});

const progressToRow = (localUserId, progress) => ({
  local_user_id: localUserId,
  score: progress.score ?? 0,
  badges: progress.badges ?? [],
  badge_unlocks: progress.badgeUnlocks ?? {},
  stats: progress.stats ?? {},
  completed_levels: progress.completedLevels ?? {},
  last_daily_xp_date: progress.lastDailyXpDate ?? null,
  unclaimed_rewards: progress.unclaimedRewards ?? []
});

export const getSupabaseClient = () => supabase;

export const getSupabaseRealtimeClient = () => supabaseRealtime;

export const getDbProvider = () => provider;

// --- Concrete Supabase Implementations ---
const supabaseGetSession = async () => {
  if (!supabase) return { enabled: false, session: null };
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return { enabled: true, session: data?.session || null };
};

const supabaseSignIn = async ({ email, password }) => {
  if (!supabase) return { enabled: false, session: null, user: null };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { enabled: true, session: data?.session || null, user: data?.user || null };
};

const supabaseSignUp = async ({ email, password, name }) => {
  if (!supabase) return { enabled: false, session: null, user: null };
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: String(name || '').trim() } } });
  if (error) throw error;
  return { enabled: true, session: data?.session || null, user: data?.user || null };
};

const supabaseSignOut = async () => {
  if (!supabase) return { enabled: false };
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { enabled: true };
};

const supabaseResetPassword = async ({ email, redirectTo }) => {
  if (!supabase) return { enabled: false };
  const options = redirectTo ? { redirectTo } : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, options);
  if (error) throw error;
  return { enabled: true };
};

const supabaseUpdatePassword = async ({ password }) => {
  if (!supabase) return { enabled: false };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return { enabled: true };
};

const supabaseUpsertProfile = async (profile) => {
  const res = await withFailover(async (client) => {
    const { error } = await client.from('profiles').upsert(profileToRow(profile), { onConflict: 'local_user_id' });
    if (error) throw error;
    return true;
  });
  return { enabled: res.enabled };
};

const supabaseGetProfile = async (localUserId) => {
  if (!supabase) return null;
  const res = await withFailover(async (client) => {
    const { data, error } = await client.from('profiles').select('*').eq('local_user_id', localUserId).maybeSingle();
    if (error) throw error;
    return data || null;
  });
  if (!res.enabled || !res.data) return null;
  return profileRowToInternal(res.data);
};

const supabaseGetProfileByEmail = async (email) => {
  if (!supabase) return null;
  const emailLower = normalizeEmail(email);
  if (!emailLower) return null;
  const res = await withFailover(async (client) => {
    const { data, error } = await client.from('profiles').select('*').eq('email_lower', emailLower).maybeSingle();
    if (error) throw error;
    return data || null;
  });
  if (!res.enabled || !res.data) return null;
  return profileRowToInternal(res.data);
};

const supabaseCheckConflicts = async ({ username, email }) => {
  if (!supabase) return { enabled: false, usernameTaken: false, emailTaken: false };
  const usernameLower = normalizeUsername(username);
  const emailLower = normalizeEmail(email);
  if (!usernameLower && !emailLower) return { enabled: true, usernameTaken: false, emailTaken: false };

  const filters = [];
  if (usernameLower) filters.push(`username_lower.eq.${usernameLower}`);
  if (emailLower) filters.push(`email_lower.eq.${emailLower}`);

  const res = await withFailover(async (client) => {
    const query = client.from('profiles').select('username_lower,email_lower').limit(5);
    const { data, error } = await query.or(filters.join(','));
    if (error) throw error;
    return data || [];
  });
  const data = res.data || [];
  const usernameTaken = Boolean(usernameLower) && (data || []).some((row) => row?.username_lower === usernameLower);
  const emailTaken = Boolean(emailLower) && (data || []).some((row) => row?.email_lower === emailLower);
  return { enabled: true, usernameTaken, emailTaken };
};

const supabaseRegisterProfile = async ({ localUserId, username, name, email, avatar }) => {
  const res = await withFailover(async (client) => {
    const { data, error } = await client.rpc('ecoplay_register_profile', {
      p_local_user_id: localUserId,
      p_username: (username || name || '').trim(),
      p_name: (name || username || '').trim(),
      p_email: normalizeEmail(email),
      p_avatar: avatar || null,
    });
    if (error) throw error;
    return data;
  });
  return { enabled: res.enabled, data: res.data };
};

const supabaseGetProgress = async (localUserId) => {
  if (!supabase) return null;
  const res = await withFailover(async (client) => {
    const { data, error } = await client.from('progress').select('*').eq('local_user_id', localUserId).maybeSingle();
    if (error) throw error;
    return data || null;
  });
  if (!res.enabled || !res.data) return null;
  return progressRowToInternal(res.data);
};

const supabaseUpsertProgress = async (localUserId, progress) => {
  const res = await withFailover(async (client) => {
    const { error } = await client.from('progress').upsert(progressToRow(localUserId, progress), { onConflict: 'local_user_id' });
    if (error) throw error;
    return true;
  });
  return { enabled: res.enabled };
};

const feedbackToRow = (response) => ({
  id: response.id,
  created_at: response.createdAt,
  local_user_id: response?.user?.id ?? null,
  user_name: response?.user?.name ?? null,
  user_email: normalizeEmail(response?.user?.email),
  user_type: response?.user?.type ?? null,
  score: response?.score ?? 0,
  level: response?.level ?? null,
  badges: response?.badges ?? [],
  ux: response?.ux ?? {},
  learning: response?.learning ?? {},
  meta: response?.meta ?? {},
});

const supabaseUpsertFeedback = async (response) => {
  const res = await withFailover(async (client) => {
    const { error } = await client.from('feedback_responses').upsert(feedbackToRow(response), { onConflict: 'id' });
    if (error) throw error;
    return true;
  });
  return { enabled: res.enabled };
};
// ------------------------------------

const apiFetch = async (endpoint, options = {}, retries = 2, backoff = 300) => {
  const token = localStorage.getItem('ecoplay_token');
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const baseUrl = import.meta.env.VITE_API_URL || '';
  // Add cache-buster query param for mobile browsers
  const cacheBuster = `_t=${Date.now()}`;
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${baseUrl}${endpoint}${separator}${cacheBuster}`;

  try {
    const res = await fetch(url, { ...options, headers, cache: 'no-store' });

    // 🚨 Authentication Validations
    if (res.status === 401) {
      console.warn(`[Security] Token rejected at ${endpoint}. Clearing session.`);
      localStorage.removeItem('ecoplay_token');
      // Optional: Dispatch event to trigger UI logout
      window.dispatchEvent(new Event('ecoplay:auth:logout'));
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // Rate Limiting / Server Errors (Circuit Breaker Logic)
    if (res.status === 429 || res.status >= 500) {
      if (retries > 0) {
        console.warn(`[Retry] ${endpoint} failed (${res.status}). Retrying in ${backoff}ms...`);
        await new Promise(r => setTimeout(r, backoff));
        return apiFetch(endpoint, options, retries - 1, backoff * 2);
      }
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.error || `Request failed with status ${res.status}`);
    }

    return res.json();
  } catch (error) {
    // catch network errors (DNS, Timeout)
    if (retries > 0 && (error.name === 'TypeError' || error.message.includes('fetch'))) {
      console.warn(`[Network] Connection failed. Retrying...`);
      await new Promise(r => setTimeout(r, backoff));
      return apiFetch(endpoint, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

const currentProvider = (storedConfig?.provider || import.meta.env.VITE_DB_PROVIDER || 'local_api');

export const isRemoteDbEnabled = () => Boolean(supabase) || currentProvider === 'local_api';

const providers = {
  supabase: {
    enabled: () => Boolean(supabase),
    getSession: supabaseGetSession,
    signIn: supabaseSignIn,
    signUp: supabaseSignUp,
    signOut: supabaseSignOut,
    resetPassword: supabaseResetPassword,
    updatePassword: supabaseUpdatePassword,
    upsertProfile: supabaseUpsertProfile,
    getProfile: supabaseGetProfile,
    getProfileByEmail: supabaseGetProfileByEmail,
    checkConflicts: supabaseCheckConflicts,
    registerProfile: supabaseRegisterProfile,
    getProgress: supabaseGetProgress,
    upsertProgress: supabaseUpsertProgress,
    upsertFeedback: supabaseUpsertFeedback
  },
  local_api: {
    enabled: () => true,
    getSession: async () => {
      const token = localStorage.getItem('ecoplay_token');
      if (!token) return { enabled: true, session: null };
      try {
        const user = await apiFetch('/api/auth/me');
        return { enabled: true, session: { access_token: token, user } };
      } catch {
        return { enabled: true, session: null };
      }
    },
    signIn: async ({ email, password }) => {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) {
        localStorage.setItem('ecoplay_token', data.token);
        return { enabled: true, session: { access_token: data.token, user: data.user }, user: data.user };
      }
      return { enabled: true, session: null, user: null };
    },
    signUp: async ({ email, password, name }) => {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: name })
      });
      return providers.local_api.signIn({ email, password });
    },
    signOut: async () => {
      localStorage.removeItem('ecoplay_token');
      return { enabled: true };
    },
    // Fallback/Not-supported for some auth utils yet or use placeholders
    resetPassword: async () => ({ enabled: false }),
    updatePassword: async () => ({ enabled: false }),

    // Profile Sync (Use Auth/Users endpoints)
    upsertProfile: async () => ({ enabled: true }), // managed via auth/me
    getProfile: async () => null, // managed via auth/me inside session
    getProfileByEmail: async () => null,
    checkConflicts: async () => ({ enabled: true, usernameTaken: false, emailTaken: false }), // TODO: check endpoint
    registerProfile: async () => ({ enabled: true }),

    getProgress: async (localUserId) => {
      const data = await apiFetch('/api/progress');
      if (!data) return null;
      return {
        score: data.score,
        badges: data.badges,
        badgeUnlocks: data.badge_unlocks,
        stats: data.stats,
        completedLevels: data.completed_levels,
        lastDailyXpDate: data.last_daily_xp_date,
        unclaimedRewards: data.unclaimed_rewards
      };
    },
    upsertProgress: async (localUserId, progress) => {
      const payload = {
        score: progress.score,
        badges: progress.badges,
        badge_unlocks: progress.badgeUnlocks,
        stats: progress.stats,
        completed_levels: progress.completedLevels,
        last_daily_xp_date: progress.lastDailyXpDate,
        unclaimed_rewards: progress.unclaimedRewards
      };
      // 3. Persistence 'Blindada' (KeepAlive)
      await apiFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true
      });
      return { enabled: true };
    },
    checkUserFeedback: async () => {
      try {
        const { hasFeedback } = await apiFetch('/api/feedback/check');
        return hasFeedback;
      } catch {
        return false;
      }
    },
    upsertFeedback: async (response) => {
      const payload = feedbackToRow(response);
      await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return { enabled: true };
    },
    getLeaderboard: async () => {
      const data = await apiFetch('/api/users/leaderboard');
      // Adapting to match the frontend expectations if needed
      // Frontend expects: [{ id, name, xp }]
      // Backend returns: [{ id, full_name, score, avatar }]
      // We map it here or in the component. Let's map it here for consistency.
      if (!Array.isArray(data)) return [];
      return data.map(u => ({
        id: u.id,
        name: u.full_name || 'Usuário',
        xp: u.score,
        avatar: u.avatar,
        level: u.level || 0 // Default to 0 if missing
      }));
    }
  }
};

const delegate = (method, ...args) => {
  const p = providers[currentProvider];
  if (p && p[method]) return p[method](...args);
  if (method === 'enabled') return false;
  return currentProvider === 'supabase' ? providers.supabase[method]?.(...args) : null;
};

// Exports
export const getRemoteSession = () => delegate('getSession');
export const signInWithPassword = (args) => delegate('signIn', args);
export const signUpWithPassword = (args) => delegate('signUp', args);
export const signOutRemote = () => delegate('signOut');
export const resetPasswordForEmail = (args) => delegate('resetPassword', args);
export const updateRemotePassword = (args) => delegate('updatePassword', args);
export const upsertProfile = (args) => delegate('upsertProfile', args);
export const getProfile = (args) => delegate('getProfile', args);
export const getProfileByEmail = (args) => delegate('getProfileByEmail', args);
export const checkProfileConflicts = (args) => delegate('checkConflicts', args);
export const registerProfile = (args) => delegate('registerProfile', args);
export const getProgress = (id) => delegate('getProgress', id);
export const upsertProgress = (id, data) => delegate('upsertProgress', id, data);
export const upsertFeedbackResponse = (data) => delegate('upsertFeedback', data);
export const checkUserHasFeedback = () => delegate('checkUserFeedback');
export const getLeaderboard = () => delegate('getLeaderboard');

