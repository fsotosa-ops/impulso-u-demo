# Impulso U · Mockup de la app

Mockup navegable de Impulso U, la app de simulacros repetibles para preuniversitarios populares. Es el prototipo del pitch.

Publicado en https://fsotosa-ops.github.io/impulso-u-demo/

## Las dos caras de la app

**Tallerista**, el usuario principal:
- **Hoy:** el simulacro del día y las respuestas que van llegando.
- **Banco de preguntas:** el comité revisa lo que propuso la IA y puede aprobar, corregir la clave o descartar. También agrega material propio del colectivo.
- **Simulacros:** el ciclo de 8. Desde aquí se prepara y publica el de hoy, y se comparte con un enlace de WhatsApp, un código de grupo o un PDF para imprimir.
- **Grupo:** aciertos por área y estudiantes activos, sin datos individuales.
- **Hojas en papel:** el tallerista toma la foto de la hoja, revisa la lectura y digita las marcas dudosas.

**Estudiante**: entra con el código, sin cuenta ni nombre. Responde en el celular aunque no tenga señal, y lo respondido se envía solo al reconectar.

## Recorrido sugerido para el video (unos 3 minutos)

1. **Hoy.** El simulacro 5 está listo para publicar.
2. **Banco de preguntas.** La primera propuesta de la IA trae la clave errada (marca 40 km/h). El comité la corrige a 24 km/h y la aprueba.
3. **Simulacros › Preparar.** Agrega la pregunta del bus, publica y comparte por WhatsApp.
4. **Estudiante.** Entra con el código y responde. A mitad del simulacro activa el modo avión, termina, y el resultado queda «guardado en tu celular». Al quitar el modo avión, se envía.
5. **Hoy.** Las respuestas del grupo siguen llegando.
6. **Hojas en papel.** Registra una hoja y digita la marca dudosa de la segunda.
7. **Grupo.** El área más baja y el pedido de más preguntas al próximo lote.

«Reiniciar», arriba a la derecha, deja todo como al principio.

## Qué funciona y qué está simulado

**Funciona de verdad:**
- El simulacro sin conexión: un service worker guarda la app en el teléfono y las respuestas esperan en una cola local hasta que vuelve la red.
- El peso del simulacro, que se mide en vivo.
- El PDF para imprimir.

**Está simulado:**
- Las propuestas de la IA vienen precalculadas en `data/banco.json`.
- La «plataforma» es el `localStorage` del navegador.
- Las respuestas del resto del grupo llegan con un temporizador.
- La lectura de las hojas es un ejemplo fijo.
- El historial del grupo son datos de ejemplo.

El colectivo y la tallerista son ficticios, y las preguntas son de redacción propia.

## Correrla en local

```sh
python3 -m http.server 8765
# abrir http://localhost:8765/
```

No hay dependencias ni paso de compilación: HTML, CSS y JavaScript sin frameworks.
