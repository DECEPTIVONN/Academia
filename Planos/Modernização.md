# Modernização — migração do site legado (HTML/CSS/JS) para React + Vite

> **Status:** plano (nada foi executado em outro projeto ainda).
> **Origem:** derivado da migração já concluída neste repositório (`Academia` → `src-app/`), que serve como implementação de referência para cada passo abaixo.
> **Aplicar em:** o outro site, que ainda usa HTML, CSS e JS vanilla.

---

## 0. Como usar este documento

1. Copie este arquivo para a raiz do projeto a ser modernizado.
2. Trabalhe **fase por fase**, sem pular a Fase 1: o legado precisa estar congelado antes de qualquer conversão.
3. Ao fim de cada fase, marque o critério de aceite. Se o critério não fecha, a fase não terminou.
4. Sempre que houver dúvida de "como ficou no projeto de referência", consulte `Academia/src-app/` — a estrutura descrita aqui é a mesma.

---

## 1. Objetivo, escopo e regras invioláveis

**Objetivo:** trocar a stack (HTML/CSS/JS vanilla → React + TypeScript + Vite) **sem alterar o produto**: mesma aparência, mesmas telas, mesmo comportamento.

| # | Regra | Por quê |
|---|-------|---------|
| R1 | **O design é intocável.** Nenhuma linha de CSS legado é reescrita ou "melhorada" durante a conversão. | O CSS legado é a fonte da verdade visual. Qualquer diferença de pixel é bug de HTML/estado, não convite a redesenhar. |
| R2 | **`Legacy/` é somente leitura.** O código antigo é referência e plano B, nunca destino de correção. | Permite comparar lado a lado e voltar atrás em qualquer ponto. |
| R3 | **Supabase e OAuth ficam para depois.** Nada de login, sessão ou tabelas remotas nesta fase. | Reduz o escopo e evita travar a conversão de UI por decisões de backend. |
| R4 | **PWA é entregável desta fase**, não "depois". | Instalação e offline mudam decisões de build (assets, cache, rotas); retrofitar custa caro. |
| R5 | **Classes, IDs e `data-*` do HTML legado são contrato.** | Todo o CSS legado depende deles. Renomear "para ficar mais React" quebra o layout silenciosamente. |
| R6 | **Dados do usuário sobrevivem.** Se o legado grava em `localStorage`/IndexedDB, a versão nova lê e migra. | O usuário não pode "perder tudo" ao abrir a versão nova. |

---

## 2. Estrutura de destino

```
<projeto>/
├─ Legacy/                      # HTML/CSS/JS originais, congelados (R2)
│  ├─ index.html, *.html
│  ├─ Style/  (ou CSS/)
│  ├─ JS/
│  ├─ Assets/
│  ├─ sw.js  manifest.json      # só referência; não são servidos
│  └─ README.md                 # aviso: NÃO EDITAR
├─ src-app/                     # aplicação moderna
│  ├─ index.html                # shell: splash, meta, #root
│  ├─ package.json
│  ├─ vite.config.ts            # React + PWA + aliases
│  ├─ tsconfig.json / tsconfig.app.json / tsconfig.node.json
│  ├─ public/                   # assets com caminho estável (/assets/...)
│  │  ├─ assets/                # imagens, ícones, mídia
│  │  └─ vendor/                # fontes locais + fonts.css
│  └─ src/
│     ├─ main.tsx               # bootstrap + ordem dos CSS
│     ├─ App.tsx                # rotas e layout
│     ├─ legacy-style/          # ESPELHO 1:1 do CSS legado
│     ├─ styles/
│     │  ├─ legacy.css          # @import do espelho, na ordem original
│     │  ├─ globals.css         # reset/tipografia nova
│     │  ├─ design-tokens.css   # variáveis novas
│     │  ├─ shell.css           # layout da casca (navbar, footer, rotas)
│     │  ├─ modal-motion.css    # animações de modal
│     │  └─ mobile-fit.css      # correções de tela estreita
│     ├─ features/<tela>/       # um diretório por tela/seção
│     ├─ components/            # peças reutilizáveis
│     ├─ store/                 # estado global (zustand)
│     ├─ lib/                   # helpers puros (pwa, fullscreen, toast…)
│     ├─ hooks/
│     └─ types/
├─ tools/doc-lint.mjs           # valida caminhos da documentação
├─ Diretrizes/                  # CHANGELOG, system_map, design notes
├─ package.json                 # scripts delegando com --prefix src-app
└─ vercel.json                  # opcional (config real fica no painel)
```

