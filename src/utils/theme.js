// src/utils/theme.js

/**
 * Theme utility to apply dark/light theme based on user preference stored in Settings.
 * It adds the appropriate CSS class (theme-dark or theme-light) to the document root.
 */
export function applyTheme() {
    // Settings is exposed globally via window.Settings (see main.js)
    const Settings = window.Settings;
    if (!Settings) {
        console.warn('Settings utility not available for theme application');
        return;
    }
    const isDark = Settings.get('darkTheme', true);
    const root = document.documentElement;
    // Remove both classes first to avoid duplicates
    root.classList.remove('theme-dark', 'theme-light');
    if (isDark) {
        root.classList.add('theme-dark');
    } else {
        root.classList.add('theme-light');
    }
}

/**
 * Toggle the theme and persist the new preference.
 */
export function toggleTheme() {
    const Settings = window.Settings;
    if (!Settings) return;
    const current = Settings.get('darkTheme', true);
    Settings.set('darkTheme', !current);
    applyTheme();
}

/**
 * Get current theme colors for use in Phaser (canvas) contexts
 * where CSS variables might not work directly or reliably.
 */
export function getThemeColors() {
    const Settings = window.Settings;
    const isDark = Settings && Settings.get ? Settings.get('darkTheme', true) : true;

    if (isDark) {
        return {
            primary: '#00ff7f', // neon green
            bg: '#0a0a0a',     // dark bg
            text: '#ffffff',
            accent: '#ffea00'
        };
    } else {
        return {
            primary: '#0066ff', // blue
            bg: '#f0f0f0',      // light bg
            text: '#000000',
            accent: '#ff6600'
        };
    }
}
