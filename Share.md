# Compartilhamento Nativo (Web Share API): Evo Fit

Este documento descreve o **estado atual** do compartilhamento no app, os **ajustes a implementar** e a referência técnica da Web Share API. O objetivo é que um agente consiga revisar e corrigir a implementação existente.

---

## 1. Estado atual

### Arquivos principais

| Arquivo | Papel |
|---|---|
| `src-app/src/features/gamification/ShareModal.tsx` | Modal `#modalShare` com 3 cards visuais: treino, conquista (badge) e radar |
| `src-app/src/features/gamification/share-store.ts` | Store Zustand (`useShareStore`): abertura/fechamento e tipo de card (`treino` \| `conquista` \| `radar`) |
| `src-app/src/lib/native-share.ts` | Utilitários `shareNative()` e `canNativeShare()` que encapsulam a Web Share API, com `AbortError` silencioso |
| `src-app/src/features/gamification/share-quotes.ts` | Frases aleatórias exibidas no rodapé do card |
| `src-app/index.html` | Meta tags Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) e `twitter:card` |

### Fluxo atual

1. `useShareStore.openTreino/openBadge/openRadar` abre o modal com o card correspondente.
2. Ao abrir, um `useEffect` pré-renderiza o card com `html2canvas` (`scale: 2`, `backgroundColor: '#000000'`, `useCORS: true`), converte para `File` PNG e guarda em `canvasFileRef`.
3. O clique em "COMPARTILHAR" (`handleShare`) usa o arquivo em cache (ou gera sob demanda) e chama `shareNative()` com:
   - `title: 'Evo Fit'`
   - `text: 'Confira meu progresso na Evo Fit! <origin>'`
   - `url: window.location.origin`
   - `files: [file]`
4. Desfechos:
   - `shared`: toast de sucesso.
   - `cancelled` (`AbortError`): sem fallback.
   - `unsupported`/`error`: tenta a folha nativa só com texto/link; se cancelada ou com erro, baixa a imagem e copia para o clipboard.
5. Quando `!canNativeShare()`, exibe botões de fallback: WhatsApp, X e Facebook.
6. Botão "BAIXAR IMAGEM" gera/baixa o PNG.

### Limitações conhecidas do produto

- Só existe um ponto de compartilhamento (o modal); não há compartilhamento direto em perfil/dashboard.
- O compartilhamento usa apenas `window.location.origin`; não há URL de perfil por usuário.
- O app é SPA com `index.html` estático, então as meta tags OG são as mesmas para qualquer rota.
- O fallback de clipboard usa `image/png` via `ClipboardItem`; sem suporte a `ClipboardItem`, cai para download.

---

## 2. Ajustes a implementar (prioridade alta)

### 2.1 Evitar link duplicado

**Problema:** o link vai no `text` e também em `url`. Em apps como o WhatsApp, `text` e `url` são concatenados e o link pode aparecer duas vezes.

**Ajuste:** quando houver arquivo, enviar o link apenas no `text` e omitir `url`. Validar manualmente em WhatsApp, Telegram e Instagram. Se algum app descartar o link, reavaliar caso a caso.

### 2.2 Não chamar um segundo `navigator.share` após falha

**Problema:** no `unsupported`/`error`, o código tenta uma segunda folha nativa só com texto. No Safari/iOS o gesto do usuário já foi consumido e a segunda chamada pode falhar com `NotAllowedError`.

**Ajuste:**
- Se `canShare({ files })` retornar `false` **antes** de qualquer tentativa, é seguro chamar `share()` só com texto/link (nenhum gesto foi consumido).
- Se o `share()` com arquivo já foi chamado e falhou (exceto `AbortError`), ir **direto** para o fallback de download + clipboard, sem novo `navigator.share`.

### 2.3 Cancelamento nunca dispara download/clipboard

**Problema:** se o usuário cancela a folha só de texto, o app baixa a imagem e copia para o clipboard, o que é inesperado.

**Ajuste:** `AbortError` em **qualquer** chamada de `share()` encerra o fluxo em silêncio. O fallback de download/clipboard só roda para `unsupported` ou erro real.

### 2.4 Não gerar a imagem no clique

**Problema:** se o usuário clica antes do pré-render terminar e o arquivo é gerado sob demanda, o iOS perde o gesto.

**Ajuste:**
- Manter o botão "COMPARTILHAR" **desabilitado** (com estado de carregamento) até `canvasFileRef` estar pronto.
- Remover o caminho de "gerar sob demanda" dentro de `handleShare` para o fluxo de `share()`. Manter a geração sob demanda apenas para "BAIXAR IMAGEM", que não depende do gesto.

### 2.5 Invalidar o cache quando o card mudar

**Problema:** o cache só é limpo ao fechar o modal. Se o card mudar com o modal aberto (troca do tipo de card, frase aleatória, dados), o arquivo fica desatualizado.

**Ajuste:** o `useEffect` de pré-render deve depender de tudo que altera o visual (tipo de card, quote, dados do treino/badge/radar) e, a cada mudança, limpar `canvasFileRef` e desabilitar o botão até a nova imagem estar pronta. Descartar resultados de renders antigos (flag de cancelamento no cleanup do effect) para evitar corrida.

### 2.6 Robustez do `html2canvas`

