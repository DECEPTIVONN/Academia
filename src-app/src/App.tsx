/**
 * App.tsx — Aplicação React Academia v4.0 com os componentes e visual 100% fiéis ao Vanilla CSS
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider } from '@/core/auth/auth-context';
import { DashboardFeature } from '@/features/dashboard/DashboardFeature';
import { TreinosFeature } from '@/features/workout/treinos/TreinosFeature';
import { FichaFeature } from '@/features/workout/FichaFeature';
import { ProgressoFeature } from '@/features/training/ProgressoFeature';
import { SocialFeature } from '@/features/social/SocialFeature';
import { ConclusaoModal } from '@/features/workout/ConclusaoModal';
import { ProfileFeature } from '@/features/profile/ProfileFeature';
import { applySavedTheme } from '@/features/settings/theme-colors';
import { BottomNav, type SectionType } from '@/components/BottomNav';
import { MobileTopBar } from '@/components/MobileTopBar';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { GlobalSearchOverlay } from '@/features/search/GlobalSearchOverlay';
import type { SearchItem } from '@/features/search/search-index';
import { LockScreen } from '@/features/lock/LockScreen';
import { useAppLock } from '@/features/lock/useAppLock';
import { useLockStore } from '@/features/lock/lock-store';
import { useTreinosStore } from '@/features/workout/treinos/treinos-store';
import { PREF_KEYS, readLS, writeLS } from '@/features/profile/profile-data';
import { useCrossBrowserFullscreen } from '@/lib/fullscreen';
import { useWorkoutStore } from '@/store/workout-store';
import { useTodayEntryStore } from '@/store/today-entry-store';
import { loadLocalData, getTodayTreino, selectSheetEntry } from '@/core/db/queries';
import { ShareModal } from '@/features/gamification/ShareModal';
import { useShareStore } from '@/features/gamification/share-store';
import { ColecaoModals } from '@/features/gamification/ColecaoModals';
import { useMaestriaUi } from '@/features/gamification/maestria-ui';
import { fadeIn, slideSwap, type SlideDirection } from '@/lib/animations';
import { showToast } from '@/lib/toast';
import type { SheetKey } from '@/core/db/schema';

/* Ordem canônica das seções (usada pelo slide direcional e pelo swipe) */
const SECTIONS_ORDER: SectionType[] = ['progresso', 'treinos', 'dashboard', 'social', 'loja'];

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

  /* v4.0.13-typography: reparo do raster stale do primeiro paint da seção.
     O primeiro paint de uma seção montada depois do boot (ex.: Progresso ao
     clicar na navbar) é rasterizado ~1–2 device px fora em alguns .p-card
     (backdrop-filter): borda inferior do .streak-card em y890–891 vs y888–889
     do legado, borda do .weekly-summary-card e o ink do h3 "Sua Semana" ~2 px
     acima — ~3,5 mil px de diff por tela. Rects/computed/styles são idênticos
     ao legado; só a rasterização diverge, e QUALQUER mudança real de estilo
     num ancestral do conteúdo (body/#root/main) reparo o raster — medido no
     CDP: setar -webkit-font-smoothing em qualquer UM desses elementos e
     restaurar em task seguinte zera as três regiões (0/780 e 0/4480). Toggle
     em duas tasks (set → 200ms → remove) mantém o valor final idêntico ao
     original (sem divergência de render em macOS). O legado nunca monta seção
     depois do boot (todas existem desde o início) e não sofre do problema. */
  const repairSectionRaster = useCallback(() => {
    window.setTimeout(() => {
      document.body.style.setProperty('-webkit-font-smoothing', 'auto');
      window.setTimeout(() => {
        document.body.style.removeProperty('-webkit-font-smoothing');
      }, 200);
    }, 450);
  }, []);

  /* nav.js L135-152 → v4.6.0-shell: transição DIRECIONAL (slide) no lugar do
     fadeSwap legado — sai p/ esquerda e a nova seção entra da direita (ou o
     espelho ao navegar "pra trás"), spring-ish no mobile e cúbica no desktop. */
  const navigateSection = useCallback(
    (sec: SectionType) => {
      if (sec === activeSection) {
        fadeIn(mainRef.current);
        return;
      }
      if (animatingRef.current) return;
      animatingRef.current = true;
      // Guarda cobre a animação inteira (saída 200–220ms + entrada 320–340ms)
      window.setTimeout(() => {
        animatingRef.current = false;
      }, 580);
      const from = SECTIONS_ORDER.indexOf(activeSection);
      const to = SECTIONS_ORDER.indexOf(sec);
      const direction: SlideDirection = to >= from ? 'forward' : 'backward';
      const strip = mainRef.current?.querySelector<HTMLElement>('.section-strip') ?? null;
      slideSwap(
        strip,
        () => {
          setActiveSection(sec);
          document.dispatchEvent(new CustomEvent('sectionchange', { detail: sec }));
          repairSectionRaster();
        },
        direction
      );
    },
    [activeSection, repairSectionRaster]
  );

  /* ===== v4.6.0-shell: casca adaptativa + busca global + lock ===== */

  const { isFullscreen, toggleFullscreen } = useCrossBrowserFullscreen();
  const locked = useLockStore((s) => s.locked);
  useAppLock();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  /* Sidebar HUD fixada expandida (pref academia_pref_sidebar_pinned) */
  const [sidebarPinned, setSidebarPinned] = useState(
    () => readLS(PREF_KEYS.sidebarPinned) === 'true'
  );

  const toggleSidebarPin = useCallback(() => {
    setSidebarPinned((prev) => {
      const next = !prev;
      writeLS(PREF_KEYS.sidebarPinned, String(next));
      return next;
    });
  }, []);

  /* Ctrl/Cmd+K abre/fecha a Busca Geral (não enquanto o app estiver travado) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!locked) setIsSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked]);

  /* ESC fecha a busca quando ela está aberta (guarda do overlay do Perfil) */
  useEffect(() => {
    if (!isSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSearchOpen]);

  /* Resultado escolhido na busca → seção, hub profundo ou seção Treinos */
  const handleSearchPick = useCallback(
    (item: SearchItem) => {
      setIsSearchOpen(false);

      /* Configuração/grupo do hub → abre o Perfil já na tela pedida
         (ProfileFeature escuta 'academia:profile-nav') */
      if (item.kind === 'config') {
        setIsPerfilClosing(false);
        setIsPerfilOverlayOpen(true);
        window.setTimeout(() => {
          document.dispatchEvent(
            new CustomEvent('academia:profile-nav', { detail: item.stack })
          );
        }, 0);
        return;
      }

      /* Para navegar fora do hub, fecha o Perfil SEM o "volta ao Dashboard"
         do closePerfilOverlay legado (o destino é outro) */
      if (isPerfilOverlayOpen) {
        setIsPerfilClosing(false);
        setIsPerfilOverlayOpen(false);
      }

      if (item.kind === 'secao') {
        if (item.section) navigateSection(item.section);
        return;
      }

      /* Exercício/Ficha → dirige o store persistente da seção Treinos
         (sobrevive ao unmount, como os módulos do legado) */
      const st = useTreinosStore.getState();
      if (item.kind === 'exercicio') {
        st.setMainTab('exercicios');
        st.setSubTab('exercicios-lista');
        st.setFilter('all');
        st.setSearch(item.exerciseName ?? '');
        navigateSection('treinos');
        return;
      }
      if (item.kind === 'ficha') {
        st.setMainTab('montar');
        if (item.sheetKey) {
          st.setDeckLetter(item.sheetKey);
          st.setDeckPage(['F', 'G', 'H', 'I', 'J'].includes(item.sheetKey) ? 2 : 1);
        }
        st.setDeckSearch('');
        navigateSection('treinos');
      }
    },
    [navigateSection, isPerfilOverlayOpen]
  );

  /* nav.js L207–298: swipe horizontal por threshold (20% da largura ou 150px)
     com as mesmas exclusões de alvo. Divergência aceita (CHANGELOG v4.0.6-phase4):
     sem arrasto contínuo da fita — apenas detecção de intenção + troca no fim. */
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let dir: 'h' | 'v' | null = null;

    const onStart = (e: TouchEvent) => {
      const t = e.target as HTMLElement | null;
      // target não-Element (ex.: document/window em eventos sintéticos) não tem closest
      if (!t || typeof t.closest !== 'function') return;
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
        const idx = SECTIONS_ORDER.indexOf(activeSection);
        if (diffX < 0 && idx < SECTIONS_ORDER.length - 1) navigateSection(SECTIONS_ORDER[idx + 1]);
        else if (diffX > 0 && idx > 0) navigateSection(SECTIONS_ORDER[idx - 1]);
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
        /* db.js L440-451 `setTodayTreino`: troca a ficha e recalcula `concluido`
           (só segue true se a nova ficha já foi concluída hoje). */
        await loaded.update((e) => selectSheetEntry(e, sheetKey));
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
      (perfil-overlay.js openPerfilOverlay L37–75 / closePerfilOverlay L78–114)
      v4.1.0: restaura preset OU hex personalizado (academia_theme='custom'). */
  useEffect(() => {
    applySavedTheme();
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

  /* ESC fecha o overlay do Perfil (perfil-overlay.js L125–130)
     v4.6.0-shell: cede à Busca Geral quando ela está aberta */
  useEffect(() => {
    if (!isPerfilOverlayOpen || isSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPerfilClosing) {
        e.preventDefault();
        closePerfilOverlay();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isPerfilOverlayOpen, isPerfilClosing, closePerfilOverlay, isSearchOpen]);

  return (
    <AuthProvider>
      {/* v4.0.13: text-white (antes text-[#e5e2e1]) — paridade com o `body{color:var(--text)}`
          do legado (#ffffff); o cinza derrubava a herança de cor de títulos e textos sem
          cor própria. Ver globals.css reset local. */}
      <div className="h-screen bg-[#0a0514] text-white relative overflow-x-hidden">
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

        <div className="relative z-10 flex flex-col h-full">
          {/* ====== TOP BAR MOBILE (v4.6.0-shell) ======
              < 1024px: avatar/busca/tela cheia (escondida no desktop via
              shell.css; no desktop quem aparece é a Sidebar HUD). */}
          <MobileTopBar
            onOpenProfile={() => setIsPerfilOverlayOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />

          {/* ====== SIDEBAR HUD DESKTOP (v4.6.0-shell) ======
              ≥ 1024px: 76px colapsada / 264px expandida (hover ou pin). */}
          <DesktopSidebar
            activeSection={activeSection}
            onSelectSection={navigateSection}
            onOpenProfile={() => setIsPerfilOverlayOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onLockApp={() => useLockStore.getState().lock()}
            pinned={sidebarPinned}
            onTogglePin={toggleSidebarPin}
          />

          {/* shell-body compensa a largura da Sidebar HUD no desktop
              (padding-left via shell.css) */}
          <div
            className={`shell-body flex-1 min-h-0 flex flex-col${
              sidebarPinned ? ' shell-body--pinned' : ''
            }`}
          >
          {/* Conteúdo Principal (Slide / Seção) — v4.0.13: altura definite
              (h-full → main flex → .section-viewport flex:1 min-h-0) para que
              .section-slide{height:100%} resolva como no legado
              (.treino-page display:flex + .section-viewport, 7-nav-icons.css
              L18–47) e o scroll aconteça DENTRO do slide.
              A classe `treino-page` é obrigatória: main.css declara
              `main{background-color:var(--background)}` (opaco #121212, que
              taparia o background dinâmico) e no legado a regra
              `html, body, .treino-page{background:transparent !important}`
              de bg-dinamico.css anula isso — sem a classe, o React ficava com
              o <main> opaco e o fundo de diamantes sumia atrás dele. */}
          <main className="treino-page flex-1 min-h-0 flex flex-col" ref={mainRef}>
            <div className="section-viewport">
            {/* .section-strip 1:1 com o legado (7-nav-icons.css L27–35 e
                treino.html): wrapper flex-row + will-change:transform —
                paridade de DOM/estrutura de pintura. Sozinho ele NÃO corrige
                o paint offset de 1–2 device px dos .p-card (medido: JSX strip
                desde a renderização inicial continuava com os bands); quem
                zera as regiões é o repairSectionRaster acima (v4.0.13). */}
            <div className="section-strip">
            {activeSection === 'dashboard' && (
              <DashboardFeature
                onNavigate={(sec) => navigateSection(sec as SectionType)}
                onOpenFicha={handleOpenFicha}
                onOpenPerfil={() => setIsPerfilOverlayOpen(true)}
              />
            )}

            {activeSection === 'treinos' && (
              /* .section-slide wrapper 1:1 com o legado (treino.html: cada
                 slide envolve .treino-container > .main-section) — ativa a
                 regra .section-slide .treino-container{padding-bottom:260px}
                 (7-nav-icons.css L56) e o scroll interno com scrollbar 10px. */
              <div className="section-slide" data-section="treinos">
                <TreinosFeature />
              </div>
            )}

            {activeSection === 'progresso' && (
              <div className="section-slide" data-section="progresso">
                <ProgressoFeature />
              </div>
            )}

            {activeSection === 'social' && (
              /* Aba SOCIAL — placeholder de Ligas.html (v4.0.14-social).
                 SocialFeature monta seu próprio .treino-container.soc-root
                 + modais; o scroll acontece dentro do .section-slide. */
              <div className="section-slide" data-section="social">
                <SocialFeature />
              </div>
            )}

            {activeSection === 'loja' && (
              /* Placeholder .section-coming-soon — estrutura 1:1 com
                 treino.html L197-207 (LOJA) */
              <div className="section-slide" data-section="loja">
                <div className="treino-container">
                  <div id="section-loja" className="main-section" role="tabpanel">
                    <div className="section-coming-soon">
                      <div className="cs-icon">🛒</div>
                      <h2 className="cs-title">LOJA</h2>
                      <p className="cs-sub">
                        Em breve! Itens, skins e upgrades exclusivos para sua jornada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
            </div>
          </main>
          </div>

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

          {/* ====== BUSCA GERAL UNIFICADA (v4.6.0-shell) ======
              Ctrl/Cmd+K ou botões de busca; ESC fecha; ↑/↓/Enter navegam.
              Montada apenas quando aberta (estado limpo a cada abertura). */}
          {isSearchOpen && (
            <GlobalSearchOverlay
              open={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
              onPick={handleSearchPick}
            />
          )}

          {/* ====== TELA DE BLOQUEIO (v4.6.0-shell) ======
              z-index 1200 — acima de todos os overlays/modais. */}
          <LockScreen />
        </div>

        {/* Container de toasts (treino.html L1326 — herda animações do CSS legado) */}
        <div className="toast-container" id="toastContainer" />
      </div>
    </AuthProvider>
  );
}

export default App;
