/* =============================================================================
   DOSSIÊ DE VISAGISMO — MONTAGEM DAS PÁGINAS
   -----------------------------------------------------------------------------
   Recebe a ficha do cliente e devolve as páginas do dossiê em HTML.
   O mesmo HTML é usado na pré-visualização da tela e na exportação do PDF —
   o que o Wagner vê é exatamente o que o cliente recebe.

   Formato da página: 1080 x 1920 px, em pé — a proporção da tela do celular.
   O dossiê é lido no celular: cada página ocupa a tela inteira, sem precisar
   dar zoom. O formato deitado de apresentação deixava o texto do tamanho de
   uma nota de rodapé quando aberto no telefone.
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.DossieSlides = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Dependências: conteudo.js e diagramas.js precisam ser carregados antes. */
  var G = (typeof self !== 'undefined') ? self : this;
  var C = G.DossieConteudo;
  var D = G.DossieDiagramas;

  var LARGURA = 1080, ALTURA = 1920;

  /* ---------------------------------------------------------------------- */
  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function paragrafos(texto) {
    return String(texto || '').split(/\n{2,}/).filter(Boolean)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function dataExtenso(iso) {
    if (!iso) return '';
    var partes = String(iso).split('-');
    if (partes.length !== 3) return iso;
    var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return Number(partes[2]) + ' de ' + meses[Number(partes[1]) - 1] + ' de ' + partes[0];
  }

  /* Moldura de foto: mostra a imagem quando existe e um marcador discreto
     quando ainda não foi enviada — assim a pré-visualização nunca "quebra".
     `data-cobrir` marca a imagem para ser recortada na exportação: o
     html2canvas ignora `object-fit: cover` e ESTICAVA a foto para caber na
     caixa — era o que deixava os rostos achatados no PDF. */
  function foto(src, legenda, classe) {
    var cls = 'foto ' + (classe || '');
    if (src) {
      return '<figure class="' + cls + '">' +
             '<img data-cobrir src="' + esc(src) + '" alt="' + esc(legenda || '') + '">' +
             (legenda ? '<figcaption>' + esc(legenda) + '</figcaption>' : '') +
             '</figure>';
    }
    return '<figure class="' + cls + ' foto--vazia">' +
           '<div class="foto__placeholder"><span>' + esc(legenda || 'Foto') + '</span></div>' +
           '</figure>';
  }

  /* Cada página recebe o número na montagem final — assim acrescentar ou
     tirar uma página não exige renumerar nada à mão. */
  function pagina(classe, conteudo, rodape) {
    return {
      rodape: rodape !== false,
      html: function (n) {
        return '<section class="pg ' + classe + '" data-pg="' + n + '">' +
               '<div class="pg__miolo">' + conteudo + '</div>' +
               (rodape === false ? '' :
                 '<div class="pg__rodape"><span class="pg__marca">WAGNER ALVES · VISAGISMO</span>' +
                 '<span class="pg__num">' + String(n).padStart(2, '0') + '</span></div>') +
               '</section>';
      }
    };
  }

  function tituloSecao(kicker, titulo) {
    return '<header class="sec">' +
           '<span class="sec__kicker">' + esc(kicker) + '</span>' +
           '<h2 class="sec__titulo">' + esc(titulo) + '</h2>' +
           '<span class="sec__regua"></span>' +
           '</header>';
  }
  function bloco(rotulo, texto, extra) {
    return '<div class="bloco' + (extra ? ' ' + extra : '') + '"><span class="rotulo">' + esc(rotulo) + '</span>' +
           '<p>' + esc(texto) + '</p></div>';
  }

  /* =========================================================================
     AS PÁGINAS
  ========================================================================= */

  /* CAPA — retrato do Wagner sangrando no alto, título embaixo */
  function pgCapa(f) {
    return pagina('pg--capa', '' +
      '<div class="capa__retrato"><img data-cobrir src="assets/wagner-capa.jpg" alt="Wagner Alves, visagista"></div>' +
      '<div class="capa__veu"></div>' +
      '<div class="capa__texto">' +
        '<span class="capa__kicker">Consultoria de</span>' +
        '<h1 class="capa__titulo">VISAGISMO</h1>' +
        '<span class="capa__regua"></span>' +
        '<p class="capa__cliente">' + esc(f.nome || 'Nome do cliente') + '</p>' +
        (f.profissao ? '<p class="capa__profissao">' + esc(f.profissao) + '</p>' : '') +
        '<p class="capa__data">' + esc(dataExtenso(f.data)) + '</p>' +
      '</div>' +
      '<div class="capa__assinatura">' + esc(C.MARCA.consultor) + ' · ' + esc(C.MARCA.cidade) + '</div>',
      false);
  }

  /* SUMÁRIO */
  function pgSumario() {
    var itens = C.SUMARIO.map(function (s) {
      return '<li class="sum__item">' +
             '<span class="sum__n">' + esc(s.n) + '</span>' +
             '<div><h3>' + esc(s.titulo) + '</h3><p>' + esc(s.desc) + '</p></div>' +
             '</li>';
    }).join('');
    return pagina('pg--sumario', '' +
      tituloSecao('Dossiê pessoal', 'O que você vai encontrar') +
      '<ol class="sum">' + itens + '</ol>' +
      '<p class="sum__nota">Este documento foi construído a partir da leitura do seu perfil, ' +
      'da geometria do seu rosto e da estrutura do seu fio. Nada aqui é modelo pronto.</p>');
  }

  /* 01 — PERFIL COMPORTAMENTAL (texto exclusivo do perfil escolhido) */
  function pgPerfil(f) {
    var p = C.acharPerfil(f.perfil) || C.PERFIS[0];
    var chaves = p.palavrasChave.map(function (k) { return '<li>' + esc(k) + '</li>'; }).join('');
    return pagina('pg--perfil', '' +
      tituloSecao('01 · Perfil comportamental', p.nome) +
      '<div class="perfil__cartao">' +
        '<div class="emblema">' + p.emblema + '</div>' +
        '<div class="perfil__cartao-texto">' +
          '<span class="perfil__temperamento">Temperamento ' + esc(p.temperamento) + '</span>' +
          '<span class="perfil__essencia">' + esc(p.essencia) + '</span>' +
        '</div>' +
        '<ul class="chaves">' + chaves + '</ul>' +
      '</div>' +
      '<div class="corpo">' + paragrafos(p.descricao) + '</div>' +
      '<div class="corpo corpo--nota">' + paragrafos(p.comoOMundoLe) + '</div>' +
      (f.perfilNota ? '<div class="corpo corpo--manuscrito">' + paragrafos(f.perfilNota) + '</div>' : ''));
  }

  /* 02 — DIREÇÃO DE IMAGEM, em duas páginas: a leitura e a execução */
  function pgDirecao(f) {
    var p = C.acharPerfil(f.perfil) || C.PERFIS[0];
    var d = p.direcao;
    return pagina('pg--direcao', '' +
      tituloSecao('02 · Direção de imagem', 'O que a sua imagem precisa comunicar') +
      '<div class="direcao__linhas">' + D.linhasGestalt(p.slug) + '</div>' +
      '<div class="direcao__linha">' +
        '<span class="rotulo">Linha predominante</span>' +
        '<strong>' + esc(d.linha) + '</strong>' +
        '<p>' + esc(d.significado) + '</p>' +
      '</div>' +
      '<div class="direcao__objetivo">' +
        '<span class="rotulo">Objetivo</span>' +
        '<p class="destaque">' + esc(d.objetivo) + '</p>' +
      '</div>');
  }

  function pgExecucao(f) {
    var d = (C.acharPerfil(f.perfil) || C.PERFIS[0]).direcao;
    return pagina('pg--execucao', '' +
      tituloSecao('02 · Direção de imagem', 'Como isso vira corte') +
      '<div class="execucao">' +
        bloco('Corte', d.corte) +
        bloco('Barba', d.barba) +
        bloco('Acabamento', d.acabamento) +
        bloco('O que evitar', d.evitar, 'bloco--evitar') +
      '</div>');
  }

  /* 03 — ANÁLISE FACIAL, em duas páginas: o formato (modelo 3D com as
     linhas) e o que ele pede no corte */
  function pgRosto(f) {
    var r = C.acharRosto(f.rosto) || C.ROSTOS[0];
    var prop = D.proporcaoRosto(r.slug);
    return pagina('pg--rosto', '' +
      tituloSecao('03 · Análise facial', 'O que mais se aproxima') +
      '<h3 class="rosto__nome">' + esc(r.nome) + '</h3>' +
      D.formatoRosto(r) +
      '<p class="rosto__legenda">Modelo de referência do formato' +
        (prop ? ' · comprimento ' + prop.toFixed(2).replace('.', ',') + ' × a largura das maçãs' : '') + '</p>' +
      '<div class="corpo corpo--menor">' + paragrafos(r.descricao) + '</div>' +
      bloco('Comunica', r.comunica));
  }

  function pgRosto2(f) {
    var r = C.acharRosto(f.rosto) || C.ROSTOS[0];
    return pagina('pg--rosto2', '' +
      tituloSecao('03 · Análise facial', 'O que o seu rosto pede') +
      foto(f.fotos && f.fotos.cliente, 'Análise presencial', 'foto--faixa') +
      bloco('Estratégia de corte', r.estrategia) +
      bloco('Barba', r.barba) +
      bloco('O que evitar', r.evitar, 'bloco--evitar') +
      (f.rostoNota ? bloco('Observação da consultoria', f.rostoNota, 'bloco--nota') : ''));
  }

  /* 04 — ESTRUTURA DO FIO */
  function pgCabelo(f) {
    var c = C.acharCabelo(f.cabelo) || C.CABELOS[0];
    var dens = C.acharPor(C.DENSIDADES, f.densidade);
    var couro = C.acharPor(C.COUROS, f.couro);
    return pagina('pg--cabelo', '' +
      tituloSecao('04 · Estrutura do fio', 'Tipo de cabelo') +
      '<h3 class="cabelo__tipo">' + esc(c.nome) + ' <span class="cabelo__grupo">' + esc(c.grupo) + '</span></h3>' +
      foto(f.fotos && f.fotos.cliente, 'Estrutura observada', 'foto--faixa') +
      '<div class="corpo corpo--menor">' + paragrafos(c.descricao) + '</div>' +
      bloco('Manejo técnico', c.manejo) +
      (dens ? bloco(dens.nome, dens.nota) : '') +
      (couro ? bloco('Couro cabeludo ' + couro.nome.toLowerCase(), couro.nota) : ''));
  }

  /* 05 — PROJETO TÉCNICO: medidas (vista frontal) */
  function pgProjeto(f) {
    var m = (f.medidas || {});
    var cotas = [
      ['Topo', m.topo, 'cm'], ['Frente', m.franja, 'cm'],
      ['Laterais', m.lateral, 'cm'], ['Nuca', m.nuca, 'cm'],
      ['Barba', m.barbaMm, 'mm']
    ].map(function (l) {
      return '<div class="cota">' +
             '<span class="cota__nome">' + esc(l[0]) + '</span>' +
             '<strong class="cota__valor">' +
             (l[1] ? esc(String(l[1]).replace('.', ',')) + '<em>' + l[2] + '</em>' : '—') +
             '</strong></div>';
    }).join('');

    return pagina('pg--projeto', '' +
      tituloSecao('05 · Projeto técnico', 'As medidas do seu corte') +
      '<div class="diagrama diagrama--alto">' + D.medidasFrontal(m, f.rosto, f.barbaDesenho) + '</div>' +
      '<div class="cotas">' + cotas + '</div>' +
      '<p class="projeto__nota">Leve esta página a qualquer barbeiro: as medidas estão no desenho.</p>');
  }

  /* 05 — PROJETO TÉCNICO: direção do fio e barba */
  function pgProjeto2(f) {
    var m = (f.medidas || {});
    var tecnicas = (f.tecnicas || '').split(/[\r\n]+/).map(function (t) { return t.trim(); }).filter(Boolean);
    return pagina('pg--projeto2', '' +
      tituloSecao('05 · Projeto técnico', 'Direção do fio e barba') +
      '<div class="projeto__par">' +
        '<div class="diagrama">' + D.medidasPerfil(m, f.rosto, f.barbaDesenho) + '</div>' +
        '<div class="diagrama">' + D.desenhoBarba(f.barbaDesenho, f.rosto, m) + '</div>' +
      '</div>' +
      (tecnicas.length
        ? '<div class="projeto__tecnicas"><span class="rotulo">Técnicas aplicadas</span>' +
          '<ul class="tecnicas">' + tecnicas.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>'
        : '<p class="projeto__nota">' + esc(D.nomeBarba(f.barbaDesenho)) + '.</p>'));
  }

  /* 06 — PROPOSTA */
  function pgProposta(f) {
    var p = C.acharPerfil(f.perfil) || C.PERFIS[0];
    var texto = f.proposta && f.proposta.trim() ? f.proposta : p.proposta;
    return pagina('pg--proposta', '' +
      tituloSecao('06 · Proposta', 'O que foi feito — e por quê') +
      '<span class="proposta__aspas">“</span>' +
      '<div class="proposta__corpo">' + paragrafos(texto) + '</div>' +
      (f.observacoes ? '<div class="proposta__obs"><span class="rotulo">Observações</span>' +
        '<div class="corpo corpo--menor">' + paragrafos(f.observacoes) + '</div></div>' : ''));
  }

  /* 07 — REFERÊNCIAS VISUAIS */
  function pgReferencias(f) {
    var ft = f.fotos || {};
    return pagina('pg--referencias', '' +
      tituloSecao('07 · Referências visuais', 'A direção estética escolhida') +
      '<div class="ref__grade">' +
        foto(ft.ref1, 'Referência 01', 'ref__grande') +
        foto(ft.ref2, 'Referência 02') +
        foto(ft.ref3, 'Referência 03') +
      '</div>' +
      '<p class="ref__nota">' + esc(f.refNota ||
        'As referências indicam direção de forma, linha e acabamento — não uma cópia. ' +
        'O corte é sempre adaptado à geometria do seu rosto e ao comportamento do seu fio.') + '</p>');
  }

  /* 08 — ANTES E DEPOIS: em pé, uma foto sobre a outra. Lado a lado, cada
     foto ficaria uma tira estreita e o rosto sairia cortado. */
  function pgAntesDepois(f, titulo, antes, depois) {
    var ft = f.fotos || {};
    return {
      rodape: false,
      html: function (n) {
        return '<section class="pg pg--ad" data-pg="' + n + '">' +
          '<div class="ad__lado">' + foto(ft[antes], null, 'foto--cheia') + '<span class="ad__tag">ANTES</span></div>' +
          '<div class="ad__lado">' + foto(ft[depois], null, 'foto--cheia') + '<span class="ad__tag ad__tag--depois">DEPOIS</span></div>' +
          '<div class="ad__tarja">' +
            '<span class="ad__titulo">' + esc(titulo) + '</span>' +
            '<span class="ad__num">' + String(n).padStart(2, '0') + '</span>' +
          '</div>' +
          '</section>';
      }
    };
  }

  /* 09 — MANUTENÇÃO */
  function pgManutencao(f) {
    var p = C.acharPerfil(f.perfil) || C.PERFIS[0];
    var lista = (f.rotina && f.rotina.length ? f.rotina : C.rotinaDe(f.cabelo)).filter(function (r) { return r && r.trim(); });
    var itens = lista.map(function (r, i) {
      return '<li><span class="rot__n">' + String(i + 1).padStart(2, '0') + '</span><p>' + esc(r) + '</p></li>';
    }).join('');
    var produtos = (f.produtos || []).filter(function (p2) { return p2 && p2.nome; }).map(function (p2) {
      return '<li><strong>' + esc(p2.nome) + '</strong>' + (p2.uso ? '<span>' + esc(p2.uso) + '</span>' : '') + '</li>';
    }).join('');

    return pagina('pg--manutencao', '' +
      tituloSecao('09 · Manutenção', 'A rotina que sustenta o resultado') +
      '<ol class="rotina">' + itens + '</ol>' +
      (produtos ? '<div class="man__produtos"><span class="rotulo">Produtos indicados</span><ul class="produtos">' + produtos + '</ul></div>' : '') +
      '<div class="man__retorno"><span class="rotulo">Retorno</span><p>' + esc(f.retorno || p.manutencao) + '</p></div>');
  }

  /* CONTRACAPA — retrato em página inteira, texto na base */
  function pgFinal() {
    var frases = C.MARCA.assinaturaFinal.map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('');
    return pagina('pg--final', '' +
      '<img class="final__fundo" data-cobrir src="assets/wagner-final.jpg" alt="Wagner Alves">' +
      '<div class="final__veu"></div>' +
      '<div class="final__texto">' +
        '<h2 class="final__marca">VISAGISMO</h2>' +
        '<div class="final__frase">' + frases + '</div>' +
        '<p class="final__obrigado">' + esc(C.MARCA.agradecimento) + '</p>' +
        '<p class="final__assinatura">' + esc(C.MARCA.consultor) + ' · ' + esc(C.MARCA.site) + '</p>' +
      '</div>',
      false);
  }

  /* =========================================================================
     MONTAGEM
  ========================================================================= */
  function montar(f) {
    f = f || {};
    var lista = [
      pgCapa(f),
      pgSumario(f),
      pgPerfil(f),
      pgDirecao(f),
      pgExecucao(f),
      pgRosto(f),
      pgRosto2(f),
      pgCabelo(f),
      pgProjeto(f),
      pgProjeto2(f),
      pgProposta(f),
      pgReferencias(f),
      pgAntesDepois(f, '08 · Antes e depois — de frente', 'antesFrente', 'depoisFrente'),
      pgAntesDepois(f, '08 · Antes e depois — de perfil', 'antesPerfil', 'depoisPerfil'),
      pgManutencao(f),
      pgFinal(f)
    ];
    return lista.map(function (pg, i) { return pg.html(i + 1); });
  }

  return { montar: montar, dataExtenso: dataExtenso, LARGURA: LARGURA, ALTURA: ALTURA };
});
