# DevFest Arequipa 2026 · Producción OBS · Marca v2

GDG Arequipa · @gdgaqp

Dos tracks independientes: **Auditorio R Grandote** y **Auditorio B**. Resolución 1920×1080 a 30 FPS. Sin cuentas regresivas.

**Empieza por `08_Guias/OPERACION.md`.** En esta Mac ya se instalaron OBS, las dos colecciones y sus perfiles. Los recursos activos están en `/Users/Shared/DevFest_Arequipa_2026_Marca`.

Para abrir el control local, ejecuta `INICIAR_PANEL.command`. El panel necesita Node.js 22 o superior y el servidor WebSocket autenticado de OBS. No requiere instalar paquetes npm. Mantén abierta su Terminal durante la operación.

En otra Mac, ubica la carpeta completa en un lugar estable, cierra OBS y ejecuta `INSTALAR_MAC.command`. El instalador respalda y añade; no reemplaza configuraciones ya existentes. También puedes usar `PREPARAR_IMPORTACION.command` e importar los JSON manualmente.

| Carpeta | Contenido |
| --- | --- |
| 00_Originales | ZIP suministrado, intacto |
| 01_Identidad | Referencia del organizador y carpeta para logos autorizados |
| 02_Graficos | Pantallas PNG, marcos transparentes e imágenes de prueba |
| 03_HTML | Pantallas animadas, rótulos dinámicos e individuales |
| 04_Transiciones | Stinger con glifos y biblioteca de animaciones oficiales |
| 05_Datos | Lista editable de ponentes y patrocinadores; cronograma original |
| 06_OBS | Colecciones JSON, perfiles y preparación de rutas |
| 07_Control | Panel y servidor local |
| 08_Guias | Operación y auditoría de los 49 originales |
| 09_Pruebas | Inventario, verificaciones y capturas del OBS real |
| Grabaciones | Ensayos locales por track, si se incluyen en esta copia |

Quedan por conectar y probar las cámaras, capturadoras, consola y red del evento. También faltan confirmar agenda, patrocinadores y destino de cada emisión. Los 15 nombres del ZIP están habilitados para pruebas. No se inició ninguna transmisión real.

Esta revisión incorpora las dos guías de marca, la composición cámara izquierda / diapositivas derecha, 13 escenas por track y una sola página local por Mac. Selecciona las colecciones terminadas en `_MARCA`. Los perfiles existentes se conservan. Las fuentes físicas y destinos de emisión se configuran en OBS cuando estén confirmados.
