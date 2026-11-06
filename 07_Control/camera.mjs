import fs from 'node:fs';
import path from 'node:path';
import '../03_HTML/disposicion-v7.js';

const layout = globalThis.DevFestLayout;
export const cameraNames = track => ({input:track.camera || `T${track.id} · Cámara 1 · configurar`, scene:'FUENTE · Cámara del ponente'});
export async function cameraDevices(obs, track) {
  const {input} = cameraNames(track);
  const result = await obs.call('GetInputPropertiesListPropertyItems',{inputName:input,propertyName:'device'});
  return result.propertyItems.filter(d=>d.itemEnabled&&typeof d.itemValue==='string'&&d.itemValue)
    .map(d=>({id:d.itemValue,name:d.itemName}));
}
const fitted = r => ({positionX:r.x,positionY:r.y,boundsWidth:r.w,boundsHeight:r.h,
  boundsType:'OBS_BOUNDS_SCALE_INNER',boundsAlignment:0,alignment:5,rotation:0,
  cropLeft:0,cropTop:0,cropRight:0,cropBottom:0,cropToBounds:false});

export async function connectCamera(obs, track, deviceId, {backupDir, frameTimeout=8000}={}) {
  const devices = await cameraDevices(obs,track), device=devices.find(d=>d.id===deviceId);
  if(!device)throw new Error('La cámara no está disponible. Conecta el iPhone y vuelve a seleccionarlo.');
  const names=cameraNames(track);
  const current=await obs.call('GetInputSettings',{inputName:names.input});
  const previous=current.inputSettings, deviceKey=current.inputKind==='macos-avcapture'?'device':'uid';
  const items=(await obs.call('GetSceneItemList',{sceneName:names.scene})).sceneItems;
  const camera=items.find(i=>i.sourceName===names.input);
  if(!camera)throw new Error('Falta la fuente preparada para la cámara del ponente.');
  const placements=[];
  for(const scene of track.scenes.filter(s=>['mixta','camara','preguntas'].includes(s.key))){
    const item=(await obs.call('GetSceneItemList',{sceneName:scene.name})).sceneItems.find(i=>i.sourceName===names.scene);
    if(!item)throw new Error('Falta el espacio de cámara en «'+scene.name+'».');
    placements.push({sceneName:scene.name,sceneItemId:item.sceneItemId,
      enabled:item.sceneItemEnabled,transform:item.sceneItemTransform,
      target:scene.key==='camara'?layout.wide:layout.mixed.camera});
  }
  const studio=(await obs.call('GetStudioModeEnabled')).studioModeEnabled;
  const oldPreview=studio?(await obs.call('GetCurrentPreviewScene')).sceneName:null;
  const snapshot={collection:track.collection,input:names.input,inputSettings:previous,items,placements,oldPreview};
  if(backupDir){fs.mkdirSync(backupDir,{recursive:true,mode:0o700});fs.writeFileSync(
    path.join(backupDir,`camara-track-${track.id}-${Date.now()}.json`),JSON.stringify(snapshot,null,2),{flag:'wx',mode:0o600});}
  let prepared=false;
  const previewScene=track.scenes.find(s=>s.key==='mixta')?.name;
  try{
    // Una reconexión explícita reinicia también una sesión de iPhone que haya quedado pausada.
    if(previous[deviceKey]===device.id)await obs.call('SetInputSettings',{inputName:names.input,inputSettings:{[deviceKey]:''},overlay:true});
    await obs.call('SetInputSettings',{inputName:names.input,inputSettings:{[deviceKey]:device.id,
      use_preset:true,preset:'AVCaptureSessionPreset1920x1080',enable_audio:false},overlay:true});
    await obs.call('SetSceneItemTransform',{sceneName:names.scene,sceneItemId:camera.sceneItemId,
      sceneItemTransform:fitted({x:0,y:0,w:1920,h:1080})});
    for(const item of items){
      if(item.sourceName===names.input||item.sourceName===`T${track.id} · Prueba cámara`||/av_capture_input|macos-avcapture/.test(item.inputKind||'')){
        await obs.call('SetSceneItemEnabled',{sceneName:names.scene,sceneItemId:item.sceneItemId,
          sceneItemEnabled:item.sourceName===names.input});
      }
    }
    for(const item of placements){
      await obs.call('SetSceneItemTransform',{sceneName:item.sceneName,sceneItemId:item.sceneItemId,sceneItemTransform:fitted(item.target)});
      await obs.call('SetSceneItemEnabled',{sceneName:item.sceneName,sceneItemId:item.sceneItemId,sceneItemEnabled:true});
    }
    if(studio&&previewScene){await obs.call('SetCurrentPreviewScene',{sceneName:previewScene});prepared=true;}
    let transform;
    const deadline=Date.now()+frameTimeout;
    do{
      transform=(await obs.call('GetSceneItemTransform',{sceneName:names.scene,sceneItemId:camera.sceneItemId})).sceneItemTransform;
      if(transform.sourceWidth>0&&transform.sourceHeight>0)break;
      await new Promise(resolve=>setTimeout(resolve,150));
    }while(Date.now()<deadline);
    if(!(transform.sourceWidth>0&&transform.sourceHeight>0))throw new Error('El iPhone todavía no entrega imagen. Revisa su conexión o los permisos de cámara de OBS y vuelve a conectar.');
    const selected=(await obs.call('GetInputSettings',{inputName:names.input})).inputSettings;
    if(selected[deviceKey]!==device.id)throw new Error('OBS no confirmó la cámara seleccionada.');
    return {device,width:transform.sourceWidth,height:transform.sourceHeight,sceneCount:placements.length,
      preview:prepared?previewScene:null};
  }catch(error){
    const failed=[];const undo=async(type,data)=>{try{await obs.call(type,data);}catch{failed.push(type);}};
    await undo('SetInputSettings',{inputName:names.input,inputSettings:previous,overlay:false});
    for(const item of items){
      await undo('SetSceneItemEnabled',{sceneName:names.scene,sceneItemId:item.sceneItemId,sceneItemEnabled:item.sceneItemEnabled});
      if(item.sourceName===names.input)await undo('SetSceneItemTransform',{sceneName:names.scene,sceneItemId:item.sceneItemId,sceneItemTransform:item.sceneItemTransform});
    }
    for(const item of placements){
      await undo('SetSceneItemTransform',{sceneName:item.sceneName,sceneItemId:item.sceneItemId,sceneItemTransform:item.transform});
      await undo('SetSceneItemEnabled',{sceneName:item.sceneName,sceneItemId:item.sceneItemId,sceneItemEnabled:item.enabled});
    }
    if(prepared&&oldPreview)await undo('SetCurrentPreviewScene',{sceneName:oldPreview});
    if(failed.length)throw new Error(error.message+' Revisa el encuadre en OBS; no se pudo restaurar todo.');
    throw error;
  }
}
