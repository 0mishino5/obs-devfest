import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT} from '../06_OBS/plataforma.mjs';

const manifest={};
function walk(dir) {
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    if(['.git','Grabaciones','Respaldos_locales','node_modules','stinger-frames','estado-local.json','estado-demo.json','MANIFIESTO_SHA256.json'].includes(entry.name)||/\.log$/i.test(entry.name))continue;
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file);
    else if(entry.isFile())manifest[path.relative(ROOT,file).replaceAll('\\','/')]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
}
walk(ROOT);
fs.writeFileSync(path.join(ROOT,'09_Pruebas/MANIFIESTO_SHA256.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Manifiesto SHA-256 actualizado: ${Object.keys(manifest).length} archivos.`);
