import { MAESTRIA_CHALLENGES, currentDeckLetter, setCurrentDeckLetter, currentDeckPage, setCurrentDeckPage, currentDeckView, setCurrentDeckView, currentExView, setCurrentExView, saveDB, uid, today, formatCarga, getExById, grupoBadgeClass, showToast, renderHeroStats, fadeIn } from './db.js';
import { treinosGridCard, treinosCollectionCard, deckActiveSlot, deckEmptySlot } from './templates.js';
import { renderFicha, startNewCycle, openModal, closeModal, openCRDetails } from './secao-ficha.js';
import {
  BANNERS, EMBLEMAS, IDENTITY_EMBLEMS, AVATAR_FRAMES, CARD_SKINS, TIMER_SKINS,
  SPRITESHEET_URL, isUnlocked,
  _applyBarSkinToDOM, _renderProfileEmblems,
  applyProfileCustomization, renderProfileShowcase,
  _renderBanners, _renderBarSkins, _renderTimerSkins, _renderCardSkins,
  _renderEmblemas, _renderIdentityEmblems, _renderIdentityEmblemPreview,
  _renderFrames, _updatePulseToggleUI,
} from './secao-customizacao.js';

// ---- EXERCÍCIOS GRID ----
export let currentFilter = 'all';
export function setCurrentFilter(val) { currentFilter = val; }
export let currentSearch = '';
export function setCurrentSearch(val) { currentSearch = val; }
export let calendarViewDate = new Date();

