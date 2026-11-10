// (E)-2-nonenal as a draggable ball-and-stick model.
// Coordinates: PubChem CID 5283335 3-D conformer (same data the team's deck ships).
import * as THREE from 'three';

export const NONENAL = {
  atoms: [[-5.2467, -0.6705, 0.3889, 'O'], [1.8283, 0.5784, 0.1794, 'C'], [2.9898, -0.3588, -0.159, 'C'], [0.496, 0.0113, -0.3179, 'C'], [4.3438, 0.1466, 0.3436, 'C'], [-0.6702, 0.9318, 0.0481, 'C'], [5.5104, -0.7456, -0.0513, 'C'], [-1.973, 0.3918, -0.4677, 'C'], [-3.0196, 0.1191, 0.3208, 'C'], [-4.2588, -0.4041, -0.2849, 'C'], [2.0048, 1.5611, -0.274, 'H'], [1.7837, 0.7256, 1.2653, 'H'], [2.7971, -1.3491, 0.2721, 'H'], [3.0381, -0.4917, -1.2471, 'H'], [0.3331, -0.9817, 0.12, 'H'], [0.5401, -0.1216, -1.4063, 'H'], [4.5238, 1.154, -0.0504, 'H'], [4.3157, 0.2335, 1.4363, 'H'], [-0.7069, 1.0669, 1.136, 'H'], [-0.5094, 1.9234, -0.3918, 'H'], [5.3842, -1.7544, 0.3541, 'H'], [6.4495, -0.3374, 0.3349, 'H'], [5.5932, -0.8208, -1.1401, 'H'], [-2.0433, 0.2391, -1.5422, 'H'], [-2.9957, 0.2639, 1.3941, 'H'], [-4.2481, -0.5425, -1.379, 'H']],
  bonds: [[0, 9, 2], [1, 2, 1], [1, 3, 1], [1, 10, 1], [1, 11, 1], [2, 4, 1], [2, 12, 1], [2, 13, 1], [3, 5, 1], [3, 14, 1], [3, 15, 1], [4, 6, 1], [4, 16, 1], [4, 17, 1], [5, 7, 1], [5, 18, 1], [5, 19, 1], [6, 20, 1], [6, 21, 1], [6, 22, 1], [7, 8, 2], [7, 23, 1], [8, 9, 1], [8, 24, 1], [9, 25, 1]],
};

const STYLE = {
  C: { r: 0.42, color: 0x1f3d48, emissive: 0x03303a, rough: 0.3 },
  H: { r: 0.25, color: 0xe9f1f2, emissive: 0x1a2a30, rough: 0.45 },
  O: { r: 0.5, color: 0xff5a3c, emissive: 0x7a1a08, rough: 0.3 },
};

export function createMolecule(canvas, data = NONENAL) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    console.warn('[molecule] WebGL unavailable', err);
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xbfefff, 0x05141b, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 6, 7); scene.add(key);
  const rimA = new THREE.PointLight(0x00ebff, 60, 40); rimA.position.set(-8, -3, 5); scene.add(rimA);
  const rimB = new THREE.PointLight(0xff5a3c, 50, 40); rimB.position.set(8, 3, 4); scene.add(rimB);

  const group = new THREE.Group();
  scene.add(group);

  const centre = new THREE.Vector3();
  for (const a of data.atoms) centre.add(new THREE.Vector3(a[0], a[1], a[2]));
  centre.divideScalar(data.atoms.length);
  const P = data.atoms.map((a) => new THREE.Vector3(a[0], a[1], a[2]).sub(centre));

  const parts = [];   // { mesh, order } — atoms and bonds appear in sequence along the chain
  const sphere = new THREE.SphereGeometry(1, 28, 20);
  data.atoms.forEach((a, i) => {
    const s = STYLE[a[3]];
    const m = new THREE.Mesh(sphere, new THREE.MeshPhysicalMaterial({ color: s.color, emissive: s.emissive, roughness: s.rough, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.2 }));
    m.position.copy(P[i]);
    m.userData.r = s.r;
    m.scale.setScalar(0.0001);
    group.add(m);
    parts.push({ mesh: m, x: P[i].x, kind: 'atom' });
  });

  const cyl = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true);
  const bondMat = new THREE.MeshPhysicalMaterial({ color: 0x86aab6, emissive: 0x0c2a33, roughness: 0.4, metalness: 0.2 });
  const yAxis = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3(), side = new THREE.Vector3();
  for (const [ia, ib, order] of data.bonds) {
    const a = P[ia], b = P[ib];
    tmp.subVectors(b, a);
    const len = tmp.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(yAxis, tmp.clone().normalize());
    side.crossVectors(tmp, new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(0.13);
    const offsets = order === 2 ? [side.clone(), side.clone().negate()] : [new THREE.Vector3()];
    for (const off of offsets) {
      const m = new THREE.Mesh(cyl, bondMat);
      m.position.copy(a).add(b).multiplyScalar(0.5).add(off);
      m.quaternion.copy(quat);
      m.userData.len = len; m.userData.rad = order === 2 ? 0.075 : 0.09;
      m.scale.set(0.0001, len, 0.0001);
      group.add(m);
      parts.push({ mesh: m, x: (a.x + b.x) / 2, kind: 'bond' });
    }
  }
  // Assemble from the aldehyde oxygen along the carbon chain.
  parts.sort((p1, p2) => p1.x - p2.x);

  let W = 1, H = 1;
  function resize() {
    W = canvas.clientWidth || 300; H = canvas.clientHeight || 200;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // fit the ~12.5 Å long chain to the frame width
    const halfW = 7.4, halfH = 3.4;
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    camera.position.set(0, 0, Math.max(halfW / (tan * camera.aspect), halfH / tan));
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  let rotX = 0.28, rotY = -0.5, velY = 0.25, dragging = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    rotY += dx * 0.011; rotX = Math.max(-1.2, Math.min(1.2, rotX + dy * 0.008)); velY = dx * 0.4;
  });
  const end = () => { dragging = false; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  let active = false, progress = 0, target = 0, last = performance.now(), time = 0;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!active) return;
    time += dt;
    progress += (target - progress) * Math.min(1, dt * 1.6);
    const n = parts.length;
    for (let i = 0; i < n; i++) {
      const k = ease(Math.min(1, Math.max(0, progress * (n + 14) - i) / 14));
      const m = parts[i].mesh;
      if (parts[i].kind === 'atom') m.scale.setScalar(Math.max(0.0001, m.userData.r * k));
      else m.scale.set(Math.max(0.0001, m.userData.rad * k), m.userData.len, Math.max(0.0001, m.userData.rad * k));
    }
    if (!dragging) { rotY += velY * dt; velY += (0.25 - velY) * dt * 1.5; }
    group.rotation.set(rotX + Math.sin(time * 0.5) * 0.05, rotY, 0.12);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    setActive(v) { active = v; },
    play() { target = 1; },
  };
}
