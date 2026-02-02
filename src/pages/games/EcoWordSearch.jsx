import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, AlertTriangle, CheckCircle, XCircle, Info, RefreshCcw, HelpCircle, Sparkles, BookOpen } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useGameState } from '@/context/GameStateContext';
import { playClick, playHover, playSuccess, playError, playWin, playMagicPop } from '@/utils/soundEffects';
import confetti from 'canvas-confetti';

// --- DATA & CONFIG ---

const BOARD_SIZE = 15;

const WORD_DATA = [
    {
        word: 'SOLAR',
        question: 'Painéis solares funcionam só em lugares quentes?',
        options: [
            { text: 'Sim, precisam de muito calor', isTrick: true, feedback: 'MITO! Painéis solares funcionam com LUZ, não calor. Na verdade, o calor excessivo pode até reduzir a eficiência deles!' },
            { text: 'Não, funcionam com a luz do sol', isCorrect: true, feedback: 'CORRETO! A tecnologia fotovoltaica converte radiação luminosa em eletricidade. Dias frios e ensolarados são ótimos para a geração.' },
            { text: 'Só funcionam ao meio-dia', isTrick: false, feedback: 'Incorreto. Funcionam sempre que há luminosidade, embora o pico seja ao meio-dia.' },
            { text: 'Precisam de fogo para funcionar', isTrick: false, feedback: 'Incorreto. A fonte é a luz solar, nada a ver com combustão.' }
        ]
    },
    {
        word: 'EOLICA',
        question: 'Turbinas eólicas matam muitos pássaros?',
        options: [
            { text: 'Sim, mais que prédios e gatos', isTrick: true, feedback: 'MITO! Gatos e colisões com prédios matam milhares de vezes mais pássaros que turbinas. O impacto existe, mas é comparativamente baixo.' },
            { text: 'Sim, são a maior causa de morte', isTrick: false, feedback: 'Incorreto. Mudanças climáticas e perda de habitat são ameaças muito maiores.' },
            { text: 'Não, o impacto é menor que outras estruturas', isCorrect: true, feedback: 'CORRETO! Estudos mostram que o impacto é pequeno se comparado a outras estruturas humanas. E as novas turbinas são ainda mais seguras.' },
            { text: 'Elas ajudam os pássaros a voar', isTrick: false, feedback: 'Incorreto. Elas são estruturas estáticas ou rotativas, não ajudam no voo.' }
        ]
    },
    {
        word: 'HIDRELETRICA',
        question: 'Usinas hidrelétricas são 100% limpas?',
        options: [
            { text: 'Sim, pois usam apenas água', isTrick: true, feedback: 'CUIDADO! A construção de barragens alaga grandes áreas, liberando metano (gás estufa) da vegetação podre e afetando a fauna local.' },
            { text: 'Elas poluem o ar com fumaça preta', isTrick: false, feedback: 'Incorreto. Elas não queimam combustível, então não geram fumaça preta.' },
            { text: 'Não, pois afetam ecossistemas', isCorrect: true, feedback: 'CORRETO! Apesar de ser renovável, o impacto ambiental e social da construção de grandes represas é significativo.' },
            { text: 'São poluentes nucleares', isTrick: false, feedback: 'Errado. Não envolve reação nuclear.' }
        ]
    },
    {
        word: 'GEOTERMICA',
        question: 'Energia geotérmica só funciona em vulcões?',
        options: [
            { text: 'Sim, precisa de lava exposta', isTrick: true, feedback: 'PEGADINHA! O calor da Terra está em todo lugar. Embora vulcões ajudem, bombas de calor geotérmicas podem ser usadas em quase qualquer quintal.' },
            { text: 'Não, aproveita o calor interno da Terra', isCorrect: true, feedback: 'CORRETO! É a energia térmica gerada e armazenada na Terra. Pode ser usada para eletricidade ou apenas aquecimento/resfriamento.' },
            { text: 'Funciona com gelo', isTrick: false, feedback: 'Errado. O princípio é o calor, não o frio.' },
            { text: 'Só funciona no deserto', isTrick: false, feedback: 'Errado. A temperatura do solo é constante em todo o planeta abaixo de certa profundidade.' }
        ]
    },
    {
        word: 'BIOMASSA',
        question: 'Queimar biomassa polui tanto quanto carvão?',
        options: [
            { text: 'Sim, é fumaça tóxica igual', isTrick: true, feedback: 'NÃO EXATAMENTE! Biomassa emite CO2, mas é o CO2 que a planta absorveu recentemente. É um ciclo curto de carbono, diferente do carvão fóssil.' },
            { text: 'Não, pode ser neutra em carbono', isCorrect: true, feedback: 'CORRETO! O carbono emitido faz parte do ciclo natural atual, não adicionando "carbono novo" à atmosfera como os combustíveis fósseis.' },
            { text: 'Não emite nada', isTrick: false, feedback: 'Errado. Emite particulados e gases, precisa de filtros.' },
            { text: 'É feita de plástico', isTrick: false, feedback: 'Errado. Biomassa vem de matéria orgânica.' }
        ]
    },
    {
        word: 'MAREMOTRIZ',
        question: 'Maremotriz e Hidrelétrica são iguais?',
        options: [
            { text: 'Sim, ambas usam água', isTrick: true, feedback: 'CONFUSÃO COMUM! Hidrelétrica usa a gravidade em rios (água doce). Maremotriz usa a força gravitacional da lua sobre os oceanos (marés).' },
            { text: 'Não, maremotriz usa as marés', isCorrect: true, feedback: 'CORRETO! É a energia gerada pelo movimento de subida e descida do nível do mar ou correntes oceânicas.' },
            { text: 'Usa ondas de wi-fi', isTrick: false, feedback: 'Errado.' },
            { text: 'É energia solar na água', isTrick: false, feedback: 'Errado.' }
        ]
    },
    {
        word: 'RENOVAVEL',
        question: 'Fontes renováveis são sempre infinitas?',
        options: [
            { text: 'Sim, nunca acabam ou pausam', isTrick: true, feedback: 'MITO! O vento para, o sol se põe, a seca afeta rios. A fonte se regenera, mas a energia não está disponível 100% do tempo (intermitência).' },
            { text: 'Não, dependem da natureza', isCorrect: true, feedback: 'CORRETO! Elas se renovam naturalmente, mas sua disponibilidade varia com o clima e hora do dia.' },
            { text: 'Elas acabam em 10 anos', isTrick: false, feedback: 'Errado. Elas duram enquanto o sol e a terra existirem.' },
            { text: 'São artificiais', isTrick: false, feedback: 'Errado. São processos naturais.' }
        ]
    },
    {
        word: 'SUSTENTAVEL',
        question: 'Energia nuclear é considerada renovável?',
        options: [
            { text: 'Sim, pois não emite CO2', isTrick: true, feedback: 'ERRO COMUM! Nuclear é de "baixo carbono", mas usa Urânio, um minério finito. Portanto, não é renovável pois o combustível acaba.' },
            { text: 'Não, o urânio é um recurso finito', isCorrect: true, feedback: 'CORRETO! Embora limpa em emissões de efeito estufa, depende de um combustível mineral que não se regenera.' },
            { text: 'É renovável e infinita', isTrick: false, feedback: 'Errado.' },
            { text: 'É feita de plantas', isTrick: false, feedback: 'Errado.' }
        ]
    },
    {
        word: 'FOTOVOLTAICO',
        question: 'Painéis solares duram pouco?',
        options: [
            { text: 'Sim, só 5 anos', isTrick: true, feedback: 'MITO! Painéis de qualidade duram 25 a 30 anos e ainda continuam funcionando com cerca de 80% da eficiência original.' },
            { text: 'Não, duram décadas', isCorrect: true, feedback: 'CORRETO! É uma tecnologia robusta, sem partes móveis, o que garante longuíssima durabilidade.' },
            { text: 'Duram para sempre novos', isTrick: false, feedback: 'Exagero. Eles degradam um pouco (aprox 0.5% ao ano).' },
            { text: 'Derretem na chuva', isTrick: false, feedback: 'Errado.' }
        ]
    },
    {
        word: 'TURBINA',
        question: 'Turbinas eólicas são barulhentas demais?',
        options: [
            { text: 'Sim, ensurdecedoras', isTrick: true, feedback: 'MITO ANTIGO! Turbinas modernas, a 300m de distância, fazem um ruído similar a uma geladeira ou vento nas folhas. Você conversa normalmente embaixo de uma.' },
            { text: 'Não, evoluíram e são silenciosas', isCorrect: true, feedback: 'CORRETO! O design aerodinâmico melhorou muito. O "barulho" costuma ser apenas o som do próprio vento.' },
            { text: 'Elas tocam música', isTrick: false, feedback: 'Errado.' },
            { text: 'São mudas', isTrick: false, feedback: 'Quase, mas fazem um leve "swoosh".' }
        ]
    }
];

