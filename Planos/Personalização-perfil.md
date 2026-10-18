# 🎮 Personalização de Perfil — Plano de Implementação
> Academia Workout Tracker · Inspirado em **Call of Duty: Black Ops 6 / 7**

---

## 📌 Contexto do Projeto

O Academia Workout Tracker é um PWA Mobile-First em **Vanilla JS puro**, com arquitetura modular (ES Modules nativos, sem bundler). O CSS é organizado em cascata numerada via `@import` no `style/treino.css`. Todo o estado do usuário persiste em **`localStorage`** sob a chave `academia_treino`.

### Arquitetura Existente (Resumo)
```
JS/treino/
  app.js                ← Entry point, inicialização e listeners globais
  db.js                 ← Schema, loadDB(), saveDB(), utils
  secao-perfil.js       ← Temas de cor, backup, compartilhamento (Share Card Canvas)
  secao-customizacao.js ← [FASE 1] Módulo de personalização de perfil
  secao-ficha.js        ← Modo foco, cronômetro de descanso
  secao-treinos.js      ← Deck Builder, maestria, exercícios
  secao-progresso.js    ← Radar Chart, calendário, cálculo 1RM

style/treino/
  1-core.css            ← Variáveis globais, tipografia, reset
  2-modals.css          ← Modais genéricos
  3-foco-badges.css     ← Modo foco, badges musculares
  4-gamificacao.css     ← XP, progresso, weekly planner
  5-premium-design.css  ← Cards, Cyber-Glass, menus
  6-maestria.css        ← UI de maestria e tiers
  7-nav-icons.css       ← Bottom nav, viewport/strip
  8-customizacao.css    ← [FASE 1] Estilos do sistema de personalização
```

### Schema DB atual (`localStorage`)
```js
db.profileCustomization = {
  nome: 'DECEPTIVON',
  handle: '@deceptivon',
  avatarSeed: 'Deceptivon',   // seed Dicebear
  banner: 'roxo-neon',        // key do banner selecionado
  titulo: null,               // id do título ativo
  avatarFrame: null           // 'bronze' | 'prata' | 'ouro' | 'elite' | null
}
db.selectedEmblems = []       // até 3 ids de emblemas
```

---

## ✅ Fase 1 — Já Implementado

| Feature | Arquivo | Status |
|---|---|---|
| Banners estáticos (8 temas CSS) | `8-customizacao.css` | ✅ |
| Emblemas de perfil (12, 3 slots) | `secao-customizacao.js` | ✅ |
| Avatar customizável (8 seeds Dicebear) | `secao-customizacao.js` | ✅ |
| Moldura de avatar (Bronze/Prata/Ouro/Elite) | `8-customizacao.css` | ✅ |
| Título de perfil desbloqueável (8 títulos) | `secao-customizacao.js` | ✅ |
| Nome e Handle editáveis | `secao-customizacao.js` | ✅ |
| Botão de edição (ícone lápis no perfil) | `treino.html` | ✅ |
| Schema `profileCustomization` no DB | `db.js` | ✅ |
| Modal CoD-style (bottom-sheet) | `secao-customizacao.js` | ✅ |

---

## 🚀 Fase 2 — A Implementar

As 10 features aprovadas, organizadas por prioridade de impacto visual × complexidade:

> **Legenda de status:** ✅ Implementado &nbsp;|&nbsp; 🚧 Pendente

| # | Feature | Status |
|---|---|---|
| 1 | Banners Animados | ✅ Implementado |
| 2 | Sistema de Prestígio | 🚧 Pendente |
| 3 | Skin de Card de Exercício | ✅ Implementado |
| 4 | Frase de Assinatura | ✅ Implementado |
| 5 | Emblemas Animados | ✅ Implementado |
| 6 | Skins do Cronômetro | ✅ Implementado |
| 7 | Showcase / Vitrine | ✅ Implementado |
| 8 | Arquétipo / Classe | ✅ Implementado |
| 9 | Tela de Carregamento | ✅ Implementado |
| 10 | Skin das Barras de XP | ✅ Implementado |

