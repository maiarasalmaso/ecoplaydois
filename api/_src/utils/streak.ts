import { query } from '../db.js';

interface User {
    id: string | number;
    streak: number;
    last_login: string | Date | null;
    [key: string]: any;
}

export const checkAndRefreshStreak = async (user: User): Promise<User> => {
    if (!user || !user.id) return user;

    const now = new Date();
    const lastLogin = user.last_login ? new Date(user.last_login) : null;

    let newStreak = user.streak || 0;
    let shouldUpdateStreak = false;

    if (!lastLogin) {
        // First login ever
        newStreak = 1;
        shouldUpdateStreak = true;
    } else {
        // Check calendar days difference (ignoring time)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastDate = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());

        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            // Same day login, streak doesn't change
            shouldUpdateStreak = false;
        } else if (diffDays === 1) {
            // Consecutive day login
            newStreak += 1;
            shouldUpdateStreak = true;
        } else {
            // Missed a day (or more)
            newStreak = 1;
            shouldUpdateStreak = true;
        }
    }

    try {
        if (shouldUpdateStreak) {
            await query('UPDATE users SET streak = $1, last_login = NOW() WHERE id = $2', [newStreak, user.id]);
            user.streak = newStreak;
        } else {
            // Update last_login timestamp even if streak didn't change
            await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        }
        // Update local object timestamp
        user.last_login = now;
    } catch (err) {
        console.error('[Streak] Failed to update user streak/login:', err);
    }

    return user;
};
