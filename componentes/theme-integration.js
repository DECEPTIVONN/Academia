// Theme Integration System - Auto-apply to all pages - COMPLETE VERSION
(function() {
    'use strict';

    // Lista expandida de seletores CSS que devem ser atualizados com as cores do tema
    const themeTargets = {
        // Backgrounds
        backgrounds: [
            'body',
            '.hero-section',
            '.content-section',
            '.reviews-hero',
            '.news-section',
            '.game-modes-section',
            '.featured-characters-section',
            '.carousel-section',
            '.mais-lidas-section',
            '.news-grid-section',
            '.franquia-exemplo-hero',
            '.franquia-exemplo-content',
            '.franquias-hero',
            '.franquias-content',
            '.review-hero-section',
            '.review-content-section'
        ],
        
        // Borders - EXPANDIDO
        borders: [
            'header',
            'nav',
            '.featured-card',
            '.mode-card',
            '.news-card',
            '.game-card',
            '.stat-card',
            '.review-card',
            '.franquia-card',
            '.character-card',
            '.mais-lidas-card',
            '.mais-lidas-card-franquia',
            '.news-card-franquia',
            '.source-card',
            '.game-cover-hero',
            '.stat-hero-card',
            '.achievement-card',
            '.screenshot-card',
            '.wallpaper-card',
            '.music-player-section',
            '.control-button',
            '.track-button',
            '.game-grid-card',
            '.official-link-card',
            '.internal-nav',
            '.detailed-stats',
            '.info-details',
            '.updates-hero',
            '.news-filter-btn',
            '.load-more-news',
            '.wallpaper-info',
            '.news-source',
            '.game-badge',
            '.stat-row',
            '.info-row',
            '.jogo-card',
            '.character-image',
            '.move-card',
            '.gallery-item',
            '.video-container',
            '.game-card-featured',
            '.dashboard-card',
            '.game-card-xbox',
            '.top-game-card-xbox',
            '.stat-card-enhanced',
            '.highlight-card',
            '.game-list-item',
            '.timeline-year-card',
            '.ranking-table',
            '.filter-btn',
            '.tab-button',
            '.review-tab-button'
        ],
        
        // Buttons
        buttons: [
            '.cta-button.primary',
            '.nav-buy-button',
            '.submit-button',
            '.reviews-button',
            '.card-button',
            '.banner-button',
            '.carousel-btn.primary',
            '.game-badge',
            '.internal-nav-btn.active',
            '.news-filter-btn.active',
            '.load-more-news',
            '.final-score-section',
            '.review-cta-button',
            '.control-button:hover',
            '.track-button.active'
        ],
        
        // Text highlights - EXPANDIDO
        textHighlights: [
            '.hero-main-title .highlight',
            '.section-title',
            '.reviews-title',
            '.category-link.active',
            '.tab-nav-button.active',
            '.nav-link.active',
            '.game-genre',
            '.stat-hero-label',
            '.stat-label',
            '.news-source',
            '.official-link-title',
            '.info-row-label',
            '.stat-row-label',
            '.news-read-more',
            '.achievement-points',
            '.news-date',
            '.mais-lidas-date',
            '.mais-lidas-date-franquia',
            '.info-details-title',
            '.games-grid-title',
            '.games-grid-subtitle',
            '.game-grid-label',
            '.news-title',
            '.music-subtitle',
            '.updates-hero-title',
            '.official-link-arrow',
            '.ranking-name:hover',
            '.move-name',
            '.game-featured-stat-label',
            '.game-featured-title',
            '.game-position-label',
            '.game-stat-value',
            '.timeline-year-label',
            '.timeline-year-title',
            '.game-list-title',
            '.game-list-rank',
            '.game-info-label',
            '.stat-value',
            '.stat-hero-value',
            '.hero-stat-value',
            '.stat-card-value',
            '.stat-value-large',
            '.ranking-rank',
            '.game-stat-circle',
            '.achievement-score'
        ],
        
        // Special elements
        special: [
            '.score-circle',
            '.stat-value',
            '.achievement-icon',
            '.platform-icon',
            '.game-badge',
            '.news-badge',
            '.visualizer-bar',
            '.official-link-icon',
            '.game-grid-label',
            '.logo-icon',
            '.sidebar-login-icon',
            '.sidebar-link-icon',
            '.game-rank-badge',
            '.achievement-circle',
            '.timeline-year-number',
            '.game-stat-circle'
        ]
    };

    // Função para aplicar tema em elementos específicos
    function applyThemeToElements() {
        if (!window.themeManager) {
            console.warn('Theme Manager not loaded yet');
            return;
        }

        const currentTheme = window.themeManager.getCurrentTheme();
        
        // Aplicar backgrounds
        themeTargets.backgrounds.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.style.background && !el.style.background.includes('url') && !el.style.background.includes('video')) {
                    const currentBg = el.style.background;
                    // Substituir apenas se contiver cores roxas
                    if (currentBg.includes('139, 92, 246') || currentBg.includes('#8b5cf6') || 
                        currentBg.includes('#c084fc') || currentBg.includes('#6d28d9')) {
                        el.style.background = currentBg
                            .replace(/rgba?\(139,\s*92,\s*246[^)]*\)/gi, currentTheme.border)
                            .replace(/#8b5cf6/gi, currentTheme.primary)
                            .replace(/#c084fc/gi, currentTheme.primaryLight)
                            .replace(/#6d28d9/gi, currentTheme.primaryDark);
                    }
                }
            });
        });

        // Aplicar borders
        themeTargets.borders.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.style.borderColor) {
                    const currentBorder = el.style.borderColor;
                    if (currentBorder.includes('139, 92, 246') || currentBorder.includes('#8b5cf6') ||
                        currentBorder.includes('#c084fc') || currentBorder.includes('#6d28d9')) {
                        el.style.borderColor = currentTheme.border;
                    }
                }
                // Aplicar border-left, border-top, etc
                ['borderLeftColor', 'borderRightColor', 'borderTopColor', 'borderBottomColor'].forEach(prop => {
                    if (el.style[prop]) {
                        const currentBorder = el.style[prop];
                        if (currentBorder.includes('139, 92, 246') || currentBorder.includes('#8b5cf6') ||
                            currentBorder.includes('#c084fc') || currentBorder.includes('#6d28d9')) {
                            el.style[prop] = currentTheme.primary;
                        }
                    }
                });
            });
        });

        // Aplicar buttons
        themeTargets.buttons.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (el.style.background) {
                    const currentBg = el.style.background;
                    if (currentBg.includes('139, 92, 246') || currentBg.includes('#8b5cf6') ||
                        currentBg.includes('#c084fc') || currentBg.includes('#6d28d9')) {
                        el.style.background = currentTheme.gradient;
                        el.style.borderColor = currentTheme.primary;
                    }
                }
            });
        });

        // Aplicar text highlights
        themeTargets.textHighlights.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                const currentColor = el.style.color;
                if (currentColor && (currentColor.includes('139, 92, 246') || currentColor.includes('#8b5cf6') ||
                    currentColor.includes('#c084fc') || currentColor.includes('#6d28d9') || 
                    currentColor.includes('#f5a6d3'))) {
                    el.style.color = currentTheme.primary;
                }
                
                if (el.classList.contains('highlight') || selector.includes('highlight')) {
                    el.style.background = currentTheme.gradientAlt;
                    el.style.webkitBackgroundClip = 'text';
                    el.style.webkitTextFillColor = 'transparent';
                    el.style.backgroundClip = 'text';
                }
            });
        });

        // Aplicar special elements
        themeTargets.special.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                const currentColor = el.style.color;
                if (currentColor && (currentColor.includes('139, 92, 246') || currentColor.includes('#8b5cf6') ||
                    currentColor.includes('#c084fc') || currentColor.includes('#6d28d9'))) {
                    el.style.color = currentTheme.primary;
                }
                
                const currentBorder = el.style.borderColor;
                if (currentBorder && (currentBorder.includes('139, 92, 246') || currentBorder.includes('#8b5cf6') ||
                    currentBorder.includes('#c084fc') || currentBorder.includes('#6d28d9'))) {
                    el.style.borderColor = currentTheme.primary;
                }

                const currentBg = el.style.background;
                if (currentBg && (currentBg.includes('139, 92, 246') || currentBg.includes('#8b5cf6') ||
                    currentBg.includes('#c084fc') || currentBg.includes('#6d28d9'))) {
                    if (selector === '.visualizer-bar') {
                        el.style.background = currentTheme.gradient;
                    } else if (selector === '.official-link-icon' || selector === '.logo-icon' || 
                               selector === '.sidebar-login-icon' || selector === '.game-rank-badge' ||
                               selector === '.timeline-year-number') {
                        el.style.background = currentTheme.gradient;
                    }
                }

                // Box-shadow
                const currentShadow = el.style.boxShadow;
                if (currentShadow && (currentShadow.includes('139, 92, 246') || currentShadow.includes('#8b5cf6'))) {
                    el.style.boxShadow = currentShadow
                        .replace(/rgba?\(139,\s*92,\s*246[^)]*\)/gi, currentTheme.glow)
                        .replace(/#8b5cf6/gi, currentTheme.primary);
                }
            });
        });

        // Aplicações específicas adicionais
        applySpecificThemeElements(currentTheme);
    }

    // Função para aplicar temas em elementos específicos
    function applySpecificThemeElements(theme) {
        // Internal Nav Buttons
        document.querySelectorAll('.internal-nav-btn').forEach(btn => {
            if (btn.classList.contains('active')) {
                btn.style.background = theme.gradient;
                btn.style.color = '#fff';
                btn.style.boxShadow = `0 4px 15px ${theme.shadowLight}`;
            } else {
                btn.style.background = 'transparent';
                btn.style.color = 'rgba(255, 255, 255, 0.7)';
            }
        });

        // News Filter Buttons
        document.querySelectorAll('.news-filter-btn, .filter-btn').forEach(btn => {
            btn.style.borderColor = theme.border;
            btn.style.background = theme.backgroundCardHover;
            if (btn.classList.contains('active')) {
                btn.style.background = theme.gradient;
                btn.style.borderColor = theme.primary;
                btn.style.boxShadow = `0 4px 15px ${theme.shadowDark}`;
                btn.style.color = '#fff';
            }
        });

        // Track Buttons
        document.querySelectorAll('.track-button').forEach(btn => {
            btn.style.borderColor = theme.border;
            btn.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.6))`;
            if (btn.classList.contains('active')) {
                btn.style.background = theme.gradient;
                btn.style.borderColor = theme.primaryLight;
                btn.style.boxShadow = `0 5px 25px ${theme.glow}`;
            }
        });

        // Control Buttons
        document.querySelectorAll('.control-button').forEach(btn => {
            btn.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.5))`;
            btn.style.borderColor = theme.border;
        });

        // Stat Cards e Stat Hero Cards
        document.querySelectorAll('.stat-card, .stat-hero-card, .stat-card-enhanced').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.5))`;
            card.style.borderColor = theme.border;
        });

        // Achievement Cards
        document.querySelectorAll('.achievement-card').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.5))`;
            card.style.borderColor = theme.border;
        });

        // Game Grid Cards
        document.querySelectorAll('.game-grid-card, .game-card, .jogo-card, .franquia-card').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.9))`;
            card.style.borderColor = theme.border;
        });

        // News Cards
        document.querySelectorAll('.news-card, .news-card-franquia, .mais-lidas-card, .mais-lidas-card-franquia').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.7))`;
            card.style.borderColor = theme.border;
        });

        // Official Link Cards
        document.querySelectorAll('.official-link-card').forEach(card => {
            card.style.background = theme.backgroundCard;
            card.style.borderColor = theme.border;
        });

        // Screenshot e Wallpaper Cards
        document.querySelectorAll('.screenshot-card, .wallpaper-card').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.7))`;
            card.style.borderColor = theme.border;
        });

        // Detailed Stats
        document.querySelectorAll('.detailed-stats').forEach(el => {
            el.style.background = theme.backgroundCard;
            el.style.borderColor = theme.border;
        });

        // Info Details
        document.querySelectorAll('.info-details').forEach(el => {
            el.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8))`;
            el.style.borderColor = theme.border;
            el.style.boxShadow = `0 10px 40px ${theme.shadow}`;
        });

        // News Section
        document.querySelectorAll('.news-section').forEach(el => {
            el.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8))`;
            el.style.borderColor = theme.border;
            el.style.boxShadow = `0 10px 40px ${theme.shadow}`;
        });

        // Updates Hero
        document.querySelectorAll('.updates-hero').forEach(el => {
            el.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.9))`;
            el.style.borderColor = theme.border;
        });

        // Music Player Section
        document.querySelectorAll('.music-player-section').forEach(el => {
            el.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.7))`;
            el.style.borderColor = theme.border;
        });

        // Internal Nav
        document.querySelectorAll('.internal-nav').forEach(el => {
            el.style.background = 'rgba(0, 0, 0, 0.3)';
            el.style.borderColor = theme.border;
        });

        // Stat Rows e Info Rows
        document.querySelectorAll('.stat-row, .info-row').forEach(row => {
            row.style.borderLeftColor = theme.primary;
            row.style.background = `linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.6))`;
        });

        // News Source
        document.querySelectorAll('.news-source').forEach(el => {
            el.style.background = theme.border;
            el.style.borderColor = theme.primary;
            el.style.color = '#fff';
        });

        // Wallpaper Info
        document.querySelectorAll('.wallpaper-info').forEach(el => {
            el.style.background = 'rgba(0, 0, 0, 0.8)';
            el.style.borderColor = theme.primary;
            el.style.color = theme.primary;
        });

        // Game Badge, News Badge, etc
        document.querySelectorAll('.game-badge, .news-badge, .carousel-badge, .hero-badge, .mais-lidas-badge, .mais-lidas-badge-franquia, .news-card-badge-franquia, .jogo-badge, .franquia-badge').forEach(el => {
            el.style.background = theme.gradient;
            el.style.boxShadow = `0 5px 20px ${theme.glow}`;
        });

        // Load More Button
        document.querySelectorAll('.load-more-news').forEach(btn => {
            btn.style.background = theme.gradient;
            btn.style.borderColor = theme.primary;
        });

        // Final Score Section
        document.querySelectorAll('.final-score-section').forEach(el => {
            el.style.background = theme.gradient;
        });

        // Visualizer Bars
        document.querySelectorAll('.visualizer-bar').forEach(bar => {
            bar.style.background = `linear-gradient(to top, ${theme.primary}, ${theme.primaryLight})`;
        });

        // Official Link Icons
        document.querySelectorAll('.official-link-icon').forEach(icon => {
            icon.style.background = theme.gradient;
        });

        // Game Cover Hero
        document.querySelectorAll('.game-cover-hero').forEach(el => {
            el.style.borderColor = theme.border;
            el.style.boxShadow = `0 30px 80px ${theme.shadowDark}`;
        });

        // Character Image
        document.querySelectorAll('.character-image').forEach(el => {
            el.style.borderColor = theme.primary;
            el.style.boxShadow = `0 0 50px ${theme.shadow}`;
        });

        // Move Cards
        document.querySelectorAll('.move-card').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8))`;
            card.style.borderColor = theme.border;
        });

        // Move Command
        document.querySelectorAll('.move-command').forEach(el => {
            el.style.background = theme.overlay;
            el.style.borderLeftColor = theme.primary;
        });

        // Gallery Items
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.5))`;
            item.style.borderColor = theme.border;
        });

        // Video Container
        document.querySelectorAll('.video-container').forEach(container => {
            container.style.borderColor = theme.primary;
        });

        // Dashboard Cards
        document.querySelectorAll('.dashboard-card').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.9))`;
            card.style.borderColor = theme.borderDark;
        });

        // Game Card Xbox
        document.querySelectorAll('.game-card-xbox, .top-game-card-xbox').forEach(card => {
            card.style.borderColor = theme.border;
        });

        // Game Rank Badge
        document.querySelectorAll('.game-rank-badge').forEach(badge => {
            badge.style.background = theme.gradient;
            badge.style.borderRightColor = theme.borderDark;
        });

        // Achievement Circle
        document.querySelectorAll('.achievement-circle, .top-game-circle-progress').forEach(circle => {
            circle.style.borderColor = theme.primary;
            circle.style.background = theme.overlay;
        });

        // Game List Items
        document.querySelectorAll('.game-list-item').forEach(item => {
            item.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8))`;
            item.style.borderColor = theme.border;
        });

        // Game Stat Circle
        document.querySelectorAll('.game-stat-circle').forEach(circle => {
            circle.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.7))`;
            circle.style.borderColor = theme.primary;
        });

        // Timeline Year Cards
        document.querySelectorAll('.timeline-year-card').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8))`;
            card.style.borderColor = theme.border;
        });

        // Timeline Year Number
        document.querySelectorAll('.timeline-year-number').forEach(num => {
            num.style.background = theme.gradient;
            num.style.borderColor = theme.border;
            num.style.boxShadow = `0 10px 30px ${theme.shadowDark}`;
        });

        // Timeline Stat Badge
        document.querySelectorAll('.timeline-stat-badge, .highlight-badge').forEach(badge => {
            badge.style.background = theme.backgroundCardHover;
            badge.style.borderColor = theme.primary;
            badge.style.color = theme.primary;
        });

        // Ranking Table
        document.querySelectorAll('.ranking-table').forEach(table => {
            table.style.background = theme.backgroundCard;
            table.style.borderColor = theme.border;
        });

        // Ranking Header
        document.querySelectorAll('.ranking-header').forEach(header => {
            header.style.background = theme.backgroundCardHover;
            header.style.borderBottomColor = theme.borderDark;
        });

        // Ranking Body
        document.querySelectorAll('.ranking-body').forEach(body => {
            body.style.background = theme.overlay;
        });

        // Ranking Row
        document.querySelectorAll('.ranking-row').forEach(row => {
            row.style.background = 'rgba(10, 10, 10, 0.8)';
        });

        // Tabs
        document.querySelectorAll('.tab-button, .tab-nav-button, .review-tab-button').forEach(tab => {
            if (tab.classList.contains('active')) {
                tab.style.color = theme.primary;
                tab.style.borderBottomColor = theme.primary;
                if (tab.classList.contains('review-tab-button')) {
                    tab.style.background = theme.backgroundCard;
                    tab.style.borderColor = theme.primary;
                }
            }
        });

        // Categories Nav
        document.querySelectorAll('.categories-nav').forEach(nav => {
            nav.style.background = 'rgba(10, 10, 10, 0.3)';
            nav.style.borderBottomColor = theme.borderLight;
        });

        // Category Links
        document.querySelectorAll('.category-link').forEach(link => {
            link.style.borderBottomColor = theme.borderDark;
            if (link.classList.contains('active')) {
                link.style.color = theme.primary;
            }
        });

        // Progress Bars
        document.querySelectorAll('.progress-bar-fill, .breakdown-fill, .milestone-progress-fill').forEach(bar => {
            bar.style.background = theme.gradient;
        });

        // Progress Bar Items
        document.querySelectorAll('.progress-bar-item').forEach(item => {
            item.style.background = theme.backgroundCard;
        });

        // Social Icons
        document.querySelectorAll('.social-icon').forEach(icon => {
            icon.style.background = `linear-gradient(135deg, ${theme.overlay}, rgba(0, 0, 0, 0.5))`;
            icon.style.borderColor = theme.borderDark;
        });

        // Sidebar Links
        document.querySelectorAll('.sidebar-link').forEach(link => {
            if (link.classList.contains('active')) {
                link.style.background = `linear-gradient(90deg, ${theme.backgroundCardHover}, ${theme.overlay})`;
                link.style.borderLeftColor = theme.primary;
            }
        });

        // Logo Icon
        document.querySelectorAll('.logo-icon').forEach(icon => {
            icon.style.background = theme.gradient;
        });

        // Sidebar Login Icon
        document.querySelectorAll('.sidebar-login-icon').forEach(icon => {
            icon.style.background = theme.gradient;
        });

        // Review Hero Achievement
        document.querySelectorAll('.review-hero-achievement').forEach(el => {
            el.style.background = theme.backgroundCardHover;
            el.style.borderColor = theme.border;
        });

        // Review Hero Image
        document.querySelectorAll('.review-hero-image').forEach(img => {
            img.style.background = `linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.6))`;
            img.style.borderColor = theme.borderDark;
            img.style.boxShadow = `0 20px 60px ${theme.shadowDark}`;
        });

        // Filters Bar
        document.querySelectorAll('.filters-bar').forEach(bar => {
            bar.style.background = `linear-gradient(135deg, ${theme.blur}, rgba(109, 40, 217, 0.05))`;
            bar.style.borderColor = theme.border;
            bar.style.boxShadow = `0 8px 32px ${theme.shadowLight}`;
        });

        // Highlight Cards
        document.querySelectorAll('.highlight-card').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCardHover}, rgba(0, 0, 0, 0.8))`;
            card.style.borderColor = theme.border;
        });

        // Game Featured Cards
        document.querySelectorAll('.game-card-featured').forEach(card => {
            card.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8))`;
            card.style.borderColor = theme.border;
        });

        // Milestone Icons
        document.querySelectorAll('.milestone-icon').forEach(icon => {
            icon.style.background = theme.backgroundCardHover;
            icon.style.color = theme.primary;
        });

        // Fame Cards
        document.querySelectorAll('.fame-card').forEach(card => {
            card.style.background = theme.overlay;
            card.style.borderColor = theme.border;
        });

        // Activity Bars
        document.querySelectorAll('.activity-bar').forEach(bar => {
            bar.style.background = theme.gradient;
        });

        // Form Inputs em foco
        document.querySelectorAll('.form-input').forEach(input => {
            input.addEventListener('focus', function() {
                this.style.borderColor = theme.primary;
                this.style.background = theme.overlay;
                this.style.boxShadow = `0 0 0 3px ${theme.shadowLight}`;
            });
            input.addEventListener('blur', function() {
                if (!this.value) {
                    this.style.borderColor = theme.border;
                    this.style.background = 'rgba(255, 255, 255, 0.05)';
                    this.style.boxShadow = 'none';
                }
            });
        });

        // Scrollbar personalizada
        const scrollbarStyle = document.getElementById('theme-scrollbar-style');
        if (scrollbarStyle) {
            scrollbarStyle.remove();
        }
        
        const newScrollbarStyle = document.createElement('style');
        newScrollbarStyle.id = 'theme-scrollbar-style';
        newScrollbarStyle.textContent = `
            ::-webkit-scrollbar-thumb {
                background: ${theme.gradient} !important;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: ${theme.gradientHover} !important;
            }
        `;
        document.head.appendChild(newScrollbarStyle);
    }

    // Observer para novos elementos adicionados dinamicamente
    const observerConfig = { childList: true, subtree: true };
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Verificar se é um elemento relevante
                        const isRelevant = themeTargets.borders.some(selector => {
                            try {
                                return node.matches && node.matches(selector);
                            } catch (e) {
                                return false;
                            }
                        }) || themeTargets.textHighlights.some(selector => {
                            try {
                                return node.matches && node.matches(selector);
                            } catch (e) {
                                return false;
                            }
                        });
                        
                        if (isRelevant) {
                            shouldUpdate = true;
                        }
                    }
                });
            }
        });

        if (shouldUpdate) {
            setTimeout(applyThemeToElements, 100);
        }
    });

    // Função para adicionar novos targets dinamicamente
    function addThemeTarget(category, selector) {
        if (themeTargets[category]) {
            if (!themeTargets[category].includes(selector)) {
                themeTargets[category].push(selector);
                console.log(`%c✅ Novo target adicionado: ${category} -> ${selector}`, 'color: #10b981; font-size: 11px;');
            }
        } else {
            console.warn(`Categoria "${category}" não existe. Categorias disponíveis:`, Object.keys(themeTargets));
        }
    }

    // Função para aplicar tema a um elemento específico
    function applyThemeToElement(element, type = 'border') {
        if (!window.themeManager) return;
        
        const theme = window.themeManager.getCurrentTheme();
        
        switch(type) {
            case 'border':
                element.style.borderColor = theme.border;
                break;
            case 'background':
                element.style.background = `linear-gradient(135deg, ${theme.backgroundCard}, rgba(0, 0, 0, 0.8))`;
                break;
            case 'text':
                element.style.color = theme.primary;
                break;
            case 'button':
                element.style.background = theme.gradient;
                element.style.borderColor = theme.primary;
                break;
            case 'gradient':
                element.style.background = theme.gradient;
                break;
            case 'shadow':
                element.style.boxShadow = `0 10px 30px ${theme.shadowDark}`;
                break;
        }
    }

    // Função para forçar atualização completa
    function forceThemeUpdate() {
        if (window.themeManager) {
            const currentTheme = window.themeManager.getCurrentTheme();
            console.log('%c🔄 Forçando atualização completa do tema...', 'color: #f59e0b; font-weight: bold;');
            applyThemeToElements();
            applySpecificThemeElements(currentTheme);
            console.log('%c✅ Atualização completa concluída!', 'color: #10b981; font-weight: bold;');
        }
    }

    // Inicializar quando o Theme Manager estiver pronto
    function initializeThemeIntegration() {
        if (window.themeManager) {
            applyThemeToElements();
            observer.observe(document.body, observerConfig);
            
            // Re-aplicar quando o tema mudar
            window.addEventListener('themeChanged', (e) => {
                console.log('%c🎨 Tema mudou para:', 'color: #8b5cf6; font-weight: bold;', e.detail.themeName);
                setTimeout(() => {
                    applyThemeToElements();
                    applySpecificThemeElements(e.detail.theme);
                }, 200);
            });
            
            // Re-aplicar quando a página carregar completamente
            window.addEventListener('load', () => {
                setTimeout(applyThemeToElements, 500);
            });

            // Re-aplicar quando houver mudanças no DOM que possam adicionar novos elementos
            const debounce = (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };

            const debouncedUpdate = debounce(() => {
                applyThemeToElements();
            }, 500);

            // Observar mudanças de classe que podem afetar o estilo
            const classObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const element = mutation.target;
                        if (element.classList.contains('active') || element.classList.contains('hover')) {
                            debouncedUpdate();
                        }
                    }
                });
            });

            classObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['class'],
                subtree: true
            });
            
            console.log('%c✅ Theme Integration System Loaded', 'color: #10b981; font-weight: bold;');
            console.log('%c✅ Todos os elementos dinâmicos serão atualizados automaticamente', 'color: #10b981; font-size: 12px;');
            console.log('%c📊 Monitorando', Object.keys(themeTargets).length, 'categorias de elementos', 'color: #3b82f6; font-size: 12px;');
        } else {
            setTimeout(initializeThemeIntegration, 100);
        }
    }

    // Iniciar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeThemeIntegration);
    } else {
        initializeThemeIntegration();
    }

    // Exportar para uso global
    window.ThemeIntegration = {
        applyThemeToElements,
        applySpecificThemeElements,
        applyThemeToElement,
        addThemeTarget,
        forceThemeUpdate,
        getTargets: () => themeTargets
    };

    // Comando de debug no console
    console.log('%c💡 Dica: Use ThemeIntegration.forceThemeUpdate() para forçar atualização completa', 'color: #f59e0b; font-size: 11px;');
    console.log('%c💡 Dica: Use ThemeIntegration.addThemeTarget("categoria", ".seletor") para adicionar novos elementos', 'color: #f59e0b; font-size: 11px;');
    console.log('%c💡 Dica: Use ThemeIntegration.getTargets() para ver todos os elementos monitorados', 'color: #f59e0b; font-size: 11px;');

})();