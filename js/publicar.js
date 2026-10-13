import { banco, estado, guardar, aprobadas, pregunta } from './estado.js';
import { ic, esc, encabezado, siguiente, LETRAS } from './ui.js';
import { pesoSimulacro } from './simulacro.js';

let seleccion = null;
let recienPublicado = false;
let hoja = 0;
let hojaRegistrada = {};

// Dos hojas de ejemplo: una se lee limpia y la otra trae una marca dudosa en la pregunta 7.
const HOJAS = [
  { marcas: [2, 2, 0, 0, 1, 1, 0, 1, 1, 2], dudosa: -1, confianza: 99.6 },
  { marcas: [2, 1, 0, 0, 1, 1, 3, 1, 1, 0], dudosa: 6, confianza: 96.1 }
];

function nuevoCodigo() {
  return 'SAB-' + String(1000 + Math.floor(Math.random() * 9000));
}

function enlace() {
  const base = location.href.split('#')[0];
  return `${base}#/sabado?c=${estado.simulacro.codigo}`;
}

export function pasoPublicar(el, render) {
  if (!seleccion) seleccion = [...estado.simulacro.ids];
  const lista = aprobadas();
  const kb = pesoSimulacro(seleccion);
  const msg = `Simulacro ${estado.simulacro.numero} del preuniversitario. Entra con el código ${estado.simulacro.codigo}: ${enlace()}`;
  const h = HOJAS[hoja];
  const qs = estado.simulacro.ids.map(pregunta);

  el.innerHTML = `
  ${encabezado({ rol: 'Tallerista', icono: 'chat', titulo: 'El tallerista arma el simulacro y lo comparte por WhatsApp',
    bajada: 'Elige entre las preguntas aprobadas por el comité y manda un enlace al grupo. No hay bot ni cuentas que crear.' })}

  <div class="grilla g2">
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
        <h2>Preguntas aprobadas</h2><span class="desc">${seleccion.length} elegidas</span>
      </div>
      <p class="desc" style="margin-bottom:10px">Solo aparecen las que el comité aprobó. Esta es la muestra de la demo; el banco real tiene más.</p>
      <ul class="sel-preguntas">${lista.map(q => `
        <li><label><input type="checkbox" value="${q.id}" ${seleccion.includes(q.id) ? 'checked' : ''}>
          <span><span class="desc" style="font-size:12px">${esc(banco.areas[q.area])} · ${q.estado === 'propia' ? 'del colectivo' : 'propuesta por IA, aprobada'}</span><br>${esc(q.enunciado)}</span></label></li>`).join('')}
      </ul>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card ${recienPublicado ? 'suave' : ''}">
        <div class="lbl">${recienPublicado ? 'Publicado' : 'Simulacro vigente'}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-top:4px;flex-wrap:wrap">
          <div><div class="desc">Código de grupo</div><div class="codigo-grupo">${estado.simulacro.codigo}</div></div>
          <div class="desc" style="text-align:right">Simulacro ${estado.simulacro.numero}${estado.simulacro.numero <= 8 ? " de 8" : ""}<br>${estado.simulacro.ids.length} preguntas</div>
        </div>
        <div class="wa mt">
          <div style="font-size:12px;color:#2E7D4F;font-weight:600;margin-bottom:4px">${ic('chat', 13)} Mensaje para el grupo de WhatsApp</div>
          <div style="word-break:break-word">${esc(msg)}</div>
        </div>
        <div class="acciones">
          <a class="btn" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${ic('chat', 16)} Abrir en WhatsApp</a>
          <button class="btn" data-acc="copiar">Copiar enlace</button>
        </div>
      </div>
      <div class="card">
        <h3>Publicar con la selección actual</h3>
        <p class="desc" style="margin:4px 0 10px">Genera un código nuevo. El paquete pesa <b>${kb} KB</b>; el límite es 1 MB para que baje con pocos datos.</p>
        <button class="btn primario" data-acc="publicar" ${seleccion.length === 0 ? 'disabled' : ''}>Publicar simulacro ${estado.simulacro.numero + 1}</button>
        <p class="nota">Plan B: si la plataforma no está disponible, el mismo simulacro se imprime en PDF.</p>
      </div>
    </div>
  </div>

  <div class="card mt2">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div><h2>${ic('hoja', 18)} Quien no tiene celular responde en papel</h2>
      <p class="desc">El tallerista toma una foto de la hoja y la plataforma lee las marcas. Si la lectura no llega al 99 % de confianza, se digita a mano.</p></div>
      <div class="pestanas" role="group" aria-label="Hoja de ejemplo">
        <button type="button" data-h="0" aria-pressed="${hoja === 0}">Hoja 1</button>
        <button type="button" data-h="1" aria-pressed="${hoja === 1}">Hoja 2</button>
      </div>
    </div>
    <div class="hoja mt">
      <div class="hoja-papel" aria-label="Foto de la hoja de respuestas">
        <div style="font-weight:600;font-size:11px;color:#333">Simulacro ${estado.simulacro.numero} · ${estado.simulacro.codigo}</div>
        ${h.marcas.map((m, i) => `<div class="r"><b>${i + 1}</b>${[0, 1, 2, 3].map(k => `<span class="o ${k === m ? (i === h.dudosa ? 'd' : 'x') : ''}"></span>`).join('')}</div>`).join('')}
      </div>
      <div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span class="etiqueta ${h.confianza >= 99 ? 'e-ok' : 'e-pend'}">Confianza de lectura: ${h.confianza.toLocaleString('es-CO')} %</span>
          <span class="desc">Ejemplo fijo: la lectura por foto está simulada.</span>
        </div>
        <ol class="opciones mt" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px">${h.marcas.map((m, i) => `
          <li style="${i === h.dudosa ? 'border-color:var(--ambar-borde);background:var(--ambar)' : ''}"><span class="letra">${i + 1}</span><span>${i === h.dudosa ? 'Dudosa: digitar' : 'Marcó ' + LETRAS[m]}</span></li>`).join('')}</ol>
        <div class="acciones">
          ${hojaRegistrada[hoja] ? `<span class="etiqueta e-ok">${ic('ok', 13)} Registrada: cuenta en el tablero del grupo</span>` :
            `<button class="btn ${h.confianza >= 99 ? 'primario' : ''}" data-acc="registrar">${h.confianza >= 99 ? 'Registrar la hoja' : 'Digitar la pregunta 7 y registrar'}</button>`}
        </div>
      </div>
    </div>
  </div>
  ${siguiente('sabado', 'Ir al sábado')}`;

  el.querySelectorAll('.sel-preguntas input').forEach(cb => cb.addEventListener('change', () => {
    seleccion = cb.checked ? [...seleccion, cb.value] : seleccion.filter(id => id !== cb.value);
    // Mantiene el orden del banco.
    const orden = banco.preguntas.map(q => q.id);
    seleccion.sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
    render();
  }));
  el.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => { hoja = Number(b.dataset.h); render(); }));
  el.querySelector('[data-acc="publicar"]')?.addEventListener('click', () => {
    estado.simulacro = { codigo: nuevoCodigo(), ids: [...seleccion], numero: estado.simulacro.numero + 1 };
    estado.intento = null;
    guardar();
    recienPublicado = true;
    hojaRegistrada = {};
    render();
  });
  el.querySelector('[data-acc="copiar"]')?.addEventListener('click', e => {
    navigator.clipboard?.writeText(enlace());
    e.currentTarget.textContent = 'Enlace copiado';
  });
  el.querySelector('[data-acc="registrar"]')?.addEventListener('click', () => {
    // En la hoja 2 el tallerista digita la marca dudosa: la deja como la opción correcta de esa pregunta.
    const respuestas = {};
    qs.forEach((q, i) => {
      const m = i === h.dudosa ? q.clave : h.marcas[i % h.marcas.length];
      respuestas[q.id] = m;
    });
    estado.servidor.push({ simulacro: estado.simulacro.numero, respuestas, origen: 'papel', recibido: new Date().toISOString() });
    guardar();
    hojaRegistrada[hoja] = true;
    render();
  });
}
