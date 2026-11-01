import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

const base='http://127.0.0.1:8787',out=path.join(ROOT,'09_Pruebas/Revision_v5');
const savedFile=path.join(ROOT,'11_Historial/Antes_Paleta_Equilibrada_20261101/estado-demo-antes.json');
const config=readJSON(path.join(ROOT,'05_Datos/produccion.json'));
const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function action(track,action,extra={}){
  for(let i=0;i<40;i++){
    const r=await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({track,action,...extra})});
    if(r.status===409){await pause(100);continue;}
    const data=await r.json();if(!r.ok)throw Error(data.error);return data;
  }
  throw Error('Panel ocupado.');
}
async function shot(source,file){
  const data=await obs.call('GetSourceScreenshot',{sourceName:source,imageFormat:'png',imageWidth:1920,imageHeight:1080});
  fs.writeFileSync(file,Buffer.from(data.imageData.split(',')[1],'base64'));
}
async function collection(name){
  if((await obs.call('GetSceneCollectionList')).currentSceneCollectionName!==name){
    await obs.call('SetCurrentSceneCollection',{sceneCollectionName:name});await pause(1000);
  }
}
async function restore(){
  const saved=readJSON(savedFile);
  if(!saved.collection)return;
  for(const track of config.tracks){
    await collection(track.collection);
    const state=saved.state[track.id];
    if(state?.speakerId)await action(track.id,'speaker',{speakerId:state.speakerId});
    if(state)await action(track.id,state.visible?'show':'hide');
    if(state&&typeof state.motion==='boolean')await action(track.id,'motion',{enabled:state.motion});
  }
  await collection(saved.collection);
  await obs.call('SetStudioModeEnabled',{studioModeEnabled:true});
  await obs.call('SetCurrentSceneTransition',{transitionName:saved.transition});
  if((await obs.call('GetCurrentProgramScene')).sceneName!==saved.program)
    await obs.call('SetCurrentProgramScene',{sceneName:saved.program});
  // OBS intercambia la vista previa al terminar la transición de Modo Estudio.
  // Esperar ese intercambio antes de recuperar la escena que tenía preparada el usuario.
  await pause(120);
  for(let i=0;i<50;i++){
    if((await obs.call('GetCurrentSceneTransitionCursor')).transitionCursor>=.999)break;
    if(i===49)throw Error('OBS no terminó la transición al restaurar la selección.');
    await pause(80);
  }
  if(saved.preview)await obs.call('SetCurrentPreviewScene',{sceneName:saved.preview});
  await pause(200);
  if(saved.preview)assert.equal((await obs.call('GetCurrentPreviewScene')).sceneName,saved.preview);
  if(!saved.studio)await obs.call('SetStudioModeEnabled',{studioModeEnabled:false});
}
let temporaryScene,temporaryInput;
try{
  assert.equal((await(await fetch(base+'/api/config')).json()).demo,true);
  assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
  assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
  if(process.argv.includes('--restore')){
    await restore();console.log('Escenas, ponentes y movimiento restaurados a la selección del usuario.');
  }else{
    const saved=readJSON(savedFile);
    if(!saved.collection){
      const scenes=await obs.call('GetSceneList');
      Object.assign(saved,{
        collection:(await obs.call('GetSceneCollectionList')).currentSceneCollectionName,
        program:scenes.currentProgramSceneName,preview:scenes.currentPreviewSceneName,
        studio:(await obs.call('GetStudioModeEnabled')).studioModeEnabled,
        transition:(await obs.call('GetCurrentSceneTransition')).transitionName
      });
      fs.writeFileSync(savedFile,JSON.stringify(saved,null,2)+'\n');
    }
    for(const track of config.tracks){
      await collection(track.collection);await obs.call('SetStudioModeEnabled',{studioModeEnabled:true});
      temporaryScene='RENDER · Ajuste de paleta '+track.id;temporaryInput='RENDER · Recurso de paleta '+track.id;
      await obs.call('CreateScene',{sceneName:temporaryScene});
      await obs.call('CreateInput',{sceneName:temporaryScene,inputName:temporaryInput,inputKind:'browser_source',inputSettings:{is_local_file:true,local_file:path.join(ROOT,'03_HTML/t'+track.id+'_prueba_diapositivas.html'),width:1920,height:1080,fps:30,fps_custom:true,shutdown:false,reroute_audio:false},sceneItemEnabled:true});
      await obs.call('SetCurrentPreviewScene',{sceneName:temporaryScene});
      for(const key of ['prueba_diapositivas','marco_preguntas','preguntas']){
        await obs.call('SetInputSettings',{inputName:temporaryInput,inputSettings:{local_file:path.join(ROOT,'03_HTML/t'+track.id+'_'+key+'.html')},overlay:true});
        await pause(1300);await shot(temporaryInput,path.join(ROOT,'02_Graficos/t'+track.id+'_'+key+'.png'));
      }
      await obs.call('SetCurrentPreviewScene',{sceneName:'05 · Preguntas y respuestas'});
      await obs.call('RemoveInput',{inputName:temporaryInput});temporaryInput=null;
      await obs.call('RemoveScene',{sceneName:temporaryScene});temporaryScene=null;
      const inputName='T'+track.id+' · Prueba diapositivas',settings=await obs.call('GetInputSettings',{inputName});
      await obs.call('SetInputSettings',{inputName,inputSettings:settings.inputSettings,overlay:false});
      await obs.call('PressInputPropertiesButton',{inputName:'T'+track.id+' · Marco preguntas',propertyName:'refreshnocache'});
      for(const scene of track.scenes.filter(s=>['mixta','slides','preguntas','limpias'].includes(s.key))){
        await obs.call('SetCurrentPreviewScene',{sceneName:scene.name});await pause(1000);
        await shot(scene.name,path.join(ROOT,'02_Graficos/t'+track.id+'_escena_'+scene.name.slice(0,2)+'.png'));
        if(scene.key==='preguntas')await shot(scene.name,path.join(out,'preguntas-paleta-equilibrada-t'+track.id+'.png'));
      }
      const longest=track.speakers.reduce((a,b)=>a.name.length>b.name.length?a:b);
      await action(track.id,'speaker',{speakerId:longest.id});await action(track.id,'show');
      await obs.call('SetCurrentPreviewScene',{sceneName:track.scenes[1].name});await pause(900);
      await shot(track.scenes[1].name,path.join(out,'track-'+track.id+'-nombre-largo.png'));
      const state=saved.state[track.id];
      if(state?.speakerId)await action(track.id,'speaker',{speakerId:state.speakerId});
      if(state)await action(track.id,state.visible?'show':'hide');
      console.log('Track '+track.id+': paleta, recursos y miniaturas actualizados.');
    }
    await restore();
    await pause(900);
    await shot('02 · Diapositivas + ponente',path.join(out,'mixta-inicial.png'));
    fs.writeFileSync(path.join(out,'paleta-equilibrada.json'),JSON.stringify({date:new Date().toISOString(),scene:'05 · Preguntas y respuestas',palette:{background:'#c3ecf6',speakerPanel:'#ccf6c5',slidesFrame:'#ffe7a5',accent:'#4285f4'},largePinkAreasRemoved:true,slidesDemoUpdated:true,controlsAndAnimationsPreserved:true,tracks:[1,2]},null,2)+'\n');
  }
}finally{
  if(temporaryInput)try{await obs.call('RemoveInput',{inputName:temporaryInput});}catch{}
  if(temporaryScene)try{await obs.call('RemoveScene',{sceneName:temporaryScene});}catch{}
  if(!process.argv.includes('--restore'))try{await restore();}catch{}
  obs.close();
}
