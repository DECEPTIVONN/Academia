# Changelog do Projeto Academia

> **📋 INSTRUÇÃO OBRIGATÓRIA PARA AGENTES DE IA:** Toda alteração deve ser registrada neste arquivo. Use formato [vX.X.X] - YYYY-MM-DD e tags [Added], [Changed], [Fixed].

## [v4.56.4] - 2026-10-28

**Radar e volume só nas telas de Tendências, heatmap sem troca de aba, scroll do calendário e transições de entrada/saída.**

### Changed
- `src-app/src/features/training/ProgressoFeature.tsx`: os cards fixos **Volume de Carga** e **Atributos de Performance** saíram da aba — o volume já abre pelo card **Volume** das Tendências (modal) e o Radar Fit pelo card **Treinos** (Tendências de Treino). O botão **Compartilhar Radar** e o guia **“Como são calculados?”** migraram para a tela de Tendências (a interrogação no cabeçalho e o botão abaixo do radar); a aba não monta mais `RadarChart`/`useRadarMode`. O radar da tela de Tendências mantém `id="radarChartContainer"` — o `ShareModal` clona esse SVG ao compartilhar.
- `src-app/src/App.tsx`: `.prog-heat__scroll` entrou na lista de alvos que ignoram o swipe de seção (como `.month-grid` e `.table-scroll-wrap`) — arrastar o heatmap de séries não troca de aba.
- **Scroll do Calendário de Treinos:** `.cal-ov__body` ganhou `flex: 1 1 auto; min-height: 0` (e `-webkit-overflow-scrolling: touch`). Sem `min-height: 0` o filho flex não encolhia abaixo do conteúdo, o painel estourava o `max-height` e a **linha do ciclo 0–30** ficava cortada sem rolagem vertical.
- **Transições de entrada e saída** (mesmo padrão `useModalPresence` + `.is-closing` de `CycleModal`/`Ofensivas`):
  - Calendário + Ciclo (`.cal-ov`): fade/slide do painel na entrada (já existia) e saída com `cal-ov-out`/`cal-ov-panel-out`.
  - Tendências de Treino / Radar Fit (`.tr-overlay`): o componente agora aguarda a animação de saída antes de desmontar; `.tr-body` ganhou `flex: 1 1 auto; min-height: 0`.
  - Volume geral das Tendências (`.modal-overlay` + `.vol-detail`) e **Detalhes de Volume**: montagem condicional com presença (a animação `volDetailIn` volta a rodar a cada abertura) e `volDetailOut` na saída; o último grupo aberto fica retido para o painel não esvaziar enquanto fecha.
  - Comparar métricas (`BodyMetricsOverlay`): telas Métricas ⇄ Comparar trocam com `bm-screen-in`/`bm-screen-out` (o conteúdo antigo sai antes do novo entrar, com `key={screen}`).

### Fixed
- `src-app/src/features/training/calendar-overlay.css`: calendário sem rolagem vertical e linha do ciclo exibida pela metade.
- `src-app/src/features/training/progresso.css`: removido o CSS órfão do alternador `.radar-seg` (o controle agora vive em `.tr-seg`, na tela de Tendências).

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.

## [v4.56.3] - 2026-10-28

**Volume de carga com a carga sugerida, calendário+ciclo em tela própria, Tendências com radar em tela cheia e volume em modal.**

### Changed
- `src-app/src/features/training/progress-stats.ts`: `exerciseVolume` passa a considerar a **carga sugerida** (`lib/suggested-load.ts`) quando o exercício ainda não tem `load` salvo — antes o seed (que nunca grava `load`) deixava o donut, as tendências e o modal de volume em 0. A carga salva mantém o parse antigo; a sugerida usa `parseLoadKg` (que já dobra "cada lado") e não reaplica `porLado`.
- **Calendário + Ciclo em uma interface dedicada** (`ProgressoFeature.tsx` + novo `calendar-overlay.css`): o calendário **Mensal (Grid) / Semanal (Planner)** saiu do fluxo da aba e agora abre em tela cheia pelo card do mês (Atividade) e pelo card **Treinos no Mês**. A tela reúne o resumo do **Ciclo de Treino Atual** (barra 0–30, status, breakdown por ficha) e a **linha do ciclo 0–30** (`getCycleTimeline`, a mesma do modal "Ciclos" do Início, com data/duração/status).
- **Tendências clicáveis:** o card **Volume** abre o volume de carga em modal (donut + legenda por grupo + seletor 7/30/total; tocar num grupo abre o detalhe individual já existente) e o card **Treinos** abre a nova tela **Tendências de Treino** com o Radar Fit em tela cheia. O alternador de período virou um **segmented control** (Semana / Mês / Ano / Todo o período) no visual da referência enviada, com o resumo **Treinos · Séries · Volume** do recorte; o Radar Fit em si (fórmulas e SVG) não mudou — só o histórico do período é filtrado.
- O alternador do card **Atributos de Performance** também foi refeito no mesmo estilo segmentado (`Mês` / `Todo o período`), mantendo os ids `btnRadarMensal`/`btnRadarTotal`.
- `src-app/src/features/training/progresso.css`: estilos do donut/legenda extraídos para `VolumeBreakdown` (usado no card e no modal), cards de tendência clicáveis (`.prog-trend--btn`), `Treinos no Mês` como botão (`.stat-item--btn`) e o segmented control `.radar-seg`.
- **Heatmap de séries:** a rolagem até o mês atual deixou de ser `smooth` no boot e passou a ser **instantânea** e disparada por `IntersectionObserver` (só quando o heatmap está visível, threshold 0.35) — não disputa mais com a animação de transição entre abas.
- `src-app/src/App.tsx`: `.cal-ov` (Calendário+Ciclo) e `.tr-overlay` (Tendências/Radar) entraram na lista de alvos que ignoram o swipe de seção, como os demais overlays — arrastar dentro deles não troca de aba. `Esc` fecha as camadas na ordem de abertura (dia do calendário → grupo do volume → volume geral → calendário).

### Added
- `src-app/src/features/training/calendar-overlay.css` (novo): tela `.cal-ov*` (painel, cabeçalho, ciclo, linha do tempo 0–30 e calendário embutido), fullscreen no mobile.
- `src-app/src/features/training/TrendRadarOverlay.tsx` + `trend-radar.css` (novos): "Tendências de Treino" — Radar Fit em tela cheia, segmented control de 4 períodos e resumo Treinos/Séries/Volume.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.

## [v4.56.2] - 2026-10-28

**Modal de volume com background, conclusão automática do treino, heatmap no mês atual e moldura do avatar seguindo a sub-aba Emblema.**

### Added
- `src-app/src/features/training/volume-details.css` (novo): painel `.vol-detail*` do modal "Detalhes de Volume" da aba Progresso — fundo escuro em glassmorphism (gradiente + `radial-gradient` no acento do tema), borda/glow, cabeçalho com eyebrow + nome do grupo, cards de Volume total e Tendência, card "Evolução de carga" com a média e a Distribuição por exercício em barras (nome, valor, barra proporcional e "% do grupo"), scroll interno estilizado e breakpoints em 480/360 px. O `.modal-overlay` legado não dava contraste ao conteúdo solto do React; agora o painel tem superfície própria.

