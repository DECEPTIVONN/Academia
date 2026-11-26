# Changelog do Projeto Academia

> **📋 INSTRUÇÃO OBRIGATÓRIA PARA AGENTES DE IA:** Toda alteração deve ser registrada neste arquivo. Use formato [vX.X.X] - YYYY-MM-DD e tags [Added], [Changed], [Fixed].

## [v4.82.0] - 2026-11-26

**Painel do personal trainer (CRM) opcional, separado do aluno pelo login, com fichas, avisos de ficha terminando, sugestão da próxima ficha e ajustes de desktop.**

### Added

- **Login do personal**: a tela de entrada do aluno ganhou o link discreto **"Sou personal trainer — acessar painel"**; ele abre o `PersonalLoginPanel` (criar conta/entrar, senha em SHA-256 via Web Crypto, sessão em `localStorage`). A interface do aluno continua idêntica.
- **Painel CRM (`src-app/src/features/personal/`)**: experiência própria (tema lime/teal, classes `.pt-*`) com Visão geral, Alunos, Detalhe do aluno, Fichas, Agenda semanal, Avisos e Configurações, além do editor de ficha em tela cheia e do modal de novo aluno.
- **Dados próprios**: tabelas `ptProfiles/ptStudents/ptSheets/ptSessions/ptAlerts/ptNotes/ptMessages` na v5 do Dexie, sem tocar nas tabelas do aluno. Carteira de demonstração (`origin: 'demo'`) pode ser resetada em Configurações.
- **Integração com o app do aluno**: aluno marcado como vinculado a este aparelho (`linkedDevice`) recebe fichas publicadas em `workoutSheets` (com `academia:db-ready`) e envia o histórico real para o CRM; o painel lê o treino em andamento e cria aviso quando a ficha passa de ~75% concluída.
- **Sugestão da próxima ficha**: `suggestNextSheet` monta a ficha seguinte a partir do histórico, foco e nível do aluno, com progressão de carga; o editor abre já preenchido.
- **Desktop do app do aluno**: `src-app/src/styles/desktop-ux.css`, aditivo em `@media (min-width: 1024px)` (mobile inalterado).

### Changed

- `src-app/src/core/db/idb.ts` — Dexie v5 com as tabelas `pt*`.
- `src-app/src/App.tsx` — `AppContent` renderiza `PersonalApp` quando há sessão de personal.
- `src-app/src/features/auth/AuthScreen.tsx` — entrada para o painel do personal.
- `android/app/build.gradle` — `versionCode 4` / `versionName "1.0.3"`.

### Fixed

- **Avisos duplicados na primeira entrada**: com o React StrictMode o painel monta duas vezes e o `load()`/`refreshDerivedAlerts()` rodavam em paralelo; a checagem de `dedupeKey` do `upsertAlert` acontecia antes do primeiro `put`, então o mesmo aviso era inserido duas vezes. `personal-store.ts` agora usa single-flight (`loadInFlight`/`alertsInFlight`), uma execução por vez.
- **Plurais do tempo relativo**: `relativeDay` mostrava “há 2 semana(s)”; agora escreve “há 2 semanas”, “há 1 mês”, “há 3 meses”.

---

## [v4.81.0] - 2026-11-23

**APK com nome/ícone atuais e login por chave de sincronização funcionando.**

### Fixed

- **Nome do app**: `android/app/src/main/res/values/strings.xml` e `capacitor.config.json` passaram de "Academia Workout Tracker" para **"Evo Fit"** (o rótulo do launcher vinha do `app_name` antigo).
- **Ícone e splash nativos**: `mipmap-*/ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png` e `drawable-*/splash.png` foram regerados a partir de `public/assets/icons/logo-512.png` (logo atual do Evo Fit); `ic_launcher_background` agora é `#131313` (era branco, tema do Capacitor).
- **Chave de sincronização no login**: o gaveta "Vincular Chave" só guardava o texto e não tinha ação — agora tem o botão **"Vincular chave a este aparelho"**, que aplica a chave (`mbc_sync_key`), reinicia o motor de sync e confirma na tela.
- **Chave colada era descartada**: ao entrar, `App.tsx` sobrescrevia a chave do usuário pela chave derivada da conta (`deriveSyncKeyForUser`). Foi criada a marca `mbc_sync_key_linked` (`isSyncKeyLinked`/`markSyncKeyLinked` em `core/sync/supabase-client.ts`): chave vinculada manualmente tem prioridade e não é trocada.
- **Login/sync sem Supabase no APK**: o workflow não passava as credenciais do `.env.local` (não versionado), então o APK saía sem Supabase e o login não completava. O step `Build web` agora recebe `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` dos secrets do repositório.

### Changed

- **`android/app/build.gradle`**: `versionCode 3` / `versionName "1.0.2"`.

---

## [v4.80.0] - 2026-11-23

**Legacy V1 voltou a carregar o CSS e os GIFs dos exercícios em servidor case-sensitive (deploy/APK).**

### Fixed

- **`src-app/public/legacy-v1/treino.html`** e **`sw.js`**: os três `Style/*.css` passaram a `style/*.css` — a pasta no repositório é `style/` (minúscula), então em Linux o CSS dava 404 e a página abria sem estilização (no Windows funcionava por o sistema de arquivos não diferenciar maiúsculas).
- **`src-app/public/legacy-v1/JS/treino.js`**: os caminhos dos GIFs passaram de `Assets/exerciciosgif/` para `Assets/Exerciciosgif/`, que é o nome real da pasta.

### Changed

- **`android/app/build.gradle`**: `versionCode 2` / `versionName "1.0.1"` para a release com o Legacy V1 corrigido.

---

## [v4.79.0] - 2026-11-23

**O step "Read app version" do workflow passou a ler `versionName`/`versionCode` sem exigir o `=`.**

### Fixed

- **`.github/workflows/android-build.yml`**: a extração usava `grep 'versionName[[:space:]]*='`, mas o `android/app/build.gradle` declara `versionName "1.0.0"` (sem `=`), então o `grep` falhava e, sob `set -euo pipefail`, o step abortava antes do Gradle (run 45206814016). Agora é `sed` tolerante a `=` opcional, com erro explícito se a leitura vier vazia.

---

## [v4.78.0] - 2026-11-23

**Publicação da release passou a usar o secret `EVOFIT_RELEASES`, o nome criado em Settings → Secrets → Actions.**

### Changed

- **`GH_TOKEN` do workflow** (`.github/workflows/android-build.yml`) usa `secrets.EVOFIT_RELEASES` com `secrets.RELEASE_TOKEN` como alternativa; comentário de cabeçalho, aviso de secret ausente e **`Diretrizes/README.md`** atualizados com o nome correto.

---

## [v4.77.0] - 2026-11-23

**Repo público de releases passou a `DECEPTIVONN/EvoFit-releases` e o projeto Android + keystore de debug entraram no versionamento.**

### Changed

- **`REPO_RELEASES` no workflow** (`.github/workflows/android-build.yml`) e **`RELEASE_REPO`** (`src-app/src/lib/app-updater.ts`) apontam para `DECEPTIVONN/EvoFit-releases`, o repo público criado para hospedar o APK e o `latest.json`; **`Diretrizes/README.md`** atualizado (seção APK).
- **`.gitignore`**: `.release-token` passa a ficar de fora do versionamento (arquivo local usado para gravar o `RELEASE_TOKEN` no GitHub).

### Added

- **Commit do projeto `android/`** (Gradle, `AndroidManifest.xml`, `MainActivity`, `AppUpdaterPlugin`, `res/xml/file_paths.xml`) e do **keystore de debug** (`debug.keystore` + `debug.keystore.base64`): sem eles o CI não gera o APK e o APK novo não instala por cima do antigo.

### Notas

- O secret `RELEASE_TOKEN` é do repo de código (`DECEPTIVONN/Academia`, Settings → Secrets → Actions) e precisa de `contents: write` **apenas** em `EvoFit-releases`.

---

## [v4.76.0] - 2026-11-23

**Interface Legacy V1 servida pelo app, com troca nos dois sentidos: item "Versão Legacy" no menu do Início e opção de voltar para a versão mais recente dentro do Legacy V1.**

### Added

- **`src-app/public/legacy-v1/`**: a pasta `Evo Fit Legacy V1` foi movida para dentro de `public/`, então a interface V1 (HTML/CSS/JS puro, sem modernização) passou a ser servida junto do app em `/legacy-v1/treino.html` — no `npm run dev`, no preview e no deploy.
- **Item "Versão Legacy" no menu do Início** (`InicioMenuModal.tsx`, grupo próprio no fim, ícone SVG stroke `currentColor` de camadas): fecha o menu e navega para `/legacy-v1/treino.html`.
- **Card "Versão do Aplicativo" na aba MONTAR do Legacy V1** (junto de Cronômetro, Tema e Backup): botão `#btnVoltarVersaoAtual` que volta para a versão mais recente (`../`, ou seja, a raiz do app).

### Changed

- **`src-app/vite.config.ts`**: `/legacy-v1/` entrou no `navigateFallbackDenylist` do Workbox (sem isso o service worker do app responderia a navegação com o `index.html` e a interface V1 nunca abriria) e no `globIgnores` do precache (o Legacy V1 não entra no cache do app shell).

### Notas

- O Legacy V1 não foi alterado além do card de retorno: continua em HTML/CSS/JS puro, com o próprio `sw.js` (escopo `/legacy-v1/`).
- Referências de caixa alta (`Style/…`) seguem como estavam no V1; funcionam no Windows e em servidores case-insensitive, mas não em hospedagem Linux.

---

## [v4.75.0] - 2026-11-23

**APK automático no GitHub Actions e atualização automática dentro do app (Capacitor): build web → sync → gradle → release pública com APK + `latest.json`, e uma tela "Sobre e Atualizações" no APK que verifica, baixa com progresso e abre o instalador do Android.**

### Added

- **Workflow `.github/workflows/android-build.yml`**: roda em push na `main` (e `workflow_dispatch`), instala Node 22 + JDK 21 + Android SDK 36, faz `npm ci` na raiz e no `src-app`, `npm run build`, `npx cap sync android`, `:app:assembleDebug`, valida o `versionCode` do APK com `aapt2`, sobe o artefato (best-effort) e publica a release `v<versão>-vc<code>-<sha>` no repo público `DECEPTIVONN/Academia-releases` com o APK, o `latest.json` (versionName/versionCode, commit, apkUrl, size, sha256 e notas) e as notas extraídas da primeira seção deste CHANGELOG. Exige o secret `RELEASE_TOKEN` (`contents: write` no repo de releases).
- **Plugin nativo `AppUpdaterPlugin.java`** (`@CapacitorPlugin(name = "AppUpdater")`, registrado em `MainActivity`): `getVersionInfo`, `fetchManifest` (o download de release assets do GitHub não responde CORS, então a leitura do `latest.json` também é nativa), `downloadApk` (cacheDir/updates + eventos `downloadProgress` + conferência de `sha256`), `installApk` (FileProvider `${applicationId}.fileprovider`), `canInstallPackages` e `openInstallSettings`.
- **`src-app/src/lib/app-updater.ts`**: `isNativeAndroid()`, `getInstalledVersion()`, `checkForUpdate()` (compara `versionCode`), `downloadAndInstall()` (baixa, pede a permissão de instalar apps desconhecidos e abre o instalador) e `formatBytes()`.
- **`UpdateCard.tsx` + `update-card.css`**: card "Atualizações do App" com versão instalada, verificação automática ao abrir, versão publicada (nome, tamanho, commit), notas da release, barra de download e os botões Verificar / Baixar e instalar. Novo tile **"Sobre e Atualizações"** no grupo Configurações, montado apenas quando `isNativeAndroid()`.
- **`debug.keystore` + `debug.keystore.base64` na raiz** (`androiddebugkey`, senha `android`): a MESMA chave em todos os builds, sem a qual o APK novo não instala por cima do antigo.

### Changed

- **`android/app/build.gradle`**: `versionName` passou a `1.0.0` (semver) + `signingConfigs.debugConfig` usando o keystore versionado (`rootProject.file("../debug.keystore")`) no buildType `debug`.
- **`.gitignore`**: o projeto `android/` deixou de ser ignorado (o CI precisa dele); só saídas de build/cache ficam fora (`android/app/build/`, `android/build/`, `android/.gradle/`, `android/.idea/`, `local.properties`).
- **`AndroidManifest.xml`**: `REQUEST_INSTALL_PACKAGES`; **`res/xml/file_paths.xml`**: `cache-path` `updates/` para o APK baixado.
- **Documentação**: `Diretrizes/README.md` ganhou a seção **APK e atualização automática** (variáveis, build local, publicação, regra de subir `versionCode`/`versionName`); `system_map.json` foi para 4.75.0 com o atalho `apk_e_atualizacao`.

### Notas

- O `versionCode` é a única comparação de versão considerada pelo app; suba-o (e o `versionName`) no mesmo commit de qualquer mudança publicável.
- Na web nada muda: sem APK Android, a tela de atualização não é montada.

---

## [v4.74.0] - 2026-11-09

**Emblema com moldura Diamante e foto no fim do Ícone Legado, fundo único em Cartões/Barras/Emblema, convites reais de ofensiva, Progressão/Destaque/Medalhas com interface, Ajuda standalone redesenhada, Cronograma repaginado, Ofensivas AMOLED, crest da Maestria e timer do Foco sem duplicação.**

### Added

- **Emblema → Moldura Diamante**: novo tipo `diamante` em `AvatarFrame`, opção em `AVATAR_FRAMES` e anel em losango (ciano) no card de escolha e no avatar do Início/Perfil. O avatar do Início ganhou `overflow: visible` nessa moldura para o losango não ser cortado.
- **Foto de perfil no Ícone Legado**: a foto passou a ser a **última opção** do grid de emblemas (`IdentityPhotoCard`). Ao tocar, abre um painel com **Usar imagem atual**, **Fazer upload/Alterar imagem** e **Remover foto**; o `<input type=file>` fica fora do grid e a prévia usa o mesmo `ProfileEmblem`.
- **Progressão no hub Meu Perfil**: o tile não tinha `screen` correspondente. Agora `progressao` é um grupo real com cartão de jornada (anel do nível, barra de XP, ofensiva, conquistas e medalhas), os tiles Visão Geral/Nível e XP/Conquistas e atalho “Ver todas as conquistas”.
- **Medalhas**: substituído o preview estático por um catálogo de 6 medalhas calculadas do histórico real (`totalTreinos`, `streak`, `nivel`, `maestriasN1`), com tier Bronze/Prata/Ouro, estado bloqueada/conquistada, barra de progresso e contador `atual/meta`.
- **Convites reais de ofensiva**: `features/social/streak-invites.ts` + `FriendStreaksPanel.tsx` + `friend-streaks.css`. Amizades confirmadas podem convidar; o amigo recebe uma mensagem nas Mensagens do Início com **Aceitar/Recusar**, e convites aceitos mostram a sequência atual na lista “Ofensivas dos amigos”. O remetente pode cancelar um convite pendente. `StreakInviteWatcher` consulta ao abrir, ao voltar para a aba e a cada 45 s, sem duplicar mensagens.
- **SQL**: `supabase/migrations/20261109_streak_invites.sql` cria `public.streak_invites`, RLS, índice único de pendente por par e as RPCs `send_streak_invite`, `respond_streak_invite`, `cancel_streak_invite` e `streak_invites_overview` (com nome/nível/streak/foto do outro lado).
- **Ajuda standalone**: `HelpOverlay.tsx` é uma interface fullscreen própria (hero, chips de atalho, busca, grupos e rodapé de suporte), aberta pelo menu do Início, pelo card de Ajuda do Perfil, pela busca geral (`action: 'open-help'`) e pelo evento `academia:open-help`. O tile “Ajuda e Tutoriais” saiu de Configurações e a Busca Geral passou a abrir o overlay.
- **Arquivos novos**: `features/help/HelpOverlay.tsx`, `features/social/streak-invites.ts`, `features/social/FriendStreaksPanel.tsx`, `features/social/StreakInviteWatcher.tsx`, `features/social/friend-streaks.css`, `supabase/migrations/20261109_streak_invites.sql`.

### Changed

- **Botão Pulsar**: virou um controle `emblem-pulse` com ícone de brilho, título “Pulsar emblema”, descrição e switch maior (50×26), com estado ativo em degradê primário. O texto “Filtra: Todas” saiu.
- **Destaque do emblema escolhido**: removido do grid do Ícone Legado; a seleção continua no preview grande, sem aro/realce no card escolhido.
- **Fundo das sub-abas**: Cartões, Estilo das Barras e Emblema receberam a mesma classe `customization-surface`, com a mesma superfície escura e o mesmo tratamento do `theme-bg`.
- **Ofensivas (Central de Ofensivas)**: `#000` AMOLED no `.of-root` e no header, com a malha decorativa bem mais discreta; os painéis continuam em `#08080a`.
- **Maestria Geral**: o losango plano no topo dos cards virou uma crista circular com aro metálico, estrela central, glow por tier (Bronze/Prata/Ouro) e estado bloqueado cinza.
- **Cronograma**: novo hero com anel da meta semanal, faixa Seg–Dom com os dias planejados, escolha da frequência em cartões com dias/nota/check e três cartões de leitura (meta mensal, descanso e consistência).
- **Conquistas**: a interface de estandartes passou a se chamar **Conquistas** nos títulos, no hero, na vitrine do Perfil e no card da aba Progresso; ids internos (`EstandartesOverlay`, `est-*`) foram mantidos para não quebrar dados. Com `locked.length === 0`, o rodapé do hero mostra **“Mestre das conquistas”** (dourado) em vez de “0 bloqueados”.
- **Ajuda e Tutoriais**: os acordeões ganharam ícone “?”, chevron em círculo, borda/realce de abertura, barra de accent, grupo com cabeçalho próprio e overlay com `scroll-margin` para os atalhos.
- **Mensagens do Início**: `InboxMessage` ganhou `action/inviteId/inviteStatus/fromName`; cartões de convite de ofensiva exibem Aceitar/Recusar e atualizam o próprio cartão após a resposta. `patchMessageByKey` permite atualizar sem duplicar.
- **Timer no Modo Foco**: o widget global `RestTimerWidget` fica oculto enquanto `body.focus-mode-active`; resta apenas o timer de descanso interno do Foco.
- **Documentação**: `system_map.json` atualizado para 4.74.0 e novos módulos registrados.

### Fixed

- **Segurar um exercício em Minha Ficha**: `scale(0.98)` do `:active` removido e `transform: none !important` aplicado a `.workout-deck-grid .deck-card` em hover/active/focus/menu-active, incluindo o reset do zoom da imagem. O card não encolhe mais ao segurar.
- **Timer duplicado no Modo Foco**: correção definitiva via `body.focus-mode-active` (o timer global não aparece mais por baixo do interno).
- **Ajuda presa em Configurações**: a Central saiu do hub e não depende mais de `stack: ['ajuda']`; o antigo tile morto e o ícone `SvgHelp` foram removidos.
- **Progressão / Em Destaque / Medalhas sem tela**: o grupo Progressão agora resolve para conteúdo real; Destaque ganhou prévia ao vivo e cartões de estatística com check; Medalhas deixaram de ser um mock de 4 emojis.

### Verificação

`npx tsc -b` OK · `npx oxlint src` 0 erros · `npm run build` OK · `npm run lint:docs` OK. No navegador (modo teste), o hub Meu Perfil abriu na raiz, a busca filtrou “Perfil” e o tile Ajuda não aparece mais em Configurações.

**Limitações**: a revisão visual das novas telas ficou incompleta porque a aba do navegador estava `hidden` (as animações do `AnimatePresence` não avançaram); os convites de ofensiva dependem de aplicar `20261109_streak_invites.sql` no Supabase e de duas contas amigas para o ciclo completo convite → mensagem → aceite. Sem nuvem/sessão, o painel mostra o aviso de conexão e não inventa convites.

## [v4.73.1] - 2026-11-09

**Estandartes do perfil sem faixas pretas, Maestria Geral e Sequências repaginadas, conquistas de Emblemas na aba Progresso, skins dos cards em Cartões, Modo Desenvolvedor na nuvem e cronômetro escolhido no Modo Foco.**

### Added

- **Progresso → Emblemas**: o card **Emblemas** agora abre a interface de **Conquistas de Estandartes** (`features/training/EstandartesOverlay.tsx` + `estandartes-achievements.css`), em vez do Perfil. A tela mostra “X de 16 estandartes”, barra da coleção, seções **Conquistados** e **Bloqueados** e o requisito completo de cada estandarte ao tocar nele — treinos concluídos, dias de ofensiva, XP ou maestria (Bronze/Prata/Ouro), com valor atual, meta, barra de progresso e quanto falta. Usa as mesmas regras de `isUnlocked` do jogo e respeita o Modo Desenvolvedor.
- **Maestria Geral**: novo hero de rank (título, nível e progresso em pontos), resumo de emblemas Bronze/Prata/Ouro por exercício e cards com selo do tier, nome, barra de sessões até o próximo marco e estado **Maestria plena**. Um componente local de imagem passou a tratar `onError`/URL ausente com placeholder “Sem imagem” (antes o card ficava com o ícone quebrado do navegador).
- **Arquivos novos**: `features/training/EstandartesOverlay.tsx`, `features/training/estandartes-achievements.css` e `legacy-style/treino/maestria-geral.css`.

### Changed

- **Estandartes do perfil**: a galeria ficou compacta (2 colunas no mobile, cards de ~129×147 px com ícone de 46 px) e sem as faixas pretas no topo/rodapé — o fundo agora é o próprio tema, com o círculo do ícone em degradê suave. Estandartes bloqueados não escurecem o card inteiro: só o ícone fica apagado, mantendo nome e requisito legíveis.
- **Skin dos Cards**: saiu da sub-aba **Skins de Torre** (removida) e passou para **Cartões**, logo abaixo dos banners. A opção **Nenhum** é a primeira e o padrão; `default`/vazio são normalizados para `none`. A skin vale para `.ex-card` (Exercícios), `.deck-card` (deck da ficha e coleção), `.deck-list-item` (visão em lista) e `.profile-header` (cartão do Perfil), incluindo o mobile.
- **Sequências (Central de Ofensivas)**: acentos roxos substituídos por preto/branco e fundo em camadas (brilho quente, malha fina e vinheta). O hero deixou de ser esmagado pelo flex da lista (50 px) e voltou a mostrar chama, contador, título e subtítulo completos.
- **Modo Foco**: com o descanso rodando, o timer exibido abaixo do GIF usa o estilo escolhido pelo usuário em Personalizar (Radar Tático ou Ampulheta) via `TimerVisual`/`readTimerStyle`, mantendo o tempo mm:ss e o rótulo DESCANSO.
- **Modo Desenvolvedor**: `academia_dev_mode` entrou em `PREF_KEYS_TO_SYNC`; o snapshot leva a configuração para a nuvem e, ao receber um pull, o Perfil reage a `academia:prefs-changed` atualizando o toggle.

### Fixed

- **Segurar um exercício em Minha Ficha**: o card não encolhe mais (`transform: none` em `.deck-card.dragging`, `.deck-list-item.dragging` e no toque do slot).
- **Maestria individual**: a base do emblema não é mais cortada — o escudo ganhou respiro inferior e a imagem usa `object-position: center top`.
- **Detalhes do exercício**: o estado “Nenhuma carga registrada ainda” perdeu o pontilhado ao redor.

### Verificação

`npx tsc -b` OK · `npx oxlint src` 0 erros (39 avisos) · `npm run build` OK · `npm run lint:docs` OK.

No navegador: a interface de Conquistas abriu com **1/16** estandartes, seções Conquistados/Bloqueados e a folha de requisitos de “Dedicado” (0/10 treinos, “Faltam 10 treinos”); a Maestria Geral mostrou rank PRATICANTE, 0 pts, resumo 0/0/0 de 66 exercícios e cards com tier/progresso, e forçar uma URL inválida trocou a imagem pelo placeholder; a galeria de Estandartes computou cards de 129×147 px com ícone de 46 px e sem faixas pretas; a sub-aba Cartões exibiu **Nenhum** ativo e seis skins, sem nenhum bloco de Skins de Torre; com `data-card-skin="neon"` os `.deck-card` e `.ex-card` passaram a computar borda `rgba(6, 182, 212, 0.35)`; e a Sequências voltou a renderizar o hero completo (190 px) após o `flex-shrink: 0`.

**Limitações**: o Modo Foco não foi aberto nesta rodada — o timer foi validado por código/CSS (renderiza só com `restTimeRemaining > 0`, abaixo do GIF, a 52 px); a sincronização do Modo Desenvolvedor foi conferida na lista de chaves e no listener, sem um ciclo real de pull entre dois dispositivos; e o teste de segurar o card não foi repetido (a correção de `transform` já estava aplicada e o ambiente está com `prefers-reduced-motion`).

## [v4.73.0] - 2026-11-09

**Cronômetro com prévias reais, evolução de carga no padrão dos Detalhes de Volume, calculadora de carga, aba Emblema repaginada, menu de compartilhamento na prévia do treino e transição suave nas missões.**

### Added

- **Prévia do treino (Início) → menu**: o botão de menu do seletor de fichas agora abre as ações **Copiar Ficha**, **Mostrar na Guilda** e **Link** (mesmas funções da aba Minha Ficha: clipboard `academia_clipboard_sheet`, `academia_guild_shared` e URL `?share=`), com toasts de confirmação. O menu reutiliza o painel `MontarMenuModal` (novo `mode="share"` + `anchorId`).
- **Aba Emblema**: cabeçalho “Sua identidade” com prévia do avatar, card de foto com selo **Padrão/Personalizada** e molduras apresentadas como **miniaturas reais do avatar** (anel Bronze/Prata/Ouro/Elite, check na equipada), com contagem de estilos. Em telas estreitas o card de foto empilha para o botão não quebrar.
- **Transição das missões**: a troca entre **Diárias / Semanais / Passe Royale** usa `AnimatePresence` com fade + deslize curto (0,22 s) em vez do corte seco.
- **Arquivos novos**: `features/workout/timer-visuals.tsx` (visuais compartilhados do cronômetro), `features/workout/treinos/EvolucaoCargaPanel.tsx` e `evolucao-carga.css`.

### Changed

- **Estilo do Cronômetro**: **Cyber Relógio** e **Arcade Bit** foram removidos da customização (sobram Radar Tático e Ampulheta); uma skin antiga salva cai no Radar. As prévias deixaram de ser ícones/fallback e usam o **mesmo componente do cronômetro real** — o Radar mostra o arco verde de 68% e a Ampulheta mostra a areia no nível correspondente.
- **Detalhes do exercício → Evolução de Força (Carga)**: refeita no padrão dos **Detalhes de Volume** da aba Progresso — três cards de resumo (Carga atual, Recorde e Variação %), gráfico de linha em SVG com média/recorde e lista do histórico (data, barra proporcional, carga e delta por registro). Sem histórico, o estado vazio explica a evolução e mantém o campo **Carga** com a sugerida como placeholder.
- **Calculadora de 1RM** passou a se chamar **Calculadora de Carga** (resultado “Carga máxima estimada (1RM)”). Os atalhos de repetições agora são **1, 3, 5, 10, 15, 20 e 30** (saíram 8 e 12); acima de 12 repetições o aviso de superestimativa continua aparecendo.
- **Prévia do treino (Início)**: o alternador **Grid/Lista** foi removido do cabeçalho do seletor; ficam apenas as abas A–J, o botão de alternar ficha e o menu.

### Verificação

`npx tsc -b` OK · `npx oxlint src` 0 erros · `npm run build` OK · `npm run lint:docs` OK.

No navegador: a customização mostrou **2** estilos de cronômetro (sem Cyber/Arcade) com Radar computando `conic-gradient(... 68%)` e Ampulheta com `clip-path: inset(32% 0 0 )`; a Evolução de Força exibiu 3 registros (45/40/35 kg), variação **+29%**, 3 pontos no SVG e linhas “09/11 45 kg +5 kg”, “26/10 40 kg +5 kg”, “12/10 35 kg inicial”; a calculadora mostrou o título novo e os chips 1/3/5/10/15/20/30; a prévia do treino não tinha mais `#dashMiniViewGrid`/`#dashMiniViewList` e o menu abriu Copiar Ficha / Mostrar na Guilda / Link (copiar gravou os 5 ids da ficha e a guilda recebeu a ficha A); a aba Emblema renderizou o hero, as 5 molduras com avatar/anel/check em 3 colunas; e as 3 abas de missões alternaram sem erros no console. Dados de teste (histórico de `ex-a1`, entrada na guilda e modo desenvolvedor) foram revertidos.

**Limitações**: este ambiente está com `prefers-reduced-motion`, então a animação de fade/deslize das missões não pode ser observada visualmente (o código respeita a preferência e troca na hora); e **Skin dos Cards** continua sem efeito na coleção/deck ou no mobile — ela só pinta os `.ex-card` do modo **Grid** da sub-aba Exercícios no desktop.

## [v4.72.5] - 2026-11-09

**Segurar o exercício sem encolher, carga registrada direto na Evolução de Força, preferências completas na nuvem, estandartes em SVG branco e o preto único de Minha ficha / Personalizar.**

### Added

- **Evolução de Força (detalhe do exercício)**: quando o exercício ainda não tem histórico, o campo **Carga** do editar exercício aparece logo abaixo do aviso “Registre sua evolução…” — input numérico com o **kg** fixo ao lado, placeholder com a carga sugerida (“Sugerido: 30”) e botão Salvar. A carga é gravada no exercício junto com a entrada do histórico (mesmo `buildHistorico` do formulário), então o gráfico aparece na hora, sem sair do detalhe.
- **Preferências na nuvem**: o snapshot de sincronização passou a enviar **todas** as preferências de `PREF_KEYS` (lembrete de treino e horário, música do treino, bloqueio do app, timeout/biometria, papéis de parede do lock, navbar, notificações, sons, vibração, mensagens, online) mais o player flutuante (`enabled`/gaveta/espessura/altura), `academia_lang` e a ordenação de músicas. A tela de Configurações também reflete essas chaves ao receber um pull (`prefs-changed`, `player-prefs-changed`, `lock-prefs-changed`).

### Changed

- **Minha ficha**: o fundo do deck e da coleção passou do roxo translúcido (`var(--card-bg)`) para o **mesmo preto da aba Personalizar** (`#0b0b10`), com a mesma hairline de `#tab-exercicios`.
- **Estandartes**: os 16 emblemas de perfil deixaram de ser emoji e agora são **SVGs brancos** (`currentColor` + `#fff`), no mesmo círculo escuro do fundo; o tamanho foi ajustado para 22 px (26 px nos 3 slots do cartão de perfil).
- **Molduras de avatar**: a grade da sub-aba Emblemas passou a mostrar **3 molduras por linha** (antes 4).
- **Sub-aba Cartões**: usa o fundo `theme-cinza-castelo`, o mesmo da sub-aba **Estilo das Barras de Progresso** (antes `theme-roxo`).
- **Arrastar da coleção para o deck**: o card não encolhe mais ao ser segurado (`.collection-card.dragging` ficou sem `scale(0.95)`; só o cursor e a leve transparência mudam).

### Verificação

`npx tsc -b` OK · `npx oxlint src` 0 erros (38 avisos de linha de base) · `npm run build` OK · `npm run lint:docs` OK.

No navegador (1280×900): o menu do card no deck abriu com apenas **Detalhes | Remover**; `#tab-montar` (container, header, deck e coleção) computou `rgb(11, 11, 16)`; `.collection-card.dragging` computou `transform: none` e `opacity: 0.6`; a sub-aba Cartões computou `theme-section theme-cinza-castelo`; os 16 estandartes renderizaram `<svg>` com `color: rgb(255, 255, 255)`. Em Detalhes → Evolução de Força de um exercício sem carga, o campo apareceu com “Sugerido: 30”; salvar “45” criou a barra “45 kg · 09/11” no gráfico e a carga foi revertida no IndexedDB depois do teste.

## [v4.72.4] - 2026-11-09

**Deck enxuto, troca com o exercício em destaque abaixo do deck e Cronograma nas Configurações.**

### Added

- **Configurações → Cronograma**: novo tile com sete opções de frequência esperada (1 a 7 dias, com 2 e 3 marcados como **Recomendado**) — a mesma pergunta do formulário pós-login. O valor já salvo aparece selecionado e o badge do tile mostra “N×/semana”; a escolha grava em `customization.trainingFrequencyDays` e passa a alimentar a meta semanal do Início/Progresso.
- **patchLegacyProfileCustomization()** (`core/db/legacy-state.ts`): merge parcial em `profileCustomization` da cópia bruta legada, porque `weeklyTarget` lê `legacy.profileCustomization.trainingFrequencyDays` — `patchLegacyState` sozinho substituiria o objeto inteiro.

### Changed

- **Cards do deck**: o menu do card no deck (grid e Clash Royale) ficou só com **Detalhes** e **Remover** — os botões de **Edição** e **Maestria** foram removidos. No modo lista o item perdeu o lápis e manteve apenas o X de remover. A edição de exercício continua na aba PERSONALIZAR → Exercícios, e a maestria geral segue no rodapé do deck.
- **Deck cheio (“Adicionar ao deck”)**: a tela agora rola até o deck e o exercício escolhido aparece **em destaque logo abaixo dos 8 slots**, no mesmo desenho do card do deck, com “Selecione o exercício a ser substituído” e o botão Cancelar ao lado. O toque num exercício do deck conclui a troca e a coleção volta a ser exibida no topo da tela; `ESC`/`Cancelar` desfazem sem rolar. A rolagem respeita `prefers-reduced-motion`.

