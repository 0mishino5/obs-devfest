import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {ROOT} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

const base='http://127.0.0.1:8787',out=path.join(ROOT,'09_Pruebas/Revision_v4');
const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ownRecording=false;
async function wait(fn,label){for(let i=0;i<120;i++){try{const value=await fn();if(value)return value;}catch{}await pause(250);}throw new Error(label);}
async function action(action,extra={}){return wait(async()=>{const r=await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({track:1,action,...extra})});if(r.status===409)return false;const s=await r.json();if(!r.ok)throw Error(s.error);return s;},'No se pudo aplicar '+action);}
async function shot(name,file){const s=await obs.call('GetSourceScreenshot',{sourceName:name,imageFormat:'png',imageWidth:1920,imageHeight:1080});fs.writeFileSync(path.join(out,file),Buffer.from(s.imageData.split(',')[1],'base64'));}
try{
  await wait(async()=>{const r=await fetch(base+'/api/status');const s=await r.json();return s.connected&&s.track===1;},'No se pudo conectar con la demo.');
  const cfg=await(await fetch(base+'/api/config')).json();assert.equal(cfg.demo,true);
  assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
  assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
  await action('motion',{enabled:true});await action('transition',{name:'DevFest · Glifos'});
  await action('speaker',{speakerId:'t1-01'});await action('show');await action('mute',{muted:true});
  await action('scene',{scene:'01 · Bienvenida',preview:false});await pause(1800);
  const before=await obs.call('GetStats');
  await obs.call('StartRecord');ownRecording=true;
  console.log('Grabando la propuesta visual en OBS (solo archivo local)...');
  await pause(5500);await shot('01 · Bienvenida','bienvenida.png');await shot('T1 · Pantalla inicio','bienvenida-html.png');await pause(3500);
  await action('scene',{scene:'02 · Diapositivas + ponente',preview:false});await pause(1000);await action('replay');await pause(2000);
  await shot('02 · Diapositivas + ponente','composicion-principal.png');
  await action('speaker',{speakerId:'t1-03'});await pause(2500);
  await action('scene',{scene:'03 · Cámara del ponente',preview:false});await pause(3000);
  await action('scene',{scene:'07 · Espera',preview:false});await pause(4000);
  await action('scene',{scene:'11 · Cierre',preview:false});await pause(3500);
  const stopped=await obs.call('StopRecord');ownRecording=false;
  const after=await obs.call('GetStats');
  // OBS puede confirmar la parada antes de finalizar la escritura del contenedor MKV.
  let lastSize=-1,stable=0;
  for(let i=0;i<20&&stable<3;i++){await pause(300);const size=fs.statSync(stopped.outputPath).size;stable=size===lastSize?stable+1:0;lastSize=size;}
  const mp4=path.join(out,'diseno-profesional-v4.mp4');
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',stopped.outputPath,'-c','copy','-movflags','+faststart',mp4],{windowsHide:true});
  const result={date:new Date().toISOString(),file:'diseno-profesional-v4.mp4',localRecording:true,streaming:false,width:1920,height:1080,fps:30,renderSkipped:after.renderSkippedFrames-before.renderSkippedFrames,encodingSkipped:after.outputSkippedFrames-before.outputSkippedFrames,averageFrameRenderTime:after.averageFrameRenderTime};
  fs.writeFileSync(path.join(out,'grabacion.json'),JSON.stringify(result,null,2)+'\n');
  await action('speaker',{speakerId:'t1-01'});await action('show');await action('scene',{scene:'02 · Diapositivas + ponente',preview:false});await obs.call('SetCurrentPreviewScene',{sceneName:'01 · Bienvenida'});
  console.log(JSON.stringify(result));
}finally{
  if(ownRecording)try{await obs.call('StopRecord');}catch{}
  obs.close();
}
