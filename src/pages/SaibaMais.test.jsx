import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter } from 'react-router-dom';
import SaibaMais from '../../frontend/src/pages/SaibaMais';

expect.extend(matchers);

const originalIntersectionObserver = globalThis.IntersectionObserver;

beforeAll(() => {
  globalThis.IntersectionObserver = class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterAll(() => {
  globalThis.IntersectionObserver = originalIntersectionObserver;
});

afterEach(() => {
  cleanup();
});

describe('SaibaMais', () => {
  it('renderiza o título e CTAs principais', () => {
    render(
      <MemoryRouter>
        <SaibaMais />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Saiba Mais' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Criar Conta/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /Entrar/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Ver Jogos/i })).toHaveAttribute('href', '/games');
  });
});
