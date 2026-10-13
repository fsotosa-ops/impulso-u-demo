import { banco, estado, guardar, agregarPreguntas } from './estado.js';
import { ic, esc, LETRAS, GRUPO, toast } from './ui.js';
import { EJEMPLOS, COMPETENCIAS, desdeTexto, detectarArea } from './generador.js';
import { aciertosPorArea } from './grupo.js';
import { lineasPDF, lineasFoto, leerCuadernillo, detectarAreaCuadernillo } from './importar.js';

const ICFES_LECTURA = 'https://www.icfes.gov.co/wp-content/uploads/2026/03/16-feb-cuadernillo-de-preguntas-lectura-critica-saber-11-2026.pdf';

const PASOS = ['Leyendo el material', 'Cruzando con los resultados del grupo', 'Redactando preguntas al estilo Saber 11', 'Escribiendo la explicación para el estudiante'];
const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;

let s = nuevo();

function nuevo() {
  return { fase: 'subir', material: null, area: 'mat', n: 4, paso: 0, pasos: PASOS, progreso: '', chat: [], propuesta: null, corrigiendo: null };
}

// Para enlazar desde otras vistas: «Pedir más preguntas de Matemáticas» abre esta vista con el área elegida.
export function prepararCrear(area) {
  s = nuevo();
  s.area = area;
}

const areaNombre = a => banco.areas[a];

function ia(texto) {
  s.chat.push({ de: 'ia', texto });
}

function armar(render) {
  const m = s.material;
  const ej = m.ejemplo;
  const base = ej ? ej.preguntas.slice(0, s.n) : desdeTexto(m.texto, s.area);
  const res = aciertosPorArea().find(a => a.area === s.area);
  const bajo = aciertosPorArea().sort((a, b) => a.pct - b.pct)[0];
  s.propuesta = {
    area: s.area,
    contexto: m.texto,
    reserva: ej ? [...ej.reserva] : [],
    motivo: res.area === bajo.area
      ? `${areaNombre(s.area)} es el área más baja del grupo (${res.pct} % de aciertos).`
      : `El grupo va en ${res.pct} % de aciertos en ${areaNombre(s.area)}.`,
    preguntas: base.map((q, i) => ({ ...q, uid: `p${Date.now().toString(36)}${i}`, estado: 'pendiente' }))
  };

  const comps = COMPETENCIAS[s.area] || COMPETENCIAS.lec;
  const cuenta = comps.map((c, k) => [c, s.propuesta.preguntas.filter(q => q.comp === k).length]).filter(([, n]) => n);
  const n = s.propuesta.preguntas.length;
  const guion = [
    () => ia(`Leí «${esc(m.nombre)}»${m.ocr ? ` con OCR (confianza ${m.ocr} %)` : ''}. ${m.ejemplo ? `Encontré estos conceptos: ${m.ejemplo.conceptos.join(', ')}.` : `Tiene ${m.texto.split(/(?<=[.!?])\s+/).length} oraciones.`}`),
    () => ia(`Crucé con el grupo ${GRUPO.nombre}: ${s.propuesta.motivo}`),
    () => ia(`Redacté ${n} ${n === 1 ? 'pregunta' : 'preguntas'} con contexto y cuatro opciones: ${cuenta.map(([c, k]) => `${k} de ${c.toLowerCase()}`).join(', ')}.`),
    () => ia('Cada pregunta trae la explicación que el estudiante verá al terminar. Revisa las claves antes de aprobar: nada llega al grupo sin tu visto bueno.')
  ];
  s.chat = [];
  s.pasos = PASOS;
  animar(guion, render, 0);
}

// Muestra los mensajes de la IA uno a uno, avanzando los pasos.
function animar(guion, render, desde) {
  s.fase = 'pensando';
  s.paso = desde;
  let k = 0;
  const avanzar = () => {
    guion[k++]();
    s.paso = Math.min(s.pasos.length, desde + k);
    if (k >= guion.length) { s.fase = 'propuesta'; s.paso = s.pasos.length; }
    if (location.hash.startsWith('#/crear')) render();
    if (k < guion.length) setTimeout(avanzar, reducir ? 0 : 900);
  };
  setTimeout(avanzar, reducir ? 0 : 500);
  render();
}

