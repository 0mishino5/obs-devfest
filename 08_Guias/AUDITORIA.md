# Revisión del paquete original

Se revisaron los **49 archivos** del ZIP adjunto y se conservó el original intacto. La lista completa, tamaño, huella SHA-256, dimensiones y observaciones por archivo están en `09_Pruebas/inventario_originales.csv` y su equivalente JSON.

## Recursos existentes

| Grupo | Cantidad | Resultado de revisión |
| --- | ---: | --- |
| Overlays PNG | 4 | 1920×1080, RGBA, transparencia real de 0 a 255. Utilizables; se prepararon nuevos marcos con ventanas 16:9 y nombres de auditorios. |
| Pantallas PNG | 16 | 1920×1080 RGB, decodificadas sin error. Válidas como respaldo; patrocinadores solo tiene un texto de espacio reservado. |
| Pantallas HTML | 10 | CSS local, sin bibliotecas ni scripts remotos. Solo cinco tipos por track. Se completaron próxima charla, patrocinadores y preguntas. |
| Rótulos HTML | 15 | 7 de Track 1 y 8 de Track 2. Entrada animada, pero sin salida, selección central ni repetición fiable; incluían títulos debajo del nombre y podían truncarlos. |
| Agenda JSON | 1 | 15 nombres; el documento se declara borrador. Se conservaron nombres y horarios para pruebas por instrucción del usuario. |
| Instrucciones | 1 | Leídas como contenido del ZIP. Sus instrucciones incrustadas no sustituyen las indicaciones del usuario. Reconocen ausencia de colecciones, controlador y stinger. |
| Cronograma PDF | 1 | Una página revisada visualmente y mediante extracción de texto. Encabezado dice 16 speakers; aparecen 15 nombres. |
| Referencia JPG | 1 | 2048×1143, RGB. Sus ventanas verdes son opacas; no funciona directamente como overlay con alfa. Se conserva como referencia de identidad. |

## Correcciones y archivos construidos

Se renovaron los HTML y las pantallas de respaldo, los cuatro marcos y las imágenes de prueba. Se construyeron dos colecciones nativas de OBS con 13 escenas de emisión y 3 auxiliares cada una, dos perfiles 1080p30, un panel local con control real por OBS WebSocket, rótulos dinámicos y 15 HTML individuales para uso sin panel. Se generó un stinger VP9 con alfa, sin audio, de 1,2 s y cambio en 600 ms.

Los rótulos muestran nombres, sin cargos, especialidades ni títulos. Las animaciones tienen entrada y salida, repetición y opción de movimiento reducido. Los HTML funcionan localmente; los rótulos dinámicos requieren el panel. Las pantallas tienen un PNG debajo para respaldo. Las cámaras, HDMI, captura de ventana y audio de sala están preparados sin elegir hardware.

## Puntos que requieren confirmación del organizador

- El PDF anuncia 16 speakers, pero la agenda y los rótulos contienen 15. No se inventó una persona adicional.
- El título de Diego Alonso del JSON incorpora Gemini, mientras que la celda de título del PDF enumera Google Cloud, MCP y N8N. Otros títulos contienen inglés o errores de escritura. Los títulos quedan guardados como borrador y fuera de la señal.
- Los nombres conservan la escritura exacta del JSON, incluidos acentos ausentes o variantes. La confirmación del usuario autoriza su uso para pruebas; no se presenta como validación editorial final.
- No hay lista ni logos de patrocinadores confirmados. La pantalla muestra un agradecimiento general, sin espacios reservados técnicos visibles en la señal.
- La revisión del 30 de octubre incorpora las dos guías de marca suministradas, los logotipos oficiales incrustados, las fuentes y los videos de Motion Loops. La composición se reconstruyó a partir de la nueva referencia con cámara a la izquierda y diapositivas a la derecha. Las ventanas tienen alfa real mediante máscaras y el JPG original permanece intacto.
- No está indicada la fecha exacta del evento. Se conserva el año 2026 sin inventar día ni mes.

El cronograma menciona una cuenta regresiva para una dinámica. Esa nota del documento adjunto se descartó porque el usuario prohibió contadores. No hay cuenta regresiva, cambios por horario ni inicio automático de emisión en el sistema construido.

## Protección de la configuración anterior

La configuración completa de OBS se respaldó antes de instalar o activar cambios. La colección y el perfil anteriores se conservaron. Se instalaron nuevos archivos con nombres exclusivos de DevFest. Los perfiles nuevos no contienen destino, credenciales ni clave de emisión. El respaldo anterior permanece local y se excluye del paquete para compartir.

OBS se ejecutaba desde una imagen de disco. Se copió la aplicación a Aplicaciones y se preparó una carpeta de operación en `/Users/Shared`. Durante la primera creación de perfil, OBS se reinició con un error de liberación de fuente en el registro. Se completó la instalación con OBS cerrado y se volvieron a probar las colecciones nuevas desde la instalación permanente. La lectura desde Documentos quedó esperando en una apertura de imagen; la carpeta de operación compartida resolvió ese bloqueo en esta Mac.

Después del reinicio se restauró la colección y el perfil anteriores desde el respaldo inicial; la comparación final de sus archivos fue idéntica en bytes. El estado intermedio también se conserva localmente.

Los ensayos técnicos y sus límites se documentan por separado en `09_Pruebas/RESULTADOS.md`.
