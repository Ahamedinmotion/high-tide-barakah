"""High Tide — full-scale concept numbers.

Every figure the site and the briefing PDF quote comes out of this file, so the
arithmetic can be re-run and challenged. Inputs are tagged:
  SRC  = published / ENEC-stated value
  ASM  = engineering assumption (replace with ENEC or lab data)
"""
import json, math

out = {}
# ───────────────────────── Site geometry (traced from public imagery) ─────────────────────────
LON0, LAT0 = 52.2325, 23.9715          # origin: centre of the intake frontage
MX = 111320 * math.cos(math.radians(LAT0))   # m per deg lon
MY = 110700                                  # m per deg lat
def L(lon, lat): return (round((lon - LON0) * MX, 1), round((lat - LAT0) * MY, 1))

geo_ll = {
  'shore': [[52.0452,23.9652],[52.0627,23.9632],[52.0803,23.9652],[52.1000,23.9680],[52.1066,23.9652],[52.1241,23.9620],[52.1504,23.9622],[52.1689,23.9635],[52.18,23.9640],[52.1911,23.9646],[52.2022,23.9654],[52.2111,23.9662],[52.2167,23.9674],[52.2222,23.9692],[52.2261,23.9706],[52.2400,23.9719],[52.2467,23.9739],[52.2578,23.9749],[52.2689,23.9762],[52.2820,23.9812],[52.2996,23.9852],[52.3171,23.9932],[52.3259,24.0012],[52.3434,24.0092],[52.3610,24.0252],[52.3785,24.0372],[52.3873,24.0432]],
  'bwW': [[52.1822,24.0009],[52.1911,24.0022],[52.1967,24.0020],[52.2022,23.9997],[52.2067,23.9951],[52.2111,23.9895],[52.2156,23.9823],[52.2200,23.9762],[52.2244,23.9737],[52.2278,23.9732],[52.2411,23.9740]],
  'bwE': [[52.2411,23.9734],[52.2483,23.9851],[52.2683,23.9946]],
  'feature': [[52.2000,23.9900],[52.2122,23.9650]],   # linear feature visible in imagery (unverified)
}
geo = {k: [L(*p) for p in v] for k, v in geo_ll.items()}
# Four unit intakes, stepped along the frontage (west → east)
bounds = [52.2262, 52.2293, 52.2322, 52.2349, 52.2376]
fronts = [23.9703, 23.9708, 23.9713, 23.9718]
geo['intakes'] = [{'id': i + 1, 'a': L(bounds[i], fronts[i]), 'b': L(bounds[i + 1], fronts[i] + .0003)} for i in range(4)]
geo['outfall'] = L(52.2390, 23.9712)
geo['plant'] = [L(52.2235, 23.9700), L(52.2405, 23.9722), L(52.2405, 23.9628), L(52.2235, 23.9625)]
geo['station'] = L(52.2200, 23.9668)   # proposed shore compressor + dosing house (ASM)
out['geo'] = geo
out['geo_origin'] = {'lon': LON0, 'lat': LAT0, 'mx': round(MX, 1), 'my': MY}

def dist(a, b): return math.hypot(a[0] - b[0], a[1] - b[1])
def plen(pts): return sum(dist(pts[i], pts[i + 1]) for i in range(len(pts) - 1))

# ───────────────────────── Concept layout (ASM — to be sited with ENEC survey) ─────────────────────────
# GATE across the mouth of the intake approach basin, from the west breakwater head to the shore.
# Built as two mirrored diffuser lines (A, B) crossing at mid-span, each tilted 30° from the gate
# axis. The controller fires A on flood (routes north, past the breakwater head, Exit N) and B on
# ebb (routes south-west along the shore, Exit W) — the same mirror the v1.0 model performs.
def seg_inter(p, d, a, b):
  # ray p + t d  vs segment a-b ; return t, point
  ex, ey = b[0]-a[0], b[1]-a[1]
  den = d[0]*ey - d[1]*ex
  if abs(den) < 1e-9: return None
  t = ((a[0]-p[0])*ey - (a[1]-p[1])*ex) / den
  s_ = ((a[0]-p[0])*d[1] - (a[1]-p[1])*d[0]) / den
  if 0 <= s_ <= 1: return t, (round(p[0]+t*d[0],1), round(p[1]+t*d[1],1))
  return None
