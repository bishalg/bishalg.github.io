/**
 * main.js
 * Entry point for the Cosmic CV
 */
import { CosmicScene } from './core/CosmicScene.js';
import { ScrollAnimator } from './core/ScrollAnimator.js';
import { Holocard } from './ui/Holocard.js';
import { solarSystemData } from './data/solarSystemData.js';
import * as THREE from 'three';

// GSAP and Lenis are loaded globally
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;

// Make globals available if needed by legacy scripts (though we should avoid this)
window.THREE = THREE;
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;

class App {
    constructor() {
        this.init();
    }

    init() {
        // Simple loading simulation - start immediately since textures load asynchronously
        const loaderText = document.querySelector('.loader-text');
        if (!loaderText) {
            return; // Silent fail in production
        }

        // Show loading progress animation
        let progress = 0;
        const loaderBar = document.querySelector('.loader-bar');
        const loader = document.getElementById('loader');

        const progressInterval = setInterval(() => {
            progress += Math.random() * 15; // Random progress increments
            if (progress > 100) progress = 100;

            if (loaderText) {
                loaderText.textContent = `INITIALIZING COSMIC TIMELINE... ${Math.floor(progress)}%`;
            }

            if (loaderBar) {
                loaderBar.style.setProperty('--progress', `${progress}%`);
                loaderBar.classList.add('loader-bar--progress');
            }

            if (progress >= 100) {
                clearInterval(progressInterval);

                // Hide loader and start
                if (loader) {
                    loader.classList.add('loader--hidden');
                    setTimeout(() => {
                        if (loader.parentNode) {
                            loader.parentNode.removeChild(loader);
                        }
                        this.start();
                    }, 800);
                }
            }
        }, 200);

        // Initialize Components
        this.cosmicScene = new CosmicScene();
        this.holocard = new Holocard();

        // Initialize Scroll Animator with Holocard for sequential reveals
        this.scrollAnimator = new ScrollAnimator(
            this.cosmicScene,
            this.holocard,
            solarSystemData
        );

        this.smoothScroll = new SmoothScroll();

        // Setup Time Travel button click handler
        this.setupTimeTravelButton();

        // Setup holocard navigation callback for next button
        this.setupHolocardNavigation();

        // Setup planet click to scroll handler
        this.setupPlanetClickHandler();

        // Setup scroll-based visibility for the Next button
        this.setupNextButtonVisibility();

        // Setup scroll-to-top button
        this.setupScrollTopButton();

        // Setup URL state sync (deep linking)
        this.setupUrlStateSync();


        // Ensure we start within reasonable time even if progress simulation fails
        setTimeout(() => {
            if (!loader.classList.contains('loader--hidden')) {
                clearInterval(progressInterval);
                console.log('⏰ Forcing start after timeout...');
                loader.classList.add('loader--hidden');
                setTimeout(() => {
                    if (loader.parentNode) {
                        loader.parentNode.removeChild(loader);
                    }
                    this.start();
                }, 800);
            }
        }, 5000);
    }

    // Valid planet IDs for URL validation
    static VALID_PLANETS = ['earth', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'neptune'];
    static MAX_CARDS = 3; // Card states per planet (0=planet view, 1-3=card states)

    /**
     * Setup URL state sync - read params on load, update on scroll
     */
    setupUrlStateSync() {
        const params = new URLSearchParams(window.location.search);
        const planet = params.get('planet');
        const cardParam = params.get('card');

        // Only restore state if URL actually has parameters
        if (planet && cardParam !== null && App.VALID_PLANETS.includes(planet)) {
            // Clamp card to valid range (0=planet view, 1-MAX_CARDS=card states)
            let card = parseInt(cardParam, 10);
            if (isNaN(card) || card < 0) card = 0;
            if (card > App.MAX_CARDS) card = App.MAX_CARDS;

            // Wait for smooth scroll to be ready, then scroll
            setTimeout(() => {
                this.scrollToPlanetCard(planet, card);
            }, 500); // Delay to allow GSAP triggers to initialize
        }

        // Set callback for scroll animator to update URL
        // Now passes NavigationState objects following SOLID principles
        this.scrollAnimator.setUrlUpdateCallback((state) => {
            this.updateUrlState(state);
        });
    }

    /**
     * Scroll to a specific planet and card state
     */
    scrollToPlanetCard(planet, card) {
        // Delegate to state machine for consistent navigation
        this.scrollAnimator.goToPlanetCard(planet, card);
    }

