import { ic, encabezado } from './ui.js';
import { medirPaquete } from './simulacro.js';

const SEMANA = [
  ['ia', 'Entre semana · IA', 'Propone preguntas', 'a partir de las que ya tiene el colectivo'],
  ['comite', 'Comité del colectivo', 'Revisa y aprueba', 'corrige claves, cambia textos, descarta'],
  ['publicar', 'Tallerista', 'Publica el simulacro', 'un enlace al grupo de WhatsApp'],
  ['sabado', 'Sábado · estudiantes', 'Responden en el celular', 'con código de grupo, aun sin conexión'],
  ['sincronizar', 'Plataforma', 'Recibe las respuestas', 'apenas el celular se reconecta'],
  ['tablero', 'Tallerista', 'Ve al grupo', 'qué área falló y cuántos siguen activos']
];

export function inicio(el) {
  el.innerHTML = `
  <section class="portada">
    <div>
      <h1>Simulacros que se repiten sin fotocopias</h1>
      <p class="bajada">En los preuniversitarios populares el simulacro se imprime, se corrige a mano y se aplica una sola vez por ciclo. Con Impulso U el tallerista lo publica y cada estudiante lo responde desde su celular las veces que quiera, incluso sin conexión.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn primario" href="#/ia">Ver una semana con Impulso U ${ic('flecha', 16)}</a>
        <a class="btn" href="#/viable">Por qué es viable</a>
      </div>
    </div>
    <div>
      <div class="contraste">
        <div class="card antes"><div class="grande">1</div><div class="desc">simulacro por ciclo, impreso y corregido a mano</div></div>
        <span class="flecha">${ic('flecha', 26)}</span>
        <div class="card despues"><div class="grande">8</div><div class="desc">simulacros por estudiante, en el celular</div></div>
      </div>
      <div class="card oscura mt">
        <div class="lbl">La métrica que mueve todo</div>
        <h2 style="margin-top:4px">Estudiantes que sostienen la preparación hasta el examen</h2>
        <div style="display:flex;gap:26px;margin-top:10px;align-items:flex-end">
          <div><div class="cifra" style="color:#9FB3D1">20 %</div><div class="desc">hoy: de 100 que empiezan, llegan 20</div></div>
          <div><div class="cifra">40 %</div><div class="desc">meta del piloto, feb – ago 2027</div></div>
        </div>
      </div>
    </div>
  </section>

  <section class="mt2">
    <h2 style="font-size:20px;font-weight:600;margin-bottom:12px">Una semana con Impulso U</h2>
    <div class="semana">${SEMANA.map(([r, lugar, t, d], i) => `
      <a href="#/${r}" class="${r === 'sabado' ? 'sab' : ''}">
        <span class="num">${i + 1}</span>
        <span class="lbl">${lugar}</span>
        <b style="font-weight:600">${t}</b>
        <span class="desc">${d}</span>
      </a>`).join('')}
    </div>
    <p class="nota">El sábado es el único momento en que el estudiante usa la plataforma. Lo que el grupo falló define las preguntas y la clase de la semana siguiente.</p>
  </section>

  <section class="grilla g3 mt2">
    <div class="card"><div class="lbl">${ic('libro', 16)} El colectivo pone el contenido</div>
      <p class="desc mt" style="margin-top:6px">La IA convierte las 50 preguntas que hoy arma un colectivo en 200, y el colectivo revisa y aprueba cada una antes de publicarla.</p></div>
    <div class="card"><div class="lbl">${ic('grupo', 16)} El tallerista ve al grupo</div>
      <p class="desc" style="margin-top:6px">El tablero muestra aciertos por área y cuántos siguen activos. El estudiante entra con un código de grupo, sin nombre ni documento.</p></div>
    <div class="card"><div class="lbl">${ic('wifi', 16)} El simulacro no depende de la IA</div>
      <p class="desc" style="margin-top:6px">La IA ayuda a preparar el banco, pero ningún estudiante espera una respuesta de ella para rendir. 250 estudiantes a la vez pueden responder aunque el servicio de IA esté saturado.</p></div>
  </section>
  <div class="card ambar mt"><div class="lbl">Qué no hace la IA</div>
    <p style="margin-top:4px;font-size:14px">No responde por el estudiante, no prepara la clase en lugar del tallerista y no predice puntajes. Todo lo que genera pasa por la revisión del colectivo antes de llegar a un estudiante.</p></div>`;
}

