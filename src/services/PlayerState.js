// src/services/PlayerState.js

class PlayerState {
    constructor() {
        this.credits = 0;
        this.unlockedLevels = 1;
    }

    addCredits(amount) {
        this.credits += amount;
        return this.credits;
    }

    getCredits() {
        return this.credits;
    }

    // Simple persistent save via localStorage wrapper could go here later
}

export const playerState = new PlayerState();
