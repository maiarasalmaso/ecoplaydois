import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, TimerReset, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGameState } from '../../context/GameStateContext';
import { PASSA_REPASSA_QUESTIONS } from '../../utils/quizData';
import { getSupabaseRealtimeClient } from '../../services/remoteDb';
import api from '../../services/api';
import { playClick, playError, playSuccess, playWin } from '../../utils/soundEffects';
import {
  hostResyncResponse,
  selectDeterministicOpponent,
  shouldAcceptIncomingState,
  shouldRequestMatchResync,
  updateRttEstimate,
} from '../../utils/passaRepassaMultiplayer';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const normalizeText = (value) => {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return raw
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const countWords = (value) => {
  const parts = normalizeText(value).split(' ').filter(Boolean);
  return parts.length;
};

const isShortAnswer = (value) => countWords(value) <= 3;

const xfnv1a = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const seededShuffle = (items, seedStr) => {
  const rng = mulberry32(xfnv1a(seedStr));
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
};

const makeMatchId = (a, b) => {
  const s = [String(a), String(b)].sort().join('-');
  return `pr-${s}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

const getRankStore = () => {
  try {
    const raw = localStorage.getItem('ecoplay_passa_rank_v1');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeRankStore = (rows) => {
  try {
    localStorage.setItem('ecoplay_passa_rank_v1', JSON.stringify(rows));
  } catch {
    return;
  }
};

const upsertRank = ({ userId, name, didWin }) => {
  const prev = getRankStore();
  const idx = prev.findIndex((r) => r?.userId === userId);
  const base = idx >= 0 ? prev[idx] : { userId, name, matches: 0, wins: 0, rating: 1000 };
  const next = {
    ...base,
    name: name || base.name,
    matches: (base.matches || 0) + 1,
    wins: (base.wins || 0) + (didWin ? 1 : 0),
    rating: clamp((base.rating || 1000) + (didWin ? 25 : -10), 500, 2000),
  };
  const out = idx >= 0 ? prev.map((r, i) => (i === idx ? next : r)) : [...prev, next];
  out.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  writeRankStore(out.slice(0, 50));
  return out.slice(0, 10);
};

const QUESTIONS_BY_ID = Object.fromEntries(
  PASSA_REPASSA_QUESTIONS.map((q) => [
    q.id,
    {
      ...q,
      normalizedAnswers: (q.answers || []).map((a) => normalizeText(a)).filter(Boolean),
    },
  ])
);

const QUESTION_CANONICAL = Object.fromEntries(PASSA_REPASSA_QUESTIONS.map((q) => [q.id, (q.answers || [])[0] || '']));

const CANONICAL_POOL = PASSA_REPASSA_QUESTIONS.map((q) => ({
  id: q.id,
  category: q.category,
  text: (q.answers || [])[0] || '',
  norm: normalizeText((q.answers || [])[0] || ''),
})).filter((r) => r.text && r.norm);

const CANONICAL_BY_CATEGORY = CANONICAL_POOL.reduce((acc, row) => {
  const key = row.category || 'Geral';
  const prev = acc[key] || [];
  acc[key] = [...prev, row];
  return acc;
}, {});

const pickQuestionIds = (seedStr, count) => {
  const ids = PASSA_REPASSA_QUESTIONS.map((q) => q.id);
  return seededShuffle(ids, seedStr).slice(0, clamp(count, 1, ids.length));
};

const answersMatch = (input, question) => {
  const v = normalizeText(input);
  if (!v) return false;
  return (question.normalizedAnswers || []).some((a) => a === v);
};

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const uniqueByNorm = (rows) => {
  const seen = new Set();
  const out = [];
  for (const r of rows || []) {
    const key = normalizeText(r);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
};

const pickDistractors = ({ correctNorm, category, seedStr, count }) => {
  const categoryPool = (CANONICAL_BY_CATEGORY[category] || []).filter((r) => r.norm !== correctNorm);
  const globalPool = CANONICAL_POOL.filter((r) => r.norm !== correctNorm);

  const pickFrom = (pool) => seededShuffle(pool.map((r) => r.text), seedStr);

  const picked = [];
  const fromCategory = pickFrom(categoryPool);
  for (const t of fromCategory) {
    if (picked.length >= count) break;
    picked.push(t);
  }
  if (picked.length < count) {
    const fromGlobal = pickFrom(globalPool);
    for (const t of fromGlobal) {
      if (picked.length >= count) break;
      picked.push(t);
    }
  }
  return uniqueByNorm(picked).slice(0, count);
};

const buildOptionsForPlayers = ({ matchId, questionId, players }) => {
  const q = QUESTIONS_BY_ID[questionId];
  if (!q) return {};
  const ids = Object.keys(players || {}).map(String).sort();
  if (ids.length < 2) return {};
  const correct = QUESTION_CANONICAL[questionId] || (q.answers || [])[0] || '';
  const correctNorm = normalizeText(correct);
  if (!correctNorm) return {};

  const buildForUser = (userId, suffix = '') => {
    const baseSeed = `${matchId}|${questionId}|${userId}|v1${suffix}`;
    const distractors = pickDistractors({ correctNorm, category: q.category, seedStr: `${baseSeed}|d`, count: 3 });
    const raw = uniqueByNorm([correct, ...distractors]);
    const filled =
      raw.length >= 4
        ? raw.slice(0, 4)
        : uniqueByNorm([
          ...raw,
          ...pickDistractors({ correctNorm, category: 'Geral', seedStr: `${baseSeed}|fill`, count: 4 }),
        ]).slice(0, 4);
    return seededShuffle(filled, `${baseSeed}|s`).slice(0, 4);
  };

  const a = ids[0];
  const b = ids[1];
  const optA = buildForUser(a);
  let optB = buildForUser(b);
  const sig = (arr) => uniqueByNorm(arr).map((t) => normalizeText(t)).sort().join('|');
  if (sig(optA) === sig(optB)) {
    optB = buildForUser(b, '|alt');
  }

  return { [a]: optA, [b]: optB };
};

const LOBBY_TTL_MS = 8000;
const LOBBY_PING_MS = 2000;
const ROUND_SECONDS = 60;
const ROUND_TOTAL = 10;

const BOT_ID = 'bot';
const BOT_MODEL_KEY = 'ecoplay_passa_bot_model_v1';

const readBotModel = () => {
  try {
    const raw = localStorage.getItem(BOT_MODEL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : { byCategory: {} };
  } catch {
    return { byCategory: {} };
  }
};

const writeBotModel = (model) => {
  try {
    localStorage.setItem(BOT_MODEL_KEY, JSON.stringify(model));
  } catch {
    return;
  }
};

const getBotCategorySkill = (model, category) => {
  const key = category || 'Geral';
  const v = model?.byCategory?.[key];
  return typeof v === 'number' ? clamp(v, -0.35, 0.45) : 0;
};

const setBotCategorySkill = (model, category, nextSkill) => {
  const key = category || 'Geral';
  const prev = model && typeof model === 'object' ? model : { byCategory: {} };
  const byCategory = prev.byCategory && typeof prev.byCategory === 'object' ? prev.byCategory : {};
  return { ...prev, byCategory: { ...byCategory, [key]: clamp(nextSkill, -0.35, 0.45) } };
};

const EcoPassaRepassa = () => {
  const { user } = useAuth();
  const { addScore, updateStat } = useGameState();

  const supabase = getSupabaseRealtimeClient();
  const baseTransport = supabase ? 'supabase' : 'local';

  // Add warning for missing Supabase configuration
  useEffect(() => {
    if (baseTransport === 'local' && !supabase) {
      console.warn('Supabase not configured. Multiplayer features will use local broadcast channels. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable online multiplayer.');
    }
  }, [baseTransport, supabase]);

  const [stage, setStage] = useState('queue');
  const [error, setError] = useState('');
  const [opponent, setOpponent] = useState(null);
  const [matchId, setMatchId] = useState('');
  const settingUpBotMatchRef = useRef(false);
  const transport = useMemo(
    () => (String(opponent?.userId || '') === BOT_ID ? 'local' : baseTransport),
    [baseTransport, opponent?.userId]
  );
  const [matchState, setMatchState] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [rankTop, setRankTop] = useState(() => getRankStore().slice(0, 10));
  const [autoRematch, setAutoRematch] = useState(true);
  const [queueSinceMs, setQueueSinceMs] = useState(() => Date.now());

  const botModelRef = useRef(readBotModel());
  const botTimeoutRef = useRef(null);
  const botTurnKeyRef = useRef('');

  const lobbyRef = useRef(null);
  const matchRef = useRef(null);
  const localLobbyRef = useRef(null);
  const localMatchRef = useRef(null);
  const peersRef = useRef(new Map());
  const selfId = user?.id;
  const meIdStr = String(selfId || '');
  const lastStateAtRef = useRef(0);
  const lastProposalAtRef = useRef(0);
  const lastRevRef = useRef(0);
  const lastPingRttRef = useRef(null);
  const [matchRttMs, setMatchRttMs] = useState(null);

  const processedMatchIdRef = useRef(null);

  const cleanupLobby = useCallback(() => {
    if (lobbyRef.current) {
      lobbyRef.current.unsubscribe();
      lobbyRef.current = null;
    }
    if (localLobbyRef.current) {
      localLobbyRef.current.close();
      localLobbyRef.current = null;
    }
    peersRef.current = new Map();
  }, []);

  const cleanupMatch = useCallback(() => {
    if (matchRef.current) {
      matchRef.current.unsubscribe();
      matchRef.current = null;
    }
    if (localMatchRef.current) {
      localMatchRef.current.close();
      localMatchRef.current = null;
    }
  }, []);

  const resetToQueue = useCallback(() => {
    cleanupMatch();
    setOpponent(null);
    setMatchId('');
    setMatchState(null);
    lastRevRef.current = 0;
    lastPingRttRef.current = null;
    setMatchRttMs(null);
    setError('');
    setStage('queue');
  }, [cleanupMatch]);

  const startBotMatch = useCallback(() => {
    if (!selfId) return;
    settingUpBotMatchRef.current = true;
    cleanupLobby();
    cleanupMatch();
    const id = `pr-bot-${String(selfId)}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const botName = 'Máquina';
    const players = {
      [String(selfId)]: { userId: String(selfId), name: user?.name || 'Você' },
      [BOT_ID]: { userId: BOT_ID, name: botName },
    };
    const qIds = pickQuestionIds(id, ROUND_TOTAL);
    const startMs = Date.now();
    const state = {
      matchId: id,
      gameId: 1,
      phase: 'question',
      roundIndex: 0,
      roundTotal: ROUND_TOTAL,
      players,
      scores: { [String(selfId)]: 0, [BOT_ID]: 0 },
      questionIds: qIds,
      questionId: qIds[0],
      turnUserId: String(selfId),
      passedByUserId: null,
      repassaAvailable: false,
      questionStartMs: startMs,
    };
    setError('');
    setOpponent({ userId: BOT_ID, name: botName });
    setMatchId(id);
    setMatchState(state);
    setStage('playing');
    // Reset the flag after bot match setup is complete
    settingUpBotMatchRef.current = false;
  }, [cleanupLobby, cleanupMatch, selfId, user?.name]);

  useEffect(() => {
    if (!selfId) return undefined;
    const id = setInterval(() => setNowMs(Date.now()), 120);
    return () => clearInterval(id);
  }, [selfId]);

  useEffect(() => {
    if (stage === 'queue') setQueueSinceMs(Date.now());
  }, [stage]);

  const sendLobby = useCallback(
    (event, payload) => {
      if (!selfId) return;
      if (transport === 'supabase') {
        try {
          if (!lobbyRef.current) {
            console.warn('Lobby channel not ready, skipping broadcast');
            return;
          }
          lobbyRef.current.send({ type: 'broadcast', event, payload });
        } catch (error) {
          console.error('Failed to send lobby broadcast:', error);
        }
        return;
      }
      localLobbyRef.current?.postMessage({ scope: 'lobby', event, payload });
    },
    [selfId, transport]
  );

  const sendMatch = useCallback(
    (event, payload) => {
      if (!selfId || !matchId) return;
      if (transport === 'supabase') {
        try {
          if (!matchRef.current) {
            console.warn('Match channel not ready, skipping broadcast');
            return;
          }
          matchRef.current.send({ type: 'broadcast', event, payload });
        } catch (error) {
          console.error('Failed to send match broadcast:', error);
        }
        return;
      }
      localMatchRef.current?.postMessage({ scope: 'match', matchId, event, payload });
    },
    [selfId, transport, matchId]
  );

  const publishState = useCallback(
    (next) => {
      if (!next?.matchId) return;
      const rev = Math.max(Number(next.rev || 0), Number(lastRevRef.current || 0) + 1);
      const withMeta = { ...next, rev, updatedAtMs: Date.now() };
      lastRevRef.current = rev;
      sendMatch('state', withMeta);
      setMatchState(withMeta);
      lastStateAtRef.current = Date.now();
      setStage(withMeta.phase === 'final' ? 'final' : 'playing');
    },
    [sendMatch]
  );

  const computePeers = useCallback(() => {
    const now = Date.now();
    const out = [];
    for (const [id, row] of peersRef.current.entries()) {
      if (!row) continue;
      if (id === selfId) continue;
      if (now - (row.lastSeenMs || 0) > LOBBY_TTL_MS) continue;
      if (row.status !== 'queue') continue;
      out.push(row);
    }
    out.sort((a, b) => String(a.userId || '').localeCompare(String(b.userId || '')));
    return out;
  }, [selfId]);

  const maybeHostPropose = useCallback(() => {
    if (!selfId) return;
    if (stage !== 'queue') return;
    if (Date.now() - (lastProposalAtRef.current || 0) < 650) return;
    const peers = computePeers();
    const selected = selectDeterministicOpponent({ selfId: String(selfId), selfName: user?.name || 'Você', peers });
    if (!selected?.opponentId) return;
    if (!selected.isHost) return;
    const a = String(selfId);
    const b = String(selected.opponentId);
    const other = peers.find((p) => String(p.userId) === b);
    if (!other) return;
    const id = makeMatchId(a, b);
    lastProposalAtRef.current = Date.now();
    sendLobby('match-proposal', { matchId: id, a, b, createdAt: Date.now() });
    setMatchId(id);
    setOpponent({ userId: b, name: other.name });
    setStage('matched');
  }, [computePeers, sendLobby, selfId, stage, user?.name]);

  useEffect(() => {
    if (!selfId || !user?.name) return undefined;
    // Don't setup lobby if we're setting up a bot match
    if (settingUpBotMatchRef.current) return undefined;
    cleanupLobby();

    if (transport === 'supabase') {
      if (!supabase) {
        console.warn('Supabase client not available, falling back to local transport');
        return undefined;
      }

      try {
        const channel = supabase.channel('ecoplay:passa:lobby', {
          config: { presence: { key: String(selfId) }, broadcast: { self: true } },
        });
        lobbyRef.current = channel;

        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const nextMap = new Map();
          for (const [key, arr] of Object.entries(state || {})) {
            const latest = Array.isArray(arr) ? arr[arr.length - 1] : null;
            if (!latest) continue;
            nextMap.set(String(key), {
              userId: latest.userId,
              name: latest.name,
              status: latest.status,
              lastSeenMs: Date.now(),
            });
          }
          peersRef.current = nextMap;
          maybeHostPropose();
        });

        channel.on('broadcast', { event: 'presence-ping' }, ({ payload }) => {
          if (!payload?.userId) return;
          peersRef.current.set(String(payload.userId), { ...payload, lastSeenMs: Date.now() });
          maybeHostPropose();
        });

        channel.on('broadcast', { event: 'match-proposal' }, ({ payload }) => {
          const p = payload || {};
          if (!p.matchId || !p.a || !p.b) return;
          if (String(p.a) !== String(selfId) && String(p.b) !== String(selfId)) return;
          if (stage !== 'queue') return;
          const otherId = String(p.a) === String(selfId) ? p.b : p.a;
          const otherRow = peersRef.current.get(String(otherId));
          setMatchId(p.matchId);
          setOpponent({ userId: otherId, name: otherRow?.name || 'Jogador' });
          setStage('matched');
        });

        channel.subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') return;
          try {
            if (channel && typeof channel.track === 'function') {
              await channel.track({ userId: String(selfId), name: user.name, status: 'queue' });
            }
            sendLobby('presence-ping', { userId: String(selfId), name: user.name, status: 'queue' });
          } catch (error) {
            console.error('Failed to track presence in lobby:', error);
          }
        });

        const ping = setInterval(() => {
          try {
            if (channel && typeof channel.track === 'function') {
              channel.track({ userId: String(selfId), name: user.name, status: stage === 'queue' ? 'queue' : 'busy', matchId: stage === 'queue' ? null : matchId });
            }
            sendLobby('presence-ping', { userId: String(selfId), name: user.name, status: stage === 'queue' ? 'queue' : 'busy', matchId: stage === 'queue' ? null : matchId });
            maybeHostPropose();
          } catch (error) {
            console.error('Failed to send lobby ping:', error);
          }
        }, LOBBY_PING_MS);

        return () => {
          clearInterval(ping);
          cleanupLobby();
        };
      } catch (error) {
        console.error('Failed to setup Supabase lobby channel:', error);
        // Fall back to local transport if Supabase fails
        return undefined;
      }
    } else {
      // Local transport fallback
      const bc = new BroadcastChannel('ecoplay:passa:lobby');
      localLobbyRef.current = bc;
      peersRef.current.set(String(selfId), { userId: String(selfId), name: user.name, status: 'queue', lastSeenMs: Date.now() });
      sendLobby('presence-ping', { userId: String(selfId), name: user.name, status: 'queue' });

      const onMessage = (ev) => {
        const msg = ev.data || {};
        if (msg.scope !== 'lobby') return;
        if (msg.event === 'presence-ping') {
          const p = msg.payload || {};
          if (!p.userId) return;
          peersRef.current.set(String(p.userId), { ...p, lastSeenMs: Date.now() });
          maybeHostPropose();
        }
        if (msg.event === 'match-proposal') {
          const p = msg.payload || {};
          if (!p.matchId || !p.a || !p.b) return;
          if (String(p.a) !== String(selfId) && String(p.b) !== String(selfId)) return;
          const otherId = String(p.a) === String(selfId) ? p.b : p.a;
          const otherRow = peersRef.current.get(String(otherId));
          setMatchId(p.matchId);
          setOpponent({ userId: otherId, name: otherRow?.name || 'Jogador' });
          setStage('matched');
        }
      };
      bc.addEventListener('message', onMessage);

      const ping = setInterval(() => {
        sendLobby('presence-ping', { userId: String(selfId), name: user.name, status: stage === 'queue' ? 'queue' : 'busy', matchId: stage === 'queue' ? null : matchId });
        maybeHostPropose();
      }, LOBBY_PING_MS);

      return () => {
        clearInterval(ping);
        bc.removeEventListener('message', onMessage);
        cleanupLobby();
      };
    }
  }, [cleanupLobby, matchId, maybeHostPropose, sendLobby, selfId, stage, supabase, transport, user?.name]);

  const isHost = useMemo(() => {
    if (!selfId || !opponent?.userId) return false;
    if (String(opponent.userId) === BOT_ID) return true;
    return [String(selfId), String(opponent.userId)].sort()[0] === String(selfId);
  }, [opponent?.userId, selfId]);

  const localPlayers = useMemo(() => {
    if (!selfId || !opponent?.userId) return null;
    return {
      [String(selfId)]: { userId: String(selfId), name: user?.name || 'Você' },
      [String(opponent.userId)]: { userId: String(opponent.userId), name: opponent.name || 'Dupla' },
    };
  }, [opponent, selfId, user?.name]);

  const startMatchIfHost = useCallback(() => {
    if (!isHost || !matchId || !selfId || !opponent?.userId || !localPlayers) return;
    const gameId = 1;
    const qIds = pickQuestionIds(matchId, ROUND_TOTAL);
    const turnUserId = String(selfId);
    const startMs = Date.now();
    const state = {
      matchId,
      gameId,
      phase: 'question',
      roundIndex: 0,
      roundTotal: ROUND_TOTAL,
      players: localPlayers,
      scores: { [String(selfId)]: 0, [String(opponent.userId)]: 0 },
      questionIds: qIds,
      questionId: qIds[0],
      turnUserId,
      passedByUserId: null,
      repassaAvailable: false,
      questionStartMs: startMs,
    };
    publishState(state);
  }, [isHost, matchId, opponent, localPlayers, selfId, publishState]);

  const matchStateRef = useRef(matchState);
  useEffect(() => {
    matchStateRef.current = matchState;
  }, [matchState]);

  const hostApplyAction = useCallback((state, action) => {
    if (!state || state.phase !== 'question') return null;
    const me = String(action.userId || '');
    if (!me) return null;
    if (me !== String(state.turnUserId)) return null;
    const ids = Object.keys(state.players || {});
    const otherId = ids.find((id) => id !== me);
    if (!otherId) return null;

    if (action.type === 'pass') {
      if (state.passedByUserId) return null;
      playClick();
      return { ...state, turnUserId: otherId, passedByUserId: me, repassaAvailable: true };
    }
    if (action.type === 'repassa') {
      if (!state.passedByUserId) return null;
      if (!state.repassaAvailable) return null;
      playClick();
      return { ...state, turnUserId: state.passedByUserId, repassaAvailable: false };
    }
    return null;
  }, []);

  const hostResolveRound = useCallback((state, resolution) => {
    const s = { ...state };
    const ids = Object.keys(s.players || {});
    const a = ids[0];
    const b = ids[1];
    const scores = { ...(s.scores || {}) };
    if (resolution.winnerId) scores[String(resolution.winnerId)] = (scores[String(resolution.winnerId)] || 0) + 1;
    const nextRoundIndex = s.roundIndex + 1;
    const done = nextRoundIndex >= s.roundTotal;

    const nextBase = {
      ...s,
      scores,
      phase: done ? 'final' : 'result',
      result: resolution,
      roundIndex: s.roundIndex,
    };

    if (done) {
      const winnerId =
        (scores[String(a)] || 0) === (scores[String(b)] || 0)
          ? null
          : (scores[String(a)] || 0) > (scores[String(b)] || 0)
            ? String(a)
            : String(b);
      return { ...nextBase, winnerId, rematchRequests: {} };
    }

    const afterMs = Date.now() + 2600;
    setTimeout(() => {
      const latest = matchStateRef.current;
      if (!latest || latest.matchId !== s.matchId) return;
      if (latest.phase !== 'result') return;
      const nextQuestionId = latest.questionIds[nextRoundIndex];
      const nextTurnId = nextRoundIndex % 2 === 0 ? String(a) : String(b);
      const startMs = Date.now();
      const nextState = {
        ...latest,
        phase: 'question',
        roundIndex: nextRoundIndex,
        questionId: nextQuestionId,
        turnUserId: nextTurnId,
        passedByUserId: null,
        repassaAvailable: false,
        questionStartMs: startMs,
        result: null,
      };
      publishState(nextState);
    }, Math.max(0, afterMs - Date.now()));

    return nextBase;
  }, [publishState]);

  const hostApplyAnswer = useCallback((state, payload) => {
    if (!state || state.phase !== 'question') return null;
    const q = QUESTIONS_BY_ID[state.questionId];
    if (!q) return null;
    const submitterId = String(payload.userId || '');
    const text = String(payload.text || '');
    if (!submitterId) return null;
    if (submitterId !== String(state.turnUserId)) return null;

    const correct = answersMatch(text, q);
    if (correct) playSuccess();
    else playError();

    const ids = Object.keys(state.players || {});
    const otherId = ids.find((id) => id !== submitterId);
    const winnerId = correct ? submitterId : otherId;
    const resolution = {
      type: correct ? 'correct' : 'wrong',
      winnerId: winnerId || null,
      submitterId,
      submittedText: text,
      correctAnswer: (q.answers || [])[0] || '',
      questionId: state.questionId,
    };
    return hostResolveRound(state, resolution);
  }, [hostResolveRound]);

  const hostApplyRematch = useCallback((state, payload) => {
    if (!state || state.phase !== 'final') return null;
    const userId = String(payload.userId || '');
    if (!userId) return null;
    const nextRequests = { ...(state.rematchRequests || {}) };
    nextRequests[userId] = true;
    const ids = Object.keys(state.players || {});
    const both = ids.every((id) => nextRequests[id]);
    if (!both) return { ...state, rematchRequests: nextRequests };

    const qIds = pickQuestionIds(`${state.matchId}-rematch-${Date.now()}`, ROUND_TOTAL);
    const startMs = Date.now();
    const next = {
      ...state,
      gameId: (state.gameId || 1) + 1,
      phase: 'question',
      roundIndex: 0,
      questionIds: qIds,
      questionId: qIds[0],
      scores: Object.fromEntries(ids.map((id) => [id, 0])),
      turnUserId: ids.sort()[0],
      passedByUserId: null,
      repassaAvailable: false,
      questionStartMs: startMs,
      result: null,
      winnerId: null,
      rematchRequests: {},
    };
    playClick();
    return next;
  }, []);

  useEffect(() => {
    if (!selfId || !matchId || !opponent?.userId) return undefined;
    cleanupMatch();

    // Don't setup Supabase for bot matches
    if (String(opponent?.userId || '') === BOT_ID) return undefined;
    if (transport === 'supabase') {
      if (!supabase) {
        console.warn('Supabase client not available for match, falling back to local transport');
        return undefined;
      }

      try {
        const channel = supabase.channel(`ecoplay:passa:match:${matchId}`, {
          config: { presence: { key: String(selfId) }, broadcast: { self: true } },
        });
        matchRef.current = channel;

        channel.on('broadcast', { event: 'state' }, ({ payload }) => {
          if (!payload?.matchId) return;
          if (!shouldAcceptIncomingState({ currentState: matchStateRef.current, incomingState: payload })) return;
          const rev = Number(payload.rev || 0);
          if (rev) lastRevRef.current = Math.max(Number(lastRevRef.current || 0), rev);
          setMatchState(payload);
          lastStateAtRef.current = Date.now();
          setStage(payload.phase === 'final' ? 'final' : 'playing');
        });

        channel.on('broadcast', { event: 'sync-request' }, ({ payload }) => {
          if (!isHost) return;
          const s = matchStateRef.current;
          const response = hostResyncResponse({ event: 'sync-request', payload, matchId, state: s });
          if (!response) return;
          sendMatch(response.event, response.payload);
        });

        channel.on('broadcast', { event: 'latency-ping' }, ({ payload }) => {
          const p = payload || {};
          if (String(p.matchId || '') !== String(matchId)) return;
          if (!p.from || !p.sentAtMs) return;
          if (String(p.from) === String(meIdStr)) return;
          sendMatch('latency-pong', { matchId, from: p.from, to: meIdStr, sentAtMs: p.sentAtMs });
        });

        channel.on('broadcast', { event: 'latency-pong' }, ({ payload }) => {
          const p = payload || {};
          if (String(p.matchId || '') !== String(matchId)) return;
          if (String(p.to || '') !== String(meIdStr)) return;
          const sentAt = Number(p.sentAtMs || 0);
          if (!sentAt) return;
          const rtt = Math.max(0, Date.now() - sentAt);
          const next = updateRttEstimate({ prevMs: lastPingRttRef.current, sampleMs: rtt });
          lastPingRttRef.current = next;
          setMatchRttMs(next);
        });

        channel.on('broadcast', { event: 'action' }, ({ payload }) => {
          if (!payload?.matchId) return;
          if (!isHost) return;
          const s = matchStateRef.current;
          if (!s || s.matchId !== payload.matchId) return;
          const next = hostApplyAction(s, payload);
          if (next) publishState(next);
        });

        channel.on('broadcast', { event: 'answer' }, ({ payload }) => {
          if (!payload?.matchId) return;
          if (!isHost) return;
          const s = matchStateRef.current;
          if (!s || s.matchId !== payload.matchId) return;
          const next = hostApplyAnswer(s, payload);
          if (next) publishState(next);
        });

        channel.on('broadcast', { event: 'rematch' }, ({ payload }) => {
          if (!payload?.matchId) return;
          if (!isHost) return;
          const s = matchStateRef.current;
          if (!s || s.matchId !== payload.matchId) return;
          const next = hostApplyRematch(s, payload);
          if (next) publishState(next);
        });

        channel.subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') return;
          try {
            if (channel && typeof channel.track === 'function') {
              await channel.track({ userId: String(selfId), name: user?.name || 'Jogador', status: 'in-match' });
            }
            if (isHost) startMatchIfHost();
            else if (String(opponent?.userId || '') !== BOT_ID) {
              // Only send sync-request for non-bot opponents
              sendMatch('sync-request', { matchId, userId: meIdStr });
            }
          } catch (error) {
            console.error('Failed to track presence in match:', error);
          }
        });

        return () => {
          cleanupMatch();
        };
      } catch (error) {
        console.error('Failed to setup Supabase match channel:', error);
        // Fall back to local transport if Supabase fails
        return undefined;
      }
    } else {
      // Local transport fallback
      const bc = new BroadcastChannel('ecoplay:passa:match');
      localMatchRef.current = bc;
      const onMessage = (ev) => {
        const msg = ev.data || {};
        if (msg.scope !== 'match') return;
        if (msg.matchId !== matchId) return;
        if (msg.event === 'state') {
          if (!shouldAcceptIncomingState({ currentState: matchStateRef.current, incomingState: msg.payload })) return;
          const rev = Number(msg.payload?.rev || 0);
          if (rev) lastRevRef.current = Math.max(Number(lastRevRef.current || 0), rev);
          setMatchState(msg.payload);
          lastStateAtRef.current = Date.now();
          setStage(msg.payload?.phase === 'final' ? 'final' : 'playing');
        }
        if (msg.event === 'sync-request' && isHost) {
          const s = matchStateRef.current;
          const response = hostResyncResponse({ event: 'sync-request', payload: msg.payload, matchId, state: s });
          if (!response) return;
          sendMatch(response.event, response.payload);
        }
        if (msg.event === 'action' && isHost) {
          const s = matchStateRef.current;
          const next = hostApplyAction(s, msg.payload);
          if (next) publishState(next);
        }
        if (msg.event === 'answer' && isHost) {
          const s = matchStateRef.current;
          const next = hostApplyAnswer(s, msg.payload);
          if (next) publishState(next);
        }
        if (msg.event === 'rematch' && isHost) {
          const s = matchStateRef.current;
          const next = hostApplyRematch(s, msg.payload);
          if (next) publishState(next);
        }
      };
      bc.addEventListener('message', onMessage);
      if (isHost) startMatchIfHost();
      else if (String(opponent?.userId || '') !== BOT_ID) {
        // Only send sync-request for non-bot opponents
        sendMatch('sync-request', { matchId, userId: meIdStr });
      }
      return () => {
        bc.removeEventListener('message', onMessage);
        cleanupMatch();
      };
    }
  }, [
    cleanupMatch,
    hostApplyAction,
    hostApplyAnswer,
    hostApplyRematch,
    isHost,
    matchId,
    meIdStr,
    opponent?.userId,
    publishState,
    selfId,
    sendMatch,
    startMatchIfHost,
    supabase,
    transport,
    user?.name
  ]);

  useEffect(() => {
    if (!selfId || !matchId) return;
    if (transport === 'local') return;
    if (!shouldRequestMatchResync({ stage, nowMs: Date.now(), lastStateAtMs: lastStateAtRef.current })) return;
    if (isHost) return;
    sendMatch('sync-request', { matchId, userId: meIdStr });
  }, [isHost, matchId, meIdStr, nowMs, selfId, sendMatch, stage, transport]);

  useEffect(() => {
    if (!selfId || !matchId) return undefined;
    if (transport === 'local') return undefined;
    const t = setInterval(() => {
      if (stage !== 'playing') return;
      sendMatch('latency-ping', { matchId, from: meIdStr, sentAtMs: Date.now() });
    }, 2500);
    return () => clearInterval(t);
  }, [matchId, meIdStr, selfId, sendMatch, stage, transport]);

  useEffect(() => {
    if (!isHost) return;
    const s = matchState;
    if (!s || s.phase !== 'question') return;
    const elapsed = Date.now() - (s.questionStartMs || 0);
    if (elapsed < ROUND_SECONDS * 1000) return;
    const q = QUESTIONS_BY_ID[s.questionId];
    const ids = Object.keys(s.players || {});
    const otherId = ids.find((id) => id !== String(s.turnUserId));
    const resolution = {
      type: 'timeout',
      winnerId: otherId || null,
      submitterId: String(s.turnUserId),
      submittedText: '',
      correctAnswer: (q?.answers || [])[0] || '',
      questionId: s.questionId,
    };
    const next = hostResolveRound(s, resolution);
    if (next) publishState(next);
  }, [hostResolveRound, isHost, matchState, nowMs, publishState]);

  const myName = user?.name || 'Você';
  const opponentName = opponent?.name || 'Dupla';

  const currentQuestion = matchState?.questionId ? QUESTIONS_BY_ID[matchState.questionId] : null;
  const remainingSec = useMemo(() => {
    if (!matchState?.questionStartMs || matchState.phase !== 'question') return ROUND_SECONDS;
    const elapsed = (nowMs - matchState.questionStartMs) / 1000;
    return clamp(Math.ceil(ROUND_SECONDS - elapsed), 0, ROUND_SECONDS);
  }, [matchState?.phase, matchState?.questionStartMs, nowMs]);

  const canAnswer = matchState?.phase === 'question' && String(matchState.turnUserId) === meIdStr;
  const canPass = canAnswer && !matchState?.passedByUserId;
  const canRepassa = canAnswer && Boolean(matchState?.passedByUserId) && Boolean(matchState?.repassaAvailable);

  const currentOptions = useMemo(() => {
    if (!matchState?.questionId || !matchId) return [];
    const optsMap = buildOptionsForPlayers({ matchId, questionId: matchState.questionId, players: matchState.players || {} });
    const mine = optsMap[meIdStr] || [];
    const correct = QUESTION_CANONICAL[matchState.questionId] || '';
    if (!correct) return mine;
    const hasCorrect = mine.some((t) => normalizeText(t) === normalizeText(correct));
    if (hasCorrect) return mine;
    const fallback = uniqueByNorm([correct, ...mine]).slice(0, 4);
    return fallback.length === 4
      ? fallback
      : uniqueByNorm([
        ...fallback,
        ...pickDistractors({
          correctNorm: normalizeText(correct),
          category: 'Geral',
          seedStr: `${matchId}|${matchState.questionId}|${meIdStr}|fallback`,
          count: 4,
        }),
      ]).slice(0, 4);
  }, [matchId, matchState, meIdStr]);

  const submitAnswer = useCallback((text) => {
    if (!matchState || matchState.phase !== 'question') return;
    if (!canAnswer) return;
    const txt = String(text || '').trim();
    if (!txt) return;
    playClick();
    const payload = { matchId, userId: meIdStr, text: txt, atMs: Date.now() };
    if (transport === 'local' && isHost) {
      const s = matchStateRef.current || matchState;
      const next = hostApplyAnswer(s, payload);
      if (next) publishState(next);
      return;
    }
    sendMatch('answer', payload);
  }, [canAnswer, isHost, matchId, matchState, meIdStr, publishState, sendMatch, transport, hostApplyAnswer]);

  const doPass = useCallback(() => {
    if (!canPass) return;
    playClick();
    const payload = { matchId, userId: meIdStr, type: 'pass' };
    if (transport === 'local' && isHost) {
      const s = matchStateRef.current || matchState;
      const next = hostApplyAction(s, payload);
      if (next) publishState(next);
      return;
    }
    sendMatch('action', payload);
  }, [canPass, isHost, matchId, meIdStr, matchState, publishState, sendMatch, transport, hostApplyAction]);

  const doRepassa = useCallback(() => {
    if (!canRepassa) return;
    playClick();
    const payload = { matchId, userId: meIdStr, type: 'repassa' };
    if (transport === 'local' && isHost) {
      const s = matchStateRef.current || matchState;
      const next = hostApplyAction(s, payload);
      if (next) publishState(next);
      return;
    }
    sendMatch('action', payload);
  }, [canRepassa, isHost, matchId, meIdStr, matchState, publishState, sendMatch, transport, hostApplyAction]);

  const requestRematch = useCallback(() => {
    if (!matchState || matchState.phase !== 'final') return;
    playClick();
    const payload = { matchId, userId: meIdStr };
    if (transport === 'local' && isHost) {
      const s = matchStateRef.current || matchState;
      const next = hostApplyRematch(s, payload);
      if (next) publishState(next);
      return;
    }
    sendMatch('rematch', payload);
  }, [isHost, matchId, matchState, meIdStr, publishState, sendMatch, transport, hostApplyRematch]);

  useEffect(() => {
    if (!autoRematch) return;
    if (!matchState || matchState.phase !== 'final') return;
    const t = setTimeout(() => requestRematch(), 700);
    return () => clearTimeout(t);
  }, [autoRematch, matchState, requestRematch]);

  useEffect(() => {
    if (!matchState || matchState.phase !== 'final') return;
    if (processedMatchIdRef.current === matchState.matchId) return;

    processedMatchIdRef.current = matchState.matchId;

    const scores = matchState.scores || {};
    const myScore = scores[meIdStr] || 0;
    const ids = Object.keys(matchState.players || {});
    const otherId = ids.find((id) => id !== meIdStr);
    const oppScore = otherId ? scores[otherId] || 0 : 0;
    const didWin = myScore > oppScore;
    const xp = myScore * 35 + (didWin ? 80 : 0);

    if (xp > 0) {
      addScore(xp);
      // Save score to backend
      api.post('/games/score', {
        gameId: 'passarepassa',
        score: xp
      }).catch(err => console.error('Failed to save score:', err));
    }

    updateStat('total_games', 1);
    if (didWin) {
      updateStat('games_won', 1);
      playWin();
    }
    const top = upsertRank({ userId: meIdStr, name: myName, didWin });
    setRankTop(top);
  }, [addScore, matchState, meIdStr, myName, updateStat]);

  useEffect(() => {
    if (String(opponent?.userId || '') !== BOT_ID) return;
    if (!matchState || matchState.phase !== 'result' || !matchState.result) return;
    const res = matchState.result;
    if (String(res.submitterId || '') !== BOT_ID) return;
    const q = QUESTIONS_BY_ID[res.questionId];
    const category = q?.category || 'Geral';
    const model = botModelRef.current || { byCategory: {} };
    const prevSkill = getBotCategorySkill(model, category);
    const delta = res.type === 'correct' ? 0.03 : -0.04;
    const nextModel = setBotCategorySkill(model, category, prevSkill + delta);
    botModelRef.current = nextModel;
    writeBotModel(nextModel);
  }, [matchState, opponent?.userId]);

  useEffect(() => {
    if (String(opponent?.userId || '') !== BOT_ID) return;
    if (!isHost) return;
    if (!matchState || matchState.phase !== 'question') return;
    if (String(matchState.turnUserId) !== BOT_ID) return;

    const turnKey = `${matchState.matchId}|${matchState.questionId}|${matchState.roundIndex}|${matchState.turnUserId}|${matchState.passedByUserId || ''}|${matchState.repassaAvailable ? '1' : '0'}`;
    if (botTurnKeyRef.current === turnKey) return;
    botTurnKeyRef.current = turnKey;

    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current);
      botTimeoutRef.current = null;
    }

    const q = QUESTIONS_BY_ID[matchState.questionId];
    const category = q?.category || 'Geral';
    const model = botModelRef.current || { byCategory: {} };
    const skill = getBotCategorySkill(model, category);

    const elapsed = Date.now() - (matchState.questionStartMs || 0);
    const remaining = clamp(ROUND_SECONDS - Math.ceil(elapsed / 1000), 0, ROUND_SECONDS);

    const baseP = 0.58;
    const timePenalty = remaining <= 10 ? 0.12 : remaining <= 20 ? 0.06 : 0;
    const pCorrect = clamp(baseP + skill - timePenalty, 0.28, 0.92);

    const seed = xfnv1a(`${turnKey}|bot`);
    const rng = mulberry32(seed);
    const delayMs = Math.floor(650 + rng() * 1100);

    botTimeoutRef.current = setTimeout(() => {
      const s = matchStateRef.current || matchState;
      if (!s || s.phase !== 'question') return;
      if (String(s.turnUserId) !== BOT_ID) return;

      const shouldPass = !s.passedByUserId && pCorrect < 0.48 && remaining >= 18 && rng() < 0.55;
      if (shouldPass) {
        const next = hostApplyAction(s, { matchId: s.matchId, userId: BOT_ID, type: 'pass' });
        if (next) publishState(next);
        return;
      }

      const optsMap = buildOptionsForPlayers({ matchId: s.matchId, questionId: s.questionId, players: s.players || {} });
      const options = optsMap[BOT_ID] || [];
      const correctText = (q?.answers || [])[0] || '';
      const correctNorm = normalizeText(correctText);
      const correctOpt = options.find((t) => normalizeText(t) === correctNorm) || correctText || options[0] || '';

      const chooseCorrect = rng() < pCorrect;
      const wrongPool = options.filter((t) => normalizeText(t) !== correctNorm);
      const wrongPick = wrongPool.length ? wrongPool[Math.floor(rng() * wrongPool.length)] : options[0] || correctOpt;
      const chosen = chooseCorrect ? correctOpt : wrongPick;

      const next = hostApplyAnswer(s, { matchId: s.matchId, userId: BOT_ID, text: chosen, atMs: Date.now() });
      if (next) publishState(next);
    }, delayMs);

    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current);
        botTimeoutRef.current = null;
      }
    };
  }, [isHost, matchId, matchState, opponent?.userId, publishState, hostApplyAction, hostApplyAnswer]);

  useEffect(() => {
    if (stage !== 'matched') return;
    setTimeout(() => {
      if (isHost) startMatchIfHost();
    }, 450);
  }, [isHost, stage, startMatchIfHost]);

  useEffect(() => {
    if (transport !== 'local') return undefined;
    const onBeforeUnload = () => sendLobby('presence-ping', { userId: String(selfId), name: user?.name || 'Jogador', status: 'offline' });
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [sendLobby, selfId, transport, user?.name]);

  if (!user?.id) {
    return (
      <div className="min-h-screen pt-20 px-4 max-w-4xl mx-auto text-white">
        <Link to="/games" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>
        <div className="mt-8 bg-slate-900/50 border border-slate-700 rounded-2xl p-6 text-slate-200">
          Você precisa estar logado para jogar online.
        </div>
      </div>
    );
  }

  const scores = matchState?.scores || {};
  const myScore = scores[meIdStr] || 0;
  const oppId = opponent?.userId ? String(opponent.userId) : '';
  const oppScore = oppId ? scores[oppId] || 0 : 0;
  const turnName =
    matchState?.turnUserId === meIdStr
      ? myName
      : (matchState?.players?.[String(matchState?.turnUserId)]?.name || opponentName);

  return (
    <div className="min-h-screen pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-theme-text-primary">
      <div className="flex items-center justify-between mb-6">
        <Link to="/games" className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-theme-text-tertiary">
          <Users className="w-4 h-4" />
          {String(opponent?.userId || '') === BOT_ID
            ? 'IA'
            : (transport === 'supabase'
              ? `Online${matchRttMs != null ? ` · ${Math.round(matchRttMs)}ms` : ''}`
              : 'Local')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="bg-theme-bg-secondary/40 border border-theme-border rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="text-2xl font-display font-bold text-theme-text-primary">Passa ou Repassa</div>
              <div className="text-theme-text-secondary text-sm">Energia renovável e sustentabilidade · alternativas A, B, C, D</div>
            </div>
            <div className="flex items-center gap-2 bg-theme-bg-tertiary/40 border border-theme-border rounded-2xl px-4 py-2">
              <TimerReset className="w-4 h-4 text-amber-400" />
              <div className="font-mono text-sm text-theme-text-primary">{String(remainingSec).padStart(2, '0')}s</div>
            </div>
          </div>

          {error && <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-500 dark:text-red-200">{error}</div>}

          {stage === 'queue' && (
            <div className="bg-theme-bg-tertiary/40 border border-theme-border rounded-2xl p-6">
              <div className="text-theme-text-primary font-bold mb-2">Buscando uma dupla…</div>
              <div className="text-theme-text-secondary text-sm mb-6">
                Abra em outro dispositivo/aba com outro usuário para formar dupla automaticamente.
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    resetToQueue();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-theme-bg-secondary border border-theme-border text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reiniciar fila
                </button>
                {(nowMs - queueSinceMs) / 1000 >= 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      startBotMatch();
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-eco-green text-slate-900 font-bold hover:bg-green-400 transition-colors"
                  >
                    Jogar contra a máquina
                  </button>
                )}
              </div>
            </div>
          )}

          {stage === 'matched' && (
            <div className="bg-theme-bg-tertiary/40 border border-theme-border rounded-2xl p-6">
              <div className="text-theme-text-primary font-bold mb-2">Dupla encontrada</div>
              <div className="text-theme-text-secondary text-sm mb-4">
                Você: <span className="text-theme-text-primary font-mono">{myName}</span> · Dupla:{' '}
                <span className="text-theme-text-primary font-mono">{opponentName}</span>
              </div>
              <div className="text-theme-text-tertiary text-sm">Preparando partida…</div>
            </div>
          )}

          {stage === 'playing' && matchState && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-theme-bg-tertiary/40 border border-theme-border rounded-2xl px-4 py-3">
                <div className="text-sm text-theme-text-secondary">
                  Rodada <span className="font-mono text-theme-text-primary">{matchState.roundIndex + 1}</span>/
                  <span className="font-mono text-theme-text-primary">{matchState.roundTotal}</span>
                </div>
                <div className="text-sm text-theme-text-secondary">
                  Turno: <span className="font-mono text-theme-text-primary">{turnName}</span>
                </div>
              </div>

              {matchState.phase === 'question' && currentQuestion && (
                <div className="bg-theme-bg-tertiary/40 border border-theme-border rounded-2xl p-6">
                  <div className="text-xs font-mono uppercase text-theme-text-tertiary mb-2">{currentQuestion.category}</div>
                  <div className="text-xl font-display font-bold text-theme-text-primary mb-4">{currentQuestion.question}</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentOptions.slice(0, 4).map((opt, idx) => (
                      <button
                        key={`${matchState.questionId}-${idx}-${opt}`}
                        type="button"
                        onClick={() => submitAnswer(opt)}
                        disabled={!canAnswer}
                        className="w-full text-left px-4 py-3 rounded-2xl bg-theme-bg-secondary/70 border border-theme-border text-theme-text-primary hover:bg-theme-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="font-mono text-theme-text-tertiary mr-3">{OPTION_LABELS[idx] || '?'}</span>
                        <span className="font-bold text-theme-text-primary">{opt}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={doPass}
                      disabled={!canPass}
                      className="px-4 py-2 rounded-2xl bg-theme-bg-secondary border border-theme-border text-theme-text-primary hover:bg-theme-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Passa
                    </button>
                    <button
                      type="button"
                      onClick={doRepassa}
                      disabled={!canRepassa}
                      className="px-4 py-2 rounded-2xl bg-theme-bg-secondary border border-theme-border text-theme-text-primary hover:bg-theme-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Repassa
                    </button>
                  </div>
                </div>
              )}

              {matchState.phase === 'result' && matchState.result && (
                <div className="bg-theme-bg-tertiary/40 border border-theme-border rounded-2xl p-6">
                  <div className="text-theme-text-primary font-bold mb-2">Resultado</div>
                  <div className="text-theme-text-secondary text-sm mb-3">
                    Resposta correta: <span className="font-mono text-theme-text-primary">{matchState.result.correctAnswer}</span>
                  </div>
                  <div className="text-theme-text-tertiary text-sm">
                    {matchState.result.type === 'timeout'
                      ? 'Tempo esgotado.'
                      : matchState.result.type === 'correct'
                        ? 'Acertou!'
                        : 'Errou.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {stage === 'final' && matchState && (
            <div className="bg-theme-bg-tertiary/40 border border-theme-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-theme-text-primary font-bold">Placar final</div>
                <div className="flex items-center gap-2 text-amber-500">
                  <Trophy className="w-5 h-5" />
                  <span className="font-mono text-sm">
                    {myScore}–{oppScore}
                  </span>
                </div>
              </div>
              <div className="text-sm text-theme-text-secondary mb-4">
                Você: <span className="font-mono text-theme-text-primary">{myName}</span> · Dupla:{' '}
                <span className="font-mono text-theme-text-primary">{opponentName}</span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <label className="inline-flex items-center gap-2 text-sm text-theme-text-secondary">
                  <input type="checkbox" checked={autoRematch} onChange={(e) => setAutoRematch(e.target.checked)} />
                  Revanche automática
                </label>
                <button
                  type="button"
                  onClick={requestRematch}
                  className="px-4 py-2 rounded-2xl bg-eco-green text-slate-900 font-bold hover:bg-green-400 transition-colors"
                >
                  Revanche
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetToQueue}
                  className="px-4 py-2 rounded-2xl bg-theme-bg-secondary border border-theme-border text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
                >
                  Voltar à fila
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-theme-bg-tertiary/40 border border-theme-border rounded-3xl p-5 space-y-4">
          <div className="text-theme-text-secondary font-bold">Placar</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-theme-bg-secondary/40 border border-theme-border rounded-2xl p-4">
              <div className="text-xs font-mono uppercase text-theme-text-tertiary mb-1">Você</div>
              <div className="text-lg font-bold text-theme-text-primary">{myName}</div>
              <div className="text-2xl font-mono text-eco-green mt-2">{myScore}</div>
            </div>
            <div className="bg-theme-bg-secondary/40 border border-theme-border rounded-2xl p-4">
              <div className="text-xs font-mono uppercase text-theme-text-tertiary mb-1">Dupla</div>
              <div className="text-lg font-bold text-theme-text-primary">{opponentName}</div>
              <div className="text-2xl font-mono text-amber-500 mt-2">{oppScore}</div>
            </div>
          </div>

          <div className="bg-theme-bg-secondary/40 border border-theme-border rounded-2xl p-4">
            <div className="text-theme-text-primary font-bold mb-2">Ranking (local)</div>
            <div className="space-y-2">
              {rankTop.length === 0 && <div className="text-sm text-theme-text-secondary">Ainda sem partidas.</div>}
              {rankTop.map((r, idx) => (
                <div key={r.userId} className="flex items-center justify-between text-sm text-theme-text-secondary">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-theme-text-tertiary">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-theme-text-primary">{r.name || r.userId}</span>
                  </div>
                  <div className="font-mono text-theme-text-primary">{r.rating}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-theme-bg-secondary/40 border border-theme-border rounded-2xl p-4 text-sm text-theme-text-secondary">
            <div className="font-bold text-theme-text-primary mb-2">Regras rápidas</div>
            <div className="space-y-1">
              <div>1 minuto por pergunta.</div>
              <div>Escolha A, B, C ou D.</div>
              <div>Passa: transfere o turno.</div>
              <div>Repassa: devolve uma vez.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const __testables = {
  normalizeText,
  countWords,
  isShortAnswer,
  answersMatch,
  pickQuestionIds,
  QUESTIONS_BY_ID,
  makeMatchId,
  seededShuffle,
  buildOptionsForPlayers,
};

export default EcoPassaRepassa;