### Fixed
- `src-app/src/features/training/ProgressoFeature.tsx`: o modal `#modalVolumeDetails` foi reescrito com a UI nova (referência `Legacy/componentes/secoes/modais.html` L827–852 + `secao-progresso.js` L589 `openVolumeDetails`): título do grupo muscular, Volume Total, Tendência, gráfico (`buildVolumeLineChartSvg` continua injetando no `#volDetChartContainer`) e lista de exercícios com barra de distribuição. Fecha pelo X, pelo overlay e respeita `aria-labelledby`; antes o conteúdo não tinha background e ficava ilegível sobre a tela.
- `src-app/src/features/workout/FichaFeature.tsx`: **concluir todos os exercícios agora abre a conclusão**. O efeito usava `entry.completed` como curto-circuito e `applyFichaCompletion` grava `completed` no MESMO update do último check, então a transição era engolida e o usuário ficava preso na interface de treino. A transição passou a comparar `isDone` com um baseline (`doneBaselineRef`) iniciado só depois de `entryLoaded` e do fim do `loading`, mantendo o callback de 400 ms e a supressão no Modo Foco.
- `src-app/src/features/workout/FichaFeature.tsx`: o cardio padrão (10 min de esteira) segue VISÍVEL, mas só entra na contagem de conclusão quando está realmente configurado (`requiresAe`, espelhando `hasAe = ae && ae.tipo` do legado) — antes marcar todos os exercícios não concluía a ficha sem um check extra no cardio padrão.
- `src-app/src/features/training/ProgressoFeature.tsx`: o heatmap de séries da aba Progresso abre **centralizado no mês atual** (`.prog-heat__cell--today` via `getBoundingClientRect` em dois `requestAnimationFrame`, com `behavior: 'smooth'`); em anos anteriores a rolagem volta ao início do ano. Antes o heatmap abria sempre no começo (janeiro).
- `src-app/src/legacy-style/treino/secoes/dashboard.css`: a moldura do avatar do Início agora segue `data-frame`. O contêiner `.dash-profile-avatar.profile-avatar` tinha `border: 2px solid #eab308` fixo, que mascarava a escolha da sub-aba Emblema; sem moldura o anel é neutro (`rgba(255,255,255,.16)`) e `[data-frame="bronze|prata|ouro|elite"]` pinta `border-color` + glow no próprio contêiner. Os outlines internos duplicados (img/svg/wrapper) foram neutralizados.

### Changed
- `Diretrizes/system_map.json` (version `4.56.1` → `4.56.2`, `last_updated` `2026-10-28`): `volume-details.css` entra em `react_app.styles`, o atalho `progresso` cita o novo CSS/`volume-details.css` e o `purpose` de `FichaFeature.tsx` registra a conclusão corrigida.
- `Diretrizes/DESIGN.md`: §7.4 atualizada (moldura no contêiner, anel neutro sem moldura) e §16.9 ganha o `.vol-detail*` (CSS, classes e comportamento do auto-scroll do heatmap).

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.

## [v4.56.1] - 2026-10-27

**Nova logo sem fundo nos ícones e layout da aba Progresso redimensionado.**

### Changed
- `src-app/public/assets/icons/` regerados a partir do novo `src-app/src/assets/Logo.png` (arte nova, SEM fundo): `logo-32.png` e `logo-48.png` (ícone da aba no desktop), `logo-180.png` (apple-touch-icon), `logo-192.png` e `logo-512.png` (ícones `purpose: any` do manifesto PWA + `og:image`) agora têm fundo TRANSPARENTE; `logo-maskable-512.png` (`purpose: maskable`) mantém fundo preto com o logo a ~68% — dentro da safe zone, mesmo enquadramento do ícone anterior. Nenhuma referência muda: `index.html` e o `manifest` do `vite-plugin-pwa` apontam para os mesmos caminhos.
- `src-app/src/legacy-style/treino/2-modals.css`: `.progresso-grid` usa `grid-template-columns: minmax(0, 1fr)` — com `1fr` puro o track crescia até o min-content dos filhos e TODOS os cards da aba Progresso viravam 795 px dentro de uma coluna de ~338 px (cortados na horizontal em telas estreitas).
- `src-app/src/features/training/progresso.css`: `.progresso-grid > * { min-width: 0 }` — nenhum filho força o track a esticar. O heatmap (12 meses de células, ~795 px) é o único conteúdo mais largo que a coluna e passa a rolar dentro de `.prog-heat__scroll`, que já tem `overflow-x: auto`.

### Verificado
- `npm --prefix src-app run build`: OK — `dist/` com os 6 ícones novos e `manifest.webmanifest` apontando para `logo-192/512` e `logo-maskable-512`.
- No navegador: track do `.progresso-grid` em 338 px (= largura da coluna), nenhum filho acima da coluna, heatmap com rolagem interna (conteúdo 757 px em 300 px visíveis) e `document.scrollWidth` igual à viewport (sem estouro lateral).

## [v4.56.0] - 2026-10-27

**Métricas corporais no banco local, sub-aba "Emblema" com foto de perfil e moldura que segue a escolha.**

### Added
- `src-app/src/lib/image.ts` (novo): `fileToDataUrl(file, { maxSide, quality })` — redimensiona no canvas (lado maior limitado) e devolve data-URL JPEG; usado pela foto de perfil (480 px) e pelas fotos de progresso (720 px).
- `src-app/src/features/workout/treinos/emblema-tab.css` (novo): estilos do seletor de foto de perfil (`.profile-photo-picker`, `.btn-profile-photo`, `.btn-profile-photo-remove`).
- **Upload de foto de perfil na sub-aba Emblema** (`CustomizacaoTabs.tsx`): antes a foto só vinha do Google OAuth ou do emblema equipado; agora "Carregar foto" grava `customization.photo` (mesmo campo, prioridade sobre o emblema em `ProfileEmblem`, avatar do Início, sidebar, drawer e Fit ID) e "Remover foto" volta ao emblema. O OAuth do Google só sobrescreve quando não há foto ou quando a foto atual é do Google (`App.tsx`), então a escolha manual permanece.

### Changed
- `features/training/body-metrics.ts` + `core/db/schema.ts` + `core/db/idb.ts` + `core/sync/sync-manager.ts`: **fotos e medições passam do `localStorage` para o BANCO local** — tabelas Dexie `bodyMeasurements` (uma medição por dia, peso em kg, gordura, cintura) e `bodyPhotos` (front/side/back, JPEG 720 px). A chave antiga `academia_body_metrics_v1` é migrada na primeira leitura e removida; gravações disparam `academia:body-metrics-changed`, recarregam o hook `useBodyMetrics()` e entram no snapshot de sync (`buildSnapshot`/`applySnapshot` + auto-push do sync-manager).
- `features/training/ProgressoFeature.tsx` e `BodyMetricsOverlay.tsx` leem pelo hook `useBodyMetrics()` (carregamento, evento de mudança e `academia:db-ready` após um pull da nuvem).
- Sub-aba **"Maestrias" passa a se chamar "Emblema"** (rótulo em `TreinosFeature.tsx`; o id interno `maestrias` segue o mesmo).
- `features/profile/profile-data.ts`: as molduras de avatar (`AVATAR_FRAMES`) viram escolha LIVRE (`unlock: null`) e `revertLockedCustomizations` deixou de zerá-las — antes ficavam atrás de tiers de maestria/100 treinos e a seleção na sub-aba era ignorada, então a moldura do Início nunca mudava.
- `legacy-style/treino/secoes/dashboard.css`: o avatar/emblema do Início passa a ser REDONDO (`border-radius: 50%` no contêiner, na `<img>` e no wrapper do emblema, também no breakpoint mobile) e as molduras `[data-frame]` (bronze/prata/ouro/elite) ganham anel redondo acompanhando o círculo.
- `Diretrizes/system_map.json` (version `4.55.0` → `4.56.0`) e `Diretrizes/DESIGN.md` (§16.9) atualizados.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.
- No navegador (dev server `http://localhost:5173`): a chave `academia_body_metrics_v1` migrou para o banco e saiu do `localStorage`; nova medição gravou em `bodyMeasurements` (merge por dia) e o card Corpo atualizou sem reload; o overlay de métricas abriu com os dados; a moldura escolhida na sub-aba Emblema apareceu no Início com `data-frame` + anel (ex.: ouro `#fbbf24`, elite `var(--primary)`), tudo em `border-radius: 50%`. Dados de teste removidos ao final.

