# Academia — Documentação do Projeto

## Visão Geral
Site pessoal de gerenciamento de treinos de academia. Permite cadastrar exercícios com imagens dos aparelhos, montar fichas de treino (Treino A e B), acompanhar o treino do dia com checkboxes e receber confirmação ao concluir todos os exercícios.

---

## Stack Tecnológica
- **HTML5** — Estrutura semântica
- **CSS3 Vanilla** — Estilo (sem frameworks), variáveis CSS em `style/main.css`
- **JavaScript Vanilla** — Lógica, sem frameworks
- **localStorage** — Persistência de dados (sem backend)
- **Fonte**: Rajdhani (Google Fonts) — pesos 300, 400, 500, 600, 700, 900

---

## Estrutura de Diretórios
```
Academia/
├── treino.html              ← Página de fichas de treino
├── franquiaexemplo.html     ← Página de exemplo de franquia (projeto base)
├── Claude.md                ← Este arquivo
├── Assets/
│   ├── FONTS/
│   ├── Images/
│   │   └── LogoItens/D.jpg  ← Favicon
│   └── Videos/
├── JS/
│   ├── treino.js            ← Lógica do módulo de treino
│   └── [outros módulos...]
├── style/
│   ├── main.css             ← Variáveis globais, reset, base
│   ├── treino.css           ← Estilos do módulo de treino
│   └── [outros estilos...]
└── componentes/
    ├── navbar.js            ← Navbar injetada via JS
    ├── footer.js            ← Footer injetado via JS
    ├── thememanager.js      ← Gerenciador de temas
    ├── theme-integration.js ← Integração do tema
    ├── scroll-animations.js ← Animações de scroll
    └── fade-in-integration.js
```

---

## Design System (main.css)
```css
--primary: #8b5cf6          /* Roxo principal */
--primary-light: #c084fc
--primary-dark: #6d28d9
--accent: #f5a6d3           /* Rosa acento */
--background: #000000
--background-alt: #0a0a0a
--text: #ffffff
--text-secondary: #cccccc
--border: rgba(139,92,246,0.3)
--font-family: 'Rajdhani', sans-serif
```

**Padrões de design:**
- Tema escuro com fundo quase preto
- Roxo como cor primária (glassmorphism, bordas, destaques)
- Cards com `backdrop-filter: blur` e bordas sutis
- Hover com `translateY(-3px)` e glow roxo
- Animações suaves (0.3s ease-out)

---

## Módulo de Treino (`treino.html` + `JS/treino.js`)

### Funcionalidades
1. **Ficha do Dia** — Exibe treino A ou B do dia em tabela profissional
2. **Biblioteca de Exercícios** — Grid com cards, busca e filtros por grupo muscular
3. **Montar Ficha** — Interface para adicionar/remover exercícios dos treinos A e B
4. **Check de Exercícios** — Marcar exercício como feito; ao completar tudo → modal de celebração
5. **Upload de Imagem** — Foto do aparelho convertida para base64 no localStorage

### Rotação de Treinos
- Automática com base no histórico: último treino feito → próximo na rotação A→B→A→B
- O usuário pode alterar manualmente a qualquer momento (botões A/B na Ficha do Dia)
- A alteração manual é salva para o dia atual no localStorage

### Estrutura de Dados (localStorage: `academia_treino`)
```json
{
  "exercicios": [
    {
      "id": "string (uuid)",
      "nome": "Supino Articulado",
      "grupoMuscular": "Peito",
      "imagem": "base64 ou null",
      "series": 3,
      "repeticoes": "10",
      "carga": ""
    }
  ],
  "fichas": {
    "A": ["exercicio-id-1", "exercicio-id-2", "..."],
    "B": ["exercicio-id-9", "exercicio-id-10", "..."]
  },
  "historico": {
    "2026-05-06": {
      "treino": "A",
      "concluido": true,
      "checks": ["exercicio-id-1", "exercicio-id-2"]
    }
  }
}
```

### Exercícios Pré-cadastrados
**Treino A** (Peito, Ombros, Tríceps, Pernas/Core):
1. Supino Articulado — Peito — 3×10
2. Fly — Peito — 3×10
3. Supino Vertical — Ombros — 3×10
4. Crucifixo — Peito — 3×10
5. Leg Press 180° + Banco Extenso — Pernas — 3×10
6. Desenvolvimento Máquina — Ombros — 3×10
7. Tríceps Testa + Pull Over — Tríceps — 3×10
8. Supra Prancha — Core — 3×15

**Treino B** (Costas, Bíceps, Ombros, Pernas):
1. Puxada Frente — Costas — 3×10
2. Remada Baixa — Costas — 3×10
3. Puxada Articulada — Costas — 3×10
4. Elevação Lateral — Ombros — 3×10
5. Banco Flexor — Pernas — 3×10
6. Remada Alta — Costas — 3×10
7. Rosca Scott — Bíceps — 3×10
8. Infra Paralelo — Peito — 3×15

### Badges por Grupo Muscular (cores)
```css
Peito:   #e94560 (vermelho)
Costas:  #4ecdc4 (teal)
Pernas:  #f9ca24 (amarelo)
Ombros:  #a29bfe (lavanda)
Bíceps:  #55efc4 (verde-menta)
Tríceps: #fd79a8 (rosa)
Core:    #fdcb6e (âmbar)
```

---

## Componentes Reutilizáveis

### Navbar (`componentes/navbar.js`)
Injetada em `<div id="navbar-container">`. Carrega automaticamente com tema.

### Footer (`componentes/footer.js`)
Injetada em `<div id="footer-container">`.

### ThemeManager (`componentes/thememanager.js` + `theme-integration.js`)
Gerencia troca de tema. Sobrescreve as variáveis CSS do `:root`.

### Scroll Animations (`componentes/scroll-animations.js`)
Classes: `scroll-fade-up`, `scroll-fade-left`, `scroll-fade-right` + `delay-1`, `delay-2`, `delay-3`.

---

## Como Adicionar Novas Páginas
1. Criar `nomepagina.html` na raiz
2. Criar `style/nomepagina.css` e `JS/nomepagina.js`
3. Incluir links para `main.css`, `navbar.css`, `footer.css` no HTML
4. Incluir scripts de componentes antes do script da página
5. Colocar `<div id="navbar-container">` e `<div id="footer-container">`

---

## Observações Importantes
- **Sem backend**: todos os dados persistem via localStorage no navegador do usuário
- **Imagens em base64**: imagens de exercícios são convertidas e salvas em localStorage; evitar imagens muito grandes (>2MB)
- **Responsivo**: todas as páginas devem funcionar em mobile (breakpoints: 768px, 480px)
- **Tema**: o ThemeManager pode alterar as variáveis CSS; sempre usar variáveis (`var(--primary)`) em vez de cores hardcoded
