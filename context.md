# context.md — Continuidade de sessão (2026-10-06)

> **Arquivo de contexto entre sessões.** Ler junto com `Diretrizes/CHANGELOG.md`
> (entradas `v4.0.6-phase4`, `v4.0.7-phase5`, `v4.0.7-phase5-navfix` e `v4.0.8-bugfix`) e `Diretrizes/system_map.json`
> (**version 3.5.18** — primeira leitura obrigatória de todo agente).
> Atualizado ao fim da sessão de 2026-10-06 (Fase 5 + correções dos 4 bugs reportados).

---

## 1. Estado atual (fim da sessão 2026-10-06)

- **Fases 0–5 da migração React v4 CONCLUÍDAS**:
  0 fundação → 1 visual (Dashboard/Ficha/Progresso) → 2 Perfil/temas →
  3 gamificação → 4 seção Treinos + swipe + limpeza (2026-10-05) →
  **5 pendências de paridade** (esta sessão, 2026-10-06): cronômetro global do
  treino + `#modalEncerrarTreino` acionáveis, overlay de Notícias completo,
  placeholders Social/Loja em DOM legado e BottomNav 1:1.
- **Correções `v4.0.8-bugfix` (2026-10-06)** dos 4 bugs reportados pelo usuário:
  (1) cronômetro negativo ~1 s ao iniciar, (2) emblema de perfil ausente no
  `#dashAvatar` da aba Início, (3) contador de ciclo que regredia ao trocar de
  ficha e (4) ciclo contando dias em vez de por ficha — detalhe na seção 2.
- **Verificação final verde**: `npx tsc -b` exit 0 · `npx oxlint src -D warning`
  exit 0 com **ZERO warnings** · `npm run build` OK (`dist/assets/index-H7L16KK3.js` +
  CSS `index-D9hB-1kn.css`) · CDP headless **14/14 PASS**
  (`%TEMP%\opencode\verify_fixes.js`) ·
  `system_map.json` validado (3.5.18, sem BOM).
- **GIT**: Fases 3 + 4 commitadas em `5663cad` (2026-10-05), **Fase 5 commitada
  pelo usuário em `0f8c3dd`** ("Atualização dos itens pendentes", 2026-10-06 11:44,
  9 paths — inclui `context.md` e `features/news/`) e rollback da navbar em
  `960163e` (`globals.css` + docs `v4.0.7-phase5-navfix`). **Ainda NÃO commitado**
  (7 paths, esta sessão): correções `v4.0.8-bugfix` (`FichaFeature.tsx`,
  `DashboardFeature.tsx`, `queries.ts`, `App.tsx`) + docs (CHANGELOG, system_map,
  context.md) — commit só com pedido explícito do usuário.
- Servidores: encerrar o preview de :4173 ao fim da sessão
  (`Get-NetTCPConnection -LocalPort 4173 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`).

---

## 2. O que foi feito

