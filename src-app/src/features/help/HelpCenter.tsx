/**
 * HelpCenter.tsx — Ajuda e Tutoriais (v4.66.0)
 *
 * FAQ do app escrita a partir das diretrizes (DESIGN.md/README.md): como
 * montar a ficha, treinar no modo foco, entender o progresso, usar o Social
 * (ranking global + amigos), funcionar offline e cuidar da conta.
 *
 * v4.74.0 — a tela tem interface própria (`HelpOverlay`), fora de Configurações.
 */

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Cloud,
  Dumbbell,
  HelpCircle,
  LayoutGrid,
  LineChart,
  Trophy,
  Users,
  WifiOff,
} from 'lucide-react';
import './help.css';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqGroup {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FaqItem[];
}

const GROUPS: FaqGroup[] = [
  {
    id: 'comecando',
    title: 'Começando',
    icon: <HelpCircle size={16} />,
    items: [
      {
        q: 'Como começo a usar o app?',
        a: 'No primeiro acesso você escolhe um nome de usuário e preenche o formulário pós-login (nascimento, sexo, altura e peso). Esses dados viram o seu Perfil de Saúde e podem ser ajustados depois: peso e altura são editáveis a qualquer momento e também acompanham as métricas corporais da aba Progresso.',
      },
      {
        q: 'Preciso criar uma ficha antes de treinar?',
        a: 'Sim. Em Treino → Minha Ficha você monta a ficha do dia (de 1 a 8 exercícios por ficha) e o app sugere a próxima ficha automaticamente com base no último treino concluído.',
      },
      {
        q: 'Como o app calcula XP e nível?',
        a: 'Cada treino concluído vale 10 XP. O nível é o XP total dividido por 100, mais um. Não existe pontuação paralela: tudo no app usa esse mesmo XP.',
      },
    ],
  },
  {
    id: 'ficha',
    title: 'Minha Ficha e a coleção',
    icon: <LayoutGrid size={16} />,
    items: [
      {
        q: 'Onde encontro os exercícios para montar a ficha?',
        a: 'Em Minha Ficha → Minha coleção. A coleção tem dois modos de exibição (lista e grade) e o modo escolhido fica salvo nas Preferências do App.',
      },
      {
        q: 'Por que o exercício entrou em outra posição do deck?',
        a: 'O deck tem 8 espaços fixos. Os exercícios que você já usa ocupam o espaço correspondente ao número deles, então um novo exercício entra apenas nos espaços livres — nunca toma o lugar de outro.',
      },
      {
        q: 'Como funciona o modo foco?',
        a: 'No modo foco, marcar a série 2 preenche automaticamente a série 1, e marcar a série 3 preenche as anteriores. Ao concluir todas as séries, o app passa para o próximo exercício da ficha; o primeiro não mostra "anterior" e o último não mostra "próximo".',
      },
      {
        q: 'Os descansos entre séries são contados?',
        a: 'Sim. O cronômetro de descanso do modo foco usa o tempo configurado nas Preferências (inclusive o som escolhido para o fim do descanso).',
      },
    ],
  },
  {
    id: 'progresso',
    title: 'Progresso e métricas',
    icon: <LineChart size={16} />,
    items: [
      {
        q: 'O que a aba Progresso mostra?',
        a: 'Gráficos de treino, calendário, histórico, ofensiva (dias consecutivos) e as métricas corporais. As métricas de peso e altura atualizam o Perfil de Saúde automaticamente.',
      },
      {
        q: 'O que é a ofensiva?',
        a: 'São os dias seguidos com treino concluído. Quem treinou ontem e hoje mantém a sequência; um dia sem treino zera a contagem.',
      },
      {
        q: 'O que é o Radar Fit?',
        a: 'É o resumo visual do seu equilíbrio de treino por grupo muscular, disponível na aba Progresso e no compartilhamento de treino concluído.',
      },
    ],
  },
  {
    id: 'social',
    title: 'Social, ranking e amigos',
    icon: <Trophy size={16} />,
    items: [
      {
        q: 'Como funciona o ranking global?',
        a: 'O ranking global usa a mesma temporada da liga mensal: começa às 06:00 do dia 1º e termina às 21:00 do último dia do mês. A pontuação é o XP dos treinos concluídos no mês, publicado pela sua conta — não há jogadores ou pontuações geradas pelo app.',
      },
      {
        q: 'Como adiciono amigos?',
        a: 'Na aba Social → Amigos você pode mostrar seu QR Code, escanear o de outra pessoa ou buscar pelo @username. O convite vai para a nuvem e a amizade só vale depois que a outra pessoa aceita em "Convites recebidos".',
      },
      {
        q: 'E se eu estiver offline?',
        a: 'Amigos adicionados por QR/link continuam visíveis no aparelho, mas o ranking global e os convites dependem do servidor. O app avisa quando está sem conexão e volta a sincronizar automaticamente.',
      },
    ],
  },
  {
    id: 'nuvem',
    title: 'Nuvem, backup e offline',
    icon: <Cloud size={16} />,
    items: [
      {
        q: 'Meus dados ficam só no celular?',
        a: 'O app funciona local-first: tudo é gravado no aparelho (IndexedDB) e continua disponível offline. Ao entrar na conta, os dados também são sincronizados com a nuvem para os outros aparelhos.',
      },
      {
        q: 'Como faço backup?',
        a: 'Configurações → Conta → Exportar Backup gera um arquivo JSON com exercícios, fichas, histórico e personalização. Restaurar substitui todos os dados locais pelos do arquivo.',
      },
      {
        q: 'Como autorizo o login em outro aparelho?',
        a: 'Na tela de login, o dispositivo novo mostra um QR Code. No aparelho já conectado, abra Configurações → Segurança → Autorizar Outro Aparelho e informe o código (ou leia o QR). A sessão é transferida sem senha.',
      },
    ],
  },
  {
    id: 'avisos',
    title: 'Notificações e lembretes',
    icon: <Dumbbell size={16} />,
    items: [
      {
        q: 'Quais avisos o app envia?',
        a: 'Três tipos: uma frase motivacional por dia, o lembrete de treino no horário que você escolher (só se ainda não treinou no dia) e o aviso de fim de temporada do ranking, pouco antes do fechamento.',
      },
      {
        q: 'Por que não recebo nada?',
        a: 'Os avisos dependem da permissão do navegador/PWA e do mestre de Notificações ligado em Configurações. Com o app totalmente fechado, é preciso suporte a push do sistema — com o app aberto ou em segundo plano o aviso aparece normalmente.',
      },
    ],
  },
  {
    id: 'privacidade',
    title: 'Privacidade e segurança',
    icon: <Users size={16} />,
    items: [
      {
        q: 'Quem vê meus dados de treino?',
        a: 'Somente você. O que sobe para a nuvem é o resumo público da conta: nome, nível, ofensiva e XP do mês. Histórico, fichas e métricas corporais ficam no seu aparelho.',
      },
      {
        q: 'Como protejo o app?',
        a: 'Em Configurações → Segurança e Acesso você define PIN, biometria, bloqueio automático por inatividade e a imagem da tela de bloqueio.',
      },
    ],
  },
  {
    id: 'offline',
    title: 'Instalar e usar sem internet',
    icon: <WifiOff size={16} />,
    items: [
      {
        q: 'Como instalo o app?',
        a: 'Configurações → Acessibilidade, Exibição e PWA → Instalar Aplicativo. No Android, o Chrome oferece "Adicionar à tela inicial"; no iOS, use Compartilhar → Adicionar à Tela de Início.',
      },
      {
        q: 'O que funciona completamente offline?',
        a: 'Treino, fichas, histórico, progresso, músicas já carregadas e configurações. Ficam pendentes de conexão: ranking global, convites de amizade e sincronização entre aparelhos.',
      },
    ],
  },
];

function Accordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`help-item${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="help-item__question"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{item.q}</span>
        <ChevronDown size={14} className="help-item__chev" aria-hidden="true" />
      </button>
      <div className="help-item__answer-wrap" aria-hidden={!open}>
        <p className="help-item__answer">{item.a}</p>
      </div>
    </div>
  );
}

export function HelpCenter() {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return GROUPS;
    return GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term),
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <div className="help-root">
      <section className="set-card help-intro">
        <div className="set-card__head">
          <div>
            <div className="set-card__eyebrow">CENTRAL DE AJUDA</div>
            <h3 className="set-card__title">Como o EVO FIT funciona</h3>
            <p className="set-card__desc">
              Perguntas frequentes sobre ficha, treino, progresso, ranking e conta. Busque por uma
              palavra para filtrar.
            </p>
          </div>
        </div>
        <input
          type="search"
          className="set-input help-search"
          placeholder="Buscar na ajuda (ex.: offline, ranking, foco)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Buscar na ajuda"
        />
      </section>

      {groups.length === 0 && (
        <p className="help-empty">Nenhuma resposta encontrada para “{query.trim()}”.</p>
      )}

      {groups.map((group) => (
        <section className="set-card help-group" key={group.id} id={`help-group-${group.id}`}>
          <div className="help-group__head">
            <span className="help-group__icon" aria-hidden="true">
              {group.icon}
            </span>
            <h3 className="help-group__title">{group.title}</h3>
          </div>
          <div className="help-list">
            {group.items.map((item) => (
              <Accordion key={item.q} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default HelpCenter;
