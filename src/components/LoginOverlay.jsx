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
    const [mode, setMode] = useState('quick'); // 'quick' | 'full'
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { sync, login } = useAuth();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const isLight = theme === 'light';

    const handleQuickSync = async (e) => {
        e.preventDefault();
        if (!username.trim()) {
            setError('Digite um nome de usuário');
            return;
        }

        setError('');
        setLoading(true);

        try {
            await sync(username.trim());
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose?.();
                navigate('/dashboard');
            }, 1000);
        } catch (err) {
            console.error('Sync failed:', err);
            setError(err.response?.data?.error || 'Falha ao sincronizar');
        } finally {
            setLoading(false);
        }
    };

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

    const resetForm = () => {
        setError('');
        setSuccess(false);
        setUsername('');
        setEmail('');
        setPassword('');
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
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-theme-text-primary">Conectar Dispositivo</h2>
                                <p className="text-sm text-theme-text-tertiary">Sincronize seu progresso entre PC e Mobile</p>
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
                            <p className="text-sm text-theme-text-secondary">Redirecionando para o Dashboard...</p>
                        </motion.div>
                    ) : (
                        <>
                            {/* Mode Tabs */}
                            <div className="flex border-b border-theme-border">
                                <button
                                    onClick={() => { setMode('quick'); resetForm(); }}
                                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'quick'
                                            ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5'
                                            : 'text-theme-text-tertiary hover:text-theme-text-secondary'
                                        }`}
                                >
                                    <Zap className="w-4 h-4" />
                                    Acesso Rápido
                                </button>
                                <button
                                    onClick={() => { setMode('full'); resetForm(); }}
                                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'full'
                                            ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-500/5'
                                            : 'text-theme-text-tertiary hover:text-theme-text-secondary'
                                        }`}
                                >
                                    <Mail className="w-4 h-4" />
                                    Email & Senha
                                </button>
                            </div>

                            {/* Form Content */}
                            <div className="p-6">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 text-sm text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {mode === 'quick' ? (
                                    <form onSubmit={handleQuickSync} className="space-y-4">
                                        {/* Explanation */}
                                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="flex items-start gap-3">
                                                <div className="flex items-center gap-1 text-emerald-500">
                                                    <Monitor className="w-5 h-5" />
                                                    <ArrowRight className="w-4 h-4" />
                                                    <Smartphone className="w-5 h-5" />
                                                </div>
                                                <p className="text-xs text-theme-text-secondary leading-relaxed">
                                                    Digite o <strong>mesmo nome</strong> no PC e no celular para sincronizar automaticamente seu progresso.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Username Input */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-theme-text-secondary">
                                                Seu Nome de Usuário
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-tertiary" />
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    placeholder="Ex: Jogador1"
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-theme-input-bg border border-theme-input-border text-theme-text-primary placeholder:text-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                                                    autoFocus
                                                />
                                            </div>
                                            <p className="text-xs text-theme-text-tertiary">
                                                Dica: Use um nome único que você lembrará em ambos dispositivos
                                            </p>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    Sincronizando...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-4 h-4" />
                                                    Sincronizar Agora
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleFullLogin} className="space-y-4">
                                        {/* Email Input */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-theme-text-secondary">
                                                Email
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-text-tertiary" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="seu@email.com"
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-theme-input-bg border border-theme-input-border text-theme-text-primary placeholder:text-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                    autoFocus
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
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-theme-input-bg border border-theme-input-border text-theme-text-primary placeholder:text-theme-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
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
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LoginOverlay;
