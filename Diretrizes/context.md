# context.md — Continuidade de sessão (2026-10-08)

> **Arquivo de contexto entre sessões.** Ler junto com `Diretrizes/CHANGELOG.md`
> (entradas `v4.0.6-phase4`, `v4.0.7-phase5`, `v4.0.7-phase5-navfix`, `v4.0.8-bugfix`,
> `v4.0.9-android`, `v4.0.10-news-parity`, `v4.0.11-lombar-gif`, `v4.0.12-splash`,
> `v4.0.13-typography`, `v4.0.13-typography-docs` e `v4.0.14-social-placeholder`) e
> `Diretrizes/system_map.json` (**version 3.5.24** — primeira leitura obrigatória de
> todo agente).
> Atualizado ao fim da sessão de 2026-10-08 (aba **Social** preenchida com o conteúdo
> de `Ligas.html` como placeholder — `src-app/src/features/social/` montado no
> `App.tsx`; docs `v4.0.14-social-placeholder`).

---

## 1. Estado atual (fim da sessão 2026-10-08)

- **Fases 0–5 da migração React v4 CONCLUÍDAS**:
  0 fundação → 1 visual (Dashboard/Ficha/Progresso) → 2 Perfil/temas →
  3 gamificação → 4 seção Treinos + swipe + limpeza (2026-10-05) →
  5 pendências de paridade (2026-10-06): cronômetro global do
  treino + `#modalEncerrarTreino` acionáveis, overlay de Notícias completo,
  placeholders Social/Loja em DOM legado e BottomNav 1:1.
- **Paridade visual do news-overlay CONCLUÍDA (`v4.0.10-news-parity`, 2026-10-07)**:
  bloco `v4.0.10-news-parity` no `news-overlay.css` (`revert-layer` escopado +
  pins), `FOOTER_HTML` portado para os 3 containers, tokens corrigidos e a
  **view de detalhe medida sem diffs visuais** (lista = 6 diffs e detalhe = 15,
  todas não-visuais; screenshots e band stats ±1 idênticos).
- **GIF `ex-extensao-lombar` conectado (`v4.0.11-lombar-gif`, 2026-10-07)**:
  `Assets/exerciciosgif/Extensão Lombar.gif` (entregue pelo usuário, já
  commitado em `ba7495e` na raiz + `src-app/public/`) espelhado em
  `www/Assets/exerciciosgif/`; `imagem`/`imageUrl` apontando para o arquivo em
  `JS/treino/db.js` + espelho `www/` e no seed React, com
  **`backfillExerciseImages()`** no `bootstrap.ts` restaurando instalações
  existentes (IDB com `imageUrl: null`).
- **Splash do legado portada ao React (`v4.0.12-splash`, 2026-10-07)**:
  DOM `#splashScreen` + script inline no `src-app/index.html` (1:1 de
  `treino.html` L102–134; o CSS já estava espelhado no `8-customizacao.css`);
  saída em `academia:db-ready` com a sequência do `app.js` L477–488
  (100 ms → fill 100% → 400 ms → `--hidden`); **divergência pedida pelo
  usuário: com treino em andamento a splash é removida antes do paint**
  (flags `workout_start_time`/`fichaEmAndamento` do dia) e nunca reabre.
- **Paridade de tipografia/cascata + layout raiz CONCLUÍDA (`v4.0.13-typography`,
  2026-10-07)**: pins da cascata do Play CDN v3 em `globals.css` (`revert-layer`
  de h1–h6, line-heights das utilities, `* margin/padding`, `body line-height`),
  preflight `border-color:#e5e7eb`, **7 pins de `backdrop-filter`** (o par
  prefixado é deduplicado pelo lightningcss → `computed: none`), thumb de
  scrollbar em gradiente, `--card-border/hover` 0.2/0.25, tokens de fonte
  Outfit, `dynamic-bg.css` removido, **scroll interno do `.section-slide`
  restaurado** (html/body `overflow:hidden`, shell `h-screen` + wrappers
  `.section-viewport`/`.section-strip`/`.section-slide` 1:1), cor herdada
  `#ffffff` e — grande achado — **`repairSectionRaster()`** no `App.tsx`:
  toggle de `-webkit-font-smoothing` em duas tasks após cada troca de seção
  zera o raster stale de 1–2 device px dos `.p-card` na primeira pintura
  pós-boot (Progresso **6239 → 65** diffs, bandas 0/0/0).
- **Aba SOCIAL preenchida (`v4.0.14-social-placeholder`, 2026-10-08)**: novo
  `src-app/src/features/social/` (`SocialFeature.tsx` + `social.css` +
  `social-data.ts` + `social-icons.tsx`) portando o conteúdo de `Ligas.html`
  como **placeholder** — 3 sub-abas Liga/Amigos/Guilda, Caminho das Ligas com
  resgates, ranking filtrável, grid de amigos, guilda (chat local/membros/
  doações/guerra) e 3 modais — com tipografia/tokens do app, superfícies glass
  translúcidas (o fundo dinâmico da arena segue visível) e ícones SVG stroke no
  lugar dos emojis; montado no `App.tsx` no branch `social` (o `.section-coming-soon`
  da Loja foi separado e segue 1:1).
