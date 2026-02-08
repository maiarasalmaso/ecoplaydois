export const MODULE_STATS: Record<string, { baseProd: number; costFactor: number; baseCost: number }> = {
    solar: { baseProd: 10, costFactor: 1.5, baseCost: 100 },
    wind: { baseProd: 25, costFactor: 1.6, baseCost: 500 },
    hydro: { baseProd: 60, costFactor: 1.7, baseCost: 2000 },
    garden: { baseProd: 5, costFactor: 1.4, baseCost: 50 },
    biomass: { baseProd: 40, costFactor: 1.6, baseCost: 1000 },
    lab: { baseProd: 100, costFactor: 2.0, baseCost: 5000 },
    geothermal: { baseProd: 150, costFactor: 1.8, baseCost: 8000 },
    storage: { baseProd: 0, costFactor: 1.5, baseCost: 3000 }
};

export const calculateProduction = (modules: Record<string, number> = {}) => {
    return Object.entries(modules).reduce((total, [id, level]) => {
        const stats = MODULE_STATS[id];
        if (!stats) return total;
        return total + (stats.baseProd * level);
    }, 0);
};
