@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto node_missing
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 goto node_missing
echo Manten esta ventana abierta. Ctrl+C detiene el panel.
node 07_Control\iniciar.mjs
if errorlevel 1 goto failed
exit /b 0
:node_missing
echo Instala Node.js 22 o superior desde https://nodejs.org.
:failed
echo No se pudo abrir el panel. Revisa el mensaje anterior.
pause
exit /b 1
