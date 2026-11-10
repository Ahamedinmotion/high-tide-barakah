/* Narrative copy, timestamps and source links for the High Tide deck. */
(() => {
const links = {
  brief: ['ENEC challenge statement', 'https://challengeon.atrc.ae/en/challenges/atp2026/pages/enec-challenge-statement?lang=en'],
  chemistry: ['Miura et al. · J. Chemical Ecology', 'https://doi.org/10.1007/s10886-026-01740-4'],
  molecule: ['PubChem · CID 5283335', 'https://pubchem.ncbi.nlm.nih.gov/compound/5283335'],
  preference: ['Arai · Chemical-side preference in medusae', 'https://link.springer.com/chapter/10.1007/978-94-011-3240-4_52'],
  larva: ['Larval settlement experiment · J. Animal Ecology', 'https://doi.org/10.1111/1365-2656.70357'],
  taxonomy: ['Integrative Catostylus taxonomy', 'https://doi.org/10.1017/S0025315424000687'],
  dna: ['Species-specific jellyfish eDNA field study', 'https://doi.org/10.1002/edn3.70071'],
  dredge: ['NMDC · Barakah marine works', 'https://www.nmdc-dredgingmarine.com/ar/projects/barakah-npp-marine-works/'],
  currents: ['Barakah mooring comparison · Ocean Modelling', 'https://doi.org/10.1016/j.ocemod.2023.102274'],
  buoy: ['ADOOS buoy study · 2017–18', 'https://bibliotekanauki.pl/articles/2078874.pdf'],
  water: ['SCAD/EAD · Water Statistics 2019', 'https://scad.gov.ae/documents/d/guest/water-20statistics_2019_annual_yearly_en-pdf-1'],
  cooling: ['ENEC · Final cooling', 'https://www.enec.ae/discover/how-nuclear-energy-works/how-does-a-nuclear-energy-plant-generate-electricity-/final-cooling/'],
  faq: ['ENEC · Barakah FAQ', 'https://enec.ae/barakah-plant/frequently-asked-questions/'],
  air: ['Beelen et al. · Measured air flux in a bubble curtain', 'https://doi.org/10.1007/s00348-022-03568-6'],
  bubble: ['Haberlin et al. · Field and flume experiments', 'https://doi.org/10.1016/j.aquaculture.2020.735915'],
  swim: ['Neil &amp; Askew · Blue blubber swimming kinematics', 'https://doi.org/10.1242/jeb.191148'],
  sst: ['Nesterov et al. · Table A.2', 'https://bibliotekanauki.pl/articles/2078874.pdf'],
  mentor: ['ENEC mentoring · 30 October', './barakah-research.html#field-brief'],
  original: ['High Tide · Submitted prototype references', 'https://high-tide-enec-4555.vercel.app/references.html'],
};
const source = (id) => `<a class="source-link" href="${links[id][1]}" target="_blank" rel="noopener">${links[id][0]} <span aria-hidden="true">↗</span></a>`;
const label = (text, tone = '') => `<span class="tag ${tone}">${text}</span>`;
const header = (chapter, title, desc = '') => `<div class="scene-head"><div class="eyebrow">${chapter}</div><h1 id="slide-title" tabindex="-1">${title}</h1>${desc ? `<p class="lede">${desc}</p>` : ''}</div>`;
const molecule = `<svg viewBox="0 0 630 230" role="img" aria-label="Skeletal structure of E-2-nonenal, a nine carbon aldehyde with a trans double bond at carbon 2"><defs><linearGradient id="bond" x2="1" y2="1"><stop stop-color="#00ebff"/><stop offset="1" stop-color="#f7f7f4"/></linearGradient></defs><g stroke="url(#bond)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M55 142L112 109 169 142 226 109 283 142 340 109 397 142 454 109 511 142"/><path d="M402 154L459 121"/><path d="M511 142L564 111M517 152L571 121"/></g><text x="581" y="122" fill="#00ebff" font-size="34" font-family="monospace">O</text><text x="402" y="196" fill="#bfc7ce" font-size="14" font-family="monospace">E GEOMETRY</text><path d="M423 183L430 145" stroke="#bfc7ce" stroke-dasharray="3 4"/></svg>`;
const slides = [
  {
    id: 'opening', name: 'Opening', span: '00:00–00:25',
    html: `<section class="scene opening"><div class="hero-film" aria-hidden="true"></div><div class="hero-contours" aria-hidden="true"></div><div class="hero-copy"><div class="eyebrow"><i class="live-dot"></i> 01 / THE ENEC CHALLENGE</div><h1 id="slide-title" tabindex="-1">Give the bloom<br>a way <em>out.</em></h1><p class="lede">High Tide · A post-alert response for blue blubber jellyfish (<i>Catostylus mosaicus</i>) at Barakah.</p><div class="crew"><div><b>Syed Ahamed</b><span>President of Robotics · 42 Abu Dhabi</span></div><div><b>Usman Mohammad</b><span>Applied Computer Science &amp; AI · Molecular Biology background</span></div></div><button class="start" data-jump="molecule">Enter the pitch <span>↗</span></button></div><div class="hero-index" aria-hidden="true">HIGH TIDE<br>FIG. 01 <i></i> AQUARIUM FOOTAGE</div></section>`,

    notes: `Introduce yourself and Usman, name Barakah and the target, then hand over to chemistry. The ENEC brief specifies the blue blubber jellyfish, Catostylus mosaicus, with a 30–45 cm bell diameter.`
  },
  {
    id: 'molecule', name: 'Carrot & stick', span: '00:22–01:12',
    html: `<section class="scene feature bio">
      ${header('02 / BIOCHEMICAL STEERING', 'Push away.<br><em>Pull toward the exit.</em>', 'Two candidate cues for blue blubber jellyfish.')}
      <div class="cue-board">
        <article class="cue-card push">
          <div class="panel-tag"><b>−</b><span>THE STICK<br><strong>(E)-2-nonenal</strong></span></div>
          <div class="molecule-art" id="molecule-art">${molecule}</div>
          <div class="cue-result"><h2>Push away from the intake</h2><p>Japanese sea nettles released dried krill treated with <b>(E)-2-nonenal</b> sooner.</p></div>
          <div class="cue-use"><b>LAB TEST</b> Measure whether blue blubbers turn away.</div>
          <div class="cue-source">${source('chemistry')} ${source('molecule')} <button class="text-button" id="molecule-more" aria-expanded="false" aria-controls="molecule-extra">Assay detail ↓</button></div>
          <div id="molecule-extra" class="molecule-extra" hidden>Miura Fig. 5: shorter holding of dried krill at 5% and 50% bait pretreatment; 0.5% had no significant result. Fig. 4: n = 10 per group for the 23× chemical comparison, p = 0.00094.</div>
        </article>
        <article class="cue-card pull">
          <div class="panel-tag"><b>+</b><span>THE CARROT<br><strong>Brine shrimp (<i>Artemia</i>)</strong></span></div>
          <svg class="plume-art" viewBox="0 0 420 145" role="img" aria-label="Conceptual cue gradient spreading from the exit arm">
            <path d="M20 73H382M53 31H382M53 115H382" stroke="currentColor" opacity=".32" stroke-dasharray="3 6"/>
            <path d="M26 73C116 73 172 64 217 36S317 5 398 14M26 73C116 73 172 82 217 110S317 141 398 132M110 73C225 73 263 53 398 39M110 73C225 73 263 93 398 107M195 73H398" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".64"/>
            <path d="M309 61l12 12-12 12m33-27 15 15-15 15m34-31 16 16-16 16" fill="none" stroke="currentColor" stroke-width="4"/>
            <text x="19" y="111" fill="currentColor" font-size="10" font-family="monospace">TRACK</text>
          </svg>
          <div class="cue-result"><h2>Pull toward the exit</h2><p>Moon jellies favored water that had held <b>brine shrimp (<i>Artemia</i>)</b>.</p></div>
          <div class="cue-use"><b>LAB TEST</b> Measure whether blue blubbers swim toward it.</div>
          <div class="cue-source">${source('preference')}</div>
        </article>
      </div></section>`,
    notes: `Arai used a two-inflow aquarium. Moon jellies (Aurelia aurita) favored an inflow of water that held brine shrimp. Miura’s Japanese sea nettles held dried krill treated with (E)-2-nonenal for less time at the 5% and 50% pretreatment formulations. The 0.5% formulation produced no significant result. Those are bait preparation percentages. The measured endpoint was time holding prey. Our assay measures turning and sustained swimming relative to water. Miura also found 23 times as much compound in injured Spirocodon samples as sham samples, with 10 per group and p = 0.00094. That ratio compares two sample groups and supplies no seawater dose.`
  },
  {
    id: 'barakah', name: 'Pilot sizing', span: '01:12–01:53',
    html: `<section class="scene feature site-v3 sizing-v4">
      ${header('03 / QUANTITIES AND TESTS', 'Size the pilot.<br><em>Measure the cue.</em>', 'Barakah’s historic load drives continuous clearance. Each test produces a number ENEC can use.')}
      <div class="sizing-grid">
        <article>
          <div class="panel-tag">01 / PHYSICAL MODULE</div>
          <h2>10 m active curtain</h2>
          <ul><li><b>0.33–1.00 m³/min</b> of air, scaled from basin measurements.</li><li><b>0.7–2.2 kW</b> estimated at 8 m depth. Meter power and clearance in the trial.</li></ul>
          <div>${source('air')} <a class="source-link" href="./engineering.html#pilot-sizing">Sizing inputs ↗</a></div>
        </article>
        <article>
          <div class="panel-tag">02 / CARROT</div>
          <h2>0 / 10 / 50 / 100%</h2>
          <ul><li>Brine shrimp stock as a share of each lab feed.</li><li>Hold shrimp density and conditioning time constant. Record turning and exit choice.</li></ul>
          <div><a class="source-link" href="./engineering.html#cue-quantities">Per-litre quantities ↗</a></div>
        </article>
        <article>
          <div class="panel-tag">03 / STICK AND WILDLIFE</div>
          <h2>Blank + 3 lab levels</h2>
          <ul><li>Verify dissolved (E)-2-nonenal before choosing animal exposures.</li><li>Measure recovery and responses in fish larvae and local plankton.</li></ul>
          <div><a class="source-link" href="./engineering.html#cue-quantities">Exposure and wildlife plan ↗</a></div>
        </article>
      </div>
      <p class="sizing-foot"><b>≈200 tons/day</b> cited in ENEC mentoring → measure hourly load, clearance and returns. <b>0.05 m/s</b> offshore mean → test weak flow and measure the local current vector.</p>
    </section>`,
    notes: `Ten metres and eight metres depth define a planning module. Beelen measured 0.55–1.67 litres per second per metre at normalized pressure in a basin. The midpoint calculation is 0.67 m³/min and about 1.4 kW. The range assumes seawater density 1,025 kg/m³, 20 kPa line and diffuser loss and 60% combined efficiency. Verify at the manifold and the meter. For each litre of lab feed, use 0, 100, 500 or 1,000 mL of filtered Artemia-conditioned stock, topped up with a matched blank. Log shrimp density, contact time and batch conditions. For (E)-2-nonenal the first deliverable is measured dissolved concentration in micrograms per litre. Set three levels after the lab checks detectability, stability and welfare. Record blue blubber pulsation, body condition and recovery. With a marine partner, screen responses in fish larvae and representative plankton. Assess larger wildlife through field observation in a physical-only trial. Marine trial chemical release is zero.`
  },
  {
    id: 'simulation', name: 'Reversal run', span: '01:53–02:28',
    html: `<section class="scene feature sim-v3">${header('04 / SAME 900 ARRIVALS · REVERSAL RUN', 'The exit moves.<br><em>Does the bloom?</em>', 'At 450 s the cross-current reverses. Ten seconds later the controller switches from Exit B to Exit A.')}<div id="simulator"></div></section>`,
    notes: `Read the endpoint table first. Same 900 arrivals in the reversal comparison. No diversion: intake 338, outside 0, retained 456. Fixed bubbles: intake 0, outside 33, retained 722. Controlled sections: intake 78, outside 266, retained 390. The controller mirrors the angled curtain and activates sections near approaching tracks. When the outlet is blocked, the controller holds off. Across eleven seed-42 controlled scenarios, the outside fraction at the 900-second finish ranges from 0.0% in Blocked exit to 42.0% in High dispersion, with a median of 22.9% in Control delay. These are ranks across designed model cases. Use Return current to show why recirculation tracking matters: 71 outside at finish and 331 that return at least once. The model compares physical interventions.`
  },
  {
    id: 'outro', name: 'Six-month plan', span: '02:28–03:00',
    html: `<section class="scene feature closing-v3 plan-v4">
      <div class="closing-shape" aria-hidden="true"></div>
      ${header('05 / DELIVERY AND BUDGET', 'Six months to<br><em>a pilot decision.</em>', 'Ask ENEC for a marine-lab partner and shareable flow, depth and hourly bloom-load records.')}
      <div class="deliverable-grid">
        <article><span>FIRST 5 DAYS</span><h2>Lock the test</h2><p>Set the matched-flow protocol, agree how to count clearance and request supplier quotes.</p></article>
        <article><span>MONTHS 1–3</span><h2>Measure the effect</h2><p><b>AED 38k–134k</b> planning range for bench and contained lab work.</p></article>
        <article><span>MONTHS 4–6</span><h2>Cost the marine trial</h2><p><b>AED 106k–486k</b> planning range for one recoverable physical pilot.</p></article>
      </div>
      <div class="close-ask"><p>Survey the approved route, then price Barakah’s installed length, depth and marine works.</p><button class="panel-button" data-evidence="questions">Judge Q&amp;A ↗</button><a class="source-link" href="./engineering.html#pilot-budget">Budget breakdown ↗</a></div>
    </section>`,
    notes: `These ranges are stage estimates. Bench plus contained feasibility totals AED 37,785–133,640. One separately scoped, recoverable physical trial at an approved test area is AED 105,950–486,200 including 30% reserve. That trial estimate covers survey and engineering, instrument rental, hardware, marine logistics, environmental observation and reporting. A site-scale quote needs measured length and depth, the approved clearance route, power and marine access, plus actual supplier pricing. Days 1–5 produce a lab protocol, data request, decision criteria and requests for quotes. Months 1–3 produce measured flume tracks and a contained cue result. Months 4–6 produce the route survey and a priced test plan if results and partner access support it.`
  }
];
const talkTrack = [
  { speaker:'Syed', text:`I’m Syed Ahamed, President of Robotics at 42 Abu Dhabi. This is Usman Mohammad. He brings molecular biology to the team. At Barakah, we want to turn blue blubber jellyfish away from the cooling intake. Our idea is to use the jellyfish’s own senses to guide it.` },
  { speaker:'Usman', text:`Push away from the intake. Pull toward the exit.

For the push, Japanese sea nettles let go of dried krill sooner when it was treated with (E)-2-nonenal. For the pull, moon jellies favored water that had held brine shrimp, called Artemia.

We’ll test both cues on adult blue blubbers. We’ll swap sides, track them against the water’s movement and measure whether more of them reach the exit. We’ll also check how the jellyfish recover and how nearby species respond.` },
  { speaker:'Usman', text:`The test has three quantities. A ten-metre curtain gives us a starting air range and an estimated 0.7 to 2.2 kilowatts. For the brine shrimp cue, we’ll compare a blank with ten, fifty and one hundred percent conditioned stock. For the molecule, the lab measures the dissolved concentration before selecting three levels for animal trials.

ENEC cited about two hundred tons in a day. That’s why our test tracks how quickly the exit clears arrivals and how many come back.` },
  { speaker:'Syed', text:`Here’s the same reversal with nine hundred simulated arrivals. With no diversion, 338 reach the intake. Fixed bubbles keep them out of the intake in this run and leave 722 inside the approach. Controlled sections switch outlets. They leave 266 outside and 390 inside. The result we care about is how many animals clear the approach and stay clear.` },
  { speaker:'Syed', text:`In five days we can lock the test and request quotes. By month three we aim to have flume results and a contained cue result. By month six we aim to have a priced physical trial, with a planning range of 106 to 486 thousand dirhams. We’re asking ENEC for flow and bloom data and an introduction to a marine lab.` },
];
const assayExhibit = `<section class="qa-assay feature">
      <p class="qa-assay-lede">Match flow, swap the cue side and track the blue blubber relative to the water.</p>
      <div class="assay-grid">
        <div class="assay-console" id="assay-console">
          <div class="console-head"><span>FIG. 02 / MATCHED-FLOW CHAMBER</span><button id="assay-swap" type="button" class="panel-button">Swap sides ⇄</button></div>
          <svg viewBox="0 0 610 230" class="assay-map" role="img" aria-labelledby="assay-name">
            <title id="assay-name">Two-inflow chamber showing the cue and blank positions</title>
            <path d="M25 76H212L328 19H584V94H345L296 115L345 136H584V211H328L212 154H25Z" fill="#1e1d21" stroke="#7c7c83"/>
            <path class="arm-a" d="M583 57H339L238 115H25" fill="none" stroke-width="48" stroke-linejoin="round" opacity=".23"/>
            <path class="arm-b" d="M583 174H339L238 115H25" fill="none" stroke-width="48" stroke-linejoin="round" opacity=".23"/>
            <path d="M581 57H340L230 115H32M581 174H340L230 115" fill="none" stroke="#fff" stroke-dasharray="4 8" opacity=".6"/>
            <path d="m376 50-10 7 10 7m0 103-10 7 10 7m-237-66-10 7 10 7" fill="none" stroke="#fff" stroke-width="2"/>
            <circle cx="250" cy="115" r="16" fill="#fff" stroke="#18171a" stroke-width="2"/>
            <path d="M242 116Q250 102 258 116Z" fill="#414141"/>
            <text x="35" y="145">OUTFLOW</text><text x="530" y="46">ARM A</text><text x="530" y="163">ARM B</text>
          </svg>
          <div class="assay-status" aria-live="polite"><span><b>A</b> <i id="assay-arm-a"></i></span><span><b>B</b> <i id="assay-arm-b"></i></span></div>
          <div id="assay-presets" class="assay-presets" aria-label="Assay conditions">
            <button type="button" data-trial="carrot">Carrot</button><button type="button" data-trial="stick">Stick</button><button type="button" data-trial="combined">Combined</button><button type="button" data-trial="blank">Blank</button>
          </div>
        </div>
        <div class="assay-proof">
          <figure class="species"><img src="./assets/catostylus-reference.webp" alt="Identified Catostylus mosaicus, the blue blubber jellyfish"><figcaption><i>Catostylus mosaicus</i><strong>30–45 cm</strong><small>Bell diameter · ENEC brief</small></figcaption></figure>
          <p><b>What we measure:</b> turning, arm choice, and swim velocity after subtracting water drift.</p>
          <p><b>What earns a place:</b> more exits than the physical corridor alone, with recovery and non-target response measured.</p>
          <div>${source('brief')} <a class="source-link" href="./assets-credits.html">Specimen credit ↗</a></div>
        </div>
      </div></section>`;
window.HighTideContent = { links, source, label, slides, talkTrack, assayExhibit };
})();
