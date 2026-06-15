# RAKTechSoftHub Agency Website — Technical & System Documentation

---
**Prepared By:** RAK Tech Soft Hub Group
**Document Reference:** Website-Agency-v1.0-TechSpec
**Project:** RAKTechSoftHub Agency Website
**Date:** June 15, 2026
---

This document provides a comprehensive, descriptive technical guide for the **RAKTechSoftHub Agency Landing Page & Admin Settings Website**. It details the frontend architecture, file directory structures, client-side data persistence mechanisms, responsive styling, and hosting details.

---

## 1. System Overview

The **RAKTechSoftHub Agency Website** is a responsive, highly-interactive static Single Page Application (SPA) designed to act as the digital storefront for the agency. It showcases the agency's portfolio, digital creative services, and hardware IT infrastructure offerings, while collecting user inquiries and newsletter subscriptions.

### Architecture Topology:
```
[ Client Web Browser ]
        │
        ├── (HTTP Requests / CDN Edge) ──> [ Netlify Static Hosting Network ]
        │
        ├── (Styling Utilities) ──────────> [ TailwindCSS v3 CDN ]
        │
        ├── (3D Graphics Rendering) ──────> [ Three.js WebGL Engine ]
        │
        └── (Local Storage & Cookies) ────> [ Browser Cookies / Cache Data ]
```

---

## 2. Technical Stack

The landing page is designed to be lightweight, fast-loading, and zero-maintenance:

*   **HTML5 Structure**: Uses modern semantic tags (`<header>`, `<nav>`, `<section>`, `<article>`, `<footer>`) to optimize Search Engine Optimization (SEO) rankings and ensure accessibility compliance.
*   **TailwindCSS (v3 CDN)**: Used for rapid UI prototyping, responsive grid systems (up to desktop 1280px layouts), flexible spacing, flexbox alignments, and utility classes.
*   **Custom Styling (style.css)**: Supplements TailwindCSS with high-fidelity visual effects:
    *   **Glassmorphic Cards**: `.glass-card` uses `backdrop-filter: blur(12px)` and semitransparent borders to give a premium dark-mode feeling.
    *   **Glow Effects**: Radial glowing borders, text glows, and neon button accents.
    *   **Animations**: Custom keyframes for counter fades, marquee slides, and fade-in transitions.
*   **Three.js (r128) & WebGL**: Powers all high-performance 3D graphics on the page, including interactive particle systems, custom wireframe meshes, dynamic morphing shapes, and a 3D hologram asset loader.
*   **Vanilla JavaScript (ES6+)**: Handles all page logic, animations, client-side caching, and external URL redirects without the overhead of heavy SPA frameworks.
*   **CDNs Used**:
    *   *TailwindCSS*: `https://cdn.tailwindcss.com`
    *   *Google Fonts*: Inter, Plus Jakarta Sans, and JetBrains Mono for typography styling.
    *   *Material Icons*: Google Material Symbols Outlined icons library.
    *   *Three.js (Core)*: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
    *   *Three.js GLTFLoader*: `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js`

---

## 3. Detailed File & Directory Structure

The website is composed of four core files/directories located at the root of the workspace:

### 3.1 `index.html` (Structure & Layout)
This is the single entry-point file. It contains the complete page structure divided into the following key sections:
1.  **Head Metadata**: Loads external styles, custom fonts, meta tags (description, viewport, title), and CDNs.
2.  **Navigation Bar**: Fixed glassmorphic header with scroll-aware active highlights and sticky position.
3.  **Hero Section**: Bold agency tagline, dynamic particle glowing background, and Call-to-Action (CTA) redirects. Includes the canvas container for the 3D particle sphere.
4.  **Stats Counter Grid**: Showcases metrics (Completed projects, active clients, experience years) powered by scroll-triggered count animations.
5.  **Services Section**: Split sticky layout containing a large 3D WebGL morphing canvas on the left, and categorized services accordion list on the right (with "Digital" and "IT Infrastructure" tabs).
6.  **Portfolio Section**: Highlights recent projects with glassmorphic cards and interactive hover details.
7.  **Testimonials Carousel**: Swipeable/clickable slider displaying client reviews.
8.  **Contact Inquiry Form**: Captures name, email, phone, and inquiry messages, with fully validated inputs. It also houses the 3D Astronaut Hologram canvas.
9.  **Footer Section**: Site links, social handles, newsletter subscription form, and Copyright details.

### 3.2 `style.css` (Premium Visual Styling)
Defines the visual system and custom animations:
*   **CSS Variable Tokens**: Sets unified styling colors (dark backgrounds `#101415`, card overlays `rgba(29, 32, 34, 0.6)`, primary blue `#d2ecff`, accent purple `#bc00ff`, neon cyan `#00f2ff`).
*   **WebGL Canvas Sizing**: Sets canvas elements to a scaled `150%` size with custom position offsets (`top: -25%`, `left: -25%`) to expand the viewport bounds.
*   **Keyframes**:
    *   `pulse`: Creates breathing light transitions for decorative indicators.
    *   `spinClockwise` / `spinCounterClockwise`: Rotates layout visual decoration rings.
    *   `logoScroll`: Drives the infinite scrolling 3D logos marquee.
