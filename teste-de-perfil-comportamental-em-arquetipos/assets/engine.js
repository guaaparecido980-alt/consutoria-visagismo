/* =============================================================================
   MOTOR DE PONTUAÇÃO — Teste de Perfil Comportamental | Wagner Alves
   -----------------------------------------------------------------------------
   Sem dependências. Sem estado global. Funções puras: as mesmas entradas
   produzem sempre as mesmas saídas, o que torna o resultado auditável e
   testável (ver tests/engine.test.js).

   Roda no navegador (window.MotorTeste) e no Node (require).
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.MotorTeste = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PERFIS = ['rei', 'guerreiro', 'mago', 'amante'];

  /* ---------------------------------------------------------------------------
     1. PONTUAR
     Recebe as perguntas e as respostas ({ q01: 'a', q02: 'c', ... }) e devolve
     a contagem bruta por arquétipo.
     Respostas de perguntas inexistentes ou alternativas inválidas são ignoradas
     em silêncio — nunca derrubam o cálculo.
  --------------------------------------------------------------------------- */
  function pontuar(perguntas, respostas) {
    var placar = { rei: 0, guerreiro: 0, mago: 0, amante: 0 };
    var respondidas = 0;

    perguntas.forEach(function (pergunta) {
      var escolhida = respostas[pergunta.id];
      if (!escolhida) { return; }

      var opcao = null;
      for (var i = 0; i < pergunta.opcoes.length; i++) {
        if (pergunta.opcoes[i].id === escolhida) { opcao = pergunta.opcoes[i]; break; }
      }
      if (!opcao || placar[opcao.arquetipo] === undefined) { return; }

      placar[opcao.arquetipo] += (typeof opcao.peso === 'number' ? opcao.peso : 1);
      respondidas++;
    });

    placar.total = placar.rei + placar.guerreiro + placar.mago + placar.amante;
    placar.respondidas = respondidas;
    return placar;
  }

  /* ---------------------------------------------------------------------------
     2. PERCENTUAIS — método do maior resto (largest remainder).
     Arredondar cada percentual isoladamente produz somas de 99% ou 101%. Aqui:
       a) trunca todos para baixo;
       b) distribui os pontos que faltam para 100 entre os que têm maior resto.
     Garantia: a soma é SEMPRE exatamente 100 (quando há ao menos uma resposta).
  --------------------------------------------------------------------------- */
  function percentuais(placar) {
    var total = placar.total || 0;
    var saida = { rei: 0, guerreiro: 0, mago: 0, amante: 0 };
    if (total <= 0) { return saida; }

    var restos = [];
    var somaBase = 0;

    PERFIS.forEach(function (perfil) {
      var exato = (placar[perfil] / total) * 100;
      var base = Math.floor(exato);
      saida[perfil] = base;
      somaBase += base;
      restos.push({ perfil: perfil, resto: exato - base, bruto: placar[perfil] });
    });

    var faltam = 100 - somaBase;

    /* Desempate estável: maior resto primeiro; em resto igual, maior pontuação
       bruta; persistindo o empate, a ordem canônica dos perfis. Sem isso, dois
       cálculos idênticos poderiam distribuir os pontos de formas diferentes. */
    restos.sort(function (a, b) {
      if (b.resto !== a.resto) { return b.resto - a.resto; }
      if (b.bruto !== a.bruto) { return b.bruto - a.bruto; }
      return PERFIS.indexOf(a.perfil) - PERFIS.indexOf(b.perfil);
    });

    for (var i = 0; i < faltam; i++) {
      saida[restos[i % restos.length].perfil]++;
    }

    return saida;
  }

  /* ---------------------------------------------------------------------------
     3. CLASSIFICAR
     Ordena os perfis e identifica predominante, secundário e empate técnico.

     Sobre o limiar de empate: a especificação original falava em "diferença
     menor que 3 pontos percentuais". Com 30 perguntas, UMA resposta já vale
     3,33 pontos percentuais — ou seja, aquele limiar só dispararia em empate
     exato e nunca funcionaria como pretendido. Aqui o critério é o equivalente
     real e independente do número de perguntas: empate técnico quando a
     diferença bruta é de no máximo UMA resposta.
  --------------------------------------------------------------------------- */
  function classificar(placar, opcoes) {
    opcoes = opcoes || {};
    var margem = typeof opcoes.margemEmpate === 'number' ? opcoes.margemEmpate : 1;

    var ranking = PERFIS.map(function (perfil) {
      return { perfil: perfil, pontos: placar[perfil] || 0 };
    }).sort(function (a, b) {
      if (b.pontos !== a.pontos) { return b.pontos - a.pontos; }
      return PERFIS.indexOf(a.perfil) - PERFIS.indexOf(b.perfil);
    });

    var primario = ranking[0].perfil;
    var secundario = ranking[1].perfil;
    var diferenca = ranking[0].pontos - ranking[1].pontos;

    /* Perfil único: quem pontuou tudo em um só arquétipo não tem secundário
       significativo — os outros três estão zerados. */
    var perfilUnico = ranking[1].pontos === 0 && ranking[0].pontos > 0;

    return {
      ranking: ranking,
      primario: primario,
      secundario: perfilUnico ? null : secundario,
      diferenca: diferenca,
      empateTecnico: !perfilUnico && diferenca <= margem,
      perfilUnico: perfilUnico
    };
  }

  /* ---------------------------------------------------------------------------
     4. CHAVE DE COMBINAÇÃO — "mago+guerreiro". A ordem importa.
  --------------------------------------------------------------------------- */
  function chaveCombinacao(primario, secundario) {
    if (!primario || !secundario || primario === secundario) { return null; }
    return primario + '+' + secundario;
  }

  /* ---------------------------------------------------------------------------
     5. CALCULAR — orquestra tudo e devolve o resultado completo.
  --------------------------------------------------------------------------- */
  function calcular(perguntas, respostas, opcoes) {
    var placar = pontuar(perguntas, respostas);
    var pct = percentuais(placar);
    var classe = classificar(placar, opcoes);

    return {
      versao: (opcoes && opcoes.versao) || null,
      placar: placar,
      percentuais: pct,
      ranking: classe.ranking,
      primario: classe.primario,
      secundario: classe.secundario,
      diferenca: classe.diferenca,
      empateTecnico: classe.empateTecnico,
      perfilUnico: classe.perfilUnico,
      combinacao: chaveCombinacao(classe.primario, classe.secundario),
      completo: placar.respondidas === perguntas.length,
      respondidas: placar.respondidas,
      totalPerguntas: perguntas.length
    };
  }

  /* ---------------------------------------------------------------------------
     6. LINK COMPARTILHÁVEL
     Sem banco de dados, o resultado precisa caber no próprio link. Os quatro
     placares viram um código curto no hash da URL:  #r=1.0-7-10-9-4
     Assim /teste-.../#r=... reconstrói exatamente o mesmo resultado, em
     qualquer navegador, sem servidor.
  --------------------------------------------------------------------------- */
  function codificarResultado(resultado) {
    var p = resultado.placar;
    return [resultado.versao || '1.0', p.rei, p.guerreiro, p.mago, p.amante].join('-');
  }

  function decodificarResultado(codigo) {
    if (typeof codigo !== 'string') { return null; }
    var partes = codigo.split('-');
    if (partes.length !== 5) { return null; }

    var numeros = partes.slice(1).map(function (n) { return parseInt(n, 10); });
    for (var i = 0; i < numeros.length; i++) {
      if (!isFinite(numeros[i]) || numeros[i] < 0 || numeros[i] > 999) { return null; }
    }

    var placar = {
      rei: numeros[0], guerreiro: numeros[1], mago: numeros[2], amante: numeros[3]
    };
    placar.total = placar.rei + placar.guerreiro + placar.mago + placar.amante;
    placar.respondidas = placar.total;
    if (placar.total === 0) { return null; }

    var classe = classificar(placar);
    return {
      versao: partes[0],
      placar: placar,
      percentuais: percentuais(placar),
      ranking: classe.ranking,
      primario: classe.primario,
      secundario: classe.secundario,
      diferenca: classe.diferenca,
      empateTecnico: classe.empateTecnico,
      perfilUnico: classe.perfilUnico,
      combinacao: chaveCombinacao(classe.primario, classe.secundario),
      completo: true,
      respondidas: placar.total,
      totalPerguntas: placar.total
    };
  }

  return {
    PERFIS: PERFIS,
    pontuar: pontuar,
    percentuais: percentuais,
    classificar: classificar,
    chaveCombinacao: chaveCombinacao,
    calcular: calcular,
    codificarResultado: codificarResultado,
    decodificarResultado: decodificarResultado
  };
});
