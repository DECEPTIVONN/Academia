# Relatório de pendências — Academia / Evo Fit

> **Atualização v4.65.0 (2026-11-01):** o **login por QR Code** e as **notificações** (motivacional diária, lembrete de treino e fim de liga) deixaram de ser pendência e estão implementados — ver §2.4 e §4.1, mantidos com o estado atual e as limitações que restam.
>
> **Atualização v4.66.0 (2026-11-01):** o **Social deixou de ser demonstrativo** — ranking global mensal e amigos reais na nuvem, guildas e jogadores fictícios removidos (§3.1); **Ajuda** implementada (§2.2); **Missões** parqueadas atrás de `isDevMode()` (§3.2); **Fit ID** limpo dos restos de protótipo.

> Auditoria de 2026-11-01 · escopo: `src-app/src` (React + Vite) · método: leitura de código e buscas por marcadores (`TODO`, `FIXME`, `placeholder`, `em breve`, `mock`, `demo`, `simul*`, `localStorage`), reconciliação com `Diretrizes/DESIGN.md` e `system_map.json`.
>
> Objetivo: separar o que é **funcionalidade real**, o que é **demonstração com dados fictícios** e o que é **placeholder declarado** — com evidência de arquivo e backlog priorizado.

---

## 1. Resumo executivo

| Área | Situação | Impacto no usuário |
|---|---|---|
| Treino, ficha, foco, histórico, progresso, métricas corporais | ✅ Real (persistência em Dexie) | — |
| Perfil, níveis/XP, conquistas, ofensiva, radar, compartilhamento | ✅ Real | — |
| Música e playlists (upload + links) | ✅ Real | — |
| Offline / PWA, backup JSON, bloqueio com biometria, sync na nuvem | ✅ Real (sync depende de chaves) | — |
| **Loja** | 🟥 Placeholder de seção inteira | Aba da navbar abre “Em breve!” |
| **Social (Amigos/Ranking)** | ✅ Real (v4.66.0), a partir da nuvem | Ranking mensal e amizades entre contas |
| **Missões e Recompensas / Passe** | 🟧 Mock parqueado em `isDevMode()` (v4.66.0) | Fora do modo dev não aparece no app |
| **Notícias** | 🟧 Conteúdo estático de outro jogo | Textos de “temporada/campeão” |
| **Mensagens (Dashboard)** | ✅ Real (v4.67.0) | Eventos reais (amizade, conquista, liga, conta) com estado de lida |
| **Fit ID** | ✅ Real (v4.66.0) | Identidade/conta do app, sem restos de jogo |
| **Notificações** | ✅ Real (v4.67.0) | Agenda local + push com o app fechado (VAPID; falta configurar o servidor) |
| **Login por QR Code** | ✅ Real (v4.67.0) | Pareia a sessão entre aparelhos via Realtime, com uso único revogado no servidor |
| **Desativar conta** | ✅ Real (v4.67.0) | Exclusão agendada em 30 dias, cancelada ao entrar antes do prazo |
| **Ajuda** | ✅ Real (v4.66.0) | FAQ/tutoriais em Configurações, menu e busca |

---

## 2. Placeholders declarados na interface (“Em breve”)

### 2.1 Loja — seção inteira
- `src-app/src/App.tsx` (slide `data-section="loja"`): renderiza `.section-coming-soon` com “Em breve! Itens, skins e upgrades exclusivos para sua jornada.”
- A aba existe na navbar (`components/BottomNav.tsx`, `components/nav-section-items.tsx`) e é anunciada na Busca Geral (`features/search/search-index.ts`, item `sec:loja` — “Itens, skins e upgrades”).
- **Não existe** nenhuma feature de loja/compras em `src-app/src/features/` — nem catálogo, nem moeda, nem inventário.
- Consequência: duas moedas (`gold`/`gems`) e recompensas de missões não têm onde ser gastas.

### 2.2 Ajuda — implementada (v4.66.0)
- `features/help/HelpCenter.tsx` + `help.css` — Central de Ajuda com grupos (Começando, Minha Ficha/coleção, Progresso, Social/ranking, Nuvem/backup/offline, Notificações, Privacidade, Instalar/PWA), busca e acordeão animado.
- Entradas: **Configurações → Ajuda e Tutoriais**, menu do Início (**Ajuda**, via `openProfileHelp`) e Busca Geral (`cfg:ajuda`).

