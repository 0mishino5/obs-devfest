# Operación de DevFest Arequipa 2026

Sistema local de producción para GDG Arequipa · @gdgaqp. Lienzo y salida: **1920 × 1080, 30 FPS**. Dos computadoras, cada una con su OBS, sus dispositivos, su destino de emisión y su operador.

## En esta Mac

OBS está instalado en `/Applications/OBS.app`. Los recursos que OBS utiliza están en `/Users/Shared/DevFest_Arequipa_2026_Marca`. Esta ubicación evitó el bloqueo de lectura observado al abrir los recursos desde Documentos. Conserva la carpeta completa en ese lugar.

1. Abre OBS desde Aplicaciones.
2. En **Perfil**, selecciona `DEVFEST_2026_TRACK_1_1080p` o `DEVFEST_2026_TRACK_2_1080p`.
3. En **Colección de Escenas**, selecciona `DEVFEST_AREQUIPA_2026_TRACK_1_MARCA` o `DEVFEST_AREQUIPA_2026_TRACK_2_MARCA`.
4. Abre `INICIAR_PANEL.command` dentro de la carpeta de operación. Mantén abierta la Terminal durante el evento. El panel aparece en `http://127.0.0.1:8787`.
5. Selecciona el mismo track en el panel. El panel bloquea las acciones si la colección de OBS corresponde a otro auditorio.

El control usa OBS WebSocket 5 con la contraseña ya almacenada en la configuración local de OBS. La contraseña no viaja al navegador ni se incluye en el paquete. En otra Mac, habilita **Herramientas → Ajustes del servidor WebSocket → Habilitar servidor**, conservando autenticación y puerto 4455. El servidor del panel escucha solo en 127.0.0.1. No requiere internet ni servicios en la nube.

## En la segunda computadora Mac

