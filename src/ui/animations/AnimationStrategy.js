/**
 * AnimationStrategy.js
 * Base class for Holocard animation strategies
 */

export class AnimationStrategy {
    constructor() {
        if (this.constructor === AnimationStrategy) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }

    /**
     * Called when a planet section is entered
     * @param {HTMLElement} container - The container element for cards
     * @param {Array} cards - Array of card elements
     * @param {Object} data - Planet data
     */
    enter(container, cards, data) {
        throw new Error("Method 'enter()' must be implemented.");
    }

    /**
     * Called to update the visual state of cards
     * @param {Array} cards - Array of card elements
     * @param {number} activeIndex - The current active card index (0 for planet view, 1+ for specific cards)
     * @param {number} progress - Continuous progress (0.0 to 1.0) within current state (optional)
     */
    update(cards, activeIndex, progress = 0) {
        throw new Error("Method 'update()' must be implemented.");
    }

    /**
     * Called when leaving a planet section or hiding cards
     * @param {Array} cards - Array of card elements
     */
    exit(cards) {
        throw new Error("Method 'exit()' must be implemented.");
    }
}
