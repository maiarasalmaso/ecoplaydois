// src/services/__tests__/PlayerState.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { playerState } from '../PlayerState.js';

describe('PlayerState', () => {
    beforeEach(() => {
        // Reset state manually if needed, or rely on singleton behavior (CAUTION in tests)
        // Since it's a singleton export, we might need a reset method or direct manipulation
        playerState.credits = 0;
        playerState.unlockedLevels = 1;
    });

    it('should initialize with 0 credits', () => {
        expect(playerState.getCredits()).toBe(0);
    });

    it('should add credits correctly', () => {
        playerState.addCredits(10);
        expect(playerState.getCredits()).toBe(10);
        playerState.addCredits(5);
        expect(playerState.getCredits()).toBe(15);
    });
});
