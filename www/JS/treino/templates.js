/**
 * templates.js
 * 
 * Centraliza toda a geração de HTML via Template Strings.
 * Segue a Suggestion 4 para componentização e manutenibilidade.
 */

// ---- FICHA DO DIA ----

export function fichaDeckCard(ex, i, checked, badgeCls, imgHtml, seriesButtons) {
  return `
    <div class="deck-card stagger-item card-${ex.grupoMuscular} ${checked ? 'row-done' : ''}" data-id="${ex.id}" draggable="false" style="--item-index: ${i}">
      <div class="deck-card-header">${ex.grupoMuscular}</div>
      <div class="deck-card-img">${imgHtml}</div>
      <div class="deck-card-info">
        <div class="deck-card-name">${ex.nome}</div>
        <div class="deck-card-meta-row" style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; width: 100%;">
          <span class="deck-card-vol">Séries: ${ex.series}×${ex.repeticoes}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn-note-toggle-deck ${ex.anotacoes ? 'has-note' : ''}" data-id="${ex.id}" title="${ex.anotacoes || 'Adicionar nota'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                  <path d="M10 9H8"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
              </svg>
            </button>
            <div class="deck-check-wrap">
              <input type="checkbox" class="check-input" id="chk-deck-${ex.id}" data-id="${ex.id}" ${checked ? 'checked' : ''}>
              <label class="check-label" for="chk-deck-${ex.id}"><span class="check-mark">✓</span></label>
            </div>
          </div>
        </div>
      </div>
      <div class="deck-card-actions">
        <div class="series-wrap-deck" style="display: flex; align-items: center; justify-content: center; width: 100%; gap: 6px; padding: 4px 0 8px 0;">
          ${seriesButtons.join('')}
        </div>
      </div>
    </div>`;
}

export function fichaGridCard(ex, i, checked, badgeCls, imgHtml, seriesButtons, cargaHtml) {
  return `
    <div class="deck-card stagger-item card-${ex.grupoMuscular} ${checked ? 'row-done' : ''}" data-id="${ex.id}" style="--item-index: ${i}">
      <div class="deck-card-header">${ex.grupoMuscular}</div>
      <div class="deck-card-img">${imgHtml}</div>
      <div class="deck-card-info">
        <div class="deck-card-name">${ex.nome}</div>
        <div class="deck-card-meta-row" style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; width: 100%;">
          <span class="deck-card-vol">Séries: ${ex.series}×${ex.repeticoes}${cargaHtml}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button class="btn-note-toggle-deck ${ex.anotacoes ? 'has-note' : ''}" data-id="${ex.id}" title="${ex.anotacoes || 'Adicionar nota'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                  <path d="M10 9H8"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
              </svg>
            </button>
            <div class="deck-check-wrap">
              <input type="checkbox" class="check-input" id="chk-grid-${ex.id}" data-id="${ex.id}" ${checked ? 'checked' : ''}>
              <label class="check-label" for="chk-grid-${ex.id}"><span class="check-mark">✓</span></label>
            </div>
          </div>
        </div>
      </div>
      <div class="deck-card-actions">
        <div class="series-wrap-deck" style="display: flex; align-items: center; justify-content: center; width: 100%; gap: 6px; padding: 4px 0 8px 0;">
          ${seriesButtons.join('')}
        </div>
      </div>
    </div>`;
}

