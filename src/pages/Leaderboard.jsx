import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Gamepad2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const GAMES = [
    { id: 'quiz', name: 'Eco Quiz' },
    { id: 'sudoku', name: 'Eco Sudoku' },
    { id: 'memory', name: 'Jogo da Memória' },
    { id: 'swipe', name: 'Eco Swipe' },
    { id: 'math', name: 'Eco Math' },
    { id: 'hangman', name: 'Forca Ecológica' },
    { id: 'platformer', name: 'Eco Platformer' },
    { id: 'guardian', name: 'Eco Guardian' },
    { id: 'passarepassa', name: 'Passa ou Repassa' }
];

const Leaderboard = () => {
    const [selectedGame, setSelectedGame] = useState(GAMES[0].id);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchScores(selectedGame);
    }, [selectedGame]);

    const fetchScores = async (gameId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/games/${gameId}/leaderboard`);
            setScores(response.data);
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
            setError('Falha ao carregar o placar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const getMedalColor = (index) => {
        switch (index) {
            case 0: return 'text-yellow-400';
            case 1: return 'text-slate-300';
            case 2: return 'text-amber-600';
            default: return 'text-slate-500';
        }
    };

    return (
        <div className="min-h-screen bg-theme-bg-primary pt-20 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link to="/dashboard" className="inline-flex items-center text-theme-text-secondary hover:text-green-500 mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Dashboard
                        </Link>
                        <h1 className="text-4xl font-display font-bold text-theme-text-primary flex items-center gap-3">
                            <Trophy className="w-10 h-10 text-yellow-400" />
                            Placar de Líderes
                        </h1>
                        <p className="text-theme-text-secondary mt-2">Veja os melhores jogadores de cada desafio ecológico.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-theme-bg-secondary p-1 rounded-xl border border-theme-border">
                        <Gamepad2 className="w-5 h-5 text-green-500 ml-2" />
                        <select
                            value={selectedGame}
                            onChange={(e) => setSelectedGame(e.target.value)}
                            className="bg-transparent border-none text-theme-text-primary focus:ring-0 cursor-pointer py-2 pr-8 font-bold"
                        >
                            {GAMES.map(game => (
                                <option key={game.id} value={game.id} className="bg-theme-bg-secondary text-theme-text-primary">
                                    {game.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-theme-bg-secondary/50 backdrop-blur border border-theme-border rounded-3xl overflow-hidden shadow-xl">
                    {loading ? (
                        <div className="p-12 text-center text-theme-text-tertiary animate-pulse">
                            Carregando pontuações...
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center text-red-500">
                            {error}
                        </div>
                    ) : scores.length === 0 ? (
                        <div className="p-12 text-center text-theme-text-tertiary flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-theme-bg-tertiary rounded-full flex items-center justify-center">
                                <Trophy className="w-8 h-8 text-theme-text-tertiary" />
                            </div>
                            <p>Ainda não há pontuações para este jogo.</p>
                            <Link
                                to={`/games/${selectedGame === 'platformer' ? 'eco-platformer' : selectedGame === 'guardian' ? 'eco-guardian' : selectedGame}`} /* Approximate mapping check needed */
                                className="text-green-500 font-bold hover:underline"
                            >
                                Seja o primeiro a jogar!
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-theme-bg-tertiary/50 text-theme-text-tertiary text-sm uppercase tracking-wider">
                                        <th className="p-4 pl-6 font-medium">Rank</th>
                                        <th className="p-4 font-medium">Jogador</th>
                                        <th className="p-4 font-medium text-right">Pontuação / XP</th>
                                        <th className="p-4 pr-6 font-medium text-right">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme-border/50">
                                    {scores.map((score, index) => (
                                        <motion.tr
                                            key={index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-theme-bg-tertiary/30 transition-colors"
                                        >
                                            <td className="p-4 pl-6 font-mono font-bold text-lg w-20">
                                                <div className="flex items-center gap-2">
                                                    {index < 3 ? <Crown className={`w-5 h-5 ${getMedalColor(index)}`} /> : <span className="w-5" />}
                                                    <span className={getMedalColor(index)}>#{index + 1}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-theme-text-primary mb-0.5">{score.full_name || 'Anônimo'}</div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="inline-block bg-theme-bg-tertiary px-3 py-1 rounded-lg border border-theme-border font-mono text-green-500 font-bold">
                                                    {score.score.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right text-theme-text-tertiary text-sm">
                                                {new Date(score.played_at).toLocaleDateString()}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
