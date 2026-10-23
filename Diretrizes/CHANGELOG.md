# Changelog do Projeto Academia

> **📋 INSTRUÇÃO OBRIGATÓRIA PARA AGENTES DE IA:** Toda alteração deve ser registrada neste arquivo. Use formato [vX.X.X] - YYYY-MM-DD e tags [Added], [Changed], [Fixed].

## [v4.43.6] - 2026-10-23

**Onboarding: predefinição de treino aplicada nas fichas.**

### Changed
- `src-app/src/features/auth/OnboardingScreen.tsx`: ao selecionar um objetivo (exceto "Treino personalizado"), aplica o template correspondente (`applyTemplate`) nas fichas A/B, conforme o mapeamento objetivo→template.

## [v4.43.5] - 2026-10-23

**Onboarding: dados salvos, botão mais escuro e estilo da mensagem de evolução.**

### Fixed
- `src-app/src/features/profile/useProfileState.ts`: `update()` cria o estado de perfil se ausente, garantindo que os dados do onboarding sejam salvos (e o onboarding exibido apenas uma vez).
- `src-app/src/features/auth/OnboardingScreen.tsx`: botão "Continuar" com roxo mais escuro (`#5b21b6`).
- `src-app/src/features/workout/treinos/DetalhesPecaModal.tsx`: mensagem de evolução vazia passa a usar o mesmo estilo/fundo (`.cr-description-box`) da sub-aba de descrição.

## [v4.43.4] - 2026-10-23

**Evolução de força: mensagem inicial e gráfico alinhado ao editor.**

### Changed
- `src-app/src/features/workout/treinos/DetalhesPecaModal.tsx`: quando não há histórico de carga, exibe "Registre sua evolução de carga em Detalhes para ver sua evolução aqui."; gráfico passa a usar a mesma estrutura (`.chart-bar-wrap`/`.chart-val`/`.chart-bar`/`.chart-date`) do editor de exercício.
- `src-app/src/features/workout/treinos/ExercicioFormModal.tsx`: ícone de evolução de carga (📈) substituído por SVG no padrão do site (stroke/currentColor).

## [v4.43.3] - 2026-10-23

**Correção: onboarding do primeiro acesso não aparecia após login.**

### Fixed
- `src-app/src/core/db/bootstrap.ts`: `bootstrap()` retorna `Promise.resolve()` quando já iniciado, evitando `.then` em `undefined` (que impedia `bootstrapLoading` de virar `false`).
- `src-app/src/App.tsx`: `OnboardingGate` passa a exibir o onboarding quando o usuário está logado e não concluiu o onboarding, mesmo que o `profileState` ainda não tenha carregado.

## [v4.43.2] - 2026-10-23

**Reset único de dados legados: vinculação automática da sync key à conta.**

### Added
- `src-app/src/main.tsx`: reset único (versão `v4.43.2-account-sync`) que limpa localStorage, sessionStorage e bancos IndexedDB locais, forçando novo login e início "do zero". Garante que dispositivos com sync keys antigas migrem para o sistema de vinculação automática.

### Changed
- Todos os dados salvos anteriormente são removidos; usuários precisam fazer login novamente.

## [v4.43.1] - 2026-10-23

**Vinculação da sync key à conta, sync de preferências e foto Google.**

### Added
- `src-app/src/core/sync/supabase-client.ts`: `deriveSyncKeyForUser()` deriva chave estável a partir do id/e-mail da conta autenticada.
- `src-app/src/App.tsx`: ao logar, a sync key é derivada da conta (mesma conta = mesmos dados); foto de perfil da conta Google é aplicada ao perfil do app.

### Changed
- `src-app/src/core/sync/sync-manager.ts`: snapshot passa a incluir `prefs` (tema, player, sidebar, lock, navbar, auto-fullscreen); aplicação restaura-as e dispara eventos de atualização.
- `src-app/src/features/profile/profile-data.ts`, `src-app/src/App.tsx`: mudanças de tema e sidebar disparam `academia:prefs-changed` para auto-push.

## [v4.43.0] - 2026-10-23

**Peças faltantes da arquitetura de dados (dados.md): banner offline, coalescência e comparação canônica.**

### Added
- `src-app/src/lib/canonical.ts`: `cleanAndSortObject`, `safeStringify` e `canonicalEqual` para comparação profunda de snapshots.
- `src-app/src/features/sync/OfflineSyncBanner.tsx`: indicador de modo offline / mutações pendentes, montado no `App.tsx`.

### Changed
- `src-app/src/core/sync/sync-manager.ts`: `pushSnapshot` cancela o push quando o snapshot é canonicamente idêntico ao último salvo; `applySnapshot` marca o snapshot recebido como último salvo (evita loop ping-pong).
- `src-app/src/core/sync/offline-queue.ts`: coalescência (state folding) no enfileiramento e no flush — mutações pendentes do mesmo `syncKey` são agrupadas e apenas a mais recente é enviada.

## [v4.42.9] - 2026-10-23

**Correcao adicional do compartilhamento: remover render duplicado e reduzir escala.**

### Fixed
- `src-app/src/features/gamification/ShareModal.tsx`: removido pre-render duplicado que podia travar o site; escala do html2canvas reduzida para 1.5.

## [v4.42.8] - 2026-10-23

**Correcao do compartilhamento: botao habilitado apos pre-render.**

### Fixed
- `src-app/src/features/gamification/ShareModal.tsx`: o botao "COMPARTILHAR" ficava desabilitado indefinidamente porque o pre-render nao atualizava o estado `imageReady`; agora o arquivo PNG e gerado no pre-render (com delay para o DOM montar) e habilita o botao.

