import fs from 'node:fs';
import path from 'node:path';

export async function audioDevices(obs, track) {
  const result = await obs.call('GetInputPropertiesListPropertyItems', {inputName:track.audio, propertyName:'device_id'});
  return result.propertyItems
    .filter(d => d.itemEnabled && typeof d.itemValue === 'string' && !['default','disabled',''].includes(d.itemValue))
    .map(d => ({id:d.itemValue, name:d.itemName}));
}

export async function connectMicrophone(obs, track, deviceId, {backupDir} = {}) {
  const devices = await audioDevices(obs, track);
  const device = devices.find(d => d.id === deviceId);
  if (!device) throw new Error('Ese micrófono no está conectado. Enchúfalo y vuelve a seleccionarlo.');

  const input = await obs.call('GetInputSettings', {inputName:track.audio});
  const muted = (await obs.call('GetInputMute', {inputName:track.audio})).inputMuted;
  const tracks = (await obs.call('GetInputAudioTracks', {inputName:track.audio})).inputAudioTracks;
  const scenes = [];
  for (const scene of track.scenes) {
    const items = (await obs.call('GetSceneItemList', {sceneName:scene.name})).sceneItems;
    scenes.push({name:scene.name, items:items.filter(i => i.sourceName === track.audio)
      .map(i => ({id:i.sceneItemId, enabled:i.sceneItemEnabled}))});
  }
  const snapshot = {collection:track.collection, input:track.audio, inputSettings:input.inputSettings,
    muted, audioTracks:tracks, scenes};
  if (backupDir) {
    fs.mkdirSync(backupDir, {recursive:true, mode:0o700});
    fs.writeFileSync(path.join(backupDir, `audio-track-${track.id}-${Date.now()}.json`),
      JSON.stringify(snapshot,null,2), {mode:0o600, flag:'wx'});
  }

  const created = [], enabled = [];
  try {
    await obs.call('SetInputMute', {inputName:track.audio, inputMuted:true});
    await obs.call('SetInputSettings', {inputName:track.audio, inputSettings:{device_id:device.id}, overlay:true});
    await obs.call('SetInputAudioTracks', {inputName:track.audio, inputAudioTracks:{...tracks, '1':true}});
    for (const scene of scenes) {
      if (!scene.items.length) {
        const item = await obs.call('CreateSceneItem', {sceneName:scene.name, sourceName:track.audio, sceneItemEnabled:true});
        created.push({sceneName:scene.name, sceneItemId:item.sceneItemId});
      } else {
        for (const item of scene.items.filter(i => !i.enabled)) {
          await obs.call('SetSceneItemEnabled', {sceneName:scene.name, sceneItemId:item.id, sceneItemEnabled:true});
          enabled.push({sceneName:scene.name, sceneItemId:item.id});
        }
      }
    }
    for (const scene of scenes) {
      const items = (await obs.call('GetSceneItemList', {sceneName:scene.name})).sceneItems;
      if (!items.some(i => i.sourceName === track.audio && i.sceneItemEnabled)) {
        throw new Error('OBS no confirmó el micrófono en «'+scene.name+'».');
      }
    }
    const selected = await obs.call('GetInputSettings', {inputName:track.audio});
    if (selected.inputSettings.device_id !== device.id) throw new Error('OBS no confirmó el dispositivo seleccionado.');
    await obs.call('SetInputMute', {inputName:track.audio, inputMuted:false});
    return {device, sceneCount:scenes.length};
  } catch (error) {
    const failures = [];
    const undo = async (request, data) => {try {await obs.call(request,data);} catch {failures.push(request);}};
    for (const item of created.reverse()) await undo('RemoveSceneItem',item);
    for (const item of enabled.reverse()) await undo('SetSceneItemEnabled',{...item,sceneItemEnabled:false});
    await undo('SetInputSettings',{inputName:track.audio,inputSettings:input.inputSettings,overlay:false});
    await undo('SetInputAudioTracks',{inputName:track.audio,inputAudioTracks:tracks});
    await undo('SetInputMute',{inputName:track.audio,inputMuted:muted});
    if (failures.length) throw new Error(error.message+' Revisa el audio en OBS; no se pudo restaurar toda la configuración.');
    throw error;
  }
}
