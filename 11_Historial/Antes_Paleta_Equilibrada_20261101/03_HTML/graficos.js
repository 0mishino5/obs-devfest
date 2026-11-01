const CFG={"event": "DevFest Arequipa 2026", "organizer": "GDG Arequipa", "social": "@gdgaqp", "width": 1920, "height": 1080, "fps": 30, "tracks": [{"id": 1, "auditorio": "R Grandote", "collection": "DEVFEST_AREQUIPA_2026_TRACK_1_MARCA", "audio": "T1 · Audio de sala", "speakers": [{"id": "t1-01", "name": "Brian Benjamin Pareja Meruvia", "time": "09:15", "titleDraft": "De Unity a Android XR: migrando una plataforma de entrenamiento industrial"}, {"id": "t1-02", "name": "Angelica Oliveira", "time": "09:50", "titleDraft": "Workshop De Stitch a Studio: Flujo de desarrollo Android completo asistido por IA"}, {"id": "t1-03", "name": "Sebastian Antonio Riveros Carbajal", "time": "10:45", "titleDraft": "EL USO LAS HERRAMIENTAS DE IA PARA PROGRAMACION"}, {"id": "t1-04", "name": "Cristians Alberto Bregante Tintaya", "time": "11:20", "titleDraft": "Build with Modern Web Guidance"}, {"id": "t1-05", "name": "Christian Benjamín Flores Copa", "time": "13:25", "titleDraft": "Como construir un sistema de evals productivo para agentes de IA"}, {"id": "t1-06", "name": "Yancel Salinas", "time": "15:00", "titleDraft": "Descubre cómo Google Cloud te ayuda a encontrar qué tool MCP le está costando tiempo a tu agente"}, {"id": "t1-07", "name": "Cristhian Taipe", "time": "15:35", "titleDraft": "¿Qué tan fácil es hackear tu aplicación?"}], "scenes": [{"name": "01 · Bienvenida", "key": "inicio"}, {"name": "02 · Diapositivas + ponente", "key": "mixta"}, {"name": "03 · Cámara del ponente", "key": "camara"}, {"name": "04 · Diapositivas completas", "key": "slides"}, {"name": "05 · Preguntas y respuestas", "key": "preguntas"}, {"name": "06 · Próxima charla", "key": "proxima"}, {"name": "07 · Espera", "key": "espera"}, {"name": "08 · Almuerzo", "key": "almuerzo"}, {"name": "09 · Patrocinadores", "key": "patrocinadores"}, {"name": "10 · Problemas técnicos", "key": "problemas"}, {"name": "11 · Cierre", "key": "cierre"}, {"name": "12 · Diapositivas limpias", "key": "limpias"}, {"name": "13 · Animación oficial DevFest", "key": "oficial"}]}, {"id": 2, "auditorio": "B", "collection": "DEVFEST_AREQUIPA_2026_TRACK_2_MARCA", "audio": "T2 · Audio de sala", "speakers": [{"id": "t2-01", "name": "Nelzon Jorge Apaza Apaza", "time": "09:15", "titleDraft": "Viaje a otra dimensión analítica: Un recorrido por el presente y futuro de Immersive Analytics"}, {"id": "t2-02", "name": "Jose Flores Chamba", "time": "10:10", "titleDraft": "Tu web ya no habla con humanos: bienvenido a WebMCP"}, {"id": "t2-03", "name": "Mayra Rodriguez", "time": "10:45", "titleDraft": "From Chaos to Control: Diseñando AIs que divaguen menos y ejecuten más"}, {"id": "t2-04", "name": "Shirley Ramos", "time": "11:20", "titleDraft": "No More Lorem Ipsum: CSS para interfaces con contenido generado por IA"}, {"id": "t2-05", "name": "Jose Luis Monroy Vilcahuaman", "time": "13:45", "titleDraft": "El Futuro de la Calidad de Software"}, {"id": "t2-06", "name": "Henry Keniding Tarazona Lazaro", "time": "14:20", "titleDraft": "ADK en acción: Crea tu primer agente y orquesta flujos agénticos"}, {"id": "t2-07", "name": "Homer Lopez Vidal", "time": "14:55", "titleDraft": "Del Vibe Coding al SDD: Cómo construir Web Apps robustas con Firebase Genkit, Gemini y Devin"}, {"id": "t2-08", "name": "Diego Alonso", "time": "15:30", "titleDraft": "Google Cloud, Gemini, MCP, N8N para flujos automáticos"}], "scenes": [{"name": "01 · Bienvenida", "key": "inicio"}, {"name": "02 · Diapositivas + ponente", "key": "mixta"}, {"name": "03 · Cámara del ponente", "key": "camara"}, {"name": "04 · Diapositivas completas", "key": "slides"}, {"name": "05 · Preguntas y respuestas", "key": "preguntas"}, {"name": "06 · Próxima charla", "key": "proxima"}, {"name": "07 · Espera", "key": "espera"}, {"name": "08 · Almuerzo", "key": "almuerzo"}, {"name": "09 · Patrocinadores", "key": "patrocinadores"}, {"name": "10 · Problemas técnicos", "key": "problemas"}, {"name": "11 · Cierre", "key": "cierre"}, {"name": "12 · Diapositivas limpias", "key": "limpias"}, {"name": "13 · Animación oficial DevFest", "key": "oficial"}]}], "sponsors": [], "version": "marca-2026-v2", "localOnly": true, "animations": [{"id": "oficial", "name": "DevFest 2026 · Animación oficial", "file": "04_Transiciones/Oficiales/DF26_URL.mp4", "onAir": true}]};const params=new URLSearchParams(location.search);
const track=Number(params.get('track')||document.body.dataset.track||1);
const tr=CFG.tracks.find(t=>t.id===track)||CFG.tracks[0];
const stage=document.getElementById('stage');
const lower=document.querySelector('.lower');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const local=params.get('speaker')||document.body.dataset.speaker;
const preview=params.get('preview')==='1';
let lastRevision=-1,lastName='',lastBanner=null,lastBannerVisible=null,lastMotion=null,requestedMotion=true,wasVisible=false,timer;
function resize(){const scale=Math.min(innerWidth/1920,innerHeight/1080);stage.style.transform=`scale(${scale})`;}
addEventListener('resize',resize);resize();
for(const n of document.querySelectorAll('[data-room]'))n.textContent=`Track ${tr.id} · Auditorio ${tr.auditorio}`;
const room=document.querySelector('.room-card strong');if(room)room.textContent=`Auditorio ${tr.auditorio}`;
const wideRoom=document.querySelector('.wide-room');if(wideRoom)wideRoom.textContent=`Track ${tr.id} · Auditorio ${tr.auditorio}`;
function fit(n,start,min){if(!n)return;n.style.fontSize=start+'px';while(n.scrollWidth>n.clientWidth+1&&parseFloat(n.style.fontSize)>min)n.style.fontSize=(parseFloat(n.style.fontSize)-1)+'px';}
function fitText(){if(lower)fit(lower.querySelector('.name'),lower.classList.contains('compact')?32:42,21);for(const n of document.querySelectorAll('[data-banner]'))fit(n,30,21);}
function motion(enabled){requestedMotion=enabled!==false;const moving=requestedMotion&&!reduced.matches;if(lastMotion===moving)return;lastMotion=moving;document.body.classList.toggle('still',!moving);for(const video of document.querySelectorAll('video')){if(moving)video.play().catch(()=>{});else video.pause();}}
function apply(s){
  if(!s)return;
  motion(s.motion);
  const person=tr.speakers.find(p=>p.id===s.speakerId)||tr.speakers[0];
  if(lastName!==person.name){lastName=person.name;for(const n of document.querySelectorAll('[data-name]'))n.textContent=person.name;fitText();}
  if(lower){
    const visible=!!s.visible;
    if(visible&&(!wasVisible||s.revision!==lastRevision)){
      lower.classList.remove('visible');void lower.offsetWidth;lower.classList.add('visible');
    }else if(!visible&&wasVisible)lower.classList.remove('visible');
    wasVisible=visible;lastRevision=s.revision;
  }
  const text=s.banner??'GDG Arequipa · @gdgaqp · #DevFestArequipa2026';
  const visible=s.bannerVisible!==false;
  if(text!==lastBanner||visible!==lastBannerVisible){
    for(const n of document.querySelectorAll('[data-banner]')){n.textContent=text;n.classList.toggle('hidden',!visible);n.classList.remove('updated');if(visible){void n.offsetWidth;n.classList.add('updated');}fit(n,30,21);}
    lastBanner=text;lastBannerVisible=visible;
  }
}
const initial={speakerId:local||tr.speakers[0].id,visible:!!(local||preview),revision:1,motion:true,bannerVisible:true};
apply(initial);
document.fonts.ready.then(fitText);
reduced.addEventListener('change',()=>{lastMotion=null;motion(requestedMotion);});
if(!local&&!preview){
  async function poll(){let delay=400;try{const r=await fetch('http://127.0.0.1:8787/api/state',{cache:'no-store',signal:AbortSignal.timeout(1400)});if(!r.ok)throw Error('estado');apply((await r.json())[tr.id]);}catch{if(lower){lower.classList.remove('visible');wasVisible=false;}delay=1500;}timer=setTimeout(poll,delay);}
  poll();
}
addEventListener('pagehide',()=>clearTimeout(timer));
const sponsors=document.querySelector('.sponsors');
if(sponsors)for(const sponsor of CFG.sponsors){if(!sponsor.file||!/^[\w.-]+\.(png|jpg|svg)$/i.test(sponsor.file))continue;const img=document.createElement('img');img.src='../01_Identidad/patrocinadores/'+sponsor.file;img.alt=sponsor.name;img.decoding='async';sponsors.append(img);}
