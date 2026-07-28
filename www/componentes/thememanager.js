// Theme Manager System - Complete Enhanced Version with Advanced Color Replacement
(function() {
    'use strict';

    // Definição completa dos temas com todas as variações necessárias
    const themes = {
        dark: {
            name: 'Escuro',
            icon: '🌙',
            primary: '#8b5cf6',
            primaryLight: '#c084fc',
            primaryDark: '#6d28d9',
            primaryLighter: '#ddd6fe',
            accent: '#f5a6d3',
            accentDark: '#e879d9',
            background: '#121212',
            backgroundAlt: '#1f1f1f',
            backgroundCard: 'rgba(139, 92, 246, 0.05)',
            backgroundCardHover: 'rgba(139, 92, 246, 0.15)',
            text: '#ffffff',
            textSecondary: '#cccccc',
            textTertiary: '#999999',
            border: 'rgba(139, 92, 246, 0.3)',
            borderLight: 'rgba(139, 92, 246, 0.2)',
            borderDark: 'rgba(139, 92, 246, 0.5)',
            gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            gradientAlt: 'linear-gradient(135deg, #fff, #f5a6d3, #8b5cf6)',
            gradientHover: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
            shadow: 'rgba(139, 92, 246, 0.3)',
            shadowLight: 'rgba(139, 92, 246, 0.2)',
            shadowDark: 'rgba(139, 92, 246, 0.5)',
            glow: 'rgba(139, 92, 246, 0.6)',
            overlay: 'rgba(139, 92, 246, 0.1)',
            blur: 'rgba(139, 92, 246, 0.08)',
            rgb: '139, 92, 246'
        },
        light: {
            name: 'Claro',
            icon: '☀️',
            primary: '#6366f1',
            primaryLight: '#818cf8',
            primaryDark: '#4f46e5',
            primaryLighter: '#e0e7ff',
            accent: '#ec4899',
            accentDark: '#db2777',
            background: '#ffffff',
            backgroundAlt: '#f9fafb',
            backgroundCard: 'rgba(99, 102, 241, 0.05)',
            backgroundCardHover: 'rgba(99, 102, 241, 0.15)',
            text: '#111827',
            textSecondary: '#4b5563',
            textTertiary: '#6b7280',
            border: 'rgba(99, 102, 241, 0.3)',
            borderLight: 'rgba(99, 102, 241, 0.2)',
            borderDark: 'rgba(99, 102, 241, 0.5)',
            gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            gradientAlt: 'linear-gradient(135deg, #111827, #ec4899, #6366f1)',
            gradientHover: 'linear-gradient(135deg, #818cf8, #6366f1)',
            shadow: 'rgba(99, 102, 241, 0.3)',
            shadowLight: 'rgba(99, 102, 241, 0.2)',
            shadowDark: 'rgba(99, 102, 241, 0.5)',
            glow: 'rgba(99, 102, 241, 0.6)',
            overlay: 'rgba(99, 102, 241, 0.1)',
            blur: 'rgba(99, 102, 241, 0.08)',
            rgb: '99, 102, 241'
        },
        blue: {
            name: 'Azul',
            icon: '💙',
            primary: '#3b82f6',
            primaryLight: '#60a5fa',
            primaryDark: '#2563eb',
            primaryLighter: '#dbeafe',
            accent: '#06b6d4',
            accentDark: '#0891b2',
            background: '#121212',
            backgroundAlt: '#1f1f1f',
            backgroundCard: 'rgba(59, 130, 246, 0.05)',
            backgroundCardHover: 'rgba(59, 130, 246, 0.15)',
            text: '#ffffff',
            textSecondary: '#cccccc',
            textTertiary: '#999999',
            border: 'rgba(59, 130, 246, 0.3)',
            borderLight: 'rgba(59, 130, 246, 0.2)',
            borderDark: 'rgba(59, 130, 246, 0.5)',
            gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            gradientAlt: 'linear-gradient(135deg, #fff, #06b6d4, #3b82f6)',
            gradientHover: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            shadow: 'rgba(59, 130, 246, 0.3)',
            shadowLight: 'rgba(59, 130, 246, 0.2)',
            shadowDark: 'rgba(59, 130, 246, 0.5)',
            glow: 'rgba(59, 130, 246, 0.6)',
            overlay: 'rgba(59, 130, 246, 0.1)',
            blur: 'rgba(59, 130, 246, 0.08)',
            rgb: '59, 130, 246'
        },
        green: {
            name: 'Verde',
            icon: '💚',
            primary: '#10b981',
            primaryLight: '#34d399',
            primaryDark: '#059669',
            primaryLighter: '#d1fae5',
            accent: '#6ee7b7',
            accentDark: '#10b981',
            background: '#121212',
            backgroundAlt: '#1f1f1f',
            backgroundCard: 'rgba(16, 185, 129, 0.05)',
            backgroundCardHover: 'rgba(16, 185, 129, 0.15)',
            text: '#ffffff',
            textSecondary: '#cccccc',
            textTertiary: '#999999',
            border: 'rgba(16, 185, 129, 0.3)',
            borderLight: 'rgba(16, 185, 129, 0.2)',
            borderDark: 'rgba(16, 185, 129, 0.5)',
            gradient: 'linear-gradient(135deg, #10b981, #059669)',
            gradientAlt: 'linear-gradient(135deg, #fff, #6ee7b7, #10b981)',
            gradientHover: 'linear-gradient(135deg, #34d399, #10b981)',
            shadow: 'rgba(16, 185, 129, 0.3)',
            shadowLight: 'rgba(16, 185, 129, 0.2)',
            shadowDark: 'rgba(16, 185, 129, 0.5)',
            glow: 'rgba(16, 185, 129, 0.6)',
            overlay: 'rgba(16, 185, 129, 0.1)',
            blur: 'rgba(16, 185, 129, 0.08)',
            rgb: '16, 185, 129'
        },
        red: {
            name: 'Vermelho',
            icon: '❤️',
            primary: '#ef4444',
            primaryLight: '#f87171',
            primaryDark: '#dc2626',
            primaryLighter: '#fee2e2',
            accent: '#fb7185',
            accentDark: '#e11d48',
            background: '#121212',
            backgroundAlt: '#1f1f1f',
            backgroundCard: 'rgba(239, 68, 68, 0.05)',
            backgroundCardHover: 'rgba(239, 68, 68, 0.15)',
            text: '#ffffff',
            textSecondary: '#cccccc',
            textTertiary: '#999999',
            border: 'rgba(239, 68, 68, 0.3)',
            borderLight: 'rgba(239, 68, 68, 0.2)',
            borderDark: 'rgba(239, 68, 68, 0.5)',
            gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
            gradientAlt: 'linear-gradient(135deg, #fff, #fb7185, #ef4444)',
            gradientHover: 'linear-gradient(135deg, #f87171, #ef4444)',
            shadow: 'rgba(239, 68, 68, 0.3)',
            shadowLight: 'rgba(239, 68, 68, 0.2)',
            shadowDark: 'rgba(239, 68, 68, 0.5)',
            glow: 'rgba(239, 68, 68, 0.6)',
            overlay: 'rgba(239, 68, 68, 0.1)',
            blur: 'rgba(239, 68, 68, 0.08)',
            rgb: '239, 68, 68'
        },
        orange: {
            name: 'Laranja',
            icon: '🧡',
            primary: '#f97316',
            primaryLight: '#fb923c',
            primaryDark: '#ea580c',
            primaryLighter: '#fed7aa',
            accent: '#fdba74',
            accentDark: '#f97316',
            background: '#121212',
            backgroundAlt: '#1f1f1f',
            backgroundCard: 'rgba(249, 115, 22, 0.05)',
            backgroundCardHover: 'rgba(249, 115, 22, 0.15)',
            text: '#ffffff',
            textSecondary: '#cccccc',
            textTertiary: '#999999',
            border: 'rgba(249, 115, 22, 0.3)',
            borderLight: 'rgba(249, 115, 22, 0.2)',
            borderDark: 'rgba(249, 115, 22, 0.5)',
            gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
            gradientAlt: 'linear-gradient(135deg, #fff, #fdba74, #f97316)',
            gradientHover: 'linear-gradient(135deg, #fb923c, #f97316)',
            shadow: 'rgba(249, 115, 22, 0.3)',
            shadowLight: 'rgba(249, 115, 22, 0.2)',
            shadowDark: 'rgba(249, 115, 22, 0.5)',
            glow: 'rgba(249, 115, 22, 0.6)',
            overlay: 'rgba(249, 115, 22, 0.1)',
            blur: 'rgba(249, 115, 22, 0.08)',
            rgb: '249, 115, 22'
        },
        pink: {
            name: 'Rosa',
            icon: '💗',
            primary: '#ec4899',
            primaryLight: '#f472b6',
            primaryDark: '#db2777',
            primaryLighter: '#fce7f3',
            accent: '#f9a8d4',
            accentDark: '#ec4899',
            background: '#121212',
            backgroundAlt: '#1f1f1f',
            backgroundCard: 'rgba(236, 72, 153, 0.05)',
            backgroundCardHover: 'rgba(236, 72, 153, 0.15)',
            text: '#ffffff',
            textSecondary: '#cccccc',
            textTertiary: '#999999',
            border: 'rgba(236, 72, 153, 0.3)',
            borderLight: 'rgba(236, 72, 153, 0.2)',
            borderDark: 'rgba(236, 72, 153, 0.5)',
            gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
            gradientAlt: 'linear-gradient(135deg, #fff, #f9a8d4, #ec4899)',
            gradientHover: 'linear-gradient(135deg, #f472b6, #ec4899)',
            shadow: 'rgba(236, 72, 153, 0.3)',
            shadowLight: 'rgba(236, 72, 153, 0.2)',
            shadowDark: 'rgba(236, 72, 153, 0.5)',
            glow: 'rgba(236, 72, 153, 0.6)',
            overlay: 'rgba(236, 72, 153, 0.1)',
            blur: 'rgba(236, 72, 153, 0.08)',
            rgb: '236, 72, 153'
        },
        cyan: {
            name: 'Ciano',
            icon: '💎',
            primary: '#06b6d4',
            primaryLight: '#22d3ee',
            primaryDark: '#0891b2',
            primaryLighter: '#cffafe',
            accent: '#67e8f9',
            accentDark: '#0891b2',
            background: '#121212',
            backgroundAlt: '#1f1f1f',
            backgroundCard: 'rgba(6, 182, 212, 0.05)',
            backgroundCardHover: 'rgba(6, 182, 212, 0.15)',
            text: '#ffffff',
            textSecondary: '#cccccc',
            textTertiary: '#999999',
            border: 'rgba(6, 182, 212, 0.3)',
            borderLight: 'rgba(6, 182, 212, 0.2)',
            borderDark: 'rgba(6, 182, 212, 0.5)',
            gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
            gradientAlt: 'linear-gradient(135deg, #fff, #67e8f9, #06b6d4)',
            gradientHover: 'linear-gradient(135deg, #22d3ee, #06b6d4)',
            shadow: 'rgba(6, 182, 212, 0.3)',
            shadowLight: 'rgba(6, 182, 212, 0.2)',
            shadowDark: 'rgba(6, 182, 212, 0.5)',
            glow: 'rgba(6, 182, 212, 0.6)',
            overlay: 'rgba(6, 182, 212, 0.1)',
            blur: 'rgba(6, 182, 212, 0.08)',
            rgb: '6, 182, 212'
        },
        amarelo: {
            name: 'Amarelo',
            icon: '💛',
            primary: '#facc15',
            primaryLight: '#fde68a',
            primaryDark: '#ca8a04',
            primaryLighter: '#fef3c7',
            accent: '#f59e0b',
            accentDark: '#d97706',
            background: '#1a1a1a',
            backgroundAlt: '#1f1f1f',
            backgroundCard: 'rgba(250, 204, 21, 0.07)',
            backgroundCardHover: 'rgba(250, 204, 21, 0.16)',
            text: '#ffffff',
            textSecondary: '#e6e6e6',
            textTertiary: '#b3b3b3',
            border: 'rgba(250, 204, 21, 0.3)',
            borderLight: 'rgba(250, 204, 21, 0.2)',
            borderDark: 'rgba(161, 98, 7, 0.5)',
            gradient: 'linear-gradient(135deg, #facc15, #ca8a04)',
            gradientAlt: 'linear-gradient(135deg, #fff, #f59e0b, #facc15)',
            gradientHover: 'linear-gradient(135deg, #fde68a, #facc15)',
            shadow: 'rgba(250, 204, 21, 0.3)',
            shadowLight: 'rgba(250, 204, 21, 0.2)',
            shadowDark: 'rgba(161, 98, 7, 0.5)',
            glow: 'rgba(250, 204, 21, 0.6)',
            overlay: 'rgba(250, 204, 21, 0.1)',
            blur: 'rgba(250, 204, 21, 0.08)',
            rgb: '250, 204, 21'
        },
        cinza: {
            name: 'Cinza',
            icon: '⚙️',
            primary: '#6b7280',
            primaryLight: '#d1d5db',
            primaryDark: '#4b5563',
            primaryLighter: '#f3f4f6',
            accent: '#9ca3af',
            accentDark: '#6b7280',
            background: '#121212',
            backgroundAlt: '#1f1f1f',
            backgroundCard: 'rgba(107, 114, 128, 0.1)',
            backgroundCardHover: 'rgba(107, 114, 128, 0.2)',
            text: '#f7f7f7',
            textSecondary: '#d1d5db',
            textTertiary: '#9ca3af',
            border: 'rgba(156, 163, 175, 0.4)',
            borderLight: 'rgba(156, 163, 175, 0.2)',
            borderDark: 'rgba(75, 85, 99, 0.6)',
            gradient: 'linear-gradient(135deg, #6b7280, #4b5563)',
            gradientAlt: 'linear-gradient(135deg, #fff, #9ca3af, #6b7280)',
            gradientHover: 'linear-gradient(135deg, #d1d5db, #6b7280)',
            shadow: 'rgba(107, 114, 128, 0.3)',
            shadowLight: 'rgba(107, 114, 128, 0.2)',
            shadowDark: 'rgba(75, 85, 99, 0.5)',
            glow: 'rgba(107, 114, 128, 0.5)',
            overlay: 'rgba(107, 114, 128, 0.1)',
            blur: 'rgba(107, 114, 128, 0.1)',
            rgb: '107, 114, 128'
        },
        branco: {
            name: 'Branco',
            icon: '⚪',
            primary: '#f9fafb',
            primaryLight: '#ffffff',
            primaryDark: '#d1d5db',
            primaryLighter: '#ffffff',
            accent: '#e5e7eb',
            accentDark: '#d1d5db',
            background: '#ffffff',
            backgroundAlt: '#f8fafc',
            backgroundCard: 'rgba(243, 244, 246, 0.9)',
            backgroundCardHover: 'rgba(243, 244, 246, 1)',
            text: '#111827',
            textSecondary: '#6b7280',
            textTertiary: '#9ca3af',
            border: 'rgba(209, 213, 219, 0.7)',
            borderLight: 'rgba(209, 213, 219, 0.4)',
            borderDark: 'rgba(107, 114, 128, 0.2)',
            gradient: 'linear-gradient(135deg, #ffffff, #d1d5db)',
            gradientAlt: 'linear-gradient(135deg, #ffffff, #f3f4f6, #d1d5db)',
            gradientHover: 'linear-gradient(135deg, #f8fafc, #e5e7eb)',
            shadow: 'rgba(107, 114, 128, 0.12)',
            shadowLight: 'rgba(107, 114, 128, 0.08)',
            shadowDark: 'rgba(107, 114, 128, 0.18)',
            glow: 'rgba(107, 114, 128, 0.2)',
            overlay: 'rgba(209, 213, 219, 0.2)',
            blur: 'rgba(209, 213, 219, 0.1)',
            rgb: '255, 255, 255'
        },
        dourado: {
            name: 'Dourado',
            icon: '✨',
            primary: '#f59e0b',
            primaryLight: '#fbbf24',
            primaryDark: '#b45309',
            primaryLighter: '#fdefe0',
            accent: '#facc15',
            accentDark: '#d97706',
            background: '#0f0f0f',
            backgroundAlt: '#1c1c1c',
            backgroundCard: 'rgba(245, 158, 11, 0.08)',
            backgroundCardHover: 'rgba(245, 158, 11, 0.18)',
            text: '#ffffff',
            textSecondary: '#f3f4f6',
            textTertiary: '#eab308',
            border: 'rgba(245, 158, 11, 0.35)',
            borderLight: 'rgba(245, 158, 11, 0.2)',
            borderDark: 'rgba(180, 83, 9, 0.5)',
            gradient: 'linear-gradient(135deg, #facc15, #b45309)',
            gradientAlt: 'linear-gradient(135deg, #fff, #f59e0b, #facc15)',
            gradientHover: 'linear-gradient(135deg, #fbbf24, #facc15)',
            shadow: 'rgba(245, 158, 11, 0.3)',
            shadowLight: 'rgba(245, 158, 11, 0.2)',
            shadowDark: 'rgba(180, 83, 9, 0.5)',
            glow: 'rgba(245, 158, 11, 0.6)',
            overlay: 'rgba(245, 158, 11, 0.1)',
            blur: 'rgba(245, 158, 11, 0.08)',
            rgb: '245, 158, 11'
        },
        prata: {
            name: 'Prata',
            icon: '🥈',
            primary: '#c0c0c0',
            primaryLight: '#e5e7eb',
            primaryDark: '#9ca3af',
            primaryLighter: '#f9fafb',
            accent: '#d1d5db',
            accentDark: '#a1a1aa',
            background: '#0c0c0c',
            backgroundAlt: '#161618',
            backgroundCard: 'rgba(192, 192, 192, 0.18)',
            backgroundCardHover: 'rgba(192, 192, 192, 0.26)',
            text: '#fbfbfb',
            textSecondary: '#d4d4d8',
            textTertiary: '#a3a3a3',
            border: 'rgba(192, 192, 192, 0.4)',
            borderLight: 'rgba(192, 192, 192, 0.2)',
            borderDark: 'rgba(107, 114, 128, 0.5)',
            gradient: 'linear-gradient(135deg, #c0c0c0, #9ca3af)',
            gradientAlt: 'linear-gradient(135deg, #fff, #d1d5db, #c0c0c0)',
            gradientHover: 'linear-gradient(135deg, #e5e7eb, #c0c0c0)',
            shadow: 'rgba(192, 192, 192, 0.35)',
            shadowLight: 'rgba(192, 192, 192, 0.2)',
            shadowDark: 'rgba(107, 114, 128, 0.55)',
            glow: 'rgba(192, 192, 192, 0.5)',
            overlay: 'rgba(192, 192, 192, 0.1)',
            blur: 'rgba(192, 192, 192, 0.08)',
            rgb: '192, 192, 192'
        },
        preto: {
            name: 'Preto',
            icon: '⚫',
            primary: '#000000',
            primaryLight: '#1f1f1f',
            primaryDark: '#000000',
            primaryLighter: '#2d2d2d',
            accent: '#4b5563',
            accentDark: '#111827',
            background: '#000000',
            backgroundAlt: '#050505',
            backgroundCard: 'rgba(255, 255, 255, 0.06)',
            backgroundCardHover: 'rgba(255, 255, 255, 0.12)',
            text: '#e5e7eb',
            textSecondary: '#9ca3af',
            textTertiary: '#6b7280',
            border: 'rgba(255, 255, 255, 0.15)',
            borderLight: 'rgba(255, 255, 255, 0.08)',
            borderDark: 'rgba(0, 0, 0, 0.8)',
            gradient: 'linear-gradient(135deg, #1f1f1f, #000000)',
            gradientAlt: 'linear-gradient(135deg, #2d2d2d, #111827, #000000)',
            gradientHover: 'linear-gradient(135deg, #3f3f3f, #1f1f1f)',
            shadow: 'rgba(0, 0, 0, 0.8)',
            shadowLight: 'rgba(0, 0, 0, 0.7)',
            shadowDark: 'rgba(0, 0, 0, 0.9)',
            glow: 'rgba(0, 0, 0, 0.4)',
            overlay: 'rgba(0, 0, 0, 0.45)',
            blur: 'rgba(0, 0, 0, 0.35)',
            rgb: '0, 0, 0'
        }
    };

    // Classe principal do Theme Manager
    class ThemeManager {
        constructor() {
            this.currentTheme = this.loadTheme();
            this.navbarLoaded = false;
            this.styleElement = null;
            this.dynamicStyleElement = null;
            this.init();
        }

        init() {
            this.injectGlobalStyles();
            this.applyTheme(this.currentTheme);
            this.waitForNavbar();
        }

        loadTheme() {
            const savedTheme = localStorage.getItem('selectedTheme');
            return savedTheme && themes[savedTheme] ? savedTheme : 'dark';
        }

        saveTheme(themeName) {
            localStorage.setItem('selectedTheme', themeName);
        }

        injectGlobalStyles() {
            if (document.getElementById('theme-manager-global-styles')) return;

            const style = document.createElement('style');
            style.id = 'theme-manager-global-styles';
            style.textContent = `
                /* Theme Manager - Global CSS Variables */
                :root {
                    --theme-primary: #8b5cf6;
                    --theme-primary-light: #c084fc;
                    --theme-primary-dark: #6d28d9;
                    --theme-primary-lighter: #ddd6fe;
                    --theme-accent: #f5a6d3;
                    --theme-accent-dark: #e879d9;
                    --theme-background: #121212;
                    --theme-background-alt: #1f1f1f;
                    --theme-background-card: rgba(139, 92, 246, 0.05);
                    --theme-background-card-hover: rgba(139, 92, 246, 0.15);
                    --theme-text: #ffffff;
                    --theme-text-secondary: #cccccc;
                    --theme-text-tertiary: #999999;
                    --theme-border: rgba(139, 92, 246, 0.3);
                    --theme-border-light: rgba(139, 92, 246, 0.2);
                    --theme-border-dark: rgba(139, 92, 246, 0.5);
                    --theme-gradient: linear-gradient(135deg, #8b5cf6, #6d28d9);
                    --theme-gradient-alt: linear-gradient(135deg, #fff, #f5a6d3, #8b5cf6);
                    --theme-gradient-hover: linear-gradient(135deg, #a78bfa, #8b5cf6);
                    --theme-shadow: rgba(139, 92, 246, 0.3);
                    --theme-shadow-light: rgba(139, 92, 246, 0.2);
                    --theme-shadow-dark: rgba(139, 92, 246, 0.5);
                    --theme-glow: rgba(139, 92, 246, 0.6);
                    --theme-overlay: rgba(139, 92, 246, 0.1);
                    --theme-blur: rgba(139, 92, 246, 0.08);
                    --theme-rgb: 139, 92, 246;
                }

                /* Body e Background */
                body {
                    background-color: var(--theme-background) !important;
                    color: var(--theme-text) !important;
                }

                /* Tema Claro - Ajustes especiais */
                body.theme-light {
                    background: var(--theme-background) !important;
                    color: var(--theme-text) !important;
                }

                body.theme-light::before {
                    background: rgba(255, 255, 255, 0.95) !important;
                }
            `;
            document.head.appendChild(style);
            this.styleElement = style;
        }

        injectDynamicStyles(theme) {
            // Remove estilo dinâmico anterior
            if (this.dynamicStyleElement) {
                this.dynamicStyleElement.remove();
            }

            const style = document.createElement('style');
            style.id = 'theme-dynamic-styles';
            style.textContent = this.generateDynamicCSS(theme);
            document.head.appendChild(style);
            this.dynamicStyleElement = style;
        }

        generateDynamicCSS(theme) {
            return `
                /* Dynamic Theme Styles - Auto-generated */
                
                /* Headers e Navigation */
                header,
                .navbar {
                    border-bottom-color: ${theme.border} !important;
                }

                header.scrolled {
                    border-bottom-color: ${theme.borderDark} !important;
                }

                .nav-link::before {
                    background: ${theme.gradient} !important;
                }

                .nav-link.active {
                    background: ${theme.overlay} !important;
                }

                .dropdown-menu {
                    border-color: ${theme.borderDark} !important;
                    border-top-color: ${theme.primary} !important;
                }

                .dropdown-item:hover {
                    background: ${theme.backgroundCardHover} !important;
                }

                /* Buttons */
                .cta-button.primary,
                .nav-buy-button,
                .submit-button,
                .reviews-button,
                .banner-button,
                .carousel-btn.primary,
                .load-more-news {
                    background: ${theme.gradient} !important;
                    border-color: ${theme.primary} !important;
                }

                .cta-button.primary:hover,
                .nav-buy-button:hover,
                .submit-button:hover {
                    box-shadow: 0 10px 30px ${theme.glow} !important;
                }

                .cta-button.secondary {
                    border-color: ${theme.border} !important;
                }

                .cta-button.secondary:hover {
                    border-color: ${theme.primary} !important;
                }

                /* Cards */
                .featured-card,
                .mode-card,
                .news-card,
                .game-card,
                .stat-card,
                .review-card,
                .franquia-card,
                .character-card,
                .mais-lidas-card,
                .mais-lidas-card-franquia,
                .source-card,
                .game-grid-card,
                .news-card-franquia,
                .jogo-card,
                .franquia-card {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.9)) !important;
                    border-color: ${theme.border} !important;
                }

                .featured-card:hover,
                .mode-card:hover,
                .news-card:hover,
                .game-card:hover,
                .stat-card:hover,
                .jogo-card:hover,
                .franquia-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 20px 60px ${theme.shadowDark} !important;
                }

                /* Badges */
                .game-badge,
                .news-badge,
                .carousel-badge,
                .hero-badge,
                .mais-lidas-badge,
                .mais-lidas-badge-franquia,
                .news-card-badge-franquia,
                .jogo-badge,
                .franquia-badge,
                .franquia-exemplo-hero-badge,
                .franquias-hero-badge {
                    background: ${theme.gradient} !important;
                    box-shadow: 0 5px 20px ${theme.glow} !important;
                }

                /* Text Highlights */
                .hero-main-title .highlight,
                .section-title,
                .reviews-title,
                .category-link.active,
                .tab-nav-button.active,
                .nav-link.active,
                .game-genre,
                .stat-hero-label,
                .stat-label,
                .news-source,
                .mais-lidas-date,
                .mais-lidas-date-franquia,
                .news-card-meta-franquia,
                .ranking-name,
                .franquia-exemplo-hero-title,
                .franquias-hero-title {
                    color: ${theme.primary} !important;
                }

                .hero-main-title .highlight {
                    background: ${theme.gradientAlt} !important;
                    -webkit-background-clip: text !important;
                    -webkit-text-fill-color: transparent !important;
                    background-clip: text !important;
                }

                /* Borders e Separadores */
                .section-title::after,
                .hero-decorator::before,
                .hero-decorator::after {
                    background: ${theme.gradient} !important;
                }

                /* Internal Navigation */
                .internal-nav {
                    background: rgba(0, 0, 0, 0.3) !important;
                    border-color: ${theme.border} !important;
                }

                .internal-nav-btn {
                    color: rgba(255, 255, 255, 0.7) !important;
                }

                .internal-nav-btn:hover {
                    background: ${theme.overlay} !important;
                }

                .internal-nav-btn.active {
                    background: ${theme.gradient} !important;
                    box-shadow: 0 4px 15px ${theme.shadowDark} !important;
                }

                /* Filters */
                .filters-bar {
                    background: linear-gradient(135deg, ${theme.blur}, rgba(109, 40, 217, 0.05)) !important;
                    border-color: ${theme.border} !important;
                    box-shadow: 0 8px 32px ${theme.shadowLight} !important;
                }

                .filter-btn {
                    border-color: ${theme.border} !important;
                }

                .filter-btn:hover {
                    border-color: ${theme.primary} !important;
                    background: ${theme.backgroundCardHover} !important;
                    box-shadow: 0 4px 20px ${theme.shadow} !important;
                }

                .filter-btn.active {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(109, 40, 217, 0.3)) !important;
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 6px 25px ${theme.shadowDark} !important;
                }

                /* Stats e Valores */
                .stat-value,
                .stat-hero-value,
                .hero-stat-value,
                .achievement-points,
                .score-circle,
                .stat-card-value,
                .ranking-rank {
                    color: ${theme.primary} !important;
                }

                .score-circle {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 0 30px ${theme.shadowDark} !important;
                }

                /* Progress Bars */
                .progress-bar-fill,
                .breakdown-fill,
                .visualizer-bar {
                    background: ${theme.gradient} !important;
                }

                /* Ranking */
                .ranking-table {
                    background: ${theme.backgroundCard} !important;
                    border-color: ${theme.border} !important;
                }

                .ranking-header {
                    background: ${theme.backgroundCardHover} !important;
                    border-bottom-color: ${theme.borderDark} !important;
                }

                .ranking-body {
                    background: ${theme.overlay} !important;
                }

                .ranking-row {
                    background: rgba(10, 10, 10, 0.8) !important;
                }

                .ranking-row:hover {
                    background: ${theme.backgroundCardHover} !important;
                }

                .ranking-row:hover .ranking-name {
                    color: ${theme.primary} !important;
                }

                /* Tabs */
                .tab-button,
                .tab-nav-button {
                    border-bottom-color: transparent !important;
                }

                .tab-button.active,
                .tab-nav-button.active {
                    color: ${theme.primary} !important;
                    border-bottom-color: ${theme.primary} !important;
                }

                /* Categories Navigation */
                .categories-nav {
                    background: rgba(10, 10, 10, 0.3) !important;
                    border-bottom-color: ${theme.borderLight} !important;
                }

                .categories-nav.scrolled {
                    background: rgba(10, 10, 10, 0.98) !important;
                    border-bottom-color: ${theme.borderDark} !important;
                }

                .category-link {
                    border-bottom-color: ${theme.borderDark} !important;
                }

                .category-link::before {
                    background: ${theme.gradient} !important;
                }

                .category-link:hover::before,
                .category-link.active::before {
                    width: 100% !important;
                }

                .category-link:hover,
                .category-link.active {
                    color: ${theme.primary} !important;
                }

                /* Carousel */
                .carousel-section {
                    background: #000 !important;
                }

                .progress-bar-item {
                    background: ${theme.backgroundCard} !important;
                }

                .progress-bar-item:hover {
                    background: ${theme.backgroundCardHover} !important;
                }

                .progress-bar-fill {
                    background: ${theme.gradient} !important;
                }

                /* Footer */
                footer {
                    border-top-color: ${theme.border} !important;
                }

                footer::after {
                    background: linear-gradient(to right, transparent, ${theme.primary}, transparent) !important;
                }

                .social-title::after {
                    background: ${theme.gradient} !important;
                    box-shadow: 0 0 10px ${theme.glow} !important;
                }

                .social-icon {
                    background: linear-gradient(135deg, ${theme.overlay}, rgba(0, 0, 0, 0.5)) !important;
                    border-color: ${theme.borderDark} !important;
                }

                .social-icon:hover {
                    border-color: ${theme.primary} !important;
                    color: ${theme.primary} !important;
                    box-shadow: 0 15px 35px ${theme.shadowDark} !important;
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.7)) !important;
                }

                .footer-link:hover {
                    color: ${theme.primary} !important;
                }

                /* Sidebar */
                .sidebar-menu {
                    border-left-color: ${theme.border} !important;
                }

                .sidebar-header {
                    border-bottom-color: ${theme.borderLight} !important;
                }

                .sidebar-login-icon {
                    background: ${theme.gradient} !important;
                }

                .sidebar-login-label {
                    color: ${theme.primary} !important;
                }

                .sidebar-close {
                    border-color: ${theme.borderDark} !important;
                }

                .sidebar-close:hover {
                    background: ${theme.backgroundCardHover} !important;
                    border-color: ${theme.primary} !important;
                }

                .sidebar-link {
                    background: rgba(30, 41, 59, 0.4) !important;
                }

                .sidebar-link:hover {
                    background: ${theme.backgroundCardHover} !important;
                }

                .sidebar-link.active {
                    background: linear-gradient(90deg, ${theme.backgroundCardHover}, ${theme.overlay}) !important;
                    border-left-color: ${theme.primary} !important;
                }

                .sidebar-link-icon {
                    color: ${theme.primary} !important;
                }

                .sidebar-sublink::before {
                    color: ${theme.primary} !important;
                }

                .sidebar-sublink:hover {
                    background: ${theme.overlay} !important;
                }

                .sidebar-divider {
                    background: linear-gradient(to right, transparent, ${theme.border}, transparent) !important;
                }

                .sidebar-social-icon {
                    background: ${theme.overlay} !important;
                    border-color: ${theme.border} !important;
                }

                .sidebar-social-icon:hover {
                    background: ${theme.backgroundCard} !important;
                    border-color: ${theme.primary} !important;
                }

                /* Language e Theme Selectors */
                .lang-btn,
                .theme-btn {
                    border-color: ${theme.borderDark} !important;
                }

                .lang-btn:hover,
                .theme-btn:hover {
                    border-color: ${theme.primary} !important;
                    background: ${theme.overlay} !important;
                }

                .lang-dropdown,
                .theme-dropdown {
                    border-color: ${theme.borderDark} !important;
                    border-top-color: ${theme.primary} !important;
                }

                .lang-option:hover,
                .theme-option:hover {
                    background: ${theme.backgroundCardHover} !important;
                }

                .lang-option.active,
                .theme-option.active {
                    color: ${theme.primary} !important;
                    background: ${theme.overlay} !important;
                }

                /* Scrollbar */
                ::-webkit-scrollbar-thumb {
                    background: ${theme.gradient} !important;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: ${theme.gradientHover} !important;
                }

                /* Specific Elements */
                .final-score-section {
                    background: ${theme.gradient} !important;
                }

                .platform-icon {
                    color: ${theme.primary} !important;
                }

                .achievement-icon {
                    color: ${theme.primary} !important;
                }

                /* Music Player */
                .music-player-section {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.7)) !important;
                    border-color: ${theme.borderDark} !important;
                }

                .control-button {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.5)) !important;
                    border-color: ${theme.borderDark} !important;
                }

                .control-button:hover {
                    background: ${theme.gradient} !important;
                    border-color: ${theme.primaryLight} !important;
                    box-shadow: 0 5px 25px ${theme.glow} !important;
                }

                .track-button {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.6)) !important;
                    border-color: ${theme.borderDark} !important;
                }

                .track-button:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 5px 20px ${theme.shadowDark} !important;
                }

                .track-button.active {
                    background: ${theme.gradient} !important;
                    border-color: ${theme.primaryLight} !important;
                    box-shadow: 0 5px 25px ${theme.glow} !important;
                }

                .music-subtitle {
                    color: ${theme.primary} !important;
                }

                /* Info Details */
                .info-details {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.8)) !important;
                    border-color: ${theme.borderDark} !important;
                    box-shadow: 0 10px 40px ${theme.shadow} !important;
                }

                .info-row {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.6)) !important;
                    border-left-color: ${theme.primary} !important;
                }

                .info-row:hover {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.7)) !important;
                    box-shadow: 0 5px 25px ${theme.shadowDark} !important;
                }

                .info-row-label {
                    color: ${theme.primaryLight} !important;
                }

                /* News Section */
                .news-section {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.8)) !important;
                    border-color: ${theme.borderDark} !important;
                    box-shadow: 0 10px 40px ${theme.shadow} !important;
                }

                .news-filter-btn {
                    background: ${theme.backgroundCardHover} !important;
                    border-color: ${theme.borderDark} !important;
                }

                .news-filter-btn:hover {
                    border-color: ${theme.primary} !important;
                    background: ${theme.backgroundCard} !important;
                }

                .news-filter-btn.active {
                    background: ${theme.gradient} !important;
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 4px 15px ${theme.shadowDark} !important;
                }

                .news-card {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.7)) !important;
                    border-color: ${theme.borderDark} !important;
                }

                .news-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 10px 35px ${theme.shadowDark} !important;
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8)) !important;
                }

                .news-source {
                    background: ${theme.borderDark} !important;
                    border-color: ${theme.primary} !important;
                }

                .news-date {
                    color: ${theme.primaryLight} !important;
                }

                .news-read-more {
                    color: ${theme.primary} !important;
                }

                .news-read-more:hover {
                    color: ${theme.primaryLight} !important;
                }

                /* Updates Hero */
                .updates-hero {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.9)) !important;
                    border-color: ${theme.borderDark} !important;
                }

                /* Official Links */
                .official-link-card {
                    background: ${theme.overlay} !important;
                    border-color: ${theme.borderDark} !important;
                }

                .official-link-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 10px 30px ${theme.shadowDark} !important;
                    background: ${theme.backgroundCardHover} !important;
                }

                .official-link-icon {
                    background: ${theme.gradient} !important;
                }

                .official-link-arrow {
                    color: ${theme.primary} !important;
                }

                /* Screenshots e Wallpapers */
                .screenshot-card,
                .wallpaper-card {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.7)) !important;
                    border-color: ${theme.borderDark} !important;
                }

                .screenshot-card:hover,
                .wallpaper-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 15px 40px ${theme.shadowDark} !important;
                }

                .wallpaper-info {
                    background: rgba(0, 0, 0, 0.8) !important;
                    border-color: ${theme.primary} !important;
                    color: ${theme.primary} !important;
                }

                /* Achievement Cards */
                .achievement-card {
                    background: linear-gradient(135deg, ${theme.overlay}, rgba(0, 0, 0, 0.5)) !important;
                    border-color: ${theme.border} !important;
                }

                .achievement-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 10px 30px ${theme.shadowDark} !important;
                }

                /* Game Cover Hero */
                .game-cover-hero {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.7)) !important;
                    border-color: ${theme.glow} !important;
                    box-shadow: 0 30px 80px ${theme.shadowDark} !important;
                }

                /* Detailed Stats */
                .detailed-stats {
                    background: ${theme.backgroundCard} !important;
                    border-color: ${theme.border} !important;
                }

                .stat-row {
                    background: rgba(0, 0, 0, 0.3) !important;
                    border-left-color: ${theme.primary} !important;
                }

                .stat-row:hover {
                    background: ${theme.backgroundCardHover} !important;
                }

                .stat-row-label {
                    color: ${theme.primary} !important;
                }

                /* Market Tables */
                .market-table {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8)) !important;
                    border-color: ${theme.border} !important;
                }

                .market-table thead {
                    background: ${theme.backgroundCardHover} !important;
                }

                .market-table tbody tr:hover {
                    background: ${theme.overlay} !important;
                }

                .market-badge {
                    background: ${theme.backgroundCardHover} !important;
                    border-color: ${theme.borderDark} !important;
                    color: ${theme.primaryLight} !important;
                }

                /* Timeline */
                .timeline::before {
                    background: linear-gradient(to bottom, ${theme.primary}, transparent) !important;
                }

                .timeline-year {
                    background: ${theme.gradient} !important;
                    border-color: #000 !important;
                }

                .timeline-content {
                    background: ${theme.backgroundCard} !important;
                    border-color: ${theme.border} !important;
                }

                .timeline-content h4 {
                    color: ${theme.primary} !important;
                }

                .highlight-badge {
                    background: ${theme.backgroundCardHover} !important;
                    border-color: ${theme.primary} !important;
                    color: ${theme.primary} !important;
                }

                /* Platform Cards */
                .platform-card:hover {
                    box-shadow: 0 15px 40px ${theme.shadow} !important;
                }

                /* Roster */
                .roster-title::before,
                .roster-title::after {
                    background: linear-gradient(to right, transparent, ${theme.primary}, transparent) !important;
                }

                .roster-decorator {
                    background: linear-gradient(to right, transparent, ${theme.border}, transparent) !important;
                }

                .roster-decorator::before,
                .roster-decorator::after {
                    background: ${theme.primary} !important;
                }

                .roster-character.active {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 0 30px ${theme.glow} !important;
                }

                .roster-character:hover .roster-name,
                .roster-character.active .roster-name {
                    color: ${theme.primary} !important;
                }

                /* Form Elements */
                .form-input:focus {
                    border-color: ${theme.primary} !important;
                    background: ${theme.overlay} !important;
                    box-shadow: 0 0 0 3px ${theme.shadowLight} !important;
                }

                .forgot-link {
                    color: ${theme.primary} !important;
                }

                .forgot-link:hover {
                    color: ${theme.primaryLight} !important;
                }

                .checkbox-input {
                    accent-color: ${theme.primary} !important;
                }

                /* Logo Icon */
                .logo-icon {
                    background: ${theme.gradient} !important;
                }

                /* Menu Icon */
                .menu-icon {
                    border-color: ${theme.borderDark} !important;
                }

                .menu-icon:hover {
                    border-color: ${theme.primary} !important;
                    background: ${theme.overlay} !important;
                }

                /* Error Message */
                .error-message {
                    background: rgba(239, 68, 68, 0.1) !important;
                    border-color: rgba(239, 68, 68, 0.3) !important;
                }

                /* Privacy Notice */
                .privacy-notice a {
                    color: ${theme.primary} !important;
                }

                /* Hero Stats */
                .hero-stat-value {
                    color: ${theme.primary} !important;
                }

                /* Jogo Stats */
                .jogo-stat-value,
                .franquia-stat-value {
                    color: #fff !important;
                }

                /* Character Image */
                .character-image {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.3)) !important;
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 0 50px ${theme.shadow} !important;
                }

                /* Stats List */
                .stat-row {
                    border-bottom-color: rgba(255, 255, 255, 0.1) !important;
                }

                .stat-label-small {
                    color: ${theme.primary} !important;
                }

                /* Move Cards */
                .move-card {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8)) !important;
                    border-color: ${theme.border} !important;
                }

                .move-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 10px 30px ${theme.shadow} !important;
                }

                .move-name {
                    color: ${theme.primary} !important;
                }

                .move-command {
                    background: ${theme.overlay} !important;
                    border-left-color: ${theme.primary} !important;
                }

                /* Gallery Items */
                .gallery-item {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.5)) !important;
                    border-color: ${theme.border} !important;
                }

                .gallery-item:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 10px 30px ${theme.shadow} !important;
                }

                /* Video Container */
                .video-container {
                    background: linear-gradient(135deg, ${theme.overlay}, rgba(0, 0, 0, 0.5)) !important;
                    border-color: ${theme.primary} !important;
                }

                /* Review Tab Buttons */
                .review-tab-button {
                    border-color: ${theme.border} !important;
                }

                .review-tab-button:hover {
                    border-color: ${theme.glow} !important;
                    background: ${theme.backgroundCard} !important;
                }

                .review-tab-button.active {
                    background: ${theme.backgroundCard} !important;
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 0 20px ${theme.shadow} inset !important;
                }

                .review-tab-button.active::before {
                    background: ${theme.gradient} !important;
                }

                /* Game Featured Cards */
                .game-card-featured {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8)) !important;
                    border-color: ${theme.border} !important;
                }

                .game-featured-badge {
                    background: ${theme.glow} !important;
                }

                .game-featured-title {
                    color: ${theme.accent} !important;
                }

                .game-featured-stat-label {
                    color: ${theme.primary} !important;
                }

                /* Dashboard Cards */
                .dashboard-card {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.9)) !important;
                    border-color: ${theme.borderDark} !important;
                }

                .dashboard-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 25px 60px ${theme.glow} !important;
                }

                .dashboard-card-icon {
                    background: ${theme.backgroundCard} !important;
                }

                /* Top Game Cards Xbox */
                .game-card-xbox,
                .top-game-card-xbox {
                    background: linear-gradient(135deg, rgba(20, 30, 48, 0.95), rgba(10, 15, 30, 0.98)) !important;
                    border-color: ${theme.border} !important;
                }

                .game-card-xbox:hover,
                .top-game-card-xbox:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 20px 60px ${theme.glow} !important;
                }

                .game-rank-badge {
                    background: ${theme.gradient} !important;
                    border-right-color: ${theme.borderDark} !important;
                }

                .game-position-label {
                    color: ${theme.primary} !important;
                }

                .game-stat-value {
                    color: ${theme.primary} !important;
                }

                .achievement-circle {
                    border-color: ${theme.primary} !important;
                    background: ${theme.overlay} !important;
                }

                .achievement-score {
                    color: ${theme.primary} !important;
                }

                .game-achievement-info {
                    border-left-color: ${theme.border} !important;
                }

                /* Stats Card Enhanced */
                .stat-card-enhanced {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.8)) !important;
                    border-color: ${theme.borderDark} !important;
                }

                .stat-card-enhanced:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 20px 50px ${theme.shadowDark} !important;
                }

                .stat-value-large {
                    color: ${theme.primary} !important;
                }

                /* Highlight Grid */
                .highlight-card {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.8)) !important;
                    border-color: ${theme.border} !important;
                }

                .highlight-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 20px 50px ${theme.shadowDark} !important;
                }

                /* Top Game Circles */
                .top-game-circle-progress {
                    border-color: ${theme.border} !important;
                    background: ${theme.overlay} !important;
                }

                /* Section Titles Accent */
                .section-subtitle,
                .stats-section-title,
                .ranking-title,
                .mais-lidas-title-franquia {
                    color: ${theme.primary} !important;
                }

                /* Review Hero Achievement */
                .review-hero-achievement {
                    background: ${theme.backgroundCardHover} !important;
                    border-color: ${theme.border} !important;
                }

                /* Review Hero Image */
                .review-hero-image {
                    background: linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.6)) !important;
                    border-color: ${theme.borderDark} !important;
                    box-shadow: 0 20px 60px ${theme.shadowDark} !important;
                }

                /* Review CTA */
                .review-cta-button {
                    background: linear-gradient(135deg, #d4769b, #c0578d) !important;
                    box-shadow: 0 8px 20px ${theme.shadow} !important;
                }

                .review-cta-button:hover {
                    box-shadow: 0 12px 30px ${theme.shadowDark} !important;
                }

                /* Review Hero CTA */
                .review-hero-cta {
                    background: ${theme.backgroundCardHover} !important;
                    border-color: ${theme.border} !important;
                }

                /* Activity Bars */
                .activity-bar {
                    background: ${theme.gradient} !important;
                }

                .activity-bar:hover {
                    background: ${theme.gradientHover} !important;
                }

                /* Milestone Icons */
                .milestone-icon {
                    background: ${theme.backgroundCardHover} !important;
                    color: ${theme.primary} !important;
                }

                .milestone-item.achieved .milestone-icon {
                    background: rgba(16, 185, 129, 0.2) !important;
                    color: #10b981 !important;
                }

                .milestone-progress {
                    background: ${theme.backgroundCardHover} !important;
                }

                .milestone-progress-fill {
                    background: ${theme.gradient} !important;
                }

                /* Fame Cards */
                .fame-card {
                    background: ${theme.overlay} !important;
                    border-color: ${theme.border} !important;
                }

                .fame-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 10px 30px ${theme.shadowDark} !important;
                }

                .fame-card h4 {
                    color: ${theme.primary} !important;
                }

                /* Game List Items */
                .game-list-item {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8)) !important;
                    border-color: ${theme.border} !important;
                }

                .game-list-item:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 10px 30px ${theme.shadow} !important;
                }

                .game-list-title {
                    color: ${theme.accent} !important;
                }

                .game-list-rank {
                    color: ${theme.primary} !important;
                }

                .game-info-label {
                    color: ${theme.primary} !important;
                }

                .game-stat-circle {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.7)) !important;
                    border-color: ${theme.primary} !important;
                }

                .game-stat-value,
                .game-stat-unit {
                    color: ${theme.primary} !important;
                }

                /* Timeline Year Cards */
                .timeline-year-card {
                    background: linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8)) !important;
                    border-color: ${theme.border} !important;
                }

                .timeline-year-card:hover {
                    border-color: ${theme.primary} !important;
                    box-shadow: 0 15px 50px ${theme.shadowDark} !important;
                }

                .timeline-year-number {
                    background: ${theme.gradient} !important;
                    border-color: ${theme.border} !important;
                    box-shadow: 0 10px 30px ${theme.shadowDark} !important;
                }

                .timeline-year-label {
                    color: ${theme.primary} !important;
                }

                .timeline-year-title {
                    color: ${theme.accent} !important;
                }

                .timeline-stat-badge {
                    background: ${theme.backgroundCardHover} !important;
                    border-color: ${theme.primary} !important;
                    color: ${theme.primary} !important;
                }
            `;
        }

        waitForNavbar() {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkNavbar = setInterval(() => {
                attempts++;
                const themeDropdown = document.getElementById('themeDropdown');
                
                if (themeDropdown || attempts >= maxAttempts) {
                    clearInterval(checkNavbar);
                    
                    if (themeDropdown) {
                        this.updateThemeDropdown();
                        this.setupEventListeners();
                        this.navbarLoaded = true;
                        console.log('%c✅ Theme Manager conectado à navbar', 'color: #10b981; font-weight: bold;');
                    }
                }
            }, 100);
        }

        updateThemeDropdown() {
            const themeDropdown = document.getElementById('themeDropdown');
            if (!themeDropdown) return;

            const dropdownHTML = Object.keys(themes).map(themeKey => {
                const theme = themes[themeKey];
                const isActive = themeKey === this.currentTheme;
                return `<div class="theme-option ${isActive ? 'active' : ''}" data-theme="${themeKey}">${theme.icon} ${theme.name}</div>`;
            }).join('');

            themeDropdown.innerHTML = dropdownHTML;
        }

        applyTheme(themeName) {
            if (!themes[themeName]) {
                console.error(`Theme "${themeName}" not found`);
                return;
            }

            const theme = themes[themeName];
            const root = document.documentElement;

            // Aplicar todas as variáveis CSS
            Object.keys(theme).forEach(key => {
                if (key !== 'name' && key !== 'icon') {
                    const cssVarName = '--theme-' + key.replace(/([A-Z])/g, '-$1').toLowerCase();
                    root.style.setProperty(cssVarName, theme[key]);
                }
            });

            // Injetar estilos dinâmicos
            this.injectDynamicStyles(theme);

            // Adicionar classe ao body
            document.body.className = document.body.className.replace(/theme-\w+/g, '');
            document.body.classList.add(`theme-${themeName}`);

            // Atualizar ícone do botão
            this.updateThemeButton(themeName);

            // Atualizar opções ativas
            this.updateThemeOptions(themeName);

            // Disparar evento personalizado
            window.dispatchEvent(new CustomEvent('themeChanged', { 
                detail: { themeName, theme } 
            }));

            this.currentTheme = themeName;
            this.saveTheme(themeName);

            console.log(`%c🎨 Tema Aplicado: ${theme.name}`, `color: ${theme.primary}; font-size: 14px; font-weight: bold;`);
        }

        updateThemeButton(themeName) {
            const themeBtn = document.getElementById('themeBtn');
            if (themeBtn && themes[themeName]) {
                themeBtn.textContent = themes[themeName].icon;
            }
        }

        updateThemeOptions(themeName) {
            const themeOptions = document.querySelectorAll('.theme-option');
            themeOptions.forEach(option => {
                const optionTheme = option.getAttribute('data-theme');
                if (optionTheme === themeName) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }

        setupEventListeners() {
            const themeOptions = document.querySelectorAll('.theme-option');
            
            themeOptions.forEach(option => {
                const newOption = option.cloneNode(true);
                option.parentNode.replaceChild(newOption, option);
                
                newOption.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const themeName = newOption.getAttribute('data-theme');
                    
                    if (themes[themeName]) {
                        this.applyTheme(themeName);
                        
                        const themeDropdown = document.getElementById('themeDropdown');
                        if (themeDropdown) {
                            themeDropdown.classList.remove('active');
                        }

                        newOption.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            newOption.style.transform = 'scale(1)';
                        }, 150);
                    }
                });
            });
        }

        getAvailableThemes() {
            return Object.keys(themes).map(key => ({
                id: key,
                name: themes[key].name,
                icon: themes[key].icon,
                colors: themes[key]
            }));
        }

        getCurrentTheme() {
            return {
                id: this.currentTheme,
                ...themes[this.currentTheme]
            };
        }
    }

    // Inicializar quando o DOM estiver pronto
    function initThemeManager() {
        window.themeManager = new ThemeManager();
        window.ThemeManager = ThemeManager;
        window.availableThemes = themes;
        
        console.log('%c🎨 Theme Manager System Loaded', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');
        console.log('%c✅ 14 temas disponíveis: Dark, Light, Blue, Green, Red, Orange, Pink, Cyan, Amarelo, Cinza, Branco, Dourado, Prata, Preto', 'color: #10b981; font-size: 12px;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeManager);
    } else {
        initThemeManager();
    }

})();