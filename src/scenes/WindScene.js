// src/scenes/WindScene.js
import Phaser from "phaser";
import Hud from "../ui/Hud.js";
import { getCurrentWeather } from "../services/weatherService.js";

export default class WindScene extends Phaser.Scene {
    constructor() {
        super({ key: "WindScene" });
    }

    preload() {
        // Assets loaded in MainMenu usually, but good practice to ensure availability or load if starting directly
        if (!this.textures.exists('game-assets')) {
            this.load.atlas('game-assets', '/assets/images/spritesheet.png', '/assets/images/spritesheet.json');
        }
    }

    async create() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        this.add.text(centerX, 50, "Wind Energy Challenge", { fontFamily: "'Exo 2', sans-serif", fontSize: '24px', color: '#fff' }).setOrigin(0.5);
        this.turbine = this.add.image(centerX, centerY, "game-assets", "turbine").setInteractive({ draggable: true });
        this.input.setDraggable(this.turbine);
        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.hud = new Hud(this);
        this.hud.updateEnergy(0);

        // Fetch weather once (could be refreshed later)
        try {
            const { windSpeed } = await getCurrentWeather();
            this.baseWind = windSpeed; // m/s
        } catch (e) {
            console.warn("Weather fetch failed, using default wind speed");
            this.baseWind = 5; // default
        }

        this.time.addEvent({
            delay: 1000,
            callback: this.generateEnergy,
            callbackScope: this,
            loop: true,
        });
    }

    generateEnergy() {
        // Energy proportional to distance from center (simulating optimal placement) and wind speed
        const distance = Phaser.Math.Distance.Between(
            this.turbine.x,
            this.turbine.y,
            this.cameras.main.centerX,
            this.cameras.main.centerY
        );
        const maxDist = 300;
        const placementFactor = Math.max(0, (maxDist - distance) / maxDist);
        const energy = Math.round(placementFactor * this.baseWind * 20); // arbitrary scaling
        this.hud.updateEnergy(energy);
    }
}
