/**
 * SimpleFadeStrategy.js
 * Implements a simple fade-in/out animation for cards.
 * No complex transforms, just opacity and display toggling.
 */
import { AnimationStrategy } from './AnimationStrategy.js';

// GSAP is expected to be loaded globally
const gsap = window.gsap;

export class SimpleFadeStrategy extends AnimationStrategy {
    constructor() {
        super();
    }

    enter(container, cards, data) {
        // Initial setup for cards when entering a new planet
        cards.forEach((card, index) => {
            gsap.set(card, {
                opacity: 0,
                display: 'none',
                scale: 1,
                x: 0,
                y: 0,
                rotation: 0,
                zIndex: cards.length - index
            });
        });
    }

    update(cards, activeIndex, progress = 0) {
        // activeIndex 0 = Planet View (no cards)
        // activeIndex 1 = Card 0
        // activeIndex 2 = Card 1
        // etc.

        if (activeIndex === 0) {
            this.exit(cards);
            return;
        }

        const targetArrayIndex = activeIndex - 1;

        cards.forEach((card, index) => {
            if (index === targetArrayIndex) {
                // Show this card
                if (card.style.display !== 'block' || card.style.opacity < 1) {
                    card.style.display = 'block';
                    gsap.to(card, {
                        opacity: 1,
                        duration: 0.3,
                        overwrite: true
                    });
                }
            } else {
                // Hide other cards
                if (card.style.display !== 'none') {
                    gsap.to(card, {
                        opacity: 0,
                        duration: 0.2,
                        overwrite: true,
                        onComplete: () => {
                            card.style.display = 'none';
                        }
                    });
                }
            }
        });
    }

    exit(cards) {
        cards.forEach(card => {
            gsap.to(card, {
                opacity: 0,
                duration: 0.3,
                overwrite: true,
                onComplete: () => {
                    card.style.display = 'none';
                }
            });
        });
    }
}