// --- UTILS ---

const generateGrid = (words, size) => {
    let grid = Array(size).fill(null).map(() => Array(size).fill(''));
    let placedWords = [];
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0]];

    for (let item of words) {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const startRow = Math.floor(Math.random() * size);
            const startCol = Math.floor(Math.random() * size);
            let endRow = startRow + dir[0] * (item.word.length - 1);
            let endCol = startCol + dir[1] * (item.word.length - 1);

            if (endRow >= 0 && endRow < size && endCol >= 0 && endCol < size) {
                let collision = false;
                for (let i = 0; i < item.word.length; i++) {
                    const r = startRow + dir[0] * i;
                    const c = startCol + dir[1] * i;
                    if (grid[r][c] !== '' && grid[r][c] !== item.word[i]) {
                        collision = true;
                        break;
                    }
                }
                if (!collision) {
                    const cells = [];
                    for (let i = 0; i < item.word.length; i++) {
                        const r = startRow + dir[0] * i;
                        const c = startCol + dir[1] * i;
                        grid[r][c] = item.word[i];
                        cells.push(`${r},${c}`);
                    }
                    placedWords.push({ word: item.word, cells });
                    placed = true;
                }
            }
            attempts++;
        }
    }

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === '') grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
    }
    return { grid, placedWords };
};

