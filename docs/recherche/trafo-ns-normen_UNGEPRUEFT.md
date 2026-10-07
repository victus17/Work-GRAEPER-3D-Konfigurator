# Engineering master data – transformers, LV side, standards (research for GRÄPER station configurator)

Research date: 2026-10-05 · Web research only · Raw text extracts of all cited PDFs: `research/src/*.txt` (same scratchpad).
Status labels used per table/value: **verifiziert (Quelle)** = read in the cited source during this research · **unsicher/Schätzung** = from memory of standards, own calculation, secondary snippet, or estimate · **nicht gefunden** = searched, no usable source.
General caveat: catalogue dimensions/weights are "ca." planning values of one manufacturer; spread between manufacturers is large (see 1.3). Always confirm with the actual transformer data sheet.

---

## 1. Distribution transformers

### 1.1 EU Ecodesign Tier 2 loss limits (Reg. (EU) 548/2014 as amended by (EU) 2019/1783, Tables I.1 / I.2) — verifiziert (3 Quellen)
Valid for three-phase medium power transformers, one winding Um ≤ 24 kV, other winding low voltage; values are maxima, no tolerance; intermediate ratings: linear interpolation. Tier 2 since 2021-07-01.
Sources: SGB-SMIT https://www.SGB-SMIT.com/fileadmin/user_upload/Downloads/Broschueren/European_Commission_s_Eco_Design_Regulation_Tier_2_-_July_1__2021/EU-Oekodesign-Verordnung_4.pdf · Siemens Energy https://assets.siemens-energy.com/dam/ae1397f8-02a9-453c-b640-b0580096a0fd/EcodesignLeaflet-pdf_Original%20file.pdf · Schneider Electric https://download.se.com/files?p_enDocType=Brochure&p_File_Name=ZXPOEKODESIGNTRAFO.pdf&p_Doc_Ref=ZXPOEKODESIGNTRAFO

| Sr kVA | Oil: P0 W (A0−10 %) | Oil: Pk W (Ak) | Dry/cast resin: P0 W (A0−10 %) | Dry: Pk W (Ak) |
|---|---|---|---|---|
| 50 | 81 | 750 | 180 (≤ 50 kVA) | 1500 |
| 100 | 130 | 1250 | 252 | 1800 |
| 160 | 189 | 1750 | 360 | 2600 |
| 250 | 270 | 2350 | 468 | 3400 |
| 315 | 324 | 2800 | (interp.) | (interp.) |
| 400 | 387 | 3250 | 675 | 4500 |
| 500 | 459 | 3900 | (interp.) | (interp.) |
| 630 | 540 | 4600 | 990 | 7100 |
| 800 | 585 | 6000 | 1170 | 8000 |
| 1000 | 693 | 7600 | 1395 | 9000 |
| 1250 | 855 | 9500 | 1620 | 11000 |
| 1600 | 1080 | 12000 | 1980 | 13000 |
| 2000 | 1305 | 15000 | 2340 | 16000 |
| 2500 | 1575 | 18500 | 2790 | 19000 |
| 3150 | 1980 | 23000 | 3420 | 22000 |

Correction factors (same sources, Table I.3a) — verifiziert: Um = 36 kV → oil: Pk +10 %, P0 +15 %; dry (LV ≤ 3.6 kV): Pk +10 %, P0 +15 %. Dual voltage on one winding with full power: Pk +10 %, P0 +15 %; dual voltage on both windings: +20 %/+20 %.
On-load/regulated distribution transformers (rONT): Tier 2 allowance P0 +10 % (Tier 1: P0 +20 %, Pk +5 %) — verifiziert as summarised by Končar https://koncar.hr/sites/default/files/dokumenti/2024-06/Ecodesign%20brochure.pdf (whether the +5 % Pk also applies in Tier 2 is not unambiguous there → check regulation text; unsicher).
\> 3150 kVA: no loss table, minimum Peak Efficiency Index (e.g. ≤ 4 MVA oil: 99.532 % Tier 2) — verifiziert (SGB-SMIT/Končar).

### 1.2 Oil-immersed, hermetically sealed, Tier 2 (AA0–Ak): Siemens FITformer planning data (06/20) — verifiziert (Siemens)
Source: https://assets.new.siemens.com/siemens/assets/api/uuid:21ad41c6-5498-4a93-bb12-d3884ada37bd/fitformer-de.pdf (Dyn5, ±2×2.5 %, LV 400 V; "Zirka-Angaben für die Planung"). Oil mass not stated in this sheet. 50 kVA and 3150 kVA not listed → Tier 2 dimensions for these: **nicht gefunden** (Tier 1 reference values in 1.3).

