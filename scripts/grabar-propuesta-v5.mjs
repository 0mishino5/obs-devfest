import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

const base='http://127.0.0.1:8787',out=path.join(ROOT,'09_Pruebas/Revision_v5');
const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
const track=readJSON(path.join(ROOT,'05_Datos/produccion.json')).tracks[0];
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ownRecording=false;
async function action(action,extra={}){
  for(let i=0;i<40;i++){
    const response=await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({track:1,action,...extra})});
    if(response.status===409){await pause(100);continue;}
    const data=await response.json();if(!response.ok)throw Error(data.error);return data;
  }
  throw Error('Panel ocupado durante la muestra.');
}
async function screenshot(name,file){
  const shot=await obs.call('GetSourceScreenshot',{sourceName:name,imageFormat:'png',imageWidth:1920,imageHeight:1080});
  fs.writeFileSync(path.join(out,file),Buffer.from(shot.imageData.split(',')[1],'base64'));
}
try{
  assert.equal((await(await fetch(base+'/api/config')).json()).demo,true);
  assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
  assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
  assert.equal((await obs.call('GetSceneCollectionList')).currentSceneCollectionName,track.collection);
  await action('motion',{enabled:true});await action('transition',{name:'DevFest · Glifos'});
  await action('speaker',{speakerId:track.speakers[0].id});await action('show');await action('mute',{muted:true});
  await action('scene',{scene:track.scenes[0].name,preview:false});await pause(1600);
  const before=await obs.call('GetStats');
  await obs.call('StartRecord');ownRecording=true;
  console.log('Grabación local v5: las 11 escenas y la cortinilla de marca.');
  await pause(5500);await screenshot(track.scenes[0].name,'bienvenida.png');
  for(const scene of track.scenes.slice(1,11)){
    if(scene.key==='proxima')await action('speaker',{speakerId:track.speakers[1].id});
    await action('scene',{scene:scene.name,preview:false});
    await pause(scene.key==='espera'?5800:4200);
    if(scene.key==='mixta')await screenshot(scene.name,'composicion-principal.png');
  }
  const stopped=await obs.call('StopRecord');ownRecording=false;
  const after=await obs.call('GetStats');
  let last=-1,stable=0;for(let i=0;i<20&&stable<3;i++){await pause(300);const size=fs.statSync(stopped.outputPath).size;stable=size===last?stable+1:0;last=size;}
  const file='diseno-escenas-v5.mp4';
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',stopped.outputPath,'-c','copy','-movflags','+faststart',path.join(out,file)],{windowsHide:true});
  const report={date:new Date().toISOString(),file,localRecording:true,streaming:false,scenes:track.scenes.slice(0,11).map(s=>s.name),width:1920,height:1080,fps:30,renderSkipped:after.renderSkippedFrames-before.renderSkippedFrames,encodingSkipped:after.outputSkippedFrames-before.outputSkippedFrames,averageFrameRenderTime:after.averageFrameRenderTime};
  fs.writeFileSync(path.join(out,'grabacion.json'),JSON.stringify(report,null,2)+'\n');
  await action('speaker',{speakerId:track.speakers[0].id});await action('show');
  await action('scene',{scene:track.scenes[0].name,preview:false});
  await obs.call('SetCurrentPreviewScene',{sceneName:track.scenes[1].name});
  console.log(JSON.stringify(report));
}finally{
  if(ownRecording)try{await obs.call('StopRecord');}catch{}
  obs.close();
}
