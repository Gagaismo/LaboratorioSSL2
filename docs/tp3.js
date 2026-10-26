// TP N° 3 - Ejercicio de Aplicación: Intérprete de Expresiones Algebraicas.
// Sintaxis y Semántica de los Lenguajes - UTN FRT.
// Problema 3.1: PDT que analiza una expresión infija y la convierte a posfija.
// Problema 3.2: Analizador SLR(1) con pila de cálculo que evalúa la expresión posfija.

(function (global) {
  'use strict';

  // ===================================================================
  // PROBLEMA 3.1 - TRANSDUCTOR DE PILA (PDT)
  // ===================================================================

  var LAMBDA = '';      // casillero en blanco = λ (No-operación)
  var FIN = '⌂';        // fin de cadena (símbolo de JFLAP)
  var ACEPTACION = 6;   // q6: estado final de parada y aceptación
  var SUMIDERO = 9;     // q9: estado de rechazo tipo sumidero

  var BAJA = ['+', '-'];
  var ALTA = ['*', '/'];
  var OPERADORES = ['+', '-', '*', '/'];

  // Estado de vaciado al que se pasa cuando el operador leído debe esperar
  // a que salgan de la pila los operadores de igual o mayor precedencia.
  var VACIADO = { '*': 1, '+': 2, '/': 7, '-': 8 };

  // Primera estrategia: tabla como arreglo bidimensional.
  // Cada fila: [ESTADO ACTUAL, READ, POP, ESTADO NUEVO, PUSH, PRINT]
  // "letra" representa cualquier letra minúscula del alfabeto inglés.
  function construirTablaBidimensional() {
    var t = [];
    function fila(e, read, pop, nuevo, push, print) { t.push([e, read, pop, nuevo, push, print]); }

    // q0: espera un operando o una apertura de corchete
    fila(0, 'letra', LAMBDA, 3, LAMBDA, 'letra');
    fila(0, '[', LAMBDA, 0, '[', LAMBDA);

    // q1 (leyó *), q2 (leyó +), q7 (leyó /), q8 (leyó -): vaciado sin leer entrada
    [1, 2].forEach(function (q) { filasVaciado(q); });

    // q3: después de un operando, lee y desapila
    OPERADORES.forEach(function (op) {
      fila(3, op, 'Z', 0, op + 'Z', LAMBDA);
      fila(3, op, '[', 0, op + '[', LAMBDA);
      OPERADORES.forEach(function (tope) {
        if (ALTA.indexOf(op) >= 0 && BAJA.indexOf(tope) >= 0) {
          fila(3, op, tope, 0, op + tope, LAMBDA);      // mayor precedencia: espera arriba
        } else {
          fila(3, op, tope, VACIADO[op], LAMBDA, tope); // sale el de igual o mayor precedencia
        }
      });
    });
    OPERADORES.forEach(function (tope) { fila(3, ']', tope, 5, LAMBDA, tope); });
    fila(3, ']', '[', 3, LAMBDA, LAMBDA);
    fila(3, FIN, 'Z', 6, LAMBDA, LAMBDA);
    OPERADORES.forEach(function (tope) { fila(3, FIN, tope, 4, LAMBDA, tope); });

    // q4: fin de cadena, vacía la pila hasta Z
    OPERADORES.forEach(function (tope) { fila(4, LAMBDA, tope, 4, LAMBDA, tope); });
    fila(4, LAMBDA, 'Z', 6, LAMBDA, LAMBDA);

    // q5: cierre de corchete, vacía la pila hasta [
    OPERADORES.forEach(function (tope) { fila(5, LAMBDA, tope, 5, LAMBDA, tope); });
    fila(5, LAMBDA, '[', 3, LAMBDA, LAMBDA);

    [7, 8].forEach(function (q) { filasVaciado(q); });

    function filasVaciado(q) {
      var leido = Object.keys(VACIADO).filter(function (op) { return VACIADO[op] === q; })[0];
      var esAlta = ALTA.indexOf(leido) >= 0;
      fila(q, LAMBDA, 'Z', 0, leido + 'Z', LAMBDA);
      OPERADORES.forEach(function (tope) {
        if (esAlta && BAJA.indexOf(tope) >= 0) fila(q, LAMBDA, tope, 0, leido + tope, LAMBDA);
        else fila(q, LAMBDA, tope, q, LAMBDA, tope);
      });
      fila(q, LAMBDA, '[', 0, leido + '[', LAMBDA);
    }
    return t;
  }

  var TABLA_PDT = construirTablaBidimensional();

  function esLetra(c) { return c.length === 1 && c >= 'a' && c <= 'z'; }

  function buscarEnTabla(estado, entrada, pila) {
    var read = esLetra(entrada) ? 'letra' : entrada;
    for (var pos = 0; pos < TABLA_PDT.length; pos++) {
      var f = TABLA_PDT[pos];
      if (f[0] === estado && f[1] === read && f[2] === pila) return pos;
    }
    return -1; // la búsqueda fracasa: se rechaza la secuencia
  }

  // Segunda estrategia: tabla como arreglo tridimensional tabla[estado][read][pop].
  // Los símbolos de entrada y de pila se convierten en índices numéricos.
  var INDICE_SIMBOLO = { '': 0, 'letra': 1, 'Z': 1, '+': 2, '-': 3, '*': 4, '/': 5, '[': 6, ']': 7 };
  INDICE_SIMBOLO[FIN] = 8;
  var CANT_SIMBOLOS = 9;
  var CANT_ESTADOS = 10; // q0..q9

  function construirTablaTridimensional() {
    var t = [];
    for (var e = 0; e < CANT_ESTADOS; e++) {
      t[e] = [];
      for (var r = 0; r < CANT_SIMBOLOS; r++) {
        t[e][r] = [];
        for (var p = 0; p < CANT_SIMBOLOS; p++) {
          t[e][r][p] = { nuevo_estado: SUMIDERO, sec_push: LAMBDA, sec_print: LAMBDA };
        }
      }
    }
    TABLA_PDT.forEach(function (f) {
      t[f[0]][INDICE_SIMBOLO[f[1]]][INDICE_SIMBOLO[f[2]]] =
        { nuevo_estado: f[3], sec_push: f[4], sec_print: f[5] };
    });
    return t;
  }

  var TABLA_PDT_3D = construirTablaTridimensional();

  function indice(simbolo) {
    if (esLetra(simbolo)) return 1;
    return INDICE_SIMBOLO.hasOwnProperty(simbolo) ? INDICE_SIMBOLO[simbolo] : -1;
  }

  // Algoritmo de Análisis y Conversión (estrategia 1 o 2).
  // La expresión usa corchetes como en JFLAP; el fin de cadena se agrega aquí.
  function convertirInfijaAPosfija(expresion, estrategia) {
    var cinta = expresion.replace(/\s+/g, '') + FIN;
    var i = 0;
    var pila = ['Z'];            // el tope es el último elemento
    var salida = '';
    var traza = [];
    var estado = 0;

    while (estado !== ACEPTACION && estado !== SUMIDERO) {
      var simbEntrada, simbPila;
      switch (estado) {
        case 0:
          simbEntrada = cinta.charAt(i++);
          simbPila = LAMBDA;
          break;
        case 3:
          simbEntrada = cinta.charAt(i++);
          simbPila = pila.pop();
          break;
        default: // q1, q2, q4, q5, q7, q8
          simbEntrada = LAMBDA;
          simbPila = pila.pop();
      }

      var reaccion = null;
      if (estrategia === 2) {
        var r = indice(simbEntrada), p = indice(simbPila);
        if (r >= 0 && p >= 0) {
          var celda = TABLA_PDT_3D[estado][r][p];
          if (celda.nuevo_estado !== SUMIDERO) reaccion = [celda.nuevo_estado, celda.sec_push, celda.sec_print];
        }
      } else {
        var pos = buscarEnTabla(estado, simbEntrada, simbPila);
        if (pos >= 0) reaccion = TABLA_PDT[pos].slice(3);
      }

      var paso = { estado: estado, read: simbEntrada, pop: simbPila };
      if (reaccion) {
        var print = reaccion[2] === 'letra' ? simbEntrada : reaccion[2];
        // push: el primer símbolo de la secuencia queda en el tope
        for (var k = reaccion[1].length - 1; k >= 0; k--) pila.push(reaccion[1].charAt(k));
        salida += print;
        paso.nuevo = reaccion[0];
        paso.push = reaccion[1];
        paso.print = print;
        estado = reaccion[0];
      } else {
        paso.nuevo = SUMIDERO;
        paso.push = LAMBDA;
        paso.print = LAMBDA;
        estado = SUMIDERO;
      }
      paso.pila = pila.slice().reverse().join('');
      paso.salida = salida;
      traza.push(paso);
    }

    return { aceptada: estado === ACEPTACION, posfija: estado === ACEPTACION ? salida : null, traza: traza };
  }

  // ===================================================================
  // PROBLEMA 3.2 - ANALIZADOR SLR(1) CON PILA DE CÁLCULO
  // ===================================================================

  // GIC de la expresión posfija (reglas numeradas como en JFLAP):
  var REGLAS = [
    null,
    { izq: 'S', der: 'SS+' },  // r1
    { izq: 'S', der: 'SS-' },  // r2
    { izq: 'S', der: 'SS*' },  // r3
    { izq: 'S', der: 'SS/' },  // r4
    { izq: 'S', der: 'a' }     // r5
  ];

  var COLUMNAS_LR = ['*', '+', '-', '/', 'a', '$', 'S'];

  // Tabla LR obtenida con JFLAP: tabla[símbolo especial][símbolo]
  var TABLA_LR = [
    { 'a': 's2', 'S': 1 },
    { 'a': 's2', '$': 'acc', 'S': 3 },
    { '*': 'r5', '+': 'r5', '-': 'r5', '/': 'r5', 'a': 'r5', '$': 'r5' },
    { '*': 's4', '+': 's5', '-': 's6', '/': 's7', 'a': 's2', 'S': 3 },
    { '*': 'r3', '+': 'r3', '-': 'r3', '/': 'r3', 'a': 'r3', '$': 'r3' },
    { '*': 'r1', '+': 'r1', '-': 'r1', '/': 'r1', 'a': 'r1', '$': 'r1' },
    { '*': 'r2', '+': 'r2', '-': 'r2', '/': 'r2', 'a': 'r2', '$': 'r2' },
    { '*': 'r4', '+': 'r4', '-': 'r4', '/': 'r4', 'a': 'r4', '$': 'r4' }
  ];

  // Construye los dos arreglos unidimensionales a partir de la expresión posfija.
  // Los operandos pueden ser números separados por blancos o letras con su valor.
  function construirVectores(posfija, valores) {
    var simbolos = [], numeros = [];
    var tokens = posfija.trim().split(/\s+/).filter(Boolean);
    tokens.forEach(function (tok) {
      if (/^\d+(\.\d+)?$/.test(tok)) {
        simbolos.push('a');
        numeros.push(parseFloat(tok));
        return;
      }
      for (var k = 0; k < tok.length; k++) {
        var c = tok.charAt(k);
        if (OPERADORES.indexOf(c) >= 0) {
          simbolos.push(c);
        } else if (esLetra(c)) {
          if (!valores || valores[c] === undefined || valores[c] === '' || isNaN(valores[c])) {
            throw new Error('Falta el valor numérico del identificador "' + c + '".');
          }
          simbolos.push('a');
          numeros.push(parseFloat(valores[c]));
        } else {
          throw new Error('Símbolo no válido en la expresión posfija: "' + c + '".');
        }
      }
    });
    simbolos.push('$');
    return { simbolos: simbolos, numeros: numeros };
  }

  function operar(op, val1, val2) {
    switch (op) {
      case '+': return val1 + val2;
      case '-': return val1 - val2;
      case '*': return val1 * val2;
      case '/':
        if (val2 === 0) throw new Error('División por cero.');
        return val1 / val2;
    }
  }

  function evaluarPosfija(posfija, valores) {
    var traza = [];
    var v;
    try {
      v = construirVectores(posfija, valores);
    } catch (e) {
      return { aceptada: false, error: e.message, traza: traza };
    }
    var pilaAnalisis = [];
    var pilaCalculo = [];
    var iSimbolo = 0, iValor = 0;

    var simbEspecial = 0;
    pilaAnalisis.push(simbEspecial);
    var simbolo = v.simbolos[iSimbolo];
    var valorTabla = TABLA_LR[simbEspecial][simbolo];

    function registrar(accion) {
      traza.push({
        analisis: pilaAnalisis.join(' '),
        entrada: v.simbolos.slice(iSimbolo).join(''),
        accion: accion,
        calculo: pilaCalculo.map(formatear).join(' ')
      });
    }

    while (valorTabla !== 'acc') {
      if (valorTabla && valorTabla.charAt(0) === 's') {
        // desplazamiento
        registrar('Desplazar ' + valorTabla);
        pilaAnalisis.push(simbolo);
        simbEspecial = parseInt(valorTabla.substring(1), 10);
        pilaAnalisis.push(simbEspecial);
        simbolo = v.simbolos[++iSimbolo];
      } else if (valorTabla && valorTabla.charAt(0) === 'r') {
        // reducción
        var j = parseInt(valorTabla.substring(1), 10);
        var regla = REGLAS[j];
        var accion = 'Reducir ' + valorTabla + ': ' + regla.izq + ' → ' + regla.der;
        var resultado;
        try {
          if (regla.der === 'a') {
            resultado = v.numeros[iValor];
            accion += '  [apila ' + formatear(resultado) + ']';
          } else {
            var val2 = pilaCalculo[pilaCalculo.length - 1];
            var val1 = pilaCalculo[pilaCalculo.length - 2];
            resultado = operar(regla.der.charAt(2), val1, val2);
            accion += '  [' + formatear(val1) + ' ' + regla.der.charAt(2) + ' ' + formatear(val2) + ' = ' + formatear(resultado) + ']';
          }
        } catch (e) {
          registrar(accion);
          return { aceptada: false, error: e.message, traza: traza };
        }
        registrar(accion);
        pilaAnalisis.splice(pilaAnalisis.length - 2 * regla.der.length);
        simbEspecial = pilaAnalisis[pilaAnalisis.length - 1];
        pilaAnalisis.push(regla.izq);
        simbEspecial = TABLA_LR[simbEspecial][regla.izq];
        pilaAnalisis.push(simbEspecial);
        // operar en pila de cálculo
        if (regla.der === 'a') {
          iValor++;
        } else {
          pilaCalculo.pop();
          pilaCalculo.pop();
        }
        pilaCalculo.push(resultado);
      } else {
        // casillero vacío
        registrar('Error');
        return { aceptada: false, error: 'Error sintáctico: no hay acción para (' + simbEspecial + ', ' + simbolo + ').', traza: traza };
      }
      valorTabla = TABLA_LR[simbEspecial][simbolo];
    }
    if (simbolo !== '$') {
      return { aceptada: false, error: 'Quedan símbolos sin leer.', traza: traza };
    }
    registrar('Aceptar');
    var res = pilaCalculo.pop(); // vaciar pila: único valor
    return { aceptada: true, resultado: res, traza: traza };
  }

  function formatear(n) {
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 1e6) / 1e6);
  }

  function nombreEstado(e) { return 'q' + e; }

  var api = {
    LAMBDA: LAMBDA, FIN: FIN, SUMIDERO: SUMIDERO,
    TABLA_PDT: TABLA_PDT, TABLA_PDT_3D: TABLA_PDT_3D, INDICE_SIMBOLO: INDICE_SIMBOLO,
    REGLAS: REGLAS, TABLA_LR: TABLA_LR, COLUMNAS_LR: COLUMNAS_LR,
    convertirInfijaAPosfija: convertirInfijaAPosfija,
    evaluarPosfija: evaluarPosfija,
    formatear: formatear, nombreEstado: nombreEstado
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.TP3 = api;
})(this);