---

## 3. Fase 0 — Inventário do legado (antes de mexer em qualquer arquivo)

Levante, por escrito, tudo o que existe. Sem esse mapa, a conversão vira adivinhação.

```bash
# páginas
find . -maxdepth 2 -name "*.html" -not -path "./node_modules/*"
# css e a ORDEM em que cada página carrega (isso vira o legacy.css)
for f in $(find . -name "*.html" -not -path "./node_modules/*"); do
  echo "== $f"; grep -oE '<link[^>]+href="[^"]+\.css[^"]*"' "$f"
done
# scripts
grep -rn "<script" --include="*.html" . | grep -v node_modules
# estado persistido
grep -rn "localStorage\|sessionStorage\|indexedDB\|openDatabase" --include="*.js" . | grep -v node_modules
# pontos globais (viram store/hooks)
grep -rn "window\.[a-zA-Z_]* *=" --include="*.js" . | grep -v node_modules
# chamadas externas (ficam para depois, se forem auth/backend)
grep -rn "fetch(\|XMLHttpRequest" --include="*.js" . | grep -v node_modules
# service worker antigo
grep -rn "serviceWorker" --include="*.html" --include="*.js" . | grep -v node_modules
```

**Saída esperada:** uma tabela `página → CSS usados (em ordem) → JS usados → componentes React previstos → estado que manipula`.

**Critério de aceite:** você sabe dizer, para cada tela, quais arquivos CSS a vestem e qual estado ela altera.

---

## 4. Fase 1 — Congelar o legado em `Legacy/`

```bash
mkdir -p Legacy
git mv index.html contato.html Legacy/       # todas as páginas
git mv Style Legacy/                          # ou CSS/
git mv JS Legacy/
git mv Assets Legacy/                         # se houver imagens na raiz
git mv sw.js manifest.json Legacy/            # se existirem na raiz
```

Cuidados obrigatórios nesta fase:

1. **Serviço antigo desligado.** Se havia `navigator.serviceWorker.register('sw.js')`, ele precisa deixar de rodar no deploy novo: um SW do legado no mesmo escopo briga com o do Workbox (cache duplicado, HTML antigo servido para sempre). O `Legacy/sw.js` fica só como referência.
2. **Nada de `Legacy/` no artefato de deploy.** Garanta que o build não copie essa pasta (ela está fora de `src-app/`, então por padrão já está fora).
3. **`Legacy/README.md`** com uma linha: *"Código da versão vanilla. Não editar. A versão ativa é `src-app/`."*
4. **`AGENTS.md` na raiz** (ou equivalente) registrando R1–R6, para que futuras sessões de trabalho não "consertem" o legado.

**Critério de aceite:** `Legacy/` abre por duplo clique e continua funcionando como antes; a raiz não tem mais `.html` solto.

---

## 5. Fase 2 — Scaffolding do `src-app`

`src-app/package.json` (base mínima; adicione só o que a conversão realmente usar):

```json
{
  "name": "src-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "oxlint"
  }
}
```

Dependências de referência: `react`, `react-dom`, `react-router-dom`, `zustand`, `motion`, `lucide-react`. Dev: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `oxlint`, `vite-plugin-pwa`.