### Verificação

`npx tsc -b` OK · `npx oxlint src` 0 erros (38 avisos de linha de base) · `npm run build` OK · `npm run lint:docs` OK.

No navegador (362×623, deck com 8 exercícios): o menu do card do deck mostrou só “Detalhes” e “Remover”; no modo lista, só o botão de remover. “Adicionar ao deck” com o deck cheio rolou até o deck e o painel abaixo dos slots apareceu com a miniatura de Crucifixo (54×97 px) e o texto de seleção (painel de 119 px, dentro da tela). Tocar no primeiro slot trocou “Supino Articulado” por “Crucifixo” (deck segue com 8) e a coleção voltou ao topo; Cancelar fechou o painel sem alterar o deck. Em Configurações → Cronograma, as 7 opções apareceram com “3 dias por semana” pré-selecionado; escolher 5 mostrou o toast, gravou `trainingFrequencyDays = 5` em `profileState` e em `legacyState` (badge “5×/semana”) e, após recarregar, a opção 5 continuou marcada. Deck e frequência de teste foram restaurados ao estado anterior.

## [v4.72.3] - 2026-11-09

**Coleção no modo deck: menu só no toque, com um botão de adicionar que substitui a carta escolhida quando o deck está cheio — e o “kg” do campo Carga virou sufixo fixo.**

### Added

- **Adicionar ao deck**: a coleção no modo deck ganhou um botão explícito para incluir o exercício no treino. Tocar no card não inclui mais nada — abre o menu, como no card do deck.
- **Troca com o deck cheio**: com os 8 exercícios preenchidos, o botão de adicionar deixa o exercício pendente e a barra “Trocar por X — toque no exercício do deck que vai sair” aparece acima do deck. O toque num card do deck substitui aquele slot (o deck continua com 8), com aviso “Y saiu: entrou X”. `ESC` ou `Cancelar` desfaz.

### Changed

- **Menu do card da coleção**: abre no toque e traz só **Detalhes** e **Adicionar ao deck**. Maestria, Edição e Excluir saíram desse menu — continuam no modo compacto da coleção (ícones e menu de sempre).
- **Altura dos cards**: com a barra de ações fixa embaixo do card fora de cena, o card da coleção no modo deck voltou a ter exatamente a altura do card do deck (medido: 123 px nos dois, a 362 px de largura).
- **Campo Carga (novo/editar exercício)**: agora tem a unidade fixa ao lado — digitar troca só os números e o **kg** fica no lugar. A sugestão continua aparecendo no placeholder (“Sugerido: 30”). Cargas sem número (ex.: “Peso do Corpo”) seguem em texto livre.

### Fixed

- **Arrastar para um deck cheio**: soltar um exercício da coleção sobre um slot ocupado substitui o exercício daquele slot, em vez de recusar com “Máximo de 8 exercícios atingido”.

### Verificação

`npx tsc -b` OK · `npx oxlint src` 0 erros (38 avisos de linha de base) · `npm run build` OK · `npm run lint:docs` OK.

No navegador (viewport 362×623, deck em 5 exercícios): tocar num card da coleção abriu o menu abaixo dele sem alterar o deck; “Adicionar ao deck” levou a 6 e marcou o card como “no treino”; preenchendo até 8, o próximo “Adicionar” mostrou a barra de troca e o toque no primeiro card do deck deixou “Supino Articulado saiu: entrou Abdução Solo” com o deck ainda em 8; `Cancelar` fechou a barra sem mudar o deck; tocar fora do card fechou o menu. Alturas: card da coleção 123,1 px × card do deck 122,9 px. No modal de edição, o campo Carga mostrou `30` + `kg` fixo, aceitou “45 kg” digitado virando `45` (com o `kg` no lugar) e o wrapper ficou em 88×45 px sem overflow.

## [v4.72.2] - 2026-11-08

**Coleção no modo deck com as ações rotuladas abaixo do card, splash no tamanho certo, repetições centralizadas na calculadora e Modo Foco limpo (sem seletor de ficha, descanso só depois da série e GIF maior).**

### Added

- **Minha coleção (modo deck)**: cada card agora tem, ABAIXO dele, uma barra com as ações rotuladas **Detalhes · Edição · Maestria · Excluir**, no mesmo desenho do menu do card do deck (fundo escuro, borda da cor do tema). A ação de maestria é nova na coleção e abre o mesmo modal do deck (`useMaestriaUi.openMaestriaEx`).

### Changed

- **Calculadora de 1RM**: os atalhos de repetições (1/3/5/8/10/12) ficam centralizados; em tela estreita eles quebravam em duas linhas alinhadas à esquerda.
- **Modo Foco — GIF**: altura máxima do GIF subiu de 44vh para 56vh (200px → 260px no celular). O `object-fit: contain` continua definindo a proporção, então nada é esticado nem cortado.
- **Interface de treino**: o seletor de ficha (`Treino: A | B | C…`, ids `#selBtnA`…) saiu do cabeçalho da Ficha — a ficha exibida é sempre a do dia, e a barra ficou com Menu, alternância tabela/grid e INICIAR TREINO.

### Fixed

- **Imagem de carregamento**: a splash usava a arte em tamanho natural, repetida e cortada. O `background-size/position/repeat` da classe `.splash-screen__art` precisa de `!important` porque o `<style>` do `index.html` é lido antes do CSS do app, e o shorthand `background` de `.splash-screen__bg` (8-customizacao.css) resetava esses valores. Agora a arte entra em `contain`, centralizada e sem repetir, já no primeiro paint.
- **Modo Foco — descanso**: o timer só aparece com o descanso rodando (depois de marcar uma série); antes ficava fixo em `00:00` em todo exercício.
- **Modo Foco — carga**: a linha “Peso inicial sugerido: X” saiu; a carga sugerida já é mostrada no valor e no rótulo **CARGA SUGERIDA** logo acima.
- **Coleção no modo deck**: os ícones inline de detalhes/edição continuavam visíveis porque o `display: inline-flex` inline vencia a regra `.collection-grid--deck .btn-ex-edit-inline { display: none }` — agora eles nem são renderizados nesse modo.

### Verificação

`npx tsc -b` OK · `npx oxlint src` 0 erros (38 avisos de linha de base) · `npm run build` OK · `npm run lint:docs` OK.

No navegador (viewport 362×623): splash com `background-size: contain`, `position: 50% 50%` e `no-repeat`; coleção no modo deck com cards 68×123 px (iguais aos do deck) e barra de ações de 68×103 px logo abaixo, sem ícones inline; no Modo Foco o timer não existia ao abrir e apareceu com `00:30 DESCANSO` depois de marcar a série 1, sem a linha de peso sugerido e com `max-height: 260px` no GIF; o Detalhes da coleção abriu o modal do exercício. A Ficha abriu sem o seletor de ficha no cabeçalho.

## [v4.72.1] - 2026-11-08

**PWA confiável sem internet (o login deixou de tomar a tela), splash sem o reescalonamento da arte, calculadora de 1RM redesenhada, Sequências acessível pelo Início com transições suaves, Ficha com entrada/saída mais suave e Minha coleção no modo deck igual ao deck no celular.**

### Added
- `src-app/src/features/social/share-invite.ts` — helper `shareFriendInvite(name?)` com o convite de amigo (Web Share → área de transferência → toast), extraído do card de Atividade porque a mesma tela passou a ser aberta por dois lugares.
- `src-app/src/features/training/rm-calculator.css` — estilos BEM da calculadora de 1RM (`.rm-calc`, `.rm-fields`/`.rm-field__input`/`__unit`, `.rm-chips`/`.rm-chip`, `.rm-result`, `.rm-table`/`.rm-row`, `.rm-note`), com `prefers-reduced-motion`.
- `src-app/src/features/workout/ficha-motion.css` — transição do overlay da Ficha: entrada de 0,42 s (fade + subida de 18 px, `cubic-bezier(0.22, 1, 0.36, 1)`), saída de 0,24 s casada com os 240 ms do `closeFichaAnimated` e entrada em cascata do hero e do corpo da ficha (`fill: backwards`, sem deixar `transform` pendurado).

### Changed
- `src-app/src/core/auth/auth-context.tsx` — boot **offline-first**: o snapshot `mbc_offline_user` assume na hora quando `navigator.onLine === false`; com conta em cache, `getSession()` corre contra um timeout de 2,5 s (8 s sem cache) e, se não houver sessão, uma sonda `HEAD /index.html?ping=` decide entre seguir offline com o snapshot ou pedir login. A promise do `getSession()` continua observada em paralelo e troca a sessão offline pela real quando ela chega; `SIGNED_OUT`, o evento `online` e o `signOut` seguem com o comportamento anterior.
- `src-app/src/App.tsx` — novo `BootLoading({label})` reaproveitado pela checagem de sessão e pelo bootstrap: durante `authLoading` aparece **"Verificando sua conta"** (com o fundo da arena), nunca a tela de login. `DashboardFeature` recebe `onNavigate` para o link do calendário.
- `src-app/src/features/training/ProgressoFeature.tsx` + `rm-calculator.css` — calculadora de 1RM refeita: campos com sufixo de unidade (`KG`/`reps`) e `inputMode` numérico, chips de repetições (1/3/5/8/10/12), resultado em destaque com o resumo `80 KG × 10 repetições`, tabela de **Cargas de trabalho** (100 % a 70 % do 1RM com barra proporcional), aviso de Brzycki acima de 12 reps e validação explícita (carga > 0, 1–30 reps; aceita vírgula decimal). Ids `#calcWeight`/`#calcReps`/`#calcResult` mantidos. O convite de amigo passou a usar `shareFriendInvite` e a aba escuta `academia:open-progresso-calendar` para abrir o calendário vindo do Início.
- `src-app/src/features/training/OfensivasOverlay.tsx` + `ofensivas.css` — transições da tela de Sequências: a troca entre **Sequência Atual** e **Treinos** sai em 150 ms (`.of-panel.is-leaving`, `key` por aba) antes de entrar o novo painel, com `aria-pressed` nas abas; a folha inferior de informações passa a usar `usePresenceValue` e fecha animada (`.of-sheet.is-closing` + `of-sheet-down`, conteúdo preservado durante a saída).
- `src-app/src/features/dashboard/DashboardFeature.tsx` — o botão de **ofensiva do Início** (`#dashBtnOfensiva`) abre a Central de Ofensivas ("Sequências") com os dados do Dashboard, em vez de não fazer nada; "Abrir calendário" fecha a tela, navega para a Progresso e dispara `academia:open-progresso-calendar`; o convite usa o helper compartilhado.
- `src-app/src/features/workout/FichaFeature.tsx` — importa `ficha-motion.css`.
- `src-app/src/legacy-style/treino/secoes/deck-builder.css` — o modo deck da **Minha coleção** espelha o grid do deck (`#deckActiveGrid.royale-view`): **4 colunas em qualquer largura** (antes caía para 2 em ≤850 px), proporção **1/1.8** (era 1/1.35), tipografia do card royale (cabeçalho 0,6 rem, nome 0,75 rem, séries 0,65 rem) e o bloco de ≤430 px (gap 6 px, raio 12, nome em 2 linhas). Os dois ícones inline são ocultados nesse modo para a linha ficar só com "Séries: 3 × 10", como no deck (editar/detalhes seguem no modo compacto e na aba EXERCÍCIOS).
- `Diretrizes/system_map.json` (versão **4.72.1**) e este CHANGELOG.

### Fixed
- **Login impossível no modo offline após alguns dias** — o `getSession()` do supabase-js tenta renovar o token com backoff (até ~30 s) e, ao falhar sem rede, emite `SIGNED_OUT`; o `AppContent` renderizava `<AuthScreen />` tanto em `loading` quanto sem usuário, então o PWA instalado abria na tela de login e ficava inutilizável. Agora o snapshot da última conta entra imediatamente quando o navegador está offline, a espera pela sessão tem teto de 2,5 s e o intervalo de checagem mostra um carregamento em vez do login.
- **Imagem de carregamento "redimensionando" no boot** — duas causas somadas: `.lock__wall` rodava `lockWallZoom` (scale 1 → 1,05 em 15 s) sobre a MESMA arte da splash e o `transition: background .3s` de `.splash-screen__bg` também animava o `background-size` (auto → contain), então a arte aparecia em tamanho natural e encolhia nos primeiros 300 ms. A animação do lock saiu (e o fundo ficou `contain`, igual ao `screenBackgroundStyle`) e a splash aplica `backgroundImage` + a classe `.splash-screen__art` (`contain`/`center`/`no-repeat`/`#000`, `transition: none`) no mesmo passo.
- **Minha coleção "modo deck" não parecia o deck** — era 2 colunas de 1/1.35 no celular contra 4 colunas de 1/1.8 no deck. Agora as duas grades medem o mesmo (68,4 × 123,1 px na coleção e 67,4 × 122,9 px no deck em 362 px de largura).

### Verificação
- `npx tsc -b` OK · `npx oxlint src` 0 erros (38 avisos de linha de base) · `npm run build` OK · `npm run lint:docs` OK.
- Navegador (dev server Vite, modo teste): coleção no modo deck em **4 colunas** de 68,4 × 123,1 px contra 67,4 × 122,9 px do deck; `#dashBtnOfensiva` abre a Central de Ofensivas, a aba Treinos aplica `.of-panel.is-leaving` e troca após 150 ms com `aria-pressed` correto, e a folha inferior fecha com `of-fade-out` + `of-sheet-down` antes de desmontar; o overlay da Ficha entra com `fichaOverlayEnter`/`fichaContentEnter` e sai com `fichaOverlayLeave` (o navegador de teste tem `prefers-reduced-motion: reduce`, então as durações aparecem zeradas pelas regras de acessibilidade).
- O modo offline real (dias sem rede, token vencido) **não foi reproduzido** nesta sessão: a lógica foi revisada e o caminho online validado; a confirmação final depende de abrir o PWA instalado sem sinal.

## [v4.72.0] - 2026-11-07

**Layout mobile escalável de 320 a 600 px: a tabela da Ficha passa a caber sem rolagem lateral e hero, deck e rodapé de métricas não estouram mais em telas médias e pequenas.**

### Changed
- `src-app/src/styles/mobile-fit.css` — saiu a lógica “um breakpoint por aparelho” e entrou escala fluida (`clamp()`/`vw`) para o intervalo 320–600 px:
  - **largura útil**: `.treino-container` e `.ficha-overlay .treino-container` trocaram o `padding: 0 24px` fixo por `clamp(12px, 4.2vw, 24px)` (ganho de ~18 px de conteúdo em 360–390 px), e o cabeçalho do deck (`.deck-header` 10/12 px, `.deck-header-top` gap 8 px, `.header-right` gap 8 px, `.view-selector` padding 3 px) deixou de empurrar o último botão de visualização para fora da tela;
  - **hero**: `min-height: clamp(300px, 46vh, 420px)`, título/subtítulo em `clamp()` e as três estatísticas (`.treino-hero-stats` com `gap` fluido + `nowrap`, `.h-stat-val`, `.h-stat-lbl`, `.h-stat-div` proporcionais) param de quebrar “Dias Seguidos” para outra linha;
  - **cabeçalho da Ficha**: `.ficha-right` ocupa a largura toda e quebra em linhas alinhadas, o rótulo “Treino:” (que sobrava órfão numa terceira linha) fica oculto em ≤430 px, as letras A/B vão para a direita e `.ficha-left` ganha `row-gap`;
  - **tabela da Ficha (≤430 px)**: `th/td` com `padding: 10px 6px`, `th` com `white-space: normal`, colunas `.col-n 24 / .col-img 46 / .col-vol 64 / .col-chk 32`, miniatura 40 px, `.row-num` 22 px, `.ex-name` 0.8 rem e a grade de séries em 2×2 de 24 px (gap 4) — era ela, em 66 px, que forçava a coluna de volume a ~98 px; em ≤340 px a coluna de imagem é ocultada para o nome do exercício não ficar ilegível;
  - **deck e rodapé (≤430 / ≤360 px)**: `min-width: 0` em toda a cadeia dos cards (`.deck-card`, `-info`, `-name`, `-meta-row`, `-actions`, `.series-wrap-deck`), botões de série 22→20 px, `.deck-footer`/`.deck-volume`/`.deck-cardio`/`.deck-maestria-widget` com padding menor e `.footer-stat-label` com `letter-spacing` reduzido (o “Volume Médio de Carga” voltou a caber); `#deckCollectionSearch` perdeu o `width: 200px` inline e ocupa a linha;
  - **telas baixas** (altura ≤560 px, ex. celular deitado com o teclado aberto): hero sem `min-height`, tipografia e `.bottom-nav` compactas.
- `Diretrizes/system_map.json` (versão **4.72.0** + `styling_manifest`) e este CHANGELOG.

### Fixed
- **Tabela da Ficha cortada (“VOLU…”)** — as 5 colunas pediam ~469 px e o wrapper tinha 304 px em 360 px (328 px em 384 px), então Volume e ✓ saíam da tela e a tabela só era alcançável arrastando de lado, sem nenhuma indicação visual. Agora a tabela preenche exatamente o wrapper: 285 px em 320, 322 px em 360, 344 px em 384 e 386 px em 430 — sem rolagem horizontal.
- **Estatísticas do hero quebradas** — com `gap: 32px` e valores em `2rem` fixos o terceiro número descia para uma segunda linha em 360–390 px; agora as três ficam na mesma linha em todas as larguras testadas.
- **Deck mais largo que a tela** — a grade Royale é `repeat(4, 1fr)`, mas sem `min-width: 0` nos filhos a coluna parava de encolher e o deck vazava para os dois lados (as bordas dos cards apareciam cortadas nas imagens do A54); o rodapé de métricas também voltou a caber inteiro.
- **Cabeçalho do deck com o botão de visualização cortado** em 320 px (`header-right` terminava 2 px fora da viewport).

### Verificação
- `npx tsc -b` OK · `npm run build` OK · `npm run lint:docs` OK.
- Medições no navegador (dev server Vite): em **430 px** tabela 386/386 px, hero em 1 linha; em **384 px** tabela 344/344 px, grade do deck 316 px sem overflow, hero em 1 linha; em **360 px** tabela 322/322 px; em **320 px** tabela 285/285 px (coluna de imagem oculta), `scrollWidth === 320` no documento e nenhum elemento da aba Treinos fora da viewport.

## [v4.71.0] - 2026-11-05

**Social com linguagem de treino (sem “partidas”) e amigos/guildas sincronizados entre dispositivos.**

### Changed
- `src-app/src/features/social/LigasFeature.tsx` — o convite da liga semanal passou de **“JOGUE E DISPUTE!”** para **“TREINE E DISPUTE!”** (com o texto de apoio falando de pontos ganhos nos treinos); **“Simular Partida”** virou **“Simular Treino”** no controle semanal e **“Simular Treino Mensal”** no mensal, e o texto do mensal deixou de citar Tetris/jogar. As mensagens de fim de temporada também falam de treinos em vez de batalhas/partidas. Ao adicionar um resultado da busca de amigos, além da lista local, o app registra o convite em `friendships` (quando há conta + nuvem) para a amizade chegar aos outros dispositivos.
- `src-app/src/features/social/FriendQrModal.tsx` + `friend-search.ts` — a aba/aria/estados do modal **Adicionar Amigos** falam **“Buscar usuário”**, “Buscando usuários…”, “Nenhum usuário encontrado…” e “Pesquisar usuário…”; o fallback de nome também virou **“Usuário”**.
- `src-app/src/core/sync/sync-manager.ts` — o snapshot agora inclui o **estado das guildas** (`academia_guilds_v1`) e o **código permanente de convite** (`academia_friend_code_v1`), além dos amigos que já existiam; ao aplicar um snapshot remoto, a guilda e o código são gravados no `localStorage` e os eventos `academia:guild-changed`/`academia:friends-updated` atualizam a UI. O motor escuta `academia:guild-changed` para publicar a mudança, e a assinatura canônica ignora `updatedAt`/`originDeviceId` (campos voláteis), então o snapshot aplicado não volta à nuvem como se fosse alteração local. Amigos são unidos por `id` (um snapshot antigo não apaga um amigo novo) e o estado de guilda carrega `updatedAt` para o merge “mais novo vence” entre aparelhos; se o snapshot remoto for mais antigo, o merge local é republicado.
- `src-app/src/features/social/guild-data.ts` — `GuildState` ganhou `updatedAt`, carimbado em toda escrita (`writeGuildState`) para o desempate entre dispositivos.
- `Diretrizes/system_map.json` (versão **4.71.0**), `context.md` e `RELATORIO-PENDENCIAS.md` (amizades/guildas agora sincronizam), além deste CHANGELOG.

### Fixed
- **Amigos e guildas não apareciam em outros dispositivos** — entrar/criar/sair de guilda e adicionar amigo por QR/link/busca ficava só no `localStorage` do aparelho, porque a guilda não entrava no snapshot e o código de convite não era sincronizado. O snapshot inicial também passou a ser publicado após a checagem remota, garantindo que os dados sociais locais subam mesmo sem uma alteração de treino posterior.
- **Ping-pong de sincronização** — o snapshot era comparado incluindo `updatedAt` (novo a cada build) e `originDeviceId` (diferente por aparelho), então todo snapshot recebido era reenviado. A comparação agora usa apenas o conteúdo real.
- **Mudança de guilda não era publicada** — `guild-data.ts` despacha `academia:guild-changed` em `window`, mas o motor escutava em `document` (e o snapshot aplicado despachava em `document`, sem chegar a `useGuildState`). Agora o motor escuta em `window` e o evento aplicado borbulha (`bubbles: true`). Snapshot legado sem `friends`/`guilds` também não apaga mais os dados sociais locais: eles voltam para a nuvem no push seguinte.

### Verificação
- `npx tsc -b` OK · `npx oxlint src` 0 erros · `npm run build` OK · `npm run lint:docs` OK.

## [v4.70.0] - 2026-11-03

**Tela de bloqueio e carregamento passam a usar somente a arte padrão: a personalização de background (presets, upload e URL) saiu do produto.**

### Changed
- `src-app/src/features/settings/SettingsFeature.tsx` — saíram o card **Papéis de Parede da Tela de Bloqueio** (presets neon/grafite/violeta/magenta), os campos de upload/URL e a seção **Telas Personalizadas** de Configurações → Cores; o texto do tile de Segurança e a busca não falam mais em wallpaper.
- `src-app/src/features/lock/LockScreen.tsx` — o fundo é sempre `defaultScreenImage(portrait)` (LoadingVertical no retrato, LoadingHorizontal na paisagem) em `contain` sobre preto; os estados de wallpaper e a leitura de `mbc_lock_*` foram removidos, então valores antigos no `localStorage` são ignorados.
- `src-app/index.html` — a splash não lê mais `mbc_loading_*`: usa sempre `#splashDefaultPortrait`/`#splashDefaultLandscape` em `contain`.
- `src-app/src/lib/screen-defaults.ts` — `screenBackgroundStyle(image)` não tem mais o parâmetro `custom` e sempre devolve `contain`.
- `src-app/src/core/sync/sync-manager.ts` — as imagens `mbc_*` saíram do snapshot de sincronização (`CUSTOM_SCREEN_KEYS` removido); snapshots antigos não afetam mais bloqueio/splash.
- `src-app/src/features/search/search-index.ts` — removida a entrada **Telas Personalizadas** e “wallpaper” do texto de Segurança.
- Removidos por ficarem sem uso: `src-app/src/features/sync/ScreensCustomizationPanel.tsx`, `src-app/src/features/sync/AppLoadingScreen.tsx` e `src-app/src/features/lock/lock-wallpapers.ts`.
- `Diretrizes/system_map.json` (versão **4.70.0**) e `Diretrizes/DESIGN.md` (§16.3/§16.7).

### Verificação
- `npx tsc -b` OK · `npx oxlint src` 0 erros (38 avisos, linha de base) · `npm run build` OK · `npm run lint:docs` OK.
- Navegador: Configurações (hub e **Segurança**) sem “Papéis de Parede”, “Telas Personalizadas”, upload/URL ou “wallpaper”; com `mbc_lock_mobile`/`mbc_lock_desktop` apontando para uma URL falsa, o bloqueio renderizou `LoadingVertical.png` em `contain` (sem a URL falsa); o `/index.html` servido não contém mais `mbc_loading` e a splash usa `contain`.

## [v4.69.1] - 2026-11-03

**Social sem contadores zerados e sidebar sem número de XP/nível, com a ofensiva no ícone do site.**

### Changed
- `src-app/src/features/social/LigasFeature.tsx` — a seção **Amigos on-line** só é renderizada quando existe pelo menos um amigo online (sumiu o texto “Nenhum amigo on-line agora.”) e o contador da **Classificação** só aparece com 1+ amigos — nada de selo “0”.
- `src-app/src/components/DesktopSidebar.tsx` — o cabeçalho deixou de exibir **“Nível N”** e **“N/100 XP · N total”**; a ofensiva continua no `SvgFlame` do site, com os dias (a barra de progresso do nível permanece, sem números).
- `src-app/src/components/MobileDrawer.tsx` — o emoji 🔥 virou `SvgFlame` (mesmo ícone stroke do site) e saíram “Nível N” e “N XP”; a meta do perfil mostra só a ofensiva. `styles/shell.css` ajusta `.mdw__streak` (inline-flex, acento) e o SVG em 12 px.
- `Diretrizes/CHANGELOG.md`, `Diretrizes/system_map.json` (versão **4.69.1**).

### Verificação
- `npx tsc -b` OK · `npx oxlint src` 0 erros (38 avisos, linha de base) · `npm run build` OK · `npm run lint:docs` OK.
- Navegador 1440×900: `.side-hud__level` ausente, `.side-hud__xp-meta` = “0d” e o SVG da ofensiva presente; Social sem `.soc-friend-group__count` (0) e sem o texto de amigos on-line vazio.
- Navegador 390×844: drawer aberto com `.mdw__meta` = “0d”, sem 🔥, com o SVG do site e sem “Nível”/“XP” no cabeçalho do perfil.

## [v4.69.0] - 2026-11-03

**Aba Social volta ao desenho anterior: guilda no topo, classificação de amigos e ligas com o XP real dos treinos; o simulador fica restrito ao modo desenvolvedor.**

### Added
- `src-app/src/features/social/RankingsSimulator.tsx` — overlay de Rankings do **modo desenvolvedor** (abas Jogadores / Clãs / Amigos com o placar de exemplo e os membros da guilda local), sem nenhuma chamada à nuvem. O Início escolhe este overlay quando `isDevMode()` está ativo e o `RankingsOverlay` real quando não está; os dois nunca aparecem juntos.
- De volta ao projeto (removidos na v4.66.0): `GuildPanel.tsx`, `GuildEmblem.tsx`, `guild-data.ts` e `social-data.ts`, além das funções de liga de `ligas-data.ts` e do desenho anterior de `MemberPopover.tsx`, `PlayerProfileModal.tsx`, `player-profile-data.ts` e `OverlayShell.tsx`.

### Changed
- `LigasFeature.tsx` — a aba Social voltou a ter **três sub-abas** (Amigos / Guilda / Liga), com o **banner da guilda no topo** (emblema, nome e membros; sem guilda, o cartão “Sem guilda” com o botão Guilda), a Aliança com **Amigos on-line** e **Classificação** no desenho anterior, o chat/detalhes da guilda e as ligas **semanal/mensal** com o Caminho das Divisões.
- Amigos da classificação agora são os **reais**: aceitos na nuvem (`friends_overview`) + amigos locais de QR/link. Os `INITIAL_FRIENDS` fictícios não voltaram; o rank, o nível e o XP vêm da conta.
- `social-cloud.ts` — novo `weeklyXpFromHistory` (10 XP por treino concluído na janela semanal). As ligas somam esse XP real ao placar (`leagueState.playerXp + realWeeklyXp` / `+ realMonthlyXp`), então **um treino concluído já aparece na classificação** mesmo sem partida simulada.
- `ligas-data.ts` / `useSocialCloud.ts` / `friend-invites.ts` — `FriendItem` voltou a ter `clan` e ganhou `monthlyXp`; os mapeamentos da nuvem e do QR/link preenchem `clan: null`.
- `DashboardFeature.tsx` — o item **Rankings** do menu do Início abre o simulador no modo desenvolvedor e o ranking real fora dele.

### Fixed
- **Avatar gigante na classificação de amigos** — a imagem do emblema era renderizada sem um contêiner de tamanho (a v4.66 trocou a linha por um wrapper sem dimensões). O desenho anterior foi restaurado com o avatar de 32 px dentro do círculo de 8×8, então a imagem volta ao tamanho certo em qualquer tela.
- **Rankings do menu do Início** — voltaram a abrir nos dois modos (simulador com o modo dev ativo; ranking real com ele desligado).

### Verificação
- `npx tsc -b` OK · `npx oxlint src` 0 erros (38 avisos, linha de base) · `npm run build` OK · `npm run lint:docs` OK.
- Navegador (modo teste, `http://localhost:5199`): Social com “SEM GUILDA” no topo, navegação Amigos/Guilda/Liga e as seções Aliança/Classificação (um amigo local de teste apareceu com o emblema em 26 px dentro do avatar de 32 px, sem a imagem gigante); a sub-aba Liga abriu a Divisão Bronze com o Caminho das Divisões e o botão Simular Partida, e a sub-aba Guilda abriu o estado vazio + “Procure ou forme uma nova guilda!”. Menu do Início → Rankings com `academia_dev_mode=true` abriu as abas Jogadores/Clãs/Amigos com o placar simulado e, com o modo desligado, abriu o ranking real (Jogadores/Amigos, estado vazio honesto sem conta na nuvem).

## [v4.68.1] - 2026-11-02

**Documentado o plano de modernização para o outro site que ainda usa HTML/CSS/JS vanilla.**

### Added
- `Planos/Modernização.md` — receita faseada (inventário → congelamento em `Legacy/` → scaffolding `src-app` → espelho de CSS → assets → shell → fatiamento do JS por feature → paridade visual em 7 viewports → PWA → deploy → docs), com regras invioláveis de design idêntico, instruções completas de PWA (manifest, precache enxuto, `runtimeCaching`, `beforeinstallprompt`, iOS, teste offline) e a lista de armadilhas do Workbox já enfrentadas aqui; Supabase/OAuth ficam de fora com os pontos de extensão preparados.

### Changed
- `Diretrizes/system_map.json` — plano registrado em `plans`.

### Verificação
- `npm run lint:docs` OK (caminho e propósito do novo plano validados).

---

## [v4.68.0] - 2026-11-02

**Layout deixa de estourar em telas estreitas (A54 ≈ 384–412 px, Poco F7 ≈ 412–430 px): rodapé de métricas, cards do deck, sub-abas e cronômetro global se ajustam entre 360 e 430 px.**

### Added
- `src-app/src/styles/mobile-fit.css` — folha só de media queries (600/430/360 px), sem tocar em telas largas: (1) `.global-timer` compacto no celular e, com o Modo Foco aberto, reposicionado via `body:has(#modalFocus)` para o título não ficar coberto; (2) `.deck-footer`/`.footer-stat` com `min-width: 0` e espaçamentos menores — os widgets de Volume, Maestria e Cardio tinham `min-width: 140px` cada e estouravam a largura (~508 px) cortando o CARDIO à direita; (3) cards do deck com tipografia fluida (`clamp`), `deck-card-meta-row` com quebra de linha (fim do “Carga: Peso do / Corpo” em três pedaços) e nome em 2 linhas no modo royale; (4) prévia do Início com nome em até 2 linhas no lugar das reticências; (5) sub-abas PERSONALIZAR/MINHA FICHA sem corte à direita; (6) cabeçalho da ficha com `flex-wrap` nos controles; (7) Modo Foco com paddings, título e barras de volume proporcionais; (8) ajustes extras em ≤360 px.

### Changed
- `src-app/src/main.tsx` — importa `styles/mobile-fit.css` por **último** (depois de `shell.css` e `modal-motion.css`), para vencer a cascata legada sem espalhar `!important`.

### Verificação
- `npm --prefix src-app run build` OK e as regras novas presentes no CSS gerado (`assets/*.css`).
- Sem verificação visual em aparelho nesta rodada: as correções atacam causas de estouro medidas no CSS (min-width, width 100% + padding, nowrap) e o clearance do cronômetro por `:has`.

---

## [v4.67.0] - 2026-11-01

**Notificações saem do navegador: push real com VAPID, Mensagens alimentadas por eventos reais, desativação de conta com 30 dias de carência e login por QR de uso único.**

