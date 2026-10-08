# 🏋️ Academia Workout Tracker (PWA)

Um aplicativo web em **Vanilla JS** projetado com arquitetura **Mobile-First** e foco extremo em **Gamificação** e **Design de Alta Fidelidade (UI/UX)**, inspirado nas mecânicas de retenção de jogos mobile (especialmente *Clash Royale*).

O objetivo deste projeto é fornecer uma ferramenta de rastreamento de treinos profissional, offline-first e visualmente engajante, eliminando a barreira da monotonia no ambiente de academia.

---

## 🏗️ Arquitetura do Sistema

O projeto foi construído para ser incrivelmente rápido e rodar inteiramente no lado do cliente (Client-Side), utilizando `localStorage` como banco de dados e Service Workers para suporte offline. 

Recentemente refatorado para suportar escalabilidade, a base de código modular dispensa bundlers (como Webpack) para manter o carregamento nativo veloz:

### 🗄️ JavaScript Modular (`JS/treino/`)
- `app.js`: Script de inicialização (Entry point).
- `db.js`: Gerenciamento central do estado da aplicação, schemas padrão e I/O de LocalStorage.
- `nav.js`: Motor gráfico de transição contínua (Swipe) e controle do Bottom Navigation Bar.
- `secao-ficha.js`: Lógica de tracking diário, timers globais e "Modo Foco".
- `secao-treinos.js`: Lógica do *Deck Builder* (Criação de fichas), seleção de exercícios e pesquisa.
- `secao-progresso.js`: Algoritmos de cálculo de 1RM, renderização de Radar Charts e o Tracker do Ciclo de 30 Dias.
- `secao-perfil.js`: Sistema de configurações, temas, backup/importação e cartões de compartilhamento.

### 🎨 CSS Cascata Modular (`Style/treino/`)
Agrupados e carregados via `@import` no `treino.css` raiz, preservando a especificidade da cascata:
1. `1-core.css`: Variáveis, tipografia, reset e layouts base.
2. `2-modals.css`: Interface de modais (Fim de treino, ajudas).
3. `3-foco-badges.css`: Modo Foco, contadores, tags e emblemas musculares.
4. `4-gamificacao.css`: Painéis de progresso, Weekly Planner e UI de atributos.
5. `5-premium-design.css`: Cards de exercícios, efeitos *Cyber-Glass* e menus interativos.
6. `6-maestria.css`: UI/UX focada no painel de maestria e progressão de tiers.
7. `7-nav-icons.css`: Ocultação e renderização fluida das rotas laterais e botões nativos.
8. `8-customizacao.css`: UI da vitrine de skins de timer, títulos CoD e molduras de avatar.

---

## 📌 Stack, Estrutura e Convenções do Projeto

> Esta seção consolida o conteúdo útil do antigo `Claude.md`, que foi **removido** por descrever uma versão antiga do projeto (referências a `JS/treino.js` monolítico, `franquiaexemplo.html` e rotação apenas A/B). Sempre que houver conflito, prevalece o `system_map.json`.

### 🧱 Stack Tecnológica
- **HTML5** — Estrutura semântica (shell + fragmentos modulares).
- **CSS3 Vanilla** — Sem frameworks de estilo (Tailwind é usado apenas em páginas/guia isolados). Variáveis globais em `style/main.css` e design tokens do app em `style/treino/1-core.css`.
- **JavaScript Vanilla (ES Modules)** — Sem frameworks nem bundlers; módulos carregados via `<script type="module">`.
- **localStorage** — Persistência de dados (100% client-side, sem backend).
- **Service Worker** — Cache offline interceptativo (`sw.js`).
- **Capacitor** — Embute o PWA no Android (`capacitor.config.json`, pasta `android/` ignorada pelo Git).
- **Fonte:** Rajdhani servida localmente (`Assets/FONTS/`) — pesos 300–900, para funcionamento offline. `Inter`/`Outfit` apenas em textos de formulário.