### 2.3 Desativar conta — resolvido na v4.67.0 (carência de 30 dias + expurgo agendado)

> Histórico da auditoria: a tela existia só como “EM BREVE”. Hoje `SettingsFeature.tsx` desativa de verdade (confirmação digitada), `cancel_account_deletion()` reativa ao entrar antes do prazo e `api/account-purge.js?action=cron` apaga depois dele. O bloco abaixo é o registro original do problema.

### 2.3.1 Registro original
- `features/settings/SettingsFeature.tsx` (tela `desativar`): selo **EM BREVE**, nota “a desativação de conta será liberada em uma atualização futura” e botão `disabled`.
- Existe apenas o **Sair da Conta**; exclusão/anonimização de dados não está implementada.

### 2.4 Notificações e lembretes — implementado (v4.65.0)
- Agendador em `features/notifications/` (ver §4.1 e o CHANGELOG v4.65.0): mensagem motivacional diária a partir das 12:00, lembrete no horário configurado (só sem treino no dia) e aviso de fim de liga (45 min antes da semanal, 1 h antes da mensal) — todos com dedupe por dia/janela.
- Nas Configurações, só **Novidades e atualizações** segue com selo **EM BREVE** (exige canal de anúncios do produto).
- **Pendência real remanescente:** o Service Worker do `vite-plugin-pwa` não tem handler de `push`/`notificationclick`, então **não há entrega com o app totalmente fechado** — isso depende de um servidor de push.

### 2.5 Guias (Notícias)
- `features/news/NewsOverlay.tsx`: a aba “Guias” é um estado vazio fixo — “Guias em breve”.

### 2.6 Fallback “Editar exercício — em breve”
- `features/workout/treinos/DetalhesPecaModal.tsx`: se `onEdit` não for passado, mostra o toast. **Na prática não é alcançável** hoje — o único consumidor (`TreinosFeature.tsx`) passa `onEdit`. Fica como dívida latente (qualquer novo ponto de uso herda o fallback).

---

## 3. Módulos demonstrativos (dados fictícios, estado local)

### 3.1 Social — Amigos / Ranking (real desde a v4.66.0)
- **Ranking global** (`RankingsOverlay.tsx` + `social-cloud.ts`): RPC `global_monthly_ranking`, com a janela da liga mensal (dia 1º 06:00 → último dia 21:00) e pontuação = XP dos treinos concluídos no mês. Nenhum jogador ou pontuação é inventado.
- **Amigos** (`friendships` + `friends_overview`): convite → aceite na nuvem, com recebidos/enviados; QR/link continuam funcionando offline (`friend-invites.ts`). Busca de jogador em `public.profiles` (`friend-search.ts`).
- **Guildas, chat de guilda e ligas simuladas foram removidos** (`GuildPanel`, `guild-data`, `GuildEmblem`, `social-data`, NPCs e estados de liga em `ligas-data.ts`).
- **Pendência real remanescente:** atribuição de liga por divisão no servidor (subida/queda). Hoje a disputa é o ranking global do mês; a promoção/rebaixamento só faz sentido com ligas atribuídas no backend.
- Perfis de outros jogadores mostram apenas o que a conta publica (XP total, XP do mês, nível, ofensiva, foto/emblema) — histórico e métricas ficam privados no aparelho de cada um.

### 3.2 Missões e Recompensas / Passe Royale — parqueado (v4.66.0)
- `features/dashboard/MissoesRecompensasModal.tsx` continua sendo um **port de um standalone de outro jogo** (chaves `arena_royale_*`, `gold`/`gems`/`trophies`) e o progresso **não vem do treino real**.
- **Destino decidido:** o módulo está parqueado. O card do Início, o item da drawer, o atalho da sidebar e a linha **SIMULADOR** só aparecem com `isDevMode()`; fora do modo dev o app não expõe missões, baús ou moedas.
- Reescrever como **metas reais** (treinos concluídos, séries, ofensiva) com recompensas persistentes é a alternativa para tirá-lo do modo dev — ver §5 P1.

### 3.3 Notícias
- `features/news/NewsOverlay.tsx`: 4 notícias + 8 atualizações **hardcoded** com conteúdo de outro produto (“NOVA TEMPORADA: ENTERRADAS ENCLAUSURANTES”, “NOVO CAMPEÃO: O GUARDIÃO ETERNO”, “Versão 2.4.0”…).
- Imagens usam `.premium-placeholder` (não há assets reais por notícia) e o rodapé é HTML estático injetado.

