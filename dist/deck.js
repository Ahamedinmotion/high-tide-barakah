/* Full-screen deck navigation, interactive exhibits and presenter tools. */
window.addEventListener('DOMContentLoaded', () => {
  const { slides, gates, stats, source, label, talkTrack } = window.HighTideContent;
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const evidence = $('evidence');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, displayed = -1, destroyMolecule = () => {};
  let evidenceInvoker;
  const questions = [
    ['Why another bubble system?', 'The corridor compares several methods and only counts an exit if animals clear the intake area. The biochemical program tests whether we can add a measured directional response. Published bubble experiments justify testing, and Barakah calibration determines what works.', ['bubble']],
    ['Does the molecule repel jellyfish?', 'In a contact assay, Japanese sea nettles held treated prey for less time. We propose a blinded directional test in identified local adults. We need evidence of sustained movement and recovery, not simply a feeding or stress response.', ['chemistry', 'molecule']],
    ['Why think chemicals can guide any medusa?', 'A two-inflow aquarium study found side preference under prey-conditioned water in moon jellies. It motivates an attraction arm with matched flow. The active compound and response in Catostylus remain unknown.', ['preference']],
    ['How do you isolate behavior from water movement?', 'Map flow in both arms first, match temperature and salinity, alternate the cue side, use a vehicle blank and score video blind. Subtract measured water velocity from animal motion. Compare a spatial gradient with uniform exposure and record nonchoices.', ['chemistry']],
    ['What about fish, larvae, corals and other species?', 'We have no local dose-response margin yet. A marine partner would select non-target endpoints and test at measured exposures in a contained system. A repeatable target response, recovery, no unacceptable non-target effects and proven effluent containment are gates for any next stage.', ['chemistry', 'faq']],
    ['Is the chemistry necessary for the physical corridor?', 'The physical corridor has its own controls, tests and stop conditions. If the cue fails on direction, selectivity or containment, the chemical workstream stops and physical development can continue.', []],
    ['Where exactly does it go?', 'The first candidate zone is the marine approach before stronger intake capture. A breakwater edge may support a route if the current carries animals clear across operating states. ENEC bathymetry, permitted work areas and exit recirculation measurements would determine placement.', ['dredge', 'cooling', 'faq']],
    ['What happens when the current reverses or an exit closes?', 'Use only an independently checked route within the tested operating envelope. Compare a delayed switch, closed exit and power loss in the simulator. If clearance cannot be verified, stop actuation and leave the response to existing operator procedures.', []],
    ['Is 200 tonnes per day real at Barakah?', 'It is an illustrative wet-mass scenario pending dated ENEC records, weighing method and location. Average rate is 2.31 kg/s across 24 hours, or 13.89 kg/s over four hours. These imply very different transport demands.', []],
    ['Can we use temperature to steer them?', 'First distinguish preference from changes in movement or survival and from density-driven currents. Temperature belongs in a controlled assay matrix. A 1 °C change at 1 m³/s would take about 4.1 MW thermal before losses, which gives the scale of the open-water idea.', ['water', 'currents']],
    ['What is physically built?', 'The submitted High Tide prototype is a runnable transport simulation with reproducible scenario outputs. A measured flume and a species-specific behavioral trial are separate next stages. Current figures in the visual model are assumptions.', ['original']],
    ['What will it cost?', 'A demo-only bench allowance is AED 2,160–8,640 including 20% reserve. A contained feasibility study and preliminary non-target screens are AED 35,625–125,000 including 25% reserve. These are planning assumptions. A field estimate needs surveyed geometry, installation and maintenance scope, verified demand and vendor quotes.', []],
    ['How do you know the Barakah jellyfish species?', 'We use the challenge brief’s name and size as a design case. Gulf records include a related Catostylus species. Before testing, confirm local vouchers and morphology with a marine partner and use suitable molecular identification for ambiguous specimens.', ['brief', 'taxonomy']],
    ['How do you prove performance to ENEC?', 'Agree an operating envelope and minimum acceptable improvement first. Compare no actuation, the physical options, and eventually cue plus physical against physical alone in containment. Score verified exits, returns, intake entries, retention, water supply, welfare, energy and maintenance.', ['bubble', 'original']],
    ['What is the failure condition for a site trial?', 'An unsuitable exit, accumulation, rising return or intake entry, harmful exposure, unacceptable impact on water supply, or operation outside the tested envelope. Proposed thresholds need ENEC and marine partner agreement.', ['faq']],
  ];
  const tabs = [['questions','Judge Q&A'],['stress','Stress calculator'],['sources','Research & sources'],['credits','Image credits']];

  const tabContent = {
    questions: () => `<p>Pick a question to open a short answer. The linked technical brief has the assumptions and references.</p>${questions.map(([q,a,refs])=>`<details><summary>${q}</summary><p>${a}</p><p>${refs.map(source).join('')}</p></details>`).join('')}`,
    stress: () => `<p>Illustrative screening arithmetic. Values apply to the scenario you enter and should not be presented as Barakah measurements.</p><h3>Wet-mass arrival</h3><div class="stress-grid"><label>Wet tonnes<input id="mass" type="number" min="0" max="100000" step="1" value="200"></label><label>Arrival window, h<input id="hours" type="number" min="0.25" max="168" step="0.25" value="24"></label></div><div class="stress-result"><div><strong id="tonnes-hour">8.33</strong><span>tonnes per hour</span></div><div><strong id="kg-second">2.31</strong><span>kilograms per second</span></div></div><h3>Time available to divert</h3><div class="stress-grid"><label>Available reach, m<input id="reach" type="number" min="1" max="10000" value="50"></label><label>Sideways travel, m<input id="lateral" type="number" min="0" max="10000" value="10"></label><label>Along-flow speed, m/s<input id="along" type="number" min="0.01" max="5" step="0.01" value="0.15"></label></div><div class="stress-result"><div><strong id="travel-time">333.33</strong><span>seconds available</span></div><div><strong id="side-speed">0.030</strong><span>net sideways speed, m/s</span></div></div><p>Mass rate = mass ÷ time. Time available = reach ÷ along-flow speed. Required average sideways speed = lateral distance ÷ time. Shear, eddies and animal behavior require measured profiles and controlled testing.</p><h3>What would a measured cue need to add?</h3><div class="stress-grid"><label>Physical sideways speed, m/s<input id="physical" type="number" min="0" max="5" step="0.001" value="0.02"></label><label>Hypothetical cue bias, m/s<input id="cue" type="number" min="-5" max="5" step="0.001" value="0.00"></label><label>Time before cue response, s<input id="latency" type="number" min="0" max="6000" step="1" value="20"></label></div><div class="stress-result"><div><strong id="physical-distance">6.67</strong><span>physical travel, m</span></div><div><strong id="cue-distance">6.67</strong><span>combined travel, m</span></div></div><p id="cue-margin" role="status"></p><p>Set the cue to zero for the physical baseline. A signed bias is a hypothetical measured swim velocity added after latency. This simple screen assigns no effect to the named molecule and does not model concentration, shear or animal interactions.</p>`,
    sources: () => `<p>Public data, study results and model assumptions have separate provenance in the technical brief.</p><a class="article-link" href="./evidence.html">Open the complete technical brief ↗</a><p>${Object.keys(window.HighTideContent.links).map(source).join('')}</p><a class="source-link" href="./assets/scenario-results.csv" download>Submitted 165 scenario results ↓</a><a class="source-link" href="./assets/barakah-data.csv" download>Barakah data register ↓</a>`,
    credits: () => `<p>Opening and closing imagery is illustrative.</p><p>Aquarium footage by Eline SUN via Pexels. Macroscopic jellyfish photograph by Jen Theodore via Unsplash.</p><p><a class="source-link" href="https://www.pexels.com/video/jellyfish-in-the-dark-blue-water-16482908/" target="_blank" rel="noopener">Pexels footage ↗</a><a class="source-link" href="https://unsplash.com/pt-br/fotografias/um-close-up-de-uma-agua-viva-na-agua--Yq9bahmNSc" target="_blank" rel="noopener">Unsplash photograph ↗</a></p><a class="article-link" href="./assets-credits.html">Full credits and licenses ↗</a>`,
  };
  function showTab(key) {
    const id = tabContent[key] ? key : 'questions';
    $('evidence-body').oninput=null;
    $('evidence-body').innerHTML = tabContent[id]();
    for (const button of $('evidence-tabs').children) button.setAttribute('aria-pressed',String(button.dataset.tab===id));
    $('evidence-body').scrollTop=0;
    if(id==='stress') {
      const val=(id)=>{const i=$(id);return i.value!=='' && i.validity.valid ? i.valueAsNumber : NaN;};
      const out=(id,v,places)=>{$(id).textContent=Number.isFinite(v)?v.toLocaleString('en',{minimumFractionDigits:places,maximumFractionDigits:places}):'—';};
      const update=()=>{out('tonnes-hour',val('mass')/val('hours'),2);out('kg-second',val('mass')/val('hours')/3.6,2);const time=val('reach')/val('along');out('travel-time',time,2);out('side-speed',val('lateral')/time,3);const physical=val('physical')*time, combined=physical+val('cue')*Math.max(0,time-val('latency'));out('physical-distance',physical,2);out('cue-distance',combined,2);const margin=combined-val('lateral');$('cue-margin').textContent=Number.isFinite(margin)?`Illustrative clearance margin: ${margin.toFixed(2)} m relative to the assumed exit distance.`:'';};
      $('evidence-body').oninput=update;update();
    }
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
    if(slide.id==='opening'||slide.id==='outro') {
      const film=stage.querySelector('.hero-film');
      if(!motion.matches){const video=document.createElement('video');video.src='./assets/jelly-motion.mp4';video.poster='./assets/jelly-motion-poster.webp';video.autoplay=true;video.muted=true;video.loop=true;video.playsInline=true;video.setAttribute('aria-hidden','true');film.append(video);video.play().catch(()=>{});}
    }
    if(slide.id==='molecule')mountMolecule();
    if(slide.id==='gates')mountGates();
    if(slide.id==='barakah')mountStats();
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
  function mountGates(){
    const assayView = `<div class="assay-view" id="assay-view"><div class="assay-branches" aria-label="Matched-flow, two-arm chamber schematic"><span id="assay-arm-a">Arm A · Vehicle blank</span><i aria-hidden="true">→</i><span id="assay-arm-b">Arm B · Candidate cue</span></div><button id="assay-swap" class="mini-button">Swap cue side ⇄</button><small>Equal flow · Track motion relative to water</small></div>`;
    $('gate-choices').innerHTML=gates.map((g,i)=>`<button class="gate-choice" data-i="${i}" aria-pressed="false"><small>${pad(i+1)}</small>${g.title}</button>`).join('');
    const show=(i)=>{const gate=gates[i];for(const button of $('gate-choices').children)button.setAttribute('aria-pressed',String(+button.dataset.i===i));$('gate-detail').innerHTML=`${label(gate.code,'green')}<h2>${gate.claim}</h2><p>${gate.detail}</p><strong class="measure">${gate.measure}</strong>${i===1?assayView:''}${gate.sources.map(source).join('')}`;if(i===1){let side=false;$('assay-swap').onclick=()=>{side=!side;$('assay-arm-a').textContent=side?'Arm A · Candidate cue':'Arm A · Vehicle blank';$('assay-arm-b').textContent=side?'Arm B · Vehicle blank':'Arm B · Candidate cue';$('assay-view').classList.toggle('swapped',side);};}};
    $('gate-choices').onclick=e=>{const b=e.target.closest('[data-i]');if(b)show(+b.dataset.i);};show(0);
  }
  function mountStats(){
    $('stats').innerHTML=stats.map((s,i)=>`<button class="stat-choice" data-i="${i}" aria-pressed="false"><small>${s.tag}</small><strong>${s.value}<i>${s.unit}</i></strong><span>${s.key}</span></button>`).join('');
    const show=(i)=>{const s=stats[i];for(const b of $('stats').children)b.setAttribute('aria-pressed',String(+b.dataset.i===i));$('stat-detail').innerHTML=`${label(s.tag,s.color)}<h2>${s.title}</h2><p>${s.detail}</p>${s.sources.map(source).join('')}${i===4?'<button class="mini-button" data-evidence="stress">Stress calculator ↗</button>':''}${i===2?'<div class="temp-chart" aria-label="Regional Barakah grid cell seasonal sea surface means 2003 to 2019">'+[['Winter','21.6'],['Spring','25.3'],['Summer','32.7'],['Autumn','30.6']].map(([n,v])=>`<span>${n} <b>${v}°C</b></span>`).join('')+'</div>'+source('buoy'):''}`;};
    $('stats').onclick=e=>{const b=e.target.closest('[data-i]');if(b)show(+b.dataset.i);};show(0);
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
