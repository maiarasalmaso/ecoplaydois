import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Award, BarChart3, Download, FileText, Lock, Star, Trophy, Sparkles, Gift, Shield, CheckCircle2, Leaf, TreePine, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useGameState } from '../context/GameStateContext';
import {
  buildFeedbackCsv,
  computeFeedbackSummary,
  downloadTextFile,
  listFeedbackResponses,
  openPrintableReport,
  saveFeedbackResponse,
} from '../utils/feedbackStore';
import { checkUserHasFeedback } from '../services/remoteDb';
import { playMagicPop, playCelebration, playHover, playClick, playKeystroke, playLevelUp } from '../utils/soundEffects';

/* ─── Question definitions ─── */
const UX_LIKERT = [
  { id: 'ux_navigation', label: 'A navegação é intuitiva.' },
  { id: 'ux_design', label: 'O design visual é agradável e consistente.' },
  { id: 'ux_clarity', label: 'As instruções e textos são claros.' },
  { id: 'ux_speed', label: 'A plataforma parece rápida e responsiva.' },
  { id: 'ux_satisfaction', label: 'Estou satisfeito(a) com a experiência geral.' },
  { id: 'ux_recommend', label: 'Eu recomendaria a plataforma para outras pessoas.' },
];

const UX_OPEN = [
  { id: 'ux_open_like', label: 'O que você mais gostou?', placeholder: 'Conte rapidamente o ponto mais positivo.' },
  { id: 'ux_open_improve', label: 'O que podemos melhorar?', placeholder: 'Diga o que te atrapalhou ou faltou.' },
  { id: 'ux_open_ideas', label: 'Ideias de novas funcionalidades', placeholder: 'Sugestões de melhorias ou novos recursos.' },
];

const LEARNING_LIKERT = [
  { id: 'learn_effective', label: 'Aprendi algo novo sobre sustentabilidade.' },
  { id: 'learn_reinforce', label: 'Os jogos reforçam boas práticas no dia a dia.' },
  { id: 'learn_level', label: 'O conteúdo está adequado ao meu nível.' },
  { id: 'learn_motivation', label: 'Me senti motivado(a) a continuar aprendendo.' },
];

/* ─── Helpers ─── */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const formatDecimal = (value) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0);

const countAnsweredLikert = (obj, ids) => ids.reduce((acc, id) => acc + (Number(obj?.[id]) >= 1 ? 1 : 0), 0);

const scoreOpen = (value) => {
  const s = String(value || '').trim();
  if (!s) return 0;
  if (s.length >= 10) return 15;
  return 8;
};

const computeScore = ({ ux, learning }) => {
  const uxLikertCount = countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id));
  const learningLikertCount = countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id));
  const openScore = UX_OPEN.reduce((acc, q) => acc + scoreOpen(ux?.[q.id]), 0);
  const base = (uxLikertCount + learningLikertCount) * 10 + openScore;
  const completionBonus = uxLikertCount === UX_LIKERT.length && learningLikertCount === LEARNING_LIKERT.length ? 20 : 0;
  return base + completionBonus;
};

const LEVELS = [
  { name: 'Semente', threshold: 0, Icon: Sprout, gradient: 'from-lime-400 to-green-500' },
  { name: 'Broto', threshold: 90, Icon: Leaf, gradient: 'from-green-400 to-emerald-500' },
  { name: 'Árvore', threshold: 130, Icon: TreePine, gradient: 'from-emerald-400 to-teal-500' },
  { name: 'Floresta', threshold: 170, Icon: Sparkles, gradient: 'from-teal-400 to-cyan-500' },
];

const computeLevel = (score) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].threshold) return LEVELS[i];
  }
  return LEVELS[0];
};

const BADGE_DEFINITIONS = [
  { id: 'ux_explorer', name: 'Explorador(a) da Experiência', icon: '🔍', color: '#f59e0b' },
  { id: 'learn_guardian', name: 'Guardião(ã) do Aprendizado', icon: '📚', color: '#10b981' },
  { id: 'master_validator', name: 'Validador(a) Mestre', icon: '🏆', color: '#8b5cf6' },
];

