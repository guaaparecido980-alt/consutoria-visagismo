/* =============================================================================
   DOSSIÊ DE VISAGISMO — DIAGRAMAS VETORIAIS
   -----------------------------------------------------------------------------
   Todos os desenhos técnicos do dossiê são gerados em SVG aqui, a partir dos
   dados do cliente. Duas consequências práticas:

     1. o diagrama nunca sai borrado no PDF, em nenhum tamanho;
     2. as medidas do corte aparecem escritas no desenho — o que se anotava à
        mão vira parte do documento.

   ---------------------------------------------------------------------------
   PROPORÇÃO DA CABEÇA
   O traçado NÃO é livre: segue o cânone clássico do desenho de retrato, porque
   um rosto fora de proporção num documento entregue ao cliente estraga a
   percepção do trabalho inteiro.

     altura da cabeça  H = 222 (do alto do crânio, y=20, ao mento, y=242)
     largura máxima    ≈ 0,65 H, na altura do osso zigomático
     linha dos olhos   na METADE da altura total ....... y = 131
     base do nariz     a ~72% da altura ................ y = 173
     linha da boca     a ~82% da altura ................ y = 201
     orelhas           da linha dos olhos à base do nariz
     olhos             cinco larguras de olho cabem na face ("regra dos 5 olhos")

   Espaço de desenho: x de 0 a 200, y de 0 a 256.
============================================================================= */
(function (raiz, fabrica) {
  var api = fabrica();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { raiz.DossieDiagramas = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var TRACO = '#5d574e';   /* contorno da cabeça           */
  var SUAVE = '#8d8579';   /* traços internos, mais leves  */
  var MARCA = '#a08c5c';   /* dourado da marca             */
  var COTA  = '#b8452f';   /* setas e cotas de medida      */
  var FLUXO = '#3f6f5a';   /* setas de direção do fio      */

  /* Folga lateral para os rótulos das cotas caberem FORA da cabeça. */
  var CAIXA_COTAS = '-78 -20 356 326';
  var CAIXA_LIMPA = '-12 -8 224 272';

  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function svg(viewBox, rotulo, conteudo) {
    return '<svg viewBox="' + viewBox + '" role="img" aria-label="' + esc(rotulo) + '">' +
           conteudo + '</svg>';
  }
  function traco(d, cor, larg) {
    return '<path d="' + d + '" fill="none" stroke="' + (cor || TRACO) +
           '" stroke-width="' + (larg || 1.7) + '" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  /* ---------------------------------------------------------------------------
     SILHUETA FRONTAL
     Um contorno só, contínuo: crânio → têmpora → maçã do rosto → mandíbula →
     mento. É a linha que dá a impressão de rosto; as feições internas entram
     apenas o suficiente para orientar a leitura, sem virar caricatura.
  --------------------------------------------------------------------------- */
  function silhuetaFrontal() {
    var g = '';

    /* Contorno. Largura máxima 0,68 da altura — mais estreito lê como ovo, não
       como cabeça de homem.

       O detalhe que conserta o "queixo em bico": no mento (100,234) as duas
       curvas TÊM de chegar com tangente horizontal, e para isso o último ponto
       de controle de cada lado fica na MESMA altura do mento (…,234). Com o
       controle mais alto, as curvas se encontram em ângulo e formam um bico —
       era exatamente o que dava o ar de desenho amador. */
    g += traco('M100 20 C140 20 170 46 175 92 ' +
               'C178 118 173 142 165 162 ' +
               'C157 196 132 234 100 234 ' +
               'C68 234 43 196 35 162 ' +
               'C27 142 22 118 25 92 ' +
               'C30 46 60 20 100 20 Z', TRACO, 1.8);

    /* Orelhas — da linha dos olhos à base do nariz. Os dois extremos pousam
       SOBRE o contorno (x≈174 na altura dos olhos, x≈161 na base do nariz);
       fora disso ficam duas alças flutuando ao lado da cabeça. */
    g += traco('M174 129 C188 125 192 143 187 159 C184 171 172 181 162 176', SUAVE, 1.4);
    g += traco('M175 137 C182 136 184 145 181 153', SUAVE, 1.1);
    g += traco('M26 129 C12 125 8 143 13 159 C16 171 28 181 38 176', SUAVE, 1.4);
    g += traco('M25 137 C18 136 16 145 19 153', SUAVE, 1.1);

    /* sobrancelhas */
    g += traco('M57 119 C69 109 84 109 92 117', SUAVE, 1.5);
    g += traco('M143 119 C131 109 116 109 108 117', SUAVE, 1.5);

    /* olhos — regra dos cinco olhos */
    g += traco('M58 131 C66 122 80 122 88 131 C80 139 66 139 58 131 Z', SUAVE, 1.3);
    g += traco('M142 131 C134 122 120 122 112 131 C120 139 134 139 142 131 Z', SUAVE, 1.3);
    g += '<circle cx="73" cy="131" r="3" fill="' + SUAVE + '"/>';
    g += '<circle cx="127" cy="131" r="3" fill="' + SUAVE + '"/>';

    /* Nariz: sombra do dorso, ponta e as duas asas. Um traço só, descendo e
       virando, lia como gancho — é a base que faz o nariz parecer nariz. */
    g += traco('M98 139 C97 156 96 166 94 172 C97 177 103 177 106 172', SUAVE, 1.4);
    g += traco('M89 175 C91 180 96 182 101 180', SUAVE, 1.2);
    g += traco('M111 175 C109 180 104 182 99 180', SUAVE, 1.2);

    /* pescoço — sem ele a "linha do pescoço" da barba fica boiando no vazio */
    g += traco('M74 224 C72 236 71 246 71 262', SUAVE, 1.5);
    g += traco('M126 224 C128 236 129 246 129 262', SUAVE, 1.5);

    /* boca — arco do lábio superior e a sombra do inferior */
    g += traco('M76 200 C85 195 93 198 100 198 C107 198 115 195 124 200', SUAVE, 1.5);
    g += traco('M80 205 C90 212 110 212 120 205', SUAVE, 1.2);

    return g;
  }

  /* ---------------------------------------------------------------------------
     SILHUETA DE PERFIL, voltada para a direita.
     Dois traços: o contorno do crânio/nuca e o contorno da face, com a
     sequência que faz um perfil parecer humano — testa, arco da sobrancelha,
     depressão da raiz do nariz, dorso, filtro, lábios, sulco e mento.
  --------------------------------------------------------------------------- */
  function silhuetaPerfil() {
    var g = '';

    /* Crânio, nuca e pescoço. A largura do perfil (nuca até a ponta do nariz)
       é ~0,8 da altura da cabeça — bem mais que a vista frontal. Estreito
       demais, o desenho vira um balão com um rostinho colado na frente. */
    g += traco('M108 22 C62 24 22 66 20 118 ' +
               'C19 150 30 172 42 188 L42 262', TRACO, 1.8);

    /* Face: testa → arco da sobrancelha → raiz e dorso do nariz → base →
       filtro → lábios → sulco → mento → mandíbula → pescoço. */
    g += traco('M108 22 C150 26 176 58 178 98 ' +   /* testa            */
               'L176 112 ' +                         /* raiz do nariz    */
               'C183 126 194 152 192 164 ' +         /* dorso e ponta    */
               'C190 174 178 173 170 170 ' +         /* base do nariz    */
               'C174 179 168 186 164 188 ' +         /* filtro           */
               'C172 194 170 204 160 209 ' +         /* lábios           */
               'C169 220 163 234 147 241 ' +         /* sulco e mento    */
               'C127 250 100 252 84 249 L84 262', TRACO, 1.8);

    /* Orelha — topo na linha da sobrancelha, base na do nariz, atrás da
       vertical da mandíbula. É essa posição que impede o desenho de virar um
       ovo boiando no meio da bochecha. */
    g += traco('M94 120 C77 116 66 133 71 153 C76 172 91 180 100 174', SUAVE, 1.4);
    g += traco('M93 132 C83 132 79 144 82 156', SUAVE, 1.1);

    /* Sobrancelha e olho, encostados na frente do rosto. */
    g += traco('M154 116 C164 110 174 111 179 117', SUAVE, 1.5);
    g += traco('M156 128 C162 123 172 124 176 130 C170 134 160 133 156 128 Z', SUAVE, 1.3);
    g += '<circle cx="167" cy="129" r="2.6" fill="' + SUAVE + '"/>';

    return g;
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
           '" stroke="' + (cor || SUAVE) + '" stroke-width="0.9" opacity="0.8"/>';
  }
  function cm(valor) {
    if (valor === '' || valor == null) return '—';
    return String(valor).replace('.', ',') + ' cm';
  }

  /* ---------------------------------------------------------------------------
     DIAGRAMA 1 — FORMATO DE ROSTO
  --------------------------------------------------------------------------- */
  function formatoRosto(rosto) {
    var forma = '';
    if (rosto && rosto.poligono) {
      forma = '<polygon points="' + rosto.poligono + '" fill="' + MARCA +
              '" fill-opacity="0.08" stroke="' + MARCA +
              '" stroke-width="2.3" stroke-linejoin="round"/>';
    } else if (rosto && rosto.elipse) {
      var e = rosto.elipse;
      forma = '<ellipse cx="' + e.cx + '" cy="' + e.cy + '" rx="' + e.rx + '" ry="' + e.ry +
              '" fill="' + MARCA + '" fill-opacity="0.08" stroke="' + MARCA + '" stroke-width="2.3"/>';
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

    g += '<rect x="20" y="30" width="160" height="112" fill="none" stroke="' + COTA +
         '" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>';

    /* setas do topo */
    var topo = [[70, 58], [85, 46], [100, 42], [115, 46], [130, 58]];
    for (var i = 0; i < topo.length; i++) {
      g += seta(topo[i][0], topo[i][1], topo[i][0], 32, COTA);
    }
    g += seta(62, 62, 40, 34, COTA);
    g += seta(138, 62, 160, 34, COTA);

    /* setas laterais */
    var lados = [[35, 92], [28, 116], [32, 140]];
    for (var j = 0; j < lados.length; j++) {
      g += seta(lados[j][0], lados[j][1], 20, lados[j][1], COTA);
      g += seta(200 - lados[j][0], lados[j][1], 180, lados[j][1], COTA);
    }

    /* cotas */
    g += guia(100, 30, 100, 2, COTA);
    g += rotulo(100, -4, 'TOPO', COTA, 'middle', 11, 600);
    g += rotulo(100, 10, cm(medidas.topo), COTA, 'middle', 12);

    g += guia(20, 116, -10, 116, COTA);
    g += rotulo(-14, 112, 'LATERAL', COTA, 'end', 11, 600);
    g += rotulo(-14, 126, cm(medidas.lateral), COTA, 'end', 12);
    g += guia(180, 116, 210, 116, COTA);
    g += rotulo(214, 112, 'LATERAL', COTA, 'start', 11, 600);
    g += rotulo(214, 126, cm(medidas.lateral), COTA, 'start', 12);

    g += seta(100, 66, 100, 96, FLUXO);
    g += guia(100, 96, 210, 170, FLUXO);
    g += rotulo(214, 166, 'FRENTE', FLUXO, 'start', 11, 600);
    g += rotulo(214, 180, cm(medidas.franja), FLUXO, 'start', 12);

    return svg(CAIXA_COTAS, 'Diagrama de medidas do fio, vista frontal',
      silhuetaFrontal() + g +
      rotulo(100, 292, 'MEDIDA DO FIO', COTA, 'middle', 11, 600));
  }

  /* ---------------------------------------------------------------------------
     DIAGRAMA 3 — DIREÇÃO E PROJEÇÃO (vista de perfil)
  --------------------------------------------------------------------------- */
  var DIRECOES = {
    tras:   { rotulo: 'Para trás',         ang: -8   },
    lado:   { rotulo: 'Lateral com risca', ang: -48  },
    frente: { rotulo: 'Para a frente',     ang: -160 },
    cima:   { rotulo: 'Para cima',         ang: -90  }
  };

  function medidasPerfil(medidas) {
    medidas = medidas || {};
    var dir = DIRECOES[medidas.direcao] || DIRECOES.tras;
    var rad = dir.ang * Math.PI / 180;
    var g = '';

    g += '<rect x="24" y="20" width="164" height="112" fill="none" stroke="' + COTA +
         '" stroke-width="1" stroke-dasharray="4 3" opacity="0.65"/>';

    /* linhas de secção */
    g += guia(28, 80, 178, 80, SUAVE);
    g += guia(22, 112, 177, 112, SUAVE);

    /* direção do fio, sobre a calota */
    var pontos = [[64, 74], [86, 44], [112, 28], [140, 28], [166, 52]];
    for (var i = 0; i < pontos.length; i++) {
      var x = pontos[i][0], y = pontos[i][1];
      g += seta(x, y, x + Math.cos(rad) * 24, y + Math.sin(rad) * 24, FLUXO);
    }
    g += guia(112, 26, 112, 8, FLUXO);
    g += rotulo(112, -8, 'DIREÇÃO DOS FIOS', FLUXO, 'middle', 11, 600);
    g += rotulo(112, 6, dir.rotulo.toUpperCase(), FLUXO, 'middle', 11);

    /* nuca */
    g += seta(32, 176, 14, 176, COTA);
    g += guia(14, 176, -10, 176, COTA);
    g += rotulo(-14, 172, 'NUCA', COTA, 'end', 11, 600);
    g += rotulo(-14, 186, cm(medidas.nuca), COTA, 'end', 12);

    /* Projeção do mento: linha vertical tangente ao ponto mais avançado do
       queixo. É assim que se lê projeção num desenho técnico — a diagonal
       anterior cruzava o rosto e parecia parte da face. */
    g += '<line x1="168" y1="150" x2="168" y2="268" stroke="' + SUAVE +
         '" stroke-width="1" stroke-dasharray="4 3"/>';
    g += guia(168, 258, 208, 258, SUAVE);
    g += rotulo(212, 255, 'PROJEÇÃO', SUAVE, 'start', 10.5, 600);
    g += rotulo(212, 268, 'DO MENTO', SUAVE, 'start', 10.5, 600);

    return svg(CAIXA_COTAS, 'Diagrama de direção e projeção do fio, vista de perfil',
      silhuetaPerfil() + g +
      rotulo(100, 292, 'DIREÇÃO E PROJEÇÃO', COTA, 'middle', 11, 600));
  }

  /* ---------------------------------------------------------------------------
     DIAGRAMA 4 — DESENHO DA BARBA
     As áreas acompanham o contorno da silhueta, e as linhas de bochecha e
     pescoço marcam onde o contorno é feito na navalha.
  --------------------------------------------------------------------------- */
  /* As áreas seguem o contorno real do rosto e começam ABAIXO da base do
     nariz (y=173). Antes disso a linha da bochecha subia acima da linha dos
     olhos (y=131) e a barba cobria os olhos do cliente — o erro mais visível
     que este diagrama podia ter. */
  var BARBAS = {
    'limpo': {
      nome: 'Rosto limpo', area: null, bochecha: null, pescoco: null
    },
    'cavanhaque': {
      nome: 'Cavanhaque',
      area: 'M82 192 C90 187 110 187 118 192 C122 204 118 224 108 232 ' +
            'C104 235 96 235 92 232 C82 224 78 204 82 192 Z',
      bochecha: null, pescoco: null
    },
    'curta-reta': {
      nome: 'Barba curta com linha reta',
      area: 'M32 164 L168 164 C166 186 152 214 100 234 C48 214 34 186 32 164 Z',
      bochecha: 'M32 164 H168', pescoco: 'M71 250 H129'
    },
    'curta-diagonal': {
      nome: 'Barba curta com linha diagonal',
      area: 'M32 172 L168 152 C166 180 152 212 100 234 C48 212 34 188 32 172 Z',
      bochecha: 'M32 172 L168 152', pescoco: 'M71 250 L129 244'
    },
    'media-contorno': {
      nome: 'Barba média com contorno definido',
      area: 'M32 157 L168 157 C167 184 154 220 100 242 C46 220 33 184 32 157 Z',
      bochecha: 'M32 157 H168', pescoco: 'M71 254 H129'
    },
    'cheia': {
      nome: 'Barba cheia',
      area: 'M31 150 L169 150 C168 188 156 228 100 254 C44 228 32 188 31 150 Z',
      bochecha: 'M31 150 H169', pescoco: 'M71 262 H129'
    }
  };

  function desenhoBarba(barbaSlug) {
    var b = BARBAS[barbaSlug] || BARBAS['curta-reta'];
    var g = '';
    if (b.area) {
      g += '<path d="' + b.area + '" fill="' + MARCA + '" opacity="0.24"/>';
      g += traco(b.area, MARCA, 1.8);
    }
    if (b.bochecha) {
      g += '<path d="' + b.bochecha + '" fill="none" stroke="' + COTA +
           '" stroke-width="1.6" stroke-dasharray="5 3"/>';
      g += guia(32, 160, -10, 146, COTA);
      g += rotulo(-14, 142, 'LINHA DA', COTA, 'end', 10.5, 600);
      g += rotulo(-14, 155, 'BOCHECHA', COTA, 'end', 10.5, 600);
    }
    if (b.pescoco) {
      g += '<path d="' + b.pescoco + '" fill="none" stroke="' + COTA +
           '" stroke-width="1.6" stroke-dasharray="5 3"/>';
      g += guia(129, 250, 210, 250, COTA);
      g += rotulo(214, 247, 'LINHA DO', COTA, 'start', 10.5, 600);
      g += rotulo(214, 260, 'PESCOÇO', COTA, 'start', 10.5, 600);
    }
    return svg(CAIXA_COTAS, 'Diagrama do desenho da barba',
      silhuetaFrontal() + g +
      rotulo(100, 292, b.nome.toUpperCase(), MARCA, 'middle', 11, 600));
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
