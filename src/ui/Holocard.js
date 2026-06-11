import { solarSystemData } from '../data/solarSystemData.js';
import { createStatGrid, createProfessionalContent, createPersonalNarrative, createPanelHeader } from './HUDComponents.js';
import { PlanetPreview } from './PlanetPreview.js';
import { SimpleFadeStrategy } from './animations/SimpleFadeStrategy.js';

// GSAP is loaded globally
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

/**
 * Holocard - Holographic CV Card Component
 * Displays planet-specific content in a stack-based card system (Tinder-style)
 */
export class Holocard {
    constructor() {
        // Planet order for navigation
        this.planetOrder = ['earth', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'neptune'];

        // Animation Strategy - Default to SimpleFade
        this.strategy = new SimpleFadeStrategy();

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'holocard-wrapper hidden';
        this.wrapper.innerHTML = `
            <div class="holocard-backdrop"></div>
            <div class="holocard-stack">
                <!-- Cards will be dynamically added here -->
            </div>
        `;
        document.body.appendChild(this.wrapper);

        this.stackContainer = this.wrapper.querySelector('.holocard-stack');

        // Create Next button as a fixed element (always visible)
        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'holocard-next-btn';
        this.nextBtn.setAttribute('aria-label', 'Go to next planet');
        this.nextBtn.innerHTML = '→';
        document.body.appendChild(this.nextBtn);

        this.cards = []; // Array to hold card elements
        this.isVisible = false;
        this.currentPlanet = null;
        this.currentCardIndex = 0;
        this.maxCardsInStack = 4; // Support up to 4 cards in stack

        // Callback for scroll navigation (set from main.js)
        this.onNavigateToNext = null;
        this.isNavigating = false;

        // 3D Planet Preview
        this.planetPreview = new PlanetPreview();

        // Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger);

        // Animation state
        this.cardAnimations = new Map(); // Store ScrollTrigger instances per card (DEPRECATED: specific to strategy)
        this.currentPlanetScenes = null; // Store current planet's scroll scenes

        // Close on backdrop click
        this.wrapper.querySelector('.holocard-backdrop').addEventListener('click', () => this.hide());

        // Next button click handler with 400ms debounce
        this.nextBtn.addEventListener('click', () => {
            if (this.isClicking) return;
            this.isClicking = true;
            this.nextBtn.classList.add('disabled');

            this.navigateToNextPlanet();

            setTimeout(() => {
                this.isClicking = false;
                this.nextBtn.classList.remove('disabled');
            }, 400); // 400ms debounce
        });
    }

    /**
     * Navigate to the next screen position
     * Simplified: just triggers scroll by one viewport height
     */
    navigateToNextPlanet() {
        if (this.onNavigateToNext) {
            this.onNavigateToNext();
        }
    }

    /**
     * Set the navigation callback
     */
    setNavigationCallback(callback) {
        this.onNavigateToNext = callback;
    }

    /**
     * Prepare card content for a planet (but don't show yet)
     */
    prepareContent(data) {
        if (!data) return;

        // Reset navigation state when new content is ready (arrival at planet)
        if (this.isNavigating) {
            this.isNavigating = false;
            if (this.nextBtn) this.nextBtn.classList.remove('disabled');
        }

        // Update accent color
        this.wrapper.style.setProperty('--accent-color', data.accentColor);

        // Clear existing cards
        this.stackContainer.innerHTML = '';
        this.cards = [];

        // Create multiple cards for this planet
        const cardContents = this.createCardContents(data);

        cardContents.forEach((content, index) => {
            const card = this.createCard(content, index);
            this.stackContainer.appendChild(card);
            this.cards.push(card);
        });

        this.currentPlanet = data.id;
        this.currentCardIndex = 0;

        // Hide the wrapper/backdrop for clean Card 0 view initially
        this.wrapper.classList.remove('visible');
        this.wrapper.classList.add('hidden');
        this.isVisible = false;

        // Delegate visual setup to strategy
        this.strategy.enter(this.wrapper, this.cards, data);
    }

    /**
     * Create card contents based on planet data
     */
    createCardContents(data) {
        const contents = [];

        // Card 1: Stats & 3D Preview
        contents.push({
            type: 'stats',
            content: createStatGrid(data),
            title: data.title, // Use planet name as card title
            className: 'card-stats'
        });

        // Card 2: Personal Narrative
        contents.push({
            type: 'personal',
            content: createPanelHeader(data) + createPersonalNarrative(data),
            title: 'Personal',
            className: 'card-personal'
        });

        // Card 3: Professional Content
        contents.push({
            type: 'professional',
            content: createProfessionalContent(data.professional),
            title: 'Professional',
            className: 'card-professional'
        });

        return contents;
    }

    /**
     * Create a single card element
     */
    createCard(cardData, index) {
        const card = document.createElement('div');
        card.className = `holo-card ${cardData.className}`;
        card.dataset.cardIndex = index;

        card.innerHTML = `
            <div class="card-header">
                <h2>${cardData.title}</h2>
            </div>
            <div class="card-content">
                ${cardData.content}
            </div>
        `;

        return card;
    }

    /**
     * Show cards based on scroll state
     * Delegated to Strategy
     */
    showSpecificCard(cardIndex, progress = 0) {
        // card=0 means planet view - typically hide all cards
        if (cardIndex === 0) {
            this.wrapper.classList.remove('visible');
            this.wrapper.classList.add('hidden');
            this.isVisible = false;
        } else {
            if (!this.isVisible) {
                this.wrapper.classList.remove('hidden');
                this.wrapper.classList.add('visible');
                this.isVisible = true;
            }
        }

        this.strategy.update(this.cards, cardIndex, progress);
    }

    /**
     * Fully hide all cards and reset
     * Delegated to Strategy
     */
    hide() {
        if (!this.isVisible && this.cards.length === 0) return;

        this.strategy.exit(this.cards);

        setTimeout(() => {
            this.wrapper.classList.remove('visible');
            this.wrapper.classList.add('hidden');
            this.isVisible = false;
            this.cards = [];
            this.currentPlanet = null;
            this.currentCardIndex = 0;

            if (this.planetPreview) {
                this.planetPreview.stop();
            }
        }, 300);
    }

    /**
     * Set strategy dynamically
     */
    setStrategy(strategy) {
        this.strategy = strategy;
    }

    /**
     * Clean up animations and resources
     */
    destroy() {
        if (this.planetPreview) {
            this.planetPreview.dispose();
        }
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }
        if (this.nextBtn && this.nextBtn.parentNode) {
            this.nextBtn.parentNode.removeChild(this.nextBtn);
        }
    }
}
