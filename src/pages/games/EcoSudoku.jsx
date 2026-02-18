import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle, Trophy, Timer, Star, Home, Volume2, VolumeX, Lightbulb, CheckCircle2, HelpCircle, Settings, Menu, X, Eraser } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { generateSudoku, SUDOKU_ICONS, SUDOKU_LABELS, getHint } from '../../utils/sudokuLogic';
import { playClick, playSelect, playError, playWin, playSuccess } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import { useGameState } from '../../context/GameStateContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const EcoSudoku = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [initialBoard, setInitialBoard] = useState([]);
  const [solvedBoard, setSolvedBoard] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [isComplete, setIsComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const MAX_MISTAKES = 5;
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintCell, setHintCell] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { theme: contextTheme } = useTheme();
  const isDarkMode = contextTheme === 'dark';

  const isMutedRef = useRef(isMuted);
  const { addScore, completeLevel, updateStat } = useGameState();
  const MotionDiv = motion.div;

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playSound = useCallback((soundFn) => {
    if (!isMutedRef.current) soundFn();
  }, []);

  const startNewGame = useCallback((diff = difficulty) => {
    setDifficulty(diff);
    const { initial, solved } = generateSudoku(diff);
    setInitialBoard(initial.map(row => [...row]));
    setSolvedBoard(solved);
    setBoard(initial.map(row => [...row]));
    setIsComplete(false);
    setIsGameOver(false);
    setMistakes(0);
    setSelectedCell(null);
    setTimeElapsed(0);
    setIsActive(true);
    setHintsUsed(0);
    setHintCell(null);
    setIsMobileMenuOpen(false);
    playSound(playSelect);
  }, [difficulty, playSound]);

  useEffect(() => {
    startNewGame('medium');
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && !isComplete && !isGameOver) {
      interval = setInterval(() => {
        setTimeElapsed((time) => time + 1);
      }, 1000);
    } else if (isComplete || isGameOver) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, isComplete, isGameOver]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHint = () => {
    if (hintsUsed >= 3 || isComplete || isGameOver) return;
    const hint = getHint(board, solvedBoard);
    if (hint) {
      if (initialBoard[hint.row][hint.col] !== 0) {
        playSound(playError);
        return;
      }
      const newBoard = board.map(row => [...row]);
      newBoard[hint.row][hint.col] = hint.value;
      setBoard(newBoard);
      setHintCell({ row: hint.row, col: hint.col });
      setHintsUsed(h => h + 1);
      playSound(playSuccess);
      setTimeout(() => setHintCell(null), 2000);
      checkCompletion(newBoard);
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    if (isGameOver) return;
    setSelectedCell({ row: rowIndex, col: colIndex });
    playSound(playSelect);
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || isComplete || isGameOver) return;
    const { row, col } = selectedCell;

    if (initialBoard[row][col] !== 0) {
      playSound(playError);
      return;
    }

    if (num === 0) {
      const newBoard = board.map(row => [...row]);
      newBoard[row][col] = 0;
      setBoard(newBoard);
      playSound(playClick);
      return;
    }

    if (solvedBoard[row][col] !== num) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      playSound(playError);
      if (newMistakes >= MAX_MISTAKES) {
        setIsGameOver(true);
        setIsActive(false);
      }
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = num;
    setBoard(newBoard);
    playSound(playSuccess);
    checkCompletion(newBoard);
  };

  const checkCompletion = (currentBoard) => {
    const hasEmpty = currentBoard.some(row => row.includes(0));
    if (!hasEmpty) {
      if (validateBoard(currentBoard)) {
        setIsComplete(true);
        setIsActive(false);
        addScore(500);
        completeLevel('sudoku', 1);
        updateStat('sudoku_wins', 1);
        updateStat('total_games_played', 1);
        api.post('/games/score', { gameId: 'sudoku', score: 500 }).catch(console.error);
        playSound(playWin);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4ade80', '#22d3ee', '#facc15'] });
      }
    }
  };

  const validateBoard = (grid) => {
    const isValidSet = (arr) => {
      const filtered = arr.filter(n => n !== 0);
      return new Set(filtered).size === filtered.length;
    };
    for (let i = 0; i < 9; i++) {
      if (!isValidSet(grid[i])) return false;
    }
    for (let j = 0; j < 9; j++) {
      const col = grid.map(row => row[j]);
      if (!isValidSet(col)) return false;
    }
    for (let i = 0; i < 9; i += 3) {
      for (let j = 0; j < 9; j += 3) {
        const block = [];
        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 3; y++) {
            block.push(grid[i + x][j + y]);
          }
        }
        if (!isValidSet(block)) return false;
      }
    }
    return true;
  };

  const FACTS = {
    1: 'O Sol fornece energia limpa e infinita para nossos painéis solares.',
    2: 'Turbinas eólicas transformam a força do vento em eletricidade.',
    3: 'A força da água dos rios gera energia nas hidrelétricas.',
    4: 'Biomassa usa restos de plantas e animais para criar energia.',
    5: 'Baterias são essenciais para guardar energia para quando não há sol.',
    6: 'A eletricidade viaja por fios para chegar até sua casa.',
    7: 'A energia das ondas do mar também pode ser aproveitada.',
    8: 'Geotérmica usa o calor do centro da Terra para gerar força.',
    9: 'Plantar árvores ajuda a limpar o ar que respiramos.'
  };

  const theme = {
    bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    text: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    cardBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    cardBorder: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    modalBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    heading: isDarkMode ? 'text-white' : 'text-slate-900',
    subText: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    buttonSec: isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600',
    icon: isDarkMode ? 'text-slate-400' : 'text-slate-400',

    // Board
    boardOuter: isDarkMode ? 'bg-slate-900 shadow-indigo-900/10' : 'bg-white shadow-indigo-500/10',
    gridLines: isDarkMode ? 'bg-slate-800' : 'bg-slate-300',
    gridBorder: isDarkMode ? 'border-slate-800' : 'border-slate-300',
    cellBg: isDarkMode ? 'bg-slate-900' : 'bg-white',
    cellInitial: isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-600',
    cellUser: isDarkMode ? 'text-emerald-400 font-bold' : 'text-emerald-600 font-bold',
    cellHover: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
    cellSelected: isDarkMode ? '!bg-indigo-900 !text-white' : '!bg-indigo-500 !text-white',

    // Controls
    keyBg: isDarkMode ? 'bg-slate-800 hover:bg-indigo-900/50 border-slate-700 text-slate-200' : 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-900',
  };

  const FactsComponent = () => (
    <div className={`${theme.cardBg} p-6 rounded-2xl shadow-sm border ${theme.cardBorder}`}>
      <h3 className={`font-bold ${theme.heading} mb-4 flex items-center gap-2`}>
        <Lightbulb className="w-5 h-5 text-yellow-500" /> Curiosidades
      </h3>
      <div className="space-y-4">
        {selectedCell && board[selectedCell.row][selectedCell.col] !== 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl ${isDarkMode ? 'bg-indigo-900/20 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}
          >
            <div className="text-4xl mb-2">{SUDOKU_ICONS[board[selectedCell.row][selectedCell.col]]}</div>
            <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-900'}`}>
              {FACTS[board[selectedCell.row][selectedCell.col]]}
            </p>
          </motion.div>
        ) : (
          <p className={`text-sm italic ${theme.subText}`}>Selecione uma célula preenchida para ver um fato ecológico sobre ela.</p>
        )}
      </div>
    </div>
  );

  const GameOptionsComponent = ({ isMobile = false }) => (
    <div className={`${!isMobile ? `${theme.cardBg} p-6 rounded-2xl shadow-sm border ${theme.cardBorder}` : ''}`}>
      {!isMobile && (
        <h3 className={`font-bold ${theme.heading} mb-4 flex items-center gap-2`}>
          <Settings className="w-5 h-5 text-slate-400" /> Opções
        </h3>
      )}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Dificuldade</label>
          <div className="flex gap-2">
            {['easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                onClick={() => startNewGame(d)}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${difficulty === d
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : theme.buttonSec
                  }`}
              >
                {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Médio' : 'Difícil'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Sons</span>
          <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-lg transition-colors ${theme.buttonSec}`}>
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        <button
          onClick={() => startNewGame(difficulty)}
          className={`w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all ${theme.buttonSec}`}
        >
          <RefreshCw className="w-4 h-4" /> Reiniciar
        </button>
      </div>
    </div>
  );

  return (
    <div className={`h-[100dvh] lg:min-h-screen flex flex-col ${theme.bg} ${theme.text} font-sans transition-colors duration-300 overflow-hidden lg:overflow-visible`}>
      {/* Mobile Settings Modal */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className={`${theme.modalBg} w-full max-w-sm rounded-2xl p-6 shadow-2xl mb-4 sm:mb-0`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${theme.heading}`}>Configurações</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <GameOptionsComponent isMobile={true} />
              <div className="mt-8">
                <h4 className={`text-sm font-bold ${theme.subText} mb-2 uppercase`}>Curiosidade Atual</h4>
                {selectedCell && board[selectedCell.row][selectedCell.col] !== 0 ? (
                  <div className={`p-3 rounded-lg flex gap-3 ${isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                    <span className="text-2xl">{SUDOKU_ICONS[board[selectedCell.row][selectedCell.col]]}</span>
                    <p className="text-xs">{FACTS[board[selectedCell.row][selectedCell.col]]}</p>
                  </div>
                ) : (
                  <p className="text-xs italic opacity-70">Selecione uma peça no tabuleiro para ver detalhes.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto lg:px-8 lg:py-8 overflow-hidden lg:overflow-visible">

        {/* Header - Adaptive */}
        <div className="flex-none flex items-center justify-between p-4 pb-2 lg:p-0 lg:mb-8 gap-4 shadow-sm lg:shadow-none z-10 bg-inherit">
          <Link to="/games" className={`flex items-center gap-2 transition-colors ${theme.subText} hover:${theme.heading}`}>
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden lg:inline font-bold">Voltar</span>
          </Link>

          <div className="flex flex-col items-center">
            <h1 className={`text-xl lg:text-3xl font-display font-bold ${theme.heading}`}>EcoSudoku</h1>
            <p className={`${theme.subText} text-xs hidden lg:block`}>Complete com energias renováveis</p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${theme.cardBorder} ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
              <Timer className="w-4 h-4 text-indigo-500" />
              <span className={`font-mono font-bold text-sm ${theme.text}`}>{formatTime(timeElapsed)}</span>
            </div>
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg border ${theme.cardBorder} ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
              <AlertCircle className={`w-4 h-4 ${mistakes >= MAX_MISTAKES - 1 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
              <span className={`font-bold ${mistakes > 0 ? 'text-red-500' : theme.text}`}>{mistakes}/{MAX_MISTAKES}</span>
            </div>
            {/* Mobile Menu Trigger */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Mistakes Counter - Just below header to save width in header */}
        <div className="lg:hidden flex items-center justify-center gap-4 py-1 text-xs font-medium opacity-80 shrink-0">
          <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Erros: {mistakes}/{MAX_MISTAKES}</span>
          <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Dicas: {3 - hintsUsed}</span>
        </div>

        <div className="flex-grow flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 items-center lg:items-start min-h-0 relative">

          {/* Left Column: Game Info & Facts (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6 order-2 lg:order-1 h-full overflow-auto">
            <FactsComponent />
            <GameOptionsComponent />
          </div>

          {/* Center: Game Board - Adaptive Sizing */}
          <div className="flex-1 lg:col-span-6 flex items-center justify-center w-full px-2 lg:px-0 order-1 lg:order-2 min-h-0">
            <div className={`w-full max-w-[45vh] lg:max-w-[500px] aspect-square p-2 rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl transition-colors ${theme.boardOuter}`}>
              <div className={`w-full h-full grid grid-cols-9 gap-[1px] border-2 lg:border-4 rounded-lg lg:rounded-xl overflow-hidden ${theme.gridLines} ${theme.gridBorder}`}>
                {board.map((row, rowIndex) => (
                  row.map((cellValue, colIndex) => {
                    const isInitial = initialBoard[rowIndex][colIndex] !== 0;
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    const isHint = hintCell?.row === rowIndex && hintCell?.col === colIndex;

                    // Borders for 3x3 grids
                    const borderRight = (colIndex + 1) % 3 === 0 && colIndex !== 8 ? `border-r-[2px] ${theme.gridBorder}` : '';
                    const borderBottom = (rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? `border-b-[2px] ${theme.gridBorder}` : '';

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className={`
                              relative flex items-center justify-center text-xl sm:text-2xl cursor-pointer select-none transition-colors duration-200
                              ${borderRight} ${borderBottom}
                              ${isSelected ? theme.cellSelected : ''}
                              ${!isSelected && isInitial ? theme.cellInitial : ''}
                              ${!isSelected && !isInitial && cellValue !== 0 ? theme.cellUser : ''}
                              ${!isSelected && !isInitial && cellValue === 0 ? `${theme.cellBg} ${theme.cellHover}` : ''}
                              ${isHint ? 'ring-inset ring-4 ring-yellow-400' : ''}
                              ${!isSelected && !isInitial && cellValue !== 0 ? theme.cellBg : ''}
                            `}
                      >
                        {cellValue !== 0 && <span>{SUDOKU_ICONS[cellValue]}</span>}
                      </div>
                    );
                  })
                ))}
              </div>
            </div>

            {/* Modal Overlays (GameOver / Win) */}
            <AnimatePresence>
              {isComplete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${theme.modalBg} rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center`}>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className={`text-2xl font-bold ${theme.heading} mb-2`}>Parabéns!</h2>
                    <p className={`${theme.subText} mb-8`}>Você completou o EcoSudoku!</p>
                    <button onClick={() => startNewGame(difficulty)} className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/30">
                      Jogar Novamente
                    </button>
                  </motion.div>
                </div>
              )}
              {isGameOver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${theme.modalBg} rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center`}>
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h2 className={`text-2xl font-bold ${theme.heading} mb-2`}>Fim de Jogo</h2>
                    <p className={`${theme.subText} mb-8`}>Muitos erros cometidos.</p>
                    <button onClick={() => startNewGame(difficulty)} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/30">
                      Tentar Novamente
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Controls (Desktop) & Bottom Bar (Mobile) */}
          <div className="lg:col-span-3 order-3 lg:block flex-none w-full">

            {/* Desktop Controls */}
            <div className={`hidden lg:block ${theme.cardBg} p-6 rounded-2xl shadow-sm border ${theme.cardBorder} sticky top-24`}>
              <h3 className={`font-bold ${theme.heading} mb-4`}>Controles</h3>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberInput(num)}
                    disabled={!selectedCell || isComplete}
                    className={`aspect-square flex items-center justify-center text-2xl rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.keyBg}`}
                  >
                    {SUDOKU_ICONS[num]}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNumberInput(0)}
                  disabled={!selectedCell}
                  className="flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl border border-red-100 transition-all disabled:opacity-50"
                >
                  <span>Apagar</span>
                </button>
                <button
                  onClick={handleHint}
                  disabled={hintsUsed >= 3 || isComplete}
                  className="flex items-center justify-center gap-2 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 font-bold rounded-xl border border-yellow-100 transition-all disabled:opacity-50"
                >
                  <Lightbulb className="w-4 h-4" /> <span>Dica ({3 - hintsUsed})</span>
                </button>
              </div>
            </div>

            {/* Mobile Bottom Keypad - Fixed, No Scroll */}
            <div className="lg:hidden w-full pb-4 px-2 pt-2 bg-inherit z-20">
              {/* Selection Hint / Fact Strip */}
              <div className="flex justify-between items-center mb-2 px-1">
                <div className="text-xs font-semibold opacity-70">
                  {selectedCell ? 'Selecione ícone para preencher' : 'Toque no tabuleiro'}
                </div>
                <button onClick={handleHint} disabled={hintsUsed >= 3} className="text-xs flex items-center gap-1 text-yellow-600 font-bold px-2 py-1 rounded-md bg-yellow-50">
                  <Lightbulb className="w-3 h-3" /> Dica ({3 - hintsUsed})
                </button>
              </div>

              {/* 2-Row Keypad */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberInput(num)}
                    className={`aspect-square flex items-center justify-center text-2xl rounded-lg shadow-sm transition-transform active:scale-95 ${theme.keyBg} border-2 border-transparent focus:border-indigo-500`}
                  >
                    {SUDOKU_ICONS[num]}
                  </button>
                ))}
                {[6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberInput(num)}
                    className={`aspect-square flex items-center justify-center text-2xl rounded-lg shadow-sm transition-transform active:scale-95 ${theme.keyBg} border-2 border-transparent focus:border-indigo-500`}
                  >
                    {SUDOKU_ICONS[num]}
                  </button>
                ))}
                <button
                  onClick={() => handleNumberInput(0)}
                  className="aspect-square flex items-center justify-center text-red-500 rounded-lg shadow-sm bg-red-50 border border-red-100 active:scale-95"
                >
                  <Eraser className="w-6 h-6" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default EcoSudoku;
