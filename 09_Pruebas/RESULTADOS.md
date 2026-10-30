# Pruebas de la revisión de marca · 30 de octubre de 2026

- Dos colecciones `_MARCA`, con 13 escenas de producción y tres auxiliares cada una. Los dos tracks se comprobaron en esta Mac, uno por vez.
- Lienzo y salida 1920×1080 a 30 FPS, confirmados por OBS.
- Los 15 nombres del ZIP se renderizaron en OBS; se revisó visualmente el nombre largo en el espacio bajo la cámara.
- Selección de escenas, vista previa, paso a programa, rótulos, mensajes, control de movimiento, silencio y las tres transiciones comprobados mediante el API del panel y la respuesta real de OBS. Cada track registra 20 comprobaciones en su JSON.
- Ventanas de cámara y diapositivas con alfa cero; marca con alfa 255. PNG y HTML con rutas verificadas y fuentes locales. Las pantallas PNG se volvieron a renderizar dentro de OBS y se revisaron visualmente en una hoja de contacto.
- Cuatro MP4 oficiales 1920×1080 descargados y decodificados sin errores. El video habilitado produce cuadros diferentes en OBS; los otros tres quedan en biblioteca por sus mensajes en inglés.
- Stinger VP9 de 36 cuadros: alfa 0 en los cuadros primero y último, alfa 255 en todo el lienzo en el cuadro 18, correspondiente al cambio a 600 ms.
- Ensayo local en MKV decodificado sin errores y copia MP4 incluida. OBS registró 0 cuadros perdidos de render y 0 de codificación durante el ensayo corto. Esto no sustituye una prueba de la jornada completa.
- La colección y el perfil originales Sin Título siguen idénticos en bytes al respaldo inicial. Las colecciones de la versión anterior permanecen disponibles.
- El servidor solo escucha en 127.0.0.1. Se verificaron las rutas HTTP del panel, fuentes y videos; se rechazó una petición de control sin origen local. Los perfiles distribuidos tienen destino y clave vacíos.

## Límites de la verificación

Las composiciones se inspeccionaron a partir del render real de OBS. No hubo una herramienta de interacción visual del navegador disponible para recorrer automáticamente todos los botones de la página; sus acciones se verificaron mediante su API y las referencias del HTML/JavaScript.

No se configuraron cámaras, HDMI, consola ni destinos de emisión. Falta probar esas señales, sincronía labial, red y operación simultánea en las dos Mac. No se ha instalado esta copia en la segunda Mac. Agenda y logos de patrocinadores necesitan confirmación del organizador. No se inició ninguna transmisión real.

Para verificar los archivos del paquete: `node 09_Pruebas/verificar.mjs`.
