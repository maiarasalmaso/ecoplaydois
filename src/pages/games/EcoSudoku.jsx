import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, HelpCircle, Trophy, Timer, Star, Home, Volume2, VolumeX, Lightbulb } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { generateSudoku, SUDOKU_ICONS, SUDOKU_LABELS, getHint } from '../../utils/sudokuLogic';
import { playClick, playSelect, playError, playWin, playSuccess } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import { useGameState } from '../../context/GameStateContext';
import api from '../../services/api';

const EcoSudoku = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [initialBoard, setInitialBoard] = useState([]);
  const [solvedBoard, setSolvedBoard] = useState([]); // Store solved board for hints
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [isComplete, setIsComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false); // New: Lose state
  const [mistakes, setMistakes] = useState(0); // New: Mistake counter
  const MAX_MISTAKES = 5; // New: Max chances
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  // const [showTip, setShowTip] = useState(true); // Tutorial tip visibility - removido
  const [hintsUsed, setHintsUsed] = useState(0); // Counter for hints
  const [hintCell, setHintCell] = useState(null); // Cell to highlight as hint
  const isMutedRef = useRef(isMuted);
  const { addScore, completeLevel, updateStat } = useGameState();
  const MotionDiv = motion.div;

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playSound = useCallback((soundFn) => {
    if (!isMutedRef.current) soundFn();
  }, []);

  // Iniciar novo jogo
  const startNewGame = useCallback((diff = difficulty) => {
    setDifficulty(diff); // Update state
    const { initial, solved } = generateSudoku(diff);
    // Armazenamos o inicial para saber quais células são fixas (imutáveis)
    setInitialBoard(initial.map(row => [...row]));
    // Armazenamos a solução para o sistema de dicas
    setSolvedBoard(solved);
    // O board jogável começa igual ao inicial
    setBoard(initial.map(row => [...row]));
    setIsComplete(false);
    setIsGameOver(false);
    setMistakes(0);
    setSelectedCell(null);
    setTimeElapsed(0);
    setIsActive(true);
    setHintsUsed(0); // Reset hints
    setHintCell(null);
    setCompletedGroups([]); // Reset completed groups
    playSound(playSelect);
  }, [difficulty, playSound]);

  useEffect(() => {
    startNewGame('medium');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chamada inicial apenas uma vez

  // Timer logic
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
      // Verifica se a célula não é fixa antes de aplicar a dica
      if (initialBoard[hint.row][hint.col] !== 0) {
        playSound(playError);
        return;
      }

      // Atualiza o board com a dica
      const newBoard = board.map(row => [...row]);
      newBoard[hint.row][hint.col] = hint.value;
      setBoard(newBoard);

      // Destaca a célula
      setHintCell({ row: hint.row, col: hint.col });
      setHintsUsed(h => h + 1);

      // Som de sucesso
      playSound(playSuccess);

      // Remove destaque após 2s
      setTimeout(() => setHintCell(null), 2000);

      // Checa se completou (raro, mas possível com a última peça)
      checkCompletion(newBoard);
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    // Permite selecionar qualquer célula para ver o fato educativo
    if (isGameOver) return;
    setSelectedCell({ row: rowIndex, col: colIndex });
    playSound(playSelect);
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || isComplete || isGameOver) return;

    const { row, col } = selectedCell;

    // Impede edição de células fixas (iniciais)
    if (initialBoard[row][col] !== 0) {
      playSound(playError);
      return;
    }

    // Se for limpar, permite sempre (sem penalidade)
    if (num === 0) {
      const newBoard = board.map(row => [...row]);
      newBoard[row][col] = 0;
      setBoard(newBoard);
      playSound(playClick);
      return;
    }

    // Validação imediata (Lives System)
    // Se o número inserido não for o correto conforme o gabarito (solvedBoard)
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

    // Se estiver correto
    const newBoard = board.map(row => [...row]);

    // Atualiza o valor
    newBoard[row][col] = num;
    setBoard(newBoard);
    playSound(playSuccess);

    // Check for local group completions
    checkGroups(newBoard);

    // Verifica se completou o jogo
    checkCompletion(newBoard);
  };

  const checkCompletion = (currentBoard) => {
    // Verifica se ainda tem zeros
    const hasEmpty = currentBoard.some(row => row.includes(0));
    if (!hasEmpty) {
      // Se preenchido, valida as regras (redundante com check imediato, mas seguro)
      if (validateBoard(currentBoard)) {
        setIsComplete(true);
        setIsActive(false); // Parar timer
        addScore(500); // Recompensa
        completeLevel('sudoku', 1);
        updateStat('sudoku_wins', 1);
        updateStat('total_games_played', 1);

        // Save score
        api.post('/games/score', {
          gameId: 'sudoku',
          score: 500
        }).catch(err => console.error('Failed to save score:', err));

        playSound(playWin);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4ade80', '#22d3ee', '#facc15']
        });
      } else {
        // Feedback visual de erro poderia ser adicionado aqui
        // Por simplicidade, vamos deixar o usuário perceber visualmente ou adicionar um botão de "Verificar"
      }
    }
  };

  const validateBoard = (grid) => {
    // Validação simplificada das regras do Sudoku
    const isValidSet = (arr) => {
      const filtered = arr.filter(n => n !== 0);
      return new Set(filtered).size === filtered.length;
    };

    // Linhas
    for (let i = 0; i < 9; i++) {
      if (!isValidSet(grid[i])) return false;
    }

    // Colunas
    for (let j = 0; j < 9; j++) {
      const col = grid.map(row => row[j]);
      if (!isValidSet(col)) return false;
    }

    // Blocos 3x3
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

  // New: Track completed groups for visual feedback
  const [completedGroups, setCompletedGroups] = useState([]);

  // Verifica se o valor atual da célula tem conflito (para feedback visual)
  const hasConflict = (row, col, val) => {
    if (val === 0) return false;

    // Linha
    if (board[row].filter((v, i) => i !== col && v === val).length > 0) return true;

    // Coluna
    if (board.map(r => r[col]).filter((v, i) => i !== row && v === val).length > 0) return true;

    // Bloco
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = startRow + i;
        const c = startCol + j;
        if ((r !== row || c !== col) && board[r][c] === val) return true;
      }
    }

    return false;
  };

  // Check for completed rows, columns, and blocks to trigger feedback
  const checkGroups = (currentBoard) => {
    const newCompletedGroups = [];

    // Helper to check valid set of 1-9
    const isValidSet = (arr) => {
      const filtered = arr.filter(n => n !== 0);
      return filtered.length === 9 && new Set(filtered).size === 9;
    };

    // Rows
    for (let i = 0; i < 9; i++) {
      if (isValidSet(currentBoard[i])) newCompletedGroups.push(`row-${i}`);
    }

    // Columns
    for (let j = 0; j < 9; j++) {
      const col = currentBoard.map(row => row[j]);
      if (isValidSet(col)) newCompletedGroups.push(`col-${j}`);
    }

    // Blocks
    for (let i = 0; i < 9; i += 3) {
      for (let j = 0; j < 9; j += 3) {
        const block = [];
        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 3; y++) {
            block.push(currentBoard[i + x][j + y]);
          }
        }
        if (isValidSet(block)) newCompletedGroups.push(`block-${i}-${j}`);
      }
    }

    // Detect NEW completions only to play sound
    const newlyCompleted = newCompletedGroups.filter(g => !completedGroups.includes(g));
    if (newlyCompleted.length > 0) {
      playMagicPop(); // Satisfying pop sound
      setCompletedGroups(newCompletedGroups);
    }
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

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 flex flex-col items-center max-w-7xl mx-auto bg-theme-bg-primary text-theme-text-primary font-sans transition-colors duration-300">
      {/* Header do Jogo */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex flex-col items-start">
          <Link to="/games" className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors mb-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Arcade</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Modo Seguro: Dados Protegidos</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Difficulty Selector */}
          <div className="flex bg-theme-bg-secondary p-1 rounded-lg border border-theme-border">
            {['easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                onClick={() => startNewGame(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${difficulty === d
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-tertiary'
                  }`}
              >
                {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Médio' : 'Difícil'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-theme-bg-secondary px-4 py-2 rounded-lg border border-theme-border">
            <Timer className="w-4 h-4 text-indigo-400" />
            <span className="font-mono text-xl font-bold text-theme-text-primary tracking-widest">{formatTime(timeElapsed)}</span>
          </div>

          <div className="flex items-center gap-2 bg-theme-bg-secondary px-4 py-2 rounded-lg border border-theme-border" title="Chances restantes">
            <AlertCircle className={`w-4 h-4 ${mistakes >= MAX_MISTAKES - 1 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`} />
            <span className={`font-mono text-xl font-bold tracking-widest ${mistakes >= MAX_MISTAKES - 1 ? 'text-red-500' : 'text-theme-text-primary'}`}>
              {MAX_MISTAKES - mistakes}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-theme-bg-secondary backdrop-blur-sm rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary transition-all border border-theme-border"
            title={isMuted ? "Ativar Som" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => startNewGame(difficulty)}
            className="flex items-center gap-2 px-4 py-2 bg-theme-bg-secondary backdrop-blur-sm rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary hover:text-theme-text-primary transition-all border border-theme-border"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isComplete && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          >
            <MotionDiv
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-theme-bg-secondary backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-theme-border shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-green-500 to-lime-400" />

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20">
                  <Trophy className="w-10 h-10 text-green-500" />
                </div>

                <h2 className="text-3xl font-display font-bold text-theme-text-primary mb-2">Missão Cumprida!</h2>
                <p className="text-theme-text-secondary mb-8">
                  Você restaurou o equilíbrio energético com sucesso.
                </p>

                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                  <div className="bg-theme-bg-primary p-4 rounded-xl border border-theme-border flex flex-col items-center">
                    <Timer className="w-5 h-5 text-indigo-500 mb-2" />
                    <span className="text-xs text-theme-text-tertiary uppercase font-bold tracking-wider">Tempo</span>
                    <span className="text-xl font-mono text-theme-text-primary font-bold">{formatTime(timeElapsed)}</span>
                  </div>
                  <div className="bg-theme-bg-primary p-4 rounded-xl border border-theme-border flex flex-col items-center">
                    <Star className="w-5 h-5 text-yellow-400 mb-2" />
                    <span className="text-xs text-theme-text-tertiary uppercase font-bold tracking-wider">XP Ganho</span>
                    <span className="text-xl font-mono text-theme-text-primary font-bold">+500</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => startNewGame(difficulty)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Jogar Novamente
                  </button>
                  <button
                    onClick={() => navigate('/games')}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Home className="w-5 h-5" />
                    Voltar ao Arcade
                  </button>
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}

        {isGameOver && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          >
            <MotionDiv
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-theme-bg-secondary backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-theme-border shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/20">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>

                <h2 className="text-3xl font-display font-bold text-theme-text-primary mb-2">Sistema Instável!</h2>
                <p className="text-theme-text-secondary mb-8">
                  Você excedeu o limite de {MAX_MISTAKES} erros. O sistema de energia precisa ser reiniciado.
                </p>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => startNewGame(difficulty)}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Tentar Novamente
                  </button>
                  <button
                    onClick={() => navigate('/games')}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Home className="w-5 h-5" />
                    Voltar ao Arcade
                  </button>
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full">

        {/* Área do Tabuleiro */}
        <div className="flex-none flex flex-col items-center">
          <MotionDiv
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative p-1 bg-theme-bg-secondary/80 backdrop-blur-md rounded-lg shadow-2xl border-4 border-theme-border"
          >
            <div className="grid grid-cols-9 gap-[1px] bg-theme-border border border-theme-border">
              {board.map((row, rowIndex) => (
                row.map((cellValue, colIndex) => {
                  const isInitial = initialBoard[rowIndex][colIndex] !== 0;
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  const isHint = hintCell?.row === rowIndex && hintCell?.col === colIndex;
                  const isConflict = !isInitial && hasConflict(rowIndex, colIndex, cellValue);

                  // Check if this cell belongs to any completed group
                  const isRowComplete = completedGroups.includes(`row-${rowIndex}`);
                  const isColComplete = completedGroups.includes(`col-${colIndex}`);
                  const blockStartRow = rowIndex - (rowIndex % 3);
                  const blockStartCol = colIndex - (colIndex % 3);
                  const isBlockComplete = completedGroups.includes(`block-${blockStartRow}-${blockStartCol}`);
                  const isGroupComplete = isRowComplete || isColComplete || isBlockComplete;

                  // Bordas mais grossas para os blocos 3x3
                  const borderRight = (colIndex + 1) % 3 === 0 && colIndex !== 8 ? 'border-r-2 border-r-indigo-500/50' : '';
                  const borderBottom = (rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? 'border-b-2 border-b-indigo-500/50' : '';

                  return (
                    <MotionDiv
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      animate={isGroupComplete ? { scale: [1, 1.1, 1], backgroundColor: ["rgba(34, 197, 94, 0.2)", "rgba(34, 197, 94, 0.4)", "rgba(34, 197, 94, 0.2)"] } : {}}
                      transition={{ duration: 0.5 }}
                      className={`
                        w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center text-xl sm:text-2xl cursor-pointer select-none
                        bg-theme-bg-primary transition-colors duration-200 relative
                        ${borderRight} ${borderBottom}
                        ${isInitial ? 'bg-theme-bg-secondary/50 font-bold text-theme-text-secondary' : 'text-green-500 dark:text-green-400'}
                        ${isSelected ? 'bg-indigo-500/20 ring-2 ring-indigo-500 z-10' : ''}
                        ${isHint ? 'ring-4 ring-yellow-400 bg-yellow-500/20 z-20 animate-pulse' : ''}
                        ${isConflict ? 'bg-red-500/20 text-red-500' : ''}
                        ${isConflict ? 'bg-red-500/20 text-red-500' : ''}
                        ${!isInitial && cellValue === 0 ? 'hover:bg-theme-bg-secondary' : ''}
                      `}
                    >
                      {/* Highlight Overlay for Completed Groups */}
                      {isGroupComplete && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-green-500/20 z-0"
                          title="Grupo Completo!"
                        />
                      )}

                      <span className="relative z-10">{cellValue !== 0 && SUDOKU_ICONS[cellValue]}</span>

                      {isHint && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1 }}
                          className="absolute inset-0 bg-yellow-400 rounded-full z-0"
                        />
                      )}
                    </MotionDiv>
                  );
                })
              ))}
            </div>
          </MotionDiv>
        </div>

        {/* Painel de Controle */}
        <div className="w-full md:w-64 lg:w-80 flex flex-col gap-6">

          {/* Status */}
          {/* Status */}
          <div className="bg-theme-bg-secondary/50 p-6 rounded-xl border border-theme-border backdrop-blur-sm">
            <h2 className="text-xl font-display font-bold text-theme-text-primary mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Missão Sudoku</span>
            </h2>
            <p className="text-theme-text-secondary text-sm mb-4">
              Preencha a grade para que cada linha, coluna e bloco 3x3 contenha todos os 9 ícones de energia renovável.
            </p>

            {isComplete ? (
              <div className="bg-green-500/10 text-green-500 p-4 rounded-lg border border-green-500/20 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <div className="font-bold">Sistema Estável!</div>
                  <div className="text-xs text-green-500/80">Tempo: {formatTime(timeElapsed)}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-xs uppercase tracking-wider text-theme-text-tertiary font-bold">Energias Disponíveis</div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberInput(num)}
                      disabled={!selectedCell}
                      className={`
                        p-2 rounded-lg border transition-all
                        flex flex-col items-center gap-1
                        ${!selectedCell
                          ? 'opacity-50 cursor-not-allowed border-theme-border bg-theme-bg-tertiary text-theme-text-tertiary'
                          : 'active:scale-95 hover:bg-theme-bg-tertiary border-theme-border bg-theme-bg-primary text-theme-text-primary hover:text-theme-text-primary'}
                      `}
                      title={SUDOKU_LABELS[num]}
                    >
                      <span className="text-2xl leading-none">{SUDOKU_ICONS[num]}</span>
                      <span className="text-[10px] font-mono truncate w-full text-center opacity-70">{SUDOKU_LABELS[num]}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleNumberInput(0)}
                  disabled={!selectedCell}
                  className="mt-2 w-full py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold uppercase transition-all"
                >
                  Limpar Célula
                </button>
              </div>
            )}
          </div>

          {/* Dicas e Fatos Educativos */}
          <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 transition-all">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-600 dark:text-blue-300">
                {selectedCell && board[selectedCell.row][selectedCell.col] !== 0 ? (
                  <>
                    <span className="font-bold block mb-1">
                      {SUDOKU_LABELS[board[selectedCell.row][selectedCell.col]]}:
                    </span>
                    {FACTS[board[selectedCell.row][selectedCell.col]]}
                  </>
                ) : (
                  <>
                    <span className="font-bold">Dica Tática:</span> Comece procurando linhas ou blocos que estão quase cheios. É mais fácil deduzir qual energia falta neles!
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Botão de Ajuda (Limitado a 3 usos) */}
          <button
            onClick={handleHint}
            disabled={hintsUsed >= 3 || isComplete}
            className={`
              w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
              ${hintsUsed >= 3 || isComplete
                ? 'bg-theme-bg-tertiary text-theme-text-tertiary cursor-not-allowed border border-theme-border'
                : 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20 border border-yellow-400 hover:brightness-110'}
            `}
          >
            <Lightbulb className={`w-5 h-5 ${hintsUsed < 3 ? 'fill-current' : ''}`} />
            <span>Pedir Ajuda</span>
            <span className="bg-black/20 px-2 py-0.5 rounded text-xs ml-1">
              {3 - hintsUsed}/3
            </span>
          </button>

          {/* Parental Control Simulation */}
          <div className="mt-auto pt-4 border-t border-theme-border text-center">
            <p className="text-[10px] text-theme-text-tertiary uppercase tracking-widest">
              Ambiente Monitorado • Sem Anúncios
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EcoSudoku;
