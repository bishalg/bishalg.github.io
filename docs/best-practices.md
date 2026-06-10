# 🌌 Engineering Best Practices

This document outlines the best practices for 3D web development, specifically tailored for this project's stack (Three.js, GSAP, Lenis) and potential future integrations with React Three Fiber (R3F).

## 🎭 React Three Fiber (R3F)

If migrating or adding new components using R3F, follow these guidelines to ensure performance and maintainability.

### 1. Scene Management
-   **`Canvas` Configuration**:
    -   Set `dpr={[1, 2]}` to clamp the pixel ratio, preventing performance issues on high-density screens.
    -   Use `frameloop="demand"` for static scenes to only render when necessary.
-   **Component Structure**: Break down the scene into small, reusable components (e.g., `<Planet />`, `<StarField />`).

### 2. Scroll Controls (`@react-three/drei`)
-   Use `ScrollControls` for a seamless HTML-WebGL integration.
-   **`useScroll` Hook**: Access scroll data (`offset`, `delta`) to drive animations.
    ```jsx
    const scroll = useScroll()
    useFrame(() => {
      mesh.current.rotation.y = scroll.offset * Math.PI * 2
    })
    ```
-   **Performance**: Use `GLTF` instancing for repeating elements (like stars or debris fields) to reduce draw calls.

### 3. Ecosystem & Resources
-   **Drei**: Always check `@react-three/drei` before building custom helpers. It contains optimized abstractions for cameras, controls, loading, and environments.
-   **Vercel Guide**: [Add 3D to your web projects with v0 and React Three Fiber](https://vercel.com/blog/add-3d-to-your-web-projects-with-v0-and-react-three-fiber)

---

## ⚡ Three.js (Vanilla / Current Stack)

Best practices for the current `src/core/CosmicScene.js` implementation.

### 1. Performance Optimization
-   **Geometry & Materials**:
    -   **Reuse Geometries**: Do not create new geometries in the render loop. Create them once and reuse.
    -   **Dispose Unused Assets**: When switching scenes or removing objects, explicitly call `.dispose()` on geometries, materials, and textures to prevent memory leaks.
-   **Render Loop**:
    -   Avoid object allocation (e.g., `new THREE.Vector3()`) inside `animate()` or `render()`. Reuse global or class-level variables.
    -   Use `renderer.info.render` to monitor draw calls.

### 2. Lighting & Shadows
-   **Baking**: For static environments, bake lighting into textures instead of using expensive real-time lights.
-   **Shadow Maps**: Only enable shadows for objects that absolutely need them. Use `castShadow` and `receiveShadow` sparingly.

---

## 📜 Smooth Scrolling (Lenis)

We use [Lenis](https://github.com/darkroomengineering/lenis) for that premium, weighty scroll feel.

### 1. Configuration for 3D Sync
-   **Sync with RAF**: Lenis must be updated within the custom requestAnimationFrame loop to ensure the 3D camera movement stays perfectly synced with the DOM scroll.
    ```javascript
    function raf(time) {
      lenis.raf(time)
      renderer.render(scene, camera)
      requestAnimationFrame(raf)
    }
    ```
-   **Damping**: A value between `0.05` (smoother, looser) and `0.1` (tighter) is optimal for storytelling sites.

### 2. GSAP Integration
-   Connect Lenis to GSAP's `ScrollTrigger` to ensure animations fire at the exact correct scroll position.
    ```javascript
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    ```

### 3. Mobile Considerations
-   **Touch Smoothing**: Ensure `smoothTouch: true` is set if we want the inertial effect on mobile.
-   **Performance**: On lower-end devices, consider disabling smooth scrolling or reducing the damping effect to free up main thread resources for WebGL.
