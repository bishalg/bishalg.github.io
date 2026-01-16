# The Architect's Universe

A cinematic 3D portfolio that bridges the gap between **Software Engineering** and **Vedic Astrology**. 

This project is not just a showcase of skills; it is a "Living Horoscope" where the Solar System acts as a metaphor for my life's journey. Each planet represents a distinct archetype—from the logical foundations of **Earth** (Coding/Origins) to the visionary leadership of the **Sun** (Career/Philosophy).

## 🌌 The Philosophy
As a professional **Full-Stack Developer** and **Astrologer**, I sought to create a digital experience that reflects this duality. The application treats the browser as a telescope and the scrollbar as a time machine, guiding the user through a narrative that is both personal and cosmic.

## 🛠 Technical Stack
The core engine is built on standard web technologies, pushed to their limits with WebGL and hardware acceleration.

-   **Three.js**: For the core 3D scene graph, mesh generation, and material management.
-   **GSAP (GreenSock Animation Platform)**: specifically `ScrollTrigger`, driving the timeline-based animations.
-   **Lenis**: For normalizing scroll inertia across different devices, ensuring a "weighty" cinematic feel.
-   **Vanilla JS (ES6 Modules)**: No heavy frameworks (React/Vue) were used for the core engine to maintain maximum performance and control over the render loop.

## 🚀 Engineering Challenges & Solutions

### 1. The Scroll-Driven Camera System
One of the primary challenges was mapping linear 2D scroll progress to complex 3D orbital movements. We didn't want a static "fly-by"; we wanted dynamic tracking.

*   **Solution**: We implemented `src/core/ScrollAnimator.js`, which creates a master GSAP timeline.
*   **The Logic**: Instead of animating the camera to fixed coordinates, we animate it relative to the *moving* planets. 
*   **Dynamic LookAt**: A custom `trackTarget()` function updates the camera's `lookAt` vector every frame during scroll. This ensures that even as a planet orbits the sun (revolution), the camera stays locked onto it, creating a cinematic "tracking shot" effect rather than a static pans.

```javascript
// Example: Dynamic Camera Tracking
this.timeline.to(camera.position, {
    x: () => groups.earth.position.x + 15, // Dynamic destination
    onUpdate: () => trackTarget(groups.earth) // Lock focus
});
```

### 2. High-Fidelity Texturing & Lighting
To achieve the "Site of the Day" aesthetic, standard materials were insufficient.

*   **PBR Materials**: We utilized `MeshStandardMaterial` for realistic light interaction.
*   **Saturn's Rings**: Created using `RingGeometry` with a custom alpha map transparency, allowing stars to be visible *through* the gaps in the rings.
*   **The Sun**: Composed of multiple layers—an inner emissive sphere for the core and an outer, additive-blending sphere for the corona/glow effect.
*   **Filmic Tone Mapping**: The renderer uses `ACESFilmicToneMapping` to handle high dynamic range lighting, preventing the bright sun from looking flat and washed out.

### 3. The "Living" Content Layer
We separated the data from the view to facilitate the dual narrative.

*   **Holographic HUD**: The `Holocard.js` component is a DOM-based UI overlay that syncs with the WebGL scene.
*   **Real-Time Computation**: The Earth panel features an "Age User" calculated in real-time (`TimeUtils.js`), displaying the exact number of days I have lived vs. the age of the Earth.
*   **Data Injection**: Planetary data (Scientific stats, Personal Archetypes, Professional CV) is injected dynamically from `solarSystemData.js` when the scroll triggers a specific scene.

## 📦 Project Structure
```bash
src/
├── core/
│   ├── CosmicScene.js    # Three.js Scene Graph & Render Loop
│   └── ScrollAnimator.js # GSAP Timeline & Camera Pathing
├── data/
│   └── solarSystemData.js # The Content Layer (CV, History, Archetypes)
├── ui/
│   ├── Holocard.js        # 3-Panel HUD Component
│   └── HUDComponents.js   # HTML Generators
├── utils/
│   └── TimeUtils.js       # Real-time age calculations
├── config.js              # Global physics & visual settings
└── main.js                # App Entry Point
```

## 🧪 Testing
The architecture is supported by a suite of tests to ensure reliability:
*   **Unit Tests**: Verify utility logic (time calculations).
*   **E2E Tests (Playwright)**: Verify the critical user path—loading the site, scrolling to Earth, and ensuring the Holographic UI reveals correctly.

## 🏃‍♂️ Running Locally
1.  Install dependencies: `npm install`
2.  Start the dev server: `npx serve .`
3.  Visit: `http://localhost:3000`
