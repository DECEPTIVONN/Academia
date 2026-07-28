/**
 * Auto Fade-In System - VERSÃO OTIMIZADA
 * Sistema automático de fade-in ao carregar a página
 * Compatível com Theme Manager
 * Sem conflitos com transições globais
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURAÇÕES
    // ========================================
    const CONFIG = {
        heroSelector: '.hero-fade-in, .reviews-hero, .franquias-hero, .review-hero-section',
        heroChildDelay: 150,
        enableLogs: true,
        excludeSelectors: [
            '[style*="animation"]',
            '.shimmer',
            '.pulse',
            '.rotate',
            '.carousel-slide',
            '.progress-bar-fill',
            '.visualizer-bar',
            '.hero-bg',
            '.card-bg',
            '.video-background',
            '.video-overlay'
        ].join(',')
    };

    // ========================================
    // STYLE INJECTION - SEM CONFLITOS
    // ========================================
    function injectFadeInStyles() {
        if (document.getElementById('fade-in-styles')) return;

        const style = document.createElement('style');
        style.id = 'fade-in-styles';
        style.textContent = `
            /* Fade-In Animation - ISOLADO DO THEME MANAGER */
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes fadeInLeft {
                from {
                    opacity: 0;
                    transform: translateX(-40px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes fadeInRight {
                from {
                    opacity: 0;
                    transform: translateX(40px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes fadeInZoom {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes fadeInRotate {
                from {
                    opacity: 0;
                    transform: rotate(-5deg) translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: rotate(0) translateY(0);
                }
            }

            /* Classe Principal */
            .fade-in {
                opacity: 0;
                animation: fadeIn 0.8s ease-out forwards;
            }

            /* Variações */
            .fade-in-left {
                opacity: 0;
                animation: fadeInLeft 0.8s ease-out forwards;
            }

            .fade-in-right {
                opacity: 0;
                animation: fadeInRight 0.8s ease-out forwards;
            }

            .fade-in-zoom {
                opacity: 0;
                animation: fadeInZoom 0.8s ease-out forwards;
            }

            .fade-in-rotate {
                opacity: 0;
                animation: fadeInRotate 0.8s ease-out forwards;
            }

            /* Velocidades */
            .fade-in-fast {
                animation-duration: 0.4s;
            }

            .fade-in-slow {
                animation-duration: 1.2s;
            }

            /* Delays em Cascade */
            .fade-in-delay-1 { animation-delay: 0.1s; }
            .fade-in-delay-2 { animation-delay: 0.2s; }
            .fade-in-delay-3 { animation-delay: 0.3s; }
            .fade-in-delay-4 { animation-delay: 0.4s; }
            .fade-in-delay-5 { animation-delay: 0.5s; }
            .fade-in-delay-6 { animation-delay: 0.6s; }
            .fade-in-delay-7 { animation-delay: 0.7s; }
            .fade-in-delay-8 { animation-delay: 0.8s; }

            /* Stagger - CONTAINER */
            .fade-in-stagger > * {
                opacity: 0;
                animation: fadeIn 0.8s ease-out forwards;
            }

            .fade-in-stagger > *:nth-child(1) { animation-delay: 0.1s; }
            .fade-in-stagger > *:nth-child(2) { animation-delay: 0.2s; }
            .fade-in-stagger > *:nth-child(3) { animation-delay: 0.3s; }
            .fade-in-stagger > *:nth-child(4) { animation-delay: 0.4s; }
            .fade-in-stagger > *:nth-child(5) { animation-delay: 0.5s; }
            .fade-in-stagger > *:nth-child(6) { animation-delay: 0.6s; }
            .fade-in-stagger > *:nth-child(7) { animation-delay: 0.7s; }
            .fade-in-stagger > *:nth-child(8) { animation-delay: 0.8s; }
            .fade-in-stagger > *:nth-child(9) { animation-delay: 0.9s; }
            .fade-in-stagger > *:nth-child(10) { animation-delay: 1s; }

            /* Hero Content */
            .hero-fade-in {
                opacity: 0;
            }

            .hero-fade-in.loaded {
                animation: fadeIn 0.8s ease-out forwards;
            }

            .hero-fade-in.loaded > *:nth-child(1) {
                animation: fadeIn 0.8s ease-out 0.1s forwards;
                opacity: 0;
            }

            .hero-fade-in.loaded > *:nth-child(2) {
                animation: fadeIn 0.8s ease-out 0.25s forwards;
                opacity: 0;
            }

            .hero-fade-in.loaded > *:nth-child(3) {
                animation: fadeIn 0.8s ease-out 0.4s forwards;
                opacity: 0;
            }

            .hero-fade-in.loaded > *:nth-child(4) {
                animation: fadeIn 0.8s ease-out 0.55s forwards;
                opacity: 0;
            }

            /* Acessibilidade */
            @media (prefers-reduced-motion: reduce) {
                .fade-in,
                .fade-in-left,
                .fade-in-right,
                .fade-in-zoom,
                .fade-in-rotate,
                .fade-in-stagger > *,
                .hero-fade-in,
                .hero-fade-in.loaded > * {
                    animation: none !important;
                    opacity: 1 !important;
                    transform: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // HERO FADE-IN
    // ========================================
    function initHeroFadeIn() {
        const heroElements = document.querySelectorAll(CONFIG.heroSelector);
        
        if (heroElements.length === 0) {
            log('No hero elements found', 'warn');
            return;
        }

        heroElements.forEach(hero => {
            setTimeout(() => {
                hero.classList.add('loaded');
                log('Hero fade-in ativado', 'success');
            }, 100);
        });
    }

    // ========================================
    // STAGGER ANIMATIONS
    // ========================================
    function initStaggerAnimations() {
        const staggerContainers = document.querySelectorAll('.fade-in-stagger');
        
        if (staggerContainers.length === 0) return;

        staggerContainers.forEach(container => {
            const children = Array.from(container.children);
            
            children.forEach((child, index) => {
                const delay = (index + 1) * 100;
                child.style.animationDelay = `${delay}ms`;
            });
        });

        log(`Stagger inicializado para ${staggerContainers.length} containers`, 'info');
    }

    // ========================================
    // AUTO FADE-IN - DATA ATTRIBUTE
    // ========================================
    function initAutoFadeIn() {
        const autoFadeElements = document.querySelectorAll('[data-auto-fade]');
        
        autoFadeElements.forEach(element => {
            const delay = element.getAttribute('data-auto-fade') || 0;
            
            element.classList.add('fade-in');
            
            if (delay > 0) {
                element.style.animationDelay = `${delay}ms`;
            }
        });

        if (autoFadeElements.length > 0) {
            log(`Auto fade-in aplicado a ${autoFadeElements.length} elementos`, 'info');
        }
    }

    // ========================================
    // GLOBAL AUTO-FADE - CARDS
    // ========================================
    function initAutoFadeCards() {
        const cardSelectors = [
            '.card', '.featured-card', '.mode-card', '.game-card',
            '.news-card', '.highlight-card', '.game-card-featured',
            '.stat-card', '.stat-card-enhanced', '.achievement-card',
            '.franquia-card', '.platform-card', '.dashboard-card',
            '.game-grid-card', '.jogo-card', '.game-list-item',
            '.top-game-card-xbox', '.timeline-year-card',
            '.mais-lidas-card', '.screenshot-card', '.wallpaper-card'
        ].join(', ');

        let delayCounter = 0;
        document.querySelectorAll(cardSelectors).forEach((card) => {
            if (!card.classList.contains('fade-in') && !card.classList.contains('scroll-fade-up')) {
                const delayClass = `fade-in-delay-${Math.min(Math.floor(delayCounter / 8) + 1, 8)}`;
                card.classList.add('fade-in', delayClass);
                delayCounter++;
            }
        });

        if (delayCounter > 0) {
            log(`Fade-in aplicado a ${delayCounter} cards`, 'success');
        }
    }

    // ========================================
    // GLOBAL AUTO-FADE - SEÇÕES
    // ========================================
    function initAutoFadeSections() {
        const sectionSelectors = [
            'section', '.section', '.content-section',
            '.featured-characters-section', '.game-modes-section',
            '.news-section', '.cta-banner',
            '.review-content-section', '.franquia-exemplo-content'
        ].join(', ');

        let delayCounter = 0;
        document.querySelectorAll(sectionSelectors).forEach((section) => {
            if (!section.classList.contains('fade-in') && !section.classList.contains('scroll-fade-up')) {
                const delayClass = `fade-in-delay-${Math.min(Math.floor(delayCounter / 4) + 1, 8)}`;
                section.classList.add('fade-in', delayClass);
                delayCounter++;
            }
        });

        if (delayCounter > 0) {
            log(`Fade-in aplicado a ${delayCounter} seções`, 'info');
        }
    }

    // ========================================
    // VISIBILITY DETECTION
    // ========================================
    function setupVisibilityDetection() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                const heroElements = document.querySelectorAll(CONFIG.heroSelector);
                heroElements.forEach(hero => {
                    if (!hero.classList.contains('loaded')) {
                        hero.classList.add('loaded');
                    }
                });
            }
        });
    }

    // ========================================
    // HELPERS - FUNÇÕES PÚBLICAS
    // ========================================
    window.addFadeIn = function(element, options = {}) {
        const {
            direction = 'up',
            delay = 0,
            duration = 800,
            easing = 'ease-out'
        } = options;

        let animationClass = 'fade-in';
        
        switch(direction) {
            case 'left':
                animationClass = 'fade-in-left';
                break;
            case 'right':
                animationClass = 'fade-in-right';
                break;
            case 'zoom':
                animationClass = 'fade-in-zoom';
                break;
            case 'rotate':
                animationClass = 'fade-in-rotate';
                break;
        }

        element.classList.add(animationClass);
        
        if (delay > 0) {
            element.style.animationDelay = `${delay}ms`;
        }
        
        if (duration !== 800) {
            element.style.animationDuration = `${duration}ms`;
        }

        log(`Fade-in adicionado: ${direction} direction, ${delay}ms delay`, 'info');
        
        return element;
    };

    window.addStagger = function(container, delayBetween = 100) {
        const children = Array.from(container.children);
        
        children.forEach((child, index) => {
            const delay = index * delayBetween;
            child.classList.add('fade-in');
            child.style.animationDelay = `${delay}ms`;
        });

        log(`Stagger aplicado a ${children.length} filhos com ${delayBetween}ms delay`, 'success');
        
        return container;
    };

    window.removeFadeIn = function(element) {
        const fadeClasses = [
            'fade-in', 'fade-in-left', 'fade-in-right',
            'fade-in-zoom', 'fade-in-rotate', 'loaded'
        ];

        fadeClasses.forEach(cls => element.classList.remove(cls));
        element.style.animationDelay = '';
        element.style.animationDuration = '';
        element.style.opacity = '1';

        log('Fade-in removido do elemento', 'info');
        
        return element;
    };

    window.resetFadeInAnimations = function() {
        const allFadeElements = document.querySelectorAll('[class*="fade-in"]');
        
        allFadeElements.forEach(element => {
            element.style.animation = 'none';
            void element.offsetWidth;
            element.style.animation = '';
        });

        log(`Reset em ${allFadeElements.length} animações fade-in`, 'success');
    };

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

        console.log(`%c${icons[type]} [Fade-In] ${message}`, styles[type]);
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    function init() {
        injectFadeInStyles();
        initHeroFadeIn();
        initStaggerAnimations();
        initAutoFadeIn();
        initAutoFadeCards();
        initAutoFadeSections();
        setupVisibilityDetection();
        
        log('Sistema Fade-In Inicializado', 'success');
        log('Funções disponíveis: addFadeIn(), addStagger(), removeFadeIn(), resetFadeInAnimations()', 'info');
    }

    // ========================================
    // START WHEN DOM IS READY
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('load', () => {
        const heroElements = document.querySelectorAll(CONFIG.heroSelector);
        heroElements.forEach(hero => {
            if (!hero.classList.contains('loaded')) {
                setTimeout(() => {
                    hero.classList.add('loaded');
                }, 100);
            }
        });
    });

    // ========================================
    // EXPORTAR CONFIGURAÇÃO
    // ========================================
    window.AutoFadeInConfig = CONFIG;

})();