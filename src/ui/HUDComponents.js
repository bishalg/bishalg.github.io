// Helper functions to generate HTML for the Holocard panels
import { CONFIG } from '../config.js';

function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// Text-node escaping: quotes are safe in text, but &/</> must not break markup.
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function createPanelHeader(data) {
    const sysId = data?.id ? `SYSTEM: ${escapeHtml(data.id.toUpperCase())}` : '';
    return `
        <div class="panel-header">
            ${sysId ? `<h3 class="panel-sys">${sysId}</h3>` : ''}
            ${data?.title ? `<h2 class="panel-title">${escapeHtml(data.title)}</h2>` : ''}
            ${data?.subtitle ? `<p class="panel-subtitle">${escapeHtml(data.subtitle)}</p>` : ''}
        </div>
    `;
}

// Card 1: Stats + planet preview circle
// Live 3D preview mounts into .stats-planet-sphere (see PlanetPreview +
// Holocard). The <img> is fallback-only: PlanetPreview adds .has-3d on a
// successful mount and CSS hides the img, so the static map can never
// ghost through the transparent canvas as a double image.
export function createStatGrid(data) {
    const stats = data.stats || [];
    const accent = data.accentColor || '#00f3ff';
    const title = data.title || data.id || '';
    const planetId = data.id || '';
    const texture = (CONFIG.planets && CONFIG.planets[planetId] && CONFIG.planets[planetId].texture) || '';
    const imgTag = texture
        ? `<img src="${escapeAttr(texture)}" alt="${escapeAttr(title || planetId)} texture" loading="lazy" decoding="async" onload="this.classList.add('is-loaded')" onerror="this.remove()">`
        : '';
    return `
        <div class="stats-card-layout">
            <div class="stats-planet-circle" aria-hidden="true">
                <div class="stats-planet-sphere" data-planet-id="${escapeAttr(planetId)}" style="
                    background: radial-gradient(circle at 38% 32%, ${accent}dd, ${accent}, ${accent}55);
                    box-shadow: 0 0 30px ${accent}66, 0 0 8px ${accent}44 inset;
                ">${imgTag}</div>
                <div class="stats-planet-name">${escapeHtml(title)}</div>
            </div>
            <div class="stat-grid">
                ${stats.map(stat => `
                    <div class="stat-row">
                        <span class="stat-label">${escapeHtml(stat.label)}</span>
                        <span class="stat-value">${escapeHtml(stat.value)}</span>
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
            ${firstSentence ? `<p class="personal-narrative-text">${escapeHtml(firstSentence)}</p>` : ''}
            ${quote ? `<blockquote class="holo-quote">${escapeHtml(quote)}</blockquote>` : ''}
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
            ${professional.title ? `<div class="prof-role">${escapeHtml(professional.title)}</div>` : ''}
            ${summary ? `<p class="prof-summary-text">${escapeHtml(summary)}</p>` : ''}
            ${skills.length ? `
                <div class="skill-tags">
                    ${skills.map(s => `<span>${escapeHtml(s)}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}
