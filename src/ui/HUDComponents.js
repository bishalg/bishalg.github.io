// Helper functions to generate HTML for the Holocard panels

export function createPanelHeader(data) {
    return `
        <div class="panel-header">
            <h3 class="panel-sys">SYSTEM: ${data.id.toUpperCase()}</h3>
            <h2 class="panel-title">${data.title}</h2>
            <p class="panel-subtitle">${data.subtitle}</p>
        </div>
    `;
}

// Card 1: Stats + planet preview circle
// The circle is pure CSS using accentColor — no async JS needed
export function createStatGrid(data) {
    const stats = data.stats || [];
    const accent = data.accentColor || '#00f3ff';
    return `
        <div class="stats-card-layout">
            <div class="stats-planet-circle" aria-hidden="true">
                <div class="stats-planet-sphere" style="
                    background: radial-gradient(circle at 38% 32%, ${accent}dd, ${accent}, ${accent}55);
                    box-shadow: 0 0 30px ${accent}66, 0 0 8px ${accent}44 inset;
                "></div>
                <div class="stats-planet-name">${data.title}</div>
            </div>
            <div class="stat-grid">
                ${stats.map(stat => `
                    <div class="stat-row">
                        <span class="stat-label">${stat.label}</span>
                        <span class="stat-value">${stat.value}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Card 2: Personal — first sentence of narrative + short quote
export function createPersonalNarrative(data) {
    // Use only the first sentence to keep within card height
    const firstSentence = (data.narrative || '').split(/\.\s+/)[0].trim() + '.';
    const quote = (data.quote || '').substring(0, 120);
    return `
        <div class="personal-card-layout">
            <p class="personal-narrative-text">${firstSentence}</p>
            <blockquote class="holo-quote">${quote}</blockquote>
        </div>
    `;
}

// Card 3: Professional — role + up to 4 skills (no projects or history list)
export function createProfessionalContent(professional) {
    if (!professional) return '';
    const skills = (professional.skills || []).slice(0, 4);
    const summary = (professional.summary || '').split(/\.\s+/)[0].trim() + '.';
    return `
        <div class="professional-card-layout">
            <div class="prof-role">${professional.title}</div>
            <p class="prof-summary-text">${summary}</p>
            ${skills.length ? `
                <div class="skill-tags">
                    ${skills.map(s => `<span>${s}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}