`vite.config.ts` mínimo:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: 5173, host: true },
});
```

`package.json` da raiz delega, para o fluxo de trabalho ser `npm run dev` na raiz:

```json
"scripts": {
  "dev": "npm --prefix src-app run dev",
  "build": "npm --prefix src-app run build"
}
```

TypeScript: `strict: true`, `noUnusedLocals`, `jsx: react-jsx`, `moduleResolution: bundler`. `tsc -b` no build é o que impede `any` silencioso de virar bug de layout.

**Critério de aceite:** `npm run dev` sobe em `:5173` com uma página em branco controlada pelo React; `npm run build` gera `src-app/dist/index.html` sem erro.

---

## 6. Fase 3 — Espelho do CSS (é aqui que o design se mantém idêntico)

1. Copie a árvore de estilos do legado, **mantendo nomes e subpastas**:
   `Legacy/Style/**` → `src-app/src/legacy-style/**`.
2. Crie `src-app/src/styles/legacy.css` com um `@import` por arquivo, **na mesma ordem em que o HTML legado carregava os `<link>`**. Em CSS, ordem = especificidade: trocar duas linhas muda o resultado visual.
3. Importe esse agregador no `main.tsx`, antes de qualquer CSS novo.

Ordem final de importação em `main.tsx` (a mesma do projeto de referência):

```ts
import './styles/legacy.css';      // espelho, na ordem original
import './index.css';              // base/globals
import './styles/design-tokens.css';
import './styles/shell.css';       // casca nova (vence empates do legado)
import './styles/modal-motion.css';
import './styles/mobile-fit.css';  // por ÚLTIMO: só media queries de tela estreita
```

Regras de manutenção:

- **`legacy-style/` não é editado.** Correção de um bug real do legado vai em uma folha nova (`mobile-fit.css`), com seletor mais específico e justificativa no CHANGELOG.
- **Nada de `!important` novo** enquanto houver alternativa: a folha importada por último já vence empates de mesma especificidade.
- Se o projeto usar Tailwind, importe o CSS legado **pelo JS** (`import './styles/legacy.css'`), não por `@tailwind base`, para não misturar reset do Tailwind com o reset legado.
- Componentes novos podem ter CSS próprio (`features/x/x.css`), importado pelo próprio componente — nunca dentro de `legacy.css`.

**Critério de aceite:** uma página estática portada *sem nenhum CSS novo* fica visualmente indistinguível do legado no mesmo viewport.

---

## 7. Fase 4 — Assets, fontes e ícones

- Mova `Legacy/Assets/**` → `src-app/public/assets/**` **mantendo os caminhos**. O CSS legado referencia `/assets/...` em `url()`; mover para `src/assets` obrigaria a reescrever CSS (proibido por R1).
- Só o que precisa de hash do Vite (imagens do splash, por exemplo) vai para `src/assets` e é importado no TSX.
- Fontes: `public/vendor/` com os `.woff2` + um `fonts.css` apontando para caminhos relativos. Mantenha `<link rel="preconnect">` para CDNs que continuarem em uso.
- Favicons e ícones do PWA em `public/assets/icons/` com tamanhos 32, 48, 180 (apple-touch), 192, 512 e 512 maskable.

**Critério de aceite:** console sem 404 e comparação de "Network" entre legado e React sem arquivos faltando.

---

## 8. Fase 5 — Shell: `index.html` + `App.tsx`

`src-app/index.html` recebe o que era do HTML legado e não pertence a componente:

- `<html lang="pt-BR">`, `<meta viewport>` (com `interactive-widget=resizes-content` se houver teclado sobre campos fixos), `theme-color`, favicons, preloads de fonte, tags Open Graph.
- `#splashScreen` (marca + barra de progresso) e `#root`.
- Estilos do splash e do **overlay de boot** ficam **inline no `index.html`**: precisam valer antes de qualquer CSS carregar.

`App.tsx` monta o que é estrutural: roteador, layout (navbar/rodapé), tema. O splash é removido depois do primeiro render; se o bundle falhar, um `ErrorBoundary` mostra o overlay de boot em vez de tela preta.

**Critério de aceite:** primeiro paint é a splash; depois dela, a casca idêntica ao legado; derrubar a rede no meio do boot mostra o overlay, não uma tela vazia.

---

## 9. Fase 6 — Converter o JS em fatias (ordem importa)

Ordem recomendada, do mais estável ao mais volátil:

1. utilidades puras e formatadores;
2. navbar/rodapé (aparecem em todas as páginas, validam o shell);
3. tela inicial / dashboard;
4. telas de lista e detalhe;
5. modais e overlays;
6. fluxos com estado complexo (formulários longos, drag & drop, timers).

Padrões de conversão (o que costuma dar errado):

| Legado | React | Atenção |
|--------|-------|---------|
| `document.getElementById('x')` + listener | `useRef` / estado controlado | manter o **mesmo `id`** que o CSS usa |
| `el.classList.add('active')` | `className={cond ? 'active' : ''}` | o CSS legado testa classes exatas, inclusive `.row-done`, `.is-open` etc. |
| `innerHTML = '...'` | JSX | nada de HTML em string; perde eventos e quebra o CSS de filhos |
| delegação em `document` | handler no componente | evita listener duplicado a cada montagem |
| `setInterval` global | `useEffect` + cleanup | timers órfãos são a causa nº 1 de vazamento |
| variáveis globais `window.X` | `store/` (zustand) com slice por feature | não espalhe `useState` entre telas |
| `localStorage.setItem('chave', JSON)` | adapter em `core/storage.ts` **com a mesma chave e formato** | mudar chave = usuário acha que perdeu os dados; migre no boot |

Estrutura de uma feature:

```
features/<tela>/
├─ <Tela>Feature.tsx     # container: dados + composição
├─ <Tela>Header.tsx      # pedaços com nome de domínio
├─ <Tela>List.tsx
└─ <tela>.css            # só o que for NOVO; o resto vem do espelho
```

Regras de fidelidade:

- Preserve o atributo `data-id` dos elementos (o legado usa para achar itens; você vai usar em testes).
- Se o legado duplicava markup por template string, no React isso vira um componente com `map` — **mas o HTML resultante tem de ser o mesmo**.
- Se o legado tinha duas telas montadas ao mesmo tempo com IDs iguais, o React precisa separá-las por instância (nunca dois `id` iguais no DOM).

**Critério de aceite por feature:** paridade visual no viewport de referência + comportamento funcional equivalente + console limpo.

---

## 10. Fase 7 — Protocolo de paridade visual

Não existe "parece igual". Existe comparação.

1. Suba o legado estático: `npx serve Legacy -l 8080`.
2. Suba o React: `npm run dev` (`:5173`).
3. Para cada tela, capture as duas no **mesmo viewport**: 360, 390, 412, 430, 768, 1024 e 1440 px de largura.
4. Compare nesta ordem (do que mais quebra para o que menos): **estrutura/empilhamento → espaçamentos → tipografia → cores/gradientes → estados (hover, ativo, aberto, vazio) → scroll**.
5. Checklist por tela: posição de cabeçalho, largura de cards, altura de linhas, `z-index` de modais/tooltips, scroll interno, textos longos (nome grande, valor alto, data).
6. Diferença encontrada = investigar HTML/estado. **Só é permitido novo CSS** se o legado já estava quebrado (ex.: overflow em 390 px), e aí a correção vai em `mobile-fit.css` com nota no CHANGELOG.

**Critério de aceite:** nenhuma diferença visual inexplicada nas telas portadas, nos 7 viewports.

---

## 11. Fase 8 — PWA (instruções completas)

Instalação: `npm --prefix src-app i -D vite-plugin-pwa`.

### 11.1 Configuração base

```ts
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  includeManifestIcons: false,   // ver 11.4
  manifest: {
    name: 'NOME DO APP',
    short_name: 'NOME',
    description: '...',
    theme_color: '#8b5cf6',
    background_color: '#121212',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    scope: '/',
    icons: [
      { src: '/assets/icons/logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/assets/icons/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/assets/icons/logo-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: { /* 11.2 */ },
})
```

### 11.2 Precache e cache em runtime

```ts
workbox: {
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  globPatterns: ['**/*.{js,css,html,svg,ico,woff2,png}'],
  globIgnores: ['**/media/**', '**/sounds/**'],   // mídia pesada fora do precache
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api\//],
  runtimeCaching: [
    { urlPattern: /^https:\/\/fonts\.googleapis\.com\//i, handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-fonts-stylesheets-v1', cacheableResponse: { statuses: [0, 200] } } },
    { urlPattern: /^https:\/\/fonts\.gstatic\.com\//i, handler: 'CacheFirst',
      options: { cacheName: 'google-fonts-webfonts-v1', cacheableResponse: { statuses: [0, 200] },
                 expiration: { maxEntries: 40, maxAgeSeconds: 365 * 24 * 60 * 60 } } },
    { urlPattern: /\.(?:gif|webp|mp4)$/i, handler: 'CacheFirst',
      options: { cacheName: 'media-v1', cacheableResponse: { statuses: [0, 200] },
                 expiration: { maxEntries: 250, maxAgeSeconds: 60 * 24 * 60 * 60 } } },
    { urlPattern: /assets\//i, handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-assets-v1', cacheableResponse: { statuses: [0, 200] },
                 expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 } } },
    { urlPattern: /\/api\//i, handler: 'NetworkOnly' },
  ],
}
```

Princípio: **precache só do app shell** (HTML/JS/CSS/fontes/ícones). Mídia grande entra por `runtimeCaching` quando o usuário a vê — senão o install demora minutos e falha em rede ruim.

### 11.3 Armadilhas conhecidas (todas já custaram bug no projeto de referência)

1. **`includeManifestIcons` duplicando ícones.** O padrão `true` injeta cada ícone com `?__WB_REVISION__=…` e o `globPatterns` injeta o mesmo arquivo com `revision: null`. O Workbox recusa (`add-to-cache-list-conflicting-entries`) e **aborta o precache inteiro**: o SW ativa, mas `caches.keys()` fica vazio e qualquer uso offline cai em "sem internet". Solução: `includeManifestIcons: false` e deixar os ícones entrarem uma única vez pelo glob.
2. **`selfDestroying: true` em produção.** Faz o SW se autodesregistrar e apagar os caches no `activate`. Serve para testes, nunca para o deploy.
3. **Nome de arquivo com acento/espaço no glob.** Um `MANUTENÇÃO.jpg` no precache pode não casar a URL e derrubar a instalação inteira do SW. Renomeie ou exclua do glob.
4. **Dois service workers.** O SW do legado no mesmo escopo precisa ser desregistrado; caso contrário o HTML antigo volta a ser servido.
5. **Cache "preso" após mudar estratégia.** Ao trocar handler ou `globPatterns`, suba a versão do cache (`static-assets-v1` → `-v2`) — o Workbox não invalida automaticamente o que está dentro.

### 11.4 Instalação e comportamento de app

- Botão "Instalar app": capture `beforeinstallprompt`, guarde o evento e chame `prompt()` no clique; escute `appinstalled`; detecte `display-mode: standalone` para mostrar "já instalado". No iOS Safari não existe o evento — mostre a instrução "Compartilhar → Adicionar à Tela de Início" (é o caminho real, não um erro).
- `apple-touch-icon` 180×180 e `theme-color` são o que fazem o iOS abrir sem barra branca.
- Tela cheia opcional: no primeiro gesto do usuário, tente `requestFullscreen()` (uma vez, silencioso em caso de recusa) — melhora muito a sensação de app instalado.
- Atualização: com `registerType: 'autoUpdate'`, exponha um aviso "nova versão disponível" e ofereça recarregar; sem isso o usuário fica numa versão antiga até fechar todas as abas.

### 11.5 Testes de PWA (não pule)

1. DevTools → Application → Manifest: nome, ícones, `display`, `start_url` corretos; sem erro de instalação.
2. Application → Service Workers: ativo e controlando a página.
3. Network → **Offline**: recarregar precisa abrir o app (shell) e navegar nas telas já portadas.
4. Instalar no Android (Chrome) e no iOS (Adicionar à Tela de Início): abre standalone, ícone certo, sem barra de endereço.
5. Depois de um deploy: com o app aberto, a nova versão é detectada e o reload aplica.
6. `caches.keys()` no console: precisa listar os caches esperados (se vier vazio, caiu na armadilha 11.3.1).

**Critério de aceite:** modo avião ligado, app instalado abre e funciona nas telas portadas.

---

## 12. Fase 9 — Deploy

- **Vercel → Root Directory = `src-app`** (o `package.json` e o `vite.config.ts` moram lá). Framework: Vite. Build: `npm run build`. Output: `dist`.
- `vercel.json` na raiz do projeto legado fica obsoleto depois do `git mv` — apague ou mova para `Legacy/`, para não confundir a configuração do painel.
- Rotas de SPA: `rewrites` para `/index.html` **exceto** `/api/*`, e o mesmo `navigateFallbackDenylist` no Workbox.
- Headers: `/assets/*` com `Cache-Control: public, max-age=31536000, immutable`; `sw.js` e `index.html` com `no-cache`.
- PWA exige HTTPS (Vercel já entrega) e **origem estável**: trocar domínio depois invalida instalações antigas.
- Rollback: como `Legacy/` está versionada, voltar é apontar o deploy para o commit anterior.

**Critério de aceite:** preview da Vercel abre, instala como PWA e passa no teste offline do item 11.5.

---

## 13. Fase 10 — Documentação e guardrails

- `Diretrizes/CHANGELOG.md`: uma entrada por versão, com **Added / Changed / Fixed / Verificação** — a coluna Verificação é o que impede "acho que está funcionando".
- `Diretrizes/system_map.json`: mapa de arquivos e propósitos; `tools/doc-lint.mjs` valida que todo caminho citado existe e que nenhum purpose virou histórico de versões.
- `AGENTS.md`: R1–R6 em forma de regra operacional (Legacy read-only, espelho intocável, ordem de import, PWA sem `selfDestroying`).
- `README.md`: como rodar (`npm install` na raiz e em `src-app`, `npm run dev`), onde fica o legado, como buildar.

**Critério de aceite:** uma pessoa (ou agente) nova consegue rodar o projeto sem perguntar nada.

---

## 14. Fora de escopo agora — mas sem fechar portas

Supabase e OAuth ficam para a fase seguinte. Para não retrabalhar, já nesta migração:

| Decisão | Como fazer agora | Facilita depois |
|---------|------------------|-----------------|
| Acesso a dados | um único `core/storage.ts` (ou `core/db/`) com `get/set/list/remove` sobre `localStorage`/IndexedDB | trocar a implementação por Supabase sem tocar nas telas |
| Identidade dos registros | `id` gerado no cliente (UUID) desde o início | ao subir para o servidor, não há colisão nem remapeamento |
| Sessão/usuário | nenhum código de auth; no máximo um `useCurrentUser()` que devolve `null` | a UI já pergunta "quem é o usuário" num só lugar |
| Chamadas de rede | nenhuma; se o legado tinha `fetch`, deixe um adapter comentado | ponto único para plugar API |
| Segurança | nada de credencial em código; sem `.env` versionado | migração para secrets é trivial |

Quando a fase 2 começar: modelar tabelas a partir dos tipos já usados no cliente, ativar RLS por usuário, criar fila de sync (offline-first) e só então ligar login.

---

## 15. Marcos de execução

| Marco | Entrega | Critério |
|-------|---------|----------|
| M0 | Inventário completo | tabela página → CSS/JS/estado |
| M1 | Legado congelado + scaffolding | `npm run build` verde, `Legacy/` intacto |
| M2 | Espelho de CSS + assets | página estática portada idêntica, zero 404 |
| M3 | Shell React (splash, navbar, footer, rotas) | casca idêntica e navegável |
| M4 | 1ª tela completa | paridade nos 7 viewports |
| M5 | Todas as telas | paridade + dados locais migrados |
| M6 | PWA | instalável + offline real |
| M7 | Deploy + docs | preview na Vercel + CHANGELOG/system_map em dia |

Estime por **telas**, não por dias: cada tela tem custo parecido, exceto as que têm drag & drop, timers ou formulários longos (2–3×).

---

## 16. Riscos e como neutralizar

| Risco | Sintoma | Neutralização |
|-------|---------|---------------|
| Ordem de `@import` trocada | layout "quase igual", com 1–2 regras perdidas | replicar a ordem dos `<link>` do HTML legado, literalmente |
| Regra nova perdendo para `!important` antigo | ajuste não aplica | folha nova importada **por último**; `!important` só como exceção documentada |
| Tailwind resetando o legado | espaçamentos e listas diferentes | CSS legado importado pelo JS, sem `@tailwind base` por cima |
| HTML "reactificado" com classes diferentes | CSS não casa | classes/IDs/`data-*` são contrato (R5); conferir com diff de DOM |
| Dois service workers | HTML antigo servido, cache duplicado | desregistrar o SW legado; um único SW (Workbox) |
| Dados do usuário "sumidos" | app novo abre vazio | mesmo `localStorage` key + migrador no boot |
| SW quebrado por conflito de ícones | offline não funciona, `caches.keys()` vazio | `includeManifestIcons: false` (11.3.1) |
| Mídia pesada no precache | install lento/falho em 3G | `globIgnores` + `runtimeCaching` |
| `position: fixed` no iOS | barra sobre o conteúdo, sem safe-area | `env(safe-area-inset-*)` e teste em aparelho real |
| Conversão "de uma vez" | semanas sem nada funcionando | fatias verticais (tela por tela) com paridade a cada uma |

---

## 17. Checklist final

- [ ] `Legacy/` congelado, com README e sem SW ativo
- [ ] `src-app/` buildando (`tsc -b && vite build`)
- [ ] `legacy-style/` espelhado 1:1 e `styles/legacy.css` na ordem original
- [ ] CSS novo só em `styles/` (globals, tokens, shell, modal-motion, mobile-fit)
- [ ] Assets em `public/` com os mesmos caminhos do legado
- [ ] Shell com splash + overlay de boot + ErrorBoundary
- [ ] Estado em `store/` e dados antigos migrados (mesma chave)
- [ ] Paridade visual conferida em 360/390/412/430/768/1024/1440
- [ ] PWA: manifest, ícones 192/512/maskable, precache enxuto, runtime cache
- [ ] Teste offline real (avião) e instalação em Android + iOS
- [ ] Vercel com Root Directory `src-app`, SPA rewrites e headers de cache
- [ ] CHANGELOG, system_map, doc-lint e AGENTS.md atualizados
- [ ] Nenhuma integração de Supabase/OAuth nesta fase (apenas os pontos de extensão da seção 14)
