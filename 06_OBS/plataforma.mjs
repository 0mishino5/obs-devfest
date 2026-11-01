import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
export const hostPlatform = platform => ({darwin:'macos', win32:'windows'})[platform ?? process.platform];

// Copia explícita: evita fallos nativos de fs.cpSync en algunas versiones de Node para Windows.
export function copyTree(from, to) {
  const stat = fs.lstatSync(from);
  if (stat.isSymbolicLink()) {
    fs.symlinkSync(fs.readlinkSync(from), to, fs.statSync(from).isDirectory() ? 'junction' : 'file');
  } else if (stat.isDirectory()) {
    fs.mkdirSync(to,{recursive:true});
    for (const entry of fs.readdirSync(from)) copyTree(path.join(from,entry),path.join(to,entry));
  } else {
    fs.mkdirSync(path.dirname(to),{recursive:true});
    fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
    if (process.platform !== 'win32') fs.chmodSync(to,stat.mode);
  }
}

export function packagePlatform(root = ROOT) {
  const file = path.join(root, 'plataforma.json');
  const platform = fs.existsSync(file) ? readJSON(file).platform : hostPlatform();
  if (!['macos', 'windows'].includes(platform)) throw new Error('Este paquete requiere macOS o Windows.');
  return platform;
}

export function assertHost(platform = packagePlatform()) {
  if (platform !== hostPlatform()) throw new Error(`Este paquete es para ${platform}. Abre la carpeta correspondiente a tu sistema.`);
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Instala Node.js 22 o superior.');
}

export function obsConfigDir({platform = packagePlatform(), env = process.env, home = os.homedir()} = {}) {
  if (env.DEVFEST_OBS_CONFIG_DIR) return path.resolve(env.DEVFEST_OBS_CONFIG_DIR);
  if (platform === 'macos') return path.join(home, 'Library', 'Application Support', 'obs-studio');
  if (platform === 'windows') return path.join(env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'obs-studio');
  throw new Error('Sistema no compatible.');
}

// Conservar UUID y referencias entre escenas al cambiar el tipo de fuente.
export function adaptCollection(original, platform) {
  if (!['macos', 'windows'].includes(platform)) throw new Error('Plataforma inválida.');
  const c = structuredClone(original), renames = new Map();
  for (const s of c.sources) {
    if (['av_capture_input','dshow_input'].includes(s.id) && s.id !== (platform === 'windows' ? 'dshow_input' : 'av_capture_input')) {
      s.id = platform === 'windows' ? 'dshow_input' : 'av_capture_input';
      s.versioned_id = platform === 'windows' ? s.id : 'av_capture_input_v2';
      s.settings = platform === 'windows'
        ? {video_device_id:'', res_type:0, active:true, use_custom_audio_device:false, audio_output_mode:0}
        : {uid:'', use_preset:true, preset:'AVCaptureSessionPreset1920x1080', enable_audio:false};
      s.mixers = 0;
    } else if (['coreaudio_input_capture','wasapi_input_capture'].includes(s.id) && s.id !== (platform === 'windows' ? 'wasapi_input_capture' : 'coreaudio_input_capture')) {
      s.id = platform === 'windows' ? 'wasapi_input_capture' : 'coreaudio_input_capture';
      s.versioned_id = s.id;
      s.settings = {device_id:'disabled'};
      s.muted = true;
    } else if (['screen_capture','window_capture'].includes(s.id) && s.id !== (platform === 'windows' ? 'window_capture' : 'screen_capture')) {
      s.id = platform === 'windows' ? 'window_capture' : 'screen_capture';
      s.versioned_id = s.id;
      s.settings = platform === 'windows'
        ? {window:'', method:0, cursor:false, capture_audio:false, client_area:true}
        : {capture_audio:false, type:1, window:0, show_cursor:false, hide_obs:true};
      s.mixers = 0;
    }
    if (/ · Diapositivas (?:macOS|Windows) · configurar$/.test(s.name)) {
      const old = s.name;
      s.name = s.name.replace(/(?:macOS|Windows)(?= · configurar$)/, platform === 'windows' ? 'Windows' : 'macOS');
      renames.set(old, s.name);
    }
  }
  function rename(value) {
    if (Array.isArray(value)) return value.map(rename);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,rename(v)]));
    return typeof value === 'string' ? renames.get(value) ?? value : value;
  }
  return rename(c);
}
