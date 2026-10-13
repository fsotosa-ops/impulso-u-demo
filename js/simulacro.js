import { banco, estado, guardar, pregunta, enLinea, sincronizar } from './estado.js';
import { ic, esc, encabezado, siguiente, LETRAS } from './ui.js';

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
let aviso = '';

function pantallaCel() {
  const sim = estado.simulacro;
  const it = estado.intento;
  const red = enLinea();
  const top = `<div class="cel-top"><span>Impulso U</span><span class="conexion ${red ? 'on' : 'off'}">${red ? ic('wifi', 12) + ' Con señal' : ic('avion', 12) + ' Sin señal'}</span></div>`;

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
        <div class="r"><span>${esc(banco.areas[a])}</span><b>${r.ok} de ${r.n}</b><div class="b"><div style="width:${100 * r.ok / r.n}%"></div></div></div>`).join('')}
      </div>
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
    ${q.texto ? `<div class="texto-base" style="margin:0 0 10px">${esc(banco.textos[q.texto])}</div>` : ''}
    <p style="font-size:15px;font-weight:500">${esc(q.enunciado)}</p>
    <ul class="resp">${q.opciones.map((o, k) => `
      <li><button data-r="${k}" aria-pressed="${elegida === k}"><span class="letra">${LETRAS[k]}</span><span>${esc(o)}</span></button></li>`).join('')}
    </ul>
    <p class="guardado">${elegida !== undefined ? ic('ok', 12) + ' Guardada en el celular' : ''}</p>
    <div class="cel-pie">
      <button class="btn" data-c="atras" ${it.i === 0 ? 'disabled' : ''}>Anterior</button>
      <button class="btn primario" data-c="sig" ${elegida === undefined ? 'disabled' : ''}>${it.i === qs.length - 1 ? 'Entregar' : 'Siguiente'}</button>
    </div>`;
}

export function pasoSabado(el, render) {
  const red = enLinea();
  const sinRedReal = !navigator.onLine;
  const recibidos = estado.servidor.filter(s => s.origen !== 'papel').length;
  const hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });

  el.innerHTML = `
  ${encabezado({ rol: 'Sábado · estudiantes', icono: 'cel', titulo: 'El estudiante responde en su celular, con o sin señal',
    bajada: 'Es el único momento en que el estudiante usa la plataforma. Durante la rendición no se llama a la IA ni a ningún servicio externo.' })}
  <div class="sabado">
    <div class="celular"><div class="pantalla">
      <div class="barra-estado"><span>${hora}</span><span class="iconos">${red ? ic('wifi', 15) : `<span class="avion-on">${ic('avion', 15)}</span>`}</span></div>
      <div class="app-cel" id="app-cel">${pantallaCel()}</div>
    </div></div>

    <div class="control">
      <div class="card">
        <div class="interruptor">
          <div><h2>${ic('avion', 17)} Modo avión</h2>
          <p class="desc">Córtale la señal al celular a mitad del simulacro. Las respuestas se guardan en el teléfono y llegan solas al reconectar.</p></div>
          <button class="switch" role="switch" aria-checked="${estado.avion}" aria-label="Modo avión" data-c="avion"></button>
        </div>
        ${sinRedReal ? '<p class="nota" style="color:var(--ambar-t)">El navegador tampoco tiene red: la página está abriendo desde el celular.</p>' : '<p class="nota">La página también queda guardada en el celular: si la recargas sin red, abre igual.</p>'}
        ${aviso ? `<p class="etiqueta e-ok mt" role="status">${ic('sync', 13)} ${esc(aviso)}</p>` : ''}
      </div>

      <div class="cola">
        <div class="card ${estado.cola.length ? 'ambar' : ''}"><div class="lbl">En el celular, sin enviar</div><div class="cifra">${estado.cola.length}</div><p class="desc">simulacros terminados</p></div>
        <div class="card"><div class="lbl">Recibidos por la plataforma</div><div class="cifra">${recibidos}</div><p class="desc">desde este celular</p></div>
      </div>

      <div class="card">
        <h3>Lo que el MVP debe cumplir antes del piloto</h3>
        <ul class="chequeos mt">
          <li><span style="color:var(--ok)">${ic('ok')}</span><span>Peso del simulacro (límite: 1 MB)</span><span class="v">${pesoSimulacro(estado.simulacro.ids)} KB</span></li>
          <li><span style="color:var(--ok)">${ic('ok')}</span><span>Llamadas a la IA durante la rendición</span><span class="v">0</span></li>
          <li><span style="color:var(--ok)">${ic('ok')}</span><span>Datos personales que se piden</span><span class="v">Ninguno</span></li>
          <li><span style="color:var(--ok)">${ic('ok')}</span><span>Respuestas perdidas al reconectar</span><span class="v">0</span></li>
        </ul>
      </div>

      <div class="aviso">${ic('info')}<div>El código de este sábado es <b>${estado.simulacro.codigo}</b>. Lo publicó el tallerista en el paso anterior.</div></div>
    </div>
  </div>
  ${siguiente('sincronizar', 'Ver qué recibe la plataforma')}`;

  const cel = el.querySelector('#app-cel');
  const it = estado.intento;

  cel.querySelector('[data-c="entrar"]')?.addEventListener('click', () => {
    const v = cel.querySelector('#codigo').value.trim().toUpperCase();
    if (v !== estado.simulacro.codigo) {
      error = v ? 'Ese código no corresponde a un simulacro publicado. Revisa el mensaje del tallerista.' : 'Escribe el código que llegó por WhatsApp.';
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
    const n = sincronizar();
    aviso = n ? 'Enviado a la plataforma' : '';
    render();
  });
  cel.querySelector('[data-c="repetir"]')?.addEventListener('click', () => {
    estado.intento = { simulacro: estado.simulacro.numero, i: -1, respuestas: {}, vuelta: (it.vuelta || 1) + 1 };
    aviso = '';
    guardar();
    render();
  });
  el.querySelector('[data-c="avion"]').addEventListener('click', () => {
    estado.avion = !estado.avion;
    guardar();
    const n = sincronizar();
    aviso = n ? `Volvió la señal: ${n} ${n === 1 ? 'simulacro enviado' : 'simulacros enviados'}, 0 respuestas perdidas` : '';
    render();
  });
}
