/**
 * config.js
 * Global configuration for the Cosmic CV
 */

export const CONFIG = {
    // Camera settings
    camera: {
        fov: {
            desktop: 60,
            mobile: 75
        },
        near: 0.1,
        far: 5000,
        initialPosition: { x: 0, y: 120, z: 200 } // Elevated "God View"
    },

    // Celestial bodies - Stylized but physically inspired
    // Distance: Stylized units from (0,0,0)
    // Speed: Radians per frame
    planets: {
        sun: {
            name: 'sun',
            radius: 12,
            texture: 'textures/sun_texture_2k_small.jpg',
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: 1.2,
            distance: 0,
            angle: 0,
            speed: 0.0002,
            rotationSpeed: 0.0005
        },
        mercury: {
            name: 'mercury',
            radius: 1.2,
            texture: 'textures/mercury_texture_2k_small.jpg',
            color: 0x8C7853,
            distance: 30,
            angle: Math.random() * Math.PI * 2,
            speed: 0.004,
            rotationSpeed: 0.002
        },
        venus: {
            name: 'venus',
            radius: 2.5,
            texture: 'textures/venus_texture_2k_small.jpg',
            color: 0xFFC649,
            distance: 45,
            angle: Math.random() * Math.PI * 2,
            speed: 0.003,
            rotationSpeed: 0.0015
        },
        earth: {
            name: 'earth',
            radius: 3,
            texture: 'textures/earth_daymap_texture_2k_small.jpg',
            color: 0x6B93D6,
            distance: 65,
            angle: 0.5,
            speed: 0.002,
            rotationSpeed: 0.002
        },
        moon: {
            name: 'moon',
            radius: 0.8,
            texture: 'textures/moon_texture_2k_small.jpg',
            color: 0xCCCCCC,
            distance: 8,
            angle: 0,
            speed: 0.01,
            rotationSpeed: 0.005
        },
        mars: {
            name: 'mars',
            radius: 1.8,
            texture: 'textures/mars_texture_2k_small.jpg',
            color: 0xC1440E,
            distance: 85,
            angle: Math.random() * Math.PI * 2,
            speed: 0.0018,
            rotationSpeed: 0.002
        },
        jupiter: {
            name: 'jupiter',
            radius: 9,
            texture: 'textures/jupiter_texture_2k_small.jpg',
            color: 0xD8CA9D,
            distance: 130,
            angle: Math.random() * Math.PI * 2,
            speed: 0.0008,
            rotationSpeed: 0.004
        },
        saturn: {
            name: 'saturn',
            radius: 8,
            texture: 'textures/saturn_texture_2k_small.jpg',
            color: 0xFAD5A5,
            distance: 180,
            angle: Math.random() * Math.PI * 2,
            speed: 0.0006,
            rotationSpeed: 0.003,
            hasRing: true,
            ringTexture: 'textures/saturn_ring_alpha_2k_small.png'
        },
        uranus: {
            name: 'uranus',
            radius: 5,
            texture: 'textures/uranus_texture_2k_small.jpg',
            color: 0xAFDBF5,
            distance: 230,
            angle: Math.random() * Math.PI * 2,
            speed: 0.0004,
            rotationSpeed: 0.002
        },
        neptune: {
            name: 'neptune',
            radius: 4.8,
            texture: 'textures/neptune_texture_2k_small.jpg',
            color: 0x5B5DDF,
            distance: 270,
            angle: Math.random() * Math.PI * 2,
            speed: 0.0003,
            rotationSpeed: 0.002
        }
    },

    // Stars configuration
    stars: {
        count: 8000,
        spread: 2000,
        size: 0.7
    },

    // Scroll settings
    scroll: {
        scrub: 1.0, // Snappier response
        scenes: {
            hero: { start: 0, end: 0.15 },
            earth: { start: 0.15, end: 0.40 },
            moon: { start: 0.40, end: 0.65 },
            sun: { start: 0.65, end: 1.0 }
        }
    },

    // Performance
    maxPixelRatio: 2
};