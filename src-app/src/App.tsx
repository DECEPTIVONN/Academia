/**
 * App.tsx — Componente Raiz da Aplicação React Academia v4.0
 * Conecta HeaderHUD, TabBar, SheetsFeature, HistoryFeature, ActiveWorkoutModal e AuthProvider.
 */

import React, { useState } from 'react';
import { AuthProvider } from '@/core/auth/auth-context';
import { HeaderHUD } from '@/components/HeaderHUD';
import { TabBar, type TabType } from '@/components/TabBar';
import { SheetsFeature } from '@/features/workout/SheetsFeature';
import { HistoryFeature } from '@/features/training/HistoryFeature';
import { ActiveWorkoutModal } from '@/features/workout/ActiveWorkoutModal';
import { useWorkoutStore } from '@/store/workout-store';
import type { SheetKey } from '@/core/db/schema';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('sheets');
  const { isActive, startWorkout, cancelWorkout } = useWorkoutStore();

  const handleStartWorkout = (sheetKey: SheetKey) => {
    startWorkout(sheetKey, `Treino ${sheetKey}`);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[var(--color-app-bg)] text-white font-sans selection:bg-purple-500 selection:text-white relative overflow-x-hidden">
        {/* Background Dinâmico Ken Burns & Partículas de Elixir */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-purple-950/20 via-black to-black" />

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Header HUD Gamificado */}
          <HeaderHUD isOnline={true} isSyncing={false} />

          {/* Conteúdo Principal conforme a Tab Selecionada */}
          <main className="flex-1">
            {activeTab === 'sheets' && (
              <SheetsFeature onStartWorkout={handleStartWorkout} />
            )}

            {activeTab === 'history' && <HistoryFeature />}

            {(activeTab === 'workout' || activeTab === 'mastery' || activeTab === 'profile') && (
              <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 font-mono text-sm max-w-md mx-auto my-12 bg-gray-900/40 rounded-3xl border border-gray-800">
                <span className="text-4xl mb-3">🏋️‍♂️</span>
                <h3 className="text-white font-bold text-lg mb-1">Módulo em Desenvolvimento</h3>
                <p>Esta seção está sendo finalizada na migração. Utilize a aba <strong className="text-purple-400">Fichas</strong> para treinar.</p>
              </div>
            )}
          </main>

          {/* Modal de Treino Ativo */}
          {isActive && (
            <ActiveWorkoutModal onClose={cancelWorkout} />
          )}

          {/* TabBar de Navegação Mobile/Desktop */}
          <TabBar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isWorkoutActive={isActive}
          />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
