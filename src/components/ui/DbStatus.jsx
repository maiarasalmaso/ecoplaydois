import { useState, useEffect } from 'react';
import api from '@/services/api';
import { Database } from 'lucide-react';

const DbStatus = () => {
    const [status, setStatus] = useState('checking'); // 'checking', 'connected', 'error'
    const [latency, setLatency] = useState(null);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const start = Date.now();
                await api.get('/health');
                const duration = Date.now() - start;
                setLatency(duration);
                setStatus('connected');
            } catch (error) {
                console.error('DB Check Failed:', error);
                setStatus('error');
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Poll every 30s as it's cheap (serverless)
        return () => clearInterval(interval);
    }, []);

    const getColor = () => {
        if (status === 'connected') return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
        if (status === 'error') return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
        return 'bg-yellow-500';
    };

    const getTitle = () => {
        if (status === 'connected') return `Banco de Dados: Online (${latency}ms)`;
        if (status === 'error') return 'Banco de Dados: Indisponível (Erro de Conexão)';
        return 'Verificando conexão...';
    };

    return (
        <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-theme-bg-tertiary border border-theme-border backdrop-blur-sm transition-all hover:bg-theme-bg-secondary cursor-help group"
            title={getTitle()}
        >
            <Database className="w-3 h-3 text-theme-text-tertiary group-hover:text-theme-text-primary transition-colors" />
            <div className={`w-2 h-2 rounded-full ${getColor()} transition-colors duration-500`} />
            <span className="text-[10px] font-mono text-theme-text-secondary w-0 overflow-hidden group-hover:w-auto group-hover:ml-1 transition-all duration-300 whitespace-nowrap">
                {status === 'connected' ? `${latency}ms` : 'OFF'}
            </span>
        </div>
    );
};

export default DbStatus;
