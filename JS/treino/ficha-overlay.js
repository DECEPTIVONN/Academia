/**
 * ficha-overlay.js
 *
 * Controla o overlay fullscreen da Ficha de Treino, acionado pelo botão
 * "PRÓXIMO PASSO" do Dashboard (v3.2.0+).
 *
 * O conteúdo da ficha (componentes/secoes/ficha.html) é carregado pelo
 * loader.js dentro de #fichaOverlayScroll. Este módulo cuida do show/hide,
 * eventos de teclado (ESC) e do comportamento de fechamento condicional
 * (se houver treino em andamento, abre o modal de confirmação em vez de
 * fechar diretamente).
 *
 * Decisões de design (v3.2.0):
 *  - Sem header fixo (full-bleed imersivo). O hero original da Ficha
 *    permanece como cabeçalho visual do conteúdo.
 *  - Fechamento (ESC/programático): se workout_start_time existir no
 *    localStorage, abre modalEncerrarTreino (mantém overlay aberto);
 *    caso contrário, fecha com fade-out e volta ao Dashboard.
 *  - Intercepta qualquer chamada a _transitionTo('ficha') (defesa em
 *    profundidade, mesmo padrão do Perfil em v3.1.0).
 */

let isOpen = false;
let lastFocused = null;
let isClosing = false;

function focusFirstInteractive() {
  const overlay = document.getElementById('ficha-overlay');
  if (!overlay) return;
  const focusable = overlay.querySelector(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (focusable && typeof focusable.focus === 'function') {
    try { focusable.focus({ preventScroll: true }); } catch (e) { focusable.focus(); }
  }
}

function hasActiveWorkout() {
  const startTime = localStorage.getItem('workout_start_time');
  if (!startTime) return false;
  // Só considera ativo se for do dia atual (defesa contra restores antigos)
  try {
    return new Date(parseInt(startTime)).toDateString() === new Date().toDateString();
  } catch (e) {
    return false;
  }
}

function openEncerrarModal() {
  // O modal modalEncerrarTreino vive em #modais-container, carregado por
  // loader.js. Usa openModal exposto por secao-ficha.js.
  if (typeof window.openModal === 'function') {
    window.openModal('modalEncerrarTreino');
  } else {
    console.warn('[ficha-overlay] window.openModal indisponível ao abrir modal de encerramento.');
  }
}

export function openFichaOverlay() {
  const overlay = document.getElementById('ficha-overlay');
  if (!overlay) {
    console.warn('[ficha-overlay] Container #ficha-overlay não encontrado.');
    return;
  }

  if (isOpen) return;
  isOpen = true;
  isClosing = false;

  lastFocused = document.activeElement;

  overlay.classList.remove('is-closing');
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');

  document.body.classList.add('ficha-overlay-open');

  // Move scroll do overlay para o topo
  const scroller = document.getElementById('fichaOverlayScroll');
  if (scroller) scroller.scrollTop = 0;

  // Foco no primeiro elemento interativo (acessibilidade)
  setTimeout(focusFirstInteractive, 50);

  document.dispatchEvent(new CustomEvent('fichaoverlay:open'));
}

export function closeFichaOverlay({ force = false } = {}) {
  const overlay = document.getElementById('ficha-overlay');
  if (!overlay || !isOpen) return;

  // Se há treino em andamento e o caller não forçou a saída,
  // redireciona para o modal de confirmação. O modal possui o seu
  // próprio botão "Cancelar" que apenas fecha o modal (mantendo o
  // overlay), e o botão "Encerrar" que dispara o encerramento real
  // (app.js → btnEncerrarConfirmar). Quando o encerramento for
  // confirmado, o app já navega para o Dashboard, então fechamos
  // o overlay aqui também.
  if (!force && hasActiveWorkout()) {
    openEncerrarModal();
    return;
  }

  isOpen = false;
  isClosing = true;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.classList.add('is-closing');

  // Aguarda a animação de saída terminar antes de esconder o display
  const onEnd = () => {
    overlay.removeEventListener('animationend', onEnd);
    if (!isOpen) {
      overlay.style.display = 'none';
      overlay.classList.remove('is-closing');
    }
    isClosing = false;
  };
  overlay.addEventListener('animationend', onEnd);

  document.body.classList.remove('ficha-overlay-open');

  // Devolve o foco ao elemento que originou a abertura
  if (lastFocused && typeof lastFocused.focus === 'function') {
    try { lastFocused.focus({ preventScroll: true }); } catch (e) { /* silencioso */ }
  }
  lastFocused = null;

  // Garante que o app volta para o Dashboard após o fade-out
  setTimeout(() => {
    if (typeof window._transitionTo === 'function') {
      window._transitionTo('dashboard');
    }
  }, 240);

  document.dispatchEvent(new CustomEvent('fichaoverlay:close'));
}

export function isFichaOverlayOpen() {
  return isOpen;
}

// Bindings de teclado e interceptação de transição
export function initFichaOverlay() {
  // Atalho ESC: delega ao fluxo normal de fechamento
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeFichaOverlay();
    }
  });

  // Expõe as funções globalmente (necessário para onclick inline e nav.js)
  window.openFichaOverlay = openFichaOverlay;
  window.closeFichaOverlay = closeFichaOverlay;
  window.isFichaOverlayOpen = isFichaOverlayOpen;

  // Botão X do overlay (v3.3.2+): pequeno ícone de fechar no canto
  // superior esquerdo. SEMPRE abre o modalEncerrarTreino como confirmação
  // (independente de workout_start_time), para que o usuário tenha um
  // caminho de saída descobrível do overlay full-bleed.
  // O btnEncerrarConfirmar (app.js) já trata corretamente os dois casos:
  // treino em curso (para cronômetro + limpa ficha) ou já concluído
  // (apenas fecha o overlay e volta ao Dashboard).
  document.getElementById('btnFecharFicha')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openEncerrarModal();
  });

  // Captura todos os cliques em elementos que disparam _transitionTo('ficha')
  // e redireciona para o overlay. Defesa em profundidade para qualquer
  // código legado que ainda tente navegar para o slide removido.
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-section="ficha"]');
    if (trigger && !trigger.classList.contains('bnav-btn')) {
      e.preventDefault();
      e.stopPropagation();
      openFichaOverlay();
    }
  }, true);
}
