// Barakah sea-waters — the live finale.
//
// What is real here: every animal position, the six curtain sections, the route
// switch and every counter come straight from the team's High Tide v1.0 engine
// (engine.mjs, unchanged). With the cue layer off the run reproduces the archived
// seed-42 results exactly.
//
// What is staging: the offshore approach before the model domain (arrivals are
// drawn drifting in along the path the engine will spawn them on), the sonar buoys,
// the tracker mast, the breakwaters and the reactor domes. And the cue layer, which
// is an explicitly hypothetical what-if (see cue-model.js).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { CueModel } from './cue-model.js';
import { scenarios } from './engine.mjs';
import { buildJellyGeometry, instanced } from '../jelly.js';

// Model metres → world units. World origin sits mid-approach.
const OX = 52.5, OZ = 30;
const BUOYS = [[-13, 3], [-13, 30], [-13, 57]];
const BUOY_R = 15;
const ALERT_X = -32;
const LEAD = 64;            // metres of offshore water drawn ahead of the model domain
const TRACK = { x0: 12, x1: 74, y0: -6, y1: 66 };

// Same integer hash engine.mjs uses for arrival lanes (it keeps the function private).
function rand(seed, id, salt) {
  let x = (seed ^ Math.imul(id + 1, 2654435761) ^ Math.imul(salt + 1, 1597334677)) >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 2246822507); x ^= x >>> 13; x = Math.imul(x, 3266489909); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

const COL = {
  far: [0.1, 0.17, 0.3], tracked: [0.08, 0.4, 0.52], out: [0.07, 0.56, 0.3],
  back: [0.7, 0.42, 0.1], intake: [1.5, 0.3, 0.12], gone: [0.14, 0.2, 0.26],
};

const GLSL_NOISE = /* glsl */`
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
`;

// The sea floor doubles as the tactical map: grid, zones, sonar, curtain glow,
// cue plumes and the accumulated track heat-map are all drawn here.
const FLOOR_FRAG = /* glsl */`
precision highp float;
varying vec3 vW;
uniform float uTime, uSign, uCross, uCurrent, uFlash, uCue, uCueLive, uExitOpen, uAlert, uCurtain;
uniform float uActive[6];
uniform vec3 uBuoy[3];
uniform sampler2D uTrail;
${GLSL_NOISE}
float line(float v, float w) { return 1.0 - clamp(abs(v) / max(fwidth(v), 1e-4) - w, 0.0, 1.0); }
float grid(float v, float w) { float f = abs(fract(v - 0.5) - 0.5); return 1.0 - clamp(f / max(fwidth(v), 1e-4) - w, 0.0, 1.0); }

void main() {
  float mx = vW.x + ${OX.toFixed(1)}, my = vW.z + ${OZ.toFixed(1)};
  vec3 cyan = vec3(0.0, 0.92, 1.0), coral = vec3(1.0, 0.24, 0.1), mint = vec3(0.2, 1.0, 0.6), amber = vec3(1.0, 0.7, 0.2), violet = vec3(0.5, 0.22, 1.0);
  vec3 col = vec3(0.0022, 0.0075, 0.011);

  // bathymetric contours
  float bathy = fbm(vec2(mx, my) * 0.016 + 3.0) * 9.0;
  col += vec3(0.0, 0.045, 0.06) * grid(bathy, 0.0) * 0.28;

  // survey grid, 10 m and 50 m
  float g10 = max(grid(mx / 10.0, 0.0), grid(my / 10.0, 0.0));
  float g50 = max(grid(mx / 50.0, 0.4), grid(my / 50.0, 0.4));
  col += vec3(0.0, 0.085, 0.11) * g10 * 0.22 + vec3(0.0, 0.14, 0.18) * g50 * 0.32;

  float inX = step(-35.0, mx) * step(mx, 95.0);
  float inY = step(0.0, my) * step(my, 60.0);
  float zone = inX * inY;
  col += vec3(0.0, 0.016, 0.022) * zone;

  // ambient flow streaks, tilted by the cross-current
  float fv = my - mx * uCross * 0.114;
  float fu = mx - uTime * (2.0 + uCurrent * 22.0);
  float streak = smoothstep(0.72, 1.0, noise(vec2(fu * 0.045, fv * 0.85)));
  col += vec3(0.0, 0.06, 0.075) * streak * 0.55;

  // intake channel, its mouth and its pull
  float inCh = step(95.0, mx) * step(mx, 150.0) * step(18.0, my) * step(my, 42.0);
  float chFlow = smoothstep(0.55, 1.0, noise(vec2(mx * 0.2 - uTime * 2.6, my * 0.9)));
  col += coral * inCh * (0.03 + 0.06 * chFlow + 0.25 * uFlash);
  col += coral * line(mx - 95.0, 1.2) * step(18.0, my) * step(my, 42.0) * 0.7;
  float pull = exp(-pow((my - 30.0) / 18.0, 2.0)) * clamp((mx - 55.0) / 40.0, 0.0, 1.0) * step(mx, 95.0);
  float pullStreak = smoothstep(0.55, 1.0, noise(vec2(mx * 0.22 - uTime * 1.9, my * 0.6)));
  col += coral * pull * (0.018 + 0.085 * pullStreak);

  // exits: boundary lines and outward chevrons on the routed side
  float wB = clamp(uSign * 0.5 + 0.5, 0.0, 1.0), wA = 1.0 - wB;
  vec3 exitCol = mix(coral, mint, uExitOpen);
  float dashes = step(0.45, fract(mx / 5.0));
  col += exitCol * line(my - 60.0, 0.9) * inX * dashes * (0.25 + 0.75 * wB * uCurtain);
  col += exitCol * line(my, 0.9) * inX * dashes * (0.25 + 0.75 * wA * uCurtain);
  float alongEx = smoothstep(4.0, 22.0, mx) * (1.0 - smoothstep(84.0, 100.0, mx));
  float tri = abs(fract(mx / 14.0) - 0.5) * 1.3;
  float cB = fract((my - 60.0) / 9.0 - uTime * 0.45 - tri);
  float cA = fract((-my) / 9.0 - uTime * 0.45 - tri);
  float chevB = smoothstep(0.0, 0.07, cB) * smoothstep(0.24, 0.14, cB) * step(60.5, my) * (1.0 - smoothstep(64.0, 92.0, my));
  float chevA = smoothstep(0.0, 0.07, cA) * smoothstep(0.24, 0.14, cA) * step(my, -0.5) * (1.0 - smoothstep(-4.0, -32.0, my));
  col += mint * alongEx * uExitOpen * uCurtain * (chevB * wB + chevA * wA) * 0.5;

  // bubble curtain: diffuser pipe, section glow, influence band
  float slope = 0.57735 * uSign;
  float den = sqrt(1.0 + slope * slope);
  float d = (mx - (43.0 + slope * (my - 30.0))) / den;
  float secF = clamp(floor(my / 10.0), 0.0, 5.0);
  float act = uActive[int(secF)];
  float gap = step(0.035, fract(my / 10.0)) * step(fract(my / 10.0), 0.965);
  float pipe = smoothstep(0.55, 0.12, abs(d)) * inY * gap;
  col += vec3(0.08, 0.3, 0.36) * pipe * uCurtain * 0.7 + vec3(0.45, 0.95, 1.0) * pipe * act * 0.75;
  float glow = exp(-0.5 * pow(d / 3.4, 2.0)) * inY * act;
  col += cyan * glow * 0.08;

  // sonar buoys
  for (int i = 0; i < 3; i++) {
    vec2 r = vec2(mx, my) - uBuoy[i].xy;
    float dist = length(r);
    float ring = line(dist - ${BUOY_R.toFixed(1)}, 0.4) * 0.35 + line(dist - ${(BUOY_R / 2).toFixed(1)}, 0.2) * 0.14;
    float sw = fract(atan(r.y, r.x) / 6.2831853 - uTime * 0.21 - uBuoy[i].z);
    float wedge = pow(sw, 5.0) * step(dist, ${BUOY_R.toFixed(1)});
    float pulse = 0.0;
    col += cyan * (ring * 0.7 + wedge * 0.2 + pulse * 0.6);
  }

  // offshore alert line
  float al = line(mx - (${ALERT_X.toFixed(1)}), 0.9) * step(-22.0, my) * step(my, 82.0) * step(0.4, fract(my / 4.0));
  col += amber * al * (0.35 + 1.2 * uAlert);
  col += amber * exp(-pow((mx - (${ALERT_X.toFixed(1)})) / 5.0, 2.0)) * step(-22.0, my) * step(my, 82.0) * uAlert * 0.2;

  // overhead tracker footprint and scan line
  float tx0 = ${TRACK.x0.toFixed(1)}, tx1 = ${TRACK.x1.toFixed(1)}, ty0 = ${TRACK.y0.toFixed(1)}, ty1 = ${TRACK.y1.toFixed(1)};
  float inT = step(tx0, mx) * step(mx, tx1) * step(ty0, my) * step(my, ty1);
  float edgeT = max(max(line(mx - tx0, 0.5), line(mx - tx1, 0.5)) * step(ty0, my) * step(my, ty1), max(line(my - ty0, 0.5), line(my - ty1, 0.5)) * step(tx0, mx) * step(mx, tx1));
  float cornerT = step(min(abs(mx - tx0), abs(mx - tx1)), 7.0) * step(min(abs(my - ty0), abs(my - ty1)), 7.0);
  col += vec3(0.7, 0.95, 1.0) * edgeT * (0.1 + 0.55 * cornerT);
  float scanX = tx0 + (tx1 - tx0) * fract(uTime * 0.11);
  col += cyan * exp(-pow((mx - scanX) / 1.1, 2.0)) * inT * 0.05;

  // cue plumes (hypothesis layer)
  float haze1 = fbm(vec2(mx * 0.085 - uTime * 0.32, my * 0.085 + uTime * 0.05));
  float haze2 = fbm(vec2(mx * 0.07 - uTime * 0.25, my * 0.1 - uTime * 0.06) + 9.0);
  float stick = exp(-pow((mx - 78.0) / 16.0, 2.0)) * exp(-pow((my - 30.0) / 20.0, 2.0));
  col += vec3(1.0, 0.2, 0.32) * stick * (0.1 + 0.4 * haze1) * uCue * uCueLive * 0.3;
  float past = smoothstep(2.0, 9.0, d);
  float bandB = exp(-pow((my - 62.0) / 11.0, 2.0)), bandA = exp(-pow((my + 2.0) / 11.0, 2.0));
  float carrot = alongEx * (bandB * max(wB, past) + bandA * max(wA, past));
  col += violet * carrot * (0.1 + 0.45 * haze2) * uCue * uCueLive * 0.32;

  // accumulated tracks
  vec3 tr = texture2D(uTrail, vW.xz / 180.0 + 0.5).rgb;
  col += (1.0 - exp(-tr * 2.0)) * 0.28;

  col *= smoothstep(190.0, 80.0, length(vW.xz * vec2(0.85, 1.0)));
  gl_FragColor = vec4(col, 1.0);
}`;

