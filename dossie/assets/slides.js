/* =============================================================================
   DOSSIÊ DE VISAGISMO — MONTAGEM DAS PÁGINAS
   -----------------------------------------------------------------------------
   Recebe a ficha do cliente e devolve as 13 páginas do dossiê em HTML.
   O mesmo HTML é usado na pré-visualização da tela e na exportação do PDF —
   o que o Wagner vê é exatamente o que o cliente recebe.

   Formato da página: 1440 x 810 px (16:9), o mesmo do material original.
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.DossieSlides = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Dependências: conteudo.js e diagramas.js precisam ser carregados antes. */
  var G = (typeof self !== 'undefined') ? self : raiz;
  var C = G.DossieConteudo;
  var D = G.DossieDiagramas;

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
     quando ainda não foi enviada — assim a pré-visualização nunca "quebra". */
  function foto(src, legenda, classe) {
    var cls = 'foto ' + (classe || '');
    /* A ficha guarda a foto embutida (modo local) ou um ponteiro de arquivo
       (modo nuvem); só a camada de armazenamento sabe traduzir. */
    if (src && G.DossieDB && G.DossieDB.srcFoto) src = G.DossieDB.srcFoto(src);
    if (src) {
      return '<figure class="' + cls + '">' +
             '<img src="' + esc(src) + '" alt="' + esc(legenda || '') + '">' +
             (legenda ? '<figcaption>' + esc(legenda) + '</figcaption>' : '') +
             '</figure>';
    }
    return '<figure class="' + cls + ' foto--vazia">' +
           '<div class="foto__placeholder"><span>' + esc(legenda || 'Foto') + '</span></div>' +
           '</figure>';
  }

  function pagina(indice, classe, conteudo, rodape) {
    return '<section class="pg ' + classe + '" data-pg="' + indice + '">' +
           conteudo +
           (rodape === false ? '' :
             '<div class="pg__rodape"><span class="pg__marca">WAGNER ALVES · VISAGISMO</span>' +
             '<span class="pg__num">' + String(indice).padStart(2, '0') + '</span></div>') +
           '</section>';
  }

  function tituloSecao(kicker, titulo) {
    return '<header class="sec">' +
           '<span class="sec__kicker">' + esc(kicker) + '</span>' +
           '<h2 class="sec__titulo">' + esc(titulo) + '</h2>' +
           '<span class="sec__regua"></span>' +
           '</header>';
  }

  /* =========================================================================
     AS PÁGINAS
  ========================================================================= */

  /* 01 — CAPA */
  function pgCapa(f) {
    return pagina(1, 'pg--capa', '' +
      '<div class="capa__retrato">' +
        '<img src="assets/wagner-capa.jpg" alt="Wagner Alves, visagista">' +
      '</div>' +
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

  /* 02 — SUMÁRIO */
  function pgSumario(f) {
    var itens = C.SUMARIO.map(function (s) {
      return '<li class="sum__item">' +
             '<span class="sum__n">' + esc(s.n) + '</span>' +
             '<div><h3>' + esc(s.titulo) + '</h3><p>' + esc(s.desc) + '</p></div>' +
             '</li>';
    }).join('');
    return pagina(2, 'pg--sumario', '' +
      tituloSecao('Dossiê pessoal', 'O que você vai encontrar') +
      '<ol class="sum">' + itens + '</ol>' +
      '<p class="sum__nota">Este documento foi construído a partir da leitura do seu perfil, ' +
      'da geometria do seu rosto e da estrutura do seu fio. Nada aqui é modelo pronto.</p>');
  }

  /* 03 — PERFIL COMPORTAMENTAL (texto exclusivo do perfil escolhido) */
  function pgPerfil(f) {
    var p = C.acharPerfil(f.perfil) || C.PERFIS[0];
    var chaves = p.palavrasChave.map(function (k) {
      return '<li>' + esc(k) + '</li>';
    }).join('');
    return pagina(3, 'pg--perfil', '' +
      '<div class="perfil__col">' +
        tituloSecao('01 · Perfil comportamental', p.nome) +
        '<div class="corpo">' + paragrafos(p.descricao) + '</div>' +
        '<div class="corpo corpo--nota">' + paragrafos(p.comoOMundoLe) + '</div>' +
        (f.perfilNota ? '<div class="corpo corpo--manuscrito">' + paragrafos(f.perfilNota) + '</div>' : '') +
      '</div>' +
      '<aside class="perfil__aside">' +
        '<div class="emblema">' + p.emblema + '</div>' +
        '<span class="perfil__temperamento">Temperamento ' + esc(p.temperamento) + '</span>' +
        '<span class="perfil__essencia">' + esc(p.essencia) + '</span>' +
        '<span class="rotulo">Palavras-chave</span>' +
        '<ul class="chaves">' + chaves + '</ul>' +
      '</aside>');
  }

  /* 04 — DIREÇÃO DE IMAGEM (também exclusiva do perfil) */
  function pgDirecao(f) {
    var p = C.acharPerfil(f.perfil) || C.PERFIS[0];
    var d = p.direcao;
    var blocos = [
      ['Corte', d.corte],
      ['Barba', d.barba],
      ['Acabamento', d.acabamento],
      ['O que evitar', d.evitar]
    ].map(function (b) {
      return '<div class="bloco"><span class="rotulo">' + esc(b[0]) + '</span><p>' + esc(b[1]) + '</p></div>';
    }).join('');

    return pagina(4, 'pg--direcao', '' +
      tituloSecao('02 · Direção de imagem', 'O que a sua imagem precisa comunicar') +
      '<div class="direcao__topo">' +
        '<div class="direcao__linha">' +
          '<span class="rotulo">Linha predominante</span>' +
          '<strong>' + esc(d.linha) + '</strong>' +
          '<p>' + esc(d.significado) + '</p>' +
        '</div>' +
        '<div class="direcao__objetivo">' +
          '<span class="rotulo">Objetivo</span>' +
          '<p class="destaque">' + esc(d.objetivo) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="direcao__grade">' + blocos + '</div>');
  }

  /* 05 — ANÁLISE FACIAL */
  function pgRosto(f) {
    var r = C.acharRosto(f.rosto) || C.ROSTOS[0];
    return pagina(5, 'pg--rosto', '' +
      tituloSecao('03 · Análise facial', 'O que mais se aproxima') +
      '<div class="rosto__grade">' +
        '<div class="rosto__diagrama">' + D.formatoRosto(r) + '</div>' +
        '<div class="rosto__texto">' +
          '<h3>' + esc(r.nome) + '</h3>' +
          '<div class="corpo">' + paragrafos(r.descricao) + '</div>' +
          '<div class="bloco"><span class="rotulo">Comunica</span><p>' + esc(r.comunica) + '</p></div>' +
          '<div class="bloco"><span class="rotulo">Estratégia de corte</span><p>' + esc(r.estrategia) + '</p></div>' +
          '<div class="bloco"><span class="rotulo">Barba</span><p>' + esc(r.barba) + '</p></div>' +
          (f.rostoNota ? '<div class="bloco bloco--nota"><span class="rotulo">Observação da consultoria</span><p>' + esc(f.rostoNota) + '</p></div>' : '') +
        '</div>' +
        '<div class="rosto__foto">' + foto(f.fotos && f.fotos.cliente, 'Análise presencial', 'foto--retrato') + '</div>' +
      '</div>');
  }

  /* 06 — ESTRUTURA DO FIO */
  function pgCabelo(f) {
    var c = C.acharCabelo(f.cabelo) || C.CABELOS[0];
    var dens = C.acharPor(C.DENSIDADES, f.densidade);
    var couro = C.acharPor(C.COUROS, f.couro);
    return pagina(6, 'pg--cabelo', '' +
      tituloSecao('04 · Estrutura do fio', 'Tipo de cabelo') +
      '<div class="cabelo__grade">' +
        '<div class="cabelo__texto">' +
          '<h3>' + esc(c.nome) + ' <span class="cabelo__grupo">' + esc(c.grupo) + '</span></h3>' +
          '<div class="corpo">' + paragrafos(c.descricao) + '</div>' +
          '<div class="bloco"><span class="rotulo">Manejo técnico</span><p>' + esc(c.manejo) + '</p></div>' +
          (dens ? '<div class="bloco"><span class="rotulo">' + esc(dens.nome) + '</span><p>' + esc(dens.nota) + '</p></div>' : '') +
          (couro ? '<div class="bloco"><span class="rotulo">Couro cabeludo ' + esc(couro.nome.toLowerCase()) + '</span><p>' + esc(couro.nota) + '</p></div>' : '') +
        '</div>' +
        '<div class="cabelo__foto">' + foto(f.fotos && f.fotos.cliente, 'Estrutura observada', 'foto--retrato') + '</div>' +
      '</div>');
  }

  /* 07 — PROJETO TÉCNICO (as medidas, em diagrama) */
  function pgProjeto(f) {
    var m = (f.medidas || {});
    var p = C.acharPerfil(f.perfil) || C.PERFIS[0];

    var cotas = [
      ['Topo', m.topo, 'cm'], ['Frente', m.franja, 'cm'],
      ['Laterais', m.lateral, 'cm'], ['Nuca', m.nuca, 'cm'],
      ['Barba', m.barbaMm, 'mm']
    ].map(function (l) {
      return '<div class="cota">' +
             '<span class="cota__nome">' + esc(l[0]) + '</span>' +
             '<strong class="cota__valor">' +
             (l[1] ? esc(String(l[1]).replace('.', ',')) + ' <em>' + l[2] + '</em>' : '—') +
             '</strong></div>';
    }).join('');

    var tecnicas = (f.tecnicas || '').split(/[\r\n]+/).filter(Boolean).map(function (t) {
      return '<li>' + esc(t) + '</li>';
    }).join('');

    return pagina(7, 'pg--projeto', '' +
      tituloSecao('05 · Projeto técnico', 'As medidas do seu corte') +
      '<div class="projeto__diagramas">' +
        '<div class="diagrama">' + D.medidasFrontal(m) + '</div>' +
        '<div class="diagrama">' + D.medidasPerfil(m) + '</div>' +
        '<div class="diagrama">' + D.desenhoBarba(f.barbaDesenho) + '</div>' +
      '</div>' +
      '<div class="projeto__base">' +
        '<div class="cotas">' + cotas + '</div>' +
        (tecnicas
          ? '<div class="projeto__tecnicas"><span class="rotulo">Técnicas aplicadas</span>' +
            '<ul class="tecnicas">' + tecnicas + '</ul></div>'
          : '') +
        '<p class="projeto__nota">' + esc(p.manutencao) + '</p>' +
      '</div>');
  }

  /* 08 — PROPOSTA */
  function pgProposta(f) {
    var p = C.acharPerfil(f.perfil) || C.PERFIS[0];
    var texto = f.proposta && f.proposta.trim() ? f.proposta : p.proposta;
    return pagina(8, 'pg--proposta', '' +
      tituloSecao('06 · Proposta', 'O que foi feito — e por quê') +
      '<div class="proposta__corpo">' + paragrafos(texto) + '</div>' +
      (f.observacoes ? '<div class="proposta__obs"><span class="rotulo">Observações</span>' +
        '<div class="corpo">' + paragrafos(f.observacoes) + '</div></div>' : ''));
  }

  /* 09 — REFERÊNCIAS VISUAIS */
  function pgReferencias(f) {
    var ft = f.fotos || {};
    return pagina(9, 'pg--referencias', '' +
      tituloSecao('07 · Referências visuais', 'A direção estética escolhida') +
      '<div class="ref__grade">' +
        foto(ft.ref1, 'Referência 01') +
        foto(ft.ref2, 'Referência 02') +
        foto(ft.ref3, 'Referência 03') +
      '</div>' +
      '<p class="ref__nota">' + esc(f.refNota ||
        'As referências indicam direção de forma, linha e acabamento — não uma cópia. ' +
        'O corte é sempre adaptado à geometria do seu rosto e ao comportamento do seu fio.') + '</p>');
  }

  /* 10 e 11 — ANTES E DEPOIS
     Estas duas páginas sangram a foto de borda a borda, então dispensam o
     rodapé padrão: a tarja inferior já carrega marca, título e número. */
  function pgAntesDepois(f, indice, titulo, antes, depois) {
    var ft = f.fotos || {};
    return pagina(indice, 'pg--ad', '' +
      '<div class="ad__par">' +
        '<div class="ad__lado">' + foto(ft[antes], null, 'foto--cheia') +
          '<span class="ad__tag">ANTES</span></div>' +
        '<div class="ad__lado">' + foto(ft[depois], null, 'foto--cheia') +
          '<span class="ad__tag ad__tag--depois">DEPOIS</span></div>' +
      '</div>' +
      '<div class="ad__tarja">' +
        '<span class="ad__marca">WAGNER ALVES · VISAGISMO</span>' +
        '<span class="ad__titulo">' + esc(titulo) + '</span>' +
        '<span class="ad__num">' + String(indice).padStart(2, '0') + '</span>' +
      '</div>',
      false);
  }

  /* 12 — MANUTENÇÃO */
  function pgManutencao(f) {
    var p = C.acharPerfil(f.perfil) || C.PERFIS[0];
    var lista = (f.rotina && f.rotina.length ? f.rotina : C.rotinaDe(f.cabelo));
    var itens = lista.map(function (r, i) {
      return '<li><span class="rot__n">' + String(i + 1).padStart(2, '0') + '</span><p>' + esc(r) + '</p></li>';
    }).join('');
    var produtos = (f.produtos || []).filter(function (p2) { return p2 && p2.nome; }).map(function (p2) {
      return '<li><strong>' + esc(p2.nome) + '</strong>' +
             (p2.uso ? '<span>' + esc(p2.uso) + '</span>' : '') + '</li>';
    }).join('');

    return pagina(12, 'pg--manutencao', '' +
      tituloSecao('09 · Manutenção', 'A rotina que sustenta o resultado') +
      '<div class="man__grade">' +
        '<ol class="rotina">' + itens + '</ol>' +
        '<aside class="man__aside">' +
          (produtos ? '<span class="rotulo">Produtos indicados</span><ul class="produtos">' + produtos + '</ul>' : '') +
          '<div class="man__retorno">' +
            '<span class="rotulo">Retorno</span>' +
            '<p>' + esc(f.retorno || p.manutencao) + '</p>' +
          '</div>' +
        '</aside>' +
      '</div>');
  }

  /* 13 — CONTRACAPA */
  function pgFinal(f) {
    var frases = C.MARCA.assinaturaFinal.map(function (l) {
      return '<span>' + esc(l) + '</span>';
    }).join('');
    return pagina(13, 'pg--final', '' +
      '<img class="final__fundo" src="assets/wagner-final.jpg" alt="Wagner Alves">' +
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
    return [
      pgCapa(f),
      pgSumario(f),
      pgPerfil(f),
      pgDirecao(f),
      pgRosto(f),
      pgCabelo(f),
      pgProjeto(f),
      pgProposta(f),
      pgReferencias(f),
      pgAntesDepois(f, 10, '08 · Antes e depois — de frente', 'antesFrente', 'depoisFrente'),
      pgAntesDepois(f, 11, '08 · Antes e depois — de perfil', 'antesPerfil', 'depoisPerfil'),
      pgManutencao(f),
      pgFinal(f)
    ];
  }

  return { montar: montar, dataExtenso: dataExtenso };
});
