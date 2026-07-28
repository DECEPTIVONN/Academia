# 🏋️ Academia Workout Tracker (PWA)

Um aplicativo web em **Vanilla JS** projetado com arquitetura **Mobile-First** e foco extremo em **Gamificação** e **Design de Alta Fidelidade (UI/UX)**, inspirado nas mecânicas de retenção de jogos mobile (especialmente *Clash Royale*).

O objetivo deste projeto é fornecer uma ferramenta de rastreamento de treinos profissional, offline-first e visualmente engajante, eliminando a barreira da monotonia no ambiente de academia.

---

## 🏗️ Arquitetura do Sistema

O projeto foi construído para ser incrivelmente rápido e rodar inteiramente no lado do cliente (Client-Side), utilizando `localStorage` como banco de dados e Service Workers para suporte offline. 

Recentemente refatorado para suportar escalabilidade, a base de código modular dispensa bundlers (como Webpack) para manter o carregamento nativo veloz:

### 🗄️ JavaScript Modular (`JS/treino/`)
- `app.js`: Script de inicialização (Entry point).
- `db.js`: Gerenciamento central do estado da aplicação, schemas padrão e I/O de LocalStorage.
- `nav.js`: Motor gráfico de transição contínua (Swipe) e controle do Bottom Navigation Bar.
- `secao-ficha.js`: Lógica de tracking diário, timers globais e "Modo Foco".
- `secao-treinos.js`: Lógica do *Deck Builder* (Criação de fichas), seleção de exercícios e pesquisa.
- `secao-progresso.js`: Algoritmos de cálculo de 1RM, renderização de Radar Charts e o Tracker do Ciclo de 30 Dias.
- `secao-perfil.js`: Sistema de configurações, temas, backup/importação e cartões de compartilhamento.

### 🎨 CSS Cascata Modular (`Style/treino/`)
Agrupados e carregados via `@import` no `treino.css` raiz, preservando a especificidade da cascata:
1. `1-core.css`: Variáveis, tipografia, reset e layouts base.
2. `2-modals.css`: Interface de modais (Fim de treino, ajudas).
3. `3-foco-badges.css`: Modo Foco, contadores, tags e emblemas musculares.
4. `4-gamificacao.css`: Painéis de progresso, Weekly Planner e UI de atributos.
5. `5-premium-design.css`: Cards de exercícios, efeitos *Cyber-Glass* e menus interativos.
6. `6-maestria.css`: UI/UX focada no painel de maestria e progressão de tiers.
7. `7-nav-icons.css`: Ocultação e renderização fluida das rotas laterais e botões nativos.
8. `8-customizacao.css`: UI da vitrine de skins de timer, títulos CoD e molduras de avatar.

---

## ✨ Features e Funcionalidades

### 1. Motor de Gamificação Completo
- **Maestria de Exercícios (Tiers):** Inspirado no Clash Royale. Ao completar exercícios, o usuário ganha *XP* específico para aquele movimento, evoluindo de Bronze > Prata > Ouro > Elite.
- **Conquistas e Emblemas:** Insígnias desbloqueadas automaticamente através do Radar Chart (ex: *Monstro de Força*, *Mestre do Cardio*).
- **Ciclo de Treino de 30 Dias:** Uma barra de progressão que recompensa a consistência do usuário, reiniciando dinamicamente ao completar 30 treinos e adaptando sugestões.

### 2. Deck Builder (Criação de Fichas)
- Interface arrastar-e-soltar / clicar-e-adicionar semelhante a montar um "Deck de Cartas".
- Filtragem avançada por agrupamento muscular.
- Acesso rápido aos detalhes do exercício, gifs locais, notas técnicas e calculadora de repetições.

### 3. Workout Tracking Diário
- **Ficha do Dia Inteligente:** O algoritmo analisa o histórico passado e sugere automaticamente a próxima letra da ficha (A, B, C...).
- **Modo Foco:** Uma UI livre de distrações, com temporizadores automáticos de descanso que avançam as séries sequencialmente sem o usuário tocar na tela.
- **Gráficos e Analíticos:** Acompanhamento de Volume Carga, Calculadora de 1RM baseada na fórmula de Brzycki e um Gráfico Radar de Atributos (Força, Resistência, Equilíbrio, Cardio, Core).

