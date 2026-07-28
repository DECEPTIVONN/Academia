import { loadAllSections } from './loader.js';
import { loadDB, saveDB, setTodayTreino, getExById, getTodayTreino, showToast, renderHeroStats, fadeIn, fadeSwap, currentViewMode, today } from './db.js';
import { initTabs, updateEmptyWorkoutButtons } from './nav.js';
import { renderFicha, openModal, closeModal, getTimerStyle, startRestTimer, stopRestTimer, focusIndex, setFocusIndex, focusFicha, startFocusMode, updateFocusUI, focusCheck, showNotePopover, initGlobalTimer, encerrarTreinoGlobal } from './secao-ficha.js';
import { renderExercicios, openNewExercicio, openEditExercicio, resetUpload, setUploadPreview, renderExChart, saveExercicio, confirmDeleteExercicio, renderMontar, renderDeckGrid, renderDeckCollection, updateDeckStats, getMaestriaState, trackMaestriaSessoes, showLevelUpModal, getMaestriaIconHtml, updateGlobalMasteryUI, updateDeckMaestriaWidget, openMaestriaGeral, openColecaoExercicios, openMaestriaExercicio, showRoyaleTooltip, openAerobicoModal, openPicker, renderPickerList, applyTemplate, currentFilter, setCurrentFilter, currentSearch, setCurrentSearch, calendarViewDate, editingExId, pickerTreinoAtivo, pickerSearch, setPickerSearch, TEMPLATES_PRONTOS, initExerciciosCustomSubTabs } from './secao-treinos.js';
import { renderProgresso, renderWeeklyPlanner, initCalculator } from './secao-progresso.js';
import { applyAppTheme, exportData, importData, openShareCard, downloadShareImage, shareImageNow, shareRadar, initPerfilTabs } from './secao-perfil.js';
import { applyProfileCustomization, openCustomizacaoModal, _renderProfileEmblems, initPersonalizarTab } from './secao-customizacao.js';
import { initDashboard } from './secao-dashboard.js';
import { initPerfilOverlay, openPerfilOverlay, closePerfilOverlay } from './perfil-overlay.js';
import { initFichaOverlay, openFichaOverlay, closeFichaOverlay } from './ficha-overlay.js';

