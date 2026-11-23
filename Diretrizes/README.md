# 🏋️ Academia Workout Tracker (PWA)

Um aplicativo web em **Vanilla JS** projetado com arquitetura **Mobile-First** e foco extremo em **Gamificação** e **Design de Alta Fidelidade (UI/UX)**, inspirado nas mecânicas de retenção de jogos mobile (especialmente *Clash Royale*).

O objetivo deste projeto é fornecer uma ferramenta de rastreamento de treinos profissional, offline-first e visualmente engajante, eliminando a barreira da monotonia no ambiente de academia.

---

## 🏗️ Arquitetura do Sistema

O projeto foi construído para ser incrivelmente rápido e rodar inteiramente no lado do cliente (Client-Side), utilizando `localStorage` como banco de dados e Service Workers para suporte offline. 

Recentemente refatorado para suportar escalabilidade, a base de código modular dispensa bundlers (como Webpack) para manter o carregamento nativo veloz:

### 🗄️ JavaScript Modular (`Legacy/JS/treino/`)
- `app.js`: Script de inicialização (Entry point).
- `db.js`: Gerenciamento central do estado da aplicação, schemas padrão e I/O de LocalStorage.
- `nav.js`: Motor gráfico de transição contínua (Swipe) e controle do Bottom Navigation Bar.
- `secao-ficha.js`: Lógica de tracking diário, timers globais e "Modo Foco".
- `secao-treinos.js`: Lógica do *Deck Builder* (Criação de fichas), seleção de exercícios e pesquisa.
- `secao-progresso.js`: Algoritmos de cálculo de 1RM, renderização de Radar Charts e o Tracker do Ciclo de 30 Dias.
- `secao-perfil.js`: Sistema de configurações, temas, backup/importação e cartões de compartilhamento.

> **Nota (2026-10-15):** a versão **atual** é a React em `src-app/` — os caminhos
> acima são da versão **legada** (movida integralmente para `Legacy/`, sem alterações).

### 🎨 CSS Cascata Modular (`Legacy/style/treino/`)
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
- **Capacitor** — Embute o app no Android (`capacitor.config.json`, projeto em `android/`, **versionado** desde a v4.75.0 para o build do APK no CI).
- **APK automático** — `.github/workflows/android-build.yml` gera o APK a cada push na `main` e publica numa release do repo público `DECEPTIVONN/EvoFit-releases` com o `latest.json` consumido pelo auto-update do app (ver seção **APK** abaixo).
- **Fonte:** Rajdhani servida localmente (`Assets/FONTS/`) — pesos 300–900, para funcionamento offline. `Inter`/`Outfit` apenas em textos de formulário.

### 📦 APK e atualização automática (v4.75.0)

| Variável | Valor no projeto |
| --- | --- |
| `APP_NAME` | `EvoFit` |
| `PACKAGE_ID` | `com.academia.workout` (nunca mude após publicar) |
| `OWNER` / `REPO_CODE` | `DECEPTIVONN` / `Academia` (repo privado do código) |
| `REPO_RELEASES` | `DECEPTIVONN/EvoFit-releases` (repo **público** que hospeda APK + `latest.json`) |
| `MAIN_BRANCH` | `main` |
| `WRAPPER` | Capacitor 8 (`@capacitor/cli` na raiz de `package.json`) |

**Build local do APK**

```bash
npm ci && npm ci --prefix src-app
npm run build
npx cap sync android
cd android && ./gradlew :app:assembleDebug
# saída: android/app/build/outputs/apk/debug/app-debug.apk
```

**Publicação** — qualquer push na `main` roda `.github/workflows/android-build.yml`, valida o `versionCode` do APK com `aapt2` e publica a release `v<versão>-vc<code>-<sha>` no `REPO_RELEASES` com o APK, o `latest.json` e as notas da primeira seção do `CHANGELOG.md`. Requer o secret `EVOFIT_RELEASES` (PAT fine-grained com `contents: write` no repo de releases); `RELEASE_TOKEN` também é aceito como alternativa.

**Regras**

- Toda mudança publicável sobe `versionCode` (inteiro, só sobe) e `versionName` (semver) em `android/app/build.gradle`, no mesmo commit. É o `versionCode` que decide se há atualização.
- Todos os builds (local e CI) assinam com o `debug.keystore` **versionado na raiz** (`alias androiddebugkey`, senha `android`) e o `debug.keystore.base64` é a cópia para repositórios/segredos. Sem a mesma chave o APK novo não instala por cima do antigo.
- O FileProvider `${applicationId}.fileprovider` + `res/xml/file_paths.xml` (`cache-path` `updates/`) e a permissão `REQUEST_INSTALL_PACKAGES` são obrigatórios para instalar o APK baixado.
- A UI de atualização vive em **Ajustes → Sobre e Atualizações** e só é montada no APK Android (`isNativeAndroid()`); na web nada aparece.

