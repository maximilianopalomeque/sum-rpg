# SUM-0 — Error de fábrica

Prototipo jugable local en español. SUM-0 tiene el módulo aritmético roto y la fábrica lo marcó para reciclaje. Escapa aprendiendo a sumar, con un humor que celebra volver a intentar. JavaScript nativo, Canvas 2D y HTML/CSS, sin dependencias ni recursos externos.

## Ejecutar

Requiere Node.js 18+. No hace falta `npm install`.

```sh
cd sum-rpg
npm run dev
```

Abrir http://127.0.0.1:4187. Sólo escucha en la interfaz local. Otro puerto: `PORT=4188 npm run dev`. Ctrl+C detiene el servidor. Recargá después de editar.

```sh
npm test
npm run build
```

El build copia los seis recursos web a `dist/`, listos para servir estáticamente. El servidor de desarrollo sirve los originales.

## Cómo jugar

- Escribí la suma y presioná Enter o **Disparar**; teclado numérico táctil disponible.
- Acierto: 1 de daño. Error/timeout: perdés 1 de vida. Los errores muestran la solución durante 2,3 segundos antes de continuar.
- Seis enemigos, incluido el Reciclador Central, en Depósito, Fundición y Salida. Partidas de aproximadamente 3–5 minutos.
- Empezás con 6 de vida. Los operandos aumentan de 1–5 a 1–45; el reloj baja de 14 a 10 segundos y el jefe concede 12.
- Elegí una mejora tras cada victoria. Escape o **Pausa** detiene el combate. Perder foco u ocultar la pestaña también pausa, con reanudación explícita.
- F activa la congelación, una vez desbloqueada. Sonido inicialmente apagado, activable desde la cabecera: efectos originales con Web Audio.
- Victoria y derrota tienen reinicio. Recargar comienza de nuevo; no hay guardado persistente.

## Poderes implementados

`state.powers` guarda módulos permanentes, `begin()` recarga recursos por combate y `answer()` aplica efectos. El único bucle de animación consume tiempo con `tick()`, sin temporizadores de daño independientes.

| Módulo | Efecto y lógica |
| --- | --- |
| Chapa de coraje | Una carga por combate. El primer error/timeout consume escudo en lugar de vida. |
| Reloj prestado | Una carga por combate. Botón o F congela 5 segundos: `tick()` consume primero tiempo congelado y luego descuenta el sobrante del reloj. Termina al cambiar de pregunta. |
| Chispa de confianza | Cada tercer acierto consecutivo hace 2 de daño. Fallar o cambiar de enemigo reinicia racha. |
| Reparación urgente | Cura 3 sin aumentar capacidad. Repetible. |
| Batería de repuesto | +2 de capacidad y +2 de vida inmediatamente. Una sola instalación. |
| Circuito de cuidado | Cura 1 cada tercer acierto seguido, sólo si falta vida; máximo 2 curaciones por combate. |
| Condensador rebelde | Cuatro aciertos cargan un pulso. R o botón gasta la carga y añade +2 al siguiente acierto. Se puede combinar con Chispa (4 de daño). |

Los módulos adquiridos desaparecen del taller. La reparación sigue disponible, así siempre hay una opción válida.

## Archivos

- `engine.js`: estados, sumas, dificultad, daño y mejoras, independiente de la vista.
- `main.js`: controles, audio, accesibilidad, pausa y animación.
- `art.js`: pixel art original dibujado con primitivas. Robots, cajas, terminales, cables, luces y tres paletas industriales.
- `style.css`: interfaz adaptable en menta/ámbar con controles táctiles.
- `tests/`: runner integrado de Node.

## Verificación y límites

Pruebas automatizadas: aciertos, errores, timeouts, escudo, congelación, combos, mejoras, derrota y recorrido completo. Prueba del controlador real con DOM mínimo: `blur` y `visibilitychange` congelan el reloj; reanudar no aplica tiempo acumulado.

