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

    notes: `The brief specifies a 30–45 cm bell diameter. The photo on slide 3 is an identified specimen. The opener is atmosphere. Say “post-alert”: High Tide starts when ENEC’s existing alert arrives. Credit the whole team; use names and role text from the opening. Anchor line: every animal held in front of the intake is still part of the problem.`
  },
  {
    id: 'molecule', name: 'Carrot & stick', span: '00:25–01:22',
    html: `<section class="scene feature bio">
      ${header('02 / BIOCHEMICAL STEERING', 'Give the bloom<br><em>a cue.</em>', 'Use water to open a route. Use chemistry to give the jellyfish a reason to take it.')}
      <div class="cue-board">
        <article class="cue-card push">
          <div class="panel-tag"><b>−</b><span>THE STICK<br><strong>Candidate avoidance cue</strong></span></div>
          <div class="molecule-art" id="molecule-art">${molecule}</div>
          <div class="cue-result"><h2>(E)-2-nonenal</h2><p>Japanese sea nettles released treated dried krill sooner. The compound also rose <b>23×</b> in water from injured <i>S. saltatrix</i> versus sham samples.</p></div>
          <div class="cue-use"><b>OUR DESIGN</b> Test for turning away from the intake-side arm.</div>
          <div class="cue-source">${source('chemistry')} ${source('molecule')} <button class="text-button" id="molecule-more" aria-expanded="false" aria-controls="molecule-extra">Assay detail ↓</button></div>
          <div id="molecule-extra" class="molecule-extra" hidden>Miura Fig. 5: shorter holding of dried krill at 5% and 50% bait pretreatment; 0.5% had no significant result. Fig. 4: n = 10 per group for the 23× chemical comparison, p = 0.00094.</div>
        </article>
        <article class="cue-card pull">
          <div class="panel-tag"><b>+</b><span>THE CARROT<br><strong>Candidate attraction cue</strong></span></div>
          <svg class="plume-art" viewBox="0 0 420 145" role="img" aria-label="Conceptual cue gradient spreading from the exit arm">
            <path d="M20 73H382M53 31H382M53 115H382" stroke="currentColor" opacity=".32" stroke-dasharray="3 6"/>
            <path d="M26 73C116 73 172 64 217 36S317 5 398 14M26 73C116 73 172 82 217 110S317 141 398 132M110 73C225 73 263 53 398 39M110 73C225 73 263 93 398 107M195 73H398" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".64"/>
            <path d="M309 61l12 12-12 12m33-27 15 15-15 15m34-31 16 16-16 16" fill="none" stroke="currentColor" stroke-width="4"/>
            <text x="19" y="111" fill="currentColor" font-size="10" font-family="monospace">TRACK</text>
          </svg>
          <div class="cue-result"><h2>Brine shrimp (<i>Artemia</i>)</h2><p>In a two-inflow tank, moon jellies (<i>Aurelia aurita</i>) favored the side supplied with water that had held brine shrimp.</p></div>
          <div class="cue-use"><b>OUR DESIGN</b> Test whether that water draws blue blubbers toward the exit.</div>
          <div class="cue-source">${source('preference')}</div>
        </article>
      </div></section>`,
    notes: `The Japanese sea nettle, Chrysaora pacifica, was the animal in the contact study. The compound came from a different jellyfish, Spirocodon saltatrix. Miura’s Figure 4 found 23 times as much (E)-2-nonenal in injured-tissue samples as sham water, n = 10 per group, p = 0.00094. Figure 5 is a separate endpoint: holding time for treated dried krill. The two higher pretreatment formulations shortened holding; the lowest did not. No seawater dose comes from those percentages. Arai showed that moon jellies favored water that had held brine shrimp (Artemia). That water carries the candidate cue into our assay. The mixture’s active component is unresolved. Our innovation is the combination: use the avoidance candidate on the intake side and the attraction candidate on the exit side, and measure the net trajectory of the challenge species.`
  },
  {
    id: 'gates', name: 'Cue experiment', span: '01:22–02:10',
    html: `<section class="scene feature assay-v3">
      ${header('03 / THE CONTAINED EXPERIMENT', 'Make the cue<br><em>prove itself.</em>', 'Same flow in both arms. Swap cue sides. Track the blue blubber relative to the water.')}
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
      </div></section>`,
    notes: `Click Carrot, Stick, Combined, or Blank. Swap sides to show why the same plumbing cannot masquerade as a preference. The drawing locates the inlets; arrows depict water direction. Cue identity and side are randomized and observers score the tracks blind. Start with a tracer map and measured exposure; test vehicle blanks, the two cues individually, both cues together and uniform exposure. Report water-relative velocity, arm choice including nonchoices, sustained displacement, pulsation and recovery. Uniform exposure helps tell directional movement apart from a change in activity or distress. Use adult-scale clearance and temperature-matched water. Then compare physical plus cue against physical only in the same contained channel. Deliver the effect size and confidence interval, exit/return counts, welfare and non-target results. A result too small to change clearance is useful: we keep the physical corridor and drop the cue.`
  },
  {
    id: 'barakah', name: 'Barakah design', span: '02:10–02:55',
    html: `<section class="scene feature site-v3">
      ${header('04 / BARAKAH → DESIGN REQUIREMENTS', 'What the water<br><em>makes us build.</em>', 'Start in the marine approach, upstream of intake capture. Verify where an exit leads before activating a route.')}
      <div class="requirement-grid">
        <article><div class="panel-tag">01 / CURRENT</div><strong>0.05 <small>m/s</small></strong><p>Mean current magnitude at offshore Buoy 9.</p><h2>Route from live direction</h2><p>Exercise weak flow and reversal. Use local current vectors to choose the exit and log returns.</p><div>${source('currents')}</div></article>
        <article><div class="panel-tag">02 / BLOOM LOAD</div><strong>≈200 <small>tons</small></strong><p>Historical daily jellyfish load cited in ENEC mentoring.</p><h2>Clear continuously</h2><p>Use an open bypass instead of a storage pocket. Compare exit rate with arrival rate; track retained load.</p><div>${source('mentor')}</div></article>
        <article><div class="panel-tag">03 / MARINE WORKS</div><strong>5.5–9.5 <small>m</small></strong><p>Dredged bed elevations below mean sea level across marine works.</p><h2>Size sections by depth</h2><p>Survey candidate transects; use water depth to size each diffuser’s pressure and airflow.</p><div>${source('dredge')}</div></article>
        <article><div class="panel-tag">04 / SEAWATER</div><strong>21.6–32.7 <small>°C</small></strong><p>Winter and summer mean surface temperatures in the Barakah coastal grid cell.</p><h2>Test both seasons</h2><p>Measure cue persistence and animal response at both ends of the observed seasonal range.</p><div>${source('sst')}</div></article>
      </div>
    </section>`,
    notes: `The 0.05 metres per second is a depth-averaged magnitude measured offshore during the 2017–2018 study. It motivates a weak-current case and direction sensing; it never goes in as the intake velocity. Ask ENEC for local current vectors at each candidate outlet and a coarse site plan. The 30 October mentor cited a historical load of about 200 tons per day. The within-day rate and weight basis were not supplied. Design around a continuous clearance balance and request hourly arrivals or collected mass before sizing. The 5.5 to 9.5 metres are the contractor’s combined dredge elevations below mean sea level. Convert a surveyed transect and tide level to diffuser pressure and measure air delivery under load. The 21.6 and 32.7 degrees are winter and summer coastal surface means from the public climatology. Use those to bracket contained tests of cue persistence and target response.`
  },
  {
    id: 'corridor', name: 'Two exits', span: '02:55–03:37',
    html: `<section class="scene feature route-v3">
      ${header('05 / REVERSIBLE DIVERSION', 'Two exits.<br><em>One live route.</em>', 'A fixed angle can send a reversing cross-current toward the wrong side. High Tide can change which route it opens.')}
      <div class="route-grid">
        <div class="route-console" id="route-console">
          <div class="console-head"><span>FIG. 03 / CONTROLLER PLAN VIEW</span><button class="panel-button" id="route-reverse" type="button">Reverse cross-flow ⇄</button></div>
          <svg viewBox="0 0 650 235" class="route-map" role="img" aria-labelledby="route-name">
            <title id="route-name">Plan view showing two alternative side exits upstream of the intake</title>
            <defs><marker id="route-tip" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0l8 4-8 4Z" fill="#00ebff"/></marker></defs>
            <path d="M25 47H625M25 189H625M25 118H625" fill="none" stroke="#a6a6a6" stroke-dasharray="2 8" opacity=".6"/>
            <path d="M42 82h132m-132 35h132m-132 35h132" fill="none" stroke="#939393" stroke-width="1.5"/>
            <path d="m166 76 8 6-8 6m0 23 8 6-8 6m0 23 8 6-8 6" fill="none" stroke="#939393" stroke-width="1.5"/>
            <g stroke-width="4" fill="none" stroke-dasharray="12 6"><path class="guide-b" d="M281 47l112 142"/><path class="guide-a" d="M393 47L281 189"/></g>
            <path class="trace-b" d="M197 115C251 117 271 118 306 141S362 195 425 208" fill="none" stroke="#00ebff" stroke-width="4" marker-end="url(#route-tip)"/>
            <path class="trace-a" d="M197 115C251 113 271 112 306 89S362 35 425 23" fill="none" stroke="#00ebff" stroke-width="4" marker-end="url(#route-tip)"/>
            <path d="M556 80H616V155H556Z" fill="#2b2b2b" stroke="#b6b6b6"/>
            <path d="M566 81V154M575 81V154M584 81V154" stroke="#b6b6b6"/>
            <text x="27" y="30">ARRIVALS →</text><text x="453" y="27">EXIT A</text><text x="453" y="214">EXIT B</text><text x="559" y="178">INTAKE</text>
          </svg>
          <div class="route-state" id="route-state" aria-live="polite">Cross-flow toward B ↓ <b>Route B active</b></div>
        </div>
        <div class="algorithm">
          <article><span>01</span><div><h2>Flip the corridor</h2><p>In the model, cross-flow changes sign at 450 s. After a 10 s controller delay, the corridor mirrors from B to A.</p></div></article>
          <article><span>02</span><div><h2>Power the nearby sections</h2><p>Of six modeled sections, turn on the one next to each approaching track and its neighbors.</p></div></article>
          <article><span>03</span><div><h2>Check the route stays open</h2><p>Track returns and build-up. A closed outlet or power fault disables the active curtain in the model.</p></div></article>
        </div>
      </div>
    </section>`,
    notes: `Toggle Reverse cross-flow. A and B are alternative lateral paths, not two mapped construction sites. The prototype mirrors the plume line according to the sign of cross-flow after a delay. With six segments, it marks the current animal’s band and the immediate neighbors when the track is within the 13 m x-distance rule; it takes the union across all active tracks. Particle trajectories combine along-flow, side-current, intake pull, deterministic dispersion and a modeled plume response; the time step is 0.25 s. A field controller would add independently surveyed clearance lines, local velocity measurements, and an operator-defined envelope before activating a path. Return flow matters because an animal can cross a boundary and come back. The prototype’s blocked-outlet and power-loss cases disable active bubbles. The breakwater and marine approach are places to evaluate, not placement promises.`
  },
  {
    id: 'simulation', name: 'Transport results', span: '03:37–04:38',
    html: `<section class="scene feature sim-v3">${header('06 / HIGH TIDE V1.0 · REPRODUCIBLE RUNS', 'Where did the<br><em>bloom go?</em>', 'Same arrivals, seed and flow in each comparison. Change the intervention and count where the tracks end.')}<div id="simulator"></div></section>`,
    notes: `Start with the completed reversal run. Out of the same 900 simulated arrivals, no diversion sends 338 into the intake and leaves zero outside at the end. The controlled corridor sends 78 into the intake, leaves 266 outside and retains 390. Fixed bubbles send zero into the intake in this run but retain 722 and leave only 33 outside. That is the useful trade-off: protecting the intake alone can hide a pile-up. Select Control delay: increasing switch delay from 10 to 90 seconds reduces outside-at-finish from 266 to 206 for controlled sections. Select Return current: outside falls to 71 and 331 tracks returned at least once. Returns overlap final destinations. These are transport simulations, with no chemical steering coefficient. The archive contains 11 scenarios × 5 configurations × 3 seeds, not 165 field trials. The deliverable is the paired endpoint table, seed-level CSV and a flume comparison that can replace modeled transport with measured trajectories.`
  },
  {
    id: 'outro', name: 'The next test', span: '04:38–05:00',
    html: `<section class="scene feature closing-v3">
      <div class="closing-shape" aria-hidden="true"></div>
      ${header('07 / THE PROPOSAL', 'Give the bloom<br><em>a way out.</em>', 'Build the corridor. Test the cues. Measure how many more blue blubbers clear the approach.')}
      <div class="deliverable-grid">
        <article><span>01 / IN HAND</span><h2>Transport comparison</h2><p>Runnable controller and 165 archived scenario runs.</p></article>
        <article><span>02 / BUILD</span><h2>Instrumented flume</h2><p>Two exits, reversible flow and a measured physical baseline.</p></article>
        <article><span>03 / TEST</span><h2>Biochemical steering</h2><p>A blinded adult assay, followed by a paired cue-on versus cue-off run.</p></article>
      </div>
      <div class="close-ask"><p><b>What we want from ENEC:</b> shareable flow and bloom-load records, and a marine-lab introduction.</p><button class="panel-button" data-evidence="questions">Judge Q&amp;A ↗</button><a class="source-link" href="./evidence.html">Technical brief ↗</a></div>
    </section>`,
    notes: `The first build is an instrumented physical flume. We will run identical inflows with no diversion, fixed bubbles and controlled sections, then score clearance, retention and repeat returns. In parallel, a marine-lab partner runs the contained adult behavior study. If the measured cue changes directional swimming and clears the welfare and non-target measurements, compare the combined system against the physical system alone. Ask ENEC for shareable approach flow and event load records and a marine-lab introduction. Closing line: “We want to move the bloom away from the intake, and we want to be able to show exactly where it went.”`
  }
];
const talkTrack = [
  { speaker:'Syed', text:`ENEC’s alert tells you the bloom is coming. We’re working on what happens next. High Tide gives the blue blubber jellyfish a route away from the intake. We’re building a corridor that adapts to the water, and we’re testing whether we can use the jellyfish’s own senses to help it take that route.` },
  { speaker:'Usman', text:`Here’s what makes High Tide different. We want to give the jellyfish two reasons to move in the same direction: something to move away from, and something to move toward.

In one study, Japanese sea nettles released dried krill treated with (E)-2-nonenal sooner. That’s our candidate for the intake side. In a different study, moon jellies favored water that had held brine shrimp, called Artemia. That brine shrimp cue is what we’ll test on the exit side.

We’re taking those two observations and asking a new question: can you get adult blue blubbers to turn and swim toward the exit in flowing water? If they do, the animal’s own movement can contribute to clearance.` },
  { speaker:'Usman', text:`Here’s how we find out. [Select Carrot, then swap sides.] Both arms carry the same flow. We move the cue to the other side and ask whether the jellyfish’s choice follows it. We test the two cues alone, together, and against a blank. We subtract the water’s motion from the track so we can tell swimming from drifting.

Then we keep the physical corridor identical and turn chemistry on or off. What counts is more animals clearing the exit, with recovery and non-target response measured alongside it.` },
  { speaker:'Syed', text:`Four numbers changed what we designed. The offshore current averaged five centimetres per second, so the controller needs to handle weak flow and act on measured direction. ENEC mentoring reported a historical load of roughly two hundred tons in a day. A holding pocket is the wrong shape for that kind of event: the route has to keep clearing arrivals.

The dredged elevations tell us to size diffusers section by section after surveying the water depth. The observed seasonal surface temperatures give us two useful ends for testing whether the cue persists and the animal responds.` },
  { speaker:'Syed', text:`One outlet leaves you tied to one direction. [Reverse cross-flow.] When the current reverses, the model mirrors the corridor to the other side. It turns on the sections near incoming tracks, plus their immediate neighbors. Then we watch whether the animals actually clear the route or come back.

At Barakah, we’d evaluate this upstream of the intake. A surveyed outlet and measured local flow tell us which route we can use.` },
  { speaker:'Syed', text:`Here are three runs with the same nine hundred arrivals and a reversal halfway through. Without diversion, 338 reach the intake. With controlled sections, 78 reach it and 266 are outside at the finish. Fixed bubbles get intake entries to zero in this run but leave 722 inside. So if you only score intake entries, you can pick the option that leaves the biggest backlog.

[Select Return current if time permits.] When we add a return current, outside-at-finish drops to 71. That makes the return route one of the first things we need to measure. These runs compare physical transport; the lab is where the chemical effect gets measured.` },
  { speaker:'Syed', text:`We have the controller and the transport comparison today. Next we build the flume and measure the baseline, then test whether the two cues can improve it. We’re asking ENEC for shareable flow and bloom-load records and an introduction to a marine lab. We want to give the bloom a way out, and show exactly where it went.` },
];
window.HighTideContent = { links, source, label, slides, talkTrack };
})();