## [v4.55.0] - 2026-10-27

**Aba Progresso reformulada com a Central de Ofensivas e as Métricas corporais.**

### Added
- `src-app/src/features/training/progress-stats.ts` (novo): derivações da aba — ofensiva em SEMANAS (meta semanal de `trainingFrequencyDays`, padrão 3), constância em DIAS, resumo da semana atual, heatmap anual de séries, tendências (treinos/volume/energia/séries contra o período anterior) e pontuação de força (0–100 pelo radar, a partir de 3 treinos concluídos). Passa a concentrar `keysOfDay`, `exerciseVolume`, `seriesOfDay`, `fmtDateLocal` e `formatVolume` (as cópias locais da ProgressoFeature saíram).
- `src-app/src/features/training/OfensivasOverlay.tsx` + `ofensivas.css` (novos): Central de Ofensivas ("Sequências") em tela cheia — hero de semanas de sequência ("N dias / semana"), cards de Treinos esta semana, Melhor sequência, Sequência de consistência e Melhor consistência (com folha inferior explicativa; a de treinos abre os dias da semana), "Classificação" em abas (Sequência Atual com as últimas 8 semanas | Treinos do mês com seletor de mês) e o card "Compartilhar Atividade" com "Convidar um amigo" (reaproveita o convite do Social: `shareNative` → clipboard + toast).
- `src-app/src/features/training/BodyMetricsOverlay.tsx` + `body-metrics.ts` + `metricas-corporais.css` (novos): Métricas corporais em tela cheia — peso, fotos de progresso (Frente/Lado/Costas), gordura corporal, cintura, registro de medidas por data (uma por dia, com merge), unidade kg/lb e a tela Comparar métricas (7D/30D/90D/6M/1Y, com "Ainda não há dados suficientes para comparar" quando não há duas datas). Dados em `localStorage` (`academia_body_metrics_v1`); fotos de progresso são reduzidas a 720 px em JPEG antes de gravar.

### Changed
- `src-app/src/features/training/ProgressoFeature.tsx` + `progresso.css` (novo): a aba ganhou o cabeçalho "Progresso" (o "+" abre as métricas corporais) e as seções Pontuação de Força, Atividade, Séries (heatmap anual com seletor de ano), Tendências (Semana passada/Último mês/Total), Corpo (peso + atalho das fotos) e Conquistas (linha "Emblemas" que abre o Perfil + contagem de emblemas conquistados).
- O card do MÊS ATUAL em Atividade ("September" na referência é sempre o mês de hoje) leva ao calendário existente: rola até ele e reposiciona o mês corrente, SEM alterar a visão escolhida (Mensal grid / Semanal planner seguem inalterados).
- Cards legados "Ofensiva (Dias Seguidos)" e "Sua Semana" saíram da aba — a informação passou para os cards de Atividade e para a Central de Ofensivas. Seguem exibidos, sem alteração: Ciclo de Treino Atual, calendário Mensal/Semanal, Total de Treinos, Volume de Carga, Atributos de Performance (radar) e Calculadora de 1RM.
- `src-app/src/App.tsx`: `<ProgressoFeature onOpenPerfil={…}/>` (linha "Emblemas") e as classes dos overlays novos (`.of-root`, `.bm-root`) entram na lista de alvos que ignoram o swipe de seção.
- `src-app/src/features/training/progresso.css`: `.calendar-view-toggle` ganha `scroll-margin-top` para a rolagem até o calendário.
- `Diretrizes/system_map.json` (version `4.54.10` → `4.55.0`) e `Diretrizes/DESIGN.md` (§15/§16.8) atualizados com os arquivos e as classes novas.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base).
- `npm run lint:docs`: OK.

## [v4.54.10] - 2026-10-27

**Ajustes finais: cardio/esteira na mesma linha e fonte unificada.**

### Changed
- `src-app/src/styles/shell.css`: `.ae-table-label` e `.ae-table-type` passam a ser inline (mesma linha) e herdam a tipografia do site.

## [v4.54.9] - 2026-10-27

**Animações suaves no Modo Foco, notas e saída do treino.**

### Changed
- `src-app/src/features/workout/FocusModal.tsx`: entrada/saída animadas via `useModalPresence`; troca de exercício reexecuta `focusFadeIn` (key no container).
- `src-app/src/App.tsx`: a interface da ficha de treino anima a saída (fade/scale) antes de desmontar.
- `src-app/src/features/workout/FichaFeature.tsx`: o modal de anotações passou a usar `useModalExit`, animando exibição e desaparecimento.

### Verificado
- `npm --prefix src-app run build`: OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos.
- `npm run lint:docs`: OK.

## [v4.54.8] - 2026-10-27

**Animações suaves na ficha de treino.**

### Changed
- `src-app/src/App.tsx`: a interface da ficha de treino (overlay) passou a animar a saída (fade/scale) via classe `.is-closing` antes de desmontar, em vez de sumir instantaneamente.
- `src-app/src/features/workout/FichaFeature.tsx`: o modal de anotações passou a usar `useModalExit`, animando a exibição e o desaparecimento.

### Verificado
- `npm --prefix src-app run build`: OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos.
- `npm run lint:docs`: OK.

## [v4.54.7] - 2026-10-27

**Ajustes finais de UI: avatar redondo no Início, tipografia/ícones do Fit ID, emblemas redondos e saída suave do menu do Início.**

### Changed
- `src-app/src/styles/shell.css`: avatar do Início (`dash-profile-avatar`) passa a ser circular.
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: tipografia do Fit ID herda Rajdhani (removido `font-sans`); ícones de emoji (🎁, 🛡️) substituídos por `Gift`/`Shield`.
- `src-app/src/styles/shell.css`: emblemas de identificação (`.emblem-card`) passam a ser redondos.
- `src-app/src/features/dashboard/InicioMenuModal.tsx`: entrada/saída animada via `useModalPresence` + classes `.is-closing` em `inicio-menu.css`.

### Verificado
- `npm --prefix src-app run build`: OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos.
- `npm run lint:docs`: OK.

## [v4.54.6] - 2026-10-27

**Ajustes de UI no Início e no Fit ID.**

### Changed
- `src-app/src/styles/shell.css`: avatar do Início (`dash-profile-avatar`) passa a ser circular (border-radius 50%).
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: tipografia do Fit ID deixa de forçar `font-sans` (herda Rajdhani do restante do site); ícones de emoji (🎁, 🛡️) substituídos por ícones lucide (`Gift`, `Shield`) nas seções "Junte pontos e ganhe prêmios" e "Proteção da conta".

## [v4.54.5] - 2026-10-27

**Fit ID: alinhamento visual das configurações com o app.**

