/* =============================================================================
   TESTES AUTOMATIZADOS — motor de pontuação e integridade do conteúdo
   -----------------------------------------------------------------------------
   Rodar:  node tests/engine.test.js
   Sem dependências externas: usa apenas o Node.
============================================================================= */
'use strict';

var motor = require('../assets/engine.js');
var conteudo = require('../assets/content.js');

var passou = 0;
var falhou = 0;
var falhas = [];

function ok(condicao, descricao, detalhe) {
  if (condicao) {
    passou++;
    console.log('  ✓ ' + descricao);
  } else {
    falhou++;
    falhas.push(descricao + (detalhe ? '  ->  ' + detalhe : ''));
    console.log('  ✗ ' + descricao + (detalhe ? '  ->  ' + detalhe : ''));
  }
}

function igual(recebido, esperado, descricao) {
  ok(recebido === esperado, descricao, 'esperado ' + JSON.stringify(esperado) + ', veio ' + JSON.stringify(recebido));
}

function grupo(nome) { console.log('\n' + nome); }

/* Helper: monta respostas escolhendo, em cada pergunta, a alternativa do
   arquétipo pedido. Permite construir qualquer placar desejado. */
function responderComo(plano) {
  var respostas = {};
  var indice = 0;
  var sequencia = [];
  Object.keys(plano).forEach(function (perfil) {
    for (var i = 0; i < plano[perfil]; i++) { sequencia.push(perfil); }
  });

  conteudo.PERGUNTAS.forEach(function (pergunta) {
    var alvo = sequencia[indice++];
    if (!alvo) { return; }
    for (var i = 0; i < pergunta.opcoes.length; i++) {
      if (pergunta.opcoes[i].arquetipo === alvo) {
        respostas[pergunta.id] = pergunta.opcoes[i].id;
        return;
      }
    }
  });
  return respostas;
}

function somaPct(p) { return p.rei + p.guerreiro + p.mago + p.amante; }

/* ===========================================================================
   1. INTEGRIDADE DO CONTEÚDO
=========================================================================== */
grupo('1. Integridade do conteudo');

igual(conteudo.PERGUNTAS.length, 30, '30 perguntas');

var todasCom4 = conteudo.PERGUNTAS.every(function (q) { return q.opcoes.length === 4; });
ok(todasCom4, 'toda pergunta tem exatamente 4 alternativas');

var todosArquetiposPorPergunta = conteudo.PERGUNTAS.every(function (q) {
  var vistos = q.opcoes.map(function (o) { return o.arquetipo; }).sort().join(',');
  return vistos === 'amante,guerreiro,mago,rei';
});
ok(todosArquetiposPorPergunta, 'cada pergunta cobre os 4 arquetipos, sem repetir');

var idsUnicos = new Set(conteudo.PERGUNTAS.map(function (q) { return q.id; })).size === 30;
ok(idsUnicos, 'ids das perguntas sao unicos');

var textosUnicos = new Set(conteudo.PERGUNTAS.map(function (q) { return q.texto; })).size === 30;
ok(textosUnicos, 'nenhuma pergunta repetida');

var todasOpcoes = [];
conteudo.PERGUNTAS.forEach(function (q) {
  q.opcoes.forEach(function (o) { todasOpcoes.push(o.texto); });
});
ok(new Set(todasOpcoes).size === todasOpcoes.length, 'nenhuma alternativa repetida entre as 120');

/* A posição não pode denunciar o arquétipo. */
grupo('2. A posicao da alternativa nao entrega o arquetipo');

var porPosicao = { rei: [0,0,0,0], guerreiro: [0,0,0,0], mago: [0,0,0,0], amante: [0,0,0,0] };
conteudo.PERGUNTAS.forEach(function (q) {
  q.opcoes.forEach(function (o, i) { porPosicao[o.arquetipo][i]++; });
});

Object.keys(porPosicao).forEach(function (perfil) {
  var dist = porPosicao[perfil];
  var max = Math.max.apply(null, dist);
  ok(max <= 12, perfil + ' nunca domina uma posicao (max ' + max + ' de 30, letras: ' + dist.join('/') + ')');
});

var algumaPosicaoFixa = Object.keys(porPosicao).some(function (perfil) {
  return porPosicao[perfil].some(function (n) { return n === 30; });
});
ok(!algumaPosicaoFixa, 'nenhum arquetipo esta sempre na mesma letra');

/* Viés de comprimento: a alternativa mais longa atrai escolha. */
grupo('3. Viés de comprimento entre alternativas');

