import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import { AuthProvider } from '@/context/AuthContext';
import { GameStateProvider } from '@/context/GameStateContext';
import { dateOnlyNowLondrina } from '@/utils/dateTime';

expect.extend(matchers);

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <GameStateProvider>
          <Dashboard />
        </GameStateProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('exibe o Top 3 jogadores por XP', async () => {
    const today = dateOnlyNowLondrina();

    localStorage.setItem(
      'ecoplay_user',
      JSON.stringify({
        id: 2,
        name: 'Bruno',
        email: 'bruno@example.com',
        avatar: 'default',
        streak: 1,
        lastLoginDate: today
      })
    );

    localStorage.setItem(
      'ecoplay_users_db',
      JSON.stringify([
        { id: 1, name: 'Ana', email: 'ana@example.com', streak: 1, lastLoginDate: today },
        { id: 2, name: 'Bruno', email: 'bruno@example.com', streak: 1, lastLoginDate: today },
        { id: 3, name: 'Carla', email: 'carla@example.com', streak: 1, lastLoginDate: today },
        { id: 4, name: 'Daniel', email: 'daniel@example.com', streak: 1, lastLoginDate: today }
      ])
    );

    localStorage.setItem('ecoplay_progress_1', JSON.stringify({ score: 3000, stats: { xp: 3000 }, lastDailyXpDate: today }));
    localStorage.setItem('ecoplay_progress_2', JSON.stringify({ score: 1500, stats: { xp: 1500 }, lastDailyXpDate: today }));
    localStorage.setItem('ecoplay_progress_3', JSON.stringify({ score: 9000, stats: { xp: 9000 }, lastDailyXpDate: today }));
    localStorage.setItem('ecoplay_progress_4', JSON.stringify({ score: 10, stats: { xp: 10 }, lastDailyXpDate: today }));

    renderDashboard();

    expect(await screen.findByRole('heading', { level: 2, name: /top 3 jogadores/i })).toBeInTheDocument();

    const list = await screen.findByLabelText('Top 3 jogadores');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(3);

    expect(items[0]).toHaveTextContent('Carla');
    expect(items[0]).toHaveTextContent('9.000 XP');

    expect(items[1]).toHaveTextContent('Ana');
    expect(items[1]).toHaveTextContent('3.000 XP');

    expect(items[2]).toHaveTextContent('Bruno');
    expect(items[2]).toHaveTextContent('1.500 XP');
    expect(within(items[2]).getByText('Você')).toBeInTheDocument();
  });
});