### Added
- `supabase/migrations/20261102_push_pairing_account.sql` — três blocos: (1) `public.push_subscriptions` (endpoint único, p256dh/auth, `timezone_offset`, `reminder_time`, toggles de motivacional/lembrete/ligas, `sent_keys` para dedupe no servidor, `failures`) com RLS do próprio usuário; (2) `public.pairing_codes` sem policies + RPCs `pairing_create` (aparelho sem sessão registra o código, TTL 5 min), `pairing_claim` (consumo atômico de uso único, devolve `ok`/`used`/`expired`/`unknown`) e `pairing_status`; (3) colunas `deletion_requested_at`/`deletion_effective_at`/`deletion_cancelled_at`/`deletion_reason` em `profiles` e RPCs `request_account_deletion`, `cancel_account_deletion` e `account_deletion_status`.
- `src-app/api/push-dispatch.js` — endpoint serverless de push: `?action=key` devolve a chave pública VAPID e `?action=cron` (Authorization: Bearer CRON_SECRET) verifica cada assinatura no fuso do aparelho e envia mensagem motivacional (a partir das 12:00 locais), lembrete no horário escolhido e aviso de fim das ligas semanal/mensal. Criptografia Web Push (RFC 8291, aes128gcm) e JWT VAPID ES256 implementados com `node:crypto` — sem dependência nova; remove assinaturas 404/410 e as que falham 5 vezes, e mantém `sent_keys` para não repetir aviso.
- `src-app/api/account-purge.js` — expurgo agendado: apaga de verdade (`auth.admin.deleteUser`, cascata) as contas cuja carência de 30 dias venceu.
- `src-app/public/push-sw.js` — handlers `push`, `notificationclick` (foca a aba aberta e envia `academia:notification-click`, ou abre uma nova) e `pushsubscriptionchange` (pede reassinatura), injetados no SW do Workbox por `workbox.importScripts`.
- `src-app/src/features/notifications/push.ts` — assinatura do `PushManager` com a chave VAPID do endpoint, gravação em `push_subscriptions` (fuso + horário do lembrete + o que receber), `pushStatus`, `enablePush`, `disablePush`, `syncPushPreferences` e `startPushSync` (prefs, online, visibilidade, mensagens do SW).
- `src-app/src/features/notifications/inbox.ts` + `useInbox.ts` + `RealEventsFeed.tsx` — Caixa de Mensagens real: `pushMessage` com chave de dedupe, estado de lida, limite de 60 itens e evento `academia:inbox-changed`; os eventos vêm de amizade aceita/convite recebido (snapshot de `friends_overview`), conquista desbloqueada (snapshot das conquistas do Perfil), fim de liga em que o usuário treinou e conta reativada no login.
- `src-app/src/core/auth/account-deletion.ts` — `requestAccountDeletion`, `deletionStatus`, `cancelDeletionIfPending` (chamado pelo AuthProvider ao abrir sessão; dispara `academia:account-restored`) e `cancelAccountDeletion`.

### Changed
- `SettingsFeature.tsx` — **Desativar Sua Conta** deixou de ser “EM BREVE”: fluxo real com confirmação digitada (`DESATIVAR`), aviso da data efetiva, botão **Cancelar desativação** enquanto a carência corre, e saída da conta com limpeza do banco local. O toggle **Segundo Plano** virou **Push com o app fechado**, com status honesto (ativo, sem conta, sem VAPID, permissão negada, navegador sem suporte).
- `MessagesModal.tsx` — sem placeholders: lê o inbox real, mostra estado vazio, destaca não lidas, marca como lida ao tocar e oferece **Marcar todas** / **Limpar**.
- `InicioMenuModal.tsx` — contador de mensagens não lidas no item **Mensagens** (`.inicio-menu__badge`).
- `qr-pairing.ts` + `PairingAuthorizeDialog.tsx` — login por QR com **revogação de uso único**: o código é registrado no servidor, consumido por `pairing_claim` antes de qualquer token sair, e quem tentar reusar recebe “código já usado”; modo degradado (sem rede) avisa na UI. `AuthScreen.tsx` registra o código ao gerar o QR.
- `auth-context.tsx` — ao abrir sessão, cancela a desativação pendente (uma vez por carregamento); `signOut` rearma essa checagem.
- `vite.config.ts` — `workbox.importScripts: ['push-sw.js']`.
- `App.tsx` — monta `<PushSync />` (sincronização da assinatura) e `<RealEventsFeed />` (eventos → Mensagens).
- `MessagesModal`/`InicioMenuModal`: CSS novo para não lidas (`.is-unread`), `.msg-badge`, `.msg-empty`, `.msg-foot`, `.msg-action`, tons `--achievement`/`--league`/`--account` e `.inicio-menu__badge`.

### Fixed
- `supabase/migrations/20261101_social_ranking_friends.sql` — a coluna `position` é **palavra reservada** no Postgres: `returns table (position bigint, …)` abortava com `42601: syntax error at or near "position"` e, como o SQL Editor executa o script em **uma transação**, nada da migração era aplicado. Agora a coluna aparece entre aspas (`"position"`) no `RETURNS TABLE`, no alias do `row_number()` e no `ORDER BY`. O nome devolvido ao cliente continua `position`, então **nenhuma mudança no app**.
- `supabase/migrations/20261101_social_ranking_friends.sql` — `friends_overview` referenciava `me.uid` no `ON` do join antes de `cross join me` (`42P01: missing FROM-clause entry for table "me"`, pois o `ON` só enxerga as relações já presentes no `FROM`). O `cross join me` passou para antes do `join public.profiles`.

### Configuração necessária (fora do código)
- Vercel → Environment Variables: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET`.
- Agendar `GET /api/push-dispatch?action=cron` a cada 5–15 min (Vercel Cron no plano Pro ou agendador externo, que é o necessário no Hobby) e `GET /api/account-purge?action=cron` ao menos 1× por dia, sempre com `Authorization: Bearer $CRON_SECRET`.
- Passo a passo completo (migração pendente, geração das chaves, cadastro na Vercel, agendadores, verificação com `curl`, testes de push/pareamento/expurgo e problemas comuns) em `Planos/Noticiacoes.md`.

### Verificação
- `npx tsc -b` sem erros · `npx oxlint src` 0 erros · `npm run build` OK · `npm run lint:docs` OK.
- Push e expurgo não foram executados contra o Supabase real (faltam as chaves VAPID e o agendador). No projeto Supabase, `20261020` e `20261102` foram aplicadas; `20261101` segue pendente (rode o arquivo corrigido).

---

## [v4.66.0] - 2026-11-01

**Social deixa de ser demonstrativo: ranking global mensal e amigos reais na nuvem, guildas e jogadores fictícios removidos, Fit ID limpo, Missões parqueadas no modo dev e a Central de Ajuda criada.**

### Added
- `supabase/migrations/20261101_social_ranking_friends.sql` — backend do Social: colunas `total_xp`/`monthly_xp`/`xp_period`/`streak`/`level`/`avatar_emblem`/`photo`/`last_seen` em `public.profiles`; tabela `public.friendships` (convite → aceite, com RLS para os dois lados); RPC `publish_monthly_xp` (cada conta publica o próprio resumo), RPC `global_monthly_ranking(period, limit)` (posição por XP do mês) e RPC `friends_overview` (aceitos, recebidos e enviados).
- `src-app/src/features/social/social-cloud.ts` + `useSocialCloud.ts` — cliente do Social: calcula o XP da janela mensal a partir do histórico local (`monthlyXpFromHistory`), publica o resumo, lê o ranking global e gerencia amizades (enviar, aceitar, remover), com erros tipados para offline/sem conta. O hook republica o XP quando o histórico muda e escuta dados/visibilidade.
- `src-app/src/features/help/HelpCenter.tsx` + `help.css` — **Central de Ajuda**: FAQ/tutoriais derivados de `DESIGN.md`/`README.md` (Começando, Minha Ficha/coleção, Progresso, Social/ranking, Nuvem/backup/offline, Notificações, Privacidade, Instalar/PWA), com busca e acordeão animado (`grid-template-rows` + opacidade, respeitando `prefers-reduced-motion`). Entra em **Configurações → Ajuda e Tutoriais**, no menu do Início (**Ajuda**, antes um toast “em breve”) e na Busca Geral (`cfg:ajuda`).

### Changed
- `RankingsOverlay.tsx` — ranking real: abas **Jogadores** (ranking global do mês, mesma janela da liga mensal) e **Amigos** (amigos confirmados pelo XP do mês). Saíram os placeholders e a aba **Clãs**; sem nuvem/conta o overlay mostra o estado honesto.
- `LigasFeature.tsx` — reescrita: abas **Amigos** (amizades reais com convites recebidos/enviados + amigos locais de QR/link) e **Ranking** (top do mês + sua posição), com cabeçalho de XP do mês, nível, ofensiva e fechamento da temporada. Saíram as ligas simuladas, o chat e o banner de guilda.
- `social-cloud` no fluxo de convites: busca por @username/QR envia um **convite de verdade** (`friendships`) quando há conta + nuvem; QR/link continua funcionando offline.
- `ligas-data.ts` — agora só tipos, divisões usadas pelos glifos e efeitos sonoros; removidos `INITIAL_FRIENDS`, `INITIAL_MEMBERS`, `INITIAL_CLAN_MESSAGES`, `QUICK_REPLIES`, `DEFAULT_PROFILE`, NPCs (`generateOpponents`/`simulateOpponentActivity`), estados simulados de liga e `computeSeasonOutcome`.
- `player-profile-data.ts` + `PlayerProfileModal.tsx` + `MemberPopover.tsx` — perfil do jogador sem clã/liga fictícia: mostra XP do mês, posição no ranking global, nível e ofensiva reais; estatísticas detalhadas (horas, exercícios feitos, favorito) e último treino só existem para o próprio jogador, porque são dados privados do aparelho.
- `scheduler.ts` + `messages.ts` — o aviso de fim de liga dispara para quem **treinou dentro da janela** (não mais por `joined` de um estado simulado) e o texto cita a posição no ranking global em vez de “Divisão X”.
- `DashboardFeature.tsx`, `MobileDrawer.tsx` e `DesktopSidebar.tsx` — o módulo **Missões DEMO** ficou parqueado: card do Início, item da drawer e atalho da sidebar só aparecem com `isDevMode()`.
- `MissoesRecompensasModal.tsx` — a linha **SIMULADOR** (+10 Coroas / Max / Reset) também só aparece no modo desenvolvedor.
- `InicioMenuModal.tsx` — o item **Ajuda** deixou o toast “em breve” e abre a Central de Ajuda (`openProfileHelp` no `App.tsx`).
- `SettingsFeature.tsx` — novo tile raiz **Ajuda e Tutoriais** com tela própria.

### Removed
- `src-app/src/features/social/GuildPanel.tsx`, `guild-data.ts`, `GuildEmblem.tsx` e `social-data.ts` — sistema de guildas, chat de guilda, doações/guerra e os mocks da aba Social (`LEADERBOARD`, `FRIENDS`, `TROPHY_STEPS`…). `guild.css` permanece apenas como casca de overlays compartilhados (`OverlayShell`, `MemberPopover`, `ExitConfirmDialog`).
- Do Fit ID: restos do protótipo de jogos (abas “Meus Jogos”, `PRESET_ACCOUNTS`, `window.alert` promocional, FAQ com “Tetris/copas/clã” e os emojis 👾👑👤) — a tela virou identidade real da conta.

### Verificação
- `npx tsc -b` OK · `npx oxlint src` 0 erros (38 avisos, todos pré-existentes) · `npm run build` OK · `npm run lint:docs` OK (`system_map.json` @ 4.66.0).
- Runtime (dev server + navegador): aba Social renderiza o cabeçalho “Ranking global · mês”, as abas Amigos/Ranking e os estados vazios reais (sem guilda, sem amigos fictícios, sem ligas simuladas); console sem erros novos.

### Limitações honestas
- O ranking global depende de conta + Supabase configurado e da migração `20261101_social_ranking_friends.sql` aplicada; sem isso as telas mostram o estado vazio (os dados locais seguem intactos).
- Não há ainda pareamento de ligas por divisão no servidor: a disputa é o ranking global do mês, e a subida/queda entre divisões fica para quando houver atribuição de liga no backend.
- Missões/Passe continuam um módulo à parte, agora visível só no modo dev; um painel de metas reais (ligado ao histórico) substitui o mock numa próxima fase.

## [v4.65.0] - 2026-11-01

**Login por QR Code passa a transferir a sessão de verdade e o app ganha um sistema de notificações (motivacional diária, lembrete de treino e fim de liga).**

### Added
- `src-app/src/features/auth/qr-pairing.ts` + `PairingAuthorizeDialog.tsx` — **pareamento real de sessão**: o aparelho sem conta gera `PLN-XXXX-XXXX` (aleatório, sem 0/O/1/I), desenha o QR com `origin/#qr=CODIGO` (fragmento não trafega para o servidor) e assina o canal Realtime `evofit-login-pair:CODIGO`; o aparelho já conectado autoriza pelo link do QR (`PairingGate` no `App.tsx`) ou por **Configurações → Segurança → Autorizar Outro Aparelho**, publicando `access_token`/`refresh_token`; o receptor chama `supabase.auth.setSession` e entra sem senha. Expiração de 5 min encerra o canal, e o QR é rotativo a cada abertura.
- `src-app/src/features/notifications/` — **sistema de notificações**: `notification-center.ts` (permissão, envio pelo Service Worker com fallback para `Notification`, log local `academia_notification_log_v1` e poda), `scheduler.ts` (tick de 1 min + `visibilitychange`/`online`/`focus`/`prefs-changed`) e `messages.ts` (frases do dia a partir de `FRASES_PRESET`).
- `src-app/src/features/social/league-window.ts` — **calendário oficial das ligas**: semanal de **domingo 19:00 a domingo 18:59:59** e mensal do **dia 1º às 06:00 ao último dia às 21:00**, com `leagueWindow`, `isInsideWindow`, `nextLeagueWindow`, `msUntilEnd`, `formatWindowEnd` e `formatTimeLeft` — fonte única para o aviso de fim de liga e para a futura implementação real das ligas.

### Changed
- `AuthScreen.tsx` — a tela de QR deixou de ser decorativa: mostra o estado real do pareamento (“Aguardando autorização…”, “Sessão recebida — entrando…”, expirado, indisponível), exibe o código para digitação no outro aparelho e cancela o canal ao sair ou expirar.
- `SettingsFeature.tsx` — em **Notificações**: saíram os selos **EM BREVE** de *Lembretes de treino*, *Ligas* e *Mensagens motivacionais* (só *Novidades e atualizações* segue pendente); ligar qualquer um deles pede permissão e ativa o mestre; o botão **Testar** passou a usar o mesmo caminho de envio; e a tela mostra **“Próximo aviso: …”** (`describeNextNotice`) além da limitação de entrega com o app fechado.
- `App.tsx` — `PairingGate` (link `#qr=`) e `NotificationScheduler` (liga o agendador uma vez no boot e desliga no unmount).

### Regras implementadas
- **Motivacional** — 1× por dia a partir das 12:00, com a frase do dia; em dia sem treino o texto cobra a ofensiva.
- **Lembrete de treino** — no horário de `workoutReminderTime`, 1× por dia e **apenas se ainda não houver treino concluído hoje**.
- **Fim de liga** — 45 min antes do fim da semanal e 1 h antes do fim da mensal, somente para quem está `joined`; a mensagem traz divisão, posição e tempo restante.

### Verificado
- `npx tsc -b`: OK. `npx oxlint src`: 0 erros (nenhum aviso novo nos arquivos criados/alterados).
- **Ligas (teste de fronteira com esbuild + node)**: domingo 18:59 → janela anterior terminando 18:59:59; domingo 19:00 → nova janela; dia 1º 05:00 → mês anterior; 06:00 → mês corrente; 30/11 21:00 → fim; ano bissexto → 29/02 21:00.
- **Pareamento (runtime, Chrome CDP + Vite)**: tela de QR gerou `PLN-SAF7-JX9U` com imagem PNG e estado “Aguardando autorização”; em duas abas independentes o remetente assinou o canal (`statuses=SUBSCRIBED send=ok`) e o aparelho 1 **saiu do estado de espera** ao receber o broadcast — com tokens falsos ele caiu no tratamento de erro esperado (`setSession` inválido), provando a entrega ponta a ponta do canal.
- **Notificações (runtime, permissão concedida via CDP)**: tick simulado às 13:00 disparou `motivation:2026-11-01`; às 20:45 (lembrete 20:30) disparou `reminder:2026-11-01`; às 18:30 de domingo disparou `league-weekly`; às 20:15 do último dia disparou `league-monthly`; repetir o tick não reenviou nada (dedupe por chave).
- Configurações → Notificações exibiu **“Próximo aviso: hoje às 12:00 · Mensagem motivacional”** e apenas 1 selo EM BREVE na tela.
- `npm run lint:docs`: OK — `system_map.json` @ 4.65.0.

### Limitações conhecidas
- O pareamento usa um canal público e o código é a única credencial: não há revogação de uso único sem um endpoint de servidor (documentado no cabeçalho de `qr-pairing.ts`). O login cruzado completo não foi exercitado com uma conta real (exige credenciais e dois aparelhos).
- Notificações com o app totalmente fechado exigem push de servidor; hoje a entrega acontece com o app aberto/em segundo plano e o tick recupera avisos vencidos ao reabrir.
## [v4.64.1] - 2026-11-01

**Relatório de pendências: mapa do que é placeholder, demonstrativo e o que é funcionalidade real.**

### Added
- `Diretrizes/RELATORIO-PENDENCIAS.md` — auditoria de 2026-11-01 com evidência por arquivo: placeholders declarados (Loja, Ajuda, Desativar conta, 4 controles de Notificações, Guias), módulos demonstrativos (Social/Ligas/Rankings/Guilda, Missões e Passe com simulador visível, Notícias estáticas de outro produto, Mensagens fixas, restos do protótipo no Fit ID), fluxos incompletos (QR de login gerado mas nunca consumido, amizades sem backend, chat sem Realtime, nuvem dependente de chaves) e o backlog priorizado P0/P1/P2.

### Verificado
- `npm run lint:docs`: OK.
## [v4.64.0] - 2026-11-01

**Perfil sem Identidade/Frase/Título; Perfil de Saúde passa a refletir o formulário pós-login (sexo e nascimento só leitura) e a receber peso/altura das métricas corporais.**

### Changed
- `src-app/src/features/profile/ProfileFeature.tsx` — o grupo **Personalizar** ficou só com **Em Destaque**: saíram os tiles e as telas **Identidade**, **Frase de Assinatura** (e os `FRASES_PRESET`) e **Título**, junto com `saveIdentity`, `PersSub` reduzido a `destaque`, imports/ícones que ficaram sem uso e a ação antiga de salvar customização. O botão de editar do cartão (`#btnEditarPerfil`) agora abre a lista de tiles do grupo Perfil (`setNavStack(['perfil'])`), já que a pilha antiga `personalizar/identidade` não existia mais.
- `src-app/src/features/settings/HealthProfile.tsx` — **Sexo** e **Data de nascimento** viraram campos **somente leitura** (`.hp-locked` com cadeado e dica de idade): vêm do formulário pós-login e não são mais editáveis. Continuam editáveis apenas **Altura** e **Peso**. A gravação passou a usar `mergeHealthProfile`, então salvar peso/altura não apaga sexo/nascimento.
- `src-app/src/features/settings/HealthProfile.tsx` — prop opcional `seed` (`gender`, `nascimento`, `weightKg`, `heightCm` da customização, passada em `ProfileFeature`) cobre perfis antigos que nunca gravaram o Perfil de Saúde; e um efeito em `academia:health-profile-changed` reidrata peso/altura quando os dados mudam fora da tela.
- `src-app/src/features/training/BodyMetricsOverlay.tsx` + `src-app/src/features/training/body-metrics.ts` — novo campo **Altura (cm)** na folha “Registrar medidas”: peso e altura registrados na aba Progresso são espelhados no Perfil de Saúde (`mergeHealthProfile`), mantendo os dois lados sincronizados.
- `src-app/src/features/auth/OnboardingScreen.tsx` — a etapa **idade** virou **nascimento** (input `type="date"` com idade derivada) e entrou a etapa **altura** (cm): o assistente passa a ter **11 etapas** e cada resposta grava em `mergeHealthProfile`, preenchendo o Perfil de Saúde desde o cadastro.
- `src-app/src/core/db/schema.ts` — `ProfileCustomization.nascimento` (YYYY-MM-DD) e `BodyMeasurement.heightCm`.
- `src-app/src/features/search/search-index.ts` — o item “Personalizar” da busca descreve só o destaque do cartão.

### Fixed
- `src-app/src/features/auth/OnboardingScreen.tsx` — o arquivo estava **truncado** (stub que renderizava apenas `ok`, 198 linhas) desde um commit anterior; restaurada a última versão que compila (686 linhas) antes de implementar as etapas de nascimento e altura.

### Verificado
- `npx tsc -b` (src-app): OK. `npx oxlint src`: 0 erros (só os avisos de linha de base, nenhum nos arquivos alterados).
- Runtime (Vite + Chrome headless/CDP, modo teste):
- Perfil → grupo Perfil mostra apenas **Cartão do Perfil, Ofensivas dos Amigos, Medalhas, Perfil de Saúde, Progressão, Em Destaque** (sem Identidade/Frase/Título).
- Métricas corporais → “Registrar medidas” lista **Data, Peso, Altura, Gordura corporal, Cintura**; salvar **83 kg / 178 cm** gravou `academia_health_profile_v1` com `{"alturaCm":"178","pesoKg":"83"}` preservando `sexo` e `nascimento`.
- Perfil de Saúde abriu com **sexo e nascimento bloqueados** (`Masculino`, `20/05/1990`), apenas 2 `input` (altura 178, peso 83), **0 `select`** e **0 `input[type=date]`**, sem exceções no console.
- `npm run lint:docs`: OK — `system_map.json` @ 4.64.0.
- **Limitação:** as etapas novas do onboarding não puderam ser exercitadas em runtime (o assistente não abre no modo teste); validação por tipo + revisão do fluxo.
## [v4.63.0] - 2026-10-31

**Aviso de modo offline vira toast de 5 s e a troca lateral entre abas fica mais suave.**

### Changed
- `src-app/src/features/sync/OfflineSyncBanner.tsx` — o aviso **“Modo Offline Ativo”** deixou de ser um selo permanente: aparece na transição online → offline e sai sozinho depois de **5 s** (`OFFLINE_NOTICE_MS`), com a saída animada que já existia. A janela é aberta pelos eventos `online`/`offline` (e uma vez no boot se o app já nasce sem rede), então atualizações da fila não reiniciam a contagem. Pendências de sincronização continuam aparecendo quando há conexão.
- `src-app/src/lib/motion-presets.ts` — **`SPRING_SLIDE` 380/38 → 230/30** (ζ≈0.99, ωn≈15.2 rad/s): a troca lateral parte mais macia, desacelera por mais tempo (~430 ms em vez de ~340 ms) e continua criticamente amortecida, sem quique.
- `src-app/src/lib/animations.ts` + `src-app/src/App.tsx` — **`slideSwap`/`snapSlideHome` aceitam a velocidade do gesto** (px/s, limitada a 2400) e a repassam ao spring: ao soltar o swipe, a mola continua na velocidade do dedo em vez de reiniciar do zero. As duas funções passam a respeitar **`prefers-reduced-motion`** (salto direto, sem animação).

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (72 avisos de linha de base, nenhum novo).
- `npm run build`: OK — precache com 54 entradas únicas.
- Teste runtime (Chrome headless + CDP, `npm run dev` em modo teste):
  - offline emulado: banner visível de **9 ms a 5159 ms** e depois desmontado (`stillVisibleAtEnd: false`);
  - clique de aba: `data-active` muda, a fita chega ao destino (**100%**, `overshoot: 0 px`) sem erros de console.
  - **Limitação:** o headless renderiza por software e entrega ~30 fps (mesmo visível), com quedas durante o slide — a *curva* percebida não é mensurável ali. A suavidade precisa ser conferida em aparelho real.
- `npm run lint:docs`: OK — `system_map.json` @ 4.63.0.

## [v4.62.0] - 2026-10-31

**Modo offline consertado: o precache do Service Worker falhava no install por causa de ícones duplicados.**

### Fixed
- `src-app/vite.config.ts` — **`includeManifestIcons: false`**. O `vite-plugin-pwa` injetava os 3 ícones do manifesto no precache com `revision` calculado, enquanto o `globPatterns` já incluía os mesmos PNGs com `revision: null`. A lista duplicada fazia o Workbox lançar `add-to-cache-list-conflicting-entries` durante o install:
  ```
  firstEntry:  assets/icons/logo-192.png
  secondEntry: assets/icons/logo-192.png?__WB_REVISION__=b0881f94…
  ```
  A exceção abortava o precache **inteiro**: o Service Worker até ficava `activated`, mas `caches.keys()` retornava vazio e qualquer navegação offline caía em `ERR_INTERNET_DISCONNECTED` (a tela do dinossauro). Com a injeção desligada, os ícones continuam no precache uma única vez, pelo glob, e renomear um ícone não recria o conflito.

### Verificado
- `npm run build` (src-app): OK — precache com **54 entradas únicas** (antes: 57, com 3 duplicadas).
- Teste real de offline com Chrome headless via CDP (`Network.emulateNetworkConditions` offline + reload):
  - SW `activated` com `workbox-precache-v2` contendo as 54 entradas (`caches.keys()` deixa de ser vazio);
  - reload offline em `/` abre **EVO FIT** com `#root` montado;
  - reload offline em rota profunda (`/progresso`) também abre pelo `navigateFallback`;
  - nenhum `ServiceWorker.workerErrorReported` (antes: 1 erro `add-to-cache-list-conflicting-entries`).
- `npx oxlint src`: 0 erros.
- `npm run lint:docs`: OK — `system_map.json` @ 4.62.0.

### Observação
- O build publicado na Vercel precisa ser refeito para o SW corrigido chegar aos aparelhos. Como o SW do site quebrado não tem caches, na primeira visita online o navegador baixa o novo `sw.js` (servido com `must-revalidate`), instala e popula o precache.

## [v4.61.0] - 2026-10-31

**Modo Foco: séries preenchem as anteriores, conclusão das séries avança de exercício e a navegação some nas pontas.**

### Added
- `src-app/src/core/db/queries.ts` — **`toggleSeriesUpToEntry(base, exId, setIdx, exercise)`**: marca a série tocada **preenchendo as anteriores** (tocar na 3 marca 1–3) e, ao tocar numa série já feita, desmarca dela em diante. Mantém as séries contíguas e devolve o mesmo `rest`/check do `toggleSetEntry` (tempo do exercício ou 60 s na última).
- `src-app/src/legacy-style/treino/3-foco-badges.css` — `.f-nav-btn--placeholder`: espaço invisível que mantém o rótulo PRÓXIMO centralizado quando um dos botões de navegação não existe.

### Changed
- `src-app/src/features/workout/FocusModal.tsx` — os botões de série usam `toggleSeriesUpToEntry`; ao completar todas as séries o exercício é marcado e o **auto-avanço** leva ao próximo (com o descanso do exercício). O rodapé **não exibe “Anterior” no primeiro exercício nem “Próximo” no último** (inclusive na etapa de cardio), mantendo o layout equilibrado.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (72 avisos de linha de base, nenhum novo).
- `npm run build`: OK — precache gerado.
- `npm run lint:docs`: OK — `system_map.json` @ 4.61.0.

## [v4.60.0] - 2026-10-31

**Compartilhamento no Firefox Android/PWA entrega a imagem antes do texto e o timer de descanso do Modo Foco passa a ser ativado pelos botões de série.**

### Added
- `src-app/src/lib/native-share.ts` — **`canShareFiles(file)`**: diz se AQUELE arquivo pode ir pelo Web Share (`canShare({ files })`). Sem `canShare` (= sem suporte a arquivos, caso do Firefox Android) devolve `false`, e o chamador entrega a imagem por download ANTES da folha.

### Changed
- `src-app/src/features/gamification/ShareModal.tsx` — navegadores sem share de arquivo (Firefox Android, desktop) agora **baixam o PNG primeiro, dentro do clique**, e só então abrem a folha de texto: o Firefox bloqueia downloads disparados depois do compartilhamento, e era por isso que só a mensagem saía. Há cópia para a área de transferência quando suportada e um aviso na interface explicando que a imagem vai para Downloads. No **Firefox Android** a imagem é entregue antes e a folha com `files` ainda é tentada (se o navegador aceitar, sai imagem + texto juntos). No **APK** segue o plugin nativo e, se ele falhar, a imagem é salva em Documentos.
- `src-app/src/features/workout/FocusModal.tsx` — `runFocusMutation` unifica o fluxo de check e de série: `onSetToggle` passou a aplicar o `rest` devolvido por `toggleSetEntry` (tempo do exercício ou 60 s na última série) **e** a rodar a mesma conclusão/auto-avanço do botão CONCLUIR. Antes o `rest` era descartado e o timer de descanso só iniciava no botão de concluir.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (72 avisos de linha de base, nenhum novo).
- `npm run build`: OK — precache gerado.
- `npm run lint:docs`: OK — `system_map.json` @ 4.60.0.

## [v4.59.0] - 2026-10-31

**Compartilhamento no Android passou a levar a imagem gerada (Radar Fit e Treino Concluído) junto da mensagem; animação de entrada/saída em modais virou regra obrigatória nas diretrizes.**

### Added
- `@capacitor/share` + `@capacitor/filesystem` (dependências da raiz) — plugins nativos registrados no projeto Android (`npx cap sync android` passou a listar os dois).
- `src-app/src/lib/native-share.ts` — **`isNativeApp()`**, **`shareImageInNativeApp(file, text, title)`** (grava o PNG em `Directory.Cache` e abre o share nativo com `files` + `text` no MESMO intent) e **`saveImageInNativeApp(file)`** (Documentos → cache como reserva do `<a download>`, que o WebView ignora).
- `Diretrizes/DESIGN.md` — nova **§12.4**: regra obrigatória de entrada **e saída** animadas para qualquer modal/overlay/sheet/popover/tela condicional, com receita `useModalPresence`/`usePresenceValue` + `.is-closing` e `prefers-reduced-motion`.

### Changed
- `src-app/src/features/gamification/ShareModal.tsx` — o Radar Fit e o Treino Concluído saíam só com a mensagem porque o WebView do app não compartilha arquivo pelo `navigator.share`. Agora: (a) no **app Android** o plugin nativo roda **antes** do Web Share; (b) na **web/PWA** (inclui Chrome Android) os payloads são tentados em ordem **imagem + texto + título → imagem + texto → imagem** e o erro do Web Share é logado com nome/mensagem; (c) “Baixar imagem” grava pelo Filesystem no APK; (d) o clone do radar recebeu `width/height` 300×300 explícitos para o html2canvas não rasterizar vazio; (e) os links de WhatsApp/X/Facebook (só texto) ficam ocultos no APK, onde o share nativo já leva imagem + mensagem.
- `Diretrizes/DESIGN.md` (§14 checklist + regra de ouro §15.4) e `Diretrizes/README.md` (**regra 11** do Guia para Agentes de IA) — animação de aparecimento **e** desaparecimento agora é requisito de aceite para toda interface nova; `{open && …}` e `display: none` seco ficam proibidos.

### Fixed
- **Deploy na Vercel**: o build falhava com `TS2307: Cannot find module '@capacitor/share' / '@capacitor/filesystem'` porque os plugins estavam apenas na raiz e o Vercel instala/compila só `src-app`. `@capacitor/share`, `@capacitor/filesystem` e `@capacitor/core@8.4.2` (pinado na versão do runtime Android) passaram a ser dependências de `src-app/package.json`.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (72 avisos de linha de base, nenhum novo).
- `npm run build`: OK — precache gerado.
- `npm run lint:docs`: OK — `system_map.json` @ 4.59.0.
- `npx cap sync android`: OK — plugins `@capacitor/filesystem@8.1.5` e `@capacitor/share@8.0.3` registrados (o APK precisa ser recompilado no Android Studio).

## [v4.58.0] - 2026-10-31

**Minha Ficha: coleção com cards do deck, ghost de arraste no desenho do deck e exercício caindo no slot exato (1–8).**

### Added
- `src-app/src/lib/app-prefs.ts` — nova preferência **`academia_pref_collection_cards`** (`getCollectionCardsMode`/`setCollectionCardsMode`, tipos `CollectionCardsMode = 'padrao' | 'deck'`, com `academia:prefs-changed`).
- `src-app/src/features/workout/treinos/cards.tsx` — `DeckGhostCard`: card do deck no modo grid (grupo muscular + imagem + nome + "Séries: s × r") usado pelo arraste da coleção.
- `src-app/src/core/db/queries.ts` — `compactIds(ids)`: ids da ficha **sem os slots vazios** do deck.

