import { describe, it, expect } from 'vitest';
import { checkNewBadges, BADGES } from './gamification';

describe('Gamification Logic', () => {
  it('should unlock first_login badge when login count is 1', () => {
    const stats = { logins: 1 };
    const ownedBadges = [];
    const newBadges = checkNewBadges(stats, ownedBadges);
    
    expect(newBadges).toHaveLength(1);
    expect(newBadges[0].id).toBe('first_login');
  });

  it('should not unlock first_login if already owned', () => {
    const stats = { logins: 2 };
    const ownedBadges = ['first_login'];
    const newBadges = checkNewBadges(stats, ownedBadges);
    
    expect(newBadges).toHaveLength(0);
  });

  it('should unlock eco_warrior when total games reach 10', () => {
    const stats = {
      sudoku_wins: 5,
      quiz_completions: 3,
      memory_wins: 2
    };
    const ownedBadges = [];
    const newBadges = checkNewBadges(stats, ownedBadges);
    
    const warriorBadge = newBadges.find(b => b.id === 'eco_warrior');
    expect(warriorBadge).toBeDefined();
  });

  it('should calculate progress correctly', () => {
    const stats = { streak: 1 };
    const badge = BADGES.find(b => b.id === 'daily_streak_3');
    const progress = badge.getProgress(stats);
    
    // 1 de 3 = 33.33%
    expect(progress).toBeCloseTo(33.33, 1);
  });

  // Novos Testes
  it('should unlock all_rounder only when all 3 games have at least 1 win', () => {
    const statsPartial = { sudoku_wins: 1, quiz_completions: 1, memory_wins: 0 };
    const newBadgesPartial = checkNewBadges(statsPartial, []);
    expect(newBadgesPartial.find(b => b.id === 'all_rounder')).toBeUndefined();

    const statsFull = { sudoku_wins: 1, quiz_completions: 1, memory_wins: 1 };
    const newBadgesFull = checkNewBadges(statsFull, []);
    expect(newBadgesFull.find(b => b.id === 'all_rounder')).toBeDefined();
  });

  it('should unlock daily_streak_7 when streak is 7', () => {
    const stats = { streak: 7 };
    const newBadges = checkNewBadges(stats, []);
    expect(newBadges.find(b => b.id === 'daily_streak_7')).toBeDefined();
  });

  it('should calculate polymath progress correctly', () => {
    const stats = { sudoku_wins: 1, quiz_completions: 0, memory_wins: 0 }; // 1 de 3
    const badge = BADGES.find(b => b.id === 'all_rounder');
    const progress = badge.getProgress(stats);
    expect(progress).toBeCloseTo(33.33, 1);
  });

  it('should have unique badge ids', () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
