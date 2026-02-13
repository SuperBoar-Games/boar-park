// SuperBoar Marketing Site - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('mobile-active');
            this.textContent = navLinks.classList.contains('mobile-active') ? '✕' : '☰';
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                if (navLinks) {
                    navLinks.classList.remove('mobile-active');
                    if (mobileMenuBtn) mobileMenuBtn.textContent = '☰';
                }
            }
        });
    });
    
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(44, 29, 39, 0.98)';
        } else {
            navbar.style.background = 'rgba(44, 29, 39, 0.95)';
        }
        
        lastScroll = currentScroll;
    });
    
    // Scroll reveal animations
    const revealElements = document.querySelectorAll('.step, .type-card, .lang-card');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        revealObserver.observe(el);
    });
    
    // Stats counter animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.stat-number').forEach(stat => {
        statsObserver.observe(stat);
    });
    
    function animateCounter(element) {
        const text = element.textContent;
        const numMatch = text.match(/\d+/);
        if (!numMatch) return;
        
        const target = parseInt(numMatch[0]);
        const suffix = text.replace(/\d+/, '');
        let current = 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        
        const counter = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + suffix;
                clearInterval(counter);
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, 16);
    }
    
    // Card flip effect on click for type cards
    document.querySelectorAll('.type-card').forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'rotateY(360deg)';
            setTimeout(() => {
                this.style.transform = '';
            }, 600);
        });
    });
    
    // Add hover tilt effect to sample cards
    document.querySelectorAll('.sample-card').forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Language card selection highlight
    let selectedLang = null;
    document.querySelectorAll('.lang-card').forEach(card => {
        card.addEventListener('click', function() {
            if (selectedLang) {
                selectedLang.style.border = '';
                selectedLang.style.transform = '';
            }
            selectedLang = this;
            this.style.border = '3px solid #ffd166';
            this.style.transform = 'scale(1.05)';
        });
    });
    
    // Easter egg: Click the boar logo for a surprise
    const boarLogo = document.querySelector('.nav-brand .boar-logo');
    if (boarLogo) {
        let clickCount = 0;
        boarLogo.addEventListener('click', function() {
            clickCount++;
            if (clickCount === 5) {
                document.body.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    document.body.style.animation = '';
                    alert('🐗 Boar Power Activated! Welcome to the wild!');
                }, 500);
                clickCount = 0;
            }
        });
    }
});

// Add shake animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    .nav-links.mobile-active {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(44, 29, 39, 0.98);
        padding: 1rem;
        gap: 1rem;
        border-bottom: 2px solid #ffd166;
    }
`;
document.head.appendChild(style);