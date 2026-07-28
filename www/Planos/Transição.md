# Plano de Implementação: Transições Clash Royale

## 1. Diagnóstico — Por que o sistema atual falha

### O problema raiz
A abordagem atual usa `display: none` nas seções inativas e adiciona classes CSS de animação ao trocar. Isso tem dois problemas fatais:

**Problema A — Troca instantânea:**
O browser não consegue animar um elemento de `display:none` para `display:block` + `transform` em um único frame. O resultado é que a seção nova aparece imediatamente em sua posição final (sem qualquer deslize visível) antes de qualquer animação rodar.

**Problema E — Pré-carregamento / redimensionamento:**
Quando `display:block` é aplicado, o browser precisa calcular o layout da seção do zero (reflow). Isso causa o efeito visual de "a seção aparece, se redimensiona, e se estabiliza" — especialmente visível no Treinos onde `renderMontar()` atualiza o DOM logo após a seção aparecer.

### Por que tentativas anteriores não resolveram
- **rAF duplo:** Ajudou com timing mas não com o problema do reflow de `display:none → block`
- **`renderMontar` no setTimeout:** Resolveu o flash de conteúdo, mas a seção ainda aparecia instantaneamente
- **Animar o hero:** Correto como conceito, mas inútil se a seção em si não anima

---

## 2. A Solução: Arquitetura Viewport + Strip

### Inspiração (Clash Royale)
Na imagem do meio do Clash Royale, vemos **duas telas completamente renderizadas** lado a lado, deslizando como **um único bloco sólido**. O motor gráfico mantém ambas na memória e apenas move a "câmera".

Vamos replicar isso na web:

```
┌─────────────────────────────────────────────┐  ← .section-viewport
│  overflow: hidden  │  width: 100%           │    (a "câmera")
└─────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──┐  ← .section-strip
│  Ficha   │ Treinos  │Progresso │  Perfil  │..│    (a "fita")
│ 100% vp  │ 100% vp  │ 100% vp  │ 100% vp  │  │    display: flex
└──────────┴──────────┴──────────┴──────────┴──┘
     ↑
     translateX(-N * 100%) para mostrar seção N
```

### Como funciona a transição
1. Todas as seções ficam **sempre renderizadas** — nunca `display: none`
2. O `.section-viewport` tem `overflow: hidden` — esconde o que está fora
3. O `.section-strip` é `display: flex` — todas as seções lado a lado
4. Para trocar de seção: apenas anima `translateX` do **strip inteiro**
5. Ambas as seções ficam visíveis simultaneamente durante o slide

---

## 3. Estrutura HTML — O que muda

### Antes (atual)
```html
<main class="treino-page">
    <section class="treino-hero">...</section>      <!-- fora da área de transição -->
    <section class="treino-content">
        <div class="treino-container">
            <div id="section-ficha" class="main-section active">...</div>
            <div id="section-treinos" class="main-section">...</div>
            ...
        </div>
    </section>
</main>
```

### Depois (novo)
```html
<main class="treino-page">
    <div class="section-viewport">
        <div class="section-strip">

            <!-- Slide 0: Ficha — o hero mora DENTRO deste slide -->
            <div class="section-slide" data-section="ficha">
                <section class="treino-hero">...</section>
                <div id="section-ficha" class="main-section">...</div>
            </div>

            <!-- Slide 1: Treinos -->
            <div class="section-slide" data-section="treinos">
                <div id="section-treinos" class="main-section">...</div>
            </div>

            <!-- Slide 2: Progresso -->
            <div class="section-slide" data-section="progresso">
                <div id="section-progresso" class="main-section">...</div>
            </div>

            <!-- Slide 3: Perfil -->
            <div class="section-slide" data-section="perfil">
                <div id="section-perfil" class="main-section">...</div>
            </div>

            <!-- Slide 4: Loja -->
            <div class="section-slide" data-section="loja">
                <div id="section-loja" class="main-section">...</div>
            </div>

            <!-- Slide 5: Social -->
            <div class="section-slide" data-section="social">
                <div id="section-social" class="main-section">...</div>
            </div>

        </div><!-- /.section-strip -->
    </div><!-- /.section-viewport -->
</main>
```

> **Nota chave:** O `.treino-hero` agora vive **dentro** do slide da Ficha.
> Ele desliza naturalmente com a seção — sem nenhuma lógica extra de animação.