const computeBadges = ({ ux, learning }) => {
  const badges = [];
  const uxDone = countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id)) === UX_LIKERT.length;
  const learningDone = countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id)) === LEARNING_LIKERT.length;
  if (uxDone) badges.push(BADGE_DEFINITIONS[0]);
  if (learningDone) badges.push(BADGE_DEFINITIONS[1]);
  if (uxDone && learningDone) badges.push(BADGE_DEFINITIONS[2]);
  return badges;
};

/* ─── Animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

/* ─── Subcomponents ─── */
const LikertRow = ({ value, onChange, disabled, locked }) => {
  const selected = Number(value || 0);

  const handleSelect = (n) => {
    if (disabled || locked) return;
    onChange(n);
    if (n === 5) {
      playMagicPop();
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#4ade80', '#22c55e', '#ffffff'],
        disableForReducedMotion: true,
      });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[1, 2, 3, 4, 5].map((n) => {
        const isActive = selected >= n;
        return (
          <motion.button
            key={n}
            type="button"
            disabled={disabled || locked}
            onClick={() => handleSelect(n)}
            whileHover={!locked ? { scale: 1.15 } : {}}
            whileTap={!locked ? { scale: 0.9 } : {}}
            initial={{ scale: 1 }}
            animate={{
              scale: isActive ? 1.1 : 1,
              filter: isActive ? 'brightness(1.1)' : 'brightness(1)',
            }}
            className={`w-10 h-10 rounded-xl border-2 transition-all duration-300 flex items-center justify-center ${isActive
              ? 'bg-transparent border-[color:var(--feedback-accent)] shadow-[0_0_15px_var(--feedback-accent-glow)] scale-110'
              : 'bg-transparent border-theme-border opacity-50 hover:opacity-100 hover:border-[color:var(--feedback-accent-border)]'
              } ${disabled || locked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--feedback-accent)]`}
            aria-label={`Selecionar ${n}`}
          >
            <Star
              className={`w-5 h-5 transition-colors ${isActive ? 'text-[color:var(--feedback-accent)] fill-[color:var(--feedback-accent)]' : 'text-theme-text-tertiary'} `}
            />
          </motion.button>
        );
      })}
      {locked ? (
        <div className="flex items-center gap-1 ml-1">
          <Lock className="w-3.5 h-3.5 text-theme-text-tertiary" />
          <span className="text-xs text-theme-text-tertiary font-mono">Bloqueado</span>
        </div>
      ) : (
        <div className="text-xs text-theme-text-tertiary font-mono ml-1">{'1 (discordo) • 5 (concordo)'}</div>
      )}
    </div>
  );
};

