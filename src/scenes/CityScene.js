// src/scenes/CityScene.js
import Phaser from "phaser";
import Hud from "../ui/Hud.js";

export default class CityScene extends Phaser.Scene {
    constructor() {
        super({ key: "CityScene" });
    }

    preload() {
        if (!this.textures.exists('game-assets')) {
            this.load.atlas('game-assets', '/assets/images/spritesheet.png', '/assets/images/spritesheet.json');
        }
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        this.add.text(centerX, 80, "City Sustainability Management", { fontFamily: "'Exo 2', sans-serif", fontSize: '28px', color: '#fff' }).setOrigin(0.5);
        this.add.image(centerX, centerY, "game-assets", "city").setScale(1.2);

        this.hud = new Hud(this);
        this.hud.updateEnergy(0);

        // Simple timer to simulate city energy consumption/production balance
        this.time.addEvent({
            delay: 1500,
            callback: this.updateEnergy,
            callbackScope: this,
            loop: true,
        });

        // Press SPACE to restart the loop (go back to SolarScene)
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('SolarScene');
        });
    }

    updateEnergy() {
        // Random fluctuation to simulate city dynamics
        const energy = Phaser.Math.Between(30, 80);
        this.hud.updateEnergy(energy);
    }
}
