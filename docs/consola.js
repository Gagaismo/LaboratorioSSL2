// Consola estilo TUI para evaluar los problemas 3.1 y 3.2 con comandos.

(function () {
  var salida = document.getElementById('salida');
  var entrada = document.getElementById('entrada');
  var estadoBarra = document.getElementById('estado');

  var config = { estrategia: 1, traza: true };
  var valores = { a: 2, b: 3, c: 4, d: 10, e: 5 };
  var ultimaPosfija = null;
  var historial = [], posHistorial = 0;

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escribir(texto, clase) {
    var div = document.createElement('div');
    div.className = 'linea' + (clase ? ' ' + clase : '');
    div.innerHTML = texto;
    salida.appendChild(div);
    salida.scrollTop = salida.scrollHeight;
  }
  function l(s) { return s === '' || s === undefined ? 'λ' : String(s); }

  // Tabla con caracteres de recuadro.
  function tabla(titulos, filas, marcar) {
    var anchos = titulos.map(function (t, i) {
      return Math.max.apply(null, [t.length].concat(filas.map(function (f) { return String(f[i]).length; })));
    });
    function linea(a, b, c) { return a + anchos.map(function (w) { return '─'.repeat(w + 2); }).join(b) + c; }
    function fila(celdas) {
      return '│' + celdas.map(function (c, i) {
        c = String(c);
        return ' ' + c + ' '.repeat(anchos[i] - c.length) + ' ';
      }).join('│') + '│';
    }
    var out = [linea('┌', '┬', '┐'), fila(titulos), linea('├', '┼', '┤')];
    filas.forEach(function (f, i) {
      var t = esc(fila(f));
      out.push(marcar && marcar(i) ? '<span class="error">' + t + '</span>' : t);
    });
    out.push(linea('└', '┴', '┘'));
    return out.map(function (x, i) { return i < 3 || i === out.length - 1 ? esc(x) : x; }).join('\n');
  }
  function bloque(html) { escribir('<pre>' + html + '</pre>'); }

  var comandos = {
    ayuda: function () {
      bloque(esc([
        'Comandos:',
        '  infija <expr>            Problema 3.1: analiza la expresión infija y la convierte a posfija.',
        '                           Operandos a..z, operadores + - * /, corchetes [ ] (o paréntesis).',
        '  posfija [<expr>] [x=v]   Problema 3.2: evalúa la expresión posfija. Sin expresión usa la última',
        '                           obtenida con infija. Operandos: letras con valor o números separados por blancos.',
        '  valores [x=v ...]        Muestra o asigna los valores de los identificadores.',
        '  estrategia 1|2           Tabla del PDT: 1 = arreglo bidimensional, 2 = arreglo tridimensional.',
        '  traza on|off             Muestra u oculta las trazas.',
        '  tabla pdt | tabla lr     Muestra la tabla de transición-salida o la tabla SLR(1).',
        '  ejemplo                  Ejecuta un ejemplo completo (3.1 y luego 3.2).',
        '  limpiar                  Limpia la pantalla.',
        '',
        'Atajos: F1 ayuda · F2 estrategia · F3 tabla PDT · F4 tabla LR · ↑↓ historial · Ctrl+L limpiar'
      ].join('\n')));
    },

    infija: function (arg) {
      if (!arg) return escribir('Uso: infija <expresión>   (ej.: infija [a+b]*c-d/e)', 'error');
      var expr = arg.replace(/\(/g, '[').replace(/\)/g, ']');
      var r = TP3.convertirInfijaAPosfija(expr, config.estrategia);
      if (config.traza) {
        escribir('Traza del PDT (estrategia ' + config.estrategia + ', entrada ' + esc(expr.replace(/\s+/g, '')) + TP3.FIN + '):', 'tenue');
        bloque(tabla(['Paso', 'Estado', 'READ', 'POP', 'Nuevo', 'PUSH', 'PRINT', 'Pila', 'Salida'],
          r.traza.map(function (p, i) {
            return [i + 1, 'q' + p.estado, l(p.read), l(p.pop), 'q' + p.nuevo, l(p.push), l(p.print), p.pila || 'λ', p.salida || 'λ'];
          }),
          function (i) { return r.traza[i].nuevo === TP3.SUMIDERO; }));
      }
      if (r.aceptada) {
        ultimaPosfija = r.posfija;
        escribir('✔ Cadena aceptada (q6). Posfija: <b>' + esc(r.posfija) + '</b>   → escribí <span class="cmd">posfija</span> para evaluarla', 'ok');
      } else {
        escribir('✘ Cadena rechazada: transición no definida, el PDT pasa al sumidero q9.', 'error');
      }
    },

    posfija: function (arg) {
      var partes = (arg || '').trim().split(/\s+/).filter(Boolean);
      var asignaciones = partes.filter(function (p) { return /^[a-z]=/.test(p); });
      var expr = partes.filter(function (p) { return !/^[a-z]=/.test(p); }).join(' ') || ultimaPosfija;
      if (!expr) return escribir('Uso: posfija <expresión> [x=v ...]   (o primero: infija <expresión>)', 'error');
      if (!asignar(asignaciones)) return;
      var r = TP3.evaluarPosfija(expr, valores);
      if (config.traza && r.traza.length) {
        escribir('Traza del analizador SLR(1) para ' + esc(expr) + ':', 'tenue');
        bloque(tabla(['Paso', 'Pila de análisis', 'Entrada', 'Acción', 'Pila de cálculo'],
          r.traza.map(function (p, i) { return [i + 1, p.analisis, p.entrada, p.accion, p.calculo || 'vacía']; }),
          function (i) { return r.traza[i].accion === 'Error'; }));
      }
      if (r.aceptada) escribir('✔ Expresión aceptada. Resultado: <b>' + TP3.formatear(r.resultado) + '</b>', 'ok');
      else escribir('✘ ' + esc(r.error), 'error');
    },

    valores: function (arg) {
      var partes = (arg || '').trim().split(/\s+/).filter(Boolean);
      if (partes.length && !asignar(partes)) return;
      var claves = Object.keys(valores).sort();
      escribir(claves.length ? 'Valores: ' + claves.map(function (k) { return k + '=' + valores[k]; }).join('  ') : 'No hay valores asignados.');
    },

    estrategia: function (arg) {
      if (arg !== '1' && arg !== '2') return escribir('Uso: estrategia 1|2   (actual: ' + config.estrategia + ')', 'error');
      config.estrategia = parseInt(arg, 10);
      escribir('Estrategia ' + arg + ': ' + (arg === '1' ? 'tabla como arreglo bidimensional (búsqueda secuencial).' : 'tabla como arreglo tridimensional (acceso directo).'));
      actualizarEstado();
    },

    traza: function (arg) {
      if (arg !== 'on' && arg !== 'off') return escribir('Uso: traza on|off', 'error');
      config.traza = arg === 'on';
      escribir('Trazas ' + (config.traza ? 'activadas.' : 'desactivadas.'));
      actualizarEstado();
    },

    tabla: function (arg) {
      if (arg === 'pdt') {
        escribir('Tabla de transición-salida del PDT (toda combinación no listada va al sumidero q9):', 'tenue');
        bloque(tabla(['N°', 'Estado', 'READ', 'POP', 'Nuevo', 'PUSH', 'PRINT'],
          TP3.TABLA_PDT.map(function (f, i) { return [i, 'q' + f[0], l(f[1]), l(f[2]), 'q' + f[3], l(f[4]), l(f[5])]; })));
      } else if (arg === 'lr') {
        escribir('Tabla SLR(1): r1 S→SS+  r2 S→SS-  r3 S→SS*  r4 S→SS/  r5 S→a', 'tenue');
        bloque(tabla(['Estado'].concat(TP3.COLUMNAS_LR),
          TP3.TABLA_LR.map(function (r, i) {
            return [i].concat(TP3.COLUMNAS_LR.map(function (c) { return r[c] === undefined ? '' : r[c]; }));
          })));
      } else {
        escribir('Uso: tabla pdt | tabla lr', 'error');
      }
    },

    ejemplo: function () {
      ejecutar('infija [a+b]*c-d/e');
      ejecutar('posfija a=2 b=3 c=4 d=10 e=5');
    },

    limpiar: function () { salida.innerHTML = ''; }
  };
  var alias = { help: 'ayuda', '?': 'ayuda', i: 'infija', convertir: 'infija', p: 'posfija', evaluar: 'posfija', clear: 'limpiar', cls: 'limpiar' };

  function asignar(lista) {
    for (var k = 0; k < lista.length; k++) {
      var m = /^([a-z])=(-?\d+(\.\d+)?)$/.exec(lista[k]);
      if (!m) { escribir('Asignación no válida: "' + esc(lista[k]) + '" (usar letra=número, ej.: a=2)', 'error'); return false; }
      valores[m[1]] = parseFloat(m[2]);
    }
    return true;
  }

  function ejecutar(linea) {
    escribir('<span class="prompt">ssl@tp3:~$</span> ' + esc(linea));
    var m = /^\s*(\S+)\s*(.*)$/.exec(linea);
    if (!m) return;
    var nombre = m[1].toLowerCase();
    nombre = alias[nombre] || nombre;
    if (comandos[nombre]) comandos[nombre](m[2].trim());
    else escribir('Comando desconocido: ' + esc(m[1]) + '. Escribí <span class="cmd">ayuda</span> para ver los comandos.', 'error');
  }

  function actualizarEstado() {
    estadoBarra.textContent = 'estrategia ' + config.estrategia + ' · traza ' + (config.traza ? 'on' : 'off');
  }

  entrada.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var linea = entrada.value;
      entrada.value = '';
      if (!linea.trim()) return;
      historial.push(linea);
      posHistorial = historial.length;
      ejecutar(linea);
    } else if (e.key === 'ArrowUp') {
      if (posHistorial > 0) entrada.value = historial[--posHistorial];
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      posHistorial = Math.min(historial.length, posHistorial + 1);
      entrada.value = historial[posHistorial] || '';
      e.preventDefault();
    }
  });

  var atajos = {
    F1: 'ayuda',
    F2: function () { return 'estrategia ' + (config.estrategia === 1 ? 2 : 1); },
    F3: 'tabla pdt',
    F4: 'tabla lr'
  };
  document.addEventListener('keydown', function (e) {
    if (atajos[e.key]) {
      e.preventDefault();
      var c = atajos[e.key];
      ejecutar(typeof c === 'function' ? c() : c);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      comandos.limpiar();
    }
  });
  document.querySelectorAll('[data-tecla]').forEach(function (b) {
    b.addEventListener('click', function () {
      var c = atajos[b.dataset.tecla];
      if (b.dataset.tecla === 'L') comandos.limpiar();
      else ejecutar(typeof c === 'function' ? c() : c);
      entrada.focus();
    });
  });
  salida.addEventListener('click', function () { if (!window.getSelection().toString()) entrada.focus(); });

  var banner = [
    'UTN FRT · Sintaxis y Semántica de los Lenguajes · TP N° 3',
    'Intérprete de Expresiones Algebraicas',
    '3.1 PDT infija → posfija   ·   3.2 Evaluador SLR(1)'
  ];
  var ancho = Math.max.apply(null, banner.map(function (s) { return s.length; })) + 4;
  escribir(esc(['╔' + '═'.repeat(ancho) + '╗']
    .concat(banner.map(function (s) { return '║  ' + s + ' '.repeat(ancho - s.length - 2) + '║'; }))
    .concat(['╚' + '═'.repeat(ancho) + '╝']).join('\n')), 'pre titulo');
  escribir('Escribí <span class="cmd">ayuda</span> para ver los comandos o <span class="cmd">ejemplo</span> para una demostración.', 'tenue');
  actualizarEstado();
  entrada.focus();
})();
