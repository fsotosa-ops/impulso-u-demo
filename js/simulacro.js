import { banco, estado, guardar, pregunta, enLinea, sincronizar, textoDe } from './estado.js';
import { ic, esc, LETRAS, toast } from './ui.js';

// Lo que baja el celular: las preguntas y los textos del simulacro, nada más.
export function pesoSimulacro(ids) {
  const qs = ids.map(pregunta);
  const textos = Object.fromEntries(qs.filter(q => q.texto).map(q => [q.texto, banco.textos[q.texto]]));
  const bytes = new Blob([JSON.stringify({ preguntas: qs, textos })]).size;
  return (bytes / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1 });
}

// Peso de toda la página ya cargada (HTML, CSS, JS y banco), según el navegador.
export function medirPaquete() {
  const recursos = [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')];
  const bytes = recursos.reduce((s, r) => s + (r.decodedBodySize || 0), 0);
  return Math.max(1, Math.round(bytes / 1024));
}

function resultado(respuestas, ids) {
  const porArea = {};
  for (const id of ids) {
    const q = pregunta(id);
    const a = porArea[q.area] || (porArea[q.area] = { ok: 0, n: 0 });
    a.n++;
    if (respuestas[id] === q.clave) a.ok++;
  }
  return porArea;
}

let error = '';

function pantallaCel() {
  const sim = estado.simulacro;
  const it = estado.intento;
  const red = enLinea();
  const top = `<div class="cel-top"><span class="marca"><span class="logo"><svg width="13" height="13" viewBox="0 0 24 24"><path d="M6 19V7m6 12v-8m6 8v-5" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg></span>Impulso <b>U</b></span><span class="conexion ${red ? 'on' : 'off'}">${red ? ic('wifi', 12) + ' Con señal' : ic('avion', 12) + ' Sin señal'}</span></div>`;

  if (!it || it.simulacro !== sim.numero) {
    const pre = new URLSearchParams(location.hash.split('?')[1] || '').get('c') || '';
    return `${top}
      <h2>Entra con el código de tu grupo</h2>
      <p class="desc" style="margin-top:6px">Te lo mandó el tallerista por WhatsApp. No necesitas cuenta, nombre ni documento.</p>
      <input class="campo-codigo" id="codigo" value="${esc(pre)}" placeholder="SAB-0000" autocomplete="off" aria-label="Código de grupo">
      <p class="guardado" style="color:var(--mal)" role="alert">${esc(error)}</p>
      <div class="cel-pie"><button class="btn primario" data-c="entrar">Entrar</button></div>`;
  }

  const qs = sim.ids;
  if (it.i < 0) {
    return `${top}
      <span class="etiqueta e-ok" style="align-self:flex-start">${ic('ok', 12)} Descargado en tu celular</span>
      <h2 style="margin-top:12px">Simulacro ${sim.numero}</h2>
      <p class="desc" style="margin-top:6px">${qs.length} preguntas · ${pesoSimulacro(qs)} KB</p>
      <div class="card suave mt" style="padding:12px">
        <p style="font-size:14px">Ya puedes responder aunque se vaya la señal. Tus respuestas se guardan en el celular y se envían solas cuando vuelvas a tener conexión.</p>
      </div>
      ${it.vuelta > 1 ? `<p class="desc mt">Esta es tu vuelta ${it.vuelta} a este simulacro.</p>` : ''}
      <div class="cel-pie"><button class="btn primario" data-c="empezar">Empezar</button></div>`;
  }

  if (it.fin) {
    const res = resultado(it.respuestas, qs);
    const ok = Object.values(res).reduce((s, a) => s + a.ok, 0);
    const pendiente = estado.cola.length > 0;
    return `${top}
      <h2>Terminaste el simulacro ${sim.numero}</h2>
      <p style="font-size:15px;margin-top:6px"><b style="font-size:26px;color:var(--azul)">${ok}</b> de ${qs.length} correctas</p>
      <div class="res-area">${Object.entries(res).map(([a, r]) => `
        <div class="r"><span>${esc(banco.areas[a])}</span><b>${r.ok} de ${r.n}</b><div class="progreso"><div style="width:${100 * r.ok / r.n}%"></div></div></div>`).join('')}
      </div>
      ${(() => {
        const mal = qs.map(pregunta).filter(q => it.respuestas[q.id] !== q.clave && q.explicacion).slice(0, 3);
        return mal.length ? `<span class="lbl">Repasa lo que fallaste</span><ul class="repaso">${mal.map(q => `<li><b>${esc(q.enunciado.length > 70 ? q.enunciado.slice(0, 68) + '…' : q.enunciado)}</b>Respuesta: ${LETRAS[q.clave]}. ${esc(q.explicacion)}</li>`).join('')}</ul>` : '';
      })()}
      <div class="card ${pendiente ? 'ambar' : 'suave'}" style="padding:12px">
        <p style="font-size:14px">${pendiente ? `${ic('avion', 14)} Guardado en tu celular. Se enviará cuando vuelva la señal; no tienes que hacer nada.` : `${ic('ok', 14)} Enviado. Tu tallerista verá el resultado del grupo, no el tuyo con nombre.`}</p>
      </div>
      <div class="cel-pie"><button class="btn" data-c="repetir">Repetir</button></div>`;
  }

  const q = pregunta(qs[it.i]);
  const elegida = it.respuestas[q.id];
  return `${top}
    <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--gris)"><span>${esc(banco.areas[q.area])}</span><span>${it.i + 1} de ${qs.length}</span></div>
    <div class="progreso"><div style="width:${100 * (it.i + 1) / qs.length}%"></div></div>
    ${textoDe(q) ? `<div class="texto-base" style="margin:0 0 10px">${esc(textoDe(q))}</div>` : ''}
    <p style="font-size:15px;font-weight:500">${esc(q.enunciado)}</p>
    ${q.pista ? `<p class="desc" style="font-size:13px;margin-top:4px">Pista: ${esc(q.pista)}</p>` : ''}
    <ul class="resp">${q.opciones.map((o, k) => `
      <li><button data-r="${k}" aria-pressed="${elegida === k}"><span class="letra">${LETRAS[k]}</span><span>${esc(o)}</span></button></li>`).join('')}
    </ul>
    <p class="guardado">${elegida !== undefined ? ic('ok', 12) + ' Guardada en el celular' : ''}</p>
    <div class="cel-pie">
      <button class="btn" data-c="atras" ${it.i === 0 ? 'disabled' : ''}>Anterior</button>
      <button class="btn primario" data-c="sig" ${elegida === undefined ? 'disabled' : ''}>${it.i === qs.length - 1 ? 'Entregar' : 'Siguiente'}</button>
    </div>`;
}

export function estudiante(el, render) {
  const red = enLinea();
  const recibidos = estado.servidor.filter(s => s.origen !== 'papel').length;
  const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

  el.innerHTML = `
  <div class="escena">
    <div class="celular"><div class="pantalla">
      <div class="barra-estado"><span>${hora}</span><button data-c="avion" aria-label="${estado.avion ? 'Quitar' : 'Activar'} modo avión">${red ? ic('wifi', 15) : `<span class="avion-on">${ic('avion', 15)}</span>`}</button></div>
      <div class="app-cel" id="app-cel">${pantallaCel()}</div>
    </div></div>

    <aside class="controles" aria-label="Controles de la demo">
      <div class="titulo-ctrl">Controles de la demo</div>
      <div class="card">
        <div class="interruptor">
          <div><h3>${ic('avion', 16)} Modo avión</h3><p class="desc" style="font-size:13px">Corta la señal del celular</p></div>
          <button class="switch" role="switch" aria-checked="${estado.avion}" aria-label="Modo avión" data-c="avion"></button>
        </div>
      </div>
      <div class="card">
        <div class="contador"><span>Guardados en el celular</span><b style="color:${estado.cola.length ? 'var(--ambar-t)' : 'inherit'}">${estado.cola.length}</b></div>
        <div class="contador"><span>Recibidos por la plataforma</span><b>${recibidos}</b></div>
        <div class="contador"><span>Respuestas perdidas</span><b>0</b></div>
        <div class="contador"><span>Peso del simulacro</span><b>${pesoSimulacro(estado.simulacro.ids)} KB</b></div>
        <div class="contador"><span>Llamadas a la IA</span><b>0</b></div>
      </div>
      ${!navigator.onLine ? `<p class="etiqueta e-pend">${ic('avion', 12)} El navegador está sin red: la app abrió desde el celular</p>` : ''}
      <p class="desc" style="font-size:13px">${estado.simulacro.publicado ? `Código vigente: <b>${estado.simulacro.codigo}</b>` : 'El simulacro de hoy aún no está publicado: <a href="#/simulacros?editar">publicarlo</a>'}</p>
    </aside>
  </div>`;

  const cel = el.querySelector('#app-cel');
  const it = estado.intento;

  cel.querySelector('[data-c="entrar"]')?.addEventListener('click', () => {
    const v = cel.querySelector('#codigo').value.trim().toUpperCase();
    if (!estado.simulacro.publicado || v !== estado.simulacro.codigo) {
      error = !estado.simulacro.publicado ? 'Todavía no hay un simulacro abierto. Tu tallerista mandará el código por WhatsApp.' : v ? 'Ese código no corresponde a un simulacro abierto. Revisa el mensaje de tu tallerista.' : 'Escribe el código que llegó por WhatsApp.';
      return render();
    }
    error = '';
    estado.intento = { simulacro: estado.simulacro.numero, i: -1, respuestas: {}, vuelta: 1 };
    guardar();
    render();
  });
  cel.querySelector('#codigo')?.addEventListener('keydown', e => { if (e.key === 'Enter') cel.querySelector('[data-c="entrar"]').click(); });
  cel.querySelector('[data-c="empezar"]')?.addEventListener('click', () => { it.i = 0; guardar(); render(); });
  cel.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', () => {
    it.respuestas[estado.simulacro.ids[it.i]] = Number(b.dataset.r);
    guardar();
    render();
  }));
  cel.querySelector('[data-c="atras"]')?.addEventListener('click', () => { it.i--; guardar(); render(); });
  cel.querySelector('[data-c="sig"]')?.addEventListener('click', () => {
    if (it.i < estado.simulacro.ids.length - 1) { it.i++; guardar(); return render(); }
    it.fin = true;
    estado.cola.push({ simulacro: it.simulacro, respuestas: { ...it.respuestas }, dispositivo: estado.dispositivo, origen: 'celular', terminado: new Date().toISOString() });
    guardar();
    if (sincronizar()) toast('Enviado a tu tallerista');
    render();
  });
  cel.querySelector('[data-c="repetir"]')?.addEventListener('click', () => {
    estado.intento = { simulacro: estado.simulacro.numero, i: -1, respuestas: {}, vuelta: (it.vuelta || 1) + 1 };
    guardar();
    render();
  });
  el.querySelectorAll('[data-c="avion"]').forEach(b => b.addEventListener('click', () => {
    estado.avion = !estado.avion;
    guardar();
    const n = sincronizar();
    if (n) toast(`Volvió la señal: ${n === 1 ? '1 simulacro enviado' : n + ' simulacros enviados'}`);
    render();
  }));
}