// ---- INIT ----
document.addEventListener('DOMContentLoaded', async () => {
  // Carregar fragmentos HTML modulares antes de qualquer inicialização
  await loadAllSections();

  const db = loadDB();

  renderHeroStats(db);
  initTabs(db);
  renderFicha(db);
  renderExercicios(db);
  renderMontar(db);
  initExerciciosCustomSubTabs(db);
  renderProgresso(db);
  initDashboard(db);
  initPerfilTabs(db);
  updateEmptyWorkoutButtons(db);
  initCalculator();
  updateGlobalMasteryUI(db);

  // Aplicar personalização de perfil salva
  applyProfileCustomization(db);
  _renderProfileEmblems(db);
  initPersonalizarTab(db);

  // Inicializar o overlay fullscreen do Perfil (acionado pelo cartão
  // de visitas do dashboard). Deve vir depois do initPerfilTabs/initPersonalizarTab
  // para que o conteúdo já esteja injetado e funcional.
  initPerfilOverlay();

  // Inicializar o overlay fullscreen da Ficha (v3.2.0+). Acionado
  // exclusivamente pelo botão "PRÓXIMO PASSO" do Dashboard, ou
  // automaticamente abaixo se houver treino em andamento no dia.
  initFichaOverlay();

  // Auto-abrir a Ficha se há treino em andamento no dia (v3.2.0+).
  // Antes, o nav.js usava essa flag para decidir a seção inicial do
  // strip. Agora, como a Ficha virou overlay, abrimos o overlay
  // automaticamente após a inicialização (o usuário volta pro app
  // e a Ficha está lá, em vez de ver o Dashboard primeiro).
  const todayStr = today();
  const flagAtiva = Boolean(db.fichaEmAndamento) && String(db.fichaEmAndamentoDate || '') === todayStr;
  const timerAtivo = Boolean(localStorage.getItem('workout_start_time')) && (() => {
    try {
      return new Date(parseInt(localStorage.getItem('workout_start_time'))).toDateString() === new Date().toDateString();
    } catch (e) { return false; }
  })();
  if (flagAtiva || timerAtivo) {
    // Aguarda uma frame para garantir que a splash já saiu e o conteúdo
    // da Ficha (injetado por loader.js) já esteja pintado no DOM.
    requestAnimationFrame(() => {
      openFichaOverlay();
    });
  }

  // Expor funções globais para compatibilidade com HTML (inline onclick)
  window.loadDB = loadDB;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.openEditExercicio = (id) => openEditExercicio(db, id);
  window.openMaestriaExercicio = (id) => openMaestriaExercicio(db, id);
  window.confirmDeleteExercicio = (id) => confirmDeleteExercicio(db, id);
  window.openColecaoExercicios = () => openColecaoExercicios(db);
  window.openPicker = (treino) => openPicker(db, treino);
  window.openShareCard = () => openShareCard(db);
  window.shareRadar = () => shareRadar();
  window.openPerfilOverlay = openPerfilOverlay;
  window.closePerfilOverlay = closePerfilOverlay;
  window.openFichaOverlay = openFichaOverlay;
  window.closeFichaOverlay = closeFichaOverlay;
  window.__applyProfileCustomization = () => applyProfileCustomization(loadDB());

  // Botão Personalizar Perfil
  document.getElementById('btnEditarPerfil')?.addEventListener('click', () => {
    document.getElementById('perfTabBtnPersonalizar')?.click();
  });

  // Treino selector (A/B...) - Apenas na Ficha do Dia
  document.querySelectorAll('.ficha-header-bar .sel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const activeContainer = currentViewMode === 'table' ? document.querySelector('.table-scroll-wrap') : (currentViewMode === 'grid' ? document.getElementById('workoutGrid') : document.getElementById('workoutDeck'));
      fadeSwap(activeContainer, () => {
        setTodayTreino(db, btn.dataset.treino);
        renderFicha(db);
      });
      showToast('Treino ' + btn.dataset.treino + ' selecionado!', 'info');
    });
  });

  // Calendar View Toggle
  const btnMonthly = document.getElementById('btnMonthlyView');
  const btnWeekly = document.getElementById('btnWeeklyView');
  const cardMonthly = document.getElementById('monthlyCalendarCard');
  const cardWeekly = document.getElementById('weeklyPlannerCard');

  if (btnMonthly && btnWeekly) {
    btnMonthly.addEventListener('click', () => {
      btnMonthly.classList.add('active');
      btnWeekly.classList.remove('active');
      if (cardMonthly) {
        cardMonthly.style.display = 'block';
        fadeIn(cardMonthly);
      }
      if (cardWeekly) cardWeekly.style.display = 'none';
      localStorage.setItem('academia_calendar_view', 'monthly');
    });

    btnWeekly.addEventListener('click', () => {
      btnWeekly.classList.add('active');
      btnMonthly.classList.remove('active');
      if (cardMonthly) cardMonthly.style.display = 'none';
      if (cardWeekly) {
        cardWeekly.style.display = 'block';
        fadeIn(cardWeekly);
      }
      localStorage.setItem('academia_calendar_view', 'weekly');
      renderWeeklyPlanner(db);
    });

    // Restore preference
    const pref = localStorage.getItem('academia_calendar_view');
    if (pref === 'weekly') btnWeekly.click();

    // Calendar Navigation Listeners
    const changeMonth = (delta) => {
      calendarViewDate.setMonth(calendarViewDate.getMonth() + delta);
      renderProgresso(db);
      renderWeeklyPlanner(db);
    };

    document.getElementById('prevMonth')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => changeMonth(1));
    document.getElementById('prevWeekMonth')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextWeekMonth')?.addEventListener('click', () => changeMonth(1));
  }

  // Removido listener global de .view-btn para evitar conflitos entre abas

  // Novo exercício
  document.getElementById('btnNovoExercicio')?.addEventListener('click', openNewExercicio);

  // Configurar Cardio (Montar Ficha)
  document.getElementById('btnEditAerobico')?.addEventListener('click', () => {
    openAerobicoModal(loadDB());
  });

  // Removido init global de .view-btn (agora tratado em cada render)

  // Iniciar Modo Foco
  document.getElementById('btnStartFocus')?.addEventListener('click', () => startFocusMode(db));
  document.getElementById('btnCloseFocus')?.addEventListener('click', () => closeModal('modalFocus'));
  document.getElementById('btnFocusPrev')?.addEventListener('click', () => {
    if (focusIndex > 0) { setFocusIndex(focusIndex - 1); updateFocusUI(db); }
  });
  document.getElementById('btnFocusNext')?.addEventListener('click', () => {
    if (focusIndex < focusFicha.length - 1) { setFocusIndex(focusIndex + 1); updateFocusUI(db); }
  });
  document.getElementById('btnFocusCheck')?.addEventListener('click', () => focusCheck(db));

  // Compartilhamento
  document.getElementById('btnShareWorkout')?.addEventListener('click', () => openShareCard(db));
  document.getElementById('btnFecharShare')?.addEventListener('click', () => closeModal('modalShare'));
  document.getElementById('btnShareNow')?.addEventListener('click', () => shareImageNow());
  document.getElementById('btnDownloadImage')?.addEventListener('click', () => downloadShareImage());

  // Upload
  document.getElementById('uploadArea')?.addEventListener('click', () => document.getElementById('uploadInput').click());
  document.getElementById('uploadInput')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Imagem muito grande (máx. 2MB).', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setUploadPreview(ev.target.result);
    reader.readAsDataURL(file);
  });
  document.getElementById('btnRemoveImg')?.addEventListener('click', e => { e.stopPropagation(); resetUpload(); });

  // Form exercício submit
  document.getElementById('formExercicio')?.addEventListener('submit', e => { e.preventDefault(); saveExercicio(db); });
  document.getElementById('btnFecharExercicio')?.addEventListener('click', () => closeModal('modalExercicio'));
  document.getElementById('btnCancelarEx')?.addEventListener('click', () => closeModal('modalExercicio'));

  // Toggle e foco na Busca Expansível Premium (Ativação exclusiva no ícone)
  const searchContainer = document.getElementById('exSearchContainer');
  const searchInput = document.getElementById('searchInput');
  const searchIcon = searchContainer?.querySelector('.ex-search-icon');
  
  if (searchContainer && searchInput && searchIcon) {
    let iconClickActive = false;

    // Detecta o mousedown no ícone para sinalizar que o blur foi causado por este clique
    searchIcon.addEventListener('mousedown', () => {
      iconClickActive = true;
    });

    searchIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = searchContainer.classList.contains('expanded');
      
      if (isExpanded) {
        // Se já estiver expandido e clicar no ícone, colapsa, limpa o texto e restaura a lista
        searchContainer.classList.remove('expanded');
        searchInput.value = '';
        setCurrentSearch('');
        renderExercicios(db);
        searchInput.blur();
      } else {
        // Se estiver colapsado, expande e dá foco
        searchContainer.classList.add('expanded');
        searchInput.focus();
      }
      iconClickActive = false;
    });

    // Impede que cliques dentro do input se propaguem
    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    searchInput.addEventListener('blur', () => {
      // Pequeno delay para verificar se o blur não foi motivado pelo clique do ícone
      setTimeout(() => {
        if (iconClickActive) {
          return;
        }
        if (!searchInput.value.trim()) {
          searchContainer.classList.remove('expanded');
        }
      }, 150);
    });

    searchInput.addEventListener('input', e => {
      setCurrentSearch(e.target.value);
      renderExercicios(db);
    });
  }

  // Filtros de grupo
  document.querySelectorAll('.g-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.g-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      setCurrentFilter(chip.dataset.grupo);
      renderExercicios(db);
    });
  });

  // Montar ficha — botões de adicionar
  document.querySelectorAll('.btn-add-to-ficha').forEach(btn => {
    btn.addEventListener('click', () => openPicker(db, btn.dataset.treino));
  });
  document.getElementById('btnFecharPicker')?.addEventListener('click', () => closeModal('modalPicker'));
  document.getElementById('pickerSearch')?.addEventListener('input', e => {
    setPickerSearch(e.target.value);
    renderPickerList(db);
  });


  // Modal conclusão
  document.getElementById('btnFecharConclusao')?.addEventListener('click', () => {
    // Limpa o flag de "Ficha em andamento" para que o app volte a abrir
    // no Dashboard (Início) na próxima sessão.
    const liveDb = loadDB();
    liveDb.fichaEmAndamento = false;
    liveDb.fichaEmAndamentoDate = null;
    saveDB(liveDb);

    closeModal('modalConclusao');
    window._transitionTo('dashboard');

    // FIX v3.3.2: também fechar o overlay da Ficha (mesmo padrão do
    // btnEncerrarConfirmar). Sem isso, ao concluir o treino via fluxo
    // Share → Baixar Imagem → FECHAR → INCRÍVEL!, o usuário ficava preso
    // no overlay full-bleed (única saída: ESC, não descobrível).
    if (typeof window.closeFichaOverlay === 'function'
        && window.isFichaOverlayOpen
        && window.isFichaOverlayOpen()) {
      window.closeFichaOverlay({ force: true });
    }
  });

  // Modal Encerrar Treino (botão "Encerrar Treino" → "ENCERRAR TREINO" no cronômetro global)
  document.getElementById('btnEncerrarCancelar')?.addEventListener('click', () => {
    closeModal('modalEncerrarTreino');
  });

  document.getElementById('btnEncerrarConfirmar')?.addEventListener('click', () => {
    const liveDb = loadDB();
    const t = today();
    const currentTreino = getTodayTreino(liveDb);
    const checks = liveDb.historico[t]?.checks || [];
    const fichaIds = liveDb.fichas[currentTreino] || [];
    // Detecta ANTES se vai disparar a conclusão (todos marcados) para
    // controlar se navegamos para o Dashboard agora ou deixamos o
    // modal de Conclusão aparecer e aguardar o "Incrível!".
    const vaiConcluir = fichaIds.length > 0 && fichaIds.every(id => checks.includes(id));

    // Para o cronômetro e (se aplicável) dispara showConclusao
    encerrarTreinoGlobal(liveDb);

    // Limpa o flag de "Ficha em andamento"
    liveDb.fichaEmAndamento = false;
    liveDb.fichaEmAndamentoDate = null;
    saveDB(liveDb);

    closeModal('modalEncerrarTreino');

    // Fecha o overlay da Ficha com force=true (sai ignorando a checagem
    // de workout_start_time, que já foi limpo por encerrarTreinoGlobal).
    if (typeof window.closeFichaOverlay === 'function' && window.isFichaOverlayOpen && window.isFichaOverlayOpen()) {
      window.closeFichaOverlay({ force: true });
    }

    // Se NÃO vai concluir, volta ao Dashboard agora.
    // Se vai concluir, o modal de "TREINO CONCLUÍDO!" aparece e aguarda o
    // "Incrível!" do usuário, que por sua vez também navega ao Dashboard.
    if (!vaiConcluir) {
      window._transitionTo('dashboard');
    }
  });

  // Modal Histórico do Dia
  document.getElementById('btnFecharDayHist')?.addEventListener('click', () => closeModal('modalDayHist'));

  // Modal Imagem Ampliada
  document.addEventListener('click', e => {
    if (e.target.tagName === 'IMG' && (e.target.closest('.img-placeholder') || e.target.closest('.ex-card-img'))) {
      const src = e.target.src;
      document.getElementById('enlargedImage').src = src;
      openModal('modalImage');
    }
  });
  document.getElementById('btnFecharImage')?.addEventListener('click', () => closeModal('modalImage'));

  // Fechar modais clicando fora
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // ESC fecha modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => {
        if (m.style.display === 'flex') closeModal(m.id);
      });
    }
  });

  // Cronômetro (interações do widget)
  document.getElementById('rtClose')?.addEventListener('click', (e) => {
    e.stopPropagation();
    stopRestTimer();
  });
  document.getElementById('restTimer')?.addEventListener('click', () => {
    startRestTimer(60); // Clicar no cronômetro o reinicia
  });

  // Cronômetro (Configurações)
  const styleRadios = document.querySelectorAll('input[name="timerStyle"]');
  const savedStyle = getTimerStyle();
  styleRadios.forEach(r => {
    if (r.value === savedStyle) r.checked = true;
    r.addEventListener('change', (e) => {
      localStorage.setItem('timerStyle', e.target.value);
    });
  });

  // Templates listeners (individual buttons)
  let _templateClickLock = false;
  document.querySelectorAll('.btn-template').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('[Template] Click:', btn.dataset.template);
      if (_templateClickLock) return;
      _templateClickLock = true;
      setTimeout(() => { _templateClickLock = false; }, 500);
      applyTemplate(db, btn.dataset.template);
    });
  });

  // Fallback: event delegation no grid de templates
  const templatesGrid = document.getElementById('templatesGrid');
  if (templatesGrid) {
    templatesGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-template');
      if (btn && btn.dataset.template) {
        console.log('[Template] Delegation click:', btn.dataset.template);
        if (_templateClickLock) return;
        _templateClickLock = true;
        setTimeout(() => { _templateClickLock = false; }, 500);
        applyTemplate(db, btn.dataset.template);
      }
    });
  }

  // Expõe applyTemplate globalmente para debug
  window.applyTemplate = (key) => applyTemplate(db, key);

  // Themes listeners
  const savedTheme = localStorage.getItem('academia_theme') || 'purple';
  applyAppTheme(savedTheme);

  document.querySelectorAll('.t-color').forEach(btn => {
    btn.addEventListener('click', () => {
      applyAppTheme(btn.dataset.theme);
      showToast('Tema atualizado!', 'info');
    });
  });

  // Delegar eventos para botões de nota dinâmicos
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-note-toggle, .btn-note-toggle-table, .btn-note-toggle-deck');
    if (btn) {
      const ex = getExById(db, btn.dataset.id);
      if (ex) showNotePopover(ex, btn);
    }
  });

  // Quick Tags no Modal
  document.querySelectorAll('.q-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const txt = document.getElementById('inputAnotacoes');
      const tag = btn.dataset.tag;
      txt.value += (txt.value && !txt.value.endsWith('\n') ? '\n' : '') + tag;
      txt.focus();
    });
  });

  // Backup e Dados
  document.querySelectorAll('[data-action="export-data"]').forEach(btn => {
    btn.onclick = () => exportData(loadDB());
  });
  document.querySelectorAll('[data-action="import-data"]').forEach(btn => {
    btn.onclick = () => importData();
  });

  // Maestria Geral (Deck Footer)
  document.getElementById('btnMaestriaGeral')?.addEventListener('click', () => openMaestriaGeral(loadDB()));
  
  // Coleção de Exercícios (Header Right)
  document.getElementById('btnVerColecao')?.addEventListener('click', () => openColecaoExercicios(loadDB()));

  // Fechar modais
  document.getElementById('btnFecharMaestriaGeral')?.addEventListener('click', () => closeModal('modalMaestriaGeral'));
  document.getElementById('btnFecharMaestriaEx')?.addEventListener('click', () => closeModal('modalMaestriaEx'));
  document.getElementById('btnFecharColecao')?.addEventListener('click', () => closeModal('modalColecaoExercicios'));

  // Filtro na Coleção
  document.getElementById('colecaoSearch')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.colecao-item');
    cards.forEach(card => {
      const match = card.dataset.name.toLowerCase().includes(term);
      card.style.display = match ? 'flex' : 'none';
    });
  });

  // Atualizar widget de maestria no deck footer
  updateDeckMaestriaWidget(db);

  // Iniciar Cronômetro Global
  initGlobalTimer(db);

  // ---- Feature 9: Ocultar Splash Screen ----
  const splash = document.getElementById('splashScreen');
  const splashFill = document.getElementById('splashFill');
  if (splash && splashFill) {
    // Simula carregamento rápido
    setTimeout(() => {
      splashFill.style.width = '100%';
      setTimeout(() => {
        splash.classList.add('splash-screen--hidden');
      }, 400); // Aguarda a transição da barra (0.35s)
    }, 100);
  }

});

