// Ensayo explícito con una copia portátil temporal de OBS. No usa la configuración personal.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import net from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {ROOT,copyTree,readJSON,packagePlatform} from '../06_OBS/plataforma.mjs';
import {prepare} from '../06_OBS/preparacion.mjs';
import {OBS} from '../07_Control/obs.mjs';

if(process.platform!=='win32'||packagePlatform()!=='windows')throw new Error('Este ensayo requiere el paquete de Windows.');
const source=process.argv[2]||path.join(process.env.ProgramFiles,'obs-studio');
if(!fs.existsSync(path.join(source,'bin/64bit/obs64.exe')))throw new Error('No se encontró OBS. Indica su carpeta de instalación.');
const base='http://127.0.0.1:8787',data=readJSON(path.join(ROOT,'05_Datos/produccion.json'));
try {await fetch(base+'/api/config',{signal:AbortSignal.timeout(1000)});throw new Error('Cierra el panel del puerto 8787 antes de ensayar.');}
catch(e) {if(e.cause?.code!=='ECONNREFUSED')throw e;}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'devfest-obs-ensayo-'));
const configDir=path.join(temp,'config/obs-studio');
const results={date:'2026-10-31',platform:'windows',tracks:[],streamingStarted:false,physicalDevicesTested:false};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let app,panel,obs;
async function waitFor(fn,label,timeout=30000) {
  const end=Date.now()+timeout;let last;
  while(Date.now()<end){try {const value=await fn();if(value)return value;}catch(e){last=e;}await pause(200);}
  throw new Error(label+': '+(last?.message||'tiempo agotado'));
}
async function request(route,body) {
  const res=await fetch(base+route,body?{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(body)}:{});
  const json=await res.json();
  if(res.status===409)return null;
  if(!res.ok)throw new Error(json.error||`HTTP ${res.status}`);
  return json;
}
const action=(track,action,extra={})=>waitFor(()=>request('/api/action',{track,action,...extra}),'Acción '+action);
const out=path.join(ROOT,'09_Pruebas/Windows');
try {
  console.log('Preparando OBS portátil aislado...');
  copyTree(source,temp);
  fs.writeFileSync(path.join(temp,'portable_mode.txt'),'');
  prepare({root:ROOT,platform:'windows',install:true,configDir,checkRunning:()=>false});
  fs.mkdirSync(path.join(configDir,'plugin_config/obs-websocket'),{recursive:true});
  const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
  fs.writeFileSync(path.join(configDir,'plugin_config/obs-websocket/config.json'),JSON.stringify({first_load:false,server_enabled:true,server_port:port,auth_required:true,server_password:crypto.randomBytes(24).toString('hex'),alerts_enabled:false}));
  fs.writeFileSync(path.join(configDir,'global.ini'),'[General]\nFirstRun=false\nEnableAutoUpdates=false\n\n[BasicWindow]\nSysTrayEnabled=true\n');
  const executable=path.join(temp,'bin/64bit/obs64.exe');
  app=spawn(executable,['--portable','--multi','--minimize-to-tray','--disable-updater','--disable-missing-files-check','--websocket_ipv4_only','--collection',data.tracks[0].collection,'--profile','DEVFEST_2026_TRACK_1_1080p'],{cwd:path.dirname(executable),windowsHide:true,stdio:'ignore'});
  app.on('error',e=>console.error('OBS: '+e.message));
  obs=new OBS({configDir,connectTimeout:1500});
  await waitFor(async()=>{if(app.exitCode!==null)throw new Error('OBS terminó con código '+app.exitCode);await obs.connect();return true;},'Conexión real con OBS',45000);
  results.obsVersion=(await waitFor(()=>obs.call('GetVersion'),'OBS listo para operar',45000)).obsVersion;
  const kinds=(await obs.call('GetInputKindList')).inputKinds;
  for(const kind of ['dshow_input','window_capture','wasapi_input_capture','browser_source'])assert(kinds.includes(kind),kind);
  panel=spawn(process.execPath,[path.join(ROOT,'07_Control/servidor.mjs')],{cwd:ROOT,env:{...process.env,DEVFEST_OBS_CONFIG_DIR:configDir},windowsHide:true,stdio:['ignore','pipe','pipe']});
  panel.stdout.on('data',b=>process.stdout.write(b));panel.stderr.on('data',b=>process.stderr.write(b));
  await waitFor(async()=>{const c=await request('/api/config');return c?.platform==='windows';},'Inicio del panel');
  fs.mkdirSync(out,{recursive:true});
  for(const tr of data.tracks) {
    if(tr.id===2)await obs.call('SetCurrentSceneCollection',{sceneCollectionName:tr.collection});
    await waitFor(async()=>{const s=await request('/api/status');return s?.connected&&s.track===tr.id;},'Colección Track '+tr.id);
    await action(tr.id,'studio',{enabled:false});
    await action(tr.id,'transition',{name:'Corte'});
    const checked=[];
    for(const scene of tr.scenes) {
      await action(tr.id,'scene',{scene:scene.name,preview:false});
      const status=await waitFor(()=>request('/api/status'),'Estado');
      assert.equal(status.program,scene.name);checked.push(scene.name);
    }
    await action(tr.id,'studio',{enabled:true});
    await action(tr.id,'scene',{scene:tr.scenes[1].name,preview:true});
    await action(tr.id,'take');
    for(const speaker of tr.speakers) {
      await action(tr.id,'speaker',{speakerId:speaker.id});
      await action(tr.id,'show');
      const state=await request('/api/state');assert.equal(state[tr.id].speakerId,speaker.id);assert.equal(state[tr.id].visible,true);
    }
    await action(tr.id,'replay');await action(tr.id,'hide');
    await action(tr.id,'banner',{text:'Prueba Windows · DevFest Arequipa',visible:true});
    await action(tr.id,'motion',{enabled:false});await action(tr.id,'motion',{enabled:true});
    await action(tr.id,'mute',{muted:true});
    for(const name of ['DevFest · Glifos','Desvanecimiento','Corte'])await action(tr.id,'transition',{name});
    await action(tr.id,'refresh');await pause(1500);
    const shot=await waitFor(()=>request('/api/screenshot?scene='+encodeURIComponent(tr.scenes[1].name)),'Captura');
    assert(shot.imageData.length>10000);
    fs.writeFileSync(path.join(out,`track-${tr.id}-mixta.jpg`),Buffer.from(shot.imageData.split(',')[1],'base64'));
    const status=await waitFor(()=>request('/api/status'),'Estado final');assert.equal(status.streaming,false);assert.equal(status.recording,false);
    results.tracks.push({track:tr.id,scenes:checked,speakers:tr.speakers.length,studioPreviewAndTake:true,lowerThirdAndBanner:true,motionMuteRefresh:true,transitions:3,screenshot:true});
    console.log(`Track ${tr.id}: ${checked.length} escenas y ${tr.speakers.length} nombres comprobados en OBS ${results.obsVersion}.`);
  }
  const invalid=await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({track:1,action:'show'})});
  assert.equal(invalid.status,403);results.controlWithoutOriginRejected=true;
  fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify(results,null,2)+'\n');
  console.log('Ensayo real completado sin iniciar transmisión ni grabación.');
} finally {
  obs?.close();
  for(const child of [panel,app])if(child&&child.exitCode===null){
    // Cerrar también los subprocesos de navegador de la copia portátil.
    try {execFileSync('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}catch{child.kill();}
    await Promise.race([new Promise(r=>child.once('exit',r)),pause(2000)]);
  }
  const tempRoot=path.resolve(os.tmpdir())+path.sep;
  if(path.resolve(temp).startsWith(tempRoot)&&path.basename(temp).startsWith('devfest-obs-ensayo-')){
    try {fs.rmSync(temp,{recursive:true,force:true,maxRetries:5,retryDelay:300});}catch{console.log('Archivos temporales del ensayo: '+temp);}
  }
}
