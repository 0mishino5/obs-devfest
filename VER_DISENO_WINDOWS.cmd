@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto missing
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 goto missing
echo DevFest - Vista de diseno para Windows
echo Se abrira OBS, el panel y una guia de practica.
echo Para terminar, cierra OBS o pulsa Ctrl+C en esta ventana.
node 07_Control\demo-windows.mjs
if errorlevel 1 pause
exit /b
:missing
echo Instala Node.js 22 o superior desde https://nodejs.org.
pause
exit /b 1
