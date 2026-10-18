# 🚀 Plano de Implementação — Academia v4.0 (React + Supabase + Vercel)

> **Contexto:** Migração incremental do Academia Workout Tracker (v3.5.7 Vanilla JS) para uma stack moderna cloud-first, mantendo o código legado funcional durante a transição.

---

## 📋 Sumário Executivo

| Atributo | Atual (v3.5.x) | Novo (v4.x) |
|---|---|---|
| **Framework** | Vanilla JS + ES Modules | React 19 + TypeScript 5.8 |
| **Bundler** | Sem bundler (ESM nativo) | Vite 6 + esbuild |
| **Estilização** | CSS Vanilla modular (8 módulos) | Tailwind CSS v4 + CSS Variables |
| **Animações** | CSS keyframes customizados | Motion v12 (Framer Motion) |
| **Persistência** | localStorage (100% local) | IndexedDB (offline) + Supabase PostgreSQL (cloud) |
| **Auth** | Nenhuma | Supabase Auth: email/senha + Google OAuth + WebAuthn 2FA |
| **Backend** | Nenhum | Supabase + Node.js/Express (push/proxy) |
| **Deploy** | Local / Capacitor APK | Vercel (web) + Capacitor (Android) |
| **Notificações** | SW básico (cache) | SW v7 + Web Push (VAPID) + TimestampTrigger |
| **Ícones** | SVGs inline customizados | Lucide React (preservando o sistema de design) |

---

## 🏗️ Arquitetura Alvo

```
Academia/
├── src/                          ← Novo código React + TS (projeto paralelo)
│   ├── main.tsx                  ← Entry point React
│   ├── app.tsx                   ← Root component + providers
│   ├── vite-env.d.ts
│   │
│   ├── core/                     ← Fundação da aplicação
│   │   ├── supabase.ts           ← Cliente Supabase (singleton)
│   │   ├── db/
│   │   │   ├── idb.ts            ← IndexedDB wrapper (Dexie.js)
│   │   │   ├── schema.ts         ← Tipos TypeScript do schema
│   │   │   └── sync-queue.ts     ← Fila de mutações offline
│   │   ├── auth/
│   │   │   ├── auth-context.tsx  ← AuthProvider + useAuth hook
│   │   │   ├── webauthn.ts       ← WebAuthn API helpers
│   │   │   └── crypto.ts         ← Web Crypto API helpers
│   │   └── pwa/
│   │       ├── sw-register.ts    ← Registro do Service Worker
│   │       └── push.ts           ← Web Push subscription helpers
│   │
│   ├── features/                 ← Módulos de feature (espelham os secao-*.js atuais)
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── RadarChart.tsx    ← SVG Radar (migração direta do secao-progresso.js)
│   │   │   └── WorkoutCard.tsx
│   │   ├── workout/              ← Migração de secao-ficha.js
│   │   │   ├── WorkoutOverlay.tsx
│   │   │   ├── ExerciseRow.tsx
│   │   │   ├── FocusMode.tsx
│   │   │   └── RestTimer.tsx     ← Radar + Hourglass timers
│   │   ├── training/             ← Migração de secao-treinos.js
│   │   │   ├── DeckBuilder.tsx
│   │   │   ├── ExerciseCard.tsx  ← Clash Royale card style
│   │   │   └── SearchToolbar.tsx
│   │   ├── progress/             ← Migração de secao-progresso.js
│   │   │   ├── ProgressView.tsx
│   │   │   ├── CycleTracker.tsx
│   │   │   └── Calculator1RM.tsx
│   │   ├── profile/              ← Migração de secao-perfil.js
│   │   │   ├── ProfileOverlay.tsx
│   │   │   ├── CustomizationTab.tsx
│   │   │   └── BackupTab.tsx     ← Agora sincroniza com Supabase
│   │   ├── gamification/
│   │   │   ├── MasterySystem.ts  ← Lógica pura de XP/tiers
│   │   │   ├── AchievementEngine.ts
│   │   │   └── LevelUp.tsx
│   │   └── auth/
│   │       ├── LoginPage.tsx
│   │       ├── RegisterPage.tsx
│   │       └── BiometricPrompt.tsx
│   │
│   ├── components/               ← UI primitivos reutilizáveis
│   │   ├── ui/
│   │   │   ├── BottomNav.tsx     ← Migração do nav.js
│   │   │   ├── Modal.tsx
│   │   │   ├── DynamicBg.tsx     ← Ken Burns + particles
│   │   │   ├── SwipeViewport.tsx ← translateX swipe viewport
│   │   │   └── IosToggle.tsx
│   │   └── icons/               ← Wrapper Lucide + SVGs legados
│   │
│   ├── hooks/
│   │   ├── useWorkoutSync.ts     ← IndexedDB ↔ Supabase sync
│   │   ├── useOfflineQueue.ts    ← Fila de mutações offline
│   │   ├── useTheme.ts           ← Migração do ThemeManager
│   │   └── useSwipe.ts           ← Gestos de swipe (Motion)
│   │
│   ├── store/
│   │   └── workout.store.ts      ← Zustand store (estado global leve)
│   │
│   └── styles/
│       ├── globals.css           ← @import Tailwind v4 + CSS vars do design system
│       └── design-tokens.css     ← Migração das vars de 1-core.css
│
├── server/                       ← Node.js + Express (Web Push + proxy)
│   ├── index.ts
│   ├── routes/
│   │   ├── push.ts               ← Endpoints Web Push VAPID
│   │   └── proxy.ts              ← Proxy de assets pesados (GIFs)
│   └── tsconfig.json
│
├── public/                       ← Assets estáticos (migração de Assets/)
│   ├── sw.js                     ← Service Worker v7 (reescrito)
│   ├── manifest.json             ← Atualizado para PWA v3
│   └── assets/                   ← GIFs, fontes, imagens
│
├── supabase/                     ← Configuração do projeto Supabase
│   ├── migrations/               ← SQL de schema
│   │   └── 001_initial_schema.sql
│   └── seed.sql                  ← Dados padrão (exercícios DEFAULT_EXERCISES)
│
├── [legado] treino.html          ← Mantido durante transição
├── [legado] JS/, style/, componentes/
│
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts            ← Só para referência de tokens (Tailwind v4 é zero-config)
├── capacitor.config.ts           ← Atualizado para apontar para dist/
└── vercel.json                   ← Configuração de deploy
```

