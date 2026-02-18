import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Leaf, Pause, Play, RotateCcw, Sun, Trophy } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const BEST_SCORE_KEY = 'ecoplay.ecoSnake.bestScore';

const SNAKE_PALETTES = {
  dark: {
    bgStart: '#0b1220',
    bgEnd: '#0f172a',
    grid: 'rgba(148,163,184,0.06)',
    tokenText: 'rgba(255,255,255,0.9)',
    eye: 'rgba(15,23,42,0.8)',
    hudBg: 'rgba(15,23,42,0.95)',
    hudText: '#e2e8f0',
    hudTrack: 'rgba(148,163,184,0.35)',
  },
  light: {
    bgStart: '#ffffff',
    bgEnd: '#f8fafc',
    grid: 'rgba(15,23,42,0.05)',
    tokenText: 'rgba(15,23,42,0.9)',
    eye: 'rgba(15,23,42,0.7)',
    hudBg: 'rgba(255,255,255,0.95)',
    hudText: '#1e293b',
    hudTrack: 'rgba(148,163,184,0.25)',
  },
};

const getSnakePalette = (theme) => SNAKE_PALETTES[theme] || SNAKE_PALETTES.dark;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// --- GBL: LEARNING CONTENT ---
const BIO_ITEMS = [
  { type: 'sun', label: '☀️', name: 'Energia Solar', energy: 30, co2: -5, msg: "Solar: Fonte inesgotável! +30W / -5% CO2" },
  { type: 'wind', label: '🌬️', name: 'Energia Eólica', energy: 25, co2: -5, msg: "Eólica: Sem emissões! +25W / -5% CO2" },
  { type: 'water', label: '💧', name: 'Hidrelétrica', energy: 20, co2: -3, msg: "Hídrica: Poder da água! +20W / -3% CO2" },
  { type: 'bio', label: '🌱', name: 'Biomassa', energy: 15, co2: -2, msg: "Biomassa: Ciclo neutro! +15W / -2% CO2" },
];

const NON_RENEWABLE_ITEMS = [
  { type: 'smoke', label: '💨', name: 'Fumaça (Poluição)', energy: -10, co2: 15, msg: "CUIDADO: Emissões de CO2! +15% Poluição" },
  { type: 'coal', label: '🪨', name: 'Carvão (Fóssil)', energy: 50, co2: 20, msg: "ALERTA: Queima de Carvão! +20% Poluição" },
  { type: 'oil', label: '🛢️', name: 'Petróleo (Fóssil)', energy: 60, co2: 25, msg: "ALERTA: Queima de Petróleo! +25% Poluição" },
];

const TRASH_ITEMS = [
  { type: 'plastic', label: '🧴', name: 'Plástico (Reciclável)', damage: true, msg: "ERRO: Plástico não biodegrada!" },
  { type: 'can', label: '🥤', name: 'Lata (Metal)', damage: true, msg: "ERRO: Metal trava o motor!" },
  { type: 'battery', label: '🔋', name: 'Pilha (Tóxico)', damage: true, msg: "PERIGO: Contaminação Química!" },
];