### Changed
- `src-app/src/features/workout/treinos/MontarTab.tsx` + `deck-builder.css` — **MINHA COLEÇÃO** ganhou um modo de exibição alternável em Configurações → Preferências do App ("Cartões da Minha coleção"): **Compacto (6 colunas)** ou **Grid do deck (4 colunas, proporção 1/1.35 e "Séries: s × r"**, classe `.collection-grid--deck`).
- `src-app/src/features/workout/treinos/MontarTab.tsx` — o **ghost do arraste** de um exercício da coleção deixou de ser um clone do card compacto: agora é o `DeckGhostCard` (card do deck no modo grid), com largura medida no slot do deck — **independente** do modo escolhido para a coleção — montado por `createPortal` e posicionado direto no DOM (rAF, sem re-render por frame). No **desktop** a mesma regra vale para a imagem nativa do arraste: `buildDeckDragImage` monta o card do deck fora da tela e o entrega ao `setDragImage` (no lugar do snapshot do card da coleção). Com o deck em visualização de lista a largura vem da coluna do grid do deck (4 colunas; 2 no mobile).
- `src-app/src/features/workout/treinos/treinos-helpers.ts` — o deck passou a guardar as **8 posições** (`slot vazio = ''`): `dropCollectionAt` coloca o exercício no **slot solto** (1..8) em vez do próximo número livre (ex.: soltar no slot 5 com 1 e 2 ocupados deixa 3 e 4 vazios); `swapSlots` aceita slot vazio/destino além do fim; `addFromCollection` (toque) ocupa o primeiro slot vazio; `removeFromDeck` deixa o slot **vazio sem mover os outros** e descarta buracos no fim — inclusive ao excluir o exercício (`deleteExerciseRecord`). Novos `deckCount`/`EMPTY_SLOT`.
- `src-app/src/App.tsx` + `src-app/src/features/workout/FocusModal.tsx` — a checagem de conclusão ao **encerrar o treino** e o snapshot/navegação do **Modo Foco** passam por `compactIds`: slots vazios do deck não contam nem viram etapa.
- `src-app/src/core/db/queries.ts` + `SheetSelectorModal` + `ProgressoFeature` + `FichaFeature` + `search-index` + `LigasFeature` — contagens e “ficha tem conteúdo” passam por `compactIds`, e `applyFichaCompletion` ignora slots vazios (sem isso o treino nunca fecharia); copiar ficha da guilda também compacta.
- `src-app/src/features/workout/FichaFeature.tsx` — `fichaSlotIds` (compacto) alimenta conclusão e modo foco padrão; a tabela/grid seguem com a lista densa.
- `src-app/src/features/settings/SettingsFeature.tsx` — nova linha "Cartões da Minha coleção" em Preferências do App (ícone de grade, opções Compacto/Grid do deck) + descrição/keywords do tile atualizadas.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (72 avisos de linha de base, nenhum novo).
- `npm run build`: OK — 52 entradas de precache.
- `npm run lint:docs`: OK — `system_map.json` @ 4.58.0.

## [v4.57.0] - 2026-10-31

**Auditoria de animações: todo modal/interface que aparecia e desaparecia de uma vez agora tem transição suave de entrada e saída.**

### Added
- `src-app/src/hooks/useModalPresence.ts` — novo hook **`usePresenceValue(value)`** para modais abertos por DADO (`{renaming && <RenameModal playlist={renaming}/>}`): quando o valor vira nulo, guarda o último valor por `MODAL_EXIT_MS` e devolve `closing`, então o componente continua montado **com os dados** enquanto a animação de saída roda. Segue o mesmo padrão de ajuste de estado durante o render do `useModalPresence` (sem setState síncrono em efeito).
- `src-app/src/features/music/MusicOverlay.tsx` — componente interno **`MuSheet`** (fade do `.mu-modal` + `muSlideDown` do painel) usado pelas 8 sheets do overlay: excluir música, fixar nas escolhas rápidas, criar playlist, adicionar músicas, embed do Spotify, link da Biblioteca, ações da playlist e renomear.

### Changed
- `src-app/src/features/search/GlobalSearchOverlay.tsx` + `search.css` — a Busca Geral só tinha entrada (`gsFade`/`gsPop`); agora fecha com `.is-closing` (fade + recolhimento do painel) via `useModalExit`, incluindo ESC, clique no backdrop e o botão de fechar.
- `src-app/src/features/settings/ColorPickerModal.tsx` + `settings.css` — o Seletor Avançado de Cores também só animava a entrada; o fechamento (X, backdrop, ESC, Cancelar e Aplicar) passa por `requestClose`, com `setFadeOut`/`setSlideOut`.
- `src-app/src/components/ExitConfirmDialog.tsx` — o diálogo "Sair do EVO FIT" agora usa `useModalPresence` e fecha com a animação `.guild-overlay.is-closing` (mesma casca da guilda) em vez de sumir no mesmo frame.
- `src-app/src/features/workout/ConclusaoModal.tsx` — o painel `#modalConclusao` era montado/desmontado na hora (`{open && ...}`) enquanto só o backdrop tinha `transition`. Passou a usar `useModalPresence`, então entra com `fadeIn`/`slideUp` e sai com `modalOverlayOut`/`modalPanelOut`.
- `src-app/src/features/gamification/ShareModal.tsx` + `styles/modal-motion.css` — o Share Card não tinha animação no painel; ganhou entrada (`sharePanelIn`, fade + subida) e saída (`.share-modal-container` no `.is-closing`), com `useModalPresence` no lugar do `if (!show) return null`.
- `src-app/src/App.tsx` — `#modalEncerrarTreino` era um `display: none/flex` (aparecia e desaparecia sem transição). Agora é montado por `useModalPresence`, com a saída animada já prevista para `.modal-confirm` no `modal-motion.css`.
- `src-app/src/features/lock/LockScreen.tsx` + `lock.css` — desbloquear removia a tela de bloqueio de uma vez; agora ela sai com `lockOut` (fade + leve zoom) durante `MODAL_EXIT_MS`.
- `src-app/src/features/auth/AuthModal.tsx` + `AuthScreen.tsx` + `auth-screen.css` — a tela cheia de login aparecia/desaparecia sem transição: `AuthModal` usa `useModalPresence` e passa `closing` para a `AuthScreen`, que ganhou `authScreenIn`/`authScreenOut`.
- `src-app/src/features/sync/OfflineSyncBanner.tsx` + `sync.css` — o banner de offline/sincronização só animava a entrada (`syToastIn`); ao zerar as pendências ele desaparecia de imediato. Agora sai com `syToastOut` (`.is-closing` via `useModalPresence`).
- `src-app/src/features/music/MusicOverlay.tsx` + `music.css` — todas as sheets internas fecham com `.mu-modal.is-closing`; a de renomear e a de ações usam `usePresenceValue` (mantêm a playlist na tela durante a saída), a de link e o embed do Spotify idem para o tipo/item.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (72 avisos de linha de base — nenhum novo; o hook novo não gera o aviso `react(set-state-in-effect)`).
- `npm run build`: OK — 52 entradas de precache (~7,6 MB), sem erros de tipo.

## [v4.56.23] - 2026-10-31

**Modo offline do PWA alinhado ao guia: fila reativa com snapshots, push sem rede e sincronização manual.**

### Added
- `src-app/src/core/sync/offline-queue.ts` — a fila IndexedDB agora segue a Section 4 do `STANDALONE_OFFLINE_SYNC_GUIDE.md`: store **`offline_snapshots`** (último estado completo por sync key, gravado na mesma transação da mutação), campos `description`, `lastError`, `syncedAt` e `retryCount` por mutação, `getQueueStatus()` (pendentes, processando, último attempt/sucesso, online) e `subscribeToMutationQueue()` para atualização reativa do banner. O banco foi versionado para **2** com atualização in-place do v1 (cria o snapshot store e o índice `syncKey` sem perder a fila existente). A contagem considera apenas `pending` + `failed`; mutações `synced` com mais de 48 h são limpas automaticamente após o processamento. Falha total do IndexedDB cai no backup `academia_offline_pending_backup` do localStorage.
- `src-app/src/features/sync/OfflineSyncBanner.tsx` — o banner agora assina `subscribeToMutationQueue` e mostra três estados: **Modo Offline Ativo** (com o total salvo localmente), **Sincronizando alterações...** e **Reconectado!**, além do botão **Sincronizar** (chamada manual de `syncNow`) quando há pendências online. O polling de 15 s cobre alterações feitas por caminhos legados.

### Changed
- `src-app/src/core/sync/sync-manager.ts` — `pushSnapshot` ficou **offline-first**: sem rede ele não tenta requisição nenhuma — transmite o snapshot às abas via `BroadcastChannel` e enfileira no IndexedDB (coalescido). Falhas de rede no meio do upsert também caem na fila em vez de perder o estado. O flush da fila ganhou gatilhos em `focus`, `visibilitychange` e `pointerdown` (throttle de 15 s, sem concorrência), somando-se ao `online` e ao boot; `syncNow` continua esvaziando a fila antes do push.
- `src-app/src/features/sync/sync.css` — estilos `.sy-offline*` (tema âmbar offline / acento do usuário online, botão com spinner, posicionamento acima da navbar no mobile e respeito a `prefers-reduced-motion`).

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (avisos de linha de base, nenhum novo).
- `npm run build`: OK — 52 entradas de precache (~7,6 MB), `dist/sw.js` e `dist/registerSW.js` gerados sem erros de tipo.
- `npm run lint:docs`: OK — `system_map.json` @ 4.56.23, 364 caminhos verificados (198 OK).

## [v4.56.22] - 2026-10-31

**Transições entre as sub-abas de Rankings e no resultado das ligas, formulário de exercício em duas colunas, novo Perfil de Saúde e opções de cardio da referência.**

### Added
- `src-app/src/features/settings/HealthProfile.tsx` + `health-profile.ts` + `health-profile.css` — novo **Perfil de Saúde**, acessível pelo tile do grupo Perfil (Configurações → Perfil), no desenho da referência: aviso "Usamos gênero, peso e idade para fornecer treinos personalizados mais precisos.", campos **Sexo** (Masculino/Feminino/Outro/Prefiro não informar), **Altura** (cm), **Peso** (na unidade da preferência, `getWeightUnit()`) e **Data de nascimento** (com dica de idade), e o botão largo **Concluído**. O peso é persistido sempre em kg; a conversão kg↔lb acontece só na exibição/entrada e o campo se reformata quando a preferência de unidade muda. Os dados ficam isolados em `localStorage.academia_health_profile_v1` (não se misturam com as métricas corporais do Dexie); `health-profile.ts` concentra tipos, leitura/gravação sanitizada, `healthAge()` e `KG_TO_LB`. CSS BEM `.hp-*` com `color-scheme: dark` no select/date e respeito a `prefers-reduced-motion`.
- `src-app/src/features/workout/treinos/TreinosModals.tsx` — o seletor de cardio ganhou as opções da referência que faltavam: **Bicicleta de ar, Caminhada, Caminhada na esteira, Ciclismo, Ciclismo na ergométrica, Corrida, Corrida na esteira, Escalador vertical, Natação, Remada, SkiErg** e **Stepper**. As opções legadas (Esteira, Bicicleta, Elíptico, Pular Corda, Escada, Corrida de Rua, Remo Ergométrico) continuam com os mesmos valores, preservando fichas já salvas; nenhuma mecânica do cardio foi alterada.

### Changed
- `src-app/src/features/social/RankingsOverlay.tsx` + `rankings.css` — as sub-abas **Jogadores / Clãs / Amigos** agora trocam com um deslize direcional suave (banner + lista juntos, `AnimatePresence`/`motion` com direção conforme a aba escolhida e fade curto); o novo `.rk-panel` mantém o espaçamento vertical entre banner e conteúdo.
- `src-app/src/features/workout/treinos/ExercicioFormModal.tsx` — as linhas do formulário de exercício foram reorganizadas: **Nome do Exercício + Descanso (s)** na primeira linha e **Tipo de Movimento / Foco + Grupo Muscular** na segunda; Séries/Reps/Carga permanecem na terceira.
- `src-app/src/features/social/LigasFeature.tsx` + `social.css` — o resultado de uma partida simulada (liga semanal e mensal) agora anima as posições: `ParticipantRow` virou `motion.div` com `layout` (as linhas se reacomodam com mola) e a linha do jogador mostra um selo **+XP** transitório, com flash verde radial na linha. O estado `matchGain` (com limpeza do timer no unmount) alimenta as duas visões sem interferir no cálculo de XP existente.
- `src-app/src/features/profile/ProfileFeature.tsx` — o grupo Perfil ganhou o tile **Perfil de Saúde** (ícone ECG/pulso, em `Ícones.md`) e a tela `saude` correspondente, com keywords para a busca do hub.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (avisos de linha de base, nenhum novo).
- `npm run build`: OK — 52 entradas de precache (~7,6 MB), sem erros de tipo.
- `npm run lint:docs`: OK — `system_map.json` @ 4.56.22 com todos os caminhos citados existentes.

## [v4.56.21] - 2026-10-30

**Confirmação de saída realmente exibida, Modo Foco fluido com timer visível, cardio opcional e offline do PWA de verdade.**

### Fixed
- `src-app/src/App.tsx` — o **diálogo de confirmação de saída** voltou a aparecer. Cada troca de seção empilhava `pushState({ section })`; as primeiras voltas do histórico só trocavam de aba (ou caíam numa entrada-guarda com o mesmo `section`) e o modal nunca abria. Agora as seções **não geram entrada no histórico** (a navegação é a barra inferior, as setas do desktop e o swipe) e o histórico tem apenas duas entradas próprias: base + guarda. Qualquer "voltar" abre o diálogo; **Cancelar** recoloca a guarda com `history.forward()` (sem inflar o histórico) e **OK** sai de verdade (fecha a janela na PWA instalada; senão um `back()` a partir da base leva à página anterior).
- `src-app/src/core/auth/auth-context.tsx` — **offline do PWA instalado**: sem rede o refresh do token falhava, o Supabase emitia `SIGNED_OUT` e a AuthScreen (que exige rede) tomava a conta. Agora um snapshot mínimo da última conta (`mbc_offline_user`) mantém o app utilizável offline — dados locais no IndexedDB e fila de sync preservada; ao voltar a conexão (`online`) a sessão real substitui a local, e sair da conta de propósito limpa o snapshot. O fallback não confia só em `navigator.onLine` (fica `true` em Wi-Fi sem rota): sonda a própria origem por uma URL fora do precache (`/index.html?ping=`, `HEAD`, `no-store`, timeout de 2,5 s) e só descarta o snapshot quando a rede responde de verdade.
- `src-app/vite.config.ts` — o precache do service worker não inclui mais JPG/WEBP (`assets/images/background/MANUTENÇÃO.jpg`, `assets/bg/*`): uma falha de casamento de URL com acento derrubava a instalação **inteira** do SW — sem SW, sem offline. `maximumFileSizeToCacheInBytes` subiu para 5 MB. JPGs e wallpapers entram pelo runtimeCaching de `/assets/`.
- `src-app/src/features/workout/FocusModal.tsx` — a troca de exercício no **Modo Foco** dava um "refresh" na tela porque o container tinha `key={focusIndex}` (remontava tudo e recarregava o GIF). A chave saiu; a troca é um fade + deslize curto de 320 ms (`.focus-swap`, com `prefers-reduced-motion`).
- `src-app/src/features/workout/FocusModal.tsx` + `ficha-focus.css` — o **timer do descanso** ficava abaixo dos botões de série e passava despercebido. Virou um bloco em pílula entre o **GIF** e a linha de séries/reps/carga (GIF um pouco mais compacto, 44vh no desktop e 200px no mobile), com contagem ascendente de destaque quando está rodando.

### Added
- `src-app/src/features/workout/FocusModal.tsx` — botão **"Concluir treino sem o cardio"** na etapa de cardio do Modo Foco: fecha o treino do dia na hora (ficha concluída + `focusMin`), sem exigir a marcação do cardio. Só existe no Modo Foco.

### Changed
- `src-app/src/features/workout/FichaFeature.tsx` — no modo **TABELA** a coluna de volume não mostra mais o texto "· Sugerido: x kg" (a dica do peso inicial continua no grid e no Modo Foco).

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (72 avisos de linha de base).
- `npm run build`: OK — `dist/sw.js` com 52 entradas de precache (~7,6 MB), `index.html` + bundle principal + CSS dentro, 0 JPG/GIF/áudio, nenhuma URL ausente no `dist`.
- `npm run lint:docs`: OK.
- Não foi possível abrir o navegador desta sessão (painel de preview não anexou), então o Modo Foco e o diálogo foram verificados por build/inspeção de código, não visualmente.

## [v4.56.20] - 2026-10-30

**Imagens das telas de carregamento proporcionais (mobile e desktop) e PWA realmente offline.**

### Fixed
- `src-app/src/assets/LoadingVertical.png` e `LoadingHorizontal.png` — os arquivos estavam com as **orientações trocadas** (o “LoagingVertical” era 1536×1024 paisagem e o “LoagingHorizontal” era 1024×1536 retrato), o que fazia a splash/lock aplicarem a arte errada com `cover` e ampliarem o personagem (~3× no retrato). Os arquivos foram renomeados/corrigidos (e o erro de digitação “Loaging” saiu): retrato = LoadingVertical (1024×1536), paisagem = LoadingHorizontal (1536×1024).
- `src-app/vite.config.ts` — o `selfDestroying: true` do `vite-plugin-pwa` fazia o service worker gerado **se auto-desregistrar e apagar todos os caches** no activate; em produção não havia offline nenhum. Removido.

### Changed
- `src-app/src/lib/screen-defaults.ts` — novo `screenBackgroundStyle(image, custom)`: a arte padrão usa `contain` sobre fundo preto (nada é cortado nem ampliado em nenhuma proporção; o fundo da arte é preto, então as faixas se fundem) e imagens personalizadas do usuário seguem em `cover`.
- `src-app/index.html` — splash usa as novas imagens e alterna `contain` (padrão) / `cover` (imagem custom `mbc_loading_*`), com `background-repeat: no-repeat` e fundo preto.
- `src-app/src/features/sync/AppLoadingScreen.tsx`, `src-app/src/features/lock/LockScreen.tsx` e `src-app/src/features/sync/ScreensCustomizationPanel.tsx` — passam a usar `screenBackgroundStyle` (mesma regra contain/cover da splash).
- `src-app/vite.config.ts` — precache enxuto e offline funcional: `globPatterns` cobre app shell, fontes (vendor + Font Awesome), ícones, backgrounds e imagens da splash; `globIgnores` tira `assets/exerciciosgif/**` (23 MB) e `assets/sounds/**` (17 MB) do precache (entram sob demanda). Novas regras de runtime: Google Fonts (Material Symbols) em StaleWhileRevalidate/CacheFirst para funcionar offline após o 1º carregamento, fontes locais (`vendor/fonts` e `vendor/webfonts`) em CacheFirst, mídia de exercício (gif/webp) em CacheFirst com 60 dias/250 entradas, `/assets/` em StaleWhileRevalidate, Supabase (`rest/auth/realtime`) e `/api/` em NetworkOnly. `navigateFallbackDenylist` evita que rotas de API caiam no `index.html`.
- O `includeAssets` foi removido: os mesmos arquivos (ícones/bg/svg) entravam duas vezes no precache via `globPatterns`.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (avisos de linha de base).
- `npm run build`: OK — `dist/sw.js` gerado sem `selfDestroying` (sem `unregister`), 53 URLs únicas no precache (~7,6 MB), 0 GIFs/áudios no precache.
- `npm run lint:docs`: OK.

## [v4.56.19] - 2026-10-30

**Rankings e Mensagens no menu do Início, Modo Foco pelo GIF da ficha e confirmação de saída no desenho da referência.**

### Added
- `src-app/src/features/social/RankingsOverlay.tsx` + `rankings.css` — interface de Rankings aberta pelo item **Rankings** do menu do Início, no desenho da interface de Liga: abas **Jogadores / Clãs / Amigos**, banner "Modo Ranqueado" e linhas com posição (ouro/prata/bronze), avatar, nome, nível/guilda e pontuação. Os filtros **Global/Local** da referência foram ignorados.
  - **Jogadores**: usuários com as maiores pontuações (placeholders) + o jogador local com o XP real de treinos (`getXp`/`getLevel`), em ordem decrescente.
  - **Clãs**: ranking dos **membros da guilda** (`getGuild`/`useGuildState`); sem guilda, exibe a mensagem "Você precisa fazer parte de uma guilda para ver o ranking da guilda.".
  - **Amigos**: ranking dos amigos (`INITIAL_FRIENDS` + adicionados por QR/link) com estado vazio quando não houver nenhum.
- `src-app/src/features/dashboard/MessagesModal.tsx` + `messages-modal.css` — caixa de **Mensagens** no desenho da referência (título, ✕, cartões com título/tempo relativo/texto), adaptada ao tema do site. Mensagens placeholder de leitura (nada é gravado), Esc e clique no backdrop fecham, `useModalPresence` anima a saída e o scroll do body trava enquanto aberto.
- `src-app/src/features/workout/ficha-focus.css` — o **GIF do exercício** virou o gatilho do Modo Foco (`.ficha-gif-focus`), com cursor, zoom/brilho no hover, foco visível e z-index acima do gradiente decorativo do card.

### Changed
- `src-app/src/features/dashboard/InicioMenuModal.tsx` — o item **Rankings** deixou o toast "em breve" e abre `RankingsOverlay`; o item **Mensagens** deixou de navegar para a aba Social e abre `MessagesModal` (novo prop `onOpenRankings`). Ambos esperam o fade de saída do menu (`MODAL_EXIT_MS`), como já acontecia com Registro de Treinos.
- `src-app/src/features/dashboard/DashboardFeature.tsx` — estados `rankingsOpen`/`messagesOpen` e montagem dos dois overlays; o prop `onNavigate` (sem uso restante) foi removido, junto da passagem em `App.tsx`.
- `src-app/src/App.tsx` — `.msg-overlay` entrou nas exclusões do detector de swipe.
- `src-app/src/features/workout/FichaFeature.tsx` — `FichaImg` aceita `onActivate` e o `CardProps` ganhou `onFocus`: clicar no GIF (ou no placeholder) abre o Modo Foco **na tabela e no grid**, com Enter/Espaço no teclado. O duplo clique no grid continua funcionando.
- `src-app/src/components/ExitConfirmDialog.tsx` — no desenho do diálogo de saída da referência: título "Sair do EVO FIT", pergunta "Quer mesmo sair do EVO FIT?" e ações **Cancelar** (vermelho) / **OK** (azul) nas cores dos botões de perigo e azul da guilda; o texto de apoio saiu.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (avisos de linha de base).
- `npm run build`: OK.
- `npm run lint:docs`: OK.

## [v4.56.18] - 2026-10-30

**Cardio da tabela idêntico ao do grid, duplo clique restaurando o Modo Foco, ícone de saída na cor do usuário e confirmação de saída do app funcionando.**

### Changed
- `src-app/src/features/workout/FichaFeature.tsx` — no modo **tabela** o cardio passou a reutilizar o mesmo `FichaCardioCard` do modo grid, dentro de uma linha `<tr><td colSpan={5}>`; rótulo CARDIO, tipo, velocidade/tempo, checkbox e "CONCLUIR CARDIO" ficam iguais nos dois modos (a linha própria da tabela e os ícones `CardioGlyph`/`GearGlyph` foram removidos).
- `src-app/src/legacy-style/treino/4-gamificacao.css` — novas regras `.row-aerobico-card` (célula sem fundo/hover para preservar o gradiente e a borda verdes do card) e remoção dos estilos órfãos da antiga linha de cardio da tabela (`.ae-table-*`, `.ae-progress-*`, `.row-num--cardio`, `.img-placeholder--cardio`, `.ae-card-header`, `.ae-icon`, `.ae-label`).
- `src-app/src/styles/shell.css` — removida a regra antiga que forçava `.ae-table-label/.ae-table-type` inline.

### Fixed
- `src-app/src/features/workout/FichaFeature.tsx` — o **duplo clique** no grid voltou a abrir o Modo Foco em qualquer área do cartão (imagem, cabeçalho, nome, séries). O primeiro alvo é rastreado por `onClickCapture`; dois alvos diferentes em sequência (ex.: marcar séries 1 e 2 rapidamente) **não** abrem o foco, e nota/check continuam isentos.
- `src-app/src/App.tsx` — o ícone do modal **"Sair da Ficha?"** deixou de ser o emoji ⏹ e virou um SVG cujo quadrado externo usa `var(--primary)` (a cor escolhida pelo usuário) com o miolo branco; `.confirm-icon` ganhou o glow do tema.
- `src-app/src/App.tsx` — o **ExitConfirmDialog** agora aparece de fato: o histórico recebe uma entrada-guarda (`exitGuard: true`) no boot, então o botão/gesto de voltar no início do app abre "Sair do app?" em vez de fechar silenciosamente; cancelar recoloca a guarda e confirmar retorna à página anterior.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros (avisos de linha de base).
- `npm run build`: OK.
- `npm run lint:docs`: OK.

## [v4.56.17] - 2026-10-30

**Identidade dentro do banner do perfil, transições suaves no Social/Aliança e nos Ciclos de Treino, botão de páginas condicional e correção de checks/cardio no detalhe do ciclo.**

### Changed
- `src-app/src/features/social/PlayerProfileModal.tsx` + `player-profile.css` — imagem, nome, tag, nível, troféus e status on-line passam para dentro do `.player-profile__banner`; o banner vira contêiner flex com `min-height`/padding, o hero fica acima das decorações (`z-index: 1`) e os emblemas sobem para o canto superior esquerdo para não cobrir o avatar.
- `src-app/src/features/social/FriendQrModal.tsx` — a alternância **Meu QR Code ↔ Buscar jogador** usa `AnimatePresence`/`motion` (fade + slide) no painel e no rodapé; o painel inativo desmonta, então não fica focável.
- `src-app/src/features/social/LigasFeature.tsx` — a lista **Amigos ↔ Membros da Guilda** (sub-aba Aliança) entra/sai com fade + slide via `AnimatePresence mode="wait"`, mantendo o contêiner de scroll.
- `src-app/src/features/dashboard/CycleModal.tsx` + `cycle-modal.css` — a troca lista↔detalhe e o retorno usam `AnimatePresence`/`motion` (fade + slide), preservando a saída do modal via `useModalPresence`/`.is-closing`; o keyframe `cycleViewIn` saiu do CSS.
- `src-app/src/features/workout/treinos/MontarTab.tsx` — `#btnSwitchDeckPage` só é renderizado com 5+ fichas desbloqueadas e quando há ao menos uma ficha na página 2 (evita alternar para uma página vazia).

### Fixed
- `src-app/src/features/dashboard/CycleModal.tsx` — o detalhe do ciclo passa a listar **todos** os exercícios da ficha (não só os IDs de `item.checks`), marca o check a partir de `item.checks` e inclui a linha de **cardio** (`ae-<ficha>` + `effectiveAerobic`) com tipo/velocidade/tempo; registros legados sem `checks` (ou com IDs que não batem mais com a ficha) marcam todas as etapas do treino concluído.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros, 72 avisos (linha de base).
- `npm run build`: OK.
- `npm run lint:docs`: OK.

## [v4.56.16] - 2026-10-30

**Saídas animadas nos menus/modais, cardio em duas colunas, filtro que fecha ao escolher, rótulo "SELECIONE SUA FICHA" e "Registro de Treinos" abrindo os Ciclos de Treino.**

### Changed
- `src-app/src/features/workout/treinos/MontarMenuModal.tsx` — o menu da aba **Minha Ficha** passa a usar `useModalPresence` e a classe `.is-closing`; as opções permanecem montadas durante o fade de saída (`inicioMenuFadeOut`/`inicioMenuOut`) em vez de sumirem de imediato.
- `src-app/src/features/workout/treinos/TreinosModals.tsx` — **Configurar Cardio**: "Duração (min)" e "Velocidade Média" dividem a mesma `.form-row.form-row--2` (duas colunas também no mobile); `MaestriaGeralModal` troca o fade inline por `useModalPresence` + `.is-closing`.
- `src-app/src/features/gamification/ColecaoModals.tsx` — o modal de **maestria individual** (`#modalMaestriaEx`) usa `useModalPresence` + `.is-closing`, mantendo o último exercício montado até o fim da animação de saída.
- `src-app/src/features/workout/treinos/TreinosFeature.tsx` — **detalhes do exercício** ganham presença animada (`crExOpen` + `useModalPresence`), com o overlay recebendo `.is-closing`; o filtro do **Personalizar** fecha ao escolher um grupo (`filterDismissed`), aproveitando a transição já existente do `.cr-dropdown-menu`.
- `src-app/src/features/workout/treinos/DetalhesPecaModal.tsx` — o contêiner raiz recebe `.dp-details-shell` para participar da animação de saída.
- `src-app/src/features/workout/treinos/MontarTab.tsx` — o título **"SELECIONE SUA CLASSE"** vira **"SELECIONE SUA FICHA"**.
- `src-app/src/features/dashboard/InicioMenuModal.tsx` + `DashboardFeature.tsx` — **"Registro de Treinos"** deixa o toast "em breve" e abre o `CycleModal` (mesmo modal do card CICLO), após o fade de saída do menu (`MODAL_EXIT_MS`).
- `src-app/src/legacy-style/treino/secoes/toolbar-busca.css` — nova regra `.filter-dropdown-container.is-dismissed .cr-dropdown-menu` para fechar o popover mesmo com o botão ainda focado.
- `src-app/src/styles/modal-motion.css` — `.maestria-geral-container`, `.maestria-ex-container` e `.dp-details-shell` entram na animação `modalPanelOut` (e no bloco de `prefers-reduced-motion`).

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros, 72 avisos (linha de base).
- `npm run build`: OK.
- `npm run lint:docs`: OK.

## [v4.56.15] - 2026-10-30

**Avatares reais no Social, estandartes circulares, busca por tag, cardio simplificado, formulário em linha e heatmap mais alto.**

### Added
- `src-app/src/features/social/PlayerAvatar.tsx` + `player-avatar.css` — avatar compartilhado dos jogadores com prioridade **foto → emblema de identidade → glifo**, no mesmo círculo escuro do emblema da guilda; usado por `LigasFeature`, `GuildPanel`, `MemberPopover` e `PlayerProfileModal` para que amigos, membros e rankings mostrem a imagem real de cada jogador.
- `guild-data.ts`, `ligas-data.ts`, `friend-invites.ts` e `player-profile-data.ts` — campos `photo`/`avatarEmblemId` em `GuildMember`, `GuildPlayer`, `FriendItem` e `PlayerSummaryInput`, incluindo seeds, normalização do localStorage e sincronização do jogador local. Sem foto, o membro cai no emblema de identidade determinístico em vez da imagem fixa de prestígio.

### Changed
- `PlayerProfileModal.tsx` + `player-profile.css` — o avatar do perfil usa `PlayerAvatarMedia`; os emblemas do banner e os 8 slots da grade passam a ser **badges circulares** (`.player-profile__emblem-icon`) com o mesmo fundo radial/sombra interna do emblema da guilda, mantendo o emoji do estandarte como ícone.
- `legacy-style/treino/8-customizacao.css` — `.emblem-gallery .emblem-gallery__icon` também vira um círculo escuro no padrão dos avatares da guilda.
- `friend-search.ts` + `FriendQrModal.tsx` — a busca aceita a tag digitada como `@username`/`#username` (prefixo descartado) e continua consultando `username`/`display_name` em `public.profiles`; textos, placeholder e `aria-label` passam a citar nome, @username ou tag.
- `FichaDeck.tsx` e `MontarTab.tsx` — o rótulo **CARDIO CONFIGURADO** vira **CARDIO** nas prévias de treino (Início e seletor de treino).
- `ExercicioFormModal.tsx` — **Tipo de Movimento / Foco** e **Descanso (s)** agora dividem a mesma `.form-row--2`; séries/repetições/carga continuam na linha de 3 colunas.
- `progresso.css` — células do heatmap de séries passam de `1:1,5` para **`1:2`** (mínimo 9px), ganhando altura vertical sem perder a grade anual.

### Fixed
- `legacy-style/treino/2-modals.css` — o checkbox **“Esta carga é por lado”** deixa o fundo branco nativo: desmarcado fica preto com borda sutil, marcado recebe o acento do tema e um check desenhado em CSS (`#inputPorLado`).
- `PlayerProfileModal.tsx` — os estandartes/conquistas voltam a renderizar corretamente dentro dos novos badges circulares, sem a caixa quadrada antiga.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros, 72 avisos (linha de base).
- `npm run build`: OK.
- `npm run lint:docs`: OK (356 caminhos verificados).

## [v4.56.14] - 2026-10-29

**Banner do Início abre o perfil, "Último treino" igual à prévia do Início, formulário em linhas, timer animado, Modo Foco por duplo clique com cardio e tabela com colunas alinhadas.**

