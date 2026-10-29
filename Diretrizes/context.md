# context.md — Estado atual do projeto

> ### O que é este arquivo (e o que **não** é)
> É a **foto do estado atual** do app e do que está pendente: leitura curta, do começo ao fim, no início de cada sessão — junto com `Diretrizes/system_map.json` (**primeira leitura obrigatória**).
> **Não é changelog.** O histórico por versão mora **exclusivamente** em `Diretrizes/CHANGELOG.md`. Até 2026-10-18 este arquivo acumulava 12 blocos "Sessão anterior: …" que duplicavam o Changelog — **foram removidos** (o texto antigo continua no histórico do Git deste arquivo).

| Chave | Valor |
| :-- | :-- |
| App atual (roda/deploya) | `src-app/` — React v4 + Vite + Tailwind v4; offline-first (Dexie/IndexedDB + fila de sync Supabase) |
| Legado (congelado) | `Legacy/` — Vanilla JS, só consulta/paridade; espelho em `www/` (entrada do Capacitor) |
| Versão atual | **v4.56.7** |
| `system_map.json` | **4.56.7** |
| Último commit | `8289adb` (v4.34.0) — o que ainda não está commitado: `git status --short` |

---

## 1. Onde mexer (comece por aqui)

- **Índice "onde editar → arquivos" (1 linha por área):** `Diretrizes/system_map.json` → **`ia_quick_reference.atual_src_app`** (26 áreas) e **`.legado_referencia`** (22, só paridade).
- **Mapa visual por tela** (Componente | CSS | âncoras id/classe): `Diretrizes/DESIGN.md` → **§15**.
- **Regras e convenções:** `Diretrizes/README.md` · **design system:** `Diretrizes/DESIGN.md` · **ícones:** `Diretrizes/Ícones.md` · **histórico:** `Diretrizes/CHANGELOG.md`.

## 2. Estado do app

- **Migração React v4 — Fases 0 a 5 concluídas**: paridade de Dashboard/Ficha/Progresso, Perfil/temas, gamificação (radar, maestria, share), seção Treinos + swipe e overlays de Notícias/Missões.
- **Além da paridade:** música e playlists (motor de áudio multi-contexto + miniplayer), sincronização multi-dispositivo (Supabase), conta/auth, bloqueio por senha, Fit ID, busca global (Ctrl/Cmd+K), casca desktop (Sidebar + Drawer + overlays em janela central) e PWA/Android (Capacitor).
- **Guildas (aba Social):** sistema funcional em `features/social/guild-{data.ts,Panel.tsx,css}` — entrar/criar guilda, emblemas do site, membros com funções. Estado em localStorage (`academia_guilds_v1`); **sem doações semanais e sem pontuação do clã** (decisão de produto).
- **Detalhe por arquivo:** `system_map.json → react_app.entry_points` (~55 entradas) + `react_app.core_db` + `react_app.styles`.

## 3. Como verificar (rodar ao fim de qualquer mudança)

No `src-app/`:
```powershell
npx tsc -b          # typecheck
npx oxlint src      # precisa sair 0
npm run build       # tsc -b && vite build -> src-app/dist/assets/index-*.js
```
Na raiz:
```powershell
npm run lint:docs   # tools/doc-lint.mjs: todo caminho citado no system_map.json existe? (exit 1 se não)
```
Preview de produção + Chrome CDP (sondas e screenshots):
```powershell
Start-Process cmd -ArgumentList '/c','npm run preview -- --port 4173 --strictPort > %TEMP%\opencode\preview.log 2>&1' -WindowStyle Hidden -WorkingDirectory "C:\Nova pasta\htdocs\Academia\src-app"
# encerrar ao final:
Get-NetTCPConnection -LocalPort 4173 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }   # idem 9222 (Chrome)
```
- **Strings novas no bundle:** conferir com script Node UTF-8 (`fs.readFileSync(..., 'utf8').includes(...)`) — o PowerShell mojibaka acentos e dá falso-positivo.
- **Fonte de verdade do que roda:** `src-app/dist/assets/index-*.js`.

### Login de desenvolvimento (modo teste)

- Com `npm run dev`, a tela de login mostra **Entrar em modo teste** (o botão some no build de produção).
- Cria uma sessão fictícia local (`signInAsTest`/`isTestMode` em `src-app/src/core/auth/auth-context.tsx`), mantida entre reloads por `mbc_test_session`; **não** usa Supabase, **não** inicia sync e **não** abre o onboarding.
- Para encerrar: **Configurações → Sair da Conta** — o modo teste é desligado e o banco local de teste é limpo (evita migrar dados fictícios para uma conta real).

## 4. Regras obrigatórias

