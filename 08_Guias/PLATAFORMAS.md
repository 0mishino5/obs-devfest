# Compatibilidad por sistema

Cada entrega contiene los dos tracks y todos los recursos del repositorio. La separación conserva el historial Git y no crea repositorios remotos nuevos.

| Componente | macOS | Windows |
| --- | --- | --- |
| Instalación | INSTALAR_MAC.command | INSTALAR_WINDOWS.cmd |
| Control local | INICIAR_PANEL.command | INICIAR_PANEL.cmd |
| Preparación manual | PREPARAR_IMPORTACION.command | PREPARAR_IMPORTACION.cmd |
| Cámara y HDMI | av_capture_input_v2 | dshow_input |
| Presentación del equipo | screen_capture | window_capture |
| Audio de sala | coreaudio_input_capture | wasapi_input_capture |
| Configuración OBS | ~/Library/Application Support/obs-studio | %APPDATA%/obs-studio |

OBS portátil usa una carpeta distinta. `DEVFEST_OBS_CONFIG_DIR` permite señalar explícitamente esa configuración tanto al instalar como al iniciar. Solo se controla un OBS local y un track a la vez por computadora.

Las fuentes físicas quedan sin dispositivo seleccionado y sus escenas de prueba continúan visibles hasta que un operador configure las entradas. Se conservan UUID, máscaras, posiciones, composiciones y recursos de marca. Los instaladores hacen respaldo, conservan perfiles existentes y rechazan colecciones duplicadas antes de instalar.

`node --test 09_Pruebas/compatibilidad.test.mjs` comprueba las rutas por sistema, las fuentes de ambos tracks, referencias y UUID, relocalización, respaldos, protección ante duplicados y autenticación/solicitudes/reconexión WebSocket. Usa configuración temporal y no modifica la instalación personal de OBS.

Los ensayos de `RESULTADOS.md` son los realizados en la Mac original el 30 de octubre de 2026. Falta repetir el ensayo de hardware y emisión en los equipos finales. La copia macOS se prepara y verifica estructuralmente desde Windows; su instalación nativa debe ejecutarse en una Mac. Las pruebas nuevas se describen en `09_Pruebas/RESULTADOS_PLATAFORMAS.md`.

Fuentes técnicas verificadas: [captura DirectShow](https://github.com/obsproject/obs-studio/blob/master/plugins/win-dshow/win-dshow.cpp), [audio WASAPI](https://github.com/obsproject/obs-studio/blob/master/plugins/win-wasapi/win-wasapi.cpp), [captura de ventana](https://github.com/obsproject/obs-studio/blob/master/plugins/win-capture/window-capture.c), [modo portátil](https://obsproject.com/kb/portable-mode) y [parámetros de arranque](https://obsproject.com/kb/launch-parameters).
