/**
 * solarSystemData.js
 * Professional Portfolio - Tech Career Architecture
 *
 * Each planet represents a core aspect of professional development:
 * 1. Core Expertise - Technical foundation and skills
 * 2. Project Impact - Key achievements and implementations
 * 3. Leadership Growth - Management and strategic contributions
 */

export const solarSystemData = {
    // =========================================================
    // 1. EARTH - Foundation & Education
    // =========================================================
    earth: {
        id: 'earth',
        title: 'Foundation',
        subtitle: 'Education & Core Principles',
        accentColor: '#22A6B3',
        stats: [
            { label: 'Academic Level', value: 'Masters Degree' },
            { label: 'Engineering Focus', value: 'Software Systems' },
            { label: 'Years Experience', value: '15+ Years' }
        ],
        narrative: `The origin of all things. 15,000+ days of conscious existence in software engineering. Every algorithm I've written, every system I've architected, started with solid academic foundations and problem-solving principles.`,
        quote: `First, we build the foundation. Then, the world builds upon it.`,
        personal: {
            relation: 'Academic Journey',
            name: 'Engineering to Software',
            bio: 'From Civil Engineering to Computer Applications - the pivot that shaped my technical career.'
        },
        professional: {
            title: "Academic Foundation",
            summary: "Masters in Computer Applications (ICA/IGNOU) and Bachelor in Engineering (IoE Pulchowk, Nepal). The academic bedrock that shaped systematic problem-solving.",
            skills: [
                "System Architecture & Design Patterns",
                "Problem Solving & Logical Thinking",
                "Continuous Learning & Adaptation",
                "Quality Code & Best Practices"
            ],
            projects: [
                { name: "Bouncing Balls App", desc: "Award-winning mobile application", stack: "Mobile Development" },
                { name: "Civil Engineering Software", desc: "Technical software for engineering calculations", stack: "Desktop Applications" },
                { name: "Multimedia Player", desc: "Advanced media playback system", stack: "Multimedia Programming" }
            ]
        }
    },

    // =========================================================
    // 2. SUN - Leadership & Vision
    // =========================================================
    sun: {
        id: 'sun',
        title: 'Leadership',
        subtitle: 'Vision & Strategic Direction',
        accentColor: '#FFAA00',
        stats: [
            { label: 'Leadership Level', value: 'Head of Engineering' },
            { label: 'Team Size', value: 'Cross-functional' },
            { label: 'Years Leading', value: '8+ Years' }
        ],
        narrative: `The central force of my career. Leadership roles that illuminate the path for teams and products. From Team Lead to Director to Head of Engineering - positions where vision meets execution and strategy drives innovation.`,
        quote: `Be the guiding light that illuminates the path for others to follow.`,
        personal: {
            relation: 'Professional Growth',
            name: 'Leadership Journey',
            bio: 'From individual contributor to executive leadership - the evolution of guiding teams toward shared visions.'
        },
        professional: {
            title: "Engineering Leadership",
            summary: "Head of Engineering at big B soft (Aug 2016 - Current). Leading AI-driven product development and team strategy across international boundaries.",
            skills: [
                "Engineering Strategy & Roadmap Planning",
                "Team Performance Evaluation & Alignment",
                "Product Architecture for AI Platforms",
                "Cross-functional Collaboration & Stakeholder Management",
                "International Team Leadership"
            ],
            history: [
                { role: "Head of Engineering", company: "big B soft", period: "Aug 2016 - Current" },
                { role: "Director of Software Engineering", company: "Sea Foam Media & Technology", period: "Feb 2018 - July 2020" },
                { role: "Mobile Team Lead, Sr. iOS Developer", company: "Leapfrog Technology", period: "July 2014 – July 2016" }
            ]
        }
    },

    // =========================================================
    // 3. MOON - Innovation & Research
    // =========================================================
    moon: {
        id: 'moon',
        title: 'Innovation',
        subtitle: 'Research & Creative Projects',
        accentColor: '#E0E0E0',
        stats: [
            { label: 'AI Focus', value: 'GenAI & LLMs' },
            { label: 'Research Areas', value: 'Computer Vision' },
            { label: 'Innovation Years', value: '5+ Years' }
        ],
        narrative: `The rhythm of innovation. Research and creative projects that explore the intersection of technology and human needs. From AI-powered platforms to computer vision solutions, pushing the boundaries of what's technically possible.`,
        quote: `Innovation happens in the quiet spaces between traditional thinking and bold experimentation.`,
        personal: {
            relation: 'Creative Exploration',
            name: 'Research Mindset',
            bio: 'The drive to explore new technologies and their applications in solving real-world problems.'
        },
        professional: {
            title: "AI & Innovation Research",
            summary: "Mastering Large Language Models and RAG pipelines for production environments. Pioneering AI-driven solutions across diverse domains.",
            skills: [
                "Large Language Models (LLMs) - Llama, Perplexity",
                "RAG Pipeline Implementation & Optimization",
                "Computer Vision - OpenCV, Custom ML Models",
                "AI Platform Architecture & Deployment",
                "Cross-domain AI Application Development"
            ],
            projects: [
                { name: "Astro-Fusion Platform", desc: "AI-driven consultation platform with real-time chat", stack: "React, Next.js, Llama, Perplexity, AWS" },
                { name: "Oyster Document Verification", desc: "AI-powered identity verification with camera tracking", stack: "C++, OpenCV, Objective-C, React Native" },
                { name: "AMC Spectral Search", desc: "Real-time audio matching for movie trailers", stack: "Swift, Firebase, Audio Processing" }
            ]
        }
    },

    // =========================================================
    // 4. MARS - Technical Excellence
    // =========================================================
    mars: {
        id: 'mars',
        title: 'Technical Skills',
        subtitle: 'Engineering & Development',
        accentColor: '#FF4444',
        stats: [
            { label: 'Languages', value: '8+ Programming' },
            { label: 'Platforms', value: 'Multi-platform' },
            { label: 'Specialization', value: 'Full Stack' }
        ],
        narrative: `The warrior spirit in code. Technical excellence through deep expertise across languages and platforms. From native mobile performance to AI/ML pipelines, building robust systems that withstand the test of production.`,
        quote: `Code is my weapon. Architecture is my strategy. Debugging is my battle.`,
        personal: {
            relation: 'Technical Mastery',
            name: 'Engineering Passion',
            bio: 'The relentless pursuit of technical excellence and the satisfaction of solving complex engineering challenges.'
        },
        professional: {
            title: "Full Stack Engineering",
            summary: "Complete technical proficiency across programming languages, platforms, and domains. From native mobile to web to blockchain to AI/ML.",
            skills: [
                "Swift & Objective-C - Native iOS Development",
                "C++ - Computer Vision, Performance-critical Systems",
                "Python - Machine Learning, Data Processing, AI",
                "JavaScript/TypeScript - React, Next.js, Node.js",
                "Solidity - Blockchain Smart Contracts",
                "Performance Optimization & Debugging",
                "System Architecture & Design Patterns"
            ],
            projects: [
                { name: "Computer Vision Pipeline", desc: "Custom OpenCV face tracking for banking security", stack: "C++, OpenCV, Objective-C" },
                { name: "Offline Database Sync", desc: "Reliable synchronization in unreliable networks", stack: "iOS, Database Design" },
                { name: "Real-time Audio Processing", desc: "Advanced offline audio player system", stack: "Swift, Audio Frameworks" },
                { name: "Blockchain Investment Platform", desc: "Decentralized investment transactions", stack: "Solidity, Web3.js" }
            ]
        }
    },

    // =========================================================
    // 5. MERCURY - Communication & Tools
    // =========================================================
    mercury: {
        id: 'mercury',
        title: 'Communication',
        subtitle: 'Tools & Knowledge Sharing',
        accentColor: '#A5A5A5',
        stats: [
            { label: 'Frameworks', value: '15+ Technologies' },
            { label: 'Platforms', value: 'Web, Mobile, Cloud' },
            { label: 'Teaching Reach', value: 'Global Community' }
        ],
        narrative: `The messenger of technology. Rapid communication across platforms and communities. Bridging the gap between complex technical concepts and clear, accessible knowledge sharing.`,
        quote: `Learn one technology, teach ten developers. Build one tool, empower one hundred users.`,
        personal: {
            relation: 'Knowledge Sharing',
            name: 'Community Builder',
            bio: 'The passion for making complex technology accessible and fostering learning communities worldwide.'
        },
        professional: {
            title: "Technology Communication",
            summary: "Mastery across modern development frameworks and effective knowledge dissemination. Building bridges between technology and people.",
            skills: [
                "Frontend: React, Next.js, TypeScript, Tailwind CSS",
                "Backend: Node.js, Python, AWS Services",
                "Mobile: React Native, Swift, Objective-C",
                "AI/ML: OpenCV, TensorFlow, Scikit-learn",
                "Blockchain: Solidity, Web3.js",
                "Teaching & Mentorship",
                "Technical Writing & Documentation"
            ],
            projects: [
                { name: "Astro-Fusion Platform", desc: "AI-driven web platform with real-time features", stack: "Next.js, Streamlit, Perplexity" },
                { name: "RiseKit HR Platform", desc: "Inclusive talent matching platform", stack: "React Native, Ruby on Rails" },
                { name: "Astro-Fusion LMS", desc: "Educational platform for knowledge sharing", stack: "Next.js, Educational Technology" }
            ]
        }
    },

    // =========================================================
    // 6. JUPITER - Continuous Learning
    // =========================================================
    jupiter: {
        id: 'jupiter',
        title: 'Learning',
        subtitle: 'Education & Certifications',
        accentColor: '#D4A574',
        stats: [
            { label: 'Certifications', value: '8+ Professional' },
            { label: 'Learning Focus', value: 'AI & Management' },
            { label: 'Teaching Impact', value: 'Global Community' }
        ],
        narrative: `The expansion of knowledge. Continuous learning through formal education, professional certifications, and teaching others. The journey from student to mentor, expanding minds and possibilities.`,
        quote: `A good teacher opens the door; great learning opens the universe.`,
        personal: {
            relation: 'Lifelong Learning',
            name: 'Knowledge Expansion',
            bio: 'The commitment to continuous education and the joy of sharing knowledge with others.'
        },
        professional: {
            title: "Continuous Education",
            summary: "Formal academic background combined with professional certifications and teaching experience. Building knowledge that expands possibilities for teams and communities.",
            skills: [
                "Academic Excellence - Masters & Engineering Degree",
                "AI & Machine Learning Certification",
                "Project Management & Leadership Training",
                "Blockchain & Web3 Technologies",
                "Teaching & Mentorship",
                "Educational Platform Development"
            ],
            history: [
                { role: "Masters in Computer Applications", company: "ICA / IGNOU", period: "Completed" },
                { role: "Bachelor in Engineering", company: "IoE Pulchowk, Nepal", period: "Completed" },
                { role: "DeepLearning.AI - AI For Everyone", company: "Coursera", period: "Certified" },
                { role: "IBM - What is Data Science", company: "Coursera", period: "Certified" },
                { role: "Google Project Management", company: "Coursera", period: "Certified" }
            ]
        }
    },

    // =========================================================
    // 7. VENUS - Design & User Experience
    // =========================================================
    venus: {
        id: 'venus',
        title: 'Design',
        subtitle: 'UI/UX & Creative Development',
        accentColor: '#FFB6C1',
        stats: [
            { label: 'UI Focus', value: 'User Experience' },
            { label: 'Animation Style', value: 'Smooth & Interactive' },
            { label: 'Design Approach', value: "'Vibe Coding'" }
        ],
        narrative: `Beauty in functionality. The art of creating interfaces that delight users while serving complex functionality. From responsive web apps to interactive 3D experiences, designing with both aesthetics and usability in mind.`,
        quote: `Good design is invisible. Great design is unforgettable.`,
        personal: {
            relation: 'Creative Expression',
            name: 'Design Philosophy',
            bio: 'The belief that beautiful interfaces enhance user experience and make complex technology accessible.'
        },
        professional: {
            title: "UI/UX & Frontend Design",
            summary: "Creating engaging, performant user experiences with modern web technologies. Specializing in responsive design, animations, and intuitive interfaces.",
            skills: [
                "React & Next.js - Component Architecture",
                "TypeScript - Type-safe Development",
                "Tailwind CSS - Utility-first Styling",
                "Three.js & WebGL - 3D Graphics & Animations",
                "GSAP - Advanced Animation Libraries",
                "Figma & Design Systems",
                "'Vibe Coding' - Intuitive Interface Design"
            ],
            projects: [
                { name: "Interactive Solar System", desc: "3D portfolio visualization with smooth animations", stack: "Three.js, WebGL, React" },
                { name: "Astro-Fusion Interface", desc: "Real-time AI chat platform design", stack: "Next.js, Responsive Design" },
                { name: "Oyster Banking UX", desc: "Secure biometric verification interface", stack: "React Native, UX Design" }
            ]
        }
    },

    // =========================================================
    // 8. SATURN - Career Timeline
    // =========================================================
    saturn: {
        id: 'saturn',
        title: 'Career',
        subtitle: 'Professional Journey & Experience',
        accentColor: '#8B7355',
        stats: [
            { label: 'Experience', value: '15+ Years' },
            { label: 'Companies', value: '6 Organizations' },
            { label: 'Career Path', value: 'Developer to Leader' }
        ],
        narrative: `The structure of professional growth. 15+ years of deliberate career progression, from mobile developer to engineering leader. Each role building upon the last, creating a foundation of experience and wisdom.`,
        quote: `Discipline is the bridge between goals and accomplishment.`,
        personal: {
            relation: 'Professional Growth',
            name: 'Career Structure',
            bio: 'The methodical approach to career development, building skills and leadership capabilities over time.'
        },
        professional: {
            title: "Career Progression",
            summary: "15+ years of professional development from mobile developer to Head of Engineering. Progressive roles building technical expertise and leadership capabilities.",
            skills: [
                "Mobile Development - iOS, React Native, Cross-platform",
                "Leadership & Team Management",
                "AI/ML Integration & Architecture",
                "Product Development & Strategy",
                "International Collaboration",
                "Legacy System Modernization"
            ],
            history: [
                { role: "Head of Engineering", company: "big B soft", period: "Aug 2016 - Current" },
                { role: "Senior Software Engineer", company: "The Project Factory Team (Remote)", period: "Dec 2021 - Oct 2022" },
                { role: "Director of Software Engineering", company: "Sea Foam Media & Technology (Remote)", period: "Feb 2018 - July 2020" },
                { role: "Mobile Team Lead, Sr. iOS Developer", company: "Leapfrog Technology", period: "July 2014 - July 2016" },
                { role: "Mobile App Developer", company: "Braindigit", period: "Jan 2013 - July 2014" }
            ]
        }
    },

    // =========================================================
    // 9. NEPTUNE - Ethics & Community
    // =========================================================
    neptune: {
        id: 'neptune',
        title: 'Ethics',
        subtitle: 'Community & Responsible Technology',
        accentColor: '#5B9BD5',
        stats: [
            { label: 'Community Impact', value: 'Global Reach' },
            { label: 'Ethics Focus', value: 'Responsible AI' },
            { label: 'Open Source', value: 'Knowledge Sharing' }
        ],
        narrative: `The depth of responsible technology. Ethics and community that extend beyond individual success. Building technology that helps rather than harms, and sharing knowledge that empowers others.`,
        quote: `The best code is the one that helps, not harms. The best technology serves humanity.`,
        personal: {
            relation: 'Ethical Foundation',
            name: 'Responsible Innovation',
            bio: 'The commitment to using technology as a force for good and ensuring AI development benefits society.'
        },
        professional: {
            title: "Ethical Technology & Community",
            summary: "Commitment to responsible AI development, open source contributions, and community building. Ensuring technology serves humanity while maintaining high ethical standards.",
            skills: [
                "Ethical AI Implementation & Bias Mitigation",
                "Data Privacy & Security Best Practices",
                "Inclusive Technology Development",
                "Open Source Contribution & Collaboration",
                "Community Building & Mentorship",
                "Responsible Machine Learning"
            ],
            projects: [
                { name: "Open Source Portfolio", desc: "Personal website and tools for knowledge sharing", stack: "Web Technologies, Open Source" },
                { name: "Astro-Fusion LMS", desc: "Educational platform for structured learning", stack: "Next.js, Educational Technology" },
                { name: "Mentorship Platforms", desc: "Turing Network, Openmind Learning, Hackhands", stack: "Community Platforms" }
            ]
        }
    }
};
