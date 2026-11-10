/* Presentation UI for the original, uncalibrated High Tide transport engine. */
(() => {
const { Model, modes, modeNames, scenarios } = window.HighTideEngine;
const scenarioNames = {normal:'Steady current',surge:'Arrival surge',reversal:'Current reversal',delayed:'Control delay',weak:'Weak current',capture:'Strong intake capture',disturbance:'High dispersion',power_loss:'Power loss',blocked_exit:'Blocked exit',zero_response:'No induced response',return_flow:'Return current'};
const metrics = [['arrivals','Arrivals'],['intake','Intake'],['exit','Outside exit'],['retained','Retained'],['other','Other edge'],['returned','Returned*']];
let dispose = () => {};
function mount(container) {
  dispose();
  let mode = 'controlled';
  let scenario = 'reversal';
  let model = new Model({ ...scenarios[scenario], mode });
  let timer = 0;
  container.innerHTML = `<div class="sim-grid"><section class="sim-main" aria-label="Transport model"><div class="sim-actions"><label>Configuration<select id="sim-mode">${modes.map(value=>`<option value="${value}" ${value===mode?'selected':''}>${modeNames[value]}</option>`).join('')}</select></label><label>Scenario<select id="sim-scenario">${Object.entries(scenarioNames).map(([value,name])=>`<option value="${value}" ${value===scenario?'selected':''}>${name}</option>`).join('')}</select></label><button class="play" id="sim-play">Run</button><button id="sim-finish">Finish run</button><button id="sim-reset">Reset</button></div><canvas class="sim-canvas" aria-label="Plan view of simulated animals, the adjustable corridor and the intake boundary" role="img"></canvas><div class="sim-bottom"><span class="sim-readout" id="sim-state"></span><button id="sim-export">Export run CSV ↓</button></div></section><section class="sim-side" aria-label="Outcome counts"><div class="card-top"><span>LIVE OUTCOMES</span><span class="tag blue">MODEL</span></div><dl class="sim-metrics">${metrics.map(([id,name])=>`<div class="metric ${id}"><dt>${name}</dt><dd id="m-${id}">0</dd></div>`).join('')}</dl><p class="sim-footnote">Arrivals = intake + outside exit + retained + other edge. *Returned overlaps those counts. Same seed (42), 900-second horizon. Simplified transport model with assumed coefficients.</p></section></div><div class="sim-compare"><button id="sim-baseline" class="mini-button">Compare to no diversion</button><button class="mini-button" data-evidence="stress">Cue sensitivity ↗</button><span id="sim-comparison" role="status">Physical response only. The candidate cue has no assigned effect in this model.</span></div>`;
  const $ = (id) => container.querySelector(`#${id}`);
  const canvas = container.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  function stop() { if (timer) clearInterval(timer); timer=0; }
  function draw() {
    if (!ctx) return;
    const w=canvas.clientWidth, h=canvas.clientHeight, dpr=Math.min(devicePixelRatio||1,2);
    if (w<10 || h<10) return;
    if (canvas.width!==Math.round(w*dpr) || canvas.height!==Math.round(h*dpr)) {canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const left=25, right=w-31, top=35, bottom=h-36;
    const X=(v)=>left+(right-left)*v/103;
    const Y=(v)=>top+(bottom-top)*v/60;
    ctx.fillStyle='#07171d';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#102a2d';ctx.fillRect(left,0,right-left,top);ctx.fillRect(left,bottom,right-left,h-bottom);
    ctx.strokeStyle='#193436';ctx.lineWidth=1;
    for(let x=0;x<103;x+=10){ctx.beginPath();ctx.moveTo(X(x),top);ctx.lineTo(X(x),bottom);ctx.stroke();}
    for(let y=0;y<=60;y+=10){ctx.beginPath();ctx.moveTo(left,Y(y));ctx.lineTo(right,Y(y));ctx.stroke();}
    ctx.font='9px monospace';ctx.fillStyle='#b1d6cf';ctx.fillText(model.p.exitOpen?'EXIT A':'EXIT CLOSED',left+4,19);ctx.fillText(model.p.exitOpen?'EXIT B':'EXIT CLOSED',left+4,h-13);
    ctx.fillStyle='#bc8b79';ctx.fillRect(X(95),Y(18),7,Y(42)-Y(18));ctx.fillStyle='#e5ae99';ctx.fillText('INTAKE',Math.max(left+5,X(95)-41),Y(16));
    ctx.fillStyle='#819d9e';ctx.fillText('INFLOW →',left+5,Y(12)-4);ctx.fillText(model.currentSign()>0?'CROSS-FLOW ↓':'CROSS-FLOW ↑',Math.min(w-96,X(63)),h-13);
    if(mode!=='none') {
      const sign=mode==='controlled'?model.controlSign():1;
      for(let j=0;j<6;j++){
        const lo=j*10+1,hi=(j+1)*10-1;
        ctx.strokeStyle=mode==='guide'?'#c6a08c':model.active[j]?'#00ebff':'#285b62';
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
  function render() {
    const m=model.metrics();
    for(const [id] of metrics) $(`m-${id}`).textContent=m[id];
    $('sim-state').innerHTML=`<b>${model.state}</b> · ${Math.round(m.time)} / 900 s`;
    $('sim-play').textContent=timer?'Pause':model.t>=model.p.duration?'Replay':model.t?'Resume':'Run';
    draw();
  }
  function reset() {
    stop();model=new Model({ ...scenarios[scenario], mode });
    $('sim-comparison').textContent='Physical response only. The candidate cue has no assigned effect in this model.';render();
  }
  function play() {
    if(timer) {stop();render();return;}
    if(model.t>=model.p.duration)reset();
    timer=setInterval(()=>{for(let i=0;i<24;i++)if(!model.step()){stop();break;}render();},50);render();
  }
  function finish(){stop();model.run();render();}
  function compare(){finish();const base=new Model({ ...scenarios[scenario], mode:'none' }).run();const m=model.metrics();$('sim-comparison').innerHTML=`<strong>Same ${m.arrivals} arrivals.</strong> Intake ${base.intake} → ${m.intake} · outside exit ${base.exit} → ${m.exit} · retained ${base.retained} → ${m.retained}.`}
  function download(){const rows=model.history.length?model.history:[model.metrics()];const keys=Object.keys(rows[0]);const content=[keys.join(','),...rows.map(row=>keys.map(key=>row[key]).join(','))].join('\n');const url=URL.createObjectURL(new Blob([content],{type:'text/csv'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=`high-tide-${mode}-${scenario}.csv`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('sim-mode').addEventListener('change',e=>{mode=e.target.value;reset();});
  $('sim-scenario').addEventListener('change',e=>{scenario=e.target.value;reset();});
  $('sim-play').addEventListener('click',play);$('sim-finish').addEventListener('click',finish);$('sim-reset').addEventListener('click',reset);$('sim-baseline').addEventListener('click',compare);$('sim-export').addEventListener('click',download);
  const resize=new ResizeObserver(draw);resize.observe(canvas);
  function pauseHidden(){if(document.hidden){stop();render();}}
  document.addEventListener('visibilitychange',pauseHidden);
  dispose=()=>{stop();resize.disconnect();document.removeEventListener('visibilitychange',pauseHidden);};render();
}
window.HighTideSimulator={ mount, unmount:()=>dispose() };
})();
