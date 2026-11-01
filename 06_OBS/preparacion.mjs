import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ROOT, readJSON, packagePlatform, assertHost, obsConfigDir, adaptCollection, copyTree} from './plataforma.mjs';

export function isOBSRunning(platform) {
  if (platform === 'windows') {
    const output = execFileSync('tasklist.exe', ['/FO','CSV','/NH'], {encoding:'utf8', windowsHide:true});
    return /^"obs(?:64|32)?\.exe",/im.test(output);
  }
  try { return !!execFileSync('/usr/bin/pgrep', ['-x','OBS'], {encoding:'utf8'}).trim(); }
  catch (e) { if (e.status === 1) return false; throw e; }
}

export function prepare({root = ROOT, platform = packagePlatform(root), install = false,
  portable = false, configDir = obsConfigDir({platform}), checkRunning = isOBSRunning} = {}) {
  const data = readJSON(path.join(root, '05_Datos/produccion.json'));
  function relocate(value, key = '') {
    if (Array.isArray(value)) return value.map(v => relocate(v));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,relocate(v,k)]));
    if (typeof value === 'string' && ['file','local_file','path'].includes(key)) {
      const m = value.replaceAll('\\','/').match(/(?:^|\/)((?:01_Identidad|02_Graficos|03_HTML|04_Transiciones)\/.*)$/);
      if (m) {
        const file = path.resolve(root, m[1]);
        if (!file.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(file)) throw new Error('Falta el recurso '+m[1]);
        return portable ? m[1] : file;
      }
    }
    return value;
  }
  // Validar todos los tracks antes de escribir o instalar cualquiera.
  const plans = data.tracks.map(t => {
    const name = `DEVFEST_2026_TRACK_${t.id}_1080p`;
    const collectionFile = path.join(root, '06_OBS/Colecciones', t.collection+'.json');
    return {t, name, collectionFile,
      collection:relocate(adaptCollection(readJSON(collectionFile), platform)),
      profile:path.join(root, '06_OBS/Perfiles', name),
      recording:path.join(root, 'Grabaciones', `Track_${t.id}`),
      targetScene:path.join(configDir, 'basic/scenes', t.collection+'.json'),
      targetProfile:path.join(configDir, 'basic/profiles', name)};
  });
  if (install) {
    assertHost(platform);
    if (checkRunning(platform)) throw new Error('Cierra OBS antes de instalar.');
    for (const p of plans) if (fs.existsSync(p.targetScene)) throw new Error(`Ya existe ${p.t.collection}. Se conserva; no se instaló ningún track. Usa la importación manual con un nombre nuevo.`);
  }
  for (const p of plans) {
    fs.writeFileSync(p.collectionFile, JSON.stringify(p.collection,null,2)+'\n');
    fs.mkdirSync(p.profile,{recursive:true});
    fs.mkdirSync(p.recording,{recursive:true});
    const recording = portable ? `Grabaciones/Track_${p.t.id}` : p.recording.replaceAll('\\','/');
    fs.writeFileSync(path.join(p.profile,'basic.ini'),`[General]\nName=${p.name}\n\n[Video]\nBaseCX=1920\nBaseCY=1080\nOutputCX=1920\nOutputCY=1080\nFPSType=0\nFPSCommon=30\nScaleType=bicubic\nColorFormat=NV12\nColorSpace=709\nColorRange=Partial\n\n[Audio]\nSampleRate=48000\nChannelSetup=Stereo\n\n[Output]\nMode=Simple\n\n[SimpleOutput]\nStreamEncoder=x264\nPreset=veryfast\nVBitrate=6000\nABitrate=160\nRecQuality=HQ\nRecFormat2=mkv\nRecTracks=1\nFilePath=${recording}\n\n[AdvOut]\nRecType=Standard\nRecFormat2=mkv\nRecTracks=1\nTrackIndex=1\n`);
    fs.writeFileSync(path.join(p.profile,'service.json'),JSON.stringify({type:'rtmp_custom',settings:{server:'',key:'',use_auth:false}},null,2)+'\n');
  }
  let backup;
  if (install) {
    if (fs.existsSync(configDir)) {
      backup = path.join(root,'Respaldos_locales',new Date().toISOString().replaceAll(':','-'));
      if (backup.startsWith(path.resolve(configDir)+path.sep)) throw new Error('La carpeta de respaldo no puede estar dentro de la configuración de OBS.');
      copyTree(configDir,backup);
    }
    const created = [];
    try {
      for (const p of plans) {
        fs.mkdirSync(path.dirname(p.targetScene),{recursive:true});
        fs.copyFileSync(p.collectionFile,p.targetScene,fs.constants.COPYFILE_EXCL);
        created.push(p.targetScene);
        if (!fs.existsSync(p.targetProfile)) {
          fs.mkdirSync(path.dirname(p.targetProfile),{recursive:true});
          fs.mkdirSync(p.targetProfile);
          created.push(p.targetProfile);
          copyTree(p.profile,p.targetProfile);
        }
      }
    } catch (e) {
      // Solo retirar archivos nuevos creados por esta instalación.
      for (const file of created.reverse()) fs.rmSync(file,{recursive:true,force:true});
      throw e;
    }
  }
  return {platform, tracks:plans.length, backup};
}