---

### 1. 🎬 Banners Animados *(Animated Calling Card)*

**Analogia CoD:** Calling cards premium com chamas, raios, ondas de energia em loop.

**Como funciona:**
- Uma nova categoria `animated` é adicionada ao array `BANNERS` em `secao-customizacao.js`
- Banners animados usam `@keyframes` CSS dentro de `8-customizacao.css` para criar efeitos de movimento no `.profile-banner`
- No picker de banners, uma badge `ANIMADO` diferencia visualmente a categoria
- Desbloqueáveis apenas por conquistas raras (ex: 100+ treinos, prestígio 1)

**Banners Animados Planejados:**

| Key | Nome | Efeito | Desbloqueio |
|---|---|---|---|
| `plasma` | Plasma Elétrico | Gradiente que rotaciona (conic-gradient animado) | 50 treinos |
| `aurora-viva` | Aurora Viva | Ondas de cor que deslizam horizontalmente | 7 dias streak |
| `vulcao` | Vulcão | Partículas de lava subindo (pseudo-elementos animados) | 30 dias streak |
| `matrix` | Matrix | Scanlines descendo em verde | Prestígio 1 |
| `nebulosa` | Nebulosa | Orbes de luz que se movem lentamente | 100 treinos |

**Arquivos Impactados:**
- `style/treino/8-customizacao.css` — novos `@keyframes` e classes de banner animado
- `JS/treino/secao-customizacao.js` — adicionar entradas no array `BANNERS` com `animated: true`

**Detalhes Técnicos:**
```css
/* Exemplo: plasma animado via conic-gradient + @property */
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes bannerPlasmaRotate {
  to { --angle: 360deg; }
}
.profile-banner[data-banner="plasma"] {
  background: conic-gradient(from var(--angle), #7c3aed, #06b6d4, #8b5cf6, #7c3aed);
  animation: bannerPlasmaRotate 4s linear infinite;
}
```
> ⚠️ Usar `@supports (background: conic-gradient(from 0deg, red, red))` para fallback gracioso em browsers sem suporte.

---

### 2. ⭐ Sistema de Prestígio *(Prestige)*

**Analogia CoD:** Ao atingir o nível máximo, o jogador "Prestigia" — reset de nível com emblema exclusivo.

**Como funciona:**
- Cada **ciclo de 30 treinos concluído** = 1 Prestígio (o ciclo já existe em `db.currentFichaWorkouts`)
- Um contador `db.prestige` armazena quantos prestígios o usuário tem
- Ícone de prestígio (`★I`, `★II`, `★III`...) exibido ao lado do nome no cartão de perfil
- A cada prestígio: desbloqueio automático de cosmético exclusivo (banner / emblema / título)
- Máximo rastreado: ilimitado

**Recompensas por Prestígio:**

| Prestígio | Recompensa |
|---|---|
| ★I | Banner `shadow-ops` + Título "Veterano de Ciclos" |
| ★II | Emblema animado "Chama Eterna" |
| ★III | Banner animado `nebulosa` |
| ★V | Título "O Imortal" + Moldura Elite |
| ★X | Banner animado `matrix` + Tag [LEGEND] |

**Arquivos Impactados:**
- `JS/treino/db.js` — adicionar `db.prestige: 0` e `db.prestigeHistory: []` ao schema; detectar conclusão de ciclo e incrementar
- `JS/treino/secao-customizacao.js` — função `checkPrestigeRewards(db)` + render do ícone de prestígio
- `treino.html` — slot visual do ícone de prestígio no `.profile-user-info`
- `style/treino/8-customizacao.css` — `.profile-prestige` badge style

**Schema adicional no DB:**
```js
db.prestige = 0               // número de prestígios acumulados
db.prestigeHistory = []       // ['2026-05-18', ...] datas de cada prestígio
```

