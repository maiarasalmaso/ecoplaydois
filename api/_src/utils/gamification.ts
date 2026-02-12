
export const LEVELS = [
    { min: 0, title: 'Iniciante Ecológico', color: 'text-green-700 dark:text-green-400' },
    { min: 100, title: 'Aprendiz da Energia', color: 'text-green-700 dark:text-green-400' },
    { min: 500, title: 'Guardião Sustentável', color: 'text-green-700 dark:text-green-400' },
    { min: 1000, title: 'Mestre Renovável', color: 'text-orange-700 dark:text-orange-400' },
    { min: 2000, title: 'Lenda do Planeta', color: 'text-purple-700 dark:text-purple-400' },
];

export const getLevel = (points: number) => {
    // Clone array and reverse to find the highest matching level
    return [...LEVELS].reverse().find(l => points >= l.min) || LEVELS[0];
};

export const getNextLevel = (points: number) => {
    const current = getLevel(points);
    const nextIndex = LEVELS.indexOf(current) + 1;
    return LEVELS[nextIndex] || null;
};