export function fichaTableRow(ex, i, checked, badgeCls, imgHtml, seriesButtons, cargaHtml) {
  const gridItems = [...seriesButtons];
  while (gridItems.length < 3) {
    gridItems.push('<div class="empty-grid-cell" style="width:30px; height:30px;"></div>');
  }
  const noteBtn = `
    <button class="btn-note-toggle-table ${ex.anotacoes ? 'has-note' : ''}" data-id="${ex.id}" title="${ex.anotacoes || 'Adicionar nota'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
            <path d="M10 9H8"/>
            <path d="M16 13H8"/>
            <path d="M16 17H8"/>
        </svg>
    </button>`;
  gridItems.splice(3, 0, noteBtn);

  return `
    <tr class="stagger-item ${checked ? 'row-done' : ''}" data-id="${ex.id}" style="--item-index: ${i}">
      <td><div class="row-num">${i + 1}</div></td>
      <td><span class="ex-name">${ex.nome}</span></td>
      <td>${imgHtml}</td>
      <td>
        <div class="vol-text">${ex.series}×${ex.repeticoes}<span>REPS</span>${cargaHtml}</div>
        <div class="series-grid-table">
          ${gridItems.join('')}
        </div>
      </td>
      <td>
        <div class="check-wrap">
          <input type="checkbox" class="check-input" id="chk-${ex.id}" data-id="${ex.id}" ${checked ? 'checked' : ''}>
          <label class="check-label" for="chk-${ex.id}"><span class="check-mark">✓</span></label>
        </div>
      </td>
    </tr>`;
}

export function cardioDeckCard(ae, aeId, checked, i) {
  return `
    <div class="ex-card ex-card-aerobico stagger-item ${checked ? 'row-done' : ''}" data-id="${aeId}" draggable="false" style="--item-index: ${i}">
      <div class="ae-card-header">
          <div class="ae-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
          </div>
          <div class="ae-label">CARDIO</div>
      </div>
      <div class="ex-card-body">
        <div class="ae-card-type">${ae.tipo}</div>
        <div class="ae-card-stats">
          <div class="ae-stat-box">
              <span class="ae-stat-val">${ae.vel || '--'}</span>
              <span class="ae-stat-unit">KM/H</span>
          </div>
          <div class="ae-stat-divider"></div>
          <div class="ae-stat-box">
              <span class="ae-stat-val">${ae.tempo || '--'}</span>
              <span class="ae-stat-unit">MIN</span>
          </div>
        </div>
        <div class="check-wrap ae-check-wrap">
          <input type="checkbox" class="check-input" id="chk-deck-${aeId}" data-id="${aeId}" ${checked ? 'checked' : ''}>
          <label class="check-label" for="chk-deck-${aeId}"><span class="check-mark">✓</span></label>
          <span class="ae-check-text">CONCLUIR CARDIO</span>
        </div>
      </div>
    </div>`;
}

// ---- TREINOS / MONTAR ----

export function treinosGridCard(ex, badgeCls, imgHtml, cargaHtml) {
  return `
    <div class="ex-card" data-id="${ex.id}">
      <div class="ex-card-img">${imgHtml}</div>
      <div class="ex-card-body">
        <div class="ex-card-name">${ex.nome}</div>
        <div class="ex-card-meta">
          <span class="${badgeCls}">${ex.grupoMuscular}</span>
          <span class="ex-card-vol">${ex.series}×${ex.repeticoes}${cargaHtml}</span>
        </div>
        <div class="ex-card-actions">
          <button class="btn-ex-edit" data-id="${ex.id}" style="display:inline-flex; align-items:center; gap:4px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg> Editar
          </button>
          <button class="btn-ex-del" data-id="${ex.id}" style="display:inline-flex; align-items:center; gap:4px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg> Excluir
          </button>
        </div>
      </div>
    </div>`;
}

export function treinosCollectionCard(ex, already) {
  return `
    <div class="deck-card collection-card card-${ex.grupoMuscular} ${already ? 'in-deck' : ''}" 
         data-id="${ex.id}" 
         draggable="${!already}"
         ondragstart="event.dataTransfer.setData('text/plain', '${ex.id}')">
        <div class="deck-card-header">${ex.grupoMuscular}</div>
        <div class="deck-card-img">
            ${ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">` : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`}
        </div>
        <div class="deck-card-info">
            <div class="deck-card-name">${ex.nome}</div>
            <div class="deck-card-level-row" style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%;">
                <span class="deck-card-level">${ex.series} séries</span>
                <button class="btn-ex-edit btn-ex-edit-inline" data-id="${ex.id}" style="background: none; border: none; padding: 2px; cursor: pointer; color: var(--primary-light); display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;" title="Editar exercício">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="deck-card-menu">
            <div class="menu-actions-wrap">
              <button class="btn-card-action btn-ex-edit" data-id="${ex.id}" style="display:inline-flex; align-items:center; gap:4px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg> Editar
              </button>
              <button class="btn-card-action btn-ex-del" data-id="${ex.id}" style="display:inline-flex; align-items:center; gap:4px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg> Excluir
              </button>
            </div>
        </div>
    </div>`;
}

