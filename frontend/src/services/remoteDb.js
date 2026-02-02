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

export const isRemoteDbEnabled = () => Boolean(supabase);

export const getSupabaseClient = () => supabase;

export const getSupabaseRealtimeClient = () => supabaseRealtime;

export const getDbProvider = () => provider;

export const getRemoteSession = async () => {
  if (!supabase) return { enabled: false, session: null };
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return { enabled: true, session: data?.session || null };
};

export const signInWithPassword = async ({ email, password }) => {
  if (!supabase) return { enabled: false, session: null, user: null };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { enabled: true, session: data?.session || null, user: data?.user || null };
};

export const signUpWithPassword = async ({ email, password, name }) => {
  if (!supabase) return { enabled: false, session: null, user: null };
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name: String(name || '').trim() } } });
  if (error) throw error;
  return { enabled: true, session: data?.session || null, user: data?.user || null };
};

export const signOutRemote = async () => {
  if (!supabase) return { enabled: false };
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { enabled: true };
};

export const resetPasswordForEmail = async ({ email, redirectTo }) => {
  if (!supabase) return { enabled: false };
  const options = redirectTo ? { redirectTo } : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, options);
  if (error) throw error;
  return { enabled: true };
};

export const updateRemotePassword = async ({ password }) => {
  if (!supabase) return { enabled: false };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return { enabled: true };
};

export const upsertProfile = async (profile) => {
  const res = await withFailover(async (client) => {
    const { error } = await client.from('profiles').upsert(profileToRow(profile), { onConflict: 'local_user_id' });
    if (error) throw error;
    return true;
  });
  return { enabled: res.enabled };
};

export const getProfile = async (localUserId) => {
  if (!supabase) return null;
  const res = await withFailover(async (client) => {
    const { data, error } = await client.from('profiles').select('*').eq('local_user_id', localUserId).maybeSingle();
    if (error) throw error;
    return data || null;
  });
  if (!res.enabled || !res.data) return null;
  return profileRowToInternal(res.data);
};

export const getProfileByEmail = async (email) => {
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

export const checkProfileConflicts = async ({ username, email }) => {
  if (!supabase) return { enabled: false, usernameTaken: false, emailTaken: false };

  const usernameLower = normalizeUsername(username);
  const emailLower = normalizeEmail(email);

  if (!usernameLower && !emailLower) {
    return { enabled: true, usernameTaken: false, emailTaken: false };
  }

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

export const registerProfile = async ({ localUserId, username, name, email, avatar }) => {
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

export const getProgress = async (localUserId) => {
  if (!supabase) return null;
  const res = await withFailover(async (client) => {
    const { data, error } = await client.from('progress').select('*').eq('local_user_id', localUserId).maybeSingle();
    if (error) throw error;
    return data || null;
  });
  if (!res.enabled || !res.data) return null;
  return progressRowToInternal(res.data);
};

export const upsertProgress = async (localUserId, progress) => {
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

export const upsertFeedbackResponse = async (response) => {
  const res = await withFailover(async (client) => {
    const { error } = await client.from('feedback_responses').upsert(feedbackToRow(response), { onConflict: 'id' });
    if (error) throw error;
    return true;
  });
  return { enabled: res.enabled };
};
