// High Tide — Plate 05: scroll-driven zoom from the Arabian Gulf to the Barakah intake basin.
//
// One SVG, one coordinate system: metres east (x) and metres south (y) of the centre of the
// intake frontage (52.2325° E, 23.9715° N). The Gulf coastline is Natural Earth 1:10M; the
// site geometry (shore, breakwaters, the four stepped intakes, outfall) was traced by the team
// from public satellite imagery and is indicative. Gate, cues, sensors and station positions are
// the concept layout from model/design.py, to be sited with an ENEC survey.
import { D, GULF } from './data.js';

const NS = 'http://www.w3.org/2000/svg';
const { lon: LON0, lat: LAT0, mx: MX, my: MY } = D.geo_origin;
const ll = (lon, lat) => [(lon - LON0) * MX, -(lat - LAT0) * MY];
const P = (p) => [p[0], -p[1]];                     // design.json (x, north) → svg (x, south)
const pts = (arr) => arr.map((p) => P(p).map((v) => v.toFixed(1)).join(',')).join(' ');
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (t) => t * t * (3 - 2 * t);

// ───────── Camera stops (svg units = metres) ─────────
const STEPS = [
  { name: 'ARABIAN GULF', c: ll(52.6, 26.55), w: 1_150_000 },
  { name: 'AL DHAFRA COAST', c: ll(52.215, 23.99), w: 36_000 },
  { name: 'BARAKAH · INTAKE BASIN', c: [-2300, -1500], w: 11_500 },
  { name: 'INTAKES 1–4', c: [-420, -60], w: 2_500 },
  { name: 'THE PULL', c: [-2700, -1500], w: 12_000 },
  { name: 'THE GATE', c: [-3300, -1500], w: 12_000 },
  { name: 'FULL LAYOUT', c: [-2800, -1450], w: 12_400 },
];

