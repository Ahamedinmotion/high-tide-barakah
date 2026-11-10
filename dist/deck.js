/* Full-screen deck navigation, interactive exhibits and presenter tools. */
window.addEventListener('DOMContentLoaded', () => {
  const { slides, source, talkTrack } = window.HighTideContent;
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const evidence = $('evidence');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, displayed = -1, destroyMolecule = () => {};
  let evidenceInvoker;
  const questions = [
    ['Why another bubble system?', 'The corridor compares several methods and only counts an exit if animals clear the intake area. The biochemical program tests whether we can add a measured directional response. Published bubble experiments justify testing, and Barakah calibration determines what works.', ['bubble']],
    ['Does the molecule repel jellyfish?', 'In a contact assay, Japanese sea nettles held treated dried krill for less time. We propose a blinded directional test in identified local adults. We need evidence of sustained movement and recovery, not simply a feeding or stress response.', ['chemistry', 'molecule']],
    ['Why think chemicals can guide any medusa?', 'In a two-inflow aquarium, moon jellies favored the side supplied with water that had held brine shrimp (Artemia). It motivates an attraction arm with matched flow. The active compound and response in Catostylus remain unknown.', ['preference']],
    ['How do you isolate behavior from water movement?', 'Map flow in both arms first, match temperature and salinity, alternate the cue side, use a vehicle blank and score video blind. Subtract measured water velocity from animal motion. Compare a spatial gradient with uniform exposure and record nonchoices.', ['chemistry']],
    ['What about fish, larvae, corals and other species?', 'We have no local dose-response margin yet. A marine partner would select non-target endpoints and test at measured exposures in a contained system. A repeatable target response, recovery, no unacceptable non-target effects and proven effluent containment are gates for any next stage.', ['chemistry', 'faq']],
    ['Is the chemistry necessary for the physical corridor?', 'The physical corridor has its own controls, tests and stop conditions. If the cue fails on direction, selectivity or containment, the chemical workstream stops and physical development can continue.', []],
    ['Where exactly does it go?', 'The first candidate zone is the marine approach before stronger intake capture. A breakwater edge may support a route if the current carries animals clear across operating states. ENEC bathymetry, permitted work areas and exit recirculation measurements would determine placement.', ['dredge', 'cooling', 'faq']],
    ['How much air does the curtain need?', 'We size from active length times measured air flow per metre, at the pressure needed for water depth plus line and diffuser losses. Measure the airflow per metre in the flume, then size from verified active length, water depth, line losses and vendor free-air delivery curves.', ['air','bubble']],
    ['How will you measure animal survival?', 'Compare body condition, pulsation, recovery and delayed survival in matched handling and diversion trials. Include a separate non-target assessment with a marine partner.', []],
    ['What happens when the current reverses or an exit closes?', 'Use only an independently checked route within the tested operating envelope. Compare a delayed switch, closed exit and power loss in the simulator. If clearance cannot be verified, stop actuation and leave the response to existing operator procedures.', []],
    ['What is the source for 200 tons per day?', 'An ENEC mentor cited a historical load of around 200 tons per day in the 30 October discussion. The figure motivates continuous clearance and logging retention alongside arrivals. Hourly records and a confirmed weighing basis would let us size the physical test.', []],
    ['Can we use temperature to steer them?', 'First distinguish preference from changes in movement or survival and from density-driven currents. Temperature belongs in a controlled assay matrix. A 1 °C change at 1 m³/s would take about 4.1 MW thermal before losses, which gives the scale of the open-water idea.', ['water', 'currents']],
    ['What is physically built?', 'The submitted High Tide prototype is a runnable transport simulation with reproducible scenario outputs. A measured flume and a species-specific behavioral trial are separate next stages. The comparison uses common flow settings and seeds; the CSV includes all 165 runs.', ['original']],
    ['What will it cost?', 'We’d price the instrumented flume and contained lab work separately with partners. A marine estimate would use measured air duty, actual deployment length and quotes for equipment, marine work, maintenance and recovery.', []],
    ['What species does High Tide target?', 'The ENEC brief names blue blubber jellyfish, Catostylus mosaicus, with a 30–45 cm bell. We size the test for that target; a marine partner documents the specimens used.', ['brief', 'taxonomy']],
    ['How do you prove performance to ENEC?', 'Agree an operating envelope and minimum acceptable improvement first. Compare no actuation, the physical options, and eventually cue plus physical against physical alone in containment. Score verified exits, returns, intake entries, retention, water supply, welfare, energy and maintenance.', ['bubble', 'original']],
    ['What is the failure condition for a site trial?', 'An unsuitable exit, accumulation, rising return or intake entry, harmful exposure, unacceptable impact on water supply, or operation outside the tested envelope. Proposed thresholds need ENEC and marine partner agreement.', ['faq']],
  ];
  const tabs = [['questions','Judge Q&A'],['sources','Research & sources'],['credits','Image credits']];

  const tabContent = {
    questions: () => `<p>Pick a question to open a short answer. Open the linked studies or technical brief for methods and results.</p>${questions.map(([q,a,refs])=>`<details><summary>${q}</summary><p>${a}</p><p>${refs.map(source).join('')}</p></details>`).join('')}`,
    sources: () => `<p>Open the site measurements, primary studies and full simulation archive.</p><a class="article-link" href="./evidence.html">Open the complete technical brief ↗</a><p>${Object.keys(window.HighTideContent.links).map(source).join('')}</p><a class="source-link" href="./assets/scenario-results.csv" download>Submitted 165 scenario results ↓</a><a class="source-link" href="./assets/barakah-data.csv" download>Barakah data register ↓</a>`,
    credits: () => `<p>Opening and closing imagery is illustrative.</p><p>Aquarium footage by Eline SUN via Pexels. Macroscopic jellyfish photograph by Jen Theodore via Unsplash.</p><p><a class="source-link" href="https://www.pexels.com/video/jellyfish-in-the-dark-blue-water-16482908/" target="_blank" rel="noopener">Pexels footage ↗</a><a class="source-link" href="https://unsplash.com/pt-br/fotografias/um-close-up-de-uma-agua-viva-na-agua--Yq9bahmNSc" target="_blank" rel="noopener">Unsplash photograph ↗</a></p><a class="article-link" href="./assets-credits.html">Full credits and licenses ↗</a>`,
  };
  function showTab(key) {
    const id = tabContent[key] ? key : 'questions';
    $('evidence-body').oninput=null;
    $('evidence-body').innerHTML = tabContent[id]();
    for (const button of $('evidence-tabs').children) button.setAttribute('aria-pressed',String(button.dataset.tab===id));
    $('evidence-body').scrollTop=0;
  }
  function openEvidence(key='questions', invoker=document.activeElement) {
    evidenceInvoker=invoker;showTab(key);
    if(!evidence.open)evidence.showModal();
    $('evidence-close').focus();
  }
  function toggleNotes(show) {
    $('notes').hidden=!show;$('notes-toggle').setAttribute('aria-expanded',String(show));
    if(show)$('notes-close').focus();else $('notes-toggle').focus();
  }
  $('notes-toggle').onclick=()=>toggleNotes($('notes').hidden);
  $('notes-close').onclick=()=>toggleNotes(false);
  $('evidence-toggle').onclick=()=>openEvidence('questions');
  $('evidence-close').onclick=()=>evidence.close();
  evidence.addEventListener('click',e=>{if(e.target===evidence)evidence.close();});
  evidence.addEventListener('close',()=>evidenceInvoker?.focus());
  $('evidence-tabs').innerHTML=tabs.map(([id,name])=>`<button class="tab" data-tab="${id}" aria-pressed="false">${name}</button>`).join('');
  $('evidence-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)showTab(b.dataset.tab);});
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('full-toggle').title='Fullscreen unavailable in this browser';}}
  $('full-toggle').onclick=fullscreen;
  document.addEventListener('fullscreenchange',()=>{$('full-toggle').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');});
  const pad=(value)=>String(value).padStart(2,'0');
  let start=0,elapsed=0;
  function updateClock(){const s=Math.floor((elapsed+(start?performance.now()-start:0))/1000);$('clock-value').textContent=`${pad(Math.floor(s/60))}:${pad(s%60)}`;}
  $('clock-toggle').onclick=()=>{if(start){elapsed+=performance.now()-start;start=0;}else start=performance.now();$('clock-toggle').textContent=start?'Pause timer':elapsed?'Resume timer':'Start timer';updateClock();};
  $('clock-reset').onclick=()=>{start=0;elapsed=0;$('clock-toggle').textContent='Start timer';updateClock();};
  setInterval(updateClock,250);
  $('slide-total').textContent=pad(slides.length);
  $('slide-nav').innerHTML=slides.map((slide,i)=>`<button class="nav-dot" data-index="${i}" aria-label="Slide ${i+1}: ${slide.name}" title="${slide.name}"></button>`).join('');
  $('slide-nav').addEventListener('click',e=>{const b=e.target.closest('[data-index]');if(b)go(+b.dataset.index);});
  $('prev').onclick=()=>go(index-1);$('next').onclick=()=>go(index+1);
  function showNotes() {
    const slide=slides[index], track=talkTrack[index];
    const paragraphs=(value)=>value.split('\n\n').map(p=>`<p>${p}</p>`).join('');
    $('notes-title').textContent=slide.name;
    $('notes-body').innerHTML=`<div class="eyebrow">${slide.span} · ${track.speaker.toUpperCase()} · SLIDE ${pad(index+1)}</div>${paragraphs(track.text)}<details class="extra-notes"><summary>Extended talking points</summary>${paragraphs(slide.notes)}</details><p class="fineprint">← / → navigate · F fullscreen · N notes · E evidence</p>`;
  }
  function go(n, options={}) {
    if(n<0 || n>=slides.length || n===displayed)return;
    window.HighTideSimulator.unmount();destroyMolecule();destroyMolecule=()=>{};
    index=n;displayed=n;const slide=slides[n];
    if(!options.fromHash)history.pushState(null,'',`#${slide.id}`);
    stage.innerHTML=slide.html;
    $('slide-number').textContent=pad(n+1);$('slide-label').textContent=slide.name.toUpperCase();
    Array.from($('slide-nav').children).forEach((b,i)=>{if(i===n)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');b.classList.toggle('past',i<n);});
    $('prev').disabled=n===0;$('next').disabled=n===slides.length-1;
    showNotes();
    if(slide.id==='opening') {
      const film=stage.querySelector('.hero-film');
      if(!motion.matches){const video=document.createElement('video');video.src='./assets/jelly-motion.mp4';video.poster='./assets/jelly-motion-poster.webp';video.autoplay=true;video.muted=true;video.loop=true;video.playsInline=true;video.setAttribute('aria-hidden','true');film.append(video);video.play().catch(()=>{});}
    }
    if(slide.id==='molecule')mountMolecule();
    if(slide.id==='gates')mountAssay();
    if(slide.id==='corridor')mountRoute();
    if(slide.id==='simulation')window.HighTideSimulator.mount($('simulator'));
    if(!options.initial){window.scrollTo(0,0);$('slide-title').focus({preventScroll:true});}
  }
  function mountMolecule(){
    $('molecule-more').onclick=()=>{const panel=$('molecule-extra');panel.hidden=!panel.hidden;$('molecule-more').setAttribute('aria-expanded',String(!panel.hidden));};
    const holder=$('molecule-art');
    holder.insertAdjacentHTML('beforeend','<button id="molecule-toggle" class="mini-button mol-toggle" aria-pressed="false">3D conformer</button><canvas id="molecule-canvas" role="img" aria-label="PubChem three-dimensional conformer of E-2-nonenal" hidden></canvas>');
    const canvas=$('molecule-canvas');const flat=holder.querySelector('svg');const ctx=canvas.getContext('2d');const { atoms,bonds }=window.HighTideMolecule;
    let loop=0,angle=.52,drag=null,active=false,manual=false;
    const center=atoms.reduce((sum,a)=>[sum[0]+a[0]/atoms.length,sum[1]+a[1]/atoms.length,sum[2]+a[2]/atoms.length],[0,0,0]);
    function draw(){if(!ctx||!active)return;const w=canvas.clientWidth,h=canvas.clientHeight,r=Math.min(devicePixelRatio||1,2);canvas.width=w*r;canvas.height=h*r;ctx.setTransform(r,0,0,r,0,0);const scale=Math.min(w/15,h/6);const c=Math.cos(angle),s=Math.sin(angle);const pts=atoms.map(([x,y,z,kind])=>{x-=center[0];y-=center[1];z-=center[2];const yr=y*c-z*s,zr=y*s+z*c;return {x:w/2+x*scale,y:h/2+(yr+.10*x)*scale,z:zr,kind};});
      ctx.clearRect(0,0,w,h);ctx.lineCap='round';
      const layers=[...bonds.map(([a,b,order])=>({z:(pts[a].z+pts[b].z)/2,draw(){const p=pts[a],q=pts[b];ctx.strokeStyle=p.kind==='H'||q.kind==='H'?'#446664':'#88bdba';ctx.lineWidth=order>1?2:3;const n=Math.hypot(q.x-p.x,q.y-p.y)||1;const ox=(q.y-p.y)*2/n,oy=(p.x-q.x)*2/n;const offsets=order>1?[-1,1]:[0];for(const o of offsets){ctx.beginPath();ctx.moveTo(p.x+o*ox,p.y+o*oy);ctx.lineTo(q.x+o*ox,q.y+o*oy);ctx.stroke();}}})),...pts.map(p=>({z:p.z,draw(){const radius=p.kind==='H'?3.7:p.kind==='O'?8.5:7.4;const g=ctx.createRadialGradient(p.x-2,p.y-2,1,p.x,p.y,radius);g.addColorStop(0,p.kind==='O'?'#ffe1ca':p.kind==='H'?'#eaf2e8':'#bbf8ee');g.addColorStop(1,p.kind==='O'?'#f4563c':p.kind==='H'?'#6c8d90':'#24666a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();}}))];layers.sort((a,b)=>a.z-b.z).forEach(x=>x.draw());}
    function tick(){if(!active || motion.matches || manual)return;angle+=.012;draw();loop=requestAnimationFrame(tick);}
    $('molecule-toggle').onclick=()=>{active=!active;flat.toggleAttribute('hidden',active);canvas.hidden=!active;$('molecule-toggle').textContent=active?'2D structure':'3D conformer';$('molecule-toggle').setAttribute('aria-pressed',String(active));cancelAnimationFrame(loop);if(active){draw();tick();}};
    canvas.addEventListener('pointerdown',e=>{manual=true;drag=e.clientX;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(drag===null)return;angle+=(e.clientX-drag)*.025;drag=e.clientX;draw();});canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
    const resize=new ResizeObserver(draw);resize.observe(canvas);
    destroyMolecule=()=>{active=false;cancelAnimationFrame(loop);resize.disconnect();};
  }
  function mountAssay(){
    const pairs={carrot:['blank','carrot'],stick:['stick','blank'],combined:['stick','carrot'],blank:['blank','blank']};
    const names={blank:'Matched blank',carrot:'Brine shrimp cue water',stick:'(E)-2-nonenal'};
    const box=$('assay-console'), controls=$('assay-presets');
    let trial='combined', swapped=false;
    function paint(){
      const arms=swapped?[...pairs[trial]].reverse():pairs[trial];
      box.dataset.armA=arms[0];box.dataset.armB=arms[1];
      $('assay-arm-a').textContent=names[arms[0]];$('assay-arm-b').textContent=names[arms[1]];
      for(const btn of controls.children)btn.setAttribute('aria-pressed',String(btn.dataset.trial===trial));
    }
    controls.onclick=e=>{const btn=e.target.closest('[data-trial]');if(btn){trial=btn.dataset.trial;paint();}};
    $('assay-swap').onclick=()=>{swapped=!swapped;paint();};paint();
  }
  function mountRoute(){
    let reversed=false;
    $('route-reverse').onclick=()=>{
      reversed=!reversed;$('route-console').classList.toggle('reverse',reversed);
      $('route-state').innerHTML=reversed?'Cross-flow toward A ↑ <b>Route A active</b>':'Cross-flow toward B ↓ <b>Route B active</b>';
    };
  }
  stage.addEventListener('click',e=>{const jump=e.target.closest('[data-jump]');if(jump)go(slides.findIndex(s=>s.id===jump.dataset.jump));const item=e.target.closest('[data-evidence]');if(item)openEvidence(item.dataset.evidence,item);});
  function sync(){const n=slides.findIndex(s=>`#${s.id}`===location.hash);go(n<0?0:n,{fromHash:true});}
  window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);
  document.addEventListener('keydown',e=>{if(e.altKey||e.metaKey||e.ctrlKey||e.repeat||e.target.closest('input,select,textarea,summary,[contenteditable]'))return;
    if(e.key==='Escape' && !$('notes').hidden && !evidence.open){toggleNotes(false);return;}
    if(evidence.open)return;
    const key=e.key.toLowerCase();
    if(['arrowright','pagedown','arrowleft','pageup','home','end','f','n','e'].includes(key)){e.preventDefault();switch(key){case 'arrowright':case 'pagedown':go(index+1);break;case 'arrowleft':case 'pageup':go(index-1);break;case 'home':go(0);break;case 'end':go(slides.length-1);break;case 'f':fullscreen();break;case 'n':toggleNotes($('notes').hidden);break;case 'e':openEvidence();break;}}
  });
  const first=slides.findIndex(s=>`#${s.id}`===location.hash);go(first<0?0:first,{initial:true,fromHash:true});
});
