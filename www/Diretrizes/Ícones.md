# 🎨 Guia de Ícones — Academia App

> **Para agentes de IA:** Este guia define o sistema de ícones SVG do projeto Academia. Leia completamente antes de adicionar qualquer ícone à interface. Todos os ícones devem seguir este padrão.

---

## 1. Filosofia do Sistema

O projeto usa **ícones SVG inline no estilo "stroke" (contorno)**, inspirados no [Lucide Icons](https://lucide.dev) e [Feather Icons](https://feathericons.com). Este estilo foi escolhido porque:

- ✅ Escala perfeitamente em qualquer resolução (vetorial)
- ✅ Herda cores via `currentColor` (adapta ao tema automaticamente)
- ✅ Consistência visual em toda a interface
- ✅ Suporta efeitos CSS como `filter: drop-shadow` e `transition`
- ❌ **Proibido:** emojis como ícones de UI interativa (ex: 📊📱🏋️)
- ❌ **Proibido:** ícones `fill` sólidos (exceto casos especiais listados abaixo)

---

## 2. Especificações Técnicas Base

Todo ícone SVG deve seguir este template base:

```html
<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  width="[TAMANHO]"
  height="[TAMANHO]">
  <!-- paths aqui -->
</svg>
```

### Atributos obrigatórios

| Atributo | Valor | Por quê |
|---|---|---|
| `viewBox` | `"0 0 24 24"` | Grid padrão de 24×24 unidades |
| `fill` | `"none"` | Garante que não haja preenchimento indesejado |
| `stroke` | `"currentColor"` | Herda a cor do elemento pai via CSS |
| `stroke-width` | `"2"` ou `"2.5"` | Ver tabela de contextos abaixo |
| `stroke-linecap` | `"round"` | Pontas arredondadas — look premium |
| `stroke-linejoin` | `"round"` | Junções arredondadas — look premium |
| `width` / `height` | Numérico em px | Ver tabela de tamanhos abaixo |

---

## 3. Tamanhos por Contexto

| Contexto | `width`/`height` | `stroke-width` |
|---|---|---|
| **Bottom nav bar** (`.bnav-icon`) | `22px` | `2` |
| **Sub-tabs** (`.t-tab-btn`) | `16px` | `2` |
| **View buttons** (`.view-btn`) | `17–18px` | `2` |
| **Botão de ação primário** (ex: INICIAR TREINO) | `16px` | `2.5` |
| **FAB (Floating Action Button)** | `20px` | `2.5` |
| **Chips de filtro** (`.g-chip`) | `13px` | `2` |
| **Ícones de widget** (deck footer) | `22px` | `2` |
| **Ícones de template/classe** (`.tpl-icon`) | `28px` | `2` |
| **Ícones de busca** (`.ex-search-icon`) | `16px` | `2` |
| **Ícones grandes de modal** | `48px` | `1.5` |

---

## 4. Sistema de Cores (CSS Variables)

Os ícones **nunca devem ter cores hardcoded**. Use sempre `currentColor` no SVG e controle a cor pelo CSS pai. As variáveis disponíveis são:

```css
--primary          /* roxo principal: #8b5cf6 */
--primary-light    /* roxo claro: #a78bfa */
--text             /* branco: #f8fafc */
--text-secondary   /* cinza claro: #94a3b8 */
--text-tertiary    /* cinza escuro: #64748b */
```

### Exceções com cor explícita

Apenas ícones decorativos/de status recebem `stroke` explícito via CSS:

```css
/* Ícone de maestria (estrela brilhante) */
.maestria-widget-icon svg {
  stroke: var(--primary-light);
  filter: drop-shadow(0 0 5px var(--primary));
}

/* Ícone de cardio (ECG/pulso) */
.cardio-icon svg {
  stroke: var(--primary-light);
}
```

---

## 5. Integração no HTML

### 5.1 Ícone em botão simples

```html
<button class="view-btn active" id="btnExViewGrid" title="Modo Grid">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         width="17" height="17">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
</button>
```

### 5.2 Ícone + texto em botão

```html
<button class="btn-start-workout" id="btnStartWorkout">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
         width="16" height="16">
        <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
    INICIAR TREINO
</button>
```

### 5.3 Bottom Navigation Bar

```html
<button class="bnav-btn" data-section="progresso" id="bnavProgresso" aria-label="Progresso">
    <div class="bnav-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
    </div>
    <span class="bnav-label">Progresso</span>
    <div class="bnav-active-dot"></div>
</button>
```

> ⚠️ Na bottom nav, **não** defina `width`/`height` no SVG — o CSS do `.bnav-icon` já controla o tamanho.

### 5.4 Ícone em chip de filtro

```html
<button class="g-chip" data-grupo="Peito">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         width="13" height="13">
        <!-- path do ícone -->
    </svg>
    Peito
</button>
```

### 5.5 Ícone de template/classe

```html
<button class="btn-template" data-template="meu_template">
    <span class="tpl-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             width="28" height="28">
            <!-- path do ícone -->
        </svg>
    </span>
    <span class="tpl-name">NOME</span>
    <span class="tpl-desc">Descrição breve</span>
</button>
```

---

## 6. Integração no CSS

Após adicionar um ícone em uma nova classe, inclua a regra CSS em `Style/treino.css` na seção **"INLINE SVG ICON STYLES"** (final do arquivo):

```css
/* Novo contexto: minha-classe */
.minha-classe svg {
  display: block;
  flex-shrink: 0;
  stroke: currentColor;
  transition: stroke .25s ease, filter .25s ease;
}

/* Estado hover (se necessário) */
.minha-classe:hover svg {
  stroke: var(--primary-light);
  filter: drop-shadow(0 0 6px var(--primary));
}
```

---

## 7. Biblioteca de Ícones Usados no Projeto

Referência rápida dos ícones já implementados. Use os mesmos paths para consistência.

### Navegação

```html
<!-- Ficha do Dia (clipboard com linhas) -->
<rect x="3" y="3" width="18" height="18" rx="3"/>
<line x1="9" y1="9" x2="15" y2="9"/>
<line x1="9" y1="13" x2="15" y2="13"/>
<line x1="9" y1="17" x2="12" y2="17"/>

<!-- Treinos / Haltere (barbell) -->
<path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/>
<circle cx="4" cy="12" r="1.5"/>
<circle cx="20" cy="12" r="1.5"/>

<!-- Progresso (ECG/pulso) -->
<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>

<!-- Perfil (pessoa) -->
<circle cx="12" cy="8" r="4"/>
<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>

<!-- Loja (sacola) -->
<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
<line x1="3" y1="6" x2="21" y2="6"/>
<path d="M16 10a4 4 0 01-8 0"/>

<!-- Social (balão de chat) -->
<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
```

### Ações

```html
<!-- Play / Iniciar (triângulo sólido) -->
<!-- ATENÇÃO: use fill="currentColor" neste elemento específico -->
<polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>

<!-- Upload / Compartilhar -->
<path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
<polyline points="16 6 12 2 8 6"/>
<line x1="12" y1="2" x2="12" y2="15"/>

<!-- Adicionar (+) -->
<line x1="12" y1="5" x2="12" y2="19"/>
<line x1="5" y1="12" x2="19" y2="12"/>

<!-- Buscar (lupa) -->
<circle cx="11" cy="11" r="8"/>
<line x1="21" y1="21" x2="16.65" y2="16.65"/>

<!-- Lightning / Foco (raio) -->
<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>

<!-- Fechar (X) -->
<line x1="18" y1="6" x2="6" y2="18"/>
<line x1="6" y1="6" x2="18" y2="18"/>

<!-- Configurações (engrenagem) -->
<circle cx="12" cy="12" r="3"/>
<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33..."/>

<!-- Seta direita -->
<line x1="5" y1="12" x2="19" y2="12"/>
<polyline points="12 5 19 12 12 19"/>

<!-- Seta esquerda (❮ nav) -->
<polyline points="15 18 9 12 15 6"/>

<!-- Seta direita (❯ nav) -->
<polyline points="9 18 15 12 9 6"/>
```

### Visualizações

```html
<!-- Grid 2×2 -->
<rect x="3" y="3" width="7" height="7" rx="1"/>
<rect x="14" y="3" width="7" height="7" rx="1"/>
<rect x="3" y="14" width="7" height="7" rx="1"/>
<rect x="14" y="14" width="7" height="7" rx="1"/>

<!-- Tabela (com separadores) -->
<rect x="3" y="3" width="18" height="18" rx="2"/>
<line x1="3" y1="9" x2="21" y2="9"/>
<line x1="3" y1="15" x2="21" y2="15"/>
<line x1="9" y1="9" x2="9" y2="21"/>

<!-- Lista com pontos -->
<line x1="8" y1="6" x2="21" y2="6"/>
<line x1="8" y1="12" x2="21" y2="12"/>
<line x1="8" y1="18" x2="21" y2="18"/>
<line x1="3" y1="6" x2="3.01" y2="6"/>
<line x1="3" y1="12" x2="3.01" y2="12"/>
<line x1="3" y1="18" x2="3.01" y2="18"/>

<!-- Cartas empilhadas (Coleção/Deck) -->
<rect x="2" y="5" width="14" height="17" rx="2"/>
<path d="M6 2h12a2 2 0 012 2v14"/>
```

### Grupos Musculares

```html
<!-- Peito (barras com arco) -->
<path d="M12 20V10M6 20V14M18 20V8"/>
<path d="M3 6c3-2 6-2 9 0s6 2 9 0"/>

<!-- Costas / Treinos (barbell) -->
<path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/>
<circle cx="4" cy="12" r="1.5"/>
<circle cx="20" cy="12" r="1.5"/>

<!-- Pernas (forma de perna) -->
<path d="M12 2v10M12 12l-4 8M12 12l4 8M8 6H5a1 1 0 00-1 1v1a1 1 0 001 1h3"/>

<!-- Ombros (arco com linha central) -->
<path d="M2 12c0-5.5 10-8 10-8s10 2.5 10 8"/>
<path d="M12 4v16"/>

<!-- Core (estrela) -->
<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
```

### Conquistas / Status

```html
<!-- Troféu / Maestria (estrela) -->
<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>

<!-- Troféu (copo) -->
<path d="M6 9H4.5a2.5 2.5 0 010-5H6"/>
<path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
<path d="M4 22h16"/>
<path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
<path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
<path d="M18 2H6v7a6 6 0 0012 0V2z"/>

<!-- Check (concluído) -->
<polyline points="20 6 9 17 4 12"/>

<!-- Cadeado (bloqueado) -->
<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
<path d="M7 11V7a5 5 0 0110 0v4"/>
```

---

## 8. Casos Especiais: `fill` Sólido

Alguns ícones precisam de preenchimento para comunicar melhor. Nesses casos:

```html
<!-- Triângulo de play preenchido (mais legível em tamanho pequeno) -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
     width="16" height="16">
    <polygon points="5 3 19 12 5 21 5 3"
             fill="currentColor"
             stroke="none"/>   <!-- ← sobrescreve o fill/stroke do pai -->
</svg>
```

```css
/* CSS complementar para o polígono preenchido */
.btn-start-workout svg polygon {
  fill: currentColor;
  stroke: none;
}
```

> **Regra:** Só use `fill` em formas fechadas onde o stroke sozinho não é legível (ex: seta/triângulo de play). Nunca use `fill` em ícones de navegação ou filtro.

---

## 9. Efeitos e Animações

### Glow no estado ativo (bottom nav)

```css
.bnav-btn.active .bnav-icon svg {
  stroke: var(--primary-light);
  filter: drop-shadow(0 0 6px var(--primary));
}
```

### Hover com lift (templates)

```css
.btn-template:hover .tpl-icon svg {
  transform: scale(1.15);
  filter: drop-shadow(0 0 8px var(--primary));
  transition: transform .3s cubic-bezier(.34, 1.56, .64, 1), filter .3s ease;
}
```

### Transição suave padrão

Sempre adicione `transition` nos SVGs de botões:

```css
.meu-botao svg {
  transition: stroke .25s ease, filter .25s ease, transform .25s ease;
}
```

---

## 10. Checklist para Adicionar um Novo Ícone

Antes de submeter, verifique:

- [ ] SVG usa `viewBox="0 0 24 24"`
- [ ] SVG usa `fill="none"` e `stroke="currentColor"`
- [ ] `stroke-linecap="round"` e `stroke-linejoin="round"` presentes
- [ ] Tamanho correto para o contexto (ver tabela seção 3)
- [ ] `stroke-width` correto para o contexto
- [ ] Nenhuma cor hardcoded no SVG (ex: `stroke="#8b5cf6"`)
- [ ] CSS adicionado na seção "INLINE SVG ICON STYLES" de `treino.css`
- [ ] Testado nos estados: normal, hover, active
- [ ] Sem emojis remanescentes no mesmo elemento

---

## 11. Onde Encontrar Ícones Compatíveis

Use estas fontes para obter paths SVG prontos no estilo correto:

| Fonte | URL | Notas |
|---|---|---|
| **Lucide Icons** | https://lucide.dev/icons | ✅ Melhor opção — mesmo padrão |
| **Feather Icons** | https://feathericons.com | ✅ Compatível |
| **Heroicons (outline)** | https://heroicons.com | ✅ Usar somente variante `outline` |
| **Phosphor Icons (regular)** | https://phosphoricons.com | ✅ Usar variante `regular` |

> ⚠️ **Não use:** Material Icons (fill), Font Awesome (font), Bootstrap Icons (mixed) — estilos incompatíveis.

### Como extrair o path

1. Acesse o site (ex: lucide.dev)
2. Encontre o ícone desejado
3. Copie o `<svg>` completo
4. **Remova** os atributos de cor (`class`, `color`)
5. **Adicione** `fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"`
6. Ajuste `width`/`height` conforme tabela de contextos

---

## 12. Exemplo Completo — Adicionando Novo Botão de Ação

Cenário: adicionar botão "HISTÓRICO" na ficha do dia.

**HTML:**
```html
<button class="btn-historico" id="btnHistorico">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
         width="16" height="16">
        <polyline points="12 8 12 12 14 14"/>
        <path d="M3.05 11a9 9 0 1 0 .5-4H1"/>
        <polyline points="1 3 1 7 5 7"/>
    </svg>
    HISTÓRICO
</button>
```

**CSS em `treino.css` (seção INLINE SVG ICON STYLES):**
```css
.btn-historico {
  /* seu estilo de botão */
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-historico svg {
  display: block;
  flex-shrink: 0;
  stroke: currentColor;
  transition: stroke .25s ease;
}
.btn-historico:hover svg {
  stroke: var(--primary-light);
}
```

---

*Guia mantido por: Antigravity AI — última atualização: Maio 2026*
