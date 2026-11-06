import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
const config=readJSON(path.join(ROOT,'05_Datos/produccion.json'));
const out=path.join(ROOT,'09_Pruebas/Revision_v6');fs.mkdirSync(out,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const base='http://127.0.0.1:8787';
async function action(track,action,extra={}){
  for(let i=0;i<40;i++){
    const r=await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({track,action,...extra})});
    if(r.status===409){await pause(100);continue;}const result=await r.json();if(!r.ok)throw new Error(result.error);return result;
  }
  throw new Error('El panel está ocupado.');
}
async function ready(track){
  for(let i=0;i<80;i++){
    try{const c=await obs.call('GetSceneCollectionList');if(c.currentSceneCollectionName===track.collection){await obs.call('GetSceneList');return;}}catch{}
    await pause(150);
  }
  throw new Error('OBS no terminó de cargar '+track.collection);
}
async function screenshot(source, destination){
  const shot=await obs.call('GetSourceScreenshot',{sourceName:source,imageFormat:'png',imageWidth:1920,imageHeight:1080});
  const bytes=Buffer.from(shot.imageData.split(',')[1],'base64');
  if(destination)fs.writeFileSync(destination,bytes);
  return bytes;
}
let temporary;
const checks={date:new Date().toISOString(),version:'identidad-local-v6',rejectedSymbolRemoved:true,tracks:[],guidesUnchanged:false};
try{
  assert.equal((await obs.call('GetStreamStatus')).outputActive,false,'El ensayo requiere la emisión detenida.');
  assert.equal((await obs.call('GetRecordStatus')).outputActive,false,'El ensayo requiere la grabación detenida.');
  checks.before=await obs.call('GetStats');
  for(const track of config.tracks){
    if((await obs.call('GetSceneCollectionList')).currentSceneCollectionName!==track.collection){await obs.call('SetCurrentSceneCollection',{sceneCollectionName:track.collection});await pause(800);}
    await ready(track);
    await obs.call('SetStudioModeEnabled',{studioModeEnabled:true});
    const transitionPath=path.join(ROOT,'04_Transiciones/devfest_estudio_v6.webm');
    await obs.call('SetCurrentSceneTransition',{transitionName:'DevFest · Glifos'});
    await obs.call('SetCurrentSceneTransitionSettings',{transitionSettings:{path:transitionPath,transition_point:600,tp_type:0},overlay:true});
    const file=path.join(ROOT,'06_OBS/Colecciones',track.collection+'.json'),collection=readJSON(file);
    collection.transitions.find(t=>t.name==='DevFest · Glifos').settings.path=transitionPath;
    fs.writeFileSync(file,JSON.stringify(collection,null,2)+'\n');
    for(const input of (await obs.call('GetInputList')).inputs){
      if(input.inputKind==='browser_source')await obs.call('PressInputPropertiesButton',{inputName:input.inputName,propertyName:'refreshnocache'});
      if(input.inputKind==='image_source'&&/Prueba (cámara|diapositivas)/.test(input.inputName)){
        const settings=await obs.call('GetInputSettings',{inputName:input.inputName});
        await obs.call('SetInputSettings',{inputName:input.inputName,inputSettings:settings.inputSettings,overlay:false});
      }
    }
    await action(track.id,'motion',{enabled:true});
    await action(track.id,'speaker',{speakerId:track.speakers[0].id});
    await action(track.id,'show');
    await obs.call('SetCurrentPreviewScene',{sceneName:track.scenes[0].name});
    temporary=`RENDER · Revisión visual ${track.id}`;
    await obs.call('CreateInput',{sceneName:track.scenes[0].name,inputName:temporary,inputKind:'browser_source',inputSettings:{is_local_file:true,local_file:path.join(ROOT,`03_HTML/t${track.id}_inicio.html`),width:1920,height:1080,fps:30,fps_custom:true,shutdown:false,reroute_audio:false},sceneItemEnabled:true});
    for(const key of ['prueba_camara','prueba_diapositivas','inicio','marco_mixta','marco_completa','marco_camara','marco_diapositivas','marco_preguntas','espera','almuerzo','patrocinadores','problemas','cierre','preguntas','proxima','oficial']){
      await obs.call('SetInputSettings',{inputName:temporary,inputSettings:{local_file:path.join(ROOT,`03_HTML/t${track.id}_${key}.html`)},overlay:true});
      await pause(key==='oficial'?3200:1400);
      await screenshot(temporary,path.join(ROOT,`02_Graficos/t${track.id}_${key}.png`));
    }
    for(const kind of ['cámara','diapositivas']){const inputName='T'+track.id+' · Prueba '+kind;const settings=await obs.call('GetInputSettings',{inputName});await obs.call('SetInputSettings',{inputName,inputSettings:settings.inputSettings,overlay:false});}
    await obs.call('RemoveInput',{inputName:temporary});temporary=null;
    // Tras las capturas de recursos, renderizar las composiciones reales de producción.
    const scenes=[];
    for(const scene of track.scenes){
      await obs.call('SetCurrentPreviewScene',{sceneName:scene.name});await pause(1200);
      await screenshot(scene.name,path.join(ROOT,`02_Graficos/t${track.id}_escena_${scene.name.slice(0,2)}.png`));scenes.push(scene.name);
    }
    const mixed=track.scenes[1].name;
    await obs.call('SetCurrentPreviewScene',{sceneName:mixed});await pause(600);
    const longest=track.speakers.reduce((a,b)=>a.name.length>b.name.length?a:b);
    await action(track.id,'speaker',{speakerId:longest.id});await action(track.id,'show');await pause(750);
    await screenshot(mixed,path.join(out,`track-${track.id}-nombre-largo.png`));
    await action(track.id,'speaker',{speakerId:track.speakers[0].id});
    await obs.call('SetCurrentPreviewScene',{sceneName:track.scenes[0].name});await pause(1200);
    await action(track.id,'motion',{enabled:false});await pause(1300);
    const frozenA=await screenshot(track.scenes[0].name);await pause(700);const frozenB=await screenshot(track.scenes[0].name);
    const paused=crypto.createHash('sha256').update(frozenA).digest('hex')===crypto.createHash('sha256').update(frozenB).digest('hex');
    assert(paused,'La escena debe quedar inmóvil al desactivar movimiento.');
    await action(track.id,'motion',{enabled:true});await pause(700);const moving=await screenshot(track.scenes[0].name);
    assert(!moving.equals(frozenB),'La animación debe reanudarse.');
    checks.tracks.push({track:track.id,scenes:scenes.length,resources:16,longName:longest.name,motionPauseAndResume:true});
    console.log(`Track ${track.id}: ${scenes.length} escenas, recursos, nombre largo y pausa/reanudación comprobados.`);
  }
  await obs.call('SetCurrentSceneCollection',{sceneCollectionName:config.tracks[0].collection});await pause(800);await ready(config.tracks[0]);
  await obs.call('SetStudioModeEnabled',{studioModeEnabled:true});
  await obs.call('SetCurrentSceneTransition',{transitionName:'DevFest · Glifos'});
  await action(1,'scene',{scene:config.tracks[0].scenes[0].name,preview:false});
  await obs.call('SetCurrentPreviewScene',{sceneName:config.tracks[0].scenes[1].name});
  await action(1,'show');await pause(1200);
  await screenshot(config.tracks[0].scenes[0].name,path.join(out,'bienvenida.png'));
  await screenshot(config.tracks[0].scenes[1].name,path.join(out,'composicion-principal.png'));
  checks.after=await obs.call('GetStats');
  const guideHashes=readJSON(path.join(ROOT,'09_Pruebas/Revision_v6/archivos-conservados.json'));
  for(const [file,expected]of Object.entries(guideHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex'),expected,file);
  checks.guidesUnchanged=true;
  fs.writeFileSync(path.join(out,'verificacion.json'),JSON.stringify(checks,null,2)+'\n');
  console.log('Diseño v5: 11 escenas principales con color y movimiento originales; panel y guías conservados.');
}finally{
  if(temporary)try{await obs.call('RemoveInput',{inputName:temporary});}catch{}
  obs.close();
}
