/**
 * Theme Manager Animation Override
 * Evita conflitos entre Theme Manager e Fade-In System
 * DEVE SER CARREGADO ANTES do thememanager.js
 */

(function() {
    'use strict';

    // ========================================
    // SOBRESCREVER ESTILOS GLOBAIS DE TRANSIÇÃO
    // ========================================
    function overrideThemeManagerTransitions() {
        // Injetar estilos que excluem elementos de fade-in das transições globais
        const style = document.createElement('style');
        style.id = 'theme-animation-override';
        style.textContent = `
            /**
             * Override: Excluir elementos com fade-in das transições globais do Theme Manager
             */

            /* Fade-in elements - SEM transições globais */
            .fade-in,
            .fade-in-left,
            .fade-in-right,
            .fade-in-zoom,
            .fade-in-rotate,
            .fade-in-stagger > *,
            .hero-fade-in,
            .hero-fade-in.loaded > *,
            [class*="scroll-fade"],
            [class*="scroll-animate"] {
                transition: none !important;
            }

            /* Manter transições de tema APENAS para elementos que não tem fade-in */
            *:not(.fade-in):not(.fade-in-left):not(.fade-in-right):not(.fade-in-zoom):not(.fade-in-rotate):not([class*="scroll-fade"]):not([class*="scroll-animate"]) {
                transition-property: background-color, border-color, color, box-shadow, fill, stroke !important;
                transition-duration: 0.3s !important;
                transition-timing-function: ease !important;
            }

            /* Excluir elementos com animações específicas */
            *[style*="animation"],
            .shimmer,
            .pulse,
            .rotate,
            .carousel-slide,
            .progress-bar-fill,
            .visualizer-bar,
            .hero-bg,
            .card-bg,
            .video-background,
            .video-overlay {
                transition: none !important;
            }

            /* Scroll animations - usar suas próprias transições */
            .scroll-fade-up,
            .scroll-fade-left,
            .scroll-fade-right,
            .scroll-fade-zoom,
            .scroll-fade-rotate,
            .scroll-fade-bounce,
            .scroll-animate,
            .scroll-animate-left,
            .scroll-animate-right {
                transition-property: opacity, transform !important;
                transition-duration: 0.8s !important;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
            }

            /* Hero visible state */
            .scroll-fade-up.visible,
            .scroll-fade-left.visible,
            .scroll-fade-right.visible,
            .scroll-fade-zoom.visible,
            .scroll-fade-rotate.visible,
            .scroll-fade-bounce.visible,
            .scroll-animate.animate-in,
            .scroll-animate-left.animate-in,
            .scroll-animate-right.animate-in {
                transition: none !important;
            }

            /* Smooth scroll global - não interferir com animações */
            html {
                scroll-behavior: smooth;
            }
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // DETECTAR CONFLITOS COM THEME MANAGER
    // ========================================
    function detectThemeManagerConflicts() {
        // Esperar theme manager ser carregado
        const checkThemeManager = setInterval(() => {
            if (window.themeManager) {
                clearInterval(checkThemeManager);
                console.log('%c✅ [Theme Animation Override] Theme Manager detectado e compatibilizado', 
                    'color: #10b981; font-weight: bold;');
                
                // Modificar theme manager para não aplicar transições em fade-in
                patchThemeManager();
            }
        }, 100);

        // Timeout de segurança
        setTimeout(() => {
            clearInterval(checkThemeManager);
        }, 5000);
    }

    // ========================================
    // PATCH THEME MANAGER
    // ========================================
    function patchThemeManager() {
        // Salvar método original se existir
        if (window.themeManager && window.themeManager.injectDynamicStyles) {
            const originalInjectDynamicStyles = window.themeManager.injectDynamicStyles.bind(window.themeManager);
            
            // Sobrescrever com versão que exclui fade-in
            window.themeManager.injectDynamicStyles = function(theme) {
                // Chamar original
                originalInjectDynamicStyles(theme);
                
                // Aplicar override
                overrideThemeManagerTransitions();
            };

            console.log('%c✅ [Theme Animation Override] Theme Manager patcheado com sucesso', 
                'color: #10b981; font-weight: bold;');
        }
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    function init() {
        // Injetar estilos de override imediatamente
        overrideThemeManagerTransitions();
        
        // Detectar e patchear theme manager quando carregado
        detectThemeManagerConflicts();
        
        console.log('%c🎨 [Theme Animation Override] Sistema inicializado', 
            'color: #8b5cf6; font-weight: bold;');
    }

    // ========================================
    // START
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();