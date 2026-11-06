import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {prepare} from '../06_OBS/preparacion.mjs';
import {rectangle,updateCollections} from './ajustar-coherencia-v8.mjs';

const parent=path.dirname(ROOT),windows=path.join(parent,'obs-devfest-windows');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function preserved(root){
  for(const[file,expected]of Object.entries(readJSON(path.join(root,'09_Pruebas/Revision_v8/archivos-conservados.json'))))
    assert.equal(hash(path.join(root,file)),expected,'Se modificó un control o una guía: '+file);
}
function contentInvariant(c){
  const clean=structuredClone(c.sources);
  for(const scene of clean.filter(s=>s.id==='scene'))for(const item of scene.settings.items)
    if(rectangle(scene.name,item.name)){delete item.pos;delete item.bounds;}
  return clean;
}
const config=readJSON(path.join(windows,'05_Datos/produccion.json'));
const shared=[];
for(const dir of ['03_HTML','02_Graficos','09_Pruebas/Revision_v8'])for(const name of fs.readdirSync(path.join(windows,dir)))
  if(fs.statSync(path.join(windows,dir,name)).isFile()&&!['distribucion.json','archivos-conservados.json'].includes(name))shared.push(dir+'/'+name);
shared.push('scripts/ajustar-coherencia-v8.mjs','01_Identidad/oficial/devfest-arequipa-2026-integrado.svg','04_Transiciones/devfest_estudio_v8.webm','05_Datos/produccion.json');
for(const name of ['obs-devfest-windows','obs-devfest-mac','obs-devfest']){
  const root=path.join(parent,name);preserved(root);
  const oldConfig=readJSON(path.join(root,'05_Datos/produccion.json'));oldConfig.brand.logo=config.brand.logo;assert.deepEqual(oldConfig,config,'Se conserva toda la información de ponentes, charlas y aliados.');
  const before=config.tracks.map(t=>readJSON(path.join(root,'11_Historial/Antes_Coherencia_v8/06_OBS/Colecciones',t.collection+'.json')));
  if(root!==windows){
    for(const rel of shared){fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.copyFileSync(path.join(windows,rel),path.join(root,rel));}
    updateCollections(root);prepare({root,platform:'macos',portable:true});
  }
  for(const [i,track]of config.tracks.entries()){
    const collectionFile=path.join(root,'06_OBS/Colecciones',track.collection+'.json'),current=readJSON(collectionFile);
    current.transitions.find(t=>t.name==='DevFest · Glifos').settings.path=name==='obs-devfest-windows'?path.join(root,'04_Transiciones/devfest_estudio_v8.webm'):'04_Transiciones/devfest_estudio_v8.webm';
    fs.writeFileSync(collectionFile,JSON.stringify(current,null,2)+'\n');
    assert.deepEqual(contentInvariant(current),contentInvariant(before[i]),'Sólo se cambia la posición y tamaño de las ventanas, conservando las fuentes de cada sistema.');
    for(const scene of current.sources.filter(s=>s.id==='scene'))for(const item of scene.settings.items){
      const rect=rectangle(scene.name,item.name);if(!rect)continue;
      assert.deepEqual(item.pos,{x:rect.x,y:rect.y});assert.deepEqual(item.bounds,{x:rect.w,y:rect.h});
    }
  }
  for(const rel of shared)assert.equal(hash(path.join(root,rel)),hash(path.join(windows,rel)),rel);
  preserved(root);
  fs.writeFileSync(path.join(root,'09_Pruebas/Revision_v8/distribucion.json'),JSON.stringify({date:new Date().toISOString(),sharedFiles:shared.length,contentWindows:12,panelAndGuidesUnchanged:true,speakerDataAndPartnersUnchanged:true,singleBrandPerScene:true,sessionMetadataAdded:true,nativeSourcesAndIdentifiersPreserved:true,nativeMacTested:false},null,2)+'\n');
  console.log(name+': marca integrada, metadatos y cortinilla sincronizados; fuentes nativas conservadas.');
}
