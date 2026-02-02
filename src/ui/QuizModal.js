// src/ui/QuizModal.js
/**
 * A reusable quiz modal for end-of-level challenges.
 */
export default class QuizModal {
    constructor(scene) {
        this.scene = scene;
        this.onPass = null;
        this.onFail = null;
        this.createGUI();
    }

    createGUI() {
        const colors = window.getThemeColors ? window.getThemeColors() : { bg: "#000", text: "#fff", primary: "#0f0", accent: "#ff0" };

        const html = `
        <div id="quiz-modal" style="
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 600px; max-width: 90%; 
            background: ${colors.bg}; border: 3px solid ${colors.accent};
            border-radius: 12px; padding: 30px; color: ${colors.text};
            font-family: 'Exo 2', sans-serif; display: none; z-index: 6000;
            box-shadow: 0 0 30px rgba(0,0,0,0.8);
            text-align: center;
        ">
            <h2 id="quiz-question" style="color: ${colors.primary}; margin-bottom: 20px;">Question?</h2>
            <div id="quiz-options" style="display: flex; flex-direction: column; gap: 10px;">
                <!-- Options injected here -->
            </div>
            <div id="quiz-feedback" style="margin-top: 15px; font-weight: bold; min-height: 24px;"></div>
        </div>`;

        this.dom = this.scene.add.dom(0, 0).createFromHTML(html);
        this.dom.setOrigin(0);
        this.dom.setScrollFactor(0);
    }

    show(quizData, onPass, onFail) {
        if (!quizData) return;
        this.onPass = onPass;
        this.onFail = onFail;
        this.data = quizData;

        const modal = document.getElementById('quiz-modal');
        const questionEl = document.getElementById('quiz-question');
        const optionsEl = document.getElementById('quiz-options');
        const feedbackEl = document.getElementById('quiz-feedback');

        // Reset
        modal.style.display = 'block';
        optionsEl.innerHTML = '';
        feedbackEl.innerHTML = '';
        feedbackEl.style.color = 'inherit';
        questionEl.innerText = quizData.question;

        // Create buttons
        quizData.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.className = 'btn'; // Use design system class
            btn.style.width = '100%';
            btn.style.textAlign = 'left';
            btn.style.margin = '5px 0';
            btn.onclick = () => this.checkAnswer(index, btn);
            optionsEl.appendChild(btn);
        });
    }

    checkAnswer(selectedIndex, btnElement) {
        const feedbackEl = document.getElementById('quiz-feedback');
        const colors = window.getThemeColors();

        if (selectedIndex === this.data.correct) {
            // Correct
            btnElement.style.background = colors.primary;
            btnElement.style.color = colors.bg;
            feedbackEl.innerText = this.data.explanation;
            feedbackEl.style.color = colors.primary;

            // Audio feedback
            if (window.audioManager) window.audioManager.playSfx('click'); // Should have a 'success' sfx

            setTimeout(() => {
                this.close();
                if (this.onPass) this.onPass();
            }, 2000);
        } else {
            // Incorrect
            btnElement.style.background = '#ff4444'; // Error red
            feedbackEl.innerText = "Tente novamente.";
            feedbackEl.style.color = '#ff4444';
            // Audio feedback
            if (window.audioManager) window.audioManager.playSfx('click'); // Should have 'error' sfx
        }
    }

    close() {
        const modal = document.getElementById('quiz-modal');
        if (modal) modal.style.display = 'none';

        // Remove focus to prevent keyboard capturing issues
        document.body.focus();
    }
}
