// Utilitário para efeitos sonoros usando Web Audio API
// Evita a necessidade de arquivos de áudio externos

let audioContext = null;

const getAudioContext = () => {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioContext = new AudioContext();
    }
  }
  return audioContext;
};

const playTone = (freq, type, duration, vol = 0.1) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => { });
  }

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio play failed', e);
  }
};

export const playClick = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => { });

  // Mechanical Click (Neutral) - Same tech as Switch
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000; // Neutral click tone

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
};

export const playSelect = () => {
  playTone(400, 'sine', 0.1, 0.05);
};

export const playToggle = () => {
  playTone(600, 'sine', 0.15, 0.06);
};

export const playError = () => {
  // Som de erro (grave e dissonante)
  playTone(150, 'sawtooth', 0.3, 0.1);
  setTimeout(() => playTone(120, 'sawtooth', 0.3, 0.1), 100);
};

export const playSuccess = () => {
  // Acorde maior simples (C major ish)
  playTone(523.25, 'sine', 0.3, 0.1); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.3, 0.1), 100); // E5
};

export const playWin = () => {
  // Fanfarra simples
  const notes = [
    { f: 523.25, t: 0 },    // C5
    { f: 659.25, t: 0.15 }, // E5
    { f: 783.99, t: 0.30 }, // G5
    { f: 1046.50, t: 0.45 },// C6
    { f: 783.99, t: 0.60 }, // G5
    { f: 1046.50, t: 0.75 } // C6
  ];

  notes.forEach(({ f, t }) => {
    setTimeout(() => playTone(f, 'square', 0.2, 0.05), t * 1000);
  });
};

export const playHover = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => { });

  // "Airy" Swipe Sound for Hover
  const bufferSize = ctx.sampleRate * 0.04;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Bandpass filter to isolate "high mid" frequencies (Airy feel)
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2500;
  filter.Q.value = 1.0;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
};

export const playNavigation = () => {
  // Som de navegação distinto (futurista)
  // Tom duplo ascendente rápido
  playTone(600, 'sine', 0.1, 0.1);
  setTimeout(() => playTone(900, 'sine', 0.15, 0.1), 50);
};

export const playCelebration = () => {
  // Melodia de comemoração (Triade maior ascendente com final brilhante)
  const notes = [
    { f: 523.25, t: 0, d: 0.1 },    // C5
    { f: 659.25, t: 0.1, d: 0.1 },  // E5
    { f: 783.99, t: 0.2, d: 0.1 },  // G5
    { f: 1046.50, t: 0.3, d: 0.4 }  // C6 (longa)
  ];

  notes.forEach(({ f, t, d }) => {
    setTimeout(() => playTone(f, 'triangle', d, 0.15), t * 1000);
  });
};

export const playBuild = () => {
  // Som de construção (mecânico/martelo)
  playTone(200, 'square', 0.1, 0.1);
  setTimeout(() => playTone(300, 'square', 0.1, 0.1), 100);
};

export const playCollect = () => {
  // Som de coleta de energia (mágico/agudo)
  playTone(880, 'sine', 0.2, 0.1);
  setTimeout(() => playTone(1760, 'sine', 0.2, 0.05), 50);
};

export const playWarning = () => {
  // Alerta de perigo (sirene leve)
  playTone(400, 'sawtooth', 0.3, 0.1);
  setTimeout(() => playTone(300, 'sawtooth', 0.3, 0.1), 300);
};

export const playMagicPop = () => {
  // "Pop" suave (bolha)
  playTone(200, 'sine', 0.05, 0.2);

  // "Brilho" (agudo e rápido)
  setTimeout(() => playTone(1200, 'sine', 0.1, 0.1), 50);
  setTimeout(() => playTone(1600, 'sine', 0.1, 0.08), 100);
  setTimeout(() => playTone(2000, 'sine', 0.2, 0.05), 150);
};


export const playStart = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => { });

  // High-Tech Confirm (Crisp Start)
  const t = ctx.currentTime;

  // Oscillator 1: Main tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.frequency.setValueAtTime(880, t);
  osc1.frequency.exponentialRampToValueAtTime(0.01, t + 0.2);
  gain1.gain.setValueAtTime(0.2, t);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);

  // Oscillator 2: Harmonics/Chirp
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(1760, t);
  osc2.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
  gain2.gain.setValueAtTime(0.1, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);

  osc1.start(t);
  osc1.stop(t + 0.2);
  osc2.start(t);
  osc2.stop(t + 0.1);
};

export const playAmbience = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => { });

  // Subtle "Tech Swell" Entrance
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, t); // Low hum

  // Swell envelope (Fade in -> Fade out)
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.1, t + 0.5); // Attack
  gain.gain.linearRampToValueAtTime(0, t + 2.5);   // Long Decay

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(t);
  osc.stop(t + 2.5);
};

export const playLightSwitch = (isDark = false) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => { });

  // Creates a "Mechanical Switch" sound using filtered noise (Haptic feel)
  const bufferSize = ctx.sampleRate * 0.05; // 50ms (very short)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // White noise generation
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Filter: Lowpass to remove "hiss" and keep the "click/thud"
  // Dark mode = Lower freq (Thud), Light mode = Higher freq (Click)
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = isDark ? 600 : 1200;

  const gain = ctx.createGain();
  // Increased volume as requested
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start();
};

export const playStamp = () => {
  // Som de carimbo (impacto seco e grave)
  playTone(150, 'square', 0.05, 0.3);
  setTimeout(() => playTone(100, 'sawtooth', 0.1, 0.2), 20);
};

export const playRouletteTick = () => {
  // Blip curto e agudo (tipo roda da fortuna)
  playTone(800, 'triangle', 0.05, 0.1);
};

export const playRouletteWin = () => {
  // Comemoração curta e alegre
  playTone(880, 'sine', 0.1, 0.1); // A5
  setTimeout(() => playTone(1108, 'sine', 0.1, 0.1), 100); // C#6
  setTimeout(() => playTone(1318, 'sine', 0.2, 0.1), 200); // E6
};

let lastKeystrokeTime = 0;
export const playKeystroke = () => {
  const now = performance.now();
  if (now - lastKeystrokeTime < 40) return; // throttle to avoid overlap
  lastKeystrokeTime = now;

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => { });

  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.025); // 25ms burst
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    // Slight randomisation to sound natural
    filter.frequency.value = 1800 + Math.random() * 600;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (e) {
    void e;
  }
};

export const playLevelUp = () => {
  // Ascending arpeggio: C5 → E5 → G5 → C6 with a shimmery tail
  const notes = [
    { f: 523.25, t: 0, d: 0.15 },
    { f: 659.25, t: 0.12, d: 0.15 },
    { f: 783.99, t: 0.24, d: 0.15 },
    { f: 1046.50, t: 0.36, d: 0.3 },
    { f: 1318.51, t: 0.50, d: 0.4 },
  ];
  notes.forEach(({ f, t, d }) => {
    setTimeout(() => playTone(f, 'sine', d, 0.12), t * 1000);
  });
};
