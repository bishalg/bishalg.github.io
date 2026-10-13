/**
 * main.js
 * Entry point for the Cosmic CV
 * Simplified for CSS snap scroll architecture
 */
import { CosmicScene } from './core/CosmicScene.js';
import { ScrollAnimator } from './core/ScrollAnimator.js';
import { Holocard } from './ui/Holocard.js';
import { ScrollRail } from './ui/ScrollRail.js';
import { solarSystemData } from './data/solarSystemData.js';
import * as THREE from 'three';

// GSAP is loaded globally (for animations only, not scroll control)
const gsap = window.gsap;

// Make globals available if needed by legacy scripts
window.THREE = THREE;
window.gsap = gsap;

class App {
    constructor() {
        this.init();
    }

    init() {
        // Simple loading simulation
        const loaderText = document.querySelector('.loader-text');
        if (!loaderText) {
            return;
        }

        let progress = 0;
        const loaderBar = document.querySelector('.loader-bar');
        const loader = document.getElementById('loader');

        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
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
        this.scrollRail = new ScrollRail();

        // Initialize Scroll Animator (now uses IntersectionObserver)
        this.scrollAnimator = new ScrollAnimator(
            this.cosmicScene,
            this.holocard,
            solarSystemData
        );

        // Setup handlers
        this.setupTimeTravelButton();
        this.setupHolocardNavigation();
        this.setupScrollTopButton();
        this.setupUrlStateSync();
        this.setupScrollRailSync();

        // Timeout fallback
        setTimeout(() => {
            if (!loader.classList.contains('loader--hidden')) {
                clearInterval(progressInterval);
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
    static MAX_CARDS = 3;

    /**
     * Setup URL state sync - read params on load, update on scroll
     */
    setupUrlStateSync() {
        const params = new URLSearchParams(window.location.search);
        const planet = params.get('planet');
        const cardParam = params.get('card');

        // Restore state from URL if present
        if (planet && cardParam !== null && App.VALID_PLANETS.includes(planet)) {
            let card = parseInt(cardParam, 10);
            if (isNaN(card) || card < 0) card = 0;
            if (card > App.MAX_CARDS) card = App.MAX_CARDS;

            // Wait for DOM to be ready, then scroll
            setTimeout(() => {
                this.scrollAnimator.goToPlanetCard(planet, card);
            }, 500);
        }

        // Set callback for scroll animator to update URL
        this.scrollAnimator.setUrlUpdateCallback((state) => {
            this.updateUrlState(state);
        });
    }

    /**
     * Keep the quiet scroll rail in sync with the IntersectionObserver state.
     * No extra observers / rAF — reuses the single ScrollAnimator callback.
     */
    setupScrollRailSync() {
        if (!this.scrollRail || !this.scrollAnimator) return;
        this.scrollAnimator.setOnStateChange(({ planet, card, pageId }) => {
            if (pageId === 'welcome') {
                this.scrollRail.setWelcome();
                return;
            }
            if (pageId === 'end') {
                this.scrollRail.setEnd();
                return;
            }
            this.scrollRail.setActive(planet, card);
        });
    }

    /**
     * Update URL with current state (no page reload)
     */
    updateUrlState(state) {
        let planet, card;

        if (state === null || state === undefined) {
            // Clear URL params when at welcome/end
            const currentParams = new URLSearchParams(window.location.search);
            if (currentParams.get('planet') !== null) {
                window.history.replaceState({}, '', window.location.pathname);
            }
            return;
        }

        if (typeof state === 'object') {
            planet = state.planet;
            card = state.card;
        } else {
            return;
        }

        // Validate planet
        if (!App.VALID_PLANETS.includes(planet)) {
            return;
        }

        const currentParams = new URLSearchParams(window.location.search);
        const currentPlanet = currentParams.get('planet');
        const currentCard = currentParams.get('card');
        const targetCard = Math.min(card, App.MAX_CARDS).toString();

        // Only update if changed
        if (currentPlanet === planet && currentCard === targetCard) {
            return;
        }

        const params = new URLSearchParams();
        params.set('planet', planet);
        params.set('card', targetCard);

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }

    setupHolocardNavigation() {
        // Navigation via Next Button
        this.holocard.setNavigationCallback(() => {
            this.scrollAnimator.goToNextState();
        });
    }

    setupScrollTopButton() {
        const btn = document.createElement('button');
        btn.className = 'scroll-top-btn';
        btn.innerHTML = '↑';
        btn.setAttribute('aria-label', 'Scroll to top');
        document.body.appendChild(btn);

        const scrollToTop = () => {
            const welcome = document.getElementById('welcome');
            if (!welcome) return;
            const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            welcome.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
        };
        btn.addEventListener('click', scrollToTop);

        // Show button after scrolling past first page (rAF-throttled scroll listener)
        const scrollContainer = document.getElementById('scroll-container');
        if (scrollContainer) {
            let ticking = false;
            scrollContainer.addEventListener('scroll', () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(() => {
                    ticking = false;
                    if (scrollContainer.scrollTop > window.innerHeight) {
                        btn.classList.add('visible');
                    } else {
                        btn.classList.remove('visible');
                    }
                });
            }, { passive: true });
        }
    }

    setupTimeTravelButton() {
        const timeTravelBtn = document.getElementById('time-travel-btn');
        if (timeTravelBtn) {
            timeTravelBtn.addEventListener('click', () => {
                this.scrollAnimator.goToPlanetCard('earth', 0);
            });
        }
    }

    start() {
        // Single rAF loop owns both WebGL render and camera-target follow.
        // (Previously ScrollAnimator ran a second loop — double overhead.)
        const animate = () => {
            requestAnimationFrame(animate);
            this.cosmicScene.render();
            if (this.scrollAnimator && typeof this.scrollAnimator.tick === 'function') {
                this.scrollAnimator.tick();
            }
        };
        animate();
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
            console.error('Failed to start app:', error);
        }
    }
}
