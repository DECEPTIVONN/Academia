import { DB_KEY, today, todayLabel, formatCarga, formatSeconds, getTodayTreino, getExById, getStreak, showToast, fadeIn, fadeSwap } from './db.js';
import { openModal } from './secao-ficha.js';
import { currentRadarMode } from './secao-progresso.js';

// ---- TEMAS ----
export const APP_THEMES = {
  purple: { p: '#8b5cf6', pl: '#c084fc', pd: '#6d28d9' },
  green: { p: '#22c55e', pl: '#4ade80', pd: '#16a34a' },
  blue: { p: '#3b82f6', pl: '#60a5fa', pd: '#2563eb' },
  orange: { p: '#f97316', pl: '#fb923c', pd: '#ea580c' },
  red: { p: '#ef4444', pl: '#f87171', pd: '#dc2626' },
  cyan: { p: '#06b6d4', pl: '#22d3ee', pd: '#0891b2' },
  pink: { p: '#ec4899', pl: '#f472b6', pd: '#db2777' },
  amarelo: { p: '#facc15', pl: '#fde68a', pd: '#ca8a04' },
  cinza: { p: '#64748b', pl: '#94a3b8', pd: '#475569' },
  branco: { p: '#ffffff', pl: '#ffffff', pd: '#d1d5db' },
  prata: { p: '#94a3b8', pl: '#cbd5e1', pd: '#64748b' },
  dourado: { p: '#fbbf24', pl: '#fde68a', pd: '#d97706' }
};

export function applyAppTheme(themeKey) {
  const theme = APP_THEMES[themeKey];
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty('--primary', theme.p);
  root.style.setProperty('--primary-light', theme.pl);
  root.style.setProperty('--primary-dark', theme.pd);
  root.style.setProperty('--primary-rgb', hexToRgb(theme.p));
  root.style.setProperty('--gradient', `linear-gradient(135deg, ${theme.p}, ${theme.pd})`);
  root.style.setProperty('--shadow', `rgba(${hexToRgb(theme.p)}, 0.3)`);

  localStorage.setItem('academia_theme', themeKey);

  // Atualiza UI
  document.querySelectorAll('.t-color').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === themeKey);
  });
}

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}



// ---- BACKUP E DADOS ----

const FICHA_LETRAS = ['A','B','C','D','E','F','G','H','I','J'];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isStringOrNull(v) {
  return v === null || typeof v === 'string';
}

function validateBackup(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    throw new Error('Arquivo inválido: raiz deve ser um objeto JSON.');
  }

  if (!Array.isArray(obj.exercicios)) {
    throw new Error('Arquivo inválido: "exercicios" deve ser um array.');
  }
  obj.exercicios.forEach((ex, i) => {
    if (!ex || typeof ex !== 'object') {
      throw new Error(`Exercício #${i + 1} inválido.`);
    }
    if (!isNonEmptyString(ex.id)) throw new Error(`Exercício #${i + 1}: "id" ausente ou vazio.`);
    if (!isNonEmptyString(ex.nome)) throw new Error(`Exercício #${i + 1}: "nome" ausente ou vazio.`);
    if (!isNonEmptyString(ex.grupoMuscular)) throw new Error(`Exercício #${i + 1}: "grupoMuscular" ausente ou vazio.`);
    if (ex.series !== undefined && typeof ex.series !== 'number') {
      throw new Error(`Exercício #${i + 1}: "series" deve ser número.`);
    }
    if (ex.repeticoes !== undefined && !isStringOrNull(ex.repeticoes) && typeof ex.repeticoes !== 'number') {
      throw new Error(`Exercício #${i + 1}: "repeticoes" inválido.`);
    }
    if (ex.carga !== undefined && !isStringOrNull(ex.carga)) {
      throw new Error(`Exercício #${i + 1}: "carga" inválido.`);
    }
    if (ex.imagem !== undefined && !isStringOrNull(ex.imagem)) {
      throw new Error(`Exercício #${i + 1}: "imagem" inválida.`);
    }
  });

  if (!obj.fichas || typeof obj.fichas !== 'object' || Array.isArray(obj.fichas)) {
    throw new Error('Arquivo inválido: "fichas" deve ser um objeto.');
  }
  Object.keys(obj.fichas).forEach(letra => {
    if (!Array.isArray(obj.fichas[letra])) {
      throw new Error(`Ficha "${letra}" deve ser um array de IDs.`);
    }
    obj.fichas[letra].forEach((id, j) => {
      if (!isNonEmptyString(id)) {
        throw new Error(`Ficha "${letra}" posição ${j + 1}: ID inválido.`);
      }
    });
  });

  if (!obj.historico || typeof obj.historico !== 'object' || Array.isArray(obj.historico)) {
    throw new Error('Arquivo inválido: "historico" deve ser um objeto indexado por data.');
  }
  Object.entries(obj.historico).forEach(([date, entry]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Histórico: data "${date}" fora do formato YYYY-MM-DD.`);
    }
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Histórico ${date}: entrada inválida.`);
    }
    if (entry.treino !== undefined && !isStringOrNull(entry.treino)) {
      throw new Error(`Histórico ${date}: "treino" inválido.`);
    }
    if (entry.checks !== undefined && !Array.isArray(entry.checks)) {
      throw new Error(`Histórico ${date}: "checks" deve ser array.`);
    }
    if (entry.checks) {
      entry.checks.forEach((id, j) => {
        if (!isNonEmptyString(id)) throw new Error(`Histórico ${date}: check #${j + 1} inválido.`);
      });
    }
    if (entry.concluido !== undefined && typeof entry.concluido !== 'boolean') {
      throw new Error(`Histórico ${date}: "concluido" deve ser booleano.`);
    }
  });

  if (obj.aerobicos !== undefined && (typeof obj.aerobicos !== 'object' || Array.isArray(obj.aerobicos))) {
    throw new Error('Arquivo inválido: "aerobicos" deve ser um objeto.');
  }

  if (obj.conquistas !== undefined && !Array.isArray(obj.conquistas)) {
    throw new Error('Arquivo inválido: "conquistas" deve ser um array.');
  }

  if (obj.maestrias !== undefined && (typeof obj.maestrias !== 'object' || Array.isArray(obj.maestrias))) {
    throw new Error('Arquivo inválido: "maestrias" deve ser um objeto.');
  }

  if (obj.profileCustomization !== undefined) {
    const pc = obj.profileCustomization;
    if (!pc || typeof pc !== 'object' || Array.isArray(pc)) {
      throw new Error('Arquivo inválido: "profileCustomization" deve ser um objeto.');
    }
    if (pc.nome !== undefined && typeof pc.nome !== 'string') {
      throw new Error('"profileCustomization.nome" deve ser string.');
    }
    if (pc.handle !== undefined && typeof pc.handle !== 'string') {
      throw new Error('"profileCustomization.handle" deve ser string.');
    }
  }

  return true;
}

function downloadBlobFallback(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportData(db) {
  try {
    const dataStr = JSON.stringify(db, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const fileName = 'academia_backup_' + today() + '.json';

    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        const file = new File([blob], fileName, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Backup Academia',
            text: 'Meu backup do Academia Workout Tracker'
          });
          showToast('Backup compartilhado!', 'success');
          return;
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        console.warn('[exportData] navigator.share falhou, usando fallback:', err);
      }
    }

    downloadBlobFallback(blob, fileName);
    showToast('Dados exportados com sucesso!', 'success');
  } catch (err) {
    showToast('Erro ao exportar dados.', 'error');
    console.error(err);
  }
}

