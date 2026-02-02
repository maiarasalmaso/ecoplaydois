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
    ctx.resume().catch(() => {});
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
  playTone(800, 'sine', 0.1, 0.05);
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
  // Som "tec" curto e agudo
  // Frequência alta (1200Hz), duração curtíssima (0.05s)
  // Volume ajustado para 25% (dentro da faixa sugerida de 30-50% considerando a percepção logarítmica)
  playTone(1200, 'sine', 0.05, 0.25);
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