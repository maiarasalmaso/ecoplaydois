import { createContext, useState, useContext, useEffect } from 'react';
import {
  checkProfileConflicts,
  getProfileByEmail,
  getRemoteSession,
  isRemoteDbEnabled,
  registerProfile,
  resetPasswordForEmail,
  signInWithPassword,
  signOutRemote,
  signUpWithPassword,
  updateRemotePassword,
  upsertProfile,
} from '../services/remoteDb';
import { dateOnlyNowLondrina, diffDaysDateOnly } from '../utils/dateTime';

const AuthContext = createContext();

const encoder = new TextEncoder();

const bytesToBase64 = (bytes) => {
  let str = '';
  for (let i = 0; i < bytes.length; i += 1) str += String.fromCharCode(bytes[i]);
  return btoa(str);
};

const base64ToBytes = (base64) => {
  const raw = atob(String(base64 || ''));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
};

const constantTimeEqual = (a, b) => {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
};

const pbkdf2HashPassword = async ({ password, saltBytes, iterations }) => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('WebCrypto indisponível');
  const key = await subtle.importKey('raw', encoder.encode(String(password || '')), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derived = await subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
    key,
    256
  );
  return new Uint8Array(derived);
};

  const hashPasswordForStorage = async (password) => {
    const salt = new Uint8Array(16);
    globalThis.crypto.getRandomValues(salt);
    const iterations = 120_000;
    const hash = await pbkdf2HashPassword({ password, saltBytes: salt, iterations });
  return {
    passwordAlgo: `pbkdf2-sha256-${iterations}`,
    passwordSalt: bytesToBase64(salt),
    passwordHash: bytesToBase64(hash),
  };
  };

  const verifyPasswordAgainstRecord = async ({ password, record }) => {
    if (!record) return false;
  if (record.passwordHash && record.passwordSalt && record.passwordAlgo) {
    const parts = String(record.passwordAlgo).split('-');
    const iterations = Number(parts[2] || 0) || 120_000;
    const salt = base64ToBytes(record.passwordSalt);
    const expected = base64ToBytes(record.passwordHash);
    const actual = await pbkdf2HashPassword({ password, saltBytes: salt, iterations });
    return constantTimeEqual(expected, actual);
  }
  if (record.password) return String(record.password) === String(password);
  return false;
  };

  const readResetRequests = () => {
    try {
      const raw = localStorage.getItem('ecoplay_reset_requests');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeResetRequests = (requests) => {
    try {
      localStorage.setItem('ecoplay_reset_requests', JSON.stringify(Array.isArray(requests) ? requests : []));
    } catch {
      return;
    }
  };

  const randomResetCode = () => {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    const v = Number(buf[0] % 1_000_000);
    return String(v).padStart(6, '0');
  };

  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const readUsersDb = () => {
    try {
      const raw = localStorage.getItem('ecoplay_users_db');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeUsersDb = (users) => {
    try {
      localStorage.setItem('ecoplay_users_db', JSON.stringify(Array.isArray(users) ? users : []));
    } catch {
      return;
    }
  };

  const syncProfile = (profile) => {
    if (!isRemoteDbEnabled()) return;
    upsertProfile(profile).catch((error) => {
      console.debug('[supabase] falha ao sincronizar perfil', error);
    });
  };

  // Função auxiliar para calcular streak
  const updateStreak = (userObj) => {
    const today = dateOnlyNowLondrina();
    const lastLogin = userObj.lastLoginDate;
    
    let newStreak = userObj.streak || 0;

    if (lastLogin !== today) {
      if (lastLogin) {
        const diffDays = diffDaysDateOnly(lastLogin, today);

        if (diffDays === 1) {
          // Logou ontem, incrementa streak
          newStreak += 1;
        } else {
          // Quebrou a sequência (mais de 1 dia)
          newStreak = 1;
        }
      } else {
        // Primeiro login registrado com sistema de streak
        newStreak = 1;
      }
    }
    // Se logou hoje, mantém o streak atual

    return { ...userObj, lastLoginDate: today, streak: newStreak };
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (isRemoteDbEnabled()) {
        try {
          const { session } = await getRemoteSession();
          if (!session?.user?.id) {
            if (!cancelled) setUser(null);
            return;
          }
          const email = String(session.user.email || '');
          const profile = await getProfileByEmail(email);
          const localUserId = profile?.id ?? Date.now();
          const baseUser = {
            id: localUserId,
            name: profile?.name || session.user.user_metadata?.name || 'Usuário',
            email: profile?.email || email,
            avatar: profile?.avatar || 'default',
            streak: profile?.streak ?? 1,
            lastLoginDate: profile?.lastLoginDate || dateOnlyNowLondrina(),
          };
          const updated = updateStreak(baseUser);
          localStorage.setItem('ecoplay_user', JSON.stringify(updated));
          if (!cancelled) setUser(updated);
          syncProfile(updated);
          return;
        } catch (e) {
          void e;
          localStorage.removeItem('ecoplay_user');
          if (!cancelled) setUser(null);
          return;
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      try {
        const storedUser = localStorage.getItem('ecoplay_user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        const isValid =
          parsedUser && typeof parsedUser === 'object' && typeof parsedUser.email === 'string' && typeof parsedUser.id !== 'undefined';

        if (!isValid) {
          localStorage.removeItem('ecoplay_user');
          return;
        }

        const updatedUser = updateStreak(parsedUser);

        if (updatedUser.lastLoginDate !== parsedUser.lastLoginDate) {
          localStorage.setItem('ecoplay_user', JSON.stringify(updatedUser));

          const users = readUsersDb();
          const userIndex = users.findIndex((u) => u.email === updatedUser.email);
          if (userIndex !== -1) {
            users[userIndex] = { ...users[userIndex], ...updatedUser };
            writeUsersDb(users);
          }
        }

        if (!cancelled) setUser(updatedUser);
        syncProfile(updatedUser);
      } catch {
        localStorage.removeItem('ecoplay_user');
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (isRemoteDbEnabled()) {
      try {
        const { user: remoteUser } = await signInWithPassword({ email: normalizedEmail, password });
        if (!remoteUser?.id) return { success: false, message: 'Email ou senha incorretos.' };
        const profile = await getProfileByEmail(normalizedEmail);
        const localUserId = profile?.id ?? Date.now();
        const baseUser = {
          id: localUserId,
          name: profile?.name || remoteUser.user_metadata?.name || 'Usuário',
          email: profile?.email || normalizedEmail,
          avatar: profile?.avatar || 'default',
          streak: profile?.streak ?? 1,
          lastLoginDate: profile?.lastLoginDate || dateOnlyNowLondrina(),
        };
        const updated = updateStreak(baseUser);
        localStorage.setItem('ecoplay_user', JSON.stringify(updated));
        setUser(updated);
        syncProfile(updated);
        return { success: true };
      } catch (e) {
        void e;
        return { success: false, message: 'Não foi possível entrar. Tente novamente.' };
      }
    }

    const users = readUsersDb().map((u) => ({ ...u, email: (u?.email || '').trim().toLowerCase() }));
    const foundUser = users.find((u) => u.email === normalizedEmail);
    const ok = await verifyPasswordAgainstRecord({ password, record: foundUser });

    if (foundUser && ok) {
      const needsUpgrade = Boolean(foundUser.password) && !foundUser.passwordHash;
      const userIndex = users.findIndex((u) => u.email === normalizedEmail);
      if (needsUpgrade && userIndex !== -1) {
        try {
          const secure = await hashPasswordForStorage(password);
          const next = { ...users[userIndex], ...secure };
          delete next.password;
          users[userIndex] = next;
        } catch (e) {
          void e;
        }
      }

      const { password: _password, passwordHash: _hash, passwordSalt: _salt, passwordAlgo: _algo, ...userWithoutPass } = foundUser;
      const userWithStreak = updateStreak(userWithoutPass);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...userWithStreak };
        writeUsersDb(users);
      }
      localStorage.setItem('ecoplay_user', JSON.stringify(userWithStreak));
      setUser(userWithStreak);
      syncProfile(userWithStreak);
      return { success: true };
    }

    return { success: false, message: 'Email ou senha incorretos.' };
  };

  const register = async (name, email, password) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedName = (name || '').trim().toLowerCase();
    const displayName = (name || '').trim();
    
    const today = dateOnlyNowLondrina();
    const avatar = 'default';

    if (isRemoteDbEnabled()) {
      try {
        const localUserId = Date.now();

        try {
          const conflicts = await checkProfileConflicts({ username: displayName, email: normalizedEmail });
          if (conflicts.usernameTaken) return { success: false, message: 'Este nome de usuário já está em uso.' };
          if (conflicts.emailTaken) return { success: false, message: 'Este email já está cadastrado.' };
        } catch (e) {
          void e;
        }

        try {
          await signUpWithPassword({ email: normalizedEmail, password, name: displayName });
        } catch (e) {
          const msg = String(e?.message || '');
          if (msg.toLowerCase().includes('already') && msg.toLowerCase().includes('registered')) {
            return { success: false, message: 'Este email já está cadastrado.' };
          }
          return { success: false, message: 'Não foi possível concluir o cadastro. Tente novamente.' };
        }

        try {
          await registerProfile({
            localUserId,
            username: displayName,
            name: displayName,
            email: normalizedEmail,
            avatar,
          });
        } catch (e) {
          void e;
          await upsertProfile({
            id: localUserId,
            username: displayName,
            name: displayName,
            email: normalizedEmail,
            avatar,
            streak: 1,
            lastLoginDate: today,
          });
        }

        const nextUser = { id: localUserId, name: displayName, email: normalizedEmail, avatar, streak: 1, lastLoginDate: today };
        localStorage.setItem('ecoplay_user', JSON.stringify(nextUser));
        setUser(nextUser);
        syncProfile(nextUser);
        return { success: true };
      } catch (error) {
        const rawMessage = String(error?.message || '');
        const details = String(error?.details || '');
        const hint = String(error?.hint || '');
        const combined = `${rawMessage}\n${details}\n${hint}`.toLowerCase();

        if (combined.includes('email') && combined.includes('already')) return { success: false, message: 'Este email já está cadastrado.' };
        return { success: false, message: 'Não foi possível concluir o cadastro. Tente novamente.' };
      }
    }

    const users = readUsersDb();
    if (users.find((u) => (u.email || '').trim().toLowerCase() === normalizedEmail)) {
      console.debug('[register] tentativa duplicada (email)', { email: normalizedEmail });
      return { success: false, message: 'Este email já está cadastrado.' };
    }

    if (users.find((u) => (u.name || '').trim().toLowerCase() === normalizedName)) {
      console.debug('[register] tentativa duplicada (username)', { username: normalizedName });
      return { success: false, message: 'Este nome de usuário já está em uso.' };
    }

    const newUserId = Date.now();
    const secure = await hashPasswordForStorage(password);
    const newUser = {
      id: newUserId,
      name: displayName,
      email: normalizedEmail,
      avatar,
      streak: 1,
      lastLoginDate: today,
      ...secure,
    };

    users.push(newUser);
    writeUsersDb(users);
    
    const { password: _pw, passwordHash: _hash, passwordSalt: _salt, passwordAlgo: _algo, ...userWithoutPass } = newUser;
    localStorage.setItem('ecoplay_user', JSON.stringify(userWithoutPass));
    setUser(userWithoutPass);
    syncProfile(userWithoutPass);
    
    return { success: true };
  };

  const requestPasswordReset = async (email) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) return { success: false, message: 'Informe um email válido.' };

    if (isRemoteDbEnabled()) {
      try {
        const redirectTo = `${globalThis.location?.origin || ''}/login`;
        await resetPasswordForEmail({ email: normalizedEmail, redirectTo });
        return { success: true, method: 'remote' };
      } catch (e) {
        void e;
        return { success: false, message: 'Não foi possível solicitar a recuperação. Tente novamente.' };
      }
    }

    const users = readUsersDb().map((u) => ({ ...u, email: (u?.email || '').trim().toLowerCase() }));
    const exists = users.some((u) => u.email === normalizedEmail);
    const next = readResetRequests()
      .filter((r) => String(r?.email || '').trim().toLowerCase() !== normalizedEmail)
      .filter((r) => Number(r?.expiresAt || 0) > Date.now());

    if (!exists) {
      writeResetRequests(next);
      return { success: true, method: 'local' };
    }

    const code = randomResetCode();
    const salt = new Uint8Array(16);
    globalThis.crypto.getRandomValues(salt);
    const iterations = 60_000;
    const hash = await pbkdf2HashPassword({ password: code, saltBytes: salt, iterations });
    next.push({
      email: normalizedEmail,
      codeAlgo: `pbkdf2-sha256-${iterations}`,
      codeSalt: bytesToBase64(salt),
      codeHash: bytesToBase64(hash),
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    writeResetRequests(next);
    return { success: true, method: 'local', resetCode: code };
  };

  const confirmPasswordReset = async (email, code, newPassword) => {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedCode = String(code || '').trim();
    const nextPassword = String(newPassword || '');
    if (!normalizedEmail || !normalizedCode || !nextPassword) {
      return { success: false, message: 'Preencha todos os campos.' };
    }
    if (isRemoteDbEnabled()) {
      return { success: false, message: 'Finalize a recuperação pelo link recebido no email.' };
    }

    const now = Date.now();
    const requests = readResetRequests().filter((r) => Number(r?.expiresAt || 0) > now);
    const req = requests.find((r) => String(r?.email || '').trim().toLowerCase() === normalizedEmail);
    if (!req?.codeHash || !req?.codeSalt || !req?.codeAlgo) return { success: false, message: 'Código inválido ou expirado.' };

    const parts = String(req.codeAlgo).split('-');
    const iterations = Number(parts[2] || 0) || 60_000;
    const salt = base64ToBytes(req.codeSalt);
    const expected = base64ToBytes(req.codeHash);
    const actual = await pbkdf2HashPassword({ password: normalizedCode, saltBytes: salt, iterations });
    if (!constantTimeEqual(expected, actual)) return { success: false, message: 'Código inválido ou expirado.' };

    const users = readUsersDb().map((u) => ({ ...u, email: (u?.email || '').trim().toLowerCase() }));
    const userIndex = users.findIndex((u) => u.email === normalizedEmail);
    if (userIndex === -1) return { success: false, message: 'Código inválido ou expirado.' };

    const secure = await hashPasswordForStorage(nextPassword);
    const updatedUser = { ...users[userIndex], ...secure };
    delete updatedUser.password;
    users[userIndex] = updatedUser;
    writeUsersDb(users);

    const remaining = requests.filter((r) => String(r?.email || '').trim().toLowerCase() !== normalizedEmail);
    writeResetRequests(remaining);
    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    if (!isRemoteDbEnabled()) return { success: false, message: 'Recuperação indisponível.' };
    try {
      await updateRemotePassword({ password: newPassword });
      return { success: true };
    } catch (e) {
      void e;
      return { success: false, message: 'Não foi possível atualizar a senha.' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('ecoplay_user');
    if (isRemoteDbEnabled()) {
      try {
        await signOutRemote();
      } catch (e) {
        void e;
      }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, requestPasswordReset, confirmPasswordReset, updatePassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