### Correções dos 4 bugs reportados — `v4.0.8-bugfix` (esta sessão; detalhe na entrada do CHANGELOG)
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
| `features/news/NewsOverlay.tsx` + `news-overlay.css` | Overlay `#news-overlay`: 3 abas `noticias`/`atualizacoes`/`guias` (seta `tab-arrow`, `bg-[#8b5cf6]`, `drop-shadow`), `.tab-content`/`.active`, 4 notícias (1ª com rótulo "Notícias" + borda) e 7 atualizações, `MOSTRAR MAIS` (= remoção de `.hidden-news`/`.hidden-updates`), detail views `#news-detail-view`/`#update-detail-view` (`hidden-view`/`active`, slide 300 ms), paginação com fade 200 ms (**índice avança no clique, DOM só após o timeout** — `updateDetailContent`), conteúdo via `dangerouslySetInnerHTML`, footers vazios, lock de `body.overflow`. Fase 5. |
| `App.tsx` | `handleOpenFicha(letter)` (timer + treino do dia, agora via `selectSheetEntry`), `handleStartWorkout` (toast, sem fechar ficha), `handleRequestEncerrar` → `#modalEncerrarTreino`, placeholders Social/Loja `.section-coming-soon`, `ActiveWorkoutModal` removido; seções/overlays/swipe das fases anteriores. |
| `features/dashboard/DashboardFeature.tsx` | `onOpenFicha(letter: SheetKey)`, `#dashBtnNoticias` → `<NewsOverlay/>` (montado junto ao `<MissionsOverlay/>`), `#dashBtnMissoes` inalterado; `#dashAvatar` renderiza o emblema selecionado (v4.0.8). |
| `features/workout/FichaFeature.tsx` | props `onShowActiveWorkout` → `onRequestEncerrar`; `handleStartClick`: `!isActive` → `onStartWorkout`, senão `onRequestEncerrar()`; cronômetro sincroniza `now` ao ativar + clamp ≥ 0 (v4.0.8). |
| `core/db/queries.ts` | `getCycleStats` = soma **por ficha** desde `currentCycleStartDate` (paridade `getCycleProgress`; Progresso usa sua própria contagem por-dia); `selectSheetEntry`/`applyFichaCompletion` (v4.0.8). |
| `components/BottomNav.tsx` | Só classes legadas (`.bottom-nav/.bnav-btn/.bnav-icon/.bnav-label/.bnav-active-dot`), `data-section`, ids `bnavProgresso`/`bnavTreinos`/`bnavDashboard`/`bnavSocial`/`bnavLoja`. Fase 5 (reescrito). |
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
8. **News overlay (Fase 5)**: `closeNewsOverlay` não faz `_transitionTo('dashboard')`
   (só abre do Dashboard, mesmo racional do `MissionsOverlay`); os 3 containers de
   footer ficam vazios (footer HTML do legado não portado); swipe com o overlay aberto
   desmonta o Dashboard e o overlay some (idêntico no `nav.js`); micro-divergência de
   150 ms na `transition-opacity` da aba ativa.
9. **SOCIAL/LOJA AGORA PARIDADE** (item resolvido na Fase 5): DOM
   `.section-coming-soon` portado de `treino.html` L184–207 com o texto correto de cada seção.

---

## 5. Regras obrigatórias (recarregar no início de toda sessão)

1. **CHANGELOG imediatamente** após QUALQUER alteração (`Diretrizes/CHANGELOG.md`):
   `## [vX.X.X] - YYYY-MM-DD` no topo, tags `[Added]/[Changed]/[Fixed]/[Removed]`,
   citar arquivos; versão vigente = `v4.0.8-bugfix` (+ sufixo de rótulo p/ docs, ex. `-docs`).
2. **`system_map.json`**: incrementar `version` sempre que estrutura/documentação indexada mudar
   (hoje: **3.5.18**), citar o incremento no CHANGELOG, **JSON sem BOM** e validar:
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
5. **Fonte de verdade**: `src-app/dist/assets/index-*.js` (git tem `src-app` desde `5663cad`,
   mas a Fase 5 ainda não foi commitada).

---

## 6. Próximos passos (ordem sugerida)

1. **Commit** (só quando o usuário pedir): correções `v4.0.8-bugfix` +
   docs (CHANGELOG/system_map/context.md) — revisar `git status`, `git diff`
   e `git log --oneline -10`.
2. **Confirmar com o usuário a interpretação do item 4** ("total de treinos
   geral" → resolvemos como dias vs. soma por ficha no card `#dashCycleVal` /
   pílula `#dashEmblemsValue`); se ele quis OUTRO elemento, investigar.
3. **Teste manual da Fase 5** no preview (checklist): `#dashBtnIniciar` → ficha com
   cronômetro rodando → X/parar → `#modalEncerrarTreino` → Encerrar → `showConclusao`;
   `#dashBtnNoticias` → 3 abas, cartões, MOSTRAR MAIS, detalhe prev/next, ESC;
   Social/Loja com `.section-coming-soon`; navbar com labels visíveis e dot ativo;
   swipe não dispara dentro do news-overlay (divergência aceita).
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
