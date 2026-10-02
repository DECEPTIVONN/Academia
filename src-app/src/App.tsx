/**
 * App.tsx — Aplicação React Academia v4.0 com os componentes e visual 100% fiéis ao Vanilla CSS
 */

import React, { useState } from 'react';
import { AuthProvider } from '@/core/auth/auth-context';
import { DashboardFeature } from '@/features/dashboard/DashboardFeature';
import { SheetsFeature } from '@/features/workout/SheetsFeature';
import { HistoryFeature } from '@/features/training/HistoryFeature';
import { ActiveWorkoutModal } from '@/features/workout/ActiveWorkoutModal';
import { BottomNav, type SectionType } from '@/components/BottomNav';
import { useWorkoutStore } from '@/store/workout-store';
import type { SheetKey } from '@/core/db/schema';

export function App() {
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [isFichaOverlayOpen, setIsFichaOverlayOpen] = useState(false);
  const [isPerfilOverlayOpen, setIsPerfilOverlayOpen] = useState(false);

  const { isActive, startWorkout, cancelWorkout } = useWorkoutStore();

  const handleStartWorkout = (sheetKey: SheetKey) => {
    startWorkout(sheetKey, `Treino ${sheetKey}`);
    setIsFichaOverlayOpen(false);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0a0514] text-[#e5e2e1] font-['Outfit'] relative overflow-x-hidden">
        {/* CR Dynamic Background System */}
        <div id="cr-dynamic-bg" className="cr-bg-container fixed inset-0 pointer-events-none z-0">
          <div className="cr-bg-layer" />
          <div className="cr-bg-particles">
            <div className="cr-particle cr-p1" />
            <div className="cr-particle cr-p2" />
            <div className="cr-particle cr-p3" />
            <div className="cr-particle cr-p4" />
            <div className="cr-particle cr-p5" />
          </div>
          <div className="cr-bg-overlay" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Conteúdo Principal (Slide / Seção) */}
          <main className="flex-1">
            {activeSection === 'dashboard' && (
              <DashboardFeature
                onNavigate={(sec) => setActiveSection(sec as SectionType)}
                onOpenFicha={() => setIsFichaOverlayOpen(true)}
                onOpenPerfil={() => setIsPerfilOverlayOpen(true)}
              />
            )}

            {activeSection === 'treinos' && (
              <SheetsFeature onStartWorkout={handleStartWorkout} />
            )}

            {activeSection === 'progresso' && <HistoryFeature />}

            {(activeSection === 'social' || activeSection === 'loja') && (
              <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 font-['Rajdhani'] text-sm max-w-md mx-auto my-20 bg-[#1c1b1b]/80 rounded-3xl border border-[#8b5cf6]/30">
                <span className="text-5xl mb-4">💬</span>
                <h2 className="text-white font-bold text-2xl uppercase mb-2">
                  {activeSection === 'social' ? 'SOCIAL' : 'LOJA'}
                </h2>
                <p className="text-gray-400 font-['Outfit'] text-xs">
                  Em breve! Conecte-se com amigos, compare progresso e desafie outros atletas.
                </p>
              </div>
            )}
          </main>

          {/* ====== FICHA OVERLAY ====== */}
          {isFichaOverlayOpen && (
            <div className="ficha-overlay fixed inset-0 z-50 bg-[#0a0514]/95 backdrop-blur-xl p-4 overflow-y-auto">
              <button
                className="ficha-overlay-close absolute top-4 right-4 p-2 bg-[#2a2a2a] rounded-full text-white"
                onClick={() => setIsFichaOverlayOpen(false)}
              >
                ✕
              </button>
              <div className="pt-8">
                <SheetsFeature onStartWorkout={handleStartWorkout} />
              </div>
            </div>
          )}

          {/* Modal de Treino Ativo */}
          {isActive && <ActiveWorkoutModal onClose={cancelWorkout} />}

          {/* ====== BARRA DE NAVEGAÇÃO INFERIOR ====== */}
          <BottomNav
            activeSection={activeSection}
            onSelectSection={setActiveSection}
          />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