---

### 3. 🎨 Skin de Card de Exercício *(Weapon Blueprint)*

**Analogia CoD:** Blueprints mudam a aparência visual completa da arma mantendo a função.

**Como funciona:**
- O skin é aplicado globalmente via `document.body.setAttribute('data-card-skin', key)` no boot
- Muda: cor da borda, fundo do card, efeito de hover — sem alterar o HTML dos cards existentes
- Configurado em `db.profileCustomization.cardSkin`

**Skins Planejadas:**

| Key | Nome | Visual | Desbloqueio |
|---|---|---|---|
| `default` | Padrão | Borda roxa atual | Padrão |
| `neon` | Neon Cyber | Borda com glow pulsante RGB | 20 treinos |
| `militar` | Militar | Bordas retas, verde oliva, textura diagonal | 40 treinos |
| `ouro` | Ouro Elite | Borda dourada metálica, cantos decorativos | Maestria Ouro (1 exercício) |
| `gelo` | Aço Glacial | Borda azul-aço, shimmer de gelo | Banner `aco-frio` desbloqueado |
| `sombra` | Shadow | Background mais escuro, borda mínima | Prestígio 1 |

**Arquivos Impactados:**
- `style/treino/8-customizacao.css` — `body[data-card-skin="neon"] .ex-card { ... }` (sem tocar templates)
- `JS/treino/secao-customizacao.js` — `CARD_SKINS[]` array + seção no modal
- `JS/treino/db.js` — `db.profileCustomization.cardSkin: 'default'`
- `JS/treino/app.js` — `document.body.setAttribute('data-card-skin', skin)` no boot

---

### 4. ✍️ Frase de Assinatura *(Calling Card Tagline)*

**Analogia CoD:** Linha de texto personalizada exibida na calling card do jogador.

**Como funciona:**
- Campo de texto livre (máx. 45 chars) no modal de personalização
- Exibida no **Share Card** gerado via Canvas (abaixo do título do treino)
- Lista de frases pré-definidas desbloqueáveis como opção alternativa
- Opcionalmente exibida como 3ª linha no cartão de perfil

**Frases Preset (exemplos):**
- "O suor de hoje é a força de amanhã"
- "Sem desculpa, sem limite"
- "Forjado no ferro, temperado na dor"
- "A consistência vence o talento todos os dias"

**Arquivos Impactados:**
- `JS/treino/secao-customizacao.js` — campo de input + `FRASES_PRESET[]` array
- `JS/treino/db.js` — `db.profileCustomization.assinatura: ''`
- `JS/treino/secao-perfil.js` — injetar `assinatura` no canvas do Share Card
- `style/treino/8-customizacao.css` — `.profile-assinatura` tipografia

---

### 5. ✨ Emblemas Animados *(Animated Emblem)*

**Analogia CoD:** Emblemas de tier alto com micro-animação CSS contínua.

**Como funciona:**
- Emblemas com `animated: true` no array `EMBLEMAS` recebem classe CSS adicional
- Animação aplicada apenas no ícone interno (`@keyframes`), não no slot inteiro
- Tipos: `pulse-glow`, `spin-slow`, `flicker`
- Apenas emblemas de conquista rara recebem animação

**Emblemas Animados Planejados:**

| ID | Nome | Animação | Desbloqueio |
|---|---|---|---|
| `chama-eterna-anim` | Chama Eterna | Flicker de fogo (opacity + scale) | 30 dias streak |
| `lendario-anim` | O Lendário | Glow pulsante dourado | 100 treinos |
| `elite-ouro-anim` | Maestria Máxima | Rotação lenta + brilho | Maestria Ouro em 3+ exercícios |
| `prestige-anim` | Prestígio | Pulso branco com radiância | Prestígio 1 |

