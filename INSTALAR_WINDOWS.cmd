@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto node_missing
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 goto node_missing
node 06_OBS\preparar.mjs --instalar
if errorlevel 1 goto failed
echo Instalacion terminada. Abre OBS y selecciona tu track.
pause
exit /b 0
:node_missing
echo Instala Node.js 22 o superior desde https://nodejs.org y abre de nuevo este archivo.
:failed
echo No se pudo completar la instalacion. Revisa el mensaje anterior.
pause
exit /b 1
