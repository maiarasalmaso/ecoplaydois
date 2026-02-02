/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter } from 'react-router-dom';

expect.extend(matchers);
import EcoSwipe from './EcoSwipe';
import * as GameStateContext from '@/context/GameStateContext';

// Mock context
vi.mock('@/context/GameStateContext', () => ({
  useGameState: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('EcoSwipe Game', () => {
  const mockAddScore = vi.fn();
  const mockUpdateStat = vi.fn();

  beforeEach(() => {
    vi.mocked(GameStateContext.useGameState).mockReturnValue({
      addScore: mockAddScore,
      updateStat: mockUpdateStat,
    });
  });

  it('renders start button initially', () => {
    render(
      <MemoryRouter>
        <EcoSwipe />
      </MemoryRouter>
    );
    expect(screen.getByText('Iniciar Jogo')).toBeInTheDocument();
  });

  it('starts game when start button is clicked', () => {
    render(
      <MemoryRouter>
        <EcoSwipe />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByText('Iniciar Jogo'));
    
    // Check if a card is displayed (look for text that indicates game started)
    // "Arraste para classificar" is present when card is shown
    expect(screen.getByText('Arraste para classificar')).toBeInTheDocument();
  });

  it('handles correct answer via button click', async () => {
    render(
      <MemoryRouter>
        <EcoSwipe />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Iniciar Jogo'));

    // We need to know which card is shown to click correct button.
    // Since card order is randomized, we might need to inspect the card name rendered.
    // However, for this test, we can just click one and verify *some* feedback happens, 
    // or try to force the deck?
    // We can't easily mock the internal state `deck` without changing code.
    // But we can check the text content of the card name.
    
    // Let's find the card name element. It's an h3.
    const cardName = screen.getByRole('heading', { level: 3 }).textContent;
    
    // We know the list of cards. Let's look it up.
    const ENERGY_CARDS = [
      { name: 'Solar', renewable: true },
      { name: 'Eólica', renewable: true },
      { name: 'Hidrelétrica', renewable: true },
      { name: 'Biomassa', renewable: true },
      { name: 'Geotérmica', renewable: true },
      { name: 'Maremotriz', renewable: true },
      { name: 'Carvão', renewable: false },
      { name: 'Petróleo', renewable: false },
      { name: 'Gás Natural', renewable: false },
      { name: 'Nuclear', renewable: false },
      { name: 'Óleo Diesel', renewable: false },
      { name: 'Xisto Betuminoso', renewable: false },
    ];
    
    const card = ENERGY_CARDS.find(c => c.name === cardName);
    const isRenewable = card.renewable;

    // Click the corresponding button.
    // There are two "Soltar Aqui" buttons. 
    // The "Renovável" zone has text "Renovável" in h2.
    // We can find buttons by looking at their parent containers or using the text content nearby?
    // The buttons have "Soltar Aqui".
    // "Não Renovável" zone is first in DOM (red), "Renovável" is last (green).
    // Or we can rely on the `onClick` handler call? No, integration test.
    
    const buttons = screen.getAllByText('Soltar Aqui');
    // Index 0 is Non-Renewable (red zone, usually left/top), Index 1 is Renewable (green zone).
    // Let's verify structure logic or add aria-labels in source code later.
    // Based on code:
    // First div is "Não Renovável", button calls answer(false).
    // Second div is "Renovável", button calls answer(true).
    
    const correctButtonIndex = isRenewable ? 1 : 0;
    
    fireEvent.click(buttons[correctButtonIndex]);

    // Expect score update
    await waitFor(() => {
        expect(mockAddScore).toHaveBeenCalledWith(10);
        expect(screen.getByText(/Correto!/)).toBeInTheDocument();
    });
  });
  
  it('handles timer expiration', () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <EcoSwipe />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Iniciar Jogo'));
    
    // Advance timer by 5 minutes (300s) + 1s buffer
    act(() => {
      vi.advanceTimersByTime(301000);
    });

    // Should show game over modal
    // "Vitória!" or "Derrota!"
    // Since we did nothing, score is 0-0? Or timeouts happened?
    // Timeouts per card would trigger every 10s.
    // So errors would pile up.
    // Thus likely "Derrota!".
    expect(screen.getByText(/Derrota!/)).toBeInTheDocument();
    
    vi.useRealTimers();
  });
});
