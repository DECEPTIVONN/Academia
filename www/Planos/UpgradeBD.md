# Upgrade para Banco de Dados — Academia

**Data**: 12 de maio de 2026

---

## Resumo Executivo

Este documento lista todos os dados associados a um usuário que serão migrados de localStorage para um banco de dados relacional. O volume de dados é **moderado** (~5-50 MB por usuário anualmente), com padrões de acesso **leitura/escrita balanceados**.

---

## Estrutura de Dados Completa por Usuário

### 1. **Exercícios Cadastrados** (`exercicios`)
**Tipo**: Array de Objetos  
**Quantidade esperada**: 20-100 exercícios por usuário  
**Crescimento**: ~0,5-1 MB por 100 exercícios

```json
[
  {
    "id": "ex-a1",
    "nome": "Supino Articulado",
    "grupoMuscular": "Peito",
    "series": 3,
    "repeticoes": "10",
    "carga": "50kg",
    "descanso": 30,
    "imagem": "base64 ou URL",
    "anotacoes": "Descender lentamente",
    "historicoCargas": [
      {
        "data": "2026-05-12",
        "valor": 50,
        "label": "50kg"
      }
    ]
  }
]
```

**Campos**:
- `id`: String (UUID-like)
- `nome`: String (até 100 caracteres)
- `grupoMuscular`: String (enum: Peito, Costas, Pernas, Ombros, Bíceps, Tríceps, Core)
- `series`: Integer (1-10)
- `repeticoes`: String (ex: "10", "8-12")
- `carga`: String (ex: "50kg", "50")
- `descanso`: Integer (segundos)
- `imagem`: String (base64 ou URL externa)
- `anotacoes`: String (até 500 caracteres)
- `historicoCargas`: Array (últimas 15 cargas registradas)
  - `data`: Date (YYYY-MM-DD)
  - `valor`: Float (peso numérico)
  - `label`: String (representação completa)

---

### 2. **Fichas de Treino** (`fichas`)
**Tipo**: Map/Objeto com 5 chaves (A, B, C, D, E)  
**Quantidade esperada**: 5 fichas máximo  
**Crescimento**: Fixo (~1 KB)

```json
{
  "A": ["ex-a1", "ex-a2", "ex-a5", "ex-a6", "ex-a8"],
  "B": ["ex-b1", "ex-b2", "ex-b5", "ex-b4", "ex-b7"],
  "C": [],
  "D": [],
  "E": []
}
```

**Descrição**: Array de IDs de exercícios para cada ficha (A-E). Fichas vazias são ocultadas na UI.

---

### 3. **Cardios/Aeróbicos** (`aerobicos`)
**Tipo**: Map com 5 chaves (A-E), valores podem ser null  
**Quantidade esperada**: 0-5 configurações  
**Crescimento**: Fixo (~0,5 KB)

```json
{
  "A": {
    "tipo": "Esteira",
    "vel": "5.0",
    "tempo": "20"
  },
  "B": null,
  "C": null,
  "D": null,
  "E": null
}
```

**Campos por aeróbico**:
- `tipo`: String (ex: "Esteira", "Bicicleta", "Elíptico")
- `vel`: String (km/h)
- `tempo`: String (minutos)

---

### 4. **Histórico de Treinos** (`historico`)
**Tipo**: Map com chave = data (YYYY-MM-DD)  
**Quantidade esperada**: 1-2 entradas/dia × 365 dias × anos = 365-730 registros/ano  
**Crescimento**: ~2-5 MB por ano

```json
{
  "2026-05-12": {
    "treino": "A",
    "treinos": ["A"],
    "concluido": true,
    "checks": ["ex-a1", "ex-a2"],
    "seriesDone": {
      "ex-a1": [true, true, true],
      "ex-a2": [true, false, true]
    }
  },
  "2026-05-11": {
    "treino": "B",
    "treinos": ["B"],
    "concluido": false,
    "checks": [],
    "seriesDone": {}
  }
}
```