Navegador local: partida completa hasta victoria (29 aciertos), muerte con seis fallos y reinicio limpio; Enter y botón de disparo, taller, congelación, pausa manual y timeout mostrando solución. Revisado a 1280 × 720 y 390 × 844; móvil sin desbordamiento horizontal.

Limitación de QA: las pestañas aisladas del navegador integrado no produjeron cambios nativos de foco al abrir otra pestaña; esa ruta se comprobó con la prueba del controlador. No se probó teléfono físico/teclado virtual ni reproducción audible en hardware.

Primera versión corta, sin persistencia ni dificultad adaptativa. Sin backend, cuentas, pagos o conexión a servicios externos.

## Intro cinematográfica

Cuatro viñetas originales en Canvas: control de calidad, respuesta equivocada, sentencia de reciclaje y decisión de escapar para reparar el módulo. Se leen en unos 20–30 segundos, pero avanzan a tu ritmo con Enter o Continuar. Saltar intro/Escape lleva al tutorial; Ver la historia permite repetirla desde el tutorial o los finales. Reiniciar una partida vuelve directamente al combate.

Durante la intro no corre el reloj ni se acepta daño o respuestas. No hay audio automático. `prefers-reduced-motion` detiene la animación de fondo y de la película. Las pruebas cubren completar, saltar, repetir y reiniciar, además de dibujos estáticos en modo de movimiento reducido.

## Servidor local y diagnóstico

Se eligió el puerto 4187 porque había otro proyecto atendiendo en `::1:5173`, mientras SUM-0 atendía en `127.0.0.1:5173`. `localhost` podía llegar al otro proyecto. La respuesta de la antigua URL IPv4 era HTTP 200 al diagnosticar; no se pudo reproducir con certeza el fallo original del usuario. Usar la nueva URL exacta **http://127.0.0.1:4187/**.

Durante esta sesión se inició el servidor con un proceso independiente, stdin cerrado y salida a `/tmp/sum-rpg-server.log`; su PID se guarda en `/tmp/sum-rpg-server.pid`. Se verificaron respuestas HTTP 200 de la página y `story.js`, y la página cargó en navegador. El proceso dura hasta que se detenga o reinicie la computadora; no se instaló inicio automático. Si deja de responder, ejecutar `npm run dev` desde esta carpeta. La URL sólo funciona en esta computadora.

## Versión: escape visual y estrategias

La intro ahora representa una línea de montaje: cinta transportadora, prueba de suma, fallo y alarma suave, apertura de compuerta, caída con agarre al borde y escape por la salida. Cada plano anima aproximadamente seis segundos y mantiene su pose final hasta Continuar. No hay avance automático ni presión de tiempo; Saltar y Replay siguen disponibles. En movimiento reducido se muestra la pose final de cada plano. El mensaje del sistema conserva el texto aprobado, sin el chiste rechazado.

Cada taller ofrece dos módulos permanentes y una reparación inmediata. Las ofertas cambian por encuentro, reemplazan módulos ya instalados y nunca duplican opciones. Una elección cambia de fase inmediatamente; los clics siguientes no compran más mejoras ni saltan enemigos. La batería separa capacidad de curación; el circuito premia precisión, y el condensador permite guardar energía para otro enemigo. Su carga persiste entre combates, se limita a cuatro y un pulso armado no se pierde al fallar. Todo se limpia al reiniciar.

Verificación de esta versión: 14 pruebas automatizadas, build estático, intro completa/saltar/repetir, doble clic en taller, ruta con circuito + condensador + combo hasta victoria (22 aciertos), derrota y reinicio sin módulos. Vista de escritorio y móvil 390 × 844 revisadas en pestaña de prueba aislada; sin desbordamiento horizontal. El movimiento reducido se verifica con dibujos deterministas en pruebas, sin cambiar las preferencias del sistema del usuario. No se probó teléfono físico. El servidor y la pestaña de la partida del usuario no se reiniciaron.
