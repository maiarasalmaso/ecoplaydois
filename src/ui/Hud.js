// src/ui/Hud.js
export default class Hud {
    /**
     * @param {Phaser.Scene} scene - The scene this HUD belongs to.
     */
    constructor(scene) {
        this.scene = scene;
        // Position HUD at top‑left corner with high contrast styling
        const colors = window.getThemeColors ? window.getThemeColors() : { primary: "#00ff7f", text: "#fff" };

        // Energy Counter
        this.energyText = scene.add.text(20, 20, "Energy: 0", {
            fontFamily: "'Exo 2', sans-serif",
            fontSize: "24px",
            color: colors.primary,
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: { x: 10, y: 5 }
        }).setDepth(1000);

        // Credits Counter
        this.creditsText = scene.add.text(20, 60, "Credits: $0", {
            fontFamily: "'Exo 2', sans-serif",
            fontSize: "24px",
            color: colors.accent || "#ffea00",
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: { x: 10, y: 5 }
        }).setDepth(1000);

        // Timer
        this.timerText = scene.add.text(scene.scale.width - 20, 20, "Time: 4:00", {
            fontFamily: "'Exo 2', sans-serif",
            fontSize: "28px",
            color: colors.text,
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0).setDepth(1000);
    }

    /**
     * Update displayed energy value.
     * @param {number} value - Energy percentage (0‑100).
     */
    updateEnergy(value) {
        this.energyText.setText(`Energy: ${value}`);
    }

    updateCredits(value) {
        this.creditsText.setText(`Credits: $${value}`);
    }

    updateTime(secondsRemaining) {
        const minutes = Math.floor(secondsRemaining / 60);
        const seconds = Math.floor(secondsRemaining % 60);
        const displaySeconds = seconds < 10 ? `0${seconds}` : seconds;
        this.timerText.setText(`Time: ${minutes}:${displaySeconds}`);

        // Critical time warning color
        if (secondsRemaining <= 30) {
            this.timerText.setColor('#ff4444');
        } else {
            const colors = window.getThemeColors ? window.getThemeColors() : { text: "#fff" };
            this.timerText.setColor(colors.text);
        }
    }
}
