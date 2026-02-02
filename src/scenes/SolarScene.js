// src/scenes/SolarScene.js
import Phaser from "phaser";
import Hud from "../ui/Hud.js";
import DialogueBox from "../ui/DialogueBox.js";
import QuizModal from "../ui/QuizModal.js";
import curriculum from "../data/curriculum.json";
import { difficultyManager } from "../utils/difficulty.js";
import { playerState } from "../services/PlayerState.js";

export default class SolarScene extends Phaser.Scene {
    constructor() {
        super({ key: "SolarScene" });
    }

    preload() {
        // Assets loaded in MainMenu usually, but good practice to ensure availability or load if starting directly
        if (!this.textures.exists('game-assets')) {
            this.load.atlas('game-assets', '/assets/images/spritesheet.png', '/assets/images/spritesheet.json');
        }
    }

    create() {
        // Background color already set in config; add sun illustration
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        this.add.image(centerX, centerY - 200, "game-assets", "sun");

        // Simple draggable panel puzzle
        this.panel = this.add.image(centerX, centerY + 100, "game-assets", "panel").setInteractive({ draggable: true });
        this.input.setDraggable(this.panel);
        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        // HUD to show energy generated
        this.hud = new Hud(this);
        // Press SPACE to advance to WindScene
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('WindScene');
        });
        this.hud.updateEnergy(0);

        // Initialize UI Components
        this.dialogue = new DialogueBox(this);
        this.quiz = new QuizModal(this);

        this.timeLimit = 240; // 4 minutes in seconds
        this.timer = this.timeLimit;

        // Start Intro Dialogue
        this.dialogue.show(curriculum.solar.intro, () => {
            difficultyManager.startTracking();
            this.startTimer();
        });

        // Energy generation timer (game loop)
        this.genTimer = this.time.addEvent({
            delay: 1000 * (1 / difficultyManager.getSimulationSpeed()), // Adjust speed
            callback: this.generateEnergy,
            callbackScope: this,
            loop: true,
            paused: true // Wait for intro
        });

        this.energyTarget = difficultyManager.getTargetScore(100);
        this.quizTriggered = false;

        // Init HUD values
        this.hud.updateTime(this.timer);
        this.hud.updateCredits(playerState.getCredits());
    }

    startTimer() {
        this.genTimer.paused = false;
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: this.onSecondTick,
            callbackScope: this,
            loop: true
        });
    }

    onSecondTick() {
        if (this.quizTriggered) return;

        this.timer--;
        this.hud.updateTime(this.timer);

        if (this.timer <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.genTimer.paused = true;
        this.gameTimer.paused = true;
        // Simple game over feedback for now
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "TIME'S UP!", {
            fontFamily: "'Exo 2', sans-serif", fontSize: "64px", color: "#ff4444"
        }).setOrigin(0.5).setDepth(5000);

        // Restart scene after delay
        this.time.delayedCall(3000, () => {
            this.scene.restart();
        });
    }

    generateEnergy() {
        if (this.quizTriggered) return;

        // Very simple formula: closer to center = more energy
        const distance = Phaser.Math.Distance.Between(
            this.panel.x,
            this.panel.y,
            this.cameras.main.centerX,
            this.cameras.main.centerY
        );
        const maxDist = 300;
        const panelEnergy = Math.max(0, Math.round(((maxDist - distance) / maxDist) * 10)); // +0-10 per tick

        // Accumulate energy
        if (!this.currentEnergy) this.currentEnergy = 0;
        this.currentEnergy += panelEnergy;

        // Economy: 1 Credit for every 10 Energy generated (simplified)
        if (panelEnergy > 0) {
            const creditsEarned = Math.floor(panelEnergy / 2); // e.g. 5 energy = 2 credits
            if (creditsEarned > 0) {
                playerState.addCredits(creditsEarned);
                this.hud.updateCredits(playerState.getCredits());
            }
        }

        // Update HUD
        this.hud.updateEnergy(this.currentEnergy);

        // Check Win Condition
        if (this.currentEnergy >= this.energyTarget && !this.quizTriggered) {
            this.quizTriggered = true;
            this.triggerQuiz();
        }
    }

    triggerQuiz() {
        this.quiz.show(curriculum.solar.quiz, () => {
            // On Pass
            difficultyManager.evaluatePerformance();
            this.scene.start('WindScene');
        }, () => {
            // On Fail
            difficultyManager.recordMistake();
        });
    }
}