const JELLY_VERT = /* glsl */`
attribute float aPart;
attribute vec3 aPos;
attribute vec4 aCol;
attribute float aSeed;
uniform float uTime, uScale;
varying vec3 vCol;
varying float vF;
varying float vA;
void main() {
  float ph = uTime * (2.3 + aSeed * 1.5) + aSeed * 40.0;
  float c = pow(0.5 + 0.5 * sin(ph), 2.0);
  vec3 p = position;
  if (aPart < 0.5) { float w = smoothstep(0.1, 1.0, uv.y); p.xz *= 1.0 - 0.3 * c * w; p.y += 0.14 * c * (1.0 - w); }
  else { p.xz *= 1.0 - 0.2 * c; p.y -= 0.12 * sin(ph - 1.0) * uv.y; }
  p *= uScale * (0.78 + 0.5 * aSeed) * smoothstep(0.0, 0.6, aCol.a);
  vec3 wp = p + aPos;
  wp.y += 0.4 * sin(ph * 0.5);
  vec4 mv = modelViewMatrix * vec4(wp, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  vF = pow(1.0 - abs(dot(n, normalize(-mv.xyz))), 1.5);
  vCol = aCol.rgb * 1.6; vA = aCol.a;
  gl_Position = projectionMatrix * mv;
}`;
const JELLY_FRAG = /* glsl */`
precision highp float;
varying vec3 vCol; varying float vF; varying float vA;
void main() { gl_FragColor = vec4(vCol * (0.55 + 0.9 * vF), vA * (0.22 + 0.5 * vF)); }`;

