/**
 * Scroll Animations System
 * Sistema de animações ao fazer scroll
 * Compatível com Fade-In System
 */

(function() {
    'use strict';

    const CONFIG = {
        observerOptions: {
            threshold: 0.1,
            rootMargin: '0px 0px 0px 0px'
        },
        enableLogs: true
    };

    // ========================================
    // INTERSECTION OBSERVER - SCROLL DETECT
    // ========================================
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Adicionar classe visible para elementos com scroll-fade
                    if (element.classList.contains('scroll-fade-up') ||
                        element.classList.contains('scroll-fade-left') ||
                        element.classList.contains('scroll-fade-right') ||
                        element.classList.contains('scroll-fade-zoom') ||
                        element.classList.contains('scroll-fade-rotate') ||
                        element.classList.contains('scroll-fade-bounce')) {
                        element.classList.add('visible');
                    }

                    // Adicionar classe animate-in para scroll-animate
                    if (element.classList.contains('scroll-animate') ||
                        element.classList.contains('scroll-animate-left') ||
                        element.classList.contains('scroll-animate-right')) {
                        element.classList.add('animate-in');
                    }

                    observer.unobserve(element);
                }
            });
        }, CONFIG.observerOptions);

        // Selecionar todos os elementos com scroll-fade ou scroll-animate
        const scrollElements = document.querySelectorAll(
            '[class*="scroll-fade"], [class*="scroll-animate"]'
        );

        // Verificar elementos já visíveis no carregamento
        scrollElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const isVisible = rect.top <= windowHeight && rect.bottom >= 0;
            
            if (isVisible) {
                // Adicionar classe visible imediatamente para elementos já visíveis
                if (el.classList.contains('scroll-fade-up') ||
                    el.classList.contains('scroll-fade-left') ||
                    el.classList.contains('scroll-fade-right') ||
                    el.classList.contains('scroll-fade-zoom') ||
                    el.classList.contains('scroll-fade-rotate') ||
                    el.classList.contains('scroll-fade-bounce')) {
                    el.classList.add('visible');
                }

                if (el.classList.contains('scroll-animate') ||
                    el.classList.contains('scroll-animate-left') ||
                    el.classList.contains('scroll-animate-right')) {
                    el.classList.add('animate-in');
                }
            } else {
                // Observar elementos não visíveis
                observer.observe(el);
            }
        });

        log(`Scroll animations inicializado para ${scrollElements.length} elementos`, 'success');
    }

    // ========================================
    // SMOOTH SCROLL - NAVEGAÇÃO INTERNA
    // ========================================
    function initSmoothScroll() {
        // Aplicar smooth scroll no HTML
        document.documentElement.style.scrollBehavior = 'smooth';

        // Interceptar links internos
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href === '#') {
                    e.preventDefault();
                    return;
                }

                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    e.preventDefault();
                    
                    // Scroll suave com offset para navbar fixa
                    const navHeight = document.querySelector('header')?.offsetHeight || 75;
                    const targetPosition = targetElement.offsetTop - navHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    log(`Scroll suave para #${targetId}`, 'info');
                }
            });
        });

        log('Smooth scroll inicializado', 'success');
    }

    // ========================================
    // SCROLL TO TOP BUTTON
    // ========================================
    function initScrollToTop() {
        const scrollTopBtn = document.getElementById('backToTop');
        if (!scrollTopBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopBtn.style.display = 'block';
                scrollTopBtn.style.opacity = '1';
            } else {
                scrollTopBtn.style.opacity = '0';
                setTimeout(() => {
                    scrollTopBtn.style.display = 'none';
                }, 300);
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        log('Scroll to top inicializado', 'info');
    }

    // ========================================
    // PARALLAX EFFECT - BACKGROUND
    // ========================================
    function initParallaxEffect() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (parallaxElements.length === 0) return;

        window.addEventListener('scroll', () => {
            parallaxElements.forEach(element => {
                const scrollPosition = window.pageYOffset;
                const speed = element.getAttribute('data-parallax') || 0.5;
                element.style.backgroundPosition = `center ${scrollPosition * speed}px`;
            });
        });

        log(`Parallax effect inicializado para ${parallaxElements.length} elementos`, 'info');
    }

    // ========================================
    // REVEAL ON SCROLL - CUSTOM
    // ========================================
    function initRevealOnScroll() {
        const revealElements = document.querySelectorAll('[data-reveal]');
        
        if (revealElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const revealType = element.getAttribute('data-reveal') || 'fade-in';
                    
                    element.classList.add(revealType);
                    observer.unobserve(element);
                }
            });
        }, CONFIG.observerOptions);

        revealElements.forEach(el => observer.observe(el));

        log(`Reveal on scroll inicializado para ${revealElements.length} elementos`, 'info');
    }

    // ========================================
    // ACTIVE NAV LINK - SCROLL POSITION
    // ========================================
    function initActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('a[href^="#"]');

        if (sections.length === 0 || navLinks.length === 0) return;

        window.addEventListener('scroll', () => {
            let currentSection = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                const sectionHeight = section.clientHeight;

                if (window.pageYOffset >= sectionTop && 
                    window.pageYOffset < sectionTop + sectionHeight) {
                    currentSection = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                }
            });
        });

        log('Active nav link inicializado', 'info');
    }

    // ========================================
    // FADE IN ON SCROLL - OBSERVER
    // ========================================
    function initFadeInOnScroll() {
        const fadeElements = document.querySelectorAll('[data-fade-on-scroll]');
        
        if (fadeElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                    observer.unobserve(element);
                }
            });
        }, CONFIG.observerOptions);

        fadeElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            observer.observe(el);
        });

        log(`Fade in on scroll inicializado para ${fadeElements.length} elementos`, 'info');
    }

    // ========================================
    // STAGGER CARDS ON SCROLL
    // ========================================
    function initStaggerOnScroll() {
        const staggerContainers = document.querySelectorAll('[data-stagger-scroll]');
        
        if (staggerContainers.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const container = entry.target;
                    const children = container.querySelectorAll(':scope > *');

                    children.forEach((child, index) => {
                        child.style.opacity = '0';
                        child.style.transform = 'translateY(30px)';
                        child.style.transition = `opacity 0.8s ease-out ${index * 0.1}s, 
                                                 transform 0.8s ease-out ${index * 0.1}s`;
                        
                        setTimeout(() => {
                            child.style.opacity = '1';
                            child.style.transform = 'translateY(0)';
                        }, 100);
                    });

                    observer.unobserve(container);
                }
            });
        }, CONFIG.observerOptions);

        staggerContainers.forEach(container => observer.observe(container));

        log(`Stagger on scroll inicializado para ${staggerContainers.length} containers`, 'info');
    }

    // ========================================
    // COUNTER ANIMATION
    // ========================================
    function initCounterAnimation() {
        const counters = document.querySelectorAll('[data-counter]');
        
        if (counters.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-counter'));
                    const duration = parseInt(counter.getAttribute('data-duration') || '2000');
                    
                    animateCounter(counter, target, duration);
                    observer.unobserve(counter);
                }
            });
        }, CONFIG.observerOptions);

        counters.forEach(counter => observer.observe(counter));

        log(`Counter animation inicializado para ${counters.length} elementos`, 'info');
    }

    function animateCounter(element, target, duration) {
        const start = parseInt(element.textContent);
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (target - start) * progress);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ========================================
    // LOGGING
    // ========================================
    function log(message, type = 'info') {
        if (!CONFIG.enableLogs) return;

        const styles = {
            info: 'color: #3b82f6; font-weight: bold;',
            success: 'color: #10b981; font-weight: bold;',
            warn: 'color: #f59e0b; font-weight: bold;',
            error: 'color: #ef4444; font-weight: bold;'
        };

        const icons = {
            info: 'ℹ️',
            success: '✅',
            warn: '⚠️',
            error: '❌'
        };

        console.log(`%c${icons[type]} [ScrollAnimations] ${message}`, styles[type]);
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    function init() {
        initScrollAnimations();
        initSmoothScroll();
        initScrollToTop();
        initParallaxEffect();
        initRevealOnScroll();
        initActiveNavLink();
        initFadeInOnScroll();
        initStaggerOnScroll();
        initCounterAnimation();
        
        log('Sistema Scroll Animations Inicializado', 'success');
    }

    // ========================================
    // START WHEN DOM IS READY
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // EXPORTAR CONFIGURAÇÃO
    // ========================================
    window.ScrollAnimationsConfig = CONFIG;

})();