**Arquivos Impactados:**
- `style/treino/8-customizacao.css` — `@keyframes` + `.emblem-gallery__icon--animated`
- `JS/treino/secao-customizacao.js` — campo `animated: true` nos objetos do array `EMBLEMAS`

---

### 6. ⌚ Skins do Cronômetro de Descanso *(Operator Watch)*

**Analogia CoD:** Operadores usam relógios diferentes de acordo com a skin equipada.

**Contexto:** O cronômetro já tem 2 estilos (`radar` e `hourglass`) via `localStorage.timerStyle`. O sistema será **expandido**, não recriado. A preferência será migrada para `db.profileCustomization.timerSkin`.

**Novas Skins Planejadas:**

| Key | Nome | Visual | Desbloqueio |
|---|---|---|---|
| `radar` | Radar | Arco SVG circular (já existe) | Padrão |
| `hourglass` | Ampulheta | SVG ampulheta (já existe) | Padrão |
| `fire` | Chama | Barra de fogo que se apaga (gradient + clip-path animado) | 7 dias streak |
| `neon` | Neon LED | Display de 7 segmentos (fonte digital + glow) | 20 treinos |
| `minimal` | Minimal | Número gigante centralizado sem ornamentos | 10 treinos |
| `matrix` | Matrix | Números em verde com scanlines | Prestígio 1 |

**Arquivos Impactados:**
- `JS/treino/secao-ficha.js` — expandir `getTimerStyle()` e render do timer para suportar novos keys
- `style/treino/8-customizacao.css` — `.rest-timer--fire`, `.rest-timer--neon`, `.rest-timer--minimal`, etc.
- `JS/treino/secao-customizacao.js` — `TIMER_SKINS[]` array + nova seção no modal
- `JS/treino/db.js` — `db.profileCustomization.timerSkin: 'radar'` (migrar de `localStorage.timerStyle`)

---

### 7. 🏆 Showcase / Vitrine de Conquistas *(Featured Challenges)*

**Analogia CoD:** O jogador fixa suas melhores conquistas em destaque no player card.

**Como funciona:**
- Nova seção **"EM DESTAQUE"** no cartão de perfil (abaixo dos emblemas)
- O usuário escolhe **1 stat** para exibir em formato card premium com número grande
- Opções de stat: Maior Streak, Total de Treinos, Total de XP, Maestrias Conquistadas, Ciclos Completos (Prestígios), Volume Máximo em 1 Treino

**Arquivos Impactados:**
- `JS/treino/secao-customizacao.js` — `SHOWCASE_STATS[]` array + render do card de destaque
- `JS/treino/db.js` — `db.profileCustomization.showcaseStat: 'streak'`
- `treino.html` — slot `#profileShowcase` dentro do `.profile-header` ou logo abaixo
- `style/treino/8-customizacao.css` — `.showcase-card`, `.showcase-card__value`, `.showcase-card__label`

---

### 8. 🎭 Arquétipo / Classe do Operador *(Operator Faction)*

**Analogia CoD:** Cada operador pertence a uma facção com identidade visual e lore próprios.

**Como funciona:**
- O usuário escolhe (ou recebe **sugestão automática** pelo Radar Chart) seu Arquétipo
- O Arquétipo influencia: ícone de classe no cartão, cor de destaque no share card, badge visual
- `suggestArquetipo(db)` lê o atributo dominante do Radar Chart e propõe a classe

**Arquétipos Planejados:**

| ID | Nome | Ícone | Cor | Trigger automático |
|---|---|---|---|---|
| `forcista` | Guerreiro de Força | SVG haltere | Vermelho-ouro | Força > 70% no Radar |
| `resistente` | Atleta de Resistência | SVG coração | Verde-esmeralda | Resistência > 70% |
| `velocista` | Velocista | SVG raio | Ciano-elétrico | Cardio > 70% |
| `equilibrio` | Completo | SVG estrela | Roxo (padrão) | Radar equilibrado |
| `core` | Mestre do Core | SVG escudo | Azul-aço | Core > 70% |
| `custom` | Personalizado | Ícone do tema ativo | Cor do tema ativo | Escolha manual |

