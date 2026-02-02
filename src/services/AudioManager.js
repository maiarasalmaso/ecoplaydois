// src/services/AudioManager.js
import { Settings } from "../utils/settings.js";

/**
 * Singleton Audio Manager handling background music and sound effects.
 * Observes Settings changes to mute/unmute.
 */
class AudioManager {
    constructor() {
        this.bgm = null;
        this.sfx = {};
        this.isMuted = false;
        this.initialized = false;
    }

    /**
     * Initialize with the current scene's sound manager.
     * Must be called in the first scene (MainMenu).
     * @param {Phaser.Scene} scene 
     */
    init(scene) {
        if (this.initialized) return;

        // Load settings
        this.isMuted = Settings.get('isMuted', false);

        // Listen for setting changes - simple polling or custom event would be better
        // but for now we rely on explicit calls or scene updates
        this.scene = scene;
        this.initialized = true;
    }

    playBgm(key) {
        if (!this.initialized) return;

        if (this.bgm && this.bgm.key === key) {
            if (!this.bgm.isPlaying) this.bgm.play();
            return;
        }

        if (this.bgm) {
            this.bgm.stop();
        }

        this.bgm = this.scene.sound.add(key, { loop: true, volume: 0.5 });
        if (!this.isMuted) {
            this.bgm.play();
        }
    }

    playSfx(key) {
        if (!this.initialized || this.isMuted) return;
        this.scene.sound.play(key, { volume: 0.8 });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        Settings.set('isMuted', this.isMuted);

        if (this.isMuted) {
            if (this.bgm && this.bgm.isPlaying) this.bgm.pause();
            this.scene.sound.mute = true;
        } else {
            if (this.bgm && this.bgm.isPaused) this.bgm.resume();
            else if (this.bgm && !this.bgm.isPlaying) this.bgm.play();
            this.scene.sound.mute = false;
        }
        return this.isMuted;
    }
}

export const audioManager = new AudioManager();
