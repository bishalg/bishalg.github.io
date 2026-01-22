import { solarSystemData } from '../data/solarSystemData.js';
import { createStatGrid, createProfessionalContent, createPersonalNarrative, createPanelHeader } from './HUDComponents.js';
import { PlanetPreview } from './PlanetPreview.js';
import gsap from 'gsap';

/**
 * Holocard - Holographic CV Card Component
 * Displays planet-specific content in a stack-based card system (Tinder-style)
 */
export class Holocard {
    constructor() {
        // Planet order for navigation
        this.planetOrder = ['earth', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'neptune'];

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

        // Swipe/drag interaction variables
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.currentTranslateX = 0;
        this.currentTranslateY = 0;

        // Callback for when card is swiped away
        this.onCardAdvance = null;

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

        // Setup swipe/drag interactions
        this.setupSwipeHandlers();
    }

    /**
     * Setup swipe and drag handlers for card interactions
     */
    setupSwipeHandlers() {
        // Mouse events for desktop
        this.wrapper.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        this.wrapper.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.wrapper.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        this.wrapper.addEventListener('mouseleave', (e) => this.handlePointerUp(e));

        // Touch events for mobile
        this.wrapper.addEventListener('touchstart', (e) => this.handlePointerDown(e), { passive: false });
        this.wrapper.addEventListener('touchmove', (e) => this.handlePointerMove(e), { passive: false });
        this.wrapper.addEventListener('touchend', (e) => this.handlePointerUp(e), { passive: false });
    }

    /**
     * Handle pointer down event (mouse or touch)
     */
    handlePointerDown(e) {
        if (!this.isVisible || this.cards.length === 0) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        this.isDragging = true;
        this.dragStartX = clientX;
        this.dragStartY = clientY;
        this.currentTranslateX = 0;
        this.currentTranslateY = 0;

        // Add dragging class to top card
        const topCard = this.cards[0]; // Top card is always index 0
        if (topCard) {
            topCard.classList.add('dragging');
        }
    }

    /**
     * Handle pointer move event (mouse or touch)
     */
    handlePointerMove(e) {
        if (!this.isDragging || this.cards.length === 0) return;

        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        this.currentTranslateX = clientX - this.dragStartX;
        this.currentTranslateY = clientY - this.dragStartY;

        // Apply transform to top card
        const topCard = this.cards[0]; // Top card is always index 0
        if (topCard) {
            const rotation = this.currentTranslateX * 0.1; // Slight rotation based on horizontal movement
            // Apply drag transform on top of the base centering transform
            topCard.style.transform = `translate(-50%, -50%) translate(${this.currentTranslateX}px, ${this.currentTranslateY}px) rotate(${rotation}deg)`;
        }
    }