## [v4.42.7] - 2026-10-22

**Compartilhamento nativo alinhado ao Share.md.**

### Changed
- `src-app/src/features/gamification/ShareModal.tsx`: imagem pre-gerada em PNG; payload inclui `url` e link no texto; fallback com botoes WhatsApp/X/Facebook quando nao ha Web Share API.
- `src-app/src/lib/native-share.ts`: ja existente, usado com canShare/AbortError.
- `src-app/index.html`: meta tags Open Graph/Twitter para previa do link.

## [v4.42.6] - 2026-10-22

**Evolucao de forca (carga): quarta aba nos detalhes do exercicio.**

### Changed
- `src-app/src/features/workout/treinos/DetalhesPecaModal.tsx`: adicionada 4a pagina (dot) com o grafico de evolucao de carga (historicoCargas), alem da edicao de exercicio que ja registrava o historico.

## [v4.42.5] - 2026-10-22

**Modal de exercício: scroll e fundo preto.**

### Fixed
- `src-app/src/legacy-style/treino/2-modals.css`: `.modal-form` (formulário de exercício) deixou `overflow: hidden` (que impedia rolar até as observações) e passou a `overflow-y: auto` com `max-height: 90vh`; fundo roxo (`rgba(10,5,20,0.85)`) substituído pelo preto `#111`, alinhado ao tom da aba Minha Ficha.

## [v4.42.4] - 2026-10-22

**Home: modal de Ciclo com heatmap e breakdown.**

### Added
- `src-app/src/features/dashboard/DashboardFeature.tsx`: clicar no card de ciclo abre um modal com heatmap dos 30 dias do ciclo atual (dias concluídos destacados) e o breakdown por ficha.

## [v4.42.3] - 2026-10-22

**Ofensiva: cinza em novo dia até concluir o treino do dia.**

### Changed
- `src-app/src/features/dashboard/DashboardFeature.tsx`: quando a ofensiva é maior que 1 dia, o botão de ofensiva exibe o estado cinza (`.dash-streak-btn--off`) ao abrir o app em um novo dia, tornando-se colorido após a conclusão do treino do dia (`completedToday`). O período válido para aumentar a ofensiva permanece 00:00–23:59 de cada dia (data do treino concluído).

## [v4.42.2] - 2026-10-22

**Ajustes de perfil: chave de sync única, nome=handle, destaque funcional, ano de ingresso e ofensivas reais.**

### Added
- `src-app/src/core/sync/supabase-client.ts`: `getSyncKey()` gera e persiste uma chave única quando não existe chave configurada (evita namespace compartilhado por padrão).
- `src-app/src/features/auth/AuthScreen.tsx`: cadastro gera chave de sincronização única por padrão (a menos que uma chave existente seja vinculada).
- `src-app/src/features/profile/ProfileFeature.tsx`: ano de "AQUI DESDE" preenchido com o ano de ingresso na plataforma (conta Supabase ou ano atual em modo offline).

### Changed
- `src-app/src/features/profile/ProfileFeature.tsx`: removida a opção separada de "Nome de Exibição"; o nome passa a ser o próprio handle.
- `src-app/src/features/profile/ProfileFeature.tsx`: opções de "Em Destaque" agora salvam imediatamente (funcionais).
- `src-app/src/features/profile/ProfileFeature.tsx`: "Ofensivas dos Amigos" passa a exibir os amigos realmente adicionados (ou estado vazio quando não houver).
- `src-app/src/features/profile/profile-data.ts`: fallback de "AQUI DESDE" deixa de ser fixo em 2024.

## [v4.42.1] - 2026-10-22

**Correção do erro de interface Minified React error #310 (hooks condicionais).**

### Fixed
- `src-app/src/App.tsx`: removidas chamadas condicionais de hooks (early returns de auth/bootstrap antes de `useState`/`useEffect`/etc.), que violavam as Rules of Hooks e causavam "Rendered fewer hooks than expected" em runtime. A árvore autenticada foi isolada em `AppShell` (renderizado apenas após autenticação) e os retornos de carregamento/erro do bootstrap foram movidos para depois da declaração de todos os hooks.

## [v4.42.0] - 2026-10-21

**Músicas avulsas YouTube em Início/Suas músicas, anotações na edição e fila fluida.** Links YouTube vídeo entram em “Suas músicas” e aparecem na lista da aba Início; anotações do exercício são carregadas ao abrir a edição; fila do treino anima abertura/fechamento; início da playlist não espera expansão de containers nem criação do player YouTube.

### Added
- MusicOverlay.tsx: `externalTracks` listado na seção “Músicas” e na fila oculta.
- media-store.ts: link YouTube `refType: video` adicionado a `SUAS_MUSICAS_ID` quando `addToLibrary`; fallback de metadados garante faixa na biblioteca global.

### Changed
- audio-engine.ts: `startUserQueue()` toca 1ª faixa imediatamente; expansão de containers em segundo plano; player YouTube criado uma única vez e pré-montado no boot, reduzindo início da playlist em vários segundos.
- WorkoutNowPlayingBar.tsx + music.css: fila do treino anima abertura/fechamento; respeita `prefers-reduced-motion`.
- ExercicioFormModal.tsx: anotações sincronizadas de `editEx.notes` ao abrir/trocar item.

### Fixed
- Anotações vazias/antigas ao reabrir edição de exercício.

## [v3.0.0] - 2026-05-31
*Correção de Visualização: Prévias das Barras de Progresso*

