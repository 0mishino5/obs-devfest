import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),cfg=JSON.parse(fs.readFileSync(root+'/05_Datos/produccion.json'));let references=0;
function check(o,key=''){if(Array.isArray(o))return o.forEach(x=>check(x));if(o&&typeof o==='object')return Object.entries(o).forEach(([k,v])=>check(v,k));if(typeof o==='string'&&['file','path','local_file'].includes(key)){const m=o.replaceAll('\\','/').match(/(?:^|\/)(0[1-4]_[^/]+\/.*)$/);if(m){assert(fs.existsSync(path.join(root,m[1])),m[1]);references++}}}
assert.equal(cfg.width,1920);assert.equal(cfg.height,1080);assert.equal(cfg.tracks.flatMap(t=>t.speakers).length,15);
for(const t of cfg.tracks){assert.equal(t.scenes.length,13);const c=JSON.parse(fs.readFileSync(root+`/06_OBS/Colecciones/${t.collection}.json`));assert.equal(c.name,t.collection);check(c);for(const s of t.scenes){assert(c.sources.some(x=>x.id==='scene'&&x.name===s.name),s.name);const file=root+`/02_Graficos/t${t.id}_escena_${s.name.slice(0,2)}.png`,b=fs.readFileSync(file);assert.equal(b.readUInt32BE(16),1920);assert.equal(b.readUInt32BE(20),1080);assert(b.length>10000,'Captura vacía: '+file)}for(const s of t.speakers)assert(fs.existsSync(root+`/03_HTML/t${t.id}_ponente_${s.id}.html`));const p=JSON.parse(fs.readFileSync(root+`/06_OBS/Perfiles/DEVFEST_2026_TRACK_${t.id}_1080p/service.json`));assert.equal(p.settings.key,'');assert.equal(p.settings.server,'')}
for(const f of ['DF26_URL.mp4','DF26_SaveTheDate.mp4','DF26_MakeNewFriends.mp4','DF26_JoinUs.mp4'])assert(fs.statSync(root+'/04_Transiciones/Oficiales/'+f).size>1000000);
console.log(`OK: 2 colecciones, 26 escenas, 15 rótulos, ${references} rutas, 26 capturas 1080p y 4 videos oficiales. Perfiles del paquete sin claves.`);
if(process.argv.includes('--hashes')) {
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'09_Pruebas/MANIFIESTO_SHA256.json')));
  for(const [file,expected] of Object.entries(manifest))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),expected,file);
  console.log(`OK: SHA-256 de ${Object.keys(manifest).length} archivos.`);
}
