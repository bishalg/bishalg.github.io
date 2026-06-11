// Helper functions to generate HTML for the Holocard panels

export function createPanelHeader(data) {
    const sysId = data?.id ? `SYSTEM: ${data.id.toUpperCase()}` : '';
    return `
        <div class="panel-header">
            ${sysId ? `<h3 class="panel-sys">${sysId}</h3>` : ''}
            ${data?.title ? `<h2 class="panel-title">${data.title}</h2>` : ''}
            ${data?.subtitle ? `<p class="panel-subtitle">${data.subtitle}</p>` : ''}
        </div>
    `;
}

// Card 1: Stats + planet preview circle
// The circle is pure CSS using accentColor — no async JS needed
export function createStatGrid(data) {
    const stats = data.stats || [];
    const accent = data.accentColor || '#00f3ff';
    const title = data.title || data.id || '';
    return `
        <div class="stats-card-layout">
            <div class="stats-planet-circle" aria-hidden="true">
                <div class="stats-planet-sphere" style="
                    background: radial-gradient(circle at 38% 32%, ${accent}dd, ${accent}, ${accent}55);
                    box-shadow: 0 0 30px ${accent}66, 0 0 8px ${accent}44 inset;
                "></div>
                <div class="stats-planet-name">${title}</div>
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
    const rawSentence = (data.narrative || '').split(/\.\s+/)[0].trim();
    const firstSentence = rawSentence
        ? (rawSentence.endsWith('.') ? rawSentence : rawSentence + '.')
        : '';
    const rawQuote = data.quote || '';
    const quote = rawQuote.length > 120 ? rawQuote.substring(0, 117) + '...' : rawQuote;
    return `
        <div class="personal-card-layout">
            ${firstSentence ? `<p class="personal-narrative-text">${firstSentence}</p>` : ''}
            ${quote ? `<blockquote class="holo-quote">${quote}</blockquote>` : ''}
        </div>
    `;
}

// Card 3: Professional — role + up to 4 skills (no projects or history list)
export function createProfessionalContent(professional) {
    if (!professional) return '';
    const skills = (professional.skills || []).slice(0, 4);
    const rawSummary = (professional.summary || '').split(/\.\s+/)[0].trim();
    const summary = rawSummary
        ? (rawSummary.endsWith('.') ? rawSummary : rawSummary + '.')
        : '';
    return `
        <div class="professional-card-layout">
            ${professional.title ? `<div class="prof-role">${professional.title}</div>` : ''}
            ${summary ? `<p class="prof-summary-text">${summary}</p>` : ''}
            ${skills.length ? `
                <div class="skill-tags">
                    ${skills.map(s => `<span>${s}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}
