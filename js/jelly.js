// Procedural blue blubber (Catostylus-like) jellyfish: a domed bell with a scalloped
// margin, a translucent inner bell, a central mass and eight lumpy oral arms.
// One merged geometry, drawn many times with instanced attributes.
import * as THREE from 'three';

const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * aPart: 0 = outer bell, 1 = oral arm, 2 = central mass, 3 = inner bell.
 * uv.y runs apex → margin on the bells and base → tip on the arms.
 */
export function buildJellyGeometry({ radial = 28, rings = 14, arms = 8, armSeg = 7, armRad = 6, inner = true } = {}) {
  const P = [], UV = [], PART = [], IDX = [];

  const lathe = (scale, part, curl) => {
    const start = P.length / 3;
    const maxT = Math.PI * 0.5 + curl;
    for (let j = 0; j <= rings; j++) {
      const v = j / rings, th = v * maxT;
      let r, y;
      if (th <= Math.PI / 2) { r = Math.sin(th); y = Math.cos(th) * 0.74; }
      else { const k = (th - Math.PI / 2) / curl; r = 1 - 0.13 * k * k; y = -0.3 * k; }
      for (let i = 0; i <= radial; i++) {
        const u = i / radial, a = u * Math.PI * 2;
        const lap = 1 + 0.035 * Math.sin(a * 16) * smooth(0.78, 1, v); // marginal lappets
        P.push(Math.cos(a) * r * lap * scale, y * scale, Math.sin(a) * r * lap * scale);
        UV.push(u, v); PART.push(part);
      }
    }
    for (let j = 0; j < rings; j++) for (let i = 0; i < radial; i++) {
      const a = start + j * (radial + 1) + i, b = a + radial + 1;
      IDX.push(a, b, a + 1, b, b + 1, a + 1);
    }
  };

  lathe(1, 0, 0.5);
  if (inner) lathe(0.78, 3, 0.18);

  // Central mass where the oral arms fuse.
  {
    const start = P.length / 3, lat = 6, lon = Math.max(8, Math.round(radial / 2));
    for (let j = 0; j <= lat; j++) {
      const v = j / lat, th = v * Math.PI;
      for (let i = 0; i <= lon; i++) {
        const a = (i / lon) * Math.PI * 2;
        P.push(Math.cos(a) * Math.sin(th) * 0.4, -0.2 + Math.cos(th) * 0.27, Math.sin(a) * Math.sin(th) * 0.4);
        UV.push(i / lon, v); PART.push(2);
      }
    }
    for (let j = 0; j < lat; j++) for (let i = 0; i < lon; i++) {
      const a = start + j * (lon + 1) + i, b = a + lon + 1;
      IDX.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  // Oral arms: tapered, lumpy tubes splaying slightly outward.
  for (let k = 0; k < arms; k++) {
    const a0 = ((k + 0.5) / arms) * Math.PI * 2;
    const start = P.length / 3;
    for (let j = 0; j <= armSeg; j++) {
      const s = j / armSeg;
      const cr = 0.25 + 0.2 * s;
      const cy = -0.12 - 1.18 * s;
      const rad = (0.2 * (1 - 0.74 * s) + 0.012) * (1 + 0.34 * Math.sin(s * 15 + k * 1.7));
      const cx = Math.cos(a0) * cr, cz = Math.sin(a0) * cr;
      for (let i = 0; i <= armRad; i++) {
        const t = (i / armRad) * Math.PI * 2;
        P.push(cx + Math.cos(t) * rad, cy, cz + Math.sin(t) * rad);
        UV.push(i / armRad, s); PART.push(1);
      }
    }
    for (let j = 0; j < armSeg; j++) for (let i = 0; i < armRad; i++) {
      const a = start + j * (armRad + 1) + i, b = a + armRad + 1;
      IDX.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(PART, 1));
  g.setIndex(IDX);
  g.computeVertexNormals();

  // Weld normals across duplicated seam and pole vertices so fresnel shading has no crease.
  const pos = g.attributes.position, nor = g.attributes.normal, part = g.attributes.aPart, acc = new Map();
  const key = (i) => `${part.getX(i)}|${pos.getX(i).toFixed(4)}|${pos.getY(i).toFixed(4)}|${pos.getZ(i).toFixed(4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i), n = acc.get(k) || [0, 0, 0];
    n[0] += nor.getX(i); n[1] += nor.getY(i); n[2] += nor.getZ(i);
    acc.set(k, n);
  }
  for (let i = 0; i < pos.count; i++) {
    const n = acc.get(key(i)), l = Math.hypot(n[0], n[1], n[2]) || 1;
    nor.setXYZ(i, n[0] / l, n[1] / l, n[2] / l);
  }
  return g;
}

/** Wrap a base geometry so it can be drawn `count` times with per-instance attributes. */
export function instanced(base, count, attrs) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  for (const name of Object.keys(base.attributes)) g.setAttribute(name, base.attributes[name]);
  for (const [name, [array, size]] of Object.entries(attrs)) {
    const a = new THREE.InstancedBufferAttribute(array, size);
    a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute(name, a);
  }
  g.instanceCount = count;
  return g;
}

const VERT = /* glsl */`
attribute float aPart;
attribute vec3 iPos;
attribute vec4 iQuat;
attribute vec4 iMisc;   // scale, phase, pulse rate, seed
attribute vec3 iTint;
uniform float uTime;
varying vec3 vN;
varying vec3 vV;
varying vec2 vUv;
varying float vPart;
varying float vC;
varying float vDist;
varying float vTop;
varying vec3 vTint;

vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

void main() {
  float ph = iMisc.y + uTime * iMisc.z;
  float c = smoothstep(-0.25, 1.0, sin(ph));
  c *= c;                                   // quick contraction, slow recovery
  vec3 p = position;
  if (aPart < 0.5 || aPart > 2.5) {
    float w = smoothstep(0.08, 1.0, uv.y);
    p.xz *= 1.0 - 0.25 * c * w;
    p.y += 0.11 * c * (1.0 - w) - 0.1 * c * w * w;
  } else if (aPart < 1.5) {
    float s = uv.y;
    float lag = sin(ph - 0.9 - s * 2.4);
    p.xz *= 1.0 - 0.17 * c * (1.0 - 0.6 * s);
    p.y -= 0.13 * lag * s;
    p.x += 0.08 * sin(uTime * 1.1 + s * 4.0 + iMisc.w * 6.283) * s;
    p.z += 0.08 * cos(uTime * 0.9 + s * 3.3 + iMisc.w * 4.0) * s;
  } else {
    p.xz *= 1.0 - 0.12 * c;
  }
  p *= iMisc.x;
  vec3 wp = qrot(iQuat, p) + iPos;
  vec3 wn = qrot(iQuat, normal);
  vec4 mv = modelViewMatrix * vec4(wp, 1.0);
  vN = normalize(normalMatrix * wn);
  vV = normalize(-mv.xyz);
  vUv = uv; vPart = aPart; vC = c; vDist = -mv.z; vTint = iTint;
  vTop = wn.y;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
precision highp float;
uniform float uIntensity;
uniform float uFog;
varying vec3 vN;
varying vec3 vV;
varying vec2 vUv;
varying float vPart;
varying float vC;
varying float vDist;
varying float vTop;
varying vec3 vTint;

void main() {
  float ndv = abs(dot(normalize(vN), normalize(vV)));
  float fres = pow(1.0 - ndv, 2.1);
  float ang = vUv.x * 6.2831853;
  float a;
  vec3 col;
  if (vPart < 0.5) {
    float canals = pow(0.5 + 0.5 * sin(ang * 32.0), 5.0) * smoothstep(0.22, 0.92, vUv.y);
    float crossMark = pow(abs(cos(ang * 2.0)), 18.0) * smoothstep(0.5, 0.12, vUv.y) * smoothstep(0.02, 0.1, vUv.y);
    float rim = smoothstep(0.8, 1.0, vUv.y);
    a = 0.03 + fres * 0.6 + canals * 0.07 + crossMark * 0.16 + rim * 0.16;
    col = mix(vTint * 0.75, vec3(0.86, 0.97, 1.0), clamp(fres * 0.7 + rim * 0.35, 0.0, 1.0));
    col += vec3(0.25, 0.08, 0.5) * crossMark * 0.6;
  } else if (vPart < 1.5) {
    float frill = 0.5 + 0.5 * sin(vUv.y * 46.0 + ang * 3.0);
    a = 0.07 + fres * 0.5 + frill * 0.05;
    col = mix(vTint, vec3(0.7, 0.62, 1.0), 0.35) * (1.0 - 0.45 * vUv.y);
  } else if (vPart < 2.5) {
    a = 0.1 + fres * 0.35;
    col = mix(vTint, vec3(0.9, 0.8, 1.0), 0.4);
  } else {
    a = 0.02 + fres * 0.32;
    col = vTint * 0.9;
  }
  a *= 1.0 + 0.45 * vC;
  a *= 0.8 + 0.3 * vTop;                        // light from the surface
  float fog = exp(-uFog * max(vDist - 5.0, 0.0));
  col = mix(vec3(0.02, 0.2, 0.34) * dot(col, vec3(0.4)), col, fog);
  float near = smoothstep(3.0, 9.0, vDist);
  gl_FragColor = vec4(min(col * a * (0.25 + 0.75 * fog) * near * uIntensity, vec3(0.55)), 1.0);
}`;

export function jellyMaterial({ intensity = 1, fog = 0.034 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: intensity }, uFog: { value: fog } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}