const StatCard = ({ Icon, label, value, accent }) => (
  <div
    className="bg-theme-bg-secondary/70 border border-theme-border rounded-2xl p-4"
    style={{
      '--stat-accent': accent.color,
      '--stat-surface': accent.surface,
      '--stat-border': accent.border,
    }}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-theme-text-tertiary font-mono">{label}</div>
        <div className="text-2xl font-display font-bold mt-1 text-[color:var(--stat-accent)]">{value}</div>
      </div>
      <motion.div
        animate={{
          y: [0, -4, 0],
          scale: [1, 1.1, 1],
          filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-10 h-10 rounded-xl border border-[color:var(--stat-border)] bg-[color:var(--stat-surface)] flex items-center justify-center text-[color:var(--stat-accent)] shadow-[0_0_10px_var(--stat-surface)]"
      >
        <Icon className="w-5 h-5" />
      </motion.div>
    </div>
  </div>
);

const BadgeCard = ({ badge, unlocked }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${unlocked
      ? 'bg-theme-bg-primary/80 border-theme-border shadow-lg'
      : 'bg-theme-bg-tertiary/30 border-theme-border/50 opacity-40'
      }`}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
      style={{
        background: unlocked ? `${badge.color}15` : 'transparent',
        border: `1px solid ${unlocked ? `${badge.color}40` : 'transparent'}`,
      }}
    >
      {unlocked ? badge.icon : '🔒'}
    </div>
    <div className="min-w-0">
      <div className="text-xs font-bold text-theme-text-primary truncate">{badge.name}</div>
      <div className="text-[10px] text-theme-text-tertiary font-mono mt-0.5">
        {unlocked ? 'Desbloqueado!' : 'Complete a seção'}
      </div>
    </div>
    {unlocked && (
      <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: badge.color }} />
    )}
  </motion.div>
);

const XpCounter = ({ value }) => (
  <motion.div
    key={value}
    initial={{ scale: 1.3, y: -5 }}
    animate={{ scale: 1, y: 0 }}
    className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 font-display py-2"
  >
    + {value} XP
  </motion.div>
);

/* ─── Main Component ─── */
const Feedback = () => {
  const { user } = useAuth();
  const { unlockBadge, updateStat } = useGameState();

  /* Colour palette */
  const accent = {
    color: '#f59e0b',
    surface: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.5)',
    glow: 'rgba(245, 158, 11, 0.3)',
    muted: 'rgba(245, 158, 11, 0.05)',
  };
  const accent2 = {
    color: '#10b981',
    surface: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.5)',
    glow: 'rgba(16, 185, 129, 0.3)',
    muted: 'rgba(16, 185, 129, 0.05)',
  };
  const accent3 = {
    color: '#8b5cf6',
    surface: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.5)',
    glow: 'rgba(139, 92, 246, 0.3)',
    muted: 'rgba(139, 92, 246, 0.05)',
  };

  const [activeSection, setActiveSection] = useState('ux');
  const [ux, setUx] = useState({});
  const [learning, setLearning] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [toast, setToast] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const toastTimer = useRef(null);
  const uxToastShown = useRef(false);
  const learningToastShown = useRef(false);
  const prevLevelRef = useRef(null);

  /* ── Check if user already submitted ── */
  useEffect(() => {
    let mounted = true;
    const localKey = 'ecoplay.feedback.submitted';

    // Quick local check first
    const localSubmitted = localStorage.getItem(localKey);
    if (localSubmitted === 'true') {
      if (mounted) {
        setSubmitted({ id: 'previous-submission' });
        setChecking(false);
      }
      return;
    }

    // Then remote check
    checkUserHasFeedback().then((has) => {
      if (mounted) {
        if (has) {
          setSubmitted({ id: 'previous-submission' });
          localStorage.setItem(localKey, 'true');
        }
        setChecking(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  /* ── Derived state ── */
  const totalFields = UX_LIKERT.length + LEARNING_LIKERT.length + UX_OPEN.length;
  const answeredFields = useMemo(() => {
    const uxLikert = countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id));
    const learningLikert = countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id));
    const openCount = UX_OPEN.reduce((acc, q) => acc + (String(ux?.[q.id] || '').trim() ? 1 : 0), 0);
    return uxLikert + learningLikert + openCount;
  }, [learning, ux]);

  const progressPct = Math.round((answeredFields / totalFields) * 100);
  const score = useMemo(() => computeScore({ ux, learning }), [ux, learning]);
  const levelInfo = useMemo(() => computeLevel(score), [score]);
  const badges = useMemo(() => computeBadges({ ux, learning }), [ux, learning]);
  const badgeNames = useMemo(() => badges.map((b) => b.name), [badges]);

  const canSubmit = useMemo(() => {
    const uxDone = countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id)) === UX_LIKERT.length;
    const learningDone = countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id)) === LEARNING_LIKERT.length;
    return uxDone && learningDone && !submitting;
  }, [learning, submitting, ux]);

  const isLocked = Boolean(submitted);

  /* ── Level-up detection ── */
  useEffect(() => {
    if (prevLevelRef.current && prevLevelRef.current !== levelInfo.name) {
      playLevelUp();
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#4ade80', '#22c55e', '#10b981', '#fbbf24'],
        disableForReducedMotion: true,
      });
    }
    prevLevelRef.current = levelInfo.name;
  }, [levelInfo.name]);

  /* ── Toast helper ── */
  const showToast = useCallback((payload) => {
    setToast(payload);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  /* ── Section completion toasts ── */
  useEffect(() => {
    const uxDone = countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id)) === UX_LIKERT.length;
    if (uxDone && !uxToastShown.current) {
      uxToastShown.current = true;
      showToast({ type: 'ok', text: '🔍 Seção de Experiência concluída — Medalha desbloqueada!' });
    }
  }, [ux, showToast]);

  useEffect(() => {
    const learningDone = countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id)) === LEARNING_LIKERT.length;
    if (learningDone && !learningToastShown.current) {
      learningToastShown.current = true;
      showToast({ type: 'ok', text: '📚 Seção de Aprendizado concluída — Pontos bônus +20!' });
    }
  }, [learning, showToast]);

  /* ── Setters ── */
  const setUxValue = useCallback((id, value) => {
    setUx((prev) => ({ ...(prev || {}), [id]: value }));
  }, []);

  const setLearningValue = useCallback((id, value) => {
    setLearning((prev) => ({ ...(prev || {}), [id]: value }));
  }, []);

  /* ── Textarea handler with typing sound ── */
  const handleTextareaChange = useCallback((id, e) => {
    playKeystroke();
    setUxValue(id, e.target.value);
  }, [setUxValue]);

  /* ── Exports ── */
  const exportCsv = useCallback(() => {
    const responses = listFeedbackResponses();
    const csv = buildFeedbackCsv(responses);
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(`ecoplay - avaliacoes - ${date}.csv`, csv, 'text/csv;charset=utf-8');
  }, []);

  const exportPdf = useCallback(() => {
    const responses = listFeedbackResponses();
    const summary = computeFeedbackSummary(responses, {
      uxLikertIds: UX_LIKERT.map((q) => q.id),
      learningLikertIds: LEARNING_LIKERT.map((q) => q.id),
    });
    const rows = responses
      .slice(0, 12)
      .map((r) => {
        const created = String(r.createdAt || '').slice(0, 10);
        const name = String(r?.user?.name || r?.user?.email || '-');
        const scoreValue = Number(r.score || 0);
        const levelValue = String(r.level || '-');
        return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${created}</td><td style="padding:8px;border-bottom:1px solid #eee">${name}</td><td style="padding:8px;border-bottom:1px solid #eee">${scoreValue}</td><td style="padding:8px;border-bottom:1px solid #eee">${levelValue}</td></tr>`;
      })
      .join('');
    const html = [
      '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;max-width:960px;margin:24px auto;padding:0 16px">',
      '<h1 style="margin:0 0 12px">Resumo Executivo - Avaliação EcoPlay</h1>',
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0">',
      `<div style="border:1px solid #ddd;border-radius:12px;padding:12px"><div style="font-size:12px;color:#555">Total de respostas</div><div style="font-size:28px;font-weight:800">${summary.totalResponses}</div></div>`,
      `<div style="border:1px solid #ddd;border-radius:12px;padding:12px"><div style="font-size:12px;color:#555">Média UX</div><div style="font-size:28px;font-weight:800">${formatDecimal(summary.uxOverall)}</div></div>`,
      `<div style="border:1px solid #ddd;border-radius:12px;padding:12px"><div style="font-size:12px;color:#555">Média Aprendizado</div><div style="font-size:28px;font-weight:800">${formatDecimal(summary.learningOverall)}</div></div>`,
      '</div>',
      '<h2 style="margin:18px 0 8px">KPIs</h2>',
      '<ul>',
      `<li>Score médio: ${formatDecimal(summary.scoreAvg)}</li>`,
      `<li>UX (1-5): ${formatDecimal(summary.uxOverall)}</li>`,
      `<li>Aprendizado (1-5): ${formatDecimal(summary.learningOverall)}</li>`,
      '</ul>',
      '<h2 style="margin:18px 0 8px">Últimas respostas</h2>',
      '<table style="width:100%;border-collapse:collapse">',
      '<thead><tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Data</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Usuário</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Score</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Nível</th></tr></thead>',
      `<tbody>${rows}</tbody>`,
      '</table>',
      '</div>',
    ].join('');
    openPrintableReport({ title: 'EcoPlay - Avaliação', html });
  }, []);

  /* ── Submit handler ── */
  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const response = await saveFeedbackResponse({
        user: user
          ? { id: user.id, name: user.name, email: user.email, type: 'autenticado' }
          : { id: null, name: null, email: null, type: 'anonimo' },
        ux,
        learning,
        score,
        level: levelInfo.name,
        badges: badgeNames,
        meta: { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null },
      });

      // Mark as submitted locally for single-evaluation enforcement
      localStorage.setItem('ecoplay.feedback.submitted', 'true');

      setSubmitted(response);
      if (user) {
        updateStat('feedback_submissions', 1);
        unlockBadge('feedback_responder');
      }
      playCelebration();
      setShowSuccessModal(true);
      showToast({ type: 'ok', text: 'Missão concluída! Obrigado por validar a proposta.' });
    } catch (e) {
      void e;
      showToast({ type: 'error', text: 'Não foi possível salvar sua avaliação. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  }, [badgeNames, canSubmit, learning, levelInfo.name, score, showToast, unlockBadge, updateStat, user, ux]);

  /* ── Loading state ── */
  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg-primary gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[color:var(--feedback-accent)]" />
        <div className="text-sm text-theme-text-tertiary font-mono animate-pulse">Verificando avaliação…</div>
      </div>
    );
  }

  /* ── Already submitted view ── */
  const LevelIcon = levelInfo.Icon;

  return (
    <div
      className="min-h-screen text-theme-text-primary"
      style={{
        '--feedback-accent': accent.color,
        '--feedback-accent-surface': accent.surface,
        '--feedback-accent-border': accent.border,
        '--feedback-accent-glow': accent.glow,
        '--feedback-accent-muted': accent.muted,
        '--feedback-accent-2': accent2.color,
        '--feedback-accent-2-surface': accent2.surface,
        '--feedback-accent-2-border': accent2.border,
        '--feedback-accent-2-glow': accent2.glow,
        '--feedback-accent-2-muted': accent2.muted,
        '--feedback-accent-3': accent3.color,
        '--feedback-accent-3-surface': accent3.surface,
        '--feedback-accent-3-border': accent3.border,
        '--feedback-accent-3-glow': accent3.glow,
        '--feedback-accent-3-muted': accent3.muted,
        '--feedback-contrast': '#020617',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="relative overflow-hidden rounded-3xl border border-theme-border bg-theme-bg-secondary/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl">

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[color:var(--feedback-accent-surface)] border border-[color:var(--feedback-accent-border)] flex items-center justify-center">
                  <Star className="w-6 h-6 text-[color:var(--feedback-accent)]" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold">{'Qual sua opinião sobre a plataforma?'}</h1>
                </div>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--feedback-accent)] rounded"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
            </div>


            {/* Section tabs */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { id: 'ux', label: 'Experiência do Usuário' },
                { id: 'learning', label: 'Aprendizado' },
              ].map((tab) => {
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setActiveSection(tab.id); playClick(); }}
                    className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${isActive
                      ? 'bg-[color:var(--feedback-accent)] text-[color:var(--feedback-contrast)] border-[color:var(--feedback-accent)] shadow-[0_10px_20px_var(--feedback-accent-glow)]'
                      : 'bg-theme-bg-primary/60 text-theme-text-secondary border-theme-border hover:bg-theme-bg-tertiary/70'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Main content grid */}
            <div className="mt-6 grid lg:grid-cols-5 gap-6">
              {/* Questions area */}
              <div className="lg:col-span-3 space-y-5">
                {activeSection === 'ux' && (
                  <div className="bg-theme-bg-secondary/70 border border-theme-border rounded-3xl p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h2 className="text-xl font-display font-bold">{'Experiência do Usuário'}</h2>
                      <div className="flex items-center gap-2">
                        {isLocked && <Lock className="w-3.5 h-3.5 text-theme-text-tertiary" />}
                        <div className="text-xs text-theme-text-tertiary font-mono">
                          {countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id))}/{UX_LIKERT.length} Likert
                        </div>
                      </div>
                    </div>
                    <motion.div
                      className="space-y-5"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {UX_LIKERT.map((q) => (
                        <motion.div variants={itemVariants} key={q.id} className="bg-theme-bg-primary/60 border border-theme-border rounded-2xl p-4">
                          <div className="text-sm font-semibold text-theme-text-primary mb-3">{q.label}</div>
                          <LikertRow
                            value={ux?.[q.id]}
                            onChange={(v) => setUxValue(q.id, v)}
                            disabled={submitting}
                            locked={isLocked}
                          />
                        </motion.div>
                      ))}

                      <div className="pt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-sm font-semibold text-theme-text-secondary">Perguntas abertas</div>
                          {isLocked && <Lock className="w-3 h-3 text-theme-text-tertiary" />}
                        </div>
                        <div className="space-y-3">
                          {UX_OPEN.map((q) => (
                            <label key={q.id} className="block">
                              <div className="text-xs text-theme-text-tertiary font-mono mb-1">{q.label}</div>
                              <div className="relative">
                                <textarea
                                  value={ux?.[q.id] || ''}
                                  disabled={submitting || isLocked}
                                  onChange={(e) => handleTextareaChange(q.id, e)}
                                  placeholder={isLocked ? 'Resposta registrada' : q.placeholder}
                                  rows={3}
                                  className={`w-full bg-theme-bg-primary/70 border border-theme-border rounded-2xl px-4 py-3 text-theme-text-primary placeholder:text-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-[color:var(--feedback-accent)] transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                                {isLocked && (
                                  <div className="absolute top-3 right-3">
                                    <Lock className="w-4 h-4 text-theme-text-tertiary/50" />
                                  </div>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}

                {activeSection === 'learning' && (
                  <div className="bg-theme-bg-secondary/70 border border-theme-border rounded-3xl p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h2 className="text-xl font-display font-bold">Aprendizado</h2>
                      <div className="flex items-center gap-2">
                        {isLocked && <Lock className="w-3.5 h-3.5 text-theme-text-tertiary" />}
                        <div className="text-xs text-theme-text-tertiary font-mono">
                          {countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id))}/{LEARNING_LIKERT.length} Likert
                        </div>
                      </div>
                    </div>
                    <motion.div
                      className="space-y-5"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {LEARNING_LIKERT.map((q) => (
                        <motion.div variants={itemVariants} key={q.id} className="bg-theme-bg-primary/60 border border-theme-border rounded-2xl p-4">
                          <div className="text-sm font-semibold text-theme-text-primary mb-3">{q.label}</div>
                          <LikertRow
                            value={learning?.[q.id]}
                            onChange={(v) => setLearningValue(q.id, v)}
                            disabled={submitting}
                            locked={isLocked}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-2 space-y-4">

                {/* Submit card */}
                <div className="bg-theme-bg-secondary/70 border border-theme-border rounded-3xl p-6 text-center shadow-lg sticky top-6">
                  <div className="flex justify-center mb-4">
                    <motion.div
                      animate={canSubmit ? {
                        boxShadow: [
                          '0 0 0 0 rgba(245,158,11,0.4)',
                          '0 0 0 15px rgba(245,158,11,0)',
                        ],
                      } : {}}
                      transition={canSubmit ? { duration: 1.5, repeat: Infinity } : {}}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/30 flex items-center justify-center"
                    >
                      {isLocked ? (
                        <Lock className="w-10 h-10 text-amber-400/60" />
                      ) : (
                        <Trophy className="w-10 h-10 text-amber-400" />
                      )}
                    </motion.div>
                  </div>

                  <h3 className="text-2xl font-display font-bold text-theme-text-primary">
                    {isLocked ? 'Avaliação Registrada' : 'Avaliação Concluída!'}
                  </h3>

                  <XpCounter value={250} />

                  <p className="text-theme-text-secondary text-sm px-4">
                    {isLocked
                      ? 'Obrigado pela sua contribuição. Sua avaliação já foi contabilizada.'
                      : 'Sua opinião ajuda a construir um futuro mais sustentável.'}
                  </p>

                  <button
                    type="button"
                    disabled={!canSubmit || isLocked}
                    onClick={() => {
                      submit();
                      confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        colors: ['#34d399', '#fbbf24', '#f472b6'],
                      });
                    }}
                    className={`mt-6 w-full rounded-2xl px-6 py-4 font-display font-bold text-lg transition-all transform hover:scale-105 active:scale-95 ${canSubmit && !isLocked
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)]'
                      : 'bg-theme-bg-tertiary text-theme-text-tertiary cursor-not-allowed opacity-70'
                      }`}
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                        Resgatando...
                      </span>
                    ) : isLocked ? (
                      <span className="flex items-center justify-center gap-2">
                        <Lock className="w-5 h-5" />
                        Já Resgatado
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Gift className="w-5 h-5" />
                        Resgatar Recompensa
                      </span>
                    )}
                  </button>

                  {!canSubmit && !isLocked && (
                    <div className="text-xs text-theme-text-tertiary mt-3 font-mono">
                      Complete todas as perguntas para liberar
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-lg"
              style={{
                borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.4)' : accent.border,
                backgroundColor: toast.type === 'error' ? 'rgba(239,68,68,0.12)' : accent.surface,
                color: toast.type === 'error' ? 'rgba(248,113,113,0.9)' : accent.color,
              }}
            >
              <div className="flex items-center gap-2 font-bold">
                {toast.type === 'error' ? <FileText className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                <span>{toast.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.7, y: 30, rotateX: 10 }}
                animate={{ scale: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-theme-bg-secondary w-full max-w-md rounded-3xl border border-theme-accent p-8 relative overflow-hidden shadow-2xl"
              >
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--feedback-accent-surface)] via-transparent to-[color:var(--feedback-accent-2-surface)] pointer-events-none" />

                {/* Floating particles decoration */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: i % 2 === 0 ? accent.color : accent2.color,
                        left: `${15 + i * 14}%`,
                        top: '100%',
                      }}
                      animate={{
                        y: [0, -400],
                        opacity: [0.8, 0],
                        scale: [1, 0.5],
                      }}
                      transition={{
                        duration: 2 + i * 0.3,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </div>

                <div className="relative flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/20 to-emerald-400/20 border-2 border-amber-400/50 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Trophy className="w-12 h-12 text-amber-400" />
                    </motion.div>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-display font-bold text-theme-text-primary mb-2"
                  >
                    Obrigado! 🎉
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 font-display py-3"
                  >
                    +250 XP
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-theme-text-secondary mb-4"
                  >
                    Seu feedback sobre a EcoPlay foi registrado com sucesso!
                  </motion.p>

                  {/* Earned badges */}
                  {badges.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="w-full mb-6"
                    >
                      <div className="text-xs text-theme-text-tertiary font-mono mb-2">Medalhas conquistadas:</div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {badges.map((badge) => (
                          <motion.div
                            key={badge.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.8 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                            style={{
                              background: `${badge.color}15`,
                              border: `1px solid ${badge.color}40`,
                              color: badge.color,
                            }}
                          >
                            <span>{badge.icon}</span>
                            <span>{badge.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="w-full">
                    <button
                      onClick={() => setShowSuccessModal(false)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl py-3 font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Feedback;
