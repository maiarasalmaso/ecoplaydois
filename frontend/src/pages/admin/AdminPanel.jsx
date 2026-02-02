import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Download, FileText, Filter, LogOut, RefreshCw, Search, Shield, ArrowLeft, Star, Users } from 'lucide-react';
import AnimatedBackground from '../../../src/components/layout/AnimatedBackground';
import { buildFeedbackCsv, computeFeedbackSummary, downloadTextFile, getFeedbackCtaClicks, listFeedbackResponses, openPrintableReport } from '../../utils/feedbackStore';

const ADMIN_SESSION_KEY = 'ecoplay.admin.session';
const USERS_KEY = 'ecoplay_users_db';
const PROGRESS_PREFIX = 'ecoplay_progress_';

const FEEDBACK_UX_LIKERT_IDS = [
  'ux_navigation',
  'ux_design',
  'ux_clarity',
  'ux_speed',
  'ux_satisfaction',
  'ux_recommend',
];

const FEEDBACK_LEARNING_LIKERT_IDS = [
  'learn_effective',
  'learn_reinforce',
  'learn_level',
  'learn_motivation',
];

const nowMs = () => Date.now();

const readJson = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const toDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const isoFromDateOnly = (dateOnly) => {
  if (!dateOnly) return null;
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const addDays = (dateOnly, deltaDays) => {
  const iso = isoFromDateOnly(dateOnly);
  if (!iso) return null;
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
};

const createDayRange = (days) => {
  const end = toDateOnly(new Date());
  if (!end) return [];
  const start = addDays(end, -(days - 1));
  if (!start) return [];
  const out = [];
  for (let i = 0; i < days; i += 1) {
    const next = addDays(start, i);
    if (next) out.push(next);
  }
  return out;
};

const defaultProgress = () => ({
  score: 0,
  badges: [],
  badgeUnlocks: {},
  stats: { xp: 0, logins: 0, streak: 0, timeSpentSeconds: 0 },
  completedLevels: {},
  lastDailyXpDate: null,
  unclaimedRewards: []
});

const readUsers = () => {
  const users = readJson(localStorage, USERS_KEY);
  return Array.isArray(users) ? users : [];
};

const readProgress = (userId) => {
  const key = `${PROGRESS_PREFIX}${userId}`;
  const progress = readJson(localStorage, key);
  if (!progress || typeof progress !== 'object') return defaultProgress();
  return { ...defaultProgress(), ...progress, stats: { ...defaultProgress().stats, ...(progress.stats || {}) } };
};

const readSession = () => {
  const readFrom = (storage) => {
    try {
      const raw = storage.getItem(ADMIN_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.expiresAt) return null;
      return parsed;
    } catch {
      return null;
    }
  };
  return readFrom(sessionStorage) || readFrom(localStorage);
};

const clearSession = () => {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore
  }
};

const formatNumber = (value) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

const formatDecimal = (value) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0);

