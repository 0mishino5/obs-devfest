# Separación de plataformas · 31 de octubre de 2026

Se añadieron paquetes independientes para macOS y Windows, resolución de configuración OBS por sistema, iniciadores nativos, instalador con respaldo y fuentes de cámara/presentación/audio propias de cada sistema.

Las 10 pruebas de compatibilidad pasan en Windows con Node.js 24.14.0. Cubren ambos tracks en las dos plataformas, referencias y UUID, rutas con espacios y Unicode, relocalización, respaldo, perfiles existentes, duplicados, bloqueo con OBS abierto y el protocolo autenticado WebSocket mediante un servidor simulado.

`verificar.mjs` comprueba 2 colecciones, 26 escenas de producción, 15 rótulos, 61 referencias de archivos, 26 capturas 1080p y cuatro videos oficiales. `--hashes` compara el manifiesto de la entrega; debe regenerarse si se modifican los archivos con `node scripts/manifiesto.mjs`.

Las pruebas estructurales de macOS se ejecutan en Windows y no sustituyen una instalación y ensayo en una Mac. Los dispositivos físicos, sincronía, red y operación simultánea de los dos auditorios requieren ensayo en los equipos finales.

## Ensayo con OBS real en Windows

Se ejecutó una copia portátil aislada de OBS 32.1.0 con configuración temporal y WebSocket autenticado. Se cargaron los dos tracks, uno por vez: las 26 escenas cambiaron correctamente y se comprobaron selección de los 15 ponentes, mostrar/ocultar/repetir rótulos, franja, movimiento, silencio, recarga de gráficos y selección de las tres transiciones. También se comprobó preparar vista previa y pasar al programa mediante Modo Estudio.

Se capturaron las dos composiciones principales y se revisó visualmente Track 1. El control sin origen local fue rechazado. No se inició transmisión ni grabación. Las evidencias nuevas están en `09_Pruebas/Windows/resultados.json` y las capturas JPG de esa carpeta en la entrega Windows. El ensayo usa imágenes de prueba: no valida cámaras, HDMI ni consola.

El ensayo no instala colecciones en la configuración personal de OBS. Para repetirlo en Windows con OBS instalado: `node 09_Pruebas/ensayo-windows.mjs`. El comando crea y ejecuta una copia portátil temporal y necesita tener libre el puerto 8787.