### 🗂️ Estrutura de Diretórios
```
Academia/
├── src-app/                   ← ⭐ VERSÃO ATUAL (React v4) — app que roda/deploya
├── Legacy/                    ← 📦 VERSÃO LEGADA (Vanilla JS) movida em 2026-10-15
│   ├── treino.html            ← Shell da aplicação legada (splash, viewport, bottom nav)
│   ├── noticias.html          ← Página legada de notícias
│   ├── sw.js, manifest.json   ← Service Worker e Manifesto PWA da versão legada
│   ├── JS/                    ← treino.js (arquivo morto) + treino/ (módulos ES6)
│   ├── style/                 ← main.css, navbar.css, treino.css + treino/ (modular)
│   ├── componentes/           ← JS globais (navbar, footer, temas) + secoes/ (fragmentos)
│   ├── Assets/                ← BG, Exerciciosgif, FONTS, Images, Arenas, Sounds, libs
│   └── cache/                 ← Cache interno do SW legado
├── Diretrizes/                ← Documentação e diretrizes (LEIA ANTES DE EDITAR)
│   ├── README.md              ← Este arquivo
│   ├── system_map.json        ← Índice arquitetural (primeira leitura)
│   ├── CHANGELOG.md           ← Registro obrigatório de todas as alterações
│   ├── DESIGN.md              ← Manual do sistema de design (tokens/animações/blueprints)
│   ├── Ícones.md              ← Biblioteca de ícones SVG (ler ao mexer em ícones)
│   └── context.md             ← Continuidade de sessão (histórico; ver nota de desatualização)
├── Planos/                    ← Planejamento e roadmap (inclui Personalização-perfil.md)
├── Referências/               ← Material de referência (navbar-inferior.html)
├── www/                       ← Espelho da versão legada p/ o Capacitor (entry: www/index.html)
└── Assets/, style/, JS/, ...  ← (movidos para Legacy/ — ver nota abaixo)
```

> **📦 Reorganização de 2026-10-15 (pasta `Legacy/`):** todo o app Vanilla JS foi
> movido da raiz para `Legacy/` (`treino.html`, `noticias.html`, `JS/`, `style/`,
> `componentes/`, `Assets/`, `sw.js`, `manifest.json`, `cache/`) **sem nenhuma
> alteração de código** — os caminhos são todos relativos, então a versão legada
> continua funcionando ao abrir `Legacy/treino.html` (verificado: 200 refs OK +
> 12/12 HTTP 200) e serve para consultas futuras, **sem se misturar com a versão
> atual (`src-app/`)**. O `www/` (entrada do Capacitor) permanece na raiz.
> Futuras edições no shell legado passam a ser feitas em `Legacy/treino.html`
> e replicadas em `www/index.html`.

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

### ➕ Como Adicionar Novas Páginas (versão legada)
1. Criar `nomepagina.html` dentro de `Legacy/`.
2. Criar `Legacy/style/nomepagina.css` e `Legacy/JS/nomepagina.js`.
3. Incluir os links para `main.css`, `navbar.css` e `footer.css` no `<head>`.
4. Incluir os scripts dos componentes **antes** do script da página.
5. Adicionar os containers `<div id="navbar-container">` e `<div id="footer-container">`.
6. Se o arquivo entrar no escopo do app, registrar no `system_map.json` **e** no `CHANGELOG.md`.
7. Se for uma página da **versão atual**, crie o componente em `src-app/src/` (não na raiz).

### 🤖 Build do App Android (Capacitor) — LEIA ANTES DE COMPILAR
> **O erro clássico:** compilar no Android Studio e gerar um app "antigo". A causa é quase sempre a mesma — o Capacitor **não** embute a raiz do projeto nem o `www/` em tempo real. O APK lê exclusivamente a cópia estática em `android/app/src/main/assets/public/`, que **só é atualizada** quando você roda o comando de sync. Como a pasta `android/` é ignorada pelo Git, ela nunca recebe as mudanças automaticamente.

