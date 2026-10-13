import { banco, estado, pregunta, enLinea, sincronizar, guardar, contadores } from './estado.js';
import { ic, esc, encabezado, siguiente, fmt } from './ui.js';

// Datos de ejemplo del grupo «Sábado A»: 50 inscritos, semana 12 de 26 del ciclo de febrero a agosto.
const GRUPO = { inscritos: 50, semana: 12, semanas: 26 };
const ACTIVOS = [50, 49, 47, 46, 46, 44, 43, 42, 41, 41, 40, 39];
const AREAS_SEMILLA = { mat: [152, 380], lec: [232, 380], cie: [209, 380], soc: [251, 380], ing: [182, 380] };
const SIMULACROS_SEMILLA = 170;
const RECIBIDOS_SEMILLA = [
  ['51d2', '10:11'], ['b07a', '10:03'], ['3c1e', '9:58']
];

const hora = iso => new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
const nResp = s => Object.keys(s.respuestas).length;

// ---------------------------------------------------------------- Paso 5
export function pasoSincronizar(el, render) {
  const red = enLinea();
  const propias = [...estado.servidor].reverse();
  const respHoy = 470 + estado.servidor.reduce((s, x) => s + nResp(x), 0);

  el.innerHTML = `
  ${encabezado({ rol: 'Plataforma', icono: 'sync', titulo: 'Las respuestas llegan apenas el celular se reconecta',
    bajada: 'No hace falta que el estudiante haga nada. Lo que se respondió sin señal espera en el teléfono y se envía solo.' })}

  <div class="grilla g3">
    <div class="card"><div class="lbl">Respuestas recibidas hoy</div><div class="cifra" style="margin-top:4px">${fmt(respHoy)}</div><p class="desc">del grupo Sábado A</p></div>
    <div class="card suave"><div class="lbl">Respuestas perdidas</div><div class="cifra" style="margin-top:4px">0</div><p class="desc">requisito del MVP: cero al reconectar</p></div>
    <div class="card"><div class="lbl">Llamadas a la IA en la rendición</div><div class="cifra" style="margin-top:4px">0</div><p class="desc">el sábado no depende de ella</p></div>
  </div>

  <div class="grilla g2 mt2">
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
        <h2>Últimos envíos</h2>
        <span class="conexion ${red ? 'on' : 'off'}">${red ? ic('wifi', 12) + ' Celular con señal' : ic('avion', 12) + ' Celular sin señal'}</span>
      </div>
      <ul class="recibos mt">
        ${estado.cola.map(c => `<li class="pend">${ic('avion', 16)}<span>Celular ${esc(c.dispositivo)} · ${nResp(c)} respuestas<br><span class="desc" style="font-size:12px">Esperando señal, guardado en el teléfono</span></span><span class="etiqueta e-pend">En cola</span></li>`).join('')}
        ${propias.map(s => `<li class="nuevo">${ic(s.origen === 'papel' ? 'hoja' : 'cel', 16)}<span>${s.origen === 'papel' ? 'Hoja en papel' : 'Celular ' + esc(s.dispositivo)} · ${nResp(s)} respuestas<br><span class="desc" style="font-size:12px">Simulacro ${s.simulacro}</span></span><span class="desc">${hora(s.recibido)}</span></li>`).join('')}
        ${RECIBIDOS_SEMILLA.map(([d, h]) => `<li>${ic('cel', 16)}<span>Celular ${d} · 10 respuestas</span><span class="desc">${h}</span></li>`).join('')}
      </ul>
      ${!estado.cola.length && !propias.length ? '<p class="nota">Responde el simulacro en el paso 4 para ver llegar tus respuestas aquí.</p>' : ''}
      ${estado.cola.length && estado.avion ? `<button class="btn primario mt" data-acc="senal">${ic('wifi', 16)} Devolverle la señal al celular</button>` : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card"><h3>${ic('candado', 16)} Qué guarda la plataforma</h3>
        <ul class="lista" style="margin-top:8px">
          <li>Un identificador anónimo del celular, el código de grupo y las respuestas.</li>
          <li>No guarda nombre, documento ni teléfono: son datos de menores (Ley 1581).</li>
          <li>Una copia diaria que se puede restaurar en menos de 4 horas.</li>
        </ul></div>
      <div class="card ambar"><div class="lbl">Antes de febrero se prueba</div>
        <p style="font-size:14px;margin-top:4px">Que 500 estudiantes respondan a la vez sin errores. Un sábado del piloto son unos 250: cinco colectivos de 50 en la misma ventana de cuatro horas.</p></div>
    </div>
  </div>
  ${siguiente('tablero', 'Ver el tablero del grupo')}`;

  el.querySelector('[data-acc="senal"]')?.addEventListener('click', () => {
    estado.avion = false;
    guardar();
    sincronizar();
    render();
  });
}

// ---------------------------------------------------------------- Paso 6
function aciertosPorArea() {
  const a = Object.fromEntries(Object.entries(AREAS_SEMILLA).map(([k, [ok, n]]) => [k, { ok, n }]));
  for (const s of estado.servidor) {
    for (const [id, r] of Object.entries(s.respuestas)) {
      const q = pregunta(id);
      a[q.area].n++;
      if (r === q.clave) a[q.area].ok++;
    }
  }
  return Object.entries(a).map(([k, v]) => ({ area: k, pct: Math.round(100 * v.ok / v.n) }));
}

