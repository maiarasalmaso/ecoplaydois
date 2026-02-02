import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Award, BarChart3, Download, FileText, Star, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedBackground from '../components/layout/AnimatedBackground';
import { useAuth } from '../context/AuthContext';
import { useGameState } from '../context/GameStateContext';
import { buildFeedbackCsv, computeFeedbackSummary, downloadTextFile, listFeedbackResponses, openPrintableReport, saveFeedbackResponse } from '../utils/feedbackStore';

const UX_LIKERT = [
  { id: 'ux_navigation', label: 'A navegação é intuitiva' },
  { id: 'ux_design', label: 'O design visual é agradável e consistente' },
  { id: 'ux_clarity', label: 'As instruções e textos são claros' },
  { id: 'ux_speed', label: 'A plataforma parece rápida e responsiva' },
  { id: 'ux_satisfaction', label: 'Estou satisfeito(a) com a experiência geral' },
  { id: 'ux_recommend', label: 'Eu recomendaria a plataforma para outras pessoas' },
];

const UX_OPEN = [
  { id: 'ux_open_like', label: 'O que você mais gostou?', placeholder: 'Conte rapidamente o ponto mais positivo.' },
  { id: 'ux_open_improve', label: 'O que podemos melhorar?', placeholder: 'Diga o que te atrapalhou ou faltou.' },
  { id: 'ux_open_ideas', label: 'Ideias de novas funcionalidades', placeholder: 'Sugestões de melhorias ou novos recursos.' },
];

const LEARNING_LIKERT = [
  { id: 'learn_effective', label: 'Aprendi algo novo sobre sustentabilidade' },
  { id: 'learn_reinforce', label: 'Os jogos reforçam boas práticas no dia a dia' },
  { id: 'learn_level', label: 'O conteúdo está adequado ao meu nível' },
  { id: 'learn_motivation', label: 'Me senti motivado(a) a continuar aprendendo' },
];

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

const computeLevel = (score) => {
  if (score >= 170) return 'Floresta';
  if (score >= 130) return 'Árvore';
  if (score >= 90) return 'Broto';
  return 'Semente';
};

const computeBadges = ({ ux, learning }) => {
  const badges = [];
  const uxDone = countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id)) === UX_LIKERT.length;
  const learningDone = countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id)) === LEARNING_LIKERT.length;
  if (uxDone) badges.push('Explorador(a) da Experiência');
  if (learningDone) badges.push('Guardião(ã) do Aprendizado');
  if (uxDone && learningDone) badges.push('Validador(a) Mestre');
  return badges;
};

const LikertRow = ({ value, onChange, disabled }) => {
  const selected = Number(value || 0);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-xl border font-bold transition-all ${
            selected === n
              ? 'bg-eco-green text-slate-900 border-eco-green shadow-[0_0_20px_rgba(74,222,128,0.25)]'
              : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          aria-label={`Selecionar ${n}`}
        >
          {n}
        </button>
      ))}
      <div className="text-xs text-slate-500 font-mono ml-1">1 (discordo) • 5 (concordo)</div>
    </div>
  );
};

const StatCard = ({ icon, label, value, accent = 'text-eco-green' }) => (
  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-mono">{label}</div>
        <div className={`text-2xl font-display font-bold mt-1 ${accent}`}>{value}</div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-200">
        {icon}
      </div>
    </div>
  </div>
);

const MiniBar = ({ value, max, label }) => {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 text-xs text-slate-400 font-mono truncate">{label}</div>
      <div className="flex-1 h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/60">
        <div className="h-full bg-gradient-to-r from-eco-green to-emerald-400" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-12 text-right text-xs text-slate-300 font-mono">{formatDecimal(value)}</div>
    </div>
  );
};

