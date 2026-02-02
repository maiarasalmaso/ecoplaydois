import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { useState } from 'react';
import { Buffer } from 'node:buffer';
import { webcrypto } from 'node:crypto';
import { AuthProvider, useAuth } from '../../frontend/src/context/AuthContext';

expect.extend(matchers);

const Harness = () => {
  const { register } = useAuth();
  const [success, setSuccess] = useState('');
  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const res = await register('Ana', 'ana@example.com', '123');
          setSuccess(String(Boolean(res?.success)));
        }}
      >
        register
      </button>
      <div data-testid="success">{success}</div>
    </div>
  );
};

const ResetHarness = () => {
  const { register, login, requestPasswordReset, confirmPasswordReset } = useAuth();
  const [code, setCode] = useState('');
  const [resetOk, setResetOk] = useState('');
  const [loginOk, setLoginOk] = useState('');
  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          await register('Ana', 'ana@example.com', '123');
        }}
      >
        seed
      </button>
      <button
        type="button"
        onClick={async () => {
          const res = await requestPasswordReset('ana@example.com');
          setCode(String(res?.resetCode || ''));
        }}
      >
        request-reset
      </button>
      <button
        type="button"
        onClick={async () => {
          const res = await confirmPasswordReset('ana@example.com', code, 'nova123');
          setResetOk(String(Boolean(res?.success)));
        }}
      >
        confirm-reset
      </button>
      <button
        type="button"
        onClick={async () => {
          const res = await login('ana@example.com', 'nova123');
          setLoginOk(String(Boolean(res?.success)));
        }}
      >
        login
      </button>
      <div data-testid="code">{code}</div>
      <div data-testid="reset-ok">{resetOk}</div>
      <div data-testid="login-ok">{loginOk}</div>
    </div>
  );
};

const LoginHarness = () => {
  const { login } = useAuth();
  const [success, setSuccess] = useState('');
  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const res = await login('ana@example.com', '123');
          setSuccess(String(Boolean(res?.success)));
        }}
      >
        login
      </button>
      <div data-testid="success">{success}</div>
    </div>
  );
};

describe('AuthContext - register', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    if (!globalThis.crypto?.subtle) globalThis.crypto = webcrypto;
    if (!globalThis.btoa) globalThis.btoa = (str) => Buffer.from(String(str), 'binary').toString('base64');
    if (!globalThis.atob) globalThis.atob = (base64) => Buffer.from(String(base64), 'base64').toString('binary');
  });

  afterEach(() => {
    cleanup();
  });

  it('recupera quando ecoplay_users_db está corrompido e salva o novo usuário', async () => {
    localStorage.setItem('ecoplay_users_db', '{');

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    const btn = await screen.findByRole('button', { name: 'register' });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId('success')).toHaveTextContent('true');
    });

    const raw = localStorage.getItem('ecoplay_users_db');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw || '[]');
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ name: 'Ana', email: 'ana@example.com' });
  });

  it('não salva senha em texto puro ao cadastrar localmente', async () => {
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    const btn = await screen.findByRole('button', { name: 'register' });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByTestId('success')).toHaveTextContent('true');
    });

    const raw = localStorage.getItem('ecoplay_users_db');
    const parsed = JSON.parse(raw || '[]');
    expect(parsed[0]?.password).toBeUndefined();
    expect(parsed[0]?.passwordHash).toBeTruthy();
    expect(parsed[0]?.passwordSalt).toBeTruthy();
    expect(parsed[0]?.passwordAlgo).toBeTruthy();
  });

  it('migra senha antiga em texto puro para hash no primeiro login', async () => {
    localStorage.setItem(
      'ecoplay_users_db',
      JSON.stringify([
        {
          id: 1,
          name: 'Ana',
          email: 'ana@example.com',
          password: '123',
          avatar: 'default',
          streak: 1,
          lastLoginDate: '2026-01-01',
        },
      ])
    );

    render(
      <AuthProvider>
        <LoginHarness />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(screen.getByTestId('success')).toHaveTextContent('true');
    });

    const raw = localStorage.getItem('ecoplay_users_db');
    const parsed = JSON.parse(raw || '[]');
    expect(parsed[0]?.password).toBeUndefined();
    expect(parsed[0]?.passwordHash).toBeTruthy();
  });

  it('permite reset de senha local via código temporário', async () => {
    render(
      <AuthProvider>
        <ResetHarness />
      </AuthProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'seed' }));
    await waitFor(() => {
      const raw = localStorage.getItem('ecoplay_users_db');
      const parsed = JSON.parse(raw || '[]');
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
    });
    fireEvent.click(await screen.findByRole('button', { name: 'request-reset' }));

    await waitFor(() => {
      expect(screen.getByTestId('code')).not.toHaveTextContent('');
    });

    fireEvent.click(await screen.findByRole('button', { name: 'confirm-reset' }));
    await waitFor(() => {
      expect(screen.getByTestId('reset-ok')).toHaveTextContent('true');
    });

    fireEvent.click(await screen.findByRole('button', { name: 'login' }));
    await waitFor(() => {
      expect(screen.getByTestId('login-ok')).toHaveTextContent('true');
    });
  });
});
