#!/usr/bin/env node
/**
 * doc-lint — verifica se os caminhos citados em Diretrizes/system_map.json existem de fato,
 * e valida coerência do DESIGN.md §15, anti-histórico nos purposes e tamanho do CHANGELOG.
 *
 * Por que existe: um índice com caminho errado é pior do que não ter índice (o erro é
 * silencioso — foi assim que o system_map passou a apontar para a versão legada por
 * várias sessões). Este script é a "verificação de sanidade" do índice.
 *
 * Uso:  node tools/doc-lint.mjs        (ou: npm run lint:docs)
 * Saída: 0 = tudo certo · 1 = há erro. Somente leitura.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAP = path.resolve(process.argv[2] || path.join(ROOT, 'Diretrizes', 'system_map.json'));

const ROOTS = ['src-app', 'Legacy', 'www', 'Diretrizes', 'Planos', 'Referências', 'Referencias',
  'Assets', 'style', 'JS', 'componentes', 'cache', 'android', 'tools'];
const LEGACY_ONLY = ['JS', 'style', 'componentes', 'Assets', 'cache'];
const SRC_RELATIVE = ['styles', 'components', 'features', 'core', 'lib', 'store', 'hooks', 'legacy-style'];

const PATH_RE = new RegExp('(?:^|[\\s(`\'"+\\[])((?:' + ROOTS.join('|') + ')[A-Za-z0-9_./@\\u00C0-\\u00FF-]*)', 'g');
const ANCHOR_RE = /[.#][A-Za-z_][\w-]*/g;   // #id ou .classe

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'));

/** Expande {a,b,c} em várias strings. */
function expandBraces(s) {
  const m = s.match(/\{([^{}]*)\}/);
  if (!m) return [s];
  return m[1].split(',').flatMap(part => expandBraces(s.replace(m[0], part.trim())));
}