### Added
- `src-app/src/App.tsx` — o **banner da aba Início** ("TREINO DE HOJE"/nome do jogador) agora abre o **PlayerProfileModal do jogador local** (`LocalPlayerProfileShortcut`) em vez do hub de configurações; acessibilidade com `aria-label="Abrir perfil do usuário"`.
- `src-app/src/features/social/PlayerProfileModal.tsx` + `player-profile.css` — a seção **Último treino** passa a reusar o **mesmo `FichaDeck` da prévia do Início** (`bodyRow="sheet"`, `showSheetTag={false}`): linha "TREINO A", grid de 4 colunas e rodapé de métricas idênticos, só sem a etiqueta "FICHA DO DIA" (que cabe ao último treino, não ao de hoje).
- `src-app/src/features/workout/treinos/ExercicioFormModal.tsx` + `legacy-style/treino/2-modals.css` — formulário novo/editar exercício em **linhas fixas**: `.form-row--2` (Nome do Exercício + Grupo Muscular na mesma linha) e `.form-row--3` (Séries + Repetições + Carga na mesma linha); descanso foi para a linha abaixo. As regras `.modal-form .form-row--N` vencem o `@media(max-width:600px)` que empilhava tudo em 1 coluna.
- `src-app/src/features/workout/FichaFeature.tsx` — **animação suave do cronômetro global**: `useModalPresence(isActive, 240)` mantém o `.global-timer` montado no fade-out (classe `.is-closing`), com `timerIn` (fade + deslize, substitui o bounce antigo) na entrada e `timerOut` na saída. **Modo Foco por DOIS CLIQUES num cartão do grid** (`onGridDoubleClick` em `#workoutGrid`, ignorando botões/inputs do cartão) — o botão FOCO saiu do seletor de visualização (agora exatamente 2 slots: tabela/grid).
- `src-app/src/features/workout/FocusModal.tsx` — **cardio como última etapa do Modo Foco**, no mesmo desenho do card do grid (badge CARDIO + tipo + velocidade/tempo + checkbox de concluído) e entrando na conclusão atômica do dia; a carga vazia passa a exibir a **sugerida**; ícone do cardio virou **SVG de traço (ECG)** do padrão de ícones do site (o emoji 🏃 saiu, é proibido pelo guia).
- `src-app/src/features/workout/FichaFeature.tsx` + `legacy-style/treino/4-gamificacao.css` — **linha de cardio da tabela na MESMA grade de 5 colunas** das linhas de exercício (nº · cardio/tipo · imagem · volume · check): antes usava `colSpan` + selo "CONCLUÍDO", o que empurrava o checkbox para fora da coluna do ✓. Agora ela tem o **ícone de cardio ECG** (padrão do site), a **engrenagem movida para baixo das estatísticas** (mesmo lugar do botão de nota das linhas) e o **checkbox de concluído igual aos demais exercícios**.

### Changed
- `src-app/src/legacy-style/treino/2-modals.css` — no `@media(max-width:600px)` saiu a regra `.workout-table .col-img{display:none}`: ela escondia **só o `<th> Imagem`** (o `<td>` não tem a classe), então "Volume" e "✓" do cabeçalho ficavam uma coluna à esquerda do corpo. Header e corpo agora têm as mesmas 5 colunas, com `#` já renomeado para **`N°`**.
- `src-app/src/legacy-style/treino/3-foco-badges.css` — GIFs do Modo Foco com `object-fit: contain` + `max-height: 52vh` (a figura não aparece mais cortada), CSS do `timerIn`/`timerOut` e `.focus-cardio-icon` adaptado para o SVG (cor `currentColor` verde do aeróbico).
- `Diretrizes/system_map.json` (versão **4.56.14**) e este CHANGELOG — registram o banner→perfil, o deck do último treino, o duplo clique do foco, o timer animado e o alinhamento da tabela.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros, 72 avisos (linha de base).
- `npm run build`: OK.
- `npm run lint:docs`: OK.
- Sonda manual (dev server + browser): cabeçalho e corpo da tabela com colunas idênticas (N°/Exercício/Imagem/Volume/✓ nas mesmas posições dos `<td>`), linha de cardio alinhada com checkbox na coluna do ✓; seletor com só 2 botões; duplo clique no grid abre o Modo Foco (etapa 1 mostra "Peso inicial sugerido: 30 kg" e a última etapa é o CARDIO com SVG, sem emoji); imagem do foco com `object-fit: contain`; banner do Início abre `.player-profile` (sem "FICHA DO DIA" dentro do modal); formulário com 2 colunas (Nome+Grupo) e 3 colunas (Séries/Reps/Carga) mesmo no viewport de 397 px.

## [v4.56.13] - 2026-10-29

**Perfil do jogador no desenho do Clash Royale, popover do jogador também na sub-aba Amigos (amigos e membros da guilda) e último acesso “On-line”.**

### Added
- `src-app/src/features/social/PlayerProfileModal.tsx` + `player-profile.css` — **perfil do jogador em modal**, inspirado nas imagens de referência do Clash Royale e re-colorido com os tokens do site (banner `profile-banner[data-banner]`, painéis escuros, acento `--primary`). Ordem: barra superior com coroa e X, **banner**, 3 **emblemas sobrepostos** na base do banner, **avatar com moldura** + nome + tag + país/nível/On-line + troféus, **faixa da guilda** (emblema, nome e função), **Total de treinos** e **Ofensiva**, **Caminho de troféus** (placeholder: total + arena), **Emblemas** (8 slots + botão “Mostrar coleção” com `IDENTITY_EMBLEMS`), **Liga mensal** (atual, temporada anterior e melhor temporada), **Último treino** (cards dos exercícios + “Custo médio de carga” em kg, equivalente ao custo médio de elixir) e **Estatísticas** (treinos, total de horas treinadas, exercícios feitos pelo menos uma vez e treino favorito dos últimos 7 dias). Portal em `document.body`, `Esc`/backdrop fecham e há animação de entrada/saída.
- `src-app/src/features/social/player-profile-data.ts` — monta os números do perfil: o jogador local usa dados reais (`LocalData` + perfil + liga mensal — treinos concluídos, ofensiva, horas por `durationMin`, exercícios vistos em `checks`, ficha mais repetida nos últimos 7 dias e último treino concluído com `averageLoadKg`); amigos/membros usam valores determinísticos por id/nome. Também concentra `playerTag` (#XXXXXXXX estável), `formatLastSeen` (com **On-line**), `fallbackLastSeenHours` e `memberToPlayer`.
- `src-app/src/features/social/MemberPopover.tsx` — **popover do jogador** extraído do painel da guilda e generalizado: atende membros da guilda **e** amigos, com avatar, nome/tag copiável, função/país/nível, **Último acesso** e **Ofensiva**. **Ver perfil** agora abre o perfil completo (antes era um toast “em breve”).
- `src-app/src/features/social/OverlayShell.tsx` e `GuildEmblem.tsx` — casca de overlay e emblema extraídos para módulos próprios, compartilhados por `GuildPanel`, `MemberPopover` e `PlayerProfileModal` (evita ciclo de imports). `GuildPanel` continua re-exportando `GuildEmblem`.

### Changed
- `src-app/src/features/social/LigasFeature.tsx` — na sub-aba **Amigos**, tocar em um amigo (em **Amigos on-line** ou **Classificação**) ou em um **membro da guilda** abre o popover do jogador; a lista de membros passou a carregar função, último acesso e ofensiva reais. O popover fecha ao trocar de aba/sub-aba e ao trocar entre Amigos/Membros.
- `src-app/src/features/social/GuildPanel.tsx` — `GuildMemberDialog` removido em favor do `MemberPopover`; os detalhes da guilda continuam usando `useModalPresence`/`.is-closing`.
- `src-app/src/features/social/guild.css` — tag copiável do jogador no popover e estado **On-line** (valor verde + ponto pulsante) no Último acesso.
- `src-app/src/features/social/ligas-data.ts` — `LeagueState` ganhou `bestDivision` (melhor liga mensal alcançada, atualizada em `saveMonthlyLeagueState`) para a seção de ligas do perfil; `FriendItem` ganhou `role`, `lastSeenHours` e `streak` (dados do popover).
- `Diretrizes/system_map.json` (versão **4.56.13**), `Diretrizes/DESIGN.md` (§16.2 e §16.8) e este CHANGELOG — registram o perfil do jogador, o popover compartilhado e o estado On-line.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros, 72 avisos (linha de base; nenhum novo nos arquivos alterados).
- `npm run build`: OK.
- `npm run lint:docs`: OK.
- Sonda manual (dev server + CDP): popover de amigo com “On-line”/“Há X dias”, popover de membro da guilda com “On-line”, perfil de amigo e perfil do jogador local (dados reais) sem overflow horizontal no painel de 377×621.

## [v4.56.12] - 2026-10-29

**Saída do site com o diálogo da guilda, Amigos separados em on-line/classificação, popover de membro com último acesso/ofensiva e chat sem troféus nem mensagens rápidas.**

### Added
- `src-app/src/components/ExitConfirmDialog.tsx` — **confirmação de saída do site** no mesmo desenho do diálogo de sair da guilda: overlay `guild-overlay--nested guild-overlay--dialog` via `createPortal(document.body)`, título “Sair do app?”, “Quer mesmo sair?”, texto de apoio e ações **Cancelar** (neutro) / **Sair** (vermelho), com `Esc` e clique no backdrop fechando. O `App.tsx` passou a renderizar esse componente no lugar do modal Tailwind que existia na interceptação do histórico (botão voltar/gesto do celular). O browser não permite UI personalizada no `beforeunload`; a confirmação cobre a saída interceptada pelo histórico.
- `src-app/src/features/social/GuildPanel.tsx` — **popover do membro** (`GuildMemberDialog`) aberto ao tocar em qualquer membro da lista de detalhes da guilda: avatar com a imagem fixa do emblema de prestígio, nome, função, país e nível, além das métricas **Último acesso** (`Agora`, `Há X h`, `Há X dias`) e **Ofensiva** (`X dias`, com chama laranja). O rodapé tem **Ver perfil** como placeholder (toast “O perfil de … estará disponível em breve.”).
- `src-app/src/features/social/guild-data.ts` — `GuildMember` ganhou `lastSeenHours` e `streak`, gerados de forma determinística nos membros das guildas iniciais, normalizados na leitura e preenchidos no jogador (`0` / `1`).

### Changed
- `src-app/src/features/social/GuildPanel.tsx` + `guild.css` — a lista de membros agora usa **linhas clicáveis** (`li.guild-member-item` + `button.guild-member`) com chevron, hover e foco do tema; a prévia de guilda continua com linhas estáticas. O `GuildDetail` passou a usar **`useModalPresence`** e o `OverlayShell` ganhou a prop **`closing`**: ao fechar os detalhes o overlay fica montado por 220 ms com `.is-closing` (fade do backdrop + painel descendo levemente), em vez de sumir de imediato.
- `src-app/src/features/social/LigasFeature.tsx` + `social.css` — a sub-aba **Amigos** agora tem duas seções no mesmo estilo das linhas existentes: **Amigos on-line** (somente quem está on-line, com ponto verde pulsante no lugar do número da posição e contador) e **Classificação** (todos os amigos com posição, ordenados pelo filtro atual). A lista base `INITIAL_FRIENDS` passou a ser combinada com os amigos adicionados por QR/link (`mergeFriends`), então a aba já abre populada. Os avatares seguem usando a **imagem fixa** do emblema de prestígio. A sub-aba **Membros da Guilda** mantém a lista única de ranking.
- `src-app/src/features/social/LigasFeature.tsx` — **chat da guilda sem troféus e sem mensagens rápidas**: saiu o `(troféus)` ao lado do nome/função e saiu o bloco “Rápido:” com os atalhos (`QUICK_REPLIES`), incluindo o handler `handleQuickReplyClick` e o ícone `Smile`; o campo de digitação e o envio continuam iguais.
- `Diretrizes/system_map.json` (versão **4.56.12**), `Diretrizes/DESIGN.md` (§16.2 e §16.8) e este CHANGELOG — registram o diálogo de saída, as seções de amigos, o popover do membro e o chat limpo.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 72 avisos (linha de base; o aviso de `INITIAL_FRIENDS` sem uso em `LigasFeature.tsx` deixou de existir).
- `npm run lint:docs`: OK.

## [v4.56.11] - 2026-10-29

**Heatmap de séries mais alto, resumo de treinos dentro do Calendário e cabeçalho do Progresso sem o botão “+”.**

### Changed
- `src-app/src/features/training/progresso.css` — **heatmap de séries mais alto verticalmente**: as células passaram de `aspect-ratio: 1` (quadradas) para **`aspect-ratio: 1 / 1.5`** com `min-height: 7px`, mantendo a grade de 53 semanas e os 12 meses sempre visíveis. A linha de dias (`.prog-heat__days`) continua alinhada às semanas.
- `src-app/src/features/training/ProgressoFeature.tsx` — o bloco **`stats-card`** com **Total de Treinos** e **Treinos no Mês** saiu da aba Progresso e foi para o topo da interface **Calendário de Treinos** (`.cal-ov__body`), reutilizando o mesmo desenho e os mesmos ids (`#progTotalTreinos`/`#progMesTreinos`). O subtítulo do calendário virou “Ciclo atual, calendário e histórico de treinos”.
- `src-app/src/features/training/calendar-overlay.css` — novo ajuste `.cal-ov__stats` (padding 14px, gap 12px e `stat-item` compacto) para o resumo recém-movido respirar bem dentro do painel.
- `src-app/src/features/training/ProgressoFeature.tsx` + `progresso.css` — **botão “+” removido** da mesma linha do título “Progresso” (e o CSS órfão `.prog-head__btn` + `.stat-item--btn` removido). As métricas corporais continuam acessíveis pelo card **Corpo**.
- `Diretrizes/system_map.json` (versão **4.56.11**), `Diretrizes/DESIGN.md` (§16.9) e este CHANGELOG — registram o novo heatmap, a migração do resumo e a remoção do “+”.

### Verificado
- `npx tsc -b` + `vite build`: OK.
- `npx oxlint src`: 0 erros, 73 avisos (linha de base).
- `npm run lint:docs`: OK.

## [v4.56.10] - 2026-10-29

**Criação de guilda em modal centrado (só fecha no X), busca sem sobreposição e linha do cardio centralizada com as pontas alinhadas.**

### Changed
- `src-app/src/features/social/GuildPanel.tsx` — o `OverlayShell` ganhou a prop **`backdropClose`** (padrão `true`, só vale para overlays `nested`). O **formulário de criação de guilda** passou a ser um **modal centrado** (`nested`, painel de até 440px e altura automática) como o diálogo de saída, com **`backdropClose={false}`**: clique fora da área do modal **não fecha** — a saída é o botão **X** do cabeçalho (ou `Esc`). O seletor de emblema continua abrindo por cima e fechando pelo backdrop.
- `src-app/src/features/social/guild.css` — **ícone de pesquisa sem sobrepor o texto**: o seletor do campo virou `.guild-search .guild-search__input` (`padding-left: 40px`). A regra antiga tinha a mesma especificidade de `.guild-input` (definido depois no arquivo), então o padding de 12px vencia e o texto ficava sob a lupa.
- `src-app/src/legacy-style/treino/4-gamificacao.css` — **linha do cardio** (card `.ae-card-head` e tabela `.ae-table-cardio`): o rótulo **CARDIO** e o tipo continuam na mesma linha, um à **esquerda** e outro à **direita** e com a mesma tipografia, mas agora dentro de um **bloco compacto centralizado** (`width: min(100%, 15rem)`, `margin-inline: auto`, `justify-content: space-between`), como os valores de km/min. Antes o `space-between` de largura total esticava o par até as bordas do card (no desktop, ~1.200px de distância) e a centralização simples os deixava colados no meio.
- `src-app/src/features/workout/treinos/ExercicioFormModal.tsx` + `src-app/src/legacy-style/treino/2-modals.css` — o modal **Novo/Editar Exercício** recebeu a classe **`.modal-form--exercicio`**, que aplica o **mesmo gradiente do Detalhes de Volume** (radial do acento no topo direito + vertical escura, borda e brilho do tema) junto com a regra `#modalExercicio .modal-form` já existente — o fundo chapado `#111` não volta nem se o id do overlay mudar.
- `Diretrizes/system_map.json` (versão **4.56.10**), `Diretrizes/DESIGN.md` (§6.4, §16.2 e §16.8) e este CHANGELOG — registram o modal de criação, o ícone da busca e a linha do cardio.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros, 73 avisos (linha de base; nenhum introduzido pelos arquivos alterados).
- `npm run build`: OK.
- `npm run lint:docs`: OK.

## [v4.56.9] - 2026-10-28

**Cardio centralizado, gradiente do Detalhes de Volume no formulário de exercício e chat da guilda mais legível.**

### Changed
- `src-app/src/legacy-style/treino/4-gamificacao.css` — **linha do cardio** (card `.ae-card-head` e tabela `.ae-table-cardio`): o rótulo **CARDIO** e o tipo escolhido continuam na mesma linha, um à esquerda do outro e com a mesma tipografia, mas o par agora fica **centralizado** (`justify-content: center`, `align-items: center`, gap de 14px/10px), como os valores de km e minutos logo abaixo. Antes o `space-between` esticava os dois até as bordas do card — no desktop o card chega a ~1.200px e “CARDIO”/“Esteira” ficavam a mais de 1.000px de distância. `flex-wrap` mantém nomes longos legíveis, e a tabela segue a mesma regra.
- `src-app/src/legacy-style/treino/2-modals.css` — **Novo Exercício / Editar Exercício** (`#modalExercicio .modal-form`) passaram a usar o mesmo fundo do modal **Detalhes de Volume** (`volume-details.css`): radial do acento no topo direito + vertical escura, borda e brilho do tema no lugar do `#111` chapado.
- `src-app/src/features/social/LigasFeature.tsx` — **chat da guilda mais legível**: o texto das mensagens subiu de `text-xs` (que, herdando os 13px do container, renderizava ~11px) para **15px** com `leading-relaxed` e cor mais clara (`text-slate-100`); nome do remetente, função, troféus e horário ganharam 1px. Os **comentários rápidos** ("Rápido:") passaram a **14px** com padding de 14×7px e `font-medium`, e o campo de mensagem acompanhou os 15px.
- `Diretrizes/system_map.json` (versão **4.56.9**), `Diretrizes/DESIGN.md` (§6.4) e este CHANGELOG — registram a centralização do cardio e o gradiente do formulário.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros, 73 avisos (linha de base).
- `npm run build`: OK.
- `npm run lint:docs`: OK.
- Navegador (390×844 e 1280×900): card do cardio com o par centralizado no eixo do card (label 141–189, gap 14, tipo 203–249 no mobile; 577–634 / 648–703 no desktop, centro 640 = centro do card), ao lado dos valores centralizados de km/min; `#modalExercicio .modal-form` com `radial-gradient(…) + linear-gradient(rgba(24,21,40,.98), rgba(12,10,22,.99))` e borda `rgba(139,92,246,.38)` tanto em **Novo** quanto em **Editar Exercício**; chat com bolha de **15px**/linha 24,4px, campo de 15px e rápido de **14px** (padding 7×14).

## [v4.56.8] - 2026-10-28

**Guilda: banner no topo com emblema/nome/membros, detalhes e saída em modal e criação em linhas com seletores ◀ ▶.**

### Changed
- `src-app/src/features/social/LigasFeature.tsx` — a sub-aba **Guilda** voltou a ter o **banner da guilda no topo, na mesma linha do botão de fechar**: emblema, nome e “X/50 Membros”, com um chevron indicando que abre os detalhes; sem guilda, o banner mostra **“Sem guilda / Nenhuma guilda ainda”**. Tocar no banner abre os detalhes em modal e o corpo da sub-aba passa a ser **apenas o chat**. O novo `goSubTab` fecha o modal ao trocar de sub-aba (o estado não fica preso nem reabre sozinho) e `guildDetailsOpen` é repassado ao `GuildPanel`.
- `src-app/src/features/social/GuildPanel.tsx` — **detalhes da guilda em modal** (`GuildDetail`, aberto pelo banner): emblema grande, nome, tag copiável, descrição, faixa Localização / Troféus necessários / Tipo, “Membros X/50” com o botão **Sair** e a lista de membros com função, nível, país e troféus. Com guilda, a sub-aba não repete mais essas informações: mostra só o chat.
- **Saída em modal de confirmação** (`GuildLeaveDialog`, no formato da referência dos clãs): diálogo pequeno e centralizado com o título **“Sair da guilda?”**, “Quer mesmo sair?” e o nome da guilda, com **Cancelar** (neutro) e **Sair** (vermelho). Cancelar fecha só o diálogo; Sair fecha os dois modais, mostra toast e volta ao estado vazio.
- **Criação de guilda** (`GuildCreate`) no formato de linhas da referência: rótulo à **esquerda** e controle à direita (`.guild-form`, grid 96px + 1fr, com separadores) em vez de campos empilhados. **Tipo** e **Troféus necessários** passaram a usar o seletor **◀ valor ▶** (`.guild-step`): Aberto ⇄ Fechado e os passos 0 → 100 → 250 → 500 → 1.000 → 2.000 → 4.000. Emblema segue com o botão Procurar (os mesmos `IDENTITY_EMBLEMS` do site), descrição com contador 0/80 e localização em select.
- `src-app/src/features/social/guild.css` — novos `.guild-form*`, `.guild-step*` e `.guild-overlay--dialog` (diálogo central de 360px, corpo centralizado); `.guild-chat` perdeu borda/margem superior (agora é o conteúdo da sub-aba); removidos os estilos órfãos do antigo cabeçalho inline (`.guild-hero*`) e dos campos empilhados (`.guild-field*`, `.guild-create__lead`).
- `Diretrizes/system_map.json` (versão **4.56.8**), `Diretrizes/DESIGN.md` (§16.2 e §16.8) e `Diretrizes/context.md` — registram o fluxo banner → modal, o diálogo de saída e o formulário em linhas.

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros, 73 avisos (linha de base; o único aviso em `LigasFeature.tsx` — `INITIAL_FRIENDS` importado sem uso — já existia no HEAD).
- `npm run build`: OK.
- `npm run lint:docs`: OK.
- Teste funcional (dev server, modo teste, 390×844): sem guilda → banner “Sem guilda” + estado vazio → **Mostrar** → pesquisa → prévia → **Entrar** → banner “ACADEMIA MASTERS BR · 49/50 MEMBROS” com o chat abaixo → tocar no banner abre os detalhes (localização, troféus, tipo, membros 49/50, Sair) → **Sair** abre “Sair da guilda? / Quer mesmo sair?”; **Cancelar** mantém os detalhes, **Sair** fecha os dois e volta ao estado vazio → criar guilda com tipo **Fechado** e **250** troféus pelos seletores ◀ ▶ (emblema Lobo Alfa) → banner “TIME TESTE MODAL · 1/50” e modal com descrição, 250, Fechado e o jogador como **Líder/VOCÊ** → Sair remove a guilda criada. Sem erros de console da feature.

## [v4.56.7] - 2026-10-28

**Sistema de guildas funcional na aba Social: entrar, criar, emblemas e membros (sem doações e sem pontuação do clã).**

### Added
- `src-app/src/features/social/guild-data.ts` — módulo de dados/regras das guildas: tipos `Guild/GuildMember/GuildPlayer/GuildFilters`, 6 guildas iniciais com elenco determinístico (Academia Masters BR, Iron Forge SP, Titan Fitness, Academia Prime, Red Star Lift, Nordic Kings), persistência em localStorage (`academia_guilds_v1`), `joinGuild`/`leaveGuild`/`createGuild`/`validateGuildDraft`, `canJoinGuild` (fechada/cheia/troféus) e `filterGuilds` (nome ou tag sem acento, membros, troféus necessários, tipo, localização, “apenas guildas que posso entrar”). O hook `useGuildState` lê o estado e reage ao evento `academia:guild-changed`, mantendo nome/troféus/nível do jogador sincronizados. **Não existem doações semanais nem pontuação do clã** — cada membro tem os seus troféus (XP de treinos do app, a mesma pontuação do Fit ID).
- `src-app/src/features/social/GuildPanel.tsx` — UI da sub-aba Guilda: estado vazio com emblema e a barra “Procure ou forme uma nova guilda!”; guilda com cabeçalho (emblema, nome, tag copiável, descrição), faixa Localização / Troféus necessários / Tipo, contagem de membros, lista com função (Líder/Ancião/Membro), nível, país e troféus, botão Sair (com confirmação) e o chat existente abaixo dos membros. Overlays em `createPortal(document.body)`: Pesquisa de guilda (busca + pesquisa avançada + lista + Criar novo), prévia da guilda com **Entrar** (bloqueado quando fechada/cheia/sem troféus), criação (nome, emblema, descrição, tipo, troféus necessários, localização) e seletor de emblema — usando os **mesmos emblemas de identidade já existentes no site** (`IDENTITY_EMBLEMS`).
- `src-app/src/features/social/guild.css` — estilos `.guild-*` no padrão do app (painéis escuros com acento do tema, títulos Rajdhani em caixa alta, botões chunky): estado vazio, cabeçalho, faixa de informações, membros, emblema, overlays (tela cheia no mobile, janela central no desktop ≥1024px), busca/filtros, linhas da lista, chips e formulário.

### Changed
- `src-app/src/features/social/LigasFeature.tsx` — a sub-aba **Guilda** deixou de ser um placeholder: renderiza o `GuildPanel` (com o chat existente como conteúdo interno). O banner do topo das sub-abas Amigos/Liga passou a refletir a guilda real (emblema, nome, membros, tipo e troféus necessários) ou **“Sem guilda”** com atalho para a aba Guilda; na própria aba Guilda o banner apenas cede lugar ao botão de voltar. A lista **“Membros do Clã”** da sub-aba Amigos agora mostra os membros da guilda real (ou um estado vazio com atalho para entrar/criar). A bolinha de notificação falsa (11) do diamante Guilda foi removida. O jogador da guilda é montado com o nome do perfil, o XP de treinos (`getXp`) e o nível (`getLevel`).
- `src-app/src/App.tsx` — `.guild-overlay` entrou na lista de alvos que ignoram o swipe de seção (arrastar dentro dos overlays de guilda não troca de aba).
- `Diretrizes/system_map.json` (versão **4.56.7**) — entradas de `guild-data.ts`, `GuildPanel.tsx` e `guild.css` e propósito da pasta `features/social/` atualizado.
- `Diretrizes/DESIGN.md` — §16.2 agora documenta Social/Ligas/Guildas (arquivos e classes reais) e a §16.8 ganhou a linha `.guild-*`.

### Fixed
- `src-app/src/features/social/GuildPanel.tsx` — os overlays usavam as tags semânticas `<header>`/`<footer>`, que o CSS legado global estiliza (`footer { padding: 80px 20px 40px; position: relative }` + `footer::before` em `z-index: 0`): o `::before` ficava ACIMA dos botões e o rodapé não recebia clique (HIT test devolvia o `footer`). As três tags viraram `<div>` com as mesmas classes (mesma solução já adotada no OnboardingScreen).

### Verificado
- `npx tsc -b` (src-app): OK.
- `npx oxlint src`: 0 erros, 73 avisos (mesma linha de base; nenhum nos arquivos novos).
- `npm run build`: OK.
- `npm run lint:docs`: OK.
- Teste funcional no navegador (dev server, modo teste, viewport 390×844): estado vazio → **Mostrar** → pesquisa com 6 guildas → prévia (faixa sem doações/pontuação) → **Entrar** (49/50, membro “VOCÊ” com função Membro, chat visível, banner atualizado) → **Sair** com confirmação (volta a 48/50 e ao estado vazio) → **Criar novo** (nome, emblema Lobo Alfa, descrição, tipo Fechado, 100 troféus) → guilda criada com o jogador como **Líder** (1/50) → **Sair** remove a guilda criada. Aba Amigos → **Membros do Clã** mostra o membro real. Sem erros de console da feature.

## [v4.56.6] - 2026-10-28

**Heatmap de séries cobrindo o ano inteiro (12 meses) e linha do cardio alinhada na Ficha.**

### Fixed
- `src-app/src/features/training/progress-stats.ts` — `getSeriesHeatmap` agora gera as semanas de **janeiro a dezembro** em qualquer ano. Antes a grade terminava na semana de hoje, então no ano corrente os meses seguintes (Nov/Dez, por exemplo) nem existiam no DOM e o seletor de meses ficava incompleto. Os dias futuros aparecem como células vazias e o destaque de hoje continua.
- `src-app/src/features/training/progresso.css` — `.prog-heat__month` perdeu o `overflow: hidden`: os rótulos dos 12 meses não são mais cortados quando o mês ocupa poucas colunas.
- `src-app/src/features/workout/FichaFeature.tsx` + `src-app/src/legacy-style/treino/4-gamificacao.css` — **linha do cardio** (grid e tabela): `CARDIO` fica à **esquerda** e o tipo escolhido à **direita**, na **mesma linha** e com a **mesma tipografia** (mesmo tamanho, peso, cor e família). O grid usa o novo `.ae-card-head` (rótulo + `.ae-card-type`) e a tabela o `.ae-table-cardio` (`.ae-table-label` + `.ae-table-type`); `.ae-card-label` ganhou estilo próprio (antes não tinha CSS e ficava com a fonte padrão, acima do nome).

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.

## [v4.56.5] - 2026-10-28

**Scroll vertical do Calendário, linha do ciclo completa e clicável, e heatmap com os 12 meses sempre visíveis.**

### Changed
- `src-app/src/features/training/ProgressoFeature.tsx` — **Linha do ciclo** redesenhada: os 30 treinos do ciclo agora aparecem **de uma vez** numa grade compacta (número + letra da ficha; verde = feito, apagado = pendente, `title`/`aria-label` com data e duração) logo abaixo do marcador **INÍCIO** (posição 0, com a data de abertura) e de um resumo “X de 30 treinos concluídos · Y restantes”. Antes eram 31 linhas altas, que empurravam o calendário para fora da tela e deixavam a linha “cortada”.
- **Dias do ciclo clicáveis:** cada célula concluída virou um botão que abre o **registro do dia** (`selectedDate` → mesmo modal das células do calendário mensal), mostrando as fichas concluídas, duração e exercícios. Pendentes ficam desabilitados; os dados de cada dia seguem no `title`/`aria-label`.
- **Alternância Mensal ⇄ Semanal:** o overlay é reposicionado no topo do bloco **Calendário** (`calScrollRef`/`calendarBlockRef`) com rolagem suave a cada troca de visão, descontando a altura do cabeçalho sticky. Antes a rolagem ficava onde estava (no toggle) e o planner longo aparecia “no meio”, com o título e o toggle fora da vista. A rolagem só é aplicada quando a visão realmente muda — abrir o calendário continua começando pelo Ciclo.
- `src-app/src/features/training/calendar-overlay.css` — **scroll vertical garantido**: o `.cal-ov` passou a ser o único scroller (`overflow-y: auto`, `align-items: safe center` — centraliza quando cabe, alinha ao topo quando transborda) e o painel deixou de ter `max-height`/`overflow: hidden` (era isso que cortava a terceira linha da grade do ciclo sem permitir rolar). O `.cal-ov__head` virou `position: sticky` (sempre visível), o `.cal-ov__body` perdeu o scroll interno e o painel cresce conforme o conteúdo (Mensal/Semanal).
- `calendar-overlay.css`: novos estilos da grade (`.cal-ov__tl-head`, `.cal-ov__tl-legend`, `.cal-ov__tl-dot`, `.cal-ov__tl-start*`, `.cal-ov__tl-grid`, `.cal-ov__tl-cell*`, `.cal-ov__tl-num`, `.cal-ov__tl-letter`, `.cal-ov__tl-summary`) e do bloco `.cal-ov__calendar`; removidos os estilos das linhas altas (`.cal-ov__tl-row`, `.cal-ov__tl-index`, `.cal-ov__tl-copy`, `.cal-ov__tl-title`, `.cal-ov__tl-meta`, `.cal-ov__tl-badge`).
- `src-app/src/features/training/progresso.css` — **heatmap de séries sem rolagem horizontal**: `.prog-heat__weeks`/`.prog-heat__months` usam `grid-auto-columns: minmax(0, 1fr)` e as células `aspect-ratio: 1`, então os **12 meses ficam sempre visíveis** de uma vez em qualquer largura. A coluna de dias alinhada passou a usar `grid-template-rows: repeat(7, 1fr)` no `.prog-heat__body` (grid de 2 colunas). Em telas ≤560 px o card reduz o padding e os gaps.
- `src-app/src/features/training/ProgressoFeature.tsx` / `src-app/src/App.tsx` — removidos o efeito de rolagem automática do heatmap (`heatScrollRef` + `IntersectionObserver`) e `.prog-heat__scroll` da lista de alvos que ignoram o swipe, pois não há mais rolagem horizontal.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.

## [v4.56.4] - 2026-10-28

**Radar e volume só nas telas de Tendências, heatmap sem troca de aba, scroll do calendário e transições de entrada/saída.**

### Changed
- `src-app/src/features/training/ProgressoFeature.tsx`: os cards fixos **Volume de Carga** e **Atributos de Performance** saíram da aba — o volume já abre pelo card **Volume** das Tendências (modal) e o Radar Fit pelo card **Treinos** (Tendências de Treino). O botão **Compartilhar Radar** e o guia **“Como são calculados?”** migraram para a tela de Tendências (a interrogação no cabeçalho e o botão abaixo do radar); a aba não monta mais `RadarChart`/`useRadarMode`. O radar da tela de Tendências mantém `id="radarChartContainer"` — o `ShareModal` clona esse SVG ao compartilhar.
- `src-app/src/App.tsx`: `.prog-heat__scroll` entrou na lista de alvos que ignoram o swipe de seção (como `.month-grid` e `.table-scroll-wrap`) — arrastar o heatmap de séries não troca de aba.
- **Scroll do Calendário de Treinos:** `.cal-ov__body` ganhou `flex: 1 1 auto; min-height: 0` (e `-webkit-overflow-scrolling: touch`). Sem `min-height: 0` o filho flex não encolhia abaixo do conteúdo, o painel estourava o `max-height` e a **linha do ciclo 0–30** ficava cortada sem rolagem vertical.
- **Transições de entrada e saída** (mesmo padrão `useModalPresence` + `.is-closing` de `CycleModal`/`Ofensivas`):
  - Calendário + Ciclo (`.cal-ov`): fade/slide do painel na entrada (já existia) e saída com `cal-ov-out`/`cal-ov-panel-out`.
  - Tendências de Treino / Radar Fit (`.tr-overlay`): o componente agora aguarda a animação de saída antes de desmontar; `.tr-body` ganhou `flex: 1 1 auto; min-height: 0`.
  - Volume geral das Tendências (`.modal-overlay` + `.vol-detail`) e **Detalhes de Volume**: montagem condicional com presença (a animação `volDetailIn` volta a rodar a cada abertura) e `volDetailOut` na saída; o último grupo aberto fica retido para o painel não esvaziar enquanto fecha.
  - Comparar métricas (`BodyMetricsOverlay`): telas Métricas ⇄ Comparar trocam com `bm-screen-in`/`bm-screen-out` (o conteúdo antigo sai antes do novo entrar, com `key={screen}`).

### Fixed
- `src-app/src/features/training/calendar-overlay.css`: calendário sem rolagem vertical e linha do ciclo exibida pela metade.
- `src-app/src/features/training/progresso.css`: removido o CSS órfão do alternador `.radar-seg` (o controle agora vive em `.tr-seg`, na tela de Tendências).

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.

## [v4.56.3] - 2026-10-28

**Volume de carga com a carga sugerida, calendário+ciclo em tela própria, Tendências com radar em tela cheia e volume em modal.**

### Changed
- `src-app/src/features/training/progress-stats.ts`: `exerciseVolume` passa a considerar a **carga sugerida** (`lib/suggested-load.ts`) quando o exercício ainda não tem `load` salvo — antes o seed (que nunca grava `load`) deixava o donut, as tendências e o modal de volume em 0. A carga salva mantém o parse antigo; a sugerida usa `parseLoadKg` (que já dobra "cada lado") e não reaplica `porLado`.
- **Calendário + Ciclo em uma interface dedicada** (`ProgressoFeature.tsx` + novo `calendar-overlay.css`): o calendário **Mensal (Grid) / Semanal (Planner)** saiu do fluxo da aba e agora abre em tela cheia pelo card do mês (Atividade) e pelo card **Treinos no Mês**. A tela reúne o resumo do **Ciclo de Treino Atual** (barra 0–30, status, breakdown por ficha) e a **linha do ciclo 0–30** (`getCycleTimeline`, a mesma do modal "Ciclos" do Início, com data/duração/status).
- **Tendências clicáveis:** o card **Volume** abre o volume de carga em modal (donut + legenda por grupo + seletor 7/30/total; tocar num grupo abre o detalhe individual já existente) e o card **Treinos** abre a nova tela **Tendências de Treino** com o Radar Fit em tela cheia. O alternador de período virou um **segmented control** (Semana / Mês / Ano / Todo o período) no visual da referência enviada, com o resumo **Treinos · Séries · Volume** do recorte; o Radar Fit em si (fórmulas e SVG) não mudou — só o histórico do período é filtrado.
- O alternador do card **Atributos de Performance** também foi refeito no mesmo estilo segmentado (`Mês` / `Todo o período`), mantendo os ids `btnRadarMensal`/`btnRadarTotal`.
- `src-app/src/features/training/progresso.css`: estilos do donut/legenda extraídos para `VolumeBreakdown` (usado no card e no modal), cards de tendência clicáveis (`.prog-trend--btn`), `Treinos no Mês` como botão (`.stat-item--btn`) e o segmented control `.radar-seg`.
- **Heatmap de séries:** a rolagem até o mês atual deixou de ser `smooth` no boot e passou a ser **instantânea** e disparada por `IntersectionObserver` (só quando o heatmap está visível, threshold 0.35) — não disputa mais com a animação de transição entre abas.
- `src-app/src/App.tsx`: `.cal-ov` (Calendário+Ciclo) e `.tr-overlay` (Tendências/Radar) entraram na lista de alvos que ignoram o swipe de seção, como os demais overlays — arrastar dentro deles não troca de aba. `Esc` fecha as camadas na ordem de abertura (dia do calendário → grupo do volume → volume geral → calendário).

### Added
- `src-app/src/features/training/calendar-overlay.css` (novo): tela `.cal-ov*` (painel, cabeçalho, ciclo, linha do tempo 0–30 e calendário embutido), fullscreen no mobile.
- `src-app/src/features/training/TrendRadarOverlay.tsx` + `trend-radar.css` (novos): "Tendências de Treino" — Radar Fit em tela cheia, segmented control de 4 períodos e resumo Treinos/Séries/Volume.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.

## [v4.56.2] - 2026-10-28

**Modal de volume com background, conclusão automática do treino, heatmap no mês atual e moldura do avatar seguindo a sub-aba Emblema.**

### Added
- `src-app/src/features/training/volume-details.css` (novo): painel `.vol-detail*` do modal "Detalhes de Volume" da aba Progresso — fundo escuro em glassmorphism (gradiente + `radial-gradient` no acento do tema), borda/glow, cabeçalho com eyebrow + nome do grupo, cards de Volume total e Tendência, card "Evolução de carga" com a média e a Distribuição por exercício em barras (nome, valor, barra proporcional e "% do grupo"), scroll interno estilizado e breakpoints em 480/360 px. O `.modal-overlay` legado não dava contraste ao conteúdo solto do React; agora o painel tem superfície própria.

### Fixed
- `src-app/src/features/training/ProgressoFeature.tsx`: o modal `#modalVolumeDetails` foi reescrito com a UI nova (referência `Legacy/componentes/secoes/modais.html` L827–852 + `secao-progresso.js` L589 `openVolumeDetails`): título do grupo muscular, Volume Total, Tendência, gráfico (`buildVolumeLineChartSvg` continua injetando no `#volDetChartContainer`) e lista de exercícios com barra de distribuição. Fecha pelo X, pelo overlay e respeita `aria-labelledby`; antes o conteúdo não tinha background e ficava ilegível sobre a tela.
- `src-app/src/features/workout/FichaFeature.tsx`: **concluir todos os exercícios agora abre a conclusão**. O efeito usava `entry.completed` como curto-circuito e `applyFichaCompletion` grava `completed` no MESMO update do último check, então a transição era engolida e o usuário ficava preso na interface de treino. A transição passou a comparar `isDone` com um baseline (`doneBaselineRef`) iniciado só depois de `entryLoaded` e do fim do `loading`, mantendo o callback de 400 ms e a supressão no Modo Foco.
- `src-app/src/features/workout/FichaFeature.tsx`: o cardio padrão (10 min de esteira) segue VISÍVEL, mas só entra na contagem de conclusão quando está realmente configurado (`requiresAe`, espelhando `hasAe = ae && ae.tipo` do legado) — antes marcar todos os exercícios não concluía a ficha sem um check extra no cardio padrão.
- `src-app/src/features/training/ProgressoFeature.tsx`: o heatmap de séries da aba Progresso abre **centralizado no mês atual** (`.prog-heat__cell--today` via `getBoundingClientRect` em dois `requestAnimationFrame`, com `behavior: 'smooth'`); em anos anteriores a rolagem volta ao início do ano. Antes o heatmap abria sempre no começo (janeiro).
- `src-app/src/legacy-style/treino/secoes/dashboard.css`: a moldura do avatar do Início agora segue `data-frame`. O contêiner `.dash-profile-avatar.profile-avatar` tinha `border: 2px solid #eab308` fixo, que mascarava a escolha da sub-aba Emblema; sem moldura o anel é neutro (`rgba(255,255,255,.16)`) e `[data-frame="bronze|prata|ouro|elite"]` pinta `border-color` + glow no próprio contêiner. Os outlines internos duplicados (img/svg/wrapper) foram neutralizados.

### Changed
- `Diretrizes/system_map.json` (version `4.56.1` → `4.56.2`, `last_updated` `2026-10-28`): `volume-details.css` entra em `react_app.styles`, o atalho `progresso` cita o novo CSS/`volume-details.css` e o `purpose` de `FichaFeature.tsx` registra a conclusão corrigida.
- `Diretrizes/DESIGN.md`: §7.4 atualizada (moldura no contêiner, anel neutro sem moldura) e §16.9 ganha o `.vol-detail*` (CSS, classes e comportamento do auto-scroll do heatmap).

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.

## [v4.56.1] - 2026-10-27

**Nova logo sem fundo nos ícones e layout da aba Progresso redimensionado.**

### Changed
- `src-app/public/assets/icons/` regerados a partir do novo `src-app/src/assets/Logo.png` (arte nova, SEM fundo): `logo-32.png` e `logo-48.png` (ícone da aba no desktop), `logo-180.png` (apple-touch-icon), `logo-192.png` e `logo-512.png` (ícones `purpose: any` do manifesto PWA + `og:image`) agora têm fundo TRANSPARENTE; `logo-maskable-512.png` (`purpose: maskable`) mantém fundo preto com o logo a ~68% — dentro da safe zone, mesmo enquadramento do ícone anterior. Nenhuma referência muda: `index.html` e o `manifest` do `vite-plugin-pwa` apontam para os mesmos caminhos.
- `src-app/src/legacy-style/treino/2-modals.css`: `.progresso-grid` usa `grid-template-columns: minmax(0, 1fr)` — com `1fr` puro o track crescia até o min-content dos filhos e TODOS os cards da aba Progresso viravam 795 px dentro de uma coluna de ~338 px (cortados na horizontal em telas estreitas).
- `src-app/src/features/training/progresso.css`: `.progresso-grid > * { min-width: 0 }` — nenhum filho força o track a esticar. O heatmap (12 meses de células, ~795 px) é o único conteúdo mais largo que a coluna e passa a rolar dentro de `.prog-heat__scroll`, que já tem `overflow-x: auto`.

### Verificado
- `npm --prefix src-app run build`: OK — `dist/` com os 6 ícones novos e `manifest.webmanifest` apontando para `logo-192/512` e `logo-maskable-512`.
- No navegador: track do `.progresso-grid` em 338 px (= largura da coluna), nenhum filho acima da coluna, heatmap com rolagem interna (conteúdo 757 px em 300 px visíveis) e `document.scrollWidth` igual à viewport (sem estouro lateral).

## [v4.56.0] - 2026-10-27

**Métricas corporais no banco local, sub-aba "Emblema" com foto de perfil e moldura que segue a escolha.**

### Added
- `src-app/src/lib/image.ts` (novo): `fileToDataUrl(file, { maxSide, quality })` — redimensiona no canvas (lado maior limitado) e devolve data-URL JPEG; usado pela foto de perfil (480 px) e pelas fotos de progresso (720 px).
- `src-app/src/features/workout/treinos/emblema-tab.css` (novo): estilos do seletor de foto de perfil (`.profile-photo-picker`, `.btn-profile-photo`, `.btn-profile-photo-remove`).
- **Upload de foto de perfil na sub-aba Emblema** (`CustomizacaoTabs.tsx`): antes a foto só vinha do Google OAuth ou do emblema equipado; agora "Carregar foto" grava `customization.photo` (mesmo campo, prioridade sobre o emblema em `ProfileEmblem`, avatar do Início, sidebar, drawer e Fit ID) e "Remover foto" volta ao emblema. O OAuth do Google só sobrescreve quando não há foto ou quando a foto atual é do Google (`App.tsx`), então a escolha manual permanece.

### Changed
- `features/training/body-metrics.ts` + `core/db/schema.ts` + `core/db/idb.ts` + `core/sync/sync-manager.ts`: **fotos e medições passam do `localStorage` para o BANCO local** — tabelas Dexie `bodyMeasurements` (uma medição por dia, peso em kg, gordura, cintura) e `bodyPhotos` (front/side/back, JPEG 720 px). A chave antiga `academia_body_metrics_v1` é migrada na primeira leitura e removida; gravações disparam `academia:body-metrics-changed`, recarregam o hook `useBodyMetrics()` e entram no snapshot de sync (`buildSnapshot`/`applySnapshot` + auto-push do sync-manager).
- `features/training/ProgressoFeature.tsx` e `BodyMetricsOverlay.tsx` leem pelo hook `useBodyMetrics()` (carregamento, evento de mudança e `academia:db-ready` após um pull da nuvem).
- Sub-aba **"Maestrias" passa a se chamar "Emblema"** (rótulo em `TreinosFeature.tsx`; o id interno `maestrias` segue o mesmo).
- `features/profile/profile-data.ts`: as molduras de avatar (`AVATAR_FRAMES`) viram escolha LIVRE (`unlock: null`) e `revertLockedCustomizations` deixou de zerá-las — antes ficavam atrás de tiers de maestria/100 treinos e a seleção na sub-aba era ignorada, então a moldura do Início nunca mudava.
- `legacy-style/treino/secoes/dashboard.css`: o avatar/emblema do Início passa a ser REDONDO (`border-radius: 50%` no contêiner, na `<img>` e no wrapper do emblema, também no breakpoint mobile) e as molduras `[data-frame]` (bronze/prata/ouro/elite) ganham anel redondo acompanhando o círculo.
- `Diretrizes/system_map.json` (version `4.55.0` → `4.56.0`) e `Diretrizes/DESIGN.md` (§16.9) atualizados.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base; nenhum em arquivos alterados).
- `npm run lint:docs`: OK.
- No navegador (dev server `http://localhost:5173`): a chave `academia_body_metrics_v1` migrou para o banco e saiu do `localStorage`; nova medição gravou em `bodyMeasurements` (merge por dia) e o card Corpo atualizou sem reload; o overlay de métricas abriu com os dados; a moldura escolhida na sub-aba Emblema apareceu no Início com `data-frame` + anel (ex.: ouro `#fbbf24`, elite `var(--primary)`), tudo em `border-radius: 50%`. Dados de teste removidos ao final.

