export const ic = (n, s = 18) => `<svg width="${s}" height="${s}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const LETRAS = ['A', 'B', 'C', 'D'];

export const PASOS = [
  { ruta: 'ia', corto: 'La IA propone', rol: 'Entre semana · IA' },
  { ruta: 'comite', corto: 'El comité aprueba', rol: 'Comité del colectivo' },
  { ruta: 'publicar', corto: 'Se publica', rol: 'Tallerista' },
  { ruta: 'sabado', corto: 'Responden', rol: 'Sábado · estudiantes' },
  { ruta: 'sincronizar', corto: 'Llegan las respuestas', rol: 'Plataforma' },
  { ruta: 'tablero', corto: 'Ven al grupo', rol: 'Tallerista' }
];

export function encabezado({ rol, icono, titulo, bajada, derecha = '' }) {
  return `<header class="encabezado"><div>
    <span class="rol">${ic(icono, 15)}${esc(rol)}</span>
    <h1>${titulo}</h1>
    ${bajada ? `<p>${bajada}</p>` : ''}
  </div>${derecha}</header>`;
}

export function siguiente(ruta, texto) {
  return `<div class="mt2" style="display:flex;justify-content:flex-end"><a class="btn primario" href="#/${ruta}">${texto} ${ic('flecha', 16)}</a></div>`;
}

export const fmt = n => n.toLocaleString('es-CO');
