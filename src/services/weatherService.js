// src/services/weatherService.js
/**
 * Fetch current weather data using OpenWeather API.
 * Requires VITE_OPENWEATHER_KEY environment variable (exposed via Vite's import.meta.env).
 * Returns an object with windSpeed (m/s), solarRadiation (approx. temperature in °C as proxy), and precipitation (mm).
 */
export async function getCurrentWeather(lat = null, lon = null) {
    const apiKey = import.meta.env.VITE_OPENWEATHER_KEY;
    if (!apiKey) {
        throw new Error("OpenWeather API key not set in VITE_OPENWEATHER_KEY");
    }
    // If lat/lon not provided, use a default location (e.g., São Paulo)
    const defaultLat = -23.55;
    const defaultLon = -46.63;
    const queryLat = lat ?? defaultLat;
    const queryLon = lon ?? defaultLon;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${queryLat}&lon=${queryLon}&units=metric&appid=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Weather fetch failed with status ${resp.status}`);
    }
    const data = await resp.json();
    return {
        windSpeed: data.wind?.speed ?? 0,
        solarRadiation: data.main?.temp ?? 0, // using temperature as a simple proxy
        precipitation: data.rain?.['1h'] ?? 0,
    };
}