**Campos por entrada diária**:
- `treino`: String (letra: A-E, treino atual do dia)
- `treinos`: Array de Strings (treinos completados hoje)
- `concluido`: Boolean (dia totalmente concluído?)
- `checks`: Array de IDs (exercícios marcados como feitos)
- `seriesDone`: Map de Arrays Booleans (séries concluídas por exercício)

---

### 5. **Gamificação & Ciclos** (`conquistas`, `currentFichaWorkouts`, `currentCycleBreakdown`, `currentCycleStartDate`, `cycleEvents`)

#### 5.1 Conquistas (`conquistas`)
**Tipo**: Array de Objetos  
**Quantidade esperada**: 0-20+ conquistas  
**Crescimento**: ~0,5 KB por 10 conquistas

```json
[
  {
    "id": "b1",
    "titulo": "Primeiro Passo",
    "desc": "Concluiu o primeiro treino.",
    "data": "2026-05-01",
    "icon": "🆕"
  },
  {
    "id": "conq-ciclo-1234567890",
    "titulo": "Mestre da Constância",
    "desc": "Completou um ciclo inteiro de 30 treinos!",
    "data": "2026-05-12",
    "icon": "🔱"
  }
]
```

#### 5.2 Contadores de Ciclo
```json
{
  "currentFichaWorkouts": 12,
  "currentCycleBreakdown": {
    "A": 3,
    "B": 4,
    "C": 2,
    "D": 2,
    "E": 1
  },
  "currentCycleStartDate": "2026-05-01",
  "cycleEvents": {
    "2026-05-01": "Início do Ciclo",
    "2026-05-12": "Ciclo Concluído"
  }
}
```

---

### 6. **Fichas Arquivadas** (`fichasArquivadas`)
**Tipo**: Array de Objetos (Histórico de ciclos antigos)  
**Quantidade esperada**: 10-50 ciclos arquivados (1 ciclo a cada 30 treinos)  
**Crescimento**: ~2-3 KB por ciclo arquivado

```json
[
  {
    "data": "2026-05-12",
    "reason": "Ciclo Concluído",
    "fichas": {
      "A": ["ex-a1", "ex-a2"],
      "B": ["ex-b1", "ex-b2"],
      "C": [],
      "D": [],
      "E": []
    },
    "aerobicos": {
      "A": { "tipo": "Esteira", "vel": "5.0", "tempo": "20" },
      "B": null,
      "C": null,
      "D": null,
      "E": null
    },
    "workoutsDone": 30,
    "breakdown": {
      "A": 6,
      "B": 6,
      "C": 6,
      "D": 6,
      "E": 6
    }
  }
]
```

---

### 7. **Preferências do Usuário** (Stored em `localStorage`, não em `academia_treino`)
**Tipo**: Múltiplas chaves no localStorage  
**Crescimento**: Fixo (~1-2 KB)

| Chave | Tipo | Descrição |
|-------|------|-----------|
| `academia_view_mode` | String | "table" ou "grid" |
| `academia_theme` | String | Tema ativo (purple, green, blue, orange, red, cyan) |
| `academia_calendar_view` | String | "monthly" ou "weekly" |
| `timerStyle` | String | "radar" ou "hourglass" |

---

## Análise de Volume e Crescimento

### Tamanho Aproximado por Componente (por usuário/ano):

| Componente | Tamanho Inicial | Crescimento Anual | Total (1 ano) |
|------------|-----------------|------------------|---------------|
| Exercícios | 50 KB | +50 KB | 100 KB |
| Fichas | 1 KB | 0 KB | 1 KB |
| Aeróbicos | 0.5 KB | 0 KB | 0.5 KB |
| Histórico | 100 KB | ~2-3 MB | ~2-3 MB |
| Conquistas | 2 KB | +2-5 KB | ~5 KB |
| Ciclos Arquivados | 0 KB | +50-100 KB/ano | ~100 KB |
| Preferências | 1 KB | 0 KB | 1 KB |
| **TOTAL** | **~155 KB** | **~2-3.5 MB** | **~2.5-3.5 MB** |

