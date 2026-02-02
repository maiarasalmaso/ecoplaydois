// src/scenes/HydroScene.js
import Phaser from "phaser";
import Hud from "../ui/Hud.js";

export default class HydroScene extends Phaser.Scene {
    constructor() {
        super({ key: "HydroScene" });
    }

    preload() {
        if (!this.textures.exists('game-assets')) {
            this.load.atlas('game-assets', '/assets/images/spritesheet.png', '/assets/images/spritesheet.json');
        }
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        this.add.text(centerX, 50, "Hydro Power Challenge", { fontFamily: "'Exo 2', sans-serif", fontSize: '24px', color: '#fff' }).setOrigin(0.5);
        this.drop = this.add.image(centerX, centerY, "game-assets", "drop").setInteractive({ draggable: true });
        this.input.setDraggable(this.drop);
        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.hud = new Hud(this);
        this.hud.updateEnergy(0);

        this.time.addEvent({
            delay: 1000,
            callback: this.generateEnergy,
            callbackScope: this,
            loop: true,
        });
    }

    generateEnergy() {
        // Simple model: closer to center = higher flow, plus vertical position simulates height
        const distance = Phaser.Math.Distance.Between(
            this.drop.x,
            this.drop.y,
            this.cameras.main.centerX,
            this.cameras.main.centerY
        );
        const maxDist = 300;
        const placementFactor = Math.max(0, (maxDist - distance) / maxDist);
        const heightFactor = Math.max(0, (this.drop.y - this.cameras.main.centerY) / maxDist);
        const energy = Math.round((placementFactor + heightFactor) * 80);
        this.hud.updateEnergy(energy);
    }
}
