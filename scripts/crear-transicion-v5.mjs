import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

const base='http://127.0.0.1:8787';
assert.equal((await(await fetch(base+'/api/config')).json()).demo,true);
const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
const config=readJSON(path.join(ROOT,'05_Datos/produccion.json'));
const frames=path.join(ROOT,'09_Pruebas/Revision_v5/stinger-frames');fs.mkdirSync(frames,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const scene='RENDER · Cortinilla v5',inputName='RENDER · Cuadro cortinilla v5';
let ownScene=false,ownInput=false,original;
try{
  assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
  assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
  original=await obs.call('GetSceneList');
  if(!(await obs.call('GetSceneList')).scenes.some(s=>s.sceneName===scene))await obs.call('CreateScene',{sceneName:scene});
  ownScene=true;
  if(!(await obs.call('GetInputList')).inputs.some(i=>i.inputName===inputName)){
    await obs.call('CreateInput',{sceneName:scene,inputName,inputKind:'browser_source',inputSettings:{is_local_file:false,url:base+'/03_HTML/transicion-v5.html?frame=0',width:1920,height:1080,fps:30,fps_custom:true,shutdown:false,reroute_audio:false,css:'body { margin:0; background:transparent; overflow:hidden; }'},sceneItemEnabled:true});
  }
  ownInput=true;
  await obs.call('SetStudioModeEnabled',{studioModeEnabled:true});
  await obs.call('SetCurrentPreviewScene',{sceneName:scene});
  for(let frame=0;frame<36;frame++){
    await obs.call('SetInputSettings',{inputName,inputSettings:{url:base+'/03_HTML/transicion-v5.html?frame='+frame},overlay:true});
    await pause(400);
    const shot=await obs.call('GetSourceScreenshot',{sourceName:inputName,imageFormat:'png',imageWidth:1920,imageHeight:1080});
    fs.writeFileSync(path.join(frames,'frame-'+String(frame).padStart(3,'0')+'.png'),Buffer.from(shot.imageData.split(',')[1],'base64'));
  }
  const output=path.join(ROOT,'04_Transiciones/devfest_estudio_v5.webm');
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-framerate','30','-i',path.join(frames,'frame-%03d.png'),'-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-crf','18','-b:v','0','-an',output],{windowsHide:true});
  const decoded=execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-c:v','libvpx-vp9','-i',output,'-vf','select=eq(n\\,0)+eq(n\\,18)+eq(n\\,35)','-vsync','0','-f','rawvideo','-pix_fmt','rgba','-'],{windowsHide:true,maxBuffer:32*1024*1024});
  const size=1920*1080*4;assert.equal(decoded.length,size*3);
  const alpha=[0,1,2].map(frame=>{let min=255,max=0;for(let p=frame*size+3;p<(frame+1)*size;p+=4){min=Math.min(min,decoded[p]);max=Math.max(max,decoded[p]);}return [min,max];});
  assert.deepEqual(alpha,[[0,0],[255,255],[0,0]]);
  fs.writeFileSync(path.join(ROOT,'09_Pruebas/Revision_v5/transicion.json'),JSON.stringify({date:new Date().toISOString(),file:'04_Transiciones/devfest_estudio_v5.webm',width:1920,height:1080,fps:30,frames:36,switchAtMs:600,decodedAlpha:alpha,originalAssets:true},null,2)+'\n');
  console.log('Cortinilla v5 renderizada con recursos originales: 1080p, 30 FPS y alfa verificado.');
}finally{
  if(original?.currentPreviewSceneName)try{await obs.call('SetCurrentPreviewScene',{sceneName:original.currentPreviewSceneName});}catch{}
  if(ownInput)try{await obs.call('RemoveInput',{inputName});}catch{}
  if(ownScene)try{await obs.call('RemoveScene',{sceneName:scene});}catch{}
  obs.close();
}
