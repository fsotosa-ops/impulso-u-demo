// Recorrido guiado: oscurece la pantalla salvo el elemento que importa y muestra una burbuja con el paso.
// Lo usan dos cosas: la persona que abre «Ver recorrido guiado» (avanza con Siguiente o haciendo la acción
// resaltada) y la grabación del pitch, que llama a Tour.mostrar(id) y hace las acciones ella misma.

const PASOS = {
  login: { ruta: '#/', sel: '#form-login', titulo: 'Entra la tallerista', texto: 'Andrea es voluntaria de matemáticas. Escribe cualquier correo y contraseña y entra.', hasta: '.en-curso', opcional: true, lado: 'izq' },
  hoy: { ruta: '#/', sel: '.en-curso', titulo: 'El sábado ya está armado', texto: 'El simulacro del día tiene solo preguntas que aprobó el comité del colectivo.', lado: 'abajo' },
  banco: { ruta: '#/banco', sel: '.g12 > div:last-child .card', titulo: 'La IA propone, el comité decide', texto: 'Esta pregunta la propuso la IA y trae mal la clave. Corrígela y apruébala.', clic: '[data-acc="aprobar"]', lado: 'izq' },
  foto: { ruta: '#/crear', sel: '#zona', titulo: 'Sube material propio', texto: 'Una foto de una guía impresa o un PDF: la plataforma lo lee en el navegador.', lado: 'abajo' },
  propuestas: { sel: '.prop-cab', titulo: 'Preguntas listas para revisar', texto: 'Reconoce cada pregunta y el comité marca la respuesta correcta antes de usarla.', opcional: true, lado: 'abajo' },
  icfes: { sel: '#zona', titulo: 'O el cuadernillo del Icfes', texto: 'Lee las 49 preguntas oficiales con su clave y deja fuera las que dependen de imágenes.', lado: 'abajo' },
  agregar: { sel: '[data-acc="guardar"]', titulo: 'Aprueba y agrega', texto: 'Lo aprobado entra al simulacro de hoy. Lo que no se revisa, no llega al estudiante.', clic: '[data-acc="guardar"]', opcional: true, lado: 'abajo' },
  publicar: { ruta: '#/simulacros?editar', sel: '[data-acc="publicar"]', titulo: 'Publica el simulacro', texto: 'Pesa unos pocos kilobytes y se abre en cualquier celular.', clic: '[data-acc="publicar"]', lado: 'abajo' },
  whatsapp: { sel: '.modal', titulo: 'Un enlace por WhatsApp', texto: 'Un código de grupo y un mensaje listo para pegar. Nadie crea cuenta.', lado: 'der' },
  codigo: { ruta: () => '#/estudiante?c=' + (codigo() || ''), sel: '.celular', titulo: 'El estudiante entra con el código', texto: 'Sin nombre ni documento. El simulacro queda guardado en su celular.', clic: '[data-c="entrar"]', lado: 'der' },
  empezar: { sel: '[data-c="empezar"]', titulo: 'Empieza el simulacro', texto: 'Desde aquí, todo funciona aunque se vaya la señal.', clic: '[data-c="empezar"]', lado: 'der' },
  avion: { sel: '.switch', titulo: 'Se va la señal', texto: 'Activa el modo avión: el estudiante sigue respondiendo y todo queda en el teléfono.', clic: '.switch', lado: 'abajo' },
  responder: { sel: '.celular', titulo: 'Responde hasta el final', texto: 'Cada respuesta se guarda en el celular. A la derecha, lo que ve la tallerista: nada todavía.', hasta: '.res-area', lado: 'der' },
  resultado: { sel: '.celular', titulo: 'Termina sin conexión', texto: 'Ve su resultado por área y repasa lo que falló con la explicación del comité.', lado: 'der' },
  vuelve: { sel: '.switch', titulo: 'Vuelve la señal', texto: 'Desactiva el modo avión: las respuestas se envían solas.', clic: '.switch', lado: 'abajo' },
  espejo: { sel: '.espejo', titulo: 'Cero respuestas perdidas', texto: 'En ese momento, la tallerista las ve llegar a su tablero.', lado: 'izq' },
  papel: { ruta: '#/hojas', sel: '[data-acc="foto"]', titulo: 'También en papel', texto: 'Quien no tiene celular responde en papel. Andrea toma una foto de la hoja.', clic: '[data-acc="foto"]', lado: 'abajo' },
  lectura: { sel: '.lectura', titulo: 'Lee las marcas', texto: 'Si una marca no es clara, la plataforma pide digitarla en vez de adivinar.', lado: 'izq' },
  grupo: { ruta: '#/grupo', sel: '.barras', titulo: 'El grupo, no el individuo', texto: 'Aciertos por área y permanencia frente a la meta del 40 %. Sin nombres.', lado: 'izq' },
  practica: { sel: '[data-acc="pedir"]', titulo: 'La clase del próximo sábado', texto: 'Matemáticas es lo más bajo: con un clic la IA arma la práctica para el grupo.', lado: 'arriba' },
};