| Sr kVA | uk % | P0 W | Pk75 W | 10 kV: L×W×H mm | 10 kV: total kg | 20 kV: L×W×H mm | 20 kV: total kg | LWA dB | LPA 1 m dB |
|---|---|---|---|---|---|---|---|---|---|
| 100 | 4 | 130 | 1250 | 1150×700×1400 | 850 | 1150×700×1400 | 850 | 40 | 30 |
| 160 | 4 | 189 | 1750 | 1150×800×1500 | 1200 | 1150×800×1500 | 1200 | 43 | 32 |
| 250 | 4 | 270 | 2350 | 1250×800×1600 | 1500 | 1250×800×1600 | 1500 | 46 | 33 |
| 400 | 4 | 387 | 3250 | 1350×850×1600 | 1900 | 1350×850×1600 | 1900 | 49 | 36 |
| 630 | 4 | 540 | 4600 | 1450×950×1800 | 2600 | 1450×950×1800 | 2600 | 51 | 37 |
| 800 | 6 | 585 | 6000 | 2000×1200×2000 | 3500 | 1650×1200×1900 | 3400 | 52 | 38 |
| 1000 | 6 | 693 | 7600 | 2100×1200×2000 | 4500 | 1700×1200×1950 | 3800 | 54 | 40 |
| 1250 | 6 | 855 | 9500 | 2100×1200×2000 | 4500 | 1950×1200×2000 | 4000 | 55 | 41 |
| 1600 | 6 | 1080 | 12000 | 2100×1250×2000 | 4600 | 2100×1250×2100 | 4800 | 57 | 43 |
| 2000 | 6 | 1305 | 15000 | 2100×1400×2100 | 5100 | 2100×1400×2100 | 5000 | 59 | 45 |
| 2500 | 6 | 1575 | 18500 | 2300×1500×2300 | 6200 | 2300×1400×2200 | 6000 | 62 | 47 |

Roller centre distance (same sheet) — verifiziert: 100–250 kVA 520 mm · 400–800 kVA 670 mm · 1000–1600 kVA 820 mm · 2000–2500 kVA 1070 mm.
uk convention — verifiziert (Siemens, Cahors, Schneider): 4 % up to 630 kVA, 6 % from 800 kVA (630 kVA also offered with 6 %).
Siemens tender text confirms 800 kVA Tier 2: P0 585 W, Pk 6000 W, uk 6 %, LWA 52 dB: https://ausschreibungstexte.siemens.com/TIPLV/ (FITformer hermetic, EN 50588-1 tier 2).
Fit check hint (verifiziert from GRÄPER page, already in `research/`): GKP-S5 transformer bay "bis 1000 kVA / max. 200×130×180 cm (L/B/H)" – the Siemens 1000 kVA/20 kV Tier 2 unit above is 1950 mm high → configurator must check the real transformer envelope, not only kVA.

### 1.3 Oil quantity / second and third catalogues (oil mass and volume) — verifiziert, but loss class differs (see column "class")
Sources: (S16) Siemens "Planungsdaten für Öl-gekühlte Transformatoren, EU-VO 548/2014", status 11/16, Ck–A0 (= Tier 1): https://assets.new.siemens.com/siemens/assets/api/uuid:60d66ad5f0dc357c3d45887732919d6a017ef457/version:1513862202/04-planungsdaten-fuer-oel-gekuehlte-transformatoren-oekodesign.pdf · (CAH) Groupe Cahors/Transfix "Transformateurs à diélectrique liquide 50–3150 kVA", 15/20 kV / 410 V, table "Pertes A0Ak" (Pk = Ak, P0 = A0, i.e. close to but not fully Tier 2) and "A0Ck/A0Bk" (Tier 1): https://www.groupe-cahors.com/sites/default/files/transfos_dielectrique_liquide.pdf · (MIN) Schneider Electric Minera catalogue NRJED315632EN, 20 kV, A0Bk/A0Ck (Tier 1): https://download.se.com/files?p_Doc_Ref=NRJED315632EN

