// Generación simulada de la IA. No hay modelo detrás: los ejemplos traen preguntas escritas a mano con el formato
// de los cuadernillos del Icfes (contexto, enunciado, cuatro opciones, competencia), y el texto libre pasa por
// reglas simples. Sirve para mostrar el flujo de revisión, no la calidad de un modelo.

export const COMPETENCIAS = {
  mat: ['Interpretación y representación', 'Formulación y ejecución', 'Argumentación'],
  lec: ['Identifica contenidos locales', 'Comprende el sentido global', 'Reflexiona y evalúa']
};

export const EJEMPLOS = [
  {
    id: 'transporte',
    nombre: 'Tabla de costos de transporte',
    archivo: 'costos-transporte.txt',
    area: 'mat',
    texto: 'Costos de llegar a la universidad. Un pasaje de bus cuesta $3.200. Desde el barrio, llegar a la sede de la universidad exige tomar 2 buses por trayecto. Con la tarjeta de estudiante, cada pasaje tiene un descuento del 25 %. Un estudiante asiste 5 días a la semana.',
    conceptos: ['porcentajes', 'proporcionalidad', 'operaciones con dinero'],
    preguntas: [
      { comp: 1, pistaBase: 'Cuenta primero cuántos pasajes paga en un día.', enunciado: 'Sin la tarjeta de estudiante, ¿cuánto gasta a la semana en pasajes?', opciones: ['$32.000', '$64.000', '$48.000', '$128.000'], clave: 1,
        explicacion: 'Cada día son 2 trayectos de 2 buses: 4 pasajes. En 5 días son 20 pasajes de $3.200, o sea $64.000.' },
      { comp: 1, pistaBase: 'Calcula cuánto cuesta un pasaje con el 25 % de descuento.', enunciado: 'Con la tarjeta de estudiante, ¿cuánto gasta a la semana?', opciones: ['$16.000', '$39.000', '$48.000', '$60.800'], clave: 2,
        explicacion: 'Con el 25 % de descuento cada pasaje cuesta $2.400. 20 pasajes por $2.400 dan $48.000, que es el 75 % de $64.000.' },
      { comp: 2, pistaBase: 'Compara el gasto semanal con y sin tarjeta.', enunciado: 'Una estudiante afirma que con la tarjeta ahorra $16.000 cada semana, porque el 25 % de $64.000 es $16.000. Su afirmación es',
        opciones: ['correcta, porque el descuento se aplica a cada pasaje y la suma de los descuentos es el 25 % del gasto semanal.', 'incorrecta, porque el descuento solo se aplica al primer bus de cada trayecto.', 'correcta, porque el 25 % de cualquier gasto siempre equivale a $16.000.', 'incorrecta, porque haría falta saber cuántos días va a la universidad.'], clave: 0,
        explicacion: 'Descontar el 25 % a cada pasaje es lo mismo que descontar el 25 % al total: $64.000 − $48.000 = $16.000.' },
      { comp: 0, pistaBase: 'Piensa cuántos pasajes deja de pagar con un día menos.', enunciado: 'Si el estudiante asiste 4 días en lugar de 5, su gasto semanal con la tarjeta', opciones: ['disminuye $9.600.', 'disminuye $12.800.', 'disminuye $2.400.', 'no cambia, porque el descuento es el mismo.'], clave: 0,
        explicacion: 'Un día menos son 4 pasajes menos. Con descuento, 4 × $2.400 = $9.600.' }
    ],
    reserva: [
      { comp: 1, pistaBase: 'Primero averigua cuánto ahorra en una semana.', enunciado: 'En un mes de 4 semanas, ¿cuánto ahorra con la tarjeta de estudiante?', opciones: ['$16.000', '$48.000', '$64.000', '$192.000'], clave: 2,
        explicacion: 'Ahorra $16.000 por semana; en 4 semanas son $64.000.' },
      { comp: 2, pistaBase: 'Si el precio del pasaje se duplicara, ¿qué pasaría con el gasto?', enunciado: 'Juan dice que si el pasaje sube 10 %, su gasto semanal con la tarjeta también sube 10 %. Su afirmación es',
        opciones: ['correcta, porque el gasto es proporcional al precio del pasaje.', 'incorrecta, porque el descuento compensa el aumento.', 'incorrecta, porque el gasto sube 35 %.', 'correcta, porque el 10 % se suma al 25 % del descuento.'], clave: 0,
        explicacion: 'El gasto es un número fijo de pasajes por el precio con descuento. Si el precio sube 10 %, el gasto sube 10 %.' }
    ]
  },
  {
    id: 'cronica',
    nombre: 'Texto del colectivo: «Cada sábado»',
    archivo: 'cada-sabado.txt',
    area: 'lec',
    texto: 'Cada sábado, en el salón comunal, cuarenta jóvenes se sientan a resolver preguntas que nadie les regaló. Algunos vienen de trabajar toda la semana; otros caminan media hora porque el pasaje no alcanza. El examen de admisión les pide lo mismo que a quien pagó un curso de $700.000 al mes. Por eso el preuniversitario no solo enseña a responder: discute por qué hay barrios donde llegar a la universidad pública parece una excepción. Prepararse, dicen los talleristas, también es una forma de reclamar un derecho.',
    conceptos: ['idea global', 'función de un dato', 'postura del autor'],
    preguntas: [
      { comp: 0, pistaBase: 'Busca la oración que habla de caminar.', enunciado: 'Según el texto, ¿por qué algunos jóvenes caminan media hora?', opciones: ['Porque el salón comunal queda en otro municipio.', 'Porque no les alcanza para el pasaje.', 'Porque los talleristas se lo piden.', 'Porque el examen se presenta caminando.'], clave: 1,
        explicacion: 'El texto lo dice de forma literal: «caminan media hora porque el pasaje no alcanza».' },
      { comp: 1, pistaBase: 'Fíjate con quién se compara a los jóvenes del salón comunal.', enunciado: '¿Qué función cumple el dato de los $700.000 en el texto?', opciones: ['Informar cuánto cobra el preuniversitario popular.', 'Mostrar la desigualdad de condiciones entre quienes presentan el mismo examen.', 'Recomendar un curso pagado.', 'Explicar cuánto cuesta el transporte.'], clave: 1,
        explicacion: 'El dato contrasta a quien pagó un curso con los jóvenes del salón comunal: mismo examen, condiciones distintas.' },
      { comp: 1, pistaBase: 'Es una expresión figurada: piensa en qué tuvieron que hacer para aprender.', enunciado: 'En el texto, la expresión «preguntas que nadie les regaló» sugiere que los jóvenes', opciones: ['reciben las preguntas del examen por adelantado.', 'aprenden con esfuerzo propio, sin las ventajas de otros.', 'compran las guías del preuniversitario.', 'prefieren estudiar solos.'], clave: 1,
        explicacion: 'Es una expresión figurada: lo que aprenden lo consiguen con su esfuerzo, no porque alguien se lo facilite.' },
      { comp: 2, pistaBase: 'Relee la última oración del texto.', enunciado: '¿Con cuál de los siguientes enunciados estaría de acuerdo quien escribe?', opciones: ['El examen debería ser más difícil para quienes pagan cursos.', 'Los jóvenes que trabajan no deberían presentar el examen.', 'Prepararse para el examen también puede ser una forma de exigir un derecho.', 'La universidad pública es para unos pocos.'], clave: 2,
        explicacion: 'La última oración resume la postura: «prepararse… también es una forma de reclamar un derecho».' }
    ],
    reserva: [
      { comp: 2, pistaBase: 'Fíjate si el texto cuenta una escena, da instrucciones o reporta una noticia.', enunciado: '¿Qué tipo de texto es?', opciones: ['Una noticia sobre los resultados del examen.', 'Una crónica breve que combina descripción y opinión.', 'Un instructivo para presentar el examen.', 'Un texto científico sobre la educación.'], clave: 1,
        explicacion: 'Describe una escena concreta (el sábado en el salón) y cierra con una postura: es una crónica breve.' },
      { comp: 0, pistaBase: 'Está en la primera oración.', enunciado: 'Según el texto, ¿cuántos jóvenes se reúnen cada sábado?', opciones: ['Cuatro', 'Catorce', 'Cuarenta', 'Setecientos'], clave: 2,
        explicacion: 'La primera oración lo dice: «cuarenta jóvenes».' }
    ]
  }
];

