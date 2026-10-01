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
