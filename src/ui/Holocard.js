import { solarSystemData } from '../data/solarSystemData.js';
import { createStatGrid, createProfessionalContent, createPersonalNarrative, createPanelHeader } from './HUDComponents.js';
import gsap from 'gsap';

/**
 * Holocard - Holographic CV Card Component
 * Displays planet-specific content with sequential panel fly-in animation
 */
export class Holocard {
    constructor() {
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

        this.content = this.wrapper.querySelector('.holocard-content');
        this.leftPanel = this.wrapper.querySelector('.left-panel');
        this.centerPanel = this.wrapper.querySelector('.center-panel');
        this.rightPanel = this.wrapper.querySelector('.right-panel');
        this.panels = [this.leftPanel, this.centerPanel, this.rightPanel];
        this.isVisible = false;
        this.currentPlanet = null;
        this.visiblePanelCount = 0;

        // Hide all panels initially
        this.panels.forEach(panel => {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(100px)';
        });

        // Close on backdrop click
        this.wrapper.querySelector('.holocard-backdrop').addEventListener('click', () => this.hide());
    }

    /**
     * Prepare card content for a planet (but don't show yet)
     */
    prepareContent(data) {
        if (!data) return;

        // Update content
        this.wrapper.style.setProperty('--accent-color', data.accentColor);
        this.leftPanel.innerHTML = createStatGrid(data.stats);
        this.centerPanel.innerHTML = createPanelHeader(data) + createPersonalNarrative(data);
        this.rightPanel.innerHTML = createProfessionalContent(data.professional);

        this.currentPlanet = data.id;
        this.visiblePanelCount = 0;

        // Reset all panels to hidden
        this.panels.forEach(panel => {
            gsap.set(panel, { opacity: 0, y: 100 });
        });

        console.log(`🎴 Prepared content for: ${data.id}`);
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
        const directions = [
            { x: -100, y: 0 },  // Left panel from left
            { x: 0, y: 100 },   // Center panel from bottom
            { x: 100, y: 0 }    // Right panel from right
        ];
        const dir = directions[this.visiblePanelCount];

        // Animate panel in
        gsap.fromTo(panel,
            { opacity: 0, x: dir.x, y: dir.y },
            {
                opacity: 1,
                x: 0,
                y: 0,
                duration: 0.6,
                ease: 'power3.out'
            }
        );

        console.log(`🎴 Showing panel ${this.visiblePanelCount + 1}/3 for ${this.currentPlanet}`);
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
        const directions = [
            { x: -100, y: 0 },
            { x: 0, y: 100 },
            { x: 100, y: 0 }
        ];
        const dir = directions[this.visiblePanelCount];

        gsap.to(panel, {
            opacity: 0,
            x: dir.x,
            y: dir.y,
            duration: 0.4,
            ease: 'power2.in'
        });

        // Hide wrapper if all panels hidden
        if (this.visiblePanelCount === 0) {
            this.wrapper.classList.remove('visible');
            this.wrapper.classList.add('hidden');
            this.isVisible = false;
        }

        console.log(`🎴 Hiding panel, now ${this.visiblePanelCount}/3 visible`);
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