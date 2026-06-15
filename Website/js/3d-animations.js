/* ==========================================================================
   RAKTechSoftHub — 3D WebGL Animations & Systems Preloader (Three.js)
   ========================================================================== */

function startSubsystems() {
    initPreloader();
    
    // Safety check: if Three.js CDN fails to load, bypass 3D WebGL to avoid blocking the website
    if (typeof THREE === 'undefined') {
        console.warn("Three.js library not loaded. Bypassing WebGL animations.");
        return;
    }

    try {
        initHeroAnimation();
    } catch (e) {
        console.error("Error initializing Hero 3D animation:", e);
    }

    try {
        initServicesAnimations();
    } catch (e) {
        console.error("Error initializing Services 3D animation:", e);
    }

    try {
        initCtaAnimation();
    } catch (e) {
        console.error("Error initializing CTA 3D animation:", e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSubsystems);
} else {
    startSubsystems();
}


/* ==========================================
   1. Systems Preloader (0-100%)
   ========================================== */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    const bar = document.getElementById('preloader-bar');
    const pct = document.getElementById('preloader-percentage');
    const status = document.getElementById('preloader-status');

    if (!preloader || !bar || !pct) return;

    const statuses = [
        "Initializing core subsystems...",
        "Establishing WebGL render pipelines...",
        "Loading high-fidelity geometry arrays...",
        "Compiling holographic shaders...",
        "Syncing database fallbacks...",
        "Online and operational."
    ];

    let progress = 0;
    
    function updateProgress() {
        // Increment progress faster at first, slower towards the end
        const step = Math.random() * 8 + 1;
        progress = Math.min(progress + step, 100);
        
        bar.style.width = `${progress}%`;
        pct.textContent = `${Math.floor(progress)}%`;

        // Update status text based on progress range
        const statusIdx = Math.min(Math.floor((progress / 100) * statuses.length), statuses.length - 1);
        status.textContent = statuses[statusIdx];

        if (progress < 100) {
            setTimeout(updateProgress, Math.random() * 80 + 30);
        } else {
            // Loading complete - fade out preloader
            setTimeout(() => {
                preloader.classList.add('fade-out');
                
                // Trigger scroll reveals for main sections
                document.querySelectorAll('.animate-fade-up, .animate-fade-up-delay').forEach(el => {
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                });
            }, 800);
        }
    }

    // Start loader
    setTimeout(updateProgress, 200);
}

/* ==========================================
   2. Hero Section: 3D Holographic Particle Sphere
   ========================================== */
