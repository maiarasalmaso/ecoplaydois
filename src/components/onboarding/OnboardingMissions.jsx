import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Flag, Rocket, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGameState } from '@/context/GameStateContext';
import { listFeedbackResponses } from '@/utils/feedbackStore';

const OnboardingMissions = () => {
  const { user } = useAuth();
  const { score, stats } = useGameState();

  const hasFeedback = useMemo(() => {
    if (!user) return false;
    const responses = listFeedbackResponses();
    const email = String(user.email || '').toLowerCase();
    return responses.some((r) => {
      const idMatch = r?.user?.id && user?.id && r.user.id === user.id;
      const emailMatch = email && String(r?.user?.email || '').toLowerCase() === email;
      return idMatch || emailMatch;
    });
  }, [user]);

  const hasPlayed = Boolean(
    (stats?.quiz_completions || 0) > 0 ||
      (stats?.sudoku_wins || 0) > 0 ||
      (stats?.memory_wins || 0) > 0 ||
      (stats?.xp || score || 0) >= 150
  );

  const steps = useMemo(
    () => [
      {
        id: 'account',
        title: 'Entrar na base',
        description: 'Crie sua conta para salvar progresso e ganhar XP.',
        done: Boolean(user),
        icon: Flag,
      },
      {
        id: 'play',
        title: 'Jogar 1 miss\u00e3o',
        description: 'Escolha um jogo e conclua sua primeira etapa.',
        done: Boolean(user) && hasPlayed,
        icon: Rocket,
      },
      {
        id: 'feedback',
        title: 'Avaliar a experi\u00eancia',
        description: 'Conte o que achou e desbloqueie um badge.',
        done: Boolean(user) && hasFeedback,
        icon: Star,
      },
    ],
    [hasFeedback, hasPlayed, user]
  );

  const completedCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done) || steps[steps.length - 1];

  const cta = !user
    ? { label: 'Entrar agora', to: '/login' }
    : !hasPlayed
      ? { label: 'Escolher jogo', to: '/games' }
      : !hasFeedback
        ? { label: 'Responder avalia\u00e7\u00e3o', to: '/avaliacao' }
        : { label: 'Ver painel', to: '/dashboard' };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-theme-border bg-theme-bg-secondary/80 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--theme-accent-rgb),0.18),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(var(--theme-accent-2-rgb),0.12),transparent_55%)] opacity-70" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color:var(--theme-accent-surface)] border border-[color:var(--theme-accent-border)] text-[color:var(--theme-accent)] text-xs font-semibold uppercase tracking-widest">
              Miss\u00f5es iniciais
            </div>
            <h2 className="mt-3 text-2xl md:text-3xl font-display font-bold text-theme-text-primary">
              Primeiros passos na EcoPlay
            </h2>
            <p className="mt-2 text-sm md:text-base text-theme-text-secondary max-w-xl">
              Complete as etapas abaixo para liberar recompensas e acelerar seu progresso.
            </p>
          </div>
          <div className="min-w-[180px]">
            <div className="flex items-center justify-between text-xs font-mono text-theme-text-tertiary mb-2">
              <span>{completedCount}/3 completas</span>
              <span>Meta r\u00e1pida</span>
            </div>
            <div className="h-2.5 w-full bg-theme-bg-tertiary/70 rounded-full overflow-hidden border border-theme-border">
              <div
                className="h-full"
                style={{
                  width: `${Math.round((completedCount / steps.length) * 100)}%`,
                  backgroundImage: 'linear-gradient(90deg, var(--theme-accent), var(--theme-accent-2))',
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const isActive = nextStep?.id === step.id;
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isActive
                    ? 'border-[color:var(--theme-accent)] bg-[color:var(--theme-accent-surface)] shadow-[0_12px_32px_var(--theme-accent-glow)]'
                    : 'border-theme-border bg-theme-bg-primary/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl border border-[color:var(--theme-accent-border)] bg-[color:var(--theme-accent-surface)] flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[color:var(--theme-accent)]" />
                    </div>
                    <div>
                      <div className="text-sm font-display font-bold text-theme-text-primary">{step.title}</div>
                      <div className="text-xs text-theme-text-tertiary">{step.description}</div>
                    </div>
                  </div>
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-[color:var(--theme-success)]" />
                  ) : (
                    <Circle className="w-5 h-5 text-theme-text-tertiary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-theme-text-tertiary font-mono">
            Pr\u00f3xima miss\u00e3o: <span className="text-theme-text-primary">{nextStep?.title}</span>
          </div>
          <Link
            to={cta.to}
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--theme-accent)] text-[color:var(--theme-accent-contrast)] px-5 py-2.5 text-sm font-bold shadow-[0_10px_24px_var(--theme-accent-glow)] hover:brightness-110 transition-all"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OnboardingMissions;