### 3.4 Mensagens (Dashboard) — real desde a v4.67.0
- `features/dashboard/MessagesModal.tsx` lê `features/notifications/inbox.ts`; a lista fixa de placeholders foi removida.
- Eventos reais: amizade aceita/convite recebido (snapshot de `friends_overview`), conquista desbloqueada, fim de liga em que o usuário treinou, ofensiva em risco e conta reativada — cada um com chave de dedupe, estado de lida, **Marcar todas** e **Limpar**. Sem eventos, a tela mostra estado vazio honesto.

### 3.5 Fit ID — restos do protótipo (mais grave em coerência)
`features/dashboard/SupercellIdModal.tsx` (aberto pelo “Fit ID” do menu do Início e pelo card de perfil):

| Item | Evidência | Problema |
|---|---|---|
| Aba “Meus Jogos” com **Retro Tetris** e **Clash Royale** | bloco `activeTab === 'games'` | Jogos que não existem no app; “Conectado” e “5.340 copas” fictícios |
| `PRESET_ACCOUNTS` | “DearGabrielGS / deargabriel@gmail.com”, “ClashKing99”, “TetrisGod” | Contas e e-mails inventados expostos no seletor de conta |
| FAQ | “recordes de blocos e Copas do Retro Tetris”, “recompensas de clã e arena… empilhar blocos” | Texto de outro jogo |
| Promoções | `window.alert("Promoção Especial: … Retro Tetris …")` | `alert()` nativo fora do design system |
| Emojis de UI | 👾 👑 👤 (5 ocorrências) | Viola `Diretrizes/Ícones.md` (sem emoji de interface) |
| Boletins | “Receba boletins semanais das arenas FIT.” | Não existe boletim |

> O resto do Fit ID já foi adaptado (amigos reais via `loadAddedFriends`, perfil, troca de nome/e-mail) — o que falta é **remover a camada “jogo”** e ajustar os textos.

---

## 4. Fluxos incompletos (sem o selo “em breve”)

### 4.1 Login por QR Code — implementado (v4.65.0)
- `features/auth/qr-pairing.ts` + `PairingAuthorizeDialog.tsx`: o aparelho sem sessão gera `PLN-XXXX-XXXX`, mostra o QR (`#qr=CODIGO`) e escuta o canal Realtime `evofit-login-pair:CODIGO`; o aparelho conectado autoriza (link ou Configurações → Segurança) publicando os tokens, e o primeiro entra via `supabase.auth.setSession`.
- **Limitação:** o canal é público e o código é a única credencial — sem backend não há revogação de uso único; o login cruzado não foi exercitado com conta real (exige credenciais e dois aparelhos).
- “Vincular Chave” continua existindo e é apenas namespace de sync, não autenticação.

### 4.2 Amizades sem backend
- `friend-invites.ts`: *“a lista de amigos do app é local-first; não há tabela de amizades”*.
- Consequência: amigo adicionado não vê você, não há aceite/notificação real, e a lista não sincroniza entre contas (o snapshot de sync leva os amigos por chave, mas é replicação, não relação).

### 4.3 Chat / presença / ranking global
- Nenhum canal Realtime para chat social; presença “on-line” vem de dados fixos (`online: true/false`).
- Ranking é local; não há tabela agregada de pontuação no Supabase.

### 4.4 Nuvem (quando não configurada)
- `core/sync/supabase-client.ts` exige URL + anon key (`.env` ou chaves coladas no painel). Sem elas, `isSyncConfigured()` é falso e o app fica **local-only**; telas de nuvem/dispositivos mostram o estado degradado (`sync-manager.ts`: “Sem nuvem: mostra só o dispositivo atual”).
- Não é bug — é pré-requisito de configuração —, mas precisa estar claro no onboarding do produto.

### 4.5 Fallbacks visuais (aceitáveis, mas vale mapear)
- `components/ExerciseCard.tsx`: 7 GIFs de fallback quando a imagem do exercício falha.
- `features/gamification/ColecaoModals.tsx`: `PLACEHOLDER_SVG` para cartas sem arte.
- `.premium-placeholder` (Design §12.2) em cards sem mídia.

---

## 5. O que está implementado de verdade (para não confundir)

