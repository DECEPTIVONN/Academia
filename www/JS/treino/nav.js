import { currentDeckLetter, currentDeckPage, setCurrentDeckPage, fadeIn, fadeSwap } from './db.js';
import { renderMontar } from './secao-treinos.js';

// ---- BOTTOM NAV + SUB-TAB NAVIGATION ----
export function initTabs(db) {

  // ---- Referências ----
  const bnavBtns  = document.querySelectorAll('.bnav-btn');
  const strip     = document.querySelector('.section-strip');
  const slides    = document.querySelectorAll('.section-slide');

  // Ordem das seções — deve bater com a ordem dos slides no HTML
  // OBS (v3.1.0+): 'perfil' foi removido pois virou overlay acionado pelo
  // cartão de visitas do dashboard. Mantido apenas como alias em
  // transitionTo() para abrir o overlay caso algum código legado chame
  // _transitionTo('perfil').
  // OBS (v3.2.0+): 'ficha' foi removida do strip pelo mesmo motivo
  // (virou overlay fullscreen acionado por "PRÓXIMO PASSO" do Dashboard).
  const sectionsOrder = ['progresso', 'treinos', 'dashboard', 'social', 'loja'];

  // ---- Determina a seção inicial ----
  // A partir de v3.2.0 a Ficha virou overlay, então a seção inicial do
  // strip é sempre o Dashboard. A auto-abertura da Ficha (quando há
  // treino em andamento no dia) é responsabilidade de app.js, que
  // chamará openFichaOverlay() após o init.
  const initialIndex = sectionsOrder.indexOf('dashboard');

  let currentIndex = initialIndex;
  let isAnimating  = false;

  // ---- Posiciona o strip no índice certo sem animação ----
  function jumpTo(index) {
    if (!strip) return;
    const w = window.innerWidth || document.documentElement.clientWidth || 1;
    strip.style.transition = 'none';
    strip.style.transform  = `translateX(-${index * w}px)`;
    // Força reflow para que a remoção de transition tenha efeito
    strip.getBoundingClientRect();
    strip.style.transition = '';
    currentIndex = index;
  }

  // ---- Posiciona o strip na seção inicial IMEDIATAMENTE ----
  // Usamos duas estratégias para garantir que a primeira pintura já mostre
  // a seção correta, sem flash de Ficha:
  //  1) jumpTo síncrono (caso a layout já esteja pronto)
  //  2) requestAnimationFrame como fallback (caso window.innerWidth ainda
  //     não esteja definido ou o strip precise de reflow)
  jumpTo(initialIndex);
  bnavBtns.forEach(b => b.classList.remove('active'));
  const activeBtnSync = document.querySelector(`.bnav-btn[data-section="${sectionsOrder[initialIndex]}"]`);
  if (activeBtnSync) activeBtnSync.classList.add('active');

  requestAnimationFrame(() => {
    jumpTo(initialIndex);
    bnavBtns.forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.bnav-btn[data-section="${sectionsOrder[initialIndex]}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  });

  // ---- Função principal de transição ----
  function transitionTo(targetId) {
    if (isAnimating) return;

    // Intercepta 'perfil' e abre o overlay fullscreen em vez de navegar
    // no strip (o perfil deixou de ser um slide).
    if (targetId === 'perfil') {
      if (typeof window.openPerfilOverlay === 'function') {
        window.openPerfilOverlay();
      } else {
        console.warn('[nav] openPerfilOverlay não está disponível ainda.');
      }
      return;
    }

    // Intercepta 'ficha' e abre o overlay fullscreen em vez de navegar
    // no strip (a ficha virou overlay em v3.2.0).
    if (targetId === 'ficha') {
      if (typeof window.openFichaOverlay === 'function') {
        window.openFichaOverlay();
      } else {
        console.warn('[nav] openFichaOverlay não está disponível ainda.');
      }
      return;
    }

    const targetIndex = sectionsOrder.indexOf(targetId);
    
    // Se targetIndex for o mesmo (ex: clique no mesmo botão ou snap-back de um drag curto)
    if (targetIndex === -1 || targetIndex === currentIndex) {
      strip.style.transform = `translateX(-${currentIndex * window.innerWidth}px)`;
      return;
    }

    isAnimating = true;

    // Reseta o scroll do slide atual para o topo antes de animar
    if (slides[currentIndex]) slides[currentIndex].scrollTop = 0;

    // Atualiza botões do nav
    bnavBtns.forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.bnav-btn[data-section="${targetId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Desliza a fita inteira — ambas as seções ficam visíveis durante a transição
    strip.style.transform = `translateX(-${targetIndex * window.innerWidth}px)`;

    // Aguarda a transição CSS terminar
    strip.addEventListener('transitionend', function onEnd() {
      strip.removeEventListener('transitionend', onEnd);

      currentIndex = targetIndex;

      // Renderiza conteúdo dinâmico APÓS a animação (nunca durante)
      if (targetId === 'montar' || targetId === 'treinos') {
        setCurrentDeckPage(['F','G','H','I','J'].includes(currentDeckLetter) ? 2 : 1);
        renderMontar(db);
      }

      document.dispatchEvent(new CustomEvent('sectionchange', { detail: { section: targetId } }));

      isAnimating = false;
    }, { once: true });
  }

  // ---- 1. BOTTOM NAV: cliques ----
  bnavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      transitionTo(btn.dataset.section);
    });
  });

  // ---- 2. SUB-TABS: dentro da section-treinos (exercicios / montar) ----
  const subTabSection = document.querySelector('#section-treinos');
  if (subTabSection) {
    subTabSection.querySelectorAll('.t-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        const tab = document.getElementById('tab-' + tabId);
        const activeTab = subTabSection.querySelector('.t-tab.active');

        const performTabSwap = () => {
          subTabSection.querySelectorAll('.t-tab-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          subTabSection.querySelectorAll('.t-tab').forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          if (tab) {
            tab.classList.add('active');
            fadeIn(tab);
            if (tabId === 'montar') {
              setCurrentDeckPage(['F','G','H','I','J'].includes(currentDeckLetter) ? 2 : 1);
              renderMontar(db);
            }
          }
        };

        if (activeTab && activeTab !== tab) {
          fadeSwap(activeTab, performTabSwap);
        } else {
          performTabSwap();
        }
      });
    });

    // ---- 2.5 SUB-NAVBAR: dentro da tab exercicios (Estilo Clash Royale) ----
    const subNavbar = document.querySelector('.sub-navbar');
    if (subNavbar) {
      subNavbar.querySelectorAll('.sub-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const subTabId = btn.dataset.subtab;
          const targetContent = document.getElementById('subtab-' + subTabId);
          const activeContent = document.querySelector('.sub-tab-content.active');

          const performSubSwap = () => {
            // Remove active de todos os botões da sub-navbar
            subNavbar.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
            // Adiciona active no clicado
            btn.classList.add('active');
            
            // Esconde todos os conteúdos de sub-aba
            document.querySelectorAll('.sub-tab-content').forEach(content => {
              content.classList.remove('active');
              content.style.display = 'none';
            });
            
            // Mostra o conteúdo correspondente
            if (targetContent) {
              targetContent.classList.add('active');
              targetContent.style.display = 'block';
              fadeIn(targetContent);
            }
          };

          if (activeContent && activeContent !== targetContent) {
            fadeSwap(activeContent, performSubSwap);
          } else {
            performSubSwap();
          }
        });
      });
    }
  }

  // ---- 3. SWIPE GESTURES (Real-time Pan / Finger Tracking) ----
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;
  let dragDirection = null; // 'h' = horizontal, 'v' = vertical

  document.addEventListener('touchstart', e => {
    // Ignora swipe em elementos interativos específicos
    if (e.target.closest('.table-scroll-wrap') ||
        e.target.closest('.month-grid') ||
        e.target.closest('.theme-colors') ||
        e.target.closest('.treino-selector') ||
        e.target.closest('.modal-overlay') || // Bloqueia swipe quando modals estão abertos
        e.target.closest('.perfil-overlay') || // Bloqueia swipe quando overlay do perfil está aberto
        e.target.closest('.ficha-overlay') || // Bloqueia swipe quando overlay da ficha está aberto
        (e.target.closest('[draggable="true"]') && e.target.closest('#tab-montar')) || // Bloqueia swipe apenas nas cartas arrastáveis do Montar Ficha
        e.target.tagName.toLowerCase() === 'input' ||
        e.target.tagName.toLowerCase() === 'textarea') return;

    if (isAnimating) return;
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = true;
    dragDirection = null;

    // Desliga a animação CSS para a fita seguir o dedo instantaneamente
    strip.style.transition = 'none';
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!isDragging) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;

    // Determina a intenção de direção nos primeiros pixels de movimento
    if (!dragDirection) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        dragDirection = Math.abs(diffX) > Math.abs(diffY) ? 'h' : 'v';
      }
    }

    if (dragDirection === 'h') {
      // Bloqueia rolagem vertical da página
      if (e.cancelable) e.preventDefault();

      const baseTranslate = -(currentIndex * window.innerWidth);
      let newTranslate = baseTranslate + diffX;

      // Efeito de resistência/mola nos limites da fita (primeira e última tela)
      if (currentIndex === 0 && diffX > 0) {
        newTranslate = diffX * 0.25; 
      } else if (currentIndex === sectionsOrder.length - 1 && diffX < 0) {
        newTranslate = baseTranslate + (diffX * 0.25);
      }

      strip.style.transform = `translateX(${newTranslate}px)`;
    }
  }, { passive: false });

  document.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;

    // Religa a animação suave do CSS
    strip.style.transition = 'transform 0.48s cubic-bezier(0.22, 1, 0.36, 1)';

    if (dragDirection === 'h') {
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchEndX - touchStartX;
      const threshold = window.innerWidth * 0.2; // 20% da tela para confirmar troca
      const velocityX = Math.abs(diffX);

      if (velocityX > threshold || Math.abs(diffX) > 150) {
        if (diffX < 0 && currentIndex < sectionsOrder.length - 1) {
          transitionTo(sectionsOrder[currentIndex + 1]); // Vai pra direita
        } else if (diffX > 0 && currentIndex > 0) {
          transitionTo(sectionsOrder[currentIndex - 1]); // Vai pra esquerda
        } else {
          transitionTo(sectionsOrder[currentIndex]); // Mola volta pro lugar
        }
      } else {
        transitionTo(sectionsOrder[currentIndex]); // Não arrastou o suficiente, volta
      }
    } else {
      // Se era apenas um clique ou scroll vertical, garante que a fita esteja no lugar
      strip.style.transform = `translateX(-${currentIndex * window.innerWidth}px)`;
    }
  }, { passive: true });

  // Expõe transitionTo para uso externo (ex: deep links)
  window._transitionTo = transitionTo;
}


// ---- ATUALIZAR BOTÕES DE TREINOS VAZIOS ----
export function updateEmptyWorkoutButtons(db) {
  document.querySelectorAll('.ficha-header-bar .sel-btn').forEach(btn => {
    const treino = btn.dataset.treino;
    if (!treino) return;
    const fichaIds = db.fichas[treino] || [];
    const temExercicios = fichaIds.filter(Boolean).length > 0;
    const temCardio = db.aerobicos && db.aerobicos[treino] && db.aerobicos[treino].tipo;
    btn.style.display = (temExercicios || temCardio) ? 'flex' : 'none';
  });
}
