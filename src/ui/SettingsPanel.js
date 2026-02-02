// src/ui/SettingsPanel.js
/**
 * SettingsPanel creates a simple HTML overlay (via Phaser DOM) that lets the player
 * toggle high‑contrast mode, daltone mode and adjust text speed.
 * It uses the `Settings` utility (src/utils/settings.js) to persist values.
 */
export default class SettingsPanel {
  /**
   * @param {Phaser.Scene} scene - Scene that will host the panel.
   */
  constructor(scene) {
    this.scene = scene;
    this.createPanel();
  }

  createPanel() {
    const html = `
      <div id="settings-panel" style="
        position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.85); color: #fff; padding: 20px; border-radius: 8px;
        font-family: 'Exo 2', sans-serif; min-width: 260px; z-index: 1000; display: none;">
        <h2 style="margin-top:0;">Configurações de Acessibilidade</h2>
        <label><input type="checkbox" id="high-contrast"> Alto Contraste</label><br/>
        <label><input type="checkbox" id="daltone"> Modo Daltônico</label><br/>
        <label><input type="checkbox" id="theme-toggle"> Tema Escuro</label><br/>
        <label><input type="checkbox" id="mute-toggle"> Mudo (Sem Áudio)</label><br/>
        <label>Velocidade do Texto: <input type="range" id="text-speed" min="0.5" max="2" step="0.1"></label>
        <div style="margin-top:10px; text-align:right;">
          <button id="settings-close">Fechar</button>
        </div>
      </div>`;

    // Add the HTML to the DOM via Phaser's DOM element
    this.dom = this.scene.add.dom(0, 0, html);
    this.dom.setOrigin(0);
    this.dom.setDepth(2000);

    // Bind events after the element is added to the document
    this.scene.time.delayedCall(0, () => {
      const panel = document.getElementById('settings-panel');
      const highContrast = document.getElementById('high-contrast');
      const daltone = document.getElementById('daltone');
      const textSpeed = document.getElementById('text-speed');
      const closeBtn = document.getElementById('settings-close');

      // Load saved values
      const { Settings } = window; // will be injected in main.js
      highContrast.checked = Settings.get('highContrast', false);
      daltone.checked = Settings.get('daltone', false);
      textSpeed.value = Settings.get('textSpeed', 1.0);

      // Handlers
      highContrast.addEventListener('change', () => Settings.set('highContrast', highContrast.checked));
      daltone.addEventListener('change', () => Settings.set('daltone', daltone.checked));
      const themeToggle = document.getElementById('theme-toggle');
      themeToggle.checked = Settings.get('darkTheme', true);
      themeToggle.addEventListener('change', () => {
        Settings.set('darkTheme', themeToggle.checked);
        if (window.applyTheme) window.applyTheme();
      });

      const muteToggle = document.getElementById('mute-toggle');
      muteToggle.checked = Settings.get('isMuted', false);
      muteToggle.addEventListener('change', () => {
        // We need access to audioManager, which we'll attach to window for simplicity
        if (window.audioManager) window.audioManager.toggleMute();
      });

      textSpeed.addEventListener('input', () => Settings.set('textSpeed', parseFloat(textSpeed.value)));
      closeBtn.addEventListener('click', () => panel.style.display = 'none');

      this.panel = panel;
    }, [], this);
  }

  /** Show the panel */
  open() {
    if (this.panel) this.panel.style.display = 'block';
  }
}
