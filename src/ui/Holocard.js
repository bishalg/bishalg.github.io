import { solarSystemData } from '../data/solarSystemData.js';
import { createStatGrid, createProfessionalContent, createPersonalNarrative, createPanelHeader } from './HUDComponents.js';
import { PlanetPreview } from './PlanetPreview.js';

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
        this.cardAnimations = new Map(); // Store ScrollTrigger instances per card
        this.currentPlanetScenes = null; // Store current planet's scroll scenes

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
            // Create inverted stack: bottom cards bigger, upper cards smaller
            // index 0 = bottom (largest), index N = top (smallest)
            const stackOffset = index * 25 - (cardCount - 1) * 12.5; // Higher index = higher position
            const scale = 1 - (index * 0.08); // Higher index = smaller scale
            const zIndex = cardCount - index; // Higher index = lower z-index

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

                // Improved detection for fallback scenarios
                const shouldUseFallback = this.shouldUseFallback();

                if (shouldUseFallback) {
                    console.log('Using fallback circle for mobile/Cursor environment');
                    this.createFallbackCircle(circleContainer, data);
                } else {
                    // WebGL available, try 3D preview
                    try {
                        this.planetPreview.mount(circleContainer, data.id);
                    } catch (error) {
                        console.warn('3D preview failed, using fallback:', error);
                        this.createFallbackCircle(circleContainer, data);
                    }
                }
            }
        });

        // Position cards in stack
        this.updateCardPositions();

        // Setup scroll-based animations for this planet's cards (disabled for now)
        // this.setupCardAnimations(data.id);

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
     * Determine if we should use fallback instead of 3D preview
     * Use fallback on mobile devices, small screens, low-performance devices, or Cursor browser
     */
    shouldUseFallback() {
        // Check for mobile devices
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        window.innerWidth <= 1024 ||
                        window.innerHeight <= 768;

        // Check for Cursor environment or development environments
        const isDevEnv = navigator.userAgent.includes('Cursor') ||
                        navigator.userAgent.includes('Electron') ||
                        window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.protocol === 'file:';

        // Check for low-performance devices (older hardware)
        const isLowPerformance = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;

        // Check WebGL support more thoroughly
        let hasWebGL = false;
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2');
            hasWebGL = !!gl;
            if (gl) {
                // Test if WebGL actually works by trying to compile a simple shader
                const vertexShader = gl.createShader(gl.VERTEX_SHADER);
                gl.shaderSource(vertexShader, 'attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0.0, 1.0); }');
                gl.compileShader(vertexShader);
                hasWebGL = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
            }
        } catch (e) {
            hasWebGL = false;
        }

        // Use fallback if: mobile, dev environment, low performance, or no WebGL
        const shouldFallback = isMobile || isDevEnv || isLowPerformance || !hasWebGL;

        if (shouldFallback) {
            console.log('Using fallback planet rendering. Reasons:', {
                isMobile,
                isDevEnv,
                isLowPerformance,
                hasWebGL: !hasWebGL
            });
        }

        return shouldFallback;
    }

    /**
     * Create a fallback circle when 3D preview is not available
     * Now creates solid colored spheres with texture overlays
     */
    createFallbackCircle(container, data) {
        // Import CONFIG to get planet colors and textures
        import('../config.js').then(({ CONFIG }) => {
            const planetConfig = CONFIG.planets[data.id];
            const planetColor = planetConfig ? planetConfig.color : data.accentColor;

            const circle = document.createElement('div');
            circle.className = 'fallback-circle';

            // Create solid colored sphere with gradient
            const colorHex = '#' + planetColor.toString(16).padStart(6, '0');

            circle.innerHTML = `
                <div class="fallback-sphere" style="
                    background: radial-gradient(circle at 30% 30%,
                        ${this.lightenColor(colorHex, 40)} 0%,
                        ${colorHex} 40%,
                        ${this.darkenColor(colorHex, 30)} 100%);
                    box-shadow:
                        inset -20px -20px 40px rgba(0,0,0,0.3),
                        inset 20px 20px 40px rgba(255,255,255,0.1),
                        0 0 30px ${colorHex}40;">
                </div>
                <div class="fallback-circle-content">
                    <div class="fallback-circle-label">${data.title}</div>
                </div>
            `;

            // Add texture overlay if available
            if (planetConfig && planetConfig.texture) {
                const textureOverlay = document.createElement('div');
                textureOverlay.className = 'fallback-texture-overlay';
                textureOverlay.style.backgroundImage = `url(${planetConfig.texture})`;
                textureOverlay.style.opacity = '0.3';
                circle.appendChild(textureOverlay);
            }

            container.appendChild(circle);
        }).catch(error => {
            console.warn('Could not load CONFIG for fallback, using basic fallback:', error);
            // Fallback to basic version if CONFIG import fails
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
        });
    }

    /**
     * Utility function to lighten a color
     */
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Utility function to darken a color
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
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
     * Setup scroll-based animations for cards in a planet section
     * Each card flies in from a different direction based on its position
     */
    setupCardAnimations(planetId) {
        // Kill existing animations for this planet
        this.killCardAnimations();

        // Set up animations for each card
        this.cards.forEach((card, index) => {
            this.setupIndividualCardAnimation(card, index, planetId);
        });
    }

    /**
     * Setup animation for a single card based on its position
     */
    setupIndividualCardAnimation(card, index, planetId) {
        const planetScene = document.querySelector(`.scene--${planetId}`);
        if (!planetScene) return;

        // Define fly-in direction and properties based on card index
        const animations = [
            // Card 0 (Stats): Fly in from left
            {
                startX: -100,
                startY: 0,
                startRotation: -15,
                endX: 0,
                endY: 0,
                endRotation: 0
            },
            // Card 1 (Personal): Fly in from right
            {
                startX: 100,
                startY: 0,
                startRotation: 15,
                endX: 0,
                endY: 0,
                endRotation: 0
            },
            // Card 2 (Professional): Fly in from bottom
            {
                startX: 0,
                startY: 100,
                startRotation: 0,
                endX: 0,
                endY: 0,
                endRotation: 0
            }
        ];

        const animation = animations[index] || animations[0];

        // Set initial state (off-screen)
        gsap.set(card, {
            x: animation.startX,
            y: animation.startY,
            rotation: animation.startRotation,
            opacity: 0,
            scale: 0.8
        });

        // Create scroll-triggered animation
        const trigger = ScrollTrigger.create({
            trigger: planetScene,
            start: `top+=${(index + 1) * 25}% center`, // Stagger the trigger points
            end: `top+=${(index + 1) * 25 + 30}% center`,
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress;

                // Smooth easing for the fly-in effect
                const easedProgress = gsap.utils.easeInOut(progress);

                gsap.to(card, {
                    x: animation.startX + (animation.endX - animation.startX) * easedProgress,
                    y: animation.startY + (animation.endY - animation.startY) * easedProgress,
                    rotation: animation.startRotation + (animation.endRotation - animation.startRotation) * easedProgress,
                    opacity: easedProgress,
                    scale: 0.8 + (1 - 0.8) * easedProgress,
                    duration: 0.1, // Very fast update for smooth scrubbing
                    ease: 'none'
                });
            }
        });

        // Store the animation reference
        this.cardAnimations.set(card, trigger);
    }

    /**
     * Kill all card animations
     */
    killCardAnimations() {
        this.cardAnimations.forEach((trigger, card) => {
            if (trigger) {
                trigger.kill();
            }
        });
        this.cardAnimations.clear();
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
     * Show cards in stack (desktop) or single card (mobile) starting from the specific card index
     * cardIndex=0: Hide all cards (planet view)
     * cardIndex=1: Show cards 0,1,2 in stack (card 1 on top) [desktop] OR show card 0 [mobile]
     * cardIndex=2: Show cards 1,2,3 in stack (card 2 on top) [desktop] OR show card 1 [mobile]
     * cardIndex=3: Show cards 2,3 in stack (card 3 on top) [desktop] OR show card 2 [mobile]
     */
    showSpecificCard(cardIndex) {
        // card=0 means planet view - hide all cards
        if (cardIndex === 0) {
            this.wrapper.classList.add('hidden');
            this.wrapper.classList.remove('visible');
            this.isVisible = false;
            return;
        }

        // Make wrapper visible if not already
        if (!this.isVisible) {
            this.wrapper.classList.remove('hidden');
            this.wrapper.classList.add('visible');
            this.isVisible = true;
        }

        const isMobile = window.innerWidth <= 1024;

        if (isMobile) {
            // Mobile: Add subtle fly-in animation for the appearing card
            const targetCardIndex = cardIndex - 1; // cardIndex 1 = card 0, etc.

            // First, hide all cards instantly
            this.cards.forEach((card) => {
                gsap.set(card, { opacity: 0 });
            });

            // Then animate the target card in with cosmic fly-in effect
            if (this.cards[targetCardIndex]) {
                const card = this.cards[targetCardIndex];

                // Set initial cosmic warp state
                gsap.set(card, {
                    x: 80,
                    y: -40,
                    rotation: -15,
                    scale: 0.5,
                    opacity: 0,
                    filter: 'blur(12px) brightness(1.8) contrast(1.4)',
                    transformOrigin: 'center center'
                });

                // Animate in with dramatic cosmic effect
                gsap.to(card, {
                    x: 0,
                    y: 0,
                    rotation: 0,
                    scale: 1,
                    opacity: 1,
                    filter: 'blur(0px) brightness(1) contrast(1)',
                    duration: 1.5, // Much slower for mobile too
                    ease: 'power2.out', // Smooth cosmic easing
                    onStart: () => {
                        // Add cosmic glow during animation
                        card.style.boxShadow = '0 0 60px rgba(0, 243, 255, 0.4), 0 0 120px rgba(255, 170, 0, 0.3), inset 0 0 40px rgba(0, 243, 255, 0.1)';
                    },
                    onComplete: () => {
                        // Remove glow and scroll to card
                        card.style.boxShadow = '';
                        setTimeout(() => {
                            card.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }, 300);
                    }
                });
            }
        } else {
            // Desktop: Show cards in stack with fly-in animation
            const startIndex = cardIndex - 1;

            // Hide cards that should not be visible with cosmic dissolve
            this.cards.forEach((card, index) => {
                if (index < startIndex) {
                    gsap.to(card, {
                        opacity: 0,
                        scale: 0.8,
                        y: -20,
                        filter: 'blur(8px) brightness(0.5)',
                        duration: 0.8, // Slower dissolve
                        ease: 'power2.in',
                        onStart: () => {
                            // Add dissolving effect
                            card.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.3)';
                        },
                        onComplete: () => {
                            card.style.boxShadow = '';
                        }
                    });
                } else {
                    // Show cards in stack with cosmic fly-in animation
                    const cosmicAnimations = [
                        // Card 0: Warp in from left with quantum drift
                        {
                            startX: -120,
                            startY: -30,
                            startRotation: -25,
                            startScale: 0.7,
                            warpEffect: { filter: 'blur(8px) brightness(1.5)' }
                        },
                        // Card 1: Materialize from right with energy surge
                        {
                            startX: 120,
                            startY: 30,
                            startRotation: 25,
                            startScale: 0.8,
                            warpEffect: { filter: 'blur(6px) hue-rotate(180deg)' }
                        },
                        // Card 2: Emerge from below with gravitational pull
                        {
                            startX: 0,
                            startY: 150,
                            startRotation: 0,
                            startScale: 0.6,
                            warpEffect: { filter: 'blur(10px) contrast(1.3)' }
                        }
                    ];

                    const animIndex = index - startIndex;
                    const cosmicAnim = cosmicAnimations[animIndex] || cosmicAnimations[0];

                    // Set initial cosmic warp state
                    gsap.set(card, {
                        opacity: 0,
                        x: cosmicAnim.startX,
                        y: cosmicAnim.startY,
                        rotation: cosmicAnim.startRotation,
                        scale: cosmicAnim.startScale,
                        filter: cosmicAnim.warpEffect.filter,
                        transformOrigin: 'center center'
                    });

                    // Animate to normal state with cosmic easing
                    gsap.to(card, {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        rotation: 0,
                        scale: 1,
                        filter: 'blur(0px) brightness(1) contrast(1) hue-rotate(0deg)',
                        duration: 1.8, // Much slower and more visible
                        delay: animIndex * 0.4, // More staggered for dramatic effect
                        ease: 'power2.out', // Smoother, more cosmic easing
                        onStart: () => {
                            // Add subtle glow effect during animation
                            card.style.boxShadow = '0 0 40px rgba(0, 243, 255, 0.3), 0 0 80px rgba(255, 170, 0, 0.2)';
                        },
                        onComplete: () => {
                            // Remove glow after animation
                            card.style.boxShadow = '';
                        }
                    });
                }
            });

            // Update the stack positions for the visible cards
            const visibleCards = this.cards.slice(startIndex);
            this.updateStackPositions(visibleCards, startIndex);
        }
    }

    /**
     * Update stack positions for a subset of cards
     */
    updateStackPositions(cardsToPosition, offsetIndex = 0) {
        const cardCount = cardsToPosition.length;

        cardsToPosition.forEach((card, localIndex) => {
            const globalIndex = offsetIndex + localIndex;
            // Create inverted stack: bottom cards bigger, upper cards smaller
            const stackOffset = localIndex * 25 - (cardCount - 1) * 12.5; // Higher localIndex = higher position
            const scale = 1 - (localIndex * 0.08); // Higher localIndex = smaller scale
            const zIndex = cardCount - localIndex; // Higher localIndex = lower z-index

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

    /**
     * Clean up animations and resources
     */
    destroy() {
        this.killCardAnimations();

        // Kill any ongoing GSAP animations
        gsap.killTweensOf(this.cards);

        // Stop planet preview
        if (this.planetPreview) {
            this.planetPreview.dispose();
        }

        // Remove event listeners and clean up DOM
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }

        if (this.nextBtn && this.nextBtn.parentNode) {
            this.nextBtn.parentNode.removeChild(this.nextBtn);
        }
    }
}
