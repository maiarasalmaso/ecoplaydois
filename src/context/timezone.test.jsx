import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { AuthProvider, useAuth } from '../../frontend/src/context/AuthContext';
import { GameStateProvider, useGameState } from '../../frontend/src/context/GameStateContext';
import { dateOnlyNowLondrina } from '../../frontend/src/utils/dateTime';

expect.extend(matchers);

const AuthReadout = () => {
  const { user } = useAuth();
  return <div data-testid="last-login">{user?.lastLoginDate || ''}</div>;
};

const ScoreReadout = () => {
  const { score } = useGameState();
  return <div data-testid="score">{String(score)}</div>;
};

describe('Fuso horário (Londrina/UTC-3)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('usa a data de Londrina no cálculo de streak', async () => {
    vi.setSystemTime(new Date('2026-01-01T02:30:00Z'));
    const expectedToday = dateOnlyNowLondrina();

    localStorage.setItem(
      'ecoplay_user',
      JSON.stringify({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        avatar: 'default',
        streak: 5,
        lastLoginDate: expectedToday
      })
    );

    render(
      <AuthProvider>
        <AuthReadout />
      </AuthProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('last-login')).toHaveTextContent(expectedToday);
    expect(JSON.parse(localStorage.getItem('ecoplay_user') || '{}')?.lastLoginDate).toBe(expectedToday);
  });

  it('não concede bônus diário em mudanças de dia fora do UTC-3', async () => {
    vi.setSystemTime(new Date('2026-01-01T02:30:00Z'));
    const today = dateOnlyNowLondrina();

    const user = {
      id: 123,
      name: 'Bob',
      email: 'bob@example.com',
      avatar: 'default',
      streak: 1,
      lastLoginDate: today
    };

    localStorage.setItem('ecoplay_user', JSON.stringify(user));
    localStorage.setItem(
      `ecoplay_progress_${user.id}`,
      JSON.stringify({
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
        lastDailyXpDate: today,
        unclaimedRewards: []
      })
    );

    render(
      <AuthProvider>
        <GameStateProvider>
          <ScoreReadout />
        </GameStateProvider>
      </AuthProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('score')).toHaveTextContent('0');
  });
});
