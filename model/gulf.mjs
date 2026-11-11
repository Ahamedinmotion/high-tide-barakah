import fs from 'fs';
import { feature } from 'topojson-client';
import pc from 'polygon-clipping';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-10m.json'));
const fc = feature(topo, topo.objects.land); const land = fc.features ? fc.features[0] : fc;
const D = JSON.parse(fs.readFileSync('design.json'));
const { lon: LON0, lat: LAT0, mx: MX, my: MY } = D.geo_origin;
const B = [44.5, 20.0, 60.5, 33.0];
const box = [[[B[0], B[1]], [B[2], B[1]], [B[2], B[3]], [B[0], B[3]], [B[0], B[1]]]];
const polys = land.geometry.type === 'MultiPolygon' ? land.geometry.coordinates : [land.geometry.coordinates];
const near = polys.filter((poly) => poly[0].some(([lo, la]) => lo > B[0] - 5 && lo < B[2] + 5 && la > B[1] - 5 && la < B[3] + 5));
const clipped = pc.intersection(near, box);
const P = ([lo, la]) => [(lo - LON0) * MX, -(la - LAT0) * MY];
function simp(ring, tol) { const o = [ring[0]]; for (const p of ring) { const q = o[o.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) > tol) o.push(p); } return o; }
let d = '';
for (const poly of clipped) for (const ring of poly) {
  const s = simp(ring.map(P), 2200); if (s.length < 3) continue;
  d += 'M' + s.map((p) => p.map((v) => Math.round(v)).join(' ')).join('L') + 'Z';
}
fs.writeFileSync('gulf-path.txt', d); console.log(d.length);