### [Fixed]
- **`JS/treino/secao-customizacao.js`**: Corrigida a função `_renderBarSkins` — as prévias de cada skin agora recebem os estilos de fundo (`background` + `box-shadow`) via atributo `style` inline, lidos diretamente de `BAR_SKIN_STYLES`. Isso garante visibilidade imediata independente de cache de CSS.
- **`JS/treino/secao-customizacao.js`**: Corrigida a skin `'default'` em `BAR_SKIN_STYLES` para ter um gradiente visível (`linear-gradient(90deg, #dbfcff, #00dbe9)`) ao invés de string vazia, tornando a prévia do estilo padrão visível.
- **`style/treino/treino.css`**: Incrementado o versionamento do `@import` de `8-customizacao.css` para `v=3` forçando refresh do CSS.

## [v2.9.9] - 2026-05-31
*Expansão de Personalização: Arsenal de 33 Estilos de Barras de Progresso*

### [Added]
- **`JS/treino/secao-customizacao.js`**: Atualizados os catálogos `BAR_SKINS` e `BAR_SKIN_STYLES` com 33 novos estilos de barras de progresso premium, adicionando requisitos específicos de desbloqueio por treinos concluídos, streak ou maestrias (Chama, Gelo, Ouro Elite, Segmentado, Neon Cyber, Plasma, Biohazard, Solar, Carbono, Galáxia, Elixir, Mercúrio, Radar, Matrix, Sobrecarga, Supernova, Deep Void, Cyber Hunter, Bloodline, Bananil, Glacial Peak, Acid Flow, Starlight, Magma, Onyx Shield, Mercúrio Líquido, Nêutron Pulse, Prisma Cristalino, Vórtice do Vazio, Dourado Elite, Roxo Elite e Diamante Elite).
- **`style/treino/8-customizacao.css`**: Adicionados estilos completos para as 33 variações de barra, cobrindo o preenchimento de visualização (`.bar-skin-option--<key> .bar-skin-option__fill`) no menu de customização, além dos overrides em tempo real (`body[data-bar-skin="<key>"]`) para todas as barras de progresso, XP e ciclos do aplicativo (incluindo glows, animações 3D, varreduras neon e texturas de carbono/sangue).
- **`sw.js`**: Incrementada a versão do Service Worker (`CACHE_NAME` para `'academia-treino-v38'`) para limpar caches e sincronizar as novas personalizações visuais imediatamente nos navegadores clientes.

## [v2.9.8] - 2026-05-31
*Reorganização da Seção Perfil: Aba Configurações como Sub-aba de Preferências*

### [Changed]
- **`componentes/secoes/perfil.html`:** Removida a aba principal "CONFIG" (`#perfTabBtnConfig`) da barra superior do Perfil. Movido o contêiner de configurações (`#perf-tab-config`) para ser a sub-aba de "Configurações" (`#perf-subtab2-config`) dentro da aba de "PREFERÊNCIAS" (`#perf-tab-prefs`), integrando-a na barra de sub-navegação (`#perfPrefsSubNav`) com ícones harmonizados.
- **`JS/treino/secao-perfil.js`:** Ajustada a restauração de abas no boot para fazer o fallback da aba "config" para a aba "prefs". A navegação dinâmica por sub-abas gerencia de forma limpa e transparente o novo layout sem conflitos ou modificações extras de lógica.

## [v2.9.7] - 2026-05-28
*Correção Estrutural de Notícias e Ajuste de Isolamento de Cabeçalho*

### [Fixed]
- **`treino.html`:** Removida duplicação acidental e tags desemparelhadas dentro do modal `#news-overlay`, que encerrava o contêiner do modal prematuramente e quebrava o DOM da página de treino, exibindo os cabeçalhos fixados das notícias de forma inadequada em toda a interface principal.
- **`treino.html` e `noticias.html`:** Adicionadas propriedades de `visibility: hidden` e `visibility: visible` em conjunto com a transição de opacidade nas classes de `.detail-view`, garantindo isolamento total dos cabeçalhos fixados (`position: fixed`) das notícias individuais quando estas não estiverem ativas.

## [v2.9.6] - 2026-05-26
*Sincronização Dinâmica do Banner do Perfil com a Seção Início*

### [Changed]
- **`JS/treino/secao-customizacao.js`:** Atualizada a função `applyProfileCustomization(db)` para setar o atributo `data-banner` no `.dash-profile-banner-card` em sincronia com o perfil.
- **`JS/treino/secao-dashboard.js`:** Importada e executada `applyProfileCustomization(db)` no renderizador `renderDashboard(db)` para garantir consistência no carregamento.
- **`style/treino/8-customizacao.css`:** Expandidos todos os seletores de estilização de banner para cobrir `.dash-profile-banner-card` de forma idêntica ao perfil (incluindo gradientes e animações).
- **`style/treino/secoes/dashboard.css`:** Ocultada a textura quadriculada padrão `.dash-banner-checkers` quando um banner estilizado está ativo (`[data-banner]`).

## [v2.9.5] - 2026-05-26
*Mensagem de Boas-vindas Personalizada e Expansão do Banner do Perfil*

### [Changed]
- **`componentes/secoes/dashboard.html`:** Substituído o bloco de troféus e nickname por um cabeçalho de boas-vindas contendo `"Bem vindo de volta,"` e o elemento dinâmico `#dashUserName`, ocultando `#dashProfileTrophies` para manter a compatibilidade com a atualização via JavaScript.
- **`style/treino/secoes/dashboard.css`:** Alterado `.dash-profile-banner-card` para se expandir horizontalmente cobrindo a área contornada de forma elástica com `flex: 1` e `max-width: 220px`. Adicionado estilo premium para `.dash-welcome-text` e melhorado o comportamento responsivo mobile.

