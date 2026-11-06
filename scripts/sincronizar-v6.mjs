import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {ROOT,readJSON,copyTree} from '../06_OBS/plataforma.mjs';
import {prepare} from '../06_OBS/preparacion.mjs';

const parent=path.dirname(ROOT),windows=path.join(parent,'obs-devfest-windows');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function preserved(root){
  for(const[file,expected]of Object.entries(readJSON(path.join(root,'09_Pruebas/Revision_v6/archivos-conservados.json'))))
    assert.equal(hash(path.join(root,file)),expected,'Se modificó un control o una guía: '+file);
}
preserved(windows);
const common=[];
for(const dir of ['01_Identidad/oficial','01_Identidad/patrocinadores','03_HTML','02_Graficos'])
  for(const file of fs.readdirSync(path.join(windows,dir)))
    if(fs.statSync(path.join(windows,dir,file)).isFile())common.push(dir+'/'+file);
common.push('04_Transiciones/devfest_estudio_v6.webm','05_Datos/produccion.json');
for(const name of ['obs-devfest-mac','obs-devfest']){
  const root=path.join(parent,name);preserved(root);
  const old=readJSON(path.join(root,'05_Datos/produccion.json'));
  assert.deepEqual(old.tracks,readJSON(path.join(windows,'05_Datos/produccion.json')).tracks,'Se conservan ponentes, escenas y salas.');
  const native=()=>old.tracks.map(t=>readJSON(path.join(root,'06_OBS/Colecciones',t.collection+'.json')).sources.filter(s=>!['scene','browser_source','image_source'].includes(s.id)).map(s=>({name:s.name,id:s.id,uuid:s.uuid,settings:s.settings})));
  const before=native();
  for(const rel of common){fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.copyFileSync(path.join(windows,rel),path.join(root,rel));}
  copyTree(path.join(windows,'10_Referencias/Identidad_Local_2026'),path.join(root,'10_Referencias/Identidad_Local_2026'));
  for(const t of old.tracks){
    const file=path.join(root,'06_OBS/Colecciones',t.collection+'.json'),c=readJSON(file);
    c.transitions.find(t=>t.name==='DevFest · Glifos').settings.path='04_Transiciones/devfest_estudio_v6.webm';
    fs.writeFileSync(file,JSON.stringify(c,null,2)+'\n');
  }
  prepare({root,platform:'macos',portable:true});
  assert.deepEqual(native(),before,'Se conservan las fuentes nativas de Mac.');
  for(const rel of common)assert.equal(hash(path.join(root,rel)),hash(path.join(windows,rel)),rel);
  preserved(root);
  fs.writeFileSync(path.join(root,'09_Pruebas/Revision_v6/distribucion.json'),JSON.stringify({date:new Date().toISOString(),sharedFiles:common.length,localEventLogo:true,partners:5,panelAndGuidesUnchanged:true,nativeSourcesPreserved:true,nativeMacTested:false},null,2)+'\n');
  console.log(name+': identidad local y cinco aliados sincronizados; fuentes nativas y controles conservados.');
}