function initHeroAnimation() {
    const container = document.getElementById('hero-canvas-container');
    if (!container) return;

    // Use a larger render size (1.5x of the container) to prevent clipping at the borders
    const renderWidth = container.clientWidth * 1.5;
    const renderHeight = container.clientHeight * 1.5;

    // Create scene, camera, renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, renderWidth / renderHeight, 0.1, 100);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(renderWidth, renderHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particle Sphere Geometry
    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const colorPrimary = new THREE.Color('#88cff9'); // primary-fixed-dim
    const colorTertiary = new THREE.Color('#7bd0ff'); // tertiary-fixed-dim
    const colorAccent = new THREE.Color('#bc00ff');   // purple glow

    for (let i = 0; i < particleCount; i++) {
        // Spherical distribution
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 1.6 + (Math.random() - 0.5) * 0.15; // thin shell sphere

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);

        originalPositions[i * 3] = positions[i * 3];
        originalPositions[i * 3 + 1] = positions[i * 3 + 1];
        originalPositions[i * 3 + 2] = positions[i * 3 + 2];

        // Color interpolation (gradients of blue and violet)
        let mixedColor;
        const rand = Math.random();
        if (rand < 0.5) {
            mixedColor = colorPrimary.clone().lerp(colorTertiary, rand * 2);
        } else {
            mixedColor = colorTertiary.clone().lerp(colorAccent, (rand - 0.5) * 2);
        }

        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom round particle texture via Canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 16, 16);
    
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const material = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        map: pTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particleSphere = new THREE.Points(geometry, material);
    scene.add(particleSphere);

    // Inner wireframe shape representing "bolts/hardware"
    const innerGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const innerMat = new THREE.MeshBasicMaterial({
        color: 0x88cff9,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Orbital particles
    const orbitGroup = new THREE.Group();
    const orbitCount = 100;
    const orbitGeo = new THREE.BufferGeometry();
    const orbitPos = new Float32Array(orbitCount * 3);
    for(let i=0; i<orbitCount; i++) {
        const theta = (i / orbitCount) * Math.PI * 2;
        orbitPos[i*3] = Math.cos(theta) * 2.2;
        orbitPos[i*3+1] = 0;
        orbitPos[i*3+2] = Math.sin(theta) * 2.2;
    }
    orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPos, 3));
    const orbitMat = new THREE.PointsMaterial({
        color: 0x00f2ff,
        size: 0.06,
        map: pTexture,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const orbits = new THREE.Points(orbitGeo, orbitMat);
    orbitGroup.add(orbits);
    orbitGroup.rotation.x = Math.PI / 4;
    scene.add(orbitGroup);

    // Mouse responsiveness
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let isHovering = false;
    
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        isHovering = true;
    });

    container.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
        isHovering = false;
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        const w = container.clientWidth * 1.5;
        const h = container.clientHeight * 1.5;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // Animation Loop
    let dissolveProgress = 0;

    function animate() {
        requestAnimationFrame(animate);

        // Interpolate dissolve progress
        const targetDissolve = isHovering ? 1.0 : 0.0;
        dissolveProgress += (targetDissolve - dissolveProgress) * 0.08;

        // Smooth rotation
        particleSphere.rotation.y += 0.002;
        particleSphere.rotation.x += 0.001;
        
        innerMesh.rotation.y -= 0.003;
        innerMesh.rotation.x -= 0.001;

        orbitGroup.rotation.y += 0.005;

        // Interactive tilting towards mouse
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        particleSphere.rotation.y += targetX * 0.02;
        particleSphere.rotation.x -= targetY * 0.02;
        innerMesh.rotation.y += targetX * 0.01;

        // Shape morph and dissolve dispersion effect
        const posArray = geometry.attributes.position.array;
        const time = Date.now() * 0.0015;
        for (let i = 0; i < particleCount; i++) {
            const ox = originalPositions[i * 3];
            const oy = originalPositions[i * 3 + 1];
            const oz = originalPositions[i * 3 + 2];

            // Radial direction from center
            const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1.0;
            const dx = ox / len;
            const dy = oy / len;
            const dz = oz / len;

            // Subtle base noise wave
            const noise = Math.sin(ox * 2 + time) * Math.cos(oy * 2 + time) * 0.003;

            // Hover dissolve: disperse particles outwards along their normals + random noise
            const scatterDistance = 1.2 * dissolveProgress;
            const seed = i * 0.1;
            const noiseX = Math.sin(seed + time) * 0.15 * dissolveProgress;
            const noiseY = Math.cos(seed * 0.8 + time) * 0.15 * dissolveProgress;
            const noiseZ = Math.sin(seed * 1.2 + time) * 0.15 * dissolveProgress;

            posArray[i * 3] = ox * (1 + noise) + dx * scatterDistance + noiseX;
            posArray[i * 3 + 1] = oy * (1 + noise) + dy * scatterDistance + noiseY;
            posArray[i * 3 + 2] = oz * (1 + noise) + dz * scatterDistance + noiseZ;
        }
        geometry.attributes.position.needsUpdate = true;

        // Smoothly adjust material properties on dissolve
        material.opacity = 1.0 - dissolveProgress * 0.7; // fade down to 30%
        material.size = 0.08 * (1.0 - dissolveProgress * 0.4); // shrink points slightly
        material.needsUpdate = true;

        // Fade out wireframe and orbits on dissolve
        innerMesh.material.opacity = 0.12 * (1.0 - dissolveProgress);
        innerMesh.scale.setScalar(1.0 + dissolveProgress * 0.25);
        orbitMat.opacity = 0.06 * (1.0 - dissolveProgress * 0.8);

        renderer.render(scene, camera);
    }

    animate();
}

/* ==========================================
   3. Services Grid: Dynamic Morphing Sticky Canvas
   ========================================== */
