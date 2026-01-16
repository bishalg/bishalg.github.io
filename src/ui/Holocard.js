import { solarSystemData } from '../data/solarSystemData.js';
import { createStatGrid, createProfessionalContent, createPersonalNarrative, createPanelHeader } from './HUDComponents.js';
import { PlanetPreview } from './PlanetPreview.js';
import gsap from 'gsap';

/**
 * Holocard - Holographic CV Card Component
 * Displays planet-specific content with sequential panel fly-in animation
 */
export class Holocard {
    constructor() {
        // Planet order for navigation
        this.planetOrder = ['earth', 'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'neptune'];

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'holocard-wrapper hidden';
        this.wrapper.innerHTML = `
            <div class="holocard-backdrop"></div>
            <div class="holocard-content">
                <div class="holo-panel left-panel"></div>
                <div class="holo-panel center-panel"></div>
                <div class="holo-panel right-panel"></div>
            </div>
        `;
        document.body.appendChild(this.wrapper);

        this.contentContainer = this.wrapper.querySelector('.holocard-content');
        this.leftPanel = this.wrapper.querySelector('.left-panel');
        this.centerPanel = this.wrapper.querySelector('.center-panel');
        this.rightPanel = this.wrapper.querySelector('.right-panel');

        // Create Next button as a fixed element (always visible)
        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'holocard-next-btn';
        this.nextBtn.setAttribute('aria-label', 'Go to next planet');
        this.nextBtn.innerHTML = '→';
        document.body.appendChild(this.nextBtn);

        // Order: center first, then left, then right (center panel loads first)
        this.panels = [this.centerPanel, this.leftPanel, this.rightPanel];
        this.isVisible = false;
        this.currentPlanet = null;
        this.visiblePanelCount = 0;

        // Callback for scroll navigation (set from main.js)
        this.onNavigateToNext = null;
        this.isNavigating = false;

        // 3D Planet Preview
        this.planetPreview = new PlanetPreview();

        // Hide all panels initially
        this.panels.forEach(panel => {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(100px)';
        });

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

        // Kill any ongoing animations (prevent hide() callback from clearing state)
        gsap.killTweensOf(this.panels);

        // Reset navigation state when new content is ready (arrival at planet)
        if (this.isNavigating) {
            console.log('✅ Navigation complete, arrived at ' + data.id);
            this.isNavigating = false;
            if (this.nextBtn) this.nextBtn.classList.remove('disabled');
        }

        // Update content
        this.wrapper.style.setProperty('--accent-color', data.accentColor);
        this.leftPanel.innerHTML = createStatGrid(data);
        this.centerPanel.innerHTML = createPanelHeader(data) + createPersonalNarrative(data);
        this.rightPanel.innerHTML = createProfessionalContent(data.professional);

        this.currentPlanet = data.id;
        this.visiblePanelCount = 0;

        // Initialize 3D Preview in the left panel's circle
        requestAnimationFrame(() => {
            const circleContainer = this.leftPanel.querySelector('.holo-circle');
            if (circleContainer) {
                this.planetPreview.mount(circleContainer, data.id);
            }
        });

        // Reset all panels to hidden
        this.panels.forEach(panel => {
            gsap.set(panel, { opacity: 0, y: 100 });
        });

        // Hide the wrapper/backdrop for clean Card 0 view
        this.wrapper.classList.remove('visible');
        this.wrapper.classList.add('hidden');
        this.isVisible = false;

        // Reset scroll position for new planet
        if (this.contentContainer) {
            this.contentContainer.scrollTop = 0;

            // Mobile Scroll Listener for State Sync
            if (!this.scrollListenerAttached) {
                this.contentContainer.addEventListener('scroll', () => {
                    if (window.innerWidth > 1024) return; // Mobile only

                    const height = this.contentContainer.clientHeight;
                    const scroll = this.contentContainer.scrollTop;
                    // Snap index: 0=Center, 1=Left, 2=Right
                    const panelIndex = Math.round(scroll / height);

                    // Map panel index to Card Number (1-based for state)
                    // Panels array: [center, left, right] -> Card 1, 2, 3
                    // So card = panelIndex + 1
                    const card = panelIndex + 1;

                    // Debounce/Throttling optional, but state machine handles dedup
                    if (this.onUpdateState && this.isVisible) {
                        this.onUpdateState(this.currentPlanet, card);
                    }
                });
                this.scrollListenerAttached = true;
            }
        }

        console.log(`[${new Date().toISOString()}] 🎴 Prepared content for: ${data.id}`);
    }

    setUpdateStateCallback(callback) {
        this.onUpdateState = callback;
    }

    /**
     * Show the next panel with fly-in animation
     * Returns true if a panel was shown, false if all panels are already visible
     */
    showNextPanel() {
        if (this.visiblePanelCount >= 3) return false;

        // Make wrapper visible on first panel
        if (this.visiblePanelCount === 0) {
            this.wrapper.classList.remove('hidden');
            this.wrapper.classList.add('visible');
            this.isVisible = true;
        }

        const panel = this.panels[this.visiblePanelCount];

        // If panel is already visible (e.g. mobile scroll revealed it), just update count and skip anim
        if (panel.style.opacity === '1' || window.getComputedStyle(panel).opacity === '1') {
            this.visiblePanelCount++;
            return true;
        }

        // Directions match new panel order: center, left, right
        const directions = [
            { x: 0, y: 100 },   // Center panel from bottom
            { x: -100, y: 0 },  // Left panel from left
            { x: 100, y: 0 }    // Right panel from right
        ];
        const dir = directions[this.visiblePanelCount];

        // Animate panel in with slower 1.5s duration for visible fly-in effect
        gsap.fromTo(panel,
            { opacity: 0, x: dir.x, y: dir.y },
            {
                opacity: 1,
                x: 0,
                y: 0,
                duration: 1.5,
                ease: 'power3.out'
            }
        );

        // On mobile, animate container scroll CONCURRENTLY with the panel fly-in
        // This ensures the previous panel scrolls up AS the new one flies in
        if (window.innerWidth <= 1024 && this.contentContainer) {
            gsap.to(this.contentContainer, {
                scrollTop: panel.offsetTop,
                duration: 1.5,
                ease: 'power3.out'
            });
        }

        this.visiblePanelCount++;

        return true;
    }

    /**
     * Hide the last visible panel (for scrolling back)
     */
    hideLastPanel() {
        if (this.visiblePanelCount <= 0) return false;

        this.visiblePanelCount--;
        const panel = this.panels[this.visiblePanelCount];
        // Directions match new panel order: center, left, right
        const directions = [
            { x: 0, y: 100 },   // Center panel to bottom
            { x: -100, y: 0 },  // Left panel to left
            { x: 100, y: 0 }    // Right panel to right
        ];
        const dir = directions[this.visiblePanelCount];

        gsap.to(panel, {
            opacity: 0,
            x: dir.x,
            y: dir.y,
            duration: 1.0,
            ease: 'power2.in'
        });

        // Hide wrapper if all panels hidden
        if (this.visiblePanelCount === 0) {
            this.wrapper.classList.remove('visible');
            this.wrapper.classList.add('hidden');
            this.isVisible = false;
        }

        return true;
    }

    /**
     * Fully hide all panels and reset
     */
    hide() {
        if (!this.isVisible && this.visiblePanelCount === 0) return;

        gsap.to(this.panels, {
            opacity: 0,
            y: 50,
            duration: 0.3,
            stagger: 0.05,
            ease: 'power2.in',
            onComplete: () => {
                this.wrapper.classList.remove('visible');
                this.wrapper.classList.add('hidden');
                this.isVisible = false;
                this.visiblePanelCount = 0;
                this.currentPlanet = null;

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
        // Show all panels at once (legacy behavior)
        this.showNextPanel();
        this.showNextPanel();
        this.showNextPanel();
    }
}
