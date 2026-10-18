# Changelog do Projeto Academia

> **📋 INSTRUÇÃO OBRIGATÓRIA PARA AGENTES DE IA (AI AGENTS INSTRUCTIONS):**
> **LEIA ISTO ANTES DE ALTERAR CÓDIGO:**
>
> ### ⚠️ SEMPRE REGISTRE AS ALTERAÇÕES FEITAS
> **Toda e qualquer alteração feita neste projeto DEVE ser registrada neste arquivo, sem exceção.** Isso inclui, mas não se limita a: modificações arquiteturais, adição de novas features, alterações de UI/UX, correções de bugs, **e também mudanças em documentação, diretrizes e configuração** (`README.md`, `system_map.json`, `DESIGN.md`, `Ícones.md`, `Planos/*`, etc.).
>
> **Regras:**
> 1. Registre a alteração **imediatamente após concluí-la** — nunca deixe para "depois" e nunca finalize uma sessão com mudanças não documentadas.
> 2. Se a alteração não justificar uma nova versão SemVer, registre assim mesmo usando a versão vigente com sufixo de rótulo, ex.: `## [v3.5.4-docs] - 2026-09-25` — o importante é que **a mudança apareça aqui**.
> 3. Se alterou o `system_map.json`, incremente o campo `version` dele **e** cite isso na entrada do Changelog.
> 4. A entrada mais recente fica sempre no topo da lista de versões (logo abaixo deste bloco).
>
> **Padrão de Documentação Exigido:**
> 1. Use o formato **[SemVer]** e a Data (`[vX.X.X] - YYYY-MM-DD`).
> 2. Classifique as mudanças usando as tags:
>    * `[Added]` para novas funcionalidades.
>    * `[Changed]` para mudanças de lógica estrutural ou de design.
>    * `[Fixed]` para resoluções de bugs.
>    * `[Removed]` para exclusão de código ou features.
> 3. Seja claro e cite arquivos impactados para facilitar a navegação futura.

## [v4.34.5] - 2026-10-18

**Aba Montar Ficha — fundo do menu do deck deixa de ser roxo e passa a usar o tom de preto do restante da interface; botão de Detalhes adicionado aos exercícios fora do deck** (a pedido do usuário; as duas imagens anexadas não puderam ser lidas por este modelo, que não aceita entrada de imagem — a implementação seguiu a descrição textual). (1) O menu de ações que aparece ao clicar em um exercício do deck (`.deck-card-menu`) tinha fundo roxo concentrado (`#1a0b2e`); passou a usar `var(--card-bg)` (o mesmo tom de preto dos demais cards/containers), nas duas regras (normal e royale-view override), em `cards.css` (React legacy-style + Legacy + www). (2) Nos exercícios da coleção (fora do deck ativo) foi adicionado um botão de Detalhes (ícone de lupa) ao lado do botão de Editar (lápis) na linha do card, abrindo os detalhes do exercício (CR) — `TreinosCollectionCard` (cards.tsx) + prop `onDetails` repassada por `MontarTab` (`onOpenCR`).

### Changed
- **`src-app/src/legacy-style/treino/secoes/cards.css`**, **`Legacy/style/treino/secoes/cards.css`**, **`www/style/treino/secoes/cards.css`** — `.deck-card-menu` e o override royale-view trocam `background: #1a0b2e` por `var(--card-bg)`.

### Added
- **`src-app/src/features/workout/treinos/cards.tsx`** — `TreinosCollectionCard` ganha prop `onDetails?` e um botão de Detalhes (lupa) inline ao lado do botão de Editar.
- **`src-app/src/features/workout/treinos/MontarTab.tsx`** — repassa `onDetails={onOpenCR}` aos cards da coleção.

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK · `npm run lint:docs` exit 0.

## [v4.34.4] - 2026-10-18

**Aba Início — modal seletor de fichas: remoção do botão de fechar (✕) e da linha verde de cardio duplicada abaixo dos exercícios** (a pedido do usuário; a imagem de referência anexada não pôde ser lida por este modelo, que não aceita entrada de imagem — a implementação seguiu a descrição textual). No `#modalSeletorFichas`, o botão `#btnFecharSeletorFichas` (✕) foi removido; o fechamento segue disponível pelo clique no backdrop (overlay) e pelo ESC onde aplicável. A linha verde de cardio (`dash-mini-deck__cardio-row`) abaixo do grid de exercícios foi removida, evitando duplicação com o cardio já exibido no rodapé (CARDIO CONFIGURADO), ao lado de VOLUME MÉDIO DE CARGA e MAESTRIA. Mesma alteração replicada na versão legada (`Legacy/` e espelho `www/`).

### Removed
- **`src-app/src/features/dashboard/SheetSelectorModal.tsx`** — botão `#btnFecharSeletorFichas` (✕) removido do `#modalSeletorFichas` (fechamento por clique no backdrop permanece).
- **`src-app/src/features/dashboard/FichaDeck.tsx`** — bloco `bodyRow === 'cardio'` (`dash-mini-deck__cardio-row`, linha verde) removido; o rodapé segue exibindo o cardio (CARDIO CONFIGURADO).
- **`Legacy/componentes/secoes/modais.html`** e **`www/componentes/secoes/modais.html`** — botão `#btnFecharSeletorFichas` removido.
- **`Legacy/JS/treino/secao-dashboard.js`** e **`www/JS/treino/secao-dashboard.js`** — bloco `dash-mini-deck__cardio-row` (linha verde) removido; listener `#btnFecharSeletorFichas` removido (harmless).

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK · `npm run lint:docs` exit 0.

## [v4.34.3-docs] - 2026-10-18

**DESIGN.md atualizado para refletir o app React (a pedido do usuário): o documento era do legado e não estava alinhado com a versão atual.** Apenas documentação — nenhum código do site foi alterado. Entregue: (1) **§0 "Como ler este documento"** — explica as 3 convenções de caminho (com `src-app/` = raiz do repo, sem prefixo = `Legacy/`, com `Diretrizes/` = docs) e a regra de ouro de resolução; (2) **seções 3–13 marcadas com `[LEGADO]`** no título (CSS/JS do Vanilla, referência visual); (3) **§15 expandido** com Social/Ligas, Fit ID e Sync/Conta; (4) **nova §16 "Features do App Atual (React)"** documentando Música, Social, Bloqueio, Busca, Desktop, Fit ID, Sync e uma tabela de classes CSS novas (`.bnav-icon--fill`, `.side-hud-icon--fill`, `.h-stat-fire`, `.mu-*`, `.gs-*`, `.lock`, `.fitid-*`, `.sync-*`, etc.). `system_map.json` → **3.5.83**.

### Changed
- **`Diretrizes/DESIGN.md`** — §0 novo (convenções de caminho), seções 3–14 marcadas `[LEGADO]`, §15 expandido (+Social, +Fit ID, +Sync), §16 novo (features do app atual + classes CSS novas).
- **`Diretrizes/system_map.json`** → **3.5.83** (last_updated 2026-10-18).

### Verificado
- `npm run lint:docs` → **exit 0** (300 caminhos, 154 OK, §15 18 linhas, 15 checáveis, 15/15 âncoras vivas, 0 erros).
- Nenhum código do site (`src-app/`, `Legacy/`, CSS) foi alterado — apenas `Diretrizes/DESIGN.md`.

## [v4.34.2-docs] - 2026-10-18

**Segunda metade da rodada de documentação (a pedido do usuário): o índice deixa de poder mentir em silêncio, o `context.md` deixa de ser um segundo changelog e o formato do `system_map.json` é restaurado.** Três entregas: (1) **`tools/doc-lint.mjs`** (`npm run lint:docs`) — verifica que **todo caminho citado** no `system_map.json` existe de fato, extraindo os caminhos de `entry_points`, `system_modules`, `html_fragments`, `components`, `styling_manifest`, `assets`, `documentation`, `plans`, `react_app` e `ia_quick_reference` (com expansão de `{a,b}` e reconhecimento de `[REMOVIDO]`); sai **1** se algum não existir; roda hoje com **289 caminhos verificados, 143 OK, 91 só sob `Legacy/` e 1 só sob `src-app/src/`** (os dois últimos **informativos**, não falhas — documentam o formato curto herdado). (2) **`Diretrizes/context.md` reescrito** (560 → 86 linhas): virou o **estado atual** (onde mexer, o que existe, como verificar, regras, divergências conscientes, pendências) e **perdeu os 12 blocos "Sessão anterior: …"** que duplicavam o histórico — o arquivo agora declara explicitamente que **não é changelog**. (3) **`system_map.json` reconstruído a partir do backup original** (→ **3.5.80**), porque a rodada anterior o havia reescrito com `JSON.stringify(arquivo)` — exatamente o que este projeto proíbe — inflando o diff ao expandir os arrays inline (o diff caiu de **694 linhas alteradas para 164**); a versão final mantém o formato original (arrays curtos inline, CRLF) e aplica as mudanças por **substituição literal**. Foi também indexada a nova ferramenta (`tooling.files` → `tools/doc-lint.mjs`) e o `README.md` ganhou a subseção de verificação.

### Added
- **`tools/doc-lint.mjs`** (novo; raiz → `tools/`) — lint do índice arquitetural: `npm run lint:docs` (script adicionado ao `package.json` da raiz). Percorre os caminhos citados no `Diretrizes/system_map.json`, resolve cada um contra a raiz do repositório e **falha (exit 1) listando os inexistentes**; categorias informativas à parte para os caminhos que só existem sob `Legacy/` (prefixo curto, ex.: `JS/treino/app.js`) e sob `src-app/src/` (ex.: `styles/shell.css`). Somente leitura; aceita um caminho de JSON como argumento (usado no self-test). Expande `{a,b,c}`, ignora seletores/globs/`…` e trata `[REMOVIDO vX.Y]` como esperado. **Motivação:** um índice com caminho errado é pior do que não ter índice justamente porque **falha em silêncio** — foi assim que `ia_quick_reference` passou a apontar para o legado por várias sessões.
- **`Diretrizes/README.md`** — subseção "🔎 Verificação automática (doc-lint)" em *Manutenção do Índice Arquitetural* (com a explicação do "falha em silêncio", o comando e as 3 notas), passo **5 do "Procedimento padrão"** (`Rode npm run lint:docs`) e nova linha na tabela *Resumo das Regras Absolutas* (`Validar os caminhos do índice após qualquer alteração` → `npm run lint:docs`).
- **`Diretrizes/DESIGN.md` — atualizado para o app React (v4.34.3-docs):** (1) **§0 "Como ler este documento"** — explica as 3 convenções de caminho (com `src-app/` = raiz do repo, sem prefixo = `Legacy/`, com `Diretrizes/` = docs) e a regra de ouro de resolução; (2) **seções 3–13 marcadas com `[LEGADO]`** no título (CSS/JS do Vanilla, referência visual); (3) **§15 expandido** com Social/Ligas, Fit ID e Sync/Conta; (4) **nova §16 "Features do App Atual (React)"** documentando Música, Social, Bloqueio, Busca, Desktop, Fit ID, Sync e uma tabela de classes CSS novas (`.bnav-icon--fill`, `.side-hud-icon--fill`, `.h-stat-fire`, `.mu-*`, `.gs-*`, `.lock`, `.fitid-*`, `.sync-*`, etc.). `system_map.json` → **3.5.83**. Nenhum código do site foi alterado — apenas documentação.

### Changed
- **`Diretrizes/context.md` — reescrito como "estado atual"** (560 → 86 linhas, −85%). Estrutura nova: box "o que é / o que **não** é" (não é changelog), tabela-chave (app atual / legado / versão / `system_map` / último commit `8289adb`), **§1 Onde mexer** (aponta para `ia_quick_reference.atual_src_app`, `DESIGN.md §15`, `README.md`), **§2 Estado do app** (Fases 0–5 + o que há além da paridade), **§3 Como verificar** (`tsc -b`, `oxlint`, `build`, `lint:docs` + preview/CDP + a nota de UTF-8 × PowerShell), **§4 Regras obrigatórias** (CHANGELOG, `system_map`, **o formato do arquivo — nunca `JSON.stringify`**, convenção anti-duplicação, gotchas do PowerShell 5.1), **§5 Divergências conscientes** (10 itens), **§6 Pendências** (commit, deploy Vercel com os dois `vercel.json`, `known_gaps`, paridade de deck com `null`, melhorias medidas abaixo da dobra, testes manuais) e **§7 Referências rápidas** (caminhos legados corrigidos para `Legacy/…`). Foram removidos os 12 blocos "Sessão anterior: …", os resumos por versão e a autodeclaração de desatualização (`system_map` 3.5.24) — tudo isso já vive no `CHANGELOG.md` (o texto antigo continua no histórico do Git deste arquivo).
- **`Diretrizes/system_map.json` → 3.5.80**: (a) **formato restaurado** — o arquivo foi **reconstruído a partir do backup original** (`%TEMP%/opencode/system_map.backup.json`, formato do projeto com arrays curtos **inline**) e as mudanças da `v4.34.1-docs` foram **reaplicadas por substituição literal de texto** (29 substituições), porque a rodada anterior o havia gravado com `JSON.stringify(arquivo, null, 2)`: os arrays inline foram expandidos pelo serializador e o diff saltou para **530 inserções/164 remoções (694 linhas)** contra **103/61 (164 linhas)** da versão correta; (b) nova seção **`tooling`** (`files` → `tools/doc-lint.mjs`, com o comando e o exit code) inserida antes de `react_app`; (c) `documentation.files` — `purpose` do `context.md` reescrito (era "Contexto de continuidade entre sessões de IA (raiz do repo): … o que foi feito na última sessão …") e o do próprio `system_map.json` agora cita o `npm run lint:docs`; o `context.md` também **saiu da raiz para `Diretrizes/`** no caminho.
- **`Diretrizes/system_map.json` — acentuação do bloco novo**: as strings de `ia_quick_reference` (escritas em ASCII na rodada anterior) foram acentuadas para o padrão do arquivo ("Referência rápida", "código", "histórico", "único", "obrigatório", "ícones", "rodapé", "não", "só" etc.) e o caminho `Diretrizes/Icones.md` → **`Diretrizes/Ícones.md`**, tudo **dentro do bloco** (o resto do arquivo não foi tocado, para não inflar o diff).
- **`package.json`** (raiz) — script **`lint:docs`**: `node tools/doc-lint.mjs`.

### Fixed
- **`Diretrizes/DESIGN.md` §15 — âncora corrigida ("Seletor de fichas"):** a linha citava `SheetSelectorModal.tsx` (+ `FichaDeck.tsx`), mas as âncoras `#dashWorkoutLetter` / `#dashWkDetail` vivem em **`features/dashboard/DashboardFeature.tsx`** (o seletor da barra do Início) — a célula de componentes passou a citar os três arquivos. **Erro encontrado por um protótipo do check de "âncora viva"** (id/classe citado existe em algum dos arquivos citados) rodado sobre as 18 linhas do §15: **14/15 linhas checáveis OK, 1 com âncora ausente** (era esta) — ver *Notas de implementação*.

### Notas de implementação
- **Por que o diff foi reconstruído (registro do erro):** a rodada `v4.34.1-docs` aplicou `JSON.stringify(mapa, null, 2)` — o `context.md`, então ainda na versão antiga, **avisava explicitamente para nunca fazer isso** ("usar substituição literal … NUNCA `JSON.stringify` … infla o diff em ~300 linhas (aconteceu hoje)"). O arquivo **ficou correto em conteúdo**, mas com o formato expandido. A correção foi: partir do **backup original** (formato intacto) e reaplicar **cada mudança como substituição literal** — os 29 `purpose` (a comparação `txt.includes(JSON.stringify(valor))` foi validada para 66/66 strings antes de editar), `version`, `last_updated`, `how_to_update`, os 4 caminhos de `documentation.files` e o **bloco `ia_quick_reference`** (última chave do arquivo, regravada no estilo do projeto). O backup pré-`v4.34.1` continua em `%TEMP%/opencode/system_map.backup.json`.
- **Escopo do lint (consciente):** valida **existência de caminho**, não "o índice aponta para a versão certa" — é exatamente a classe de erro que passou despercebida (apontar para `Legacy/`). Caminhos relativos a `src-app/src/` sem prefixo (ex.: `styles/shell.css` dentro de um `purpose`) são reconhecidos e listados à parte, em vez de acusados como erro.
- **`context.md` ≠ changelog:** o corte removeu o que **já estava** no `CHANGELOG.md` (resumos de sessão, listas de arquivos alterados). Nada foi perdido de forma irrecuperável: o texto antigo está no histórico do Git do arquivo e no `CHANGELOG.md`. O que ficou é o que **não está** em nenhum outro lugar: as divergências conscientes, os gotchas de ambiente e as pendências abertas.
- **`known_gaps` × `context.md`:** as pendências do `context.md` §6 **apontam** para `system_map → react_app.known_gaps` em vez de repetir os itens por extenso — mesma convenção anti-duplicação das strings `purpose`.
- **`tools/` é novo diretório** e foi indexado em `system_map.tooling` (e não em `react_app`, que é o app React) — assim o próprio `doc-lint` valida o seu arquivo.
- **doc-lint agora com 4 checks (a pedido do usuário):** (a) **existência de caminho** — fail se inexistente (já existia); (b) **âncora viva do §15** — fail se id/classe citado não existir nos arquivos declarados (encontrou e corrigiu 1 erro real no §15: `#dashWorkoutLetter`/`#dashWkDetail` estavam em `DashboardFeature.tsx`, não em `SheetSelectorModal.tsx`); (c) **anti-histórico** — AVISO se `purpose` tem ≥3 refs `vX.Y` (12 entradas hoje); (d) **tamanho do CHANGELOG** — AVISO >400 KB, ERRO >500 KB (hoje 446 KB → aviso). Cada check imprime a instrução de correção na própria saída. O README ganhou a descrição dos 4 checks.
- **Instrução × verificação (por que o §15 errou):** o §15 foi escrito **na rodada anterior, por mim, com a instrução "cite o arquivo certo" já em mente** — e ainda assim saiu **1 âncora apontando para o arquivo errado** (`#dashWorkoutLetter` estava em `DashboardFeature.tsx`, não no `SheetSelectorModal.tsx`). Nenhuma regra escrita pegaria isso; o protótipo do check pegou em segundos, e o custo dele é o mesmo de um parágrafo de regra. É a justificativa da diretriz registrada no `README.md`: **regra no ponto de uso + teste que falha** vale mais que regra nova em parágrafo.

### Verificado
- `node tools/doc-lint.mjs`: **289 caminhos verificados · 143 OK · 91 só sob `Legacy/` (informativo) · 1 só sob `src-app/src/` (informativo) · 1 `[REMOVIDO]` · 0 erros → exit 0**. `npm run lint:docs` → **exit 0**.
- **Self-test negativo** (`%TEMP%/opencode/selftest_doclint.js`): injetados 2 caminhos inexistentes numa cópia (`src-app/src/features/nao_existe/Nada.tsx` em `ia_quick_reference` e `src-app/src/components/Fantasma.tsx` em `entry_points`) — o lint **detectou os 2 e saiu 1** (por isso o script aceita o JSON por argumento).
- `require('Diretrizes/system_map.json')` → **JSON válido**, `version` **3.5.81**, `last_updated` **2026-10-18**, `tooling.files = ['tools/doc-lint.mjs']`; `git diff --numstat` do `system_map.json` = **103 inserções / 61 remoções** (formato inline preservado: `"js_files": ["JS/treino/db.js"]` segue em 1 linha).
- `context.md`: **86 linhas · CRLF 0 · LF 85** (o arquivo já era LF), sem resíduo de "Sessão anterior" — era **560 linhas** antes da reescrita.
- **Protótipo do check de âncora** (`%TEMP%/opencode/proto_anchor.js`) sobre o `DESIGN.md` §15: **18 linhas, 15 checáveis, 1 falha real** (a corrigida acima em `### Fixed`) — **14/15 antes da correção e 15/15 depois**. Os arquivos citados nas 18 linhas existem (o que o `doc-lint` já cobre), mas a **coerência arquivo ↔ âncora** ainda **não** é verificada automaticamente.

## [v4.34.1-docs] - 2026-10-18

**Rodada de documentação (a pedido do usuário): o índice "onde editar" passa a apontar para o app ATUAL, as strings `purpose` deixam de acumular histórico de versão e o `DESIGN.md` ganha um mapa de UI por área de tela.** Diagnóstico que motivou a rodada: o `system_map.json` (130 KB) havia acumulado **248 referências de versão** dentro dos `purpose` (187 delas só em `react_app.entry_points`) — virando um segundo changelog — e a seção `ia_quick_reference`, feita para dizer *onde editar*, tinha **20 das 29 entradas apontando para o legado** (`JS/treino/`, `style/treino/`, `Assets/`, `sw.js`) e apenas 4 para `src-app/`, ou seja, mandava o agente para a versão Vanilla. Entregue: (1) **`ia_quick_reference` reformulado** em `legenda` + **`atual_src_app` (26 entradas com caminhos `src-app/src/…`)** + **`legado_referencia` (22 entradas prefixadas com `Legacy/`)** + `regras`, cobrindo as áreas que faltavam (barra inferior, prévia do Início, hero da Ficha, seletor de fichas, tokens/cores, sidebar/drawer, música, sync/conta, ciclo build→preview→deploy); (2) **strings `purpose` do `react_app` encurtadas** (79.380 → 54.510 chars, −31%) pela regra **identidade + estado atual**, com o histórico permanecendo exclusivamente aqui; (3) **`DESIGN.md` §15 "Mapa de UI — por Área de Tela"** (tabela Área → Componente → CSS → âncoras id/classe + as 3 regras de ouro do CSS do app); (4) **correções mecânicas** — `last_updated` de 2026-10-17 → **2026-10-18** (estava um dia atrás da própria v4.34.0), caminhos de `documentation.files` (`context.md`→`Diretrizes/context.md`, `DESIGN.md`→`Diretrizes/DESIGN.md`, `navbar-inferior.html`→`Referências/`, `Personalização-perfil.md`→`Planos/`) e a **árvore de diretórios do `README.md`**, que listava esses arquivos em pastas onde não estão. `system_map.json` → **3.5.79**.

### Changed
- **`Diretrizes/system_map.json`** → **3.5.79** (e `last_updated` **2026-10-18**): **`ia_quick_reference` reestruturado** de lista plana para `{ description, legenda, atual_src_app, legado_referencia, regras }`. `atual_src_app` (26): `shell_e_splash`, `tokens_e_cores`, `secao_inicio`, `previa_ficha_do_dia`, `seletor_de_fichas`, `menu_do_inicio_e_fit_id`, `ficha_e_hero`, `modais_de_treino`, `barra_inferior`, `sidebar_e_drawer`, `secao_treinos`, `progresso`, `gamificacao_e_share`, `perfil`, `configuracoes`, `musicas`, `bloqueio_lock`, `busca_global`, `social_e_ligas`, `noticias_e_missoes`, `dados_locais_idb`, `sync_e_conta`, `animacoes_e_motion`, `servicos_do_shell`, `padrao_overlays_portal`, `build_preview_deploy` — cada uma **1 linha "onde editar → arquivos"** com o prefixo `[ATUAL]`. `legado_referencia` (22): as antigas entradas de legado com o prefixo `[LEGADO]` e os caminhos **corrigidos para `Legacy/…`** (antes escritos sem o prefixo, como `JS/treino/…`, embora os arquivos estejam em `Legacy/`). `regras` (3): `add_new_icon`, `record_change`, `update_this_index`. O `how_to_update` recebeu a **convenção anti-duplicação** ("mantenha cada `purpose` CURTO e atemporal; NÃO acumule cadeias `vX.Y: …` — o histórico pertence ao `CHANGELOG.md`").
- **`Diretrizes/system_map.json`** — strings encurtadas (mesmo arquivo, itens 2 e 4): `react_app.entry_points[*].purpose` (**21 das 55** encurtadas), `react_app.core_db[*]` e `react_app.styles[*]`, pelo corte da cadeia `vX.Y: …` que se acumulava. Total **79.380 → 54.510 chars (−31%)**; distribuição atual dos `purpose` de `entry_points`: maior `features/settings/` (3.450), mediana 872, menor 142. `documentation.files` teve os caminhos corrigidos: `Diretrizes/context.md`, `Diretrizes/DESIGN.md`, `Referências/navbar-inferior.html`, `Planos/Personalização-perfil.md`.
- **`Diretrizes/DESIGN.md`** — nova **§15 "Mapa de UI — por Área de Tela (onde mexer)"**: tabela de 18 áreas (Tokens/cores, Casca/splash, Início, Prévia da ficha, Seletor de fichas, Menu do Início/Fit ID, Barra inferior, Sidebar/Drawer, Hero da Ficha, Ficha tabela/grid/foco, Treinos, Progresso/Radar, Gamificação/Share, Perfil/Configurações, Músicas, Notícias/Missões, Bloqueio, Busca) com **Componente (`src-app/src/…`) | CSS | Âncoras (id/classe)**, seguida das **3 regras de ouro do CSS do app** (ordem de cascata em `main.tsx` — `shell.css` por último; todo overlay via `createPortal(document.body)` por causa do `will-change: transform` do `.section-strip`; consulta obrigatória ao `Ícones.md`). O item final do §14 ("Sem Token Bloqueado") foi ajustado para citar o caminho **atual** (`src-app/src/legacy-style/treino/secoes/`), em vez do `style/treino/secoes/` legado.
- **`Diretrizes/README.md`** — árvore de diretórios corrigida (o `DESIGN.md` sai da raiz para `Diretrizes/`; `Personalização-perfil.md` → `Planos/`; `navbar-inferior.html` → `Referências/`; `context.md` listado em `Diretrizes/` com a nota de desatualização); `DESIGN.md (raiz do projeto)` → **`Diretrizes/DESIGN.md`** (2 ocorrências: regra 6 dos agentes e a tabela de "Regras Absolutas"); a tabela **"Quando atualizar"** do `system_map` passou a distinguir **app atual (`src-app/src/`)** de **legado (`Legacy/…`)** e ganhou a linha "Registro de uma mudança → `CHANGELOG.md`, **não** no `purpose` deste JSON", mais o box da **convenção anti-duplicação**.

### Notas de implementação
- **Escopo do corte (consciente):** o encurtamento automático foi aplicado **só ao `react_app`** (o que cresce). As seções **legadas** (`system_modules`, `html_fragments`, `styling_manifest`) foram **deixadas intactas de propósito**: nelas os marcadores "A partir da vX.Y: …" descrevem o **comportamento congelado atual**, não um histórico acumulado — cortá-los perderia informação. Se um legado voltar a mudar, aí sim vale encurtar.
- **Heurística do corte:** divisão do `purpose` nos pontos em que **uma versão inicia uma frase nova** (`". vX.Y…"`), mantendo o **1º bloco** (identidade/âncoras: ids e classes que o agente usa para localizar) + o **último** (estado atual). Efeito colateral conhecido: a frase de identidade pode conter um estado **já superado** por uma mudança do bloco descartado (ex.: `DashboardFeature.tsx` ainda diz "arena card com radar", que saiu do Início na v4.30.0) — nesse caso, ajuste a frase de identidade à mão; o texto longo continua recuperável pelo histórico deste Changelog **e** pelo backup da sessão (`%TEMP%/opencode/system_map.backup.json`).
- **Formato do arquivo:** o `system_map.json` estava em **CRLF**; o script gravou em LF no 1º passo e foi **normalizado de volta para CRLF** no passo seguinte (860 CRLF, 0 LF solto) para não gerar diff de fim de linha.
- **Não foi feito nesta entrada:** o `context.md` **não** foi enxugado aqui — na rodada seguinte (`v4.34.2-docs`) ele foi reescrito como "estado atual" e a cadeia de "Sessão anterior: …" (12 blocos) foi removida.

### Verificado
- `node` (parse + `require`) do `Diretrizes/system_map.json`: **JSON válido**, `version` **3.5.79**, `last_updated` **2026-10-18**; `ia_quick_reference` com `atual_src_app` 26 / `legado_referencia` 22 / `regras` 3; CRLF 860 e 0 LF solto; os 55 `entry_points` checados um a um (nenhum `purpose` truncado no meio — 1 falso-positivo de regex revisado e completo). `git diff --numstat` do `system_map.json`: 530 inserções / 164 remoções (arquivo não "reescrito" por fim de linha).

## [v4.34.0] - 2026-10-18

**Rodada de ajustes finos do tema (a pedido do usuário): o prato de volume perde as letras "KG", o TREINAR volta à outline roxa (fixa), o halteres da aba Treinos é refeito no desenho do Font Awesome, a letra do treino vai para a linha do "N ex" em cinza, a prévia do Início passa a exibir a cor do grupo muscular de cada exercício e o hero da Ficha ganha "EVO FIT", a contagem da ficha aberta e a chama da ofensiva do Início**: (1) **o ícone do "VOLUME MÉDIO DE CARGA" fica só com o prato** — as letras "KG" saíram a pedido (seguiam ilegíveis em 22px mesmo depois da v4.33.0), e com elas o `<mask>`/`useId`: o desenho agora é **uma silhueta preenchida** (path único = prato trapezoidal + alça). (2) a **outline do TREINAR volta a ser o roxo fixo `#8b5cf6`** — na v4.33.0 ela passou a `var(--primary)`, mas o pedido é **a mesma roxa que os outros dois botões usavam**, não o acento escolhido no tema do usuário. (3) o **ícone da aba TREINOS** deixa o desenho improvisado (4 anilhas em `<rect>`, que a 22px **se colavam** num bloco só) e passa ao **halteres do Font Awesome** (`solid/dumbbell`) — o MESMO glifo que o app já usa nos placeholders (`fas fa-dumbbell`), em silhueta preenchida, com os mesmos tons/estados dos ícones vizinhos. (4) no **seletor de ficha** da barra inferior a **letra do treino** (A/B) sai do **selo roxo sobre a miniatura** e passa a ser exibida **na mesma linha do "N ex", em cinza** ("TREINO" / "A 5 ex"). (5) a **prévia do treino passa a mostrar a cor do grupo muscular** de cada exercício (as regras existiam desde a v4.30.0, mas **em minúsculas** — `.card-peito` — e o DOM escreve **`card-Peito`**: nunca casaram). (6) no **hero da Ficha** o selo do topo troca **"ACADEMIA" por "EVO FIT"**; (7) a contagem de **EXERCÍCIOS** deixa de ser o **total do banco** (`exercises.length`) e passa a ser a **da ficha aberta** (mesma conta do botão seletor do Início); e (8) **"DIAS SEGUIDOS"** ganha a **mesma chama (ofensiva) da aba Início** — o `FIRE_SVG` (chama em traço, só aparecia com sequência > 0) dá lugar ao Material Symbol `local_fire_department` do `#dashBtnOfensiva`, sempre visível e **cinza com a sequência zerada**. `system_map.json` → **3.5.78**.

### Changed
- **`components/VolumeKgIcon.tsx`** (pedido 1 — "o ícone ficou bom, mas o texto KG continuou ruim, remova-o"): as letras saíram por completo, e com elas o `<mask>`, o `useId()` e os paths das letras — o componente agora renderiza **um único `<path fill="currentColor">`** (prato + alça, `PLATE_PATH` + `HANDLE_PATH`), 22×22 como antes. `PLATE_PATH`/`HANDLE_PATH` seguem no arquivo (é o desenho que o usuário aprovou); o histórico das letras ficou no comentário do topo. Consumidores (`FichaDeck` via `.dash-mini-deck__stat-icon.kg` e `MontarTab` via `.volume-kg-icon`) não mudaram.
- **`legacy-style/treino/secoes/dashboard.css`** (pedido 2 — outline do TREINAR): `.dash-next-step-btn` troca **`1.5px solid var(--primary, #8b5cf6)`** por **`1.5px solid #8b5cf6`** (comentário `v4.34.0` no arquivo). `var(--primary)` acompanha o **acento do tema do usuário** (coral, no dele) — o pedido é a roxa **que os outros dois botões usavam**; as outlines do **seletor de ficha** e do **ciclo** seguem a preta discreta `rgba(0,0,0,.8)` da v4.33.0.
- **`components/BottomNav.tsx`** e **`components/nav-section-items.tsx`** (pedido 3 — halteres): o ícone da seção TREINOS passa ao **glifo sólido do Font Awesome** (`svgs/solid/dumbbell`, `viewBox="0 0 640 512"`, path oficial copiado com crédito no comentário — **CC BY 4.0**): barra central + **2 anilhas por lado em degrau** (as de fora mais baixas, as de dentro mais altas) + **pino externo**. É **silhueta preenchida** (`fill="currentColor" stroke="none" strokeWidth="0"`), então as regras de traço dos vizinhos não se aplicam: **`legacy-style/treino/7-nav-icons.css`** ganha o bloco **`.bnav-icon--fill`** (normal `rgba(255,255,255,.35)`, ativo **`var(--primary-light)`**, hover 70% dentro de `@media (hover:hover)`) e **`styles/shell.css`** ganha **`.side-hud__icon svg.side-hud-icon--fill`** (`stroke:none; fill:currentColor`) para a Sidebar do desktop — paridade barra inferior ↔ sidebar mantida.
- **`features/dashboard/DashboardFeature.tsx`** e **`legacy-style/treino/secoes/dashboard.css`** (pedido 4 — letra do treino no seletor de ficha): o `<div className="dash-workout-letter-badge">` (selo de 20px roxo `#a855f7` com borda branca sobre a miniatura) foi **removido do JSX** e o `#dashWorkoutLetter` virou um **`<span className="dash-workout-ex-letter">` dentro do `<span className="dash-workout-ex-count" id="dashWkDetail">`** — as duas regras do selo saíram do CSS e entrou **`.dash-workout-ex-letter`** (cinza `rgba(255,255,255,.5)`, Rajdhani 800 0.85rem, `margin-right:5px`), com **`.dash-workout-ex-count` virando um flex** (`align-items:baseline`) para a letra e o número ficarem na mesma linha. Resultado: **"TREINO" / "A 5 ex"** (era "TREINO" / "5 ex" + selo roxo na imagem).
- **`legacy-style/treino/secoes/dashboard.css`** (pedido 5 — cor do grupo muscular na prévia): as regras `.dash-mini-deck__grid .deck-card.card-peito` … `.card-aeróbico` (minúsculas, escritas na v4.30.0) foram **reescritas com o nome exato do DOM** — **`.card-Peito`, `.card-Costas`, `.card-Pernas`, `.card-Ombros`, `.card-Bíceps`, `.card-Tríceps`, `.card-Core`, `.card-Aeróbico`** — e com as **MESMAS cores de `cards.css`** (`#ef4444`, `#22c55e`, `#3b82f6`, `#f59e0b`, `#ec4899`, `#8b5cf6`, `#64748b`, `#06b6d4`), agora também declarando a **`--card-glow`** de cada grupo. Assim a **tabela de cor por grupo muscular passa a ser única no app** (Minha Ficha e prévia do Início mostram a mesma cor para o mesmo grupo) e cada card da prévia ganha a **faixa de topo** que a aba Minha Ficha tem.
- **`features/workout/FichaFeature.tsx`** e **`legacy-style/treino/1-core.css`** (pedidos 6, 7 e 8 — hero da Ficha): (a) o selo do topo vira **`🏋️ EVO FIT`**; (b) `#statTotalEx` deixa de usar `exercises.length` (o **total do banco**, 66) e passa a usar o **`total`** já calculado na tela (`exercicios.length + (hasAe ? 1 : 0)` — a ficha aberta + a linha de cardio), que é **a mesma conta do `totalItems`** do botão seletor do Início; (c) a constante **`FIRE_SVG` foi removida** e "Dias Seguidos" passou a renderizar o **Material Symbol `local_fire_department`** — o mesmo glifo do `#dashBtnOfensiva` da aba Início — em um `<span className="material-symbols-outlined h-stat-fire">` que aparece **sempre** e recebe **`h-stat-fire--off`** quando `streak === 0`. O CSS novo vive no `1-core.css` como **`.h-stat-val .h-stat-fire`** (18.4px, `#fdba74`, `margin-left:6px`, alinhado ao número) e **`.h-stat-val .h-stat-fire--off`** (`#9ca3af`), com o seletor **composto de propósito**: especificidade (0,2,0) vence a base do Google (`.material-symbols-outlined{font-size:24px}`, 0,1,0) sem depender da ordem das folhas de estilo.
- **Documentação** — `system_map.json` → **3.5.78** (notas `v4.34.0` nas entradas de `FichaFeature.tsx`, `DashboardFeature.tsx`, `VolumeKgIcon.tsx`, `BottomNav.tsx`, `nav-section-items.tsx`, `styles/shell.css` e `legacy-style/`); **`Ícones.md`** §7 (o halteres da seção Treinos passa a ser o glifo do Font Awesome, silhueta preenchida, com a nota das anilhas que se colavam e do crédito CC BY 4.0) e §8 (o prato de volume **sem as letras**, path único); **`DESIGN.md`** §6.1 (a prévia do Início exibe a **cor do grupo muscular** de cada card, com a mesma tabela de `cards.css`, e o seletor de ficha mostra a letra do treino **em cinza, na linha do "N ex"** — e, aproveitando que a tabela de cor passou a ser única, a lista "Brilhos Temáticos por Categoria Muscular" do documento foi **corrigida**: ainda listava a paleta antiga (`#e94560`, `#4ecdc4`, `#f9ca24`, `#a29bfe`, `#55efc4`, `#fd79a8`, `#fdcb6e`), que não corresponde ao `cards.css` desde muito antes desta rodada); **`context.md`** (cabeçalho → 3.5.78 + resumo da sessão).

### Notas de implementação
- **Halteres × "imagem fixada" (interpretação):** o pedido era "aprimore o ícone da aba treinos para ficar mais semelhante à imagem fixada". A imagem fixada foi entendida como o **glifo do Font Awesome** (`solid/dumbbell`) — o **mesmo** `fas fa-dumbbell` que o próprio app já mostra nos placeholders de imagem de exercício (`.premium-placeholder`), o que também explica o "ainda não parece". O desenho anterior tinha um **defeito real**: as 4 anilhas eram `<rect>` de 3 de largura com traço 2 e folga de ~1 unidade entre elas, ou seja as bordas **se sobrepunham** (`d=stroke` não era respeitado) e as 5 formas viravam **um bloco só** em 22px. Se a referência for outro halteres, o ajuste é trocar o `d` do path em **2 arquivos** (`BottomNav.tsx` e `nav-section-items.tsx`) + a classe de fill — nada estrutural.
- **Licença do glifo:** o path do Font Awesome Free 6 é distribuído sob **CC BY 4.0** (ícones) — o crédito ("Font Awesome Free 6 — solid/dumbbell, CC BY 4.0") está no **comentário do componente** em ambos os arquivos. O app **já embarca** o `public/vendor/fontawesome.min.css` + webfonts, então nada novo é distribuído com o build.
- **Silhueta preenchida × traço dos vizinhos:** os ícones da navegação são **traço** (`stroke`), e a CSS base (`.bnav-icon svg { stroke: … }`, `.side-hud__icon svg { stroke: currentColor }`) **vence os atributos de apresentação** do SVG. Por isso o halteres entra com **`strokeWidth={0}`** (a largura de traço não é definida por CSS, então 0 zera o traço mesmo com a cor aplicada) **e** com as regras de `fill` por estado (`.bnav-icon--fill` / `.side-hud-icon--fill`) — sem elas o desenho sairia com a cor do traço no `fill` herdado, sem os estados normal/ativo.
- **Letra do treino:** o selo sobre a miniatura foi **removido junto** (senão a letra apareceria 2×) e o **`id="dashWorkoutLetter"` foi mantido** no novo `<span>` (o legado e as sondas o procuram); o `id="dashWkDetail"` continua no contêiner. Ordem escolhida: **letra antes do número** ("A 5 ex"), com `margin-right` de 5px — legível no card estreito e sem separador extra.
- **Cores por grupo (causa-raiz):** as regras da prévia estavam em **minúsculas** desde a v4.30.0 e o DOM escreve `card-${exercise.muscleGroup}` com **a inicial maiúscula** (`card-Peito`) — **nunca casaram**, e a prévia ficava sem as faixas coloridas (a diferença só apareceu agora, com o resto da prévia já neutro). As cores adotadas são as do `cards.css` (Minha Ficha), então um grupo muscular tem **uma cor no app inteiro**; a `--card-glow` foi declarada junto (o hover da prévia ainda usa `#8b5cf6` fixo — a variável fica pronta para o hover passar a seguir o grupo).
- **Larguras fracionárias nas medições:** o `getComputedStyle` do Chrome **arredonda `border-width` para pixel inteiro** (`4.5px`→`4px`, `1.5px`→`1px`) — é o mesmo efeito já registrado na v4.33.0; a cor é que identifica a mudança nas sondas.
- **Chama do hero:** foi mantido o **Material Symbol** (ligadura de fonte) em vez de um SVG interno, porque o pedido é "o **mesmo** ícone de ofensiva da aba Início" — e a aba Início usa exatamente esse glifo (`#dashBtnOfensiva`). A dependência é a mesma que a tela já tem (Material Symbols via Google Fonts) e o CSS do hero vence a base 24px por especificidade.
- **Chama com a sequência zerada:** na aba Início a chama fica **cinza** quando a ofensiva é 0; o hero agora faz o mesmo (`h-stat-fire--off`) — antes o ícone simplesmente **não aparecia** com 0 dias, que era o caso da tela do usuário.

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK · sonda CDP **17/17 PASS** (412×892, preview de produção + Chrome headless CDP), com as medições: prato **22×22** branco, **`<mask>` = 0**, **`<text>` = 0** e **1 path** (`M 186 176 …` + `M 218 84 …`, sem nenhum path de letra); outlines **`rgb(139,92,246)`** (TREINAR) / **`rgba(0,0,0,0.8)`** (seletor de ficha e ciclo); TREINOS com `viewBox="0 0 640 512"`, 1 path, `fill: rgba(255,255,255,0.35)` e `stroke: none` na barra inferior (ativo: `rgb(192,132,252)`) e **1 instância igual na Sidebar**; `#dashWorkoutLetter` = **"A"** dentro do `#dashWkDetail` = **"A 5 ex"**, na **mesma linha** (centros alinhados) e em **`rgba(255,255,255,0.5)`**, com **`.dash-workout-letter-badge` ausente do DOM**; prévia com **`Peito=rgb(239,68,68)`**, **`Pernas=rgb(59,130,246)`**, **`Ombros=rgb(245,158,11)`**, **`Core=rgb(100,116,139)`** (4 cores distintas nos 5 cards); hero com **`🏋️ EVO FIT`**, **`6`** em EXERCÍCIOS (**5 linhas + cardio = 6**, e não 66) e a chama **`local_fire_department`** em **14.95px** (vence a base 24px) **`rgb(156,163,175)`** com `h-stat-fire--off`, **idêntica** à do `#dashBtnOfensiva`; regressão: sub-aba Personalizar intacta (**6 line + 3 circle**). Capturas: `%TEMP%/opencode/v434_*.png` (início, prévia 2×, barra inferior, hero + stats, halteres inativo/ativo 3× e prato).

## [v4.33.0] - 2026-10-17

**A prévia do Início larga o violeta do "radar fit" e assume o tom de preto da aba Minha Ficha, menu do Início ganha TELA CHEIA, letras "KG" do ícone de volume refeitas, outlines dos três botões inferiores redistribuídas, halteres na aba Treinos e sliders na sub-aba Personalizar**: (1) **a pedido do usuário**, as **bordas e o fundo da prévia da ficha do dia** deixam de usar o **violeta fixo herdado do antigo "radar fit"** e passam a usar o **mesmo tom de preto da aba Minha Ficha**: `.dash-arena-card` troca o `linear-gradient(180deg, rgba(27,10,43,.8), rgba(13,4,22,.95))` + borda `rgba(139,92,246,.25)` por **`var(--card-bg)` + `var(--card-border)`** (o par exato do `.deck-builder-container`), o `.dash-mini-deck` do seletor troca `linear-gradient(#0e0d1a, #07060d)` + borda branca 8% pelo mesmo par, os cards do grid trocam `rgba(21,20,40,.85)` + borda `#23223f` pelo **gradiente slate `#1e293b→#0f172a` + borda branca 10%** (idênticos ao `.deck-card` referência), com header `#151428`→`rgba(0,0,0,.4)`, imagem com `#23223f`→hairline branca 6% e widgets do rodapé `rgba(21,20,40,.75)`/`#23223f`→`rgba(0,0,0,.2)`/`rgba(255,255,255,.05)`; a **linha "TREINO X · FICHA DO DIA"** perde o tingimento do acento (`rgba(var(--primary-rgb),.1)/.28`) e vira superfície neutra com **texto claro** (o rótulo do acento → `rgba(255,255,255,.55)` e o chip → branco 6%/16%); a hairline do **rodapé do ciclo** (`rgba(139,92,246,.15)`) e a **trilha das 30 divisões** (`#0f0a18` + borda `#2b1444`) ficam neutras; e o **ícone de cardio** do rodapé troca o `#a855f7` fixo por `currentColor` + `var(--primary-light)` (mesma fonte do `.cardio-icon` da Minha Ficha). (2) o **menu do Início** ganha **TELA CHEIA** (entrar/sair) entre "Ajuda" e "Fit ID". (3) as **letras "KG"** do prato de peso foram **refeitas** (legibilidade em 22px). (4) as **outlines dos três botões** da barra inferior foram redistribuídas: **seletor de ficha** e **ciclo** com preta discreta, **TREINAR** com a outline de destaque. (5) o ícone da **aba TREINOS** vira **halteres**. (6) o ícone da sub-aba **PERSONALIZAR** vira **3 sliders**. `system_map.json` → **3.5.77**.

### Added
- **`features/dashboard/InicioMenuModal.tsx` — item "TELA CHEIA"**: 7º item do menu (chaves `registro`, `rankings`, `mensagens`, `config`, `ajuda`, `fullscreen`, `fitid`; 5 grupos separados por hairline), com **ícone próprio** (maximizar/minimizar, 17px — mesmos paths do shell) e **rótulo dinâmico** (`Tela cheia` ↔ `Sair da tela cheia`). A ação é `onClose(); toggleFullscreen();` e reusa o **`useCrossBrowserFullscreen`** (`lib/fullscreen.ts`) — a **mesma instância/estado** do Drawer e da Sidebar HUD, então o hook já reage ao evento `fullscreenchange` e o rótulo se atualiza sozinho, sem criar um segundo dono do estado. O menu fecha antes de entrar/sair para o painel não ficar "pendurado" no canto.

### Changed
- **`legacy-style/treino/secoes/dashboard.css`** (pedido 1 — "o violeta do radar fit sai, entra o tom da Minha Ficha"): `.dash-arena-card`, `.dash-mini-deck`, `.dash-mini-deck__grid .deck-card`, `.deck-card-header`, `.deck-card-img`, `.dash-mini-deck__stat-widget`, `.dash-mini-deck__sheet-row`/`__sheet-row-tag`, `.dash-arena-footer`, `.dash-arena-progress-container`, `.dash-mini-deck__stat-icon.pulse` e `.dash-mini-deck__swap-btn` (todos com os valores antigos→novos no resumo acima e **comentários `v4.33.0`** no arquivo). O par `var(--card-border)`/`var(--primary)` foi **mantido de propósito**: é exatamente o token da aba Minha Ficha (violeta 20% de borda / acento do tema) — a prévia e a referência ficam idênticas.
- **`features/dashboard/FichaDeck.tsx`** — ícone de cardio do rodapé: `stroke="#a855f7"` → `stroke="currentColor"`, com a cor vindo do CSS (`var(--primary-light)`, como o `.cardio-icon` da Minha Ficha); o glow do widget passou a seguir o tema.
- **`legacy-style/treino/secoes/dashboard.css`** (pedido 4 — outlines da barra inferior): `.dash-workout-exercise-card` (seletor de ficha) e `.dash-cycle-progress-card` (ciclo) trocam `1.5px solid #8b5cf6` por **`1.5px solid rgba(0,0,0,.8)`** (preta discreta) e `.dash-next-step-btn` (TREINAR) recebe **`1.5px solid var(--primary, #8b5cf6)`** — era `#4a1d82` (roxo escuro, quase invisível). O destaque da barra agora é o TREINAR e acompanha o tema.
- **`components/VolumeKgIcon.tsx`** (pedido 3) — letras **refeitas**: traço 38→**42**, corpo 150→**135** (y 290–425) e o **G no desenho geométrico clássico** (anel `r=52` — 146 de diâmetro e contra-forma de 62 — **aberto no alto à direita**, arco `A 52 52` de 46° a −6°, + **barra horizontal do anel até o centro**, como o G do logo do Google) com o **K** de haste em x=145 e braços simétricos; folga de 26 entre as letras e conjunto centrado no eixo do prato (x=256).
- **`components/BottomNav.tsx`** e **`components/nav-section-items.tsx`** (pedido 5) — o ícone da **seção TREINOS** deixa o desenho improvisado (barra + 2 círculos) e passa aos **halteres** da imagem de referência: **4 anilhas** em `<rect>` (as de fora mais baixas, as de dentro mais altas) + **barra central**, mesmo `viewBox 24`/`currentColor`/traço 2 dos vizinhos — paridade barra inferior ↔ Sidebar do desktop mantida.
- **`features/workout/treinos/TreinosFeature.tsx`** (pedido 6) — `TAB_ICON_EX` (sub-aba **PERSONALIZAR**) deixa o ícone improvisado de halteres e passa aos **3 sliders** da imagem de referência: 3 linhas (`y=5.5/12/18.5`) com **knob em anel** (`r=1.9`, traço 2.2) e barras segmentadas que param na borda do anel. Geometria **calibrada para 16px** (knobs maiores que o espaçamento entre linhas se sobrepõem — foi o primeiro desenho descartado).
- **Documentação** — `system_map.json` → **3.5.77** (notas `v4.33.0` nas entradas de `FichaDeck.tsx`, `InicioMenuModal.tsx`, `treinos/`, `VolumeKgIcon.tsx`, `BottomNav.tsx`, `nav-section-items.tsx` e `legacy-style/`); **`Ícones.md`** §7 (o `<path>` do haltere antigo dá lugar às 4 anilhas + barra, novo bloco **"Abas e sub-abas do Treinos"** com os 3 sliders, e nota no barbell do grupo muscular Costas dizendo que aquele desenho **continua** nos cards/etiquetas) e §8 (letras "KG" refeitas + traço 42); **`DESIGN.md`** §6.1 (a prévia do Início reusa a anatomia do `.deck-card` com o tom de preto da Minha Ficha); **`context.md`** (cabeçalho → 3.5.77 + resumo da sessão).

### Notas de implementação
- **Escopo do pedido 1 × pedido 4 (registro consciente):** o **contêiner da barra de botões** (`.dash-suggested-workout-card`: `linear-gradient(#12091d, #08030e)` + borda `rgba(139,92,246,.2)`) e o **fundo** dos três botões (`#221438→#0d0618`) **não** foram trocados — o pedido 4 era só sobre as **outlines**. Se quiser, é a mesma troca de 2 linhas por bloco.
- **Bordas "1px" nos botões:** a largura computada sai 1px porque uma regra da prévia (`shell.css`/media query) reescreve `border-width` nesse breakpoint; a **cor** é a nova (`rgba(0,0,0,.8)` / `var(--primary)`), como medido na sonda.
- **`--card-border` é violeta a 20%:** é o **token literal da aba Minha Ficha** (o usuário pediu "o tom da Minha Ficha"), por isso foi mantido em vez de virar branco — em 1× lê como neutro. Os demais violetas fixos usados no "radar fit" (`#23223f`, `rgba(21,20,40,.75)`, `#0f0a18`, `#2b1444`, `#151428`, `#a855f7`) saíram.
- **CSS morto do radar:** as regras `.dash-arena-content`/`.dash-arena-glow`/radar seguem no arquivo **sem uso** (nenhum TSX as referencia desde a v4.30.0, quando o radar virou prévia da ficha); não foram apagadas para não inchar o diff.
- **G "estilo Google" (decisão):** a 1ª tentativa (±32° + barra baixa) lia como "C com um risco"; o anel aberto no alto à direita + barra do anel ao centro é o desenho que lê como **G** em 22px, sem depender de fonte.
- **Tela cheia (gesto):** em navegador real a Fullscreen API exige **gesto do usuário**; o item é um `<button>` no menu (clique real), então funciona — na sonda foi acionado por `Input.dispatchMouseEvent` e entrou em tela cheia de fato.

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (bundle `index-vrG7QJcY.js`) · sonda CDP **22/22 PASS** (412×892, preview de produção): `.dash-arena-card` com `background-color: rgba(10,5,20,0.6)`, `background-image: none` e borda `rgba(139,92,246,0.2)`; `.deck-card` com `linear-gradient(145deg, rgb(30,41,59), rgb(15,23,42))` + borda branca 10%; header `rgba(0,0,0,0.4)`; widget `rgba(0,0,0,0.2)`/`rgba(255,255,255,0.05)`; linha do treino com `rgba(0,0,0,0.2)`/`rgba(255,255,255,0.06)` e texto `rgb(255,255,255)`; chip branco 6%/16%; hairline do rodapé do ciclo e trilha `rgba(255,255,255,0.06)`; cardio `rgb(192,132,252)` (`--primary-light`); **nenhum token violeta removido** presente nos valores medidos; prato **22×22** branco com `<mask>` e letras novas (`M 145 290 V 425`, `M 366.7 357 H 315`, arco `A 52 52`); botões com `rgba(0,0,0,0.8)` / `rgba(0,0,0,0.8)` / `rgb(139,92,246)`; menu com **7 itens** e a entrada `fullscreen` ("Tela cheia") que, acionada por gesto real, **entra em tela cheia de fato** e troca o rótulo para "Sair da tela cheia"; halteres com `4 rect + 1 line` e sliders com `6 line + 3 circle` (sub-aba Minha Ficha intacta: `1 rect + 3 line`); `.top-bar`/`#mobileTopBar` seguem ausentes. Capturas: `%TEMP%/opencode/v433_*.png` (zooms 3×/14× da prévia, rodapé, barra inferior, menu, halteres, sliders e do "KG" na prévia e na Minha Ficha).

## [v4.32.0] - 2026-10-17

**Volume médio de carga calculado automaticamente (incluindo o peso sugerido), ícone "KG" de prato de peso, nome do treino no topo da prévia, menu do Início refeito sobre a imagem de referência e barra superior mobile removida**: (1) o **VOLUME MÉDIO DE CARGA** deixa de ser "0.0" e passa a ser calculado das **cargas EFETIVAS** dos exercícios — a carga **salva no campo `carga`** e, quando ele ainda está vazio, a **carga SUGERIDA** por nome/grupo muscular (v4.31.0) —, pela mesma fórmula nas duas telas (prévia do Início, seletor de fichas e rodapé do "Minha Ficha"); o widget troca o **elixir rosa** por um **prato de peso "KG"** (silhueta branca, **imagem fixada** de referência do usuário); (2) na **prévia do Início** o **nome do treino** ("TREINO A · FICHA DO DIA") sobe para a **parte superior da prévia, antes dos exercícios**; (3) o **menu do Início** foi **refeito** conforme a **imagem de referência** (popup do Clash Royale): painel **ancorado no botão** (canto superior direito, com seta apontando para ele), **estreito** (≈ metade da tela), **sem cabeçalho e sem botão de fechar**, com itens no **desenho do próprio app** (ícone em quadrado arredondado + rótulo, em grupos separados por hairline) — o botão "chunky" colorido destoava do resto do site — e o **"em breve" só aparece ao tocar** nas opções placeholder (a pílula fixa saiu); (4) a **barra superior mobile** (avatar/busca/tela cheia, 56px) foi **removida** para aproveitar o espaço da tela — os recursos seguem no **Drawer** da barra inferior e no banner do Início. `system_map.json` → **3.5.76**.

### Added
- **`src-app/src/components/VolumeKgIcon.tsx` (novo)** — ícone do widget de volume: prato de peso (anilha) com alça no topo e **"KG" vazado**, recriado a partir da imagem de referência enviada pelo usuário. SVG 512×512 com `<mask>`: o prato é preenchido com `currentColor` e as letras (paths em traço 38 com pontas arredondadas — **nunca `<text>`**, para o desenho não depender de fonte carregada e escalar igual em qualquer tamanho) viram **furos** que revelam o fundo do widget — mesma silhueta do original (prato escuro/letras claras), invertida para o tema escuro. Exceção **consciente** ao `Diretrizes/Ícones.md` (silhueta preenchida em vez de stroke, como o triângulo de play da §8). `size` (default 22 — rodapé do deck) e `useId()` no id da mask (o componente monta 2× na página).
- **`src-app/src/lib/suggested-load.ts` — `parseLoadKg`, `effectiveLoadKg` e `averageLoadKg`** (+ tipo `LoadBearingExercise`): o **único** parse de carga para métricas. `parseLoadKg` entende o texto livre do campo (`'30 kg'`→30, `'12,5 kg'`→12.5, `'12 kg cada lado'`→**24** — o peso vai nos **dois** lados da barra, decisão do usuário —, `'Peso do Corpo'`/vazio→0); `effectiveLoadKg` devolve a carga salva ou, se ainda vazia, a **sugerida**; `averageLoadKg` é a média das cargas efetivas (dividida pelo total de exercícios, como no legado).

### Changed
- **`features/dashboard/FichaDeck.tsx`** — rodapé: `volumeAvg` agora é `averageLoadKg(exercises).toFixed(1)` (era `Σ(carga×séries×reps)/nº exercícios/1000`), a **mesma métrica e formatação do rodapé do "Minha Ficha"** (`computeDeckStats`) — antes as duas telas mostravam o **mesmo rótulo com números diferentes** e a prévia ficava em `0.0` (o seed nunca grava `load`). O ícone do widget virou `<VolumeKgIcon className="dash-mini-deck__stat-icon kg" size={22}/>` (saíram o `<svg>` do elixir, o `linearGradient` e o `useId`/`elixirId`). Na prévia (`bodyRow='sheet'`) a **linha de identificação da ficha sobe para ANTES do grid** (nova classe `dash-mini-deck__sheet-row--head`), abrindo a prévia com "TREINO X · FICHA DO DIA".
- **`features/workout/treinos/treinos-helpers.ts`** — `computeDeckStats` soma `effectiveLoadKg(ex)` no lugar de `parseFloat(String(ex.load)) || 0`: o rodapé do "Minha Ficha" passou de `0.0` para a média real (ex.: `31.0`).
- **`features/workout/treinos/MontarTab.tsx`** — o `<div className="volume-drop"/>` (triângulo com `clip-path`) dá lugar ao `<VolumeKgIcon className="volume-kg-icon" size={24}/>`.
- **`legacy-style/treino/secoes/dashboard.css`** — `.dash-mini-deck__stat-icon.elixir` → **`.kg`** (`color:#fff` + `drop-shadow` branco) e novo bloco **`.dash-mini-deck__sheet-row--head`** (`margin-top:0; margin-bottom:14px`).
- **`legacy-style/treino/secoes/deck-builder.css`** — o bloco `.volume-drop` (fundo no acento + `clip-path` triangular) vira **`.volume-kg-icon`** (22×30, branco, `drop-shadow` suave); a regra-base que ele dividia com `.cardio-icon` fica só com o `.cardio-icon`.
- **`features/dashboard/InicioMenuModal.tsx`** — refeito: `useLayoutEffect` mede **`#dashBtnMenu`** (getBoundingClientRect) e escreve **`top`/`right`/`max-height`** direto no nó do painel a cada `resize`/`orientationchange` (sem `setState` em efeito — nada re-renderiza); saíram o cabeçalho "MENU" e o ✕; os itens passam a usar **SVG próprio** (17px, traço 2 — histórico/troféu/mensagem/engrenagem/ajuda/escudo) no lugar dos `material-symbols-outlined`; a pílula "Em breve" saiu e os placeholders seguem avisando por **toast ao toque** (`Registro de Treinos`, `Rankings`, `Ajuda`).
- **`features/dashboard/inicio-menu.css`** — menu refeito: `.inicio-menu-overlay` sem centralização (`display:flex`/`align-items`/`justify-content`/`padding` removidos; backdrop mais leve, `rgba(0,0,0,0.5)` + `blur(4px)`), **`.inicio-menu` ancorado** (`position:fixed`, `width:min(74vw,320px)`, `max-height:60vh` rolável, raio 16, `transform-origin: top right`) com **seta `::before`** apontando para o botão, novos `.inicio-menu__icon` (quadrado 30px, raio 9, ícone no acento) e `.inicio-menu__label`, e keyframe `inicioMenuIn` vindo do canto (`scale(0.94) translate(6px,-8px)`); removidos `.inicio-menu__head/__title/__close/__list/__soon` e o botão "chunky" com bisel. O bloco do Fit ID não mudou.

### Removed
- **`src-app/src/components/MobileTopBar.tsx` (apagado)** e o `<MobileTopBar/>` do **`App.tsx`** — a **barra superior mobile** (avatar/busca/tela cheia, fixa e transparente desde a v4.6.0/v4.13.0) sai a pedido do usuário. Nada foi perdido em funcionalidade: o **Drawer** da barra inferior já tem **Busca Geral**, **Tela cheia** e o avatar (Perfil), e o Início tem o banner de perfil. **A Sidebar HUD do desktop permanece** (escopo: só a barra mobile, < 1024px).
- **`src-app/src/styles/shell.css`** — todo o bloco `.top-bar*` (barra, avatar, ações, botões, `pointer-events`), o `@media (min-width:1024px){ .top-bar{display:none} }`, as molduras `.top-bar__avatar[data-frame="bronze|prata|ouro|elite"]` e o offset de **56px**: `.section-slide` passa a ter só `padding-top: env(safe-area-inset-top, 0px)` (o inset do notch no iOS/tela cheia; 0 no Chrome/Android) — o conteúdo volta a começar no topo, como antes da v4.6.0.

### Notas de implementação
- **Métrica do volume (decisão):** o widget sempre se chamou "VOLUME MÉDIO DE CARGA", mas o Início usava *tonelagem* (`Σ carga×séries×reps ÷ 1000`) e o "Minha Ficha" usava *média de carga* — e como o seed nunca grava `load`, o Início exibia `0.0` desde sempre. Unificamos na **média das cargas efetivas (kg)**, que é o que o rótulo pede e o que o "Minha Ficha" já fazia; exercícios de peso do corpo entram como `0` e o divisor continua sendo o total de exercícios (paridade com o legado).
- **"Imagem fixada" (referência do ícone):** a imagem enviada é um prato **preto com letras brancas**; no card escuro do app isso desapareceria, então o prato é **branco** e as letras são **vazadas** (aparece o fundo do card) — mesma silhueta, sem perder a leitura de "KG".
- **Ancoragem do menu:** o painel é portal no `<body>`, então o lugar dele **não** vem do layout do dashboard — medimos o botão em `useLayoutEffect` (antes do paint, sem flash) e só re-medimos em `resize`/`orientationchange`. Se o botão não existir, cai no fallback `72px/14px`.
- **`em breve`:** só na **ação** (toast do item placeholder), nunca como estado visual do botão — era o pedido do usuário.
- **Barra mobile:** sem o offset de 56px o conteúdo do Início começa em ~y=10-24px. No Chrome Android o viewport já começa abaixo da barra de status e no iOS/tela cheia o `env(safe-area-inset-top)` cobre o notch — não há sobreposição.

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (PWA 112 entradas, bundle `index-DjKKnYbV.js`) · probe CDP **21/21 PASS** (412×892 + desktop 1440×900): `.top-bar`/`#mobileTopBar` **ausentes** do DOM, `.section-slide` com `padding-top:0px` e o Início começando no topo (y=0), sidebar do desktop intacta em 76px e a grade de 2 colunas do Início preservada; widget de volume com `<mask>` + 8 paths, `22×22`, `color: rgb(255,255,255)`, **sem `.elixir`**, valor **31.0** (era `0.0`) e os rótulos `VOLUME MÉDIO DE CARGA`/`CARDIO CONFIGURADO`; linha `TREINO A · FICHA DO DIA` **antes** do grid (row 174 < grid 228) com `margin-top:0/margin-bottom:14px`; menu aberto **alinhado ao botão** (panel.right 398 = btn.right 398, panel.top 60 ≥ btn.bottom 50), `305px` de largura em 412 (antes 400 centralizados), **sem** `__head`/`__close`/`__soon`, 6 itens com ícone SVG em quadrado de 30px e 3 separadores; toque em "Rankings" fecha o menu e mostra o toast `Rankings — em breve.`; screenshots `%TEMP%/opencode/v432_*.png` (zoom 12× do prato "KG" e rodapé do "Minha Ficha" com o mesmo ícone e `31.0`).

## [v4.31.1] - 2026-10-17

**Início (a linha do corpo passa a identificar a ficha), menu popup estilo Clash Royale + tela Fit ID, seletor de "Minha Ficha" sem preto AMOLED, peso sugerido preenchendo a Carga e chama cinza sem ofensiva**: (1) na **prévia do Início** a **linha verde de cardio** abaixo do grid de exercícios dá lugar ao **NOME do treino do dia** — "TREINO B" com a etiqueta **FICHA DO DIA**, no acento do tema — e o **1º widget do rodapé volta a ser o VOLUME MÉDIO DE CARGA** (o rodapé do modal seletor segue com volume/maestria/cardio e o modal mantém a linha de cardio no corpo); (2) o botão **menu** do Início (que não fazia nada) abre um **popup no desenho do menu do Clash Royale**, adaptado à paleta do site: *Registro de Treinos* (em breve) · *Rankings* (em breve) · **Mensagens** · **Configurações** · *Ajuda* (em breve) · **Fit ID**; a opção **Fit ID** abre uma **tela de identidade inspirada no Supercell ID** (avatar + nome, e 3 abas: *Recompensas de Identificação*, *Amigos* e *Meus Dados*); (3) o **header do seletor de treinos** da aba "Minha Ficha" abandona o **preto AMOLED (`#000`)** e assume o **tom de preto do restante da aba** (`var(--card-bg)`); (4) o **peso inicial sugerido passa a PREENCHER o campo Carga** do formulário de exercício — acompanha o nome/grupo/tags enquanto o usuário não digita nada e nunca sobrescreve um valor digitado; (5) com **0 dias de ofensiva a chama fica CINZA** (o laranja passa a significar "ofensiva acesa"). `system_map.json` → **3.5.75**.

### Added
- **`features/dashboard/InicioMenuModal.tsx` (novo)** — portal para `document.body` (o `.section-strip` tem `transform/will-change` e viraria containing block do `position: fixed`), fecha no Esc/backdrop e trava o scroll do body. Itens em 4 grupos separados por hairlines, na ordem pedida: `registro`/`rankings` (placeholder → `showToast('… em breve.', 'info')` + fecha), `mensagens` (→ `onOpenMessages`), `config` (→ `onOpenSettings`), `ajuda` (placeholder) e `fitid` (→ `onOpenFitId`); os placeholders levam a pílula **"Em breve"**.
- **`features/dashboard/FitIdOverlay.tsx` (novo)** — tela de identidade em tela cheia. Header: engrenagem (→ Configurações), avatar + chip **FIT ID** + nome + subtítulo (`TÍTULO · OFENSIVA N DIAS`) e X. Abas: **Recompensas de Identificação** (cartão destaque `EVO FIT`/nome/`CONECTADO`/**PONTUAÇÃO TOTAL** = XP + nível, cartão "Junte pontos e ganha prêmios" e 3 mini-stats: treinos, ofensiva e nível), **Amigos** (reusa `FRIENDS` da Social: lista com status online/em treino/offline, troféus e CTA "Adicionar amigo") e **Meus Dados** (adaptação de "Jogos Meus": linha em destaque do app + as **fichas** do usuário com o nº de exercícios e os treinos concluídos de cada letra, lidos de `history.completedKeys`/`sheetKey`). Volta para a 1ª aba a cada abertura.
- **`features/dashboard/inicio-menu.css` (novo)** — estilos dos dois overlays (menu "chunky" com gradiente do acento + bisel, Fit ID com cartões `#0b0b10`, abas, pílulas de status e regra de desktop com a janela centralizada).

### Changed
- **`FichaDeck.tsx`** — novo prop **`bodyRow?: 'cardio' | 'sheet'`** (padrão `cardio`, preserva o modal). Com `sheet`, a linha abaixo do grid deixa de ser a linha verde de cardio e passa a ser a **linha de identificação** (escudo + `TREINO {letra}` + etiqueta `FICHA DO DIA`). O widget `firstStat`/`lastStat` do rodapé foi **removido**: o rodapé voltou a ser **volume médio de carga + (maestria) + cardio** nas duas telas.
- **`dashboard.css`** — bloco `.dash-mini-deck__sheet-row` (+ `svg`/`-tag`): mesma geometria da linha de cardio, mas no **acento primário** (`--primary-rgb`/`--primary-light`) — verde no app é a cor de cardio, então a identificação da ficha não usa verde.
- **`DashboardFeature.tsx`** — a prévia passa `bodyRow="sheet"`; novo estado `menuOpen`/`fitIdOpen`; `#dashBtnMenu` abre o menu; novos props `onOpenSettings` e os dados do Fit ID (`userName`, `avatarUrl` — imagem do emblema quando existe, senão dicebear —, `titulo`, `xp`, `streak`, `sheets`, `exercises`, `history`).
- **`App.tsx`** — `<DashboardFeature onOpenSettings={openProfileSettings} />` (abre o hub de configurações do Perfil, o mesmo caminho da drawer).
- **`shell.css`** — `[data-section='dashboard'] .deck-header { background: var(--card-bg) !important }` (era `#000`, o `v4.8.4.3-deck-amoled`) e novo bloco da ofensiva zerada: `.dash-streak-btn--off` deixa ícone/valor/borda/fundo **cinza** (`#9ca3af`/`#cbd5e1`, `grayscale(1)` no ícone).
- **`DashboardFeature.tsx`** — o botão de ofensiva recebe a classe `dash-streak-btn--off` quando `getStreak(history) === 0`.
- **`treinos/ExercicioFormModal.tsx`** — o campo **Carga** nasce com a **sugestão de peso do exercício** (`getSuggestedLoad`): um `useEffect` mantém o valor igual à sugestão enquanto o usuário não digita (marcado por `cargaTouchedRef`), e o `onChange` marca o campo como "tocado" — a partir daí o valor do usuário é soberano. Exercício já salvo com carga preenchida já nasce "tocado" (nada é sobrescrito); com carga vazia a sugestão preenche. O placeholder `Sugerido: X` continua servindo de dica quando o campo é apagado.

### Notas de implementação
- **Mensagens** leva para a aba **Social**, onde vive o bate-papo (subaba Guilda). Não passamos `activeSubTabProp` para a LigasFeature de propósito: o prop deixa a subaba controlada e quebraria a navegação interna dela.
- **Configurações** e a engrenagem do Fit ID usam o mesmo `openProfileSettings` da drawer (hub do Perfil).
- **Placeholders** (Registro de Treinos, Rankings, Ajuda e os CTAs do Fit ID) avisam por toast `info` — nada é gravado.
- O peso sugerido **preenche** o campo (requisito v4.31.1) mas continua sendo **de tela**: nada é gravado no banco até o usuário salvar o exercício; as fichas do seed seguem com `load` vazio e o rodapé mostra `0.0` de volume.
- A troca do rodapé da prévia (v4.30.1) foi **revertida**: o rodapé do Início e o do modal voltaram a ser idênticos (volume/maestria/cardio) e o que identifica a ficha na prévia é a linha do corpo.

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (PWA 112 entradas, bundle `index-Db_5OvGD.js`) · probe CDP **43/43 PASS** em 440×956 + reload com banco limpo: prévia com `VOLUME MÉDIO DE CARGA`/`CARDIO CONFIGURADO` no rodapé, linha `TREINO B · FICHA DO DIA` no corpo e **sem linha verde de cardio**; modal seletor com os 3 widgets e a linha de cardio; menu com 6 itens/3 separadores/cabe na tela; Fit ID (3 abas, pontuação, 3 mini-stats, 5 amigos e as fichas A/B com treinos); Mensagens → seção `social`; Configurações → `#perfil-overlay` visível; placeholder → toast; `.deck-header` com `rgba(10, 5, 20, 0.6)` = `var(--card-bg)` da aba (nenhum `rgb(0,0,0)`); Carga já preenchida na edição (`30 kg`) e no novo exercício (`30 kg` → digitar `42 kg` + trocar o nome mantém `42 kg`, placeholder `Sugerido: 25 kg`); ofensiva zerada com `--off`, ícone em `rgb(156, 163, 175)`; 30 divisões com a skin; 0 erros de console. Capturas em `%TEMP%/opencode/v4311_*.png`.

## [v4.31.0] - 2026-10-17

**Início (prévia sem barra de rolagem), cardio padrão em todo treino e peso inicial sugerido por exercício**: (1) a **prévia da ficha do dia** deixa de ter **rolagem interna** — o corpo do deck cresce até caber a ficha inteira (2 linhas de 4 + linha de cardio) e a barra de rolagem interna sumiu; o `.dash-container` do Início continua rolando como último recurso (scrollbar oculta), então o card nunca é cortado. (2) **Todo treino passa a ter Cardio por padrão: 10 minutos de esteira a 3 km/h de velocidade média** — quando a ficha não tem aeróbico configurado, o app exibe e usa o padrão (`DEFAULT_AEROBIC` + `effectiveAerobic`) na prévia do Início, no rodapé do "Minha Ficha", na linha de cardio da Ficha (que passa a contar na conclusão) e no modal de cardio (abre pré-preenchido). O padrão é **de leitura: nada é gravado no banco** — `aerobic` continua `null` até o usuário salvar. (3) Cada exercício ganha um **peso inicial sugerido de acordo com o respectivo nome** ("Sugerido: 30 kg"), mostrado onde a carga aparece — Ficha (tabela e grid), cartões da aba Exercícios e Modo Foco — e no placeholder do campo **Carga** do formulário de exercício; é **dica de tela, nunca grava no `load`**. `system_map.json` → **3.5.74**.

### Added
- **`src-app/src/lib/suggested-load.ts` (novo)** — `getSuggestedLoad({name, muscleGroup, tags})` e `getSuggestedLoadIfMissing(ex)`: regras por palavra-chave sobre o nome normalizado (sem acentos, minúsculo), da mais específica ("supino reto com halteres" → 12 kg cada lado) para a mais genérica ("supino" → 30 kg), com fallback pelo grupo muscular; exercícios de peso do corpo devolvem "Peso do Corpo" (e `null` quando a tag `Peso do Corpo` já resolve a exibição) e cardio devolve `null`. Cobre os 66 nomes do seed e variantes comuns ("stiff", "encolhimento", "barra fixa"…).
- **`core/db/schema.ts` — `DEFAULT_AEROBIC` + `effectiveAerobic()`**: `{ tipo: 'Esteira', vel: '3', tempo: '10' }` e o helper que devolve o aeróbico configurado ou, na ausência dele, o padrão.

### Changed
- **`shell.css`** — `[data-section='dashboard'] .dash-ficha-card .dash-mini-deck__body` (≤1023px): `max-height: none` + `overflow: visible` (o `overflow-y: auto` do deck legado era a barra de rolagem da prévia; `overflow` vai em shorthand porque `overflow-y: visible` com `overflow-x: hidden` computa para `auto`). Novo bloco **"PESO INICIAL SUGERIDO (v4.31.0)"**: `.carga-sugerida` (dica discreta), `.focus-carga-sugerida` (Modo Foco) e `.ficha-overlay .deck-card-sugerida` (no card do grid de 4 colunas a dica ocupa a linha inteira abaixo dos botões — em 360px não disputa largura com o checkbox nem é cortada).
- **`FichaDeck.tsx`** — `cardio = effectiveAerobic(sheet?.aerobic)` e `hasCardio = exercises.length > 0 || Boolean(sheet?.aerobic?.tipo)` (ficha sem exercícios segue exibindo o estado vazio, não uma linha de cardio órfã); a linha de aeróbico passa a detalhar `Esteira · 3 km/h · 10 min` e o rodapé mostra ESTEIRA / `3 km/h · 10 min` (rótulo CARDIO CONFIGURADO inalterado).
- **`FichaFeature.tsx`** — mesmo critério em `hasAe`/`ae`: toda ficha com exercícios exibe a linha de cardio com os valores configurados ou o padrão, e ela **entra na contagem de conclusão** (ex.: 6 itens na ficha B → `0/6`). Dica de peso na tabela (`.vol-text`: `3×10 REPS · Sugerido: 30 kg`) e no grid (`.deck-card-sugerida`).
- **`FocusModal.tsx`** — "Peso inicial sugerido: X" discretamente abaixo de SÉRIES/REPS/CARGA quando o exercício ainda não tem carga definida.
- **`treinos/treinos-helpers.ts`** — `computeDeckStats` usa `effectiveAerobic(aerobic)` quando o deck tem exercícios (rodapé do "Minha Ficha" vira `10min` / `Esteira • 3km/h`); `defaultSheet()` **continua com `aerobic: null`** de propósito (gravar o padrão faria fichas vazias passarem por "prontas" em `getAvailableWorkouts`/`determineNextTreino`).
- **`treinos/TreinosModals.tsx`** — `AerobicoModal` abre pré-preenchido campo a campo (tipo/vel/tempo) com o padrão quando a ficha não tem aeróbico.
- **`treinos/cards.tsx`** — `TreinosGridCard` (aba Exercícios no desktop) mostra a dica de peso ao lado da carga.
- **`treinos/ExercicioFormModal.tsx`** — o placeholder do campo **Carga** vira `Sugerido: 30 kg` conforme o nome digitado (o valor salvo continua sendo o digitado).

### Notas de implementação
- O cardio padrão é **somente de leitura**: `default-data.ts` e `defaultSheet()` seguem com `aerobic: null`. Semear/gravar o padrão marcaria as fichas C–J (vazias) como disponíveis no seletor e como "próximo treino" — regressão coberta por probe (seletor mostra só A e B).
- `queries.ts` (`temCardio` do `determineNextTreino`) e `radar.ts` (minutos de cardio) continuam lendo o valor **cru**: o radar e as métricas da Progresso não mudam.
- A dica de peso é apenas visual: `load` segue vazio até o usuário salvar no formulário.

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (PWA 112 entradas, bundle `index-BSQwK3R9.js`) · probe CDP 20/20 PASS em 440×956 e 360×640: prévia sem rolagem interna (`overflow-y: visible`, `scrollHeight == clientHeight`) com os 5 cards + linha de cardio e sem overflow horizontal; `ESTEIRA` / `3 km/h · 10 min` na prévia, no modal e no rodapé do "Minha Ficha"; "Sugerido: 30 kg" nas 5 linhas da ficha B, no grid e no Modo Foco; placeholder da Carga seguindo "Puxada Frente"; seletor só com A/B; 30 divisões com a skin; nenhum erro de console. Capturas em `%TEMP%/opencode/v4310_*.png`.

## [v4.30.1] - 2026-10-16

**Ajustes no Início (divisões com a skin do usuário, letra da ficha na prévia, sem clã) e Ficha sem "refresh" ao marcar exercício**: (1) as **30 divisões da barra** deixam de ser azuis fixas e **acendem com a skin de barra escolhida pelo usuário** — cor e brilho vêm agora de custom properties (`--bar-skin-fill` / `--bar-skin-glow`) publicadas por `applyBarSkinToDOM`; (2) na **prévia do Início** o 1º widget do rodapé deixa de ser **VOLUME MÉDIO DE CARGA** e passa a mostrar a **letra da ficha do dia** ("TREINO A", rótulo **FICHA DO DIA**) — o **modal seletor continua com o volume**; (3) usuário **sem clã** não exibe mais a linha "SEM CLÃ" (nada é renderizado); (4) na **Ficha**, marcar/desmarcar um exercício **não provoca mais o refresh da página**: o `ui-fade-in` (que também reiniciava todos os `.stagger-item`) era reaplicado a cada check e agora só roda na troca de visualização (tabela/grid) ou de ficha. `system_map.json` → **3.5.73**.

### Added
- **`profile-data.ts` — `applyBarSkinToDOM`**: além do override inline em `.progress-fill/.xp-bar-fill/.cycle-xp-fill`, publica a skin ativa no `<body>` como `--bar-skin-fill` e `--bar-skin-glow`. As 30 divisões do Início são `<span>` re-renderizados pelo React (um `style` inline seria apagado a cada mudança de progresso), então a cor precisa vir por CSS var.

### Changed
- **`shell.css`** — `[data-section='dashboard'] .dash-cycle-segments > span.filled`: `background`/`box-shadow` passam a usar `var(--bar-skin-fill)` / `var(--bar-skin-glow)` (fallback = skin "Padrão", ciano). Qualquer skin desbloqueada (Chama, Gelo, Ouro, Neon, Matrix…) vale para as divisões.
- **`FichaDeck.tsx`** — novo prop `firstStat?: 'volume' | 'sheet'` (padrão `volume`, preserve o modal). Com `sheet`, o 1º widget mostra o escudo + **"TREINO {letra}"** e o rótulo **"FICHA DO DIA"**.
- **`DashboardFeature.tsx`** — a prévia do Início passa `firstStat="sheet"`; a linha **"SEM CLÃ"** saiu do markup (não há campo de clã no perfil ainda — quando houver, renderizar condicionalmente).

### Fixed
- **`FichaFeature.tsx`** — `viewAnimKey` perdeu `checks`: `fadeIn(activeViewRef())` era reexecutado a cada exercício marcado/desmarcado, reaplicando `ui-fade-in` no container e **reiniciando a animação de todos os `.stagger-item`** — era isso que aparecia como um "refresh rápido de toda a página". O fade permanece na troca de visualização e de ficha.

## [v4.30.0] - 2026-10-16

**Início: prévia da ficha do dia no lugar do radar, barra de 30 divisões, saudação contextual e botão de ofensiva**: (1) o card central deixa de ser o **Radar Fit** (que segue **só na Progresso**, intacto) e passa a mostrar a **prévia da ficha do dia** no **mesmo desenho do seletor de treino** — grid Royale de 4 colunas + linha de aeróbico + métricas — **sem o widget MAESTRIA/EMBLEMAS**; logo abaixo vem a **barra de progresso do CICLO em 30 divisões** (cada treino concluído acende uma). (2) O botão **Social** do topo vira **OFENSIVA** (chama + dias de sequência, ref. do usuário); **Notícias** ganha cara de jornal (ícone `newspaper` + badge) e **Menu** um acento próprio; o rótulo **"Missões"** sai da pílula. (3) A linha **"Bem vindo de volta,"** vira **texto contextual**: 1º acesso do dia ao site → saudação; treino de hoje concluído → **"Treino de hoje concluído ✓"**; ao sair do Início e voltar → **"Treino de hoje: FICHA X"**. (4) Em **tela cheia** (botão do app OU app instalado) o Início abre **espaçamento vertical maior** entre topo, prévia+barra e botões inferiores; no modo normal nada muda. A linha inferior (miniatura + TREINAR + CICLO) fica **intacta**. `system_map.json` → **3.5.72**.

### Added
- **`features/dashboard/FichaDeck.tsx` (novo)**: corpo do deck Royale extraído do `SheetSelectorModal` — grid de 4 colunas (`.deck-card`), linha de aeróbico e rodapé de métricas — para o modal e a **prévia do Início** mostrarem exatamente o mesmo desenho. Exporta `DeckCard` e `FichaDeck` (`showMaestria` esconde o widget MAESTRIA/EMBLEMAS; v4.30.1: `firstStat` troca o 1º widget do rodapé por "TREINO A" + rótulo "FICHA DO DIA"). Os ids de gradiente do SVG (elixir) usam `useId()` porque o componente pode estar montado **2× na página** (modal + prévia) — ids duplicados seriam HTML inválido.
- **`shell.css` — seção "INÍCIO — PRÉVIA DA FICHA + BARRA DE 30 DIVISÕES (v4.30.0)"**: `.dash-ficha-card` em **largura total** (o grid de 4 colunas precisa do espaço; a "arena" centralizada do v4.29.0 deixou de fazer sentido), `.dash-cycle-segments > span` (30 divisões flexíveis, `.filled` em azul) e os estilos dos botões `.dash-streak-btn` (chama + valor, coluna) e `.dash-news-btn` (acento vermelho) / `.dash-menu-btn` (acento roxo).
- **`shell.css` — seção "INÍCIO — ESPAÇO VERTICAL EXTRA EM TELA CHEIA (v4.30.0)"**: `html.app-fullscreen` (≤1023px) e `@media (display-mode: standalone/fullscreen)` sobem o `gap` do `.dash-container` para `clamp(18px, 4vh, 40px)` — o gap é o ponto único de ajuste, pois os 3 blocos são filhos diretos do container. `App.tsx` ganha o efeito que aplica/remove a classe `app-fullscreen` no `<html>` a partir de `isFullscreen` (`useCrossBrowserFullscreen`).

### Changed
- **`DashboardFeature.tsx` — card central**: o `RadarChart` + toggle MENSAL/TOTAL saíram do markup e entraram `<FichaDeck showMaestria={false}/>` + `<div class="dash-arena-progress-track dash-cycle-segments">` com `cycle.total` (30) divisões, das quais `cycle.done` recebem `.filled`; a coroa (`#dashBtnSeletorCrown`) e o rodapé do card permanecem. `RadarChart`/`useRadarMode` deixaram de ser importados aqui (o radar segue na Progresso).
- **`DashboardFeature.tsx` — botões do topo**: `#dashBtnSocial` (pessoa → navegava para Social) foi **substituído por `#dashBtnOfensiva`** (chama `local_fire_department` + `#dashStreakValue` = `getStreak(history)`, sem navegação); `#dashBtnNoticias` trocou o ícone `calendar_today` por **`newspaper`**; `#dashBtnMenu` mantém o hambúrguer. O rótulo `.dash-missions__label` ("Missões") foi removido da pílula.
- **`DashboardFeature.tsx` — saudação contextual**: novo estado derivado `greetingText` = `completedToday ? 'Treino de hoje concluído ✓' : (firstAccessToday && !leftDashboard) ? 'Bem vindo de volta,' : 'Treino de hoje: FICHA {suggestion}'`. O "1º acesso do dia" é marcado em `localStorage` (`academia_dash_greeting_date`, leitura no `useState` e escrita em efeito idempotente — sem `setState` síncrono em efeito) e a volta ao Início é detectada pelo evento `sectionchange` (detail !== 'dashboard').
- **`SheetSelectorModal.tsx`**: corpo + rodapé passam a renderizar `<FichaDeck/>` (o `DeckCard` e o rodapé duplicados saíram do arquivo); header (abas A–J, swap, view toggle) e comportamento de troca de ficha inalterados.

### Removed
- **`shell.css` — regras mortas do radar no Início**: `.dash-radar-container { min-height: 0 }` e `.radar-wrapper { max-width: min(280px,30vh) }` (o radar não vive mais aqui) e o override `width: min(88%, 380px)` do card (agora largura total). Os elementos ocultos de compatibilidade do legado (`#dashLiga`, `#dashLevel`, `#dashUserXp`, `#dashProgressSegments`) seguem no markup.

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (PWA 112 entradas).
- Probe CDP headless (440×956) com histórico injetado via a cópia legada (`academia_treino`):
  - **1º acesso do dia** → saudação **"Bem vindo de volta,"**, ofensiva **5**, **5/30** na pílula e **5 de 30** divisões acesas.
  - **Voltar ao Início** (clique em TREINOS → INÍCIO) → **"Treino de hoje: FICHA B"** (a próxima ficha após a última concluída).
  - **Treino de hoje concluído** → **"Treino de hoje concluído ✓"**, 6 divisões acesas.
  - **Ficha vazia** → mensagem "Nenhuma ficha pronta ainda" dentro do card.
  - **Tela cheia** → `gap` do container 9,56 px → **38,24 px** (`app-fullscreen`), sem overflow (956 px).
  - **Desktop (1280×900)** → grid `"banner arena" / "workout arena"` mantido; **modal seletor** abre com grid 5 cards + rodapé VOLUME/MAESTRIA/CARDIO e ids de gradiente únicos.
  - Overlays de Notícias/Missões abrem normalmente (`#dashBtnNoticias` / `#dashBtnMissoes`); **0 erros** de console.

## [v4.29.0] - 2026-10-16

**Topo da aba Início no estilo Clash Royale + correção do 1º gesto do áudio**: (1) o cabeçalho da Home deixa de ser um cartão *full-width* de 200px e vira **duas colunas** — banner do perfil (**menor**, ~60%) com **nome + clã** logo **abaixo** dele, e, à direita (~40%), os botões **Social/Notícias/Menu** com a **MISSÕES** embaixo; as colunas têm a mesma altura e o último bloco de cada uma é empurrado para o pé, então a base de "nome + clã" **alinha com a base da MISSÕES** (como no Clash Royale). A **outline branca** da pílula de Missões foi removida (`border-prestige-gold` não existe no tema TW4 e a cor caía no fallback claro do preflight) e o **radar/barra de XP** passa a ser a "miniatura de arena": **centralizado e com margens laterais** (não ocupa toda a largura). (2) A música **MAIN volta a começar no 1º gesto**: o `resume()` do `AudioContext` resolve **antes** de o estado virar `running`, e a checagem imediata de `ctx.state` abortava o play no 1º toque (a faixa só começava no 2º, quando começava); agora há espera limitada pela virada do estado e o gesto só é desarmado **depois** de a faixa tocar de fato. `system_map.json` → **3.5.71**.

### Changed
- **`DashboardFeature.tsx` — topo em 2 colunas**: novo wrapper `.dash-top-row` com `.dash-top-left` (banner + `.dash-identity` = "Bem vindo de volta," + nome + clã) e `.dash-top-right` (`.dash-top-btns` + `#dashBtnMissoes`). O header antigo **perdeu a classe `dash-header-calling-card`** (as regras legadas do cartão de 200px param de valer) e a **coluna esquerda inteira** (banner + nome/clã) abre o Perfil. Ids preservados: `#dashProfileCard`, `#dashAvatar`, `#dashBtnSocial`, `#dashBtnNoticias`, `#dashBtnMenu`, `#dashBtnMissoes`, `#dashEmblemsValue`, `#dashMissionsProgressFill`, `#dashUserName`.
- **`DashboardFeature.tsx` — Missões**: pílula sem `border border-prestige-gold/40`; o miolo (valor + barra) virou `.dash-missions-body` com a barra **flexível** (`flex: 1`) em vez do `w-32` fixo; coroa em `.dash-missions-hexagon` (26px). Clã exibe o *placeholder* **SEM CLÃ**.
- **`shell.css` — nova seção "INÍCIO — TOPO ESTILO CLASH ROYALE (v4.29.0)"**: `.dash-top-row` (flex, `align-items: stretch`), `.dash-top-left` **60%** / `.dash-top-right` **~40%**, banner `height: clamp(78px,12vh,100px)` com `max-width: none` (cancela o teto de 220px do desenho antigo de *header row* em `dashboard.css` L56), avatar `clamp(56px,16vw,74px)`, `.dash-identity` com `margin-top: auto` (base alinhada à MISSÕES), botões com tamanho fluido `clamp(30px,9.6vw,42px)`, pílula de Missões `border: 0 !important` + `width: 100%` e radar centralizado no mobile (`width: min(88%, 380px)` + margens automáticas). No desktop a linha do topo herda a área `banner` do grid.
- **`audio-engine.ts` — 1º gesto confiável**: novo `waitCtxRunning(ctx, ms)` (espera limitada pelo evento `statechange`); em `startHidden` o `resume()` ganha prazo (`Promise.race`, 1500 ms — um `resume()` fora de gesto pode ficar **pendente para sempre** no Chrome) seguido da espera da virada para `running` (500 ms) **antes** de desistir; `armGestures()` cobre `pointerdown`, `touchstart`, `mousedown`, `keydown` e `click`, e o handler **só desarma quando `playing` é verdadeiro** (antes desarmava por "hiddenReady": um gesto cujo `resume()` ainda não tinha virado `running` removia os listeners e a MAIN não começava).

### Removed
- **`shell.css` — regras mortas do header antigo**: o bloco desktop que dava `grid-area: banner` ao `.dash-header-calling-card.dash-profile-banner-card` e o ajuste `min-height: clamp(140px, 25vh, 200px)`.

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (PWA 112 entradas).
- Probe CDP headless (440×956, `%TEMP%\opencode\probe429.mjs`): **21/21 PASS**.
  - **(Áudio)** perfil NOVO (autoplay bloqueado): sem gesto a MAIN fica **pré-decodificada** (`decodeAudioData` 7.377 KB ok) e **não** inicia (`AudioBufferSourceNode.start: 0`, ctx `suspended`); com **um único** gesto (keydown via `Input.dispatchKeyEvent`, trusted) o `AudioBufferSourceNode.start` dispara em **274 ms**, ctx `running`, evento `main:playing` e **0 `<audio>` tocando** (segue tudo por Web Audio — fora da notificação). O teste **simula a corrida real** (o `resume()` resolve 120 ms antes de o estado virar `running`), que era exatamente o caso em que o 1º toque falhava.
  - **(Layout)** `.dash-top-row` em 2 colunas (**60% / 37,1%**), banner **100px** de altura e **247px = largura da coluna**, nome+clã **abaixo** do banner e com a **base igual à da MISSÕES** (221 vs 221), pílula de Missões com `border-width: 0`, os 3 botões dentro da coluna direita, radar centralizado (363px num container de 440 → ~39px de margem de cada lado) e **sem overflow horizontal**.

## [v4.28.0] - 2026-10-16

**Lote de 5 ajustes (latência do áudio / player opt-in / ícone Social / Treinos / splash)**: (1) as faixas ocultas **MAIN, Missões e RESULT** voltam a começar **no 1º toque** — o gesto de autoplay passa a ser armado **já no boot** (um `resume()` pedido **fora** de um gesto pode ficar pendente no Chrome, e a trilha só começava quando outra ação — abrir/fechar Missões etc. — redisparava o play) e o módulo legado **não cria mais** um `<audio preload="auto">` de `MAIN.mp3` (7,2 MB) concorrendo com o `fetch`/decode do motor; (2) o **player flutuante vira opt-in**: novo interruptor **"Mostrar Player"** (Configurações → Áudio e Música → *Player de Música*), **desligado por padrão**, e ao ligar os padrões passam a ser os da **referência fixada** (**Fixo • Esquerda centro • Só após tocar • 5s • Gaveta Ligada • 3px • 5,5%**); (3) o ícone da aba **Social** passa a ser o **mesmo de "Liga"** (espadas cruzadas / *Swords*); (4) na aba **Treinos**, **MONTAR FICHA → MINHA FICHA**; (5) com **imagem personalizada** o logo **EVO FIT / WORKOUT TRACKER** volta a ficar **centralizado** (como no splash padrão), com a barra de progresso fixa no rodapé. `system_map.json` → **3.5.70**.

### Added
- **`player-prefs.ts` — `academia_pref_player_enabled`**: novas `getPlayerEnabled()` / `setPlayerEnabled()` (valor `'on' | 'off'`, **padrão `'off'`** — widget oculto).
- **`SettingsFeature.tsx` — interruptor "Mostrar Player"**: bloco `set-toggles`/`set-switch` no topo do card *Player de Música*, ligado a `changePlayerEnabled`; com o widget desligado o card mostra **só o interruptor** e o badge vira **"Desativado"** (os controles detalhados só aparecem com o player ligado).

### Changed
- **`player-prefs.ts` — novos padrões (referência fixada)**: `getPlayerMode` → **`fixed`**; `getPlayerPos` → **`tc`** (Esquerda centro); `getPlayerPersist` → **`timed`** (Só após tocar); `getPlayerHideSecs` → **5**; `getPlayerDrawer` → **`on`** (Ligada); `getDrawerThickness` → **3**; `getDrawerVpHeight` → **5,5**. Valores antigos válidos continuam valendo — só o *default* mudou. **Fix**: `getDrawerThickness`/`getDrawerVpHeight` agora tratam `null` explicitamente (`Number(null) === 0` caía no ramo "finito" e a altura saía sempre **0,5**, ignorando o padrão).
- **`FloatingMiniPlayer.tsx`** — gate `if (!getPlayerEnabled()) return null;` (widget some por completo quando desligado); cabeçalho documenta o opt-in e o modo **Fixo** como padrão. A música **não** é afetada (segue "Tocar Música").
- **`audio-engine.ts` — latência/autoplay**: `initAudioEngine` chama `armGestures()` já no boot (com a trilha), e o handler de gesto só redispara `resumeCurrent()` sob `if (!playing)` — com o gesto armado no boot, sem essa guarda o 1º toque reiniciava a faixa que já estava tocando.
- **`background-music.ts` — fim do download concorrente**: `initBackgroundMusic` sai **antes** de `getAudio()` quando o motor tomou a posse (`playbackClaimed`), e `setMusicVolume` só mexe no elemento legado sem posse — evita criar o `<audio preload="auto">` de `MAIN.mp3` (7,2 MB) em paralelo ao `fetch`/decode do motor no boot.
- **`BottomNav.tsx` / `nav-section-items.tsx` — ícone Social**: escudo com 3 pessoas → **espadas cruzadas** (paths do *Swords*/Lucide v0.546, *stroke* `currentColor`, viewBox 24), o **mesmo ícone de "Liga"** dentro da aba Social. `Diretrizes/Ícones.md` (seção Navegação) atualizado.
- **`TreinosFeature.tsx` / `FichaFeature.tsx` — rótulo**: aba **MINHA FICHA** (antes MONTAR FICHA — `data-tab="montar"`, id `tabBtnMontar` e chave interna `montar` mantidos); texto da ficha vazia ("Vá em Minha Ficha…") e descrição da seção no `nav-section-items` atualizados.
- **`index.html` (splash com imagem personalizada)**: `.splash-screen--custom .splash-screen__content` passa a `justify-content: center` (sem `padding-top`/gradiente de topo) → **logo centralizado** como no splash padrão; `.splash-screen__bar-wrap` vira `position: absolute` no rodapé (barra de progresso segue colada embaixo).

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (PWA 112 entradas).
- Probe CDP headless (440×956, `%TEMP%\opencode\probe3.mjs`): **26/26 PASS**.
  - **(T-A)** boot pré-decodifica MAIN/Missões **sem gesto** (`AudioContext:1`, `decodeAudioData:2`) e **sem** `<audio>` legado de `MAIN.mp3` (lista vazia — prova o fim do download concorrente); após um **gesto real via `Input.dispatchMouseEvent`** (trusted), `AudioBufferSourceNode.start` dispara em **457 ms** (buffer já pronto) e **0 `<audio>` tocando** (segue tudo por Web Audio).
  - **(T-B)** com **localStorage limpo** o interruptor **"Mostrar Player"** nasce **desmarcado**, os controles detalhados ficam ocultos e o badge mostra **"Desativado"**; ao ligar, os selecionados são **Fixo / Esquerda centro / Só após tocar** com **Tempo visível 5s**, **Gaveta Ligada**, **Espessura 3px** e **Altura 5,5%**; o widget `.fmp` **não** existe com o player off e **existe** com o player on.
  - **(T-C)** `#bnavSocial` traz as **duas `polyline`** das espadas (`14.5 17.5 …` e `14.5 6.5 …`), **6 `<line>`** e **nenhum `path`** (escudo removido); conferido também **visualmente** (o ícone bate com o de "LIGA" na linha de sub-abas de Social).
  - **(T-D)** abas da seção Treinos = **`["PERSONALIZAR","MINHA FICHA"]`** (sem "MONTAR FICHA").
  - **(T-E)** splash custom: `logoCY = 478` de `vh 956` (**centralizado**), `.splash-screen__bar-wrap` com `position:absolute` e `bottom = 956` (rodapé), saudação com `display:none`.
- Strings no bundle (`dist/assets/*.js`): `MINHA FICHA`/`Mostrar Player` presentes; `MONTAR FICHA` e o `path` do escudo (`M12 2.4l7.2`) ausentes.



**Lote de 6 ajustes (áudio / posições / gaveta / ícone Social / Treinos / splash)**: (1) as faixas ocultas **MAIN, Missões e RESULT** passam a ser **pré-decodificadas** — o `decodeAudioData` começa **antes** do `resume()` do `AudioContext` (Missões no boot, RESULT ao iniciar o treino) — então **não "demoram mais para aparecer"**; (2) nas posições do player, **"Topo centro" → "Esquerda centro"** e **"Base centro" → "Direita centro"** (âncoras verticalmente centradas nas bordas esquerda/direita); (3) no modo **Flexível** a barra da gaveta passa a nascer na **extremidade mais próxima da última posição** do painel (era um **closure obsoleto** no clique-fora); (4) o ícone da aba **Social** vira um **escudo com 3 pessoas** (estilo Clash Royale, adaptado ao stroke do projeto); (5) na aba **Treinos**, a aba **Exercícios → Personalizar** e a sub-aba **Itens Mágicos → Cartões**; (6) com **imagem personalizada** na tela de carregamento, o texto **"EVO FIT / WORKOUT TRACKER"** volta a aparecer. `system_map.json` → 3.5.69.

### Changed
- **`audio-engine.ts` — pré-decodificação das faixas ocultas**: `startHidden` dispara `loadHiddenBuffer()` **antes** de aguardar `AudioContext.resume()` (o decode não exige gesto) e mantém o decode em 2º plano quando o contexto segue suspenso (`void bufPromise; return false;`). `initAudioEngine` pré-decodifica **Missões** no boot e o listener `academia:workout-started` pré-decodifica **RESULT** (só toca na conclusão). Cabeçalho documenta o v4.27.
- **`player-prefs.ts` — rótulos das posições**: `tc` = **Esquerda centro** e `bc` = **Direita centro** (antes Topo centro / Base centro).
- **`FloatingMiniPlayer.tsx` — posições + gaveta**: `anchorSide` (`tc`→esquerda, `bc`→direita) e `pillStyleFor` (`tc`/`bc` = `top:50%` + `translateY(-50%)` na borda) atualizados; a barra fixa da gaveta centraliza na vertical para `tc`/`bc`; `flexStart` cobre `top:50%`. **Fix**: `drawerPanelPos` passa a ser lido de uma **ref** (`drawerPanelPosRef`, sincronizada por efeito) no `setDrawer(false)` — antes o listener de clique-fora, registrado ao abrir a gaveta, capturava o state `null` e a barra **nunca** ia para a extremidade mais próxima.
- **`BottomNav.tsx` / `nav-section-items.tsx` — ícone Social**: balão de chat → **escudo com 3 pessoas** (stroke `currentColor`, viewBox 24/24). `Diretrizes/Ícones.md` (biblioteca, seção "Navegação") atualizado no mesmo commit.
- **`TreinosFeature.tsx` / `CustomizacaoTabs.tsx` — rótulos**: aba **PERSONALIZAR** (antes EXERCÍCIOS — chave interna `exercicios`, `data-tab` e ids mantidos) e sub-aba/`title`/título de seção **Cartões** (antes Itens Mágicos — chave `itens-magicos` mantida).
- **`index.html` (splash com imagem personalizada)**: `.splash-screen--custom` não oculta mais `.splash-screen__logo` (apenas `.splash-screen__user`); o conteúdo usa `justify-content: space-between` (logo no topo, barra no rodapé), `padding-top` com safe-area e um gradiente de topo para legibilidade do texto sobre a imagem.

### Verificado
- `npx tsc -b` exit 0 · `npx oxlint src` exit 0 (0 warnings) · `npm run build` OK.
- Probe CDP headless (440×956, `%TEMP%\opencode\probe2.mjs`): **18/18 PASS**.
  - **(T-A)** MAIN/Missões **pré-decodificados no boot sem gesto** (`AudioContext:1`, `decodeAudioData:2`, `HTMLMediaElement.play:0`) e MAIN tocando por Web Audio sem `<audio>` audível — resolve a "demora para aparecer".
  - **(T-B)** UI mostra as 6 posições com **"Esquerda centro"** (2ª) e **"Direita centro"** (5ª) e sem as antigas; pastilha **fixa** `tc`→borda esquerda + verticalmente centrada e `bc`→borda direita + centrada; barra **fixa da gaveta** idem (`top:476` de `vh:956`).
  - **(T-C)** gaveta **Flexível** aberta, painel arrastado para a esquerda + clique fora → barra nasce à **esquerda** (`--right` → `--left`, `academia_floating_player_pos_v1` = `{x:8,…}`) — prova o fix do closure.
  - **(T-E)** aba principal **PERSONALIZAR** (`["PERSONALIZAR","MONTAR FICHA"]`) + sub-aba/título **Cartões**.
  - **(T-F)** splash custom: logo **EVO FIT / WORKOUT TRACKER** visível (`display:flex`, `top:58`), saudação oculta e `background-image` aplicado.
- Strings no bundle (`dist/assets/*.js`): `Esquerda centro`/`Direita centro`/`PERSONALIZAR`/`Cartões` presentes; `Topo centro`/`Base centro`/`Itens Mágicos` ausentes.
- Ícone Social conferido visualmente (`%TEMP%\opencode\social-icon-check.png`, 22px/96px) — escudo com 3 pessoas legível em ambos os tamanhos.

## [v4.26.0] - 2026-10-16

**Lote de 6 ajustes de UI/áudio + renome do produto para "EVO FIT"**: (1) as faixas **MAIN**, **Revenger Phoenix (Missões)** e **RESULT** passam a tocar por **Web Audio API** (`AudioBufferSourceNode`) em vez de `<audio>` — **não aparecem mais no player de notificação de mídia** do Chrome/Android (sem elemento de mídia não há notificação); a faixa de treino (**Black Panther**) e uploads/YouTube seguem no `<audio>` e aparecem normalmente; (2) o nome do produto passa de **Academia** para **EVO FIT** (título, manifest PWA, rodapé da sidebar, tela de bloqueio, Configurações, backup, compartilhamento, passkey e álbum musical); (3) o botão de **Modo Foco** deixa de se destacar (mesma cor dos botões Tabela/Grid **não selecionados**); (4) a aba **Treinos** abre em **MONTAR FICHA** (antes Exercícios), o botão **"+" de novo exercício** fica neutro (sem laranja) e **no mobile** o seletor de visualização é **removido** (fixa em **Modo Coleção**; no desktop os dois modos continuam) e os filtros passam do roxo para o **preto AMOLED**; (5) na aba **Início** (sem tela cheia) os botões **selecionar treino / TREINAR / ciclo** não caem mais abaixo da dobra em telas baixas (o layout comprime e rola); (6) a **barra da gaveta** do player vai para a **extremidade mais próxima da última posição** do player no modo **Flexível**, e no modo **Fixo** as âncoras **topo/base + esquerda/direita** passam a alterar de fato a posição. `system_map.json` → 3.5.68.

### Added
- **`audio-engine.ts` — motor Web Audio para as faixas ocultas**: `getAudioCtx`, `applyGain`, `loadHiddenBuffer` (decode com cache em memória de `AudioBuffer`), `startHidden`/`stopHiddenSource`/`pauseHidden`/`hiddenEnded`, `startHiddenViaElement` (fallback p/ `<audio>` quando não há `AudioContext`/decode falha) e `isHiddenSite`. `MS_HIDDEN_SITES` (`main`/`missions`/`result`) mantém `MediaSession.metadata` nulo.

### Changed
- **`audio-engine.ts`** — `playSite`, `playQueueIndex` (item `site`), `stopUserQueue`, `togglePlayback`, `armGestures` e o handler `academia:music-changed` foram religados ao motor Web Audio; comentário de cabeçalho documenta a estratégia (v4.25.x).
- **Renome do produto → "EVO FIT"** — `index.html` (`<title>` "Fichas de Treino — EVO FIT"), `vite.config.ts` (manifest `name`/`short_name`), `DesktopSidebar.tsx`, `LockScreen.tsx`, `ScreensCustomizationPanel.tsx`, `SettingsFeature.tsx`, `backup.ts`, `LigasFeature.tsx`, `lock-store.ts` (passkey `rp.name`) e `audio-engine.ts` (álbum + comentário).
- **`shell.css` — modo foco neutro** — `.view-btn--focus` fica igual ao `.view-btn` **não selecionado** (`color: var(--text-secondary)`, fundo transparente, sem shadow); hover neutro.
- **`treinos-store.ts`** — `mainTab` padrão `'montar'` (aba **MONTAR FICHA**).
- **`TreinosFeature.tsx`** — hook `useIsMobile` (`matchMedia('(max-width:767px)')`) + `effectiveExView`; o seletor de visualização some no mobile e a aba Exercícios força **Modo Coleção**.
- **`shell.css` — aba Exercícios** — `.btn-novo-ex-min` neutro (mesma paleta do botão de filtros, sem o laranja) e overrides **AMOLED** dos `.cr-dropdown-*` (fundo `rgb(10,10,10)`).
- **`shell.css` — Início responsivo** — overrides em `.dash-container` (`overflow-y:auto`), banner (`min-height:clamp(140px,25vh,200px)`), radar (`max-width:min(280px,30vh)`), paddings da arena e `margin-top` do card sugerido (`clamp(10px,3vh,36px)`).
- **`FloatingMiniPlayer.tsx` — barra da gaveta** — modo **Flexível**: lado e posição vertical mais próximos da última posição arrastada do player (`academia_floating_player_pos_v1`); modo **Fixo**: respeita a âncora completa (topo/base + esquerda/direita); fechar a gaveta (`setDrawer(false)`) persiste `drawerPanelPos` em `dragPos`.
- **`SettingsFeature.tsx`** — descrições das opções de **posição** e **gaveta** atualizadas.

### Verificado
- `npx tsc -b` 0 · `npx oxlint src` 0 warnings · `npm run build` OK (`dist/manifest.webmanifest` = `{"name":"EVO FIT Workout Tracker","short_name":"EVO FIT"}`).
- Probe CDP headless (440×956): **17/17 PASS** — título/manifest **EVO FIT**; aba padrão **MONTAR FICHA**; mobile sem seletor de visualização + `exercicios-grid collection-grid`; "+" neutro; filtro AMOLED (`rgb(10,10,10)`); Início com **TREINAR/CICLO/selecionar** dentro da viewport; barra da gaveta (flex esq/dir; fixo tl/tr/bl/br); MAIN via Web Audio (`acCreated:1, decoded:1, elementPlayCalls:0`).
- Verificação extra instrumentando `AudioContext`/`decodeAudioData`/`AudioBufferSourceNode.start`: **MAIN, MISSIONS e RESULT** → `AudioContext` criado + decode + `source.start`, com **0** chamadas de `HTMLMediaElement.play()`; **WORKOUT** (Black Panther) → **1** `play()` no `<audio>` (segue aparecendo na notificação).
- **Modo Foco**: `.view-btn--focus` idêntico ao Tabela não selecionado (`rgb(204,204,204)`, fundo transparente, `box-shadow: none`).
- **Desktop 1280px**: seletor de visualização presente (Grid + Coleção); **mobile 390/500px**: removido.

## [v4.25.0] - 2026-10-16

**Botão do Início renomeado para "TREINAR" + autoscroll ao abrir a Ficha (pula o hero e aterrissa em "Progresso do treino")**: na aba **Início**, o CTA do card da ficha sugerida deixa de ser **"PRÓXIMO PASSO"** e passa a ser **"TREINAR"** (mesmo `id` `dashBtnStartText`, nenhum comportamento alterado). Ao abrir a interface de treino (overlay da Ficha), o scroller **`.ficha-overlay__scroll`** agora rola automaticamente até **"Progresso do treino"** (`.progress-wrapper`), deixando o **hero acima fora de vista** e os **exercícios em tela** — conforme a imagem de referência. O scroll roda em **passes curtos** (120/500/900/1500 ms, só corrige se o desvio > 2px) porque o conteúdo acima (timer/sugestão) assenta depois do start. `system_map.json` → 3.5.67.

### Changed
- **`DashboardFeature.tsx`** — rótulo do botão do card de ficha: `PRÓXIMO PASSO` → **`TREINAR`**; comentários/doc-string atualizados.
- **`FichaFeature.tsx`** — nova prop opcional **`open`**; `progressRef` no `.progress-wrapper` e efeito de **autoscroll** (`scrollTo` no `.ficha-overlay__scroll`) ao abrir, em passes de correção.
- **`App.tsx`** — passa **`open={isFichaOverlayOpen}`** para `FichaFeature`; comentário do `handleOpenFicha` atualizado.
- **Comentários** — `audio-engine.ts`, `dashboard.css`, `ficha-overlay.css` e `7-nav-icons.css` deixam de citar "PRÓXIMO PASSO" e passam a citar "TREINAR".

### Verificado
- `npx tsc --noEmit` 0 · `npx oxlint` 0 · `npx vite build` OK.
- Probe CDP (mobile 430×932): **8/8 PASS** — botão do Início com texto "TREINAR"; abrir a Ficha rola ~610px; **"Progresso do treino" no topo (delta 0px)**; hero fora de vista (topo negativo); primeiro exercício visível; fechar e reabrir volta a rolar. Screenshot conferido (`v425_ficha.png`).

## [v4.24.1] - 2026-10-15

**Altura da barra da gaveta com mínimo em 0,5% (antes 40%, exagerado) + restaurar as opções de Visibilidade do player ("Sempre ativo" / "Só após tocar") em todos os modos**: o slider **Altura da barra** passa a ir de **0,5% a 100%** (passo de **0,5%**, padrão **0,5% = barra discreta**) — antes o mínimo era 40%, deixando a barra enorme. O bloco **Visibilidade** estava preso dentro do modo **Fixo** e por isso sumia nos outros modos; agora aparece **sempre** (Flexível, Fixo e Gaveta), com as duas opções **Sempre ativo** e **Só após tocar** (o player/barra some após N s — padrão **7s** — da última troca de música, e reaparece ao começar outra). O **auto-ocultar** passou a valer também para o **Flexível** e para a **barra da gaveta** (antes só o Fixo). O seletor **Posição na tela** agora aparece quando o modo é **Fixo** ou quando a **Gaveta** está ligada (a barra nasce do lado da âncora). `system_map.json` → 3.5.66.

### Changed
- **`player-prefs.ts`** — `getDrawerVpHeight`/`setDrawerVpHeight`: faixa **0,5–100%** com passo **0,5** (arredonda para meio ponto) e **padrão 0,5**; antes 40–100% e padrão 62.
- **`SettingsFeature.tsx`** — slider de **Altura** com `min=0,5 / max=100 / step=0,5` e nota atualizada; bloco **Visibilidade** movido para **fora** de `{playerMode === 'fixed' && ...}` (vale para todos os modos); label **"Só após tocar"** (antes "Só após trocar"); **Posição na tela** exibida quando `playerMode === 'fixed' || drawerOn`.
- **`FloatingMiniPlayer.tsx`** — o timer de **"Só após tocar"** roda sempre (`persist === 'timed'`), ocultando **Fixo, Flexível e a barra da gaveta**; `flexVisible` e o branch da gaveta respeitam `timedOut`.

### Verificado
- `npx tsc --noEmit` 0 · `npx oxlint` 0 · `npx vite build` OK.
- Probe CDP (Configurações → Áudio e Música): **20/20 PASS** — card presente; "Visibilidade" com "Sempre ativo"/"Só após tocar" em Flexível; "Posição na tela" oculta em Flexível sem gaveta e visível com a gaveta ligada; bloco "Gaveta (barra deslizante)"; sliders de espessura (3–14) e altura (`min=0.5, step=0.5, value=0.5`); barra renderiza com altura pequena; **"Só após tocar"** oculta o Flexível e a barra da gaveta após 3s e mostra no início. Screenshots conferidos.

## [v4.24.0] - 2026-10-15

**Player unificado (Flexível = pastilha do Fixo, arrastável) + nova GAVETA (barra deslizante) + Retroceder só da 2ª música em diante + botão FOCO suavizado**: o modo **Flexível** passa a usar o **mesmo design do Fixo** (mesma cor/borda/accent roxo, label "TOCANDO AGORA", mini-controles) — a única diferença é que o Flexível é **arrastável** e tem "×"; o modo **Fixo** permanece **inalterado** (fixo na âncora, sem arrasto). Nasce a **GAVETA** (`Configurações → Áudio e Música → Gaveta`), uma **apresentação que convive com ambos os modos** (eles só definem a posição da âncora): uma **barra accent fina na borda da tela** (esquerda/direita conforme a âncora) que, ao ser **deslizada para dentro** (ou ativada por teclado), abre o **mesmo player minimizado** ancorado à barra — no Flexível o painel fica livre para arrastar depois; **clicar fora** recolhe. Espessura (3–14px, padrão 5) e altura (40–100% da viewport, padrão 62 ≈ altura do player fixo) configuráveis. **Retroceder** some na **1ª música** e aparece **da 2ª em diante** (`canPrev` do `audio-engine`, aplicado na pastilha e na barra do treino). Botão **FOCO** suavizado para a paleta accent (antes vermelho destacado). `system_map.json` → 3.5.65.

### Added
- **GAVETA (barra deslizante)** — `player-prefs.ts` ganha `academia_pref_player_drawer` (on/off), `_drawer_thick` (3–14px, padrão 5) e `_drawer_vp` (40–100%, padrão 62); `FloatingMiniPlayer.tsx` renderiza a barra accent na borda e o painel ancorado; `SettingsFeature.tsx` ganha toggle + 2 sliders no card "Player de Música". Convive com Flexível/Fixo (que definem só a âncora).
- **`music.css`** — `.fmp-drawer-bar` (barra accent com alça de toque), `.fmp--from-right` (accent à direita quando a barra está à direita).

### Changed
- **Design unificado** — `.fmp` (Flexível) passa a ter o MESMO visual do `.fmp-pill` (Fixo); CSS órfão `.fmp-pill*` removido; ambos reusam o subcomponente `Pill`. Fixo marcado `fmp--fixed`, gaveta `fmp--drawer`.
- **`audio-engine.ts`** — `MusicState` expõe `queueIndex`/`queueLength`/`canPrev` (emitState + getMusicState); "Retroceder" (`SkipBack`) só renderiza quando `canPrev` (fila do usuário com >1 faixa e índice >0). Aplicado em `FloatingMiniPlayer` e `WorkoutNowPlayingBar`.
- **`shell.css`** — `.view-btn--focus` (FOCO) troca o destaque vermelho pela paleta accent roxa dos demais `.view-btn`.

### Fixed
- **`startBarDrag`** — drag da barra da gaveta usa listeners no `window` (não no `el`) e não depende de `setPointerCapture`, para o pointer não "escapar" da barra estreita antes do threshold.

### Verificado
- `npx tsc --noEmit` 0 · `npx oxlint` 0 · `npx vite build` OK.
- Probe CDP (mobile 430×932): **16/16 PASS** — Retroceder oculto na 1ª / visível na 2ª; fixo usa `.fmp fmp--fixed` com borda 4px; barra da gaveta à direita, fechada, deslize abre, clique fora recolhe; barra do treino sem Retroceder na 1ª. Screenshots conferidos visualmente (flex/fixed/gaveta fechada/gaveta aberta).

## [v4.23.0] - 2026-10-15

**Legado isolado em `Legacy/` + abas Músicas, Missões e Notícias adaptadas ao DESKTOP (mobile inalterado)**: a versão legada **Vanilla JS** sai da raiz e passa a viver inteira em **`Legacy/`** (`treino.html`, `noticias.html`, `JS/`, `style/`, `componentes/`, `Assets/`, `sw.js`, `manifest.json`, `cache/`), funcionando por caminhos relativos sem alteração de código — `www/` (Capacitor) permanece na raiz. As 3 abas ganham **layout desktop** exclusivo a partir de **`@media (min-width: 1024px)`**, mantendo o mobile **100% intacto**: em telas largas os overlays viram **janela centralizada** (Músicas e Notícias `1180×844`, Missões `1140×844`, cantos `20px`, backdrop escurecido/blur) com conteúdo em **grades multi-coluna** (missões diárias 3 col, notícias 3 col com a matéria principal em linha cheia, atualizações 2 col, playlists/escolhas rápidas `auto-fill`), **header sticky** nas janelas de Notícias e **nav inferior virando abas** em Músicas. `Diretrizes/README.md` formaliza a **diretriz de progresso** (relatar prazo e andamento a cada passo) e a nova estrutura `Legacy/`. `system_map.json` → 3.5.64.

### Added
- **`Legacy/`** (novo diretório) — app vanilla completa movida da raiz: `treino.html`, `noticias.html`, `JS/`, `style/`, `componentes/`, `Assets/`, `sw.js`, `manifest.json`, `cache/`. Continua funcionando via caminhos relativos (smoke test HTTP 12/12 = 200; verificador offline: 200 refs, 8 gaps pré-existentes de GIFs que nunca existiram no repo).
- **`src-app/src/features/music/music.css`** — bloco **`v4.23.0-desktop`** (em `@media (min-width:1024px)`): `.mu-overlay` vira janela `min(1180px, 100vw−96px) × min(880px, 100vh−56px)` via `position:fixed + inset:0 + margin:auto` (anel `box-shadow 100vmax` escurece o fundo sem tocar no JS), header/page com respiro, `.mu-quick-grid`/`.mu-pl-grid` em `repeat(auto-fill, minmax(...))`, `.mu-nav` virando abas centralizadas (`min-width:150px`, `border:1px solid transparent` p/ evitar jump), `.mu-fab` em `absolute` e modais centralizados.
- **`src-app/src/features/dashboard/missions-overlay.css`** — bloco desktop: backdrop com dim, `.ms-shell` `1140×844`, header/main com padding `!important`, `#ms-content-daily`/`#ms-content-weekly` em **grid 3 colunas** (`:first-child`/`:last-child` em `1 / -1`), GUIAS mantendo flex/card único, hover lift e abas maiores.
- **`src-app/src/features/news/news-overlay.css`** — bloco desktop: overlay vira backdrop com `blur(12px)`; `#news-main-view` vira **janela `1180×844`** centralizada (`position:fixed !important + inset:0 + margin:auto` — vence a classe utility `relative` e o `display:block` preso pelo style inline do JSX; `height` com `!important` por causa da regra base `height:auto`), conteúdo full-width, header `sticky`, `.tab-content.active#noticias` em **grid 3 col** (hero `1 / -1`), `#atualizacoes` em **grid 2 col**, `:has(.btn-show-more)` em linha cheia, `.detail-view` como janela `1180×844` com header sticky.

### Changed
- **`src-app/src/features/dashboard/MissionsOverlay.tsx`** — único hook TSX novo: `className="ms-shell"` no container do overlay (âncora para o bloco desktop).
- **`Diretrizes/README.md`** — regra 7 reescrita como **"DIRETRIZ OBRIGATÓRIA — informe prazo e progresso de conclusão"** (relatar a cada passo, com exemplo de 7 passos); árvore de diretórios refletindo `src-app/` + `Legacy/`; nota da reorganização de 2026-10-15; paths de JS/CSS modular → `Legacy/...`; seção Capacitor apontando `Legacy/treino.html`; "Como Adicionar Novas Páginas" ajustada; tabela "Regras Absolutas" com nova linha da diretriz de progresso + linha "versão atual vs. legado".
- **`Diretrizes/system_map.json`** — `version` **3.5.63 → 3.5.64** (`last_updated: 2026-10-15`); `entry_points`/`styling_manifest` atualizados com paths `Legacy/`; novo bloco sobre os blocos desktop das 3 abas.

### Verification
- `npx tsc -b` → 0 erros; `npx oxlint src` → 0 avisos; `npx vite build` → OK (56.34s).
- **CDP probe desktop/mobile (`probe_desktop_tabs.js`, 32/32 PASS)** — Chrome headless `:9222` + `vite preview` `:4173` (perfil limpo): desktop **1440×900** → Músicas janela `1180×844` centralizada, nav em abas, grades ≥4 col, FAB `absolute`, fecha ok; Missões `1140×844`, diárias em grid 3 col, cabeçalho `1/-1`, GUIAS card único; Notícias `1180×844`, header sticky, `#noticias` grid 3 col com hero `1/-1`, troca p/ `#atualizacoes` grid 2 col (`#noticias` → `none`), detail view `1180×844` com header sticky. Mobile **430×932** → Músicas tela cheia sem janela (grade 3 col, nav sem centralizar), Notícias coluna única `block` com `max-w-lg`, Missões flex 420px — **inalterados**. **0 erros de console**.
- Encerrados os processos de teste (portas `4173`, `9222`, `8099` liberadas).

## [v4.22.0] - 2026-10-15

**Biblioteca ordenada + compartilhamento de imagem real + Coleção virou FOCO + senha liberada durante o treino + player fixo/flexível**: a **Biblioteca** ganha barra de ordenação com **Alfabético, Mais recente, Mais tocado e Maior duração** — 1 toque aplica a ordem, **2 toques invertem** (A→Z/Z→A, nova/antiga, mais/menos tocado, maior/menor duração), persistindo em `academia_music_sort_v1`; uploads agora expõem **duração** (sondada no envio via `probeAudioDuration`) e **contador de reproduções** (`registerPlay`), exibidos na linha. As imagens de compartilhamento trocam **"ACADEMIA PRO" por "EVO FIT"** e o card de treino passa a ter **2 colunas** com **Exercícios, KG totais, Ofensiva e Duração** (VOL. MÉDIO saiu). O **compartilhamento de imagem virou real**: o card é **pré-renderizado ao abrir o modal** (a Web Share API é chamada dentro do gesto, sem html2canvas no meio — era por isso que Android/Windows caíam sempre no fallback) e o fluxo tenta **arquivo na folha nativa → folha com texto → clipboard/download**, nunca disparando fallback quando o usuário **fecha** a folha. Na **Ficha**, o modo de visualização **"Coleção" (deck) foi removido** e o 3º slot do seletor virou o **botão FOCO** (o FAB flutuante saiu — sobreponha a barra "tocando agora"). **Senha durante o treino**: com treino ativo (`workout_start_time`) o app **não trava no boot nem por inatividade** — exceção única que expira quando o treino encerra. O **player de música** ganha **modo Fixo** (pastilha minimizada no estilo do contador de duração do treino, na posição escolhida em Configurações, sempre visível ou só **7s** após a troca de música — configurável 3–30) ao lado do **Flexível** (o painel arrastável atual). Na aba **Início** da interface de músicas, clicar numa música monta uma **fila oculta** com a lista inteira — **acabou, a próxima começa** (site e uploads). Na **notificação do Android**, **MAIN, RESULT e Revenger Phoenix ficam de fora** (metadata nulo) — só uploads e Black Panther aparecem. `system_map.json` → 3.5.63.

### Added
- **`src-app/src/features/music/MusicOverlay.tsx`** — barra **`.mu-sortbar`** na Biblioteca com os 4 `SORT_OPTIONS` (`Alfabético/Mais recente/Mais tocado/Maior duração`), estado `SortPref` (`{key,dir}`) persistido em `academia_music_sort_v1`, `toggleSort` (2º toque inverte) e `sortTracks()` aplicado à lista; linha de música mostra **duração** (`formatDur`) e **`playCount×`**. Aba **Início**: `homeQueue` (faixas do site + uploads, rotacionada a partir do clicado) + `playFromHome()` — `SiteTrackRow`/`UploadRow` aceitam `onPlay` opcional e aqui todos iniciam a fila oculta (auto-avanço no fim via `context==='workout-user'`).
- **`src-app/src/features/music/media-store.ts`** — `UploadTrack.durationSec?`/`playCount?`; `probeAudioDuration(file)` sonda a duração real no envio; ação **`registerPlay(trackId)`** incrementa e persiste as reproduções.
- **`src-app/src/features/music/player-prefs.ts`** (novo) — preferências do miniplayer: **`getPlayerMode/setPlayerMode`** (`flex`|`fixed`), **posição** (6 âncoras `PLAYER_POSITIONS`), **visibilidade** (`always`|`timed`), **segundos** (`getPlayerHideSecs`, default **7**, faixa 3–60 — `Number(null)===0` tratado para não virar 3) e evento **`academia:player-prefs-changed`**.
- **`src-app/src/features/music/FloatingMiniPlayer.tsx`** — **modo Fixo**: pastilha `.fmp-pill` (ícone pulsante + "Tocando agora" + título + retroceder/pausar/avançar) ancorada na posição das prefs, com auto-ocultação `timed` contada a partir da **última troca de música** (reset no evento de faixa/prefs, nunca síncrono no effect); modo Flexível continua sendo o painel arrastável atual.
- **`src-app/src/features/settings/SettingsFeature.tsx`** — card **"Player de Música"** na seção Áudio e Música: escolha Flexível/Fixo, 6 posições, visibilidade Sempre ativo/Só após trocar + slider de segundos (3–30, badge com valor) — tudo via `player-prefs` (re-render em sessão pelo evento).

### Changed
- **`src-app/src/features/music/audio-engine.ts`** — **notificação seletiva**: `currentSiteId` + `MS_HIDDEN_SITES = {'main','missions','result'}` → `updateMediaSession()` zera o metadata e `updatePositionState()` não publica posição para essas faixas (uploads e `workout`/Black Panther seguem normais); `playSite()`/`playQueueIndex()` atualizam `currentSiteId` e `playQueueIndex` chama **`registerPlay`** para uploads.
- **`src-app/src/features/gamification/ShareModal.tsx`** — **`navigator.share` com arquivo** via `shareNative()` (folha nativa Android/Windows), fallback **folha com texto** quando `files` é recusado, depois clipboard PNG → download — **AbortError (usuário fechou) não dispara fallback**; canvas **pré-renderizado ao abrir o modal** (`canvasRef` + efeito, limpo ao fechar) para a share rodar dentro do gesto; renomeia os 3 cards (**EVO FIT**) e o title/texto ("Evo Fit").
- **`src-app/src/features/gamification/ShareModal.tsx` (card treino)** — stats em **`display:grid; 1fr 1fr`** com **EXERCÍCIOS / KG TOTAIS / OFENSIVA / DURAÇÃO** (VOL. MÉDIO removido).
- **`src-app/src/features/workout/FichaFeature.tsx`** — `ViewMode` perde **`'deck'`** (migração: valor salvo `deck` → `grid`), view `#workoutDeck` e `deckViewRef` removidos, `prefix` do cardio fixo em `chk-grid-`; **3º slot do `.view-selector` = botão FOCO** (`#viewBtnFocus`, `.view-btn--focus`) que abre o Modo Foco; **FAB `.fab-focus` removido** (sem sobrepor a barra "tocando agora").
- **`src-app/src/features/lock/lock-store.ts`** — novo **`isWorkoutActive()`** (lê `workout_start_time`); boot: `locked: isLockUsable() && !isWorkoutActive()` — **exceção única do treino**.
- **`src-app/src/features/lock/useAppLock.ts`** — timer de inatividade **não arma com treino ativo** (`isWorkoutActive()`); re-arma nos eventos `academia:workout-started/cancelled/closed/completed`.
- **`src-app/src/features/settings/settings.css`** — blocos `.set-player-modes/--on`, `.set-player-positions/--on` (grade 2 col / 3 col).
- **`src-app/src/features/music/music.css`** — `.mu-sortbar/__chip/--active/__arrow` + bloco v4.22.0 `.fmp-pill` (6 âncoras com safe-area, keyframe `fmpPillIn`, controles `.fmp-pill__btn`), `prefers-reduced-motion` respeitado.
- **`src-app/src/styles/shell.css`** — `.view-btn--focus` (destaque vermelho `#ef4444` herdeiro do FAB).

### Verification
- `npx tsc -b` → 0 erros; `npx oxlint src` → 0 avisos; `npx vite build` → OK.
- **CDP probes (58/58 PASS)** — `probe_422.js` (37): ordenação 4 chaves × 2 toques invertendo + persistência; Início inicia fila na faixa clicada; Media Session MAIN/RESULT/Revenger Phoenix `metadata=null` vs Black Panther com título; Ficha sem `#viewBtnDeck`/`#workoutDeck`, com `#viewBtnFocus`, 3 slots, sem FAB; Configurações com card do player, 6 posições, slider default **7s**, prefs salvas; pastilha fixa `position:fixed` na âncora `tr`, some após ~7s, modo flexível volta. `probe_422b.js` (13): lock no boot **sem** treino → trava; destrava com senha; **com treino ativo → não trava** (timer visível); share card "EVO FIT", grid 2 colunas, 4 stats, VOL. MÉDIO ausente, BAIXAR gera toast. `probe_422c.js` (8): share com `navigator.share` simulado → **arquivo `image/jpeg` + título "Evo Fit"** + toast "Compartilhado!"; **sem Web Share** → fallback com toast "Compartilhamento não suportado. Imagem baixada!"; cancelar folha → 0 toasts; 0 erros de console.

## [v4.21.0] - 2026-10-14

**Músicas do site viram a playlist "Evo Fit" + fixação nas Escolhas rápidas + notificação do Android com nome/botões**: as 4 faixas fixas do app (**MAIN**, **Black Panther: War For Wakanda**, **Revenger Phoenix**, **RESULT**) saem das Escolhas rápidas e passam a viver por padrão dentro da playlist **"Evo Fit"**, tocando na **fila** (avançam sozinhas no fim). Cada upload entra **automaticamente na playlist "Suas músicas"** (uploads antigos migram na primeira abertura). As **Escolhas rápidas** agora são o que o **usuário fixar** — novos tile **"Fixar"** + modal de fixação (álbuns e músicas) e opção **"Fixar/Desafixar nas escolhas rápidas"** no long-press da playlist. Na interface de músicas, **transições animadas** ao trocar de aba e ao entrar na playlist. **Barra de música no rodapé da tela de treino** (Ficha) com arte + faixa atual + **retroceder/pausar/avançar** quando a música no treino está configurada. **Media Session API** para uploads e faixas do site: a **notificação do Android** agora mostra **nome, artista, arte e barra de progresso** com **botões de avançar/retroceder** (antes só "Fichas de Treino — Academia" + URL, sem controles). Ao adicionar playlist do **YouTube/Spotify** o usuário pode **atribuir um nome**. Teclado do Android medido de verdade via **`visualViewport`** (hook `useKeyboardInset` + `--mu-kb`), resolvendo o modal de criar playlist ainda coberto em **PWA fullscreen**. Atalhos **"Músicas"** no **drawer mobile** e na **sidebar desktop**. `system_map.json` → 3.5.62.

### Added
- **`src-app/src/features/music/media-store.ts`** — novo tipo de item **`PlaylistItem` kind `'site'`** (`{ id, kind:'site', siteId, title }`) + `SiteTrackId`; `MusicLibrary` ganha **`pinnedQuick: string[]`** (chaves `pl:`/`trk:`/`site:`) e **`seeded: boolean`**; helpers `pinPlaylistKey/pinTrackKey/pinSiteKey`. Migração única **`seedLibrary()`** (roda no `hydrate()`): cria a playlist **"Evo Fit"** (`pl-evo-fit`) com as 4 faixas do site e a playlist **"Suas músicas"** (`pl-suas-musicas`) recebendo todos os uploads existentes — sem recriar após exclusão (flag `seeded`). **`addUpload()`** agora adiciona o item novo em "Suas músicas"; `removeTrack()`/`deletePlaylist()` limpam a fixação correspondente de `pinnedQuick`; novo **`togglePin(key)`**.
- **`src-app/src/features/music/audio-engine.ts`** — **Media Session API**: `updateMediaSession()` seta `navigator.mediaSession.metadata` (`MediaMetadata` com título/artista/álbum `Academia Evo Fit` + arte 192/512 px) em cada `emitState()`, e `setupMediaSessionHandlers()` (no `initAudioEngine`) liga **`play`/`pause`/`previoustrack`/`nexttrack`/`seekbackward`/`seekforward`** — a notificação do Android ganha nome, duração/barra de progresso e avançar/retroceder para uploads **e** faixas do site. `updatePositionState()` (em `loadedmetadata`/`timeupdate` dos dois `<audio>`) alimenta a barra de progresso; `seekBy(±10s)`. Fila com itens **`kind:'site'`**: `isPlayableItem()` os aceita, `playQueueIndex()` toca o `siteAudio` **sem loop** (para o `ended` avançar a fila) e `togglePlayback()`/`seekBy()` escolhem o elemento de áudio ativo correto; `stopUserQueue()` pausa a faixa do site que estiver tocando.
- **`src-app/src/features/music/useKeyboardInset.ts`** (novo) — hook que mede a altura real do teclado Android (`window.innerHeight − visualViewport.height − offsetTop`) e devolve em px. Resolve o bottom-sheet coberto pelo teclado em **PWA fullscreen/standalone**, onde o `interactive-widget=resizes-content` é ignorado.
- **`src-app/src/features/music/WorkoutNowPlayingBar.tsx`** (novo) — barra no rodapé da **Ficha** (montada como último filho de `.ficha-overlay` no `App.tsx`): arte + título/artista (estado `academia:music-state`) + **retroceder / pausar / avançar**. Visível quando a música no treino está configurada (pref `academia_pref_workout_music` ligada **ou** playlist de treino escolhida — reage a `academia:music-changed`).
- **`src-app/src/features/music/MusicOverlay.tsx`** — **Escolhas rápidas = itens fixados** (álbuns/`pl:`, uploads/`trk:`, faixas do site/`site:`) + tile **"Fixar"** (`.mu-quick-card--add`) que abre o modal **"Fixar nas escolhas rápidas"** (`PinPickerModal`) com listas de Álbuns e Músicas; **`PinButton`** nas linhas de música (Início e Biblioteca); **transições** `.mu-pane`/`.mu-pane--detail` (key no wrapper re-monta e anima a troca de aba/detalhe); **nome atribuível** nos modais de link do YouTube/Spotify (campo "Nome da playlist" no Biblioteca e "Nome (opcional)" no detalhe da playlist); `PlaylistActionSheet` ganha **"Fixar/Desafixar nas escolhas rápidas"`**; `SiteTrackRow` na lista Músicas; itens `kind:'site'` no detalhe renderizados como **"Trilha do app"**.
- **Atalhos "Músicas"** — **`src-app/src/components/MobileDrawer.tsx`** (novo item `musicas` com `SvgMusic`, desc "Playlists e trilhas do treino") e **`src-app/src/components/DesktopSidebar.tsx`** (botão `.side-hud__item` com `SvgMusic` após Buscar), ambos via prop **`onOpenMusic`** ligada a **`openMusic()`** no `App.tsx` (fecha a drawer e abre o overlay de músicas).

### Changed
- **`src-app/src/features/music/music.css`** — bloco v4.21.0: keyframes `muPaneIn`/`muPaneInRight` (com `prefers-reduced-motion`), `.mu-quick-card__art--add` (tracejado accent), `.mu-pin-btn(--on)`, `.mu-pick--on`, `.mu-modal { padding-bottom: var(--mu-kb) }` (bottom-sheet sobe pelo teclado medido) e a barra **`.wnp*`** do treino (flex-shrink 0 como último filho da Ficha, arte 40px, botões redondos com `.wnp__btn--play` accent).
- **`src-app/src/features/music/MusicOverlay.tsx`** — quick picks deixam de listar automaticamente as faixas do site e todas as playlists (viram fixação explícita); cabeçalho documentado com o escopo v4.21.0.

### Verification
- `npx tsc -b` exit 0 · `oxlint` 0 avisos · `npx vite build` exit 0 (precache 112 entries).
- Probe CDP (`%TEMP%\opencode\probe_music421.js`, Chrome headless :9222 + `vite preview` :4173, perfil limpo): **37/37 PASS** — atalho Músicas no drawer abre a interface; seed com "Evo Fit" (4 itens `site`) e "Suas músicas"; `pinnedQuick` array; **faixas do site fora das Escolhas rápidas** por padrão (só o tile "Fixar"); `.mu-pane` anima na troca de aba (`muPaneIn 0.26s`); Listas mostra as 2 playlists; detalhe da Evo Fit com 4 "Trilha do app"; tocar inicia faixa (mini = MAIN); **MediaSession com título/artista/arte(2)**; `--mu-kb` exposto; painel do modal dentro da viewport; modal de link com campo Nome → **playlist criada com o nome do usuário**; fixar "Evo Fit" persiste em `pinnedQuick` e o card aparece nas Escolhas rápidas; long-press abre sheet com Fixar/Renomear/capa/treino/Excluir; **barra `.wnp` no rodapé da Ficha com 3 botões**; **avançar/retroceder trocam a faixa** (Black Panther → Revenger Phoenix → RESULT → prev); **0 erros de console**. Uploads (`probe_upload421.js`): parse "Artista - Música", **entra em "Suas músicas"**, toca na lista e **MediaSession reflete o upload**. Sidebar desktop (`probe_sidebar421.js`): atalho Músicas visível e abre a interface. **0 erros de console** nos 3 probes.

## [v4.20.0] - 2026-10-14

**Áudio e Música como seção própria + playlists completas + miniplayer flutuante**: nas **Configurações** nasce o tile **"Áudio e Música"** (fora de Acessibilidade/Exibição), recebendo os cards **Música de Fundo**, **Músicas Durante o Treino** e **Preferências de Interação** movidos da tela Exibição — com o botão **"Abrir Músicas e Playlists"** agora destacado. Na interface de músicas: **clique em uma playlist entra nela em qualquer aba** (Início e Biblioteca passam a exibi-las em grade de álbuns), **pressionar (long-press)** abre **Renomear / Trocar capa / Usar no treino / Excluir**, dá para **trocar a capa** da playlist (imagem enviada pelo usuário) e, havendo **múltiplas playlists, escolher qual delas toca no treino** (badge "no treino" + seleção única). Corrigido o **teclado do Android** sobrepondo o modal de criar playlist. Novo **miniplayer flutuante global** — arrastável, redimensionável e com **retroceder/avançar** —, especialmente útil durante o treino. `system_map.json` → 3.5.61.

### Added
- **`src-app/src/features/music/FloatingMiniPlayer.tsx`** (novo) — miniplayer flutuante global montado no **`App.tsx`** (z-index 660, abaixo do MusicOverlay 700 e do LockScreen 1200): arte + título/artista + **retroceder / pausar / avançar** (`prevTrack`/`nextTrack`/`togglePlayback` do `audio-engine`), arrastável pela área da arte (pointer capture) e redimensionável pela alça do canto (230–520 × 116–300 px; controles e arte escalam com a altura); posição/tamanho persistidos em `academia_floating_player_rect_v1` e sempre encaixados na viewport pelo helper `fit()`; renderiza só quando há faixa, o "×" oculta até a próxima faixa (que o traz de volta) e ele escuta `academia:music-state`.
- **`src-app/src/features/music/media-store.ts`** — `Playlist.cover` (data URL da imagem reduzida ~320px/JPEG) + `renamePlaylist(id, name)` e `setPlaylistCover(id, cover)`.
- **`src-app/src/features/music/audio-engine.ts`** — `nextTrack()`/`prevTrack()` para o miniplayer: na fila `workout-user` percorrem a playlist em loop; nos contextos do site percorrem `SITE_ORDER [main, workout, missions, result]`.
- **`src-app/src/features/music/MusicOverlay.tsx`** — navegação de detalhe compartilhada (`openId` no raiz do overlay): **clique em playlist abre o detalhe em todas as abas** (Biblioteca ganhou grade de álbuns estilo Início/Listas); **long-press** de 480 ms (cancelado se mover >10px, clique suprimido após disparar) abre **action sheet** com **Renomear / Trocar capa / Usar no treino / Excluir** — o botão "…" abre o mesmo sheet; modal **renomear**; **troca de capa** por input de imagem (canvas → data URL pequena, `readImageCover`); **badge "no treino"** no card da playlist ativa + botão **"Nenhuma playlist no treino (usar faixa do app)"** — com várias playlists, o badge/toggle escolhe **uma única** que toca no treino.
- **`src-app/src/features/settings/SettingsFeature.tsx`** — nova seção **"Áudio e Música"** (tile `audio` na raiz, fora de Acessibilidade/Exibição) reunindo os cards movidos da tela `exibicao`: **Música de Fundo** (toggle + volume), **Músicas Durante o Treino** (toggle + botão de acesso) e **Preferências de Interação** (Efeitos Sonoros/Vibração/Status Online); `exibicao` ficou só com Tela Cheia, Cronômetro, Navbar, PWA e Modo Desenvolvedor.
- **Busca** (`src-app/src/features/search/search-index.ts`) — item `cfg:audio` "Áudio e Música" (`stack: ['audio']` abre a nova seção); `cfg:exibicao` reduzido a exibição/PWA/dev com keywords de música removidas (migram para `cfg:audio`).

### Changed
- **`src-app/src/features/settings/settings.css`** — variante **`.set-btn--music`** (fundo `var(--primary)` sólido + glow): o botão "Abrir Músicas e Playlists" virou a chamada principal da seção.
- **`src-app/src/features/music/music.css`** — `.mu-cover` (capa por `<img>`), `.mu-badge-treino`, `.mu-actionsheet` (+ `--danger`), `.mu-modal--sheet`, painel de modal com `max-height/overflow` e bloco `.fmp*` do miniplayer flutuante.

### Fixed
- **`src-app/index.html`** — viewport com **`interactive-widget=resizes-content`**: o layout viewport encolhe quando o teclado do Android abre, então os bottom-sheets (criar/renomear playlist) **sobem acima do teclado** em vez de ficarem atrás dele; reforço com `max-height` + `overflow-y` no `.mu-modal__panel`.
- **`FloatingMiniPlayer.tsx`** — sinal invertido no resize (puxar para baixo diminuía a altura) e painel que **estourava a viewport ao crescer**: `fit()` agora encaixa largura/altura e reposiciona x/y em arrasto, resize, janela e carga (bug encontrado e corrigido pelo probe).

### Verification
- `npx tsc -b` exit 0 · `oxlint` 0 avisos · `npx vite build` exit 0 (precache **112 entries sem MP3s**).
- Probe CDP (`%TEMP%\opencode\probe_music420.js`, Chrome headless :9222 + `vite preview` :4173, perfil limpo): **38/38 PASS** — seção Áudio e Música com os 3 cards e botão destacado (`.set-btn--music`), Exibição sem eles (mantém Tela Cheia/Cronômetro), tile na raiz; criar playlist → detalhe, "Usar no treino" persiste, badge único com 2 playlists, long-press → sheet completo, renomear persiste, capa salva como data URL e renderizada; clique entra no detalhe pela grade, pelo Início e pela Biblioteca; ESC fecha; miniplayer some sem faixa, aparece com faixa, tem os 3 controles, é arrastável, redimensionável **mantido dentro da viewport**, persiste posição/tamanho, "×" oculta e volta na próxima faixa; **0 erros de console**.

## [v4.19.0] - 2026-10-14

**Músicas multi-contexto + interface de Playlists**: a trilha do app passa a reagir ao estado — `RESULT.mp3` toca ao **concluir um treino** e, ao clicar no botão **INCRÍVEL** (fechar o modal), para e o `MAIN.mp3` volta; durante o treino toca a faixa **Black Panther: War For Wakanda**; com o overlay de **Missões** aberto toca **Revenger Phoenix**. Nova **interface dedicada "Músicas e Playlists"** (estilo YouTube Music) onde o usuário envia suas próprias músicas (upload → IndexedDB), monta playlists, marca uma delas para **tocar automaticamente no treino** e adiciona playlists do **YouTube/Spotify** por link. `system_map.json` → 3.5.60.

### Added
- **`src-app/src/features/music/audio-engine.ts`** (novo) — motor de áudio multi-contexto que **assume a reprodução global** (o `background-music.ts` v4.18 fica só com prefs/eventos via `claimMusicPlayback()`, evitando dois players de MAIN.mp3). Contextos `main`(MAIN loop)/`workout`(Black Panther loop)/`result`(RESULT 1x → volta main no `ended`)/`missions`(Revenger Phoenix loop)/`workout-user`(playlist do usuário). Escuta eventos `academia:workout-started|completed|closed|cancelled` e `academia:missions-open|close` (disparados pelo `App.tsx`); volume/master reagem a `academia:music-changed` em tempo real; hidrata a biblioteca no boot (`hydrate()`) para a playlist de treino valer sem abrir a interface antes; autoplay adiado ao primeiro gesto (mesma política do v4.18). Fila do usuário avança em loop, itens Spotify são pulados no treino (embed não força autoplay). YouTube via **IFrame API** (carregada sob demanda, player oculto 1×1, avança na `ENDED`).
- **`src-app/src/features/music/media-store.ts`** (novo) — biblioteca do usuário em duas camadas: **blobs de áudio (uploads) em IndexedDB** (`academia_media_db`, store `audio_blobs` — localStorage não aguenta arquivos grandes) + **metadados (tracks/playlists/playlist ativa) em localStorage** (`academia_music_library_v1`). Store zustand `useLibraryStore`: `addUpload/removeTrack/createPlaylist/deletePlaylist/addUploadToPlaylist/addExternalToPlaylist/removeItem/setActivePlaylist`. Helpers `parseYouTubeRef` (watch?v=/youtu.be/playlist?list=/shorts) e `parseSpotifyRef` (open.spotify.com/playlist/<id> ou ID cru).
- **`src-app/src/features/music/MusicOverlay.tsx`** + **`music.css`** (novos) — overlay fullscreen estilo YouTube Music (BEM `.mu-*`, padrão de cores v4.8.4 — fundo `#07070b`, accent `var(--primary)`): 3 abas (Início "Escolhas rápidas"+lista Músicas / Playlists com grade+FAB "+"+empty state "Nenhuma playlist ainda"/Biblioteca com upload+links YT/Spotify), **mini-player** fixo (faixa atual + play/pause), bottom nav, modal de criar playlist e de adicionar músicas (uploads + link YT/Spotify). Abre via `academia:open-music`; ESC/X fecham.
- **`src-app/src/features/music/`** integrado no **`App.tsx`**: estado `isMusicOpen` + `<MusicOverlay>`, dispatches de eventos de áudio nos handlers (`handleOpenFicha`/`handleStartWorkout` → `workout-started`; efeito `isConclusaoOpen` → `workout-completed`; `handleConclusaoClose` → `workout-closed`; `handleEncerrarConfirmar` sem conclusão → `workout-cancelled`; efeito `dashOverlay==='missions'` → `missions-open/close`).
- **Prefs** (`profile-data.ts` → `PREF_KEYS`): `academia_pref_workout_music` (ausente = **ligado**) — se o usuário tiver playlist ativa com itens, ela vence; senão, se ligado, toca a faixa de treino do site; senão, silêncio no treino.
- **`src-app/src/features/settings/SettingsFeature.tsx`** — card **"Músicas Durante o Treino"** (tela `exibicao`, após "Música de Fundo"): switch "Músicas do App no Treino" + botão **"Abrir Músicas e Playlists"** (dispara `academia:open-music`) + nota explicando precedência playlist > faixa do site.
- **Busca** (`search-index.ts` + `App.tsx`): novo item `cfg:musicas` "Músicas e Playlists" com `action:'open-music'` (abre o overlay direto da Busca Geral); keywords de `cfg:exibicao` expandidas (`playlist`, `youtube`, `spotify`, `upload`, `treino`, `faixa`).

### Changed
- **`src-app/src/main.tsx`** — ordem do boot: `initAudioEngine()` roda **antes** de `initBackgroundMusic()` e chama `claimMusicPlayback()` (o módulo v4.18 passa a só aplicar prefs — a reprodução é do motor, sem áudio duplicado).
- **`src-app/src/lib/background-music.ts`** — ganha `claimMusicPlayback()` + flag `playbackClaimed`: quando o motor assume, `playMusicNow/pauseMusicNow/initBackgroundMusic` viram no-op (só prefs + evento `academia:music-changed` permanecem).
- **Assets** — `RESULT.mp3` (6,1 MB), `Black Panther_ War For Wakanda…(MP3_160K).mp3` (1,6 MB) e `Revenger Phoenix(MP3_160K).mp3` (1,5 MB) copiados de `Assets/Sounds/` para `src-app/public/assets/sounds/` (todos **fora** do precache via glob negativo `!assets/sounds/**`, cacheados sob demanda pelo runtimeCaching `/assets/`).

### Verification
- `npx tsc -b` exit 0 · `oxlint` 0 avisos · `npx vite build` exit 0 (precache **112 entries sem MP3s**; os 4 áudios presentes em `dist/assets/sounds/`).
- Probe CDP (`%TEMP%\opencode\probe_music419.js`, Chrome headless :9222 + `vite preview` :4173, perfil limpo): **17/17 PASS** — overlay de Músicas monta com 3 abas/4 cards/linhas, empty state de Playlists + FAB, criação de playlist persiste em `academia_music_library_v1`, Biblioteca com upload+YouTube+Spotify, mini-player, ESC fecha, card "Músicas Durante o Treino" + toggle + botão em Configurações → Exibição, **0 erros de console**. Diagnóstico `diag419.js` confirma 65 elementos `.mu-*` no DOM.
- **Nota**: reprodução audível real (playlist no treino, RESULT→MAIN, YouTube/Spotify) depende de gesto/política de autoplay e rede — o teste automatizado valida montagem de UI, persistência e ausência de erros, não áudio audível. Itens **Spotify em playlist de treino são pulados** (embed não permite autoplay forçado; tocam na interface).

## [v4.18.0] - 2026-10-14

**Música de fundo do site**: `Assets/Sounds/MAIN.mp3` (~7,2 MB) passa a tocar em loop enquanto o app está aberto, com controle nas **Configurações → Acessibilidade, Exibição e PWA**: switch "Tocar Música" (desabilitar/abilitar) e slider de **volume de 0 a 100** (passo 5). `system_map.json` → 3.5.59.

### Added
- **`src-app/src/lib/background-music.ts`** (novo) — player singleton (`HTMLAudioElement`, loop, `preload='auto'`): `initBackgroundMusic()` (chamado no `main.tsx` antes do render) aplica as prefs salvas e tenta `play()`; como navegadores bloqueiam autoplay com som, o play é **adiado até o primeiro gesto** do usuário (pointerdown/keydown em capture, re-armado a cada gesto até dar certo — mesma mecânica da tela cheia automática). API: `setMusicEnabled()`/`setMusicVolume()` (persistem + disparam `academia:music-changed`), `playMusicNow()`/`pauseMusicNow()`, `isMusicEnabled()`/`getMusicVolume()`. Volume 0 = mudo sem desligar; no iOS Safari `audio.volume` é read-only → degradação graciosa (o switch continua funcional).
- **Prefs** (`src-app/src/features/profile/profile-data.ts` → `PREF_KEYS`): `academia_pref_music_enabled` (ausente = **ligada**) e `academia_pref_music_volume` (ausente = **70**, faixa 0–100).
- **`src-app/src/features/settings/SettingsFeature.tsx`** — card **"Música de Fundo"** na tela `exibicao` (logo após "Tela Cheia"): switch "Tocar Música" + slider 0–100 com badge de estado ("Ligada • X%" / "Desligada") e nota explicativa; slider desabilitado quando a música está off; keywords do tile/search-index expandidas (`musica`, `volume`, `bgm`, `trilha`).
- **`src-app/public/assets/sounds/MAIN.mp3`** (novo) — cópia servida pelo build React da fonte `Assets/Sounds/MAIN.mp3`.
- **`src-app/src/main.tsx`** — `initBackgroundMusic()` chamado junto de `initPwaInstall()`/`initAutoFullscreen()`.

### Changed
- **`src-app/vite.config.ts`** — `includeAssets: ['favicon.ico', 'assets/**/*', '!assets/sounds/**']`: glob negativo mantém o MP3 **fora do precache** do Service Worker (7,2 MB não devem ser baixados na instalação do SW); ele é cacheado sob demanda pelo `runtimeCaching` StaleWhileRevalidate já existente para `/assets/` (a partir do primeiro play, funciona offline).

### Verification
- `npx tsc -b` exit 0 · `npm run lint` (oxlint) 0 avisos · `npm run build` exit 0 (dist contém `assets/sounds/MAIN.mp3`; precache 112 entries **sem** o MP3).
- Probe CDP (`%TEMP%\opencode\probe_music.js`, Chrome headless :9222 + `vite preview` :4173, perfil limpo): **12/12 PASS** — card "Música de Fundo" presente em Configurações → Exibição, switch ligado por padrão, slider 0–100 com valor 70, mover volume para 40 persiste `academia_pref_music_volume=40`, desligar persiste `=false` e desabilita o slider, religar restaura, 0 erros de runtime. Screenshot `%TEMP%\opencode\v418_music_settings.png` conferido (card com toggle roxo, badge "Ligada • 40%", slider e nota).
- **Nota**: o autoplay real só ocorre após o primeiro gesto do usuário (política dos navegadores — incontornável por JS); o teste automatizado não valida áudio audível, apenas estado/persistência/UI.

## [v4.17.0] - 2026-10-13

Descrições específicas para cada exercício na interface de detalhes individual da aba **Montar Ficha** (modal `CRDetailsModal`): antes, exercícios sem anotação recebiam o texto genérico "Um exercício focado em fortalecer o {grupo}…" — agora cada um dos 66 exercícios pré-cadastrados tem uma descrição própria explicando o que é, os músculos-alvo, a execução correta e uma dica de técnica. `system_map.json` → 3.5.58.

### Added
- **`src-app/src/features/workout/treinos/exercise-descriptions.ts`** (novo) — catálogo com **66 descrições em pt-BR**, uma por exercício de `DEFAULT_EXERCISES` (`default-data.ts`) + 1 entrada extra ("Leg Press 45°", nome comum criado por usuários). Lookup por **nome normalizado** (minúsculas, sem acentos, espaços colapsados) via `getExerciseDescription(name?)` — resiliente a caixa/acentuação; exercícios criados pelo usuário que não constam no catálogo caem no fallback genérico (nada é sobrescrito no banco de dados).
- **`src-app/src/features/workout/treinos/TreinosModals.tsx`** — `CRDetailsModal` (modal `#modalCRDetails`, aberto pelo botão "Detalhes" dos cards do deck) exibe a descrição com prioridade: **anotação do usuário (`ex.notes`, campo "Anotações") → catálogo por nome → fallback genérico por grupo muscular** (texto anterior mantido como última opção).

### Verification
- `npm run build` exit 0 · `oxlint` 0 avisos · validação de cobertura por script: **66/66** nomes do seed casados no catálogo, 0 chaves duplicadas, 0 faltantes (extra intencional). Probe CDP mobile (392×777) no `vite preview` :4173 — `probe_desc2.js` percorre os **5 cards do deck A** (Supino Articulado, Voador, Leg Press 45° + Banco Extenso, Desenvolvimento Máquina, Supra Prancha): **5/5 descrições específicas** exibidas no modal (nenhum genérico), screenshots `%TEMP%\opencode\desc_modal.png` e `desc_modal2.png` conferidos. Nota: o perfil CDP persistente tinha o SW/PWA do preview servindo o bundle antigo — probes desregistram o SW e limpam caches antes de testar.

## [v4.16.0] - 2026-10-13

Correção do **bug de tela preta no mobile** (relato em `academia-seven-iota.vercel.app`, Android Chrome): após a splash, o app podia ficar preso numa tela 100% preta. Diagnóstico por probe CDP no build idêntico ao deploy da Vercel (bundle byte-a-byte igual): **não era um bug mobile** — o script da splash em `src-app/index.html` ocultava a splash após 10 s **mesmo quando o React nunca montava** (bundle JS não baixado/travado por rede ruim, cache corrompido, etc.); com `#root` vazio, o `body` ficava preto e não havia **nenhuma** mensagem de erro nem retry. O "mobile only" era só a condição de rede/ cache que expunha a falha. `system_map.json` → 3.5.57.

### Fixed
- **`src-app/index.html`** — **watchdog da splash**: a splash só é ocultada quando o React **realmente montou** (`#root` com filhos), com fallback de 10 s que, em vez de fechar às cegas, exibe o novo overlay de boot; captura de `window.onerror`/`unhandledrejection` durante o boot também aciona o overlay (com stack/mensagem). Resultado: **nenhum cenário de falha produzir mais tela preta** — todos viram uma tela visível e acionável.
- **`src-app/src/main.tsx`** — **`BootErrorBoundary`**: erros de render do React durante a montagem são capturados e exibem o mesmo overlay de boot (antes, um erro de render derrubava a árvore inteira e o usuário via `#root` vazio = tela preta).

### Added
- **`src-app/index.html`** — **overlay de boot** (`.boot-overlay`, `#bootOverlay`): tela escura com título "Não foi possível carregar o app", mensagem amigável, botão roxo **"Tentar novamente"** e `<details>` com o diagnóstico técnico (ex.: nome do chunk que falhou). Estilos em `<style>` no próprio shell (não dependem do bundle CSS, que também pode não ter chegado).
- **Retry automático do bundle**: se o `<script type="module">` falhar, o shell re-injeta o script **uma vez** com `?retry=<ts>` (quebra cache do chunk); se ainda falhar, mostra o overlay. API `window.__academiaBoot` (`markReady`/`showBootError`) exposta pelo shell e consumida pelo `main.tsx`.
- Estados visuais na splash durante boot lento: "Ainda carregando…" após 6 s (mantém o usuário informado em rede 2G em vez de deixá-lo no escuro).

### Verification
- `tsc -b` exit 0 · `oxlint` 0 avisos · `vite build` exit 0. Probes CDP (Chrome headless remoto, viewport mobile 392×777) no `vite preview` :4173, 4 cenários: **normal** (dashboard monta, splash "Pronto!", sem overlay) · **block** (bundle bloqueado = o bug original: aos 6 s aparece o overlay com "Tentar novamente" + "Falha ao baixar os arquivos do aplicativo (index-….js)") · **slow** (bundle atrasado 8 s: splash permanece viva, app monta ao chegar — antes: tela preta 26 s) · **api** (erro de render simulado: `BootErrorBoundary` exibe o overlay) — screenshots `%TEMP%\opencode\boot_{normal,block,slow,api}.png` conferidos · **desktop 1440×900**: regressão OK (dashboard monta, sem overlay, splash "Pronto!") — `boot_desktop.png`.
- **Nota (gap conhecido)**: a versão legada `www/`/`treino.html` não foi alterada — este fix é do deploy React na Vercel. Se o app legado (HTTP local) tiver sintoma análogo, o mesmo padrão watchdog+overlay pode ser portado.

## [v4.15.0] - 2026-10-13

Redesenho da tela de login conforme as referências (`LoginAuthStandalone.tsx` + 7 imagens fixadas): o modal pequeno sobre o perfil virou uma **tela standalone full-screen** com fundo de horizonte curvo, marca **"Evo Fit"** / **"Cuidando da sua Saúde"** e as telas welcome/login/criar conta/recuperar senha/QR — mantendo (e completando) a autenticação **real** com Supabase, incluindo o fluxo Google OAuth. `system_map.json` → 3.5.56.

### Changed
- **`src-app/src/features/auth/AuthScreen.tsx`** (novo) — porta do `StandaloneAuthModal` do reference com guia visual das imagens: welcome (3 pílulas Google/e-mail/criar conta + atalhos "Entrar por QR Code • Vincular Chave" + gaveta de chave + rodapé legal com modais de Termos/Privacidade), login, cadastro, recuperação e QR, todos em cards `rounded-3xl` sobre o grid de perspectiva. Textos únicos alterados vs reference: "Planner"→**"Evo Fit"** e "Entenda sua jornada"→**"Cuidando da sua Saúde"** (incl. QR e textos legais). Login/cadastro/reset são reais via `useAuth` (antes: modal com QR mock); auto-fecha quando a sessão chega (retorno do Google, login ou auto-confirm de cadastro); ESC/X fecham; z-index 1150 (abaixo do LockScreen 1200).
- **`src-app/src/features/auth/AuthModal.tsx`** — virou wrapper fino que monta `AuthScreen` quando o store abre (ponto de montagem estável p/ App.tsx e Configurações; o visual `sy-modal` antigo foi removido).
- **`src-app/src/core/auth/auth-context.tsx`** — Google OAuth com `prompt: 'select_account'` (seletor de contas amigável; mantém `access_type: 'offline'` p/ refresh token) + efeito de **"Manter conectado"**: com `mbc_remember_me === 'false'`, as chaves de sessão do Supabase são removidas no `pagehide` (a sessão não persiste além da aba).
- **`src-app/src/App.tsx`** — comentário do ponto de montagem atualizado (v4.15.0-auth).

### Added
- **`src-app/src/features/auth/auth-screen.css`** (novo) — utilitário `.no-scrollbar` da tela.
- **QR Code real** (`qrcode` + `@types/qrcode` no `package.json`): a view QR gera um QR de verdade com payload `${origin}/?qr=PLN-XXXXXX&exp=...`, contagem regressiva de 5 min (pill no cabeçalho), overlay "Código Expirado" + Renovar e linha "Código de Pareamento" — fiel à imagem de referência (o fluxo de pareamento cross-device continua visual: transferir sessão exige backend/Realtime privado).
- **Vincular Chave funcional**: a gaveta aplica a chave digitada como namespace de sincronização (`setSyncKey` → `mbc_sync_key`) antes do login/cadastro/Google, e a welcome exibe a chave custom ativa — casa com o helper da imagem ("os dados associados a esta chave serão conectados à sua conta").
- **Recuperação de senha real** (`resetPasswordForEmail`) na vista "Esqueceu?" — o modal antigo não tinha.
- **Orientação p/ login por @usuário**: o Supabase Auth só autentica por e-mail; digitar algo que não seja e-mail (regex) mostra banner amigável orientando o uso do e-mail cadastrado (limitação documentada — login por @usuário exigiria RPC/Edge Function).

### Verification
- `tsc -b` exit 0 · `oxlint` 0 avisos · `vite build` exit 0 · probe CDP mobile+desktop **31/31 PASS** (`probe_auth.js`: abertura pelo hub de Perfil, pílulas/links/footer/grid, gaveta de chave, login + hint @usuário, signup, QR real dataURL + PIN + cronômetro, ESC fecha) + screenshots conferidos contra as 7 imagens de referência (`auth_c…auth_j`, incl. welcome desktop 1440×900).

## [v4.14.0] - 2026-10-13

Rodada pós-feedback mobile (3 itens): (1) **compartilhamento nativo do SO** — agora que o app está hospedado em HTTPS na Vercel, as ações de compartilhar usam a Web Share API (folha nativa do Android/Windows) com fallback para clipboard/download; (2) **bug**: no mobile a navbar inferior só era exibida após um toque na tela (com e sem tela cheia) — corrigido; (3) **garantia**: com "tela cheia automática" + tela de bloqueio ativas, um toque na tela de bloqueio ativa a tela cheia (verificado por probe — os listeners são globais em `document` capture e já alcançam o LockScreen). `system_map.json` → 3.5.55.

### Fixed
- **`src-app/src/components/BottomNav.tsx`** — **causa-raiz lógica do item 2**: no modo Flexível (`academia_pref_navbar_mode=flexible`), o handler de scroll escondia a barra quando **QUALQUER** `.section-slide` rolava para baixo — com os 5 slides montados lado a lado, o Chrome Android restaura o scroll de todos ao reabrir o app (session restore/bfcache), então um slide **INATIVO** restaurado em `top>8` escondia a navbar no boot **sem nenhum gesto** (e um toque/arrasto depois a "revelava" — exatamente o sintoma reportado; o legado não tinha este modo). Fix: o handler agora **ignora eventos de slides diferentes da seção ativa** (`activeSectionRef`) e a ref de scroll passa a ser semeada com o `scrollTop` REAL do novo slide na troca de seção (restauração não conta como "rolou para baixo"). Comportamento do modo Flexível intacto no slide ativo (recolhe descendo, mostra subindo/topo/troca — verificado).
- **`src-app/src/styles/shell.css`** — duas camadas de defesa para o mesmo sintoma no Android real (não reproduzível em emulação headless; DOM/CSS da barra íntegros — `position: fixed` presente no build):
  1. `.bottom-nav { will-change: transform }` — o Chrome Android só "commitava" a camada composta da barra fixed (backdrop-filter + SVG no modo oval) no primeiro gesto; `will-change` promove a navbar a camada própria **desde o paint inicial** (não altera o posicionamento fixo dela — só formaria containing block para filhos fixed, e ela não tem);
  2. `.h-screen { height: 100dvh }` — `100vh` = viewport GRANDE (toolbar do Chrome recolhida); com a toolbar expandida o wrapper do shell estendia ~60-80px **abaixo** da área visível; `100dvh` acompanha a toolbar em tempo real e, sem suporte (Safari <15.4), a declaração é descartada e o utility `h-screen` (100vh) permanece como fallback.

### Added
- **`src-app/src/lib/native-share.ts`** (novo): helper `shareNative()`/`canNativeShare()` da Web Share API — guards de `canShare` (ex.: `files` não existe no desktop), resultado tipado `'shared' | 'cancelled' | 'unsupported' | 'error'` (cancelamento **não** dispara fallback por cima da folha). Na versão legacy (HTTP local) a API não existia fora de contexto seguro — por isso os compartilhamentos caíam sempre no clipboard; em HTTPS (Vercel) a folha nativa da plataforma passa a ser usada. `src-app/src/features/social/LigasFeature.tsx`: "Compartilhar Recompensa" agora abre a folha nativa com texto + link do app (`window.location.origin`); sem suporte/cancelada → clipboard + feedback "Copiado" como antes. `ShareModal.tsx` (cards de treino/conquista/radar) e `backup.ts` (arquivo de backup) **já** usavam `navigator.share` com files e agora funcionam nativamente em HTTPS sem alteração.
- **`Diretrizes/system_map.json`**: `version` 3.5.54 → **3.5.55**.

Verificação: `npx tsc -b` exit 0 · `npm --prefix src-app run lint` (oxlint) 0 warnings · `npm run build` exit 0 (CSS dist contém `will-change:transform` e `100dvh`) · probes CDP no build de produção (`vite preview` :4173): `probe_nav3.js` — frio sem toque: navbar visível (`willChange:"transform"`, root `dvh` == `innerHeight`), **scroll de slide INATIVO não esconde mais a barra**, toque na tela de bloqueio → `fullscreenElement` ativo (req. 3), pós-unlock barra visível em tela cheia; `probe_nav4.js` — modo Flexível no slide ativo: desce→`bnav-hidden` (top 932), sobe/topo/troca→visível; regressão `probe_after.js` (v4.13: top bar transparente + biometria automática/só-no-botão) **todos PASS** · screenshots `%TEMP%\opencode\nav3_{a_cold,c_lock_tap,c_after_unlock}.png` conferidos (barra presente desde o load e no pós-unlock).

## [v4.13.0] - 2026-10-13

Duas entregas pós-feedback: (1) **Configurações → Segurança** — nova preferência "Solicitação da Digital": o usuário escolhe se a biometria é pedida **automática** ao entrar/travar (comportamento atual, padrão — preservado para quem não mexe na config) ou **só no botão** "Desbloquear com Digital" (novo; a senha continua disponível nos dois modos); (2) **Top Bar mobile 100% transparente de verdade** — o conteúdo agora rola *por trás* da barra e continua visível através dela (antes era cortado em y=56 e "engolido" pela faixa da barra ao rolar, como na imagem do feedback). `system_map.json` → 3.5.54.

### Fixed
- **`src-app/src/styles/shell.css`** — **causa-raiz do corte em y=56**: o offset da barra fixa vivia em `.shell-body { padding-top: 56px }`, empurrando todo o conteúdo para baixo — ao rolar, os cards subiam e sumiam *por baixo* da área da barra, que nunca era cruzada. O offset migrou para `.section-slide { padding-top: 56px }` (≤1023px; `0` no desktop ≥1024px, onde a barra não existe): como o scroll acontece dentro do slide, em repouso o layout é idêntico ao anterior (tabs em y=76) e, ao rolar, o conteúdo passa por trás da barra transparente (verificado com `elementsFromPoint(215,30)` → `DIV.exercicios-grid` rolado; antes retornava só `DIV.shell-body`). Complemento touch: `.top-bar { pointer-events: none }` com `pointer-events: auto` apenas em `.top-bar__avatar`/`.top-bar__btn`, para gestos/arrastos atravessarem a faixa entre os botões. Scroll fantasma do root continua zerado (`sh==ch` 932/932 — fix do v4.12.0 preservado) e desktop inalterado (`slidePad:0px`, banner y=20, sem barra).

### Added
- **`src-app/src/features/profile/profile-data.ts`**: `PREF_KEYS.appLockBioAuto = 'academia_pref_app_lock_bio_auto'` — ausente = `'true'` (automática, preserva o comportamento atual).
- **`src-app/src/features/settings/SettingsFeature.tsx`** (card "Bloqueio do App", tela `seguranca`): bloco **"Solicitação da Digital"** com segmented `.set-opts` — **"Automática"** (`SvgFingerprint`) / **"Só no Botão"** (lucide `MousePointerClick`, fonte autorizada `Diretrizes/Ícones.md` §11) — exibido apenas quando a biometria está ativada, com `.set-note` explicando o modo ativo; persistido via `LOCK_PREF_MAP.bioAuto`/`updateLock`. `src-app/src/features/search/search-index.ts`: keywords de `cfg:seguranca` + `automatica`/`auto`/`botao`.
- **`src-app/src/features/lock/LockScreen.tsx`** (modo "Só no Botão"): o auto-prompt WebAuthn passou a rodar só com `locked && autoBio` (flag do efeito marcada *dentro* do `setTimeout` — antes o cleanup do StrictMode em dev cancelava o 1º timer e a reexecução não reagendava); no modo manual a tela renderiza **cartão da digital + formulário de senha juntos** com o hint "Escolha como desbloquear: toque em *Desbloquear com Digital* ou digite sua *Senha de Bloqueio*"; botão "Tentar Novamente" agora exige `bioFailedAttempts >= 3` (evita duplicar a ação do cartão visível) e o erro da via senha é suprimido enquanto o cartão da digital aparece (o aviso dele próprio permanece). No modo automático o fluxo é idêntico ao anterior (hint "Entrada preferencial com Impressão Digital…", modo exclusivo até 3 falhas).
- **`src-app/src/components/MobileTopBar.tsx`**: comentário do cabeçalho atualizado (offset agora no `.section-slide`).
- **`Diretrizes/system_map.json`**: `version` 3.5.53 → **3.5.54**.

Verificação: `npx tsc -b` exit 0 · `npm --prefix src-app run lint` (oxlint) 0 warnings · `npm run build` exit 0 · probe `%TEMP%\opencode\probe_after.js` **todos PASS** tanto no dev (:5173) quanto no build de produção (`vite preview` :4173, tag `final`) — Part A: mobile repouso `vpTop:0`/`slidePadTop:56px`/tabs y=76 (idêntico ao pré-fix), com scroll atrás da barra = `DIV.exercicios-grid` (conteúdo visível; raiz `sh==ch` 932/932), dashboard banner rolando atrás da barra, desktop `slidePad:0px`/banner y=20/sidebar flex/barra oculta. Part B: "Só no Botão" → `bioCalls:0` em repouso, cartão+senha juntos, toque no botão → `bioCalls:1` + erro exibido; automático → `bioCalls:1` sozinho ao entrar; segmented persiste (`pref:false` após clicar "Só no Botão" + nota atualizada) e o bloco some com biometria OFF · screenshots `%TEMP%\opencode\final_{treinos_scrolled,topbar_strip,lock_manual,lock_auto,settings_seguranca,settings_bio_off,desktop}.png` conferidos visualmente (conteúdo atrás da barra transparente, os 2 caminhos de desbloqueio lado a lado no modo manual e segmented "Automática" ativo no padrão).

## [v4.12.0] - 2026-10-13

Rodada de correções pós-feedback (5 tarefas): (1) Configurações — opção selecionada com destaque forte de verdade (padrão reference: fundo sólido accent + texto claro, sem glow); (2) botão PWA do card "Instalar Aplicativo" mostrava "Indisponível"; (3) mobile — barra superior 100% transparente: ao rolar, o conteúdo não pode invadir a faixa da top bar (img 1); (4) nav oval — a parte extra da barra deve ter efeito de transparência (img 2); (5) sidebar desktop com atalhos "Missões" e "Configurações". `system_map.json` → 3.5.53.

### Fixed
- **`src-app/src/features/settings/settings.css`**: `.set-root button` → `.set-root :where(button)` — **causa-raiz do item 1**: o reset (spec 0,1,1) vencia todas as regras `.set-opt`/`.set-btn`/`.set-tile`/`.set-chip`/`.set-preset` (0,1,0) desde a criação do arquivo (14d8966, 08/10) — bg/border/color/padding dos botões nunca aplicaram; a única "distinção" pré-v4.10 era o glow (`box-shadow` sobrevivia ao reset), então ao remover o glow na v4.10 o destaque sumiu por completo (visível igual em dev e preview — não era bug de build). Com `:where()` (0,0,0) os estilos de componente voltam a valer: `.set-opt--active`/`.set-chip--active`/`.set-preset--active` aplicam fundo sólido `var(--primary)` + texto branco + borda 2px (parity com reference, sem glow).
- **`src-app/src/styles/shell.css`**: `.shell-body > .treino-page { min-height: 0 }` — **causa-raiz do item 3**: `main { min-height: 100vh }` em `legacy-style/main.css:255` (não-camadado) vencia o `min-h-0` do Tailwind (`@layer utilities` — não-camadado > layered); `.treino-page` (top 56px via `.shell-body { padding-top: 56px }`) + 100vh gerava scroll fantasma no root de exatamente 56px (`scrollHeight = clientHeight + 56`); ao rolar, o shell inteiro subia 56px e o conteúdo invadia a faixa da top bar transparente. Verificado no dist: root `sh==ch` (932/932), scroll attempts → 0, atrás da barra = `DIV.shell-body` (nunca conteúdo).
- **`src-app/src/styles/shell.css`**: `.bottom-nav.bnav-oval` → apenas `backdrop-filter: none !important;` — **causa-raiz do item 4**: o par explícito unprefixed+`-webkit-` era deduplicado pelo lightningcss mantendo só o webkit (que no Chrome não vence o `blur(24px)` de `globals.css`), e `blur(0px)` era descartado como inválido pelo minifier; o padrão que sobrevive (usado em `tabs-subnav.css:137`) é declarar só o unprefixed — o autoprefixer re-insere o `-webkit-` no build (dist com ambos ✓; computed `backdrop: none` no build ✓). Transparência da "parte extra" da oval confirmada por screenshot (`v412f_ovalnav_strip.png`).

### Changed
- **`src-app/src/features/settings/SettingsFeature.tsx`** (~L2031): botão do card "Instalar Aplicativo (PWA)" — `disabled={installState === 'installed'}` e label `installState === 'installed' ? 'Instalado ✓' : 'Instalar'` (antes ficava "Indisponível"/desabilitado quando `beforeinstallprompt` não disparava; agora "Instalar" sempre habilitado até estar instalado, com destaque accent).
- **`src-app/src/components/DesktopSidebar.tsx`** (item 5): atalhos **Missões** (`SvgMissions`, desc "Metas e recompensas") e **Configurações** (`SvgGear`, desc "Cores, exibição e conta") no `side-hud__nav` entre Loja e os utils; **`src-app/src/App.tsx`**: `onOpenMissions={() => openDashOverlay('missions')}` e `onOpenSettings={openProfileSettings}`.

### Added
- **`Diretrizes/system_map.json`**: `version` 3.5.52 → **3.5.53**.

Verificação: `npx tsc --noEmit` exit 0 · `npm run lint` (oxlint) 0 warnings · `npm run build` exit 0 · probe final `%TEMP%\opencode\probe_final.js` **todos PASS** (root 932/932 sem overflow; oval `backdrop:none`; `.set-opt--active` sólido `rgb(139,92,246)` 2px vs inativo card; `.set-btn` "Ativar" com destaque; "Instalar" `disabled:false opacity:1`; sidebar 8 itens + missões overlay OPEN) · screenshots `%TEMP%\opencode\v412f_*.png` (hub, exibição, notificações, install, oval strip/full, topbar dash/treinos) + `v412f2_sidebar_{expanded,missions,settings}.png` conferidos visualmente (sidebar expandida com os 2 atalhos, Missões e Configurações abrem; top bar transparente sem invasão; Chests do overlay de missões são URLs externas `lh3.googleusercontent.com` quebradas — pré-existente, fora do escopo).

## [v4.11.0] - 2026-10-12

Rodada de correções pós-feedback: (1) lock — contador "Tentativa X de 3" só a partir da 2ª tentativa; fundo escuro translúcido removido do card/badge/avatar (mantido apenas ao redor do botão de digital); accent colors via `var(--primary)` no avatar, texto "Impressão Digital" e botão de digital; (2) WebAuthn — storage key namespaced (`academia_v10_...`) p/ evitar conflito com site de referência na mesma origem; (3) dispositivos — QR code com countdown de 5 min no modal "Conectar Novo Dispositivo" (gerador QR SVG sem dependências); (4) settings — opção selecionada ganha borda 2px + fundo mais forte (sem glow); (5) hub — "Personalizar" movido para dentro de "Perfil" (sem submenu separado); (6) PWA Install card + Idioma do Sistema redesenhados conforme reference (ícone + título + descrição + botão à direita; select à direita). `system_map.json` → 3.5.52.

### Changed
- **`src-app/src/features/lock/LockScreen.tsx`**: contador de tentativas biométricas exibido apenas a partir da 2ª falha (`bioFailedAttempts >= 2`).
- **`src-app/src/features/lock/lock.css`**: `.lock__card` — fundo escuro translúcido (`rgba(9,9,11,0.78)` + `backdrop-filter: blur(22px)`) removido, agora transparente sem borda/shadow; `.lock__badge` — fundo transparente com borda accent; `.lock__avatar-img` — fundo transparente com borda accent 2px; `.lock__hint strong` — cor `var(--primary)` (accent) para "Impressão Digital"; `.lock__bio` mantém fundo escuro (área do botão de digital).
- **`src-app/src/features/lock/lock-store.ts`**: `WEBAUTHN_CRED_KEY` → `academia_v10_webauthn_credential_id` (namespace p/ evitar conflito WebAuthn com site de referência na mesma origem).
- **`src-app/src/features/sync/ConnectedDevices.tsx`**: modal "Conectar Novo Dispositivo" agora exibe QR Code SVG (pareamento rápido) + código de 6 dígitos + countdown de 5 minutos (expira em vermelho ≤30s); `openConnectModal()` gera código/QR ao abrir; divisor "OU SIMULAR APARELHO DE TESTE" mantido.
- **`src-app/src/features/settings/settings.css`**: `.set-preset--active`, `.set-opt--active`, `.set-chip--active` — borda 2px + fundo mais forte (`0.18` alpha) p/ destaque adequado da opção selecionada (sem glow).
- **`src-app/src/features/profile/ProfileFeature.tsx`**: "Personalizar" movido para dentro de "Perfil" (`persTiles` + `persScreens` aninhados em `perfilTilesV2`/`rootScreens.perfil`); `SvgEdit20`/`SvgSave`/`saveButton` removidos (órfãos); botão "Salvar Identidade" adicionado ao final da tela Identidade.
- **`src-app/src/features/settings/SettingsFeature.tsx`**: card "Instalar Aplicativo (PWA)" redesenhado conforme reference (ícone app + título + descrição + botão "Instalado ✓"/"Instalar agora" à direita); card "Idioma do Sistema / Language" redesenhado (título + descrição + select à direita); `SvgInstall` removido (órfão).

### Added
- **`src-app/src/features/sync/qr-generator.ts`**: gerador mínimo de QR Code SVG sem dependências externas (byte mode, ECC level L, versões 1–10, Reed-Solomon); `generateQRCodeSVG(text, pixelSize)` + `generatePairingCode()`.
- **`Diretrizes/system_map.json`**: `version` 3.5.51 → **3.5.52**.

Verificação: `npx tsc --noEmit` exit 0 · `npm run lint` (oxlint) 0 warnings · `npm run build` exit 0.

## [v4.10.0] - 2026-10-12

Rodada de correções pós-feedback do usuário (12 imagens): (1) biometria real via WebAuthn (antes era fake 1s); (2) reordenar hub — "Sua Conta" 1º, "Progressão" movida para dentro de "Perfil", "Nuvem e Sincronização" movida para dentro de "Sua Conta"; (3) remover Glow das interfaces (preset ativo, opt ativo, chip ativo, switches, botões primários); (4) "Telas Personalizadas" movida para dentro de "Esquema de Cores e Personalização"; (5) `ConnectedDevices.tsx` reescrito fiel às referências (banner full-width emerald, lista de cards arredondados, modal "Editar Dispositivo" com ícone centralizado + info rows, modal "Conectar Novo Dispositivo" com input de código 6 dígitos — sem QR); (6) lock screen: removido overlay escuro sobre a imagem customizada (gradiente sutil inferior apenas); (7) `sync.css` glow do botão primário removido. `system_map.json` → 3.5.51.

### Changed
- **`src-app/src/features/lock/lock-store.ts`**: novas funções WebAuthn — `registerBiometric()` (registra platform authenticator: Windows Hello, Touch ID, fingerprint), `verifyBiometric()` (assertion), `clearBiometric()`, `hasBiometricCredential()`, `isWebAuthnAvailable()`; credencial salva em `academia_webauthn_credential_id` (base64 de `rawId`).
- **`src-app/src/features/lock/LockScreen.tsx`**: `onBiometric` agora usa `verifyBiometric()` real (WebAuthn assertion) em vez de `setTimeout` fake; feedback de falha com vibração e mensagem de erro; import de `verifyBiometric`.
- **`src-app/src/features/settings/SettingsFeature.tsx`**: toggle "Bloqueio por Impressão Digital" chama `registerBiometric()` ao ligar (WebAuthn create) com toast de sucesso/erro; ao desligar chama `clearBiometric()`; tile "Nuvem" e "Telas" removidos do array raiz (movidos para dentro de Sua Conta e Cores respectivamente); screen `telas` removida (ScreensCustomizationPanel aninhada dentro de `cores`); `SvgCloud20`/`SvgImages20` removidos (não usados).
- **`src-app/src/features/profile/ProfileFeature.tsx`**: hub reestruturado — **"Sua Conta"** primeiro tile, **"Perfil"** segundo (agora inclui "Progressão" como sub-tile via `perfilTilesV2` + `progScreens`); `contaTilesV2` inclui "Nuvem e Sincronização" aninhada; `rootScreens.conta` inclui `nuvem` em `screens`; `screenKeywords`/`devModeRow` removidos (não usados após reordenação).
- **`src-app/src/features/sync/ConnectedDevices.tsx`**: reescrito fiel às referências (imgs 4–6): banner full-width esmeralda com botão grande "Conectar Dispositivo"; lista de cards arredondados com ícone centralizado, badge "SESSÃO ATUAL" (borda emerald para atual), meta (browser • OS • lastActive) e chevron; **modal "Editar Dispositivo"**: ícone centralizado, nome, "Renomear Dispositivo" + input + verde Salvar, info rows (relogio "Última sessão ativa", globo "Navegador e SO", escudo "Criptografia de ponta a ponta ativa" emerald), vermelho "Desconectar Dispositivo" + warning; **modal "Conectar Novo Dispositivo"**: input código 6 dígitos + verde "Autorizar" + divisor "OU SIMULAR APARELHO DE TESTE" + botão "Simular Novo Aparelho" — **sem QR code**; ícones `SvgClock`/`SvgGlobe`/`SvgShield` adicionados, `SvgInfo` removido.
- **`src-app/src/features/settings/settings.css`**: glow removido de `.set-preset--active`, `.set-opt--active`, `.set-btn--primary`, `.set-switch input:checked + .set-switch__track`, `.set-chip--active` (só `border-color` + `background` + `color`); focus rings `0 0 0 3px` mantidos (accessibilidade).
- **`src-app/src/features/sync/sync.css`**: glow removido de `.sy-btn--primary` (box-shadow com primary-rgb); toast/loading bar effects mantidos (não são glow de estado ativo).
- **`src-app/src/features/lock/lock.css`**: `.lock__shade` — overlay escuro radial removido; substituído por gradiente sutil inferior (`linear-gradient` com alpha 0→0.45 de 40%→100%) para manter legibilidade do conteúdo sem escurecer a imagem customizada.

### Added
- **`Diretrizes/system_map.json`**: `version` 3.5.50 → **3.5.51**.

Verificação: `npx tsc --noEmit` exit 0 · `npm run lint` (oxlint) 0 warnings · `npm run build` exit 0 · smoke test CDP preview :4173 + Chrome headless :9222 (SW/cache limpos no probe): `probe_v410.js` **12 PASS** (Sua Conta 1º, Perfil 2º, Progressão dentro de Perfil, Nuvem dentro de Sua Conta, sem glow no preset ativo, Telas Personalizadas dentro de Cores, ScreensCustomizationPanel visível) · screenshot `%TEMP%\opencode\v410_cores.png` conferido visualmente (Cores com seção Telas Personalizadas, sem glow).

## [v4.9.3-settings-lock-fidelity] - 2026-10-12

Rodada de fidelidade do LockScreen e das telas de Configurações às 17 imagens de referência (`LockScreenStandalone.tsx` + `SettingsInterfacesStandalone.tsx`). O LockScreen foi reescrito com o layout completo da nova reference (biometria-only, modal Recuperar Acesso, badge dinâmico, aura, decor). As telas de Configurações ganharam os cards do reference: Dispositivos Conectados (banner + QR + modal), Informações (Google + Foto + campos), Senha (info + olho), Segurança (sync + toggle + inatividade + senha + wallpapers), Notificações (PWA real), Exibição (esquema de cor + idioma). `ConnectedDevices.tsx` reescrito com layout do reference (banner esmeralda, lista com chevron, modal Gerenciar Dispositivo, nota de criptografia). `ProfileEmblem` ganha prioridade para `customization.photo`. `system_map.json` → 3.5.50.

### Changed
- **`src-app/src/features/lock/LockScreen.tsx` + `lock.css`**: reescrita completa fiel ao reference — modo **biometria-only** (esconde senha até 3 falhas, auto-trigger 400ms, contador "Tentativa X de 3", botão "Tentar biometria novamente", fallback p/ senha); **modal "Recuperar Acesso"** (ShieldAlert + textos + "Limpar Senha Local" → `clearPin()` + disable locks + reload); **badge dinâmico** (fingerprint accent ↔ shield purple); **avatar com aura giratória** accent→purple 10s (sem lock badge); **input com KeyRound + glow + olho** + "Entrar com Senha"; decor: mesh radial, glow rings, side rails desktop (SECURE SHELL/LOCK ACTIVE/DATA SHIELDED/v2.4.0-PROT), watermark de cadeado, zoom wallpaper 15s; erros "⚠️ …", vibração `[100,50,100]`, hints condicionais.
- **`src-app/src/features/settings/SettingsFeature.tsx`**: (a) tile raiz **"Dispositivos Conectados"** (`SvgLaptop`) entre Segurança e Notificações + atalho em `contaTiles`; (b) screen `dispositivos` + aninhada em `conta.screens` → `<ConnectedDevices />`; (c) **`informacoes`** reescrita: card Google (email + Desconectar via `handleSignOut` ou "Conectar Google" → `openAuthModal`), card Foto de Perfil (preview 64px `ProfileEmblem`, URL input, presets Unsplash grid, Carregar Arquivo), campos Nome/handle/email com submit único; (d) **`senha`** reescrita: info box "Senha de Usuário vs Senha de Bloqueio", olho, "Salvar Senha do Usuário"; (e) **`seguranca`** reescrita: Card 1 sync status (`getSyncKey()` + Copiar), Card 2 toggle master + biometria + badge [Ativado] + "Testar Bloqueio Agora" (`lockApp`), Card inatividade slider 1–60 + chips + Nunca + value badge, Card senha (link "Alterar Senha" → form Nova+Confirmar), Card wallpapers (preset dots + upload/remover/URL por orientação via `mbc_lock_*`); (f) **`notificacoes`** ganhou card PWA (Ativar Notificações com `Notification.requestPermission`, Testar Disparo, toggle "Segundo Plano" em `prefs.online`); (g) **`exibicao`** ganhou card "Esquema de Cores" (swatch + Personalizar → `setPickerOpen`) e "Idioma do Sistema" (select pt/en + toast); (h) imports: `getSyncKey`, `ProfileEmblem`; ícone `SvgPlay` adicionado; órfãos `LOCK_TIMEOUTS`/`secFields`/`renderSecField` removidos.
- **`src-app/src/features/sync/ConnectedDevices.tsx`**: reescrito para layout do reference — banner esmeralda "Conectar Novos Aparelhos" + botão "Conectar dispositivo" → **modal QR** (QR visual SVG + código de pareamento + countdown 5min); lista "STATUS DO DISPOSITIVO" com ícone/nome/customName/badge "SESSÃO ATUAL"/meta/chevron → **modal "Gerenciar Dispositivo"** (rename + "Salvar Nome" + info box Navegador/SO/Status + "Desconectar Este Aparelho" p/ não-atual); nota de criptografia E2E; reusa classes `sy-modal`/`sy-modal__panel`/`sy-modal__head` existentes; registry real (`useDevicesStore`, `loadDevices`, `renameDevice`, `disconnectDevice`) mantido.
- **`src-app/src/features/lock/LockScreen.tsx`**: `hasTriggeredBio` state → `hasTriggeredBioRef` (useRef) para eliminar warning `set-state-in-effect`; `SvgLock` não usado removido.
- **`src-app/src/features/settings/SettingsFeature.tsx`**: `ProfileEmblem` importado de `@/components/ProfileEmblem`; `SvgPlay` (polygon play) adicionado; `LOCK_TIMEOUTS`/`secFields`/`renderSecField` (órfãos) removidos; unused `key` no map de wallpapers removido.

### Added
- **`src-app/src/core/db/schema.ts`**: `ProfileCustomization.photo?: string` (URL/data-URL da foto de perfil customizada).
- **`src-app/src/components/ProfileEmblem.tsx`**: `customization.photo` (URL/data-URL) tem prioridade sobre o emblema — renderiza `<img>` cover com `onError` → fallback ao emblema.
- **`Diretrizes/system_map.json`**: `version` 3.5.49 → **3.5.50**.

Verificação: `npx tsc --noEmit` exit 0 · `npm run lint` (oxlint) 0 warnings · `npm run build` exit 0 · smoke test CDP preview :4173 + Chrome headless :9222 (limpeza de SW/cache no probe): `probe_settings5.js` **18/18 PASS** (lock: biometria-only auto-trigger + fallback p/ senha após 3 falhas + Recuperar Acesso + "Limpar Senha Local" limpa pin e desativa; settings: tile Dispositivos Conectados na raiz + aninhado em Sua Conta, Dispositivos com banner esmeralda + QR modal + countdown, Gerenciar Dispositivo rename+disconnect, Informações com Google/Foto/presets, Senha com info box + olho, Segurança com sync key + toggle + inatividade + slider, Notificações com card PWA, Exibicao com Esquema de Cores + Idioma; 0 erros/rejections) · screenshots `%TEMP%\opencode\{s5_lock,s5_settings_root,s5_dispositivos,s5_informacoes,s5_seguranca,s5_notificacoes,s5_exibicao}.png` conferidos visualmente.

## [v4.9.2-telas-lock-preview] - 2026-10-12

Rodada de fidelidade das telas restantes do reference (`SupabaseSyncSecurityStandalone.tsx`): comparação seção a seção confirmou que **Section 5–11 já estão portadas** (`RemoteSyncToast`, `ConnectedDevicesManager` → `ConnectedDevices.tsx`, `SettingsSupabaseAndSecuritySection` → telas `nuvem`+`seguranca`, `StandaloneLockScreen` redesenhado na rodada anterior, `StandaloneAppLoadingScreen`, `CustomScreenSettingsPanel`, `StandaloneAuthModal` com modos welcome/login/signup/QR). Gap real encontrado e corrigido: a **prévia "Testar Bloqueio"** em Telas Personalizadas ainda mostrava o lock antigo. `system_map.json` → 3.5.49.

### Changed
- **`src-app/src/features/sync/ScreensCustomizationPanel.tsx`**: a prévia "Testar Bloqueio" foi reescrita para **reusar as classes reais do LockScreen** (`lock`/`lock__*`, importadas via `lock.css`) via `createPortal(document.body)` — pill **"Desbloqueio • Academia"**, avatar do perfil (`ProfileEmblem`) com glow + badge de cadeado, nome, subtítulo condicional à biometria, card **"Desbloquear com Digital"** (biometria fake 1 s fecha a prévia quando `academia_pref_app_lock_biometric=true`), **campo de senha com olho** (4–32, digitar habilita "Desbloquear" que fecha a prévia), **"Esqueceu a senha?"** com nota, botão "Fechar prévia" e **ESC fecha**; wallpaper da prévia orientation-aware (`mbc_lock_mobile/desktop` com fallback cruzado + presets `resolveWallpaper` por `academia_pref_lock_wall_*`), acento via `var(--primary)` — antes era um card estático próprio (avatar placeholder, "APLICATIVO BLOQUEADO", `••••`, `maxLength=6`) desatualizado após o redesign do lock.
- **`src-app/src/features/sync/sync.css`**: bloco `.sy-lock-preview*` (~105 linhas) removido — órfão desde a reescrita da prévia.

Verificação: `npx tsc -b` exit 0 · `npm run lint` (oxlint) 0 warnings · `npm run build` exit 0 · CDP preview :4173 + Chrome headless :9222 (limpeza de SW/cache no probe): `probe_screens4.js` **21/21 PASS** (painel telas com 4 slots + botão Testar Bloqueio; prévia como portal `body > .lock` com pill/avatar/bio/olho/Esqueceu/nota, Desbloquear nasce desabilitado → digitar habilita → submeter fecha, reabre e ESC fecha; nuvem com chip + Copiar + Sincronizar agora + credenciais; segurança com 2 switches, 7 chips 1/2/5/10/15/30 + Sempre Logado, Criar Senha, lista de dispositivos; auth welcome Google/E-mail/QR/Criar Conta, login com olho, QR com contador; 0 erros/rejections) · screenshots `%TEMP%\opencode\{s4_telas,s4_preview,s4_nuvem,s4_seguranca,s4_auth_welcome,s4_auth_login,s4_auth_qr}.png` conferidos visualmente.

## [v4.9.1-lock-password] - 2026-10-12

Rodada "tela de carregamento + bloqueio" (ordem pedida pelo usuário): **senha de bloqueio alfanumérica** (bug das letras descartadas), **LockScreen** redesenhado no layout do reference (imagem 1 das capturas), **splash personalizada** fiel à imagem 8 (imagem em tela cheia + barra no rodapé, sem logo) e **paleta das telas novas seguindo a cor escolhida pelo usuário** (decisão: "a cor exibida será a escolhida pelo usuário"). `system_map.json` → 3.5.48.

### Fixed
- **Senha de bloqueio com letras "não salvava"** (`src-app/src/features/settings/SettingsFeature.tsx`): os campos do PIN usavam `.replace(/\D/g, '')` + `inputMode="numeric"` + `maxLength={6}` — qualquer letra era descartada antes de chegar ao estado, a confirmação nunca batia com o digitado e o form travava (relato do usuário: "ao digitar uma senha os carateres não são salvos/ficam bugados"). Agora: senha livre de **4 a 32 caracteres** (sem filtro numérico), validação de comprimento + confirmação, placeholder "Nova senha (mín. 4 caracteres)" e **olho show/hide** nos dois campos (`.set-input-wrap`/`.set-eye` em `settings.css`, ícone `SvgEye`).
- **`src-app/src/core/db/sync-queue.ts`**: `registration.sync.register('sync-mutations')` era uma rejeição flutuante — em Chrome headless/incognito o Background Sync rejeita com "Background Sync is disabled." e virava erro de console/unhandled rejection; agora `.catch(() => {})`.

### Changed
- **`src-app/src/features/lock/lock-store.ts`**: formato do hash `djb2:<hex>:<len>` mantido (compatível com PINs 4–6 já salvos), mas `getPinLength()` aceita **4–32** e a doc passa a descrever a senha local (nunca crua; `isLockUsable` = toggle + senha).
- **`src-app/src/features/lock/LockScreen.tsx` + `lock.css` (redesign, fidelidade à imagem 1 do reference)**: relógio/data e keypad numéricos **removidos**; nova composição — pill **"DESBLOQUEIO • ACADEMIA"** com digital, avatar do perfil (`ProfileEmblem`) com glow `var(--primary)` + badge de cadeado, nome do usuário, subtítulo com "Impressão Digital" em destaque quando a biometria está ligada (senão instrução de senha), card **"DESBLOQUEAR COM DIGITAL / Toque no sensor para autenticar"** (biometria fake 1 s intacta), **campo de senha com olho + botão "DESBLOQUEAR"** (`<form>` — Enter nativo), erro "Senha incorreta. Tente novamente." com shake 1,4 s + vibração (limpa o campo), **"ESQUECEU A SENHA?"** (revela aviso: a senha só existe neste dispositivo, sem recuperação na nuvem) e nota de dados locais; senha limpa em todos os desbloqueios. Acentos hardcoded `#f97316`/`rgba(249,115,22,…)` → `var(--primary)`/`rgba(var(--primary-rgb, 249, 115, 22), …)`.
- **`src-app/src/features/settings/SettingsFeature.tsx`**: rótulos "PIN do App / Criar PIN / Alterar PIN / Remover PIN / Salvar PIN" → **"Senha de Bloqueio / Criar Senha / Alterar Senha / Remover Senha / Salvar Senha"**, nota "Senha de N caracteres definida neste dispositivo", toasts coerentes; chips de inatividade viram **1, 2, 5, 10, 15, 30 min + Sempre Logado** (antes 1/5/15/30 min + Desativado, igual à imagem 6 do reference).
- **`src-app/index.html` (splash — imagem 8 do reference)**: quando `mbc_loading_vertical/horizontal` existe, a splash ganha a classe **`.splash-screen--custom`** — oculta logo EVO FIT/saudação (`display:none`), remove o overlay `::after` e ancora **barra + status no rodapé da imagem em tela cheia** com gradiente de legibilidade (o CSS vive em `<style>` no `index.html` porque `src-app/src/legacy-style/` é espelho intocável); sem imagem custom, o layout EVO FIT padrão é preservado. `#splashPct` → `color: var(--primary, #f97316)`.
- **Paleta segue a cor escolhida pelo usuário**: `src-app/src/features/sync/sync.css` (`--sy-accent/-strong/-soft/-line` → `var(--primary)`/`var(--primary-dark)`/`rgba(var(--primary-rgb,…))` + 5 sombras/bordas pontuais), prévia do lock em `ScreensCustomizationPanel.tsx` e `src-app/src/styles/design-tokens.css` ganha `--primary-rgb: 139, 92, 246` (default coerente antes do engine de tema — `theme-colors.ts setThemeVars` — aplicar no mount do App).

### Added
- **`Diretrizes/system_map.json`**: `version` 3.5.47 → **3.5.48** (`last_updated` segue 2026-10-12); entradas `src-app/index.html`, `features/lock/`, `features/settings/` e `features/sync/` atualizadas com esta rodada.

Verificação: `npx tsc -b` exit 0 · `npm run lint` (oxlint) 0 warnings · `npm run build` exit 0 · marcadores no bundle **19/19** (`%TEMP%\opencode\checksync.js`) · CDP preview :4173 + Chrome headless :9222 (**com limpeza de SW/cache no probe** — o service worker do PWA estava servindo o bundle antigo e mascarava a rodada nova): `probe_lock3.js` **19/19 PASS** (senha "gym2026" com letras salva como `djb2:…:7`, olho alterna password→text, chips novos, layout completo do lock, **paleta verde `rgb(74,222,128)` no tema verde**, senha errada → erro visível + shake + campo limpo + continua travado, senha correta destrava, digital destrava, reload nasce travado e destrava pelo campo, 0 erros/rejections) · `probe_splash3.js` **10/10 PASS** (classe `--custom`, logo/saudação `display:none`, barra no rodapé `bottom == innerHeight`, % roxo do tema, splash sai e app abre, fallback EVO FIT sem imagem) · screenshots `%TEMP%\opencode\{lock_v2,lock_v2_boot,splash_v2,splash_v2_default}.png` conferidos visualmente.

## [v4.9.0-sync] - 2026-10-12

Integração do Supabase no app React trazendo as funcionalidades de `SupabaseSyncSecurityStandalone.tsx` para dentro do app: sync multi-dispositivo em tempo real, login/conta, dispositivos conectados, tela de bloqueio com imagem própria, telas personalizadas e splash com status/progresso. Paleta do reference (zinc `#09090b` + laranja `#f97316`), tipografia Rajdhani do site. `system_map.json` → 3.5.47.

### Added
- **`src-app/src/core/sync/` (novo motor de sync)**: `supabase-client.ts` (credenciais do painel em localStorage `mbc_supabase_url`/`mbc_supabase_anon_key` com fallback `.env` `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` — `.env` tem prioridade; cache por sessão, `isSyncConfigured`, `testSupabaseConnection`, chaves `mbc_sync_key` (default `ACADEMIA_SYNC`), `mbc_device_id`, `mbc_last_sync_at`, `mbc_sync_revoked`, `setLastSyncedAt`/`lastSyncedAt`); `device.ts` (`getPersistentDeviceId`, `detectCurrentDevice`, `buildCurrentDeviceRecord`, `formatRelativeActiveTime`, registro em `user_sync.devices`); `offline-queue.ts` (fila IndexedDB `academia_offline_resilience_db`/`mutation_queue` com auto-flush no evento `online`); `sync-manager.ts` (snapshot JSONB dos dados essenciais — exercícios, fichas, histórico, maestrias, perfil/customização e estado legado — na tabela `user_sync`, push/pull com LWW por `updatedAt` e `setLastSyncedAt` para broadcast remoto mais novo sempre puxar, BroadcastChannel `academia_multi_device_sync_channel`, canal Realtime `sync_room_${key}`, heartbeat 25 s, registry de dispositivos com rename/kick/revogação, `useDevicesStore`, `syncNow`, `restartSyncEngine`, `reconnectAfterRevocation`, auto-push com debounce de 1500 ms no evento `academia:db-ready` e guard de change-detection no `refreshDevicesUi`).
- **`src-app/src/features/auth/` (novo)**: `AuthModal.tsx` (welcome/login/signup/QR Code — o QR é mock visual com contador de 5:00; botões Google/e-mail/criar conta ligados ao `supabase.auth` real) + `auth-modal-store.ts` (store zustand `useAuthModalStore`).
- **`src-app/src/features/sync/` (novo, UI)**: `sync.css` (BEM `.sy-*` com variáveis próprias, paleta zinc+laranja, blocos de modal/QR/`sy-btn--google`/`sy-qr`; z-index modal 1150 / toast 1180), `SyncSettingsPanel.tsx` (status da sincronização, chave ativa com copiar, "Sincronizar agora", credenciais Supabase com teste de conexão), `ConnectedDevices.tsx` (lista do registry com dispositivo atual, renomear, desconectar, revogar), `ScreensCustomizationPanel.tsx` (4 slots — `mbc_lock_desktop/mobile` e `mbc_loading_vertical/horizontal` — com prévias `.sy-lock-preview`/`.sy-loading`), `AppLoadingScreen.tsx` (overlay de carregamento com imagem custom + barra de progresso) e `RemoteSyncToast.tsx` (aviso de dados remotos vindos de outro dispositivo / sessão revogada).

### Changed
- **`src-app/src/features/settings/SettingsFeature.tsx`**: tiles `nuvem` ("Nuvem e Sincronização") e `telas` ("Telas Personalizadas") promovidos na raiz do hub do Perfil + telas correspondentes; `<ConnectedDevices />` real no lugar do placeholder da tela `seguranca`; rootExtra vira **"Entrar"** (abre o AuthModal) sem sessão ou **"Sair da Conta"** — a saída chama `supabase.auth.signOut()` direto (só encerra a sessão; **não** usa o `signOut()` do AuthProvider, que executa `clearLocalDB()` e apagaria os dados locais — decisão documentada em comentário no código).
- **`src-app/src/App.tsx`**: monta `<AuthModal/>` e `<RemoteSyncToast/>` antes do `<LockScreen/>` e inicia o motor de sync no `academia:db-ready` (fallback de 4000 ms, delay de 1200 ms).
- **`src-app/src/features/lock/LockScreen.tsx` + `lock.css`**: fundo personalizado `mbc_lock_desktop/mobile` (orientation-aware com fallback cruzado, `filter: brightness(0.78) saturate(1.05)`, reativo a `academia:lock-prefs-changed`); paleta do lock de roxo (`rgba(139,92,246,…)`, `#8b5cf6`, `var(--primary-light)`) para laranja `#f97316`, card `rgba(9,9,11,0.78)`.
- **`src-app/index.html`**: splash lê `mbc_loading_vertical/horizontal` por orientação, status "Sincronizando dados com a nuvem…" / "Carregando dados…", progresso simulado 0→90% (`#splashStatus`/`#splashPct`) e `sair()` limpa o timer finalizando em 100% / "Pronto!".
- **`src-app/src/core/supabase.ts`**: lê as credenciais do painel no boot (fallback `.env`); credenciais salvas em sessão valem após reload → toast orienta "Recarregue a página para liberar o login".
- **`src-app/src/features/search/search-index.ts`**: entradas `cfg:nuvem` e `cfg:telas` (Ctrl/Cmd+K abre o Perfil já na tela certa).
- **`Diretrizes/system_map.json`**: `version` 3.5.46 → **3.5.47**, `last_updated` → 2026-10-12; novas entradas em `react_app.entry_points` (`core/sync/`, `features/sync/`, `features/auth/`) e `react_app.core_db` (motor de sync).

Verificação: `npx tsc -b` exit 0 · `npm run lint` (oxlint) 0 warnings · `npm run build` exit 0 (bundle `index-*.js` 1.233,81 kB + CSS 448,22 kB, PWA 112 entries) · marcadores no bundle **19/19** (`%TEMP%\opencode\checksync.js`) · CDP no preview :4173 (Chrome headless :9222): `probe_sync3.js` **13/13 PASS** (tiles Nuvem/Telas na raiz do hub do Perfil, telas nuvem/telas/segurança montam os painéis, 4 slots de imagem, ConnectedDevices com o dispositivo atual, "Entrar" → AuthModal com variante Google, 0 erros/rejections) e `probe_lock.js` **8/8 PASS** (lock abre no boot, imagem custom aplicada + `brightness(0.78)`, **0** ocorrências de roxo e **29** de laranja no lock, PIN destrava, 0 erros) · screenshots `%TEMP%\opencode\sync_smoke.png` e `lock_smoke2.png`.

## [v4.8.4.3-deck-amoled] - 2026-10-11

Fundo do seletor de treinos (Montar Ficha) de roxo para preto AMOLED. `system_map.json` → 3.5.46.

### Changed
- `shell.css`: `.deck-header` (header do deck builder, seletor de letras A–E + ações) → `background: #000 !important` (antes `#150b24` de `deck-builder.css:16`, espelho legado não editado). Trilho `rgba(0,0,0,.3)` e ações seguem translúcidas sobre o preto puro (AMOLED).

Verificação: `npx tsc -b` exit 0 · `npx oxlint src` 0 warnings · `npm run build` OK · CDP `probe_4843.js` **3/3 PASS** (`.deck-header` `rgb(0,0,0)`; seletor de letras A–E montado com ativo; 0 erros de JS).

## [v4.8.4.2-treinos-frame] - 2026-10-11

Continuação do polish da aba Exercícios (moldura da aba + sub-navbar ainda roxas em `tabs-subnav.css`) e moldura de avatar da top bar mobile. `system_map.json` → 3.5.45.

### Changed
- `shell.css`: `#tab-exercicios` (moldura roxa `#150b24` + borda `rgba(139,92,246,0.3)` de `tabs-subnav.css:179`, espelho legado não editado) → `#0b0b10` + hairline `rgba(255,255,255,0.08)`; `.sub-navbar` border-bottom roxa → hairline. Sub-nav ativa já era ghost primary (v4.8.4.1).
- `MobileTopBar.tsx`: `.top-bar__avatar` ganha `data-frame={customization.avatarFrame}` (paridade com `#dashAvatar` do DashboardFeature).
- `shell.css`: regras `.top-bar__avatar[data-frame="bronze|prata|ouro|elite"]` — outline 2px + glow no próprio botão (mesmas cores do `8-customizacao.css:358–385`; o interior tem `overflow:hidden`, então o outline vai no elemento); `elite` acompanha `var(--primary)`.

Verificação: `npx tsc -b` exit 0 · `npx oxlint src` 0 warnings · `npm run build` OK · CDP `probe_4841b.js` **8/8 PASS** (`#tab-exercicios` `rgb(11,11,16)` + hairlines; sub-nav ativa ghost primary; molduras bronze/prata/ouro/elite com outline+glow corretos; sem moldura → `outline: none`; 0 erros de JS).

## [v4.8.4.1-treinos-polish] - 2026-10-11

Polimento da seção Treinos na paleta das Configurações (`features/settings/settings.css`): seletor de abas Exercícios/Montar Ficha, linha de filtros e chrome da aba (busca/CTA/view) — cards intocados; ícone do botão EDITAR EXERCÍCIO do CRDetails virou SVG stroke (regra do `Diretrizes/Ícones.md`); botão de tela cheia da top bar mobile deixa de ficar colorido quando ativo. `system_map.json` → 3.5.44.

### Changed
- `TreinosModals.tsx` (CRDetails): `✏️ EDITAR EXERCÍCIO` → **SVG stroke inline** (mesmo lápis de `cards.tsx` `SLOT_MENU_ICONS.pencil`, `stroke="currentColor"`, 14px) + texto — regra do `Diretrizes/Ícones.md` (sem emojis).
- `MobileTopBar.tsx`: alternador de tela cheia **nunca recebe `top-bar__btn--active`** — em tela cheia o botão fica neutro como os demais (ícone continua alternando `SvgMaximize`/`SvgMinimize`).
- `shell.css` (novo bloco `v4.8.4.1-treinos-polish`): override de **cores** do chrome da aba Exercícios na paleta settings (tabs-subnav.css/1-core.css são espelhos legados — não editados): `.section-subtabs .treino-tab-nav` borda inferior → hairline; `.t-tab-btn` inativa `#0b0b10` + hairline + `#8a8a9c`, hover `#101018`, ativa `#0e0e14` + borda `var(--primary)`; `.sub-tab-content` `#0b0b10` + hairline; `.sub-nav-btn` `#8a8a9c`, ativa ghost primary (bg `rgba(var(--primary-rgb),0.16)`, texto `var(--primary-light)`, glow `0 0 12px rgba(var(--primary-rgb),0.2)`) com seta `::after` em `var(--primary)`; `.btn-novo-ex` `var(--gradient)` → variante primary flat; `.view-btn.active` `var(--gradient)` → ghost primary. Cards de exercício intocados (pedido do usuário).

Verificação: `npx tsc -b` exit 0 · `npx oxlint src` 0 warnings · `npm run build` OK · CDP `probe_4841.js` **5/5 PASS** (seletor de abas `rgb(11,11,16)`/ativa borda `rgb(139,92,246)`; sub-nav ativa `rgba(139,92,246,0.16)` + texto `rgb(192,132,252)`; botão tela cheia sem `--active` após toggle; EDITAR EXERCÍCIO com SVG stroke e sem emoji ✏️; 0 erros de JS).

## [v4.8.4-color-standard] - 2026-10-11

Padronização de cores com a interface de Configurações (`features/settings/settings.css` — painéis near-black `#07070b`/`#0b0b10`/`#0e0e14`, hairlines `rgba(255,255,255,0.08)`, acentos sempre em `--primary`/`--primary-rgb`, dim `#8a8a9c`/`#5d5d70`): top bar mobile totalmente transparente, modal de Detalhes do exercício (CRDetails) e overlay de Missões. `system_map.json` → 3.5.43.

### Changed
- `shell.css` `.top-bar`: mobile **totalmente transparente** — `background: transparent`, sem `backdrop-filter` e sem `border-bottom` (avatar/botões mantêm seus fundos de vidro; pedido do usuário).
- `shell.css` (novo bloco no final): **override de cores do modal CRDetails** na paleta settings (modais.css é espelho legado — não editado): raiz `#0b0b10`, header/footer/stats/descrição `#0b0b10`/`#0e0e14` + hairlines, glow/borda neon/acentos via `--primary-rgb` (acompanha o tema), `.cr-close` e `.cr-maestria-shortcut` no estilo `.set-icon-btn`, `.cr-card-level-badge` como chip primary, `.cr-header-info h2` `#fff` sólido (sem gradiente roxo), `.cr-btn-upgrade` (EDITAR EXERCÍCIO) na variante primary com `!important` vencendo os do legado; geometria/animações 1:1.
- `missions-overlay.css` + `MissionsOverlay.tsx`: fundo `#0a0514` → `#07070b`, header/cards `#0b0b10` + hairline, aba ativa `#a078ff`/`#340080` → `var(--primary)` com texto near-black, inativa/dim `#8a8a9c`, trilhos `#14141b`, **fills de progresso rosa/verde/âmbar → `var(--primary)`** (const `FILL_STYLE`), botão fechar vermelho → classe `.ms-close-btn` estilo `.set-icon-btn` (handlers inline de hover removidos), glows e sombras via `--primary-rgb`, divisores `rgba(255,255,255,0.08)`; geometria/animações intactas.

### Removed
- `MissionsOverlay.tsx`: classe `progress-fill` das barras de missão — as skins de barra (`body[data-bar-skin] .progress-fill !important` em `8-customizacao.css`) venciam o inline e quebravam a padronização; agora o fill segue o tema (`var(--primary)`).

Verificação: `npx tsc -b` exit 0 · `npx oxlint src` 0 warnings · `npm run build` OK · CDP `probe_484.js` **4/4 PASS** (top-bar `rgba(0,0,0,0)`/sem blur/borda; missões com overlay `rgb(7,7,11)`, aba ativa `rgb(139,92,246)`, cards `rgb(11,11,16)`, fill primary; CRDetails `#0b0b10` + botão EDITAR primary `#c084fc`; 0 erros de JS).

## [v4.8.3.2-parity-slide] - 2026-10-11

Paridade de fluidez das transições de seção com o legado (`transitionguide.md`): a fita de seções passa a ser pré-montada (500vw, o legado nunca remontava), o Motion é a única fonte do `translateX` (a transition CSS do legado travava cada frame), o desktop troca o conteúdo de baixo para cima (verticalSwap) em vez de deslizar lateralmente e o modo oval da BottomNav mostra o label só no item ativo (o "MENU" deixa de ficar sempre visível). `system_map.json` → 3.5.42.

### Added
- `App.tsx`: as 5 seções (`progresso,treinos,dashboard,social,loja` de `SECTIONS_ORDER`) ficam **pré-montadas** dentro da fita `.section-strip` com `data-active` e `style={{ x: stripX }}` (stripOpacity removido); helpers `isDesktopNav()`/`slideBaseX(idx)`; `navigateSection` desktop = `flushSync` no início + `verticalSwap`, mobile = `slideSwap(stripX, slideBaseX(to), commit)`; resize faz `jump` do x; swipe usa base absoluta.
- `animations.ts`: reescrito — `slideSwap(x, targetX, updateCallback)` (commit do estado no INÍCIO do gesto para a nav acompanhar o slide), `snapSlideHome(x, targetX)`, `holdSlide()`, `verticalSwap(el)` (WAAPI `translateY(18px)+opacity`, 300 ms, `cubic-bezier(0.25,1,0.5,1)`); `SPRING_SLIDE` { stiffness: 380, damping: 38, mass: 1 } em `motion-presets.ts`.
- `shell.css`: desktop ≥1024px — `.section-strip > .section-slide { display: none }` (0,2,0 empata com o `display:flex` legado de `secoes/dashboard.css` e vence por folha posterior) + regras `data-active` mostrando só o ativo (`block`, dashboard mantém `flex`); `.section-strip { transition: none }` (causa-raiz do "tranvada": a transition de 0.48s do `7-nav-icons.css` re-interpolava cada frame escrito pelo MotionValue x).

### Changed
- `shell.css`: modo oval da BottomNav — removida a isenção que mantinha o label do Menu sempre visível; agora só o item ativo mostra label no oval (`.bnav-oval .bnav-btn.active .bnav-label { opacity: 1 }`); o modo reto segue com todos os labels visíveis (paridade legado).
- `App.tsx`/`animations.ts`: troca de seção mobile = slide lateral puro da fita pré-montada (sem remount no meio do gesto — o legado mantinha todas as seções no DOM); desktop = conteúdo de baixo para cima conforme `transitionguide.md`.

### Fixed
- Desktop com múltiplos slides visíveis após a mudança de `data-active` (o `display: flex` de `legacy-style/treino/secoes/dashboard.css:7` vencia o `display: none` genérico) — resolvido com o seletor direto `.section-strip > .section-slide` (shell.css).

### Removed
- `stripOpacity`/`SlideDirection` (App.tsx, animations.ts) — desnecessários com o Motion como fonte única do x.

Verificação: `npx tsc -b` exit 0 · `npx oxlint src` 0 warnings · `npm run build` OK · CDP `probe_4832.js` **5/5 PASS** (pré-montagem + strip 500vw + transition none; slide até -innerWidth sem remount; oval com label do Menu opacity 0; desktop só com o ativo visível; verticalSwap running no desktop), 0 erros de JS.

## [v4.8.3.1-nav-polish] - 2026-10-11

Ajustes de UX/animação pedidos em revisão da v4.8.3-navbars: Progresso sai da barra inferior mobile (fica só na sidebar desktop e na drawer), auto-fullscreen persistente, sidebar sem o atalho de teclado visível e molas calibradas para fluidez premium (transitionguide.md). `system_map.json` → 3.5.41.

### Added
- (none)

### Changed
- **`src-app/src/components/BottomNav.tsx` — Progresso removido da barra inferior**: o item `#bnavProgresso` sai da BottomNav mobile; a barra fica **Menu + Treinos + Início + Social + Loja** (5 botões). Progresso continua acessível no mobile pela **drawer lateral** (item "Progresso") e permanece na sidebar desktop (`nav-section-items.tsx` intocado). `SectionType`/`SECTIONS_ORDER`/swipe inalterados.
- **`src-app/src/lib/auto-fullscreen.ts` — tela cheia persistente**: com a pref `academia_pref_auto_fullscreen` ligada, os listeners de gesto **não são mais removidos após o 1º sucesso** — se o usuário sair da tela cheia por qualquer motivo (ESC do navegador, botão "Sair da tela cheia", gesto do sistema), o **próximo toque/clique reativa** o modo tela cheia. Removido o listener `fullscreenchange` que desarmava; `syncAutoFullscreen` (evento `academia:auto-fullscreen-changed`) segue como único caminho de arm/desarm em sessão.
- **`src-app/src/components/DesktopSidebar.tsx` — "Ctrl/Cmd + K" removido**: o desc do item Buscar (`.side-hud__label-desc`) some; fica só o label "Buscar" (o atalho `Ctrl/Cmd+K` continua funcionando — só o texto visível foi removido). `title` simplificado para "Buscar em tudo".
- **`src-app/src/lib/motion-presets.ts` — molas calibradas (transitionguide.md)**: `SPRING_SETTLE` 400/36/0.9 → **260/28/1** (ζ≈0.87, período ~390 ms — assentamento fluido, overshoot <1 px), `SPRING_EXIT` 520/42/0.9 → **340/32/1** (ζ≈0.85), `SPRING_SOFT` 300/30/0.85 → **220/24/0.9**. Menos rigidez, mais "glide" — interrupção natural preservada.
- **`src-app/src/lib/animations.ts` — slideSwap menos abrupto**: distance 8%/96px → **10%/120px** (movimento mais legível); opacidade de saída 0.12 → **0.28** (crossfade suave em vez de flash escuro no commit).
- **`src-app/src/components/MobileDrawer.tsx` — backdrop 0.2s → 0.28s easeOut** (sincronizado com o spring mais macio do painel).
- **`src-app/src/styles/shell.css` — micro-transições premium**: expansão da sidebar desktop `0.3s cubic-bezier(0.4,0,0.2,1)` → **0.35s cubic-bezier(0.25,1,0.5,1)** (easeOutQuint, idem `padding-left` do `.shell-body`); hover/items da drawer `0.2s` → **0.28s**; label do modo oval `0.25s ease` → **0.3s easeOutQuint**.

### Fixed
- **Animações "travadas"/pouco fluidas**: causa — springs com stiffness 400–520 (assentamento rígido) + dip de opacidade a 0.12 no meio do swap (flash) + distância curta. Calibrados contra o `transitionguide.md` (duração-alvo ~300 ms, easeInOut suave).

### Notas
- Verificação: `npx tsc -b` 0 · `npx oxlint src` 0 · `npm run build` OK · CDP probe **5/5 PASS** (`probe_4831.js`: nav sem Progresso com 5 ids corretos, drawer com item Progresso, ESC fecha drawer, sidebar sem "Ctrl", auto-fullscreen re-armado) · **0 erros JS**.
- Swipe horizontal ainda alcança Progresso (ordem `SECTIONS_ORDER` intacta) — removido apenas o atalho visual da barra.

---

## [v4.8.3-navbars] - 2026-10-11

*Navbars (mobile + desktop), inspiradas no `NavigationShellStandalone.tsx` de referência: (1) **barra inferior mobile ganha o item Menu como 1º botão** (hamburger) que abre uma **drawer lateral** com foto/perfil no topo, Busca Geral, atalho para a aba Progresso, Notícias, Missões, Configurações e tela cheia no rodapé; (2) **novo formato da barra nas Configurações → Exibição → Barra de Navegação**: Reta (atual, legado) ou **Oval** (curva neon SVG no topo com stroke no tema, labels só no ativo — padrão reference); (3) **sidebar desktop em preto AMOLED** com bordas neutras e **hover/ativo tingidos pela cor do tema do usuário** (`--primary-rgb` em vez de roxo hardcoded). system_map → 3.5.40.*

### [Added]
- **`src-app/src/components/MobileDrawer.tsx` (novo)** — drawer lateral mobile (`<1024px`) portada do `MobileDrawer` do reference: head com eyebrow "Navegação" + fechar, cartão de perfil (ProfileEmblem + nome + Nível/XP/ofensiva, abre o Perfil), nav com **Busca Geral, Progresso (atalho da seção ativa), Notícias, Missões, Configurações** e rodapé **Tela cheia/Sair da tela cheia**. Animação: springs `SPRING_SETTLE` (Motion v12, `motion/react`); body-lock + ESC; estilos `.mdw__*` em `shell.css` (z-index 950 — acima da nav, abaixo do LockScreen 1200). Notícias/Missões/Configurações são acionáveis de **qualquer seção** (ver App.tsx abaixo).
- **`src-app/src/features/profile/profile-data.ts` — pref `navbarShape`**: `academia_pref_navbar_shape` (`'straight'` | `'oval'`) em `PREF_KEYS`; **`SettingsFeature.tsx`**: novo card "Formato da Barra" dentro de "Barra de Navegação" (Exibição) com opções Reta/Oval (ícones `SvgBarStraight`/`SvgBarCurve`) + nota dinâmica; `selectNavbarShape` grava a pref e despacha `academia:navbar-shape-changed` (o BottomNav reage em tempo real, sem reload). `search-index.ts`: keywords/desc de `cfg:exibicao` atualizadas ("formato", "oval", "reta").
- **`src-app/src/styles/shell.css` — modo oval da BottomNav**: `.bottom-nav.bnav-oval` (92px, fundo transparente) + SVG `.bnav-oval__curve` absolute com path `M 0 30 Q 50 0 100 30 L 100 100 L 0 100 Z` (fill `rgba(10,8,20,0.98)`, stroke `var(--primary)` com `vector-effect: non-scaling-stroke`, drop-shadow neon no tema); labels ocultos fora do ativo (`.bnav-oval .bnav-label { opacity: 0 }` + ativo/Menu visíveis — 6 itens em 390px ficariam apertados, padrão reference); `.bnav-active-dot` vira pílula inferior 24×2px.

### [Changed]
- **`src-app/src/components/BottomNav.tsx` — item Menu + formato**: novo prop `onOpenMenu`; 1º botão = **Menu** (`#bnavMenu`, `.bnav-btn--menu`, hamburger SVG, `data-section="menu"`) em **ambos os formatos**, antes das 5 seções (ordem legado preservada: Progresso→Treinos→Início→Social→Loja); estado `shape` lido de `academia_pref_navbar_shape` com listener de `academia:navbar-shape-changed` alterna `.bnav-oval` no `<nav>`. O modo flexível/recolher (`bnav-hidden`) continua funcionando nos dois formatos.
- **`src-app/src/App.tsx` — wiring da drawer + overlays liftados**: monta `<MobileDrawer>` (callbacks: busca/Perfil fecham a drawer; Notícias/Missões → `openDashOverlay` que fecha o Perfil se aberto, `navigateSection('dashboard')` e abre o overlay; Configurações → `openProfileSettings` abre o Perfil com `academia:profile-nav` `detail: []` = raiz do hub); estado `dashOverlay: 'missions' | 'news' | null` **liftado do DashboardFeature para o App** (a drawer abre os overlays de qualquer seção) e limpo em `navigateSection` ao sair do Início; `.mdw` adicionado à lista de exclusão do swipe horizontal; BottomNav recebe `onOpenMenu`.
- **`src-app/src/features/dashboard/DashboardFeature.tsx` — overlays controlados**: props novas `overlay`/`onOverlayChange` (estado local `missionsOpen`/`newsOpen` removido); botões do header/pílula chamam `onOverlayChange('news'|'missions')`; montagem dos overlays com `open={overlay === '...'}` e `onClose={() => onOverlayChange(null)}`.
- **`src-app/src/styles/shell.css` — sidebar desktop AMOLED + tema (≥1024px)**: `.side-hud` de `rgba(8,4,16,0.92)` (roxo) → **`rgba(3,3,4,0.97)`** (preto AMOLED) com `border-right: rgba(255,255,255,0.07)`; head/utils com bordas neutras (`rgba(255,255,255,0.06)`) em vez de roxo; `.side-hud__avatar` com borda `rgba(var(--primary-rgb),0.35)`; **hover/ativo dos itens e utils** (`rgba(139,92,246,…)` hardcoded) → `rgba(var(--primary-rgb, 139, 92, 246), …)` — o destaque (filete neon, bg, border, inset, drop-shadow do ícone) agora segue a cor escolhida em Configurações → Cor de Destaque, como no reference (imagens do pedido).

### [Notas]
- Verificação: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 (1 warning `set-state-in-effect` do lint corrigido movendo a limpeza de `dashOverlay` para dentro de `navigateSection`) · `npm run build` OK · CDP probe **19/19 PASS** (barra reta 6 botões com Menu 1º; drawer com os 5 itens + perfil + tela cheia; drawer→Progresso navega; **Missões a partir de Progresso abre o overlay no Início**; Notícias; Configurações → hub → card "Formato da Barra" com Reta/Oval; oval: `.bnav-oval` + curva com stroke `rgb(139,92,246)` + altura 92px + labels Menu/inativos 1/0; drawer abre no oval; desktop: bg `rgba(3,3,4,0.97)`, borda `rgba(255,255,255,0.07)`, item ativo Treinos com `rgba(139,92,246,0.14)` = `--primary-rgb`; ESC fecha o Perfil — este último checado à parte pois o probe inicial despachou o evento em `window` e o App escuta em `document`) · **0 erros de JS** · screenshots `v483b_nav_oval/nav_straight/drawer_oval/drawer_straight/desktop_amoled` conferidos (oval com curva neon roxa + pill ativo; reta legado + Menu; drawer completa; sidebar preta com Treinos ativo tingido no tema).
- Divergência consciente: no modo oval os labels das seções só aparecem no item ativo (padrão do `MobileCurvedNavbar` do reference; 6 itens com labels todos visíveis em 390px transbordariam) — no formato reto todos os labels seguem visíveis (legado).
- **`Diretrizes/system_map.json`**: `version` 3.5.39 → **3.5.40**; entradas de `BottomNav.tsx`, `MobileDrawer.tsx` (novo), `App.tsx`, `DashboardFeature.tsx`, `DesktopSidebar.tsx`, `shell.css`, `SettingsFeature.tsx`, `profile-data.ts` e `search-index.ts` atualizadas.

## [v4.8.2-desktop-nav-grid] - 2026-10-11
*Dois pedidos para o desktop (≥1024px): (1) **ordem da navbar lateral** de cima para baixo — Buscar, Início, Social, Treinos, Progresso, Loja (Tela cheia e Trancar ficam como utilitários inferiores, inalterados na posição; o label "Trancar agora" passa a **"Trancar"**); (2) **a aba Início é adaptada para o desktop** — o Dashboard abandona a coluna única de 480px (mobile) e vira uma grade de 2 colunas: banner no canto superior esquerdo, ficha sugerida (PRÓXIMO PASSO) abaixo dele e o card Arena/radar ocupando a coluna direita inteira (span das 2 linhas), container centralizado com max-width 1120px. system_map → 3.5.39.*

### [Changed]
- **`src-app/src/components/nav-section-items.tsx` — ordem das seções**: `NavSectionItems` (só usado pela DesktopSidebar — confirmado por grep) reordenado para `dashboard → social → treinos → progresso → loja`. A ordem de SWIPE (`SECTIONS_ORDER` em `App.tsx`) permanece `progresso→treinos→dashboard→social→loja` (paridade com o `nav.js` legado) — não confundir.
- **`src-app/src/components/DesktopSidebar.tsx` — Buscar vira aba e "Trancar"**: (a) o botão **Buscar** sai dos utils inferiores e passa a ser o **primeiro item da nav** (mesmo estilo `.side-hud__item` das seções, ícone `SvgSearch`, desc "Ctrl/Cmd + K", abre a Global Search via `onOpenSearch`); (b) utils restantes: Tela cheia + **Trancar** (label `Trancar agora` → `Trancar`; `title` "Trancar o app agora" inalterado) + versão.

### [Added]
- **`src-app/src/styles/shell.css` — grade desktop do Início (v4.8.2-desktop-nav-grid)**: novo bloco `@media (min-width: 1024px)` que transforma `.section-slide[data-section="dashboard"] .dash-container` em grid nomeado `grid-template-areas: 'banner arena' / 'workout arena'` (colunas `minmax(0,1fr) minmax(0,1.05fr)`, gap 18/20px, max-width 1120px, padding 20/28/48px). Overrides: banner zera os `margin` negativos de sangria do mobile (`margin: 0 !important`, `border-radius: 24px`); arena ocupa a coluna direita inteira (`align-self: stretch` + `.dash-arena-content { flex: 1 }` centraliza e empurra a barra de XP para o pé); ficha sugerida zera o `margin-top: 90px` de overlap (vira gap do grid). Cascata: shell.css é importado **por último** no `main.tsx` e os seletores do banner ganham por especificidade maior mesmo contra os `!important` do espelho legado (`dashboard.css` L1491–1507). Mobile intocado (media ≥1024px).

### [Notas]
- Verificação: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK · CDP probe **6/6 PASS** (sidebar visível; ordem da nav exata `["Buscar","Início","Social","Treinos","Progresso","Loja"]`; utils `["Tela cheia","Trancar"]` sem Buscar e sem "Trancar agora"; label exato "Trancar"; Buscar abre a busca global com input focado; dashboard `display:grid` com banner à esquerda, arena à direita em span e ficha abaixo do banner, container 1120px) · screenshot `desktop_grid.png` conferido · 0 erros de JS. Atenção conhecida: o SW do PWA cachêia o bundle antigo no perfil CDP — probes devem desregistrar SWs + limpar Cache Storage e recarregar com `Network.setCacheDisabled` (feito no probe).
- **`Diretrizes/system_map.json`**: `version` 3.5.38 → **3.5.39**; entradas de `DesktopSidebar.tsx`, `nav-section-items.tsx` e `shell.css` atualizadas.

## [v4.8.1-missions-ui] - 2026-10-11
*A interface de missões da versão legacy (abas DIÁRIAS/SEMANAIS/GUIAS, "MISSÃO DE MAIO", "MISSÕES DO DIA" com contagem regressiva e cards com baús) "não aparecia" na versão React apesar do port 1:1 da Fase 3 existir e estar montado (`#dashBtnMissoes` → `<MissionsOverlay/>`). Causa raiz **idêntica à dos 3 modais da Progresso (v4.7.3)**: o `#missions-overlay` (`position: fixed; inset: 0`) e o `#news-overlay` (mesma estrutura) são montados dentro do `DashboardFeature` → dentro de `.section-strip`, que tem `will-change: transform` (7-nav-icons.css L33) e passa a ser o containing block do fixed — o overlay inteiro (conteúdo centralizado em `max-width: 420px`) era posicionado dentro da fita de 500vw e ficava permanentemente fora da viewport. Ambos agora renderizam via `createPortal(document.body)` (helper `toBody`, mesmo padrão de `TreinosModals`/`ProgressoFeature`/`LigasFeature`). system_map → 3.5.38.*

### [Fixed]
- **`src-app/src/features/dashboard/MissionsOverlay.tsx` — overlay de missões fora da viewport**: raiz `#missions-overlay` agora sai do DOM-tree da fita via `createPortal(node, document.body)` (helper `toBody`); o restante (CSS, 3 abas, lock de `body.overflow`, reset para daily ao abrir) permanece intacto. Probe CDP antes/depois: com o bug o rect era relativo à fita de 500vw; depois o overlay ocupa a viewport inteira (`0,0,390,844`, parent `BODY`).
- **`src-app/src/features/news/NewsOverlay.tsx` — mesma causa-raiz, mesmo fix**: `#news-overlay` também era `position: fixed` montado dentro do `DashboardFeature` (dentro da fita) e ficava invisível — agora via `toBody` (lista + detail views + FOOTER_HTML inalterados).

### [Notas]
- Overlays que já ficavam fora da fita (Perfil/Ficha/Busga/Lock/Conclusão/Foco — montados no `App.tsx` fora do `motion.section-strip`) ou que já portavam (`TreinosModals`, `ExercicioFormModal`, `Ligas`, `ProgressoFeature` v4.7.3, `ColorPickerModal`) não foram tocados.
- A interface segue **estática por desenho legado** (contadores `0/N` hardcoded — o Vanilla v3.5.7 não tem lógica/reset/XP de missões); o que voltou foi a **visibilidade**, não lógica nova.
- Verificação: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK · CDP probe **12/12 PASS** (pílula presente; missões retângulo `0,0,390,844` parent BODY; DIÁRIAS "MISSÕES DO DIA", SEMANAIS "MISSÕES DA SEMANA", GUIAS "GUIAS CHEGANDO EM BREVE"; body lock/destravado no open/close; reabre em daily; notícias retângulo na viewport + MOSTRAR MAIS + fecha; 0 erros de JS); screenshot `missions_daily.png` confere 1:1 com os prints do usuário (tabs + X, card 26/40, countdown 9H 15M, 3 cards com baús).
- **`Diretrizes/system_map.json`**: `version` 3.5.37 → **3.5.38**; entradas de `MissionsOverlay.tsx` e `features/news/` atualizadas com o portal.

## [v4.8.0-premium-motion] - 2026-10-11
*Dois pedidos: (1) **a cor do tema não afeta mais o emblema/avatar nas navbars** (o `mix-blend-mode: screen` do emblema sobre o `--gradient` colorido do tema lavava a imagem com a cor primária); (2) **navegação entre seções em nível premium** — troca de abas com springs de física (Motion v12 / Framer Motion), arrasto contínuo da fita e **interrupção natural**: um gesto/clique no meio da animação absorve a velocidade atual em vez de resetar. system_map → 3.5.37.*

### [Fixed]
- **`src-app/src/styles/shell.css` — avatar da Top Bar/Sidebar HUD tingido pelo tema**: `.top-bar__avatar` e `.side-hud__avatar` usavam `background: var(--gradient)`, que o tema do perfil sobrescreve (`profile-data.ts` L97: `--gradient` → gradiente da cor escolhida). Com o fundo colorido, o `mix-blend-mode: screen` do `ProfileEmblem` lavava a imagem (ex.: avatar vermelho quase sem emblema — print do usuário). Fundo agora neutro **`#1c1b1b`** (o mesmo do `#dash-profile-avatar` do dashboard, onde o emblema renderiza com cor verdadeira) + sombra neutra no `.side-hud__avatar` (antes roxa hardcoded `rgba(139,92,246,.25)`).

### [Added]
- **`src-app/src/lib/motion-presets.ts` (novo)**: springs compartilhados do Motion — `SPRING_SETTLE` (stiffness 400 / damping 36 / mass 0.9, ζ≈0.95: assenta sem overshoot — overshoot do strip de 500vw exporia a borda da fita), `SPRING_EXIT` (520/42, firme e curta para a saída) e `SPRING_SOFT` (micro-interações).

### [Changed]
- **`src-app/src/lib/animations.ts` — `slideSwap` com física real**: substitui a Web Animations API (cubic-beziers fixos, v4.6.0) por `animate()` do Motion sobre `MotionValue`s de x/opacity da fita. **Interrupção natural**: cada novo swap retargeta a mesma mola a partir da posição E velocidade atuais; épa invalida commits de swaps superseded; se o arrasto já levou a fita além da borda, a saída continua dali (não puxa de volta); `x.jump(+sign·dist)` após o `flushSync` do commit (metáfora de pager). Novos exports `snapSlideHome` e `holdSlide`.
- **`src-app/src/App.tsx` — navegação premium**: `.section-strip` virou `motion.div` (style x/opacity); `navigateSection` **sem guarda de re-entrada** (cliques rápidos retargetam — o último vence, sem fila); clique na seção ativa assenta em casa via `snapSlideHome`. Swipe horizontal evolui de "detecção de intenção" para **arrasto contínuo**: o dedo move a fita em tempo real (`stripX.set`), com borracha nas bordas (22% quando não há seção vizinha), axis-lock com as mesmas exclusões de alvo do `nav.js` L207–298; no release a decisão combina **posição** (20% da largura ou 150 px) **ou velocidade** (fling ≥ 550 px/s) e o snap/troca herdam a inércia do gesto.

### [Notas]
- **Zero dependências novas**: o pacote `motion` v12 (Framer Motion) já estava em `package.json` (scaffold + `LigasFeature`).
- Paridade preservada onde é micro-animação interna: `fadeIn`/`fadeSwap` (Ficha/Treinos/Progresso/Radar/badges) seguem o CSS legado; `BottomNav` continua DOM 1:1 (sem `layoutId` no dot ativo).
- Divergência consciente do legado: o `fadeSwap` 120 ms de `nav.js` vira slide em mola interrompível (pedido explícito do usuário, nível premium).
- Verificação: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK · CDP probe **9/9 PASS** (avatares `rgb(28,27,27)`, nav treinos, interrupção com 3 cliques rápidos — último vence —, strip assenta em repouso `transform:none/opacity:1`, clique na seção ativa, 0 erros de JS).
- **`Diretrizes/system_map.json`**: `version` 3.5.36 → **3.5.37**; entradas de `App.tsx`, `animations.ts` e `shell.css` atualizadas.

## [v4.7.4-pwa-icon-unificado] - 2026-10-11
*Novo ícone unificado: a instalação do site como PWA e o launcher do app Android/Capacitor passam a usar **o mesmo ícone** — canvas branco arredondado (estilo do ícone do Capacitor) com o logo Decepticon centralizado em tile preto. Antes as superfícies divergiam: o PWA usava o Decepticon full-bleed preto (`icon-192/512.png`) e o Android ainda tinha o template genérico do Capacitor (branco + raio azul, nunca atualizado desde a criação do projeto em 14/07/2026).*

### [Added]
- **Ícone unificado (fonte única gerada de `D.jpg`)** — composição 1024×1024: quadrado branco arredondado (raio ~20%) + tile preto arredondado centralizado (~66% do canvas) + logo Decepticon. Derivados aplicados em:
  - **PWA**: `src-app/public/assets/icons/icon-192.png` e `icon-512.png` (manifest do `vite-plugin-pwa`, `purpose: maskable any` — o logo ocupa a safe zone central, então o recorte circular/squircle do launcher não corta a marca).
  - **Android/Capacitor**: `android/app/src/main/res/mipmap-*/ic_launcher.png` (composite completo, 5 densidades mdpi→xxxhdpi), `ic_launcher_round.png` (variante circular) e `ic_launcher_foreground.png` (foreground com fundo transparente do adaptive-icon; o `ic_launcher_background.xml` já era `#FFFFFF`).
  - **Bundle Android**: `android/app/src/main/assets/public/assets/icons/` atualizado com `npx cap sync android` (mesmos arquivos do `src-app/dist`).
- **`src-app/index.html`**: `<link rel="apple-touch-icon" href="/assets/icons/icon-192.png">` — a instalação PWA no iOS passa a usar o mesmo ícone unificado.

### [Notas]
- Regenerar o ícone em outro tamanho: proporções do composite (branco full-bleed + tile 66% + inset ~3%) a partir de `D.jpg` (736×736, logo sobre preto — o fundo preto do JPG funde com o tile).
- `D.jpg` segue como favicon da aba (`<link rel="icon">`) — é o mesmo logo, sem mudança.
- Pasta `android/` é gitignored (mipmaps valem para builds locais); o que entra no git é `src-app/public/assets/icons/` + `src-app/index.html`.
- Verificação: `npm run build` OK (dist com `icon-192.png` 18.065 B / `icon-512.png` 103.368 B idênticos aos gerados) · `npx cap sync android` OK · `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · manifesto gerado mantém os mesmos caminhos (só o conteúdo dos PNGs mudou).
- **`Diretrizes/system_map.json`**: `version` 3.5.35 → **3.5.36**; entradas de `vite.config.ts` e `index.html` atualizadas.

## [v4.7.3-progresso-dayhist] - 2026-10-11
*Restauração do modal **"Treinos do Dia"** da aba Progresso no React: clicar num dia com histórico no calendário mensal abre o modal legado (duração total + treinos do dia com lista de exercícios). O código já existia mas o modal ficava **invisível** — o `will-change: transform` de `.section-strip` fazia do `.modal-overlay` (position: fixed) um elemento posicionado relativo à fita de 500vw (`rect.x=775` numa tela de 390 px). Correção só em `src-app/src/features/training/ProgressoFeature.tsx` (system_map.json → version 3.5.35).*

### [Fixed]
- **`src-app/src/features/training/ProgressoFeature.tsx` — os 3 modais da aba Progresso fora da viewport** (`#modalDayHist`, `#modalVolumeDetails`, `#modalRadarGuide`): agora renderizados via `createPortal(..., document.body)` (helper `toBody`, mesmo padrão de `TreinosModals`/`ExercicioFormModal`/`Ligas`/`NewsOverlay`). Causa raiz confirmada por probe CDP antes/depois: `.section-strip` (7-nav-icons.css L27/L33) tem `will-change: transform` → containing block do `position: fixed` → o overlay (`z-index: 1000`) era posicionado dentro da fita horizontal, invisível.
- **Lock de `body.overflow`**: novo efeito fecha o scroll do body enquanto qualquer um dos 3 modais estiver aberto (`selectedDate && dayRow`, `volumeDetailGroup`, `showRadarGuide`) e restaura no cleanup — fecha o known_gap "#modalDayHist sem lock de overflow" (paridade com `openModal/closeModal` de `secao-ficha.js` L560–568).

### [Changed]
- **Paridade de conteúdo do `#modalDayHist`**: restaurado o bullet `•` antes do nome de cada treino (`<strong style="color: var(--primary-light)">•</strong>`) e o emoji `⏱️` do cabeçalho de duração, iguais ao legado.

### [Notas]
- **Cor — sem CSS novo**: `.day-hist-duration` (4-gamificacao.css L809) já usa `background: var(--primary); color: #000` e o label/bullets usam `var(--primary-light)`, então o modal acompanha o tema escolhido pelo usuário (verificado com tema `green` → pill `rgb(34,197,94)` = `--primary: #22c55e`).
- **`Diretrizes/system_map.json`**: `version` 3.5.34 → **3.5.35**, `last_updated` 2026-10-11; `react_app.known_gaps` atualizado (gap do `#modalDayHist` resolvido; portal + lock nos 3 modais).
- Verificação: `npx tsc -b` exit 0 · `npx oxlint src` 0 findings · `npm run build` OK · CDP probe pós-fix: modal `rect {x:16,y:254,w:358,h:336}` visível em 390 px, `body.overflow=hidden` ao abrir e restaurado ao fechar pelo X, conteúdo `⏱️ DURAÇÃO TOTAL … TREINO B • Puxada Frente (3×10) …`, os 3 modais confirmados como filhos de `document.body` · screenshot `dayhist_after.png` conferido (tema green).

## [v4.7.2-evofit-splash-nav] - 2026-10-11
*Três ajustes de identidade: a splash passa a exibir o **logo "EVO FIT"** e a **barra de carregamento usa a skin de barra escolhida pelo usuário** (a mesma das barras do app), e o **avatar da Top Bar mobile e da Sidebar HUD desktop passa a exibir o emblema do perfil** em vez da inicial do nome. Escopo só `src-app/` (system_map.json → version 3.5.34).*

### [Changed]
- **`src-app/index.html` — splash**: `.splash-screen__logo-text` `ACADEMIA` → **`EVO FIT`** (subtítulo `WORKOUT TRACKER` inalterado). `#splashFill` ganha a classe **`progress-fill`** (mesma das barras do app) → herda automaticamente as ~34 skins de `body[data-bar-skin]` do `8-customizacao.css` (gradientes, pseudo-elementos, animações) **e** o override inline de `applyBarSkinToDOM`, sem duplicar CSS nem mexer nos espelhos legados. O script de saída agora espera `body[data-bar-skin]` antes de preencher (poll de 50 ms, máx. 1 s) — assim a splash abre já com a skin real do perfil, não com o roxo padrão.
- **`src-app/src/features/profile/ProfileFeature.tsx`**: `applyCustomizationGlobals(pc)` só roda com o estado real carregado (`if (!profile) return`) — antes os defaults do carregamento setavam `data-bar-skin="default"` e liberavam a splash cedo; agora o atributo significa "skin real aplicada".
- **`src-app/src/components/MobileTopBar.tsx`** e **`src-app/src/components/DesktopSidebar.tsx`**: o avatar passa a renderizar `<ProfileEmblem customization={state?.customization}/>` no lugar da inicial do nome (sem perfil carregado cai no emblema padrão `prestigio-1`, sem flicker de letra).
- **`src-app/src/styles/shell.css`**: `.top-bar__avatar` e `.side-hud__avatar` ganham `position: relative` + `overflow: hidden` (recorte circular do emblema/sprite).

### [Added]
- **`src-app/src/components/ProfileEmblem.tsx` (novo)**: emblema de identidade partilhado — port de `applyProfileCustomization` (`secao-customizacao.js` L371–396) já replicado em `DashboardFeature`/`ProfileFeature`: wrapper `.profile-avatar__emblem-wrapper` com `mix-blend-mode: screen` (+ `animate-pulse` quando `mainEmblemPulse !== false`), sprite da planilha (`SPRITESHEET_URL`, 300% + offset %) ou imagem direta.

### [Notas]
- **Fonte de verdade da skin**: `profileState.customization.barSkin` (IDB). O `localStorage.academia_treino` é só o snapshot da migração (o React grava a customização em IDB) — por isso a splash espera o bundle aplicar o atributo em vez de ler o localStorage.
- **`Diretrizes/system_map.json`**: `version` 3.5.33 → **3.5.34**, `last_updated` 2026-10-11; entradas de `src-app/index.html`, `MobileTopBar.tsx`, `DesktopSidebar.tsx`, `shell.css` atualizadas e nova entrada de `ProfileEmblem.tsx`.
- Verificação: `npx tsc -b` exit 0 · `npx oxlint src` 0 findings · `npm run build` OK · CDP **`verify_skin_nav.js` 14/14 PASS** (splash sai com fill 100%; `body[data-bar-skin]=default` e depois `=fire` com gradiente `rgb(255,77,0)→rgb(255,208,0)` já no preenchimento; `#splashFill` com `.progress-fill`; logo "EVO FIT"; `.top-bar__avatar` e `.side-hud__avatar` com `<img>` do emblema) · screenshots `nav_topbar_mobile.png` / `nav_sidebar_desktop.png` conferidos.

## [v4.7.1-ligas-theme] - 2026-10-10
*Aba Social passa a responder à cor escolhida pelo usuário nas Configurações (tema `--primary*`), seguindo o mesmo padrão de acentos de `settings.css` — só cores, sem mudança de design/layout. Hardcodes purple/indigo/violet/fuchsia viraram tokens `--primary`/`rgba(var(--primary-rgb,…))` ou utilitários `.ligas-*` já existentes; paletas de avatar e cores semânticas (emerald/rose/amber) mantidas como conteúdo.*

### [Changed]
- **`src-app/src/features/social/social.css`**: `.soc-root` ganha aliases `--soc-accent`, `--soc-accent-light`, `--soc-accent-dark`, `--soc-accent-rgb`, `--soc-accent-soft`, `--soc-accent-line`, `--soc-accent-strong`, `--soc-accent-glow` apontando para `var(--primary*)` do tema ativo; rgba hardcoded (hero, guilda, msg self, scrollbars) → `rgba(var(--primary-rgb, 139, 92, 246), X)`; novo bloco "Acentos sensíveis ao tema" com utilitários `.ligas-text-accent`, `.ligas-bg-accent`, `.ligas-bg-soft`, `.ligas-bg-soft-strong`, `.ligas-border-accent`, `.ligas-border-accent-strong`, `.ligas-glow`, `.ligas-glow-strong`, `.ligas-gradient`, `.ligas-bubble-self`, `.ligas-role-pill`, `.ligas-btn-primary`, `.ligas-filter-active`, `.ligas-input:focus`.
- **`src-app/src/features/social/LigasFeature.tsx`**: acentos purple/indigo substituídos por tokens tema — linha self da lista, nome/XP self, anel/borda de divisão ativa, `JoinPrompt` botão/glow, controles de teste, portal de fim de temporada (step 1+2 e botões "Continuar"), diamantes de navegação ativos, toggle semanal/mensal, banner do clã, borda/botão filtros, sub-aba Amigos/Membros (underline + borda), botão câmera, chat (role pill, bolha self, input, send), header da liga semanal e `AddFriendModal`. Paletas de avatar (`avatarColor`) e cores semânticas intencionais preservadas.

### [Notas]
- Escopo só cores — system_map segue 3.5.33.
- Verificação: `npx tsc -b` exit 0 · `npx oxlint src` 0 findings · `npm run build` OK (2.76 s).

## [v4.7.0-ligas-social] - 2026-10-10
*Aba Social substituída integralmente pelo conteúdo de `Ligas.tsx` (Amigos / Guilda / Liga Semanal+Mensal), mantendo apenas o background glass e a tipografia Rajdhani do app. Emojis de dados (avatar, bandeira, troféu de divisão) substituídos por SVG stroke conforme `Diretrizes/Ícones.md`.*

### [Added]
- **`src-app/src/features/social/ligas-data.ts`**: tipos (`PlayerProfile`, `ClanMessage`, `LeagueState`, `FriendItem`, `AvatarGlyphKey`, `FlagKey`), lógica de ligas semanal/mensal com persistência `localStorage` (`tetris_clash_leagues` / `tetris_clash_leagues_monthly`), geração/simulação de oponentes, `computeSeasonOutcome`, áudio sintetizado (`StandaloneSoundEffects`) e dados de demonstração (amigos, membros, mensagens, quick replies).
- **`src-app/src/features/social/ligas-icons.tsx`**: glifos SVG stroke — `AvatarGlyph` (20 chaves: crown/star/flame/bolt/skull/ghost/robot/rocket/paw/leaf/moon/sun/shield/sword/gem/wolf/frog/alien/panda/lion), `FlagIcon` (12 países BR/US/MX/FR/JP/AR/ES/IT/CA/DE/GB/CL), `DivisionIcon` (troféus Bronze/Prata/Ouro + gemas Safira/Rubi) — substituem todos os emojis de dados do mock.
- **`src-app/src/features/social/LigasFeature.tsx`**: port completo de `Ligas.tsx` — 3 sub-abas (Amigos com Aliança/filtros/modais, Guilda com chat local, Liga Semanal+Mensal com portais de fim de temporada), `LeagueCup` SVG 5-lobed, diamantes de navegação, banner do clã, controles de simulação, camera flash; fundos opacos convertidos para glass translúcido; font-imports inline removidos (herda Rajdhani).

### [Changed]
- **`src-app/src/features/social/SocialFeature.tsx`**: reescrito como re-export de `LigasFeature` (mantém o branch `social` do `App.tsx` sem mudança).
- **`src-app/src/features/social/social.css`**: bloco `.ligas-root` (flex column gap), animação `flash-effect` da câmera e scrollbars WebKit do chat/listas.

### [Removed]
- Conteúdo placeholder do mock `Ligas.html` (header stats, Caminho das Ligas com resgates, ranking global/guerra de clãs, doações, modais de duelo/perfil) — substituído pelo `Ligas.tsx`.
- `social-data.ts` e `social-icons.tsx` órfãos do placeholder anterior (arquivos mantidos no repo para referência; não são mais importados pela aba Social).

### [Notas]
- Chaves de glifo de avatar expandidas para incluir animais/personagens do mock (`wolf`, `frog`, `alien`, `panda`, `lion`).
- Liga usa `localStorage` isolado do app (chaves `tetris_clash_*`) — não depende do Dexie/IDB.
- Portais de fim de temporada usam `createPortal(document.body)` + fundo `rgba(10,5,20,0.92)` + blur (legível sobre o glass).
- Verificação: `npx tsc -b` exit 0 · `npx oxlint src` 0 findings · `npm run build` OK (47 s).

## [v4.6.1-topbar-overlay] - 2026-10-10
*Top Bar mobile alinhada ao `MobileTopBar` do `NavigationShellStandalone.tsx` de referência: removido o texto "ACADEMIA / WORKOUT TRACKER" (só sobram avatar + busca + tela cheia) e a barra passou de `relative` no fluxo para `fixed` translúcida por cima do conteúdo (fundo 55% + blur 14px, borda inferior quase invisível, sem sombra pesada) — integra-se de forma orgânica com o fundo dinâmico, especialmente em tela cheia; `.shell-body` ganhou `padding-top: 56px` no mobile (zerado no desktop ≥1024px) para o conteúdo começar abaixo da barra. Avatar 36→32 px e botões 38→34 px (paridade com a referência). Altura da barra fixada em **56px puro** (sem `env(safe-area-inset-top)` no height/padding — em tela cheia o inset inflava a barra verticalmente); itens colados no topo (`align-items: flex-start` + `padding-top: 6px` de respiro). Eliminada a folga enorme entre barra e aba Treinos em tela cheia: `.section-subtabs` (legado) somava `calc(20px + env(safe-area-inset-top))` de margem, duplicando o inset já coberto pelo `.shell-body` — override em `shell.css` mantém só os 20px.*

### [Changed]
- **`src-app/src/components/MobileTopBar.tsx`**: bloco `.top-bar__brand` (Academia / Workout Tracker) removido — só avatar à esquerda e `.top-bar__actions` (busca + tela cheia) à direita, como na referência.
- **`src-app/src/styles/shell.css`**: `.top-bar` vira `position: fixed` (top/left/right 0, z-index 350), fundo `rgba(10,5,20,0.55)` + `backdrop-filter: blur(14px)`, borda inferior `rgba(255,255,255,0.05)`, sem `box-shadow`; seletores `.top-bar__brand*` removidos; avatar 32 px / botões 34 px / ícones 16 px; `.shell-body` ganha `padding-top: calc(56px + env(safe-area-inset-top, 0px))` (compensa a barra fixed) e o media ≥1024px zera esse padding (desktop usa Sidebar HUD).

### [Fixed]
- **`src-app/src/styles/shell.css` — barra superior alta demais e itens fora do topo em tela cheia**: o `env(safe-area-inset-top)` (grande em tela cheia com notch/câmera) inflava o `height` e o `padding-top` da `.top-bar`, deixando-a verticalmente alta e empurrando os itens para baixo. Corrigido: altura fixa `56px` pura (sem env no height), `padding-top: 6px` (respiro mínimo) e `align-items: flex-start` — avatar e botões colados na porção superior da barra; `.shell-body` sincronizado com `padding-top: 56px` fixo.
- **`src-app/src/styles/shell.css` — avatar/botões cortados lateralmente em tela cheia (bordas arredondadas)**: o padding horizontal de `14px` puro não compensava a curvatura dos cantos arredondados de celular em tela cheia (raio ~30–55px) nem o `safe-area-inset-left/right`, deixando o avatar à esquerda e o botão de tela cheia à direita parcialmente recortados. Padding horizontal agora usa `max(14px, calc((100% - 516px) / 2))` — em telas estreitas mantém 14px; em telas largas (tela cheia) o cálculo reproduz o offset do `.dash-container` (max-width 480px content-box + padding 0 18px = 516px border-box centrado, com o banner sangrando via `margin: -18px`), alinhando os itens da barra com as bordas do card do banner de perfil.
- **`src-app/src/styles/shell.css` — espaçamento enorme entre barra e aba Treinos em tela cheia**: o `.section-subtabs` legado (`7-nav-icons.css:182`) soma `calc(20px + env(safe-area-inset-top))` de margem-top, mas o safe-area já é coberto pelo `padding-top` do `.shell-body` — em tela cheia com notch o inset era contado duas vezes, gerando um vazio anormal entre a Top Bar e as sub-abas. Override em `shell.css` (importado após `legacy.css` no `main.tsx`) reduz a margem para `20px` fixos, eliminando o safe-area duplicado.

### Notas (verificação)
- **Comandos**: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (em `src-app/`).
- **Escopo**: apenas `src-app/` + este CHANGELOG — system_map segue 3.5.33 (refinamento visual, sem mudança estrutural).

## [v4.6.0-shell-lock-search] - 2026-10-10
*Port da casca do `NavigationShellStandalone.tsx` de referência para o app React: (1) tela cheia manual cross-browser (botão na Top Bar mobile e na Sidebar desktop); (2) casca adaptativa — mobile com BottomNav + Top Bar (avatar/marca/busca/tela cheia) e desktop ≥1024px com Sidebar HUD esquerda (76px colapsada / 264px expandida, hover ou pin persistido em `academia_pref_sidebar_pinned`), Top Bar e BottomNav ocultos; (3) Sistema de Bloqueio funcional — PIN 4–6 dígitos (armazenado como hash `djb2:<hex>:<len>`, nunca cru), bloqueio por inatividade (60/300/900/1800 s ou desativado), biometria fake (1s), wallpapers gradientes `neon/grafite/violeta/magenta` por orientação, keypad com shake no erro e teclado físico; (4) Busca Geral Unificada (Ctrl/Cmd+K ou botão) — seções, exercícios (deaccent/insensível a acentos), fichas A–J e configurações, ranking com melhor match por grupo, navegação para seção/perfil/Treinos; (5) transições direcionais `slideSwap` (WAAPI, `flushSync`, sem overshoot) substituindo o `fadeSwap` nas trocas de seção, com ordem `['progresso','treinos','dashboard','social','loja']` no swipe. system_map.json → 3.5.33*

### [Added]
- **`src-app/src/lib/fullscreen.ts` (novo)**: hook `useCrossBrowserFullscreen()` — toggle manual com prefixes webkit/moz/ms + eventos `FS_EVENTS` (a pref auto-fullscreen da v4.4.0 permanece intacta e independente).
- **`src-app/src/styles/shell.css` (novo)**: casca adaptativa — `.top-bar*` (Top Bar mobile), `.side-hud*` (Sidebar desktop: head/XP/streak/pin, nav com `.side-hud__item`, utils), `.shell-body`/`--pinned`; media query ≥1024px esconde Top Bar/BottomNav, força `.section-strip`/`.section-slide` a `width:100%` (vence o 500vw/100vw legado) e aplica padding-left 76/264px. Importado **por último** em `main.tsx` (após legacy/globals/design-tokens) para vencer empates com CSS legado.
- **`src-app/src/components/MobileTopBar.tsx` (novo)**: barra superior mobile — avatar (abre o Perfil), marca ACADEMIA, botão busca (abre a Global Search) e botão tela cheia.
- **`src-app/src/components/DesktopSidebar.tsx` (novo)**: `#desktopSidebar` — head (avatar/nome/nível/XP/streak + pin), nav das 5 seções (ativo sincronizado), utils (Buscar, Tela Cheia, Trancar Agora quando o lock está utilizável, versão). Pin alterna o layout fixo e persiste em `PREF_KEYS.sidebarPinned`.
- **`src-app/src/components/nav-items.tsx` + `nav-section-items.tsx` (novos)**: ícones SVG stroke (viewBox 24, fill none, currentColor, sw 2, round — `Diretrizes/Ícones.md`): `SvgSearch`/`SvgMaximize`/`SvgMinimize`/`SvgLock`/`SvgPin`/`SvgFlame`; lista `NavSectionItems` das 5 seções (split de arquivos para o oxlint `react/only-export-components`).
- **`src-app/src/features/search/` (novo)**: Busca Geral Unificada — `search-index.ts` (`SECTIONS`/`CONFIGS`, `buildDynamicIndex` de exercícios + fichas A–J, `deaccent` normalizando acentos, `rank` com score e `best` por item, `queryIndex` com grupos `ordered` pelo melhor match, `flattenGroups`), `GlobalSearchOverlay.tsx` (grupos ordenados, `<mark>` nos matches, navegação ↑/↓/Enter/ESC, query vazia não navega, mount condicional em App para estado fresco e sem setState-em-effect), `search.css` (glass + tokens). Atalho Ctrl/Cmd+K; pick de seção navega, pick de exercício/ficha abre a Perfil→Treinos dirigindo `useTreinosStore.getState()` (zustand global), pick de config abre a Perfil no hub de configurações; ESC da busca tem guarda para não fechar o Perfil junto.
- **`src-app/src/features/lock/` (novo)**: Sistema de Bloqueio — `lock-store.ts` (`PIN_STORAGE_KEY`, `hashPin` djb2 hex+len, `getPinLength`, `verifyPin`, `isLockUsable`, `getLockTimeoutSec`, `lockPrefsChanged`, `useLockStore` nasce travado se utilizável, `lockApp`), `useAppLock.ts` (timeout por inatividade + re-arme em `academia:lock-prefs-changed`), `lock-wallpapers.ts` (`WALL_PRESETS` neon/grafite/violeta/magenta — fonte única movida de SettingsFeature — e `resolveWallpaper` por orientação), `LockScreen.tsx` (relógio/data, wallpaper, keypad 4–6 dígitos com auto-submit, shake/erro, biometria fake 1s, teclado físico, `onBiometric` limpa o PIN), `lock.css`. App monta `<LockScreen/>` no fim (acima de tudo quando travado).
- **`src-app/src/features/profile/profile-data.ts`**: `PREF_KEYS.sidebarPinned = 'academia_pref_sidebar_pinned'`.
- **`src-app/src/features/profile/ProfileFeature.tsx`**: listener `academia:profile-nav` (detail = `string[]` stack do HubShell) → `setNavStack` — a busca global abre o Perfil já na tela certa.
- **`src-app/src/features/settings/SettingsFeature.tsx`**: tela `seguranca` ganhou fluxo real de PIN — `pinLen`/`pinFormOpen`/`pinDraft`/`pinConfirm`/`pinError`, `updateLock` persiste + dispara `academia:lock-prefs-changed` e abre o form ao ligar sem PIN, `submitPin`/`removePin`/`resetPinForm`, **Trancar Agora** (só com PIN), notas reais das features (sem "Em breve" no bloqueio/wallpaper); badge do tile "Segurança" vira "Bloqueio Ativo" quando `enabled === 'true' && pinLen > 0`; keywords do tile `seguranca` expandidas (senha, pin, trancar, inatividade…).

### [Changed]
- **`src-app/src/lib/animations.ts`**: novo `slideSwap(strip, updateCallback, direction)` — fita de 500vw animada via Web Animations API com `flushSync` no commit (frame determinístico), entrada criada antes de cancelar a saída, `strip.getAnimations()?.cancel()` prévio e guarda de 580 ms no App (sai 200–220 + entra 320–340); **divergência consciente**: easing sem overshoot (quint-out mobile / cubic ease desktop) porque o overshoot vaza o fundo pela borda da fita — decisão documentada.
- **`src-app/src/App.tsx`**: shell — `<MobileTopBar/>` + `<DesktopSidebar/>` + wrapper `.shell-body` (só `<main>` dentro), `<GlobalSearchOverlay/>` montado condicionalmente, `<LockScreen/>` e `useAppLock()`, Ctrl/Cmd+K, ESC da busca com guarda no ESC do Perfil, `handleSearchPick`, `SECTIONS_ORDER = ['progresso','treinos','dashboard','social','loja']` usado em `navigateSection` (guard 580 ms) e no swipe.
- **`src-app/src/main.tsx`**: `import './styles/shell.css'` por último.
- **`src-app/src/features/workout/treinos/TreinosFeature.tsx`**: `showSearch = expanded || !!search.trim()` derivado (a busca global abre o input expandido sem efeito de setState).
- **`src-app/src/features/settings/SettingsFeature.tsx`**: importa `WALL_PRESETS` de `features/lock/lock-wallpapers.ts` (constante local removida — fonte única).

### [Fixed]
- **`src-app/src/features/lock/LockScreen.tsx` — PIN não era limpo após sucesso**: o componente permanece montado entre locks e `pin` ficava preenchido (destravava com um clique só na primeira vez); agora `setPin('')` em `tryPin` com sucesso e em `onBiometric`.
- **`src-app/src/features/search/search-index.ts` — busca quebrava com acentos**: "seguranca" não achava "Segurança"; `deaccent` com `normalize('NFD').replace(/[\u0300-\u036f]/g,'')` em toda consulta e nos campos indexados.

### [Removed]
- **Badges "EM BREVE" dos tiles Bloqueio do App e Wallpaper da Tela de Bloqueio** (Configurações → Segurança) — as duas features agora são reais (PIN/inatividade/biometria/wallpapers funcionais).

### Notas (verificação)
- **Comandos**: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (vite + PWA, dist 13:24) — todos em `src-app/`.
- **Teste CDP (`cdp-test-shell.mjs`, dev :5173): 43/43 PASS, 0 exceções JS** — casca mobile/desktop, busca (acentos, grupos ordenados, pick de seção/exercício/config), lock (PIN, biometria, inatividade, wallpapers, Trancar Agora), slide direcional e fullscreen manual. 11 screenshots inspecionados (`%TEMP%\opencode\shots-shell`).
- **Decisões/divergências conscientes vs. `NavigationShellStandalone.tsx`**: spring sem overshoot (vazamento de fundo), `flushSync` no commit, PIN hasheado (djb2), badges EM BREVE removidos, badge "Bloqueio Ativo" exige PIN criado, `WALL_PRESETS` movido para `features/lock/`, busca de Treinos dirigida via store global (sobrevive a unmount), `nav-section-items.tsx` split de `nav-items.tsx`.
- **Escopo**: apenas `src-app/` + docs (`CHANGELOG.md`, `system_map.json` → 3.5.33) — legado intocado; dev server :5173 segue ativo para demonstração.

## [v4.5.1-hub-root-settings] - 2026-10-09
*Os 5 tiles que viviam dentro do grupo "Configurações" foram promovidos à raiz do hub do Perfil, ao lado de Perfil, Progressão e Personalizar — o tile "Configurações" foi removido. A raiz agora tem 8 tiles (Perfil, Progressão, Personalizar, Sua Conta, Segurança e Acesso à Conta, Notificações, Esquema de Cores e Personalização, Acessibilidade/Exibição e PWA) + linha vermelha "Sair da Conta" (hubExtra da raiz). Botão "Backup" (headerActions) movido para o cabeçalho de Sua Conta. Cada tela de configuração ganhou eyebrow próprio (CONTA/SEGURANÇA/NOTIFICAÇÕES/CORES/EXIBIÇÃO). system_map.json → 3.5.32*

### [Changed]
- **`src-app/src/features/profile/ProfileFeature.tsx`**: raiz do hub — tile "Configurações" removido; `...settings.tiles` espalhado diretamente em `rootTiles` (o tile `conta` ganha keywords recursivas via `screenKeywords()`); `...settings.screens` espalhado em `rootScreens` (sem a tela-pai `configuracoes`); `hubExtra={settings.rootExtra}` move a linha "Sair da Conta" para a raiz; `SvgSliders20` removido (ficou órfão).
- **`src-app/src/features/settings/SettingsFeature.tsx`**: `rootExtra` e `headerActions` movidos para antes de `screens` (o `headerActions`/Backup é referenciado dentro da tela `conta`); eyebrows novos nas 5 telas (`ACADEMIA • CONTA/SEGURANÇA/NOTIFICAÇÕES/CORES/EXIBIÇÃO`); `conta` recebe `headerActions` (botão Backup).

### Notas (verificação)
- **Comandos**: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK — todos em `src-app/`.
- **Teste CDP (novo `cdp-test-hub-root.mjs`, dev :5173, perfil limpo, 390×844): 32/32 PASS, 0 exceções JS** — raiz com 8 tiles e SEM tile "Configurações"; Sua Conta/Segurança/Notificações/Cores/Exibição abrem direto da raiz; header de Sua Conta tem botão Backup; badge Segurança vira "Bloqueio Ativo"; busca "wallpaper"/"biometria"/"lembrete"/"backup" encontra o tile certo na raiz; 5 screenshots inspecionados (`%TEMP%\opencode\shots-hub-root`).
- **Escopo**: apenas `src-app/` + docs (`CHANGELOG.md`, `system_map.json` → 3.5.32) — legado intocado.

## [v4.5.0-settings-reorg] - 2026-10-09
*Hub de Configurações reorganizado no estilo do `SettingsStandalone.tsx` de referência (tipografia/design BEM `set-*` atuais mantidos): nova raiz com 5 tiles — "Sua Conta" (grupo: Informações da Conta, Alterar Senha, Exportar/Restaurar Backup, Desativar Conta placeholder), "Segurança e Acesso à Conta" (bloqueio do app, biometria, inatividade, wallpaper de bloqueio vertical/horizontal e dispositivos — placeholders com prefs salvas + aviso "Em breve"), "Notificações" (lembrete de horário de treino placeholder + Mensagens Motivacionais real), "Esquema de Cores e Personalização" (12 presets + tom personalizado + seletor, movido da antiga tela de Exibição) e "Acessibilidade, Exibição e PWA" (tela cheia, cronômetro, Navbar, Instalar PWA, sons/vibração/online, modo dev); linha vermelha "Sair da Conta" no fim da raiz; tile "Assinatura" removido (system_map.json → 3.5.31)*

### [Changed]
- **`src-app/src/features/settings/SettingsFeature.tsx` (reescrito)**: `useSettingsGroup()` agora devolve `{ tiles, screens, rootExtra, headerActions, modals }` (`quickbar` renomeado para `rootExtra`) com a árvore nova — `conta` é um **grupo** (tiles filhos + `screens` aninhadas: `informacoes` com nome/handle/email, `senha` isolada na própria leaf "Alterar Senha da Conta do Usuário", `exportar`/`restaurar` com botões Baixar .JSON / Selecionar arquivo, `desativar` placeholder com badge "EM BREVE" e botão desabilitado); `seguranca` (leaf com 3 cartões: Bloqueio do App — toggles "Ativar Bloqueio por Senha do App" e "Bloqueio por Impressão Digital" + chips de Intervalo de Inatividade [1/5/15/30 min, Desativado] —, Wallpaper da Tela de Bloqueio — cards Vertical 9:16 e Horizontal 16:9 com 4 presets de cor selecionáveis —, e Dispositivos Conectados com o aparelho atual "Este Dispositivo" via UA); `notificacoes` (toggle "Lembrete de Horário de Treino" + `input[type=time]` + toggle real "Mensagens Motivacionais"); `cores` (paleta movida integralmente da antiga `exibicao`: 12 presets + Tom Personalizado + ColorPickerModal); `exibicao` virou "Acessibilidade, Exibição e PWA" com Tela Cheia, Estilo do Cronômetro, Barra de Navegação, Instalar App (PWA), card "Preferências de Interação" (Sons/Vibração/Status Online) e Modo Desenvolvedor. Todos os placeholders persistem prefs no localStorage com nota "Em breve" (decisão do usuário); tile "Assinatura" (Gratuito/PRO) **removido**; ícones novos stroke viewBox 24/currentColor (`SvgShield`, `SvgUser20`, `SvgBell`, `SvgBan`, `SvgLogOut`, `SvgFingerprint`, `SvgSmartphone`, `SvgLaptop`, `SvgDownload20`, `SvgUpload20`); `SvgStar`/`SvgXSm`/`SvgShieldCheck` removidos junto com a Assinatura.
- **`src-app/src/features/profile/profile-data.ts`**: `PREF_KEYS` ganha 7 chaves de placeholder — `appLockEnabled`/`appLockBiometric`/`appLockTimeout`/`lockWallVertical`/`lockWallHorizontal`/`workoutReminder`/`workoutReminderTime` (todas `academia_pref_*`).
- **`src-app/src/features/profile/ProfileFeature.tsx`**: `extra: settings.rootExtra` (era `quickbar`); tile Configurações com descrição nova ("Conta, segurança, notificações, cores e PWA") e keywords recursivas (`screenKeywords()` agrega keywords das telas aninhadas — busca na raiz do hub alcança "wallpaper", "biometria", "lembrete" etc. dentro dos leaves).
- **`src-app/src/features/settings/settings.css`**: novos blocos `set-badge-soon` (badge âmbar "EM BREVE"), `set-chips`/`set-chip(--active)` (intervalo de inatividade), `set-wall-grid`/`set-wall-card`/`set-wall-preview--v|h`/`set-wall-dot(--active)` (pré-visualizações de wallpaper), `set-time` (input de horário, `color-scheme: dark`) e `set-logout`/`set-logout__body|title|desc` (linha vermelha de sair).

### [Removed]
- **Tile/tela "Assinatura"** (planos Gratuito/Academia PRO "EM BREVE") do hub de Configurações — CSS `.set-plans`/`.set-plan*` removido do `settings.css` (decisão do usuário: a nova estrutura não inclui assinatura).

### Notas (verificação)
- **Comandos**: `npx tsc -b` exit 0 · `npx oxlint src` exit 0 · `npm run build` OK (vite + PWA) — todos em `src-app/`.
- **Teste CDP (novo `cdp-test-settings-reorg.mjs`, dev :5173, perfil limpo, 390×844): 67/67 PASS, 0 exceções JS** — raiz com 5 tiles + linha Sair da Conta; grupo Sua Conta com 5 leaves (campos corretos em Informações vs Alterar Senha, botões de backup, desativar desabilitado + EM BREVE); Segurança: toggles/chips/wallpaper gravam as prefs (`app_lock_enabled/biometric/timeout=900/lock_wall_vertical=grafite`), badge do tile vira "Bloqueio Ativo", dispositivo atual listado; Notificações: reminder + horário 20:30 persistem, mensagens desliga; Cores: 12 presets, tema aplica, seletor abre/fecha; Exibição: 6 cartões (inclui PWA e Interação), sounds=false; toast "Sessão local" no Sair da Conta; prefs persistem após reload; busca "wallpaper"/"biometria"/"lembrete" encontra Configurações na raiz do hub. 8 screenshots inspecionados (`%TEMP%\opencode\shots-settings-reorg`).
- **Escopo**: apenas o app React (`src-app/`) + docs (`Diretrizes/CHANGELOG.md`, `Diretrizes/system_map.json` → 3.5.31) — legado (`treino.html`/`www/`) intocado.
- **Comportamento observado (pré-existente, não alterado)**: o hub do Perfil preserva a pilha de navegação entre aberturas (v4.3.0).

## [v4.4.0-fullscreen-pwa] - 2026-10-09
*Duas opções novas nas Configurações: (1) "Tela Cheia Automática" (Exibição) — recarregando a página com a pref ativa, qualquer primeiro clique do mouse ou toque em qualquer lugar da tela aciona instantaneamente o modo de tela cheia do navegador; (2) "Instalar App (PWA)" (Geral) — botão que dispara o prompt nativo de instalação do PWA (manifest + Service Worker já existiam via vite-plugin-pwa) (system_map.json → 3.5.30)*

### [Added]
- **`src-app/src/lib/auto-fullscreen.ts` (novo)**: motor da tela cheia automática — com a pref `academia_pref_auto_fullscreen === 'true'`, listeners de `pointerdown`/`touchstart`/`click` em capture no `document` chamam `documentElement.requestFullscreen()` no **primeiro gesto** de qualquer lugar da tela; rearma a cada carregamento de página (recarregar = novo primeiro gesto), reage ao evento `academia:auto-fullscreen-changed` (mudança da pref em sessão arma/desarma na hora), desarma após sucesso (`fullscreenchange`) e **não arma** onde a Fullscreen API não existe (iOS Safari — só suporta `<video>`) ou em display-mode `standalone` (app instalado já é "app", não navegador); tentativa recusada permanece armado (retry no próximo gesto), com guarda `attemptInFlight` contra chamadas concorrentes.
- **`src-app/src/lib/pwa-install.ts` (novo)**: captura do `beforeinstallprompt` em `initPwaInstall()` (registrado no `main.tsx` antes do render, porque o evento só é capturado se o listener já existir), `getInstallState()` (`'available' | 'installed' | 'unavailable'`, detectando standalone via `matchMedia('(display-mode: standalone)')` e `navigator.standalone` do iOS), `promptInstall()` (prompt + `userChoice`) e os eventos `academia:pwa-install-available`/`academia:pwa-installed` para a UI reagir em sessão.
- **`src-app/src/features/settings/SettingsFeature.tsx`**: (a) card **"Tela Cheia"** na tela `exibicao` (após Barra de Navegação) com toggle `Tela Cheia Automática` no padrão `set-toggle`/`set-switch` — `toggleAutoFullscreen()` grava `PREF_KEYS.autoFullscreen` e dispara `academia:auto-fullscreen-changed`; nota `set-note` alterna entre "Ativo: o próximo clique ou toque após recarregar entra em tela cheia…" e "Desativo…"; (b) card **"Instalar App (PWA)"** na tela `geral` com botão `set-btn set-btn--primary` (estado `available` → "Instalar agora" habilitado; `installed` → "App instalado" desabilitado; `unavailable` → desabilitado + nota com instruções do menu do navegador / "Adicionar à tela inicial" para navegadores sem `beforeinstallprompt`, ex.: iOS Safari) — `installState` sincronizado com os 3 eventos; (c) ícones `SvgMaximize` (cantos de expansão) e `SvgInstall` (smartphone + seta), ambos stroke viewBox 24 / `currentColor` conforme `Diretrizes/Ícones.md`; (d) keywords dos tiles expandidas (`tela`, `cheia`, `fullscreen`, `telacheia`, `maximizar` em exibicao; `instalar`, `pwa`, `app`, `aplicativo`, `install`, `home` em geral) — a busca da raiz do hub encontra as duas opções.
- **`src-app/src/features/profile/profile-data.ts`**: `PREF_KEYS.autoFullscreen = 'academia_pref_auto_fullscreen'` (valor `'true'`, default off).
- **`src-app/src/main.tsx`**: `initPwaInstall()` + `initAutoFullscreen()` chamados antes do `bootstrap()`/render.
- **`src-app/src/features/settings/settings.css`**: `.set-btn:disabled` (opacity 0.45, sem pointer-events) e bloco `.set-install` (botão largura cheia no card de instalação).

### [Fixed]
- **`src-app/src/App.tsx` — swipe quebrava com `e.target` não-Element**: o guard do `touchstart` chamava `t.closest(...)` sem checar se `t` é um Element — um `touchstart` sintético/alvo `document`/`window` derrubava com `TypeError: t.closest is not a function` (exposto pelo teste do gesto de tela cheia). Agora: `if (!t || typeof t.closest !== 'function') return;`.

### Notas (verificação)
- **Comandos**: `npx tsc -b` exit 0 · `npm run lint` (oxlint) sem avisos · `npm run build` OK (vite + PWA) — todos em `src-app/`.
- **Teste CDP (novo `cdp-test-fullscreen-pwa.mjs`, dev :5173, perfil limpo, 390×844): 24/24 PASS, 0 exceções JS** — pref inicial null; pref off → 1º gesto **não** chama `requestFullscreen`; card "Tela Cheia" em Exibição; toggle liga → pref `'true'` + nota "Ativo…"; em sessão o 1º gesto chama 1×; tentativa recusada permanece armado (retry) e o sucesso desarma (gestos seguintes não interceptados); desligar em sessão desarma na hora; **reload com pref on → 1º gesto aciona**; card "Instalar App (PWA)" em Geral com botão desabilitado + nota de fallback sem prompt; `beforeinstallprompt` falso → botão habilita, clique dispara `prompt()`, `appinstalled` vira "App instalado"; busca da raiz do hub por "fullscreen"/"instalar" encontra o grupo Configurações. 6 screenshots inspecionados (`%TEMP%\opencode\shots-fs-pwa`).
- **Escopo**: apenas o app React (`src-app/`) — a interface de Configurações vive no `SettingsFeature` (v4.1.0+); o app legado (`treino.html`/`www/`) não foi alterado.
- **Comportamento observado (pré-existente, não alterado)**: o hub do Perfil preserva a pilha de navegação entre aberturas (reabrir o overlay continua na última leaf; v4.3.0).

## [v4.3.2-navbar-flex] - 2026-10-09
*Nova opção nas Configurações → Exibição → Barra de Navegação: Fixa (comportamento legado, padrão) ou Flexível (recolhe ao deslizar para baixo e volta ao deslizar para cima dentro de .section-slide). Pref persistida em localStorage (academia_pref_navbar_mode); BottomNav alterna .bnav-hidden via listener de scroll em window capture com threshold de 8 px; classe CSS em globals.css (system_map.json → 3.5.29)*

### [Added]
- **`src-app/src/features/settings/SettingsFeature.tsx`**: seção "Barra de Navegação" na tela `exibicao` com duas opções (`set-opt` Fixa/Flexível) no padrão do Estilo do Cronômetro — `navbarMode` state, `selectNavbarMode()` persiste via `writeLS(PREF_KEYS.navbarMode)` e emite `CustomEvent('academia:navbar-mode-changed')`; ícones `SvgPin` e `SvgScrollY` (SVG stroke viewBox 24, currentColor — regra `Diretrizes/Ícones.md`); keywords do tile `exibicao` expandidas (`navbar`, `barra`, `navegacao`, `fixa`, `flexivel`, `rolagem`, `scroll`).
- **`src-app/src/features/profile/profile-data.ts`**: `PREF_KEYS.navbarMode = 'academia_pref_navbar_mode'` (valor `'fixed' | 'flexible'`, default `'fixed'`).
- **`src-app/src/components/BottomNav.tsx`**: lógica de scroll flexível — listener `scroll` em `window` (capture) filtra `.section-slide`, threshold de 8 px (down = esconde, up = mostra, top < 8 = sempre mostra); classe `.bnav-hidden` alternada via `classList.toggle`; troca de `activeSection` reseta e mostra; evento `academia:navbar-mode-changed` reseta quando a pref muda em sessão; modo Fixa nunca adiciona a classe (paridade legada).
- **`src-app/src/styles/globals.css`**: `.bottom-nav { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1) }` + `.bottom-nav.bnav-hidden { transform: translateY(100%) }` — regra nova, espelho `7-nav-icons.css` intacto.

### [Changed]
- Verificação CDP (`cdp-test-navbar-flex.mjs`): **13/13 PASS, 0 exceções JS** — pref inicial null/fixed; navbar visível sem bnav-hidden; perfil → Configurações → Sistema de Cores → Flexível; pref salva como `flexible`; opt ativa; scroll down esconde (`bnav-hidden` presente); scroll up mostra; top = mostra; troca de seção mostra; volta para Fixa; modo fixa não esconde ao rolar.

## [v4.3.1-cr-details-portal] - 2026-10-09
*Modal CR Details (Detalhes do exercício, aba Montar Ficha) abria fora da viewport no React — o position:fixed do .modal-overlay ficava preso no containing block do .section-strip (will-change:transform). Todos os 6 modais da seção Treinos agora usam createPortal(document.body), mesmo padrão já adotado pelo SocialFeature (system_map.json → 3.5.28)*

### [Fixed]
- **`src-app/src/features/workout/treinos/TreinosModals.tsx`**: helper `toBody = (node) => createPortal(node, document.body)` + envolvimento dos returns de `ConfirmModal`, `ImageModal`, `AerobicoModal`, `CRDetailsModal` e `MaestriaGeralModal` — sem o portal, o `.section-strip` (que tem `will-change: transform` para o translateX da navegação de seções) virava o containing block do `position:fixed` do `.modal-overlay` e o card saía da viewport (medido: x=745 numa tela de 390 px; após o fix: x=24).
- **`src-app/src/features/workout/treinos/ExercicioFormModal.tsx`**: mesmo helper `toBody` + portal no return de `modalExercicio` — mesmo bug de containing block.
- Causa-raiz idêntica à já corrigida em `SocialFeature.tsx` (v4.0.14-social-placeholder): qualquer `.modal-overlay` montado dentro de `.section-slide` precisa do portal para `document.body`.

### [Changed]
- Verificação CDP (`cdp-test-cr-details.mjs`): **23/23 PASS, 0 exceções JS** — nav Treinos → aba Montar Ficha → card menu → Detalhes → modal com nome/level/grupo/classe/descrição preenchidos, 3 dots + 3 panes (Descrição/Stats/Ilustração), 4 itens de stat, atalho de maestria, fechamento via X/ESC, reabertura, atalho EDITAR fecha o modal e abre o form. Screenshots confirmam paridade visual com o modal legado (`modais.html` L952–1031 + `openCRDetails` L1107–1263). DIAG pós-fix: card em x=24.95, y=40, w=340, h=764 (dentro do viewport 390×844), `elemAtCenter: cr-description-box`.

## [v4.3.0-profile-hub] - 2026-10-09
*Overlay do Perfil perdeu as 4 sub-abas (#perfTabNav) e virou um hub fullscreen de profundidade 2 no estilo do SettingsStandalone — raiz com 4 tiles de grupo (Perfil, Progressão, Personalizar, Configurações), HubShell com pilha de navegação controlada (navStack), SettingsFeature refactorado no hook useSettingsGroup embutido como grupo, busca só na raiz com keywords dos leaves agregadas (system_map.json → 3.5.27)*

### [Changed]
- **`src-app/src/features/settings/HubShell.tsx`**: estendido com pilha de navegação de profundidade N (props `navStack`/`onNavStackChange` opcionais — modo controlado usado pelo ProfileFeature, modo interno continua para reuso simples); `HubScreen` ganhou `content?`/`tiles?`/`screens?`/`head?`/`extra?`/`headerActions?`/`eyebrow?` (telas de grupo renderizam tiles filhos + head/extra; leaves renderizam content; `headerActions`/`eyebrow` sobrepõem os do shell e são herdados pelo descendente mais próximo da pilha); busca e `hubExtra` passaram a renderizar apenas na raiz (nos grupos as keywords dos leaves ficam agregadas nos tiles do grupo, então a busca da raiz alcança tudo); "Voltar" desempilha (`stack.slice(0,-1)`).
- **`src-app/src/features/settings/SettingsFeature.tsx`**: refactorado do componente `SettingsFeature` para o hook `useSettingsGroup({devMode, onToggleDevMode})` que devolve `{ tiles, screens, quickbar, headerActions, modals }` — mesma lógica/estado/handlers e mesmo DOM `set-*` das 4 telas (`exibicao`/`geral`/`seguranca`/`assinatura`), agora embutido como o grupo "Configurações" do hub raiz do Perfil; o componente wrapper foi removido (consumidor único era o ProfileFeature); modais (ColorPickerModal/confirm de import) e `<input type=file>` continuam no retorno `modals` para o consumidor renderizar fora do HubShell.
- **`src-app/src/features/profile/ProfileFeature.tsx`**: removidos o sistema de 4 sub-abas (`MainTab`, `initialTab`, estado `mainTab`, `selectMainTab`, `swapFade`, nav `#perfTabNav`, wrappers `#perf-tab-*`/`.perf-tab-content` e a chave `localStorage.academia_perfil_tab`); o componente agora é um hub fullscreen com `navStack` controlado e 4 tiles de grupo na raiz — Perfil (Cartão/Ofensivas/Medalhas), Progressão (dev row virou `head` do grupo + Visão Geral/Nível e XP/Conquistas), Personalizar (`#btnSalvarCustomizacaoTab` virou `headerActions` herdado pelo grupo e suas leaves + Identidade/Frase/Em Destaque/Título) e Configurações (`useSettingsGroup` embutido com quickbar de backup); busca na raiz com `groupKeywords()` agregando título+keywords dos tiles filhos; `#btnEditarPerfil` navega para `['personalizar','identidade']` via `setNavStack`; ícones 16 px das abas (`SvgUser`/`SvgActivity`/`SvgEdit`/`SvgSliders`) e imports `fadeSwap`/`flushSync`/`readLS` removidos, `SvgEdit20`/`SvgSliders20` adicionados para os tiles raiz.

### Notas (verificação)
- **Comandos**: `npx tsc -b` exit 0 · `npm run lint` (oxlint) sem avisos · `npm run build` OK (vite + PWA) — todos em `src-app/`.
- **Teste CDP do hub fullscreen (reescrito `cdp-test-hubs.mjs`, dev :5173, perfil limpo): 46/46 PASS, 0 exceções JS** — raiz 4 grupos + sem `#perfTabNav`/`.t-tab-btn` + X do overlay presente; busca "senha"/"ampulheta"→Configurações, "ofensivas"→Perfil, "titulo"→Personalizar; grupo Perfil 3 tiles sem busca; cartão com Editar navega p/ Identidade; back duplo volta à raiz; Progressão com dev row no grupo e sem dev row na leaf; Personalizar SALVAR herdado na leaf dispara toast; Configurações 4 tiles + quickbar + Backup; leaves (12 presets, 5 switches, campos segurança, 2 planos); mobile 390×844;10 screenshots gerados,2 inspecionados visualmente (hub raiz, grupo Perfil).

## [v4.2.0-profile-hubs] - 2026-10-09
*Abas PERFIL, PROGRESSÃO e PERSONALIZAR do overlay do Perfil viraram hubs com busca + tiles + telas no estilo das Configurações — shell genérico extraído para `features/settings/HubShell.tsx` (mesmo DOM `set-*`), cartão do perfil movido para dentro do hub, SALVAR do Personalizar no header e sub-navbars removidas (system_map.json → 3.5.26)*

### [Added]
- **`src-app/src/features/settings/HubShell.tsx` (novo)**: shell genérico de hub (props `eyebrow`/`title`/`sub`/`searchPlaceholder`/`emptyText`/`tiles`/`screens`/`headerActions`/`hubExtra`) que emite exatamente o DOM BEM `set-*` de settings.css (set-root / set-header / set-eyebrow / set-title / set-sub / set-screen / set-search / set-tiles / set-tile / set-empty) com back-stack interno (botão `.set-icon-btn` Voltar nas telas, `aria-label="Voltar para {title}"`), busca que filtra tiles por título/descrição/keywords e estado de busca preservado ao voltar ao hub; ícones SVG stroke ArrowLeft/Search/X/ChevronRight movidos para cá (`Diretrizes/Ícones.md`).

### [Changed]
- **`src-app/src/features/settings/SettingsFeature.tsx`**: refatorado para montar suas 4 telas (`exibicao`/`geral`/`seguranca`/`assinatura`) sobre o `HubShell` — mesmo DOM e UX (paridade verificada pelos40 checks do cdp-test); saíram daqui os estados `screen`/`search`, `filteredTiles`, `screenTitles` e os4 ícones do shell; tiles, quickbar de backup, modais (picker/confirm) e lógica permanecem inalterados.
- **`src-app/src/features/profile/ProfileFeature.tsx`**: abas perfil/progressão/personalizar passaram a usar `HubShell` com os conteúdos existentes:
  - **Perfil** (3 tiles: Cartão do Perfil / Ofensivas dos Amigos / Medalhas): o cartão (banner, avatar, estatísticas, emblemas, showcase, ações) **deixou de ser o bloco fixo acima das abas** e virou a tela "Cartão do Perfil" do hub, envolto em `.perf-sub-content` para herdar margens/animação legadas; telas de ofensivas/medalhas reutilizam os blocos `theme-turquesa`/`theme-ouro` existentes;
  - **Progressão** (3 tiles: Visão Geral / Nível e XP / Conquistas): a linha Modo Desenvolvedor permanece acima do hub; sub-navbar `.sub-nav-btn` (ids `perfProgressaoSubNav`, `data-perfsubtab`) removida — o conteúdo das3 sub-abas virou telas do hub;
  - **Personalizar** (4 tiles: Identidade / Frase de Assinatura / Em Destaque / Título): botão `#btnSalvarCustomizacaoTab` subiu para o header do hub (padrão Backup das Configurações: `set-btn` + ícone SVG, id preservado); sub-navbar `perfPersonalizarSubNav` removida;
  - removidos os estados `progSub`/`persSub` e os `swapFade('.perf-sub-content'/'.perf-sub-content3')` das sub-navs (o `swapFade('.perf-tab-content')` das abas principais permanece); adicionados9 ícones SVG stroke de tile (20 px: user/award/grid/bolt/star/chat/trending/type) + `SvgSave`; prefs segue delegando ao `SettingsFeature`.
- **`Diretrizes/system_map.json`**: `version` 3.5.25 → **3.5.26**, `last_updated` → 2026-10-09; entrada de `src-app/src/features/settings/` ganha o `HubShell.tsx` e propósito de `ProfileFeature.tsx` atualizado (hubs das abas, cartão movido, sub-navbars removidas).

### Notas (verificação)
- **Comandos**: `npm run lint` (oxlint) sem avisos · `npx tsc -b` exit 0 · `npm run build` OK (vite + PWA112 entradas) — todos em `src-app/`.
- **Teste CDP regressão das Configurações (`cdp-test.mjs`, perfil limpo): 40/40 PASS, 0 exceções JS** — paridade do DOM `set-*` com o HubShell confirmada.
- **Teste CDP dos hubs (novo `cdp-test-hubs.mjs`, perfil limpo): 30/30 PASS, 0 exceções JS** — hub Perfil3 tiles + busca filtra/limpa + card não é mais fixo; telas cartão/ofensivas/medalhas com back; Progressão com dev row acima +3 telas (streak/XP/badges montados); Personalizar4 tiles + SALVAR no header dispara toast `Identidade atualizada!` + preset de frase preenche o input + listas de destaque/título; prefs íntegro (4 tiles + quickbar); mobile390×844;9 screenshots gerados,5 inspecionados visualmente (hub perfil, cartão, progressão, conquistas, personalizar).

## [v4.1.0-settings] - 2026-10-08
*Nova interface dedicada de Configurações na aba PREFERÊNCIAS do overlay do Perfil — hub com busca/tiles/backup + 4 telas navegáveis (Cores, Geral, Segurança, Assinatura) no estilo de `SettingsStandalone.tsx`, com sistema de cores aprimorado: 12 presets + cor personalizada (hex) + seletor avançado (SV + matiz + hex) aplicando globalmente (system_map.json → 3.5.25)*

### [Added]
- **`src-app/src/features/settings/SettingsFeature.tsx` (novo)**: componente da aba prefs com hub `.set-root` (busca que filtra os 4 tiles, quickbar de backup Exportar/Importar com confirmação de import) e telas `exibicao` (grade dos 12 presets + "Tom Personalizado" + estilo do cronômetro Radar/Ampulheta), `geral` (4 toggles `PREF_KEYS` + Modo Desenvolvedor via props `devMode`/`onToggleDevMode`), `seguranca` (nome/handle/e-mail/senha via `useProfileState` — lógica idêntica à antiga, migrada) e `assinatura` (Gratuito/PRO "EM BREVE"); back-stack próprio com header `.set-header`, ~25 ícones SVG stroke inline (`Diretrizes/Ícones.md`), busca de configurações não implementada foi descartada junto com `academia_view_mode` (não era setting existente hoje).
- **`src-app/src/features/settings/theme-colors.ts` (novo)**: sistema de cores global — `THEME_PRESETS` (12 temas de `APP_THEMES` viram presets, tons exatos sem derivar), `normalizeHex`, `deriveTones` (HSL), `hexToHsv`/`hsvToHex`, `setThemeVars` (as 6 variáveis legadas: `--primary/light/dark/rgb/gradient/shadow`), `applyThemeColor`/`applyPresetColors` (sem persistir), `applyThemePreset`/`applyCustomTheme` (persistem `academia_theme` e a nova chave `academia_theme_custom_hex`) e `applySavedTheme` (boot).
- **`src-app/src/features/settings/ColorPickerModal.tsx` (novo)**: seletor avançado espelhando o `ColorSchemeModal` de `SettingsStandalone.tsx` — área S/V com pointer-capture, slider de matiz, campo hex, preview HSV; **aplicação live sem persistir** (`onPreview`), **reversão exata no cancelar** (`onClose` → `applySavedTheme()`) e persistência só em `onApply`; render via `createPortal(document.body)` (z-index 1100, precedente do SocialFeature) e ESC em listener **capture no `window`** com `stopPropagation()` para vencer o ESC do `App.tsx` que fecha o overlay do Perfil.
- **`src-app/src/features/settings/settings.css` (novo)**: CSS BEM `.set-*` completo (header/tiles/quickbar/cards/presets/custom-row/opts/toggles/switch/fields/plans/picker z1100/animações/responsivo), tokens locais `--set-*` e acentos via `rgba(var(--primary-rgb, 139, 92, 246), X)` com fallback inline (sem `color-mix`, sem escala `--color-primary-*` inexistente).

### [Changed]
- **`src-app/src/features/profile/ProfileFeature.tsx`**: o bloco JSX da sub-aba preferências (sub-navbar `config/geral/assinatura/seguranca` + ~500 linhas) foi substituído por `<SettingsFeature devMode={devMode} onToggleDevMode={...} />` dentro do mesmo `#perf-tab-prefs`; removidos os estados/handlers/efeitos locais que migraram integralmente (`prefsSub`, `theme`, `timerStyle`, `prefs`, `sec`, `fileRef`, `confirmOpen`/`pendingFile`, `saveSecurityField`, `handleExport`, `handleImportFile`, `confirmImport`/`cancelImport`, modal `.modal-confirm` raiz e `<input type=file>`) e os imports `APP_THEMES`/`THEME_TITLES`/`applyAppTheme`/`PREF_KEYS`/`exportBackupData`/`importBackupFile`.
- **`src-app/src/App.tsx`**: boot do tema `applyAppTheme(readLS('academia_theme') || 'purple')` → **`applySavedTheme()`** (restaura preset OU `academia_theme='custom'` + `academia_theme_custom_hex`); novo import de `@/features/settings/theme-colors`.
- **`Diretrizes/system_map.json`**: `version` 3.5.24 → **3.5.25** (`last_updated` segue 2026-10-08); nova entrada `src-app/src/features/settings/` em `system_modules` e props de `App.tsx`/`ProfileFeature.tsx` atualizadas (boot `applySavedTheme`, aba prefs delegando ao novo componente).

### Notas (verificação)
- **Comandos**: `npm run lint` (oxlint) sem avisos · `npx tsc -b` exit 0 · `npm run build` OK (vite + PWA 112 entradas) — todos em `src-app/`.
- **Teste visual/comportamental CDP (Chrome headless, perfil limpo): 40/40 PASS, 0 exceções JS** — busca filtra/limpa tiles, 12 presets, preset Verde grava `academia_theme=green` + `--primary=#22c55e`, picker com preview ao vivo **sem** persistir, **ESC fecha só o picker e reverte a cor**, Aplicar persiste `custom`/`#ff0066` globalmente, back ao hub, timerStyle `hourglass`→`radar`, 5 switches (prefs + dev ON/OFF), campos de segurança editáveis, 2 planos, hub mobile 390×844; 10 screenshots (`%TEMP%\opencode\shots`) inspecionados (hub/exibição/geral/segurança/assinatura/picker/mobile).
- **Fora de escopo consciente**: features só-referência não portadas (biometria/lock, notificações, wallpapers, devices), `academia_view_mode` (modo da ficha) e assinatura real (botão "EM BREVE", como no `SettingsStandalone.tsx`).

## [v4.0.14-social-placeholder] - 2026-10-08
*Aba SOCIAL preenchida com o conteúdo de `Ligas.html` como placeholder — 3 sub-abas (Liga/Amigos/Guilda), Caminho das Ligas, ranking com filtros, grid de amigos, guilda com chat/membros/doações/guerra e 3 modais — tipografia Rajdhani/tokens do app, superfícies glass translúcidas (fundo dinâmico da arena continua visível) e ícones SVG stroke no lugar dos emojis (system_map.json → version 3.5.24)*

### [Added]
- **`src-app/src/features/social/social.css` (novo)**: port visual de `Ligas.html` adaptado ao app — Rajdhani (`--font-primary`), títulos em caixa alta com letter-spacing, **somente design tokens + derivados locais `--soc-*`** (nenhum hex solto), superfícies **glass translúcidas** (`rgba` + `backdrop-filter`) para o `cr-bg-container` permanecer visível atrás da aba (o mockup usava body/card opaco), grid `1fr 340px` colapsando em 1 coluna ≤820px, ajustes mobile ≤480px, dropdown `.soc-select` no padrão premium exigido pelo `Diretrizes/README.md` (seta SVG data-uri) e classes `.soc-modal*` reaproveitando o `modal-overlay` legado (+ keyframe `socFadeIn`).
- **`src-app/src/features/social/SocialFeature.tsx`**: componente da aba com header + stats, 3 sub-abas, aba **Liga** (banner "Temporada 14: Forja de Titãs" + Caminho das Ligas com resgates + ranking filtrável Global/Brasil/Amigos), aba **Amigos** (grid com status, desafiar/assistir/perfil) e aba **Guilda** (4 pílulas: bate-papo local com envio, membros, doações com contador, guerra semanal com barras), 3 modais (duelo, adicionar amigo, perfil) com ESC/backdrop-to-close, toasts `showToast` e estado **local sem persistência** — placeholder com ações reais disparando "funcionalidade em breve!". Raiz `.treino-container.soc-root` (escopo dos tokens locais, inclusive para os modais irmãos).
- **`src-app/src/features/social/social-data.ts` + `social-icons.tsx`** (nesta sessão): mocks estáticos (leaderboard, amigos, guilda, doações, guerra, passos) e biblioteca de ícones SVG stroke (`viewBox 0 0 24 24`, `stroke="currentColor"`, `stroke-width 2`, round caps) — substituem todos os emojis do mockup (regra do `Diretrizes/Ícones.md`).

### [Changed]
- **`src-app/src/features/social/SocialFeature.tsx` → modais via `createPortal(…, document.body)`**: os 3 modais da aba saíram da árvore do `.section-strip` (que tem `transform: translateX()` na navegação de seções e, por isso, vira o *containing block* do `position:fixed` do `.modal-overlay`) — medido antes do fix: modal com `left: 855 px` numa viewport de 430 px (totalmente fora da tela). Com o portal eles ficam fixos na viewport como no legado (retângulo final medido 16..414 × 347..586 em 430×932, visível e centralizado).
- **`src-app/src/App.tsx`**: branch `activeSection === 'social'` deixou de renderizar o placeholder `.section-coming-soon` e agora monta `<SocialFeature />` dentro de `<div className="section-slide" data-section="social">` (scroll interno + `padding-bottom:260px` valem como nas outras seções); o branch da **Loja** foi separado e continua 1:1 com `treino.html` L197–207; novo import `SocialFeature`.
- **`Diretrizes/system_map.json`**: `version` 3.5.23 → **3.5.24**; `last_updated` → 2026-10-08 (feature Social + arquivos `features/social/*`).

### Notas
- **PLACEHOLDER consciente**: convites/ranking global/chat online/doações persistentes ficam para fase futura (pedido do usuário); por ora o comportamento roda em estado React local.
- `textos/vocabulário` renomeados do "Tetris Royale" para o app ("Academia Royale", guilda "Academia Masters BR").

## [v4.0.13-typography-docs] - 2026-10-07
*Regra nova para agentes: informar estimativa de prazo e progresso em tarefas demoradas (feedback do usuário sobre a duração da sessão de tipografia) (system_map.json → version 3.5.23)*

### [Added]
- **`Diretrizes/README.md` — nova regra 7 no "🤖 Guia para Agentes de IA"**: quando a tarefa puder demorar (diagnóstico de bug difícil, migração multi-arquivo, verificação visual exaustiva), o agente **não deve executar em silêncio até o fim** — deve informar ao usuário, logo no início, uma estimativa de conclusão e quantos passos restam (ex.: `≈4 passos: pins de CSS → medição CDP → regressões → documentação`) e atualizar o progresso a cada passo concluído. Motivo: o usuário apontou que a tarefa `v4.0.13-typography` demorou mais que o esperado sem retorno de progresso.
- **`www/Diretrizes/README.md`**: espelho idêntico da alteração acima (regra de espelhar `Diretrizes/` em `www/`).
- **`Diretrizes/system_map.json`**: `version` 3.5.22 → **3.5.23**; `documentation.files` do `Diretrizes/README.md` cita a regra 7.

## [v4.0.13-typography] - 2026-10-07
*Paridade de tipografia, cascata e layout raiz React vs legado: pins da cascata do Play CDN v3 (revert-layer), scroll interno do `.section-slide` restaurado, wrappers `.section-viewport`/`.section-strip`/`.section-slide` 1:1, cor herdada do body, tokens de card/fonte, thumb de scrollbar em gradiente, 7 pins de `backdrop-filter` e — grande achado da sessão — reparo do raster stale de 1–2 device px dos `.p-card` na troca de seção (Progresso 6239 → 65 diffs) (system_map.json → version 3.5.22)*

### [Added]
- **`src-app/src/App.tsx` → `repairSectionRaster()` (novo, chamado após cada `fadeSwap` de seção)**: o primeiro paint de uma seção montada depois do boot (ex.: Progresso ao clicar na navbar) é rasterizado ~1–2 device px fora em alguns `.p-card` com `backdrop-filter` — borda inferior do `.streak-card` em y890–891 vs y888–889 do legado, borda do `.weekly-summary-card` em y1214–1215 vs y1216–1217 e o ink do h3 "Sua Semana" ~2 px acima, ~3,5 mil px de diff por tela. Rects (10 casas decimais), computed styles, fontes e props de layer são idênticos ao legado — só a rasterização diverge, de forma determinística. Diagnóstico por CDP mostrou que **qualquer mudança real de estilo num ancestral do conteúdo (body/`#root`/main) repara o raster**, enquanto invalidações que não alteram valor computado (classe temporária, var não usada) não; toggle de `-webkit-font-smoothing: auto` em duas tasks (set 450 ms após a troca → remove 200 ms depois) zera as três regiões (0/780, 0/4480, 0/520) e deixa o valor final idêntico ao original (sem divergência de render em macOS). Teorias descartadas por medição: transform do `uiFadeIn` no `main` (com `animation:none` ou só-opacidade os bands permanecem), `will-change` do strip, font-smoothing aplicado antes do boot e o próprio strip. O legado nunca monta seção depois do boot (todas existem desde o início, troca via `translateX` no `.section-strip`) e não sofre do problema.
- **Wrappers `.section-viewport` > `.section-strip` > `.section-slide` no `App.tsx` (paridade de DOM de `treino.html` + `7-nav-icons.css` L18–47)**: `<main>` ganha a classe `treino-page` + altura definite (`h-screen`/`h-full`/`flex`/`min-h-0`) — a classe é obrigatória porque `main.css` declara `main{background-color:var(--background)}` opaco e `bg-dinamico.css` só anula isso em `.treino-page`; os slides de treinos/progresso ganham o wrapper `data-section` (ativa `padding-bottom:260px` e o scroll interno). NOTA: o strip sozinho **não** corrige o paint offset (medido: JSX desde a renderização inicial mantém os bands) — quem zera é o `repairSectionRaster`; o wrapper é paridade estrutural (comentário corrigido no arquivo).
- **Pins de cascata tipográfica em `src-app/src/styles/globals.css`** (requer Chrome/WebView 111+, mesma restrição do news-overlay): (1) `body{line-height:inherit}` — no legado o `body{line-height:inherit}` do Play CDN vence o `1.6` do main.css → 1.5; (2) `h1–h6{font-size/weight:revert-layer}` — utilities e depois preflight vencem, como no CDN; (3) `.text-xs…text-9xl{line-height:…}` com os valores absolutos em rem do TW3 (o TW4 gera razão unitária aplicada ao font-size do elemento, divergindo quando a font-size é sobrescrita — ex.: `#dashEmblemsValue` 9,75 px); (4) `* margin/padding: revert-layer` — derruba o reset `*{margin:0;padding:0}` do main.css para a cascata de camadas, para que as utilities (`.mb-6`, `-mt-2` do header do dashboard, mortas antes) voltem a vencer como no CDN.
- **7 pins de `backdrop-filter` em `globals.css` (não camadeados, folha posterior)**: `.cr-bg-container` (blur 24px), `.note-popover` (20px saturate 180%), `.cr-dropdown-menu` (15px), `.perfil-overlay__header` (16px), `.ficha-overlay-close`/`.profile-edit-btn` (8px) e `.missions-overlay .ms-bg-overlay` (0.5px) — o par `backdrop-filter` + `-webkit-backdrop-filter` do espelho é deduplicado para só o prefixado pelo lightningcss do build e `getComputedStyle` ficava `none` onde o legado reporta o blur (o alias já era pintado; correção de paridade não visual, injetar o nome não-prefixado não moveu 1 px).
- **Thumb de `::-webkit-scrollbar-thumb` com gradiente em `globals.css`**: espelha a injeção do `componentes/thememanager.js` (tema Escuro: `linear-gradient(135deg,#8b5cf6,#6d28d9)` e hover `#a78bfa→#8b5cf6`, `!important`) — o main.css espelhado só tem `background:var(--primary)` sólido. Divergência documentada: regra estática (o thememanager re-injeta ao trocar tema de app; o React não porta esse sistema).
- **Preflight de borda em `@layer base` (`globals.css`)**: `*,::before,::after{border-color:#e5e7eb}` — paridade com o `*{border-color:#e5e7eb}` do preflight TW3 do CDN (o do TW4 usa `currentColor`); com o body branco, toda borda sem cor explícita pintava branca no React onde o legado pinta cinza (ex.: `.dash-missions-pill`, 1 px rgb(229,231,235) vs rgb(255,255,255), ~1300 px por tela no dashboard).

### [Changed]
- **Scroll: arquitetura original do legado restaurada (`globals.css` + `App.tsx`)**: rollback anterior (`html/body{overflow:auto}`) removido — no legado o scroll acontece dentro de `.section-slide` (`overflow-y:auto` de `7-nav-icons.css`) com html/body travados e scrollbar clássica de 10 px (`main.css` L385); com o documento rolando, o slide ficava com 390 px em vez de 380 px (cards/colunas ~5 px mais largos + faixa roxa ausente). Agora `html,body{height:100%;overflow:hidden}` e o shell React usa altura definite até o slide; `body.ficha-overlay-open` segue com `overflow:hidden !important` (redundante, mantido por paridade).
- **Cor herdada**: `color:#ffffff` no reset de `html/body/#root` (`globals.css`), `text-white` no `<body>` do `src-app/index.html` e na div raiz do `App.tsx` (antes `text-[#e5e2e1]`) — paridade com `body{color:var(--text)}` do legado; o cinza derrubava a herança de títulos e textos sem cor própria (~26 níveis mais escuro).
- **`src-app/src/styles/design-tokens.css`**: `--card-border` 0.25 → **0.2** e `--card-hover` 0.35 → **0.25** — paridade com o `:root` do `1-core.css` L2 (bordas dos `.p-card` tingiam mais forte que o legado).
- **`src-app/src/styles/tailwind-legacy-theme.css`**: `--font-body-lg`/`--font-body-md` Rajdhani → **Outfit** (sem aspas, como o JSON inline do `treino.html`) — o Play CDN gera `.font-body-lg{font-family:Outfit}` sem fallback; corrige o pin da v4.0.10, que acreditava em herança de Rajdhani porque o `vendor/tailwind.min.css` não gera estas classes (medido no runtime do legado em 2026-10-07).
- **Background dinâmico**: `src-app/src/styles/dynamic-bg.css` (ad-hoc) **removido** e import removido do `main.tsx`; `.cr-bg-container{z-index:0}` em `globals.css` mantém a hierarquia visual (nó é filho de `#root` com fundo opaco, o `z-index:-10` do espelho `bg-dinamico.css` sumiria atrás dele). Divergência de valor, não visual (o espelho fica intacto).
- **`src-app/src/features/dashboard/DashboardFeature.tsx`**: `style={{display:'block'}}` removido do `.section-slide` (o CSS legado governa, como nos demais slides).
- **`Diretrizes/system_map.json`**: `version` 3.5.21 → **3.5.22**; `react_app.entry_points` do `App.tsx` (wrappers + `repairSectionRaster`), `react_app.styles` (globals reescrito: scroll restaurado, pins, dynamic-bg removido) e `known_gaps` (medições da paridade: progresso 65, treinos = nondeterminismo de GIFs, `state@R_treinos` null estrutural, `<html>` font-family do preflight não visual).
- **`context.md`**: estado/verificações/decisões da sessão atualizados ao final.

### [Verification]
- `npx tsc -b` exit 0; `npx oxlint src` exit 0 (**zero warnings**); `npm run build` OK — bundle `dist/assets/index-CGtinHH9.css` + `index-vvx8dXFq.js` (SW limpo via `%TEMP%\opencode\probe_sw.js` antes de cada medição).
- **Paridade medida (CDP 390×844 dpr2, `diff2.ps1` grade 6×12)**: **Progresso 6239 → 65 diffs** (só `r3c5` = célula de GIF; bandas de streak/weekly/h3 todas em **0**), **dashboard 1717** (GIF do radar, inalterado), treinos nondeterminístico (R-vs-R entre duas sessões idênticas = 36000 diffs = mesma ordem do L-vs-R — GIFs `<img>` não pausáveis por `getAnimations`).
- Tipografia: `%TEMP%\opencode\probe_text.js` **0 diffs**; `measure_fonts.js` **TOTAL seletores 0 / textos 0** (409 pareados de 425 visíveis; faces 12/12).
- Regressões: `verify_fixes.js` **14/14 PASS**, `verify_splash.js` **10/10 PASS**, `verify_click_after_splash.js` **6/6 PASS**.
- Cuidado de medição registrado: um `shot_L_dashboard` saiu com a splash do legado (boot lento pontual) e inflou o diff para 1,2 M — re-captura resolveu; e capturas clip com `scale:2`+DSF2 são 4× (as bandas vivem em y886/y978/y1214 da imagem full 780×1688).

## [v4.0.12-splash] - 2026-10-07
*Tela de carregamento (splash "Feature 9") do legado portada para o React: DOM + script inline idênticos ao `treino.html`, saída sincronizada com o `academia:db-ready` — e **não exibida quando há treino em andamento** (divergência deliberada, pedido do usuário) (system_map.json → version 3.5.21)*

### [Added]
- **`src-app/index.html` — splash `#splashScreen` (port 1:1 de `treino.html` L102–118)**: DOM completo como primeiro filho do `<body>` (antes do `#root`): `__bg` com `data-banner`, logo ACADEMIA/WORKOUT TRACKER, `__user`, barra com `__fill` e "Carregando...". O CSS da Feature 9 já estava espelhado em `src-app/src/legacy-style/treino/8-customizacao.css` L1979–2111 e entra no bundle via `legacy.css` — só faltava o DOM (nunca portado na Fase 1). A splash aparece desde o primeiro paint, antes do bundle carregar, como no legado.
- **Script inline de saída (port de `treino.html` L119–134 + `app.js` L477–488)**: banner (`data-banner`) e nome do usuário ("BEM-VINDO DE VOLTA") lidos **sincronamente** do `localStorage.academia_treino` antes de qualquer paint; no evento `academia:db-ready` (disparado sempre pelo `bootstrap()`) → `setTimeout` 100 ms → fill `width: 100%` → +400 ms → `.splash-screen--hidden` (transição de 0.7 s do CSS legado) — sequência literal da Feature 9. Fallback de 10 s esconde a splash se o bundle falhar (divergência de segurança: o legado não precisa, pois não tem bundle assíncrono).

### [Changed]
- **Divergência deliberada do legado (pedido do usuário em 2026-10-07)**: **com treino em andamento a splash não é exibida** — o script a remove do DOM logo no parse, antes de qualquer paint, então recarregar a página no meio do treino volta direto para o app. Flags espelham `app.js` L53–59: `workout_start_time` de hoje (`workout-store.ts`, chave removida ao encerrar o treino) **ou** `fichaEmAndamento` + `fichaEmAndamentoDate === hoje` no `academia_treino`. No legado a splash aparece em todo boot, inclusive com treino ativo. Como a splash só existe no carregamento da página (DOM estático, sem caminho de reexibição), um `academia:db-ready` posterior (ex.: `patchLegacyState`) nunca a reabre — treinos em curso nunca são interrompidos.
- **`Diretrizes/system_map.json`**: `version` 3.5.20 → **3.5.21**; `entry_points` do `src-app/index.html` documenta a splash + script inline.
- **`context.md`**: cabeçalho/estado (entrada `v4.0.12-splash`, 3.5.21, verificação 10/10 CDP), subseção na "O que foi feito", linha no mapa de arquivos, versão vigente e próximos passos.

### [Verification]
- `npx tsc -b` exit 0; `npx oxlint src` exit 0 (**zero warnings**); `npm run build` OK — `dist/index.html` contém `splashScreen`, o listener de `academia:db-ready` e a checagem `treinoAtivo` (script Node UTF-8).
- CDP (Chrome headless 390×844 dpr3, script `%TEMP%\opencode\verify_splash.js`, preview :4173): **10/10 PASS** — boot normal: splash presente, `position: fixed` + `z-index: 99999`, sai com `--hidden` + fill 100% após o `db-ready`, e um `db-ready` extra **não** reexibe; treino ativo via `workout_start_time` de hoje → splash **ausente** do DOM; treino ativo via `fichaEmAndamento` de hoje → splash **ausente**; banner `ouro-elite` + nome SIDNEY/"BEM-VINDO DE VOLTA" aplicados; screenshot da splash congelada salvo.
- **Regressão pós-entrega**: `verify_fixes.js` **14/14 PASS** (bugs v4.0.8 intactos após a mudança no `index.html`) e `verify_click_after_splash.js` **6/6 PASS** — splash escondida não intercepta interação (`pointer-events: none` + `visibility: hidden` computados, `elementFromPoint` fora da splash, clique real via CDP `Input.dispatchMouseEvent` na BottomNav alterna Treinos ↔ Dashboard); CSS `.splash-screen--hidden` byte a byte idêntico entre `www/Style/treino/8-customizacao.css` e o espelho React.
- Screenshots comparativos React (`:4173`) vs legado (`:8099/www/index.html`): **praticamente idênticos** — mesmo CSS espelhado + DOM idêntico (`position: fixed`, `z-index: 99999`, logo Outfit 41.6 px, barra em 0%). Origem do port conferida: `www/index.html` contém a splash + script inline.

## [v4.0.11-lombar-gif] - 2026-10-07
*GIF entregue pelo usuário para o exercício "Extensão Lombar" e conectado em todas as camadas: `ex-extensao-lombar` de `imagem: null` para o arquivo real no legado (raiz + espelho `www/`) e no seed React, com backfill idempotente para instalações existentes (system_map.json → version 3.5.20)*

### [Added]
- **`Assets/exerciciosgif/Extensão Lombar.gif` (novo, 1.515.678 bytes)**: arquivo entregue com o nome do exercício (mesma convenção dos demais GIFs). Espelhado em `www/Assets/exerciciosgif/` (regra do `Diretrizes/README.md` §"Espelhar as edições em `www/`") — 4 cópias conferidas por SHA-256 idêntico (`86B7EFA1…`): raiz, `www/`, `src-app/public/assets/exerciciosgif/` e `android/app/src/main/assets/public/assets/exerciciosgif/` (os dois últimos já continham o arquivo; os 4 diretórios estão com 65 arquivos).
- **`src-app/src/core/db/bootstrap.ts` — nova `backfillExerciseImages()`**: preenche `imageUrl` de exercícios pré-cadastrados cujo GIF só foi entregue depois do seed original — roda entre `ensureSeed()` e `migrateLegacyData()`, só toca em registros com `imageUrl` nulo e é idempotente. Sem ela, instalações existentes (IDB `academia-v4` já populado, incl. usuários migrados do legado) continuariam com `imageUrl: null`, pois o seed só popula tabelas vazias. Espelha a sincronização automática de imagens que o `loadDB()` legado já fazia (`JS/treino/db.js` L143–151: `ex.imagem !== defaultEx.imagem` → corrige).

### [Changed]
- **`JS/treino/db.js` L122 + espelho `www/JS/treino/db.js` (hashes idênticos)**: `ex-extensao-lombar` — `imagem: null` → `'./Assets/exerciciosgif/Extensão Lombar.gif'`. Instalações legadas existentes são corrigidas automaticamente no próximo `loadDB()` pela regra de sync de imagens (L148). Fecha o pendente da entrada `v3.5.6` ("GIF ainda não entregue — ao receber o arquivo, apontar `imagem` para ele").
- **`src-app/src/core/db/default-data.ts`**: `ex-extensao-lombar.imageUrl`: `null` → `"/assets/exerciciosgif/Extensão Lombar.gif"` (convenção das demais entradas — caminho em minúsculas por causa do Vercel/Linux).
- **`Diretrizes/system_map.json`**: `version` 3.5.19 → **3.5.20**; `core_db` (linha do `default-data.ts` — imagem do `ex-extensao-lombar` + nota do backfill) e `public_assets` (contagem de GIFs) atualizados.
- **`context.md`**: cabeçalho/estado (entrada `v4.0.11-lombar-gif`, system_map 3.5.20, HEAD `6a1d399` — paridade news commitada pelo usuário entre sessões, 7 paths de hoje pendentes), nova subseção na "O que foi feito" com os 5 passos do GIF, regras obrigatórias (versão vigente + aviso contra `JSON.stringify` no `system_map.json`) e próximos passos (lista de commit atualizada).

### [Verification]
- `npx tsc -b` exit 0; `npx oxlint src` exit 0 (**zero warnings**); `npm run build` OK — bundle `dist/assets/index-DpYmpvWT.js` contém o marcador `/assets/exerciciosgif/Extensão Lombar.gif` (script Node UTF-8) e o gif foi copiado para `dist/assets/exerciciosgif/`.
- HTTP (preview `:4173` + servidor de arquivos `:8099`): gif **200 / 1.515.678 bytes** em `/assets/exerciciosgif/…` (React), `/Assets/exerciciosgif/…` (raiz legada) e `/www/Assets/exerciciosgif/…` (espelho); `JS/treino/db.js` servido nas duas raizes contém o marcador (200); `www/index.html` 200.
- CDP (Chrome headless, script `%TEMP%\opencode\verify_lombar.js`): **5/5 PASS** — seed novo grava a URL no IDB; registro antigo forçado a `null` persiste; após reload o backfill restaura a URL; GIF 200:1515678 no preview.
- Sintaxe dos dois `db.js` validada com `node --check` (cópia `.mjs` em `%TEMP%`); espelhos raiz/`www` com hash idêntico.

## [v4.0.10-news-parity] - 2026-10-07
*Paridade visual do overlay de Notícias com o legado: correção da cascata Tailwind v4 vs CSS legado não camadeado (bloco `revert-layer`), port do footer legado para os 3 containers, tokens de tema corrigidos e fechamento da view de detalhe — lista e detalhe medidas com **zero diffs visuais** (system_map.json → version 3.5.19)*

### [Added]
- **`src-app/src/features/news/NewsOverlay.tsx` — port do footer legado (`FOOTER_HTML`)**: o HTML de `componentes/footer.js` L3–42 (idêntico em `www/componentes/footer.js`), incl. os 5 estilos inline dos ícones sociais que o `theme-integration.js` L609–613 injeta no runtime legado, é injetado via `dangerouslySetInnerHTML` nos 3 containers — `#news-footer-container` da lista e os `#news-detail-footer-container`/`#update-detail-footer-container` dos detalhes. Resolve a divergência consciente "os 3 containers de footer ficam vazios" da Fase 5 (decisão do usuário em 2026-10-07 de portar o rodapé).
- **`src-app/src/features/news/news-overlay.css` — bloco `v4.0.10-news-parity` (cascata)**: causa-raiz — no legado o `vendor/tailwind.min.css` (v3.4, **não camadeado**) carrega depois de `main.css` e as utilities vencem; aqui (Tailwind v4) as utilities vivem em `@layer utilities` e PERDEM para o CSS legado espelhado não camadeado. Correção escopada só no overlay: `.news-overlay *:not(footer)` com `margin/padding: revert-layer`; headings com `font-size/font-weight/line-height/letter-spacing: revert-layer` (+ `tracking-*` para `tracking-tight` do title); `p` com `font-size/line-height/color: revert-layer` + pin `line-height: 1.8` para p sem utility de lh própria (`text-[10px]`, `text-label-caps` — o build legado não gera a classe); raiz com `font-family: var(--font-family)` + `line-height: 1.5`; `.bg-gradient-to-t` neutralizado (`from-deep-void` não existe no build legado → `background-image: none`); ícone material com `font-size: revert-layer` + `line-height: 1` **exceto** dentro de `.premium-placeholder` (lá o `placeholders-animacoes.css` L47 — `.premium-placeholder span { font-size: 0.75rem; ... }` — já vence no legado e aqui, como no legado); `border-tertiary-fixed-dim*` (inexistente no build legado) → `#e5e7eb` do preflight e `<hr>` → `rgba(#494454, 0.2)` (só `border-outline-variant/20` vale); `.news-date` → `var(--color-neon-purple-glow)` (o `thememanager.js` L1054 injeta `theme.primaryLight !important`; tema padrão "Escuro" = `#c084fc`) e `.update-date` → `var(--text-secondary)` (`#cccccc`, sem regra no thememanager). Requer Chrome/WebView 111+ (`revert-layer`); mais antigos ignoram as regras e mantêm o comportamento anterior (degradação graciosa).

### [Fixed]
- **View de detalhe do news-overlay nunca havia sido medida** (última lacuna de paridade da Fase 5): 13 diffs visuais → **0**. Correções: date do detail com `line-height` 1.8 (23.4 px) e cor `#c084fc` (antes: 19.5 px + `text-primary-fixed-dim/80` que o build legado não gera); `letter-spacing` do `h1` −0.325 px (`tracking-tight`, antes −0.26 px do `main.css`); ícone `material-symbols` dos botões `btn-prev/btn-next` em 16 px com `line-height` 16 px (antes 24 px — a base do Google vencia a utility em camada; botões 136×39 → **128×33** iguais ao legado); ícone do hero em 9.75 px (antes 80 px — a regra nova não pode interferir nos `.premium-placeholder`, onde o legado vence por especificidade 0,1,1); `<hr>` e barra `border-t-[6px]` com as cores legadas (antes roxo/laranja das utilities `border-tertiary-fixed-dim/*` inexistentes no vendor — medido `rgba(73,68,84,0.2)` e `#e5e7eb`); conteúdo `p` em Rajdhani (antes Outfit via `font-body-lg`); token `on-surface-variant` `#cbc3d7` → `#cac4d0`.

### [Changed]
- **`src-app/src/styles/tailwind-legacy-theme.css`**: `--color-surface-container-highest` → `#36343b` e `--color-card-border` → `#e5e7eb` (utilities inexistentes no build legado: valores do `tailwind.config.js`/preflight, não o JSON inline do thememanager); `--color-on-surface-variant` → `#cac4d0`; `--font-body-lg`/`--font-body-md` `"Outfit"` → `"Rajdhani"` — o JSON inline tem "Outfit", mas o build legado **não gera** `.font-body-lg/.font-body-md` e o runtime herda Rajdhani (medido; tokens usados só pelo news-overlay).

### [Verification]
- `npx tsc -b` exit 0; `npx oxlint src` exit 0 (zero warnings); `npm run build` OK (bundle novo com `revert-layer`/footer via script Node UTF-8); `system_map.json` validado sem BOM (`checkjson.js` → 3.5.19).
- Medição CDP (390×844, animações congeladas, SW limpo via `Storage.clearDataForOrigin` + seed do `legacyDB`): **lista = 6 diffs** e **detalhe = 15 diffs — todas não-visuais** (serialização oklab vs rgba com valores exatos, `border-color` de elementos com `border-width: 0`, margens do `space-y` v3 `margin-top` no irmão seguinte vs v4 `margin-end` no anterior — gaps idênticos, todos os `xywh` batem). Screenshots `news_react.png`/`news_legacy.png` e `detail_react.png`/`detail_legacy.png` visualmente idênticos; band stats das 8 faixas ±1 nos dois pares. Scripts: `%TEMP%\opencode\measure_news.js`+`diff_measure.js` (lista), `probe_detail.js` (detalhe), `band_stats.ps1`.


## [v4.0.9-android] - 2026-10-06
*Build Android (Capacitor) apontando para o bundle React correto e correção do erro "Duplicate resources" no `assembleDebug`*

### [Changed]
- **`capacitor.config.json` — `webDir: "dist"` → `"src-app/dist"`**: o valor antigo apontava para `dist/` na raiz (build Vite estático de 01/10 que **não contém** a Fase 5/`NewsOverlay`/correções v4.0.8 — verificado por script: `ENTERRADAS=false` no bundle antigo). Agora o APK embute o build real do React (`src-app/dist` = `index-H7L16KK3.js`). `npx cap sync android` executado — `android/app/src/main/assets/public/` atualizado com o bundle novo.

### [Fixed]
- **`gradlew assembleDebug` falhava com "Duplicate resources" em ~todos os arquivos de `assets/public/`**: o merge de assets listava **o mesmo caminho duas vezes** (chave `public/...` idêntica + mesmo caminho absoluto), mas nenhum `.gradle` do projeto declara `sourceSets`/`srcDirs` duplicado — era **estado incremental stale** de `android/app/build/` de um build abortado anteriormente. `gradlew clean assembleDebug` resolveu (BUILD SUCCESSFUL).

### [Verification]
- JAVA_HOME da sessão contornado com o JBR do Android Studio (`C:\Program Files\Android\Android Studio\jbr`) — a variável de usuário aponta para `...\Eclipse Adoptium\jdk-21.0.2-hotspot` **inexistente** no disco (pendente de `setx` com aprovação do usuário).
- `npx cap sync android` OK → assets = `index-H7L16KK3.js` + `index-D9hB-1kn.css` (hash conferido com o `src-app/dist`).
- `gradlew clean assembleDebug`: **BUILD SUCCESSFUL in 6m 2s** (97 tasks) → `android/app/build/outputs/apk/debug/app-debug.apk` **29,3 MB** (06/10/2026 16:39).
- Observações: pasta `android/` é gitignored (só `capacitor.config.json` entra no git); `app/build.gradle` **não tem `signingConfig`** — release sai não assinado (debug ok); fluxo completo documentado em `Diretrizes/README.md` (seção "Build do App Android").

## [v4.0.8-bugfix] - 2026-10-06
*Correções dos 4 bugs reportados: cronômetro negativo ao iniciar, emblema de perfil ausente na aba Início, contador de treinos/ciclo desatualizado e ciclo exibindo total de dias em vez do total por ficha (system_map.json → version 3.5.18)*

### [Fixed]
- **`src-app/src/features/workout/FichaFeature.tsx` — cronômetro começava com tempo negativo (~1 s) ao iniciar treino**: o state `now` só era refrescado pelo intervalo de 1 s quando `isActive` ligava, então os primeiros ticks renderizavam `formatElapsed(startTime ? now - startTime : 0)` negativo (repro CDP: `-1:-8` → `00:01` só após o 1º intervalo). O efeito do cronômetro agora chama `setNow(Date.now())` imediatamente ao ativar (paridade com `initGlobalTimer`/`startInterval` de `secao-ficha.js` L988–1028, que executam `updateGlobalTimerUI()` na hora) e o display ganha a trava `Math.max(0, now - startTime)`.
- **`src-app/src/features/dashboard/DashboardFeature.tsx` — emblema de perfil selecionado não era exibido na aba Início**: `#dashAvatar` renderizava apenas o ícone estático `material-symbols-outlined shield_person`. Agora porta `applyProfileCustomization` (`secao-customizacao.js` L371–396): wrapper `.profile-avatar__emblem-wrapper` com `mix-blend-mode: screen` (+ `animate-pulse` quando `mainEmblemPulse !== false`), imagem do sprite via `SPRITESHEET_URL` (`position:absolute; width/height:300%; left/top` do `IDENTITY_EMBLEMS`) ou URL direta, fallback dicebear (`avatarSeed`, seed `Deceptivon`) e `data-frame` do `avatarFrame` — mesmo render já usado em `ProfileFeature.tsx` L331–352; fontes `IDENTITY_EMBLEMS`/`SPRITESHEET_URL` de `profile-data.ts`. `pc` vem de `useProfileState().customization ?? legacy.profileCustomization` (mesmo fallback do nome/banner).
- **`src-app/src/core/db/queries.ts` — contador de treinos/ciclo desatualizado + "total geral" (itens 3 e 4 do report)**: `getCycleStats` contava **DIAS** concluídos (`h.completed && date >= currentCycleStartDate`), enquanto o dashboard legado usa `getCycleProgress` (`secao-dashboard.js` L47–51) = **soma por ficha** do breakdown desde o início do ciclo (fallback `currentFichaWorkouts`). Consequências corrigidas: (a) um 2º treino do mesmo dia (A+B) não incrementava; (b) a flag transitória `completed` vira `false` ao trocar de ficha no meio da sessão (`setTodayTreino`/`selectSheetEntry`) e derrubava o contador para "menos 1" — era isso que parecia "não atualizar"; (c) a exibição era o total de dias ("geral") e não a soma das fichas A/B/…. Agora soma `completedKeys` por letra nos dias ≥ `currentCycleStartDate`, estável contra a flag transitória, mantendo `breakdown`/`startDate` e o fallback `currentFichaWorkouts` (legado: `sum(breakdown) || currentFichaWorkouts || 0`). A Progresso continua contando **dias** (paridade com `secao-progresso.js`, mesma assimetria do legado).
- **`src-app/src/App.tsx` — `handleOpenFicha` trocava a ficha sem recalcular `completed`**: usava o spread `{ ...e, sheetKey }`; agora usa `selectSheetEntry` (espelha `setTodayTreino`, `db.js` L440–451: `concluido = treinos.includes(letra)`), sincronizando com o `onSelectSheet` da própria Ficha.
- **`Diretrizes/system_map.json`**: `version` 3.5.17 → **3.5.18**; `react_app.entry_points` (`App.tsx` — selectSheetEntry), `core_db` (`queries.ts` — semântica por ficha do `getCycleStats`) e `react_app.known_gaps` (frase das correções v4.0.8) atualizados.

### [Changed]
- **`context.md`**: cabeçalho/estado (correções `v4.0.8-bugfix`, verificação 14/14 CDP, system_map 3.5.18), nova subseção na "O que foi feito" com os 4 bugs, mapa de arquivos (`queries.ts` + timers/emblema/sync em App/Ficha/Dashboard), regras obrigatórias (versão vigente `v4.0.8-bugfix`, 3.5.18) e próximos passos (confirmação da interpretação do item 4, git status corrigido — navfix já commitado em `960163e`; 7 paths do bugfix pendentes de commit).

### [Verification]
- `npx tsc -b` exit 0; `npx oxlint src -D warning` exit 0 (**zero warnings**); `npm run build` OK (`dist/assets/index-H7L16KK3.js` + `index-D9hB-1kn.css`); preview :4173 servindo o bundle novo (hash conferido).
- CDP (Chrome headless 390×844 dpr3, script `%TEMP%\opencode\verify_fixes.js`, origem limpa + migração com 10 dias concluídos, breakdown A:5/B:5, `currentCycleStartDate` 2026-09-26, `mainEmblem: 'estrela-alada'` sprite, `avatarFrame: 'ouro'`): **14/14 PASS** — emblema: wrapper presente, sprite do `SPRITESHEET_URL`, `animate-pulse`, `data-frame=ouro`, ícone estático removido; timer: 14 amostras em 1,1 s todas `00:00` (nenhuma negativa) e `00:02` após +1,3 s; ciclo: `10/30` inicial → `11/30` ao concluir A → **mantém `11/30`** na 1ª marca da ficha B no mesmo dia (código antigo regredia para `10/30`) → **`12/30`** ao concluir B no mesmo dia (antigo ficava `11/30`, o "total geral" de dias) → `12/30` final no Dashboard; seletor de fichas (`#dashSheetTabs [data-workout="B"]`) leva a sugestão a B e a Ficha abre `TREINO B`.
- `system_map.json` validado sem BOM via `checkjson.js` (`JSON OK 3.5.18`).

## [v4.0.7-phase5-navfix] - 2026-10-06
*Navbar inferior sem espaço morto no rodapé — padding de safe-area removido (system_map.json → version 3.5.17)*

### [Changed]
- **`src-app/src/styles/globals.css`**: novo rollback de `.bottom-nav` (`padding: 6px 4px`) sobre a regra de `src-app/src/legacy-style/treino/7-nav-icons.css` L81 (`padding: 6px 4px calc(6px + env(safe-area-inset-bottom))`). Em aparelhos/navegadores que reportam `safe-area-inset-bottom` (barra de gestos, notch, tela edge-to-edge) a barra crescia para baixo dos ícones, deixando uma faixa vazia e não utilizada no rodapé (pedido do usuário em 2026-10-06 com prints). Com o rollback a barra tem altura apenas do conteúdo: `6px + botão ~51px (ícone 26 + gap 3 + label ~10 + padding 12) + 6px ≈ 64px` (= `min-height: 64px` original, que permanece). `globals.css` é importado depois de `legacy.css` (`main.tsx`), portanto vence o seletor igual. **Divergência consciente da regra legada** (espelho `7-nav-icons.css` mantido intacto).
- **`Diretrizes/system_map.json`**: `version` 3.5.16 → **3.5.17**; `react_app.styles` cita também o rollback da navbar feito em `globals.css`.

### [Verification]
- `npx tsc -b` exit 0; `npx oxlint src` exit 0 com **zero warnings**; `npm run build` OK (`dist/assets/index-CT0DKUU3.js` + `index-CEYtTqum.css`).
- CSS do dist contém **2** regras `.bottom-nav` — a legada e o override `.bottom-nav{padding:6px 4px}` posicionado **depois** (ordem de cascata conferida por script Node UTF-8).
- CDP (Chrome headless, 390×844 dpr3): nav com `h=64`, `bottom=844=vh` (rente à borda), botão 51px, `padding` computado `6px 4px` e 3 regras casando com o elemento (reset + legada + override).
- Obs.: no desktop `env(safe-area-inset-bottom)` já era `0`, então a faixa só aparece em aparelhos com inset ≠ 0 (não reproduzível no headless) — usuário deve confirmar a correção no dispositivo.

## [v4.0.7-phase5] - 2026-10-06
*Paridade das pendências da migração React v4: cronômetro global do treino + confirmação ao sair, overlay de Notícias completo, placeholders Social/Loja com DOM legado e navbar inferior 1:1 com `7-nav-icons.css` (system_map.json → version 3.5.16)*

### [Added]
- **`src-app/src/features/news/NewsOverlay.tsx` + `news-overlay.css` (novos)**: port 1:1 de `#news-overlay` (`treino.html` L303–427 DOM/CSS + L429–599 comportamento) — 3 abas `noticias`/`atualizacoes`/`guias` (seta `tab-arrow`, `bg-[#8b5cf6]`, `drop-shadow` no ícone, `font-bold`/`font-medium`), seções `.tab-content`/`.active` com `newsFadeIn`, cartões `glass-panel` (4 notícias — o 1º com o rótulo "Notícias" no placeholder e a borda `border-primary/10`, como no legado — e 7 atualizações), botões `MOSTRAR MAIS` (equivalentes à remoção de `.hidden-news`/`.hidden-updates` + ocultação do wrapper), detail views `#news-detail-view`/`#update-detail-view` com `hidden-view`/`active` (slide de 300 ms), paginação `btn-prev`/`btn-next` com fade de 200 ms (`updateDetailContent`: o índice avança no clique e o DOM só muda após o timeout — `currentIndices` legado), conteúdo via `dangerouslySetInnerHTML` (strings literais L432–445), containers de footer mantidos vazios e lock de `body.overflow` (`openNewsOverlay` L505). O `<style>` inline foi extraído verbatim para `news-overlay.css` (as regras `!important` de `#news-main-view`/`main` substituem os atributos `style` inline).
- **`src-app/src/App.tsx` — cronômetro global do treino (item "contador de tempo") + confirmação ao sair (item "modal de confirmação") — a causa raiz dos dois era a mesma**: `handleOpenFicha(sheetKey)` (ligado ao `#dashBtnIniciar` "PRÓXIMO PASSO") espelha `startWorkoutFromDashboard` (`secao-dashboard.js` L276–304): grava o treino escolhido em `db.historico[today]` (`setTodayTreino` via `today-entry-store`, com guarda de `loaded` para não persistir uma entrada em branco), inicia o treino (`workout_start_time`) somente se não houver nenhum ativo e só então abre a Ficha. **Antes o timer nunca era iniciado** — `#globalWorkoutTimer` ("Duração do Treino") e `#btnStartWorkout` ficavam ocultos (`.btn-start-workout{display:none}` / `.active{display:flex}`) e o `#modalEncerrarTreino` era inalcançável a partir da Ficha.
- **`src-app/src/features/dashboard/DashboardFeature.tsx`**: `#dashBtnNoticias` chama `openNewsOverlay()` → `<NewsOverlay open onClose/>` montado junto ao `<MissionsOverlay/>` (o legado só permite abrir por aqui, `secao-dashboard.js` L366).

### [Changed]
- **`src-app/src/App.tsx`**: `handleStartWorkout` (prop `onStartWorkout` da Ficha) vira `startWorkout` + toast `Treino iniciado! Foco total!` **sem fechar a Ficha nem abrir modal** (initGlobalTimer L1007–1021); `#btnStartWorkout` com timer rodando (e o X da Ficha) seguem abrindo `#modalEncerrarTreino` (L1022–1027) — prop `onShowActiveWorkout` renomeada para `onRequestEncerrar` em `FichaFeature.tsx`; `onOpenFicha` do Dashboard agora recebe a letra efetiva (`(letter: SheetKey) => void`).
- **`src-app/src/App.tsx` — placeholders Social/Loja**: substitui o card Tailwind ad-hoc pelo DOM legado `.section-slide > .treino-container > .main-section > .section-coming-soon` (`treino.html` L184–207), com `💬`/`🛒`, `.cs-title` e **o texto correto de cada seção** (a Loja usava o subtítulo do Social) — reativando o CSS `7-nav-icons.css` L198–228 (incl. `padding-bottom: 260px` do `.section-slide .treino-container`).
- **`src-app/src/components/BottomNav.tsx` — navbar inferior otimizada**: DOM 1:1 com `treino.html` L1046–1077 removendo **todas** as utilities Tailwind conflitantes (`px-2 py-2`, `max-w-md mx-auto`, `z-40`, `bg-[#0a0514]/95`, `border-t border-[#8b5cf6]/30`, `text-[10px]`, `tracking-wider`, `py-1 px-3`, `w-5 h-5`, cores inline) e mantendo apenas `.bottom-nav`/`.bnav-btn`/`.bnav-icon`/`.bnav-label`/`.bnav-active-dot` de `7-nav-icons.css` + `data-section`, `id="bnavProgresso"…`, `role`/`aria-label` e `type="button"`. Causa da sobreposição dos labels: no App o CSS legado é **não camadeado** e vence as utilities do Tailwind v4 (que ficam em `@layer utilities`), então `padding`/`letter-spacing`/`font-size` divergiam e o conteúdo dos 5 botões (`flex:1`, `white-space:nowrap`) transbordava.
- **`Diretrizes/system_map.json`**: `version` 3.5.15 → **3.5.16**; `last_updated` → 2026-10-06; `react_app.description` ganha a Fase 5; `react_app.entry_points` de `App.tsx` reescrito (handleOpenFicha/timer/onRequestEncerrar/placeholders, sem `isWorkoutModalOpen`) + nova entrada `src-app/src/features/news/`; `react_app.known_gaps` atualizado (Fase 5 concluída, divergências resolvidas, `ActiveWorkoutModal` na lista de scaffold órfão, rest timer só no Modo Foco).

### [Removed]
- **`src-app/src/App.tsx`: fluxo do `ActiveWorkoutModal`** (`isWorkoutModalOpen`, `handleCloseWorkoutModal`, import e render): no legado o treino em andamento é conduzido pela Ficha (`btnStartWorkout` → `modalEncerrarTreino`); o modal era inalcançável na prática (só abria pelo botão oculto "INICIAR TREINO"). O arquivo `src-app/src/features/workout/ActiveWorkoutModal.tsx` permanece como scaffold não montado (junto aos 4 órfãos já documentados).

### [Divergências conscientes]
- `closeNewsOverlay` legado chama `window._transitionTo('dashboard')`; aqui basta fechar, pois o overlay só abre a partir do Dashboard (mesmo racional do `MissionsOverlay`).
- Os 3 contêineres de footer do overlay ficam vazios (o footer HTML injetado pelo legado não foi portado para o React).
- Swip horizontal com o overlay aberto não é excluído (idêntico ao `nav.js`): no React o Dashboard desmonta e o overlay some junto, enquanto o legado o mantém e force-a volta ao Dashboard ao fechar.
- Aba ativa do overlay mantém `transition-opacity` entre ativa/inativa (o markup inicial do legado só a tem na aba inativa; micro-divergência de 150 ms).

### [Verification]
- `npx tsc -b` exit 0; `npx oxlint src` exit 0 com **zero warnings** (1 warning `react(refs)` de render-phase ref corrigido); `npm run build` OK (bundle `index-6Ol1E3a_.js`, 902.575 B + CSS `index-CUvlxgwi.css`, 331.015 B) e PWA precache 112 entries.
- Strings no dist (script Node UTF-8): `news-overlay`, `MOSTRAR MAIS`, `Treino iniciado! Foco total!`, `Fechar notícias`, `ATUALIZAÇÕES`, `Príncipe das Trevas`, `Em breve! Itens, skins e upgrades exclusivos para sua jornada.`, `bnavDashboard`, `hidden-view`, `detail-view`, `Sair da Ficha?`, `Guias em breve`, `NOVA TEMPORADA` — todas presentes.
- Classes no CSS do bundle (script Node UTF-8): 19/20 probes — `bg-\[\#8b5cf6\]`, `z-\[110\]`, `border-t-\[6px\]`, `hover\:bg-red-500`, `shadow-\[0_0_15px_rgba…\]`, `text-neon-purple-glow`, `aspect-video`, `animate-bounce`, `news-overlay`, `section-coming-soon`, etc.; a única ausente é `float-animation`, **que também não existe em lugar nenhum do CSS legado** (no-op nos dois lados).
- Preview `vite preview --port 4173`: index 200 (1503 B) · `index-6Ol1E3a_.js` 200 (902.575 B, `text/javascript`) · `index-CUvlxgwi.css` 200 (331.015 B).
- Encoding: 6 arquivos novos/alterados sem BOM e sem `U+FFFD` (script Node).

## [v4.0.6-phase4-docs] - 2026-10-05
*Documentação de continuidade de sessão (system_map.json → version 3.5.15)*

### [Added]
- **`context.md` (novo, raiz do repo)**: arquivo de contexto entre sessões de IA — estado atual ao fim de 2026-10-05 (Fases 0–4 concluídas, verificação verde, 46 paths não commitados), resumo do que foi feito na sessão, mapa dos 8 arquivos da Fase 4 (`src-app/src/features/workout/treinos/`), decisões/divergências conscientes (deck compacto, swipe sem arrasto contínuo, banners duplicados, scaffold órfãos mantidos, Social/Loja ainda ad-hoc), regras obrigatórias (CHANGELOG, incremento do system_map com JSON sem BOM, comandos de verificação, gotchas do PowerShell 5.1) e próximos passos (commit, paridade Social/Loja, teste manual da seção Treinos, known_gaps, deploy Vercel com Root Directory `src-app`).

### [Changed]
- **`Diretrizes/system_map.json`**: `version` 3.5.14 → **3.5.15**; `documentation.files` passa a listar `context.md` como primeira entrada (leitura de continuidade junto com o system_map).

## [v4.0.6-phase4] - 2026-10-05
*Fase 4 (seção Treinos) da migração React v4 — CONCLUÍDA: port 1:1 de `componentes/secoes/treinos.html` + `JS/treino/secao-treinos.js`/`templates.js`/`montar.js`/`secao-customizacao.js` (8 arquivos de UI), navegação por swipe com exclusões do nav.js, substituição total do stub `SheetsFeature` e limpeza de warnings (oxlint 0) (system_map.json → version 3.5.14)*

### [Added]
- **`src-app/src/features/workout/treinos/treinos-store.ts` (novo)**: store zustand da seção (`mainTab` treinos/cardio, `subTab` montar/exercicios/deck, `deckLetter` A–J, `deckPage` 1/2, `deckView` grid/royale, `exView` colecao/lista, `filter`, `search`, `deckSearch` + setters) — defaults idênticos a `db.js` L43–47.
- **`src-app/src/features/workout/treinos/treinos-helpers.ts` (novo)**: `getSheet`/`mutateSheetIds`/`saveSheetAerobic`, `DECK_MAX = 8`, `addFromCollection`/`dropCollectionAt` (slot compacto), `swapSlots`/`removeFromDeck`, `deleteExerciseRecord`, `saveExerciseRecord` + `buildHistorico`, `startNewCycle`, `TEMPLATES_PRONTOS` (9) + `applyTemplate` (ciclo novo via recarregamento + toast `Template aplicado com sucesso!`), `computeDeckStats`.
- **`src-app/src/features/workout/treinos/cards.tsx` (novo)**: `ExImg` (fallback `.premium-placeholder`), `cargaHtml` (privado), `TreinosGridCard`, `TreinosCollectionCard` (menu `.card-menu` com `menu-active`), `DeckActiveSlot` (grid/royale, DnD, menu), `DeckEmptySlot` (`.deck-slot--empty`).
- **`src-app/src/features/workout/treinos/TreinosFeature.tsx` (novo)**: raiz da seção (`#section-treinos`) — header `.treinos-header` com busca expansível (`#searchInput`), toggles de view, abas `.t-tab-btn`/`.sub-nav-btn` com `fadeSwap`+`flushSync`+`fadeIn` (nav.js L136–204), eventos delegados `document` para `img-placeholder`→modal de imagem (app.js L338–345) e ESC fecha todos os overlays com `display:flex` (app.js L356–363), modais da seção montados com `key` (remontagem = init por `useState`).
- **`src-app/src/features/workout/treinos/ExercicioFormModal.tsx` (novo)**: modal de cadastro/edição (modais.html L104–253 + openNewExercicio/openEditExercicio L104–146) — chips de grupo, tags `[BANCO]/[PEGADA]/[DICA]`, `porLado`, upload de imagem 2 MB, gráfico `exChartContainer` de `historicoCargas`, toasts `Exercício cadastrado!`/`Exercício atualizado!`/`📈 RECORDE!`, erro `Preencha nome e grupo muscular.`, `Imagem muito grande (máx. 2MB).`.
- **`src-app/src/features/workout/treinos/TreinosModals.tsx` (novo)**: `ConfirmModal` (exclusão `Excluir exercício?`), `ImageModal`, `AerobicoModal` (AE_OPTIONS, pré-fill, `Cardio salvo!`), `CRDetailsModal` (level `floor(sessoes/5)+1`, classe Aparelho/Peso Livre, CR_STATS, 3 tabs com dots + swipe 50 px, atalho de maestria, editar), `MaestriaGeralModal` (`computeMasteryTotals`, `royale-cards` frame-{bc}).
- **`src-app/src/features/workout/treinos/CustomizacaoTabs.tsx` (novo)**: sub-abas `personalizacao/identidade/itens-magicos/emotes/emblemas` (`CustomizacaoSubTabs`) espelhando `_initItensMagicos`/`_initEmotes`/`_initIdentidade`/`_initEmblemas` (secao-customizacao.js L1256–1424): 42 banners (masters duplicados por design, regex `EXTRA_KEYS`), avatares, molduras, barras/cronômetro/cards, estandartes (máx. 3), emblema de identidade + pulso; toasts literais de bloqueio/equipar; `useEffect([pc]) → applyCustomizationGlobals(pc)`.
- **`barSkinPreviewStyle(skinKey)` (profile-data.ts)**: espelha `_getPreviewStyle` (L810–817) — retorna `{background?, boxShadow?}` para preview inline.
- **Swipe horizontal de seção (App.tsx)**: port da intenção de `nav.js` L207–298 — threshold `20%` da largura ou `150 px`, exclusões idênticas (`.table-scroll-wrap`, `.month-grid`, `.theme-colors`, `.treino-selector`, `.modal-overlay`, `.perfil-overlay`, `.ficha-overlay`, `[draggable=true]` dentro de `#tab-montar`, `input`, `textarea`), guard `animatingRef` (~150 ms) + dispatch `sectionchange`, ordem `progresso→treinos→dashboard→social→loja`.
- **`src-app/src/core/auth/use-auth.ts` (novo)**: hook `useAuth` extraído de `auth-context.tsx` (fast-refresh: arquivo só de hook; `AuthContext`/`AuthContextValue` exportados do módulo de provider).

### [Changed]
- **`src-app/src/App.tsx`**: `activeSection === 'treinos'` renderiza `<TreinosFeature/>` (antes `<SheetsFeature onStartWorkout/>`); `navigateSection` vira `useCallback` com guard de animação; import de `useAuth` passa a `@/core/auth/use-auth`.
- **`src-app/src/core/db/schema.ts`**: `ExerciseTag` ganha `'Unilateral' | 'Explosão' | 'Mobilidade'` (chips reais do form legado, modais.html L145–160).
- **`src-app/src/features/profile/profile-data.ts`**: `barSkinPreviewStyle` retorna objeto CSS (antes string) para uso direto em `style={}`.
- **Warnings de lint zerados** (`npx oxlint src` → 0): `user-store` (import morto), `ShareModal` (`totalVol` via `reduce`), `HistoryFeature` (`Flame`/`loading`), `ProgressoFeature` (4× `new Date()` impuro → constante de módulo `TODAY_BASE`), `auth-context` (loading inicial deriva de `isSupabaseConfigured`), `cards.tsx` (`cargaHtml` privado) + todos os `set-state-in-effect` dos novos arquivos (init via remontagem com `key` em `ExercicioFormModal`/`AerobicoModal`/`CRDetailsModal`, menu do deck derivado, sync de emblema/pulso via padrão "adjust state on prop change").

### [Removed]
- **`src-app/src/features/workout/SheetsFeature.tsx`**: stub Tailwind/motion da seção Treinos, agora órfão após o port (código morto + 8 warnings associados).
- **Divergências conscientes do port** (documentadas na Fase 4): `modalPicker` (morto no legado, não portado), `modalLevelUp` (omitido), deck com `exerciseIds: string[]` compacto (splice perde posição na remoção; legado usava nulls — incompatível com `fichaIds.every()`), swipe sem arrasto contínuo da fita (só detecção de intenção + troca no fim).

### [Verification]
- `npx tsc -b` exit 0; `npx oxlint src` exit 0 com **zero warnings**; `npm run build` OK (bundle `index-yH6pIC_5.js`, 996 KB).
- Strings no dist (script Node UTF-8): 40/40 presentes — `Exercício cadastrado!`, `Máximo de 8 exercícios atingido!`, `Template aplicado com sucesso!`, `Desbloqueie este banner primeiro!`, `Skin de cronômetro bloqueada!`, `será removido permanentemente.`, `.table-scroll-wrap`, `.treino-selector`, `.deck-slot`, `t-tab-btn`, `sub-nav-btn`, `exercicios-grid`, `collection-grid`, `deck-active-grid`, `templates-grid`, `banner-grid`, `identity-emblems-grid`, `frame-grid`, etc.
- Encoding: 13 arquivos novos/alterados sem BOM e sem `U+FFFD` (script Node).
- Preview `vite preview --port 4173`: index 200 (1503 bytes, `id="root"`, asset `index-yH6pIC_5.js`); servidor encerrado (PID 8876) ao final.

## [v4.0.5-phase3] - 2026-10-05
*Fase 3 (gamificação) da migração React v4 — CONCLUÍDA: Radar Fit real, modal de conclusão + modalEncerrarTreino, maestria, share card (treino/conquista/radar), volume detalhado, coleção de exercícios + maestria individual, Modo Foco, overlay de missões e animações fadeSwap/fadeIn (system_map.json → version 3.5.13)*

### [Added]
- **`src-app/src/features/gamification/radar.ts` (novo)**: port do Radar Fit legado — `computeRadarStats(data, mode)` (fórmulas literais de intensidade/volume/constância/foco/especificidade com cardio via `sheet.aerobic.tempo`, foco via `hist.focusMin ?? legacy.historico[date].duracaoFoco`), `getArchetypeBadge(stats, tier)` (rawStats = stats × tier → **Bárbaro/Força de Ogro/Mestre Ninja**, tiers 5–9, gradientes `MÁQUINA`/`VERSÁTIL`/`EQUILÍBRIO`), `buildRadarSvgHtml` (SVG 6 eixos idêntico ao legado, gradiente `ui-fade-in`), efeitos colaterais de conquistas `r_*` + evolução de tier (`r_tierN` → `legacyState.radarTier` via novo `patchLegacyState`), com guarda `sideEffectsArmed`/`consumeRadarSideEffects` (re-armada por troca de modo — espelha `rerenderAllRadarInstances`).
- **`src-app/src/features/gamification/useRadarFit.ts` (novo)**: store zustand `useRadarMode` (`'mensal'|'total'`, compartilhado entre Dashboard/Progresso/Perfil) + hook `useRadarFit`.
- **`src-app/src/features/gamification/RadarChart.tsx` (novo)**: container com SVG via `dangerouslySetInnerHTML` + `fadeIn` a cada troca (`#dashRadarChartContainer`/`#radarChartContainer`).
- **`src-app/src/features/gamification/maestria.ts` (novo)**: `MAESTRIA_CHALLENGES` (bronze 5/15/30, prata 50/75/100, ouro 150/200/300), `getMaestriaState` (respeita `localStorage.academia_dev_mode`), `trackMaestriaSessoes` (incrementa `totalSessoes` em `legacy.maestrias` via `patchLegacyState`, pula `ae-*`), `computeMasteryTotals` (XP/título PRATICANTE→LENDA DA MAESTRIA).
- **`src-app/src/core/db/legacy-state.ts` (novo)**: único caminho de escrita pós-migração em `legacyState` (`patchLegacyState`: merge + IDB + dispatch `academia:db-ready`).
- **`src-app/src/lib/animations.ts` (novo)**: `fadeIn(...els)` e `fadeSwap(el, cb)` portados de `db.js` (L603–644), usando as classes `.ui-fade-in/.ui-fade-out` já existentes no CSS legado.
- **`src-app/src/features/workout/ConclusaoModal.tsx` (novo)**: port 1:1 de `showConclusao` (secao-ficha.js L421–495) + DOM `modais.html` L1–37 — `#modalConclusao` com confete (`launchConfetti`), stats (Exercícios/Séries/Vol. Médio/Tempo/Grupos), mensagens de marco (Semana Perfeita a cada streak%7, marco a cada totalWorkouts%5), ordem legada: para cronômetro e grava duração → `trackMaestriaSessoes` ANTES de limpar → limpa `checks`/`seriesDone` → confete; botão `COMPARTILHAR TREINO` abre o share card.
- **`src-app/src/features/gamification/share-store.ts` + `share-quotes.ts` + `ShareModal.tsx` (novos)**: `#modalShare` com os 3 cards alternados (treino `#shareCard` com stats/highlights do top-3 por volume, conquista `#shareCardBadge`, radar `#shareCardRadar` com clone do SVG ativo), 407 frases `QUOTES` extraídas de `secao-perfil.js`, botões `COMPARTILHAR` (Web Share API → clipboard → download, igual a `shareImageNow` L807–886) e `BAIXAR IMAGEM` (`downloadShareImage` L774–805, `meu-{kind}-{data}.jpg`), com html2canvas via import dinâmico.
- **`html2canvas`**: dependência npm instalada (legado carrega via CDN em `treino.html:1328`).
- **`src-app/src/features/training/volume-line-chart.ts` (novo)**: `buildVolumeLineChartSvg(history, width, height)` — port literal de `renderVolumeLineChart` (secao-progresso.js L679–768: estado vazio, gradiente `#volAreaGrad`, média, pico/último, labels).
- **`openVolumeDetails` (ProgressoFeature)**: `#modalVolumeDetails` (modais.html L829–855) com line chart do grupo, legenda com `Média`, contagem de exercícios e lista `.vol-ex-row` por período; `VolumeEntry.breakdown` do período atual + `trendInfo` (`UP/DOWN_TREND_ICON` literais, divergência documentada: legado mostra `+X%` mesmo em queda — React mantém o literal com paridade).
- **`src-app/src/features/gamification/maestria-ui.ts` + `ColecaoModals.tsx` (novos)**: store `useMaestriaUi` (coleção/maestriaEx/busca) + `#modalColecaoExercicios` (grid `.colecao-card`, badge do grupo via `grupoBadgeClass`, count `{n}/{n}`, header com `computeMasteryTotals`, **busca funcional** por nome — o legado filtrava por `.colecao-item` errado e o filtro era morto) + `#modalMaestriaEx` (shield `royale-badge-shield badge-tier-*`, 3 estrelas, desafios com estados completed/locked/active, level-tabs, footer de volta à coleção) + `showRoyaleTooltip` imperativo (port L1023–1068).
- **`src-app/src/features/workout/FocusModal.tsx` (novo)**: Modo Foco fullscreen (`#modalFocus`, modais.html L410–462) — `startFocusMode`/`updateFocusUI`/`focusCheck` (secao-ficha.js L754–923): snapshot da ficha ao abrir (`sessionStorage.focusStartTime`), navegação por exercício, botões de série `.btn-set-focus`, descanso de 60 s (`toggleCheckEntry` → `rest:60`) sincronizando `#focusTimerVal` (`MM:SS`/`DESCANSAR`), auto-avanço com 1.5 s (guarda por índice), conclusão atômica do dia (treinos[] + `concluido` + `duracaoFoco`→`focusMin`, **sem cardio** — bloco legado L885–922 literal, ao contrário de `applyFichaCompletion`) fechando o modal + `showConclusao` após 1.5 s; animação `focus-anim` (remove→reflow→add).
- **`src-app/src/features/dashboard/MissionsOverlay.tsx` + `missions-overlay.css` (novos)**: overlay de missões (`treino.html` L903–1254) — `<style>` inline extraído verbatim para CSS, 3 abas (`msSwitchTab` daily/weekly/guides), `openMissionsOverlay`/`closeMissionsOverlay` (lock de `body.overflow`, reset p/ daily), pílula do widget clicável (`#dashBtnMissoes`); **mockup estático fiel ao legado** (contadores `0/N` hardcoded — o Vanilla não tem lógica/reset/XP de missões).

### [Changed]
- **`src-app/src/core/db/queries.ts`**: novo export `formatSeconds` (port de db.js L395) e `grupoBadgeClass` (port literal de db.js L551–553: mapa `íéóáãâ`); `LegacyRaw.maestrias` corrigido para `Record<string, { totalSessoes?, nivel?, challenges? }>`.
- **`src-app/src/core/db/schema.ts`**: `WorkoutHistory.focusMin?: number` (legado `duracaoFoco`); `legacy-migrator.ts` passa a mapeá-lo.
- **`src-app/src/App.tsx`**: `handleFecharFicha` (com treino ativo → `#modalEncerrarTreino`, port de `closeFichaOverlay`), `handleEncerrarConfirmar` (grava duração → `finishWorkout` → toast `Treino finalizado! Ótimo trabalho.` → se todos marcados abre `ConclusaoModal` senão dashboard — port de `btnEncerrarConfirmar`+`encerrarTreinoGlobal`), DOM de `#modalEncerrarTreino` (`modais.html` L364–374), `<ConclusaoModal/>`, `<ShareModal/>` e `<ColecaoModals/>`, lock único de `body.overflow` (encerrar/conclusão/share/coleção+maestria), prop `onWorkoutCompleted` no `<FichaFeature/>`, `navigateSection` com `fadeSwap`/`fadeIn` no `<main>` (nav.js L135–161).
- **`src-app/src/features/workout/FichaFeature.tsx`**: efeito de transição 400 ms para `onWorkoutCompleted` (guarda `wasDoneRef`/`completedCbRef`, espelha L312/L368, **suprimido com o Modo Foco aberto** — o foco conclui com 1.5 s), botão `ÚLTIMO TREINO` (`#fichaDoneActions`) abre o share card, FAB `#btnStartFocus` ligado (`startFocusMode` + `<FocusModal/>`), `fadeSwap` na troca de view table/grid/deck e na seleção de ficha `.sel-btn` (app.js L90–96, com toast `Treino X selecionado!`), `fadeIn` do container ativo a cada re-render de dados (secao-ficha.js L153/L212/L271).
- **`src-app/src/features/profile/ProfileFeature.tsx`**: `#btnVerColecao` → `useMaestriaUi.openColecao()` (substitui o aviso "em breve"), `swapFade` nas 4 abas/sub-abas (secao-perfil.js L915–1063: `fadeSwap` 120 ms → troca via `flushSync` → `fadeIn` 280 ms), `fadeIn` no `#badgesGrid` a cada re-render de conquistas (`renderBadges` L1248), badges desbloqueados com clique → share card e auto-abertura 1 s após novo desbloqueio natural, `#profileArchetype` sai de `display:none` (`inline-flex` com cor/borda do tier).
- **`src-app/src/features/training/ProgressoFeature.tsx`**: radar real + botões `btnRadarMensal/Total` no store, botão `?` → `#modalRadarGuide` (DOM `modais.html` L649–737), botão `COMPARTILHAR RADAR` → share card (clone do SVG), `#modalVolumeDetails` + legendas clicáveis (ver Added), `fadeIn` no calendário mensal, planner semanal, `weekDaysGrid`, donut de volume e cards do toggle mensal/semanal (secao-progresso.js L115/L258/L402/L586 + app.js L108–130).
- **`src-app/src/features/dashboard/DashboardFeature.tsx`**: placeholder do radar → `<RadarChart containerId="dashRadarChartContainer" gradientId="dashRadarGrad"/>`; botões MENSAL/TOTAL no store; `#dashBtnMissoes` abre o `<MissionsOverlay/>` (antes `onClick={stop}`).
- **`src-app/package.json`**: `html2canvas@1.4.1`.

### [Verification]
- `npx tsc -b` OK; `npx oxlint src` exit 0 (warnings pré-existentes: SheetsFeature/auth-context/ProgressoFeature purity/ShareModal/HistoryFeature/user-store); `npm run build` OK (bundle 942 KB + CSS 320 KB).
- Strings no dist: `Alcançou o Tier`, `Bárbaro`, `TREINO CONCLUÍDO!`, `SIM, ENCERRAR`, `modalEncerrarTreino`, `modalConclusao`, `modalShare`, `shareCardRadar`, `BAIXAR IMAGEM`, `modalVolumeDetails`, `volDetList`, `MINHA COLEÇÃO`, `modalColecaoExercicios`, `athleticRank`, `royale-task-row`, `modalFocus`, `Sair do Modo Foco`, `Adicione exercícios à ficha`, `Excelente! Descansando`, `missions-overlay`, `MISSÃO DE MAIO`, `ms-tab-btn`, `ui-fade-in`, `focusStartTime`, `selecionado!` — todas presentes (funções internas minificadas).
- Preview `vite preview --port 4173`: index 200 (1503 bytes), CSS 200 (319.977 bytes), JS 200 (942.797 bytes) — conteúdo real, não fallback SPA; preview encerrado ao final.

### [Known gaps desta etapa]
- **Seção Treinos (montar/exercícios/deck) ainda é o stub `SheetsFeature`** (Tailwind/motion, não portado) — consequência: os `fadeIn` de `secao-treinos.js` (L98/L449/L661) e das sub-abas `#section-treinos` (nav.js L193) ficam para a Fase 4 (port da seção).
- `#btnMaestriaGeral` do footer de `treinos.html` (entrada de `modalMaestriaGeral`/`openMaestriaGeral`) e `modalCRDetails` (shortcut de maestria no ficha): não portados — o footer legado não existe no App.
- `modalLevelUp` não existe no DOM legado (`showLevelUpModal` é no-op) → deliberadamente omitido.
- Overlay de missões é **estático por design legado** (sem cálculo/reset/XP de missões no Vanilla v3.5.7); a pílula do widget mostra o progresso real do ciclo.
- Bugs legados deliberadamente corrigidos: filtro da coleção funcional (legado morto por `.colecao-item` errado); legenda de volume `+X%` com paridade literal.
- Divergências mantidas da Fase 1: `handleCloseWorkoutModal` chama `cancelWorkout()`; clique em `#btnStartWorkout` com timer ativo abre `ActiveWorkoutModal` (não `modalEncerrarTreino`) — o encerrar só dispara pelo X do ficha-overlay.

## [v4.0.4-phase2] - 2026-10-05
*Fase 2 da migração React v4: overlay do Perfil com as 4 abas (Perfil, Progressão, Personalizar, Preferências), estado `profileState` no IndexedDB v3, temas/identidade/backup em paridade com o legado (system_map.json → version 3.5.11)*

### [Added]
- **`src-app/src/features/profile/ProfileFeature.tsx` (novo)**: port 1:1 do conteúdo de `componentes/secoes/perfil.html` (545 linhas) — cabeçalho do perfil (banner, avatar com emblema de identidade/sprite, nome, título, handle, assinatura, stats mini, 3 slots de emblemas, showcase card, botões ADICIONAR AMIGOS/VER COLEÇÃO), nav `#perfTabNav` com 4 abas (ícones SVG iguais ao legado, aba ativa salva em `localStorage.academia_perfil_tab`, migração `config→prefs`), aba **Perfil** (ofensivas dos amigos, medals preview), aba **Progressão** (toggle Modo Desenvolvedor com reversão ao desligar, sub-navbar `.sub-nav-btn` com Visão Geral/Nível e XP/Conquistas, badges `.badge-item.unlocked` com auto-save de `b1..b6` naturais em `profileState.conquistas`), aba **Personalizar** (sub-abas Identidade/Frase/Destaque/Título com drafts locais, presets de frases, opções de showcase com valores calculados, títulos com lock+hint e botão `SALVAR ALTERAÇÕES` → toast `Identidade atualizada!`), aba **Preferências** (sub-abas Configurações/Geral/Assinatura/Segurança: rádio `timerStyle`, 12 swatches de tema, export/import de backup com `modalConfirm` idêntico ao legado, 4 toggles em localStorage, cards de plano, 4 campos de segurança com save por campo → toast `Campo atualizado!`).
- **`src-app/src/features/profile/profile-data.ts`**: catálogos e helpers do Perfil — `APP_THEMES`/`THEME_TITLES`/`applyAppTheme` (12 temas → vars CSS + `academia_theme`), `PREF_KEYS`, `isDevMode`, `getProfileStats` (treinos/XP/nível/streak/maxStreak/maestrias/ciclos), `isUnlocked`/`unlockHint`, `getBadgeDefinitions` (b1..b6 + especiais `r_*`), `SHOWCASE_STATS` (5), `FRASES_PRESET` (10), `TITULOS` (8), `EMBLEMAS` (16), `IDENTITY_EMBLEMS` (14), `AVATAR_FRAMES`, `BANNERS` (42), `BAR_SKINS`/`CARD_SKINS`/`TIMER_SKINS` + `BAR_SKIN_STYLES`, `applyBarSkinToDOM`, `applyCustomizationGlobals` (body `data-bar-skin`/`data-card-skin`, banner do dashboard), `revertLockedCustomizations` (checkAndRevert L1175), `handleText`, `tituloNome`, `emblemForSlot`.
- **`src-app/src/features/profile/useProfileState.ts` (novo)**: hook `useProfileState()` — leitura/upsert do registro `profileState` no IndexedDB com `clone` por JSON, listeners de `academia:db-ready` e `academia:profile-updated` (`PROFILE_UPDATED_EVENT`).
- **`src-app/src/features/profile/backup.ts` (novo)**: `buildLegacyBackup` (parte bruta `legacy` + override de exercicios/fichas/historico/profileCustomization/selectedEmblems/conquistas, `reverseImagePath` para `./Assets/…`), `exportBackupData()` (share→download `academia_backup_YYYY-MM-DD.json`), `importBackupFile()` (valida e substitui tudo + dispatch `academia:db-ready`).
- **`src-app/src/lib/toast.ts` (novo)**: `showToast(msg, type)` espelhando `JS/treino/db.js` (container `#toastContainer.toast-container`, auto-remove aos 3000 ms + fade 350 ms).
- **`src-app/src/core/db/schema.ts`**: tipos `ProfileCustomization`/`ProfileConquista`/`ProfileState` + `DEFAULT_PROFILE_CUSTOMIZATION` (defaults do legado: DECEPTIVON/@deceptivon/banner roxo-neon/mainEmblem prestigio-1…).

### [Changed]
- **`src-app/src/core/db/idb.ts`**: versão 3 com tabela `profileState: 'key'` + helpers `getProfileState`/`saveProfileState`.
- **`src-app/src/core/db/legacy-migrator.ts`**: extração de `migrateLegacyObject()` e novos `ensureProfileState()` (deriva o estado do perfil da cópia bruta, idempotente), `validateBackup()` (réplica de `validateBackup` L62–157) e `importLegacyBackup()` (valida, limpa tabelas, re-migra e re-marcia migrado).
- **`src-app/src/core/db/bootstrap.ts`**: chama `ensureProfileState()` após a migração (antes do flush/`db-ready`).
- **`src-app/src/App.tsx`**: shell do overlay `#perfil-overlay` (`.perfil-overlay__header` com `Meu Perfil`/`Personalize sua jornada` + `#perfilOverlayClose`, `.perfil-overlay__scroll` com `<ProfileFeature/>`), classe `body.perfil-overlay-open`, animação `is-closing` (240 ms) + ESC fechando e voltando sempre ao Dashboard (réplica de `perfil-overlay.js`), `applyAppTheme(localStorage)` no mount, `#toastContainer` no raiz.
- **`src-app/src/features/dashboard/DashboardFeature.tsx`**: nome do cabeçalho (`#dashProfileCard`) lido de `profileState.customization.nome` (fallback `legacy.profileCustomization.nome`) e `data-banner` derivado do estado do perfil.

### [Verification]
- `npx tsc -b` OK; `npx oxlint` sem erros/warnings nos arquivos alterados; `npm run build` OK (~14 s).
- Strings legadas no bundle (`Meu Perfil`, `Personalize sua jornada`, `SALVAR ALTERAÇÕES`, `SEGURANÇA E CONTA`, `MODO DESENVOLVEDOR`, `Em Destaque no Perfil`, `academia_perfil_tab`, `academia_dev_mode`, `EM BREVE`…) e seletores CSS no `dist` (`.perfil-overlay__header`, `.perf-tab-content`, `.showcase-stat-option`, `.titulo-option`, `.sec-input`, `.pref-toggle-item`, `.t-color`, `.frase-preset-btn`, `.customizacao-modal__save-btn`, `.toast-container`, `.showcase-card`).
- Preview `vite preview --port 4173`: index 200 (1416 bytes), CSS 200 (316 KB), bundle JS 200 (843 KB) — conteúdo real, não fallback SPA.

### [Known gaps desta etapa]
- **Badge de arquétipo do perfil** (`#profileArchetype`): permanece `display:none` — depende do Radar Fit (Fase 3), assim como `updateProfileArchetypeBadge`.
- **Modal de share de conquista** (`modalShareBadge`/`openShareBadge`): não portado; o auto-save das conquistas continua gravando `b1..b6` sem abrir o share card (Fase 3).
- **Animações `fadeSwap`/`fadeIn`** das abas: substituídas pela animação nativa `perfTabIn` já presente no CSS legado (`.perf-tab-content`), com render condicional no lugar de `display:none`.
- **Coleção de exercícios** (`openColecaoExercicios`): botão `VER COLEÇÃO` exibe aviso "em breve" (modal pertence à Fase 3); botão `ADICIONAR AMIGOS` sem handler (igual ao legado).
- `timerStyle` dos rádios grava `localStorage.timerStyle` (consumido pelo cronômetro) e não `profileCustomization.timerSkin`, idêntico ao comportamento do legado.

## [v4.0.3-phase1] - 2026-10-05
*Fase 1 (visual) da migração React v4, parte 2: port 1:1 da tela Progresso (ciclo, streak, semana, calendário, stats, volume, 1RM) e troca da seção no App — Fase 1 CONCLUÍDA (system_map.json → version 3.5.10)*

### [Added]
- **`src-app/src/features/training/ProgressoFeature.tsx` (novo)**: port 1:1 de `componentes/secoes/progresso.html` + `JS/treino/secao-progresso.js` — card do ciclo (label `Ciclo de Treino Atual`, breakdown por letra recalculado do histórico, `startDate = legacyState.currentCycleStartDate || today()`), streak (`getStreak`), Sua Semana (`.ws-days` com chips de evento e duração), toggle mensal/semanal (`.calendar-view-toggle`), calendário mensal (`.month-grid`/`.month-day` com níveis por volume, streak de dias, chips, `.day-event-dot`, navegação `prevDisabled` em jan/2026), planner semanal (`.planner-week` com porcentagens por dia), stats (treinos/semana, média de carga, exercícios dominados), volume de carga (donut `conic-gradient`, legenda com setas ↑/↓ e % vs. período anterior, filtro 7 dias/30 dias/tudo e select por exercício), radar placeholder com botões MENSAL/TOTAL, calculadora 1RM (fórmula de Brzycki) e modal `#modalDayHist` (histórico do dia selecionado).
- **`buildConicGradient`/`formatT`/`exerciseVolume`** internos do `ProgressoFeature` — réplicas de `renderVolumeSemanal` (L437) e `calc` (L409) de `secao-progresso.js`, com datas no fuso local (equivalente BR do `toISOString()` do legado).

### [Changed]
- **`src-app/src/App.tsx`**: a seção `progresso` agora renderiza `<ProgressoFeature/>` no lugar de `<HistoryFeature/>` (arquivo `HistoryFeature.tsx` mantido intacto para a limpeza da Fase 4).
- **`src-app/src/core/db/queries.ts` — `getCycleStats`**: reescrito para recálculo fresco a partir da data de início (`startDate` agora sempre não-nulo, derivado de `legacyState.currentCycleStartDate || today()`), refletindo o ciclo real do usuário em vez de valor congelado.

### [Verification]
- `npx tsc -b` OK; `npx oxlint` sem erros (apenas warnings pré-existentes + purity de `new Date()` dentro de `useMemo`); `npm run build` OK (~20 s).
- Strings legadas conferidas no bundle (`Ciclo de Treino Atual`, `Sua Semana`, `Calculadora de 1RM`, `modalDayHist`, `INICIAR TREINO`…) e seletores CSS no `dist` (`.cycle-card`, `.month-grid`, `.planner-week`, `.modal-overlay`, `.volume-chart`, `.radar-card`…).
- Preview `vite preview --port 4173`: index 200, bundle JS 766 KB, `/vendor/fonts.css` e `/assets/bg/bg1.jpg` 200 (conteúdo real, não fallback SPA).

### [Known gaps desta etapa]
- Radar é placeholder SVG; `openVolumeDetails` (detalhes do volume) sem modal; `#modalDayHist` não trava o `overflow` do body; animações `fadeSwap`/`fadeIn` não portadas. `.month-day.missed`, `.volume-card` e `.day-event-dot` são hooks sem estilo **também no CSS legado original** (mantidos por paridade).


## [v4.0.2-phase1] - 2026-10-05
*Fase 1 (visual) da migração React v4, parte 1: tema Tailwind do legado, Dashboard 1:1 com seletor de fichas e Ficha do Dia com checks/séries/conclusão reais (system_map.json → version 3.5.9)*

### [Added]
- **`src-app/src/styles/tailwind-legacy-theme.css` (novo)**: `@theme` gerado pelo script `%TEMP%/opencode/gen-tailwind-theme.js` direto do `<script>` do `treino.html` — 54 cores (`prestige-gold`, `chest-red`, `electric-purple`…) e 8 fontes (`font-label-caps`=Rajdhani, `font-body`=Outfit, `font-data-mono`=Inter…). Importado no topo do `globals.css`; sem ele, as classes utilitárias usadas pelo JSX (`bg-surface-container-high`, `text-on-surface-variant`, `border-outline-variant`…) não eram geradas.
- **`src-app/src/core/db/queries.ts` + `src-app/src/hooks/useLocalData.ts` (novos)**: contrato de dados das 3 telas da Fase 1 — `loadLocalData()` (exercises/sheets/history/legacyState), `SHEET_ORDER`, `today()` local, `formatCarga`, `getStreak`, `getXp`, `getTodayTreino`/`determineNextTreino` (espelham `db.js`), `getCycleStats`, `getAverageLoad`, `getMasteredCount`, `todayLabel`, `getTodayEntry` e as mutações puras `toggleCheckEntry`/`toggleSetEntry`/`selectSheetEntry`/`applyFichaCompletion` (réplicas de `toggleCheck`/`toggleSeriesSet`/`setTodayTreino` + bloco atômico `concluido+treinos` de `secao-ficha.js`).
- **`src-app/src/features/dashboard/SheetSelectorModal.tsx` (novo)**: port 1:1 do `#modalSeletorFichas` (`componentes/secoes/modais.html`) — abas A–J com shield SVG na ativa, mini-deck `.dash-mini-deck__grid` de `deck-card card-{grupoMuscular}`, linha de cardio, footer com volume médio/m/cardio e ciclo de fichas via `#dashMiniSwapBtn`; letra controlada pelo Dashboard (deriva da sugestão do dia).
- **`src-app/src/features/workout/FichaFeature.tsx` (novo)**: port 1:1 da Ficha do Dia (`ficha.html` + `secao-ficha.js` + `templates.js`) — hero (`treino-hero`, `statTotalEx`/`statFichas`/`statStreak` com SVG de fogo), `ficha-header-bar` (badge/data/INICIAR-ENCERRAR/selector de views/A–J), `global-timer`, banner de sugestão, barra de progresso, FAB FOCO, views tabela/grid/deck com `fichaTableRow`/`fichaGridCard`/`fichaDeckCard`, cards e linha de cardio, `row-done`, `.btn-set` por série, anotações e empty state. Substitui `SheetsFeature` dentro do overlay em `App.tsx` (SheetsFeature continua na seção `treinos`).
- **`src-app/src/store/today-entry-store.ts` (novo)**: estado de `db.historico[today()]` (checks, séries, `completed`, `completedKeys`) com persistência em `workoutHistory` ([userId+date]) e propagação via `academia:db-ready`; guarda de concorrência (`pending`/`reloadQueued`) evita regredir a UI durante escritas em voo.
- **`schema.ts`**: `WorkoutHistory.seriesDone?: Record<string, boolean[]>` (série a série do dia), `WorkoutHistory.completedKeys?: string[]` (legado `treinos[]`) e `Exercise.notes?` (legado `anotacoes`).

### [Changed]
- **`DashboardFeature.tsx` reescrito**: agora emite o DOM legado de `componentes/secoes/dashboard.html` (calling-card, `dash-missions-pill`, arena card com radar placeholder, card sugerido, ciclo e elementos de compat ocultos), com dados pelas fórmulas legadas (XP = dias concluídos × 10, nível = `floor(xp/100)+1`, barra = `xp % 100`, sugestão = `historico[hoy].treino || determineTreinoDoDia`). `SheetSelectorModal` montado no final.
- **`legacy-migrator.ts`**: migra `anotacoes → notes`, `seriesDone` e `treinos → completedKeys`; auto-cura espelhando `migrarHistoricoLegado` (entradas `concluido:true` sem `treinos[]` ganham `[treino]`).
- **`workout-store.ts`**: persiste `workout_start_time`/`workout_sheet_key` no localStorage (mesmas chaves do `initGlobalTimer` legado) e restaura `isActive/sheetKey/startTime` no reload — o cronômetro global e o botão "ENCERRAR TREINO" sobrevivem ao refresh.
- **`ActiveWorkoutModal.tsx`**: lista os exercícios REAIS da ficha em execução (antes usava `DEFAULT_EXERCISES` fixo), faz merge da entrada de hoje ao concluir (preserva `seriesDone`/`completedKeys`, adiciona a letra a `completedKeys`) e dispara `academia:db-ready`.
- **`App.tsx`**: `isWorkoutModalOpen` — INICIAR abre o modal e ENCERRAR o reabre; renderização do modal exige `isActive && isWorkoutModalOpen`.
- **`getTodayTreino` (queries.ts)**: passou a espelhar estritamente `determineTreinoDoDia` (só treinos CONCLUÍDOS alimentam o ciclo de sugestão; o `checks` em dia em andamento não conta mais).

### [Known gaps desta etapa]
- Sem handler: Modo Foco (`#btnStartFocus`), share card (`#fichaDoneActions`), editar cardio (`⚙️ .btn-edit-ae-ficha`), `renderFicha`/`renderProgresso` nativos. Animações `fadeSwap`/`fadeIn` de troca de view não portadas (render React instantâneo). Timer de descanso só aparece no `ActiveWorkoutModal` aberto. Conclusão do treino não abre o modal `showConclusao`/confete nem limpa checks (fica para a Fase 3). Radar do Dashboard é placeholder SVG (Fase 3).


## [v4.0.1-phase0] - 2026-10-05
*Fase 0 (fundação) da migração React v4: assets/fontes locais, seed legado de 66 exercícios, migração real do localStorage e rollback do overflow do body*

### [Added]
- **`src-app/src/core/db/bootstrap.ts` (novo)**: rotina idempotente chamada por `main.tsx` → `ensureSeed()` (popula `exercises`/`workoutSheets` só se vazios) → `migrateLegacyData()` → `flushQueue()` → dispara o evento `academia:db-ready` (a UI que lê IndexedDB refaz a carga). Erro no bootstrap nunca bloqueia o render.
- **`src-app/src/core/db/default-data.ts` regenerado a partir de `JS/treino/db.js`**: de 9 → **66 exercícios** com os IDs legados (`ex-a1`…) e mapeamento `nome→name`, `grupoMuscular→muscleGroup`, `series→sets`, `repeticoes→reps`, `carga→load`, `descanso→rest`, `imagem→imageUrl`; `DEFAULT_SHEETS` com as fichas A–J reais (A: `ex-a1,a2,a5,a6,a8`; B: `ex-b1,b2,b5,b4,b7`) e `aerobic: null`, igual ao `loadDB()` do legado.
- **Tabela `legacyState` (store v2 do Dexie) + tipo `LegacyState`**: guarda a cópia bruta do JSON `academia_treino` para as features ainda não portadas (maestria, conquistas, ciclo 30 dias, personalização/perfil) lerem sem perda; protegida de `clearLocalDB()`.
- **`LOCAL_USER_ID = 'local'`** (`schema.ts`), unificando os IDs divergentes `'default'` (seed) e `'user-local'` (HistoryFeature / ActiveWorkoutModal).
- **Assets públicos da v4 em `src-app/public/`** (~24 MB): `assets/exerciciosgif/` (65 GIFs), `assets/bg/` (2), `assets/images/background/` (4), `assets/icons/D.jpg` e `vendor/` completo (`fonts.css` + 24 fontes + `fontawesome.min.css` + 6 webfonts) copiados de `www/vendor/` — casos de pasta minúsculos exigidos pelo Vercel/Linux.
- **Ícones PWA `assets/icons/icon-192.png` e `icon-512.png`** gerados a partir de `D.jpg` (o manifest do `vite.config.ts` já os referenciava e os arquivos não existiam).
- **`src-app/index.html`**: `meta theme-color`, favicon `/assets/icons/D.jpg` e troca dos CDNs do Google Fonts (Rajdhani/Inter/Outfit) e do Font Awesome pelos locais `/vendor/…`; Material Symbols segue no CDN (mesmo comportamento do legado offline).

### [Changed]
- **`src-app/src/core/db/legacy-migrator.ts` reescrito**: o código anterior lia chaves inexistentes (`treinosSalvos`, `treinoAtual`, `historicoTreinos`, `exerciciosCustomizados`); agora lê a chave real **`academia_treino`**, salva a cópia bruta em `legacyState` e deriva: exercícios (put por cima do seed, preservando a carga digitada pelo usuário), fichas A–J com aeróbicos (`{tipo, vel, tempo}` → `AerobicConfig`) e histórico (uma linha por dia; `durationMin = duracaoTotal/60`; `sheetKey` validado em A–J). Marcador `academia_v4_migrated` só gravado se a cópia bruta foi salva.
- **`schema.ts`**: `ExerciseTag` estendido com `'Isolador'` e `'Peso do Corpo'` (variantes reais do seed legado) e `Exercise.porLado?: boolean` (presente no `db.js`).
- **`main.tsx`**: importa e dispara `bootstrap()` antes do primeiro render.
- **`HistoryFeature.tsx`**: `userId` → `LOCAL_USER_ID`, janela do histórico de 30 → 3650 dias (aceita histórico migrado com anos) e recarga no evento `academia:db-ready`.
- **`ActiveWorkoutModal.tsx`**: `userId` → `LOCAL_USER_ID` e data do registro passa a usar `localToday()` (data local, igual ao `today()` do legado) em vez de `toISOString()` em UTC, que podia cair no dia seguinte.
- **`globals.css`**: `html, body { height: auto; overflow: auto; overflow-x: hidden }` — rollback do `overflow: hidden` de `1-core.css` (o legado usa Swipe Viewport; no React o documento precisa rolar). `body.ficha-overlay-open` continua com `overflow: hidden !important` (`ficha-overlay.css`).
- **`design-tokens.css`**: removidos os 5 `@font-face` quebrados (apontavam para `/assets/fonts/…` inexistente); as fontes agora vêm de `/vendor/fonts.css`.
- **`legacy-style/footer.css`** e **`legacy-style/treino/secoes/bg-dinamico.css`**: `url()` corrigidos para `/assets/images/background/F3.jpeg`, `/assets/bg/BG-roxo-vertical.jpg` e `/assets/bg/BG-roxo-horizontal.jpg` (estavam com caminhos relativos inexistentes).
- **`App.tsx`**: overlay da Ficha segue o CSS legado — `className="ficha-overlay"`, `style={{display}}`, botão `#btnFecharFicha.ficha-overlay-close` como irmão do scroller e wrapper `<div class="ficha-overlay__scroll" id="fichaOverlayScroll">`.
- **`idb.ts`**: `clearLocalDB()` passa a preservar `legacyState` e `exercises` (backup dos dados da versão offline).
- **`Diretrizes/system_map.json`**: nova seção `react_app` (build/deploy, entry points, `core_db`, assets, estilos e lacunas das fases 1–4); `version` 3.5.7 → **3.5.8**; `last_updated` → 2026-10-05.

### [Fixed]
- **`ExerciseCard.tsx`**: `onError` no `<img>` → placeholder (paridade com o `onerror → premium-placeholder` do legado). 7 GIFs do seed seguem inexistentes no repositório (`Agachamento`, `Flexao`, `Panturrilha`, `Gluteo 3 Apoios`, `Abducao Solo`, `Prancha`, `Leg Press 180`) e renderizavam imagem quebrada.
- **Verificação de build**: `npm run build` (tsc + vite + PWA) OK, `oxlint` sem erros (só warnings pré-existentes) e 9 assets-chave validados por HTTP em `vite preview` com **tamanho idêntico ao arquivo local** (fonts.css, woff2 de Rajdhani e Inter em `/vendor/fonts/s/…`, webfont do Font Awesome, ícone 512, background, GIF com espaço no nome e F3.jpeg); caminho inexistente cai no fallback SPA (200 com `index.html`), então a checagem compara bytes — e não apenas o status.

### Notas
- Os 7 GIFs ausentes continuam referenciados com os mesmos paths do legado: basta adicionar os arquivos em `src-app/public/assets/exerciciosgif/` (minúsculas) para funcionarem sem mudar código.
- O `vercel.json` da **raiz** declara `builds/distDir '../dist'`, porém o build gera `src-app/dist`; o deploy depende do Root Directory do projeto Vercel estar em `src-app` (documentado em `system_map.json → react_app.build.deploy`). O `Academia/dist/` da raiz está desatualizado desde 2026-10-01.

## [v3.5.7-docs] - 2026-10-01
*Orientação de build Android no README para evitar o app compilado "antigo"*

### [Changed]
- **`Diretrizes/README.md`**: Nova seção **"🤖 Build do App Android (Capacitor) — LEIA ANTES DE COMPILAR"** (após "Como Adicionar Novas Páginas") documentando a causa raiz do bug de "versão antiga" no Android Studio e o fluxo obrigatório de build: (1) espelhar edições em `www/` — inclusive o shell em `www/index.html`, que é o **entry point** do app (não `treino.html`); (2) rodar `npx cap sync android` para copiar `www/` → `android/app/src/main/assets/public/` (a pasta `android/` é ignorada pelo Git e nunca é atualizada sozinha); (3) Sync Gradle + Clean Project no Android Studio; (4) limpeza de dados do app caso o Cache Storage do Service Worker/`localStorage` ainda sirva conteúdo antigo. Inclui lista de sintomas e verificação rápida por comparação de arquivos. Nova linha adicionada à tabela "Resumo das Regras Absolutas".
- **`www/Diretrizes/README.md`**: espelho idêntico da alteração acima.
- `Diretrizes/system_map.json` inalterado (nenhuma mudança de estrutura de arquivos).

## [v3.5.7-android-sync] - 2026-10-01
*App gerado no Android Studio continha a versão antiga: assets do APK desatualizados*

### [Fixed]
- **`npx cap sync android` executado** — a última sincronização de `www/` → `android/app/src/main/assets/public/` tinha ocorrido em 2026-09-25 às 19:48, **antes** das alterações das v3.5.5, v3.5.6 e v3.5.7 (feitas entre 20:11 do mesmo dia e 2026-09-30). Como o Capacitor empacota em `android/app/src/main/assets/public/` (o `webDir` `www/` só é copiado de lá por `cap sync/copy`), o APK seguia compilando o conteúdo de 23/07/2026.
- **25 arquivos desatualizados/ausentes corrigidos no espelho do Android**: `JS/treino/db.js`, `JS/treino/secao-treinos.js`, `JS/treino.js` (legado), `componentes/secoes/treinos.html`, 18 GIFs novos de `Assets/exerciciosgif/` (ausentes por completo) e os documentos de `Diretrizes/`. Verificação pós-sync: 0 divergências e 0 ausências entre `www/` e `android/app/src/main/assets/public/`.
- **`www/index.html` confirmado como entry point do app** (não `treino.html`): cópia de `treino.html` com os CDNs de Tailwind/Font Awesome/Google Fonts trocados por `vendor/*` locais (10 linhas de diferença apenas no `<head>`). Edições futuras em `treino.html` precisam ser replicadas em `www/index.html` para chegarem ao APK.

### [Changed]
- **Fluxo de build Android documentado**: após qualquer alteração em código/asset, rodar `npx cap sync android` **antes** de compilar no Android Studio (os arquivos de `android/` são ignorados pelo Git e nunca recebem as mudanças automaticamente). Se algo ainda parecer antigo no dispositivo, limpar os dados do app (`adb shell pm clear com.academia.workout`) para descartar o Cache Storage do Service Worker (`sw.js`) e o `localStorage`.

## [v3.5.7] - 2026-09-30
*Ajuste de nome e GIFs de 2 exercícios do template "Hipertrofia (Médio) II"*

### [Changed]
- **`JS/treino/db.js`** (`DEFAULT_EXERCISES`):
  - `ex-desenvolvimento-frente` — nome alterado de "Desenvolvimento Frente" para **"Desenvolvimento Frontal"** (espelhando o nome do GIF) e `imagem` de `null` (placeholder premium) para `./Assets/exerciciosgif/Desenvolvimento Frontal.gif`.
  - `ex-triceps-palmar` — `imagem` apontando para `Tricepes Palmar.gif` (arquivo inexistente) → **`Triceps Palmar.gif`**.
  - `loadDB()` ganhou o mapa `LEGACY_EXERCISE_NAMES` para renomear "Desenvolvimento Frente" → "Desenvolvimento Frontal" nas bases `localStorage` já existentes (a sincronização de `imagem` já era feita automaticamente).
- **`www/JS/treino/db.js`**: espelho idêntico da alteração acima (hashes batem).
- **2 GIFs espelhados em `www/Assets/exerciciosgif/`**: `Desenvolvimento Frontal.gif` e `Triceps Palmar.gif` (já existentes em `Assets/Exerciciosgif/`, antes faltando no espelho).
- Templates inalterados: `hipertrofia_medio_ii` em `JS/treino/secao-treinos.js` e `JS/treino.js` (legado) referenciam os IDs `ex-desenvolvimento-frente` e `ex-triceps-palmar`, que **não mudaram** — apenas nome/imagem do registro em `db.js`.
- **`Diretrizes/system_map.json`**: `version` incrementada de `3.5.6` para `3.5.7`; `last_updated` atualizado de `2026-09-25` para `2026-09-30`.

### [Fixed]
- **`ex-triceps-palmar`** com caminho de GIF quebrado (`Tricepes Palmar.gif` → `Triceps Palmar.gif`), que renderizava o placeholder premium em vez da animação.

## [v3.5.6] - 2026-09-25
*Novo template "Perda Ponderal (Médio) II" (8+8 exercícios + aeróbico 20', 6x/semana) conforme planilha de 24/08/2026*

### [Added]
- **Novo template `perda_ponderal_media_ii`** em `TEMPLATES_PRONTOS`, espelhando a planilha (Objetivo PERDA PONDENDRAL, 30 treinos, freq. 6X, intervalo 30", AERÓBICO 20'):
  - **A:** Leg 45°, Panturrilha Leg 45°, Elevação de Joelho, Supino 45°, Triceps Testa Barra H, Desenvolvimento Barra, Remada Alta, Infra Paralelo.
  - **B:** Banco Flexor, Remada Unilateral, Pull Down, Rosca Scott Unilateral, Rosca Direta Cross, Fly Inverso, Supra Solo, Extensão Lombar.
  - **`JS/treino/secao-treinos.js`**: chave `perda_ponderal_media_ii` adicionada a `TEMPLATES_PRONTOS`, com `ae: { tipo: 'Geral', vel: '---', tempo: '20' }`.
  - **`JS/treino.js`** (legado): mesma chave adicionada ao `TEMPLATES_PRONTOS` legado.
  - **`componentes/secoes/treinos.html`**: novo botão `<button class="btn-template" data-template="perda_ponderal_media_ii">` no grid `#templatesGrid`, com ícone SVG de pulso ECG (path da biblioteca de `Diretrizes/Ícones.md`, `.tpl-icon` 28px/stroke 2) e descrição "8 exercícios + aeróbico 20' · 6x/semana".
- **9 novos exercícios em `DEFAULT_EXERCISES` (`JS/treino/db.js`)**:
  - `ex-panturrilha-leg-45` — "Panturrilha Leg 45°" (Pernas, 3×15) → `PANTURRILHA LEG 45°.gif`
  - `ex-elevacao-joelho` — "Elevação de Joelho" (Core, 3×15) → `ELEVACÃO DE JOELHO.gif`
  - `ex-supino-45` — "Supino 45°" (Peito, 3×15) → `SUPINO 45°.gif`
  - `ex-triceps-testa-barra-h` — "Triceps Testa Barra H" (Tríceps, 3×15) → `TRICEPS TESTA BARRA H.gif`
  - `ex-desenvolvimento-barra` — "Desenvolvimento Barra" (Ombros, 3×15) → `DESENVOLVIMENTO BARRA.gif`
  - `ex-remada-unilateral` — "Remada Unilateral" (Costas, 3×15) → `REMADA UNILATERAL.gif`
  - `ex-pull-down` — "Pull Down" (Costas, 3×15) → `PULL DOWN.gif`
  - `ex-roscott-unilateral` — "Rosca Scott Unilateral" (Bíceps, 3×15) → `ROSCA SCOTT UNILATERAL.gif`
  - `ex-extensao-lombar` — "Extensão Lombar" (Core, **3×20**) → **`imagem: null`** (placeholder premium; GIF ainda não entregue — ao receber o arquivo, colocá-lo em `Assets/exerciciosgif/` e apontar `imagem` para ele)
- **8 GIFs novos em `Assets/Exerciciosgif/`** (espelhados em `www/Assets/exerciciosgif/`): `PANTURRILHA LEG 45°.gif`, `ELEVACÃO DE JOELHO.gif`, `SUPINO 45°.gif`, `TRICEPS TESTA BARRA H.gif`, `DESENVOLVIMENTO BARRA.gif`, `REMADA UNILATERAL.gif`, `PULL DOWN.gif`, `ROSCA SCOTT UNILATERAL.gif` (o 9º nome da lista, `Remada Alta.gif`, já existia e foi reaproveitado pelo exercício `ex-b6`).
- **`Diretrizes/system_map.json`**: `version` incrementada de `3.5.5` para `3.5.6`; `last_updated` mantido em `2026-09-25`.

## [v3.5.5] - 2026-09-25
*Novo template "Hipertrofia (Médio) II" (8+8 exercícios, 6x/semana) conforme planilha de 24/09/2026*

### [Added]
- **Novo template `hipertrofia_medio_ii`** em `TEMPLATES_PRONTOS`, espelhando a planilha (Objetivo HIPERTROFIA, 30 treinos, freq. 6X, intervalo 30", sem aeróbico):
  - **A:** Supino Reto com Halteres, Crucifixo, Supino Articulado, Agachamento Guiado, Banco Extensor, Desenvolvimento Frente, Trícepes Corda, Triceps Palmar.
  - **B:** Puxada Supinada, Fly Inverso, Remada Cavalinho, Banco Flexor, Mesa Flexora, Rosca Direta Barra, Elevação Lateral, Supra Prancha.
  - **`JS/treino/secao-treinos.js`**: chave `hipertrofia_medio_ii` adicionada a `TEMPLATES_PRONTOS`.
  - **`JS/treino.js`** (legado): mesma chave adicionada ao `TEMPLATES_PRONTOS` legado para manter sincronia.
  - **`componentes/secoes/treinos.html`**: novo botão `<button class="btn-template" data-template="hipertrofia_medio_ii">` no grid `#templatesGrid`, com ícone SVG de haltere (path da biblioteca de `Diretrizes/Ícones.md`, `.tpl-icon` 28px/stroke 2) e descrição "8 exercícios por treino · 6x/semana".
- **6 novos exercícios em `DEFAULT_EXERCISES` (`JS/treino/db.js`)**, todos 3×10 / descanso 30":
  - `ex-supino-reto-halteres` — "Supino Reto com Halteres" (Peito) → `Assets/exerciciosgif/supino-reto-com-halteres.gif`
  - `ex-agach-guiado` — "Agachamento Guiado" (Pernas) → `Assets/exerciciosgif/Agachamento guiado.gif`
  - `ex-desenvolvimento-frente` — "Desenvolvimento Frente" (Ombros) → **`imagem: null`** (usa o placeholder premium, conforme decisão do usuário)
  - `ex-triceps-palmar` — "Triceps Palmar" (Tríceps) → `Assets/exerciciosgif/Tricepes Palmar.gif`
  - `ex-puxada-supinada` — "Puxada Supinada" (Costas) → `Assets/exerciciosgif/Puxada Supinada.gif`
  - `ex-fly-inverso` — "Fly Inverso" (Costas) → `Assets/exerciciosgif/Fly Inverso.gif`
- **8 GIFs novos em `Assets/Exerciciosgif/`** (espelhados em `www/Assets/exerciciosgif/`): `supino-reto-com-halteres.gif`, `Agachamento guiado.gif`, `Tricepes Corda.gif`, `Puxada Supinada.gif`, `Fly Inverso.gif`, `Remada Cavalinho.gif`, `Mesa Flexora.webp`, `Rosca Direta Barra.gif`.
- **`Diretrizes/system_map.json`**: nova chave `ia_quick_reference.edit_workout_templates` (onde editar os templates prontos); `version` incrementada de `3.5.4` para `3.5.5`; `last_updated` mantido em `2026-09-25`.

### [Changed]
- **`JS/treino/db.js`**: imagem de 4 exercícios reutilizados apontando para os GIFs novos (IDs e nomes preservados; `loadDB()` sincroniza a imagem dos usuários existentes):
  - `ex-triceps-corda`: `Trícepes Corda.gif` → `Tricepes Corda.gif`
  - `ex-mesa-flexora`: `Mesa flexora.gif` → `Mesa Flexora.webp`
  - `ex-remada-cavalinho`: `Remada Cavalinho Máquina.webp` → `Remada Cavalinho.gif`
  - `ex-rosca-direta-barra-livre`: `Rosca Direta Barra Livre.gif` → `Rosca Direta Barra.gif`

## [v3.5.4] - 2026-09-25
*Consolidação da documentação: remoção do `Claude.md`, reforço da instrução de registro de alterações e regra de leitura de `Ícones.md` ao mexer em ícones*

### [Changed]
- **`Diretrizes/CHANGELOG.md`**: Bloco de instruções obrigatórias reescrito com a regra explícita **"SEMPRE REGISTRE AS ALTERAÇÕES FEITAS"**, estendendo a obrigação de registro a mudanças de documentação, diretrizes e configuração (não apenas código), com fallback de versão (`[vX.Y.Z-docs]`) e exigência de incrementar `version` no `system_map.json` quando ele for alterado.
- **`Diretrizes/system_map.json`**: Mesma instrução de registro de alterações incorporada ao campo `how_to_update` e reforçada em `ia_quick_reference.record_change`.
- **`Diretrizes/README.md`**: Nova obrigação explícita de **ler `Diretrizes/Ícones.md` antes de adicionar ou alterar qualquer ícone** (seções de Diretrizes de UI/UX e Guia para Agentes de IA); nova seção "📌 Stack, Estrutura e Convenções do Projeto" criada para absorver o conteúdo útil do antigo `Claude.md`.

### [Removed]
- **`Diretrizes/Claude.md`** (removido): documento de uma versão antiga do projeto, com informações desatualizadas (referência a `JS/treino.js` monolítico, `franquiaexemplo.html` inexistente, lista fixa de 16 exercícios pré-cadastrados e rotação apenas A/B — hoje há 10 fichas A-J e 50+ exercícios). O conteúdo ainda aproveitável (stack, estrutura de diretórios, schema do `localStorage`, como criar novas páginas e observações importantes) foi migrado para `Diretrizes/README.md`.
- **`Diretrizes/system_map.json`**: Removida a entrada `Diretrizes/Claude.md` de `documentation.files` e a entrada fantasma `Diretrizes/otimizacao_tokens_ia.md` (arquivo inexistente no repositório).

### [Added]
- **`Diretrizes/system_map.json`**: Entradas novas em `documentation.files` para `DESIGN.md` (manual do design system, na raiz) e `Diretrizes/navbar-inferior.html` (guia/preview da navbar mobile HUD).
- **`Diretrizes/README.md`**: Seção "📌 Stack, Estrutura e Convenções do Projeto" (stack tecnológica, árvore de diretórios atualizada, schema do `localStorage`, componentes reutilizáveis, como adicionar novas páginas e observações importantes).
- **`Diretrizes/system_map.json`**: `version` incrementada de `3.5.3` para `3.5.4`; `last_updated` atualizado para `2026-09-25`.

## [v3.5.3] - 2026-07-23
*Adição de 11 novos exercícios e template Perda Ponderal (Médio)*

### [Added]
- **11 novos exercícios cadastrados em `DEFAULT_EXERCISES`**: HACK, Rosca Direta Barra Livre, Rosca Direta Cross, Remada Cavalinho Máquina, Mesa Flexora, Panturrilha Livre, Flexão de Quadril, Trícepes Corda, Supino Reto, Desenvolvimento Ombro com Halter e Supra Banco. Todos com 3×15 (ou 3×20 para Supra Banco), imagens `.gif`/`.webp` na pasta `Assets/Exerciciosgif/` e tags de classificação.
  - **`JS/treino/db.js`**: 11 entradas adicionadas ao array `DEFAULT_EXERCISES` (após `ex-roscamartelo-90`), com IDs `ex-hack`, `ex-rosca-direta-barra-livre`, `ex-rosca-direta-cross`, `ex-remada-cavalinho`, `ex-mesa-flexora`, `ex-panturrilha-livre`, `ex-flexao-quadril`, `ex-triceps-corda`, `ex-supino-reto`, `ex-desenvolvimento-ombro-halter` e `ex-supra-banco`.
- **Novo template de ficha "Perda Ponderal (Médio)"**: Ficha com 8 exercícios por treino (A e B) + aeróbico de 20 min. Treino A foca em pernas, costas, bíceps e core; Treino B foca em pernas, peito, ombros, tríceps e core.
  - **`JS/treino/secao-treinos.js`**: Chave `perda_ponderal_media` adicionada ao objeto `TEMPLATES_PRONTOS`.
  - **`JS/treino.js`** (legado): Mesma chave adicionada ao `TEMPLATES_PRONTOS` legado para manter sincronia.
  - **`componentes/secoes/treinos.html`**: Novo botão `<button class="btn-template" data-template="perda_ponderal_media">` adicionado ao grid `#templatesGrid`, com ícone SVG de raio+círculo e descrição "8 exercícios + aeróbico para queima calórica".
  - **`Diretrizes/system_map.json`**: `version` incrementada de `3.5.2` para `3.5.3`; `last_updated` atualizado para `2026-07-23`.

## [v3.5.2] - 2026-06-03
*Redução do tamanho dos botões superiores (Menu, Notícias, Social) no Dashboard*

### [Changed]
- **Tamanho dos botões superiores do Dashboard reduzido em ~14-17%**: os botões `#dashBtnSocial`, `#dashBtnNoticias` e `#dashBtnMenu` no header do Dashboard estavam grandes demais relativamente ao avatar (112px). Agora ocupam menos espaço, mantendo legibilidade e área de toque aceitável. Apenas estilo, nenhuma mudança funcional (mesmos handlers, mesmos IDs, mesmas classes utilitárias).
  - **`componentes/secoes/dashboard.html`**: Classes Tailwind dos 3 botões alteradas de `w-14 h-14` (56×56) para `w-12 h-12` (48×48), e os `<span class="material-symbols-outlined">` internos de `text-[28px]` para `text-[24px]`. O `notification-dot` da Notícias teve `top-3.5 right-3.5` (14px) ajustado para `top-3 right-3` (12px) para acompanhar a redução do botão.
  - **`style/treino/secoes/dashboard.css`** (bloco desktop `.dash-header-btn`): `width`/`height` 56px → 48px, `border-radius` 14px → 12px, `font-size` do span 28px → 24px, `notification-dot` `top`/`right` 14px → 12px.
  - **`style/treino/secoes/dashboard.css`** (bloco mobile `@media (max-width: 480px)`): `width`/`height` 48px → 40px, `border-radius` 12px → 10px, `font-size` do span 24px → 20px, `notification-dot` `top`/`right` 11px → 9px.
  - **`Diretrizes/system_map.json`**: `version` incrementada de `3.5.1` para `3.5.2`; `last_updated` mantido em `2026-06-03`.

## [v3.5.1] - 2026-06-03
*Padronização tipográfica dos títulos das missões no overlay `#missions-overlay`*

### [Changed]
- **Títulos das missões (`<h4>`) no overlay de Missões agora seguem o padrão tipográfico do site**: antes usavam `font-family: 'Inter'` (fonte secundária/corpo), `18px`, `line-height: 1.6`, `color: #e5e2e1`, sem uppercase nem letter-spacing — visualmente inconsistente com o restante do app (deck cards, badges, sub-abas). Agora usam `font-family: 'Rajdhani'` (primária/títulos), `font-weight: 700`, `18px`, `line-height: 1.3`, `letter-spacing: 0.05em`, `color: #fff`, `text-transform: uppercase` e `margin-bottom: 8px` — alinhado com `.deck-card-name` e outros títulos gamificados do projeto.
  - **`treino.html`**: Adicionada regra CSS `.missions-overlay .ms-mission-title` no bloco `<style>` do `#missions-overlay` (após a regra `.ms-content-area > div.ms-active`), com todos os tokens tipográficos acima. Os 6 títulos `<h4 style="font-family: 'Inter', sans-serif; font-size: 18px; line-height: 1.6; color: #e5e2e1; margin-bottom: 12px;">` (Daily 1/2/3 e Weekly 1/2/3) foram substituídos por `<h4 class="ms-mission-title">`, eliminando estilos inline duplicados.
  - **`Diretrizes/system_map.json`**: `version` incrementada de `3.5.0` para `3.5.1`; `last_updated` mantido em `2026-06-03`.

## [v3.5.0] - 2026-06-03
*Reordenação dos slides do Swipe Viewport: Progresso agora é a 1ª seção e Treinos a 2ª*

### [Changed]
- **Ordem dos slides do Swipe Viewport invertida entre Progresso e Treinos**: Progresso passa a ser a 1ª seção (índice 0) e Treinos passa a ser a 2ª seção (índice 1). O swipe da esquerda para a direita agora percorre: Progresso → Treinos → Dashboard → Social → Loja. A `initialIndex` (Dashboard, índice 2) continua inalterada, portanto o app continua abrindo no mesmo lugar.
  - **`JS/treino/nav.js`**: Array `sectionsOrder` (linha 19) alterado de `['treinos', 'progresso', 'dashboard', 'social', 'loja']` (v3.4.0) para `['progresso', 'treinos', 'dashboard', 'social', 'loja']`.
  - **`treino.html`**: Ordem dos `<div class="section-slide">` no `.section-strip` reorganizada — o bloco do Progresso (`data-section="progresso"`) agora vem antes do bloco do Treinos (`data-section="treinos"`). Comentários de header atualizados de "SLIDE 1: TREINOS" + "SLIDE 2: PROGRESSO" para "SLIDE 1: PROGRESSO" + "SLIDE 2: TREINOS".
  - **`treino.html`**: Ordem dos botões do bottom-nav (`.bnav-btn`) reorganizada — o botão do Progresso (`#bnavProgresso`) agora aparece antes do botão do Treinos (`#bnavTreinos`), refletindo a nova ordem visual.
  - **`JS/treino.js`** (legado, não carregado por `treino.html`): Array `sectionsOrder` (linha 542) sincronizado com a nova ordem — trocado `['ficha', 'treinos', 'progresso', 'perfil', 'social', 'loja']` por `['ficha', 'progresso', 'treinos', 'perfil', 'social', 'loja']` para evitar confusão em leituras futuras do arquivo morto.
  - **`DESIGN.md`**: Grafo mermaid da seção 4.1 (Navegação Principal e Swipe Viewport) atualizado — Slide 0 agora é Progresso e Slide 1 é Treinos (estava invertido desde v3.2.0).
  - **`Diretrizes/system_map.json`**: Descrição do módulo `navigation` atualizada com o histórico de versões da ordem; `version` incrementada de `3.4.0` para `3.5.0`; `last_updated` mantido em `2026-06-03`.

## [v3.4.0] - 2026-06-03
*Reordenação dos slides do Swipe Viewport: Social agora é a 4ª seção e Loja a 5ª*

### [Changed]
- **Ordem dos slides do Swipe Viewport invertida entre Social e Loja**: Social passa a ser a 4ª seção (índice 3) e Loja passa a ser a 5ª seção (índice 4). O swipe da esquerda para a direita agora percorre: Treinos → Progresso → Dashboard → Social → Loja. A `initialIndex` (Dashboard) continua inalterada (índice 2), portanto o app continua abrindo no mesmo lugar.
  - **`JS/treino/nav.js`**: Array `sectionsOrder` (linha 19) alterado de `['treinos', 'progresso', 'dashboard', 'loja', 'social']` para `['treinos', 'progresso', 'dashboard', 'social', 'loja']`.
  - **`treino.html`**: Ordem dos `<div class="section-slide">` no `.section-strip` reorganizada — o bloco do Social (`data-section="social"`) agora vem antes do bloco do Loja (`data-section="loja"`). Comentários de header atualizados de "SLIDE 5: LOJA" + "SLIDE 6: SOCIAL" para "SLIDE 4: SOCIAL" + "SLIDE 5: LOJA".
  - **`treino.html`**: Ordem dos botões do bottom-nav (`.bnav-btn`) reorganizada — o botão do Social (`#bnavSocial`) agora aparece antes do botão do Loja (`#bnavLoja`), refletindo a nova ordem visual.
  - **`JS/treino.js`** (legado, não carregado por `treino.html`): Array `sectionsOrder` (linha 542) sincronizado com a nova ordem — trocado `['ficha', 'treinos', 'progresso', 'perfil', 'loja', 'social']` por `['ficha', 'treinos', 'progresso', 'perfil', 'social', 'loja']` para evitar confusão em leituras futuras do arquivo morto.
  - **`DESIGN.md`**: Grafo mermaid da seção 4.1 (Navegação Principal e Swipe Viewport) atualizado para refletir a arquitetura real do projeto: Ficha e Perfil movidos para "Overlays" (acionados pelo Dashboard), e a ordem dos slides passou a ser Treinos → Progresso → Dashboard → Social → Loja (anteriormente o grafo mostrava Ficha/Perfil como slides e Loja/Social como 5/6, o que estava desatualizado desde v3.1.0/v3.2.0).
  - **`Diretrizes/system_map.json`**: Descrição do módulo `navigation` atualizada para refletir a nova ordem em v3.4.0; `version` incrementada de `3.3.2` para `3.4.0`; `last_updated` mantido em `2026-06-03`.

## [v3.3.2] - 2026-06-03
*Correção: usuário ficava preso no overlay da Ficha após baixar imagem de conclusão + botão X descobrível*

### [Fixed]
- **Usuário preso no overlay da Ficha após "BAIXAR IMAGEM" → "FECHAR" → "INCRÍVEL!"**: O handler de `#btnFecharConclusao` (`JS/treino/app.js:272`) limpava `fichaEmAndamento`, fechava o `modalConclusao` e chamava `_transitionTo('dashboard')`, mas **esquecia de fechar o overlay fullscreen da Ficha**. Como o overlay é full-bleed sem header e cobre o Bottom Nav (z-index 600), a única saída era pressionar ESC (não descobrível). O `btnEncerrarConfirmar` (app.js:289) já fazia isso corretamente; o `btnFecharConclusao` não.
  - **`JS/treino/app.js`**: Adicionado bloco `if (window.isFichaOverlayOpen && window.isFichaOverlayOpen()) { window.closeFichaOverlay({ force: true }); }` ao final do handler de `#btnFecharConclusao`, com a mesma assinatura defensiva já usada em `btnEncerrarConfirmar`. Mantida a chamada `_transitionTo('dashboard')` (dupla, conforme decisão do usuário, para redundância defensiva).

### [Added]
- **Botão X (fechar Ficha) no canto superior esquerdo do overlay da Ficha** (`treino.html:290-298`): pequeno ícone SVG em estilo glassmorphism discreto (`#btnFecharFicha`, classe `.ficha-overlay-close`). Resolve o problema de descobribilidade — antes, a única forma de sair do overlay sem concluir era o atalho ESC, escondido. Ao clicar, **sempre** abre o modal `modalEncerrarTreino` como confirmação (independente de `workout_start_time`); o `btnEncerrarConfirmar` existente já trata corretamente os dois cenários (treino em curso ou já concluído).
  - **`treino.html`**: Adicionado `<button class="ficha-overlay-close" id="btnFecharFicha" ...>` dentro de `#ficha-overlay`, antes de `#fichaOverlayScroll` (irmão do scroller para não rolar junto).
  - **`JS/treino/ficha-overlay.js`**: Adicionado listener `#btnFecharFicha` no `initFichaOverlay()` que chama `openEncerrarModal()` com `e.preventDefault(); e.stopPropagation();`.
  - **`style/treino/secoes/ficha-overlay.css`**: Adicionadas regras `.ficha-overlay-close` (40×40px, glassmorphism roxo discreto com `backdrop-filter: blur(8px)`, hover com glow, active com scale 0.96) e media query para ≤480px (36×36px). Posicionado `top:16px; left:16px;` (`top:12px; left:12px;` em mobile pequeno). Z-index 2 dentro do overlay (acima do scroller, abaixo de modais).

### [Changed]
- **`componentes/secoes/modais.html`**: Título do `modalEncerrarTreino` alterado de `"Encerrar treino sem concluir?"` para `"Sair da Ficha?"` (mais genérico, agora serve tanto ao contexto original do cronômetro quanto ao novo botão X). Body e botões mantidos.

## [v3.3.1] - 2026-06-03
*Correção dos botões de Exportar/Importar Dados + melhorias de backup*

### [Fixed]
- **Botões de Exportar/Importar Dados não respondiam a cliques**: Existiam **dois blocos** de "Backup e Dados" no perfil (`componentes/secoes/perfil.html`): um em `<div id="perf-tab-config">` (aba órfã, não linkada em `perfTabNav`) e outro em `perf-tab-prefs` → `perf-subtab2-config` (acessível). Ambos compartilhavam os mesmos `id="btnExportarDados"`, `id="btnImportarDados"` e `id="inputImportarJSON"`. O `getElementById` em `JS/treino/app.js` sempre retornava o botão da aba órfã (escondido), fazendo com que o clique no botão visível (em Preferências → Configurações) não disparasse nenhuma ação.
  - **`componentes/secoes/perfil.html`**: Removido o bloco órfão inteiro `<div id="perf-tab-config">` (linhas 217-292 da revisão anterior), que continha os botões duplicados e configurações de tema/timer já presentes no bloco acessível. No bloco restante, trocados `id="btnExportarDados"` → `data-action="export-data"` e `id="btnImportarDados"` → `data-action="import-data"`. Mantido `id="inputImportarJSON"` (único no DOM).
  - **`JS/treino/app.js`** (linhas 410-415): Substituído `getElementById('btnExportarDados')`/`getElementById('btnImportarDados')` por `document.querySelectorAll('[data-action="export-data"]')` e `'[data-action="import-data"]'` (defesa em profundidade + suporta múltiplos botões no futuro).

### [Changed]
- **`JS/treino/secao-perfil.js`**: Reescrita completa de `exportData` e `importData`:
  - **`exportData(db)`** agora é `async` e tenta `navigator.share({ files: [file] })` primeiro (iOS/Android) via `navigator.canShare({ files: [file] })`. Se o usuário cancelar (`AbortError`) ou o share falhar, cai no fallback `<a download>` (Chrome, Edge, Firefox, Safari desktop, Android). O nome do arquivo é gerado como `academia_backup_YYYY-MM-DD.json`.
  - **`importData()`** agora retorna `Promise<void>` (resolve com `newDb`, rejeita com `Error`). A confirmação deixa de usar `window.confirm()` (instável em PWA iOS) e passa a usar o modal custom `modalConfirm` já existente em `componentes/secoes/modais.html:351` (mesmo padrão de `confirmDeleteExercicio` em `secao-treinos.js:242`). O input file é resetado (`input.value = ''`) antes de cada click para permitir reimportar o mesmo arquivo.
  - **`validateBackup(obj)`** (nova função): schema check profundo que valida tipos e formatos antes de aceitar o arquivo. Lança `Error` com mensagem específica em caso de inconsistência. Regras:
    - Raiz deve ser objeto (não array, não `null`).
    - `exercicios`: array; cada item deve ter `id`, `nome` e `grupoMuscular` como strings não-vazias; `series` deve ser número (se presente); `repeticoes`, `carga` e `imagem` devem ser string|null (se presentes).
    - `fichas`: objeto; cada chave (letra da ficha) deve mapear para um array de strings (IDs).
    - `historico`: objeto indexado por data no formato `YYYY-MM-DD`; cada entrada deve ter `treino` (string|null), `checks` (array de strings) e `concluido` (boolean) válidos.
    - `aerobicos`, `conquistas`, `maestrias`, `profileCustomization` validados opcionalmente.
  - **Re-init sem reload**: ao concluir com sucesso, dispara o evento custom `window.dispatchEvent(new CustomEvent('academia:data-imported', { detail: parsed }))` e resolve a Promise. Substitui o `window.location.reload()` antigo.
- **`JS/treino/app.js`**: Adicionado listener global `window.addEventListener('academia:data-imported', () => reinitAppAfterImport())` e função `reinitAppAfterImport()` que recarrega o DB do localStorage e re-renderiza dinamicamente todas as seções afetadas (`renderHeroStats`, `renderFicha`, `renderExercicios`, `renderMontar`, `renderProgresso`, `updateEmptyWorkoutButtons`, `updateGlobalMasteryUI`, `applyProfileCustomization`, `_renderProfileEmblems`, `updateDeckMaestriaWidget`, `initDashboard`, `initCalculator`) sem reload. Fecha o overlay da Ficha se estiver aberto (`closeFichaOverlay({ force: true })`) e esconde qualquer modal aberto. Mantém o usuário no overlay de Perfil, conforme preferência. Toast final: "Interface atualizada com os dados importados!".
- **`Diretrizes/system_map.json`**: `version` incrementada para `3.3.1`, `last_updated` atualizado para `2026-06-03`. Adicionada entrada `edit_backup_export_import` em `ia_quick_reference`. Descrições de `user_profile` e `app_init` atualizadas para refletir a v3.3.1. `dom_selectors` de `user_profile` expandido com `[data-action='export-data']`, `[data-action='import-data']`, `#inputImportarJSON` e `#modalConfirm`.

## [v3.3.0] - 2026-06-02
*Widget central do Dashboard (Início) substituído pelo Radar Tático de Atributos de Performance*

### [Changed]
- **`componentes/secoes/dashboard.html`**: Substituído o bloco `.dash-arena-content` (que continha `<img id="dashArenaImg" src="./Assets/Arenas/Forja.png">` e as partículas `.dash-arena-particles`) por um cabeçalho com título "Atributos de Performance" + toggle Mensal/Total (botões `#btnDashRadarMensal`/`#btnDashRadarTotal`) e um container `<div id="dashRadarChartContainer" class="dash-radar-container">` que recebe o SVG do radar. O rodapé `.dash-arena-footer` (botão de troféu dourado + barra de XP do nível) foi mantido intacto.
- **`JS/treino/secao-progresso.js`**: Função `renderRadarChart(db)` refatorada em uma versão generalizada `renderRadarChart(db, options = {})` que aceita `containerId`, `mensalBtnId`, `totalBtnId` e `gradientId` como parâmetros (com defaults preservando o comportamento original em Progresso). Lógica de cálculo de stats, achievements, tier e atualização do arquétipo do Perfil extraída para helpers internos: `computeRadarStats(db)`, `applyRadarSideEffects(db, stats)`, `buildRadarSvgHtml(stats, db, gradientId)` e `updateProfileArchetypeBadge(stats, db)`. Side effects (achievements e promoção de tier) são aplicados uma única vez por ciclo de renderização via flag `radarSideEffectsApplied` (resetada por `rerenderAllRadarInstances(db)` ao trocar de modo Mensal/Total), evitando duplicação quando o mesmo stats é renderizado em ambos os containers. Botões de Mensal/Total de qualquer instância re-renderizam Progresso + Dashboard em sincronia. Atualizado `id` do `<radialGradient>` SVG para receber o `gradientId` injetado (evita colisão quando ambos os SVGs coexistirem no DOM).
- **`JS/treino/secao-dashboard.js`**: Adicionado import de `renderRadarChart` de `secao-progresso.js`. Em `renderDashboard(db)`, antes de `applyProfileCustomization`, agora chama `renderRadarChart(db, { containerId: 'dashRadarChartContainer', mensalBtnId: 'btnDashRadarMensal', totalBtnId: 'btnDashRadarTotal', gradientId: 'dashRadarGrad' })` se o container existir.
- **`style/treino/secoes/dashboard.css`**: Removido `aspect-ratio: 1.3` de `.dash-arena-content` (o radar é quadrado e o conteúdo é variável); alterado o `display` de `flex` com `align-items/justify-content: center` para `flex-direction: column` com `align-items: stretch`. Adicionadas classes `.dash-radar-header` (flex row com título h3 e toggle de botões) e `.dash-radar-container` (flex centralizado com `min-height: 220px` e `radar-wrapper` interno com `max-width: 280px`). Media query para `max-width: 480px` ajustada: `.dash-arena-content` agora tem apenas `padding: 10px 12px 6px` (sem aspect-ratio), `.dash-radar-header h3` com `font-size: 0.85rem` e `.dash-radar-container` com `min-height: 180px`.
- **`Diretrizes/system_map.json`**: `version` incrementada para `3.3.0`. Descrição de `dashboard_home` atualizada para refletir que o widget central exibe o Radar Tático (substituiu a Forja) com botões Mensal/Total sincronizados com Progresso, badge de Tier mantido, e ausência de botão de compartilhar/legenda. Descrição de `analytics_progress` atualizada mencionando a generalização de `renderRadarChart(db, options?)`, os helpers internos e o compartilhamento de `currentRadarMode`/tier entre Progresso e Dashboard. Seletores DOM e `ia_quick_reference` atualizados.

### [Removed]
- **`componentes/secoes/dashboard.html`**: Removidos o `<img id="dashArenaImg" src="./Assets/Arenas/Forja.png">` e o contêiner `.dash-arena-particles` (três partículas `.cr-particle`) do widget central do Dashboard. A imagem da Forja deixa de ser exibida no Início.
- **`style/treino/secoes/dashboard.css`**: Regra `.dash-arena-img` (específica da imagem da Forja) foi mantida no CSS (sem quebrar o caso de uso legado, caso o asset volte a ser referenciado em outro lugar), mas deixou de ser aplicada a partir desta versão.

## [v3.2.0] - 2026-06-02
*Seção Ficha convertida em overlay fullscreen acionado exclusivamente pelo 'PRÓXIMO PASSO' do Dashboard*

### [Changed]
- **`treino.html`**: Removido o `<div class="section-slide" data-section="ficha">` (antigo slide 0) do `section-strip` (substituído por comentário explicativo). Adicionado novo contêiner `<div id="ficha-overlay" class="ficha-overlay">` full-bleed (sem header fixo, decisão de imersão), com área scrollable `<div class="ficha-overlay__scroll" id="fichaOverlayScroll">` que recebe o conteúdo de `ficha.html` via `loader.js`.
- **`JS/treino/nav.js`**: Removido `'ficha'` de `sectionsOrder` (agora `['treinos', 'progresso', 'dashboard', 'loja', 'social']`). `initialIndex` agora é sempre o índice do Dashboard (a auto-abertura da Ficha migrou para `app.js` via `openFichaOverlay()`). Adicionada interceptação em `transitionTo()` que detecta `targetId === 'ficha'` e chama `window.openFichaOverlay()` (defesa em profundidade, mesmo padrão do `perfil`). Adicionada regra em `touchstart` para bloquear gestos de swipe quando `e.target.closest('.ficha-overlay')` (evita conflito com scroll interno do overlay).
- **`JS/treino/loader.js`**: Alterado o `target` do fragmento `ficha.html` de `[data-section="ficha"]` para `#fichaOverlayScroll`, injetando o conteúdo dentro do overlay em vez do slide removido.
- **`JS/treino/secao-dashboard.js`**: `startWorkoutFromDashboard(db)` substituiu `window._transitionTo('ficha')` e o `setTimeout`+`scrollIntoView` por `window.openFichaOverlay()` (com fallback para `_transitionTo` caso o módulo ainda não tenha carregado). O overlay já é full-bleed e abre no topo, eliminando a necessidade do scroll programático.
- **`JS/treino/app.js`**: Importa o novo módulo `ficha-overlay.js` (`initFichaOverlay`, `openFichaOverlay`, `closeFichaOverlay`). Chama `initFichaOverlay()` no DOMContentLoaded após `initPerfilOverlay`. Adicionada lógica de auto-abertura: se `db.fichaEmAndamento && db.fichaEmAndamentoDate === today()` (ou fallback para `workout_start_time` do dia atual), chama `openFichaOverlay()` via `requestAnimationFrame` (aguarda a splash sair e o conteúdo ser pintado). Listener de `#btnEncerrarConfirmar` agora também fecha o overlay com `force: true` (ignora checagem de workout_start_time, já limpo por `encerrarTreinoGlobal`). Expõe globalmente `window.openFichaOverlay`, `window.closeFichaOverlay` e `window.isFichaOverlayOpen`.
- **`style/treino/7-nav-icons.css`**: Largura de `.section-strip` ajustada de `700vw` para `500vw` (5 slides ativos em vez de 6, já que Ficha, Perfil e o antigo "REMOVIDO" comentário não ocupam largura).

### [Added]
- **`style/treino/secoes/ficha-overlay.css`** (NOVO): Estilos do overlay seguindo o design system. Inclui:
  - `.ficha-overlay`: container fullscreen `position: fixed; inset: 0; z-index: 600; background: #0a0514;` com animação `fichaOverlayFadeIn` (320ms cubic-bezier com scale 0.98→1) e `fichaOverlayFadeOut` (240ms).
  - `.ficha-overlay__scroll`: container flex scrollável com scrollbar customizada roxa (`::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3) }`) e `overscroll-behavior: contain`.
  - Ajustes para `.ficha-overlay__scroll .treino-container` (padding-top: 0, padding-bottom: 32px) e `.ficha-overlay__scroll .treino-hero` (margin-top: 0, já que o hero é o cabeçalho visual do overlay).
  - Regra `body.ficha-overlay-open { overflow: hidden; touch-action: none }` para travar scroll do body quando overlay ativo.
- **`JS/treino/ficha-overlay.js`** (NOVO): Módulo ES6 com:
  - `openFichaOverlay()`: faz fade-in (display: flex, aria-hidden: false), adiciona classe `ficha-overlay-open` ao body, scroll para o topo, foca primeiro elemento interativo (acessibilidade), dispara evento customizado `fichaoverlay:open`.
  - `closeFichaOverlay({ force })`: checa se há workout em andamento (`hasActiveWorkout()`); se SIM e `!force` → abre `modalEncerrarTreino` via `window.openModal()` (overlay permanece aberto, usuário confirma ou cancela); caso contrário aplica classe `is-closing` para fade-out, aguarda `animationend`, esconde display, remove classe do body, devolve foco ao `lastFocused`, chama `window._transitionTo('dashboard')` no final e dispara `fichaoverlay:close`.
  - `initFichaOverlay()`: listener de `keydown` para ESC fechar, exposição global de funções, e listener em captura (`addEventListener('click', ..., true)`) que intercepta cliques em `[data-section="ficha"]` (defesa em profundidade).
  - `hasActiveWorkout()`: helper que valida se `workout_start_time` existe **e** é do dia atual (evita restores antigos).
- **`style/treino/5-premium-design.css`**: Adicionado `@import url('./secoes/ficha-overlay.css?v=1');` na lista de imports de estilos modulares premium.

### [Removed]
- **`treino.html`**: Removido o slide 0 (Ficha) do `section-strip` (substituído por comentário explicativo apontando para `#ficha-overlay`). A Ficha deixa de existir como destino de swipe e de bottom-nav.
- **`JS/treino/nav.js`**: `'ficha'` removido do array `sectionsOrder`. A Ficha não é mais uma posição do strip.

## [v3.1.0] - 2026-06-02
*Seção Perfil convertida em interface fullscreen acionada pelo cartão de visitas do Dashboard*

### [Changed]
- **`treino.html`**: Removido o `<div class="section-slide" data-section="perfil">` (antigo slide 4) do `section-strip`. Removido o `<button class="bnav-btn" data-section="perfil" id="bnavPerfil">` do Bottom Nav (agora 5 botões: Treinos · Progresso · Início · Loja · Social). Adicionado novo contêiner `<div id="perfil-overlay" class="perfil-overlay">` com header sticky (título "MEU PERFIL" + botão X de fechar CoD-style) e área scrollable `<div class="perfil-overlay__scroll" id="perfilOverlayScroll">` que recebe o conteúdo de `perfil.html` via `loader.js`.
- **`JS/treino/nav.js`**: Removido `'perfil'` de `sectionsOrder` (agora `['ficha', 'treinos', 'progresso', 'dashboard', 'loja', 'social']`). Adicionada interceptação em `transitionTo()` que detecta `targetId === 'perfil'` e chama `window.openPerfilOverlay()` em vez de navegar no strip. Adicionada regra em `touchstart` para bloquear gestos de swipe quando `e.target.closest('.perfil-overlay')` (evita conflito com o scroll interno do overlay).
- **`JS/treino/loader.js`**: Alterado o `target` do fragmento `perfil.html` de `[data-section="perfil"]` para `#perfilOverlayScroll`, injetando o conteúdo dentro do overlay em vez do slide removido.
- **`JS/treino/secao-dashboard.js`**: Listener do `dashBtnMenu` (botão hambúrguer do header do Dashboard) agora é um no-op (apenas `event.stopPropagation()`), deixando de redirecionar para o perfil. Conforme decisão de UX, **apenas o cartão de visitas** (`#dashProfileCard`) abre o perfil.
- **`componentes/secoes/dashboard.html`**: `onclick` inline do `#dashProfileCard` alterado de `window._transitionTo('perfil')` para `window.openPerfilOverlay && window.openPerfilOverlay()`. Adicionados `role="button"` e `tabindex="0"` para acessibilidade. `onclick` do `dashBtnMenu` reduzido para apenas `event.stopPropagation();`.
- **`JS/treino/app.js`**: Importa o novo módulo `perfil-overlay.js` (`initPerfilOverlay`, `openPerfilOverlay`, `closePerfilOverlay`). Chama `initPerfilOverlay()` no DOMContentLoaded após `initPerfilTabs` e `initPersonalizarTab`. Expõe globalmente `window.openPerfilOverlay`, `window.closePerfilOverlay` e `window.__applyProfileCustomization` (re-aplica personalização ao abrir o overlay, garantindo sincronização com o estado mais recente do DB).

### [Added]
- **`style/treino/secoes/perfil-overlay.css`** (NOVO): Estilos do overlay seguindo o design system (variáveis CSS, glassmorphism, micro-animações). Inclui:
  - `.perfil-overlay`: container fullscreen `position: fixed; inset: 0; z-index: 600; background: #0a0514;` com animação `perfilOverlayFadeIn` (320ms cubic-bezier com scale 0.98→1) e `perfilOverlayFadeOut` (240ms).
  - `.perfil-overlay__header`: header sticky com `backdrop-filter: blur(16px)`, borda inferior roxa e sombra de profundidade. Título `.perfil-overlay__title-main` em Rajdhani 800 com letter-spacing 2.5px + subtítulo `.perfil-overlay__title-sub`.
  - `.perfil-overlay-close`: botão X quadrado 44×44px com fundo vermelho translúcido (`rgba(239,68,68,0.18)`), borda vermelha, ícone SVG inline, hover com `translateY(-1px) scale(1.04)` e glow vermelho, active com scale-down.
  - `.perfil-overlay__scroll`: container flex scrollável com scrollbar customizada roxa e `overscroll-behavior: contain`.
  - Ajustes para `.perfil-overlay__scroll .treino-tabs-section.section-subtabs` (sticky top: 70px, abaixo do header) e `.perfil-overlay__scroll .treino-container` (padding-top: 0, padding-bottom: 32px).
  - Regra para ocultar o botão legado do bottom-nav (`.bottom-nav .bnav-btn[data-section="perfil"] { display: none }`) como fallback.
  - Media query para telas ≤ 380px (header/padding/ícones menores).
  - Regra `body.perfil-overlay-open { overflow: hidden; touch-action: none }` para travar scroll do body quando overlay ativo.
- **`JS/treino/perfil-overlay.js`** (NOVO): Módulo ES6 com:
  - `openPerfilOverlay()`: faz fade-in (display: flex, aria-hidden: false), adiciona classe `perfil-overlay-open` ao body, scroll para o topo, foca primeiro elemento interativo (acessibilidade), re-aplica personalização via `__applyProfileCustomization()`, dispara evento customizado `perfiloverlay:open`.
  - `closePerfilOverlay()`: aplica classe `is-closing` para fade-out (240ms), aguarda `animationend` para esconder display, remove classe do body, devolve foco ao elemento que originou a abertura (`lastFocused`), chama `window._transitionTo('dashboard')` no final (garante retorno ao Início) e dispara `perfiloverlay:close`.
  - `initPerfilOverlay()`: bind do botão X, listener de `keydown` para ESC fechar, exposição global de funções, e listener em captura (`addEventListener('click', ..., true)`) que intercepta cliques em elementos com `data-section="perfil"` e redireciona para `openPerfilOverlay` (defesa em profundidade para chamadas legadas).

### [Removed]
- **`treino.html`**: Removido o slide 4 (Perfil) do `section-strip` (substituído por comentário explicativo apontando para `#perfil-overlay`). Removido o botão `#bnavPerfil` do Bottom Nav.
- **`JS/treino/nav.js`**: `'perfil'` removido do array `sectionsOrder`. O perfil deixa de existir como destino de swipe e bottom-nav.

## [v2.5.0] - 2026-06-02
*Ficha deixa de ser a seção inicial — Dashboard vira a landing page; Ficha só aparece via 'PRÓXIMO PASSO'*

### [Changed]
- **`treino.html`**: Movida a classe `active` do Bottom Nav de `#bnavFicha` para `#bnavDashboard` (Início).
- **`JS/treino/nav.js`**: Adicionado import de `today` do `db.js`. `initTabs(db)` agora calcula `initialIndex` dinamicamente: se `db.fichaEmAndamento === true` **E** `db.fichaEmAndamentoDate === today()` → abre na Ficha (índice 0); caso contrário, abre no Dashboard (índice 3). Strip é posicionado via `requestAnimationFrame` + `jumpTo(initialIndex)` para evitar flash visual.
- **`JS/treino/secao-dashboard.js`**: `startWorkoutFromDashboard(db)` agora seta `db.fichaEmAndamento = true` e `db.fichaEmAndamentoDate = today()` antes de navegar para a Ficha, permitindo que reloads no meio do treino voltem para a Ficha automaticamente.
- **`JS/treino/secao-ficha.js`**: `initGlobalTimer` — ao clicar no botão "ENCERRAR TREINO" (toggle do cronômetro), em vez de encerrar imediatamente, agora abre `modalEncerrarTreino` para confirmação. A função `encerrarTreinoGlobal` continua intacta e é chamada pelo listener do botão de confirmação.

### [Added]
- **`componentes/secoes/modais.html`**: Novo modal `modalEncerrarTreino` ("Encerrar treino sem concluir?") com botões `#btnEncerrarCancelar` ("CONTINUAR TREINO") e `#btnEncerrarConfirmar` ("SIM, ENCERRAR").
- **`JS/treino/app.js`**: Listeners do `modalEncerrarTreino`:
  - `#btnEncerrarCancelar` → fecha o modal.
  - `#btnEncerrarConfirmar` → detecta se vai disparar o modal de Conclusão (todos os exercícios marcados), chama `encerrarTreinoGlobal(db)`, limpa `db.fichaEmAndamento/fichaEmAndamentoDate`, e navega para o Dashboard via `window._transitionTo('dashboard')` (somente se NÃO for concluir — caso contrário, o usuário navegará ao clicar "Incrível!").
- **`JS/treino/app.js`**: Listener do `#btnFecharConclusao` (botão "INCRÍVEL!") agora limpa `db.fichaEmAndamento/fichaEmAndamentoDate`, fecha o modal e navega para o Dashboard. Garantia de que recargas futuras abram no Dashboard.
- **`style/treino/7-nav-icons.css`**: Regra `.btn-start-workout { display: none !important; }` que oculta visualmente o botão legado "INICIAR TREINO" / "ENCERRAR TREINO" presente no header da Ficha. Mantido no DOM para preservar a lógica de cronômetro (`initGlobalTimer`/`stopGlobalTimer`).
- **Schema do `db` (localStorage)**: Novos campos `fichaEmAndamento: boolean` e `fichaEmAndamentoDate: string (YYYY-MM-DD)`. O `date` permite auto-expirar a flag à meia-noite (treino abandonado de um dia para o outro não força abertura na Ficha).

### [Removed]
- **`treino.html`**: Removido o `<button class="bnav-btn" data-section="ficha" id="bnavFicha">` do Bottom Nav. A Ficha agora é acessível **exclusivamente** via "PRÓXIMO PASSO" do Dashboard. O slide `<div class="section-slide" data-section="ficha">` continua existindo no DOM (necessário para o loader injetar `ficha.html` e para `window._transitionTo('ficha')` funcionar).

## [v3.0.4] - 2026-06-02
*Remoção da Coluna Grupo Muscular no Modo Tabela da Ficha*

### [Removed]
- **`componentes/secoes/ficha.html`**: Removido o `<th class="col-grp">Grupo</th>` do cabeçalho (`<thead>`) da tabela de treino, eliminando a coluna "Grupo" exclusivamente no modo de exibição em Tabela da seção Ficha.
- **`JS/treino/templates.js`**: Removido o `<td>` contendo o badge de grupo muscular (`<span class="${badgeCls}">${ex.grupoMuscular}</span>`) da função `fichaTableRow`, alinhando as colunas da tabela com o novo cabeçalho. Os modos Grid e Coleção (Deck) não foram alterados e continuam exibindo o grupo muscular normalmente.

## [v3.0.3] - 2026-06-01
*Ajuste de Dimensionamento dos Elementos do Cabeçalho do Dashboard*

### [Changed]
- **`componentes/secoes/dashboard.html`**: Aumentado o tamanho do avatar exibido para `w-28 h-28`, os botões de navegação superiores (Social, Notícias, Menu) para `w-14 h-14` (ícones `text-[28px]`), e o widget/barra de missões para usar hexagon de `w-8 h-8` com coroa `text-[18px]` e barra de progresso `w-32 h-3`. Adicionadas classes semânticas (`dash-header-btn`, `dash-missions-pill`, etc.) para melhor controle CSS.
- **`style/treino/secoes/dashboard.css`**: Adicionadas regras de dimensionamento responsivas para o avatar (`112px` desktop, `96px` mobile), botões superiores (`56px` com ícone `28px` no desktop, `48px` com ícone `24px` no mobile) e widget de missões (`128px` de largura da barra no desktop, `96px` no mobile), prevenindo quebras de layout em telas compactas.

## [v3.0.2] - 2026-06-01
*Redesenho Premium do Cabeçalho do Dashboard*

### [Changed]
- **`componentes/secoes/dashboard.html`**: Redesenhada a parte superior da seção Início/Dashboard para o design premium de `NovaDash.html`, unificando a exibição do Calling Card ativo como fundo do cabeçalho, adicionando suporte a avatar dinâmico com molduras de prestígio, botões de ação melhorados e contador de missões em formato de pílula translúcida. Ajustados os tamanhos do avatar (para 96px), dos botões de ação do topo (para 48px com ícones de 24px) e da barra de missões (para 96px de largura) atendendo à solicitação de redimensionamento.
- **`style/treino/secoes/dashboard.css`**: Adicionado posicionamento edge-to-edge para o novo cabeçalho do dashboard (`.dash-header-calling-card`), overrides e estilos de molduras quadradas arredondadas (squircles) para o avatar (atualizado para 96px) e clips hexagonais.
- **`JS/treino/secao-customizacao.js`**: Atualizada a lógica de `applyProfileCustomization` para usar `querySelectorAll`, permitindo a sincronização em tempo real do banner e moldura/avatar ativo no cabeçalho do Perfil e do Dashboard simultaneamente.
- **`JS/treino/secao-dashboard.js`**: Ajustados os eventos de clique de Missões e Notícias no dashboard para abrir os overlays interativos e completos (`openMissionsOverlay` e `openNewsOverlay`) integrados no PWA.

## [v3.0.1] - 2026-06-01
*Correções de Estilo: Inputs, Botão Salvar e Ícone de Adicionar Exercício*

### [Fixed]
- **`style/treino/8-customizacao.css`**: Corrigida a cor do texto do botão `.customizacao-modal__save-btn` de `#000` para `#fff`, tornando o texto "SALVAR ALTERAÇÕES" visível sobre o fundo roxo em todas as sub-abas de Personalizar.
- **`style/treino/8-customizacao.css`**: Corrigido o campo `.profile-name-input` (Nome de Exibição, Handle e Frase de Assinatura na sub-aba Identidade). Substituído o fundo semitransparente `rgba(255,255,255,0.06)` por cor escura sólida `#12082a`, evitando que o navegador renderize fundo branco padrão. Adicionado `appearance: none`, `::placeholder` e `box-sizing: border-box` para garantir consistência cross-browser.
- **`style/treino/secoes/perfil.css`**: Corrigido o campo `.sec-input` (Segurança e Conta, sub-aba Preferências). Substituído o fundo semitransparente `rgba(255,255,255,0.04)` por cor escura sólida `#0e0818`, eliminando o fundo branco exibido pelo navegador. Adicionado `appearance: none` para normalização.
- **`style/treino/secoes/toolbar-busca.css`**: Corrigido o estilo do botão `.btn-novo-ex-min` (ícone "+" de Novo Exercício na sub-aba Coleção). Removido o `gradient-gold` com `color: #000`, que destoava dos demais ícones da toolbar. Substituído por estilo escuro com acento laranja translúcido (`background: rgba(249,115,22,0.15); color: #f97316; border: 1px solid rgba(249,115,22,0.35)`) para manter o padrão visual da aba.

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

## [v2.4.2] - 2026-05-19
*Correção e Aperfeiçoamento do Background Geral Premium em Cinza*

### [Fixed]
- **`style/treino/5-premium-design.css`:** Corrigida a persistência visual do fundo roxo. Foi aplicada a dessaturação total (`filter: saturate(0) brightness(0.6) contrast(1.1)`) diretamente na camada principal `.cr-bg-layer` do background do Clash Royale (a imagem de fundo `BG-roxo-vertical.jpg`/`BG-roxo-horizontal.jpg`).
- **`style/treino/5-premium-design.css`:** Alterado o gradiente do `.cr-bg-overlay` de tons roxos (`rgba(10,5,20,...)`) para um gradiente de cinza grafite neutro (`rgba(20,20,22,...)`), assegurando um contraste harmônico e confortável para as páginas do app.
- **`style/treino/5-premium-design.css`:** Ajustada a iluminação das partículas de Elixir (`.cr-particle`) e da trilha `.cr-p5` de roxo/azul brilhante para prata/branco reluzente, consolidando a identidade de metal e cinza chumbo premium.
- **`sw.js`:** Incrementada a versão do Service Worker (`CACHE_NAME`) para `'academia-treino-v19'` para limpar o cache local e forçar a exibição do novo design do fundo em cinza grafite.

---

## [v2.4.1] - 2026-05-19
*Atualização estética do background geral para a variação em cinza (Premium Update)*

### [Changed]
- **`style/main.css`:** Atualizadas as variáveis globais `--background` (de `#000000` para `#121212`) e `--background-alt` (de `#0a0a0a` para `#1f1f1f`), além do fallback de `background-color` do `body` para `#121212` para implementar o novo design com fundo em cinza grafite premium e remover o contraste excessivo do preto puro.
- **`componentes/thememanager.js`:** Atualizadas as definições de cores de fundo de todos os temas escuros com cores de destaque (`dark`, `blue`, `green`, `red`, `orange`, `pink`, `cyan`) para utilizar a variação em cinza (`background: '#121212'` e `backgroundAlt: '#1f1f1f'`). Atualizados os valores iniciais da injeção de estilos globais `:root` em `injectGlobalStyles()`.
- **`sw.js`:** Incrementada a versão do Service Worker (`CACHE_NAME`) para `'academia-treino-v18'` para limpar o cache dos navegadores dos clientes e garantir a aplicação imediata do novo design do background em cinza.

---

## [v2.4.0] - 2026-05-19
*Expansão Premium do Sistema de Customização de Perfil (Fase 2)*

### [Added]
- **Feature 1: Banners Animados (Premium Tier):** Adicionados 5 novos banners com CSS avançado (`conic-gradient`, `@property`, `mix-blend-mode`, `filter: blur`) na `secao-customizacao.js` e `8-customizacao.css`. Banners: Plasma Elétrico, Aurora Viva, Vulcão, Matrix e Nebulosa.
- **Feature 5: Emblemas Animados (Premium Tier):** Implementadas 3 classes de animação 3D e multicamadas para emblemas (`pulse-glow`, `spin-3d` com `rotateY`, `flicker` com `drop-shadow` dinâmico).
- **Feature 6: Skins do Cronômetro:** Adicionado catálogo `TIMER_SKINS` na `secao-customizacao.js`. O modal de perfil agora permite trocar a skin do timer de descanso (Radar Tático, Ampulheta, Cyber Relógio, Arcade Bit). Seleção salva no `db.profileCustomization.timerSkin`.
- **Feature 8: Arquétipo / Classe:** Integrada análise de stats do `renderRadarChart` (em `secao-progresso.js`) para classificar dinamicamente o usuário baseado nos pontos dominantes do Radar Fit (ex: Bárbaro, Ninja, Máquina). A classe é exibida num badge especial ao lado do nome do jogador (`treino.html`).
- **Animações In-Game para Cronômetro:** Inseridos os SVGs e lógicas complexas para as skins `cyber` (anel neon dinâmico) e `arcade` (barra estilo jogo de luta com mudança de cor) em `secao-ficha.js`.

### [Changed]
- `8-customizacao.css`: O design dos Banners e Emblemas Animados foi totalmente reescrito, abandonando animações básicas por CSS ultra-complexo e imersivo, garantindo um nível estético "AAA".

---

## [v2.3.0] - 2026-05-19
*Correção crítica do Sistema de Histórico — Fonte Única de Verdade para Stats*

### [Fixed]

#### Bug 1 — Escrita não-atômica do histórico (Raiz de todas as inconsistências)
- **`JS/treino/secao-ficha.js`:** Em 3 pontos de conclusão de treino (listener de `.check-input`, listener de `.btn-set`, e `focusCheck()`), o campo `concluido: true` era gravado **antes** de `treinos.push(treino)`. Isso criava uma janela de inconsistência: se o app recarregasse nesse instante, `getStreak()` contaria o dia mas `treinos[]` estaria vazio, corrompendo o breakdown do ciclo e a contagem de treinos.
- **Correção:** Os 3 pontos agora gravam `treinos[]` e `concluido: true` no mesmo `saveDB()` (escrita atômica), sem janelas de estado intermediário.

#### Bug 2 — Dupla contagem no Ciclo de Treino
- **`JS/treino/secao-ficha.js` → `showConclusao()`:** `db.currentFichaWorkouts++` e `db.currentCycleBreakdown[letra]++` eram incrementados manualmente, mas `renderProgresso()` já os recalculava do histórico real a cada render — causando contagem duplicada (ex: ciclo mostrava 4 quando deveria ser 2).
- **Correção:** Removidos os incrementos manuais de `showConclusao()`. A verificação de ciclo completo (30 treinos) agora usa contagem recalculada do histórico real diretamente.

#### Bug 3 — Dados de streak divergentes entre seções
- **`JS/treino/db.js` → `renderHeroStats()`** e **`JS/treino/secao-progresso.js` → `renderProgresso()`** calculavam `streak` de forma independente e atualizavam subconjuntos diferentes de elementos DOM, podendo mostrar valores diferentes simultaneamente.
- **`#statStreak`** (hero da Ficha) só era atualizado por `renderHeroStats`. **`#progStreakVal`** (seção Progresso) só por `renderProgresso`. **`#profStreak`** (seção Perfil) por ambas. Se uma delas fosse chamada sem a outra, os valores divergiam.
- **Correção:** `renderProgresso()` agora atualiza os 3 elementos de streak (`statStreak`, `progStreakVal`, `profStreak`) em um único bloco. `renderHeroStats()` foi refatorado para delegar streak/XP via `import()` dinâmico para `renderProgresso`, eliminando a lógica duplicada.

#### Bug 4 — `renderProgresso` sem null-check causava crash
- Elementos como `progXpFill`, `progTotalTreinos`, `progMesTreinos` eram acessados sem checar existência. Se a seção não estivesse no DOM (ex: durante testes isolados), causava `TypeError: Cannot set properties of null`.
- **Correção:** Todos os acessos a elementos DOM em `renderProgresso` agora usam guard `el('id') && el('id').x = y` consistentemente.

### [Added]

- **`JS/treino/secao-progresso.js` → `migrarHistoricoLegado(db)`:** Nova função de migração executada silenciosamente a cada `renderProgresso()`. Corrige entradas legadas que possuem `concluido: true` mas `treinos[]` vazio/ausente (gravadas por versões anteriores ao fix atômico), usando `entry.treino` (campo legado) como fallback.

- **`README.md`:** Criado com documentação completa do projeto, incluindo:
  - Estrutura de módulos e responsabilidades
  - Schema completo do banco de dados localStorage
  - **Seção detalhada sobre o Sistema de Histórico** (estrutura de entrada, regra de escrita atômica, pontos de entrada de conclusão, o que `showConclusao` faz)
  - Documentação de `renderProgresso` como fonte única de verdade
  - Padrões de CSS, UX e convenções de desenvolvimento

### [Changed]

- **`JS/treino/db.js` → `renderHeroStats()`:** Refatorado para ser um delegador leve. Atualiza apenas `#statTotalEx` (exclusivo do hero) e chama `renderProgresso` via import dinâmico para o restante. Elimina a duplicação de cálculo de streak/XP.
- **`JS/treino/secao-progresso.js` → `renderProgresso()`:** Agora é a **única fonte de verdade** para todos os stats derivados. O ciclo é sempre recalculado do `db.historico` real. O `currentCycleBreakdown` usa `treinos[] || [treino]` como fallback para compatibilidade com dados legados.

---

## [v2.2.1] - 2026-05-19

*Ajustes de UI/UX em Modos de Exibição (Tabela, Grid e Coleção)*

### [Changed]
- **`JS/treino/templates.js`**:
  - Modificado `fichaTableRow` para reestruturar as repetições e o ícone de notas em uma grid 2x2 (`.series-grid-table`).
  - Modificado `fichaGridCard` para posicionar o botão de notas (`.btn-note-toggle`) inline, lado a lado na mesma linha que as séries (repetições) dentro de `.series-wrap-grid`.
  - Modificado `fichaDeckCard` (Modo Coleção) para posicionar o botão de notas (`.btn-note-toggle-deck`) inline, lado a lado na mesma linha que as séries dentro de `.series-wrap-deck`.
  - Modificado `treinosCollectionCard` para mover o botão de editar inline ao lado do nível de repetições/séries.
- **`style/treino/3-foco-badges.css`**:
  - Adicionado estilo `.series-grid-table` para formatar a grid de repetições 2x2 no Modo Tabela.
  - Adicionado estilo `.series-wrap-grid` para flexibilizar os botões horizontais no Modo Grid.
  - Adicionado estilo `.series-wrap-grid .btn-note-toggle` garantindo um ícone de nota quadrado de `30px` perfeitamente alinhado na mesma linha horizontal das séries.
  - Adicionado estilo `.btn-ex-edit-inline` e seu estado `:hover` para um micro-feedback hático ao editar na Coleção.
- **`JS/treino/db.js`**:
  - Modificado o layout inicial padrão de exibição de exercícios no Deck Builder (`currentExView`) de `'colecao'` para `'grid'` por padrão.
  - Modificado o layout inicial padrão de exibição da Ficha (`currentViewMode`) de `'table'` para `'grid'` por padrão.
- **`style/treino/5-premium-design.css`**:
  - Redimensionado `.btn-note-toggle-deck` para `26px` por `26px` (e `border-radius: 6px`) para alinhar de forma simétrica lado a lado na mesma linha das séries.
  - Alinhados perfeitamente os botões de menu, alternar páginas (primeiros/últimos 5 decks), seletor de letras e modos de visualização no cabeçalho do Deck Builder na mesma linha central horizontal de 24px.

## [v2.2.0] - 2026-05-18
*Implementação do Sistema de Personalização de Perfil — Inspirado em Call of Duty Black Ops 6/7*

### [Added]
- **`JS/treino/secao-customizacao.js`:** Novo módulo dedicado à personalização de perfil. Exporta: `BANNERS`, `EMBLEMAS`, `TITULOS`, `AVATAR_SEEDS`, `AVATAR_FRAMES`, `isUnlocked()`, `applyProfileCustomization()`, `openCustomizacaoModal()`, `_renderProfileEmblems()`.
- **`style/treino/8-customizacao.css`:** Novo módulo CSS (padrão BEM) com todos os estilos do sistema de personalização: `.banner-option`, `.emblem-gallery__item`, `.titulo-option`, `.avatar-option`, `.frame-option`, `.customizacao-modal__*`, `.profile-edit-btn`, `.profile-titulo`, `.profile-name-input`.
- **8 Banners de Perfil Temáticos:** Roxo Neon (padrão), Aurora, Fogo Eterno, Ouro Elite, Ciberespaço, Shadow Ops, Aço Frio, Dragão de Ouro. Cada banner é um gradiente CSS com `radial-gradient` e efeitos opcionais (scanlines, flicker). Banners premium têm requisito de desbloqueio (`streak`, `treinos`, `maestria`).
- **12 Emblemas de Perfil:** Sistema de galeria com 3 slots de exibição no cartão do perfil. Emblemas desbloqueáveis via conquistas (streaks, XP, maestria). Bloqueados aparecem com `grayscale` e ícone de cadeado (CoD-style).
- **8 Títulos de Perfil:** Linha de texto motivacional exibida sob o nome (ex: "Forjado no Ferro", "Atleta de Elite"). Desbloqueados por progressão.
- **8 Estilos de Avatar:** Grid de seeds pré-definidas do Dicebear para personalização do avatar.
- **5 Molduras de Avatar:** Anéis coloridos ao redor do avatar (Nenhuma, Bronze, Prata, Ouro, Elite) com `box-shadow` elétrico.
- **Modal de Personalização CoD-Style:** Modal de tela cheia (bottom-sheet) com todas as opções de personalização agrupadas em seções. Abertura via botão de lápis (`profile-edit-btn`) no canto do cartão de perfil.
- **Schema DB `profileCustomization`:** Novo campo no `localStorage` com: `{ nome, handle, avatarSeed, banner, titulo, avatarFrame }`. Migração automática para usuários existentes no `loadDB()`.
- **Botão de Edição de Perfil:** Botão circular no canto do `profile-header` com ícone de lápis (SVG inline, sem emoji).

### [Changed]
- **`treino.html` — Slide Perfil:** Header do perfil atualizado para suportar `data-banner`, `data-frame` e o slot `.profile-titulo`. Adicionado `id="btnEditarPerfil"`.
- **`JS/treino/app.js`:** Integração do novo módulo: `import { applyProfileCustomization, openCustomizacaoModal, _renderProfileEmblems }`. Chamada automática no boot para restaurar o estado salvo. Listener do `btnEditarPerfil`.
- **`style/treino/treino.css`:** Adicionado `@import url('./treino/8-customizacao.css?v=1')`.

---

## [v2.1.2] - 2026-05-18

*Implementação do Sistema de Backgrounds Temáticos Dinâmicos (Estilo Clash Royale)*

### [Added]
- **Backgrounds Multi-Temáticos por Seção:** A interface agora suporta fatiamento de scroll (como na aba de Loja do Clash Royale). Longas abas podem ser divididas em blocos empilhados usando a classe `.theme-section`, onde cada bloco possui sua própria cor/tema de fundo independentemente.
- **Variações de Tema CSS:** Criadas classes de filtro de cor (`.theme-turquesa`, `.theme-carmesim`, `.theme-verde-selva`, `.theme-azul-pico`, `.theme-ouro`, `.theme-marrom-terra`, `.theme-laranja-lava`, `.theme-cinza-castelo`) no arquivo `5-premium-design.css`. 
- **Partículas Animadas:** Adicionado sistema de partículas flutuantes (`cr-bg-particles`) para dar vida e dinamismo ao background base, utilizando animações leves de `keyframes`.

### [Changed]
- **Otimização de Assets (Hue-Rotate):** Ao invés de carregar múltiplas imagens pesadas para diferentes texturas coloridas, o sistema usa apenas a imagem roxa base (`BG-roxo-vertical/horizontal.jpg`) e altera suas propriedades matematicamente (via `filter: hue-rotate()`, `brightness`, `saturate`) no CSS pseudo-layer `.theme-bg`. Isso garante alta performance e zero tempo de carregamento extra.
- **Aba Perfil Segmentada:** A aba Perfil foi reestruturada no DOM para implementar o novo sistema, possuindo agora blocos independentes para Visão Geral (Roxo), Ofensivas (Turquesa), Medalhas (Ouro), Nível (Azul Pico) e Configurações (Cinza Castelo).
- **Contraste de Interface:** Variáveis globais do `1-core.css` foram ajustadas. Os cartões (`--card-bg`) agora são mais opacos (`rgba(10,5,20,.6)`) e as sobreposições ganharam um `backdrop-filter: blur()` sutil para garantir que o texto não "concorra" com o padrão de textura dos diamantes de fundo.
- **Remoção de Fundos Obstrutivos:** Fundos maciços do `html`, `body` e `.treino-page` foram limpos para `transparent !important` para dar total visão do novo motor de background.

---

## [v2.0.0] - 2026-05-15
*Início do versionamento formal do projeto e migração arquitetural para Mobile-First e Modularização.*

### [Added]
- **Navegação em Deslize (Swipe):** Implementado ouvintes de evento (`touchstart`, `touchend`) para permitir transição entre abas horizontais imitando o layout contínuo do motor da Unity (Clash Royale Style).
- **Service Worker (v3):** Adicionado `catch` inteligente na requisição `fetch` do `sw.js` para retornar Resposta `404 offline` vazia ao invés de quebrar o PWA durante o download de arquivos estáticos falhos.

### [Changed]
- **ES Modules (Import/Export):** A arquitetura foi 100% transicionada para `ES Modules`. Todas as funções e variáveis globais foram protegidas em seus respectivos escopos. Variáveis mutáveis (`currentViewMode`, `currentDeckLetter`) agora utilizam *setters* explícitos. O arquivo `treino.html` agora invoca os módulos nativamente via `<script type="module" src="JS/treino/app.js"></script>`, removendo o acoplamento global no objeto `window`.
- **Componentização de Templates:** Introduzido o arquivo `templates.js` para centralizar a geração de strings HTML (Suggestion 4). Isso remove o "código espaguete" de HTML dentro do JS, facilitando a manutenção de cards, tabelas e slots do Deck Builder.
- **Migração UI/UX Mobile-First:** Substituído o sistema legado de abas superiores por uma **Bottom Navigation Bar** global com efeito *glassmorphism*.
- **Unificação Visual (Ícones):** Emojis legados foram substituídos por ícones `SVG inline (stroke)` responsivos, descritos no manifesto `Ícones.md`.
- **Modularização do JavaScript:** O arquivo monolítico `treino.js` (5.000+ linhas) foi extraído em módulos lógicos (`db.js`, `nav.js`, `secao-ficha.js`, `secao-treinos.js`, `secao-progresso.js`, `secao-perfil.js`, `app.js`).
- **Modularização do CSS:** O arquivo `treino.css` (5.400+ linhas) foi mapeado, cortado cirurgicamente e fracionado usando `@import` (`1-core.css`, `2-modals.css`, `3-foco-badges.css`, `4-gamificacao.css`, `5-premium-design.css`, `6-maestria.css`, `7-nav-icons.css`).
- **Animações de Transição:** Substituída animação vertical simples por sistema de posicionamento absoluto e `transform: translateX(100%)` com curva bezier elástica (`cubic-bezier(0.175, 0.885, 0.32, 1.1)`) para pareamento contínuo das telas lado a lado.

### [Removed]
- Antigas animações `fadeInUp` do container principal em favor do sistema direcional.

---

## [v2.1.0] - 2026-05-16
*Migração arquitetural completa do sistema de transições para o modelo Viewport + Strip, resolvendo definitivamente o bug de pré-carregamento/flash nas trocas de seção.*

### [Added]
- **Sistema Viewport + Strip:** Introduzidos os elementos estruturais `.section-viewport` (câmera/clip), `.section-strip` (fita horizontal), e `.section-slide` (slides individuais). Todas as 6 seções ficam **sempre renderizadas no DOM** — sem `display:none` — o que elimina o reflow de layout que causava o flash visual.
- **Rastreamento em Tempo Real do Dedo (Drag/Pan):** O sistema de swipe horizontal foi completamente reescrito para acompanhar o dedo do usuário frame-a-frame (assim como no Clash Royale). Ao arrastar a tela, as seções deslizam juntas perfeitamente mostrando o estado intermediário. Soltando o dedo, a transição finaliza com uma animação de mola nativa.
- **`transitionTo(targetId)`** em `JS/treino/nav.js`: Nova função central de navegação que substitui `switchSection()`. Anima apenas o `translateX` do strip inteiro, produzindo o efeito Clash Royale onde ambas as seções ficam visíveis simultaneamente durante o slide.
- **`jumpTo(index)`:** Função auxiliar que posiciona o strip instantaneamente (sem animação CSS) para casos de inicialização ou reset de estado.
- **`window._transitionTo`:** Exposição da função para uso externo (deep links, chamadas de outros módulos).
- **Plano de Implementação:** Arquivo `Transição.md` criado com diagnóstico completo do bug, escolha arquitetural justificada, pseudocódigo e tabela de riscos/mitigações.

### [Changed]
- **`treino.html`:** Reestruturação completa do DOM de conteúdo. O bloco `<section class="treino-content"><div class="treino-container">` foi substituído por `<div class="section-viewport"><div class="section-strip">`. Cada seção ganhou um wrapper `<div class="section-slide">`. O hero `<section class="treino-hero">` foi **movido para dentro do Slide 0 (Ficha)**, eliminando a necessidade de lógica JS para animá-lo separadamente.
- **`style/treino/7-nav-icons.css`:** Remoção completa do sistema antigo (`@keyframes crStripOutLeft/Right/InFromLeft/Right`, classes `.slide-out-left`, `.slide-in-right`, `.soft-fade`, `.cr-animating`). Substituído pelas regras de `.section-viewport`, `.section-strip` e `.section-slide`.
- **`style/treino/1-core.css`:** Removido `overflow-x: hidden` do `.treino-page` (agora desnecessário, pois `.section-viewport` gerencia o clipping horizontal).
- **`JS/treino/nav.js`:** Reescrita total. Removidas toda a lógica de `classList.add/remove` de classes de animação, o `setTimeout` de cleanup, e o controle manual de `style.display` do hero. Swipe gestures atualizados para chamar `transitionTo()`.
- **Service Worker:** Bumped para `v9` para forçar recarga do cache em todos os clientes e aplicar imediatamente o motor de drag/pan.

### [Fixed]
- **Sub-abas Sticky Incorretas (Seção Treinos):** O seletor superior (Exercícios / Montar Ficha) na aba Treinos havia perdido sua funcionalidade "sticky" e a proporção de espaçamento devido à refatoração do DOM. O código HTML foi corrigido (removido contêiner duplo) e o CSS atualizado para aplicar `position: sticky; top: 0`, um fundo semitransparente (glassmorphism) e `z-index` de prioridade, mantendo os botões fixos elegantemente no topo durante a rolagem.
- **Conflito de Swipe nas Microinterações (Drag/Modais):** O rastreamento de polegar em tempo real estava interceptando eventos indesejados. Corrigido adicionando bloqueios no `nav.js` para ignorar `touchstart` em:
  - Elementos arrastáveis (`[draggable="true"]`) APENAS dentro da interface de Montar Ficha (`#tab-montar`), permitindo a reordenação de cartas sem arrastar a tela, e restaurando o deslize natural na galeria da aba Exercícios.
  - Modais abertos (`.modal-overlay`) para que interações internas não disparem a transição de seções.
- **Visual e Posicionamento das Sub-abas (Pílula Flutuante):** Corrigido o erro que fazia as sub-abas ("Exercícios" / "Montar Ficha") flutuarem cobrindo o conteúdo de forma dinâmica (`position: sticky`). Removida a margem negativa herdada de versões anteriores (`margin-top: -40px` no core CSS) e restaurado o layout estático nativo (`position: relative;`). Agora, as abas ocupam a "área segura" superior e deslizam para fora da tela junto com o conteúdo, sem interrupções visuais.
- **Bug A — Troca Instantânea:** Seções com `display:none` não participavam do layout e não podiam ser animadas. O novo sistema mantém todas renderizadas, eliminando o reflow pré-animação.
- **Bug E — Pré-carregamento/Redimensionamento:** `renderMontar()` era chamado imediatamente ao clicar, causando atualização do DOM durante a animação. Agora é chamado dentro do callback `transitionend`, após o slide completar.
- **Área preta abaixo das seções (Corrigido Definitivamente):** O erro era causado pelo scroll global do `body`, que descia revelando espaço vazio embaixo das seções mais curtas. Corrigido bloqueando o scroll no `html` e `body` (`overflow: hidden; height: 100%`) e adicionando `overflow-y: auto` exclusivamente para cada `.section-slide`, como em um app nativo. Adicionado também o reset do scroll (`slide.scrollTop = 0`) durante as transições.

### [Removed]
- `switchSection()` — substituída por `transitionTo()`.
- Classes CSS de animação: `.slide-out-left`, `.slide-out-right`, `.slide-in-right`, `.slide-in-left`, `.soft-fade`, `.cr-animating`.
- `@keyframes`: `crStripOutLeft`, `crStripOutRight`, `crStripInFromRight`, `crStripInFromLeft`, `softFade`.
- Lógica de show/hide manual do `.treino-hero` via `style.display`.

---

## [v2.1.1] - 2026-05-17
*Correções de bugs no gráfico de volume, padronização de dropdowns e remoção de emojis remanescentes.*

### [Changed]
- **Padronização de Dropdowns:** O dropdown de filtro de volume (`#filterVolume`) foi atualizado para seguir o estilo escuro premium (fundo `#111`, texto branco, `appearance: none` e seta SVG), servindo de modelo para futuros dropdowns conforme registrado no README.
- **Remoção de Emojis:** Os emojis de tendência `📈` e `📉` no gráfico de volume foram substituídos por ícones SVG inline (`trending-up` e `trending-down`).

### [Fixed]
- **`ReferenceError: formatT is not defined`:** Corrigido erro no console ao renderizar o gráfico de linha de volume, definindo a função `formatT` localmente no escopo do gráfico.
- **Renderização de SVG em texto:** Corrigido bug onde o código SVG da tendência aparecia como texto puro no modal de detalhes de volume (mudança de `textContent` para `innerHTML`).
