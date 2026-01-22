/**
 * ScrollStateMachine.js
 * Pure state machine for scroll navigation - NO DOM, NO GSAP
 *
 * State Structure:
 * - 9 planets × variable cards per planet
 * - Each state: { index, planet, card }
 * - card: 0 = planet focus, 1-n = card stack (variable per planet)
 */

export class ScrollStateMachine {
    constructor() {
        // Define planet order
        this.planets = ['earth', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'neptune'];

        // Standardized to 3 cards per planet
        this.cardsPerPlanet = {
            earth: 3,      // Stats, Personal, Professional
            sun: 3,        // Stats, Personal, Professional
            moon: 3,       // Stats, Personal, Professional
            mars: 3,       // Stats, Personal, Professional
            mercury: 3,    // Stats, Personal, Professional
            jupiter: 3,    // Stats, Personal, Professional
            venus: 3,      // Stats, Personal, Professional
            saturn: 3,     // Stats, Personal, Professional
            neptune: 3     // Stats, Personal, Professional
        };

        // Build states array dynamically based on cards per planet
        this.states = [];
        for (let i = 0; i < this.planets.length; i++) {
            const planet = this.planets[i];
            const cardCount = this.cardsPerPlanet[planet];

            for (let c = 0; c < cardCount; c++) {
                this.states.push({
                    index: this.states.length,
                    planet: planet,
                    card: c
                });
            }
        }

        this.totalStates = this.states.length;

        // Current state index (0 = earth, card 0)
        this.currentIndex = 0;

        // Callbacks for state changes
        this.onStateChange = null;
    }

    /**
     * Get total number of states
     */
    getTotal() {
        return this.totalStates;
    }

    /**
     * Get current state
     */
    getState() {
        return this.states[this.currentIndex];
    }

    /**
     * Get state by index (with bounds clamping)
     */
    getStateAt(index) {
        const clampedIndex = Math.max(0, Math.min(index, this.totalStates - 1));
        return this.states[clampedIndex];
    }

    /**
     * Move to next state
     * Returns new state, or null if already at end
     */
    next() {
        if (this.currentIndex >= this.totalStates - 1) {
            return null; // Already at end
        }
        this.currentIndex++;
        this._notifyChange();
        return this.getState();
    }

    /**
     * Move to previous state
     * Returns new state, or null if already at start
     */
    prev() {
        if (this.currentIndex <= 0) {
            return null; // Already at start
        }
        this.currentIndex--;
        this._notifyChange();
        return this.getState();
    }

    /**
     * Jump to specific state index
     * Clamps to valid range
     */
    goTo(index) {
        const clampedIndex = Math.max(0, Math.min(index, this.totalStates - 1));
        if (clampedIndex !== this.currentIndex) {
            this.currentIndex = clampedIndex;
            this._notifyChange();
        }
        return this.getState();
    }

    /**
     * Jump to specific planet and card
     */
    goToPlanetCard(planet, card) {
        const planetIndex = this.planets.indexOf(planet);
        if (planetIndex === -1) return null;

        const maxCardsForPlanet = this.cardsPerPlanet[planet] || 3;
        const clampedCard = Math.max(0, Math.min(card, maxCardsForPlanet - 1));

        // Calculate state index by summing up cards from previous planets
        let stateIndex = 0;
        for (let i = 0; i < planetIndex; i++) {
            stateIndex += this.cardsPerPlanet[this.planets[i]];
        }
        stateIndex += clampedCard;

        return this.goTo(stateIndex);
    }

    /**
     * Get state index for a planet/card combo
     */
    getIndexFor(planet, card) {
        const planetIndex = this.planets.indexOf(planet);
        if (planetIndex === -1) return -1;

        const maxCardsForPlanet = this.cardsPerPlanet[planet] || 3;
        const clampedCard = Math.max(0, Math.min(card, maxCardsForPlanet - 1));

        // Calculate state index by summing up cards from previous planets
        let stateIndex = 0;
        for (let i = 0; i < planetIndex; i++) {
            stateIndex += this.cardsPerPlanet[this.planets[i]];
        }
        stateIndex += clampedCard;

        return stateIndex;
    }

    /**
     * Get the number of cards for a specific planet
     */
    getCardsForPlanet(planet) {
        return this.cardsPerPlanet[planet] || 3;
    }

    /**
     * Set callback for state changes
     */
    setOnStateChange(callback) {
        this.onStateChange = callback;
    }

    /**
     * Internal: notify listeners of state change
     */
    _notifyChange() {
        if (this.onStateChange) {
            this.onStateChange(this.getState());
        }
    }

    /**
     * Reset to initial state
     */
    reset() {
        if (this.currentIndex !== 0) {
            this.currentIndex = 0;
            this._notifyChange();
        }
    }
}
