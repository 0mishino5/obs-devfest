import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {ROOT,assertHost,packagePlatform,readJSON,copyTree} from '../06_OBS/plataforma.mjs';
import {prepare} from '../06_OBS/preparacion.mjs';
import {OBS} from './obs.mjs';

assertHost();
if(packagePlatform()!=='windows')throw new Error('Usa el paquete de Windows.');
const base='http://127.0.0.1:8787';
const instance=crypto.createHash('sha256').update(ROOT).digest('hex').slice(0,16);
const runtime=path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026','OBS_Demo');
const configDir=path.join(runtime,'config/obs-studio');
const source=path.join(process.env.ProgramFiles,'obs-studio');
const executable=path.join(runtime,'bin/64bit/obs64.exe');
const data=readJSON(path.join(ROOT,'05_Datos/produccion.json'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let app,panel,obs,stopping=false;

function browser(url) {
  const child=spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true,stdio:'ignore'});
  child.on('error',()=>console.log('Abre '+url));child.unref();
}
async function waitFor(fn,label,timeout=45000) {
  const end=Date.now()+timeout;let last;
  while(Date.now()<end){if(stopping)throw new Error('Demo cerrada.');try{const r=await fn();if(r)return r;}catch(e){last=e;}await pause(250);}
  throw new Error(label+': '+(last?.message||'tiempo agotado'));
}
async function stop() {
  if(stopping)return;stopping=true;obs?.close();
  for(const child of [panel,app])if(child&&child.exitCode===null){
    try{execFileSync('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}catch{}
  }
}
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>{stop().then(()=>process.exit(0));});
try {
  let existing;
  try {existing=await(await fetch(base+'/api/config',{signal:AbortSignal.timeout(1200)})).json();}
  catch(e){if(e.cause?.code!=='ECONNREFUSED')throw new Error('El puerto 8787 está ocupado o no responde. Cierra el otro panel.');}
  if(existing){
    if(existing.instance!==instance||!existing.demo)throw new Error('Hay otro panel abierto. Ciérralo antes de iniciar la vista de diseño.');
    browser(base+'/07_Control/guia-windows.html');console.log('La demo ya está abierta.');
  } else {
    if(!fs.existsSync(executable)) {
      if(!fs.existsSync(path.join(source,'bin/64bit/obs64.exe')))throw new Error('Instala OBS Studio desde obsproject.com antes de abrir la demo.');
      console.log('Preparando la copia de OBS para ver el diseño (solo la primera vez)...');
      fs.mkdirSync(runtime,{recursive:true});copyTree(source,runtime);
    }
    fs.writeFileSync(path.join(runtime,'portable_mode.txt'),'');
    prepare({root:ROOT,platform:'windows'});
    for(const tr of data.tracks){
      const scene=path.join(configDir,'basic/scenes',tr.collection+'.json');
      fs.mkdirSync(path.dirname(scene),{recursive:true});
      fs.copyFileSync(path.join(ROOT,'06_OBS/Colecciones',tr.collection+'.json'),scene);
      const name=`DEVFEST_2026_TRACK_${tr.id}_1080p`,profile=path.join(configDir,'basic/profiles',name);
      fs.mkdirSync(profile,{recursive:true});
      for(const f of ['basic.ini','service.json'])fs.copyFileSync(path.join(ROOT,'06_OBS/Perfiles',name,f),path.join(profile,f));
    }
    const wsFile=path.join(configDir,'plugin_config/obs-websocket/config.json');
    fs.mkdirSync(path.dirname(wsFile),{recursive:true});
    let ws={};if(fs.existsSync(wsFile))ws=readJSON(wsFile);
    fs.writeFileSync(wsFile,JSON.stringify({first_load:false,server_enabled:true,server_port:14455,auth_required:true,server_password:ws.server_password||crypto.randomBytes(24).toString('hex'),alerts_enabled:false},null,2));
    if(!fs.existsSync(path.join(configDir,'global.ini')))fs.writeFileSync(path.join(configDir,'global.ini'),'[General]\nFirstRun=false\nEnableAutoUpdates=false\n\n[BasicWindow]\nSysTrayEnabled=true\n');
    const state=Object.fromEntries(data.tracks.map(t=>[t.id,{speakerId:t.speakers[0].id,visible:false,revision:0,motion:true,banner:'GDG Arequipa · @gdgaqp · #DevFestArequipa2026',bannerVisible:true}]));
    fs.writeFileSync(path.join(ROOT,'07_Control/estado-demo.json'),JSON.stringify(state,null,2));
    app=spawn(executable,['--portable','--multi','--disable-updater','--disable-missing-files-check','--websocket_ipv4_only','--collection',data.tracks[0].collection,'--profile','DEVFEST_2026_TRACK_1_1080p'],{cwd:path.dirname(executable),windowsHide:false,stdio:'ignore'});
    app.on('error',e=>{console.error(e.message);stop();});
    app.on('exit',()=>{console.log('OBS cerrado. La vista de diseño ha terminado.');stop();});
    obs=new OBS({configDir,connectTimeout:1500});
    await waitFor(async()=>{if(app.exitCode!==null)throw new Error('OBS se cerró.');await obs.connect();return obs.call('GetVersion');},'Inicio de OBS');
    await obs.call('SetStudioModeEnabled',{studioModeEnabled:true});
    await obs.call('SetCurrentProgramScene',{sceneName:data.tracks[0].scenes[0].name});
    await obs.call('SetCurrentPreviewScene',{sceneName:data.tracks[0].scenes[1].name});
    await obs.call('SetCurrentSceneTransition',{transitionName:'DevFest · Glifos'});
    panel=spawn(process.execPath,[path.join(ROOT,'07_Control/servidor.mjs')],{cwd:ROOT,env:{...process.env,DEVFEST_DEMO:'1',DEVFEST_OBS_CONFIG_DIR:configDir,DEVFEST_PORT:'8787'},windowsHide:true,stdio:'inherit'});
    panel.on('exit',()=>{if(!stopping)stop();});
    await waitFor(async()=>{const r=await fetch(base+'/api/status');const s=await r.json();return s.connected&&s.track===1;},'Inicio del panel');
    console.log('Vista de diseño lista. Usa OBS para ver las animaciones fluidas.');
    console.log('Panel: '+base+' | Guía: '+base+'/07_Control/guia-windows.html');
    console.log('Para terminar, muestra Cierre y cierra OBS. También puedes pulsar Ctrl+C aquí.');
    browser(base);browser(base+'/07_Control/guia-windows.html');
  }
} catch(e){console.error(e.message);await stop();process.exitCode=1;}
