import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

const base='http://127.0.0.1:8787',out=path.join(ROOT,'09_Pruebas/Revision_v8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const config=readJSON(path.join(ROOT,'05_Datos/produccion.json'));
assert.equal((await(await fetch(base+'/api/config')).json()).demo,true);
const state=await(await fetch(base+'/api/state')).json();
const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
async function action(track,action,extra={}){
  const r=await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({track,action,...extra})});
  if(!r.ok)throw new Error((await r.json()).error);
}
async function select(collection){
  if((await obs.call('GetSceneCollectionList')).currentSceneCollectionName!==collection){await obs.call('SetCurrentSceneCollection',{sceneCollectionName:collection});await pause(800);}
  for(let i=0;i<60;i++){try{await obs.call('GetSceneList');return;}catch{await pause(120);}}
  throw new Error('No cargó la colección.');
}
async function capture(scene,file){
  const s=await obs.call('GetSourceScreenshot',{sourceName:scene,imageFormat:'png',imageWidth:1920,imageHeight:1080});
  const buffer=Buffer.from(s.imageData.split(',')[1],'base64');fs.writeFileSync(path.join(out,file),buffer);return buffer;
}
let original;const results=[];
try{
  assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
  assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
  original={collection:(await obs.call('GetSceneCollectionList')).currentSceneCollectionName,...await obs.call('GetSceneList')};
  for(const track of config.tracks){
    await select(track.collection);
    await obs.call('SetCurrentSceneTransition',{transitionName:'DevFest · Glifos'});
    await obs.call('SetCurrentSceneTransitionSettings',{transitionSettings:{path:path.join(ROOT,'04_Transiciones/devfest_estudio_v8.webm'),transition_point:600,tp_type:0},overlay:true});
    const settings=(await obs.call('GetCurrentSceneTransition')).transitionSettings;
    assert.equal(settings.path,path.join(ROOT,'04_Transiciones/devfest_estudio_v8.webm'));assert.equal(settings.transition_point,600);
    const scene=track.scenes.find(s=>s.key==='slides')?.name||'04 · Diapositivas completas';
    await obs.call('SetCurrentPreviewScene',{sceneName:scene});
    await action(track.id,'motion',{enabled:false});
    const first=track.speakers[0],long=track.speakers.filter(p=>p.id!==first.id).sort((a,b)=>b.titleDraft.length-a.titleDraft.length)[0];
    await action(track.id,'speaker',{speakerId:first.id});await pause(1100);const a=await capture(scene,'track-'+track.id+'-charla-inicial.png');
    await action(track.id,'speaker',{speakerId:long.id});await pause(850);const b=await capture(scene,'track-'+track.id+'-tema-largo.png');
    assert(!a.equals(b),'El nombre y tema deben actualizarse sin recargar la fuente.');
    results.push({track:track.id,updatesWithoutReload:true,first:first.name,second:long.name,topic:long.titleDraft,transitionPoint:600});
    await action(track.id,'speaker',{speakerId:state[track.id].speakerId});await action(track.id,'motion',{enabled:state[track.id].motion});
  }
  fs.writeFileSync(path.join(out,'metadatos-en-directo.json'),JSON.stringify({date:new Date().toISOString(),demoOnly:true,tracks:results},null,2)+'\n');
  console.log('Ambos auditorios: nombre y tema cambian desde el selector existente sin recargar; nueva cortinilla activada.');
}finally{
  for(const track of config.tracks){try{await action(track.id,'speaker',{speakerId:state[track.id].speakerId});await action(track.id,'motion',{enabled:state[track.id].motion});}catch{}}
  if(original){await select(original.collection);if(original.currentPreviewSceneName)await obs.call('SetCurrentPreviewScene',{sceneName:original.currentPreviewSceneName});}
  obs.close();
}
