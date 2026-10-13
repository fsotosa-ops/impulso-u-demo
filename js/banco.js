import { banco, estado, guardar, pregunta, estadoDe, contadores } from './estado.js';
import { ic, esc, encabezado, siguiente, LETRAS, fmt } from './ui.js';

function textoBase(q) {
  return q.texto ? `<div class="texto-base">${esc(banco.textos[q.texto])}<div style="font-size:12px;margin-top:4px;color:var(--gris)">Texto escrito por el colectivo</div></div>` : '';
}

function opciones(q, { editable = false } = {}) {
  return `<ol class="opciones ${editable ? 'editable' : ''}">${q.opciones.map((o, i) => `
    <li class="${i === q.clave ? 'clave' : ''}" data-i="${i}" ${editable ? 'role="button" tabindex="0"' : ''}><span class="letra">${LETRAS[i]}</span><span>${esc(o)}</span></li>`).join('')}</ol>`;
}

const etiqueta = q => {
  const s = estadoDe(q);
  if (s === 'propia') return '<span class="etiqueta e-propia">Del colectivo</span>';
  const ia = '<span class="etiqueta e-ia">' + ic('chispa', 12) + ' Propuesta por IA</span>';
  if (s === 'aprobada') return ia + ' <span class="etiqueta e-ok">Aprobada</span>';
  if (s === 'descartada') return ia + ' <span class="etiqueta e-mal">Descartada</span>';
  return ia + ' <span class="etiqueta e-pend">Pendiente de revisión</span>';
};

// ---------------------------------------------------------------- Paso 1
let fuente = 'm1';

export function pasoIA(el, render) {
  const c = contadores();
  const propias = banco.preguntas.filter(q => q.estado === 'propia');
  const q = pregunta(fuente);
  const hijas = banco.preguntas.filter(p => p.origen === fuente).map(p => pregunta(p.id));
  el.innerHTML = `
  ${encabezado({ rol: 'Entre semana · IA', icono: 'chispa', titulo: 'La IA propone preguntas a partir de las del colectivo',
    bajada: 'Corre en lote, de noche y fuera del sábado. Ninguna propuesta llega a un estudiante sin pasar por el comité.' })}

  <div class="grilla g3">
    <div class="card"><div class="lbl">Escritas por el colectivo</div><div class="cifra" style="margin-top:4px">${c.propias}</div><p class="desc">las que hoy arma a mano</p></div>
    <div class="card"><div class="lbl">Propuestas por la IA</div><div class="cifra" style="margin-top:4px">150</div><p class="desc">a partir de esas 50, en el último lote</p></div>
    <div class="card oscura"><div class="lbl">Banco del colectivo</div><div class="cifra" style="margin-top:4px">${fmt(c.total)}</div><p class="desc">de 50 a 200 preguntas, todas revisables</p></div>
  </div>

  <div class="card mt2">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <h2>De una pregunta del colectivo salen varias</h2>
      <div class="pestanas" role="group" aria-label="Pregunta de origen">${propias.map(p => `
        <button type="button" data-f="${p.id}" aria-pressed="${p.id === fuente}">${esc(banco.areas[p.area])}${p.id === 'm2' ? ' 2' : ''}</button>`).join('')}</div>
    </div>
    <div class="derivadas mt">
      <div class="card suave mini">${etiqueta(q)}${textoBase(q)}<p class="enunciado">${esc(q.enunciado)}</p></div>
      <span class="flecha">${ic('flecha', 26)}</span>
      <div style="display:flex;flex-direction:column;gap:8px">${hijas.map(h => `
        <div class="card mini">${etiqueta(h)}<p class="enunciado">${esc(h.enunciado)}</p></div>`).join('')}
      </div>
    </div>
    <p class="nota">Los textos propios del colectivo, como este sobre el costo del transporte o el de lectura crítica, entran al banco junto con las preguntas que la IA deriva de ellos.</p>
  </div>

  <div class="aviso mt">${ic('wifi')}<div><b>El sábado no se llama a la IA.</b> El servicio de IA reparte su capacidad entre todos sus clientes, así que no garantiza respuesta en un momento dado. Por eso la IA solo trabaja en este lote; si se satura, se corre otra noche y el simulacro no se entera.</div></div>
  ${siguiente('comite', 'Revisar las propuestas')}`;

  el.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { fuente = b.dataset.f; render(); }));
}

// ---------------------------------------------------------------- Paso 2
let corrigiendo = false;

function pendientes() {
  // La propuesta con la clave errada va primero: es la que muestra para qué está el comité.
  return banco.preguntas
    .filter(q => q.estado !== 'propia' && estadoDe(q) === 'pendiente')
    .sort((a, b) => (b.claveErrada ? 1 : 0) - (a.claveErrada ? 1 : 0))
    .map(q => pregunta(q.id));
}