const Feedback = () => {
  const { user } = useAuth();
  const { unlockBadge, updateStat } = useGameState();
  const [activeSection, setActiveSection] = useState('ux');
  const [ux, setUx] = useState({});
  const [learning, setLearning] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [toast, setToast] = useState(null);

  const totalFields = UX_LIKERT.length + LEARNING_LIKERT.length + UX_OPEN.length;
  const answeredFields = useMemo(() => {
    const uxLikert = countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id));
    const learningLikert = countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id));
    const openCount = UX_OPEN.reduce((acc, q) => acc + (String(ux?.[q.id] || '').trim() ? 1 : 0), 0);
    return uxLikert + learningLikert + openCount;
  }, [learning, ux]);

  const progressPct = Math.round((answeredFields / totalFields) * 100);

  const score = useMemo(() => computeScore({ ux, learning }), [ux, learning]);
  const level = useMemo(() => computeLevel(score), [score]);
  const badges = useMemo(() => computeBadges({ ux, learning }), [ux, learning]);

  const responses = useMemo(() => {
    void submitted;
    return listFeedbackResponses();
  }, [submitted]);
  const summary = useMemo(
    () =>
      computeFeedbackSummary(responses, {
        uxLikertIds: UX_LIKERT.map((q) => q.id),
        learningLikertIds: LEARNING_LIKERT.map((q) => q.id),
      }),
    [responses]
  );

  const canSubmit = useMemo(() => {
    const uxDone = countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id)) === UX_LIKERT.length;
    const learningDone = countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id)) === LEARNING_LIKERT.length;
    return uxDone && learningDone && !submitting;
  }, [learning, submitting, ux]);

  const showToast = useCallback((payload) => {
    setToast(payload);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const onCompleteSection = useCallback(
    (section) => {
      if (section === 'ux') showToast({ type: 'ok', text: 'Seção de Experiência concluída. Você ganhou uma medalha!' });
      if (section === 'learning') showToast({ type: 'ok', text: 'Seção de Aprendizado concluída. Pontos bônus liberados!' });
    },
    [showToast]
  );

  const setUxValue = useCallback(
    (id, value) => {
      setUx((prev) => {
        const next = { ...(prev || {}), [id]: value };
        const done = countAnsweredLikert(next, UX_LIKERT.map((q) => q.id)) === UX_LIKERT.length;
        if (done && countAnsweredLikert(prev, UX_LIKERT.map((q) => q.id)) !== UX_LIKERT.length) onCompleteSection('ux');
        return next;
      });
    },
    [onCompleteSection]
  );

  const setLearningValue = useCallback(
    (id, value) => {
      setLearning((prev) => {
        const next = { ...(prev || {}), [id]: value };
        const done = countAnsweredLikert(next, LEARNING_LIKERT.map((q) => q.id)) === LEARNING_LIKERT.length;
        if (done && countAnsweredLikert(prev, LEARNING_LIKERT.map((q) => q.id)) !== LEARNING_LIKERT.length) onCompleteSection('learning');
        return next;
      });
    },
    [onCompleteSection]
  );

  const exportCsv = useCallback(() => {
    const csv = buildFeedbackCsv(responses);
    downloadTextFile(`ecoplay-avaliacoes-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
  }, [responses]);

  const exportPdf = useCallback(() => {
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;max-width:960px;margin:24px auto;padding:0 16px">
        <h1 style="margin:0 0 12px">Resumo Executivo - Avaliação EcoPlay</h1>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:16px 0">
          <div style="border:1px solid #ddd;border-radius:12px;padding:12px"><div style="font-size:12px;color:#555">Total de respostas</div><div style="font-size:28px;font-weight:800">${summary.totalResponses}</div></div>
          <div style="border:1px solid #ddd;border-radius:12px;padding:12px"><div style="font-size:12px;color:#555">Média UX</div><div style="font-size:28px;font-weight:800">${formatDecimal(summary.uxOverall)}</div></div>
          <div style="border:1px solid #ddd;border-radius:12px;padding:12px"><div style="font-size:12px;color:#555">Média Aprendizado</div><div style="font-size:28px;font-weight:800">${formatDecimal(summary.learningOverall)}</div></div>
        </div>
        <h2 style="margin:18px 0 8px">KPIs</h2>
        <ul>
          <li>Score médio: ${formatDecimal(summary.scoreAvg)}</li>
          <li>UX (1-5): ${formatDecimal(summary.uxOverall)}</li>
          <li>Aprendizado (1-5): ${formatDecimal(summary.learningOverall)}</li>
        </ul>
        <h2 style="margin:18px 0 8px">Últimas respostas</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Data</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Usuário</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Score</th><th style="text-align:left;border-bottom:1px solid #ddd;padding:8px">Nível</th></tr></thead>
          <tbody>
            ${responses.slice(0, 12).map((r) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${String(r.createdAt || '').slice(0, 10)}</td><td style="padding:8px;border-bottom:1px solid #eee">${String(r?.user?.name || r?.user?.email || '-')}</td><td style="padding:8px;border-bottom:1px solid #eee">${Number(r.score || 0)}</td><td style="padding:8px;border-bottom:1px solid #eee">${String(r.level || '-')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    openPrintableReport({ title: 'EcoPlay - Avaliação', html });
  }, [responses, summary]);

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
        level,
        badges,
        meta: { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null },
      });
      setSubmitted(response);
      if (user) {
        updateStat('feedback_submissions', 1);
        unlockBadge('feedback_responder');
      }
      setActiveSection('report');
      showToast({ type: 'ok', text: 'Missão concluída! Obrigado por validar a proposta.' });
    } catch (e) {
      void e;
      showToast({ type: 'error', text: 'Não foi possível salvar sua avaliação. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  }, [badges, canSubmit, learning, level, score, showToast, unlockBadge, updateStat, user, ux]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-6 md:p-8 shadow-2xl">
          <AnimatedBackground />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-eco-green/15 border border-eco-green/30 flex items-center justify-center">
                  <Star className="w-6 h-6 text-eco-green" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold">Validação da Proposta</h1>
                  <p className="text-slate-300 text-sm md:text-base">Formulário gamificado para medir UX e aprendizado.</p>
                </div>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-green/60 rounded"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <StatCard icon={<Trophy className="w-5 h-5 text-yellow-400" />} label="Score" value={score} accent="text-yellow-300" />
              <StatCard icon={<Award className="w-5 h-5 text-eco-green" />} label="Nível" value={level} />
              <StatCard icon={<BarChart3 className="w-5 h-5 text-blue-300" />} label="Progresso" value={`${progressPct}%`} accent="text-blue-300" />
            </div>

            <div className="mt-4">
              <div className="h-3 w-full bg-slate-950/40 rounded-full overflow-hidden border border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${clamp(progressPct, 0, 100)}%` }}
                  className="h-full bg-gradient-to-r from-eco-green to-emerald-400"
                />
              </div>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                {answeredFields}/{totalFields} respostas preenchidas • Likert obrigatório em todas as questões fechadas
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveSection('ux')}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                  activeSection === 'ux' ? 'bg-eco-green text-slate-900 border-eco-green' : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Experiência do Usuário
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('learning')}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                  activeSection === 'learning' ? 'bg-eco-green text-slate-900 border-eco-green' : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Aprendizado
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('report')}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                  activeSection === 'report' ? 'bg-eco-green text-slate-900 border-eco-green' : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Relatórios
              </button>
            </div>

            <div className="mt-6 grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-5">
                {activeSection === 'ux' && (
                  <div className="bg-slate-950/20 border border-slate-800 rounded-3xl p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h2 className="text-xl font-display font-bold">Experiência do Usuário</h2>
                      <div className="text-xs text-slate-500 font-mono">
                        {countAnsweredLikert(ux, UX_LIKERT.map((q) => q.id))}/{UX_LIKERT.length} Likert
                      </div>
                    </div>
                    <div className="space-y-5">
                      {UX_LIKERT.map((q) => (
                        <div key={q.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                          <div className="text-sm font-semibold text-slate-100 mb-3">{q.label}</div>
                          <LikertRow value={ux?.[q.id]} onChange={(v) => setUxValue(q.id, v)} disabled={submitting || Boolean(submitted)} />
                        </div>
                      ))}

                      <div className="pt-2">
                        <div className="text-sm font-semibold text-slate-200 mb-2">Perguntas abertas</div>
                        <div className="space-y-3">
                          {UX_OPEN.map((q) => (
                            <label key={q.id} className="block">
                              <div className="text-xs text-slate-400 font-mono mb-1">{q.label}</div>
                              <textarea
                                value={ux?.[q.id] || ''}
                                disabled={submitting || Boolean(submitted)}
                                onChange={(e) => setUxValue(q.id, e.target.value)}
                                placeholder={q.placeholder}
                                rows={3}
                                className="w-full bg-slate-900/40 border border-slate-700 rounded-2xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-eco-green/50"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'learning' && (
                  <div className="bg-slate-950/20 border border-slate-800 rounded-3xl p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h2 className="text-xl font-display font-bold">Aprendizado</h2>
                      <div className="text-xs text-slate-500 font-mono">
                        {countAnsweredLikert(learning, LEARNING_LIKERT.map((q) => q.id))}/{LEARNING_LIKERT.length} Likert
                      </div>
                    </div>
                    <div className="space-y-5">
                      {LEARNING_LIKERT.map((q) => (
                        <div key={q.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
                          <div className="text-sm font-semibold text-slate-100 mb-3">{q.label}</div>
                          <LikertRow value={learning?.[q.id]} onChange={(v) => setLearningValue(q.id, v)} disabled={submitting || Boolean(submitted)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'report' && (
                  <div className="bg-slate-950/20 border border-slate-800 rounded-3xl p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <h2 className="text-xl font-display font-bold">Relatórios</h2>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={exportCsv}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors text-sm font-bold"
                        >
                          <Download className="w-4 h-4" />
                          CSV
                        </button>
                        <button
                          type="button"
                          onClick={exportPdf}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors text-sm font-bold"
                        >
                          <FileText className="w-4 h-4" />
                          PDF
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <StatCard icon={<BarChart3 className="w-5 h-5 text-blue-300" />} label="Respostas" value={summary.totalResponses} accent="text-white" />
                      <StatCard icon={<Star className="w-5 h-5 text-eco-green" />} label="Média UX" value={formatDecimal(summary.uxOverall)} />
                      <StatCard icon={<Star className="w-5 h-5 text-cyan-300" />} label="Média Aprendizado" value={formatDecimal(summary.learningOverall)} accent="text-cyan-300" />
                    </div>

                    <div className="mt-5">
                      <div className="text-sm font-semibold text-slate-200 mb-2">Médias por pergunta (UX)</div>
                      <div className="space-y-2">
                        {UX_LIKERT.map((q) => (
                          <MiniBar key={q.id} label={q.label} value={summary.uxAverages[q.id] || 0} max={5} />
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="text-sm font-semibold text-slate-200 mb-2">Médias por pergunta (Aprendizado)</div>
                      <div className="space-y-2">
                        {LEARNING_LIKERT.map((q) => (
                          <MiniBar key={q.id} label={q.label} value={summary.learningAverages[q.id] || 0} max={5} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-950/20 border border-slate-800 rounded-3xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-display font-bold text-white">Recompensas</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">Complete as seções para desbloquear.</div>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">{badges.length} badges</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {badges.length ? (
                      badges.map((b) => (
                        <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-eco-green/30 bg-eco-green/10 text-eco-green font-bold text-xs">
                          <Trophy className="w-3.5 h-3.5" />
                          {b}
                        </span>
                      ))
                    ) : (
                      <div className="text-sm text-slate-400">Responda mais para ganhar badges.</div>
                    )}
                  </div>

                  <div className="mt-5">
                    <div className="text-xs text-slate-500 font-mono mb-2">Meta do nível</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { name: 'Semente', min: 0, color: 'border-slate-700 text-slate-300' },
                        { name: 'Broto', min: 90, color: 'border-emerald-500/30 text-emerald-300' },
                        { name: 'Árvore', min: 130, color: 'border-yellow-500/30 text-yellow-300' },
                        { name: 'Floresta', min: 170, color: 'border-purple-500/30 text-purple-300' },
                      ].map((l) => (
                        <div key={l.name} className={`rounded-2xl border bg-slate-900/40 px-3 py-2 ${l.color}`}>
                          <div className="font-bold">{l.name}</div>
                          <div className="font-mono opacity-80">{l.min}+ pts</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/20 border border-slate-800 rounded-3xl p-5">
                  <div className="text-sm font-display font-bold text-white">Envio</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">Obrigatório: todas as escalas Likert.</div>
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={submit}
                    className={`mt-4 w-full rounded-2xl px-4 py-3 font-display font-bold transition-all ${
                      canSubmit
                        ? 'bg-eco-green text-slate-900 hover:bg-eco-green-light shadow-[0_0_25px_rgba(74,222,128,0.25)]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? 'Enviando...' : submitted ? 'Enviado' : 'Concluir avaliação'}
                  </button>
                  {submitted && (
                    <div className="mt-3 text-xs text-slate-400 font-mono">
                      ID: <span className="text-slate-200">{submitted.id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border shadow-2xl ${
              toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-200'
                : 'bg-eco-green/10 border-eco-green/30 text-eco-green'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {toast.type === 'error' ? <FileText className="w-5 h-5" /> : <Award className="w-5 h-5" />}
              <span>{toast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feedback;
