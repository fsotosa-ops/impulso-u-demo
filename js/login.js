import { ic, esc } from './ui.js';

const KEY = 'impulsou-sesion';

export const sesion = () => JSON.parse(localStorage.getItem(KEY) || 'null');
export const cerrarSesion = () => localStorage.removeItem(KEY);

let error = '';

export function login(el, render) {
  el.innerHTML = `
  <div class="login">
    <div class="login-marca">
      <span class="logo grande"><svg width="30" height="30" viewBox="0 0 24 24"><path d="M6 19V7m6 12v-8m6 8v-5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg></span>
      <h1>Simulacros que se repiten sin fotocopias</h1>
      <p>El colectivo pone las preguntas, la IA ayuda a ampliarlas y cada estudiante practica desde su celular, aun sin señal.</p>
    </div>
    <form class="card login-form" id="form-login" novalidate>
      <h2>Entra a tu colectivo</h2>
      <p class="desc">Para talleristas y comité pedagógico</p>
      <label class="campo-l">Correo<input id="correo" type="email" autocomplete="username" placeholder="tu@correo.com"></label>
      <label class="campo-l">Contraseña<input id="clave" type="password" autocomplete="current-password" placeholder="Tu contraseña"></label>
      <p class="error" role="alert">${esc(error)}</p>
      <button class="btn primario" style="width:100%;justify-content:center;padding:11px">Entrar</button>
      <div class="separador"><span>¿Eres estudiante?</span></div>
      <a class="btn" style="width:100%;justify-content:center" href="#/estudiante">${ic('cel', 16)} Entrar con el código de tu grupo</a>
      <p class="desc" style="font-size:12px;margin-top:12px;text-align:center">Demo: cualquier correo y contraseña sirven.</p>
    </form>
  </div>`;

  el.querySelector('#form-login').addEventListener('submit', e => {
    e.preventDefault();
    const correo = el.querySelector('#correo').value.trim();
    const clave = el.querySelector('#clave').value;
    if (!/^\S+@\S+\.\S+$/.test(correo) || !clave) {
      error = !correo ? 'Escribe tu correo.' : !clave ? 'Escribe tu contraseña.' : 'Ese correo no parece válido.';
      return render();
    }
    error = '';
    localStorage.setItem(KEY, JSON.stringify({ correo, desde: Date.now() }));
    render();
  });
}
