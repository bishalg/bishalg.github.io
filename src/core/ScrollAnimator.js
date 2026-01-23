import { CONFIG } from '../config.js';
import * as THREE from 'three';
import { ScrollStateMachine } from './ScrollStateMachine.js';

// GSAP is loaded globally
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

/**
 * ScrollAnimator - Simplified with State Machine
 * 
 * Architecture:
 * - ScrollStateMachine owns navigation state (36 states)
 * - This class handles GSAP/DOM visualization
 * - "Next" button calls stateMachine.next(), then scrolls to that state
 */
export class ScrollAnimator {
    constructor(cosmicScene, holocard, solarSystemData) {
        this.cosmicScene = cosmicScene;
        this.holocard = holocard;
        this.solarSystemData = solarSystemData;
        this.currentTarget = null;
        this.animationFrameId = null;
        this.urlUpdateCallback = null;
        this.isNavigating = false; // Navigation lock flag

        // State Machine (source of truth for navigation)
        this.stateMachine = new ScrollStateMachine();

        // Planet camera offsets
        this.planetOffsets = {
            earth: { x: 12, y: 4, z: 12 },
            sun: { x: 0, y: 16, z: 40 },
            moon: { x: 4, y: 2, z: 4 },
            mars: { x: 8, y: 3, z: 8 },
            mercury: { x: 5, y: 2, z: 5 },
            jupiter: { x: 18, y: 6, z: 18 },
            venus: { x: 8, y: 3, z: 8 },
            saturn: { x: 20, y: 8, z: 20 },
            neptune: { x: 15, y: 5, z: 15 }
        };

        this.init();
    }

    init() {
        gsap.registerPlugin(ScrollTrigger);
        this.setupScrollTriggers();
        this.startTrackingLoop();

        // Listen to state machine changes
        this.stateMachine.setOnStateChange((state) => {
            if (state) {
                // Update visuals and URL
                this.updateVisualsForState(state);
                this.updateUrl(state);

                // ONLY scroll/snap if this was NOT a manual scroll
                // If manual, user is already at the position roughly
                if (!this.isManualScrolling) {
                    this.scrollToState(state);
                }
            } else {
                // State is null -> God View
                this.returnToGodView();
                // Clear URL via callback
                if (this.urlUpdateCallback) this.urlUpdateCallback(null, null);
            }
        });
    }

    /**
     * Get current state based on actual scroll position
     * This ensures we always navigate from the current visual state, not stale state machine index
     */
    getCurrentStateFromScroll() {
        const vh = window.innerHeight;
        const currentScroll = window.scrollY || window.pageYOffset;

        // If we're in hero section (scroll < vh), return null (God View)
        if (currentScroll < vh) {
            return null;
        }

        // Calculate which planet section we're in
        let cumulativeScroll = vh; // Start after hero

        for (let planetIndex = 0; planetIndex < this.stateMachine.planets.length; planetIndex++) {
            const planetId = this.stateMachine.planets[planetIndex];
            const cardsForPlanet = this.stateMachine.getCardsForPlanet(planetId);
            const planetScrollHeight = vh * cardsForPlanet; // Each planet has cards vh of scroll space

            // Check if current scroll is within this planet's section
            if (currentScroll < cumulativeScroll + planetScrollHeight) {
                // We're in this planet - calculate which state
                // For N cards, we have N+1 states: planet view (0) + N cards (1 to N)
                const planetRelativeScroll = currentScroll - cumulativeScroll;
                const cardProgress = planetRelativeScroll / planetScrollHeight;
                const cardIndex = Math.min(
                    Math.floor(cardProgress * (cardsForPlanet + 1)),
                    cardsForPlanet
                );

                return {
                    index: this.stateMachine.getIndexFor(planetId, cardIndex),
                    planet: planetId,
                    card: cardIndex
                };
            }

            cumulativeScroll += planetScrollHeight;
        }

        // If we get here, we're past all planets (shouldn't happen with proper pinning)
        return this.stateMachine.getStateAt(this.stateMachine.totalStates - 1);
    }

    /**
     * Navigate to next state (called by Next button)
     * URL is source of truth, so just advance state machine and sync scroll
     */
    goToNextState() {
        // Navigate to next state in state machine
        const newState = this.stateMachine.next();
        if (newState) {
            this.scrollToState(newState);
        }
    }

    /**
     * Navigate to previous state
     * URL is source of truth, so just go to previous state and sync scroll
     */
    goToPrevState() {
        // Navigate to previous state in state machine
        const newState = this.stateMachine.prev();
        if (newState) {
            this.scrollToState(newState);
        } else {
            // Explicitly returned to start (God View)
            this.returnToGodView();
        }
    }

    /**
     * Jump to specific planet/card
     */
    goToPlanetCard(planet, card) {
        const state = this.stateMachine.goToPlanetCard(planet, card);
        if (state) {
            this.scrollToState(state);
        }
    }

