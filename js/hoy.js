import { estado, contadores } from './estado.js';
import { ic, GRUPO, CICLO } from './ui.js';
import { compartir } from './simulacros.js';
import { hojasPendientes } from './hojas.js';
import { areaMasBaja, activosHoy } from './grupo.js';

// Después de publicar, el resto del grupo va respondiendo: uno cada 0,9 s hasta 31, como una mañana de sábado comprimida.
export const LLEGADAS = 31;

export function llegadasSimuladas() {
  const p = estado.simulacro.publicado;
  return p ? Math.min(LLEGADAS, Math.floor((Date.now() - p) / 900)) : 0;
}

export function respondieronDe(n) {
  const sim = n === estado.simulacro.numero ? llegadasSimuladas() : 0;
  return sim + estado.servidor.filter(s => s.simulacro === n).length;
}

export const respondieronHoy = () => respondieronDe(estado.simulacro.numero);

export function hoy(el, render) {
  const c = contadores();
  const n = respondieronHoy();
  const bajo = areaMasBaja();
  const hp = hojasPendientes();

  const sim = estado.simulacro;
  el.innerHTML = `
  <div class="titulo"><div><h1>${GRUPO.hoy}</h1><p class="sub">Grupo ${GRUPO.nombre} · semana ${GRUPO.semana} de ${GRUPO.semanas} del ciclo</p></div></div>

  ${sim.publicado ? `
  <div class="card oscura en-curso">
    <div>
      <div class="lbl">Simulacro ${sim.numero} en curso · código ${sim.codigo}</div>
      <div class="cifra" style="margin-top:6px">${n} <small>de ${GRUPO.inscritos} respondieron</small></div>
      <div class="progreso" style="margin-top:12px;max-width:520px"><div style="width:${100 * n / GRUPO.inscritos}%"></div></div>
      <p class="desc" style="margin-top:8px">Las respuestas sin señal llegan solas cuando el celular se reconecta.</p>
    </div>
    <div class="acciones" style="margin:0">
      <button class="btn primario" data-acc="compartir">${ic('compartir', 16)} Compartir enlace</button>
      <a class="btn clara" href="#/estudiante?c=${sim.codigo}">${ic('cel', 16)} Ver como estudiante</a>
    </div>
  </div>` : `
  <div class="card oscura en-curso">
    <div>
      <div class="lbl">Simulacro ${sim.numero} · hoy</div>
      <div class="cifra" style="margin-top:6px">${sim.ids.length} <small>preguntas aprobadas, listo para publicar</small></div>
      <p class="desc" style="margin-top:8px">Se comparte con un enlace por WhatsApp y se responde desde el celular, aun sin señal.</p>
    </div>
    <div class="acciones" style="margin:0">
      <a class="btn primario" href="#/simulacros?editar">${ic('hoja', 16)} Revisar y publicar</a>
    </div>
  </div>`}

  <div class="grilla g3 atajos mt">
    <a class="card" href="#/banco"><span class="ico ia">${ic('chispa')}</span><div><b>${c.pendientes} preguntas por revisar</b><span class="desc">Llegaron del lote del miércoles</span></div></a>
    <a class="card" href="#/grupo"><span class="ico am">${ic('graf')}</span><div><b>${bajo.nombre}: ${bajo.pct} % de aciertos</b><span class="desc">El área más baja del grupo</span></div></a>
    <a class="card" href="#/hojas"><span class="ico">${ic('camara')}</span><div><b>${!sim.publicado ? 'Hojas en papel' : hp ? `${hp} ${hp === 1 ? 'hoja' : 'hojas'} en papel por registrar` : 'Hojas en papel al día'}</b><span class="desc">De quienes no tienen celular</span></div></a>
  </div>

  <div class="card mt">
    <div class="fila-sep"><h2>Simulacros del ciclo</h2><span class="desc">${activosHoy()} de ${GRUPO.inscritos} estudiantes siguen activos</span></div>
    <div class="linea-ciclo mt">${CICLO.map(s => {
      const cls = s.n < sim.numero ? 'hecho' : s.n === sim.numero ? 'hoy' : '';
      const dato = s.respondieron ? `${s.respondieron} de ${GRUPO.inscritos}` : s.n === estado.simulacro.numero ? (sim.publicado ? `${n} de ${GRUPO.inscritos}` : 'hoy') : 'programado';
      return `<a href="#/simulacros" class="${cls}"><b>${s.n}. ${s.fecha}</b>${dato}</a>`;
    }).join('')}</div>
  </div>`;

  el.querySelector('[data-acc="compartir"]')?.addEventListener('click', () => compartir(render));
}
