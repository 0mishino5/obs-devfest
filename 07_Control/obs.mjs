import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';

export class OBS {
  constructor() { this.pending = new Map(); this.connected = false; this.counter = 0; }
  async connect() {
    if (this.connected) return;
    if (this.connecting) return this.connecting;
    this.connecting = new Promise((resolve, reject) => {
      let cfg;
      try { cfg = JSON.parse(fs.readFileSync(os.homedir() + '/Library/Application Support/obs-studio/plugin_config/obs-websocket/config.json')); }
      catch { reject(new Error('Activa el servidor WebSocket en Herramientas de OBS.')); return; }
      const ws = this.ws = new WebSocket(`ws://127.0.0.1:${cfg.server_port || 4455}`);
      const timer = setTimeout(() => { ws.close(); reject(new Error('OBS no responde. Abre OBS y activa WebSocket.')); }, 6000);
      ws.onmessage = ({data}) => {
        const p = JSON.parse(data);
        if (p.op === 0) {
          const a = p.d.authentication;
          const authentication = a ? crypto.createHash('sha256').update(crypto.createHash('sha256').update(cfg.server_password + a.salt).digest('base64') + a.challenge).digest('base64') : undefined;
          ws.send(JSON.stringify({op:1,d:{rpcVersion:1,authentication,eventSubscriptions:2}}));
        } else if (p.op === 2) { clearTimeout(timer); this.connected = true; this.changing=false; resolve(); }
        else if (p.op === 5) {
          if (['CurrentSceneCollectionChanging','CurrentProfileChanging'].includes(p.d.eventType)) this.changing=true;
          if (['CurrentSceneCollectionChanged','CurrentProfileChanged'].includes(p.d.eventType)) this.changing=false;
        } else if (p.op === 7) {
          const q = this.pending.get(p.d.requestId);
          if (!q) return;
          this.pending.delete(p.d.requestId); clearTimeout(q.timer);
          p.d.requestStatus.result ? q.resolve(p.d.responseData || {}) : q.reject(new Error(`${p.d.requestType}: ${p.d.requestStatus.comment || p.d.requestStatus.code}`));
        }
      };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('No se pudo conectar con OBS en esta Mac.')); };
      ws.onclose = () => {
        clearTimeout(timer); this.connected = false; this.connecting = null;
        for (const q of this.pending.values()) { clearTimeout(q.timer); q.reject(new Error('OBS se desconectó.')); }
        this.pending.clear(); reject(new Error('OBS cerró la conexión.'));
      };
    });
    try { await this.connecting; } catch (e) { this.connecting = null; throw e; }
  }
  async call(requestType, requestData = {}) {
    await this.connect();
    if (this.changing) throw new Error('OBS está cambiando de colección o perfil. Espera un momento.');
    const requestId = String(++this.counter);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(requestId); reject(new Error(`Tiempo agotado: ${requestType}`)); }, 7000);
      this.pending.set(requestId, {resolve, reject, timer});
      this.ws.send(JSON.stringify({op:6,d:{requestType,requestId,requestData}}));
    });
  }
  close() { this.ws?.close(); }
}