const formatDuration = (totalSeconds) => {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (seconds < 60) return '<1m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const Sparkline = ({ points, className }) => {
  const width = 320;
  const height = 80;
  const padding = 6;
  const max = Math.max(...points.map((p) => p.value), 1);
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const path = points
    .map((p, idx) => {
      const x = padding + idx * stepX;
      const y = height - padding - (p.value / max) * (height - padding * 2);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="Gráfico de tendência">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [tab, setTab] = useState('users');
  const [rangeDays, setRangeDays] = useState(30);
  const [userType, setUserType] = useState('all');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('xp');
  const [sortDir, setSortDir] = useState('desc');
  const [feedbackRangeDays, setFeedbackRangeDays] = useState(30);
  const [feedbackUserType, setFeedbackUserType] = useState('all');
  const [feedbackQuery, setFeedbackQuery] = useState('');
  const [feedbackScoreMin, setFeedbackScoreMin] = useState('');
  const [feedbackScoreMax, setFeedbackScoreMax] = useState('');
  const [feedbackSortKey, setFeedbackSortKey] = useState('createdAt');
  const [feedbackSortDir, setFeedbackSortDir] = useState('desc');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const session = readSession();
    const isSessionValid = Boolean(session?.expiresAt) && Date.now() < session.expiresAt;

    if (!isSessionValid) {
      clearSession();
      navigate('/admin', { replace: true });
      return;
    }
    setValid(true);
    setChecking(false);
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      const session = readSession();
      if (!session?.expiresAt || nowMs() >= session.expiresAt) {
        clearSession();
        navigate('/admin', { replace: true });
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    const onStorage = (event) => {
      const key = String(event?.key || '');
      if (!key) return;
      const isUserDb = key === USERS_KEY;
      const isProgress = key.startsWith(PROGRESS_PREFIX);
      const isFeedback = key === 'ecoplay.feedback.responses' || key === 'ecoplay.feedback.cta.clicks';
      if (!isUserDb && !isProgress && !isFeedback) return;
      setRefreshToken((v) => v + 1);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const logout = () => {
    clearSession();
    navigate('/admin', { replace: true });
  };

  const MotionDiv = motion.div;

  const snapshot = useMemo(() => {
    const refreshKey = refreshToken;
    const users = readUsers();
    const days = createDayRange(rangeDays);
    const minDay = days[0] || null;
    const queryNormalized = String(query || '').trim().toLowerCase();

    const mapped = users.map((u) => {
      const progress = readProgress(u.id);
      const stats = progress.stats || {};
      const xp = Number(stats.xp || 0);
      const score = Number(progress.score || 0);
      const badgesCount = Array.isArray(progress.badges) ? progress.badges.length : 0;
      const timeSpentSeconds = Number(stats.timeSpentSeconds || 0);
      const lastLogin = toDateOnly(u.lastLoginDate);
      const activeInPeriod = Boolean(lastLogin && minDay && lastLogin >= minDay);
      const status = activeInPeriod ? 'Ativo' : 'Inativo';

      return {
        id: u.id,
        name: u.name || 'Sem nome',
        email: u.email || '-',
        streak: Number(u.streak ?? stats.streak ?? 0),
        lastLoginDate: lastLogin || '-',
        xp,
        score,
        badgesCount,
        timeSpentSeconds,
        activeInPeriod,
        status,
        badgeUnlocks: progress.badgeUnlocks || {}
      };
    });

    const filteredByQuery = queryNormalized
      ? mapped.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(queryNormalized))
      : mapped;

    const filteredByType =
      userType === 'active'
        ? filteredByQuery.filter((u) => u.activeInPeriod)
        : userType === 'inactive'
          ? filteredByQuery.filter((u) => !u.activeInPeriod)
          : filteredByQuery;

    const totalXp = filteredByType.reduce((acc, u) => acc + u.xp, 0);
    const totalScore = filteredByType.reduce((acc, u) => acc + u.score, 0);
    const totalBadges = filteredByType.reduce((acc, u) => acc + u.badgesCount, 0);
    const activeUsers = filteredByType.reduce((acc, u) => acc + (u.activeInPeriod ? 1 : 0), 0);

    const unlocksByDay = {};
    for (const day of days) unlocksByDay[day] = 0;

    for (const u of filteredByType) {
      const unlocks = u.badgeUnlocks || {};
      for (const value of Object.values(unlocks)) {
        const day = toDateOnly(value);
        if (!day) continue;
        if (minDay && day < minDay) continue;
        if (unlocksByDay[day] === undefined) continue;
        unlocksByDay[day] += 1;
      }
    }

    const trendPoints = days.map((day) => ({ day, value: unlocksByDay[day] || 0 }));

    const sorted = [...filteredByType].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      const key = sortKey;
      if (key === 'name') return String(a.name).localeCompare(String(b.name)) * mul;
      if (key === 'email') return String(a.email).localeCompare(String(b.email)) * mul;
      if (key === 'lastLoginDate') return String(a.lastLoginDate).localeCompare(String(b.lastLoginDate)) * mul;
      return (Number(a[key] || 0) - Number(b[key] || 0)) * mul;
    });

    const topByXp = [...filteredByType].sort((a, b) => b.xp - a.xp).slice(0, 5);

    return {
      totalAll: mapped.length,
      totalFiltered: filteredByType.length,
      activeUsers,
      totalXp,
      totalScore,
      totalBadges,
      avgXp: filteredByType.length ? totalXp / filteredByType.length : 0,
      avgScore: filteredByType.length ? totalScore / filteredByType.length : 0,
      users: sorted,
      topByXp,
      trendPoints,
      refreshKey
    };
  }, [query, rangeDays, refreshToken, sortDir, sortKey, userType]);

  const feedbackSnapshot = useMemo(() => {
    const refreshKey = refreshToken;
    const responses = listFeedbackResponses();
    const days = createDayRange(feedbackRangeDays);
    const minDay = days[0] || null;
    const queryNormalized = String(feedbackQuery || '').trim().toLowerCase();
    const minScore = feedbackScoreMin === '' ? null : Number(feedbackScoreMin);
    const maxScore = feedbackScoreMax === '' ? null : Number(feedbackScoreMax);

    const filteredByDate = minDay
      ? responses.filter((r) => {
          const day = toDateOnly(r?.createdAt);
          return Boolean(day && day >= minDay);
        })
      : responses;

    const filteredByQuery = queryNormalized
      ? filteredByDate.filter((r) => {
          const u = r?.user || {};
          const openText = JSON.stringify(r?.ux || {}) + ' ' + JSON.stringify(r?.learning || {});
          return `${u.name || ''} ${u.email || ''} ${openText}`.toLowerCase().includes(queryNormalized);
        })
      : filteredByDate;

    const filteredByType =
      feedbackUserType === 'autenticado'
        ? filteredByQuery.filter((r) => r?.user?.type === 'autenticado')
        : feedbackUserType === 'anonimo'
          ? filteredByQuery.filter((r) => r?.user?.type === 'anonimo')
          : filteredByQuery;

    const filteredByScore = filteredByType.filter((r) => {
      const s = Number(r?.score || 0);
      if (minScore !== null && Number.isFinite(minScore) && s < minScore) return false;
      if (maxScore !== null && Number.isFinite(maxScore) && s > maxScore) return false;
      return true;
    });

    const sorted = [...filteredByScore].sort((a, b) => {
      const mul = feedbackSortDir === 'asc' ? 1 : -1;
      const key = feedbackSortKey;
      if (key === 'createdAt') return String(a?.createdAt || '').localeCompare(String(b?.createdAt || '')) * mul;
      if (key === 'score') return (Number(a?.score || 0) - Number(b?.score || 0)) * mul;
      return String(a?.level || '').localeCompare(String(b?.level || '')) * mul;
    });

    const summary = computeFeedbackSummary(sorted, {
      uxLikertIds: FEEDBACK_UX_LIKERT_IDS,
      learningLikertIds: FEEDBACK_LEARNING_LIKERT_IDS,
    });

    const clicks = getFeedbackCtaClicks();
    const filteredClicks = minDay
      ? clicks.filter((c) => {
          const day = toDateOnly(c?.at);
          return Boolean(day && day >= minDay);
        })
      : clicks;

    const volumeByDay = {};
    for (const day of days) volumeByDay[day] = 0;
    sorted.forEach((r) => {
      const day = toDateOnly(r?.createdAt);
      if (!day) return;
      if (minDay && day < minDay) return;
      if (volumeByDay[day] === undefined) return;
      volumeByDay[day] += 1;
    });

    const trendPoints = days.map((day) => ({ day, value: volumeByDay[day] || 0 }));

    return {
      totalAll: responses.length,
      totalFiltered: sorted.length,
      responses: sorted,
      summary,
      clicksTotal: filteredClicks.length,
      trendPoints,
      refreshKey,
    };
  }, [
    feedbackQuery,
    feedbackRangeDays,
    feedbackScoreMax,
    feedbackScoreMin,
    feedbackSortDir,
    feedbackSortKey,
    feedbackUserType,
    refreshToken,
  ]);

  const toggleSort = (key) => {
    if (key === sortKey) setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const toggleFeedbackSort = (key) => {
    if (key === feedbackSortKey) setFeedbackSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else {
      setFeedbackSortKey(key);
      setFeedbackSortDir('desc');
    }
  };

  const onRefresh = () => {
    setRefreshToken((v) => v + 1);
  };

  const exportFeedbackCsv = () => {
    const csv = buildFeedbackCsv(feedbackSnapshot.responses);
    downloadTextFile(`ecoplay-avaliacoes-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
  };

  const exportFeedbackPdf = () => {
    const s = feedbackSnapshot.summary;
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;max-width:960px;margin:24px auto;padding:0 16px">
        <h1 style="margin:0 0 12px">Resumo Executivo - Avaliações</h1>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0">
          <div style="border:1px solid #ddd;border-radius:12px;padding:12px"><div style="font-size:12px;color:#555">Respostas (recorte)</div><div style="font-size:28px;font-weight:800">${feedbackSnapshot.totalFiltered}</div></div>
          <div style="border:1px solid #ddd;border-radius:12px;padding:12px"><div style="font-size:12px;color:#555">Média UX</div><div style="font-size:28px;font-weight:800">${formatDecimal(s.uxOverall)}</div></div>
          <div style="border:1px solid #ddd;border-radius:12px;padding:12px"><div style="font-size:12px;color:#555">Média Aprendizado</div><div style="font-size:28px;font-weight:800">${formatDecimal(s.learningOverall)}</div></div>
        </div>
        <h2 style="margin:18px 0 8px">KPIs</h2>
        <ul>
          <li>Score médio: ${formatDecimal(s.scoreAvg)}</li>
          <li>Clicks no CTA (recorte): ${formatNumber(feedbackSnapshot.clicksTotal)}</li>
        </ul>
        <h2 style="margin:18px 0 8px">Amostra de respostas</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Data</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Usuário</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Tipo</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Score</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Nível</th></tr></thead>
          <tbody>
            ${feedbackSnapshot.responses.slice(0, 16).map((r) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${String(r.createdAt || '').slice(0, 10)}</td><td style="padding:8px;border-bottom:1px solid #eee">${String(r?.user?.name || r?.user?.email || '-')}</td><td style="padding:8px;border-bottom:1px solid #eee">${String(r?.user?.type || '-')}</td><td style="padding:8px;border-bottom:1px solid #eee">${Number(r.score || 0)}</td><td style="padding:8px;border-bottom:1px solid #eee">${String(r.level || '-')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    openPrintableReport({ title: 'EcoPlay - Avaliações', html });
  };

  if (checking && !valid) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-slate-900">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 bg-slate-900">
      <AnimatedBackground />

      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar ao site
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-700/60 transition-colors"
              aria-label="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700 text-slate-200 hover:bg-slate-700/60 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        <MotionDiv
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 text-amber-300 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Painel do Administrador</h1>
              <p className="text-slate-400">
                {tab === 'users' ? 'Visão consolidada do progresso dos usuários.' : 'Visão consolidada das avaliações e KPIs.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setTab('users')}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                tab === 'users'
                  ? 'bg-amber-400 text-slate-900 border-amber-300'
                  : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800'
              }`}
            >
              Usuários
            </button>
            <button
              type="button"
              onClick={() => setTab('feedback')}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                tab === 'feedback'
                  ? 'bg-amber-400 text-slate-900 border-amber-300'
                  : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800'
              }`}
            >
              Avaliações
            </button>
          </div>

          {tab === 'users' ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5 lg:col-span-2">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <div className="flex items-center gap-2 text-slate-200 font-bold">
                      <Filter className="w-4 h-4 text-amber-300" />
                      Filtros
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                      <label className="text-sm text-slate-300 flex flex-col gap-1">
                        Período
                        <select
                          value={rangeDays}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setRangeDays(next);
                          }}
                          className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                          aria-label="Filtrar por período"
                        >
                          <option value={7}>Últimos 7 dias</option>
                          <option value={30}>Últimos 30 dias</option>
                          <option value={90}>Últimos 90 dias</option>
                          <option value={365}>Últimos 12 meses</option>
                        </select>
                      </label>

                      <label className="text-sm text-slate-300 flex flex-col gap-1">
                        Tipo de usuário
                        <select
                          value={userType}
                          onChange={(e) => {
                            const next = e.target.value;
                            setUserType(next);
                          }}
                          className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                          aria-label="Filtrar por tipo de usuário"
                        >
                          <option value="all">Todos</option>
                          <option value="active">Ativos no período</option>
                          <option value="inactive">Inativos no período</option>
                        </select>
                      </label>

                      <label className="text-sm text-slate-300 flex flex-col gap-1">
                        Busca
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                            placeholder="Nome ou email"
                            aria-label="Buscar usuário"
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-slate-200 font-bold flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-300" />
                      Usuários
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {snapshot.totalFiltered}/{snapshot.totalAll}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-3">
                      <div className="text-xs text-slate-500">Ativos</div>
                      <div className="text-2xl font-bold text-white" aria-label="Usuários ativos">
                        {formatNumber(snapshot.activeUsers)}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-3">
                      <div className="text-xs text-slate-500">Total</div>
                      <div className="text-2xl font-bold text-white" aria-label="Total de usuários">
                        {formatNumber(snapshot.totalFiltered)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="text-slate-300 font-bold mb-1">XP total</div>
                  <div className="text-3xl font-bold text-white">{formatNumber(snapshot.totalXp)}</div>
                  <div className="text-xs text-slate-500 mt-1">Média: {formatDecimal(snapshot.avgXp)} XP</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="text-slate-300 font-bold mb-1">Pontuação total</div>
                  <div className="text-3xl font-bold text-white">{formatNumber(snapshot.totalScore)}</div>
                  <div className="text-xs text-slate-500 mt-1">Média: {formatDecimal(snapshot.avgScore)}</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="text-slate-300 font-bold mb-1">Badges</div>
                  <div className="text-3xl font-bold text-white">{formatNumber(snapshot.totalBadges)}</div>
                  <div className="text-xs text-slate-500 mt-1">Somatório no recorte atual</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-slate-200 font-bold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-300" />
                      Tendência (badges desbloqueados/dia)
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{rangeDays}d</div>
                  </div>
                  <Sparkline points={snapshot.trendPoints} className="w-full text-amber-300" />
                  <div className="mt-2 flex justify-between text-xs text-slate-500 font-mono">
                    <span>{snapshot.trendPoints[0]?.day || '-'}</span>
                    <span>{snapshot.trendPoints[snapshot.trendPoints.length - 1]?.day || '-'}</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="text-slate-200 font-bold mb-3">Top usuários (XP)</div>
                  <div className="space-y-2">
                    {snapshot.topByXp.length === 0 ? (
                      <div className="text-sm text-slate-500">Nenhum usuário encontrado.</div>
                    ) : (
                      snapshot.topByXp.map((u) => (
                        <div key={u.id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{u.name}</div>
                            <div className="text-xs text-slate-500 truncate">{u.email}</div>
                          </div>
                          <div className="text-sm font-mono text-amber-200">{formatNumber(u.xp)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-xl font-display font-bold text-white">Evolução por usuário</h2>
                  <div className="text-xs text-slate-500 font-mono">{snapshot.users.length} itens</div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950/20">
                  <table className="min-w-full md:min-w-[1000px] w-full text-left">
                    <thead className="bg-slate-900/40">
                      <tr className="text-xs text-slate-400">
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('name')}>Nome</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('email')}>Email</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('xp')}>XP</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('score')}>Score</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('badgesCount')}>Badges</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('streak')}>Streak</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('timeSpentSeconds')}>Permanência</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort('lastLoginDate')}>Último login</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.users.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                            Nenhum dado para exibir com os filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        snapshot.users.map((u) => (
                          <tr key={u.id} className="border-t border-slate-800/80 text-sm">
                            <td className="px-4 py-3 text-white font-semibold">{u.name}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono text-xs">{u.email}</td>
                            <td className="px-4 py-3 text-amber-200 font-mono">{formatNumber(u.xp)}</td>
                            <td className="px-4 py-3 text-slate-200 font-mono">{formatNumber(u.score)}</td>
                            <td className="px-4 py-3 text-slate-200 font-mono">{formatNumber(u.badgesCount)}</td>
                            <td className="px-4 py-3 text-slate-200 font-mono">{formatNumber(u.streak)}</td>
                            <td className="px-4 py-3 text-slate-200 font-mono">{formatDuration(u.timeSpentSeconds)}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono text-xs">{u.lastLoginDate}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  u.activeInPeriod
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : 'bg-slate-500/10 text-slate-300 border-slate-500/30'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-slate-200 font-bold flex items-center gap-2">
                      <Filter className="w-4 h-4 text-amber-300" />
                      Filtros
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={exportFeedbackCsv}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors text-sm font-bold"
                      >
                        <Download className="w-4 h-4" />
                        CSV
                      </button>
                      <button
                        type="button"
                        onClick={exportFeedbackPdf}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors text-sm font-bold"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <label className="text-sm text-slate-300 flex flex-col gap-1">
                      Período
                      <select
                        value={feedbackRangeDays}
                        onChange={(e) => setFeedbackRangeDays(Number(e.target.value))}
                        className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                        aria-label="Filtrar avaliações por período"
                      >
                        <option value={7}>Últimos 7 dias</option>
                        <option value={30}>Últimos 30 dias</option>
                        <option value={90}>Últimos 90 dias</option>
                        <option value={365}>Últimos 12 meses</option>
                      </select>
                    </label>

                    <label className="text-sm text-slate-300 flex flex-col gap-1">
                      Tipo de usuário
                      <select
                        value={feedbackUserType}
                        onChange={(e) => setFeedbackUserType(e.target.value)}
                        className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                        aria-label="Filtrar avaliações por tipo de usuário"
                      >
                        <option value="all">Todos</option>
                        <option value="autenticado">Autenticado</option>
                        <option value="anonimo">Anônimo</option>
                      </select>
                    </label>

                    <label className="text-sm text-slate-300 flex flex-col gap-1">
                      Score (mín)
                      <input
                        value={feedbackScoreMin}
                        onChange={(e) => setFeedbackScoreMin(e.target.value)}
                        inputMode="numeric"
                        className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                        placeholder="0"
                        aria-label="Score mínimo"
                      />
                    </label>

                    <label className="text-sm text-slate-300 flex flex-col gap-1">
                      Score (máx)
                      <input
                        value={feedbackScoreMax}
                        onChange={(e) => setFeedbackScoreMax(e.target.value)}
                        inputMode="numeric"
                        className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                        placeholder="999"
                        aria-label="Score máximo"
                      />
                    </label>

                    <label className="text-sm text-slate-300 flex flex-col gap-1 md:col-span-2">
                      Busca
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          value={feedbackQuery}
                          onChange={(e) => setFeedbackQuery(e.target.value)}
                          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                          placeholder="Nome, email ou conteúdo"
                          aria-label="Buscar avaliação"
                        />
                      </div>
                    </label>

                    <label className="text-sm text-slate-300 flex flex-col gap-1">
                      Ordenação
                      <select
                        value={feedbackSortKey}
                        onChange={(e) => setFeedbackSortKey(e.target.value)}
                        className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                        aria-label="Ordenar avaliações"
                      >
                        <option value="createdAt">Data</option>
                        <option value="score">Score</option>
                        <option value="level">Nível</option>
                      </select>
                    </label>

                    <label className="text-sm text-slate-300 flex flex-col gap-1">
                      Direção
                      <select
                        value={feedbackSortDir}
                        onChange={(e) => setFeedbackSortDir(e.target.value)}
                        className="bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                        aria-label="Direção de ordenação"
                      >
                        <option value="desc">Desc</option>
                        <option value="asc">Asc</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="text-slate-200 font-bold flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-300" />
                      Avaliações
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {feedbackSnapshot.totalFiltered}/{feedbackSnapshot.totalAll}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-3">
                      <div className="text-xs text-slate-500">Respostas</div>
                      <div className="text-2xl font-bold text-white">{formatNumber(feedbackSnapshot.totalFiltered)}</div>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-950/30 p-3">
                      <div className="text-xs text-slate-500">CTA clicks</div>
                      <div className="text-2xl font-bold text-white">{formatNumber(feedbackSnapshot.clicksTotal)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="text-slate-300 font-bold mb-1">Média UX</div>
                  <div className="text-3xl font-bold text-white">{formatDecimal(feedbackSnapshot.summary.uxOverall)}</div>
                  <div className="text-xs text-slate-500 mt-1">Escala 1-5</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="text-slate-300 font-bold mb-1">Média Aprendizado</div>
                  <div className="text-3xl font-bold text-white">{formatDecimal(feedbackSnapshot.summary.learningOverall)}</div>
                  <div className="text-xs text-slate-500 mt-1">Escala 1-5</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="text-slate-300 font-bold mb-1">Score médio</div>
                  <div className="text-3xl font-bold text-white">{formatDecimal(feedbackSnapshot.summary.scoreAvg)}</div>
                  <div className="text-xs text-slate-500 mt-1">Pontuação por completude</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="text-slate-300 font-bold mb-1">Respostas totais</div>
                  <div className="text-3xl font-bold text-white">{formatNumber(feedbackSnapshot.totalAll)}</div>
                  <div className="text-xs text-slate-500 mt-1">Base histórica</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-slate-200 font-bold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-300" />
                      Tendência (respostas/dia)
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{feedbackRangeDays}d</div>
                  </div>
                  <Sparkline points={feedbackSnapshot.trendPoints} className="w-full text-amber-300" />
                  <div className="mt-2 flex justify-between text-xs text-slate-500 font-mono">
                    <span>{feedbackSnapshot.trendPoints[0]?.day || '-'}</span>
                    <span>{feedbackSnapshot.trendPoints[feedbackSnapshot.trendPoints.length - 1]?.day || '-'}</span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-700 rounded-2xl p-5">
                  <div className="text-slate-200 font-bold mb-3">Atalhos</div>
                  <div className="space-y-2 text-sm">
                    <button
                      type="button"
                      onClick={exportFeedbackCsv}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors font-bold"
                    >
                      <Download className="w-4 h-4" />
                      Exportar CSV
                    </button>
                    <button
                      type="button"
                      onClick={exportFeedbackPdf}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors font-bold"
                    >
                      <FileText className="w-4 h-4" />
                      Exportar PDF
                    </button>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 font-mono">PDF abre diálogo de impressão (Salvar como PDF).</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-xl font-display font-bold text-white">Respostas coletadas</h2>
                  <div className="text-xs text-slate-500 font-mono">{feedbackSnapshot.responses.length} itens</div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950/20">
                  <table className="min-w-[900px] w-full text-left">
                    <thead className="bg-slate-900/40">
                      <tr className="text-xs text-slate-400">
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleFeedbackSort('createdAt')}>Data</th>
                        <th className="px-4 py-3">Usuário</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleFeedbackSort('score')}>Score</th>
                        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleFeedbackSort('level')}>Nível</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackSnapshot.responses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                            Nenhuma avaliação encontrada com os filtros atuais.
                          </td>
                        </tr>
                      ) : (
                        feedbackSnapshot.responses.slice(0, 200).map((r) => (
                          <tr key={r.id} className="border-t border-slate-800/80 text-sm">
                            <td className="px-4 py-3 text-slate-200 font-mono text-xs">{String(r.createdAt || '').slice(0, 19).replace('T', ' ')}</td>
                            <td className="px-4 py-3 text-white font-semibold">{r?.user?.name || r?.user?.email || '-'}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono text-xs">{r?.user?.type || '-'}</td>
                            <td className="px-4 py-3 text-amber-200 font-mono">{formatNumber(Number(r.score || 0))}</td>
                            <td className="px-4 py-3 text-slate-200 font-mono">{r.level || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {feedbackSnapshot.responses.length > 200 && (
                  <div className="mt-2 text-xs text-slate-500 font-mono">Exibindo 200 itens. Use filtros para refinar.</div>
                )}
              </div>
            </>
          )}

        </MotionDiv>
      </div>
    </div>
  );
};

export default AdminPanel;