const ORDEN = {
  libre: ['login', 'hoy', 'banco', 'foto', 'propuestas', 'agregar', 'publicar', 'whatsapp', 'codigo', 'empezar', 'avion', 'responder', 'resultado', 'vuelve', 'espejo', 'papel', 'lectura', 'grupo', 'practica'],
  video: ['login', 'hoy', 'banco', 'foto', 'propuestas', 'icfes', 'agregar', 'publicar', 'whatsapp', 'codigo', 'avion', 'resultado', 'vuelve', 'espejo', 'papel', 'grupo', 'practica'],
};

function codigo() {
  try { return JSON.parse(localStorage.getItem('impulsou-app-v3')).simulacro.codigo; } catch { return null; }
}

let capa = null, actual = null, modo = 'video', indice = 0, sigue = 0, escucha = null, vigia = 0;

function armar() {
  if (capa) return capa;
  capa = document.createElement('div');
  capa.className = 'tour';
  capa.innerHTML = `<div class="tour-foco"></div>
    <div class="tour-globo" role="dialog" aria-live="polite">
      <div class="tour-cab"><span class="tour-n"></span><button type="button" class="tour-saltar">Saltar recorrido</button></div>
      <h3></h3><p></p>
      <div class="tour-barra"><i></i></div>
      <div class="tour-pie"><span class="tour-pista">Toca lo resaltado para seguir</span>
        <button type="button" class="btn chico tour-ant">Anterior</button>
        <button type="button" class="btn primario chico tour-sig">Siguiente</button></div>
      <span class="tour-punta"></span>
    </div>`;
  document.body.appendChild(capa);
  capa.querySelector('.tour-saltar').addEventListener('click', ocultar);
  capa.querySelector('.tour-sig').addEventListener('click', () => (modo === 'libre' ? ir(indice + 1) : ocultar()));
  capa.querySelector('.tour-ant').addEventListener('click', () => ir(indice - 1));
  return capa;
}

// Ubica el foco sobre el elemento y la burbuja a su lado, cuadro a cuadro: la vista cambia mientras se usa.
function seguir() {
  cancelAnimationFrame(sigue);
  const paso = () => {
    if (!actual) return;
    const foco = capa.querySelector('.tour-foco'), globo = capa.querySelector('.tour-globo');
    const el = actual.sel && document.querySelector(actual.sel);
    const W = innerWidth, H = innerHeight, gw = globo.offsetWidth, gh = globo.offsetHeight, m = 14;
    let x, y, lado = 'centro';
    if (el) {
      const r = el.getBoundingClientRect(), p = 8;
      Object.assign(foco.style, { display: 'block', left: r.left - p + 'px', top: r.top - p + 'px', width: r.width + 2 * p + 'px', height: r.height + 2 * p + 'px' });
      const cabe = { der: W - r.right > gw + 2 * m, izq: r.left > gw + 2 * m, abajo: H - r.bottom > gh + 2 * m, arriba: r.top > gh + 2 * m };
      lado = cabe[actual.lado] ? actual.lado : ['der', 'abajo', 'izq', 'arriba'].find(l => cabe[l]) || 'dentro';
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (lado === 'der') { x = r.right + p + m; y = cy - gh / 2; }
      else if (lado === 'izq') { x = r.left - p - m - gw; y = cy - gh / 2; }
      else if (lado === 'abajo') { x = cx - gw / 2; y = r.bottom + p + m; }
      else if (lado === 'arriba') { x = cx - gw / 2; y = r.top - p - m - gh; }
      else { x = r.right - gw - m; y = r.bottom - gh - m; }
      x = Math.max(m, Math.min(W - gw - m, x));
      y = Math.max(m + 58, Math.min(H - gh - m, y));
      const punta = capa.querySelector('.tour-punta');
      if (lado === 'der' || lado === 'izq') punta.style.cssText = `top:${Math.max(18, Math.min(gh - 18, cy - y))}px`;
      else if (lado === 'abajo' || lado === 'arriba') punta.style.cssText = `left:${Math.max(18, Math.min(gw - 18, cx - x))}px`;
    } else {
      foco.style.display = 'none';
      x = (W - gw) / 2; y = (H - gh) / 2;
    }
    globo.dataset.lado = lado;
    globo.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    capa.classList.toggle('sin-foco', !el);
    sigue = requestAnimationFrame(paso);
  };
  paso();
}