### Changed
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: a tela de configurações do Fit ID passou a usar a paleta do app (zinc/primary) nos contêineres, textos e toggles, em vez dos tons claros herdados do port legado.

## [v4.54.4] - 2026-10-27

**Fit ID: amigos reais, "Outros Apps", moldura funcional e remoção de emblemas legado/prestígio.**

### Changed
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: a aba Amigos agora lista os amigos realmente adicionados no app (`loadAddedFriends()`), sincronizando via eventos; "Adicionar Amigos" avisa para adicionar na aba Social. "Meus Jogos" renomeado para "Outros Apps". O avatar do Fit ID recebe `data-frame` da moldura escolhida, aplicando o contorno.
- `src-app/src/features/profile/profile-data.ts`: removidos os emblemas "Estrela Alada", "Escudo Caveira", "Coração de Leão", "Águia Dourada", "Legado Alpha", "Vetor V", "Anjo da Morte", "Estrela Nova", "Lobo de Prata" e "Caveira Alada".
- `src-app/src/features/dashboard/FitIdOverlay.tsx` e `DashboardFeature.tsx`: propagam `avatarFrame` até o avatar do Fit ID.
- `src-app/src/features/workout/treinos/CustomizacaoTabs.tsx`: fallback para `prestigio-1` se o emblema salvo foi removido.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros e 73 avisos.
- `npm run lint:docs`: OK.

## [v4.54.3] - 2026-10-27

**Fit ID: amigos reais, "Outros Apps", moldura de avatar funcional e remoção de emblemas legado/prestígio.**

### Changed
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: a aba Amigos passa a listar os amigos realmente adicionados no app (`loadAddedFriends()`), sincronizando via `academia:friends-updated`/`academia:friends-changed`/`academia:db-ready`; o botão "Adicionar Amigos" virou aviso para adicionar na aba Social. "Meus Jogos" foi renomeado para "Outros Apps". O avatar do Fit ID recebe `data-frame` da moldura escolhida, aplicando o contorno correspondente.
- `src-app/src/features/profile/profile-data.ts`: removidos os emblemas "Estrela Alada", "Escudo Caveira", "Coração de Leão", "Águia Dourada", "Legado Alpha", "Vetor V", "Anjo da Morte", "Estrela Nova", "Lobo de Prata" e "Caveira Alada" de `IDENTITY_EMBLEMS`.
- `src-app/src/features/dashboard/FitIdOverlay.tsx` e `DashboardFeature.tsx`: propagam `avatarFrame` até o avatar do Fit ID.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros e 73 avisos (mesma contagem anterior).
- `npm run lint:docs`: OK.

## [v4.54.2] - 2026-10-27

**Animações profissionais dos ícones Amigos, Guilda e Liga ao tocar.**

### Added
- `src-app/src/features/social/LigasFeature.tsx`: estado `pressed` (360 ms) no `DiamondNav` aplica uma classe específica ao ícone tocado — `ligas-nav-icon--tap-amigos`, `--tap-guilda` ou `--tap-liga` — disparando animações distintas para cada ícone; o botão recebe `ligas-nav-btn` para o feedback de pressão (`:active`).
- `src-app/src/features/social/social.css`: animações dedicadas por ícone — escudo com escala + brilho (`ligas-shield-tap`), balão de mensagem com pop/rotação (`ligas-message-tap`) e espadas se batendo (`ligas-swords-tap`) — além de `ligas-nav-btn:active` (`scale(0.92)`) e bloco `prefers-reduced-motion`.

## [v4.54.1] - 2026-10-27

**Correção da animação de saída dos modais: a saída agora é visível em vez de instantânea.**

### Fixed
- `src-app/src/styles/modal-motion.css`: removido `opacity: 0 !important;` do `.modal-overlay.is-closing`, que derrubava a animação de fade (o `!important` vencia o `@keyframes` e deixava overlay/painel invisíveis na hora). Agora o fade usa apenas `modalOverlayOut`/`modalPanelOut` (220 ms).
- `src-app/src/features/workout/treinos/ExercicioFormModal.tsx` e `TreinosModals.tsx` (AerobicoModal): removidos os estilos inline de `opacity`/`visibility`/`transition` que competiam com a classe `.is-closing`, deixando o CSS legado + `modal-motion.css` conduzirem a animação de entrada e saída.

## [v4.54.0] - 2026-10-27

**Opção "Entrar em modo teste" nas opções de login, disponível somente em desenvolvimento.**

### Added
- `src-app/src/core/auth/auth-context.tsx`: novo `signInAsTest()` + `isTestMode` no contexto. Cria um usuário fictício local (`local-test-user` / `teste@local.dev`), restaura a sessão entre reloads pela flag `mbc_test_session` (lida apenas quando `import.meta.env.DEV`) e não chama o Supabase.
- `src-app/src/features/auth/AuthScreen.tsx`: botão "Entrar em modo teste" na tela de boas-vindas, com ícone de frasco e borda tracejada esmeralda. O botão (e o handler) só são renderizados em desenvolvimento; no build de produção não aparece.

### Changed
- `src-app/src/App.tsx`: em modo teste o AppShell não deriva a chave de sync, não inicia o motor de sincronização e não preenche o perfil com metadados do Google; o bootstrap usa `LOCAL_USER_ID` (não o id fictício) e o `OnboardingGate` não abre, então o teste cai direto no app.
- `src-app/src/features/settings/SettingsFeature.tsx`: com sessão de teste, "Sair da Conta" encerra o modo teste via `signOut()` e limpa o banco local — evita que dados fictícios sejam migrados depois para uma conta real. A saída da conta nuvem normal continua sem apagar os dados locais.
- `Diretrizes/context.md`: nova seção "Login de desenvolvimento (modo teste)" com o fluxo, a persistência por `mbc_test_session` e a saída por Configurações → Sair da Conta.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros e 73 avisos (mesma contagem anterior).
- `npm run lint:docs`: OK.

## [v4.53.0] - 2026-10-27

**Três pedidos do usuário: imagem padrão nas telas de carregamento/bloqueio, modal com os ciclos 0–30 no Início e animação de entrada/saída nos modais de treino, cardio, exercício, amigos e QR Code.**

### Added
- `src-app/src/lib/screen-defaults.ts`: `defaultScreenImage(portrait)` devolve `LoagingVertical.png` (mobile/retrato) ou `LoadingHorizontal.png` (desktop/paisagem), importados de `src-app/src/assets/` para o Vite resolver as URLs no build. A grafia "Loaging" é a do arquivo original.
- `src-app/src/hooks/useModalPresence.ts`: `MODAL_EXIT_MS = 220` (mesmo tempo do CSS), `useModalPresence(open)` — mantém o modal montado e expõe `closing` durante a saída — e `useModalExit(onClose)` — roda a animação antes de chamar o `onClose` do pai, com ação opcional pós-animação.
- `src-app/src/features/dashboard/CycleModal.tsx` + `cycle-modal.css`: modal do card CICLO do Início, em `createPortal(document.body)`, com a linha do tempo **0–30** do ciclo atual (0 = abertura, 1..30 = treinos concluídos e pendentes) e o detalhe individual do treino selecionado (data, ficha, duração e exercícios, marcando os concluídos). Fecha no Esc/backdrop, trava o scroll do body, o Esc/chevron voltam do detalhe para a lista e reabrir sempre cai na lista.
- `src-app/src/styles/modal-motion.css`: `modalOverlayOut` + `modalPanelOut` — fade do `.modal-overlay` e recolhimento do painel (`translateY(24px) scale(0.96)`) em 220 ms, com `prefers-reduced-motion`.
- `src-app/src/core/db/queries.ts`: `CycleTimelineItem` + `getCycleTimeline(data)` — 31 posições (0 = `currentCycleStartDate`; 1..30 = um item por letra em `completedKeys` desde o início do ciclo, preenchendo até 30; o restante fica pendente). Usa a mesma contagem de `getCycleStats`, então o total fecha com o número do card CICLO.

