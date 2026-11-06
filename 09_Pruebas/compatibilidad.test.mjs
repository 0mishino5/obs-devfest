import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,readJSON,obsConfigDir,hostPlatform,adaptCollection} from '../06_OBS/plataforma.mjs';
import {prepare} from '../06_OBS/preparacion.mjs';
import {OBS} from '../07_Control/obs.mjs';

function temporary(t) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'devfest-prueba-ñ '));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  return dir;
}
const original = id => {const track=readJSON(path.join(ROOT,'05_Datos/produccion.json')).tracks.find(t=>t.id===id);return readJSON(path.join(ROOT,'06_OBS/Colecciones',track.collection+'.json'));};
function fixture(t) {
  const root=temporary(t);
  for (const dir of ['05_Datos','06_OBS/Colecciones']) fs.mkdirSync(path.join(root,dir),{recursive:true});
  fs.copyFileSync(path.join(ROOT,'05_Datos/produccion.json'),path.join(root,'05_Datos/produccion.json'));
  function resources(v,k='') {
    if(Array.isArray(v))return v.forEach(x=>resources(x));
    if(v&&typeof v==='object')return Object.entries(v).forEach(([k,x])=>resources(x,k));
    if(typeof v==='string'&&['file','path','local_file'].includes(k)) {
      const m=v.replaceAll('\\','/').match(/(?:^|\/)((?:0[1-4]_[^/]+)\/.*)$/);
      if(m) {const f=path.join(root,m[1]);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,'recurso de prueba');}
    }
  }
  for(const id of [1,2]) {const c=original(id);resources(c);fs.writeFileSync(path.join(root,`06_OBS/Colecciones/${c.name}.json`),JSON.stringify(c));}
  return root;
}

test('rutas de OBS: macOS, APPDATA, alternativa y modo portátil explícito',()=>{
  assert.equal(obsConfigDir({platform:'macos',home:'/Users/prueba',env:{}}),path.join('/Users/prueba','Library/Application Support/obs-studio'));
  assert.equal(obsConfigDir({platform:'windows',home:'/usuario',env:{APPDATA:'/roaming'}}),path.join('/roaming','obs-studio'));
  assert.equal(obsConfigDir({platform:'windows',home:'/usuario',env:{}}),path.join('/usuario','AppData/Roaming/obs-studio'));
  assert.equal(obsConfigDir({platform:'windows',env:{DEVFEST_OBS_CONFIG_DIR:'portable/config/obs-studio'}}),path.resolve('portable/config/obs-studio'));
});

for(const platform of ['macos','windows']) for(const id of [1,2]) test(`${platform}: Track ${id}, tipos nativos, UUID y referencias intactos`,()=>{
  const base=original(id),c=adaptCollection(base,platform);
  assert.equal(c.sources.filter(s=>s.id==='scene').length,16);
  assert.deepEqual(c.sources.map(s=>s.uuid),base.sources.map(s=>s.uuid));
  const forbidden=platform==='windows'?['av_capture_input','screen_capture','coreaudio_input_capture']:['dshow_input','window_capture','wasapi_input_capture'];
  assert(c.sources.every(s=>!forbidden.includes(s.id)));
  assert.equal(c.sources.filter(s=>s.id===(platform==='windows'?'dshow_input':'av_capture_input')).length,3);
  const byUUID=new Map(c.sources.map(s=>[s.uuid,s]));
  for(const scene of c.sources.filter(s=>s.id==='scene')) for(const item of scene.settings.items) {
    assert.equal(byUUID.get(item.source_uuid)?.name,item.name);
  }
  assert.deepEqual(adaptCollection(c,platform),c,'Preparación idempotente');
  const audio=c.sources.find(s=>s.name===`T${id} · Audio de sala`);
  assert.equal(audio.settings.device_id,'disabled');assert.equal(audio.muted,true);
});

test('preparación portable y relocalización en una ruta con espacios y Unicode',t=>{
  const root=fixture(t),platform=hostPlatform();
  prepare({root,platform,portable:true});
  let c=readJSON(path.join(root,`06_OBS/Colecciones/${original(1).name}.json`));
  assert(c.sources.find(s=>s.id==='browser_source').settings.local_file.startsWith('03_HTML/'));
  prepare({root,platform});
  c=readJSON(path.join(root,`06_OBS/Colecciones/${original(1).name}.json`));
  assert(c.sources.find(s=>s.id==='browser_source').settings.local_file.startsWith(root));
});

