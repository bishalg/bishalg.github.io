/**
 * ScrollStateMachine.js
 * Pure state machine for scroll navigation - NO DOM, NO GSAP
 * 
 * State Structure:
 * - 9 planets × 4 cards = 36 total states (0-35)
 * - Each state: { index, planet, card }
 * - card: 0 = planet focus, 1-3 = card panels
 */

export class ScrollStateMachine {
    constructor() {
        // Define planet order
        this.planets = ['earth', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'neptune'];
        this.cardsPerPlanet = 4; // 0=focus, 1=card1, 2=card2, 3=card3
        this.totalStates = this.planets.length * this.cardsPerPlanet; // 36

        // Build states array
        this.states = [];
        for (let i = 0; i < this.planets.length; i++) {
            for (let c = 0; c < this.cardsPerPlanet; c++) {
                this.states.push({
                    index: this.states.length,
                    planet: this.planets[i],
                    card: c
                });
            }
        }

        // Current state index (-1 = God View/Start)
        this.currentIndex = -1;

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
     * Returns null if at God View (-1)
     */
    getState() {
        if (this.currentIndex === -1) return null;
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
     * Returns new state, or null (God View) if going back from 0
     */
    prev() {
        if (this.currentIndex <= -1) {
            return null; // Already at start/God View
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

        const clampedCard = Math.max(0, Math.min(card, this.cardsPerPlanet - 1));
        const stateIndex = (planetIndex * this.cardsPerPlanet) + clampedCard;
        return this.goTo(stateIndex);
    }

    /**
     * Get state index for a planet/card combo
     */
    getIndexFor(planet, card) {
        const planetIndex = this.planets.indexOf(planet);
        if (planetIndex === -1) return -1;
        const clampedCard = Math.max(0, Math.min(card, this.cardsPerPlanet - 1));
        return (planetIndex * this.cardsPerPlanet) + clampedCard;
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
     * Reset to initial state (God View)
     */
    reset() {
        if (this.currentIndex !== -1) {
            this.currentIndex = -1;
            this._notifyChange();
        }
    }
}
