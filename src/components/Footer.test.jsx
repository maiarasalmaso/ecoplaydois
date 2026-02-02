import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter } from 'react-router-dom';
import Footer from "../../frontend/src/components/ui/Footer";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

describe('Footer', () => {
  it('renderiza links com texto descritivo e rotas corretas', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    const sobreNos = screen.getByRole('link', { name: /Sobre Nós/i });
    expect(sobreNos).toHaveAttribute('href', '/about');
    expect(sobreNos).toHaveAttribute('aria-label');
    expect(screen.getByText(/Quem somos, nossa missão/i)).toBeInTheDocument();

    const segurancaPrivacidade = screen.getByRole('link', { name: /Segurança e Privacidade/i });
    expect(segurancaPrivacidade).toHaveAttribute('href', '/privacy');
    expect(segurancaPrivacidade).toHaveAttribute('aria-label');
    expect(screen.getByText(/Como coletamos e protegemos dados/i)).toBeInTheDocument();
  });
});
