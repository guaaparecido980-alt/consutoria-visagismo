/* =============================================================================
   DOSSIÊ DE VISAGISMO — APLICAÇÃO
   -----------------------------------------------------------------------------
   Painel de clientes, editor da ficha, pré-visualização ao vivo e exportação
   do PDF. Sem framework e sem build: o arquivo roda direto do navegador em
   qualquer hospedagem estática.
============================================================================= */
(function () {
  'use strict';

  var C = window.DossieConteudo;
  var D = window.DossieDiagramas;
  var S = window.DossieSlides;
  var DB = window.DossieDB;

  var $  = function (s, raiz) { return (raiz || document).querySelector(s); };
  var $$ = function (s, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(s)); };

  var ficha = null;             /* ficha aberta no editor                    */
  var salvamentoPendente = null;
  var escalaPreview = 1;
  var armazenamentoOk = true;   /* vira false se o navegador bloquear o banco */
  var modoArmazenamento = null; /* 'nuvem' ou 'local', decidido por db.js      */

  /* =========================================================================
     FICHA EM BRANCO
  ========================================================================= */
  function fichaNova() {
    var hoje = new Date();
    var iso = hoje.getFullYear() + '-' +
              String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
              String(hoje.getDate()).padStart(2, '0');
    return {
      id: DB.novoId(),
      nome: '', profissao: '', data: iso,
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
    return 'dossie-visagismo-' + (base || 'cliente') + '-' + (f.data || '') + '.pdf';
  }

  /* ---------------------------------------------------------------------------
     ENTREGA DE ARQUIVO
     Hospedado no site do Wagner, baixar um arquivo é um link comum. Publicado
     como página do claude.ai, a página não tem permissão de baixar nada
     sozinha: precisa pedir pela API do visualizador, que mostra uma
     confirmação ao visitante. Este helper cobre os dois casos, então o mesmo
     código roda nos dois lugares sem versão separada.
  --------------------------------------------------------------------------- */
  var canalDownload;   /* promessa memoizada: resolve a API ou null */

  function obterCanal() {
    if (canalDownload) return canalDownload;
    canalDownload = (window.claude && typeof window.claude.use === 'function')
      ? Promise.resolve(window.claude.use('downloads')).catch(function () { return null; })
      : Promise.resolve(null);
    return canalDownload;
  }

  function entregarArquivo(nomeDoArquivo, conteudo, tipoMime) {
    return obterCanal().then(function (canal) {
      if (canal && typeof canal.save === 'function') {
        return canal.save({ filename: nomeDoArquivo, data: conteudo }).then(function () {
          return 'entregue';
        }, function (erro) {
          var codigo = erro && erro.code;
          if (codigo === 'declined') return 'recusado';   /* o visitante disse não */
          throw erro;
        });
      }

      /* Sem a API: link comum, o caminho normal do site hospedado. */
      var blob = (conteudo instanceof Blob) ? conteudo : new Blob([conteudo], { type: tipoMime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = nomeDoArquivo;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      return 'baixado';
    });
  }

  /* Redimensiona a foto antes de guardar. Uma foto de celular tem 4 a 8 MB;
     depois disso fica com 200 a 400 KB, sem diferença visível no PDF.
     Devolve um Blob: quem decide se ele vira arquivo na nuvem ou dado
     embutido é a camada de armazenamento. */
  function prepararImagem(arquivo, ladoMax) {
    return new Promise(function (ok, erro) {
      var leitor = new FileReader();
      leitor.onerror = function () { erro(new Error('Não consegui ler o arquivo.')); };
      leitor.onload = function () {
        var img = new Image();
        img.onerror = function () { erro(new Error('Arquivo de imagem inválido.')); };
        img.onload = function () {
          var max = ladoMax || 1600;
          var escala = Math.min(1, max / Math.max(img.width, img.height));
          var l = Math.round(img.width * escala);
          var a = Math.round(img.height * escala);
          var tela = document.createElement('canvas');
          tela.width = l; tela.height = a;
          var ctx = tela.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, l, a);
          ctx.drawImage(img, 0, 0, l, a);
          tela.toBlob(function (blob) {
            if (blob) ok(blob);
            else erro(new Error('Não consegui processar essa imagem.'));
          }, 'image/jpeg', 0.86);
        };
        img.src = leitor.result;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  /* =========================================================================
     ROTEAMENTO SIMPLES ENTRE AS DUAS TELAS
  ========================================================================= */
  function mostrarPainel() {
    ficha = null;
    $('#tela-editor').classList.add('oculto');
    $('#tela-painel').classList.remove('oculto');
    $('#acoes-painel').classList.remove('oculto');
    document.title = 'Dossiê de Visagismo · Wagner Alves';
    renderPainel();
  }

  function abrirEditor(f) {
    ficha = f;
    $('#tela-painel').classList.add('oculto');
    $('#tela-editor').classList.remove('oculto');
    $('#acoes-painel').classList.add('oculto');
    document.title = (f.nome || 'Nova ficha') + ' · Dossiê de Visagismo';
    montarFormulario();
    atualizarPreview();
  }

  /* =========================================================================
     PAINEL DE CLIENTES
  ========================================================================= */
  var filtroBusca = '';
  var pedidoPainel = 0;     /* ver comentário em renderPainel() */
  var pedidoAbertura = 0;   /* idem, para a abertura de uma ficha        */

  /* Cada chamada recebe um número de ordem e só desenha se ainda for a mais
     recente. Sem isso, a primeira listagem (que ainda está abrindo o banco, e
     por isso demora) pode resolver DEPOIS de uma listagem posterior e repintar
     a tela com o resultado velho — foi exatamente assim que o painel voltava
     vazio logo após salvar uma ficha. */
  function renderPainel() {
    var meuPedido = ++pedidoPainel;

    DB.listar().catch(function (e) {
      if (meuPedido !== pedidoPainel) return null;
      armazenamentoOk = false;
      $('#contagem').textContent = 'Sem acesso ao armazenamento';
      $('#lista-clientes').className = '';
      $('#lista-clientes').innerHTML =
        '<div class="vazio"><h2>Este navegador não está guardando as fichas</h2>' +
        '<p>' + esc(e && e.message ? e.message : DB.ERRO_INDISPONIVEL) + '</p>' +
        '<button class="btn btn--ouro" data-acao="novo">Criar uma ficha mesmo assim</button></div>';
      return null;
    }).then(function (fichas) {
      if (!fichas || meuPedido !== pedidoPainel) return;
      var alvo = $('#lista-clientes');
      var visiveis = fichas.filter(function (f) {
        if (!filtroBusca) return true;
        return (f.nome || '').toLowerCase().indexOf(filtroBusca.toLowerCase()) !== -1;
      });

      var quantas = fichas.length === 0 ? 'Nenhuma ficha ainda' :
                    fichas.length === 1 ? '1 ficha guardada' :
                    fichas.length + ' fichas guardadas';
      var onde = modoArmazenamento === 'nuvem'
        ? ' · na nuvem, abre em qualquer aparelho'
        : modoArmazenamento === 'local' ? ' · neste computador' : '';
      $('#contagem').textContent = quantas + onde;

      if (!visiveis.length) {
        alvo.className = '';
        alvo.innerHTML = '<div class="vazio">' +
          '<h2>' + (filtroBusca ? 'Nenhum cliente com esse nome' : 'Nenhuma ficha por aqui ainda') + '</h2>' +
          '<p>' + (filtroBusca
            ? 'Tente outro trecho do nome ou limpe a busca.'
            : 'Cada ficha vira um dossiê completo em PDF: perfil comportamental, análise facial, medidas do corte, referências e antes e depois.') +
          '</p>' +
          (filtroBusca ? '' : '<button class="btn btn--ouro" data-acao="novo">Criar a primeira ficha</button>') +
          '</div>';
        return;
      }

      alvo.className = 'lista';
      alvo.innerHTML = visiveis.map(function (f) {
        var p = C.acharPerfil(f.perfil);
        var r = C.acharRosto(f.rosto);
        var c = C.acharCabelo(f.cabelo);
        var qtdFotos = Object.keys(f.fotos || {}).filter(function (k) { return f.fotos[k]; }).length;
        return '<button class="cartao" data-id="' + esc(f.id) + '">' +
          '<span class="cartao__apagar" role="button" tabindex="0" data-apagar="' + esc(f.id) +
            '" title="Apagar ficha" aria-label="Apagar ficha de ' + esc(f.nome || 'cliente') + '">✕</span>' +
          '<h3 class="cartao__nome">' + esc(f.nome || 'Sem nome') + '</h3>' +
          '<p class="cartao__meta">' + esc(S.dataExtenso(f.data) || '—') +
            (f.profissao ? ' · ' + esc(f.profissao) : '') + '</p>' +
          '<span class="cartao__tags">' +
            (p ? '<span class="tag tag--perfil">' + esc(p.nome) + '</span>' : '') +
            (r ? '<span class="tag">' + esc(r.nome.replace('Rosto ', '')) + '</span>' : '') +
            (c ? '<span class="tag">' + esc(c.nome) + '</span>' : '') +
            '<span class="tag">' + qtdFotos + '/8 fotos</span>' +
          '</span>' +
          '</button>';
      }).join('');
    });
  }

  function ligarPainel() {
    $('#lista-clientes').addEventListener('click', function (ev) {
      var apagar = ev.target.closest('[data-apagar]');
      if (apagar) {
        ev.stopPropagation();
        var id = apagar.getAttribute('data-apagar');
        DB.ler(id).then(function (f) {
          var nome = (f && f.nome) ? f.nome : 'esta ficha';
          if (window.confirm('Apagar a ficha de ' + nome + '? Isso não pode ser desfeito.')) {
            DB.remover(id).then(function () { avisar('Ficha apagada.'); renderPainel(); });
          }
        });
        return;
      }
      if (ev.target.closest('[data-acao="novo"]')) { abrirEditor(fichaNova()); return; }
      var cartao = ev.target.closest('.cartao');
      if (cartao) {
        /* Mesmo cuidado do renderPainel: dois cliques rápidos não podem fazer
           a ficha mais lenta sobrescrever a que o Wagner acabou de abrir. */
        var meuPedido = ++pedidoAbertura;
        DB.ler(cartao.getAttribute('data-id')).then(function (f) {
          if (f && meuPedido === pedidoAbertura) abrirEditor(f);
        });
      }
    });

    $('#btn-novo').addEventListener('click', function () { abrirEditor(fichaNova()); });
    $('#busca').addEventListener('input', function (ev) {
      filtroBusca = ev.target.value.trim();
      renderPainel();
    });

    $('#btn-backup').addEventListener('click', exportarBackup);
    $('#arq-restaurar').addEventListener('change', restaurarBackup);
  }

  /* =========================================================================
     BACKUP — a ficha vive no navegador, então a saída precisa ser fácil
  ========================================================================= */
  function exportarBackup() {
    DB.listar().then(function (fichas) {
      if (!fichas.length) { avisar('Não há fichas para salvar ainda.', true); return; }
      avisar('Montando o backup…');
      var nome = 'backup-dossies-' + new Date().toISOString().slice(0, 10) + '.json';

      DB.empacotarParaBackup(fichas).then(function (completas) {
        var conteudo = JSON.stringify({ versao: 1, fichas: completas }, null, 2);
        return entregarArquivo(nome, conteudo, 'application/json');
      }).then(function (resultado) {
        if (resultado === 'recusado') return;
        avisar(fichas.length + ' ficha(s), com as fotos, salvas no backup.');
      }).catch(function () {
        avisar('Não consegui montar o arquivo de backup.', true);
      });
    });
  }

  function restaurarBackup(ev) {
    var arquivo = ev.target.files && ev.target.files[0];
    if (!arquivo) return;
    var leitor = new FileReader();
    leitor.onload = function () {
      try {
        var dados = JSON.parse(leitor.result);
        var fichas = dados.fichas || dados;
        if (!Array.isArray(fichas)) throw new Error('formato');
        DB.importar(fichas).then(function (n) {
          avisar(n + ' ficha(s) restauradas.');
          renderPainel();
        });
      } catch (e) {
        avisar('Esse arquivo não é um backup válido do dossiê.', true);
      }
      ev.target.value = '';
    };
    leitor.readAsText(arquivo);
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
    $('#nome-editor').textContent = ficha.nome || 'Nova ficha';
    $('#meta-editor').textContent = ficha.criadoEm
      ? 'Criada em ' + new Date(ficha.criadoEm).toLocaleDateString('pt-BR')
      : 'Ficha ainda não salva';

    $('#passos').innerHTML = PASSOS.map(function (p) {
      return '<button class="passo" role="tab" data-passo="' + p.id + '" aria-selected="' +
             (p.id === passoAtivo) + '">' + esc(p.nome) + '</button>';
    }).join('');

    $('#secoes').innerHTML =
      secaoCliente() + secaoPerfil() + secaoRosto() + secaoCabelo() +
      secaoMedidas() + secaoProposta() + secaoFotos() + secaoManutencao();

    trocarPasso(passoAtivo);
  }

  function trocarPasso(id) {
    passoAtivo = id;
    /* Trocar de etapa é intenção de EDITAR: se a prévia estava aberta no
       celular, ela sai da frente sozinha. */
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
    var pagina = { cliente: 1, perfil: 3, rosto: 5, cabelo: 6, medidas: 7,
                   proposta: 8, fotos: 9, manutencao: 12 }[id];
    if (pagina) irParaPagina(pagina);
  }

  /* --- seções --------------------------------------------------------- */
  function secaoCliente() {
    return '<div class="secao" data-secao="cliente">' +
      '<h3>Dados do cliente</h3>' +
      '<p class="secao__dica">Aparecem na capa do dossiê.</p>' +
      '<div class="campo"><label for="f-nome">Nome completo</label>' +
        '<input type="text" id="f-nome" data-campo="nome" value="' + esc(ficha.nome) + '" placeholder="Ex.: Alemax Nunes"></div>' +
      '<div class="campo"><label for="f-prof">Profissão ou cargo</label>' +
        '<input type="text" id="f-prof" data-campo="profissao" value="' + esc(ficha.profissao) + '" placeholder="Ex.: Empresário">' +
        '<p class="campo__ajuda">Opcional. Entra na capa, abaixo do nome.</p></div>' +
      '<div class="campo"><label for="f-data">Data da consultoria</label>' +
        '<input type="date" id="f-data" data-campo="data" value="' + esc(ficha.data) + '"></div>' +
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
      '</div>';
  }

  function secaoRosto() {
    var r = C.acharRosto(ficha.rosto) || C.ROSTOS[0];
    return '<div class="secao" data-secao="rosto">' +
      '<h3>Análise facial</h3>' +
      '<p class="secao__dica">O traçado geométrico é desenhado automaticamente sobre a silhueta.</p>' +
      '<div class="campo"><label for="f-rosto">Formato do rosto</label>' +
        '<select id="f-rosto" data-campo="rosto">' + opcoes(C.ROSTOS, ficha.rosto) + '</select></div>' +
      '<div class="previa" id="previa-rosto"><b>Comunica</b>' + esc(r.comunica) + '</div>' +
      '<div class="campo"><label for="f-rostoNota">Observação da consultoria</label>' +
        '<textarea id="f-rostoNota" data-campo="rostoNota" placeholder="Ex.: assimetria leve no lado direito da mandíbula, compensada pelo caimento do topo.">' +
        esc(ficha.rostoNota) + '</textarea></div>' +
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
      '</div>';
  }

  function secaoMedidas() {
    var m = ficha.medidas || {};
    return '<div class="secao" data-secao="medidas">' +
      '<h3>Projeto técnico</h3>' +
      '<p class="secao__dica">As medidas entram escritas dentro do diagrama — é a página que o ' +
      'cliente leva para qualquer barbeiro reproduzir o corte.</p>' +
      '<div class="quadra">' +
        campoMedida('topo', 'Topo (cm)', m.topo) +
        campoMedida('franja', 'Frente / franja (cm)', m.franja) +
        campoMedida('lateral', 'Laterais (cm)', m.lateral) +
        campoMedida('nuca', 'Nuca (cm)', m.nuca) +
      '</div>' +
      '<div class="dupla">' +
        '<div class="campo"><label for="f-direcao">Direção do fio</label>' +
          '<select id="f-direcao" data-medida="direcao">' +
          D.listaDirecoes().map(function (d) {
            return '<option value="' + d.slug + '"' + (d.slug === m.direcao ? ' selected' : '') + '>' +
                   esc(d.nome) + '</option>';
          }).join('') + '</select></div>' +
        '<div class="campo"><label for="f-barbaMm">Barba (mm)</label>' +
          '<input type="number" step="0.5" min="0" id="f-barbaMm" data-medida="barbaMm" value="' +
          esc(m.barbaMm) + '" placeholder="Ex.: 3"></div>' +
      '</div>' +
      '<div class="campo"><label for="f-barbaDesenho">Desenho da barba</label>' +
        '<select id="f-barbaDesenho" data-campo="barbaDesenho">' +
        D.listaBarbas().map(function (b) {
          return '<option value="' + b.slug + '"' + (b.slug === ficha.barbaDesenho ? ' selected' : '') + '>' +
                 esc(b.nome) + '</option>';
        }).join('') + '</select></div>' +
      '<div class="campo"><label for="f-tecnicas">Técnicas aplicadas</label>' +
        '<textarea id="f-tecnicas" data-campo="tecnicas" placeholder="Uma técnica por linha. Ex.:&#10;Navalha nas laterais&#10;Tesoura desfiando no topo&#10;Deep cut nas pontas">' +
        esc(ficha.tecnicas) + '</textarea>' +
        '<p class="campo__ajuda">Uma por linha. Viram a lista da página de projeto técnico.</p></div>' +
      '</div>';
  }

  function campoMedida(chave, rotulo, valor) {
    return '<div class="campo"><label for="f-' + chave + '">' + esc(rotulo) + '</label>' +
      '<input type="number" step="0.5" min="0" id="f-' + chave + '" data-medida="' + chave +
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
      '</div>';
  }

  var SLOTS = [
    { chave: 'cliente',      rotulo: 'Foto do cliente',   dica: 'Frontal, usada na análise facial e na estrutura do fio.' },
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
      var src = DB.srcFoto(ft[s.chave]);
      return '<div class="slot' + (src ? ' slot--preenchido' : '') + '" data-slot="' + s.chave +
             '" role="button" tabindex="0" aria-label="' + esc(s.rotulo) + '">' +
             (src
               ? '<img src="' + esc(src) + '" alt="' + esc(s.rotulo) + '">' +
                 '<button class="slot__limpar" data-limpar="' + s.chave + '" title="Remover foto" aria-label="Remover ' + esc(s.rotulo) + '">✕</button>'
               : '<div class="slot__vazio"><b>' + esc(s.rotulo) + '</b>' + esc(s.dica || 'Clique para enviar') + '</div>') +
             '<span class="slot__rotulo">' + esc(s.rotulo) + '</span>' +
             '</div>';
    }).join('');

    return '<div class="secao" data-secao="fotos">' +
      '<h3>Fotos</h3>' +
      '<p class="secao__dica">' + esc(textoDestinoDasFotos()) + '</p>' +
      '<div class="fotos">' + slots + '</div>' +
      '</div>';
  }

  /* O destino das fotos muda conforme o modo; a tela não pode prometer o que
     não é verdade naquele momento. */
  function textoDestinoDasFotos() {
    if (modoArmazenamento === 'nuvem') {
      return 'As fotos vão para a sua conta, junto da ficha — por isso a foto que você ' +
             'envia pelo celular aparece no computador. São redimensionadas ao serem escolhidas.';
    }
    if (modoArmazenamento === 'local') {
      return 'As fotos ficam guardadas apenas neste aparelho — não são enviadas para ' +
             'nenhum servidor. São redimensionadas ao serem escolhidas.';
    }
    return 'As fotos são redimensionadas automaticamente ao serem escolhidas.';
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
      '</div>';
  }

  /* =========================================================================
     EVENTOS DO FORMULÁRIO
  ========================================================================= */
  function ligarEditor() {
    $('#passos').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-passo]');
      if (b) trocarPasso(b.getAttribute('data-passo'));
    });

    var secoes = $('#secoes');

    secoes.addEventListener('input', function (ev) {
      var alvo = ev.target;
      var campo = alvo.getAttribute('data-campo');
      if (campo) {
        ficha[campo] = alvo.value;
        if (campo === 'nome') $('#nome-editor').textContent = alvo.value || 'Nova ficha';
        if (campo === 'rosto') atualizarPreviaRosto();
        if (campo === 'cabelo') { /* a rotina só é refeita a pedido, para não apagar edições */ }
        agendarSalvar();
        atualizarPreview();
        return;
      }
      var medida = alvo.getAttribute('data-medida');
      if (medida) {
        ficha.medidas = ficha.medidas || {};
        ficha.medidas[medida] = alvo.value;
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
    });

    secoes.addEventListener('change', function (ev) {
      /* selects disparam change, não input, em alguns navegadores */
      if (ev.target.tagName === 'SELECT') {
        var campo = ev.target.getAttribute('data-campo');
        var medida = ev.target.getAttribute('data-medida');
        if (campo) { ficha[campo] = ev.target.value; if (campo === 'rosto') atualizarPreviaRosto(); }
        if (medida) { ficha.medidas = ficha.medidas || {}; ficha.medidas[medida] = ev.target.value; }
        agendarSalvar(); atualizarPreview();
      }
    });

    secoes.addEventListener('click', function (ev) {
      var perfilBtn = ev.target.closest('[data-perfil]');
      if (perfilBtn) { escolherPerfil(perfilBtn.getAttribute('data-perfil')); return; }

      var acao = ev.target.closest('[data-acao]');
      if (acao) {
        var nome = acao.getAttribute('data-acao');
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

    $('#btn-voltar').addEventListener('click', function () {
      salvarAgora().then(mostrarPainel);
    });
    $('#btn-salvar').addEventListener('click', function () {
      salvarAgora().then(function () { avisar('Ficha salva.'); });
    });
    $('#btn-pdf').addEventListener('click', exportarPDF);

    /* No celular a tela mostra a ficha OU o dossiê; este botão alterna. */
    $('#btn-alternar').addEventListener('click', function () {
      var editor = $('.editor');
      var vendoPrevia = editor.classList.toggle('editor--previa');
      this.textContent = vendoPrevia ? 'Ver ficha' : 'Ver dossiê';
      if (vendoPrevia) ajustarEscala();
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
    var novo = C.acharPerfil(slug);

    /* Se a proposta ainda é exatamente o modelo do perfil anterior, ela é
       trocada pelo modelo do novo perfil. Se o Wagner já escreveu algo próprio,
       o texto dele é preservado — trocar seria destruir trabalho. */
    if (novo && (!ficha.proposta || (anterior && ficha.proposta === anterior.proposta))) {
      ficha.proposta = '';
    }
    montarFormulario();
    trocarPasso('perfil');
    agendarSalvar();
    atualizarPreview();
  }

  function atualizarPreviaRosto() {
    var r = C.acharRosto(ficha.rosto);
    var el = $('#previa-rosto');
    if (r && el) el.innerHTML = '<b>Comunica</b>' + esc(r.comunica);
  }

  function pedirFoto(chave) {
    var entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'image/*';
    entrada.addEventListener('change', function () {
      var arquivo = entrada.files && entrada.files[0];
      if (!arquivo) return;
      avisar('Enviando a foto…');
      prepararImagem(arquivo, 1600).then(function (blob) {
        return DB.guardarFoto(blob);
      }).then(function (referencia) {
        ficha.fotos = ficha.fotos || {};
        ficha.fotos[chave] = referencia;
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

  /* =========================================================================
     SALVAMENTO
  ========================================================================= */
  function agendarSalvar() {
    clearTimeout(salvamentoPendente);
    if (!armazenamentoOk) { $('#estado-salvo').textContent = 'Não salvo'; return; }
    $('#estado-salvo').textContent = 'Salvando…';
    salvamentoPendente = setTimeout(salvarAgora, 700);
  }

  function salvarAgora() {
    clearTimeout(salvamentoPendente);
    if (!ficha) return Promise.resolve();
    if (!armazenamentoOk) { $('#estado-salvo').textContent = 'Não salvo'; return Promise.resolve(); }

    return DB.salvar(ficha).then(function () {
      $('#estado-salvo').textContent = 'Salvo';
    }).catch(function (e) {
      /* Uma vez que o navegador recusou o banco, ele vai recusar sempre: marca
         o estado e para de tentar, em vez de repetir o erro a cada tecla. */
      armazenamentoOk = false;
      $('#estado-salvo').textContent = 'Não salvo';
      avisar(e && e.message ? e.message : 'Não consegui salvar a ficha neste navegador.', true);
    });
  }

  /* =========================================================================
     PRÉ-VISUALIZAÇÃO
  ========================================================================= */
  var paginaAtual = 1;

  function atualizarPreview() {
    var palco = $('#palco');
    var paginas = S.montar(ficha);
    palco.innerHTML = paginas.map(function (html) {
      return '<div class="moldura__caixa"><div class="moldura">' + html + '</div></div>';
    }).join('');
    palco.dataset.escalado = '';   /* conteúdo novo: força remedir */
    ajustarEscala();
    $('#conta-paginas').textContent = paginas.length + ' páginas';
    marcarPagina();
  }

  /* A página do dossiê tem 1440 px fixos e é reduzida por `scale()` para caber
     na coluna da prévia. A caixa em volta recebe o tamanho JÁ reduzido, senão
     ela continuaria ocupando 1440 px e empurraria a página para fora da tela. */
  function ajustarEscala() {
    var palco = $('#palco');
    var largura = palco.clientWidth - 52;          /* 26 px de respiro de cada lado */
    if (largura <= 0) return;                      /* ainda sem layout: tenta depois */

    var nova = Math.min(1, largura / 1440);
    if (Math.abs(nova - escalaPreview) < 0.001 && palco.dataset.escalado === '1') return;
    escalaPreview = nova;
    palco.dataset.escalado = '1';

    $$('.moldura', palco).forEach(function (m) {
      m.style.transform = 'scale(' + escalaPreview + ')';
    });
    $$('.moldura__caixa', palco).forEach(function (c) {
      c.style.width = Math.round(1440 * escalaPreview) + 'px';
      c.style.height = Math.round(810 * escalaPreview) + 'px';
    });
  }

  /* O ResizeObserver existe porque a primeira medida pode acontecer antes de o
     navegador terminar de posicionar as duas colunas do editor — nesse instante
     a coluna da prévia ainda não tem a largura final e a página sairia cortada.
     Observando o elemento, a escala se corrige sozinha assim que ele assenta. */
  function observarPalco() {
    var palco = $('#palco');
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(function () { ajustarEscala(); }).observe(palco);
    } else {
      window.addEventListener('resize', ajustarEscala);
    }
  }

  function irParaPagina(n) {
    paginaAtual = Math.max(1, Math.min(13, n));
    var caixas = $$('#palco .moldura__caixa');
    var alvo = caixas[paginaAtual - 1];
    if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    marcarPagina();
  }

  function navegar(passo) { irParaPagina(paginaAtual + passo); }

  function marcarPagina() {
    $('#indice-pagina').textContent = 'Página ' + paginaAtual + ' de 13';
    $('#btn-anterior').disabled = paginaAtual <= 1;
    $('#btn-proxima').disabled = paginaAtual >= 13;
  }

  /* =========================================================================
     EXPORTAÇÃO DO PDF
     -------------------------------------------------------------------------
     Cada página é fotografada com html2canvas em escala 2 e colada em uma
     folha 16:9 do jsPDF. É o caminho que garante que o PDF fique idêntico ao
     que aparece na tela, com as fotos e os diagramas no lugar.
  ========================================================================= */
  function exportarPDF() {
    if (!window.jspdf || !window.html2canvas) {
      avisar('As bibliotecas de PDF não carregaram. Verifique a conexão e recarregue a página.', true);
      return;
    }
    if (!ficha) { avisar('Abra uma ficha antes de gerar o dossiê.', true); return; }
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

    /* As páginas são montadas fora da tela, em tamanho real — renderizar a
       versão reduzida do preview produziria um PDF borrado. */
    var oficina = document.createElement('div');
    oficina.style.cssText = 'position:fixed;left:-20000px;top:0;width:1440px;';
    oficina.innerHTML = S.montar(ficha).join('');
    document.body.appendChild(oficina);

    var paginas = $$('.pg', oficina);

    /* Folha de 960 x 540 pt: o formato 16:9 de apresentação (13,33 x 7,5 pol).
       Cada página é fotografada a 1440 x 810 CSS px em escala 2 — ou seja
       2880 x 1620 px reais — o que dá 216 dpi na folha. Sobra resolução tanto
       para a tela quanto para impressão. */
    var LARGURA = 960, ALTURA = 540;
    var pdf = new window.jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: [LARGURA, ALTURA] });

    var fontesProntas = document.fonts && document.fonts.ready
      ? document.fonts.ready : Promise.resolve();

    fontesProntas
      .then(function () { return esperarImagens(oficina); })
      .then(function () { return processar(0); })
      .then(function () {
        $('#progresso-texto').textContent = 'Fechando o arquivo…';
        $('#progresso-barra').style.width = '100%';
        return entregarArquivo(nomeArquivo(ficha), pdf.output('blob'), 'application/pdf');
      })
      .then(function (resultado) {
        limpar();
        if (resultado === 'recusado') return;
        avisar(resultado === 'entregue'
          ? 'Dossiê gerado e salvo.'
          : 'Dossiê gerado. O download começou.');
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
        scale: 2, useCORS: true, backgroundColor: '#f7f4ed',
        width: 1440, height: 810, windowWidth: 1440, windowHeight: 810,
        logging: false
      }).then(function (tela) {
        var img = tela.toDataURL('image/jpeg', 0.92);
        if (i > 0) pdf.addPage([LARGURA, ALTURA], 'landscape');
        pdf.addImage(img, 'JPEG', 0, 0, LARGURA, ALTURA, undefined, 'FAST');
        return processar(i + 1);
      });
    }

    function limpar() {
      oficina.remove();
      caixa.remove();
    }
  }

  /* html2canvas não espera as imagens carregarem sozinho. */
  function esperarImagens(raiz) {
    var imgs = $$('img', raiz);
    return Promise.all(imgs.map(function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (ok) {
        img.addEventListener('load', ok, { once: true });
        img.addEventListener('error', ok, { once: true });
        setTimeout(ok, 6000);
      });
    }));
  }

  /* =========================================================================
     INÍCIO
  ========================================================================= */
  function iniciar() {
    ligarPainel();
    ligarEditor();
    mostrarPainel();

    /* A escolha entre nuvem e navegador leva um instante (a página publicada
       responde depois do primeiro ciclo). Assim que chegar, o painel repinta
       para dizer onde as fichas estão sendo guardadas. */
    DB.pronto().then(function (info) {
      modoArmazenamento = info.modo;
      if (info.modo === 'nuvem' && !info.fotosOk) {
        avisar('Nesta janela dá para editar as fichas, mas não enviar fotos.', true);
      }
      if (ficha === null) renderPainel();
    }).catch(function () { /* o próprio painel já reporta a falha */ });

    observarPalco();

    $('#palco').addEventListener('scroll', function () {
      var caixas = $$('#palco .moldura__caixa');
      var topo = $('#palco').scrollTop;
      for (var i = 0; i < caixas.length; i++) {
        if (caixas[i].offsetTop + caixas[i].offsetHeight > topo + 80) {
          if (paginaAtual !== i + 1) { paginaAtual = i + 1; marcarPagina(); }
          break;
        }
      }
    });

    window.addEventListener('beforeunload', function (ev) {
      if (ficha && armazenamentoOk && $('#estado-salvo').textContent === 'Salvando…') {
        ev.preventDefault();
        ev.returnValue = '';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