| Sr kVA | CAH A0Ak: L×W×H(cover)/H(bushings) mm | CAH A0Ak: oil l / oil kg / total kg | S16 Tier 1 (10/20 kV): L×W×H mm; oil kg / total kg; LWA | MIN A0Bk Tier 1: total kg / oil kg; LWA |
|---|---|---|---|---|
| 50 | – (A0Ck: 820×645×900/1020) | – (A0Ck: 91 l / 80 kg / 385 kg) | – | 580 / 190; 39 |
| 100 | – (A0Ck: 860×705×900/1065) | – (A0Ck: 109 / 95 / 525) | 1000×720×1400; 120 / 650; 41 | 740 / 185; 41 |
| 160 | – (A0Ck: 945×700×1000/1165) | – (A0Ck: 149 / 130 / 720) | 1000×750×1450; 140 / 800; 44 | 1000 / 195; 44 |
| 250 | 1100×700×1060/1230 | 234 / 205 / 1210 | 1100×800×1500; 190 / 1000; 47 | 1190 / 252; 47 |
| 400 | 1135×865×1175/1345 | 286 / 250 / 1520 | 1400×1100×1650; 270 / 1400; 50 | 1600 / 315; 50 |
| 630 | 1235×925×1275/1445 | 389 / 340 / 2110 | 1500×900×1800 (uk 4 %); 350 / 1900; 52 | 2110 / 398; 52 |
| 800 | 1425×1010×1345/1515 | 571 / 500 / 2655 | 1550×1000×1900; 450 / 2300; 53 | 2520 / 501; 53 |
| 1000 | 1425×970×1520/1750 | 663 / 580 / 3115 | 1500×1100×1800; 510 / 3200; 55 | 3030 / 601; 55 |
| 1250 | 1505×1025×1625/1870 | 766 / 670 / 3460 | 1600×1150×1850; 600 / 3600; 56 | 3170 / 611; 56 |
| 1600 | 1800×1000×1700/1945 | 874 / 765 / 3990 | 1850×1100×1900; 640 / 3800; 58 | 3890 / 670; 58 |
| 2000 | 1850×1075×1790/2045 | 1069 / 935 / 4740 | 1750×1400×2100; 700 / 4400; 60 | 4800 / 895; 60 |
| 2500 | on request (A0Bk: 2175×1130×1975/2290; 1366 l / 1195 kg / 5685 kg) | – | 1900×1400×2250; 900 / 5100; 63 | 5670 / 1060; 63 |
| 3150 | on request | – | 2000×1400×2400; 1100 / 6900; 63 | 6520 / 1190; 64 (2350×1310×1780 cover / 2500 bushings) |

Further verifiziert details: Cahors sound power (A0 core, valid for Ck and Ak): 50 kVA 39 · 100: 41 · 160: 44 · 250: 47 · 315: 49 · 400: 50 · 500: 51 · 630: 52 · 800: 53 · 1000: 55 · 1250: 56 · 1600: 58 · 2000: 60 · 2500: 63 · 3150: 64 dB(A). Cahors heights without rollers: −90 mm. Schneider Minera 36 kV (Tier 1) e.g. 630 kVA 2480 kg / oil 572 kg; 1000 kVA 3230 / 722; 2500 kVA 6630 / 1409; 3150 kVA 8940 / 2005 kg.
Planning rule for Tier 2 oil quantity — **unsicher/Schätzung** (derived from the three catalogues): oil mass ≈ 16–20 % of total mass; volume [l] ≈ mass [kg] / 0.87. Conservative sump planning values (max of the catalogues above, 12/24 kV): ≤ 250 kVA ≤ 300 l · 400 kVA ≤ 370 l · 630 kVA ≤ 460 l · 800 kVA ≤ 580 l · 1000 kVA ≤ 700 l · 1250 kVA ≤ 770 l · 1600 kVA ≤ 880 l · 2000 kVA ≤ 1070 l · 2500 kVA ≤ 1370 l · 3150 kVA ≈ 1370–1400 l (24 kV); 36 kV units up to +60 %. Total-mass spread Tier 2 at 630 kVA: 2110 kg (Cahors A0Ak) … 2600 kg (Siemens AA0Ak); at 1000 kVA: 3115 … 4500 kg.

### 1.4 Cast-resin dry-type (Gießharz), Tier 2 (AA0–Ak): Siemens GEAFOL Neo planning data (04/20) — verifiziert (Siemens)
Source: https://assets.new.siemens.com/siemens/assets/api/uuid:53b6276f-d9fb-4706-9b2d-9a36b278ec47/geafol-neo-stufe2-de.pdf (LV 400 V, ±2×2.5 %, IP00 without enclosure, Pk at 120 °C).

