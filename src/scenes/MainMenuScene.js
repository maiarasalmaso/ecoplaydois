// src/scenes/MainMenuScene.js
import Phaser from "phaser";
import SettingsPanel from "../ui/SettingsPanel.js";
import { audioManager } from "../services/AudioManager.js";
import { db } from "../services/db.js";

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainMenuScene" });
    }

    preload() {
        // Load the game sprite sheet
        this.load.atlas('game-assets', '/assets/images/spritesheet.png', '/assets/images/spritesheet.json');

        // Placeholder audio (generated earlier via command)
        this.load.audio('bgm', '/assets/audio/bgm.mp3');
        this.load.audio('click', '/assets/audio/click.mp3');
    }

    create() {
        // Init Audio
        audioManager.init(this);
        window.audioManager = audioManager; // For SettingsPanel access
        audioManager.playBgm('bgm');

        // Init Cloud Save (Async)
        db.signInAnonymously().then(({ user }) => {
            console.log("Player signed in:", user.id);
            // Could load progress here and enable 'Continue' button
        });

        const { width, height } = this.scale;
        // Decorative background elements using new assets
        this.add.image(width * 0.8, height * 0.2, 'game-assets', 'sun').setScale(0.8);
        this.add.image(width * 0.2, height * 0.8, 'game-assets', 'city').setScale(0.8);

        const colors = window.getThemeColors ? window.getThemeColors() : { primary: "#00FF7F" };

        // Title
        this.add.text(width / 2, height / 2, "Eco Guardian", {
            fontFamily: "'Exo 2', sans-serif",
            fontSize: "48px",
            color: colors.primary,
            align: "center"
        }).setOrigin(0.5);

        // Play button
        const playBtn = this.add.image(width / 2, height * 0.65, 'game-assets', 'play').setScale(0.8).setInteractive({ useHandCursor: true });

        // Label for play button
        this.add.text(width / 2, height * 0.65 + 60, "Jogar", {
            fontFamily: "'Exo 2', sans-serif", fontSize: "24px", color: colors.text
        }).setOrigin(0.5);
        playBtn.on('pointerdown', () => {
            audioManager.playSfx('click');
            this.startGame();
        });
        this.input.keyboard.once('keydown-ENTER', () => {
            audioManager.playSfx('click');
            this.startGame();
        });

        // Settings button
        const settingsBtn = this.add.image(width - 50, 50, 'game-assets', 'settings').setScale(0.5).setInteractive({ useHandCursor: true });

        // Settings panel instance for this scene
        this.settingsPanel = new SettingsPanel(this);
        settingsBtn.on('pointerdown', () => this.settingsPanel.open());
        this.input.keyboard.on('keydown-S', () => this.settingsPanel.open());
    }

    startGame() {
        this.scene.start('SolarScene');
    }
}
