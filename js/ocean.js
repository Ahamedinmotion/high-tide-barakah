// The water the whole page sits in: light shafts, marine snow and a drifting bloom
// of procedural jellyfish. Scroll drives `state`; this module only reads it.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildJellyGeometry, instanced, jellyMaterial } from './jelly.js';

const NOISE = /* glsl */`
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
`;

const BACKDROP_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform float uTime, uDepth, uIntake, uAspect;
uniform vec2 uMouse;
${NOISE}
void main() {
  vec2 uv = vUv;
  float d = uDepth;
  vec3 top = mix(vec3(0.0045, 0.062, 0.088), vec3(0.0012, 0.011, 0.019), d);
  vec3 bottom = mix(vec3(0.0006, 0.0075, 0.015), vec3(0.0003, 0.002, 0.0042), d);
  vec3 col = mix(bottom, top, pow(uv.y, 1.3));

  // Light shafts fanning down from a sun above the frame.
  vec2 src = vec2(0.5 + 0.1 * sin(uTime * 0.06) + uMouse.x * 0.04, 1.28);
  vec2 dir = vec2((uv.x - src.x) * uAspect, uv.y - src.y);
  float ang = atan(dir.x, -dir.y);
  float len = length(dir);
  float r1 = fbm(vec2(ang * 7.0 + uTime * 0.025, uTime * 0.09));
  float r2 = fbm(vec2(ang * 19.0 - uTime * 0.04, uTime * 0.15 + 4.0));
  float rays = smoothstep(0.42, 0.9, r1 * 0.7 + r2 * 0.5);
  rays *= smoothstep(1.95, 0.2, len) * smoothstep(1.0, 0.15, abs(ang));
  float lit = 1.0 - d * 0.88;
  col += vec3(0.03, 0.24, 0.3) * rays * lit * 0.42;
  col += vec3(0.012, 0.13, 0.17) * pow(smoothstep(1.3, 0.15, len), 2.0) * lit * 0.5;

  // Slow caustic shimmer in the upper water.
  float ca = fbm(uv * vec2(uAspect, 1.0) * 5.0 + vec2(uTime * 0.05, -uTime * 0.03));
  col += vec3(0.0, 0.07, 0.085) * smoothstep(0.5, 0.85, ca) * smoothstep(0.25, 1.0, uv.y) * lit * 0.25;

  // The intake: a hot glow pulling in from the right.
  float ig = smoothstep(0.3, 1.08, uv.x);
  col += vec3(0.62, 0.1, 0.045) * ig * ig * uIntake * 0.4;
  gl_FragColor = vec4(col, 1.0);
}`;

const SNOW_VERT = /* glsl */`
attribute vec4 aSeed;
uniform float uTime, uPx;
uniform vec3 uDrift, uBox;
varying float vA;
void main() {
  vec3 p = mod(position + uDrift * (0.55 + aSeed.x) + uBox * 0.5, uBox) - uBox * 0.5;
  p.x += sin(uTime * 0.4 + aSeed.y * 30.0) * 0.25;
  p.y += cos(uTime * 0.3 + aSeed.z * 30.0) * 0.25;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;
  vA = (0.55 + 0.2 * sin(uTime * 0.4 + aSeed.y * 40.0)) * exp(-0.03 * dist) * smoothstep(0.5, 3.0, dist);
  gl_PointSize = uPx * (0.5 + aSeed.w * 1.4) / dist;
  gl_Position = projectionMatrix * mv;
}`;
const SNOW_FRAG = /* glsl */`
precision highp float;
uniform float uIntensity;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float s = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(0.5, 0.85, 0.95) * s * s * vA * 0.3 * uIntensity, 1.0);
}`;

const FINAL = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    precision highp float;
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 uv = vUv;
            vec2 c = uv - 0.5; float d = dot(c, c);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * d * 0.006).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * d * 0.006).b;
      col *= 1.0 - d * 1.15;
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }`,
};

