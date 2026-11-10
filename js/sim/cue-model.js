// High Tide — illustrative cue layer on top of the v1.0 transport engine.
//
// engine.mjs is the team's deterministic model and is used UNCHANGED. It compares
// physical interventions only. This subclass adds an optional, clearly-labelled
// "what if the cues work" layer for the live demo:
//
//   • Carrot  — brine-shrimp (Artemia) conditioned water dosed at the active exit.
//               Animals bias their own swimming toward that exit.
//   • Stick   — (E)-2-nonenal dosed across the intake approach.
//               Animals bias their swimming down-gradient, away from the intake.
//
// The only "strength" assumption is that a jellyfish cannot add more than its own
// swimming speed. The combined cue bias is capped at 36.2 mm/s — the mean speed
// Neil & Askew (2018) measured for small Catostylus mosaicus — scaled by each
// animal's response factor. Nothing here is calibrated: adult blue blubber
// response to either cue is the hypothesis the lab programme would test.
import { Model } from './engine.mjs';

export const SWIM_CAP = 0.0362; // m/s — Neil & Askew 2018, doi:10.1242/jeb.191148

const smooth = (a, b, v) => {
  const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class CueModel extends Model {
  constructor(settings = {}, cues = false) {
    super(settings);
    this.cues = cues;
  }

  /** Cues ride on the physical corridor: no corridor, closed outlet or power fault → no dosing. */
  cuesLive() {
    const p = this.p;
    return this.cues && p.mode !== 'none' && p.exitOpen && this.t < p.failure;
  }

  /** Which side the corridor (and so the carrot) is routing to: +1 = Exit B, −1 = Exit A. */
  routeSign() {
    return this.p.mode === 'controlled' ? this.controlSign() : 1;
  }

  step(dt = this.p.dt) {
    if (this.cuesLive()) this.applyCues(Math.min(dt, this.p.duration - this.t));
    return super.step(dt);
  }

  applyCues(dt) {
    if (dt <= 0) return;
    const sign = this.routeSign();
    for (const a of this.animals) {
      if (a.status !== 'active' || a.born > this.t) continue;
      let vx = 0, vy = 0;

      // Carrot: lateral pull toward an exit, strongest through the mid-approach.
      // Upstream of the curtain only the routed exit arm is dosed. Past the curtain
      // both arms are dosed, so an animal that slipped through takes the nearer way out
      // instead of being dragged back across the intake mouth after a route switch.
      const along = smooth(6, 22, a.x) * (1 - smooth(88, 100, a.x));
      const inside = a.y >= 0 && a.y <= 60;
      if (inside) {
        const pastCurtain = a.x > this.lineX(a.y, sign) + 5;
        vy += (pastCurtain ? (a.y >= 30 ? 1 : -1) : sign) * along;
      } else if (a.y > 60 && a.y < 90) vy += 0.6 * along;   // hold cleared animals outside
      else if (a.y < 0 && a.y > -30) vy -= 0.6 * along;

      // Stick: down-gradient escape from the dosed zone in front of the intake mouth.
      const plume = Math.exp(-(((a.x - 78) / 16) ** 2)) * Math.exp(-(((a.y - 30) / 20) ** 2));
      vx -= 0.6 * plume;
      vy += (a.y >= 30 ? 1 : -1) * plume;

      const mag = Math.hypot(vx, vy);
      if (mag < 1e-6) continue;
      const cap = SWIM_CAP * a.response;
      const k = cap * Math.min(1, mag) / mag;
      a.x += vx * k * dt;
      a.y += vy * k * dt;
    }
  }
}