**Estimativa para 1000 usuários ativos**:
- Armazenamento: ~2.5-3.5 GB/ano
- Transferência diária: ~500 KB-2 MB (dependendo de atividade)

---

## Padrões de Acesso aos Dados

### Frequência de Operações (por usuário/dia):
- **Leitura**: 20-50 requisições (renderização, filtros, busca)
- **Escrita**: 2-10 requisições (check de exercícios, novo exercício, configurações)
- **Exclusão**: 0-2 requisições (remover exercício/ficha)

### Operações Críticas:
1. **Leitura do Histórico** → para renderizar calendário, streak, progresso (diário)
2. **Escrita no Histórico** → ao marcar exercício como feito (múltiplas vezes/dia)
3. **Leitura de Fichas** → ao carregar "Ficha do Dia" (3-5 vezes/dia)
4. **Leitura de Exercícios** → ao listar/filtrar exercícios (5-10 vezes/dia)

### Padrão de Horário:
- Picos de acesso: **6h-8h AM** (início da manhã) e **6h-8h PM** (final da tarde)
- Uso leve em fins de semana

---

## Requisitos da Plataforma

### Performance:
- ✅ **Latência**: < 100ms para leitura de histórico diário
- ✅ **Throughput**: Suportar 100+ requisições/segundo (picos)
- ✅ **Uptime**: 99.5%+ SLA

### Armazenamento:
- ✅ Suportar 3-5 MB por usuário/ano
- ✅ Backup automático + restore
- ✅ Escalabilidade horizontal

### Segurança:
- ✅ Criptografia em trânsito (HTTPS)
- ✅ Autenticação de usuário (a implementar)
- ✅ Isolamento de dados por usuário

### Conformidade:
- ✅ LGPD/GDPR ready (direito de exclusão, exportação)
- ✅ Logs de auditoria (quem alterou o quê e quando)

---

## Opções de Plataforma Recomendadas

### 1. **Firebase Realtime Database** ⭐ (Recomendado para MVP)
**Prós**:
- Zero configuração de servidor
- Sincronização em tempo real
- Escalabilidade automática
- Backup automático incluído

**Contras**:
- Custo por requisição (pay-as-you-go)
- Menos controle sobre queries

**Custo estimado**: $5-20/mês para 1000 usuários

---

### 2. **PostgreSQL + AWS RDS**
**Prós**:
- Relacional, ideal para histórico estruturado
- Backup e replicação robustos
- Controle total sobre queries

**Contras**:
- Requer gerenciamento de servidor
- Mais complexo de configurar

**Custo estimado**: $15-50/mês para 1000 usuários

---

### 3. **MongoDB Atlas**
**Prós**:
- Schema flexível (perfeito para array de dados)
- Escalabilidade horizontal
- Backup automático

**Contras**:
- Maior consumo de armazenamento
- Queries less optimized para certos padrões

**Custo estimado**: $10-40/mês para 1000 usuários

---

### 4. **Supabase** (Alternativa Open-Source)
**Prós**:
- PostgreSQL + autenticação + realtime
- Alternativa gratuita ao Firebase
- Full control

**Contras**:
- Menos maduro que Firebase

**Custo estimado**: Gratuito até 1000 MAU, depois $25+/mês

---

## Recomendação Final

**Para MVP/Prototipagem**: → **Firebase Realtime Database**
- Lançar rapidamente
- Custo baixo inicialmente
- Migrar depois se necessário

**Para Produção em Larga Escala**: → **PostgreSQL + AWS RDS** ou **Supabase**
- Melhor para queries complexas (relatórios, analytics)
- Melhor controle de custos
- Mais seguro e auditável

---

## Próximos Passos

1. ✅ Definir estratégia de autenticação (Email/Senha, Google, GitHub)
2. ✅ Implementar CRUD para sincronização
3. ✅ Adicionar validação de dados server-side
4. ✅ Configurar backup e disaster recovery
5. ✅ Implementar analytics e logging
6. ✅ Testar performance e segurança