1. **CHANGELOG imediatamente** após QUALQUER alteração (`Diretrizes/CHANGELOG.md`): `## [vX.X.X] - YYYY-MM-DD` no topo, tags `[Added]/[Changed]/[Fixed]/[Removed]`, citando arquivos. Vale também para documentação/diretrizes/configuração.
2. **`system_map.json`**: incrementar `version` sempre que a estrutura/documentação indexada mudar, citar o incremento no CHANGELOG e validar o JSON (sem BOM).
3. **Formato do `system_map.json` (cuidado real):** os arrays curtos ficam **inline** (`"js_files": ["JS/treino/db.js"]`). Editar por **substituição literal de texto**; **NUNCA** reescrever o arquivo com `JSON.stringify(arquivo, null, 2)` — isso expande os arrays inline e infla o diff em ~300 linhas (já aconteceu duas vezes). Para blocos grandes, gerar o texto no estilo do arquivo e substituir o trecho.
4. **Convenção anti-duplicação:** strings `purpose` curtas e atemporais ("o que é / onde mexer"). Histórico `vX.Y: …` só no CHANGELOG — **não** dentro do `system_map` nem deste arquivo.
5. **Shell/PowerShell 5.1 (gotchas):** não há `rg`; `Select-String` sem `-Recurse`; globs `**` não funcionam (usar a ferramenta `grep` ou script Node); `Set-Content -Encoding UTF8` **adiciona BOM** (remover via Node); `node -e` com aspas/acentos quebra → escrever `.js` no `%TEMP%\opencode\` e rodar `node <caminho>`; `npm run build | Select-Object -First N` **mata o build** (usar `*> log` + `-Tail`); ler arquivos com a ferramenta `read` antes de editar.
6. **Diretrizes de comunicação e progresso (regras 7–10 do README):** (7) informar prazo e progresso a cada passo em tarefas demoradas; (8) **em caso de dúvida, perguntar ao usuário** — nunca adivinhar; (9) **testar apenas no final** — validação completa uma única vez; (10) progresso em tarefas grandes: minutos restantes, porcentagem, fase atual.

## 5. Divergências conscientes (não alterar sem reler o CHANGELOG)

1. **Deck slots compactos**: `exerciseIds: string[]` **sem `null`** — remoção = `splice` (perde a posição; o legado usava `null`). Nulls quebrariam `fichaIds.every(...)` no `App.tsx`.
2. **Swipe**: detecção de intenção + troca no fim (sem arrasto contínuo da fita, como o legado).
3. **`modalPicker`** (morto no legado) não foi portado; **`modalLevelUp`** foi omitido.
4. **Toast legado `'warning'`** mapeado para `'info'` (o wrapper React só tem success/error/info).
5. **Banners**: `BANNERS.filter(b => !EXTRA_KEYS.test(b.key))` mantém os masters em 2 grupos (paridade literal).
6. **Overlays/notícias**: `closeNewsOverlay` não faz `_transitionTo('dashboard')` (só abre do Início); swipe com o overlay aberto desmonta o Início e o overlay desaparece — **idêntico** ao legado.
7. **Todo overlay/modal monta via `createPortal(document.body)`**: o `.section-strip` tem `will-change: transform` e vira o *containing block* do `position: fixed` (causa-raiz de overlays "fora da tela").
8. **`revert-layer` e os pins de cascata exigem Chrome/WebView 111+.** Diffs de paridade aceitos (medidos, **não-visuais**): serialização de cor `oklab` (v4) vs `rgba` (v3) com valores exatos; `border-color` em elementos com `border-width: 0`; margens `space-y` (v3 no irmão seguinte, v4 no anterior) — `xywh` idênticos.
9. **Componentes scaffold órfãos** (nunca montados; decidir o futuro): `src-app/src/components/HeaderHUD.tsx`, `components/TabBar.tsx`, `components/ExerciseCard.tsx`, `components/ui/DynamicBg.tsx` e `features/workout/ActiveWorkoutModal.tsx`.
10. **Cardio padrão de leitura**: `DEFAULT_AEROBIC`/`effectiveAerobic` (10 min de esteira a 3 km/h) aparece em todas as telas, mas `defaultSheet()`/seed seguem com `aerobic: null` — **gravar** o padrão faria fichas vazias passarem por "prontas" no seletor e na sugestão.

## 6. Pendências

1. **Commit** das mudanças pendentes — **só quando o usuário pedir** (`git status --short`, `git diff`, `git log --oneline -5`).
2. **Deploy Vercel**: existem **dois** `vercel.json`; o da raiz aponta para `Academia/dist/` (desatualizado). O deploy só funciona com **Root Directory = `src-app`** (ver `system_map → react_app.build.deploy`).
3. **`known_gaps` menores** (ver `system_map → react_app.known_gaps`): `#modalDayHist` sem lock de `body.overflow`; timer de descanso só no Modo Foco; overlay de missões estático (desenho legado); destino dos 5 scaffolds órfãos (item 9 acima).
4. **Paridade de deck com `null`s** (se pedirem): revisar `fichaIds.every()` no `App.tsx` **antes** de mudar o formato (divergência nº 1).
5. **Melhorias medidas, deixadas p/ depois** (Progresso, abaixo da dobra): volume-card 4.8 px e `progresso-grid` 5.86 px fora de fase com o legado — exigiria ajuste de conteúdo/spacing e nova medição.
6. **Testes manuais** de fluxos que dependem de toque real (seção Treinos, ficha + encerrar treino, Notícias, aba Social) — checklists nas entradas correspondentes do CHANGELOG.

## 7. Referências rápidas

- **Legado (fonte de DOM/comportamento):** `Legacy/treino.html`, `Legacy/componentes/secoes/*.html`, `Legacy/JS/treino/{db,nav,app,secao-*,templates}.js`.
- **App atual:** `src-app/src/App.tsx` (casca, overlays, seções, swipe) · `src-app/src/features/**` · `src-app/src/components/**` · `src-app/src/core/**` · CSS legado espelhado em `src-app/src/legacy-style/` (agregador `src-app/src/styles/legacy.css`) · casca em `src-app/src/styles/shell.css`.
- **Diretrizes:** `README.md` · `system_map.json` · `CHANGELOG.md` · `DESIGN.md` (§15 = mapa de UI) · `Ícones.md`.
- **Ferramenta:** `tools/doc-lint.mjs` → `npm run lint:docs`.
