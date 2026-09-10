/* =============================================================================
   DOSSIÊ DE VISAGISMO — APLICAÇÃO
   -----------------------------------------------------------------------------
   Um atendimento por vez: o Wagner preenche a ficha, gera o PDF, salva no
   celular e começa o próximo cliente do zero. Nenhum cliente fica guardado
   no sistema — ver `rascunho.js` para a única exceção (a ficha em andamento).

   Sem framework e sem build: roda direto do navegador em qualquer hospedagem
   estática.
============================================================================= */
(function () {
  'use strict';

  var C = window.DossieConteudo;
  var D = window.DossieDiagramas;
  var S = window.DossieSlides;
  var R = window.DossieRascunho;

  var $  = function (s, raiz) { return (raiz || document).querySelector(s); };
  var $$ = function (s, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(s)); };

  var LARG = S.LARGURA, ALT = S.ALTURA;   /* 1080 x 1920 */
  var ficha = null;
  var salvamentoPendente = null;
  var escalaPreview = 1;
  var totalPaginas = 0;

  /* =========================================================================
     FICHA EM BRANCO
  ========================================================================= */
  function hojeISO() {
    var hoje = new Date();
    return hoje.getFullYear() + '-' + String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
           String(hoje.getDate()).padStart(2, '0');
  }
  function fichaNova() {
    return {
      nome: '', profissao: '', data: hojeISO(),
      perfil: 'rei', perfilNota: '',
      rosto: 'oval', rostoNota: '',
      cabelo: '2b', densidade: 'media', couro: 'normal',
      medidas: { topo: '', lateral: '', franja: '', nuca: '', barbaMm: '', direcao: 'tras' },
      barbaDesenho: 'curta-reta',
      tecnicas: '',
      proposta: '', observacoes: '', refNota: '',
      rotina: [], produtos: [{ nome: '', uso: '' }], retorno: '',
      fotos: {}
    };
  }

  /* =========================================================================
     UTILITÁRIOS
  ========================================================================= */
  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var tempoAviso = null;
  function avisar(texto, erro) {
    var velho = $('.aviso');
    if (velho) velho.remove();
    var el = document.createElement('div');
    el.className = 'aviso' + (erro ? ' aviso--erro' : '');
    el.setAttribute('role', 'status');
    el.textContent = texto;
    document.body.appendChild(el);
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(function () { el.remove(); }, 3600);
  }

  function nomeArquivo(f) {
    var base = (f.nome || 'cliente').normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
    return 'dossie-visagismo-' + (base || 'cliente') + '-' + (f.data || hojeISO()) + '.pdf';
  }

  /* Redimensiona a foto antes de usar. Uma foto de celular tem 4 a 8 MB;
     depois disso fica com 200 a 400 KB, sem diferença visível no PDF. */
  function prepararImagem(arquivo, ladoMax) {
    return new Promise(function (ok, erro) {
      var url = URL.createObjectURL(arquivo);
      var img = new Image();
      img.onerror = function () { URL.revokeObjectURL(url); erro(new Error('Arquivo de imagem inválido.')); };
      img.onload = function () {
        var max = ladoMax || 1600;
        var escala = Math.min(1, max / Math.max(img.width, img.height));
        var l = Math.round(img.width * escala), a = Math.round(img.height * escala);
        var tela = document.createElement('canvas');
        tela.width = l; tela.height = a;
        var ctx = tela.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, l, a);
        ctx.drawImage(img, 0, 0, l, a);
        URL.revokeObjectURL(url);
        ok(tela.toDataURL('image/jpeg', 0.86));
      };
      img.src = url;
    });
  }

  /* =========================================================================
     FORMULÁRIO
  ========================================================================= */
  var PASSOS = [
    { id: 'cliente',    nome: 'Cliente' },
    { id: 'perfil',     nome: 'Perfil' },
    { id: 'rosto',      nome: 'Rosto' },
    { id: 'cabelo',     nome: 'Cabelo' },
    { id: 'medidas',    nome: 'Medidas' },
    { id: 'proposta',   nome: 'Proposta' },
    { id: 'fotos',      nome: 'Fotos' },
    { id: 'manutencao', nome: 'Manutenção' }
  ];
  var passoAtivo = 'cliente';

  function opcoes(lista, atual, rotuloDe) {
    return lista.map(function (o) {
      return '<option value="' + esc(o.slug) + '"' + (o.slug === atual ? ' selected' : '') + '>' +
             esc(rotuloDe ? rotuloDe(o) : o.nome) + '</option>';
    }).join('');
  }

  function montarFormulario() {
    $('#nome-editor').textContent = ficha.nome || 'Novo cliente';
    $('#passos').innerHTML = PASSOS.map(function (p, i) {
      return '<button class="passo" role="tab" data-passo="' + p.id + '" aria-selected="' +
             (p.id === passoAtivo) + '"><span>' + (i + 1) + '</span>' + esc(p.nome) + '</button>';
    }).join('');

    $('#secoes').innerHTML =
      secaoCliente() + secaoPerfil() + secaoRosto() + secaoCabelo() +
      secaoMedidas() + secaoProposta() + secaoFotos() + secaoManutencao();

    trocarPasso(passoAtivo);
  }

  /* Rodapé de cada etapa: no celular o caminho natural é ir descendo e
     tocando em "Próxima", sem voltar ao topo para achar as abas. */
  function rodapeEtapa(id) {
    var i = PASSOS.map(function (p) { return p.id; }).indexOf(id);
    var prox = PASSOS[i + 1];
    return '<div class="etapa__rodape">' +
      (prox
        ? '<button type="button" class="btn btn--ouro btn--largo" data-ir="' + prox.id + '">Próxima: ' + esc(prox.nome) + ' →</button>'
        : '<button type="button" class="btn btn--ouro btn--largo" data-acao="gerar">Gerar o PDF do dossiê</button>') +
      '</div>';
  }

  function trocarPasso(id) {
    passoAtivo = id;
    var editor = $('.editor');
    if (editor && editor.classList.contains('editor--previa')) {
      editor.classList.remove('editor--previa');
      $('#btn-alternar').textContent = 'Ver dossiê';
    }
    $$('#passos .passo').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-passo') === id));
    });
    $$('#secoes .secao').forEach(function (s) {
      s.setAttribute('data-ativa', String(s.getAttribute('data-secao') === id));
    });
    $('#secoes').scrollTop = 0;
  }

  /* --- seções --------------------------------------------------------- */
  function secaoCliente() {
    return '<div class="secao" data-secao="cliente">' +
      '<h3>Dados do cliente</h3>' +
      '<p class="secao__dica">Aparecem na capa do dossiê.</p>' +
      '<div class="campo"><label for="f-nome">Nome completo</label>' +
        '<input type="text" id="f-nome" data-campo="nome" value="' + esc(ficha.nome) + '" placeholder="Ex.: Alemax Nunes" autocomplete="off"></div>' +
      '<div class="campo"><label for="f-prof">Profissão ou cargo</label>' +
        '<input type="text" id="f-prof" data-campo="profissao" value="' + esc(ficha.profissao) + '" placeholder="Ex.: Empresário">' +
        '<p class="campo__ajuda">Opcional. Entra na capa, abaixo do nome.</p></div>' +
      '<div class="campo"><label for="f-data">Data da consultoria</label>' +
        '<input type="date" id="f-data" data-campo="data" value="' + esc(ficha.data) + '"></div>' +
      rodapeEtapa('cliente') +
      '</div>';
  }

  function secaoPerfil() {
    var cartoes = C.PERFIS.map(function (p) {
      return '<button class="perfilBtn" data-perfil="' + esc(p.slug) + '" aria-pressed="' +
        (p.slug === ficha.perfil) + '">' +
        '<span class="perfilBtn__emblema">' + p.emblema + '</span>' +
        '<b>' + esc(p.nome) + '</b>' +
        '<span>' + esc(p.resumo) + '</span>' +
        '</button>';
    }).join('');
    var p = C.acharPerfil(ficha.perfil) || C.PERFIS[0];

    return '<div class="secao" data-secao="perfil">' +
      '<h3>Perfil comportamental</h3>' +
      '<p class="secao__dica">O perfil escolhido reescreve o dossiê inteiro: o texto do perfil, ' +
      'a direção de imagem, o rascunho da proposta e o intervalo de retorno são próprios de cada um.</p>' +
      '<div class="perfis">' + cartoes + '</div>' +
      '<div class="previa" id="previa-perfil"><b>' + esc(p.temperamento) + ' · ' + esc(p.direcao.linha) + '</b>' +
        esc(p.direcao.objetivo) + '</div>' +
      '<div class="campo"><label for="f-perfilNota">Observação sobre este cliente</label>' +
        '<textarea id="f-perfilNota" data-campo="perfilNota" placeholder="Ex.: perfil de Rei com forte traço analítico no ambiente de trabalho.">' +
        esc(ficha.perfilNota) + '</textarea>' +
        '<p class="campo__ajuda">Opcional. Entra na página do perfil, destacada em itálico.</p></div>' +
      rodapeEtapa('perfil') +
      '</div>';
  }

  function secaoRosto() {
    var r = C.acharRosto(ficha.rosto) || C.ROSTOS[0];
    return '<div class="secao" data-secao="rosto">' +
      '<h3>Análise facial</h3>' +
      '<p class="secao__dica">O desenho do rosto muda conforme o formato: testa, maçã do rosto, mandíbula e queixo.</p>' +
      '<div class="campo"><label for="f-rosto">Formato do rosto</label>' +
        '<select id="f-rosto" data-campo="rosto">' + opcoes(C.ROSTOS, ficha.rosto) + '</select></div>' +
      '<div class="miniatura" id="mini-rosto">' + D.formatoRosto(r) + '</div>' +
      '<div class="previa" id="previa-rosto"><b>Comunica</b>' + esc(r.comunica) + '</div>' +
      '<div class="campo"><label for="f-rostoNota">Observação da consultoria</label>' +
        '<textarea id="f-rostoNota" data-campo="rostoNota" placeholder="Ex.: assimetria leve no lado direito da mandíbula, compensada pelo caimento do topo.">' +
        esc(ficha.rostoNota) + '</textarea></div>' +
      rodapeEtapa('rosto') +
      '</div>';
  }

  function secaoCabelo() {
    return '<div class="secao" data-secao="cabelo">' +
      '<h3>Estrutura do fio</h3>' +
      '<p class="secao__dica">Define também a rotina de manutenção sugerida na última página.</p>' +
      '<div class="campo"><label for="f-cabelo">Tipo de cabelo</label>' +
        '<select id="f-cabelo" data-campo="cabelo">' +
        opcoes(C.CABELOS, ficha.cabelo, function (c) { return c.nome + ' — ' + c.grupo; }) +
        '</select></div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="f-densidade">Densidade</label>' +
          '<select id="f-densidade" data-campo="densidade">' + opcoes(C.DENSIDADES, ficha.densidade) + '</select></div>' +
        '<div class="campo"><label for="f-couro">Couro cabeludo</label>' +
          '<select id="f-couro" data-campo="couro">' + opcoes(C.COUROS, ficha.couro) + '</select></div>' +
      '</div>' +
      rodapeEtapa('cabelo') +
      '</div>';
  }

  function secaoMedidas() {
    var m = ficha.medidas || {};
    return '<div class="secao" data-secao="medidas">' +
      '<h3>Projeto técnico</h3>' +
      '<p class="secao__dica">O desenho acompanha o que você preenche: o comprimento muda o volume, ' +
      'a direção muda o penteado e a barba é recortada no formato deste rosto.</p>' +
      '<div class="miniatura" id="mini-medidas">' + D.medidasFrontal(m, ficha.rosto, ficha.barbaDesenho) + '</div>' +
      '<div class="quadra">' +
        campoMedida('topo', 'Topo (cm)', m.topo) +
        campoMedida('franja', 'Frente (cm)', m.franja) +
        campoMedida('lateral', 'Laterais (cm)', m.lateral) +
        campoMedida('nuca', 'Nuca (cm)', m.nuca) +
      '</div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="f-direcao">Direção do fio</label>' +
          '<select id="f-direcao" data-medida="direcao">' +
          D.listaDirecoes().map(function (d) {
            return '<option value="' + d.slug + '"' + (d.slug === m.direcao ? ' selected' : '') + '>' + esc(d.nome) + '</option>';
          }).join('') + '</select></div>' +
        '<div class="campo"><label for="f-barbaMm">Barba (mm)</label>' +
          '<input type="number" inputmode="decimal" step="0.5" min="0" id="f-barbaMm" data-medida="barbaMm" value="' +
          esc(m.barbaMm) + '" placeholder="Ex.: 3"></div>' +
      '</div>' +
      '<div class="campo"><label for="f-barbaDesenho">Desenho da barba</label>' +
        '<select id="f-barbaDesenho" data-campo="barbaDesenho">' +
        D.listaBarbas().map(function (b) {
          return '<option value="' + b.slug + '"' + (b.slug === ficha.barbaDesenho ? ' selected' : '') + '>' + esc(b.nome) + '</option>';
        }).join('') + '</select></div>' +
      '<div class="campo"><label for="f-tecnicas">Técnicas aplicadas</label>' +
        '<textarea id="f-tecnicas" data-campo="tecnicas" placeholder="Uma técnica por linha. Ex.:&#10;Navalha nas laterais&#10;Tesoura desfiando no topo">' +
        esc(ficha.tecnicas) + '</textarea>' +
        '<p class="campo__ajuda">Uma por linha. Entram na página de direção do fio e barba.</p></div>' +
      rodapeEtapa('medidas') +
      '</div>';
  }

  function campoMedida(chave, rotulo, valor) {
    return '<div class="campo"><label for="f-' + chave + '">' + esc(rotulo) + '</label>' +
      '<input type="number" inputmode="decimal" step="0.5" min="0" id="f-' + chave + '" data-medida="' + chave +
      '" value="' + esc(valor) + '"></div>';
  }

  function secaoProposta() {
    var p = C.acharPerfil(ficha.perfil) || C.PERFIS[0];
    return '<div class="secao" data-secao="proposta">' +
      '<h3>Proposta</h3>' +
      '<p class="secao__dica">Se você deixar em branco, entra o texto do perfil ' + esc(p.nome) +
      '. O botão abaixo copia esse texto para o campo, para você ajustar com os detalhes do atendimento.</p>' +
      '<div class="campo"><label for="f-proposta">Texto da proposta</label>' +
        '<textarea id="f-proposta" data-campo="proposta" style="min-height:220px" placeholder="' +
        esc(p.proposta.slice(0, 110)) + '…">' + esc(ficha.proposta) + '</textarea>' +
        '<p class="campo__ajuda"><button type="button" class="btn btn--pequeno" data-acao="usar-modelo">' +
        'Carregar o texto do perfil ' + esc(p.nome) + '</button></p></div>' +
      '<div class="campo"><label for="f-observacoes">Observações</label>' +
        '<textarea id="f-observacoes" data-campo="observacoes" placeholder="Ex.: cliente relatou sensibilidade a produtos com álcool.">' +
        esc(ficha.observacoes) + '</textarea></div>' +
      '<div class="campo"><label for="f-refNota">Legenda das referências visuais</label>' +
        '<textarea id="f-refNota" data-campo="refNota" placeholder="Deixe em branco para usar o texto padrão.">' +
        esc(ficha.refNota) + '</textarea></div>' +
      rodapeEtapa('proposta') +
      '</div>';
  }

  var SLOTS = [
    { chave: 'cliente',      rotulo: 'Foto do cliente',   dica: 'De frente. Usada na análise facial e no tipo de cabelo.' },
    { chave: 'ref1',         rotulo: 'Referência 01',     dica: 'Direção estética.' },
    { chave: 'ref2',         rotulo: 'Referência 02',     dica: 'Direção estética.' },
    { chave: 'ref3',         rotulo: 'Referência 03',     dica: 'Direção estética.' },
    { chave: 'antesFrente',  rotulo: 'Antes — de frente', dica: '' },
    { chave: 'depoisFrente', rotulo: 'Depois — de frente',dica: '' },
    { chave: 'antesPerfil',  rotulo: 'Antes — de perfil', dica: '' },
    { chave: 'depoisPerfil', rotulo: 'Depois — de perfil',dica: '' }
  ];

  function secaoFotos() {
    var ft = ficha.fotos || {};
    var slots = SLOTS.map(function (s) {
      var src = ft[s.chave];
      return '<div class="slot' + (src ? ' slot--preenchido' : '') + '" data-slot="' + s.chave +
             '" role="button" tabindex="0" aria-label="' + esc(s.rotulo) + '">' +
             (src
               ? '<img src="' + esc(src) + '" alt="' + esc(s.rotulo) + '">' +
                 '<button class="slot__limpar" data-limpar="' + s.chave + '" title="Remover foto" aria-label="Remover ' + esc(s.rotulo) + '">✕</button>'
               : '<div class="slot__vazio"><b>' + esc(s.rotulo) + '</b>' + esc(s.dica || 'Toque para enviar') + '</div>') +
             '<span class="slot__rotulo">' + esc(s.rotulo) + '</span>' +
             '</div>';
    }).join('');

    return '<div class="secao" data-secao="fotos">' +
      '<h3>Fotos</h3>' +
      '<p class="secao__dica">Toque num quadro para tirar a foto ou escolher da galeria. ' +
      'As fotos ficam só neste aparelho e são apagadas ao começar o próximo cliente.</p>' +
      '<div class="fotos">' + slots + '</div>' +
      rodapeEtapa('fotos') +
      '</div>';
  }

  function secaoManutencao() {
    var p = C.acharPerfil(ficha.perfil) || C.PERFIS[0];
    var rotina = (ficha.rotina && ficha.rotina.length) ? ficha.rotina : C.rotinaDe(ficha.cabelo);
    var linhasRotina = rotina.map(function (r, i) {
      return '<div class="linha"><input type="text" data-rotina="' + i + '" value="' + esc(r) + '">' +
             '<button class="btn btn--pequeno btn--perigo" data-remover-rotina="' + i + '" aria-label="Remover passo">✕</button></div>';
    }).join('');

    var produtos = (ficha.produtos && ficha.produtos.length) ? ficha.produtos : [{ nome: '', uso: '' }];
    var linhasProdutos = produtos.map(function (pr, i) {
      return '<div class="linha">' +
        '<input type="text" data-produto-nome="' + i + '" value="' + esc(pr.nome) + '" placeholder="Produto">' +
        '<input type="text" data-produto-uso="' + i + '" value="' + esc(pr.uso) + '" placeholder="Como usar">' +
        '<button class="btn btn--pequeno btn--perigo" data-remover-produto="' + i + '" aria-label="Remover produto">✕</button></div>';
    }).join('');

    return '<div class="secao" data-secao="manutencao">' +
      '<h3>Manutenção</h3>' +
      '<p class="secao__dica">A rotina vem preenchida conforme o tipo de cabelo. Ajuste à vontade.</p>' +
      '<div class="campo"><label>Rotina em casa</label>' +
        '<div class="linhas" id="linhas-rotina">' + linhasRotina + '</div>' +
        '<button type="button" class="btn btn--pequeno" data-acao="add-rotina">+ Passo</button>' +
        ' <button type="button" class="btn btn--pequeno" data-acao="reset-rotina">Refazer pelo tipo de cabelo</button>' +
      '</div>' +
      '<div class="campo"><label>Produtos indicados</label>' +
        '<div class="linhas" id="linhas-produtos">' + linhasProdutos + '</div>' +
        '<button type="button" class="btn btn--pequeno" data-acao="add-produto">+ Produto</button>' +
      '</div>' +
      '<div class="campo"><label for="f-retorno">Intervalo de retorno</label>' +
        '<input type="text" id="f-retorno" data-campo="retorno" value="' + esc(ficha.retorno) +
        '" placeholder="' + esc(p.manutencao) + '">' +
        '<p class="campo__ajuda">Em branco, usa o intervalo próprio do perfil ' + esc(p.nome) + '.</p></div>' +
      rodapeEtapa('manutencao') +
      '</div>';
  }

  /* As miniaturas do formulário redesenham na hora: é ali que o Wagner vê
     que trocar o formato ou a direção muda o desenho de verdade. */
  function atualizarMiniaturas() {
    var r = C.acharRosto(ficha.rosto) || C.ROSTOS[0];
    var mr = $('#mini-rosto'), mm = $('#mini-medidas'), pr = $('#previa-rosto');
    if (mr) mr.innerHTML = D.formatoRosto(r);
    if (pr) pr.innerHTML = '<b>Comunica</b>' + esc(r.comunica);
    if (mm) mm.innerHTML = D.medidasFrontal(ficha.medidas || {}, ficha.rosto, ficha.barbaDesenho);
  }

  /* =========================================================================
     EVENTOS DO FORMULÁRIO
  ========================================================================= */
  function aoMudar(alvo) {
    var campo = alvo.getAttribute('data-campo');
    if (campo) {
      ficha[campo] = alvo.value;
      if (campo === 'nome') $('#nome-editor').textContent = alvo.value || 'Novo cliente';
      if (campo === 'rosto' || campo === 'barbaDesenho') atualizarMiniaturas();
      agendarSalvar(); atualizarPreview();
      return;
    }
    var medida = alvo.getAttribute('data-medida');
    if (medida) {
      ficha.medidas = ficha.medidas || {};
      ficha.medidas[medida] = alvo.value;
      atualizarMiniaturas();
      agendarSalvar(); atualizarPreview();
      return;
    }
    var ir = alvo.getAttribute('data-rotina');
    if (ir !== null) {
      garantirRotina();
      ficha.rotina[Number(ir)] = alvo.value;
      agendarSalvar(); atualizarPreview();
      return;
    }
    var ipn = alvo.getAttribute('data-produto-nome');
    var ipu = alvo.getAttribute('data-produto-uso');
    if (ipn !== null || ipu !== null) {
      var idx = Number(ipn !== null ? ipn : ipu);
      ficha.produtos = ficha.produtos || [];
      ficha.produtos[idx] = ficha.produtos[idx] || { nome: '', uso: '' };
      ficha.produtos[idx][ipn !== null ? 'nome' : 'uso'] = alvo.value;
      agendarSalvar(); atualizarPreview();
    }
  }

  function ligarEditor() {
    $('#passos').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-passo]');
      if (b) trocarPasso(b.getAttribute('data-passo'));
    });

    var secoes = $('#secoes');
    secoes.addEventListener('input', function (ev) {
      if (ev.target.tagName !== 'SELECT') aoMudar(ev.target);
    });
    /* selects disparam change, não input, em alguns navegadores */
    secoes.addEventListener('change', function (ev) {
      if (ev.target.tagName === 'SELECT') aoMudar(ev.target);
    });

    secoes.addEventListener('click', function (ev) {
      var perfilBtn = ev.target.closest('[data-perfil]');
      if (perfilBtn) { escolherPerfil(perfilBtn.getAttribute('data-perfil')); return; }

      var ir = ev.target.closest('[data-ir]');
      if (ir) { trocarPasso(ir.getAttribute('data-ir')); window.scrollTo(0, 0); return; }

      var acao = ev.target.closest('[data-acao]');
      if (acao) {
        var nome = acao.getAttribute('data-acao');
        if (nome === 'gerar') { gerarPDF(); }
        if (nome === 'usar-modelo') {
          var p = C.acharPerfil(ficha.perfil) || C.PERFIS[0];
          ficha.proposta = p.proposta;
          $('#f-proposta').value = p.proposta;
          agendarSalvar(); atualizarPreview();
          avisar('Texto do perfil ' + p.nome + ' carregado. Ajuste como quiser.');
        }
        if (nome === 'add-rotina') {
          garantirRotina(); ficha.rotina.push('');
          montarFormulario(); trocarPasso('manutencao'); agendarSalvar();
        }
        if (nome === 'reset-rotina') {
          ficha.rotina = C.rotinaDe(ficha.cabelo).slice();
          montarFormulario(); trocarPasso('manutencao'); agendarSalvar(); atualizarPreview();
          avisar('Rotina refeita conforme o tipo de cabelo.');
        }
        if (nome === 'add-produto') {
          ficha.produtos = ficha.produtos || []; ficha.produtos.push({ nome: '', uso: '' });
          montarFormulario(); trocarPasso('manutencao'); agendarSalvar();
        }
        return;
      }

      var remRot = ev.target.closest('[data-remover-rotina]');
      if (remRot) {
        garantirRotina();
        ficha.rotina.splice(Number(remRot.getAttribute('data-remover-rotina')), 1);
        montarFormulario(); trocarPasso('manutencao'); agendarSalvar(); atualizarPreview();
        return;
      }
      var remProd = ev.target.closest('[data-remover-produto]');
      if (remProd) {
        ficha.produtos.splice(Number(remProd.getAttribute('data-remover-produto')), 1);
        if (!ficha.produtos.length) ficha.produtos = [{ nome: '', uso: '' }];
        montarFormulario(); trocarPasso('manutencao'); agendarSalvar(); atualizarPreview();
        return;
      }

      var limpar = ev.target.closest('[data-limpar]');
      if (limpar) {
        ev.stopPropagation();
        delete ficha.fotos[limpar.getAttribute('data-limpar')];
        montarFormulario(); trocarPasso('fotos'); agendarSalvar(); atualizarPreview();
        return;
      }

      var slot = ev.target.closest('[data-slot]');
      if (slot) pedirFoto(slot.getAttribute('data-slot'));
    });

    secoes.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var slot = ev.target.closest('[data-slot]');
      if (slot) { ev.preventDefault(); pedirFoto(slot.getAttribute('data-slot')); }
    });

    $('#btn-novo').addEventListener('click', novoCliente);
    $('#btn-pdf').addEventListener('click', gerarPDF);

    /* No celular a tela mostra a ficha OU o dossiê; este botão alterna. */
    $('#btn-alternar').addEventListener('click', function () {
      var editor = $('.editor');
      var vendoPrevia = editor.classList.toggle('editor--previa');
      this.textContent = vendoPrevia ? 'Ver ficha' : 'Ver dossiê';
      if (vendoPrevia) { ajustarEscala(); encaixarPaginas($('#palco')); }
    });
    $('#btn-anterior').addEventListener('click', function () { navegar(-1); });
    $('#btn-proxima').addEventListener('click', function () { navegar(1); });
  }

  function garantirRotina() {
    if (!ficha.rotina || !ficha.rotina.length) ficha.rotina = C.rotinaDe(ficha.cabelo).slice();
  }

  function escolherPerfil(slug) {
    var anterior = C.acharPerfil(ficha.perfil);
    ficha.perfil = slug;
    /* Se a proposta ainda é exatamente o modelo do perfil anterior, ela é
       trocada pelo modelo do novo perfil. Se o Wagner já escreveu algo próprio,
       o texto dele é preservado — trocar seria destruir trabalho. */
    if (!ficha.proposta || (anterior && ficha.proposta === anterior.proposta)) ficha.proposta = '';
    montarFormulario();
    trocarPasso('perfil');
    agendarSalvar();
    atualizarPreview();
  }

  function pedirFoto(chave) {
    var entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'image/*';
    entrada.addEventListener('change', function () {
      var arquivo = entrada.files && entrada.files[0];
      if (!arquivo) return;
      avisar('Preparando a foto…');
      prepararImagem(arquivo, 1600).then(function (dataURL) {
        ficha.fotos = ficha.fotos || {};
        ficha.fotos[chave] = dataURL;
        montarFormulario();
        trocarPasso('fotos');
        atualizarPreview();
        return salvarAgora();
      }).then(function () {
        avisar('Foto adicionada.');
      }).catch(function (e) {
        avisar(e && e.message ? e.message : 'Não consegui carregar essa imagem.', true);
      });
    });
    entrada.click();
  }

  function novoCliente() {
    var temAlgo = ficha && (ficha.nome || Object.keys(ficha.fotos || {}).length);
    if (temAlgo && !window.confirm('Começar um novo cliente? A ficha de ' + (ficha.nome || 'agora') +
        ' será apagada deste aparelho. Se ainda não salvou o PDF, gere antes.')) return;
    R.apagar().then(function () {
      ficha = fichaNova();
      passoAtivo = 'cliente';
      paginaAtual = 1;
      montarFormulario();
      atualizarPreview();
      $('#palco').scrollTop = 0;
      window.scrollTo(0, 0);
      avisar('Ficha em branco. Pode começar o próximo cliente.');
    });
  }

  /* =========================================================================
     RASCUNHO — ver rascunho.js
  ========================================================================= */
  function agendarSalvar() {
    clearTimeout(salvamentoPendente);
    salvamentoPendente = setTimeout(salvarAgora, 600);
  }
  function salvarAgora() {
    clearTimeout(salvamentoPendente);
    if (!ficha) return Promise.resolve();
    return R.salvar(ficha).catch(function () { /* sem rascunho, a ficha segue na tela */ });
  }

  /* =========================================================================
     PRÉ-VISUALIZAÇÃO
  ========================================================================= */
  var paginaAtual = 1;

  function atualizarPreview() {
    var palco = $('#palco');
    /* Remontar o dossiê zera a rolagem do palco. Sem guardar e devolver a
       posição, a prévia pulava para a primeira página a cada tecla digitada. */
    var posicao = palco.scrollTop;
    var paginas = S.montar(ficha);
    totalPaginas = paginas.length;
    palco.innerHTML = paginas.map(function (html) {
      return '<div class="moldura__caixa"><div class="moldura">' + html + '</div></div>';
    }).join('');
    palco.dataset.escalado = '';
    ajustarEscala();
    encaixarPaginas(palco);
    palco.scrollTop = posicao;
    $('#conta-paginas').textContent = paginas.length + ' páginas';
    marcarPagina();
  }

  /* A página tem 1080 px fixos e é reduzida por `scale()` para caber na
     coluna da prévia. A caixa em volta recebe o tamanho JÁ reduzido. */
  function ajustarEscala() {
    var palco = $('#palco');
    var largura = palco.clientWidth - 40;
    if (largura <= 0) return;
    var nova = Math.min(0.62, largura / LARG);
    if (Math.abs(nova - escalaPreview) < 0.001 && palco.dataset.escalado === '1') return;
    escalaPreview = nova;
    palco.dataset.escalado = '1';
    $$('.moldura', palco).forEach(function (m) { m.style.transform = 'scale(' + escalaPreview + ')'; });
    $$('.moldura__caixa', palco).forEach(function (c) {
      c.style.width = Math.round(LARG * escalaPreview) + 'px';
      c.style.height = Math.round(ALT * escalaPreview) + 'px';
    });
  }

  function observarPalco() {
    var palco = $('#palco');
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(function () { ajustarEscala(); }).observe(palco);
    } else {
      window.addEventListener('resize', ajustarEscala);
    }
  }

  function irParaPagina(n) {
    paginaAtual = Math.max(1, Math.min(totalPaginas, n));
    var palco = $('#palco');
    var alvo = $$('#palco .moldura__caixa')[paginaAtual - 1];
    if (alvo) palco.scrollTo({ top: alvo.offsetTop - palco.offsetTop - 16, behavior: 'smooth' });
    marcarPagina();
  }
  function navegar(passo) { irParaPagina(paginaAtual + passo); }
  function marcarPagina() {
    $('#indice-pagina').textContent = 'Página ' + paginaAtual + ' de ' + totalPaginas;
    $('#btn-anterior').disabled = paginaAtual <= 1;
    $('#btn-proxima').disabled = paginaAtual >= totalPaginas;
  }

  /* =========================================================================
     ENCAIXE DO TEXTO
     Uma proposta ou observação longa não pode ser cortada no pé da página.
     Se o miolo transborda, o fator --k da página desce aos poucos (até 78%)
     até caber. Só mexe na página que precisa — as outras ficam no tamanho
     cheio, que é o de leitura confortável no celular.
  ========================================================================= */
  function encaixarPaginas(raiz) {
    $$('.pg', raiz).forEach(function (pg) {
      var miolo = $('.pg__miolo', pg);
      if (!miolo || !miolo.clientHeight) return;
      var k = 1;
      pg.style.setProperty('--k', '1');
      while (miolo.scrollHeight > miolo.clientHeight + 2 && k > 0.78) {
        k = Math.round((k - 0.03) * 100) / 100;
        pg.style.setProperty('--k', String(k));
      }
    });
  }

  /* =========================================================================
     EXPORTAÇÃO DO PDF
     -------------------------------------------------------------------------
     Cada página é montada fora da tela em tamanho real, fotografada com
     html2canvas e colada numa folha em pé do jsPDF.

     Dois cuidados que o PDF anterior não tinha:
       1. FOTOS — o html2canvas ignora `object-fit: cover` e estica a foto
          até preencher a caixa (rostos achatados). Antes da captura, cada
          foto é recortada no tamanho exato da sua caixa.
       2. DIAGRAMAS — cada desenho é convertido em imagem na resolução final,
          para sair nítido mesmo com zoom.
  ========================================================================= */
  var ESCALA = 1.4;   /* 1080 px → 1512 px de largura: nítido em qualquer celular */

  function gerarPDF() {
    if (!window.jspdf || !window.html2canvas) {
      avisar('As bibliotecas de PDF não carregaram. Verifique a internet e recarregue a página.', true);
      return;
    }
    if (!ficha.nome) {
      avisar('Preencha o nome do cliente antes de gerar o PDF.', true);
      trocarPasso('cliente');
      var campoNome = $('#f-nome');
      if (campoNome) campoNome.focus();
      return;
    }

    var caixa = document.createElement('div');
    caixa.className = 'progresso';
    caixa.innerHTML = '<p id="progresso-texto">Preparando o dossiê…</p>' +
      '<div class="progresso__trilho"><div class="progresso__barra" id="progresso-barra"></div></div>';
    document.body.appendChild(caixa);

    var oficina = document.createElement('div');
    oficina.className = 'oficina';
    oficina.innerHTML = S.montar(ficha).join('');
    document.body.appendChild(oficina);
    var paginas = $$('.pg', oficina);

    /* Folha de 540 x 960 pt: 9:16, a proporção da própria página. */
    var pdf = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: [540, 960], compress: true });

    carregarFontes()
      .then(function () { return esperarImagens(oficina); })
      .then(function () { encaixarPaginas(oficina); })
      .then(function () { return recortarFotos(oficina); })
      .then(function () { return rasterizarDiagramas(oficina); })
      .then(function () { return processar(0); })
      .then(function () {
        $('#progresso-texto').textContent = 'Fechando o arquivo…';
        $('#progresso-barra').style.width = '100%';
        var blob = pdf.output('blob');
        limpar();
        mostrarEntrega(blob, nomeArquivo(ficha));
      })
      .catch(function (e) {
        limpar();
        avisar('Não consegui gerar o PDF: ' + (e && e.message ? e.message : 'erro inesperado'), true);
      });

    function processar(i) {
      if (i >= paginas.length) return Promise.resolve();
      $('#progresso-texto').textContent = 'Montando a página ' + (i + 1) + ' de ' + paginas.length + '…';
      $('#progresso-barra').style.width = ((i / paginas.length) * 100) + '%';
      return window.html2canvas(paginas[i], {
        scale: ESCALA, useCORS: true, backgroundColor: '#f7f4ed',
        width: LARG, height: ALT, windowWidth: LARG, windowHeight: ALT,
        logging: false
      }).then(function (tela) {
        var img = tela.toDataURL('image/jpeg', 0.84);
        if (i > 0) pdf.addPage([540, 960], 'portrait');
        pdf.addImage(img, 'JPEG', 0, 0, 540, 960, undefined, 'FAST');
        tela.width = tela.height = 0;   /* devolve a memória já — celular tem pouca */
        return processar(i + 1);
      });
    }

    function limpar() { oficina.remove(); caixa.remove(); }
  }

  function carregarFontes() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var pesos = ['400 34px Inter', '500 34px Inter', '600 34px Inter',
                 '400 40px "Playfair Display"', '700 40px "Playfair Display"', 'italic 400 40px "Playfair Display"'];
    return Promise.all(pesos.map(function (p) { return document.fonts.load(p).catch(function () {}); }))
      .then(function () { return document.fonts.ready; });
  }

  /* html2canvas não espera as imagens carregarem sozinho. */
  function esperarImagens(raiz) {
    return Promise.all($$('img', raiz).map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (ok) {
        img.addEventListener('load', ok, { once: true });
        img.addEventListener('error', ok, { once: true });
        setTimeout(ok, 8000);
      });
    }));
  }

  /* Recorta cada foto no tamanho exato da caixa, respeitando o enquadramento
     (object-position) definido no CSS. Depois disso a imagem já tem a
     proporção da caixa, e o html2canvas não tem mais o que esticar. */
  function recortarFotos(raiz) {
    return Promise.all($$('img[data-cobrir]', raiz).map(function (img) {
      var w = img.clientWidth, h = img.clientHeight;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      if (!w || !h || !iw || !ih) return null;
      var pos = getComputedStyle(img).objectPosition.split(' ');
      var px = pos[0] && pos[0].indexOf('%') > 0 ? parseFloat(pos[0]) / 100 : 0.5;
      var py = pos[1] && pos[1].indexOf('%') > 0 ? parseFloat(pos[1]) / 100 : 0.5;
      var esc = Math.max(w / iw, h / ih);
      var sw = w / esc, sh = h / esc;
      var sx = (iw - sw) * px, sy = (ih - sh) * py;
      var tela = document.createElement('canvas');
      tela.width = Math.round(w * ESCALA);
      tela.height = Math.round(h * ESCALA);
      var ctx = tela.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tela.width, tela.height);
      return new Promise(function (ok) {
        img.addEventListener('load', ok, { once: true });
        img.addEventListener('error', ok, { once: true });
        img.style.objectFit = 'fill';
        img.src = tela.toDataURL('image/jpeg', 0.9);
      });
    }));
  }

  /* Converte cada SVG num PNG já na resolução final. Deixado para o
     html2canvas, o desenho é rasterizado no tamanho de tela e ampliado —
     sai com o traço borrado. */
  function rasterizarDiagramas(raiz) {
    return Promise.all($$('.pg svg', raiz).map(function (svg) {
      var w = svg.clientWidth || svg.getBoundingClientRect().width;
      var h = svg.clientHeight || svg.getBoundingClientRect().height;
      if (!w || !h) return null;
      var copia = svg.cloneNode(true);
      copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      copia.setAttribute('width', Math.round(w * ESCALA));
      copia.setAttribute('height', Math.round(h * ESCALA));
      var dados = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copia));
      return new Promise(function (ok) {
        var img = new Image();
        img.onload = function () {
          var tela = document.createElement('canvas');
          tela.width = Math.round(w * ESCALA); tela.height = Math.round(h * ESCALA);
          tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height);
          var png = document.createElement('img');
          png.src = tela.toDataURL('image/png');
          png.style.width = w + 'px'; png.style.height = h + 'px'; png.style.display = 'block';
          png.onload = function () { svg.replaceWith(png); ok(); };
          png.onerror = function () { ok(); };
        };
        img.onerror = function () { ok(); };   /* sem conversão, o SVG segue como está */
        img.src = dados;
      });
    }));
  }

  /* =========================================================================
     ENTREGA DO ARQUIVO
     O PDF fica pronto na memória e a tela final oferece os botões. O toque
     no botão é o que libera o download (e o compartilhamento) no celular —
     disparado sozinho, depois de segundos gerando, o navegador bloqueia e o
     que sobra é um link. Era esse o "só manda um link".
  ========================================================================= */
  var urlAtual = null;

  function mostrarEntrega(blob, nome) {
    if (urlAtual) URL.revokeObjectURL(urlAtual);
    urlAtual = URL.createObjectURL(blob);
    var arquivo = null;
    try { arquivo = new File([blob], nome, { type: 'application/pdf' }); } catch (e) { arquivo = null; }
    var podeCompartilhar = !!(arquivo && navigator.canShare && navigator.canShare({ files: [arquivo] }));
    var mb = (blob.size / 1048576).toFixed(1).replace('.', ',');
    var ua = navigator.userAgent || '';
    var navegadorInterno = /Instagram|FBAN|FBAV|Line\/|WhatsApp/i.test(ua);

    var tela = document.createElement('div');
    tela.className = 'entrega';
    tela.setAttribute('role', 'dialog');
    tela.setAttribute('aria-modal', 'true');
    tela.innerHTML =
      '<div class="entrega__caixa">' +
        '<span class="entrega__selo">Dossiê pronto</span>' +
        '<h2>' + esc(ficha.nome) + '</h2>' +
        '<p class="entrega__arquivo">' + esc(nome) + ' · ' + mb + ' MB · ' + totalPaginas + ' páginas</p>' +
        '<a class="btn btn--ouro btn--largo btn--alto" id="entrega-baixar" href="' + urlAtual + '" download="' + esc(nome) + '">Salvar o PDF no celular</a>' +
        (podeCompartilhar
          ? '<button class="btn btn--largo btn--alto" id="entrega-enviar">Enviar para o cliente (WhatsApp…)</button>'
          : '') +
        (navegadorInterno
          ? '<p class="entrega__dica">Você abriu o sistema dentro de outro aplicativo. Se o PDF não baixar, ' +
            'toque nos três pontinhos e escolha <b>Abrir no navegador</b>.</p>'
          : '<p class="entrega__dica">No iPhone o arquivo vai para <b>Arquivos › Downloads</b>. ' +
            'No Android, para a pasta <b>Downloads</b>.</p>') +
        '<div class="entrega__fim">' +
          '<button class="btn btn--fantasma" id="entrega-voltar">Voltar à ficha</button>' +
          '<button class="btn" id="entrega-novo">Começar novo cliente</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(tela);

    $('#entrega-baixar', tela).addEventListener('click', function () {
      setTimeout(function () { avisar('PDF salvo. Confira em Downloads.'); }, 600);
    });
    var enviar = $('#entrega-enviar', tela);
    if (enviar) {
      enviar.addEventListener('click', function () {
        navigator.share({ files: [arquivo], title: 'Dossiê de Visagismo — ' + ficha.nome })
          .catch(function (e) { if (e && e.name !== 'AbortError') avisar('Não consegui abrir o compartilhamento.', true); });
      });
    }
    $('#entrega-voltar', tela).addEventListener('click', function () { tela.remove(); });
    $('#entrega-novo', tela).addEventListener('click', function () {
      tela.remove();
      novoCliente();
    });
  }

  /* =========================================================================
     INÍCIO
  ========================================================================= */
  function iniciar() {
    ligarEditor();
    observarPalco();

    $('#palco').addEventListener('scroll', function () {
      var caixas = $$('#palco .moldura__caixa');
      var topo = $('#palco').scrollTop;
      for (var i = 0; i < caixas.length; i++) {
        if (caixas[i].offsetTop + caixas[i].offsetHeight > topo + 120) {
          if (paginaAtual !== i + 1) { paginaAtual = i + 1; marcarPagina(); }
          break;
        }
      }
    });

    /* Se a página recarregou no meio do atendimento, a ficha volta. */
    R.ler().then(function (salva) {
      ficha = salva ? Object.assign(fichaNova(), salva) : fichaNova();
      montarFormulario();
      atualizarPreview();
      if (salva && (salva.nome || Object.keys(salva.fotos || {}).length)) {
        avisar('Continuando a ficha de ' + (salva.nome || 'cliente sem nome') + '.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