export function importData() {
  return new Promise((resolve, reject) => {
    const input = document.getElementById('inputImportarJSON');
    if (!input) {
      reject(new Error('Input de arquivo não encontrado no DOM.'));
      return;
    }

    input.value = '';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('Nenhum arquivo selecionado.'));
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        reject(new Error('Arquivo muito grande (máx. 20MB).'));
        return;
      }

      const proceed = () => {
        const reader = new FileReader();
        reader.onload = readerEvent => {
          try {
            const content = readerEvent.target.result;
            const parsed = JSON.parse(content);
            validateBackup(parsed);

            localStorage.setItem(DB_KEY, JSON.stringify(parsed));
            showToast('Importação bem-sucedida! Atualizando interface...', 'success');

            window.dispatchEvent(new CustomEvent('academia:data-imported', { detail: parsed }));
            resolve(parsed);
          } catch (err) {
            showToast('Erro ao importar: ' + (err.message || 'arquivo inválido.'), 'error');
            console.error('[importData]', err);
            reject(err);
          }
        };
        reader.onerror = () => {
          const err = new Error('Falha ao ler o arquivo.');
          showToast('Erro ao importar: ' + err.message, 'error');
          reject(err);
        };
        reader.readAsText(file);
      };

      const titleEl = document.getElementById('confirmTitle');
      const msgEl = document.getElementById('confirmMsg');
      const yesBtn = document.getElementById('btnConfirmYes');
      const noBtn = document.getElementById('btnConfirmNo');

      if (titleEl && msgEl && yesBtn && noBtn && typeof openModal === 'function') {
        titleEl.textContent = '⚠️ Importar backup?';
        msgEl.textContent = 'Esta ação irá SUBSTITUIR todos os seus dados atuais (exercícios, histórico, conquistas, fichas e personalização) pelos dados do arquivo selecionado. Esta ação não pode ser desfeita.';
        openModal('modalConfirm');

        const onYes = () => {
          cleanup();
          closeModal('modalConfirm');
          proceed();
        };
        const onNo = () => {
          cleanup();
          closeModal('modalConfirm');
          const err = new Error('Importação cancelada pelo usuário.');
          showToast('Importação cancelada.', 'info');
          reject(err);
        };
        const cleanup = () => {
          yesBtn.onclick = null;
          noBtn.onclick = null;
        };
        yesBtn.onclick = onYes;
        noBtn.onclick = onNo;
      } else {
        proceed();
      }
    };

    input.click();
  });
}



