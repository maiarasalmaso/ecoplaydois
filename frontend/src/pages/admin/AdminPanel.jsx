import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, RefreshCw, Shield, Users, Search, ChevronDown, ChevronRight, MessageSquare, Calendar, User, Mail } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import api from '../../services/api';

const formatNumber = (value) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

const AdminPanel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, logout, loading: authLoading } = useAuth();

  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expanded states
  const [expandedUsers, setExpandedUsers] = useState({});

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
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

  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // ─── FILTER & GROUP LOGIC ───

  // 1. Filter raw list by Date & Search
  const filteredRaw = feedback.filter((f) => {
    // Date Filter
    if (dateStart) {
      const d = new Date(f.created_at).getTime();
      const start = new Date(dateStart).getTime();
      if (d < start) return false;
    }
    if (dateEnd) {
      const d = new Date(f.created_at).getTime();
      const end = new Date(dateEnd).setHours(23, 59, 59, 999);
      if (d > end) return false;
    }

    // Search Filter (Name or Email)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const name = (f.full_name || '').toLowerCase();
      const email = (f.email || '').toLowerCase();
      if (!name.includes(term) && !email.includes(term)) return false;
    }

    // CONTENT CHECK: Must have at least one text comment
    const hasComment =
      f.ux?.ux_open_like ||
      f.ux?.ux_open_improve ||
      f.ux?.ux_open_ideas;

    return Boolean(hasComment);
  });

  // 2. Group by User (using user_id or email as key fallback)
  const groupedFeedback = filteredRaw.reduce((acc, curr) => {
    const key = curr.user_id || curr.email || 'anon';
    if (!acc[key]) {
      acc[key] = {
        user_id: curr.user_id,
        full_name: curr.full_name || 'Anônimo',
        email: curr.email || '',
        comments: []
      };
    }
    acc[key].comments.push(curr);
    return acc;
  }, {});

  // 3. Convert to array and Sort by most recent comment
  const groupedList = Object.values(groupedFeedback).sort((a, b) => {
    // Sort by latest comment date in each group
    const latestA = Math.max(...a.comments.map(c => new Date(c.created_at).getTime()));
    const latestB = Math.max(...b.comments.map(c => new Date(c.created_at).getTime()));
    return latestB - latestA;
  });

  const MotionDiv = motion.div;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
        <div className="w-12 h-12 border-4 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 bg-theme-bg-primary text-theme-text-primary transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-theme-accent hover:text-theme-accent-2 transition-colors font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao site
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-accent-surface border border-theme-accent-border text-theme-accent hover:bg-theme-accent/20 transition-colors font-semibold shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.2)]"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-bg-tertiary border border-theme-border text-theme-text-secondary hover:bg-theme-bg-secondary hover:text-theme-text-primary transition-colors"
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
            <div className="w-12 h-12 rounded-2xl bg-theme-accent-surface text-theme-accent flex items-center justify-center border border-theme-accent-border shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.3)]">
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
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300 ${tab === 'users'
                ? 'bg-theme-accent text-theme-bg-primary border-theme-accent shadow-[0_0_18px_rgba(var(--theme-accent-rgb),0.4)]'
                : 'bg-theme-bg-tertiary/80 text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary hover:text-theme-text-primary'
                }`}
            >
              Usuários ({users.length})
            </button>
            <button
              onClick={() => setTab('feedback')}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300 ${tab === 'feedback'
                ? 'bg-theme-accent text-theme-bg-primary border-theme-accent shadow-[0_0_18px_rgba(var(--theme-accent-rgb),0.4)]'
                : 'bg-theme-bg-tertiary/80 text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary hover:text-theme-text-primary'
                }`}
            >
              Comentários ({filteredRaw.length})
            </button>
            <button
              onClick={() => setTab('evolution')}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-300 ${tab === 'evolution'
                ? 'bg-theme-accent text-theme-bg-primary border-theme-accent shadow-[0_0_18px_rgba(var(--theme-accent-rgb),0.4)]'
                : 'bg-theme-bg-tertiary/80 text-theme-text-secondary border-theme-border hover:bg-theme-bg-secondary hover:text-theme-text-primary'
                }`}
            >
              Evolução
            </button>
          </div>

          {/* Content */}
          {error && <div className="p-4 bg-red-500/10 text-red-400 rounded-xl mb-4 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">{error}</div>}

          {/* ──────────────── USERS TAB ──────────────── */}
          {tab === 'users' && (
            <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-bg-tertiary/20 backdrop-blur-sm">
              <table className="w-full text-left">
                <thead className="bg-theme-bg-tertiary/40 border-b border-theme-border/50">
                  <tr className="text-xs text-theme-text-tertiary uppercase tracking-wider font-semibold">
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
                      <tr key={u.id} className="hover:bg-theme-bg-tertiary/30 transition-colors duration-200">
                        <td className="px-6 py-4 font-bold text-theme-text-primary text-sm">{u.full_name}</td>
                        <td className="px-6 py-4 text-theme-text-secondary text-sm">{u.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-md font-bold tracking-wide border ${u.role === 'ADMIN'
                              ? 'bg-theme-warning/20 text-theme-warning border-theme-warning/30'
                              : 'bg-theme-bg-tertiary text-theme-text-tertiary border-theme-border'
                              }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-theme-text-tertiary text-sm font-mono">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ──────────────── FEEDBACK (COMMENTS) TAB ──────────────── */}
          {tab === 'feedback' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-theme-bg-tertiary/20 border border-theme-border items-center backdrop-blur-sm">
                <div className="flex-1 w-full relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-tertiary group-focus-within:text-theme-accent transition-colors" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg-primary border border-theme-border text-theme-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent transition-all placeholder:text-theme-text-tertiary/50"
                  />
                </div>

                <div className="flex gap-3 w-full md:w-auto items-end">
                  <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                    <label className="text-[10px] uppercase font-bold text-theme-text-tertiary ml-1 tracking-wider">De</label>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full md:w-auto px-3 py-2 rounded-xl bg-theme-bg-primary border border-theme-border text-theme-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent transition-all cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                    <label className="text-[10px] uppercase font-bold text-theme-text-tertiary ml-1 tracking-wider">Até</label>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="w-full md:w-auto px-3 py-2 rounded-xl bg-theme-bg-primary border border-theme-border text-theme-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {(searchTerm || dateStart || dateEnd) && (
                  <button
                    onClick={() => { setSearchTerm(''); setDateStart(''); setDateEnd(''); }}
                    className="px-4 py-2.5 h-auto text-xs font-bold text-theme-danger hover:bg-theme-danger/10 border border-transparent hover:border-theme-danger/20 rounded-xl transition-all whitespace-nowrap"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>

              {/* Feedback List Grouped by User */}
              <div className="space-y-4">
                {groupedList.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-theme-border bg-theme-bg-tertiary/10 border-dashed">
                    <MessageSquare className="w-12 h-12 text-theme-text-tertiary mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-theme-text-secondary">Nenhum comentário encontrado</h3>
                    <p className="text-theme-text-tertiary mt-2 text-sm">Tente ajustar os filtros ou aguarde novas avaliações.</p>
                  </div>
                ) : (
                  groupedList.map((group, idx) => {
                    const isExpanded = expandedUsers[group.user_id || group.email] ?? true;

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={group.user_id || group.email || idx}
                        className="rounded-2xl border border-theme-border bg-theme-bg-secondary overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                      >
                        {/* User Header Card */}
                        <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-theme-bg-tertiary/40 transition-colors duration-200"
                          onClick={() => toggleUserExpansion(group.user_id || group.email)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-theme-accent-surface to-transparent border border-theme-accent-border flex items-center justify-center text-theme-accent shadow-inner">
                              <User className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-theme-text-primary text-lg flex items-center gap-2">
                                {group.full_name}
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-theme-bg-tertiary text-theme-text-tertiary border border-theme-border">
                                  {group.comments.length} {group.comments.length === 1 ? 'comentário' : 'comentários'}
                                </span>
                              </h3>
                              <div className="text-sm text-theme-text-tertiary flex items-center gap-1.5 mt-0.5 font-mono">
                                <Mail className="w-3.5 h-3.5" /> {group.email}
                              </div>
                            </div>
                          </div>
                          <div className="text-theme-text-tertiary p-2 rounded-full hover:bg-theme-bg-tertiary transition-colors">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                        </div>

                        {/* Comments List */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-theme-border/50 bg-theme-bg-tertiary/5"
                            >
                              <div className="p-5 space-y-6">
                                {group.comments.map((comment, cIdx) => (
                                  <div key={comment.id} className="relative pl-6 border-l-2 border-theme-accent-border hover:border-theme-accent transition-colors duration-300 group/comment">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-theme-bg-secondary border-2 border-theme-accent group-hover/comment:scale-110 transition-transform shadow-[0_0_8px_rgba(var(--theme-accent-rgb),0.5)]"></div>

                                    <div className="mb-3 flex items-center gap-2 text-xs text-theme-text-tertiary font-mono uppercase tracking-wider">
                                      <Calendar className="w-3.5 h-3.5 text-theme-accent" />
                                      <span className="font-bold text-theme-text-secondary">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                      </span>
                                      <span className="opacity-50 mx-1">|</span>
                                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {comment.ux?.ux_open_like && (
                                        <div className="md:col-span-1 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-4 rounded-xl hover:border-emerald-500/40 transition-colors shadow-sm">
                                          <div className="text-xs font-bold text-emerald-500 uppercase mb-2 flex items-center gap-1.5 tracking-wide">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span> Gostou
                                          </div>
                                          <p className="text-sm text-theme-text-secondary whitespace-pre-wrap leading-relaxed italic">"{comment.ux.ux_open_like}"</p>
                                        </div>
                                      )}

                                      {comment.ux?.ux_open_improve && (
                                        <div className="md:col-span-1 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-4 rounded-xl hover:border-amber-500/40 transition-colors shadow-sm">
                                          <div className="text-xs font-bold text-amber-500 uppercase mb-2 flex items-center gap-1.5 tracking-wide">
                                            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]"></span> Melhorar
                                          </div>
                                          <p className="text-sm text-theme-text-secondary whitespace-pre-wrap leading-relaxed italic">"{comment.ux.ux_open_improve}"</p>
                                        </div>
                                      )}

                                      {comment.ux?.ux_open_ideas && (
                                        <div className="md:col-span-1 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 p-4 rounded-xl hover:border-blue-500/40 transition-colors shadow-sm">
                                          <div className="text-xs font-bold text-blue-500 uppercase mb-2 flex items-center gap-1.5 tracking-wide">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span> Ideia
                                          </div>
                                          <p className="text-sm text-theme-text-secondary whitespace-pre-wrap leading-relaxed italic">"{comment.ux.ux_open_ideas}"</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ──────────────── EVOLUTION TAB ──────────────── */}
          {tab === 'evolution' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-theme-bg-secondary/50 p-6 rounded-2xl border border-theme-border relative overflow-hidden group hover:bg-theme-bg-secondary transition-colors duration-300 shadow-sm hover:shadow-lg">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                    <Users className="w-24 h-24 text-theme-accent" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-theme-text-tertiary mb-1 uppercase tracking-wider">Total de Usuários</p>
                    <h3 className="text-4xl font-display font-bold text-theme-text-primary drop-shadow-sm">{users.length}</h3>
                  </div>
                </div>
                {/* Note: Removed Global Score and Time Spent if they rely on heavy calculations, but these are from 'users' list so it is fine to keep if users data is lightweight. Assuming users data has score/time_spent as before. */}
                <div className="bg-theme-bg-secondary/50 p-6 rounded-2xl border border-theme-border relative overflow-hidden group hover:bg-theme-bg-secondary transition-colors duration-300 shadow-sm hover:shadow-lg">
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-theme-text-tertiary mb-1 uppercase tracking-wider">Pontuação Total Global</p>
                    <h3 className="text-4xl font-display font-bold text-emerald-500 drop-shadow-sm">
                      {formatNumber(users.reduce((acc, u) => acc + (Number(u.score) || 0), 0))}
                    </h3>
                  </div>
                </div>
                <div className="bg-theme-bg-secondary/50 p-6 rounded-2xl border border-theme-border relative overflow-hidden group hover:bg-theme-bg-secondary transition-colors duration-300 shadow-sm hover:shadow-lg">
                  <div className="relative z-10">
                    <p className="text-sm font-medium text-theme-text-tertiary mb-1 uppercase tracking-wider">Tempo Total Jogado</p>
                    <h3 className="text-4xl font-display font-bold text-blue-500 drop-shadow-sm">
                      {Math.floor(users.reduce((acc, u) => acc + (Number(u.time_spent) || 0), 0) / 60)} <span className="text-lg text-theme-text-secondary font-normal">minutos</span>
                    </h3>
                  </div>
                </div>
              </div>

              <div className="bg-theme-bg-secondary/30 rounded-2xl border border-theme-border overflow-hidden">
                <div className="p-6 border-b border-theme-border/50 bg-theme-bg-tertiary/10">
                  <h3 className="text-xl font-bold text-theme-text-primary flex items-center gap-2">
                    <Users className="w-5 h-5 text-theme-text-tertiary" />
                    Evolução dos Usuários
                  </h3>
                  <p className="text-sm text-theme-text-tertiary mt-1">Detalhes de desempenho e engajamento individual.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-theme-bg-tertiary/40 text-xs text-theme-text-tertiary uppercase font-medium tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Usuário</th>
                        <th className="px-6 py-4 text-right">Pontuação (XP)</th>
                        <th className="px-6 py-4 text-right">Tempo Logado (min)</th>
                        <th className="px-6 py-4 text-center">Nível Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border/50">
                      {users.sort((a, b) => (b.score || 0) - (a.score || 0)).map((user, idx) => (
                        <tr key={user.id} className="hover:bg-theme-bg-tertiary/30 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-theme-bg-tertiary flex items-center justify-center text-sm font-bold text-theme-text-secondary border border-theme-border shadow-sm">
                                {user.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <div className="font-bold text-theme-text-primary flex items-center gap-2 text-sm">
                                  {user.full_name}
                                  {idx < 3 && <span className="text-lg drop-shadow-md">👑</span>}
                                </div>
                                <div className="text-xs text-theme-text-tertiary">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-medium text-emerald-500 text-sm">
                            {formatNumber(user.score || 0)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-theme-text-secondary text-sm">
                            {Math.floor((user.time_spent || 0) / 60)} min
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm">
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