### 🗂️ Estrutura de Diretórios
```
Academia/
├── treino.html                ← Shell da aplicação (splash, viewport, bottom nav)
├── noticias.html, Banner.html, DESIGN.html, background-standalone.html, teste.html
├── sw.js                      ← Service Worker (cache offline)
├── manifest.json              ← Manifesto PWA
├── DESIGN.md                  ← Manual do sistema de design
├── Personalização-perfil.md   ← Roadmap da feature de personalização
├── Diretrizes/                ← Documentação e diretrizes (LEIA ANTES DE EDITAR)
│   ├── README.md              ← Este arquivo
│   ├── system_map.json        ← Índice arquitetural (primeira leitura)
│   ├── CHANGELOG.md           ← Registro obrigatório de todas as alterações
│   ├── Ícones.md              ← Biblioteca de ícones SVG (ler ao mexer em ícones)
│   └── navbar-inferior.html   ← Guia/preview da navbar mobile HUD
├── Planos/                    ← Planejamento e roadmap de features
├── JS/
│   ├── treino.js              ← Legado (não é carregado pelo treino.html)
│   └── treino/                ← Módulos ES6 do app (app, db, nav, loader, overlays, seções)
├── style/
│   ├── main.css, navbar.css, footer.css, ...   ← Estilos globais do site
│   ├── treino.css             ← Contêiner de @import dos módulos do app
│   └── treino/                ← 1-core … 8-customizacao + secoes/ (modulares)
├── componentes/               ← JS globais reutilizáveis (navbar, footer, temas, animações)
│   └── secoes/                ← Fragmentos HTML injetados pelo loader.js
└── Assets/                    ← BG, Exerciciosgif, FONTS, Images, Arenas, libs
```

### 💾 Persistência (`localStorage`)
Banco principal: chave **`academia_treino`** (constante `DB_KEY` em `JS/treino/db.js`). Estrutura produzida por `initDB()`:

```json
{
  "exercicios": [ { "id": "ex-a1", "nome": "Supino Articulado", "grupoMuscular": "Peito",
                    "series": 3, "repeticoes": "10", "carga": "", "descanso": 30,
                    "imagem": "./Assets/exerciciosgif/...", "tags": ["Multiarticular", "Máquina"] } ],
  "fichas":      { "A": ["ex-a1", "..."], "B": [], "C": [], "...": [], "J": [] },
  "aerobicos":   { "A": null, "...": null, "J": null },
  "historico":   { "2026-09-25": { "treino": "A", "concluido": true, "checks": ["ex-a1"] } },
  "conquistas":  [], "maestrias": {}, "fichasArquivadas": [], "selectedEmblems": [],
  "currentFichaWorkouts": 0, "currentCycleBreakdown": {}, "currentCycleStartDate": "YYYY-MM-DD",
  "cycleEvents": {}, "dashboard": { "suggestedWorkout": null, "newsRead": [] },
  "profileCustomization": { "nome": "", "handle": "", "banner": "roxo-neon", "barSkin": "default" }
}
```

Chaves auxiliares no mesmo `localStorage`: `workout_start_time`, `academia_theme`, `academia_view_mode`, `academia_calendar_view`, `academia_perfil_tab`, `timerStyle`, `academia_dev_mode`.

### 🧩 Componentes Reutilizáveis (`componentes/`)
- `navbar.js` — barra superior injetada em `<div id="navbar-container">`.
- `footer.js` — rodapé injetado em `<div id="footer-container">`.
- `thememanager.js` + `theme-integration.js` + `theme-animation-override.js` — troca de temas sobrescrevendo as variáveis do `:root`.
- `fade-in.js` + `fade-in-integration.js` + `scroll-animations.js` — animações de entrada; classes `scroll-fade-up|left|right` com `delay-1|2|3` e `.fade-in-element`.
- `roster.js` — lista de amigos/ofensivas do perfil.

### ➕ Como Adicionar Novas Páginas
1. Criar `nomepagina.html` na raiz.
2. Criar `style/nomepagina.css` e `JS/nomepagina.js`.
3. Incluir os links para `main.css`, `navbar.css` e `footer.css` no `<head>`.
4. Incluir os scripts dos componentes **antes** do script da página.
5. Adicionar os containers `<div id="navbar-container">` e `<div id="footer-container">`.
6. Se o arquivo entrar no escopo do app, registrar no `system_map.json` **e** no `CHANGELOG.md`.

### 🤖 Build do App Android (Capacitor) — LEIA ANTES DE COMPILAR
> **O erro clássico:** compilar no Android Studio e gerar um app "antigo". A causa é quase sempre a mesma — o Capacitor **não** embute a raiz do projeto nem o `www/` em tempo real. O APK lê exclusivamente a cópia estática em `android/app/src/main/assets/public/`, que **só é atualizada** quando você roda o comando de sync. Como a pasta `android/` é ignorada pelo Git, ela nunca recebe as mudanças automaticamente.

