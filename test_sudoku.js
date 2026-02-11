
const { generateSudoku } = require('./src/utils/sudokuLogic.js');

function validateBoard(grid) {
    const isValidSet = (arr) => {
        const filtered = arr.filter(n => n !== 0);
        return new Set(filtered).size === filtered.length;
    };

    // Check rows
    for (let i = 0; i < 9; i++) {
        if (!isValidSet(grid[i])) return false;
    }

    // Check columns
    for (let j = 0; j < 9; j++) {
        const col = grid.map(row => row[j]);
        if (!isValidSet(col)) return false;
    }

    // Check boxes
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
}

let errors = 0;
for (let k = 0; k < 100; k++) {
    const { solved } = generateSudoku('medium');
    if (!validateBoard(solved)) {
        console.log('Invalid board generated at iteration', k);
        console.log(solved);
        errors++;
    }

    // Also check if solved board is completely filled
    const hasEmpty = solved.some(row => row.includes(0));
    if (hasEmpty) {
        console.log('Incomplete board at iteration', k);
        errors++;
    }
}

if (errors === 0) {
    console.log("All 100 boards valid.");
} else {
    console.log(`Found ${errors} invalid boards.`);
}
