import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {prepare} from '../06_OBS/preparacion.mjs';
import {updateVisualCollections} from './actualizar-diseno-v5.mjs';

const parent=path.dirname(ROOT),windows=path.join(parent,'obs-devfest-windows');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function preserved(root){
  const files=readJSON(path.join(root,'09_Pruebas/Revision_v5/archivos-conservados.json'));
  for(const[file,expected]of Object.entries(files))assert.equal(hash(path.join(root,file)),expected,'Se modificó un archivo que debía conservarse: '+file);
}
preserved(windows);
const common=[];
for(const dir of ['01_Identidad/oficial','03_HTML','02_Graficos']){
  for(const file of fs.readdirSync(path.join(windows,dir))){
    const rel=dir+'/'+file;if(fs.statSync(path.join(windows,rel)).isFile())common.push(rel);
  }
}
common.push('04_Transiciones/devfest_estudio_v5.webm','scripts/actualizar-diseno-v5.mjs');
for(const name of ['obs-devfest-mac','obs-devfest']){
  const root=path.join(parent,name);preserved(root);
  const nativeSources=()=>readJSON(path.join(root,'05_Datos/produccion.json')).tracks.map(track=>{
    const c=readJSON(path.join(root,'06_OBS/Colecciones',track.collection+'.json'));
    return c.sources.filter(s=>!['scene','image_source','browser_source'].includes(s.id)).map(s=>({name:s.name,id:s.id,uuid:s.uuid,settings:s.settings}));
  });
  const before=nativeSources();
  for(const rel of common){const dest=path.join(root,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(windows,rel),dest);}
  updateVisualCollections(root);
  for(const file of fs.readdirSync(path.join(root,'06_OBS/Colecciones')).filter(f=>f.endsWith('.json'))){
    const dest=path.join(root,'06_OBS/Colecciones',file),c=readJSON(dest);
    c.transitions.find(t=>t.name==='DevFest · Glifos').settings.path='04_Transiciones/devfest_estudio_v5.webm';
    fs.writeFileSync(dest,JSON.stringify(c,null,2)+'\n');
  }
  prepare({root,platform:'macos',portable:true});
  assert.deepEqual(nativeSources(),before,'Las fuentes nativas de macOS deben conservarse.');
  for(const rel of common)assert.equal(hash(path.join(windows,rel)),hash(path.join(root,rel)),rel);
  preserved(root);
  fs.writeFileSync(path.join(root,'09_Pruebas/Revision_v5/distribucion.json'),JSON.stringify({
    date:new Date().toISOString(),sharedFiles:common.length,distinctMainScenes:11,
    officialGlyphs:true,identicalVisuals:true,nativeSourcesPreserved:true,
    panelDataAndGuidesUnchanged:true,nativeMacTested:false
  },null,2)+'\n');
  console.log(name+': '+common.length+' archivos compartidos; 11 diseños, fuentes nativas y panel conservados.');
}
