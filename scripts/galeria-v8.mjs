import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

const config=readJSON(path.join(ROOT,'05_Datos/produccion.json'));
const out=path.join(ROOT,'09_Pruebas/Revision_v8');
const tiles=config.tracks[0].scenes.slice(0,11).map(s=>{
  const num=s.name.slice(0,2),url='../../02_Graficos/t1_escena_'+num+'.png';
  return '<figure><a href="'+url+'"><img src="'+url+'" alt="'+s.name+'"></a><figcaption>'+s.name+'</figcaption></figure>';
}).join('');
const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DevFest · Revisión de los 11 diseños</title><style>'+
'@font-face{font-family:Google;src:url("../../01_Identidad/fuentes/GoogleSans-Regular.ttf")}*{box-sizing:border-box}body{margin:0;background:#1e1e1e;color:#f0f0f0;font-family:Google,Arial,sans-serif}.wrap{max-width:1840px;margin:auto;padding:32px 0}header{height:80px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}h1{font-size:43px;margin:0}header p{font-size:22px;margin:0;color:#c3ecf6}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}figure{margin:0;border:2px solid #f0f0f0;border-radius:14px;overflow:hidden;background:#f0f0f0;color:#1e1e1e}figure a{display:block}figure img{display:block;width:100%;aspect-ratio:16/9;object-fit:contain}figcaption{height:46px;display:flex;align-items:center;padding:0 16px;font-size:22px}.signature{background:#ff7daf;border-radius:14px;padding:38px;color:#1e1e1e;display:flex;flex-direction:column;justify-content:center}.signature strong{font-size:60px;line-height:1.05}.signature span{margin-top:22px;font-size:24px}.footer{margin-top:24px;font-size:20px}.footer a{color:#c3ecf6}@media(max-width:1900px){.wrap{padding:24px}.grid{gap:16px}}@media(max-width:1100px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}header{height:auto;align-items:start;gap:14px;flex-direction:column}h1{font-size:32px}}@media(max-width:700px){.grid{grid-template-columns:1fr}figcaption{font-size:19px}}'+
'</style></head><body><main class="wrap"><header><h1>DevFest Arequipa 2026</h1><p>Marca integrada · Cada escena con su espacio</p></header><section class="grid">'+tiles+'<div class="signature"><strong>Marca visible.<br>Contenido claro.</strong><span>Nombre y tema en pantalla · Identidad local</span></div></section><div class="footer"><a href="comparacion.html">Ver el ajuste antes y después</a> · <a href="/?track=1">Abrir el panel de control</a></div></main></body></html>';
fs.writeFileSync(path.join(out,'revision.html'),html+'\n');
const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
const scene='RENDER · Galería v8',inputName='RENDER · Galería visual v8';
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ownScene=false,ownInput=false,original;
try{
  assert.equal((await(await fetch('http://127.0.0.1:8787/api/config')).json()).demo,true);
  assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
  assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
  original=await obs.call('GetSceneList');
  await obs.call('CreateScene',{sceneName:scene});ownScene=true;
  await obs.call('CreateInput',{sceneName:scene,inputName,inputKind:'browser_source',inputSettings:{is_local_file:true,local_file:path.join(out,'revision.html'),width:1920,height:1840,fps:30,shutdown:false,reroute_audio:false},sceneItemEnabled:true});ownInput=true;
  await obs.call('SetCurrentPreviewScene',{sceneName:scene});await pause(2000);
  const shot=await obs.call('GetSourceScreenshot',{sourceName:inputName,imageFormat:'png',imageWidth:1920,imageHeight:1840});
  fs.writeFileSync(path.join(out,'once-escenas.png'),Buffer.from(shot.imageData.split(',')[1],'base64'));
  console.log('Galería de revisión y captura de los 11 diseños listas.');
}finally{
  if(original?.currentPreviewSceneName)try{await obs.call('SetCurrentPreviewScene',{sceneName:original.currentPreviewSceneName});}catch{}
  if(ownInput)try{await obs.call('RemoveInput',{inputName});}catch{}
  if(ownScene)try{await obs.call('RemoveScene',{sceneName:scene});}catch{}
  obs.close();
}
