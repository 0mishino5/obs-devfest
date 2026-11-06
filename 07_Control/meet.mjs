import fs from 'node:fs';
import path from 'node:path';
import '../03_HTML/disposicion-v7.js';
const layout=globalThis.DevFestLayout;
export const meetName=track=>`T${track.id} · Presentación de Meet · elegir ventana`;
export async function prepareMeet(obs,track,{backupDir,openProperties=true}={}){
  const inputName=meetName(track), sceneName='FUENTE · Diapositivas';
  const inputs=(await obs.call('GetInputList')).inputs;
  const existing=inputs.find(i=>i.inputName===inputName);
  if(existing&&existing.inputKind!=='screen_capture')throw Error('La fuente de Meet existente no es una captura de ventana de macOS.');
  const items=(await obs.call('GetSceneItemList',{sceneName})).sceneItems;
  const saved=existing?await obs.call('GetInputSettings',{inputName}):null;
  const placements=[];
  for(const scene of track.scenes){
    const refs=(await obs.call('GetSceneItemList',{sceneName:scene.name})).sceneItems.filter(i=>i.sourceName===sceneName);
    for(const item of refs)placements.push({sceneName:scene.name,item,target:scene.key==='mixta'||scene.key==='preguntas'?layout.mixed.slides:scene.name.startsWith('12')?{x:0,y:0,w:1920,h:1080}:layout.wide});
  }
  if(backupDir){fs.mkdirSync(backupDir,{recursive:true,mode:0o700});fs.writeFileSync(path.join(backupDir,`meet-track-${track.id}-${Date.now()}.json`),JSON.stringify({inputName,saved,items,placements},null,2),{flag:'wx',mode:0o600});}
  const safe={type:1,capture_audio:false,show_cursor:false,hide_obs:true};
  if(!existing)await obs.call('CreateInput',{sceneName,inputName,inputKind:'screen_capture',inputSettings:{...safe,window:0},sceneItemEnabled:true});
  else{await obs.call('SetInputSettings',{inputName,inputSettings:safe,overlay:true});if(!items.some(i=>i.sourceName===inputName))await obs.call('CreateSceneItem',{sceneName,sourceName:inputName,sceneItemEnabled:true});}
  const fitted=r=>({positionX:r.x,positionY:r.y,boundsWidth:r.w,boundsHeight:r.h,boundsType:'OBS_BOUNDS_SCALE_INNER',boundsAlignment:0,alignment:5,rotation:0,cropLeft:0,cropTop:0,cropRight:0,cropBottom:0,cropToBounds:false});
  const current=(await obs.call('GetSceneItemList',{sceneName})).sceneItems;
  const meet=current.find(i=>i.sourceName===inputName);
  await obs.call('SetSceneItemTransform',{sceneName,sceneItemId:meet.sceneItemId,sceneItemTransform:fitted({x:0,y:0,w:1920,h:1080})});
  await obs.call('SetSceneItemLocked',{sceneName,sceneItemId:meet.sceneItemId,sceneItemLocked:true});
  for(const item of current)await obs.call('SetSceneItemEnabled',{sceneName,sceneItemId:item.sceneItemId,sceneItemEnabled:item.sourceName===inputName});
  for(const p of placements){await obs.call('SetSceneItemTransform',{sceneName:p.sceneName,sceneItemId:p.item.sceneItemId,sceneItemTransform:fitted(p.target)});await obs.call('SetSceneItemEnabled',{sceneName:p.sceneName,sceneItemId:p.item.sceneItemId,sceneItemEnabled:true});}
  if((await obs.call('GetStudioModeEnabled')).studioModeEnabled){const scene=track.scenes.find(s=>s.key==='mixta');if(scene)await obs.call('SetCurrentPreviewScene',{sceneName:scene.name});}
  if(openProperties)await obs.call('OpenInputPropertiesDialog',{inputName});
  return {inputName,sceneCount:placements.length};
}
