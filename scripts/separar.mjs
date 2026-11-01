import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT,hostPlatform,copyTree} from '../06_OBS/plataforma.mjs';
import {prepare} from '../06_OBS/preparacion.mjs';

const parent = path.resolve(process.argv[2] || path.dirname(ROOT));
const targets = ['macos','windows'].map(platform=>({platform,dest:path.join(parent,platform==='macos'?'obs-devfest-mac':'obs-devfest-windows')}));
for (const {dest} of targets) if (fs.existsSync(dest)) throw new Error(`Ya existe ${dest}. Elige otra carpeta de salida; no se reemplazan copias existentes.`);
const files = execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean);
const origin = execFileSync('git',['remote','get-url','origin'],{cwd:ROOT,encoding:'utf8'}).trim();
for (const {platform,dest} of targets) {
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  execFileSync('git',['clone','--no-hardlinks','--no-checkout',ROOT,dest],{stdio:'pipe'});
  execFileSync('git',['read-tree','HEAD'],{cwd:dest});
  execFileSync('git',['remote','set-url','origin',origin],{cwd:dest});
  execFileSync('git',['switch','-c',`codex/${platform}`],{cwd:dest});
  for (const file of files) {
    if (platform === 'windows' && file.endsWith('.command')) continue;
    if (platform === 'macos' && file.endsWith('.cmd')) continue;
    if (platform === 'macos' && (file === '09_Pruebas/ensayo-windows.mjs' || file.startsWith('09_Pruebas/Windows/'))) continue;
    const from = path.join(ROOT,file), to = path.join(dest,file);
    if (!fs.existsSync(from)) continue;
    fs.mkdirSync(path.dirname(to),{recursive:true});
    fs.copyFileSync(from,to);
    if (/\.(?:mjs|js|css|html|md|json|ini|command|cmd)$/.test(file) || ['.gitattributes','.gitignore'].includes(file)) {
      const content=fs.readFileSync(to,'utf8').replaceAll('\r\n','\n');
      fs.writeFileSync(to,file.endsWith('.cmd')?content.replaceAll('\n','\r\n'):content);
    }
    if (file.endsWith('.command')) fs.chmodSync(to,0o755);
  }
  // Copiar también los objetos LFS para trabajar sin depender de una nueva descarga.
  const lfs = path.join(ROOT,'.git/lfs/objects');
  if (fs.existsSync(lfs)) copyTree(lfs,path.join(dest,'.git/lfs/objects'));
  fs.writeFileSync(path.join(dest,'plataforma.json'),JSON.stringify({platform},null,2)+'\n');
  prepare({root:dest,platform,portable:platform !== hostPlatform()});
  const os = platform === 'windows' ? 'Windows' : 'macOS';
  const ext = platform === 'windows' ? 'cmd' : 'command';
  const installer = platform === 'windows' ? 'INSTALAR_WINDOWS.cmd' : 'INSTALAR_MAC.command';
  const intro = `# DevFest Arequipa 2026 · OBS · ${os}\n\nEsta es la copia independiente para **${os}**. Incluye los dos tracks, los recursos completos y el historial Git.\n\n1. Instala OBS Studio y Node.js 22 o superior. Si descargas desde GitHub, instala Git LFS y ejecuta \`git lfs pull\`.\n2. Conserva esta carpeta en una ubicación estable. Cierra OBS y ejecuta \`${installer}\`. Respalda la configuración anterior y añade colecciones nuevas; se detiene si ya existen.\n3. Abre OBS, selecciona el perfil y colección del track y habilita WebSocket con autenticación, puerto 4455.\n4. Ejecuta \`INICIAR_PANEL.${ext}\` y usa http://127.0.0.1:8787. Mantén abierta la terminal.\n5. Elige cámaras, HDMI y consola en las fuentes auxiliares de OBS; oculta las imágenes de prueba antes del evento.\n\nPara importar manualmente o después de mover esta carpeta, ejecuta \`PREPARAR_IMPORTACION.${ext}\` y sigue [la guía](08_Guias/OPERACION.md). El instalador no reemplaza colecciones ya instaladas.\n\nLa composición es 1080p30, con 13 escenas de producción por track y 15 nombres para pruebas. No hay contadores ni inicio de emisión desde el panel.\n\nVerifica los archivos con \`node 09_Pruebas/verificar.mjs\` y las pruebas de compatibilidad con \`node --test 09_Pruebas/compatibilidad.test.mjs\`. Los ensayos de la Mac original se conservan como historial; no acreditan pruebas del hardware de este equipo.\n\n[Guía de operación](08_Guias/OPERACION.md) · [Compatibilidad y límites](08_Guias/PLATAFORMAS.md)\n`;
  fs.writeFileSync(path.join(dest,'README.md'),intro);
  fs.writeFileSync(path.join(dest,'LEEME.md'),intro);
  execFileSync(process.execPath,[path.join(dest,'scripts/manifiesto.mjs')],{cwd:dest,stdio:'pipe'});
  console.log(`${os}: ${dest}`);
}
