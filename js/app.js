import { cargar, reiniciar, sincronizar } from './estado.js';
import { PASOS, ic } from './ui.js';
import { inicio, viable } from './inicio.js';
import { pasoIA, pasoComite } from './banco.js';
import { pasoPublicar } from './publicar.js';
import { pasoSabado } from './simulacro.js';
import { pasoSincronizar, pasoTablero } from './tablero.js';

const RUTAS = {
  '': inicio,
  ia: pasoIA,
  comite: pasoComite,
  publicar: pasoPublicar,
  sabado: pasoSabado,
  sincronizar: pasoSincronizar,
  tablero: pasoTablero,
  viable
};

const vista = document.getElementById('vista');
const barra = document.getElementById('recorrido');

function rutaActual() {
  const r = location.hash.replace(/^#\/?/, '').split('?')[0];
  return r in RUTAS ? r : '';
}

function pintarRecorrido(ruta) {
  const i = PASOS.findIndex(p => p.ruta === ruta);
  barra.hidden = i < 0;
  if (i < 0) return;
  const ant = i > 0 ? PASOS[i - 1].ruta : '';
  const sig = i < PASOS.length - 1 ? PASOS[i + 1].ruta : 'viable';
  barra.innerHTML = `
    <span class="titulo">Una semana con Impulso U</span>
    <div class="pasos">${PASOS.map((p, k) => `
      <a href="#/${p.ruta}" class="${k < i ? 'hecho' : ''}" ${k === i ? 'aria-current="step"' : ''}>
        <span class="barra"></span><span class="t">${k + 1}. ${p.corto}</span></a>`).join('')}
    </div>
    <div class="botones">
      <a class="btn chico" href="#/${ant}" aria-label="Paso anterior">${ic('atras', 16)}</a>
      <a class="btn chico primario" href="#/${sig}">${i < PASOS.length - 1 ? 'Siguiente' : 'Por qué es viable'} ${ic('flecha', 16)}</a>
    </div>`;
}

export function render() {
  const ruta = rutaActual();
  document.querySelectorAll('[data-ruta]').forEach(a => {
    if (a.dataset.ruta === ruta) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  pintarRecorrido(ruta);
  RUTAS[ruta](vista, render);
}

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); vista.focus({ preventScroll: true }); });
window.addEventListener('online', () => { sincronizar(); render(); });
window.addEventListener('offline', render);

document.getElementById('reiniciar').addEventListener('click', () => {
  reiniciar();
  location.hash = '#/';
  render();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

await cargar();
sincronizar();
render();
