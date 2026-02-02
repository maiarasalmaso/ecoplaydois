import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from '../../frontend/src/pages/admin/AdminLogin';

expect.extend(matchers);

const renderAtAdmin = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/painel" element={<div>Painel</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminLogin', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renderiza com credenciais padrão preenchidas e editáveis', () => {
    renderAtAdmin();

    const login = screen.getByLabelText('Email');
    const senha = screen.getByLabelText('Senha');

    expect(login).toHaveValue('admin@gmail.com');
    expect(senha).toHaveValue('admin');

    fireEvent.change(login, { target: { value: 'admin2' } });
    fireEvent.change(senha, { target: { value: 'admin2' } });

    expect(login).toHaveValue('admin2');
    expect(senha).toHaveValue('admin2');
  });

  it('permite entrar com as credenciais padrão', async () => {
    renderAtAdmin();

    fireEvent.click(screen.getByRole('button', { name: /entr(ar|ando)/i }));
    expect(await screen.findByText('Painel')).toBeInTheDocument();
  });

  it('mostra erro para campos vazios', () => {
    renderAtAdmin();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Preencha login e senha.');
  });

  it('mostra erro para credenciais inválidas', async () => {
    renderAtAdmin();

    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: /entr(ar|ando)/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciais inválidas');
  });

  it('salva preferência ao marcar lembrar credenciais', async () => {
    renderAtAdmin();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Lembrar credenciais' }));
    fireEvent.click(screen.getByRole('button', { name: /entr(ar|ando)/i }));

    await waitFor(() => {
      const remembered = JSON.parse(localStorage.getItem('ecoplay.admin.remember') || '{}');
      expect(remembered).toMatchObject({ login: 'admin@gmail.com', remember: true });
    });
  });

  it('ativa bloqueio após repetidas tentativas inválidas', async () => {
    renderAtAdmin();

    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'x' } });

    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /entr(ar|ando)/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /entr(ar|ando)/i })).not.toBeDisabled();
      });
    }

    fireEvent.click(screen.getByRole('button', { name: /entr(ar|ando)/i }));
    expect(await screen.findByText(/bloquead/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entr(ar|ando)/i })).toBeDisabled();
  });
});
