/**
 * NewsOverlay.tsx — Central de Notícias (#news-overlay)
 *
 * Port 1:1 de treino.html: DOM/CSS L303-427 + comportamento L429-599.
 * Abas (notícias/atualizacoes/guias), "MOSTRAR MAIS", detail views com
 * paginação (btn-prev/btn-next, fade de 200ms via updateDetailContent L462-500)
 * e fechamento = closeNewsOverlay L515-527.
 *
 * Divergência consciente: closeNewsOverlay chama window._transitionTo('dashboard')
 * no legado — aqui basta fechar, porque o overlay só abre a partir do Dashboard
 * (mesmo racional do MissionsOverlay).
 * Rodapé (v4.0.10): o legado injeta o footer do site nos 3 contêineres ao abrir
 * (openNewsOverlay L809-815, HTML de componentes/footer.js) — aqui o mesmo HTML
 * é renderizado estaticamente (efeito equivalente, pois o overlay fica oculto
 * quando fechado).
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './news-overlay.css';

/* Portal para document.body: o .section-strip tem `will-change: transform` e
   passa a ser o containing block de `position: fixed` (mesma causa-raiz do
   MissionsOverlay/modais da Progresso, v4.7.3/v4.8.1) — sem o portal o overlay
   inteiro (inset:0) saía da viewport. */
const toBody = (node: React.ReactNode) => createPortal(node, document.body);

interface NewsOverlayProps {
  open: boolean;
  onClose: () => void;
}

type NewsTab = 'noticias' | 'atualizacoes' | 'guias';
type DetailKind = 'news' | 'update';

interface NewsItem {
  title: string;
  date: string;
  tag: string;
  icon: string;
  content: string;
}

/* FOOTER_HTML — componentes/footer.js L3-42 (injetado no legado por
   openNewsOverlay em treino.html L809-815). Estático aqui; os seletores
   #news-footer-container/.detail-footer-wrap vêm de news-overlay.css. */
const FOOTER_HTML = `
        <footer>
            <div class="footer-content">
                <div class="footer-social-section">
                    <h3 class="social-title">Fique Conectado</h3>
                    <div class="social-icons">
                        <a href="https://www.youtube.com" class="social-icon" title="YouTube" aria-label="YouTube" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 0, 0, 0.5)); border-color: rgba(139, 92, 246, 0.5);">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                        </a>
                        <a href="https://www.instagram.com" class="social-icon" title="Instagram" aria-label="Instagram" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 0, 0, 0.5)); border-color: rgba(139, 92, 246, 0.5);">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                        </a>
                        <a href="https://twitter.com" class="social-icon" title="X (Twitter)" aria-label="X" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 0, 0, 0.5)); border-color: rgba(139, 92, 246, 0.5);">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </a>
                        <a href="https://www.facebook.com" class="social-icon" title="Facebook" aria-label="Facebook" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 0, 0, 0.5)); border-color: rgba(139, 92, 246, 0.5);">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        <a href="https://www.tiktok.com" class="social-icon" title="TikTok" aria-label="TikTok" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 0, 0, 0.5)); border-color: rgba(139, 92, 246, 0.5);">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                            </svg>
                        </a>
                    </div>
                </div>
                <p class="copyright">
                    © 'TRONUS CO., LTD. ALL RIGHTS RESERVED.<br>
                    Todos os conteúdos relacionados são marcas registradas.
                </p>
            </div>
        </footer>
    `;