**Fluxo obrigatório antes de CADA build no Android Studio:**
1. **Espelhar as edições em `www/`** — o app legado roda a partir de `www/` (a partir de 2026-10-15 a fonte de edição dele é **`Legacy/`**, não mais a raiz). O entry point do app é **`www/index.html`** (cópia de `Legacy/treino.html` com os CDNs trocados por `vendor/*` locais) — alterações no shell de `Legacy/treino.html` precisam ser replicadas em `www/index.html`. Mantenha também os espelhos `www/JS/`, `www/componentes/`, `www/Style/`, `www/Assets/` idênticos aos de `Legacy/`.
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
6. **Leia o `Diretrizes/DESIGN.md`** antes de criar ou alterar qualquer elemento visual — ele é o manual completo de tokens, animações e blueprints do design system.
7. **DIRETRIZ OBRIGATÓRIA — informe prazo e progresso de conclusão:** esta é uma **diretriz permanente do projeto** (registrada neste README por decisão de 2026-10-15 e aplicável a toda sessão). Quando a tarefa puder demorar (diagnóstico de bug difícil, migração multi-arquivo, reorganização de pastas, adaptação de layout, verificação visual exaustiva), **não execute em silêncio até o fim**:
   - **Antes de começar:** diga ao usuário uma estimativa de conclusão e quantos passos restam (ex.: `≈7 passos: mover legado → verificar legado → baseline React → desktop Músicas → desktop Missões → desktop Notícias → documentação`).
   - **Durante a execução:** informe o progresso a cada passo concluído (ex.: `Passo 3 de 7 — concluído ✔`), sempre indicando o que já foi feito e o que falta.
   - **Ao final:** confirme a conclusão de todos os passos e o resultado das verificações.
   O usuário deve **sempre** saber onde a tarefa está e quanto falta — falhar nessa comunicação é descumprir uma regra do projeto, mesmo que o código esteja correto.
8. **DIRETRIZ OBRIGATÓRIA — em caso de dúvida, pergunte ao usuário:** se houver qualquer ambiguidade sobre escopo, formato, prioridade, qual arquivo editar, se um caminho/código existe ou se uma mudança é segura, **pare e pergunte** antes de agir. Adivinhar e prosseguir em silêncio é descumprir uma regra do projeto — mesmo que o resultado pareça correto. Nunca assuma; sempre confirme quando não tiver certeza.
9. **DIRETRIZ OBRIGATÓRIA — teste apenas no final:** não rode testes, builds, lints ou sondas intermediárias a cada passo. Execute a validação completa (typecheck, oxlint, build, doc-lint, sonda CDP quando aplicável) **uma única vez, ao final** da implementação, quando todos os passos estiverem concluídos. Reportar falhas no meio da execução interrompe o fluxo e gera ruído. Se um passo exigir verificação de sanidade pontual (ex.: parse de JSON), essa é permitida; a validação completa, não.
10. **DIRETRIZ OBRIGATÓRIA — progresso em tarefas grandes (minutos, porcentagem e fases):** para tarefas grandes (migração multi-arquivo, reorganização de pastas, adaptação de layout, verificação visual exaustiva), além da regra 7, informe ao longo da execução:
   - **Estimativa em minutos** do que falta (ex.: "≈12 min restantes").
   - **Porcentagem concluída** (ex.: "60% — 3 de 5 fases").
   - **Fase atual** (ex.: "Fase 2/5 — movendo legado").
   O usuário deve sempre saber quanto tempo falta, quanto já foi feito e em qual etapa a tarefa está.
11. **DIRETRIZ OBRIGATÓRIA — todo modal/overlay/tela novo nasce com animação de entrada E de saída:** qualquer modal, overlay, sheet, popover, dropdown, drawer ou tela condicional criada ou alterada precisa de transição suave nos **dois sentidos** (≈220 ms, mesma curva), montada por `useModalPresence`/`usePresenceValue` (`src-app/src/hooks/useModalPresence.ts`) com a classe `.is-closing`, respeitando `prefers-reduced-motion`. `{open && …}`, `display: none` seco e desmontar no clique de fechar são proibidos — o componente fica montado durante a saída. Regra completa (com receita de código) na **§12.4 do `Diretrizes/DESIGN.md`**.

---

## 🗺️ Manutenção do Índice Arquitetural (`system_map.json`)

O arquivo `Diretrizes/system_map.json` é o **mapa vivo** do projeto. Ele deve ser atualizado sempre que a estrutura de arquivos mudar. Abaixo, os gatilhos e procedimentos:

### ⚡ Quando atualizar

