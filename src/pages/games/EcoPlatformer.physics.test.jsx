import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../frontend/src/utils/soundEffects', () => ({
  playClick: vi.fn(),
  playError: vi.fn(),
  playSuccess: vi.fn(),
  playWin: vi.fn(),
}));

vi.mock('../../../frontend/src/context/GameStateContext', () => ({
  useGameState: () => ({ addScore: vi.fn(), updateStat: vi.fn() }),
}));

import { playSuccess } from '../../../frontend/src/utils/soundEffects';
import { __testables } from './EcoPlatformer';

const baseInput = (dt) => ({
  left: false,
  right: false,
  down: false,
  run: false,
  jumpHeld: false,
  jumpPressed: false,
  dt,
  viewW: 860,
  viewH: 520,
});

const simulate = (session, seconds, dt, getInput) => {
  let nowMs = session.startedAtMs;
  const steps = Math.ceil(seconds / dt);
  let s = session;
  for (let i = 0; i < steps; i += 1) {
    const input = getInput ? getInput(i, s) : baseInput(dt);
    nowMs += dt * 1000;
    s = __testables.tickSession(s, input, nowMs);
  }
  return s;
};

describe('EcoPlatformer physics', () => {
  it('para no chão e não cai infinitamente', () => {
    const level = __testables.LEVELS[0];
    const session0 = __testables.createSession(0, 0);
    const s = simulate(session0, 2.5, 1 / 60);
    const groundY = level.platforms[0].y - s.player.h;
    expect(s.gameOver).toBe(false);
    expect(s.player.onGround).toBe(true);
    expect(Math.abs(s.player.y - groundY)).toBeLessThanOrEqual(2);
    expect(Math.abs(s.player.vy)).toBeLessThanOrEqual(0.001);
  });

  it('não atravessa plataforma fina com dt maior', () => {
    const level = __testables.LEVELS[0];
    const session0 = __testables.createSession(0, 0);
    const thin = level.platforms.find((p) => p.h <= 18 && p.x >= 260);
    const s0 = {
      ...session0,
      player: {
        ...session0.player,
        x: thin.x + 20,
        y: thin.y - session0.player.h - 1,
        vy: 1100,
        onGround: false,
      },
    };

    const s = simulate(s0, 0.4, 1 / 30);
    const expectedY = thin.y - s.player.h;
    expect(s.player.onGround).toBe(true);
    expect(Math.abs(s.player.y - expectedY)).toBeLessThanOrEqual(2);
  });

  it('respawna ao cair abaixo do limite e reduz vidas', () => {
    const level = __testables.LEVELS[0];
    const session0 = __testables.createSession(0, 0);
    const s0 = {
      ...session0,
      lives: 2,
      player: { ...session0.player, y: level.height + 400 },
    };

    const s = __testables.tickSession(s0, baseInput(1 / 60), 16);
    expect(s.lives).toBe(1);
    expect(s.gameOver).toBe(false);
    expect(s.levelIndex).toBe(0);
    expect(s.player.y).toBe(level.height - 240);
  });

  it('mantém estabilidade em diferentes dt (hardware)', () => {
    const a = simulate(__testables.createSession(0, 0), 3, 1 / 120);
    const b = simulate(__testables.createSession(0, 0), 3, 1 / 30);
    expect(a.player.onGround).toBe(true);
    expect(b.player.onGround).toBe(true);
  });

  it('permite subir pequenos degraus sem travar', () => {
    const level = __testables.LEVELS[0];
    const ground = { x: 0, y: level.platforms[0].y, w: level.width, h: level.platforms[0].h };
    const step = { x: 140, y: ground.y - 12, w: 80, h: 12 };
    const session0 = __testables.createSession(0, 0);
    const s0 = {
      ...session0,
      platforms: [ground, step],
      player: { ...session0.player, x: 60, y: ground.y - session0.player.h, onGround: true, vy: 0 },
    };

    const dt = 1 / 60;
    let minYWhileOverStep = Number.POSITIVE_INFINITY;
    const s = simulate(s0, 1.8, dt, (_i, state) => {
      const p = state.player;
      const overlapX = p.x + p.w > step.x + 1 && p.x < step.x + step.w - 1;
      if (overlapX) minYWhileOverStep = Math.min(minYWhileOverStep, p.y);
      return { ...baseInput(dt), right: true };
    });
    expect(s.player.x).toBeGreaterThan(step.x + 10);
    expect(s.player.onGround).toBe(true);
    expect(minYWhileOverStep).toBeLessThan(Number.POSITIVE_INFINITY);
    expect(minYWhileOverStep).toBeLessThanOrEqual(step.y - session0.player.h + 3);
  });

  it('roda múltiplos personagens (sessões) em paralelo sem interferência', () => {
    const s1 = simulate(__testables.createSession(0, 0), 2, 1 / 60);
    const s2 = simulate(__testables.createSession(1, 0), 2, 1 / 60);
    expect(s1.player.onGround).toBe(true);
    expect(s2.player.onGround).toBe(true);
    expect(s1.levelIndex).toBe(0);
    expect(s2.levelIndex).toBe(1);
  });

  it('coleta eco-item, pontua e some do cenário', () => {
    const session0 = __testables.createSession(0, 0);
    const item = {
      id: 'seed-0',
      x: session0.player.x + session0.player.w / 2,
      y: session0.player.y + session0.player.h / 2,
      type: 'seed',
      taken: false,
    };
    const s0 = { ...session0, collectibles: [item], levelScore: 0, message: null };
    const s1 = __testables.tickSession(s0, baseInput(1 / 60), 1000);
    expect(playSuccess).toHaveBeenCalled();
    expect(s1.collectibles[0].taken).toBe(true);
    expect(s1.levelScore).toBeGreaterThan(0);
    expect(s1.message).toContain('🌱');

    const s2 = __testables.tickSession(s1, baseInput(1 / 60), 1016);
    expect(s2.levelScore).toBe(s1.levelScore);
  });

  it('inclui mobis na sessão e permite segurar/soltar', () => {
    const session0 = __testables.createSession(0, 0);
    expect(Array.isArray(session0.mobis)).toBe(true);

    const mobi = {
      id: 'mobi-test',
      type: 'crate',
      x: session0.player.x + 40,
      y: session0.player.y,
      vx: 0,
      vy: 0,
      w: 56,
      h: 44,
      mass: 1.6,
      movable: true,
      portable: true,
      openable: false,
      open: false,
      material: 'wood',
      palette: 'slate',
      color: '#64748b',
      accent: '#cbd5e1',
      stroke: '#0b1220',
      resting: false,
    };

    const editor = {
      flyingObstacles: {
        enabled: false,
        spawnRatePerMin: 60,
        maxCount: 6,
        speedMin: 180,
        speedMax: 340,
        size: 44,
        showColliders: false,
        patterns: { sine: 1, zigzag: 1, orbit: 1 },
      },
      mobis: { enabled: true, gravityScale: 0, friction: 0.9, restitution: 0.02, portableEnabled: true },
    };

    const s0 = { ...session0, mobis: [mobi], heldMobiId: null, player: { ...session0.player, facing: 1 } };
    const s1 = __testables.tickSession(
      s0,
      { ...baseInput(1 / 60), interactPressed: true, editor },
      1000
    );
    expect(s1.heldMobiId).toBe('mobi-test');

    const s2 = __testables.tickSession(
      s1,
      { ...baseInput(1 / 60), interactPressed: true, editor },
      1016
    );
    expect(s2.heldMobiId).toBe(null);
  });

  it('aplica personalização de cor/material no mobi próximo', () => {
    const session0 = __testables.createSession(0, 0);
    const mobi = {
      id: 'mobi-test',
      type: 'crate',
      x: session0.player.x + 40,
      y: session0.player.y,
      vx: 0,
      vy: 0,
      w: 56,
      h: 44,
      mass: 1.6,
      movable: true,
      portable: true,
      openable: false,
      open: false,
      material: 'wood',
      palette: 'slate',
      color: '#64748b',
      accent: '#cbd5e1',
      stroke: '#0b1220',
      resting: false,
    };

    const editor = {
      flyingObstacles: {
        enabled: false,
        spawnRatePerMin: 60,
        maxCount: 6,
        speedMin: 180,
        speedMax: 340,
        size: 44,
        showColliders: false,
        patterns: { sine: 1, zigzag: 1, orbit: 1 },
      },
      mobis: { enabled: true, gravityScale: 0, friction: 0.9, restitution: 0.02, portableEnabled: true },
    };

    const s0 = { ...session0, mobis: [mobi] };
    const s1 = __testables.tickSession(s0, { ...baseInput(1 / 60), colorPressed: true, editor }, 1000);
    expect(s1.mobis[0].palette).not.toBe('slate');

    const s2 = __testables.tickSession(s1, { ...baseInput(1 / 60), stylePressed: true, editor }, 1016);
    expect(s2.mobis[0].material).not.toBe('wood');
  });

  it('spawna obstáculos voadores quando editor habilita', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const session0 = __testables.createSession(0, 0);
    const editor = {
      flyingObstacles: {
        enabled: true,
        spawnRatePerMin: 120,
        maxCount: 3,
        speedMin: 180,
        speedMax: 180,
        size: 44,
        showColliders: false,
        patterns: { sine: 1, zigzag: 0, orbit: 0 },
      },
      mobis: { enabled: false, gravityScale: 1, friction: 0.86, restitution: 0.06, portableEnabled: true },
    };

    const s0 = {
      ...session0,
      platforms: [],
      hazards: [],
      mobis: [],
      player: { ...session0.player, y: 10, vy: 0, onGround: false },
      flyingObstacles: [],
      flyingSpawnCooldownMs: 0,
    };
    const s1 = __testables.tickSession(s0, { ...baseInput(1 / 60), editor }, 1000);
    expect(s1.flyingObstacles.length).toBe(1);
    randomSpy.mockRestore();
  });
});