## [v2.9.4] - 2026-05-26
*Automação de Início de Treino e Rolagem Inteligente no "Próximo Passo"*

### [Changed]
- **`JS/treino/secao-dashboard.js`:** Atualizada a função `startWorkoutFromDashboard(db)` para iniciar o cronômetro do treino automaticamente chamando `initGlobalTimer(db)` (em vez de apenas `startInterval()`). Isso garante que os botões da ficha de treinos (mudar de "INICIAR TREINO" para "ENCERRAR TREINO") e o cronômetro visual se atualizem instantaneamente sem precisar recarregar a página.
- **`JS/treino/secao-dashboard.js`:** Adicionado suporte a rolagem suave até os exercícios (`scrollIntoView` com `behavior: 'smooth'`) acionado 520ms após a transição para a aba "Ficha", posicionando a tela na altura certa para o usuário começar a treinar sem esforço manual.

## [v2.9.3] - 2026-05-26
*Aprimoramento de Alta Fidelidade do Mini-Deck Builder no Dashboard*

### [Added]
- **`style/treino/secoes/dashboard.css`:** Adicionados estilos pixel-perfect e glows para o mini-deck. O active letter tab agora é aninhado em um **escudo/badge roxo poligonal** (`.dash-mini-deck__tab-shield` e `.dash-mini-deck__tab-letter`) idêntico ao Clash Royale, o cabeçalho agora inclui botão de hambúrguer de menu à esquerda e botão de troca de fluxo (`.dash-mini-deck__swap-btn`) ao lado de tab E. Os cards de exercício na grade de 4 colunas adotaram a borda de topo colorida correspondente a cada categoria muscular, imagem de exercício contida em contêiner branco com borda escura de contraste, cabeçalhos escuros com texto em uppercase e rodapé estilizado com o número de séries.
- **Estatísticas no Rodapé Reestilizadas:** Criados os três containers `.dash-mini-deck__stat-container` com `.dash-mini-deck__stat-widget` dedicados para Volume (com ícone customizado de Elixir drop rosa/roxo e valor em destaque), Maestria (ícone de estrela dourada com contador de emblemas) e Cardio configurado (ícone de onda de pulso ECG e subtítulo funcional dinâmico) exatamente correspondendo ao design de referência do usuário.

### [Changed]
- **`componentes/secoes/modais.html`:** Refatorado o cabeçalho e rodapé do modal `modalSeletorFichas` para incluir os botões de hambúrguer de menu, swap de cartas, seletores de grade/lista e os novos widgets horizontais de estatísticas com seus rótulos posicionados abaixo de cada caixa.
- **`JS/treino/secao-dashboard.js`:** Atualizada a lógica de renderização dos tabs para injetar os escudos vetoriais nas letras ativas de forma dinâmica e ajustada a atualização das estatísticas para preencher as sub-legendas dinâmicas do widget de cardio.

## [v2.9.2] - 2026-05-26
*Mini-Deck Builder Interativo de Fichas no Dashboard*
*Reposicionamento dos Elementos Inferiores do Dashboard*

### [Changed]
- **`style/treino/secoes/dashboard.css`:** Alterada a posição do Suggested Workout Card (itens "Treino", "Próximo Passo" e "Ciclo") para fluir de forma relativa na flexbox do container do dashboard, posicionando-os naturalmente logo abaixo do card da Arena em vez de absolutamente fixados na base. Ajustados os paddings do contêiner principal para otimizar o encaixe vertical e aumentado o espaçamento entre a seção sugerida e a imagem da arena (90px no padrão e 54px no mobile).

## [v2.9.0] - 2026-05-23
*Redesign Visual Completo da Seção Início (Dashboard) Estilo Clash Royale*

### [Changed]
- **`componentes/secoes/dashboard.html`:** Refatorado por completo para adotar o design do Clash Royale da imagem de referência. Implementada estrutura do profile card com avatar circular, liga e troféus em linha, botões de ação e central de emblemas em grade (0/30 Emblemas com ícone de baú e troféu de ouro inline), indicador de arena central com efeitos de brilho/partículas para a Forja, barra de progresso horizontal redesenhada com pedestal para o Troféu de Cristal iluminado e marcações de progresso, botão selector flutuante da Coroa de Elixir, e o novo Suggested Workout Card unificado no rodapé.
- **`style/treino/secoes/dashboard.css`:** Totalmente reescrito seguindo o padrão BEM e implementando as diretrizes de design de alto padrão (neon styling). Adicionados glows neon azul e rosa na barra de progresso e no pedestal do troféu, efeitos de brilho metálico escovado/pedra no botão "Próximo Passo", card de exercício em grade com visual clássico Clash Royale (borda roxa, rodapé colorido, nível badge com formato hexagonal e clip-path), e responsividade pixel-perfect com media queries para 480px.
- **`JS/treino/secao-dashboard.js`:** Atualizada a lógica de renderização para sincronizar os novos elementos. O card de treino sugerido agora é totalmente dinâmico, exibindo o nome exato e a maestria real (nível da carta) do primeiro exercício do treino sugerido. Adicionado ouvinte de clique para o botão flutuante da Coroa para abrir o bottom-sheet seletor de fichas com a mesma fluidez.
- **`Diretrizes/system_map.json`:** Atualizado para a versão `2.3.0` registrando o andamento da arquitetura do Dashboard.

## [v2.8.0] - 2026-05-21
*Modularização de CSS Monolítico em Componentes e Variantes Estilísticas*

