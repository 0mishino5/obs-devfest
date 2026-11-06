import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {ROOT,readJSON} from '../06_OBS/plataforma.mjs';
import {OBS} from '../07_Control/obs.mjs';

const base='http://127.0.0.1:8787',out=path.join(ROOT,'09_Pruebas/Revision_v8');
assert.equal((await(await fetch(base+'/api/config')).json()).demo,true);
const cases=[];
for(const track of readJSON(path.join(ROOT,'05_Datos/produccion.json')).tracks){
  for(const [page,scene]of Object.entries({inicio:'inicio',marco_mixta:'mixta',marco_camara:'camara',espera:'espera',almuerzo:'almuerzo',patrocinadores:'patrocinadores',problemas:'problemas',cierre:'cierre',marco_preguntas:'preguntas',proxima:'proxima'}))
    cases.push({url:'/03_HTML/t'+track.id+'_'+page+'.html?preview=1',scene,track:track.id});
  for(const speaker of track.speakers)cases.push({url:'/03_HTML/t'+track.id+'_marco_diapositivas.html?preview=1&speaker='+speaker.id,scene:'slides',track:track.id,name:speaker.name,topic:speaker.title||speaker.titleDraft||'Charla en curso'});
}
let receive;
const report=new Promise(resolve=>receive=resolve);
const server=http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin',base);
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'});res.end();return;}
  if(req.method!=='POST'||req.url!=='/report'){res.writeHead(404);res.end();return;}
  let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{try{receive(JSON.parse(body));res.end('OK');}catch{res.writeHead(400);res.end();}});
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const receiver='http://127.0.0.1:'+server.address().port+'/report';
const script=`
const cases=${JSON.stringify(cases)},receiver=${JSON.stringify(receiver)};
const frame=document.querySelector('iframe'),rows=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
(async()=>{
 for(const item of cases){
  const errors=[];
  try{
   await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Tiempo de carga')),8000);frame.onload=()=>{clearTimeout(timeout);resolve();};frame.src=item.url;});
   const doc=frame.contentDocument,win=frame.contentWindow;
   await doc.fonts.ready;await sleep(200);
   const q=s=>doc.querySelector(s),r=s=>q(s).getBoundingClientRect();
   const require=(test,message)=>{if(!test)errors.push(message);};
   const hero=['inicio','cierre','patrocinadores'].includes(item.scene);
   require(doc.querySelectorAll('.brand-event img,.event-hero img').length===1,'La marca debe aparecer una sola vez.');
   require(doc.querySelectorAll('.brand-partners').length===(item.scene==='patrocinadores'?0:1),'Cabecera de aliados redundante o ausente.');
   require(doc.querySelectorAll('.brand-event').length===(hero?0:1),'Jerarquía de marca incorrecta.');
   if(item.scene==='patrocinadores')require(doc.querySelectorAll('.partner-wall img').length===5,'Falta una marca en aliados.');
   const brand=q(hero?'.event-hero':'.brand-event'),style=win.getComputedStyle(brand);
   require(style.backgroundColor==='rgba(0, 0, 0, 0)'&&parseFloat(style.borderTopWidth)===0&&style.boxShadow==='none','La marca conserva una tarjeta.');
   if(item.scene==='slides'){
    require(q('[data-name]').textContent===item.name,'Nombre no corresponde al ponente.');
    require(q('[data-topic]').textContent===item.topic,'Tema no corresponde al ponente.');
    for(const selector of ['.session-person [data-name]','[data-topic]']){
     const el=q(selector);require(el.scrollWidth<=el.clientWidth+1,'Texto cortado: '+selector);
     require(parseFloat(win.getComputedStyle(el).fontSize)>=18,'Texto demasiado pequeño.');
    }
    require(!overlap(r('.brand-event'),r('.session-person')),'Logo y nombre se superponen.');
    require(!overlap(r('.brand-partners'),r('.session-person')),'Aliados y nombre se superponen.');
    require(!overlap(r('.brand-partners'),r('.session-topic')),'Aliados y tema se superponen.');
    require(r('.session-topic').bottom<=136,'Los metadatos tapan las diapositivas.');
   }
   if(['mixta','preguntas'].includes(item.scene))require(r('.room-card').bottom<314,'La sala invade la cámara.');
  }catch(e){errors.push(e.message);}
  rows.push({...item,errors});
 }
 await fetch(receiver,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(rows)});
})().catch(e=>fetch(receiver,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify([{errors:[e.message]}])}));
`;
fs.writeFileSync(path.join(out,'diagnostico-layout.html'),'<!doctype html><html><meta charset="utf-8"><style>html,body,iframe{margin:0;border:0;width:1920px;height:1080px;overflow:hidden}</style><iframe></iframe><script>'+script+'</script></html>');
const obs=new OBS({configDir:path.join(process.env.LOCALAPPDATA,'DevFestArequipa2026/OBS_Demo/config/obs-studio')});
const scene='RENDER · Revisión de espacios v8',inputName=scene+' · Navegador';let ownScene=false,ownInput=false,original,timer;
try{
  assert.equal((await obs.call('GetStreamStatus')).outputActive,false);
  assert.equal((await obs.call('GetRecordStatus')).outputActive,false);
  original=await obs.call('GetSceneList');
  await obs.call('CreateScene',{sceneName:scene});ownScene=true;
  await obs.call('CreateInput',{sceneName:scene,inputName,inputKind:'browser_source',inputSettings:{is_local_file:false,url:base+'/09_Pruebas/Revision_v8/diagnostico-layout.html',width:1920,height:1080,fps:30,shutdown:false,reroute_audio:false},sceneItemEnabled:true});ownInput=true;
  await obs.call('SetCurrentPreviewScene',{sceneName:scene});
  const rows=await Promise.race([report,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('El diagnóstico no respondió.')),60000);})]);
  fs.writeFileSync(path.join(out,'legibilidad.json'),JSON.stringify({date:new Date().toISOString(),renderer:'OBS Browser Source',cases:rows},null,2)+'\n');
  assert.equal(rows.length,cases.length);
  assert.deepEqual(rows.filter(r=>r.errors.length),[],'Fallo de legibilidad o coherencia.');
  console.log('35 casos en el navegador de OBS: marca única, cinco aliados y 15 nombres/temas completos, sin superposiciones.');
}finally{
  clearTimeout(timer);
  if(original?.currentPreviewSceneName)try{await obs.call('SetCurrentPreviewScene',{sceneName:original.currentPreviewSceneName});}catch{}
  if(ownInput)try{await obs.call('RemoveInput',{inputName});}catch{}
  if(ownScene)try{await obs.call('RemoveScene',{sceneName:scene});}catch{}
  obs.close();server.close();
  fs.unlinkSync(path.join(out,'diagnostico-layout.html'));
}
