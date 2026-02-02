import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminPanel from '../../frontend/src/pages/admin/AdminPanel';

expect.extend(matchers);

const ADMIN_SESSION_KEY = 'ecoplay.admin.session';

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const setAdminSession = ({ expiresAt }) => {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ createdAt: Date.now(), expiresAt }));
};

const renderAtPanel = () =>
  render(
    <MemoryRouter initialEntries={['/admin/painel']}>
      <Routes>
        <Route path="/admin" element={<div>Login</div>} />
        <Route path="/admin/painel" element={<AdminPanel />} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('redireciona para /admin quando não existe sessão válida', async () => {
    renderAtPanel();
    expect(await screen.findByText('Login')).toBeInTheDocument();
  });

  it('carrega dados consolidados e exibe métricas principais', async () => {
    const today = todayIsoDate();
    setAdminSession({ expiresAt: Date.now() + 60_000 });

    localStorage.setItem(
      'ecoplay_users_db',
      JSON.stringify([
        { id: 1, name: 'Ana', email: 'ana@example.com', streak: 3, lastLoginDate: today },
        { id: 2, name: 'Bruno', email: 'bruno@example.com', streak: 1, lastLoginDate: '2000-01-01' }
      ])
    );
    localStorage.setItem(
      'ecoplay_progress_1',
      JSON.stringify({ score: 1200, badges: ['first_login'], badgeUnlocks: { first_login: today }, stats: { xp: 500 } })
    );
    localStorage.setItem(
      'ecoplay_progress_2',
      JSON.stringify({ score: 300, badges: [], badgeUnlocks: {}, stats: { xp: 50 } })
    );

    renderAtPanel();

    expect(await screen.findByRole('heading', { level: 1, name: 'Painel do Administrador' })).toBeInTheDocument();
    expect(screen.getByLabelText('Total de usuários')).toHaveTextContent('2');
    expect(screen.getByLabelText('Usuários ativos')).toHaveTextContent('1');
  });

  it('reconhece novos usuários quando o armazenamento é atualizado', async () => {
    const today = todayIsoDate();
    setAdminSession({ expiresAt: Date.now() + 60_000 });

    const users1 = [{ id: 1, name: 'Ana', email: 'ana@example.com', streak: 1, lastLoginDate: today }];
    localStorage.setItem('ecoplay_users_db', JSON.stringify(users1));
    localStorage.setItem('ecoplay_progress_1', JSON.stringify({ score: 10, stats: { xp: 10 } }));

    renderAtPanel();
    await screen.findByRole('heading', { level: 1, name: 'Painel do Administrador' });
    expect(screen.getByLabelText('Total de usuários')).toHaveTextContent('1');

    const users2 = [...users1, { id: 2, name: 'Bruno', email: 'bruno@example.com', streak: 1, lastLoginDate: today }];
    localStorage.setItem('ecoplay_users_db', JSON.stringify(users2));
    window.dispatchEvent(new StorageEvent('storage', { key: 'ecoplay_users_db', newValue: JSON.stringify(users2), storageArea: localStorage }));

    await waitFor(() => {
      expect(screen.getByLabelText('Total de usuários')).toHaveTextContent('2');
      const table = screen.getByRole('table');
      expect(within(table).getByText('Bruno')).toBeInTheDocument();
    });
  });

  it('aplica filtro de tipo de usuário e restringe a listagem', async () => {
    const today = todayIsoDate();
    setAdminSession({ expiresAt: Date.now() + 60_000 });

    localStorage.setItem(
      'ecoplay_users_db',
      JSON.stringify([
        { id: 1, name: 'Ana', email: 'ana@example.com', streak: 3, lastLoginDate: today },
        { id: 2, name: 'Bruno', email: 'bruno@example.com', streak: 1, lastLoginDate: '2000-01-01' }
      ])
    );
    localStorage.setItem('ecoplay_progress_1', JSON.stringify({ score: 10, stats: { xp: 1 } }));
    localStorage.setItem('ecoplay_progress_2', JSON.stringify({ score: 10, stats: { xp: 1 } }));

    renderAtPanel();
    await screen.findByRole('heading', { level: 1, name: 'Painel do Administrador' });

    fireEvent.change(screen.getByLabelText('Filtrar por tipo de usuário'), { target: { value: 'inactive' } });

    await waitFor(() => {
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row').slice(1);
      expect(rows).toHaveLength(1);
      expect(within(rows[0]).getByText('Bruno')).toBeInTheDocument();
      expect(within(table).queryByText('Ana')).not.toBeInTheDocument();
    });
  });

  it('redireciona quando a sessão está expirada', async () => {
    setAdminSession({ expiresAt: Date.now() - 1 });
    renderAtPanel();
    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
  });

  it('faz logout e limpa sessão', async () => {
    setAdminSession({ expiresAt: Date.now() + 60_000 });
    localStorage.setItem('ecoplay_users_db', JSON.stringify([]));

    renderAtPanel();
    await screen.findByRole('heading', { level: 1, name: 'Painel do Administrador' });

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(await screen.findByText('Login')).toBeInTheDocument();
    expect(sessionStorage.getItem(ADMIN_SESSION_KEY)).toBeNull();
  });
});
