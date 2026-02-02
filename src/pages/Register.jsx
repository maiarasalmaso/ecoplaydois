import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(fullName, email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || 'Erro ao criar conta.';
      const backendDetails = err.response?.data?.details || '';
      setError(`${backendError} ${backendDetails}`.trim());
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-bg-primary text-theme-text-primary px-4">
      <div className="w-full max-w-md rounded-2xl bg-theme-card-bg border border-theme-border p-8 shadow-2xl backdrop-blur-sm">
        <h2 className="mb-6 text-center text-3xl font-display font-bold text-green-500">Cadastre-se</h2>
        {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-500 text-sm font-medium text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block font-bold text-sm text-theme-text-secondary" htmlFor="fullName">Nome Completo</label>
            <input
              type="text"
              id="fullName"
              className="w-full rounded-xl border border-theme-input-border bg-theme-input-bg px-4 py-3 text-theme-input-text focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder-theme-text-tertiary"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="mb-2 block font-bold text-sm text-theme-text-secondary" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="w-full rounded-xl border border-theme-input-border bg-theme-input-bg px-4 py-3 text-theme-input-text focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder-theme-text-tertiary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>
          <div className="mb-6">
            <label className="mb-2 block font-bold text-sm text-theme-text-secondary" htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              className="w-full rounded-xl border border-theme-input-border bg-theme-input-bg px-4 py-3 text-theme-input-text focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder-theme-text-tertiary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-green-500 px-4 py-3 font-display font-bold text-theme-config-cod-gray hover:bg-green-400 focus:outline-none shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-0.5 text-slate-900"
          >
            CADASTRAR
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-theme-text-tertiary">
          Já tem uma conta? <Link to="/login" className="font-bold text-green-500 hover:text-green-400 transition-colors">Faça login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
