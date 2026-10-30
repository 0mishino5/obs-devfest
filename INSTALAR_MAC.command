#!/bin/zsh
cd -- "${0:A:h}"
NODE_BIN=$(command -v node)
if [[ -z "$NODE_BIN" && -x /opt/homebrew/bin/node ]]; then NODE_BIN=/opt/homebrew/bin/node; fi
if [[ -z "$NODE_BIN" && -x /usr/local/bin/node ]]; then NODE_BIN=/usr/local/bin/node; fi
if [[ -z "$NODE_BIN" ]]; then echo 'Instala Node.js 22 o superior desde https://nodejs.org'; read; exit 1; fi
"$NODE_BIN" 06_OBS/preparar.mjs --instalar
echo 'Proceso terminado. Lee el resultado anterior y pulsa Intro para cerrar.'
read
