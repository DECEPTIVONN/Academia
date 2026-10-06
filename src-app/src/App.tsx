/**
 * App.tsx — Aplicação React Academia v4.0 com os componentes e visual 100% fiéis ao Vanilla CSS
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider } from '@/core/auth/auth-context';
import { DashboardFeature } from '@/features/dashboard/DashboardFeature';
import { TreinosFeature } from '@/features/workout/treinos/TreinosFeature';
import { FichaFeature } from '@/features/workout/FichaFeature';
import { ProgressoFeature } from '@/features/training/ProgressoFeature';
import { ConclusaoModal } from '@/features/workout/ConclusaoModal';
import { ProfileFeature } from '@/features/profile/ProfileFeature';
import { applyAppTheme, readLS } from '@/features/profile/profile-data';
import { BottomNav, type SectionType } from '@/components/BottomNav';
import { useWorkoutStore } from '@/store/workout-store';
import { useTodayEntryStore } from '@/store/today-entry-store';
import { loadLocalData, getTodayTreino } from '@/core/db/queries';
import { ShareModal } from '@/features/gamification/ShareModal';
import { useShareStore } from '@/features/gamification/share-store';
import { ColecaoModals } from '@/features/gamification/ColecaoModals';
import { useMaestriaUi } from '@/features/gamification/maestria-ui';
import { fadeIn, fadeSwap } from '@/lib/animations';
import { showToast } from '@/lib/toast';
import type { SheetKey } from '@/core/db/schema';

export function App() {
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [isFichaOverlayOpen, setIsFichaOverlayOpen] = useState(false);
  const [isPerfilOverlayOpen, setIsPerfilOverlayOpen] = useState(false);
  const [isPerfilClosing, setIsPerfilClosing] = useState(false);
  const [isConclusaoOpen, setIsConclusaoOpen] = useState(false);
  const [isEncerrarOpen, setIsEncerrarOpen] = useState(false);
  const isShareOpen = useShareStore((s) => s.show);
  const isMaestriaUiOpen = useMaestriaUi((s) => s.colecaoOpen || s.maestriaExId !== null);
  const perfilScrollRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  /* Guarda de animação (nav.js isAnimating): evita troca dupla durante o fade */
  const animatingRef = useRef(false);

  /* nav.js L135-152: fadeSwap na seção ativa → troca → fadeIn na nova */
  const navigateSection = useCallback(
    (sec: SectionType) => {
      if (sec === activeSection) {
        fadeIn(mainRef.current);
        return;
      }
      if (animatingRef.current) return;
      animatingRef.current = true;
      window.setTimeout(() => {
        animatingRef.current = false;
      }, 150);
      fadeSwap(mainRef.current, () => {
        setActiveSection(sec);
        document.dispatchEvent(new CustomEvent('sectionchange', { detail: sec }));
      });
    },
    [activeSection]
  );

  /* nav.js L207–298: swipe horizontal por threshold (20% da largura ou 150px)
     com as mesmas exclusões de alvo. Divergência aceita (CHANGELOG v4.0.6-phase4):
     sem arrasto contínuo da fita — apenas detecção de intenção + troca no fim. */
  useEffect(() => {
    const sectionsOrder: SectionType[] = ['progresso', 'treinos', 'dashboard', 'social', 'loja'];
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let dir: 'h' | 'v' | null = null;

    const onStart = (e: TouchEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (
        t.closest('.table-scroll-wrap') ||
        t.closest('.month-grid') ||
        t.closest('.theme-colors') ||
        t.closest('.treino-selector') ||
        t.closest('.modal-overlay') ||
        t.closest('.perfil-overlay') ||
        t.closest('.ficha-overlay') ||
        (t.closest('[draggable="true"]') && t.closest('#tab-montar')) ||
        t.tagName.toLowerCase() === 'input' ||
        t.tagName.toLowerCase() === 'textarea'
      )
        return;
      if (animatingRef.current) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      dragging = true;
      dir = null;
    };

    const onMove = (e: TouchEvent) => {
      if (!dragging) return;
      const diffX = e.touches[0].clientX - startX;
      const diffY = e.touches[0].clientY - startY;
      if (!dir && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
        dir = Math.abs(diffX) > Math.abs(diffY) ? 'h' : 'v';
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!dragging) return;
      dragging = false;
      if (dir !== 'h') return;
      const diffX = e.changedTouches[0].clientX - startX;
      const threshold = window.innerWidth * 0.2;
      if (Math.abs(diffX) > threshold || Math.abs(diffX) > 150) {
        const idx = sectionsOrder.indexOf(activeSection);
        if (diffX < 0 && idx < sectionsOrder.length - 1) navigateSection(sectionsOrder[idx + 1]);
        else if (diffX > 0 && idx > 0) navigateSection(sectionsOrder[idx - 1]);
        else navigateSection(activeSection);
      } else {
        navigateSection(activeSection); // volta pro lugar (snap)
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [activeSection, navigateSection]);

  const { isActive, startWorkout } = useWorkoutStore();

  /* startWorkoutFromDashboard (secao-dashboard.js L276-304): o PRÓXIMO PASSO do
     Dashboard grava o treino escolhido em db.historico[today] (setTodayTreino),
     inicia o cronômetro (workout_start_time) e só então abre a Ficha — é daí
     que vêm o contador "Duração do Treino" e o botão ENCERRAR TREINO. */
  const handleOpenFicha = useCallback(
    async (sheetKey: SheetKey) => {
      const entryStore = useTodayEntryStore.getState();
      if (!entryStore.loaded) await useTodayEntryStore.getState().load();
      const loaded = useTodayEntryStore.getState();
      if (loaded.loaded && loaded.entry.sheetKey !== sheetKey) {
        await loaded.update((e) => ({ ...e, sheetKey }));
      }
      if (!useWorkoutStore.getState().isActive) startWorkout(sheetKey, `Treino ${sheetKey}`);
      setIsFichaOverlayOpen(true);
    },
    [startWorkout]
  );

  /* initGlobalTimer (secao-ficha.js L1007-1028): iniciar = start + toast,
     sem fechar a Ficha e sem abrir outro modal */
  const handleStartWorkout = (sheetKey: SheetKey) => {
    startWorkout(sheetKey, `Treino ${sheetKey}`);
    showToast('Treino iniciado! Foco total!', 'success');
  };

  /* btnStartWorkout com o timer rodando (secao-ficha.js L1022-1027):
     nunca encerra direto — pede confirmação via modalEncerrarTreino */
  const handleRequestEncerrar = () => setIsEncerrarOpen(true);

  /* btnFecharConclusao (app.js L272–292): fecha, volta ao Início e fecha a ficha */
  const handleConclusaoClose = () => {
    setIsConclusaoOpen(false);
    setIsFichaOverlayOpen(false);
    setActiveSection('dashboard');
  };

  /* closeFichaOverlay (ficha-overlay.js L99–102): com treino ativo → modalEncerrarTreino */
  const handleFecharFicha = () => {
    if (isActive) setIsEncerrarOpen(true);
    else setIsFichaOverlayOpen(false);
  };

  /* btnEncerrarConfirmar (app.js L295–335) + encerrarTreinoGlobal (L1093–1104) */
  const handleEncerrarConfirmar = async () => {
    const ws = useWorkoutStore.getState();
    const entryStore = useTodayEntryStore.getState();

    if (ws.startTime) {
      const sec = Math.floor((Date.now() - ws.startTime) / 1000);
      if (sec > 0) {
        await entryStore.update((e) => ({
          ...e,
          durationMin: Math.max(1, Math.round(sec / 60)),
        }));
      }
      ws.finishWorkout();
      showToast('Treino finalizado! Ótimo trabalho.', 'success');
    }

    const data = await loadLocalData();
    const entry = useTodayEntryStore.getState().entry;
    const treino = entry.sheetKey ?? getTodayTreino(data);
    const fichaIds = data.sheets.find((s) => s.sheetKey === treino)?.exerciseIds ?? [];
    const vaiConcluir =
      fichaIds.length > 0 && fichaIds.every((id) => entry.checks.includes(id));

    setIsEncerrarOpen(false);
    setIsFichaOverlayOpen(false);
    if (vaiConcluir) setIsConclusaoOpen(true);
    else setActiveSection('dashboard');
  };

  /* openModal/closeModal (secao-ficha.js L560–568): trava/destrava body */
  useEffect(() => {
    document.body.style.overflow =
      isEncerrarOpen || isConclusaoOpen || isShareOpen || isMaestriaUiOpen ? 'hidden' : '';
  }, [isEncerrarOpen, isConclusaoOpen, isShareOpen, isMaestriaUiOpen]);

  /* Trava o scroll do body enquanto o overlay fullscreen da Ficha está aberto
     (regra body.ficha-overlay-open de ficha-overlay.css, igual ao legado) */
  useEffect(() => {
    document.body.classList.toggle('ficha-overlay-open', isFichaOverlayOpen);
    return () => document.body.classList.remove('ficha-overlay-open');
  }, [isFichaOverlayOpen]);

  /* Tema salvo + classes/aria do overlay do Perfil
     (perfil-overlay.js openPerfilOverlay L37–75 / closePerfilOverlay L78–114) */
  useEffect(() => {
    applyAppTheme(readLS('academia_theme') || 'purple');
  }, []);

  useEffect(() => {
    document.body.classList.toggle('perfil-overlay-open', isPerfilOverlayOpen && !isPerfilClosing);
  }, [isPerfilOverlayOpen, isPerfilClosing]);

  const closePerfilOverlay = useCallback(() => {
    setIsPerfilClosing(true);
    // Foco volta ao elemento que originou a abertura (cartão de visitas)
    const focusTarget = perfilScrollRef.current?.ownerDocument.activeElement as HTMLElement | null;
    setTimeout(() => {
      setIsPerfilOverlayOpen(false);
      setIsPerfilClosing(false);
      // Sempre volta ao Dashboard após o fade-out (legado L105–111)
      setActiveSection('dashboard');
      focusTarget?.focus?.({ preventScroll: true });
    }, 240);
  }, []);

  /* ESC fecha o overlay do Perfil (perfil-overlay.js L125–130) */
  useEffect(() => {
    if (!isPerfilOverlayOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPerfilClosing) {
        e.preventDefault();
        closePerfilOverlay();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isPerfilOverlayOpen, isPerfilClosing, closePerfilOverlay]);

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
          <main className="flex-1" ref={mainRef}>
            {activeSection === 'dashboard' && (
              <DashboardFeature
                onNavigate={(sec) => navigateSection(sec as SectionType)}
                onOpenFicha={handleOpenFicha}
                onOpenPerfil={() => setIsPerfilOverlayOpen(true)}
              />
            )}

            {activeSection === 'treinos' && <TreinosFeature />}

            {activeSection === 'progresso' && <ProgressoFeature />}

            {(activeSection === 'social' || activeSection === 'loja') && (
              /* Placeholders .section-coming-soon — estrutura 1:1 com
                 treino.html L184-207 (SOCIAL) e L197-207 (LOJA) */
              <div className="section-slide" data-section={activeSection}>
                <div className="treino-container">
                  <div
                    id={activeSection === 'social' ? 'section-social' : 'section-loja'}
                    className="main-section"
                    role="tabpanel"
                  >
                    <div className="section-coming-soon">
                      <div className="cs-icon">{activeSection === 'social' ? '💬' : '🛒'}</div>
                      <h2 className="cs-title">{activeSection === 'social' ? 'SOCIAL' : 'LOJA'}</h2>
                      <p className="cs-sub">
                        {activeSection === 'social'
                          ? 'Em breve! Conecte-se com amigos, compare progresso e desafie outros atletas.'
                          : 'Em breve! Itens, skins e upgrades exclusivos para sua jornada.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* ====== PERFIL OVERLAY ======
              Estrutura 1:1 com treino.html L265–281 + perfil-overlay.css.
              O conteúdo (perfil.html) fica em ProfileFeature. */}
          <div
            id="perfil-overlay"
            className={`perfil-overlay ${isPerfilClosing ? 'is-closing' : ''}`}
            aria-hidden={!isPerfilOverlayOpen || isPerfilClosing}
            role="dialog"
            aria-modal="true"
            aria-label="Perfil do usuário"
            style={{ display: isPerfilOverlayOpen ? 'flex' : 'none' }}
          >
            <header className="perfil-overlay__header">
              <div className="perfil-overlay__title">
                <span className="perfil-overlay__title-main">Meu Perfil</span>
                <span className="perfil-overlay__title-sub">Personalize sua jornada</span>
              </div>
              <button
                className="perfil-overlay-close"
                id="perfilOverlayClose"
                type="button"
                aria-label="Fechar perfil e voltar para o Início"
                onClick={closePerfilOverlay}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>
            <div className="perfil-overlay__scroll" id="perfilOverlayScroll" ref={perfilScrollRef}>
              <ProfileFeature />
            </div>
          </div>

          {/* ====== FICHA OVERLAY ======
              Estrutura 1:1 com o legado (ficha-overlay.css):
              container .ficha-overlay (position:fixed, z-index:600, display:none
              no CSS → aberto via style display:flex), botão X .ficha-overlay-close
              como IRMÃO do scroller (não rola junto) e wrapper rolável
              .ficha-overlay__scroll. */}
          <div
            className="ficha-overlay"
            style={{ display: isFichaOverlayOpen ? 'flex' : 'none' }}
            aria-hidden={!isFichaOverlayOpen}
          >
            <button
              className="ficha-overlay-close"
              id="btnFecharFicha"
              aria-label="Fechar ficha"
              onClick={handleFecharFicha}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <div className="ficha-overlay__scroll" id="fichaOverlayScroll">
              <FichaFeature
                onStartWorkout={handleStartWorkout}
                onRequestEncerrar={handleRequestEncerrar}
                onWorkoutCompleted={() => setIsConclusaoOpen(true)}
              />
            </div>
          </div>

          {/* Modal de Treino Ativo removido do fluxo: no legado o treino em
              andamento é conduzido pela Ficha (btnStartWorkout → ENCERRAR TREINO
              → modalEncerrarTreino). O arquivo ActiveWorkoutModal.tsx permanece
              no projeto como scaffold não montado. */}

          {/* Modal: Conclusão de Treino (modais.html L1–37 + showConclusao L421–495) */}
          <ConclusaoModal open={isConclusaoOpen} onClose={handleConclusaoClose} />

          {/* Modal: Encerrar Treino (modais.html L364–374) */}
          <div
            className="modal-overlay"
            id="modalEncerrarTreino"
            style={{ display: isEncerrarOpen ? 'flex' : 'none' }}
            role="dialog"
            aria-modal="true"
            aria-hidden={!isEncerrarOpen}
          >
            <div className="modal-confirm">
              <div className="confirm-icon">⏹</div>
              <h3>Sair da Ficha?</h3>
              <p>
                O cronômetro será parado e você voltará para a tela Início. As séries
                marcadas serão mantidas para sua referência.
              </p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  id="btnEncerrarCancelar"
                  onClick={() => setIsEncerrarOpen(false)}
                >
                  CONTINUAR TREINO
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  id="btnEncerrarConfirmar"
                  onClick={() => void handleEncerrarConfirmar()}
                >
                  SIM, ENCERRAR
                </button>
              </div>
            </div>
          </div>

          {/* Modal: Share Card (modais.html L465–576) — acima dos demais */}
          <ShareModal />

          {/* Modais: Coleção + Maestria individual (modais.html L791–911) */}
          <ColecaoModals />

          {/* ====== BARRA DE NAVEGAÇÃO INFERIOR ====== */}
          <BottomNav
            activeSection={activeSection}
            onSelectSection={navigateSection}
          />
        </div>

        {/* Container de toasts (treino.html L1326 — herda animações do CSS legado) */}
        <div className="toast-container" id="toastContainer" />
      </div>
    </AuthProvider>
  );
}

export default App;
