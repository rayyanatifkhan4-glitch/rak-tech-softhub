/* ==========================================================================
   RAKTechSoftHub — Core Controller & Cinematic Motion Orchestration
   Art Direction: Controlled Neon, Near-Black Palette, 60 FPS Runtime
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─── 1. Lenis Smooth Scrolling ───
    let lenis = null;
    if (typeof Lenis !== 'undefined' && !prefersReducedMotion()) {
        lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.95,
            touchMultiplier: 1.5,
        });

        if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0);
        } else {
            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }
    }

    // ─── 2. Storage Utilities for Inquiries & Settings ───
    const Storage = {
        isSupported() {
            try {
                const x = '__storage_test__';
                localStorage.setItem(x, x);
                localStorage.removeItem(x);
                return true;
            } catch (e) {
                return false;
            }
        },
        getItem(key) {
            try {
                if (this.isSupported()) return localStorage.getItem(key);
            } catch (e) {}
            return null;
        },
        setItem(key, value) {
            try {
                if (this.isSupported()) localStorage.setItem(key, value);
            } catch (e) {}
        }
    };

    const RAK_KEYS = { inquiries: 'rak_inquiries', settings: 'rak_site_settings' };
    function rakGetInquiries() { try { return JSON.parse(Storage.getItem(RAK_KEYS.inquiries)) || []; } catch { return []; } }
    function rakSaveInquiries(data) { try { Storage.setItem(RAK_KEYS.inquiries, JSON.stringify(data)); } catch {} }
    function rakGetSettings() { try { return JSON.parse(Storage.getItem(RAK_KEYS.settings)) || null; } catch { return null; } }
    function rakGenerateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }

    // Apply Admin Settings
    (function applyAdminSettings() {
        const s = rakGetSettings();
        if (!s) return;
        let migrated = false;
        if (s.phone === '+923092003125' || s.phone === '+1 (555) 987-6543') {
            s.phone = '+92 334 3096932';
            migrated = true;
        }
        if (s.whatsapp === '923092003125') {
            s.whatsapp = '923343096932';
            migrated = true;
        }
        if (migrated) {
            try { Storage.setItem(RAK_KEYS.settings, JSON.stringify(s)); } catch {}
        }
        if (s.email) document.querySelectorAll('[data-setting="email"]').forEach(el => { el.textContent = s.email; el.href = `mailto:${s.email}`; });
        if (s.phone) document.querySelectorAll('[data-setting="phone"]').forEach(el => { el.textContent = s.phone; el.href = `tel:${s.phone.replace(/\s+/g, '')}`; });
        if (s.companyDesc) document.querySelectorAll('[data-setting="company-desc"]').forEach(el => { el.textContent = s.companyDesc; });
        if (s.copyright) document.querySelectorAll('[data-setting="copyright"]').forEach(el => { el.textContent = s.copyright; });

        const waFloat = document.getElementById('whatsappFloat');
        if (waFloat && s.whatsapp) {
            const msg = encodeURIComponent(s.whatsappMsg || "Hi RAKTechSoftHub! I'm interested in your services.");
            waFloat.href = `https://wa.me/${s.whatsapp}?text=${msg}`;
        }
    })();

    // ─── 3. Video Performance & Offscreen Pausing ───
    (function initVideoObservers() {
        if (prefersReducedMotion()) return;

        const videos = document.querySelectorAll('video');
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    if (video.paused) {
                        video.play().catch(() => {});
                    }
                } else {
                    if (!video.paused) {
                        video.pause();
                    }
                }
            });
        }, { threshold: 0.1 });

        videos.forEach(v => videoObserver.observe(v));
    })();

    // ─── 4. Preloader Transition ───
    (function initPreloader() {
        const preloader = document.getElementById('preloader');
        const bar = document.getElementById('preloader-bar');
        const pct = document.getElementById('preloader-percentage');
        const status = document.getElementById('preloader-status');

        if (!preloader || !bar || !pct) return;

        let progress = 0;
        const startTime = performance.now();
        const targetDuration = 380; // snappy ~380ms load

        function step(now) {
            const elapsed = now - startTime;
            progress = Math.min((elapsed / targetDuration) * 100, 100);
            bar.style.width = `${progress}%`;
            pct.textContent = `${Math.floor(progress)}%`;

            if (progress < 100) {
                requestAnimationFrame(step);
            } else {
                preloader.classList.add('fade-out');
                setTimeout(() => {
                    preloader.style.display = 'none';
                    triggerHeroEntrance();
                }, 200);
            }
        }
        requestAnimationFrame(step);
    })();

    // ─── 5. Navbar Scroll Class & Active Link Spy ───
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function handleNavbar() {
        const scrollY = window.scrollY;
        if (navbar) navbar.classList.toggle('scrolled', scrollY > 40);

        let current = '';
        sections.forEach(sec => {
            const top = sec.offsetTop - 140;
            if (scrollY >= top) current = sec.getAttribute('id');
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === current);
        });
    }
    window.addEventListener('scroll', handleNavbar, { passive: true });

    // Smooth Anchor Navigation with Lenis
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') return;
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                if (lenis) {
                    lenis.scrollTo(targetEl, { offset: -70, duration: 1.0 });
                } else {
                    const top = targetEl.getBoundingClientRect().top + window.scrollY - 70;
                    window.scrollTo({ top, behavior: 'smooth' });
                }
            }
        });
    });

    // ─── 6. Mobile Navigation Console ───
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');

    function toggleMobileNav(open) {
        if (!hamburger || !mobileNav) return;
        const isOpen = (typeof open === 'boolean') ? open : mobileNav.classList.contains('hidden');
        hamburger.classList.toggle('active', isOpen);
        if (isOpen) {
            mobileNav.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } else {
            mobileNav.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    if (hamburger) hamburger.addEventListener('click', () => toggleMobileNav());
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => toggleMobileNav(false));
    });

    // ─── 7. GSAP Cinematic Hero Entrance (4K Sharp, No Blur) ───
    function triggerHeroEntrance() {
        if (typeof gsap === 'undefined' || prefersReducedMotion()) {
            document.querySelectorAll('.stat-number').forEach(runStatCounter);
            return;
        }

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Hero Video slight scale-down with full crisp clarity
        const heroVideo = document.querySelector('#hero-video');
        if (heroVideo) {
            gsap.fromTo(heroVideo, 
                { scale: 1.05 }, 
                { scale: 1.00, duration: 1.8, ease: 'power2.out' }
            );
        }

        // Staggered text reveal with sharp crisp opacity and position (NO blur)
        tl.fromTo('.hero-fade-item',
            { opacity: 0, y: 26 },
            { opacity: 1, y: 0, duration: 0.85, stagger: 0.12 }
        );

        // Stats Counter animation
        document.querySelectorAll('.stat-number').forEach(runStatCounter);
    }

    function runStatCounter(el) {
        if (el.dataset.animated) return;
        el.dataset.animated = 'true';
        const target = parseFloat(el.dataset.target);
        const duration = 1800;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            el.textContent = (target % 1 === 0) ? Math.floor(current).toLocaleString() : current.toFixed(1);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target.toString();
        }
        requestAnimationFrame(update);
    }

    // ─── 8. Services Showcase Horizontal Carousel & Interactive Cards ───
    const cardsTrack = document.getElementById('servicesCardsTrack');
    const prevBtn = document.getElementById('servicesPrevBtn');
    const nextBtn = document.getElementById('servicesNextBtn');
    const filterBtns = document.querySelectorAll('.category-pill-btn');
    const serviceCards = document.querySelectorAll('.service-showcase-card');
    let servicesTimeline = null;
    let isMouseHoveringCard = false;

    function getVisibleCards() {
        return Array.from(serviceCards).filter(c => c.style.display !== 'none');
    }

    // Linearly maps scroll progress (0.0 to 1.0) across all visible cards:
    // Starts with 1st card at 0.0, smoothly transitions, and ends with the last card at 1.0
    function updateActiveCardByProgress(progress) {
        if (isMouseHoveringCard) return;
        const visible = getVisibleCards();
        if (!visible.length) return;

        const clamped = Math.max(0, Math.min(1, progress));
        const targetIndex = Math.min(visible.length - 1, Math.floor(clamped * visible.length));
        const cardToActivate = visible[targetIndex];

        if (cardToActivate && !cardToActivate.classList.contains('active-card')) {
            serviceCards.forEach(c => c.classList.remove('active-card'));
            cardToActivate.classList.add('active-card');
        }
    }

    // Direct navigation to a specific card (for arrows and clicks)
    function scrollToCardByIndex(targetIndex) {
        const visible = getVisibleCards();
        if (targetIndex < 0 || targetIndex >= visible.length) return;
        const targetCard = visible[targetIndex];

        serviceCards.forEach(c => c.classList.remove('active-card'));
        targetCard.classList.add('active-card');

        if (window.innerWidth >= 1024 && servicesTimeline && servicesTimeline.scrollTrigger) {
            const st = servicesTimeline.scrollTrigger;
            const targetProgress = visible.length > 1 ? (targetIndex / (visible.length - 1)) : 0;
            const targetScroll = st.start + (targetProgress * (st.end - st.start));
            if (lenis) {
                lenis.scrollTo(targetScroll, { duration: 0.8 });
            } else {
                window.scrollTo({ top: targetScroll, behavior: 'smooth' });
            }
        } else if (cardsTrack) {
            const trackRect = cardsTrack.getBoundingClientRect();
            const cardRect = targetCard.getBoundingClientRect();
            const targetLeft = cardsTrack.scrollLeft + (cardRect.left - trackRect.left) - 20;
            cardsTrack.scrollTo({
                left: Math.max(0, Math.min(targetLeft, cardsTrack.scrollWidth - cardsTrack.clientWidth)),
                behavior: 'smooth'
            });
        }
    }

    // Hover, Mousemove & Click behaviors:
    // 1. Mouse hover immediately inspects that card
    // 2. Mouse movement creates 3D reactive symbol motion
    // 3. Click smoothly centers/scrolls to that card
    serviceCards.forEach(card => {
        const symbolSvg = card.querySelector('.service-symbol-svg');

        // Immediate inspect on hover
        card.addEventListener('mouseenter', () => {
            isMouseHoveringCard = true;
            serviceCards.forEach(c => c.classList.remove('active-card'));
            card.classList.add('active-card');
        });

        card.addEventListener('mouseleave', () => {
            isMouseHoveringCard = false;
        });

        // Interactive 3D micro-movement on mouse hover
        card.addEventListener('mousemove', (e) => {
            if (!symbolSvg) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            symbolSvg.style.transform = `translate(${x * 18}px, ${y * 18}px) scale(1.10)`;
        });

        // Click to center and scroll to card
        card.addEventListener('click', () => {
            const visible = getVisibleCards();
            const idx = visible.indexOf(card);
            if (idx !== -1) {
                scrollToCardByIndex(idx);
            }
        });
    });

    if (cardsTrack) {
        // When mouse leaves the entire cards track, re-sync with current scroll position
        cardsTrack.addEventListener('mouseleave', () => {
            isMouseHoveringCard = false;
            if (window.innerWidth >= 1024 && servicesTimeline && servicesTimeline.scrollTrigger) {
                updateActiveCardByProgress(servicesTimeline.scrollTrigger.progress);
            }
        });

        // On mobile / touch viewports (< 1024px), detect front card on native horizontal scroll
        let isDetectingScroll = false;
        cardsTrack.addEventListener('scroll', () => {
            if (window.innerWidth >= 1024) return; // Desktop is orchestrated by GSAP ScrollTrigger
            if (!isDetectingScroll) {
                requestAnimationFrame(() => {
                    const visible = getVisibleCards();
                    const maxScroll = cardsTrack.scrollWidth - cardsTrack.clientWidth;
                    if (maxScroll > 0 && visible.length) {
                        const progress = Math.max(0, Math.min(1, cardsTrack.scrollLeft / maxScroll));
                        const targetIndex = Math.min(visible.length - 1, Math.floor(progress * visible.length));
                        if (visible[targetIndex] && !visible[targetIndex].classList.contains('active-card')) {
                            serviceCards.forEach(c => c.classList.remove('active-card'));
                            visible[targetIndex].classList.add('active-card');
                        }
                    }
                    isDetectingScroll = false;
                });
                isDetectingScroll = true;
            }
        }, { passive: true });

        // Wheel Scroll Isolation for non-pinned / mobile viewports
        const handleCardsWheel = (e) => {
            if (window.innerWidth >= 1024) return; // On desktop, pinned ScrollTrigger handles scroll

            const isVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX);
            if (!isVerticalScroll) return;

            const maxScrollLeft = cardsTrack.scrollWidth - cardsTrack.clientWidth;
            const currentScroll = cardsTrack.scrollLeft;
            const scrollingRight = e.deltaY > 0;
            const scrollingLeft = e.deltaY < 0;

            if (scrollingRight && currentScroll < maxScrollLeft - 8) {
                e.preventDefault();
                cardsTrack.scrollLeft += e.deltaY * 1.15;
            } else if (scrollingLeft && currentScroll > 8) {
                e.preventDefault();
                cardsTrack.scrollLeft += e.deltaY * 1.15;
            }
        };

        cardsTrack.addEventListener('wheel', handleCardsWheel, { passive: false });
    }

    // Smart Arrow buttons navigation
    if (prevBtn && nextBtn) {
        nextBtn.addEventListener('click', () => {
            const visibleCards = getVisibleCards();
            const currentIndex = visibleCards.findIndex(c => c.classList.contains('active-card'));
            const nextIndex = (currentIndex >= 0 && currentIndex < visibleCards.length - 1) ? currentIndex + 1 : 0;
            scrollToCardByIndex(nextIndex);
        });

        prevBtn.addEventListener('click', () => {
            const visibleCards = getVisibleCards();
            const currentIndex = visibleCards.findIndex(c => c.classList.contains('active-card'));
            const prevIndex = (currentIndex > 0) ? currentIndex - 1 : visibleCards.length - 1;
            scrollToCardByIndex(prevIndex);
        });
    }

    // Category filter pills
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            let firstVisible = null;

            serviceCards.forEach(card => {
                const cat = card.dataset.category;
                const match = (filter === 'all' || cat === filter);
                card.style.display = match ? 'flex' : 'none';
                if (match && !firstVisible) firstVisible = card;
            });

            if (cardsTrack) cardsTrack.scrollLeft = 0;

            if (firstVisible) {
                serviceCards.forEach(c => c.classList.remove('active-card'));
                firstVisible.classList.add('active-card');
            }

            if (typeof ScrollTrigger !== 'undefined') {
                setTimeout(() => {
                    ScrollTrigger.refresh();
                    if (window.innerWidth >= 1024 && servicesTimeline && servicesTimeline.scrollTrigger) {
                        const st = servicesTimeline.scrollTrigger;
                        if (lenis && window.scrollY >= st.start) {
                            lenis.scrollTo(st.start, { immediate: true });
                        }
                    }
                }, 60);
            }
        });
    });

    // ─── 9. GSAP ScrollTrigger Full-Page Cinematic Orchestration ───
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion()) {
        gsap.registerPlugin(ScrollTrigger);

        // Hero: Scrubbed camera travel & text parallax
        const heroVideo = document.querySelector('#hero-video');
        if (heroVideo) {
            gsap.to(heroVideo, {
                scale: 1.25,
                yPercent: 12,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#home',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.2
                }
            });
        }

        const heroContent = document.querySelector('.hero-center-content');
        if (heroContent) {
            gsap.to(heroContent, {
                y: -75,
                opacity: 0.15,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#home',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 0.8
                }
            });
        }

        const heroWatermark = document.querySelector('.hero-watermark');
        if (heroWatermark) {
            gsap.to(heroWatermark, {
                yPercent: -15,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#home',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.4
                }
            });
        }

        // Services: Pinned Horizontal Showcase Stage (Cards section pinned until fully scrolled)
        const servicesSection = document.querySelector('#services');
        if (servicesSection && cardsTrack) {
            ScrollTrigger.matchMedia({
                // Desktop (>= 1024px): Pin the entire services stage and smoothly scrub horizontal cards
                "(min-width: 1024px)": function() {
                    const getDistance = () => {
                        const maxScroll = cardsTrack.scrollWidth - cardsTrack.clientWidth;
                        return Math.max(2200, maxScroll * 1.25);
                    };

                    servicesTimeline = gsap.timeline({
                        scrollTrigger: {
                            trigger: '#services',
                            start: 'top 70px',
                            end: () => `+=${getDistance()}`,
                            pin: true,
                            pinSpacing: true,
                            scrub: 0.8,
                            anticipatePin: 1,
                            invalidateOnRefresh: true,
                            onUpdate: (self) => {
                                updateActiveCardByProgress(self.progress);
                            }
                        }
                    });

                    servicesTimeline.to(cardsTrack, {
                        scrollLeft: () => cardsTrack.scrollWidth - cardsTrack.clientWidth,
                        ease: 'none'
                    });

                    return () => {
                        if (servicesTimeline) {
                            servicesTimeline.kill();
                            servicesTimeline = null;
                        }
                    };
                },
                // Mobile (< 1024px): Reveal cards as normal and let swipe/touch handle navigation
                "(max-width: 1023px)": function() {
                    gsap.fromTo('.service-showcase-card',
                        { opacity: 0, y: 35 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.7,
                            stagger: 0.08,
                            ease: 'power2.out',
                            clearProps: 'transform',
                            scrollTrigger: {
                                trigger: '#services',
                                start: 'top 75%'
                            }
                        }
                    );
                }
            });
        }

        // Purple Energy Dust Transition: Scrubbed opacity peak
        const energyTransition = document.querySelector('.energy-transition-wrap video');
        if (energyTransition) {
            gsap.fromTo(energyTransition,
                { opacity: 0.1 },
                {
                    opacity: 0.95,
                    ease: 'power1.inOut',
                    scrollTrigger: {
                        trigger: '.energy-transition-wrap',
                        start: 'top 85%',
                        end: 'bottom 20%',
                        scrub: 1
                    }
                }
            );
        }

        // Bits & Bolts section reveals
        const infraTl = gsap.timeline({
            scrollTrigger: {
                trigger: '#infrastructure',
                start: 'top 70%'
            }
        });
        infraTl.fromTo('#infrastructure h2, #infrastructure p',
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
        ).fromTo('#infrastructure .p-8',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.7, stagger: 0.2, ease: 'power2.out' },
            '-=0.3'
        );

        // Infrastructure fiber video subtle parallax
        const infraVideo = document.querySelector('.infra-video-wrap video');
        if (infraVideo) {
            gsap.to(infraVideo, {
                yPercent: 12,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#infrastructure',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.2
                }
            });
        }

        // Pricing Cards Staggered 3D Tilt Reveal
        gsap.fromTo('.pricing-card',
            { opacity: 0, y: 36, scale: 0.96 },
            {
                opacity: 1,
                y: 0,
                scale: 1.00,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '#pricing',
                    start: 'top 75%'
                }
            }
        );

        // FAQ Accordions entrance
        gsap.fromTo('.faq-row',
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '#faq',
                    start: 'top 80%'
                }
            }
        );

        // Final CTA Orb Entrance (Scrubbed scale & bloom)
        const ctaOrbVideo = document.querySelector('.cta-orb-wrap video');
        if (ctaOrbVideo) {
            gsap.fromTo(ctaOrbVideo,
                { opacity: 0.2, scale: 1.15 },
                {
                    opacity: 0.85,
                    scale: 1.00,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: '#contact',
                        start: 'top 80%',
                        end: 'center center',
                        scrub: 1
                    }
                }
            );
        }

        gsap.fromTo('#contact h2, #contact p, #contact form',
            { opacity: 0, y: 28 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.12,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '#contact',
                    start: 'top 70%'
                }
            }
        );
    }

    // ─── 10. FAQ Accordion ───
    document.querySelectorAll('.faq-question-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.faq-row');
            const isOpen = row.classList.contains('open');

            // Close other FAQs
            document.querySelectorAll('.faq-row.open').forEach(r => {
                if (r !== row) {
                    r.classList.remove('open');
                    const otherBtn = r.querySelector('.faq-question-btn');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                }
            });

            row.classList.toggle('open', !isOpen);
            btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
        });
    });

    // ─── 11. Contact Form Submission ───
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const formReset = document.getElementById('formReset');
    const formSubmit = document.getElementById('formSubmit');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailVal = document.getElementById('formEmail').value.trim();
            const phoneVal = document.getElementById('formPhone').value.trim();

            if (!emailVal && !phoneVal) {
                showToast('⚠️', 'Contact Info Required', 'Please provide either an email or direct phone number.');
                return;
            }

            const originalBtn = formSubmit.innerHTML;
            formSubmit.innerHTML = '<span>TRANSMITTING TELEMETRY...</span>';
            formSubmit.disabled = true;

            const inquiry = {
                id: rakGenerateId(),
                name: document.getElementById('formName').value.trim(),
                company: document.getElementById('formCompany').value.trim(),
                email: emailVal,
                phone: phoneVal,
                service: document.getElementById('formService').value,
                message: document.getElementById('formMessage').value.trim(),
                date: new Date().toISOString(),
                status: 'new'
            };

            const inquiries = rakGetInquiries();
            inquiries.push(inquiry);
            rakSaveInquiries(inquiries);

            setTimeout(() => {
                contactForm.classList.add('hidden');
                if (formSuccess) formSuccess.classList.remove('hidden');
                showToast('✅', 'Briefing Received!', 'Our systems architects will transmit a comprehensive proposal within 48 hours.');
                formSubmit.innerHTML = originalBtn;
                formSubmit.disabled = false;
            }, 750);
        });
    }

    if (formReset) {
        formReset.addEventListener('click', () => {
            if (formSuccess) formSuccess.classList.add('hidden');
            if (contactForm) {
                contactForm.classList.remove('hidden');
                contactForm.reset();
            }
        });
    }

    // ─── 12. Toast Notification Console ───
    const toastContainer = document.getElementById('toastContainer');
    function showToast(icon, title, message, duration = 3500) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="text-lg">${icon}</div>
            <div class="toast-content">
                <strong>${title}</strong>
                <span>${message}</span>
            </div>
            <button class="toast-close" aria-label="Dismiss">✕</button>
        `;
        toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), duration);
    }
    window.showToast = showToast;

    // ─── 13. Floating Controls ───
    const backToTop = document.getElementById('backToTop');
    const whatsappFloat = document.getElementById('whatsappFloat');

    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (backToTop) backToTop.classList.toggle('visible', y > 400);
        if (whatsappFloat) whatsappFloat.classList.toggle('visible', y > 250);
    }, { passive: true });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    console.log('%c⚡ RAKTechSoftHub // CINEMATIC NEON ARCHITECTURE LOADED', 'color: #8B5CF6; font-family: monospace; font-size: 13px; font-weight: bold;');
});
