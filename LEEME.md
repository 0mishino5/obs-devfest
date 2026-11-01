# DevFest Arequipa 2026 · OBS · Windows

Esta es la copia independiente para **Windows**. Incluye los dos tracks, los recursos completos y el historial Git.

1. Instala OBS Studio y Node.js 22 o superior. Si descargas desde GitHub, instala Git LFS y ejecuta `git lfs pull`.
2. Conserva esta carpeta en una ubicación estable. Cierra OBS y ejecuta `INSTALAR_WINDOWS.cmd`. Respalda la configuración anterior y añade colecciones nuevas; se detiene si ya existen.
3. Abre OBS, selecciona el perfil y colección del track y habilita WebSocket con autenticación, puerto 4455.
4. Ejecuta `INICIAR_PANEL.cmd` y usa http://127.0.0.1:8787. Mantén abierta la terminal.
5. Elige cámaras, HDMI y consola en las fuentes auxiliares de OBS; oculta las imágenes de prueba antes del evento.

Para importar manualmente o después de mover esta carpeta, ejecuta `PREPARAR_IMPORTACION.cmd` y sigue [la guía](08_Guias/OPERACION.md). El instalador no reemplaza colecciones ya instaladas.

La composición es 1080p30, con 13 escenas de producción por track y 15 nombres para pruebas. No hay contadores ni inicio de emisión desde el panel.

Verifica los archivos con `node 09_Pruebas/verificar.mjs` y las pruebas de compatibilidad con `node --test 09_Pruebas/compatibilidad.test.mjs`. Los ensayos de la Mac original se conservan como historial; no acreditan pruebas del hardware de este equipo.

[Guía de operación](08_Guias/OPERACION.md) · [Compatibilidad y límites](08_Guias/PLATAFORMAS.md)