// ---- COMPARTILHAMENTO ----
export const QUOTES = [
  "O único treino ruim é aquele que não aconteceu.",
  "A disciplina é a ponte entre metas e realizações.",
  "Suor é o choro da gordura. Continue!",
  "Sua única competição é quem você foi ontem.",
  "A dor é temporária, o orgulho é para sempre.",
  "Feito é melhor que perfeito, mas bem feito é elite.",
  "A força não provém da capacidade física, mas de uma vontade indomável. -Mahatma Gandhi",
  "Que desonra é envelhecer sem ver a beleza e a força de que seu corpo é capaz. -Sócrates",
  "O que não me mata, me torna mais forte. -Friedrich Nietzsche",
  "Nós somos o que fazemos repetidamente. A excelência não é um ato, mas um hábito. -Aristóteles",
  "Eu odiava cada minuto do treinamento, mas dizia: 'Não pare'. -Muhammad Ali",
  "Se você tem medo de falhar, você provavelmente vai falhar. -Kobe Bryant",
  "Eu falhei repetidamente em minha vida. E é por isso que eu tenho sucesso. -Michael Jordan",
  "A motivação é o que te faz começar. O hábito é o que te mantém indo. -Jim Ryun",
  "Daqui a um ano, você desejará ter começado hoje. -Karen Lamb",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia. -Robert Collier",
  "Energia e persistência conquistam todas as coisas. -Benjamin Franklin",
  "Sempre parece impossível até que seja feito. -Nelson Mandela",
  "Tudo o que você sempre quis está do outro lado do medo. -George Addair",
  "A mente é o limite. Se a mente puder visualizar, você consegue fazer. -Arnold Schwarzenegger",
  "Se você está atravessando o inferno, continue indo. -Winston Churchill",
  "Não conte os dias, faça os dias contarem. -Muhammad Ali",
  "Obstáculos são as coisas que você vê quando tira os olhos do objetivo. -Henry Ford",
  "Para ser o melhor, você deve fazer o que os outros não estão dispostos a fazer. -Michael Phelps",
  "Se você quer algo que nunca teve, precisa fazer algo que nunca fez. -Thomas Jefferson",
  "Onde não há esforço, não há progresso. -Frederick Douglass",
  "A saúde é o resultado de não apenas o que você come, mas também do que você pensa.",
  "O corpo alcança o que a mente acredita.",
  "Se você cansar, aprenda a descansar, não a desistir. -Banksy",
  "A força de vontade é um músculo que precisa de exercício.",
  "Não é a carga que o quebra, mas a maneira como você a carrega. -Lou Holtz",
  "O segredo de seguir em frente é começar. -Mark Twain",
  "Seja mais forte que sua melhor desculpa.",
  "Grandes coisas nunca vêm de zonas de conforto.",
  "O fracasso é apenas a oportunidade de começar de novo, desta vez com mais inteligência. -Henry Ford",
  "A única maneira de definir seus limites é indo além deles. -Arthur Clarke",
  "O suor de hoje é o sorriso de amanhã.",
  "Dificuldades preparam pessoas comuns para destinos extraordinários. -C.S. Lewis",
  "Vá firme na direção das suas metas, porque o pensamento cria e o desejo atrai.",
  "Quem não encontra tempo para o exercício, terá que encontrar tempo para a doença. -Edward Derby",
  "Transforme suas desculpas em vontade de vencer.",
  "Para ganhar o que você nunca ganhou, você deve fazer o que nunca fez.",
  "Coragem é a resistência ao medo, o domínio do medo, e não a ausência dele. -Mark Twain",
  "Não deixe que o que você não pode fazer interfira no que você pode fazer. -John Wooden",
  "O destino não é uma questão de sorte, é uma questão de escolha. -William Bryan",
  "O que você faz hoje pode melhorar todos os seus amanhãs. -Ralph Marston",
  "Se você não acredita em si mesmo, ninguém o fará. -Kobe Bryant",
  "Persistência é o caminho do êxito. -Charles Chaplin",
  "Sua mente deve ser mais forte que seus sentimentos.",
  "Nada é impossível para aquele que persiste. -Alexandre, o Grande",
  "O treino não termina quando você está cansado, termina quando você acaba.",
  "Não pare quando estiver doendo, pare quando estiver feito. -David Goggins",
  "Se não houver luta, não haverá progresso. -Frederick Douglass",
  "A dor é apenas a fraqueza saindo do corpo. -Mantra Militar",
  "Tudo o que você precisa já está dentro de você.",
  "Seja a sua própria motivação.",
  "O sucesso não é o final, o fracasso não é fatal: o que conta é a coragem de continuar. -Winston Churchill",
  "Quanto mais difícil a vitória, maior a felicidade em ganhar. -Pelé",
  "A paciência é um elemento fundamental do sucesso. -Bill Gates",
  "O trabalho duro vence o talento quando o talento não trabalha duro. -Tim Notke",
  "Não importa quão devagar você vá, desde que não pare. -Confúcio",
  "Sua vida não melhora por acaso, melhora por mudança. -Jim Rohn",
  "Pense como um campeão. Um campeão não tem medo de falhar. -Billie Jean King",
  "A disciplina é fazer o que precisa ser feito, mesmo quando você não quer.",
  "Não deseje que fosse mais fácil, deseje que você fosse melhor. -Jim Rohn",
  "A consistência é o que transforma o comum em extraordinário.",
  "Uma jornada de mil milhas começa com um único passo. -Lao Tzu",
  "Ganhar não é tudo, mas querer ganhar é. -Vince Lombardi",
  "Acredite que você pode e você estará no meio do caminho. -Theodore Roosevelt",
  "Você perde 100% das chances que não aproveita. -Wayne Gretzky",
  "Esforce-se para progredir, não para ser perfeito.",
  "Foco é dizer não para mil coisas boas. -Steve Jobs",
  "O que você faz consistentemente importa mais do que o que você faz ocasionalmente.",
  "Seja a mudança que você deseja ver no mundo. -Mahatma Gandhi",
  "Sucesso é caminhar de fracasso em fracasso sem perder o entusiasmo. -Winston Churchill",
  "Não conte às pessoas seus planos. Mostre a elas seus resultados.",
  "A melhor vingança é um sucesso estrondoso. -Frank Sinatra",
  "Você é o que você faz, não o que você diz que vai fazer. -C.G. Jung",
  "A única pessoa que você deve tentar ser melhor do que, é a pessoa que você era ontem.",
  "Mantenha seus olhos nas estrelas e seus pés no chão. -Theodore Roosevelt",
  "Não tenha medo de desistir do bom para ir atrás do ótimo. -John D. Rockefeller",
  "A vida começa onde termina sua zona de conforto. -Neale Donald Walsch",
  "Se você quer ser o melhor, aprenda a lidar com o pior.",
  "A diferença entre o impossível e o possível reside na determinação de um homem. -Tommy Lasorda",
  "Tente mover o mundo – o primeiro passo será mover a si mesmo. -Platão",
  "Vencer a si próprio é a maior das vitórias. -Platão",
  "O caráter é aquilo que você é quando não há ninguém olhando. -William Wooden",
  "Seja tão bom que eles não possam te ignorar. -Steve Martin",
  "O entusiasmo é a maior força da alma. -Napoleão Bonaparte",
  "Sonhe grande e ouse falhar. -Norman Vaughan",
  "A determinação de hoje é o sucesso de amanhã.",
  "Somente aqueles que ousam falhar grandemente podem realizar grandemente. -Robert F. Kennedy",
  "A excelência é o resultado gradual de sempre querer fazer melhor. -Pat Riley",
  "Nunca é tarde demais para ser o que você poderia ter sido. -George Eliot",
  "Nada grande jamais foi alcançado sem entusiasmo. -Ralph Waldo Emerson",
  "O único lugar onde o sucesso vem antes do trabalho é no dicionário. -Vidal Sassoon",
  "Você nunca saberá seus limites a menos que se force a alcançá-los.",
  "A cada treino, você está construindo uma versão melhor de si mesmo.",
  "Respeite o processo, colha os resultados.",
  "O corpo é o templo do espírito.",
  "Treine sua mente para ver o bom em cada situação.",
  "Firmeza no propósito e suavidade nos meios. -Claudio Aquaviva",
  "Comece onde você está. Use o que você tem. Faça o que você pode. -Arthur Ashe",
  "Seu corpo pode aguentar quase tudo. É a sua mente que você precisa convencer.",
  "Não diminua a meta, aumente o esforço.",
  "O segredo para vencer é nunca desistir.",
  "A disciplina é a alma do exército. Ela torna grandes as pequenas multidões. -George Washington",
  "O entusiasmo é a eletricidade da vida. Como você o consegue? Você o cria agindo com entusiasmo.",
  "O que importa não é o tamanho do cachorro na briga, mas o tamanho da briga no cachorro. -Magic Johnson",
  "Não pare até se orgulhar de quem você se tornou.",
  "Para ser um campeão, você tem que acreditar em si mesmo quando ninguém mais acredita. -Sugar Ray Robinson",
  "O sucesso não é para os que querem, é para os que fazem por merecer.",
  "Dificuldades reais podem ser superadas; apenas as imaginárias são invencíveis. -Theodore Vail",
  "A dor é o combustível da mudança.",
  "Se você quer chegar onde a maioria não chega, precisa fazer o que a maioria não faz.",
  "A vida começa no final da sua zona de conforto. -Neale Donald Walsch",
  "A força não vem das vitórias. Seus esforços desenvolvem suas forças. -Arnold Schwarzenegger",
  "Não procure por erros, procure por soluções. -Henry Ford",
  "Sua determinação é o seu maior pré-treino.",
  "Onde há vontade, há um caminho.",
  "Acreditar é o primeiro passo para realizar.",
  "O segredo da força está na vontade. -Victor Hugo",
  "Você é capaz de muito mais do que imagina.",
  "Quem tem um porquê suporta quase qualquer como. -Friedrich Nietzsche",
  "Grandes vitórias exigem grandes sacrifícios.",
  "O suor limpa a alma e fortalece o corpo.",
  "A diferença entre o possível e o impossível está na sua dedicação.",
  "Desculpas não queimam calorias.",
  "O hoje é a sua melhor chance de superar o ontem.",
  "A resiliência é a arte de transformar dor em poder.",
  "O corpo é o reflexo da sua mente.",
  "Foco é a capacidade de dizer não para as distrações.",
  "A pressa é inimiga da perfeição, mas a estagnação é inimiga do resultado.",
  "Não conte os dias, faça os dias valerem a pena.",
  "A verdadeira motivação vem de dentro.",
  "O fracasso é apenas um degrau para o sucesso.",
  "Vá além, mesmo quando as pernas pedirem para parar.",
  "Transforme o 'eu não consigo' em 'eu vou tentar até conseguir'.",
  "Sua saúde é o seu maior investimento.",
  "Ninguém pode fazer por você o que só você pode fazer.",
  "A persistência é o que separa o sucesso do fracasso.",
  "Não espere por motivação, construa disciplina.",
  "O segredo é não parar nunca.",
  "Cada repetição conta uma nova história.",
  "Seja a inspiração que você procura.",
  "O limite é uma fronteira criada pela mente.",
  "Não é sobre ter tempo, é sobre priorizar.",
  "Você está a um treino de distância de um humor melhor.",
  "A gratidão gera felicidade, e a felicidade gera energia.",
  "Treine para viver, não viva para treinar.",
  "A constância vence o talento todos os dias.",
  "Seu corpo é sua única casa. Cuide bem dele.",
  "O progresso é lento, mas desistir não o acelera.",
  "Pequenas vitórias diárias levam a grandes conquistas.",
  "O impossível é apenas uma opinião.",
  "Seja sua melhor versão, não a cópia de ninguém.",
  "A vontade de vencer deve ser maior que a vontade de descansar.",
  "Não é apenas exercício, é terapia.",
  "Sua mente é seu mestre, ou seu escravo. Você escolhe.",
  "A excelência é um hábito que se cultiva no dia a dia.",
  "Honre o seu esforço, respeite o seu corpo.",
  "Mude o plano, mas nunca a meta.",
  "O cansaço passa, o resultado fica.",
  "Cada gota de suor é um passo rumo ao objetivo.",
  "Não se compare aos outros, compare-se a quem você era ontem.",
  "A força de vontade não tem limites.",
  "O treino de hoje é a saúde de amanhã.",
  "Supere seus medos e encontrará sua força.",
  "Nada substitui o trabalho duro.",
  "A vitória pertence àqueles que acreditam nela por mais tempo. -Napoleão Bonaparte",
  "Otimismo é a fé que leva à realização. -Helen Keller",
  "Seja a mudança que você quer ver no seu corpo.",
  "O sucesso começa quando a desculpa termina.",
  "Treinar é um ato de amor próprio.",
  "Domine a sua mente e você dominará o seu mundo.",
  "O poder está na sua escolha de continuar.",
  "Sua evolução é constante, basta não desistir.",
  "O esforço de hoje é a conquista de amanhã.",
  "Você é o arquiteto do seu próprio corpo.",
  "Desafie-se todos os dias.",
  "A disciplina te leva onde a motivação não consegue.",
  "O resultado é proporcional ao esforço.",
  "Sinta o orgulho de cada etapa vencida.",
  "A jornada é tão importante quanto o destino.",
  "Acredite no processo.",
  "Você é mais forte do que imagina.",
  "Não pare até atingir sua meta.",
  "O foco determina a realidade.",
  "A cada dia, um novo desafio, uma nova vitória.",
  "A saúde mental e a física caminham juntas.",
  "O suor é a prova de que você está lutando.",
  "Não deixe para amanhã o treino que você pode fazer hoje.",
  "O sucesso é construído com suor e dedicação.",
  "A força está na mente, o corpo apenas obedece.",
  "Seja persistente, os resultados virão.",
  "O treino é a base de uma vida saudável.",
  "Supere-se a cada repetição.",
  "A motivação te põe no caminho, o hábito te leva adiante.",
  "Não existe elevador para o sucesso, você tem que subir as escadas.",
  "Cada desafio é uma oportunidade de crescer.",
  "O esforço nunca é em vão.",
  "Mantenha o foco, a meta está logo ali.",
  "Acredite na sua força interior.",
  "O segredo do sucesso é a constância no propósito. -Benjamin Disraeli",
  "Não olhe para o relógio, faça o que ele faz: continue andando. -Sam Levenson",
  "O corpo é a ferramenta, a mente é o motor.",
  "A vida é como andar de bicicleta. Para manter o equilíbrio, você deve continuar em movimento. -Albert Einstein",
  "O homem que move montanhas começa carregando pequenas pedras. -Confúcio",
  "Aquele que tem saúde tem esperança; e aquele que tem esperança tem tudo. -Provérbio Árabe",
  "A maior riqueza é a saúde. -Virgílio",
  "A felicidade reside na alegria da realização e no entusiasmo do esforço criativo. -Franklin D. Roosevelt",
  "O conhecimento é poder. -Francis Bacon",
  "O que fazemos em vida ecoa na eternidade. -Marco Aurélio",
  "A coragem é a primeira das qualidades humanas porque é a qualidade que garante as outras. -Aristóteles",
  "Agir, eis a inteligência verdadeira. Serei o que quiser. Mas tenho que querer o que for. -Fernando Pessoa",
  "A arte de vencer se aprende nas derrotas. -Simón Bolívar",
  "Não há nada como o retorno para um lugar que permanece inalterado para encontrar as maneiras pelas quais você mesmo se alterou. -Nelson Mandela",
  "A vida não examinada não vale a pena ser vivida. -Sócrates",
  "O sábio nunca diz tudo o que pensa, mas pensa sempre tudo o que diz. -Aristóteles",
  "O homem é o que ele acredita. -Anton Tchekhov",
  "Não espere por circunstâncias ideais, nem por chances favoráveis; elas nunca virão. -Janet Erskine Stuart",
  "Somos o que pensamos. Tudo o que somos surge com nossos pensamentos. -Buda",
  "A paciência é amarga, mas seu fruto é doce. -Jean-Jacques Rousseau",
  "O segredo da mudança é focar toda a sua energia não em lutar contra o velho, mas em construir o novo. -Sócrates",
  "Aquele que não é suficientemente corajoso para correr riscos não realizará nada na vida. -Muhammad Ali",
  "O insucesso é apenas uma oportunidade para recomeçar com mais inteligência. -Henry Ford",
  "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original. -Albert Einstein",
  "O homem não é nada além do que ele faz de si mesmo. -Jean-Paul Sartre",
  "Não é a morte que um homem deve temer, mas ele deve temer nunca começar a viver. -Marco Aurélio",
  "Tudo o que somos é resultado do que pensamos. -Buda",
  "Conhece-te a ti mesmo e conhecerás o universo e os deuses. -Sócrates",
  "A vontade de preparar deve ser maior do que a vontade de vencer. -Bob Knight",
  "Para ser um mestre, você deve ser um eterno aprendiz. -Lao Tzu",
  "A suprema arte da guerra é derrotar o inimigo sem lutar. -Sun Tzu",
  "Se você conhece o inimigo e conhece a si mesmo, não precisa temer o resultado de cem batalhas. -Sun Tzu",
  "Nós somos os nossos próprios demônios e fazemos deste mundo o nosso próprio inferno. -Oscar Wilde",
  "A verdadeira liberdade é um ato de autodisciplina. -Sêneca",
  "Viver é a coisa mais rara do mundo. A maioria das pessoas apenas existe. -Oscar Wilde",
  "Não erramos por desejar demais, mas por realizar de menos. -Sêneca",
  "O caminho para a sabedoria é pavimentado com humildade. -Confúcio",
  "Nada de grande se cria de repente. -Epiteto",
  "Aquele que conquista a si mesmo é o guerreiro mais poderoso. -Lao Tzu",
  "A maior glória de viver não está em nunca cair, mas em nos levantar toda vez que caímos. -Nelson Mandela",
  "A educação é a arma mais poderosa que você pode usar para mudar o mundo. -Nelson Mandela",
  "O gênio é 1% inspiração e 99% transpiração. -Thomas Edison",
  "Muitas das falhas da vida ocorrem porque não perceberam o quão perto estavam do sucesso quando desistiram. -Thomas Edison",
  "A força não vem da capacidade física, mas de uma vontade férrea. -Mahatma Gandhi",
  "Você deve ser a mudança que deseja ver no mundo. -Mahatma Gandhi",
  "A vida é o que acontece enquanto você está ocupado fazendo outros planos. -John Lennon",
  "Não importa quão devagar você vá, desde que você não pare. -Confúcio",
  "A felicidade não é algo pronto. Ela vem de suas próprias ações. -Dalai Lama",
  "Dê a quem você ama: asas para voar, raízes para voltar e motivos para ficar. -Dalai Lama",
  "O homem livre é aquele que não tem medo de ir até o fim de seu pensamento. -Albert Camus",
  "No meio da dificuldade encontra-se a oportunidade. -Albert Einstein",
  "É melhor ser odiado pelo que você é do que ser amado pelo que você não é. -André Gide",
  "Aquilo que não nos mata nos fortalece. -Friedrich Nietzsche",
  "A dúvida é o princípio da sabedoria. -Aristóteles",
  "Não se pode ensinar nada a um homem; pode-se apenas ajudá-lo a encontrar a resposta dentro de si mesmo. -Galileu Galilei",
  "A persistência é o caminho do êxito. -Charles Chaplin",
  "A vida é uma peça de teatro que não permite ensaios. -Charles Chaplin",
  "Saber não é suficiente; devemos aplicar. Querer não é suficiente; devemos fazer. -Johann Wolfgang von Goethe",
  "Onde há amor pela arte da medicina, há também amor pela humanidade. -Hipócrates",
  "Que o teu alimento seja o teu remédio e que o teu remédio seja o teu alimento. -Hipócrates",
  "A amizade é uma alma que habita em dois corpos. -Aristóteles",
  "A música é a linguagem universal da humanidade. -Henry Wadsworth Longfellow",
  "A verdadeira viagem de descoberta não consiste em procurar novas paisagens, mas em ter novos olhos. -Marcel Proust",
  "Sempre que você se encontrar do lado da maioria, é hora de parar e refletir. -Mark Twain",
  "Nunca discuta com pessoas estúpidas. Elas vão te arrastar ao nível delas e te vencer pela experiência. -Mark Twain",
  "Os dois dias mais importantes da sua vida são o dia em que você nasce e o dia em que você descobre o porquê. -Mark Twain",
  "É mais fácil enganar as pessoas do que convencê-las de que foram enganadas. -Mark Twain",
  "O homem que não lê não tem vantagem sobre o homem que não sabe ler. -Mark Twain",
  "Mantenha-se afastado de pessoas que tentam depreciar suas ambições. -Mark Twain",
  "Se você diz a verdade, não precisa se lembrar de nada. -Mark Twain",
  "O sucesso consiste em ir de fracasso em fracasso sem perda de entusiasmo. -Winston Churchill",
  "Um pessimista vê a dificuldade em cada oportunidade; um otimista vê a oportunidade em cada dificuldade. -Winston Churchill",
  "Nunca, nunca, nunca desista. -Winston Churchill",
  "O preço da grandeza é a responsabilidade. -Winston Churchill",
  "A história será generosa comigo, pois pretendo escrevê-la. -Winston Churchill",
  "Coragem é o que é preciso para levantar-se e falar; coragem é também o que é preciso para sentar-se e ouvir. -Winston Churchill",
  "Melhorar é mudar; ser perfeito é mudar com frequência. -Winston Churchill",
  "O sucesso não é definitivo, o fracasso não é fatal: é a coragem de continuar que conta. -Winston Churchill",
  "Dificuldades dominadas são oportunidades ganhas. -Winston Churchill",
  "Você tem inimigos? Bom. Isso significa que você defendeu algo em algum momento de sua vida. -Winston Churchill",
  "Política é a habilidade de prever o que vai acontecer amanhã, na semana que vem, no mês que vem e no ano que vem. -Winston Churchill",
  "Não tenho nada a oferecer senão sangue, fadiga, lágrimas e suor. -Winston Churchill",
  "A imaginação é mais importante que o conhecimento. -Albert Einstein",
  "Tente não se tornar um homem de sucesso, mas sim um homem de valor. -Albert Einstein",
  "A lógica leva você de A a B. A imaginação leva você a qualquer lugar. -Albert Einstein",
  "A medida da inteligência é a capacidade de mudar. -Albert Einstein",
  "Grandes mentes sempre encontraram oposição violenta de mentes medíocres. -Albert Einstein",
  "O mundo é um lugar perigoso de se viver, não por causa daqueles que fazem o mal, mas por causa daqueles que observam e deixam o mal acontecer. -Albert Einstein",
  "Pense em toda a beleza que ainda resta ao seu redor e seja feliz. -Anne Frank",
  "Quem é feliz fará os outros felizes também. -Anne Frank",
  "A longo prazo, a arma mais afiada de todas é um espírito amável e gentil. -Anne Frank",
  "Só se vê bem com o coração. O essencial é invisível aos olhos. -Antoine de Saint-Exupéry",
  "Tu te tornas eternamente responsável por aquilo que cativas. -Antoine de Saint-Exupéry",
  "O futuro pertence àqueles que acreditam na beleza de seus sonhos. -Eleanor Roosevelt",
  "Ninguém pode fazer você se sentir inferior sem o seu consentimento. -Eleanor Roosevelt",
  "Onde não há visão, o povo perece. -Provérbio Bíblico",
  "Se você quer um amigo, seja um. -Ralph Waldo Emerson",
  "O único herói é aquele que faz o que pode. O resto não faz. -Romain Rolland",
  "A vida é curta, a arte é longa. -Sêneca",
  "Enquanto vivemos, aprendemos. -Sêneca",
  "A sorte é o que acontece quando a preparação encontra a oportunidade. -Sêneca",
  "Não é que tenhamos pouco tempo, é que perdemos muito. -Sêneca",
  "Nada é tão terrível quanto o medo em si. -Francis Bacon",
  "A verdadeira felicidade é desfrutar o presente, sem depender ansiosamente do futuro. -Sêneca",
  "Aquele que move montanhas começou carregando pequenas pedras. -Confúcio",
  "O que não nos mata, nos torna mais fortes. -Friedrich Nietzsche",
  "A excelência não é um ato, mas um hábito. -Aristóteles",
  "A paciência é amarga, mas seu fruto é doce. -Jean-Jacques Rousseau",
  "O gênio é 1% inspiração e 99% transpiração. -Thomas Edison",
  "A vida é o que acontece enquanto você está ocupado fazendo outros planos. -John Lennon",
  "A medida da inteligência é a capacidade de mudar. -Albert Einstein",
  "Não importa o quão devagar você vá, desde que não pare. -Confúcio",
  "O conhecimento é poder. -Francis Bacon",
  "A sorte favorece a mente preparada. -Louis Pasteur",
  "O homem que não lê não tem vantagem sobre o homem que não sabe ler. -Mark Twain",
  "Saber não é o suficiente, devemos aplicar. Querer não é o suficiente, devemos fazer. -Goethe",
  "Nós somos o que fazemos repetidamente. -Aristóteles",
  "A vida é curta, mas a glória pode ser eterna. -Cícero",
  "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo. -Winston Churchill",
  "A imaginação é mais importante que o conhecimento. -Albert Einstein",
  "Vencer a si próprio é a maior das vitórias. -Platão",
  "O segredo da força está na vontade. -Victor Hugo",
  "Nada de grande se cria de repente. -Epiteto",
  "A melhor maneira de prever o futuro é criá-lo. -Peter Drucker",
  "Onde quer que você vá, vá com todo o seu coração. -Confúcio",
  "Tudo o que a mente humana pode conceber e acreditar, ela pode realizar. -Napoleon Hill",
  "A simplicidade é o último grau da sofisticação. -Leonardo da Vinci",
  "Não conte os dias, faça os dias contarem. -Muhammad Ali",
  "Dificuldades reais podem ser superadas; apenas as imaginárias são invencíveis. -Theodore Vail",
  "Nossa maior glória não reside em jamais cair, mas em levantarmo-nos cada vez que caímos. -Oliver Goldsmith",
  "O obstáculo é o caminho. -Marco Aurélio",
  "Seja tão bom que eles não possam te ignorar. -Steve Martin",
  "Tente mover o mundo – o primeiro passo será mover a si mesmo. -Platão",
  "A única maneira de fazer um excelente trabalho é amar o que você faz. -Steve Jobs",
  "A persistência é o caminho do êxito. -Charles Chaplin",
  "Nada é impossível para quem tenta. -Alexandre, o Grande",
  "Aquele que tem um 'porquê' para viver pode suportar quase qualquer 'como'. -Friedrich Nietzsche",
  "O caráter é o destino. -Heráclito",
  "Mantenha seus olhos nas estrelas e seus pés no chão. -Theodore Roosevelt",
  "A coragem é a resistência ao medo, o domínio do medo, e não a ausência dele. -Mark Twain",
  "Tudo o que somos é resultado do que pensamos. -Buda",
  "A vida começa onde termina a sua zona de conforto. -Neale Donald Walsch",
  "O insucesso é apenas uma oportunidade para recomeçar com mais inteligência. -Henry Ford",
  "O futuro pertence àqueles que acreditam na beleza de seus sonhos. -Eleanor Roosevelt",
  "A energia da mente é a essência da vida. -Aristóteles",
  "Não espere; o tempo nunca será 'exatamente certo'. -Napoleon Hill",
  "Aquilo que se faz por amor está sempre além do bem e do mal. -Friedrich Nietzsche",
  "É na crise que nasce a inventividade, as descobertas e as grandes estratégias. -Albert Einstein",
  "Sempre parece impossível até que seja feito. -Nelson Mandela",
  "As raízes da educação são amargas, mas o fruto é doce. -Aristóteles",
  "Quem não se senta para aprender, não se levanta para ensinar. -Provérbio Chinês",
  "A maior riqueza é a saúde. -Virgílio",
  "Qualquer pessoa que para de aprender é velha, seja aos vinte ou aos oitenta anos. -Henry Ford",
  "Se você quer ser feliz, seja. -Léon Tolstói",
  "A saúde é a verdadeira riqueza, não peças de ouro e prata. -Mahatma Gandhi",
  "Para ganhar o que você nunca ganhou, você deve fazer o que nunca fez. -Thomas Jefferson",
  "A sorte é o que acontece quando a preparação encontra a oportunidade. -Sêneca",
  "É mais fácil prevenir do que remediar. -Erasmo de Roterdã",
  "O sábio nunca diz tudo o que pensa, mas pensa sempre tudo o que diz. -Aristóteles",
  "O homem é livre no momento em que deseja ser. -Voltaire",
  "O que você faz hoje pode melhorar todos os seus amanhãs. -Ralph Marston",
  "A disciplina é a alma de um exército. -George Washington",
  "A arte de vencer se aprende nas derrotas. -Simón Bolívar",
  "Não procure por erros, procure por soluções. -Henry Ford",
  "O homem que não tem imaginação não tem asas. -Muhammad Ali",
  "O gênio é a capacidade de enfrentar o que é difícil. -C.G. Jung",
  "Onde não há luta, não há progresso. -Frederick Douglass",
  "Aquele que conquista a si mesmo é o guerreiro mais poderoso. -Lao Tzu",
  "A mente é tudo; o que você pensa, você se torna. -Sócrates",
  "A dúvida é o princípio da sabedoria. -Aristóteles",
  "O que importa não é o que acontece com você, mas como você reage. -Epiteto",
  "Nunca é tarde demais para ser o que você poderia ter sido. -George Eliot",
  "A felicidade não é algo pronto. Ela vem das suas próprias ações. -Dalai Lama",
  "Toda ação humana tem como causa uma dessas sete coisas: acaso, natureza, compulsão, hábito, razão, paixão, desejo. -Aristóteles",
  "A vontade de vencer deve ser maior do que o medo de falhar. -Billie Jean King",
  "Saber o que é correto e não fazê-lo é a falta de coragem. -Confúcio",
  "Ninguém pode fazer você se sentir inferior sem o seu consentimento. -Eleanor Roosevelt",
  "Não erramos por desejar demais, mas por realizar de menos. -Sêneca",
  "O homem nasce para lutar e a sua vida é uma batalha eterna. -Sêneca",
  "Somente aqueles que ousam falhar grandemente podem realizar grandemente. -Robert F. Kennedy",
  "A pressa é a inimiga da perfeição. -Provérbio Popular",
  "Grandes mentes discutem ideias; mentes médias discutem eventos; mentes pequenas discutem pessoas. -Eleanor Roosevelt",
  "A maior aventura que você pode viver é a de viver a vida dos seus sonhos. -Oprah Winfrey",
  "Não é a carga que o quebra, mas a maneira como você a carrega. -Lou Holtz",
  "Os problemas são apenas oportunidades com roupas de trabalho. -Henry Kaiser",
  "A direção é mais importante que a velocidade. -Richard L. Evans",
  "Não encontre defeitos, encontre soluções. -Henry Ford",
  "O segredo da felicidade é a liberdade, e o segredo da liberdade é a coragem. -Tucídides",
  "Age como se o que fizesse fizesse a diferença. E faz. -William James",
  "O trabalho duro vence o talento quando o talento não trabalha duro. -Tim Notke",
  "Tudo o que você sempre quis está do outro lado do medo. -George Addair",
  "A melhor vingança é o sucesso estrondoso. -Frank Sinatra",
  "Não olhe para o relógio; faça o que ele faz. Continue andando. -Sam Levenson",
  "Onde há amor pela arte da medicina, há também amor pela humanidade. -Hipócrates",
  "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original. -Albert Einstein",
  "O corpo humano é a melhor imagem da alma humana. -Ludwig Wittgenstein",
  "Nada é tão terrível quanto o medo em si. -Francis Bacon",
  "A felicidade reside na alegria da conquista e na emoção do esforço criativo. -Franklin D. Roosevelt",
  "Comece onde você está. Use o que você tem. Faça o que puder. -Arthur Ashe",
  "Vá firme na direção das suas metas, porque o pensamento cria e o desejo atrai. -Johann Wolfgang von Goethe",
  "A vida é curta, a arte é longa, a oportunidade é fugaz. -Hipócrates",
  "O que você faz faz diferença, e você tem que decidir que tipo de diferença você quer fazer. -Jane Goodall",
  "O sucesso não é a chave para a felicidade. A felicidade é a chave para o sucesso. -Albert Schweitzer",
  "As pessoas que são loucas o suficiente para achar que podem mudar o mundo são as que o mudam. -Steve Jobs"
];