export function pasoComite(el, render) {
  const c = contadores();
  const pend = pendientes();
  const q = pend[0];
  const revisadas = Object.keys(estado.decisiones).map(id => pregunta(id));
  const origen = q && pregunta(q.origen);

  el.innerHTML = `
  ${encabezado({ rol: 'Comité del colectivo', icono: 'grupo', titulo: 'El comité revisa cada propuesta antes de publicarla',
    bajada: 'Aprueba, corrige la clave o descarta. Solo lo aprobado puede entrar a un simulacro.' })}

  <div class="grilla g5 contadores">
    <div class="card"><div class="lbl">Del colectivo</div><div class="cifra">${c.propias}</div></div>
    <div class="card"><div class="lbl">IA aprobadas</div><div class="cifra">${c.iaAprobadas}</div></div>
    <div class="card"><div class="lbl">Por revisar</div><div class="cifra" style="color:var(--ambar-t)">${c.pendientes}</div></div>
    <div class="card"><div class="lbl">Descartadas</div><div class="cifra" style="color:var(--gris)">${c.descartadas}</div></div>
    <div class="card ${c.pctPropio >= 20 ? 'suave' : 'ambar'}"><div class="lbl">Contenido propio</div><div class="cifra">${c.pctPropio} %</div><p class="desc" style="font-size:12px">del banco publicable; mínimo 20 %</p></div>
  </div>

  <div class="revision mt">
    ${q ? `
    <div class="card pregunta-card">
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">${etiqueta(q)}<span class="desc" style="font-size:13px">${esc(banco.areas[q.area])} · ${pend.length} de esta muestra por revisar</span></div>
      ${textoBase(q)}
      <p class="enunciado">${esc(q.enunciado)}</p>
      ${opciones(q, { editable: corrigiendo })}
      ${corrigiendo ? '<p class="nota" style="color:var(--azul)">Toca la opción correcta para marcarla como clave.</p>' : ''}
      <div class="acciones">
        <button class="btn primario" data-acc="aprobar">${ic('ok', 16)} Aprobar</button>
        <button class="btn" data-acc="corregir" aria-pressed="${corrigiendo}">${corrigiendo ? 'Listo' : 'Corregir la clave'}</button>
        <button class="btn peligro" data-acc="descartar">${ic('x', 16)} Descartar</button>
      </div>
    </div>` : `
    <div class="card"><h2>No quedan propuestas en esta muestra</h2><p class="desc">El banco real tiene ${c.pendientes} por revisar; el comité las revisa a su ritmo y nada se publica sin pasar por aquí.</p></div>`}
    <div style="display:flex;flex-direction:column;gap:14px">
      ${origen ? `<div class="card suave mini"><div class="lbl">Sale de esta pregunta del colectivo</div><p class="enunciado">${esc(origen.enunciado)}</p></div>` : ''}
      <div class="card ambar"><div class="lbl">Qué mira el comité</div>
        <ul class="lista" style="margin-top:6px">
          <li>Que la clave sea la correcta. La meta es menos de 2 % de claves erradas.</li>
          <li>Que el texto hable de la vida del grupo y no solo del examen.</li>
          <li>Que no apruebe todo sin leer: si nunca edita, la revisión dejó de ser real.</li>
        </ul></div>
      ${revisadas.length ? `<div class="card"><h3>Revisadas en esta sesión</h3><ul class="lista historial" style="margin-top:8px">${revisadas.map(r => `
        <li><span>${esc(r.enunciado.slice(0, 54))}…</span>${estado.decisiones[r.id] === 'aprobada' ? `<span class="etiqueta e-ok">${estado.ediciones[r.id] ? 'Corregida y aprobada' : 'Aprobada'}</span>` : '<span class="etiqueta e-mal">Descartada</span>'}</li>`).join('')}</ul></div>` : ''}
    </div>
  </div>
  ${siguiente('publicar', 'Armar el simulacro')}`;

  el.querySelectorAll('[data-acc]').forEach(b => b.addEventListener('click', () => {
    const acc = b.dataset.acc;
    if (acc === 'corregir') { corrigiendo = !corrigiendo; return render(); }
    estado.decisiones[q.id] = acc === 'aprobar' ? 'aprobada' : 'descartada';
    corrigiendo = false;
    guardar();
    render();
  }));
  el.querySelectorAll('.opciones.editable li').forEach(li => {
    const marcar = () => {
      const i = Number(li.dataset.i);
      const original = banco.preguntas.find(p => p.id === q.id).clave;
      if (i === original) delete estado.ediciones[q.id];
      else estado.ediciones[q.id] = { clave: i };
      guardar();
      render();
    };
    li.addEventListener('click', marcar);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marcar(); } });
  });
}