**Arquivos Impactados:**
- `JS/treino/secao-customizacao.js` — `ARQUETIPOS[]` array + `suggestArquetipo(db)` function
- `JS/treino/db.js` — `db.profileCustomization.arquetipo: 'equilibrio'`
- `treino.html` — badge de arquétipo no `.profile-avatar-wrap`
- `style/treino/8-customizacao.css` — `.arquetipo-badge`, `.arquetipo-badge--forcista`, etc.
- `JS/treino/secao-progresso.js` — chamar `suggestArquetipo(db)` após recalcular o radar

---

### 9. 🖼️ Tela de Carregamento Personalizada *(Loading Screen)*

**Analogia CoD:** Cada jogador pode equipar loading screens exclusivas com arte temática.

**Como funciona:**
- Uma overlay `.splash-screen` cobre o app durante o `DOMContentLoaded`
- Lê **diretamente do `localStorage`** (sem esperar o DB completo) o banner e o nome do usuário
- Exibe o nome do usuário, ícone de prestígio e uma barra de progresso fake
- Ao final do init: fade-out da overlay com `opacity: 0` + `pointer-events: none`

**Implementação (HTML):**
```html
<!-- treino.html — ANTES de qualquer conteúdo no <body> -->
<div id="splashScreen" class="splash-screen">
  <div class="splash-screen__bg" id="splashBg"></div>
  <div class="splash-screen__content">
    <div class="splash-screen__logo">ACADEMIA</div>
    <div class="splash-screen__user" id="splashUser"></div>
    <div class="splash-screen__bar">
      <div class="splash-screen__fill" id="splashFill"></div>
    </div>
  </div>
</div>
```

**Arquivos Impactados:**
- `treino.html` — bloco `#splashScreen` no topo do `<body>` (antes de `<main>`)
- `style/treino/8-customizacao.css` — `.splash-screen`, `.splash-screen--hidden` (fade-out com `transition: opacity 0.5s`)
- `JS/treino/app.js` — leitura antecipada do `localStorage` para preencher splash; `classList.add('splash-screen--hidden')` ao final do init

---

### 10. 📊 Skin da Barra de XP / Progresso *(HUD Skin)*

**Analogia CoD:** O HUD (barras de vida, escudo, munição) pode ser tematizado com skins visuais.

**Como funciona:**
- Aplicado via `document.body.setAttribute('data-bar-skin', key)` no boot
- Afeta: `.xp-bar-fill` (barra de nível), `.cycle-xp-fill` (ciclo 30 treinos), `.progress-fill` (treino diário)
- CSS puro via seletor descendente no `body` — zero impacto no JS de cálculo

**Skins Planejadas:**

| Key | Nome | Visual | Desbloqueio |
|---|---|---|---|
| `default` | Padrão | Gradiente roxo atual | Padrão |
| `fire` | Chama | Gradiente laranja-vermelho com calor animado | Banner Fogo Eterno |
| `ice` | Gelo | Gradiente azul-branco com shimmer | Banner Aço Frio |
| `gold` | Ouro | Gradiente dourado com brilho animado | Banner Ouro Elite |
| `military` | Segmentado | Barra dividida em blocos (estilo munição) | Arquétipo Guerreiro |
| `neon` | Neon | Glow elétrico na borda da barra | 30 treinos |

**Arquivos Impactados:**
- `style/treino/8-customizacao.css` — `body[data-bar-skin="fire"] .xp-bar-fill { ... }`
- `JS/treino/secao-customizacao.js` — `BAR_SKINS[]` array + seção no modal de customização
- `JS/treino/db.js` — `db.profileCustomization.barSkin: 'default'`
- `JS/treino/app.js` — aplicar `data-bar-skin` no boot logo após `applyProfileCustomization(db)`

---

