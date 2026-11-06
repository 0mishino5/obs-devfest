import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {connectMicrophone} from '../07_Control/audio.mjs';

const track={id:1,collection:'Colección de prueba',audio:'Micrófono único',scenes:[{name:'Inicio'},{name:'Charla'},{name:'Cierre'}]};
class AudioOBS {
  constructor(){this.settings={device_id:'disabled'};this.muted=true;this.tracks={'1':false,'2':true};this.nextId=3;this.calls=[];this.scenes={Inicio:[{sceneItemId:1,sourceName:track.audio,sceneItemEnabled:false}],Charla:[],Cierre:[]};}
  async call(request,d={}){
    this.calls.push(request);
    switch(request){
      case 'GetInputPropertiesListPropertyItems':return {propertyItems:[{itemEnabled:true,itemName:'BOYAMIC',itemValue:'usb-boya'},{itemEnabled:true,itemName:'Por defecto',itemValue:'default'}]};
      case 'GetInputSettings':return {inputSettings:structuredClone(this.settings)};
      case 'GetInputMute':return {inputMuted:this.muted};
      case 'GetInputAudioTracks':return {inputAudioTracks:structuredClone(this.tracks)};
      case 'GetSceneItemList':return {sceneItems:structuredClone(this.scenes[d.sceneName])};
      case 'SetInputSettings':this.settings=d.overlay?{...this.settings,...d.inputSettings}:structuredClone(d.inputSettings);return {};
      case 'SetInputMute':this.muted=d.inputMuted;return {};
      case 'SetInputAudioTracks':this.tracks=structuredClone(d.inputAudioTracks);return {};
      case 'CreateSceneItem':if(d.sceneName===this.failScene)throw Error('Fallo simulado');this.scenes[d.sceneName].push({sceneItemId:this.nextId,sourceName:d.sourceName,sceneItemEnabled:d.sceneItemEnabled});return {sceneItemId:this.nextId++};
      case 'SetSceneItemEnabled':this.scenes[d.sceneName].find(i=>i.sceneItemId===d.sceneItemId).sceneItemEnabled=d.sceneItemEnabled;return {};
      case 'RemoveSceneItem':this.scenes[d.sceneName]=this.scenes[d.sceneName].filter(i=>i.sceneItemId!==d.sceneItemId);return {};
      default:throw Error('Solicitud inesperada: '+request);
    }
  }
}
test('un micrófono compartido en todas las escenas; reconectar no duplica fuentes',async()=>{
  const obs=new AudioOBS();const result=await connectMicrophone(obs,track,'usb-boya');
  assert.equal(result.sceneCount,3);assert.equal(obs.settings.device_id,'usb-boya');assert.equal(obs.muted,false);
  assert.deepEqual(obs.tracks,{'1':true,'2':true});
  await connectMicrophone(obs,track,'usb-boya');
  for(const items of Object.values(obs.scenes)){assert.equal(items.length,1);assert.equal(items[0].sourceName,track.audio);assert.equal(items[0].sceneItemEnabled,true);}
  assert.equal(obs.calls.filter(c=>c==='CreateSceneItem').length,2);
});
test('un micrófono desconectado no cambia la configuración',async()=>{
  const obs=new AudioOBS();await assert.rejects(connectMicrophone(obs,track,'otro-usb'),/no está conectado/);
  assert.equal(obs.settings.device_id,'disabled');assert.equal(obs.muted,true);assert.equal(obs.calls.length,1);
});
test('si falla una escena se restauran dispositivo, silencio, pistas y referencias',async()=>{
  const obs=new AudioOBS();obs.failScene='Cierre';const before=structuredClone(obs.scenes);
  await assert.rejects(connectMicrophone(obs,track,'usb-boya'),/Fallo simulado/);
  assert.deepEqual(obs.scenes,before);assert.deepEqual(obs.settings,{device_id:'disabled'});assert.equal(obs.muted,true);assert.deepEqual(obs.tracks,{'1':false,'2':true});
});
test('se respalda la configuración anterior antes de conectar',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'devfest-audio-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const obs=new AudioOBS();await connectMicrophone(obs,track,'usb-boya',{backupDir:dir});
  const file=path.join(dir,fs.readdirSync(dir)[0]);const saved=JSON.parse(fs.readFileSync(file));
  assert.equal(saved.inputSettings.device_id,'disabled');assert.equal(saved.muted,true);assert.equal(saved.scenes.length,3);
  if(process.platform!=='win32')assert.equal(fs.statSync(file).mode&0o777,0o600);
});