test('instalación en configuración aislada: respaldo, perfil existente y duplicados',t=>{
  const root=fixture(t),configDir=path.join(temporary(t),'obs-studio'),platform=hostPlatform();
  const profile=path.join(configDir,'basic/profiles/DEVFEST_2026_TRACK_1_1080p');
  fs.mkdirSync(profile,{recursive:true});fs.writeFileSync(path.join(profile,'service.json'),'perfil anterior conservado');
  const result=prepare({root,platform,install:true,configDir,checkRunning:()=>false});
  assert.equal(fs.readFileSync(path.join(profile,'service.json'),'utf8'),'perfil anterior conservado');
  assert.equal(fs.readFileSync(path.join(result.backup,'basic/profiles/DEVFEST_2026_TRACK_1_1080p/service.json'),'utf8'),'perfil anterior conservado');
  const scene=path.join(configDir,`basic/scenes/${original(1).name}.json`),before=fs.readFileSync(scene);
  assert.throws(()=>prepare({root,platform,install:true,configDir,checkRunning:()=>false}),/Ya existe/);
  assert.deepEqual(fs.readFileSync(scene),before);
});

test('conflicto del segundo track impide instalar el primero; OBS abierto bloquea instalación',t=>{
  const root=fixture(t),configDir=path.join(temporary(t),'obs-studio'),platform=hostPlatform();
  fs.mkdirSync(path.join(configDir,'basic/scenes'),{recursive:true});
  fs.writeFileSync(path.join(configDir,`basic/scenes/${original(2).name}.json`),'colección anterior');
  assert.throws(()=>prepare({root,platform,install:true,configDir,checkRunning:()=>false}),/Ya existe/);
  assert(!fs.existsSync(path.join(configDir,`basic/scenes/${original(1).name}.json`)));
  assert.throws(()=>prepare({root,platform,install:true,configDir,checkRunning:()=>true}),/Cierra OBS/);
});

function obsFixture(t,overrides={}) {
  const configDir=temporary(t),dir=path.join(configDir,'plugin_config/obs-websocket');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'config.json'),JSON.stringify({server_enabled:true,server_port:14455,server_password:'contraseña-de-prueba',auth_required:true,...overrides}));
  return configDir;
}
class FakeWebSocket {
  static instances=[];
  constructor(url) {this.url=url;this.messages=[];FakeWebSocket.instances.push(this);queueMicrotask(()=>this.emit({op:0,d:{authentication:{salt:'sal',challenge:'reto'}}}));}
  emit(p) {this.onmessage?.({data:JSON.stringify(p)});}
  send(raw) {
    const p=JSON.parse(raw);this.messages.push(p);
    if(p.op===1)queueMicrotask(()=>this.emit({op:2,d:{negotiatedRpcVersion:1}}));
    if(p.op===6&&p.d.requestType!=='Timeout') queueMicrotask(()=>this.emit({op:7,d:{...p.d,requestStatus:{result:p.d.requestType!=='Fail',comment:'rechazado'},responseData:{obsVersion:'prueba'}}}));
  }
  close() {this.onclose?.({code:1000});}
}
test('WebSocket: autenticación desafío, llamadas, errores, cambio de colección y reconexión',async t=>{
  const obs=new OBS({configDir:obsFixture(t),WebSocketImpl:FakeWebSocket,requestTimeout:100});t.after(()=>obs.close());
  await Promise.all([obs.connect(),obs.connect()]);
  const ws=obs.ws;
  assert.equal(ws.url,'ws://127.0.0.1:14455');
  assert.equal(ws.messages.filter(p=>p.op===1).length,1);
  const secret=crypto.createHash('sha256').update('contraseña-de-pruebasal').digest('base64');
  assert.equal(ws.messages[0].d.authentication,crypto.createHash('sha256').update(secret+'reto').digest('base64'));
  assert.deepEqual(await obs.call('GetVersion'),{obsVersion:'prueba'});
  await assert.rejects(obs.call('Fail'),/rechazado/);
  await assert.rejects(obs.call('Timeout'),/Tiempo agotado/);
  ws.emit({op:5,d:{eventType:'CurrentSceneCollectionChanging'}});
  await assert.rejects(obs.call('GetVersion'),/cambiando/);
  ws.emit({op:5,d:{eventType:'CurrentSceneCollectionChanged'}});
  const pending=obs.call('Timeout');await new Promise(r=>setImmediate(r));ws.close();
  await assert.rejects(pending,/desconectó/);
  assert.equal(obs.pending.size,0);
  await obs.connect();assert.notEqual(obs.ws,ws);
});
test('WebSocket: configuración ausente, deshabilitada y puerto inválido',async t=>{
  await assert.rejects(new OBS({configDir:temporary(t)}).connect(),/Activa el servidor/);
  await assert.rejects(new OBS({configDir:obsFixture(t,{server_enabled:false})}).connect(),/Habilita/);
  await assert.rejects(new OBS({configDir:obsFixture(t,{server_port:70000})}).connect(),/Puerto/);
});