## 📐 Schema DB Final — Fase 2 Completa

```js
db.profileCustomization = {
  // ── Fase 1 (já implementado) ──────────────────────────
  nome: 'DECEPTIVON',
  handle: '@deceptivon',
  avatarSeed: 'Deceptivon',
  banner: 'roxo-neon',
  titulo: null,
  avatarFrame: null,

  // ── Fase 2 (a implementar) ────────────────────────────
  assinatura: '',           // Feature 4: Frase de assinatura
  cardSkin: 'default',      // Feature 3: Skin dos cards de exercício
  timerSkin: 'radar',       // Feature 6: Skin do cronômetro (migra de localStorage.timerStyle)
  barSkin: 'default',       // Feature 10: Skin das barras de XP
  showcaseStat: 'streak',   // Feature 7: Stat em destaque no perfil
  arquetipo: 'equilibrio',  // Feature 8: Arquétipo/Classe do operador
}

// ── Campos raiz do DB (fora de profileCustomization) ──
db.prestige = 0             // Feature 2: Contador de prestígios
db.prestigeHistory = []     // Feature 2: ['2026-05-18', ...] datas de cada prestígio
```

---

## 🗺️ Ordem de Implementação Recomendada

Ordenado por **impacto visual imediato** × **independência de outras features**:

| Prioridade | Feature | Por quê primeiro? | Esforço | Status |
|---|---|---|---|---|
| 1 | **Frase de Assinatura** (4) | Menor complexidade, impacto direto no Share Card | 🟢 Baixo | ✅ |
| 2 | **Skin da Barra de XP** (10) | CSS puro, zero risco, mudança visual imediata | 🟢 Baixo | ✅ |
| 3 | **Tela de Carregamento** (9) | Primeiras impressões — impacto alto, CSS+JS simples | 🟡 Médio | ✅ |
| 4 | **Showcase / Vitrine** (7) | Enriquece o perfil sem dependências externas | 🟡 Médio | ✅ |
| 5 | **Skin de Card de Exercício** (3) | Muda a experiência diária do usuário | 🟡 Médio | ✅ |
| 6 | **Arquétipo / Classe** (8) | Integra com Radar Chart já existente | 🟡 Médio | ✅ |
| 7 | **Emblemas Animados** (5) | Extensão natural da Fase 1 | 🟡 Médio | ✅ |
| 8 | **Skin do Cronômetro** (6) | Migração cuidadosa do sistema existente | 🟡 Médio | ✅ |
| 9 | **Banners Animados** (1) | Requer `@property` CSS + fallback | 🔴 Alto | ✅ |
| 10 | **Sistema de Prestígio** (2) | Requer integração com ciclo de 30 treinos | 🔴 Alto | 🚧 |

---

## ⚙️ Diretrizes Técnicas Obrigatórias

1. **Padrão BEM:** Todo CSS novo segue `Bloco__Elemento--Modificador` sem exceção.
2. **SVG inline:** Nenhum emoji em funções de UI — apenas `stroke: currentColor` SVG.
3. **Data-attributes para skins globais:** `body[data-card-skin]`, `body[data-bar-skin]` — zero alteração nos templates de cards/barras existentes.
4. **Fallback de `@property`:** Banners animados com `conic-gradient` usam `@supports` para garantir compatibilidade sem quebrar browsers antigos.
5. **Leitura antecipada do localStorage na splash:** Lê `localStorage.getItem('academia_treino')` diretamente, sem depender do módulo `db.js`, para popular a tela de loading antes do parse completo.
6. **Migração automática em `loadDB()`:** Cada novo campo do `profileCustomization` deve ter valor padrão e bloco de migração em `loadDB()` sem quebrar dados existentes.
7. **Sem novos arquivos JS:** Toda a lógica da Fase 2 vai em `secao-customizacao.js`. Se o CSS crescer muito, criar `9-splash.css` exclusivamente para a loading screen.
