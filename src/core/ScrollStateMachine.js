/**
 * ScrollStateMachine.js
 * Pure state machine for scroll navigation - NO DOM, NO GSAP
 *
 * State Structure:
 * - 9 planets × variable cards per planet
 * - Each state: { index, planet, card }
 * - card: 0 = planet focus, 1-n = card stack (variable per planet)
 */

/**
 * NavigationState - Immutable state representation
 * Single Responsibility: Data container with validation
 */
class NavigationState {
    constructor(planet, card, globalIndex = -1) {
        if (!planet || typeof planet !== 'string') {
            throw new Error('Planet must be a non-empty string');
        }
        if (!Number.isInteger(card) || card < 0) {
            throw new Error('Card must be a non-negative integer');
        }

        this.planet = planet;
        this.card = card;      // 0 = planet view, 1-N = cards
        this.globalIndex = globalIndex; // Global position in navigation graph
        this.index = globalIndex; // Alias for backward compatibility
        Object.freeze(this);   // Immutable
    }

    equals(other) {
        return other instanceof NavigationState &&
               this.planet === other.planet &&
               this.card === other.card;
    }

    toString() {
        return `${this.planet}${this.card}`;
    }

    isPlanetView() {
        return this.card === 0;
    }

    isCardView() {
        return this.card > 0;
    }
}

/**
 * DoublyLinkedListNode - Node for doubly linked list
 * Enables O(1) navigation in both directions
 */
class DoublyLinkedListNode {
    constructor(data) {
        this.data = data;
        this.prev = null;
        this.next = null;
    }
}

/**
 * DoublyLinkedList - Efficient navigation structure
 * Single Responsibility: Bidirectional linked list operations
 * Time Complexity: O(1) for next/prev, O(n) for find operations
 */
class DoublyLinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.current = null;
        this.size = 0;
    }

    append(data) {
        const newNode = new DoublyLinkedListNode(data);

        if (!this.head) {
            this.head = this.tail = this.current = newNode;
        } else {
            newNode.prev = this.tail;
            this.tail.next = newNode;
            this.tail = newNode;
        }

        this.size++;
        return this;
    }

    getCurrent() {
        return this.current ? this.current.data : null;
    }

    next() {
        if (!this.current || !this.current.next) return null;
        this.current = this.current.next;
        this.currentIndex++;
        return this.getCurrent();
    }

    prev() {
        if (!this.current || !this.current.prev) return null;
        this.current = this.current.prev;
        this.currentIndex--;
        return this.getCurrent();
    }

    goTo(predicate) {
        let node = this.head;
        let index = 0;

        while (node) {
            if (predicate(node.data, index)) {
                this.current = node;
                return node.data;
            }
            node = node.next;
            index++;
        }

        return null; // Not found
    }

    findIndex(predicate) {
        let node = this.head;
        let index = 0;

        while (node) {
            if (predicate(node.data, index)) {
                return index;
            }
            node = node.next;
            index++;
        }

        return -1;
    }

    getAt(index) {
        if (index < 0 || index >= this.size) return null;

        let node = this.head;
        for (let i = 0; i < index; i++) {
            node = node.next;
        }

        return node.data;
    }

    get length() {
        return this.size;
    }
}

/**
 * PlanetConfiguration - Immutable configuration repository
 * Single Responsibility: Planet metadata with validation
 * Open/Closed: New planets can be added without modifying existing code
 */
class PlanetConfiguration {
    constructor() {
        // Immutable planet definitions
        this._planets = Object.freeze([
            'earth', 'sun', 'moon', 'mars', 'mercury',
            'jupiter', 'venus', 'saturn', 'neptune'
        ]);

        // Card counts per planet - extensible configuration
        this._cardCounts = Object.freeze({
            earth: 3, sun: 3, moon: 3, mars: 3, mercury: 3,
            jupiter: 3, venus: 3, saturn: 3, neptune: 3
        });
    }

    getPlanets() {
        return [...this._planets]; // Return copy to prevent external mutation
    }

    getCardCount(planet) {
        if (!this.isValidPlanet(planet)) {
            throw new Error(`Invalid planet: ${planet}`);
        }
        return this._cardCounts[planet];
    }

