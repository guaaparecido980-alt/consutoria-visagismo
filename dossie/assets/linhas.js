/* =============================================================================
   DOSSIÊ DE VISAGISMO — DESENHOS SÓ DE LINHAS
   -----------------------------------------------------------------------------
   Estilo de prancha técnica: fundo grafite, traço fino creme para a cabeça e
   dourado para o que é do cabelo, da barba e das medidas. Nada de pele
   pintada, nada de modelo 3D e nada de cabelo sobre a cabeça: a cabeça é
   sempre "nua", e o cabelo aparece só como o CONTORNO do modelo escolhido,
   desenhado por cima, com as mechas indicando a direção.

   A geometria (formato do rosto, perfil, medidas do cabelo, área da barba) é
   a de diagramas.js — este arquivo só decide como desenhar.
============================================================================= */
(function (raiz, fabrica) {
  var D = (typeof module === 'object' && module.exports) ? require('./diagramas.js') : raiz.DossieDiagramas;
  var api = fabrica(D);
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.DossieLinhas = api; }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  var I = D.interno;
  var r1 = I.r1, num = I.num, limitar = I.limitar, esc = I.esc;
  var amostrar = I.amostrar, caminho = I.caminho, deslocar = I.deslocar;
  var linhaPts = I.linhaPts, poligono = I.poligono;

  var FUNDO = '#1e1b16';
  var CREME = '#efe4c8';
  var OURO  = '#d4bc82';
  var FONTE = 'Inter, Helvetica, Arial, sans-serif';

  var contador = 0;
  function uid(p) { contador += 1; return p + contador; }

  /* ---------------------------------------------------------------------------
     PEÇAS DE DESENHO
  --------------------------------------------------------------------------- */
  function tr(d, cor, larg, op, extra) {
    return '<path d="' + d + '" fill="none" stroke="' + cor + '" stroke-width="' + larg + '"' +
           (op != null && op < 1 ? ' stroke-opacity="' + op + '"' : '') +
           ' stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '/>';
  }
  function cm(v) { var x = num(v, 0); return x > 0 ? String(x).replace('.', ',') + ' cm' : '—'; }

  function txt(x, y, s, tam, cor, peso, anc, esp, op) {
    return '<text x="' + r1(x) + '" y="' + r1(y) + '" font-family="' + FONTE + '" font-size="' + tam +
           '" font-weight="' + peso + '" fill="' + cor + '"' + (op != null ? ' fill-opacity="' + op + '"' : '') +
           ' text-anchor="' + (anc || 'start') + '"' + (esp ? ' letter-spacing="' + esp + '"' : '') + '>' + esc(s) + '</text>';
  }
  /* rótulo de duas linhas: nome pequeno, valor em dourado */
  function etiqueta(x, y, nome, valor, anc, tam) {
    tam = tam || 42;
    var linhas = Array.isArray(valor) ? valor : [valor], g = txt(x, y, nome, 25, CREME, 600, anc, 3.4, 0.78);
    linhas.forEach(function (l, i) { g += txt(x, y + 44 + i * (tam + 4), l, tam, OURO, 500, anc, 0); });
    return g;
  }
  function ponto(p) {
    return '<circle cx="' + r1(p.x) + '" cy="' + r1(p.y) + '" r="7" fill="' + FUNDO + '" stroke="' + OURO + '" stroke-width="2.8"/>';
  }
  function guia(a, b) { return tr(linhaPts([a, b]), OURO, 1.8, 0.75); }

  /* cota: linha de medida com traços nas pontas */
  function cota(a, b, t) {
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    var nx = -dy / L * (t || 9), ny = dx / L * (t || 9);
    return tr(linhaPts([a, b]), OURO, 2.2, 0.95) +
           tr(linhaPts([{ x: a.x - nx, y: a.y - ny }, { x: a.x + nx, y: a.y + ny }]), OURO, 2.2, 0.95) +
           tr(linhaPts([{ x: b.x - nx, y: b.y - ny }, { x: b.x + nx, y: b.y + ny }]), OURO, 2.2, 0.95);
  }

  /* linha que se apaga aos poucos — pescoço e ombros "somem" no fundo */
  function tracoFade(pts, cor, larg, op0) {
    var n = pts.length - 1, g = '';
    /* ponta reta (butt): com ponta redonda cada emenda semitransparente
       vira uma bolinha e a linha sai pontilhada */
    for (var i = 0; i < n; i++) {
      g += '<path d="' + linhaPts([pts[i], pts[i + 1]]) + '" fill="none" stroke="' + cor + '" stroke-width="' + larg +
           '" stroke-opacity="' + Math.max(0.04, op0 * (1 - i / n)).toFixed(2) + '" stroke-linecap="butt"/>';
    }
    return g;
  }

  function seta(pts, cor, larg) {
    var n = pts.length, b = pts[n - 1], a = pts[Math.max(0, n - 4)];
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    dx /= L; dy /= L;
    var t = 13, w = 6.5;
    var p1 = { x: b.x - dx * t - dy * w, y: b.y - dy * t + dx * w };
    var p2 = { x: b.x - dx * t + dy * w, y: b.y - dy * t - dx * w };
    return tr(linhaPts(pts), cor, larg) +
           '<path d="M' + r1(b.x + dx * 3) + ' ' + r1(b.y + dy * 3) + ' L' + r1(p1.x) + ' ' + r1(p1.y) + ' L' + r1(p2.x) + ' ' + r1(p2.y) +
           ' Z" fill="' + cor + '" stroke="' + cor + '" stroke-width="1" stroke-linejoin="round"/>';
  }

  function envolver(W, Ht, rotulo, conteudo) {
    return '<svg viewBox="0 0 ' + W + ' ' + Ht + '" role="img" aria-label="' + esc(rotulo) + '" preserveAspectRatio="xMidYMid meet">' +
           '<rect width="' + W + '" height="' + Ht + '" fill="' + FUNDO + '"/>' + conteudo + '</svg>';
  }

  function espelho(p) { return { x: -p.x, y: p.y }; }

  /* ===========================================================================
     CABEÇA DE FRENTE — só contorno e feições em traço
  =========================================================================== */
  function cabecaFrente(m, opc) {
    opc = opc || {};
    var H = m.H, f = m.f, g = '';
    var yS = 0.43 * H, yO = 0.49 * H, yN = 0.715 * H, yB = 0.81 * H;

    /* réguas do cânone de retrato: linha do cabelo, sobrancelha, olhos,
       nariz e boca — bem discretas, dão o ar de prancha técnica */
    var xg = f.sw + 44;
    [0.145, 0.43, 0.49, 0.715, 0.81].forEach(function (y) {
      g += tr('M' + r1(-xg) + ' ' + r1(y * H) + ' L' + r1(xg) + ' ' + r1(y * H), OURO, 1.1, 0.2, ' stroke-dasharray="2 8"');
    });
    g += tr('M0 ' + r1(opc.eixoTopo == null ? -18 : opc.eixoTopo) + ' L0 ' + r1(H + 26), OURO, 1.1, 0.2, ' stroke-dasharray="2 8"');

    /* pescoço e ombros, apagando aos poucos */
    var pw = limitar(0.62 * f.jw, 50, 64);
    [1, -1].forEach(function (s) {
      var cad = amostrar([
        { x: s * pw, y: 0.84 * H }, { x: s * (pw + 2), y: H + 8 }, { x: s * (pw + 8), y: H + 42 },
        { x: s * (pw + 52), y: H + 62 }, { x: s * 150, y: H + 86 }, { x: s * 216, y: H + 132 }
      ], false, 8);
      g += tracoFade(cad, CREME, 2.4, 0.9);
    });

    /* orelhas */
    var yt = 0.425 * H, yb = 0.715 * H;
    [1, -1].forEach(function (s) {
      var xt = s * (m.largura(yt) - 2), xb = s * (m.largura(yb) - 3);
      g += tr('M' + r1(xt) + ' ' + r1(yt) +
              ' C' + r1(xt + s * 16) + ' ' + r1(yt - 10) + ' ' + r1(xt + s * 24) + ' ' + r1(yt + 16) + ' ' + r1(xt + s * 21) + ' ' + r1(yt + 46) +
              ' C' + r1(xt + s * 19) + ' ' + r1(yt + 68) + ' ' + r1(xb + s * 16) + ' ' + r1(yb - 14) + ' ' + r1(xb + s * 8) + ' ' + r1(yb - 2) +
              ' C' + r1(xb + s * 5) + ' ' + r1(yb + 3) + ' ' + r1(xb) + ' ' + r1(yb) + ' ' + r1(xb) + ' ' + r1(yb), CREME, 2.2, 0.85);
      g += tr('M' + r1(xt + s * 5) + ' ' + r1(yt + 10) + ' C' + r1(xt + s * 14) + ' ' + r1(yt + 6) + ' ' + r1(xt + s * 16) + ' ' + r1(yt + 32) +
              ' ' + r1(xt + s * 11) + ' ' + r1(yt + 50), CREME, 1.5, 0.45);
    });

    /* contorno da cabeça */
    g += tr(m.d, CREME, 3.2, 1);

    /* sobrancelhas, olhos */
    [1, -1].forEach(function (s) {
      g += tr('M' + (s * 14) + ' ' + r1(yS + 4) + ' C' + (s * 28) + ' ' + r1(yS - 6) + ' ' + (s * 48) + ' ' + r1(yS - 8) + ' ' + (s * 64) + ' ' + r1(yS - 1), CREME, 3.6, 0.9);
      var cx = s * 37;
      g += tr('M' + (cx - 19) + ' ' + r1(yO + 1) + ' C' + (cx - 9) + ' ' + r1(yO - 10) + ' ' + (cx + 9) + ' ' + r1(yO - 10) + ' ' + (cx + 19) + ' ' + r1(yO), CREME, 2.4, 0.95);
      g += tr('M' + (cx - 17) + ' ' + r1(yO + 2) + ' C' + (cx - 8) + ' ' + r1(yO + 8) + ' ' + (cx + 8) + ' ' + r1(yO + 8) + ' ' + (cx + 17) + ' ' + r1(yO + 1), CREME, 1.6, 0.55);
      g += '<circle cx="' + cx + '" cy="' + r1(yO - 0.5) + '" r="6.4" fill="none" stroke="' + CREME + '" stroke-width="1.9" stroke-opacity="0.85"/>';
      g += '<circle cx="' + cx + '" cy="' + r1(yO - 0.5) + '" r="1.9" fill="' + CREME + '" fill-opacity="0.9"/>';
    });

    /* nariz */
    g += tr('M-9 ' + r1(yS + 8) + ' C-8 ' + r1(yO + 20) + ' -12 ' + r1(yN - 28) + ' -15 ' + r1(yN - 12), CREME, 1.6, 0.4);
    g += tr('M9 ' + r1(yS + 8) + ' C8 ' + r1(yO + 20) + ' 12 ' + r1(yN - 28) + ' 15 ' + r1(yN - 12), CREME, 1.6, 0.4);
    g += tr('M-15 ' + r1(yN - 12) + ' C-22 ' + r1(yN - 8) + ' -20 ' + r1(yN + 2) + ' -13 ' + r1(yN + 2), CREME, 2, 0.8);
    g += tr('M15 ' + r1(yN - 12) + ' C22 ' + r1(yN - 8) + ' 20 ' + r1(yN + 2) + ' 13 ' + r1(yN + 2), CREME, 2, 0.8);
    g += tr('M-8 ' + r1(yN + 2) + ' C-3 ' + r1(yN + 5) + ' 3 ' + r1(yN + 5) + ' 8 ' + r1(yN + 2), CREME, 2, 0.8);

    /* boca */
    g += tr('M-27 ' + r1(yB) + ' C-18 ' + r1(yB - 6) + ' -8 ' + r1(yB - 7) + ' 0 ' + r1(yB - 4) +
            ' C8 ' + r1(yB - 7) + ' 18 ' + r1(yB - 6) + ' 27 ' + r1(yB), CREME, 2, 0.85);
    g += tr('M-27 ' + r1(yB) + ' C-17 ' + r1(yB + 2) + ' -8 ' + r1(yB + 1) + ' 0 ' + r1(yB + 2) +
            ' C8 ' + r1(yB + 1) + ' 17 ' + r1(yB + 2) + ' 27 ' + r1(yB), CREME, 2.2, 0.95);
    g += tr('M-22 ' + r1(yB + 3) + ' C-14 ' + r1(yB + 14) + ' 14 ' + r1(yB + 14) + ' 22 ' + r1(yB + 3), CREME, 1.8, 0.7);
    g += tr('M-9 ' + r1(0.885 * H) + ' C-4 ' + r1(0.879 * H) + ' 4 ' + r1(0.879 * H) + ' 9 ' + r1(0.885 * H), CREME, 1.5, 0.4);
    return g;
  }

  /* ===========================================================================
     CABELO DE FRENTE — só o contorno do modelo e as mechas
  =========================================================================== */
  function yNaCadeia(pts, x) {   /* pts ordenados por x crescente */
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      if (x >= a.x && x <= b.x && b.x !== a.x) return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
    }
    return pts[pts.length - 1].y;
  }

  function cabeloFrente(m, medidas) {
    var H = m.H, dir = (medidas && medidas.direcao) || 'tras';
    var c = I.medidasCabelo(medidas || {}, H);
    var ySide = 0.43 * H, centro = { x: 0, y: 0.4 * H };
    var topo = c.topo * ({ cima: 1.4, tras: 0.9, lado: 1, frente: 0.95 }[dir] || 1) + (dir === 'cima' ? 8 : 0);

    var R = m.amostras.filter(function (p) { return p.x >= 0 && p.y <= ySide; });
    var fora = deslocar(R, function (p) {
      var s = limitar(p.y / ySide, 0, 1), k = Math.pow(s, 1.4);
      return topo * (1 - k) + c.lado * k + 1.5;
    }, centro);

    /* linha do cabelo na testa: com franja ela desce; para cima, sobe */
    var fr = dir === 'frente' ? Math.min(c.franja * 0.55, 0.16 * H) : (dir === 'cima' ? -4 : 0);
    var yh = 0.145 * H + fr;
    var xs = m.largura(ySide) - 1.5, W2 = m.largura(0.22 * H);
    var interno = amostrar([
      { x: xs, y: ySide }, { x: xs - 2, y: 0.34 * H },
      { x: W2 * 0.86, y: 0.235 * H + fr * 0.4 }, { x: W2 * 0.55, y: 0.17 * H + fr * 0.85 },
      { x: W2 * 0.22, y: yh - 3 }, { x: 0, y: yh }
    ], false, 10);
    var internoE = interno.slice(0, -1).reverse().map(espelho);
    var foraE = fora.slice().reverse().map(espelho);
    var contorno = fora.concat(interno).concat(internoE).concat(foraE);
    var d = poligono(contorno);

    var id = uid('recCab');
    var g = '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>';
    g += '<path d="' + d + '" fill="' + OURO + '" fill-opacity="0.06"/>';

    /* mechas: da linha do cabelo até o alto, no rumo da direção */
    var todos = internoE.slice().concat(interno.slice().reverse().slice(1)).sort(function (a, b) { return a.x - b.x; });
    var N = 11, mech = '', Wt = m.largura(0.1 * H), up = -0.3;
    for (var k = 0; k < N; k++) {
      var u = (k + 0.5) / N * 2 - 1;
      var x0 = u * W2 * 0.82, y0 = yNaCadeia(todos, x0);
      var x1, y1 = -topo * 0.88 + Math.abs(u) * topo * 0.55, q0, q1;
      if (dir === 'lado') {
        x1 = up * Wt + (u - up) * Wt * 0.95;
        q0 = { x: x0 + (x1 - x0) * 0.2, y: y0 - (y0 - y1) * 0.5 };
        q1 = { x: x1 - (x1 - x0) * 0.1, y: y1 + (y0 - y1) * 0.15 };
      } else if (dir === 'cima') {
        x1 = x0 * 0.94;
        q0 = { x: x0, y: y0 - (y0 - y1) * 0.4 }; q1 = { x: x1, y: y1 + (y0 - y1) * 0.25 };
      } else {
        x1 = u * Wt * 0.5;
        q0 = { x: x0 * 1.06, y: y0 - (y0 - y1) * 0.45 }; q1 = { x: x1 * 1.15, y: y1 + (y0 - y1) * 0.18 };
      }
      mech += tr('M' + r1(x0) + ' ' + r1(y0) + ' C' + r1(q0.x) + ' ' + r1(q0.y) + ' ' + r1(q1.x) + ' ' + r1(q1.y) + ' ' + r1(x1) + ' ' + r1(y1), OURO, 1.5, 0.5);
    }
    g += '<g clip-path="url(#' + id + ')">' + mech + '</g>';
    g += tr(d, OURO, 3.4, 1, ' stroke-linejoin="round"');

    return { svg: g, topo: topo, c: c, yh: yh, W2: W2, fora: fora, xs: xs, dir: dir };
  }

  /* barba de frente: só o contorno da área, tracejado */
  function barbaFrente(m, slug, medidas) {
    var b = I.BARBAS[slug];
    if (!b || slug === 'limpo') return { svg: '', bb: null };
    var ids = I.definicoes({ H: m.H }).ids;
    var bb = I.barba(m, slug, medidas || {}, ids, false);
    var g = '<path d="' + poligono(bb.forma) + '" fill="' + OURO + '" fill-opacity="0.09" stroke="' + OURO + '" stroke-width="2.8" stroke-dasharray="9 6" stroke-linejoin="round"/>';
    if (bb.pescocoY) {
      var pw = limitar(0.62 * m.f.jw, 50, 64);
      g += tr('M' + r1(-pw) + ' ' + r1(bb.pescocoY) + ' L' + r1(pw) + ' ' + r1(bb.pescocoY), OURO, 2.6, 0.9, ' stroke-dasharray="9 6"');
    }
    return { svg: g, bb: bb };
  }

  /* ===========================================================================
     PRANCHA 1 — FORMATO DO ROSTO
  =========================================================================== */
  var YCAB = 0.145;   /* linha do cabelo, fração de H */

  function larguras(m) {
    var H = m.H;
    return {
      testa: 2 * m.largura(0.33 * H), macas: 2 * m.largura(0.575 * H), mand: 2 * m.largura(0.80 * H),
      comprimento: (1 - YCAB) * H
    };
  }

  function proporcaoRosto(slug) {
    var m = I.modelo(slug || 'oval'), l = larguras(m);
    return l.comprimento / l.macas;
  }

  function formatoRosto(rosto) {
    var slug = rosto && rosto.slug ? rosto.slug : 'oval';
    var m = I.modelo(slug), H = m.H, f = m.f, L = larguras(m);
    var W = 900, Ht = 806, cx = 330;
    var s = (Ht - 150) / (H + 60), oy = 70;
    function P(x, y) { return { x: cx + x * s, y: oy + y * s }; }

    var yT = YCAB * H, yM = 0.575 * H, hT = L.testa / 2, hM = L.macas / 2, hB = L.mand / 2;
    var forma, el = null;
    if (slug === 'quadrado' || slug === 'retangular') forma = [[-hM, yT], [hM, yT], [hM, H], [-hM, H]];
    else if (slug === 'triangular') forma = [[-hT, yT], [hT, yT], [hB, H], [-hB, H]];
    else if (slug === 'diamante') forma = [[0, yT], [hM, yM], [0, H], [-hM, yM]];
    else if (slug === 'coracao') forma = [[-hT, yT], [hT, yT], [hM, yM], [0, H], [-hM, yM]];
    else { forma = null; el = { cy: (yT + H) / 2, ry: (H - yT) / 2, rx: hM }; }
    if (slug === 'quadrado' || slug === 'retangular') {
      /* moldura: a maior largura, da testa à mandíbula */
      var hq = Math.max(hT, hB, hM); forma = [[-hq, yT], [hq, yT], [hq, H], [-hq, H]];
    }

    var g = '<g transform="translate(' + r1(cx) + ' ' + r1(oy) + ') scale(' + r1(s * 1000) / 1000 + ')">';
    g += cabecaFrente(m, { eixoTopo: -14 });

    /* traçado geométrico do formato */
    if (forma) {
      g += '<polygon points="' + forma.map(function (p) { return r1(p[0]) + ',' + r1(p[1]); }).join(' ') + '" fill="' + OURO + '" fill-opacity="0.07" stroke="' + OURO + '" stroke-width="3.2" stroke-linejoin="round"/>';
      forma.forEach(function (p) { g += '<circle cx="' + r1(p[0]) + '" cy="' + r1(p[1]) + '" r="5" fill="' + FUNDO + '" stroke="' + OURO + '" stroke-width="2.4"/>'; });
    } else {
      g += '<ellipse cx="0" cy="' + r1(el.cy) + '" rx="' + r1(el.rx) + '" ry="' + r1(el.ry) + '" fill="' + OURO + '" fill-opacity="0.07" stroke="' + OURO + '" stroke-width="3.2"/>';
    }

    /* larguras que definem o formato */
    var lista = [
      { y: 0.33 * H, w: L.testa, nome: 'TESTA' },
      { y: yM, w: L.macas, nome: 'MAÇÃS' },
      { y: 0.80 * H, w: L.mand, nome: 'MANDÍBULA' }
    ];
    var rot = [];
    lista.forEach(function (o) {
      g += cota({ x: -o.w / 2, y: o.y }, { x: o.w / 2, y: o.y }, 7);
      rot.push({ y: o.y, xFim: o.w / 2, nome: o.nome, valor: Math.round(o.w / L.macas * 100) + '%' });
    });
    /* comprimento: da linha do cabelo ao mento */
    g += cota({ x: 0, y: yT }, { x: 0, y: H }, 11);
    rot.unshift({ y: yT, xFim: 0, nome: 'COMPRIMENTO', valor: (L.comprimento / L.macas).toFixed(2).replace('.', ',') + '×' });
    g += '</g>';

    /* rótulos na margem direita, sem se encostarem */
    var xr = 640, ultimo = -Infinity;
    rot.sort(function (a, b) { return a.y - b.y; }).forEach(function (r) {
      var p = P(r.xFim, r.y), yEt = Math.max(p.y, ultimo + 104);
      ultimo = yEt;
      g += tr(linhaPts([{ x: p.x + 12, y: p.y }, { x: xr - 46, y: p.y }, { x: xr - 16, y: yEt - 8 }]), OURO, 1.8, 0.7);
      g += etiqueta(xr, yEt - 14, r.nome, r.valor, 'start');
    });

    return '<div class="rosto3d">' +
      '<svg class="rosto3d__linhas" viewBox="0 0 ' + W + ' ' + Ht + '" role="img" aria-label="Formato do rosto em linhas: ' + esc(slug) + '">' + g + '</svg></div>';
  }

  /* ===========================================================================
     PRANCHA 2 — MEDIDAS DO CORTE (frente)
  =========================================================================== */
  function medidasFrontal(medidas, rostoSlug, barbaSlug) {
    medidas = medidas || {};
    var m = I.modelo(rostoSlug || 'oval'), H = m.H, f = m.f;
    var hair = cabeloFrente(m, medidas);
    var W = 900, Ht = 880, ox = 450;
    var yMin = -hair.topo - 44, yMax = H + 150;
    var s = (Ht - 120) / (yMax - yMin), oy = 60 - yMin * s;
    function P(x, y) { return { x: ox + x * s, y: oy + y * s }; }

    var bar = barbaFrente(m, barbaSlug || 'limpo', medidas);
    var g = '<g transform="translate(' + r1(ox) + ' ' + r1(oy) + ') scale(' + r1(s * 1000) / 1000 + ')">';
    g += cabecaFrente(m, { eixoTopo: -hair.topo - 24 });
    g += bar.svg + hair.svg;

    /* TOPO: cota vertical à esquerda, do crânio ao alto do cabelo */
    var xl = -(f.sw + hair.c.lado + 62);
    g += tr('M-26 0 L' + r1(xl) + ' 0', OURO, 1.2, 0.5, ' stroke-dasharray="3 6"');
    g += tr('M-26 ' + r1(-hair.topo) + ' L' + r1(xl) + ' ' + r1(-hair.topo), OURO, 1.2, 0.5, ' stroke-dasharray="3 6"');
    g += cota({ x: xl, y: -hair.topo }, { x: xl, y: 0 }, 9);
    g += '</g>';

    var pT = P(xl, -hair.topo / 2);
    g += etiqueta(pT.x - 26, pT.y - 12, 'TOPO', cm(medidas.topo), 'end');

    /* LATERAIS e FRENTE: pontos no contorno, rótulos à direita */
    var xr = Math.min(ox + (f.sw + hair.c.lado + 96) * s, W - 260);
    var iL = 0, melhor = 1e9;
    hair.fora.forEach(function (p, i) { var e = Math.abs(p.y - 0.33 * H); if (e < melhor) { melhor = e; iL = i; } });
    var pL = P(hair.fora[iL].x, hair.fora[iL].y), yL = P(0, 0.36 * H).y;
    g += guia(pL, { x: xr - 16, y: yL - 10 }) + ponto(pL);
    g += etiqueta(xr, yL - 4, 'LATERAIS', cm(medidas.lateral), 'start');

    var pF = P(hair.W2 * 0.3, hair.yh + 2), yF = P(0, 0.06 * H).y;
    g += guia(pF, { x: xr - 16, y: yF - 10 }) + ponto(pF);
    g += etiqueta(xr, yF - 4, 'FRENTE', cm(medidas.franja), 'start');

    return envolver(W, Ht, 'Medidas do corte, vista frontal', g);
  }

  /* ===========================================================================
     PRANCHA 3 — DESENHO DA BARBA (frente)
  =========================================================================== */
  function desenhoBarba(barbaSlug, rostoSlug, medidas) {
    medidas = medidas || {};
    var slug = I.BARBAS[barbaSlug] ? barbaSlug : 'curta-reta';
    var m = I.modelo(rostoSlug || 'oval'), H = m.H, f = m.f;
    var W = 900, Ht = 620, ox = 450;
    var yMin = -30, yMax = H + 130;
    var s = (Ht - 80) / (yMax - yMin), oy = 44 - yMin * s;
    function P(x, y) { return { x: ox + x * s, y: oy + y * s }; }

    var bar = barbaFrente(m, slug, medidas), bb = bar.bb;
    var g = '<g transform="translate(' + r1(ox) + ' ' + r1(oy) + ') scale(' + r1(s * 1000) / 1000 + ')">';
    g += cabecaFrente(m, { eixoTopo: -20 });
    g += bar.svg;
    if (bb && bb.bochecha) {
      var Lb = bb.bochecha;
      g += tr(linhaPts([Lb[0], Lb[2]]), OURO, 3.4, 1) + tr(linhaPts([espelho(Lb[0]), espelho(Lb[2])]), OURO, 3.4, 1);
    }
    g += '</g>';

    var xr = Math.min(ox + (f.sw + 78) * s, W - 260), xl = Math.max(ox - (f.sw + 78) * s, 280);
    if (bb && bb.bochecha) {
      var p0 = P(bb.bochecha[0].x, bb.bochecha[0].y);
      g += guia(p0, { x: xr - 16, y: p0.y - 26 }) + ponto(p0);
      g += etiqueta(xr, p0.y - 34, 'LINHA DA', 'BOCHECHA', 'start');
    }
    if (bb && bb.pescocoY) {
      var pw = limitar(0.62 * f.jw, 50, 64), pp = P(pw, bb.pescocoY);
      g += guia(pp, { x: xr - 16, y: pp.y + 34 }) + ponto(pp);
      g += etiqueta(xr, pp.y + 24, 'LINHA DO', 'PESCOÇO', 'start');
    }
    if (bb) {
      var mm = num(medidas.barbaMm, 0), pq = P(-0.3 * f.jw, 0.93 * H);
      g += guia(pq, { x: xl + 16, y: pq.y + 30 }) + ponto(pq);
      g += etiqueta(xl, pq.y + 20, 'COMPRIMENTO', mm ? String(mm).replace('.', ',') + ' mm' : '—', 'end');
    }
    return envolver(W, Ht, 'Desenho da barba: ' + (I.BARBAS[slug] ? I.BARBAS[slug].nome : ''), g);
  }

  /* ===========================================================================
     PERFIL
  =========================================================================== */
  function cabeloPerfil(p, medidas) {
    var H = p.H, dir = medidas.direcao || 'tras';
    var c = I.medidasCabelo(medidas, H);
    var topoT = c.topo * ({ cima: 1.5, tras: 0.85, lado: 0.95, frente: 0.9 }[dir] || 1) + (dir === 'cima' ? 10 : 0);
    var cranio = amostrar(p.nuca.slice(0, 6), false, 22), n = cranio.length;
    var centro = { x: -0.05 * H, y: 0.45 * H };
    function esp(sv) {
      var t;
      if (sv < 0.3) t = topoT * (0.55 + 1.5 * sv);
      else if (sv < 0.55) t = topoT * (1 - (sv - 0.3) / 0.25 * 0.35) + c.lado * ((sv - 0.3) / 0.25) * 0.35;
      else t = topoT * 0.65 * (1 - (sv - 0.55) / 0.45) + c.nuca * ((sv - 0.55) / 0.45);
      if (dir === 'cima' && sv < 0.22) t += topoT * 0.55 * Math.sin(sv / 0.22 * Math.PI);
      if (dir === 'frente' && sv < 0.12) t += 8;
      return t + 1.5;
    }
    var fora = deslocar(cranio, function (q, i) { return esp(i / (n - 1)); }, centro);
    var linhaFrente;
    if (dir === 'frente') {
      var yF = 0.145 * H + c.franja;
      linhaFrente = [{ x: 0.37 * H, y: yF }, { x: 0.33 * H, y: yF - 12 }, { x: 0.3 * H, y: yF - 4 }, { x: 0.24 * H, y: 0.2 * H }];
      fora.unshift({ x: 0.36 * H + 6, y: 0.1 * H }, { x: 0.39 * H, y: yF - 18 }, { x: 0.385 * H, y: yF + 2 });
    } else {
      linhaFrente = [{ x: 0.335 * H, y: 0.145 * H }, { x: 0.25 * H, y: 0.19 * H }];
    }
    var dentro = linhaFrente.concat([
      { x: 0.13 * H, y: 0.36 * H }, { x: 0.07 * H, y: 0.5 * H }, { x: 0.035 * H, y: 0.565 * H, r: 0.3 },
      { x: -0.02 * H, y: 0.53 * H, r: 0.5 }, { x: -0.05 * H, y: 0.43 * H }, { x: -0.14 * H, y: 0.395 * H },
      { x: -0.22 * H, y: 0.45 * H }, { x: -0.25 * H, y: 0.62 * H }, { x: -0.28 * H, y: 0.745 * H - (c.nuca < 6 ? 0.02 * H : 0) }
    ]);
    var massa = fora.concat(amostrar(dentro, false, 10).slice().reverse());
    var d = poligono(massa);

    var id = uid('recPerf');
    var g = '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>';
    g += '<path d="' + d + '" fill="' + OURO + '" fill-opacity="0.06"/>';

    /* a > b devolve o trecho no sentido contrário (nuca → testa) */
    function trecho(a, b, fr) {
      if (a > b) return trecho(b, a, fr).reverse();
      var i0 = Math.round(a * (n - 1)), i1 = Math.round(b * (n - 1));
      return deslocar(cranio.slice(i0, i1 + 1), function (q, i) { return esp((i0 + i) / (n - 1)) * fr; }, centro);
    }
    var mech = '';
    [[0.2, 0.02, 0.62], [0.34, 0.08, 0.86], [0.46, 0.0, 0.5], [0.58, 0.16, 0.95], [0.7, 0.04, 0.74], [0.82, 0.22, 0.9], [0.92, 0.1, 0.58]].forEach(function (cfg) {
      var linha = trecho(cfg[1], cfg[2], cfg[0]);
      if (dir === 'lado') {
        linha = linha.map(function (q, i) { var u = i / (linha.length - 1); return { x: q.x, y: q.y + u * u * 34 * (1 - cfg[0]) }; });
      }
      if (dir === 'frente' && cfg[1] < 0.1) { var q0 = linha[0]; linha.unshift({ x: q0.x + 16, y: q0.y + 24 + cfg[0] * 10 }); }
      mech += tr(linhaPts(linha), OURO, 1.5, 0.5);
    });
    g += '<g clip-path="url(#' + id + ')">' + mech + '</g>';
    g += tr(d, OURO, 3.4, 1);

    /* setas de direção, sobre o cabelo */
    var setas = '';
    function ondulada(linha) { return linha.length > 1 ? linha : null; }
    if (dir === 'tras') {
      setas += seta(trecho(0.06, 0.5, 0.55), CREME, 3.2) + seta(trecho(0.3, 0.72, 0.42), CREME, 3.2);
    } else if (dir === 'frente') {
      setas += seta(trecho(0.5, 0.06, 0.55), CREME, 3.2) + seta(trecho(0.72, 0.3, 0.42), CREME, 3.2);
    } else if (dir === 'lado') {
      var lk = trecho(0.05, 0.62, 0.5).map(function (q, i, a) { var u = i / (a.length - 1); return { x: q.x, y: q.y + u * u * 30 }; });
      setas += seta(lk, CREME, 3.2);
    } else {
      [0.16, 0.3].forEach(function (sv) {
        var i = Math.round(sv * (n - 1)), q = cranio[i], q2 = cranio[i + 1];
        var tx = q2.x - q.x, ty = q2.y - q.y, Lq = Math.hypot(tx, ty) || 1, nx = ty / Lq, ny = -tx / Lq;
        if (nx * (q.x - centro.x) + ny * (q.y - centro.y) < 0) { nx = -nx; ny = -ny; }
        var e0 = esp(sv) * 0.3, e1 = esp(sv) * 1.15 + 6;
        setas += seta([{ x: q.x + nx * e0, y: q.y + ny * e0 }, { x: q.x + nx * (e0 + e1) / 2, y: q.y + ny * (e0 + e1) / 2 }, { x: q.x + nx * e1, y: q.y + ny * e1 }], CREME, 3.2);
      });
    }
    g += setas;

    return { svg: g, topoY: Math.min.apply(null, fora.map(function (q) { return q.y; })), c: c, topoT: topoT, dir: dir };
  }

  function areaBarbaPerfil(p, slug, medidas) {
    var bb = I.BARBAS[slug], H = p.H;
    if (!bb || slug === 'limpo') return null;
    var mm = num(medidas.barbaMm, 0);
    var esp = bb.esp + (mm ? limitar(mm * 0.9, 0, 26) - 3 : 0);
    if (bb.cavanhaque) {
      return [
        { x: 0.39 * H, y: 0.735 * H }, { x: 0.345 * H, y: 0.8 * H, r: 0.4 }, { x: 0.37 * H, y: 0.87 * H },
        { x: 0.385 * H + esp * 0.5, y: 0.95 * H }, { x: 0.32 * H, y: H + esp * 0.4 }, { x: 0.26 * H, y: 0.93 * H },
        { x: 0.32 * H, y: 0.8 * H }, { x: 0.35 * H, y: 0.74 * H }
      ];
    }
    return [
      { x: 0.035 * H, y: bb.yExt * H + 4 }, { x: 0.22 * H, y: bb.yInt * H + 2 }, { x: 0.3 * H, y: 0.735 * H },
      { x: 0.392 * H, y: 0.738 * H, r: 0.5 }, { x: 0.345 * H, y: 0.805 * H, r: 0.3 }, { x: 0.372 * H, y: 0.868 * H, r: 0.6 },
      { x: 0.39 * H + esp * 0.55, y: 0.955 * H }, { x: 0.33 * H + esp * 0.2, y: H + esp * 0.45 },
      { x: 0.19 * H, y: H + bb.pescoco * 0.55 }, { x: 0.04 * H, y: 0.9 * H },
      { x: -0.045 * H, y: 0.78 * H }, { x: -0.04 * H, y: 0.6 * H }
    ];
  }

  /* cabeça de perfil, "nua": contorno, olho, sobrancelha, orelha */
  function cabecaPerfil(p) {
    var H = p.H, g = '';
    /* ombros, apagando */
    var nb = p.nuca[p.nuca.length - 1], fb = p.face[p.face.length - 1];
    g += tracoFade(amostrar([nb, { x: -0.5 * H, y: H + 84 }, { x: -0.64 * H, y: H + 120 }, { x: -0.72 * H, y: H + 170 }], false, 8), CREME, 2.4, 0.9);
    g += tracoFade(amostrar([fb, { x: 0.3 * H, y: H + 86 }, { x: 0.5 * H, y: H + 112 }, { x: 0.62 * H, y: H + 168 }], false, 8), CREME, 2.4, 0.9);

    g += tr(caminho(p.face, false), CREME, 3.2, 1);
    g += tr(caminho(p.nuca, false), CREME, 3.2, 1);
    g += tr(caminho(p.mandibula, false), CREME, 1.6, 0.4);

    /* olho, sobrancelha, narina, lábios */
    g += tr('M' + r1(0.285 * H) + ' ' + r1(0.487 * H) + ' C' + r1(0.31 * H) + ' ' + r1(0.468 * H) + ' ' + r1(0.34 * H) + ' ' + r1(0.47 * H) + ' ' + r1(0.355 * H) + ' ' + r1(0.485 * H), CREME, 2.4, 0.95);
    g += tr('M' + r1(0.29 * H) + ' ' + r1(0.492 * H) + ' C' + r1(0.31 * H) + ' ' + r1(0.502 * H) + ' ' + r1(0.335 * H) + ' ' + r1(0.502 * H) + ' ' + r1(0.35 * H) + ' ' + r1(0.487 * H), CREME, 1.5, 0.5);
    g += '<circle cx="' + r1(0.334 * H) + '" cy="' + r1(0.488 * H) + '" r="4.4" fill="none" stroke="' + CREME + '" stroke-width="1.8" stroke-opacity="0.85"/>';
    g += tr('M' + r1(0.27 * H) + ' ' + r1(0.435 * H) + ' C' + r1(0.31 * H) + ' ' + r1(0.41 * H) + ' ' + r1(0.35 * H) + ' ' + r1(0.412 * H) + ' ' + r1(0.372 * H) + ' ' + r1(0.428 * H), CREME, 3.6, 0.9);
    g += tr('M' + r1(0.405 * H) + ' ' + r1(0.692 * H) + ' C' + r1(0.39 * H) + ' ' + r1(0.68 * H) + ' ' + r1(0.37 * H) + ' ' + r1(0.69 * H) + ' ' + r1(0.375 * H) + ' ' + r1(0.705 * H), CREME, 1.8, 0.75);
    g += tr('M' + r1(0.382 * H) + ' ' + r1(0.81 * H) + ' L' + r1(0.345 * H) + ' ' + r1(0.815 * H), CREME, 1.9, 0.8);

    /* orelha */
    var ox = -0.12 * H, oyt = 0.43 * H, oyb = 0.715 * H;
    g += tr('M' + r1(ox + 22) + ' ' + r1(oyt + 6) + ' C' + r1(ox + 4) + ' ' + r1(oyt - 14) + ' ' + r1(ox - 28) + ' ' + r1(oyt) + ' ' + r1(ox - 26) + ' ' + r1(oyt + 40) +
            ' C' + r1(ox - 24) + ' ' + r1(oyb - 30) + ' ' + r1(ox - 8) + ' ' + r1(oyb + 4) + ' ' + r1(ox + 12) + ' ' + r1(oyb - 6) +
            ' C' + r1(ox + 20) + ' ' + r1(oyb - 20) + ' ' + r1(ox + 16) + ' ' + r1(oyt + 40) + ' ' + r1(ox + 22) + ' ' + r1(oyt + 6), CREME, 2.2, 0.9);
    g += tr('M' + r1(ox + 8) + ' ' + r1(oyt + 12) + ' C' + r1(ox - 14) + ' ' + r1(oyt + 4) + ' ' + r1(ox - 18) + ' ' + r1(oyt + 44) + ' ' + r1(ox - 6) + ' ' + r1(oyb - 26), CREME, 1.5, 0.45);
    return g;
  }

  var ROTULO_DIR = { tras: ['PARA TRÁS'], lado: ['LATERAL', 'COM RISCA'], frente: ['PARA A', 'FRENTE'], cima: ['PARA CIMA'] };

  function medidasPerfil(medidas, rostoSlug, barbaSlug) {
    medidas = medidas || {};
    var p = I.modeloPerfil(rostoSlug || 'oval'), H = p.H;
    var dir = ROTULO_DIR[medidas.direcao] ? medidas.direcao : 'tras';
    var med = {}; for (var k in medidas) med[k] = medidas[k]; med.direcao = dir;
    var W = 900, Ht = 620, ox = 430;
    var hair = cabeloPerfil(p, med);
    var yMin = hair.topoY - 40, yMax = H + 96;
    var s = (Ht - 90) / (yMax - yMin), oy = 46 - yMin * s;
    function P(x, y) { return { x: ox + x * s, y: oy + y * s }; }

    var g = '<g transform="translate(' + r1(ox) + ' ' + r1(oy) + ') scale(' + r1(s * 1000) / 1000 + ')">';
    g += cabecaPerfil(p);
    var area = areaBarbaPerfil(p, barbaSlug || 'limpo', med);
    if (area) g += '<path d="' + caminho(area, true) + '" fill="' + OURO + '" fill-opacity="0.09" stroke="' + OURO + '" stroke-width="2.8" stroke-dasharray="9 6" stroke-linejoin="round"/>';
    g += hair.svg + '</g>';

    /* NUCA */
    var pn = P(-0.3 * H - hair.c.nuca - 4 + 2, 0.72 * H);
    g += guia(pn, { x: P(-0.6 * H, 0).x + 16, y: pn.y + 40 }) + ponto(pn);
    g += etiqueta(P(-0.6 * H, 0).x, pn.y + 30, 'NUCA', cm(medidas.nuca), 'end');

    /* DIREÇÃO */
    /* à direita do rosto, fora do cabelo; o texto longo quebra em duas linhas */
    g += etiqueta(Math.min(P(0.5 * H, 0).x + 24, W - 250), P(0, hair.topoY).y + 30, 'DIREÇÃO', ROTULO_DIR[dir], 'start', 38);

    return envolver(W, Ht, 'Direção do fio, vista de perfil', g);
  }

  return {
    formatoRosto: formatoRosto,
    proporcaoRosto: proporcaoRosto,
    medidasFrontal: medidasFrontal,
    medidasPerfil: medidasPerfil,
    desenhoBarba: desenhoBarba
  };
});