export function createSiteMap(root, labelsRoot, ui) {
  const L = D.layout, G = D.geo;
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const svg = el('svg', { preserveAspectRatio: 'xMidYMid slice' });
  root.appendChild(svg);
  const defs = el('defs', {}, svg);
  defs.innerHTML = `
    <marker id="m-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5cffb0"/></marker>
    <radialGradient id="m-glow"><stop offset="0" stop-color="#00ebff" stop-opacity=".55"/><stop offset="1" stop-color="#00ebff" stop-opacity="0"/></radialGradient>
    <radialGradient id="m-cglow"><stop offset="0" stop-color="#a97bff" stop-opacity=".6"/><stop offset="1" stop-color="#730fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="m-depth" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#062430"/><stop offset="1" stop-color="#020b12"/></linearGradient>`;

  // Sea
  el('rect', { x: -3e6, y: -3e6, width: 6e6, height: 6e6, class: 'm-sea' }, svg);
  const layer = (id) => el('g', { id, class: 'm-layer' }, svg);

  // Graticule (1°)
  const gGrat = layer('lay-grat');
  for (let lo = 46; lo <= 58; lo++) { const a = ll(lo, 21), b = ll(lo, 31); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'm-grat' }, gGrat); }
  for (let la = 21; la <= 31; la++) { const a = ll(45, la), b = ll(59, la); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'm-grat' }, gGrat); }
  // Fine graticule (0.01°) for site scale
  const gFine = layer('lay-fine');
  for (let i = 0; i <= 40; i++) { const lo = 52.12 + i * 0.005; const a = ll(lo, 23.93), b = ll(lo, 24.05); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'm-grat' }, gFine); }
  for (let i = 0; i <= 24; i++) { const la = 23.93 + i * 0.005; const a = ll(52.12, la), b = ll(52.32, la); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'm-grat' }, gFine); }

  // Gulf land (Natural Earth)
  const gGulf = layer('lay-gulf');
  el('path', { d: GULF, class: 'm-land', 'fill-rule': 'evenodd' }, gGulf);

  // Local land (traced) — shore polyline closed far inland
  const gLocal = layer('lay-local');
  const shoreSvg = G.shore.map(P);
  const first = shoreSvg[0], lastS = shoreSvg[shoreSvg.length - 1];
  const ext = [ll(52.43, 24.075), ll(52.48, 24.11), ll(52.56, 24.15)];
  const landPoly = [...shoreSvg, ...ext, [ext[2][0] + 40000, ext[2][1]], [ext[2][0] + 40000, 60000], [first[0] - 40000, 60000], [first[0] - 40000, first[1]]];
  el('polyline', { points: [lastS, ...ext].map((p) => p.join(',')).join(' '), class: 'm-land2', fill: 'none', 'stroke-dasharray': '4 6' }, gLocal);
  el('path', { d: 'M' + landPoly.map((p) => p.join(' ')).join('L') + 'Z', class: 'm-land2' }, gLocal);
  // reef flats east of the plant (indicative band)
  const reef = [ll(52.27, 23.985), ll(52.30, 23.993), ll(52.325, 24.012), ll(52.35, 24.03), ll(52.36, 24.045), ll(52.33, 24.05), ll(52.30, 24.03), ll(52.28, 24.005)];
  el('path', { d: 'M' + reef.map((p) => p.join(' ')).join('L') + 'Z', class: 'm-shallow' }, gLocal);

  // Site structures
  const gSite = layer('lay-site');
  // dredged channel tint between shore and the inner breakwater, in front of the intakes
  const chan = [P(G.bwW[8]), P(G.bwW[9]), P(G.bwW[10]), P(G.shore[15]), P(G.shore[14]), P(G.shore[13])];
  el('path', { d: 'M' + chan.map((p) => p.join(' ')).join('L') + 'Z', class: 'm-chan' }, gSite);
  el('polygon', { points: pts(G.plant), class: 'm-plant' }, gSite);
  // four reactor domes behind the four intakes (schematic)
  G.intakes.forEach((it) => { const x = (it.a[0] + it.b[0]) / 2; el('circle', { cx: x, cy: 520, r: 38, class: 'm-dome' }, gSite); });
  el('polyline', { points: pts(G.bwW), class: 'm-bw' }, gSite);
  el('polyline', { points: pts(G.bwE), class: 'm-bw' }, gSite);
  // outfall + warm-water route out to the east
  const of = P(G.outfall);
  el('circle', { cx: of[0], cy: of[1], r: 120, class: 'm-out' }, gSite);
  const warm = [of, [of[0] + 260, of[1] - 700], [of[0] + 900, of[1] - 1600], [of[0] + 2400, of[1] - 2600]];
  el('path', { d: 'M' + warm.map((p) => p.join(' ')).join('L'), class: 'm-flow m-flow--warm' }, gSite);
  // intake flow arrows through the basin into the channel
  const inflow = [[-7600, -1800], [-4200, -900], [-2200, -350], [-1100, -40], [-150, 120]];
  el('path', { d: 'M' + inflow.map((p) => p.join(' ')).join('L'), class: 'm-flow' }, gSite);

  // Intakes 1–4
  const gIntake = layer('lay-intakes');
  G.intakes.forEach((it) => { const a = P(it.a), b = P(it.b); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'm-intake' }, gIntake); });

  // Point of no return: interpolate along the west breakwater where pull = swim speed
  const gNR = layer('lay-nr');
  const prof = D.pull_profile.slice(0, 8);            // indices map to bwW[1..8]
  let nrA = null;
  for (let i = 0; i < prof.length - 1; i++) {
    const a = prof[i], b = prof[i + 1];
    if (a.dist_km >= D.no_return_km && b.dist_km <= D.no_return_km) {
      const f = (a.dist_km - D.no_return_km) / (a.dist_km - b.dist_km);
      const p1 = G.bwW[i + 1], p2 = G.bwW[i + 2];
      nrA = [lerp(p1[0], p2[0], f), lerp(p1[1], p2[1], f)];
    }
  }
  if (nrA) {
    const nearest = G.shore.reduce((m, q) => (Math.hypot(q[0] - nrA[0], q[1] - nrA[1]) < Math.hypot(m[0] - nrA[0], m[1] - nrA[1]) ? q : m));
    const a = P(nrA), b = P(nearest);
    el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'm-nr' }, gNR);
  }

  // Bloom particles
  const gBloom = layer('lay-bloom');

  // Gate lines
  const gGate = layer('lay-gate');
  const gateA = el('polyline', { points: pts(L.gateA), class: 'm-gate' }, gGate);
  const gateB = el('polyline', { points: pts(L.gateB), class: 'm-gate m-gate--off' }, gGate);
  const head = P(L.gateA[1]), apex = P(L.gateA[0]);
  const exitN = [head, [head[0] + 300, head[1] - 900], [head[0] + 1800, head[1] - 1500]];
  const exitW = [apex, [apex[0] - 900, apex[1] - 200], [apex[0] - 2400, apex[1] - 380]];
  const exN = el('path', { d: 'M' + exitN.map((p) => p.join(' ')).join('L'), class: 'm-exit' }, gGate);
  const exW = el('path', { d: 'M' + exitW.map((p) => p.join(' ')).join('L'), class: 'm-exit' }, gGate);
  el('circle', { cx: head[0], cy: head[1], r: 420, fill: 'url(#m-glow)' }, gGate);

  // Cues, guard, sensors, station, feeders
  const gCues = layer('lay-cues');
  const st = P(G.station);
  const feed = (to) => el('path', { d: `M${st[0]} ${st[1]}Q${(st[0] + to[0]) / 2} ${Math.max(st[1], to[1]) + 200} ${to[0]} ${to[1]}`, class: 'm-feed' }, gCues);
  const mid = P(L.mid);
  feed(mid); feed(P(L.stick[0])); feed(P(L.carrotW)); feed(P(L.guard[1]));
  el('polyline', { points: pts(G.bwW.slice(1, 9)).split(' ').map((s) => s.split(',').map(Number)).map((p) => [p[0] + 40, p[1] + 40].join(',')).join(' '), class: 'm-feed' }, gCues);
  el('polyline', { points: pts(L.stick), class: 'm-stick' }, gCues);
  el('polyline', { points: pts(L.guard), class: 'm-guard' }, gCues);
  const g2 = L.guard.map(P).map((p) => [p[0] + 40, p[1] + 10]);
  el('polyline', { points: g2.map((p) => p.join(',')).join(' '), class: 'm-guard' }, gCues);
  for (const c of [L.carrotN, L.carrotW]) { const p = P(c); el('circle', { cx: p[0], cy: p[1], r: 520, fill: 'url(#m-cglow)' }, gCues); el('circle', { cx: p[0], cy: p[1], r: 70, class: 'm-carrot' }, gCues); }
  const gSense = layer('lay-sense');
  const sq = (p, s = 90) => el('rect', { x: p[0] - s / 2, y: p[1] - s / 2, width: s, height: s, class: 'm-sense', transform: `rotate(45 ${p[0]} ${p[1]})` }, gSense);
  [...L.cams, ...L.adcp, ...L.sonar].forEach((p) => sq(P(p), 80));
  el('rect', { x: st[0] - 110, y: st[1] - 110, width: 220, height: 220, class: 'm-station' }, gSense);

  // Barakah pin (gulf / coast scale)
  const gPin = layer('lay-pin');
  const pinRing = el('circle', { cx: 0, cy: 0, r: 2400, class: 'm-ring' }, gPin);
  const pinDot = el('circle', { cx: 0, cy: 0, r: 900, class: 'm-pin' }, gPin);

  const layers = { grat: gGrat, fine: gFine, gulf: gGulf, local: gLocal, site: gSite, intakes: gIntake, nr: gNR, bloom: gBloom, gate: gGate, cues: gCues, sense: gSense, pin: gPin };

  // ───────── Labels ─────────
  const LBL = [];
  const lab = (pos, html, cls = '', steps = [0, 6], wmax = Infinity, wmin = 0) => {
    const n = document.createElement('span');
    n.className = 'sl ' + cls; n.innerHTML = html; labelsRoot.appendChild(n);
    LBL.push({ n, x: pos[0], y: pos[1], steps, wmax, wmin });
  };
  lab(ll(51.2, 27.6), 'ARABIAN GULF', 'sl--big', [0, 0]);
  lab(ll(54.6, 23.75), 'UNITED ARAB EMIRATES', 'sl--big', [0, 0]);
  lab(ll(50.9, 25.25), 'QATAR', 'sl--big', [0, 0]);
  lab(ll(48.6, 25.6), 'SAUDI ARABIA', 'sl--big', [0, 0]);
  lab(ll(53.4, 28.9), 'IRAN', 'sl--big', [0, 0]);
  lab(ll(56.25, 26.75), 'STRAIT OF HORMUZ', '', [0, 0]);
  lab(ll(54.37, 24.45), 'ABU DHABI<small>CITY</small>', '', [0, 0]);
  lab([0, 0], 'BARAKAH<small>4 × APR-1400 · 5.6 GW</small>', 'sl--cyan sl--pin', [0, 1]);
  lab(ll(52.31, 24.115), 'MARAWAH MARINE BIOSPHERE RESERVE ↗<small>≈100 KM NE · DUGONGS, SEAGRASS</small>', 'sl--mint', [1, 1]);
  lab(ll(52.06, 23.985), '← RUWAIS ≈50 KM', '', [1, 1]);
  lab(ll(52.11, 23.99), 'BARAKAH BAY', 'sl--big', [1, 1]);
  lab(ll(52.33, 24.06), 'REEF FLATS', '', [1, 2]);
  lab(ll(52.15, 24.035), 'OPEN GULF<small>TIDAL CURRENT ⇄ ALONGSHORE</small>', '', [2, 6]);
  lab(P(G.bwW[2]), 'WEST BREAKWATER<small>SHIELDS THE INTAKE</small>', '', [2, 2]);
  lab(P(G.bwE[1]), 'EAST BREAKWATER', '', [2, 3]);
  lab([-3600, -400], 'INTAKE BASIN<small>WATER DRAWN IN FROM THE WEST</small>', '', [2, 2]);
  lab(P(G.outfall), 'OUTFALL<small>WARM WATER OUT, EAST</small>', 'sl--amber', [2, 3]);
  lab([-260, -260], 'DREDGED CHANNEL<small>5.5–9.5 M · ≈0.27 M/S</small>', '', [3, 3]);
  lab([-200, 700], 'UNITS 1–4', '', [2, 3]);
  G.intakes.forEach((it, i) => { const a = P(it.a); lab([a[0] + 20, a[1] + 60], `INTAKE ${i + 1}<small>≈50 T/DAY ON A PEAK DAY</small>`, 'sl--coral', [3, 3]); });
  lab(P(G.intakes[0].a), 'INTAKES 1–4', 'sl--coral', [2, 2]);
  if (nrA) lab(P(nrA), `POINT OF NO RETURN<small>${D.no_return_km} KM OUT · PULL = SWIM SPEED</small>`, 'sl--amber', [4, 4]);
  lab([-6200, -1400], 'PULL ≈ 3 CM/S<small>A JELLYFISH CAN STILL LEAVE</small>', 'sl--mint', [4, 4]);
  lab([-1500, -300], 'PULL ≈ 12–27 CM/S<small>ONE-WAY TRIP</small>', 'sl--coral', [4, 4]);
  lab(P(L.gateA[1]), 'EXIT N<small>FLOOD · ROUND THE HEAD</small>', 'sl--mint', [5, 6]);
  lab([apex[0] - 300, apex[1] - 120], 'EXIT W<small>EBB · ALONG THE SHORE</small>', 'sl--mint', [5, 6]);
  const am = P([(L.gateA[0][0] + L.gateA[1][0]) / 2, (L.gateA[0][1] + L.gateA[1][1]) / 2]);
  const bm = P([(L.gateB[0][0] + L.gateB[1][0]) / 2, (L.gateB[0][1] + L.gateB[1][1]) / 2]);
  lab([am[0] - 900, am[1] - 400], `GATE LINE A<small>${D.lengths_m.gateA.toLocaleString('en')} M · ${D.air.gateA.sections_50m} SECTIONS</small>`, 'sl--cyan', [5, 6]);
  lab([bm[0] + 250, bm[1] - 300], `GATE LINE B<small>${D.lengths_m.gateB.toLocaleString('en')} M · ${D.air.gateB.sections_50m} SECTIONS</small>`, 'sl--cyan', [5, 6]);
  lab(P(L.stick[0]), 'STICK BAND<small>600 M · PULSED · NONENAL</small>', 'sl--coral', [6, 6]);
  lab([P(L.carrotN)[0] - 1400, P(L.carrotN)[1] - 250], 'CARROT N<small>ARTEMIA WATER</small>', 'sl--violet', [6, 6]);
  lab([P(L.carrotW)[0] - 300, P(L.carrotW)[1] + 260], 'CARROT W<small>ARTEMIA WATER</small>', 'sl--violet', [6, 6]);
  lab(P(L.guard[0]), 'GUARD<small>2 × 375 M · ON BREACH</small>', 'sl--cyan', [6, 6]);
  lab(P(G.station), 'SHORE STATION<small>5 × 250 KW · DOSING · CULTURE</small>', 'sl--amber', [6, 6]);
  lab(P(L.cams[1]), 'CAMERA MAST<small>+ ADCP</small>', 'sl--amber', [6, 6]);
  lab(P(L.mid), 'SONAR + ADCP', 'sl--amber', [6, 6]);

  // ───────── Particles ─────────
  const N = 64;
  const rnd = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
  const segHit = (p, q, a, b) => {
    const r = [q[0] - p[0], q[1] - p[1]], s = [b[0] - a[0], b[1] - a[1]];
    const den = r[0] * s[1] - r[1] * s[0]; if (Math.abs(den) < 1e-9) return null;
    const t = ((a[0] - p[0]) * s[1] - (a[1] - p[1]) * s[0]) / den, u = ((a[0] - p[0]) * r[1] - (a[1] - p[1]) * r[0]) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [p[0] + t * r[0], p[1] + t * r[1]] : null;
  };
  const A = L.gateA.map(P), B = L.gateB.map(P);
  const parts = [];
  for (let i = 0; i < N; i++) {
    const c = el('circle', { r: 30, class: 'm-jelly' }, gBloom);
    parts.push({ c, i, s: rnd(i, 1) * 1, path: null, len: 0, d: 0, speed: 0 });
  }
  const pathLen = (pp) => pp.reduce((a, p, k) => (k ? a + Math.hypot(p[0] - pp[k - 1][0], p[1] - pp[k - 1][1]) : 0), 0);
  let mode = 'intake', tide = 'flood', tideT = 0;
  function route(p) {
    const S = [lerp(-10500, -6800, rnd(p.i, p.k || 2)), lerp(-4600, 200, rnd(p.i, (p.k || 2) + 7))];
    const T = [lerp(-800, 600, rnd(p.i, 5)), lerp(40, 160, rnd(p.i, 6))];
    const C = [-2400, lerp(-1400, -200, rnd(p.i, 9))];
    let path;
    if (mode === 'intake') {
      path = []; for (let k = 0; k <= 16; k++) { const t = k / 16; path.push([(1 - t) ** 2 * S[0] + 2 * (1 - t) * t * C[0] + t * t * T[0], (1 - t) ** 2 * S[1] + 2 * (1 - t) * t * C[1] + t * t * T[1]]); }
    } else {
      const line = tide === 'flood' ? A : B;
      const hitP = segHit(S, C, line[0], line[1]) || segHit(S, T, line[0], line[1]);
      if (!hitP) path = [S, [S[0] + 1500, S[1]]];
      else if (tide === 'flood') path = [S, hitP, head, ...exitN.slice(1).map((q) => [q[0] + rnd(p.i, 11) * 300, q[1] - rnd(p.i, 12) * 300])];
      else path = [S, hitP, apex, ...exitW.slice(1).map((q) => [q[0] - rnd(p.i, 11) * 300, q[1] + rnd(p.i, 12) * 200])];
    }
    p.path = path; p.len = pathLen(path); p.d = 0; p.speed = lerp(650, 1000, rnd(p.i, 4)); p.k = (p.k || 2) + 13;
  }
  parts.forEach((p) => { route(p); p.d = rnd(p.i, 3) * p.len; });
  const at = (pp, d) => {
    for (let k = 1; k < pp.length; k++) {
      const l = Math.hypot(pp[k][0] - pp[k - 1][0], pp[k][1] - pp[k - 1][1]);
      if (d <= l) { const t = l ? d / l : 0; return [lerp(pp[k - 1][0], pp[k][0], t), lerp(pp[k - 1][1], pp[k][1], t)]; }
      d -= l;
    }
    return pp[pp.length - 1];
  };

  // ───────── Camera + render ─────────
  let W = 1, H = 1, cam = { cx: 0, cy: 0, w: 1 }, step = 0, live = false, last = 0;
  const resize = () => { const r = root.getBoundingClientRect(); W = r.width || 1; H = r.height || 1; apply(); };
  function apply() {
    const wv = cam.w * (W < 700 ? 0.6 : 1);
    const h = wv * H / W;
    const cx = cam.cx + (W > 900 ? wv * 0.15 : 0), cy = cam.cy + (W > 900 ? 0 : h * 0.18);
    svg.setAttribute('viewBox', `${cx - wv / 2} ${cy - h / 2} ${wv} ${h}`);
    const k = W / wv;                                       // px per metre
    for (const l of LBL) {
      const on = step >= l.steps[0] && step <= l.steps[1];
      const x = (l.x - (cx - wv / 2)) * k, y = (l.y - (cy - h / 2)) * k;
      const vis = on && x > -50 && x < W + 50 && y > 0 && y < H;
      l.n.style.opacity = vis ? 1 : 0;
      l.n.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
    // land crossfade by zoom
    const tLocal = clamp01((Math.log(140_000) - Math.log(cam.w)) / (Math.log(140_000) - Math.log(40_000)));
    gGulf.style.opacity = 1 - tLocal; gLocal.style.opacity = tLocal;
    gGrat.style.opacity = 1 - tLocal; gFine.style.opacity = clamp01((Math.log(30_000) - Math.log(cam.w)) / 1.2);
    gPin.style.opacity = clamp01((Math.log(cam.w) - Math.log(25_000)) / 1.2);
    pinDot.setAttribute('r', 5 / k); pinRing.setAttribute('r', 16 / k);
    // particle radius in px
    const r = 3.4 / k; parts.forEach((p) => p.c.setAttribute('r', r));
    // scale bar
    const target = 120 / k, mag = 10 ** Math.floor(Math.log10(target));
    const nice = [1, 2, 5, 10].map((m) => m * mag).filter((v) => v <= target).pop() || mag;
    ui.scaleBar.style.width = `${(nice * k / 120) * 100}%`;
    ui.scale.textContent = nice >= 1000 ? `${(nice / 1000).toLocaleString('en')} km` : `${nice} m`;
    const lon = LON0 + cam.cx / MX, lat = LAT0 - cam.cy / MY;
    ui.coords.textContent = `${lat.toFixed(lat > 25 ? 1 : 3)}° N · ${lon.toFixed(lon > 53 ? 1 : 3)}° E`;
  }
  const vis = (g, on) => { g.style.opacity = on ? 1 : 0; };
  function setStepVisuals(s) {
    vis(gSite, s >= 1); vis(gIntake, s >= 1); vis(gNR, s === 4); vis(gBloom, s >= 4);
    vis(gGate, s >= 5); vis(gCues, s >= 6); vis(gSense, s >= 6);
    ui.legend.classList.toggle('is-on', s >= 5);
    const newMode = s >= 5 ? 'gate' : 'intake';
    if (newMode !== mode) { mode = newMode; parts.forEach((p) => { route(p); p.d = rnd(p.i, 3 + p.k) * p.len * 0.6; }); }
    ui.cards.forEach((c, i) => c.classList.toggle('is-on', i === s));
    ui.stepName.textContent = STEPS[s].name;
  }
  function setProgress(p) {
    const f = clamp01(p) * (STEPS.length - 1);
    const i = Math.min(STEPS.length - 2, Math.floor(f));
    const t = ease(clamp01((f - i - 0.3) / 0.7));
    const a = STEPS[i], b = STEPS[i + 1];
    const lw = lerp(Math.log(a.w), Math.log(b.w), t);
    // keep zoom and pan coherent: weight the pan by the zoom progress
    const tz = (Math.log(a.w) === Math.log(b.w)) ? t : clamp01((lw - Math.log(a.w)) / (Math.log(b.w) - Math.log(a.w)));
    cam = { cx: lerp(a.c[0], b.c[0], tz), cy: lerp(a.c[1], b.c[1], tz), w: Math.exp(lw) };
    const ns = Math.min(STEPS.length - 1, Math.max(0, f - i < 0.3 ? i : (t > 0.5 ? i + 1 : i)));
    if (ns !== step) { step = ns; setStepVisuals(step); }
    apply();
    ui.progress.style.transform = `scaleX(${clamp01(p)})`;
  }
  function tick(now) {
    if (!live) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (step >= 4) {
      tideT += dt;
      if (mode === 'gate' && tideT > 7) { tideT = 0; tide = tide === 'flood' ? 'ebb' : 'flood'; gateA.classList.toggle('m-gate--off', tide !== 'flood'); gateB.classList.toggle('m-gate--off', tide === 'flood'); exN.style.opacity = tide === 'flood' ? 1 : 0.15; exW.style.opacity = tide === 'flood' ? 0.15 : 1; }
      for (const p of parts) {
        p.d += p.speed * dt;
        if (p.d >= p.len) route(p);
        const q = at(p.path, p.d);
        p.c.setAttribute('cx', q[0].toFixed(0)); p.c.setAttribute('cy', q[1].toFixed(0));
        const endFrac = p.d / p.len;
        p.c.style.opacity = endFrac < 0.06 ? endFrac / 0.06 : endFrac > 0.92 ? (1 - endFrac) / 0.08 : 1;
        p.c.style.fill = mode === 'intake' && endFrac > 0.7 ? '#ff5a3c' : (mode === 'gate' && endFrac > 0.55 ? '#5cffb0' : '#e9f6ff');
      }
    }
    requestAnimationFrame(tick);
  }
  exW.style.opacity = 0.15;
  addEventListener('resize', resize);
  resize(); setStepVisuals(0); setProgress(0);
  return {
    setProgress,
    setLive(v) { if (v && !live) { live = true; last = 0; requestAnimationFrame(tick); } else if (!v) live = false; },
    steps: STEPS.length,
  };
}
