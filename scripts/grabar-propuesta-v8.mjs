import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

const base='http://127.0.0.1:8787',out=path.join(ROOT,'09_Pruebas/Revision_v8');
const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
const track=readJSON(path.join(ROOT,'05_Datos/produccion.json')).tracks[0];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let ownRecording=false,original,state;
async function action(action,extra={}){
  for(let i=0;i<40;i++){
    const r=await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({track:1,action,...extra})});
    if(r.status===409){await pause(100);continue;}
    const data=await r.json();if(!r.ok)throw Error(data.error);return data;
  }
  throw Error('El panel está ocupado.');
}
try{
  assert.equal((await(await fetch(base+'/api/config')).json()).demo,true);
  assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
  assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
  assert.equal((await obs.call('GetSceneCollectionList')).currentSceneCollectionName,track.collection);
  original=await obs.call('GetSceneList');state=(await(await fetch(base+'/api/state')).json())[1];
  await action('motion',{enabled:true});await action('transition',{name:'DevFest · Glifos'});
  const transition=(await obs.call('GetCurrentSceneTransition')).transitionSettings;
  assert(transition.path.endsWith('devfest_estudio_v8.webm'),'La muestra debe utilizar la cortinilla actual.');
  await action('speaker',{speakerId:track.speakers[0].id});await action('show');
  await action('scene',{scene:track.scenes[0].name,preview:false});await pause(1300);
  const before=await obs.call('GetStats');
  await obs.call('StartRecord');ownRecording=true;
  console.log('Grabando las once escenas de la versión v8, con animaciones y transiciones.');
  await pause(5000);
  for(const scene of track.scenes.slice(1,11)){
    if(scene.key==='proxima')await action('speaker',{speakerId:track.speakers[1].id});
    await action('scene',{scene:scene.name,preview:false});
    if(scene.key==='slides'){
      await pause(3300);await action('speaker',{speakerId:track.speakers[3].id});await pause(3300);
      await action('speaker',{speakerId:track.speakers[0].id});
    }else await pause(scene.key==='espera'?5000:4200);
  }
  const stopped=await obs.call('StopRecord');ownRecording=false;
  const after=await obs.call('GetStats');
  let last=-1,stable=0;
  for(let i=0;i<20&&stable<3;i++){await pause(300);const size=fs.statSync(stopped.outputPath).size;stable=size===last?stable+1:0;last=size;}
  const file='diseno-coherencia-v8.mp4',output=path.join(out,file);
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',stopped.outputPath,'-map','0:v:0','-c:v','copy','-an','-movflags','+faststart',output],{windowsHide:true});
  const media=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size:stream=codec_name,width,height,avg_frame_rate','-of','json',output],{windowsHide:true,encoding:'utf8'}));
  const [numerator,denominator]=media.streams[0].avg_frame_rate.split('/').map(Number);
  assert.equal(media.streams[0].width,1920);assert.equal(media.streams[0].height,1080);assert(Math.abs(numerator/denominator-30)<.02);assert.equal(media.streams[0].codec_name,'h264');
  assert(Number(media.format.duration)>50&&Number(media.format.duration)<100);
  const report={date:new Date().toISOString(),file,localRecording:true,streaming:false,scenes:track.scenes.slice(0,11).map(s=>s.name),media,renderSkipped:after.renderSkippedFrames-before.renderSkippedFrames,encodingSkipped:after.outputSkippedFrames-before.outputSkippedFrames,averageFrameRenderTime:after.averageFrameRenderTime};
  fs.writeFileSync(path.join(out,'grabacion.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
}finally{
  if(ownRecording)try{await obs.call('StopRecord');}catch{}
  if(state)try{await action('speaker',{speakerId:state.speakerId});await action(state.visible?'show':'hide');await action('motion',{enabled:state.motion});}catch{}
  if(original)try{
    await action('scene',{scene:original.currentProgramSceneName,preview:false});
    if(original.currentPreviewSceneName)await obs.call('SetCurrentPreviewScene',{sceneName:original.currentPreviewSceneName});
  }catch{}
  obs.close();
}