export function deckActiveSlot(ex, i, currentDeckView) {
  if (currentDeckView === 'list') {
    return `
      <div class="deck-slot list-slot" data-index="${i}">
          <div class="deck-list-item card-${ex.grupoMuscular}" data-id="${ex.id}" draggable="true" ondragstart="event.dataTransfer.setData('sourceIndex', '${i}')">
              <div class="dli-img">${ex.imagem ? `<img src="${ex.imagem}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">` : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`}</div>
              <div class="dli-info">
                  <div class="dli-name">${ex.nome}</div>
                  <div class="dli-meta">${ex.grupoMuscular} • ${ex.series}×${ex.repeticoes}</div>
              </div>
              <div class="dli-actions">
                  <button class="btn-card-action btn-card-details" data-id="${ex.id}" style="display:inline-flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                  </button>
                  <button class="btn-card-action btn-card-remove" data-id="${ex.id}" style="display:inline-flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                        <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
              </div>
          </div>
      </div>`;
  } else {
    return `
      <div class="deck-slot" data-index="${i}">
          <div class="deck-card card-${ex.grupoMuscular}" data-id="${ex.id}" draggable="true" ondragstart="event.dataTransfer.setData('sourceIndex', '${i}')">
              <div class="deck-card-header">${ex.grupoMuscular}</div>
              <div class="deck-card-img">
                  ${ex.imagem ? `<img src="${ex.imagem}" alt="${ex.nome}" onerror="this.onerror=null; this.outerHTML='<div class=&quot;premium-placeholder&quot;><i class=&quot;fas fa-dumbbell&quot;></i><span>EXERCÍCIO</span></div>';">` : `<div class="premium-placeholder"><i class="fas fa-dumbbell"></i><span>EXERCÍCIO</span></div>`}
              </div>
              <div class="deck-card-info">
                  <div class="deck-card-name">${ex.nome}</div>
                  <div class="deck-card-level">Séries: ${ex.series} × ${ex.repeticoes}</div>
              </div>
              <div class="deck-card-menu">
                  <button class="btn-card-action btn-card-details-cr" data-id="${ex.id}" style="display:inline-flex; align-items:center; gap:4px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg> Detalhes
                  </button>
                  <button class="btn-card-action btn-card-details" data-id="${ex.id}" style="display:inline-flex; align-items:center; gap:4px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg> Edição
                  </button>
                  <button class="btn-card-action btn-card-maestria-mini" data-id="${ex.id}">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="margin-right: 4px;">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg> Maestria
                  </button>
                  <button class="btn-card-action btn-card-remove" data-id="${ex.id}" style="display:inline-flex; align-items:center; gap:4px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                        <path d="M18 6 6 18M6 6l12 12"/>
                    </svg> Remover
                  </button>
              </div>
          </div>
      </div>`;
  }
}

const ROMAN_NUMERALS = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

export function deckEmptySlot(i, currentDeckView) {
  const roman = ROMAN_NUMERALS[i] || (i + 1);
  return `
    <div class="deck-slot ${currentDeckView === 'list' ? 'list-slot' : ''}" data-index="${i}">
        <div class="deck-slot-empty-ph">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="28" height="28">
                <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11"/>
                <circle cx="4" cy="12" r="1.5"/>
                <circle cx="20" cy="12" r="1.5"/>
            </svg>
            <span class="deck-slot-roman">${roman}</span>
        </div>
    </div>`;
}
