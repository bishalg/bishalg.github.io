export const solarSystemData = {
    earth: {
        id: 'earth',
        title: 'Earth',
        subtitle: 'Origin & Foundation',
        accentColor: '#00aaff',
        stats: [
            { label: 'Type', value: 'Terrestrial Planet' },
            { label: 'Location', value: 'Sol System, Sector 7' },
            { label: 'Primary Role', value: 'Genesis of the Architect' }
        ],
        narrative: `The journey begins here, a world teeming with logic and structure. It was on this vibrant planet that the Architect first learned to manipulate the fundamental forces of code, shaping raw data into functional, elegant forms.`,
        quote: `First, we build the world. Then, the world builds us.`,
        professional: {
            title: "Lead Engineer & Architect",
            skills: [
                "JavaScript (ESNext)", "TypeScript", "React & Redux", "Node.js",
                "Python", "AI/ML (TensorFlow, PyTorch)", "Cloud Architecture (AWS, GCP)",
                "CI/CD (Jenkins, GitLab)", "System Design"
            ],
            summary: "I specialize in architecting and leading the development of robust, scalable software solutions. My approach combines deep technical expertise with a strategic vision for product evolution, ensuring that every line of code serves a purpose beyond its immediate function."
        }
    },
    moon: {
        id: 'moon',
        title: 'The Moon',
        subtitle: 'Subconscious & Creativity',
        accentColor: '#cccccc',
        stats: [
            { label: 'Type', value: 'Natural Satellite' },
            { label: 'Primary Influence', value: 'Creative & Abstract Thought' },
            { label: 'Core Principle', value: 'Innovation from Chaos' }
        ],
        narrative: `In the quiet desolation of the lunar surface, the Architect explores the abstract, the unconventional. This is the realm of pure creativity, where the rigid rules of logic are bent and new paradigms are born. It represents the subconscious mind, the source of breakthrough ideas.`,
        quote: `The greatest creations are found in the silent spaces between the notes.`,
        professional: {
            title: "Creative Technologist & Innovator",
            projects: [
                {
                    name: "Project Chimera",
                    desc: "A generative art installation powered by real-time weather data, creating ever-changing visual landscapes.",
                    stack: "Three.js, WebSockets, Node.js, Raspberry Pi"
                },
                {
                    name: "Neuro-Synth",
                    desc: "An experimental synthesizer that translates brainwave (EEG) data into ambient musical scores.",
                    stack: "Python, OSC, Ableton Live, Brain-Computer Interface"
                }
            ],
            summary: "I thrive on the edge of what's possible, blending art and technology to create novel experiences. My passion lies in exploring unconventional interfaces and data-driven narratives that challenge our perception of technology."
        }
    },
    sun: {
        id: 'sun',
        title: 'The Sun',
        subtitle: 'Core Principles & Vision',
        accentColor: '#ffaa00',
        stats: [
            { label: 'Type', value: 'G-Type Main-Sequence Star' },
            { label: 'Primary Function', value: 'Guiding Light & Core Philosophy' },
            { label: 'Output', value: 'Vision, Strategy, Leadership' }
        ],
        narrative: `At the heart of the system burns the Sun, the source of all energy and the Architect's core philosophy. It represents an unwavering commitment to quality, a passion for mentorship, and the driving force to not just build things, but to build things that matter.`,
        quote: `Be the star that illuminates the path for others.`,
        professional: {
            title: "Mentor, Leader, Visionary",
            history: [
                {
                    role: "Director of Engineering",
                    company: "Stellar Solutions Inc.",
                    period: "2020 - Present",
                    summary: "Scaled the engineering team from 5 to 30, implemented a culture of technical excellence, and oversaw the launch of three flagship products."
                },
                {
                    role: "Principal Software Engineer",
                    company: "Quantum Leap Dynamics",
                    period: "2015 - 2020",
                    summary: "Led the architectural design for a distributed financial ledger system, achieving sub-millisecond latency and 99.999% uptime."
                }
            ],
            summary: "My goal is to empower teams to achieve their full potential. I believe in leadership through service, fostering an environment of collaboration, learning, and mutual respect where innovation can flourish."
        }
    }
};