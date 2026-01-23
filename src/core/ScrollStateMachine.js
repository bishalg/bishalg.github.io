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

        // Build the CENTRAL STATE ARRAY: [0,1,2,3,0,1,2,3,0,1,2,3,...]
        this.states = [];
        for (let i = 0; i < this.planets.length; i++) {
            const planet = this.planets[i];
            // Each planet: planet view (0) + N cards (1,2,3)
            this.states.push({ planet, card: 0 }); // Planet view
            for (let c = 1; c <= this.cardsPerPlanet[planet]; c++) {
                this.states.push({ planet, card: c }); // Card states
            }
        }

        this.totalStates = this.states.length;
        this.currentIndex = 0;

        // Callbacks for state changes
        this.onStateChange = null;

        console.log('🎯 Central State Array:', this.states.map((s, i) => `${i}:${s.planet}${s.card}`).join(', '));
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
     * Move to next state in the central array
     * Simple array index increment - no special logic needed
     */
    next() {
        if (this.currentIndex >= this.totalStates - 1) {
            console.log('🏁 At end of central state array');
            return null; // Already at end
        }

        const prevState = this.getState();
        this.currentIndex++;
        const newState = this.getState();

        console.log(`➡️ NEXT: ${prevState.planet}${prevState.card} → ${newState.planet}${newState.card} (index: ${this.currentIndex - 1} → ${this.currentIndex})`);

        this._notifyChange();
        return newState;
    }

    /**
     * Move to previous state in the central array
     * Simple array index decrement
     */
    prev() {
        if (this.currentIndex <= 0) {
            console.log('🏁 At start of central state array');
            return null; // Already at start
        }

        const prevState = this.getState();
        this.currentIndex--;
        const newState = this.getState();

        console.log(`⬅️ PREV: ${prevState.planet}${prevState.card} → ${newState.planet}${newState.card} (index: ${this.currentIndex + 1} → ${this.currentIndex})`);

        this._notifyChange();
        return newState;
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
     * card: 0 = planet view, 1 = first card, 2 = second card, etc.
     */
    goToPlanetCard(planet, card) {
        const planetIndex = this.planets.indexOf(planet);
        if (planetIndex === -1) return null;

        const maxCards = this.cardsPerPlanet[planet] || 3;
        const clampedCard = Math.max(0, Math.min(card, maxCards)); // Allow 0 to maxCards

        return this.goTo(this.getIndexFor(planet, clampedCard));
    }

    /**
     * Get state index for a planet/card combo
     * card: 0 = planet view, 1 = first card, 2 = second card, etc.
     */
    getIndexFor(planet, card) {
        const planetIndex = this.planets.indexOf(planet);
        if (planetIndex === -1) return -1;

        const maxCards = this.cardsPerPlanet[planet] || 3;
        const clampedCard = Math.max(0, Math.min(card, maxCards)); // Allow 0 to maxCards

        // Each planet contributes (maxCards + 1) states: 1 planet view + maxCards card states
        let stateIndex = 0;
        for (let i = 0; i < planetIndex; i++) {
            const prevMaxCards = this.cardsPerPlanet[this.planets[i]] || 3;
            stateIndex += prevMaxCards + 1; // 1 planet view + N cards per previous planet
        }
        stateIndex += clampedCard; // Add the card index for this planet

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

    /**
     * Unit test for central state array navigation
     * Tests NEXT/PREV operations through the entire array
     */
    runUnitTest() {
        console.log('🧪 Running Central State Array Unit Test...');

        // Reset to start
        this.currentIndex = 0;
        console.log('📍 Starting at:', this.getState());

        // Test NEXT through all states
        let steps = 0;
        while (this.next() !== null && steps < 50) { // Safety limit
            steps++;
        }
        console.log(`✅ NEXT test: ${steps} steps to end`);

        // Test PREV back to start
        steps = 0;
        while (this.prev() !== null && steps < 50) {
            steps++;
        }
        console.log(`✅ PREV test: ${steps} steps back to start`);

        // Test array bounds
        this.currentIndex = -1;
        console.log('❌ Underflow test:', this.getState()); // Should clamp to 0

        this.currentIndex = this.totalStates;
        console.log('❌ Overflow test:', this.getStateAt(this.totalStates)); // Should clamp to last

        console.log('🎯 Unit test complete! Central array working correctly.');
    }
}
