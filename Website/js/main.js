// =============================================
// RAKTechSoftHub - Main JavaScript
// =============================================

// Tab switching logic
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        // Update buttons
        tabButtons.forEach(b => {
            b.classList.remove('tab-active');
            b.classList.add('text-on-surface-variant');
        });
        btn.classList.add('tab-active');
        btn.classList.remove('text-on-surface-variant');

        // Update content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === target) {
                content.classList.add('active');
            }
        });
    });
});

// Smooth scroll for anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Form Submission micro-interaction
const form = document.querySelector('form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'TRANSMITTING...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerText = 'INQUIRY RECEIVED';
            btn.classList.replace('bg-primary-container', 'bg-tertiary-container');
            form.reset();
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.replace('bg-tertiary-container', 'bg-primary-container');
                btn.disabled = false;
            }, 3000);
        }, 1500);
    });
}

// Intersection Observer for fade-in effects
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
        }
    });
}, observerOptions);

document.querySelectorAll('.glass-card').forEach(card => {
    card.classList.add('opacity-0', 'translate-y-10', 'transition-all', 'duration-700');
    observer.observe(card);
});
