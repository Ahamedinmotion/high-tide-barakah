/* Presentation UI for the original, uncalibrated High Tide transport engine. */
(() => {
const { Model, modes, modeNames, scenarios } = window.HighTideEngine;
const scenarioNames = {normal:'Steady current',surge:'Arrival surge',reversal:'Current reversal',delayed:'Control delay',weak:'Weak current',capture:'Strong intake capture',disturbance:'High dispersion',power_loss:'Power loss',blocked_exit:'Blocked exit',zero_response:'No induced response',return_flow:'Return current'};
const endpointLabels = ['Arrivals','Intake','Outside','Retained','Other','Returned'];
let dispose = () => {};
function mount(container) {
  dispose();
  let mode='controlled', scenario='reversal', model, timer=0;
  const records=window.HighTideResults;
  container.innerHTML=`<div class="result-controls"><label>Scenario<select id="sim-scenario">${Object.entries(scenarioNames).map(([id,name])=>`<option value="${id}" ${id===scenario?'selected':''}>${name}</option>`).join('')}</select></label><label>Replay configuration<select id="sim-mode">${modes.map(id=>`<option value="${id}" ${id===mode?'selected':''}>${modeNames[id]}</option>`).join('')}</select></label><a href="./assets/scenario-results.csv" download class="panel-button">All 165 runs ↓</a></div>
  <div class="result-grid"><section class="result-panel" aria-label="Matched simulation outcomes"><div class="console-head"><span>ENDPOINT COMPARISON</span><span id="sim-cohort"></span></div><table class="result-table"><thead><tr><th scope="col">Configuration</th>${endpointLabels.slice(1,4).map(name=>`<th scope="col">${name}</th>`).join('')}</tr></thead><tbody id="sim-rows"></tbody></table><p id="sim-insight" aria-live="polite"></p><p class="result-foot">Outside and retained are positions at the finish. The CSV also records other boundary exits and returns.</p></section>
  <section class="sim-main replay-panel" aria-label="Transport model replay"><div class="console-head"><span>PLAN VIEW / PHYSICAL TRANSPORT</span><button id="sim-play" class="panel-button">Replay</button><button id="sim-finish" class="panel-button">Finish</button></div><canvas class="sim-canvas" role="img" aria-label="Simulated arrivals, diversion sections, exits A and B, and intake"></canvas><div class="replay-stats"><span id="sim-state"></span><span id="sim-live"></span><button id="sim-export" class="text-button">Run log ↓</button></div></section></div>`;
  const $=id=>container.querySelector('#'+id);
  const canvas=container.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  function stop(){if(timer)clearInterval(timer);timer=0;}
  function draw() {
    if (!ctx) return;
    const w=canvas.clientWidth, h=canvas.clientHeight, dpr=Math.min(devicePixelRatio||1,2);
    if (w<10 || h<10) return;
    if (canvas.width!==Math.round(w*dpr) || canvas.height!==Math.round(h*dpr)) {canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const left=25, right=w-31, top=35, bottom=h-36;
    const X=(v)=>left+(right-left)*v/103;
    const Y=(v)=>top+(bottom-top)*v/60;
    ctx.fillStyle='#242424';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#353535';ctx.fillRect(left,0,right-left,top);ctx.fillRect(left,bottom,right-left,h-bottom);
    ctx.strokeStyle='#454545';ctx.lineWidth=1;
    for(let x=0;x<103;x+=10){ctx.beginPath();ctx.moveTo(X(x),top);ctx.lineTo(X(x),bottom);ctx.stroke();}
    for(let y=0;y<=60;y+=10){ctx.beginPath();ctx.moveTo(left,Y(y));ctx.lineTo(right,Y(y));ctx.stroke();}
    ctx.font='9px monospace';ctx.fillStyle='#f2f2f2';ctx.fillText(model.p.exitOpen?'EXIT A':'EXIT CLOSED',left+4,19);ctx.fillText(model.p.exitOpen?'EXIT B':'EXIT CLOSED',left+4,h-13);
    ctx.fillStyle='#bc8b79';ctx.fillRect(X(95),Y(18),7,Y(42)-Y(18));ctx.fillStyle='#e5ae99';ctx.fillText('INTAKE',Math.max(left+5,X(95)-41),Y(16));
    ctx.fillStyle='#c1c1c1';ctx.fillText('INFLOW →',left+5,Y(12)-4);ctx.fillText(model.currentSign()>0?'CROSS-FLOW ↓':'CROSS-FLOW ↑',Math.min(w-96,X(63)),h-13);
    if(mode!=='none') {
      const sign=mode==='controlled'?model.controlSign():1;
      for(let j=0;j<6;j++){
        const lo=j*10+1,hi=(j+1)*10-1;
        ctx.strokeStyle=mode==='guide'?'#c6a08c':model.active[j]?'#00ebff':'#6a6a6a';
        ctx.lineWidth=model.active[j]?4:2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(X(model.lineX(lo,sign)),Y(lo));ctx.lineTo(X(model.lineX(hi,sign)),Y(hi));ctx.stroke();
      }
    }
    for(const a of model.animals){
      if(a.status==='other'||a.x < 0||a.x>103)continue;
      const px=X(a.x),py=Math.max(8,Math.min(h-7,Y(a.y)));
      ctx.fillStyle=a.status==='intake'?'#ff5a3c':a.outside?'#00ebff':a.returned?'#efb88d':'#dbe4e0';
      ctx.beginPath();ctx.arc(px,py,a.status==='intake'?1.8:1.6,0,Math.PI*2);ctx.fill();
    }
  }
  function render(){
    const m=model.metrics();
    $('sim-state').textContent=`${Math.round(m.time)} / 900 s · ${model.state}`;
    $('sim-live').textContent=`Intake ${m.intake} · Outside ${m.exit} · Returned ${m.returned}`;
    $('sim-play').textContent=timer?'Pause':model.t>=model.p.duration?'Replay':model.t?'Resume':'Play';
    draw();
  }
  function compare(){
    const results=records[scenario], base=results.none, controlled=results.controlled;
    const configurations=['none','fixed','controlled',...(['guide','water'].includes(mode)?[mode]:[])];
    $('sim-cohort').textContent=`${base[0].toLocaleString('en')} ARRIVALS · SEED 42 · 900 S`;
    $('sim-rows').innerHTML=configurations.map(id=>{
      const [,intake,exit,retained]=results[id];
      return `<tr class="${id===mode?'selected':''}"><th scope="row"><button type="button" data-mode="${id}" aria-pressed="${id===mode}">${modeNames[id]}</button></th><td>${intake}</td><td>${exit}</td><td>${retained}</td></tr>`;
    }).join('');
    const messages={
      reversal:`<b>Intake count can hide a backlog.</b> Fixed bubbles retained ${results.fixed[3]}; controlled sections retained ${controlled[3]} and left ${controlled[2]} outside at the finish.`,
      delayed:`<b>Switch time matters.</b> At a 90 s delay, ${controlled[2]} finish outside, down from ${records.reversal.controlled[2]} with the 10 s delay.`,
      return_flow:`<b>Crossing an exit is only the first step.</b> ${controlled[5]} controlled tracks return at least once; ${controlled[2]} finish outside.`,
      blocked_exit:`<b>With the outlet closed, the controller holds off.</b> Controlled sections match the no-diversion intake and retained counts.`,
      power_loss:`<b>Watch the outcome after actuation stops.</b> Power cuts at 450 s. Controlled sections finish with ${controlled[1]} intake and ${controlled[3]} retained.`,
      zero_response:`<b>Test the intervention against a zero-response case.</b> Controlled sections finish with ${controlled[1]} intake and ${controlled[2]} outside.`
    };
    $('sim-insight').innerHTML=messages[scenario]||`<b>Check both clearance and intake.</b> Without diversion, ${base[1]} enter and ${base[2]} finish outside. With controlled sections: ${controlled[1]} enter and ${controlled[2]} finish outside.`;
  }
  function reset(completed=true){
    stop();model=new Model({...scenarios[scenario],mode});
    if(completed)model.run();
    compare();render();
  }
  function play(){
    if(timer){stop();render();return;}
    if(model.t>=model.p.duration)reset(false);
    timer=setInterval(()=>{for(let i=0;i<32;i++)if(!model.step()){stop();break;}render();},45);render();
  }
  function download(){
    const rows=model.history.length?model.history:[model.metrics()];
    const keys=Object.keys(rows[0]),text=[keys.join(','),...rows.map(row=>keys.map(key=>row[key]).join(','))].join('\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/csv'})),anchor=document.createElement('a');
    anchor.href=url;anchor.download=`high-tide-${mode}-${scenario}-seed42.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function choose(value){mode=value;$('sim-mode').value=mode;reset();}
  $('sim-rows').onclick=e=>{const b=e.target.closest('[data-mode]');if(b){const value=b.dataset.mode;choose(value);$('sim-rows').querySelector('[data-mode="'+value+'"]')?.focus();}};
  $('sim-mode').onchange=e=>choose(e.target.value);
  $('sim-scenario').onchange=e=>{scenario=e.target.value;reset();};
  $('sim-play').onclick=play;$('sim-finish').onclick=()=>{stop();model.run();render();};$('sim-export').onclick=download;
  const resize=new ResizeObserver(draw);resize.observe(canvas);
  function pauseHidden(){if(document.hidden){stop();render();}}
  document.addEventListener('visibilitychange',pauseHidden);
  dispose=()=>{stop();resize.disconnect();document.removeEventListener('visibilitychange',pauseHidden);};
  reset();
}
window.HighTideSimulator={mount,unmount:()=>dispose()};
})();
