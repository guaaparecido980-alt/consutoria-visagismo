/* =============================================================================
   CONTEÚDO DO TESTE DE PERFIL COMPORTAMENTAL — Wagner Alves
   -----------------------------------------------------------------------------
   Este arquivo concentra TODO o texto do teste. A lógica de pontuação vive em
   engine.js e a interface em app.js — nenhum dos dois precisa ser alterado para
   mudar uma pergunta, um texto de perfil ou uma descrição de combinação.

   Conteúdo 100% original. A estrutura de quatro arquétipos (Rei, Guerreiro,
   Mago, Amante) é um conceito de domínio público na literatura de arquétipos
   (Moore & Gillette, 1990); as perguntas, alternativas, textos, emblemas e a
   matriz de pontuação abaixo foram escritos para este projeto.

   Carrega tanto no navegador (window.ConteudoTeste) quanto no Node (require),
   para que os testes automatizados usem exatamente o mesmo conteúdo do site.
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.ConteudoTeste = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Versão gravada junto de cada resultado. Se as perguntas mudarem, suba a
     versão: um resultado antigo continua sendo lido pela régua com que foi
     respondido. */
  var TEST_VERSION = '1.0';

  /* ---------------------------------------------------------------------------
     EMBLEMAS — arte original, SVG traçado, sem dependência externa.
     Desenhados na mesma linguagem visual do restante do material: linha fina
     dourada, geometria simétrica, nada figurativo.
  --------------------------------------------------------------------------- */
  var EMBLEMAS = {
    rei:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 44 L9 22 L21 31 L32 15 L43 31 L55 22 L52 44 Z"/>' +
      '<path d="M12 50 H52"/>' +
      '<circle cx="32" cy="36" r="2.6" fill="currentColor" stroke="none"/>' +
      '</svg>',
    guerreiro:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M32 6 L38 20 V38 H26 V20 Z"/>' +
      '<path d="M20 42 H44"/>' +
      '<path d="M32 42 V58"/>' +
      '<path d="M25 51 H39"/>' +
      '</svg>',
    mago:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="17"/>' +
      '<path d="M32 4 V15 M32 49 V60 M4 32 H15 M49 32 H60"/>' +
      '<path d="M32 22 L37 32 L32 42 L27 32 Z"/>' +
      '</svg>',
    amante:
      '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="24" cy="32" r="14"/>' +
      '<circle cx="40" cy="32" r="14"/>' +
      '<path d="M32 21 V43"/>' +
      '</svg>'
  };

  /* ---------------------------------------------------------------------------
     OS QUATRO PERFIS
  --------------------------------------------------------------------------- */
  var PERFIS = {
    rei: {
      slug: 'rei',
      nome: 'Rei',
      cor: '#c9a227',
      essencia: 'estrutura, direção e responsabilidade',
      emblema: EMBLEMAS.rei,
      descricaoCurta:
        'Seu resultado indica maior afinidade com um modo de funcionar que busca ordem, direção e responsabilidade antes de qualquer coisa.',
      descricaoLonga:
        'Você tende a ser a pessoa que organiza o campo. Onde os outros veem confusão, você enxerga o que precisa ser definido: quem faz o quê, até quando, dentro de qual limite. Não é um traço de querer mandar — é um desconforto real com a ambiguidade. Você assume o peso da decisão porque sente que alguém precisa assumir, e prefere que esse alguém seja você a ver a coisa andar sem rumo. Isso costuma transmitir segurança para quem está à sua volta, mesmo quando você mesmo não se sente seguro.',
      pontosFortes: [
        { titulo: 'Direção sob incerteza', texto: 'Quando ninguém sabe o que fazer, você define um caminho. Mesmo imperfeito, ele tira o grupo da paralisia — e isso costuma valer mais do que a decisão ideal atrasada.' },
        { titulo: 'Senso de responsabilidade', texto: 'Você raramente entrega o problema para outra pessoa resolver. Assume o que é seu e frequentemente também o que ficou sem dono.' },
        { titulo: 'Capacidade de estruturar', texto: 'Você transforma bagunça em processo. Consegue enxergar as partes de uma situação e colocá-las em uma ordem que outras pessoas conseguem seguir.' },
        { titulo: 'Estabilidade emocional aparente', texto: 'Em momentos de tensão você tende a baixar o tom em vez de subir. As pessoas procuram você quando estão perdidas.' },
        { titulo: 'Visão de conjunto', texto: 'Você pensa no efeito de cada decisão sobre o todo, não apenas sobre a tarefa imediata à sua frente.' }
      ],
      pontosAtencao: [
        { titulo: 'Dificuldade de delegar', texto: 'Um ponto que merece atenção: quando você acredita que só sai bem se passar pelas suas mãos, você vira o gargalo do próprio sistema que construiu.' },
        { titulo: 'Rigidez com o próprio plano', texto: 'Depois de definir uma direção, pode ser custoso admitir que ela mudou. O que era firmeza vira teimosia sem que você perceba a transição.' },
        { titulo: 'Peso carregado em silêncio', texto: 'Você tende a absorver a responsabilidade sem dividir o desgaste. Por fora parece controle; por dentro pode ser esgotamento acumulado.' },
        { titulo: 'Distância involuntária', texto: 'A postura de quem decide pode ser lida como frieza. Nem sempre as pessoas percebem que existe cuidado por trás da firmeza.' },
        { titulo: 'Controle onde não é preciso', texto: 'Nem toda situação exige estrutura. Em alguns contextos, organizar demais tira das pessoas a chance de encontrarem o próprio jeito.' }
      ],
      decisao: 'Você tende a decidir a partir de princípios e consequências. Avalia o impacto sobre o conjunto, define o critério e depois aplica esse critério com consistência. Uma vez tomada, dificilmente revisita a decisão sem um motivo forte — o que traz previsibilidade, mas pode custar velocidade de correção.',
      pressao: 'Sob pressão você tende a fechar o foco e assumir o comando. Reduz o escopo, define prioridade e corta o que não é essencial. Costuma parecer mais calmo do que está. O risco é centralizar demais no momento exato em que precisaria de mais mãos, e sair do episódio com um desgaste que ninguém viu.',
      trabalho: 'Você tende a render mais em ambientes com escopo claro, autonomia real e responsabilidade definida. Funciona bem onde existe algo para estruturar e alguém confiando na sua leitura. Tende a se desgastar onde as regras mudam sem explicação ou onde precisa executar sem entender a lógica por trás.',
      relacionamento: 'Você demonstra cuidado através de confiabilidade: aparece, cumpre, sustenta. Costuma ser o ponto fixo das pessoas próximas. Por outro lado, tende a oferecer soluções quando o outro queria apenas ser escutado, e pode achar difícil mostrar quando é você que está precisando.',
      lideranca: 'Sua liderança nasce da consistência, não do carisma. As pessoas seguem você porque sabem o que esperar. Você define expectativas com clareza e sustenta limites. O desafio é abrir espaço para que outros também decidam — inclusive quando decidirem diferente de você.',
      aprendizado: 'Você aprende melhor quando entende a estrutura antes dos detalhes: para que serve, onde se encaixa, qual a regra. Prefere fundamento sólido a experimentação solta.',
      desenvolvimento: [
        'Escolha uma responsabilidade que hoje é sua e entregue por inteiro para outra pessoa — inclusive o direito de fazer diferente do seu jeito.',
        'Antes de propor a solução, pergunte: "você quer minha opinião ou quer só falar?". A resposta vai surpreender você com frequência.',
        'Defina um momento fixo para revisar decisões antigas. Firmeza com data de revisão continua sendo firmeza.',
        'Diga em voz alta, para alguém, quando o peso estiver grande. Sustentar tudo sozinho não é parte do cargo.'
      ]
    },

    guerreiro: {
      slug: 'guerreiro',
      nome: 'Guerreiro',
      cor: '#c0663f',
      essencia: 'ação, coragem e execução',
      emblema: EMBLEMAS.guerreiro,
      descricaoCurta:
        'Seu resultado indica maior afinidade com um modo de funcionar que privilegia movimento, coragem e entrega — resolver fazendo.',
      descricaoLonga:
        'Você tende a confiar mais no que acontece depois do primeiro passo do que no que foi previsto antes dele. Diante de um impasse, seu instinto é reduzir a conversa e começar: prefere ajustar a rota andando a esperar o mapa completo. Isso costuma tornar você a pessoa que destrava as coisas — quando o grupo trava na análise, você produz o fato novo que muda a discussão. Sua energia aparece principalmente quando existe um obstáculo concreto na frente.',
      pontosFortes: [
        { titulo: 'Capacidade de começar', texto: 'Você transforma intenção em ação num intervalo curto. Enquanto outros ainda avaliam, você já produziu informação real testando.' },
        { titulo: 'Coragem diante do desconforto', texto: 'Você encara conversas difíceis, decisões impopulares e situações que a maioria adia. O confronto não paralisa você.' },
        { titulo: 'Persistência', texto: 'Quando algo importa, você insiste além do ponto em que a maioria desiste. Sua tolerância a esforço prolongado é acima da média.' },
        { titulo: 'Clareza sob caos', texto: 'Situações urgentes tendem a organizar você em vez de desorganizar. Você funciona bem quando o problema é concreto e imediato.' },
        { titulo: 'Franqueza', texto: 'Você diz o que pensa sem rodeios. As pessoas sabem onde pisam com você, o que economiza mal-entendidos.' }
      ],
      pontosAtencao: [
        { titulo: 'Velocidade antes da leitura', texto: 'Um ponto que merece atenção: agir rápido em um problema mal compreendido resolve o sintoma e preserva a causa — que volta depois, maior.' },
        { titulo: 'Impacto da franqueza', texto: 'A mesma objetividade que economiza tempo pode ferir sem intenção. Nem todo mundo processa a verdade direta na mesma velocidade que você.' },
        { titulo: 'Impaciência com processo', texto: 'Etapas que parecem burocracia às vezes são o que sustenta o resultado no longo prazo. Pular todas pode cobrar caro depois.' },
        { titulo: 'Competição fora de hora', texto: 'Transformar em disputa o que era colaboração pode fazer você ganhar a discussão e perder a pessoa.' },
        { titulo: 'Dificuldade de parar', texto: 'Descanso pode ser lido internamente como fraqueza. O corpo costuma cobrar essa conta antes de a agenda cobrar.' }
      ],
      decisao: 'Você tende a decidir rápido e com informação parcial, confiando na sua capacidade de corrigir no caminho. Prefere uma decisão razoável hoje a uma decisão ótima daqui a duas semanas. Isso gera vantagem em ambientes dinâmicos e cobra caro em decisões de difícil reversão — as que merecem justamente o tempo que você não gosta de dar.',
      pressao: 'Sob pressão você acelera. Sua tendência é assumir a carga, aumentar o ritmo e resolver na base do esforço. Isso funciona bem em crises curtas. Em pressões longas, o mesmo mecanismo vira desgaste: você continua puxando quando o problema já não é de velocidade, e sim de direção.',
      trabalho: 'Você tende a render mais onde existe meta clara, autonomia para executar e resultado visível. Funciona bem sob desafio e prazo. Tende a se desgastar em ambientes de reunião longa, decisão lenta e retorno abstrato, onde o esforço não vira nada palpável.',
      relacionamento: 'Você demonstra cuidado agindo: resolve, defende, aparece quando o outro precisa. Sua lealdade costuma ser forte e prática. O ponto delicado é confundir apoio com solução — às vezes a pessoa não queria que você resolvesse, queria que você ficasse.',
      lideranca: 'Sua liderança é por exemplo e por energia. Você puxa a frente e as pessoas seguem o ritmo. Funciona muito bem em arranque e em crise. O desafio é sustentar esse ritmo sem exaurir quem não tem a sua tolerância a esforço, e lembrar que nem todo mundo é motivado por desafio.',
      aprendizado: 'Você aprende fazendo. Manual antes da prática entra pouco; erro na prática fixa muito. Aprende mais rápido quando pode testar e sentir o resultado na hora.',
      desenvolvimento: [
        'Antes de agir, faça uma pergunta a mais: "qual é o problema por trás deste problema?". Um minuto de leitura evita semanas de retrabalho.',
        'Separe as decisões reversíveis das irreversíveis. Nas primeiras, mantenha sua velocidade. Nas segundas, force-se a dormir sobre o assunto.',
        'Quando alguém trouxer um problema, pergunte se quer ajuda ou escuta antes de partir para a solução.',
        'Trate descanso como parte da execução, não como pausa dela. Ritmo sustentável entrega mais no acumulado do que picos seguidos de queda.'
      ]
    },

    mago: {
      slug: 'mago',
      nome: 'Mago',
      cor: '#5f7d9a',
      essencia: 'análise, estratégia e compreensão',
      emblema: EMBLEMAS.mago,
      descricaoCurta:
        'Seu resultado indica maior afinidade com um modo de funcionar que busca entender antes de agir — enxergar o sistema por trás da situação.',
      descricaoLonga:
        'Você tende a tratar cada situação como algo que tem uma lógica a ser descoberta. Antes de responder, procura o mecanismo: por que isso está acontecendo, o que se conecta com o quê, o que aconteceria se mudasse uma variável. Essa leitura costuma fazer você enxergar consequências que os outros só percebem depois. É um traço que gera profundidade e antecipação — e que, no exagero, transforma a compreensão em um fim em si mesma, confortável demais para ser abandonada em favor da ação.',
      pontosFortes: [
        { titulo: 'Leitura de sistema', texto: 'Você enxerga como as partes se conectam. Percebe que o problema visível costuma ser sintoma de algo estrutural em outro lugar.' },
        { titulo: 'Antecipação', texto: 'Você projeta consequências de segunda ordem. Vê o efeito do efeito, o que evita decisões que parecem boas hoje e cobram caro depois.' },
        { titulo: 'Aprendizado rápido', texto: 'Assuntos novos entram com facilidade porque você busca o princípio em vez de decorar o procedimento.' },
        { titulo: 'Criatividade de solução', texto: 'Você encontra caminhos que não estavam na lista. Combina referências de áreas diferentes para resolver o que estava travado.' },
        { titulo: 'Independência de opinião', texto: 'Você não adere a uma ideia por ser popular. Precisa que faça sentido — e isso protege você de erros coletivos.' }
      ],
      pontosAtencao: [
        { titulo: 'Análise que vira adiamento', texto: 'Um ponto que merece atenção: em algum ponto, mais informação para de melhorar a decisão e passa a apenas adiá-la. Esse ponto costuma chegar antes do que parece.' },
        { titulo: 'Distância emocional', texto: 'Entender a emoção do outro não é o mesmo que acolhê-la. Explicar para alguém por que ele está se sentindo assim raramente ajuda quem está sentindo.' },
        { titulo: 'Plano sem execução', texto: 'A satisfação de ter compreendido pode substituir a satisfação de ter feito. Ideias excelentes que não saem do papel não mudam nada.' },
        { titulo: 'Complexidade desnecessária', texto: 'Nem todo problema é profundo. Às vezes a resposta simples é simplesmente a certa, e a elaboração só atrasa.' },
        { titulo: 'Dificuldade de comunicar', texto: 'O raciocínio que é óbvio para você pode ser inacessível para quem não percorreu o mesmo caminho. Boas ideias morrem por não serem traduzidas.' }
      ],
      decisao: 'Você tende a decidir depois de mapear cenários e entender o mecanismo. Busca a decisão que se sustenta no longo prazo, não a que resolve o dia. Isso produz decisões consistentes e defensáveis — e cobra em velocidade, especialmente quando a janela de oportunidade é curta ou quando o custo de esperar é maior que o custo de errar.',
      pressao: 'Sob pressão você tende a recuar para pensar. Sua reação natural é buscar mais dados, mais tempo, mais entendimento — o que é uma vantagem real em problemas complexos e uma desvantagem quando a situação exige resposta imediata. Você raramente perde a cabeça, mas pode perder a janela.',
      trabalho: 'Você tende a render mais onde existe complexidade real, autonomia intelectual e tempo para pensar. Funciona bem em análise de causa, estratégia e problemas que ninguém conseguiu resolver. Tende a se desgastar em rotina repetitiva, execução mecânica e ambientes onde a pergunta "por quê?" incomoda.',
      relacionamento: 'Você demonstra cuidado prestando atenção de verdade: lembra de detalhes, percebe padrões, entende o outro com precisão. Sua presença costuma ser leal e discreta. O ponto delicado é que compreender profundamente não substitui demonstrar — as pessoas precisam ouvir e sentir, não apenas serem entendidas.',
      lideranca: 'Sua liderança é por clareza e visão. Você mostra o mapa e as pessoas entendem para onde estão indo. Funciona muito bem em situações que exigem redirecionamento. O desafio é o ritmo: enquanto você refina, o time espera. Decidir com 70% da informação é uma habilidade a treinar.',
      aprendizado: 'Você aprende partindo do princípio geral para o caso particular. Precisa entender por que funciona antes de aceitar que funciona. Estudo autônomo rende mais para você do que instrução passo a passo.',
      desenvolvimento: [
        'Defina um limite de tempo para analisar antes de começar. Quando o prazo chegar, decida com o que tem — e trate o resto como ajuste de rota.',
        'Escolha uma ideia parada e execute a menor versão possível dela esta semana. Experimento pequeno ensina mais que planejamento grande.',
        'Ao explicar algo, comece pela conclusão e só depois pelo raciocínio. Quem escuta precisa saber onde você vai chegar.',
        'Quando alguém estiver mal, resista à explicação. "Estou aqui" costuma funcionar melhor do que a análise correta da situação.'
      ]
    },

    amante: {
      slug: 'amante',
      nome: 'Amante',
      cor: '#a2586d',
      essencia: 'conexão, sensibilidade e colaboração',
      emblema: EMBLEMAS.amante,
      descricaoCurta:
        'Seu resultado indica maior afinidade com um modo de funcionar que lê pessoas antes de ler situações — o vínculo vem primeiro.',
      descricaoLonga:
        'Você tende a perceber o clima de um ambiente antes do conteúdo do que está sendo dito. Nota quando alguém ficou de fora, quando um silêncio mudou de qualidade, quando a frase dita não é a frase sentida. Essa leitura fina torna você a pessoa que segura o grupo junto — e que costuma ser procurada quando algo dói. Sua motivação raramente é o resultado isolado: é o resultado alcançado com as pessoas certas, de um jeito que não destrua o vínculo no caminho.',
      pontosFortes: [
        { titulo: 'Leitura de pessoas', texto: 'Você percebe estados emocionais com precisão e antecedência. Nota o que não foi dito e costuma acertar sobre o que está acontecendo com alguém.' },
        { titulo: 'Construção de confiança', texto: 'As pessoas se abrem com você rapidamente. Isso cria acesso a informação e a cooperação que outros perfis levam muito mais tempo para obter.' },
        { titulo: 'Mediação natural', texto: 'Você consegue traduzir um lado para o outro em um conflito, porque enxerga a razão parcial de cada um sem precisar eleger um vencedor.' },
        { titulo: 'Colaboração real', texto: 'Você trabalha melhor com pessoas do que apesar delas. Consegue transformar um grupo de indivíduos em algo que funciona junto.' },
        { titulo: 'Presença', texto: 'Você sustenta a companhia de alguém em um momento difícil sem precisar resolver nada. É uma habilidade mais rara do que parece.' }
      ],
      pontosAtencao: [
        { titulo: 'Dificuldade de dizer não', texto: 'Um ponto que merece atenção: aceitar o que não cabe para não frustrar ninguém acaba frustrando a todos depois, inclusive você.' },
        { titulo: 'Conflito adiado', texto: 'Evitar o desconforto imediato costuma custar mais caro do que a conversa difícil feita na hora certa. O não dito não desaparece — acumula.' },
        { titulo: 'Absorção do que é do outro', texto: 'Você tende a carregar o peso emocional alheio como se fosse seu. Empatia sem fronteira vira desgaste crônico.' },
        { titulo: 'Necessidade de aprovação', texto: 'Decisões podem ser influenciadas mais pela reação esperada das pessoas do que pelo que você realmente avalia como certo.' },
        { titulo: 'Limites tardios', texto: 'O limite que você não coloca no começo tende a ser colocado depois, de uma vez e com força acumulada — o que confunde quem está do outro lado.' }
      ],
      decisao: 'Você tende a decidir considerando o efeito sobre as pessoas envolvidas. Consulta, sente o clima, avalia quem será afetado e como. Isso gera decisões que o grupo sustenta de verdade, porque houve adesão real — e cobra em velocidade e, às vezes, em firmeza: a decisão impopular necessária pode demorar mais do que deveria.',
      pressao: 'Sob pressão você tende a se voltar para o grupo: cuidar do clima, segurar quem está quebrando, manter a coisa unida. Costuma ser o que impede o time de rachar. O risco é sustentar todo mundo e não avisar ninguém que você também está no limite — porque cuidar virou automático e pedir cuidado, não.',
      trabalho: 'Você tende a render mais em ambientes colaborativos, com propósito claro e relações saudáveis. Funciona bem onde o trabalho envolve pessoas, confiança e construção conjunta. Tende a se desgastar em ambientes hostis, muito competitivos ou onde o vínculo é tratado como irrelevante — ali seu rendimento cai mesmo com a técnica intacta.',
      relacionamento: 'Relacionamento é o seu terreno mais forte. Você investe, lembra, cuida, sustenta. Cria vínculos profundos e duradouros. O ponto de atenção é o desequilíbrio: você tende a dar mais do que pede, e a perceber tarde demais quando a troca deixou de existir.',
      lideranca: 'Sua liderança é por vínculo e confiança. As pessoas dão o melhor com você porque se sentem vistas. Funciona muito bem em times que precisam de coesão e em momentos de reconstrução. O desafio é a firmeza: cobrar, corrigir e decidir contra a vontade de alguém sem sentir que está traindo a relação.',
      aprendizado: 'Você aprende em relação: conversando, ensinando, discutindo com alguém. Conteúdo isolado rende menos do que troca. Aprende muito rápido quando gosta de quem está ensinando.',
      desenvolvimento: [
        'Pratique o não em situações de baixo risco, para que ele esteja disponível quando o risco for alto.',
        'Antes de aceitar, espere vinte e quatro horas. Boa parte dos "sim" difíceis foi dada rápido demais.',
        'Separe o que é seu do que é do outro. Você pode acompanhar alguém na dor sem assumir a dor como sua.',
        'Faça a conversa difícil enquanto ela ainda é pequena. O custo de adiar cresce mais rápido que o desconforto de encarar.'
      ]
    }
  };

  var ORDEM_PERFIS = ['rei', 'guerreiro', 'mago', 'amante'];

  /* ---------------------------------------------------------------------------
     AS 30 PERGUNTAS
     -----------------------------------------------------------------------------
     Regras seguidas na construção:
     1. Situação concreta, nunca autoavaliação ("você é líder?" está proibido).
     2. As quatro alternativas têm comprimento parecido — alternativa mais longa
        atrai escolha por si só e enviesaria o resultado.
     3. A posição do arquétipo muda a cada pergunta. Nenhuma letra corresponde
        sempre ao mesmo perfil; a distribuição por posição é verificada pelos
        testes automatizados (tests/engine.test.js).
     4. Nenhuma alternativa é "a resposta certa" — todas descrevem um modo
        legítimo de reagir.
  --------------------------------------------------------------------------- */
  var PERGUNTAS = [
    { id: 'q01', categoria: 'Tomada de decisão', texto: 'Uma decisão importante precisa sair hoje, mas falta informação para ter certeza. O que você costuma fazer?', opcoes: [
      { id: 'a', arquetipo: 'rei',       peso: 1, texto: 'Assumo a responsabilidade, defino o caminho e comunico com clareza — mesmo sem certeza.' },
      { id: 'b', arquetipo: 'guerreiro', peso: 1, texto: 'Escolho a opção que dá para corrigir andando e começo imediatamente.' },
      { id: 'c', arquetipo: 'mago',      peso: 1, texto: 'Levanto os cenários possíveis e escolho o que se sustenta melhor no longo prazo.' },
      { id: 'd', arquetipo: 'amante',    peso: 1, texto: 'Converso com quem será afetado antes de fechar qualquer coisa.' }
    ]},
    { id: 'q02', categoria: 'Pressão', texto: 'O prazo apertou e o clima do grupo ficou visivelmente tenso. Sua reação mais provável:', opcoes: [
      { id: 'a', arquetipo: 'guerreiro', peso: 1, texto: 'Puxo a frente, aumento o ritmo e mostro na prática que dá para entregar.' },
      { id: 'b', arquetipo: 'amante',    peso: 1, texto: 'Cuido de quem está travando — destravando a pessoa, o resto anda.' },
      { id: 'c', arquetipo: 'rei',       peso: 1, texto: 'Reorganizo as prioridades e defino com clareza o que vai ficar de fora.' },
      { id: 'd', arquetipo: 'mago',      peso: 1, texto: 'Procuro onde está o gargalo real antes de todo mundo acelerar à toa.' }
    ]},
    { id: 'q03', categoria: 'Conflitos', texto: 'Duas pessoas próximas discordam feio e colocam você no meio. Você tende a:', opcoes: [
      { id: 'a', arquetipo: 'amante',    peso: 1, texto: 'Escutar os dois lados até entender o que cada um está realmente sentindo.' },
      { id: 'b', arquetipo: 'rei',       peso: 1, texto: 'Encerrar a discussão e estabelecer uma regra clara daqui para frente.' },
      { id: 'c', arquetipo: 'guerreiro', peso: 1, texto: 'Dizer com franqueza qual dos dois está errado e encarar o desconforto.' },
      { id: 'd', arquetipo: 'mago',      peso: 1, texto: 'Investigar a causa por trás do desacordo — o motivo aparente raramente é o real.' }
    ]},
    { id: 'q04', categoria: 'Liderança', texto: 'Você recebe um grupo desorganizado, sem processo definido e com prazo curto. Seu primeiro movimento:', opcoes: [
      { id: 'a', arquetipo: 'mago',      peso: 1, texto: 'Entender por que está desorganizado antes de mudar qualquer coisa.' },
      { id: 'b', arquetipo: 'rei',       peso: 1, texto: 'Definir papéis, responsabilidades e prazos logo na primeira conversa.' },
      { id: 'c', arquetipo: 'amante',    peso: 1, texto: 'Conhecer cada pessoa individualmente e criar confiança antes de cobrar.' },
      { id: 'd', arquetipo: 'guerreiro', peso: 1, texto: 'Escolher a entrega mais urgente e começar por ela para gerar movimento.' }
    ]},
    { id: 'q05', categoria: 'Trabalho', texto: 'Ao começar um projeto novo, o que dá mais segurança para você?', opcoes: [
      { id: 'a', arquetipo: 'guerreiro', peso: 1, texto: 'Ter liberdade para executar e uma meta clara para perseguir.' },
      { id: 'b', arquetipo: 'mago',      peso: 1, texto: 'Entender a fundo o contexto e a lógica por trás do que está sendo pedido.' },
      { id: 'c', arquetipo: 'amante',    peso: 1, texto: 'Saber com quem vou trabalhar e sentir que o grupo se dá bem.' },
      { id: 'd', arquetipo: 'rei',       peso: 1, texto: 'Ter escopo, responsabilidades e limites bem definidos desde o início.' }
    ]},
    { id: 'q06', categoria: 'Relacionamentos', texto: 'Alguém próximo chega abalado e começa a desabafar. Você normalmente:', opcoes: [
      { id: 'a', arquetipo: 'rei',       peso: 1, texto: 'Ajudo a organizar a situação e a enxergar os próximos passos possíveis.' },
      { id: 'b', arquetipo: 'amante',    peso: 1, texto: 'Fico junto e escuto, sem pressa de resolver nada.' },
      { id: 'c', arquetipo: 'guerreiro', peso: 1, texto: 'Ofereço ajuda prática e me disponho a agir junto para resolver.' },
      { id: 'd', arquetipo: 'mago',      peso: 1, texto: 'Ajudo a pessoa a entender por que aquilo aconteceu daquele jeito.' }
    ]},
    { id: 'q07', categoria: 'Organização', texto: 'Como o seu dia costuma funcionar melhor?', opcoes: [
      { id: 'a', arquetipo: 'mago',      peso: 1, texto: 'Com blocos livres o suficiente para eu me aprofundar quando algo me prende.' },
      { id: 'b', arquetipo: 'guerreiro', peso: 1, texto: 'Com poucas tarefas, mas as certas — e espaço para atacar o que aparecer.' },
      { id: 'c', arquetipo: 'rei',       peso: 1, texto: 'Com estrutura definida, prioridades claras e horários respeitados.' },
      { id: 'd', arquetipo: 'amante',    peso: 1, texto: 'Com espaço para as pessoas: conversas, trocas e imprevistos de quem precisa.' }
    ]},
    { id: 'q08', categoria: 'Criatividade', texto: 'Diante de um problema que já foi tentado de várias formas sem sucesso, você:', opcoes: [
      { id: 'a', arquetipo: 'amante',    peso: 1, texto: 'Reúno as pessoas envolvidas — a resposta costuma aparecer na conversa.' },
      { id: 'b', arquetipo: 'mago',      peso: 1, texto: 'Questiono se a pergunta está certa; talvez o problema esteja mal formulado.' },
      { id: 'c', arquetipo: 'rei',       peso: 1, texto: 'Volto ao objetivo original e reorganizo o problema a partir dele.' },
      { id: 'd', arquetipo: 'guerreiro', peso: 1, texto: 'Testo uma abordagem nova na prática, mesmo sem garantia de que funciona.' }
    ]},
    { id: 'q09', categoria: 'Mudanças', texto: 'Um plano que estava andando bem precisa mudar completamente. Sua primeira reação:', opcoes: [
      { id: 'a', arquetipo: 'guerreiro', peso: 1, texto: 'Tudo bem — reajusto e sigo. O importante é continuar em movimento.' },
      { id: 'b', arquetipo: 'rei',       peso: 1, texto: 'Preciso entender o que motivou a mudança antes de aceitar refazer.' },
      { id: 'c', arquetipo: 'mago',      peso: 1, texto: 'Já começo a mapear o que a mudança afeta em cadeia.' },
      { id: 'd', arquetipo: 'amante',    peso: 1, texto: 'Penso em como as pessoas envolvidas vão receber isso.' }
    ]},
    { id: 'q10', categoria: 'Riscos', texto: 'Uma oportunidade boa aparece, mas exige decisão rápida e tem risco real. Você:', opcoes: [
      { id: 'a', arquetipo: 'mago',      peso: 1, texto: 'Calculo o pior cenário possível e decido a partir dele.' },
      { id: 'b', arquetipo: 'amante',    peso: 1, texto: 'Converso com alguém de confiança antes de me decidir.' },
      { id: 'c', arquetipo: 'guerreiro', peso: 1, texto: 'Vou. Oportunidade boa raramente espera a hora perfeita.' },
      { id: 'd', arquetipo: 'rei',       peso: 1, texto: 'Avalio se isso compromete os compromissos que já assumi.' }
    ]},
    { id: 'q11', categoria: 'Planejamento', texto: 'Quando você planeja algo importante, o que costuma acontecer?', opcoes: [
      { id: 'a', arquetipo: 'rei',       peso: 1, texto: 'Monto uma estrutura com etapas, prazos e responsáveis definidos.' },
      { id: 'b', arquetipo: 'mago',      peso: 1, texto: 'Exploro várias possibilidades e demoro para fechar em uma só.' },
      { id: 'c', arquetipo: 'amante',    peso: 1, texto: 'Penso primeiro em quem entra junto e em como isso vai funcionar entre nós.' },
      { id: 'd', arquetipo: 'guerreiro', peso: 1, texto: 'Faço um plano curto e parto para a prática — o resto se resolve andando.' }
    ]},
    { id: 'q12', categoria: 'Execução', texto: 'Você está no meio de uma tarefa longa e o entusiasmo inicial passou. O que te faz continuar?', opcoes: [
      { id: 'a', arquetipo: 'amante',    peso: 1, texto: 'As pessoas que contam comigo e o compromisso que assumi com elas.' },
      { id: 'b', arquetipo: 'guerreiro', peso: 1, texto: 'A recusa em desistir. Parar no meio não é uma opção que eu considere.' },
      { id: 'c', arquetipo: 'mago',      peso: 1, texto: 'A curiosidade sobre o que ainda vou descobrir até o final.' },
      { id: 'd', arquetipo: 'rei',       peso: 1, texto: 'A responsabilidade. Eu disse que faria, então será feito.' }
    ]},
    { id: 'q13', categoria: 'Comunicação', texto: 'Você precisa dar uma notícia difícil para alguém. Como costuma fazer?', opcoes: [
      { id: 'a', arquetipo: 'guerreiro', peso: 1, texto: 'Direto ao ponto. Enrolar só aumenta o sofrimento de todo mundo.' },
      { id: 'b', arquetipo: 'rei',       peso: 1, texto: 'Com clareza sobre o fato e sobre o que acontece a partir de agora.' },
      { id: 'c', arquetipo: 'amante',    peso: 1, texto: 'Escolho o momento certo e preparo o terreno antes de dizer.' },
      { id: 'd', arquetipo: 'mago',      peso: 1, texto: 'Explico o contexto e o raciocínio para que a pessoa entenda o porquê.' }
    ]},
    { id: 'q14', categoria: 'Problemas', texto: 'Algo deu errado e ninguém percebeu ainda. Você:', opcoes: [
      { id: 'a', arquetipo: 'rei',       peso: 1, texto: 'Assumo, comunico e apresento junto o plano de correção.' },
      { id: 'b', arquetipo: 'mago',      peso: 1, texto: 'Entendo primeiro a extensão real do estrago antes de falar qualquer coisa.' },
      { id: 'c', arquetipo: 'guerreiro', peso: 1, texto: 'Corrijo imediatamente e depois conto o que aconteceu.' },
      { id: 'd', arquetipo: 'amante',    peso: 1, texto: 'Verifico quem foi prejudicado e cuido disso antes de tudo.' }
    ]},
    { id: 'q15', categoria: 'Metas', texto: 'O que mais te motiva a perseguir um objetivo?', opcoes: [
      { id: 'a', arquetipo: 'mago',      peso: 1, texto: 'A chance de dominar algo que eu ainda não domino.' },
      { id: 'b', arquetipo: 'rei',       peso: 1, texto: 'Construir algo sólido que continue de pé depois.' },
      { id: 'c', arquetipo: 'amante',    peso: 1, texto: 'Conquistar junto com pessoas que importam para mim.' },
      { id: 'd', arquetipo: 'guerreiro', peso: 1, texto: 'A superação em si — provar que era possível.' }
    ]},
    { id: 'q16', categoria: 'Fracasso', texto: 'Depois de um fracasso claro, o que você faz primeiro?', opcoes: [
      { id: 'a', arquetipo: 'guerreiro', peso: 1, texto: 'Levanto e tento de novo rápido, antes que o baque se instale.' },
      { id: 'b', arquetipo: 'mago',      peso: 1, texto: 'Analiso o que exatamente falhou e em que ponto da cadeia.' },
      { id: 'c', arquetipo: 'amante',    peso: 1, texto: 'Converso com alguém sobre o que senti antes de pensar no que fazer.' },
      { id: 'd', arquetipo: 'rei',       peso: 1, texto: 'Avalio o que era minha responsabilidade e assumo a parte que me cabe.' }
    ]},
    { id: 'q17', categoria: 'Sucesso', texto: 'Algo que você conduziu deu muito certo. O que vem à sua cabeça?', opcoes: [
      { id: 'a', arquetipo: 'amante',    peso: 1, texto: 'Quero comemorar com quem construiu isso junto comigo.' },
      { id: 'b', arquetipo: 'guerreiro', peso: 1, texto: 'Já penso no próximo desafio, um pouco maior que este.' },
      { id: 'c', arquetipo: 'mago',      peso: 1, texto: 'Fico tentando identificar o que exatamente fez funcionar.' },
      { id: 'd', arquetipo: 'rei',       peso: 1, texto: 'Penso em como transformar isso em algo que se repita.' }
    ]},
    { id: 'q18', categoria: 'Aprendizado', texto: 'Você precisa dominar um assunto totalmente novo. Como começa?', opcoes: [
      { id: 'a', arquetipo: 'rei',       peso: 1, texto: 'Organizo um plano de estudo com etapas e sigo a estrutura.' },
      { id: 'b', arquetipo: 'guerreiro', peso: 1, texto: 'Vou direto para a prática e aprendo errando.' },
      { id: 'c', arquetipo: 'amante',    peso: 1, texto: 'Procuro alguém que já saiba e aprendo junto, conversando.' },
      { id: 'd', arquetipo: 'mago',      peso: 1, texto: 'Vou fundo na teoria até entender o princípio que sustenta o resto.' }
    ]},
    { id: 'q19', categoria: 'Colaboração', texto: 'Trabalhando em grupo, qual papel você acaba ocupando naturalmente?', opcoes: [
      { id: 'a', arquetipo: 'mago',      peso: 1, texto: 'Quem enxerga o problema de outro ângulo e propõe o caminho.' },
      { id: 'b', arquetipo: 'amante',    peso: 1, texto: 'Quem mantém o grupo unido e percebe quem está ficando de fora.' },
      { id: 'c', arquetipo: 'rei',       peso: 1, texto: 'Quem organiza, distribui e garante que nada fique sem dono.' },
      { id: 'd', arquetipo: 'guerreiro', peso: 1, texto: 'Quem puxa o ritmo e faz a coisa sair do lugar.' }
    ]},
    { id: 'q20', categoria: 'Autonomia', texto: 'Você recebe uma tarefa sem nenhuma instrução de como fazer. Você sente:', opcoes: [
      { id: 'a', arquetipo: 'guerreiro', peso: 1, texto: 'Alívio — prefiro liberdade a manual.' },
      { id: 'b', arquetipo: 'rei',       peso: 1, texto: 'Necessidade de alinhar expectativas antes de começar.' },
      { id: 'c', arquetipo: 'mago',      peso: 1, texto: 'Interesse — vou desenhar o meu próprio método.' },
      { id: 'd', arquetipo: 'amante',    peso: 1, texto: 'Vontade de conversar com alguém para calibrar se estou no caminho.' }
    ]},
    { id: 'q21', categoria: 'Rotina', texto: 'O que mais te incomoda no dia a dia?', opcoes: [
      { id: 'a', arquetipo: 'amante',    peso: 1, texto: 'Ambiente pesado, com gente mal resolvida entre si.' },
      { id: 'b', arquetipo: 'rei',       peso: 1, texto: 'Desorganização e coisas importantes sem responsável definido.' },
      { id: 'c', arquetipo: 'mago',      peso: 1, texto: 'Repetição sem sentido e tarefas que não me ensinam nada.' },
      { id: 'd', arquetipo: 'guerreiro', peso: 1, texto: 'Lentidão, reunião demais e decisão que não sai.' }
    ]},
    { id: 'q22', categoria: 'Inovação', texto: 'Uma forma de fazer as coisas funciona há anos, mas você percebe que dá para melhorar. Você:', opcoes: [
      { id: 'a', arquetipo: 'rei',       peso: 1, texto: 'Proponho a mudança de forma estruturada, com transição planejada.' },
      { id: 'b', arquetipo: 'guerreiro', peso: 1, texto: 'Faço do jeito novo e mostro o resultado — argumento depois.' },
      { id: 'c', arquetipo: 'amante',    peso: 1, texto: 'Sinto primeiro como as pessoas vão reagir a mexer no que está estabelecido.' },
      { id: 'd', arquetipo: 'mago',      peso: 1, texto: 'Estudo por que foi feito assim antes de propor mudar.' }
    ]},
    { id: 'q23', categoria: 'Responsabilidade', texto: 'Um erro do grupo vem à tona e a cobrança chega até você. Sua reação:', opcoes: [
      { id: 'a', arquetipo: 'mago',      peso: 1, texto: 'Explico com precisão o que aconteceu, sem distorcer para nenhum lado.' },
      { id: 'b', arquetipo: 'guerreiro', peso: 1, texto: 'Defendo o grupo de frente e assumo o enfrentamento.' },
      { id: 'c', arquetipo: 'rei',       peso: 1, texto: 'Respondo pelo time. A responsabilidade final é de quem conduz.' },
      { id: 'd', arquetipo: 'amante',    peso: 1, texto: 'Protejo quem errou de exposição desnecessária e trato em particular.' }
    ]},
    { id: 'q24', categoria: 'Autoridade', texto: 'Você discorda de uma decisão de alguém com mais autoridade que você. Você:', opcoes: [
      { id: 'a', arquetipo: 'amante',    peso: 1, texto: 'Escolho um momento reservado para falar, cuidando da relação.' },
      { id: 'b', arquetipo: 'mago',      peso: 1, texto: 'Monto o argumento com dados antes de levantar a questão.' },
      { id: 'c', arquetipo: 'guerreiro', peso: 1, texto: 'Falo na hora. Discordância guardada não serve para nada.' },
      { id: 'd', arquetipo: 'rei',       peso: 1, texto: 'Coloco a posição formalmente e depois sustento a decisão tomada.' }
    ]},
    { id: 'q25', categoria: 'Limites', texto: 'Pedem algo que você não tem condições de assumir agora. Você:', opcoes: [
      { id: 'a', arquetipo: 'guerreiro', peso: 1, texto: 'Digo não sem rodeio e sigo em frente.' },
      { id: 'b', arquetipo: 'amante',    peso: 1, texto: 'Tenho dificuldade em negar e acabo dando um jeito de encaixar.' },
      { id: 'c', arquetipo: 'rei',       peso: 1, texto: 'Explico o que já está sob minha responsabilidade e o que teria de sair.' },
      { id: 'd', arquetipo: 'mago',      peso: 1, texto: 'Avalio o custo real antes de responder qualquer coisa.' }
    ]},
    { id: 'q26', categoria: 'Emoções', texto: 'Quando algo mexe muito com você por dentro, o que costuma acontecer?', opcoes: [
      { id: 'a', arquetipo: 'rei',       peso: 1, texto: 'Mantenho a compostura e cuido disso depois, em particular.' },
      { id: 'b', arquetipo: 'mago',      peso: 1, texto: 'Tento entender de onde vem aquilo antes de sentir por completo.' },
      { id: 'c', arquetipo: 'amante',    peso: 1, texto: 'Sinto intensamente e preciso falar com alguém para processar.' },
      { id: 'd', arquetipo: 'guerreiro', peso: 1, texto: 'Descarrego em atividade — movimento resolve melhor que conversa.' }
    ]},
    { id: 'q27', categoria: 'Prioridades', texto: 'Três coisas importantes competem pelo mesmo tempo. Como você resolve?', opcoes: [
      { id: 'a', arquetipo: 'amante',    peso: 1, texto: 'Priorizo o que envolve compromisso com outra pessoa.' },
      { id: 'b', arquetipo: 'guerreiro', peso: 1, texto: 'Ataco a mais urgente agora e resolvo as outras na sequência.' },
      { id: 'c', arquetipo: 'mago',      peso: 1, texto: 'Analiso qual tem maior consequência se for mal feita.' },
      { id: 'd', arquetipo: 'rei',       peso: 1, texto: 'Aplico meu critério de prioridade e comunico o que vai atrasar.' }
    ]},
    { id: 'q28', categoria: 'Reconhecimento', texto: 'Que tipo de reconhecimento tem mais valor para você?', opcoes: [
      { id: 'a', arquetipo: 'mago',      peso: 1, texto: 'Ser procurado quando o problema é difícil de verdade.' },
      { id: 'b', arquetipo: 'rei',       peso: 1, texto: 'Confiarem em mim algo importante, sem supervisão.' },
      { id: 'c', arquetipo: 'guerreiro', peso: 1, texto: 'Reconhecerem que eu entreguei o que ninguém conseguiu entregar.' },
      { id: 'd', arquetipo: 'amante',    peso: 1, texto: 'Alguém dizer que minha presença fez diferença.' }
    ]},
    { id: 'q29', categoria: 'Incerteza', texto: 'Você está numa situação sem nenhuma previsibilidade. O que mais te incomoda?', opcoes: [
      { id: 'a', arquetipo: 'rei',       peso: 1, texto: 'Não conseguir estabelecer nada firme para me apoiar.' },
      { id: 'b', arquetipo: 'amante',    peso: 1, texto: 'Não saber como as pessoas ao meu redor estão lidando com aquilo.' },
      { id: 'c', arquetipo: 'guerreiro', peso: 1, texto: 'Ter de esperar sem poder agir sobre nada.' },
      { id: 'd', arquetipo: 'mago',      peso: 1, texto: 'Não conseguir enxergar o padrão que explica o que está acontecendo.' }
    ]},
    { id: 'q30', categoria: 'Propósito', texto: 'Pensando no que você gostaria que ficasse do seu trabalho, o que mais te representa?', opcoes: [
      { id: 'a', arquetipo: 'guerreiro', peso: 1, texto: 'Ter provado, na prática, que aquilo era possível de fazer.' },
      { id: 'b', arquetipo: 'amante',    peso: 1, texto: 'Ter marcado a vida das pessoas que passaram por mim.' },
      { id: 'c', arquetipo: 'mago',      peso: 1, texto: 'Ter compreendido e ensinado algo que ninguém tinha enxergado.' },
      { id: 'd', arquetipo: 'rei',       peso: 1, texto: 'Ter construído algo sólido que siga funcionando sem mim.' }
    ]}
  ];

  /* ---------------------------------------------------------------------------
     COMBINAÇÕES — 12 pares (4 predominantes × 3 secundários).
     A ordem importa: o primeiro perfil é o predominante.
  --------------------------------------------------------------------------- */
  var COMBINACOES = {
    'rei+guerreiro': {
      titulo: 'Rei com Guerreiro',
      resumo: 'Você tende a unir estrutura com capacidade de execução: decide e faz acontecer.',
      texto: 'Sua estrutura não fica no papel. Você define a direção e sustenta a execução com energia própria, o que torna você especialmente eficaz em situações que exigem organizar e tocar ao mesmo tempo. O ponto a observar é a dureza: firmeza somada a velocidade pode virar atropelo, e quem está ao lado nem sempre acompanha. Vale checar, de tempos em tempos, se as pessoas estão junto ou apenas obedecendo.'
    },
    'rei+mago': {
      titulo: 'Rei com Mago',
      resumo: 'Você tende a combinar autoridade com profundidade: decide bem porque entende antes.',
      texto: 'Suas decisões costumam ter fundamento real, não apenas posição. Você estrutura a partir da compreensão do sistema, o que gera escolhas consistentes e difíceis de derrubar. O ponto a observar é o ritmo: estrutura e análise juntas tendem a alongar o tempo entre perceber e agir. Nem toda decisão merece o padrão de rigor que você aplica a todas.'
    },
    'rei+amante': {
      titulo: 'Rei com Amante',
      resumo: 'Você tende a liderar sustentando: estrutura com cuidado por quem está dentro dela.',
      texto: 'Você organiza sem desumanizar. Consegue definir limites e ao mesmo tempo manter as pessoas próximas, o que gera lealdade genuína em quem trabalha com você. O ponto a observar é o conflito interno entre firmeza e vínculo: a decisão necessária e impopular pode demorar mais do que deveria, porque você sente o custo dela antes de tomá-la.'
    },
    'guerreiro+rei': {
      titulo: 'Guerreiro com Rei',
      resumo: 'Você tende a agir rápido, mas com senso de responsabilidade sobre o que faz.',
      texto: 'Sua velocidade tem freio próprio. Você avança, mas responde pelo que avança — o que diferencia iniciativa de impulso. Costuma ser a pessoa que entrega e depois sustenta o que entregou. O ponto a observar é a exigência: você cobra de si em velocidade e em responsabilidade ao mesmo tempo, e tende a estender essa régua dupla para os outros sem perceber.'
    },
    'guerreiro+mago': {
      titulo: 'Guerreiro com Mago',
      resumo: 'Você tende a agir rápido, mas com boa leitura da situação antes do movimento.',
      texto: 'Você age antes da maioria, mas raramente às cegas. Consegue ler o suficiente para escolher o alvo certo e então avançar com força — combinação que funciona muito bem em problemas que exigem leitura rápida e resposta imediata. O ponto a observar é a inconstância: nos dias em que a análise vence, você trava; nos dias em que a ação vence, você dispensa a análise que teria ajudado.'
    },
    'guerreiro+amante': {
      titulo: 'Guerreiro com Amante',
      resumo: 'Você tende a agir com força, mas movido por pessoas mais do que por metas.',
      texto: 'Sua energia tem endereço: você se move com mais intensidade quando há alguém no outro lado. É um perfil de proteção — enfrenta o que for preciso por quem está sob seu cuidado. O ponto a observar é o desgaste: você tende a lutar batalhas que não são suas e a absorver o custo emocional delas junto com o esforço físico.'
    },
    'mago+rei': {
      titulo: 'Mago com Rei',
      resumo: 'Você tende a compreender profundamente e a transformar isso em estrutura.',
      texto: 'Você não fica só na ideia: consegue converter entendimento em organização, método e processo. É o perfil de quem desenha o sistema que outras pessoas vão operar. O ponto a observar é o distanciamento da prática: quanto mais tempo você passa no plano do desenho, mais o desenho pode se afastar da realidade de quem executa.'
    },
    'mago+guerreiro': {
      titulo: 'Mago com Guerreiro',
      resumo: 'Você tende a unir visão estratégica com capacidade real de execução.',
      texto: 'Você enxerga o caminho e ainda consegue percorrê-lo. É a combinação que transforma análise em resultado, rara justamente porque as duas coisas costumam se atrapalhar. Quando o Guerreiro te empurra, o Mago já escolheu a direção certa. O ponto a observar é a alternância: garanta que a fase de análise tenha prazo, ou o Guerreiro acaba agindo por impaciência em vez de por decisão.'
    },
    'mago+amante': {
      titulo: 'Mago com Amante',
      resumo: 'Você tende a entender profundamente — inclusive as pessoas.',
      texto: 'Sua análise inclui a variável humana, que a maioria dos perfis analíticos ignora. Você percebe o sistema e também o que ele provoca em quem vive dentro dele — leitura valiosa em qualquer contexto que envolva mudança e gente. O ponto a observar é a ação: os dois perfis tendem a esperar, um por mais informação, o outro pelo momento certo. Somados, podem adiar indefinidamente.'
    },
    'amante+rei': {
      titulo: 'Amante com Rei',
      resumo: 'Você tende a cuidar das pessoas dando a elas estrutura e segurança.',
      texto: 'Seu cuidado é organizado: você sustenta as pessoas oferecendo previsibilidade, clareza e um lugar definido. É o perfil de quem cria ambientes onde os outros se sentem seguros para funcionar. O ponto a observar é o acúmulo: você tende a assumir tanto o vínculo quanto a responsabilidade, e essa soma pesa muito mais do que você costuma admitir.'
    },
    'amante+guerreiro': {
      titulo: 'Amante com Guerreiro',
      resumo: 'Você tende a cuidar agindo: resolve, defende e aparece.',
      texto: 'Você demonstra afeto em atos concretos. Quando alguém que importa está em dificuldade, você não teoriza — entra e resolve. Sua lealdade é prática e visível. O ponto a observar é o limite: essa combinação tem enorme dificuldade em dizer não e tende a se colocar em desgaste por pessoas que não fariam o mesmo por você.'
    },
    'amante+mago': {
      titulo: 'Amante com Mago',
      resumo: 'Você tende a sentir com profundidade e a compreender o que sente.',
      texto: 'Você combina sensibilidade com capacidade de leitura, o que costuma tornar você uma referência para quem está confuso. Percebe o que a pessoa sente e ainda consegue nomear o que está acontecendo. O ponto a observar é o excesso de mundo interno: sentir muito e analisar muito pode virar ruminação, um ciclo que consome energia sem produzir movimento.'
    }
  };

  /* Texto usado quando primeiro e segundo perfis estão tecnicamente empatados. */
  function textoEquilibrio(a, b) {
    return 'Você apresenta um perfil bastante equilibrado entre ' + PERFIS[a].nome +
      ' e ' + PERFIS[b].nome + '. A diferença entre os dois ficou dentro da margem do teste, ' +
      'o que indica que nenhum dos dois domina de forma clara o seu modo de funcionar. ' +
      'Na prática, isso costuma significar que você alterna entre os dois conforme o contexto — ' +
      'e que vale observar qual deles aparece quando a situação aperta.';
  }

  return {
    TEST_VERSION: TEST_VERSION,
    PERFIS: PERFIS,
    ORDEM_PERFIS: ORDEM_PERFIS,
    PERGUNTAS: PERGUNTAS,
    COMBINACOES: COMBINACOES,
    EMBLEMAS: EMBLEMAS,
    textoEquilibrio: textoEquilibrio
  };
});
