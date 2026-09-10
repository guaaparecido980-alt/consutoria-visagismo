/* =============================================================================
   DOSSIÊ DE VISAGISMO — DIAGRAMAS VETORIAIS
   -----------------------------------------------------------------------------
   Todos os desenhos técnicos do dossiê são gerados em SVG aqui, a partir dos
   dados do cliente. Duas consequências práticas:

     1. o diagrama nunca sai borrado no PDF, em nenhum tamanho;
     2. as medidas do corte aparecem escritas no desenho — o que o Wagner
        anotava à mão vira parte do documento.

   A silhueta é desenhada no espaço 0–200 (largura) por 0–244 (altura). Os
   diagramas com cotas usam um viewBox mais largo que isso, para que os rótulos
   caibam FORA da cabeça sem serem cortados na borda.
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.DossieDiagramas = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TRACO = '#6f6a63';   /* silhueta neutra              */
  var MARCA = '#a08c5c';   /* dourado da marca, no traçado */
  var COTA  = '#b8452f';   /* setas e cotas de medida      */
  var FLUXO = '#3f6f5a';   /* setas de direção do fio      */

  /* Área útil dos diagramas com cota: 76 px de folga de cada lado da cabeça. */
  var CAIXA_COTAS = '-76 -18 352 286';
  var CAIXA_LIMPA = '-14 -6 228 258';

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function svg(viewBox, rotuloAcessivel, conteudo) {
    return '<svg viewBox="' + viewBox + '" role="img" aria-label="' + esc(rotuloAcessivel) + '">' +
           conteudo + '</svg>';
  }

  /* ---------------------------------------------------------------------------
     Silhueta frontal — traço único, sem preenchimento.
  --------------------------------------------------------------------------- */
  function silhuetaFrontal() {
    return '' +
      '<path d="M100 20 C133 20 153 45 155 80 C157 107 150 143 138 170 ' +
      'C128 194 114 214 100 214 C86 214 72 194 62 170 C50 143 43 107 45 80 ' +
      'C47 45 67 20 100 20 Z" fill="none" stroke="' + TRACO + '" stroke-width="1.6"/>' +
      /* orelhas */
      '<path d="M46 96 C38 92 33 100 36 112 C38 124 45 132 50 130" fill="none" stroke="' + TRACO + '" stroke-width="1.3"/>' +
      '<path d="M154 96 C162 92 167 100 164 112 C162 124 155 132 150 130" fill="none" stroke="' + TRACO + '" stroke-width="1.3"/>' +
      /* sobrancelhas */
      '<path d="M64 98 C74 92 86 92 94 97" fill="none" stroke="' + TRACO + '" stroke-width="1.3"/>' +
      '<path d="M136 98 C126 92 114 92 106 97" fill="none" stroke="' + TRACO + '" stroke-width="1.3"/>' +
      /* olhos */
      '<path d="M67 110 C74 104 86 104 92 110 C86 116 74 116 67 110 Z" fill="none" stroke="' + TRACO + '" stroke-width="1.2"/>' +
      '<path d="M133 110 C126 104 114 104 108 110 C114 116 126 116 133 110 Z" fill="none" stroke="' + TRACO + '" stroke-width="1.2"/>' +
      '<circle cx="79.5" cy="110" r="2.4" fill="' + TRACO + '"/>' +
      '<circle cx="120.5" cy="110" r="2.4" fill="' + TRACO + '"/>' +
      /* nariz */
      '<path d="M100 116 V142 M100 142 C95 146 91 145 89 142 M100 142 C105 146 109 145 111 142" fill="none" stroke="' + TRACO + '" stroke-width="1.2"/>' +
      /* boca */
      '<path d="M86 165 C93 161 107 161 114 165 C107 171 93 171 86 165 Z" fill="none" stroke="' + TRACO + '" stroke-width="1.2"/>';
  }

  /* ---------------------------------------------------------------------------
     Silhueta de perfil, voltada para a direita.
     Dois traços: o contorno do crânio/nuca e o contorno da face.
  --------------------------------------------------------------------------- */
  function silhuetaPerfil() {
    var t = '" fill="none" stroke="' + TRACO + '" stroke-width="1.6"/>';
    return '' +
      /* crânio, nuca e pescoço, por trás */
      '<path d="M138 26 C100 18 60 44 54 90 C50 120 58 142 64 160 L64 216' + t +
      /* testa, sobrancelha, nariz, lábios, mento e mandíbula, até o pescoço */
      '<path d="M138 26 C160 30 172 50 174 76 L172 88 ' +
      'C180 96 191 110 190 117 C189 123 178 124 170 122 ' +
      'C173 128 169 133 166 135 C172 140 170 148 162 152 ' +
      'C169 161 165 175 150 183 C134 192 120 194 112 193 L112 216' + t +
      /* orelha */
      '<path d="M94 110 C84 106 78 116 81 130 C84 144 93 152 100 149 ' +
      'C105 147 104 134 101 124 Z" fill="none" stroke="' + TRACO + '" stroke-width="1.3"/>' +
      /* sobrancelha e olho */
      '<path d="M152 82 C160 78 167 79 171 83" fill="none" stroke="' + TRACO + '" stroke-width="1.2"/>' +
      '<circle cx="162" cy="93" r="2.3" fill="' + TRACO + '"/>';
  }

  /* ---------------------------------------------------------------------------
     Primitivas de cota
  --------------------------------------------------------------------------- */
  function seta(x1, y1, x2, y2, cor) {
    var dx = x2 - x1, dy = y2 - y1;
    var comp = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / comp, uy = dy / comp;
    var bx = x2 - ux * 6, by = y2 - uy * 6;
    var nx = -uy, ny = ux;
    return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + bx.toFixed(1) +
           '" y2="' + by.toFixed(1) + '" stroke="' + cor + '" stroke-width="1.5"/>' +
           '<polygon points="' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' ' +
           (bx + nx * 2.6).toFixed(1) + ',' + (by + ny * 2.6).toFixed(1) + ' ' +
           (bx - nx * 2.6).toFixed(1) + ',' + (by - ny * 2.6).toFixed(1) + '" fill="' + cor + '"/>';
  }

  function rotulo(x, y, texto, cor, ancora, tamanho, peso) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (ancora || 'middle') +
           '" font-family="Inter, Arial, sans-serif" font-size="' + (tamanho || 10) +
           '" font-weight="' + (peso || 400) + '" letter-spacing="0.6" fill="' +
           (cor || TRACO) + '">' + esc(texto) + '</text>';
  }

  function guia(x1, y1, x2, y2, cor) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
           '" stroke="' + (cor || TRACO) + '" stroke-width="0.9" opacity="0.75"/>';
  }

  function cm(valor) {
    if (valor === '' || valor == null) return '—';
    return String(valor).replace('.', ',') + ' cm';
  }

  /* ---------------------------------------------------------------------------
     DIAGRAMA 1 — FORMATO DE ROSTO
     Silhueta + traçado geométrico dourado do formato identificado. Sem legenda
     escrita: o nome do formato já é o título da página.
  --------------------------------------------------------------------------- */
  function formatoRosto(rosto) {
    var forma = '';
    if (rosto && rosto.poligono) {
      forma = '<polygon points="' + rosto.poligono + '" fill="' + MARCA + '" fill-opacity="0.07" stroke="' +
              MARCA + '" stroke-width="2.2" stroke-linejoin="round"/>';
    } else if (rosto && rosto.elipse) {
      var e = rosto.elipse;
      forma = '<ellipse cx="' + e.cx + '" cy="' + e.cy + '" rx="' + e.rx + '" ry="' + e.ry +
              '" fill="' + MARCA + '" fill-opacity="0.07" stroke="' + MARCA + '" stroke-width="2.2"/>';
    }
    return svg(CAIXA_LIMPA, 'Traçado geométrico do formato de rosto',
               silhuetaFrontal() + forma);
  }

  /* ---------------------------------------------------------------------------
     DIAGRAMA 2 — MEDIDA DO FIO (vista frontal)
  --------------------------------------------------------------------------- */
  function medidasFrontal(medidas) {
    medidas = medidas || {};
    var g = '';

    /* caixa de projeção tracejada */
    g += '<rect x="34" y="34" width="132" height="104" fill="none" stroke="' + COTA +
         '" stroke-width="1" stroke-dasharray="4 3" opacity="0.75"/>';

    /* setas do topo */
    var topo = [[70, 60], [85, 52], [100, 50], [115, 52], [130, 60]];
    for (var i = 0; i < topo.length; i++) {
      g += seta(topo[i][0], topo[i][1], topo[i][0], 36, COTA);
    }
    g += seta(66, 52, 46, 36, COTA);
    g += seta(134, 52, 154, 36, COTA);

    /* setas laterais */
    var lados = [[47, 84], [44, 104], [45, 124]];
    for (var j = 0; j < lados.length; j++) {
      g += seta(lados[j][0], lados[j][1], 34, lados[j][1], COTA);
      g += seta(200 - lados[j][0], lados[j][1], 166, lados[j][1], COTA);
    }

    /* cota do topo */
    g += guia(100, 34, 100, 4, COTA);
    g += rotulo(100, -2, 'TOPO', COTA, 'middle', 11, 600);
    g += rotulo(100, 12, cm(medidas.topo), COTA, 'middle', 12);

    /* cotas laterais, fora da cabeça */
    g += guia(34, 104, -8, 104, COTA);
    g += rotulo(-12, 100, 'LATERAL', COTA, 'end', 11, 600);
    g += rotulo(-12, 114, cm(medidas.lateral), COTA, 'end', 12);
    g += guia(166, 104, 208, 104, COTA);
    g += rotulo(212, 100, 'LATERAL', COTA, 'start', 11, 600);
    g += rotulo(212, 114, cm(medidas.lateral), COTA, 'start', 12);

    /* frente / franja — cota levada para baixo da lateral, para não colidir */
    g += seta(100, 62, 100, 88, FLUXO);
    g += guia(100, 88, 208, 158, FLUXO);
    g += rotulo(212, 154, 'FRENTE', FLUXO, 'start', 11, 600);
    g += rotulo(212, 168, cm(medidas.franja), FLUXO, 'start', 12);

    return svg(CAIXA_COTAS, 'Diagrama de medidas do fio, vista frontal',
      silhuetaFrontal() + g +
      rotulo(100, 250, 'MEDIDA DO FIO', COTA, 'middle', 11, 600));
  }

  /* ---------------------------------------------------------------------------
     DIAGRAMA 3 — DIREÇÃO E PROJEÇÃO (vista de perfil)
  --------------------------------------------------------------------------- */
  var DIRECOES = {
    tras:   { rotulo: 'Para trás',          ang: -8   },
    lado:   { rotulo: 'Lateral com risca',  ang: -48  },
    frente: { rotulo: 'Para a frente',      ang: -160 },
    cima:   { rotulo: 'Para cima',          ang: -90  }
  };

  function medidasPerfil(medidas) {
    medidas = medidas || {};
    var dir = DIRECOES[medidas.direcao] || DIRECOES.tras;
    var rad = dir.ang * Math.PI / 180;
    var g = '';

    /* caixa de projeção */
    g += '<rect x="46" y="30" width="132" height="102" fill="none" stroke="' + COTA +
         '" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>';

    /* linhas de secção */
    g += '<line x1="50" y1="74" x2="172" y2="74" stroke="' + TRACO + '" stroke-width="0.9" opacity="0.45"/>';
    g += '<line x1="54" y1="104" x2="172" y2="104" stroke="' + TRACO + '" stroke-width="0.9" opacity="0.45"/>';

    /* direção do fio */
    var pontos = [[78, 46], [96, 34], [116, 28], [134, 30], [150, 40]];
    for (var i = 0; i < pontos.length; i++) {
      var x = pontos[i][0], y = pontos[i][1];
      g += seta(x, y, x + Math.cos(rad) * 22, y + Math.sin(rad) * 22, FLUXO);
    }
    g += guia(116, 26, 116, 14, FLUXO);
    g += rotulo(116, -8, 'DIREÇÃO DOS FIOS', FLUXO, 'middle', 11, 600);
    g += rotulo(116, 6, dir.rotulo.toUpperCase(), FLUXO, 'middle', 11);

    /* nuca */
    g += seta(64, 150, 48, 150, COTA);
    g += guia(48, 150, -8, 150, COTA);
    g += rotulo(-12, 146, 'NUCA', COTA, 'end', 11, 600);
    g += rotulo(-12, 160, cm(medidas.nuca), COTA, 'end', 12);

    /* projeção do mento */
    g += '<line x1="112" y1="184" x2="156" y2="172" stroke="' + TRACO +
         '" stroke-width="1" opacity="0.55" stroke-dasharray="3 3"/>';
    g += guia(168, 168, 214, 186, TRACO);
    g += rotulo(218, 183, 'PROJEÇÃO', TRACO, 'start', 10.5, 600);
    g += rotulo(218, 196, 'DO MENTO', TRACO, 'start', 10.5, 600);

    return svg(CAIXA_COTAS, 'Diagrama de direção e projeção do fio, vista de perfil',
      silhuetaPerfil() + g +
      rotulo(100, 250, 'DIREÇÃO E PROJEÇÃO', COTA, 'middle', 11, 600));
  }

  /* ---------------------------------------------------------------------------
     DIAGRAMA 4 — DESENHO DA BARBA
  --------------------------------------------------------------------------- */
  var BARBAS = {
    'limpo': {
      nome: 'Rosto limpo', area: null, bochecha: null, pescoco: null
    },
    'cavanhaque': {
      nome: 'Cavanhaque',
      area: 'M86 158 C93 152 107 152 114 158 C118 168 116 186 108 196 C104 200 96 200 92 196 C84 186 82 168 86 158 Z',
      bochecha: null, pescoco: null
    },
    'curta-reta': {
      nome: 'Barba curta com linha reta',
      area: 'M50 128 C56 166 74 200 100 210 C126 200 144 166 150 128 L150 120 L50 120 Z',
      bochecha: 'M50 120 H150', pescoco: 'M74 206 H126'
    },
    'curta-diagonal': {
      nome: 'Barba curta com linha diagonal',
      area: 'M52 136 C58 170 76 200 100 210 C124 200 142 170 148 136 L146 116 L54 130 Z',
      bochecha: 'M54 130 L146 116', pescoco: 'M76 205 L124 199'
    },
    'media-contorno': {
      nome: 'Barba média com contorno definido',
      area: 'M46 120 C52 166 72 204 100 214 C128 204 148 166 154 120 L152 110 L48 110 Z',
      bochecha: 'M48 110 H152', pescoco: 'M70 210 H130'
    },
    'cheia': {
      nome: 'Barba cheia',
      area: 'M44 106 C50 162 70 206 100 216 C130 206 150 162 156 106 L154 98 L46 98 Z',
      bochecha: 'M46 98 H154', pescoco: 'M68 212 H132'
    }
  };

  function desenhoBarba(barbaSlug) {
    var b = BARBAS[barbaSlug] || BARBAS['curta-reta'];
    var g = '';
    if (b.area) {
      g += '<path d="' + b.area + '" fill="' + MARCA + '" opacity="0.22"/>';
      g += '<path d="' + b.area + '" fill="none" stroke="' + MARCA + '" stroke-width="1.8"/>';
    }
    if (b.bochecha) {
      g += '<path d="' + b.bochecha + '" fill="none" stroke="' + COTA +
           '" stroke-width="1.6" stroke-dasharray="5 3"/>';
      g += guia(50, 120, -8, 108, COTA);
      g += rotulo(-12, 105, 'LINHA DA', COTA, 'end', 10.5, 600);
      g += rotulo(-12, 118, 'BOCHECHA', COTA, 'end', 10.5, 600);
    }
    if (b.pescoco) {
      g += '<path d="' + b.pescoco + '" fill="none" stroke="' + COTA +
           '" stroke-width="1.6" stroke-dasharray="5 3"/>';
      g += guia(126, 206, 208, 206, COTA);
      g += rotulo(212, 203, 'LINHA DO', COTA, 'start', 10.5, 600);
      g += rotulo(212, 216, 'PESCOÇO', COTA, 'start', 10.5, 600);
    }
    return svg(CAIXA_COTAS, 'Diagrama do desenho da barba',
      silhuetaFrontal() + g +
      rotulo(100, 250, b.nome.toUpperCase(), MARCA, 'middle', 11, 600));
  }

  function listaBarbas() {
    return Object.keys(BARBAS).map(function (k) {
      return { slug: k, nome: BARBAS[k].nome };
    });
  }

  function listaDirecoes() {
    return Object.keys(DIRECOES).map(function (k) {
      return { slug: k, nome: DIRECOES[k].rotulo };
    });
  }

  return {
    formatoRosto: formatoRosto,
    medidasFrontal: medidasFrontal,
    medidasPerfil: medidasPerfil,
    desenhoBarba: desenhoBarba,
    listaBarbas: listaBarbas,
    listaDirecoes: listaDirecoes
  };
});