| Sr kVA | uk % | P0 W | Pk120 W | LWA dB | 10 kV: kg; L×W×H mm | 20 kV: kg; L×W×H mm | 30 kV (P0/Pk; kg; L×W×H) |
|---|---|---|---|---|---|---|---|
| 100 | 4 | 252 | 1800 | 49 | 800; 1250×695×985 | 1060; 1310×765×1250 | 290/1980 (uk 6); 1740; 1570×850×1530 |
| 160 | 4 | 360 | 2600 | 52 | 1120; 1320×710×1125 | 1390; 1450×785×1145 | 414/2860; 1610; 1530×840×1535 |
| 250 | 4 | 468 | 3400 | 55 | 1700; 1450×730×1235 | 1760; 1510×765×1260 | 538/3740; 2140; 1630×935×1595 |
| 315 | 4 | 558 | 3878 | 57 | 1990; 1510×820×1345 | 1930; 1560×855×1300 | 642/4266; 2430; 1680×940×1600 |
| 400 | 4 | 675 | 4500 | 58 | 2250; 1560×825×1410 | 2050; 1550×855×1435 | 675/4950; 2370; 1650×940×1720 |
| 500 | 4 | 812 | 5630 | 59 | 2530; 1590×830×1510 | 2370; 1580×855×1530 | 934/6194; 2610; 1690×945×1720 |
| 630 | 6 | 990 | 7100 | 61 | 1890; 1445×845×1465 | 2180; 1520×885×1560 | 1140/7800; 3000; 1750×935×1750 |
| 800 | 6 | 1170 | 8000 | 63 | 2270; 1530×860×1555 | 2540; 1585×895×1620 | 1350/8800; 3240; 1750×935×1890 |
| 1000 | 6 | 1395 | 9000 | 64 | 2670; 1610×990×1620 | 3090; 1695×1000×1740 | 1600/9900; 3690; 1780×1025×2055 |
| 1250 | 6 | 1620 | 11000 | 66 | 3160; 1660×990×1730 | 3580; 1760×1010×1820 | 1860/12100; 4030; 1805×1030×2170 |
| 1600 | 6 | 1980 | 13000 | 67 | 3750; 1735×990×1895 | 4160; 1835×1020×1900 | 2280/14300; 4900; 1915×1045×2310 |
| 2000 | 6 | 2340 | 16000 | 69 | 4660; 1870×1280×2050 | 5100; 1885×1280×2190 | 2690/17600; 5780; 1990×1280×2500 |
| 2500 | 6 | 2790 | 19000 | 70 | 5960; 2025×1280×2170 | 6440; 2080×1280×2285 | 3210/20900; 7160; 2155×1280×2545 |
| 3150 | 6 | 3420 | 22000 | 73 | 7660; 2160×1280×2475 | 8020; 2205×1280×2525 | 3930/24200; 8570; 2385×1280×2635 |

Same sheet — verifiziert: total losses at rated load / required cooling air at 25 °C: 630 kVA 8.8 kW / 27 m³/min · 1000 kVA 11.3 kW / 34.5 m³/min · 1600 kVA 16.3 kW / 49.5 m³/min · 2500 kVA 23.7 kW / 72 m³/min; forced ventilation ("-ZE50") up to 140 % from 500 kVA; roller distance 520 (100–250 kVA) / 670 (315–800) / 820 (1000–1600) / 1070 mm (2000–3150). 50 kVA cast resin: not in table → **nicht gefunden** (loss limit 180/1500 W applies).
Second data points — verifiziert: Legrand (Zucchini) AA0Ak 1000 kVA 20/0.41 kV: P0 1395 W, Pk 9000 W, 2900 kg, 1700×1000×1930 mm https://www.legrand.fr/pro/catalogue/42976-tension-primaire-20-kv-aluminium-tension-secondaire-410-v-aluminium/transformateur-htbt-a0-10ak-1000kva-3900kg-primaire-20kv-aluminium-1800x1000x2180mm · Siemens GEAFOL Neo 2000 kVA 20/0.48 kV (rectifier duty): 1920×1280×2100 mm, 4740 kg, roller distance 1070 mm, classes E2/C2/F1 https://assets.siemens-energy.com/dam/21d60220-d7c1-473c-8eef-b3db0095a922/GEAFOL-Distribution-Transformer-Information-acc--to-EU-Regulation-548-2014-pdf_Original%20file.pdf
Observation (from tables above, verifiziert by comparison): cast resin Tier 2 has ≈ 1.8× the no-load loss, ≈ 10–12 dB higher LWA and (≥ 630 kVA) similar or lower mass than oil Tier 2; no oil sump needed (see 6).