---

## 🗄️ Schema do Banco de Dados (Supabase PostgreSQL)

```sql
-- Migração direta do localStorage schema (README.md)

-- Tabela de exercícios da biblioteca
CREATE TABLE exercises (
  id          TEXT PRIMARY KEY,       -- "ex-a1" (mantém os IDs legados)
  name        TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  sets        INTEGER DEFAULT 3,
  reps        TEXT DEFAULT '10',
  load        TEXT DEFAULT '',
  rest        INTEGER DEFAULT 30,
  image_url   TEXT,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fichas do usuário (A-J)
CREATE TABLE workout_sheets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sheet_key   CHAR(1) NOT NULL,       -- 'A' a 'J'
  exercise_ids TEXT[] DEFAULT '{}',
  aerobic     JSONB,                  -- { tipo, vel, tempo }
  is_archived BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sheet_key)
);

-- Histórico de treinos
CREATE TABLE workout_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  sheet_key   CHAR(1),
  completed   BOOLEAN DEFAULT FALSE,
  checks      TEXT[] DEFAULT '{}',   -- IDs de exercícios concluídos
  duration_min INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Maestria por exercício
CREATE TABLE exercise_mastery (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  xp          INTEGER DEFAULT 0,
  tier        TEXT DEFAULT 'none',   -- 'none'|'bronze'|'prata'|'ouro'|'elite'
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Conquistas desbloqueadas
CREATE TABLE achievements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Perfil e customização
CREATE TABLE user_profiles (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  handle          TEXT UNIQUE,
  banner_skin     TEXT DEFAULT 'roxo-neon',
  bar_skin        TEXT DEFAULT 'default',
  avatar_frame    TEXT DEFAULT 'none',
  title           TEXT,
  archetype       TEXT,
  selected_emblems TEXT[] DEFAULT '{}',
  push_subscription JSONB,           -- Web Push endpoint + keys
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Ciclo de 30 dias
CREATE TABLE training_cycles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  workouts_count  INTEGER DEFAULT 0,
  cycle_events    JSONB DEFAULT '{}',
  current_breakdown JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Cada usuário só vê seus próprios dados
ALTER TABLE workout_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_cycles ENABLE ROW LEVEL SECURITY;

-- Política padrão
CREATE POLICY "user_isolation" ON workout_sheets
  USING (auth.uid() = user_id);
-- (repetir para cada tabela)
```

