import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Filter, LogOut, RefreshCw, Search, Shield, ArrowLeft, Users, AlertTriangle, FileText, Star, ChevronDown, ChevronRight } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import api from '../../services/api';

const ADMIN_ACCENT = {
  dark: {
    color: '#fb923c',
    colorAlt: '#f97316',
    surface: 'rgba(251,146,60,0.2)',
    border: 'rgba(251,146,60,0.6)',
    glow: 'rgba(251,146,60,0.32)',
  },
  light: {
    color: '#f97316',
    colorAlt: '#ea580c',
    surface: 'rgba(249,115,22,0.18)',
    border: 'rgba(249,115,22,0.5)',
    glow: 'rgba(249,115,22,0.28)',
  },
};

const UX_LIKERT = [
  { id: 'ux_navigation', label: 'Navegação Intuitiva' },
  { id: 'ux_design', label: 'Design Visual' },
  { id: 'ux_clarity', label: 'Clareza dos Textos' },
  { id: 'ux_speed', label: 'Performance' },
  { id: 'ux_satisfaction', label: 'Satisfação Geral' },
  { id: 'ux_recommend', label: 'Recomendação' },
];

const LEARNING_LIKERT = [
  { id: 'learn_effective', label: 'Aprendizado Novo' },
  { id: 'learn_reinforce', label: 'Reforço de Práticas' },
  { id: 'learn_level', label: 'Adequação de Nível' },
  { id: 'learn_motivation', label: 'Motivação' },
];

const formatNumber = (value) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

