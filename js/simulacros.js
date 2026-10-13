import { banco, estado, guardar, aprobadas, pregunta, textoDe } from './estado.js';
import { ic, esc, CICLO, GRUPO, toast, modal } from './ui.js';
import { pesoSimulacro } from './simulacro.js';
import { respondieronDe } from './hoy.js';

let editando = false;
let seleccion = [];

function enlace() {
  return `${location.href.split('#')[0]}#/estudiante?c=${estado.simulacro.codigo}`;
}

export function compartir(render) {
  const s = estado.simulacro;
  const msg = `Simulacro ${s.numero} del preu: entra con el código ${s.codigo} en ${enlace()}`;
  modal(`
    <div class="fila-sep"><h2>Compartir el simulacro ${s.numero}</h2><button class="btn chico" data-cerrar aria-label="Cerrar">${ic('x', 14)}</button></div>
    <div class="mt"><div class="lbl">Código del grupo</div><div class="codigo">${s.codigo}</div></div>
    <div class="wa mt"><div style="font-size:12px;color:#2E7D4F;font-weight:600;margin-bottom:4px">${ic('chat', 13)} Mensaje para el grupo de WhatsApp</div>${esc(msg)}</div>
    <div class="acciones">
      <a class="btn primario" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${ic('chat', 16)} Enviar por WhatsApp</a>
      <button class="btn" id="copiar">Copiar enlace</button>
      <button class="btn" id="pdf">${ic('descarga', 16)} PDF para imprimir</button>
    </div>
    <p class="desc mt">${s.ids.length} preguntas · ${pesoSimulacro(s.ids)} KB por celular · funciona sin conexión una vez abierto</p>`,
  m => {
    m.querySelector('#copiar').addEventListener('click', () => { navigator.clipboard?.writeText(enlace()); toast('Enlace copiado'); });
    m.querySelector('#pdf').addEventListener('click', imprimir);
  });
}

