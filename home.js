document.addEventListener('DOMContentLoaded', () => {
    gsap.from('.hero-content', { opacity: 0, y: -50, duration: 1.5 });
    gsap.from('.nav-links li', {
        opacity: 0, y: -30, duration: 1, delay: 0.5, stagger: 0.2
    });
    gsap.from('.feature-card', {
        opacity: 0, x: 100, duration: 1, delay: 1, stagger: 0.3
    });
});