## [v4.55.0] - 2026-10-27

**Aba Progresso reformulada com a Central de Ofensivas e as Métricas corporais.**

### Added
- `src-app/src/features/training/progress-stats.ts` (novo): derivações da aba — ofensiva em SEMANAS (meta semanal de `trainingFrequencyDays`, padrão 3), constância em DIAS, resumo da semana atual, heatmap anual de séries, tendências (treinos/volume/energia/séries contra o período anterior) e pontuação de força (0–100 pelo radar, a partir de 3 treinos concluídos). Passa a concentrar `keysOfDay`, `exerciseVolume`, `seriesOfDay`, `fmtDateLocal` e `formatVolume` (as cópias locais da ProgressoFeature saíram).
- `src-app/src/features/training/OfensivasOverlay.tsx` + `ofensivas.css` (novos): Central de Ofensivas ("Sequências") em tela cheia — hero de semanas de sequência ("N dias / semana"), cards de Treinos esta semana, Melhor sequência, Sequência de consistência e Melhor consistência (com folha inferior explicativa; a de treinos abre os dias da semana), "Classificação" em abas (Sequência Atual com as últimas 8 semanas | Treinos do mês com seletor de mês) e o card "Compartilhar Atividade" com "Convidar um amigo" (reaproveita o convite do Social: `shareNative` → clipboard + toast).
- `src-app/src/features/training/BodyMetricsOverlay.tsx` + `body-metrics.ts` + `metricas-corporais.css` (novos): Métricas corporais em tela cheia — peso, fotos de progresso (Frente/Lado/Costas), gordura corporal, cintura, registro de medidas por data (uma por dia, com merge), unidade kg/lb e a tela Comparar métricas (7D/30D/90D/6M/1Y, com "Ainda não há dados suficientes para comparar" quando não há duas datas). Dados em `localStorage` (`academia_body_metrics_v1`); fotos de progresso são reduzidas a 720 px em JPEG antes de gravar.

### Changed
- `src-app/src/features/training/ProgressoFeature.tsx` + `progresso.css` (novo): a aba ganhou o cabeçalho "Progresso" (o "+" abre as métricas corporais) e as seções Pontuação de Força, Atividade, Séries (heatmap anual com seletor de ano), Tendências (Semana passada/Último mês/Total), Corpo (peso + atalho das fotos) e Conquistas (linha "Emblemas" que abre o Perfil + contagem de emblemas conquistados).
- O card do MÊS ATUAL em Atividade ("September" na referência é sempre o mês de hoje) leva ao calendário existente: rola até ele e reposiciona o mês corrente, SEM alterar a visão escolhida (Mensal grid / Semanal planner seguem inalterados).
- Cards legados "Ofensiva (Dias Seguidos)" e "Sua Semana" saíram da aba — a informação passou para os cards de Atividade e para a Central de Ofensivas. Seguem exibidos, sem alteração: Ciclo de Treino Atual, calendário Mensal/Semanal, Total de Treinos, Volume de Carga, Atributos de Performance (radar) e Calculadora de 1RM.
- `src-app/src/App.tsx`: `<ProgressoFeature onOpenPerfil={…}/>` (linha "Emblemas") e as classes dos overlays novos (`.of-root`, `.bm-root`) entram na lista de alvos que ignoram o swipe de seção.
- `src-app/src/features/training/progresso.css`: `.calendar-view-toggle` ganha `scroll-margin-top` para a rolagem até o calendário.
- `Diretrizes/system_map.json` (version `4.54.10` → `4.55.0`) e `Diretrizes/DESIGN.md` (§15/§16.8) atualizados com os arquivos e as classes novas.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos (mesma linha de base).
- `npm run lint:docs`: OK.

## [v4.54.10] - 2026-10-27

**Ajustes finais: cardio/esteira na mesma linha e fonte unificada.**

### Changed
- `src-app/src/styles/shell.css`: `.ae-table-label` e `.ae-table-type` passam a ser inline (mesma linha) e herdam a tipografia do site.

## [v4.54.9] - 2026-10-27

**Animações suaves no Modo Foco, notas e saída do treino.**

### Changed
- `src-app/src/features/workout/FocusModal.tsx`: entrada/saída animadas via `useModalPresence`; troca de exercício reexecuta `focusFadeIn` (key no container).
- `src-app/src/App.tsx`: a interface da ficha de treino anima a saída (fade/scale) antes de desmontar.
- `src-app/src/features/workout/FichaFeature.tsx`: o modal de anotações passou a usar `useModalExit`, animando exibição e desaparecimento.

### Verificado
- `npm --prefix src-app run build`: OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos.
- `npm run lint:docs`: OK.

## [v4.54.8] - 2026-10-27

**Animações suaves na ficha de treino.**

### Changed
- `src-app/src/App.tsx`: a interface da ficha de treino (overlay) passou a animar a saída (fade/scale) via classe `.is-closing` antes de desmontar, em vez de sumir instantaneamente.
- `src-app/src/features/workout/FichaFeature.tsx`: o modal de anotações passou a usar `useModalExit`, animando a exibição e o desaparecimento.

### Verificado
- `npm --prefix src-app run build`: OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos.
- `npm run lint:docs`: OK.

## [v4.54.7] - 2026-10-27

**Ajustes finais de UI: avatar redondo no Início, tipografia/ícones do Fit ID, emblemas redondos e saída suave do menu do Início.**

### Changed
- `src-app/src/styles/shell.css`: avatar do Início (`dash-profile-avatar`) passa a ser circular.
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: tipografia do Fit ID herda Rajdhani (removido `font-sans`); ícones de emoji (🎁, 🛡️) substituídos por `Gift`/`Shield`.
- `src-app/src/styles/shell.css`: emblemas de identificação (`.emblem-card`) passam a ser redondos.
- `src-app/src/features/dashboard/InicioMenuModal.tsx`: entrada/saída animada via `useModalPresence` + classes `.is-closing` em `inicio-menu.css`.

### Verificado
- `npm --prefix src-app run build`: OK.
- `npm --prefix src-app run lint`: 0 erros, 73 avisos.
- `npm run lint:docs`: OK.

## [v4.54.6] - 2026-10-27

**Ajustes de UI no Início e no Fit ID.**

### Changed
- `src-app/src/styles/shell.css`: avatar do Início (`dash-profile-avatar`) passa a ser circular (border-radius 50%).
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: tipografia do Fit ID deixa de forçar `font-sans` (herda Rajdhani do restante do site); ícones de emoji (🎁, 🛡️) substituídos por ícones lucide (`Gift`, `Shield`) nas seções "Junte pontos e ganhe prêmios" e "Proteção da conta".

## [v4.54.5] - 2026-10-27

**Fit ID: alinhamento visual das configurações com o app.**

### Changed
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: a tela de configurações do Fit ID passou a usar a paleta do app (zinc/primary) nos contêineres, textos e toggles, em vez dos tons claros herdados do port legado.

## [v4.54.4] - 2026-10-27

**Fit ID: amigos reais, "Outros Apps", moldura funcional e remoção de emblemas legado/prestígio.**

### Changed
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: a aba Amigos agora lista os amigos realmente adicionados no app (`loadAddedFriends()`), sincronizando via eventos; "Adicionar Amigos" avisa para adicionar na aba Social. "Meus Jogos" renomeado para "Outros Apps". O avatar do Fit ID recebe `data-frame` da moldura escolhida, aplicando o contorno.
- `src-app/src/features/profile/profile-data.ts`: removidos os emblemas "Estrela Alada", "Escudo Caveira", "Coração de Leão", "Águia Dourada", "Legado Alpha", "Vetor V", "Anjo da Morte", "Estrela Nova", "Lobo de Prata" e "Caveira Alada".
- `src-app/src/features/dashboard/FitIdOverlay.tsx` e `DashboardFeature.tsx`: propagam `avatarFrame` até o avatar do Fit ID.
- `src-app/src/features/workout/treinos/CustomizacaoTabs.tsx`: fallback para `prestigio-1` se o emblema salvo foi removido.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros e 73 avisos.
- `npm run lint:docs`: OK.

## [v4.54.3] - 2026-10-27

**Fit ID: amigos reais, "Outros Apps", moldura de avatar funcional e remoção de emblemas legado/prestígio.**

### Changed
- `src-app/src/features/dashboard/SupercellIdModal.tsx`: a aba Amigos passa a listar os amigos realmente adicionados no app (`loadAddedFriends()`), sincronizando via `academia:friends-updated`/`academia:friends-changed`/`academia:db-ready`; o botão "Adicionar Amigos" virou aviso para adicionar na aba Social. "Meus Jogos" foi renomeado para "Outros Apps". O avatar do Fit ID recebe `data-frame` da moldura escolhida, aplicando o contorno correspondente.
- `src-app/src/features/profile/profile-data.ts`: removidos os emblemas "Estrela Alada", "Escudo Caveira", "Coração de Leão", "Águia Dourada", "Legado Alpha", "Vetor V", "Anjo da Morte", "Estrela Nova", "Lobo de Prata" e "Caveira Alada" de `IDENTITY_EMBLEMS`.
- `src-app/src/features/dashboard/FitIdOverlay.tsx` e `DashboardFeature.tsx`: propagam `avatarFrame` até o avatar do Fit ID.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros e 73 avisos (mesma contagem anterior).
- `npm run lint:docs`: OK.

## [v4.54.2] - 2026-10-27

**Animações profissionais dos ícones Amigos, Guilda e Liga ao tocar.**

### Added
- `src-app/src/features/social/LigasFeature.tsx`: estado `pressed` (360 ms) no `DiamondNav` aplica uma classe específica ao ícone tocado — `ligas-nav-icon--tap-amigos`, `--tap-guilda` ou `--tap-liga` — disparando animações distintas para cada ícone; o botão recebe `ligas-nav-btn` para o feedback de pressão (`:active`).
- `src-app/src/features/social/social.css`: animações dedicadas por ícone — escudo com escala + brilho (`ligas-shield-tap`), balão de mensagem com pop/rotação (`ligas-message-tap`) e espadas se batendo (`ligas-swords-tap`) — além de `ligas-nav-btn:active` (`scale(0.92)`) e bloco `prefers-reduced-motion`.

## [v4.54.1] - 2026-10-27

**Correção da animação de saída dos modais: a saída agora é visível em vez de instantânea.**

### Fixed
- `src-app/src/styles/modal-motion.css`: removido `opacity: 0 !important;` do `.modal-overlay.is-closing`, que derrubava a animação de fade (o `!important` vencia o `@keyframes` e deixava overlay/painel invisíveis na hora). Agora o fade usa apenas `modalOverlayOut`/`modalPanelOut` (220 ms).
- `src-app/src/features/workout/treinos/ExercicioFormModal.tsx` e `TreinosModals.tsx` (AerobicoModal): removidos os estilos inline de `opacity`/`visibility`/`transition` que competiam com a classe `.is-closing`, deixando o CSS legado + `modal-motion.css` conduzirem a animação de entrada e saída.

## [v4.54.0] - 2026-10-27

**Opção "Entrar em modo teste" nas opções de login, disponível somente em desenvolvimento.**

### Added
- `src-app/src/core/auth/auth-context.tsx`: novo `signInAsTest()` + `isTestMode` no contexto. Cria um usuário fictício local (`local-test-user` / `teste@local.dev`), restaura a sessão entre reloads pela flag `mbc_test_session` (lida apenas quando `import.meta.env.DEV`) e não chama o Supabase.
- `src-app/src/features/auth/AuthScreen.tsx`: botão "Entrar em modo teste" na tela de boas-vindas, com ícone de frasco e borda tracejada esmeralda. O botão (e o handler) só são renderizados em desenvolvimento; no build de produção não aparece.

### Changed
- `src-app/src/App.tsx`: em modo teste o AppShell não deriva a chave de sync, não inicia o motor de sincronização e não preenche o perfil com metadados do Google; o bootstrap usa `LOCAL_USER_ID` (não o id fictício) e o `OnboardingGate` não abre, então o teste cai direto no app.
- `src-app/src/features/settings/SettingsFeature.tsx`: com sessão de teste, "Sair da Conta" encerra o modo teste via `signOut()` e limpa o banco local — evita que dados fictícios sejam migrados depois para uma conta real. A saída da conta nuvem normal continua sem apagar os dados locais.
- `Diretrizes/context.md`: nova seção "Login de desenvolvimento (modo teste)" com o fluxo, a persistência por `mbc_test_session` e a saída por Configurações → Sair da Conta.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK.
- `npm --prefix src-app run lint`: 0 erros e 73 avisos (mesma contagem anterior).
- `npm run lint:docs`: OK.

## [v4.53.0] - 2026-10-27

**Três pedidos do usuário: imagem padrão nas telas de carregamento/bloqueio, modal com os ciclos 0–30 no Início e animação de entrada/saída nos modais de treino, cardio, exercício, amigos e QR Code.**

### Added
- `src-app/src/lib/screen-defaults.ts`: `defaultScreenImage(portrait)` devolve `LoagingVertical.png` (mobile/retrato) ou `LoadingHorizontal.png` (desktop/paisagem), importados de `src-app/src/assets/` para o Vite resolver as URLs no build. A grafia "Loaging" é a do arquivo original.
- `src-app/src/hooks/useModalPresence.ts`: `MODAL_EXIT_MS = 220` (mesmo tempo do CSS), `useModalPresence(open)` — mantém o modal montado e expõe `closing` durante a saída — e `useModalExit(onClose)` — roda a animação antes de chamar o `onClose` do pai, com ação opcional pós-animação.
- `src-app/src/features/dashboard/CycleModal.tsx` + `cycle-modal.css`: modal do card CICLO do Início, em `createPortal(document.body)`, com a linha do tempo **0–30** do ciclo atual (0 = abertura, 1..30 = treinos concluídos e pendentes) e o detalhe individual do treino selecionado (data, ficha, duração e exercícios, marcando os concluídos). Fecha no Esc/backdrop, trava o scroll do body, o Esc/chevron voltam do detalhe para a lista e reabrir sempre cai na lista.
- `src-app/src/styles/modal-motion.css`: `modalOverlayOut` + `modalPanelOut` — fade do `.modal-overlay` e recolhimento do painel (`translateY(24px) scale(0.96)`) em 220 ms, com `prefers-reduced-motion`.
- `src-app/src/core/db/queries.ts`: `CycleTimelineItem` + `getCycleTimeline(data)` — 31 posições (0 = `currentCycleStartDate`; 1..30 = um item por letra em `completedKeys` desde o início do ciclo, preenchendo até 30; o restante fica pendente). Usa a mesma contagem de `getCycleStats`, então o total fecha com o número do card CICLO.

### Changed
- `src-app/index.html`: `<img>` ocultos `#splashDefaultPortrait`/`#splashDefaultLandscape` (classe `.splash-default-asset`) só para o Vite processar os caminhos; o script inline de boot usa a imagem padrão quando não há `mbc_loading_*` — a imagem personalizada continua com prioridade.
- `src-app/src/features/lock/LockScreen.tsx`: fundo do bloqueio em três níveis — imagem custom → imagem padrão (somente quando o usuário **não** escolheu um wallpaper) → preset (`resolveWallpaper`). O estado `wallExplicit` é re-sincronizado em `academia:lock-prefs-changed`.
- `src-app/src/features/sync/AppLoadingScreen.tsx` e `src-app/src/features/sync/ScreensCustomizationPanel.tsx`: as prévias de carregamento e de bloqueio caem na imagem padrão quando não há imagem custom, e a prévia de bloqueio respeita o preset escolhido do mesmo jeito que o LockScreen.
- `src-app/src/features/dashboard/DashboardFeature.tsx`: o modal inline antigo (grade de quadradinhos por dia, com Tailwind) foi removido e substituído pelo `<CycleModal/>`, alimentado por `getCycleTimeline`; o card CICLO abre o novo modal.
- `src-app/src/features/dashboard/SheetSelectorModal.tsx`, `src-app/src/features/workout/treinos/TreinosModals.tsx` (AerobicoModal) e `ExercicioFormModal.tsx`: usam `useModalPresence` + classe `.is-closing` e o `modal-motion.css`; Aerobico/ExercicioForm deixaram de controlar `visibility`/`opacity` inline na abertura.
- `src-app/src/features/workout/treinos/TreinosFeature.tsx`: o `key` de Aerobico/ExercicioForm passou a `aeSession`/`formSession` (incrementa ao **abrir**, não ao fechar), então o modal permanece montado para animar a saída e ainda reinicializa o estado a cada abertura.
- `src-app/src/features/social/FriendQrModal.tsx` e `QrScannerModal.tsx`: `useModalExit` — Esc/X/backdrop animam antes do `onClose` do pai; o botão "Escanear" espera a saída do modal de amigos para abrir o leitor; o leitor entrega o convite lido depois da animação (`requestClose(() => onInvite(invite))`).
- `src-app/src/features/social/social.css`: entrada/saída de `.friend-qr-overlay` (fade + `scale(0.94) translateY(10px)` no card) e `.qr-scanner` (fade + zoom leve), com bloco `prefers-reduced-motion`.
- `src-app/src/main.tsx`: importa `modal-motion.css` depois de `shell.css`, para vencer os empates de cascata com o CSS legado.

### Verificado
- `npm --prefix src-app run build` (`tsc -b` + `vite build`): OK — as duas imagens padrão entram em `dist/assets/` com hash (`LoagingVertical-*.png` 1,08 MB e `LoagingHorizontal-*.png` 960 KB) e nenhum erro de tipos.
- `npm --prefix src-app run lint`: 0 erros e 73 avisos — a mesma contagem de antes; `CycleModal.tsx` e `useModalPresence.ts` não geram avisos.
- `npm run lint:docs`: OK (319 caminhos verificados, §15 coerente, CHANGELOG dentro do limite).
- Limitação: a validação visual em navegador não foi executada nesta sessão (o app exige login); o comportamento dos modais foi revisado no código e o build de produção foi gerado.

## [v4.52.1] - 2026-10-26

**Imagem voltou a ser enviada junto com o texto: a checagem de `canShare()` estava descartando o arquivo.**

O usuário relatou que só o texto chegava no compartilhamento. Causa: `shareNative()` validava a payload COMPLETA (`{ title, text, files }`) com `navigator.canShare()`. Algumas implementações dessa API validam apenas a propriedade `files` (orientação do próprio web.dev) e respondiam `false` para a payload com texto/título — o app interpretava como "plataforma sem share de arquivo" e seguia para o fallback de texto, sem nunca chamar a folha com a imagem. Reproduzido em navegador com um canShare estrito: `canShare({title,text,files})` = **false**, `canShare({files})` = **true**; com a correção o `share()` recebe `{title, text, files:[PNG 172 KB]}`.

### Changed
- `src-app/src/lib/native-share.ts`: quando a payload contém arquivo, a checagem passa a usar apenas `{ files: data.files }` (o `share()` continua recebendo título + texto + imagem juntos).
- `src-app/src/features/gamification/ShareModal.tsx`: `handleShare` tenta em cascata `{title, text, files}` → `{files}` (plataformas que recusam texto+arquivo, ex.: iOS), e só então o fallback; o fallback de plataforma sem share de arquivo agora chama `deliverImage()`, que **baixa E copia o PNG para a área de transferência** (antes baixava só), com toast explicando o que aconteceu; cancelar a folha de texto não dispara download.

### Verificado (harness temporário no navegador, removido depois)
- canShare estrito (recusa texto na payload) → share recebe texto + imagem.
- share() lança TypeError com texto+arquivo (iOS-like) → repete com `{files}` e a imagem vai embora.
- Sem suporte a arquivo (desktop-like) → texto compartilhado + PNG baixado e copiado (clipboard `image/png`).
- `tsc -b`, `oxlint` (0 erros) e `vite build` OK.

## [v4.52.0] - 2026-10-26

**Compartilhamento consertado: texto e imagem saem juntos, gerados pelo site, em todas as plataformas.**

