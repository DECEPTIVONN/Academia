// ====================================
// ROSTER FRANQUIA PAGE - CALL OF DUTY
// Main JavaScript File
// ====================================

// ====================================
// DATA - OPERADORES
// ====================================

const operadoresData = [
    { 
        id: 1,
        name: "Ghost", 
        faction: "Task Force 141",
        status: "Ativo",
        estreia: "2009",
        origem: "Reino Unido",
        image: "[GHOST]",
        bio: "O tenente Simon Riley, mais conhecido como Ghost, é um operador de elite da Task Force 141. Servindo sob o comando do Capitão Price, Ghost é conhecido por sua lealdade inabalável e habilidades táticas superiores. Sua máscara de crânio branco é um símbolo de medo nos campos de batalha." 
    },
    { 
        id: 2,
        name: "Soap", 
        faction: "SAS",
        status: "Ativo",
        estreia: "2007",
        origem: "Escócia",
        image: "[SOAP]",
        bio: "Capitão John 'Soap' MacTavish é um soldado lendário do SAS (Special Air Service). Seu apelido vem de sua capacidade de 'limpar' a casa de inimigos. Conhecido por sua coragem e determinação, Soap é um dos operadores mais respeitados da franquia." 
    },
    { 
        id: 3,
        name: "Price", 
        faction: "Task Force 141",
        status: "Ativo",
        estreia: "2007",
        origem: "Inglaterra",
        image: "[PRICE]",
        bio: "Capitão John Price é o comandante lendário da Task Force 141. Com sua cicatriz característica e cigarro sempre à mão, Price é um estrategista brilhante e líder nato. Sua reputação na comunidade militar é impecável." 
    },
    { 
        id: 4,
        name: "Makarov", 
        faction: "Ultranacionalistas",
        status: "Falecido",
        estreia: "2007",
        origem: "Rússia",
        image: "[MAKAROV]",
        bio: "Vladimir Makarov é um dos principais antagonistas da série. Líder dos Ultranacionalistas Russos, Makarov é um terrorista internacional buscado. Sua influência se estende por toda a Europa e além." 
    },
    { 
        id: 5,
        name: "Adler", 
        faction: "CIA",
        status: "Ativo",
        estreia: "2020",
        origem: "Estados Unidos",
        image: "[ADLER]",
        bio: "Agente Russell Adler da CIA é um operador experiente em operações especiais. Com seu tapa-olho e treinamento em interrogatório avançado, Adler é especialista em obter inteligência. Seu passado turbulento o torna impiedoso em combate." 
    },
    { 
        id: 6,
        name: "Marshall", 
        faction: "USMC",
        status: "Ativo",
        estreia: "2024",
        origem: "Estados Unidos",
        image: "[MARSHALL]",
        bio: "General-de-brigada Brandon Marshall lidera operações militares americanas de alto nível. Com vasta experiência em combate terrestre, Marshall é estratégico e decisivo em cada operação que comanda." 
    },
    { 
        id: 7,
        name: "Menendez", 
        faction: "Cartel",
        status: "Ativo",
        estreia: "2012",
        origem: "Nicarágua",
        image: "[MENENDEZ]",
        bio: "Raul Menendez é um líder cartel poderoso e violento. Seu controle sobre redes criminosas internacionais o torna uma ameaça global. Com tecnologia avançada à sua disposição, Menendez é imprevisível e letal." 
    },
    { 
        id: 8,
        name: "Mason", 
        faction: "CIA",
        status: "Ativo",
        estreia: "2010",
        origem: "Estados Unidos",
        image: "[MASON]",
        bio: "Agente Alex Mason da CIA é um operador de primeira linha em operações de resgate e infiltração. Com treinamento em combate corpo-a-corpo, Mason é versátil e confiável em qualquer missão." 
    },
    { 
        id: 9,
        name: "Alejandro", 
        faction: "Forças Especiais Mexicanas",
        status: "Ativo",
        estreia: "2022",
        origem: "México",
        image: "[ALEJANDRO]",
        bio: "Coronel Alejandro Vargas lidera as Forças Especiais Mexicanas contra o crime organizado. Seu conhecimento das operações latino-americanas o torna inestimável. Alejandro é honrado, feroz e completamente dedicado à justiça." 
    },
    { 
        id: 10,
        name: "Woods", 
        faction: "USMC",
        status: "Ativo",
        estreia: "2010",
        origem: "Estados Unidos",
        image: "[WOODS]",
        bio: "Sargento Frank Woods é um veterano do Corpo de Fuzileiros Navais com experiência em combate global. Sua tatuagem de caveira e determinação são lendárias. Woods é leal, agressivo e letal em combate direto." 
    },
    { 
        id: 11,
        name: "Gaz", 
        faction: "Task Force 141",
        status: "Ativo",
        estreia: "2007",
        origem: "Inglaterra",
        image: "[GAZ]",
        bio: "Soldado Kyle 'Gaz' Garrick é um membro confiável da Task Force 141 sob comando direto do Capitão Price. Jovem, talentoso e ambicioso, Gaz prova seu valor em cada operação. Seu futuro na elite é promissor." 
    },
    { 
        id: 12,
        name: "Roach", 
        faction: "SAS",
        status: "Falecido",
        estreia: "2009",
        origem: "Reino Unido",
        image: "[ROACH]",
        bio: "Soldado Gary Sanderson, codinome 'Roach', é um operador dedicado do SAS. Treinado em táticas de infiltração, Roach é confiável e profissional. Seu sacrifício pelo bem da missão é lembrado." 
    },
    { 
        id: 13,
        name: "Naga Viper", 
        faction: "Forças Especiais Indianas",
        status: "Ativo",
        estreia: "2022",
        origem: "Índia",
        image: "[NAGA]",
        bio: "Uma operadora mística das Forças Especiais Indianas com treinamento em artes marciais avançadas. Naga Viper combina técnicas ancestrais com táticas modernas. Seu silêncio e velocidade são aterradores." 
    },
    { 
        id: 14,
        name: "Raines", 
        faction: "USAF",
        status: "Ativo",
        estreia: "2023",
        origem: "Estados Unidos",
        image: "[RAINES]",
        bio: "Coronel James Raines da Força Aérea é especialista em operações aéreas e suporte tático. Seu conhecimento de armamentos avançados o torna valioso em qualquer equipe. Raines é calculista e estratégico." 
    },
    { 
        id: 15,
        name: "Reyes", 
        faction: "SAS",
        status: "Ativo",
        estreia: "2022",
        origem: "Espanha",
        image: "[REYES]",
        bio: "Soldado Miguel Reyes do SAS é especialista em reconhecimento e vigilância. Sua capacidade de se mover despercebido é lendária entre colegas. Reyes é paciente, observador e metodista em suas operações." 
    },
    { 
        id: 16,
        name: "Valeria", 
        faction: "Cartel Chimera",
        status: "Ativo",
        estreia: "2022",
        origem: "Colômbia",
        image: "[VALERIA]",
        bio: "Valeria é uma operadora poderosa do Cartel Chimera com habilidades de infiltração e inteligência. Sua beleza é tão letal quanto sua mente estratégica. Valeria é impredizível e sempre um passo à frente." 
    },
    { 
        id: 17,
        name: "Krueger", 
        faction: "KSK Alemã",
        status: "Ativo",
        estreia: "2019",
        origem: "Alemanha",
        image: "[KRUEGER]",
        bio: "Soldado Sebastian Krueger é um operador implacável das Forças Especiais Alemãs. Seu treinamento em combate extremo o torna praticamente imparável. Krueger vive para o combate e raramente se detém." 
    },
    { 
        id: 18,
        name: "Wyatt", 
        faction: "Operações Especiais",
        status: "Ativo",
        estreia: "2023",
        origem: "Estados Unidos",
        image: "[WYATT]",
        bio: "Especialista em operações de resgate, Wyatt é conhecido por sua capacidade de sobreviver em ambientes hostis. Seu conhecimento de sobrevivência no deserto é incomparável. Wyatt é resiliente e adaptável." 
    },
    { 
        id: 19,
        name: "Chimera", 
        faction: "Cartéis Colombianos",
        status: "Ativo",
        estreia: "2022",
        origem: "Colômbia",
        image: "[CHIMERA]",
        bio: "Uma operadora elite do submundo das drogas sul-americanas. Chimera é brutal e imprevisível em combate. Seu conhecimento de operações clandestinas a torna uma adversária formidável." 
    },
    { 
        id: 20,
        name: "Sting", 
        faction: "Elite Russa",
        status: "Ativo",
        estreia: "2021",
        origem: "Rússia",
        image: "[STING]",
        bio: "Agente de operações especiais russas com expertise em sabotagem eletrônica. Sting é rápido, furtivo e letal. Seu conhecimento de sistemas de defesa o torna inestimável em operações de infiltração." 
    },
    { 
        id: 21,
        name: "Echo", 
        faction: "Operações Especiais",
        status: "Ativo",
        estreia: "2023",
        origem: "Vietnã",
        image: "[ECHO]",
        bio: "Operadora vietnamita especializada em reconhecimento e comunicações. Echo é silenciosa e eficiente em suas missões. Sua conexão com a natureza a torna uma rastreadora incomparável." 
    },
    { 
        id: 22,
        name: "Phantom", 
        faction: "Forças Especiais",
        status: "Ativo",
        estreia: "2020",
        origem: "Austrália",
        image: "[PHANTOM]",
        bio: "Um operador australiano que trabalha nas sombras. Phantom é invisível até o momento em que ataca. Seu treinamento em combate furtivo o torna o assassino perfeito." 
    },
    { 
        id: 23,
        name: "Spectre", 
        faction: "Agência Secreta",
        status: "Ativo",
        estreia: "2021",
        origem: "Reino Unido",
        image: "[SPECTRE]",
        bio: "Um agente anônimo de uma agência secreta britânica. Spectre é um mestre da disfarce e infiltração. Sua verdadeira identidade é um mistério bem guardado." 
    },
    { 
        id: 24,
        name: "Nova", 
        faction: "Operações Cibernéticas",
        status: "Ativo",
        estreia: "2022",
        origem: "Brasil",
        image: "[NOVA]",
        bio: "Especialista em operações cibernéticas do Brasil, Nova combina hacking avançado com combate tático. Sua inteligência brilhante é tão perigosa quanto sua destreza em combate." 
    },
    { 
        id: 25,
        name: "Shadow", 
        faction: "Forças Sombra",
        status: "Ativo",
        estreia: "2020",
        origem: "Desconhecida",
        image: "[SHADOW]",
        bio: "Um operador misterioso cuja origem é desconhecida. Shadow trabalha nas margens da lei para os mais altos bidentes. Sua lenda cresce com cada operação impossível que completa." 
    }
];