---

## 📦 Stack de Dependências Completa

```json
{
  "dependencies": {
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "motion": "^12.23.24",
    "lucide-react": "^0.546.0",
    "@supabase/supabase-js": "^2.110.8",
    "dexie": "^4.0.8",
    "zustand": "^5.0.0",
    "web-push": "^3.6.7",
    "express": "^4.21.2",
    "compression": "^1.7.4",
    "@capacitor/core": "^8.4.2",
    "@capacitor/android": "^8.4.2"
  },
  "devDependencies": {
    "vite": "^6.2.3",
    "@vitejs/plugin-react": "^4.3.0",
    "@tailwindcss/vite": "^4.1.14",
    "tailwindcss": "^4.1.14",
    "typescript": "^5.8.2",
    "tsx": "^4.21.0",
    "vite-plugin-pwa": "^1.0.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "@types/express": "^5.0.0",
    "@types/web-push": "^3.6.3"
  }
}
```

---

## 🗺️ Fases de Implementação

---

## FASE 1 — Fundação do Projeto (Semana 1–2)
> *Scaffolding, configuração e design system em React/TS*

### 1.1 Inicialização do Projeto Vite

```bash
# Na raiz do projeto
npx -y create-vite@latest ./src-app -- --template react-ts
# Mover arquivos gerados para src/ e configurar paths
```

**Tarefas:**
- [ ] `vite.config.ts` com `@tailwindcss/vite`, `@vitejs/plugin-react`, `vite-plugin-pwa` e alias `@/` → `src/`
- [ ] `tsconfig.json` com `strict: true`, `paths`, `moduleResolution: bundler`
- [ ] `.env` com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`
- [ ] `vercel.json` configurado com `rewrite` para SPA e variáveis de ambiente

### 1.2 Design System — Migração dos Tokens CSS

**Mapeamento de `style/treino/1-core.css` → `src/styles/design-tokens.css`:**

```css
/* src/styles/design-tokens.css */
/* Migração DIRETA das variáveis de 1-core.css */
:root {
  --primary: #8b5cf6;
  --primary-light: #c084fc;
  --primary-dark: #6d28d9;
  --accent: #f5a6d3;
  --gym-green: #22c55e;
  --background: #121212;
  --card-bg: rgba(10,5,20,0.6);
  /* ... todos os tokens do DESIGN.md seção 2 ... */
}
```

**Integração Tailwind v4:**
```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "./design-tokens.css";

/* Tailwind v4: CSS-first configuration */
@theme {
  --color-primary: var(--primary);
  --color-gym-green: var(--gym-green);
  --font-rajdhani: 'Rajdhani', sans-serif;
  --font-inter: 'Inter', sans-serif;
}
```

> [!IMPORTANT]
> **Regra:** Os tokens de `1-core.css` são a **fonte única da verdade**. O Tailwind v4 consome os CSS Variables em vez de duplicá-los. Nunca hardcode uma cor.

### 1.3 Fontes e Assets

- [ ] Manter `Assets/FONTS/Rajdhani-*` servidos em `public/assets/fonts/`
- [ ] `@font-face` declarado em `design-tokens.css` (suporte offline preservado)
- [ ] GIFs de exercícios em `public/assets/exercicios/` (symlink ou cópia)

### 1.4 Roteamento (React Router v7 ou TanStack Router)

```
/               → Dashboard (landing, requer auth)
/login          → LoginPage
/register       → RegisterPage
/workout        → WorkoutOverlay (rota modal)
/training       → Deck Builder + Exercícios
/progress       → Progresso + Analytics
/profile        → Perfil overlay
/social         → Social (stub)
/shop           → Loja (stub)
```

> [!NOTE]
> Mantém a estrutura mental das sections atuais (progresso, treinos, dashboard, social, loja) como rotas React, mas usa `<AnimatePresence>` do Motion para simular o swipe viewport do sistema atual.

---

## FASE 2 — Autenticação e Banco de Dados (Semana 2–3)

### 2.1 Supabase — Configuração

- [ ] Criar projeto Supabase (gratuito suporta até 500MB + 50k usuários)
- [ ] Executar `supabase/migrations/001_initial_schema.sql` via Supabase Dashboard
- [ ] `supabase/seed.sql` com os `DEFAULT_EXERCISES` de `db.js` (50+ exercícios)
- [ ] Ativar Row Level Security em todas as tabelas
- [ ] Configurar Google OAuth no Supabase Auth Dashboard

```typescript
// src/core/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './db/schema';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
    }
  }
);
```

### 2.2 AuthContext e useAuth Hook

```typescript
// src/core/auth/auth-context.tsx
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  registerBiometric: () => Promise<void>;  // WebAuthn
  authenticateWithBiometric: () => Promise<boolean>;
}
```

### 2.3 WebAuthn — Biometria como 2FA

```typescript
// src/core/auth/webauthn.ts
// Usa a WebAuthn API nativa do navegador / Capacitor
export async function registerCredential(userId: string) {
  const challenge = await fetchChallengeFromServer(userId); // endpoint Node.js
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Academia Workout', id: window.location.hostname },
      user: { id: Uint8Array.from(userId, c => c.charCodeAt(0)), name: userId, displayName: userId },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      authenticatorSelection: { authenticatorAttachment: 'platform' },
      timeout: 60000,
    }
  });
  // Salvar credencial no Supabase (tabela user_profiles)
}
```

### 2.4 IndexedDB com Dexie — Camada Offline

```typescript
// src/core/db/idb.ts
import Dexie, { type Table } from 'dexie';