def hit(p, d, poly):
  best=None
  for i in range(len(poly)-1):
    r=seg_inter(p,d,poly[i],poly[i+1])
    if r and r[0]>0 and (best is None or r[0]<best[0]): best=r
  return best[1] if best else None
Pb = geo['bwW'][1]                       # solid breakwater head
Ps = L(52.1911, 23.9646)                 # shore due south of the head
span = dist(Pb, Ps)
u = ((Ps[0]-Pb[0])/span, (Ps[1]-Pb[1])/span)        # axis, north → south
mid = ((Pb[0]+Ps[0])/2, (Pb[1]+Ps[1])/2)
def rot(v, deg):
  c, s_ = math.cos(math.radians(deg)), math.sin(math.radians(deg)); return (v[0]*c - v[1]*s_, v[0]*s_ + v[1]*c)
layout = {}
apex = L(52.1800, 23.9641)               # shore, west side of the basin mouth (Exit W)
layout['gateA'] = [apex, Pb]             # flood: drift runs NNE along A to the breakwater head → Exit N
layout['gateB'] = [L(52.2022, 23.9997), apex]   # ebb: drift runs WSW along B to the shore apex → Exit W
mid = ((apex[0] + Pb[0] + layout['gateB'][0][0]) / 3, (apex[1] + Pb[1] + layout['gateB'][0][1]) / 3)
layout['mid'] = (round(mid[0],1), round(mid[1],1))
layout['guard'] = [L(52.2240, 23.9734), L(52.2252, 23.9702)]          # double curtain at the channel entrance
# Stick: 600 m pulsed repel band 400 m inside the gate, centred on the basin axis
inward = (-u[1], u[0]) if (-u[1]) > 0 else (u[1], -u[0])               # points east (toward intake)
c0 = (mid[0] + 700*inward[0], mid[1] + 700*inward[1])
layout['stick'] = [(round(c0[0]-300*u[0],1), round(c0[1]-300*u[1],1)), (round(c0[0]+300*u[0],1), round(c0[1]+300*u[1],1))]
layout['carrotN'] = (round(Pb[0]-250,1), round(Pb[1]+150,1))          # just outside the head, Exit N
layout['carrotW'] = L(52.1745, 23.9650)                                # along shore, Exit W
layout['cams'] = [geo['bwW'][1], geo['bwW'][6]]
layout['adcp'] = [layout['mid'], L(52.2156, 23.9760), L(52.2300, 23.9722)]
layout['sonar'] = [layout['gateA'][0], layout['mid']]
out['layout'] = layout
lens = {'gateA': plen(layout['gateA']), 'gateB': plen(layout['gateB']), 'guard': plen(layout['guard'])*2, 'stick': plen(layout['stick'])}
out['lengths_m'] = {k: round(v) for k, v in lens.items()}
out['gate_span_m'] = round(span)
st = geo['station']
feeders = {
  'gate': dist(st, mid) + 300, 'guard': dist(st, layout['guard'][1]) + 50,
  'stick': dist(st, layout['stick'][0]) + 200,
  'carrotN': plen(geo['bwW'][1:]) + 400,   # routed along the breakwater crest
  'carrotW': dist(st, layout['carrotW']) + 200,
}
out['feeders_m'] = {k: round(v) for k, v in feeders.items()}
out['dist_gate_to_intake_m'] = round(dist(mid, (0, 0)))
# Intake pull vs swimmer: mean intake-induced velocity along the approach (ASM depths)
prof = []
bwp = geo['bwW']
for i in [1, 2, 3, 4, 5, 6, 7, 8]:
  b = bwp[i]
  sp = min(geo['shore'], key=lambda q: dist(q, b))
  w = dist(b, sp)
  along = plen(bwp[i:9]) + 1100
  depth = 5.5 + 3.0 * (1 - min(1, along / 4500))
  prof.append({'dist_km': round(along/1000, 2), 'width_m': round(w), 'depth_m': round(depth, 1), 'u_m_s': round(690/(w*depth), 3)})
prof.append({'dist_km': 0.6, 'width_m': 300, 'depth_m': 8.5, 'u_m_s': round(690/(300*8.5), 3)})
out['pull_profile'] = prof