// ====================================
// GLOBAL VARIABLES & STATE
// ====================================

let currentTab = 'roster-grid';
let selectedFaction = null;
let selectedOperador = null;

// ====================================
// TAB SYSTEM
// ====================================

function switchTab(tabName) {
    currentTab = tabName;

    // Atualizar UI dos botões
    const buttons = document.querySelectorAll('.internal-nav-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    // Atualizar visibilidade das abas
    const tabs = document.querySelectorAll('.tab-content-roster');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Renderizar conteúdo dinamicamente
    renderTabContent(tabName);
}

function renderTabContent(tabName) {
    switch(tabName) {
        case 'roster-grid':
            renderRosterGrid();
            showOperadorDetails(operadoresData[0].id);
            break;
        case 'roster-faccoes':
            renderFaccoesList();
            break;
    }
    
    setupCardAnimations();
}

// ====================================
// RENDER ROSTER GRID
// ====================================

function renderRosterGrid() {
    const container = document.getElementById('rosterGrid');
    if (!container) return;

    container.innerHTML = operadoresData.map((operador, index) => `
        <div class="roster-slot-sf6 scroll-fade-up" 
             data-operador-id="${operador.id}" 
             onclick="selectOperador(event, ${operador.id})"
             style="animation-delay: ${(index % 11) * 30}ms">
            <div class="slot-image-sf6">
                ${operador.image}
            </div>
            <div class="slot-name-sf6">${operador.name}</div>
        </div>
    `).join('');
}

// ====================================
// SELECT OPERADOR
// ====================================

let clickCount = 0;
let lastClickedId = null;
let clickTimer = null;

function selectOperador(event, operadorId) {
    event.stopPropagation();
    
    const operador = operadoresData.find(o => o.id === operadorId);
    if (!operador) return;

    if (lastClickedId === operadorId) {
        clickCount++;
    } else {
        clickCount = 1;
        lastClickedId = operadorId;
    }

    clearTimeout(clickTimer);

    clickTimer = setTimeout(() => {
        if (clickCount === 1) {
            showOperadorDetails(operadorId);
            const detailsSection = document.querySelector('.roster-details-wrapper-sf6');
            if (detailsSection) {
                detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        clickCount = 0;
    }, 300);

    document.querySelectorAll('.roster-slot-sf6').forEach(slot => {
        slot.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

function showOperadorDetails(operadorId) {
    const operador = operadoresData.find(o => o.id === operadorId);
    if (!operador) return;

    selectedOperador = operador;

    const imageContainer = document.getElementById('rosterImageContainer');
    if (imageContainer) {
        imageContainer.innerHTML = `
            <div class="roster-detail-image-sf6">
                ${operador.image}
            </div>
        `;
    }

    const bannerContainer = document.getElementById('rosterBannerContainer');
    if (bannerContainer) {
        bannerContainer.innerHTML = `
            <div class="roster-banner-image-sf6">
                ${operador.image}
            </div>
        `;
    }

    const bioContainer = document.getElementById('rosterBioContainer');
    if (bioContainer) {
        bioContainer.innerHTML = `
            <div class="roster-bio-content-sf6">
                <h2 class="operador-name-sf6">${operador.name}</h2>
                
                <div class="operador-info-sf6">
                    <div class="info-item-sf6">
                        <span class="info-label-sf6">ORIGEM</span>
                        <span class="info-value-sf6">${operador.origem}</span>
                    </div>
                    <div class="info-item-sf6">
                        <span class="info-label-sf6">ESTREIA</span>
                        <span class="info-value-sf6">${operador.estreia}</span>
                    </div>
                    <div class="info-item-sf6">
                        <span class="info-label-sf6">FACÇÃO</span>
                        <span class="info-value-sf6">${operador.faction}</span>
                    </div>
                    <div class="info-item-sf6">
                        <span class="info-label-sf6">STATUS</span>
                        <span class="info-value-sf6 ${operador.status === 'Falecido' ? 'status-dead' : 'status-active'}">${operador.status}</span>
                    </div>
                </div>

                <div class="operador-biography-sf6">
                    <p>${operador.bio}</p>
                </div>
            </div>
        `;
    }
}

// ====================================
// FACÇÕES SYSTEM
// ====================================

function renderFaccoesList() {
    const container = document.getElementById('faccoesList');
    if (!container) return;

    const factions = [...new Set(operadoresData.map(op => op.faction))].sort();

    container.innerHTML = factions.map((faction) => {
        const count = operadoresData.filter(op => op.faction === faction).length;
        return `
            <button class="faccao-btn" onclick="selectFaction('${faction}')">
                <span>${faction}</span>
                <span class="faccao-count">${count}</span>
            </button>
        `;
    }).join('');
}

function selectFaction(factionName) {
    selectedFaction = factionName;

    // Atualizar seleção visual
    document.querySelectorAll('.faccao-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.faccao-btn').classList.add('active');

    // Renderizar operadores da facção
    renderFaccaoDetalhes(factionName);
}

function renderFaccaoDetalhes(factionName) {
    const container = document.getElementById('faccoesDetalhes');
    if (!container) return;

    const operadores = operadoresData.filter(op => op.faction === factionName);
    const descricoes = getFactionDescriptions();
    const descricao = descricoes[factionName] || 'Uma organização militar de elite.';

    container.innerHTML = `
        <div class="faccao-content scroll-fade-up">
            <div class="faccao-header">
                <h3 class="faccao-nome">${factionName}</h3>
                <p class="faccao-descricao">${descricao}</p>
            </div>
            <div class="faccao-operadores">
                ${operadores.map(op => `
                    <div class="faccao-operador-card" onclick="showOperadorDetails(${op.id})">
                        <div class="operador-image-faccao">${op.image}</div>
                        <div class="operador-nome-faccao">${op.name}</div>
                        <div class="operador-status-faccao ${op.status === 'Falecido' ? 'status-dead' : 'status-active'}">
                            ${op.status === 'Falecido' ? '❌ Falecido' : '✅ Ativo'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getFactionDescriptions() {
    return {
        'Task Force 141': 'Força-tarefa internacional de elite dedicada a operações especiais de alta classificação. Conhecida por sua precisão, lealdade e eficácia em missões críticas.',
        'SAS': 'Special Air Service - A unidade britânica de operações especiais mais famosa do mundo. Treinados para excelência em combate extremo.',
        'CIA': 'Central Intelligence Agency - Agentes americanos especializados em inteligência, infiltração e operações encobertas.',
        'USMC': 'United States Marine Corps - Elite do corpo de fuzileiros navais americano com experiência em combate global.',
        'Ultranacionalistas': 'Organização paramilitar russa com objetivos políticos extremistas e operações terroristas internacionais.',
        'Cartel': 'Redes criminosas organizadas dedicadas ao tráfico e controle territorial através da violência.',
        'Forças Especiais Mexicanas': 'Unidades de elite do México especializadas em combate ao crime organizado e segurança nacional.',
        'Forças Especiais Indianas': 'Operadores indianos treinados em técnicas ancestrais e modernas de combate e infiltração.',
        'USAF': 'United States Air Force - Força aérea americana com especialidades em operações tática-aéreas.',
        'Operações Especiais': 'Unidades independentes de operadores especializados em missões críticas e impossíveis.',
        'Cartel Chimera': 'Organização criminosa colombiana com alcance internacional e influência política significativa.',
        'Elite Russa': 'Operadores especiais russos com expertise em sabotagem e operações clandestinas.',
        'Forças Especiais': 'Unidades militares de elite australianas especializadas em operações encobertas.',
        'Agência Secreta': 'Agência de inteligência britânica com operadores em operações de espionagem e infiltração.',
        'Operações Cibernéticas': 'Especialistas brasileiros em operações digitais e combate cibernético de alto nível.',
        'KSK Alemã': 'Kommando Spezialkräfte - Força especial alemã conhecida por treinamento extremo e eficiência tática.',
        'Cartéis Colombianos': 'Redes criminosas colombianas com operações em toda a América Latina.',
        'Forças Sombra': 'Organização misteriosa de operadores que trabalham nas margens da lei.'
    };
}

// ====================================
// CARD ANIMATIONS
// ====================================

function setupCardAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '0';
                    entry.target.style.transform = 'translateY(30px)';
                    entry.target.style.transition = 'all 0.6s ease';
                    
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, 50);
                }, idx * 50);
                
                fadeObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    setTimeout(() => {
        document.querySelectorAll('.roster-slot-sf6, .faccao-operador-card').forEach(card => {
            fadeObserver.observe(card);
        });
    }, 100);
}

// ====================================
// UPDATE HERO STATS
// ====================================

function updateHeroStats() {
    const totalOperadores = operadoresData.length;
    const totalFaccoes = [...new Set(operadoresData.map(op => op.faction))].length;
    const totalAtivos = operadoresData.filter(op => op.status === 'Ativo').length;

    const statElements = document.querySelectorAll('.hero-stat-value');
    if (statElements.length >= 3) {
        statElements[0].textContent = totalOperadores;
        statElements[1].textContent = totalFaccoes;
        statElements[2].textContent = totalAtivos;
    }
}

// ====================================
// NAVIGATION EVENT LISTENERS
// ====================================

function setupInternalNavigation() {
    const navBtns = document.querySelectorAll('.internal-nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

function returnToRosterTop() {
    const detailsSection = document.querySelector('.roster-details-wrapper-sf6');
    if (detailsSection) {
        detailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ====================================
// INITIALIZATION
// ====================================

function initRosterFranquiaPage() {
    renderRosterGrid();
    showOperadorDetails(operadoresData[0].id);
    updateHeroStats();
    
    setupInternalNavigation();
    setupCardAnimations();
    
    const ghostSlot = document.querySelector('[data-operador-id="1"]');
    if (ghostSlot) {
        ghostSlot.classList.add('selected');
    }
    
    console.log('%c🎮 ROSTER FRANQUIA - Call of Duty Loaded', 'color: #c1a3ff; font-size: 14px; font-weight: bold;');
    console.log(`%c⚔️ ${operadoresData.length} operadores carregados`, 'color: #9ef01a; font-size: 12px;');
    console.log('%c✅ Sistema de abas SPA implementado', 'color: #22c55e; font-size: 12px;');
    console.log('%c✅ Sistema de facções ativado', 'color: #22c55e; font-size: 12px;');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRosterFranquiaPage);
} else {
    initRosterFranquiaPage();
}