| Situação | O que fazer no `system_map.json` |
| :--- | :--- |
| **Novo arquivo do app atual** (`src-app/src/`) | Adicionar entrada em `react_app.entry_points` (ou `core_db`) e o atalho em `ia_quick_reference.atual_src_app` |
| **Novo arquivo legado** (`Legacy/JS/treino/`, `Legacy/style/treino/`, `Legacy/componentes/`) | Adicionar em `system_modules` / `styling_manifest.modules` / `components.modules` **e** o atalho em `ia_quick_reference.legado_referencia` |
| **Novo asset** (GIF, fonte, imagem) | `Legacy/Assets/` → `assets.directories`; app atual → `react_app.public_assets` |
| **Novo documento** em `Diretrizes/`, `Planos/` ou `Referências/` | Adicionar entrada em `documentation.files` ou `plans.files` |
| **Arquivo renomeado ou removido** | Localizar e renomear/remover a entrada correspondente (marque `[REMOVIDO vX.Y]` se for histórico útil) |
| **Nova funcionalidade** que cruza múltiplos arquivos | Adicionar uma nova chave em `ia_quick_reference` (o "onde editar" — 1 linha) |
| **Registro de uma mudança** | `Diretrizes/CHANGELOG.md` — **não** dentro do `purpose` de uma entrada deste JSON |

> **Convenção anti-duplicação (a partir de 2026-10-18):** as strings `purpose` deste arquivo devem ser **curtas e atemporais** ("o que é / onde mexer"). O histórico por versão (`vX.Y: ...`) pertence **exclusivamente** ao `Diretrizes/CHANGELOG.md` — antes desta data o `system_map` havia acumulado centenas de referências de versão dentro dos `purpose`, virando um segundo changelog de 130 KB.

### 📝 Procedimento padrão

```
1. Edite a seção relevante do system_map.json
2. Incremente o campo "version" (ex: "1.8.0" → "1.9.0")
3. Atualize "last_updated" para a data de hoje (formato YYYY-MM-DD)
4. Registre a atualização no CHANGELOG.md
5. Rode `npm run lint:docs` (nenhum caminho citado pode estar quebrado)
```

### 🔎 Verificação automática (doc-lint)

Um índice com caminho errado falha em silêncio — foi assim que este `system_map` passou a apontar para a versão legada por várias sessões sem que ninguém notasse. Para tornar isso impossível de passar batido, existe `tools/doc-lint.mjs`, que varre o `system_map.json`, extrai **todo caminho citado** (em `entry_points`, `system_modules`, `styling_manifest`, `assets`, `documentation`, `plans`, `react_app` e `ia_quick_reference`) e confere se ele existe de fato no repositório:

```powershell
npm run lint:docs        # na raiz do repositório
```

- **Sai 1** (falha) se qualquer caminho citado não existir — rode ao fim de qualquer alteração no índice.
- Também lista, **como informativo** (não falha), os caminhos que só existem sob `Legacy/` (formato curto da doc legada) ou sob `src-app/src/`.
- Somente leitura: nunca altera arquivos. Aceita um caminho de JSON como argumento para validar uma cópia.

> **Regra de ouro:** O `system_map.json` deve sempre refletir 100% da estrutura real de arquivos do projeto. Um índice desatualizado é pior do que não ter índice.

> **Regra de registro (obrigatória):** **SEMPRE REGISTRE AS ALTERAÇÕES FEITAS** — em `Diretrizes/CHANGELOG.md`, imediatamente após concluí-las, sem exceção. Vale para código, documentação, diretrizes e configuração. Nunca finalize uma sessão com mudanças não documentadas.

---

## 🔗 Resumo das Regras Absolutas

| Regra | Onde ler/aplicar |
| :--- | :--- |
| **Informar estimativa e progresso de conclusão em tarefas demoradas** | `Diretrizes/README.md` → Guia para Agentes, **regra 7 (diretriz obrigatória)** |
| **Em caso de dúvida, perguntar ao usuário** | `Diretrizes/README.md` → Guia para Agentes, **regra 8 (diretriz obrigatória)** |
| **Testar apenas no final** | `Diretrizes/README.md` → Guia para Agentes, **regra 9 (diretriz obrigatória)** |
| **Progresso em tarefas grandes (minutos, porcentagem, fases)** | `Diretrizes/README.md` → Guia para Agentes, **regra 10 (diretriz obrigatória)** |
| Antes de compilar no Android Studio | `npx cap sync android` (seção "Build do App Android") |
| Sempre registrar as alterações feitas | `Diretrizes/CHANGELOG.md` (topo do arquivo) |
| Ler antes de mexer no código/arquitetura | `Diretrizes/system_map.json` |
| Ler antes de adicionar ou alterar um ícone | `Diretrizes/Ícones.md` |
| Ler antes de criar/alterar elementos visuais | `Diretrizes/DESIGN.md` |
| Versão atual do app (React) vs. legado (Vanilla) | `src-app/` vs. `Legacy/` (nunca misturar) |
| Atualizar ao mudar a estrutura de arquivos | `Diretrizes/system_map.json` (procedimento acima) |
| Validar os caminhos do índice após qualquer alteração | `npm run lint:docs` (`tools/doc-lint.mjs`) |