# ───────────────────────── 1. The load (ENEC figure → actionable rates) ─────────────────────────
PEAK_T = 200                               # SRC: ENEC mentoring, 30 Oct 2026, historic peak day (wet t)
mass = {'low': 2.0, 'mid': 4.0, 'high': 8.0}   # ASM: kg per 30–45 cm Catostylus (cube-scaled, see PDF)
FLOW = 690                                 # SRC: m³/s whole-plant design maximum (Nesterov et al. 2023)
load = {
  'peak_t_day': PEAK_T,
  'animals_day': {k: round(PEAK_T * 1000 / v) for k, v in mass.items()},
  't_per_h_mean': round(PEAK_T / 24, 2),
  'peak_factor': 3.0,                      # ASM: arrivals concentrated into two ~6 h tidal windows ×1.5 intra-window
}
load['t_per_h_peak'] = round(load['t_per_h_mean'] * load['peak_factor'], 1)
load['animals_h_peak_mid'] = round(load['animals_day']['mid'] / 24 * load['peak_factor'])
load['animals_s_peak_mid'] = round(load['animals_h_peak_mid'] / 3600, 2)
load['per_intake_t_day'] = PEAK_T / 4
load['per_intake_animals_day_mid'] = round(load['animals_day']['mid'] / 4)
load['water_m3_day'] = round(FLOW * 86400 / 1e6, 1)       # million m³
load['mean_conc_g_m3'] = round(PEAK_T * 1e6 / (FLOW * 86400), 2)
load['water_per_animal_m3'] = round(FLOW * 86400 / load['animals_day']['mid'])
load['jeros_equiv'] = round(load['t_per_h_mean'] / 0.3)  # KAIST JEROS: 3 robots ≈ 0.9 t/h → 0.3 t/h each
load['jeros_equiv_peak'] = round(load['t_per_h_peak'] / 0.3)
load['truckloads_10t'] = round(PEAK_T / 10)
out['load'] = load

# ───────────────────────── 2. Model-informed outcomes at 200 t ─────────────────────────
cues = json.load(open('/home/claude/work/cues.json'))
def g(sc, mode, c): return next(r for r in cues if r['scenario'] == sc and r['mode'] == mode and r['cues'] == c)
outcomes = []
for sc in ['normal', 'reversal', 'delayed', 'weak', 'surge', 'disturbance', 'capture', 'power_loss', 'return_flow', 'blocked_exit', 'zero_response']:
  base = g(sc, 'none', False)['intake']; arr = g(sc, 'none', False)['arrivals']
  row = {'scenario': sc, 'arrivals': arr, 'none': base}
  for k, (m, c) in {'fixed': ('fixed', False), 'ctrl': ('controlled', False), 'ctrl_cues': ('controlled', True)}.items():
    r = g(sc, m, c)
    row[k] = {'intake': r['intake'], 'exit': r['exit'], 'retained': r['retained'], 'returned': r['returned'], 'act': r['actuation']}
  # Scale: tonnes reaching the screens if the run's intake fraction applied to a 200 t day
  frac = lambda x: x / arr
  row['t_none'] = round(PEAK_T * frac(base) / frac(base), 1) if base else 0
  for k in ['fixed', 'ctrl', 'ctrl_cues']:
    row[k]['reduction'] = round(100 * (1 - row[k]['intake'] / base), 1) if base else None
    row[k]['t_at_screens'] = round(PEAK_T * row[k]['intake'] / base, 1) if base else None
  outcomes.append(row)
out['outcomes'] = outcomes

# ───────────────────────── 3. Bubble corridor physics + air + power ─────────────────────────
G = 9.81; H0 = 10.33; RHO = 1025; P_ATM = 101.325
def bulson(q, D): return 1.46 * (G * q) ** (1 / 3) * (1 + D / H0) ** (1 / 3)        # Bulson 1961, q in m²/s
def q_for(V, D): return (V / (1.46 * (1 + D / H0) ** (1 / 3))) ** 3 / G
def comp_kw(Q_free, D, loss=20, eta=0.6, k=1.4):
  p1 = P_ATM; p2 = P_ATM + RHO * G * D / 1000 + loss
  return Q_free * p1 * 1000 * (k / (k - 1)) * ((p2 / p1) ** ((k - 1) / k) - 1) / eta / 1000
