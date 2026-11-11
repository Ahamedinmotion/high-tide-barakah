// High Tide — page choreography.
// Scroll drives everything: the water behind the page (ocean.js), the pinned
// chapters, the counters, and finally hands over to the live model (sim/sim.js).
import { createOcean } from './ocean.js';
import { createMolecule } from './molecule.js';
import { createSim } from './sim/sim.js';
import { createSiteMap } from './site-map.js';
import { buildCharts } from './charts.js';

const { gsap, ScrollTrigger, SplitText, Lenis } = window;
gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
if (reduce) root.classList.add('reduce');

// ───────────── Scenes ─────────────
const ocean = createOcean($('#ocean'));
if (ocean) ocean.setAnchor($('.animal__viz'));
else root.classList.add('no-webgl');
const molecule = createMolecule($('#molecule'));
const sim = createSim($('#sim-stage'));
buildCharts();
const siteMap = createSiteMap($('#site-map'), $('#site-labels'), {
  scale: $('#site-scale'), scaleBar: $('#site-scale-bar'), coords: $('#site-coords'), stepName: $('#site-step-name'),
  legend: $('#site-legend'), progress: $('#site-progress'), cards: [...document.querySelectorAll('.scard')],
});
window.highTide = { ocean, sim, siteMap, get lenis() { return lenis; } };       // handy in the console

// ───────────── Smooth scroll ─────────────
let lenis = null;
if (!reduce && Lenis) {
  lenis = new Lenis({ lerp: 0.105, wheelMultiplier: 0.95 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const el = $(a.getAttribute('href'));
  if (!el) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(el, { duration: 2.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else el.scrollIntoView();
});

// ───────────── Preloader ─────────────
const pre = { v: 0 };
const pctEl = $('#preloader-pct'), tideEl = $('#preloader-tide');
const drawPre = () => {
  pctEl.textContent = String(Math.round(pre.v)).padStart(3, '0');
  tideEl.style.height = `${pre.v}%`;
};
gsap.to(pre, { v: 88, duration: reduce ? 0.2 : 1.6, ease: 'power2.out', onUpdate: drawPre });
const settle = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);
Promise.all([
  settle(document.fonts ? document.fonts.ready : Promise.resolve(), 3500),
  settle(ocean ? ocean.ready : Promise.resolve(), 3500),
  new Promise((r) => setTimeout(r, reduce ? 0 : 1300)),
]).then(() => {
  build();
  gsap.to(pre, { v: 100, duration: 0.45, ease: 'power1.in', onUpdate: drawPre, onComplete: enter });
});

function enter() {
  document.body.classList.remove('is-loading');
  if (lenis) lenis.start();
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('#preloader .preloader__inner', { y: -40, autoAlpha: 0, duration: 0.6, ease: 'power2.in' })
    .to('#preloader', { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, '-=0.25')
    .set('#preloader', { display: 'none' });
  if (!reduce) {
    tl.fromTo('.hero__title .char', { yPercent: 115, rotate: 6 }, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.028 }, '-=0.75')
      .fromTo('.hero__intro', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 }, '-=1.2')
      .fromTo('.nav', { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 1, clearProps: 'all' }, '-=1.1')
      .fromTo('.gauge', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, clearProps: 'opacity,visibility' }, '-=0.9');
  }
  ScrollTrigger.refresh();
}