O modal de compartilhamento estava morto: o botão COMPARTILHAR ficava `disabled` para sempre porque a variável `imageReady` nunca recebia valor, e mesmo quando o canvas era renderizado o arquivo nunca era criado (`canvasFileRef.current = canvasFileRef.current || null` não fazia nada) — o compartilhamento caía sempre no texto sem imagem. Verificado em navegador com um harness temporário (removido depois): antes do fix o botão estava `disabled: true`; depois, o clique entrega título + texto + PNG em 171 KB (552×793).

### Changed
- `src-app/src/features/gamification/ShareModal.tsx`: novo `buildShareFile()` que rasteriza o card ativo (html2canvas, que continua chunk sob demanda), chama `toBlob('image/png')` e devolve um `File` real (antes o `.jpg` errado agora é `evo-fit-{treino|conquista|radar}-{data}.png`); a imagem é pré-renderizada ao ABRIR o modal (e não no clique) porque a Web Share API exige gesto do usuário e o html2canvas leva ~1s, o que estourava a ativação transitória do navegador; `renderSeqRef` descarta render antigo que termine depois de trocar de card; `handleShare` agora envia `shareNative({ title, text, files: [png] })` (texto + imagem juntos) e, se a plataforma recusar arquivo (ex.: Chrome desktop), compartilha o texto e baixa a imagem; sem Web Share, baixa o PNG e tenta copiá-lo para a área de transferência; `handleDownload` reusa o mesmo arquivo e o botão COMPARTILHAR deixou de ficar desabilitado (`disabled={busy !== null}`), mostrando "PREPARANDO..." enquanto a imagem é gerada; texto compartilhado personalizado por card (`shareText`: treino com exercícios/volume, conquista com o nome do emblema, radar) e os links de WhatsApp/X/Facebook passam a usá-lo.
- `src-app/src/lib/native-share.ts`: a chamada a `canShare()` ficou envolta em `try/catch` — um navegador que lance nessa API não derruba o fluxo e cai no fallback (antes viraria exceção e exibiria "Erro ao preparar compartilhamento").

### Removed
- `src-app/share-test.html` + `src-app/src/share-test.tsx`: harness temporário usado para testar os três cards e os três caminhos de fallback (Web Share com arquivo, Web Share só texto e sem Web Share). Não faz parte do app.

### Verificado
- `tsc -b` OK, `oxlint` 0 erros (73 avisos pré-existentes), `vite build` OK (html2canvas segue fora do bundle inicial).
- Navegador (cards treino/conquista/radar): clique em COMPARTILHAR entrega `{title, text, files:[PNG 152–178 KB]}`; `canShare` recusando arquivo → share de texto + download do PNG; sem Web Share → download do PNG + tentativa de cópia para clipboard. Erro no console: nenhum.
- Limitação: o app exige login (App.tsx), então os testes rodaram num harness temporário com os mesmos componentes/CSS; a folha nativa em si (Android/iOS) precisa de aparelho.

## [v4.51.0] - 2026-10-26

**Performance do carregamento inicial: 9,5 MB saíram do caminho crítico (sem tocar em visual, features ou funcionamento).**

Medido no build de produção (`vite preview`): antes, o carregamento da página baixava **9,5 MB** (MAIN.mp3 7,4 MB + Revenger Phoenix 1,5 MB + bundle 486 KB + CSS 93 KB) e ainda carregava a API do YouTube; agora baixa **657 KB** até o evento `load` e o restante só depois dele.

### Changed
- `src-app/src/features/music/audio-engine.ts`: o arranque da música saiu do boot. `armGestures()` continua imediato (só listeners, custo zero), mas `loadYtApi()`, `preloadYtPlayer()`, `playSite('main')` e o pré-decode da faixa de Missões passam a rodar em `whenIdleAfterLoad()` — depois do `load` + `requestIdleCallback` (fallback `setTimeout`). Guarda `waStartSeq === 0` impede que o arranque atrasado reinicie uma faixa que um gesto do usuário já iniciou. Nada muda no comportamento da música (ela só podia tocar após um gesto, já que os contextos `main/missions/result` usam Web Audio e o `AudioContext` nasce suspenso).
- `src-app/index.html`: o watchdog de boot (intervalo de 250 ms que acompanhava o `#root`) agora se encerra com `clearInterval` quando o app monta e a splash sai (antes rodava a sessão inteira); e ganhou `preconnect` para `fonts.googleapis.com` / `fonts.gstatic.com` (Material Symbols), evitando DNS/TLS extra só depois de baixar o CSS do Google.

### Notas (avaliado e descartado)
- `qrcode` sob demanda (`import()` em `AuthScreen`/`FriendQrModal`): o split gerou um chunk compartilhado e **aumentou** o pacote inicial (486 KB → ~500 KB gzip) — revertido; nada mudou nesses arquivos.
- Todas as seções seguem montadas no `.section-strip` desde o boot (requisito do swipe/`translateX`), então `React.lazy` nelas mudaria o funcionamento — não aplicado. `src-app/dist` não é versionado; o build de produção foi refeito e validado.

## [v4.50.0] - 2026-10-26

**Logo do site trocada para `src-app/public/assets/Logo.png` na aba do navegador, no site e na instalação como PWA.**

### Changed
- `src-app/public/assets/icons/`: novos ícones derivados de `src-app/public/assets/Logo.png` (1254×1254) — `logo-32.png`, `logo-48.png`, `logo-180.png`, `logo-192.png`, `logo-512.png` e `logo-maskable-512.png` (logo a 78% sobre fundo preto, para o recorte circular do Android). Os nomes são novos de propósito: `/assets/*` é servido com cache de 1 ano (`immutable` no `vercel.json`), então sobrescrever `icon-192.png`/`icon-512.png` deixaria o ícone antigo nos navegadores que já o baixaram.
- `src-app/index.html`: `<link rel="icon">` deixa `D.jpg` e passa a `logo-32.png` / `logo-48.png`; `apple-touch-icon` usa `logo-180.png`; `og:image` aponta para `logo-512.png`.
- `src-app/vite.config.ts`: ícones do manifesto PWA (`manifest.icons`) → `logo-192.png` e `logo-512.png` (`purpose: any`) + `logo-maskable-512.png` (`purpose: maskable`).
- `src-app/src/features/music/audio-engine.ts`: artwork da Media Session (notificação e controles de música do aparelho) → `logo-192.png` / `logo-512.png`.
- `src-app/src/features/settings/SettingsFeature.tsx`: o cartão "Instalar Aplicativo (PWA)" exibe `logo-192.png` no lugar do ícone de lápis; a notificação de teste usa `/assets/icons/logo-192.png` (o caminho anterior `/icon-192.png` não existia no build).

## [v4.48.0] - 2026-10-25

**Música de fundo (MAIN) não sobrevive mais ao fechamento do site.**

### Fixed
- `src-app/src/features/music/audio-engine.ts`: a MAIN — e as demais faixas ocultas (RESULT, Missões), que tocam como `AudioBufferSourceNode` em loop sobre um `AudioContext` — continuava tocando depois de fechar o site; o navegador não suspende Web Audio quando a aba/janela desaparece e, no computador, fechar o painel/vista do app nem sempre destrói a página. Novo tratamento de ciclo de vida no `initAudioEngine()`: `pagehide` (fechar aba/janela, navegar) e `visibilitychange → hidden` pausam tudo (fonte Web Audio + `<audio>` do site + uploads da fila + `pauseVideo()` do YouTube) via `pauseAllForLifecycle()`; `visibilitychange → visible` retoma de onde parou com `resumeAfterVisibility()` (só se a música estava tocando e a pref seguir ligada). A pausa usa `pauseHidden()`, então o ponto da faixa é preservado.
- `src-app/src/lib/background-music.ts`: o loop legado do `HTMLAudioElement` recebe o mesmo tratamento (`pagehide`/`hidden` pausam; `visible` retoma quando a reprodução é deste módulo) — hoje o `audio-engine` assume a posse no boot, então isto é a rede de segurança caso o motor falhe.

## [v4.49.0] - 2026-10-25

**Perguntas pós-login aprimoradas com novas etapas e tela de boas-vindas.**