**Fluxo obrigatório antes de CADA build no Android Studio:**
1. **Espelhar as edições em `www/`** — a raiz é o seu ambiente de edição, mas o app roda a partir de `www/`. O entry point do app é **`www/index.html`** (cópia de `treino.html` com os CDNs trocados por `vendor/*` locais) — alterações no shell de `treino.html` precisam ser replicadas em `www/index.html`. Mantenha também os espelhos `www/JS/`, `www/componentes/`, `www/Style/`, `www/Assets/` idênticos à raiz.
2. **Rodar `npx cap sync android`** (na raiz do projeto) — copia `www/` → `android/app/src/main/assets/public/` e atualiza os plugins. Sem este passo, o APK continua empacotando o conteúdo antigo (templates, exercícios, GIFs e CSS desatualizados).
3. **No Android Studio:** `File > Sync Project with Gradle Files` → `Build > Clean Project` → `Run`.
4. **Se ainda aparecer algo antigo no aparelho:** o WebView mantém o Cache Storage do Service Worker (`sw.js`) e o `localStorage` entre instalações. Limpe os dados do app (Ajustes → Aplicativo → Armazenamento → Limpar dados) ou `adb shell pm clear com.academia.workout`.

**Sintomas do problema:** templates/exercícios/GIFs novos não aparecem, UI antiga, alterações de CSS/JS "não pegam" no aparelho mas funcionam no navegador. Verificação rápida: os arquivos de `www/` batem com os de `android/app/src/main/assets/public/`? Se não, falta um `npx cap sync android`.

### ⚠️ Observações Importantes
- **Sem backend:** todos os dados vivem no `localStorage` do navegador — nada é sincronizado entre dispositivos.
- **Imagens em base64:** o upload de imagem do exercício é convertido para base64; evitar imagens muito grandes (>2MB) para não estourar a cota do `localStorage`.
- **Responsivo:** todas as páginas devem funcionar em mobile (breakpoints: 768px e 480px).
- **Tema:** o ThemeManager pode alterar as variáveis do `:root`; usar sempre `var(--primary)` e afins, **nunca** cores hardcoded.
- **Ícones:** ao adicionar ou alterar qualquer ícone, ler `Diretrizes/Ícones.md` antes.

---

## ✨ Features e Funcionalidades

### 1. Motor de Gamificação Completo
- **Maestria de Exercícios (Tiers):** Inspirado no Clash Royale. Ao completar exercícios, o usuário ganha *XP* específico para aquele movimento, evoluindo de Bronze > Prata > Ouro > Elite.
- **Conquistas e Emblemas:** Insígnias desbloqueadas automaticamente através do Radar Chart (ex: *Monstro de Força*, *Mestre do Cardio*).
- **Ciclo de Treino de 30 Dias:** Uma barra de progressão que recompensa a consistência do usuário, reiniciando dinamicamente ao completar 30 treinos e adaptando sugestões.

### 2. Deck Builder (Criação de Fichas)
- Interface arrastar-e-soltar / clicar-e-adicionar semelhante a montar um "Deck de Cartas".
- Filtragem avançada por agrupamento muscular.
- Acesso rápido aos detalhes do exercício, gifs locais, notas técnicas e calculadora de repetições.

### 3. Workout Tracking Diário
- **Ficha do Dia Inteligente:** O algoritmo analisa o histórico passado e sugere automaticamente a próxima letra da ficha (A, B, C...).
- **Modo Foco:** Uma UI livre de distrações, com temporizadores automáticos de descanso que avançam as séries sequencialmente sem o usuário tocar na tela.
- **Gráficos e Analíticos:** Acompanhamento de Volume Carga, Calculadora de 1RM baseada na fórmula de Brzycki e um Gráfico Radar de Atributos (Força, Resistência, Equilíbrio, Cardio, Core).

### 4. PWA Offline e Social
- **Service Worker Interceptativo:** O aplicativo continua 100% responsivo mesmo em "Modo Avião", retornando resíduos nativos.
- **Share Card Gerado via Canvas:** Exporta uma imagem estilizada resumindo o treino finalizado, PRs alcançados e estatísticas de XP prontas para o Instagram Stories.

### 5. Central de Notícias, Atualizações e Guias
- **Navegação Modular por Abas:** Contém abas dedicadas a Notícias, Notas de Atualização de Versões e Guias técnicos com chaveamento instantâneo.
- **Detalhamento por Deslize Lateral (Slide-in):** As notícias individuais e notas de atualização abrem em painéis imersivos que deslizam da direita para a esquerda. Conta com controle rigoroso de visibilidade (`visibility`) e aceleração por hardware para evitar vazamento visual de cabeçalhos fixados (`position: fixed`) no resto do app.
- **Paginação Fluida:** Navegação interna que permite ao usuário folhear os artigos sequencialmente (Mais Antigos / Mais Recentes) com transições suaves e recarregamento dinâmico do conteúdo em tela cheia.

