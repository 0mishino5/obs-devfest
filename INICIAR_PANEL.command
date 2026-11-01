#!/bin/zsh
cd -- "${0:A:h}"
NODE_BIN=$(command -v node)
if [[ -z "$NODE_BIN" && -x /opt/homebrew/bin/node ]]; then NODE_BIN=/opt/homebrew/bin/node; fi
if [[ -z "$NODE_BIN" && -x /usr/local/bin/node ]]; then NODE_BIN=/usr/local/bin/node; fi
if [[ -z "$NODE_BIN" ]]; then echo 'Instala Node.js 22 o superior desde https://nodejs.org'; read; exit 1; fi
"$NODE_BIN" -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' || { echo 'Se necesita Node.js 22 o superior.'; read; exit 1; }
echo 'Mantén esta ventana abierta durante la operación. Control+C detiene el panel.'
"$NODE_BIN" 07_Control/iniciar.mjs
RESULT=$?
if [[ $RESULT -ne 0 ]]; then echo 'Revisa el mensaje anterior y pulsa Intro.'; read; fi
exit $RESULT