### Changed
- `src-app/src/features/auth/OnboardingScreen.tsx`: adicionadas novas perguntas de pós-login — **"Por que usar o app fitness?”** e **"Como conheceu o app?”** — como texto informativo nas etapas de conta (para contas não-Google) e no rodapé; **peso, idade e altura** agora fazem parte da mesma etapa (**corpo**), com campos numéricos sincronizados na nuvem.
- `src-app/src/features/auth/OnboardingScreen.tsx`: reescrito o assistant com 11 etapas no estilo das imagens de referência — ordem: **Sua Conta → Motivo de Uso → Principais Objetivos → Tempo de Experiência → Sexo → Idade, Peso e Altura (juntas) → Frequência de Treino → Local de Treino → Indicação → Programa de Treino → Notificações** (últimas duas etapas, com tela de boas-vindas ao final).
- `src-app/src/features/auth/OnboardingScreen.tsx`: título das boas-vindas agora exibe **“Bem-vindo ao Evo Fit, {nome}!”** com logo G lime-green (#CCFF00) no topo; tela de boas-vindas tem duração de 2.8s antes de fechar automaticamente.
- `src-app/src/core/db/schema.ts`: campos opcionais já existentes `heightCm`, `appReasons`, `referralSource`, `mainGoals`, `experienceLevel`, `gender`, `trainingFrequencyDays`, `trainingPlace`, `notificationsEnabled` são mantidos/garantidos para o novo onboarding.

### Added
- `src-app/src/features/auth/OnboardingScreen.tsx`: etapa **notificações** é a última do fluxo de perguntas; ao concluir, exibe tela de boas-vindas “Bem-vindo ao Evo Fit” por 2.8s antes de fechar, com auto-close timer.
- `src-app/src/features/auth/OnboardingScreen.tsx`: pergunta **"Por que usar o app fitness?”** aparece como texto informativo quando a conta não é do Google (para contas e-mail, permite definir senha depois).
- `src-app/src/features/auth/OnboardingScreen.tsx`: pergunta **"Como conheceu o app?”** aparece como texto informativo no rodapé da etapa de indicação.

## [v4.47.0] - 2026-10-25

**Assistente de perguntas pós-login no estilo das imagens de referência, com destaque em vermelho.**

### Changed
- `src-app/src/features/auth/OnboardingScreen.tsx`: reescrito como assistente de tela cheia no estilo das imagens — cabeçalho com seta **voltar**, nome da pergunta + contador **"(n/10)"** e **"Pular"**; título grande com o trecho em destaque em **vermelho `#ef4444`**; cartões de opção com título, descrição, selo ("Popular", "Powerlifting", "Recomendado") e rádio; botão **"Continuar"** fixo no rodapé (cinza/desabilitado até houver resposta).
- `src-app/src/features/auth/OnboardingScreen.tsx`: ordem das 10 etapas — **Sua Conta → Motivo de Uso → Principais Objetivos → Tempo de Experiência → Sexo → Idade → Peso → Frequência de Treino → Local de Treino → Programa de Treino** (conta e programa obrigatórios; as demais com "Pular").
- `src-app/src/features/auth/OnboardingScreen.tsx`: **Idade** virou etapa própria com valor em destaque (substitui o campo de idade dentro do antigo bloco "Dados opcionais"); a etapa "Peso" manteve a pergunta com o mesmo tratamento.
- `src-app/src/features/auth/OnboardingScreen.tsx`: as perguntas antigas "Pratica atividade física?" e "Há quanto tempo?" saíram do fluxo — a nova **Tempo de Experiência** (nível na musculação) e a **Frequência de Treino** cobrem o mesmo uso; os campos `activityDuration*` continuam no schema, apenas o onboarding deixa de preenchê-los.
- `src-app/src/features/auth/OnboardingScreen.tsx`: cada etapa de resposta única grava no perfil ao avançar (respostas ficam salvas se o usuário fechar no meio); "Pular" avança sem gravar; "Voltar" preserva o que já foi respondido.

### Added
- `src-app/src/core/db/schema.ts`: novos campos opcionais em `ProfileCustomization` — `appReason` (motivo de usar o app), `mainGoals` (principais objetivos), `experienceLevel` (tempo de experiência), `gender` (sexo), `trainingFrequencyDays` (frequência, 7 = todos os dias) e `trainingPlace` (local de treino). Por serem parte do `profileState`, sincronizam com a nuvem junto do snapshot.

### Fixed
- `src-app/src/features/auth/OnboardingScreen.tsx`: as etiquetas do layout são `<div>` em vez de `<header>`/`<main>`/`<footer>` — o CSS legado global aplica `header { position: fixed }`, `main { min-height: 100vh }` e `footer::before/::after` posicionados de forma absoluta; com a tag `<footer>` o pseudo-elemento cobria o botão e **os cliques em "Continuar" não chegavam**. O conteúdo também passou a ter `min-height: 0` inline, senão o `min-height: 100vh` do legado empurrava o rodapé para fora da tela em janelas baixas (botão inalcançável).

## [v4.46.0] - 2026-10-25

**Login sem botão de fechar e sem a chave ativa; perguntas pós-login com nome, usuário e senha.**

### Changed
- `src-app/src/features/auth/AuthScreen.tsx`: removidos o botão **fechar** (X no canto superior direito) e a linha **“Chave ativa”** do welcome; saíram junto o estado `activeSyncKey` e os imports `getSyncKey`/`DEFAULT_SYNC_KEY`/`KeyRound`. `setSyncKey` continua sendo aplicado pela gaveta “Vincular Chave” e o ESC segue fechando a tela.
- `src-app/src/features/auth/OnboardingScreen.tsx`: nova primeira etapa **“Sua conta”** nas perguntas pós-login, que pede **Nome** e **Nome de usuário (@handle)** — validados com a mesma regra do cadastro (3–20, `a-z0-9_`) — e grava `customization.nome`/`customization.handle` no perfil (os mesmos campos das Configurações e do card de perfil). Os campos são pré-preenchidos com o perfil salvo ou com os dados do provedor (nome do Google, e-mail) sem sobrescrever o que o usuário digitar.
- `src-app/src/features/auth/OnboardingScreen.tsx`: a pergunta **"Senha do usuário"** aparece apenas quando a sessão entrou pelo **Google** (`app_metadata.provider`/`identities`), pois contas de e-mail já têm senha. É opcional (mín. 6 caracteres) e chama o novo `updatePassword`, criando a senha real da conta para o login por e-mail.
- `src-app/src/features/auth/OnboardingScreen.tsx`: navegação das etapas corrigida — “Voltar” na etapa de dados retorna para a conta e “Voltar” no objetivo retorna para os dados (antes apontava para a própria etapa e não saía do lugar).

### Added
- `src-app/src/core/auth/auth-context.tsx`: `updatePassword(password)` no `AuthContextValue`, usando `supabase.auth.updateUser({ password })` com o mesmo `formatAuthError` dos outros métodos (guard `isSupabaseConfigured` para o Modo Offline).

## [v4.45.0] - 2026-10-25

**Telas Personalizadas: imagens da tela de bloqueio e do splash agora sincronizam na nuvem.**

### Fixed
- `src-app/src/core/sync/sync-manager.ts`: as imagens das **Telas Personalizadas** (`mbc_lock_desktop`, `mbc_lock_mobile`, `mbc_loading_vertical`, `mbc_loading_horizontal`) entram no `prefs` do snapshot enviado para a tabela `user_sync` (`CUSTOM_SCREEN_KEYS`, incluído em `PREF_KEYS_TO_SYNC`). Antes elas viviam apenas no `localStorage` do dispositivo e nunca chegavam à nuvem, então a tela de bloqueio e o splash personalizados não apareciam nos outros aparelhos.
- `src-app/src/core/sync/sync-manager.ts`: no `applySnapshot`, a string vazia vinda da nuvem remove a chave local dessas imagens (o `LockScreen` e a splash do `index.html` voltam ao preset padrão). Chave ausente continua significando "nunca definida" — um dispositivo sem imagens não apaga as dos outros (last-write-wins só entre valores reais).
- `src-app/src/features/sync/ScreensCustomizationPanel.tsx`: "Remover imagem" grava `''` em vez de apagar a chave (chave apagada = "nunca definida", o valor antigo continuaria vencendo na nuvem); o prop `storageKey` do `ImageCard` foi removido (a persistência é responsabilidade do `onChange`).
- `src-app/src/features/settings/SettingsFeature.tsx`: o botão "Remover" dos papéis de parede da tela de bloqueio também grava o marcador vazio, para a remoção propagar entre dispositivos.

### Changed
- `src-app/src/features/sync/ScreensCustomizationPanel.tsx`: os 4 slots reagem a `academia:lock-prefs-changed` recarregando do `localStorage`, então imagens que chegam da nuvem (ou de outra aba) aparecem nos cards e nas prévias com o painel já aberto.

## [v4.44.2] - 2026-10-24

**Conta Google no perfil, foto do usuário e cronômetro de descanso do legado.**

### Fixed
- `src-app/src/App.tsx`: a sessão Google agora preenche **e-mail, nome, @handle e foto** do perfil (antes só gravava `photo`). Campos só são preenchidos quando estão vazios/padrão (`DECEPTIVON`/`@deceptivon`); foto personalizada pelo usuário é preservada e avatares do Google são atualizados.
- `src-app/src/features/settings/SettingsFeature.tsx`: o botão **Salvar Informações** gravava apenas o nome — agora salva nome, @handle, e-mail e foto juntos; o campo de e-mail usa `user.email` como fallback; a prévia da foto acompanha o valor digitado/selecionado.
- `src-app/src/features/profile/ProfileFeature.tsx` e `src-app/src/features/dashboard/DashboardFeature.tsx`: o avatar do cabeçalho e do Início dão prioridade à foto (`customization.photo`) em vez de exibirem sempre o emblema/dicebear.

### Changed
- `src-app/src/features/workout/RestTimerWidget.tsx` (novo, montado no `App`): cronômetro de descanso flutuante idêntico ao legado (`#restTimer`): contagem mm:ss, clique reinicia em 60 s, ✕ encerra, visuais **radar/ampulheta/cyber/arcade** (progresso proporcional ao tempo restante) e corrida de 1 s única — antes o timer só decrementava com o Modo Foco aberto, ficando congelado na Ficha.
- `src-app/src/store/workout-store.ts`: `tickRestTimer` ignora ticks fora do descanso, `startRestTimer` valida o valor (inválido → 60) e, ao zerar, dispara o bipe + toast "Tempo de descanso encerrado! Bora pro próximo!" (paridade `secao-ficha.js`).
- `src-app/src/lib/app-prefs.ts`: `playRestTimerSound` agora reproduz o bipe único de 800 Hz com decaimento de 0,5 s + vibração `[200,100,200]` do `playBeep()` legado.
- `src-app/src/features/workout/FichaFeature.tsx`, `FocusModal.tsx` e `ActiveWorkoutModal.tsx`: removeram o widget/tick duplicado do descanso (o tick passou a ser único no `RestTimerWidget`).
- `src-app/src/features/settings/SettingsFeature.tsx` e `src-app/src/features/workout/treinos/CustomizacaoTabs.tsx`: escolher o estilo do cronômetro emite `academia:timer-style-changed`; a customização (Radar/Ampulheta/Cyber/Arcade) agora também grava `timerStyle` no localStorage, então a skin escolhida passa a valer no cronômetro real.

## [v4.44.1] - 2026-10-23

**Onboarding: corrigido reaparecimento a cada acesso.**

### Fixed
- `src-app/src/core/db/idb.ts`: `PROFILE_STATE_KEY('local')` agora retorna a chave canônica `local` (antes `profile_state_local`). Como a tabela `profileState` usa `keyPath: 'key'`, o Dexie ignora a chave passada em `put()` e grava com o `key` do objeto — o onboarding era salvo em `local`, mas lido em `profile_state_local`, que nunca existia, fazendo a tela de primeiro acesso reaparecer em todo carregamento. `saveProfileState` também força `{ ...state, key }` para garantir a chave correta.
- `src-app/src/core/sync/sync-manager.ts`: `academia:profile-updated` entrou na lista de auto-push (init/stop), para que dados de perfil e a flag `onboarded` cheguem ao snapshot remoto e não sejam sobrescritos por um pull antigo.

## [v4.44.0] - 2026-10-23

**Configurações: Preferências do App (semana, unidades, tema, som e foco) e notificações.**

### Added
- `src-app/src/lib/app-prefs.ts`: módulo de preferências sem dependências (semana, peso, distância, som do temporizador, foco padrão e placeholders de notificações), com getters/setters que gravam em localStorage e emitem `academia:prefs-changed`, além de `formatLoadLabel`, `convertKgToDisplay`, `formatSpeed`/`convertSpeedValue`, `getWeekDayLabels` e `playRestTimerSound`.
- `src-app/src/features/settings/SettingsFeature.tsx`: nova tela/tile "Preferências do App" com linhas expansíveis para primeiro dia da semana (segunda/domingo), unidade de peso (kg/lb), unidade de distância (km/mi), tema e idioma, mais os toggles "Som do temporizador (entre as séries)" e "Modo Foco por padrão nos treinos".
- Tela de Notificações reorganizada com "Permitir notificações" (solicita permissão do navegador) e placeholders persistidos para lembretes de treino, novidades e atualizações, ligas e mensagens motivacionais.
- `src-app/src/features/settings/settings.css`: estilos `.set-pref-*` (linhas com ícone/rótulo/valor, opções, swatch e grade de temas).

### Changed
- `src-app/src/core/db/queries.ts`: `formatCarga` converte a carga para a unidade de peso escolhida; sufixo "cada lado" não é duplicado.
- `src-app/src/features/workout/FichaFeature.tsx` e `FichaDeck.tsx`, `treinos-helpers.ts` e `TreinosModals.tsx`: velocidade do cardio exibida em km/h ou mph conforme a preferência; "Modo Foco por padrão" abre o foco ao iniciar um treino.
- `src-app/src/features/training/ProgressoFeature.tsx`: "Sua Semana", o cabeçalho e as células do calendário mensal respeitam o primeiro dia configurado; volumes e calculadora 1RM usam a unidade de peso escolhida.
- `src-app/src/features/gamification/ShareModal.tsx`: volume total e destaques do card usam a unidade de peso configurada.
- `src-app/src/store/workout-store.ts`: ao fim do descanso entre séries, toca o aviso sonoro (se ativado).
- `src-app/src/features/profile/profile-data.ts` e `src-app/src/core/sync/sync-manager.ts`: novas chaves entram em `PREF_KEYS` e passam a ser sincronizadas entre dispositivos.

## [v4.43.7] - 2026-10-23

**Amigos: modal "Adicionar" reestilizado com abas e busca de jogador.**

### Added
- `src-app/src/features/social/friend-search.ts`: busca de jogadores na tabela `public.profiles` (username/display_name), com sanitização da consulta e erro específico de modo offline.
- `src-app/src/features/social/social-icons.tsx`: ícones `SearchIcon` e `QrCodeIcon` no padrão stroke/currentColor.

### Changed
- `src-app/src/features/social/FriendQrModal.tsx`: modal com duas abas ("Meu QR Code" e "Buscar jogador"), moldura de QR com cantos destacados, placa com nome/código e lista de resultados com botão "Adicionar"/"Adicionado" (debounce de 350 ms, mínimo de 2 caracteres).
- `src-app/src/features/social/social.css`: novo visual do modal (cabeçalho, abas em pílula, moldura do QR, campo de busca e cartões de resultado) mantendo a paleta atual (roxo).
- `src-app/src/features/social/LigasFeature.tsx`: `applyInvite` retorna o resultado, escuta também `academia:friends-changed` e passa `selfId`/`onAddPlayer` ao modal.

## [v4.43.6] - 2026-10-23

**Onboarding: predefinição de treino aplicada nas fichas.**

### Changed
- `src-app/src/features/auth/OnboardingScreen.tsx`: ao selecionar um objetivo (exceto "Treino personalizado"), aplica o template correspondente (`applyTemplate`) nas fichas A/B, conforme o mapeamento objetivo→template.

## [v4.43.5] - 2026-10-23

**Onboarding: dados salvos, botão mais escuro e estilo da mensagem de evolução.**

### Fixed
- `src-app/src/features/profile/useProfileState.ts`: `update()` cria o estado de perfil se ausente, garantindo que os dados do onboarding sejam salvos (e o onboarding exibido apenas uma vez).
- `src-app/src/features/auth/OnboardingScreen.tsx`: botão "Continuar" com roxo mais escuro (`#5b21b6`).
- `src-app/src/features/workout/treinos/DetalhesPecaModal.tsx`: mensagem de evolução vazia passa a usar o mesmo estilo/fundo (`.cr-description-box`) da sub-aba de descrição.

## [v4.43.4] - 2026-10-23

**Evolução de força: mensagem inicial e gráfico alinhado ao editor.**

### Changed
- `src-app/src/features/workout/treinos/DetalhesPecaModal.tsx`: quando não há histórico de carga, exibe "Registre sua evolução de carga em Detalhes para ver sua evolução aqui."; gráfico passa a usar a mesma estrutura (`.chart-bar-wrap`/`.chart-val`/`.chart-bar`/`.chart-date`) do editor de exercício.
- `src-app/src/features/workout/treinos/ExercicioFormModal.tsx`: ícone de evolução de carga (📈) substituído por SVG no padrão do site (stroke/currentColor).

## [v4.43.3] - 2026-10-23

**Correção: onboarding do primeiro acesso não aparecia após login.**

### Fixed
- `src-app/src/core/db/bootstrap.ts`: `bootstrap()` retorna `Promise.resolve()` quando já iniciado, evitando `.then` em `undefined` (que impedia `bootstrapLoading` de virar `false`).
- `src-app/src/App.tsx`: `OnboardingGate` passa a exibir o onboarding quando o usuário está logado e não concluiu o onboarding, mesmo que o `profileState` ainda não tenha carregado.

## [v4.43.2] - 2026-10-23

**Reset único de dados legados: vinculação automática da sync key à conta.**

### Added
- `src-app/src/main.tsx`: reset único (versão `v4.43.2-account-sync`) que limpa localStorage, sessionStorage e bancos IndexedDB locais, forçando novo login e início "do zero". Garante que dispositivos com sync keys antigas migrem para o sistema de vinculação automática.

### Changed
- Todos os dados salvos anteriormente são removidos; usuários precisam fazer login novamente.

## [v4.43.1] - 2026-10-23

**Vinculação da sync key à conta, sync de preferências e foto Google.**

### Added
- `src-app/src/core/sync/supabase-client.ts`: `deriveSyncKeyForUser()` deriva chave estável a partir do id/e-mail da conta autenticada.
- `src-app/src/App.tsx`: ao logar, a sync key é derivada da conta (mesma conta = mesmos dados); foto de perfil da conta Google é aplicada ao perfil do app.

### Changed
- `src-app/src/core/sync/sync-manager.ts`: snapshot passa a incluir `prefs` (tema, player, sidebar, lock, navbar, auto-fullscreen); aplicação restaura-as e dispara eventos de atualização.
- `src-app/src/features/profile/profile-data.ts`, `src-app/src/App.tsx`: mudanças de tema e sidebar disparam `academia:prefs-changed` para auto-push.

## [v4.43.0] - 2026-10-23

**Peças faltantes da arquitetura de dados (dados.md): banner offline, coalescência e comparação canônica.**

### Added
- `src-app/src/lib/canonical.ts`: `cleanAndSortObject`, `safeStringify` e `canonicalEqual` para comparação profunda de snapshots.
- `src-app/src/features/sync/OfflineSyncBanner.tsx`: indicador de modo offline / mutações pendentes, montado no `App.tsx`.

### Changed
- `src-app/src/core/sync/sync-manager.ts`: `pushSnapshot` cancela o push quando o snapshot é canonicamente idêntico ao último salvo; `applySnapshot` marca o snapshot recebido como último salvo (evita loop ping-pong).
- `src-app/src/core/sync/offline-queue.ts`: coalescência (state folding) no enfileiramento e no flush — mutações pendentes do mesmo `syncKey` são agrupadas e apenas a mais recente é enviada.

## [v4.42.9] - 2026-10-23

**Correcao adicional do compartilhamento: remover render duplicado e reduzir escala.**

### Fixed
- `src-app/src/features/gamification/ShareModal.tsx`: removido pre-render duplicado que podia travar o site; escala do html2canvas reduzida para 1.5.

## [v4.42.8] - 2026-10-23

**Correcao do compartilhamento: botao habilitado apos pre-render.**

### Fixed
- `src-app/src/features/gamification/ShareModal.tsx`: o botao "COMPARTILHAR" ficava desabilitado indefinidamente porque o pre-render nao atualizava o estado `imageReady`; agora o arquivo PNG e gerado no pre-render (com delay para o DOM montar) e habilita o botao.

## [v4.42.7] - 2026-10-22

**Compartilhamento nativo alinhado ao Share.md.**

### Changed
- `src-app/src/features/gamification/ShareModal.tsx`: imagem pre-gerada em PNG; payload inclui `url` e link no texto; fallback com botoes WhatsApp/X/Facebook quando nao ha Web Share API.
- `src-app/src/lib/native-share.ts`: ja existente, usado com canShare/AbortError.
- `src-app/index.html`: meta tags Open Graph/Twitter para previa do link.

## [v4.42.6] - 2026-10-22

**Evolucao de forca (carga): quarta aba nos detalhes do exercicio.**

### Changed
- `src-app/src/features/workout/treinos/DetalhesPecaModal.tsx`: adicionada 4a pagina (dot) com o grafico de evolucao de carga (historicoCargas), alem da edicao de exercicio que ja registrava o historico.

## [v4.42.5] - 2026-10-22

**Modal de exercício: scroll e fundo preto.**

### Fixed
- `src-app/src/legacy-style/treino/2-modals.css`: `.modal-form` (formulário de exercício) deixou `overflow: hidden` (que impedia rolar até as observações) e passou a `overflow-y: auto` com `max-height: 90vh`; fundo roxo (`rgba(10,5,20,0.85)`) substituído pelo preto `#111`, alinhado ao tom da aba Minha Ficha.

## [v4.42.4] - 2026-10-22

**Home: modal de Ciclo com heatmap e breakdown.**

### Added
- `src-app/src/features/dashboard/DashboardFeature.tsx`: clicar no card de ciclo abre um modal com heatmap dos 30 dias do ciclo atual (dias concluídos destacados) e o breakdown por ficha.

## [v4.42.3] - 2026-10-22

**Ofensiva: cinza em novo dia até concluir o treino do dia.**

### Changed
- `src-app/src/features/dashboard/DashboardFeature.tsx`: quando a ofensiva é maior que 1 dia, o botão de ofensiva exibe o estado cinza (`.dash-streak-btn--off`) ao abrir o app em um novo dia, tornando-se colorido após a conclusão do treino do dia (`completedToday`). O período válido para aumentar a ofensiva permanece 00:00–23:59 de cada dia (data do treino concluído).

## [v4.42.2] - 2026-10-22

**Ajustes de perfil: chave de sync única, nome=handle, destaque funcional, ano de ingresso e ofensivas reais.**

### Added
- `src-app/src/core/sync/supabase-client.ts`: `getSyncKey()` gera e persiste uma chave única quando não existe chave configurada (evita namespace compartilhado por padrão).
- `src-app/src/features/auth/AuthScreen.tsx`: cadastro gera chave de sincronização única por padrão (a menos que uma chave existente seja vinculada).
- `src-app/src/features/profile/ProfileFeature.tsx`: ano de "AQUI DESDE" preenchido com o ano de ingresso na plataforma (conta Supabase ou ano atual em modo offline).

### Changed
- `src-app/src/features/profile/ProfileFeature.tsx`: removida a opção separada de "Nome de Exibição"; o nome passa a ser o próprio handle.
- `src-app/src/features/profile/ProfileFeature.tsx`: opções de "Em Destaque" agora salvam imediatamente (funcionais).
- `src-app/src/features/profile/ProfileFeature.tsx`: "Ofensivas dos Amigos" passa a exibir os amigos realmente adicionados (ou estado vazio quando não houver).
- `src-app/src/features/profile/profile-data.ts`: fallback de "AQUI DESDE" deixa de ser fixo em 2024.

## [v4.42.1] - 2026-10-22

**Correção do erro de interface Minified React error #310 (hooks condicionais).**

### Fixed
- `src-app/src/App.tsx`: removidas chamadas condicionais de hooks (early returns de auth/bootstrap antes de `useState`/`useEffect`/etc.), que violavam as Rules of Hooks e causavam "Rendered fewer hooks than expected" em runtime. A árvore autenticada foi isolada em `AppShell` (renderizado apenas após autenticação) e os retornos de carregamento/erro do bootstrap foram movidos para depois da declaração de todos os hooks.

## [v4.42.0] - 2026-10-21

**Músicas avulsas YouTube em Início/Suas músicas, anotações na edição e fila fluida.** Links YouTube vídeo entram em “Suas músicas” e aparecem na lista da aba Início; anotações do exercício são carregadas ao abrir a edição; fila do treino anima abertura/fechamento; início da playlist não espera expansão de containers nem criação do player YouTube.

### Added
- MusicOverlay.tsx: `externalTracks` listado na seção “Músicas” e na fila oculta.
- media-store.ts: link YouTube `refType: video` adicionado a `SUAS_MUSICAS_ID` quando `addToLibrary`; fallback de metadados garante faixa na biblioteca global.

### Changed
- audio-engine.ts: `startUserQueue()` toca 1ª faixa imediatamente; expansão de containers em segundo plano; player YouTube criado uma única vez e pré-montado no boot, reduzindo início da playlist em vários segundos.
- WorkoutNowPlayingBar.tsx + music.css: fila do treino anima abertura/fechamento; respeita `prefers-reduced-motion`.
- ExercicioFormModal.tsx: anotações sincronizadas de `editEx.notes` ao abrir/trocar item.

### Fixed
- Anotações vazias/antigas ao reabrir edição de exercício.

## [v3.0.0] - 2026-05-31
*Correção de Visualização: Prévias das Barras de Progresso*

### [Fixed]
- **`JS/treino/secao-customizacao.js`**: Corrigida a função `_renderBarSkins` — as prévias de cada skin agora recebem os estilos de fundo (`background` + `box-shadow`) via atributo `style` inline, lidos diretamente de `BAR_SKIN_STYLES`. Isso garante visibilidade imediata independente de cache de CSS.
- **`JS/treino/secao-customizacao.js`**: Corrigida a skin `'default'` em `BAR_SKIN_STYLES` para ter um gradiente visível (`linear-gradient(90deg, #dbfcff, #00dbe9)`) ao invés de string vazia, tornando a prévia do estilo padrão visível.
- **`style/treino/treino.css`**: Incrementado o versionamento do `@import` de `8-customizacao.css` para `v=3` forçando refresh do CSS.

## [v2.9.9] - 2026-05-31
*Expansão de Personalização: Arsenal de 33 Estilos de Barras de Progresso*

### [Added]
- **`JS/treino/secao-customizacao.js`**: Atualizados os catálogos `BAR_SKINS` e `BAR_SKIN_STYLES` com 33 novos estilos de barras de progresso premium, adicionando requisitos específicos de desbloqueio por treinos concluídos, streak ou maestrias (Chama, Gelo, Ouro Elite, Segmentado, Neon Cyber, Plasma, Biohazard, Solar, Carbono, Galáxia, Elixir, Mercúrio, Radar, Matrix, Sobrecarga, Supernova, Deep Void, Cyber Hunter, Bloodline, Bananil, Glacial Peak, Acid Flow, Starlight, Magma, Onyx Shield, Mercúrio Líquido, Nêutron Pulse, Prisma Cristalino, Vórtice do Vazio, Dourado Elite, Roxo Elite e Diamante Elite).
- **`style/treino/8-customizacao.css`**: Adicionados estilos completos para as 33 variações de barra, cobrindo o preenchimento de visualização (`.bar-skin-option--<key> .bar-skin-option__fill`) no menu de customização, além dos overrides em tempo real (`body[data-bar-skin="<key>"]`) para todas as barras de progresso, XP e ciclos do aplicativo (incluindo glows, animações 3D, varreduras neon e texturas de carbono/sangue).
- **`sw.js`**: Incrementada a versão do Service Worker (`CACHE_NAME` para `'academia-treino-v38'`) para limpar caches e sincronizar as novas personalizações visuais imediatamente nos navegadores clientes.

## [v2.9.8] - 2026-05-31
*Reorganização da Seção Perfil: Aba Configurações como Sub-aba de Preferências*

### [Changed]
- **`componentes/secoes/perfil.html`:** Removida a aba principal "CONFIG" (`#perfTabBtnConfig`) da barra superior do Perfil. Movido o contêiner de configurações (`#perf-tab-config`) para ser a sub-aba de "Configurações" (`#perf-subtab2-config`) dentro da aba de "PREFERÊNCIAS" (`#perf-tab-prefs`), integrando-a na barra de sub-navegação (`#perfPrefsSubNav`) com ícones harmonizados.
- **`JS/treino/secao-perfil.js`:** Ajustada a restauração de abas no boot para fazer o fallback da aba "config" para a aba "prefs". A navegação dinâmica por sub-abas gerencia de forma limpa e transparente o novo layout sem conflitos ou modificações extras de lógica.

## [v2.9.7] - 2026-05-28
*Correção Estrutural de Notícias e Ajuste de Isolamento de Cabeçalho*

### [Fixed]
- **`treino.html`:** Removida duplicação acidental e tags desemparelhadas dentro do modal `#news-overlay`, que encerrava o contêiner do modal prematuramente e quebrava o DOM da página de treino, exibindo os cabeçalhos fixados das notícias de forma inadequada em toda a interface principal.
- **`treino.html` e `noticias.html`:** Adicionadas propriedades de `visibility: hidden` e `visibility: visible` em conjunto com a transição de opacidade nas classes de `.detail-view`, garantindo isolamento total dos cabeçalhos fixados (`position: fixed`) das notícias individuais quando estas não estiverem ativas.

## [v2.9.6] - 2026-05-26
*Sincronização Dinâmica do Banner do Perfil com a Seção Início*

### [Changed]
- **`JS/treino/secao-customizacao.js`:** Atualizada a função `applyProfileCustomization(db)` para setar o atributo `data-banner` no `.dash-profile-banner-card` em sincronia com o perfil.
- **`JS/treino/secao-dashboard.js`:** Importada e executada `applyProfileCustomization(db)` no renderizador `renderDashboard(db)` para garantir consistência no carregamento.
- **`style/treino/8-customizacao.css`:** Expandidos todos os seletores de estilização de banner para cobrir `.dash-profile-banner-card` de forma idêntica ao perfil (incluindo gradientes e animações).
- **`style/treino/secoes/dashboard.css`:** Ocultada a textura quadriculada padrão `.dash-banner-checkers` quando um banner estilizado está ativo (`[data-banner]`).

## [v2.9.5] - 2026-05-26
*Mensagem de Boas-vindas Personalizada e Expansão do Banner do Perfil*

### [Changed]
- **`componentes/secoes/dashboard.html`:** Substituído o bloco de troféus e nickname por um cabeçalho de boas-vindas contendo `"Bem vindo de volta,"` e o elemento dinâmico `#dashUserName`, ocultando `#dashProfileTrophies` para manter a compatibilidade com a atualização via JavaScript.
- **`style/treino/secoes/dashboard.css`:** Alterado `.dash-profile-banner-card` para se expandir horizontalmente cobrindo a área contornada de forma elástica com `flex: 1` e `max-width: 220px`. Adicionado estilo premium para `.dash-welcome-text` e melhorado o comportamento responsivo mobile.

## [v2.9.4] - 2026-05-26
*Automação de Início de Treino e Rolagem Inteligente no "Próximo Passo"*

### [Changed]
- **`JS/treino/secao-dashboard.js`:** Atualizada a função `startWorkoutFromDashboard(db)` para iniciar o cronômetro do treino automaticamente chamando `initGlobalTimer(db)` (em vez de apenas `startInterval()`). Isso garante que os botões da ficha de treinos (mudar de "INICIAR TREINO" para "ENCERRAR TREINO") e o cronômetro visual se atualizem instantaneamente sem precisar recarregar a página.
- **`JS/treino/secao-dashboard.js`:** Adicionado suporte a rolagem suave até os exercícios (`scrollIntoView` com `behavior: 'smooth'`) acionado 520ms após a transição para a aba "Ficha", posicionando a tela na altura certa para o usuário começar a treinar sem esforço manual.

## [v2.9.3] - 2026-05-26
*Aprimoramento de Alta Fidelidade do Mini-Deck Builder no Dashboard*

### [Added]
- **`style/treino/secoes/dashboard.css`:** Adicionados estilos pixel-perfect e glows para o mini-deck. O active letter tab agora é aninhado em um **escudo/badge roxo poligonal** (`.dash-mini-deck__tab-shield` e `.dash-mini-deck__tab-letter`) idêntico ao Clash Royale, o cabeçalho agora inclui botão de hambúrguer de menu à esquerda e botão de troca de fluxo (`.dash-mini-deck__swap-btn`) ao lado de tab E. Os cards de exercício na grade de 4 colunas adotaram a borda de topo colorida correspondente a cada categoria muscular, imagem de exercício contida em contêiner branco com borda escura de contraste, cabeçalhos escuros com texto em uppercase e rodapé estilizado com o número de séries.
- **Estatísticas no Rodapé Reestilizadas:** Criados os três containers `.dash-mini-deck__stat-container` com `.dash-mini-deck__stat-widget` dedicados para Volume (com ícone customizado de Elixir drop rosa/roxo e valor em destaque), Maestria (ícone de estrela dourada com contador de emblemas) e Cardio configurado (ícone de onda de pulso ECG e subtítulo funcional dinâmico) exatamente correspondendo ao design de referência do usuário.

### [Changed]
- **`componentes/secoes/modais.html`:** Refatorado o cabeçalho e rodapé do modal `modalSeletorFichas` para incluir os botões de hambúrguer de menu, swap de cartas, seletores de grade/lista e os novos widgets horizontais de estatísticas com seus rótulos posicionados abaixo de cada caixa.
- **`JS/treino/secao-dashboard.js`:** Atualizada a lógica de renderização dos tabs para injetar os escudos vetoriais nas letras ativas de forma dinâmica e ajustada a atualização das estatísticas para preencher as sub-legendas dinâmicas do widget de cardio.

## [v2.9.2] - 2026-05-26
*Mini-Deck Builder Interativo de Fichas no Dashboard*
*Reposicionamento dos Elementos Inferiores do Dashboard*

### [Changed]
- **`style/treino/secoes/dashboard.css`:** Alterada a posição do Suggested Workout Card (itens "Treino", "Próximo Passo" e "Ciclo") para fluir de forma relativa na flexbox do container do dashboard, posicionando-os naturalmente logo abaixo do card da Arena em vez de absolutamente fixados na base. Ajustados os paddings do contêiner principal para otimizar o encaixe vertical e aumentado o espaçamento entre a seção sugerida e a imagem da arena (90px no padrão e 54px no mobile).

## [v2.9.0] - 2026-05-23
*Redesign Visual Completo da Seção Início (Dashboard) Estilo Clash Royale*

### [Changed]
- **`componentes/secoes/dashboard.html`:** Refatorado por completo para adotar o design do Clash Royale da imagem de referência. Implementada estrutura do profile card com avatar circular, liga e troféus em linha, botões de ação e central de emblemas em grade (0/30 Emblemas com ícone de baú e troféu de ouro inline), indicador de arena central com efeitos de brilho/partículas para a Forja, barra de progresso horizontal redesenhada com pedestal para o Troféu de Cristal iluminado e marcações de progresso, botão selector flutuante da Coroa de Elixir, e o novo Suggested Workout Card unificado no rodapé.
- **`style/treino/secoes/dashboard.css`:** Totalmente reescrito seguindo o padrão BEM e implementando as diretrizes de design de alto padrão (neon styling). Adicionados glows neon azul e rosa na barra de progresso e no pedestal do troféu, efeitos de brilho metálico escovado/pedra no botão "Próximo Passo", card de exercício em grade com visual clássico Clash Royale (borda roxa, rodapé colorido, nível badge com formato hexagonal e clip-path), e responsividade pixel-perfect com media queries para 480px.
- **`JS/treino/secao-dashboard.js`:** Atualizada a lógica de renderização para sincronizar os novos elementos. O card de treino sugerido agora é totalmente dinâmico, exibindo o nome exato e a maestria real (nível da carta) do primeiro exercício do treino sugerido. Adicionado ouvinte de clique para o botão flutuante da Coroa para abrir o bottom-sheet seletor de fichas com a mesma fluidez.
- **`Diretrizes/system_map.json`:** Atualizado para a versão `2.3.0` registrando o andamento da arquitetura do Dashboard.

## [v2.8.0] - 2026-05-21
*Modularização de CSS Monolítico em Componentes e Variantes Estilísticas*

### [Added]
- **Modularização de CSS:** Criada a pasta `style/treino/secoes/` contendo arquivos CSS focados e de fácil manutenção por IA:
  - `secoes/bg-dinamico.css`: Lógica de background animado e colorizações temáticas por seção.
  - `secoes/toolbar-busca.css`: Toolbar com controles, buscador expansível e dropdown de filtros.
  - `secoes/deck-builder.css`: Layout do Deck Builder, slots de cartas e rodapé com estatísticas.
  - `secoes/cards.css`: Estilização dos cards de exercícios, animações de hover/menu de ações e layouts de grade (Royale/Lista).
  - `secoes/maestria.css`: Visualização de conquistas de maestria e modais de desafio.
  - `secoes/modais.css`: Estilo estelar premium para o modal de detalhes do exercício.
  - `secoes/tabs-subnav.css`: Abas de navegação secundária e dot controllers.
  - `secoes/perfil.css`: Elementos da seção Perfil, switches iOS e painéis de assinatura/segurança.
  - `secoes/placeholders-animacoes.css`: Animações de pulso/shimmer e placeholders elegantes para os slots.

### [Changed]
- **`style/treino/5-premium-design.css`:** Transformado em um indexador enxuto que importa todas as novas folhas de estilo específicas de seção via `@import`, preservando integridade de imports externos.
- **`sw.js`:** Incrementado cache para `v35` e adicionados todos os novos caminhos modulares de CSS à lista `ASSETS_TO_CACHE` para garantir o funcionamento offline do PWA.
- **`Diretrizes/system_map.json`:** Atualizado para `v2.1.0` refletindo a arquitetura de fragmentação HTML & CSS e detalhando o propósito de cada arquivo modular.

## [v2.7.0] - 2026-05-21
*Modularização IA-Friendly do Monólito HTML e Injeção Assíncrona*

### [Added]
- **`JS/treino/loader.js`:** Novo módulo utilitário para carregar de forma paralela (`Promise.all` + `fetch`) múltiplos fragmentos HTML injetando-os dinamicamente em placeholders do DOM (`[data-section]`).
- **Arquitetura Modular HTML:** Criada a pasta `componentes/secoes/` abrigando os fragmentos isolados: `ficha.html`, `treinos.html`, `progresso.html`, `perfil.html` e `modais.html`. Isso reduziu drasticamente o consumo de tokens em requisições à IA, viabilizando análises de código e edições contextuais muito mais rápidas e precisas.

### [Changed]
- **`treino.html`:** Refatorado de um arquivo monolítico de ~2.200 linhas para uma "shell" enxuta de ~200 linhas. Agora abriga apenas metadados `<head>`, navegação base (top/bottom navs) e a infraestrutura nativa do "Swipe Viewport", deixando o conteúdo massivo para injeção via `loader.js`.
- **`JS/treino/app.js`:** Adicionada chamada `await loadAllSections()` prioritária (Top-Level) imediatamente dentro do hook de boot `DOMContentLoaded`. Isso garante a reconstrução integral do DOM **antes** de qualquer inicialização ou escuta de eventos, mantendo estabilidade arquitetural de Single Page Application (SPA).
- **`sw.js`:** Atualizada a versão do Service Worker (`CACHE_NAME` para `'academia-treino-v34'`). Modificada a lógica de instalação para incluir `self.skipWaiting()` e a lógica de ativação para `clients.claim()`. Isso previne a tela em branco/estado travado (caching conflict) e força clientes PWA a validarem de imediato as atualizações modulares da interface. Além disso, a estratégia de `Network First` agora também se aplica de modo dinâmico aos `.html` de fragmentos para contornar cache stales.
- **`Diretrizes/system_map.json`:** Atualizado para `v2.0.0`, registrando formalmente a nova lógica modular (`section_loader`), alterando o indexador `treino.html` e documentando explicitamente o manifesto estrutural das `html_fragments`.

## [v2.6.5] - 2026-05-21
*Ajustes de Integração Visual e Correção de Transbordamento (Overflow) nas Abas de Treino e Perfil*

### [Fixed]
- **`style/treino/5-premium-design.css`:** 
  - Corrigido o alinhamento visual e a integração das sub-abas na aba **Exercícios** (seção Treino), fazendo com que `#tab-exercicios` utilize o contêiner de design orgânico (`.perf-tab-content-wrapper`), unificando o fundo (`#150b24`) e eliminando linhas divisórias e lacunas flutuantes.
  - Corrigido o transbordamento (overflow) das seções temáticas (`.theme-section`) nas sub-abas de **Perfil**. Ajustadas as margens laterais (`margin: 0 -10px`) para se integrarem perfeitamente às bordas internas do wrapper de conteúdo e adicionadas regras condicionais de margem para o topo (`margin-top: -20px` e `-15px`) e rodapé (`margin-bottom: -20px`), eliminando qualquer vazamento e respeitando as bordas curvas originais do contêiner.
  - Adicionado `overflow: hidden;` a `.perf-tab-content-wrapper` e `#tab-exercicios` para garantir o recorte (clip) limpo do conteúdo interno nos cantos arredondados inferiores de `24px`.
  - **`treino.html` & `style/treino/5-premium-design.css`:** Refatorados os botões de ação do Perfil ("Adicionar Amigos" e "Ver Coleção") para o padrão metodológico **BEM** (`.profile-actions`, `.profile-action-btn`), eliminando os estilos inline redundantes. Foi implementada uma estilização premium para o botão "Ver Coleção" com gradiente dourado, sombra suave e micro-animação dinâmica em estado hover.

## [v2.6.4] - 2026-05-20
*Sistema de Transições de Cima para Baixo com Stagger Premium*

### [Added]
- **`style/treino/5-premium-design.css`:** Adicionados `@keyframes uiFadeOut`, classe `.ui-fade-out` e a classe `.stagger-item` com delay dinâmico para entradas escalonadas (stagger) de cards e linhas.
- **`JS/treino/db.js`:** Implementada e exportada a função `fadeSwap(element, updateCallback)` que coordena as transições de saída (fade-out) e entrada (fade-in) de novos conteúdos de forma assíncrona com atraso de 120ms.

### [Changed]
- **`style/treino/5-premium-design.css`:** Ajustado o `@keyframes uiFadeIn` para realizar um deslocamento de cima para baixo suave (`translateY(-8px)` para `translateY(0)`).
- **`JS/treino/db.js`:** Atualizada a função `fadeIn` para reiniciar automaticamente as animações de todos os elementos filhos com a classe `.stagger-item`.
- **`JS/treino/templates.js`:** Atualizadas as assinaturas e retornos dos templates `fichaDeckCard`, `fichaGridCard`, `fichaTableRow` e `cardioDeckCard` para suportar a classe `.stagger-item` e receber a propriedade CSS `--item-index` dinâmica.
- **`JS/treino/secao-ficha.js` & `JS/treino/app.js`:** Integrado o utilitário `fadeSwap` na troca de modos de visualização da ficha e na troca de treinos (letras A/B/C...), garantindo uma transição fluida sem jumps ou flashes de tela. Injetados delays stagger nas inserções manuais de cardio.
- **`JS/treino/nav.js` & `JS/treino/secao-perfil.js`:** Integrado `fadeSwap` em todas as transições de abas, sub-abas de Treino e abas/sub-abas de Perfil, promovendo um fluxo de navegação extremamente polido de alto padrão.

---

## [v2.6.3] - 2026-05-20
*Sistema de Transições Suaves com Fade-In*

### [Added]
- **`style/treino/5-premium-design.css`:** Adicionada animação `@keyframes uiFadeIn` e a classe `.ui-fade-in` para criar transição suave com leve deslocamento vertical (translateY(8px)).
- **`JS/treino/db.js`:** Adicionada e exportada a função `fadeIn(...elements)` que gerencia e reinicia as transições aplicando a classe `.ui-fade-in` de forma dinâmica com reflow forçado.

### [Changed]
- **`JS/treino/secao-ficha.js`:** Implementadas transições de fade-in na Ficha ao alternar entre os modos de exibição (Tabela, Grid, Coleção) e ao trocar os treinos do dia (A, B, C, etc.).
- **`JS/treino/secao-treinos.js`:** Adicionado fade-in nas listagens de exercícios, nos slots do deck de montagem de ficha e na biblioteca de exercícios.
- **`JS/treino/secao-perfil.js`:** Aplicado fade-in suave na navegação de abas principais e sub-abas de Progressão e Preferências do Perfil.
- **`JS/treino/nav.js`:** Integrada a animação de fade-in nas trocas de abas da seção Treinos (Exercícios / Montar Ficha) e sub-navbars estilo Clash Royale.

---

## [v2.6.1] - 2026-05-20
*Ajuste da Margem de Segurança Inferior e Estilização do Card de Cardio*

### [Changed]
- **`style/treino/7-nav-icons.css`:** Dobrada a margem de segurança inferior (`padding-bottom`) do contêiner principal (`.section-slide .treino-container`) de `130px` para `260px` para garantir que o conteúdo não seja ocultado pela barra de navegação inferior.
- **`style/treino/5-premium-design.css`:** Ajustado o card de cardio (`.deck-card-aerobico` e `.ex-card-aerobico`) para ocupar toda a largura da linha (`grid-column: 1 / -1`) nos modos de exibição em grid e coleção.
- **`JS/treino/templates.js` & `JS/treino/secao-ficha.js`:** Removido o botão de configurações (editar) do card de cardio na seção da ficha do dia e ajustado o alinhamento da área de checkbox. O ícone flutuante superior esquerdo circular também foi removido, e o emoji de corrida antigo foi substituído por um ícone SVG premium e minimalista.

---

## [v2.6.2] - 2026-05-20
*Correção do Bug de Salvamento do Cardio*

### [Fixed]
- **`JS/treino/secao-ficha.js`:** Corrigido bug intermitente onde o cardio não era salvo corretamente ao marcar como concluído. Dois problemas identificados:
  1. O selector `.t-tab.active .check-input` capturava checkboxes de múltiplas abas ativas (Treinos, Progresso, Perfil), causando conflitos de estado. Corrigido para escopo restrito ao `#tab-ficha`.
  2. `newChecks` era uma referência viva ao array do DB, podendo ser mutada pelo `renderFicha()` antes da verificação de `allDone`. Corrigido com snapshot imutável via `[...(getChecks(db))]`.

---

## [v2.6.0] - 2026-05-20
*Implementação do Sistema de Abas na Seção Perfil*

### [Added]
- **`treino.html`:** Reestruturada a seção Perfil (`#section-perfil`) com um sistema completo de 4 abas principais (Perfil, Progressão, Configurações, Preferências), seguindo o mesmo padrão visual de abas utilizado nas seções "Treinos" e "Montar Ficha".
- **`treino.html`:** Adicionadas sub-abas na aba de Progressão (Visão Geral, Nível e XP, Conquistas) usando componentes da interface (`.sub-navbar`, `.sub-nav-btn`).
- **`treino.html`:** Adicionadas sub-abas na aba de Preferências (Geral, Assinatura, Segurança) contendo toggles de configurações estilo iOS (`.pref-switch`), vitrine de planos de assinatura (`.subscription-plans`), e formulário de dados de segurança (`.security-form`).
- **`style/treino/5-premium-design.css`:** Implementadas todas as novas diretrizes CSS usando metodologia BEM para as abas de perfil, toggles `.pref-switch` (com micro-animações estilo iOS e sombra dinâmicas), campos de segurança `.sec-input`, botões com gradientes, e a estrutura visual dos cartões de assinatura (`.plan-card`).
- **`JS/treino/secao-perfil.js`:** Adicionado o método `initPerfilTabs()` responsável por escutar e realizar a navegação DOM fluida entre abas principais e sub-abas.
- **`JS/treino/secao-perfil.js`:** Implementada funcionalidade de leitura e salvamento atômico das preferências do perfil (nome, handle, e-mail, senha) diretamente para `db.profileCustomization` e persistência dos toggles de configuração global no `localStorage`.

### [Changed]
- **`JS/treino/app.js`:** Importado e executado `initPerfilTabs()` na rotina de boot (DOMContentLoaded) inicializando a seção Perfil.

---


## [v2.5.3] - 2026-05-19
*Alinhamento de Grid Fixo 2x4 na Ficha do Dia*

### [Changed]
- **`treino.html`:** Alterada a classe do contêiner `#workoutGrid` de `exercicios-grid` para `workout-deck-grid`. Com isso, a visualização em Grade da Ficha do Dia passa a exibir um grid fixo simétrico de 4 colunas no desktop (gerando exatamente 2 linhas para 8 exercícios) e 2 colunas no mobile, alinhado ao layout do Deck Builder da aba Montar Ficha.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v30'` para invalidar caches antigos.

---

## [v2.5.2] - 2026-05-19
*Alinhamento em Linha do Botão de Concluir nos Modos Grid e Deck da Ficha*

### [Changed]
- **`JS/treino/templates.js`:** Reestruturado o HTML das funções `fichaDeckCard` e `fichaGridCard`. O checkbox de concluir exercício (`.deck-check-wrap` e `.check-wrap`) foi movido para dentro da mesma linha (`.series-wrap-deck` e `.series-wrap-grid`) que os botões de séries/repetições e o ícone de nota.
- **`JS/treino/templates.js`:** Adicionado estilo flexbox dinâmico (`display: flex; align-items: center; width: 100%;`) nos wrappers de séries e `margin-left: auto` nos checkboxes, empurrando o botão de conclusão com precisão para a extremidade direita na mesma linha.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v29'` para forçar a invalidação imediata do cache nos clientes PWA.

---

## [v2.5.1] - 2026-05-19
*Ajuste Fino na Transição do Hero (Remoção da Sombra)*

### [Changed]
- **`style/treino/5-premium-design.css`:** Removido o pseudo-elemento `::after` do `.treino-hero` e a margem negativa superior (`margin-top: -30px`) de `.treino-container`. Isso elimina completamente a mancha ou "sombra" escura e espessa na zona de transição, mantendo a fusão de degradê do hero com os losangos do fundo de forma cristalina, limpa e uniforme.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v28'` para forçar a invalidação imediata do cache nos clientes PWA.

---

## [v2.5.0] - 2026-05-19
*Suavização e Transição Ultra-Premium do Hero Section*

### [Changed]
- **`style/treino/5-premium-design.css`:** Substituído o background sólido e opaco de `.treino-hero` por um degradê vertical sofisticado combinando um radial roxo topo e linear preto chumbo escuro que desvanece de `98%` no topo a `0%` (totalmente transparente) na base. Isso permite que a textura e os losangos geométricos de background do Clash Royale fluam suavemente sob toda a página sem cortes visuais nítidos.
- **`style/treino/5-premium-design.css`:** Adicionado pseudo-elemento `::after` a `.treino-hero` com um degradê reverso de fusão e desfoque (`filter: blur(10px)`) para desfocar e suavizar qualquer linha horizontal divisória.
- **`style/treino/5-premium-design.css`:** Elevado ligeiramente o contêiner de conteúdo (`.treino-container` na seção da ficha) através de `margin-top: -30px !important;` e `z-index: 3`, fazendo a barra de controle (`.ficha-header-bar`) flutuar com visual integrado sobre o fade de transição.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v27'` para propagar e forçar a expiração imediata do cache nos clientes PWA.

---

## [v2.4.9] - 2026-05-19
*Correção da Visibilidade de Decks Vazios na Seção Ficha*

### [Fixed]
- **`JS/treino/nav.js`:** Ajustada a função `updateEmptyWorkoutButtons` para utilizar `.filter(Boolean).length > 0` ao validar a presença de exercícios no deck. Isso resolve o bug em que o botão da aba da ficha continuava visível mesmo sem exercícios, devido ao array de IDs manter o tamanho (length) com elementos `null` após a remoção.
- **`JS/treino/db.js` & `JS/treino.js`:** Corrigida a função `determineTreinoDoDia` em ambos os arquivos (modular e legado) para ignorar fichas que contenham apenas elementos nulos ao estimar a próxima ficha ativa do ciclo.
- **`JS/treino/secao-progresso.js` & `JS/treino.js`:** Ajustado o filtro do breakdown de ciclos para ocultar de forma precisa as fichas que não possuem nenhum exercício ativo cadastrado.

### [Changed]
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v26'` para forçar a expiração imediata do cache nos clientes PWA e carregar as novas lógicas dinâmicas de renderização.

---

## [v2.4.8] - 2026-05-19
*Placeholders de Imagem Premium para Exercícios e Tratamento de Falhas Dinâmicas*

### [Added]
- **`style/treino/5-premium-design.css`:** Implementada a classe `.premium-placeholder` juntamente com animações avançadas (`@keyframes exPulse`, `@keyframes exShimmer`, `@keyframes exFloat`). O design possui fundos gradientes premium, efeito de brilho metálico reflexivo, sombras pulsantes tridimensionais e ícones tridimensionais de halteres flutuantes.
- **`JS/treino/secao-ficha.js` & `JS/treino/secao-treinos.js` & `JS/treino/templates.js`:** Adicionada renderização do placeholder para exercícios sem imagem definida (`!ex.imagem`) e integração do manipulador dinâmico de erro `onerror` nas tags de imagem.
- **`JS/treino.js` (JavaScript Legado):** Sincronizados todos os templates equivalentes de exercícios em todas as views legadas (Ficha Deck, Ficha Grid, Exercícios Grid, Coleção e Slots Ativos do Deck) com suporte a tratamento de erro em tempo de execução (`onerror`) substituindo a tag `<img>` pelo placeholder premium usando escape resiliente de aspas duplas (`&quot;`).

### [Changed]
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v25'` para propagar e forçar o recarregamento imediato das novas regras visuais e tratamento resiliente nos clientes PWA.

---

## [v2.4.7] - 2026-05-19
*Filtros Quadrados e Estilo de Lista Contínua Premium no Dropdown*

### [Changed]
- **`style/treino/5-premium-design.css`:** Modificado o estilo dos itens de filtro (`.cr-dropdown-item`) para neutralizar completamente as propriedades de pílulas arredondadas (`.g-chip`) herdadas do core. Os itens agora são totalmente retos (`border-radius: 0 !important;` e `margin: 0 !important;`), formando uma lista de menu vertical elegante e contínua com divisores finos.
- **`style/treino/5-premium-design.css`:** Adicionado um destaque ativo ultra-premium para o item selecionado (`.cr-dropdown-item.active`), contendo uma borda roxa brilhante à esquerda (`border-left: 3px solid var(--primary-light) !important;`), fundo sutilmente destacado e micro-animações ajustadas para o hover.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v24'` para propagar a nova interface reta/quadrada imediatamente aos clientes.

---

## [v2.4.6] - 2026-05-19
*Ajuste Fino de Recuo Adicional e Legibilidade no Input da Busca Expansível*

### [Fixed]
- **`style/treino/5-premium-design.css`:** Aumentado o `padding-left` de `30px` para `38px` no input `.ex-search-box.collapsible .ex-search-input`. Isso desloca o texto de forma ideal para a direita, evitando completamente qualquer sobreposição ou colisão de caracteres com o ícone de lupa absoluto à esquerda (por exemplo, quando o "s" de "supino" ficava oculto sob a lupa e parecia "Qupino").
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v23'` para invalidar cache anterior e propagar o ajuste fino imediatamente aos clientes.

---

## [v2.4.5] - 2026-05-19
*Ajuste Fino de Recuo e Legibilidade no Input da Busca Expansível*

### [Fixed]
- **`style/treino/5-premium-design.css`:** Ajustado o `padding-left` de `10px` para `30px` no input `.ex-search-box.collapsible .ex-search-input`. Isso desloca o início do texto digitado para a direita de forma elegante, evitando a colisão visual e sobreposição de caracteres com o ícone de lupa posicionado de forma absoluta à esquerda.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v22'` para forçar o recarregamento instantâneo do ajuste fino de espaçamento no cliente.

---

## [v2.4.4] - 2026-05-19
*Correção Crítica no Estiramento Flexbox e Eventos de Clique da Busca Expansível*

### [Fixed]
- **`style/treino/5-premium-design.css`:** Neutralizados os overrides herdados do core (`flex: 1` e `min-width: 200px` em `1-core.css`) adicionando `flex: none !important` e `min-width: 0 !important` na classe `.ex-search-box.collapsible` (colapsada e expandida). Isso garante que ela comece perfeitamente minimizada a `40px` de largura conforme pretendido, resolvendo o bug visual de estiramento gigante.
- **`style/treino/5-premium-design.css`:** Sobrescrito o seletor do core do ícone de pesquisa (`.ex-search-icon`) que bloqueava cliques por ter `pointer-events: none` por padrão. Adicionado `pointer-events: auto !important` e `cursor: pointer` na classe específica `.ex-search-box.collapsible .ex-search-icon` para habilitar fisicamente o registro de cliques no JS.
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v21'` para propagar e forçar a atualização imediata das correções de folhas de estilo em todos os dispositivos clientes.

---

## [v2.4.3] - 2026-05-19
*Ativação Exclusiva da Busca Expansível via Ícone de Pesquisa*

### [Changed]
- **`JS/treino/app.js`:** Reestruturado o controle da busca expansível (`exSearchContainer` / `searchInput`). A expansão e o colapso agora são disparados unicamente pelo clique no ícone de pesquisa (`.ex-search-icon`).
- **`JS/treino/app.js`:** Adicionado mecanismo com flag `iconClickActive` no `mousedown`/`click` do ícone de pesquisa, solucionando conflitos indesejados do evento de desfocagem (`blur`) do input (que causava o fechamento/reabertura cíclico quando o campo estava vazio).
- **`sw.js`:** Incrementada a versão do cache do Service Worker (`CACHE_NAME`) para `'academia-treino-v20'` para garantir o carregamento instantâneo da nova lógica da busca pelos clientes do PWA.

---

<!-- Entradas anteriores a v3.0.0 foram arquivadas para manter o arquivo abaixo de 500 KB (regra doc-lint). Histórico completo disponível no Git. -->
