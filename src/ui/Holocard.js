import { solarSystemData } from '../data/solarSystemData.js';
import { createStatGrid, createProfessionalContent, createPersonalNarrative, createPanelHeader } from './HUDComponents.js';

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

        this.leftPanel = this.wrapper.querySelector('.left-panel');
        this.centerPanel = this.wrapper.querySelector('.center-panel');
        this.rightPanel = this.wrapper.querySelector('.right-panel');

        this.wrapper.querySelector('.holocard-backdrop').addEventListener('click', () => this.hide());
    }

    show(data) {
        if (!data) return;

        // 1. Update Accent Color
        this.wrapper.style.setProperty('--accent-color', data.accentColor);

        // 2. Populate Panels
        this.leftPanel.innerHTML = createStatGrid(data.stats);
        this.centerPanel.innerHTML = createPanelHeader(data) + createPersonalNarrative(data);
        this.rightPanel.innerHTML = createProfessionalContent(data.professional);

        // 3. Make it visible
        this.wrapper.classList.remove('hidden');
        this.wrapper.classList.add('visible');
    }

    hide() {
        this.wrapper.classList.remove('visible');
        this.wrapper.classList.add('hidden');
    }
}