---

## 📱 UI / UX Design Guidelines

O projeto mantém diretrizes rígidas de UI/UX para não parecer uma "página da web", mas sim um aplicativo AAA de Loja de Aplicativos.

- **Navegação de Câmera Deslizante (Viewport + Strip):** O aplicativo abandonou a lógica de ocultar telas com `display: none`. Agora, usa-se um modelo físico: a tela é a lente (`.section-viewport`), e todo o conteúdo é uma fita contínua (`.section-strip`). Ao tocar no Bottom Nav, o `translateX` da fita inteira desliza suavemente (`transitionTo()`), eliminando artefatos de renderização e permitindo gestos horizontais de swipe naturais (como o WhatsApp e Clash Royale).
- **Gestão de Scroll Independente:** O scroll principal da página HTML/Body é bloqueado (`overflow: hidden`). Cada `.section-slide` tem sua própria barra de rolagem (`overflow-y: auto; overscroll-behavior-y: contain`). Isso garante transições laterais sedosas independente de o usuário estar rolando o conteúdo para cima ou para baixo.
- **Backgrounds Multi-Temáticos (Estilo Clash Royale):** Para quebrar a monotonia de um fundo monolítico, longas áreas de rolagem devem usar a arquitetura de blocos divididos. 
  - Utilize a estrutura HTML: `<div class="theme-section theme-NOME"><div class="theme-bg"></div><div class="theme-content">...</div></div>`.
  - Essa técnica utiliza CSS Puro (`filter: hue-rotate()`) aplicado na mesma imagem estática base (`BG-roxo-vertical.jpg`) para re-colorir dinamicamente a área (ex: `.theme-turquesa`, `.theme-ouro`) sem exigir o carregamento de novos e pesados assets. O conteúdo sempre fica em `.theme-content` para não sofrer distorção de cores.
- **Padrão Sub-abas "Pílula Flutuante" (Floating Pill):** Quando uma seção for dividida em abas (ex: "Exercícios / Montar Ficha" na seção Treinos), as sub-abas utilizam a marcação `.treino-tabs-section.section-subtabs`. O layout padrão é uma pílula estática (`position: relative`) centralizada no topo da área útil (`margin: 20px 0 24px 0`). **NÃO use `position: sticky` ou fundos estendidos de 100vw**; a barra deve apenas rolar e sumir naturalmente quando o usuário descer pela tela, mantendo a tela desobstruída e limpa para as listas de exercícios.
- **Glassmorphism e Neumorfismo:** O uso pesado de fundos com `backdrop-filter: blur()`, overlays semi-transparentes (`rgba(255,255,255, 0.05)`) e dropshadows elétricos coloridos confere um look *Cyber-Glass*. Garantir que o `--card-bg` base possua opacidade suficiente (ex: `rgba(10,5,20,0.6)`) para não gerar conflito de leitura com a textura animada do fundo.
- **Iconografia Consistente:** Absolutamente **NENHUM EMOJI** deve ser usado para funções de UI, apenas para gamificação estrita (textos motivacionais). Todos os ícones de ação são `SVGs inline stroke`, que herdam a cor nativa através da tag CSS `stroke: currentColor`. **⚠️ OBRIGATÓRIO: sempre que for necessário ADICIONAR ou ALTERAR um ícone, leia primeiro o arquivo `Diretrizes/Ícones.md`** — ele é a fonte única de todos os ícones do projeto e contém as regras de atributos, tamanhos e variantes. Nunca crie ou edite um ícone sem consultá-lo.
- **Padrão de Dropdowns (Selects):** Todos os dropdowns (`<select>`) devem seguir o estilo escuro premium: fundo escuro (`#111` ou similar), letras brancas (`#ffffff`), `appearance: none` para remover o estilo nativo do navegador, e uma seta customizada em SVG como imagem de fundo. Isso garante consistência visual e evita que o navegador renderize fundos brancos padrão.
- **Feedback Haptico e Visual:** Botões escalam (`scale(0.95)`) ao serem pressionados.
- **Padrão de Nomenclatura BEM (Daqui para frente):** Para novos componentes e seções, utilize estritamente o padrão **BEM (Block__Element--Modifier)**. Ex: `.loja-card`, `.loja-card__price`, `.loja-card--premium`. Não reescreva o CSS legado, apenas aplique o BEM em adições futuras.

---

## 🤖 Guia para Agentes de IA