- **Verificação desta sessão (FINAL)**: `npx tsc -b` exit 0 · `npx oxlint src`
  exit 0 (ZERO warnings) · `npm run build` OK (`dist/assets/index-*.css` +
  `index-*.js`, com as strings sociais no bundle) · `system_map.json` validado
  (**3.5.24**, sem BOM) · checagem CDP no preview (perfil Chrome limpo):
  `shot_social.js`/`probe_modal.js`/`probe_boot.js` — 3 sub-abas montam
  (5 passos/5 ranks; 5 amigos; 4 pílulas da guilda + 3 msgs), grid 1 col
  `382px` no mobile e `872px 340px` no desktop (≤820px colapsa), header
  `rgba(10,5,20,.75)` + `blur(16px)`, fonte Rajdhani, `#cr-dynamic-bg` visível
  atrás, slide com `overflow-y:auto`, ESC fecha modal, **0 erros de JS** e
  splash some em 1,5 s (db-ready 547 ms). **Bug encontrado e corrigido no
  fim**: modais fora da tela (`left:855` em 430 px) → `createPortal` no
  `document.body` (detalhe na entrada do CHANGELOG). Atenção: o `sw.js` do
  preview acusa erro de MIME (fallback do vite preview) — pré-existente,
  não relacionado à aba Social.
- **Verificação da sessão anterior (v4.0.13) — segue válida**: `probe_text`
  **0 diffs** + `measure_fonts` **0/0** · CDP `verify_fixes.js` **14/14 PASS** +
  `verify_splash.js` **10/10 PASS** + `verify_click_after_splash.js` **6/6 PASS** ·
  screenshots dashboard 1717 / progresso 65 (só GIF).
- **GIT**: HEAD = `6a1d399`. **NÃO commitado** (só com pedido explícito):
  7 arquivos da sessão anterior — `src-app/src/App.tsx`,
  `src-app/src/styles/{globals.css,design-tokens.css,tailwind-legacy-theme.css}`,
  `src-app/src/main.tsx`, `src-app/src/features/dashboard/DashboardFeature.tsx`,
  `src-app/index.html` — **mais os 4 novos da aba Social**
  (`src-app/src/features/social/{SocialFeature.tsx,social.css,social-data.ts,social-icons.tsx}`,
  App.tsx modificado de novo), `Diretrizes/CHANGELOG.md`,
  `Diretrizes/system_map.json`, `context.md`; pendentes das sessões anteriores:
  `JS/treino/db.js` + espelho `www/`, `src-app/src/core/db/{default-data.ts,bootstrap.ts}`
  e gif untracked `www/Assets/exerciciosgif/Extensão Lombar.gif`.
- Servidores desta sessão: preview **:4173** e Chrome CDP **:9222** (se usados
  para screenshot) — encerrar ao fim
  (`Get-NetTCPConnection -LocalPort 4173 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`,
  idem 9222).

---

## 2. O que foi feito

### Aba Social (placeholder de `Ligas.html`) — `v4.0.14-social-placeholder` (esta sessão; detalhe na entrada do CHANGELOG)
1. **Novo `src-app/src/features/social/`** (4 arquivos): `social-data.ts`
   (mocks: leaderboard 3 filtros, amigos, membros da guilda, doações, guerra,
   passos do Caminho, `PLAYER_STATS`/`PLAYER_TAG`), `social-icons.tsx`
   (SVG stroke `24/2/round`, sem emojis — regra do `Diretrizes/Ícones.md`),
   `SocialFeature.tsx` (header+stats, 3 sub-abas, banner "Temporada 14",
   Caminho das Ligas com resgates, ranking filtrável, grid de amigos, guilda
   com 4 pílulas — chat local com envio/auto-scroll, membros, doações com
   contador, guerra com barras —, 3 modais `.modal-overlay` com ESC/backdrop,
   toasts `showToast`, tudo em estado local) e `social.css`.
2. **`social.css`**: só tokens + derivados locais `--soc-*`; superfícies
   **glass translúcidas** (`rgba(10,5,20,.55/.75)` + `backdrop-filter`) para o
   fundo dinâmico da arena continuar visível (o mockup era opaco); Rajdhani +
   títulos uppercase com letter-spacing; grid `1fr 340px` → 1 col ≤820px;
   `.soc-select` no padrão premium do `Diretrizes/README.md`; modais reusam
   `modal-overlay`/`slideUp` legados. Decisão: tab bar própria `soc-tabs` (mais
   fiel ao mockup) em vez das `.treino-tabs-section` do app.
3. **Integração no `App.tsx`**: branch `social` separado de `loja` —
   `<SocialFeature/>` dentro de `.section-slide[data-section=social]`
   (raiz `.treino-container.soc-root` dá escopo aos `--soc-*`, inclusive para
   os modais irmãos); Loja continua `.section-coming-soon` 1:1.
   **Modais via `createPortal(document.body)`** (bug medido e corrigido no
   fim: o `transform` do `.section-strip` fazia do `.modal-overlay` um filho
   fixo relativo à fita → modal com `left:855` numa tela de 430 px).
4. **Divergências conscientes**: PLACEHOLDER sem persistência (ações reais
   → toast "funcionalidade em breve!"); vocabulário do Tetris Royale trocado
   ("Academia Royale", "Academia Masters BR"); emojis → avatares de iniciais
   (`.soc-avatar`) + SVG.

