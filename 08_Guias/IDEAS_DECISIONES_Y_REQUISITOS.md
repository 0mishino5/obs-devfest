# Ideas, decisiones y requisitos del proyecto

GDG Arequipa · DevFest Arequipa 2026 · @gdgaqp. Registro de los requisitos y decisiones expresados en la conversación, actualizado el 30 de octubre de 2026. Es una síntesis del proyecto; no es una transcripción literal del chat.

## Objetivo

Preparar una producción de streaming profesional para dos auditorios: Track 1, Auditorio R Grandote; Track 2, Auditorio B. Cada auditorio tendrá su propia Mac, cámaras, consola o interfaz de audio, OBS y plataforma de emisión independiente. Las plataformas y los equipos físicos todavía no están confirmados.

## Operación elegida por el organizador

Cada Mac abre la misma página y controla exclusivamente su track local. La dirección http://127.0.0.1:8787 se abre en cada equipo: siempre apunta a esa misma Mac. Se eligió una sola interfaz fácil de operar, con selección del auditorio y comprobación de la colección activa en OBS.

La página permite preparar escenas, revisar programa o vista previa, pasar al programa, seleccionar ponentes, mostrar/ocultar/repetir su nombre, editar la franja inferior, controlar movimiento y transiciones, silenciar el audio de sala y pasar a una pausa técnica.

GitHub guarda el código y los recursos. El control de OBS se ejecuta localmente en cada Mac mediante el servidor del proyecto y OBS WebSocket; subir el repositorio no pone en marcha las transmisiones ni sustituye ese servidor.

## Diseño solicitado

Seguir las dos imágenes de referencia del organizador y las guías oficiales de GDG y DevFest 2026. En la composición principal: cámara del ponente a la izquierda, diapositivas grandes a la derecha, nombre debajo de la cámara y franja inferior con un mensaje editable. Prioridad visual a las diapositivas y la cámara.

Resolución de lienzo y salida: 1920×1080. La configuración preparada usa 30 FPS. Identidad DevFest Arequipa 2026 y GDG Arequipa, con @gdgaqp. Tipografías y recursos oficiales locales. Paleta de la guía: azul #4285F4, rojo #EA4335, amarillo #F9AB00 y verde #34A853. Las imágenes originales de referencia se conservan intactas; las ventanas se recortan mediante máscaras con transparencia.

Animaciones fluidas, modernas y moderadas. Se descargaron cuatro MP4 oficiales de Motion Loops y se conservaron los GIF incrustados en la guía. Se habilitó en emisión DF26_URL.mp4; los otros videos permanecen como biblioteca porque contienen mensajes en inglés. Se añadió una transición con glifos oficiales, duración de 1,2 segundos y cambio de escena en 600 ms.

## Reglas del organizador

- No utilizar contadores regresivos ni cambios automáticos por horario.
- Español en la señal, excepto nombres de tecnologías y marcas.
- Mostrar únicamente el nombre del ponente, sin cargos o especialidades innecesarios.
- Usar los 15 nombres del ZIP para las pruebas, según confirmación del organizador. Los títulos y horarios siguen siendo borradores; los títulos no se muestran en emisión.
- Conservar las escenas existentes de OBS; instalar colecciones nuevas y respaldar antes de modificar configuraciones.
- No iniciar una transmisión real sin autorización. El panel no incluye acciones para iniciarla.
- Avanzar sin depender de cámaras; dejar las fuentes preparadas y elegir los dispositivos cuando estén confirmados.
- Construir archivos funcionales e importables y comprobarlos en OBS, además de entregar instrucciones.

## Entrega implementada

Dos colecciones terminadas en `_MARCA`, una por track, con 13 escenas de producción y tres auxiliares. Incluyen bienvenida, diapositivas y ponente, cámara amplia, diapositivas amplias, preguntas, próxima charla, espera, almuerzo, patrocinadores, pausa técnica, cierre, diapositivas limpias y animación oficial.

Se incluyen 15 rótulos individuales, rótulos dinámicos, gráficos transparentes, pantallas PNG de respaldo, instalador que preserva configuraciones existentes, preparación de rutas al mover la carpeta, perfiles sin destinos ni claves y guía de operación.

## Pruebas y pendientes

Las dos colecciones se ensayaron en la primera Mac, una por vez. Se comprobaron las 26 escenas de producción, los 15 nombres, transparencias, reproducción de videos y acciones del panel mediante su API y la respuesta real de OBS. El ensayo grabado de la revisión de marca no registró cuadros perdidos. Las pruebas y sus límites están en 09_Pruebas/RESULTADOS.md.

Falta instalar y probar esta versión en la segunda Mac, conectar cámaras/HDMI/consola, comprobar sincronía labial y red, definir los destinos de emisión y realizar un ensayo simultáneo con los dos equipos. Agenda y patrocinadores requieren confirmación. No se inventaron ponentes, marcas patrocinadoras ni fecha del evento.

## Historial y alcance de la conservación

El ZIP de los 49 archivos iniciales está en 00_Originales. La primera producción entregada está archivada en 11_Historial/DevFest_Arequipa_2026_Produccion_v1.zip. Las capturas y hojas de contacto usadas durante la revisión de marca están en 11_Historial/Capturas_revision_marca; pueden mostrar estados anteriores y no son gráficos aprobados para emitir. La versión operativa vigente es la estructura principal del repositorio.

Los cinco adjuntos suministrados se conservan íntegros, con equivalencias de nombres y SHA-256 en 10_Referencias/INVENTARIO_ENTREGAS.md. No se publica una transcripción literal del chat, cachés de herramientas, archivos temporales ni respaldos privados de OBS que pueden contener credenciales. Los respaldos privados originales siguen en la Mac, fuera de Git.