const AFIRMACION_CORTA = [[/locales/i, 'Contenidos locales'], [/articulan|global/i, 'Sentido global'], [/reflexiona|eval[uú]a/i, 'Reflexiona y evalúa']];
const PISTAS = [[/locales/i, 'La respuesta está escrita en el texto: ubícala.'], [/articulan|global/i, 'Piensa en el texto completo, no solo en una frase.'], [/reflexiona|eval[uú]a/i, 'Pregúntate qué sostiene el autor y con qué razones.']];
const segun = (tabla, a, otro) => (tabla.find(([re]) => re.test(a || '')) || [0, otro])[1];

// Material real: un PDF se lee con pdf.js y una foto con OCR; si trae preguntas, se usan tal cual.
async function procesarArchivo(f, render) {
  const esPDF = /\.pdf$/i.test(f.name) || f.type === 'application/pdf';
  const esFoto = /^image\//.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
  if (!esPDF && !esFoto) { toast('Por ahora se pueden subir PDF, fotos o texto (.txt)'); return; }
  s.material = { nombre: f.name };
  s.chat = [];
  s.pasos = esPDF ? ['Leyendo el PDF', 'Reconociendo preguntas y respuestas', 'Cruzando con los resultados del grupo', 'Armando la propuesta']
    : ['Leyendo la foto (OCR)', 'Reconociendo preguntas', 'Cruzando con los resultados del grupo', 'Armando la propuesta'];
  s.fase = 'pensando';
  s.paso = 0;
  s.progreso = 'Abriendo el archivo…';
  render();
  const vivo = () => { if (location.hash.startsWith('#/crear')) render(); };
  try {
    const r = esPDF
      ? await lineasPDF(f, (p, n) => { s.progreso = `Leyendo página ${p} de ${n}…`; vivo(); })
      : await lineasFoto(f, pct => { s.progreso = `Reconociendo el texto: ${pct} %`; vivo(); });
    ia(esPDF ? `Leí «${esc(f.name)}»: ${r.paginas} páginas.` : `Leí la foto «${esc(f.name)}» con OCR (confianza ${r.confianza} %).`);
    s.paso = 1;
    s.progreso = 'Buscando preguntas…';
    vivo();
    const qs = leerCuadernillo(r.lineas);
    if (qs.length) return armarDesdeMaterial(qs, detectarAreaCuadernillo(r.lineas) || detectarArea(r.lineas.join(' ')), f.name, !esPDF, render);
    const texto = r.lineas.filter(Boolean).join(' ').replace(/\s+/g, ' ').slice(0, 1800);
    if (texto.length < 60) throw new Error('casi no encontré texto');
    s.area = detectarArea(texto);
    s.material = { nombre: f.name, texto, ocr: esPDF ? null : r.confianza };
    armar(render);
  } catch (e) {
    ia(`No pude leer el archivo (${esc(e.message)}). Prueba con otro PDF o con una foto más nítida y derecha.`);
    s.fase = 'error';
    vivo();
  }
}