### 1.5 Ester-filled transformers (natural/synthetic ester, K-class) — vendor statements
| Statement | Status / source |
|---|---|
| Fire classes of insulating liquids: O = fire point ≤ 300 °C; K = fire point > 300 °C; K1 net calorific value ≥ 42 MJ/kg, K2 ≥ 32 MJ/kg, K3 < 32 MJ/kg | verifiziert (Cahors/Transfix, citing IEC 61100/61039): https://www.groupe-cahors.com/sites/default/files/argu_transfos_huile_vegetale_all_1.pdf |
| FR3 (natural ester) = class K2; mineral oil (Nynas Taurus) and low-viscosity natural ester (Nomex 970 FLD) = class O | verifiziert (same Cahors sheet) |
| Viscosity at 40 °C: mineral oil 10 mm²/s; low-viscosity natural ester 17; FR3 32–34; density 0.87 / 0.89 / 0.92 kg/dm³ | verifiziert (same) |
| With low-viscosity natural ester "Außenmaße, Gewichte und Kenndaten bleiben unverändert" (dimensions, weights and ratings unchanged vs. mineral oil) | verifiziert (Cahors vendor statement, same sheet). For K-class (high-viscosity) esters a size/weight increase is **not quantified** by any vendor source found → **nicht gefunden**; literature snippet (not vendor) mentions "larger masses, additional radiators" → unsicher |
| MIDEL 7131 (synthetic ester): flash point 260 °C (closed cup), density 0.97, readily biodegradable, **classified "allgemein wassergefährdend (awg)" under AwSV** | verifiziert (M&I Materials SDS v14, Jan 2023): https://www.uvp-verbund.de/documents-ige-ng/igc_mv/a0dd84e2-37ae-471d-925d-132a3e9766b7/3.5.1.5-GEN-SD%20Midel%207131%2001.01.23.pdf |
| FR3 (Cargill): flash point > 265 °C (PMCC), density 0.92 g/cm³, auto-ignition 401–404 °C; WGK of product "nicht bestimmt", soybean oil "allgemein wassergefährdend" | verifiziert (Cargill SDS 2023-09-14): https://www.uvp-verbund.de/documents-ige-ng/igc_mv/d696b745-7594-4a00-8f05-e0a70f36bec1/0110-6261_2-DE_SDS_ENVIROTEMP_FR3_sw.pdf |
| Fire points: MIDEL 7131 ≈ 316 °C (K3), FR3 ≈ 360 °C (K2) | unsicher (manufacturer figures from memory; not re-read in this research, only "K > 300 °C" verified) |
| DSO practice: Stromnetz Berlin uses synthetic or natural ester in its network transformers and treats them as "nicht wassergefährdend" (allowed in water protection zones II/III) | verifiziert (TB3351 V2, 01.04.2024) https://www.stromnetz.berlin/files/globalassets/dokumente/technische-beschreibungen/tb3351_aufstellung_kompaktstationen.pdf — **conflicts with the current SDS classification "awg"** → clarify per project with the water authority |
| On-load tap changer ECOTAP VPD usable in selected natural esters | verifiziert (MR flyer, see 2) |

---

## 2. Regulated distribution transformers (rONT)

