let cfg,selected=1,current={},acting=false,ready=false,shot=0,view='program',initialized=false,polling=false,lastImage='',lastAction='';
const $=s=>document.querySelector(s), tr=()=>cfg.tracks.find(t=>t.id===selected), sleep=ms=>new Promise(r=>setTimeout(r,ms));
const controls=['speaker','show','hide','replay','motion','transition','refresh','mute','emergency','studio','banner','banner-visible','apply-banner','official','previous','next','audio-device','connect-audio','camera-device','connect-camera','meet-configure'];
let drafts={}, audioDrafts={}, cameraDrafts={};
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),6000);}
function draftKey(){return 'devfest-panel-drafts-'+cfg.instance;}
function saveDrafts(){try{sessionStorage.setItem(draftKey(),JSON.stringify(drafts));}catch{}}
function editBanner(){drafts[selected]={text:$('#banner').value,visible:$('#banner-visible').checked};saveDrafts();$('#banner-help').textContent='Cambios sin aplicar. Pulsa Aplicar mensaje para guardarlos.';$('#banner-help').classList.add('draft');}
function startHint(){return cfg?.platform==='windows'?(cfg.demo?'VER_DISENO_WINDOWS.cmd':'INICIAR_PANEL.cmd'):'INICIAR_PANEL.command';}
function clearImage(text='Actualizando imagen de OBS…'){$('#return').style.display='none';$('#empty-return').style.display='flex';$('#empty-return').textContent=text;lastImage='';}
function setView(v){view=v;shot=0;lastImage='';$('#view-program').classList.toggle('chosen',v==='program');$('#view-preview').classList.toggle('chosen',v==='preview');$('#view-program').setAttribute('aria-pressed',String(v==='program'));$('#view-preview').setAttribute('aria-pressed',String(v==='preview'));$('.screen').dataset.view=v;$('#view-title').textContent=v==='preview'?'2. Revisa antes de mostrar':'Programa actual';$('#view-help').textContent=v==='preview'?'Esta escena aún no cambia el programa. Revísala y pulsa Pasar al programa.':'Esta es la señal actual de OBS. Para preparar otro cambio, elige una escena.';clearImage();}
function lockControls(){const blocked=!ready||acting;for(const id of controls)$('#'+id).disabled=blocked;$('#track').disabled=acting;$('#take').disabled=blocked||!current.studio||!tr()?.scenes.some(s=>s.name===current.preview)||current.preview===current.program;$('#view-preview').disabled=!ready||!current.studio;$('#view-program').disabled=!ready;document.querySelectorAll('.scene').forEach(b=>b.disabled=blocked);if(current.audioConfigured===false&&current.muted!==false)$('#mute').disabled=true;$('#connect-audio').disabled=blocked||!(current.audioDevices||[]).some(d=>d.id===$('#audio-device').value);$('#connect-camera').disabled=blocked||!(current.cameraDevices||[]).some(d=>d.id===$('#camera-device').value);document.body.setAttribute('aria-busy',String(acting));}
const messages={'meet-configure':'En OBS, elige la ventana de Meet y pulsa Aceptar.',speaker:'Nombre seleccionado.',show:'Nombre preparado para las escenas de ponente.',hide:'Nombre oculto.',replay:'Entrada del nombre repetida.',motion:'Movimiento actualizado.',banner:'Mensaje aplicado.',transition:'Transición seleccionada.',mute:'Silencio de micrófono actualizado.', 'audio-connect':'Micrófono conectado y activo en las 13 escenas.','camera-connect':'Cámara conectada y ajustada en las escenas del ponente.',refresh:'Gráficos recargados.',studio:'Modo de trabajo actualizado.',take:'Escena confirmada en programa.'};
async function action(name,data={}){
  if(acting||!ready)return false;
  const trackId=selected;acting=true;lockControls();let ok=false;
  try{
    let response;
    for(let i=0;i<24;i++){response=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({track:trackId,action:name,...data}),signal:AbortSignal.timeout(name==='camera-connect'?30000:15000)});if(response.status!==409)break;await sleep(200);}
    const body=await response.json();if(!response.ok)throw Error(body.error||'OBS no confirmó la acción.');
    lastAction=name;if(name==='scene')setView(data.preview?'preview':'program');if(name==='take')setView('program');if(['camera-connect','meet-configure'].includes(name)&&current.studio)setView('preview');
    toast(name==='scene'?(data.preview?'Escena preparada. Revísala y pulsa Pasar al programa.':'Escena confirmada en programa.'):(messages[name]||'Cambio confirmado.'));shot=0;ok=true;
  }catch(error){toast(error.name==='TimeoutError'?'No se pudo confirmar el cambio a tiempo. Revisa el programa en OBS antes de repetir.':error.message);}
  finally{acting=false;await update();lockControls();}
  return ok;
}
function render(){
  const t=tr();$('#track').value=String(selected);$('#speaker-count').textContent=t.speakers.length+' nombres disponibles para pruebas';
  $('#speaker').replaceChildren(...t.speakers.map(s=>{const option=document.createElement('option');option.value=s.id;option.textContent=s.name;return option;}));
  $('#scenes').replaceChildren(...t.scenes.map((s,i)=>{const button=document.createElement('button');button.className='scene';button.dataset.scene=s.name;button.setAttribute('aria-label',s.name);const image=document.createElement('img');image.alt='';image.src='/02_Graficos/t'+selected+'_escena_'+s.name.slice(0,2)+'.png';image.loading='lazy';const label=document.createElement('span');label.className='scene-label';label.textContent=s.name;const state=document.createElement('span');state.className='scene-state';state.id='scene-state-'+i;button.setAttribute('aria-describedby',state.id);button.append(image,label,state);button.onclick=()=>action('scene',{scene:s.name,preview:!!current.studio});return button;}));
  shot=0;clearImage();
}
function sync(status){
  const previous=current;current=status;
  if(!initialized&&status.connected){initialized=true;if(status.track){selected=status.track;render();}setView(status.studio?'preview':'program');}
  ready=!!status.connected&&status.track===selected;
  $('#connection').textContent=status.connected?'OBS conectado':'OBS desconectado';$('#connection').className='badge'+(status.connected?'':' bad');
  $('#onair').textContent=status.streaming?(status.recording?'Emitiendo y grabando':'Emitiendo'):status.recording?'Grabación local':'Sin emisión';$('#onair').className='badge'+(status.streaming?' bad':' muted');
  $('#collection').textContent='Colección local: '+(status.collection||'—');$('#notice').classList.toggle('warn',!ready||!status.studio);
  $('#notice').textContent=!status.connected?(status.error||'Abre OBS y activa su servidor WebSocket.'):(status.track!==selected?'En OBS selecciona la colección «'+tr().collection+'»; después se habilitarán los controles.':status.studio?'Elige una escena → revisa Vista previa → pulsa Pasar al programa.':'Modo directo: al elegir una escena se cambia el programa inmediatamente. Activa Modo Estudio para revisar antes.');
  $('#scene-instruction').textContent=status.studio?'Un clic prepara la vista previa; después confirma el cambio.':'Modo directo: un clic muestra la escena inmediatamente.';
  $('#program-name').textContent=ready?'Programa: '+status.program:'Esperando la colección del auditorio';$('#preview-name').textContent='Vista previa: '+(ready&&status.preview?status.preview:'—');
  $('#studio').checked=!!status.studio;if(status.transition&&document.activeElement!==$('#transition'))$('#transition').value=status.transition;
  if(!status.studio&&view==='preview')setView('program');
  const prepared=ready&&tr().scenes.some(s=>s.name===status.preview)&&status.preview!==status.program;
  $('#take-help').textContent=!ready?'Conecta OBS y selecciona la colección de este auditorio.':!status.studio?'Los cambios son directos mientras Modo Estudio está desactivado.':!prepared?'Elige otra escena para preparar el siguiente cambio.':'Se mostrará «'+status.preview+'» con la transición elegida.';
  const step=lastAction==='take'&&view==='program'?3:prepared&&view==='preview'?2:1;
  for(const [id,n]of [['step-select',1],['step-preview',2],['step-take',3]])$('#'+id).classList.toggle('current',ready&&step===n);
  document.querySelectorAll('.scene').forEach(button=>{const program=ready&&status.program===button.dataset.scene,preview=ready&&status.studio&&status.preview===button.dataset.scene&&!program;button.classList.toggle('active',program);button.classList.toggle('preview',preview);button.querySelector('.scene-state').textContent=program?'EN PROGRAMA':preview?'PREPARADA':'';});
  const state=status.state?.[selected];if(state){$('#speaker').value=state.speakerId;$('#speaker-name').textContent=tr().speakers.find(p=>p.id===state.speakerId)?.name||'';const usesName=['02','03','05'].includes(status.program?.slice(0,2));$('#lower-status').textContent=state.visible?(usesName?'Nombre visible en el programa.':'Nombre preparado; se verá en cámara, composición mixta o preguntas.'):'Nombre oculto.';$('#motion').checked=state.motion!==false;const draft=drafts[selected];if(draft){$('#banner').value=draft.text;$('#banner-visible').checked=draft.visible;$('#banner-help').textContent='Cambios sin aplicar. Pulsa Aplicar mensaje para guardarlos.';$('#banner-help').classList.add('draft');}else{if(document.activeElement!==$('#banner'))$('#banner').value=state.banner||'';$('#banner-visible').checked=state.bannerVisible!==false;$('#banner-help').textContent='El texto y la casilla se guardan al pulsar Aplicar mensaje.';$('#banner-help').classList.remove('draft');}}
  const devices=status.audioDevices||[], remembered=state?.audioDeviceId;
  const preferred=audioDrafts[selected]||((status.audioDeviceId&&status.audioDeviceId!=='disabled')?status.audioDeviceId:remembered)||'';
  const sameName=devices.filter(d=>d.name===state?.audioDeviceName);
  const matched=devices.find(d=>d.id===preferred)||(!audioDrafts[selected]&&sameName.length===1?sameName[0]:null);
  const signature=JSON.stringify([devices,preferred,matched?.id]);
  if($('#audio-device').dataset.devices!==signature){
    const options=[Object.assign(document.createElement('option'),{value:'',textContent:'Selecciona tu micrófono'})];
    for(const d of devices)options.push(Object.assign(document.createElement('option'),{value:d.id,textContent:d.name}));
    if(preferred&&!matched)options.push(Object.assign(document.createElement('option'),{value:preferred,textContent:(state?.audioDeviceName||'Micrófono guardado')+' (desconectado)',disabled:true}));
    $('#audio-device').replaceChildren(...options);$('#audio-device').value=matched?.id||preferred;$('#audio-device').dataset.devices=signature;
  }
  $('#audio-status').textContent=!status.connected?'Esperando conexión con OBS.':!status.audioConfigured?(devices.length?'Elige tu micrófono y pulsa Conectar micrófono.':'Enchufa el micrófono para que aparezca aquí.'):(status.audioDeviceName+' · '+(status.muted?'Silenciado.':'Activo.')+(state?.audioSceneCount?' Configurado en '+state.audioSceneCount+' escenas.':''));
  $('#mute').textContent=status.muted?'Activar micrófono':'Silenciar micrófono';
  const cameras=status.cameraDevices||[], savedCamera=state?.cameraDeviceId;
  const wantedCamera=cameraDrafts[selected]||status.cameraDeviceId||savedCamera||'';
  const cameraNamesakes=cameras.filter(d=>d.name===state?.cameraDeviceName);
  const cameraMatch=cameras.find(d=>d.id===wantedCamera)||(!cameraDrafts[selected]&&cameraNamesakes.length===1?cameraNamesakes[0]:null);
  const cameraSignature=JSON.stringify([cameras,wantedCamera,cameraMatch?.id]);
  if($('#camera-device').dataset.devices!==cameraSignature){
    const options=[Object.assign(document.createElement('option'),{value:'',textContent:'Selecciona tu cámara'})];
    for(const d of cameras)options.push(Object.assign(document.createElement('option'),{value:d.id,textContent:d.name}));
    if(wantedCamera&&!cameraMatch)options.push(Object.assign(document.createElement('option'),{value:wantedCamera,textContent:(state?.cameraDeviceName||'Cámara guardada')+' (desconectada)',disabled:true}));
    $('#camera-device').replaceChildren(...options);$('#camera-device').value=cameraMatch?.id||wantedCamera;$('#camera-device').dataset.devices=cameraSignature;
  }
  $('#camera-status').textContent=!status.connected?'Esperando conexión con OBS.':status.cameraError?'Revisa la fuente de cámara en OBS.':status.cameraConfigured?(status.cameraDeviceName+' · Lista'+(state?.cameraWidth?' · '+state.cameraWidth+' × '+state.cameraHeight:'')+'. Encaje sin deformar.'):cameras.length?'Elige Cámara de iPhone y pulsa Conectar cámara.':'Conecta el iPhone para que aparezca aquí.';
  const video=status.video;$('#quality').textContent=!status.connected?'Salida de OBS: sin conexión.':video?`Salida OBS: ${video.width} × ${video.height} · ${Number(video.fps).toFixed(0)} FPS${status.activeFps?' · actual '+Number(status.activeFps).toFixed(1)+' FPS':''}`:'Salida de OBS: revisa resolución y FPS en OBS.';
  if(!ready)clearImage('Esperando la conexión y colección correctas de OBS.');else{const name=view==='preview'?status.preview:status.program;if(lastImage&&lastImage!==selected+':'+view+':'+name)clearImage();}
  lockControls();
}
async function update(){
  if(polling||!cfg)return;polling=true;
  try{
    const response=await fetch('/api/status',{signal:AbortSignal.timeout(10000)});if(response.status===409)return;if(!response.ok)throw Error('No se pudo leer OBS.');const status=await response.json();sync(status);
    if(ready&&!acting&&Date.now()-shot>2500){const scene=view==='preview'?status.preview:status.program;if(scene){shot=Date.now();const key=selected+':'+view+':'+scene;const result=await fetch('/api/screenshot?scene='+encodeURIComponent(scene),{signal:AbortSignal.timeout(10000)});if(result.ok&&key===selected+':'+view+':'+(view==='preview'?current.preview:current.program)){const image=await result.json();$('#return').src=image.imageData;$('#return').style.display='block';$('#empty-return').style.display='none';lastImage=key;}}}
  }catch{sync({connected:false,error:'No hay conexión con el panel. Abre '+startHint()+'. La página volverá a conectarse cuando esté disponible.',state:current.state});}
  finally{polling=false;}
}
async function init(){
  cfg=await(await fetch('/api/config',{signal:AbortSignal.timeout(6000)})).json();
  try{drafts=JSON.parse(sessionStorage.getItem(draftKey())||'{}');}catch{drafts={};}
  const query=Number(new URLSearchParams(location.search).get('track'));selected=[1,2].includes(query)?query:1;render();
  $('#track').onchange=e=>{selected=Number(e.target.value);lastAction='';history.replaceState(null,'','?track='+selected);render();sync(current);shot=0;};
  $('#meet-configure').onclick=()=>action('meet-configure');
  $('#camera-device').onchange=e=>{cameraDrafts[selected]=e.target.value;lockControls();};
  $('#connect-camera').onclick=async()=>{const id=selected;if(await action('camera-connect',{deviceId:$('#camera-device').value})){delete cameraDrafts[id];sync(current);}};
  $('#audio-device').onchange=e=>{audioDrafts[selected]=e.target.value;lockControls();};
  $('#connect-audio').onclick=async()=>{const id=selected;if(await action('audio-connect',{deviceId:$('#audio-device').value})){delete audioDrafts[id];sync(current);}};
  $('#speaker').onchange=e=>action('speaker',{speakerId:e.target.value});
  for(const [id,n]of [['previous',-1],['next',1]])$('#'+id).onclick=()=>{const list=tr().speakers,index=list.findIndex(p=>p.id===$('#speaker').value);action('speaker',{speakerId:list[(index+n+list.length)%list.length].id});};
  for(const name of ['show','hide','replay','refresh'])$('#'+name).onclick=()=>action(name);
  $('#studio').onchange=e=>action('studio',{enabled:e.target.checked});$('#take').onclick=()=>action('take');$('#motion').onchange=e=>action('motion',{enabled:e.target.checked});$('#transition').onchange=e=>action('transition',{name:e.target.value});$('#mute').onclick=()=>action('mute',{muted:!current.muted});
  $('#emergency').onclick=()=>action('scene',{scene:'10 · Problemas técnicos',preview:false});$('#official').onclick=()=>action('scene',{scene:'13 · Animación oficial DevFest',preview:!!current.studio});
  $('#banner').oninput=editBanner;$('#banner-visible').onchange=editBanner;
  $('#apply-banner').onclick=async()=>{const trackId=selected;if(await action('banner',{text:$('#banner').value,visible:$('#banner-visible').checked})){delete drafts[trackId];saveDrafts();sync(current);}};
  $('#view-program').onclick=()=>{setView('program');sync(current);update();};$('#view-preview').onclick=()=>{setView('preview');sync(current);update();};
  await update();setInterval(()=>{if(!acting)update();},1500);
}
async function boot(){try{await init();}catch{$('#notice').textContent='El panel local no responde. Abre INICIAR_PANEL.cmd en Windows o INICIAR_PANEL.command en Mac. Reintentando conexión…';$('#notice').classList.add('warn');setTimeout(boot,3000);}}
boot();
