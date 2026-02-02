import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, HelpCircle, Trophy, Timer, Star, Home, Volume2, VolumeX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { generateSudoku, SUDOKU_ICONS, SUDOKU_LABELS } from '../../utils/sudokuLogic';
import { playClick, playSelect, playError, playWin } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import { useGameState } from '../../context/GameStateContext';

const EcoSudoku = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState([]);
  const [initialBoard, setInitialBoard] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty] = useState('medium');
  const [isComplete, setIsComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
    const { initial } = generateSudoku(diff);
    // Armazenamos o inicial para saber quais células são fixas (imutáveis)
    setInitialBoard(initial.map(row => [...row]));
    // O board jogável começa igual ao inicial
    setBoard(initial.map(row => [...row]));
    setIsComplete(false);
    setSelectedCell(null);
    setTimeElapsed(0);
    setIsActive(true);
    playSound(playSelect);
  }, [difficulty, playSound]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isActive && !isComplete) {
      interval = setInterval(() => {
        setTimeElapsed((time) => time + 1);
      }, 1000);
    } else if (isComplete) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, isComplete]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCellClick = (rowIndex, colIndex) => {
    // Só permite selecionar se a célula não for fixa (do tabuleiro inicial)
    if (initialBoard[rowIndex][colIndex] === 0) {
      setSelectedCell({ row: rowIndex, col: colIndex });
      playSound(playSelect);
    }
  };

  const handleNumberInput = (num) => {
    if (!selectedCell || isComplete) return;

    const { row, col } = selectedCell;

    // Se for limpar, permite sempre
    if (num === 0) {
      const newBoard = board.map(row => [...row]);
      newBoard[row][col] = 0;
      setBoard(newBoard);
      playSound(playClick);
      return;
    }

    // Verifica conflito antes de inserir
    if (hasConflict(row, col, num)) {
      // Opcional: Feedback visual de erro, por enquanto apenas bloqueia
      playSound(playError);
      return;
    }

    const newBoard = board.map(row => [...row]);
    
    // Atualiza o valor
    newBoard[row][col] = num;
    setBoard(newBoard);
    playSound(playClick);

    // Verifica se completou o jogo
    checkCompletion(newBoard);
  };

  const checkCompletion = (currentBoard) => {
    // Verifica se ainda tem zeros
    const hasEmpty = currentBoard.some(row => row.includes(0));
    if (!hasEmpty) {
      // Se preenchido, valida as regras
      if (validateBoard(currentBoard)) {
        setIsComplete(true);
        setIsActive(false); // Parar timer
        addScore(500); // Recompensa
        completeLevel('sudoku', 1);
        updateStat('sudoku_wins', 1);
        updateStat('total_games_played', 1);
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

  return (
    <div className="min-h-screen pt-8 pb-12 px-4 flex flex-col items-center max-w-7xl mx-auto">
      {/* Header do Jogo */}
      <div className="w-full flex justify-between items-center mb-8">
        <Link to="/games" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar ao Arcade</span>
        </Link>
        
        <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
          <Timer className="w-4 h-4 text-indigo-400" />
          <span className="font-mono text-xl font-bold text-white tracking-widest">{formatTime(timeElapsed)}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-slate-800/50 backdrop-blur-sm rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
            title={isMuted ? "Ativar Som" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => startNewGame(difficulty)} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
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
            className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20">
                  <Trophy className="w-10 h-10 text-green-400" />
                </div>
                
                <h2 className="text-3xl font-display font-bold text-white mb-2">Missão Cumprida!</h2>
                <p className="text-slate-400 mb-8">
                  Você restaurou o equilíbrio energético com sucesso.
                </p>

                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center">
                    <Timer className="w-5 h-5 text-indigo-400 mb-2" />
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Tempo</span>
                    <span className="text-xl font-mono text-white font-bold">{formatTime(timeElapsed)}</span>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center">
                    <Star className="w-5 h-5 text-yellow-400 mb-2" />
                    <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">XP Ganho</span>
                    <span className="text-xl font-mono text-white font-bold">+500</span>
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
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full">
        
        {/* Área do Tabuleiro */}
        <div className="flex-none flex flex-col items-center">
          <MotionDiv 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative p-1 bg-slate-800/80 backdrop-blur-md rounded-lg shadow-2xl border-4 border-slate-700"
          >
            <div className="grid grid-cols-9 gap-[1px] bg-slate-600 border border-slate-600">
              {board.map((row, rowIndex) => (
                row.map((cellValue, colIndex) => {
                  const isInitial = initialBoard[rowIndex][colIndex] !== 0;
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  const isConflict = !isInitial && hasConflict(rowIndex, colIndex, cellValue);
                  
                  // Bordas mais grossas para os blocos 3x3
                  const borderRight = (colIndex + 1) % 3 === 0 && colIndex !== 8 ? 'border-r-2 border-r-slate-900' : '';
                  const borderBottom = (rowIndex + 1) % 3 === 0 && rowIndex !== 8 ? 'border-b-2 border-b-slate-900' : '';

                  return (
                    <MotionDiv
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      className={`
                        w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center text-xl sm:text-2xl cursor-pointer select-none
                        bg-slate-900 transition-colors duration-200
                        ${borderRight} ${borderBottom}
                        ${isInitial ? 'bg-slate-800/50 font-bold' : 'text-eco-green'}
                        ${isSelected ? 'bg-indigo-900/80 ring-2 ring-indigo-500 z-10' : ''}
                        ${isConflict ? 'bg-red-900/30 text-red-400' : ''}
                        ${!isInitial && cellValue === 0 ? 'hover:bg-slate-800' : ''}
                      `}
                    >
                      {cellValue !== 0 && SUDOKU_ICONS[cellValue]}
                    </MotionDiv>
                  );
                })
              ))}
            </div>
          </MotionDiv>

          {/* Legenda / Instruções rápidas */}
          <div className="mt-6 text-slate-400 text-sm flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-800 border border-slate-600"></div>
              <span>Fixo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-900/80 border border-indigo-500"></div>
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-900/30 border border-red-400"></div>
              <span>Conflito</span>
            </div>
          </div>
        </div>

        {/* Painel de Controle */}
        <div className="w-full md:w-64 lg:w-80 flex flex-col gap-6">
          
          {/* Status */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Missão Sudoku</span>
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Preencha a grade para que cada linha, coluna e bloco 3x3 contenha todos os 9 ícones de energia renovável.
            </p>
            
            {isComplete ? (
              <div className="bg-green-500/20 text-green-400 p-4 rounded-lg border border-green-500/30 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <div className="font-bold">Sistema Estável!</div>
                  <div className="text-xs text-green-300/80">Tempo: {formatTime(timeElapsed)}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Energias Disponíveis</div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumberInput(num)}
                      disabled={!selectedCell}
                      className={`
                        p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-all
                        flex flex-col items-center gap-1
                        ${!selectedCell ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                      `}
                      title={SUDOKU_LABELS[num]}
                    >
                      <span className="text-2xl leading-none">{SUDOKU_ICONS[num]}</span>
                      <span className="text-[10px] text-slate-400 font-mono truncate w-full text-center">{SUDOKU_LABELS[num]}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => handleNumberInput(0)}
                  disabled={!selectedCell}
                  className="mt-2 w-full py-2 rounded-lg border border-red-900/30 bg-red-900/10 text-red-400 hover:bg-red-900/20 text-xs font-bold uppercase transition-all"
                >
                  Limpar Célula
                </button>
              </div>
            )}
          </div>

          {/* Dicas */}
          <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200/80">
                <span className="font-bold text-blue-300">Dica Tática:</span> Comece procurando linhas ou blocos que estão quase cheios. É mais fácil deduzir qual energia falta neles!
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EcoSudoku;
