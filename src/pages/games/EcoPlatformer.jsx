import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Leaf, Pause, Play, RotateCcw, Trophy, ArrowUp } from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import { useTheme } from '@/context/ThemeContext';
import { playClick, playError, playSuccess, playWin } from '@/utils/soundEffects';
import api from '../../services/api';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const randInt = (min, maxExclusive) => Math.floor(Math.random() * (maxExclusive - min)) + min;

const rectsOverlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const BASE_GRAVITY = 1650;
const GLIDE_GRAVITY = 900;
const STEP_HEIGHT = 18;
const KILL_MARGIN = 240;
const GROUND_EPS = 2;

const PLATFORMER_PALETTES = {
  dark: {
    bgTop: '#0f172a',
    bgBottom: '#0b1220',
    cloud: '#1f3b65',
    shadow: '#000000',
    ink: '#0b1220',
    text: '#e2e8f0',
    textMuted: '#e5e7eb',
    tokenBg: '#0b1220',
    tokenStroke: '#e2e8f0',
    tokenText: '#e2e8f0',
    bossHpBg: '#111827',
    exitIdle: '#334155',
    messageBg: '#0b1220',
  },
  light: {
    bgTop: '#ffffff',
    bgBottom: '#f8fafc',
    cloud: '#e2e8f0',
    shadow: 'rgba(15,23,42,0.12)',
    ink: '#1e293b',
    text: '#1e293b',
    textMuted: '#475569',
    tokenBg: '#ffffff',
    tokenStroke: '#94a3b8',
    tokenText: '#1e293b',
    bossHpBg: '#cbd5e1',
    exitIdle: '#cbd5e1',
    messageBg: '#ffffff',
  },
};

const getPlatformerPalette = (theme) => PLATFORMER_PALETTES[theme] || PLATFORMER_PALETTES.dark;

const DEFAULT_EDITOR = {
  flyingObstacles: {
    enabled: true,
    spawnRatePerMin: 18,
    maxCount: 6,
    speedMin: 180,
    speedMax: 340,
    size: 44,
    showColliders: false,
    patterns: { sine: 1, zigzag: 1, orbit: 1 },
  },
  mobis: {
    enabled: true,
    gravityScale: 1,
    friction: 0.86,
    restitution: 0.06,
    portableEnabled: true,
  },
};

const createEditorState = () => ({
  flyingObstacles: { ...DEFAULT_EDITOR.flyingObstacles, patterns: { ...DEFAULT_EDITOR.flyingObstacles.patterns } },
  mobis: { ...DEFAULT_EDITOR.mobis },
});

const weightedPick = (weights, t) => {
  const entries = Object.entries(weights || {});
  const total = entries.reduce((acc, [, w]) => acc + Math.max(0, Number(w) || 0), 0);
  if (total <= 0) return entries[0]?.[0] || null;
  let r = clamp(t, 0, 1) * total;
  for (const [key, wRaw] of entries) {
    const w = Math.max(0, Number(wRaw) || 0);
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1]?.[0] || null;
};

const MOBI_SPECS = {
  crate: { w: 56, h: 44, emoji: '📦' },
  bin: { w: 50, h: 62, emoji: '🗑️' },
  cabinet: { w: 74, h: 76, emoji: '🗄️' },
  barrel: { w: 56, h: 66, emoji: '🛢️' },
};

const MOBI_PALETTES = {
  amber: { base: '#a16207', top: '#fbbf24', stroke: '#111827' },
  slate: { base: '#64748b', top: '#cbd5e1', stroke: '#0b1220' },
  emerald: { base: '#16a34a', top: '#4ade80', stroke: '#0b1220' },
  sky: { base: '#0284c7', top: '#7dd3fc', stroke: '#0b1220' },
  rose: { base: '#be123c', top: '#fb7185', stroke: '#0b1220' },
};

const createMobi = (def, levelIndex) => {
  const spec = MOBI_SPECS[def.type] || MOBI_SPECS.crate;
  const palette = MOBI_PALETTES[def.palette] || MOBI_PALETTES.slate;
  return {
    id: `mobi-${def.type}-${def.x}-${def.y}-${levelIndex}`,
    type: def.type,
    x: def.x,
    y: def.y,
    vx: 0,
    vy: 0,
    w: def.w || spec.w,
    h: def.h || spec.h,
    mass: clamp(def.mass || (def.type === 'cabinet' ? 3.2 : def.type === 'barrel' ? 2.2 : 1.6), 0.8, 6),
    movable: def.movable !== false,
    portable: Boolean(def.portable),
    openable: Boolean(def.openable),
    open: Boolean(def.open),
    material: def.material || 'wood',
    palette: def.palette || 'slate',
    color: def.color || palette.base,
    accent: palette.top,
    stroke: palette.stroke,
    resting: false,
  };
};

const createFlyingObstacle = (spawn, config, nowMs) => {
  const size = clamp(config.size || 44, 26, 92);
  const speedMin = clamp(config.speedMin || 180, 60, 900);
  const speedMax = clamp(config.speedMax || 340, speedMin, 1200);
  const speed = randInt(speedMin, speedMax + 1);
  const kind = weightedPick({ drone: 1, shard: 1, turbine: 1 }, Math.random());
  const pattern = weightedPick(config.patterns || DEFAULT_EDITOR.flyingObstacles.patterns, Math.random());
  const amp = randInt(10, 48);
  const freq = 0.0026 + Math.random() * 0.0038;
  return {
    id: `fly-${nowMs}-${randInt(0, 1_000_000)}`,
    kind,
    pattern,
    x: spawn.x,
    y: spawn.y,
    baseY: spawn.y,
    w: size,
    h: size,
    vx: -speed,
    amp,
    freq,
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() * 2 - 1) * 4,
    createdAtMs: nowMs,
    tint: kind === 'turbine' ? '#60a5fa' : kind === 'shard' ? '#f97316' : '#a855f7',
  };
};

const drawMobi3D = (ctx, sx, sy, m, showColliders, palette = PLATFORMER_PALETTES.dark) => {
  const spec = MOBI_SPECS[m.type] || MOBI_SPECS.crate;
  const x = sx(m.x);
  const y = sy(m.y);
  const depth = clamp(Math.min(m.w * 0.28, 14), 6, 16);

  ctx.globalAlpha = 0.22;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(x + m.w / 2, y + m.h + 8, m.w * 0.42, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = m.color;
  ctx.fillRect(x, y, m.w, m.h);

  ctx.fillStyle = m.accent;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + depth, y - depth);
  ctx.lineTo(x + m.w + depth, y - depth);
  ctx.lineTo(x + m.w, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(x + m.w - 10, y + 6, 8, m.h - 12);
  ctx.globalAlpha = 1;

  ctx.fillStyle = m.stroke;
  ctx.globalAlpha = 0.55;
  ctx.strokeRect(x, y, m.w, m.h);
  ctx.globalAlpha = 1;

  if (m.openable) {
    const doorW = Math.max(12, Math.floor(m.w * 0.32));
    const doorH = Math.max(18, Math.floor(m.h * 0.68));
    const doorX = x + m.w - doorW - 6;
    const doorY = y + 12;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = m.material === 'metal' ? '#94a3b8' : m.material === 'plastic' ? '#cbd5e1' : '#f59e0b';
    if (m.open) {
      ctx.beginPath();
      ctx.moveTo(doorX, doorY);
      ctx.lineTo(doorX + doorW, doorY - 10);
      ctx.lineTo(doorX + doorW, doorY + doorH - 10);
      ctx.lineTo(doorX, doorY + doorH);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(doorX, doorY, doorW, doorH);
    }
    ctx.globalAlpha = 1;
  }

  ctx.font = '18px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.ink;
  ctx.fillText(spec.emoji, x + m.w / 2, y + m.h / 2 + 1);

  if (showColliders) {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, m.w, m.h);
    ctx.globalAlpha = 1;
  }
};