### Changed
- `src-app/index.html`: `<img>` ocultos `#splashDefaultPortrait`/`#splashDefaultLandscape` (classe `.splash-default-asset`) só para o Vite processar os caminhos; o script inline de boot usa a imagem padrão quando não há `mbc_loading_*` — a imagem personalizada continua com prioridade.
- `src-app/src/features/lock/LockScreen.tsx`: fundo do bloqueio em três níveis — imagem custom → imagem padrão (somente quando o usuário **não** escolheu um wallpaper) → preset (`resolveWallpaper`). O estado `wallExplicit` é re-sincronizado em `academia:lock-prefs-changed`.
- `src-app/src/features/sync/AppLoadingScreen.tsx` e `src-app/src/features/sync/ScreensCustomizationPanel.tsx`: as prévias de carregamento e de bloqueio caem na imagem padrão quando não há imagem custom, e a prévia de bloqueio respeita o preset escolhido do mesmo jeito que o LockScreen.
- `src-app/src/features/dashboard/DashboardFeature.tsx`: o modal inline antigo (grade de quadradinhos por dia, com Tailwind) foi removido e substituído pelo `<CycleModal/>`, alimentado por `getCycleTimeline`; o card CICLO abre o novo modal.
- `src-app/src/features/dashboard/SheetSelectorModal.tsx`, `src-app/src/features/workout/treinos/TreinosModals.tsx` (AerobicoModal) e `ExercicioFormModal.tsx`: usam `useModalPresence` + classe `.is-closing` e o `modal-motion.css`; Aerobico/ExercicioForm deixaram de controlar `visibility`/`opacity` inline na abertura.
- `src-app/src/features/workout/treinos/TreinosFeature.tsx`: o `key` de Aerobico/ExercicioForm passou a `aeSession`/`formSession` (incrementa ao **abrir**, não ao fechar), então o modal permanece montado para animar a saída e ainda reinicializa o estado a cada abertura.
- `src-app/src/features/social/FriendQrModal.tsx` e `QrScannerModal.tsx`: `useModalExit` — Esc/X/backdrop animam antes do `onClose` do pai; o botão "Escanear" espera a saída do modal de amigos para abrir o leitor; o leitor entrega o convite lido depois da animação (`requestClose(() => onInvite(invite))`).
- `src-app/src/features/social/social.css`: entrada/saída de `.friend-qr-overlay` (fade + `scale(0.94) translateY(10px)` no card) e `.qr-scanner` (fade + zoom leve), com bloco `prefers-reduced-motion`.
- `src-app/src/main.tsx`: importa `modal-motion.css` depois de `shell.css`, para vencer os empates de cascata com o CSS legado.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK — as duas imagens padrão entram em `dist/assets/` com hash (`LoagingVertical-*.png` 1,08 MB e `LoagingHorizontal-*.png` 960 KB) e nenhum erro de tipos.
- `npm --prefix src-app run lint`: 0 erros e 73 avisos — a mesma contagem de antes; `CycleModal.tsx` e `useModalPresence.ts` não geram avisos.
- `npm run lint:docs`: OK (319 caminhos verificados, §15 coerente, CHANGELOG dentro do limite).
- Limitação: a validação visual em navegador não foi executada nesta sessão (o app exige login); o comportamento dos modais foi revisado no código e o build de produção foi gerado.

## [v4.52.1] - 2026-10-26

**Imagem voltou a ser enviada junto com o texto: a checagem de `canShare()` estava descartando o arquivo.**

O usuário relatou que só o texto chegava no compartilhamento. Causa: `shareNative()` validava a payload COMPLETA (`{ title, text, files }`) com `navigator.canShare()`. Algumas implementações dessa API validam apenas a propriedade `files` (orientação do próprio web.dev) e respondiam `false` para a payload com texto/título — o app interpretava como "plataforma sem share de arquivo" e seguia para o fallback de texto, sem nunca chamar a folha com a imagem. Reproduzido em navegador com um canShare estrito: `canShare({title,text,files})` = **false**, `canShare({files})` = **true**; com a correção o `share()` recebe `{title, text, files:[PNG 172 KB]}`.

### Changed
- `src-app/src/lib/native-share.ts`: quando a payload contém arquivo, a checagem passa a usar apenas `{ files: data.files }` (o `share()` continua recebendo título + texto + imagem juntos).
- `src-app/src/features/gamification/ShareModal.tsx`: `handleShare` tenta em cascata `{title, text, files}` → `{files}` (plataformas que recusam texto+arquivo, ex.: iOS), e só então o fallback; o fallback de plataforma sem share de arquivo agora chama `deliverImage()`, que **baixa E copia o PNG para a área de transferência** (antes baixava só), com toast explicando o que aconteceu; cancelar a folha de texto não dispara download.

### Verificado (harness temporário no navegador, removido depois)
- canShare estrito (recusa texto na payload) → share recebe texto + imagem.
- share() lança TypeError com texto+arquivo (iOS-like) → repete com `{files}` e a imagem vai embora.
- Sem suporte a arquivo (desktop-like) → texto compartilhado + PNG baixado e copiado (clipboard `image/png`).
- `tsc -b`, `oxlint` (0 erros) e `vite build` OK.

## [v4.52.0] - 2026-10-26

**Compartilhamento consertado: texto e imagem saem juntos, gerados pelo site, em todas as plataformas.**

O modal de compartilhamento estava morto: o botão COMPARTILHAR ficava `disabled` para sempre porque a variável `imageReady` nunca recebia valor, e mesmo quando o canvas era renderizado o arquivo nunca era criado (`canvasFileRef.current = canvasFileRef.current || null` não fazia nada) — o compartilhamento caía sempre no texto sem imagem. Verificado em navegador com um harness temporário (removido depois): antes do fix o botão estava `disabled: true`; depois, o clique entrega título + texto + PNG em 171 KB (552×793).

### Changed
- `src-app/src/features/gamification/ShareModal.tsx`: novo `buildShareFile()` que rasteriza o card ativo (html2canvas, que continua chunk sob demanda), chama `toBlob('image/png')` e devolve um `File` real (antes o `.jpg` errado agora é `evo-fit-{treino|conquista|radar}-{data}.png`); a imagem é pré-renderizada ao ABRIR o modal (e não no clique) porque a Web Share API exige gesto do usuário e o html2canvas leva ~1s, o que estourava a ativação transitória do navegador; `renderSeqRef` descarta render antigo que termine depois de trocar de card; `handleShare` agora envia `shareNative({ title, text, files: [png] })` (texto + imagem juntos) e, se a plataforma recusar arquivo (ex.: Chrome desktop), compartilha o texto e baixa a imagem; sem Web Share, baixa o PNG e tenta copiá-lo para a área de transferência; `handleDownload` reusa o mesmo arquivo e o botão COMPARTILHAR deixou de ficar desabilitado (`disabled={busy !== null}`), mostrando "PREPARANDO..." enquanto a imagem é gerada; texto compartilhado personalizado por card (`shareText`: treino com exercícios/volume, conquista com o nome do emblema, radar) e os links de WhatsApp/X/Facebook passam a usá-lo.
- `src-app/src/lib/native-share.ts`: a chamada a `canShare()` ficou envolta em `try/catch` — um navegador que lance nessa API não derruba o fluxo e cai no fallback (antes viraria exceção e exibiria "Erro ao preparar compartilhamento").

