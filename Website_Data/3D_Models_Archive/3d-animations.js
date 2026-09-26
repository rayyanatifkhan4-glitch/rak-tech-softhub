/* ==========================================================================
   RAKTechSoftHub — Unified 3D WebGL & Particle Morphing Engine
   Based on Antimatter AI 3D Agency Reference (Awwwards 60FPS Standard)
   ========================================================================== */

(function() {
    'use strict';

    // Global engine state
    window.RAK3D = {
        currentShape: 'cube',
        morphTo: null
    };

    document.addEventListener('DOMContentLoaded', () => {
        initHeroParticleSphere();
        initServicesParticleMorphing();
        initCaseStudiesTilt();
        initAstronautCta();
    });

    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Helper: Shared circular glow particle sprite
    function createGlowSprite() {
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 32;
        pCanvas.height = 32;
        const pCtx = pCanvas.getContext('2d');
        const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.25, 'rgba(168, 226, 255, 0.95)');
        grad.addColorStop(0.55, 'rgba(138, 108, 255, 0.6)');
        grad.addColorStop(1, 'rgba(138, 108, 255, 0)');
        pCtx.fillStyle = grad;
        pCtx.fillRect(0, 0, 32, 32);
        return new THREE.CanvasTexture(pCanvas);
    }

    /* ==========================================================================
       1. Hero 3D Particle Sphere (Antimatter Reference 00:02 - 00:11)
       ========================================================================== */
    function initHeroParticleSphere() {
        const container = document.getElementById('hero-canvas-container');
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.z = 4.2;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        function resizeHero() {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
        window.addEventListener('resize', resizeHero);

        const particleCount = 1400;
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const cCyan = new THREE.Color('#42C8F5');
        const cIce = new THREE.Color('#A8E2FF');
        const cViolet = new THREE.Color('#8A6CFF');

        for (let i = 0; i < particleCount; i++) {
            const y = 1 - (i / (particleCount - 1)) * 2;
            const radius = Math.sqrt(1 - y * y);
            const phi = i * 2.399963229728653; // golden angle
            const r = 1.7 + (Math.random() - 0.5) * 0.15;

            positions[i * 3] = Math.cos(phi) * radius * r;
            positions[i * 3 + 1] = y * r;
            positions[i * 3 + 2] = Math.sin(phi) * radius * r;

            originalPositions[i * 3] = positions[i * 3];
            originalPositions[i * 3 + 1] = positions[i * 3 + 1];
            originalPositions[i * 3 + 2] = positions[i * 3 + 2];

            const rand = Math.random();
            let col = (rand < 0.5) ? cCyan.clone().lerp(cIce, rand * 2) : cIce.clone().lerp(cViolet, (rand - 0.5) * 2);
            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            map: createGlowSprite(),
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const sphere = new THREE.Points(geometry, material);
        scene.add(sphere);

        // Core wireframe icosahedron
        const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x8A6CFF,
            wireframe: true,
            transparent: true,
            opacity: 0.16,
            blending: THREE.AdditiveBlending
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        scene.add(coreMesh);

        // Mouse Parallax
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;

        window.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // ScrollTrigger: Shrink and fade Hero sphere as user scrolls
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.to(camera.position, {
                z: 2.8,
                y: -1.2,
                scrollTrigger: {
                    trigger: '#home',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.2
                }
            });
            gsap.to(material, {
                opacity: 0,
                scrollTrigger: {
                    trigger: '#home',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.2
                }
            });
        }

        function animateHero() {
            requestAnimationFrame(animateHero);

            if (prefersReducedMotion()) {
                renderer.render(scene, camera);
                return;
            }

            const time = performance.now() * 0.001;

            targetX += (mouseX * 0.3 - targetX) * 0.05;
            targetY += (-mouseY * 0.2 - targetY) * 0.05;

            sphere.rotation.y += 0.0025 + targetX * 0.01;
            sphere.rotation.x = Math.sin(time * 0.5) * 0.05 + targetY * 0.01;

            coreMesh.rotation.y -= 0.003;
            coreMesh.rotation.x += 0.0015;

            // Subtle harmonic pulse
            const pos = geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i += 4) {
                const ox = originalPositions[i * 3];
                const oy = originalPositions[i * 3 + 1];
                const oz = originalPositions[i * 3 + 2];
                const wave = Math.sin(time * 2 + ox * 3 + oy * 3) * 0.03;
                pos[i * 3] = ox * (1 + wave);
                pos[i * 3 + 1] = oy * (1 + wave);
                pos[i * 3 + 2] = oz * (1 + wave);
            }
            geometry.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        }
        animateHero();
    }

    /* ==========================================================================
       2. Services 3D Particle Morphing Engine (Antimatter Reference 00:13 - 00:25)
       ========================================================================== */
    function initServicesParticleMorphing() {
        const container = document.getElementById('services-canvas-container');
        const hudShapeLabel = document.getElementById('hud-active-shape');
        if (!container) return;

        const PARTICLE_COUNT = 1800;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.z = 4.3;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        function resizeServices() {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
        window.addEventListener('resize', resizeServices);

        // Particle Coordinates Buffers
        const currentPositions = new Float32Array(PARTICLE_COUNT * 3);
        const sourcePositions = new Float32Array(PARTICLE_COUNT * 3);
        const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const disperseOffsets = new Float32Array(PARTICLE_COUNT * 3);

        const cCyan = new THREE.Color('#42C8F5');
        const cIce = new THREE.Color('#A8E2FF');
        const cViolet = new THREE.Color('#8A6CFF');
        const cMagenta = new THREE.Color('#D946EF');

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const rand = Math.random();
            let col;
            if (rand < 0.4) col = cCyan.clone().lerp(cIce, rand * 2.5);
            else if (rand < 0.75) col = cIce.clone().lerp(cViolet, (rand - 0.4) * 2.8);
            else col = cViolet.clone().lerp(cMagenta, (rand - 0.75) * 4);

            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;

            const u = Math.random() * 2 - 1;
            const theta = Math.random() * Math.PI * 2;
            const r = Math.sqrt(1 - u * u);
            disperseOffsets[i * 3] = r * Math.cos(theta) * (0.8 + Math.random() * 0.8);
            disperseOffsets[i * 3 + 1] = r * Math.sin(theta) * (0.8 + Math.random() * 0.8);
            disperseOffsets[i * 3 + 2] = u * (0.8 + Math.random() * 0.8);
        }

        // 6 Precise Mathematical Geometries
        const shapes = {
            // 01 Cube (Product Design)
            cube: (function() {
                const arr = new Float32Array(PARTICLE_COUNT * 3);
                const size = 1.35;
                const edges = [
                    [[-size, -size, -size], [size, -size, -size]],
                    [[size, -size, -size], [size, -size, size]],
                    [[size, -size, size], [-size, -size, size]],
                    [[-size, -size, size], [-size, -size, -size]],
                    [[-size, size, -size], [size, size, -size]],
                    [[size, size, -size], [size, size, size]],
                    [[size, size, size], [-size, size, size]],
                    [[-size, size, size], [-size, size, -size]],
                    [[-size, -size, -size], [-size, size, -size]],
                    [[size, -size, -size], [size, size, -size]],
                    [[size, -size, size], [size, size, size]],
                    [[-size, -size, size], [-size, size, size]],
                    [[-size, 0, -size], [size, 0, -size]],
                    [[-size, 0, size], [size, 0, size]],
                    [[0, -size, -size], [0, size, -size]],
                    [[0, -size, size], [0, size, size]]
                ];
                const pPerEdge = Math.floor(PARTICLE_COUNT / edges.length);
                let idx = 0;
                edges.forEach(([p1, p2]) => {
                    for (let j = 0; j < pPerEdge && idx < PARTICLE_COUNT; j++) {
                        const t = j / (pPerEdge - 1);
                        const jitter = (Math.random() - 0.5) * 0.05;
                        arr[idx * 3] = (p1[0] + (p2[0] - p1[0]) * t) + jitter;
                        arr[idx * 3 + 1] = (p1[1] + (p2[1] - p1[1]) * t) + jitter;
                        arr[idx * 3 + 2] = (p1[2] + (p2[2] - p1[2]) * t) + jitter;
                        idx++;
                    }
                });
                while (idx < PARTICLE_COUNT) {
                    arr[idx * 3] = (Math.random() - 0.5) * size * 1.5;
                    arr[idx * 3 + 1] = (Math.random() - 0.5) * size * 1.5;
                    arr[idx * 3 + 2] = (Math.random() - 0.5) * size * 1.5;
                    idx++;
                }
                const rotX = 0.45, rotY = 0.65;
                for (let i = 0; i < PARTICLE_COUNT; i++) {
                    let x = arr[i * 3], y = arr[i * 3 + 1], z = arr[i * 3 + 2];
                    let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
                    let z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
                    let y2 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
                    let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
                    arr[i * 3] = x1; arr[i * 3 + 1] = y2; arr[i * 3 + 2] = z2;
                }
                return arr;
            })(),

            // 02 Code Brackets </> (Development)
            code: (function() {
                const arr = new Float32Array(PARTICLE_COUNT * 3);
                let idx = 0;
                const pLeft = 450;
                for (let i = 0; i < pLeft; i++) {
                    const t = i / pLeft;
                    const y = (t - 0.5) * 2.2;
                    arr[idx * 3] = -1.5 + Math.abs(y) * 0.75;
                    arr[idx * 3 + 1] = y;
                    arr[idx * 3 + 2] = (Math.random() - 0.5) * 0.25;
                    idx++;
                }
                const pSlash = 450;
                for (let i = 0; i < pSlash; i++) {
                    const t = i / pSlash;
                    const y = (t - 0.5) * 2.5;
                    arr[idx * 3] = y * 0.45;
                    arr[idx * 3 + 1] = y;
                    arr[idx * 3 + 2] = (Math.random() - 0.5) * 0.25;
                    idx++;
                }
                const pRight = 450;
                for (let i = 0; i < pRight; i++) {
                    const t = i / pRight;
                    const y = (t - 0.5) * 2.2;
                    arr[idx * 3] = 1.5 - Math.abs(y) * 0.75;
                    arr[idx * 3 + 1] = y;
                    arr[idx * 3 + 2] = (Math.random() - 0.5) * 0.25;
                    idx++;
                }
                while (idx < PARTICLE_COUNT) {
                    const angle = Math.random() * Math.PI * 2;
                    const rad = 1.6 + Math.random() * 0.5;
                    arr[idx * 3] = Math.cos(angle) * rad;
                    arr[idx * 3 + 1] = Math.sin(angle) * rad * 0.7;
                    arr[idx * 3 + 2] = (Math.random() - 0.5) * 0.8;
                    idx++;
                }
                return arr;
            })(),

            // 03 Growth Bar Chart & Arrow (GTM Strategy)
            growth: (function() {
                const arr = new Float32Array(PARTICLE_COUNT * 3);
                let idx = 0;
                const bars = [{ x: -1.3, h: 0.8 }, { x: -0.3, h: 1.5 }, { x: 0.7, h: 2.2 }];
                const pPerBar = 320;
                bars.forEach(b => {
                    for (let i = 0; i < pPerBar && idx < PARTICLE_COUNT; i++) {
                        const t = Math.random();
                        const y = -1.2 + t * b.h;
                        const w = 0.5, d = 0.4;
                        arr[idx * 3] = b.x + (Math.random() < 0.6 ? (Math.random() < 0.5 ? -w/2 : w/2) : (Math.random() - 0.5) * w);
                        arr[idx * 3 + 1] = y;
                        arr[idx * 3 + 2] = (Math.random() < 0.6 ? (Math.random() < 0.5 ? -d/2 : d/2) : (Math.random() - 0.5) * d);
                        idx++;
                    }
                });
                const arrowCount = 500;
                for (let i = 0; i < arrowCount && idx < PARTICLE_COUNT; i++) {
                    const t = i / arrowCount;
                    if (t < 0.8) {
                        const st = t / 0.8;
                        arr[idx * 3] = -1.6 + (1.4 - (-1.6)) * st;
                        arr[idx * 3 + 1] = -0.9 + (1.6 - (-0.9)) * st;
                        arr[idx * 3 + 2] = 0.3 + (Math.random() - 0.5) * 0.15;
                    } else {
                        const headT = (t - 0.8) / 0.2;
                        const wing = (headT < 0.5 ? headT * 2 : (headT - 0.5) * 2);
                        arr[idx * 3] = 1.4 - wing * 0.45;
                        arr[idx * 3 + 1] = 1.6 - wing * 0.45 * (headT < 0.5 ? -0.3 : 1.2);
                        arr[idx * 3 + 2] = 0.3 + (Math.random() - 0.5) * 0.15;
                    }
                    idx++;
                }
                while (idx < PARTICLE_COUNT) {
                    arr[idx * 3] = (Math.random() - 0.5) * 3.0;
                    arr[idx * 3 + 1] = -1.2 + (Math.random() - 0.5) * 0.1;
                    arr[idx * 3 + 2] = (Math.random() - 0.5) * 1.2;
                    idx++;
                }
                return arr;
            })(),

            // 04 DNA Double Helix (Healthcare Apps)
            dna: (function() {
                const arr = new Float32Array(PARTICLE_COUNT * 3);
                let idx = 0;
                const turns = 3.5, height = 3.0, radius = 0.85, strandPoints = 650;
                for (let i = 0; i < strandPoints; i++) {
                    const t = i / strandPoints;
                    const angle = t * Math.PI * 2 * turns;
                    const y = (t - 0.5) * height;
                    arr[idx * 3] = Math.cos(angle) * radius;
                    arr[idx * 3 + 1] = y;
                    arr[idx * 3 + 2] = Math.sin(angle) * radius;
                    idx++;
                }
                for (let i = 0; i < strandPoints; i++) {
                    const t = i / strandPoints;
                    const angle = t * Math.PI * 2 * turns + Math.PI;
                    const y = (t - 0.5) * height;
                    arr[idx * 3] = Math.cos(angle) * radius;
                    arr[idx * 3 + 1] = y;
                    arr[idx * 3 + 2] = Math.sin(angle) * radius;
                    idx++;
                }
                const rungs = 16;
                const pPerRung = Math.floor((PARTICLE_COUNT - idx) / rungs);
                for (let r = 0; r < rungs && idx < PARTICLE_COUNT; r++) {
                    const t = r / (rungs - 1);
                    const angle = t * Math.PI * 2 * turns;
                    const y = (t - 0.5) * height;
                    const p1 = [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
                    const p2 = [Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius];
                    for (let j = 0; j < pPerRung && idx < PARTICLE_COUNT; j++) {
                        const f = j / (pPerRung - 1);
                        arr[idx * 3] = p1[0] + (p2[0] - p1[0]) * f;
                        arr[idx * 3 + 1] = y;
                        arr[idx * 3 + 2] = p1[2] + (p2[2] - p1[2]) * f;
                        idx++;
                    }
                }
                while (idx < PARTICLE_COUNT) {
                    arr[idx * 3] = (Math.random() - 0.5) * 0.5;
                    arr[idx * 3 + 1] = (Math.random() - 0.5) * height;
                    arr[idx * 3 + 2] = (Math.random() - 0.5) * 0.5;
                    idx++;
                }
                return arr;
            })(),

            // 05 AI Sparkle Stars (AI Development)
            stars: (function() {
                const arr = new Float32Array(PARTICLE_COUNT * 3);
                let idx = 0;
                function addStar(cx, cy, cz, scale, pCount) {
                    for (let i = 0; i < pCount && idx < PARTICLE_COUNT; i++) {
                        const theta = Math.random() * Math.PI * 2;
                        const cosT = Math.cos(theta), sinT = Math.sin(theta);
                        const r = Math.pow(Math.abs(cosT), 3) + Math.pow(Math.abs(sinT), 3);
                        const dist = (1 / (r + 0.1)) * scale * (0.2 + Math.random() * 0.8);
                        arr[idx * 3] = cx + cosT * dist;
                        arr[idx * 3 + 1] = cy + sinT * dist;
                        arr[idx * 3 + 2] = cz + (Math.random() - 0.5) * 0.4 * scale;
                        idx++;
                    }
                }
                addStar(0, 0, 0, 1.4, 1100);
                addStar(1.2, 1.0, 0.2, 0.65, 380);
                addStar(-1.1, -0.9, -0.2, 0.55, 320);
                while (idx < PARTICLE_COUNT) {
                    arr[idx * 3] = (Math.random() - 0.5) * 2.8;
                    arr[idx * 3 + 1] = (Math.random() - 0.5) * 2.8;
                    arr[idx * 3 + 2] = (Math.random() - 0.5) * 0.6;
                    idx++;
                }
                return arr;
            })(),

            // 06 Constellation Mesh (IoT Infrastructure)
            network: (function() {
                const arr = new Float32Array(PARTICLE_COUNT * 3);
                let idx = 0;
                const nodes = [
                    [0, 1.5, 0], [1.2, 0.8, 0.6], [-1.2, 0.8, -0.6],
                    [1.4, -0.4, -0.5], [-1.4, -0.4, 0.5], [0, -1.5, 0],
                    [0.7, 0.2, -1.1], [-0.7, 0.2, 1.1], [0.9, -1.0, 0.7],
                    [-0.9, -1.0, -0.7], [0, 0, 1.4], [0, 0, -1.4],
                    [0.4, 0.9, 0.9], [-0.4, -0.9, -0.9]
                ];
                nodes.forEach(n => {
                    for (let i = 0; i < 40 && idx < PARTICLE_COUNT; i++) {
                        const rad = Math.random() * 0.18, th = Math.random() * Math.PI * 2;
                        arr[idx * 3] = n[0] + Math.cos(th) * rad;
                        arr[idx * 3 + 1] = n[1] + Math.sin(th) * rad;
                        arr[idx * 3 + 2] = n[2] + (Math.random() - 0.5) * rad;
                        idx++;
                    }
                });
                for (let a = 0; a < nodes.length && idx < PARTICLE_COUNT; a++) {
                    for (let b = a + 1; b < nodes.length && idx < PARTICLE_COUNT; b++) {
                        const dist = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1], nodes[a][2] - nodes[b][2]);
                        if (dist < 2.2) {
                            for (let k = 0; k < 18 && idx < PARTICLE_COUNT; k++) {
                                const t = k / 17;
                                arr[idx * 3] = nodes[a][0] + (nodes[b][0] - nodes[a][0]) * t;
                                arr[idx * 3 + 1] = nodes[a][1] + (nodes[b][1] - nodes[a][1]) * t;
                                arr[idx * 3 + 2] = nodes[a][2] + (nodes[b][2] - nodes[a][2]) * t;
                                idx++;
                            }
                        }
                    }
                }
                while (idx < PARTICLE_COUNT) {
                    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2;
                    const r = Math.sqrt(1 - u * u) * 1.5;
                    arr[idx * 3] = r * Math.cos(th);
                    arr[idx * 3 + 1] = u * 1.5;
                    arr[idx * 3 + 2] = r * Math.sin(th);
                    idx++;
                }
                return arr;
            })()
        };

        const shapeLabels = {
            'cube': '01_PRODUCT_DESIGN (3D_CUBE)',
            'code': '02_DEVELOPMENT (CODE_TAGS)',
            'growth': '03_GTM_STRATEGY (GROWTH_CHART)',
            'dna': '04_HEALTHCARE_APPS (DOUBLE_HELIX)',
            'stars': '05_AI_DEVELOPMENT (AI_SPARKLES)',
            'network': '06_IOT_INFRASTRUCTURE (NODE_MESH)'
        };

        // Initialize with Cube
        currentPositions.set(shapes.cube);
        sourcePositions.set(shapes.cube);
        targetPositions.set(shapes.cube);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.08,
            vertexColors: true,
            map: createGlowSprite(),
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particleCloud = new THREE.Points(geometry, material);
        scene.add(particleCloud);

        const morphState = { progress: 1.0, burst: 0.0 };

        function morphTo(shapeKey) {
            if (!shapes[shapeKey] || shapeKey === window.RAK3D.currentShape) return;
            window.RAK3D.currentShape = shapeKey;

            if (hudShapeLabel && shapeLabels[shapeKey]) {
                hudShapeLabel.textContent = shapeLabels[shapeKey];
            }

            sourcePositions.set(geometry.attributes.position.array);
            targetPositions.set(shapes[shapeKey]);

            if (typeof gsap !== 'undefined') {
                gsap.killTweensOf(morphState);
                morphState.progress = 0;
                gsap.to(morphState, {
                    progress: 1,
                    duration: 1.15,
                    ease: 'power3.out',
                    onUpdate: () => {
                        const p = morphState.progress;
                        morphState.burst = Math.sin(p * Math.PI) * 0.7;
                    }
                });
            } else {
                currentPositions.set(shapes[shapeKey]);
                geometry.attributes.position.needsUpdate = true;
            }
        }
        window.RAK3D.morphTo = morphTo;

        // Mouse Parallax for Services Canvas
        let mouseX = 0, mouseY = 0;
        let targetRotX = 0, targetRotY = 0;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        });

        let lastTime = performance.now();
        function animateServices() {
            requestAnimationFrame(animateServices);

            if (prefersReducedMotion()) {
                renderer.render(scene, camera);
                return;
            }

            const now = performance.now();
            const time = now * 0.001;

            targetRotY += (mouseX * 0.35 - targetRotY) * 0.05;
            targetRotX += (-mouseY * 0.25 - targetRotX) * 0.05;

            particleCloud.rotation.y += 0.003 + targetRotY * 0.01;
            particleCloud.rotation.x = Math.sin(time * 0.4) * 0.06 + targetRotX;

            const pos = geometry.attributes.position.array;
            const p = morphState.progress;
            const burst = morphState.burst;

            if (p < 1.0 || burst > 0.001) {
                for (let i = 0; i < PARTICLE_COUNT; i++) {
                    const idx = i * 3;
                    const bx = disperseOffsets[idx] * burst;
                    const by = disperseOffsets[idx + 1] * burst;
                    const bz = disperseOffsets[idx + 2] * burst;

                    pos[idx] = sourcePositions[idx] + (targetPositions[idx] - sourcePositions[idx]) * p + bx;
                    pos[idx + 1] = sourcePositions[idx + 1] + (targetPositions[idx + 1] - sourcePositions[idx + 1]) * p + by;
                    pos[idx + 2] = sourcePositions[idx + 2] + (targetPositions[idx + 2] - sourcePositions[idx + 2]) * p + bz;
                }
                geometry.attributes.position.needsUpdate = true;
            } else {
                for (let i = 0; i < PARTICLE_COUNT; i += 6) {
                    const idx = i * 3;
                    const tx = targetPositions[idx], ty = targetPositions[idx + 1], tz = targetPositions[idx + 2];
                    const wave = Math.sin(time * 1.8 + tx * 2 + ty * 2) * 0.012;
                    pos[idx] = tx + wave;
                    pos[idx + 1] = ty + wave;
                    pos[idx + 2] = tz + wave;
                }
                geometry.attributes.position.needsUpdate = true;
            }

            renderer.render(scene, camera);
        }
        animateServices();

        initServicesScrollTriggers();
    }

    /* ==========================================================================
       3. ScrollTriggers for Pinned Services & Horizontal Scrub
       ========================================================================== */
    function initServicesScrollTriggers() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        gsap.registerPlugin(ScrollTrigger);

        const servicesSection = document.getElementById('services');
        const track = document.getElementById('services-track');
        const cards = document.querySelectorAll('.service-carousel-card');

        if (!servicesSection || !track || cards.length === 0) return;

        const cardShapes = ['cube', 'code', 'growth', 'dna', 'stars', 'network'];

        if (window.innerWidth >= 1024) {
            const totalCards = cards.length;

            gsap.to(track, {
                x: () => -(track.scrollWidth - track.clientWidth + 80),
                ease: 'none',
                scrollTrigger: {
                    trigger: servicesSection,
                    start: 'top top',
                    end: () => `+=${track.scrollWidth}`,
                    pin: true,
                    scrub: 0.8,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        const progress = self.progress;
                        const activeIdx = Math.min(
                            Math.floor(progress * totalCards),
                            totalCards - 1
                        );

                        cards.forEach((card, idx) => {
                            const isActive = idx === activeIdx;
                            card.classList.toggle('active-card', isActive);
                            if (isActive) {
                                const shape = card.dataset.shape || cardShapes[idx];
                                if (window.RAK3D.morphTo) {
                                    window.RAK3D.morphTo(shape);
                                }
                            }
                        });
                    }
                }
            });
        } else {
            cards.forEach((card, idx) => {
                ScrollTrigger.create({
                    trigger: card,
                    start: 'top 70%',
                    end: 'bottom 30%',
                    onEnter: () => activateCard(card, idx),
                    onEnterBack: () => activateCard(card, idx)
                });
            });
        }

        function activateCard(card, idx) {
            cards.forEach(c => c.classList.remove('active-card'));
            card.classList.add('active-card');
            const shape = card.dataset.shape || cardShapes[idx];
            if (window.RAK3D.morphTo) {
                window.RAK3D.morphTo(shape);
            }
        }

        cards.forEach((card, idx) => {
            card.addEventListener('click', () => activateCard(card, idx));
        });
    }

    /* ==========================================================================
       4. Case Studies 3D Perspective Tilt & Screen Mockup Switcher
       ========================================================================== */
    function initCaseStudiesTilt() {
        const mockupContainer = document.getElementById('case-mockup-frame');
        const rows = document.querySelectorAll('.case-study-row');
        const screenImage = document.getElementById('case-screen-img');
        const caseTitle = document.getElementById('case-screen-title');
        const caseTag = document.getElementById('case-screen-tag');

        if (!mockupContainer) return;

        mockupContainer.addEventListener('mousemove', (e) => {
            const rect = mockupContainer.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            gsap.to(mockupContainer, {
                rotateY: x * 16,
                rotateX: -y * 16,
                transformPerspective: 1000,
                duration: 0.4,
                ease: 'power2.out'
            });
        });

        mockupContainer.addEventListener('mouseleave', () => {
            gsap.to(mockupContainer, {
                rotateY: -8,
                rotateX: 6,
                duration: 0.8,
                ease: 'power3.out'
            });
        });

        rows.forEach(row => {
            row.addEventListener('mouseenter', () => {
                rows.forEach(r => r.classList.remove('active-case'));
                row.classList.add('active-case');

                const title = row.dataset.title;
                const tag = row.dataset.tag;
                const img = row.dataset.img;

                if (screenImage && img) {
                    gsap.to(screenImage, {
                        opacity: 0,
                        duration: 0.15,
                        onComplete: () => {
                            screenImage.src = img;
                            gsap.to(screenImage, { opacity: 1, duration: 0.25 });
                        }
                    });
                }
                if (caseTitle && title) caseTitle.textContent = title;
                if (caseTag && tag) caseTag.textContent = tag;
            });
        });
    }

    /* ==========================================================================
       5. Contact Climax: 3D Floating Astronaut Companion
       ========================================================================== */
    function initAstronautCta() {
        const container = document.getElementById('cta-astronaut-canvas');
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 50);
        camera.position.set(0, 0, 3.8);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const dirLightViolet = new THREE.DirectionalLight(0x8A6CFF, 2.5);
        dirLightViolet.position.set(2, 3, 2);
        scene.add(dirLightViolet);

        const dirLightCyan = new THREE.DirectionalLight(0x42C8F5, 2.0);
        dirLightCyan.position.set(-2, -1, 1);
        scene.add(dirLightCyan);

        let astronautMesh = null;
        let fallbackSphere = null;

        function buildFallbackHoloSphere() {
            fallbackSphere = new THREE.Group();
            const geo = new THREE.IcosahedronGeometry(1.2, 2);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x8A6CFF,
                wireframe: true,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending
            });
            const mesh = new THREE.Mesh(geo, mat);
            fallbackSphere.add(mesh);

            const ring = new THREE.Line(new THREE.RingGeometry(1.6, 1.63, 32), new THREE.LineBasicMaterial({ color: 0x42C8F5, transparent: true, opacity: 0.6 }));
            ring.rotation.x = Math.PI / 2.6;
            fallbackSphere.add(ring);

            scene.add(fallbackSphere);
        }

        if (typeof THREE.GLTFLoader !== 'undefined') {
            const loader = new THREE.GLTFLoader();
            let isLoaded = false;
            setTimeout(() => { if (!isLoaded && !fallbackSphere) buildFallbackHoloSphere(); }, 3000);

            loader.load(
                'models/Astronaut.glb',
                (gltf) => {
                    isLoaded = true;
                    astronautMesh = gltf.scene;
                    astronautMesh.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material) {
                                child.material.metalness = 0.4;
                                child.material.roughness = 0.3;
                            }
                        }
                    });
                    astronautMesh.scale.set(1.4, 1.4, 1.4);
                    astronautMesh.position.set(0, -1.0, 0);
                    astronautMesh.rotation.y = -0.4;
                    scene.add(astronautMesh);
                },
                undefined,
                () => { if (!fallbackSphere) buildFallbackHoloSphere(); }
            );
        } else {
            buildFallbackHoloSphere();
        }

        window.addEventListener('resize', () => {
            if (!container) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });

        let mouseX = 0, mouseY = 0;
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            mouseX = (e.clientX - rect.left) / rect.width - 0.5;
            mouseY = (e.clientY - rect.top) / rect.height - 0.5;
        });

        function animateAstronaut() {
            requestAnimationFrame(animateAstronaut);

            const time = performance.now() * 0.001;

            if (astronautMesh) {
                astronautMesh.position.y = -1.0 + Math.sin(time * 0.8) * 0.12;
                astronautMesh.rotation.y = -0.4 + Math.sin(time * 0.4) * 0.15 + mouseX * 0.5;
                astronautMesh.rotation.x = Math.cos(time * 0.6) * 0.08 - mouseY * 0.3;
                astronautMesh.rotation.z = Math.sin(time * 0.5) * 0.05;
            } else if (fallbackSphere) {
                fallbackSphere.rotation.y = time * 0.25;
                fallbackSphere.rotation.x = time * 0.15;
            }

            renderer.render(scene, camera);
        }
        animateAstronaut();
    }

})();
