import { useEffect, useRef } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { AuthProvider } from '../../frontend/src/context/AuthContext';
import { GameStateProvider, useGameState } from '../../frontend/src/context/GameStateContext';
import Dashboard from '../../frontend/src/pages/Dashboard';
import { dateOnlyNowLondrina } from '../../frontend/src/utils/dateTime';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const todayLondrinaDate = () => dateOnlyNowLondrina();

const setSessionUser = (user) => {
  localStorage.setItem('ecoplay_user', JSON.stringify(user));
};

const setUserProgress = (userId, progress) => {
  localStorage.setItem(`ecoplay_progress_${userId}`, JSON.stringify(progress));
};

const createBaselineProgress = ({ lastDailyXpDate }) => ({
  score: 0,
  badges: [],
  badgeUnlocks: {},
  stats: {
    xp: 0,
    streak: 1,
    logins: 0,
    sudoku_wins: 0,
    quiz_completions: 0,
    memory_wins: 0,
    dashboard_visits: 0
  },
  completedLevels: {},
  lastDailyXpDate,
  unclaimedRewards: []
});

const Providers = ({ children }) => (
  <AuthProvider>
    <GameStateProvider>{children}</GameStateProvider>
  </AuthProvider>
);

const UnlockTwiceHarness = ({ badgeId }) => {
  const { unlockBadge, badges, badgeUnlocks, stats } = useGameState();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    if (!stats || Object.keys(stats).length === 0) return;
    didRun.current = true;
    unlockBadge(badgeId);
    unlockBadge(badgeId);
  }, [badgeId, unlockBadge, stats]);

  return (
    <div>
      <div data-testid="badges-count">{badges.length}</div>
      <div data-testid="unlock-time">{badgeUnlocks?.[badgeId] || ''}</div>
    </div>
  );
};

const DashboardWithUnlock = ({ badgeId }) => {
  const { unlockBadge, stats } = useGameState();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    if (!stats || Object.keys(stats).length === 0) return;
    didRun.current = true;
    unlockBadge(badgeId);
    unlockBadge(badgeId);
  }, [badgeId, unlockBadge, stats]);

  return <Dashboard />;
};

describe('Unicidade de troféus por usuário', () => {
  let container;
  let root;

  const waitFor = async (predicate) => {
    for (let i = 0; i < 25; i += 1) {
      if (predicate()) return;
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
    }
    throw new Error('Timeout aguardando condição do teste');
  };

  const render = async (node) => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root.render(node);
    });
    await waitFor(() => Boolean(container.querySelector('div')));
  };

  const unmount = async () => {
    if (!root) return;
    await act(async () => {
      root.unmount();
    });
    container?.remove();
    container = undefined;
    root = undefined;
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(async () => {
    await unmount();
  });

  it('não permite conquistar o mesmo troféu duas vezes no mesmo usuário', async () => {
    const today = todayLondrinaDate();
    const user = { id: 1, name: 'Alice', email: 'alice@example.com', avatar: 'default', streak: 1, lastLoginDate: today };
    setSessionUser(user);
    setUserProgress(user.id, createBaselineProgress({ lastDailyXpDate: today }));

    await render(
      <Providers>
        <UnlockTwiceHarness badgeId="first_login" />
      </Providers>
    );

    await waitFor(() => container.querySelector('[data-testid="badges-count"]')?.textContent === '1');
    expect(container.querySelector('[data-testid="badges-count"]')?.textContent).toBe('1');
    const unlockedAt = container.querySelector('[data-testid="unlock-time"]')?.textContent || '';
    expect(unlockedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    await waitFor(() => {
      const persistedRaw = localStorage.getItem(`ecoplay_progress_${user.id}`);
      if (!persistedRaw) return false;
      const persisted = JSON.parse(persistedRaw);
      return Array.isArray(persisted.badges) && persisted.badges.includes('first_login');
    });
    const persisted = JSON.parse(localStorage.getItem(`ecoplay_progress_${user.id}`) || '{}');
    expect(Array.isArray(persisted.badges)).toBe(true);
    expect(persisted.badges.filter((id) => id === 'first_login')).toHaveLength(1);
    expect(typeof persisted.badgeUnlocks?.first_login).toBe('string');
  });

  it('aplica a restrição igualmente para usuários diferentes', async () => {
    const today = todayLondrinaDate();

    const userA = { id: 10, name: 'UserA', email: 'a@example.com', avatar: 'default', streak: 1, lastLoginDate: today };
    setSessionUser(userA);
    setUserProgress(userA.id, createBaselineProgress({ lastDailyXpDate: today }));

    await render(
      <Providers>
        <UnlockTwiceHarness badgeId="first_login" />
      </Providers>
    );

    await waitFor(() => {
      const progressRaw = localStorage.getItem(`ecoplay_progress_${userA.id}`);
      if (!progressRaw) return false;
      const progress = JSON.parse(progressRaw);
      return Array.isArray(progress.badges) && progress.badges.includes('first_login');
    });
    await unmount();

    const userB = { id: 20, name: 'UserB', email: 'b@example.com', avatar: 'default', streak: 1, lastLoginDate: today };
    setSessionUser(userB);
    setUserProgress(userB.id, createBaselineProgress({ lastDailyXpDate: today }));

    await render(
      <Providers>
        <UnlockTwiceHarness badgeId="first_login" />
      </Providers>
    );

    await waitFor(() => {
      const progressRaw = localStorage.getItem(`ecoplay_progress_${userB.id}`);
      if (!progressRaw) return false;
      const progress = JSON.parse(progressRaw);
      return Array.isArray(progress.badges) && progress.badges.includes('first_login');
    });
    const progressA = JSON.parse(localStorage.getItem(`ecoplay_progress_${userA.id}`) || '{}');
    const progressB = JSON.parse(localStorage.getItem(`ecoplay_progress_${userB.id}`) || '{}');

    expect(progressA.badges.filter((id) => id === 'first_login')).toHaveLength(1);
    expect(progressB.badges.filter((id) => id === 'first_login')).toHaveLength(1);
    expect(typeof progressA.badgeUnlocks?.first_login).toBe('string');
    expect(typeof progressB.badgeUnlocks?.first_login).toBe('string');
  });

  it('reflete a lógica na interface (contador de conquistas)', async () => {
    const today = todayLondrinaDate();
    const user = { id: 2, name: 'Carol', email: 'carol@example.com', avatar: 'default', streak: 1, lastLoginDate: today };
    setSessionUser(user);
    setUserProgress(user.id, createBaselineProgress({ lastDailyXpDate: today }));

    await render(
      <Providers>
        <DashboardWithUnlock badgeId="first_login" />
      </Providers>
    );

    await waitFor(() => {
      const labelSpan = Array.from(container.querySelectorAll('span')).find((s) => s.textContent === 'Conquistas');
      if (!labelSpan) return false;
      const parent = labelSpan.parentElement;
      if (!parent) return false;
      const countSpan = Array.from(parent.querySelectorAll('span')).find(
        (s) => s !== labelSpan && /^\d+$/.test(s.textContent || '')
      );
      return countSpan?.textContent === '1';
    });

    const labelSpan = Array.from(container.querySelectorAll('span')).find((s) => s.textContent === 'Conquistas');
    expect(labelSpan).toBeDefined();
    const parent = labelSpan?.parentElement;
    expect(parent).toBeDefined();
    const countSpan = Array.from(parent.querySelectorAll('span')).find((s) => s !== labelSpan && /^\d+$/.test(s.textContent || ''));
    expect(countSpan?.textContent).toBe('1');
  });
});