### Paridade de tipografia/cascata + raster stale — `v4.0.13-typography` (esta sessão; detalhe na entrada do CHANGELOG)
1. **Pins da cascata do Play CDN v3 em `globals.css`**: `body{line-height:inherit}`,
   `h1–h6{font-size/weight:revert-layer}`, line-heights absolutos das utilities
   `.text-*` (TW3), `* margin/padding: revert-layer` (utilities `mb-6`/`-mt-2`
   voltam a vencer o reset do `main.css`), preflight `border-color:#e5e7eb`.
   Requer Chrome/WebView 111+ (mesma restrição do news-overlay).
2. **7 pins não camadeados de `backdrop-filter`**: o par `backdrop-filter` +
   `-webkit-backdrop-filter` do espelho é deduplicado para só o prefixado no
   build (lightningcss) → `getComputedStyle` ficava `none` onde o legado tem o
   blur (`.cr-bg-container`, note-popover, dropdown, perfil-header, ficha-close,
   profile-edit, missions `ms-bg-overlay`). Não visual (1 px intacto).
3. **Layout raiz**: `dynamic-bg.css` removido (`main.tsx` não importa),
   `.cr-bg-container{z-index:0}` em `globals.css`; `main` ganha `treino-page`
   (necessária para anular o `background-color` opaco de `main.css`) + altura
   definite; cor herdada `#ffffff` (globals + `text-white` no `index.html` e na
   div raiz); `--card-border/hover` 0.2/0.25; fontes `font-body-lg/md` → Outfit.
4. **Scroll interno restaurado** (rollback `overflow:auto` desfeito): no legado
   o scroll acontece dentro de `.section-slide` (`overflow-y:auto` de
   `7-nav-icons.css`) com html/body travados — agora idêntico (shell `h-screen`
   + wrappers `.section-viewport`/`.section-strip`/`.section-slide` 1:1 no
   `App.tsx`; slides de treinos/progresso ganham o wrapper `data-section`).
5. **`repairSectionRaster()` (`App.tsx`)** — causa-raiz dos bands de 1–2 device
   px (streak y886–891, weekly y1214–1217, ink do h3 ~2 px): **raster stale na
   primeira pintura de seção montada depois do boot** (rects/computed/fontes
   idênticos; só o raster diverge). Qualquer mudança real de estilo em um
   ancestral (body/`#root`/main) repara; invalidação sem mudança de valor
   computado, não. Fix: set `-webkit-font-smoothing:auto` no body 450 ms após o
   `fadeSwap` → remove 200 ms depois (estado final idêntico ao original).
   Teoria do transform `uiFadeIn` DESMENTIDA por medição. **Progresso
   6239 → 65** (só GIF r3c5), dashboard 1717.
6. **Divergências/não-visuais medidos**: treinos nondeterminístico (R-vs-R =
   36000 diffs = ordem do L-vs-R; GIFs `<img>` não pausáveis);
   `state@R_treinos` null estrutural (React desmonta seções, legado mantém
   todas); font-family do `<html>` difere (preflight TW3 vs TW4, sem efeito —
   body herda Rajdhani); `measure_fonts` segue **0/0**.
7. **Verificação**: tsc/oxlint (0 warnings)/build verdes; `probe_text` 0;
   regressões 14/14 + 10/10 + 6/6 (SW limpo via `probe_sw.js` antes de cada
   medição).

### Splash do legado portada ao React — `v4.0.12-splash` (sessão anterior; detalhe na entrada do CHANGELOG)
O CSS da "Feature 9" já estava espelhado (`8-customizacao.css` L1979–2111) mas o
DOM nunca foi portado. Feito em `src-app/index.html`:
1. **DOM `#splashScreen`** 1:1 de `treino.html` L102–118 (primeiro no `<body>`,
   antes do `#root`) — aparece desde o primeiro paint, antes do bundle.
2. **Script inline** (port de L119–134 + saída do `app.js` L477–488): banner
   (`data-banner`) + nome/"BEM-VINDO DE VOLTA" lidos síncronos do
   `localStorage.academia_treino`; em `academia:db-ready` → 100 ms → fill 100%
   → 400 ms → `.splash-screen--hidden`; fallback de 10 s se o bundle falhar.
3. **Divergência pedida pelo usuário**: com treino em andamento a splash é
   **removida antes do paint** (`workout_start_time` de hoje ou
   `fichaEmAndamento`+data de hoje — flags do `app.js` L53–59); no legado ela
   aparece em todo boot. Nunca reabre (DOM estático, sem caminho de volta).
4. **Verificação**: CDP `verify_splash.js` **10/10 PASS** (boot, saída,
   db-ready extra não reexibe, 2 cenários de treino ativo sem splash,
   banner/nome) · screenshots React vs legado praticamente idênticos ·
   tsc/oxlint/build verdes.

### GIF da Extensão Lombar conectado — `v4.0.11-lombar-gif` (sessão anterior; detalhe na entrada do CHANGELOG)
O usuário entregou `Assets/exerciciosgif/Extensão Lombar.gif` (1.515.678 bytes,
já commitado na raiz e no `src-app/public/` pelo commit `ba7495e`), fechando o
pendente da entrada `v3.5.6` ("GIF ainda não entregue"). Feito:
1. **Espelho `www/Assets/exerciciosgif/`** (regra do README — o app legado roda
   de `www/`); 4 cópias com SHA-256 idêntico (raiz, `www/`, `public`, `android`).