const ITEM = (c, t, d) => `<div class="item ${c}"><b>${t}</b><span>${d}</span></div>`;

const REQS = [
  ['Concurrencia', '500 estudiantes a la vez sin errores', 'prueba de carga'],
  ['Respuesta', 'Descarga < 30 s en 3G; cambio de pregunta < 0,2 s', 'celular de gama baja'],
  ['Sin conexión', '0 respuestas perdidas al reconectar', 'modo avión a mitad del simulacro', 'sabado'],
  ['Datos móviles', '< 1 MB por simulacro', 'peso del paquete', 'sabado'],
  ['Disponibilidad', '99,5 % al mes; PDF impreso como plan B', 'monitoreo y alerta de facturación'],
  ['Respaldo', 'Copia diaria; se recupera en < 4 h', 'restauración de prueba'],
  ['Datos de menores', 'Sin nombre ni documento; código de grupo', 'Ley 1581 y reglas de acceso', 'sabado'],
  ['Hojas en papel', '99 % de respuestas bien leídas', '50 hojas reales de un colectivo', 'publicar'],
  ['Calidad del banco', '< 2 % de claves erradas', 'revisión del comité', 'comite'],
  ['Costo', '≤ USD 0,50 por estudiante y ciclo', 'tope de gasto con alerta'],
  ['Escalabilidad', 'Hasta 1.000 estudiantes sin rediseño', 'alta de un colectivo de prueba'],
  ['IA', 'Nivel pagado; el simulacro no depende de ella', 'prueba con la IA desconectada', 'sabado']
];