class AcademiaDB extends Dexie {
  workoutSheets!:  Table<WorkoutSheet>;
  workoutHistory!: Table<WorkoutHistory>;
  exerciseMastery!: Table<ExerciseMastery>;
  pendingMutations!: Table<PendingMutation>; // Fila de sync offline

  constructor() {
    super('academia-v4');
    this.version(1).stores({
      workoutSheets:   'sheetKey, userId',
      workoutHistory:  'date, userId',
      exerciseMastery: '[userId+exerciseId]',
      pendingMutations: '++id, table, operation, timestamp',
    });
  }
}

export const db = new AcademiaDB();
```

### 2.5 Sync Queue — Offline-First

```typescript
// src/core/db/sync-queue.ts
// Pattern: Write to IndexedDB immediately (otimistic update)
// + Enqueue mutation → Flush to Supabase when online

export async function addToQueue(mutation: PendingMutation) {
  await db.pendingMutations.add({ ...mutation, timestamp: Date.now() });
}

export async function flushQueue() {
  const pending = await db.pendingMutations.orderBy('timestamp').toArray();
  for (const mutation of pending) {
    try {
      await applyMutation(mutation); // Executa no Supabase
      await db.pendingMutations.delete(mutation.id!);
    } catch (e) {
      console.warn('Sync failed, will retry:', mutation);
      break; // Para na primeira falha para preservar ordem
    }
  }
}

// Ouvir evento online para flush automático
window.addEventListener('online', flushQueue);
```

### 2.6 Hook `useWorkoutSync`

```typescript
// src/hooks/useWorkoutSync.ts
// Estratégia: IndexedDB como source of truth local
// Supabase Realtime para invalidação quando outro dispositivo atualiza

export function useWorkoutSync() {
  // 1. Carregar do IndexedDB (imediato, offline)
  // 2. Supabase subscription para detectar updates remotos
  // 3. Merge policy: last-write-wins por timestamp
}
```

---

## FASE 3 — Interface React (Semana 3–5)

### 3.1 SwipeViewport — Preservando a Navegação Física

O sistema atual de `translateX` + `section-strip` será recriado com Motion:

```tsx
// src/components/ui/SwipeViewport.tsx
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';