### [Added]
- **Modularização de CSS:** Criada a pasta `style/treino/secoes/` contendo arquivos CSS focados e de fácil manutenção por IA:
  - `secoes/bg-dinamico.css`: Lógica de background animado e colorizações temáticas por seção.
  - `secoes/toolbar-busca.css`: Toolbar com controles, buscador expansível e dropdown de filtros.
  - `secoes/deck-builder.css`: Layout do Deck Builder, slots de cartas e rodapé com estatísticas.
  - `secoes/cards.css`: Estilização dos cards de exercícios, animações de hover/menu de ações e layouts de grade (Royale/Lista).
  - `secoes/maestria.css`: Visualização de conquistas de maestria e modais de desafio.
  - `secoes/modais.css`: Estilo estelar premium para o modal de detalhes do exercício.
  - `secoes/tabs-subnav.css`: Abas de navegação secundária e dot controllers.
  - `secoes/perfil.css`: Elementos da seção Perfil, switches iOS e painéis de assinatura/segurança.
  - `secoes/placeholders-animacoes.css`: Animações de pulso/shimmer e placeholders elegantes para os slots.

### [Changed]
- **`style/treino/5-premium-design.css`:** Transformado em um indexador enxuto que importa todas as novas folhas de estilo específicas de seção via `@import`, preservando integridade de imports externos.
- **`sw.js`:** Incrementado cache para `v35` e adicionados todos os novos caminhos modulares de CSS à lista `ASSETS_TO_CACHE` para garantir o funcionamento offline do PWA.
- **`Diretrizes/system_map.json`:** Atualizado para `v2.1.0` refletindo a arquitetura de fragmentação HTML & CSS e detalhando o propósito de cada arquivo modular.

## [v2.7.0] - 2026-05-21
*Modularização IA-Friendly do Monólito HTML e Injeção Assíncrona*

### [Added]
- **`JS/treino/loader.js`:** Novo módulo utilitário para carregar de forma paralela (`Promise.all` + `fetch`) múltiplos fragmentos HTML injetando-os dinamicamente em placeholders do DOM (`[data-section]`).
- **Arquitetura Modular HTML:** Criada a pasta `componentes/secoes/` abrigando os fragmentos isolados: `ficha.html`, `treinos.html`, `progresso.html`, `perfil.html` e `modais.html`. Isso reduziu drasticamente o consumo de tokens em requisições à IA, viabilizando análises de código e edições contextuais muito mais rápidas e precisas.

### [Changed]
- **`treino.html`:** Refatorado de um arquivo monolítico de ~2.200 linhas para uma "shell" enxuta de ~200 linhas. Agora abriga apenas metadados `<head>`, navegação base (top/bottom navs) e a infraestrutura nativa do "Swipe Viewport", deixando o conteúdo massivo para injeção via `loader.js`.
- **`JS/treino/app.js`:** Adicionada chamada `await loadAllSections()` prioritária (Top-Level) imediatamente dentro do hook de boot `DOMContentLoaded`. Isso garante a reconstrução integral do DOM **antes** de qualquer inicialização ou escuta de eventos, mantendo estabilidade arquitetural de Single Page Application (SPA).
- **`sw.js`:** Atualizada a versão do Service Worker (`CACHE_NAME` para `'academia-treino-v34'`). Modificada a lógica de instalação para incluir `self.skipWaiting()` e a lógica de ativação para `clients.claim()`. Isso previne a tela em branco/estado travado (caching conflict) e força clientes PWA a validarem de imediato as atualizações modulares da interface. Além disso, a estratégia de `Network First` agora também se aplica de modo dinâmico aos `.html` de fragmentos para contornar cache stales.
- **`Diretrizes/system_map.json`:** Atualizado para `v2.0.0`, registrando formalmente a nova lógica modular (`section_loader`), alterando o indexador `treino.html` e documentando explicitamente o manifesto estrutural das `html_fragments`.

## [v2.6.5] - 2026-05-21
*Ajustes de Integração Visual e Correção de Transbordamento (Overflow) nas Abas de Treino e Perfil*

### [Fixed]
- **`style/treino/5-premium-design.css`:** 
  - Corrigido o alinhamento visual e a integração das sub-abas na aba **Exercícios** (seção Treino), fazendo com que `#tab-exercicios` utilize o contêiner de design orgânico (`.perf-tab-content-wrapper`), unificando o fundo (`#150b24`) e eliminando linhas divisórias e lacunas flutuantes.
  - Corrigido o transbordamento (overflow) das seções temáticas (`.theme-section`) nas sub-abas de **Perfil**. Ajustadas as margens laterais (`margin: 0 -10px`) para se integrarem perfeitamente às bordas internas do wrapper de conteúdo e adicionadas regras condicionais de margem para o topo (`margin-top: -20px` e `-15px`) e rodapé (`margin-bottom: -20px`), eliminando qualquer vazamento e respeitando as bordas curvas originais do contêiner.
  - Adicionado `overflow: hidden;` a `.perf-tab-content-wrapper` e `#tab-exercicios` para garantir o recorte (clip) limpo do conteúdo interno nos cantos arredondados inferiores de `24px`.
  - **`treino.html` & `style/treino/5-premium-design.css`:** Refatorados os botões de ação do Perfil ("Adicionar Amigos" e "Ver Coleção") para o padrão metodológico **BEM** (`.profile-actions`, `.profile-action-btn`), eliminando os estilos inline redundantes. Foi implementada uma estilização premium para o botão "Ver Coleção" com gradiente dourado, sombra suave e micro-animação dinâmica em estado hover.

