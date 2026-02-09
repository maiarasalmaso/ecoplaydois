import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import {
    User,
    Mail,
    Lock,
    Zap,
    ArrowRight,
    X,
    Smartphone,
    Monitor,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';

/**
 * LoginOverlay - Componente de Identidade Unificada Cross-Device
 * 
 * Oferece duas formas de acesso:
 * 1. Acesso Rápido por Nome (ideal para conectar PC e Mobile)
 * 2. Login Tradicional por Email/Senha
 */
const LoginOverlay = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleFullLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Preencha email e senha');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await login(email, password);
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose?.();
                navigate('/dashboard');
            }, 1000);
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.response?.data?.error || 'Credenciais inválidas');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose?.()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md bg-theme-card-bg border border-theme-border rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative p-6 pb-4 border-b border-theme-border">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-theme-bg-secondary transition-colors"
                        >
                            <X className="w-5 h-5 text-theme-text-tertiary" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-theme-text-primary">Fazer Login</h2>
                                <p className="text-sm text-theme-text-tertiary">Entre com suas credenciais</p>
                            </div>
                        </div>
                    </div>

                    {/* Success State */}
                    {success ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-8 text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-bold text-theme-text-primary mb-2">Conectado!</h3>
                            <p className="text-sm text-theme-text-secondary">Redirecionando...</p>
                        </motion.div>
                    ) : (
                        <div className="p-6">
                            {/* Form Content */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleFullLogin} className="space-y-4" autoComplete="off">
                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-theme-text-secondary">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-tertiary" />
                                        <input
                                            type="email"
                                            name="ecoplay_acesso_email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-theme-input-bg border border-theme-input-border text-theme-text-primary placeholder:text-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            autoFocus
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-theme-text-secondary">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-tertiary" />
                                        <input
                                            type="password"
                                            name="ecoplay_acesso_password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-theme-input-bg border border-theme-input-border text-theme-text-primary placeholder:text-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Entrando...
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="w-4 h-4" />
                                            Entrar
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LoginOverlay;