Se você é um assistente de inteligência artificial manipulando esta base de código:
1. **Leia o `system_map.json` primeiro:** É o índice arquitetural leve do projeto. Uma única leitura revela qual arquivo abrir para qualquer tarefa — sem varreduras cegas de diretório.
2. **SEMPRE REGISTRE AS ALTERAÇÕES FEITAS no `CHANGELOG.md`:** É obrigação inegociável gravar e versionar toda alteração concluída, sob os padrões descritos no topo do próprio Changelog. Isso inclui mudanças de código **e** de documentação/diretrizes/configuração. Nunca finalize uma sessão com mudanças não documentadas. Se mexeu no `system_map.json`, incremente também o `version` dele.
3. **Leia `Diretrizes/Ícones.md` sempre que for necessário adicionar ou alterar um ícone:** antes de criar/editar qualquer SVG de UI, consulte a biblioteca oficial de ícones para não quebrar o ecossistema de `stroke="currentColor"` e não duplicar ícones existentes.
4. Não crie códigos monolíticos. Tudo deve ser feito sob a filosofia modular instalada na pasta `treino/`.
5. **Padrão CSS BEM:** Para qualquer novo estilo ou componente, é **obrigatório** o uso da metodologia BEM para evitar poluição da cascata global.
6. **Leia o `DESIGN.md` (raiz do projeto)** antes de criar ou alterar qualquer elemento visual — ele é o manual completo de tokens, animações e blueprints do design system.
7. **Informe prazo e progresso em tarefas demoradas:** quando a tarefa puder demorar (diagnóstico de bug difícil, migração multi-arquivo, verificação visual exaustiva), **não execute em silêncio até o fim**. Logo no início, diga ao usuário uma estimativa de conclusão e quantos passos restam (ex.: `≈4 passos: pins de CSS → medição CDP → regressões → documentação`) e vá atualizando o progresso a cada passo concluído — o usuário deve sempre saber onde a tarefa está e quanto falta.

---

## 🗺️ Manutenção do Índice Arquitetural (`system_map.json`)

O arquivo `Diretrizes/system_map.json` é o **mapa vivo** do projeto. Ele deve ser atualizado sempre que a estrutura de arquivos mudar. Abaixo, os gatilhos e procedimentos:

### ⚡ Quando atualizar

| Situação | O que fazer no `system_map.json` |
| :--- | :--- |
| **Novo arquivo JS** em `JS/treino/` | Adicionar entrada em `system_modules` ou criar um novo módulo |
| **Novo arquivo CSS** em `style/treino/` | Adicionar objeto `{ file, purpose }` em `styling_manifest.modules` |
| **Novo componente** em `componentes/` | Adicionar objeto `{ file, purpose }` em `components.modules` |
| **Novo asset** (GIF, fonte, imagem) | Atualizar a descrição do diretório correspondente em `assets.directories` |
| **Novo documento** em `Diretrizes/` ou `Planos/` | Adicionar entrada em `documentation.files` ou `plans.files` |
| **Arquivo renomeado ou removido** | Localizar e renomear/remover a entrada correspondente |
| **Nova funcionalidade** que cruza múltiplos arquivos | Adicionar uma nova chave em `ia_quick_reference` com o atalho de edição |

### 📝 Procedimento padrão

```
1. Edite a seção relevante do system_map.json
2. Incremente o campo "version" (ex: "1.8.0" → "1.9.0")
3. Atualize "last_updated" para a data de hoje (formato YYYY-MM-DD)
4. Registre a atualização no CHANGELOG.md
```

> **Regra de ouro:** O `system_map.json` deve sempre refletir 100% da estrutura real de arquivos do projeto. Um índice desatualizado é pior do que não ter índice.

> **Regra de registro (obrigatória):** **SEMPRE REGISTRE AS ALTERAÇÕES FEITAS** — em `Diretrizes/CHANGELOG.md`, imediatamente após concluí-las, sem exceção. Vale para código, documentação, diretrizes e configuração. Nunca finalize uma sessão com mudanças não documentadas.

---

## 🔗 Resumo das Regras Absolutas

| Regra | Onde ler/aplicar |
| :--- | :--- |
| Antes de compilar no Android Studio | `npx cap sync android` (seção "Build do App Android") |
| Sempre registrar as alterações feitas | `Diretrizes/CHANGELOG.md` (topo do arquivo) |
| Ler antes de mexer no código/arquitetura | `Diretrizes/system_map.json` |
| Ler antes de adicionar ou alterar um ícone | `Diretrizes/Ícones.md` |
| Ler antes de criar/alterar elementos visuais | `DESIGN.md` (raiz do projeto) |
| Atualizar ao mudar a estrutura de arquivos | `Diretrizes/system_map.json` (procedimento acima) |
