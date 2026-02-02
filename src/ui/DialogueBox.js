// src/ui/DialogueBox.js
/**
 * A reusable dialogue box for displaying educational content.
 * Features typewriting effect and 'Next' button.
 */
export default class DialogueBox {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.queue = [];
        this.onComplete = null;
        this.createGUI();
    }

    createGUI() {
        // Use Phaser DOM for better text handling and accessibility
        const colors = window.getThemeColors ? window.getThemeColors() : { bg: "#000", text: "#fff", primary: "#0f0" };

        const html = `
        <div id="dialogue-box" style="
            position: absolute; bottom: 20px; left: 5%; width: 90%; height: 150px;
            background: rgba(0, 0, 0, 0.9); border: 2px solid ${colors.primary};
            border-radius: 10px; padding: 20px; color: ${colors.text};
            font-family: 'Exo 2', sans-serif; display: none; z-index: 5000;
            box-shadow: 0 0 15px ${colors.primary};
        ">
            <div id="dialogue-text" style="font-size: 20px; line-height: 1.5;"></div>
            <button id="dialogue-next" style="
                position: absolute; bottom: 15px; right: 20px;
                background: ${colors.primary}; color: ${colors.bg};
                border: none; padding: 8px 16px; font-size: 16px;
                border-radius: 4px; cursor: pointer; font-weight: bold;
            ">Próximo ></button>
        </div>`;

        this.dom = this.scene.add.dom(0, 0).createFromHTML(html);
        this.dom.setOrigin(0);
        this.dom.setScrollFactor(0); // Fix to screen

        // Bind events
        this.scene.time.delayedCall(100, () => {
            const btn = document.getElementById('dialogue-next');
            if (btn) btn.addEventListener('click', () => this.next());
        });
    }

    show(messages, callback) {
        if (!messages || messages.length === 0) return;
        this.queue = [...messages];
        this.onComplete = callback;
        this.active = true;

        const box = document.getElementById('dialogue-box');
        if (box) box.style.display = 'block';

        this.next();
    }

    next() {
        if (this.queue.length === 0) {
            this.hide();
            if (this.onComplete) this.onComplete();
            return;
        }

        const text = this.queue.shift();
        const textEl = document.getElementById('dialogue-text');
        if (textEl) {
            textEl.innerHTML = ""; // Clear
            this.typewriter(textEl, text, 0);
        }
    }

    typewriter(element, text, i) {
        const speed = window.Settings ? (50 / window.Settings.get('textSpeed', 1.0)) : 50;

        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            this.scene.time.delayedCall(speed, () => {
                // Check if dialog is still active to prevent errors if skipped
                if (this.active) this.typewriter(element, text, i + 1);
            });
        }
    }

    hide() {
        this.active = false;
        const box = document.getElementById('dialogue-box');
        if (box) box.style.display = 'none';
    }
}
