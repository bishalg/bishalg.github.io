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
        console.log('🚀 Initializing Cosmic CV...');

        // Immediate visual test - change the loader text immediately
        const loaderText = document.querySelector('.loader-text');
        if (loaderText) {
            loaderText.textContent = 'INITIALIZING COSMIC TIMELINE... LOADING...';
            loaderText.style.color = '#ffaa00'; // Change color to confirm JS is working
            console.log('✨ Successfully updated loader text!');
        } else {
            console.error('❌ Could not find .loader-text element!');
            // Create a fallback visual indicator
            const testDiv = document.createElement('div');
            testDiv.textContent = 'JAVASCRIPT IS RUNNING!';
            testDiv.style.position = 'fixed';
            testDiv.style.top = '10px';
            testDiv.style.left = '10px';
            testDiv.style.background = 'red';
            testDiv.style.color = 'white';
            testDiv.style.padding = '10px';
            testDiv.style.zIndex = '9999';
            document.body.appendChild(testDiv);
            return;
        }

        // Show loading progress animation
        let progress = 0;
        const loaderBar = document.querySelector('.loader-bar');
        const loader = document.getElementById('loader');

        console.log('🔍 Found loader elements, starting progress...');

        const progressInterval = setInterval(() => {
            progress += Math.random() * 15; // Random progress increments
            if (progress > 100) progress = 100;

            console.log(`📈 Progress: ${Math.floor(progress)}%`);

            if (loaderText) {
                loaderText.textContent = `INITIALIZING COSMIC TIMELINE... ${Math.floor(progress)}%`;
                console.log(`✏️ Updated text to: ${loaderText.textContent}`);
            }

            if (loaderBar) {
                loaderBar.style.setProperty('--progress', `${progress}%`);
                loaderBar.classList.add('loader-bar--progress');
                console.log(`📊 Updated progress bar to: ${progress}%`);
            }

            if (progress >= 100) {
                clearInterval(progressInterval);
                console.log('✅ Cosmic initialization complete!');

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

        // Run unit test for central state array
        setTimeout(() => {
            this.scrollAnimator.stateMachine.runUnitTest();
        }, 1000);

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
        const url = window.location.search;
        console.log(`[URL] Initial URL: "${url}"`);

        const params = new URLSearchParams(url);
        const planet = params.get('planet');
        const cardParam = params.get('card');

        console.log(`[URL] Parsed params: planet="${planet}", card="${cardParam}"`);

        // Only restore state if URL actually has parameters
        if (planet && cardParam !== null && App.VALID_PLANETS.includes(planet)) {
            // Clamp card to valid range (0=planet view, 1-MAX_CARDS=card states)
            let card = parseInt(cardParam, 10);
            if (isNaN(card) || card < 0) card = 0;
            if (card > App.MAX_CARDS) card = App.MAX_CARDS;

            console.log(`[URL] Restoring state: planet=${planet}, card=${card}`);

            // Wait for smooth scroll to be ready, then scroll
            setTimeout(() => {
                this.scrollToPlanetCard(planet, card);
            }, 500); // Delay to allow GSAP triggers to initialize
        } else {
            // No URL parameters - start clean, don't navigate to any state
            console.log('[URL] Starting clean - no URL parameters, staying on hero screen');
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
        console.log(`🎯 scrollToPlanetCard called: ${planet}, card ${card}`);
        // Delegate to state machine for consistent navigation
        this.scrollAnimator.goToPlanetCard(planet, card);
    }

    /**
     * Update URL with current state (no page reload)
     */
    updateUrlState(planet, card) {
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
            console.log('🎯 NEXT button clicked - calling goToNextState');
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
            console.log('🎯 Time Travel button found and set up');
            timeTravelBtn.addEventListener('click', () => {
                console.log('🚀 Time Travel button clicked!');
                // Show the Next button (it's hidden on the hero screen)
                if (this.holocard.nextBtn) {
                    this.holocard.nextBtn.classList.add('visible');
                }

                // Use ScrollAnimator to go to Earth Card 0
                if (this.scrollAnimator) {
                    console.log('🌍 Navigating to Earth planet view');
                    this.scrollAnimator.goToPlanetCard('earth', 0);
                }
            });
        } else {
            console.warn('⚠️ Time Travel button not found!');
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

// Immediate test
console.log('🚀 Cosmic CV script loaded and executing!');

// Initializer
if (document.readyState === 'loading') {
    console.log('📄 DOM still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOMContentLoaded fired, starting app...');
        startApp();
    });
} else {
    console.log('📄 DOM already ready, starting app immediately...');
    startApp();
}

function startApp() {
    console.log('🎯 Starting cosmic app initialization...');
    if (window.WebGLRenderingContext) {
        console.log('🎮 WebGL available, creating app...');
        try {
            window.cosmicApp = new App();
            console.log('✅ App created successfully!');
        } catch (error) {
            console.error('❌ Error creating app:', error);
        }
    } else {
        console.warn('⚠️ WebGL not available - this app requires WebGL');
        // Still try to start for debugging
        try {
            window.cosmicApp = new App();
        } catch (error) {
            console.error('❌ Error creating app even without WebGL:', error);
        }
    }
}