const AdminPanel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, logout, loading: authLoading } = useAuth();

  const isLight = theme === 'light';
  const adminAccent = isLight ? ADMIN_ACCENT.light : ADMIN_ACCENT.dark;
  const adminContrast = isLight ? '#f8fafc' : '#0b1323';

  const [tab, setTab] = useState('users');
  const [feedbackSubTab, setFeedbackSubTab] = useState('chart');
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFeedback, setExpandedFeedback] = useState(null); // Track expanded row ID

  // Date Filters
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        navigate('/admin');
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, feedbackRes] = await Promise.all([
        api.get('/users').catch((err) => {
          console.error('Users API', err);
          return { data: [] };
        }),
        api.get('/feedback').catch((err) => {
          console.error('Feedback API', err);
          return { data: [] };
        }),
      ]);
      setUsers(usersRes.data);
      setFeedback(feedbackRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Falha ao carregar dados do painel.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const getReviewRating = (f) => {
    // If rating exists, use it. If not, try to determine from UX satisfaction or default to 0
    if (f.rating) return Number(f.rating);
    if (f.ux?.ux_satisfaction) return Number(f.ux.ux_satisfaction);
    return 0;
  };

  const filteredFeedback = feedback
    .map(f => ({ ...f, computedRating: getReviewRating(f) }))
    .filter((f) => {
      if (!dateStart && !dateEnd) return true;
      const d = new Date(f.created_at).getTime();
      const start = dateStart ? new Date(dateStart).getTime() : 0;
      const end = dateEnd ? new Date(dateEnd).setHours(23, 59, 59, 999) : Infinity;
      return d >= start && d <= end;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Filter only feedback with actual comments for the comments tab
  const commentsList = filteredFeedback.filter(f =>
    f.ux?.ux_open_like || f.ux?.ux_open_improve || f.ux?.ux_open_ideas
  );

  const averageRating =
    filteredFeedback.length > 0
      ? filteredFeedback.reduce((acc, curr) => acc + (curr.computedRating || 0), 0) / filteredFeedback.length
      : 0;

  const MotionDiv = motion.div;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden pb-20"
      style={{
        '--admin-accent': adminAccent.color,
        '--admin-accent-2': adminAccent.colorAlt,
        '--admin-accent-surface': adminAccent.surface,
        '--admin-accent-border': adminAccent.border,
        '--admin-accent-glow': adminAccent.glow,
        '--admin-contrast': adminContrast,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-[color:var(--admin-accent)] hover:text-[color:var(--admin-accent-2)] transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao site
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--admin-accent-surface)] border border-[color:var(--admin-accent-border)] text-[color:var(--admin-accent)] hover:bg-[color:var(--admin-accent)]/20 transition-colors font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>

        <MotionDiv
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-theme-bg-secondary/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-theme-border"
        >
          {/* Dashboard Title */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[color:var(--admin-accent-surface)] text-[color:var(--admin-accent)] flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-theme-text-primary">Painel do Administrador</h1>
              <p className="text-theme-text-tertiary">Visão consolidada do sistema.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              onClick={() => setTab('users')}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${tab === 'users'
                ? 'bg-[color:var(--admin-accent)] text-[color:var(--admin-contrast)] border-[color:var(--admin-accent-border)] shadow-[0_0_18px_var(--admin-accent-glow)]'
                : 'bg-theme-bg-tertiary/80 text-theme-text-primary border-theme-border hover:bg-theme-bg-secondary'
                }`}
            >
              Usuários ({users.length})
            </button>
            <button
              onClick={() => setTab('feedback')}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${tab === 'feedback'
                ? 'bg-[color:var(--admin-accent)] text-[color:var(--admin-contrast)] border-[color:var(--admin-accent-border)] shadow-[0_0_18px_var(--admin-accent-glow)]'
                : 'bg-theme-bg-tertiary/80 text-theme-text-primary border-theme-border hover:bg-theme-bg-secondary'
                }`}
            >
              Avaliações ({filteredFeedback.length})
            </button>
            <button
              onClick={() => setTab('evolution')}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${tab === 'evolution'
                ? 'bg-[color:var(--admin-accent)] text-[color:var(--admin-contrast)] border-[color:var(--admin-accent-border)] shadow-[0_0_18px_var(--admin-accent-glow)]'
                : 'bg-theme-bg-tertiary/80 text-theme-text-primary border-theme-border hover:bg-theme-bg-secondary'
                }`}
            >
              Evolução
            </button>
          </div>

          {/* Content */}
          {error && <div className="p-4 bg-red-500/20 text-red-300 rounded-xl mb-4 border border-red-500/50">{error}</div>}

          {tab === 'users' && (
            <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-bg-tertiary/20">
              <table className="w-full text-left">
                <thead className="bg-theme-bg-tertiary/40">
                  <tr className="text-xs text-theme-text-tertiary uppercase">
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Data Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-theme-text-tertiary">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-theme-bg-tertiary/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-theme-text-primary">{u.full_name}</td>
                        <td className="px-6 py-4 text-theme-text-secondary">{u.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-1 rounded font-bold ${u.role === 'ADMIN'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-theme-bg-tertiary text-theme-text-tertiary'
                              }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-theme-text-tertiary text-sm">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'feedback' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap items-end gap-4 p-4 rounded-2xl bg-theme-bg-tertiary/10 border border-theme-border">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-theme-text-secondary uppercase">De</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="block w-full px-3 py-2 rounded-xl bg-theme-bg-secondary border border-theme-border text-theme-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-theme-text-secondary uppercase">Até</label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="block w-full px-3 py-2 rounded-xl bg-theme-bg-secondary border border-theme-border text-theme-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]"
                  />
                </div>
                {(dateStart || dateEnd) && (
                  <button
                    onClick={() => { setDateStart(''); setDateEnd(''); }}
                    className="px-4 py-2 rounded-xl bg-theme-bg-secondary border border-theme-border text-theme-text-secondary hover:text-red-400 hover:border-red-400/50 transition-colors text-sm font-bold"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Feedback Sub-Tabs */}
              <div className="flex gap-4 border-b border-theme-border pb-2">
                <button
                  onClick={() => setFeedbackSubTab('chart')}
                  className={`pb-2 text-sm font-bold transition-all relative ${feedbackSubTab === 'chart'
                    ? 'text-[color:var(--admin-accent)]'
                    : 'text-theme-text-secondary hover:text-theme-text-primary'
                    }`}
                >
                  <BarChart3 className="inline mr-2 w-4 h-4" />
                  Gráfico de Votações
                  {feedbackSubTab === 'chart' && (
                    <motion.div
                      layoutId="activeFeedbackTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--admin-accent)]"
                    />
                  )}
                </button>
                <button
                  onClick={() => setFeedbackSubTab('comments')}
                  className={`pb-2 text-sm font-bold transition-all relative ${feedbackSubTab === 'comments'
                    ? 'text-[color:var(--admin-accent)]'
                    : 'text-theme-text-secondary hover:text-theme-text-primary'
                    }`}
                >
                  <FileText className="inline mr-2 w-4 h-4" />
                  Comentários ({filteredFeedback.length})
                  {feedbackSubTab === 'comments' && (
                    <motion.div
                      layoutId="activeFeedbackTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[color:var(--admin-accent)]"
                    />
                  )}
                </button>
              </div>

              {/* Chart View */}
              {feedbackSubTab === 'chart' && (
                <div className="p-6 rounded-2xl border border-theme-border bg-theme-bg-tertiary/20">
                  <h3 className="text-xl font-bold text-theme-text-primary mb-6">Distribuição de Avaliações</h3>
                  {filteredFeedback.length === 0 ? (
                    <p className="text-theme-text-tertiary">Ainda não há dados suficientes para o gráfico no período selecionado.</p>
                  ) : (
                    <div className="h-64 flex items-end justify-center gap-8 px-4">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const count = filteredFeedback.filter((f) => Math.round(f.computedRating) === star).length;
                        const percentage = filteredFeedback.length > 0 ? (count / filteredFeedback.length) * 100 : 0;

                        return (
                          <div key={star} className="flex flex-col items-center gap-2 w-16 group">
                            <div className="relative w-full h-48 flex items-end justify-center bg-theme-bg-tertiary/30 rounded-lg overflow-hidden">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${percentage}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="w-full bg-[color:var(--admin-accent)] opacity-80 group-hover:opacity-100 transition-opacity relative"
                              >
                                {count > 0 && (
                                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-[color:var(--admin-accent)]">
                                    {count}
                                  </span>
                                )}
                              </motion.div>
                            </div>
                            <div className="flex items-center gap-1 font-bold text-theme-text-secondary">
                              {star} <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-border">
                      <div className="text-sm text-theme-text-tertiary">Total de Avaliações</div>
                      <div className="text-2xl font-bold text-theme-text-primary">{filteredFeedback.length}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-border">
                      <div className="text-sm text-theme-text-tertiary">Média Geral</div>
                      <div className="text-2xl font-bold text-[color:var(--admin-accent)]">
                        {averageRating.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-theme-bg-secondary border border-theme-border">
                      <div className="text-sm text-theme-text-tertiary">Semana Atual</div>
                      <div className="text-2xl font-bold text-theme-text-primary">
                        {
                          filteredFeedback.filter((f) => {
                            const date = new Date(f.created_at);
                            const now = new Date();
                            const diffTime = Math.abs(now - date);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return diffDays <= 7;
                          }).length
                        }
                      </div>
                    </div>
                  </div>

                  {/* Detailed Metrics Breakdown */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* UX Metrics */}
                    <div className="bg-theme-bg-secondary/30 p-6 rounded-2xl border border-theme-border">
                      <h4 className="font-bold text-theme-text-primary mb-6 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Experiência do Usuário
                      </h4>
                      <div className="space-y-4">
                        {UX_LIKERT.map((item) => {
                          const validReviews = filteredFeedback.filter((f) => f.ux && f.ux[item.id]);
                          const avg =
                            validReviews.length > 0
                              ? validReviews.reduce((acc, f) => acc + (Number(f.ux[item.id]) || 0), 0) /
                              validReviews.length
                              : 0;
                          return (
                            <div key={item.id}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-theme-text-secondary">{item.label}</span>
                                <span className="font-bold text-theme-text-primary">{avg.toFixed(1)}</span>
                              </div>
                              <div className="h-2 w-full bg-theme-bg-tertiary rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${isNaN(avg) ? 0 : (avg / 5) * 100}%` }}
                                  className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-in-out"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Learning Metrics */}
                    <div className="bg-theme-bg-secondary/30 p-6 rounded-2xl border border-theme-border">
                      <h4 className="font-bold text-theme-text-primary mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-500 fill-emerald-500" /> Impacto Educacional
                      </h4>
                      <div className="space-y-4">
                        {LEARNING_LIKERT.map((item) => {
                          const validReviews = filteredFeedback.filter((f) => f.learning && f.learning[item.id]);
                          const avg =
                            validReviews.length > 0
                              ? validReviews.reduce((acc, f) => acc + (Number(f.learning[item.id]) || 0), 0) /
                              validReviews.length
                              : 0;
                          return (
                            <div key={item.id}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-theme-text-secondary">{item.label}</span>
                                <span className="font-bold text-theme-text-primary">{avg.toFixed(1)}</span>
                              </div>
                              <div className="h-2 w-full bg-theme-bg-tertiary rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${isNaN(avg) ? 0 : (avg / 5) * 100}%` }}
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-in-out"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments View */}
              {feedbackSubTab === 'comments' && (
                <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-bg-tertiary/20">
                  <table className="w-full text-left">
                    <thead className="bg-theme-bg-tertiary/40">
                      <tr className="text-xs text-theme-text-tertiary uppercase">
                        <th className="px-6 py-4">Usuário</th>
                        <th className="px-6 py-4">Nota</th>
                        <th className="px-6 py-4">Comentário</th>
                        <th className="px-6 py-4">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/50">
                      {commentsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-theme-text-tertiary">
                            Nenhum comentário encontrado no período.
                          </td>
                        </tr>
                      ) : (
                        commentsList.map((f) => {
                          const isExpanded = expandedFeedback === f.id;
                          return (
                            <>
                              <tr
                                key={f.id}
                                className={`hover:bg-theme-bg-tertiary/30 transition-colors cursor-pointer ${isExpanded ? 'bg-theme-bg-tertiary/20' : ''
                                  }`}
                                onClick={() => setExpandedFeedback(isExpanded ? null : f.id)}
                              >
                                <td className="px-6 py-4">
                                  <div className="font-bold text-theme-text-primary flex items-center gap-2">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    {f.full_name || 'Anônimo'}
                                  </div>
                                  <div className="text-xs text-theme-text-tertiary font-normal ml-6">{f.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1 font-bold text-yellow-500 w-fit">
                                    {f.computedRating} <Star className="w-3 h-3 fill-yellow-500" />
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1 text-theme-text-secondary text-sm p-2 rounded bg-theme-bg-primary/50 border border-theme-border/50">
                                    {f.ux?.ux_open_like ? (
                                      <div>
                                        <span className="font-bold text-emerald-500/80 text-xs uppercase mr-1">Gostou:</span>
                                        {f.ux.ux_open_like}
                                      </div>
                                    ) : null}
                                    {f.ux?.ux_open_improve ? (
                                      <div>
                                        <span className="font-bold text-amber-500/80 text-xs uppercase mr-1">Melhorar:</span>
                                        {f.ux.ux_open_improve}
                                      </div>
                                    ) : null}
                                    {f.ux?.ux_open_ideas ? (
                                      <div>
                                        <span className="font-bold text-blue-500/80 text-xs uppercase mr-1">Ideia:</span>
                                        {f.ux.ux_open_ideas}
                                      </div>
                                    ) : null}
                                    {!f.ux?.ux_open_like && !f.ux?.ux_open_improve && !f.ux?.ux_open_ideas && (
                                      <div className="italic opacity-50 text-center">Sem comentário escrito</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-theme-text-tertiary text-sm">
                                  {new Date(f.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-theme-bg-tertiary/10">
                                  <td colSpan={5} className="px-6 py-4 border-b border-theme-border/30">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm"
                                    >
                                      <div>
                                        <h4 className="font-bold text-theme-text-primary mb-3 flex items-center gap-2">
                                          <Star className="w-4 h-4 text-amber-500" /> Experiência (UX)
                                        </h4>
                                        <div className="space-y-2">
                                          {UX_LIKERT.map((q) => (
                                            <div key={q.id} className="flex justify-between items-center border-b border-theme-border/30 pb-1">
                                              <span className="text-theme-text-secondary">{q.label}</span>
                                              <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                  <Star
                                                    key={s}
                                                    className={`w-3 h-3 ${s <= (f.ux?.[q.id] || 0)
                                                      ? 'fill-amber-500 text-amber-500'
                                                      : 'text-theme-border'
                                                      }`}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-theme-text-primary mb-3 flex items-center gap-2">
                                          <Shield className="w-4 h-4 text-emerald-500" /> Aprendizado
                                        </h4>
                                        <div className="space-y-2">
                                          {LEARNING_LIKERT.map((q) => (
                                            <div key={q.id} className="flex justify-between items-center border-b border-theme-border/30 pb-1">
                                              <span className="text-theme-text-secondary">{q.label}</span>
                                              <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                  <Star
                                                    key={s}
                                                    className={`w-3 h-3 ${s <= (f.learning?.[q.id] || 0)
                                                      ? 'fill-emerald-500 text-emerald-500'
                                                      : 'text-theme-border'
                                                      }`}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        {f.badges && f.badges.length > 0 && (
                                          <div className="mt-4">
                                            <h4 className="font-bold text-theme-text-primary mb-2 text-xs uppercase opacity-70">
                                              Conquistas
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                              {f.badges.map((b, idx) => (
                                                <span
                                                  key={idx}
                                                  className="inline-flex items-center px-2 py-1 rounded bg-theme-bg-tertiary border border-theme-border text-xs font-medium text-theme-text-secondary"
                                                >
                                                  {b}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'evolution' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-bg-secondary/50 p-6 rounded-2xl border border-theme-border relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="w-24 h-24 text-[color:var(--admin-accent)]" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-theme-text-tertiary mb-1">Total de Usuários</p>
                    <h3 className="text-4xl font-display font-bold text-theme-text-primary">{users.length}</h3>
                  </div>
                </div>
                <div className="bg-theme-bg-secondary/50 p-6 rounded-2xl border border-theme-border relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BarChart3 className="w-24 h-24 text-emerald-500" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-theme-text-tertiary mb-1">Pontuação Total Global</p>
                    <h3 className="text-4xl font-display font-bold text-emerald-500">
                      {formatNumber(users.reduce((acc, u) => acc + (Number(u.score) || 0), 0))}
                    </h3>
                  </div>
                </div>
                <div className="bg-theme-bg-secondary/50 p-6 rounded-2xl border border-theme-border relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <RefreshCw className="w-24 h-24 text-blue-500" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-theme-text-tertiary mb-1">Tempo Total Jogado</p>
                    <h3 className="text-4xl font-display font-bold text-blue-500">
                      {Math.floor(users.reduce((acc, u) => acc + (Number(u.time_spent) || 0), 0) / 60)} <span className="text-lg text-theme-text-secondary font-normal">minutos</span>
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-theme-bg-secondary/30 rounded-2xl border border-theme-border overflow-hidden">
                <div className="p-6 border-b border-theme-border/50">
                  <h3 className="text-xl font-bold text-theme-text-primary">Evolução dos Usuários</h3>
                  <p className="text-sm text-theme-text-tertiary">Detalhes de desempenho e engajamento individual.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-theme-bg-tertiary/40 text-xs text-theme-text-tertiary uppercase font-medium">
                      <tr>
                        <th className="px-6 py-4">Usuário</th>
                        <th className="px-6 py-4 text-right">Pontuação (XP)</th>
                        <th className="px-6 py-4 text-right">Tempo Logado (min)</th>
                        <th className="px-6 py-4 text-center">Nível Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/50">
                      {users.sort((a, b) => (b.score || 0) - (a.score || 0)).map((user, idx) => (
                        <tr key={user.id} className="hover:bg-theme-bg-tertiary/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-theme-bg-tertiary flex items-center justify-center text-sm font-bold text-theme-text-secondary border border-theme-border">
                                {user.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <div className="font-bold text-theme-text-primary flex items-center gap-2">
                                  {user.full_name}
                                  {idx < 3 && <span className="text-yellow-500">👑</span>}
                                </div>
                                <div className="text-xs text-theme-text-tertiary">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-medium text-emerald-500">
                            {formatNumber(user.score || 0)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-theme-text-secondary">
                            {Math.floor((user.time_spent || 0) / 60)} min
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                              Lvl {Math.floor(Math.sqrt((user.score || 0) / 100)) + 1}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </MotionDiv>
      </div>
    </div>
  );
};

export default AdminPanel;
