export const calculateStreak = (lastLoginDate, currentDate = new Date()) => {
    if (!lastLoginDate) return 1;

    const last = new Date(lastLoginDate);
    const current = new Date(currentDate);

    // Zerar horas para comparar apenas dias
    last.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(current - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 0; // Mesmo dia, não muda (ou retorna atual externamente)
    if (diffDays === 1) return 1; // Dia seguinte, incrementa
    return -1; // Quebrou a streak (reset)
};

export const formatStreak = (streak) => {
    return `${streak} dia${streak !== 1 ? 's' : ''}`;
};

export default {
    calculateStreak,
    formatStreak
};
