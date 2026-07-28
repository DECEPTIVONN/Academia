/**
 * loader.js — Carregador de Fragmentos HTML Modulares
 * 
 * Carrega seções do HTML de forma paralela via fetch(),
 * injetando cada fragmento no container correspondente.
 * Isso permite que o treino.html permaneça leve (~300 linhas)
 * enquanto cada seção vive em seu próprio arquivo.
 * 
 * Uso: import { loadAllSections } from './loader.js';
 *      await loadAllSections();
 */

const BASE = 'componentes/secoes/';

const SECTION_MAP = [
  { file: 'ficha.html',     target: '#fichaOverlayScroll' },
  { file: 'treinos.html',   target: '[data-section="treinos"]' },
  { file: 'progresso.html', target: '[data-section="progresso"]' },
  { file: 'dashboard.html', target: '[data-section="dashboard"]' },
  { file: 'perfil.html',    target: '#perfilOverlayScroll' },
  { file: 'modais.html',    target: '#modais-container' },
];

/**
 * Carrega um fragmento HTML e injeta no container de destino.
 * @param {string} file - Nome do arquivo na pasta componentes/secoes/
 * @param {string} targetSelector - Seletor CSS do container alvo
 */
async function loadFragment(file, targetSelector) {
  const container = document.querySelector(targetSelector);
  if (!container) {
    console.warn(`[Loader] Container não encontrado: ${targetSelector}`);
    return;
  }

  try {
    const res = await fetch(BASE + file);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar ${file}`);
    const html = await res.text();
    container.innerHTML = html;
  } catch (err) {
    console.error(`[Loader] Falha ao carregar ${file}:`, err);
    container.innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444;">Erro ao carregar seção. Recarregue a página.</div>`;
  }
}

/**
 * Carrega TODOS os fragmentos HTML em paralelo.
 * Deve ser chamado ANTES de qualquer inicialização de JS que dependa do DOM.
 * @returns {Promise<void>}
 */
export async function loadAllSections() {
  await Promise.all(
    SECTION_MAP.map(({ file, target }) => loadFragment(file, target))
  );
}
