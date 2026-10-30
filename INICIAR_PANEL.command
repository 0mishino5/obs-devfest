#!/bin/zsh
cd -- "${0:A:h}"
NODE_BIN=$(command -v node)
if [[ -z "$NODE_BIN" && -x /opt/homebrew/bin/node ]]; then NODE_BIN=/opt/homebrew/bin/node; fi
if [[ -z "$NODE_BIN" && -x /usr/local/bin/node ]]; then NODE_BIN=/usr/local/bin/node; fi
if [[ -z "$NODE_BIN" ]]; then echo 'Instala Node.js 22 o superior desde https://nodejs.org y vuelve a abrir este archivo.'; read; exit 1; fi
"$NODE_BIN" -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)' || { echo 'Se necesita Node.js 22 o superior.'; read; exit 1; }
if /usr/bin/curl --silent --fail http://127.0.0.1:8787/api/config >/dev/null; then
  if /usr/bin/curl --silent http://127.0.0.1:8787/api/config | "$NODE_BIN" --input-type=module -e 'let s="";for await(const c of process.stdin)s+=c;try{if(JSON.parse(s).version!=="marca-2026-v2")process.exit(1)}catch{process.exit(1)}'; then
    open http://127.0.0.1:8787
    exit 0
  fi
  echo 'Ya hay otro panel usando el puerto 8787. Ciérralo con Control+C y vuelve a iniciar esta versión.'
  read
  exit 1
fi
(sleep 1; open http://127.0.0.1:8787) &
echo 'Mantén esta ventana abierta durante la operación. Control+C detiene el panel.'
"$NODE_BIN" --no-warnings 07_Control/servidor.mjs
