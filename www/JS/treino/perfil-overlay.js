/**
 * perfil-overlay.js
 *
 * Controla o overlay fullscreen do Perfil, acionado pelo cartão de
 * visitas (banner + avatar + nome de usuário) do Dashboard.
 *
 * O conteúdo do perfil (componentes/secoes/perfil.html) é carregado
 * pelo loader.js dentro de #perfilOverlayScroll. Este módulo apenas
 * cuida do show/hide do overlay, eventos do botão de fechar e ESC.
 */

let isOpen = false;
let lastFocused = null;

function focusFirstInteractive() {
  const overlay = document.getElementById('perfil-overlay');
  if (!overlay) return;
  const focusable = overlay.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable && typeof focusable.focus === 'function') {
    try { focusable.focus({ preventScroll: true }); } catch (e) { focusable.focus(); }
  }
}

function setupCloseButton() {
  const btn = document.getElementById('perfilOverlayClose');
  if (!btn || btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closePerfilOverlay();
  });
}

export function openPerfilOverlay() {
  const overlay = document.getElementById('perfil-overlay');
  if (!overlay) {
    console.warn('[perfil-overlay] Container #perfil-overlay não encontrado.');
    return;
  }

  if (isOpen) return;
  isOpen = true;

  // Guarda o elemento focado para devolver o foco ao fechar
  lastFocused = document.activeElement;

  overlay.classList.remove('is-closing');
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');

  // Trava scroll do body enquanto overlay está ativo
  document.body.classList.add('perfil-overlay-open');

  // Garante que o botão X está bindado (caso o conteúdo seja re-injetado)
  setupCloseButton();

  // Move scroll do overlay para o topo
  const scroller = document.getElementById('perfilOverlayScroll');
  if (scroller) scroller.scrollTop = 0;

  // Foco no primeiro elemento interativo (acessibilidade)
  setTimeout(focusFirstInteractive, 50);

  // Aplica personalização em tempo real ao abrir (banner, avatar, etc.)
  try {
    if (typeof window.__applyProfileCustomization === 'function') {
      window.__applyProfileCustomization();
    }
  } catch (e) { /* silencioso */ }

  // Dispara evento customizado para que outros módulos possam reagir
  document.dispatchEvent(new CustomEvent('perfiloverlay:open'));
}

export function closePerfilOverlay() {
  const overlay = document.getElementById('perfil-overlay');
  if (!overlay || !isOpen) return;

  isOpen = false;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.add('is-closing');

  // Aguarda a animação de saída terminar antes de esconder o display
  const onEnd = () => {
    overlay.removeEventListener('animationend', onEnd);
    if (!isOpen) {
      overlay.style.display = 'none';
      overlay.classList.remove('is-closing');
    }
  };
  overlay.addEventListener('animationend', onEnd);

  // Libera scroll do body
  document.body.classList.remove('perfil-overlay-open');

  // Devolve o foco ao elemento que originou a abertura (cartão de visitas)
  if (lastFocused && typeof lastFocused.focus === 'function') {
    try { lastFocused.focus({ preventScroll: true }); } catch (e) { /* silencioso */ }
  }
  lastFocused = null;

  // Garante que o app volta para o Dashboard após o fade-out
  // (não importa de qual seção o overlay foi aberto, sempre volta ao Início)
  setTimeout(() => {
    if (typeof window._transitionTo === 'function') {
      window._transitionTo('dashboard');
    }
  }, 240);

  document.dispatchEvent(new CustomEvent('perfiloverlay:close'));
}

export function isPerfilOverlayOpen() {
  return isOpen;
}

// Bindings de teclado e clique no cartão de visitas do dashboard
export function initPerfilOverlay() {
  setupCloseButton();

  // Atalho ESC fecha o overlay
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closePerfilOverlay();
    }
  });

  // Expõe as funções globalmente (necessário para onclick inline e nav.js)
  window.openPerfilOverlay = openPerfilOverlay;
  window.closePerfilOverlay = closePerfilOverlay;

  // Captura todos os cliques em elementos que disparam _transitionTo('perfil')
  // e redireciona para o overlay. Isso evita a navegação via slide (removido).
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-section="perfil"]');
    if (trigger && !trigger.classList.contains('bnav-btn')) {
      e.preventDefault();
      e.stopPropagation();
      openPerfilOverlay();
    }
  }, true);
}
