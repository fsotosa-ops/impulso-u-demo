export const ic = (n, s = 18) => `<svg width="${s}" height="${s}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const LETRAS = ['A', 'B', 'C', 'D'];

export const fmt = n => n.toLocaleString('es-CO');

// Datos del grupo de la demo: ciclo de febrero a agosto de 2027, hoy es el sábado de la semana 12.
export const GRUPO = { nombre: 'Sábado A', inscritos: 50, semana: 12, semanas: 26, hoy: 'Sábado 24 de abril' };

export const CICLO = [
  { n: 1, fecha: '6 feb', nombre: 'Diagnóstico', respondieron: 50 },
  { n: 2, fecha: '27 feb', respondieron: 46 },
  { n: 3, fecha: '20 mar', respondieron: 43 },
  { n: 4, fecha: '10 abr', respondieron: 41 },
  { n: 5, fecha: '24 abr' },
  { n: 6, fecha: '22 may' },
  { n: 7, fecha: '19 jun' },
  { n: 8, fecha: '24 jul', nombre: 'Simulacro final' }
];

export function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.innerHTML = `${ic('ok', 16)} ${esc(msg)}`;
  t.classList.add('ver');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('ver'), 2600);
}

export function modal(html, alAbrir) {
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(fondo);
  const cerrar = () => fondo.remove();
  fondo.addEventListener('click', e => { if (e.target === fondo || e.target.closest('[data-cerrar]')) cerrar(); });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { cerrar(); document.removeEventListener('keydown', esc); } });
  alAbrir?.(fondo.querySelector('.modal'), cerrar);
  fondo.querySelector('button, a, textarea, input')?.focus();
}
