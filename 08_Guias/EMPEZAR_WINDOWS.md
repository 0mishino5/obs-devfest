# Windows: empezar, practicar y terminar

## Abrir ahora, sin cámara ni micrófono

1. Abre la carpeta `obs-devfest-windows` y haz doble clic en **VER_DISENO_WINDOWS.cmd**.
2. La primera vez se prepara una copia de OBS usando el OBS que ya está instalado. Después se abren OBS, el panel y la guía visual. Mantén abierta la ventana del iniciador.
   Si aparece el Asistente de configuración automática de OBS, pulsa **Cancelar**: los perfiles de esta práctica ya están preparados.
3. En el panel debe aparecer **OBS conectado** y **Sin emisión**. La dirección es http://127.0.0.1:8787.
4. La guía con galería animada está en http://127.0.0.1:8787/07_Control/guia-windows.html.

La vista de diseño utiliza su propia configuración en `%LOCALAPPDATA%\DevFestArequipa2026\OBS_Demo`. Las zonas de cámara y diapositivas muestran imágenes de prueba. El audio de sala queda silenciado y los perfiles de esta demo tienen el destino de emisión vacío.

## Cómo manejar una escena

Deja **Modo Estudio** activado. En OBS, la izquierda muestra lo que preparas (Vista previa) y la derecha lo que está en programa. En el panel:

1. Elige la escena.
2. Pulsa la pestaña **Vista previa** para revisarla.
3. Pulsa **Pasar al programa** para mostrarla con la transición seleccionada.

La imagen del panel se actualiza cada pocos segundos. Para evaluar animaciones fluidas, mira OBS; también puedes usar la galería animada de la guía.

## Recorrido para ver todo el diseño

| Escena | Qué revisar |
| --- | --- |
| 01 · Bienvenida | Identidad, video pequeño, mensaje inferior |
| 02 · Diapositivas + ponente | Bordes, cámara izquierda, diapositivas derecha, nombre bajo la cámara |
| 03 · Cámara del ponente | Marco amplio y rótulo grande |
| 04 · Diapositivas completas | Marco de la presentación |
| 05 · Preguntas y respuestas | Composición de cámara y diapositivas |
| 06 · Próxima charla | Nombre del ponente seleccionado |
| 07 · Espera | Pantalla de pausa |
| 08 · Almuerzo | Pausa de almuerzo |
| 09 · Patrocinadores | Agradecimiento general; logos pendientes de confirmar |
| 10 · Problemas técnicos | Pantalla de pausa técnica |
| 11 · Cierre | Despedida del evento |
| 12 · Diapositivas limpias | Presentación a pantalla completa, sin bordes |
| 13 · Animación oficial DevFest | Video oficial en bucle |

En la escena 02, selecciona un ponente y pulsa **Mostrar nombre**, **Repetir entrada** y **Ocultar**. Cambia de nombre y repite para comprobar nombres largos. En la escena 03 el rótulo tiene otro tamaño.

Escribe un mensaje en **Franja informativa** y pulsa **Aplicar mensaje**. La casilla Mostrar franja permite ocultarlo. Se ve en la composición mixta y pantallas de pausa; no cubre la cámara amplia ni las diapositivas completas.

Deja activado **Movimiento en gráficos**. Desactívalo y vuelve a activarlo para comparar. Los bordes mantienen la composición: el movimiento está en videos, entrada/salida de rótulos y transiciones.

En **Transición**, prueba **DevFest · Glifos**, **Desvanecimiento** y **Corte**, cambiando de escena y pulsando Pasar al programa. Glifos dura 1,2 segundos y cambia de escena en 600 ms.

El botón rojo **Pausa técnica al programa** es inmediato: muestra la escena 10 sin necesitar otra pulsación de Pasar al programa.

## Revisar Track 2

En OBS, abre **Colección de Escenas** y selecciona `DEVFEST_AREQUIPA_2026_TRACK_2_MARCA`. Selecciona también su perfil `DEVFEST_2026_TRACK_2_1080p`. Espera un momento y elige Track 2 en el panel. Los controles se habilitan cuando ambos coinciden. Repite el recorrido. La galería de la guía permite comparar los gráficos de ambos tracks sin cambiar OBS.

## Terminar la práctica

1. Selecciona **11 · Cierre** y pulsa **Pasar al programa**.
2. Pulsa **Ocultar** para retirar el nombre. Deja el audio silenciado.
3. Cierra **OBS**: el iniciador detiene el panel de la demo automáticamente. Alternativamente, pulsa **Ctrl+C** en la ventana del iniciador.
4. Cierra las pestañas del navegador.

La próxima sesión empieza con VER_DISENO_WINDOWS.cmd. Cada inicio restablece las escenas y datos de práctica de esta demo.

## Cuando lleguen la cámara y el micrófono

Para la instalación normal: con OBS cerrado ejecuta `INSTALAR_WINDOWS.cmd`; después abre el OBS normal y selecciona el perfil y colección del track. Habilita WebSocket con autenticación en Herramientas y ejecuta `INICIAR_PANEL.cmd`. Esta instalación es independiente de la vista de diseño.

Configura la cámara en `FUENTE · Cámara del ponente`, las diapositivas en `FUENTE · Diapositivas` y la consola/interfaz en `T1/T2 · Audio de sala`. Oculta las imágenes de prueba y comprueba imagen, niveles y sincronía en una grabación local. Sigue `OPERACION.md` antes de preparar una emisión real.

Si dice OBS desconectado, comprueba que abriste VER_DISENO_WINDOWS.cmd y que OBS sigue abierto. Si el puerto 8787 está ocupado, cierra el otro panel antes de volver a abrir la demo. Para visualizar gráficos sin OBS, utiliza la galería mientras el servidor esté activo.
