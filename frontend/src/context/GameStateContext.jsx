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
  const [badges, setBadges] = useState([]);
  const [badgeUnlocks, setBadgeUnlocks] = useState({});
  const [stats, setStats] = useState({}); // Estatísticas detalhadas
  const [completedLevels, setCompletedLevels] = useState({});
  const [lastDailyXpDate, setLastDailyXpDate] = useState(null);
  const [dailyBonus, setDailyBonus] = useState(null);
  const [newBadge, setNewBadge] = useState(null);
  const [unclaimedRewards, setUnclaimedRewards] = useState([]);
  const badgeUnlocksRef = useRef({});
  const presenceRef = useRef({ lastTickMs: null });
  const prevScoreRef = useRef(0);

  const BASE_THRESHOLDS = [500, 1500, 2200, 3000, 3800, 5000];

  const prepareProgressData = useCallback((raw, currentUser) => {
    const data = {
      score: 0,
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

    return { data, dailyBonus: nextDailyBonus };
  }, []);

  const applyProgressState = useCallback(({ data, dailyBonus: nextDailyBonus }) => {
    setScore(data.score || 0);
    setBadges(uniqueAppend([], data.badges || []));
    setBadgeUnlocks(data.badgeUnlocks || {});
    setStats(data.stats || {});
    setCompletedLevels(data.completedLevels || {});
    setLastDailyXpDate(data.lastDailyXpDate);
    setUnclaimedRewards(uniqueAppend([], data.unclaimedRewards || []));
    setDailyBonus(nextDailyBonus);
  }, []);

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
      const localRaw = userProgress ? JSON.parse(userProgress) : null;
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
        badges,
        badgeUnlocks,
        stats,
        completedLevels,
        lastDailyXpDate,
        unclaimedRewards
      };
      localStorage.setItem(`ecoplay_progress_${user.id}`, JSON.stringify(progressData));
      if (isRemoteDbEnabled()) {
        upsertProgress(user.id, progressData).catch(() => {});
      }
    }
  }, [score, badges, badgeUnlocks, stats, completedLevels, lastDailyXpDate, unclaimedRewards, user]);

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

    // Se é a primeira carga (prev === 0 e current > 0), não toca para evitar spam no login
    // A menos que o usuário tenha começado do zero nessa sessão.
    // Para simplificar: assumimos que se o prevScoreRef foi inicializado com 0, 
    // e o score atual é carregado do disco, não queremos tocar.
    // Mas o prevScoreRef vai ser atualizado a cada render.
    
    // Solução mais robusta: Só tocar se a diferença for positiva e pequena (ganho normal de jogo)
    // OU confiar que o score incrementa gradualmente.
    
    // Melhor abordagem: Verificar se cruzou algum limiar
    const crossedThreshold = BASE_THRESHOLDS.some(t => prev < t && current >= t);

    // Evitar tocar na inicialização (quando prev é 0 e current já é alto)
    // Podemos usar um flag de inicialização ou verificar se a diferença não é gigante (ex: carga de dados)
    // Mas o 'addScore' atualiza o score incrementalmente? Não, o load carrega tudo de uma vez.
    
    // Se prev for 0, pode ser a inicialização. 
    // Vamos assumir que se prev != current e prev != 0, é uma atualização em tempo real.
    // Se prev == 0, só toca se current for pequeno (novo usuário jogando) ou se tivermos certeza que não é load.
    
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

  const addScore = (points) => {
    setScore(prev => prev + points);
    setStats(prev => ({
      ...prev,
      xp: (prev.xp || 0) + points
    }));
  };

  const updateStat = (key, delta = 1) => {
    setStats(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + delta
    }));
  };

  // Mantido para compatibilidade, mas idealmente usar updateStat
  const completeLevel = (gameId, level) => {
    setCompletedLevels(prev => ({
      ...prev,
      [gameId]: Math.max(prev[gameId] || 0, level)
    }));
    
    // Atualizar stats específicos baseados no jogo
    if (gameId === 'sudoku') updateStat('sudoku_wins', 1);
    if (gameId === 'quiz') updateStat('quiz_completions', 1);
    if (gameId === 'memory') updateStat('memory_wins', 1);
  };

  const unlockBadge = (badgeId) => {
    if (badgeUnlocksRef.current?.[badgeId]) return false;

    const now = dateTimeIsoNowLondrina();
    badgeUnlocksRef.current = { ...(badgeUnlocksRef.current || {}), [badgeId]: now };
    setBadges((prev) => uniqueAppend(prev, [badgeId]));
    setUnclaimedRewards((prev) => uniqueAppend(prev, [badgeId]));
    setBadgeUnlocks((prev) => (prev?.[badgeId] ? prev : ({ ...(prev || {}), [badgeId]: now })));
    return true;
  };

  const claimReward = () => {
    if (!newBadge) return;

    setUnclaimedRewards((prev) => {
      if (!prev.includes(newBadge.id)) return prev;
      addScore(newBadge.reward || 50);
      return prev.filter((id) => id !== newBadge.id);
    });
    setNewBadge(null);
  };

  return (
    <GameStateContext.Provider value={{ 
      score, 
      addScore, 
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
      claimReward
    }}>
      {children}
    </GameStateContext.Provider>
  );
};