const BRACKET_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aCol;
varying vec2 vUv; varying float vA;
void main() {
  float mx = aPos.x + ${OX.toFixed(1)}, my = aPos.z + ${OZ.toFixed(1)};
  float inT = step(${TRACK.x0.toFixed(1)}, mx) * step(mx, ${TRACK.x1.toFixed(1)}) * step(${TRACK.y0.toFixed(1)}, my) * step(my, ${TRACK.y1.toFixed(1)});
  vA = inT * aCol.a;
  vUv = uv;
  vec3 wp = vec3(position.x * 3.6 + aPos.x, 0.25, position.z * 3.6 + aPos.z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(wp, 1.0);
}`;
const BRACKET_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying float vA;
void main() {
  vec2 q = abs(vUv - 0.5) * 2.0;
  float box = max(q.x, q.y);
  float edge = smoothstep(0.8, 0.86, box) * smoothstep(1.0, 0.95, box);
  float corner = step(0.5, min(q.x, q.y));
  gl_FragColor = vec4(vec3(0.6, 0.95, 1.0) * edge * corner * vA * 0.5, 1.0);
}`;

const BUBBLE_VERT = /* glsl */`
attribute float aSec, aT, aSeed;
uniform float uTime, uSign, uPx;
uniform float uActive[6];
varying float vA;
void main() {
  float my = (aSec + aT) * 10.0;
  float mx = 43.0 + 0.57735 * uSign * (my - 30.0);
  float life = fract(uTime * (0.2 + 0.22 * aSeed) + aSeed * 17.0);
  float j1 = fract(aSeed * 91.7) - 0.5, j2 = fract(aSeed * 53.3) - 0.5;
  vec3 wp = vec3(mx - ${OX.toFixed(1)} + j1 * (1.6 + life * 3.2) + sin(uTime * 2.2 + aSeed * 30.0) * 0.35 * life,
                 0.2 + life * 10.0,
                 my - ${OZ.toFixed(1)} + j2 * (1.0 + life * 2.0));
  vA = uActive[int(aSec)] * smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.7, 1.0, life));
  vec4 mv = modelViewMatrix * vec4(wp, 1.0);
  gl_PointSize = uPx * (0.5 + 1.5 * fract(aSeed * 7.3)) * (0.55 + life) / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const BUBBLE_FRAG = /* glsl */`
precision highp float;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float ring = smoothstep(0.5, 0.42, d) * smoothstep(0.24, 0.4, d) + 0.22 * smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(0.5, 0.92, 1.0) * ring * vA * 0.3, 1.0);
}`;

const RING_VERT = /* glsl */`
attribute vec3 aCenter; attribute float aT0; attribute vec3 aRCol;
uniform float uTime;
varying vec2 vUv; varying vec3 vCol; varying float vA;
void main() {
  float age = uTime - aT0;
  float life = clamp(age / 1.25, 0.0, 1.0);
  vA = step(0.0, age) * step(age, 1.25) * (1.0 - life);
  vUv = uv; vCol = aRCol;
  float r = 1.0 + life * 6.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x * r + aCenter.x, 0.3, position.z * r + aCenter.z, 1.0);
}`;
const RING_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv; varying vec3 vCol; varying float vA;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float ring = smoothstep(1.0, 0.94, d) * smoothstep(0.8, 0.92, d);
  gl_FragColor = vec4(vCol * ring * vA, 1.0);
}`;

const LABELS = [
  { id: 'intake', text: 'INTAKE', sub: 'COOLING WATER', tone: 'coral', at: [118, 30, 5] },
  { id: 'exitA', text: 'EXIT A', sub: 'OPEN WATER', tone: 'mint', at: [52, -20, 0] },
  { id: 'exitB', text: 'EXIT B', sub: 'OPEN WATER', tone: 'mint', at: [52, 82, 0] },
  { id: 'alert', text: 'OFFSHORE ALERT', sub: 'ENEC WARNING LINE', tone: 'amber', at: [ALERT_X, 84, 0] },
  { id: 'sonar', text: 'SONAR BUOYS', sub: 'TRACK ACQUISITION', tone: 'cyan', at: [-13, 57, 7] },
  { id: 'tracker', text: 'OVERHEAD TRACKER', sub: 'CAMERA · EVERY ARRIVAL', tone: 'cyan', at: [14, -10, 18] },
  { id: 'curtain', text: 'BUBBLE CURTAIN', sub: '6 SECTIONS · 30°', tone: 'cyan', at: [26, -5, 2] },
  { id: 'stick', text: '(E)-2-NONENAL', sub: 'STICK · PUSH', tone: 'coral', at: [66, 50, 2] },
  { id: 'carrot', text: 'ARTEMIA CUE', sub: 'CARROT · PULL', tone: 'violet', at: [88, 68, 2] },
  { id: 'plant', text: 'BARAKAH · UNITS 1–4', sub: 'SCHEMATIC', tone: '', at: [172, 68, 20] },
];