function armarDesdeMaterial(qs, area, nombre, foto, render) {
  const usables = qs.filter(q => !q.visual);
  const conClave = qs.filter(q => q.clave !== null).length;
  if (area) s.area = area;
  // Como en el examen: si hay un texto con varias preguntas, se proponen juntas.
  const grupos = [];
  for (const q of usables) {
    const g = q.contexto && grupos.find(x => x.ctx === q.contexto);
    if (g) g.qs.push(q); else grupos.push({ ctx: q.contexto, qs: [q] });
  }
  const g = grupos.find(x => x.ctx && x.qs.length >= 3);
  const elegidas = g ? g.qs.slice(0, s.n) : usables.slice(0, s.n);
  const fuente = foto ? `Foto subida por la tallerista (${nombre})` : area ? `Icfes (2026), Cuadernillo de preguntas Saber 11.º, ${banco.areas[area]}. Uso académico, sin modificar.` : nombre;
  const mapa = (q, i) => ({
    uid: `i${Date.now().toString(36)}${q.n}${i}`, estado: 'pendiente', n: q.n,
    enunciado: q.enunciado, opciones: q.opciones, clave: q.clave ?? 0, sinClave: q.clave === null,
    contexto: q.contexto, compTexto: segun(AFIRMACION_CORTA, q.afirmacion, q.afirmacion ? q.afirmacion.split(' ').slice(0, 4).join(' ') : ''),
    explicacion: q.clave !== null ? `Respuesta correcta: ${LETRAS[q.clave]}.${q.afirmacion ? ' Evalúa: ' + q.afirmacion : ''}` : 'Sin clave en el material: el comité la marca antes de aprobar.',
    pistaBase: segun(PISTAS, q.afirmacion, 'Relee el contexto y descarta las opciones que no usan sus datos.'),
    fuente
  });
  const res = aciertosPorArea().find(a => a.area === s.area);
  const bajo = aciertosPorArea().sort((a, b) => a.pct - b.pct)[0];
  s.propuesta = {
    area: s.area, importada: true, fuente,
    contexto: g ? g.ctx : '',
    reserva: usables.filter(q => !elegidas.includes(q)).map(mapa),
    motivo: res.area === bajo.area ? `${areaNombre(s.area)} es el área más baja del grupo (${res.pct} % de aciertos).` : `El grupo va en ${res.pct} % de aciertos en ${areaNombre(s.area)}.`,
    preguntas: elegidas.map(mapa)
  };
  const titulo = g ? g.ctx.split('\n')[0].slice(0, 60) : '';
  const afirm = [...new Set(s.propuesta.preguntas.map(q => q.compTexto).filter(Boolean))];
  const fuera = qs.length - usables.length;
  animar([
    () => ia(`Encontré ${qs.length} preguntas${conClave ? ` y la tabla de respuestas (${conClave} claves)` : ''}.${fuera ? ` Dejé fuera ${fuera} que dependen de imágenes o tablas.` : ''}`),
    () => ia(`Crucé con el grupo ${GRUPO.nombre}: ${s.propuesta.motivo}`),
    () => ia(g ? `Elegí las ${elegidas.length} preguntas sobre «${esc(titulo)}»: comparten el mismo texto, como en el examen${afirm.length ? `, y cubren ${afirm.map(a => a.toLowerCase()).join(', ')}` : ''}.` : `Elegí ${elegidas.length} preguntas del material${afirm.length ? ` que cubren ${afirm.map(a => a.toLowerCase()).join(', ')}` : ''}.`),
    () => ia(foto && s.propuesta.preguntas.some(q => q.sinClave) ? 'La foto no trae las respuestas: marca la clave de cada una antes de aprobar.' : 'Son preguntas oficiales: no les cambio el texto. Revísalas y apruébalas.')
  ], render, 1);
}

function ajustar(tipo, render) {
  const p = s.propuesta;
  if (tipo === 'facil') {
    p.preguntas.forEach(q => { q.pista = q.pistaBase || 'Relee el contexto y descarta las opciones que no usan sus datos.'; });
    p.preguntas.sort((a, b) => (a.comp ?? 0) - (b.comp ?? 0));
    ia('Agregué una pista a cada pregunta y dejé las de argumentación al final, para que el grupo entre en calor.');
  } else if (tipo === 'mas') {
    const nuevas = p.reserva.splice(0, 2);
    if (nuevas.length) {
      p.preguntas.push(...nuevas.map((q, i) => ({ ...q, uid: `r${Date.now().toString(36)}${i}`, estado: 'pendiente' })));
      ia(`Agregué ${nuevas.length} ${nuevas.length === 1 ? 'pregunta' : 'preguntas'} del mismo material.`);
    } else {
      ia('Con este material ya no salen preguntas distintas sin repetir. Sube otro texto y armo más.');
    }
  } else if (tipo === 'corto') {
    p.preguntas.forEach(q => { q.explicacion = q.explicacion.split(/(?<=\.)\s/)[0]; });
    ia('Dejé cada explicación en una sola oración.');
  }
  render();
}

function pedir(texto, render) {
  s.chat.push({ de: 'yo', texto: esc(texto) });
  const t = texto.toLowerCase();
  if (/f[aá]cil|simple|sencill|pista/.test(t)) return ajustar('facil', render);
  if (/m[aá]s preguntas|agrega|añade|otra/.test(t)) return ajustar('mas', render);
  if (/cort|breve|resum/.test(t)) return ajustar('corto', render);
  ia('Anoté tu pedido para el comité. En esta demo puedo hacerla más fácil, agregar preguntas o acortar las explicaciones.');
  render();
}