export function createOcean(canvas) {
  const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch (err) {
    console.warn('[ocean] WebGL unavailable', err);
    return null;
  }
  let pixelRatio = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.6);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);
  camera.position.set(0, 0, 16);

  /** Everything scroll and pointer drive. main.js tweens these numbers. */
  const state = { depth: 0, flow: 0, intake: 0, swarm: 1, specimen: 0, spin: 0, active: true };
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, live: false };

  // ── Backdrop ──────────────────────────────────────────────
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uDepth: { value: 0 }, uIntake: { value: 0 }, uAspect: { value: 1 }, uMouse: { value: new THREE.Vector2() } },
      vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: BACKDROP_FRAG,
      depthTest: false, depthWrite: false,
    }),
  );
  backdrop.frustumCulled = false;
  backdrop.renderOrder = -10;
  scene.add(backdrop);

  // ── Marine snow ───────────────────────────────────────────
  const BOX = new THREE.Vector3(60, 34, 44);
  const snowN = coarse ? 900 : 2400;
  const snowPos = new Float32Array(snowN * 3), snowSeed = new Float32Array(snowN * 4);
  for (let i = 0; i < snowN; i++) {
    snowPos[i * 3] = (Math.random() - 0.5) * BOX.x;
    snowPos[i * 3 + 1] = (Math.random() - 0.5) * BOX.y;
    snowPos[i * 3 + 2] = (Math.random() - 0.5) * BOX.z;
    for (let k = 0; k < 4; k++) snowSeed[i * 4 + k] = Math.random();
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  snowGeo.setAttribute('aSeed', new THREE.BufferAttribute(snowSeed, 4));
  const snowMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: 60 }, uDrift: { value: new THREE.Vector3() }, uBox: { value: BOX }, uIntensity: { value: 1 } },
    vertexShader: SNOW_VERT, fragmentShader: SNOW_FRAG,
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  const snow = new THREE.Points(snowGeo, snowMat);
  snow.position.z = -8;
  snow.frustumCulled = false;
  scene.add(snow);

  // ── The bloom ─────────────────────────────────────────────
  let N = coarse ? 46 : 120;
  const VOL = { x: 27, y: 14.5, z0: -32, z1: 5 };
  const iPos = new Float32Array(N * 3), iQuat = new Float32Array(N * 4), iMisc = new Float32Array(N * 4), iTint = new Float32Array(N * 3);
  const dir = new Float32Array(N * 3), wander = new Float32Array(N * 2);
  const TINTS = [[0.2, 0.72, 1.0], [0.12, 0.86, 1.0], [0.46, 0.46, 1.0], [0.72, 0.9, 1.0], [0.3, 0.6, 1.0]];
  const v3 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) {
    iPos[i * 3] = (Math.random() * 2 - 1) * VOL.x;
    iPos[i * 3 + 1] = (Math.random() * 2 - 1) * VOL.y;
    iPos[i * 3 + 2] = VOL.z0 + Math.random() * (VOL.z1 - VOL.z0);
    const scale = 0.42 + Math.pow(Math.random(), 2.2) * 1.25;
    iMisc[i * 4] = scale;
    iMisc[i * 4 + 1] = Math.random() * 6.283;
    iMisc[i * 4 + 2] = 2.5 - scale * 0.7 + Math.random() * 0.5;
    iMisc[i * 4 + 3] = Math.random();
    const t = TINTS[(Math.random() * TINTS.length) | 0];
    iTint.set(t, i * 3);
    v3.set(Math.random() - 0.5, 0.55 + Math.random() * 0.9, (Math.random() - 0.5) * 0.7).normalize();
    dir.set([v3.x, v3.y, v3.z], i * 3);
    wander[i * 2] = Math.random() * 100; wander[i * 2 + 1] = 0.3 + Math.random() * 0.5;
    iQuat.set([0, 0, 0, 1], i * 4);
  }
  const swarmBase = buildJellyGeometry(coarse ? { radial: 20, rings: 10, armSeg: 5, armRad: 5 } : { radial: 28, rings: 14, armSeg: 7, armRad: 6 });
  const swarmGeo = instanced(swarmBase, N, { iPos: [iPos, 3], iQuat: [iQuat, 4], iMisc: [iMisc, 4], iTint: [iTint, 3] });
  const swarmMat = jellyMaterial({ intensity: 0.62 });
  const swarm = new THREE.Mesh(swarmGeo, swarmMat);
  swarm.frustumCulled = false;
  scene.add(swarm);

  // ── The specimen (chapter 03) ─────────────────────────────
  const sPos = new Float32Array(3), sQuat = new Float32Array([0, 0, 0, 1]), sMisc = new Float32Array([1, 0, 1.9, 0.37]), sTint = new Float32Array([0.24, 0.78, 1.0]);
  const specBase = buildJellyGeometry(coarse ? { radial: 48, rings: 24, armSeg: 12, armRad: 8 } : { radial: 84, rings: 40, armSeg: 20, armRad: 12 });
  const specGeo = instanced(specBase, 1, { iPos: [sPos, 3], iQuat: [sQuat, 4], iMisc: [sMisc, 4], iTint: [sTint, 3] });
  const specMat = jellyMaterial({ intensity: 0, fog: 0 });
  const specimen = new THREE.Mesh(specGeo, specMat);
  specimen.frustumCulled = false;
  specimen.visible = false;
  scene.add(specimen);
  let anchor = null;                    // DOM element the specimen sits inside
  const SPEC_DIST = 11;
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), ex = new THREE.Vector3(1, 0, 0), ez = new THREE.Vector3(0, 0, 1);

  // ── Post ──────────────────────────────────────────────────
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.5, 0.55);
  composer.addPass(bloom);
  const finalPass = new ShaderPass(FINAL);
  composer.addPass(finalPass);
  composer.addPass(new OutputPass());

  let W = 1, H = 1;
  function resize() {
    W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(W, H, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    backdrop.material.uniforms.uAspect.value = W / H;
    snowMat.uniforms.uPx.value = H * pixelRatio * 0.085;
    finalPass.uniforms.uRes.value.set(W * pixelRatio, H * pixelRatio);
  }
  resize();
  addEventListener('resize', resize);

  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / innerHeight) * 2 - 1);
    pointer.live = e.pointerType !== 'touch';
  }, { passive: true });

  const ray = new THREE.Raycaster();
  const drift = snowMat.uniforms.uDrift.value;
  let time = 0, last = performance.now(), slow = 0, frames = 0, tuned = false, firstFrame = null;
  const ready = new Promise((res) => { firstFrame = res; });

  function updateSwarm(dt) {
    const flowV = state.flow * 3.4;
    const R = 4.2;
    ray.setFromCamera(pointer, camera);
    const o = ray.ray.origin, d = ray.ray.direction;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3, i4 = i * 4;
      const scale = iMisc[i4];
      const ph = iMisc[i4 + 1] + time * iMisc[i4 + 2];
      const s = Math.sin(ph), thrust = s > 0 ? s * s : 0;
      // slow wander of the heading, biased upward and (under flow) down-current
      const wt = time * wander[i * 2 + 1] + wander[i * 2];
      let dx = dir[i3] + (Math.sin(wt) * 0.5 + state.flow * 0.9) * dt;
      let dy = dir[i3 + 1] + (0.22 - state.flow * 0.2 + Math.sin(wt * 0.7) * 0.2) * dt;
      let dz = dir[i3 + 2] + Math.cos(wt * 1.3) * 0.35 * dt;
      let px = iPos[i3], py = iPos[i3 + 1], pz = iPos[i3 + 2];

      if (pointer.live) {
        // push away from the cursor ray — the first, gentlest form of steering
        const vx = px - o.x, vy = py - o.y, vz = pz - o.z;
        const t = vx * d.x + vy * d.y + vz * d.z;
        const cx = vx - d.x * t, cy = vy - d.y * t, cz = vz - d.z * t;
        const dist = Math.hypot(cx, cy, cz);
        if (dist < R && dist > 1e-3) {
          const f = (1 - dist / R) ** 2;
          px += (cx / dist) * f * 10 * dt; py += (cy / dist) * f * 10 * dt;
          dx += (cx / dist) * f * 3 * dt; dy += (cy / dist) * f * 3 * dt;
        }
      }
      const dl = Math.hypot(dx, dy, dz) || 1;
      dx /= dl; dy /= dl; dz /= dl;
      dir[i3] = dx; dir[i3 + 1] = dy; dir[i3 + 2] = dz;

      const sp = (0.16 + 1.15 * thrust) * (0.75 + 0.35 * scale);
      px += (dx * sp + flowV) * dt; py += dy * sp * dt; pz += dz * sp * dt * 0.6;
      if (px > VOL.x) px -= VOL.x * 2; else if (px < -VOL.x) px += VOL.x * 2;
      if (py > VOL.y) py -= VOL.y * 2; else if (py < -VOL.y) py += VOL.y * 2;
      if (pz > VOL.z1) pz = VOL.z0; else if (pz < VOL.z0) pz = VOL.z1;
      iPos[i3] = px; iPos[i3 + 1] = py; iPos[i3 + 2] = pz;

      q.setFromUnitVectors(up, v3.set(dx, dy, dz));
      iQuat[i4] = q.x; iQuat[i4 + 1] = q.y; iQuat[i4 + 2] = q.z; iQuat[i4 + 3] = q.w;
    }
    swarmGeo.attributes.iPos.needsUpdate = true;
    swarmGeo.attributes.iQuat.needsUpdate = true;
  }

  function updateSpecimen() {
    const k = state.specimen;
    specimen.visible = k > 0.002;
    if (!specimen.visible) return;
    const half = Math.tan((camera.fov * Math.PI) / 360) * SPEC_DIST;
    let cx = W * 0.72, cy = H * 0.5, box = H * 0.7;
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2; box = Math.min(r.height, r.width * 1.25);
    }
    const scale = (0.6 * box * (2 * half / H)) / 2.1;
    const rise = (1 - k) * (1 - k);
    sPos[0] = ((cx / W) * 2 - 1) * half * camera.aspect;
    sPos[1] = -((cy / H) * 2 - 1) * half + 0.34 * scale - rise * half * 1.6;
    sPos[2] = camera.position.z - SPEC_DIST;
    sMisc[0] = scale;
    qa.setFromAxisAngle(ex, 0.42 + Math.sin(time * 0.35) * 0.06).multiply(qb.setFromAxisAngle(ez, -0.2 + Math.sin(time * 0.27) * 0.05));
    qa.multiply(qb.setFromAxisAngle(up, state.spin + time * 0.12));
    sQuat[0] = qa.x; sQuat[1] = qa.y; sQuat[2] = qa.z; sQuat[3] = qa.w;
    specGeo.attributes.iPos.needsUpdate = true;
    specGeo.attributes.iQuat.needsUpdate = true;
    specGeo.attributes.iMisc.needsUpdate = true;
    specMat.uniforms.uIntensity.value = 0.36 * k;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dtRaw = (now - last) / 1000;
    last = now;
    if (!state.active || document.hidden) return;
    const dt = Math.min(dtRaw, 0.05);
    time += dt;

    // One-shot quality step-down for slow GPUs.
    if (!tuned && frames > 20) {
      slow += dtRaw > 0.03 ? 1 : 0;
      if (frames === 110) {
        tuned = true;
        if (slow > 45) {
          pixelRatio = 1; N = Math.round(N * 0.55); swarmGeo.instanceCount = N;
          bloom.strength = 0.75; resize();
        }
      }
    }
    frames++;

    pointer.sx += (pointer.x - pointer.sx) * 0.04;
    pointer.sy += (pointer.y - pointer.sy) * 0.04;
    camera.position.x = pointer.sx * 0.9;
    camera.position.y = pointer.sy * 0.55;
    camera.lookAt(0, 0, -6);

    drift.x += (0.25 + state.flow * 4.2) * dt;
    drift.y += 0.16 * dt;

    const bu = backdrop.material.uniforms;
    bu.uTime.value = time; bu.uDepth.value = state.depth; bu.uIntake.value = state.intake;
    bu.uMouse.value.set(pointer.sx, pointer.sy);
    snowMat.uniforms.uTime.value = time;
    snowMat.uniforms.uIntensity.value = 0.35 + 0.65 * state.swarm;
    swarmMat.uniforms.uTime.value = time;
    swarmMat.uniforms.uIntensity.value = 0.62 * state.swarm;
    specMat.uniforms.uTime.value = time;
    finalPass.uniforms.uTime.value = time;

    swarm.visible = state.swarm > 0.01;
    if (swarm.visible) updateSwarm(dt);
    updateSpecimen();
    composer.render();
    if (firstFrame) { firstFrame(); firstFrame = null; }
  }
  requestAnimationFrame(frame);

  return {
    state,
    ready,
    resize,
    setAnchor(el) { anchor = el; },
    get count() { return N; },
  };
}