- Aguardar `await document.fonts.ready` antes de renderizar, para evitar fonte errada no card.
- Garantir que todas as `<img>` do card estejam carregadas (`img.decode()` ou evento `load`) antes do render.
- Imagens externas precisam de `crossOrigin="anonymous"` e CORS no servidor, senão o canvas fica "tainted" e `toBlob` falha.
- Em iPhones mais antigos, `scale: 2` em cards grandes pode estourar o limite do canvas e gerar imagem em branco. Usar `scale = Math.min(2, limite / larguraDoCard)` ou reduzir para `1.5` quando o canvas resultante passar de ~4096 px de lado. Validar que o blob não é vazio antes de usar.

---

## 3. Melhorias opcionais (prioridade média)

### 3.1 Compartilhamento de perfil por usuário com prévia personalizada

Hoje a prévia do link é sempre a mesma, porque o `index.html` é estático e crawlers (WhatsApp, X, Facebook, Telegram) **não executam JavaScript**.

Para compartilhar `https://seusite.com/perfil/<id>` com prévia personalizada, é preciso servir as meta tags OG por rota, por meio de uma destas opções:

- SSR (Next.js, Remix etc.).
- Prerender das rotas públicas.
- Uma edge function/middleware que detecta user-agents de crawlers e devolve um HTML mínimo com as meta tags do usuário.

Requisitos da imagem OG: URL absoluta e pública, idealmente 1200x630 px.

### 3.2 Pontos adicionais de compartilhamento

Reaproveitar `useShareStore` e `shareNative()` para botões em perfil e dashboard, em vez de criar uma nova implementação.

---

## 4. Referência técnica da Web Share API

### Regras

- Exige **HTTPS** (ou `localhost`).
- Precisa ser chamada dentro de um **gesto do usuário** (clique/toque).
- Sempre verificar `navigator.canShare(dados)` antes de compartilhar arquivos.
- Tipos de arquivo aceitos: PNG, JPEG, WebP, GIF, vídeo, áudio, PDF, texto. **SVG não é aceito.**
- O comportamento de `text`/`url`/arquivo varia por app de destino (alguns descartam o texto quando há imagem).

### Padrão recomendado para `shareNative()`

```ts
type Resultado = 'shared' | 'cancelled' | 'unsupported' | 'error';

export async function shareNative(dados: { title?: string; text?: string; url?: string; files?: File[] }): Promise<Resultado> {
  if (!navigator.share) return 'unsupported';
  try {
    if (dados.files?.length && !(navigator.canShare?.({ files: dados.files }))) {
      return 'unsupported'; // nenhum gesto consumido: o chamador pode tentar só texto/link
    }
    await navigator.share(dados);
    return 'shared';
  } catch (e: any) {
    if (e?.name === 'AbortError') return 'cancelled';
    return 'error'; // gesto possivelmente consumido: o chamador deve ir direto para download/clipboard
  }
}
```

### Lógica esperada em `handleShare`

```ts
const file = canvasFileRef.current;           // botão só habilitado se existir
const text = `Confira meu progresso na Evo Fit! ${origin}`;

let r = await shareNative({ title: 'Evo Fit', text, files: [file] }); // sem `url` (ver 2.1)

if (r === 'unsupported') {
  // nenhum share foi tentado: seguro tentar só texto/link
  r = await shareNative({ title: 'Evo Fit', text });
  if (r === 'unsupported') r = 'error'; // cai para o fallback manual
}

if (r === 'shared') toastSucesso();
else if (r === 'cancelled') return;            // silêncio total
else await fallbackDownloadEClipboard(file, text); // só para erro/sem suporte
```

### Suporte por plataforma

| Plataforma | Texto/Link | Arquivos |
|---|---|---|
| Android (Chrome, Edge, Samsung) | Sim | Sim |
| iOS (Safari, Chrome) | Sim | Sim (iOS 15+) |
| Windows (Chrome, Edge) | Sim | Sim |
| macOS (Safari) | Sim | Sim |
| Firefox Desktop | Não | Não |
| Firefox Android | Sim | Parcial |

### Links de fallback social

- WhatsApp: `https://wa.me/?text=${encodeURIComponent(texto)}`
- X: `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

---

## 5. Critérios de aceitação

- [ ] Android (Chrome): a folha nativa abre com imagem + texto + link, **sem link duplicado** no WhatsApp.
- [ ] iOS (Safari 15+): o compartilhamento funciona sem `NotAllowedError`; o botão fica desabilitado até a imagem estar pronta.
- [ ] Windows (Chrome/Edge): o diálogo nativo abre normalmente.
- [ ] Firefox Desktop: aparecem os botões de fallback (WhatsApp, X, Facebook, copiar/baixar).
- [ ] Cancelar a folha nativa **nunca** dispara download, clipboard ou toast de erro.
- [ ] Falha real do `share()` com arquivo vai direto para download + clipboard, sem segundo `navigator.share`.
- [ ] Trocar o tipo de card ou a frase com o modal aberto regenera a imagem e desabilita o botão durante a geração.
- [ ] O card renderiza com a fonte correta e todas as imagens carregadas; o blob gerado nunca é vazio.
- [ ] A prévia do link (Open Graph) continua funcionando ao colar a URL no WhatsApp/Telegram/X.
- [ ] Tudo funciona em HTTPS.

## Referência

- MDN: [Web Share API](https://developer.mozilla.org/pt-BR/docs/Web/API/Web_Share_API)