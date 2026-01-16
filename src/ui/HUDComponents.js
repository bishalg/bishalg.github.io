// Helper functions to generate HTML for the Holocard panels

export function createPanelHeader(data) {
    return `
        <div class="panel-header">
            <div>
                <h3>SYSTEM: ${data.id.toUpperCase()}</h3>
                <h2>${data.title}</h2>
                <h3 class="subtitle">${data.subtitle}</h3>
            </div>
        </div>
    `;
}

export function createStatGrid(data) {
    const stats = data.stats;
    if (!stats || stats.length === 0) return '';
    return `
        <div class="panel-header">
            <h3>TELEMETRY</h3>
        </div>
        <div class="stat-grid">
            ${stats.map(stat => `
                <div class="stat-row">
                    <span class="stat-label">${stat.label}</span>
                    <span class="stat-value">${stat.value}</span>
                </div>
            `).join('')}
        </div>
        <div class="planet-wireframe-placeholder">
            <div class="holo-circle">
                <span class="holo-circle-text">${data.title || data.id}</span>
            </div>
        </div>
    `;
}

export function createPersonalNarrative(data) {
    return `
        <div class="personal-narrative">
            <p>"${data.narrative}"</p>
        </div>
        <div class="holo-quote">
            ${data.quote}
        </div>
    `;
}

function createSkillsList(skills) {
    if (!skills || skills.length === 0) return '';
    return `
        <h4>Core Competencies:</h4>
        <div class="skill-tags">
            ${skills.map(skill => `<span>${skill}</span>`).join('')}
        </div>
    `;
}

function createProjectsList(projects) {
    if (!projects || projects.length === 0) return '';
    return `
        <h4>Key Projects:</h4>
        <div class="podcast-list">
            <ul>
                ${projects.map(p => `
                    <li>
                        <a href="#" class="podcast-link">
                            <span class="pod-title">${p.name}</span>
                            <span class="pod-context">${p.stack}</span>
                        </a>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}

function createHistoryList(history) {
    if (!history || history.length === 0) return '';
    return `
        <h4>Career Trajectory:</h4>
        ${history.map(h => `
            <div class="history-item">
                <div class="job-role">${h.role}</div>
                <div class="job-company">${h.company}</div>
                <div class="job-period">${h.period}</div>
            </div>
        `).join('')}
    `;
}


export function createProfessionalContent(professional) {
    if (!professional) return '';
    return `
        <div class="panel-header">
            <h3>SERVICE RECORD</h3>
        </div>
        <div class="professional-content">
            <div class="prof-role">${professional.title}</div>
            <p>${professional.summary}</p>
            ${createSkillsList(professional.skills)}
            ${createProjectsList(professional.projects)}
            ${createHistoryList(professional.history)}
        </div>
    `;
}