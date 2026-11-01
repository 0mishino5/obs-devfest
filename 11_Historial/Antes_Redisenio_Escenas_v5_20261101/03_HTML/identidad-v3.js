(() => {
  const stage=document.getElementById('stage');
  if(!stage)return;
  const page=location.pathname.split('/').pop() || '';
  const track=Number(document.body.dataset.track || 1);
  const isMessage=!!stage.querySelector('.message');
  const isMixed=!!stage.querySelector('.reference.cutout');
  const isWide=!!stage.querySelector('.wide');
  document.body.dataset.visual='estudio-v4';
  document.body.classList.add(isMessage?'screen-page':isMixed?'mixed-page':isWide?'wide-page':'overlay-page');
  if(!isMessage&&!isMixed&&!isWide)return;

  const room=track===1?'R Grandote':'B';
  const header=document.createElement('header');header.className='brand-header';
  header.innerHTML=`<div class="brand-event"><img src="../01_Identidad/oficial/devfest_2026.png" alt="DevFest 2026"><span>AREQUIPA</span></div><div class="brand-community"><img src="../01_Identidad/oficial/gdg_horizontal.png" alt="GDG Arequipa"><span>@gdgaqp</span></div>`;
  stage.prepend(header);
  const ribbon=document.createElement('div');ribbon.className='brand-spectrum';ribbon.setAttribute('aria-hidden','true');
  ribbon.innerHTML='<i></i><i></i><i></i><i></i>';stage.prepend(ribbon);

  function backdrop(wide=false) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 1920 1080');svg.setAttribute('class','broadcast-backdrop');svg.setAttribute('aria-hidden','true');
    const holes=wide?'M200 148H1720V996H200Z':isMixed?'M74 380H626V695H74Z M682 219H1864V861H682Z':'';
    svg.innerHTML=`<defs><pattern id="studio-dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#c8d3e2"/></pattern><clipPath id="studio-frame-clip"><path clip-rule="evenodd" d="M0 0H1920V1080H0Z ${holes}"/></clipPath></defs><g clip-path="url(#studio-frame-clip)"><rect width="1920" height="1080" fill="#f7f9fc"/><rect x="42" y="184" width="1838" height="742" fill="#fff"/><path d="M1490 0H1920V164H1770L1690 84H1490Z" fill="#eaf1ff"/><path d="M0 950H120L205 1035H510V1080H0Z" fill="#e8f3ed"/><path d="M1680 984h190v96h-190z" fill="url(#studio-dots)"/></g>`;
    stage.prepend(svg);
  }
  backdrop(isWide);

  if(isMixed){
    const card=document.createElement('div');card.className='room-card';
    card.innerHTML=`<span class="room-kicker">TRACK ${String(track).padStart(2,'0')}</span><strong>Auditorio ${room}</strong><div class="room-rule"><i></i><i></i><i></i><i></i></div>`;stage.append(card);
    const outlines=document.createElementNS('http://www.w3.org/2000/svg','svg');outlines.setAttribute('viewBox','0 0 1920 1080');outlines.setAttribute('class','frame-outlines');outlines.setAttribute('aria-hidden','true');
    outlines.innerHTML='<rect x="65" y="371" width="570" height="333" rx="16" fill="none" stroke="#cbd5e1" stroke-width="2"/><rect x="673" y="210" width="1200" height="660" rx="16" fill="none" stroke="#cbd5e1" stroke-width="2"/><path class="frame-accent" d="M76 371H196M673 222V312M1753 870H1873" fill="none" stroke="#4285f4" stroke-width="5" stroke-linecap="round"/><path d="M65 604V691Q65 704 78 704H160" fill="none" stroke="#34a853" stroke-width="4" stroke-linecap="round"/>';
    stage.append(outlines);
  }
  if(isWide){
    const edge=document.createElement('div');edge.className='wide-edge';stage.append(edge);
    const badge=document.createElement('div');badge.className='wide-room';badge.textContent=`Track ${track} · Auditorio ${room}`;stage.append(badge);
  }
  if(isMessage){
    const heading=stage.querySelector('.message h1');
    if(heading?.textContent==='DevFest Arequipa 2026')heading.innerHTML='DevFest<br>Arequipa 2026';
    if(page.includes('proxima'))document.body.classList.add('next-page');
    if(page.includes('problemas'))document.body.classList.add('technical-page');
    if(page.includes('cierre'))document.body.classList.add('closing-page');
  }
})();
