/**
 * Auto Fade-In System
 * Sistema automático de fade-in ao carregar a página
 * Inicializa automaticamente quando o DOM estiver pronto
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURAÇÕES
    // ========================================
    const CONFIG = {
        heroSelector: '.hero-fade-in',
        heroChildDelay: 150, // ms entre cada filho
        enableLogs: true
    };

    // ========================================
    // HERO FADE-IN
    // ========================================
    function initHeroFadeIn() {
        const heroElements = document.querySelectorAll(CONFIG.heroSelector);
        
        if (heroElements.length === 0) {
            log('No hero elements found with selector: ' + CONFIG.heroSelector, 'warn');
            return;
        }

        heroElements.forEach(hero => {
            // Adicionar classe loaded após pequeno delay
            setTimeout(() => {
                hero.classList.add('loaded');
                log('Hero fade-in activated', 'success');
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
                // Calcular delay baseado no índice
                const delay = (index + 1) * 100;
                child.style.animationDelay = `${delay}ms`;
            });
        });

        log(`Stagger animations initialized for ${staggerContainers.length} containers`, 'info');
    }

    // ========================================
    // AUTO FADE-IN PARA ELEMENTOS ESPECÍFICOS
    // ========================================
    function initAutoFadeIn() {
        // Selecionar elementos que devem ter fade-in automático
        const autoFadeElements = document.querySelectorAll('[data-auto-fade]');
        
        autoFadeElements.forEach(element => {
            const delay = element.getAttribute('data-auto-fade') || 0;
            
            element.classList.add('fade-in');
            
            if (delay > 0) {
                element.style.animationDelay = `${delay}ms`;
            }
        });

        if (autoFadeElements.length > 0) {
            log(`Auto fade-in applied to ${autoFadeElements.length} elements`, 'info');
        }
    }

    // ========================================
    // DETECT PAGE VISIBILITY
    // ========================================
    function setupVisibilityDetection() {
        // Reset animations when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Página ficou visível novamente
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
    // HELPER: ADICIONAR FADE-IN PROGRAMATICAMENTE
    // ========================================
    window.addFadeIn = function(element, options = {}) {
        const {
            direction = 'up',    // up, left, right, zoom, rotate
            delay = 0,           // ms
            duration = 800,      // ms
            easing = 'ease-out'  // ease-in, ease-out, ease-in-out, bounce
        } = options;

        // Determinar classe de animação
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

        // Aplicar classes
        element.classList.add(animationClass);
        
        // Aplicar estilos inline se necessário
        if (delay > 0) {
            element.style.animationDelay = `${delay}ms`;
        }
        
        if (duration !== 800) {
            element.style.animationDuration = `${duration}ms`;
        }

        // Aplicar easing
        if (easing !== 'ease-out') {
            element.classList.add(`fade-in-${easing}`);
        }

        log(`Fade-in added to element: ${direction} direction, ${delay}ms delay`, 'info');
        
        return element;
    };

    // ========================================
    // HELPER: ADICIONAR STAGGER A CONTAINER
    // ========================================
    window.addStagger = function(container, delayBetween = 100) {
        const children = Array.from(container.children);
        
        children.forEach((child, index) => {
            const delay = index * delayBetween;
            child.classList.add('fade-in');
            child.style.animationDelay = `${delay}ms`;
        });

        log(`Stagger applied to ${children.length} children with ${delayBetween}ms delay`, 'success');
        
        return container;
    };

    // ========================================
    // HELPER: REMOVER FADE-IN
    // ========================================
    window.removeFadeIn = function(element) {
        const fadeClasses = [
            'fade-in',
            'fade-in-left',
            'fade-in-right',
            'fade-in-zoom',
            'fade-in-rotate',
            'loaded'
        ];

        fadeClasses.forEach(cls => element.classList.remove(cls));
        element.style.animationDelay = '';
        element.style.animationDuration = '';
        element.style.opacity = '1';

        log('Fade-in removed from element', 'info');
        
        return element;
    };

    // ========================================
    // HELPER: RESET ANIMATIONS
    // ========================================
    window.resetFadeInAnimations = function() {
        const allFadeElements = document.querySelectorAll('[class*="fade-in"]');
        
        allFadeElements.forEach(element => {
            element.style.animation = 'none';
            
            // Trigger reflow
            void element.offsetWidth;
            
            element.style.animation = '';
        });

        log(`Reset ${allFadeElements.length} fade-in animations`, 'success');
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

        console.log(`%c${icons[type]} [Auto Fade-In] ${message}`, styles[type]);
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    function init() {
        initHeroFadeIn();
        initStaggerAnimations();
        initAutoFadeIn();
        setupVisibilityDetection();
        
        log('Auto Fade-In System Initialized', 'success');
        log('Available functions: addFadeIn(), addStagger(), removeFadeIn(), resetFadeInAnimations()', 'info');
    }

    // ========================================
    // START WHEN DOM IS READY
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM já está pronto
        init();
    }

    // Também inicializar quando a página estiver completamente carregada
    window.addEventListener('load', () => {
        // Garantir que hero fade-in seja ativado mesmo que não tenha sido antes
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

    // ========================================
    // EXAMPLES
    // ========================================
    /*
    
    // Adicionar fade-in programaticamente
    const element = document.querySelector('.my-element');
    addFadeIn(element, {
        direction: 'left',
        delay: 300,
        duration: 1000,
        easing: 'bounce'
    });

    // Adicionar stagger a um container
    const container = document.querySelector('.my-grid');
    addStagger(container, 150);

    // Remover fade-in
    removeFadeIn(element);

    // Reset todas as animações
    resetFadeInAnimations();

    // Desabilitar logs
    AutoFadeInConfig.enableLogs = false;
    
    */

})();