// Recriar exatamente o comportamento de nav.js:
// - translateX da strip
// - Detecção de swipe por touch
// - Velocidade mínima de 200px/s para confirmar swipe
// - Blocking quando overlay (perfil/ficha) está aberto
```

> [!IMPORTANT]
> **Regra de Fidelidade:** A UX de swipe lateral deve ser **idêntica** à atual (v3.5.x). O sistema de `translateX` + física deve ser preservado. Motion substitui o `nav.js` mas o comportamento é o mesmo.

### 3.2 DynamicBg — Ken Burns + Partículas

```tsx
// src/components/ui/DynamicBg.tsx
// Migração direta de bg-dinamico.css + estrutura HTML
// Ken Burns via motion animate({ scale, x, y })
// Partículas via motion.div com keyframes (substituindo CSS @keyframes)
// hue-rotate para temas: motion style={{ filter: `hue-rotate(${hue}deg)` }}
```

### 3.3 ExerciseCard — Clash Royale Style

```tsx
// src/features/training/ExerciseCard.tsx
// Migração direta do blueprint 13.1 do DESIGN.md
// Hover lift: <motion.div whileHover={{ y: -8, scale: 1.03 }}>
// Muscle glow: via CSS var(--muscle-glow) + motion whileHover
// Card menu: AnimatePresence com buttonSlideUp
```

### 3.4 RadarChart — SVG Tático

```tsx
// src/features/dashboard/RadarChart.tsx
// Migração da lógica renderRadarChart() de secao-progresso.js
// computeRadarStats() → hook useRadarStats(db)
// SVG gerado via JSX (substituindo buildRadarSvgHtml)
// conic-gradient timer: preservado via CSS var(--progress)
```

### 3.5 RestTimer — Radar + Hourglass

```tsx
// src/features/workout/RestTimer.tsx
// Dois modos (conforme seção 9 do DESIGN.md):
// - Radar Sweep: conic-gradient via CSS var(--progress) animado com useEffect + requestAnimationFrame
// - Hourglass: SVG com scale animation via Motion
// Motion whileInView para o slideUpTimer de entrada
```

### 3.6 ProfileOverlay e CustomizationTab

```tsx
// Migração fiel do overlay de perfil (v3.1.0+)
// Animação: motion animate={{ opacity: [0,1], scale: [0.98, 1] }}
// Banners animados (seção 8.2 DESIGN.md): CSS @property --angle preservado
// Emblemas: motion whileHover pulse/spin variants
```

### 3.7 MasterySystem — Engine de Gamificação

```typescript
// src/features/gamification/MasterySystem.ts
// Lógica pura (sem DOM, testável)
// XP thresholds: Bronze < 100 | Prata < 500 | Ouro < 2000 | Elite ≥ 2000
// Cada tier: diferentes visuais (migração de 6-maestria.css)
// Events: 'tier-up' → LevelUpModal via Zustand store
```

### 3.8 WorkoutOverlay — Ficha do Dia

```tsx
// src/features/workout/WorkoutOverlay.tsx
// Overlay fullscreen (z-index: 600) com AnimatePresence
// FocusMode: motion layout transitions entre séries
// ESC handler: hook useKeydown
// CheckWrap gamificado: motion.div whileTap={{ scale: 0.95 }} + checkPop keyframe
```

---

## FASE 4 — PWA v7 e Notificações (Semana 5–6)

### 4.1 Service Worker Reescrito

```javascript
// public/sw.js — Substituição completa do sw.js atual
// Estratégia por tipo de recurso:
// - HTML/JS/CSS: Network-first com fallback cache (preserva o comportamento atual)
// - GIFs de exercícios: Cache-first (pesados, raramente mudam)
// - Requisições Supabase: Network-only (dados em tempo real)
// - Assets estáticos: Cache-first + background revalidation (Stale-While-Revalidate)

// NOVO: Background Sync API para flush da mutation queue
self.addEventListener('sync', event => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(flushOfflineQueue());
  }
});

// NOVO: Push events
self.addEventListener('push', event => {
  const data = event.data?.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/badge-72.png',
      data: data.url,
    })
  );
});
```

### 4.2 vite-plugin-pwa

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  injectRegister: 'auto',
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg}'],
    runtimeCaching: [
      {
        urlPattern: /\.gif$/,
        handler: 'CacheFirst',
        options: { cacheName: 'exercise-gifs', expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 } }
      },
      {
        urlPattern: /supabase\.co\/rest/,
        handler: 'NetworkOnly',
      }
    ]
  },
  manifest: { /* PWA manifest v3 atualizado */ }
})
```

### 4.3 Web Push — Servidor Node.js

```typescript
// server/routes/push.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:contato@academia.app',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

router.post('/subscribe', async (req, res) => {
  // Salvar subscription no Supabase (user_profiles.push_subscription)
});

router.post('/notify', async (req, res) => {
  // Disparar notificação para um usuário ou broadcast
  // Casos de uso: lembrete de treino diário, tier-up, missão diária
});
```

### 4.4 TimestampTrigger — Alarmes Nativos (Experimental)

```typescript
// Para dispositivos que suportam (Chrome 94+)
const registration = await navigator.serviceWorker.ready;
await registration.showNotification('Hora do treino! 💪', {
  showTrigger: new TimestampTrigger(Date.now() + remindInMs),
});
```

---