/** Normaliza um token de caminho; devolve null se não for verificável. */
function clean(tok) {
  let t = tok.replace(/[.,;:)`'"]+$/, '').replace(/^-+/, '');
  if (!t) return null;
  if (/[<>{}[\]\\|*?…$#]/.test(t)) return null;
  if (t.includes('..')) return null;
  if (!t.includes('/')) return null;
  if (!t.endsWith('/') && !/\.[A-Za-z0-9]+$/.test(t)) return null;
  return t;
}

const found = [];
function add(origin, p) { if (p) found.push({ origin, p }); }
let removedCount = 0;

/** Percorre um valor e extrai candidatos a caminho. */
function scan(origin, value) {
  if (typeof value === 'string') {
    if (/\[REMOVIDO/i.test(value)) { removedCount++; return; }
    for (const m of value.matchAll(PATH_RE)) {
      for (const ex of expandBraces(m[1])) add(origin, clean(ex));
    }
  } else if (Array.isArray(value)) {
    value.forEach(v => scan(origin, v));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (['file', 'path'].includes(k) && typeof v === 'string') {
        if (/\[REMOVIDO/i.test(v)) removedCount++; else add(origin, clean(v));
      } else scan(origin + '.' + k, v);
    }
  }
}

// =============== SCAN DE CAMINHOS (system_map.json) ===============
scan('entry_points', map.entry_points);
scan('system_modules', map.system_modules);
scan('html_fragments', map.html_fragments);
scan('components', map.components);
scan('styling_manifest', map.styling_manifest);
scan('assets', map.assets);
scan('documentation', map.documentation);
scan('plans', map.plans);
scan('react_app', map.react_app);
scan('ia_quick_reference', map.ia_quick_reference);
scan('tooling', map.tooling);

// =============== VEREDITO DE CAMINHOS ===============
const seen = new Map();
const errs = [], legacyPrefix = [], srcPrefix = [];
const ok = new Set();

for (const { origin, p } of found) {
  const key = origin.split('.').slice(0, 2).join('.') + '|' + p;
  if (seen.has(key)) continue;
  seen.set(key, true);

  const abs = path.join(ROOT, p);
  if (fs.existsSync(abs)) { ok.add(p); continue; }
  const bare = p.split('/')[0];
  if (LEGACY_ONLY.includes(bare) && fs.existsSync(path.join(ROOT, 'Legacy', p))) { legacyPrefix.push(p); continue; }
  if (SRC_RELATIVE.includes(bare) && fs.existsSync(path.join(ROOT, 'src-app', 'src', p))) { srcPrefix.push(p); continue; }
  errs.push({ origin, p });
}

// =============== NOVOS CHECKS ===============

// 1) DESIGN.md §15: âncoras vivas + caminhos existem
const designErrs = [], designWarns = [];
function checkDesignSection15() {
  const designPath = path.join(ROOT, 'Diretrizes', 'DESIGN.md');
  if (!fs.existsSync(designPath)) return;
  const lines = fs.readFileSync(designPath, 'utf8').split(/\r?\n/);
  let inTable = false;
  for (const line of lines) {
    if (/^##\s+15\./.test(line)) { inTable = true; continue; }
    if (inTable && /^##\s+\d/.test(line)) break;
    if (!inTable || !/^\|\s*\*\*/.test(line)) continue;

    const cols = line.split('|').map(s => s.trim());
    if (cols.length < 6) continue;
    const area = cols[1].replace(/\*\*/g, '');
    const compCell = cols[2] + ' ' + cols[3];
    const anchorCell = cols[4];

    // Extrai arquivos da célula Componente/CSS
    const compFiles = [];
    let lastDir = '';
    for (const m of compCell.matchAll(/`([^`]+)`/g)) {
      for (const ex of expandBraces(m[1])) {
        let t = ex.replace(/\(.*?\)/g, '').trim();
        if (!t || /^[.#-]/.test(t) || t.includes(' ')) continue;
        if (!/\.(css|tsx|ts|html|js)$/.test(t) && !t.endsWith('/*') && !t.endsWith('/')) continue;
        t = t.replace(/\/\*$/, '');
        if (!t.includes('/') && lastDir && !/^index\.html$/.test(t)) t = lastDir + '/' + t;
        else if (t.includes('/') && !/\.(css|tsx|ts|html|js)$/.test(t)) lastDir = t;
        else if (t.includes('/')) lastDir = t.slice(0, t.lastIndexOf('/'));
        let abs = path.join(ROOT, 'src-app', 'src', t);
        if (t === 'index.html') abs = path.join(ROOT, 'src-app', 'index.html');
        if (fs.existsSync(abs)) compFiles.push(abs);
      }
    }

    // Extrai âncoras (#id .classe)
    const anchors = [...anchorCell.matchAll(ANCHOR_RE)].map(m => m[0].slice(1));
    if (!anchors.length) continue;

    // Lê conteúdo dos arquivos citados
    const texts = compFiles.flatMap(f => {
      try {
        if (fs.statSync(f).isDirectory()) {
          return fs.readdirSync(f, { recursive: true })
            .map(n => path.join(f, n))
            .filter(n => /\.(tsx|ts|css|html)$/.test(n) && fs.statSync(n).isFile())
            .map(n => { try { return fs.readFileSync(n, 'utf8'); } catch { return ''; } });
        }
        return [fs.readFileSync(f, 'utf8')];
      } catch { return ['']; }
    });

    const missingAnchors = anchors.filter(a => !texts.some(t => t.includes(a)));
    if (missingAnchors.length) {
      designErrs.push({ area, missing: missingAnchors });
    }
  }
}
checkDesignSection15();

// 2) Anti-histórico: purposes com ≥3 refs vX.Y (ignora [REMOVIDO])
const histErrs = [];
const vxyRe = /v\d+\.\d+/g;
for (const e of map.react_app.entry_points) {
  if (/\[REMOVIDO/i.test(e.file)) continue;
  const n = (e.purpose.match(vxyRe) || []).length;
  if (n >= 3) histErrs.push({ file: e.file, refs: n });
}
for (const s of map.react_app.styles) {
  const n = (s.match(vxyRe) || []).length;
  if (n >= 3) histErrs.push({ file: 'styles[]', refs: n, purpose: s.slice(0, 60) });
}

// 3) ia_quick_reference: cada entrada cita ≥1 caminho + ≥1 âncora
const qrefErrs = [];
for (const [k, v] of Object.entries(map.ia_quick_reference.atual_src_app)) {
  const paths = [...v.matchAll(PATH_RE)].map(m => clean(m[1])).filter(Boolean);
  const anchors = [...v.matchAll(ANCHOR_RE)].map(m => m[0].slice(1));
  if (!paths.length) qrefErrs.push({ key: k, msg: 'sem caminho citado' });
  if (!anchors.length) qrefErrs.push({ key: k, msg: 'sem âncora (#id/.classe) citada' });
}
for (const [k, v] of Object.entries(map.ia_quick_reference.legado_referencia)) {
  const paths = [...v.matchAll(PATH_RE)].map(m => clean(m[1])).filter(Boolean);
  if (!paths.length) qrefErrs.push({ key: k + ' (legado)', msg: 'sem caminho citado' });
}

// 4) CHANGELOG tamanho
const changelogPath = path.join(ROOT, 'Diretrizes', 'CHANGELOG.md');
const changelogSize = fs.existsSync(changelogPath) ? fs.statSync(changelogPath).size : 0;
const CHANGELOG_WARN_KB = 400;
const CHANGELOG_ERR_KB = 500;
let changelogWarn = false, changelogErr = false;
if (changelogSize > CHANGELOG_WARN_KB * 1024) changelogWarn = true;
if (changelogSize > CHANGELOG_ERR_KB * 1024) changelogErr = true;

// =============== OUTPUT ===============
const total = seen.size;
console.log(`doc-lint — ${path.relative(ROOT, MAP)} @ ${map.version}`);
console.log(`  caminhos distintos verificados: ${total}`);
console.log(`  OK: ${ok.size}`);
console.log(`  [prefixo legado] existe só sob Legacy/: ${legacyPrefix.length}`);
console.log(`  [origem src] existe só sob src-app/src/: ${srcPrefix.length}`);
console.log(`  [removido] marcado no índice (esperado): ${removedCount}`);

if (legacyPrefix.length) {
  console.log('\n  [prefixo legado] — considere prefixar com "Legacy/" (informativo, não falha):');
  for (const p of legacyPrefix.slice(0, 12)) console.log('    - ' + p);
  if (legacyPrefix.length > 12) console.log(`    … +${legacyPrefix.length - 12}`);
}
if (srcPrefix.length) {
  console.log('\n  [origem src] — caminho relativo a src-app/src/ (informativo, não falha):');
  for (const p of srcPrefix.slice(0, 12)) console.log('    - ' + p);
}

let hasErr = errs.length > 0 || designErrs.length > 0 || qrefErrs.length > 0 || changelogErr;

if (designErrs.length) {
  console.log('\n  ERRO — DESIGN.md §15: âncora citada não encontrada nos arquivos declarados:');
  for (const { area, missing } of designErrs) console.log(`    - ${area}: ${missing.join(', ')}`);
}
if (histErrs.length) {
  console.log('\n  AVISO — anti-histórico: purpose com ≥3 referências vX.Y (histórico pertence ao CHANGELOG):');
  for (const { file, refs, purpose } of histErrs) console.log(`    - ${file} (${refs} refs)` + (purpose ? ': ' + purpose : ''));
}
if (qrefErrs.length) {
  console.log('\n  ERRO — ia_quick_reference: entradas sem caminho/âncora citados:');
  for (const { key, msg } of qrefErrs) console.log(`    - ${key}: ${msg}`);
}
if (changelogWarn || changelogErr) {
  console.log('\n  ' + (changelogErr ? 'ERRO' : 'AVISO') + ` — CHANGELOG.md: ${(changelogSize/1024).toFixed(0)} KB (limite aviso ${CHANGELOG_WARN_KB} KB, erro ${CHANGELOG_ERR_KB} KB)`);
}

if (errs.length) {
  console.log('\n  ERROS — caminho citado mas inexistente:');
  for (const { origin, p } of errs) console.log(`    - [${origin}] ${p}`);
}

if (hasErr) {
  console.log('\ndoc-lint: FALHOU.');
  process.exit(1);
}
console.log('\ndoc-lint: OK — todos os caminhos citados existem, §15 coerente, purposes sem histórico excessivo, CHANGELOG dentro do limite.');