    /**
     * Calculate scroll position for a state and scroll there
     * Uses PURE LAYOUT MATH - no DOM offsets (unreliable with GSAP pinning)
     *
     * Layout:
     * - Hero: 0 to 1vh
     * - Each planet: pinned for (cards-1)*100% scroll distance
     */
    scrollToState(state) {
        // On mobile, the Holocard is the primary view/scroll container.
        // We do NOT want to force-scroll the body, as it might cause loops/locking
        // or interfere with the native Holocard scroll snap.
        // But we still need to show the cards properly.
        if (window.innerWidth <= 1024) {
            // For mobile, prepare content and show specific card
            if (this.holocard.currentPlanet !== state.planet) {
                this.holocard.prepareContent(this.solarSystemData[state.planet]);
            }
            // Show the specific card - state.card now directly maps to showSpecificCard parameter
            // state.card = 0: planet view (hide cards)
            // state.card = 1: show card 0, state.card = 2: show card 1, etc.
            this.holocard.showSpecificCard(state.card);
            return;
        }

        const vh = window.innerHeight;
        const heroHeight = vh; // Hero section is 1 viewport height

        const planetIndex = this.stateMachine.planets.indexOf(state.planet);
        const cardsForPlanet = this.stateMachine.getCardsForPlanet(state.planet);
        const pinLength = vh * cardsForPlanet; // Each planet pinned for cards vh (planet view + N cards)

        // Calculate scroll position up to previous planets
        let targetScroll = heroHeight;
        for (let i = 0; i < planetIndex; i++) {
            const prevPlanetCards = this.stateMachine.getCardsForPlanet(this.stateMachine.planets[i]);
            targetScroll += vh * prevPlanetCards; // Each previous planet contributes cards vh
        }

        // Add progress within current planet
        // state.card ranges from 0 (planet view) to cardsForPlanet (last card)
        const cardProgress = state.card / cardsForPlanet;
        targetScroll += cardProgress * pinLength;


        // For programmatic navigation (NEXT button, URL loading)
        // Keep navigating flag true until scroll actually completes
        this.isNavigating = true;
        console.log(`🚀 Starting programmatic navigation to scroll position: ${targetScroll}`);

        // Use Lenis if available, otherwise fallback
        if (window.cosmicApp?.smoothScroll?.lenis) {
            console.log(`🎯 Using Lenis for scroll navigation`);
            window.cosmicApp.smoothScroll.lenis.scrollTo(targetScroll, {
                duration: 1.0,
                onComplete: () => {
                    console.log(`✅ Lenis scroll complete - resetting navigation flag`);
                    this.isNavigating = false;
                }
            });
        } else {
            console.log(`📜 Using native scroll for navigation`);
            window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            // For native scroll, reset after animation completes
            setTimeout(() => {
                console.log(`✅ Native scroll complete - resetting navigation flag`);
                this.isNavigating = false;
            }, 1000);
        }
    }

    /**
     * Update visuals (Holocard, camera) for current state
     */
    updateVisualsForState(state) {
        if (!state) return;
        const { planet, card } = state;
        const data = this.solarSystemData[planet];
        const offset = this.planetOffsets[planet];

        if (!data) {
            console.warn(`No data for planet: ${planet}`);
            return;
        }

        // Focus camera on planet (Slows down simulation for stability)
        this.focusOnPlanet(planet, offset);

        // Prepare content if new planet (creates all cards for the planet)
        if (this.holocard.currentPlanet !== planet) {
            this.holocard.prepareContent(data);
        }

        // Show the specific card based on the card parameter
        // card=0: show card 0, card=1: show card 1, etc.
        this.holocard.showSpecificCard(card);
    }

    /**
     * Update URL with current state
     */
    updateUrl(state) {
        if (this.urlUpdateCallback && state) {
            this.urlUpdateCallback(state.planet, state.card);
        }
    }

    // ========== GSAP/Camera Methods ==========

    getPlanetWorldPosition(planetName) {
        const group = this.cosmicScene.orbitGroups[planetName];
        if (!group) return new THREE.Vector3(0, 0, 0);
        const pos = new THREE.Vector3();
        group.getWorldPosition(pos);
        return pos;
    }

    focusOnPlanet(planetName, cameraOffset = { x: 15, y: 5, z: 15 }) {
        // Slow down simulation for stable tracking
        this.cosmicScene.setSimulationSpeed(0.05);

        const planetPos = this.getPlanetWorldPosition(planetName);
        const camera = this.cosmicScene.camera;

        gsap.to(camera.position, {
            x: planetPos.x + cameraOffset.x,
            y: cameraOffset.y,
            z: planetPos.z + cameraOffset.z,
            duration: 1.0,
            ease: 'power2.out',
            overwrite: true
        });

        this.currentTarget = planetName;
    }