const EDU_FACTS = [
  'A energia solar é a fonte mais abundante e limpa disponível na Terra.',
  'Turbinas eólicas convertem a energia cinética do vento em eletricidade sem poluir.',
  'Usinas hidrelétricas usam a força da água. No Brasil, são a maior fonte de energia!',
  'Biomassa reaproveita resíduos orgânicos para gerar calor e eletricidade.',
  'Evitar o desperdício de energia é tão importante quanto gerar energia limpa.',
  'Plásticos e metais não são combustíveis limpos; reciclá-los economiza muita energia!',
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const MobileJoystick = ({ onDirection, disabled = false }) => {
  const baseRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeRef = useRef(null);
  const lastDirRef = useRef(null);

  const radius = 34;
  const deadzone = 10;

  const computeDirection = (dx, dy) => {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < deadzone) return null;
    if (absX >= absY) return dx >= 0 ? 'right' : 'left';
    return dy >= 0 ? 'down' : 'up';
  };

  const updateFromEvent = useCallback(
    (e) => {
      const active = activeRef.current;
      const base = baseRef.current;
      if (!active || !base) return;

      const dx = e.clientX - active.centerX;
      const dy = e.clientY - active.centerY;
      const length = Math.hypot(dx, dy) || 0;
      const clamped = length > radius ? radius / length : 1;
      const x = dx * clamped;
      const y = dy * clamped;
      setKnob({ x, y });

      if (disabled) return;
      const dir = computeDirection(dx, dy);
      if (!dir || dir === lastDirRef.current) return;
      lastDirRef.current = dir;
      onDirection?.(dir);
    },
    [disabled, onDirection]
  );

  const handlePointerDown = (e) => {
    if (disabled) return;
    const base = baseRef.current;
    if (!base) return;
    e.preventDefault();
    base.setPointerCapture?.(e.pointerId);
    const rect = base.getBoundingClientRect();
    activeRef.current = { pointerId: e.pointerId, centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 };
    updateFromEvent(e);
  };

  const handlePointerMove = (e) => {
    const active = activeRef.current;
    if (!active || active.pointerId !== e.pointerId) return;
    e.preventDefault();
    updateFromEvent(e);
  };

  const handlePointerUp = (e) => {
    const base = baseRef.current;
    const active = activeRef.current;
    if (!active || active.pointerId !== e.pointerId) return;
    e.preventDefault();
    if (base) base.releasePointerCapture?.(e.pointerId);
    activeRef.current = null;
    lastDirRef.current = null;
    setKnob({ x: 0, y: 0 });
  };

  return (
    <div className="flex items-center justify-center select-none">
      <div
        ref={baseRef}
        className={`relative w-24 h-24 rounded-full border border-slate-700 bg-slate-900/50 backdrop-blur touch-none ${disabled ? 'opacity-40' : 'opacity-100'
          }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="application"
        aria-label="Joystick"
        aria-disabled={disabled ? 'true' : 'false'}
      >
        <div className="absolute inset-3 rounded-full border border-slate-700/70 bg-slate-950/20" />
        <div
          className="absolute left-1/2 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg"
          style={{ transform: `translate3d(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px), 0)` }}
        />
      </div>
    </div>
  );
};

const readBestScore = () => {
  try {
    const raw = window.localStorage.getItem(BEST_SCORE_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
};

const writeBestScore = (score) => {
  try {
    window.localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // ignore
  }
};

const randomInt = (minInclusive, maxExclusive) =>
  Math.floor(Math.random() * (maxExclusive - minInclusive)) + minInclusive;

const pickOne = (items) => items[randomInt(0, items.length)];

const keyForCell = (x, y) => `${x},${y}`;

const isOpposite = (a, b) => a.x === -b.x && a.y === -b.y;

const sampleEmptyCell = ({ gridSize, snake, obstacles, item, recyclables }) => {
  const blocked = new Set();
  for (const segment of snake) blocked.add(keyForCell(segment.x, segment.y));
  for (const obstacle of obstacles) blocked.add(keyForCell(obstacle.x, obstacle.y));
  if (item) blocked.add(keyForCell(item.x, item.y));
  for (const r of recyclables) blocked.add(keyForCell(r.x, r.y));

  const maxAttempts = gridSize * gridSize;
  for (let i = 0; i < maxAttempts; i += 1) {
    const x = randomInt(0, gridSize);
    const y = randomInt(0, gridSize);
    if (!blocked.has(keyForCell(x, y))) return { x, y };
  }
  return null;
};

const createInitialState = ({ gridSize }) => {
  const center = Math.floor(gridSize / 2);
  const snake = [
    { x: center - 1, y: center },
    { x: center - 2, y: center },
    { x: center - 3, y: center },
  ];

  return {
    gridSize,
    snake,
    direction: DIRECTIONS.right,
    queuedDirection: DIRECTIONS.right,
    score: 0,
    foodsEaten: 0,
    level: 1,
    streak: 0,
    lastCollectAt: 0,
    solarBoostUntil: 0,
    item: null,
    recyclables: [],
    challenge: { active: false, deadline: 0, remaining: 0 },
    obstacles: [],
    gameOver: false,
    co2Level: 0, // 0 to 100
  };
};

const computeEcoMultiplier = (state, nowMs) => {
  const streakBonus = Math.min(0.75, Math.floor(state.streak / 5) * 0.25);
  const solarBonus = nowMs < state.solarBoostUntil ? 1 : 0;
  return (1 + streakBonus) * (solarBonus ? 2 : 1);
};

const computeStepMs = (level) => clamp(128 - level * 6, 72, 128);

const makeRandomObstacle = (gridSize) => {
  const itemConfig = pickOne(TRASH_ITEMS);
  const x = randomInt(0, gridSize);
  const y = randomInt(0, gridSize);
  return { x, y, ...itemConfig, isTrash: true };
};

const makeRandomNonRenewable = (gridSize) => {
  const itemConfig = pickOne(NON_RENEWABLE_ITEMS);
  const x = randomInt(0, gridSize);
  const y = randomInt(0, gridSize);
  return { x, y, ...itemConfig, isPollutant: true };
};

const spawnItem = (state) => {
  if (state.challenge.active) return state;

  // Pick a random BIO item (Good)
  const itemConfig = pickOne(BIO_ITEMS);
  const pos = sampleEmptyCell(state);
  if (!pos) return state;

  // Spawn polluted item chance (increases with level)
  const pollutionChance = Math.min(0.4, state.level * 0.05);
  let extraItem = state.extraItem;

  if (!extraItem && Math.random() < pollutionChance) {
    const candidate = makeRandomNonRenewable(state.gridSize);
    const pos = sampleEmptyCell({ ...state, item: { ...itemConfig, ...pos, isTrash: false } });
    if (pos) {
      extraItem = { ...candidate, ...pos };
    }
  }

  return {
    ...state,
    item: { ...itemConfig, ...pos, isTrash: false },
    extraItem, // Secondary item (Pollutant)
  };
};

const spawnRecyclablesChallenge = (state, nowMs) => {
  const next = { ...state };
  next.item = null;
  next.challenge = { active: true, deadline: nowMs + 10000, remaining: 3 };
  next.recyclables = [];
  for (let i = 0; i < 3; i += 1) {
    const pos = sampleEmptyCell({ ...next, recyclables: next.recyclables });
    if (!pos) break;
    next.recyclables.push({ type: 'recyclable', ...pos });
  }
  next.challenge.remaining = next.recyclables.length;
  return next;
};

const maybeAddObstacleOnLevel = (state, nextLevel) => {
  if (nextLevel <= state.level) return state;
  const next = { ...state, level: nextLevel };
  const obstacleCountToAdd = nextLevel - state.level;
  for (let i = 0; i < obstacleCountToAdd; i += 1) {
    const candidate = makeRandomObstacle(next.gridSize);
    const pos = sampleEmptyCell({
      ...next,
      item: candidate,
      recyclables: [],
      extraItem: next.extraItem || null,
    });
    if (!pos) continue;
    next.obstacles = [...next.obstacles, { ...candidate, ...pos }];
  }
  return next;
};

const applyCollect = (state, collectedItem, nowMs) => {
  const next = { ...state };
  const streakContinues = nowMs - next.lastCollectAt <= 3000;
  next.streak = streakContinues ? next.streak + 1 : 1;
  next.lastCollectAt = nowMs;

  const ecoMultiplier = computeEcoMultiplier(next, nowMs);

  if (collectedItem.energy) {
    next.score += Math.round(collectedItem.energy * ecoMultiplier);
    if (!collectedItem.isPollutant) {
      next.foodsEaten += 1;
    }

    // CO2 Dynamics
    if (collectedItem.co2) {
      next.co2Level = clamp(next.co2Level + collectedItem.co2, 0, 100);
    }

    const type = collectedItem.isPollutant ? 'bad' : 'good';
    next.lastFeedback = { msg: collectedItem.msg, type, time: nowMs };
  }

  // Level progression based on items collected
  const nextLevel = 1 + Math.floor(next.foodsEaten / 5);
  const withLevel = maybeAddObstacleOnLevel(next, nextLevel);
  return spawnItem(withLevel);
};

const tick = (state, nowMs) => {
  if (state.gameOver) return state;

  if (state.challenge.active && nowMs >= state.challenge.deadline) {
    const next = { ...state };
    next.score = Math.max(0, next.score - 20);
    next.streak = 0;
    next.challenge = { active: false, deadline: 0, remaining: 0 };
    next.recyclables = [];
    return spawnItem(next);
  }

  const nextDir = state.queuedDirection;
  const head = state.snake[0];
  const nextHead = { x: head.x + nextDir.x, y: head.y + nextDir.y };

  if (
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize
  ) {
    return { ...state, gameOver: true };
  }

  const eatingItem = state.item && state.item.x === nextHead.x && state.item.y === nextHead.y;
  const eatingExtra = state.extraItem && state.extraItem.x === nextHead.x && state.extraItem.y === nextHead.y;
  const recyclableIndex = state.recyclables.findIndex((r) => r.x === nextHead.x && r.y === nextHead.y);
  const eatingRecyclable = recyclableIndex !== -1;

  const grows = eatingItem || eatingRecyclable || eatingExtra;
  const snakeSet = new Set(state.snake.map((s) => keyForCell(s.x, s.y)));
  const nextHeadKey = keyForCell(nextHead.x, nextHead.y);
  const tailKey = keyForCell(
    state.snake[state.snake.length - 1].x,
    state.snake[state.snake.length - 1].y
  );

  const hitsSelf = snakeSet.has(nextHeadKey) && (grows || nextHeadKey !== tailKey);
  if (hitsSelf) return { ...state, gameOver: true };

  const obstacleSet = new Set(state.obstacles.map((o) => keyForCell(o.x, o.y)));
  if (obstacleSet.has(nextHeadKey)) return { ...state, gameOver: true };

  const nextSnake = [nextHead, ...state.snake];
  if (!grows) nextSnake.pop();

  let nextState = {
    ...state,
    snake: nextSnake,
    direction: nextDir,
  };

  if (eatingItem) {
    const collectedItem = state.item;
    nextState.item = null;
    nextState = applyCollect(nextState, collectedItem, nowMs);
  } else if (eatingExtra) {
    const collectedItem = state.extraItem;
    nextState.extraItem = null;
    nextState = applyCollect(nextState, collectedItem, nowMs);
  } else if (eatingRecyclable) {
    // Legacy or Challenge Mode support if maintained
    // ...
  }

  return nextState;
};

const draw = (ctx, state, render, nowMs, palette = SNAKE_PALETTES.dark) => {
  const { sizePx, dpr } = render;
  const gridSize = state.gridSize;
  const cellPx = sizePx / gridSize;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, sizePx, sizePx);

  // Background
  const gradient = ctx.createLinearGradient(0, 0, sizePx, sizePx);
  gradient.addColorStop(0, palette.bgStart);
  gradient.addColorStop(1, palette.bgEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, sizePx, sizePx);

  // Grid (fade out if CO2 is high)
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  const visibility = Math.max(0.1, 1 - (state.co2Level / 80));
  ctx.globalAlpha = visibility;

  for (let i = 0; i <= gridSize; i += 1) {
    const p = Math.floor(i * cellPx) + 0.5;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, sizePx);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(sizePx, p);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;



  const drawToken = (xCell, yCell, color, text) => {
    const x = xCell * cellPx;
    const y = yCell * cellPx;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(x + 1, y + 1, cellPx - 2, cellPx - 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = palette.tokenText;
    ctx.font = `${Math.floor(cellPx * 0.72)}px system-ui, Segoe UI Emoji`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + cellPx / 2, y + cellPx / 2 + 1);
  };

  for (const obstacle of state.obstacles) {
    drawToken(obstacle.x, obstacle.y, '#ef4444', obstacle.label);
  }

  if (state.extraItem) {
    drawToken(state.extraItem.x, state.extraItem.y, '#f59e0b', state.extraItem.label);
  }

  if (state.item) {
    drawToken(state.item.x, state.item.y, '#22c55e', state.item.label);
  }

  for (const r of state.recyclables) {
    drawToken(r.x, r.y, '#38bdf8', '🧴');
  }

  const snake = state.snake;
  for (let i = snake.length - 1; i >= 0; i -= 1) {
    const segment = snake[i];
    const x = segment.x * cellPx;
    const y = segment.y * cellPx;
    const isHead = i === 0;
    ctx.fillStyle = isHead ? '#22c55e' : 'rgba(34,197,94,0.72)';
    ctx.fillRect(x + 1, y + 1, cellPx - 2, cellPx - 2);
    if (isHead) {
      ctx.fillStyle = palette.eye;
      ctx.fillRect(x + cellPx * 0.25, y + cellPx * 0.3, cellPx * 0.16, cellPx * 0.16);
      ctx.fillRect(x + cellPx * 0.6, y + cellPx * 0.3, cellPx * 0.16, cellPx * 0.16);
    }
  }

  if (state.challenge.active) {
    const remainingMs = Math.max(0, state.challenge.deadline - nowMs);
    const t = remainingMs / 10000;
    ctx.fillStyle = palette.hudBg;
    ctx.fillRect(0, 0, sizePx, Math.max(28, cellPx * 0.9));
    ctx.fillStyle = palette.hudText;
    ctx.font = `${Math.floor(cellPx * 0.58)}px system-ui`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Desafio ♻️: faltam ${state.challenge.remaining}`, 10, Math.max(14, cellPx * 0.45));
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(sizePx * 0.55, 8, sizePx * 0.4 * t, 6);
    ctx.fillStyle = palette.hudTrack;
    ctx.fillRect(sizePx * 0.55 + sizePx * 0.4 * t, 8, sizePx * 0.4 * (1 - t), 6);
  }

  // Smog Overlay (CO2 Effect)
  if (state.co2Level > 0) {
    const opacity = Math.min(0.85, state.co2Level / 100);
    ctx.fillStyle = `rgba(30, 20, 10, ${opacity})`;
    ctx.fillRect(0, 0, sizePx, sizePx);
  }
};