## [v2.6.4] - 2026-05-20
*Sistema de Transições de Cima para Baixo com Stagger Premium*

### [Added]
- **`style/treino/5-premium-design.css`:** Adicionados `@keyframes uiFadeOut`, classe `.ui-fade-out` e a classe `.stagger-item` com delay dinâmico para entradas escalonadas (stagger) de cards e linhas.
- **`JS/treino/db.js`:** Implementada e exportada a função `fadeSwap(element, updateCallback)` que coordena as transições de saída (fade-out) e entrada (fade-in) de novos conteúdos de forma assíncrona com atraso de 120ms.

### [Changed]
- **`style/treino/5-premium-design.css`:** Ajustado o `@keyframes uiFadeIn` para realizar um deslocamento de cima para baixo suave (`translateY(-8px)` para `translateY(0)`).
- **`JS/treino/db.js`:** Atualizada a função `fadeIn` para reiniciar automaticamente as animações de todos os elementos filhos com a classe `.stagger-item`.
- **`JS/treino/templates.js`:** Atualizadas as assinaturas e retornos dos templates `fichaDeckCard`, `fichaGridCard`, `fichaTableRow` e `cardioDeckCard` para suportar a classe `.stagger-item` e receber a propriedade CSS `--item-index` dinâmica.
- **`JS/treino/secao-ficha.js` & `JS/treino/app.js`:** Integrado o utilitário `fadeSwap` na troca de modos de visualização da ficha e na troca de treinos (letras A/B/C...), garantindo uma transição fluida sem jumps ou flashes de tela. Injetados delays stagger nas inserções manuais de cardio.
- **`JS/treino/nav.js` & `JS/treino/secao-perfil.js`:** Integrado `fadeSwap` em todas as transições de abas, sub-abas de Treino e abas/sub-abas de Perfil, promovendo um fluxo de navegação extremamente polido de alto padrão.

---

## [v2.6.3] - 2026-05-20
*Sistema de Transições Suaves com Fade-In*

### [Added]
- **`style/treino/5-premium-design.css`:** Adicionada animação `@keyframes uiFadeIn` e a classe `.ui-fade-in` para criar transição suave com leve deslocamento vertical (translateY(8px)).
- **`JS/treino/db.js`:** Adicionada e exportada a função `fadeIn(...elements)` que gerencia e reinicia as transições aplicando a classe `.ui-fade-in` de forma dinâmica com reflow forçado.

### [Changed]
- **`JS/treino/secao-ficha.js`:** Implementadas transições de fade-in na Ficha ao alternar entre os modos de exibição (Tabela, Grid, Coleção) e ao trocar os treinos do dia (A, B, C, etc.).
- **`JS/treino/secao-treinos.js`:** Adicionado fade-in nas listagens de exercícios, nos slots do deck de montagem de ficha e na biblioteca de exercícios.
- **`JS/treino/secao-perfil.js`:** Aplicado fade-in suave na navegação de abas principais e sub-abas de Progressão e Preferências do Perfil.
- **`JS/treino/nav.js`:** Integrada a animação de fade-in nas trocas de abas da seção Treinos (Exercícios / Montar Ficha) e sub-navbars estilo Clash Royale.

---

## [v2.6.1] - 2026-05-20
*Ajuste da Margem de Segurança Inferior e Estilização do Card de Cardio*

### [Changed]
- **`style/treino/7-nav-icons.css`:** Dobrada a margem de segurança inferior (`padding-bottom`) do contêiner principal (`.section-slide .treino-container`) de `130px` para `260px` para garantir que o conteúdo não seja ocultado pela barra de navegação inferior.
- **`style/treino/5-premium-design.css`:** Ajustado o card de cardio (`.deck-card-aerobico` e `.ex-card-aerobico`) para ocupar toda a largura da linha (`grid-column: 1 / -1`) nos modos de exibição em grid e coleção.
- **`JS/treino/templates.js` & `JS/treino/secao-ficha.js`:** Removido o botão de configurações (editar) do card de cardio na seção da ficha do dia e ajustado o alinhamento da área de checkbox. O ícone flutuante superior esquerdo circular também foi removido, e o emoji de corrida antigo foi substituído por um ícone SVG premium e minimalista.

---

## [v2.6.2] - 2026-05-20
*Correção do Bug de Salvamento do Cardio*

### [Fixed]
- **`JS/treino/secao-ficha.js`:** Corrigido bug intermitente onde o cardio não era salvo corretamente ao marcar como concluído. Dois problemas identificados:
  1. O selector `.t-tab.active .check-input` capturava checkboxes de múltiplas abas ativas (Treinos, Progresso, Perfil), causando conflitos de estado. Corrigido para escopo restrito ao `#tab-ficha`.
  2. `newChecks` era uma referência viva ao array do DB, podendo ser mutada pelo `renderFicha()` antes da verificação de `allDone`. Corrigido com snapshot imutável via `[...(getChecks(db))]`.

---

## [v2.6.0] - 2026-05-20
*Implementação do Sistema de Abas na Seção Perfil*