2. **`JS/treino/db.js` L122 + espelho `www/`** (hashes idênticos):
   `imagem: null` → `'./Assets/exerciciosgif/Extensão Lombar.gif'` — instalações
   legadas existentes corrigem sozinhas no `loadDB()` (regra L148 de sync).
3. **`default-data.ts`**: `imageUrl: null` → `"/assets/exerciciosgif/Extensão Lombar.gif"`.
4. **`bootstrap.ts` → `backfillExerciseImages()`** (novo): restaura `imageUrl`
   de registros antigos no IDB (o seed só popula tabela vazia); idempotente,
   roda entre `ensureSeed()` e `migrateLegacyData()`.
5. **Verificação**: CDP `verify_lombar.js` 5/5 PASS (seed, backfill após null
   forçado, gif 200:1515678) · gif 200 nos 3 servidores · tsc/oxlint/build ·
   sintaxe dos `db.js` com `node --check`.

### Paridade visual do news-overlay — `v4.0.10-news-parity` (sessão anterior, commitada em `6a1d399`; detalhe na entrada do CHANGELOG)
**Causa-raiz**: no legado o `vendor/tailwind.min.css` (v3.4, **não camadeado**)
carrega depois de `main.css` → utilities vencem; no React (v4) as utilities
ficam em `@layer utilities` e perdem para o CSS legado espelhado não camadeado.
1. **Bloco `v4.0.10-news-parity` em `news-overlay.css`**: `revert-layer` escopado
   em `.news-overlay` (margins/paddings, headings fs/fw/lh/ls, p fs/lh/color)
   + pins: p sem lh própria → 1.8 (main.css), `.news-title/.update-title` lh 1.2,
   raiz `font-family: var(--font-family)` + lh 1.5, `.bg-gradient-to-t` → `none`
   (`from-deep-void` não existe no vendor), ícone material `revert-layer` +
   `line-height: 1` **exceto** `.premium-placeholder` (o `placeholders-animacoes.css`
   L47 (`.premium-placeholder span { font-size: 0.75rem }`, spec 0,1,1) já vence
   o `text-[80px]` lá — nos testes o ícone do hero estava saindo em 80 px),
   `border-tertiary-fixed-dim*` (inexistente no vendor) → `#e5e7eb`, `<hr>` →
   `rgba(#494454,0.2)`, `.news-date` → `#c084fc` (thememanager L1054 injeta
   `theme.primaryLight`; tema "Escuro") e `.update-date` → `#cccccc`.
2. **Footer**: `FOOTER_HTML` (`componentes/footer.js` L3–42 + estilos inline dos
   ícones do `theme-integration.js` L609–613) injetado nos 3 containers via
   `dangerouslySetInnerHTML` (fecha a divergência "footers vazios" da Fase 5 —
   decisão do usuário de portar).
3. **Tokens (`tailwind-legacy-theme.css`)**: `surface-container-highest` → `#36343b`,
   `card-border` → `#e5e7eb` (preflight do legado), `on-surface-variant` → `#cac4d0`,
   `font-body-lg/md` `Outfit` → `Rajdhani` (o build legado não gera as classes e o
   runtime herda Rajdhani — medido `contentFf`).
4. **View de detalhe (nunca medida antes)**: 13 diffs visuais → 0 — date lh 23.4 px
   + cor `#c084fc`; `tracking-tight` −0.325 px; botões 128×33 (ícone 16 px/lh 16 —
   base do Google em 24 px perdia para a utility só no React); ícone hero 9.75 px;
   hr/barra com cores legadas; conteúdo p em Rajdhani.
5. **Medição final**: lista = 6 diffs e detalhe = 15 diffs, **todas não-visuais**
   (oklab vs rgba com valores exatos, `border-color` em `border-width: 0`,
   margens `space-y` v3/v4 com gaps idênticos — todos os `xywh` batem);
   screenshots + band stats ±1 idênticos nos dois pares.

### Correções dos 4 bugs reportados — `v4.0.8-bugfix` (sessão anterior; detalhe na entrada do CHANGELOG)
1. **Timer negativo (`FichaFeature.tsx`)**: `now` (state) só era refrescado pelo
   intervalo de 1 s quando `isActive` ligava → `formatElapsed(now - startTime)`
   negativo ~1 s (repro: `-1:-8`). Efeito agora chama `setNow(Date.now())` ao
   ativar (paridade `initGlobalTimer`/`startInterval` L988–1028) + clamp
   `Math.max(0, now - startTime)` no display.
2. **Emblema ausente (`DashboardFeature.tsx`)**: `#dashAvatar` só tinha o ícone
   `shield_person`; agora porta `applyProfileCustomization` (L371–396):
   `.profile-avatar__emblem-wrapper` (mix-blend screen + `animate-pulse`), sprite
   `SPRITESHEET_URL`/URL, fallback dicebear, `data-frame` — mesmo render de
   `ProfileFeature.tsx` L331–352.