var piorDesvio = 0;
conteudo.PERGUNTAS.forEach(function (q) {
  var tamanhos = q.opcoes.map(function (o) { return o.texto.length; });
  var desvio = Math.max.apply(null, tamanhos) - Math.min.apply(null, tamanhos);
  if (desvio > piorDesvio) { piorDesvio = desvio; }
});
ok(piorDesvio <= 40, 'diferenca de tamanho dentro de cada pergunta <= 40 chars (pior: ' + piorDesvio + ')');

var mediaPorPerfil = {};
['rei','guerreiro','mago','amante'].forEach(function (perfil) {
  var tam = [];
  conteudo.PERGUNTAS.forEach(function (q) {
    q.opcoes.forEach(function (o) { if (o.arquetipo === perfil) { tam.push(o.texto.length); } });
  });
  mediaPorPerfil[perfil] = tam.reduce(function (a,b){ return a+b; }, 0) / tam.length;
});
var medias = Object.keys(mediaPorPerfil).map(function (k) { return mediaPorPerfil[k]; });
var spread = Math.max.apply(null, medias) - Math.min.apply(null, medias);
ok(spread <= 12, 'nenhum arquetipo tem alternativas sistematicamente mais longas (spread ' + spread.toFixed(1) + ' chars)');

/* ===========================================================================
   4. PERFIL DOMINANTE  (exemplo da especificação, secao 42)
=========================================================================== */
grupo('4. Perfil dominante — exemplo da especificacao');

var r = motor.calcular(conteudo.PERGUNTAS, responderComo({ rei: 7, guerreiro: 10, mago: 9, amante: 4 }), { versao: '1.0' });

igual(r.placar.rei, 7, 'placar rei = 7');
igual(r.placar.guerreiro, 10, 'placar guerreiro = 10');
igual(r.placar.mago, 9, 'placar mago = 9');
igual(r.placar.amante, 4, 'placar amante = 4');
igual(r.placar.total, 30, 'total = 30');
igual(r.primario, 'guerreiro', 'predominante = Guerreiro');
igual(r.secundario, 'mago', 'secundario = Mago');
igual(r.combinacao, 'guerreiro+mago', 'combinacao = guerreiro+mago');
igual(r.completo, true, 'marcado como completo');
igual(somaPct(r.percentuais), 100, 'percentuais somam 100');
igual(r.percentuais.guerreiro, 33, 'guerreiro = 33% (33,33 truncado)');
igual(r.percentuais.mago, 30, 'mago = 30%');

/* ===========================================================================
   5. ARREDONDAMENTO — a soma tem de ser 100 em TODOS os casos possiveis
=========================================================================== */
grupo('5. Arredondamento (varredura exaustiva)');

var combinacoesTestadas = 0;
var somasErradas = [];
for (var a = 0; a <= 30; a++) {
  for (var b = 0; a + b <= 30; b++) {
    for (var c = 0; a + b + c <= 30; c++) {
      var d = 30 - a - b - c;
      var placar = { rei: a, guerreiro: b, mago: c, amante: d, total: 30 };
      var pct = motor.percentuais(placar);
      combinacoesTestadas++;
      if (somaPct(pct) !== 100) {
        somasErradas.push(JSON.stringify(placar) + ' => ' + somaPct(pct));
      }
    }
  }
}
ok(somasErradas.length === 0,
   'todas as ' + combinacoesTestadas + ' distribuicoes possiveis de 30 respostas somam exatamente 100%',
   somasErradas.slice(0, 3).join(' | '));

/* Casos classicos que quebram arredondamento ingenuo */
igual(somaPct(motor.percentuais({ rei: 1, guerreiro: 1, mago: 1, amante: 0, total: 3 })), 100, '1/1/1/0 (33,33 x3) soma 100');
igual(somaPct(motor.percentuais({ rei: 1, guerreiro: 1, mago: 1, amante: 1, total: 4 })), 100, '1/1/1/1 (25 x4) soma 100');
igual(somaPct(motor.percentuais({ rei: 7, guerreiro: 8, mago: 7, amante: 8, total: 30 })), 100, '7/8/7/8 soma 100');

var det1 = motor.percentuais({ rei: 8, guerreiro: 8, mago: 7, amante: 7, total: 30 });
var det2 = motor.percentuais({ rei: 8, guerreiro: 8, mago: 7, amante: 7, total: 30 });
ok(JSON.stringify(det1) === JSON.stringify(det2), 'calculo e deterministico (mesma entrada, mesma saida)');