### [Added]
- **`treino.html`:** Reestruturada a seção Perfil (`#section-perfil`) com um sistema completo de 4 abas principais (Perfil, Progressão, Configurações, Preferências), seguindo o mesmo padrão visual de abas utilizado nas seções "Treinos" e "Montar Ficha".
- **`treino.html`:** Adicionadas sub-abas na aba de Progressão (Visão Geral, Nível e XP, Conquistas) usando componentes da interface (`.sub-navbar`, `.sub-nav-btn`).
- **`treino.html`:** Adicionadas sub-abas na aba de Preferências (Geral, Assinatura, Segurança) contendo toggles de configurações estilo iOS (`.pref-switch`), vitrine de planos de assinatura (`.subscription-plans`), e formulário de dados de segurança (`.security-form`).
- **`style/treino/5-premium-design.css`:** Implementadas todas as novas diretrizes CSS usando metodologia BEM para as abas de perfil, toggles `.pref-switch` (com micro-animações estilo iOS e sombra dinâmicas), campos de segurança `.sec-input`, botões com gradientes, e a estrutura visual dos cartões de assinatura (`.plan-card`).
- **`JS/treino/secao-perfil.js`:** Adicionado o método `initPerfilTabs()` responsável por escutar e realizar a navegação DOM fluida entre abas principais e sub-abas.
- **`JS/treino/secao-perfil.js`:** Implementada funcionalidade de leitura e salvamento atômico das preferências do perfil (nome, handle, e-mail, senha) diretamente para `db.profileCustomization` e persistência dos toggles de configuração global no `localStorage`.

### [Changed]
- **`JS/treino/app.js`:** Importado e executado `initPerfilTabs()` na rotina de boot (DOMContentLoaded) inicializando a seção Perfil.

---


## [v2.5.3] - 2026-05-19
*Alinhamento de Grid Fixo 2x4 na Ficha do Dia*

### [Changed]
- **`treino.html`:** Alterada a classe do contêiner `#workoutGrid` de `exercicios-grid` para `workout-deck-grid`. Com isso, a visualização em Grade da Ficha do Dia passa a exibir um grid fixo simétrico de 4 colunas no desktop (gerando exatamente 2 linhas para 8 exercícios) e 2 colunas no mobile, alinhado ao layout do Deck Builder da aba Montar Ficha.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v30'` para invalidar caches antigos.

---

## [v2.5.2] - 2026-05-19
*Alinhamento em Linha do Botão de Concluir nos Modos Grid e Deck da Ficha*

### [Changed]
- **`JS/treino/templates.js`:** Reestruturado o HTML das funções `fichaDeckCard` e `fichaGridCard`. O checkbox de concluir exercício (`.deck-check-wrap` e `.check-wrap`) foi movido para dentro da mesma linha (`.series-wrap-deck` e `.series-wrap-grid`) que os botões de séries/repetições e o ícone de nota.
- **`JS/treino/templates.js`:** Adicionado estilo flexbox dinâmico (`display: flex; align-items: center; width: 100%;`) nos wrappers de séries e `margin-left: auto` nos checkboxes, empurrando o botão de conclusão com precisão para a extremidade direita na mesma linha.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v29'` para forçar a invalidação imediata do cache nos clientes PWA.

---

## [v2.5.1] - 2026-05-19
*Ajuste Fino na Transição do Hero (Remoção da Sombra)*

### [Changed]
- **`style/treino/5-premium-design.css`:** Removido o pseudo-elemento `::after` do `.treino-hero` e a margem negativa superior (`margin-top: -30px`) de `.treino-container`. Isso elimina completamente a mancha ou "sombra" escura e espessa na zona de transição, mantendo a fusão de degradê do hero com os losangos do fundo de forma cristalina, limpa e uniforme.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v28'` para forçar a invalidação imediata do cache nos clientes PWA.

---

## [v2.5.0] - 2026-05-19
*Suavização e Transição Ultra-Premium do Hero Section*

### [Changed]
- **`style/treino/5-premium-design.css`:** Substituído o background sólido e opaco de `.treino-hero` por um degradê vertical sofisticado combinando um radial roxo topo e linear preto chumbo escuro que desvanece de `98%` no topo a `0%` (totalmente transparente) na base. Isso permite que a textura e os losangos geométricos de background do Clash Royale fluam suavemente sob toda a página sem cortes visuais nítidos.
- **`style/treino/5-premium-design.css`:** Adicionado pseudo-elemento `::after` a `.treino-hero` com um degradê reverso de fusão e desfoque (`filter: blur(10px)`) para desfocar e suavizar qualquer linha horizontal divisória.
- **`style/treino/5-premium-design.css`:** Elevado ligeiramente o contêiner de conteúdo (`.treino-container` na seção da ficha) através de `margin-top: -30px !important;` e `z-index: 3`, fazendo a barra de controle (`.ficha-header-bar`) flutuar com visual integrado sobre o fade de transição.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v27'` para propagar e forçar a expiração imediata do cache nos clientes PWA.

---

## [v2.4.9] - 2026-05-19
*Correção da Visibilidade de Decks Vazios na Seção Ficha*

### [Fixed]
- **`JS/treino/nav.js`:** Ajustada a função `updateEmptyWorkoutButtons` para utilizar `.filter(Boolean).length > 0` ao validar a presença de exercícios no deck. Isso resolve o bug em que o botão da aba da ficha continuava visível mesmo sem exercícios, devido ao array de IDs manter o tamanho (length) com elementos `null` após a remoção.
- **`JS/treino/db.js` & `JS/treino.js`:** Corrigida a função `determineTreinoDoDia` em ambos os arquivos (modular e legado) para ignorar fichas que contenham apenas elementos nulos ao estimar a próxima ficha ativa do ciclo.
- **`JS/treino/secao-progresso.js` & `JS/treino.js`:** Ajustado o filtro do breakdown de ciclos para ocultar de forma precisa as fichas que não possuem nenhum exercício ativo cadastrado.

### [Changed]
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v26'` para forçar a expiração imediata do cache nos clientes PWA e carregar as novas lógicas dinâmicas de renderização.

---

## [v2.4.8] - 2026-05-19
*Placeholders de Imagem Premium para Exercícios e Tratamento de Falhas Dinâmicas*

