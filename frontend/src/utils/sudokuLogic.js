// Utilitário para geração e validação de Sudoku

// Ícones mapeados para os números 1-9
export const SUDOKU_ICONS = {
  1: '☀️', // Sol
  2: '💨', // Vento
  3: '💧', // Água
  4: '🍃', // Biomassa
  5: '🔋', // Bateria
  6: '⚡', // Eletricidade
  7: '🌊', // Ondas
  8: '🌋', // Geotérmica
  9: '🌱'  // Muda
};

export const SUDOKU_LABELS = {
  1: 'Sol', 2: 'Vento', 3: 'Água',
  4: 'Biomassa', 5: 'Bateria', 6: 'Eletricidade',
  7: 'Ondas', 8: 'Geotérmica', 9: 'Muda'
};

const BLANK = 0;

// Verifica se é seguro colocar um número na posição row, col
const isSafe = (grid, row, col, num) => {
  // Verifica linha
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num) return false;
  }

  // Verifica coluna
  for (let x = 0; x < 9; x++) {
    if (grid[x][col] === num) return false;
  }

  // Verifica bloco 3x3
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
};

// Preenche o grid usando backtracking
const fillGrid = (grid) => {
  let row = -1;
  let col = -1;
  let isEmpty = true;

  // Encontra a próxima célula vazia
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] === BLANK) {
        row = i;
        col = j;
        isEmpty = false;
        break;
      }
    }
    if (!isEmpty) break;
  }

  // Se não há células vazias, terminamos
  if (isEmpty) return true;

  // Tenta números de 1 a 9 em ordem aleatória para garantir variedade
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

  for (let num of numbers) {
    if (isSafe(grid, row, col, num)) {
      grid[row][col] = num;
      if (fillGrid(grid)) return true;
      grid[row][col] = BLANK;
    }
  }

  return false;
};

// Remove células para criar o puzzle
const removeCells = (grid, difficulty = 'medium') => {
  const attempts = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 55;
  const newGrid = grid.map(row => [...row]);
  
  let count = attempts;
  while (count > 0) {
    let row = Math.floor(Math.random() * 9);
    let col = Math.floor(Math.random() * 9);
    
    if (newGrid[row][col] !== BLANK) {
      newGrid[row][col] = BLANK;
      count--;
    }
  }
  
  return newGrid;
};

export const generateSudoku = (difficulty = 'medium') => {
  // Cria grid vazio 9x9
  let grid = Array.from({ length: 9 }, () => Array(9).fill(BLANK));
  
  // Preenche a diagonal principal (3 blocos 3x3) para otimizar
  // Blocos independentes podem ser preenchidos aleatoriamente sem conflito inicial
  for (let i = 0; i < 9; i = i + 3) {
    fillBox(grid, i, i);
  }

  // Preenche o resto
  fillGrid(grid);
  
  // Guarda a solução
  const solvedGrid = grid.map(row => [...row]);
  
  // Cria o puzzle removendo peças
  const initialGrid = removeCells(grid, difficulty);
  
  return {
    initial: initialGrid,
    solved: solvedGrid
  };
};

const fillBox = (grid, row, col) => {
  let num;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      do {
        num = Math.floor(Math.random() * 9) + 1;
      } while (!isSafeBox(grid, row, col, num));
      grid[row + i][col + j] = num;
    }
  }
};

const isSafeBox = (grid, rowStart, colStart, num) => {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[rowStart + i][colStart + j] === num) return false;
    }
  }
  return true;
};