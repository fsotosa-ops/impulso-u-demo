import { banco, estado, guardar, agregarPreguntas } from './estado.js';
import { ic, esc, LETRAS, GRUPO, toast } from './ui.js';
import { EJEMPLOS, COMPETENCIAS, desdeTexto, detectarArea } from './generador.js';
import { aciertosPorArea } from './grupo.js';

const PASOS = ['Leyendo el material', 'Cruzando con los resultados del grupo', 'Redactando preguntas al estilo Saber 11', 'Escribiendo la explicación para el estudiante'];
const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;

let s = nuevo();

function nuevo() {
  return { fase: 'subir', material: null, area: 'mat', n: 4, paso: 0, chat: [], propuesta: null, corrigiendo: null };
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
    () => ia(`Leí «${esc(m.nombre)}». ${m.ejemplo ? `Encontré estos conceptos: ${m.ejemplo.conceptos.join(', ')}.` : `Tiene ${m.texto.split(/(?<=[.!?])\s+/).length} oraciones.`}${m.simulado ? ' <span class="desc">(En esta demo, el contenido de PDF y fotos se reemplaza por un material de ejemplo.)</span>' : ''}`),
    () => ia(`Crucé con el grupo ${GRUPO.nombre}: ${s.propuesta.motivo}`),
    () => ia(`Redacté ${n} ${n === 1 ? 'pregunta' : 'preguntas'} con contexto y cuatro opciones: ${cuenta.map(([c, k]) => `${k} de ${c.toLowerCase()}`).join(', ')}.`),
    () => ia('Cada pregunta trae la explicación que el estudiante verá al terminar. Revisa las claves antes de aprobar: nada llega al grupo sin tu visto bueno.')
  ];
  s.fase = 'pensando';
  s.paso = 0;
  const avanzar = () => {
    guion[s.paso]();
    s.paso++;
    if (s.paso >= guion.length) s.fase = 'propuesta';
    if (location.hash.startsWith('#/crear')) render();
    if (s.paso < guion.length) setTimeout(avanzar, reducir ? 0 : 900);
  };
  setTimeout(avanzar, reducir ? 0 : 500);
  render();
}

function ajustar(tipo, render) {
  const p = s.propuesta;
  if (tipo === 'facil') {
    p.preguntas.forEach(q => { q.pista = q.pistaBase || 'Relee el contexto y descarta las opciones que no usan sus datos.'; });
    p.preguntas.sort((a, b) => a.comp - b.comp);
    ia('Agregué una pista a cada pregunta y dejé las de argumentación al final, para que el grupo entre en calor.');
  } else if (tipo === 'mas') {
    const nuevas = p.reserva.splice(0, 2);
    if (nuevas.length) {
      p.preguntas.push(...nuevas.map((q, i) => ({ ...q, uid: `r${Date.now().toString(36)}${i}`, estado: 'pendiente' })));
      ia(`Agregué ${nuevas.length} ${nuevas.length === 1 ? 'pregunta' : 'preguntas'} sobre el mismo contexto.`);
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
      <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="etiqueta e-azul">Pregunta ${i + 1}</span><span class="etiqueta e-gris">${esc(comps[q.comp] || '')}</span></div>
      <span class="etiqueta ${cls}">${lbl}</span>
    </div>
    <p class="enunciado">${esc(q.enunciado)}</p>
    <ol class="opciones ${corr ? 'editable' : ''}">${q.opciones.map((o, k) => `
      <li class="${k === q.clave ? 'clave' : ''}" data-uid="${q.uid}" data-k="${k}" ${corr ? 'role="button" tabindex="0"' : ''}><span class="letra">${LETRAS[k]}</span><span>${esc(o)}</span>${k === q.clave ? '<span class="marca-clave">Clave</span>' : ''}</li>`).join('')}
    </ol>
    ${q.pista ? `<p class="desc mt"><b>Pista para el estudiante:</b> ${esc(q.pista)}</p>` : ''}
    <div class="explica"><span class="lbl">Lo que verá el estudiante al terminar</span><p>${esc(q.explicacion)}</p></div>
    ${q.estado === 'pendiente' ? `
    <div class="acciones">
      <button class="btn chico primario" data-q="aprobar" data-uid="${q.uid}">${ic('ok', 14)} Aprobar</button>
      <button class="btn chico" data-q="corregir" data-uid="${q.uid}">${corr ? 'Toca la opción correcta' : 'Corregir clave'}</button>
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
        <input type="file" id="archivo" accept=".txt,.md,.pdf,.docx,.jpg,.jpeg,.png" hidden>
        <div class="ico">${ic('descarga', 24)}</div>
        <b style="font-weight:600">Arrastra un archivo o haz clic para subirlo</b>
        <p class="desc">Texto, guía en PDF o foto de una guía</p>
      </label>
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
      <div class="material"><span class="ico">${ic('hoja', 16)}</span><div><b>${esc(s.material.nombre)}</b><span class="desc">${esc(areaNombre(s.propuesta?.area || s.area))}</span></div></div>
      <div class="chat" aria-live="polite">${s.chat.map(m => `<div class="msg ${m.de}">${m.de === 'ia' ? `<span class="av">${ic('chispa', 14)}</span>` : ''}<div>${m.texto}</div></div>`).join('')}
        ${s.fase === 'pensando' ? `<div class="msg ia"><span class="av">${ic('chispa', 14)}</span><div class="escribiendo"><span></span><span></span><span></span></div></div>` : ''}
      </div>
      ${s.fase === 'propuesta' ? `
      <div class="atajos-ia">${[['facil', 'Más fácil'], ['mas', 'Agregar 2 preguntas'], ['corto', 'Explicaciones más cortas']].map(([k, t]) => `<button class="btn chico" data-aj="${k}">${t}</button>`).join('')}</div>
      <form class="pedir" id="pedir"><input id="pedido" placeholder="Pídele un cambio a la IA" autocomplete="off"><button class="btn primario chico" aria-label="Enviar">${ic('flecha', 14)}</button></form>` : ''}
    </div>
    <div class="card" style="align-self:start">
      <h2>Pasos</h2>
      <ul class="pasos-ia">${PASOS.map((t, k) => `<li class="${k < s.paso ? 'hecho' : k === s.paso && s.fase === 'pensando' ? 'ahora' : ''}"><span class="pt">${k < s.paso ? ic('ok', 12) : ''}</span>${t}</li>`).join('')}</ul>
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
  <div class="card suave mt"><span class="lbl">Responde las preguntas de acuerdo con la siguiente información</span><p style="margin-top:6px;font-size:14.5px">${esc(p.contexto)}</p></div>
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
      const e = EJEMPLOS.find(x => x.area === s.area) || EJEMPLOS[0];
      s.area = e.area;
      elegir({ nombre: f.name, texto: e.texto, ejemplo: e, simulado: true });
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
    const marcar = () => { buscar(li.dataset.uid).clave = Number(li.dataset.k); s.corrigiendo = null; render(); };
    li.addEventListener('click', marcar);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marcar(); } });
  });
  el.querySelector('[data-acc="todas"]')?.addEventListener('click', () => { p.preguntas.forEach(q => { if (q.estado === 'pendiente') q.estado = 'aprobada'; }); render(); });
  el.querySelector('[data-acc="guardar"]')?.addEventListener('click', () => {
    const nuevas = aprob.map(q => ({
      id: q.uid, area: p.area, estado: 'aprobada', origen: null, ia: true, contexto: p.contexto,
      enunciado: q.enunciado, opciones: q.opciones, clave: q.clave, explicacion: q.explicacion, pista: q.pista
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