function initServicesAnimations() {
    const container = document.getElementById('services-canvas-container');
    if (!container) return;

    // 1. Initialize List Accordion & Tab Handlers (Always active, even on mobile!)
    const serviceItems = document.querySelectorAll('.service-list-item');
    let activeShapeType = 'cone'; // default active shape

    serviceItems.forEach(item => {
        const shape = item.dataset.shape;
        
        const activateItem = () => {
            if (!item.classList.contains('active-item')) {
                serviceItems.forEach(i => i.classList.remove('active-item'));
                item.classList.add('active-item');
                if (shape) {
                    activeShapeType = shape;
                }
            }
        };

        item.addEventListener('mouseenter', activateItem);
        item.addEventListener('click', activateItem);
    });

    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            setTimeout(() => {
                const activeTab = document.querySelector('.tab-content.active');
                if (activeTab) {
                    const firstItem = activeTab.querySelector('.service-list-item');
                    if (firstItem) {
                        firstItem.click();
                    }
                }
            }, 100);
        });
    });

    // 2. Early return for Mobile Devices to optimize performance and prevent crashes
    if (window.innerWidth < 768 || container.clientWidth === 0) {
        return;
    }

    // Use a larger render viewport (1.5x of container) to prevent clipping
    const renderWidth = container.clientWidth * 1.5;
    const renderHeight = container.clientHeight * 1.5;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, renderWidth / renderHeight, 0.1, 10);
    camera.position.z = 2.4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(renderWidth, renderHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Custom particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 16, 16);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const shapes = {};
    let activeShapeType = 'cone'; // default active shape

    // Helper to create and register standard shapes
    function createShape(shapeType, geo, pointColor = 0x88cff9, lineColor = 0x3e465c, pointSize = 0.08) {
        const group = new THREE.Group();

        const pointMat = new THREE.PointsMaterial({
            color: pointColor,
            size: pointSize,
            map: pTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        pointMat.userData.originalOpacity = 1.0;
        pointMat.userData.originalSize = pointSize;

        const lineMat = new THREE.LineBasicMaterial({
            color: lineColor,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending
        });
        lineMat.userData.originalOpacity = 0.25;

        const mainMesh = new THREE.Points(geo, pointMat);
        const lineMesh = new THREE.LineSegments(new THREE.WireframeGeometry(geo), lineMat);

        group.add(mainMesh);
        group.add(lineMesh);

        geo.userData.originalPosition = geo.attributes.position.clone();

        group.userData = {
            shapeType,
            transitionFactor: 0.0,
            mainMesh,
            lineMesh
        };

        scene.add(group);
        shapes[shapeType] = group;
        return group;
    }

    // Register all 12 shapes
    
    // 1. cone (SEO Funnel)
    createShape('cone', new THREE.ConeGeometry(0.5, 0.9, 10, 4));

    // 2. torus (Meta Ads)
    createShape('torus', new THREE.TorusGeometry(0.5, 0.13, 8, 24));

    // 3. octahedron (Google PPC)
    createShape('octahedron', new THREE.OctahedronGeometry(0.6, 1));

    // 4. sphere-orbit (Social Media)
    const sphereOrbitGroup = new THREE.Group();
    const sphereGeo = new THREE.SphereGeometry(0.4, 10, 10);
    const spherePointMat = new THREE.PointsMaterial({ color: 0x88cff9, size: 0.08, map: pTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    spherePointMat.userData.originalOpacity = 1.0;
    spherePointMat.userData.originalSize = 0.08;
    const sphereMesh = new THREE.Points(sphereGeo, spherePointMat);

    const sphereLinesMat = new THREE.LineBasicMaterial({ color: 0x3e465c, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending });
    sphereLinesMat.userData.originalOpacity = 0.25;
    const sphereLines = new THREE.LineSegments(new THREE.WireframeGeometry(sphereGeo), sphereLinesMat);

    sphereOrbitGroup.add(sphereMesh, sphereLines);

    const ringGeo = new THREE.RingGeometry(0.65, 0.67, 24);
    const ringMat = new THREE.LineBasicMaterial({ color: 0xbc00ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
    ringMat.userData.originalOpacity = 0.4;
    const ring = new THREE.LineLoop(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    sphereOrbitGroup.add(ring);

    sphereGeo.userData.originalPosition = sphereGeo.attributes.position.clone();
    sphereOrbitGroup.userData = {
        shapeType: 'sphere-orbit',
        transitionFactor: 0.0,
        mainMesh: sphereMesh,
        lineMesh: sphereLines
    };
    scene.add(sphereOrbitGroup);
    shapes['sphere-orbit'] = sphereOrbitGroup;

    // 5. code-mesh (Web Design & Dev)
    const codeGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        // Left Angle Bracket <
        -0.4, 0, 0,
        -0.1, 0.3, 0,
        -0.1, 0.3, 0,
        -0.4, 0, 0,
        -0.4, 0, 0,
        -0.1, -0.3, 0,
        // Slash /
        -0.05, -0.4, 0,
        0.05, 0.4, 0,
        // Right Angle Bracket >
        0.4, 0, 0,
        0.1, 0.3, 0,
        0.1, 0.3, 0,
        0.4, 0, 0,
        0.4, 0, 0,
        0.1, -0.3, 0
    ]);
    codeGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    codeGeo.userData.originalPosition = codeGeo.attributes.position.clone();

    const codeGroup = new THREE.Group();
    const codePointMat = new THREE.PointsMaterial({ color: 0x00f2ff, size: 0.12, map: pTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    codePointMat.userData.originalOpacity = 1.0;
    codePointMat.userData.originalSize = 0.12;
    const codeMesh = new THREE.Points(codeGeo, codePointMat);

    const codeLineMat = new THREE.LineBasicMaterial({ color: 0x88cff9, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    codeLineMat.userData.originalOpacity = 0.6;
    const codeLines = new THREE.LineSegments(codeGeo, codeLineMat);

    codeGroup.add(codeMesh, codeLines);
    codeGroup.userData = {
        shapeType: 'code-mesh',
        transitionFactor: 0.0,
        mainMesh: codeMesh,
        lineMesh: codeLines
    };
    scene.add(codeGroup);
    shapes['code-mesh'] = codeGroup;

    // 6. mobile-mesh (Mobile Apps)
    createShape('mobile-mesh', new THREE.BoxGeometry(0.42, 0.8, 0.1, 3, 3, 1));

    // 7. wave-mesh (Analytics Wave)
    const waveGeo = new THREE.BufferGeometry();
    const waveCount = 60;
    const wavePos = new Float32Array(waveCount * 3);
    for(let i=0; i<waveCount; i++) {
        const t = (i / waveCount) * 2 - 1; // -1 to 1
        wavePos[i*3] = t * 0.7;
        wavePos[i*3+1] = Math.sin(t * Math.PI * 3.5) * 0.25;
        wavePos[i*3+2] = Math.cos(t * Math.PI * 2) * 0.15;
    }
    waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePos, 3));
    waveGeo.userData.originalPosition = waveGeo.attributes.position.clone();

    const waveGroup = new THREE.Group();
    const wavePointMat = new THREE.PointsMaterial({ color: 0x88cff9, size: 0.09, map: pTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    wavePointMat.userData.originalOpacity = 1.0;
    wavePointMat.userData.originalSize = 0.09;
    const waveMesh = new THREE.Points(waveGeo, wavePointMat);

    const waveLineMat = new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
    waveLineMat.userData.originalOpacity = 0.5;
    const waveLines = new THREE.Line(waveGeo, waveLineMat);

    waveGroup.add(waveMesh, waveLines);
    waveGroup.userData = {
        shapeType: 'wave-mesh',
        transitionFactor: 0.0,
        mainMesh: waveMesh,
        lineMesh: waveLines
    };
    scene.add(waveGroup);
    shapes['wave-mesh'] = waveGroup;

    // 8. torus-knot (Creative Media)
    createShape('torus-knot', new THREE.TorusKnotGeometry(0.35, 0.1, 40, 6));

    // 9. network-nodes (Office Network Setup)
    const nodeGeo = new THREE.IcosahedronGeometry(0.55, 1);
    const nodeGroup = new THREE.Group();
    const nodePointMat = new THREE.PointsMaterial({ color: 0x00f2ff, size: 0.1, map: pTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    nodePointMat.userData.originalOpacity = 1.0;
    nodePointMat.userData.originalSize = 0.1;
    const nodeMesh = new THREE.Points(nodeGeo, nodePointMat);

    const nodeLineMat = new THREE.LineBasicMaterial({ color: 0x3e465c, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
    nodeLineMat.userData.originalOpacity = 0.5;
    const nodeLines = new THREE.LineSegments(new THREE.WireframeGeometry(nodeGeo), nodeLineMat);

    nodeGeo.userData.originalPosition = nodeGeo.attributes.position.clone();
    nodeGroup.add(nodeMesh, nodeLines);
    nodeGroup.userData = {
        shapeType: 'network-nodes',
        transitionFactor: 0.0,
        mainMesh: nodeMesh,
        lineMesh: nodeLines
    };
    scene.add(nodeGroup);
    shapes['network-nodes'] = nodeGroup;

    // 10. waves (Routing & Switching)
    const signalGeo = new THREE.BufferGeometry();
    const signalCount = 40;
    const signalPos = new Float32Array(signalCount * 3);
    for(let i=0; i<signalCount; i++) {
        const angle = (i / signalCount) * Math.PI * 2;
        signalPos[i*3] = Math.cos(angle) * 0.55;
        signalPos[i*3+1] = Math.sin(angle * 3) * 0.15;
        signalPos[i*3+2] = Math.sin(angle) * 0.55;
    }
    signalGeo.setAttribute('position', new THREE.BufferAttribute(signalPos, 3));
    signalGeo.userData.originalPosition = signalGeo.attributes.position.clone();

    const signalGroup = new THREE.Group();
    const signalPointMat = new THREE.PointsMaterial({ color: 0x88cff9, size: 0.08, map: pTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    signalPointMat.userData.originalOpacity = 1.0;
    signalPointMat.userData.originalSize = 0.08;
    const signalMesh = new THREE.Points(signalGeo, signalPointMat);

    const signalLineMat = new THREE.LineBasicMaterial({ color: 0xbc00ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
    signalLineMat.userData.originalOpacity = 0.4;
    const signalLines = new THREE.LineLoop(signalGeo, signalLineMat);

    signalGroup.add(signalMesh, signalLines);
    signalGroup.userData = {
        shapeType: 'waves',
        transitionFactor: 0.0,
        mainMesh: signalMesh,
        lineMesh: signalLines
    };
    scene.add(signalGroup);
    shapes['waves'] = signalGroup;

    // 11. box-grid (Server Deployment)
    createShape('box-grid', new THREE.BoxGeometry(0.55, 0.55, 0.55, 2, 2, 2));

    // 12. shield (Security)
    createShape('shield', new THREE.IcosahedronGeometry(0.6, 0));



    // Viewport Visibility Observer
    let renderActive = false;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            renderActive = entry.isIntersecting;
        });
    }, { threshold: 0.1 });
    observer.observe(container);

    // Mouse hover responsiveness over the sticky canvas itself
    let isHoveringCanvas = false;
    let canvasHoverProgress = 0;
    container.addEventListener('mouseenter', () => { isHoveringCanvas = true; });
    container.addEventListener('mouseleave', () => { isHoveringCanvas = false; });

    // Handle Resize
    window.addEventListener('resize', () => {
        const w = container.clientWidth * 1.5;
        const h = container.clientHeight * 1.5;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // Animation Loop
    let rotationSpeed = 0.008;

    function renderCard() {
        if (!renderActive) {
            setTimeout(renderCard, 250);
            return;
        }

        requestAnimationFrame(renderCard);

        const time = Date.now() * 0.0015;

        // Smoothly update direct canvas hover progress
        const targetCanvasHover = isHoveringCanvas ? 1.0 : 0.0;
        canvasHoverProgress += (targetCanvasHover - canvasHoverProgress) * 0.1;

        // Update each shape group transition factor & position scattering
        Object.keys(shapes).forEach(key => {
            const group = shapes[key];
            const targetFactor = (key === activeShapeType) ? 1.0 : 0.0;
            
            // Smoothly interpolate transition (assembly / dissolution) progress
            group.userData.transitionFactor += (targetFactor - group.userData.transitionFactor) * 0.08;
            const factor = group.userData.transitionFactor;

            if (factor > 0.001) {
                group.visible = true;

                // Rotate group
                const currentRotSpeed = (key === activeShapeType) ? (0.008 + canvasHoverProgress * 0.02) : 0.008;
                group.rotation.y += currentRotSpeed;
                group.rotation.x += currentRotSpeed * 0.4;

                const mainMesh = group.userData.mainMesh;

                // Adjust geometry points positions (dissolve outward when factor is low, or direct canvas hover is high)
                if (mainMesh && mainMesh.geometry && mainMesh.geometry.userData.originalPosition) {
                    const geo = mainMesh.geometry;
                    const pos = geo.attributes.position.array;
                    const orig = geo.userData.originalPosition.array;

                    // Dispersion increases as factor decreases, or direct canvas hover increases
                    const dispersion = (1.0 - factor) + 0.4 * canvasHoverProgress;

                    for (let i = 0; i < pos.length / 3; i++) {
                        const ox = orig[i * 3];
                        let oy = orig[i * 3 + 1];
                        const oz = orig[i * 3 + 2];

                        // Special wave animation for wave-mesh shape
                        if (key === 'wave-mesh') {
                            oy = Math.sin((ox * 3) + time * 2) * 0.2;
                        }

                        // Radial vector from center
                        const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1.0;
                        const dx = ox / len;
                        const dy = oy / len;
                        const dz = oz / len;

                        // Scatter points
                        const scatterDistance = 1.0 * dispersion;
                        const seed = i * 0.5;
                        const noiseX = Math.sin(seed + time * 1.5) * 0.15 * dispersion;
                        const noiseY = Math.cos(seed * 0.8 + time * 1.5) * 0.15 * dispersion;
                        const noiseZ = Math.sin(seed * 1.2 + time * 1.5) * 0.15 * dispersion;

                        pos[i * 3] = ox + dx * scatterDistance + noiseX;
                        pos[i * 3 + 1] = oy + dy * scatterDistance + noiseY;
                        pos[i * 3 + 2] = oz + dz * scatterDistance + noiseZ;
                    }
                    geo.attributes.position.needsUpdate = true;
                }

                // Adjust main point material opacity and size
                if (mainMesh && mainMesh.material) {
                    const origOpacity = mainMesh.material.userData.originalOpacity;
                    const origSize = mainMesh.material.userData.originalSize;
                    
                    // Fade out on dissolve or direct canvas hover
                    mainMesh.material.opacity = origOpacity * factor * (1.0 - canvasHoverProgress * 0.5);
                    mainMesh.material.size = origSize * (0.7 + factor * 0.3) * (1.0 - canvasHoverProgress * 0.2);
                    mainMesh.material.needsUpdate = true;
                }

                // Fade out wireframe and lines inside this group
                group.traverse(child => {
                    if (child !== group && child !== mainMesh) {
                        if (child.material) {
                            if (child.material.userData.originalOpacity === undefined) {
                                child.material.userData.originalOpacity = child.material.opacity || 0.25;
                                child.material.transparent = true;
                            }
                            child.material.opacity = child.material.userData.originalOpacity * factor * (1.0 - canvasHoverProgress);
                        }
                    }
                });

            } else {
                group.visible = false;
            }
        });

        renderer.render(scene, camera);
    }

    renderCard();
}

/* ==========================================
   4. Footer CTA: 3D Astronaut Hologram / Fallback Globe
   ========================================== */
function initCtaAnimation() {
    const container = document.getElementById('cta-canvas-container');
    if (!container) return;

    // Use a larger render size (1.5x of container) to prevent clipping
    const renderWidth = container.clientWidth * 1.5;
    const renderHeight = container.clientHeight * 1.5;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, renderWidth / renderHeight, 0.1, 100);
    camera.position.z = 5.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(renderWidth, renderHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    container.appendChild(renderer.domElement);

    // Glowing particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16;
    pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.75)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 16, 16);
    const pTexture = new THREE.CanvasTexture(pCanvas);

    // Light Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00f2ff, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    let mainObject = null;
    let fallbackGlobe = null;
    let isFallback = false;

    // Load Astronaut GLTF
    const loader = new THREE.GLTFLoader();
    
    let modelLoaded = false;
    setTimeout(() => {
        if (!modelLoaded) {
            console.warn("Astronaut load timed out. Building network globe fallback.");
            buildGlobeFallback();
        }
    }, 6000);

    loader.load(
        'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
        (gltf) => {
            if (isFallback) return;
            modelLoaded = true;
            
            const model = gltf.scene;
            mainObject = model;

            // Convert textures to wireframe/holographic cyan grids
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshBasicMaterial({
                        color: 0x88cff9,
                        wireframe: true,
                        transparent: true,
                        opacity: 0.22,
                        blending: THREE.AdditiveBlending
                    });
                }
            });

            model.scale.set(1.4, 1.4, 1.4);
            model.position.y = -1.2;
            scene.add(model);
            
            // Add custom particle point clouds hovering around astronaut
            const particlesGeo = new THREE.BufferGeometry();
            const pCount = 200;
            const pPos = new Float32Array(pCount * 3);
            for(let i=0; i<pCount; i++) {
                pPos[i*3] = (Math.random() - 0.5) * 4;
                pPos[i*3+1] = (Math.random() - 0.5) * 4;
                pPos[i*3+2] = (Math.random() - 0.5) * 4;
            }
            particlesGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
            const pMat = new THREE.PointsMaterial({
                color: 0xbc00ff,
                size: 0.05,
                map: pTexture,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            const dust = new THREE.Points(particlesGeo, pMat);
            scene.add(dust);
        },
        undefined,
        (err) => {
            if (isFallback) return;
            console.error("Error loading GLTF astronaut: ", err);
            buildGlobeFallback();
        }
    );

    // Fallback: Stunning WebGL network globe
    function buildGlobeFallback() {
        isFallback = true;
        
        fallbackGlobe = new THREE.Group();
        
        // Sphere grid points
        const sphereGeo = new THREE.SphereGeometry(1.4, 20, 20);
        const pMat = new THREE.PointsMaterial({
            color: 0x88cff9,
            size: 0.06,
            map: pTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const points = new THREE.Points(sphereGeo, pMat);
        fallbackGlobe.add(points);

        // Core mesh wireframe
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x1d2022,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const coreMesh = new THREE.Mesh(sphereGeo, wireMat);
        fallbackGlobe.add(coreMesh);

        // Outer rotating network lines
        const lineGeo = new THREE.IcosahedronGeometry(1.42, 1);
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.25
        });
        const lines = new THREE.LineSegments(new THREE.WireframeGeometry(lineGeo), lineMat);
        fallbackGlobe.add(lines);

        // Concentric Saturn Orbit rings
        const ringGeo = new THREE.RingGeometry(1.8, 1.83, 32);
        const ringMat = new THREE.LineBasicMaterial({
            color: 0xbc00ff,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Line(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.5;
        fallbackGlobe.add(ring);

        // Satellite nodes
        const satGroup = new THREE.Group();
        const satGeo = new THREE.SphereGeometry(0.06, 6, 6);
        const satMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
        for(let i=0; i<4; i++) {
            const sat = new THREE.Mesh(satGeo, satMat);
            const angle = (i / 4) * Math.PI * 2;
            sat.position.set(Math.cos(angle)*1.8, 0, Math.sin(angle)*1.8);
            satGroup.add(sat);
        }
        satGroup.rotation.x = Math.PI / 2.5;
        fallbackGlobe.add(satGroup);
        fallbackGlobe.userData = { satGroup };

        // Save original geometry position
        sphereGeo.userData.originalPosition = sphereGeo.attributes.position.clone();

        scene.add(fallbackGlobe);
    }

    // Viewport Visibility Observer
    let renderActive = false;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            renderActive = entry.isIntersecting;
        });
    }, { threshold: 0.1 });
    observer.observe(container);

    // Mouse responsiveness
    let mouseX = 0, mouseY = 0;
    let isHovering = false;
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        isHovering = true;
    });

    container.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
        isHovering = false;
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        const w = container.clientWidth * 1.5;
        const h = container.clientHeight * 1.5;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    // Animation Loop
    let targetRotX = 0;
    let targetRotY = 0;
    let dissolveFactor = 0;

    function renderCta() {
        if (!renderActive) {
            setTimeout(renderCta, 250);
            return;
        }

        requestAnimationFrame(renderCta);

        const time = Date.now() * 0.001;

        // Smoothly interpolate mouse movement values
        targetRotX += (mouseY * 0.3 - targetRotX) * 0.05;
        targetRotY += (mouseX * 0.3 - targetRotY) * 0.05;

        // Interpolate dissolve factor
        const targetDissolve = isHovering ? 1.0 : 0.0;
        dissolveFactor += (targetDissolve - dissolveFactor) * 0.08;

        if (mainObject) {
            // Astronaut animations
            mainObject.rotation.y = time * 0.15 + targetRotY;
            mainObject.rotation.x = targetRotX;
            mainObject.position.y = -1.1 + Math.sin(time * 0.8) * 0.12;

            // Astronaut dissolve: scale up slightly and fade to 0 opacity
            const baseScale = 1.4;
            const currentScale = baseScale * (1.0 + dissolveFactor * 0.25);
            mainObject.scale.set(currentScale, currentScale, currentScale);

            mainObject.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (child.material.userData.originalOpacity === undefined) {
                        child.material.userData.originalOpacity = child.material.opacity || 0.22;
                    }
                    child.material.opacity = child.material.userData.originalOpacity * (1.0 - dissolveFactor);
                }
            });

        } else if (fallbackGlobe) {
            // Globe fallback animations
            fallbackGlobe.rotation.y = time * 0.1 + targetRotY;
            fallbackGlobe.rotation.x = time * 0.05 + targetRotX;
            fallbackGlobe.position.y = Math.sin(time * 0.6) * 0.1;
            
            if (fallbackGlobe.userData && fallbackGlobe.userData.satGroup) {
                fallbackGlobe.userData.satGroup.rotation.z += 0.01;
            }

            // Globe dissolve: scatter points and fade out lines/rings
            fallbackGlobe.traverse((child) => {
                if (child.isPoints && child.geometry && child.geometry.userData.originalPosition) {
                    const geo = child.geometry;
                    const pos = geo.attributes.position.array;
                    const orig = geo.userData.originalPosition.array;
                    for (let i = 0; i < pos.length / 3; i++) {
                        const ox = orig[i * 3];
                        const oy = orig[i * 3 + 1];
                        const oz = orig[i * 3 + 2];
                        const len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1.0;
                        const dx = ox / len;
                        const dy = oy / len;
                        const dz = oz / len;
                        
                        const scatterDistance = 0.8 * dissolveFactor;
                        const seed = i * 0.5;
                        const noiseX = Math.sin(seed + time * 2) * 0.1 * dissolveFactor;
                        const noiseY = Math.cos(seed * 0.8 + time * 2) * 0.1 * dissolveFactor;
                        const noiseZ = Math.sin(seed * 1.2 + time * 2) * 0.1 * dissolveFactor;
                        
                        pos[i * 3] = ox + dx * scatterDistance + noiseX;
                        pos[i * 3 + 1] = oy + dy * scatterDistance + noiseY;
                        pos[i * 3 + 2] = oz + dz * scatterDistance + noiseZ;
                    }
                    geo.attributes.position.needsUpdate = true;

                    if (child.material) {
                        if (child.material.userData.originalOpacity === undefined) {
                            child.material.userData.originalOpacity = child.material.opacity || 0.06;
                        }
                        child.material.opacity = child.material.userData.originalOpacity * (1.0 - dissolveFactor * 0.5);
                    }
                } else if (child !== fallbackGlobe && child.material) {
                    if (child.material.userData.originalOpacity === undefined) {
                        child.material.userData.originalOpacity = child.material.opacity || 0.3;
                    }
                    child.material.opacity = child.material.userData.originalOpacity * (1.0 - dissolveFactor);
                }
            });
        }

        renderer.render(scene, camera);
    }

    renderCta();
}
