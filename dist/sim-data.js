/* Offline browser wrapper. Engine calculations unchanged from High Tide v1.0. */
(() => {
// High Tide v1.0. Deterministic, depth-averaged transport thought experiment.
// No CFD, no biological calibration, no collision/crowding capacity model.
const defaults={seed:42,dt:.25,duration:900,arrivalRate:1,current:.22,lateral:.025,intake:.22,strength:.55,response:1,bodySize:.375,dispersion:.035,angle:30,reversal:450,delay:10,failure:1e9,exitOpen:true,returnFlow:0,mode:'controlled'};
const modes=['none','fixed','controlled','guide','water'];
const modeNames={none:'No diversion',fixed:'Fixed bubbles',controlled:'Controlled sections',guide:'Angled porous guide',water:'Distributed water flow'};
const scenarios={normal:{reversal:1e9},surge:{reversal:1e9,surge:true},reversal:{},delayed:{delay:90},weak:{current:.06,lateral:.02,reversal:1e9},capture:{intake:.7,reversal:1e9},disturbance:{dispersion:.15,reversal:1e9},power_loss:{failure:450,reversal:1e9},blocked_exit:{exitOpen:false,reversal:1e9},zero_response:{response:0,reversal:1e9},return_flow:{returnFlow:.16,reversal:450}};
function rand(seed,id,salt){let x=(seed^Math.imul(id+1,2654435761)^Math.imul(salt+1,1597334677))>>>0;x^=x>>>16;x=Math.imul(x,2246822507);x^=x>>>13;x=Math.imul(x,3266489909);x^=x>>>16;return (x>>>0)/4294967296;}
class Model{
 constructor(settings={}){this.p={...defaults,...settings};this.t=0;this.nextArrival=0;this.animals=[];this.history=[];this.actuation=0;this.returnEvents=0;this.contactEvents=0;this.maxError=0;this.active=Array(6).fill(false);this.state='Ready';this.lastLog=-1;}
 currentSign(t=this.t){return t>=this.p.reversal?-1:1;}
 controlSign(){return this.t>=this.p.reversal+this.p.delay?-1:1;}
 spawn(){const id=this.animals.length;this.animals.push({id,x:0,y:12+36*rand(this.p.seed,id,0),response:this.p.response*(.7+.6*rand(this.p.seed,id,1))*(.375/this.p.bodySize)**.25,phase:rand(this.p.seed,id,2)*Math.PI*2,status:'active',outside:false,everExited:false,returned:false,contacts:0,contacting:false,born:this.nextArrival});}
 lineX(y,sign){return 43+Math.tan(this.p.angle*Math.PI/180)*sign*(y-30);}
 updateControl(){const p=this.p,sign=this.controlSign();this.state=!p.exitOpen?'Unsuitable exit':this.t>=p.failure&&p.mode!=='guide'?'Equipment fault':p.mode==='none'?'Observe only':`Divert to Exit ${sign>0?'B':'A'}`;this.active=Array(6).fill(p.mode==='fixed'||p.mode==='water');if(p.mode==='controlled')for(const a of this.animals){if(a.status!=='active'||a.y<0||a.y>60)continue;if(Math.abs(a.x-this.lineX(a.y,sign))<13){const k=Math.min(5,Math.floor(a.y/10));for(let j=Math.max(0,k-1);j<=Math.min(5,k+1);j++)this.active[j]=true;}}if(!p.exitOpen||this.t>=p.failure)this.active.fill(false);}
 step(dt=this.p.dt){const p=this.p;if(this.t>=p.duration-1e-8)return false;dt=Math.min(dt,p.duration-this.t);const until=this.t+dt;while(this.nextArrival<until-1e-9){this.spawn();this.nextArrival+=1/(p.arrivalRate*(p.surge&&this.nextArrival>=p.duration/2?3:1));}
 this.updateControl();const control=p.mode==='controlled'?this.controlSign():1,sgn=this.currentSign();let powered=this.active.filter(Boolean).length;
 if(p.mode==='water')powered=this.state.startsWith('Divert')?6:0;
 this.actuation+=powered/6*(p.strength/.55)**2*dt;
 for(const a of this.animals){if(a.status!=='active')continue;const oldY=a.y;const localDt=Math.min(dt,until-a.born);if(localDt<=0)continue;
 let vx=p.current+p.intake*Math.exp(-(((a.y-30)/18)**2))*Math.max(0,(a.x-55)/40);let vy=sgn*p.lateral;
 // Smooth deterministic unresolved motion; not a turbulence or wave solver.
 vx+=p.dispersion*Math.sin(.17*this.t+a.phase);vy+=p.dispersion*Math.cos(.13*this.t+a.phase*1.7);
 if(a.y<0)vy+=p.returnFlow;if(a.y>60)vy-=p.returnFlow;
 let contact=false;const slope=Math.tan(p.angle*Math.PI/180)*control,den=Math.sqrt(1+slope*slope),d=(a.x-this.lineX(a.y,control))/den;
 const inLine=a.y>=0&&a.y<=60;const seg=Math.max(0,Math.min(5,Math.floor(a.y/10)));
 if(inLine&&this.active[seg]&&p.mode!=='guide'&&p.mode!=='none'){
   if(p.mode==='water'){const g=Math.exp(-(((a.x-43)/13)**2));vy+=control*p.strength*a.response*g;}
   else { // Symmetric, permeable surface spreading away from an assumed plume line.
     const g=Math.exp(-.5*(d/5)**2),side=d<0?-1:1;
     vx+=side*p.strength*a.response*g/den;vy-=side*p.strength*a.response*g*slope/den;
   }
 }
 if(p.mode==='guide'&&inLine&&Math.abs(d)<1.2&&d<.5){
  // Porous guide surrogate: 15% assigned passage. No deformation or injury model.
  if(rand(p.seed,a.id,8)>.15){const vn=(vx-slope*vy)/den;if(vn>0){vx-=.95*vn/den;vy+=.95*vn*slope/den;}contact=true;}
 }
 if(contact&&!a.contacting){a.contacts++;this.contactEvents++;}a.contacting=contact;
 a.x+=vx*localDt;a.y+=vy*localDt;
 // A blocked exit is a declared reflecting shoreline. These crossings are not exits.
 if(!p.exitOpen){if(a.y<0)a.y=-a.y;if(a.y>60)a.y=120-a.y;}
 const outside=a.y<0||a.y>60;
 if(outside&&!a.outside)a.everExited=true;
 if(!outside&&a.outside){a.returned=true;this.returnEvents++;}
 a.outside=outside;
 if(a.x>=95&&a.y>=18&&a.y<=42){a.status='intake';a.outside=false;}
 else if(a.x>140||a.x< -35||a.y< -60||a.y>120){a.status='other';}
 }
 this.t=until;const m=this.metrics();this.maxError=Math.max(this.maxError,Math.abs(m.balanceError));if(Math.floor(this.t/5)>this.lastLog||this.t>=p.duration){this.history.push(m);this.lastLog=Math.floor(this.t/5);}return true;}
 metrics(){let intake=0,exit=0,retained=0,other=0,everExited=0,returned=0;for(const a of this.animals){if(a.status==='intake')intake++;else if(a.status==='other')other++;else if(a.outside)exit++;else retained++;if(a.everExited)everExited++;if(a.returned)returned++;}const arrivals=this.animals.length;return {time:+this.t.toFixed(3),arrivals,intake,exit,retained,other,everExited,returned,returnEvents:this.returnEvents,contactEvents:this.contactEvents,actuationIndex:+this.actuation.toFixed(3),balanceError:arrivals-intake-exit-retained-other,intakeFraction:arrivals?intake/arrivals:0,exitFraction:arrivals?exit/arrivals:0};}
 run(){while(this.step());return this.metrics();}
}
function run(settings={}){const m=new Model(settings);const result=m.run();return {...result,settings:m.p,history:m.history};}

window.HighTideEngine={Model,modes,modeNames,scenarios,defaults,run};
})();