---

## 4. CSS — O que muda

### Arquivo: `style/treino/7-nav-icons.css`

Substituir todo o sistema atual de keyframes e classes de slide pelo novo sistema:

```css
/* ── VIEWPORT: a "câmera" — esconde o que está fora ── */
.section-viewport {
  width: 100%;
  overflow: hidden;
  position: relative;
}

/* ── STRIP: a "fita" — todas as seções lado a lado ── */
.section-strip {
  display: flex;
  flex-direction: row;
  will-change: transform;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* ── Cada slide ocupa exatamente a largura do viewport ── */
.section-slide {
  flex: 0 0 100%;
  width: 100%;
  min-height: 100dvh;
}

/* ── Seções sempre visíveis — o viewport esconde as inativas ── */
.main-section {
  display: block;
  width: 100%;
}
```

**O que remover:** todos os `@keyframes crStrip*`, as classes `.slide-out-left`, `.slide-in-right`, etc. Não são mais necessários.

### Arquivo: `style/treino/1-core.css`

- Remover `overflow-x: hidden` do `.treino-page` (não é mais necessário)
- Remover as propriedades de animação adicionadas ao `.treino-hero`

---

## 5. JavaScript — A nova função `transitionTo()`

### Arquivo: `JS/treino/nav.js`

**Remover completamente:**
- Toda a lógica de `classList.add('slide-out-left')`, etc.
- O `setTimeout` de cleanup de classes
- A lógica de `container.style.minHeight`
- A lógica manual de show/hide do hero
- A função `switchSection()` inteira

**Nova implementação:**
```javascript
// Ordem das seções — deve bater com a ordem dos slides no HTML
const sectionsOrder = ['ficha', 'treinos', 'progresso', 'perfil', 'loja', 'social'];
let currentIndex = 0;
let isAnimating = false;

const strip = document.querySelector('.section-strip');

function transitionTo(targetId) {
  if (isAnimating) return;

  const targetIndex = sectionsOrder.indexOf(targetId);
  if (targetIndex === -1 || targetIndex === currentIndex) return;

  isAnimating = true;

  // Atualiza nav buttons
  bnavBtns.forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.bnav-btn[data-section="${targetId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Move a fita inteira para revelar o slide alvo
  // Ambas as seções ficam visíveis durante a transição CSS
  strip.style.transform = `translateX(-${targetIndex * 100}%)`;

  // Aguarda CSS transition terminar
  strip.addEventListener('transitionend', function onEnd() {
    strip.removeEventListener('transitionend', onEnd);
    currentIndex = targetIndex;

    // Renderiza conteúdo dinâmico APÓS a animação
    if (targetId === 'treinos' || targetId === 'montar') {
      setCurrentDeckPage(['F','G','H','I','J'].includes(currentDeckLetter) ? 2 : 1);
      renderMontar(db);
    }

    isAnimating = false;
  }, { once: true });
}
```

**Eventos que chamam `transitionTo()`:**
- Clique no bottom nav: `transitionTo(btn.dataset.section)`
- Swipe horizontal: `transitionTo(sectionsOrder[currentIndex ± 1])`

---

## 6. Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `treino.html` | Reestruturar DOM com `.section-viewport`, `.section-strip`, `.section-slide`. Mover `.treino-hero` para dentro do slide da Ficha. |
| `style/treino/7-nav-icons.css` | Substituir sistema de keyframes/classes pelo CSS de viewport+strip |
| `style/treino/1-core.css` | Remover overflow e animações adicionadas ao hero e page |
| `JS/treino/nav.js` | Substituir `switchSection()` por `transitionTo()` |

---

## 7. Ordem de implementação

1. **CSS** — definir `.section-viewport`, `.section-strip`, `.section-slide`
2. **HTML** — reestruturar o DOM e mover o hero
3. **JS** — implementar `transitionTo()` e conectar eventos
4. **Teste** — verificar slide visível no browser
5. **Ajuste fino** — timing e easing do cubic-bezier

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Performance com todas as seções renderizadas | `content-visibility: auto` nas seções fora da tela |
| `renderMontar()` executa durante a transição | Chamado apenas no `transitionend` |
| Altura do viewport colapsa | `min-height: 100dvh` no `.section-slide` |
| Swipe conflita com scroll vertical | Threshold de 60px horizontal já existe — manter |
