import { estado, guardar } from './estado.js';
import { ic, LETRAS, toast } from './ui.js';

// Tres hojas de ejemplo del sábado; la segunda trae una marca dudosa en la pregunta 7.
const HOJAS = [
  { marcas: [2, 2, 0, 0, 1, 1, 0, 1, 1, 2], dudosa: -1, confianza: 99.6 },
  { marcas: [2, 1, 0, 0, 1, 1, 3, 1, 1, 0], dudosa: 6, confianza: 96.1 },
  { marcas: [1, 2, 0, 1, 1, 0, 0, 1, 2, 1], dudosa: -1, confianza: 99.3 }
];

let foto = false;
let digitada = null;

const registradas = () => estado.servidor.filter(s => s.origen === 'papel' && s.simulacro === estado.simulacro.numero).length;
export const hojasPendientes = () => estado.simulacro.publicado ? Math.max(0, HOJAS.length - registradas()) : 0;

export function hojas(el, render) {
  const i = registradas();
  const h = HOJAS[i];
  const n = estado.simulacro.ids.length;

  if (!estado.simulacro.publicado) {
    el.innerHTML = `<div class="titulo"><div><h1>Hojas en papel</h1><p class="sub">Simulacro ${estado.simulacro.numero}</p></div></div>
      <div class="card"><h2>El simulacro de hoy todavía no está publicado</h2><p class="desc">Publícalo para imprimir las hojas y registrar las de quienes no tienen celular.</p>
      <div class="acciones"><a class="btn primario" href="#/simulacros?editar">Revisar y publicar</a></div></div>`;
    return;
  }
  el.innerHTML = `
  <div class="titulo"><div><h1>Hojas en papel</h1><p class="sub">Simulacro ${estado.simulacro.numero} · ${hojasPendientes()} por registrar · ${i} registradas</p></div></div>
  ${!h ? `<div class="card"><h2>${ic('ok', 18)} Todas las hojas de hoy están registradas</h2><p class="desc">Ya cuentan en los resultados del grupo.</p></div>` :
  !foto ? `
  <div class="subir">
    <div class="ico">${ic('camara', 24)}</div>
    <h2 style="font-size:17px;font-weight:600">Toma una foto de la hoja ${i + 1}</h2>
    <p class="desc" style="margin:4px 0 14px">La plataforma lee las marcas. Si no está segura de alguna, te la deja para digitar.</p>
    <button class="btn primario" data-acc="foto">${ic('camara', 16)} Tomar foto</button>
  </div>` : `
  <div class="card hoja">
    <div class="hoja-papel" aria-label="Foto de la hoja de respuestas">
      <div style="font-weight:600;font-size:11px;color:#333">Simulacro ${estado.simulacro.numero} · ${estado.simulacro.codigo}</div>
      ${h.marcas.slice(0, n).map((m, k) => `<div class="r"><b>${k + 1}</b>${[0, 1, 2, 3].map(o => `<span class="o ${o === m ? (k === h.dudosa ? 'd' : 'x') : ''}"></span>`).join('')}</div>`).join('')}
    </div>
    <div>
      <div class="fila-sep">
        <h2>Lectura de la hoja ${i + 1}</h2>
        <span class="etiqueta ${h.confianza >= 99 ? 'e-ok' : 'e-pend'}">Confianza ${h.confianza.toLocaleString('es-CO')} %</span>
      </div>
      <p class="desc" style="margin:4px 0 12px">${h.dudosa >= 0 ? `La marca de la pregunta ${h.dudosa + 1} no es clara. Digítala para registrar la hoja.` : 'Todas las marcas se leyeron bien.'}</p>
      <ul class="lectura">${h.marcas.slice(0, n).map((m, k) => k === h.dudosa ? `
        <li class="duda"><span class="letra">${k + 1}</span><select id="duda" aria-label="Respuesta de la pregunta ${k + 1}"><option value="">¿?</option>${LETRAS.map((l, o) => `<option value="${o}" ${digitada === o ? 'selected' : ''}>${l}</option>`).join('')}</select></li>` : `
        <li><span class="letra">${k + 1}</span>${LETRAS[m]}</li>`).join('')}
      </ul>
      <div class="acciones">
        <button class="btn primario" data-acc="registrar" ${h.dudosa >= 0 && digitada === null ? 'disabled' : ''}>${ic('ok', 16)} Registrar hoja</button>
        <button class="btn" data-acc="repetir">Repetir foto</button>
      </div>
    </div>
  </div>`}`;

  el.querySelector('[data-acc="foto"]')?.addEventListener('click', () => { foto = true; digitada = null; render(); });
  el.querySelector('[data-acc="repetir"]')?.addEventListener('click', () => { foto = false; render(); });
  el.querySelector('#duda')?.addEventListener('change', e => { digitada = e.target.value === '' ? null : Number(e.target.value); render(); });
  el.querySelector('[data-acc="registrar"]')?.addEventListener('click', () => {
    const respuestas = {};
    estado.simulacro.ids.forEach((id, k) => { respuestas[id] = k === h.dudosa ? digitada : h.marcas[k % h.marcas.length]; });
    estado.servidor.push({ simulacro: estado.simulacro.numero, respuestas, origen: 'papel', recibido: new Date().toISOString() });
    guardar();
    foto = false;
    digitada = null;
    toast(`Hoja ${i + 1} registrada`);
    render();
  });
}
