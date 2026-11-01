(() => {
  const stage=document.getElementById('stage');
  if(!stage)return;
  const page=location.pathname.split('/').pop()||'';
  const track=Number(document.body.dataset.track||1);
  const isMessage=!!stage.querySelector('.message');
  const isMixed=!!stage.querySelector('.reference.cutout');
  const isWide=!!stage.querySelector('.wide');
  const suffix=page.replace(/^t[12]_/, '').replace(/\.html$/, '');
  const scene=document.body.dataset.scene||({
    marco_mixta:'mixta',marco_completa:'camara',marco_camara:'camara',
    marco_diapositivas:'slides',marco_preguntas:'preguntas'
  }[suffix]||suffix);
  const themes={
    inicio:{number:'01',base:'#c3ecf6',accent:'#4285f4',label:'Nos encontramos para construir'},
    mixta:{number:'02',base:'#f0f0f0',accent:'#4285f4',label:'En escena'},
    camara:{number:'03',base:'#4285f4',accent:'#ff7daf',label:'La voz de nuestra comunidad'},
    slides:{number:'04',base:'#ccf6c5',accent:'#34a853',label:'Ideas en pantalla'},
    preguntas:{number:'05',base:'#c3ecf6',accent:'#4285f4',label:'Preguntas y respuestas'},
    proxima:{number:'06',base:'#ffe7a5',accent:'#ffd427',label:'Una nueva idea está por comenzar'},
    espera:{number:'07',base:'#c3ecf6',accent:'#57caff',label:'Seguimos conectados'},
    almuerzo:{number:'08',base:'#ffd427',accent:'#ff7daf',label:'Un momento para recargar'},
    patrocinadores:{number:'09',base:'#1e1e1e',accent:'#ccf6c5',label:'Lo hacemos en comunidad'},
    problemas:{number:'10',base:'#f8d8d8',accent:'#ffe7a5',label:'Gracias por seguir aquí'},
    cierre:{number:'11',base:'#ccf6c5',accent:'#ffd427',label:'Lo que construimos nos conecta'}
  };
  const theme=themes[scene]||themes.mixta;
  document.body.dataset.visual='estudio-v5';
  document.body.dataset.scene=scene;
  document.body.classList.add(isMessage?'screen-page':isMixed?'mixed-page':isWide?'wide-page':'overlay-page');
  stage.style.setProperty('--scene-bg',theme.base);
  stage.style.setProperty('--accent',theme.accent);
  if(!isMessage&&!isMixed&&!isWide)return;

  // Los videos originales conservan su fondo #f0f0f0 en la escena 13.
  // Las demás pantallas usan el mismo kit gráfico, sin videos con un fondo diferente.
  stage.querySelector('.small-window')?.remove();
  const room=track===1?'R Grandote':'B';
  const header=document.createElement('header');header.className='brand-header';
  header.innerHTML='<div class="brand-event"><img src="../01_Identidad/oficial/devfest_2026.png" alt="DevFest 2026"><span>AREQUIPA</span></div><div class="brand-community"><img src="../01_Identidad/oficial/gdg_horizontal.png" alt="GDG Arequipa"><span>@gdgaqp</span></div>';
  stage.prepend(header);
  const spectrum=document.createElement('div');spectrum.className='brand-spectrum';spectrum.setAttribute('aria-hidden','true');
  spectrum.innerHTML='<i></i><i></i><i></i><i></i>';stage.prepend(spectrum);
  const holes=isWide?'M200 148H1720V996H200Z':isMixed?'M74 380H626V695H74Z M682 219H1864V861H682Z':'';
  const canvasPath='M0 0H1920V1080H0Z '+holes;
  const paints={
    inicio:'<path d="M1200 0H1920V1080H1450L1080 840Z" fill="#4285f4"/><circle cx="1780" cy="1040" r="350" fill="#57caff"/><path d="M0 884H1080V1080H0Z" fill="#ffe7a5"/>',
    mixta:'<rect x="34" y="190" width="616" height="738" rx="30" fill="#ffe7a5"/><rect x="650" y="188" width="1238" height="720" rx="30" fill="#c3ecf6"/>',
    camara:'<path d="M0 0H210V1080H0Z" fill="#c3ecf6"/><path d="M1720 0H1920V1080H1720Z" fill="#ff7daf"/>',
    slides:'<path d="M0 0H200V1080H0Z" fill="#5cdb6d"/><path d="M1720 0H1920V1080H1720Z" fill="#ffe7a5"/>',
    preguntas:'<rect x="34" y="190" width="616" height="738" rx="30" fill="#ccf6c5"/><rect x="650" y="188" width="1238" height="720" rx="30" fill="#ffe7a5"/>',
    proxima:'<path d="M1400 0H1920V1080H1400L1230 740Z" fill="#4285f4"/><rect x="96" y="246" width="1216" height="658" rx="34" fill="#1e1e1e"/><rect x="84" y="234" width="1216" height="658" rx="34" fill="#f0f0f0" stroke="#1e1e1e" stroke-width="3"/>',
    espera:'<rect x="302" y="252" width="1328" height="652" rx="80" fill="#1e1e1e"/><rect x="290" y="240" width="1328" height="652" rx="80" fill="#f0f0f0" stroke="#1e1e1e" stroke-width="3"/>',
    almuerzo:'<path d="M1420 0H1920V1080H1160Z" fill="#f8d8d8"/><rect x="96" y="236" width="1136" height="654" rx="36" fill="#1e1e1e"/><rect x="84" y="224" width="1136" height="654" rx="36" fill="#f0f0f0" stroke="#1e1e1e" stroke-width="3"/>',
    patrocinadores:'<rect x="1186" y="232" width="654" height="660" rx="42" fill="#ccf6c5"/><circle cx="1840" cy="980" r="190" fill="#ff7daf"/>',
    problemas:'<path d="M1420 0H1920V1080H1420Z" fill="#ffd427"/><rect x="108" y="252" width="1258" height="636" rx="34" fill="#1e1e1e"/><rect x="96" y="240" width="1258" height="636" rx="34" fill="#f0f0f0" stroke="#1e1e1e" stroke-width="3"/>',
    cierre:'<circle cx="70" cy="1040" r="340" fill="#ff7daf"/><circle cx="1840" cy="0" r="340" fill="#ffe7a5"/><rect x="302" y="252" width="1328" height="626" rx="64" fill="#1e1e1e"/><rect x="290" y="240" width="1328" height="626" rx="64" fill="#f0f0f0" stroke="#1e1e1e" stroke-width="3"/>'
  };
  const bg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  bg.setAttribute('viewBox','0 0 1920 1080');bg.setAttribute('class','broadcast-backdrop');bg.setAttribute('aria-hidden','true');
  bg.innerHTML='<defs><clipPath id="studio-frame-clip"><path clip-rule="evenodd" d="'+canvasPath+'"/></clipPath></defs><g clip-path="url(#studio-frame-clip)"><rect width="1920" height="1080" fill="'+theme.base+'"/>'+(paints[scene]||'')+'</g>';
  stage.prepend(bg);

  // Viewports del PNG transparente original del PowerPoint: no se redibujan los glifos.
  const atlas={
    brackets:[84,94,282,246],arrow:[414,92,342,214],slash:[776,94,310,316],
    semi:[1133,128,101,282],braces:[1314,94,314,316],arc:[1133,465,164,315],
    angle:[84,466,343,196],cloud:[473,466,583,213],quotes:[1344,500,253,80],
    line:[1343,667,252,80],equal:[1643,567,193,181],plus:[84,735,253,250],
    hash:[413,735,250,251],colon:[713,769,102,214],cross:[892,735,252,251],
    dots:[1193,872,375,112],blueplus:[1644,803,190,180]
  };
  const layouts={
    inicio:[['slash',1320,164,240,9],['brackets',1680,230,210,12],['braces',1550,565,275,-12],['angle',1120,600,280,-8],['blueplus',1090,177,110,-9],['dots',1230,895,310,0],['star',1760,45,95,0],['dot',1130,461,55,0]],
    mixta:[['slash',790,12,160,8],['angle',1075,48,155,0],['star',1335,54,80,0],['brackets',-112,210,150,-12],['hash',70,813,138,-6],['line',354,890,180,-12],['cross',1790,877,185,9],['dots',1020,913,200,0],['braces',1790,114,200,-8]],
    camara:[['cross',-70,680,240,10],['brackets',1750,465,195,-7],['dots',1775,920,140,0],['slash',800,-72,206,7],['star',48,182,100,0],['braces',1780,100,145,8]],
    slides:[['brackets',-70,280,235,-8],['brackets',1750,370,240,10],['arrow',1070,-22,200,0],['hash',38,812,124,-6],['cross',1775,780,190,0],['star',70,160,82,0]],
    preguntas:[['slash',970,12,160,6],['quotes',385,846,165,-6],['star',1265,48,95,0],['brackets',-112,213,150,-9],['hash',80,824,126,6],['blueplus',1788,875,190,10],['dots',1110,916,240,0]],
    proxima:[['arrow',1392,330,380,-10],['slash',1650,700,155,8],['cross',1290,160,125,-8],['brackets',-88,785,195,-10],['dots',1370,878,320,0],['star',1770,190,95,0]],
    espera:[['braces',30,365,230,-8],['braces',1668,410,230,9],['dots',770,748,350,0],['slash',1430,79,144,9],['star',425,137,95,0],['dot',185,815,60,0]],
    almuerzo:[['equal',1380,390,350,-12],['arc',1650,160,220,12],['blueplus',1210,780,180,-10],['hash',1230,172,155,8],['cloud',1260,714,460,3],['dots',625,912,240,0]],
    patrocinadores:[['hash',1320,338,385,-8],['dots',1280,755,450,0],['star',1742,170,90,0],['cross',-95,722,190,-8],['brackets',995,182,155,6],['blueplus',1050,862,140,8]],
    problemas:[['plus',1470,390,280,0],['line',1415,750,260,-10],['star',1745,190,100,0],['brackets',-90,562,175,-8],['dot',1440,218,50,0]],
    cierre:[['brackets',-30,255,255,-11],['slash',1480,-42,225,8],['cross',1650,690,255,-10],['arc',-110,690,220,0],['star',1730,190,120,0],['hash',90,45,150,-8],['arrow',1200,880,285,-4],['braces',1740,400,180,7]]
  };
  const floats=document.createElement('div');floats.className='floating-layer';floats.setAttribute('aria-hidden','true');
  floats.style.clipPath='path(evenodd, "'+canvasPath+'")';
  for(const [i,spec]of(layouts[scene]||[]).entries()){
    const [kind,x,y,width,angle]=spec;const crop=atlas[kind],height=crop?width*crop[3]/crop[2]:width;
    const el=document.createElement('div');el.className='floating-glyph glyph-'+kind;
    el.style.cssText='left:'+x+'px;top:'+y+'px;width:'+width+'px;height:'+height+'px;--angle:'+angle+'deg;--duration:'+(14+i%5*3)+'s;--delay:'+(-i*2.7)+'s';
    if(crop)el.innerHTML='<svg viewBox="'+crop.join(' ')+'" xmlns="http://www.w3.org/2000/svg"><image href="../01_Identidad/oficial/glifos_color.png" width="1920" height="1080"/></svg>';
    else if(kind==='star')el.innerHTML='<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 3V97M3 50H97M17 17L83 83M17 83L83 17" stroke="#1e1e1e" stroke-width="3.5"/></svg>';
    else el.innerHTML='<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="46" fill="#ea4335" stroke="#1e1e1e" stroke-width="5"/></svg>';
    floats.append(el);
  }
  stage.append(floats);

  if(isMixed){
    const card=document.createElement('div');card.className='room-card';
    card.innerHTML='<span class="room-kicker">'+(scene==='preguntas'?'PREGUNTAS Y RESPUESTAS':'TRACK '+String(track).padStart(2,'0')+' · EN ESCENA')+'</span><strong>Auditorio '+room+'</strong><span class="room-note">'+(scene==='preguntas'?'Abrimos la conversación':'Ideas que se comparten')+'</span>';stage.append(card);
    const edge=document.createElementNS('http://www.w3.org/2000/svg','svg');
    edge.setAttribute('viewBox','0 0 1920 1080');edge.setAttribute('class','frame-outlines');edge.setAttribute('aria-hidden','true');
    edge.innerHTML='<rect x="66" y="372" width="568" height="331" rx="14" fill="none" stroke="#1e1e1e" stroke-width="3"/><rect x="674" y="211" width="1198" height="658" rx="14" fill="none" stroke="#1e1e1e" stroke-width="3"/><path class="frame-accent" d="M684 211H850M1872 710V820M66 390V465" fill="none" stroke="#4285f4" stroke-width="7" stroke-linecap="round"/>';stage.append(edge);
  }
  if(isWide){
    const edge=document.createElement('div');edge.className='wide-edge';stage.append(edge);
    const badge=document.createElement('div');badge.className='wide-room';badge.textContent='Track '+track+' · Auditorio '+room;stage.append(badge);
    const label=document.createElement('div');label.className='wide-context';label.textContent=theme.label;stage.append(label);
  }
  if(isMessage){
    const lines={inicio:'DevFest<br>Arequipa 2026',espera:'Volvemos<br>en breve',almuerzo:'Pausa de<br>almuerzo',cierre:'Gracias por<br>acompañarnos',problemas:'Pausa<br>técnica',patrocinadores:'Gracias por<br>hacerlo posible'};
    const heading=stage.querySelector('.message h1');if(heading&&lines[scene])heading.innerHTML=lines[scene];
    const signature=document.createElement('div');signature.className='scene-signature';signature.innerHTML='<span>'+theme.number+'</span><b>'+theme.label+'</b>';stage.append(signature);
  }
})();
