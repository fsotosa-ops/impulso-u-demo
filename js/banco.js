import { banco as datos, estado, guardar, pregunta, estadoDe, contadores, textoDe } from './estado.js';
import { ic, esc, LETRAS, toast } from './ui.js';

let pestana = 'revisar';
let actual = null;
let corrigiendo = false;

function etiqueta(q) {
  const s = estadoDe(q);
  if (s === 'propia') return '<span class="etiqueta e-propia">Del colectivo</span>';
  const ia = `<span class="etiqueta e-ia">${ic('chispa', 12)} Propuesta por IA</span>`;
  if (s === 'aprobada') return `${ia} <span class="etiqueta e-ok">Aprobada${estado.ediciones[q.id] ? ' con corrección' : ''}</span>`;
  if (s === 'descartada') return `${ia} <span class="etiqueta e-mal">Descartada</span>`;
  return `${ia} <span class="etiqueta e-pend">Por revisar</span>`;
}

function lista(filtro) {
  const qs = datos.preguntas.filter(filtro).map(q => pregunta(q.id));
  // La propuesta con la clave errada va primero en la cola de revisión.
  return qs.sort((a, b) => (b.claveErrada && estadoDe(b) === 'pendiente' ? 1 : 0) - (a.claveErrada && estadoDe(a) === 'pendiente' ? 1 : 0));
}

const FILTROS = {
  revisar: q => q.estado !== 'propia' && estadoDe(q) === 'pendiente',
  aprobadas: q => estadoDe(q) === 'aprobada',
  colectivo: q => q.estado === 'propia',
  descartadas: q => estadoDe(q) === 'descartada'
};

function detalle(q) {
  const pend = estadoDe(q) === 'pendiente';
  const origen = q.origen && pregunta(q.origen);
  const original = datos.preguntas.find(p => p.id === q.id).clave;
  return `
  <div class="card">
    <div class="fila-sep"><div>${etiqueta(q)}</div><span class="desc">${esc(datos.areas[q.area])}</span></div>
    ${textoDe(q) ? `<div class="texto-base">${esc(textoDe(q))}</div>` : ''}
    <p class="enunciado">${esc(q.enunciado)}</p>
    <ol class="opciones ${corrigiendo ? 'editable' : ''}">${q.opciones.map((o, i) => `
      <li class="${i === q.clave ? 'clave' : ''}" data-i="${i}" ${corrigiendo ? 'role="button" tabindex="0"' : ''}>
        <span class="letra">${LETRAS[i]}</span><span>${esc(o)}</span>
        ${i === q.clave ? `<span class="marca-clave">${estado.ediciones[q.id] ? 'Clave corregida' : q.estado === 'propia' ? 'Clave' : 'Clave según la IA'}</span>` : ''}
        ${estado.ediciones[q.id] && i === original ? '<span class="marca-clave" style="color:var(--mal)">La IA marcó esta</span>' : ''}
      </li>`).join('')}</ol>
    ${corrigiendo ? '<p class="desc mt" style="color:var(--azul)">Toca la opción correcta.</p>' : ''}
    ${pend ? `
    <div class="acciones">
      <button class="btn primario" data-acc="aprobar">${ic('ok', 16)} Aprobar</button>
      <button class="btn" data-acc="corregir">${corrigiendo ? 'Listo' : 'Corregir clave'}</button>
      <button class="btn peligro" data-acc="descartar">${ic('x', 16)} Descartar</button>
    </div>` : ''}
    ${origen ? `<div class="origen">Generada a partir de: «${esc(origen.enunciado)}»</div>` : ''}
  </div>`;
}

export function banco(el, render) {
  const c = contadores();
  const qs = lista(FILTROS[pestana]);
  if (!qs.find(q => q.id === actual)) { actual = qs[0]?.id || null; corrigiendo = false; }
  const q = actual && pregunta(actual);
  const n = k => datos.preguntas.filter(FILTROS[k]).length;
  const total = { revisar: c.pendientes, aprobadas: c.iaAprobadas, colectivo: c.propias, descartadas: c.descartadas };

  el.innerHTML = `
  <div class="titulo">
    <div><h1>Banco de preguntas</h1><p class="sub">${c.total} preguntas · ${c.pctPropio} % del banco aprobado es contenido propio del colectivo</p></div>
    <button class="btn" data-acc="material">${ic('chispa', 16)} Crear con IA desde material</button>
  </div>

  <div class="card suave lote">
    <span class="ico ia">${ic('chispa')}</span>
    <div style="flex:1"><b>Lote del miércoles 21 de abril</b><div class="desc">150 propuestas generadas a partir de las 50 preguntas del colectivo. Ninguna llega a un estudiante sin aprobación.</div></div>
    ${estado.material.length ? `<span class="etiqueta e-ia">${estado.material.length} ${estado.material.length === 1 ? 'texto' : 'textos'} para el próximo lote</span>` : ''}
  </div>

  <div class="pestanas mt" role="tablist">
    ${[['revisar', 'Por revisar'], ['aprobadas', 'Aprobadas'], ['colectivo', 'Del colectivo'], ['descartadas', 'Descartadas']].map(([k, t]) => `
      <button role="tab" data-p="${k}" aria-selected="${pestana === k}">${t}<span class="n">${total[k]}</span></button>`).join('')}
  </div>

  ${qs.length ? `
  <div class="grilla g12">
    <div class="lista-q">${qs.map(x => `
      <button data-q="${x.id}" aria-current="${x.id === actual}">
        <span class="meta">${esc(datos.areas[x.area])}${estadoDe(x) !== 'propia' && pestana !== 'revisar' ? ' · IA' : ''}</span>
        <span class="q">${esc(x.enunciado)}</span>
      </button>`).join('')}
      ${n(pestana) < total[pestana] ? `<p class="desc" style="padding:6px 4px">Y ${total[pestana] - n(pestana)} más en el banco completo.</p>` : ''}
    </div>
    <div>${detalle(q)}</div>
  </div>` : `<div class="card"><h2>${pestana === 'revisar' ? 'No quedan propuestas en esta muestra' : 'Nada por aquí todavía'}</h2><p class="desc">${pestana === 'revisar' ? `El banco completo tiene ${total.revisar} por revisar.` : ''}</p></div>`}`;

  el.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { pestana = b.dataset.p; actual = null; render(); }));
  el.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => { actual = b.dataset.q; corrigiendo = false; render(); }));
  el.querySelectorAll('[data-acc]').forEach(b => b.addEventListener('click', () => {
    const acc = b.dataset.acc;
    if (acc === 'material') { location.hash = '#/crear'; return; }
    if (acc === 'corregir') { corrigiendo = !corrigiendo; return render(); }
    estado.decisiones[q.id] = acc === 'aprobar' ? 'aprobada' : 'descartada';
    guardar();
    toast(acc === 'aprobar' ? (estado.ediciones[q.id] ? 'Corregida y aprobada: ya se puede usar en un simulacro' : 'Aprobada: ya se puede usar en un simulacro') : 'Descartada');
    corrigiendo = false;
    actual = null;
    render();
  }));
  el.querySelectorAll('.opciones.editable li').forEach(li => {
    const marcar = () => {
      const i = Number(li.dataset.i);
      const original = datos.preguntas.find(p => p.id === q.id).clave;
      if (i === original) delete estado.ediciones[q.id];
      else estado.ediciones[q.id] = { clave: i };
      corrigiendo = false;
      guardar();
      render();
    };
    li.addEventListener('click', marcar);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marcar(); } });
  });
}
