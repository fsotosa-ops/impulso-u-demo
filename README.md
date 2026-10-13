# Impulso U · Demo del MVP

Demo navegable del MVP de Impulso U: simulacros repetibles para preuniversitarios populares. El colectivo pone las preguntas, la IA amplía el banco y el comité aprueba cada una. El tallerista publica el simulacro por WhatsApp y el estudiante lo responde desde el celular, incluso sin conexión.

Publicada en https://fsotosa-ops.github.io/impulso-u-demo/

## Recorrido

«Una semana con Impulso U», en seis pasos:

1. La IA propone preguntas a partir de las del colectivo (en lote, fuera del sábado).
2. El comité revisa, corrige claves y aprueba o descarta.
3. El tallerista arma el simulacro y lo comparte con un enlace y un código de grupo. Las hojas en papel se leen por foto.
4. El estudiante responde en el celular, sin nombre ni documento, con o sin señal.
5. La plataforma recibe las respuestas al reconectar.
6. El tallerista ve al grupo: aciertos por área y estudiantes activos, sin datos individuales.

La vista «Por qué es viable» resume qué entra al MVP, los doce requisitos, los costos y quién paga en cada fase.

## Qué funciona y qué está simulado

Funciona de verdad:
- **El simulacro sin conexión.** Un service worker guarda la página en el teléfono, y las respuestas quedan en una cola local hasta que vuelve la red.
- **El peso del paquete.** Se mide en vivo.

Está simulado:
- Las propuestas de la IA vienen precalculadas en `data/banco.json`.
- La «plataforma» es el `localStorage` del navegador.
- La lectura de hojas en papel es un ejemplo fijo.
- El tablero mezcla datos de ejemplo con las respuestas que se den en la demo.

El colectivo es ficticio y las preguntas son de redacción propia.

«Reiniciar demo», en la barra lateral, deja todo como al principio, para grabar varias tomas.

## Correrla en local

```sh
python3 -m http.server 8765
# abrir http://localhost:8765/
```

No hay dependencias ni paso de compilación: HTML, CSS y JavaScript sin frameworks.
