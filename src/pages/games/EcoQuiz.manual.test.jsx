/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter } from 'react-router-dom';
import EcoQuiz from '@/pages/games/EcoQuiz';
import * as GameStateContext from '@/context/GameStateContext';
import { loadManualQuestions, validateQuestionsForAge } from '@/utils/quizData';

expect.extend(matchers);

vi.mock('@/context/GameStateContext', () => ({
  useGameState: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('EcoQuiz Manual Questions', () => {
  const mockAddScore = vi.fn();
  const mockUpdateStat = vi.fn();
  const mockCompleteLevel = vi.fn();

  beforeEach(() => {
    vi.mocked(GameStateContext.useGameState).mockReturnValue({
      addScore: mockAddScore,
      updateStat: mockUpdateStat,
      completeLevel: mockCompleteLevel,
    });
  });

  it('renderiza seleção de idade', () => {
    render(
      <MemoryRouter>
        <EcoQuiz />
      </MemoryRouter>
    );
    expect(screen.getByText('EcoQuiz')).toBeInTheDocument();
    expect(screen.getByText('Escolha sua idade para começar o desafio de conhecimentos sustentáveis!')).toBeInTheDocument();
    [10, 11, 12, 13, 14].forEach(age => {
      expect(screen.getByText(String(age))).toBeInTheDocument();
    });
  });

  it('carrega perguntas corretas para idade 10 e exibe a primeira', () => {
    render(
      <MemoryRouter>
        <EcoQuiz />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('10'));
    const expected = loadManualQuestions(10);
    expect(validateQuestionsForAge(10, expected)).toBe(true);
    expect(screen.getByText(expected[0].question)).toBeInTheDocument();
    const options = expected[0].options;
    options.forEach(opt => {
      expect(screen.getByRole('button', { name: opt })).toBeInTheDocument();
    });
    expect(options).toHaveLength(4);
  });

  it('carrega perguntas corretas para idade 14 e exibe a primeira', () => {
    render(
      <MemoryRouter>
        <EcoQuiz />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('14'));
    const expected = loadManualQuestions(14);
    expect(validateQuestionsForAge(14, expected)).toBe(true);
    expect(screen.getByText(expected[0].question)).toBeInTheDocument();
    const options = expected[0].options;
    options.forEach(opt => {
      expect(screen.getByRole('button', { name: opt })).toBeInTheDocument();
    });
    expect(options).toHaveLength(4);
  });
});