    /**
     * Handle pointer up event (mouse or touch)
     */
    handlePointerUp(e) {
        if (!this.isDragging || this.cards.length === 0) return;

        this.isDragging = false;

        const topCard = this.cards[0]; // Top card is always index 0
        if (!topCard) return;

        topCard.classList.remove('dragging');

        // Check if swipe distance is enough to trigger card removal
        const swipeThreshold = 50; // Reduced for easier testing
        const isSwipeLeft = this.currentTranslateX < -swipeThreshold;
        const isSwipeRight = this.currentTranslateX > swipeThreshold;

        if (isSwipeLeft || isSwipeRight) {
            // Animate card off screen
            const direction = isSwipeLeft ? -1 : 1;
            gsap.to(topCard, {
                x: direction * window.innerWidth,
                rotation: direction * 45,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    // Remove the dismissed card and advance to next card
                    this.removeDismissedCard(topCard);
                    if (this.onCardAdvance) {
                        this.onCardAdvance();
                    }
                }
            });
        } else {
            // Return card to original position
            gsap.to(topCard, {
                x: 0,
                rotation: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }

    /**
     * Remove the dismissed card from the DOM
     */
    removeDismissedCard(cardElement) {
        if (cardElement && cardElement.parentNode) {
            cardElement.parentNode.removeChild(cardElement);
        }
    }

    /**
     * Update card positions in the stack
     * Cards stack from bottom to top: bottom card peeks out, top card is fully visible
     * Array order: [0]=top card (largest), [N]=bottom card (smallest)
     */
    updateCardPositions() {
        const cardCount = this.cards.length;

        this.cards.forEach((card, index) => {
            // Create a visible stack with larger offsets
            // index 0 = top (highest), index N = bottom (lowest)
            const stackOffset = index * 25 - (cardCount - 1) * 12.5; // Larger spacing
            const scale = 1 - (index * 0.08); // More pronounced scaling
            const zIndex = cardCount - index; // Proper z-index stacking

            // Set z-index immediately for proper stacking
            card.style.zIndex = zIndex;

            gsap.to(card, {
                y: stackOffset,
                scale: Math.max(scale, 0.7),
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    }

    /**
     * Navigate to the next screen position
     * Simplified: just triggers scroll by one viewport height
     */
    navigateToNextPlanet() {
        console.log(`[${new Date().toISOString()}] 🔀 Next button clicked - scrolling down`);
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

        // Kill any ongoing animations
        gsap.killTweensOf(this.cards);

        // Reset navigation state when new content is ready (arrival at planet)
        if (this.isNavigating) {
            console.log('✅ Navigation complete, arrived at ' + data.id);
            this.isNavigating = false;
            if (this.nextBtn) this.nextBtn.classList.remove('disabled');
        }

        // Update accent color
        this.wrapper.style.setProperty('--accent-color', data.accentColor);

        // Clear existing cards
        this.stackContainer.innerHTML = '';
        this.cards = [];

        // Create multiple cards for this planet (up to 4)
        const cardContents = this.createCardContents(data);

        cardContents.forEach((content, index) => {
            const card = this.createCard(content, index);
            this.stackContainer.appendChild(card);
            this.cards.push(card);
        });

        this.currentPlanet = data.id;
        this.currentCardIndex = 0;

        // Initialize 3D Preview in the first card's circle (if it has one)
        requestAnimationFrame(() => {
            const circleContainer = this.cards[0]?.querySelector('.holo-circle');
            if (circleContainer) {
                // Clear any existing content
                circleContainer.innerHTML = '';

                // Check if WebGL is available
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

                if (gl) {
                    // WebGL available, try 3D preview
                    try {
                        this.planetPreview.mount(circleContainer, data.id);
                    } catch (error) {
                        console.warn('3D preview failed, using fallback:', error);
                        this.createFallbackCircle(circleContainer, data);
                    }
                } else {
                    // No WebGL, use fallback circle
                    console.log('WebGL not available, using fallback circle');
                    this.createFallbackCircle(circleContainer, data);
                }
            }
        });

        // Position cards in stack
        this.updateCardPositions();

        // Hide the wrapper/backdrop for clean Card 0 view
        this.wrapper.classList.remove('visible');
        this.wrapper.classList.add('hidden');
        this.isVisible = false;

        console.log(`[${new Date().toISOString()}] 🎴 Prepared ${this.cards.length} cards for: ${data.id}`);
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
     * Create insights content for the 4th card
     */
    createInsightsContent(data) {
        let content = '<div class="insights-content">';

        // Add projects if available
        if (data.professional?.projects) {
            content += '<h3>Key Projects</h3>';
            data.professional.projects.forEach(project => {
                content += `
                    <div class="project-highlight">
                        <strong>${project.name}</strong>
                        <p>${project.desc}</p>
                        <small>${project.stack}</small>
                    </div>
                `;
            });
        }

        // Add podcasts if available
        if (data.professional?.podcasts) {
            content += '<h3>Recent Podcasts</h3>';
            data.professional.podcasts.forEach(podcast => {
                content += `
                    <div class="podcast-highlight">
                        <div class="pod-title">${podcast.title}</div>
                        <div class="pod-context">${podcast.context}</div>
                    </div>
                `;
            });
        }

        content += '</div>';
        return content;
    }

    /**
     * Create a fallback circle when 3D preview is not available
     */
    createFallbackCircle(container, data) {
        const circle = document.createElement('div');
        circle.className = 'fallback-circle';
        circle.innerHTML = `
            <div class="fallback-circle-content">
                <div class="fallback-circle-symbol">${data.title.charAt(0)}</div>
                <div class="fallback-circle-label">${data.title}</div>
            </div>
        `;
        circle.style.setProperty('--accent-color', data.accentColor);
        container.appendChild(circle);
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

    setUpdateStateCallback(callback) {
        this.onUpdateState = callback;
    }

    setCardAdvanceCallback(callback) {
        this.onCardAdvance = callback;
    }

    /**
     * Show the card stack with fly-in animation
     * Returns true if cards were shown, false if no cards available
     */
    showNextPanel() {
        if (this.cards.length === 0) return false;

        // Make wrapper visible
        this.wrapper.classList.remove('hidden');
        this.wrapper.classList.add('visible');
        this.isVisible = true;

        // Animate cards in with staggered opacity effect
        // Positions are already set by updateCardPositions()
        this.cards.forEach((card, index) => {
            gsap.fromTo(card,
                { opacity: 0 },
                {
                    opacity: 1,
                    duration: 0.8,
                    delay: index * 0.15, // Slightly longer stagger for stack effect
                    ease: 'power3.out'
                }
            );
        });

        return true;
    }

    /**
     * Show only the specific card at the given index
     */
    showSpecificCard(cardIndex) {
        // Make wrapper visible if not already
        if (!this.isVisible) {
            this.wrapper.classList.remove('hidden');
            this.wrapper.classList.add('visible');
            this.isVisible = true;
        }

        // Show only the specified card, hide all others
        this.cards.forEach((card, index) => {
            if (index === cardIndex) {
                // Show this card
                gsap.to(card, {
                    opacity: 1,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            } else {
                // Hide other cards
                gsap.to(card, {
                    opacity: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });
    }

    /**
     * Hide the last visible card (for scrolling back)
     * In stack system, this removes the top card
     */
    hideLastPanel() {
        if (this.cards.length <= 0) return false;

        const topCard = this.cards[0];
        if (!topCard) return false;

        gsap.to(topCard, {
            opacity: 0,
            y: -50,
            scale: 0.8,
            duration: 0.5,
            ease: 'power2.in',
            onComplete: () => {
                this.removeTopCard();
            }
        });

        return true;
    }

    /**
     * Fully hide all cards and reset
     */
    hide() {
        if (!this.isVisible && this.cards.length === 0) return;

        gsap.to(this.cards, {
            opacity: 0,
            y: 50,
            scale: 0.9,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.in',
            onComplete: () => {
                this.wrapper.classList.remove('visible');
                this.wrapper.classList.add('hidden');
                this.isVisible = false;
                this.cards = [];
                this.currentPlanet = null;
                this.currentCardIndex = 0;

                // Stop the 3D preview to save resources
                if (this.planetPreview) {
                    this.planetPreview.stop();
                }
            }
        });
    }

    // Legacy show method for backward compatibility
    show(data) {
        this.prepareContent(data);
        // Show all cards at once (legacy behavior)
        this.showNextPanel();
    }
}
