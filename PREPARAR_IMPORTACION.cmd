@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto node_missing
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 goto node_missing
node 06_OBS\preparar.mjs
if errorlevel 1 goto failed
echo Importa el JSON de tu track desde Coleccion de Escenas - Importar.
pause
exit /b 0
:node_missing
echo Instala Node.js 22 o superior desde https://nodejs.org.
:failed
echo No se pudo preparar el paquete. Revisa el mensaje anterior.
pause
exit /b 1