| Item | Value | Status / source |
|---|---|---|
| MR ECOTAP VPD (HV-side vacuum OLTC): max. step voltage 825 V, Um up to 40.5 kV, switched current up to 30 A / 100 A, for transformers "bis zu 8 MVA (in Abhängigkeit der Oberspannung)"; 9 or 17 positions; 500,000 maintenance-free operations; up to 20 operations/min | verifiziert (MR flyer) https://www.reinhausen.com/fileadmin/downloadcenter/products/oltc/ecotap_vpd/flyer/in4910327_de.pdf |
| ECOTAP VPD 24-kV variant (VPD III 30D-24): 30 A, max. step voltage 550 V, 9 positions | unsicher (search-result snippet of MR 24-kV flyer, not opened) https://www.reinhausen.com/fileadmin/downloadcenter/products/oltc/ecotap_vpd/flyer/ecotap_vpd_24kv_de.pdf |
| Size delta: "Keine Footprintveränderung gegenüber konventionellen Transformatoren in fast jeder Leistungsklasse"; controller 10 cm wide × 35 cm high, mountable on the LV busbar "mit der Breite einer Sicherungsleiste"; IP30 (IP54 optional), −25…+70 °C | verifiziert (MR flyer; also MR presentation https://www.ees.tf.fau.de/files/2017/12/MR_Regelbarer_Ortsnetztrafo.pdf) |
| GRIDCON iTAP (predecessor): 160–2250 kVA at 10 kV, 160–4500 kVA at 20 kV (HV delta); 5, 7 or 9 steps up to 3 %, step voltage 600 V; uk 4 %/6 % | verifiziert (VDE FNN-Hinweis "rONT – Einsatzmöglichkeiten", 07/2016, table 4.4) https://vde.com/resource/blob/2346110/70ceee2211ab9bcb493c8e12ca1576d5/fnn-hinweis--regelbarer-ortsnetztransformator--ront----2016--data.pdf |
| Siemens FITformer REG (LV-side contactor switching): 250–630 kVA up to 36 kV; 3 load steps: ±2.5 % (250 kVA), ±3.3 % (400), ±4.0 % (630) | verifiziert (same FNN table) |
| Schneider Minera SGrid (LV contactors + booster): 160–1000 kVA, 7.2–36 kV; 5 or 9 steps of 1–2.5 % | verifiziert (same FNN table) |
| Typical DSO spec: 9 positions, ±4 × 2.5 % (or −3/+5 × 2.5 %), ratings 160/250/400/630 kVA | verifiziert (FNN-Hinweis, application examples) |
| Dimensions: "In den meisten Fällen können die Abmessungen (Grundfläche, Höhe) des rONT so gewählt werden, dass ein Einsatz in bestehenden Ortsnetzstationen möglich ist"; tank geometry, oil volume and cooling fins differ from a conventional unit; control unit approx. 40×40×20 cm or 20×80×15 cm (B×H×T), fits into compact stations "in der Regel" | verifiziert (FNN-Hinweis 4.2/4.3) |
| Numeric weight/size delta rONT vs. standard transformer (kg, mm) | **nicht gefunden** (no public table). Planning assumption: same footprint/roller gauge class, reserve for +5–10 % mass and +100–200 mm height/length → unsicher/Schätzung |
| Losses: rONT must still meet Ecodesign; Tier 2 P0 limit +10 % | verifiziert (see 1.1) |

---

## 3. HV HRC fuses (HH-Sicherungen) for transformer protection

### 3.1 Driescher recommendation for switch-fuse combinations acc. EN 62271-105 — verifiziert (Driescher)
Source: DRIESCHER HH-Sicherungen catalogue p. 12–13 https://www.driescher.de/wp-content/uploads/2020/06/DRIESCHER_HH_Sicherungen.pdf · criteria: inrush, 150 % overload, HV clearing of LV terminal short circuit. "max." only recommended when no NH fuse is used on the LV side. Fuse length e: 12 kV 292 mm, 24 kV 442 mm, 36 kV 537 mm.

| Sr kVA | 12 kV (10 kV grid): min–max A | 24 kV (20 kV grid): min–max A | 36 kV (30 kV grid): min–max A |
|---|---|---|---|
| 50 | 6.3 | 6.3 | 6.3 |
| 80 | 10 | 6.3 | 6.3 |
| 100 | 10–16 | 6.3–10 | 6.3–10 |
| 125 | 16–20 | 10–16 | 6.3–16 |
| 160 | 20–25 | 10–20 | 6.3–20 |
| 200 | 25–31.5 | 16–20 | 10–20 |
| 250 | 31.5–40 | 16–25 | 10–25 |
| 315 | 31.5–50 | 20–25 | 16–25 |
| 400 | 40–50 | 25–31.5 | 20–25 |
| 500 | 50–63 | 25–40 | 25–31.5 |
| 630 | 63 | 31.5–50 | 31.5 |
| 800 | 80 (SSK) | 40–50 | 31.5–40 |
| 1000 | 100 (SSK; with H22 switch only delayed tripping 250 ms) | 50–63 | 40 |
| 1250 | 125 (SSK; delayed / not with H22) | 63 | 40–50 |
| 1600 | not possible → circuit breaker | 80 | 50–63 |
| 2000 | – | 100 (SSK, delayed tripping 500 ms) | 63 |
| 2500 | – | 125 (SSK, delayed 500 ms) | 80 (delayed 500 ms) |
| 3150 | – | not possible → circuit breaker | 100 (delayed 500 ms) |
| 4000 | – | – | not possible → circuit breaker |

**Limit of fuse protection (Driescher): 10 kV up to 1250 kVA, 20 kV up to 2500 kVA, 30 kV up to 3150 kVA** — verifiziert.

### 3.2 Siemens assignment for GIS switchgear 8DJH / NXPLUS C with SIBA HHD/SSK fuses (uk ≤ 7 %) — verifiziert (Siemens)
Source: Siemens TIP "Technische Schriftenreihe Ausgabe 2 – Schutz von Verteilungstransformatoren … durch Lastschalter-Sicherungs-Kombinationen", Tables 4/5 https://assets.new.siemens.com/siemens/assets/api/uuid:6993e54055e2f878797f0a1e3a00f8c894dfd2b3/ausgabe-2-ms-lastschalter-sicherungs-kombinationen.pdf

| Sr kVA | 8DJH 10–12 kV: HHD (A) / SSK (A) | 8DJH 20–24 kV: HHD 442 mm (A) / SSK (A) |
|---|---|---|
| 50 | 10 | 6.3 |
| 100 | 16 | 6.3–10 |
| 160 | 20–25 | 10–16 |
| 250 | 25–40 | 16–20 |
| 400 | 40–50 / SSK 63–80 | 20–31.5 |
| 630 | 63–80 / SSK 63–100 | 31.5–50 / SSK 63 |
| 800 | 63–100 / SSK 80–125 | 31.5–50 / SSK 63 |
| 1000 | 100 (442 mm) / SSK 100–125 | 50–63 / SSK 63–80 |
| 1250 | – / SSK 125 | 80 / SSK 80 |
| 1600 | – | – / SSK 100 |
| 2000 | – | "auf Anfrage" (NXPLUS C: SSK 100) |

Limits: 8DJH 10 kV → 1250 kVA; 8DJH 20 kV → 1600 kVA (2000 on request); NXPLUS C 20 kV → 2000 kVA — verifiziert. Same paper: max. grid voltage ≤ 87 % of fuse rated voltage unless tested otherwise; minimum breaking current ≈ 3 × In; continuous loading of a fuse inside the GIS canister is below fuse In (example: 1250 kVA / 20 kV with 80 A fuse → only ≈ 105–116 % of transformer rated power continuously) — verifiziert.

### 3.3 SIBA general selection guide (HHD, air; acc. DIN VDE 0670-402), type C = no LV main fuse — verifiziert with restriction (PDF table text partly scrambled on extraction; cells marked * are uncertain readings)
Source: https://sub02.siba.de/upload/Downloads/kataloge/HHT_Transformer_Application_Guide_Rev1b.pdf

| Sr kVA | 10–12 kV A | 20–24 kV A | 30–36 kV A |
|---|---|---|---|
| 50 | 10* | 6.3* | 4–6.3* |
| 100 | 16–25 | 10 | 6.3–10 |
| 160 | 20–31.5 | 16–20 | 10–16 |
| 250 | 25–40 | 16–25 | 10–20 |
| 400 | 31.5*–50 | 20–40 | 16–25 |
| 630 | 63–80 | 31.5–63 | 20–40 |
| 800 | 80–125 | 40–63 | 25–50 |
| 1000 | 100–160 | 50–80 | 31.5–50 |
| 1250 | 160 | 80 | 50 |
| 1600 | 200 | 100 | 63 |
| 2000 | 250 | 125 | 2×40 (parallel) |

With gG NH fuses on the LV side (type B) SIBA lists the matching NH rating: 50 kVA 63 A · 100: 125 A · 125: 160 A · 160: 200 A · 200: 250 A · 250: 315 A · 315: 400 A · 400: 500 A · 500: 630 A · 630: 800 A · 800: 1000 A · 1000: 1250 A — verifiziert (same guide).
DSO overlay — unsicher: many German TAB Mittelspannung limit switch-fuse protection to ≈ 630–1000 kVA and require a circuit breaker with protection relay above; DSO-specific, check the TAB of the grid operator.

---
