// src/utils/difficulty.js

/**
 * Manages game difficulty dynamically based on player performance.
 * Metrics tracked: time taken to complete level, number of mistakes in quizzes.
 */
class DifficultyManager {
    constructor() {
        this.level = 1; // 1: Easy, 2: Medium, 3: Hard
        this.metrics = {
            startTime: 0,
            mistakes: 0
        };
    }

    startTracking() {
        this.metrics.startTime = Date.now();
        this.metrics.mistakes = 0;
    }

    recordMistake() {
        this.metrics.mistakes++;
    }

    /**
     * Called at end of level to adjust difficulty for next level.
     * @returns {string} New difficulty description ('Easy', 'Medium', 'Hard')
     */
    evaluatePerformance() {
        const timeTaken = (Date.now() - this.metrics.startTime) / 1000; // seconds

        // Fast finish + few mistakes => Increase difficulty
        if (timeTaken < 30 && this.metrics.mistakes === 0) {
            this.level = Math.min(3, this.level + 1);
        }
        // Slow finish or many mistakes => Decrease difficulty
        else if (timeTaken > 60 || this.metrics.mistakes >= 2) {
            this.level = Math.max(1, this.level - 1);
        }

        return this.getDifficultyName();
    }

    getDifficultyName() {
        switch (this.level) {
            case 1: return 'Easy';
            case 2: return 'Medium';
            case 3: return 'Hard';
            default: return 'Medium';
        }
    }

    /**
     * Get target energy goal based on current difficulty
     * @param {number} baseTarget Base target for the level
     * @returns {number} Adjusted target
     */
    getTargetScore(baseTarget) {
        if (this.level === 1) return baseTarget * 0.8;
        if (this.level === 3) return baseTarget * 1.5;
        return baseTarget; // Medium
    }

    /**
     * Get simulation speed multiplier
     * @returns {number}
     */
    getSimulationSpeed() {
        if (this.level === 1) return 0.8; // Slower
        if (this.level === 3) return 1.2; // Faster
        return 1.0;
    }
}

export const difficultyManager = new DifficultyManager();