/* ===========================================================================
   6. 100% EM UM UNICO PERFIL
=========================================================================== */
grupo('6. Cem por cento em um perfil');

var puro = motor.calcular(conteudo.PERGUNTAS, responderComo({ mago: 30 }), { versao: '1.0' });
igual(puro.percentuais.mago, 100, 'mago = 100%');
igual(somaPct(puro.percentuais), 100, 'soma continua 100');
igual(puro.primario, 'mago', 'predominante = Mago');
igual(puro.secundario, null, 'sem secundario (os outros tres zerados)');
igual(puro.combinacao, null, 'sem combinacao');
igual(puro.perfilUnico, true, 'sinalizado como perfil unico');

/* ===========================================================================
   7. EMPATE TECNICO
=========================================================================== */
grupo('7. Empate tecnico');

var empateExato = motor.calcular(conteudo.PERGUNTAS, responderComo({ rei: 10, guerreiro: 10, mago: 5, amante: 5 }));
igual(empateExato.empateTecnico, true, 'empate exato (10 x 10) detectado');
igual(empateExato.diferenca, 0, 'diferenca = 0');

var empatePorUma = motor.calcular(conteudo.PERGUNTAS, responderComo({ rei: 11, guerreiro: 10, mago: 5, amante: 4 }));
igual(empatePorUma.empateTecnico, true, 'diferenca de 1 resposta conta como empate tecnico');

var semEmpate = motor.calcular(conteudo.PERGUNTAS, responderComo({ rei: 12, guerreiro: 10, mago: 5, amante: 3 }));
igual(semEmpate.empateTecnico, false, 'diferenca de 2 respostas NAO e empate');
igual(semEmpate.primario, 'rei', 'com diferenca real, o predominante e mantido');

/* A regra original ("< 3 pontos percentuais") seria inutil: prova numerica. */
var pctEmpate = motor.percentuais({ rei: 11, guerreiro: 10, mago: 5, amante: 4, total: 30 });
var difPP = pctEmpate.rei - pctEmpate.guerreiro;
ok(difPP >= 3, 'uma unica resposta ja vale ' + difPP + 'pp — confirma que o limiar de 3pp da especificacao nao funcionaria');

/* ===========================================================================
   8. RESULTADO EQUILIBRADO
=========================================================================== */
grupo('8. Resultado equilibrado');

var equil = motor.calcular(conteudo.PERGUNTAS, responderComo({ rei: 8, guerreiro: 8, mago: 7, amante: 7 }));
igual(somaPct(equil.percentuais), 100, 'percentuais somam 100');
igual(equil.empateTecnico, true, 'perfil equilibrado sinaliza empate tecnico');
ok(equil.ranking[0].pontos - equil.ranking[3].pontos <= 1, 'nenhum perfil se destaca');

/* ===========================================================================
   9. TODAS AS 12 COMBINACOES EXISTEM E SAO ALCANCAVEIS
=========================================================================== */
grupo('9. Combinacoes');

igual(Object.keys(conteudo.COMBINACOES).length, 12, '12 combinacoes cadastradas');

var perfis = ['rei', 'guerreiro', 'mago', 'amante'];
var faltando = [];
perfis.forEach(function (p1) {
  perfis.forEach(function (p2) {
    if (p1 === p2) { return; }
    var chave = motor.chaveCombinacao(p1, p2);
    if (!conteudo.COMBINACOES[chave]) { faltando.push(chave); }
  });
});
ok(faltando.length === 0, 'toda combinacao possivel tem texto proprio', faltando.join(', '));

var comTextoProprio = Object.keys(conteudo.COMBINACOES).every(function (k) {
  var c = conteudo.COMBINACOES[k];
  return c.titulo && c.resumo && c.texto && c.texto.length > 200;
});
ok(comTextoProprio, 'toda combinacao tem titulo, resumo e texto detalhado');

var resumosUnicos = new Set(Object.keys(conteudo.COMBINACOES).map(function (k) {
  return conteudo.COMBINACOES[k].texto;
})).size === 12;
ok(resumosUnicos, 'os 12 textos de combinacao sao diferentes entre si');

/* rei+mago e mago+rei precisam ser textos distintos (a ordem importa) */
ok(conteudo.COMBINACOES['rei+mago'].texto !== conteudo.COMBINACOES['mago+rei'].texto,
   'a ordem importa: rei+mago difere de mago+rei');

/* ===========================================================================
   10. CONTEUDO DOS 4 PERFIS COMPLETO
=========================================================================== */
grupo('10. Conteudo dos perfis');