beelen = {'low': 0.55e-3, 'mid': 1.11e-3, 'high': 1.67e-3}      # SRC: Beelen et al. 2022, m³/s per m (normalised)
phys = {
  'surface_current_8m': {k: round(bulson(q, 8), 2) for k, q in beelen.items()},
  'surface_current_6m': {k: round(bulson(q, 6), 2) for k, q in beelen.items()},
  'check_pilot_kw_10m_8m': {k: round(comp_kw(q * 10, 8), 2) for k, q in beelen.items()},
  'guard_q_for_0p6': round(q_for(0.6, 9) * 1000, 2),            # L/s per m to beat 0.29 m/s channel ×2
  'channel_velocity': round(FLOW / (300 * 8), 2),               # ASM 300 m × 8 m section
  'gate_velocity': round(FLOW / (span * 5.5), 3),               # ASM mean 5.5 m depth across the gate span
  'swim_speed': 0.0362,
}
phys['ratio_surface_to_swim'] = round(phys['surface_current_6m']['mid'] / 0.0362, 1)
lines = {   # length, depth, q (m²/s)
  'gateA': (lens['gateA'], 6.0, beelen['mid']), 'gateB': (lens['gateB'], 6.0, beelen['mid']),
  'guard': (lens['guard'], 9.0, q_for(0.6, 9)),
}
air = {}
for k, (Lm, D, q) in lines.items():
  Q = Lm * q
  air[k] = {'length_m': round(Lm), 'depth_m': D, 'q_L_s_m': round(q * 1000, 2), 'free_air_m3_min': round(Q * 60, 1),
            'kw_all_on': round(comp_kw(Q, D)), 'sections_50m': math.ceil(Lm / 50)}
out['air'] = air
# Operating envelope: only one gate line fires at a time; conveyor only on flood routing; guard on breach.
act_frac = {'typical': 0.85, 'weak_flow': 0.36, 'with_cues_typical': 0.83, 'with_cues_weak': 0.18}   # from model actuation index / 900
P_gate = air['gateA']['kw_all_on']
ops = {
  'kw_max_simultaneous': round(P_gate + air['guard']['kw_all_on']),
  'kw_gate_typical': round(P_gate * act_frac['typical']),
  'kw_gate_weak': round(P_gate * act_frac['weak_flow']),
  'kw_gate_weak_cues': round(P_gate * act_frac['with_cues_weak']),
  'event_hours': 12,
}
ops['mwh_event_typical'] = round((ops['kw_gate_typical'] + 0.1 * air['guard']['kw_all_on']) * ops['event_hours'] / 1000, 1)
ops['share_of_plant_pct'] = round(100 * ops['kw_max_simultaneous'] / 5.6e6, 4)
ops['installed_kw_n_plus_1'] = math.ceil(ops['kw_max_simultaneous'] * 1.25 / 250) * 250
ops['compressors'] = f"{ops['installed_kw_n_plus_1'] // 250} × 250 kW oil-free screw (N+1)"
ops['act_frac'] = act_frac
out['ops'] = ops

# ───────────────────────── 4. Chemical cues (design envelope, NOT a validated dose) ─────────────────────────
LC50_FISH = 5461    # µg/L ECOSAR estimate (Robertet SDS) — screening scale only
EC50_ALGAE = 8030
SOL = 204900        # µg/L est. water solubility @25 °C
stick = []
for c in [1, 5, 10]:                       # µg/L target in the repel band (bracket for the assay)
  for u_ in [0.05, 0.1, 0.2]:              # m/s water moving through the band
    La, h, duty = 300, 3.0, 0.4            # active band length (m), surface layer (m), pulse duty (ASM)
    g_s = c * 1e-3 * u_ * La * h           # g/s while dosing  (µg/L = mg/m³ → g/m³ = 1e-3)
    g_h = g_s * 3600 * duty
    stick.append({'c_ug_L': c, 'u': u_, 'g_per_h': round(g_h), 'kg_per_event': round(g_h * 12 / 1000, 2),
                  'intake_ug_L': round(g_h / 3600 / FLOW * 1000, 3), 'margin_band_vs_fish_LC50': round(LC50_FISH / c)})
