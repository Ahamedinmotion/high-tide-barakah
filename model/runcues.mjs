import { scenarios } from '../js/sim/engine.mjs';
import { CueModel } from '../js/sim/cue-model.js';
const out=[];
for (const [name,sc] of Object.entries(scenarios)) for (const mode of ['none','fixed','controlled']) for (const cues of [false,true]) {
  const r={intake:0,exit:0,retained:0,other:0,returned:0,arrivals:0,actuation:0};
  for (const seed of [42,7,91]) { const m=new CueModel({...sc,mode,seed},cues); const x=m.run(); for(const k of ['intake','exit','retained','other','returned','arrivals']) r[k]+=x[k]/3; r.actuation+=x.actuationIndex/3; }
  out.push({scenario:name,mode,cues,...Object.fromEntries(Object.entries(r).map(([k,v])=>[k,+v.toFixed(1)]))});
}
console.log(JSON.stringify(out));
