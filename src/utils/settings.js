// src/utils/settings.js
/**
 * Simple wrapper around localStorage for user preferences.
 * Keys: "highContrast", "daltone", "textSpeed" (0.5‑2.0)
 */
export const Settings = {
    get(key, defaultValue) {
        const raw = localStorage.getItem(key);
        if (raw === null) return defaultValue;
        if (key === "textSpeed") return parseFloat(raw);
        if (key === "highContrast" || key === "daltone") return raw === "true";
        return raw;
    },
    set(key, value) {
        localStorage.setItem(key, value);
    },
    toggle(key) {
        const current = this.get(key, false);
        this.set(key, !current);
    },
    initDefaults() {
        if (localStorage.getItem("highContrast") === null) this.set("highContrast", false);
        if (localStorage.getItem("daltone") === null) this.set("daltone", false);
        if (localStorage.getItem("textSpeed") === null) this.set("textSpeed", 1.0);
        if (localStorage.getItem("darkTheme") === null) this.set("darkTheme", true);
    },
};