### Removed
- `src-app/share-test.html` + `src-app/src/share-test.tsx`: harness temporário usado para testar os três cards e os três caminhos de fallback (Web Share com arquivo, Web Share só texto e sem Web Share). Não faz parte do app.

### Verificado
- `tsc -b` OK, `oxlint` 0 erros (73 avisos pré-existentes), `vite build` OK (html2canvas segue fora do bundle inicial).
- Navegador (cards treino/conquista/radar): clique em COMPARTILHAR entrega `{title, text, files:[PNG 152–178 KB]}`; `canShare` recusando arquivo → share de texto + download do PNG; sem Web Share → download do PNG + tentativa de cópia para clipboard. Erro no console: nenhum.
- Limitação: o app exige login (App.tsx), então os testes rodaram num harness temporário com os mesmos componentes/CSS; a folha nativa em si (Android/iOS) precisa de aparelho.

## [v4.51.0] - 2026-10-26

**Performance do carregamento inicial: 9,5 MB saíram do caminho crítico (sem tocar em visual, features ou funcionamento).**

Medido no build de produção (`vite preview`): antes, o carregamento da página baixava **9,5 MB** (MAIN.mp3 7,4 MB + Revenger Phoenix 1,5 MB + bundle 486 KB + CSS 93 KB) e ainda carregava a API do YouTube; agora baixa **657 KB** até o evento `load` e o restante só depois dele.

### Changed
- `src-app/src/features/music/audio-engine.ts`: o arranque da música saiu do boot. `armGestures()` continua imediato (só listeners, custo zero), mas `loadYtApi()`, `preloadYtPlayer()`, `playSite('main')` e o pré-decode da faixa de Missões passam a rodar em `whenIdleAfterLoad()` — depois do `load` + `requestIdleCallback` (fallback `setTimeout`). Guarda `waStartSeq === 0` impede que o arranque atrasado reinicie uma faixa que um gesto do usuário já iniciou. Nada muda no comportamento da música (ela só podia tocar após um gesto, já que os contextos `main/missions/result` usam Web Audio e o `AudioContext` nasce suspenso).
- `src-app/index.html`: o watchdog de boot (intervalo de 250 ms que acompanhava o `#root`) agora se encerra com `clearInterval` quando o app monta e a splash sai (antes rodava a sessão inteira); e ganhou `preconnect` para `fonts.googleapis.com` / `fonts.gstatic.com` (Material Symbols), evitando DNS/TLS extra só depois de baixar o CSS do Google.

### Notas (avaliado e descartado)
- `qrcode` sob demanda (`import()` em `AuthScreen`/`FriendQrModal`): o split gerou um chunk compartilhado e **aumentou** o pacote inicial (486 KB → ~500 KB gzip) — revertido; nada mudou nesses arquivos.
- Todas as seções seguem montadas no `.section-strip` desde o boot (requisito do swipe/`translateX`), então `React.lazy` nelas mudaria o funcionamento — não aplicado. `src-app/dist` não é versionado; o build de produção foi refeito e validado.

## [v4.50.0] - 2026-10-26

**Logo do site trocada para `src-app/public/assets/Logo.png` na aba do navegador, no site e na instalação como PWA.**

### Changed
- `src-app/public/assets/icons/`: novos ícones derivados de `src-app/public/assets/Logo.png` (1254×1254) — `logo-32.png`, `logo-48.png`, `logo-180.png`, `logo-192.png`, `logo-512.png` e `logo-maskable-512.png` (logo a 78% sobre fundo preto, para o recorte circular do Android). Os nomes são novos de propósito: `/assets/*` é servido com cache de 1 ano (`immutable` no `vercel.json`), então sobrescrever `icon-192.png`/`icon-512.png` deixaria o ícone antigo nos navegadores que já o baixaram.
- `src-app/index.html`: `<link rel="icon">` deixa `D.jpg` e passa a `logo-32.png` / `logo-48.png`; `apple-touch-icon` usa `logo-180.png`; `og:image` aponta para `logo-512.png`.
- `src-app/vite.config.ts`: ícones do manifesto PWA (`manifest.icons`) → `logo-192.png` e `logo-512.png` (`purpose: any`) + `logo-maskable-512.png` (`purpose: maskable`).
- `src-app/src/features/music/audio-engine.ts`: artwork da Media Session (notificação e controles de música do aparelho) → `logo-192.png` / `logo-512.png`.
- `src-app/src/features/settings/SettingsFeature.tsx`: o cartão "Instalar Aplicativo (PWA)" exibe `logo-192.png` no lugar do ícone de lápis; a notificação de teste usa `/assets/icons/logo-192.png` (o caminho anterior `/icon-192.png` não existia no build).

## [v4.48.0] - 2026-10-25

**Música de fundo (MAIN) não sobrevive mais ao fechamento do site.**
### Fixed
- `src-app/src/features/music/audio-engine.ts`: a MAIN — e as demais faixas ocultas (RESULT, Missões), que tocam como `AudioBufferSourceNode` em loop sobre um `AudioContext` — continuava tocando depois de fechar o site; o navegador não suspende Web Audio quando a aba/janela desaparece e, no computador, fechar o painel/vista do app nem sempre destrói a página. Novo tratamento de ciclo de vida no `initAudioEngine()`: `pagehide` (fechar aba/janela, navegar) e `visibilitychange → hidden` pausam tudo (fonte Web Audio + `<audio>` do site + uploads da fila + `pauseVideo()` do YouTube) via `pauseAllForLifecycle()`; `visibilitychange → visible` retoma de onde parou com `resumeAfterVisibility()` (só se a música estava tocando e a pref seguir ligada). A pausa usa `pauseHidden()`, então o ponto da faixa é preservado.
- `src-app/src/lib/background-music.ts`: o loop legado do `HTMLAudioElement` recebe o mesmo tratamento (`pagehide`/`hidden` pausam; `visible` retoma quando a reprodução é deste módulo) — hoje o `audio-engine` assume a posse no boot, então isto é a rede de segurança caso o motor falhe.

## [v4.49.0] - 2026-10-25

**Perguntas pós-login aprimoradas com novas etapas e tela de boas-vindas.**

