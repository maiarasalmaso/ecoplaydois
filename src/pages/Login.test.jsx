import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '@/pages/Login';
import Header from '@/components/ui/Header';
import { AuthProvider } from '@/context/AuthContext';
import { GameStateProvider } from '@/context/GameStateContext';

expect.extend(matchers);

const renderLoginRouter = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<div>Admin</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('exibe acesso administrativo no /login', async () => {
    renderLoginRouter();

    const adminLink = await screen.findByRole('link', { name: /acessar login administrativo/i });
    expect(adminLink).toHaveAttribute('href', '/admin');
  });

  it('navega para /admin ao clicar no acesso administrativo', async () => {
    renderLoginRouter();

    const adminLink = await screen.findByRole('link', { name: /acessar login administrativo/i });
    fireEvent.click(adminLink);
    expect(await screen.findByText('Admin')).toBeInTheDocument();
  });

  it('não exibe acesso administrativo no header (outras páginas)', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <GameStateProvider>
            <Header />
          </GameStateProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByLabelText(/área administrativa/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /área admin/i })).not.toBeInTheDocument();
  });
});
