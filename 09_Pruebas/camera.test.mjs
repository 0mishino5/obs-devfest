import test from 'node:test';
import assert from 'node:assert/strict';
import {connectCamera,cameraNames} from '../07_Control/camera.mjs';
const track={id:1,collection:'Prueba',audio:'Micrófono independiente',scenes:[
  {name:'Mixta',key:'mixta'},{name:'Cámara',key:'camara'},{name:'Preguntas',key:'preguntas'}]};
const names=cameraNames(track);
const item=(id,name,kind,on)=>({sceneItemId:id,sourceName:name,inputKind:kind,sceneItemEnabled:on,
  sceneItemTransform:{positionX:9,positionY:9,boundsWidth:100,boundsHeight:100,sourceWidth:0,sourceHeight:0,boundsType:'OBS_BOUNDS_STRETCH',boundsAlignment:5,alignment:5,rotation:8,cropLeft:3,cropTop:2,cropRight:4,cropBottom:1,cropToBounds:true}});
class CameraOBS{
  constructor(){this.settings={uid:'',enable_audio:false};this.preview='Cierre';this.frames=true;this.calls=[];this.scenes={
    [names.scene]:[item(1,'T1 · Prueba cámara','image_source',true),item(2,names.input,'av_capture_input_v2',false),item(3,'T1 · Cámara 2 · configurar','av_capture_input_v2',false)],
    Mixta:[item(1,names.scene,null,true)],Cámara:[item(1,names.scene,null,true)],Preguntas:[item(1,names.scene,null,true)]};}
  async call(type,d={}){
    this.calls.push({type,data:structuredClone(d)});
    switch(type){
      case 'GetInputPropertiesListPropertyItems':return {propertyItems:[{itemEnabled:true,itemValue:'iphone',itemName:'Cámara de iPhone'},{itemEnabled:true,itemValue:'',itemName:''}]};
      case 'GetInputSettings':return {inputKind:this.kind||'av_capture_input_v2',inputSettings:structuredClone(this.settings)};
      case 'GetSceneItemList':return {sceneItems:structuredClone(this.scenes[d.sceneName])};
      case 'GetStudioModeEnabled':return {studioModeEnabled:true};
      case 'GetCurrentPreviewScene':return {sceneName:this.preview};
      case 'SetCurrentPreviewScene':this.preview=d.sceneName;return {};
      case 'SetInputSettings':this.settings=d.overlay?{...this.settings,...d.inputSettings}:structuredClone(d.inputSettings);return {};
      case 'SetSceneItemEnabled':this.scenes[d.sceneName].find(i=>i.sceneItemId===d.sceneItemId).sceneItemEnabled=d.sceneItemEnabled;return {};
      case 'SetSceneItemTransform':Object.assign(this.scenes[d.sceneName].find(i=>i.sceneItemId===d.sceneItemId).sceneItemTransform,d.sceneItemTransform);return {};
      case 'GetSceneItemTransform':return {sceneItemTransform:{...this.scenes[d.sceneName].find(i=>i.sceneItemId===d.sceneItemId).sceneItemTransform,sourceWidth:this.frames?1920:0,sourceHeight:this.frames?1080:0}};
      default:throw Error('No debe tocar otras entradas ni el programa: '+type);
    }
  }
}
test('iPhone compartido, encaje proporcional y audio independiente',async()=>{
  const obs=new CameraOBS(),result=await connectCamera(obs,track,'iphone');
  assert.equal(result.sceneCount,3);assert.equal(result.width,1920);assert.equal(obs.preview,'Mixta');assert.equal(obs.settings.enable_audio,false);
  assert.deepEqual(obs.scenes[names.scene].map(i=>i.sceneItemEnabled),[false,true,false]);
  assert.equal(obs.scenes.Mixta[0].sceneItemTransform.boundsWidth,600);
  assert.equal(obs.scenes.Mixta[0].sceneItemTransform.boundsHeight,337.5);
  assert.equal(obs.scenes.Cámara[0].sceneItemTransform.boundsWidth,1648);
  assert.equal(obs.scenes.Cámara[0].sceneItemTransform.boundsHeight,927);
  for(const scene of ['Mixta','Cámara','Preguntas'])assert.equal(obs.scenes[scene][0].sceneItemTransform.boundsType,'OBS_BOUNDS_SCALE_INNER');
  assert(!obs.calls.some(c=>/SetInputMute|SetInputAudio|CreateInput|CreateSceneItem|SetCurrentProgramScene|StartStream|StartRecord/.test(c.type)));
});
test('reconectar reinicia el iPhone sin crear fuentes duplicadas',async()=>{
  const obs=new CameraOBS();await connectCamera(obs,track,'iphone');const count=Object.values(obs.scenes).flat().length;obs.calls=[];
  await connectCamera(obs,track,'iphone');assert.equal(Object.values(obs.scenes).flat().length,count);
  assert(obs.calls.some(c=>c.type==='SetInputSettings'&&c.data.inputSettings.uid===''));
});
test('una cámara desconectada no cambia nada',async()=>{
  const obs=new CameraOBS();await assert.rejects(connectCamera(obs,track,'otra'),/no está disponible/);assert.equal(obs.calls.length,1);assert.equal(obs.preview,'Cierre');
});
test('si el iPhone no entrega imagen se restauran ajustes, encuadres y vista previa',async()=>{
  const obs=new CameraOBS();obs.frames=false;const before=structuredClone(obs.scenes);
  await assert.rejects(connectCamera(obs,track,'iphone',{frameTimeout:0}),/todavía no entrega imagen/);
  assert.deepEqual(obs.settings,{uid:'',enable_audio:false});assert.deepEqual(obs.scenes,before);assert.equal(obs.preview,'Cierre');
});

test('captura moderna de macOS recuerda device y mantiene el audio desactivado',async()=>{
  const obs=new CameraOBS();obs.kind='macos-avcapture';obs.settings={device:'',enable_audio:false};
  const result=await connectCamera(obs,track,'iphone');
  assert.equal(obs.settings.device,'iphone');assert.equal(obs.settings.enable_audio,false);assert.equal(result.height,1080);
  await connectCamera(obs,track,'iphone');assert(obs.calls.some(c=>c.type==='SetInputSettings'&&c.data.inputSettings.device===''));
});