function tarjeta(q, i) {
  const comps = COMPETENCIAS[s.propuesta.area] || COMPETENCIAS.lec;
  const corr = s.corrigiendo === q.uid;
  const cls = q.estado === 'aprobada' ? 'e-ok' : q.estado === 'descartada' ? 'e-mal' : 'e-pend';
  const lbl = q.estado === 'aprobada' ? 'Aprobada' : q.estado === 'descartada' ? 'Descartada' : 'Por revisar';
  return `
  <div class="card prop-q ${q.estado}">
    <div class="fila-sep">
      <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="etiqueta e-azul">Pregunta ${i + 1}</span>${q.compTexto || comps[q.comp] ? `<span class="etiqueta e-gris">${esc(q.compTexto || comps[q.comp])}</span>` : ''}${q.n ? `<span class="etiqueta e-gris">Ítem ${q.n} del cuadernillo</span>` : ''}</div>
      <span class="etiqueta ${cls}">${lbl}</span>
    </div>
    ${!s.propuesta.contexto && q.contexto ? `<details class="ctx-q"><summary>Ver el texto de la pregunta</summary><p>${esc(q.contexto)}</p></details>` : ''}
    <p class="enunciado">${esc(q.enunciado)}</p>
    <ol class="opciones ${corr ? 'editable' : ''}">${q.opciones.map((o, k) => `
      <li class="${k === q.clave && !q.sinClave ? 'clave' : ''}" data-uid="${q.uid}" data-k="${k}" ${corr ? 'role="button" tabindex="0"' : ''}><span class="letra">${LETRAS[k]}</span><span>${esc(o)}</span>${k === q.clave && !q.sinClave ? `<span class="marca-clave">${s.propuesta.importada && !s.corrigiendo ? 'Clave del material' : 'Clave'}</span>` : ''}</li>`).join('')}
    </ol>
    ${q.pista ? `<p class="desc mt"><b>Pista para el estudiante:</b> ${esc(q.pista)}</p>` : ''}
    <div class="explica"><span class="lbl">Lo que verá el estudiante al terminar</span><p>${esc(q.explicacion)}</p></div>
    ${q.fuente ? `<p class="fuente-q">Fuente: ${esc(q.fuente)}</p>` : ''}
    ${q.estado === 'pendiente' ? `
    <div class="acciones">
      <button class="btn chico primario" data-q="aprobar" data-uid="${q.uid}" ${q.sinClave ? 'disabled title="Marca la clave primero"' : ''}>${ic('ok', 14)} Aprobar</button>
      <button class="btn chico" data-q="corregir" data-uid="${q.uid}">${corr ? 'Toca la opción correcta' : q.sinClave ? 'Marcar clave' : 'Corregir clave'}</button>
      <button class="btn chico peligro" data-q="descartar" data-uid="${q.uid}">${ic('x', 14)} Descartar</button>
    </div>` : `<div class="acciones"><button class="btn chico" data-q="deshacer" data-uid="${q.uid}">Deshacer</button></div>`}
  </div>`;
}

