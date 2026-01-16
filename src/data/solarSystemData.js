/**
 * solarSystemData.js
 * The Living Horoscope - Full 9 Planet Content Architecture
 * 
 * Each planet maps to:
 * 1. Science - Real orbital facts
 * 2. Personal - Vedic Astrology Karakas (relationships)
 * 3. Professional - CV mapped to planetary energy
 */

export const solarSystemData = {
    // =========================================================
    // 1. EARTH - The Origin & Foundation
    // =========================================================
    earth: {
        id: 'earth',
        title: 'Earth',
        subtitle: 'Existence & Roots',
        accentColor: '#22A6B3',
        stats: [
            { label: 'Age', value: '4.54 Billion Years' },
            { label: 'Your Time Here', value: 'Calculating...' },
            { label: 'Flash in the Pan', value: '0.0000009%' }
        ],
        narrative: `The origin of all things. 15,000+ days of conscious existence on this pale blue dot. Every algorithm I've written, every system I've architected, started here.`,
        quote: `First, we build the world. Then, the world builds us.`,
        personal: {
            relation: 'Birthplace',
            name: 'Kathmandu, Nepal',
            bio: 'The valley of temples where code meets karma.'
        },
        professional: {
            title: "The Foundation",
            summary: "15+ years in software engineering. Bachelor in Engineering from IoE Pulchowk. Masters in Computer Applications. The grounding principles of my coding philosophy.",
            skills: [
                "System Architecture", "Problem Solving", "Engineering Principles",
                "Logical Thinking", "Continuous Learning"
            ]
        }
    },

    // =========================================================
    // 2. SUN - Father & Leadership (Surya - Pitra Karaka)
    // =========================================================
    sun: {
        id: 'sun',
        title: 'The Sun',
        subtitle: 'Leadership & Authority',
        accentColor: '#FFAA00',
        stats: [
            { label: 'Core Temp', value: '15 Million °C' },
            { label: 'Karaka', value: 'Pitra (Father)' },
            { label: 'Energy', value: 'Gravity of Leadership' }
        ],
        narrative: `Surya, the soul of the chart. The Sun represents the father figure—the guide who showed me the world before I built my own virtual ones.`,
        quote: `Be the star that illuminates the path for others.`,
        personal: {
            relation: 'Father',
            name: 'The Guide',
            bio: 'Tour Guide & Global Traveler. He showed me the world before I built my own virtual ones.'
        },
        professional: {
            title: "Leadership Roles",
            summary: "The central gravity of my career. Head of Engineering, Director, Team Lead—positions where vision meets execution.",
            history: [
                { role: "Head of Engineering", company: "big B soft", period: "Aug 2016 - Current" },
                { role: "Director of Software Engineering", company: "Sea Foam Media & Technology", period: "Feb 2018 - July 2020" },
                { role: "Mobile Team Lead", company: "Leapfrog Technology", period: "July 2014 – July 2016" }
            ]
        }
    },

    // =========================================================
    // 3. MOON - Mother & Mind (Chandra - Matru Karaka)
    // =========================================================
    moon: {
        id: 'moon',
        title: 'The Moon',
        subtitle: 'Philosophy & Psychology',
        accentColor: '#E0E0E0',
        stats: [
            { label: 'Orbital Period', value: '27.3 Days' },
            { label: 'Karaka', value: 'Matru (Mother)' },
            { label: 'Influence', value: 'Mind & Emotions' }
        ],
        narrative: `Chandra, the mind. The Moon represents the mother—the professor who taught me the logic of the ancient world; I applied it to the digital one.`,
        quote: `The greatest creations are found in the silent spaces between the notes.`,
        personal: {
            relation: 'Mother',
            name: 'The Professor',
            bio: 'University Professor of Culture, Philosophy, and Hinduism.'
        },
        professional: {
            title: "Research & Interests",
            summary: "Deep dives into Vedic Astrology, Physics, Osho, and Novel Writing.",
            projects: [
                { name: "Fortune's Whisper", desc: "A novel exploring the intersection of destiny and free will.", stack: "Creative Writing" },
                { name: "Vedic Research", desc: "Systematic study of Jyotish texts and their computational applications.", stack: "Sanskrit, Python" },
                { name: "Astro-Fusion LMS", desc: "Teaching platform for astrological education.", stack: "Next.js, Streamlit" }
            ]
        }
    },

    // =========================================================
    // 4. MARS - Siblings & Energy (Mangal - Bhatru Karaka)
    // =========================================================
    mars: {
        id: 'mars',
        title: 'Mars',
        subtitle: 'Action & Engineering',
        accentColor: '#FF4444',
        stats: [
            { label: 'Diameter', value: '6,779 km' },
            { label: 'Karaka', value: 'Bhatru (Siblings)' },
            { label: 'Energy', value: 'Raw Execution Power' }
        ],
        narrative: `Mangal, the warrior. Mars represents siblings—the bond of protection and shared energy. The red planet fuels the fire-fighting spirit in production.`,
        quote: `Code is my weapon. Debugging is my battle.`,
        personal: {
            relation: 'Sister',
            name: 'The Bond',
            bio: 'The protective energy and shared determination that runs through our blood.'
        },
        professional: {
            title: "Hard Skills & Hackathons",
            summary: "The raw coding power. Full Stack development, Debugging, 'Fire-fighting' in production.",
            skills: [
                "Swift / Objective-C", "C++ (OpenCV)", "Python / ML",
                "React Native", "Debugging", "Performance Tuning"
            ]
        }
    },

    // =========================================================
    // 5. MERCURY - Intellect & Communication (Budha)
    // =========================================================
    mercury: {
        id: 'mercury',
        title: 'Mercury',
        subtitle: 'Languages & Learning',
        accentColor: '#A5A5A5',
        stats: [
            { label: 'Orbital Speed', value: '47.87 km/s' },
            { label: 'Karaka', value: 'Prince / Child' },
            { label: 'Domain', value: 'Communication' }
        ],
        narrative: `Budha, the messenger. Mercury represents the child—the curiosity that keeps me young. Fast, witty, data-driven.`,
        quote: `Learn one language, think in ten.`,
        personal: {
            relation: 'Daughter',
            name: 'The Curiosity',
            bio: '8 years old. Her love for Lord Shiva reminds me of the innocence behind all questions.'
        },
        professional: {
            title: "Languages & Syntax",
            summary: "The languages I speak and the frameworks I wield.",
            skills: [
                "JavaScript / TypeScript", "Swift", "Python", "C#",
                "React / Next.js", "Node.js", "Solidity"
            ],
            podcasts: [
                { title: "Dark Secret of Astrology", context: "Nepal's Longest Podcast Stories with Sujan EP43" },
                { title: "Creative Insights", context: "Conversations on Code & Cosmos" }
            ]
        }
    },

    // =========================================================
    // 6. JUPITER - Wisdom & Teachers (Guru)
    // =========================================================
    jupiter: {
        id: 'jupiter',
        title: 'Jupiter',
        subtitle: 'Expansion & Knowledge',
        accentColor: '#D4A574',
        stats: [
            { label: 'Mass', value: '1.898 × 10²⁷ kg' },
            { label: 'Karaka', value: 'Guru (Teacher)' },
            { label: 'Domain', value: 'Wisdom & Expansion' }
        ],
        narrative: `Guru, the great benefic. Jupiter represents teachers and mentors—the giants whose shoulders I stand on.`,
        quote: `A good teacher opens the door; you enter by yourself.`,
        personal: {
            relation: 'Teachers',
            name: 'The Giants',
            bio: 'Every mentor who took the time to explain, correct, and inspire.'
        },
        professional: {
            title: "Education & Certifications",
            summary: "University Degrees, Specialized Courses, and the Astro-Fusion LMS teaching system.",
            history: [
                { role: "Masters in Computer Applications", company: "ICA / IGNOU", period: "Completed" },
                { role: "Bachelor in Engineering", company: "IoE Pulchowk, Nepal", period: "Completed" },
                { role: "Google Project Management", company: "Coursera", period: "Certified" },
                { role: "IBM What is Data Science", company: "Coursera", period: "Certified" },
                { role: "DeepLearning.AI - AI For Everyone", company: "Coursera", period: "Certified" }
            ]
        }
    },

    // =========================================================
    // 7. VENUS - Spouse & Arts (Shukra - Kalatra Karaka)
    // =========================================================
    venus: {
        id: 'venus',
        title: 'Venus',
        subtitle: 'Design & Creativity',
        accentColor: '#FFB6C1',
        stats: [
            { label: 'Surface Temp', value: '465 °C' },
            { label: 'Karaka', value: 'Kalatra (Spouse)' },
            { label: 'Domain', value: 'Art & Beauty' }
        ],
        narrative: `Shukra, the bright one. Venus represents the spouse—the blend of Art and Occult that inspires my UI.`,
        quote: `Beauty is not in the eye of the beholder, it's in the CSS.`,
        personal: {
            relation: 'Wife',
            name: 'The Muse',
            bio: 'Actress & Astrologer. The artistic soul that grounds my technical mind.'
        },
        professional: {
            title: "UI/UX & Frontend",
            summary: "'Vibe Coding', Animation work, Design Systems, Tailwind CSS mastery.",
            skills: [
                "Three.js / WebGL", "GSAP Animations", "CSS / Tailwind",
                "Design Systems", "Figma", "User Experience"
            ]
        }
    },

    // =========================================================
    // 8. SATURN - Work & Persistence (Shani - Karma Karaka)
    // =========================================================
    saturn: {
        id: 'saturn',
        title: 'Saturn',
        subtitle: 'Karma & Career',
        accentColor: '#8B7355',
        stats: [
            { label: 'Rings', value: '7 Main Groups' },
            { label: 'Karaka', value: 'Karma (Work)' },
            { label: 'Domain', value: 'Discipline & Delay' }
        ],
        narrative: `Shani, the taskmaster. Saturn represents work ethic—discipline, delay, and deliverance. The structured timeline of 15 years.`,
        quote: `Discipline is the bridge between goals and accomplishment.`,
        personal: {
            relation: 'Work Ethic',
            name: 'The Grind',
            bio: 'The patience to debug for hours. The persistence to refactor legacy code.'
        },
        professional: {
            title: "The Work History",
            summary: "The comprehensive timeline. 15+ Years of engineering, legacy migrations, enterprise stability.",
            history: [
                { role: "Head of Engineering", company: "big B soft", period: "Aug 2016 - Current" },
                { role: "Senior Software Engineer", company: "The Project Factory Team (Remote)", period: "Dec 2021 - Oct 2022" },
                { role: "Director of Software Engineering", company: "Sea Foam Media & Technology (Remote)", period: "Feb 2018 - July 2020" },
                { role: "Mobile Team Lead", company: "Leapfrog Technology", period: "July 2014 – July 2016" },
                { role: "Mobile App Developer", company: "Braindigit", period: "Jan 2013 – July 2014" }
            ]
        }
    },

    // =========================================================
    // 9. NEPTUNE - Spirituality & Ethics (Ketu Energy)
    // =========================================================
    neptune: {
        id: 'neptune',
        title: 'Neptune',
        subtitle: 'Loyalty & Detachment',
        accentColor: '#5B9BD5',
        stats: [
            { label: 'Distance', value: '4.5 Billion km' },
            { label: 'Energy', value: 'Ketu (Moksha)' },
            { label: 'Domain', value: 'Spirituality' }
        ],
        narrative: `The distant one. Neptune carries the energy of Ketu—spirituality, detachment, and unconditional love. This is where code meets conscience.`,
        quote: `The best code is the one that helps, not harms.`,
        personal: {
            relation: 'Dog',
            name: 'The Companion',
            bio: 'Unconditional love and the reminder to stay grounded.'
        },
        professional: {
            title: "Core Values & Ethics",
            summary: "Open Source contributions, Ethical AI use, Data Privacy, and the philosophy behind the code.",
            skills: [
                "Open Source Contribution", "Ethical AI", "Data Privacy",
                "Mentorship", "Knowledge Sharing"
            ]
        }
    }
};