*   **Responsive Media Queries**: Fine-tunes elements for tablet and mobile viewports, including adjusting positions and dimensions of back-to-top buttons and toast containers.

### 3.3 `script.js` (Interactivity & Caching Logic)
Executes client-side UI behaviors:
*   **Smooth Scroll Navigation**: Intercepts link clicks to smoothly scroll the browser viewport to sections.
*   **Number Counter Animation**: Uses `IntersectionObserver` to trigger countups when the stats section enters the user's screen.
*   **Carousel Transition Logic**: Manages active index arrays to transition testimonials sliders.
*   **Validation & Submission Interceptors**: Listens to the Contact Form and Newsletter submissions, validates values, caches them locally, and resets form inputs.

### 3.4 `js/3d-animations.js` (WebGL Rendering & Morphing Engine)
Manages Three.js-based 3D animations and loading screens:
*   **Preloader System**: Simulates loading status updates and increments percentage progress before fading out.
*   **Hero Particle Sphere**: Renders an interactive 1,200 particle sphere that tilts relative to mouse hover positions, dispersing outward (dissolving) on mouseover.
*   **Services Single-Canvas Morphing**: Manages a single WebGL rendering context mapping to the left sticky canvas. Registers 12 distinct 3D particle geometries (cone, torus, octahedron, etc.) and morphs between them smoothly using a `transitionFactor` interpolation triggered by right-column accordion active states.
*   **CTA Hologram / Fallback**: Loads a GLTF Astronaut model with dynamic rotation and mouse hover scattering; automatically falls back to a network node globe if GLTF loading times out (6 seconds).
*   **Viewport Expansion Logic**: Sets renderer sizes to `1.5x` of container bounds to prevent particle clipping during dispersion/scatter animations.

---

## 4. Responsive & WebGL Optimizations

Due to the resource-intensive nature of real-time 3D WebGL rendering, specific performance and responsive optimizations are implemented:

*   **Mobile WebGL Bypass**:
    *   On devices with viewport width `< 768px` or when the rendering container collapses to a width of `0`, the WebGL loop initialization is completely bypassed.
    *   This prevents CPU and GPU thrashing on mobile browsers where rendering 3D particle systems could cause lag or layout collapses.
    *   The standard DOM event listeners (accordion click toggling, tab transitions) remain fully operational on mobile, ensuring a functional fallback layout.
*   **Intersection Observer Caching**:
    *   The Services section uses an `IntersectionObserver` to track when the canvas container is within the viewport.
    *   WebGL rendering ticks (`requestAnimationFrame`) are paused when the section scrolls out of view, reducing background GPU cycles and improving battery life on laptops and desktop systems.

---

## 5. Data Storage & Cookie Fallbacks

To operate entirely serverless while retaining user submissions locally, `script.js` contains a robust caching and fallback storage module.

### Caching Strategy:
```
                 [ Form Submit Event ]
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
          (Check Storage)     (Success Post)
          Is LocalStorage? ──> Save under key
                 │
                 ├─(No/Blocked)─> [ Write to Browser Cookies ]
                 ▼
          (Save Successful) ──> Show toast notification
```

### Storage Schemas:
1.  **Inquiries Database (`rak_inquiries`)**:
    Stored as a JSON array of objects:
    ```json
    [
      {
        "id": 1718115600123,
        "name": "Arsalan Khan",
        "email": "arsalan@example.com",
        "phone": "+92 300 1234567",
        "message": "Interested in CCTV installation for our office premises.",
        "date": "6/11/2026, 8:20 PM"
      }
    ]
    ```
2.  **Newsletter Subscribers (`rak_newsletter`)**:
    Stored as a JSON array of strings:
    ```json
    [
      "subscriber1@domain.com",
      "subscriber2@domain.com"
    ]
    ```
3.  **Site Settings (`rak_site_settings`)**:
    Maintains WhatsApp routing links and general support details:
    ```json
    {
      "whatsapp_num": "+923092003125",
      "default_message": "Assalam o Alaikum, I visited your website and want to inquire about your services."
    }
    ```

### Cookie Fallback Implementation:
If browser permissions block `localStorage`, cookies are written with a 365-day expiry date using helper methods:
```javascript
function setCookie(name, value) {
  const date = new Date();
  date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
  document.cookie = name + "=" + JSON.stringify(value) + ";path=/;expires=" + date.toUTCString();
}
```

---

## 6. Deployment & Configuration (Netlify)

The website is hosted on **Netlify** for global distribution and high uptime:
*   **Deployment Method**: Integrated Git continuous deployment or folder drop.
*   **Headers Configuration**: Includes standard caching controls for faster resource loads.
*   **SSL Encryption**: Provisioned with a Let's Encrypt SSL certificate.
*   **Form Redirect Handling**: Can be extended with `netlify-forms` tags (`data-netlify="true"`) to capture entries in Netlify's admin dashboards.

---
*Prepared & Maintained by RAK Tech Soft Hub Group. © 2026 All Rights Reserved.*