3. **Contador de ciclo (`queries.ts getCycleStats`)**: contava DIAS (`h.completed`
   desde `cycleStart`); dashboard legado usa `getCycleProgress` (L47–51) =
   **soma por ficha**. Bugs: 2º treino do mesmo dia não somava; a flag
   `completed` vira `false` ao trocar de ficha no meio da sessão
   (`selectSheetEntry`) e derrubava o contador ("não atualizado"); exibia o total
   de dias ("geral") em vez das fichas A/B (item 4). Agora soma `completedKeys`
   por letra nos dias ≥ `currentCycleStartDate` (estável contra a flag) +
   fallback `currentFichaWorkouts`. **Progresso segue por-dia** (paridade com
   `secao-progresso.js` — mesma assimetria do legado).
4. **`App.tsx handleOpenFicha`**: spread `{...e, sheetKey}` não recalculava
   `completed` → agora `selectSheetEntry` (espelha `setTodayTreino` db.js L440–451).

### Fase 5 — paridade das pendências (esta sessão; detalhe na entrada `v4.0.7-phase5` do CHANGELOG)
**Causa raiz única dos itens 1 e 2**: `#dashBtnIniciar` ("PRÓXIMO PASSO") nunca
iniciava o treino → `isActive` falso → CSS `.btn-start-workout{display:none}` +
`#globalWorkoutTimer` ocultos → sem contador e `#modalEncerrarTreino`
inalcançável pela Ficha. Corrigido em `App.tsx`:
1. **`handleOpenFicha(sheetKey)`** espelha `startWorkoutFromDashboard`
   (`secao-dashboard.js` L276–304): grava o treino na entry de hoje
   (`setTodayTreino` via `today-entry-store`, com guarda de `loaded` para não
   persistir entrada em branco), `startWorkout` só se `!isActive`, então abre a Ficha.
2. **`handleStartWorkout`** = `startWorkout` + toast `Treino iniciado! Foco total!`
   (fecha só a ficha/modal, como o `initGlobalTimer` L1007–1021); timer ativo +
   X da Ficha → `onRequestEncerrar` → `#modalEncerrarTreino` (L1022–1027).
3. **`NewsOverlay.tsx` + `news-overlay.css`** (novos): port 1:1 de `#news-overlay`
   (`treino.html` L303–427 DOM/CSS + L429–599 comportamento); aberto pelo
   `#dashBtnNoticias` do Dashboard; CSS inline extraído verbatim (+ `!important`
   que substituem os atributos `style` de `#news-main-view`/`main`).
4. **Social/Loja**: placeholders Tailwind ad-hoc → DOM legado
   `.section-slide > .treino-container > .main-section > .section-coming-soon`
   (`treino.html` L184–207) com textos corretos de cada seção (a Loja usava o
   subtítulo do Social) e reativando `7-nav-icons.css` L198–228.
5. **`BottomNav.tsx` 1:1**: DOM de `treino.html` L1046–1077 sem nenhuma utility
   Tailwind (`px-2 py-2`, `max-w-md`, `z-40`, `bg-[#0a0514]/95`, `text-[10px]`,
   `w-5 h-5`…). Motivo: o CSS legado é **não camadeado** e vence as utilities
   do Tailwind v4 (em `@layer utilities`, idx ≥ 275661) — padding/letter-spacing
   divergiam e os 5 botões (`flex:1`, `white-space:nowrap`) transbordavam.
6. **`ActiveWorkoutModal` fora do fluxo**: `isWorkoutModalOpen`,
   `handleCloseWorkoutModal`, import e render removidos do `App.tsx`; o arquivo
   permanece como scaffold não montado (5º órfão).
7. **Navbar sem espaço morto (`v4.0.7-phase5-navfix`, após commit da Fase 5)**:
   rollback em `globals.css` do padding inferior de `.bottom-nav`
   (`calc(6px + env(safe-area-inset-bottom))` → `6px 4px`) — em aparelhos que
   reportam safe-area a barra crescia para baixo dos ícones deixando faixa vazia
   (pedido do usuário com prints); espelho `7-nav-icons.css` intacto (divergência
   documentada), system_map → 3.5.17. Localmente `env()` = 0 (não reproduzível no
   headless) — confirmar no aparelho do usuário.

### Fase 3 — gamificação (detalhe na entrada `v4.0.5-phase3` do CHANGELOG)
Radar Fit real + badge de arquétipo, `showConclusao`/`modalEncerrarTreino`,
maestria (`maestria.ts`, `trackMaestriaSessoes`), share card (treino/conquista/radar,
html2canvas), `openVolumeDetails`, coleção de exercícios + maestria individual
(`maestria-ui.ts`/`ColecaoModals.tsx`), Modo Foco (`FocusModal.tsx`), overlay de
missões (estático, fiel ao legado) e helpers `fadeIn`/`fadeSwap` (`lib/animations.ts`).