export function createSim(stage) {
  const $ = (id) => document.getElementById(id);
  const canvas = $('sim-canvas');
  const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch (err) {
    console.warn('[sim] WebGL unavailable', err);
    stage.classList.add('no-gl');
    return null;
  }
  const pixelRatio = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x010305, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 1, 1400);
  const W = (x, y, h = 0) => new THREE.Vector3(x - OX, h, y - OZ);

  // ── Floor / tactical map ──────────────────────────────────
  const floorU = {
    uTime: { value: 0 }, uSign: { value: 1 }, uCross: { value: 1 }, uCurrent: { value: 0.22 }, uFlash: { value: 0 },
    uCue: { value: 1 }, uCueLive: { value: 0 }, uExitOpen: { value: 1 }, uAlert: { value: 0 }, uCurtain: { value: 1 },
    uActive: { value: [0, 0, 0, 0, 0, 0] },
    uBuoy: { value: BUOYS.map((b, i) => new THREE.Vector3(b[0], b[1], i * 0.37)) },
    uTrail: { value: null },
  };
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(640, 640).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: floorU,
      vertexShader: /* glsl */`varying vec3 vW; void main() { vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fragmentShader: FLOOR_FRAG,
    }),
  );
  scene.add(floor);

  // ── Structures (schematic) ────────────────────────────────
  const structures = new THREE.Group();
  scene.add(structures);
  const solid = (color) => new THREE.MeshBasicMaterial({ color });
  const lineMat = (color, opacity) => new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  function block(x0, x1, y0, y1, h, { fill = 0x061219, edge = 0x4fd9e8, eo = 0.5 } = {}) {
    const g = new THREE.BoxGeometry(x1 - x0, h, y1 - y0);
    const m = new THREE.Mesh(g, solid(fill));
    m.position.copy(W((x0 + x1) / 2, (y0 + y1) / 2, h / 2));
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), lineMat(edge, eo)));
    structures.add(m);
    return m;
  }
  block(95, 150, 15.5, 18, 3.2, { edge: 0xff6a4a, eo: 0.7 });      // breakwater arms either side of the mouth
  block(95, 150, 42, 44.5, 3.2, { edge: 0xff6a4a, eo: 0.7 });
  block(93, 97, 13, 18, 4.4, { edge: 0xff6a4a, eo: 0.9 });         // roundheads
  block(93, 97, 42, 47, 4.4, { edge: 0xff6a4a, eo: 0.9 });
  block(150, 186, -62, 122, 2.2, { fill: 0x040c11, eo: 0.22 });    // quay
  block(150, 160, 16, 44, 9, { edge: 0xff6a4a, eo: 0.6 });         // pump house
  block(162, 182, -50, 110, 5, { fill: 0x050f15, eo: 0.3 });       // turbine halls
  const domeGeo = new THREE.SphereGeometry(7, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);
  const drumGeo = new THREE.CylinderGeometry(7, 7, 9, 14, 1, true);
  for (let u = 0; u < 4; u++) {
    const y = -27 + u * 38;
    const drum = new THREE.Mesh(drumGeo, solid(0x071821));
    drum.position.copy(W(172, y, 5 + 4.5));
    drum.add(new THREE.LineSegments(new THREE.EdgesGeometry(drumGeo, 30), lineMat(0x9feaf5, 0.45)));
    const dome = new THREE.Mesh(domeGeo, solid(0x081c26));
    dome.position.y = 4.5;
    dome.add(new THREE.LineSegments(new THREE.WireframeGeometry(domeGeo), lineMat(0x9feaf5, 0.2)));
    drum.add(dome);
    structures.add(drum);
  }

  // sonar buoys
  const beacons = [];
  for (const [bx, by] of BUOYS) {
    const g = new THREE.Group();
    g.position.copy(W(bx, by, 0));
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.4, 1.6, 10), solid(0x2b2410));
    hull.position.y = 0.8;
    hull.add(new THREE.LineSegments(new THREE.EdgesGeometry(hull.geometry, 30), lineMat(0xffc24a, 0.9)));
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.5, 5), solid(0x8a7a40));
    mast.position.y = 3.6;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.15, 1.2, 1.4) }));
    lamp.position.y = 6.1;
    g.add(hull, mast, lamp);
    beacons.push(lamp);
    structures.add(g);
  }

  // overhead tracker mast and its view frustum
  {
    const head = W(14, -10, 17);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 17, 6), solid(0x1b3a44));
    pole.position.copy(W(14, -10, 8.5));
    const cam = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.1, 1.3) }));
    cam.position.copy(head);
    const pts = [];
    for (const [cx, cy] of [[TRACK.x0, TRACK.y0], [TRACK.x1, TRACK.y0], [TRACK.x1, TRACK.y1], [TRACK.x0, TRACK.y1]]) pts.push(head.clone(), W(cx, cy, 0.3));
    const fr = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineMat(0x7fe9f5, 0.16));
    structures.add(pole, cam, fr);
  }

  // cue dosing lines (hypothesis layer)
  const cueLines = new THREE.Group();
  const tube = (a, b, color) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
    cueLines.add(l); return l;
  };
  tube(W(62, 12, 0.6), W(62, 48, 0.6), new THREE.Color(2.4, 0.5, 0.7));
  const carrotB = tube(W(8, 62, 0.6), W(98, 62, 0.6), new THREE.Color(1.3, 0.6, 2.6));
  const carrotA = tube(W(8, -2, 0.6), W(98, -2, 0.6), new THREE.Color(1.3, 0.6, 2.6));
  scene.add(cueLines);

  // ── Animals ───────────────────────────────────────────────
  const MAX = 1800;
  const aPos = new Float32Array(MAX * 3), aCol = new Float32Array(MAX * 4), aSeed = new Float32Array(MAX);
  for (let i = 0; i < MAX; i++) aSeed[i] = rand(7, i, 3);
  const jellyBase = buildJellyGeometry({ radial: 10, rings: 5, arms: 4, armSeg: 3, armRad: 4, inner: false });
  const jellyGeo = instanced(jellyBase, 0, { aPos: [aPos, 3], aCol: [aCol, 4], aSeed: [aSeed, 1] });
  const jellyMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: coarse ? 1.6 : 1.25 } },
    vertexShader: JELLY_VERT, fragmentShader: JELLY_FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const jellies = new THREE.Mesh(jellyGeo, jellyMat);
  jellies.frustumCulled = false;
  scene.add(jellies);

  // tracker brackets under every animal inside the camera footprint (shares the instance buffers)
  const bracketGeo = new THREE.InstancedBufferGeometry();
  const quad = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  bracketGeo.index = quad.index;
  bracketGeo.setAttribute('position', quad.attributes.position);
  bracketGeo.setAttribute('uv', quad.attributes.uv);
  bracketGeo.setAttribute('aPos', jellyGeo.attributes.aPos);
  bracketGeo.setAttribute('aCol', jellyGeo.attributes.aCol);
  bracketGeo.instanceCount = 0;
  const brackets = new THREE.Mesh(bracketGeo, new THREE.ShaderMaterial({
    vertexShader: BRACKET_VERT, fragmentShader: BRACKET_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  brackets.frustumCulled = false;
  scene.add(brackets);

  // ── Bubble curtain ────────────────────────────────────────
  const PER = coarse ? 130 : 260;
  const bSec = new Float32Array(6 * PER), bT = new Float32Array(6 * PER), bSeed = new Float32Array(6 * PER);
  for (let i = 0; i < 6 * PER; i++) { bSec[i] = Math.floor(i / PER); bT[i] = Math.random(); bSeed[i] = Math.random(); }
  const bubbleGeo = new THREE.BufferGeometry();
  bubbleGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6 * PER * 3), 3));
  bubbleGeo.setAttribute('aSec', new THREE.BufferAttribute(bSec, 1));
  bubbleGeo.setAttribute('aT', new THREE.BufferAttribute(bT, 1));
  bubbleGeo.setAttribute('aSeed', new THREE.BufferAttribute(bSeed, 1));
  const bubbleU = { uTime: { value: 0 }, uSign: floorU.uSign, uPx: { value: 300 }, uActive: floorU.uActive };
  const bubbles = new THREE.Points(bubbleGeo, new THREE.ShaderMaterial({
    uniforms: bubbleU, vertexShader: BUBBLE_VERT, fragmentShader: BUBBLE_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  bubbles.frustumCulled = false;
  scene.add(bubbles);

  // ── Event rings (detections, clearances, intake entries) ──
  const RINGS = 160;
  const rCenter = new Float32Array(RINGS * 3), rT0 = new Float32Array(RINGS).fill(-99), rCol = new Float32Array(RINGS * 3);
  const ringGeo = new THREE.InstancedBufferGeometry();
  ringGeo.index = quad.index;
  ringGeo.setAttribute('position', quad.attributes.position);
  ringGeo.setAttribute('uv', quad.attributes.uv);
  for (const [n, arr, s] of [['aCenter', rCenter, 3], ['aT0', rT0, 1], ['aRCol', rCol, 3]]) {
    const a = new THREE.InstancedBufferAttribute(arr, s); a.setUsage(THREE.DynamicDrawUsage); ringGeo.setAttribute(n, a);
  }
  ringGeo.instanceCount = RINGS;
  const ringU = { uTime: { value: 0 } };
  const rings = new THREE.Mesh(ringGeo, new THREE.ShaderMaterial({
    uniforms: ringU, vertexShader: RING_VERT, fragmentShader: RING_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  rings.frustumCulled = false;
  scene.add(rings);
  let ringHead = 0;
  function ping(x, y, c, scale = 1) {
    const i = ringHead; ringHead = (ringHead + 1) % RINGS;
    rCenter[i * 3] = x - OX; rCenter[i * 3 + 2] = y - OZ;
    rT0[i] = time;
    rCol[i * 3] = c[0] * scale; rCol[i * 3 + 1] = c[1] * scale; rCol[i * 3 + 2] = c[2] * scale;
    ringGeo.attributes.aCenter.needsUpdate = ringGeo.attributes.aT0.needsUpdate = ringGeo.attributes.aRCol.needsUpdate = true;
  }

  // ── Track heat-map (ping-pong accumulation) ───────────────
  const rtOpts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  let rtA = new THREE.WebGLRenderTarget(512, 512, rtOpts), rtB = new THREE.WebGLRenderTarget(512, 512, rtOpts);
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fadeMat = new THREE.ShaderMaterial({
    uniforms: { tPrev: { value: null }, uFade: { value: 0.975 } },
    vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */`precision highp float; uniform sampler2D tPrev; uniform float uFade; varying vec2 vUv; void main() { gl_FragColor = vec4(max(texture2D(tPrev, vUv).rgb * uFade - 0.0004, 0.0), 1.0); }`,
    depthTest: false, depthWrite: false,
  });
  const fadeScene = new THREE.Scene();
  fadeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMat));
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(aPos, 3));
  trailGeo.setAttribute('aCol', new THREE.BufferAttribute(aCol, 4));
  trailGeo.attributes.position.setUsage(THREE.DynamicDrawUsage);
  trailGeo.attributes.aCol.setUsage(THREE.DynamicDrawUsage);
  const trailPts = new THREE.Points(trailGeo, new THREE.ShaderMaterial({
    vertexShader: /* glsl */`attribute vec4 aCol; varying vec4 vCol; void main() { vCol = aCol; gl_Position = vec4(position.x / 90.0, position.z / 90.0, 0.0, 1.0); gl_PointSize = 2.6; }`,
    fragmentShader: /* glsl */`precision highp float; uniform float uInk; varying vec4 vCol; void main() { gl_FragColor = vec4(vCol.rgb * vCol.a * uInk, 1.0); }`,
    uniforms: { uInk: { value: 0 } },
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  trailPts.frustumCulled = false;
  const trailScene = new THREE.Scene();
  trailScene.add(trailPts);
  function clearTrails() {
    for (const rt of [rtA, rtB]) { renderer.setRenderTarget(rt); renderer.clear(); }
    renderer.setRenderTarget(null);
  }
  function renderTrails() {
    fadeMat.uniforms.tPrev.value = rtA.texture;
    renderer.setRenderTarget(rtB);
    renderer.render(fadeScene, fsCam);
    renderer.autoClear = false;
    renderer.render(trailScene, fsCam);
    renderer.autoClear = true;
    renderer.setRenderTarget(null);
    floorU.uTrail.value = rtB.texture;
    const t = rtA; rtA = rtB; rtB = t;
  }

  // ── Post ──────────────────────────────────────────────────
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: coarse ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.4, 0.62);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ── Labels ────────────────────────────────────────────────
  const labelHost = $('sim-labels');
  const labels = {};
  for (const l of LABELS) {
    const el = document.createElement('span');
    el.innerHTML = `${l.text}<b>${l.sub}</b>`;
    if (l.tone) el.classList.add(`is-${l.tone}`);
    labelHost.appendChild(el);
    labels[l.id] = { el, pos: W(...l.at), on: true };
  }
  const proj = new THREE.Vector3();

  // ── Camera ────────────────────────────────────────────────
  let VW = 1, VH = 1;
  const target = new THREE.Vector3(9, 0, 6);
  const look = { intro: 0, px: 0, py: 0, sx: 0, sy: 0 };
  function placeCamera() {
    const aspect = VW / VH;
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const wide = aspect > 1.15;
    const span = wide ? 292 : 182;                      // metres that must fit across the frame
    let dist = span / (2 * tan * aspect);
    dist = Math.max(dist, wide ? 190 : 260);
    const e = 1 - Math.pow(1 - look.intro, 3);
    const elev = THREE.MathUtils.degToRad((wide ? 54 : 62) + (1 - e) * 30) + look.sy * 0.03;
    const az = -0.13 + (1 - e) * 0.55 + look.sx * 0.05;
    const dd = dist * (1 + (1 - e) * 0.55);
    camera.position.set(
      target.x + Math.sin(az) * Math.cos(elev) * dd,
      Math.sin(elev) * dd,
      target.z + Math.cos(az) * Math.cos(elev) * dd,
    );
    camera.lookAt(target);
  }
  function resize() {
    VW = stage.clientWidth || innerWidth; VH = stage.clientHeight || innerHeight;
    renderer.setSize(VW, VH, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(VW, VH);
    camera.aspect = VW / VH;
    camera.updateProjectionMatrix();
    bubbleU.uPx.value = (VH * pixelRatio * 0.5) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  }
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    look.px = ((e.clientX - r.left) / r.width) * 2 - 1;
    look.py = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, { passive: true });

  // ── Run state ─────────────────────────────────────────────
  const ui = {
    state: $('hud-state'), time: $('hud-time'), progress: $('hud-progress'), markRev: $('hud-mark-rev'), markSw: $('hud-mark-sw'), dur: $('hud-dur'),
    arrivals: $('m-arrivals'), total: $('m-total'), tracked: $('m-tracked'), exit: $('m-exit'), retained: $('m-retained'), returned: $('m-returned'), intake: $('m-intake'), base: $('m-base'),
    sAlert: $('sys-alert'), sTrack: $('sys-track'), sCurrent: $('sys-current'), sCurtain: $('sys-curtain'), sCues: $('sys-cues'), sRoute: $('sys-route'),
    sections: [...$('sys-sections').children], log: $('hud-log'), flash: $('sim-flash'),
    end: $('sim-end'), endT: $('end-t'), endTitle: $('end-title'), endIntake: $('end-intake'), endExit: $('end-exit'), endRet: $('end-ret'), endReturned: $('end-returned'), endBase: $('end-base'), endNote: $('end-note'), endOff: $('end-off'),
    mode: $('ctl-mode'), cues: $('ctl-cues'), scenario: $('ctl-scenario'), speed: $('ctl-speed'), pause: $('ctl-pause'),
  };
  const cfg = { mode: 'controlled', cues: true, scenario: 'reversal', speed: 20 };
  const baselines = {};
  let model, N = 0, sched, lane, tracked, capT, wasOut, seen, rx, ry;
  let time = 0, acc = 0, running = false, started = false, ended = false, visible = false;
  let trackedCount = 0, pingSkip = 0, flash = 0, alert = 0, signS = 1, crossS = 1, cueS = 1, curtainS = 1;
  const act = [0, 0, 0, 0, 0, 0];
  const flags = {};
  const cache = {};
  const setText = (el, v) => { if (cache[el.id] !== v) { cache[el.id] = v; el.textContent = v; } };
  const setRow = (row, tone, value) => {
    const k = `${tone}|${value}`;
    if (cache[row.id] === k) return;
    cache[row.id] = k;
    row.className = `sys__row${tone ? ` is-${tone}` : ''}`;
    row.lastElementChild.textContent = value;
  };

  function log(msg, tone = '') {
    const p = document.createElement('p');
    if (tone) p.dataset.tone = tone;
    p.innerHTML = `<b>T+${String(Math.floor(model.t)).padStart(3, '0')}</b>${msg}`;
    ui.log.prepend(p);
    while (ui.log.children.length > 7) ui.log.lastElementChild.remove();
  }

  function baseline(name) {
    if (!(name in baselines)) baselines[name] = new CueModel({ ...scenarios[name], mode: 'none' }, false).run();
    return baselines[name];
  }

  function reset() {
    model = new CueModel({ ...scenarios[cfg.scenario], mode: cfg.mode }, cfg.cues && cfg.mode !== 'none');
    const p = model.p;
    // Replay the engine's arrival schedule so the bloom can be drawn approaching before it spawns.
    sched = [];
    for (let t = 0; t < p.duration - 1e-9 && sched.length < MAX; t += 1 / (p.arrivalRate * (p.surge && t >= p.duration / 2 ? 3 : 1))) sched.push(t);
    N = sched.length;
    lane = new Float32Array(N); tracked = new Uint8Array(N); wasOut = new Uint8Array(N); seen = new Uint8Array(N);
    capT = new Float32Array(N); rx = new Float32Array(N); ry = new Float32Array(N);
    for (let i = 0; i < N; i++) lane[i] = 12 + 36 * rand(p.seed, i, 0);
    jellyGeo.instanceCount = bracketGeo.instanceCount = N;
    trailGeo.setDrawRange(0, N);
    aCol.fill(0);
    acc = 0; ended = false; trackedCount = 0; flash = 0; alert = 0;
    for (const k of Object.keys(flags)) delete flags[k];
    ui.log.textContent = '';
    ui.end.hidden = true;
    clearTrails();
    const base = baseline(cfg.scenario);
    setText(ui.total, `/ ${N}`);
    setText(ui.base, cfg.mode === 'none' ? '' : `NO DIVERSION: ${base.intake}`);
    setText(ui.dur, `${p.duration} s`);
    const rev = p.reversal < p.duration;
    ui.markRev.style.display = rev ? '' : 'none';
    ui.markRev.style.left = `${(p.reversal / p.duration) * 100}%`;
    const sw = rev && cfg.mode === 'controlled' && p.reversal + p.delay < p.duration;
    ui.markSw.style.display = sw ? '' : 'none';
    ui.markSw.style.left = `${((p.reversal + p.delay) / p.duration) * 100}%`;
    floorU.uCurrent.value = p.current;
  }

  function start() {
    if (!model) reset();
    started = true; running = true;
    ui.pause.textContent = '❚❚'; ui.pause.setAttribute('aria-label', 'Pause');
    if (!flags.alert) {
      flags.alert = true; alert = 1;
      log('Offshore alert received. Bloom inbound on the current.', 'warn');
    }
  }
  function restart() { reset(); start(); }

  function finish() {
    ended = true; running = false;
    const m = model.metrics(), base = baseline(cfg.scenario);
    log(`Run complete. ${m.intake} intake entries, ${m.exit} cleared.`, m.intake === 0 ? 'good' : '');
    setText(ui.endT, String(Math.round(model.t)));
    setText(ui.endIntake, String(m.intake)); setText(ui.endExit, String(m.exit));
    setText(ui.endRet, String(m.retained)); setText(ui.endReturned, String(m.returned));
    setText(ui.endBase, cfg.mode === 'none' ? '' : `VS ${base.intake} UNDIVERTED`);
    let title, note;
    if (cfg.mode === 'none') {
      title = 'Nothing stood in the way.';
      note = `${m.intake} of ${m.arrivals} reached the intake.`;
    } else if (!model.p.exitOpen) {
      title = 'No safe exit. The curtain stood down.';
      note = 'No safe exit, so the system holds. Designed worst case.';
    } else if (m.intake === 0) {
      title = 'The intake stayed clear.';
      note = `Without High Tide: ${base.intake} intake entries.`;
    } else if (m.intake < base.intake * 0.5) {
      title = 'The bloom found the exit.';
      note = `${base.intake - m.intake} fewer intake entries than no diversion.`;
    } else {
      title = 'Some got through.';
      note = `${m.intake} vs ${base.intake} with no diversion. A case for the flume trial.`;
    }
    if (model.cues) note += ' Cues: hypothesis.';
    setText(ui.endTitle, title); setText(ui.endNote, note);
    ui.endOff.querySelector('span').textContent = cfg.mode === 'none' ? 'Switch it back on' : 'Now switch it all off';
    setTimeout(() => { if (ended) ui.end.hidden = false; }, 900);
  }

  function stepModel() {
    const p = model.p;
    const before = model.t;
    const ok = model.step();
    const t = model.t;
    if (before < p.reversal && t >= p.reversal) {
      log('Cross-current reversal detected at the current meter.', 'warn');
      flags.revAt = time;
    }
    if (cfg.mode === 'controlled' && before < p.reversal + p.delay && t >= p.reversal + p.delay) {
      log(`Controller re-routes to Exit A after a ${p.delay} s hold. Curtain mirrors.`, 'good');
    }
    if (before < p.failure && t >= p.failure && cfg.mode !== 'none') log('Power fault. Curtain and cue dosing offline.', 'bad');
    if (!flags.sections && model.active.some(Boolean)) {
      flags.sections = true;
      log(cfg.mode === 'fixed' ? 'All six curtain sections energised.' : 'Tracks inside 13 m of the line. Curtain sections energised.');
      if (model.cuesLive()) log('Cue dosing on: carrot at the exit arm, stick ahead of the intake.');
    }
    if (!ok) finish();
  }

  function updateAnimals(dt) {
    const p = model.p, animals = model.animals, born = animals.length;
    const t = model.t + acc;
    const k = 1 - Math.exp(-dt * 16);
    for (let i = 0; i < N; i++) {
      let tx, ty, c, a = 1;
      if (i < born) {
        const an = animals[i];
        tx = an.x; ty = an.y;
        if (!tracked[i]) { tracked[i] = 1; trackedCount++; }
        if (an.status === 'intake') {
          if (!capT[i]) { capT[i] = time; ping(98, an.y, COL.intake, 1.4); flash = Math.min(1, flash + 0.15); }
          const kk = Math.min(1, (time - capT[i]) / 1.3);
          tx = an.x + kk * 16; ty = an.y + (30 - an.y) * kk * 0.7; a = 1 - kk; c = COL.intake;
        } else if (an.status === 'other') {
          if (!capT[i]) capT[i] = time;
          a = Math.max(0, 1 - (time - capT[i]) / 1.2); c = an.everExited ? COL.out : COL.gone;
        } else if (an.outside) {
          c = COL.out;
          if (!wasOut[i]) { wasOut[i] = 1; if (pingSkip++ % 3 === 0) ping(an.x, an.y, [0.2, 1.1, 0.6], 0.9); }
        } else {
          wasOut[i] = 0;
          c = an.returned ? COL.back : COL.tracked;
        }
      } else {
        const lead = sched[i] - t;
        tx = -lead * p.current;
        if (tx < -LEAD) { aCol[i * 4 + 3] = 0; seen[i] = 0; continue; }
        ty = lane[i] + Math.sin(lead * 0.08 + i) * Math.min(1.6, lead * 0.05);
        if (!tracked[i] && started) {
          for (const [bx, by] of BUOYS) {
            if ((tx - bx) ** 2 + (ty - by) ** 2 < BUOY_R * BUOY_R) {
              tracked[i] = 1; trackedCount++;
              if (pingSkip++ % 5 === 0) ping(tx, ty, [0.2, 0.9, 1.1], 0.8);
              if (!flags.firstTrack) { flags.firstTrack = true; log('Sonar buoys acquire the first tracks. Tracker locked on.'); }
              break;
            }
          }
        }
        c = tracked[i] ? COL.tracked : COL.far;
        a = Math.min(1, (tx + LEAD) / 8) * (tracked[i] ? 0.8 : 0.5);
      }
      if (!seen[i]) { rx[i] = tx; ry[i] = ty; seen[i] = 1; }
      else { rx[i] += (tx - rx[i]) * k; ry[i] += (ty - ry[i]) * k; }
      const i3 = i * 3, i4 = i * 4;
      aPos[i3] = rx[i] - OX; aPos[i3 + 1] = 1.5; aPos[i3 + 2] = ry[i] - OZ;
      aCol[i4] = c[0]; aCol[i4 + 1] = c[1]; aCol[i4 + 2] = c[2]; aCol[i4 + 3] = a;
    }
    jellyGeo.attributes.aPos.needsUpdate = true;
    jellyGeo.attributes.aCol.needsUpdate = true;
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.attributes.aCol.needsUpdate = true;
  }

  function updateHud() {
    const p = model.p, m = model.metrics();
    setText(ui.time, String(Math.floor(model.t)).padStart(3, '0'));
    ui.progress.style.transform = `scaleX(${model.t / p.duration})`;
    setText(ui.arrivals, String(m.arrivals)); setText(ui.tracked, String(trackedCount));
    setText(ui.exit, String(m.exit)); setText(ui.retained, String(m.retained));
    setText(ui.returned, String(m.returned)); setText(ui.intake, String(m.intake));

    let label, tone = '';
    if (!started) { label = 'STANDBY · BLOOM INBOUND'; tone = 'idle'; }
    else if (ended) { label = 'RUN COMPLETE'; tone = m.intake === 0 ? '' : 'warn'; }
    else if (model.state === 'Equipment fault') { label = 'EQUIPMENT FAULT'; tone = 'bad'; }
    else if (model.state === 'Unsuitable exit') { label = 'EXIT BLOCKED · HOLDING'; tone = 'bad'; }
    else if (model.state === 'Observe only') { label = 'OBSERVE ONLY · NO DIVERSION'; tone = 'idle'; }
    else label = model.state.toUpperCase();
    if (cache.state !== label) { cache.state = label; ui.state.textContent = label; ui.state.dataset.tone = tone; }

    const cs = model.currentSign();
    const fault = model.t >= p.failure;
    const n = model.active.filter(Boolean).length;
    setRow(ui.sAlert, started ? 'warn' : '', started ? 'RECEIVED' : 'ARMED');
    setRow(ui.sTrack, trackedCount ? 'on' : '', `${trackedCount} TRACKS`);
    const justRev = flags.revAt && time - flags.revAt < 2.5;
    setRow(ui.sCurrent, justRev ? 'warn' : 'on', `${justRev ? 'REVERSED ' : ''}${cs > 0 ? '↓ TOWARD B' : '↑ TOWARD A'} · ${p.lateral.toFixed(3)} M/S`);
    if (cfg.mode === 'none') setRow(ui.sCurtain, '', 'OFF');
    else if (fault) setRow(ui.sCurtain, 'bad', 'POWER FAULT');
    else if (!p.exitOpen) setRow(ui.sCurtain, 'bad', 'HELD · EXIT CLOSED');
    else setRow(ui.sCurtain, n ? 'on' : '', `${n}/6 SECTIONS`);
    for (let j = 0; j < 6; j++) ui.sections[j].classList.toggle('is-on', !!model.active[j]);
    if (!model.cues) setRow(ui.sCues, '', 'OFF');
    else if (model.cuesLive() && started) setRow(ui.sCues, 'violet', 'DOSING · HYPOTHESIS');
    else setRow(ui.sCues, '', 'HELD');
    if (cfg.mode === 'none') setRow(ui.sRoute, '', 'NONE');
    else if (!p.exitOpen) setRow(ui.sRoute, 'bad', 'NO SAFE EXIT');
    else if (fault) setRow(ui.sRoute, 'bad', 'LOST');
    else setRow(ui.sRoute, 'good', `EXIT ${model.routeSign() > 0 ? 'B' : 'A'}`);
  }

  function updateLabels() {
    const route = model.routeSign();
    const live = cfg.mode !== 'none' && model.p.exitOpen && model.t < model.p.failure;
    labels.exitA.el.classList.toggle('is-off', !(live && route < 0));
    labels.exitB.el.classList.toggle('is-off', !(live && route > 0));
    labels.curtain.on = cfg.mode !== 'none';
    labels.stick.on = labels.carrot.on = model.cues;
    labels.carrot.pos.z = (signS > 0 ? 68 : -8) - OZ;
    labels.curtain.pos.x = 43 - 0.57735 * signS * 30 - OX - 2;
    for (const id in labels) {
      const l = labels[id];
      proj.copy(l.pos).project(camera);
      const ok = l.on && proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05;
      l.el.style.opacity = ok ? '' : '0';
      if (ok) l.el.style.transform = `translate(${((proj.x * 0.5 + 0.5) * VW).toFixed(1)}px, ${((-proj.y * 0.5 + 0.5) * VH).toFixed(1)}px) translate(10px, -50%)`;
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden || !model) return;
    time += dt;

    if (running && !ended) {
      acc += dt * cfg.speed;
      let n = 0;
      while (acc >= model.p.dt && !ended && n < 800) { stepModel(); acc -= model.p.dt; n++; }
      if (n >= 800 || ended) acc = 0;
    }

    // smoothed system state → shaders
    const e = (rate) => 1 - Math.exp(-dt * rate);
    const p = model.p;
    for (let j = 0; j < 6; j++) act[j] += ((model.active[j] && started ? 1 : 0) - act[j]) * e(9);
    signS += (model.routeSign() - signS) * e(2.4);
    crossS += (model.currentSign() * (p.lateral / 0.025) - crossS) * e(1.5);
    cueS += ((model.cues ? 1 : 0) - cueS) * e(4);
    curtainS += ((cfg.mode !== 'none' && model.t < p.failure ? 1 : 0) - curtainS) * e(4);
    flash *= Math.exp(-dt * 2.6); alert *= Math.exp(-dt * 0.5);
    floorU.uTime.value = time; floorU.uSign.value = signS; floorU.uCross.value = crossS;
    floorU.uActive.value = act; floorU.uFlash.value = flash; floorU.uAlert.value = alert;
    floorU.uCue.value = cueS; floorU.uCueLive.value += ((model.cuesLive() && started ? 1 : 0) - floorU.uCueLive.value) * e(3);
    floorU.uExitOpen.value = p.exitOpen ? 1 : 0; floorU.uCurtain.value = curtainS;
    bubbleU.uTime.value = time; ringU.uTime.value = time; jellyMat.uniforms.uTime.value = time;
    ui.flash.style.opacity = (flash * 0.25).toFixed(3);
    cueLines.visible = cueS > 0.05;
    carrotB.material.opacity = 0.25 + 0.65 * Math.max(0, signS); carrotA.material.opacity = 0.25 + 0.65 * Math.max(0, -signS);

    look.intro = Math.min(1, look.intro + dt / 3.2);
    look.sx += (look.px - look.sx) * 0.04; look.sy += (look.py - look.sy) * 0.04;
    placeCamera();

    trailPts.material.uniforms.uInk.value = running && !ended ? 0.03 : 0;
    updateAnimals(dt);
    updateHud();
    updateLabels();
    renderTrails();
    composer.render();
  }

  // ── Controls ──────────────────────────────────────────────
  const pick = (group, btn) => { for (const b of group.children) b.classList.toggle('is-on', b === btn); };
  function syncControls() {
    for (const b of ui.mode.children) b.classList.toggle('is-on', b.dataset.mode === cfg.mode);
    const off = cfg.mode === 'none';
    ui.cues.disabled = off;
    ui.cues.classList.toggle('is-on', cfg.cues && !off);
    ui.cues.setAttribute('aria-pressed', String(cfg.cues && !off));
  }
  ui.mode.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    cfg.mode = b.dataset.mode; syncControls(); restart();
  });
  ui.cues.addEventListener('click', () => { cfg.cues = !cfg.cues; syncControls(); restart(); });
  ui.scenario.addEventListener('change', () => { cfg.scenario = ui.scenario.value; restart(); });
  ui.speed.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    cfg.speed = +b.dataset.speed; pick(ui.speed, b);
  });
  ui.pause.addEventListener('click', () => {
    if (ended) return restart();
    if (!started) return start();
    running = !running;
    ui.pause.textContent = running ? '❚❚' : '▶';
    ui.pause.setAttribute('aria-label', running ? 'Pause' : 'Play');
  });
  $('ctl-restart').addEventListener('click', restart);
  $('end-again').addEventListener('click', restart);
  ui.endOff.addEventListener('click', () => {
    if (cfg.mode === 'none') { cfg.mode = 'controlled'; cfg.cues = true; } else cfg.mode = 'none';
    syncControls(); restart();
  });

  // ── Boot ──────────────────────────────────────────────────
  let last = performance.now();
  resize();
  new ResizeObserver(resize).observe(stage);
  reset();
  syncControls();
  requestAnimationFrame(frame);

  let armed = null;
  new IntersectionObserver((entries) => {
    for (const en of entries) {
      visible = en.intersectionRatio > 0.02;
      if (en.intersectionRatio > 0.55 && !started && !armed) armed = setTimeout(start, 1400);
    }
  }, { threshold: [0, 0.02, 0.3, 0.55, 0.8] }).observe(stage);

  return {
    start, restart,
    /** Headless hooks for verification. */
    get model() { return model; },
    get config() { return cfg; },
  };
}
