/* =============================================================================
   DOSSIÊ DE VISAGISMO — BIBLIOTECA DE CONTEÚDO
   Wagner Alves · Visagismo e Imagem Masculina
   -----------------------------------------------------------------------------
   Todo o texto técnico do dossiê vive aqui. Para mudar uma descrição de perfil,
   de formato de rosto ou de tipo de cabelo, edite este arquivo — nenhum outro
   precisa ser tocado.

   Base teórica: visagismo clássico (Philip Hallawell) — linhas faciais e Gestalt,
   os quatro temperamentos humanos e a leitura do formato do crânio.

   REGRA DE OURO DESTE ARQUIVO:
   cada perfil comportamental tem o SEU PRÓPRIO texto. Nada é genérico, nada é
   reaproveitado entre perfis. O que muda o perfil muda o dossiê inteiro.
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.DossieConteudo = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ===========================================================================
     EMBLEMAS — arte original em SVG traçado, sem dependência externa.
     Linha fina dourada, geometria simétrica. Substituem a foto de banco de
     imagens: mais elegante e sem risco de licença.
  =========================================================================== */
  var EMBLEMAS = {
    rei:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 44 L9 22 L21 31 L32 15 L43 31 L55 22 L52 44 Z"/>' +
      '<path d="M12 50 H52"/>' +
      '<circle cx="32" cy="36" r="2.4" fill="currentColor" stroke="none"/>' +
      '</svg>',
    guerreiro:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M32 6 L38 20 V38 H26 V20 Z"/>' +
      '<path d="M20 42 H44"/>' +
      '<path d="M32 42 V58"/>' +
      '<path d="M25 51 H39"/>' +
      '</svg>',
    mago:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="17"/>' +
      '<path d="M32 4 V15 M32 49 V60 M4 32 H15 M49 32 H60"/>' +
      '<path d="M32 22 L37 32 L32 42 L27 32 Z"/>' +
      '</svg>',
    amante:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="24" cy="32" r="14"/>' +
      '<circle cx="40" cy="32" r="14"/>' +
      '<path d="M32 21 V43"/>' +
      '</svg>'
  };

  /* ===========================================================================
     1. PERFIS COMPORTAMENTAIS
     ---------------------------------------------------------------------------
     Cada perfil carrega três blocos independentes:

       perfil        → quem a pessoa é (vai para o slide "Perfil Comportamental")
       direcao       → o que a imagem dela precisa comunicar (slide "Direção de
                       Imagem"), ancorado nas linhas da Gestalt
       proposta      → o rascunho técnico da proposta, já no tom daquele perfil

     O texto do REI é o que o Wagner já entrega em consultoria. Os outros três
     foram escritos no mesmo registro, cada um com a sua própria leitura.
  =========================================================================== */
  var PERFIS = [
    {
      slug: 'rei',
      nome: 'Rei',
      corDestaque: '#c9a227',
      temperamento: 'Sanguíneo',
      essencia: 'presença, influência e relação',
      emblema: EMBLEMAS.rei,

      resumo: 'Comunicativo, envolvente e naturalmente lembrado. A imagem precisa acompanhar o tamanho da presença.',

      descricao:
        'Pessoas com este perfil costumam de fato ser comunicativas e se relacionam com facilidade, ' +
        'carregando como característica ainda o otimismo, o entusiasmo e a capacidade de persuasão. ' +
        'O comportamento, nesse caso, é amigável, entusiasmado e voltado para as relações com outras pessoas. ' +
        'É o tipo de homem que entra na sala e a sala percebe — e é exatamente por isso que a imagem dele ' +
        'não pode ser neutra: ela é a primeira coisa que fala por ele, antes da primeira palavra.',

      palavrasChave: ['Entusiasmo', 'Popularidade', 'Interação'],

      comoOMundoLe:
        'Quem convive com este perfil espera abertura e calor humano. Uma imagem apagada ou dura demais ' +
        'cria ruído: a pessoa entrega no encontro algo diferente do que o visual prometeu.',

      direcao: {
        linha: 'Linhas inclinadas (diagonais)',
        significado:
          'As diagonais expressam movimento, dinamismo e carisma. Elas tiram a imagem da rigidez e ' +
          'traduzem visualmente a energia que este perfil já emite naturalmente.',
        objetivo: 'Traduzir carisma em forma. A imagem precisa ter movimento sem perder o acabamento.',
        corte:
          'Topo trabalhado com altura e inclinação — topete ou volume projetado para cima e para o lado, ' +
          'nunca chapado. Textura em três profundidades para o cabelo ter movimento próprio. ' +
          'Laterais em degradê progressivo, sem linha dura, para que o olhar suba naturalmente até o topo.',
        barba:
          'Barba com desenho diagonal: linha da bochecha inclinada acompanhando o osso zigomático, ' +
          'comprimento graduado (mais curto na lateral, cheio no queixo) e bigode alinhado ao lábio.',
        acabamento:
          'Finalização com brilho controlado e movimento — pomada de fixação média com leve luminosidade. ' +
          'O cabelo deve parecer arrumado, não colado.',
        evitar:
          'Cortes totalmente retos e simétricos, laterais raspadas com linha dura e finalização matte e ' +
          'pesada. Tudo isso apaga o dinamismo e faz a imagem parecer mais fechada do que a pessoa é.'
      },

      proposta:
        'A leitura do seu perfil aponta um homem de presença e relação — e a imagem precisa acompanhar isso. ' +
        'O trabalho será construir movimento: corte com altura no topo, inclinação nas linhas e textura em ' +
        'camadas para o cabelo ganhar vida própria. As laterais entram em degradê progressivo, sem linha dura, ' +
        'para que o olhar suba até o rosto. A barba recebe desenho diagonal acompanhando o osso da bochecha, ' +
        'com comprimento graduado, reforçando o carisma sem endurecer a expressão. A finalização é com fixação ' +
        'média e brilho controlado — arrumado, nunca colado.',

      manutencao: 'Retorno a cada 21 dias. O movimento deste corte se perde antes do comprimento.'
    },

    {
      slug: 'guerreiro',
      nome: 'Guerreiro',
      corDestaque: '#c0663f',
      temperamento: 'Colérico',
      essencia: 'decisão, foco e execução',
      emblema: EMBLEMAS.guerreiro,

      resumo: 'Direto, objetivo e movido a resultado. A imagem precisa comunicar comando à primeira vista.',

      descricao:
        'Pessoas com este perfil costumam de fato ser diretas e decidir rápido, carregando como característica ' +
        'ainda a firmeza, o senso de urgência e a orientação a resultado. O comportamento, nesse caso, é ' +
        'objetivo, competitivo e voltado para a execução — pouca tolerância a rodeios e a processos lentos. ' +
        'É o homem que assume o comando antes de alguém pedir, e a imagem dele precisa deixar isso evidente ' +
        'antes mesmo de ele abrir a boca.',

      palavrasChave: ['Determinação', 'Comando', 'Resultado'],

      comoOMundoLe:
        'Quem convive com este perfil espera firmeza e clareza. Uma imagem macia demais ou mal definida ' +
        'enfraquece a autoridade que ele exerce de fato, e cria uma disputa desnecessária: ele precisa ' +
        'provar com palavras o que a imagem deveria ter afirmado sozinha.',

      direcao: {
        linha: 'Linhas verticais e horizontais',
        significado:
          'As retas comunicam força, estabilidade e determinação. São a linguagem visual do comando: ' +
          'elas afirmam sem precisar gritar.',
        objetivo: 'Acentuar autoridade. Cada contorno da imagem deve ser deliberado e limpo.',
        corte:
          'Corte de forma quadrada: topo com altura firme e linha superior reta, laterais controladas ' +
          'e paralelas, sem afunilar. Textura usada apenas para retirar massa interna — o desenho externo ' +
          'permanece geométrico. Linha da nuca quadrada, marcada.',
        barba:
          'Barba com contorno reto e definido: linha da bochecha alta e horizontal, linha do pescoço ' +
          'quadrada logo acima do pomo de adão. Comprimento uniforme, reforçando o ângulo da mandíbula.',
        acabamento:
          'Finalização matte, sem brilho, com fixação firme. A imagem deve permanecer a mesma às 8h e às 20h.',
        evitar:
          'Ondas soltas, laterais desfiadas sem contorno, barba com linha arredondada e produto brilhante. ' +
          'Suavizam justamente o traço que sustenta a autoridade deste perfil.'
      },

      proposta:
        'A leitura do seu perfil aponta um homem de comando e execução — e a imagem precisa afirmar isso ' +
        'sozinha. O trabalho será construir estrutura: corte de forma quadrada, com linha superior reta e ' +
        'laterais paralelas e controladas, sem afunilar. A textura entra apenas para remover massa interna do ' +
        'fio, mantendo o desenho externo geométrico e o volume sob controle. A linha da nuca fica quadrada e ' +
        'marcada. A barba recebe contorno reto: bochecha alta e horizontal, pescoço em linha quadrada, ' +
        'comprimento uniforme para reforçar o ângulo da mandíbula. A finalização é matte e firme — a imagem ' +
        'precisa ser a mesma no começo e no fim do dia.',

      manutencao: 'Retorno a cada 15 dias. Este desenho vive da linha limpa — linha crescida derruba o efeito.'
    },

    {
      slug: 'mago',
      nome: 'Mago',
      corDestaque: '#5f7d9a',
      temperamento: 'Melancólico',
      essencia: 'análise, critério e profundidade',
      emblema: EMBLEMAS.mago,

      resumo: 'Analítico, criterioso e observador. A imagem precisa comunicar refinamento e domínio técnico.',

      descricao:
        'Pessoas com este perfil costumam de fato ser analíticas e observadoras, carregando como característica ' +
        'ainda o critério, a atenção ao detalhe e a profundidade de raciocínio. O comportamento, nesse caso, é ' +
        'reservado, preciso e voltado para a qualidade da decisão antes da velocidade dela. É o homem que fala ' +
        'pouco e é ouvido quando fala — e a imagem dele precisa ter esse mesmo peso: discreta na aparência, ' +
        'impecável no detalhe.',

      palavrasChave: ['Precisão', 'Critério', 'Profundidade'],

      comoOMundoLe:
        'Quem convive com este perfil repara no acabamento. Uma imagem descuidada contradiz frontalmente ' +
        'a competência que ele demonstra no trabalho — e, neste caso específico, o detalhe malfeito pesa ' +
        'mais do que a ausência de ousadia.',

      direcao: {
        linha: 'Linhas verticais finas e curvas longas',
        significado:
          'A vertical traz elegância e verticalidade ao rosto; a curva longa evita a dureza e transmite ' +
          'profundidade. Juntas, comunicam refinamento intelectual sem frieza.',
        objetivo: 'Elevar o refinamento. O impacto vem do acabamento, não do volume.',
        corte:
          'Corte clássico de comprimento controlado: topo médio penteado para trás ou para o lado com ' +
          'caimento natural, laterais curtas e limpas com transição suave e invisível. Nada de contraste ' +
          'agressivo — a beleza está na continuidade entre as áreas.',
        barba:
          'Barba curta e milimétrica, ou rosto limpo com contorno perfeito. Linhas discretas, sem desenho ' +
          'aparente. Se houver barba, comprimento baixo e uniforme, acompanhando o osso sem criar volume.',
        acabamento:
          'Finalização discreta: cera leve ou óleo, sem brilho evidente. O cabelo deve parecer naturalmente ' +
          'bem cuidado, não produzido.',
        evitar:
          'Volume alto, contrastes marcados entre topo e laterais, barba comprida e produto com brilho. ' +
          'Fazem a imagem parecer buscar atenção — o oposto da autoridade discreta deste perfil.'
      },

      proposta:
        'A leitura do seu perfil aponta um homem de critério e precisão — e a imagem precisa sustentar isso ' +
        'no detalhe. O trabalho será construir refinamento: corte clássico de comprimento controlado, topo ' +
        'médio com caimento natural penteado para trás ou para o lado, laterais curtas e limpas com transição ' +
        'suave e sem contraste agressivo. A textura entra de forma discreta, apenas para o fio cair sozinho no ' +
        'lugar certo. A barba fica curta e milimétrica, com contorno perfeito e sem desenho aparente, ou o ' +
        'rosto totalmente limpo. A finalização é discreta, com cera leve ou óleo — cabelo naturalmente bem ' +
        'cuidado, nunca produzido.',

      manutencao: 'Retorno a cada 18 dias. Este visual depende de acabamento — e acabamento cresce rápido.'
    },

    {
      slug: 'amante',
      nome: 'Amante',
      corDestaque: '#a2586d',
      temperamento: 'Fleumático',
      essencia: 'conexão, constância e acolhimento',
      emblema: EMBLEMAS.amante,

      resumo: 'Estável, empático e confiável. A imagem precisa acolher sem parecer passiva.',

      descricao:
        'Pessoas com este perfil costumam de fato ser estáveis e acessíveis, carregando como característica ' +
        'ainda a empatia, a paciência e a capacidade de sustentar relações longas. O comportamento, nesse caso, ' +
        'é acolhedor, constante e voltado para a harmonia do grupo. É o homem em quem os outros confiam para ' +
        'falar a verdade — e o risco da imagem dele é justamente esse: de tão tranquila, ela pode ser lida ' +
        'como apatia. O trabalho aqui é manter o acolhimento e acrescentar firmeza.',

      palavrasChave: ['Harmonia', 'Constância', 'Confiança'],

      comoOMundoLe:
        'Quem convive com este perfil sente segurança e proximidade. O ponto de atenção é a energia: ' +
        'sem contorno definido, a mesma tranquilidade que gera confiança começa a ser lida como falta ' +
        'de iniciativa.',

      direcao: {
        linha: 'Curvas suaves com contorno definido',
        significado:
          'A curva transmite acolhimento, empatia e acessibilidade. O contorno firme ao redor dela impede ' +
          'que a suavidade vire indefinição — é o equilíbrio exato deste perfil.',
        objetivo: 'Somar firmeza ao acolhimento. Manter a suavidade, eliminar a impressão de apatia.',
        corte:
          'Corte com movimento natural e volume equilibrado: topo com curva suave, sem altura exagerada, ' +
          'respeitando o caimento do fio. As laterais recebem contorno definido e a nuca uma linha limpa — ' +
          'é o contraste entre a curva no topo e a linha firme embaixo que traz energia à imagem.',
        barba:
          'Barba média com contorno bem definido: comprimento que preenche e valoriza o rosto, mas linha ' +
          'da bochecha e do pescoço nitidamente desenhadas. Sem contorno, a barba média envelhece e apaga.',
        acabamento:
          'Finalização leve com textura natural — pomada de fixação suave ou spray texturizador. ' +
          'O cabelo deve manter movimento próprio, sem parecer intocado.',
        evitar:
          'Corte sem contorno nenhum, barba crescida sem linha e ausência total de forma. É o que faz este ' +
          'perfil parecer descuidado quando, na verdade, ele é apenas discreto.'
      },

      proposta:
        'A leitura do seu perfil aponta um homem de constância e confiança — e a imagem precisa somar firmeza ' +
        'a isso. O trabalho será construir equilíbrio: corte com movimento natural, topo em curva suave sem ' +
        'altura exagerada, respeitando o caimento do fio, e volume distribuído de forma uniforme. As laterais ' +
        'recebem contorno definido e a nuca uma linha limpa — é esse contraste entre a curva de cima e a linha ' +
        'firme de baixo que traz energia à imagem. A barba fica média, com comprimento que preenche o rosto, ' +
        'mas com linha da bochecha e do pescoço nitidamente desenhadas. A finalização é leve, com textura ' +
        'natural, mantendo movimento próprio.',

      manutencao: 'Retorno a cada 21 dias, com acerto de contorno de barba a cada 10 dias.'
    }
  ];

  /* ===========================================================================
     2. FORMATOS DE ROSTO
     ---------------------------------------------------------------------------
     Os sete formatos dos modelos 3D do Wagner (visagismo_todas_juntas.blend).
     A imagem de cada um e as linhas desenhadas sobre ela ficam em
     assets/rostos/ — as linhas saem das medidas da própria malha 3D.
  =========================================================================== */
  var ROSTOS = [
    {
      slug: 'oval',
      nome: 'Rosto Oval',
      descricao:
        'Considerado o formato de referência do visagismo: comprimento cerca de uma vez e meia a largura, ' +
        'testa levemente mais larga que o queixo e transições curvas, sem ângulos marcados.',
      comunica:
        'Equilíbrio e proporção. Não impõe nem recua — é o formato que aceita a maior variedade de desenhos ' +
        'sem perder harmonia.',
      estrategia:
        'Como não há proporção a corrigir, o corte passa a ser definido pelo perfil comportamental e não pela ' +
        'geometria. A única regra é preservar a proporção: evitar volume excessivo nas laterais, que encurta ' +
        'visualmente o rosto.',
      barba: 'Praticamente todos os desenhos funcionam. A escolha segue o perfil, não o formato.',
      evitar: 'Franjas pesadas que cobrem a testa e encurtam a proporção natural do rosto.'
    },
    {
      slug: 'redondo',
      nome: 'Rosto Redondo',
      descricao:
        'Largura e comprimento próximos, maçãs do rosto como ponto mais largo, mandíbula pouco angulada e ' +
        'contornos predominantemente curvos.',
      comunica:
        'Acessibilidade e simpatia. As curvas transmitem acolhimento — mas, sem estrutura, podem reduzir a ' +
        'percepção de firmeza.',
      estrategia:
        'Construir altura e retirar largura: volume no topo para alongar verticalmente, laterais curtas e ' +
        'controladas, linhas retas na área do contorno. A vertical é a aliada deste formato.',
      barba:
        'Barba mais cheia no queixo e curta nas laterais, com linha do pescoço quadrada. Cria o ângulo de ' +
        'mandíbula que o formato não tem.',
      evitar: 'Volume nas laterais, cortes arredondados no topo e barba cheia e uniforme — todos alargam ainda mais.'
    },
    {
      slug: 'quadrado',
      nome: 'Rosto Quadrado',
      descricao:
        'Testa larga, mandíbula marcada e de mesma largura da testa, com ângulos bem definidos nos quatro ' +
        'cantos. Comprimento e largura próximos.',
      comunica:
        'Força, determinação e estabilidade. É o formato que a percepção associa imediatamente à autoridade.',
      estrategia:
        'Decidir se o objetivo é acentuar ou equilibrar a força. Para acentuar: linhas retas e corte de forma ' +
        'quadrada. Para equilibrar: textura no topo e transição suave nas laterais, quebrando parte do ângulo.',
      barba:
        'Barba curta a média acompanhando a mandíbula já existente. Se o objetivo for suavizar, contorno ' +
        'levemente arredondado no queixo.',
      evitar: 'Laterais raspadas com linha dura somadas a barba quadrada, se o objetivo não for autoridade máxima.'
    },
    {
      slug: 'retangular',
      nome: 'Rosto Retangular',
      descricao:
        'Mesma angulação do rosto quadrado, porém nitidamente mais comprido que largo. Testa alta e ' +
        'mandíbula reta.',
      comunica:
        'Seriedade e racionalidade. A verticalidade transmite formalidade — em excesso, pode passar distância.',
      estrategia:
        'Reduzir a percepção de comprimento: pouco volume no topo, mais volume controlado nas laterais e, ' +
        'quando o perfil permitir, comprimento na frente para encurtar a testa visualmente.',
      barba:
        'Barba cheia nas laterais e curta no queixo — preenche a largura e interrompe a linha vertical.',
      evitar: 'Topete alto, laterais raspadas e barba longa no queixo. Todos alongam ainda mais o rosto.'
    },
    {
      slug: 'triangular',
      nome: 'Rosto Triangular',
      descricao:
        'Testa estreita e mandíbula larga, com a maior largura na base do rosto. A linha do contorno abre ' +
        'de cima para baixo.',
      comunica:
        'Firmeza e enraizamento. A base forte transmite solidez, mas concentra o peso visual embaixo.',
      estrategia:
        'Equilibrar o peso: volume e largura no topo para compensar a base, laterais curtas na altura da ' +
        'mandíbula. O objetivo é levar o olhar para cima.',
      barba:
        'Barba curta e bem contornada, mais aparada nas laterais da mandíbula. Barba cheia aqui exagera a base.',
      evitar: 'Corte chapado no topo com laterais volumosas — inverte a proporção no sentido errado.'
    },
    {
      slug: 'diamante',
      nome: 'Rosto Diamante',
      descricao:
        'Testa e queixo estreitos com maçãs do rosto largas e altas — o ponto mais largo fica no meio do ' +
        'rosto, criando os dois ângulos que dão nome ao formato.',
      comunica:
        'Sofisticação e presença cinematográfica. É um formato de traço marcante, que pede desenho preciso ' +
        'para não parecer anguloso demais.',
      estrategia:
        'Adicionar largura em cima e embaixo, controlar o meio: volume moderado no topo, laterais curtas na ' +
        'altura das maçãs, comprimento que preencha a linha da mandíbula.',
      barba: 'Barba com preenchimento no queixo e curta nas maçãs. Equilibra as duas pontas estreitas.',
      evitar: 'Laterais volumosas na altura das maçãs, que exageram o ângulo central.'
    },
    {
      slug: 'coracao',
      nome: 'Rosto Coração',
      descricao:
        'Testa larga, maçãs do rosto marcadas e queixo estreito, que afina em ponta. A linha do contorno ' +
        'fecha de cima para baixo, desenhando um coração.',
      comunica:
        'Inteligência e sensibilidade. O peso na parte de cima transmite raciocínio e expressão — sem ' +
        'cuidado, a base estreita pode parecer frágil.',
      estrategia:
        'Reduzir a largura do alto e dar corpo à base: laterais controladas na altura da testa, sem volume ' +
        'excessivo em cima, e comprimento que acompanhe a linha da mandíbula.',
      barba:
        'Barba cheia no queixo é o recurso mais eficaz deste formato — cria largura exatamente onde o rosto afina.',
      evitar: 'Topete muito volumoso e rosto totalmente limpo, que deixam o queixo ainda mais estreito.'
    }
  ];

  /* ===========================================================================
     3. TIPOS DE CABELO — classificação 1A a 4C
  =========================================================================== */
  var CABELOS = [
    { slug: '1a', nome: 'Tipo 1A', grupo: 'Liso',
      descricao: 'Fio liso, fino e sem corpo, que não sustenta forma sozinho. Tende a ficar colado ao couro cabeludo e a apresentar oleosidade mais rápida.',
      manejo: 'Exige corte com muita precisão de linha e produto texturizador em pó ou spray de sal para criar corpo. Comprimento curto a médio funciona melhor.' },
    { slug: '1b', nome: 'Tipo 1B', grupo: 'Liso',
      descricao: 'Fio liso de espessura média, com um pouco mais de corpo que o 1A e caimento regular. Aceita direcionamento, mas volta ao lugar natural com facilidade.',
      manejo: 'Corte com textura moderada e pomada de fixação média. Aceita bem penteados com risca e caimento lateral.' },
    { slug: '1c', nome: 'Tipo 1C', grupo: 'Liso',
      descricao: 'Fio liso e grosso, resistente, com tendência a arrepiar nas pontas. Tem corpo natural e volume próprio.',
      manejo: 'Necessita remoção de massa interna do fio para não ficar pesado. Pomada de fixação firme para controlar as pontas.' },
    { slug: '2a', nome: 'Tipo 2A', grupo: 'Ondulado',
      descricao: 'Ondulação leve, mais próxima do liso, que se define com o comprimento. Volume discreto e caimento natural para baixo.',
      manejo: 'Corte em camadas suaves e finalização leve. Produto pesado demais desfaz a pouca ondulação existente.' },
    { slug: '2b', nome: 'Tipo 2B', grupo: 'Ondulado',
      descricao: 'Nesse tipo de cabelo a definição dos fios forma um "S", porém quando curto é bem mais liso, bem fácil de manusear e possibilita penteados diversos, além de ter volume equilibrado.',
      manejo: 'Aceita bem corte com textura em camadas. Finalizar com o cabelo úmido usando pomada leve preserva o desenho do S.' },
    { slug: '2c', nome: 'Tipo 2C', grupo: 'Ondulado',
      descricao: 'Ondulação marcada, quase cacheada, com volume evidente já na raiz e tendência a frizz em dias úmidos.',
      manejo: 'Corte com remoção de massa interna é essencial. Finalização com creme ou pomada hidratante para controlar frizz sem pesar.' },
    { slug: '3a', nome: 'Tipo 3A', grupo: 'Cacheado',
      descricao: 'Cacho aberto e definido, de circunferência larga, com brilho natural e volume médio a alto.',
      manejo: 'Corte a seco para respeitar o desenho de cada cacho. Finalização com creme leve, sem pente após secar.' },
    { slug: '3b', nome: 'Tipo 3B', grupo: 'Cacheado',
      descricao: 'Cacho médio e fechado, com bastante volume e densidade. Encolhe visivelmente ao secar.',
      manejo: 'Corte precisa considerar o encolhimento. Hidratação frequente e finalização com creme de definição.' },
    { slug: '3c', nome: 'Tipo 3C', grupo: 'Cacheado',
      descricao: 'Cacho apertado em espiral, muito volumoso e denso, com fios finos em grande quantidade.',
      manejo: 'Corte em camadas para distribuir volume. Nunca pentear seco. Hidratação e nutrição alternadas.' },
    { slug: '4a', nome: 'Tipo 4A', grupo: 'Crespo',
      descricao: 'Crespo com curvatura em espiral bem fechada e definida, volume alto e encolhimento acentuado.',
      manejo: 'Corte que respeite o formato do crânio — a forma vem da escultura, não do caimento. Hidratação constante.' },
    { slug: '4b', nome: 'Tipo 4B', grupo: 'Crespo',
      descricao: 'Crespo com curvatura em ângulo, formando "Z" em vez de espiral. Fio frágil e com encolhimento alto.',
      manejo: 'Trabalhar a forma pela escultura do volume. Umectação e nutrição para reduzir quebra.' },
    { slug: '4c', nome: 'Tipo 4C', grupo: 'Crespo',
      descricao: 'Crespo de curvatura muito fechada e pouca definição aparente, com o maior índice de encolhimento e alta densidade.',
      manejo: 'Escultura precisa do volume e contorno impecável. Rotina de hidratação, nutrição e selagem sem exceção.' }
  ];

  /* ===========================================================================
     4. DENSIDADE E COURO CABELUDO
  =========================================================================== */
  var DENSIDADES = [
    { slug: 'baixa', nome: 'Densidade baixa', nota: 'Poucos fios por centímetro. O corte deve criar a ilusão de volume: comprimento curto no topo, contorno mais suave e produto texturizador em pó.' },
    { slug: 'media', nome: 'Densidade média', nota: 'Quantidade equilibrada de fios. Aceita a maioria dos desenhos sem necessidade de compensação.' },
    { slug: 'alta', nome: 'Densidade alta', nota: 'Muitos fios por centímetro. Exige remoção de massa interna para o corte não ficar pesado e perder o desenho externo.' }
  ];

  var COUROS = [
    { slug: 'normal', nome: 'Normal', nota: 'Lavar em dias alternados com xampu suave.' },
    { slug: 'oleoso', nome: 'Oleoso', nota: 'Lavagem diária com xampu de controle de oleosidade. Condicionador apenas do meio para as pontas.' },
    { slug: 'seco', nome: 'Seco', nota: 'Reduzir a frequência de lavagem. Xampu de hidratação e máscara duas vezes por semana.' },
    { slug: 'sensivel', nome: 'Sensível', nota: 'Xampu sem sulfato e água morna. Evitar produto com álcool próximo à raiz.' }
  ];

  /* ===========================================================================
     5. ROTINA DE MANUTENÇÃO — sugestões por tipo de cabelo
     Servem como rascunho: o Wagner ajusta em cada consultoria.
  =========================================================================== */
  var ROTINAS = {
    Liso: [
      'Lavar com xampu adequado ao couro cabeludo em dias alternados.',
      'Condicionador somente do meio para as pontas, evitando a raiz.',
      'Máscara de hidratação 1 vez por semana.',
      'Finalizar com o cabelo úmido: pomada em quantidade pequena, distribuída da raiz para a ponta.',
      'Ao lavar à noite, de manhã usar somente água morna e refazer a finalização.'
    ],
    Ondulado: [
      'Lavar com xampu de hidratação e condicionador juntos, 2 a 3 vezes por semana.',
      'Máscara de hidratação 2 vezes por semana.',
      'Não pentear com o cabelo seco — o desenho da onda se desfaz.',
      'Finalizar com o cabelo úmido, amassando o fio de baixo para cima com pomada leve.',
      'Ao lavar à noite, de manhã usar somente água morna e em seguida a pomada.'
    ],
    Cacheado: [
      'Lavar com xampu sem sulfato 2 vezes por semana; co-wash nos dias intermediários.',
      'Hidratação e nutrição alternadas, 2 vezes por semana.',
      'Desembaraçar somente com o cabelo molhado e com condicionador.',
      'Finalizar com creme de definição no cabelo encharcado, amassando os cachos.',
      'Dormir com o cabelo protegido para preservar a definição por mais dias.'
    ],
    Crespo: [
      'Lavar com xampu sem sulfato 1 a 2 vezes por semana; co-wash entre as lavagens.',
      'Cronograma capilar: hidratação, nutrição e reconstrução em semanas alternadas.',
      'Umectação com óleo vegetal antes da lavagem, 1 vez por semana.',
      'Finalizar sempre com o cabelo molhado, selando com creme e óleo.',
      'Proteger o cabelo para dormir; nunca pentear seco.'
    ]
  };

  /* ===========================================================================
     6. TEXTOS FIXOS DO DOSSIÊ
  =========================================================================== */
  var MARCA = {
    consultor: 'Wagner Alves',
    titulo: 'Visagista e Consultor de Imagem Masculina',
    cidade: 'Curitiba · Paraná',
    site: 'owagneralvessvisagista.com',
    assinaturaFinal: [
      'A SUA IMAGEM DEVE COMUNICAR',
      'ACIMA DE TUDO A SUA PERSONALIDADE.',
      'VOCÊ TEM UM MOTIVO POR SER ÚNICO.'
    ],
    agradecimento: 'OBRIGADO PELA CONFIANÇA!'
  };

  var SUMARIO = [
    { n: '01', titulo: 'Perfil Comportamental', desc: 'Quem você é e como o mundo lê a sua presença.' },
    { n: '02', titulo: 'Direção de Imagem', desc: 'O que a sua imagem precisa comunicar — e por quê.' },
    { n: '03', titulo: 'Análise Facial', desc: 'A leitura geométrica do seu rosto e o que ela pede.' },
    { n: '04', titulo: 'Estrutura do Fio', desc: 'Tipo, densidade e comportamento do seu cabelo.' },
    { n: '05', titulo: 'Projeto Técnico', desc: 'As medidas exatas do corte, em diagrama.' },
    { n: '06', titulo: 'Proposta', desc: 'O que foi executado e a razão técnica de cada decisão.' },
    { n: '07', titulo: 'Referências Visuais', desc: 'A direção estética escolhida para você.' },
    { n: '08', titulo: 'Antes e Depois', desc: 'O resultado, de frente e de perfil.' },
    { n: '09', titulo: 'Manutenção', desc: 'A rotina que sustenta o resultado até o próximo retorno.' }
  ];

  /* ===========================================================================
     HELPERS
  =========================================================================== */
  function acharPerfil(slug) {
    for (var i = 0; i < PERFIS.length; i++) { if (PERFIS[i].slug === slug) return PERFIS[i]; }
    return null;
  }
  function acharRosto(slug) {
    for (var i = 0; i < ROSTOS.length; i++) { if (ROSTOS[i].slug === slug) return ROSTOS[i]; }
    return null;
  }
  function acharCabelo(slug) {
    for (var i = 0; i < CABELOS.length; i++) { if (CABELOS[i].slug === slug) return CABELOS[i]; }
    return null;
  }
  function acharPor(lista, slug) {
    for (var i = 0; i < lista.length; i++) { if (lista[i].slug === slug) return lista[i]; }
    return null;
  }
  function rotinaDe(cabeloSlug) {
    var c = acharCabelo(cabeloSlug);
    return (c && ROTINAS[c.grupo]) ? ROTINAS[c.grupo] : ROTINAS.Liso;
  }

  return {
    PERFIS: PERFIS,
    ROSTOS: ROSTOS,
    CABELOS: CABELOS,
    DENSIDADES: DENSIDADES,
    COUROS: COUROS,
    ROTINAS: ROTINAS,
    MARCA: MARCA,
    SUMARIO: SUMARIO,
    acharPerfil: acharPerfil,
    acharRosto: acharRosto,
    acharCabelo: acharCabelo,
    acharPor: acharPor,
    rotinaDe: rotinaDe
  };
});
