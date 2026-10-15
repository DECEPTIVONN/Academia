/// Navbar Component com Search e Perfil
(function() {
    const navbarHTML = `
        <div id="progressBar"></div>
        <header>
            <nav>
                <div class="nav-container">
                    <div class="nav-left">
                        <div class="logo">
                            <img src="./Assets/Images/LogoItens/D.jpg" class="logo-icon" alt="Logo"/>
                            <span class="logo-text">'TRONUS</span>
                        </div>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <a href="./treino.html" class="nav-link">Início</a>
                            </li>
                            <li class="nav-item">
                                <a href="./anual-hub.html" class="nav-link has-dropdown">Testes</a>
                                <div class="dropdown-menu">
                                    <a href="./franquiaexemplo.html#filmes" class="dropdown-item">Franquia</a>
                                    <a href="./produto.html" class="dropdown-item">Produto</a>
                            
                                    <a href="./perfil.html" class="dropdown-item">Perfil</a>
                            
                                </div>
                            </li>

                            
                            <li class="nav-item">
                                <a href="./noticias.html" class="nav-link">Notícias</a>
                            </li>
                        </ul>
                    </div>
                    <div class="nav-right">
                        <div class="theme-selector">
                            <button class="theme-btn" id="themeBtn">🎨</button>
                            <div class="theme-dropdown" id="themeDropdown">
                                <!-- Será preenchido pelo Theme Manager -->
                            </div>
                        </div>
                        <button class="cart-icon-btn" id="cartToggleBtn" title="Carrinho">
                            🛒<span id="cartBadge" class="cart-badge">0</span>
                        </button>
                        <button class="nav-profile-button" id="profileBtn" title="Meu Perfil">
                            <img src="./Assets/Images/LogoItens/P.jpg" class="profile-icon" alt="Perfil"/>
                        </button>
                        <div class="menu-icon" id="menuToggle">
                            <div class="menu-icon-svg">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    `;

    // Search Overlay HTML
    const searchHTML = `
        <div class="search-overlay" id="searchOverlay">
            <div class="search-container">
                <div class="search-header">
                    <h2>Buscar</h2>
                    <button class="search-close-btn" id="searchCloseBtn">✕</button>
                </div>

                <div class="search-input-section">
                    <div class="search-input-wrapper">
                        <span class="search-input-icon">🔍</span>
                        <input 
                            type="text" 
                            class="search-input" 
                            id="searchInput" 
                            placeholder="Digite seu termo de busca..."
                            autocomplete="off"
                        />
                    </div>
                </div>

                <div class="search-filters-section">
                    <div class="filters-label">Filtros</div>
                    <div class="search-filters" id="searchFilters">
                        <div class="filter-checkbox">
                            <input type="checkbox" id="filter-games" value="games" class="search-filter">
                            <label for="filter-games">Games</label>
                        </div>
                        <div class="filter-checkbox">
                            <input type="checkbox" id="filter-hq" value="hq" class="search-filter">
                            <label for="filter-hq">HQ</label>
                        </div>
                        <div class="filter-checkbox">
                            <input type="checkbox" id="filter-news" value="news" class="search-filter">
                            <label for="filter-news">Notícias</label>
                        </div>
                        <div class="filter-checkbox">
                            <input type="checkbox" id="filter-operators" value="operators" class="search-filter">
                            <label for="filter-operators">Operadores</label>
                        </div>
                    </div>
                </div>

                <div class="search-results-section">
                    <div class="results-header">
                        <span class="results-title">Resultados</span>
                        <span class="results-count" id="resultsCount">0</span>
                    </div>
                    <div class="search-results-list" id="searchResultsList">
                        <div class="search-empty">
                            <div class="search-empty-icon">🔎</div>
                            <p class="search-empty-text">Digite algo para começar a buscar...</p>
                        </div>
                    </div>
                    <button class="search-view-all" id="viewAllBtn">Ver todos os resultados →</button>
                </div>
            </div>
        </div>
    `;

    // Sidebar Menu HTML com nova estrutura
    const sidebarHTML = `
        <div class="sidebar-overlay" id="sidebarOverlay"></div>
        <div class="sidebar-menu" id="sidebarMenu">
            <div class="sidebar-header">
                <div class="sidebar-profile-section">
                    <img src="./Assets/Images/LogoItens/P.jpg" class="sidebar-profile-image" alt="Perfil"/>
                    <div class="sidebar-profile-info">
                        <div class="sidebar-profile-label">Bem-vindo</div>
                        <div class="sidebar-profile-name">Meu Perfil</div>
                    </div>
                </div>
                <button class="sidebar-close" id="sidebarClose">✕</button>
            </div>
            
            <div class="sidebar-content">
                <nav class="sidebar-nav">
                    <div class="sidebar-section">
                        <a href="./perfil.html" class="sidebar-link sidebar-main-link">
                            <span class="sidebar-link-content">
                                <span class="sidebar-link-icon">👤</span>
                                Meu Perfil
                            </span>
                        </a>
                    </div>

                    <div class="sidebar-divider"></div>

                    <div class="sidebar-section">
                        <a href="javascript:void(0);" class="sidebar-link has-submenu" id="comprasMenu">
                            <span class="sidebar-link-content">
                                <span class="sidebar-link-icon">🛒</span>
                                Compras
                            </span>
                        </a>
                        <div class="sidebar-submenu" id="comprasSubmenu">
                            <a href="./carrinho.html#carrinhoSection" class="sidebar-sublink">Carrinho</a>
                            <a href="./favoritos.html" class="sidebar-sublink">Favoritos</a>
                            <a href="./compras.html?tab=pedidos" class="sidebar-sublink">Meus Pedidos</a>
                            <a href="./compras.html?tab=historico" class="sidebar-sublink">Histórico</a>
                        </div>
                    </div>

                    <div class="sidebar-section">
                        <a href="javascript:void(0);" class="sidebar-link has-submenu" id="vendasMenu">
                            <span class="sidebar-link-content">
                                <span class="sidebar-link-icon">💼</span>
                                Vendas
                            </span>
                        </a>
                        <div class="sidebar-submenu" id="vendasSubmenu">
                            <a href="./vendas.html?tab=resumo#vendasSection" class="dropdown-item">📈 Resumo</a>
                            <a href="./vendas.html?tab=estoque#vendasSection" class="dropdown-item">📦 Estoque</a>
                            <a href="./vendas.html?tab=anuncios#vendasSection" class="dropdown-item">📢 Anúncios</a>
                            <a href="./vendas.html?tab=ofertas#vendasSection" class="dropdown-item">🎟️ Ofertas</a>
                            <a href="./vendas.html?tab=relatorios#vendasSection" class="dropdown-item">📋 Relatórios</a>
                        </div>
                    </div>

                    <div class="sidebar-divider"></div>

                    <div class="sidebar-section">
                        <a href="./faq.html" class="sidebar-link">
                            <span class="sidebar-link-content">
                                <span class="sidebar-link-icon">❓</span>
                                FAQ
                            </span>
                        </a>
                    </div>

                    <div class="sidebar-section">
                        <a href="./suporte.html" class="sidebar-link">
                            <span class="sidebar-link-content">
                                <span class="sidebar-link-icon">💬</span>
                                Contato
                            </span>
                        </a>
                    </div>
                </nav>
            </div>

            <div class="sidebar-footer">
                <div class="sidebar-social">
                    <a href="#" class="sidebar-social-icon" title="Facebook">
                        <svg viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.39v-1.2h-2.84v8.37h2.84v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.84M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"/></svg>
                    </a>
                    <a href="#" class="sidebar-social-icon" title="Twitter">
                        <svg viewBox="0 0 24 24"><path d="M22.46 6c-.87.39-1.8.65-2.77.77 1-1 1.76-2.35 2.12-4.06-1 .6-2.05 1-3.19 1.23-.94-1-2.28-1.63-3.76-1.63-2.85 0-5.16 2.31-5.16 5.16 0 .4.05.8.15 1.18-4.29-.2-8.1-2.27-10.65-5.4-.44.76-.7 1.65-.7 2.6 0 1.79.92 3.38 2.3 4.3-.85-.03-1.65-.26-2.35-.65v.07c0 2.5 1.78 4.59 4.14 5.05-.43.12-.88.18-1.35.18-.33 0-.65-.03-.97-.09.65 2.03 2.56 3.51 4.82 3.55-1.77 1.38-4 2.2-6.42 2.2-.42 0-.83-.03-1.23-.08 2.3 1.48 5.05 2.34 7.98 2.34 9.58 0 14.8-7.93 14.8-14.8 0-.23 0-.45-.01-.67.86-.62 1.6-1.4 2.19-2.28z"/></svg>
                    </a>
                    <a href="#" class="sidebar-social-icon" title="Instagram">
                        <svg viewBox="0 0 24 24"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2m-.5 2c-1.5 0-2.7 1.2-2.7 2.8v8.4c0 1.5 1.2 2.7 2.8 2.7h8.4c1.5 0 2.7-1.2 2.7-2.8V7.8c0-1.5-1.2-2.7-2.8-2.7H7.3m9.6 1.5a.75.75 0 0 1 .75-.75.75.75 0 0 1 .75.75.75.75 0 0 1-.75.75.75.75 0 0 1-.75-.75M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
                    </a>
                </div>
            </div>
        </div>
    `;

    const cartHTML = `
        <div class="cart-sidebar-overlay" id="cartSidebarOverlay"></div>
        <aside class="cart-sidebar" id="cartSidebar" aria-label="Carrinho de Compras">
            <div class="cart-sidebar-header">
                <h3>Carrinho</h3>
                <button id="cartCloseBtn" class="cart-close-btn" aria-label="Fechar carrinho">✕</button>
            </div>
            <div class="cart-sidebar-body" id="cartItemsContainer"></div>
            <div class="cart-sidebar-footer">
                <div class="cart-subtotal">
                    <span>Subtotal</span>
                    <strong id="cartSubtotal">R$ 0,00</strong>
                </div>
                <div class="cart-actions">
                    <button class="btn btn-primary" id="goToCartBtn">Ir para o carrinho</button>
                    <button class="btn btn-secondary" id="sameCollectionBtn">Da mesma coleção</button>
                </div>
            </div>
        </aside>
    `;

    const favoritesHTML = `
        <div class="favorites-sidebar-overlay" id="favoritesSidebarOverlay"></div>
        <aside class="favorites-sidebar" id="favoritesSidebar" aria-label="Favoritos">
            <div class="favorites-sidebar-header">
                <h3>Favoritos</h3>
                <button id="favoritesCloseBtn" class="cart-close-btn" aria-label="Fechar favoritos">✕</button>
            </div>
            <div class="favorites-sidebar-body" id="favoritesItemsContainer"></div>
            <div class="favorites-sidebar-footer">
                <div class="favorites-subtotal">
                    <span>Valor Total</span>
                    <strong id="favoritesSubtotal">R$ 0,00</strong>
                </div>
                <div class="favorites-actions">
                    <button class="btn btn-primary" id="goToFavoritesBtn">Ir para Favoritos</button>
                    <button class="btn btn-secondary" id="favoritesClearBtn">Limpar Tudo</button>
                </div>
            </div>
        </aside>
    `;

    // Search Database
    const searchDatabase = [
        { title: 'Game 1', description: 'Descrição do game 1', category: 'games', tag: 'novo', image: '🎮' },
        { title: 'Game 2', description: 'Descrição do game 2', category: 'games', tag: 'popular', image: '🎮' },
        { title: 'HQ 1', description: 'Descrição da HQ 1', category: 'hq', tag: 'novo', image: '📚' },
        { title: 'Notícia 1', description: 'Descrição da notícia 1', category: 'news', tag: 'quente', image: '📰' },
        { title: 'Operador 1', description: 'Descrição do operador 1', category: 'operators', tag: 'novo', image: '👤' },
    ];

    // ===== DOM Insertion =====
    document.body.insertAdjacentHTML('beforeend', navbarHTML);
    document.body.insertAdjacentHTML('beforeend', searchHTML);
    document.body.insertAdjacentHTML('beforeend', sidebarHTML);
    document.body.insertAdjacentHTML('beforeend', cartHTML);
    document.body.insertAdjacentHTML('beforeend', favoritesHTML);

    // ===== Scroll Progress Bar =====
    const progressBar = document.getElementById('progressBar');
    
    window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / scrollHeight) * 100;
        progressBar.style.width = scrolled + '%';

        const header = document.querySelector('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ===== Search Functionality =====
    const searchIconBtn = document.getElementById('searchIconBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchCloseBtn = document.getElementById('searchCloseBtn');
    const searchInput = document.getElementById('searchInput');
    const searchResultsList = document.getElementById('searchResultsList');
    const resultsCount = document.getElementById('resultsCount');
    const searchFilters = document.querySelectorAll('.search-filter');

    function openSearchOverlay() {
        searchOverlay.classList.add('active');
        setTimeout(() => searchInput.focus(), 200);
    }

    function closeSearchOverlay() {
        searchOverlay.classList.remove('active');
    }

    searchIconBtn.addEventListener('click', openSearchOverlay);
    searchCloseBtn.addEventListener('click', closeSearchOverlay);
    
    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
            closeSearchOverlay();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearchOverlay();
        }
    });

    // Search Filter and Results
    let selectedFilters = [];

    searchFilters.forEach(filter => {
        filter.addEventListener('change', () => {
            selectedFilters = Array.from(searchFilters)
                .filter(f => f.checked)
                .map(f => f.value);
            performSearch();
        });
    });

    function performSearch() {
        const query = searchInput.value.toLowerCase();

        if (query.length === 0) {
            searchResultsList.innerHTML = `
                <div class="search-empty">
                    <div class="search-empty-icon">🔎</div>
                    <p class="search-empty-text">Digite algo para começar a buscar...</p>
                </div>
            `;
            resultsCount.textContent = '0';
            return;
        }

        let results = searchDatabase.filter(item => {
            const matchesQuery = item.title.toLowerCase().includes(query) || 
                               item.description.toLowerCase().includes(query) ||
                               item.tag.toLowerCase().includes(query);
            
            const matchesFilter = selectedFilters.length === 0 || selectedFilters.includes(item.category);
            
            return matchesQuery && matchesFilter;
        });

        resultsCount.textContent = results.length;

        if (results.length === 0) {
            searchResultsList.innerHTML = `
                <div class="search-empty">
                    <div class="search-empty-icon">🔎</div>
                    <p class="search-empty-text">Nenhum resultado encontrado para "${query}"</p>
                </div>
            `;
        } else {
            searchResultsList.innerHTML = results.map(item => `
                <div class="search-result-item" onclick="window.location.href='#'">
                    <div class="search-result-image">${item.image}</div>
                    <div class="search-result-content">
                        <h3 class="search-result-title">${item.title}</h3>
                        <p class="search-result-desc">${item.description}</p>
                        <span class="search-result-tag">${item.tag}</span>
                    </div>
                    <div class="search-result-arrow">→</div>
                </div>
            `).join('');
        }
    }

    searchInput.addEventListener('input', performSearch);

    document.getElementById('viewAllBtn').addEventListener('click', () => {
        closeSearchOverlay();
        console.log('Redirecionar para página completa de resultados');
    });

    // ===== Language Selector =====
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    const langOptions = document.querySelectorAll('.lang-option');

    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('active');
        const themeDropdown = document.getElementById('themeDropdown');
        if (themeDropdown) {
            themeDropdown.classList.remove('active');
        }
    });

    langOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = option.dataset.lang;
            
            langOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            langBtn.textContent = lang;
            langDropdown.classList.remove('active');
            
            console.log('Idioma selecionado:', lang);
        });
    });

    // ===== Theme Selector =====
    const themeBtn = document.getElementById('themeBtn');
    const themeDropdown = document.getElementById('themeDropdown');

    themeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themeDropdown.classList.toggle('active');
        langDropdown.classList.remove('active');
    });

    document.addEventListener('click', () => {
        langDropdown.classList.remove('active');
        themeDropdown.classList.remove('active');
    });

    // ===== Sidebar Menu Toggle =====
    const menuToggle = document.getElementById('menuToggle');
    const profileBtn = document.getElementById('profileBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');

    function openSidebar() {
        sidebarMenu.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebarMenu.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    menuToggle.addEventListener('click', openSidebar);
    profileBtn.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebarMenu.classList.contains('active')) {
            closeSidebar();
        }
    });

    // ===== Sidebar Collapsible Menus =====
    const collapsibleMenus = [
        { menu: 'comprasMenu', submenu: 'comprasSubmenu' },
        { menu: 'vendasMenu', submenu: 'vendasSubmenu' }
    ];

    collapsibleMenus.forEach(({ menu, submenu }) => {
        const menuElement = document.getElementById(menu);
        const submenuElement = document.getElementById(submenu);

        if (menuElement && submenuElement) {
            menuElement.addEventListener('click', (e) => {
                e.preventDefault();
                menuElement.classList.toggle('expanded');
                submenuElement.classList.toggle('expanded');
            });
        }
    });

    // ===== Shopping Cart =====
    const favoritesToggleBtn = document.getElementById('favoritesToggleBtn');
    const favoritesBadge = document.getElementById('favoritesBadge');
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartSidebarOverlay = document.getElementById('cartSidebarOverlay');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartBadge = document.getElementById('cartBadge');
    const goToCartBtn = document.getElementById('goToCartBtn');
    const sameCollectionBtn = document.getElementById('sameCollectionBtn');

    const favoritesSidebar = document.getElementById('favoritesSidebar');
    const favoritesSidebarOverlay = document.getElementById('favoritesSidebarOverlay');
    const favoritesCloseBtn = document.getElementById('favoritesCloseBtn');
    const favoritesItemsContainer = document.getElementById('favoritesItemsContainer');
    const favoritesClearBtn = document.getElementById('favoritesClearBtn');

    const CART_STORAGE_KEY = 'tronusCart';
    let cartState = [];

    const formatPrice = (value) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const updateCartBadge = () => {
        if (!cartBadge) return;
        const totalItems = cartState.reduce((acc, item) => acc + item.quantity, 0);
        cartBadge.textContent = totalItems;
        cartBadge.classList.toggle('visible', totalItems > 0);
    };

    const FAVORITES_STORAGE_KEY = 'tronusFavorites';
    let favoritesState = [];

    const loadFavoritesState = () => {
        const storedFavorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]');
        favoritesState = Array.isArray(storedFavorites) ? storedFavorites : [];
        updateFavoritesBadge();
        renderFavorites();
    };

    const saveFavoritesState = () => {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritesState));
        updateFavoritesBadge();
        renderFavorites();
        window.dispatchEvent(new CustomEvent('favoritesUpdated', { detail: favoritesState }));
    };

    const updateFavoritesBadge = () => {
        if (!favoritesBadge) return;
        const totalFavorites = favoritesState.length;
        favoritesBadge.textContent = totalFavorites;
        favoritesBadge.classList.toggle('visible', totalFavorites > 0);
    };

    const isFavorite = (productId) => {
        return favoritesState.includes(productId);
    };

    const toggleFavorite = (productId) => {
        const id = Number(productId);
        const wasFavorite = isFavorite(id);

        if (wasFavorite) {
            favoritesState = favoritesState.filter(fid => fid !== id);
        } else {
            favoritesState.push(id);
        }

        saveFavoritesState();

        if (!wasFavorite) {
            openFavorites();
            if (favoritesToggleBtn) {
                favoritesToggleBtn.classList.add('cart-flash');
                setTimeout(() => favoritesToggleBtn.classList.remove('cart-flash'), 300);
            }
        }

        return !wasFavorite;
    };

    const addFavorite = (productId) => {
        const id = Number(productId);
        if (!isFavorite(id)) {
            favoritesState.push(id);
            saveFavoritesState();
            openFavorites();
            if (favoritesToggleBtn) {
                favoritesToggleBtn.classList.add('cart-flash');
                setTimeout(() => favoritesToggleBtn.classList.remove('cart-flash'), 300);
            }
            return true;
        }
        return false;
    };

    const removeFavorite = (productId) => {
        const id = Number(productId);
        if (isFavorite(id)) {
            favoritesState = favoritesState.filter(fid => fid !== id);
            saveFavoritesState();
            return true;
        }
        return false;
    };

    const saveCartState = () => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
    };

    const loadCartState = () => {
        const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
        cartState = Array.isArray(stored) ? stored : [];
        renderCart();
        updateCartBadge();
    };

    const getCartSubtotal = () => {
        return cartState.reduce((acc, item) => acc + item.price * item.quantity, 0);
    };

    const renderCart = () => {
        if (!cartItemsContainer || !cartSubtotal) return;

        if (cartState.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="cart-empty">
                    <p>Seu carrinho está vazio.</p>
                </div>
            `;
            cartSubtotal.textContent = formatPrice(0);
            updateCartBadge();
            return;
        }

        cartItemsContainer.innerHTML = cartState.map(item => {
            // Obter imagem usando ProductSync centralizado
            let imageSrc = 'Assets/Images/LogoItens/P.jpg'; // fallback padrão
            if (typeof window.ProductSync !== 'undefined') {
                const primaryImage = window.ProductSync.getPrimaryImage(item);
                if (primaryImage) {
                    imageSrc = primaryImage;
                }
            } else if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                imageSrc = item.images[0];
            } else if (item.image) {
                imageSrc = item.image;
            }
            
            return `
            <div class="cart-item" data-id="${item.id}">
                <img src="${imageSrc}" alt="${item.name}" class="cart-item-image" />
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${formatPrice(item.price)}</div>
                    <div class="cart-item-qty-controls">
                        <button class="cart-qty-btn" data-action="decrement" title="Diminuir quantidade">−</button>
                        <span class="cart-qty">${item.quantity}</span>
                        <button class="cart-qty-btn" data-action="increment" title="Aumentar quantidade">+</button>
                        <button class="cart-item-remove" data-action="remove" title="Remover item">🗑️</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        cartSubtotal.textContent = formatPrice(getCartSubtotal());
        updateCartBadge();

        const itemButtons = cartItemsContainer.querySelectorAll('.cart-qty-btn, .cart-item-remove');

        itemButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const target = event.currentTarget;
                const action = target.getAttribute('data-action');
                const cartItemElement = target.closest('.cart-item');
                if (!cartItemElement) return;
                const productId = Number(cartItemElement.getAttribute('data-id'));

                if (action === 'increment') {
                    const item = cartState.find(i => i.id === productId);
                    if (!item) return;
                    item.quantity += 1;
                }

                if (action === 'decrement') {
                    const item = cartState.find(i => i.id === productId);
                    if (!item) return;
                    if (item.quantity > 1) item.quantity -= 1;
                }

                if (action === 'remove') {
                    cartState = cartState.filter(i => i.id !== productId);
                }

                saveCartState();
                renderCart();
            });
        });
    };

    const getFavoriteSubtotal = () => {
        return favoritesState.reduce((acc, favId) => {
            const item = cartState.find(i => i.id === favId);
            return acc + (item ? item.price : 0);
        }, 0);
    };

    const updateFavoritesSubtotal = () => {
        const favoritesSubtotal = document.getElementById('favoritesSubtotal');
        if (favoritesSubtotal) {
            favoritesSubtotal.textContent = formatPrice(getFavoriteSubtotal());
        }
    };

    const renderFavorites = () => {
        if (!favoritesItemsContainer) return;

        if (favoritesState.length === 0) {
            favoritesItemsContainer.innerHTML = `
                <div class="favorites-empty">
                    <div class="favorites-empty-icon">💖</div>
                    <div class="favorites-empty-text">Nenhum favorito ainda</div>
                </div>
            `;
            updateFavoritesSubtotal();
            return;
        }

        // Obter todos os produtos disponíveis via ProductSync
        let allProducts = [];
        if (typeof window.ProductSync !== 'undefined') {
            allProducts = window.ProductSync.getAllProducts();
        }

        favoritesItemsContainer.innerHTML = favoritesState.map(favId => {
            // Buscar o produto nos dados do ProductSync (tentar tanto number quanto string)
            const item = allProducts.find(p => p.id === favId || p.id === Number(favId) || p.id === String(favId)) || { 
                id: favId, 
                name: 'Produto favorito', 
                price: 0, 
                image: './Assets/Images/LogoItens/P.jpg',
                images: []
            };
            
            // Obter imagem usando ProductSync centralizado
            let imageSrc = './Assets/Images/LogoItens/P.jpg'; // fallback padrão
            if (typeof window.ProductSync !== 'undefined') {
                const primaryImage = window.ProductSync.getPrimaryImage(item);
                if (primaryImage) {
                    imageSrc = primaryImage;
                }
            } else if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                imageSrc = item.images[0];
            } else if (item.image) {
                imageSrc = item.image;
            }
            
            return `
                <div class="favorites-item" data-id="${item.id}">
                    <img src="${imageSrc}" alt="${item.name}" class="favorites-item-image" />
                    <div class="favorites-item-info">
                        <div class="favorites-item-title">${item.name}</div>
                        <div class="favorites-item-price">${formatPrice(item.price)}</div>
                    </div>
                    <button class="favorites-item-remove" data-action="removeFavorite" data-id="${item.id}" title="Remover favorito">✕</button>
                </div>
            `;
        }).join('');

        updateFavoritesSubtotal();

        const favButtons = favoritesItemsContainer.querySelectorAll('.favorites-item-remove');

        favButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const id = Number(button.dataset.id);
                favoritesState = favoritesState.filter(fid => fid !== id);
                saveFavoritesState();
                renderFavorites();
            });
        });
    };

    const openFavorites = () => {
        if (!favoritesSidebar || !favoritesSidebarOverlay) return;
        favoritesSidebar.classList.add('active');
        favoritesSidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderFavorites();
    };

    const closeFavorites = () => {
        if (!favoritesSidebar || !favoritesSidebarOverlay) return;
        favoritesSidebar.classList.remove('active');
        favoritesSidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    const openCart = () => {
        if (!cartSidebar || !cartSidebarOverlay) return;
        cartSidebar.classList.add('active');
        cartSidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeCart = () => {
        if (!cartSidebar || !cartSidebarOverlay) return;
        cartSidebar.classList.remove('active');
        cartSidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    const addCartItem = (item) => {
        // Determine category based on id ranges or other logic
        let category = 'roupas'; // default
        if (item.id >= 60 && item.id < 180) category = 'acessorios';
        else if (item.id >= 180) category = 'calcados';

        const existing = cartState.find(i => i.id === item.id);

        if (existing) {
            existing.quantity += item.quantity;
        } else {
            cartState.push({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image || './Assets/Images/LogoItens/D.jpg',
                quantity: item.quantity,
                color: item.color || '',
                size: item.size || '',
                category: category,
                brand: item.brand || ''
            });
        }

        saveCartState();
        renderCart();
        openCart();

        if (cartToggleBtn) {
            cartToggleBtn.classList.add('cart-flash');
            setTimeout(() => cartToggleBtn.classList.remove('cart-flash'), 300);
        }

        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartState }));
    };

    window.ShoppingCart = {
        addItem: (item) => addCartItem(item),
        updateQuantity: (id, quantity) => {
            const product = cartState.find(i => i.id === id);
            if (!product || quantity < 1) return;
            product.quantity = quantity;
            saveCartState();
            renderCart();
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartState }));
        },
        removeItem: (id) => {
            cartState = cartState.filter(i => i.id !== id);
            saveCartState();
            renderCart();
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartState }));
        },
        open: openCart,
        close: closeCart,
        getState: () => [...cartState]
    };

    window.Favorites = {
        addItem: (productId) => addFavorite(productId),
        removeItem: (productId) => removeFavorite(productId),
        toggleItem: (productId) => toggleFavorite(productId),
        isFavorited: (productId) => isFavorite(productId),
        getState: () => [...favoritesState],
        open: openFavorites,
        close: closeFavorites
    };

    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', () => {
            openCart();
        });
    }

    if (cartCloseBtn) {
        cartCloseBtn.addEventListener('click', closeCart);
    }

    if (cartSidebarOverlay) {
        cartSidebarOverlay.addEventListener('click', closeCart);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (cartSidebar?.classList.contains('active')) {
                closeCart();
            }
            if (favoritesSidebar?.classList.contains('active')) {
                closeFavorites();
            }
        }
    });

    if (favoritesToggleBtn) {
        favoritesToggleBtn.addEventListener('click', (event) => {
            event.preventDefault();
            openFavorites();
        });
    }

    if (favoritesCloseBtn) {
        favoritesCloseBtn.addEventListener('click', closeFavorites);
    }

    if (favoritesSidebarOverlay) {
        favoritesSidebarOverlay.addEventListener('click', closeFavorites);
    }

    if (goToCartBtn) {
        goToCartBtn.addEventListener('click', () => {
            window.location.href = './carrinho.html#carrinhoSection';
        });
    }

    const goToFavoritesBtn = document.getElementById('goToFavoritesBtn');
    if (goToFavoritesBtn) {
        goToFavoritesBtn.addEventListener('click', () => {
            closeFavorites();
            window.location.href = './favoritos.html';
        });
    }

    if (sameCollectionBtn) {
        sameCollectionBtn.addEventListener('click', () => {
            window.location.href = './colecoes.html';
        });
    }

    if (favoritesClearBtn) {
        favoritesClearBtn.addEventListener('click', () => {
            favoritesState = [];
            saveFavoritesState();
            renderFavorites();
        });
    }

    window.addEventListener('favoritesUpdated', () => {
        updateFavoritesBadge();
        renderFavorites();
    });

    loadCartState();
    loadFavoritesState();

    // ===== Mark Active Link =====
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link, .sidebar-link, .sidebar-sublink');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage) && currentPage !== '') {
            link.classList.add('active');
        }
    });

    console.log('%c✅ Navbar carregada com sistema de perfil integrado', 'color: #10b981; font-weight: bold;');
})();