export function openShareCard(db) {
  const treino = getTodayTreino(db);
  const fichaIds = db.fichas[treino] || [];
  const exercicios = fichaIds.map(id => getExById(db, id)).filter(Boolean);
  const streak = getStreak(db);

  // Calcular Volume e Destaques
  let totalVol = 0;
  let totalCarga = 0;
  const exStats = exercicios.map(ex => {
    const s = parseInt(ex.series) || 0;
    const r = parseInt(ex.repeticoes) || 0;
    const loadVal = parseFloat(String(ex.carga).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    const multi = ex.porLado ? 2 : 1;
    const vol = s * r * loadVal * multi;
    totalVol += vol;
    totalCarga += loadVal;
    return { name: ex.nome, vol, carga: formatCarga(ex.carga, ex.porLado, ex.tags) };
  });

  const avgVol = exercicios.length ? (totalCarga / exercicios.length).toFixed(1) : '0.0';

  // Ordenar por volume para pegar os 3 destaques
  const highlights = [...exStats].sort((a, b) => b.vol - a.vol).slice(0, 3);

  document.getElementById('shareDate').textContent = todayLabel().toUpperCase();
  document.getElementById('shareTitle').textContent = `TREINO ${treino}: ${exercicios.length} EXERCÍCIOS`;
  document.getElementById('shareExCount').textContent = exercicios.length;
  document.getElementById('shareVol').textContent = totalVol.toLocaleString('pt-BR');
  document.getElementById('shareAvgVol').textContent = avgVol;
  const shareStreakEl = document.getElementById('shareStreak');
  if (shareStreakEl) {
    if (streak) {
      shareStreakEl.innerHTML = `${streak}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color:#f97316; margin-left: 2px; display: inline-block; vertical-align: middle;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
    } else {
      shareStreakEl.innerHTML = '0';
    }
  }

  const histHoje = db.historico[today()];
  const durStr = histHoje && histHoje.duracaoTotal ? formatSeconds(histHoje.duracaoTotal) : '--';
  document.getElementById('shareTime').textContent = durStr;

  // Lista de Destaques
  document.getElementById('shareHighlightsList').innerHTML = highlights.map(h => `
    <div class="sh-item">
      <span class="sh-name">${h.name}</span>
      <span class="sh-val">${h.carga || h.vol + 'kg total'}</span>
    </div>
  `).join('');

  // Frase Aleatória
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.querySelector('.share-quote').textContent = `"${quote}"`;

  // Mostrar apenas o card de treino
  document.getElementById('shareCardBadge').style.display = 'none';
  document.getElementById('shareCard').style.display = 'flex';

  openModal('modalShare');
}

export function getActiveShareCardInfo() {
  if (document.getElementById('shareCardBadge').style.display !== 'none') {
    return { card: document.getElementById('shareCardBadge'), name: 'conquista' };
  } else if (document.getElementById('shareCardRadar') && document.getElementById('shareCardRadar').style.display !== 'none') {
    return { card: document.getElementById('shareCardRadar'), name: 'radar' };
  } else {
    return { card: document.getElementById('shareCard'), name: 'treino' };
  }
}

export function downloadShareImage() {
  const info = getActiveShareCardInfo();
  const card = info.card;
  const btn = document.getElementById('btnDownloadImage');
  const originalBtnText = btn.innerHTML;

  btn.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i></span> GERANDO...';
  btn.disabled = true;

  // html2canvas options for high quality
  html2canvas(card, {
    scale: 2, // Double resolution
    backgroundColor: '#000000',
    useCORS: true,
    logging: false
  }).then(canvas => {
    const link = document.createElement('a');
    const name = info.name;
    link.download = `meu-${name}-${today()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    link.click();

    btn.innerHTML = originalBtnText;
    btn.disabled = false;
    showToast('Imagem gerada com sucesso! Confira seus downloads.', 'success');
  }).catch(err => {
    console.error(err);
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
    showToast('Erro ao gerar imagem. Tente tirar um print.', 'error');
  });
}

export function shareImageNow() {
  const info = getActiveShareCardInfo();
  const card = info.card;
  const btn = document.getElementById('btnShareNow');
  const originalBtnText = btn.innerHTML;

  btn.innerHTML = '<span><i class="fas fa-spinner fa-spin"></i></span> PREPARANDO...';
  btn.disabled = true;

  html2canvas(card, {
    scale: 2,
    backgroundColor: '#000000',
    useCORS: true,
    logging: false
  }).then(canvas => {
    canvas.toBlob(blob => {
      const name = info.name;
      const file = new File([blob], `meu-${name}-${today()}.jpg`, { type: 'image/jpeg' });

      const fallbackDownloadAndCopy = () => {
        // Tenta copiar a imagem para a área de transferência (Ótimo para PC/WhatsApp Web)
        canvas.toBlob(pngBlob => {
          try {
            const item = new ClipboardItem({ 'image/png': pngBlob });
            navigator.clipboard.write([item]).then(() => {
              showToast('Imagem copiada para a área de transferência. Compartilhe com seus amigos!', 'success');
              btn.innerHTML = originalBtnText;
              btn.disabled = false;
            }).catch(() => {
              executarDownloadTradicional();
            });
          } catch (e) {
            executarDownloadTradicional();
          }
        }, 'image/png');
      };

      const executarDownloadTradicional = () => {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = URL.createObjectURL(blob);
        link.click();

        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        showToast('Compartilhamento não suportado. Imagem baixada!', 'info');
      };

      // Tenta usar a Web Share API Nativa
      if (navigator.share) {
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          navigator.share({
            title: 'AcademiaPRO',
            text: '🔥 Confira meu progresso na AcademiaPRO!',
            files: [file]
          }).then(() => {
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
          }).catch(err => {
            console.warn(err);
            if (err.name !== 'AbortError') fallbackDownloadAndCopy();
            else {
              btn.innerHTML = originalBtnText;
              btn.disabled = false;
            }
          });
        } else {
          fallbackDownloadAndCopy();
        }
      } else {
        fallbackDownloadAndCopy();
      }
    }, 'image/jpeg', 0.9);
  }).catch(err => {
    console.error(err);
    btn.innerHTML = originalBtnText;
    btn.disabled = false;
    showToast('Erro ao preparar compartilhamento.', 'error');
  });
}

export function shareRadar() {
  document.getElementById('shareRadarDate').textContent = todayLabel().toUpperCase();
  const modeText = currentRadarMode === 'mensal' ? 'MENSAL' : 'TOTAL';
  document.getElementById('shareRadarMode').textContent = `RADAR ${modeText}`;

  // Clona o SVG do radar
  const radarSvg = document.querySelector('#radarChartContainer svg');
  const cloneContainer = document.getElementById('shareRadarCloneContainer');
  cloneContainer.innerHTML = '';
  if (radarSvg) {
    const clone = radarSvg.cloneNode(true);
    clone.style.width = '100%';
    clone.style.maxWidth = '300px';
    clone.style.height = 'auto';
    cloneContainer.appendChild(clone);
  }

  // Prepara o modal ocultando os outros cards
  document.getElementById('shareCard').style.display = 'none';
  if (document.getElementById('shareCardBadge')) document.getElementById('shareCardBadge').style.display = 'none';
  document.getElementById('shareCardRadar').style.display = 'flex';

  openModal('modalShare');
}


// ---- SISTEMA DE ABAS DO PERFIL ----
export function initPerfilTabs(db) {
  // Abas Principais
  const navBtns = document.querySelectorAll('#perfTabNav .t-tab-btn');
  const tabContents = document.querySelectorAll('.perf-tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = `perf-tab-${btn.dataset.perftab}`;
      const target = document.getElementById(targetId);
      const activeTab = document.querySelector('.perf-tab-content.active');

      const performSwap = () => {
        // Remover active de todos
        navBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => {
          c.classList.remove('active');
          c.style.display = 'none';
        });

        // Ativar o selecionado
        btn.classList.add('active');
        if (target) {
          target.classList.add('active');
          target.style.display = 'block';
          fadeIn(target);
        }
      };

      if (activeTab && activeTab !== target) {
        fadeSwap(activeTab, performSwap);
      } else {
        performSwap();
      }

      if (btn.dataset.perftab === 'personalizar') {
        import('./secao-customizacao.js').then(module => {
          module.initPersonalizarTab(loadDB());
        });
      }

      // Salvar preferência
      localStorage.setItem('academia_perfil_tab', btn.dataset.perftab);
    });
  });

  // Restaurar aba principal salva
  let savedTab = localStorage.getItem('academia_perfil_tab');
  if (savedTab === 'config') {
    savedTab = 'prefs';
    localStorage.setItem('academia_perfil_tab', 'prefs');
  }
  if (savedTab) {
    const btn = document.querySelector(`#perfTabNav .t-tab-btn[data-perftab="${savedTab}"]`);
    if (btn) btn.click();
  }

  // Sub-abas de Progressão
  const progNavBtns = document.querySelectorAll('#perfProgressaoSubNav .sub-nav-btn');
  const progSubContents = document.querySelectorAll('#perf-tab-progressao .perf-sub-content');

  progNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(`perf-subtab-${btn.dataset.perfsubtab}`);
      const activeSub = document.querySelector('#perf-tab-progressao .perf-sub-content.active');

      const performSubSwap = () => {
        progNavBtns.forEach(b => b.classList.remove('active'));
        progSubContents.forEach(c => {
          c.classList.remove('active');
          c.style.display = 'none';
        });
        btn.classList.add('active');
        if (target) {
          target.classList.add('active');
          target.style.display = 'block';
          fadeIn(target);
        }
      };

      if (activeSub && activeSub !== target) {
        fadeSwap(activeSub, performSubSwap);
      } else {
        performSubSwap();
      }
    });
  });

  // Sub-abas de Preferências
  const prefNavBtns = document.querySelectorAll('#perfPrefsSubNav .sub-nav-btn');
  const prefSubContents = document.querySelectorAll('#perf-tab-prefs .perf-sub-content');

  prefNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(`perf-subtab2-${btn.dataset.perfsubtab2}`);
      const activeSub = document.querySelector('#perf-tab-prefs .perf-sub-content.active');

      const performSubSwap = () => {
        prefNavBtns.forEach(b => b.classList.remove('active'));
        prefSubContents.forEach(c => {
          c.classList.remove('active');
          c.style.display = 'none';
        });
        btn.classList.add('active');
        if (target) {
          target.classList.add('active');
          target.style.display = 'block';
          fadeIn(target);
        }
      };

      if (activeSub && activeSub !== target) {
        fadeSwap(activeSub, performSubSwap);
      } else {
        performSubSwap();
      }
    });
  });

  // Sub-abas de Personalização
  const personalNavBtns = document.querySelectorAll('#perfPersonalizarSubNav .sub-nav-btn');
  const personalSubContents = document.querySelectorAll('#perf-tab-personalizar .perf-sub-content3');

  personalNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(`perf-subtab3-${btn.dataset.perfsubtab3}`);
      const activeSub = document.querySelector('#perf-tab-personalizar .perf-sub-content3.active');

      const performSubSwap = () => {
        personalNavBtns.forEach(b => b.classList.remove('active'));
        personalSubContents.forEach(c => {
          c.classList.remove('active');
          c.style.display = 'none';
        });
        btn.classList.add('active');
        if (target) {
          target.classList.add('active');
          target.style.display = 'block';
          fadeIn(target);
        }
      };

      if (activeSub && activeSub !== target) {
        fadeSwap(activeSub, performSubSwap);
      } else {
        performSubSwap();
      }
    });
  });

  // ---- Funcionalidades de Segurança e Preferências ----
  // Carregar dados salvos no db.profileCustomization (se houver) ou criar default
  const profile = db.profileCustomization || {};
  
  // Inputs de segurança
  const elNome = document.getElementById('secNome');
  const elHandle = document.getElementById('secHandle');
  const elEmail = document.getElementById('secEmail');
  const elSenha = document.getElementById('secSenha');

  if (elNome) elNome.value = profile.nome || '';
  if (elHandle) elHandle.value = profile.handle || '';
  if (elEmail) elEmail.value = profile.email || '';
  // Senha não restauramos visualmente por segurança (mesmo sendo local)

  const saveSecurityField = (field, inputEl, successMsg) => {
    if (!inputEl) return;
    if (!db.profileCustomization) db.profileCustomization = {};
    db.profileCustomization[field] = inputEl.value;
    localStorage.setItem('academia_treino', JSON.stringify(db)); // Salva no BD principal
    showToast(successMsg, 'success');
  };

  document.getElementById('btnSaveNome')?.addEventListener('click', () => {
    saveSecurityField('nome', elNome, 'Nome atualizado!');
    // Atualizar UI do perfil se necessário
    const profileNameEl = document.querySelector('.profile-name');
    if (profileNameEl && elNome.value) profileNameEl.textContent = elNome.value.toUpperCase();
  });

  document.getElementById('btnSaveHandle')?.addEventListener('click', () => {
    saveSecurityField('handle', elHandle, 'Usuário atualizado!');
    const profileHandleEl = document.querySelector('.profile-handle');
    if (profileHandleEl && elHandle.value) profileHandleEl.innerHTML = `@${elHandle.value.toLowerCase()} • AQUI DESDE 2024`;
  });

  document.getElementById('btnSaveEmail')?.addEventListener('click', () => saveSecurityField('email', elEmail, 'E-mail atualizado!'));
  document.getElementById('btnSaveSenha')?.addEventListener('click', () => {
    saveSecurityField('senha', elSenha, 'Senha salva localmente!');
    elSenha.value = ''; // Limpar após salvar
  });

  // Toggles de Preferências (Salvar no localStorage individualmente por simplicidade)
  const setupToggle = (id, prefKey) => {
    const el = document.getElementById(id);
    if (!el) return;
    // Load
    const val = localStorage.getItem(prefKey);
    if (val !== null) {
      el.checked = val === 'true';
    }
    // Save
    el.addEventListener('change', (e) => {
      localStorage.setItem(prefKey, e.target.checked);
    });
  };

  setupToggle('prefSounds', 'academia_pref_sounds');
  setupToggle('prefVibration', 'academia_pref_vibration');
  setupToggle('prefMessages', 'academia_pref_messages');
  setupToggle('prefOnlineStatus', 'academia_pref_online');

  // Modo Desenvolvedor Toggle
  const devToggle = document.getElementById('devModeToggle');
  if (devToggle) {
    const isDevMode = localStorage.getItem('academia_dev_mode') === 'true';
    devToggle.checked = isDevMode;

    devToggle.addEventListener('change', (e) => {
      const active = e.target.checked;
      localStorage.setItem('academia_dev_mode', active);

      const refreshUI = () => {
        // Re-renderizar conquistas (badges)
        import('./secao-progresso.js').then(m => {
          m.renderBadges(db);
          m.renderRadarChart(db);
        });

        // Re-renderizar maestrias na tela
        import('./secao-treinos.js').then(m => {
          m.updateGlobalMasteryUI(db);
          m.updateDeckMaestriaWidget(db);
          m.renderDeckCollection(db);
          const activeGeral = document.getElementById('maestriaGeralGrid');
          if (activeGeral && activeGeral.offsetParent !== null) {
            m.openMaestriaGeral(db);
          }
        });

        // Aplicar customizações de perfil
        import('./secao-customizacao.js').then(m => {
          m.applyProfileCustomization(db);
          m._renderProfileEmblems(db);
          m.renderProfileShowcase(db);
        });
      };

      if (!active) {
        // Se desativou, reverte os itens não desbloqueados naturalmente
        import('./secao-customizacao.js').then(m => {
          m.checkAndRevertLockedCustomizations(db);
          refreshUI();
        });
      } else {
        refreshUI();
      }

      showToast(active ? 'Modo desenvolvedor ativado!' : 'Modo desenvolvedor desativado!', 'success');
    });
  }
}