export function crear(el, render) {
  const p = s.propuesta;
  const aprob = p ? p.preguntas.filter(q => q.estado === 'aprobada') : [];
  const pend = p ? p.preguntas.filter(q => q.estado === 'pendiente').length : 0;

  el.innerHTML = `
  <div class="titulo">
    <div><h1>Crear con IA</h1><p class="sub">Sube material del colectivo y la IA arma una propuesta de práctica para el grupo ${GRUPO.nombre}</p></div>
    ${s.fase !== 'subir' ? '<button class="btn" data-acc="otra">Empezar con otro material</button>' : ''}
  </div>

  ${s.fase === 'subir' ? `
  <div class="grilla g21">
    <div class="card">
      <h2>Material</h2>
      <label class="subir mt" id="zona">
        <input type="file" id="archivo" accept=".txt,.md,.pdf,.jpg,.jpeg,.png,.webp,image/*" hidden>
        <div class="ico">${ic('descarga', 24)}</div>
        <b style="font-weight:600">Arrastra un archivo o haz clic para subirlo</b>
        <p class="desc">PDF (por ejemplo, un cuadernillo del Icfes), foto de una guía impresa o texto</p>
      </label>
      <p class="desc" style="font-size:13px;margin-top:8px">${ic('descarga', 13)} ¿Sin material a mano? Descarga el <a href="${ICFES_LECTURA}" target="_blank" rel="noopener">cuadernillo de Lectura Crítica 2026 del Icfes</a> y súbelo aquí.</p>
      <textarea id="pegar" class="campo" placeholder="O pega aquí un texto, un problema o una lectura del colectivo" rows="5"></textarea>
      <div class="mt"><span class="lbl">O prueba con un ejemplo</span>
        <div class="acciones" style="margin-top:6px">${EJEMPLOS.map(e => `<button class="btn chico" data-ej="${e.id}">${ic('hoja', 14)} ${esc(e.nombre)}</button>`).join('')}</div>
      </div>
    </div>
    <div class="card suave" style="align-self:start">
      <h2>Propuesta para</h2>
      <div class="contador"><span>Grupo</span><b>${GRUPO.nombre}</b></div>
      <label class="contador"><span>Área</span><select id="area">${Object.entries(banco.areas).map(([k, a]) => `<option value="${k}" ${k === s.area ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
      <label class="contador"><span>Preguntas</span><select id="n">${[3, 4].map(n => `<option ${n === s.n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <button class="btn primario mt" style="width:100%;justify-content:center" data-acc="armar">${ic('chispa', 16)} Armar propuesta</button>
      <p class="desc mt" style="font-size:13px">Formato de los cuadernillos del Icfes: contexto, enunciado y cuatro opciones, por competencia.</p>
    </div>
  </div>` : `
  <div class="grilla g21">
    <div class="card asistente">
      <div class="material"><span class="ico">${ic('hoja', 16)}</span><div><b>${esc(s.material.nombre)}</b><span class="desc">${s.propuesta ? esc(areaNombre(s.propuesta.area)) : 'Leyendo…'}</span></div></div>
      <div class="chat" aria-live="polite">${s.chat.map(m => `<div class="msg ${m.de}">${m.de === 'ia' ? `<span class="av">${ic('chispa', 14)}</span>` : ''}<div>${m.texto}</div></div>`).join('')}
        ${s.fase === 'pensando' ? `<div class="msg ia"><span class="av">${ic('chispa', 14)}</span><div class="escribiendo"><span></span><span></span><span></span>${s.progreso && s.paso <= 1 ? `<em>${esc(s.progreso)}</em>` : ''}</div></div>` : ''}
      </div>
      ${s.fase === 'propuesta' ? `
      <div class="atajos-ia">${[['facil', 'Más fácil'], ['mas', 'Agregar 2 preguntas'], ['corto', 'Explicaciones más cortas']].map(([k, t]) => `<button class="btn chico" data-aj="${k}">${t}</button>`).join('')}</div>
      <form class="pedir" id="pedir"><input id="pedido" placeholder="Pídele un cambio a la IA" autocomplete="off"><button class="btn primario chico" aria-label="Enviar">${ic('flecha', 14)}</button></form>` : ''}
    </div>
    <div class="card" style="align-self:start">
      <h2>Pasos</h2>
      <ul class="pasos-ia">${s.pasos.map((t, k) => `<li class="${k < s.paso ? 'hecho' : k === s.paso && s.fase === 'pensando' ? 'ahora' : ''}"><span class="pt">${k < s.paso ? ic('ok', 12) : ''}</span>${t}</li>`).join('')}</ul>
    </div>
  </div>

  ${s.fase === 'propuesta' ? `
  <div class="card oscura mt2 prop-cab">
    <div>
      <div class="lbl">Propuesta de práctica · grupo ${GRUPO.nombre}</div>
      <h2 style="font-size:20px;margin-top:4px">Refuerzo de ${esc(areaNombre(p.area))}</h2>
      <p class="desc" style="margin-top:4px">${esc(p.motivo)} ${p.preguntas.length} preguntas, unos ${p.preguntas.length * 2} minutos.</p>
    </div>
    <div class="acciones" style="margin:0">
      <button class="btn clara" data-acc="todas" ${pend ? '' : 'disabled'}>Aprobar todas</button>
      <button class="btn primario" data-acc="guardar" ${aprob.length ? '' : 'disabled'}>${estado.simulacro.publicado ? 'Agregar al banco' : 'Agregar al simulacro de hoy'} (${aprob.length})</button>
    </div>
  </div>
  ${p.contexto ? `<div class="card suave mt"><span class="lbl">Responde las preguntas de acuerdo con la siguiente información</span><p class="contexto-prop">${esc(p.contexto)}</p></div>` : ''}
  <div class="grilla g2 mt">${p.preguntas.map(tarjeta).join('')}</div>` : ''}`}`;

  // ---------- subir
  const elegir = m => { s.material = m; armar(render); };
  el.querySelectorAll('[data-ej]').forEach(b => b.addEventListener('click', () => {
    const e = EJEMPLOS.find(x => x.id === b.dataset.ej);
    s.area = e.area;
    elegir({ nombre: e.archivo, texto: e.texto, ejemplo: e });
  }));
  el.querySelector('#area')?.addEventListener('change', e => { s.area = e.target.value; });
  el.querySelector('#n')?.addEventListener('change', e => { s.n = Number(e.target.value); });
  const leerArchivo = f => {
    if (/\.(txt|md)$/i.test(f.name)) {
      f.text().then(t => {
        const e = EJEMPLOS.find(x => x.texto === t.trim());
        if (e) { s.area = e.area; return elegir({ nombre: f.name, texto: e.texto, ejemplo: e }); }
        s.area = detectarArea(t);
        elegir({ nombre: f.name, texto: t.slice(0, 1800) });
      });
    } else {
      procesarArchivo(f, render);
    }
  };
  el.querySelector('#archivo')?.addEventListener('change', e => e.target.files[0] && leerArchivo(e.target.files[0]));
  const zona = el.querySelector('#zona');
  zona?.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('encima'); });
  zona?.addEventListener('dragleave', () => zona.classList.remove('encima'));
  zona?.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) leerArchivo(f); });
  el.querySelector('[data-acc="armar"]')?.addEventListener('click', () => {
    const t = el.querySelector('#pegar').value.trim();
    if (t.length < 60) {
      const e = EJEMPLOS.find(x => x.area === s.area);
      if (!t && e) return elegir({ nombre: e.archivo, texto: e.texto, ejemplo: e });
      toast(t ? 'Pega un texto un poco más largo (al menos un párrafo)' : 'Sube un archivo, pega un texto o elige un ejemplo');
      return;
    }
    elegir({ nombre: 'Texto pegado', texto: t.slice(0, 1800) });
  });

  // ---------- propuesta
  el.querySelector('[data-acc="otra"]')?.addEventListener('click', () => { const a = s.area; s = nuevo(); s.area = a; render(); });
  el.querySelectorAll('[data-aj]').forEach(b => b.addEventListener('click', () => ajustar(b.dataset.aj, render)));
  el.querySelector('#pedir')?.addEventListener('submit', e => {
    e.preventDefault();
    const v = el.querySelector('#pedido').value.trim();
    if (v) pedir(v, render);
  });
  const buscar = uid => p.preguntas.find(q => q.uid === uid);
  el.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
    const q = buscar(b.dataset.uid);
    const a = b.dataset.q;
    if (a === 'corregir') { s.corrigiendo = s.corrigiendo === q.uid ? null : q.uid; return render(); }
    q.estado = a === 'aprobar' ? 'aprobada' : a === 'descartar' ? 'descartada' : 'pendiente';
    s.corrigiendo = null;
    render();
  }));
  el.querySelectorAll('.opciones.editable li').forEach(li => {
    const marcar = () => {
      const q = buscar(li.dataset.uid);
      q.clave = Number(li.dataset.k);
      if (q.sinClave) q.explicacion = `Respuesta correcta: ${LETRAS[q.clave]}.`;
      q.sinClave = false;
      s.corrigiendo = null;
      render();
    };
    li.addEventListener('click', marcar);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marcar(); } });
  });
  el.querySelector('[data-acc="todas"]')?.addEventListener('click', () => { p.preguntas.forEach(q => { if (q.estado === 'pendiente' && !q.sinClave) q.estado = 'aprobada'; }); render(); });
  el.querySelector('[data-acc="guardar"]')?.addEventListener('click', () => {
    const nuevas = aprob.map(q => ({
      id: q.uid, area: p.area, estado: 'aprobada', origen: null, ia: !p.importada, contexto: q.contexto || p.contexto,
      enunciado: q.enunciado, opciones: q.opciones, clave: q.clave, explicacion: q.explicacion, pista: q.pista, fuente: q.fuente
    }));
    agregarPreguntas(nuevas);
    if (!estado.simulacro.publicado) {
      estado.simulacro.ids.push(...nuevas.map(q => q.id));
      guardar();
      toast(`${nuevas.length} preguntas agregadas al simulacro de hoy`);
    } else {
      toast(`${nuevas.length} preguntas aprobadas en el banco`);
    }
    p.preguntas = p.preguntas.filter(q => q.estado !== 'aprobada');
    if (!p.preguntas.length) { s = nuevo(); location.hash = estado.simulacro.publicado ? '#/banco' : '#/simulacros?editar'; return; }
    render();
  });
}