## FASE 5 — Server Node.js + Deploy Vercel (Semana 6–7)

### 5.1 Servidor Express

```typescript
// server/index.ts
import express from 'express';
import compression from 'compression';
import pushRouter from './routes/push';

const app = express();
app.use(compression());
app.use(express.json());
app.use('/api/push', pushRouter);
app.use('/api/webauthn', webauthnRouter); // Challenge generation

// Serve o build Vite em produção
app.use(express.static('dist'));
app.get('*', (_, res) => res.sendFile('dist/index.html'));
```

### 5.2 Vercel Configuration

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {
    "server/index.ts": { "runtime": "nodejs22.x" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/server/index.ts" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VAPID_PUBLIC_KEY": "@vapid_public",
    "VAPID_PRIVATE_KEY": "@vapid_private"
  }
}
```

### 5.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
# Push para main → Preview deploy no Vercel
# Tag vX.X.X → Production deploy
# npx cap sync android → Captura o dist/ para o APK
```

---

## FASE 6 — Capacitor + Android Build (Semana 7–8)

### 6.1 Atualização do capacitor.config.ts

```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.academia.workout',
  appName: 'Academia',
  webDir: 'dist',                    // ← Agora aponta para o build Vite
  server: {
    androidScheme: 'https',
    // Em desenvolvimento: apontar para localhost do Vite
    // url: 'http://192.168.x.x:5173',
  },
};
```

> [!IMPORTANT]
> **Mudança de `webDir`:** O Capacitor passa de `www/` para `dist/` (output do Vite). O antigo espelho manual `www/` deixa de existir. `npx cap sync android` após `vite build` é o fluxo padrão.

### 6.2 Plugins Capacitor para WebAuthn

```typescript
// WebAuthn no Android funciona via @simplewebauthn/browser
// Fallback: PIN/senha para dispositivos sem biometria
```

---

## 🔀 Mapa de Migração de Módulos

| Arquivo Legado | Equivalente React/TS | Prioridade |
|---|---|---|
| `JS/treino/db.js` | `src/core/db/idb.ts` + `sync-queue.ts` + Supabase | 🔴 Crítico |
| `JS/treino/nav.js` | `src/components/ui/SwipeViewport.tsx` + `useSwipe.ts` | 🔴 Crítico |
| `JS/treino/app.js` | `src/app.tsx` + `AuthContext` | 🔴 Crítico |
| `JS/treino/loader.js` | React Router + lazy loading | 🟡 Alta |
| `JS/treino/secao-dashboard.js` | `src/features/dashboard/Dashboard.tsx` | 🟡 Alta |
| `JS/treino/secao-ficha.js` + `ficha-overlay.js` | `src/features/workout/WorkoutOverlay.tsx` | 🟡 Alta |
| `JS/treino/secao-treinos.js` | `src/features/training/DeckBuilder.tsx` | 🟡 Alta |
| `JS/treino/secao-progresso.js` | `src/features/progress/ProgressView.tsx` + `RadarChart.tsx` | 🟡 Alta |
| `JS/treino/secao-perfil.js` + `perfil-overlay.js` | `src/features/profile/ProfileOverlay.tsx` | 🟡 Alta |
| `JS/treino/secao-customizacao.js` | `src/features/profile/CustomizationTab.tsx` | 🟢 Média |
| `JS/treino/templates.js` | Componentes React diretos (JSX substitui strings HTML) | 🟢 Média |
| `componentes/thememanager.js` | `src/hooks/useTheme.ts` + CSS vars | 🟢 Média |
| `componentes/fade-in.js` + `scroll-animations.js` | Motion `whileInView` | 🟢 Média |
| `sw.js` | `public/sw.js` (reescrito) + `vite-plugin-pwa` | 🔴 Crítico |
| `style/treino/1-core.css` | `src/styles/design-tokens.css` (migração 1:1) | 🔴 Crítico |
| `style/treino/2-modals.css` … `8-customizacao.css` | Componentes Tailwind + CSS modules por feature | 🟡 Alta |

---

## ⚠️ Decisões de Arquitetura e Riscos

### Decisões Tomadas