### 4. PWA Offline e Social
- **Service Worker Interceptativo:** O aplicativo continua 100% responsivo mesmo em "Modo Avião", retornando resíduos nativos.
- **Share Card Gerado via Canvas:** Exporta uma imagem estilizada resumindo o treino finalizado, PRs alcançados e estatísticas de XP prontas para o Instagram Stories.

### 5. Central de Notícias, Atualizações e Guias
- **Navegação Modular por Abas:** Contém abas dedicadas a Notícias, Notas de Atualização de Versões e Guias técnicos com chaveamento instantâneo.
- **Detalhamento por Deslize Lateral (Slide-in):** As notícias individuais e notas de atualização abrem em painéis imersivos que deslizam da direita para a esquerda. Conta com controle rigoroso de visibilidade (`visibility`) e aceleração por hardware para evitar vazamento visual de cabeçalhos fixados (`position: fixed`) no resto do app.
- **Paginação Fluida:** Navegação interna que permite ao usuário folhear os artigos sequencialmente (Mais Antigos / Mais Recentes) com transições suaves e recarregamento dinâmico do conteúdo em tela cheia.

---

## 📱 UI / UX Design Guidelines

O projeto mantém diretrizes rígidas de UI/UX para não parecer uma "página da web", mas sim um aplicativo AAA de Loja de Aplicativos.

- **Navegação de Câmera Deslizante (Viewport + Strip):** O aplicativo abandonou a lógica de ocultar telas com `display: none`. Agora, usa-se um modelo físico: a tela é a lente (`.section-viewport`), e todo o conteúdo é uma fita contínua (`.section-strip`). Ao tocar no Bottom Nav, o `translateX` da fita inteira desliza suavemente (`transitionTo()`), eliminando artefatos de renderização e permitindo gestos horizontais de swipe naturais (como o WhatsApp e Clash Royale).
- **Gestão de Scroll Independente:** O scroll principal da página HTML/Body é bloqueado (`overflow: hidden`). Cada `.section-slide` tem sua própria barra de rolagem (`overflow-y: auto; overscroll-behavior-y: contain`). Isso garante transições laterais sedosas independente de o usuário estar rolando o conteúdo para cima ou para baixo.
- **Backgrounds Multi-Temáticos (Estilo Clash Royale):** Para quebrar a monotonia de um fundo monolítico, longas áreas de rolagem devem usar a arquitetura de blocos divididos. 
  - Utilize a estrutura HTML: `<div class="theme-section theme-NOME"><div class="theme-bg"></div><div class="theme-content">...</div></div>`.
  - Essa técnica utiliza CSS Puro (`filter: hue-rotate()`) aplicado na mesma imagem estática base (`BG-roxo-vertical.jpg`) para re-colorir dinamicamente a área (ex: `.theme-turquesa`, `.theme-ouro`) sem exigir o carregamento de novos e pesados assets. O conteúdo sempre fica em `.theme-content` para não sofrer distorção de cores.