// --- COMPONENT ---

const EcoWordSearch = () => {
    const { theme } = useTheme();
    const { completeLevel } = useGameState();
    const isLight = theme === 'light';

    // Game State
    const [gridState, setGridState] = useState({ grid: [], placedWords: [] });
    const [selectedCells, setSelectedCells] = useState([]);
    const [foundWords, setFoundWords] = useState([]);
    const [conqueredWords, setConqueredWords] = useState([]);
    const [dragStart, setDragStart] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [score, setScore] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isGameActive, setIsGameActive] = useState(true);

    // Mission Modal State
    const [missionModal, setMissionModal] = useState({
        isOpen: false,
        wordItem: null,
        feedback: null, // 'correct' | 'trick' | 'wrong'
        feedbackText: '',
        attempts: 0
    });

    useEffect(() => { startNewGame(); }, []);

    useEffect(() => {
        let interval;
        if (isGameActive && conqueredWords.length < WORD_DATA.length) {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isGameActive, conqueredWords.length]);

    const startNewGame = () => {
        const { grid, placedWords } = generateGrid(WORD_DATA, BOARD_SIZE);
        setGridState({ grid, placedWords });
        setFoundWords([]);
        setConqueredWords([]);
        setScore(0);
        setTimer(0);
        setMissionModal({ isOpen: false, wordItem: null, feedback: null, attempts: 0, feedbackText: '' });
        setIsGameActive(true);
        playMagicPop();
    };

    const handleMouseDown = (r, c) => {
        if (!isGameActive || missionModal.isOpen) return;
        setIsDragging(true);
        setDragStart({ r, c });
        setSelectedCells([`${r},${c}`]);
        playClick();
    };

    const handleMouseEnter = (r, c) => {
        if (!isDragging || !dragStart) return;
        const dr = r - dragStart.r;
        const dc = c - dragStart.c;
        const steps = Math.max(Math.abs(dr), Math.abs(dc));

        // Valid 8 directions check
        if ((dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) || (dr === 0 && dc === 0)) return;

        const path = [];
        const normStepR = dr === 0 ? 0 : dr / steps;
        const normStepC = dc === 0 ? 0 : dc / steps;

        for (let i = 0; i <= steps; i++) {
            path.push(`${dragStart.r + i * normStepR},${dragStart.c + i * normStepC}`);
        }
        setSelectedCells(path);
        playHover();
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        checkSelection(selectedCells);
        setDragStart(null);
        setSelectedCells([]);
    };

    const checkSelection = (cells) => {
        const cellCoords = cells.map(c => {
            const [r, cStr] = c.split(',');
            return { r: parseInt(r), c: parseInt(cStr) };
        });
        const selectedWordString = cellCoords.map(pos => gridState.grid[pos.r][pos.c]).join('');
        const selectedWordStringRev = [...selectedWordString].reverse().join('');

        const match = gridState.placedWords.find(pw =>
            (pw.word === selectedWordString || pw.word === selectedWordStringRev) &&
            !foundWords.includes(pw.word)
        );

        if (match) {
            playSuccess();
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
            setFoundWords(prev => [...prev, match.word]);

            const wordData = WORD_DATA.find(w => w.word === match.word);
            setTimeout(() => {
                setMissionModal({
                    isOpen: true,
                    wordItem: wordData,
                    feedback: null,
                    attempts: 0,
                    feedbackText: ''
                });
            }, 600);
        }
    };

    const handleMissionAnswer = (option) => {
        if (option.isCorrect) {
            playWin();
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            const bonus = missionModal.attempts === 0 ? 50 : 0;
            setScore(prev => prev + 100 + bonus);
            setConqueredWords(prev => [...prev, missionModal.wordItem.word]);
            setMissionModal(prev => ({ ...prev, feedback: 'correct', feedbackText: option.feedback }));
        } else {
            playError();
            const isTrick = option.isTrick;
            setMissionModal(prev => ({
                ...prev,
                attempts: prev.attempts + 1,
                feedback: isTrick ? 'trick' : 'wrong',
                feedbackText: option.feedback
            }));
        }
    };

    const closeMissionSuccess = () => {
        setMissionModal({ isOpen: false, wordItem: null, feedback: null, attempts: 0, feedbackText: '' });
    };

    const getCellClass = (r, c) => {
        const id = `${r},${c}`;
        const isConquered = conqueredWords.some(w => gridState.placedWords.find(p => p.word === w)?.cells.includes(id));
        const isFound = foundWords.some(w => gridState.placedWords.find(p => p.word === w)?.cells.includes(id) && !conqueredWords.includes(w));
        const isSelected = selectedCells.includes(id);

        let base = "relative aspect-square w-full flex items-center justify-center text-[10px] xs:text-xs sm:text-sm md:text-base font-bold rounded-md sm:rounded-lg select-none cursor-pointer transition-all duration-200 ";

        if (isConquered) return base + "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm shadow-emerald-500/30 ring-1 ring-emerald-300";
        if (isFound) return base + "bg-amber-300 text-amber-900 border border-amber-500 animate-pulse";
        if (isSelected) return base + "bg-teal-500 text-white scale-95 z-10 shadow-lg shadow-teal-500/40";

        // Normal cell styling
        return base + (isLight
            ? "bg-slate-50 text-slate-600 active:scale-95 border border-slate-200"
            : "bg-slate-800/50 text-slate-400 active:scale-95 border border-slate-700");
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const isVictory = conqueredWords.length === WORD_DATA.length;

    useEffect(() => {
        if (isVictory) {
            completeLevel('word-search', 1);
        }
    }, [isVictory, completeLevel]);

    return (
        <div className={`min-h-screen pt-24 pb-12 px-4 ${isLight ? 'bg-gradient-to-b from-teal-50 to-slate-100' : 'bg-gradient-to-b from-slate-900 to-slate-950'}`}>
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

                {/* --- SIDEBAR --- */}
                <div className="w-full lg:w-1/4 order-2 lg:order-1 space-y-6">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`p-4 sm:p-6 rounded-3xl border border-white/10 shadow-xl backdrop-blur-md ${isLight ? 'bg-white/80' : 'bg-slate-900/80'}`}
                    >
                        <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <h2 className={`text-lg sm:text-xl font-display font-bold flex items-center gap-2 ${isLight ? 'text-teal-700' : 'text-teal-400'}`}>
                                <BookOpen className="w-5 h-5" /> Missões
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isLight ? 'bg-teal-100 text-teal-700' : 'bg-teal-900/50 text-teal-300'}`}>
                                {conqueredWords.length}/{WORD_DATA.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                            {WORD_DATA.map((item) => {
                                const isConquered = conqueredWords.includes(item.word);
                                const isFound = foundWords.includes(item.word) && !isConquered;

                                return (
                                    <motion.div
                                        layout
                                        key={item.word}
                                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all border ${isConquered
                                            ? 'bg-emerald-500/10 border-emerald-500/20'
                                            : isFound
                                                ? 'bg-amber-500/10 border-amber-500/20'
                                                : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {isConquered ? (
                                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                                        ) : isFound ? (
                                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0 animate-bounce" />
                                        ) : (
                                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 shrink-0 ${isLight ? 'border-slate-300' : 'border-slate-600'}`} />
                                        )}
                                        <span className={`text-xs sm:text-sm font-bold truncate ${isConquered
                                            ? 'text-emerald-600 dark:text-emerald-400 line-through decoration-2'
                                            : isFound
                                                ? 'text-amber-600 dark:text-amber-400'
                                                : 'text-slate-400'
                                            }`}>
                                            {item.word}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {isVictory && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="p-6 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-2xl text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300 drop-shadow-md animate-pulse" />
                            <h3 className="text-2xl font-bold mb-2">Mestre dos Mitos!</h3>
                            <p className="mb-4 text-emerald-50 opacity-90 text-sm">Você desvendou todas as pegadinhas sobre energia.</p>
                            <div className="text-4xl font-mono font-black mb-6 drop-shadow-sm">{score}</div>
                            <button onClick={startNewGame} className="w-full bg-white text-emerald-600 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg flex items-center justify-center gap-2">
                                <RefreshCcw className="w-4 h-4" /> Jogar Novamente
                            </button>
                        </motion.div>
                    )}
                </div>

                {/* --- GAME BOARD --- */}
                <div className="flex-1 flex flex-col items-center order-1 lg:order-2 w-full">
                    <div className="flex w-full justify-between items-end mb-4 sm:mb-6 max-w-2xl px-1">
                        <div>
                            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-display font-black mb-1 sm:mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                                Eco <span className="text-teal-500">Word</span>
                            </h1>
                            <p className={`text-xs sm:text-sm md:text-base ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                Encontre as palavras e responda o quiz.
                            </p>
                        </div>

                        <div className="flex gap-2 sm:gap-3">
                            <div className={`flex flex-col items-end px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border ${isLight ? 'bg-white border-teal-100' : 'bg-slate-800 border-slate-700'}`}>
                                <span className="text-[10px] sm:text-xs font-bold text-teal-500 uppercase">Pontos</span>
                                <span className="text-base sm:text-xl font-mono font-bold">{score}</span>
                            </div>
                            <div className={`flex flex-col items-end px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border ${isLight ? 'bg-white border-blue-100' : 'bg-slate-800 border-slate-700'}`}>
                                <span className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase">Tempo</span>
                                <span className="text-base sm:text-xl font-mono font-bold">{formatTime(timer)}</span>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`p-3 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 backdrop-blur-sm relative w-full max-w-2xl mx-auto ${isLight
                            ? 'bg-white/90 border-teal-50 shadow-teal-500/10'
                            : 'bg-slate-900/90 border-slate-700 shadow-black/50'
                            }`}
                        onMouseLeave={handleMouseUp}
                    >
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-teal-500/20 blur-3xl rounded-full pointer-events-none hidden sm:block" />
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none hidden sm:block" />

                        <div
                            className="grid gap-0.5 sm:gap-1.5 md:gap-2 relative z-10 w-full"
                            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
                        >
                            {gridState.grid.map((row, r) => (
                                row.map((letter, c) => (
                                    <div
                                        key={`${r}-${c}`}
                                        onMouseDown={() => handleMouseDown(r, c)}
                                        onTouchStart={(e) => { e.preventDefault(); handleMouseDown(r, c); }}
                                        onMouseEnter={() => handleMouseEnter(r, c)}
                                        onTouchMove={(e) => {
                                            e.preventDefault();
                                            const touch = e.touches[0];
                                            const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                            if (element) {
                                                // Try to reverse engineer the r,c or just use the event if we can attach data attrs
                                            }
                                            // Touch move logic is complex for grid, sticking to simple tap or mouse for now or basic improvements
                                            // Ideally we need to map clientX/Y to the grid cells.
                                        }}
                                        onMouseUp={handleMouseUp}
                                        onTouchEnd={handleMouseUp}
                                        className={getCellClass(r, c)}
                                    >
                                        {letter}
                                    </div>
                                ))
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* --- PREMIUM MISSION MODAL --- */}
            <AnimatePresence>
                {missionModal.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                        />

                        <motion.div
                            initial={{ scale: 0.8, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: 50, opacity: 0 }}
                            className={`w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] ${isLight ? 'bg-white' : 'bg-slate-900 border border-slate-700'
                                }`}
                        >
                            {/* Header */}
                            <div className="relative h-24 sm:h-32 bg-gradient-to-r from-teal-500 to-emerald-600 flex items-center justify-center overflow-hidden shrink-0">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                {!missionModal.feedback ? (
                                    <div className="text-center z-10 text-white">
                                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-1 opacity-80">Palavra Encontrada</div>
                                        <div className="text-2xl sm:text-4xl font-display font-black tracking-wide drop-shadow-md">{missionModal.wordItem.word}</div>
                                    </div>
                                ) : (
                                    <div className="text-center z-10 text-white flex flex-col items-center">
                                        {missionModal.feedback === 'correct' ? (
                                            <>
                                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center mb-1 sm:mb-2 text-emerald-500"><CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" /></motion.div>
                                                <h2 className="text-xl sm:text-3xl font-bold">Resposta Certa!</h2>
                                            </>
                                        ) : (
                                            <>
                                                <motion.div
                                                    initial={{ x: -10 }}
                                                    animate={{ x: [0, -10, 10, -10, 0] }}
                                                    className={`w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center mb-1 sm:mb-2 ${missionModal.feedback === 'trick' ? 'text-amber-500' : 'text-red-500'}`}
                                                >
                                                    {missionModal.feedback === 'trick' ? <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8" /> : <XCircle className="w-6 h-6 sm:w-8 sm:h-8" />}
                                                </motion.div>
                                                <h2 className="text-xl sm:text-3xl font-bold">{missionModal.feedback === 'trick' ? 'Cuidado com a Pegadinha!' : 'Resposta Incorreta'}</h2>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar">
                                {!missionModal.feedback ? (
                                    <>
                                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-4 sm:mb-8 leading-relaxed max-w-xl mx-auto">
                                            {missionModal.wordItem.question}
                                        </h3>

                                        <div className="grid gap-2 sm:gap-3">
                                            {missionModal.wordItem.options.map((opt, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleMissionAnswer(opt)}
                                                    className={`group relative p-3 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center gap-3 sm:gap-4 ${isLight
                                                        ? 'bg-slate-50 border-slate-200 hover:border-teal-400 hover:bg-white hover:shadow-lg'
                                                        : 'bg-slate-800/50 border-slate-700 hover:border-teal-500 hover:bg-slate-800'
                                                        }`}
                                                >
                                                    <span className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg font-bold text-xs sm:text-sm border transition-colors ${isLight ? 'bg-white border-slate-300 text-slate-400 group-hover:bg-teal-500 group-hover:text-white group-hover:border-teal-500' : 'bg-slate-700 border-slate-600 text-slate-400 group-hover:bg-teal-500 group-hover:text-white'
                                                        }`}>
                                                        {String.fromCharCode(65 + idx)}
                                                    </span>
                                                    <span className="font-medium text-sm sm:text-lg">{opt.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                        <div className={`p-4 sm:p-6 rounded-2xl mb-6 border-l-4 sm:border-l-8 text-left ${missionModal.feedback === 'correct'
                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100'
                                            : missionModal.feedback === 'trick'
                                                ? 'bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100'
                                                : 'bg-red-50 border-red-500 text-red-900 dark:bg-red-900/20 dark:text-red-100'
                                            }`}>
                                            <h4 className="flex items-center gap-2 font-bold mb-2 uppercase tracking-wider text-[10px] sm:text-xs opacity-70">
                                                <Info size={16} /> Explicação
                                            </h4>
                                            <p className="text-sm sm:text-lg leading-relaxed font-medium">
                                                {missionModal.feedbackText}
                                            </p>
                                        </div>

                                        {missionModal.feedback === 'correct' ? (
                                            <button
                                                onClick={closeMissionSuccess}
                                                className="w-full sm:w-auto px-10 py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto"
                                            >
                                                Continuar Jogando <Sparkles size={20} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setMissionModal(prev => ({ ...prev, feedback: null }))}
                                                className="w-full sm:w-auto px-8 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl font-bold text-base sm:text-lg transition-colors"
                                            >
                                                Tentar Novamente
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EcoWordSearch;
