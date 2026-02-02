import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter } from 'react-router-dom';
import Feedback from '../../frontend/src/pages/Feedback';
import { AuthProvider } from '../../frontend/src/context/AuthContext';
import { GameStateProvider } from '../../frontend/src/context/GameStateContext';
import { dateOnlyNowLondrina } from '../../frontend/src/utils/dateTime';
import { FEEDBACK_RESPONSES_KEY } from '../../frontend/src/utils/feedbackStore';

expect.extend(matchers);

const baselineProgress = (today) => ({
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
    dashboard_visits: 0,
    timeSpentSeconds: 0,
    feedback_submissions: 0
  },
  completedLevels: {},
  lastDailyXpDate: today,
  unclaimedRewards: []
});

const renderFeedback = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <GameStateProvider>
          <Feedback />
        </GameStateProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe('Feedback - troféu por resposta', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('desbloqueia o troféu ao enviar o formulário', async () => {
    const today = dateOnlyNowLondrina();
    const user = { id: 7, name: 'Ana', email: 'ana@example.com', avatar: 'default', streak: 1, lastLoginDate: today };

    localStorage.setItem('ecoplay_user', JSON.stringify(user));
    localStorage.setItem('ecoplay_users_db', JSON.stringify([{ id: user.id, name: user.name, email: user.email, streak: user.streak, lastLoginDate: today }]));
    localStorage.setItem(`ecoplay_progress_${user.id}`, JSON.stringify(baselineProgress(today)));

    renderFeedback();

    expect(await screen.findByRole('heading', { level: 1, name: /validação da proposta/i })).toBeInTheDocument();

    const uxSelect5 = screen.getAllByRole('button', { name: 'Selecionar 5' });
    expect(uxSelect5).toHaveLength(6);
    uxSelect5.forEach((btn) => fireEvent.click(btn));

    fireEvent.click(screen.getByRole('button', { name: 'Aprendizado' }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Selecionar 5' })).toHaveLength(4);
    });
    const learningSelect5 = screen.getAllByRole('button', { name: 'Selecionar 5' });
    learningSelect5.forEach((btn) => fireEvent.click(btn));

    const submitBtn = screen.getByRole('button', { name: /concluir avaliação/i });
    await waitFor(() => expect(submitBtn).toBeEnabled());
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const raw = localStorage.getItem(`ecoplay_progress_${user.id}`);
      expect(raw).toBeTruthy();
      const progress = JSON.parse(raw || '{}');
      expect(progress.badges).toContain('feedback_responder');
      expect(Number(progress?.stats?.feedback_submissions || 0)).toBeGreaterThanOrEqual(1);
      expect(typeof progress?.badgeUnlocks?.feedback_responder).toBe('string');
    });

    const responsesRaw = localStorage.getItem(FEEDBACK_RESPONSES_KEY);
    expect(responsesRaw).toBeTruthy();
    const responses = JSON.parse(responsesRaw || '[]');
    expect(Array.isArray(responses)).toBe(true);
    expect(responses.length).toBeGreaterThanOrEqual(1);
    expect(responses[0]?.user?.email).toBe(user.email);
  });
});