export function viable(el) {
  const kb = medirPaquete();
  el.innerHTML = `
  ${encabezado({ rol: 'Viabilidad técnica', icono: 'candado', titulo: 'Qué entra al MVP y por qué es viable',
    bajada: 'Entra al MVP lo que pidieron los educadores y tiene costo, carga y riesgo medibles; lo demás se prueba a mano o espera.' })}

  <div class="grilla g3">
    <div class="mvp-col">
      <div class="cab hot"><div class="lbl">MVP</div><h2>Se construye</h2></div>
      ${ITEM('s', 'Simulacro repetible en el celular', 'Funciona sin conexión')}
      ${ITEM('s', 'Banco ampliado con IA', 'El colectivo aprueba cada pregunta')}
      ${ITEM('s', 'Tablero del grupo', 'Solo datos agregados, para el tallerista')}
      ${ITEM('s', 'Enlace por WhatsApp', 'Un enlace, no un bot')}
      ${ITEM('s', 'Hojas en papel leídas por foto', 'Si no llega al 99 % de precisión, se digita')}
    </div>
    <div class="mvp-col">
      <div class="cab deep"><div class="lbl">Piloto manual</div><h2>Se prueba sin construir</h2></div>
      ${ITEM('', 'Roadmap y didáctica de clase', 'El comité pedagógico los prepara con el tallerista')}
      ${ITEM('', 'Alertas de fechas de admisión', 'El tallerista difunde un calendario curado')}
      ${ITEM('', 'Banco del examen de la U. Nacional', 'Mismo motor, en la segunda mitad del piloto')}
    </div>
    <div class="mvp-col">
      <div class="cab amb"><div class="lbl" style="color:var(--ambar-t)">Después</div><h2>Fuera de esta etapa</h2></div>
      ${ITEM('a', 'Orientación vocacional', 'Se co-diseña con los procesos; aún no está resuelta')}
      ${ITEM('a', 'Videos e ilustraciones', 'Pesan en el paquete')}
      ${ITEM('a', 'Ruta individual y copiloto con IA', 'Chocan con la regla de datos agregados')}
    </div>
  </div>

  <h2 class="mt2" style="font-size:20px;font-weight:600">Doce requisitos que se prueban antes del piloto</h2>
  <p class="desc" style="margin:4px 0 12px">Los marcados en azul se pueden ver en esta demo. Si falla alguno de estos tres (sin conexión, 500 a la vez, sin esperar a la IA), el piloto no arranca.</p>
  <div class="req">${REQS.map(([n, u, p, r]) => `
    <div class="item ${r ? 'vivo' : ''}"><div class="lbl">${n}</div><b style="margin-top:2px">${u}</b><span>Se prueba con: ${p}${r ? ` · <a href="#/${r}">ver en la demo</a>` : ''}</span></div>`).join('')}
  </div>
  <p class="nota">Esta demo pesa ${kb} KB en total, incluido el simulacro.</p>

  <h2 class="mt2" style="font-size:20px;font-weight:600;margin-bottom:12px">Lo que cuesta</h2>
  <div class="grilla g3">
    <div class="card suave"><div class="lbl">Nube e IA por ciclo</div><div class="cifra" style="margin-top:6px">USD 21–29</div><p class="desc">de 100 a 1.000 estudiantes; casi todo es generar el banco</p></div>
    <div class="card suave"><div class="lbl">Operación por ciclo</div><div class="cifra" style="margin-top:6px">160 h</div><p class="desc">20 h al mes durante 8 meses: COP 9 a 11 millones</p></div>
    <div class="card oscura"><div class="lbl">Desarrollo del MVP</div><div class="cifra" style="margin-top:6px">540 h</div><p class="desc">COP 31 a 38 millones, unos 3,5 meses de dos personas a medio tiempo</p></div>
  </div>
  <p class="nota">Los colectivos y los estudiantes nunca pagan. En la fase 1 las horas las cubren el equipo y un aliado; desde la fase 2, la extensión universitaria que contrata.</p>

  <h2 class="mt2" style="font-size:20px;font-weight:600;margin-bottom:12px">Quién lo usa y quién lo paga</h2>
  <div class="grilla g3">
    <div class="card"><div class="lbl">Fase 1 · feb – ago 2027</div><h3 style="margin-top:2px">Preuniversitarios populares</h3><p class="desc">Acceso gratuito. Se valida uso y permanencia en las peores condiciones: celular, mala conexión y voluntarios que rotan.</p></div>
    <div class="card"><div class="lbl">Fase 2 · desde 2028</div><h3 style="margin-top:2px">Extensiones universitarias</h3><p class="desc">El primer cliente que paga, con la evidencia de la fase 1.</p></div>
    <div class="card"><div class="lbl">Fase 3</div><h3 style="margin-top:2px">Colegios y fundaciones</h3><p class="desc">Por cohorte o como patrocinio. Ningún pagador supera el 60 % del presupuesto.</p></div>
  </div>
  <p class="nota">El banco de los colectivos no se vende: los clientes pagan la plataforma y el acompañamiento, y el contenido solo se comparte con permiso del colectivo.</p>

  <div class="aviso mt2">${ic('info')}<div><b>Qué está simulado en esta demo.</b> Las propuestas de la IA vienen precalculadas, como ocurriría en el lote de entre semana. La «plataforma» es el almacenamiento del navegador, la lectura de hojas en papel es un ejemplo fijo y el tablero mezcla datos de ejemplo con las respuestas que se den en esta demo. Lo que sí funciona de verdad es el simulacro sin conexión: la página queda guardada en el celular y las respuestas esperan hasta que vuelve la red.</div></div>`;
}