// ───────────── Everything scroll-driven ─────────────
function build() {
  const mm = gsap.matchMedia();
  const motion = '(prefers-reduced-motion: no-preference)';
  const desktop = `(min-width: 901px) and ${motion}`;

  // Hero
  if (!reduce) {
    SplitText.create('.hero__title .l', { type: 'chars', charsClass: 'char' });
    gsap.to('.hero__title', { yPercent: -16, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.fromTo('.hero__fade', { opacity: 1 }, { opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: '10% top', end: '55% top', scrub: true } });
  }

  // Ocean progress probes (order matters: created top to bottom, pins included)
  const probe = (trigger, start, end) => ScrollTrigger.create({ trigger, start, end });
  const pLoadIn = probe('#approach', 'top bottom', 'top top');
  const pLoad = probe('#approach', 'top 55%', 'bottom bottom');

  // 02 · Animal (pinned while the specimen turns)
  const pAnimalIn = probe('#animal', 'top bottom', 'top top');
  let pAnimalPin = null;
  mm.add(desktop, () => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#animal-stage', start: 'top top', end: '+=70%', pin: true, scrub: 0.5 } });
    tl.from('.callout', { autoAlpha: 0, x: (i) => (i === 2 ? 30 : -30), stagger: 0.18, duration: 0.5, ease: 'power2.out' }, 0.05)
      .from('.animal__ring', { scale: 0.7, autoAlpha: 0, duration: 0.6, ease: 'power2.out' }, 0)
      .to({}, { duration: 0.5 });
    pAnimalPin = tl.scrollTrigger;
    return () => { pAnimalPin = null; };
  });
  const pAnimalOut = probe('.animal__after', 'top 92%', 'top 35%');
  if (!reduce) {
    gsap.fromTo('.frame--wide img', { yPercent: -19 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.frame--wide', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  const pCuesIn = probe('#steering', 'top bottom', 'top 15%');

  // 05 · System — horizontal run
  mm.add(desktop, () => {
    const track = $('#system-track');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const bar = $('#system-bar');
    const run = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '#system-pin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.7, invalidateOnRefresh: true,
        onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; },
      },
    });
    $$('.panel:not(.panel--intro)').forEach((panel) => {
      gsap.from(panel.querySelectorAll('.panel__num, .panel__body > *, .panel__viz'), {
        y: 46, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: { trigger: panel, containerAnimation: run, start: 'left 82%' },
      });
    });
    gsap.from('.panel--intro > *', { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '#system', start: 'top 70%' } });
  });

  // 05 · Site — pinned zoom
  const pResults = probe('#site', 'top bottom', 'top top');
  if (!reduce) {
    ScrollTrigger.create({
      trigger: '#site-pin', start: 'top top', end: () => `+=${innerHeight * 6.5}`, pin: true, scrub: 0.6,
      onUpdate: (self) => siteMap.setProgress(self.progress),
      onToggle: (self) => siteMap.setLive(self.isActive),
    });
  } else { siteMap.setProgress(1); siteMap.setLive(true); }

  // 06B · Results
  if (!reduce) {
    gsap.fromTo('.chart__bar', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.7, ease: 'expo.inOut', stagger: 0.22, scrollTrigger: { trigger: '#chart', start: 'top 72%' } });
    gsap.from('.chart__label', { autoAlpha: 0, x: -24, duration: 1, ease: 'power3.out', stagger: 0.22, scrollTrigger: { trigger: '#chart', start: 'top 72%' } });
    gsap.from('.beaker i', { scaleY: 0, duration: 1.6, ease: 'expo.out', stagger: 0.25, scrollTrigger: { trigger: '.beakers', start: 'top 85%' } });
    gsap.from('.adds .hbar__t i', { scaleX: 0, transformOrigin: 'left', duration: 1.3, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: '#steering .adds', start: 'top 80%' } });
    ScrollTrigger.batch('.f2__bar i, .hwline i, .prow__t i, .energy .hbar__t i', { start: 'top 92%', once: true, onEnter: (els) => gsap.fromTo(els, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left', duration: 1.2, ease: 'expo.out', stagger: 0.05 }) });
    gsap.from('.g-bar', { scaleX: 0, transformOrigin: 'left', duration: 1.1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '#gantt', start: 'top 80%' } });
  }

  // 06 · Simulation: clear the chrome
  const nav = $('#nav'), gauge = $('#gauge');
  ScrollTrigger.create({
    trigger: '#sim-stage', start: 'top 62%', end: 'bottom 38%',
    onToggle: (self) => { nav.classList.toggle('is-hidden', self.isActive); gauge.classList.toggle('is-hidden', self.isActive); },
  });
  if (ocean) {
    ScrollTrigger.create({
      trigger: '#site', start: 'top top',
      onEnter: () => { ocean.state.active = false; },
      onLeaveBack: () => { ocean.state.active = true; },
    });
  }

  // Generic reveals — created last so every pin above them is already measured
  if (!reduce) {
    SplitText.create('[data-split]', {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 110, duration: 1.25, ease: 'expo.out', stagger: 0.11,
        scrollTrigger: { trigger: self.elements[0], start: 'top 86%' },
      }),
    });
    ScrollTrigger.batch('.reveal', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.fromTo(els, { y: 44, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.05, ease: 'power3.out', stagger: 0.09, overwrite: true }),
    });
    gsap.set('.reveal', { autoAlpha: 0 });
    $$('.eyebrow').forEach((el) => {
      if (el.closest('.panel') || el.closest('.hero')) return;
      gsap.from(el, { autoAlpha: 0, x: -20, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
  }

  // Counters
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0);
    if (reduce) return;
    const o = { v: 0 };
    el.textContent = (0).toFixed(dec);
    gsap.to(o, {
      v: end, duration: 2.1, ease: 'expo.out',
      onUpdate: () => { el.textContent = o.v.toLocaleString('en', { minimumFractionDigits: dec, maximumFractionDigits: dec }); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  // Scroll → water. Pure functions of scroll progress, so nothing can fight.
  const depthEl = $('#gauge-depth'), markEl = $('#gauge-mark'), readEl = depthEl.parentElement;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  gsap.ticker.add(() => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = clamp01(scrollY / max);
    markEl.style.top = readEl.style.top = `${p * 100}%`;
    depthEl.textContent = `−${(p * 9.5).toFixed(1)} m`;
    if (!ocean) return;
    const S = ocean.state;
    const a = pLoadIn.progress, b = pLoad.progress, c = pAnimalIn.progress, out = pAnimalOut.progress, d = pCuesIn.progress, e = pResults.progress;
    const pin = pAnimalPin ? pAnimalPin.progress : out;
    S.depth = 0.42 * a + 0.2 * c + 0.18 * d + 0.2 * e;
    S.flow = b * (1 - 0.96 * c);
    S.intake = b * (1 - c);
    S.swarm = 1 - 0.66 * c + 0.28 * d - 0.22 * e;
    S.specimen = smooth(0.45, 1, c) * (1 - smooth(0, 1, out));
    S.spin = c * 0.8 + pin * 2.6 + out * 0.8;
  });

  // Cursor
  const cursor = $('#cursor');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('pointermove', (e) => { cursor.classList.add('is-on'); xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      cursor.classList.toggle('is-hot', !!e.target.closest('a, button, select, #molecule'));
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  }

  // Lazy media
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const v = en.target;
      if (en.isIntersecting) v.play().catch(() => {}); else v.pause();
    }
  }, { threshold: 0.2 });
  if (!reduce) $$('video[data-autoplay]').forEach((v) => io.observe(v));
  else $$('video[data-autoplay]').forEach((v) => { v.controls = true; });

  if (molecule) {
    new IntersectionObserver((entries) => {
      for (const en of entries) {
        molecule.setActive(en.isIntersecting);
        if (en.intersectionRatio > 0.35) molecule.play();
      }
    }, { threshold: [0, 0.35] }).observe($('#molecule'));
  }
}
