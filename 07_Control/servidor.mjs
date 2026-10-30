import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {OBS} from './obs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.DEVFEST_PORT || 8787);
const BASE = `http://127.0.0.1:${PORT}`;
const config = JSON.parse(fs.readFileSync(path.join(ROOT, '05_Datos/produccion.json')));
const obs = new OBS();
const stateFile = path.join(ROOT, '07_Control/estado-local.json');
let state = Object.fromEntries([1,2].map(t => [t,{speakerId:config.tracks[t-1].speakers[0].id, visible:false, revision:0, motion:true, banner:'GDG Arequipa · @gdgaqp · #DevFestArequipa2026', bannerVisible:true}]));
try { const old=JSON.parse(fs.readFileSync(stateFile)); for (const t of [1,2]) state[t]={...state[t],...old[t],visible:false}; } catch {}
const persist = () => fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), {mode:0o600});
const track = t => config.tracks.find(x => x.id === Number(t));
const json = (res, code, obj) => { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(obj)); };
let busy=false;
async function waitScene(request, expected) {
  for(let i=0;i<50;i++){
    const s=await obs.call(request);
    if(s.sceneName===expected) return;
    await new Promise(r=>setTimeout(r,80));
  }
  throw new Error('OBS no confirmó el cambio de escena. Revisa el programa antes de continuar.');
}
async function waitTransition() {
  for(let i=0;i<50;i++){
    const s=await obs.call('GetCurrentSceneTransitionCursor');
    if(s.transitionCursor>=0.999) return;
    await new Promise(r=>setTimeout(r,80));
  }
  throw new Error('La transición de OBS no terminó. Revisa el programa.');
}
async function context(t) {
  const tr=track(t); if (!tr) throw new Error('Track inválido.');
  const c=await obs.call('GetSceneCollectionList');
  if (c.currentSceneCollectionName !== tr.collection) throw new Error(`La colección activa es «${c.currentSceneCollectionName}». Carga «${tr.collection}» para operar este track.`);
  return tr;
}
async function action(a) {
  const tr=await context(a.track), t=tr.id;
  if (a.action==='scene') {
    if (!tr.scenes.some(s=>s.name===a.scene)) throw new Error('Escena fuera de esta producción.');
    const studio=await obs.call('GetStudioModeEnabled');
    if (a.preview) {
      if (!studio.studioModeEnabled) throw new Error('Activa Modo Estudio para preparar una vista previa.');
      await obs.call('SetCurrentPreviewScene',{sceneName:a.scene});
      await waitScene('GetCurrentPreviewScene',a.scene);
    } else {
      if (studio.studioModeEnabled) {
        await obs.call('SetCurrentPreviewScene',{sceneName:a.scene});
        await waitScene('GetCurrentPreviewScene',a.scene);
        await obs.call('TriggerStudioModeTransition');
      } else await obs.call('SetCurrentProgramScene',{sceneName:a.scene});
      await waitScene('GetCurrentProgramScene',a.scene);
      await waitTransition();
    }
  } else if (a.action==='take') {
    if (!(await obs.call('GetStudioModeEnabled')).studioModeEnabled) throw new Error('Activa Modo Estudio primero.');
    const s=await obs.call('GetCurrentPreviewScene');
    if (!tr.scenes.some(x=>x.name===s.sceneName)) throw new Error('La vista previa no es una escena de emisión.');
    await obs.call('TriggerStudioModeTransition');
    await waitScene('GetCurrentProgramScene',s.sceneName);
    await waitTransition();
  } else if (a.action==='studio') {
    await obs.call('SetStudioModeEnabled',{studioModeEnabled:!!a.enabled});
    for(let i=0;i<50;i++){
      if((await obs.call('GetStudioModeEnabled')).studioModeEnabled===!!a.enabled) break;
      if(i===49) throw new Error('OBS no confirmó el Modo Estudio.');
      await new Promise(r=>setTimeout(r,80));
    }
  } else if (a.action==='speaker') {
    if (!tr.speakers.some(s=>s.id===a.speakerId)) throw new Error('Ponente inválido para este track.');
    state[t].speakerId=a.speakerId;
    if (state[t].visible) state[t].revision++;
  } else if (['show','hide','replay'].includes(a.action)) {
    state[t].visible=a.action!=='hide'; state[t].revision++;
  } else if (a.action==='motion') {
    state[t].motion=!!a.enabled;
  } else if (a.action==='banner') {
    if(typeof a.text!=='string'||a.text.length>140) throw new Error('El mensaje admite hasta 140 caracteres.');
    state[t].banner=a.text.trim(); state[t].bannerVisible=!!a.visible;
  } else if (a.action==='transition') {
    if (!['DevFest · Glifos','Desvanecimiento','Corte'].includes(a.name)) throw new Error('Transición inválida.');
    await obs.call('SetCurrentSceneTransition',{transitionName:a.name});
    for(let i=0;i<50;i++){
      if((await obs.call('GetCurrentSceneTransition')).transitionName===a.name) break;
      if(i===49) throw new Error('OBS no confirmó la transición seleccionada.');
      await new Promise(r=>setTimeout(r,80));
    }
    if (a.name==='Desvanecimiento') await obs.call('SetCurrentSceneTransitionDuration',{transitionDuration:300});
  } else if (a.action==='mute') {
    await obs.call('SetInputMute',{inputName:tr.audio,inputMuted:!!a.muted});
  } else if (a.action==='refresh') {
    const inputs=await obs.call('GetInputList');
    for (const i of inputs.inputs.filter(i=>i.inputKind==='browser_source')) await obs.call('PressInputPropertiesButton',{inputName:i.inputName,propertyName:'refreshnocache'});
  } else throw new Error('Acción no disponible.');
  persist();
}
async function status() {
  const c=await obs.call('GetSceneCollectionList');
  const tr=config.tracks.find(t=>t.collection===c.currentSceneCollectionName);
  const s=await obs.call('GetSceneList');
  const stream=await obs.call('GetStreamStatus'), rec=await obs.call('GetRecordStatus');
  const studio=await obs.call('GetStudioModeEnabled');
  const transition=(await obs.call('GetCurrentSceneTransition')).transitionName;
  let muted=true;
  if (tr) muted=(await obs.call('GetInputMute',{inputName:tr.audio})).inputMuted;
  return {version:config.version,connected:true,collection:c.currentSceneCollectionName,track:tr?.id,program:s.currentProgramSceneName,preview:s.currentPreviewSceneName,streaming:stream.outputActive,recording:rec.outputActive,studio:studio.studioModeEnabled,transition,muted,state};
}
const types={'.jpeg':'image/jpeg','.gif':'image/gif','.mp4':'video/mp4','.ttf':'font/ttf','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webm':'video/webm','.md':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try {
    if (![`127.0.0.1:${PORT}`,`localhost:${PORT}`].includes(req.headers.host)) return json(res,403,{error:'Acceso local requerido.'});
    const origin=req.headers.origin;
    const u=new URL(req.url,BASE);
    if (origin==='null' || origin===BASE || origin===`http://localhost:${PORT}` || (origin==='http://absolute' && req.method==='GET' && u.pathname==='/api/state')) res.setHeader('Access-Control-Allow-Origin',origin);
    if (req.method==='GET' && u.pathname==='/api/state') return json(res,200,state);
    if (req.method==='GET' && u.pathname==='/api/config') return json(res,200,config);
    if (req.method==='GET' && u.pathname==='/api/screenshot') {
      if (busy) return json(res,409,{error:'Operación en curso.'});
      const source=u.searchParams.get('scene');
      if (!config.tracks.some(t=>t.scenes.some(s=>s.name===source))) return json(res,400,{error:'Escena inválida.'});
      busy=true;try {return json(res,200,await obs.call('GetSourceScreenshot',{sourceName:source,imageFormat:'jpg',imageWidth:960,imageHeight:540,imageCompressionQuality:80}));}finally{busy=false;}
    }
    if (req.method==='GET' && u.pathname==='/api/status') {
      if (busy) return json(res,409,{connected:obs.connected,error:'Operación en curso.'});
      busy=true;try{return json(res,200,await status());}catch(e){return json(res,200,{connected:false,error:e.message,state});}finally{busy=false;}
    }
    if (req.method==='POST' && u.pathname==='/api/action') {
      if (origin!==BASE && origin!==`http://localhost:${PORT}`) return json(res,403,{error:'Abre el panel local para controlar OBS.'});
      if (!req.headers['content-type']?.startsWith('application/json')) return json(res,415,{error:'Formato inválido.'});
      let raw='';for await (const part of req) {raw+=part;if(raw.length>4096) return json(res,413,{error:'Petición demasiado grande.'});}
      if (busy) return json(res,409,{error:'Espera a que termine la operación anterior.'});
      busy=true; try{await action(JSON.parse(raw));return json(res,200,{ok:true,state});}finally{busy=false;}
    }
    if (req.method!=='GET') return json(res,405,{error:'Método no permitido.'});
    const rel=decodeURIComponent(u.pathname==='/'?'/07_Control/index.html':u.pathname);
    if (!/^\/(?:01_Identidad\/|02_Graficos\/|03_HTML\/|04_Transiciones\/|08_Guias\/|09_Pruebas\/|07_Control\/(?:index\.html|panel\.css|panel\.js)$)/.test(rel)) return json(res,404,{error:'Archivo no disponible.'});
    const file=path.resolve(ROOT,'.'+rel);
    if (!file.startsWith(ROOT+path.sep) || /(?:estado-local|servidor\.mjs|obs\.mjs)/.test(file) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res,404,{error:'Archivo no disponible.'});
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(res);
  }catch(e){json(res,400,{error:e.message});}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`El puerto ${PORT} ya está ocupado. Si el panel está abierto, úsalo; de lo contrario cambia DEVFEST_PORT.`:e.message);process.exit(1);});
server.listen(PORT,'127.0.0.1',()=>console.log(`Panel DevFest: ${BASE}`));
process.on('SIGINT',()=>{obs.close();server.close(()=>process.exit(0));});