    returnToGodView() {
        // Don't reset if we're in the middle of programmatic navigation
        if (this.isNavigating) {
            console.log(`[${new Date().toISOString()}] 🚫 Skipping returnToGodView (isNavigating)`);
            return;
        }

        // Speed up simulation for dynamic God View
        this.cosmicScene.setSimulationSpeed(0.5);

        const camera = this.cosmicScene.camera;
        const initialPos = CONFIG.camera.initialPosition;

        gsap.to(camera.position, {
            x: initialPos.x,
            y: initialPos.y,
            z: initialPos.z,
            duration: 1.5,
            ease: 'power2.out',
            overwrite: true
        });

        gsap.to(this.cosmicScene.cameraTarget, {
            x: 0, y: 0, z: 0,
            duration: 1.5,
            ease: 'power2.out'
        });

        this.currentTarget = null;
        this.stateMachine.reset(); // Will set index to -1
        this.holocard.hide();

        // Scroll back to top
        if (window.cosmicApp?.smoothScroll?.lenis) {
            window.cosmicApp.smoothScroll.lenis.scrollTo(0, { duration: 1.5 });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    startTrackingLoop() {
        const track = () => {
            if (this.currentTarget) {
                const targetPos = this.getPlanetWorldPosition(this.currentTarget);
                // Direct copy instead of lerp - camera always looks at planet's CURRENT position
                // This prevents "chasing" on orbiting planets
                this.cosmicScene.cameraTarget.copy(targetPos);
            }
            this.animationFrameId = requestAnimationFrame(track);
        };
        track();
    }

    /**
     * Setup scroll triggers - simplified to sync with state machine
     */
    setupScrollTriggers() {
        // Hero section - REMOVED for now to avoid interference with Next button navigation
        // Can be added back after Next button works 100%

        // Planet sections - DISABLED temporarily for debugging
        // Scroll triggers might be causing automatic navigation during load
        console.log('🎯 Scroll triggers DISABLED for debugging - app will use manual navigation only');

        /*
        const planets = this.stateMachine.planets;
        planets.forEach((planetId) => {
            const sceneElement = document.querySelector(`.scene--${planetId}`);
            if (!sceneElement) {
                console.warn(`⚠️ Scene element .scene--${planetId} not found!`);
                return;
            }

            const cardsForPlanet = this.stateMachine.getCardsForPlanet(planetId);
            const scrollDistance = `${cardsForPlanet * 100}%`; // N viewport heights for N+1 states

            ScrollTrigger.create({
                trigger: `.scene--${planetId}`,
                start: 'top top',
                end: `+=${scrollDistance}`,
                pin: true,
                pinSpacing: true,
                onUpdate: (self) => {
                    // Allow scroll to drive state changes when user scrolls manually
                    if (this.isNavigating) {
                        return; // Skip during programmatic navigation
                    }

                    // Calculate which index in CENTRAL STATE ARRAY this scroll represents
                    const progress = self.progress;
                    const planetIndex = this.stateMachine.planets.indexOf(planetId);
                    const cardsForPlanet = this.stateMachine.getCardsForPlanet(planetId);

                    // Each planet has (cardsForPlanet + 1) states in central array
                    const statesPerPlanet = cardsForPlanet + 1;
                    const localStateIndex = Math.min(Math.floor(progress * statesPerPlanet), cardsForPlanet);

                    // Calculate absolute index in central state array
                    let absoluteIndex = 0;
                    for (let i = 0; i < planetIndex; i++) {
                        absoluteIndex += this.stateMachine.getCardsForPlanet(this.stateMachine.planets[i]) + 1;
                    }
                    absoluteIndex += localStateIndex;

                    // Update central array index if user scrolled to new position
                    if (this.stateMachine.currentIndex !== absoluteIndex) {
                        console.log(`📜 Scroll → Central Array: ${this.stateMachine.currentIndex} → ${absoluteIndex}`);
                        this.stateMachine.goTo(absoluteIndex);
                        // This updates URL and visuals automatically
                    }
                }
            });
        });
        */

        // Contact section
        ScrollTrigger.create({
            trigger: '.scene--contact',
            start: 'top 80%',
            onEnter: () => {
                this.holocard.hide();
                gsap.from('.contact-frame', {
                    opacity: 0, y: 50, duration: 1, ease: 'power2.out'
                });
            }
        });

        // Hero animation
        gsap.from('.hud-frame--hero', {
            opacity: 0, y: 30, duration: 1.5, delay: 0.5, ease: 'power3.out'
        });

        console.log('✅ State Machine ScrollTriggers setup complete');
    }

    setUrlUpdateCallback(callback) {
        this.urlUpdateCallback = callback;
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());

        // Clean up holocard animations
        if (this.holocard && this.holocard.destroy) {
            this.holocard.destroy();
        }
    }
}