function graficoActivos() {
  const W = 560, H = 240, L = 46, R = 160, T = 14, B = 30;
  const x = s => L + (s - 1) / (GRUPO.semanas - 1) * (W - L - R);
  const y = p => T + (1 - p / 100) * (H - T - B);
  const pts = ACTIVOS.map((v, i) => [x(i + 1), y(100 * v / GRUPO.inscritos), v, i + 1]);
  const ult = pts[pts.length - 1];
  const linea = (p, txt, color) => `
    <line x1="${L}" x2="${x(GRUPO.semanas)}" y1="${y(p)}" y2="${y(p)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text class="rot" x="${x(GRUPO.semanas) + 8}" y="${y(p) + 4}" style="fill:${color}">${txt}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Estudiantes activos por semana: de 50 en la semana 1 a 39 en la semana 12">
    ${[0, 50, 100].map(p => `<line x1="${L}" x2="${x(GRUPO.semanas)}" y1="${y(p)}" y2="${y(p)}" stroke="#E8EEF7"/><text class="eje" x="${L - 6}" y="${y(p) + 4}" text-anchor="end">${p} %</text>`).join('')}
    ${[1, 12, 26].map(s => `<text class="eje" x="${x(s)}" y="${H - 8}" text-anchor="middle">${s === 26 ? 'examen' : 'sem. ' + s}</text>`).join('')}
    ${linea(40, 'Meta: 40 %', '#176BFF')}
    ${linea(20, 'Ciclo anterior: 20 %', '#8494AA')}
    <polyline points="${pts.map(p => p[0] + ',' + p[1]).join(' ')}" fill="none" stroke="#176BFF" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="transparent"><title>Semana ${p[3]}: ${p[2]} de ${GRUPO.inscritos} activos</title></circle>`).join('')}
    <circle cx="${ult[0]}" cy="${ult[1]}" r="4.5" fill="#176BFF" stroke="#fff" stroke-width="2"/>
    <text class="rot" x="${ult[0] + 8}" y="${ult[1] - 8}" font-weight="600">${ult[2]} de ${GRUPO.inscritos} activos</text>
  </svg>`;
}

export function pasoTablero(el) {
  const areas = aciertosPorArea().sort((a, b) => a.pct - b.pct);
  const bajo = areas[0];
  const prom = (SIMULACROS_SEMILLA + estado.servidor.length) / GRUPO.inscritos;
  const c = contadores();
  const revisadas = Object.keys(estado.decisiones).length;
  const tocadas = Object.keys(estado.decisiones).filter(id => estado.decisiones[id] === 'descartada' || estado.ediciones[id]).length;

  el.innerHTML = `
  ${encabezado({ rol: 'Tallerista', icono: 'graf', titulo: 'El tallerista ve al grupo, no a cada estudiante',
    bajada: 'Aciertos por área y cuántos siguen activos. Con eso prepara la clase y el simulacro de la semana siguiente.',
    derecha: `<div class="card" style="padding:10px 14px"><div class="desc" style="font-size:13px">Grupo Sábado A · ${GRUPO.inscritos} inscritos</div><b>Semana ${GRUPO.semana} de ${GRUPO.semanas}</b></div>` })}

  <div class="grilla g2">
    <div class="card">
      <h2>Aciertos del grupo por área</h2>
      <p class="desc">Todos los simulacros del ciclo, incluidas las respuestas de esta demo</p>
      <div class="barras">${areas.map(a => `
        <div class="r ${a === bajo ? 'bajo' : ''}" title="${esc(banco.areas[a.area])}: ${a.pct} % de aciertos"><span>${esc(banco.areas[a.area])}</span><div class="pista"><div style="width:${a.pct}%"></div></div><span class="v">${a.pct} %</span></div>`).join('')}
      </div>
      <div class="card ambar mt" style="padding:10px 12px"><div class="lbl">Para el próximo sábado</div>
        <p style="font-size:14px;margin-top:2px">${esc(banco.areas[bajo.area])} es el área más baja. El comité puede pedir más preguntas de esa área en el próximo lote y el tallerista la refuerza en clase.</p></div>
    </div>
    <div class="card grafico">
      <h2>Estudiantes que siguen activos</h2>
      <p class="desc" style="margin-bottom:10px">Respondieron al menos un simulacro en las últimas dos semanas</p>
      ${graficoActivos()}
      <p class="nota">La North Star cuenta a quien sigue activo las 4 semanas previas al Saber 11 y presentó al menos 4 simulacros.</p>
    </div>
  </div>

  <div class="grilla g3 mt">
    <div class="card"><div class="lbl">Simulacros por estudiante</div>
      <div class="cifra" style="margin-top:4px">${prom.toLocaleString('es-CO', { maximumFractionDigits: 1 })} <span style="font-size:16px;color:var(--gris);font-weight:600">de 8</span></div>
      <div class="progreso" style="margin:8px 0 4px"><div style="width:${100 * prom / 8}%"></div></div>
      <p class="desc">en el ciclo anterior, uno solo en papel</p></div>
    <div class="card"><div class="lbl">Contenido propio en el banco</div>
      <div class="cifra" style="margin-top:4px">${c.pctPropio} %</div>
      <p class="desc">contrapeso: al menos 20 % con textos del colectivo</p></div>
    <div class="card"><div class="lbl">Revisión real del banco</div>
      <div class="cifra" style="margin-top:4px">${revisadas ? `${tocadas} de ${revisadas}` : '—'}</div>
      <p class="desc">${revisadas ? 'propuestas corregidas o descartadas en esta sesión' : 'revisa propuestas en el paso 2 para ver este dato'}</p></div>
  </div>

  <div class="aviso mt">${ic('candado')}<div><b>Sin nombres.</b> El tablero no permite abrir a un estudiante en particular ni muestra puntajes individuales o proyecciones: el estudiante entra con el código del grupo.</div></div>
  <p class="nota">Datos de demostración. Lo que el grupo falló define las preguntas y la clase de la semana siguiente.</p>
  ${siguiente('viable', 'Por qué es viable')}`;
}