// ---- RE-INIT APÓS IMPORTAÇÃO DE BACKUP ----
// Dispara 'academia:data-imported' em secao-perfil.js ao concluir importData().
// Recarrega o DB do localStorage e re-renderiza todas as seções dinâmicas
// sem precisar de window.location.reload(), preservando o overlay de Perfil.
window.addEventListener('academia:data-imported', () => {
  reinitAppAfterImport();
});

function reinitAppAfterImport() {
  const newDb = loadDB();

  try {
    renderHeroStats(newDb);
    renderFicha(newDb);
    renderExercicios(newDb);
    renderMontar(newDb);
    renderProgresso(newDb);
    updateEmptyWorkoutButtons(newDb);
    updateGlobalMasteryUI(newDb);
    applyProfileCustomization(newDb);
    _renderProfileEmblems(newDb);
    updateDeckMaestriaWidget(newDb);
    initDashboard(newDb);
    initCalculator();
  } catch (err) {
    console.error('[reinitAppAfterImport] Falha ao re-renderizar:', err);
    showToast('Dados importados, mas houve erro ao atualizar a interface. Recarregue a página.', 'error');
    return;
  }

  if (typeof window.isFichaOverlayOpen === 'function' && window.isFichaOverlayOpen()) {
    window.closeFichaOverlay({ force: true });
  }

  document.querySelectorAll('.modal-overlay').forEach(m => {
    if (m.style.display === 'flex') m.style.display = 'none';
  });

  showToast('Interface atualizada com os dados importados!', 'success');
}