function pintar(id, n, total) {
  const p = PASOS[id];
  armar();
  actual = p;
  const g = capa.querySelector('.tour-globo');
  capa.querySelector('.tour-n').textContent = `Paso ${n} de ${total}`;
  g.querySelector('h3').textContent = p.titulo;
  g.querySelector('p').textContent = p.texto;
  capa.querySelector('.tour-barra i').style.width = `${(100 * n) / total}%`;
  const accion = !!(p.clic || p.hasta);
  capa.querySelector('.tour-sig').hidden = accion;
  capa.querySelector('.tour-pista').hidden = !accion;
  capa.querySelector('.tour-ant').hidden = modo !== 'libre' || n === 1;
  capa.querySelector('.tour-sig').textContent = n === total ? 'Terminar' : 'Siguiente';
  capa.classList.toggle('grande', modo === 'video');
  capa.classList.remove('ver');
  void capa.offsetWidth;
  capa.classList.add('ver');
  seguir();
}

// Grabación: muestra un paso por su id; la numeración sigue el orden del video.
export function mostrar(id) {
  modo = 'video';
  const orden = ORDEN.video;
  pintar(id, orden.indexOf(id) + 1, orden.length);
}

export function ocultar() {
  cancelAnimationFrame(sigue);
  clearInterval(vigia);
  if (escucha) document.removeEventListener('click', escucha, true);
  escucha = null;
  actual = null;
  capa?.classList.remove('ver');
}

const esperar = (sel, ms) => new Promise(ok => {
  const t0 = Date.now();
  const mirar = () => (document.querySelector(sel) ? ok(true) : Date.now() - t0 > ms ? ok(false) : setTimeout(mirar, 150));
  mirar();
});

async function ir(i) {
  const orden = ORDEN.libre;
  if (i >= orden.length || i < 0) return ocultar();
  indice = i;
  clearInterval(vigia);
  if (escucha) document.removeEventListener('click', escucha, true);
  const p = PASOS[orden[i]];
  if (p.ruta) {
    document.querySelector('.modal-fondo')?.remove();
    const destino = typeof p.ruta === 'function' ? p.ruta() : p.ruta;
    if (location.hash !== destino) location.hash = destino;
  }
  if (!(await esperar(p.sel, p.opcional ? 1500 : 4000)) && p.opcional) return ir(i + 1);
  pintar(orden[i], i + 1, orden.length);
  const avanzar = () => { if (indice === i) setTimeout(() => ir(i + 1), 450); };
  if (p.clic) {
    escucha = e => { if (e.target.closest(p.clic)) { document.removeEventListener('click', escucha, true); escucha = null; avanzar(); } };
    document.addEventListener('click', escucha, true);
  }
  if (p.hasta) vigia = setInterval(() => { if (document.querySelector(p.hasta)) { clearInterval(vigia); avanzar(); } }, 250);
}

// Recorrido libre: empieza desde cero para que cada paso encuentre lo que espera.
export function iniciar() {
  modo = 'libre';
  localStorage.removeItem('impulsou-sesion');
  document.getElementById('reiniciar')?.click();
  setTimeout(() => ir(0), 300);
}

window.Tour = { mostrar, ocultar, iniciar };
