// Grafos estilo JFLAP del PDT (3.1) y del AF de elementos LR(0) (3.2),
// con el recorrido de cada entrada resaltado paso a paso.

var Grafos = (function () {
  var NS = 'http://www.w3.org/2000/svg';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // Construye un SVG a partir de nodos y aristas con posiciones fijas.
  function Lienzo(viewBox, R) {
    var partes = [], nodos = {};
    function recortar(a, b) {
      var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
      return [[a[0] + dx * R / d, a[1] + dy * R / d], [b[0] - dx * R / d, b[1] - dy * R / d]];
    }
    function f(n) { return n.toFixed(1); }
    return {
      nodo: function (id, x, y, opciones) { nodos[id] = { x: x, y: y, o: opciones || {} }; },
      recta: function (de, a, id) {
        var p = recortar([nodos[de].x, nodos[de].y], [nodos[a].x, nodos[a].y]);
        partes.push('<path id="' + id + '" class="arista" marker-end="url(#flecha)" d="M' + f(p[0][0]) + ',' + f(p[0][1]) + ' L' + f(p[1][0]) + ',' + f(p[1][1]) + '"/>');
      },
      curva: function (de, a, curvatura, id) {
        var A = [nodos[de].x, nodos[de].y], B = [nodos[a].x, nodos[a].y];
        var dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
        var c = [(A[0] + B[0]) / 2 - dy / d * curvatura, (A[1] + B[1]) / 2 + dx / d * curvatura];
        var p = recortar(A, c)[0], q = recortar(c, B)[1];
        partes.push('<path id="' + id + '" class="arista" marker-end="url(#flecha)" d="M' + f(p[0]) + ',' + f(p[1]) + ' Q' + f(c[0]) + ',' + f(c[1]) + ' ' + f(q[0]) + ',' + f(q[1]) + '"/>');
      },
      bucle: function (nodo, grados, id) {
        var n = nodos[nodo], a = grados * Math.PI / 180, ab = 0.45, r = 70;
        var p1 = [n.x + R * Math.cos(a - ab), n.y + R * Math.sin(a - ab)], p2 = [n.x + R * Math.cos(a + ab), n.y + R * Math.sin(a + ab)];
        var c1 = [n.x + r * Math.cos(a - 0.5), n.y + r * Math.sin(a - 0.5)], c2 = [n.x + r * Math.cos(a + 0.5), n.y + r * Math.sin(a + 0.5)];
        partes.push('<path id="' + id + '" class="arista" marker-end="url(#flecha)" d="M' + f(p1[0]) + ',' + f(p1[1]) + ' C' + f(c1[0]) + ',' + f(c1[1]) + ' ' + f(c2[0]) + ',' + f(c2[1]) + ' ' + f(p2[0]) + ',' + f(p2[1]) + '"/>');
      },
      // líneas de texto; un segmento "|Print x" se resalta como en JFLAP
      etiqueta: function (x, y, anclaje, lineas, id, clase) {
        var t = '<g id="' + id + '" class="' + (clase || 'etiqueta') + '">';
        lineas.forEach(function (ln, i) {
          var p = clase === 'items' ? [ln] : ln.split('|');
          t += '<text x="' + x + '" y="' + (y + i * 15) + '" text-anchor="' + anclaje + '">' + esc(p[0]) +
            (p[1] ? '<tspan class="print">' + esc(p[1]) + '</tspan>' : '') + '</text>';
        });
        partes.push(t + '</g>');
      },
      svg: function () {
        var estados = '';
        Object.keys(nodos).forEach(function (id) {
          var n = nodos[id];
          estados += '<g id="n-' + id + '" class="nodo' + (n.o.final ? ' final' : '') + '">' +
            '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + R + '"/>' +
            (n.o.final ? '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + (R - 5) + '"/>' : '') +
            '<text x="' + n.x + '" y="' + (n.y + 5) + '" text-anchor="middle">' + esc(n.o.nombre || id) + '</text></g>';
          if (n.o.inicial) {
            estados += '<path class="arista" marker-end="url(#flecha)" d="M' + (n.x - R - 46) + ',' + n.y + ' L' + (n.x - R) + ',' + n.y + '"/>';
          }
        });
        return '<svg xmlns="' + NS + '" viewBox="' + viewBox + '" class="grafo">' +
          '<defs><marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">' +
          '<path d="M0,0 L10,5 L0,10 z"/></marker></defs>' + partes.join('') + estados + '</svg>';
      }
    };
  }

  // ---------- PDT del problema 3.1 ----------

  function dibujarPDT() {
    var L = Lienzo('0 -20 1040 910', 24);
    var pos = { q0: [110, 430], q3: [590, 430], q6: [960, 430], q7: [345, 80], q1: [345, 240],
      q2: [345, 620], q8: [345, 780], q5: [830, 190], q4: [830, 670] };
    Object.keys(pos).forEach(function (q) {
      L.nodo(q, pos[q][0], pos[q][1], { final: q === 'q6', inicial: q === 'q0' });
    });
    function arista(tipo, de, a, extra, x, y, anclaje, lineas) {
      var id = de + '-' + a;
      if (tipo === 'bucle') L.bucle(de, extra, 'e-' + id);
      else if (tipo === 'curva') L.curva(de, a, extra, 'e-' + id);
      else L.recta(de, a, 'e-' + id);
      L.etiqueta(x, y, anclaje, lineas, 'l-' + id);
    }
    arista('bucle', 'q0', 'q0', 235, 52, 352, 'middle', ['[ , λ ; [']);
    arista('curva', 'q0', 'q3', -40, 350, 398, 'middle', ['letra , λ ; λ  |Print letra']);
    arista('curva', 'q3', 'q0', -40, 420, 482, 'middle', ['o , Z ; oZ', 'o , [ ; o[', 'h , l ; hl']);
    arista('recta', 'q3', 'q1', 0, 470, 360, 'middle', ['* , h ; λ  |Print h']);
    arista('recta', 'q1', 'q0', 0, 285, 310, 'start', ['λ , l ; *l', 'λ , [ ; *[', 'λ , Z ; *Z']);
    arista('bucle', 'q1', 'q1', 270, 345, 160, 'middle', ['λ , h ; λ', '|Print h']);
    arista('recta', 'q3', 'q7', 0, 478, 200, 'start', ['/ , h ; λ', '|Print h']);
    arista('recta', 'q7', 'q0', 0, 200, 200, 'end', ['λ , l ; /l', 'λ , [ ; /[', 'λ , Z ; /Z']);
    arista('bucle', 'q7', 'q7', 270, 345, 0, 'middle', ['λ , h ; λ  |Print h']);
    arista('recta', 'q3', 'q2', 0, 465, 548, 'start', ['+ , o ; λ  |Print o']);
    arista('recta', 'q2', 'q0', 0, 285, 528, 'start', ['λ , [ ; +[', 'λ , Z ; +Z']);
    arista('bucle', 'q2', 'q2', 90, 345, 712, 'middle', ['λ , o ; λ', '|Print o']);
    arista('recta', 'q3', 'q8', 0, 478, 668, 'start', ['− , o ; λ', '|Print o']);
    arista('recta', 'q8', 'q0', 0, 200, 668, 'end', ['λ , [ ; −[', 'λ , Z ; −Z']);
    arista('bucle', 'q8', 'q8', 90, 345, 872, 'middle', ['λ , o ; λ  |Print o']);
    arista('bucle', 'q3', 'q3', 270, 590, 345, 'middle', ['] , [ ; λ']);
    arista('curva', 'q3', 'q5', -25, 682, 292, 'end', ['] , o ; λ  |Print o']);
    arista('curva', 'q5', 'q3', -25, 745, 330, 'start', ['λ , [ ; λ']);
    arista('bucle', 'q5', 'q5', 270, 830, 110, 'middle', ['λ , o ; λ  |Print o']);
    arista('recta', 'q3', 'q6', 0, 775, 420, 'middle', ['⌂ , Z ; λ']);
    arista('recta', 'q3', 'q4', 0, 745, 600, 'end', ['⌂ , o ; λ  |Print o']);
    arista('bucle', 'q4', 'q4', 90, 830, 762, 'middle', ['λ , o ; λ  |Print o']);
    arista('recta', 'q4', 'q6', 0, 905, 570, 'start', ['λ , Z ; λ']);
    return L.svg();
  }

  // ---------- AF de elementos LR(0) del problema 3.2 ----------

  var ITEMS = {
    0: ["S' → ·S", 'S → ·SS+ | ·SS− | ·SS* | ·SS/', 'S → ·a'],
    1: ["S' → S·", 'S → S·S+ | S·S− | S·S* | S·S/', 'S → ·SS+ | ·SS− | ·SS* | ·SS/', 'S → ·a'],
    2: ['S → a·'],
    3: ['S → SS·+ | SS·− | SS·* | SS·/', 'S → S·S+ | S·S− | S·S* | S·S/', 'S → ·SS+ | ·SS− | ·SS* | ·SS/', 'S → ·a'],
    4: ['S → SS*·'], 5: ['S → SS+·'], 6: ['S → SS−·'], 7: ['S → SS/·']
  };

  function dibujarLR() {
    var L = Lienzo('0 0 1080 480', 22);
    var pos = { 0: [130, 160], 1: [385, 160], 3: [640, 160], 2: [510, 400], 4: [900, 60], 5: [900, 150], 6: [900, 240], 7: [900, 330] };
    Object.keys(pos).forEach(function (s) {
      L.nodo(s, pos[s][0], pos[s][1], { nombre: 'q' + s, inicial: s === '0', final: s !== '0' && s !== '3' });
    });
    // elementos de cada estado (como el paso 3 de JFLAP)
    [0, 1, 3].forEach(function (s) {
      L.etiqueta(pos[s][0], pos[s][1] - 34 - (ITEMS[s].length - 1) * 15, 'middle', ITEMS[s], 'i-' + s, 'items');
    });
    L.etiqueta(pos[2][0], pos[2][1] + 44, 'middle', ITEMS[2], 'i-2', 'items');
    [4, 5, 6, 7].forEach(function (s) { L.etiqueta(pos[s][0] + 32, pos[s][1] + 4, 'start', ITEMS[s], 'i-' + s, 'items'); });

    function arista(tipo, de, a, extra, x, y, lineas, anclaje) {
      var id = de + '-' + a;
      if (tipo === 'bucle') L.bucle(de, extra, 'e-' + id);
      else L.recta(de, a, 'e-' + id);
      L.etiqueta(x, y, anclaje || 'middle', lineas, 'l-' + id);
    }
    arista('recta', '0', '1', 0, 258, 152, ['S']);
    arista('recta', '1', '3', 0, 512, 152, ['S']);
    arista('bucle', '3', '3', 60, 702, 245, ['S']);
    arista('recta', '0', '2', 0, 300, 290, ['a']);
    arista('recta', '1', '2', 0, 435, 290, ['a']);
    arista('recta', '3', '2', 0, 590, 290, ['a']);
    arista('recta', '3', '4', 0, 770, 100, ['*']);
    arista('recta', '3', '5', 0, 770, 145, ['+']);
    arista('recta', '3', '6', 0, 770, 190, ['−']);
    arista('recta', '3', '7', 0, 770, 238, ['/']);
    return L.svg();
  }

  // ---------- Resaltado del recorrido ----------

  function limpiar(svg) {
    svg.querySelectorAll('.actual, .recorrido, .rechazo, .en-pila').forEach(function (el) {
      el.classList.remove('actual', 'recorrido', 'rechazo', 'en-pila');
    });
  }
  function marcar(svg, id, clase) {
    var el = svg.querySelector('#' + id);
    if (el) el.classList.add(clase);
  }
  function marcarArista(svg, de, a, clase) {
    marcar(svg, 'e-' + de + '-' + a, clase);
    marcar(svg, 'l-' + de + '-' + a, clase);
  }

  // k = 0: configuración inicial; k = i: después de aplicar el paso i de la traza.
  function resaltarPDT(svg, traza, k) {
    limpiar(svg);
    for (var i = 0; i < k - 1; i++) {
      if (traza[i].nuevo !== 9) marcarArista(svg, 'q' + traza[i].estado, 'q' + traza[i].nuevo, 'recorrido');
    }
    if (k === 0) { marcar(svg, 'n-q0', 'actual'); return; }
    var p = traza[k - 1];
    if (p.nuevo === 9) {
      marcar(svg, 'n-q' + p.estado, 'rechazo');
    } else {
      marcarArista(svg, 'q' + p.estado, 'q' + p.nuevo, 'actual');
      marcar(svg, 'n-q' + p.nuevo, 'actual');
    }
  }

  // Configuración de la fila k (1..n) de la traza LR: estado del tope y acción a aplicar.
  function resaltarLR(svg, traza, k) {
    limpiar(svg);
    var p = traza[k - 1];
    var pila = p.analisis.split(' ');
    var estados = pila.filter(function (_, i) { return i % 2 === 0; });
    estados.forEach(function (s) { marcar(svg, 'n-' + s, 'en-pila'); });
    for (var i = 1; i < estados.length; i++) marcarArista(svg, estados[i - 1], estados[i], 'recorrido');
    var tope = estados[estados.length - 1];
    if (p.accion === 'Error') { marcar(svg, 'n-' + tope, 'rechazo'); return; }
    marcar(svg, 'n-' + tope, 'actual');
    var m = /^Desplazar s(\d+)/.exec(p.accion);
    if (m) { marcarArista(svg, tope, m[1], 'actual'); return; }
    m = /^Reducir r(\d+)/.exec(p.accion);
    if (m) {
      // al reducir se sacan 2·|α| elementos y se sigue Ir_A con S desde el estado que queda al tope
      var largo = TP3.REGLAS[parseInt(m[1], 10)].der.length;
      var expuesto = estados[estados.length - 1 - largo];
      marcarArista(svg, expuesto, String(TP3.TABLA_LR[expuesto].S), 'actual');
    }
  }

  // ---------- Árbol de análisis sintáctico (distinto para cada expresión) ----------

  // Se arma con las reducciones de la traza, en el orden en que las hizo el analizador:
  // r5 crea S → a con el siguiente operando; r1..r4 juntan los dos últimos árboles con su operador.
  // Cada S lleva el valor que calculó la pila de cálculo (árbol decorado).
  function arbolLR(traza, posfija) {
    var operandos = [];
    posfija.trim().split(/\s+/).filter(Boolean).forEach(function (tok) {
      if (/^\d+(\.\d+)?$/.test(tok)) operandos.push(tok);
      else tok.split('').forEach(function (c) { if ('+-*/'.indexOf(c) < 0) operandos.push(c); });
    });
    var bosque = [], iOperando = 0;
    traza.forEach(function (p) {
      var m = /^Reducir r(\d+)/.exec(p.accion);
      if (!m) return;
      var j = parseInt(m[1], 10);
      var valor = /=\s*(-?[\d.]+)\]/.exec(p.accion) || /apila\s+(-?[\d.]+)/.exec(p.accion);
      if (j === 5) {
        bosque.push({ texto: 'S', valor: valor && valor[1], hijos: [{ texto: operandos[iOperando++], hoja: true }] });
      } else {
        var der = bosque.pop(), izq = bosque.pop();
        bosque.push({ texto: 'S', valor: valor && valor[1], regla: 'r' + j,
          hijos: [izq, der, { texto: TP3.REGLAS[j].der.charAt(2).replace('-', '−'), hoja: true, operador: true }] });
      }
    });
    if (!bosque.length) return '';

    var SEP = 54, NIVEL = 70, siguienteX = 0, profundidadMax = 0;
    function ubicar(n, prof) {
      n.y = 34 + prof * NIVEL;
      profundidadMax = Math.max(profundidadMax, prof);
      if (n.hoja) { n.x = 30 + siguienteX++ * SEP; return; }
      n.hijos.forEach(function (h) { ubicar(h, prof + 1); });
      n.x = (n.hijos[0].x + n.hijos[n.hijos.length - 1].x) / 2;
    }
    // las hojas quedan todas en el último nivel, como en JFLAP
    function bajarHojas(n) {
      if (n.hoja) n.y = 34 + profundidadMax * NIVEL;
      else n.hijos.forEach(bajarHojas);
    }
    bosque.forEach(function (raiz) { ubicar(raiz, 0); });
    bosque.forEach(bajarHojas);

    var lineas = '', nodos = '';
    function dibujar(n) {
      if (!n.hoja) n.hijos.forEach(function (h) {
        lineas += '<line x1="' + n.x + '" y1="' + n.y + '" x2="' + h.x + '" y2="' + h.y + '"/>';
        dibujar(h);
      });
      nodos += '<g class="' + (n.hoja ? (n.operador ? 'hoja operador' : 'hoja') : 'no-terminal') + '">' +
        '<circle cx="' + n.x + '" cy="' + n.y + '" r="16"/>' +
        '<text x="' + n.x + '" y="' + (n.y + 5) + '" text-anchor="middle">' + esc(n.texto) + '</text>' +
        (n.valor !== undefined && n.valor !== null ? '<text class="valor" x="' + (n.x + 20) + '" y="' + (n.y - 12) + '">' + esc(n.valor) + '</text>' : '') +
        '</g>';
    }
    bosque.forEach(dibujar);
    var ancho = 60 + (siguienteX - 1) * SEP, alto = 68 + profundidadMax * NIVEL;
    return '<svg xmlns="' + NS + '" viewBox="0 0 ' + Math.max(ancho, 120) + ' ' + alto + '" class="arbol" style="max-width:' + Math.max(ancho, 120) * 1.15 + 'px">' +
      '<g class="ramas">' + lineas + '</g>' + nodos + '</svg>';
  }

  return { dibujarPDT: dibujarPDT, dibujarLR: dibujarLR, resaltarPDT: resaltarPDT, resaltarLR: resaltarLR, arbolLR: arbolLR };
})();
