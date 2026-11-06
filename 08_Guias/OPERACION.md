# Operación · macOS y Windows

DevFest Arequipa 2026 · GDG Arequipa · @gdgaqp. Lienzo y salida 1920×1080, 30 FPS. Cada computadora controla su propio OBS y su track. Ambas versiones incluyen Track 1 (Auditorio R Grandote) y Track 2 (Auditorio B).

## Elegir la carpeta

Usa `obs-devfest-mac` en macOS y `obs-devfest-windows` en Windows. `plataforma.json` identifica el sistema de cada copia. El panel se niega a arrancar con el paquete del otro sistema. Las dos carpetas son repositorios locales independientes con el historial original; no se crean repositorios nuevos en GitHub al generarlas.

Instala OBS Studio desde https://obsproject.com/ y Node.js 22 o superior desde https://nodejs.org/. No necesitas paquetes npm. Si clonas desde GitHub, instala Git LFS y ejecuta `git lfs pull`.

## Instalar

1. Guarda la carpeta completa en un lugar estable y con permisos de escritura. En Mac se recomienda `/Users/Shared/DevFest_Arequipa_2026_Marca`; en Windows, una carpeta local del usuario.
2. Cierra OBS. En Mac ejecuta `INSTALAR_MAC.command`; en Windows, `INSTALAR_WINDOWS.cmd`.
3. El instalador adapta las rutas y las fuentes nativas, respalda la configuración de OBS bajo `Respaldos_locales` y añade las dos colecciones. Conserva los perfiles existentes. Si cualquiera de las colecciones ya existe, se detiene antes de instalar tracks. No elimina ni reemplaza colecciones previas.
4. Abre OBS. Selecciona el perfil `DEVFEST_2026_TRACK_1_1080p` o `DEVFEST_2026_TRACK_2_1080p`, y la colección del mismo track terminada en `_MARCA`.
5. En Herramientas → Ajustes del servidor WebSocket, habilita el servidor con autenticación, puerto 4455. La contraseña se lee en el servidor local y nunca se envía al navegador.
6. Ejecuta `INICIAR_PANEL.command` en Mac o `INICIAR_PANEL.cmd` en Windows. Abre http://127.0.0.1:8787 y mantén abierta la terminal. Ctrl+C detiene el panel. Si otro panel ocupa ese puerto, ciérralo primero.

La instalación automática escribe en `~/Library/Application Support/obs-studio` en Mac y en `%APPDATA%\obs-studio` en Windows. Si utilizas OBS portátil o una configuración alternativa, define `DEVFEST_OBS_CONFIG_DIR` como la carpeta de configuración que contiene `basic` y `plugin_config`, tanto al instalar como al iniciar el panel. Por ejemplo, en PowerShell:

```powershell
$env:DEVFEST_OBS_CONFIG_DIR = 'D:\OBS\config\obs-studio'
node 06_OBS/preparar.mjs --instalar
node 07_Control/iniciar.mjs
```

En macOS puedes usar `export DEVFEST_OBS_CONFIG_DIR='/ruta/config/obs-studio'` antes de los mismos comandos.

## Importar manualmente o mover la carpeta

Ejecuta `PREPARAR_IMPORTACION.command` o `PREPARAR_IMPORTACION.cmd` en el sistema correspondiente. Después importa el JSON de `06_OBS/Colecciones` desde Colección de Escenas → Importar y el perfil de `06_OBS/Perfiles`. Si ya existe una colección con ese nombre, elige un nombre nuevo en OBS y adapta `collection` en `05_Datos/produccion.json`, ejecuta `node 05_Datos/actualizar.mjs` y reinicia el panel.

Al mover la carpeta se deben volver a preparar e importar las colecciones: las rutas de los recursos en OBS son absolutas. El panel no modifica las colecciones instaladas al arrancar. La copia Mac generada en Windows contiene rutas relativas de transporte; su instalador o preparador las convierte a rutas Mac antes de importar.

## Conectar cámaras, diapositivas y audio

En `FUENTE · Cámara del ponente`, abre las propiedades de `T1/T2 · Cámara 1 · configurar` y selecciona la cámara o capturadora. En Windows es una fuente Dispositivo de captura de video (DirectShow); en Mac, una fuente de captura de video de macOS. Selecciona 1920×1080 a 30 FPS si el dispositivo lo admite. Activa solo esa fuente y oculta `Prueba cámara`. La segunda cámara queda como alternativa oculta. Los canales de audio de las cámaras están excluidos del mezclador de la colección para evitar duplicaciones.