var camposObrigatorios = ['nome','slug','descricaoCurta','descricaoLonga','decisao',
  'pressao','trabalho','relacionamento','lideranca','aprendizado','emblema'];

perfis.forEach(function (p) {
  var perfil = conteudo.PERFIS[p];
  var faltantes = camposObrigatorios.filter(function (campo) { return !perfil[campo]; });
  ok(faltantes.length === 0, p + ': todos os campos de texto preenchidos', faltantes.join(', '));
  ok(perfil.pontosFortes.length >= 5, p + ': pelo menos 5 pontos fortes (' + perfil.pontosFortes.length + ')');
  ok(perfil.pontosAtencao.length >= 5, p + ': pelo menos 5 pontos de atencao (' + perfil.pontosAtencao.length + ')');
  ok(perfil.desenvolvimento.length >= 3, p + ': pelo menos 3 recomendacoes (' + perfil.desenvolvimento.length + ')');
});

/* Linguagem: nada de determinismo nem diagnostico. */
grupo('11. Linguagem nao determinista');

var textoTodo = JSON.stringify(conteudo.PERFIS) + JSON.stringify(conteudo.COMBINACOES);
var proibidas = ['você é definitivamente', 'você é um ', 'diagnóstico', 'cientificamente comprovado', 'cientificamente validado'];
var encontradas = proibidas.filter(function (termo) {
  return textoTodo.toLowerCase().indexOf(termo) !== -1;
});
ok(encontradas.length === 0, 'sem linguagem determinista ou clinica nos textos', encontradas.join(', '));

var usaTendencia = (textoTodo.match(/tende a|tendência|costuma/gi) || []).length;
ok(usaTendencia >= 40, 'linguagem de tendencia usada de forma consistente (' + usaTendencia + ' ocorrencias)');

/* ===========================================================================
   12. LINK COMPARTILHAVEL (ida e volta)
=========================================================================== */
grupo('12. Codificacao do resultado no link');

var original = motor.calcular(conteudo.PERGUNTAS, responderComo({ rei: 7, guerreiro: 10, mago: 9, amante: 4 }), { versao: '1.0' });
var codigo = motor.codificarResultado(original);
igual(codigo, '1.0-7-10-9-4', 'codigo gerado');

var voltou = motor.decodificarResultado(codigo);
igual(voltou.primario, original.primario, 'predominante sobrevive ao link');
igual(voltou.secundario, original.secundario, 'secundario sobrevive ao link');
igual(voltou.combinacao, original.combinacao, 'combinacao sobrevive ao link');
igual(JSON.stringify(voltou.percentuais), JSON.stringify(original.percentuais), 'percentuais identicos');
igual(voltou.versao, '1.0', 'versao do teste preservada');

ok(motor.decodificarResultado('lixo') === null, 'codigo invalido devolve null');
ok(motor.decodificarResultado('1.0-0-0-0-0') === null, 'codigo zerado devolve null');
ok(motor.decodificarResultado('1.0-a-b-c-d') === null, 'codigo nao numerico devolve null');
ok(motor.decodificarResultado(null) === null, 'entrada nula devolve null');

/* ===========================================================================
   13. ROBUSTEZ
=========================================================================== */
grupo('13. Robustez');

var vazio = motor.calcular(conteudo.PERGUNTAS, {});
igual(vazio.placar.total, 0, 'sem respostas: total 0');
igual(somaPct(vazio.percentuais), 0, 'sem respostas: percentuais zerados, sem divisao por zero');
igual(vazio.completo, false, 'sem respostas: nao marcado como completo');

var invalidas = motor.calcular(conteudo.PERGUNTAS, { q01: 'z', q99: 'a', q02: 'a' });
igual(invalidas.placar.total, 1, 'alternativa e pergunta inexistentes sao ignoradas');

var parcial = motor.calcular(conteudo.PERGUNTAS, responderComo({ rei: 5 }));
igual(parcial.completo, false, 'teste parcial nao e marcado como completo');
igual(parcial.respondidas, 5, 'conta corretamente as respondidas');
igual(somaPct(parcial.percentuais), 100, 'percentuais de teste parcial ainda somam 100');

/* ===========================================================================
   RESUMO
=========================================================================== */
console.log('\n' + '='.repeat(64));
console.log('  ' + passou + ' passaram, ' + falhou + ' falharam');
console.log('='.repeat(64));
if (falhou > 0) {
  console.log('\nFALHAS:');
  falhas.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
}
