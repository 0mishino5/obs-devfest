import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';
import '../03_HTML/disposicion-v7.js';

const layout=globalThis.DevFestLayout;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
export function rectangle(scene,name){
  if(/^(02|05) ·/.test(scene))return name==='FUENTE · Cámara del ponente'?layout.mixed.camera:name==='FUENTE · Diapositivas'?layout.mixed.slides:null;
  if(scene.startsWith('03 ·')&&name==='FUENTE · Cámara del ponente')return layout.wide;
  if(scene.startsWith('04 ·')&&name==='FUENTE · Diapositivas')return layout.wide;
  return null;
}

export function updateCollections(root){
  const tracks=readJSON(path.join(root,'05_Datos/produccion.json')).tracks;
  let changed=0;
  for(const track of tracks){
    const file=path.join(root,'06_OBS/Colecciones',track.collection+'.json'),c=readJSON(file);
    for(const scene of c.sources.filter(s=>s.id==='scene'))for(const item of scene.settings.items){
      const rect=rectangle(scene.name,item.name);if(!rect)continue;
      Object.assign(item.pos,{x:rect.x,y:rect.y});Object.assign(item.bounds,{x:rect.w,y:rect.h});changed++;
    }
    fs.writeFileSync(file,JSON.stringify(c,null,2)+'\n');
  }
  assert.equal(changed,12,'Se ajustan únicamente las doce ventanas de contenido de las dos pistas.');
  return changed;
}

async function applyDemo(){
  const base='http://127.0.0.1:8787';
  assert.equal((await(await fetch(base+'/api/config')).json()).demo,true,'Se requiere el ensayo privado.');
  const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
  let original;
  const tracks=readJSON(path.join(ROOT,'05_Datos/produccion.json')).tracks;
  async function ready(name){
    for(let i=0;i<60;i++){
      try{if((await obs.call('GetSceneCollectionList')).currentSceneCollectionName===name){await obs.call('GetSceneList');return;}}catch{}
      await pause(150);
    }
    throw new Error('La colección no terminó de cargar.');
  }
  try{
    assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
    assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
    original={collection:(await obs.call('GetSceneCollectionList')).currentSceneCollectionName,...await obs.call('GetSceneList')};
    const verified=[];
    for(const track of tracks){
      if((await obs.call('GetSceneCollectionList')).currentSceneCollectionName!==track.collection){await obs.call('SetCurrentSceneCollection',{sceneCollectionName:track.collection});await pause(800);}
      await ready(track.collection);
      for(const scene of track.scenes.filter(s=>/^(02|03|04|05) ·/.test(s.name))){
        const {sceneItems}=await obs.call('GetSceneItemList',{sceneName:scene.name});
        for(const item of sceneItems){
          const rect=rectangle(scene.name,item.sourceName);if(!rect)continue;
          const request={sceneName:scene.name,sceneItemId:item.sceneItemId};
          const before=(await obs.call('GetSceneItemTransform',request)).sceneItemTransform;
          await obs.call('SetSceneItemTransform',{...request,sceneItemTransform:{positionX:rect.x,positionY:rect.y,boundsWidth:rect.w,boundsHeight:rect.h}});
          const actual=(await obs.call('GetSceneItemTransform',request)).sceneItemTransform;
          for(const [key,value]of Object.entries({positionX:rect.x,positionY:rect.y,boundsWidth:rect.w,boundsHeight:rect.h}))assert.equal(actual[key],value);
          for(const key of ['alignment','boundsAlignment','boundsType','cropLeft','cropRight','cropTop','cropBottom','rotation'])assert.equal(actual[key],before[key]);
          verified.push({track:track.id,scene:scene.name,source:item.sourceName,rectangle:rect});
        }
      }
      for(const input of (await obs.call('GetInputList')).inputs)
        if(input.inputKind==='browser_source')await obs.call('PressInputPropertiesButton',{inputName:input.inputName,propertyName:'refreshnocache'});
    }
    assert.equal(verified.length,12);
    fs.writeFileSync(path.join(ROOT,'09_Pruebas/Revision_v8/geometria-obs.json'),JSON.stringify({date:new Date().toISOString(),demoOnly:true,windows:verified},null,2)+'\n');
    console.log('Geometría verificada en OBS; espacio de marca y metadatos reservado, sin recortar el contenido.');
  }finally{
    if(original){
      if((await obs.call('GetSceneCollectionList')).currentSceneCollectionName!==original.collection){await obs.call('SetCurrentSceneCollection',{sceneCollectionName:original.collection});await pause(800);}
      await ready(original.collection);
      if((await obs.call('GetSceneList')).currentProgramSceneName!==original.currentProgramSceneName){
        await obs.call('SetCurrentProgramScene',{sceneName:original.currentProgramSceneName});await pause(150);
        for(let i=0;i<40;i++){if((await obs.call('GetCurrentSceneTransitionCursor')).transitionCursor>=.999)break;await pause(100);}
      }
      if(original.currentPreviewSceneName)await obs.call('SetCurrentPreviewScene',{sceneName:original.currentPreviewSceneName});
    }
    obs.close();
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  console.log(updateCollections(ROOT)+' ventanas actualizadas en las colecciones del paquete.');
  if(process.argv.includes('--demo'))await applyDemo();
}
