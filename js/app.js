import { cargar, reiniciar, sincronizar, contadores, estado } from './estado.js';
import { hoy, llegadasSimuladas, LLEGADAS } from './hoy.js';
import { banco } from './banco.js';
import { simulacros } from './simulacros.js';
import { grupo } from './grupo.js';
import { hojas, hojasPendientes } from './hojas.js';
import { estudiante } from './simulacro.js';
import { crear } from './crear.js';
import { login, sesion, cerrarSesion } from './login.js';

const RUTAS = { '': hoy, banco, simulacros, crear, grupo, hojas, estudiante };

const vista = document.getElementById('vista');
const app = document.getElementById('app');

function rutaActual() {
  const r = location.hash.replace(/^#\/?/, '').split('?')[0];
  return r in RUTAS ? r : '';
}

export function render() {
  const ruta = rutaActual();
  const modo = ruta === 'estudiante' ? 'estudiante' : 'tallerista';
  const fuera = modo === 'tallerista' && !sesion();
  app.classList.toggle('sin-lateral', modo === 'estudiante' || fuera);
  document.querySelectorAll('[data-modo]').forEach(a => a.setAttribute('aria-current', String(a.dataset.modo === modo)));
  document.querySelectorAll('[data-ruta]').forEach(a => {
    if (a.dataset.ruta === ruta) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.getElementById('badge-banco').textContent = contadores().pendientes;
  document.getElementById('badge-hojas').textContent = hojasPendientes() || '';
  if (fuera) return login(vista, render);
  RUTAS[ruta](vista, render);
}

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); vista.focus({ preventScroll: true }); });
window.addEventListener('online', () => { sincronizar(); render(); });
window.addEventListener('offline', render);

document.getElementById('salir').addEventListener('click', () => {
  cerrarSesion();
  location.hash = '#/';
  render();
});

document.getElementById('reiniciar').addEventListener('click', () => {
  reiniciar();
  location.hash = '#/';
  render();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Mientras llegan las respuestas simuladas del grupo, las vistas del tallerista se actualizan solas.
setInterval(() => {
  const r = rutaActual();
  if (!['', 'simulacros', 'grupo'].includes(r) || document.querySelector('.modal-fondo')) return;
  if (r === 'simulacros' && document.querySelector('.sel-preguntas')) return;
  if (estado.simulacro.publicado && llegadasSimuladas() < LLEGADAS) render();
}, 900);

await cargar();
sincronizar();
render();