export function renderExercicios(db) {
  const grid = document.getElementById('exerciciosGrid');
  const emptyEl = document.getElementById('exEmpty');
  const btnGrid = document.getElementById('btnExViewGrid');
  const btnColecao = document.getElementById('btnExViewColecao');

  if (!grid) return;

  // Atualizar botões de vista (Grid / Coleção)
  if (btnGrid && btnColecao) {
    if (currentExView === 'grid') {
      btnGrid.classList.add('active');
      btnColecao.classList.remove('active');
    } else {
      btnColecao.classList.add('active');
      btnGrid.classList.remove('active');
    }

    btnGrid.onclick = (e) => {
      e.preventDefault();
      setCurrentExView('grid');
      renderExercicios(db);
    };
    btnColecao.onclick = (e) => {
      e.preventDefault();
      setCurrentExView('colecao');
      renderExercicios(db);
    };
  }

  let list = db.exercicios;
  if (currentFilter !== 'all') list = list.filter(e => e.grupoMuscular === currentFilter);
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    list = list.filter(e => e.nome.toLowerCase().includes(q) || e.grupoMuscular.toLowerCase().includes(q));
  }

  if (!list.length) {
    grid.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  if (currentExView === 'grid') {
    grid.classList.remove('collection-grid');
    grid.innerHTML = list.map(ex => {
      const badgeCls = grupoBadgeClass(ex.grupoMuscular);
      const imgHtml = ex.imagem
        ? `<img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">`
        : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`;
      const cargaHtml = ex.carga || (ex.tags && ex.tags.includes('Peso do Corpo')) ? ' | Carga: ' + formatCarga(ex.carga, ex.porLado, ex.tags) : '';
      return treinosGridCard(ex, badgeCls, imgHtml, cargaHtml);
    }).join('');
  } else {
    // MODO COLEÇÃO (Royale Style Fidelity)
    grid.classList.add('collection-grid');
    grid.innerHTML = list.map(ex => {
      return treinosCollectionCard(ex, false); 
    }).join('');

    // Toggle menu ao clicar no card
    grid.querySelectorAll('.deck-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.btn-card-action')) return;
        card.classList.toggle('menu-active');
        grid.querySelectorAll('.deck-card').forEach(c => { if (c !== card) c.classList.remove('menu-active'); });
      };
    });
  }

  grid.querySelectorAll('.btn-ex-edit').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openEditExercicio(db, btn.dataset.id); });
  });
  grid.querySelectorAll('.btn-ex-del').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); confirmDeleteExercicio(db, btn.dataset.id); });
  });
  fadeIn(grid);
}

// ---- FORM EXERCÍCIO ----
export let editingExId = null;

export function openNewExercicio() {
  editingExId = null;
  document.getElementById('modalExTitulo').textContent = 'Novo Exercício';
  document.getElementById('formExercicio').reset();
  
  // Limpa os chips (radios) e o input oculto
  document.querySelectorAll('input[name="grupoMuscularRadio"]').forEach(r => r.checked = false);
  document.getElementById('inputGrupo').value = '';

  document.getElementById('inputPorLado').checked = false;
  document.getElementById('exChartContainer').style.display = 'none';
  openModal('modalExercicio');
}

export function openEditExercicio(db, id) {
  const ex = getExById(db, id);
  if (!ex) return;
  editingExId = id;
  document.getElementById('modalExTitulo').textContent = 'Editar Exercício';
  document.getElementById('inputNome').value = ex.nome;
  document.getElementById('inputGrupo').value = ex.grupoMuscular;
  
  // Marca o chip (radio) correto
  const radio = document.querySelector(`input[name="grupoMuscularRadio"][value="${ex.grupoMuscular}"]`);
  if (radio) radio.checked = true;

  document.getElementById('inputSeries').value = ex.series;
  document.getElementById('inputReps').value = ex.repeticoes;
  document.getElementById('inputCarga').value = ex.carga || '';
  document.getElementById('inputDescanso').value = ex.descanso !== undefined ? ex.descanso : 30;
  document.getElementById('inputAnotacoes').value = ex.anotacoes || '';
  document.getElementById('inputPorLado').checked = !!ex.porLado;

  const tagsChecks = document.querySelectorAll('#inputTags input[type="checkbox"]');
  tagsChecks.forEach(cb => {
    cb.checked = (ex.tags || []).includes(cb.value);
  });

  if (ex.imagem) setUploadPreview(ex.imagem);
  else resetUpload();
  renderExChart(ex);
  openModal('modalExercicio');
}

export function resetUpload() {
  document.getElementById('uploadPlaceholder').style.display = 'block';
  document.getElementById('uploadPreview').style.display = 'none';
  document.getElementById('uploadPreview').src = '';
  document.getElementById('btnRemoveImg').style.display = 'none';
  document.getElementById('uploadInput').value = '';
}

export function setUploadPreview(src) {
  document.getElementById('uploadPlaceholder').style.display = 'none';
  document.getElementById('uploadPreview').src = src;
  document.getElementById('uploadPreview').style.display = 'block';
  document.getElementById('btnRemoveImg').style.display = 'inline-block';
}

export function renderExChart(ex) {
  const container = document.getElementById('exChartContainer');
  const chartEl = document.getElementById('exChart');

  if (!ex || !ex.historicoCargas || ex.historicoCargas.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  const history = ex.historicoCargas;
  const maxValor = Math.max(...history.map(h => h.valor));

  chartEl.innerHTML = history.map(h => {
    const heightPct = maxValor > 0 ? (h.valor / maxValor) * 100 : 0;
    const dateObj = new Date(h.data + 'T12:00:00');
    const dateLbl = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    return `<div class="chart-bar-wrap">
      <div class="chart-val">${h.label}</div>
      <div class="chart-bar" style="height: ${heightPct}%" title="${h.label} em ${dateLbl}"></div>
      <div class="chart-date">${dateLbl}</div>
    </div>`;
  }).join('');
}

export function saveExercicio(db) {
  const nome = document.getElementById('inputNome').value.trim();
  const grupo = document.getElementById('inputGrupo').value;
  const series = parseInt(document.getElementById('inputSeries').value) || 3;
  const reps = document.getElementById('inputReps').value.trim() || '10';
  const carga = document.getElementById('inputCarga').value.trim();
  const descanso = parseInt(document.getElementById('inputDescanso').value) || 0;
  const anotacoes = document.getElementById('inputAnotacoes').value.trim();

  const tagsChecks = document.querySelectorAll('#inputTags input[type="checkbox"]:checked');
  const tags = Array.from(tagsChecks).map(cb => cb.value);
  const porLado = document.getElementById('inputPorLado').checked;

  const preview = document.getElementById('uploadPreview');
  const imagem = (preview.style.display !== 'none' && preview.src && preview.src !== window.location.href) ? preview.src : null;

  if (!nome || !grupo) { showToast('Preencha nome e grupo muscular.', 'error'); return; }

  if (editingExId) {
    const ex = getExById(db, editingExId);
    let toastMsg = 'Exercício atualizado!';
    if (ex) {
      let isNewLoad = carga && (carga !== ex.carga);
      if (isNewLoad) {
        if (!ex.historicoCargas) ex.historicoCargas = [];
        const numCarga = parseFloat(carga.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(numCarga)) {
          const lastVal = ex.historicoCargas.length > 0 ? ex.historicoCargas[ex.historicoCargas.length - 1].valor : 0;
          if (numCarga > lastVal && lastVal > 0) {
            toastMsg = `📈 RECORDE! Nova carga máxima: ${carga}! O monstro tá saindo da jaula!`;
          }
          ex.historicoCargas.push({ data: today(), valor: numCarga, label: carga });
          if (ex.historicoCargas.length > 15) ex.historicoCargas.shift(); // Manter apenas as últimas 15
        }
      }
      Object.assign(ex, { nome, grupoMuscular: grupo, series, repeticoes: reps, carga, imagem, descanso, anotacoes, tags, porLado });
    }
    showToast(toastMsg, 'success');
  } else {
    let hist = [];
    if (carga) {
      const numCarga = parseFloat(carga.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(numCarga)) hist.push({ data: today(), valor: numCarga, label: carga });
    }
    db.exercicios.push({ id: uid(), nome, grupoMuscular: grupo, series, repeticoes: reps, carga, imagem, descanso, historicoCargas: hist, anotacoes, tags, porLado });
    showToast('Exercício cadastrado!', 'success');
  }
  saveDB(db);
  closeModal('modalExercicio');
  renderExercicios(db);
  renderHeroStats(db);
}

export function confirmDeleteExercicio(db, id) {
  const ex = getExById(db, id);
  if (!ex) return;
  document.getElementById('confirmTitle').textContent = 'Excluir exercício?';
  document.getElementById('confirmMsg').textContent = `"${ex.nome}" será removido permanentemente.`;
  openModal('modalConfirm');
  document.getElementById('btnConfirmYes').onclick = () => {
    db.exercicios = db.exercicios.filter(e => e.id !== id);
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(letra => {
      db.fichas[letra] = db.fichas[letra].filter(i => i !== id);
    });
    saveDB(db);
    closeModal('modalConfirm');
    renderExercicios(db);
    renderMontar(db);
    renderFicha(db);
    renderHeroStats(db);
    showToast('Exercício excluído.', 'info');
  };
  document.getElementById('btnConfirmNo').onclick = () => closeModal('modalConfirm');
}


// ---- MONTAR TREINO (REFINED STYLE) ----
export function renderMontar(db) {
  const activeGrid = document.getElementById('deckActiveGrid');
  const letterTabs = document.querySelectorAll('#deckLetterTabs .sel-btn');
  const btnGridView = document.getElementById('btnDeckGridView');
  const btnListView = document.getElementById('btnDeckListView');

  if (!activeGrid) return;

  // 1. Atualizar Seletor de Letras (A-J) com Paginação
  const btnSwitch = document.getElementById('btnSwitchDeckPage');
  if (btnSwitch) {
    btnSwitch.onclick = () => {
      setCurrentDeckPage(currentDeckPage === 1 ? 2 : 1);
      renderMontar(db);
    };
  }

  letterTabs.forEach(btn => {
    const letra = btn.dataset.letra;
    const isPage1 = ['A', 'B', 'C', 'D', 'E'].includes(letra);
    
    // Controle de Visibilidade por Página
    if (currentDeckPage === 1) {
      btn.style.display = isPage1 ? 'flex' : 'none';
    } else {
      btn.style.display = !isPage1 ? 'flex' : 'none';
    }

    btn.classList.toggle('active', letra === currentDeckLetter);
    btn.onclick = () => {
      setCurrentDeckLetter(letra);
      renderMontar(db);
    };
  });

  // 2. Atualizar Botões de Vista (Grid/Lista/Royale)
  if (btnGridView && btnListView) {
    btnGridView.classList.toggle('active', currentDeckView === 'grid' || currentDeckView === 'royale');
    btnListView.classList.toggle('active', currentDeckView === 'list');

    btnGridView.onclick = (e) => {
      e.preventDefault();
      if (currentDeckView === 'grid') {
        setCurrentDeckView('royale');
      } else if (currentDeckView === 'royale') {
        setCurrentDeckView('grid');
      } else {
        setCurrentDeckView('grid');
      }
      renderDeckCollection(db);
      renderMontar(db);
    };
    btnListView.onclick = (e) => {
      e.preventDefault();
      setCurrentDeckView('list');
      renderDeckCollection(db);
      renderMontar(db);
    };
  }

  // 3. Renderizar Grid Ativo e Coleção
  renderDeckGrid(db);
  renderDeckCollection(db);

  // 4. Atualizar Volume Médio
  updateDeckStats(db);
}

export function renderDeckGrid(db) {
  const grid = document.getElementById('deckActiveGrid');
  const ids = db.fichas[currentDeckLetter] || [];

  // Toggle View Classes on the Active Grid
  grid.classList.toggle('list-view', currentDeckView === 'list');
  grid.classList.toggle('royale-view', currentDeckView === 'royale');

  let html = '';
  // 8 Slots fixos
  for (let i = 0; i < 8; i++) {
    const id = ids[i];
    if (id) {
      const ex = getExById(db, id);
      if (ex) {
        html += deckActiveSlot(ex, i, currentDeckView);
      } else {
        html += deckEmptySlot(i, currentDeckView);
      }
    } else {
      html += deckEmptySlot(i, currentDeckView);
    }
  }
  grid.innerHTML = html;

  // Eventos de Drag & Drop (Desktop)
  grid.querySelectorAll('.deck-slot').forEach(slot => {
    const targetIndex = parseInt(slot.dataset.index);

    slot.ondragover = (e) => {
      e.preventDefault();
      slot.classList.add('drag-over');
    };
    slot.ondragleave = () => slot.classList.remove('drag-over');
    slot.ondrop = (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');

      const sourceIndex = e.dataTransfer.getData('sourceIndex');
      const exerciseId = e.dataTransfer.getData('text/plain');

      let ficha = db.fichas[currentDeckLetter] || [];
      // Garantir que a ficha tenha 8 espaços
      while (ficha.length < 8) ficha.push(null);

      if (sourceIndex !== "") {
        // REORDENAR (Grid para Grid)
        const sIdx = parseInt(sourceIndex);
        const temp = ficha[targetIndex];
        ficha[targetIndex] = ficha[sIdx];
        ficha[sIdx] = temp;
      } else if (exerciseId) {
        // ADICIONAR/SUBSTITUIR (Coleção para Grid)
        // Se já estiver na ficha em outra posição, removemos de lá para não duplicar
        const existingIdx = ficha.indexOf(exerciseId);
        if (existingIdx !== -1) {
          ficha[existingIdx] = null;
        }
        ficha[targetIndex] = exerciseId;
      }

      // Limpar nulos do final para manter compatibilidade, mas manter nulos entre exercícios se necessário?
      // O usuário quer "posições", então vamos manter os nulls para preservar a ordem visual se houver buracos.
      db.fichas[currentDeckLetter] = ficha;
      saveDB(db);
      renderMontar(db);
      renderFicha(db);
      showToast('Treino atualizado!', 'success');
    };
  });

  // Eventos (para o grid view e royale view card toggle)
  if (currentDeckView === 'grid' || currentDeckView === 'royale') {
    grid.querySelectorAll('.deck-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.btn-card-action')) return;
        card.classList.toggle('menu-active');
        grid.querySelectorAll('.deck-card').forEach(c => { if (c !== card) c.classList.remove('menu-active'); });
      };
    });
  }

  grid.querySelectorAll('.btn-card-details-cr').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openCRDetails(db, btn.dataset.id); };
  });

  grid.querySelectorAll('.btn-card-details').forEach(btn => {
    btn.onclick = () => openEditExercicio(db, btn.dataset.id);
  });

  grid.querySelectorAll('.btn-card-maestria-mini').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openMaestriaExercicio(db, btn.dataset.id);
    };
  });

  grid.querySelectorAll('.btn-card-remove').forEach(btn => {
    btn.onclick = () => {
      let ficha = db.fichas[currentDeckLetter] || [];
      const idToRemove = btn.dataset.id;

      // Substituir o ID específico por null para manter a posição dos outros
      const idx = ficha.indexOf(idToRemove);
      if (idx !== -1) {
        ficha[idx] = null;
      }

      db.fichas[currentDeckLetter] = ficha;
      saveDB(db);
      renderMontar(db);
      renderFicha(db);
      showToast('Removido do treino!', 'info');
    };
  });
  fadeIn(grid);
}

export function renderDeckCollection(db) {
  const grid = document.getElementById('deckCollectionGrid');
  const searchInp = document.getElementById('deckCollectionSearch');
  const countEl = document.getElementById('deckCollectionCount');
  if (!grid) return;

  const query = (searchInp.value || '').toLowerCase();
  const inDeck = db.fichas[currentDeckLetter] || [];

  let list = db.exercicios;
  if (query) {
    list = list.filter(e => e.nome.toLowerCase().includes(query) || e.grupoMuscular.toLowerCase().includes(query));
  }

  countEl.textContent = `${list.length}/${db.exercicios.length}`;

  // Collection ALWAYS remains as a Grid
  grid.classList.remove('list-view');

  grid.innerHTML = list.map(ex => {
    const already = inDeck.includes(ex.id);
    return treinosCollectionCard(ex, already);
  }).join('');

  // Eventos de Clique e Drag (Mobile)
  grid.querySelectorAll('.collection-card:not(.in-deck)').forEach(card => {
    // Clique tradicional
    card.onclick = () => {
      let ficha = db.fichas[currentDeckLetter] || [];
      if (ficha.filter(Boolean).length >= 8) {
        showToast('Máximo de 8 exercícios atingido!', 'error');
        return;
      }

      // Tentar preencher o primeiro slot vazio (null)
      let added = false;
      for (let i = 0; i < 8; i++) {
        if (!ficha[i]) {
          ficha[i] = card.dataset.id;
          added = true;
          break;
        }
      }
      if (!added && ficha.length < 8) {
        ficha.push(card.dataset.id);
      }

      db.fichas[currentDeckLetter] = ficha;
      saveDB(db);
      renderMontar(db);
      renderFicha(db);
      showToast('Adicionado ao treino!', 'success');
    };

    // Suporte para Touch (Arrastar no Mobile) - Delay para diferenciar de Clique
    let ghost = null;
    let pressTimer = null;
    let isDragging = false;

    card.ontouchstart = (e) => {
      if (inDeck.length >= 8) return;
      const touch = e.touches[0];
      
      pressTimer = setTimeout(() => {
        isDragging = true;
        ghost = card.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.width = card.offsetWidth + 'px';
        ghost.style.height = card.offsetHeight + 'px';
        ghost.style.opacity = '0.8';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '9999';
        ghost.style.left = (touch.clientX - card.offsetWidth / 2) + 'px';
        ghost.style.top = (touch.clientY - card.offsetHeight / 2) + 'px';
        document.body.appendChild(ghost);
        card.classList.add('dragging');
        if (navigator.vibrate) navigator.vibrate(50);
      }, 250);
    };

    card.ontouchmove = (e) => {
      if (!isDragging) {
        clearTimeout(pressTimer);
        return;
      }
      e.preventDefault();
      const touch = e.touches[0];
      ghost.style.left = (touch.clientX - ghost.offsetWidth / 2) + 'px';
      ghost.style.top = (touch.clientY - ghost.offsetHeight / 2) + 'px';

      // Highlight potential drop targets
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = target ? target.closest('.deck-slot:empty, .deck-slot:not(:has(.deck-card))') : null;
      document.querySelectorAll('.deck-slot').forEach(s => s.classList.remove('drag-over'));
      if (slot) slot.classList.add('drag-over');
    };

    card.ontouchend = (e) => {
      clearTimeout(pressTimer);
      if (!isDragging) return;
      isDragging = false;
      
      card.classList.remove('dragging');
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = target ? target.closest('.deck-slot') : null;

      if (slot) {
        const targetIndex = parseInt(slot.dataset.index);
        let ficha = db.fichas[currentDeckLetter] || [];
        while (ficha.length < 8) ficha.push(null);

        const exerciseId = card.dataset.id;
        const existingIdx = ficha.indexOf(exerciseId);
        if (existingIdx !== -1) {
          ficha[existingIdx] = null;
        }
        ficha[targetIndex] = exerciseId;

        db.fichas[currentDeckLetter] = ficha;
        saveDB(db);
        renderMontar(db);
        renderFicha(db);
        showToast('Adicionado ao treino!', 'success');
      }

      ghost.remove();
      ghost = null;
      document.querySelectorAll('.deck-slot').forEach(s => s.classList.remove('drag-over'));
    };
  });

  // REORDERING TOUCH EVENTS (Active Grid - Deck Builder Only)
  document.querySelectorAll('#deckActiveGrid .deck-card, #deckActiveGrid .deck-list-item').forEach((card, sIdx) => {
    let ghost = null;
    let pressTimer = null;
    let isDragging = false;

    card.ontouchstart = (e) => {
      const touch = e.touches[0];
      
      pressTimer = setTimeout(() => {
        isDragging = true;
        ghost = card.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.width = card.offsetWidth + 'px';
        ghost.style.height = card.offsetHeight + 'px';
        ghost.style.opacity = '0.8';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '9999';
        ghost.style.left = (touch.clientX - card.offsetWidth / 2) + 'px';
        ghost.style.top = (touch.clientY - card.offsetHeight / 2) + 'px';
        document.body.appendChild(ghost);
        card.classList.add('dragging');
        if (navigator.vibrate) navigator.vibrate(50);
      }, 250);
    };

    card.ontouchmove = (e) => {
      if (!isDragging) {
        clearTimeout(pressTimer);
        return;
      }
      e.preventDefault();
      const touch = e.touches[0];
      ghost.style.left = (touch.clientX - ghost.offsetWidth / 2) + 'px';
      ghost.style.top = (touch.clientY - ghost.offsetHeight / 2) + 'px';

      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = target ? target.closest('.deck-slot') : null;
      document.querySelectorAll('.deck-slot').forEach(s => s.classList.remove('drag-over'));
      if (slot) slot.classList.add('drag-over');
    };

    card.ontouchend = (e) => {
      clearTimeout(pressTimer);
      if (!isDragging) return;
      isDragging = false;
      
      card.classList.remove('dragging');
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      const slot = target ? target.closest('.deck-slot') : null;

      if (slot) {
        const targetIndex = parseInt(slot.dataset.index);
        const sourceIndex = parseInt(card.closest('.deck-slot').dataset.index);

        let ficha = db.fichas[currentDeckLetter] || [];
        while (ficha.length < 8) ficha.push(null);

        const temp = ficha[targetIndex];
        ficha[targetIndex] = ficha[sourceIndex];
        ficha[sourceIndex] = temp;

        db.fichas[currentDeckLetter] = ficha;
        saveDB(db);
        renderMontar(db);
        renderFicha(db);
        showToast('Ordem alterada!', 'success');
      }

      ghost.remove();
      ghost = null;
      document.querySelectorAll('.deck-slot').forEach(s => s.classList.remove('drag-over'));
    };
  });

  searchInp.oninput = () => renderDeckCollection(db);
  fadeIn(grid);
}


export function updateDeckStats(db) {
  const ids = db.fichas[currentDeckLetter] || [];
  const exercicios = ids.map(id => getExById(db, id)).filter(Boolean);

  // 1. Volume Stats
  let totalCarga = 0;
  exercicios.forEach(ex => {
    const val = parseFloat(ex.carga) || 0;
    totalCarga += val;
  });
  const avg = exercicios.length ? (totalCarga / exercicios.length).toFixed(1) : '0.0';
  const avgEl = document.getElementById('deckAvgVolume');
  if (avgEl) avgEl.textContent = avg;

  // 2. Cardio Stats
  const ae = db.aerobicos[currentDeckLetter];
  const cardioMain = document.getElementById('deckCardioMain');
  const cardioSub = document.getElementById('deckCardioSub');

  if (ae && ae.tipo) {
    if (cardioMain) cardioMain.textContent = ae.tempo ? `${ae.tempo}min` : '--';
    if (cardioSub) cardioSub.textContent = `${ae.tipo}${ae.vel ? ' • ' + ae.vel + 'km/h' : ''}`;
  } else {
    if (cardioMain) cardioMain.textContent = '--';
    if (cardioSub) cardioSub.textContent = 'Configurar Cardio';
  }
}
// ======================================================


// ---- MAESTRIA ----
// ======================================================

export function getMaestriaState(db, exId) {
  if (!db.maestrias) db.maestrias = {};
  const m = db.maestrias[exId];
  let sessoes = (m && m.totalSessoes) ? m.totalSessoes : 0;

  if (localStorage.getItem('academia_dev_mode') === 'true') {
    sessoes = Math.max(sessoes, MAESTRIA_CHALLENGES[2].subDesafios[2].target);
  }

  const challenges = MAESTRIA_CHALLENGES.map((ch, i) => {
    const prevTarget = i === 0 ? 0 : MAESTRIA_CHALLENGES[i - 1].subDesafios[2].target;
    const locked = sessoes < prevTarget;
    const subDesafios = ch.subDesafios.map(sub => ({
      ...sub,
      current: Math.min(sessoes, sub.target),
      completed: sessoes >= sub.target
    }));
    const completed = subDesafios.every(s => s.completed);
    return { ...ch, locked, completed, subDesafios };
  });

  let badgeLevel = 0;
  if (sessoes >= MAESTRIA_CHALLENGES[0].subDesafios[2].target) badgeLevel = 1; // bronze
  if (sessoes >= MAESTRIA_CHALLENGES[1].subDesafios[2].target) badgeLevel = 2; // prata
  if (sessoes >= MAESTRIA_CHALLENGES[2].subDesafios[2].target) badgeLevel = 3; // ouro

  return { totalSessoes: sessoes, badgeLevel, challenges };
}

export function trackMaestriaSessoes(db, exIds) {
  if (!db.maestrias) db.maestrias = {};
  exIds.forEach(exId => {
    if (exId.startsWith('ae-')) return;
    if (!db.maestrias[exId]) db.maestrias[exId] = { totalSessoes: 0 };
    
    // Nível antes
    const stateBefore = getMaestriaState(db, exId);
    const levelBefore = stateBefore.badgeLevel;

    db.maestrias[exId].totalSessoes = (db.maestrias[exId].totalSessoes || 0) + 1;

    // Nível depois
    const stateAfter = getMaestriaState(db, exId);
    const levelAfter = stateAfter.badgeLevel;

    if (levelAfter > levelBefore && levelAfter > 0) {
      setTimeout(() => {
        showLevelUpModal(db, exId, levelAfter);
      }, 1500); // Pequeno delay após o confete da conclusão
    }
  });
  saveDB(db);
}

export function showLevelUpModal(db, exId, level) {
  const ex = getExById(db, exId);
  if (!ex) return;

  const tierNames = ['', 'BRONZE', 'PRATA', 'OURO'];
  const tierName = tierNames[level];

  document.getElementById('levelUpExName').textContent = ex.nome.toUpperCase();
  document.getElementById('levelUpTierName').textContent = tierName;

  const slot = document.getElementById('levelUpBadgeSlot');
  if (slot) {
    const bc = ['none', 'bronze', 'prata', 'ouro'][level];
    slot.innerHTML = `
      <div class="cr-mastery-mini-shield cr-mini-tier-${bc}">
        ${ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}">` : '🏋️'}
      </div>
    `;
  }

  openModal('modalLevelUp');
}

// Inicializar listener do botão fechar
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnFecharLevelUp')?.addEventListener('click', () => {
        closeModal('modalLevelUp');
    });
});

export function getMaestriaIconHtml(state, small = false) {
  const sz = small ? 'small' : '';
  if (state.badgeLevel === 3) return `<span class="m-badge-pip ouro ${sz}">★★★</span>`;
  if (state.badgeLevel === 2) return `<span class="m-badge-pip prata ${sz}">★★</span>`;
  if (state.badgeLevel === 1) return `<span class="m-badge-pip bronze ${sz}">★</span>`;
  return `<span class="m-badge-pip none ${sz}" style="display:inline-flex; align-items:center; justify-content:center;">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  </span>`;
}

export function updateGlobalMasteryUI(db, suffix = '') {
  let totalXP = 0;
  db.exercicios.forEach(ex => {
    const state = getMaestriaState(db, ex.id);
    totalXP += state.badgeLevel;
  });

  const getRank = (xp) => {
    if (xp < 10) return { level: 1, title: 'PRATICANTE', next: 10 };
    if (xp < 30) return { level: 2, title: 'ESPECIALISTA EM TREINO', next: 30 };
    if (xp < 60) return { level: 3, title: 'MESTRE DE EXECUÇÃO', next: 60 };
    if (xp < 100) return { level: 4, title: 'GRÃO-MESTRE DE FORÇA', next: 100 };
    const lvl = Math.floor(xp / 25) + 1;
    return { level: lvl, title: 'LENDA DA MAESTRIA', next: (lvl) * 25 };
  };

  const rank = getRank(totalXP);
  const pct = Math.min(100, (totalXP / rank.next) * 100);

  const elRank = document.getElementById('athleticRank' + suffix);
  const elLevel = document.getElementById('athleticLevel' + suffix);
  const elXP = document.getElementById('athleticXP' + suffix);
  const elProgress = document.getElementById('athleticProgress' + suffix);

  if (elRank) elRank.textContent = rank.title;
  if (elLevel) elLevel.textContent = `Maestria Nível ${rank.level}`;
  if (elXP) elXP.textContent = `${totalXP} / ${rank.next} PTS`;
  if (elProgress) elProgress.style.width = pct + '%';
}

export function updateDeckMaestriaWidget(db) {
  const el = document.getElementById('deckMaestriaCount');
  if (!el) return;
  let full = 0;
  db.exercicios.forEach(ex => {
    if (getMaestriaState(db, ex.id).badgeLevel > 0) full++;
  });
  el.textContent = full + '/' + db.exercicios.length;
}

export function openMaestriaGeral(db) {
  const grid = document.getElementById('maestriaGeralGrid');
  if (!grid) return;

  updateGlobalMasteryUI(db, 'MG');

  grid.innerHTML = db.exercicios.map(ex => {
    const state = getMaestriaState(db, ex.id);
    const bc = ['none','bronze','prata','ouro'][state.badgeLevel];
    const imgHtml = ex.imagem
      ? `<img src="${ex.imagem}" alt="${ex.nome}">`
      : `<div class="m-card-img-ph" style="display:flex; align-items:center; justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
              <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/>
              <circle cx="4" cy="12" r="1.5"/>
              <circle cx="20" cy="12" r="1.5"/>
          </svg>
        </div>`;
    
    return `
    <div class="royale-card frame-${bc}" data-id="${ex.id}">
      <div class="royale-card-inner">
        ${state.badgeLevel > 0 ? `<div class="royale-diamond"></div>` : ''}
        <div class="royale-img-container">
          ${imgHtml}
          <div class="royale-level-pill pill-${bc}">
            <span class="pill-text">${ex.nome}</span>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.royale-card').forEach(card => {
    card.onclick = () => {
      closeModal('modalMaestriaGeral');
      openMaestriaExercicio(db, card.dataset.id);
    };
  });

  openModal('modalMaestriaGeral');
}

export function openColecaoExercicios(db) {
  const grid = document.getElementById('colecaoGrid');
  const countEl = document.getElementById('colecaoCount');
  if (!grid) return;

  updateGlobalMasteryUI(db);

  if (countEl) countEl.textContent = `${db.exercicios.length}/${db.exercicios.length}`;

  const groupColors = {
    'Peito': 'peito',
    'Costas': 'costas',
    'Ombros': 'ombros',
    'Pernas': 'pernas',
    'Bíceps': 'biceps',
    'Tríceps': 'triceps',
    'Core': 'core'
  };

  grid.innerHTML = db.exercicios.map(ex => {
    const imgHtml = ex.imagem 
      ? `<img src="${ex.imagem}" alt="${ex.nome}">` 
      : `<div class="colecao-item-ph" style="display:flex; align-items:center; justify-content:center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
              <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/>
              <circle cx="4" cy="12" r="1.5"/>
              <circle cx="20" cy="12" r="1.5"/>
          </svg>
        </div>`;
    
    const groupClass = groupColors[ex.grupoMuscular] || 'default';
      
    return `
      <div class="colecao-card group-${groupClass}" data-id="${ex.id}" data-name="${ex.nome}">
        <div class="card-group-header"><span>${ex.grupoMuscular}</span></div>
        <div class="card-media-box">
          ${imgHtml}
        </div>
        <div class="card-footer-box">
          <h4 class="card-name">${ex.nome}</h4>
          <span class="card-series">${ex.series || 3} séries</span>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.colecao-card').forEach(item => {
    item.onclick = () => {
      closeModal('modalColecaoExercicios');
      openMaestriaExercicio(db, item.dataset.id);
    };
  });

  openModal('modalColecaoExercicios');
}

export function openMaestriaExercicio(db, exId) {
  const ex = getExById(db, exId);
  if (!ex) return;
  const state = getMaestriaState(db, exId);

  const badgeArea = document.getElementById('maestriaExBadgeArea');
  if (badgeArea) {
    const imgHtml = ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}">` : `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="32" height="32" style="color:rgba(255,255,255,0.4)">
          <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/>
          <circle cx="4" cy="12" r="1.5"/>
          <circle cx="20" cy="12" r="1.5"/>
      </svg>`;
    const stars = state.badgeLevel;
    const starsHtml = Array(3).fill(0).map((_,i)=>{
      const lit = i < stars;
      return `<span class="mx-star ${lit ? 'lit' : ''}" style="display:inline-flex;">
        <svg viewBox="0 0 24 24" fill="${lit ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:${lit ? '#fbbf24' : 'var(--text-tertiary)'};">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </span>`;
    }).join('');
    badgeArea.innerHTML = `
      <div class="royale-badge-shield badge-tier-${['none','bronze','prata','ouro'][state.badgeLevel]}">
        <div class="shield-inner">${imgHtml}</div>
      </div>
      <div class="mx-badge-stars">${starsHtml}</div>`;
  }

  const challengesEl = document.getElementById('maestriaExChallenges');
  if (challengesEl) {
    challengesEl.innerHTML = MAESTRIA_CHALLENGES.map((ch, tierIdx) => {
      const prevTierDone = tierIdx === 0 || state.challenges[tierIdx-1].completed;
      const isLocked = !prevTierDone;
      const isCompleted = state.challenges[tierIdx].completed;
      const tierClass = `tier-${ch.badge}`;

      if (isCompleted) {
        return `<div class="royale-task-row ${tierClass} completed">
          <div class="task-icon">${ch.icon}</div>
          <div class="task-info"><div class="task-status-text">Concluído</div></div>
          <div class="task-check">✓</div>
        </div>`;
      } else if (isLocked) {
        return `<div class="royale-task-row locked">
          <div class="task-lock-icon" style="display:flex; align-items:center; justify-content:center;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
          </div>
        </div>`;
      } else {
        const currentSub = ch.subDesafios.find(s => state.totalSessoes < s.target) || ch.subDesafios[2];
        const pct = Math.min(100, (state.totalSessoes / currentSub.target) * 100);
        const subIndex = ch.subDesafios.indexOf(currentSub);
        const nextLevel = subIndex + 1;
        
        return `<div class="royale-task-row ${tierClass} active" 
                     onclick="showRoyaleTooltip(event, '${currentSub.label}', '${currentSub.desc}', '${nextLevel}/3')">
          <div class="task-icon">${ch.icon}</div>
          <div class="task-info">
            <div class="task-title">${currentSub.label}</div>
            <div class="task-progress-wrap">
              <div class="task-progress-bar">
                <div class="task-progress-fill" style="width: ${pct}%"></div>
                <div class="task-progress-text">${state.totalSessoes}/${currentSub.target}</div>
              </div>
            </div>
          </div>
          <div class="task-reward" style="display:flex; flex-direction:column; align-items:center;">
            <div class="reward-icon" style="display:flex; align-items:center; justify-content:center; color:#fbbf24;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </div>
            <div class="reward-val">${nextLevel}</div>
          </div>
          <div class="task-level-tabs">
            <div class="level-tab ${nextLevel>=3?'active':''}">3</div>
            <div class="level-tab ${nextLevel>=2?'active':''}">2</div>
            <div class="level-tab ${nextLevel>=1?'active':''}">1</div>
          </div>
        </div>`;
      }
    }).join('');
  }
  openModal('modalMaestriaEx');
}

export function showRoyaleTooltip(event, title, desc, progress) {
  event.stopPropagation();
  
  // Remover tooltip existente se houver
  const old = document.querySelector('.royale-tooltip');
  if (old) old.remove();

  const row = event.currentTarget;
  const tooltip = document.createElement('div');
  tooltip.className = 'royale-tooltip';
  
  // Extrair o nível atual do progresso (ex: "2/3")
  const currentStep = progress.split('/')[0];

  tooltip.innerHTML = `
    <div class="rt-progress">Progresso da tarefa: ${progress}</div>
    <div class="rt-desc">${desc}</div>
    <div class="rt-reward-box" style="display:flex; align-items:center; gap:4px;">
      <span class="rt-gem" style="display:inline-flex; align-items:center; color:#06b6d4;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <path d="M6 3h12l4 6-10 12L2 9z"/>
              <path d="M11 3 8 9l4 12 4-12-3-6"/>
              <path d="M2 9h20"/>
          </svg>
      </span> 
      <span class="rt-val">+${currentStep * 5} PTS</span>
    </div>
    <div class="rt-arrow"></div>
  `;

  document.body.appendChild(tooltip);

  // Posicionamento Tático (Baseado no row clicado)
  const rect = row.getBoundingClientRect();
  tooltip.style.left = (rect.left + rect.width / 2) + 'px';
  tooltip.style.top = (rect.top - 5) + 'px';

  // Fechar ao clicar fora
  const closeTip = (e) => {
    if (!tooltip.contains(e.target)) {
      tooltip.remove();
      document.removeEventListener('mousedown', closeTip);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', closeTip), 10);
}

export function openAerobicoModal(db, letra) {
  const targetLetra = letra || currentDeckLetter;
  const ae = db.aerobicos[targetLetra] || { tipo: '', vel: '', tempo: '' };
  const modalTitle = document.getElementById('modalAeTitulo');
  if (modalTitle) modalTitle.textContent = `Configurar Cardio - Treino ${targetLetra}`;

  document.getElementById('inputAeTipo').value = ae.tipo || '';
  document.getElementById('inputAeVel').value = ae.vel || '';
  document.getElementById('inputAeTempo').value = ae.tempo || '';

  openModal('modalAerobico');

  document.getElementById('btnSalvarAerobico').onclick = () => {
    db.aerobicos[targetLetra] = {
      tipo: document.getElementById('inputAeTipo').value,
      vel: document.getElementById('inputAeVel').value,
      tempo: document.getElementById('inputAeTempo').value
    };
    saveDB(db);
    closeModal('modalAerobico');
    showToast('Cardio salvo!', 'success');
    
    // Atualizar as duas possíveis visualizações
    renderMontar(db);
    renderFicha(db);
  };
}



// ---- PICKER MODAL ----
export let pickerTreinoAtivo = 'A';
export let pickerSearch = '';
export function setPickerSearch(val) { pickerSearch = val; }

export function openPicker(db, letra) {
  pickerTreinoAtivo = letra;
  pickerSearch = '';
  document.getElementById('pickerLabel').textContent = letra;
  document.getElementById('pickerSearch').value = '';
  renderPickerList(db);
  openModal('modalPicker');
}

export function renderPickerList(db) {
  const listEl = document.getElementById('pickerList');
  if (!listEl) return;
  const already = db.fichas[pickerTreinoAtivo] || [];
  let list = db.exercicios;
  if (pickerSearch) {
    const q = pickerSearch.toLowerCase();
    list = list.filter(e => e.nome.toLowerCase().includes(q) || e.grupoMuscular.toLowerCase().includes(q));
  }
  listEl.innerHTML = list.map(ex => {
    const isAlready = already.includes(ex.id);
    const badgeCls = grupoBadgeClass(ex.grupoMuscular);
    const imgHtml = ex.imagem
      ? `<img src="${ex.imagem}" alt="${ex.nome}">`
      : '🏋️';
    return `<div class="picker-item ${isAlready ? 'picker-already' : ''}" data-id="${ex.id}">
      <div class="picker-item-img">${imgHtml}</div>
      <div class="picker-item-info">
        <div class="picker-item-name">${ex.nome}</div>
        <div class="picker-item-grp" style="display:flex; gap:8px; align-items:center; margin-top:4px;">
          <span class="${badgeCls}">${ex.grupoMuscular}</span>
          <span>${ex.series}×${ex.repeticoes}${ex.carga ? ' | Carga: ' + formatCarga(ex.carga) : ''}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  listEl.querySelectorAll('.picker-item:not(.picker-already)').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      if (!db.fichas[pickerTreinoAtivo]) db.fichas[pickerTreinoAtivo] = [];
      if (!db.fichas[pickerTreinoAtivo].includes(id)) {
        db.fichas[pickerTreinoAtivo].push(id);
        saveDB(db);
        renderMontar(db);
        renderFicha(db);
        showToast('Adicionado ao Treino ' + pickerTreinoAtivo + '!', 'success');
      }
      renderPickerList(db);
    });
  });
}



// ---- TEMPLATES ----
export const TEMPLATES_PRONTOS = {
  hipertrofia_iniciante: {
    A: ['ex-a1', 'ex-a2', 'ex-a5', 'ex-a6', 'ex-a8'],
    B: ['ex-b1', 'ex-b2', 'ex-b5', 'ex-b4', 'ex-b7']
  },
  perda_ponderal: {
    A: ['ex-a1', 'ex-a2', 'ex-a3', 'ex-a4', 'ex-a5', 'ex-a6', 'ex-tric-pulley', 'ex-supra-solo'],
    B: ['ex-b1', 'ex-b2', 'ex-b3', 'ex-b4', 'ex-b5', 'ex-burrinho', 'ex-b7', 'ex-supra-solo'],
    ae: { tipo: 'Esteira', vel: '5.0', tempo: '20' }
  },
  sup_inf: {
    A: ['ex-a1', 'ex-a2', 'ex-b1', 'ex-b2', 'ex-a6'],
    B: ['ex-a5', 'ex-b5', 'ex-a8', 'ex-b8']
  },
  push_pull: {
    A: ['ex-a1', 'ex-a2', 'ex-a6', 'ex-a7'],
    B: ['ex-b1', 'ex-b2', 'ex-b7', 'ex-b8']
  },
  tonificar: {
    A: ['ex-gluteo-3a', 'ex-abducao-solo', 'ex-supra-ponte', 'ex-b5', 'ex-a3', 'ex-a2', 'ex-banco-abdutor'],
    B: ['ex-extensor', 'ex-leg-180', 'ex-banco-adutor', 'ex-burrinho', 'ex-b2', 'ex-b3', 'ex-infra-solo'],
    ae: { tipo: 'Geral', vel: '---', tempo: '20' }
  },
  hipertrofia_medio: {
    A: ['ex-a2', 'ex-elev-frontal', 'ex-leg-45', 'ex-tric-puller', 'ex-banco-adutor', 'ex-agach-gaiola', 'ex-voo-45', 'ex-infra-prancha'],
    B: ['ex-remad-artic', 'ex-roscamartelo-90', 'ex-b5', 'ex-banco-abdutor', 'ex-burrinho', 'ex-roscamartelo', 'ex-b1', 'ex-ponteventral']
  },
  perda_ponderal_media: {
    A: ['ex-hack', 'ex-extensor', 'ex-remad-artic', 'ex-rosca-direta-barra-livre', 'ex-rosca-direta-cross', 'ex-remada-cavalinho', 'ex-banco-adutor', 'ex-banco-abdutor', 'ex-supra-banco'],
    B: ['ex-mesa-flexora', 'ex-panturrilha-livre', 'ex-flexao-quadril', 'ex-triceps-corda', 'ex-supino-reto', 'ex-desenvolvimento-ombro-halter', 'ex-elev-frontal', 'ex-supra-banco'],
    ae: { tipo: 'Geral', vel: '---', tempo: '20' }
  },
  hipertrofia_medio_ii: {
    A: ['ex-supino-reto-halteres', 'ex-a4', 'ex-a1', 'ex-agach-guiado', 'ex-extensor', 'ex-desenvolvimento-frente', 'ex-triceps-corda', 'ex-triceps-palmar'],
    B: ['ex-puxada-supinada', 'ex-fly-inverso', 'ex-remada-cavalinho', 'ex-b5', 'ex-mesa-flexora', 'ex-rosca-direta-barra-livre', 'ex-b4', 'ex-a8']
  },
  perda_ponderal_media_ii: {
    A: ['ex-leg-45', 'ex-panturrilha-leg-45', 'ex-elevacao-joelho', 'ex-supino-45', 'ex-triceps-testa-barra-h', 'ex-desenvolvimento-barra', 'ex-b6', 'ex-b8'],
    B: ['ex-b5', 'ex-remada-unilateral', 'ex-pull-down', 'ex-roscott-unilateral', 'ex-rosca-direta-cross', 'ex-fly-inverso', 'ex-supra-solo', 'ex-extensao-lombar'],
    ae: { tipo: 'Geral', vel: '---', tempo: '20' }
  }
};

export function applyTemplate(db, templateKey) {
  const tpl = TEMPLATES_PRONTOS[templateKey];
  if (!tpl) {
    console.warn('[applyTemplate] Template não encontrado:', templateKey);
    showToast('Template não encontrado: ' + templateKey, 'error');
    return;
  }

  db.fichas.A = [...tpl.A];
  db.fichas.B = [...tpl.B];

  if (tpl.ae) {
    db.aerobicos.A = { ...tpl.ae };
    db.aerobicos.B = { ...tpl.ae };
  } else {
    db.aerobicos.A = null;
    db.aerobicos.B = null;
  }

  startNewCycle(db, 'Template Aplicado');

  saveDB(db);
  renderMontar(db);
  renderFicha(db);
  showToast('Template aplicado com sucesso!', 'success');
}


// ============================================================
// SUB-ABAS DE CUSTOMIZAÇÃO (MOVIDAS DE PERFIL > PERSONALIZAR)
// As 5 sub-abas abaixo agora vivem em Treinos > Exercícios e usam
// auto-save (cada clique aplica imediatamente).
// ============================================================

export function initExerciciosCustomSubTabs(db) {
  const root = document.getElementById('tab-exercicios');
  if (!root) return;

  _initItensMagicos(root, db);
  _initEmotes(root, db);
  _initSkinsTorre(root, db);
  _initEstandartes(root, db);
  _initMaestriasCustomizacao(root, db);
}

// ---- Itens Mágicos (ex-Cartão de Visita / Banner) ----
function _initItensMagicos(root, db) {
  const container = root.querySelector('#subtab-itens-magicos');
  if (!container) return;
  const grid = container.querySelector('#bannerGrid');
  if (!grid) return;

  grid.innerHTML = _renderBanners(db);

  grid.querySelectorAll('.banner-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Desbloqueie este banner primeiro!', 'info'); return; }
      grid.querySelectorAll('.banner-option').forEach(b => b.classList.remove('banner-option--active'));
      btn.classList.add('banner-option--active');

      const key = btn.dataset.banner;
      db.profileCustomization = { ...(db.profileCustomization || {}), banner: key };
      saveDB(db);
      applyProfileCustomization(db);
      showToast('Banner atualizado!', 'success');
    });
  });
}

// ---- Emotes (ex-Progresso: Barras de XP + Skin do Cronômetro) ----
function _initEmotes(root, db) {
  const container = root.querySelector('#subtab-emotes');
  if (!container) return;

  const barGrid = container.querySelector('#barSkinGrid');
  if (barGrid) barGrid.innerHTML = _renderBarSkins(db);

  const timerGrid = container.querySelector('#timerSkinGrid');
  if (timerGrid) timerGrid.innerHTML = _renderTimerSkins(db);

  if (barGrid) {
    barGrid.querySelectorAll('.bar-skin-option[data-bar-skin]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.locked) { showToast('Desbloqueie este estilo primeiro!', 'info'); return; }
        barGrid.querySelectorAll('.bar-skin-option').forEach(b => b.classList.remove('bar-skin-option--active'));
        btn.classList.add('bar-skin-option--active');

        const key = btn.dataset.barSkin;
        db.profileCustomization = { ...(db.profileCustomization || {}), barSkin: key };
        saveDB(db);
        document.body.setAttribute('data-bar-skin', key);
        _applyBarSkinToDOM(key);
        showToast('Estilo de barra atualizado!', 'success');
      });
    });
  }

  if (timerGrid) {
    timerGrid.querySelectorAll('.bar-skin-option[data-timer-skin]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.locked) { showToast('Skin de cronômetro bloqueada!', 'warning'); return; }
        timerGrid.querySelectorAll('.bar-skin-option').forEach(b => b.classList.remove('bar-skin-option--active'));
        btn.classList.add('bar-skin-option--active');

        const key = btn.dataset.timerSkin;
        db.profileCustomization = { ...(db.profileCustomization || {}), timerSkin: key };
        saveDB(db);
        localStorage.setItem('timerStyle', key);
        showToast('Estilo de cronômetro atualizado!', 'success');
      });
    });
  }
}

// ---- Skins de Torre (ex-Skin dos Cards de Exercício) ----
function _initSkinsTorre(root, db) {
  const container = root.querySelector('#subtab-torres');
  if (!container) return;
  const grid = container.querySelector('#cardSkinGrid');
  if (!grid) return;

  grid.innerHTML = _renderCardSkins(db);

  grid.querySelectorAll('.card-skin-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Desbloqueie este skin primeiro!', 'info'); return; }
      grid.querySelectorAll('.card-skin-option').forEach(b => b.classList.remove('card-skin-option--active'));
      btn.classList.add('card-skin-option--active');

      const key = btn.dataset.cardSkin;
      db.profileCustomization = { ...(db.profileCustomization || {}), cardSkin: key };
      saveDB(db);
      document.body.setAttribute('data-card-skin', key);
      showToast('Skin de card atualizada!', 'success');
    });
  });
}

// ---- Estandartes (ex-Emblemas do Perfil) ----
function _initEstandartes(root, db) {
  const container = root.querySelector('#subtab-estandartes');
  if (!container) return;
  const grid = container.querySelector('#emblemGallery');
  if (!grid) return;

  grid.innerHTML = _renderEmblemas(db);

  grid.querySelectorAll('.emblem-gallery__item').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Emblema bloqueado!', 'info'); return; }
      const actives = grid.querySelectorAll('.emblem-gallery__item--active');
      if (btn.classList.contains('emblem-gallery__item--active')) {
        btn.classList.remove('emblem-gallery__item--active');
      } else {
        if (actives.length >= 3) { showToast('Máximo de 3 estandartes!', 'info'); return; }
        btn.classList.add('emblem-gallery__item--active');
      }

      const selected = [...grid.querySelectorAll('.emblem-gallery__item--active')].map(e => e.dataset.emblem);
      db.selectedEmblems = selected;
      saveDB(db);
      _renderProfileEmblems(db);
      showToast('Estandartes atualizados!', 'success');
    });
  });
}

// ---- Maestrias (ex-Emblemas: Identificação + Moldura de Avatar) ----
function _initMaestriasCustomizacao(root, db) {
  const container = root.querySelector('#subtab-maestrias');
  if (!container) return;

  const selectedEmblemId = db.profileCustomization?.mainEmblem || 'prestigio-1';
  const isPulsing = db.profileCustomization?.mainEmblemPulse !== false;

  // Emblema de Identificação — grid
  const identityGrid = container.querySelector('#identityEmblemGrid');
  if (identityGrid) identityGrid.innerHTML = _renderIdentityEmblems(db, selectedEmblemId);

  // Renderiza preview e re-anexa o handler do Equipar (essencial, pois
  // cada clique no grid re-renderiza o botão).
  const renderPreview = (emblemId) => {
    const identityPreview = container.querySelector('#identityEmblemPreview');
    if (!identityPreview) return;
    const emblem = IDENTITY_EMBLEMS.find(e => e.id === emblemId);
    const pulseNow = container.querySelector('#pulseToggle')?.checked ?? true;
    identityPreview.innerHTML = _renderIdentityEmblemPreview(emblem, pulseNow);
    _bindEquiparEmblema(container, db);
  };
  renderPreview(selectedEmblemId);

  // Pulse toggle
  const pulseToggle = container.querySelector('#pulseToggle');
  if (pulseToggle) {
    pulseToggle.checked = isPulsing;
    _updatePulseToggleUI(container, isPulsing);
    pulseToggle.addEventListener('change', () => {
      const checked = pulseToggle.checked;
      _updatePulseToggleUI(container, checked);
      const wrapper = container.querySelector('#previewImageWrapper');
      if (wrapper) {
        if (checked) wrapper.classList.add('animate-pulse-emblem');
        else wrapper.classList.remove('animate-pulse-emblem');
      }
      db.profileCustomization = { ...(db.profileCustomization || {}), mainEmblemPulse: checked };
      saveDB(db);
      applyProfileCustomization(db);
    });
  }

  // Seleção de emblema de identificação
  container.querySelectorAll('[data-identity-emblem]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-identity-emblem]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPreview(btn.dataset.identityEmblem);
    });
  });

  // Moldura de Avatar
  const frameGrid = container.querySelector('#frameGrid');
  if (frameGrid) frameGrid.innerHTML = _renderFrames(db);

  frameGrid?.querySelectorAll('.frame-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.locked) { showToast('Moldura bloqueada!', 'info'); return; }
      frameGrid.querySelectorAll('.frame-option').forEach(f => f.classList.remove('frame-option--active'));
      btn.classList.add('frame-option--active');

      const key = btn.dataset.frame || null;
      db.profileCustomization = { ...(db.profileCustomization || {}), avatarFrame: key };
      saveDB(db);
      applyProfileCustomization(db);
      showToast('Moldura atualizada!', 'success');
    });
  });
}

// Re-anexa o handler do botão Equipar (chamado após cada re-render do preview,
// já que o botão antigo é descartado e substituído por um novo).
function _bindEquiparEmblema(container, db) {
  const equipBtn = container.querySelector('#btnEquiparEmblema');
  if (!equipBtn) return;
  equipBtn.onclick = () => {
    const active = container.querySelector('[data-identity-emblem].active');
    const emblemId = active ? active.dataset.identityEmblem : 'prestigio-1';
    const pulseChecked = container.querySelector('#pulseToggle')?.checked ?? true;
    db.profileCustomization = {
      ...(db.profileCustomization || {}),
      mainEmblem: emblemId,
      mainEmblemPulse: pulseChecked,
    };
    saveDB(db);
    applyProfileCustomization(db);
    showToast('Emblema de identificação equipado!', 'success');
  };
}