/* newsData / updatesData — treino.html L431-445 */
const newsData: NewsItem[] = [
  {
    title: 'NOVA TEMPORADA: ENTERRADAS ENCLAUSURANTES',
    date: '4 DE MAIO DE 2026',
    tag: 'NOTÍCIAS',
    icon: 'newspaper',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Nesta temporada, a corte do Rei se transformou na quadra do Lançador, com um novo aliado pronto para avançar e causar o máximo de dano à torre! Veja todas as informações:</p><ul class="space-y-2 mt-4 font-body-md text-on-surface-variant"><li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span>Novos heróis: Príncipe das Trevas e Lançador</li><li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span>Evento do álbum</li></ul>',
  },
  {
    title: 'NOVO CAMPEÃO: O GUARDIÃO ETERNO',
    date: '12 DE JUNHO DE 2026',
    tag: 'NOTÍCIAS',
    icon: 'military_tech',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Um novo campeão chega à arena. O Guardião Eterno traz habilidades defensivas únicas para proteger suas torres.</p>',
  },
  {
    title: 'REFORMULAÇÃO DO CAMINHO DAS LENDAS',
    date: '28 DE MAIO DE 2026',
    tag: 'NOTÍCIAS',
    icon: 'route',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">O Caminho das Lendas foi atualizado com novas recompensas e um sistema de progressão melhorado para a próxima temporada.</p>',
  },
  {
    title: 'EVENTO DE VERÃO: ARENA TROPICAL',
    date: '15 DE MAIO DE 2026',
    tag: 'NOTÍCIAS',
    icon: 'beach_access',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Prepare-se para o calor! O evento Arena Tropical trará modos de jogo por tempo limitado e cosméticos exclusivos.</p>',
  },
];

const updatesData: NewsItem[] = [
  {
    title: 'Versão 2.4.0',
    date: '15 DE MAIO DE 2026',
    tag: 'ATUALIZAÇÃO',
    icon: 'system_update_alt',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Esta atualização traz diversas melhorias de performance e correções de bugs, focando na estabilidade geral do jogo e na experiência do usuário.</p><ul class="space-y-2 mt-4 font-body-md text-on-surface-variant"><li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span>Otimização no carregamento de texturas, reduzindo o tempo de entrada em partidas em 15%.</li></ul>',
  },
  {
    title: 'Versão 2.3.5',
    date: '20 DE ABRIL DE 2026',
    tag: 'ATUALIZAÇÃO',
    icon: 'security',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Novos protocolos de segurança implementados para proteger as contas dos jogadores e evitar trapaças.</p>',
  },
  {
    title: 'Balanceamento de Maio',
    date: '5 DE MAIO DE 2026',
    tag: 'ATUALIZAÇÃO',
    icon: 'balance',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Ajustes nas estatísticas de várias cartas para melhorar o equilíbrio do jogo e oferecer novas opções de estratégia.</p>',
  },
  {
    title: 'Notas da Versão 2.3.0',
    date: '10 DE MARÇO DE 2026',
    tag: 'ATUALIZAÇÃO',
    icon: 'build',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Grandes mudanças estruturais no motor do jogo e novas funcionalidades de interface para aprimorar a usabilidade.</p>',
  },
  {
    title: 'NOTAS DA ATUALIZAÇÃO - VERSÃO 2.2.0',
    date: '10 DE ABRIL DE 2026',
    tag: 'ATUALIZAÇÃO',
    icon: 'article',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Adicionamos o novo modo de torneio e reformulamos a interface do clã.</p>',
  },
  {
    title: 'NOTAS DA ATUALIZAÇÃO - VERSÃO 2.1.5',
    date: '22 DE MARÇO DE 2026',
    tag: 'ATUALIZAÇÃO',
    icon: 'article',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Pequenas correções de interface e otimizações de bateria para dispositivos móveis.</p>',
  },
  {
    title: 'AJUSTES DE EQUILÍBRIO - FEVEREIRO',
    date: '05 DE FEVEREIRO DE 2026',
    tag: 'ATUALIZAÇÃO',
    icon: 'balance',
    content:
      '<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">Mudanças cruciais no meta. Nerf no Cavaleiro e Buff na Mosqueteira.</p>',
  },
];

const dataMap: Record<DetailKind, NewsItem[]> = {
  news: newsData,
  update: updatesData,
};

/* Cartões da lista (treino.html L418-560): o 1º card de notícias traz o
   rótulo "Notícias" no placeholder e o overlay de borda — os demais não. */