1. Instala OBS Studio de [obsproject.com](https://obsproject.com/) y Node.js 22 o superior de [nodejs.org](https://nodejs.org/).
2. Descomprime el paquete completo en una ubicación estable, preferentemente `/Users/Shared/DevFest_Arequipa_2026_Marca`. No uses la vista previa del ZIP.
3. Cierra OBS. Ejecuta `INSTALAR_MAC.command`. El instalador respalda la configuración local y añade perfiles y colecciones nuevos; se detiene si encuentra una colección del mismo nombre; conserva los perfiles existentes, incluidas sus plataformas y claves. No elimina ni reemplaza colecciones previas.
4. Abre OBS, selecciona el perfil y colección **Track 2**, habilita WebSocket con autenticación y abre `INICIAR_PANEL.command`. Elige Track 2 en el panel.
5. En esta Mac, elige Track 1. Dos colecciones en una computadora no son dos emisiones simultáneas: la independencia la proporcionan las dos computadoras.

Si prefieres importar manualmente: ejecuta `PREPARAR_IMPORTACION.command` después de ubicar el paquete. En OBS usa **Colección de Escenas → Importar**, elige el JSON correspondiente de `06_OBS/Colecciones` y confirma su importación. Importa el perfil desde `06_OBS/Perfiles` o ajusta manualmente lienzo/salida 1920×1080 y 30 FPS. Nunca importes encima de una colección existente: usa un nombre nuevo si OBS encuentra un duplicado.

En Windows, ejecuta `node 06_OBS/preparar.mjs` y usa la importación manual. Los gráficos, HTML y stinger son portables; reemplaza las fuentes de captura de macOS y la entrada de audio por las fuentes equivalentes de Windows. El controlador entregado lee la configuración de macOS: su conexión automática no está adaptada ni probada en Windows.

## Escenas y composición

| Escena | Uso |
| --- | --- |
| 01 · Bienvenida | Apertura con identidad del evento y auditorio |
| 02 · Diapositivas + ponente | Principal: diapositivas grandes, cámara lateral, nombre bajo la cámara |
| 03 · Cámara del ponente | Ponente en cuadro grande, rótulo inferior |
| 04 · Diapositivas completas | Diapositivas amplias con marco; sin rótulo superpuesto |
| 05 · Preguntas y respuestas | Cámara y diapositivas con la composición principal |
| 06 · Próxima charla | Nombre seleccionado; no muestra títulos en borrador |
| 07 · Espera | Pausa entre bloques, sin contador |
| 08 · Almuerzo | Pantalla de pausa |
| 09 · Patrocinadores | Agradecimiento; logos pendientes de lista confirmada |
| 10 · Problemas técnicos | Pausa técnica, sin prometer una hora de regreso |
| 11 · Cierre | Agradecimiento y comunidad |
| 12 · Diapositivas limpias | Diapositivas ocupan todo el lienzo |
| 13 · Animación oficial DevFest | Bucle oficial descargado |

Hay tres escenas auxiliares: `FUENTE · Cámara del ponente`, `FUENTE · Diapositivas` y `RESPALDO · Rótulos individuales`. Estas organizan las fuentes y no son escenas para pasar al programa.

La composición principal sigue la imagen del organizador: cámara a la izquierda en **(74,380), 552×315**; diapositivas a la derecha en **(682,219), 1182×642**. OBS ajusta ambas sin deformar. El nombre se coloca debajo de la cámara y la franja inferior admite hasta 140 caracteres. La composición amplia usa **(200,148), 1520×848**, ajustando el contenido sin cortar los bordes. La escena limpia usa todo el lienzo.

La escena **13 · Animación oficial DevFest** reproduce en bucle el MP4 oficial con la URL de DevFest. Está disponible desde el panel. Las pausas incluyen esta animación en el recuadro pequeño. El interruptor Movimiento permite pausarla.

## Conectar cámaras y diapositivas

1. Ve a `FUENTE · Cámara del ponente`. En las propiedades de `T1/T2 · Cámara 1 · configurar`, selecciona la capturadora o cámara cuando esté disponible. No se ha elegido ninguna cámara interna ni dispositivo real.
2. Ajusta su formato a 1920×1080 y 30 FPS cuando el equipo lo admita. Desactiva el audio de la cámara para evitar duplicaciones. Activa solo esa fuente y oculta `Prueba cámara`. La Cámara 2 queda como alternativa oculta; no es un mezclador automático de dos cámaras.
3. En `FUENTE · Diapositivas`, selecciona la capturadora HDMI en `Diapositivas HDMI · configurar`. Para presentaciones en la misma Mac, configura `Diapositivas macOS · configurar` con una ventana concreta. Habilita solo una de las dos y oculta la imagen de prueba.
4. Si cambias el tipo de fuente, añade la nueva dentro de esa escena auxiliar, usa **Transformar → Ajustar a la pantalla** y conserva su tamaño 1920×1080. Si el contenido es 4:3, ajusta sin estirar ni recortar el texto.
5. Antes del evento, verifica permisos de Cámara, Micrófono y Grabación de pantalla de OBS en macOS si un dispositivo o ventana no aparece.

Las imágenes de prueba dicen claramente que las fuentes están pendientes. Deben quedar ocultas antes de emitir señales reales.

## Audio

`T1/T2 · Audio de sala` está preparado, **sin dispositivo válido y silenciado**. En sus propiedades elige la consola o interfaz del auditorio. No uses simultáneamente el micrófono interno, el audio de las cámaras y el mismo audio de la consola. No se han añadido dispositivos globales a las colecciones nuevas.

Comprueba señal en el mezclador, escucha una grabación de prueba y busca picos aproximados entre -12 y -6 dBFS, sin saturar 0 dBFS. Ajusta ganancia en la consola primero. La referencia es un punto de partida, no una calibración ya realizada. Si hay desfase labial, mide con una palmada y ajusta el desfase de sincronización de audio en Propiedades de audio avanzadas. La monitorización permanece desactivada para evitar retorno acústico.

Las escenas de espera, almuerzo, patrocinadores, problemas y cierre no incluyen audio de sala. No contienen música. Si se desea música, añádela solo después de confirmar derechos y nivelar el volumen.

## Uso del panel

- **Modo Estudio activado:** un botón de escena prepara la vista previa. Revisa OBS y pulsa **Pasar al programa** para realizar la transición. Las pestañas Programa y Vista previa muestran una captura periódica de OBS, cada 2,5 segundos aproximadamente; usa la vista de OBS para decisiones inmediatas y sincronización.
- **Modo Estudio desactivado:** los botones cambian directamente el programa.
- Selecciona el nombre, pulsa **Mostrar nombre**, **Ocultar** o **Repetir entrada**. Los rótulos muestran exclusivamente el nombre y la marca del evento. Se mantienen hasta ocultarlos; no hay cuenta regresiva.
- **Próxima charla** usa el nombre seleccionado. Los horarios son una ayuda al operador; no disparan cambios automáticos.
- **Pausa técnica → al programa** realiza el cambio de escena sin esperar una segunda pulsación de transición. Utiliza la transición seleccionada.
- **Animación de los gráficos** controla el movimiento de los HTML. La transición de escena tiene su propia selección.
- **Audio de sala** activa/silencia esa fuente; primero configura el dispositivo en OBS.
- **Recargar gráficos** actualiza los navegadores de la colección activa. Durante la recarga la imagen PNG queda debajo de las pantallas animadas.

La transición `DevFest · Glifos` dura **1,2 segundos** y cambia la escena en **600 ms**, cuando cubre el lienzo. `Desvanecimiento` a 300 ms y `Corte` quedan como alternativas.

El panel no contiene acciones para iniciar ni detener una transmisión, ni para modificar claves de emisión.

## Si falla el panel o un gráfico

Los cambios de escena siguen disponibles en OBS. Los PNG están debajo de las pantallas HTML: si el HTML queda bloqueado, oculta su fuente con el ojo. El PNG de respaldo de Próxima charla muestra una pausa genérica para evitar anunciar un nombre desactualizado. Si el panel se detiene, los rótulos dinámicos se ocultan tras fallar la lectura de estado; las pantallas continúan visibles. El arranque del panel siempre deja los rótulos ocultos.

Para mostrar un nombre sin panel, abre `RESPALDO · Rótulos individuales`, copia como referencia la fuente del ponente hacia la escena de cámara y habilítala. Cada HTML individual funciona sin servidor y muestra solo un nombre. Para la composición mixta, ajusta su posición a una zona que no cubra las diapositivas. Oculta el rótulo dinámico para no duplicar nombres.

Si aparece un error de conexión, verifica OBS abierto, WebSocket activo y autenticación correcta. Si el puerto 8787 está ocupado por este mismo panel, el iniciador reutiliza la ventana. Si corresponde a otro programa, libera ese puerto: los gráficos entregados esperan 8787.

Si necesitas cambiar de perfil o colección durante las pruebas, espera a terminar cualquier operación. Para una reconfiguración extensa, detén el panel con Control+C y vuelve a abrirlo al terminar. El controlador pausa peticiones al recibir los avisos de cambio de OBS.

## Actualizar nombres y patrocinadores

Edita `05_Datos/produccion.json` en la **carpeta de operación**. Conserva los identificadores de los 15 ponentes. Los títulos originales están guardados como borrador y no se muestran en la señal.

Para logos autorizados, crea `01_Identidad/patrocinadores`, coloca los archivos PNG/JPG/SVG y completa `sponsors`, por ejemplo:

```json
"sponsors": [{"name": "Nombre confirmado", "file": "aliado.png"}]
```

Usa hasta cuatro logos por pantalla para conservar legibilidad. Ejecuta `node 05_Datos/actualizar.mjs`, reinicia el panel y pulsa **Recargar gráficos**. Comprueba la pantalla de patrocinadores antes de pasarla al programa. No se han inventado patrocinadores ni se han incluido marcas como si hubieran confirmado auspicio.

La identidad usa la referencia JPEG del organizador, logotipos extraídos de las guías adjuntas, fuentes Google Sans y Google Sans Mono de los recursos oficiales y paleta #4285F4, #EA4335, **#F9AB00**, #34A853. Los logotipos conservan su proporción. La referencia JPEG se mantiene intacta; las ventanas se vuelven transparentes con máscaras técnicas, por lo que no se necesita chroma verde.

Se descargaron cuatro MP4 oficiales de la carpeta Motion Loops enlazada desde la guía DevFest 2026. El sistema emite **DF26_URL.mp4**. Los originales SaveTheDate, MakeNewFriends y JoinUs conservan mensajes en inglés y se guardan como biblioteca, sin habilitarlos en las escenas. Los 14 GIF incrustados en la guía también se conservan como referencia. No se muestran textos de plantilla, cargos ni títulos en borrador.

**Franja informativa:** escribe el mensaje y pulsa Aplicar mensaje. La casilla Mostrar franja controla el texto en la escena principal, preguntas y pantallas de pausa. Las vistas de cámara amplia y diapositivas completas conservan el contenido libre de esa franja.

La página detecta la colección local al abrirse. El selector Auditorio de esta Mac sirve para elegir el track; si no coincide con OBS, sus controles se bloquean hasta seleccionar la colección correcta en OBS. Cada Mac abre http://127.0.0.1:8787 y controla solo su propio OBS; no necesita conocer la dirección de la otra Mac.

## Antes de autorizar una emisión real

Confirma la agenda y los nombres con producción; configura una URL y clave diferente por track; revisa cámaras, HDMI, audio y conexión cableada; graba un ensayo completo y escucha su sincronización; confirma que no hay imágenes de prueba visibles. Los perfiles nuevos tienen el destino y la clave vacíos. La tasa provisional de video es 6000 kb/s con H.264 y audio AAC 160 kb/s: ajústala según la plataforma y una prueba real de subida. Las grabaciones se guardan en MKV bajo `Grabaciones/Track_1` o `Track_2` y pueden remultiplexarse desde Archivo en OBS.

Elige un disco de grabación con capacidad para la jornada y pruébalo antes del evento.

Solo una persona autorizada debe iniciar la transmisión desde OBS. No se inició ninguna emisión durante la preparación.

## Respaldo y restauración

También existe un respaldo previo a la revisión de marca en `obs-gdgdevfest/respaldos/antes-marca-20261030-161339`. La versión anterior de las colecciones se conserva. Antes de la instalación inicial se copió toda la configuración de OBS a `obs-gdgdevfest/respaldos/20261027-180536/obs-studio` dentro del proyecto. Ese respaldo puede contener claves de la configuración anterior: se conserva local y no se incluye en el ZIP para compartir.

La colección y el perfil **Sin Título** se conservan. Para volver a ellos, selecciónalos en sus menús. Para restaurar todo: cierra OBS, haz una copia de la configuración actual y copia el respaldo sobre `~/Library/Application Support/obs-studio`. Esta restauración completa también revierte cambios posteriores al respaldo; no la ejecutes si basta con seleccionar el perfil anterior.

## Referencias técnicas

- [Protocolo oficial de OBS WebSocket](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)
- [Fuentes de navegador de OBS](https://github.com/obsproject/obs-browser)
- [Implementación oficial de la transición Stinger](https://github.com/obsproject/obs-studio/blob/master/plugins/obs-transitions/transition-stinger.c)
