# Design numbers

- `design.py` — every number on the site's Steering, Site and Numbers chapters (load, air, power, chemistry, BOM, costs, site geometry). Writes `design.json`.
- `runcues.mjs` — reruns the v1.0 engine with and without the cue layer for every scenario (3 seeds); output `cues.json` (`node model/runcues.mjs > model/cues.json`).
- `gulf.mjs` — clips the Natural Earth 1:10M coastline to the Gulf for the zoom map (needs `world-atlas`, `topojson-client`, `polygon-clipping`).
- `js/data.js` is generated from `design.json` + the Gulf path.

Tags in the briefing: SRC = published, ASM = assumption, MOD = model output, HYP = hypothesis.