out['stick'] = stick
mid_case = next(s for s in stick if s['c_ug_L'] == 5 and s['u'] == 0.1)
out['stick_mid'] = mid_case
out['stick_carrier_m3_h'] = round(mid_case['g_per_h'] / 0.4 / 100, 1)   # pre-dilute to 100 mg/L (≈½ solubility) while dosing
out['stick_constants'] = {'LC50_fish_ug_L': LC50_FISH, 'EC50_algae_ug_L': EC50_ALGAE, 'solubility_ug_L': SOL,
                          'logP': 3.2, 'MW': 140.22, 'bp_C': 189, 'FEMA': 3213, 'flavour_use_ppm': '0.1–10'}
carrot = []
for dil in [1e-5, 1e-4]:
  band_flux = 0.1 * 50 * 3            # m³/s through a 50 m × 3 m exit window at 0.1 m/s (ASM)
  stock_L_s = band_flux * dil * 1000
  stock_m3_h = stock_L_s * 3.6
  biomass = stock_m3_h * 1000 * 10 / 1000     # kg standing Artemia at 10 g/L·h conditioning (ASM)
  carrot.append({'dilution': f"1:{int(1/dil):,}", 'stock_L_s': round(stock_L_s, 2), 'stock_m3_h': round(stock_m3_h, 2),
                 'standing_artemia_kg': round(biomass, 1), 'tank_m3': round(max(1, biomass / 10 * 1.5), 1)})
out['carrot'] = carrot

# ───────────────────────── 5. Bill of materials (concept, Class-5) ─────────────────────────
sec_total = air['gateA']['sections_50m'] + air['gateB']['sections_50m'] + air['guard']['sections_50m']
diffuser_m = sum(a['length_m'] for a in air.values())
feeder_m = round(sum(feeders.values()))
bom = [
  ('Diffuser hose / perforated HDPE (EPDM slit sleeves)', f"{diffuser_m:,} m", 'All bubble lines incl. double guard'),
  ('Ballast clump anchors (60–100 kg, every 5 m)', f"{math.ceil(diffuser_m / 5):,}", 'Weak-link tethers, recoverable'),
  ('Section valves (pneumatic, shore valve house)', f"{sec_total}", '50 m sections'),
  ('Air feeder bundles HDPE DN50–DN200', f"{feeder_m:,} m", 'Trunk + section cores'),
  ('Oil-free screw compressors', ops['compressors'], f"{ops['installed_kw_n_plus_1']} kW installed"),
  ('Air receivers + dryers + aftercoolers', '2 sets', 'Gulf ambient 45 °C design'),
  ('ADCP current profilers', '3', 'Gate, basin, channel'),
  ('Overhead camera masts (EO/IR)', '2', 'Breakwater bend + head'),
  ('Imaging sonar on gate', '2', 'Night / turbid tracking'),
  ('Water-quality sondes (T, S, DO, pH, turbidity)', '3', 'Gate, exit N, intake'),
  ('Stick dosing skid (tank, metering pump, mixer)', '1', f"~{out['stick_carrier_m3_h']} m³/h carrier while dosing"),
  ('Stick diffuser manifold', f"{round(lens['stick'])} m", 'Behind gate, pulsed'),
  ('Carrot culture + conditioning tanks', f"{carrot[1]['tank_m3']} m³", '2 release points (N, W)'),
  ('Controller (PLC + tracking PC + historian)', '1 + hot spare', 'Fail-safe: air off, dosing off'),
]
out['bom'] = [{'item': a, 'qty': b, 'note': c} for a, b, c in bom]
out['sections_total'] = sec_total
out['diffuser_total_m'] = diffuser_m
out['feeder_total_m'] = feeder_m

