# DevFest Arequipa 2026 · OBS · macOS y Windows

Producción local para GDG Arequipa · @gdgaqp. Dos tracks independientes, 1080p30, 13 escenas de producción por track y 15 nombres para pruebas.

Este repositorio base genera dos copias locales independientes con el historial Git y todos los recursos:

```sh
node scripts/separar.mjs
```

Se crean `obs-devfest-mac` y `obs-devfest-windows` junto a esta carpeta. El comando se detiene si ya existen esas carpetas. Puedes indicar otra carpeta de salida: `node scripts/separar.mjs /ruta/de/salida`.

En la copia Mac, ejecuta `INSTALAR_MAC.command` con OBS cerrado y después `INICIAR_PANEL.command`. En Windows, usa `INSTALAR_WINDOWS.cmd` e `INICIAR_PANEL.cmd`. Cada paquete contiene los dos tracks y un archivo `plataforma.json`. Los tipos de fuente y rutas de configuración corresponden a su sistema.

Necesita OBS Studio y Node.js 22 o superior; no requiere paquetes npm. Instala Git LFS y ejecuta `git lfs pull` después de clonar para obtener videos, fuentes, ZIP y guías completos. Las dos copias conservan el remoto original; no se publican nuevos repositorios automáticamente.

El panel local en http://127.0.0.1:8787 controla escenas, vista previa/programa, ponentes, franja, movimiento, transiciones y silencio de OBS mediante WebSocket autenticado. Cada equipo controla únicamente su OBS. No inicia emisiones ni incluye contadores.

Los instaladores respaldan y añaden; preservan perfiles y rechazan colecciones duplicadas. Los nuevos perfiles tienen destino y clave vacíos. Cámaras, HDMI, ventanas y consola se seleccionan en OBS cuando se conozcan los dispositivos.

- [Guía de operación](08_Guias/OPERACION.md).
- [Diferencias y compatibilidad](08_Guias/PLATAFORMAS.md).
- [Pruebas de las plataformas](09_Pruebas/RESULTADOS_PLATAFORMAS.md).
- [Requisitos del organizador](08_Guias/IDEAS_DECISIONES_Y_REQUISITOS.md).
- [Inventario original](10_Referencias/INVENTARIO_ENTREGAS.md).

Verifica con `node 09_Pruebas/verificar.mjs` y `node --test 09_Pruebas/compatibilidad.test.mjs`. Los ensayos previos de la Mac original y sus guías están conservados como historial; no acreditan pruebas de hardware en las nuevas computadoras.

Los recursos de terceros conservan sus condiciones de uso. Credenciales, respaldos privados, estado local y futuras grabaciones se excluyen de Git.
