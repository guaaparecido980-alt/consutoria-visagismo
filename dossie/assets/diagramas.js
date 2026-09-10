/* =============================================================================
   DOSSIÊ DE VISAGISMO — ILUSTRAÇÕES TÉCNICAS
   -----------------------------------------------------------------------------
   Todos os desenhos do dossiê são gerados aqui em SVG, a partir da ficha.
   Não existe mais "um rosto padrão com uma forma por cima": a cabeça é
   construída a cada vez, e cada escolha da ficha muda o desenho de verdade.

     formato do rosto  → o CONTORNO da cabeça (testa, maçã, mandíbula, queixo)
     direção do fio    → a massa do cabelo e o caminho de cada mecha
     medidas           → a altura do topo, a espessura das laterais e da nuca,
                         o comprimento da franja
     desenho da barba  → a área da barba, recortada no contorno daquele rosto

   ---------------------------------------------------------------------------
   COMO A CABEÇA É CONSTRUÍDA
   O contorno frontal passa por sete marcos anatômicos, cada um com a sua
   largura e a sua "suavidade" (0 = quina, 1 = curva cheia):

     topo do crânio · parietal · têmpora · maçã do rosto · ângulo da
     mandíbula · canto do queixo · mento

   É a suavidade que separa um rosto quadrado (quina na mandíbula) de um oval
   (tudo curva). As feições seguem o cânone de retrato, medido a partir da
   altura H da cabeça (do alto do crânio ao mento):

     linha do cabelo 0,145 H · sobrancelha 0,43 H · olhos 0,49 H
     base do nariz 0,715 H · boca 0,81 H · orelha da sobrancelha ao nariz
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.DossieDiagramas = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     PALETA — a mesma do dossiê: grafite, dourado envelhecido, papel
  --------------------------------------------------------------------------- */
  var TRACO   = '#342e27';   /* contorno principal            */
  var FEICAO  = '#5a5145';   /* feições                       */
  var LEVE    = '#9a8f7e';   /* traços de apoio               */
  var PELE    = '#f3eadb';
  var PELE_2  = '#e2d3bb';   /* sombra da pele                */
  var CABELO  = '#2b2620';
  var CABELO_2 = '#4a4136';
  var FIO     = '#8a7e6c';   /* mecha clara                   */
  var CAMISA  = '#2c3336';
  var CAMISA_2 = '#465055';
  var MARCA   = '#a08c5c';
  var COTA    = '#a2432c';
  var FLUXO   = '#2f6a51';
  var FONTE   = 'Inter, Helvetica, Arial, sans-serif';

  var contador = 0;
  function uid(prefixo) { contador += 1; return prefixo + contador; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function suave(s) { s = limitar(s, 0, 1); return s * s * (3 - 2 * s); }
  function num(v, padrao) {
    var x = parseFloat(String(v == null ? '' : v).replace(',', '.'));
    return isFinite(x) && x >= 0 ? x : padrao;
  }

  /* ===========================================================================
     GEOMETRIA — curva suave por marcos, com suavidade por ponto
  =========================================================================== */
  function tangente(pts, i, fechado) {
    var N = pts.length, p = pts[i];
    var ant = i > 0 ? pts[i - 1] : (fechado ? pts[N - 1] : null);
    var prox = i < N - 1 ? pts[i + 1] : (fechado ? pts[0] : null);
    var tx, ty;
    if (p.tx != null) { tx = p.tx; ty = p.ty; }
    else if (ant && prox) { tx = prox.x - ant.x; ty = prox.y - ant.y; }
    else if (prox) { tx = prox.x - p.x; ty = prox.y - p.y; }
    else { tx = p.x - ant.x; ty = p.y - ant.y; }
    var L = Math.sqrt(tx * tx + ty * ty) || 1;
    var r = p.r == null ? 1 : p.r;
    return {
      tx: tx / L, ty: ty / L,
      entra: ant ? r * 0.36 * Math.hypot(p.x - ant.x, p.y - ant.y) : 0,
      sai: prox ? r * 0.36 * Math.hypot(prox.x - p.x, prox.y - p.y) : 0
    };
  }

  /* Devolve os segmentos cúbicos [p0, c1, c2, p1] que passam pelos pontos. */
  function segmentos(pts, fechado) {
    var lista = [], N = pts.length, total = fechado ? N : N - 1;
    for (var i = 0; i < total; i++) {
      var a = pts[i], b = pts[(i + 1) % N];
      var ta = tangente(pts, i, fechado), tb = tangente(pts, (i + 1) % N, fechado);
      lista.push([
        a,
        { x: a.x + ta.tx * ta.sai, y: a.y + ta.ty * ta.sai },
        { x: b.x - tb.tx * tb.entra, y: b.y - tb.ty * tb.entra },
        b
      ]);
    }
    return lista;
  }

  function caminho(pts, fechado) {
    var s = segmentos(pts, fechado);
    var d = 'M' + r1(pts[0].x) + ' ' + r1(pts[0].y);
    s.forEach(function (g) {
      d += ' C' + r1(g[1].x) + ' ' + r1(g[1].y) + ' ' + r1(g[2].x) + ' ' + r1(g[2].y) +
           ' ' + r1(g[3].x) + ' ' + r1(g[3].y);
    });
    return d + (fechado ? ' Z' : '');
  }

  function amostrar(pts, fechado, passos) {
    var saida = [];
    segmentos(pts, fechado).forEach(function (g, k) {
      for (var j = (k === 0 ? 0 : 1); j <= passos; j++) {
        var t = j / passos, u = 1 - t;
        saida.push({
          x: u * u * u * g[0].x + 3 * u * u * t * g[1].x + 3 * u * t * t * g[2].x + t * t * t * g[3].x,
          y: u * u * u * g[0].y + 3 * u * u * t * g[1].y + 3 * u * t * t * g[2].y + t * t * t * g[3].y
        });
      }
    });
    if (fechado) saida.pop();
    return saida;
  }

  function poligono(pts) {
    return 'M' + pts.map(function (p) { return r1(p.x) + ' ' + r1(p.y); }).join(' L') + ' Z';
  }
  function linhaPts(pts) {
    return 'M' + pts.map(function (p) { return r1(p.x) + ' ' + r1(p.y); }).join(' L');
  }

  /* Desloca uma cadeia de pontos para FORA (em relação a `centro`). */
  function deslocar(cadeia, espessura, centro) {
    return cadeia.map(function (p, i) {
      var a = cadeia[Math.max(0, i - 1)], b = cadeia[Math.min(cadeia.length - 1, i + 1)];
      var tx = b.x - a.x, ty = b.y - a.y, L = Math.hypot(tx, ty) || 1;
      var nx = ty / L, ny = -tx / L;
      if (nx * (p.x - centro.x) + ny * (p.y - centro.y) < 0) { nx = -nx; ny = -ny; }
      var e = espessura(p, i);
      return { x: p.x + nx * e, y: p.y + ny * e };
    });
  }

  /* ===========================================================================
     OS FORMATOS DE ROSTO
     H   altura da cabeça          sw  meia-largura do crânio (parietal)
     fw  meia-largura da testa     cw  meia-largura na maçã do rosto
     jw  meia-largura na mandíbula chw meia-largura da base do queixo
     rTesta / rMaca / rMand / rQueixo — suavidade de cada marco
  =========================================================================== */
  var FORMAS = {
    'oval':                 { H: 306, sw: 104, fw: 95,  cw: 99,  jw: 79,  chw: 22, rTesta: 1,   rMaca: 1,    rMand: 1,    rQueixo: 1 },
    'redondo':              { H: 284, sw: 110, fw: 101, cw: 111, jw: 99,  chw: 34, rTesta: 1,   rMaca: 1,    rMand: 1,    rQueixo: 1 },
    'quadrado':             { H: 288, sw: 106, fw: 102, cw: 104, jw: 101, chw: 50, rTesta: 0.6, rMaca: 0.9,  rMand: 0.18, rQueixo: 0.4 },
    'retangular':           { H: 334, sw: 100, fw: 94,  cw: 95,  jw: 92,  chw: 45, rTesta: 0.6, rMaca: 0.9,  rMand: 0.22, rQueixo: 0.45 },
    'triangular':           { H: 300, sw: 92,  fw: 76,  cw: 96,  jw: 108, chw: 52, rTesta: 0.8, rMaca: 0.9,  rMand: 0.3,  rQueixo: 0.45 },
    'triangular-invertido': { H: 302, sw: 113, fw: 110, cw: 104, jw: 70,  chw: 12, rTesta: 0.7, rMaca: 0.9,  rMand: 0.9,  rQueixo: 0.7 },
    'losango':              { H: 306, sw: 92,  fw: 79,  cw: 113, jw: 72,  chw: 13, rTesta: 0.9, rMaca: 0.42, rMand: 0.85, rQueixo: 0.6 },
    'hexagonal-base-reta':  { H: 300, sw: 95,  fw: 84,  cw: 111, jw: 82,  chw: 34, rTesta: 0.8, rMaca: 0.4,  rMand: 0.55, rQueixo: 0.25 },
    'trapezoidal':          { H: 296, sw: 98,  fw: 87,  cw: 100, jw: 107, chw: 49, rTesta: 0.7, rMaca: 0.9,  rMand: 0.3,  rQueixo: 0.4 },
    'pentagonal':           { H: 300, sw: 88,  fw: 84,  cw: 108, jw: 96,  chw: 42, rTesta: 0.6, rMaca: 0.55, rMand: 0.4,  rQueixo: 0.35, topo: 0.55 }
  };

  function modelo(slug) {
    var f = FORMAS[slug] || FORMAS.oval;
    var H = f.H;
    var direita = [
      { x: 0,           y: 0,          r: f.topo || 1 },
      { x: f.sw * 0.78, y: 0.07 * H,   r: 1 },
      { x: f.sw,        y: 0.27 * H,   r: 1 },
      { x: f.fw,        y: 0.40 * H,   r: f.rTesta },
      { x: f.cw,        y: 0.575 * H,  r: f.rMaca },
      { x: f.jw,        y: 0.80 * H,   r: f.rMand },
      { x: f.chw,       y: 0.965 * H,  r: f.rQueixo },
      { x: 0,           y: H,          r: 1 }
    ];
    var esquerda = direita.slice(1, 7).reverse().map(function (p) {
      return { x: -p.x, y: p.y, r: p.r };
    });
    var marcos = direita.concat(esquerda);
    var amostras = amostrar(marcos, true, 26);

    /* meia-largura do rosto numa altura y — onde as orelhas, a barba e o
       cabelo se apoiam */
    var lado = amostras.filter(function (p) { return p.x >= 0; });
    function largura(y) {
      var melhor = 0;
      for (var i = 0; i < lado.length - 1; i++) {
        var a = lado[i], b = lado[i + 1];
        if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) {
          var t = (y - a.y) / (b.y - a.y);
          melhor = Math.max(melhor, a.x + (b.x - a.x) * t);
        }
      }
      return melhor;
    }

    return { f: f, H: H, marcos: marcos, amostras: amostras, largura: largura, d: caminho(marcos, true) };
  }

  /* ===========================================================================
     CORPO — pescoço, ombros e colarinho. Sem eles a cabeça "boia" e o
     desenho parece esboço; com eles vira retrato.
  =========================================================================== */
  function corpo(m, ids) {
    var H = m.H, g = '';
    /* pescoço masculino: quase da largura do ângulo da mandíbula */
    var pw = limitar(0.62 * m.f.jw, 50, 64), base = H + 58;
    /* camisa: ombros caindo em diagonal suave, gola aberta */
    g += '<path d="M' + (-pw - 6) + ' ' + (base - 8) +
         ' C' + (-pw - 40) + ' ' + (base + 6) + ' ' + (-170) + ' ' + (base + 22) + ' ' + (-212) + ' ' + (base + 62) +
         ' L-240 ' + (base + 200) + ' L240 ' + (base + 200) + ' L212 ' + (base + 62) +
         ' C170 ' + (base + 22) + ' ' + (pw + 40) + ' ' + (base + 6) + ' ' + (pw + 6) + ' ' + (base - 8) + ' Z" fill="' + CAMISA + '"/>';
    /* pescoço */
    g += '<path d="M' + (-pw + 2) + ' ' + (0.80 * H) + ' C' + (-pw + 4) + ' ' + (0.95 * H) + ' ' + (-pw) + ' ' + (H + 30) + ' ' + (-pw - 4) + ' ' + (base + 4) +
         ' L' + (pw + 4) + ' ' + (base + 4) + ' C' + pw + ' ' + (H + 30) + ' ' + (pw - 4) + ' ' + (0.95 * H) + ' ' + (pw - 2) + ' ' + (0.80 * H) + ' Z"' +
         ' fill="url(#' + ids.pescoco + ')" stroke="' + TRACO + '" stroke-width="1.6"/>';
    /* decote em V da camisa aberta */
    g += '<path d="M' + (-pw - 4) + ' ' + (base + 2) + ' L0 ' + (base + 62) + ' L' + (pw + 4) + ' ' + (base + 2) + '" fill="url(#' + ids.pescoco + ')"/>';
    /* golas */
    g += '<path d="M' + (-pw - 8) + ' ' + (base - 10) + ' L' + (-pw + 2) + ' ' + (base + 30) + ' L-8 ' + (base + 70) +
         ' L' + (-pw - 30) + ' ' + (base + 40) + ' Z" fill="' + CAMISA_2 + '" stroke="#1d2224" stroke-width="1.2" stroke-linejoin="round"/>';
    g += '<path d="M' + (pw + 8) + ' ' + (base - 10) + ' L' + (pw - 2) + ' ' + (base + 30) + ' L8 ' + (base + 70) +
         ' L' + (pw + 30) + ' ' + (base + 40) + ' Z" fill="' + CAMISA_2 + '" stroke="#1d2224" stroke-width="1.2" stroke-linejoin="round"/>';
    /* pomo de adão, só sugerido */
    g += traco('M-6 ' + (H + 34) + ' C-2 ' + (H + 40) + ' 2 ' + (H + 40) + ' 6 ' + (H + 34), LEVE, 1.2);
    return g;
  }

  function traco(d, cor, larg, extra) {
    return '<path d="' + d + '" fill="none" stroke="' + (cor || TRACO) + '" stroke-width="' + (larg || 1.6) +
           '" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '/>';
  }

  /* ===========================================================================
     ORELHAS
  =========================================================================== */
  function orelhas(m) {
    var H = m.H, g = '';
    var yt = 0.425 * H, yb = 0.715 * H;
    [1, -1].forEach(function (s) {
      var xt = s * (m.largura(yt) - 2), xb = s * (m.largura(yb) - 3);
      var d = 'M' + r1(xt) + ' ' + r1(yt) +
              ' C' + r1(xt + s * 16) + ' ' + r1(yt - 10) + ' ' + r1(xt + s * 24) + ' ' + r1(yt + 16) + ' ' + r1(xt + s * 21) + ' ' + r1(yt + 46) +
              ' C' + r1(xt + s * 19) + ' ' + r1(yt + 68) + ' ' + r1(xb + s * 16) + ' ' + r1(yb - 14) + ' ' + r1(xb + s * 8) + ' ' + r1(yb - 2) +
              ' C' + r1(xb + s * 5) + ' ' + r1(yb + 3) + ' ' + r1(xb) + ' ' + r1(yb) + ' ' + r1(xb) + ' ' + r1(yb);
      g += '<path d="' + d + '" fill="' + PELE + '" stroke="' + TRACO + '" stroke-width="1.6" stroke-linejoin="round"/>';
      g += traco('M' + r1(xt + s * 5) + ' ' + r1(yt + 10) + ' C' + r1(xt + s * 14) + ' ' + r1(yt + 6) + ' ' + r1(xt + s * 16) + ' ' + r1(yt + 32) +
                 ' ' + r1(xt + s * 11) + ' ' + r1(yt + 50), LEVE, 1.3);
      g += traco('M' + r1(xt + s * 6) + ' ' + r1(yt + 44) + ' C' + r1(xt + s * 10) + ' ' + r1(yt + 50) + ' ' + r1(xt + s * 9) + ' ' + r1(yt + 58) +
                 ' ' + r1(xt + s * 4) + ' ' + r1(yt + 62), LEVE, 1.1);
    });
    return g;
  }

  /* ===========================================================================
     FEIÇÕES — traço de ilustração de moda masculina: pálpebra marcada,
     sobrancelha preenchida e grossa, nariz por sombra, boca contida.
  =========================================================================== */
  function feicoes(m, ids) {
    var H = m.H, g = '';
    var yS = 0.43 * H, yO = 0.49 * H, yN = 0.715 * H, yB = 0.81 * H;

    /* sombra das maçãs, discreta — é o que dá volume ao rosto */
    [1, -1].forEach(function (s) {
      var xm = s * (m.largura(0.60 * H) - 16);
      g += traco('M' + r1(xm) + ' ' + r1(0.585 * H) + ' C' + r1(xm - s * 6) + ' ' + r1(0.63 * H) + ' ' + r1(xm - s * 14) + ' ' + r1(0.665 * H) +
                 ' ' + r1(xm - s * 22) + ' ' + r1(0.69 * H), PELE_2, 5, ' opacity="0.9"');
    });

    [1, -1].forEach(function (s) {
      /* sobrancelha: forma cheia, mais grossa na cabeça do que na cauda */
      var x0 = s * 14, x1 = s * 64;
      g += '<path d="M' + x0 + ' ' + r1(yS + 3) +
           ' C' + (s * 28) + ' ' + r1(yS - 7) + ' ' + (s * 48) + ' ' + r1(yS - 9) + ' ' + x1 + ' ' + r1(yS - 2) +
           ' C' + (s * 48) + ' ' + r1(yS - 4) + ' ' + (s * 28) + ' ' + r1(yS - 1) + ' ' + x0 + ' ' + r1(yS + 8) + ' Z" fill="' + CABELO + '"/>';

      /* olho: pálpebra superior forte, inferior leve, íris com brilho */
      var cx = s * 37;
      g += '<path d="M' + (cx - 18) + ' ' + r1(yO + 1) + ' C' + (cx - 9) + ' ' + r1(yO - 9) + ' ' + (cx + 9) + ' ' + r1(yO - 9) + ' ' + (cx + 18) + ' ' + r1(yO) +
           ' C' + (cx + 9) + ' ' + r1(yO + 7) + ' ' + (cx - 9) + ' ' + r1(yO + 7) + ' ' + (cx - 18) + ' ' + r1(yO + 1) + ' Z" fill="#fbf8f2"/>';
      g += '<circle cx="' + cx + '" cy="' + r1(yO) + '" r="6.4" fill="#4a3f33"/>';
      g += '<circle cx="' + cx + '" cy="' + r1(yO) + '" r="2.6" fill="#1a1612"/>';
      g += '<circle cx="' + (cx + s * 2) + '" cy="' + r1(yO - 2.4) + '" r="1.5" fill="#ffffff"/>';
      g += traco('M' + (cx - 19) + ' ' + r1(yO + 1) + ' C' + (cx - 9) + ' ' + r1(yO - 10) + ' ' + (cx + 9) + ' ' + r1(yO - 10) + ' ' + (cx + 19) + ' ' + r1(yO), TRACO, 2.2);
      g += traco('M' + (cx - 12) + ' ' + r1(yO + 6) + ' C' + (cx - 4) + ' ' + r1(yO + 8.5) + ' ' + (cx + 6) + ' ' + r1(yO + 8.5) + ' ' + (cx + 14) + ' ' + r1(yO + 4), LEVE, 1.2);
      g += traco('M' + (cx - 15) + ' ' + r1(yO - 7) + ' C' + (cx - 6) + ' ' + r1(yO - 14) + ' ' + (cx + 8) + ' ' + r1(yO - 14) + ' ' + (cx + 16) + ' ' + r1(yO - 6), LEVE, 1.1);
    });

    /* nariz: sombra de um lado do dorso, ponta e asas */
    g += traco('M-9 ' + r1(yS + 8) + ' C-8 ' + r1(yO + 20) + ' -12 ' + r1(yN - 28) + ' -15 ' + r1(yN - 12), PELE_2, 4);
    g += traco('M-15 ' + r1(yN - 12) + ' C-21 ' + r1(yN - 8) + ' -20 ' + r1(yN + 2) + ' -13 ' + r1(yN + 2), FEICAO, 1.6);
    g += traco('M15 ' + r1(yN - 12) + ' C21 ' + r1(yN - 8) + ' 20 ' + r1(yN + 2) + ' 13 ' + r1(yN + 2), FEICAO, 1.6);
    g += traco('M-7 ' + r1(yN + 1) + ' C-3 ' + r1(yN + 4) + ' 3 ' + r1(yN + 4) + ' 7 ' + r1(yN + 1), FEICAO, 1.5);
    g += '<ellipse cx="-8" cy="' + r1(yN - 1) + '" rx="3.2" ry="1.8" fill="' + FEICAO + '" opacity="0.7"/>';
    g += '<ellipse cx="8" cy="' + r1(yN - 1) + '" rx="3.2" ry="1.8" fill="' + FEICAO + '" opacity="0.7"/>';

    /* sulco nasolabial, bem leve */
    g += traco('M-22 ' + r1(yN - 2) + ' C-30 ' + r1(yN + 14) + ' -32 ' + r1(yB - 6) + ' -30 ' + r1(yB + 4), PELE_2, 2.2);
    g += traco('M22 ' + r1(yN - 2) + ' C30 ' + r1(yN + 14) + ' 32 ' + r1(yB - 6) + ' 30 ' + r1(yB + 4), PELE_2, 2.2);

    return g;
  }

  /* A boca é desenhada por último, sobre a barba, com o lábio em cor de pele. */
  function boca(m) {
    var H = m.H, yB = 0.81 * H, g = '';
    g += '<path d="M-27 ' + r1(yB) + ' C-18 ' + r1(yB - 6) + ' -8 ' + r1(yB - 7) + ' 0 ' + r1(yB - 4) +
         ' C8 ' + r1(yB - 7) + ' 18 ' + r1(yB - 6) + ' 27 ' + r1(yB) +
         ' C18 ' + r1(yB + 12) + ' -18 ' + r1(yB + 12) + ' -27 ' + r1(yB) + ' Z" fill="#dcbfa8"/>';
    g += traco('M-27 ' + r1(yB) + ' C-17 ' + r1(yB + 2) + ' -8 ' + r1(yB + 1) + ' 0 ' + r1(yB + 2) +
               ' C8 ' + r1(yB + 1) + ' 17 ' + r1(yB + 2) + ' 27 ' + r1(yB), FEICAO, 1.8);
    g += traco('M-12 ' + r1(yB + 12) + ' C-5 ' + r1(yB + 14) + ' 5 ' + r1(yB + 14) + ' 12 ' + r1(yB + 12), LEVE, 1.3);
    g += traco('M-10 ' + r1(0.885 * H) + ' C-4 ' + r1(0.878 * H) + ' 4 ' + r1(0.878 * H) + ' 10 ' + r1(0.885 * H), PELE_2, 2.4);
    return g;
  }

  /* ===========================================================================
     CABELO — VISTA FRONTAL
     A massa nasce do próprio contorno do crânio, deslocado para fora pela
     espessura do fio em cada altura. A direção muda três coisas: a forma da
     massa, a linha do cabelo na testa e o caminho das mechas.
  =========================================================================== */
  function medidasCabelo(medidas, H) {
    var U = H / 23;   /* 1 cm na escala do desenho (cabeça ≈ 23 cm) */
    var topo = num(medidas.topo, 5), lateral = num(medidas.lateral, 1.5);
    var franja = num(medidas.franja, 5), nuca = num(medidas.nuca, 1.5);
    return {
      U: U, topoCm: topo, lateralCm: lateral,
      topo: limitar(topo * U * 0.42, 4, 84),
      lado: limitar(lateral * U * 0.55, 1.5, 38),
      franja: limitar(franja * U * 0.55, 12, 0.19 * H),
      nuca: limitar(nuca * U * 0.5, 1.5, 32)
    };
  }

  function cabeloFrontal(m, medidas, ids, opcoes) {
    opcoes = opcoes || {};
    var H = m.H, f = m.f;
    var dir = (medidas && medidas.direcao) || 'tras';
    var c = medidasCabelo(medidas || {}, H);
    var ySb = 0.535 * H, yT = 0.40 * H;

    var topoT = c.topo * ({ cima: 0.9, tras: 0.82, lado: 0.95, frente: 0.85 }[dir] || 1);
    /* topete: a altura extra fica concentrada na frente e no centro, as
       laterais continuam justas — senão vira capacete */
    var topete = dir === 'cima' ? c.topo * 1.25 + 14 : 0;

    function espessura(p) {
      var t;
      if (p.y >= yT) {
        t = c.lado * (1 - 0.65 * limitar((p.y - yT) / (ySb - yT), 0, 1));
      } else {
        t = c.lado + (topoT - c.lado) * suave(1 - p.y / yT);
      }
      if (dir === 'lado' && p.y < yT) t *= (p.x > 0 ? 1.2 : 0.8);
      if (topete && p.y < 0.3 * H) t += topete * Math.exp(-Math.pow((p.x - 8) / 58, 2)) * suave(1 - p.y / (0.3 * H));
      return t + 1.5;
    }

    /* contorno de fora: do costeleta esquerda, sobre o topo, à costeleta direita */
    var am = m.amostras, meio = 0;
    for (var i = 0; i < am.length; i++) { if (am[i].y > am[meio].y) meio = i; }
    var dir0 = am.slice(0, meio + 1).filter(function (p) { return p.y <= ySb; });
    var esq0 = am.slice(meio).filter(function (p) { return p.y <= ySb; });
    var fora = deslocar(esq0.concat(dir0), espessura, { x: 0, y: 0.45 * H });

    /* linha do cabelo */
    var sb = c.lateralCm < 1 ? 7 : 11;
    function lado(s) {
      return [
        { x: s * (m.largura(ySb) - sb), y: ySb, r: 0.4 },
        { x: s * (m.largura(0.43 * H) - sb - 2), y: 0.43 * H },
        { x: s * (m.largura(0.33 * H) - 16), y: 0.33 * H, r: 0.8 }
      ];
    }
    var frenteLinha;
    var xRisca = -0.42 * f.fw;
    if (dir === 'frente') {
      /* franja texturizada, levemente varrida para um lado: pontas curtas
         e irregulares — pontas longas e regulares viram desenho animado */
      var yF = 0.145 * H + c.franja, larg = m.largura(yF) - 18, pontas = [];
      var qtd = 12, amp = [0, 5, 2, 6, 1, 4, 0, 5, 2, 6, 1, 3, 0];
      for (var k = 0; k <= qtd; k++) {
        var u0 = k / qtd, x = -larg + 2 * larg * u0;
        var cai = Math.sin(u0 * Math.PI) * 10 - (k === 0 || k === qtd ? 12 : 0);
        pontas.push({ x: x, y: yF + cai - 10 + u0 * 8 - amp[k], r: 0.55 });
      }
      frenteLinha = pontas;
    } else if (dir === 'lado') {
      frenteLinha = [
        { x: -0.64 * f.fw, y: 0.2 * H },
        { x: xRisca, y: 0.165 * H, r: 0.3 },
        { x: -0.05 * f.fw, y: 0.19 * H },
        { x: 0.38 * f.fw, y: 0.225 * H },
        { x: 0.7 * f.fw, y: 0.25 * H }
      ];
    } else {
      frenteLinha = [
        { x: -0.62 * f.fw, y: 0.2 * H },
        { x: -0.3 * f.fw, y: 0.158 * H },
        { x: 0, y: 0.145 * H + (dir === 'tras' ? 5 : 0), r: dir === 'tras' ? 0.5 : 1 },
        { x: 0.3 * f.fw, y: 0.158 * H },
        { x: 0.62 * f.fw, y: 0.2 * H }
      ];
    }
    var dentroPts = lado(-1).concat(frenteLinha).concat(lado(1).reverse());
    var dentro = amostrar(dentroPts, false, 10);

    var massa = fora.concat(dentro.slice().reverse());
    var dMassa = poligono(massa);

    var g = '';
    g += '<clipPath id="' + ids.clipCabelo + '"><path d="' + dMassa + '"/></clipPath>';
    g += '<path d="' + dMassa + '" fill="url(#' + ids.cabelo + ')"/>';

    /* mechas — o que mostra a direção */
    var mechas = mechasFrontal(dir, m, c, topoT, dentro, fora, xRisca, topete);
    g += '<g clip-path="url(#' + ids.clipCabelo + ')">' +
         '<ellipse cx="' + (dir === 'lado' ? 30 : 0) + '" cy="' + r1(-topoT * 0.3) + '" rx="' + r1(f.sw * 0.7) + '" ry="' + r1(topoT * 0.8 + 16) +
         '" fill="#ffffff" opacity="0.07"/>' +
         mechas.escuras.map(function (d) { return traco(d, '#15120f', 2.4, ' opacity="0.55"'); }).join('') +
         mechas.claras.map(function (d) { return traco(d, FIO, 1.2, ' opacity="0.85"'); }).join('') +
         '</g>';
    g += '<path d="' + dMassa + '" fill="none" stroke="#1b1713" stroke-width="1.4" stroke-linejoin="round"/>';

    /* risca */
    if (dir === 'lado') {
      g += traco('M' + r1(xRisca) + ' ' + r1(0.165 * H) + ' C' + r1(xRisca * 0.95) + ' ' + r1(0.08 * H) + ' ' + r1(xRisca * 0.85) + ' ' + r1(-topoT * 0.2) +
                 ' ' + r1(xRisca * 0.78) + ' ' + r1(-topoT * 0.55), '#d9cbb1', 1.6, ' opacity="0.8"');
    }

    return {
      svg: g, topoT: topoT, c: c, fora: fora,
      topoY: Math.min.apply(null, fora.map(function (p) { return p.y; }))
    };
  }

  function mechasFrontal(dir, m, c, topoT, dentro, fora, xRisca, topete) {
    var H = m.H, f = m.f, escuras = [], claras = [];
    function naLinha(u) {
      var i = Math.round(limitar(u, 0, 1) * (dentro.length - 1));
      return dentro[i];
    }
    /* só a parte da linha que fica na testa (sem as costeletas) */
    var ini = Math.round(dentro.length * 0.2), fim = Math.round(dentro.length * 0.8);
    function naTesta(u) { return dentro[Math.round(ini + (fim - ini) * u)]; }
    var N = 15, k, u, P, E, d;

    if (dir === 'tras' || dir === 'cima') {
      for (k = 0; k <= N; k++) {
        u = k / N; P = naTesta(u);
        if (dir === 'tras') {
          E = { x: P.x * 0.42, y: -topoT * 0.95 - 6 };
          d = 'M' + r1(P.x) + ' ' + r1(P.y + 4) + ' C' + r1(P.x * 1.04) + ' ' + r1(P.y - 0.45 * (P.y - E.y)) + ' ' +
              r1(E.x + P.x * 0.35) + ' ' + r1(E.y + 22) + ' ' + r1(E.x) + ' ' + r1(E.y);
        } else {
          var alto = -topoT - topete * Math.exp(-Math.pow((P.x - 8) / 58, 2)) - 10;
          E = { x: P.x * 0.8 + 20, y: alto - 14 };
          d = 'M' + r1(P.x) + ' ' + r1(P.y + 4) + ' C' + r1(P.x * 1.04) + ' ' + r1(P.y - 50) + ' ' +
              r1(E.x - 18) + ' ' + r1(E.y + 26) + ' ' + r1(E.x) + ' ' + r1(E.y);
        }
        (k % 3 === 1 ? escuras : claras).push(d);
      }
    } else if (dir === 'lado') {
      var topoR = { x: xRisca * 0.78, y: -topoT * 0.55 }, baseR = { x: xRisca, y: 0.165 * H };
      for (k = 0; k <= N; k++) {
        u = k / N;
        var S = { x: baseR.x + (topoR.x - baseR.x) * u, y: baseR.y + (topoR.y - baseR.y) * u };
        E = { x: f.sw + topoT + 20, y: 0.40 * H - u * (0.40 * H + topoT * 0.9) };
        d = 'M' + r1(S.x + 3) + ' ' + r1(S.y) + ' C' + r1(S.x + 60) + ' ' + r1(S.y - 18 - u * 6) + ' ' +
            r1(E.x - 70) + ' ' + r1(E.y - 36) + ' ' + r1(E.x) + ' ' + r1(E.y);
        (k % 3 === 1 ? escuras : claras).push(d);
      }
      for (k = 0; k <= 6; k++) {
        u = k / 6;
        var S2 = { x: baseR.x + (topoR.x - baseR.x) * u, y: baseR.y + (topoR.y - baseR.y) * u };
        E = { x: -f.sw - c.lado - 24, y: 0.38 * H - u * (0.3 * H) };
        claras.push('M' + r1(S2.x - 3) + ' ' + r1(S2.y) + ' C' + r1(S2.x - 26) + ' ' + r1(S2.y - 4) + ' ' +
                    r1(E.x + 24) + ' ' + r1(E.y - 26) + ' ' + r1(E.x) + ' ' + r1(E.y));
      }
    } else {
      /* franja: das coroas para baixo, até cada ponta */
      for (k = 0; k <= N; k++) {
        u = k / N;
        P = naTesta(u);
        var S3 = { x: P.x * 0.35, y: -topoT * 0.6 };
        d = 'M' + r1(S3.x) + ' ' + r1(S3.y) + ' C' + r1(S3.x + P.x * 0.15) + ' ' + r1(S3.y + 40) + ' ' +
            r1(P.x - 14) + ' ' + r1(P.y - 34) + ' ' + r1(P.x + 4) + ' ' + r1(P.y + 2);
        (k % 3 === 1 ? escuras : claras).push(d);
      }
    }

    /* costeletas e laterais: traço curto vertical, mostra o fio curto */
    [1, -1].forEach(function (s) {
      for (var j = 0; j < 5; j++) {
        var y0 = 0.3 * H + j * 0.045 * H;
        var x0 = s * (m.largura(y0) + c.lado * 0.4 - 2);
        claras.push('M' + r1(x0) + ' ' + r1(y0) + ' L' + r1(x0 - s * 2) + ' ' + r1(y0 + 0.05 * H));
      }
    });
    return { escuras: escuras, claras: claras };
  }

  /* ===========================================================================
     BARBA — recortada no contorno do rosto escolhido
  =========================================================================== */
  var BARBAS = {
    'limpo':          { nome: 'Rosto limpo' },
    'cavanhaque':     { nome: 'Cavanhaque',                        cavanhaque: true, esp: 3,  tom: 0.78 },
    /* yExt: onde a linha da bochecha encosta na costeleta (fração de H)
       xInt/yInt: onde ela termina, ao lado do bigode */
    'curta-reta':     { nome: 'Barba curta com linha reta',        yExt: 0.565, xInt: 41, yInt: 0.715, curva: 0,   esp: 3,  tom: 0.6,  pescoco: 20 },
    'curta-diagonal': { nome: 'Barba curta com linha diagonal',    yExt: 0.54,  xInt: 37, yInt: 0.765, curva: 0,   esp: 3,  tom: 0.6,  pescoco: 22 },
    'media-contorno': { nome: 'Barba média com contorno definido', yExt: 0.555, xInt: 43, yInt: 0.695, curva: 0.6, esp: 11, tom: 0.76, pescoco: 30 },
    'cheia':          { nome: 'Barba cheia',                       yExt: 0.525, xInt: 47, yInt: 0.655, curva: 0.8, esp: 24, tom: 0.88, pescoco: 44 }
  };

  function barba(m, slug, medidas, ids, destaque) {
    var b = BARBAS[slug];
    if (!b || slug === 'limpo') return { svg: '', b: b || BARBAS.limpo };
    var H = m.H;
    var mm = num(medidas && medidas.barbaMm, 0);
    var esp = b.esp + (mm ? limitar(mm * 0.9, 0, 26) - 3 : 0);
    var tom = limitar(b.tom + (mm ? (mm - 3) * 0.012 : 0), 0.35, 0.86);
    var g = '', forma, pescocoY = null, bochecha = null;

    if (b.cavanhaque) {
      var yB = 0.81 * H;
      forma = [
        { x: -30, y: 0.748 * H }, { x: 0, y: 0.738 * H, r: 1 }, { x: 30, y: 0.748 * H },
        { x: 34, y: yB + 4, r: 0.8 }, { x: 26, y: 0.93 * H }, { x: 0, y: H + esp * 0.8, r: 1 },
        { x: -26, y: 0.93 * H }, { x: -34, y: yB + 4, r: 0.8 }
      ];
      forma = amostrar(forma, true, 10);
    } else {
      var yExt = b.yExt * H;
      var am = m.amostras;
      /* a parte do contorno abaixo da linha da bochecha, de um lado ao outro */
      var baixo = am.filter(function (p) { return p.y >= yExt; });
      var inicio = 0;
      for (var i = 1; i < baixo.length; i++) {
        if (Math.abs(baixo[i].x - baixo[i - 1].x) > 60) { inicio = i; break; }
      }
      /* ordena da direita (lado +x) passando pelo queixo até a esquerda */
      var cadeia = baixo.slice(inicio).concat(baixo.slice(0, inicio));
      if (cadeia[0].x < 0) cadeia.reverse();
      var fora = deslocar(cadeia, function (p) {
        var s = limitar((p.y - yExt) / (H - yExt), 0, 1);
        return 1.5 + esp * (0.25 + 0.75 * Math.pow(s, 1.3));
      }, { x: 0, y: 0.6 * H });

      var xE = m.largura(yExt);
      var yI = b.yInt * H;
      var curvaY = b.curva * 10;
      var dentroDir = [
        { x: 33, y: 0.748 * H }, { x: 18, y: 0.737 * H }, { x: 0, y: 0.733 * H }
      ];
      var linhaBoch = [
        { x: xE, y: yExt },
        { x: (xE + b.xInt) / 2, y: (yExt + yI) / 2 + curvaY },
        { x: b.xInt, y: yI }
      ];
      bochecha = linhaBoch;
      /* lado direito do desenho interno: da costeleta, pela linha da
         bochecha, desce ao lado da boca e fecha no bigode */
      var ladoD = linhaBoch.concat(yI < 0.73 * H ? [{ x: b.xInt - 3, y: (yI + 0.748 * H) / 2 }] : []).concat(dentroDir);
      var ladoE = ladoD.map(function (p) { return { x: -p.x, y: p.y }; });
      /* fecha: contorno de fora (direita → queixo → esquerda), depois o
         desenho interno (esquerda → bigode → direita) */
      forma = fora.concat(ladoE).concat(ladoD.slice(0, -1).reverse());
      pescocoY = H + b.pescoco;
    }

    var dForma = poligono(forma);
    /* Barba no pescoço, abaixo da mandíbula até a linha do pescoço. Vai
       numa camada própria, desenhada ANTES do rosto: assim só aparece onde
       é pescoço, e não vira uma faixa cinza sobre o queixo. */
    var pescocoSvg = '';
    if (pescocoY) {
      var pw = limitar(0.62 * m.f.jw, 50, 64);
      var dp = 'M' + r1(-pw) + ' ' + r1(0.86 * H) + ' L' + r1(-pw + 2) + ' ' + r1(pescocoY - 10) +
               ' C' + r1(-pw * 0.6) + ' ' + r1(pescocoY + 2) + ' ' + r1(pw * 0.6) + ' ' + r1(pescocoY + 2) + ' ' + r1(pw - 2) + ' ' + r1(pescocoY - 10) +
               ' L' + r1(pw) + ' ' + r1(0.86 * H) + ' Z';
      pescocoSvg = pelos(dp, forma.concat([{ x: -pw, y: pescocoY }, { x: pw, y: pescocoY }]), tom * 0.7, ids, 'pesc');
    }
    g += pelos(dForma, forma, tom, ids, 'barba');
    g += '<path d="' + dForma + '" fill="none" stroke="#1b1713" stroke-width="1.1" opacity="0.55" stroke-linejoin="round"/>';

    return { svg: g, pescocoSvg: pescocoSvg, b: b, bochecha: bochecha, pescocoY: pescocoY, destaque: destaque };
  }

  /* Preenchimento de pelo: tom de base + fios curtos desenhados um a um,
     na direção em que a barba cresce (para baixo, abrindo para os lados).
     Gerador com semente fixa: o mesmo desenho sai sempre igual. */
  function pelos(d, pts, tom, ids, nome) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(function (p) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); });
    var clip = uid('cp' + nome);
    var semente = 7;
    function aleatorio() { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; }
    var claros = '', escuros = '';
    var qtd = Math.round((x1 - x0) * (y1 - y0) / 34);
    for (var i = 0; i < qtd; i++) {
      var x = x0 + aleatorio() * (x1 - x0), y = y0 + aleatorio() * (y1 - y0);
      var ang = (90 + (x / 110) * 22 + (aleatorio() - 0.5) * 34) * Math.PI / 180;
      var L = 4 + aleatorio() * 4;
      var seg = 'M' + r1(x) + ' ' + r1(y) + 'l' + r1(Math.cos(ang) * L) + ' ' + r1(Math.sin(ang) * L);
      if (aleatorio() < 0.42) claros += seg; else escuros += seg;
    }
    return '<clipPath id="' + clip + '"><path d="' + d + '"/></clipPath>' +
      '<path d="' + d + '" fill="' + CABELO + '" opacity="' + r1(tom * 0.8) + '"/>' +
      '<g clip-path="url(#' + clip + ')">' +
        '<path d="' + escuros + '" stroke="#0f0d0a" stroke-width="1.15" stroke-linecap="round" opacity="' + r1(0.35 + tom * 0.4) + '"/>' +
        '<path d="' + claros + '" stroke="#a39683" stroke-width="0.9" stroke-linecap="round" opacity="0.45"/>' +
      '</g>';
  }

  /* ===========================================================================
     DEFINIÇÕES COMPARTILHADAS (gradientes e recortes)
     Cada SVG recebe ids próprios: várias ilustrações convivem na mesma página
     e um id repetido faria uma herdar o gradiente da outra.
  =========================================================================== */
  function definicoes(m) {
    var H = m.H;
    var ids = { pele: uid('pele'), pescoco: uid('pesc'), cabelo: uid('cab'), clipCabelo: uid('ccab') };
    var d = '<defs>' +
      '<radialGradient id="' + ids.pele + '" cx="50%" cy="46%" r="62%">' +
        '<stop offset="0" stop-color="#f7f0e4"/><stop offset="0.72" stop-color="' + PELE + '"/><stop offset="1" stop-color="' + PELE_2 + '"/>' +
      '</radialGradient>' +
      '<linearGradient id="' + ids.pescoco + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + PELE_2 + '"/><stop offset="0.45" stop-color="' + PELE + '"/><stop offset="1" stop-color="' + PELE + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + ids.cabelo + '" gradientUnits="userSpaceOnUse" x1="0" y1="' + r1(-0.3 * H) + '" x2="0" y2="' + r1(0.55 * H) + '">' +
        '<stop offset="0" stop-color="' + CABELO_2 + '"/><stop offset="0.35" stop-color="' + CABELO + '"/>' +
        '<stop offset="0.8" stop-color="' + CABELO + '"/><stop offset="1" stop-color="' + CABELO_2 + '"/>' +
      '</linearGradient>' +
      '</defs>';
    return { ids: ids, svg: d };
  }

  /* Monta a cabeça frontal completa, em camadas. */
  function cabecaFrontal(slug, medidas, barbaSlug, opcoes) {
    opcoes = opcoes || {};
    var m = modelo(slug);
    var def = definicoes(m);
    var ids = def.ids;
    var g = def.svg;

    g += corpo(m, ids);
    var cab = opcoes.semCabelo ? null : cabeloFrontal(m, medidas || {}, ids, opcoes);
    var bb = barba(m, barbaSlug, medidas, ids);
    g += bb.pescocoSvg || '';
    g += '<path d="' + m.d + '" fill="url(#' + ids.pele + ')"/>';
    g += '<path d="' + m.d + '" fill="none" stroke="' + TRACO + '" stroke-width="2.1" stroke-linejoin="round"/>';
    g += feicoes(m, ids);
    g += bb.svg;
    g += boca(m);
    if (cab) g += cab.svg;
    else g += traco(caminho([
      { x: -0.62 * m.f.fw, y: 0.2 * m.H }, { x: -0.3 * m.f.fw, y: 0.158 * m.H },
      { x: 0, y: 0.145 * m.H }, { x: 0.3 * m.f.fw, y: 0.158 * m.H }, { x: 0.62 * m.f.fw, y: 0.2 * m.H }
    ], false), LEVE, 1.2, ' stroke-dasharray="4 4"');
    g += orelhas(m);
    return { svg: g, m: m, cab: cab, barba: bb };
  }

  /* ===========================================================================
     COTAS — linhas de medida e rótulos, sempre fora da cabeça
  =========================================================================== */
  function seta(x1, y1, x2, y2, cor, larg) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    var ux = dx / L, uy = dy / L, bx = x2 - ux * 11, by = y2 - uy * 11, nx = -uy, ny = ux;
    return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(bx) + '" y2="' + r1(by) +
           '" stroke="' + cor + '" stroke-width="' + (larg || 2.2) + '" stroke-linecap="round"/>' +
           '<polygon points="' + r1(x2) + ',' + r1(y2) + ' ' + r1(bx + nx * 5.5) + ',' + r1(by + ny * 5.5) + ' ' +
           r1(bx - nx * 5.5) + ',' + r1(by - ny * 5.5) + '" fill="' + cor + '"/>';
  }
  function texto(x, y, conteudo, cor, ancora, tam, peso, espaco) {
    return '<text x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + (ancora || 'middle') +
           '" font-family="' + FONTE + '" font-size="' + (tam || 20) + '" font-weight="' + (peso || 500) +
           '" letter-spacing="' + (espaco == null ? 1.4 : espaco) + '" fill="' + (cor || TRACO) + '">' + esc(conteudo) + '</text>';
  }
  function guia(x1, y1, x2, y2, cor, tracejado) {
    return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="' + (cor || LEVE) +
           '" stroke-width="1.5"' + (tracejado ? ' stroke-dasharray="6 5"' : '') + '/>';
  }
  function ponto(x, y, cor) {
    return '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="4.2" fill="' + (cor || COTA) + '" stroke="#f7f4ed" stroke-width="1.5"/>';
  }
  function cm(v) {
    if (v === '' || v == null) return '—';
    return String(v).replace('.', ',') + ' cm';
  }
  /* rótulo em duas linhas: nome em versal + valor */
  function etiqueta(x, y, nome, valor, cor, ancora) {
    return texto(x, y, nome, cor, ancora, 19, 700, 2.2) + (valor ? texto(x, y + 30, valor, cor, ancora, 25, 500, 0.5) : '');
  }

  function envolver(viewBox, rotulo, conteudo) {
    return '<svg viewBox="' + viewBox + '" role="img" aria-label="' + esc(rotulo) + '" preserveAspectRatio="xMidYMid meet">' +
           conteudo + '</svg>';
  }

  /* ===========================================================================
     DIAGRAMA 1 — FORMATO DO ROSTO
     A cabeça sem cabelo, com o traçado geométrico em dourado por cima. O
     traçado nasce dos MESMOS marcos do contorno — por isso encaixa.
  =========================================================================== */
  function tracadoGeometrico(slug, m) {
    var f = m.f, H = m.H, y0 = 0.145 * H;
    var P = {
      'quadrado':             [[-f.fw, y0], [f.fw, y0], [f.jw, 0.985 * H], [-f.jw, 0.985 * H]],
      'retangular':           [[-f.fw, y0], [f.fw, y0], [f.jw, 0.985 * H], [-f.jw, 0.985 * H]],
      'triangular':           [[-f.fw * 0.86, y0], [f.fw * 0.86, y0], [f.jw + 2, 0.985 * H], [-f.jw - 2, 0.985 * H]],
      'triangular-invertido': [[-f.fw, y0], [f.fw, y0], [0, H]],
      'losango':              [[0, 0.06 * H], [f.cw + 3, 0.575 * H], [0, H], [-f.cw - 3, 0.575 * H]],
      'hexagonal-base-reta':  [[-f.fw * 0.72, y0], [f.fw * 0.72, y0], [f.cw + 3, 0.575 * H], [f.chw + 6, H], [-f.chw - 6, H], [-f.cw - 3, 0.575 * H]],
      'trapezoidal':          [[-f.fw * 0.95, y0], [f.fw * 0.95, y0], [f.jw + 2, 0.98 * H], [-f.jw - 2, 0.98 * H]],
      'pentagonal':           [[0, 0.02 * H], [f.cw + 3, 0.45 * H], [f.jw, 0.985 * H], [-f.jw, 0.985 * H], [-f.cw - 3, 0.45 * H]]
    }[slug];
    var estilo = '" fill="' + MARCA + '" fill-opacity="0.1" stroke="' + MARCA + '" stroke-width="3.2" stroke-linejoin="round"';
    if (!P) {
      var cy = (y0 + H) / 2, ry = (H - y0) / 2 + 4;
      return '<ellipse cx="0" cy="' + r1(cy) + '" rx="' + r1(f.cw + 4) + '" ry="' + r1(ry) + estilo + '/>';
    }
    var g = '<polygon points="' + P.map(function (p) { return r1(p[0]) + ',' + r1(p[1]); }).join(' ') + estilo + '/>';
    P.forEach(function (p) { g += '<circle cx="' + r1(p[0]) + '" cy="' + r1(p[1]) + '" r="5" fill="' + MARCA + '"/>'; });
    return g;
  }

  function formatoRosto(rosto) {
    var slug = rosto && rosto.slug ? rosto.slug : 'oval';
    /* cabelo curto e neutro: sem ele a cabeça parecia usar uma touca; curto,
       não esconde a testa, que é parte da leitura do formato */
    var c = cabecaFrontal(slug, { topo: 2.5, lateral: 0.8, direcao: 'tras' }, 'limpo');
    var H = c.m.H, topo = c.cab ? c.cab.topoY : 0;
    var conteudo = c.svg + tracadoGeometrico(slug, c.m);
    return envolver('-178 ' + r1(topo - 22) + ' 356 ' + r1(H + 96 - topo + 22), 'Traçado geométrico do formato de rosto', conteudo);
  }

  /* ===========================================================================
     DIAGRAMA 2 — MEDIDAS DO CORTE (vista frontal)
  =========================================================================== */
  function medidasFrontal(medidas, rostoSlug, barbaSlug) {
    medidas = medidas || {};
    var c = cabecaFrontal(rostoSlug || 'oval', medidas, barbaSlug || 'limpo');
    var m = c.m, H = m.H, cab = c.cab, g = c.svg;

    /* TOPO — cota vertical: do alto do crânio ao alto do cabelo */
    var topoY = cab.topoY;
    var xc = -m.f.sw - 70;
    g += guia(0, 0, xc - 8, 0, COTA, true);
    g += guia(-10, topoY, xc - 8, topoY, COTA, true);
    g += seta(xc, 0 - 2, xc, topoY + 2, COTA);
    g += seta(xc, topoY + 2, xc, 0 - 2, COTA);
    g += etiqueta(xc - 22, (topoY + 0) / 2 - 4, 'TOPO', cm(medidas.topo), COTA, 'end');

    /* FRENTE — a franja / o fio da frente, no alto à direita */
    var yf = 0.12 * H, xr = m.f.sw + 96;
    var yEtqF = Math.min(topoY + 30, 0.02 * H);
    g += ponto(0.3 * m.f.fw, yf, FLUXO);
    g += guia(0.3 * m.f.fw, yf, xr - 6, yEtqF - 6, FLUXO);
    g += etiqueta(xr, yEtqF, 'FRENTE', cm(medidas.franja), FLUXO, 'start');

    /* LATERAL — da pele à superfície do cabelo, na têmpora */
    var yl = 0.36 * H, xl = m.largura(yl), xlf = xl + cab.c.lado * 0.8 + 1.5;
    var yEtqL = Math.max(yEtqF + 96, 0.3 * H);
    g += ponto(xlf, yl, COTA);
    g += guia(xlf, yl, xr - 6, yEtqL - 6, COTA);
    g += etiqueta(xr, yEtqL, 'LATERAIS', cm(medidas.lateral), COTA, 'start');

    var alto = H + 150;
    return envolver('-320 ' + r1(topoY - 50) + ' 680 ' + r1(alto - topoY + 50),
      'Diagrama de medidas do corte, vista frontal', g);
  }

  /* ===========================================================================
     DIAGRAMA 3 — DIREÇÃO DO FIO (vista de perfil)
     O perfil também é construído: comprimento, ângulo da mandíbula e queixo
     vêm do formato de rosto.
  =========================================================================== */
  var DIRECOES = {
    tras:   { rotulo: 'Para trás' },
    lado:   { rotulo: 'Lateral com risca' },
    frente: { rotulo: 'Para a frente' },
    cima:   { rotulo: 'Para cima' }
  };

  function modeloPerfil(slug) {
    var f = FORMAS[slug] || FORMAS.oval;
    var H = f.H;
    var quina = 1 - f.rMand;                 /* 0 = mandíbula redonda, 1 = quina */
    var queixo = (f.chw < 20) ? 0.012 * H : 0; /* queixo fino avança um pouco */

    var nuca = [
      { x: 0.335 * H, y: 0.14 * H },
      { x: 0.05 * H,  y: -0.004 * H },
      { x: -0.3 * H,  y: 0.07 * H },
      { x: -0.47 * H, y: 0.31 * H },
      { x: -0.43 * H, y: 0.56 * H },
      { x: -0.3 * H,  y: 0.75 * H, r: 0.8 },
      { x: -0.27 * H, y: 0.9 * H },
      { x: -0.3 * H,  y: H + 60, r: 0.4 }
    ];
    var face = [
      { x: 0.335 * H, y: 0.14 * H },
      { x: 0.372 * H, y: 0.33 * H },
      { x: 0.378 * H, y: 0.41 * H, r: 0.7 },
      { x: 0.356 * H, y: 0.468 * H, r: 0.6 },
      { x: 0.47 * H,  y: 0.655 * H, r: 0.55 },
      { x: 0.39 * H,  y: 0.715 * H, r: 0.35 },
      { x: 0.405 * H, y: 0.775 * H, r: 0.7 },
      { x: 0.382 * H, y: 0.81 * H, r: 0.35 },
      { x: 0.395 * H, y: 0.845 * H, r: 0.7 },
      { x: 0.36 * H,  y: 0.888 * H, r: 0.6 },
      { x: 0.385 * H + queixo, y: 0.95 * H },
      { x: 0.33 * H,  y: 1.0 * H, r: 0.6 },
      { x: 0.2 * H,   y: 1.02 * H, r: 0.6 },
      { x: 0.13 * H,  y: 1.1 * H },
      { x: 0.14 * H,  y: H + 60, r: 0.4 }
    ];
    /* mandíbula: do mento ao ângulo e subindo pelo ramo até a orelha */
    var gonio = { x: -0.05 * H + quina * 0.01 * H, y: 0.83 * H + quina * 0.02 * H, r: 1 - quina * 0.8 };
    var mandibula = [
      { x: 0.31 * H, y: 0.985 * H },
      { x: 0.12 * H, y: 0.93 * H + quina * 0.02 * H },
      gonio,
      { x: -0.07 * H, y: 0.72 * H }
    ];
    return { f: f, H: H, nuca: nuca, face: face, mandibula: mandibula };
  }

  function cabeloPerfil(p, medidas, ids) {
    var H = p.H, dir = medidas.direcao || 'tras';
    var c = medidasCabelo(medidas, H);
    var topoT = c.topo * ({ cima: 1.5, tras: 0.85, lado: 0.95, frente: 0.9 }[dir] || 1) + (dir === 'cima' ? 10 : 0);

    /* contorno do crânio, da testa à nuca */
    var cranio = amostrar(p.nuca.slice(0, 6), false, 22);
    var n = cranio.length;
    var centro = { x: -0.05 * H, y: 0.45 * H };
    function espPerfil(s) {          /* s: 0 = testa, 1 = nuca */
      var t;
      if (s < 0.3) t = topoT * (0.55 + 1.5 * s);
      else if (s < 0.55) t = topoT * (1 - (s - 0.3) / 0.25 * 0.35) + c.lado * ((s - 0.3) / 0.25) * 0.35;
      else t = topoT * 0.65 * (1 - (s - 0.55) / 0.45) + c.nuca * ((s - 0.55) / 0.45);
      if (dir === 'cima' && s < 0.22) t += topoT * 0.55 * Math.sin(s / 0.22 * Math.PI);
      if (dir === 'frente' && s < 0.12) t += 8;
      return t + 1.5;
    }
    var fora = deslocar(cranio, function (q, i) { return espPerfil(i / (n - 1)); }, centro);

    var linhaFrente;
    if (dir === 'frente') {
      var yF = 0.145 * H + c.franja;
      linhaFrente = [{ x: 0.37 * H, y: yF }, { x: 0.33 * H, y: yF - 12 }, { x: 0.3 * H, y: yF - 4 }, { x: 0.24 * H, y: 0.2 * H }];
      fora.unshift({ x: 0.36 * H + 6, y: 0.1 * H }, { x: 0.39 * H, y: yF - 18 }, { x: 0.385 * H, y: yF + 2 });
      fora = fora.slice(0);
    } else {
      linhaFrente = [{ x: 0.335 * H, y: 0.145 * H }, { x: 0.25 * H, y: 0.19 * H }];
    }
    var dentro = linhaFrente.concat([
      { x: 0.13 * H,  y: 0.36 * H },
      { x: 0.07 * H,  y: 0.5 * H },
      { x: 0.035 * H, y: 0.565 * H, r: 0.3 },
      { x: -0.02 * H, y: 0.53 * H, r: 0.5 },
      { x: -0.05 * H, y: 0.43 * H },
      { x: -0.14 * H, y: 0.395 * H },
      { x: -0.22 * H, y: 0.45 * H },
      { x: -0.25 * H, y: 0.62 * H },
      { x: -0.28 * H, y: 0.745 * H - (c.nuca < 6 ? 0.02 * H : 0) }
    ]);
    var dentroAm = amostrar(dentro, false, 10);
    var massa = fora.concat(dentroAm.slice().reverse());
    var d = poligono(massa);

    var g = '<clipPath id="' + ids.clipCabelo + '"><path d="' + d + '"/></clipPath>';
    g += '<path d="' + d + '" fill="url(#' + ids.cabelo + ')"/>';

    /* Mechas no perfil: curvas paralelas ao crânio, em profundidades
       diferentes da massa — é assim que cabelo penteado se desenha. Cada uma
       cobre um trecho diferente, para não parecerem trilhos. */
    var esc = [], clr = [], k;
    var camadas = [0.2, 0.34, 0.46, 0.58, 0.7, 0.82, 0.92];
    var trechos = [[0.02, 0.62], [0.08, 0.86], [0.0, 0.5], [0.16, 0.95], [0.04, 0.74], [0.22, 0.9], [0.1, 0.58]];
    camadas.forEach(function (fr, j) {
      var i0 = Math.round(trechos[j][0] * (n - 1)), i1 = Math.round(trechos[j][1] * (n - 1));
      var trecho = cranio.slice(i0, i1 + 1);
      var linha = deslocar(trecho, function (q, i) { return espPerfil((i0 + i) / (n - 1)) * fr; }, centro);
      /* lateral com risca: as mechas descem na diagonal a partir do alto */
      if (dir === 'lado') {
        linha = linha.map(function (q, i) {
          var u = i / (linha.length - 1);
          return { x: q.x, y: q.y + u * u * 34 * (1 - fr) };
        });
      }
      /* para a frente: as mechas avançam e caem sobre a testa */
      if (dir === 'frente' && trechos[j][0] < 0.1) {
        var q0 = linha[0];
        linha.unshift({ x: q0.x + 16, y: q0.y + 24 + fr * 10 });
      }
      (j % 3 === 1 ? esc : clr).push(linhaPts(dir === 'frente' ? linha : linha));
    });
    /* fios curtos acima da orelha e na nuca — mostram a lateral batida */
    for (k = 0; k < 7; k++) {
      var qn = cranio[Math.round((0.62 + k * 0.05) * (n - 1))] || cranio[n - 1];
      clr.push('M' + r1(qn.x + 6) + ' ' + r1(qn.y - 2) + ' l' + r1(8) + ' ' + r1(14));
    }
    g += '<g clip-path="url(#' + ids.clipCabelo + ')">' +
         '<ellipse cx="' + r1(0.05 * H) + '" cy="' + r1(0.02 * H) + '" rx="' + r1(0.3 * H) + '" ry="' + r1(0.12 * H) + '" fill="#fff" opacity="0.07"/>' +
         esc.map(function (x) { return traco(x, '#15120f', 2.4, ' opacity="0.55"'); }).join('') +
         clr.map(function (x) { return traco(x, FIO, 1.2, ' opacity="0.85"'); }).join('') + '</g>';
    g += '<path d="' + d + '" fill="none" stroke="#1b1713" stroke-width="1.4" stroke-linejoin="round"/>';

    return {
      svg: g, topoT: topoT, c: c, fora: fora,
      topoY: Math.min.apply(null, fora.map(function (q) { return q.y; }))
    };
  }

  function medidasPerfil(medidas, rostoSlug, barbaSlug) {
    medidas = medidas || {};
    var dir = DIRECOES[medidas.direcao] ? medidas.direcao : 'tras';
    var p = modeloPerfil(rostoSlug || 'oval');
    var H = p.H;
    var def = definicoes({ H: H });
    var ids = def.ids;
    var g = def.svg;

    /* camisa e pescoço */
    g += '<path d="M' + r1(-0.3 * H - 6) + ' ' + r1(H + 52) + ' C' + r1(-0.5 * H) + ' ' + r1(H + 64) + ' ' + r1(-0.62 * H) + ' ' + r1(H + 90) +
         ' -210 ' + r1(H + 200) + ' L200 ' + r1(H + 200) + ' C' + r1(0.5 * H) + ' ' + r1(H + 100) + ' ' + r1(0.3 * H) + ' ' + r1(H + 62) +
         ' ' + r1(0.14 * H + 6) + ' ' + r1(H + 52) + ' Z" fill="' + CAMISA + '"/>';
    /* cabeça: um único contorno fechado para a pele */
    var nucaPts = p.nuca, facePts = p.face;
    var dCab = caminho(facePts, false) + ' L' + r1(nucaPts[nucaPts.length - 1].x) + ' ' + r1(nucaPts[nucaPts.length - 1].y);
    var contorno = amostrar(facePts, false, 16).concat(amostrar(nucaPts.slice().reverse(), false, 16));
    g += '<path d="' + poligono(contorno) + '" fill="url(#' + ids.pele + ')"/>';

    /* Barba no perfil — pintada ANTES do contorno, para o traço do rosto
       ficar por cima. Sai da costeleta, segue a linha da bochecha, contorna
       o canto da boca (os lábios ficam livres) e fecha no queixo e no
       pescoço, até a linha do pescoço. */
    var bb = BARBAS[barbaSlug];
    if (bb && barbaSlug !== 'limpo') {
      var mmP = num(medidas.barbaMm, 0);
      var espP = bb.esp + (mmP ? limitar(mmP * 0.9, 0, 26) - 3 : 0);
      var area;
      if (bb.cavanhaque) {
        area = [
          { x: 0.39 * H, y: 0.735 * H }, { x: 0.345 * H, y: 0.8 * H, r: 0.4 }, { x: 0.37 * H, y: 0.87 * H },
          { x: 0.385 * H + espP * 0.5, y: 0.95 * H }, { x: 0.32 * H, y: H + espP * 0.4 }, { x: 0.26 * H, y: 0.93 * H },
          { x: 0.32 * H, y: 0.8 * H }, { x: 0.35 * H, y: 0.74 * H }
        ];
      } else {
        area = [
          { x: 0.035 * H, y: bb.yExt * H + 4 },
          { x: 0.22 * H, y: bb.yInt * H + 2 },
          { x: 0.3 * H, y: 0.735 * H },
          { x: 0.392 * H, y: 0.738 * H, r: 0.5 },
          { x: 0.345 * H, y: 0.805 * H, r: 0.3 },
          { x: 0.372 * H, y: 0.868 * H, r: 0.6 },
          { x: 0.39 * H + espP * 0.55, y: 0.955 * H },
          { x: 0.33 * H + espP * 0.2, y: H + espP * 0.45 },
          { x: 0.19 * H, y: H + bb.pescoco * 0.55 },
          { x: 0.04 * H, y: 0.9 * H },
          { x: -0.045 * H, y: 0.78 * H },
          { x: -0.04 * H, y: 0.6 * H }
        ];
      }
      var da = caminho(area, true);
      g += pelos(da, amostrar(area, true, 8), bb.tom, ids, 'barbap');
    }
    var temBarba = bb && barbaSlug !== 'limpo';

    g += '<path d="' + caminho(facePts, false) + '" fill="none" stroke="' + TRACO + '" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/>';
    g += '<path d="' + caminho(nucaPts, false) + '" fill="none" stroke="' + TRACO + '" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/>';
    /* gola */
    g += '<path d="M' + r1(-0.3 * H - 6) + ' ' + r1(H + 50) + ' L' + r1(-0.26 * H) + ' ' + r1(H + 20) + ' L' + r1(0.12 * H) + ' ' + r1(H + 40) +
         ' L' + r1(0.16 * H) + ' ' + r1(H + 72) + ' Z" fill="' + CAMISA_2 + '" stroke="#1d2224" stroke-width="1.2" stroke-linejoin="round"/>';

    /* mandíbula e feições do perfil */
    if (!temBarba || (bb && bb.cavanhaque)) {
      g += '<path d="' + caminho(p.mandibula, false) + '" fill="none" stroke="' + PELE_2 + '" stroke-width="4" stroke-linecap="round" opacity="0.7"/>';
      g += traco(caminho(p.mandibula, false), LEVE, 1.3);
    }
    g += '<path d="M' + r1(0.29 * H) + ' ' + r1(0.49 * H) + ' C' + r1(0.31 * H) + ' ' + r1(0.475 * H) + ' ' + r1(0.335 * H) + ' ' + r1(0.475 * H) + ' ' +
         r1(0.35 * H) + ' ' + r1(0.485 * H) + ' C' + r1(0.335 * H) + ' ' + r1(0.5 * H) + ' ' + r1(0.31 * H) + ' ' + r1(0.5 * H) + ' ' + r1(0.29 * H) + ' ' + r1(0.49 * H) + ' Z" fill="#fbf8f2"/>';
    g += '<circle cx="' + r1(0.334 * H) + '" cy="' + r1(0.488 * H) + '" r="4.2" fill="#4a3f33"/>';
    g += traco('M' + r1(0.285 * H) + ' ' + r1(0.487 * H) + ' C' + r1(0.31 * H) + ' ' + r1(0.468 * H) + ' ' + r1(0.34 * H) + ' ' + r1(0.47 * H) + ' ' + r1(0.355 * H) + ' ' + r1(0.485 * H), TRACO, 2.1);
    g += '<path d="M' + r1(0.27 * H) + ' ' + r1(0.435 * H) + ' C' + r1(0.31 * H) + ' ' + r1(0.41 * H) + ' ' + r1(0.35 * H) + ' ' + r1(0.412 * H) + ' ' + r1(0.372 * H) + ' ' + r1(0.428 * H) +
         ' C' + r1(0.34 * H) + ' ' + r1(0.425 * H) + ' ' + r1(0.3 * H) + ' ' + r1(0.428 * H) + ' ' + r1(0.27 * H) + ' ' + r1(0.445 * H) + ' Z" fill="' + CABELO + '"/>';
    g += traco('M' + r1(0.405 * H) + ' ' + r1(0.692 * H) + ' C' + r1(0.39 * H) + ' ' + r1(0.68 * H) + ' ' + r1(0.37 * H) + ' ' + r1(0.69 * H) + ' ' + r1(0.375 * H) + ' ' + r1(0.705 * H), FEICAO, 1.6);
    g += traco('M' + r1(0.382 * H) + ' ' + r1(0.81 * H) + ' L' + r1(0.345 * H) + ' ' + r1(0.815 * H), FEICAO, 1.7);

    var cab = cabeloPerfil(p, medidas, ids);
    g += cab.svg;

    /* orelha, por cima do cabelo curto */
    var ox = -0.12 * H, oyt = 0.43 * H, oyb = 0.715 * H;
    g += '<path d="M' + r1(ox + 22) + ' ' + r1(oyt + 6) + ' C' + r1(ox + 4) + ' ' + r1(oyt - 14) + ' ' + r1(ox - 28) + ' ' + r1(oyt) + ' ' + r1(ox - 26) + ' ' + r1(oyt + 40) +
         ' C' + r1(ox - 24) + ' ' + r1(oyb - 30) + ' ' + r1(ox - 8) + ' ' + r1(oyb + 4) + ' ' + r1(ox + 12) + ' ' + r1(oyb - 6) +
         ' C' + r1(ox + 20) + ' ' + r1(oyb - 20) + ' ' + r1(ox + 16) + ' ' + r1(oyt + 40) + ' ' + r1(ox + 22) + ' ' + r1(oyt + 6) + ' Z" fill="' + PELE + '" stroke="' + TRACO + '" stroke-width="1.6"/>';
    g += traco('M' + r1(ox + 8) + ' ' + r1(oyt + 12) + ' C' + r1(ox - 14) + ' ' + r1(oyt + 4) + ' ' + r1(ox - 18) + ' ' + r1(oyt + 44) + ' ' + r1(ox - 6) + ' ' + r1(oyb - 26), LEVE, 1.3);
    g += '<ellipse cx="' + r1(ox + 4) + '" cy="' + r1(oyt + 58) + '" rx="5" ry="7" fill="' + PELE_2 + '"/>';

    /* setas de direção, grandes, sobre o cabelo */
    var fl = setasDirecao(dir, H, cab);
    g += fl;

    /* NUCA */
    var ny = 0.72 * H, nx = -0.3 * H - cab.c.nuca - 4;
    g += ponto(nx + 2, ny, COTA);
    g += guia(nx + 2, ny, -0.62 * H, ny + 40, COTA);
    g += etiqueta(-0.62 * H - 6, ny + 38, 'NUCA', cm(medidas.nuca), COTA, 'end');

    /* rótulo da direção, no alto */
    var topoY = cab.topoY;
    g += etiqueta(0.36 * H + 26, topoY + 6, 'DIREÇÃO', DIRECOES[dir].rotulo.toUpperCase(), FLUXO, 'start');

    return envolver('-370 ' + r1(topoY - 50) + ' 790 ' + r1(H + 170 - topoY + 50),
      'Diagrama da direção do fio, vista de perfil', g);
  }

  function setasDirecao(dir, H, cab) {
    var t = cab.topoT, g = '';
    var cor = '#f4e9cf';
    function curva(d) {
      return traco(d, '#0e0c0a', 7, ' opacity="0.35"') + traco(d, cor, 3.2);
    }
    function ponta(x, y, ang) {
      var a = ang * Math.PI / 180, L = 16, w = 8;
      var bx = x - Math.cos(a) * L, by = y - Math.sin(a) * L;
      return '<polygon points="' + r1(x) + ',' + r1(y) + ' ' + r1(bx - Math.sin(a) * w) + ',' + r1(by + Math.cos(a) * w) + ' ' +
             r1(bx + Math.sin(a) * w) + ',' + r1(by - Math.cos(a) * w) + '" fill="' + cor + '" stroke="#0e0c0a" stroke-opacity="0.35" stroke-width="1"/>';
    }
    if (dir === 'tras') {
      g += curva('M' + r1(0.3 * H) + ' ' + r1(0.06 * H - t * 0.3) + ' C' + r1(0.15 * H) + ' ' + r1(-0.06 * H - t * 0.5) + ' ' + r1(-0.2 * H) + ' ' + r1(-0.02 * H - t * 0.4) + ' ' + r1(-0.33 * H) + ' ' + r1(0.14 * H - t * 0.2));
      g += ponta(-0.33 * H, 0.14 * H - t * 0.2, 128);
      g += curva('M' + r1(0.2 * H) + ' ' + r1(0.2 * H) + ' C' + r1(0.05 * H) + ' ' + r1(0.12 * H) + ' ' + r1(-0.2 * H) + ' ' + r1(0.16 * H) + ' ' + r1(-0.32 * H) + ' ' + r1(0.34 * H));
      g += ponta(-0.32 * H, 0.34 * H, 118);
    } else if (dir === 'cima') {
      g += curva('M' + r1(0.3 * H) + ' ' + r1(0.14 * H) + ' C' + r1(0.34 * H) + ' ' + r1(0.02 * H - t * 0.6) + ' ' + r1(0.2 * H) + ' ' + r1(-0.06 * H - t * 0.8) + ' ' + r1(0.02 * H) + ' ' + r1(-0.04 * H - t * 0.8));
      g += ponta(0.02 * H, -0.04 * H - t * 0.8, 175);
      g += curva('M' + r1(0.14 * H) + ' ' + r1(0.22 * H) + ' C' + r1(0.16 * H) + ' ' + r1(0.08 * H) + ' ' + r1(0.1 * H) + ' ' + r1(0.02 * H - t * 0.3) + ' ' + r1(-0.04 * H) + ' ' + r1(0.0 * H - t * 0.3));
      g += ponta(-0.04 * H, 0.0 * H - t * 0.3, 170);
    } else if (dir === 'frente') {
      g += curva('M' + r1(-0.3 * H) + ' ' + r1(0.12 * H) + ' C' + r1(-0.16 * H) + ' ' + r1(-0.06 * H - t * 0.4) + ' ' + r1(0.2 * H) + ' ' + r1(-0.04 * H - t * 0.4) + ' ' + r1(0.33 * H) + ' ' + r1(0.14 * H));
      g += ponta(0.33 * H, 0.14 * H, 58);
      g += curva('M' + r1(-0.3 * H) + ' ' + r1(0.32 * H) + ' C' + r1(-0.14 * H) + ' ' + r1(0.14 * H) + ' ' + r1(0.1 * H) + ' ' + r1(0.1 * H) + ' ' + r1(0.2 * H) + ' ' + r1(0.2 * H));
      g += ponta(0.2 * H, 0.2 * H, 48);
    } else {
      g += curva('M' + r1(0.1 * H) + ' ' + r1(0.02 * H - t * 0.4) + ' C' + r1(0.02 * H) + ' ' + r1(0.14 * H) + ' ' + r1(-0.08 * H) + ' ' + r1(0.24 * H) + ' ' + r1(-0.16 * H) + ' ' + r1(0.34 * H));
      g += ponta(-0.16 * H, 0.34 * H, 125);
      g += curva('M' + r1(0.26 * H) + ' ' + r1(0.1 * H) + ' C' + r1(0.2 * H) + ' ' + r1(0.2 * H) + ' ' + r1(0.12 * H) + ' ' + r1(0.3 * H) + ' ' + r1(0.06 * H) + ' ' + r1(0.38 * H));
      g += ponta(0.06 * H, 0.38 * H, 122);
    }
    return g;
  }

  /* ===========================================================================
     DIAGRAMA 4 — DESENHO DA BARBA
  =========================================================================== */
  function desenhoBarba(barbaSlug, rostoSlug, medidas) {
    medidas = medidas || {};
    var slug = BARBAS[barbaSlug] ? barbaSlug : 'curta-reta';
    var c = cabecaFrontal(rostoSlug || 'oval', medidas, slug);
    var m = c.m, H = m.H, g = c.svg, bb = c.barba, b = BARBAS[slug];
    var xR = m.f.sw + 92;

    if (bb.bochecha) {
      var L = bb.bochecha;
      g += traco(linhaPts([{ x: -L[0].x, y: L[0].y }, { x: -L[2].x, y: L[2].y }]), COTA, 2.4, ' stroke-dasharray="7 5"');
      g += traco(linhaPts([L[0], L[2]]), COTA, 2.4, ' stroke-dasharray="7 5"');
      g += ponto(L[0].x, L[0].y, COTA);
      g += guia(L[0].x, L[0].y, xR, L[0].y - 40, COTA);
      g += etiqueta(xR + 8, L[0].y - 46, 'LINHA DA', 'BOCHECHA', COTA, 'start');
    }
    if (bb.pescocoY) {
      var py = bb.pescocoY;
      g += traco('M-50 ' + r1(py) + ' L50 ' + r1(py), COTA, 2.4, ' stroke-dasharray="7 5"');
      g += ponto(50, py, COTA);
      g += guia(50, py, xR, py + 26, COTA);
      g += etiqueta(xR + 8, py + 20, 'LINHA DO', 'PESCOÇO', COTA, 'start');
    }
    var mm = num(medidas.barbaMm, 0);
    if (slug !== 'limpo') {
      var yq = 0.93 * H;
      g += ponto(-0.3 * m.f.jw, yq, MARCA);
      g += guia(-0.3 * m.f.jw, yq, -m.f.sw - 80, yq + 20, MARCA);
      g += etiqueta(-m.f.sw - 88, yq + 14, 'COMPRIMENTO', mm ? String(mm).replace('.', ',') + ' mm' : '—', MARCA, 'end');
    }
    var topo = c.cab ? c.cab.topoY : 0;
    return envolver('-380 ' + r1(topo - 40) + ' 760 ' + r1(H + 170 - topo + 40), 'Diagrama do desenho da barba: ' + b.nome, g);
  }

  /* ===========================================================================
     LINHAS DA GESTALT — a "linha predominante" de cada perfil, desenhada.
     É a tradução visual do que o texto da página diz: diagonal para o Rei,
     retas para o Guerreiro, verticais finas e curvas longas para o Mago,
     curvas dentro de um contorno firme para o Amante.
  =========================================================================== */
  function linhasGestalt(perfil) {
    var g = '', i;
    function l(x1, y1, x2, y2, larg, op) {
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + MARCA +
             '" stroke-width="' + larg + '" stroke-linecap="round" opacity="' + op + '"/>';
    }
    function c(d, larg, op) {
      return '<path d="' + d + '" fill="none" stroke="' + MARCA + '" stroke-width="' + larg +
             '" stroke-linecap="round" opacity="' + op + '"/>';
    }
    if (perfil === 'guerreiro') {
      for (i = 0; i < 7; i++) g += l(120 + i * 110, 40, 120 + i * 110, 280, i % 3 === 0 ? 5 : 2, i % 3 === 0 ? 1 : 0.55);
      for (i = 0; i < 3; i++) g += l(60, 70 + i * 90, 840, 70 + i * 90, i === 1 ? 5 : 2, i === 1 ? 1 : 0.55);
    } else if (perfil === 'mago') {
      for (i = 0; i < 11; i++) g += l(110 + i * 68, 36, 110 + i * 68, 284, 1.6, 0.45 + (i % 4 === 0 ? 0.45 : 0));
      g += c('M40 250 C260 250 380 60 860 70', 4, 1);
      g += c('M40 290 C300 280 460 120 860 130', 2, 0.6);
    } else if (perfil === 'amante') {
      g += '<rect x="60" y="40" width="780" height="240" fill="none" stroke="' + MARCA + '" stroke-width="4"/>';
      g += c('M60 200 C200 90 330 90 450 160 C570 230 700 230 840 120', 4, 1);
      g += c('M60 240 C200 150 330 150 450 210 C570 270 700 270 840 180', 2, 0.55);
      g += c('M60 150 C200 50 330 50 450 110 C570 170 700 170 840 70', 2, 0.55);
    } else {
      for (i = 0; i < 9; i++) {
        var x = 60 + i * 95, alt = [220, 150, 240, 180, 240, 130, 220, 170, 200][i];
        g += l(x, 290, x + alt * 0.78, 290 - alt, i % 3 === 1 ? 5 : 2, i % 3 === 1 ? 1 : 0.55);
      }
      g += c('M40 300 C300 290 560 170 860 36', 2, 0.4);
    }
    return '<svg viewBox="0 0 900 320" role="img" aria-label="Linha predominante do perfil">' + g + '</svg>';
  }

  function listaBarbas() {
    return Object.keys(BARBAS).map(function (k) { return { slug: k, nome: BARBAS[k].nome }; });
  }
  function listaDirecoes() {
    return Object.keys(DIRECOES).map(function (k) { return { slug: k, nome: DIRECOES[k].rotulo }; });
  }
  function nomeBarba(slug) { return (BARBAS[slug] || BARBAS['curta-reta']).nome; }

  return {
    formatoRosto: formatoRosto,
    medidasFrontal: medidasFrontal,
    medidasPerfil: medidasPerfil,
    desenhoBarba: desenhoBarba,
    linhasGestalt: linhasGestalt,
    listaBarbas: listaBarbas,
    listaDirecoes: listaDirecoes,
    nomeBarba: nomeBarba
  };
});