const drawFlyingObstacle3D = (ctx, sx, sy, o, nowMs, showColliders, palette = PLATFORMER_PALETTES.dark) => {
  const x = sx(o.x);
  const y = sy(o.y);
  const cx = x + o.w / 2;
  const cy = y + o.h / 2;
  const spin = (nowMs - o.createdAtMs) * 0.004 * o.spin;

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = palette.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, y + o.h + 18, o.w * 0.38, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  ctx.fillStyle = o.tint;
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 2;

  if (o.kind === 'shard') {
    ctx.beginPath();
    ctx.moveTo(0, -o.h * 0.46);
    ctx.lineTo(o.w * 0.44, 0);
    ctx.lineTo(0, o.h * 0.46);
    ctx.lineTo(-o.w * 0.44, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (o.kind === 'turbine') {
    ctx.beginPath();
    ctx.arc(0, 0, o.w * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < 3; i += 1) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(o.w * 0.5, -o.h * 0.12);
      ctx.lineTo(o.w * 0.5, o.h * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, o.w * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = palette.tokenText;
    ctx.beginPath();
    ctx.arc(-o.w * 0.08, -o.h * 0.08, o.w * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  if (showColliders) {
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, o.w, o.h);
    ctx.globalAlpha = 1;
  }
};

const LEVELS = [
  {
    id: 'capta-fotons',
    name: 'Campo Solar',
    width: 2200,
    height: 700,
    efficiencyGoal: 60,
    tip: 'Missão: coletar eco-itens e manter eficiência para energizar o campo solar.',
    platforms: [
      { x: 0, y: 620, w: 2200, h: 80, type: 'ground', friction: 0.9 },
      { x: 260, y: 520, w: 160, h: 18 },
      { x: 520, y: 470, w: 200, h: 18 },
      { x: 820, y: 430, w: 160, h: 18 },
      { x: 1140, y: 520, w: 240, h: 18 },
      { x: 1540, y: 470, w: 200, h: 18 },
    ],
    hazards: [
      { x: 980, y: 604, w: 70, h: 16 },
      { x: 1048, y: 604, w: 70, h: 16 },
    ],
    collectibles: [
      { x: 310, y: 492, type: 'sun', required: true },
      { x: 610, y: 442, type: 'seed', required: true },
      { x: 880, y: 402, type: 'recycle', required: true },
      { x: 1016, y: 572, type: 'water', required: false },
      { x: 1760, y: 442, type: 'earth', required: false },
    ],
    enemies: [
      { x: 720, y: 580, type: 'smog' },
      { x: 1300, y: 580, type: 'waste' },
    ],
    mobis: [
      { x: 430, y: 580, type: 'crate', material: 'wood', palette: 'amber', movable: true, portable: true },
      { x: 1220, y: 464, type: 'bin', material: 'metal', palette: 'slate', movable: true, openable: true },
    ],
    exit: { x: 2050, y: 540, w: 80, h: 80 },
  },
  {
    id: 'vento-em-acao',
    name: 'Parque Eólico',
    width: 2500,
    height: 760,
    efficiencyGoal: 65,
    tip: 'Missão: criar uma cadeia de coleta e aprender como o vento ajuda a energia limpa.',
    platforms: [
      { x: 0, y: 670, w: 2500, h: 90, type: 'ground', friction: 0.9 },
      { x: 260, y: 560, w: 180, h: 18 },
      { x: 530, y: 500, w: 220, h: 18 },
      { x: 880, y: 450, w: 170, h: 18 },
      { x: 1220, y: 520, w: 250, h: 18 },
      { x: 1620, y: 430, w: 200, h: 18 },
      { x: 1940, y: 500, w: 220, h: 18 },
    ],
    hazards: [
      { x: 1020, y: 654, w: 120, h: 16 },
      { x: 1410, y: 654, w: 120, h: 16 },
      { x: 1800, y: 654, w: 120, h: 16 },
    ],
    collectibles: [
      { x: 360, y: 532, type: 'recycle', required: true },
      { x: 640, y: 472, type: 'sun', required: true },
      { x: 970, y: 422, type: 'earth', required: true },
      { x: 1320, y: 492, type: 'seed', required: false },
      { x: 1720, y: 402, type: 'water', required: false },
      { x: 2120, y: 472, type: 'recycle', required: false },
    ],
    enemies: [
      { x: 760, y: 630, type: 'smog' },
      { x: 1500, y: 630, type: 'waste' },
      { x: 2100, y: 630, type: 'smog' },
    ],
    mobis: [
      { x: 560, y: 614, type: 'crate', material: 'wood', palette: 'amber', movable: true, portable: true },
      { x: 1660, y: 374, type: 'cabinet', material: 'plastic', palette: 'emerald', movable: true, openable: true },
    ],
    exit: { x: 2350, y: 590, w: 90, h: 80 },
  },
  {
    id: 'queda-dagua',
    name: 'Usina Hídrica',
    width: 2700,
    height: 760,
    efficiencyGoal: 70,
    tip: 'Missão: economizar água e energia — precisão ajuda a reduzir desperdícios.',
    platforms: [
      { x: 0, y: 670, w: 2700, h: 90, type: 'ground', friction: 0.9 },
      { x: 280, y: 550, w: 200, h: 18 },
      { x: 560, y: 500, w: 120, h: 14 },
      { x: 760, y: 460, w: 120, h: 14 },
      { x: 960, y: 420, w: 120, h: 14 },
      { x: 1160, y: 460, w: 160, h: 18 },
      { x: 1500, y: 520, w: 240, h: 18 },
      { x: 1860, y: 460, w: 180, h: 18 },
      { x: 2160, y: 520, w: 240, h: 18 },
    ],
    hazards: [
      { x: 860, y: 654, w: 160, h: 16 },
      { x: 1260, y: 654, w: 160, h: 16 },
      { x: 1700, y: 654, w: 160, h: 16 },
      { x: 2140, y: 654, w: 160, h: 16 },
    ],
    collectibles: [
      { x: 340, y: 522, type: 'water', required: true },
      { x: 980, y: 392, type: 'earth', required: true },
      { x: 1320, y: 442, type: 'sun', required: true },
      { x: 620, y: 472, type: 'seed', required: false },
      { x: 820, y: 432, type: 'recycle', required: false },
      { x: 1980, y: 432, type: 'water', required: false },
      { x: 2240, y: 492, type: 'sun', required: false },
    ],
    enemies: [
      { x: 420, y: 630, type: 'waste' },
      { x: 1480, y: 630, type: 'smog' },
      { x: 2020, y: 630, type: 'waste' },
    ],
    mobis: [
      { x: 300, y: 614, type: 'barrel', material: 'metal', palette: 'sky', movable: true, portable: false },
      { x: 1520, y: 442, type: 'crate', material: 'wood', palette: 'amber', movable: true, portable: true },
    ],
    exit: { x: 2550, y: 590, w: 90, h: 80 },
  },
  {
    id: 'biofloresta',
    name: 'BioFloresta',
    width: 2800,
    height: 760,
    efficiencyGoal: 75,
    tip: 'Missão: restaurar a floresta — colete, proteja-se e mantenha a eficiência.',
    platforms: [
      { x: 0, y: 670, w: 2800, h: 90, type: 'ground', friction: 0.9 },
      { x: 240, y: 540, w: 180, h: 18 },
      { x: 520, y: 500, w: 200, h: 18 },
      { x: 820, y: 460, w: 220, h: 18 },
      { x: 1160, y: 520, w: 260, h: 18 },
      { x: 1560, y: 460, w: 220, h: 18 },
      { x: 1900, y: 520, w: 260, h: 18 },
      { x: 2300, y: 470, w: 220, h: 18 },
    ],
    hazards: [
      { x: 640, y: 654, w: 160, h: 16 },
      { x: 1080, y: 654, w: 160, h: 16 },
      { x: 1520, y: 654, w: 160, h: 16 },
      { x: 1960, y: 654, w: 160, h: 16 },
      { x: 2400, y: 654, w: 160, h: 16 },
    ],
    collectibles: [
      { x: 320, y: 512, type: 'seed', required: true },
      { x: 940, y: 432, type: 'recycle', required: true },
      { x: 2060, y: 492, type: 'sun', required: true },
      { x: 600, y: 472, type: 'water', required: false },
      { x: 1300, y: 492, type: 'earth', required: false },
      { x: 1680, y: 432, type: 'water', required: false },
      { x: 2380, y: 442, type: 'seed', required: false },
    ],
    enemies: [
      { x: 500, y: 630, type: 'smog' },
      { x: 980, y: 630, type: 'waste' },
      { x: 1600, y: 630, type: 'smog' },
      { x: 2140, y: 630, type: 'waste' },
    ],
    mobis: [
      { x: 260, y: 592, type: 'crate', material: 'wood', palette: 'amber', movable: true, portable: true },
      { x: 1940, y: 448, type: 'bin', material: 'metal', palette: 'slate', movable: true, openable: true },
    ],
    exit: { x: 2660, y: 590, w: 90, h: 80 },
  },
  {
    id: 'chefe-fossil',
    name: 'Refinaria Fóssil',
    width: 3000,
    height: 800,
    efficiencyGoal: 80,
    tip: 'Missão final: recuperar o equilíbrio do planeta e derrotar o chefe fóssil.',
    platforms: [
      { x: 0, y: 700, w: 3000, h: 100, type: 'ground', friction: 0.9 },
      { x: 320, y: 560, w: 220, h: 18 },
      { x: 660, y: 500, w: 240, h: 18 },
      { x: 1060, y: 560, w: 220, h: 18 },
      { x: 1400, y: 480, w: 260, h: 18 },
      { x: 1800, y: 560, w: 220, h: 18 },
      { x: 2140, y: 500, w: 240, h: 18 },
      { x: 2540, y: 560, w: 220, h: 18 },
    ],
    hazards: [
      { x: 980, y: 684, w: 180, h: 16 },
      { x: 1600, y: 684, w: 180, h: 16 },
      { x: 2220, y: 684, w: 180, h: 16 },
    ],
    collectibles: [
      { x: 430, y: 532, type: 'sun', required: true },
      { x: 740, y: 472, type: 'recycle', required: true },
      { x: 1100, y: 532, type: 'earth', required: true },
      { x: 1500, y: 452, type: 'water', required: true },
      { x: 1880, y: 532, type: 'seed', required: false },
      { x: 2240, y: 472, type: 'sun', required: false },
      { x: 2580, y: 532, type: 'recycle', required: false },
      { x: 2860, y: 662, type: 'earth', required: false },
    ],
    enemies: [
      { x: 860, y: 660, type: 'waste' },
      { x: 1260, y: 660, type: 'smog' },
      { x: 1960, y: 660, type: 'waste' },
    ],
    mobis: [
      { x: 360, y: 628, type: 'crate', material: 'wood', palette: 'amber', movable: true, portable: true },
      { x: 1820, y: 488, type: 'cabinet', material: 'metal', palette: 'rose', movable: true, openable: true },
    ],
    boss: { x: 2700, y: 560, w: 170, h: 140, hp: 3 },
    exit: { x: 2920, y: 610, w: 70, h: 80 },
  },
];

const getCollectibleEmoji = (type) => {
  if (type === 'seed') return '🌱';
  if (type === 'recycle') return '♻️';
  if (type === 'earth') return '🌍';
  if (type === 'water') return '💧';
  if (type === 'sun') return '☀️';
  return '✨';
};

const getCollectibleInfo = (type) => {
  if (type === 'seed')
    return {
      emoji: '🌱',
      title: 'Reflorestamento',
      fact: 'Mais árvores ajudam a reduzir CO₂ e proteger a biodiversidade.',
      baseScore: 18,
      efficiencyBoost: 4,
      reward: 'seed',
    };
  if (type === 'recycle')
    return {
      emoji: '♻️',
      title: 'Reciclagem',
      fact: 'Reutilizar materiais economiza energia e reduz lixo.',
      baseScore: 16,
      efficiencyBoost: 3,
      reward: 'glide',
    };
  if (type === 'earth')
    return {
      emoji: '🌍',
      title: 'Planeta em Equilíbrio',
      fact: 'Mudanças pequenas em conjunto geram grande impacto.',
      baseScore: 22,
      efficiencyBoost: 6,
      reward: 'earth',
    };
  if (type === 'water')
    return {
      emoji: '💧',
      title: 'Economia de Água',
      fact: 'Água é recurso finito: poupar hoje garante amanhã.',
      baseScore: 16,
      efficiencyBoost: 4,
      reward: 'shield',
    };
  if (type === 'sun')
    return {
      emoji: '☀️',
      title: 'Energia Solar',
      fact: 'Sol é fonte renovável: energia limpa com menor emissão.',
      baseScore: 18,
      efficiencyBoost: 3,
      reward: 'solar',
    };
  return { emoji: '✨', title: 'Bônus', fact: 'Bom trabalho!', baseScore: 12, efficiencyBoost: 0, reward: 'none' };
};

const getEnemyStyle = (type) => {
  if (type === 'smog') return { color: '#ef4444', emoji: '☁️' };
  return { color: '#fb7185', emoji: '🗑️' };
};

const createSession = (levelIndex, startedAtMs = 0) => {
  const level = LEVELS[levelIndex];
  const player = {
    x: 60,
    y: level.height - 240,
    vx: 0,
    vy: 0,
    mass: 1.25,
    gravityScale: 1,
    maxRiseSpeed: 900,
    maxFallSpeed: 1200,
    w: 44,
    h: 64,
    facing: 1,
    crouching: false,
    onGround: false,
    jumpsRemaining: 1,
    solarUntilMs: 0,
    glideUntilMs: 0,
    shield: 0,
    hits: 0,
    enemiesDefeated: 0,
    jumpsUsed: 0,
  };

  const collectibles = level.collectibles.map((c) => ({
    id: `${c.type}-${c.x}-${c.y}`,
    x: c.x,
    y: c.y,
    type: c.type,
    taken: false,
    required: c.required !== false,
  }));

  const enemies = level.enemies.map((e) => ({
    id: `${e.type}-${e.x}`,
    x: e.x,
    y: level.height - 120,
    vx: (e.type === 'smog' ? 70 : 85) * (1 + levelIndex * 0.08),
    type: e.type,
    w: 46,
    h: 46,
    alive: true,
    dir: Math.floor((e.x + levelIndex * 97) / 40) % 2 === 0 ? -1 : 1,
  }));

  const hazards = level.hazards.map((h) => ({ ...h }));
  const platforms = level.platforms.map((p) => ({ ...p }));
  const mobis = (level.mobis || []).map((m) => createMobi(m, levelIndex));

  const boss = level.boss
    ? {
      x: level.boss.x,
      y: level.boss.y,
      w: level.boss.w,
      h: level.boss.h,
      hp: level.boss.hp,
      invulnUntilMs: 0,
      spawnCooldownMs: 0,
    }
    : null;

  return {
    levelIndex,
    startedAtMs,
    elapsedMs: 0,
    paused: false,
    gameOver: false,
    player,
    platforms,
    hazards,
    collectibles,
    enemies,
    boss,
    flyingObstacles: [],
    flyingSpawnCooldownMs: 0,
    mobis,
    heldMobiId: null,
    interactHintUntilMs: 0,
    debug: { showColliders: false },
    exit: { ...level.exit },
    pollutants: [],
    message: null,
    lastHurtMs: 0,
    cameraX: 0,
    cameraY: 0,
    lives: 3,
    efficiency: 100,
    efficiencyBoost: 0,
    totalScore: 0,
    levelScore: 0,
    completed: false,
    gameWon: false,
    fx: [],
    collectStreak: 0,
    lastCollectMs: 0,
    messageUntilMs: 0,
  };
};

const computeEfficiency = (session) => {
  const t = session.elapsedMs / 1000;
  const timePenalty = t * 1.4;
  const hitPenalty = session.player.hits * 18;
  const jumpPenalty = Math.max(0, session.player.jumpsUsed - 12) * 0.4;
  const base = 100;
  const collectBonus = session.collectibles.filter((c) => c.taken).length * 5;
  const defeatBonus = session.player.enemiesDefeated * 2;
  const ecoBoost = session.efficiencyBoost || 0;
  return clamp(Math.round(base + ecoBoost + collectBonus + defeatBonus - timePenalty - hitPenalty - jumpPenalty), 0, 100);
};

const applyHorizontal = (player, input, nowMs) => {
  const run = input.run ? 1.55 : 1;
  const solarBoost = nowMs < player.solarUntilMs ? 1.35 : 1;
  const maxSpeed = 240 * run * solarBoost;
  const accel = 1700 * run;
  const decel = 2200;

  const move = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  if (move !== 0) {
    player.facing = move;
    player.vx += move * accel * input.dt;
  } else {
    const sign = Math.sign(player.vx);
    const next = Math.abs(player.vx) - decel * input.dt;
    player.vx = Math.max(0, next) * sign;
  }
  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
};

const resolveAxisDirectional = (rect, obstacles, axis, velocity) => {
  let hitDown = false;
  let hitUp = false;
  let hit = false;

  for (let pass = 0; pass < 3; pass += 1) {
    let any = false;
    for (const o of obstacles) {
      if (!rectsOverlap(rect, o)) continue;
      any = true;
      hit = true;

      if (axis === 'x') {
        if (velocity > 0) rect.x = o.x - rect.w;
        else if (velocity < 0) rect.x = o.x + o.w;
        else {
          const mid = rect.x + rect.w / 2;
          const oMid = o.x + o.w / 2;
          rect.x = mid < oMid ? o.x - rect.w : o.x + o.w;
        }
      } else {
        if (velocity > 0) {
          rect.y = o.y - rect.h;
          hitDown = true;
        } else if (velocity < 0) {
          rect.y = o.y + o.h;
          hitUp = true;
        } else {
          const mid = rect.y + rect.h / 2;
          const oMid = o.y + o.h / 2;
          rect.y = mid < oMid ? o.y - rect.h : o.y + o.h;
        }
      }
    }
    if (!any) break;
  }

  return { hit, hitDown, hitUp };
};

const isGrounded = (rect, solids) => {
  const bottom = rect.y + rect.h;
  for (const s of solids) {
    const horizontal = rect.x + rect.w - 1 > s.x && rect.x + 1 < s.x + s.w;
    if (!horizontal) continue;
    const dist = Math.abs(bottom - s.y);
    if (dist <= GROUND_EPS) return true;
  }
  return false;
};

const tickSession = (session, input, nowMs) => {
  if (session.paused || session.completed || session.gameWon || session.gameOver) return session;

  const next = { ...session };
  next.elapsedMs = nowMs - next.startedAtMs;
  if (next.message && next.messageUntilMs && nowMs > next.messageUntilMs) {
    next.message = null;
    next.messageUntilMs = 0;
  }
  if (next.fx?.length) next.fx = next.fx.filter((f) => nowMs - f.createdAtMs < f.ttlMs);

  const level = LEVELS[next.levelIndex];
  const player = { ...next.player };
  next.player = player;

  const platforms = next.platforms;
  const solid = platforms.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h }));
  const editor = input.editor || null;
  const flyingCfg = editor?.flyingObstacles || DEFAULT_EDITOR.flyingObstacles;
  const mobisCfg = editor?.mobis || DEFAULT_EDITOR.mobis;
  next.debug = { ...(next.debug || {}), showColliders: Boolean(editor && flyingCfg?.showColliders) };

  const wasOnGround = player.onGround;
  const crouching = input.down && player.onGround;
  if (crouching && !player.crouching) {
    player.crouching = true;
    player.h = 44;
    player.w = 48;
    player.y += 20;
  } else if (!crouching && player.crouching) {
    const test = { x: player.x, y: player.y - 20, w: 44, h: 64 };
    const overlaps = solid.some((s) => rectsOverlap(test, s));
    if (!overlaps) {
      player.crouching = false;
      player.h = 64;
      player.w = 44;
      player.y -= 20;
    }
  }

  applyHorizontal(player, input, nowMs);

  const wantsJump = input.jumpPressed;
  if (wantsJump) {
    const canJump = player.onGround || player.jumpsRemaining > 0;
    if (canJump) {
      playClick();
      player.vy = -640;
      if (!player.onGround) player.jumpsRemaining = Math.max(0, player.jumpsRemaining - 1);
      player.onGround = false;
      player.jumpsUsed += 1;
    }
  }

  const glideActive = nowMs < player.glideUntilMs && input.jumpHeld && player.vy > 0;
  const gravity = glideActive ? GLIDE_GRAVITY : BASE_GRAVITY;
  player.vy += gravity * player.gravityScale * input.dt;
  player.vy = clamp(player.vy, -player.maxRiseSpeed, player.maxFallSpeed);

  const desiredX = player.x + player.vx * input.dt;
  const rectX = { x: desiredX, y: player.y, w: player.w, h: player.h };
  const blockedX = solid.some((s) => rectsOverlap(rectX, s));
  if (blockedX && wasOnGround && !player.crouching) {
    const stepRect = { x: desiredX, y: player.y - STEP_HEIGHT, w: player.w, h: player.h };
    const stepBlocked = solid.some((s) => rectsOverlap(stepRect, s));
    if (!stepBlocked) {
      player.x = desiredX;
      player.y -= STEP_HEIGHT;
    } else {
      resolveAxisDirectional(rectX, solid, 'x', player.vx);
      player.x = rectX.x;
    }
  } else {
    resolveAxisDirectional(rectX, solid, 'x', player.vx);
    player.x = rectX.x;
  }

  player.y += player.vy * input.dt;
  const rectY = { x: player.x, y: player.y, w: player.w, h: player.h };
  const hitY = resolveAxisDirectional(rectY, solid, 'y', player.vy);
  player.y = rectY.y;

  const grounded = hitY.hitDown || isGrounded({ x: player.x, y: player.y, w: player.w, h: player.h }, solid);
  player.onGround = grounded;
  if (grounded) {
    player.vy = 0;
    player.jumpsRemaining = nowMs < player.solarUntilMs ? 1 : 0;
  } else if (hitY.hitUp) {
    player.vy = 0;
  }

  player.x = clamp(player.x, 0, level.width - player.w);
  if (player.y > level.height + KILL_MARGIN) {
    next.lives = Math.max(0, next.lives - 1);
    next.player.hits += 1;
    next.player.shield = 0;
    next.lastHurtMs = nowMs;
    playError();
    if (next.lives <= 0) return { ...next, gameOver: true, message: 'Game Over: queda na poluição.' };
    return { ...createSession(next.levelIndex, nowMs), lives: next.lives, totalScore: next.totalScore };
  }

  const pRect = { x: player.x, y: player.y, w: player.w, h: player.h };
  next.collectibles = next.collectibles.map((c) => {
    if (c.taken) return c;
    const cRect = { x: c.x - 14, y: c.y - 14, w: 28, h: 28 };
    if (!rectsOverlap(pRect, cRect)) return c;

    playSuccess();
    const info = getCollectibleInfo(c.type);
    const withinCombo = nowMs - (next.lastCollectMs || 0) <= 2400;
    const streak = withinCombo ? (next.collectStreak || 0) + 1 : 1;
    next.collectStreak = streak;
    next.lastCollectMs = nowMs;

    const basePoints = info.baseScore + next.levelIndex * 3;
    const multiplier = 1 + Math.min(3, streak - 1) * 0.25;
    const points = Math.round(basePoints * multiplier);

    next.levelScore += points;
    next.efficiencyBoost = clamp((next.efficiencyBoost || 0) + (info.efficiencyBoost || 0), 0, 25);

    if (info.reward === 'solar') {
      player.solarUntilMs = Math.max(player.solarUntilMs, nowMs + 6500);
      player.jumpsRemaining = 1;
    } else if (info.reward === 'glide') {
      player.glideUntilMs = Math.max(player.glideUntilMs, nowMs + 9000);
    } else if (info.reward === 'shield') {
      player.shield = Math.max(player.shield, 1);
    } else if (info.reward === 'seed') {
      if (next.lives < 3) next.lives += 1;
      else player.shield = Math.max(player.shield, 1);
    }

    const comboText = streak > 1 ? ` (combo ${streak})` : '';
    next.message = `${info.emoji} ${info.title} +${points}${comboText} — ${info.fact}`;
    next.messageUntilMs = nowMs + 2800;
    next.fx = [
      ...(next.fx || []),
      {
        id: `${nowMs}-${randInt(0, 1_000_000)}`,
        x: c.x,
        y: c.y,
        emoji: info.emoji,
        text: `+${points}`,
        createdAtMs: nowMs,
        ttlMs: 900,
      },
    ];
    return { ...c, taken: true };
  });

  const requiredAllCollected = next.collectibles.filter((c) => c.required !== false).every((c) => c.taken);

  const hazards = next.hazards.map((h) => ({ x: h.x, y: h.y, w: h.w, h: h.h }));
  const pollutants = next.pollutants.map((p) => ({ ...p }));
  const interactPressed = Boolean(input.interactPressed);
  const colorPressed = Boolean(input.colorPressed);
  const stylePressed = Boolean(input.stylePressed);

  const paletteKeys = Object.keys(MOBI_PALETTES);
  const materialKeys = ['wood', 'metal', 'plastic'];

  let mobis = (next.mobis || []).map((m) => ({ ...m }));
  const pMidX = player.x + player.w / 2;
  const pMidY = player.y + player.h / 2;
  const rangeSq = 110 * 110;

  const nearestMobiId = mobis.reduce((best, m) => {
    const dx = (m.x + m.w / 2) - pMidX;
    const dy = (m.y + m.h / 2) - pMidY;
    const d2 = dx * dx + dy * dy;
    if (d2 > rangeSq) return best;
    if (!best) return { id: m.id, d2 };
    return d2 < best.d2 ? { id: m.id, d2 } : best;
  }, null)?.id;

  const bumpMobiFx = (m, emoji, text) => {
    next.fx = [
      ...(next.fx || []),
      {
        id: `${nowMs}-${randInt(0, 1_000_000)}`,
        x: m.x + m.w / 2,
        y: m.y + 10,
        emoji,
        text,
        createdAtMs: nowMs,
        ttlMs: 760,
      },
    ];
  };

  if (mobisCfg.enabled !== false) {
    if (nearestMobiId && colorPressed) {
      const idx = mobis.findIndex((m) => m.id === nearestMobiId);
      if (idx >= 0) {
        const current = mobis[idx];
        const currentKey = current.palette || 'slate';
        const currentIndex = Math.max(0, paletteKeys.indexOf(currentKey));
        const nextKey = paletteKeys[(currentIndex + 1) % paletteKeys.length] || 'slate';
        const pal = MOBI_PALETTES[nextKey] || MOBI_PALETTES.slate;
        mobis[idx] = { ...current, palette: nextKey, color: pal.base, accent: pal.top, stroke: pal.stroke };
        playClick();
        bumpMobiFx(mobis[idx], '🎨', nextKey);
      }
    }

    if (nearestMobiId && stylePressed) {
      const idx = mobis.findIndex((m) => m.id === nearestMobiId);
      if (idx >= 0) {
        const current = mobis[idx];
        const currentKey = current.material || 'wood';
        const currentIndex = Math.max(0, materialKeys.indexOf(currentKey));
        const nextKey = materialKeys[(currentIndex + 1) % materialKeys.length] || 'wood';
        mobis[idx] = { ...current, material: nextKey };
        playClick();
        bumpMobiFx(mobis[idx], '🧱', nextKey);
      }
    }

    if (interactPressed) {
      const heldId = next.heldMobiId;
      if (heldId) {
        const idx = mobis.findIndex((m) => m.id === heldId);
        if (idx >= 0) {
          const m = mobis[idx];
          mobis[idx] = {
            ...m,
            vx: clamp(player.vx + player.facing * 160, -520, 520),
            vy: Math.min(player.vy, 0) - 120,
          };
        }
        next.heldMobiId = null;
        playClick();
      } else if (nearestMobiId) {
        const idx = mobis.findIndex((m) => m.id === nearestMobiId);
        if (idx >= 0) {
          const m = mobis[idx];
          const canHold = m.portable && mobisCfg.portableEnabled !== false;
          if (canHold) {
            next.heldMobiId = m.id;
            playClick();
            bumpMobiFx(m, '🧲', 'segurando');
          } else if (m.openable) {
            mobis[idx] = { ...m, open: !m.open };
            playClick();
            bumpMobiFx(mobis[idx], mobis[idx].open ? '🔓' : '🔒', mobis[idx].open ? 'aberto' : 'fechado');
          } else {
            playError();
          }
        }
      }
    }

    const gravityScale = clamp(mobisCfg.gravityScale ?? 1, 0, 2.5);
    const friction = clamp(mobisCfg.friction ?? 0.86, 0.3, 0.98);
    const restitution = clamp(mobisCfg.restitution ?? 0.06, 0, 0.35);

    mobis = mobis.map((m0) => {
      const m = { ...m0 };
      if (!m.movable) return m;
      if (next.heldMobiId === m.id) {
        m.vx = 0;
        m.vy = 0;
        m.x = clamp(player.x + player.facing * (player.w + 12), 0, level.width - m.w);
        m.y = clamp(player.y + 10, 0, level.height - m.h);
        m.resting = false;
        return m;
      }

      const mRect = { x: m.x, y: m.y, w: m.w, h: m.h };
      if (rectsOverlap(pRect, mRect)) {
        const impulse = clamp(player.vx, -260, 260) * 0.55;
        m.vx += impulse / Math.max(0.8, m.mass);
        if (player.vy > 120) m.vy += 160 / Math.max(0.8, m.mass);
      }

      m.vy += BASE_GRAVITY * gravityScale * input.dt;
      m.vy = clamp(m.vy, -900, 1400);

      const rectX = { x: m.x + m.vx * input.dt, y: m.y, w: m.w, h: m.h };
      const hitX = resolveAxisDirectional(rectX, solid, 'x', m.vx);
      m.x = rectX.x;
      if (hitX.hit) {
        if (Math.abs(m.vx) > 80) m.vx = -m.vx * restitution;
        else m.vx = 0;
      }

      const rectY = { x: m.x, y: m.y + m.vy * input.dt, w: m.w, h: m.h };
      const hitY = resolveAxisDirectional(rectY, solid, 'y', m.vy);
      m.y = rectY.y;
      if (hitY.hitDown) {
        if (Math.abs(m.vy) > 260) m.vy = -Math.abs(m.vy) * restitution;
        else m.vy = 0;
        m.vx *= friction;
        if (Math.abs(m.vx) < 3) m.vx = 0;
        m.resting = true;
      } else if (hitY.hitUp) {
        m.vy = 0;
        m.resting = false;
      } else {
        m.resting = false;
      }

      m.x = clamp(m.x, 0, level.width - m.w);
      if (m.y > level.height + 260) {
        m.x = clamp(player.x - 40, 0, level.width - m.w);
        m.y = clamp(player.y - 160, 0, level.height - m.h);
        m.vx = 0;
        m.vy = 0;
      }
      return m;
    });
  }

  next.mobis = mobis;

  const hurt = (reason) => {
    if (nowMs - next.lastHurtMs < 600) return;
    if (player.shield > 0) {
      player.shield = 0;
      next.lastHurtMs = nowMs;
      playError();
      next.message = 'Escudo consumido!';
      return;
    }
    next.lives = Math.max(0, next.lives - 1);
    next.player.hits += 1;
    next.lastHurtMs = nowMs;
    playError();
    if (next.lives <= 0) {
      next.gameOver = true;
      next.message = `Game Over: ${reason}`;
      return;
    }
    next.message = `Cuidado: ${reason}`;
    player.vx = -player.facing * 220;
    player.vy = -380;
  };

  if (editor && flyingCfg.enabled !== false) {
    const spawnRatePerMin = clamp(flyingCfg.spawnRatePerMin || 18, 1, 240);
    const intervalMs = 60000 / spawnRatePerMin;
    const maxCount = clamp(flyingCfg.maxCount || 6, 0, 22);

    const currentCooldown = next.flyingSpawnCooldownMs || 0;
    next.flyingSpawnCooldownMs = Math.max(0, currentCooldown - input.dt * 1000);

    const canSpawn = maxCount > 0 && (next.flyingObstacles?.length || 0) < maxCount;
    if (canSpawn && next.flyingSpawnCooldownMs <= 0) {
      const size = clamp(flyingCfg.size || 44, 26, 92);
      const minY = 110;
      const maxY = Math.max(minY + 20, level.height - 240);
      const xBase = clamp(player.x + (input.viewW || 860) + 220 + randInt(0, 160), 0, level.width - size - 4);
      let spawn = null;
      for (let tries = 0; tries < 10; tries += 1) {
        const y = randInt(minY, Math.floor(maxY));
        const r = { x: xBase, y, w: size, h: size };
        const blocks = solid.some((s) => rectsOverlap(r, s));
        const tooClose = Math.abs((y + size / 2) - pMidY) < 56;
        if (!blocks && !tooClose) {
          spawn = { x: xBase, y };
          break;
        }
      }
      if (spawn) {
        next.flyingObstacles = [...(next.flyingObstacles || []), createFlyingObstacle(spawn, flyingCfg, nowMs)];
        next.flyingSpawnCooldownMs = intervalMs * (0.6 + Math.random() * 0.85);
      } else {
        next.flyingSpawnCooldownMs = intervalMs * 0.35;
      }
    }

    next.flyingObstacles = (next.flyingObstacles || [])
      .map((o0) => {
        const o = { ...o0 };
        const age = nowMs - o.createdAtMs;
        const t = age * o.freq + o.phase;
        let ox = o.x + o.vx * input.dt;
        let oy = o.baseY;
        if (o.pattern === 'sine') oy = o.baseY + Math.sin(t) * o.amp;
        else if (o.pattern === 'zigzag') oy = o.baseY + Math.asin(Math.sin(t)) * (o.amp * 0.9);
        else if (o.pattern === 'orbit') {
          ox += Math.cos(t) * (o.amp * 0.18);
          oy = o.baseY + Math.sin(t) * (o.amp * 0.7);
        }
        o.x = ox;
        o.y = oy;
        const r = { x: o.x, y: o.y, w: o.w, h: o.h };
        if (rectsOverlap(pRect, r)) {
          hurt('obstáculo voador');
          next.fx = [
            ...(next.fx || []),
            {
              id: `${nowMs}-${randInt(0, 1_000_000)}`,
              x: o.x + o.w / 2,
              y: o.y + o.h / 2,
              emoji: '💥',
              text: 'colisão',
              createdAtMs: nowMs,
              ttlMs: 720,
            },
          ];
          return null;
        }
        if (o.x + o.w < -220 || o.x > level.width + 260 || o.y > level.height + 260 || o.y + o.h < -260) return null;
        return o;
      })
      .filter(Boolean);
  } else {
    next.flyingObstacles = next.flyingObstacles || [];
    next.flyingSpawnCooldownMs = next.flyingSpawnCooldownMs || 0;
  }

  for (const h of hazards) {
    if (rectsOverlap(pRect, h)) hurt('obstáculo de lixo');
  }

  for (const p of pollutants) {
    const r = { x: p.x, y: p.y, w: p.w, h: p.h };
    if (rectsOverlap(pRect, r)) hurt('nuvem de poluição');
  }

  next.enemies = next.enemies.map((e) => {
    if (!e.alive) return e;
    const speed = e.vx * e.dir;
    const nx = e.x + speed * input.dt;
    const rect = { x: nx, y: e.y, w: e.w, h: e.h };
    const collidesSolid = solid.some((s) => rectsOverlap(rect, s));
    const hitWall = nx < 0 || nx + e.w > level.width || collidesSolid;
    const eDir = hitWall ? -e.dir : e.dir;
    const x = hitWall ? e.x : nx;

    const eRect = { x, y: e.y, w: e.w, h: e.h };
    if (rectsOverlap(pRect, eRect)) {
      const playerBottom = player.y + player.h;
      const enemyTop = e.y;
      const falling = player.vy > 120;
      const stomp = falling && playerBottom - enemyTop < 28;
      if (stomp) {
        playSuccess();
        player.vy = -480;
        next.player.enemiesDefeated += 1;
        next.levelScore += 12;
        return { ...e, alive: false, x, dir: eDir };
      }
      hurt(e.type === 'smog' ? 'poluição' : 'desperdício');
    }

    return { ...e, x, dir: eDir };
  });

  if (next.boss) {
    const boss = { ...next.boss };
    next.boss = boss;

    const bossRect = { x: boss.x, y: boss.y, w: boss.w, h: boss.h };
    if (rectsOverlap(pRect, bossRect)) {
      const playerBottom = player.y + player.h;
      const falling = player.vy > 140;
      const stomp = falling && playerBottom - boss.y < 34;
      if (stomp && requiredAllCollected && nowMs >= boss.invulnUntilMs) {
        playSuccess();
        boss.hp = Math.max(0, boss.hp - 1);
        boss.invulnUntilMs = nowMs + 800;
        next.levelScore += 40;
        player.vy = -520;
        next.player.enemiesDefeated += 1;
        if (boss.hp <= 0) {
          next.boss = null;
          next.message = 'Chefe derrotado! Vá até a saída.';
          next.messageUntilMs = nowMs + 2600;
        }
      } else {
        hurt('chefão fóssil');
      }
    }

    if (boss && requiredAllCollected) {
      boss.spawnCooldownMs -= input.dt * 1000;
      if (boss.spawnCooldownMs <= 0) {
        boss.spawnCooldownMs = 900 + randInt(0, 450);
        pollutants.push({
          id: `${nowMs}-${Math.random()}`,
          x: boss.x - 10,
          y: boss.y + 30,
          vx: -220 - randInt(0, 140),
          vy: -120 - randInt(0, 120),
          w: 32,
          h: 32,
          lifeMs: 3500,
        });
      }
    }
  }

  next.pollutants = pollutants
    .map((p) => ({
      ...p,
      x: p.x + p.vx * input.dt,
      y: p.y + p.vy * input.dt,
      vy: p.vy + 780 * input.dt,
      lifeMs: p.lifeMs - input.dt * 1000,
    }))
    .filter((p) => p.lifeMs > 0 && p.x + p.w > 0 && p.y < level.height + 200);

  const exitRect = { ...next.exit };
  const allCollected = requiredAllCollected;
  const bossAlive = Boolean(next.boss);
  const exitReady = allCollected && !bossAlive;

  next.efficiency = computeEfficiency(next);

  if (allCollected && !next.completed && !next.gameOver && !next.gameWon) {
    if (bossAlive && !next.message) {
      next.message = 'Itens essenciais completos! Agora derrote o chefe 🏭.';
      next.messageUntilMs = nowMs + 2200;
    } else if (!bossAlive && !next.message && !rectsOverlap(pRect, exitRect)) {
      next.message = 'Itens essenciais completos! Vá até a saída 🚪.';
      next.messageUntilMs = nowMs + 2200;
    }
  }

  if (exitReady && rectsOverlap(pRect, exitRect)) {
    if (next.efficiency < level.efficiencyGoal) {
      next.message = `Eficiência baixa (${next.efficiency}%). Meta: ${level.efficiencyGoal}%.`;
      next.messageUntilMs = nowMs + 2600;
    } else {
      next.completed = true;
      next.totalScore += next.levelScore + next.efficiency;
      next.message = 'Nível completo!';
    }
  }

  const cameraW = Math.max(260, Math.min(level.width, input.viewW || 860));
  const cameraH = Math.max(200, Math.min(level.height, input.viewH || 520));
  const targetX = clamp(player.x + player.w / 2 - cameraW / 2, 0, Math.max(0, level.width - cameraW));
  const targetY = clamp(player.y + player.h / 2 - cameraH / 2, 0, Math.max(0, level.height - cameraH));
  next.cameraX = targetX;
  next.cameraY = targetY;

  return next;
};

const drawSession = (ctx, session, render, palette = PLATFORMER_PALETTES.dark) => {
  const level = LEVELS[session.levelIndex];
  const w = render.sizePx.w;
  const h = render.sizePx.h;
  ctx.clearRect(0, 0, w, h);
  const nowMs = performance.now();

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, palette.bgTop);
  gradient.addColorStop(1, palette.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const camX = session.cameraX;
  const camY = session.cameraY;
  const sx = (x) => x - camX;
  const sy = (y) => y - camY;

  ctx.globalAlpha = 0.8;
  ctx.fillStyle = palette.cloud;
  for (let i = 0; i < 9; i += 1) {
    const bx = ((i * 420 + (camX * 0.15)) % (level.width + 600)) - 300;
    ctx.beginPath();
    ctx.ellipse(sx(bx), sy(level.height - 120), 220, 120, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const p of session.platforms) {
    ctx.fillStyle = p.h >= 70 ? '#14532d' : '#0f3d22';
    ctx.fillRect(sx(p.x), sy(p.y), p.w, p.h);
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx(p.x), sy(p.y), p.w, 2);
    ctx.globalAlpha = 1;
  }

  for (const hz of session.hazards) {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(sx(hz.x), sy(hz.y), hz.w, hz.h);
    ctx.globalAlpha = 1;
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let x = hz.x + 8; x < hz.x + hz.w; x += 16) {
      ctx.fillStyle = '#ef4444';
      ctx.fillText('⚠️', sx(x), sy(hz.y + hz.h / 2));
    }
  }

  ctx.font = '24px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const c of session.collectibles) {
    if (c.taken) continue;
    const emoji = getCollectibleEmoji(c.type);
    const bob = Math.sin((nowMs * 0.004) + c.x * 0.01) * 3;
    const x = sx(c.x);
    const y = sy(c.y + bob);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = palette.tokenBg;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.tokenStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.tokenText;
    ctx.fillText(emoji, x, y + 1);
  }

  for (const m of session.mobis || []) {
    drawMobi3D(ctx, sx, sy, m, Boolean(session.debug?.showColliders), palette);
  }

  for (const e of session.enemies) {
    if (!e.alive) continue;
    const style = getEnemyStyle(e.type);
    const x = sx(e.x + e.w / 2);
    const y = sy(e.y + e.h / 2);
    ctx.font = '22px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = palette.ink;
    ctx.strokeText(style.emoji, x, y);
    ctx.fillStyle = style.color;
    ctx.fillText(style.emoji, x, y);
  }

  for (const o of session.flyingObstacles || []) {
    drawFlyingObstacle3D(ctx, sx, sy, o, nowMs, Boolean(session.debug?.showColliders), palette);
  }

  for (const p of session.pollutants) {
    ctx.font = '18px system-ui';
    ctx.fillStyle = palette.textMuted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💨', sx(p.x + p.w / 2), sy(p.y + p.h / 2));
  }

  if (session.boss) {
    const b = session.boss;
    ctx.font = '28px system-ui';
    ctx.fillStyle = palette.tokenText;
    ctx.fillText('🏭', sx(b.x + b.w / 2), sy(b.y + 44));
    ctx.fillStyle = palette.bossHpBg;
    ctx.fillRect(sx(b.x), sy(b.y - 18), b.w, 10);
    ctx.fillStyle = '#f59e0b';
    const hpW = (b.hp / 3) * b.w;
    ctx.fillRect(sx(b.x), sy(b.y - 18), hpW, 10);
  }

  const exitReady = session.collectibles.filter((c) => c.required !== false).every((c) => c.taken) && !session.boss;
  ctx.fillStyle = exitReady ? '#10b981' : palette.exitIdle;
  ctx.fillRect(sx(session.exit.x), sy(session.exit.y), session.exit.w, session.exit.h);
  ctx.font = '26px system-ui';
  ctx.fillStyle = palette.ink;
  ctx.fillText(exitReady ? '🚪' : '🔒', sx(session.exit.x + session.exit.w / 2), sy(session.exit.y + 36));

  const player = session.player;
  const blink = nowMs - session.lastHurtMs < 500 && Math.floor((nowMs - session.lastHurtMs) / 80) % 2 === 0;
  if (!blink) {
    ctx.font = '22px system-ui';
    ctx.fillStyle = palette.ink;
    ctx.fillText('🦸', sx(player.x + player.w / 2), sy(player.y + player.h / 2));
  }

  if (player.shield > 0) {
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(sx(player.x + player.w / 2), sy(player.y + player.h / 2), 44, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const fx of session.fx || []) {
    const age = nowMs - fx.createdAtMs;
    const t = clamp(age / fx.ttlMs, 0, 1);
    if (t >= 1) continue;
    const alpha = 1 - t;
    const y = fx.y - 38 * t;
    ctx.globalAlpha = alpha;
    ctx.font = '22px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = palette.text;
    ctx.fillText(fx.emoji, sx(fx.x), sy(y));
    ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    ctx.fillText(fx.text, sx(fx.x), sy(y + 22));
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = palette.text;
  ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const time = Math.floor(session.elapsedMs / 1000);
  const mins = Math.floor(time / 60);
  const secs = `${time % 60}`.padStart(2, '0');
  ctx.fillText(`Nível ${session.levelIndex + 1}/5`, 14, 14);
  ctx.fillText(`Tempo ${mins}:${secs}`, 14, 34);
  ctx.fillText(`Vidas ${session.lives}`, 14, 54);
  ctx.fillText(`Eficiência ${session.efficiency}%`, 14, 74);
  const requiredTotal = session.collectibles.filter((c) => c.required !== false).length;
  const requiredTaken = session.collectibles.filter((c) => c.required !== false && c.taken).length;
  ctx.fillText(`Itens essenciais ${requiredTaken}/${requiredTotal}`, 14, 94);
  ctx.fillText(`Bônus Eco +${session.efficiencyBoost || 0}`, 14, 114);
  ctx.fillText(`Score ${session.totalScore + session.levelScore}`, 14, 134);

  ctx.textAlign = 'right';
  const buffs = [];
  if (nowMs < player.solarUntilMs) buffs.push('☀️');
  if (nowMs < player.glideUntilMs) buffs.push('♻️');
  if (player.shield > 0) buffs.push('💧');
  if ((session.efficiencyBoost || 0) > 0) buffs.push('🌍');
  if (buffs.length > 0) ctx.fillText(`Poder ${buffs.join(' ')}`, w - 14, 14);

  if (session.message) {
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = palette.messageBg;
    ctx.fillRect(0, h - 64, w, 64);
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.text;
    ctx.textAlign = 'left';
    ctx.font = '16px system-ui';
    ctx.fillText(session.message, 16, h - 46);
  }
};

const VirtualControls = ({ keysRef }) => {
  const [joyPos, setJoyPos] = useState({ x: 0, y: 0 });
  const activeTouchId = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handleStart = (e) => {
    // Stop propagation to prevent canvas scrolling/focus issues if any
    // e.preventDefault(); // careful with preventing default too aggressively
    if (activeTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouchId.current = touch.identifier;
    startPos.current = { x: touch.clientX, y: touch.clientY };
    setJoyPos({ x: 0, y: 0 });
  };

  const handleMove = (e) => {
    // e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === activeTouchId.current) {
        const dx = t.clientX - startPos.current.x;
        const dy = t.clientY - startPos.current.y;

        // Calc angle and dist
        const max = 40;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(dist, max);
        const angle = Math.atan2(dy, dx);
        const cx = Math.cos(angle) * clampedDist;
        const cy = Math.sin(angle) * clampedDist;

        setJoyPos({ x: cx, y: cy });

        // Thresholds
        const threshold = 10;
        keysRef.current.left = cx < -threshold;
        keysRef.current.right = cx > threshold;
        keysRef.current.down = cy > threshold; // Crouch

        // Optional: Up for jump if desired, but we have a button
        // keysRef.current.jumpHeld = cy < -threshold; 
        return;
      }
    }
  };

  const handleEnd = (e) => {
    // e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId.current) {
        activeTouchId.current = null;
        setJoyPos({ x: 0, y: 0 });
        keysRef.current.left = false;
        keysRef.current.right = false;
        keysRef.current.down = false;
        return;
      }
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-50 flex justify-between items-end p-4 sm:p-8 select-none touch-none md:hidden">
      {/* Joystick Area */}
      <div
        className="w-32 h-32 bg-white/10 rounded-full relative pointer-events-auto backdrop-blur-sm border-2 border-white/20 shadow-xl mb-4"
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      >
        {/* Center indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
        {/* Stick */}
        <div
          className="w-14 h-14 bg-gradient-to-br from-white/60 to-white/20 rounded-full absolute top-1/2 left-1/2 -ml-7 -mt-7 shadow-lg border border-white/40 transition-transform duration-75"
          style={{ transform: `translate(${joyPos.x}px, ${joyPos.y}px)` }}
        />
      </div>

      {/* Buttons Area */}
      <div className="flex gap-4 pointer-events-auto mb-4 items-end">
        {/* Interact Button (B) */}
        <button
          className="w-16 h-16 rounded-full bg-amber-500/80 border-2 border-white/30 active:bg-amber-600 active:scale-95 flex items-center justify-center shadow-lg backdrop-blur-sm mb-4"
          onTouchStart={(e) => { keysRef.current.interactHeld = true; keysRef.current.interactPressed = true; }}
          onTouchEnd={(e) => { keysRef.current.interactHeld = false; }}
        >
          <div className="text-2xl">✋</div>
        </button>

        {/* Jump Button (A) */}
        <button
          className="w-20 h-20 rounded-full bg-eco-green/80 border-2 border-white/30 active:bg-green-600 active:scale-95 flex items-center justify-center shadow-lg backdrop-blur-sm"
          onTouchStart={(e) => { keysRef.current.jumpHeld = true; keysRef.current.jumpPressed = true; }}
          onTouchEnd={(e) => { keysRef.current.jumpHeld = false; }}
        >
          <ArrowUp className="w-8 h-8 text-white stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
const EcoPlatformer = () => {
  const { addScore, updateStat } = useGameState();
  const { theme } = useTheme();
  const palette = useMemo(() => getPlatformerPalette(theme), [theme]);
  const uiRef = useRef('menu');
  const [ui, setUi] = useState('menu');
  const initialSession = useMemo(() => createSession(0, 0), []);
  const sessionRef = useRef(initialSession);
  const [session, setSession] = useState(initialSession);
  const [uiNowMs, setUiNowMs] = useState(0);
  const [best, setBest] = useState(() => {
    const raw = localStorage.getItem('ecoplay.ecoPlatformer.best');
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  });
  const bestRef = useRef(best);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState(() => createEditorState());
  const editorRef = useRef(editor);

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const rafRef = useRef(0);
  const lastMsRef = useRef(0);
  const accumulatorRef = useRef(0);
  const lastHudMsRef = useRef(0);
  const keysRef = useRef({
    left: false,
    right: false,
    down: false,
    run: false,
    jumpHeld: false,
    jumpPressed: false,
    interactHeld: false,
    interactPressed: false,
    colorHeld: false,
    colorPressed: false,
    styleHeld: false,
    stylePressed: false,
  });

  const renderRef = useRef({ sizePx: { w: 860, h: 520 }, dpr: window.devicePixelRatio || 1 });

  const level = useMemo(() => LEVELS[session.levelIndex], [session.levelIndex]);

  const ensureCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = wrapper.getBoundingClientRect();
    const w = clamp(Math.floor(rect.width), 320, 980);
    const h = clamp(Math.floor(rect.height), 260, 640);
    renderRef.current = { sizePx: { w, h }, dpr };
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  useEffect(() => {
    ensureCanvas();
    const onResize = () => ensureCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [ensureCanvas]);

  const reset = useCallback((levelIndex = 0) => {
    lastMsRef.current = 0;
    accumulatorRef.current = 0;
    const next = createSession(levelIndex, 0);
    sessionRef.current = next;
    setSession(next);
    uiRef.current = 'menu';
    setUi('menu');
  }, []);

  const start = useCallback(() => {
    uiRef.current = 'playing';
    setUi('playing');
    const next = {
      ...sessionRef.current,
      startedAtMs: performance.now(),
      paused: false,
      message: null,
      completed: false,
      gameOver: false,
      gameWon: false,
    };
    sessionRef.current = next;
    setSession(next);
  }, []);

  const togglePause = useCallback(() => {
    setUi((prev) => {
      if (prev !== 'playing' && prev !== 'paused') return prev;
      const nextUi = prev === 'playing' ? 'paused' : 'playing';
      uiRef.current = nextUi;
      sessionRef.current = { ...sessionRef.current, paused: nextUi === 'paused' };
      setSession(sessionRef.current);
      return nextUi;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName;
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        Boolean(e.target?.isContentEditable);
      if (!isEditable && (uiRef.current === 'playing' || uiRef.current === 'paused')) {
        const blocksScroll =
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === ' ' ||
          e.key === 'Spacebar';
        if (blocksScroll) e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
      if (e.key === 'Shift') keysRef.current.run = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        if (!keysRef.current.jumpHeld) keysRef.current.jumpPressed = true;
        keysRef.current.jumpHeld = true;
      }
      if (e.key === 'e' || e.key === 'E') {
        if (!keysRef.current.interactHeld) keysRef.current.interactPressed = true;
        keysRef.current.interactHeld = true;
      }
      if (e.key === 'c' || e.key === 'C') {
        if (!keysRef.current.colorHeld) keysRef.current.colorPressed = true;
        keysRef.current.colorHeld = true;
      }
      if (e.key === 'v' || e.key === 'V') {
        if (!keysRef.current.styleHeld) keysRef.current.stylePressed = true;
        keysRef.current.styleHeld = true;
      }
      if (!isEditable && e.key === 'F2') {
        e.preventDefault();
        setEditorOpen((prev) => !prev);
      }
      if (e.key === 'Escape') togglePause();
    };
    const handleKeyUp = (e) => {
      const tag = e.target?.tagName;
      const isEditable =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        Boolean(e.target?.isContentEditable);
      if (!isEditable && (uiRef.current === 'playing' || uiRef.current === 'paused')) {
        const blocksScroll =
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === ' ' ||
          e.key === 'Spacebar';
        if (blocksScroll) e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
      if (e.key === 'Shift') keysRef.current.run = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keysRef.current.jumpHeld = false;
      if (e.key === 'e' || e.key === 'E') keysRef.current.interactHeld = false;
      if (e.key === 'c' || e.key === 'C') keysRef.current.colorHeld = false;
      if (e.key === 'v' || e.key === 'V') keysRef.current.styleHeld = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [togglePause]);

  useEffect(() => {
    bestRef.current = best;
  }, [best]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const handleCompletion = useCallback(
    (nextSession) => {
      if (nextSession.gameOver) {
        if (uiRef.current === 'gameover') return;
        uiRef.current = 'gameover';
        setUi('gameover');
        setSession(nextSession);
        return;
      }
      if (!nextSession.completed) return;
      if (uiRef.current !== 'playing') return;

      const nextLevelIndex = nextSession.levelIndex + 1;
      if (nextLevelIndex >= LEVELS.length) {
        playWin();
        uiRef.current = 'won';
        setUi('won');
        const wonSession = { ...nextSession, gameWon: true };
        sessionRef.current = wonSession;
        setSession(wonSession);

        const finalScore = wonSession.totalScore + wonSession.levelScore;
        addScore(finalScore);
        updateStat('total_games', 1);
        updateStat('games_won', 1);
        if (finalScore > bestRef.current) {
          bestRef.current = finalScore;
          localStorage.setItem('ecoplay.ecoPlatformer.best', String(finalScore));
          setBest(finalScore);
        }

        // Save score
        api.post('/games/score', {
          gameId: 'platformer',
          score: finalScore
        }).catch(err => console.error('Failed to save score:', err));

        return;
      }

      playSuccess();
      uiRef.current = 'level';
      setUi('level');
      sessionRef.current = nextSession;
      setSession(nextSession);
    },
    [addScore, updateStat]
  );

  const goNextLevel = useCallback(() => {
    const next = createSession(sessionRef.current.levelIndex + 1, performance.now());
    sessionRef.current = next;
    setSession(next);
    uiRef.current = 'playing';
    setUi('playing');
  }, []);

  const retryLevel = useCallback(() => {
    const next = createSession(sessionRef.current.levelIndex, performance.now());
    sessionRef.current = next;
    setSession(next);
    uiRef.current = 'playing';
    setUi('playing');
  }, []);

  useEffect(() => {
    const loop = (ms) => {
      rafRef.current = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      if (!lastMsRef.current) lastMsRef.current = ms;
      const delta = ms - lastMsRef.current;
      lastMsRef.current = ms;

      const render = renderRef.current;
      const nowMs = performance.now();

      if (uiRef.current === 'playing') {
        accumulatorRef.current += delta;
        const stepMs = 1000 / 60;
        const maxCatchUp = stepMs * 8;
        accumulatorRef.current = Math.min(accumulatorRef.current, maxCatchUp);

        while (accumulatorRef.current >= stepMs) {
          accumulatorRef.current -= stepMs;
          const keyState = keysRef.current;
          const input = {
            left: keyState.left,
            right: keyState.right,
            down: keyState.down,
            run: keyState.run,
            jumpHeld: keyState.jumpHeld,
            jumpPressed: keyState.jumpPressed,
            interactPressed: keyState.interactPressed,
            colorPressed: keyState.colorPressed,
            stylePressed: keyState.stylePressed,
            editor: editorRef.current,
            dt: stepMs / 1000,
            viewW: render.sizePx.w,
            viewH: render.sizePx.h,
          };
          keysRef.current.jumpPressed = false;
          keysRef.current.interactPressed = false;
          keysRef.current.colorPressed = false;
          keysRef.current.stylePressed = false;
          const next = tickSession(sessionRef.current, input, nowMs);
          sessionRef.current = next;
          handleCompletion(next);
          if (uiRef.current !== 'playing') break;
        }
      } else {
        keysRef.current.jumpPressed = false;
        keysRef.current.interactPressed = false;
        keysRef.current.colorPressed = false;
        keysRef.current.stylePressed = false;
      }

      drawSession(ctx, sessionRef.current, render, palette);

      if (nowMs - lastHudMsRef.current >= 120) {
        lastHudMsRef.current = nowMs;
        setSession(sessionRef.current);
        setUiNowMs(nowMs);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [handleCompletion, palette]);

  const MotionDiv = motion.div;

  const allCollected = session.collectibles.filter((c) => c.required !== false).every((c) => c.taken);
  const exitLocked = !allCollected || Boolean(session.boss);

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/games" className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-theme-bg-secondary/50 px-4 py-2 rounded-full border border-theme-border">
              <Leaf className="w-4 h-4 text-eco-green" />
              <span className="font-mono text-sm">EcoPlatformer</span>
            </div>
            <div className="flex items-center gap-2 bg-theme-bg-secondary/50 px-4 py-2 rounded-full border border-theme-border">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm">Recorde {best}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="relative">
            <div
              ref={wrapperRef}
              className="w-full max-w-[980px] mx-auto aspect-[16/9] rounded-2xl border border-theme-border bg-theme-bg-secondary/30 shadow-2xl overflow-hidden relative touch-none"
            >
              <canvas ref={canvasRef} className="block touch-none select-none w-full h-full" />
              {ui === 'playing' && <VirtualControls keysRef={keysRef} />}
            </div>

            <AnimatePresence>
              {ui !== 'playing' && (
                <MotionDiv
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-0 flex items-center justify-center bg-theme-backdrop p-4"
                >
                  <div className="w-full max-w-lg bg-theme-bg-secondary/80 border border-theme-border rounded-3xl p-6 sm:p-8">
                    <div className="text-center">
                      <div className="text-4xl font-display font-bold mb-2 text-theme-text-primary">{level.name}</div>
                      <div className="text-theme-text-secondary mb-5">{level.tip}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-theme-text-secondary mb-6">
                      <div className="bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-3">
                        <div className="text-theme-text-tertiary mb-1">Movimento</div>
                        <div className="font-mono">← → / A D</div>
                      </div>
                      <div className="bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-3">
                        <div className="text-theme-text-tertiary mb-1">Pular</div>
                        <div className="font-mono">↑ / W / Espaço</div>
                      </div>
                      <div className="bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-3">
                        <div className="text-theme-text-tertiary mb-1">Correr</div>
                        <div className="font-mono">Shift</div>
                      </div>
                      <div className="bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-3">
                        <div className="text-theme-text-tertiary mb-1">Agachar</div>
                        <div className="font-mono">↓ / S</div>
                      </div>
                      <div className="bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-3">
                        <div className="text-theme-text-tertiary mb-1">Interagir</div>
                        <div className="font-mono">E</div>
                      </div>
                      <div className="bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-3">
                        <div className="text-theme-text-tertiary mb-1">Editor</div>
                        <div className="font-mono">F2</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {ui === 'menu' && (
                        <button
                          type="button"
                          onClick={start}
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-eco-green text-slate-900 font-bold hover:bg-green-400 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                          Iniciar Missão
                        </button>
                      )}

                      {ui === 'paused' && (
                        <button
                          type="button"
                          onClick={togglePause}
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                          Continuar
                        </button>
                      )}

                      {ui === 'level' && (
                        <button
                          type="button"
                          onClick={goNextLevel}
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-eco-green text-slate-900 font-bold hover:bg-green-400 transition-colors"
                        >
                          Próximo Nível
                        </button>
                      )}

                      {ui === 'won' && (
                        <button
                          type="button"
                          onClick={() => reset(0)}
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-eco-green text-slate-900 font-bold hover:bg-green-400 transition-colors"
                        >
                          Jogar de Novo
                        </button>
                      )}

                      {ui !== 'menu' && ui !== 'won' && (
                        <button
                          type="button"
                          onClick={retryLevel}
                          className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-theme-bg-tertiary border border-theme-border text-theme-text-primary font-bold hover:bg-theme-bg-secondary transition-colors"
                        >
                          <RotateCcw className="w-5 h-5" />
                          Reiniciar Nível
                        </button>
                      )}
                    </div>

                    {ui === 'won' && (
                      <div className="mt-6 bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-4 text-sm text-theme-text-secondary">
                        <div className="font-bold text-eco-green mb-1">Vitória sustentável!</div>
                        <div>
                          Score final <span className="font-mono">{session.totalScore + session.levelScore}</span> · Eficiência{' '}
                          <span className="font-mono">{session.efficiency}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-theme-bg-secondary/40 border border-theme-border rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-theme-text-secondary font-bold">Objetivos</div>
              <div className="font-mono text-sm text-theme-text-tertiary">{level.id}</div>
            </div>

            <div className="space-y-3 text-sm text-theme-text-secondary">
              <div className="flex items-center justify-between">
                <span>Itens essenciais</span>
                <span className="font-mono">
                  {session.collectibles.filter((c) => c.required !== false && c.taken).length}/
                  {session.collectibles.filter((c) => c.required !== false).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Eficiência mínima</span>
                <span className="font-mono">
                  {level.efficiencyGoal}% ({session.efficiency}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Saída</span>
                <span className="font-mono">{exitLocked ? '🔒' : '🚪'}</span>
              </div>
              {level.boss && (
                <div className="flex items-center justify-between">
                  <span>Chefe final</span>
                  <span className="font-mono">{session.boss ? `HP ${session.boss.hp}` : 'Derrotado'}</span>
                </div>
              )}
            </div>

            <div className="bg-theme-bg-secondary/40 border border-theme-border rounded-2xl p-4 text-sm text-theme-text-secondary">
              <div className="font-bold text-theme-text-primary mb-2">Poderes</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>🔆 Solar</span>
                  <span className="font-mono">{uiNowMs < session.player.solarUntilMs ? 'Ativo' : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🌀 Vento</span>
                  <span className="font-mono">{uiNowMs < session.player.glideUntilMs ? 'Ativo' : '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🔋 Escudo</span>
                  <span className="font-mono">{session.player.shield > 0 ? 'Ativo' : '—'}</span>
                </div>
              </div>
            </div>

            <div className="bg-theme-bg-secondary/40 border border-theme-border rounded-2xl p-4 text-sm text-theme-text-secondary">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-theme-text-primary">Editor</div>
                <button
                  type="button"
                  onClick={() => setEditorOpen((prev) => !prev)}
                  className="px-3 py-1 rounded-xl bg-theme-bg-secondary border border-theme-border text-xs font-mono text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
                >
                  {editorOpen ? 'Fechar' : 'Abrir'} (F2)
                </button>
              </div>
              {editorOpen && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-text-primary font-bold">Obstáculos voadores</span>
                      <label className="inline-flex items-center gap-2">
                        <span className="font-mono text-theme-text-tertiary">ativo</span>
                        <input
                          type="checkbox"
                          checked={editor.flyingObstacles.enabled}
                          onChange={(e) =>
                            setEditor((prev) => ({
                              ...prev,
                              flyingObstacles: { ...prev.flyingObstacles, enabled: e.target.checked },
                            }))
                          }
                        />
                      </label>
                    </div>
                    <label className="block">
                      <div className="flex items-center justify-between">
                        <span>Spawn/min</span>
                        <span className="font-mono text-theme-text-primary">{editor.flyingObstacles.spawnRatePerMin}</span>
                      </div>
                      <input
                        className="w-full"
                        type="range"
                        min={1}
                        max={120}
                        value={editor.flyingObstacles.spawnRatePerMin}
                        onChange={(e) =>
                          setEditor((prev) => ({
                            ...prev,
                            flyingObstacles: { ...prev.flyingObstacles, spawnRatePerMin: Number(e.target.value) },
                          }))
                        }
                      />
                    </label>
                    <label className="block">
                      <div className="flex items-center justify-between">
                        <span>Máx. na tela</span>
                        <span className="font-mono text-theme-text-primary">{editor.flyingObstacles.maxCount}</span>
                      </div>
                      <input
                        className="w-full"
                        type="range"
                        min={0}
                        max={16}
                        value={editor.flyingObstacles.maxCount}
                        onChange={(e) =>
                          setEditor((prev) => ({
                            ...prev,
                            flyingObstacles: { ...prev.flyingObstacles, maxCount: Number(e.target.value) },
                          }))
                        }
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <div className="flex items-center justify-between">
                          <span>Vel mín</span>
                          <span className="font-mono text-theme-text-primary">{editor.flyingObstacles.speedMin}</span>
                        </div>
                        <input
                          className="w-full"
                          type="range"
                          min={80}
                          max={520}
                          value={editor.flyingObstacles.speedMin}
                          onChange={(e) =>
                            setEditor((prev) => ({
                              ...prev,
                              flyingObstacles: { ...prev.flyingObstacles, speedMin: Number(e.target.value) },
                            }))
                          }
                        />
                      </label>
                      <label className="block">
                        <div className="flex items-center justify-between">
                          <span>Vel máx</span>
                          <span className="font-mono text-theme-text-primary">{editor.flyingObstacles.speedMax}</span>
                        </div>
                        <input
                          className="w-full"
                          type="range"
                          min={120}
                          max={760}
                          value={editor.flyingObstacles.speedMax}
                          onChange={(e) =>
                            setEditor((prev) => ({
                              ...prev,
                              flyingObstacles: { ...prev.flyingObstacles, speedMax: Number(e.target.value) },
                            }))
                          }
                        />
                      </label>
                    </div>
                    <label className="block">
                      <div className="flex items-center justify-between">
                        <span>Tamanho</span>
                        <span className="font-mono text-theme-text-primary">{editor.flyingObstacles.size}</span>
                      </div>
                      <input
                        className="w-full"
                        type="range"
                        min={26}
                        max={92}
                        value={editor.flyingObstacles.size}
                        onChange={(e) =>
                          setEditor((prev) => ({
                            ...prev,
                            flyingObstacles: { ...prev.flyingObstacles, size: Number(e.target.value) },
                          }))
                        }
                      />
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editor.flyingObstacles.showColliders}
                        onChange={(e) =>
                          setEditor((prev) => ({
                            ...prev,
                            flyingObstacles: { ...prev.flyingObstacles, showColliders: e.target.checked },
                          }))
                        }
                      />
                      <span className="font-mono text-theme-text-primary">mostrar colisores</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-theme-text-primary font-bold">Mobis</span>
                      <label className="inline-flex items-center gap-2">
                        <span className="font-mono text-theme-text-tertiary">ativo</span>
                        <input
                          type="checkbox"
                          checked={editor.mobis.enabled}
                          onChange={(e) =>
                            setEditor((prev) => ({ ...prev, mobis: { ...prev.mobis, enabled: e.target.checked } }))
                          }
                        />
                      </label>
                    </div>
                    <label className="block">
                      <div className="flex items-center justify-between">
                        <span>Gravidade</span>
                        <span className="font-mono text-theme-text-primary">{editor.mobis.gravityScale.toFixed(2)}</span>
                      </div>
                      <input
                        className="w-full"
                        type="range"
                        min={0}
                        max={2.2}
                        step={0.05}
                        value={editor.mobis.gravityScale}
                        onChange={(e) =>
                          setEditor((prev) => ({ ...prev, mobis: { ...prev.mobis, gravityScale: Number(e.target.value) } }))
                        }
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <div className="flex items-center justify-between">
                          <span>Atrito</span>
                          <span className="font-mono text-theme-text-primary">{editor.mobis.friction.toFixed(2)}</span>
                        </div>
                        <input
                          className="w-full"
                          type="range"
                          min={0.3}
                          max={0.98}
                          step={0.01}
                          value={editor.mobis.friction}
                          onChange={(e) =>
                            setEditor((prev) => ({ ...prev, mobis: { ...prev.mobis, friction: Number(e.target.value) } }))
                          }
                        />
                      </label>
                      <label className="block">
                        <div className="flex items-center justify-between">
                          <span>Quique</span>
                          <span className="font-mono text-theme-text-primary">{editor.mobis.restitution.toFixed(2)}</span>
                        </div>
                        <input
                          className="w-full"
                          type="range"
                          min={0}
                          max={0.35}
                          step={0.01}
                          value={editor.mobis.restitution}
                          onChange={(e) =>
                            setEditor((prev) => ({
                              ...prev,
                              mobis: { ...prev.mobis, restitution: Number(e.target.value) },
                            }))
                          }
                        />
                      </label>
                    </div>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editor.mobis.portableEnabled}
                        onChange={(e) =>
                          setEditor((prev) => ({
                            ...prev,
                            mobis: { ...prev.mobis, portableEnabled: e.target.checked },
                          }))
                        }
                      />
                      <span className="font-mono text-theme-text-primary">permitir segurar</span>
                    </label>
                    <div className="text-theme-text-tertiary font-mono">C troca cor · V troca material · E interage</div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={togglePause}
                disabled={ui !== 'playing' && ui !== 'paused'}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-theme-bg-secondary/60 border border-theme-border text-theme-text-primary hover:bg-theme-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {ui === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {ui === 'playing' ? 'Pausar' : 'Continuar'}
              </button>
              <button
                type="button"
                onClick={() => reset(0)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-theme-bg-secondary/60 border border-theme-border text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const __testables = {
  LEVELS,
  createSession,
  tickSession,
  rectsOverlap,
};

export default EcoPlatformer;