# ───────────────────────── 6. Money ─────────────────────────
AED = 3.6725
cost = {
  'diffuser_aed_per_m': (1500, 4500),     # ASM marine install incl. vessel/divers; freshwater benchmark ≈ USD 1,250/m (Zielinski & Sorensen 2016)
  'compressor_aed_per_kw': (1800, 3500),
  'sensors_aed': (900_000, 2_200_000),
  'dosing_aed': (150_000, 450_000),
  'controls_aed': (300_000, 900_000),
}
capex_lo = diffuser_m * cost['diffuser_aed_per_m'][0] + ops['installed_kw_n_plus_1'] * cost['compressor_aed_per_kw'][0] + cost['sensors_aed'][0] + cost['dosing_aed'][0] + cost['controls_aed'][0]
capex_hi = diffuser_m * cost['diffuser_aed_per_m'][1] + ops['installed_kw_n_plus_1'] * cost['compressor_aed_per_kw'][1] + cost['sensors_aed'][1] + cost['dosing_aed'][1] + cost['controls_aed'][1]
capex_lo *= 1.0; capex_hi *= 1.3        # +30 % contingency on the high side
unit_day_mwh = 1400 * 24
val = {'usd_mwh_lo': 50, 'usd_mwh_hi': 80}
unit_day_usd = (unit_day_mwh * val['usd_mwh_lo'], unit_day_mwh * val['usd_mwh_hi'])
event_energy_aed = ops['mwh_event_typical'] * 1000 * 0.30    # ASM AED 0.30/kWh internal value
stick_event_aed = (mid_case['kg_per_event'] * 1100, mid_case['kg_per_event'] * 3700)   # ASM USD 300–1,000/kg bulk FCC grade
money = {
  'capex_aed': (round(capex_lo, -5), round(capex_hi, -5)),
  'unit_day_mwh': unit_day_mwh,
  'unit_day_usd': unit_day_usd,
  'unit_day_aed': (round(unit_day_usd[0] * AED, -4), round(unit_day_usd[1] * AED, -4)),
  'event_energy_aed': round(event_energy_aed, -2),
  'stick_event_aed': (round(stick_event_aed[0], -2), round(stick_event_aed[1], -2)),
  'payback_unit_days': (round(capex_lo / (unit_day_usd[1] * AED), 1), round(capex_hi / (unit_day_usd[0] * AED), 1)),
  'torness_gbp_day': 1_000_000, 'oman_lng_usd_day': 7_000_000,
}
out['money'] = money
out['pilot_budget'] = [
  {'stage': 'Bench flume + controller', 'lo': 2160, 'hi': 8640},
  {'stage': 'Contained biological feasibility', 'lo': 35625, 'hi': 125000},
  {'stage': 'One recoverable physical marine trial', 'lo': 105950, 'hi': 486200},
]

json.dump(out, open('/home/claude/work/design.json', 'w'), indent=1)
# Quick printout
print('layout', out['layout']); print('profile', out['pull_profile'])
for k in ['lengths_m', 'gate_span_m', 'feeders_m', 'dist_gate_to_intake_m', 'load', 'air', 'ops', 'stick_mid', 'stick_carrier_m3_h', 'carrot', 'money', 'sections_total', 'diffuser_total_m', 'feeder_total_m']:
  print(k, json.dumps(out[k]))
print('phys', json.dumps(phys))
out['phys'] = phys
json.dump(out, open('/home/claude/work/design.json', 'w'), indent=1)
for r in outcomes:
  print(r['scenario'], r['none'], {k: (r[k]['intake'], r[k]['reduction'], r[k]['t_at_screens']) for k in ['fixed', 'ctrl', 'ctrl_cues']})
# Drift time from gate to screens on intake-driven mean flow alone (tides ignored)
pp = sorted(out['pull_profile'], key=lambda r: -r['dist_km'])
t = 0
for a, b in zip(pp, pp[1:]):
  if a['dist_km'] > out['dist_gate_to_intake_m'] / 1000 + 0.3: continue
  t += (a['dist_km'] - b['dist_km']) * 1000 / ((a['u_m_s'] + b['u_m_s']) / 2)
out['drift_hours_gate_to_screens'] = round(t / 3600, 1)
# where intake pull equals swim speed
for a, b in zip(pp, pp[1:]):
  if a['u_m_s'] <= 0.0362 <= b['u_m_s']:
    f = (0.0362 - a['u_m_s']) / (b['u_m_s'] - a['u_m_s']); out['no_return_km'] = round(a['dist_km'] + f * (b['dist_km'] - a['dist_km']), 2)
json.dump(out, open('/home/claude/work/design.json', 'w'), indent=1)
print('drift h', out['drift_hours_gate_to_screens'], 'no-return km', out['no_return_km'])