const formatMultiplier = (value) => `${value.toFixed(value % 1 === 0 ? 0 : 2)}x`;

const EcoSnake = () => {
  const { theme } = useTheme();
  const palette = useMemo(() => getSnakePalette(theme), [theme]);
  const [uiState, setUiState] = useState('menu');
  const [tip, setTip] = useState(() => pickOne(EDU_FACTS));
  const [bestScore, setBestScore] = useState(() => readBestScore());
  const [hud, setHud] = useState({
    score: 0,
    level: 1,
    length: 3,
    multiplier: 1,
    stepMs: 128,
    challengeRemaining: 0,
    challengeMs: 0,
    solarMs: 0,
    co2Level: 0,
  });

  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const renderRef = useRef({ sizePx: 420, dpr: window.devicePixelRatio || 1 });
  const stateRef = useRef(null);
  const rafRef = useRef(0);
  const lastFrameMsRef = useRef(0);
  const accumulatorMsRef = useRef(0);
  const lastHudMsRef = useRef(0);
  const uiStateRef = useRef(uiState);

  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);

  const initialGridSize = 22;

  const syncCanvasSize = () => {
    const canvas = canvasRef.current;
    const wrapper = canvasWrapperRef.current;
    if (!canvas || !wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const sizePx = Math.floor(Math.min(rect.width, rect.height));
    const dpr = window.devicePixelRatio || 1;
    renderRef.current = { sizePx, dpr };
    canvas.width = Math.floor(sizePx * dpr);
    canvas.height = Math.floor(sizePx * dpr);
    canvas.style.width = `${sizePx}px`;
    canvas.style.height = `${sizePx}px`;
  };

  useEffect(() => {
    syncCanvasSize();
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return undefined;
    const ro = new ResizeObserver(() => syncCanvasSize());
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  const hydrateHud = useCallback((state, nowMs) => {
    const ecoMultiplier = computeEcoMultiplier(state, nowMs);
    const stepMs = computeStepMs(state.level);
    const challengeMs = state.challenge.active ? Math.max(0, state.challenge.deadline - nowMs) : 0;
    const solarMs = Math.max(0, state.solarBoostUntil - nowMs);

    setHud({
      score: state.score,
      level: state.level,
      length: state.snake.length,
      multiplier: ecoMultiplier,
      stepMs,
      challengeRemaining: state.challenge.remaining,
      challengeMs,
      solarMs,
      co2Level: state.co2Level,
    });
  }, []);

  const ensureState = useCallback(() => {
    if (stateRef.current) return;
    const base = createInitialState({ gridSize: initialGridSize });
    stateRef.current = spawnItem(base);
  }, [initialGridSize]);

  const resetGame = () => {
    const base = createInitialState({ gridSize: initialGridSize });
    stateRef.current = spawnItem(base);
    setTip(pickOne(EDU_FACTS));
    setUiState('menu');
    hydrateHud(stateRef.current, 0);
  };

  useEffect(() => {
    ensureState();
    hydrateHud(stateRef.current, performance.now());
    return () => cancelAnimationFrame(rafRef.current);
  }, [ensureState, hydrateHud]);

  const queueDirection = (dirKey) => {
    const state = stateRef.current;
    if (!state) return;
    const next = DIRECTIONS[dirKey];
    const current = state.direction;
    if (state.snake.length > 1 && isOpposite(current, next)) return;
    state.queuedDirection = next;
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (uiStateRef.current === 'menu') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') queueDirection('up');
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') queueDirection('down');
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') queueDirection('left');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') queueDirection('right');
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setUiState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      }
      if (e.key === 'Enter' && (uiStateRef.current === 'menu' || uiStateRef.current === 'gameover')) {
        e.preventDefault();
        setUiState('playing');
      }
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && uiStateRef.current === 'playing') setUiState('paused');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let start = null;
    const onPointerDown = (e) => {
      start = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < 22) return;
      if (absX > absY) queueDirection(dx > 0 ? 'right' : 'left');
      else queueDirection(dy > 0 ? 'down' : 'up');
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', () => {
      start = null;
    });
    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  useEffect(() => {
    const loop = (frameMs) => {
      rafRef.current = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ensureState();
      const state = stateRef.current;
      const render = renderRef.current;
      const nowMs = performance.now();

      if (!lastFrameMsRef.current) lastFrameMsRef.current = frameMs;
      const delta = frameMs - lastFrameMsRef.current;
      lastFrameMsRef.current = frameMs;

      const shouldUpdate = uiStateRef.current === 'playing';
      if (shouldUpdate && state && !state.gameOver) {
        accumulatorMsRef.current += delta;
        const stepMs = computeStepMs(state.level);
        const maxCatchUp = stepMs * 5;
        accumulatorMsRef.current = Math.min(accumulatorMsRef.current, maxCatchUp);
        while (accumulatorMsRef.current >= stepMs) {
          accumulatorMsRef.current -= stepMs;
          const next = tick(stateRef.current, nowMs);
          stateRef.current = next;
          if (next.gameOver) {
            setUiState('gameover');
            if (next.score > bestScore) {
              writeBestScore(next.score);
              setBestScore(next.score);
            }
            setTip(pickOne(EDU_FACTS));
            break;
          }
        }
      }

      draw(ctx, stateRef.current, render, nowMs, palette);

      if (nowMs - lastHudMsRef.current >= 120) {
        lastHudMsRef.current = nowMs;
        hydrateHud(stateRef.current, nowMs);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [bestScore, ensureState, hydrateHud, palette]);

  const startPlaying = () => {
    ensureState();
    setTip(pickOne(EDU_FACTS));
    setUiState('playing');
  };

  const restart = () => {
    const base = createInitialState({ gridSize: stateRef.current?.gridSize ?? initialGridSize });
    stateRef.current = spawnItem(base);
    setTip(pickOne(EDU_TIPS));
    accumulatorMsRef.current = 0;
    lastFrameMsRef.current = 0;
    setUiState('playing');
    hydrateHud(stateRef.current, 0);
  };

  const togglePause = () => {
    setUiState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
  };

  const overlayTitle = uiState === 'menu' ? 'Eco Snake' : uiState === 'paused' ? 'Pausado' : 'Fim de Jogo';
  const overlayPrimary =
    uiState === 'menu'
      ? { label: 'Jogar', onClick: startPlaying, icon: <Play className="w-5 h-5" /> }
      : uiState === 'paused'
        ? { label: 'Continuar', onClick: togglePause, icon: <Play className="w-5 h-5" /> }
        : { label: 'Jogar Novamente', onClick: restart, icon: <RotateCcw className="w-5 h-5" /> };

  const nowMs = typeof performance !== 'undefined' ? performance.now() : 0;

  return (
    <div className="min-h-screen bg-theme-bg-primary text-theme-text-primary px-4 py-6 md:py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            to="/games"
            className="inline-flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-theme-bg-secondary/50 border border-theme-border">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm">
                Max Energia <span className="text-theme-text-primary">{bestScore} W</span>
              </span>
            </div>

            {/* CO2 Meter */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-theme-bg-secondary/50 border border-theme-border">
              <span className="text-sm">☁️ CO₂</span>
              <div className="w-24 h-3 bg-gray-700 rounded-full overflow-hidden relative border border-gray-600">
                <div
                  className={`h-full transition-all duration-500 ${hud.co2Level > 70 ? 'bg-red-500' : hud.co2Level > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${hud.co2Level}%` }}
                />
              </div>
              <span className="text-xs font-mono w-8 text-right">{hud.co2Level}%</span>
            </div>

            <button
              type="button"
              onClick={togglePause}
              disabled={uiState === 'menu' || uiState === 'gameover'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-bg-secondary/50 border border-theme-border text-theme-text-primary hover:bg-theme-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {uiState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{uiState === 'playing' ? 'Pausar' : 'Continuar'}</span>
            </button>

            <button
              type="button"
              onClick={resetGame}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-bg-secondary/50 border border-theme-border text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="relative">
            <div
              ref={canvasWrapperRef}
              className="w-full max-w-[560px] mx-auto aspect-square rounded-2xl border border-theme-border bg-theme-bg-secondary/30 shadow-2xl overflow-hidden"
            >
              <canvas ref={canvasRef} className="block touch-none select-none" />
            </div>

            <AnimatePresence>
              {uiState !== 'playing' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute inset-0 flex items-center justify-center px-4"
                >
                  <div className="w-full max-w-md bg-theme-bg-secondary/95 backdrop-blur-xl border border-theme-border rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-eco-green/15 text-eco-green flex items-center justify-center">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-display font-bold text-theme-text-primary">{overlayTitle}</h1>
                        <div className="text-sm text-theme-text-secondary">
                          Energia <span className="text-theme-text-primary font-mono">{hud.score} W</span>
                          <span className="text-theme-text-tertiary mx-2">•</span>
                          Recorde <span className="text-theme-text-primary font-mono">{bestScore}</span>
                          <span className="text-theme-text-tertiary mx-2">•</span>
                          CO₂ <span className={`${hud.co2Level > 70 ? 'text-red-400' : 'text-green-400'} font-mono`}>{hud.co2Level}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 mb-4 h-16 justify-center">
                      {stateRef.current?.lastFeedback && (nowMs - stateRef.current.lastFeedback.time < 3000) ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={stateRef.current.lastFeedback.time}
                          className={`px-4 py-2 rounded-xl border backdrop-blur-sm text-sm font-bold shadow-lg
                                ${stateRef.current.lastFeedback.type === 'good'
                              ? 'bg-green-500/20 border-green-500/50 text-green-200'
                              : 'bg-red-500/20 border-red-500/50 text-red-200'}`}
                        >
                          {stateRef.current.lastFeedback.msg}
                        </motion.div>
                      ) : (
                        <div className="text-theme-text-secondary text-center text-sm italic">{tip}</div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={overlayPrimary.onClick}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-eco-green text-slate-900 font-bold hover:bg-green-400 transition-colors"
                      >
                        {overlayPrimary.icon}
                        {overlayPrimary.label}
                      </button>

                      <Link
                        to="/games"
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-theme-bg-tertiary text-theme-text-primary font-bold border border-theme-border hover:bg-theme-bg-secondary transition-colors"
                      >
                        Voltar ao Arcade
                      </Link>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-theme-text-tertiary">
                      <div className="bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-3">
                        <div className="text-theme-text-secondary mb-1">Controles</div>
                        <div className="font-mono">↑ ↓ ← → / WASD</div>
                      </div>
                      <div className="bg-theme-bg-secondary/50 border border-theme-border rounded-2xl p-3">
                        <div className="text-theme-text-secondary mb-1">Mobile</div>
                        <div className="font-mono">Swipe ou joystick</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-center md:hidden">
              <MobileJoystick disabled={uiState !== 'playing'} onDirection={queueDirection} />
            </div>
          </div>

          <div className="bg-theme-bg-secondary/40 border border-theme-border rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-theme-text-secondary text-sm">Pontuação</div>
              <div className="text-2xl font-mono font-bold text-theme-text-primary">{hud.score}</div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-theme-bg-secondary/60 border border-theme-border rounded-2xl p-3">
                <div className="text-theme-text-secondary text-xs mb-1">Nível</div>
                <div className="font-mono text-lg text-theme-text-primary">{hud.level}</div>
              </div>
              <div className="bg-theme-bg-secondary/60 border border-theme-border rounded-2xl p-3">
                <div className="text-theme-text-secondary text-xs mb-1">Tamanho</div>
                <div className="font-mono text-lg text-theme-text-primary">{hud.length}</div>
              </div>
              <div className="bg-theme-bg-secondary/60 border border-theme-border rounded-2xl p-3">
                <div className="text-theme-text-secondary text-xs mb-1">Veloc.</div>
                <div className="font-mono text-lg text-theme-text-primary">{Math.round(1000 / hud.stepMs)}/s</div>
              </div>
            </div>

            <div className="bg-theme-bg-secondary/60 border border-theme-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-theme-text-primary font-bold">Bônus sustentável</div>
                <div className="font-mono text-theme-text-secondary">{formatMultiplier(hud.multiplier)}</div>
              </div>
              <div className="flex items-center gap-3 text-sm text-theme-text-secondary">
                <Sun className={`w-4 h-4 ${hud.solarMs > 0 ? 'text-amber-300' : 'text-theme-text-tertiary'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>Energia solar</span>
                    <span className="font-mono">{hud.solarMs > 0 ? `${Math.ceil(hud.solarMs / 1000)}s` : '—'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3 text-sm text-theme-text-secondary">
                <Leaf className={`w-4 h-4 ${hud.multiplier > 1 ? 'text-eco-green' : 'text-theme-text-tertiary'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>Sequência eco</span>
                    <span className="font-mono">{hud.multiplier > 1 ? 'Ativa' : '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-theme-bg-secondary/60 border border-theme-border rounded-2xl p-4">
              <div className="text-theme-text-primary font-bold mb-2">Objetivos</div>
              <div className="space-y-2 text-sm text-theme-text-secondary">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-base">🍎</span>
                    Orgânicos (+)
                  </span>
                  <span className="font-mono">+10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-base">🥕</span>
                    Locais (+)
                  </span>
                  <span className="font-mono">+15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-base">☀️</span>
                    Solar (bônus)
                  </span>
                  <span className="font-mono">x2</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-base">♻️</span>
                    Desafio
                  </span>
                  <span className="font-mono">
                    {hud.challengeMs > 0 ? `${hud.challengeRemaining} / ${Math.ceil(hud.challengeMs / 1000)}s` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-theme-border bg-theme-bg-secondary/60 p-4 text-sm text-theme-text-secondary">
            Evite áreas de poluição, desmatamento e plástico. Cada nível adiciona novos obstáculos.
          </div>

          <div className="sm:hidden flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-sm">
                Recorde <span className="text-white">{bestScore}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={() => queueDirection('up')}
              className="col-start-2 px-3 py-3 rounded-2xl bg-theme-bg-secondary border border-theme-border hover:bg-theme-bg-tertiary transition-colors"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => queueDirection('left')}
              className="px-3 py-3 rounded-2xl bg-theme-bg-secondary border border-theme-border hover:bg-theme-bg-tertiary transition-colors"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => queueDirection('down')}
              className="px-3 py-3 rounded-2xl bg-theme-bg-secondary border border-theme-border hover:bg-theme-bg-tertiary transition-colors"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => queueDirection('right')}
              className="px-3 py-3 rounded-2xl bg-theme-bg-secondary border border-theme-border hover:bg-theme-bg-tertiary transition-colors"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcoSnake;
