import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const install=process.argv.includes('--instalar');
const data=JSON.parse(fs.readFileSync(root+'/05_Datos/produccion.json'));
function relocate(value,key=''){
 if(Array.isArray(value))return value.map(x=>relocate(x));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,relocate(v,k)]));
 if(typeof value==='string'&&['file','local_file','path'].includes(key)){
  const m=value.replaceAll('\\','/').match(/(?:^|\/)((?:01_Identidad|02_Graficos|03_HTML|04_Transiciones)\/.*)$/);
  if(m){const p=path.join(root,m[1]);if(!fs.existsSync(p))throw new Error('Falta el recurso '+m[1]);return p;}
 }
 return value;
}
if(install){
 if(process.platform!=='darwin')throw new Error('La instalación automática es para macOS. Usa los JSON para importar en otro sistema.');
 let running=false;try{running=!!execFileSync('pgrep',['-x','OBS'],{encoding:'utf8'}).trim()}catch{}
 if(running)throw new Error('Cierra OBS antes de instalar. No se modificó tu configuración.');
 const obs=path.join(os.homedir(),'Library/Application Support/obs-studio');
 for(const t of data.tracks){
  const targets=[path.join(obs,'basic/scenes',`${t.collection}.json`),path.join(obs,'basic/profiles',`DEVFEST_2026_TRACK_${t.id}_1080p`)];
  if(fs.existsSync(targets[0]))throw new Error(`Ya existe una colección para Track ${t.id}. No se instaló ni reemplazó ninguno. Usa la importación manual con nombres nuevos.`);
 }
 const backup=path.join(root,'Respaldos_locales',new Date().toISOString().replaceAll(':','-'));
 if(fs.existsSync(obs))fs.cpSync(obs,backup,{recursive:true});
 console.log('Respaldo local: '+backup);
}
for(const t of data.tracks){
 const file=`${t.collection}.json`,p=path.join(root,'06_OBS/Colecciones',file);const c=relocate(JSON.parse(fs.readFileSync(p)));
 fs.writeFileSync(p,JSON.stringify(c,null,2));
 const name=`DEVFEST_2026_TRACK_${t.id}_1080p`,profile=path.join(root,'06_OBS/Perfiles',name);fs.mkdirSync(profile,{recursive:true});
 const recording=path.join(root,'Grabaciones',`Track_${t.id}`);fs.mkdirSync(recording,{recursive:true});
 fs.writeFileSync(profile+'/basic.ini',`[General]\nName=${name}\n\n[Video]\nBaseCX=1920\nBaseCY=1080\nOutputCX=1920\nOutputCY=1080\nFPSType=0\nFPSCommon=30\nScaleType=bicubic\nColorFormat=NV12\nColorSpace=709\nColorRange=Partial\n\n[Audio]\nSampleRate=48000\nChannelSetup=Stereo\n\n[Output]\nMode=Simple\n\n[SimpleOutput]\nStreamEncoder=x264\nPreset=veryfast\nVBitrate=6000\nABitrate=160\nRecQuality=HQ\nRecFormat2=mkv\nRecTracks=1\nFilePath=${recording}\n\n[AdvOut]\nRecType=Standard\nRecFormat2=mkv\nRecTracks=1\nTrackIndex=1\n`);
 fs.writeFileSync(profile+'/service.json',JSON.stringify({type:'rtmp_custom',settings:{server:'',key:'',use_auth:false}},null,2));
 if(install){
  const obs=path.join(os.homedir(),'Library/Application Support/obs-studio');
  const targets=[path.join(obs,'basic/scenes',file),path.join(obs,'basic/profiles',name)];
  if(fs.existsSync(targets[0]))throw new Error(`Ya existe una colección para Track ${t.id}. Se conserva. Importa los JSON manualmente con un nombre nuevo si lo necesitas.`);
  fs.mkdirSync(path.dirname(targets[0]),{recursive:true});fs.mkdirSync(path.dirname(targets[1]),{recursive:true});
  fs.copyFileSync(p,targets[0],fs.constants.COPYFILE_EXCL);if(!fs.existsSync(targets[1]))fs.cpSync(profile,targets[1],{recursive:true,errorOnExist:true,force:false}); else console.log('Perfil existente conservado: '+name);
  console.log(`Track ${t.id} instalado.`);
 }
}
console.log('Rutas preparadas. Selecciona la colección y el perfil del track en OBS.');
