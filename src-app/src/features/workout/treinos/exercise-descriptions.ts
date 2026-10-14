/**
 * exercise-descriptions.ts — Catálogo de descrições específicas por exercício
 *
 * A interface de detalhes do exercício na aba Montar Ficha (modalCRDetails em
 * TreinosModals.tsx) exibe, nesta ordem de prioridade:
 *   1. `ex.notes` — anotação própria do usuário (campo "Anotações" do formulário);
 *   2. descrição deste catálogo, casada pelo NOME do exercício;
 *   3. fallback genérico por grupo muscular (texto antigo do modal).
 *
 * Chave = nome exato de DEFAULT_EXERCISES (default-data.ts), normalizado
 * (minúsculas, sem acentos, espaços duplicados colapsados) para ser resiliente
 * a diferenças de caixa/acentuação. Exercícios criados pelo usuário que não
 * constam aqui caem no fallback genérico — nada é sobrescrito no banco.
 */

const norm = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** Textos por nome de exercício (pt-BR), na grafia do seed. */
const RAW_DESCRIPTIONS: Record<string, string> = {
  /* ── Peito ── */
  'Supino Articulado':
    'Supino em máquina com trajetória convergente (alças à frente do peito), que reduz a demanda de estabilização e permite focar no peitoral maior. Empurre as alças à frente mantendo os cotovelos a cerca de 45° do tronco e as escápulas retraídas no banco; controle a volta lentamente até quase encostar as alças.',
  'Voador':
    'Isolador de peito em máquina fly: os braços abrem e fecham em arco à frente do corpo, mantendo os cotovelos levemente flexionados e os ombros "para baixo", longe das orelhas. No fechamento, faça uma contração curta do peitoral antes de abrir de novo — evite usar impulso das costas.',
  'Crucifixo':
    'Movimento de abdução e adução do ombro que isola o peitoral sem sobrecarregar punhos e cotovelos. Trabalhando por lado (unilateral), mantenha o tronco firme no banco, leve flexão dos cotovelos e controle a fase excêntrica (a abertura) por 2–3 segundos.',
  'Supino 45°':
    'Supino em banco inclinado a 45° com barra, que desloca a carga para a porção clavicular (peitoral superior) e deltoide anterior. Posicione a barra na linha superior do peito, mantenha os pés firmes no chão e evite arquear a lombar ao empurrar.',
  'Supino Reto':
    'Clássico composto de peito com barra no banco reto: puxe as escápulas para trás, apoie a barra no meio do peito e empurre em arco até a extensão quase completa dos braços, com os cotovelos a ~45° do tronco. Trabalha peitoral maior, deltoide anterior e tríceps.',
  'Supino Reto com Halteres':
    'Variação do supino reto com halteres, que permite amplitude maior (os halteres descem abaixo da linha do peito), trabalho unilateral e mais estabilização. Controle os dois halteres com o mesmo ritmo e não trave os cotovelos no topo.',
  'Flexão de Braços':
    'Flexão com o peso do corpo: mãos na largura levemente maior que os ombros, corpo alinhado da cabeça ao calcanhar (glúteos e abdômen contraídos). Desça até o peito quase tocar o chão, com os cotovelos a ~45° do tronco, e suba sem deixar o quadril ceder.',
  'Infra Paralelo':
    'Flexões em paralelas (dips) inclinando o tronco à frente: desça flexionando os cotovelos até os braços ficarem a ~90° e suba sem travar. Inclinar o tronco recruta mais o peitoral; manter o tronco ereto transfere a carga para o tríceps.',
  'Voo 45°':
    'Voador em banco inclinado a 45°: o ângulo desloca o isolamento para o peitoral superior (porção clavicular). Mantenha os cotovelos levemente flexionados e estáveis durante todo o arco — a força vem do peito, não do movimento dos braços.',

  /* ── Ombros ── */
  'Supino Vertical':
    'Máquina de supino vertical (prensa de peito em pé/vertical): empurre as alças à frente e para cima na altura dos ombros, recrutando peitoral superior e deltoide anterior com o apoio da máquina. Mantenha as costas encostadas no apoio e não tranque os cotovelos no final.',
  'Desenvolvimento Máquina':
    'Press de ombros em máquina: sentado com as costas apoiadas, empurre as alças acima da cabeça até a extensão quase completa e desça até as alças ficarem na altura dos ouvidos. Mantenha o core contraído para não arquear a lombar ao subir.',
  'Desenvolvimento Ombro com Halter':
    'Desenvolvimento sentado ou em pé com um halter em cada mão a altura dos ombros: empurre para cima até os braços ficarem retos (sem travar os cotovelos) e desça controlando até a altura das orelhas. Os halteres permitem amplitude e trabalho unilateral de estabilização.',
  'Desenvolvimento Barra':
    'Military press com barra, em pé ou sentado: barra na altura dos clavículos, pegada um pouco maior que a largura dos ombros. Empurre para cima passando a barra na frente do rosto e estabilize o core — é o principal construtor de força dos ombros.',
  'Desenvolvimento Frontal':
    'Desenvolvimento com barra à frente do rosto (front press), que enfatiza o deltoide anterior e a porção frontal dos ombros. Mantenha os cotovelos ligeiramente à frente da barra e o tronco firme para proteger a lombar.',
  'Elevação Lateral':
    'Isolador do deltoide medial (parte lateral do ombro): eleve os halteres ou a barra até a linha dos ombros com os cotovelos levemente flexionados, como se estivesse "despejando água" para fora. Desça lentamente e não use balanço do tronco.',
  'Elevação Frontal':
    'Isolador do deltoide anterior: eleve a barra ou os halteres à frente do corpo até a altura dos olhos, com cotovelos microflexionados. Desça controlando a gravidade — o movimento é curto; aumentar a amplitude demais transfere a carga para o trapézio.',

  /* ── Costas ── */
  'Puxada Frente':
    'Puxada na frente com barra alta (agarre aberto, pronado): puxe a barra até a linha do peito levando os cotovelos para baixo e para trás, sentado com as coxas presas no apoio. A contração máxima ocorre com o peito "para cima" e as escápulas retraídas.',
  'Puxada Articulada':
    'Máquina de puxada articulada (trajetória fixa): o movimento guiado permite focar na contração do dorsal com menos demanda de estabilização. Puxe as alças em direção ao tronco com os ombros baixos e controle a volta alongando bem.',
  'Puxada Supinada':
    'Puxada em polia alta com pegada supinada (palmas para cima): além do dorsal, transfere boa parte da carga para o bíceps. Puxe até a barra tocar o peito superior, mantendo o tronco levemente reclinado e os ombros longe das orelhas.',
  'Remada Baixa':
    'Remada em polia baixa com barra: com os joelhos levemente flexionados e o tronco estável, puxe a barra até o abdômen levando os cotovelos para trás. Mantenha a coluna neutra — o erro comum é puxar "envergando" as costas em vez dos braços.',
  'Remada Articulada':
    'Máquina de remada articulada com apoio de peito: o peito apoiado remove a lombar da equação e isola as costas. Puxe as alças em direção ao tronco com os cotovelos rentes ao corpo e segure a contração por 1 segundo antes de voltar.',
  'Remada Cavalinho Máquina':
    'Remada em máquina "cavalinho" (T-bar/leverage row) com peito apoiado: puxe o peso em direção ao abdômen com os cotovelos passando do tronco. Excelente para espessura de costas — romboides, trapézio médio e latíssimo trabalham juntos.',
  'Remada Unilateral':
    'Remada com halter ou polia de um lado por vez: apoie o joelho e a mão no banco, mantenha o tronco paralelo ao chão e puxe o halter até o quadril. Corrige assimetrias entre os lados — evite girar o tronco para "puxar" mais peso.',
  'Remada Alta':
    'Remada alta com barra (upright row): puxe a barra até a altura do peito com os cotovelos sempre acima das mãos. Trabalha trapézio e deltoides posteriores/mediais — use carga moderada e não suba acima da linha dos ombros para poupar o ombro.',
  'Pull Down':
    'Puxada em máquina com pegada neutra (palmas uma de frente para a outra): o agarre neutro alivia o punho e permite boa ativação do latíssimo. Puxe até as alças quase tocarem o peito, com os ombros baixos e o peito aberto.',
  'Fly Inverso':
    'Reverse fly em máquina: com o peito apoiado, abra os braços em arco a partir da frente do corpo até a linha dos ombros, atacando deltoides posteriores e romboides. Mantenha os cotovelos microflexionados e os ombros longe das orelhas — é o exercício que corrige a postura de quem só treina "empurrar".',

  /* ── Bíceps ── */
  'Rosca Scoott':
    'Rosca no banco Scott (aparelho): com os braços apoiados na inclinação, suba a barra sem balanço do tronco e desça até quase estender os cotovelos. A apoiadia elimina a impulsão e isola o bíceps com tensão constante.',
  'Rosca Scott Unilateral':
    'Rosca no banco Scott trabalhando um braço por vez: corrija assimetrias entre os lados e foque na contração máxima no topo. Use a mão livre no banco para estabilizar o tronco e não deixar o ombro assumir o movimento.',
  'Rosca 90°':
    'Rosca com o braço travado a 90° no banco Scott: o movimento é curto (pequenas subidas e descidas mantendo o ângulo), o que mantém o bíceps sob tensão constante sem impulso. Excelente para o "pico" da contração e para o trabalho de força isométrica.',
  'Rosca Martelo':
    'Rosca em pé com halteres em pegada neutra (martelo): enfatiza o braquial (entre bíceps e tríceps) e o antebraço. Mantenha os cotovelos colados ao tronco e suba sem girar o punho — o movimento é reto, para cima.',
  'Rosca Direta Barra Livre':
    'Clássica rosca em pé com barra: pegada na largura dos ombros, cotovelos colados ao tronco e tronco firme. Suba a barra até a altura do peito contraindo o bíceps e desça controlando até a extensão quase completa — sem balanço de quadril.',
  'Rosca Direta Cross':
    'Rosca em máquina cross (bodydrag): a pegada e a trajetória da máquina aumentam a contração no topo e aliviam o punho. Mantenha as costas apoiadas e deixe a máquina guiar o movimento — sem impulso.',

  /* ── Tríceps ── */
  'Tríceps Testa + Pull Over':
    'Combinado de duas extensões deitado: a "testa" (extensão de cotovelo com barra/EZ acima da cabeça) e o pull over com halter atrás da cabeça. Juntos, trabalham as três cabeças do tríceps de angulações diferentes — mantenha os cotovelos fixos e apontados para o teto nos dois movimentos.',
  'Tríceps Puller':
    'Máquina puller de tríceps: sentado com as costas apoiadas, extenda os cotovelos empurrando a alça para baixo até quase travar e volte controlando até ~90°. A máquina mantém a carga constante e protege os cotovelos de movimentos com impulso.',
  'Tric Pulley + Palmar':
    'Extensão de tríceps em polia alta: primeira série com pegada neutra (corda ou barra reta) e depois trocando para pegada prona (palma para baixo). A troca de pegada recruta a cabeça lateral do tríceps — mantenha os cotovelos fixos ao lado do corpo.',
  'Trícepes Corda':
    'Pushdown em polia alta com corda: desça até estender os cotovelos abrindo as pontas da corda para fora no final — esse movimento final "trava" a contração da cabeça lateral do tríceps. Cotovelos rentes ao tronco, sem deixar o corpo inclinar para frente.',
  'Triceps Palmar':
    'Extensão de tríceps em polia com pegada prona (palma para baixo na barra reta): o punho em prona muda a ênfase para a cabeça lateral do tríceps. Desça a barra até a extensão completa e volte até ~90°, mantendo os cotovelos colados ao corpo.',
  'Triceps Testa Barra H':
    'Testa deitado no banco reto com barra em H (EZ): a barra curva alivia o punho enquanto os cotovelos ficam fixos apontando para o teto. Desça a barra até quase tocar a testa e suba sem mover os ombros — o movimento é só de extensão do cotovelo.',

  /* ── Pernas ── */
  'Agachamento Livre':
    'Agachamento com barra nas costas: barra no trapézio, peito aberto, olhos à frente e o peso distribuído entre calcanhares e médio-pé. Desça até as coxas ficarem paralelas (ou mais) mantendo a coluna neutra — o principal exercício de força de pernas e glúteos.',
  'Agachamento Guiado':
    'Agachamento na smith (trajetória guiada): a barra segue um trilho fixo, o que permite focar no quadríceps e na profundidade com menos exigência de estabilização. Ajuste a altura do apoio e não deixe os joelhos passarem muito dos pés sem controle.',
  'Agachamento Gaiola':
    'Agachamento em gaiola/hack com barra guiada: com as costas apoiadas e os pés um pouco à frente do corpo, desça até ~90° empurrando o chão com os calcanhares. A estrutura isola o quadríceps com segurança para quem tem limitação de estabilização do agachamento livre.',
  'HACK':
    'Hack squat: máquina com apoio de costas e ombros em que você desce em agachamento com os pés à frente na plataforma. Ótimo para quadríceps com sobrecarga segura — desça até 90° ou um pouco abaixo, sem deixar o quadril descolar do apoio.',
  'Burrinho':
    'Máquina burrinho (prensa vertical): você fica em pé sob a estrutura e empurra a plataforma para cima com as pernas, com os ombros sob as almofadas. Trabalha quadríceps e glúteos com amplitude controlada — evite travar os joelhos no topo.',
  'Leg Press 45°':
    'Leg press em 45°: pés na plataforma na largura dos ombros (ou como preferir o recrutamento), desça até ~90° dos joelhos e empurre sem descolar o quadril do assento. Controlar a descida é o que protege os joelhos — não deixe o peso "cair".',
  'Leg 45°':
    'Leg press 45°: com os pés no meio da plataforma e joelhos acompanhando a direção dos pés, desça até 90° e suba sem travar. Varie a altura dos pés para deslocar a carga entre quadríceps (pés baixos) e glúteos/isquiotibiais (pés altos).',
  'Leg Press 45° + Banco Extenso':
    'Combinado de pernas: uma série de leg press 45° seguida imediatamente de extensora (banco extensor), sem descanso entre eles. A sequência leva o quadríceps à exaustão — use carga menor no extensor para manter a técnica.',
  'Leg Press 180°':
    'Leg press horizontal (180°): sentado com as costas no encosto, empurre a plataforma à frente com as pernas. O ângulo horizontal alivia a lombar em comparação com o 45° — mantenha o quadril colado no banco e controle a volta.',
  'Banco Extensor':
    'Extensora sentada: isola o quadríceps estendendo os joelhos contra a almofada e controlando a descida. Não jogue o peso no retorno — a fase de descer é onde o músculo trabalha mais; mantenha os quadris firmes no banco.',
  'Banco Flexor':
    'Flexora sentada: flexiona os joelhos contra a almofada com os quadris fixos, isolando os isquiotibiais (parte de trás da coxa). Desça até a extensão quase completa e suba sem levantar o quadril do banco.',
  'Mesa Flexora':
    'Mesa flexora (deitado de barriga para baixo): a flexão de joelho contra a almofada com a coxa apoiada alonga mais o isquiotibial do que a flexora sentada. Mantenha o quadril encostado na mesa e evite arquear a lombar na subida.',
  'Panturrilha em Pé':
    'Panturrilha em máquina em pé: suba a plataforma até a máxima contração da panturrilha (subindo nas pontas) e desça até sentir o alongamento completo. A amplitude embaixo é o que faz a diferença — pause 1 segundo no topo.',
  'Panturrilha Livre':
    'Panturrilha com barra em pé: com a barra no trapézio (como no agachamento), suba nas pontas até a máxima contração e desça com controle até alongar. Mantenha os joelhos retos para focar a panturrilha sem impulso da perna.',
  'Panturrilha Leg 45°':
    'Panturrilha no leg press: com os pés na borda inferior da plataforma (só os dedos apoiados), desça os calcanhares até alongar e suba até a ponta. A perna semi-flexionada recruta o sóleo; a reta, o gastrocnêmio.',
  'Banco Abdutor':
    'Abdução de quadril sentado na máquina: abra as pernas contra a almofada, empurrando com a parte externa da coxa, e volte controlando. Isola o glúteo médio — segure a abertura por 1 segundo para maximizar a contração.',
  'Banco Adutor':
    'Adução de quadril sentado: junte as pernas contra as almofadas trabalhando a parte interna da coxa (adutores). Desça até quase encostar os joelhos e suba sem usar o peso do corpo — movimento lento e controlado.',
  'Glúteo 3 Apoio':
    'Elevação de perna em quadrupedia (3 apoios): com joelhos e mãos no chão, eleve uma perna flexionada até a coxa ficar paralela ao chão, contraindo o glúteo no topo. Suba com o glúteo, não com a lombar — evite arquear a coluna.',
  'Abdução Solo':
    'Abdução de quadril em pé (no solo ou com faixa): eleve a perna lateralmente mantendo o tronco firme e o pé voltado para frente, isolando o glúteo médio. Trabalha por lado — não deixe o quadril balançar para compensar.',
  'Flexão de Quadril':
    'Elevação de quadril deitado (glúteo bridge): com os pés apoiados e joelhos flexionados, suba o quadril até formar uma linha dos ombros aos joelhos contraindo glúteos e isquiotibiais. Desça sem encostar totalmente para manter a tensão.',

  /* ── Core ── */
  'Supra Prancha':
    'Abdominal supra (parte superior) na prancha/estação: eleve apenas as escápulas do apoio contraindo o reto abdominal, com o abdômen "furado" para dentro. O movimento é curto — subir muito demais envolve o quadril e tira a tensão do abdômen.',
  'Supra solo':
    'Abdominal supra no solo: deitado de costas com joelhos flexionados e pés no chão, eleve o tronco até as escápulas descolarem, olhando para o teto. Expire subindo e desça controlando — sem puxar o pescoço com as mãos.',
  'Supra Banco':
    'Abdominal supra em banco (inclinado ou abdominal): eleve o tronco contraindo o reto abdominal, com os quadris fixos no apoio. Menos amplitude que no solo, mais tensão constante — mantenha o abdômen contraído o tempo todo.',
  'Infra Solo':
    'Abdominal infra no solo: com as pernas esticadas ou levemente flexionadas, eleve-as até ~90° e desça sem deixar a lombar descolar do chão. A descida lenta é o que treina o abdômen — não jogue as pernas para baixo.',
  'Infra Prancha':
    'Abdominal infra com elevação de pernas: eleve as pernas juntas mantendo os pés altos e o abdômen contraído, descolando o quadril levemente no topo. Trabalha a porção inferior do reto abdominal e os oblíquos estabilizadores.',
  'Supra Solo + Ponte Ventral':
    'Combinado de core: uma série de abdominal supra no solo seguida de ponte ventral (prancha) isométrica até a falha. O supra trabalha o reto abdominal dinamicamente; a ponte o mantém sob tensão estática — a combinação cobre as duas funções do core.',
  'Ponte Ventral':
    'Prancha isométrica: apoie antebraços e pontas dos pés, mantendo o corpo em linha reta da cabeça ao calcanhar com glúteos e abdômen contraídos. Segure o tempo indicado sem deixar o quadril cair ou subir demais — a qualidade da linha vale mais que a duração.',
  'Elevação de Joelho':
    "Elevação de joelhos na estação (captain's chair): com as costas no apoio, eleve os joelhos até o quadril flexionar, contraindo o abdômen inferior. Controle a descida — não deixe as pernas balançarem para usar impulso.",
  'Extensão Lombar':
    'Extensão lombar em máquina: com o quadril apoiado, estenda a coluna elevando o tronco até a linha do corpo, contraindo os eretores da espinha. Movimento curto e controlado — hiperextender demais sobrecarrega as vértebras lombares.',
};

/** Mapa normalizado (chave sem acento/caixa) → descrição. */
export const EXERCISE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(RAW_DESCRIPTIONS).map(([k, v]) => [norm(k), v])
);

/**
 * Retorna a descrição específica do exercício pelo nome, ou `undefined` quando
 * não há entrada no catálogo (exercício criado pelo usuário).
 */
export const getExerciseDescription = (name?: string): string | undefined => {
  if (!name) return undefined;
  return EXERCISE_DESCRIPTIONS[norm(name)];
};