- **Treino**: fichas, deck (modos lista/grid, slots 1–8), modo foco (séries, timer, avanço), cardio, histórico, ciclo, calendário.
- **Progresso**: XP/nível, ofensiva, heatmap, tendências, **Radar Fit**, volume de carga, **métricas corporais** (peso, altura, gordura, cintura, fotos, comparar) e o Perfil de Saúde sincronizado.
- **Perfil**: cartão, emblemas, molduras, títulos (exibição), destaque, conquistas.
- **Compartilhamento**: `shareNative` + geração de imagem (Radar Fit, treino concluído, cartão de perfil) com fallback web.
- **Música**: upload local (IndexedDB), playlists, capas, player flutuante, links YouTube/Spotify com embed.
- **Sistema**: offline/PWA (precache com 54 entradas), backup/restore JSON, bloqueio com PIN + WebAuthn, multi-dispositivo via Supabase, busca global, tema/cores, acessibilidade.

---

## 6. Backlog priorizado

> **Concluído na v4.66.0:** itens 1 (Fit ID limpo), 2 (SIMULADOR e módulo de Missões atrás de `isDevMode()`) e 11 (Central de Ajuda). O item 8 (Social) foi resolvido com `friendships` + ranking agregado real; o chat Realtime saiu junto com as guildas.

### P0 — coerência com o usuário (barato e visível)
1. ~~Limpar o Fit ID~~ — feito na v4.66.0.
2. ~~Esconder o “SIMULADOR” das missões e decidir o destino do módulo~~ — feito: parqueado em `isDevMode()`.
3. **Loja**: ou implementar o mínimo (catálogo + saldo + inventário) ou **remover a aba** e o item da Busca até existir — hoje há três entradas apontando para o vazio.

### P1 — funcionalidades prometidas pela interface
4. **Missões ligadas ao histórico real** (treinos concluídos, séries, sequência) e recompensas com efeito persistente; sem isso, manter “EM BREVE”.
5. ✅ **Push de verdade** (v4.67.0): `api/push-dispatch.js` (VAPID + RFC 8291 com `node:crypto`) e `public/push-sw.js` (`push`, `notificationclick`, `pushsubscriptionchange`) entregam com o app fechado. **Pendência operacional:** configurar `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT`/`SUPABASE_SERVICE_ROLE_KEY`/`CRON_SECRET` na Vercel, aplicar a migração e agendar `?action=cron` a cada 5–15 min (Vercel Cron no plano Pro; no Hobby use agendador externo).
6. ✅ **Revogação do pareamento** (v4.67.0): `pairing_codes` + `pairing_claim` consomem o código antes de publicar os tokens — o segundo uso recebe `used`, mesmo dentro dos 5 min. Modo degradado (sem rede para registrar o código) avisa na UI.
7. ✅ **Desativar conta** (v4.67.0): `request_account_deletion()` marca +30 dias, `cancel_account_deletion()` reativa ao entrar nesse prazo, `api/account-purge.js?action=cron` apaga de verdade após o prazo. **Pendência operacional:** agendar o expurgo com `CRON_SECRET`.

### P2 — Social e conteúdo
8. ~~Social demonstrativo~~ — resolvido na v4.66.0 (amizades e ranking reais; guildas removidas). **Resta** a atribuição de liga por divisão no servidor para reativar subida/queda.
9. **Notícias**: substituir o conteúdo estático por itens do produto (ou um JSON editável) e implementar a aba Guias.
10. ✅ **Mensagens** (v4.67.0): `features/notifications/inbox.ts` + `RealEventsFeed.tsx` gravam amizade aceita/convite recebido, conquista desbloqueada, fim de liga com treino na janela, ofensiva em risco e conta reativada — com estado de lida, dedupe e limite de 60 itens.
11. ~~Ajuda~~ — feito na v4.66.0 (`features/help/HelpCenter.tsx`).

---

## 7. Como reproduzir a auditoria

```bash
cd src-app/src
grep -rn "em breve\|EM BREVE" --include=*.tsx .
grep -rn "localStorage.setItem" --include=*.tsx features/dashboard features/social
grep -rn "TODO\|FIXME" --include=*.ts --include=*.tsx .
grep -rn "URLSearchParams\|location.search" --include=*.ts --include=*.tsx .   # vazio hoje
```

Conferência cruzada: `Diretrizes/DESIGN.md` (seções de Social, Missões, Notícias) e `Diretrizes/system_map.json` (purposes que já registram “demonstrativo/placeholder”).
