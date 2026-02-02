// src/scenes/GeoScene.js
import Phaser from "phaser";
import Hud from "../ui/Hud.js";

export default class GeoScene extends Phaser.Scene {
    constructor() {
        super({ key: "GeoScene" });
    }

    preload() {
        if (!this.textures.exists('game-assets')) {
            this.load.atlas('game-assets', '/assets/images/spritesheet.png', '/assets/images/spritesheet.json');
        }
    }

    create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        this.add.text(centerX, 50, "Geothermal Challenge", { fontFamily: "'Exo 2', sans-serif", fontSize: '24px', color: '#fff' }).setOrigin(0.5);
        this.rock = this.add.image(centerX, centerY, "game-assets", "rock").setInteractive({ draggable: true });
        this.input.setDraggable(this.rock);
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
        // Simple geothermal model: deeper (higher y) = more heat, plus proximity to center
        const distance = Phaser.Math.Distance.Between(
            this.rock.x,
            this.rock.y,
            this.cameras.main.centerX,
            this.cameras.main.centerY
        );
        const maxDist = 300;
        const placementFactor = Math.max(0, (maxDist - distance) / maxDist);
        const depthFactor = Math.max(0, (this.rock.y - this.cameras.main.centerY) / maxDist);
        const energy = Math.round((placementFactor + depthFactor) * 90);
        this.hud.updateEnergy(energy);
    }
}