| # | Decisão | Racional |
|---|---|---|
| D1 | **Migração clean (sem importar localStorage)** | Supabase é a source of truth; localStorage legado pode ser exportado manualmente pelo usuário via backup JSON existente |
| D2 | **Projeto paralelo (`src/`)** | Permite desenvolvimento sem quebrar o app Vanilla atual; rollback trivial |
| D3 | **IndexedDB (Dexie) como cache local** | localStorage tem limite de ~5MB (insuficiente para base64 de imagens); IndexedDB suporta GBs |
| D4 | **Zustand em vez de Redux/Context** | Mínimo de boilerplate; compatível com React 19 Actions; SSR-friendly para futuro |
| D5 | **Tailwind v4 com CSS Variables** | Zero-config; tokens do design system já são CSS vars — integração natural |
| D6 | **Motion (Framer) para swipe** | O swipe physics de `nav.js` é complexo; Motion tem `useMotionValue` + `useDragControls` que replicam com menos código |
| D7 | **Supabase Realtime para multi-device** | Quando dois dispositivos estão online, mudanças aparecem em tempo real sem polling |

### Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Regressão visual (design system) | Alta | Manter `DESIGN.md` como especificação imutável; cada componente passa por checklist de conformidade |
| Perda de dados de usuários existentes | Média | App legado (`treino.html`) mantido disponível; função de export JSON já existente |
| Complexidade do sync offline | Alta | Dexie + sync queue com retry; Supabase tem `upsert` que é idempotente por design |
| WebAuthn em Android WebView | Média | Usar `@simplewebauthn/browser` com fallback de PIN |
| Performance dos GIFs na PWA | Baixa | Cache-first no SW; lazy loading com `loading="lazy"` + `IntersectionObserver` |
| Capacitor + Vite build path | Baixa | `webDir: 'dist'` é o padrão do Capacitor 5+; testado |

---

## ✅ Checklist de Conformidade com o Design System

Para cada componente migrado, verificar:

- [ ] Usa `var(--primary)` e tokens, **nunca** cores hardcoded
- [ ] Tipografia: `font-family: 'Rajdhani'` para títulos/UI, `'Inter'` para formulários
- [ ] Ícones: Lucide React com `strokeWidth={2}` e `color="currentColor"` (equivale ao sistema `stroke="currentColor"` atual)
- [ ] Zero emojis em funções de UI (apenas em textos motivacionais de gamificação)
- [ ] Dropdowns com `appearance: none` + seta SVG customizada
- [ ] Hover states com `whileHover` Motion (não apenas CSS hover em touch)
- [ ] Botões com `whileTap={{ scale: 0.95 }}` (feedback háptico visual)
- [ ] Cards com glassmorphism: `backdrop-filter: blur()` + `rgba` backgrounds
- [ ] BEM mantido apenas no CSS legado; novos componentes usam Tailwind + CSS modules
- [ ] `CHANGELOG.md` atualizado ao final de cada fase

---

## 📅 Cronograma Estimado

```
Semana 1-2:  FASE 1 — Scaffolding + Design Tokens + Auth UI (telas login/register)
Semana 2-3:  FASE 2 — Supabase schema + IndexedDB + Sync queue + AuthContext
Semana 3-4:  FASE 3a — Dashboard + Radar + SwipeViewport + BottomNav
Semana 4-5:  FASE 3b — WorkoutOverlay + DeckBuilder + RestTimer + ProfileOverlay
Semana 5-6:  FASE 4 — PWA v7 + Service Worker + Web Push + Node server
Semana 6-7:  FASE 5 — Vercel deploy + CI/CD + variáveis de ambiente
Semana 7-8:  FASE 6 — Capacitor sync + Android build + testes de integração
─────────────
Total:       8 semanas (desenvolvimento ativo)
```

---

## 🔗 Referências e Dependências Externas

| Serviço | Uso | Tier Gratuito |
|---|---|---|
| [Supabase](https://supabase.com) | Auth + DB + Realtime | 500MB, 50k usuários |
| [Vercel](https://vercel.com) | Hosting + CDN + Serverless | 100GB bandwidth |
| [Dexie.js](https://dexie.org) | IndexedDB wrapper tipado | Open source |
| [Zustand](https://zustand-demo.pmnd.rs) | Estado global leve | Open source |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | Workbox + manifest gerado | Open source |
| [@simplewebauthn/browser](https://simplewebauthn.dev) | WebAuthn client | Open source |

---

> [!NOTE]
> Este plano é um **documento vivo**. Cada fase concluída deve ser registrada no `Diretrizes/CHANGELOG.md` sob a versão `[v4.0.0-phaseN]` com a tag `[Added]` ou `[Changed]` conforme o padrão existente.
