import { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { BADGES, checkNewBadges } from '../utils/gamification';
import { playCelebration } from '../utils/soundEffects';
import { isRemoteDbEnabled, getProgress, upsertProgress } from '../services/remoteDb';
import { dateOnlyNowLondrina, dateTimeIsoNowLondrina } from '../utils/dateTime';

const GameStateContext = createContext();

const uniqueAppend = (prev, ids) => {
  const next = new Set(prev || []);
  (ids || []).forEach((id) => next.add(id));
  return Array.from(next);
};

export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

export const GameStateProvider = ({ children }) => {
  const { user } = useAuth();

  // Estados
  const [score, setScore] = useState(0);
  const [ecoCredits, setEcoCredits] = useState(0); // Novo recurso
  // Safety to prevent NaN
  useEffect(() => {
    if (!Number.isFinite(ecoCredits)) setEcoCredits(0);
  }, [ecoCredits]);
  const [badges, setBadges] = useState([]);
  const [badgeUnlocks, setBadgeUnlocks] = useState({});
  const [stats, setStats] = useState({}); // Estatísticas detalhadas
  const [completedLevels, setCompletedLevels] = useState({});
  const [lastDailyXpDate, setLastDailyXpDate] = useState(null);
  const [dailyBonus, setDailyBonus] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [unclaimedRewards, setUnclaimedRewards] = useState([]);

  // --- Idle Game Logic ---
  const [energy, setEnergy] = useState(0);
  const [modules, setModules] = useState({}); // { solar: 1, wind: 2, ... }
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());

  const badgeUnlocksRef = useRef({});
  const presenceRef = useRef({ lastTickMs: null });
  const prevScoreRef = useRef(0);
  const saveTimeoutRef = useRef(null);

  const BASE_THRESHOLDS = [500, 1500, 2200, 3000, 3800, 5000];

  const prepareProgressData = useCallback((raw, currentUser) => {
    const data = {
      score: 0,
      ecoCredits: 0, // Default
      badges: [],
      badgeUnlocks: {},
      stats: {},
      completedLevels: {},
      lastDailyXpDate: null,
      unclaimedRewards: [],
      ...(raw || {})
    };

    if (!data.badgeUnlocks) {
      const now = dateTimeIsoNowLondrina();
      data.badgeUnlocks = Object.fromEntries((data.badges || []).map((id) => [id, now]));
    }

    if (!data.stats) {
      data.stats = {
        xp: data.score || 0,
        streak: currentUser?.streak || 0,
        logins: 1,
        sudoku_wins: data.completedLevels?.sudoku ? 1 : 0,
        quiz_completions: data.completedLevels?.quiz ? 1 : 0,
        memory_wins: 0,
        dashboard_visits: 0,
        timeSpentSeconds: 0
      };
    }

    data.stats.streak = currentUser?.streak || data.stats.streak;
    data.stats.timeSpentSeconds = Number.isFinite(Number(data.stats.timeSpentSeconds)) ? Number(data.stats.timeSpentSeconds) : 0;

    const today = dateOnlyNowLondrina();
    let nextDailyBonus = null;
    if (data.lastDailyXpDate !== today) {
      const streakBonus = currentUser?.streak ? currentUser.streak * 10 : 0;
      const totalBonus = 50 + streakBonus;

      data.score = (data.score || 0) + totalBonus;
      data.stats.xp = data.score;
      data.stats.logins = (data.stats.logins || 0) + 1;
      data.lastDailyXpDate = today;

      nextDailyBonus = { amount: totalBonus, streak: currentUser?.streak || 1 };
    }

    data.badges = uniqueAppend([], data.badges || []);
    data.unclaimedRewards = uniqueAppend([], data.unclaimedRewards || []);

    // Extract Idle Data from Stats (Remote Persistence)
    const savedEnergy = Number(data.stats?.saved_energy);
    const savedCredits = Number(data.stats?.saved_credits);
    const savedModules = data.stats?.saved_modules;

    return {
      data,
      dailyBonus: nextDailyBonus,
      idle: {
        energy: Number.isFinite(savedEnergy) ? savedEnergy : null,
        credits: Number.isFinite(savedCredits) ? savedCredits : null,
        modules: savedModules || null
      }
    };
  }, []);

  const applyProgressState = useCallback(({ data, dailyBonus: nextDailyBonus, idle }) => {
    setScore(data.score || 0);
    setEcoCredits(data.ecoCredits || 0);
    setBadges(uniqueAppend([], data.badges || []));
    setBadgeUnlocks(data.badgeUnlocks || {});
    setStats(data.stats || {});
    setCompletedLevels(data.completedLevels || {});
    setLastDailyXpDate(data.lastDailyXpDate);
    setUnclaimedRewards(uniqueAppend([], data.unclaimedRewards || []));
    setDailyBonus(nextDailyBonus);

    // Apply Idle Data if present (Remote priority, but we merge with local safely in standard load flow)
    // Note: LocalStorage specific load usually runs first. If remote has data, it overwrites.
    if (idle?.energy !== null && idle?.energy !== undefined) setEnergy(idle.energy);
    if (idle?.credits !== null && idle?.credits !== undefined) setEcoCredits(idle.credits);
    if (idle?.modules) setModules(idle.modules);
  }, []);

  // Configuration: Base production per level
  const MODULE_STATS = {
    solar: { baseProd: 10, costFactor: 1.5, baseCost: 100 },
    wind: { baseProd: 25, costFactor: 1.6, baseCost: 500 },
    hydro: { baseProd: 60, costFactor: 1.7, baseCost: 2000 },
    garden: { baseProd: 5, costFactor: 1.4, baseCost: 50 },
    biomass: { baseProd: 40, costFactor: 1.6, baseCost: 1000 },
    lab: { baseProd: 100, costFactor: 2.0, baseCost: 5000 },
    geothermal: { baseProd: 150, costFactor: 1.8, baseCost: 8000 },
    storage: { baseProd: 0, costFactor: 1.5, baseCost: 3000 } // Storage upgrades capacity (todo)
  };

  const calculateProduction = useCallback(() => {
    return Object.entries(modules).reduce((total, [id, level]) => {
      const stats = MODULE_STATS[id];
      if (!stats) return total;
      return total + (stats.baseProd * level);
    }, 0);
  }, [modules]);

  const upgradeModule = useCallback((moduleId) => {
    const level = modules[moduleId] || 0;
    // Auto-unlock level 1 if 0? No, assume 0 means locked. 
    // Wait, modules need to be unlocked via XP first (in dashboard).
    // If level is 0, cost is baseCost.
    const stats = MODULE_STATS[moduleId];
    if (!stats) return;

    const cost = Math.floor(stats.baseCost * Math.pow(stats.costFactor, level));

    if (ecoCredits >= cost) {
      setEcoCredits(prev => prev - cost);
      setModules(prev => ({
        ...prev,
        [moduleId]: level + 1
      }));
      playCelebration();
    }
  }, [modules, MODULE_STATS, ecoCredits]);

  // Load Idle Data
  useEffect(() => {
    if (user) {
      const savedModules = localStorage.getItem(`ecoplay_modules_${user.id}`);
      const savedEnergy = localStorage.getItem(`ecoplay_energy_${user.id}`);
      const savedCredits = localStorage.getItem(`ecoplay_credits_${user.id}`);
      const savedTime = localStorage.getItem(`ecoplay_last_time_${user.id}`);

      if (savedModules) {
        try {
          setModules(JSON.parse(savedModules));
        } catch {
          setModules({});
        }
      }
      if (savedEnergy) setEnergy(Number(savedEnergy) || 0);
      if (savedCredits) {
        const parsed = Number(savedCredits);
        setEcoCredits(Number.isFinite(parsed) ? parsed : 0);
      }

      // Offline Progress
      if (savedTime && savedModules) {
        const now = Date.now();
        const diffSeconds = Math.floor((now - Number(savedTime)) / 1000);
        if (diffSeconds > 0) {
          let currentModules = {};
          try {
            currentModules = JSON.parse(savedModules);
          } catch {
            currentModules = {};
          }
          const prodPerSec = Object.entries(currentModules).reduce((total, [id, level]) => {
            const stats = MODULE_STATS[id];
            return total + (stats ? stats.baseProd * level : 0);
          }, 0);

          if (prodPerSec > 0) {
            const offlineEarnings = prodPerSec * diffSeconds;
            // 10% da energia gerada vira créditos offline
            const offlineCredits = Math.floor(offlineEarnings * 0.1);

            if (Number.isFinite(offlineEarnings)) setEnergy(prev => (Number.isFinite(prev) ? prev : 0) + offlineEarnings);
            if (Number.isFinite(offlineCredits)) setEcoCredits(prev => (Number.isFinite(prev) ? prev : 0) + offlineCredits);

            console.log(`[Idle] Offline for ${diffSeconds}s. Earned ${offlineEarnings} energy and ${offlineCredits} credits.`);
            // Optionally show toast here
          }
        }
      }
    }
  }, [user]);

  // Save Idle Data
  useEffect(() => {
    if (user) {
      localStorage.setItem(`ecoplay_modules_${user.id}`, JSON.stringify(modules));
      localStorage.setItem(`ecoplay_energy_${user.id}`, String(energy));
      localStorage.setItem(`ecoplay_credits_${user.id}`, String(ecoCredits));
      localStorage.setItem(`ecoplay_last_time_${user.id}`, String(Date.now()));
    }
  }, [modules, energy, ecoCredits, user]);

  // Production Loop (1s Tick)
  useEffect(() => {
    const interval = setInterval(() => {
      const prod = calculateProduction();
      if (prod > 0) {
        setEnergy(prev => prev + prod);
        // Ganho de créditos passivo (1 crédito para cada 20 de energia gerada, mínimo 1 se prod > 10)
        if (prod >= 10) {
          setEcoCredits(prev => prev + Math.max(1, Math.floor(prod / 20))); // Ganha créditos com base na produção
        }
      }
      setLastSaveTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculateProduction]);

  useEffect(() => {
    badgeUnlocksRef.current = badgeUnlocks || {};
  }, [badgeUnlocks]);

  // Efeito para CARREGAR dados
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) {
        setScore(0);
        setBadges([]);
        setBadgeUnlocks({});
        setStats({});
        setCompletedLevels({});
        setLastDailyXpDate(null);
        setDailyBonus(null);
        setUnclaimedRewards([]);
        return;
      }

      const userProgress = localStorage.getItem(`ecoplay_progress_${user.id}`);
      let localRaw = null;
      try {
        localRaw = userProgress ? JSON.parse(userProgress) : null;
      } catch (e) {
        console.warn('Corrupt local progress found, resetting local cache.', e);
        localRaw = null;
      }
      const localPrepared = prepareProgressData(localRaw, user);
      applyProgressState(localPrepared);

      if (!isRemoteDbEnabled()) return;

      try {
        const remoteRaw = await getProgress(user.id);
        if (cancelled || !remoteRaw) return;
        const remotePrepared = prepareProgressData(remoteRaw, user);
        applyProgressState(remotePrepared);
        localStorage.setItem(`ecoplay_progress_${user.id}`, JSON.stringify(remotePrepared.data));
      } catch {
        return;
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, prepareProgressData, applyProgressState]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const userId = user.id;

    const persistDeltaSeconds = (deltaSeconds) => {
      const inc = Math.max(0, Math.floor(Number(deltaSeconds) || 0));
      if (!inc) return;

      setStats((prev) => ({
        ...prev,
        timeSpentSeconds: (Number(prev.timeSpentSeconds) || 0) + inc
      }));

      try {
        const key = `ecoplay_progress_${userId}`;
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : {};
        const nextStats = { ...(parsed.stats || {}) };
        nextStats.timeSpentSeconds = (Number(nextStats.timeSpentSeconds) || 0) + inc;
        localStorage.setItem(key, JSON.stringify({ ...(parsed || {}), stats: nextStats }));
      } catch {
        return;
      }
    };

    const tick = () => {
      const now = Date.now();
      const last = presenceRef.current.lastTickMs ?? now;
      presenceRef.current.lastTickMs = now;

      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      const deltaSeconds = Math.floor((now - last) / 1000);
      if (deltaSeconds <= 0) return;
      persistDeltaSeconds(deltaSeconds);
    };

    presenceRef.current.lastTickMs = Date.now();

    const intervalId = setInterval(tick, 60_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') tick();
      else presenceRef.current.lastTickMs = Date.now();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user?.id]);

  // Efeito para SALVAR dados
  useEffect(() => {
    if (user) {
      const progressData = {
        score,
        ecoCredits,
        badges,
        badgeUnlocks,
        stats: {
          ...stats,
          saved_energy: energy,
          saved_credits: ecoCredits,
          saved_modules: modules
        },
        completedLevels,
        lastDailyXpDate,
        unclaimedRewards
      };
      localStorage.setItem(`ecoplay_progress_${user.id}`, JSON.stringify(progressData));

      // Debounce remote save to prevent spamming the server on every tick (energy update)
      if (isRemoteDbEnabled() && user?.id) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(() => {
          upsertProgress(user.id, progressData).catch(err => {
            console.warn('Background Save Failed (Debounced):', err);
          });
        }, 5000); // 5 seconds debounce
      }
    }
  }, [score, ecoCredits, badges, badgeUnlocks, stats, completedLevels, lastDailyXpDate, unclaimedRewards, user, energy, modules]);

  // Efeito para VERIFICAR CONQUISTAS
  useEffect(() => {
    if (!user) return;

    // Sincronizar score com stats.xp para garantir consistência
    const currentStats = {
      ...stats,
      xp: score,
      streak: user.streak || stats.streak
    };

    const newlyUnlocked = checkNewBadges(currentStats, badges);

    if (newlyUnlocked.length > 0) {
      const newBadgeIds = newlyUnlocked.map(b => b.id);
      const now = dateTimeIsoNowLondrina();
      setBadges((prev) => uniqueAppend(prev, newBadgeIds));
      setUnclaimedRewards((prev) => uniqueAppend(prev, newBadgeIds));
      setBadgeUnlocks((prev) => {
        const next = { ...(prev || {}) };
        newBadgeIds.forEach((id) => {
          if (!next[id]) next[id] = now;
        });
        return next;
      });
    }
  }, [score, stats, user, badges]);

  // Efeito para detectar desbloqueio de itens da Base de Operações via Score
  useEffect(() => {
    if (!user) return;

    const prev = prevScoreRef.current;
    const current = score;

    const crossedThreshold = BASE_THRESHOLDS.some(t => prev < t && current >= t);

    if (prev !== 0 && crossedThreshold) {
      playCelebration();
    }

    prevScoreRef.current = score;
  }, [score, user]);

  // Efeito para processar fila de recompensas não reclamadas
  useEffect(() => {
    if (unclaimedRewards.length > 0 && !newBadge) {
      const badgeId = unclaimedRewards[0];
      const badgeDef = BADGES.find(b => b.id === badgeId);
      if (badgeDef) {
        setNewBadge(badgeDef);
      } else {
        // Se o badge não existe (erro de dados), remove da fila
        setUnclaimedRewards(prev => prev.filter(id => id !== badgeId));
      }
    }
  }, [unclaimedRewards, newBadge]);

  const addScore = useCallback((points) => {
    setScore(prev => prev + points);
    setStats(prev => ({
      ...prev,
      xp: (prev.xp || 0) + points
    }));
  }, []);

  const addCredits = useCallback((amount) => {
    setEcoCredits(prev => prev + amount);
  }, []);

  const spendCredits = useCallback((amount) => {
    let success = false;
    setEcoCredits(prev => {
      if (prev >= amount) {
        success = true;
        return prev - amount;
      }
      return prev;
    });
    return success;
  }, []);

  const updateStat = useCallback((key, delta = 1) => {
    setStats(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + delta
    }));
  }, []);

  // Mantido para compatibilidade, mas idealmente usar updateStat
  const completeLevel = useCallback((gameId, level) => {
    setCompletedLevels(prev => ({
      ...prev,
      [gameId]: Math.max(prev[gameId] || 0, level)
    }));

    // Atualizar stats específicos baseados no jogo
    if (gameId === 'sudoku') updateStat('sudoku_wins', 1);
    if (gameId === 'quiz') updateStat('quiz_completions', 1);
    if (gameId === 'memory') updateStat('memory_wins', 1);
    if (gameId === 'word-search') updateStat('word_search_wins', 1);
    if (gameId === 'hangman') updateStat('hangman_wins', 1);
    if (gameId === 'eco-guardian') updateStat('eco_guardian_wins', 1);
    if (gameId === 'eco-snake') updateStat('eco_snake_wins', 1);
    if (gameId === 'eco-swipe') updateStat('eco_swipe_wins', 1);
    if (gameId === 'eco-platformer') updateStat('eco_platformer_wins', 1);
  }, [updateStat]);

  const unlockBadge = useCallback((badgeId) => {
    if (badgeUnlocksRef.current?.[badgeId]) return false;

    const now = dateTimeIsoNowLondrina();
    badgeUnlocksRef.current = { ...(badgeUnlocksRef.current || {}), [badgeId]: now };
    setBadges((prev) => uniqueAppend(prev, [badgeId]));
    setUnclaimedRewards((prev) => uniqueAppend(prev, [badgeId]));
    setBadgeUnlocks((prev) => (prev?.[badgeId] ? prev : ({ ...(prev || {}), [badgeId]: now })));
    return true;
  }, []);

  const claimReward = useCallback(() => {
    if (!newBadge) return;

    setUnclaimedRewards((prev) => {
      if (!prev.includes(newBadge.id)) return prev;
      addScore(newBadge.reward || 50);
      return prev.filter((id) => id !== newBadge.id);
    });
    setNewBadge(null);
  }, [newBadge, addScore]);

  const convertEnergyToXp = useCallback((amount) => {
    if (energy < amount) return false;
    const xp = Math.floor(amount / 100);
    if (xp <= 0) return false;

    setEnergy(prev => prev - amount);
    addScore(xp);
    playCelebration();
    return true;
  }, [energy, addScore]);

  return (
    <GameStateContext.Provider value={{
      score,
      addScore,
      ecoCredits,
      addCredits,
      spendCredits,
      badges,
      badgeUnlocks,
      stats,
      updateStat,
      unlockBadge,
      completedLevels,
      completeLevel,
      dailyBonus,
      setDailyBonus,
      newBadge,
      setNewBadge,
      claimReward,
      // Idle Props
      energy,
      modules,
      upgradeModule,
      calculateProduction,
      MODULE_STATS,
      setModules, // Allow unlocking from dashboard
      convertEnergyToXp
    }}>
      {children}
    </GameStateContext.Provider>
  );
};