### Changed
- `src-app/src/features/auth/OnboardingScreen.tsx`: adicionadas novas perguntas de pós-login — **"Por que usar o app fitness?”** e **"Como conheceu o app?”** — como texto informativo nas etapas de conta (para contas não-Google) e no rodapé; **peso, idade e altura** agora fazem parte da mesma etapa (**corpo**), com campos numéricos sincronizados na nuvem.
- `src-app/src/features/auth/OnboardingScreen.tsx`: reescrito o assistant com 11 etapas no estilo das imagens de referência — ordem: **Sua Conta → Motivo de Uso → Principais Objetivos → Tempo de Experiência → Sexo → Idade, Peso e Altura (juntas) → Frequência de Treino → Local de Treino → Indicação → Programa de Treino → Notificações** (últimas duas etapas, com tela de boas-vindas ao final).
- `src-app/src/features/auth/OnboardingScreen.tsx`: título das boas-vindas agora exibe **“Bem-vindo ao Evo Fit, {nome}!”** com logo G lime-green (#CCFF00) no topo; tela de boas-vindas tem duração de 2.8s antes de fechar automaticamente.
- `src-app/src/core/db/schema.ts`: campos opcionais já existentes `heightCm`, `appReasons`, `referralSource`, `mainGoals`, `experienceLevel`, `gender`, `trainingFrequencyDays`, `trainingPlace`, `notificationsEnabled` são mantidos/garantidos para o novo onboarding.

### Added
- `src-app/src/features/auth/OnboardingScreen.tsx`: etapa **notificações** é a última do fluxo de perguntas; ao concluir, exibe tela de boas-vindas “Bem-vindo ao Evo Fit” por 2.8s antes de fechar, com auto-close timer.
- `src-app/src/features/auth/OnboardingScreen.tsx`: pergunta **"Por que usar o app fitness?”** aparece como texto informativo quando a conta não é do Google (para contas e-mail, permite definir senha depois).
- `src-app/src/features/auth/OnboardingScreen.tsx`: pergunta **"Como conheceu o app?”** aparece como texto informativo no rodapé da etapa de indicação.

## [v4.47.0] - 2026-10-25

**Assistente de perguntas pós-login no estilo das imagens de referência, com destaque em vermelho.**

### Changed
- `src-app/src/features/auth/OnboardingScreen.tsx`: reescrito como assistente de tela cheia no estilo das imagens — cabeçalho com seta **voltar**, nome da pergunta + contador **"(n/10)"** e **"Pular"**; título grande com o trecho em destaque em **vermelho `#ef4444`**; cartões de opção com título, descrição, selo ("Popular", "Powerlifting", "Recomendado") e rádio; botão **"Continuar"** fixo no rodapé (cinza/desabilitado até houver resposta).
- `src-app/src/features/auth/OnboardingScreen.tsx`: ordem das 10 etapas — **Sua Conta → Motivo de Uso → Principais Objetivos → Tempo de Experiência → Sexo → Idade → Peso → Frequência de Treino → Local de Treino → Programa de Treino** (conta e programa obrigatórios; as demais com "Pular").
- `src-app/src/features/auth/OnboardingScreen.tsx`: **Idade** virou etapa própria com valor em destaque (substitui o campo de idade dentro do antigo bloco "Dados opcionais"); a etapa "Peso" manteve a pergunta com o mesmo tratamento.
- `src-app/src/features/auth/OnboardingScreen.tsx`: as perguntas antigas "Pratica atividade física?" e "Há quanto tempo?" saíram do fluxo — a nova **Tempo de Experiência** (nível na musculação) e a **Frequência de Treino** cobrem o mesmo uso; os campos `activityDuration*` continuam no schema, apenas o onboarding deixa de preenchê-los.
- `src-app/src/features/auth/OnboardingScreen.tsx`: cada etapa de resposta única grava no perfil ao avançar (respostas ficam salvas se o usuário fechar no meio); "Pular" avança sem gravar; "Voltar" preserva o que já foi respondido.

### Added
- `src-app/src/core/db/schema.ts`: novos campos opcionais em `ProfileCustomization` — `appReason` (motivo de usar o app), `mainGoals` (principais objetivos), `experienceLevel` (tempo de experiência), `gender` (sexo), `trainingFrequencyDays` (frequência, 7 = todos os dias) e `trainingPlace` (local de treino). Por serem parte do `profileState`, sincronizam com a nuvem junto do snapshot.

### Fixed
- `src-app/src/features/auth/OnboardingScreen.tsx`: as etiquetas do layout são `<div>` em vez de `<header>`/`<main>`/`<footer>` — o CSS legado global aplica `header { position: fixed }`, `main { min-height: 100vh }` e `footer::before/::after` posicionados de forma absoluta; com a tag `<footer>` o pseudo-elemento cobria o botão e **os cliques em "Continuar" não chegavam**. O conteúdo também passou a ter `min-height: 0` inline, senão o `min-height: 100vh` do legado empurrava o rodapé para fora da tela em janelas baixas (botão inalcançável).

## [v4.46.0] - 2026-10-25

**Login sem botão de fechar e sem a chave ativa; perguntas pós-login com nome, usuário e senha.**

### Changed
- `src-app/src/features/auth/AuthScreen.tsx`: removidos o botão **fechar** (X no canto superior direito) e a linha **“Chave ativa”** do welcome; saíram junto o estado `activeSyncKey` e os imports `getSyncKey`/`DEFAULT_SYNC_KEY`/`KeyRound`. `setSyncKey` continua sendo aplicado pela gaveta “Vincular Chave” e o ESC segue fechando a tela.
- `src-app/src/features/auth/OnboardingScreen.tsx`: nova primeira etapa **“Sua conta”** nas perguntas pós-login, que pede **Nome** e **Nome de usuário (@handle)** — validados com a mesma regra do cadastro (3–20, `a-z0-9_`) — e grava `customization.nome`/`customization.handle` no perfil (os mesmos campos das Configurações e do card de perfil). Os campos são pré-preenchidos com o perfil salvo ou com os dados do provedor (nome do Google, e-mail) sem sobrescrever o que o usuário digitar.
- `src-app/src/features/auth/OnboardingScreen.tsx`: a pergunta **"Senha do usuário"** aparece apenas quando a sessão entrou pelo **Google** (`app_metadata.provider`/`identities`), pois contas de e-mail já têm senha. É opcional (mín. 6 caracteres) e chama o novo `updatePassword`, criando a senha real da conta para o login por e-mail.
- `src-app/src/features/auth/OnboardingScreen.tsx`: navegação das etapas corrigida — “Voltar” na etapa de dados retorna para a conta e “Voltar” no objetivo retorna para os dados (antes apontava para a própria etapa e não saía do lugar).

### Added
- `src-app/src/core/auth/auth-context.tsx`: `updatePassword(password)` no `AuthContextValue`, usando `supabase.auth.updateUser({ password })` com o mesmo `formatAuthError` dos outros métodos (guard `isSupabaseConfigured` para o Modo Offline).

## [v4.45.0] - 2026-10-25

**Telas Personalizadas: imagens da tela de bloqueio e do splash agora sincronizam na nuvem.**

### Fixed
- `src-app/src/core/sync/sync-manager.ts`: as imagens das **Telas Personalizadas** (`mbc_lock_desktop`, `mbc_lock_mobile`, `mbc_loading_vertical`, `mbc_loading_horizontal`) entram no `prefs` do snapshot enviado para a tabela `user_sync` (`CUSTOM_SCREEN_KEYS`, incluído em `PREF_KEYS_TO_SYNC`). Antes elas viviam apenas no `localStorage` do dispositivo e nunca chegavam à nuvem, então a tela de bloqueio e o splash personalizados não apareciam nos outros aparelhos.
- `src-app/src/core/sync/sync-manager.ts`: no `applySnapshot`, a string vazia vinda da nuvem remove a chave local dessas imagens (o `LockScreen` e a splash do `index.html` voltam ao preset padrão). Chave ausente continua significando "nunca definida" — um dispositivo sem imagens não apaga as dos outros (last-write-wins só entre valores reais).
- `src-app/src/features/sync/ScreensCustomizationPanel.tsx`: "Remover imagem" grava `''` em vez de apagar a chave (chave apagada = "nunca definida", o valor antigo continuaria vencendo na nuvem); o prop `storageKey` do `ImageCard` foi removido (a persistência é responsabilidade do `onChange`).
- `src-app/src/features/settings/SettingsFeature.tsx`: o botão "Remover" dos papéis de parede da tela de bloqueio também grava o marcador vazio, para a remoção propagar entre dispositivos.

### Changed
- `src-app/src/features/sync/ScreensCustomizationPanel.tsx`: os 4 slots reagem a `academia:lock-prefs-changed` recarregando do `localStorage`, então imagens que chegam da nuvem (ou de outra aba) aparecem nos cards e nas prévias com o painel já aberto.

## [v4.44.2] - 2026-10-24

**Conta Google no perfil, foto do usuário e cronômetro de descanso do legado.**

### Fixed
- `src-app/src/App.tsx`: a sessão Google agora preenche **e-mail, nome, @handle e foto** do perfil (antes só gravava `photo`). Campos só são preenchidos quando estão vazios/padrão (`DECEPTIVON`/`@deceptivon`); foto personalizada pelo usuário é preservada e avatares do Google são atualizados.
- `src-app/src/features/settings/SettingsFeature.tsx`: o botão **Salvar Informações** gravava apenas o nome — agora salva nome, @handle, e-mail e foto juntos; o campo de e-mail usa `user.email` como fallback; a prévia da foto acompanha o valor digitado/selecionado.
- `src-app/src/features/profile/ProfileFeature.tsx` e `src-app/src/features/dashboard/DashboardFeature.tsx`: o avatar do cabeçalho e do Início dão prioridade à foto (`customization.photo`) em vez de exibirem sempre o emblema/dicebear.

### Changed
- `src-app/src/features/workout/RestTimerWidget.tsx` (novo, montado no `App`): cronômetro de descanso flutuante idêntico ao legado (`#restTimer`): contagem mm:ss, clique reinicia em 60 s, ✕ encerra, visuais **radar/ampulheta/cyber/arcade** (progresso proporcional ao tempo restante) e corrida de 1 s única — antes o timer só decrementava com o Modo Foco aberto, ficando congelado na Ficha.
- `src-app/src/store/workout-store.ts`: `tickRestTimer` ignora ticks fora do descanso, `startRestTimer` valida o valor (inválido → 60) e, ao zerar, dispara o bipe + toast "Tempo de descanso encerrado! Bora pro próximo!" (paridade `secao-ficha.js`).
- `src-app/src/lib/app-prefs.ts`: `playRestTimerSound` agora reproduz o bipe único de 800 Hz com decaimento de 0,5 s + vibração `[200,100,200]` do `playBeep()` legado.
- `src-app/src/features/workout/FichaFeature.tsx`, `FocusModal.tsx` e `ActiveWorkoutModal.tsx`: removeram o widget/tick duplicado do descanso (o tick passou a ser único no `RestTimerWidget`).
- `src-app/src/features/settings/SettingsFeature.tsx` e `src-app/src/features/workout/treinos/CustomizacaoTabs.tsx`: escolher o estilo do cronômetro emite `academia:timer-style-changed`; a customização (Radar/Ampulheta/Cyber/Arcade) agora também grava `timerStyle` no localStorage, então a skin escolhida passa a valer no cronômetro real.

## [v4.44.1] - 2026-10-23

**Onboarding: corrigido reaparecimento a cada acesso.**

### Fixed
- `src-app/src/core/db/idb.ts`: `PROFILE_STATE_KEY('local')` agora retorna a chave canônica `local` (antes `profile_state_local`). Como a tabela `profileState` usa `keyPath: 'key'`, o Dexie ignora a chave passada em `put()` e grava com o `key` do objeto — o onboarding era salvo em `local`, mas lido em `profile_state_local`, que nunca existia, fazendo a tela de primeiro acesso reaparecer em todo carregamento. `saveProfileState` também força `{ ...state, key }` para garantir a chave correta.
- `src-app/src/core/sync/sync-manager.ts`: `academia:profile-updated` entrou na lista de auto-push (init/stop), para que dados de perfil e a flag `onboarded` cheguem ao snapshot remoto e não sejam sobrescritos por um pull antigo.

## [v4.44.0] - 2026-10-23

**Configurações: Preferências do App (semana, unidades, tema, som e foco) e notificações.**

### Added
- `src-app/src/lib/app-prefs.ts`: módulo de preferências sem dependências (semana, peso, distância, som do temporizador, foco padrão e placeholders de notificações), com getters/setters que gravam em localStorage e emitem `academia:prefs-changed`, além de `formatLoadLabel`, `convertKgToDisplay`, `formatSpeed`/`convertSpeedValue`, `getWeekDayLabels` e `playRestTimerSound`.
- `src-app/src/features/settings/SettingsFeature.tsx`: nova tela/tile "Preferências do App" com linhas expansíveis para primeiro dia da semana (segunda/domingo), unidade de peso (kg/lb), unidade de distância (km/mi), tema e idioma, mais os toggles "Som do temporizador (entre as séries)" e "Modo Foco por padrão nos treinos".
- Tela de Notificações reorganizada com "Permitir notificações" (solicita permissão do navegador) e placeholders persistidos para lembretes de treino, novidades e atualizações, ligas e mensagens motivacionais.
- `src-app/src/features/settings/settings.css`: estilos `.set-pref-*` (linhas com ícone/rótulo/valor, opções, swatch e grade de temas).

### Changed
- `src-app/src/core/db/queries.ts`: `formatCarga` converte a carga para a unidade de peso escolhida; sufixo "cada lado" não é duplicado.
- `src-app/src/features/workout/FichaFeature.tsx` e `FichaDeck.tsx`, `treinos-helpers.ts` e `TreinosModals.tsx`: velocidade do cardio exibida em km/h ou mph conforme a preferência; "Modo Foco por padrão" abre o foco ao iniciar um treino.
- `src-app/src/features/training/ProgressoFeature.tsx`: "Sua Semana", o cabeçalho e as células do calendário mensal respeitam o primeiro dia configurado; volumes e calculadora 1RM usam a unidade de peso escolhida.
- `src-app/src/features/gamification/ShareModal.tsx`: volume total e destaques do card usam a unidade de peso configurada.
- `src-app/src/store/workout-store.ts`: ao fim do descanso entre séries, toca o aviso sonoro (se ativado).
- `src-app/src/features/profile/profile-data.ts` e `src-app/src/core/sync/sync-manager.ts`: novas chaves entram em `PREF_KEYS` e passam a ser sincronizadas entre dispositivos.

## [v4.43.7] - 2026-10-23

**Amigos: modal "Adicionar" reestilizado com abas e busca de jogador.**

### Added
- `src-app/src/features/social/friend-search.ts`: busca de jogadores na tabela `public.profiles` (username/display_name), com sanitização da consulta e erro específico de modo offline.
- `src-app/src/features/social/social-icons.tsx`: ícones `SearchIcon` e `QrCodeIcon` no padrão stroke/currentColor.

### Changed
- `src-app/src/features/social/FriendQrModal.tsx`: modal com duas abas ("Meu QR Code" e "Buscar jogador"), moldura de QR com cantos destacados, placa com nome/código e lista de resultados com botão "Adicionar"/"Adicionado" (debounce de 350 ms, mínimo de 2 caracteres).
- `src-app/src/features/social/social.css`: novo visual do modal (cabeçalho, abas em pílula, moldura do QR, campo de busca e cartões de resultado) mantendo a paleta atual (roxo).
- `src-app/src/features/social/LigasFeature.tsx`: `applyInvite` retorna o resultado, escuta também `academia:friends-changed` e passa `selfId`/`onAddPlayer` ao modal.

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
