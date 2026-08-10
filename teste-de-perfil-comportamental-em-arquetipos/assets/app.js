/* =============================================================================
   INTERFACE — Teste de Perfil Comportamental | Wagner Alves
   Depende de: content.js (conteúdo) e engine.js (pontuação).
   Nenhuma lógica de pontuação vive aqui — este arquivo apenas apresenta.
============================================================================= */
(function () {
  'use strict';

  var C = window.ConteudoTeste;
  var M = window.MotorTeste;

  /* ------------------------------------------------------------------ CONFIG */
  var CONFIG = {
    whatsappNumero: '5541999682982',
    urlPublica: 'https://owagneralvessvisagista.com/teste-de-perfil-comportamental-em-arquetipos/'
  };
  var CHAVE_RASCUNHO = 'wa-teste-arquetipos-v1';

  /* ------------------------------------------------------------- ESTADO */
  var estado = {
    indice: 0,
    respostas: {},
    lead: null,
    resultado: null
  };

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* Analytics: empurra para o dataLayer se houver GTM/GA4; silencioso se não. */
  function evento(nome, dados) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: nome }, dados || {}));
    } catch (e) { /* nunca quebrar a experiência por causa de analytics */ }
  }

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ------------------------------------------------------------- TELAS */
  function mostrarTela(nome) {
    $$('.tela').forEach(function (t) { t.classList.toggle('ativa', t.dataset.tela === nome); });
    $('#barra-topo').style.display = (nome === 'teste') ? '' : 'none';
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  /* ------------------------------------------------------------- RASCUNHO */
  function salvarRascunho() {
    try {
      localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({
        indice: estado.indice, respostas: estado.respostas, versao: C.TEST_VERSION
      }));
    } catch (e) { /* modo privado do Safari bloqueia; seguir sem rascunho */ }
  }
  function limparRascunho() {
    try { localStorage.removeItem(CHAVE_RASCUNHO); } catch (e) {}
  }
  function lerRascunho() {
    try {
      var bruto = localStorage.getItem(CHAVE_RASCUNHO);
      if (!bruto) { return null; }
      var d = JSON.parse(bruto);
      /* Rascunho de outra versão do teste não é aproveitável: as perguntas mudaram. */
      if (!d || d.versao !== C.TEST_VERSION || !d.respostas) { return null; }
      if (Object.keys(d.respostas).length === 0) { return null; }
      return d;
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------------- QUIZ */
  function renderizarPergunta() {
    var pergunta = C.PERGUNTAS[estado.indice];
    var total = C.PERGUNTAS.length;
    var numero = estado.indice + 1;

    $('#contador').textContent = 'Pergunta ' + numero + ' de ' + total;
    $('#categoria').textContent = pergunta.categoria;
    $('#preenche').style.width = ((estado.indice / total) * 100) + '%';

    $('#pergunta-texto').textContent = pergunta.texto;

    var escolhida = estado.respostas[pergunta.id];
    var html = pergunta.opcoes.map(function (opcao) {
      return '<button type="button" class="opcao' + (escolhida === opcao.id ? ' escolhida' : '') + '"' +
        ' data-opcao="' + opcao.id + '" role="radio" aria-checked="' + (escolhida === opcao.id) + '">' +
        '<span class="marca" aria-hidden="true"></span>' +
        '<span>' + escapar(opcao.texto) + '</span>' +
        '</button>';
    }).join('');
    $('#opcoes').innerHTML = html;

    $('#btn-voltar').style.visibility = estado.indice === 0 ? 'hidden' : 'visible';
    $('#btn-continuar').textContent = (estado.indice === total - 1) ? 'Ver meu resultado' : 'Continuar';
    $('#alerta-pergunta').classList.remove('visivel');

    $('#opcoes').focus({ preventScroll: true });
  }

  function escolher(idOpcao) {
    var pergunta = C.PERGUNTAS[estado.indice];
    estado.respostas[pergunta.id] = idOpcao;
    salvarRascunho();

    $$('#opcoes .opcao').forEach(function (btn) {
      var ativa = btn.dataset.opcao === idOpcao;
      btn.classList.toggle('escolhida', ativa);
      btn.setAttribute('aria-checked', String(ativa));
    });

    evento('question_answered', { question_index: estado.indice + 1, question_id: pergunta.id });

    /* Avanço automático: o clique já é a confirmação. O botão Continuar segue
       existindo para quem navega por teclado ou quer reler antes de seguir.

       O índice é capturado aqui e conferido lá dentro: sem isso, quem clica na
       alternativa e em "Continuar" dentro da mesma janela de 260ms dispara
       avancar() duas vezes e PULA uma pergunta — que voltaria depois como
       resposta faltando. Mesma proteção cobre trocar de alternativa antes do
       timer disparar. */
    var indiceNoClique = estado.indice;
    window.setTimeout(function () {
      if (estado.indice === indiceNoClique && estado.respostas[pergunta.id] === idOpcao) {
        avancar();
      }
    }, 260);
  }

  function avancar() {
    var pergunta = C.PERGUNTAS[estado.indice];
    if (!estado.respostas[pergunta.id]) {
      $('#alerta-pergunta').classList.add('visivel');
      return;
    }
    if (estado.indice < C.PERGUNTAS.length - 1) {
      estado.indice++;
      salvarRascunho();
      renderizarPergunta();
    } else {
      finalizar();
    }
  }

  function voltar() {
    if (estado.indice > 0) {
      estado.indice--;
      salvarRascunho();
      renderizarPergunta();
    }
  }

  /* ------------------------------------------------------------- ANALISANDO */
  function finalizar() {
    /* Rede de segurança: se por qualquer motivo faltar resposta, volta para a
       primeira pendente em vez de calcular um resultado incompleto. */
    for (var i = 0; i < C.PERGUNTAS.length; i++) {
      if (!estado.respostas[C.PERGUNTAS[i].id]) {
        estado.indice = i;
        renderizarPergunta();
        $('#alerta-pergunta').classList.add('visivel');
        return;
      }
    }

    estado.resultado = M.calcular(C.PERGUNTAS, estado.respostas, { versao: C.TEST_VERSION });
    evento('test_completed', {
      primary_profile: estado.resultado.primario,
      secondary_profile: estado.resultado.secundario
    });

    $('#preenche').style.width = '100%';
    mostrarTela('analisando');

    var etapas = [
      'Organizando suas respostas...',
      'Comparando as quatro dimensões...',
      'Identificando seu padrão predominante...',
      'Montando sua análise...'
    ];
    var passo = 0;
    var alvo = $('#etapa-analise');
    alvo.textContent = etapas[0];

    var timer = window.setInterval(function () {
      passo++;
      if (passo < etapas.length) {
        alvo.style.opacity = '0';
        window.setTimeout(function () {
          alvo.textContent = etapas[passo];
          alvo.style.opacity = '1';
        }, 220);
      } else {
        window.clearInterval(timer);
        mostrarTela('lead');
        window.setTimeout(function () { $('#lead-nome').focus(); }, 260);
      }
    }, 850);
  }

  /* ------------------------------------------------------------- LEAD */
  function emailValido(valor) {
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(valor).trim());
  }

  function enviarLead() {
    var nome = $('#lead-nome').value.trim();
    var email = $('#lead-email').value.trim();
    var consentiu = $('#lead-consent').checked;
    var valido = true;

    var campoNome = $('#lead-nome').closest('.campo');
    var campoEmail = $('#lead-email').closest('.campo');
    var campoConsent = $('#lead-consent').closest('.consentimento');

    campoNome.classList.toggle('erro', nome.length < 2);
    if (nome.length < 2) { valido = false; }

    campoEmail.classList.toggle('erro', !emailValido(email));
    if (!emailValido(email)) { valido = false; }

    campoConsent.classList.toggle('erro', !consentiu);
    if (!consentiu) { valido = false; }

    if (!valido) { return; }

    estado.lead = { nome: nome, email: email, quando: new Date().toISOString() };
    evento('lead_submitted', { primary_profile: estado.resultado.primario });

    limparRascunho();
    renderizarResultado();
    mostrarTela('resultado');
    evento('result_viewed', { primary_profile: estado.resultado.primario });

    /* Avisa o Wagner com o lead e o mapa completo do perfil. */
    notificarWhatsapp();
  }

  function notificarWhatsapp() {
    var r = estado.resultado;
    var p = r.percentuais;
    var lead = estado.lead || {};

    var texto = '*NOVO TESTE DE PERFIL COMPORTAMENTAL*\n';
    texto += 'Wagner Alves · Visagismo Estratégico\n\n';
    texto += 'Nome: ' + lead.nome + '\n';
    texto += 'E-mail: ' + lead.email + '\n\n';
    texto += '*Perfil predominante:* ' + C.PERFIS[r.primario].nome + '\n';
    if (r.secundario) {
      texto += '*Perfil secundário:* ' + C.PERFIS[r.secundario].nome + '\n';
    }
    if (r.empateTecnico) {
      texto += '(empate técnico entre os dois primeiros)\n';
    }
    texto += '\n*Mapa:*\n';
    texto += 'Rei ' + p.rei + '% · Guerreiro ' + p.guerreiro + '%\n';
    texto += 'Mago ' + p.mago + '% · Amante ' + p.amante + '%\n\n';
    texto += 'Versão do teste: ' + C.TEST_VERSION + '\n';
    texto += 'Resultado: ' + CONFIG.urlPublica + '#r=' + M.codificarResultado(r);

    var url = 'https://wa.me/' + CONFIG.whatsappNumero + '?text=' + encodeURIComponent(texto);
    $('#link-whatsapp-lead').href = url;
    window.open(url, '_blank');
  }

  /* ------------------------------------------------------------- RESULTADO */
  function radarSVG(pct) {
    var perfis = ['rei', 'guerreiro', 'mago', 'amante'];
    var cx = 110, cy = 110, raio = 82;
    /* Quatro eixos: topo, direita, baixo, esquerda */
    var angulos = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

    function ponto(i, fracao) {
      return [
        (cx + Math.cos(angulos[i]) * raio * fracao).toFixed(1),
        (cy + Math.sin(angulos[i]) * raio * fracao).toFixed(1)
      ].join(',');
    }

    var grades = [0.25, 0.5, 0.75, 1].map(function (f) {
      var pts = angulos.map(function (_, i) { return ponto(i, f); }).join(' ');
      return '<polygon points="' + pts + '" fill="none" stroke="#34302a" stroke-width="1"/>';
    }).join('');

    var eixos = angulos.map(function (_, i) {
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + ponto(i, 1).split(',')[0] +
        '" y2="' + ponto(i, 1).split(',')[1] + '" stroke="#34302a" stroke-width="1"/>';
    }).join('');

    /* O maior valor sempre encosta na borda: com 4 eixos, escalar pelo máximo
       torna a forma legível mesmo em resultados equilibrados. */
    var maior = Math.max(pct.rei, pct.guerreiro, pct.mago, pct.amante) || 1;
    var forma = perfis.map(function (perfil, i) {
      return ponto(i, Math.max(pct[perfil] / maior, 0.06));
    }).join(' ');

    var vertices = perfis.map(function (perfil, i) {
      var xy = ponto(i, Math.max(pct[perfil] / maior, 0.06)).split(',');
      return '<circle cx="' + xy[0] + '" cy="' + xy[1] + '" r="3.5" fill="' + C.PERFIS[perfil].cor + '"/>';
    }).join('');

    var rotulos = perfis.map(function (perfil, i) {
      var xy = ponto(i, 1.19).split(',');
      var anchor = i === 1 ? 'start' : (i === 3 ? 'end' : 'middle');
      var dy = i === 0 ? '-2' : (i === 2 ? '10' : '4');
      return '<text x="' + xy[0] + '" y="' + xy[1] + '" dy="' + dy + '" text-anchor="' + anchor + '" ' +
        'fill="#7c7566" font-size="10.5" font-family="Inter,sans-serif" letter-spacing="1.4">' +
        C.PERFIS[perfil].nome.toUpperCase() + '</text>';
    }).join('');

    return '<svg viewBox="0 0 220 220" role="img" aria-label="Mapa das quatro dimensões comportamentais">' +
      grades + eixos +
      '<polygon points="' + forma + '" fill="rgba(160,140,92,0.20)" stroke="#a08c5c" stroke-width="1.6"/>' +
      vertices + rotulos + '</svg>';
  }

  function renderizarResultado() {
    var r = estado.resultado;
    var principal = C.PERFIS[r.primario];
    var pct = r.percentuais;

    /* --- Coroa --- */
    $('#emblema-resultado').innerHTML = principal.emblema;
    $('#emblema-resultado').style.color = principal.cor;
    $('#nome-perfil').textContent = principal.nome.toUpperCase();
    $('#nome-perfil').style.color = principal.cor;
    $('#descricao-curta').textContent = principal.descricaoCurta;

    var tag = $('#combinacao-tag');
    if (r.empateTecnico && r.secundario) {
      tag.textContent = 'Equilíbrio entre ' + principal.nome + ' e ' + C.PERFIS[r.secundario].nome;
      tag.style.display = '';
    } else if (r.combinacao && C.COMBINACOES[r.combinacao]) {
      tag.textContent = C.COMBINACOES[r.combinacao].titulo;
      tag.style.display = '';
    } else {
      tag.style.display = 'none';
    }

    /* --- Gráfico de barras --- */
    var barras = C.ORDEM_PERFIS.map(function (slug) {
      var perfil = C.PERFIS[slug];
      var destaque = (slug === r.primario);
      return '<div class="linha-grafico' + (destaque ? ' destaque' : '') + '">' +
        '<div class="rotulo-linha">' +
          '<span class="nome" style="color:' + perfil.cor + '">' + perfil.nome + '</span>' +
          '<span class="pct">' + pct[slug] + '%</span>' +
        '</div>' +
        '<div class="trilho-barra"><div class="barra" data-largura="' + pct[slug] + '" ' +
          'style="background:linear-gradient(90deg,' + perfil.cor + '99,' + perfil.cor + ')"></div></div>' +
      '</div>';
    }).join('');
    $('#grafico-barras').innerHTML = barras;
    $('#radar').innerHTML = radarSVG(pct);

    /* Anima as barras depois da pintura */
    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        $$('#grafico-barras .barra').forEach(function (b) {
          b.style.width = b.dataset.largura + '%';
        });
      }, 120);
    });

    /* --- Combinação / equilíbrio --- */
    var blocoComb = $('#bloco-combinacao');
    if (r.empateTecnico && r.secundario) {
      blocoComb.style.display = '';
      $('#combinacao-titulo').textContent = 'Um perfil equilibrado';
      $('#combinacao-texto').textContent = C.textoEquilibrio(r.primario, r.secundario);
    } else if (r.combinacao && C.COMBINACOES[r.combinacao]) {
      var comb = C.COMBINACOES[r.combinacao];
      blocoComb.style.display = '';
      $('#combinacao-titulo').textContent = comb.titulo;
      $('#combinacao-texto').textContent = comb.resumo + ' ' + comb.texto;
    } else {
      blocoComb.style.display = 'none';
    }

    /* --- Descrição longa --- */
    $('#descricao-longa').textContent = principal.descricaoLonga;

    /* --- Como você funciona --- */
    var funcionamento = [
      ['Como você decide', principal.decisao],
      ['Como você reage sob pressão', principal.pressao],
      ['Como você trabalha', principal.trabalho],
      ['Como você se relaciona', principal.relacionamento],
      ['Como você lidera', principal.lideranca],
      ['Como você aprende', principal.aprendizado]
    ].map(function (par) {
      return '<div class="bloco"><h3>' + escapar(par[0]) + '</h3><p class="texto-suave">' +
        escapar(par[1]) + '</p></div>';
    }).join('');
    $('#funcionamento').innerHTML = funcionamento;

    /* --- Forças e atenção --- */
    function listaItens(itens) {
      return '<ul class="lista-itens">' + itens.map(function (item) {
        return '<li><strong>' + escapar(item.titulo) + '</strong><span>' + escapar(item.texto) + '</span></li>';
      }).join('') + '</ul>';
    }
    $('#pontos-fortes').innerHTML = listaItens(principal.pontosFortes);
    $('#pontos-atencao').innerHTML = listaItens(principal.pontosAtencao);

    /* --- Desenvolvimento --- */
    $('#desenvolvimento').innerHTML = '<ul class="lista-passos">' +
      principal.desenvolvimento.map(function (d) { return '<li>' + escapar(d) + '</li>'; }).join('') + '</ul>';

    /* --- Saudação personalizada --- */
    if (estado.lead && estado.lead.nome) {
      var primeiroNome = estado.lead.nome.split(' ')[0];
      $('#saudacao').textContent = primeiroNome + ', seu perfil predominante é';
    } else {
      $('#saudacao').textContent = 'Seu perfil predominante é';
    }

    /* --- Link compartilhável --- */
    var codigo = M.codificarResultado(r);
    estado.linkResultado = CONFIG.urlPublica + '#r=' + codigo;
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#r=' + codigo);
    }
  }

  /* ------------------------------------------------------------- COMPARTILHAR */
  function mensagemCompartilhar() {
    var nome = C.PERFIS[estado.resultado.primario].nome;
    return 'Fiz o teste de perfil comportamental do Wagner Alves e meu perfil predominante é ' +
      nome + '. Quer descobrir o seu?';
  }

  function compartilhar() {
    var texto = mensagemCompartilhar();
    var url = CONFIG.urlPublica;
    evento('report_clicked', { acao: 'compartilhar' });

    if (navigator.share) {
      navigator.share({
        title: 'Teste de Perfil Comportamental — Wagner Alves',
        text: texto,
        url: url
      }).catch(function () { /* usuário cancelou: sem ação */ });
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(texto + ' ' + url), '_blank');
    }
  }

  function copiarLink() {
    var url = CONFIG.urlPublica;
    var botao = $('#btn-copiar');
    var original = botao.textContent;

    function confirmar() {
      botao.textContent = 'Link copiado';
      window.setTimeout(function () { botao.textContent = original; }, 2200);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(confirmar).catch(function () { copiarFallback(url, confirmar); });
    } else {
      copiarFallback(url, confirmar);
    }
  }

  function copiarFallback(texto, aoConcluir) {
    var campo = document.createElement('textarea');
    campo.value = texto;
    campo.setAttribute('readonly', '');
    campo.style.position = 'fixed';
    campo.style.opacity = '0';
    document.body.appendChild(campo);
    campo.select();
    try { document.execCommand('copy'); aoConcluir(); } catch (e) { /* sem clipboard disponível */ }
    document.body.removeChild(campo);
  }

  /* ------------------------------------------------------------- INÍCIO */
  function iniciarTeste(retomando) {
    if (!retomando) {
      estado.indice = 0;
      estado.respostas = {};
      limparRascunho();
    }
    evento('test_started', { retomado: !!retomando });
    mostrarTela('teste');
    renderizarPergunta();
  }

  function restaurarDeLink() {
    var hash = window.location.hash || '';
    if (hash.indexOf('#r=') !== 0) { return false; }

    var resultado = M.decodificarResultado(hash.slice(3));
    if (!resultado) { return false; }

    estado.resultado = resultado;
    estado.lead = null;
    renderizarResultado();
    /* Resultado compartilhado: quem abriu o link não fez o teste, então o convite
       para fazer o próprio aparece em destaque. */
    $('#aviso-compartilhado').style.display = '';
    mostrarTela('resultado');
    evento('result_viewed', { origem: 'link_compartilhado', primary_profile: resultado.primario });
    return true;
  }

  /* ------------------------------------------------------------- LIGAÇÕES */
  function ligarEventos() {
    $('#btn-comecar').addEventListener('click', function () { iniciarTeste(false); });
    $('#btn-comecar-2').addEventListener('click', function () { iniciarTeste(false); });

    $('#opcoes').addEventListener('click', function (e) {
      var botao = e.target.closest('.opcao');
      if (botao) { escolher(botao.dataset.opcao); }
    });

    /* Teclado: 1–4 escolhem, setas navegam. */
    document.addEventListener('keydown', function (e) {
      var telaTeste = $('.tela[data-tela="teste"]').classList.contains('ativa');
      if (!telaTeste) { return; }
      if (e.key >= '1' && e.key <= '4') {
        var opcao = C.PERGUNTAS[estado.indice].opcoes[parseInt(e.key, 10) - 1];
        if (opcao) { escolher(opcao.id); }
      } else if (e.key === 'ArrowLeft') { voltar(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { avancar(); }
    });

    $('#btn-continuar').addEventListener('click', avancar);
    $('#btn-voltar').addEventListener('click', voltar);

    $('#btn-liberar').addEventListener('click', enviarLead);
    $('#form-lead').addEventListener('submit', function (e) { e.preventDefault(); enviarLead(); });

    ['lead-nome', 'lead-email'].forEach(function (id) {
      $('#' + id).addEventListener('input', function () {
        this.closest('.campo').classList.remove('erro');
      });
    });
    $('#lead-consent').addEventListener('change', function () {
      if (this.checked) { this.closest('.consentimento').classList.remove('erro'); }
    });

    $('#btn-relatorio').addEventListener('click', function () {
      evento('report_clicked', { acao: 'imprimir' });
      window.print();
    });
    $('#btn-compartilhar').addEventListener('click', compartilhar);
    $('#btn-copiar').addEventListener('click', copiarLink);

    $('#btn-refazer').addEventListener('click', function () {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      estado.lead = null;
      estado.resultado = null;
      $('#aviso-compartilhado').style.display = 'none';
      iniciarTeste(false);
    });

    $('#btn-retomar').addEventListener('click', function () {
      var rascunho = lerRascunho();
      if (rascunho) {
        estado.respostas = rascunho.respostas;
        estado.indice = Math.min(rascunho.indice || 0, C.PERGUNTAS.length - 1);
        iniciarTeste(true);
      }
    });
    $('#btn-descartar').addEventListener('click', function () {
      limparRascunho();
      $('#caixa-retomar').style.display = 'none';
    });
  }

  /* ------------------------------------------------------------- BOOT */
  function iniciar() {
    /* Emblemas da landing */
    var constelacao = $('#constelacao');
    if (constelacao) {
      constelacao.innerHTML = C.ORDEM_PERFIS.map(function (slug) {
        return '<span>' + C.PERFIS[slug].emblema + '</span>';
      }).join('');
    }

    /* Cartões de apresentação dos quatro perfis */
    var grade = $('#grade-perfis');
    if (grade) {
      grade.innerHTML = C.ORDEM_PERFIS.map(function (slug) {
        var p = C.PERFIS[slug];
        return '<div class="card-perfil">' +
          '<div class="emb" style="color:' + p.cor + '">' + p.emblema + '</div>' +
          '<h3>' + p.nome + '</h3>' +
          '<p>' + escapar(p.essencia) + '</p>' +
        '</div>';
      }).join('');
    }

    $('#total-perguntas').textContent = C.PERGUNTAS.length;
    $('#versao-teste').textContent = C.TEST_VERSION;

    ligarEventos();

    /* Prioridade: link de resultado compartilhado > rascunho > landing */
    if (restaurarDeLink()) { return; }

    var rascunho = lerRascunho();
    if (rascunho) {
      var respondidas = Object.keys(rascunho.respostas).length;
      $('#texto-retomar').textContent =
        'Você começou este teste e parou na pergunta ' + Math.min(rascunho.indice + 1, C.PERGUNTAS.length) +
        ' de ' + C.PERGUNTAS.length + ' (' + respondidas + ' respondidas).';
      $('#caixa-retomar').style.display = '';
    }

    mostrarTela('landing');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
