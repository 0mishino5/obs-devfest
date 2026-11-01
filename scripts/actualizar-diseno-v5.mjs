import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

export const variants=[
  {scene:'03 · Cámara del ponente',base:'Marco completo',name:'Marco cámara',file:'marco_camara'},
  {scene:'04 · Diapositivas completas',base:'Marco completo',name:'Marco diapositivas',file:'marco_diapositivas'},
  {scene:'05 · Preguntas y respuestas',base:'Marco mixto',name:'Marco preguntas',file:'marco_preguntas'}
];

export function updateVisualCollections(root=ROOT){
  const config=readJSON(path.join(root,'05_Datos/produccion.json'));
  for(const track of config.tracks){
    const file=path.join(root,'06_OBS/Colecciones',track.collection+'.json');
    const c=readJSON(file),prefix='T'+track.id+' · ';
    for(const variant of variants){
      const name=prefix+variant.name;
      let source=c.sources.find(s=>s.name===name);
      if(!source){
        const base=c.sources.find(s=>s.name===prefix+variant.base);
        assert(base,'Falta marco original '+variant.base);
        source=structuredClone(base);source.name=name;
        const h=crypto.createHash('sha256').update(track.collection+name+'estudio-v5').digest('hex');
        source.uuid=h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32);
        c.sources.push(source);
      }
      source.settings.local_file=path.join(root,'03_HTML','t'+track.id+'_'+variant.file+'.html');
      source.settings.reroute_audio=false;
      const scene=c.sources.find(s=>s.id==='scene'&&s.name===variant.scene);
      const item=scene.settings.items.find(i=>i.name===prefix+variant.base||i.name===name);
      assert(item,'Falta el marco de '+variant.scene);
      item.name=name;item.source_uuid=source.uuid;
    }
    fs.writeFileSync(file,JSON.stringify(c,null,2)+'\n');
  }
}

async function live(){
  const base='http://127.0.0.1:8787';
  const cfg=await(await fetch(base+'/api/config')).json();
  assert.equal(cfg.demo,true,'Solo se actualiza automáticamente el OBS de demostración.');
  const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  const config=readJSON(path.join(ROOT,'05_Datos/produccion.json'));
  const report=[];
  try{
    assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
    assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
    updateVisualCollections();
    for(const track of config.tracks){
      if((await obs.call('GetSceneCollectionList')).currentSceneCollectionName!==track.collection){
        await obs.call('SetCurrentSceneCollection',{sceneCollectionName:track.collection});
        await pause(1200);
      }
      await obs.call('SetStudioModeEnabled',{studioModeEnabled:true});
      const prefix='T'+track.id+' · ';
      const c=readJSON(path.join(ROOT,'06_OBS/Colecciones',track.collection+'.json'));
      for(const variant of variants){
        const inputName=prefix+variant.name;
        let items=(await obs.call('GetSceneItemList',{sceneName:variant.scene})).sceneItems;
        const old=items.find(i=>i.sourceName===prefix+variant.base);
        let item=items.find(i=>i.sourceName===inputName);
        if(!item){
          assert(old,'No se encontró el marco actual de '+variant.scene);
          const settings=c.sources.find(s=>s.name===inputName).settings;
          const exists=(await obs.call('GetInputList')).inputs.some(i=>i.inputName===inputName);
          const created=await obs.call(exists?'CreateSceneItem':'CreateInput',exists?
            {sceneName:variant.scene,sourceName:inputName,sceneItemEnabled:true}:
            {sceneName:variant.scene,inputName,inputKind:'browser_source',inputSettings:settings,sceneItemEnabled:true});
          item={sceneItemId:created.sceneItemId};
        }
        const oldTransform=old?(await obs.call('GetSceneItemTransform',{sceneName:variant.scene,sceneItemId:old.sceneItemId})).sceneItemTransform:null;
        if(oldTransform){
          const keys=['positionX','positionY','rotation','scaleX','scaleY','cropLeft','cropTop','cropRight','cropBottom','alignment','boundsType','boundsAlignment','boundsWidth','boundsHeight'];
          const transform=Object.fromEntries(keys.filter(k=>k in oldTransform).map(k=>[k,oldTransform[k]]));
          await obs.call('SetSceneItemTransform',{sceneName:variant.scene,sceneItemId:item.sceneItemId,sceneItemTransform:transform});
          await obs.call('SetSceneItemIndex',{sceneName:variant.scene,sceneItemId:item.sceneItemId,sceneItemIndex:old.sceneItemIndex});
          await obs.call('RemoveSceneItem',{sceneName:variant.scene,sceneItemId:old.sceneItemId});
        }
        await obs.call('SetInputSettings',{inputName,inputSettings:c.sources.find(s=>s.name===inputName).settings,overlay:false});
        report.push({track:track.id,scene:variant.scene,frame:inputName});
      }
      for(const input of (await obs.call('GetInputList')).inputs){
        if(input.inputKind==='browser_source')await obs.call('PressInputPropertiesButton',{inputName:input.inputName,propertyName:'refreshnocache'});
      }
      console.log('Track '+track.id+': cámara, diapositivas y preguntas con marcos independientes.');
    }
    await obs.call('SetCurrentSceneCollection',{sceneCollectionName:config.tracks[0].collection});await pause(1200);
    await obs.call('SetStudioModeEnabled',{studioModeEnabled:true});
    await obs.call('SetCurrentProgramScene',{sceneName:config.tracks[0].scenes[0].name});
    await obs.call('SetCurrentPreviewScene',{sceneName:config.tracks[0].scenes[1].name});
    await pause(1400);
    const out=path.join(ROOT,'09_Pruebas/Revision_v5');fs.mkdirSync(out,{recursive:true});
    for(const [source,name]of[[config.tracks[0].scenes[0].name,'bienvenida-inicial.png'],[config.tracks[0].scenes[1].name,'mixta-inicial.png']]){
      const shot=await obs.call('GetSourceScreenshot',{sourceName:source,imageFormat:'png',imageWidth:1920,imageHeight:1080});
      fs.writeFileSync(path.join(out,name),Buffer.from(shot.imageData.split(',')[1],'base64'));
    }
    fs.writeFileSync(path.join(out,'variantes.json'),JSON.stringify({date:new Date().toISOString(),variants:report},null,2)+'\n');
  }finally{obs.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await live();