    /**
     * Update URL with current state (no page reload)
     * Now works with NavigationState objects following SOLID principles
     */
    updateUrlState(state) {
        // Handle different input types (backward compatibility)
        let planet, card;
        if (state && typeof state === 'object' && state.planet) {
            // New NavigationState object
            planet = state.planet;
            card = state.card;
        } else if (typeof state === 'string') {
            // Legacy string format (planet name)
            planet = state;
            card = arguments[1] || 0;
        } else {
            // Invalid state
            return;
        }

        // If at initial state (earth, card 0), clear URL to clean state
        if (planet === 'earth' && card === 0) {
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        // If no planet (God View), clear params
        if (!planet) {
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        if (!App.VALID_PLANETS.includes(planet)) return;

        const params = new URLSearchParams();
        params.set('planet', planet);
        params.set('card', Math.min(card, App.MAX_CARDS).toString());

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    setupNextButtonVisibility() {
        // Show Next button when scrolling past the hero section
        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.create({
            trigger: '.scene--earth',
            start: 'top 80%',
            onEnter: () => {
                if (this.holocard.nextBtn) {
                    this.holocard.nextBtn.classList.add('visible');
                }
            },
            onLeaveBack: () => {
                if (this.holocard.nextBtn) {
                    this.holocard.nextBtn.classList.remove('visible');
                }
            }
        });
    }

    setupHolocardNavigation() {
        // Navigation via state machine (Next Button)
        this.holocard.setNavigationCallback(() => {
            this.scrollAnimator.goToNextState();
        });

        // Mobile Scroll Navigation (Natural Scroll)
        this.holocard.setUpdateStateCallback((planet, card) => {
            // Update state machine
            if (this.scrollAnimator) {
                this.scrollAnimator.goToPlanetCard(planet, card);

                // Ensure Next button is visible (since we skip body scroll triggers on mobile)
                if (this.holocard.nextBtn) {
                    this.holocard.nextBtn.classList.add('visible');
                }
            }
        });

        // Card swipe navigation (advance to next card)
        this.holocard.setCardAdvanceCallback(() => {
            if (this.scrollAnimator) {
                this.scrollAnimator.goToNextState();
            }
        });
    }

    setupPlanetClickHandler() {
        // Set the callback for planet clicks to scroll to corresponding section
        this.cosmicScene.setPlanetClickCallback((planetName) => {
            const targetSection = document.querySelector(`.scene--${planetName}`);
            if (targetSection) {
                this.smoothScroll.lenis.scrollTo(targetSection, { duration: 1.5 });
            }
        });
    }

    setupScrollTopButton() {
        // Create scroll to top button
        const btn = document.createElement('button');
        btn.className = 'scroll-top-btn';
        btn.innerHTML = '↑';
        btn.setAttribute('aria-label', 'Scroll to top');
        document.body.appendChild(btn);

        // Click handler
        btn.addEventListener('click', () => {
            if (this.scrollAnimator) {
                this.scrollAnimator.returnToGodView();
            } else {
                this.smoothScroll.lenis.scrollTo(0, { duration: 2.0 });
            }
        });

        // Visibility trigger (show after scrolling past 200vh)
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.create({
            trigger: document.body,
            start: '200vh top',
            end: 'bottom bottom',
            onEnter: () => btn.classList.add('visible'),
            onLeaveBack: () => btn.classList.remove('visible')
        });
    }

    setupTimeTravelButton() {
        const timeTravelBtn = document.getElementById('time-travel-btn');
        if (timeTravelBtn) {
            timeTravelBtn.addEventListener('click', () => {
                // Show the Next button (it's hidden on the hero screen)
                if (this.holocard.nextBtn) {
                    this.holocard.nextBtn.classList.add('visible');
                }

                // Use ScrollAnimator to go to Earth Card 0
                if (this.scrollAnimator) {
                    this.scrollAnimator.goToPlanetCard('earth', 0);
                }
            });
        }
    }

    start() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.cosmicScene.render();
        };
        animate();
    }
}

class SmoothScroll {
    constructor() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothTouch: false,  // Native scroll on touch — faster and less jittery
            touchMultiplier: 1.5
        });

        this.lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => this.lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }
}

// Initializer
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        startApp();
    });
} else {
    startApp();
}

function startApp() {
    if (window.WebGLRenderingContext) {
        try {
            window.cosmicApp = new App();
        } catch (error) {
            // Silent fail in production
        }
    }
}
