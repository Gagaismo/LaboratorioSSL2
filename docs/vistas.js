// Generación de las tablas HTML a partir del modelo de tp3.js
// (las usan la interfaz y el informe, así ambos muestran exactamente las mismas tablas).

var Vistas = (function () {
  function l(s) { return s === '' || s === undefined ? 'λ' : s; }
  function q(e) { return 'q' + e; }
  function fila(celdas, clase) {
    return '<tr' + (clase ? ' class="' + clase + '"' : '') + '>' + celdas.map(function (c) {
      return '<td class="mono">' + c + '</td>';
    }).join('') + '</tr>';
  }
  function cabecera(titulos) {
    return '<tr>' + titulos.map(function (t) { return '<th>' + t + '</th>'; }).join('') + '</tr>';
  }

  function tablaPDT() {
    var h = '<table>' + cabecera(['N°', 'Estado actual', 'READ', 'POP', 'Estado nuevo', 'PUSH', 'PRINT']);
    TP3.TABLA_PDT.forEach(function (f, i) {
      var actual = (f[0] === 0 && i === 0 ? '→ ' : '') + q(f[0]);
      var nuevo = f[3] === 6 ? '* q6' : q(f[3]);
      h += fila([i, actual, l(f[1]), l(f[2]), nuevo, l(f[4]), l(f[5])]);
    });
    return h + '</table>';
  }

  function tablaPDTIndices() {
    var ix = TP3.INDICE_SIMBOLO;
    function idx(s) { return s === 'letra' ? 1 : ix[s]; }
    var h = '<table>' + cabecera(['Estado actual', 'READ', 'POP', 'Estado nuevo', 'PUSH', 'PRINT']);
    TP3.TABLA_PDT.forEach(function (f) {
      h += fila([f[0], idx(f[1]), idx(f[2]), f[3], f[4], f[5]]);
    });
    return h + '</table>';
  }

  function trazaPDT(traza) {
    var h = '<table>' + cabecera(['Paso', 'Estado actual', 'READ', 'POP', 'Estado nuevo', 'PUSH', 'PRINT', 'Pila (tope a la izq.)', 'Cinta de salida']);
    traza.forEach(function (p, i) {
      h += fila([i + 1, q(p.estado), l(p.read), l(p.pop), q(p.nuevo), l(p.push), l(p.print), p.pila || 'λ', p.salida || 'λ'],
        p.nuevo === TP3.SUMIDERO ? 'rechazo' : '');
    });
    return h + '</table>';
  }

  function tablaLR() {
    var cols = TP3.COLUMNAS_LR;
    var h = '<table><tr><th rowspan="2">Estado</th><th colspan="6">ACCIÓN</th><th>IR_A</th></tr>' + cabecera(cols);
    TP3.TABLA_LR.forEach(function (r, i) {
      h += fila([i].concat(cols.map(function (c) { return r[c] === undefined ? '' : r[c]; })));
    });
    return h + '</table>';
  }

  function trazaLR(traza) {
    var h = '<table>' + cabecera(['Paso', 'Pila de análisis', 'Entrada', 'Acción', 'Pila de cálculo']);
    traza.forEach(function (p, i) {
      h += '<tr' + (p.accion === 'Error' ? ' class="rechazo"' : '') + '><td class="mono">' + (i + 1) +
        '</td><td class="mono izq">' + p.analisis + '</td><td class="mono" style="text-align:right">' + p.entrada +
        '</td><td class="mono izq">' + p.accion + '</td><td class="mono izq">' + (p.calculo || 'vacía') + '</td></tr>';
    });
    return h + '</table>';
  }

  return { tablaPDT: tablaPDT, tablaPDTIndices: tablaPDTIndices, trazaPDT: trazaPDT, tablaLR: tablaLR, trazaLR: trazaLR };
})();