- **Padrão Sub-abas "Pílula Flutuante" (Floating Pill):** Quando uma seção for dividida em abas (ex: "Exercícios / Montar Ficha" na seção Treinos), as sub-abas utilizam a marcação `.treino-tabs-section.section-subtabs`. O layout padrão é uma pílula estática (`position: relative`) centralizada no topo da área útil (`margin: 20px 0 24px 0`). **NÃO use `position: sticky` ou fundos estendidos de 100vw**; a barra deve apenas rolar e sumir naturalmente quando o usuário descer pela tela, mantendo a tela desobstruída e limpa para as listas de exercícios.
- **Glassmorphism e Neumorfismo:** O uso pesado de fundos com `backdrop-filter: blur()`, overlays semi-transparentes (`rgba(255,255,255, 0.05)`) e dropshadows elétricos coloridos confere um look *Cyber-Glass*. Garantir que o `--card-bg` base possua opacidade suficiente (ex: `rgba(10,5,20,0.6)`) para não gerar conflito de leitura com a textura animada do fundo.
- **Iconografia Consistente:** Absolutamente **NENHUM EMOJI** deve ser usado para funções de UI, apenas para gamificação estrita (textos motivacionais). Todos os ícones de ação são `SVGs inline stroke`, que herdam a cor nativa através da tag CSS `stroke: currentColor`. Consulte o arquivo `Ícones.md` para novos ícones.
- **Padrão de Dropdowns (Selects):** Todos os dropdowns (`<select>`) devem seguir o estilo escuro premium: fundo escuro (`#111` ou similar), letras brancas (`#ffffff`), `appearance: none` para remover o estilo nativo do navegador, e uma seta customizada em SVG como imagem de fundo. Isso garante consistência visual e evita que o navegador renderize fundos brancos padrão.
- **Feedback Haptico e Visual:** Botões escalam (`scale(0.95)`) ao serem pressionados.
- **Padrão de Nomenclatura BEM (Daqui para frente):** Para novos componentes e seções, utilize estritamente o padrão **BEM (Block__Element--Modifier)**. Ex: `.loja-card`, `.loja-card__price`, `.loja-card--premium`. Não reescreva o CSS legado, apenas aplique o BEM em adições futuras.

---

## 🤖 Guia para Agentes de IA

Se você é um assistente de inteligência artificial manipulando esta base de código:
1. **Leia o `system_map.json` primeiro:** É o índice arquitetural leve do projeto. Uma única leitura revela qual arquivo abrir para qualquer tarefa — sem varreduras cegas de diretório.
2. **Leia o `CHANGELOG.md`:** Você tem a obrigação arquitetural de gravar e versionar qual alteração fez lá, sob os padrões descritos.
3. **Leia o `Ícones.md`:** Para gerar ou editar qualquer elemento visual sem quebrar o ecossistema SVGs.
4. Não crie códigos monolíticos. Tudo deve ser feito sob a filosofia modular instalada na pasta `treino/`.
5. **Padrão CSS BEM:** Para qualquer novo estilo ou componente, é **obrigatório** o uso da metodologia BEM para evitar poluição da cascata global.

---

## 🗺️ Manutenção do Índice Arquitetural (`system_map.json`)

O arquivo `Diretrizes/system_map.json` é o **mapa vivo** do projeto. Ele deve ser atualizado sempre que a estrutura de arquivos mudar. Abaixo, os gatilhos e procedimentos:

### ⚡ Quando atualizar

| Situação | O que fazer no `system_map.json` |
| :--- | :--- |
| **Novo arquivo JS** em `JS/treino/` | Adicionar entrada em `system_modules` ou criar um novo módulo |
| **Novo arquivo CSS** em `style/treino/` | Adicionar objeto `{ file, purpose }` em `styling_manifest.modules` |
| **Novo componente** em `componentes/` | Adicionar objeto `{ file, purpose }` em `components.modules` |
| **Novo asset** (GIF, fonte, imagem) | Atualizar a descrição do diretório correspondente em `assets.directories` |
| **Novo documento** em `Diretrizes/` ou `Planos/` | Adicionar entrada em `documentation.files` ou `plans.files` |
| **Arquivo renomeado ou removido** | Localizar e renomear/remover a entrada correspondente |
| **Nova funcionalidade** que cruza múltiplos arquivos | Adicionar uma nova chave em `ia_quick_reference` com o atalho de edição |

### 📝 Procedimento padrão

```
1. Edite a seção relevante do system_map.json
2. Incremente o campo "version" (ex: "1.8.0" → "1.9.0")
3. Atualize "last_updated" para a data de hoje (formato YYYY-MM-DD)
4. Registre a atualização no CHANGELOG.md
```

> **Regra de ouro:** O `system_map.json` deve sempre refletir 100% da estrutura real de arquivos do projeto. Um índice desatualizado é pior do que não ter índice.