const newsCards = [
  { icon: 'description', title: 'NOVA TEMPORADA: ENTERRADAS ENCLAUSURANTES', date: '4 DE MAIO DE 2026' },
  { icon: 'military_tech', title: 'NOVO CAMPEÃO: O GUARDIÃO ETERNO', date: '12 DE JUNHO DE 2026' },
  { icon: 'route', title: 'REFORMULAÇÃO DO CAMINHO DAS LENDAS', date: '28 DE MAIO DE 2026' },
  { icon: 'beach_access', title: 'EVENTO DE VERÃO: ARENA TROPICAL', date: '15 DE MAIO DE 2026' },
];

/* Nos cartões de atualização o rótulo superior alterna entre título e data
   (cards 0/1/3 usam o título, os demais a data) — texto literal do legado. */
const updateCards = [
  { icon: 'system_update_alt', label: 'Versão 2.4.0', title: 'Otimização de performance e correção de bugs' },
  { icon: 'security', label: 'Versão 2.3.5', title: 'Novos protocolos de segurança implementados' },
  { icon: 'balance', label: '5 DE MAIO DE 2026', title: 'Balanceamento de Maio' },
  { icon: 'build', label: 'Versão 2.3.0', title: 'Notas da Versão 2.3.0' },
  { icon: 'article', label: '10 DE ABRIL DE 2026', title: 'NOTAS DA ATUALIZAÇÃO - VERSÃO 2.2.0' },
  { icon: 'article', label: '22 DE MARÇO DE 2026', title: 'NOTAS DA ATUALIZAÇÃO - VERSÃO 2.1.5' },
  { icon: 'balance', label: '05 DE FEVEREIRO DE 2026', title: 'AJUSTES DE EQUILÍBRIO - FEVEREIRO' },
];

const TABS: { id: NewsTab; label: string; shape: React.ReactNode }[] = [
  {
    id: 'noticias',
    label: 'NOTÍCIAS',
    shape: (
      <>
        <rect height="18" rx="3" width="18" x="3" y="3" />
        <line x1="9" x2="15" y1="9" y2="9" />
        <line x1="9" x2="15" y1="13" y2="13" />
        <line x1="9" x2="12" y1="17" y2="17" />
      </>
    ),
  },
  {
    id: 'atualizacoes',
    label: 'ATUALIZAÇÕES',
    shape: (
      <>
        <path d="M6.5 6.5h11M6.5 17.5h11M12 6.5v11" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="20" cy="12" r="1.5" />
      </>
    ),
  },
  {
    id: 'guias',
    label: 'GUIAS',
    shape: (
      <>
        <line x1="8" x2="21" y1="6" y2="6" />
        <line x1="8" x2="21" y1="12" y2="12" />
        <line x1="8" x2="21" y1="18" y2="18" />
        <line x1="3" x2="3.01" y1="6" y2="6" />
        <line x1="3" x2="3.01" y1="12" y2="12" />
        <line x1="3" x2="3.01" y1="18" y2="18" />
      </>
    ),
  },
];

const BTN_NAV =
  'px-4 py-2 bg-gradient-to-b from-white/90 to-white/70 text-black font-label-caps text-[12px] uppercase rounded border border-black/20 shadow-md hover:bg-white transition-colors flex items-center gap-2';

function NewsCard({ index, isFirst, onOpen }: { index: number; isFirst: boolean; onOpen: () => void }) {
  const card = newsCards[index];
  return (
    <div
      className="relative rounded-xl overflow-hidden glass-panel group cursor-pointer border border-card-border shadow-2xl transition-all hover:border-primary/50"
      onClick={onOpen}
    >
      <div className="aspect-video w-full relative premium-placeholder flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 relative z-10 float-animation">
          <span className="material-symbols-outlined text-primary/60 text-[120px]" style={{ fontVariationSettings: '"FILL" 1' }}>
            {card.icon}
          </span>
          {isFirst && <p className="font-headline-md text-primary/60 text-xs tracking-widest uppercase">Notícias</p>}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-deep-void via-transparent to-transparent opacity-60" />
      </div>
      <div className="p-6 relative bg-gradient-to-b from-transparent to-[#0a0514]">
        <p className="font-label-caps text-neon-purple-glow text-xs mb-2">NOTÍCIAS</p>
        <h1 className="font-headline-md text-headline-md text-white mb-4 leading-tight">{card.title}</h1>
        <p className="font-label-caps text-on-surface-variant/70 text-[10px]">{card.date}</p>
      </div>
      {isFirst && <div className="absolute inset-0 border border-primary/10 rounded-xl pointer-events-none" />}
    </div>
  );
}

