import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter } from 'react-router-dom';
import Header from '@/components/ui/Header';
import { AuthProvider, useAuth } from '../../frontend/src/context/AuthContext';
import { GameStateProvider } from '../../frontend/src/context/GameStateContext';

expect.extend(matchers);

const Providers = ({ initialPath, children }) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <AuthProvider>
      <GameStateProvider>{children}</GameStateProvider>
    </AuthProvider>
  </MemoryRouter>
);

const AuthHarness = () => {
  const { login, logout } = useAuth();
  return (
    <div>
      <button type="button" onClick={() => login('ana@example.com', '123')}>
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
};

describe('Header - CTA "Nos avalie"', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('não renderiza o botão na home mesmo com usuário logado', async () => {
    localStorage.setItem(
      'ecoplay_user',
      JSON.stringify({ id: 1, name: 'Ana', email: 'ana@example.com', avatar: 'default', streak: 1, lastLoginDate: '2026-01-01' })
    );

    render(
      <Providers initialPath="/">
        <Header />
      </Providers>
    );

    await screen.findByRole('link', { name: /eco/i });
    expect(screen.queryByRole('link', { name: /nos avalie/i })).not.toBeInTheDocument();
  });

  it('não renderiza o botão quando não há usuário autenticado', async () => {
    render(
      <Providers initialPath="/games">
        <Header />
      </Providers>
    );

    await screen.findByText('BASE');
    expect(screen.queryByRole('link', { name: /nos avalie/i })).not.toBeInTheDocument();
  });

  it('renderiza o botão quando há usuário autenticado fora da home', async () => {
    localStorage.setItem(
      'ecoplay_user',
      JSON.stringify({ id: 1, name: 'Ana', email: 'ana@example.com', avatar: 'default', streak: 1, lastLoginDate: '2026-01-01' })
    );

    render(
      <Providers initialPath="/games">
        <Header />
      </Providers>
    );

    await screen.findByText('BASE');
    const cta = await screen.findByRole('link', { name: /nos avalie/i });
    expect(cta).toHaveAttribute('href', '/avaliacao');
  });

  it('suporta transição entre estados de autenticação', async () => {
    localStorage.setItem(
      'ecoplay_users_db',
      JSON.stringify([{ id: 1, name: 'Ana', email: 'ana@example.com', password: '123', avatar: 'default', streak: 1, lastLoginDate: '2026-01-01' }])
    );

    render(
      <Providers initialPath="/games">
        <Header />
        <AuthHarness />
      </Providers>
    );

    await screen.findByText('BASE');
    expect(screen.queryByRole('link', { name: /nos avalie/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'login' }));
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /nos avalie/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'logout' }));
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /nos avalie/i })).not.toBeInTheDocument();
    });
  });

  it('fallback: não quebra quando sessão armazenada está corrompida', async () => {
    localStorage.setItem('ecoplay_user', '{');

    render(
      <Providers initialPath="/games">
        <Header />
      </Providers>
    );

    await screen.findByText('BASE');
    expect(screen.queryByRole('link', { name: /nos avalie/i })).not.toBeInTheDocument();
  });
});

