import { banco, estado, pregunta } from './estado.js';
import { ic, esc, GRUPO } from './ui.js';
import { prepararCrear } from './crear.js';

// Datos de ejemplo del grupo, semanas 1 a 12.
const ACTIVOS = [50, 49, 47, 46, 46, 44, 43, 42, 41, 41, 40, 39];
const AREAS_SEMILLA = { mat: [152, 380], lec: [232, 380], cie: [209, 380], soc: [251, 380], ing: [182, 380] };
const SIMULACROS_SEMILLA = 170;

export const activosHoy = () => ACTIVOS[ACTIVOS.length - 1];

export function aciertosPorArea() {
  const a = Object.fromEntries(Object.entries(AREAS_SEMILLA).map(([k, [ok, n]]) => [k, { ok, n }]));
  for (const s of estado.servidor) {
    for (const [id, r] of Object.entries(s.respuestas)) {
      const q = pregunta(id);
      a[q.area].n++;
      if (r === q.clave) a[q.area].ok++;
    }
  }
  return Object.entries(a).map(([k, v]) => ({ area: k, nombre: banco.areas[k], pct: Math.round(100 * v.ok / v.n) }));
}

export const areaMasBaja = () => aciertosPorArea().sort((a, b) => a.pct - b.pct)[0];

function graficoActivos() {
  const W = 560, H = 240, L = 46, R = 160, T = 14, B = 30;
  const x = s => L + (s - 1) / (GRUPO.semanas - 1) * (W - L - R);
  const y = p => T + (1 - p / 100) * (H - T - B);
  const pts = ACTIVOS.map((v, i) => [x(i + 1), y(100 * v / GRUPO.inscritos), v, i + 1]);
  const ult = pts[pts.length - 1];
  const ref = (p, txt, color) => `
    <line x1="${L}" x2="${x(GRUPO.semanas)}" y1="${y(p)}" y2="${y(p)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text class="rot" x="${x(GRUPO.semanas) + 8}" y="${y(p) + 5}" style="fill:${color}">${txt}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Estudiantes activos por semana: de 50 en la semana 1 a ${ult[2]} en la semana ${ult[3]}">
    ${[0, 50, 100].map(p => `<line x1="${L}" x2="${x(GRUPO.semanas)}" y1="${y(p)}" y2="${y(p)}" stroke="#E8EEF7"/><text class="eje" x="${L - 6}" y="${y(p) + 5}" text-anchor="end">${p} %</text>`).join('')}
    ${[1, 12, 26].map(s => `<text class="eje" x="${x(s)}" y="${H - 6}" text-anchor="middle">${s === 26 ? 'examen' : 'sem. ' + s}</text>`).join('')}
    ${ref(40, 'Meta: 40 %', '#176BFF')}
    ${ref(20, 'Ciclo pasado: 20 %', '#8494AA')}
    <polyline points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="#176BFF" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="transparent"><title>Semana ${p[3]}: ${p[2]} de ${GRUPO.inscritos} activos</title></circle>`).join('')}
    <circle cx="${ult[0]}" cy="${ult[1]}" r="5" fill="#176BFF" stroke="#fff" stroke-width="2"/>
    <text class="rot" x="${ult[0] + 10}" y="${ult[1] - 9}" font-weight="600">${ult[2]} de ${GRUPO.inscritos}</text>
  </svg>`;
}

export function grupo(el) {
  const areas = aciertosPorArea().sort((a, b) => a.pct - b.pct);
  const bajo = areas[0];
  const prom = (SIMULACROS_SEMILLA + estado.servidor.length) / GRUPO.inscritos;

  el.innerHTML = `
  <div class="titulo">
    <div><h1>Grupo ${GRUPO.nombre}</h1><p class="sub">${GRUPO.inscritos} inscritos · semana ${GRUPO.semana} de ${GRUPO.semanas} · resultados del grupo, sin datos individuales</p></div>
  </div>

  <div class="grilla g3">
    <div class="card"><div class="lbl">Siguen activos</div><div class="cifra azul" style="margin-top:4px">${activosHoy()} <small>de ${GRUPO.inscritos}</small></div><p class="desc">respondieron en las últimas 2 semanas</p></div>
    <div class="card"><div class="lbl">Simulacros por estudiante</div><div class="cifra azul" style="margin-top:4px">${prom.toLocaleString('es-CO', { maximumFractionDigits: 1 })} <small>de 8</small></div><div class="progreso" style="margin-top:10px"><div style="width:${100 * prom / 8}%"></div></div></div>
    <div class="card ambar"><div class="lbl">Área más baja</div><div class="cifra" style="margin-top:4px">${bajo.pct} %</div><p class="desc" style="color:var(--ambar-t)">${esc(bajo.nombre)}</p></div>
  </div>

  <div class="grilla g2 mt">
    <div class="card">
      <h2>Aciertos por área</h2>
      <p class="desc">Todos los simulacros del ciclo</p>
      <div class="barras">${areas.map(a => `
        <div class="r ${a === bajo ? 'bajo' : ''}" title="${esc(a.nombre)}: ${a.pct} % de aciertos"><span>${esc(a.nombre)}</span><div class="pista"><div style="width:${a.pct}%"></div></div><span class="v">${a.pct} %</span></div>`).join('')}
      </div>
      <div class="acciones">
        <button class="btn" data-acc="pedir">${ic('chispa', 16)} Crear práctica de ${esc(bajo.nombre)} con IA</button>
      </div>
    </div>
    <div class="card grafico">
      <h2>Estudiantes activos por semana</h2>
      <p class="desc" style="margin-bottom:10px">Meta del piloto: que 40 % llegue activo al examen</p>
      ${graficoActivos()}
    </div>
  </div>`;

  el.querySelector('[data-acc="pedir"]').addEventListener('click', () => { prepararCrear(bajo.area); location.hash = '#/crear'; });
}
