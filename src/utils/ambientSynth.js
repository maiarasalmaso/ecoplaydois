// ambientSynth.js - Generates Synthwave + Nature ambient sounds using Web Audio API

let audioContext = null;
let masterGain = null;

// Oscillators and Nodes references to stop them later
let nodes = [];

const getAudioContext = () => {
    if (!audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioContext = new AudioContext();
        }
    }
    return audioContext;
};

const createPinkNoise = (ctx) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pink Noise generation (approximation)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // Compensation
        b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
};

export const resumeAudioContext = async () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        console.log('[Ambient] Resuming context via user gesture...');
        try {
            await ctx.resume();
            console.log('[Ambient] Context resumed!');
        } catch (e) {
            console.error('[Ambient] Resume failed:', e);
        }
    }
};

export const startAmbient = async () => {
    console.log('[Ambient] Starting ambient sound...');
    const ctx = getAudioContext();
    if (!ctx) {
        console.error('[Ambient] No AudioContext available');
        return;
    }

    // Attempt resume if not already (redundant but safe)
    if (ctx.state === 'suspended') {
        console.error('[Ambient] Failed to resume context:', e);
    }
    // Prevent multiple starts
    stopAmbient();

    console.log('[Ambient] Creating nodes...');
    // Master Gain
    masterGain = ctx.createGain();
    masterGain.gain.value = 0; // Start at 0 for fade in
    masterGain.connect(ctx.destination);

    // --- LAYER 1: Synthwave Drone (Low Pad) ---
    const droneOsc1 = ctx.createOscillator();
    const droneOsc2 = ctx.createOscillator();
    const droneFilter = ctx.createBiquadFilter();
    const droneGain = ctx.createGain();

    droneOsc1.type = 'sawtooth';
    droneOsc1.frequency.value = 55.00; // A1

    droneOsc2.type = 'sawtooth';
    droneOsc2.frequency.value = 55.50; // A1 slightly detuned

    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 180; // Muffled warm sound
    droneFilter.Q.value = 1;

    droneGain.gain.value = 0.15; // Low volume background

    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);

    droneOsc1.start();
    droneOsc2.start();
    nodes.push(droneOsc1, droneOsc2);


    // --- LAYER 2: Nature/Wind (Filtered Noise with LFO) ---
    const windNoise = createPinkNoise(ctx);
    const windFilter = ctx.createBiquadFilter();
    const windGain = ctx.createGain();
    const windLFO = ctx.createOscillator();
    const windLFOGain = ctx.createGain();

    windFilter.type = 'bandpass';
    windFilter.frequency.value = 400;
    windFilter.Q.value = 0.5;

    // LFO modulates filter frequency to simulate wind varying
    windLFO.type = 'sine';
    windLFO.frequency.value = 0.05; // Very slow cycle (20s)
    windLFOGain.gain.value = 200; // Modulate frequency by +/- 200Hz

    windLFO.connect(windLFOGain);
    windLFOGain.connect(windFilter.frequency);

    windGain.gain.value = 0.1;

    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);

    windNoise.start();
    windLFO.start();
    nodes.push(windNoise, windLFO);


    // --- LAYER 3: Energy Sparkles (High Arpeggio/Chimes randomized) ---
    // Using a LFO to pulse a high sine wave
    const energyOsc = ctx.createOscillator();
    const energyGain = ctx.createGain();
    const energyLFO = ctx.createOscillator();

    energyOsc.type = 'sine';
    energyOsc.frequency.value = 880; // A5

    energyLFO.type = 'triangle';
    energyLFO.frequency.value = 0.5; // Pulse every 2s

    // Use a second gain to modulate volume
    const energyPulseGain = ctx.createGain();
    energyPulseGain.gain.value = 0;

    // Connect LFO to control volume of the pulse gain
    energyLFO.connect(energyPulseGain.gain);

    energyOsc.connect(energyPulseGain);
    energyPulseGain.connect(energyGain);
    energyGain.connect(masterGain);

    energyGain.gain.value = 0.02; // Very subtle

    energyOsc.start();
    energyLFO.start();
    nodes.push(energyOsc, energyLFO);

    // Fade In
    console.log('[Ambient] Ramping up volume...');
    masterGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 3);
};

export const stopAmbient = () => {
    if (masterGain && audioContext) {
        masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.5);
        setTimeout(() => {
            nodes.forEach(node => {
                try { node.stop(); } catch (e) { }
                try { node.disconnect(); } catch (e) { }
            });
            nodes = [];
            if (masterGain) {
                masterGain.disconnect();
                masterGain = null;
            }
        }, 600);
    } else {
        // If no fade out possible, just hard stop
        nodes.forEach(node => {
            try { node.stop(); } catch (e) { }
            try { node.disconnect(); } catch (e) { }
        });
        nodes = [];
    }
};

export const setAmbientVolume = (limit) => {
    if (masterGain && audioContext) {
        masterGain.gain.setTargetAtTime(limit, audioContext.currentTime, 0.1);
    }
}
