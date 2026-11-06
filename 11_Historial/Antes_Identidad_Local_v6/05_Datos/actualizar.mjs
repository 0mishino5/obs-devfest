import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cfg=JSON.parse(fs.readFileSync(root+'/05_Datos/produccion.json'));
for(const t of cfg.tracks){
 if(![1,2].includes(t.id)||!Array.isArray(t.speakers))throw new Error('Datos de track inválidos.');
 for(const s of t.speakers)if(!/^t[12]-\d{2}$/.test(s.id)||typeof s.name!=='string'||s.name.length>100)throw new Error('Nombre o identificador de ponente inválido.');
}
for(const s of cfg.sponsors){
 if(!/^[\w.-]+\.(png|jpg|svg)$/i.test(s.file)||!fs.existsSync(root+'/01_Identidad/patrocinadores/'+s.file))throw new Error('No se encuentra el logo: '+s.file);
}
const p=root+'/03_HTML/graficos.js';const body=fs.readFileSync(p,'utf8');
fs.writeFileSync(p,body.replace(/^const CFG=.*?;const params=/s,()=> 'const CFG='+JSON.stringify(cfg).replaceAll('</','<\\/')+';const params='));
console.log('Nombres y patrocinadores sincronizados. Reinicia el panel y recarga los gráficos en OBS.');
