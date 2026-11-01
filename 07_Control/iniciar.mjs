import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {ROOT, packagePlatform, assertHost} from '../06_OBS/plataforma.mjs';

assertHost();
const base = 'http://127.0.0.1:8787';
const instance = crypto.createHash('sha256').update(ROOT).digest('hex').slice(0,16);
function openBrowser() {
  if (process.argv.includes('--sin-navegador')) return;
  const command = process.platform === 'win32' ? 'rundll32.exe' : '/usr/bin/open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler',base] : [base];
  const child = spawn(command,args,{windowsHide:true,stdio:'ignore'});
  child.on('error',()=>console.log('Abre '+base+' en tu navegador.'));
  child.unref();
}
async function existing() {
  let res;
  try { res = await fetch(base+'/api/config',{signal:AbortSignal.timeout(1500)}); }
  catch (e) { if (e.cause?.code === 'ECONNREFUSED') return false; throw new Error('El puerto 8787 no responde. Revisa si otro panel lo está usando.'); }
  let cfg;
  try { cfg = await res.json(); } catch { throw new Error('El puerto 8787 pertenece a otro programa.'); }
  if (!res.ok || cfg.instance !== instance || cfg.platform !== packagePlatform() || !!cfg.demo !== (process.env.DEVFEST_DEMO === '1')) throw new Error('Hay otro panel usando el puerto 8787. Ciérralo antes de abrir esta carpeta o cambiar entre demo y operación.');
  return true;
}
try {
  if (await existing()) {
    console.log('Este panel ya está abierto: '+base);
    openBrowser();
  } else {
    const child = spawn(process.execPath,[path.join(ROOT,'07_Control/servidor.mjs')],{
      stdio:'inherit',windowsHide:true,env:{...process.env,DEVFEST_PORT:'8787'}
    });
    child.on('error',e=>{console.error(e.message);process.exitCode=1;});
    child.on('exit',code=>{process.exitCode=code ?? 1;});
    for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>child.kill(signal));
    for (let i=0;i<30;i++) {
      if (child.exitCode !== null) break;
      await new Promise(r=>setTimeout(r,150));
      try { if (await existing()) {openBrowser();break;} } catch {}
      if (i===29) {console.error('No se pudo abrir el panel. Revisa el mensaje del servidor.');child.kill();process.exitCode=1;}
    }
  }
} catch (e) {console.error(e.message);process.exitCode=1;}