// ------------------------------------------------------------------ texto libre
const CAMBIOS = [['más', 'menos'], ['siempre', 'nunca'], ['aumenta', 'disminuye'], ['puede', 'no puede'], ['mayor', 'menor'], ['todos', 'ninguno']];

function oraciones(t) {
  return t.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 35);
}

function alterar(s, k) {
  const num = s.match(/\d[\d.,]*/);
  if (num && k === 0) return s.replace(num[0], String(Number(num[0].replace(/\./g, '').replace(',', '.')) * 2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  for (const [a, b] of CAMBIOS.slice(k)) {
    const re = new RegExp(`\\b${a}\\b`, 'i');
    if (re.test(s)) return s.replace(re, b);
  }
  return null;
}

const corto = s => (s.length > 150 ? s.slice(0, 147).trimEnd() + '…' : s);

export function detectarArea(t) {
  const nums = (t.match(/\d[\d.,]*/g) || []).length;
  return nums >= 3 || /%|\$|promedio|tabla|precio/i.test(t) ? 'mat' : 'lec';
}

export function desdeTexto(t, area) {
  const os = oraciones(t);
  const qs = [];
  // Lectura literal: una oración real contra versiones alteradas de otras.
  const conDato = os.find(s => alterar(s, 0)) || os[0];
  if (conDato) {
    const falsas = os.filter(s => s !== conDato).map((s, i) => alterar(s, i % 3)).filter(Boolean).slice(0, 3);
    while (falsas.length < 3) falsas.push(['El texto afirma lo contrario de lo que plantea al inicio.', 'El texto no presenta ningún dato.', 'El autor se dirige solo a especialistas.'][falsas.length]);
    const ops = [corto(conDato), ...falsas.map(corto)];
    const orden = [2, 0, 3, 1];
    const opciones = orden.map(i => ops[i]);
    qs.push({ comp: 0, enunciado: 'Según el texto, ¿cuál de las siguientes afirmaciones es correcta?', opciones, clave: orden.indexOf(0),
      explicacion: `Es la única que aparece tal cual en el texto. Las otras cambian un dato o una palabra clave.` });
  }
  // Propósito global por señales del texto.
  const prop = /por eso|debe|deberían|creemos|es necesario|derecho/i.test(t) ? 1 : /\d/.test(t) ? 0 : /fue|era|había/i.test(t) ? 2 : 0;
  qs.push({ comp: 1, enunciado: '¿Cuál es el propósito principal del texto?', opciones: ['Informar datos sobre una situación.', 'Convencer al lector de una postura.', 'Narrar una experiencia.', 'Dar instrucciones paso a paso.'], clave: prop,
    explicacion: ['Presenta datos y hechos sin defender una postura.', 'Usa expresiones de valoración y conclusión («por eso», «debe») para sostener una postura.', 'Relata hechos en secuencia, como una historia.', ''][prop] });
  // Una de cálculo si hay al menos un número.
  const n = (t.match(/\d[\d.]*/g) || []).map(x => Number(x.replace(/\./g, ''))).find(x => x >= 10);
  if (n) {
    const r = Math.round(n * 1.1);
    const f = x => x.toLocaleString('es-CO');
    qs.push({ comp: area === 'mat' ? 1 : 2, enunciado: `El texto menciona la cifra ${f(n)}. Si esa cantidad aumentara un 10 %, ¿cuál sería el nuevo valor?`, opciones: [f(n + 10), f(r), f(n * 10), f(Math.round(n * 0.9))], clave: 1,
      explicacion: `El 10 % de ${f(n)} es ${f(Math.round(n * 0.1))}; sumado da ${f(r)}.` });
  }
  return qs;
}