### Fase 4 — seção Treinos + swipe + limpeza (detalhe na entrada `v4.0.6-phase4`)
Port 1:1 em `src-app/src/features/workout/treinos/` (8 arquivos: `TreinosFeature`,
`treinos-store`, `treinos-helpers`, `cards`, `ExercicioFormModal`, `TreinosModals`,
`CustomizacaoTabs`), `navigateSection` com guard `animatingRef` + swipe horizontal
(exclusões do `nav.js` L207–298), split de auth (`core/auth/use-auth.ts`), remoção
de `SheetsFeature`/`HistoryFeature`/`WorkoutProgressChart` e warnings zerados
(técnicas: remontagem `key` p/ init de modal, estado derivado, "adjust state on
prop change", `reduce` no `useMemo`, `TODAY_BASE`).

---

## 3. Mapa rápido dos arquivos (Fases 4 + 5)

| Arquivo | Papel |
|---|---|
| `src-app/index.html` | Shell + **splash `#splashScreen`** (port `treino.html` L102–118) com script inline: banner/nome do `academia_treino`, remoção imediata com treino ativo, saída em `academia:db-ready` (100 ms/fill/400 ms/`--hidden`). v4.0.12. |
| `features/news/NewsOverlay.tsx` + `news-overlay.css` | Overlay `#news-overlay`: 3 abas `noticias`/`atualizacoes`/`guias` (seta `tab-arrow`, `bg-[#8b5cf6]`, `drop-shadow`), `.tab-content`/`.active`, 4 notícias (1ª com rótulo "Notícias" + borda) e 7 atualizações, `MOSTRAR MAIS` (= remoção de `.hidden-news`/`.hidden-updates`), detail views `#news-detail-view`/`#update-detail-view` (`hidden-view`/`active`, slide 300 ms), paginação com fade 200 ms (**índice avança no clique, DOM só após o timeout** — `updateDetailContent`), conteúdo via `dangerouslySetInnerHTML`, **`FOOTER_HTML` nos 3 containers**, lock de `body.overflow`; bloco `v4.0.10-news-parity` no CSS. Fase 5 + paridade v4.0.10. |
| `App.tsx` | `handleOpenFicha(letter)` (timer + treino do dia, agora via `selectSheetEntry`), `handleStartWorkout` (toast, sem fechar ficha), `handleRequestEncerrar` → `#modalEncerrarTreino`, **branch social monta `<SocialFeature/>`** e Loja segue `.section-coming-soon` (v4.0.14), `ActiveWorkoutModal` removido, shell `h-screen` com wrappers `.section-viewport`/`.section-strip`/`.section-slide` 1:1 + `repairSectionRaster()` após cada `fadeSwap` (v4.0.13); seções/overlays/swipe das fases anteriores. |
| `src-app/src/styles/globals.css` | Pins da cascata v3 (`revert-layer`/line-heights/`* margin/padding`), preflight `border-color:#e5e7eb`, 7 pins `backdrop-filter`, thumb gradiente, scroll html/body `overflow:hidden`, `.cr-bg-container{z-index:0}`, `color:#ffffff`, rollback navbar `6px 4px` (v4.0.13 + v4.0.7-phase5-navfix). |
| `features/dashboard/DashboardFeature.tsx` | `onOpenFicha(letter: SheetKey)`, `#dashBtnNoticias` → `<NewsOverlay/>` (montado junto ao `<MissionsOverlay/>`), `#dashBtnMissoes` inalterado; `#dashAvatar` renderiza o emblema selecionado (v4.0.8). |
| `features/workout/FichaFeature.tsx` | props `onShowActiveWorkout` → `onRequestEncerrar`; `handleStartClick`: `!isActive` → `onStartWorkout`, senão `onRequestEncerrar()`; cronômetro sincroniza `now` ao ativar + clamp ≥ 0 (v4.0.8). |
| `core/db/queries.ts` | `getCycleStats` = soma **por ficha** desde `currentCycleStartDate` (paridade `getCycleProgress`; Progresso usa sua própria contagem por-dia); `selectSheetEntry`/`applyFichaCompletion` (v4.0.8). |
| `core/db/bootstrap.ts` + `default-data.ts` | `ensureSeed()` → **`backfillExerciseImages()`** (novo, v4.0.11 — restaura `imageUrl` de GIFs entregues após o seed; idempotente, só null → default) → `migrateLegacyData()` → flush; `default-data.ts` com `ex-extensao-lombar.imageUrl` preenchido (regenerar do `JS/treino/db.js` quando ele mudar). |
| `components/BottomNav.tsx` | Só classes legadas (`.bottom-nav/.bnav-btn/.bnav-icon/.bnav-label/.bnav-active-dot`), `data-section`, ids `bnavProgresso`/`bnavTreinos`/`bnavDashboard`/`bnavSocial`/`bnavLoja`. Fase 5 (reescrito). |
| `features/social/*` (4 arquivos) | Aba Social placeholder (v4.0.14): `SocialFeature.tsx` (sub-abas Liga/Amigos/Guilda + 3 modais, estado local), `social.css` (glass translucido + tokens), `social-data.ts` (mocks) e `social-icons.tsx` (SVG stroke). |
| `features/workout/treinos/*` (8 arquivos) | Fase 4 — ver tabela completa na entrada `v4.0.6-phase4`. |

---

## 4. Decisões e divergências conscientes (NÃO alterar sem reler o CHANGELOG)

1. **Deck slots compactos**: `exerciseIds: string[]` sem `null` — remoção = splice
   (perde a posição; legado usava `null` e preservava). Nulls quebrariam
   `fichaIds.every(...)` no App. Divergência documentada.
2. **Swipe**: só detecção de intenção + troca no fim (sem arrasto contínuo da fita, como o legado).
3. **`modalPicker`** é morto no legado → não portado; **`modalLevelUp`** omitido.
4. **`modalPicker`/`modalLevelUp`/footer `#btnMaestriaGeral`**: footer legado não existe no App.
5. **Banners**: `BANNERS.filter(b => !EXTRA_KEYS.test(b.key))` mantém masters em 2 grupos (paridade literal).
6. **Toast legado `'warning'`** é mapeado para `'info'` (o wrapper React só tem success/error/info).
7. **Componentes scaffold órfãos mantidos** (nunca montados, decidir futuro): `components/HeaderHUD.tsx`,
   `components/TabBar.tsx`, `components/ExerciseCard.tsx`, `components/ui/DynamicBg.tsx` e
   `features/workout/ActiveWorkoutModal.tsx` (fora do fluxo desde a Fase 5).
8. **News overlay (Fase 5 + v4.0.10)**: `closeNewsOverlay` não faz `_transitionTo('dashboard')`
   (só abre do Dashboard, mesmo racional do `MissionsOverlay`); swipe com o overlay aberto
   desmonta o Dashboard e o overlay some (idêntico no `nav.js`); micro-divergência de
   150 ms na `transition-opacity` da aba ativa. **Diffs aceitos da paridade** (medidos,
   não-visuais): serialização de cor oklab (v4) vs rgba (v3) com valores exatos,
   `border-color` de elementos com `border-width: 0` (preflight #e5e7eb vs currentcolor),
   margens `space-y` (v3 põe `margin-top` no irmão seguinte, v4 `margin-end` no anterior
   — gaps e `xywh` idênticos). `revert-layer` exige Chrome/WebView 111+.
9. **SOCIAL/LOJA AGORA PARIDADE** (item resolvido na Fase 5): DOM
   `.section-coming-soon` portado de `treino.html` L184–207 com o texto correto de cada seção.
10. **v4.0.13 — raster stale e medição**: o `repairSectionRaster()` alterna
    `-webkit-font-smoothing` por ~650 ms a cada troca de seção (estado final
    idêntico; não altera texto/posições, só o raster da primeira pintura).
    **Treinos é nondeterminístico** (GIFs `<img>` avançam entre capturas —
    R-vs-R entre sessões idênticas = 36000 diffs; não comparar células de GIF).
    `state@R_treinos` null para "Sua Semana" é estrutural (React desmonta
    seções; legado mantém todas). `revert-layer`/pins exigem Chrome/WebView 111+.

---

## 5. Regras obrigatórias (recarregar no início de toda sessão)

1. **CHANGELOG imediatamente** após QUALQUER alteração (`Diretrizes/CHANGELOG.md`):
   `## [vX.X.X] - YYYY-MM-DD` no topo, tags `[Added]/[Changed]/[Fixed]/[Removed]`,
   citar arquivos; versão vigente = `v4.0.13-typography-docs` (+ sufixo de rótulo p/ docs, ex. `-docs`).
2. **`system_map.json`**: incrementar `version` sempre que estrutura/documentação indexada mudar
   (hoje: **3.5.23**), citar o incremento no CHANGELOG, **JSON sem BOM** e validar:
   `node $env:TEMP\opencode\checkjson.js "C:\Nova pasta\htdocs\Academia\Diretrizes\system_map.json"`
   (script de uma linha: `JSON.parse(fs.readFileSync(process.argv[2],'utf8'))` + imprime a versão;
   recriar se o %TEMP% tiver sido limpo).
3. **Comandos de verificação padrão** (rodar em `src-app/` ao fim de qualquer mudança):
   ```powershell
   npx tsc -b          # typecheck
   npx oxlint src      # precisa sair 0 warnings
   npm run build       # = tsc -b && vite build → dist/assets/index-*.js
   # preview (start-process npm FALHA → usar cmd /c com -WorkingDirectory):
   Start-Process cmd -ArgumentList '/c','npm run preview -- --port 4173 --strictPort > %TEMP%\opencode\preview.log 2>&1' -WindowStyle Hidden -WorkingDirectory "C:\Nova pasta\htdocs\Academia\src-app"
   # encerrar ao final:
   Get-NetTCPConnection -LocalPort 4173 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```
   Strings novas devem ser checadas no bundle com **script Node UTF-8** (ex. `$env:TEMP\opencode\checkdist.js` —
   `fs.readFileSync(..., 'utf8')` + `.includes(marcador)`; o PowerShell mojibaka acentos e dá falso-positivo).
4. **Shell/PowerShell 5.1 (gotchas)**: não existe `rg`; `Select-String` **sem `-Recurse`** e globs `**`
   não funcionam (usar `grep` tool ou script Node); `Set-Content -Encoding UTF8` **adiciona BOM**
   (remover via Node); `node -e` com aspas/acentos quebra → escrever `.js` no `%TEMP%\opencode\`
   com a ferramenta write e rodar `node <caminho>`; `npm run build | Select-Object -First N`
   **mata o build** (usar `*> log` + `-Tail`); **ler arquivos com a ferramenta `read`** antes de
   editar (o console mojibaka o texto e o `oldString` falha); payloads gigantes de `write` quebram
   (particionar com sentinela + `edit`).
5. **Fonte de verdade**: `src-app/dist/assets/index-*.js` (git tem `src-app` desde `5663cad`).
   **CUIDADO com patches de texto em `system_map.json`**: usar substituição literal
   (como `patch_sysmap.js`), **NUNCA** `JSON.stringify(m, null, 2)` — isso reescreve
   os arrays inline do formato original e infla o diff em ~300 linhas (aconteceu hoje;
   reconstruído a partir do `git show HEAD:` + reps textuais via `rebuild_sysmap.js`).

---

## 6. Próximos passos (ordem sugerida)

1. **Commit** (só quando o usuário pedir): `v4.0.11-lombar-gif` +
   `v4.0.12-splash` + `v4.0.13-typography` + **`v4.0.14-social-placeholder`** —
   `JS/treino/db.js` + espelho `www/`, `src-app/src/core/db/{default-data.ts,bootstrap.ts}`,
   `src-app/index.html`, os 7 arquivos modificados (App.tsx + styles + main.tsx +
   DashboardFeature), **a pasta nova `src-app/src/features/social/` (4 arquivos)**,
   gif untracked `www/Assets/exerciciosgif/Extensão Lombar.gif` +
   docs (CHANGELOG/system_map/context.md) — revisar `git status`, `git diff`
   e `git log --oneline -10`.
2. **Confirmar com o usuário a interpretação do item 4** ("total de treinos
   geral" → resolvemos como dias vs. soma por ficha no card `#dashCycleVal` /
   pílula `#dashEmblemsValue`); se ele quis OUTRO elemento, investigar.
3. **Teste manual da Fase 5** no preview (checklist): `#dashBtnIniciar` → ficha com
   cronômetro rodando → X/parar → `#modalEncerrarTreino` → Encerrar → `showConclusao`;
   `#dashBtnNoticias` → 3 abas, cartões, MOSTRAR MAIS, detalhe prev/next, ESC,
   footer visível na lista e nos detalhes; **Loja** com `.section-coming-soon`
   (o Social agora é `SocialFeature`);
   navbar com labels visíveis e dot ativo; swipe não dispara dentro do news-overlay
   (divergência aceita). Paridade news medida por script (lista 6 / detalhe 15 diffs
   não-visuais): `node $env:TEMP\opencode\measure_news.js` + `diff_measure.js` e
   `node $env:TEMP\opencode\probe_detail.js` (precisa de :4173, :8099, :9222).
3b. **Teste manual da aba Social** (placeholder v4.0.14): abrir `#bnavSocial` →
   Liga (banner, resgates do Caminho, filtros do ranking, clique no ranking →
   modal perfil), Amigos (modal duelo/adicionar amigo, status), Guilda (enviar
   mensagem no chat, 4 pílulas, doar item), ESC/backdrop fecham modais, fundo
   dinâmico visível atrás das superfícies glass, layout 1 col ≤820px e nenhuma
   cor hardcoded; ações "reais" disparam o toast "funcionalidade em breve!".
4. **Teste manual da Fase 4** (seção Treinos) — checklist completo na entrada
   `v4.0.6-phase4` do CHANGELOG.
5. **known_gaps menores** (system_map): `#modalDayHist` sem lock de `body.overflow`,
   rest timer só no Modo Foco, overlay de missões estático (desenho legado),
   destino dos 5 componentes scaffold órfãos (agora inclui `ActiveWorkoutModal`).
6. **Deploy Vercel**: atenção aos **dois `vercel.json`** — o da raiz aponta para
   `Academia/dist/` desatualizado; o projeto precisa de Root Directory = `src-app` (ver `system_map → build.deploy`).
7. Se houver pedido de paridade total de deck com `null`s, revisar `fichaIds.every()`
   em `App.tsx` antes de mudar o formato (divergência nº 1 da seção 4).
   (Re-regressão dos bugs v4.0.8: `node $env:TEMP\opencode\verify_fixes.js` com preview
   :4173 + Chrome CDP :9222 — espera 14/14 PASS.)
8. **Melhorias medidas deixadas p/ depois** (abaixo da dobra do Progresso):
   volume-card 4.8 px e `progresso-grid` 5.86 px (row5/row7) fora de fase com o
   legado — exigiria ajuste de conteúdo/spacing e re-measure.

---

## 7. Referências rápidas

- Legado (fonte da verdade de DOM/comportamento): `treino.html` (news-overlay L303–599,
  placeholders L184–207, bottom-nav L1046–1077), `componentes/secoes/*.html`,
  `JS/treino/{db,nav,app,secao-*,templates}.js`.
- React: `src-app/src/App.tsx` (shell, overlays, seções, swipe) · `src-app/src/features/**` ·
  CSS legado espelhado em `src-app/src/legacy-style/` + agregador `src/styles/legacy.css` ·
  `src-app/src/legacy-style/treino/7-nav-icons.css` (navbar + `.section-coming-soon`).
- Diretrizes: `Diretrizes/README.md` (leitura obrigatória) · `DESIGN.md` (obrigatório antes de
  mexer em visual; §4.2 = spec da navbar) · `Diretrizes/Ícones.md` (ícones SVG) ·
  `Diretrizes/system_map.json` (índice).
