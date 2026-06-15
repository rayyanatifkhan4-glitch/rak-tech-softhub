/* ===================================
   RAKTechSoftHub — Full Interactive JS
   =================================== */

function startScript() {

    // ─── Robust Storage Utilities (Cookie Fallbacks) ───
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
                if (this.isSupported()) {
                    return localStorage.getItem(key);
                }
            } catch (e) {}
            return this.getCookie(key);
        },
        setItem(key, value) {
            try {
                if (this.isSupported()) {
                    localStorage.setItem(key, value);
                    return;
                }
            } catch (e) {}
            this.setCookie(key, value, 365);
        },
        removeItem(key) {
            try {
                if (this.isSupported()) {
                    localStorage.removeItem(key);
                    return;
                }
            } catch (e) {}
            this.eraseCookie(key);
        },
        setCookie(name, value, days) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + encodeURIComponent(value || "") + expires + "; path=/; SameSite=Lax";
        },
        getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
            return null;
        },
        eraseCookie(name) {
            document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
        }
    };

    const RAK_KEYS = { inquiries: 'rak_inquiries', newsletter: 'rak_newsletter', settings: 'rak_site_settings' };
    function rakGetInquiries() { try { return JSON.parse(Storage.getItem(RAK_KEYS.inquiries)) || []; } catch { return []; } }
    function rakSaveInquiries(data) { try { Storage.setItem(RAK_KEYS.inquiries, JSON.stringify(data)); } catch {} }
    function rakGetNewsletter() { try { return JSON.parse(Storage.getItem(RAK_KEYS.newsletter)) || []; } catch { return []; } }
    function rakSaveNewsletter(data) { try { Storage.setItem(RAK_KEYS.newsletter, JSON.stringify(data)); } catch {} }
    function rakGetSettings() {
        try { const s = JSON.parse(Storage.getItem(RAK_KEYS.settings)); return s || null; } catch { return null; }
    }
    function rakGenerateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }

    // ─── Load Dynamic Settings from Admin ───
    (function applyAdminSettings() {
        const s = rakGetSettings();
        if (!s) return;

        // Migrate old default settings in localStorage if they exist
        let migrated = false;
        if (s.email === 'consult@raktech.soft') {
            s.email = 'raktechsofthub@gmail.com';
            migrated = true;
        }
        if (s.phone === '+1 (555) 987-6543') {
            s.phone = '+923092003125';
            migrated = true;
        }
        if (migrated) {
            try { Storage.setItem(RAK_KEYS.settings, JSON.stringify(s)); } catch {}
        }

        // Update contact email
        document.querySelectorAll('[data-setting="email"]').forEach(el => { el.textContent = s.email; });
        // Update phone
        document.querySelectorAll('[data-setting="phone"]').forEach(el => { el.textContent = s.phone; });
        // Update footer description
        document.querySelectorAll('[data-setting="company-desc"]').forEach(el => { el.textContent = s.companyDesc; });
        // Update copyright
        document.querySelectorAll('[data-setting="copyright"]').forEach(el => { el.textContent = s.copyright; });
        // Update WhatsApp link
        const waFloat = document.getElementById('whatsappFloat');
        if (waFloat && s.whatsapp) {
            const msg = encodeURIComponent(s.whatsappMsg || "Hi RAKTechSoftHub! I'm interested in your services.");
            waFloat.href = `https://wa.me/${s.whatsapp}?text=${msg}`;
        }
    })();

    // ─── Tab Switching ───
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            tabButtons.forEach(b => {
                b.classList.remove('tab-active');
                b.classList.add('text-on-surface-variant');
            });
            btn.classList.add('tab-active');
            btn.classList.remove('text-on-surface-variant');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === target) {
                    content.classList.add('active');
                }
            });
        });
    });

    // ─── Smooth Scroll for Anchors ───
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                // Check if it's a coming-soon link
                if (this.dataset.page) {
                    showToast('🚧', `${this.dataset.page}`, 'This page is under construction. Stay tuned!');
                }
                return;
            }
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Close mobile nav if open
                closeMobileNav();
            }
        });
    });

    // ─── Navbar Scroll Effect ───
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    function handleNavbarScroll() {
        const scrollY = window.scrollY;
        navbar.classList.toggle('scrolled', scrollY > 50);

        // Active link detection
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 160;
            if (scrollY >= top) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === current);
        });
    }
    window.addEventListener('scroll', handleNavbarScroll);

    // ─── Hamburger Menu ───
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('open');
        document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMobileNav);
    });

    function closeMobileNav() {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
    }

    // ─── Scroll Reveal (Intersection Observer) ───
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

    // ─── Glass Card Fade-In (from Stitch) ───
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.glass-card').forEach(card => {
        card.classList.add('opacity-0', 'translate-y-10', 'transition-all', 'duration-700');
        cardObserver.observe(card);
    });

    // ─── Stat Counter Animation ───
    const statNumbers = document.querySelectorAll('.stat-number');
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                if (el.dataset.animated) return;
                el.dataset.animated = 'true';
                const target = parseInt(el.dataset.target);
                const duration = 2000;
                const start = performance.now();

                function updateCounter(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.floor(eased * target).toLocaleString();
                    if (progress < 1) requestAnimationFrame(updateCounter);
                    else el.textContent = target.toLocaleString();
                }
                requestAnimationFrame(updateCounter);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => statObserver.observe(el));

    // ─── Contact Form ───
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const formReset = document.getElementById('formReset');
    const formSubmit = document.getElementById('formSubmit');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailVal = document.getElementById('formEmail').value.trim();
        const phoneVal = document.getElementById('formPhone').value.trim();

        if (!emailVal && !phoneVal) {
            showToast('⚠️', 'Contact Info Required', 'Please provide either an Email Address or a Phone Number so we can reach you.');
            return;
        }

        const originalText = formSubmit.innerText;
        formSubmit.innerText = 'TRANSMITTING...';
        formSubmit.disabled = true;
        formSubmit.style.opacity = '0.7';

        // Save inquiry to localStorage for Admin Portal
        const inquiry = {
            id: rakGenerateId(),
            name: document.getElementById('formName').value.trim(),
            company: document.getElementById('formCompany').value.trim(),
            email: document.getElementById('formEmail').value.trim(),
            phone: document.getElementById('formPhone').value.trim(),
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
            formSuccess.classList.remove('hidden');
            showToast('✅', 'Inquiry Received!', 'Our team will respond within 48 hours.');
            formSubmit.innerText = originalText;
            formSubmit.disabled = false;
            formSubmit.style.opacity = '';
        }, 1500);
    });

    formReset.addEventListener('click', () => {
        formSuccess.classList.add('hidden');
        contactForm.classList.remove('hidden');
        contactForm.reset();
        showToast('📝', 'Ready!', 'Fill out the form to submit another inquiry.');
    });

    // ─── Service Card Click → Contact ───
    document.querySelectorAll('.service-card[data-service]').forEach(card => {
        card.addEventListener('click', () => {
            const serviceValue = card.dataset.service;
            const serviceName = card.querySelector('h3').textContent;
            const formService = document.getElementById('formService');

            if (formService) {
                // Reset form if in success state
                if (contactForm.classList.contains('hidden')) {
                    formSuccess.classList.add('hidden');
                    contactForm.classList.remove('hidden');
                    contactForm.reset();
                }
                formService.value = serviceValue;
                formService.style.borderColor = '#88cff9';
                formService.style.boxShadow = '0 0 0 3px rgba(142, 213, 255, 0.15)';
                setTimeout(() => {
                    formService.style.borderColor = '';
                    formService.style.boxShadow = '';
                }, 2000);
            }

            document.getElementById('contact').scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('🎯', `${serviceName} Selected`, 'Fill out the form below for a custom quote!');
        });
    });

    // ─── Pricing Toggle (Monthly / Yearly) ───
    const pricingToggle = document.getElementById('pricingToggle');
    const toggleMonthly = document.getElementById('toggleMonthly');
    const toggleYearly = document.getElementById('toggleYearly');
    const pricingValues = document.querySelectorAll('.pricing-value');
    let isYearly = false;

    pricingToggle.addEventListener('click', () => {
        isYearly = !isYearly;
        pricingToggle.classList.toggle('yearly', isYearly);
        toggleMonthly.classList.toggle('active-label', !isYearly);
        toggleYearly.classList.toggle('active-label', isYearly);

        pricingValues.forEach(val => {
            const newPrice = isYearly ? val.dataset.yearly : val.dataset.monthly;
            val.style.opacity = '0';
            val.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                val.textContent = parseInt(newPrice).toLocaleString();
                val.style.opacity = '1';
                val.style.transform = 'translateY(0)';
            }, 200);
        });

        showToast(
            isYearly ? '💰' : '📅',
            isYearly ? 'Yearly Billing' : 'Monthly Billing',
            isYearly ? 'You save 20% with yearly billing!' : 'Switched to monthly billing.'
        );
    });

    toggleMonthly.addEventListener('click', () => { if (isYearly) pricingToggle.click(); });
    toggleYearly.addEventListener('click', () => { if (!isYearly) pricingToggle.click(); });

    // ─── Pricing CTA → Contact ───
    document.querySelectorAll('.pricing-cta').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const planName = btn.dataset.plan;

            // Reset form if in success state
            if (contactForm.classList.contains('hidden')) {
                formSuccess.classList.add('hidden');
                contactForm.classList.remove('hidden');
                contactForm.reset();
            }

            document.getElementById('contact').scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('📋', `${planName} Plan Selected`, 'Complete the form to get started!');
        });
    });

    // ─── FAQ Accordion ───
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.closest('.faq-item');
            const isOpen = faqItem.classList.contains('open');

            // Close all other items
            document.querySelectorAll('.faq-item.open').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('open');
                    item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });

            faqItem.classList.toggle('open', !isOpen);
            question.setAttribute('aria-expanded', !isOpen);
        });
    });

    // ─── Newsletter Form ───
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterBtn = document.getElementById('newsletterBtn');
    const newsletterMsg = document.getElementById('newsletterMsg');

    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('newsletterEmail');
        const email = emailInput.value;

        // Save newsletter subscriber to localStorage for Admin Portal
        const subscribers = rakGetNewsletter();
        const alreadyExists = subscribers.some(s => s.email.toLowerCase() === email.toLowerCase());
        if (!alreadyExists) {
            subscribers.push({ email: email, date: new Date().toISOString() });
            rakSaveNewsletter(subscribers);
        }

        newsletterBtn.innerHTML = '<span class="material-symbols-outlined !text-base">check</span>';
        newsletterBtn.style.background = '#25D366';
        emailInput.value = '';
        emailInput.placeholder = 'Subscribed!';
        emailInput.disabled = true;
        newsletterMsg.textContent = '✓ You\'re on the list!';

        showToast('🎉', 'Subscribed!', `${email} has been added to our newsletter.`);

        setTimeout(() => {
            newsletterBtn.innerHTML = '<span class="material-symbols-outlined !text-base">send</span>';
            newsletterBtn.style.background = '';
            emailInput.placeholder = 'Email';
            emailInput.disabled = false;
            newsletterMsg.textContent = 'Subscribe for technical whitepapers and industry insights.';
        }, 5000);
    });

    // ─── Back to Top Button ───
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ─── WhatsApp Float Visibility ───
    const whatsappFloat = document.getElementById('whatsappFloat');

    window.addEventListener('scroll', () => {
        whatsappFloat.classList.toggle('visible', window.scrollY > 300);
    });

    // ─── Footer Coming Soon Links ───
    document.querySelectorAll('.footer-coming-soon').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showToast('🚧', `${page}`, 'This page is under construction. Stay tuned!');
        });
    });

    // ─── Logo Click → Scroll to Top ───
    document.getElementById('navLogo').addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.getElementById('footerLogo').addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ─── Keyboard Navigation ───
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileNav();
        }
    });

    // ─── Toast Notification System ───
    const toastContainer = document.getElementById('toastContainer');

    function showToast(icon, title, message, duration = 3000) {
        const toast = document.createElement('div');
        toast.classList.add('toast');
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <strong>${title}</strong>
                <span>${message}</span>
            </div>
            <button class="toast-close" aria-label="Close notification">✕</button>
            <div class="toast-progress" style="--duration: ${duration}ms"></div>
        `;
        toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
        toastContainer.appendChild(toast);
        setTimeout(() => dismissToast(toast), duration);
    }

    function dismissToast(toast) {
        if (toast.classList.contains('toast-out')) return;
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 400);
    }

    console.log('%c🔧 RAKTechSoftHub — Engineered with Precision', 'color: #88cff9; font-size: 14px; font-weight: bold;');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startScript);
} else {
    startScript();
}
