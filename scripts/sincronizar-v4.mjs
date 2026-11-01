import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {ROOT,readJSON,copyTree} from '../06_OBS/plataforma.mjs';
import {prepare} from '../06_OBS/preparacion.mjs';

const parent=path.dirname(ROOT),windows=path.join(parent,'obs-devfest-windows');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function copyFile(relative,target){const dest=path.join(target,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(windows,relative),dest);}
for(const name of ['obs-devfest','obs-devfest-mac']){
  const target=path.join(parent,name);assert(fs.existsSync(path.join(target,'.git')),'No es un repositorio: '+target);
  const guideFile=path.join(target,'09_Pruebas/Revision_v4/guias-originales.json'),guides=readJSON(guideFile);
  for(const[file,expected]of Object.entries(guides))assert.equal(hash(path.join(target,file)),expected,'La guía cambió antes de sincronizar: '+file);
  const backup=path.join(target,'11_Historial/Antes_Retirar_Simbolo_20261101');
  if(!fs.existsSync(backup))for(const dir of ['03_HTML','02_Graficos','06_OBS/Colecciones'])copyTree(path.join(target,dir),path.join(backup,dir));
  const common=[];
  for(const dir of ['03_HTML','02_Graficos'])for(const file of fs.readdirSync(path.join(windows,dir))){const relative=dir+'/'+file;if(fs.statSync(path.join(windows,relative)).isFile())common.push(relative);}
  common.push('04_Transiciones/devfest_estudio_v3.webm','07_Control/index.html','07_Control/panel.js','07_Control/panel.css','07_Control/servidor.mjs','07_Control/iniciar.mjs','scripts/manifiesto.mjs','scripts/crear-graficos-v3.py');
  for(const relative of common)copyFile(relative,target);
  // Las colecciones conservan sus fuentes y UUID nativos de macOS; solo cambia el recurso de transición.
  for(const file of fs.readdirSync(path.join(target,'06_OBS/Colecciones')).filter(f=>f.endsWith('.json'))){const dest=path.join(target,'06_OBS/Colecciones',file),c=readJSON(dest);c.transitions.find(t=>t.name==='DevFest · Glifos').settings.path='04_Transiciones/devfest_estudio_v3.webm';fs.writeFileSync(dest,JSON.stringify(c,null,2)+'\n');}
  prepare({root:target,platform:'macos',portable:true});
  for(const relative of common)assert.equal(hash(path.join(windows,relative)),hash(path.join(target,relative)),relative);
  for(const[file,expected]of Object.entries(guides))assert.equal(hash(path.join(target,file)),expected,'Se alteró una guía: '+file);
  fs.writeFileSync(path.join(target,'09_Pruebas/Revision_v4/distribucion.json'),JSON.stringify({date:new Date().toISOString(),platform:name==='obs-devfest-mac'?'macos':'source',sharedFiles:common.length,identicalVisualsAndPanel:true,rejectedSymbolRemoved:true,nativeSourcesPreserved:true,guidesUnchanged:true,nativeMacTested:false},null,2)+'\n');
  console.log(`${name}: ${common.length} archivos compartidos idénticos; fuentes nativas y guías conservadas.`);
}