function imprimir() {
  const s = estado.simulacro;
  const w = window.open('', '_blank');
  if (!w) return toast('Permite ventanas emergentes para generar el PDF');
  const qs = s.ids.map(pregunta);
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Simulacro ${s.numero} · ${s.codigo}</title>
    <style>body{font-family:Avenir Next,Arial,sans-serif;max-width:720px;margin:30px auto;color:#10213A;font-size:13px}h1{font-size:18px}
    .q{margin:14px 0;break-inside:avoid}.t{background:#f3f6fb;padding:8px;border-radius:6px;margin-bottom:6px}ol{margin:4px 0 0 18px}</style></head><body>
    <h1>Simulacro ${s.numero} · Grupo ${GRUPO.nombre} · código ${s.codigo}</h1>
    ${qs.map((q, i) => `<div class="q">${textoDe(q) ? `<div class="t">${esc(textoDe(q))}</div>` : ''}<b>${i + 1}.</b> ${esc(q.enunciado)}
      <ol type="A">${q.opciones.map(o => `<li>${esc(o)}</li>`).join('')}</ol></div>`).join('')}
    <script>print()<\/script></body></html>`);
  w.document.close();
}

function editor(el, render) {
  const lista = aprobadas();
  const kb = pesoSimulacro(seleccion);
  el.innerHTML = `
  <div class="titulo">
    <div><h1>Simulacro ${estado.simulacro.numero} · ${GRUPO.hoy.toLowerCase()}</h1><p class="sub">Solo aparecen preguntas aprobadas por el comité</p></div>
    <div class="acciones" style="margin:0"><button class="btn" data-acc="cancelar">Cancelar</button><button class="btn primario" data-acc="publicar" ${seleccion.length ? '' : 'disabled'}>Publicar</button></div>
  </div>
  <div class="grilla g21">
    <div class="card">
      <div class="fila-sep"><h2>Preguntas aprobadas</h2><span class="desc">${seleccion.length} elegidas</span></div>
      <ul class="sel-preguntas mt">${lista.map(q => `
        <li><label><input type="checkbox" value="${q.id}" ${seleccion.includes(q.id) ? 'checked' : ''}>
          <span><span class="desc" style="font-size:12px">${esc(banco.areas[q.area])} · ${q.estado === 'propia' ? 'del colectivo' : 'IA, aprobada'}</span><br>${esc(q.enunciado)}</span></label></li>`).join('')}
      </ul>
    </div>
    <div class="card suave" style="align-self:start">
      <h2>Resumen</h2>
      ${Object.entries(banco.areas).map(([k, a]) => `<div class="contador"><span>${a}</span><b>${seleccion.filter(id => pregunta(id).area === k).length}</b></div>`).join('')}
      <div class="contador"><span>Peso por celular</span><b>${kb} KB</b></div>
      <p class="desc mt">Se abre con el enlace y queda guardado en el celular: se responde aunque se vaya la señal.</p>
    </div>
  </div>`;

  el.querySelectorAll('.sel-preguntas input').forEach(cb => cb.addEventListener('change', () => {
    seleccion = cb.checked ? [...seleccion, cb.value] : seleccion.filter(id => id !== cb.value);
    const orden = banco.preguntas.map(q => q.id);
    seleccion.sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
    render();
  }));
  el.querySelector('[data-acc="cancelar"]').addEventListener('click', () => { editando = false; render(); });
  el.querySelector('[data-acc="publicar"]').addEventListener('click', () => {
    estado.simulacro = { codigo: 'SAB-' + String(1000 + Math.floor(Math.random() * 9000)), ids: [...seleccion], numero: estado.simulacro.numero, publicado: Date.now() };
    estado.intento = null;
    guardar();
    editando = false;
    render();
    toast(`Simulacro ${estado.simulacro.numero} publicado`);
    compartir(render);
  });
}

export function simulacros(el, render) {
  if (location.hash.includes('?editar') && !estado.simulacro.publicado) {
    history.replaceState(null, '', '#/simulacros');
    editando = true;
    seleccion = [...estado.simulacro.ids];
  }
  if (editando) return editor(el, render);
  const num = estado.simulacro.numero;
  const pub = !!estado.simulacro.publicado;
  el.innerHTML = `
  <div class="titulo">
    <div><h1>Simulacros</h1><p class="sub">Ciclo febrero – agosto 2027 · grupo ${GRUPO.nombre}</p></div>
    ${pub ? `<button class="btn primario" data-acc="compartir">${ic('compartir', 16)} Compartir simulacro ${num}</button>` : `<button class="btn primario" data-acc="nuevo">${ic('hoja', 16)} Preparar simulacro ${num}</button>`}
  </div>
  <div class="card" style="padding:6px 8px;overflow-x:auto">
    <table class="tabla">
      <thead><tr><th>Simulacro</th><th>Fecha</th><th>Preguntas</th><th>Respondieron</th><th class="barra-mini"></th><th>Estado</th><th></th></tr></thead>
      <tbody>${CICLO.map(s => {
        const r = s.respondieron ?? (s.n === num && pub ? respondieronDe(s.n) : null);
        const est = s.n < num ? '<span class="etiqueta e-gris">Cerrado</span>' : s.n === num ? (pub ? '<span class="etiqueta e-azul">En curso</span>' : '<span class="etiqueta e-ia">Por publicar</span>') : '<span class="etiqueta e-pend">Programado</span>';
        return `<tr class="${s.n === num ? 'hoy' : ''}">
          <td><b style="font-weight:600">${s.n}</b>${s.nombre ? ` · ${s.nombre}` : ''}</td>
          <td>${s.fecha}</td>
          <td class="num">${s.n === num ? estado.simulacro.ids.length : s.n < num ? 10 : '—'}</td>
          <td class="num">${r != null ? `${r} de ${GRUPO.inscritos}` : '—'}</td>
          <td class="barra-mini">${r != null ? `<div class="progreso"><div style="width:${100 * r / GRUPO.inscritos}%"></div></div>` : ''}</td>
          <td>${est}</td>
          <td style="text-align:right">${s.n === num ? (pub ? `<button class="btn chico" data-acc="compartir">${ic('compartir', 14)} Compartir</button>` : '<button class="btn chico primario" data-acc="nuevo">Preparar</button>') : ''}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>
  </div>
  <p class="desc mt">En el ciclo anterior hubo un solo simulacro, impreso. La meta es que cada estudiante presente 8.</p>`;

  el.querySelectorAll('[data-acc="nuevo"]').forEach(b => b.addEventListener('click', () => { editando = true; seleccion = [...estado.simulacro.ids]; render(); }));
  el.querySelectorAll('[data-acc="compartir"]').forEach(b => b.addEventListener('click', () => compartir(render)));
}
