// src/main.js
import Phaser from "phaser";
import MainMenuScene from "./scenes/MainMenuScene.js";
import SolarScene from "./scenes/SolarScene.js";
import WindScene from "./scenes/WindScene.js";
import HydroScene from "./scenes/HydroScene.js";
import GeoScene from "./scenes/GeoScene.js";
import CityScene from "./scenes/CityScene.js";

// Accessibility utilities
import Settings from "./utils/settings.js";
import "./styles/accessibility.css";
import "./styles/main.css"; // Design system with premium palette
import { applyTheme, toggleTheme, getThemeColors } from "./utils/theme.js";

// Expose Settings globally for the DOM‑based SettingsPanel used in scenes
window.Settings = Settings;

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    transparent: true,
    parent: "game-container",
    scene: [MainMenuScene, SolarScene, WindScene, HydroScene, GeoScene, CityScene],
    physics: {
        default: "arcade",
        arcade: { debug: false }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

window.addEventListener("load", () => {
    const game = new Phaser.Game(config);
    // Initialize defaults and apply saved theme
    Settings.initDefaults();
    applyTheme();
    // Imports already handled at top of file

    // Expose theme functions globally for SettingsPanel and Scenes
    window.applyTheme = applyTheme;
    window.toggleTheme = toggleTheme;
    window.getThemeColors = getThemeColors;
});
