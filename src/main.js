/**
 * main.js
 * Entry point for the Cosmic CV
 */
import { CosmicScene } from './core/CosmicScene.js';
import { ScrollAnimator } from './core/ScrollAnimator.js';
import { Holocard } from './ui/Holocard.js';
import { solarSystemData } from './data/solarSystemData.js';
import * as THREE from 'three';
import gsap from 'gsap';
import Lenis from '@studio-freight/lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Make globals available if needed by legacy scripts (though we should avoid this)
window.THREE = THREE;
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;

class App {
    constructor() {
        this.init();
    }

    init() {
        THREE.DefaultLoadingManager.onLoad = () => {
            const loader = document.getElementById('loader');
            if (loader) {
                loader.classList.add('loader--hidden');
                setTimeout(() => loader.remove(), 800);
            }
            this.start();
        };

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
    }

    // Valid planet IDs for URL validation
    static VALID_PLANETS = ['earth', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'neptune'];
    static MAX_CARDS = 3;

    /**
     * Setup URL state sync - read params on load, update on scroll
     */
    setupUrlStateSync() {
        const params = new URLSearchParams(window.location.search);
        const planet = params.get('planet');
        const cardParam = params.get('card');

        // Validate planet
        if (planet && App.VALID_PLANETS.includes(planet)) {
            // Clamp card to valid range (0 to MAX_CARDS)
            let card = parseInt(cardParam, 10);
            if (isNaN(card) || card < 0) card = 0;
            if (card > App.MAX_CARDS) card = App.MAX_CARDS;

            console.log(`[URL] Restoring state: planet=${planet}, card=${card}`);

            // Wait for smooth scroll to be ready, then scroll
            setTimeout(() => {
                this.scrollToPlanetCard(planet, card);
            }, 500); // Delay to allow GSAP triggers to initialize
        }

        // Set callback for scroll animator to update URL
        this.scrollAnimator.setUrlUpdateCallback((planetId, cardCount) => {
            this.updateUrlState(planetId, cardCount);
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
     */
    updateUrlState(planet, card) {
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
    }

    setupPlanetClickHandler() {
        // Set the callback for planet clicks to scroll to corresponding section
        this.cosmicScene.setPlanetClickCallback((planetName) => {
            const targetSection = document.querySelector(`.scene--${planetName}`);
            if (targetSection) {
                console.log(`🪐 Planet clicked: ${planetName}, scrolling to section`);
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
            direction: 'vertical',
            smooth: true
        });

        this.lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => this.lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    }
}

// Initializer
document.addEventListener('DOMContentLoaded', () => {
    if (window.WebGLRenderingContext) {
        window.cosmicApp = new App();
    }
});
