// Lectura real de material: texto de un PDF (pdf.js) o de una foto (OCR con Tesseract.js), y reconocimiento del
// formato de los cuadernillos del Icfes: contexto, «Pregunta N», opciones A–D y la tabla de respuestas correctas.
// Las librerías se cargan desde un CDN solo cuando el tallerista sube algo; el celular del estudiante no las usa.

const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
const TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

export async function lineasPDF(file, progreso) {
  const pdfjs = await import(PDFJS);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const lineas = [];
  for (let p = 1; p <= doc.numPages; p++) {
    progreso?.(p, doc.numPages);
    const items = (await (await doc.getPage(p)).getTextContent()).items.filter(i => i.str.trim());
    // Agrupa por altura para rearmar las líneas; dentro de cada línea, de izquierda a derecha.
    const filas = [];
    for (const it of items) {
      const y = it.transform[5];
      let f = filas.find(r => Math.abs(r.y - y) < 3);
      if (!f) filas.push(f = { y, items: [] });
      f.items.push(it);
    }
    filas.sort((a, b) => b.y - a.y);
    for (const f of filas) {
      f.items.sort((a, b) => a.transform[4] - b.transform[4]);
      lineas.push(f.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim());
    }
    lineas.push('');
  }
  return { lineas, paginas: doc.numPages };
}

function cargarScript(src) {
  return new Promise((ok, mal) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = () => mal(new Error('No se pudo cargar el lector de fotos'));
    document.head.appendChild(s);
  });
}

export async function lineasFoto(file, progreso) {
  await cargarScript(TESSERACT);
  const r = await window.Tesseract.recognize(file, 'spa', {
    logger: m => { if (m.status === 'recognizing text') progreso?.(Math.round(m.progress * 100)); }
  });
  return { lineas: r.data.text.split('\n').map(l => l.trim()), confianza: Math.round(r.data.confidence) };
}

const RUIDO = /^(cuadernillo de preguntas|prueba (lectura cr[ií]tica|matem[aá]ticas|ciencias naturales|sociales y ciudadanas|ingl[eé]s)|\d{1,3}|saber 11\.?º?)$/i;

export function detectarAreaCuadernillo(lineas) {
  const t = lineas.slice(0, 80).join(' ').toLowerCase();
  if (t.includes('lectura cr')) return 'lec';
  if (t.includes('matem')) return 'mat';
  if (t.includes('ciencias naturales')) return 'cie';
  if (t.includes('sociales')) return 'soc';
  if (t.includes('inglés') || t.includes('ingles')) return 'ing';
  return null;
}

// Devuelve las preguntas con su contexto, opciones, clave y afirmación (si el material trae la tabla de respuestas).
export function leerCuadernillo(lineasCrudas) {
  // Limpieza para texto de OCR: viñetas sueltas al inicio y líneas de dos o tres caracteres (bordes, rayas).
  const lineas = lineasCrudas
    .map(l => l.replace(/[ﬁ]/g, 'fi').replace(/[ﬂ]/g, 'fl').replace(/^[-–•·|]+\s*/, '').trim())
    .filter(l => !RUIDO.test(l) && !(l.length > 0 && l.length < 4 && !/^[ABCD][.)]$/.test(l)));
  const preguntas = [];
  const contextos = [];
  let ctx = null;
  let q = null;
  let opcion = -1;
  let i = 0;
  const cerrar = () => { if (q) preguntas.push(q); q = null; opcion = -1; };

  for (; i < lineas.length; i++) {
    const l = lineas[i];
    if (/^Tabla de respuestas correctas/i.test(l)) break;
    const resp = l.match(/RESPONDE[N]? (?:LAS PREGUNTAS|LA PREGUNTA) (\d+)(?: (?:A|Y) (\d+))?/i);
    if (resp) {
      cerrar();
      ctx = { desde: +resp[1], hasta: +(resp[2] || resp[1]), texto: [] };
      contextos.push(ctx);
      continue;
    }
    const preg = l.match(/^Pregunta\s+(\d+)\b/i);
    if (preg) {
      cerrar();
      q = { n: +preg[1], enunciado: [], opciones: [], clave: null, afirmacion: '' };
      continue;
    }
    if (q) {
      const op = l.match(/^([ABCD])[.,)]\s*(.+)$/);
      if (op && 'ABCD'.indexOf(op[1]) === q.opciones.length) {
        opcion = q.opciones.length;
        q.opciones.push(op[2].replace(/^[-–•·]+\s*/, ''));
      } else if (l) {
        if (opcion >= 0) q.opciones[opcion] += ' ' + l;
        else q.enunciado.push(l);
      }
    } else if (ctx && l && !/^CON LA SIGUIENTE INFORMACI[OÓ]N$/i.test(l)) {
      ctx.texto.push(l);
    }
  }
  cerrar();

  // Tabla de respuestas: «N … letra» en una línea; la afirmación son las líneas de alrededor.
  const filas = [];
  let buffer = [];
  for (; i < lineas.length; i++) {
    const l = lineas[i];
    const f = l.match(/^(\d{1,2})\s+(.*?)\s*([ABCD])$/) || l.match(/^(\d{1,2})\s+([ABCD])$/);
    if (f) {
      const medio = f.length === 4 ? f[2] : '';
      filas.push({ n: +f[1], clave: 'ABCD'.indexOf(f[f.length - 1]), afirmacion: [...buffer, medio].join(' ').trim() });
      buffer = [];
    } else if (l && !/^(posici[oó]n|afirmaci[oó]n|respuesta|correcta|tabla de respuestas)/i.test(l)) {
      if (/^[A-ZÁÉÍÓÚ]/.test(l) || !filas.length) buffer.push(l);
      else filas[filas.length - 1].afirmacion += ' ' + l;
    }
  }
  for (const f of filas) {
    const p = preguntas.find(x => x.n === f.n);
    if (p) { p.clave = f.clave; p.afirmacion = f.afirmacion.replace(/\s+/g, ' ').trim(); }
  }

  return preguntas
    .filter(p => p.opciones.length === 4)
    .map(p => {
      const c = contextos.find(x => p.n >= x.desde && p.n <= x.hasta);
      const contexto = c ? c.texto.join('\n').replace(/\n(?=[a-záéíóúñ,;])/g, ' ').trim() : '';
      const enunciado = p.enunciado.join(' ').replace(/\s+/g, ' ').trim();
      // Las que dependen de una imagen o una tabla no se leen bien como texto: quedan marcadas.
      const visual = /gr[aá]fic|tabla|imagen|infograf|figura|diagrama|caricatura/i.test(enunciado) && contexto.length < 400;
      return { ...p, enunciado, contexto, visual, opciones: p.opciones.map(o => o.replace(/\s+/g, ' ').trim()) };
    });
}
