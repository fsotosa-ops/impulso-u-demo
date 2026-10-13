// Estado de la demo. Todo vive en localStorage: el «servidor» también, porque la página es estática.
const KEY = 'impulsou-demo-v1';

// El banco completo del colectivo: 50 propias y 150 propuestas por IA. El JSON trae solo una muestra;
// estas cifras cubren el resto para que los contadores sumen lo mismo que el Doc (50 → 200).
export const BASE = { propias: 50, iaAprobadas: 34, iaPendientes: 96, iaDescartadas: 8 };

export let banco = null;
export let estado = null;

export async function cargar() {
  const r = await fetch('data/banco.json');
  banco = await r.json();
  const guardado = localStorage.getItem(KEY);
  estado = guardado ? JSON.parse(guardado) : semilla();
  return estado;
}

function semilla() {
  return {
    decisiones: {},          // id → 'aprobada' | 'descartada'
    ediciones: {},           // id → { clave }
    simulacro: { codigo: 'SAB-4821', ids: porDefecto(), numero: 4 },
    dispositivo: Math.random().toString(16).slice(2, 6),
    intento: null,           // simulacro en curso en el celular
    cola: [],                // intentos terminados que aún no llegan a la plataforma
    servidor: [],            // intentos recibidos desde este celular
    avion: false
  };
}

export function guardar() {
  localStorage.setItem(KEY, JSON.stringify(estado));
}

export function reiniciar() {
  localStorage.removeItem(KEY);
  estado = semilla();
  guardar();
}

export function pregunta(id) {
  const q = banco.preguntas.find(p => p.id === id);
  const ed = estado.ediciones[id];
  return ed ? { ...q, ...ed } : q;
}

export function estadoDe(q) {
  return estado.decisiones[q.id] || q.estado;
}

export function aprobadas() {
  return banco.preguntas.filter(q => ['propia', 'aprobada'].includes(estadoDe(q))).map(q => pregunta(q.id));
}

function porDefecto() {
  // Dos preguntas aprobadas por área, en el orden del banco.
  const ids = [];
  const cuenta = {};
  for (const q of banco.preguntas) {
    if (!['propia', 'aprobada'].includes(q.estado)) continue;
    cuenta[q.area] = (cuenta[q.area] || 0) + 1;
    if (cuenta[q.area] <= 2) ids.push(q.id);
  }
  return ids;
}

export function contadores() {
  const muestra = banco.preguntas.filter(q => q.estado !== 'propia');
  const n = s => muestra.filter(q => estadoDe(q) === s).length;
  const iaAprobadas = BASE.iaAprobadas + n('aprobada');
  const pendientes = BASE.iaPendientes + n('pendiente');
  const descartadas = BASE.iaDescartadas + n('descartada');
  const publicables = BASE.propias + iaAprobadas;
  return {
    propias: BASE.propias, iaAprobadas, pendientes, descartadas,
    total: BASE.propias + iaAprobadas + pendientes + descartadas,
    publicables,
    pctPropio: Math.round(100 * BASE.propias / publicables)
  };
}

// Conexión: la real del navegador y el «modo avión» de la demo, que la corta a propósito.
export function enLinea() {
  return navigator.onLine && !estado.avion;
}

// Lo que queda en la cola pasa a la plataforma apenas hay conexión. No hay IA en este camino.
export function sincronizar() {
  if (!enLinea() || estado.cola.length === 0) return 0;
  const n = estado.cola.length;
  const ahora = new Date();
  for (const it of estado.cola) estado.servidor.push({ ...it, recibido: ahora.toISOString() });
  estado.cola = [];
  guardar();
  return n;
}
