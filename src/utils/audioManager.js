// audioManager.js - Singleton to manage Web Audio API context
// Handles mobile autoplay policies and unlocks audio on first user interaction

let audioContext = null;
let isUnlocked = false;

export const getAudioContext = () => {
    if (!audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioContext = new AudioContext();
        }
    }
    return audioContext;
};

export const initAudio = () => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const unlockEvents = ['click', 'touchstart', 'keydown', 'mousedown'];

    const unlock = () => {
        if (isUnlocked) return;

        const ctx = getAudioContext();
        if (!ctx) return;

        if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                console.log('[AudioManager] AudioContext resumed successfully');
                isUnlocked = true;

                // Play a brief silent buffer to fully unlock the audio engine on iOS/Android
                const buffer = ctx.createBuffer(1, 1, 22050);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(0);

                // Remove listeners once unlocked
                unlockEvents.forEach(event => {
                    document.removeEventListener(event, unlock);
                });
            }).catch(e => {
                console.error('[AudioManager] Failed to resume AudioContext:', e);
            });
        } else {
            // Already running
            isUnlocked = true;
            unlockEvents.forEach(event => {
                document.removeEventListener(event, unlock);
            });
        }
    };

    unlockEvents.forEach(event => {
        document.addEventListener(event, unlock, { passive: true, once: true });
    });
};

// Helper to safely resume if needed (can be called by specific user actions)
export const resumeAudio = async () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        try {
            await ctx.resume();
            return true;
        } catch (e) {
            console.error('[AudioManager] Resume failed', e);
            return false;
        }
    }
    return true;
};