### [Added]
- **`style/treino/5-premium-design.css`:** Implementada a classe `.premium-placeholder` juntamente com animações avançadas (`@keyframes exPulse`, `@keyframes exShimmer`, `@keyframes exFloat`). O design possui fundos gradientes premium, efeito de brilho metálico reflexivo, sombras pulsantes tridimensionais e ícones tridimensionais de halteres flutuantes.
- **`JS/treino/secao-ficha.js` & `JS/treino/secao-treinos.js` & `JS/treino/templates.js`:** Adicionada renderização do placeholder para exercícios sem imagem definida (`!ex.imagem`) e integração do manipulador dinâmico de erro `onerror` nas tags de imagem.
- **`JS/treino.js` (JavaScript Legado):** Sincronizados todos os templates equivalentes de exercícios em todas as views legadas (Ficha Deck, Ficha Grid, Exercícios Grid, Coleção e Slots Ativos do Deck) com suporte a tratamento de erro em tempo de execução (`onerror`) substituindo a tag `<img>` pelo placeholder premium usando escape resiliente de aspas duplas (`&quot;`).

### [Changed]
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v25'` para propagar e forçar o recarregamento imediato das novas regras visuais e tratamento resiliente nos clientes PWA.

---

## [v2.4.7] - 2026-05-19
*Filtros Quadrados e Estilo de Lista Contínua Premium no Dropdown*

### [Changed]
- **`style/treino/5-premium-design.css`:** Modificado o estilo dos itens de filtro (`.cr-dropdown-item`) para neutralizar completamente as propriedades de pílulas arredondadas (`.g-chip`) herdadas do core. Os itens agora são totalmente retos (`border-radius: 0 !important;` e `margin: 0 !important;`), formando uma lista de menu vertical elegante e contínua com divisores finos.
- **`style/treino/5-premium-design.css`:** Adicionado um destaque ativo ultra-premium para o item selecionado (`.cr-dropdown-item.active`), contendo uma borda roxa brilhante à esquerda (`border-left: 3px solid var(--primary-light) !important;`), fundo sutilmente destacado e micro-animações ajustadas para o hover.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v24'` para propagar a nova interface reta/quadrada imediatamente aos clientes.

---

## [v2.4.6] - 2026-05-19
*Ajuste Fino de Recuo Adicional e Legibilidade no Input da Busca Expansível*

### [Fixed]
- **`style/treino/5-premium-design.css`:** Aumentado o `padding-left` de `30px` para `38px` no input `.ex-search-box.collapsible .ex-search-input`. Isso desloca o texto de forma ideal para a direita, evitando completamente qualquer sobreposição ou colisão de caracteres com o ícone de lupa absoluto à esquerda (por exemplo, quando o "s" de "supino" ficava oculto sob a lupa e parecia "Qupino").
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v23'` para invalidar cache anterior e propagar o ajuste fino imediatamente aos clientes.

---

## [v2.4.5] - 2026-05-19
*Ajuste Fino de Recuo e Legibilidade no Input da Busca Expansível*

### [Fixed]
- **`style/treino/5-premium-design.css`:** Ajustado o `padding-left` de `10px` para `30px` no input `.ex-search-box.collapsible .ex-search-input`. Isso desloca o início do texto digitado para a direita de forma elegante, evitando a colisão visual e sobreposição de caracteres com o ícone de lupa posicionado de forma absoluta à esquerda.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v22'` para forçar o recarregamento instantâneo do ajuste fino de espaçamento no cliente.

---

## [v2.4.4] - 2026-05-19
*Correção Crítica no Estiramento Flexbox e Eventos de Clique da Busca Expansível*

### [Fixed]
- **`style/treino/5-premium-design.css`:** Neutralizados os overrides herdados do core (`flex: 1` e `min-width: 200px` em `1-core.css`) adicionando `flex: none !important` e `min-width: 0 !important` na classe `.ex-search-box.collapsible` (colapsada e expandida). Isso garante que ela comece perfeitamente minimizada a `40px` de largura conforme pretendido, resolvendo o bug visual de estiramento gigante.
- **`style/treino/5-premium-design.css`:** Sobrescrito o seletor do core do ícone de pesquisa (`.ex-search-icon`) que bloqueava cliques por ter `pointer-events: none` por padrão. Adicionado `pointer-events: auto !important` e `cursor: pointer` na classe específica `.ex-search-box.collapsible .ex-search-icon` para habilitar fisicamente o registro de cliques no JS.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v21'` para propagar e forçar a atualização imediata das correções de folhas de estilo em todos os dispositivos clientes.

---

## [v2.4.3] - 2026-05-19
*Ativação Exclusiva da Busca Expansível via Ícone de Pesquisa*

### [Changed]
- **`JS/treino/app.js`:** Reestruturado o controle da busca expansível (`exSearchContainer` / `searchInput`). A expansão e o colapso agora são disparados unicamente pelo clique no ícone de pesquisa (`.ex-search-icon`).
- **`JS/treino/app.js`:** Adicionado mecanismo com flag `iconClickActive` no `mousedown`/`click` do ícone de pesquisa, solucionando conflitos indesejados do evento de desfocagem (`blur`) do input (que causava o fechamento/reabertura cíclico quando o campo estava vazio).
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v20'` para garantir o carregamento instantâneo da nova lógica da busca pelos clientes do PWA.

---

<!-- Entradas anteriores a v3.0.0 foram arquivadas para manter o arquivo abaixo de 500 KB (regra doc-lint). Histórico completo disponível no Git. -->