En `FUENTE · Diapositivas`, configura `Diapositivas HDMI · configurar` o la fuente `Diapositivas Windows/macOS · configurar` si la presentación se ejecuta en este equipo. En Windows selecciona una ventana concreta; en Mac concede a OBS permiso de grabación de pantalla. Activa una sola entrada y oculta `Prueba diapositivas`. Ajusta al lienzo sin deformar ni recortar texto.

`T1/T2 · Audio de sala` usa WASAPI en Windows y CoreAudio en Mac. Está sin dispositivo seleccionado y silenciada. Selecciona la consola/interfaz y escucha una grabación antes de activarla. Evita duplicar el audio con micrófonos internos o cámaras. Comprueba sincronía labial, ausencia de saturación y permisos de micrófono. El botón Conectar micrófono comparte esta misma entrada en las 13 escenas, incluidas las pausas. Silenciar micrófono la apaga en todas a la vez. Consulta [Micrófono fácil](MICROFONO_FACIL.md).

## Escenas y controles

Las 13 escenas de producción son: bienvenida; diapositivas + ponente; cámara del ponente; diapositivas completas; preguntas; próxima charla; espera; almuerzo; patrocinadores; problemas técnicos; cierre; diapositivas limpias; animación oficial DevFest. Las tres escenas auxiliares organizan las entradas y rótulos de respaldo.

La composición principal mantiene cámara a la izquierda (74,380; 552×315), diapositivas a la derecha (682,219; 1182×642), nombre bajo la cámara y franja inferior editable. No hay contadores ni cambios por horario.

Con Modo Estudio activo, un botón prepara la vista previa y **Pasar al programa** ejecuta la transición. Sin Modo Estudio los cambios son directos. El retorno del panel es una captura periódica, no un monitor de video en tiempo real; supervisa la señal y el audio en OBS.

Selecciona ponente y usa Mostrar, Ocultar o Repetir entrada. Solo se emite el nombre. La franja admite 140 caracteres. Movimiento controla HTML y videos; las transiciones se eligen por separado. DevFest · Glifos dura 1,2 segundos con corte a 600 ms; también hay Desvanecimiento y Corte. Pausa técnica cambia al programa directamente.

El selector de track bloquea controles si no coincide con la colección activa en OBS. El panel nunca inicia ni detiene transmisiones. Conectar micrófono recuerda el dispositivo seleccionado y lo activa en las 13 escenas. El botón de silencio lo apaga o reactiva en todas.

## Datos y respaldos

Edita nombres y patrocinadores en `05_Datos/produccion.json`, conservando los identificadores. Para patrocinadores confirmados, coloca los logos en `01_Identidad/patrocinadores` y completa `sponsors`. Ejecuta `node 05_Datos/actualizar.mjs`, reinicia el panel y recarga gráficos. Los títulos y horarios son borradores y no disparan cambios automáticos.

Los PNG quedan bajo los HTML como respaldo. Si falla un gráfico, oculta su fuente de navegador. Los rótulos dinámicos se ocultan si pierden el panel; los 15 rótulos HTML individuales funcionan sin servidor. Puedes copiar una fuente desde `RESPALDO · Rótulos individuales` y ocultar el rótulo dinámico para no duplicar nombres.

Los nuevos perfiles no incluyen plataforma ni clave de emisión. La configuración provisional es H.264, 6000 kb/s y AAC 160 kb/s. Las grabaciones se guardan en MKV bajo `Grabaciones/Track_1` o `Track_2`. Un perfil que ya existía conserva sus propios ajustes y claves.

Para restaurar una configuración anterior, cierra OBS y conserva una copia del estado actual antes de restaurar el respaldo. No necesitas restaurar toda la configuración si basta con seleccionar la colección anterior.

## Verificar antes del evento

Ejecuta `node 09_Pruebas/verificar.mjs` y `node --test 09_Pruebas/compatibilidad.test.mjs`. Las pruebas de software no sustituyen la selección y ensayo de cámaras, HDMI, consola, sincronía, red, disco, plataformas y dos equipos simultáneos. Agenda y patrocinadores siguen pendientes de confirmación. Solo una persona autorizada debe iniciar una emisión desde OBS.

La documentación y los ensayos de la primera Mac están conservados en `11_Historial`, `09_Pruebas/RESULTADOS.md` y sus capturas. No son evidencia de instalación en la computadora actual.