function UpdateCard({ index, onOpen }: { index: number; onOpen: () => void }) {
  const card = updateCards[index];
  return (
    <div
      className="relative rounded-xl overflow-hidden glass-panel group cursor-pointer border border-card-border shadow-lg transition-all hover:border-primary/30"
      onClick={onOpen}
    >
      <div className="p-6 flex items-center gap-4 premium-placeholder overflow-hidden">
        <div className="w-32 h-32 flex-none flex items-center justify-center bg-primary/10 rounded-lg">
          <span className="material-symbols-outlined text-primary text-6xl">{card.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-label-caps text-neon-purple-glow text-[10px] mb-1 uppercase tracking-tighter">{card.label}</p>
          <h2 className="font-headline-md text-white text-lg truncate">{card.title}</h2>
        </div>
      </div>
    </div>
  );
}

interface DetailPaneProps {
  kind: DetailKind;
  active: boolean;
  fading: boolean;
  index: number;
  onBack: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function DetailPane({ kind, active, fading, index, onBack, onClose, onPrev, onNext }: DetailPaneProps) {
  const data = dataMap[kind];
  const item = data[index];
  const isNews = kind === 'news';
  const atStart = index === 0;
  const atEnd = index === data.length - 1;

  return (
    <div className={active ? 'detail-view active' : 'detail-view'} id={`${kind}-detail-view`}>
      <header className="fixed top-0 left-0 w-full z-[110] bg-[#131313]/90 backdrop-blur-md h-16 flex items-center border-b border-outline-variant/30">
        <div className="flex items-center gap-2 justify-between w-full max-w-lg mx-auto px-2">
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 text-primary hover:bg-white/10 rounded-full transition-colors"
            onClick={onBack}
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="w-[1px] h-6 bg-white/20" />
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center bg-red-500/20 rounded-lg hover:bg-red-500 transition-colors group text-white"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
      </header>

      <main className="pt-24 flex flex-col min-h-screen arena-bg">
        <div className="max-w-2xl mx-auto w-full px-2 flex-1 flex flex-col">
          <div
            className="glass-card rounded-xl overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-deep-void/60 flex-grow"
            style={{
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              opacity: fading ? 0 : 1,
              transform: fading ? 'translateY(10px)' : 'translateY(0px)',
            }}
          >
            <div className="relative w-full h-[240px] md:h-[400px] shrink-0 overflow-hidden bg-[#0b0b10] flex items-center justify-center">
                <span
                  className={`material-symbols-outlined text-[80px] text-primary/40 animate-bounce ${isNews ? 'news-icon' : 'update-icon'}`}
                >
                  {item.icon}
                </span>
              <div className="absolute inset-0 bg-gradient-to-t from-deep-void via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span
                  className={
                    isNews
                      ? 'inline-block bg-primary text-on-primary font-label-caps text-[10px] px-2 py-1 rounded mb-2 news-tag'
                      : 'inline-block bg-[#8b5cf6] text-white font-label-caps text-[10px] px-2 py-1 rounded mb-2 update-tag'
                  }
                >
                  {item.tag}
                </span>
                <h1
                  className={`font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-glow text-white uppercase tracking-tight ${
                    isNews ? 'news-title' : 'update-title'
                  }`}
                >
                  {item.title}
                </h1>
                <p
                  className={`font-label-caps text-label-caps text-primary-fixed-dim/80 ${isNews ? 'news-date' : 'update-date'}`}
                >
                  {item.date}
                </p>
              </div>
            </div>

            <div className="px-8 md:px-16 py-10 space-y-12 flex-grow flex flex-col">
              <section
                className={`space-y-4 flex-grow ${isNews ? 'news-content' : 'update-content'}`}
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
              <hr className="border-outline-variant/20 border-t-2 border-tertiary-fixed-dim/50" />
              <div className="pt-8 border-t-[6px] border-tertiary-fixed-dim/80 flex justify-center gap-4">
                <button
                  type="button"
                  className={`${BTN_NAV} btn-prev${atStart ? ' opacity-30 pointer-events-none' : ''}`}
                  onClick={onPrev}
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span> Mais Recentes
                </button>
                <button
                  type="button"
                  className={`${BTN_NAV} btn-next${atEnd ? ' opacity-30 pointer-events-none' : ''}`}
                  onClick={onNext}
                >
                  Mais Antigos <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function NewsOverlay({ open, onClose }: NewsOverlayProps) {
  const [tab, setTab] = useState<NewsTab>('noticias');
  const [showAllNews, setShowAllNews] = useState(false);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [detail, setDetail] = useState<{ kind: DetailKind; index: number } | null>(null);
  const [fading, setFading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const navTimerRef = useRef<number | null>(null);
  /* Legado incrementa currentIndices na hora do clique (L590-596) e só troca o
     DOM depois do fade de 200ms — dois cliques rápidos avançam 2 posições. */
  const pendingRef = useRef<number | null>(null);

  /* closeNewsOverlay (L518-520): reseta as detail views ao fechar.
     Padrão "adjusting state when props change" (setState em render). */
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setDetail(null);
      setFading(false);
    } else {
      setShowAllNews(false);
      setShowAllUpdates(false);
      setTab('noticias');
    }
  }

  /* Fechando com um fade em voo: cancela o timer para o setTimeout não
     setar um detail tardio (o legado só atualiza o DOM oculto). */
  useEffect(() => {
    if (open) return undefined;
    if (navTimerRef.current) {
      window.clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    pendingRef.current = null;
    return undefined;
  }, [open]);

  /* openNewsOverlay (L505): trava/destrava o body */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(
    () => () => {
      if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
    },
    []
  );

  const closeOverlay = () => {
    setDetail(null);
    setFading(false);
    pendingRef.current = null;
    onClose();
  };

  /* openDetailView (L449-455) */
  const openDetail = (kind: DetailKind, index: number) => {
    setDetail({ kind, index });
    setFading(false);
    pendingRef.current = null;
    if (overlayRef.current) overlayRef.current.scrollTop = 0;
  };

  /* closeDetailView (L457-460) */
  const closeDetail = () => {
    setDetail(null);
    pendingRef.current = null;
  };

  /* btn-prev / btn-next (L583-598) → updateDetailContent(..., animate=true) */
  const step = (dir: -1 | 1) => {
    if (!detail) return;
    const arr = dataMap[detail.kind];
    const base = pendingRef.current ?? detail.index;
    const nextIndex = base + dir;
    if (nextIndex < 0 || nextIndex > arr.length - 1) return;
    pendingRef.current = nextIndex;
    setFading(true);
    if (navTimerRef.current) window.clearTimeout(navTimerRef.current);
    navTimerRef.current = window.setTimeout(() => {
      setDetail({ kind: detail.kind, index: nextIndex });
      pendingRef.current = null;
      setFading(false);
      navTimerRef.current = null;
    }, 200);
  };

  return toBody(
    <div
      id="news-overlay"
      className="news-overlay"
      ref={overlayRef}
      style={{
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.25s ease, visibility 0.25s ease',
      }}
    >
      {/* Main List View */}
      <div
        className={detail ? 'w-full relative z-10 flex flex-col hidden-view' : 'w-full relative z-10 flex flex-col'}
        id="news-main-view"
      >
        {/* Top Navigation Header */}
        <header className="fixed top-0 left-0 w-full z-50 bg-[#131313]/90 backdrop-blur-md px-4">
          <div className="flex items-center justify-center h-20 relative max-w-lg mx-auto">
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 flex-grow">
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`relative flex-1 flex flex-col items-center justify-center nav-tab cursor-pointer transition-opacity ${
                        active ? 'opacity-100' : 'hover:opacity-100 opacity-40'
                      }`}
                      data-target={t.id}
                      onClick={() => setTab(t.id)}
                    >
                      <div
                        className={`rounded-2xl px-6 py-2 flex flex-col items-center justify-center relative mb-2 tab-bg transition-all${
                          active ? ' bg-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.5)]' : ''
                        }`}
                      >
                        <svg
                          className={`text-white tab-icon${active ? ' drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : ''}`}
                          fill="none"
                          height={24}
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                          width={24}
                        >
                          {t.shape}
                        </svg>
                        <span
                          className={`font-['Rajdhani'] text-[11px] tracking-wider text-white mt-1 tab-text ${
                            active ? 'font-bold' : 'font-medium'
                          }`}
                        >
                          {t.label}
                        </span>
                        <div
                          className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] tab-arrow ${
                            active ? 'border-t-[#8b5cf6]' : 'hidden border-t-transparent'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 pl-2 border-l border-white/20 h-10 ml-2">
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center bg-red-500/20 rounded-lg hover:bg-red-500 transition-colors group"
                  aria-label="Fechar notícias"
                  onClick={closeOverlay}
                >
                  <svg
                    className="text-white"
                    fill="none"
                    height={18}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    width={18}
                  >
                    <line x1="18" x2="6" y1="6" y2="18" />
                    <line x1="6" x2="18" y1="6" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="pt-28 relative arena-bg">
          <div className="max-w-lg mx-auto w-full px-4">
            {/* Noticias Section */}
                        <section className={`tab-content space-y-6${tab === 'noticias' ? ' active' : ''}`} id="noticias">
              {newsCards.map((c, i) => {
                if (i > 2 && !showAllNews) return null;
                return <NewsCard key={i} index={i} isFirst={i === 0} onOpen={() => openDetail('news', i)} />;
              })}
              {!showAllNews && (
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    className="btn-show-more px-12 py-3 rounded-full bg-surface-container-highest/80 backdrop-blur-md font-label-caps text-white tracking-widest hover:bg-primary hover:text-deep-void transition-all duration-300 active:scale-95 shadow-xl"
                    onClick={() => setShowAllNews(true)}
                  >
                    MOSTRAR MAIS
                  </button>
                </div>
              )}
            </section>

            {/* Atualizacoes Section */}
            <section className={`tab-content space-y-6${tab === 'atualizacoes' ? ' active' : ''}`} id="atualizacoes">
              {updateCards.map((c, i) => {
                if (i > 4 && !showAllUpdates) return null;
                return <UpdateCard key={c.title} index={i} onOpen={() => openDetail('update', i)} />;
              })}
              {!showAllUpdates && (
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    className="btn-show-more px-12 py-3 rounded-full bg-surface-container-highest/80 backdrop-blur-md font-label-caps text-white tracking-widest hover:bg-primary hover:text-deep-void transition-all duration-300 active:scale-95 shadow-xl"
                    onClick={() => setShowAllUpdates(true)}
                  >
                    MOSTRAR MAIS
                  </button>
                </div>
              )}
            </section>

            {/* Guias Section */}
            <section className={`tab-content mb-4 text-center py-20${tab === 'guias' ? ' active' : ''}`} id="guias">
              <span className="material-symbols-outlined text-primary/40 text-6xl mb-4">menu_book</span>
              <h2 className="font-headline-md text-white/60 text-xl">Guias em breve</h2>
            </section>
          </div>
        </main>

        {/* Footer */}
        <div id="news-footer-container" dangerouslySetInnerHTML={{ __html: FOOTER_HTML }} />
      </div>

      {/* Detail Views */}
      <DetailPane
        kind="news"
        active={detail?.kind === 'news'}
        fading={fading}
        index={detail?.kind === 'news' ? detail.index : 0}
        onBack={closeDetail}
        onClose={closeOverlay}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
      />
      <DetailPane
        kind="update"
        active={detail?.kind === 'update'}
        fading={fading}
        index={detail?.kind === 'update' ? detail.index : 0}
        onBack={closeDetail}
        onClose={closeOverlay}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
      />
    </div>
  );
}