    isValidPlanet(planet) {
        return this._planets.includes(planet);
    }

    getPlanetIndex(planet) {
        return this._planets.indexOf(planet);
    }
}

/**
 * ScrollStateMachine - Main state machine following SOLID principles
 * - Single Responsibility: State management and navigation logic
 * - Open/Closed: Extensible through composition and interfaces
 * - Liskov Substitution: Uses abstract data structures
 * - Interface Segregation: Clean, focused interface
 * - Dependency Inversion: Depends on abstractions, not concretions
 */
export class ScrollStateMachine {
    constructor() {
        this.planetConfig = new PlanetConfiguration();
        this.navigationGraph = new DoublyLinkedList();

        this.buildNavigationGraph();
        this.onStateChange = null;
    }

    /**
     * Build the navigation graph using doubly linked list
     * Each planet contributes: 1 planet view + N card states
     * Creates a linear sequence that can be navigated bidirectionally
     */
    buildNavigationGraph() {
        const planets = this.planetConfig.getPlanets();
        let globalIndex = 0;

        for (const planet of planets) {
            // Planet view state (card = 0)
            this.navigationGraph.append(new NavigationState(planet, 0, globalIndex++));

            // Card states (card = 1 to N)
            const cardCount = this.planetConfig.getCardCount(planet);
            for (let card = 1; card <= cardCount; card++) {
                this.navigationGraph.append(new NavigationState(planet, card, globalIndex++));
            }
        }
    }

    /**
     * Get total number of states in navigation graph
     */
    getTotal() {
        return this.navigationGraph.length;
    }

    /**
     * Get current navigation state
     */
    getState() {
        return this.navigationGraph.getCurrent();
    }

    /**
     * Get state by global index
     */
    getStateAt(index) {
        return this.navigationGraph.getAt(index);
    }

    /**
     * Navigate to next state in linked list
     * O(1) operation due to doubly linked structure
     */
    next() {
        const newState = this.navigationGraph.next();
        if (newState) {
            this._notifyChange();
        }
        return newState;
    }

    /**
     * Navigate to previous state in linked list
     * O(1) operation due to doubly linked structure
     */
    prev() {
        const newState = this.navigationGraph.prev();
        if (newState) {
            this._notifyChange();
        }
        return newState;
    }

    /**
     * Jump to specific state by global index
     * Clamps to valid bounds instead of returning null
     */
    goTo(index) {
        const clampedIndex = Math.max(0, Math.min(index, this.getTotal() - 1));
        const currentState = this.getState();
        const newState = this.navigationGraph.goTo((state, idx) => idx === clampedIndex);

        if (newState && !currentState.equals(newState)) {
            this._notifyChange();
        }

        return newState;
    }

    /**
     * Get the global index for a specific planet and card
     * Useful for direct index calculations
     */
    getIndexFor(planet, card) {
        if (!this.planetConfig.isValidPlanet(planet)) {
            return -1;
        }

        const maxCards = this.planetConfig.getCardCount(planet);
        const clampedCard = Math.max(0, Math.min(card, maxCards));

        // Calculate index: (planet index * states per planet) + card index
        const planetIndex = this.planetConfig.getPlanetIndex(planet);
        return (planetIndex * (maxCards + 1)) + clampedCard;
    }

    /**
     * Jump to specific planet and card state
     * Demonstrates proper data structure usage with predicate functions
     */
    goToPlanetCard(planet, card) {
        if (!this.planetConfig.isValidPlanet(planet)) {
            return null;
        }

        const maxCards = this.planetConfig.getCardCount(planet);
        const clampedCard = Math.max(0, Math.min(card, maxCards));

        // Use linked list's goTo with predicate function
        const newState = this.navigationGraph.goTo(state =>
            state.planet === planet && state.card === clampedCard
        );

        if (newState) {
            this._notifyChange();
        }

        return newState;
    }

    /**
     * Get the number of cards for a specific planet
     * Demonstrates proper abstraction through PlanetConfiguration
     */
    getCardsForPlanet(planet) {
        return this.planetConfig.getCardCount(planet);
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
     * Clean state restoration
     */
    reset() {
        this.navigationGraph.goTo((state, index) => index === 0);
        this._notifyChange();
    }
}
