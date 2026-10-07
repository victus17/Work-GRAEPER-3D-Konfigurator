import type { Config } from './types';
import { HH_FUSE, LV_DEVICE_SIZES, NH_STRIPS, ACB_FEEDER_SLOTS, trafoRow, type TrafoRow, KVA_STEPS } from '../data/electrical';

const SQRT3 = Math.sqrt(3);

export interface ElecCalc {
  trafo: TrafoRow;
  count: number;
  totalKva: number;
  inHv: number;            // Bemessungsstrom OS je Trafo (A)
  inLv: number;            // Bemessungsstrom US je Trafo (A)
  ikLvKa: number;          // Anfangs-Kurzschlusswechselstrom an den US-Klemmen (kA), starres Netz
  ipLvKa: number;          // Stoßkurzschlussstrom (kA)
  incomerA: number;        // empfohlene Normgröße Trafoschalter (A)
  hhFuseA: number | null;  // Richtwert HH-Sicherung (A)
  p0Kw: number; pkKw: number;
  lossFullKw: number;      // Verlustleistung aller Trafos bei Volllast
  heatKw: number;          // abzuführende Wärme inkl. Zuschlag NS-Verteilung
  airflowM3h: number;      // Kühlluftbedarf bei ΔT = 15 K
  ventAreaM2: number;      // freier Zuluftquerschnitt je Traforaum (Faustformel 0,18·P/√H)
  fluidKg: number; fluidLiters: number;
  lwa: number;
  spl10m: number;          // Schalldruckpegel in 10 m (Freifeld, mit Gehäusedämpfung 3 dB)
  feederSumA: number;      // Summe Bemessungsströme der Abgänge
  stripSlots: number;      // benötigte Leistenplätze
}

export function stripSlots(c: Config): number {
  const lv = c.lv;
  return Math.ceil(lv.nh00 * 0.5) + lv.nh1 + lv.nh2 + lv.nh3 + lv.acbFeeders * ACB_FEEDER_SLOTS + lv.reserve;
}
export const feederCount = (c: Config) => c.lv.nh00 + c.lv.nh1 + c.lv.nh2 + c.lv.nh3 + c.lv.acbFeeders;

export function nextSize(amp: number, sizes = LV_DEVICE_SIZES): number {
  return sizes.find((s) => s >= amp * 0.999) ?? sizes[sizes.length - 1];
}

export function calcElectrical(c: Config): ElecCalc {
  const t = c.transformer;
  const row = trafoRow(t.powerKva, t.type);
  const count = t.count;
  const inHv = (t.powerKva * 1000) / (SQRT3 * t.primaryKv * 1000);
  const inLv = (t.powerKva * 1000) / (SQRT3 * t.secondaryV);
  const ikLvKa = (inLv / (t.ukPercent / 100)) / 1000;
  const kappa = ikLvKa > 50 ? 2.2 : ikLvKa > 20 ? 2.1 : ikLvKa > 10 ? 2.0 : 1.7; // Faktor n nach DIN EN 61439-1
  const p0Kw = row.p0 / 1000, pkKw = row.pk / 1000;
  const lossFullKw = count * (p0Kw + pkKw);
  const heatKw = count > 0 ? lossFullKw + 0.0006 * count * t.powerKva : 0; // ca. 0,6 W/kVA für NS-Verteilung und Verbindungen
  const fluidDensity = t.type === 'ester' ? 0.92 : 0.88;
  const fuseTable = HH_FUSE[t.primaryKv];
  const lwa = count > 0 ? row.lwa + (count > 1 ? 10 * Math.log10(count) : 0) : 0;
  const lv = c.lv;
  const feederSumA = lv.nh00 * 160 + lv.nh1 * 250 + lv.nh2 * 400 + lv.nh3 * 630 + lv.acbFeeders * 1000;
  return {
    trafo: row, count, totalKva: count * t.powerKva,
    inHv, inLv, ikLvKa, ipLvKa: ikLvKa * kappa,
    incomerA: nextSize(inLv),
    hhFuseA: fuseTable[t.powerKva] ?? null,
    p0Kw, pkKw, lossFullKw, heatKw,
    airflowM3h: (heatKw * 3600) / (1.2 * 1.005 * 15),
    ventAreaM2: count > 0 ? (0.18 * (p0Kw + pkKw + 0.0006 * t.powerKva)) / Math.sqrt(1.5) : 0,
    fluidKg: count * row.fluidKg, fluidLiters: Math.round((count * row.fluidKg) / fluidDensity),
    lwa, spl10m: count > 0 ? lwa - 20 * Math.log10(10) - 8 - 3 : 0,
    feederSumA, stripSlots: stripSlots(c),
  };
}

/* ---------- Bedarfsrechner ---------- */

export interface DemandResult { kw: number; kva: number; recommendedKva: number; count: number; loading: number; lines: { label: string; value: string }[] }

const wallboxSimultaneity = (n: number) => (n <= 1 ? 1 : Math.max(0.2, 1 / Math.sqrt(n)));
const dcSimultaneity = (n: number) => (n <= 1 ? 1 : n <= 2 ? 0.95 : n <= 4 ? 0.85 : n <= 8 ? 0.75 : n <= 16 ? 0.65 : 0.6);

export function calcDemand(c: Config): DemandResult | null {
  const d = c.demand;
  if (d.mode === 'direkt') return null;
  const lines: DemandResult['lines'] = [];
  let kw = 0; let cos = d.cosPhi;
  const f = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  if (d.mode === 'haushalte') {
    const hh = d.households * 2.0;
    const wp = d.heatPumps * 4.2;
    const g = wallboxSimultaneity(d.wallboxes);
    const wb = d.wallboxes * 11 * g;
    kw = hh + wp + wb;
    lines.push({ label: `${d.households} Haushalte × 2,0 kW (zeitgleicher Anteil)`, value: `${f(hh)} kW` });
    lines.push({ label: `${d.heatPumps} Wärmepumpen × 4,2 kW (§ 14a EnWG Mindestbezug)`, value: `${f(wp)} kW` });
    lines.push({ label: `${d.wallboxes} Wallboxen × 11 kW × g = ${g.toFixed(2)}`, value: `${f(wb)} kW` });
  } else if (d.mode === 'ladepark') {
    const gdc = dcSimultaneity(d.chargersDc), gac = wallboxSimultaneity(d.chargersAc);
    const dc = d.chargersDc * d.chargerDcKw * gdc, ac = d.chargersAc * d.chargerAcKw * gac;
    kw = dc + ac;
    lines.push({ label: `${d.chargersDc} DC-Ladepunkte × ${d.chargerDcKw} kW × g = ${gdc.toFixed(2)}`, value: `${f(dc)} kW` });
    lines.push({ label: `${d.chargersAc} AC-Ladepunkte × ${d.chargerAcKw} kW × g = ${gac.toFixed(2)}`, value: `${f(ac)} kW` });
  } else if (d.mode === 'pv') {
    kw = d.pvKwp * 0.9; cos = 0.9;
    lines.push({ label: `${f(d.pvKwp)} kWp × 0,9 (AC-Wirkleistung der Wechselrichter)`, value: `${f(kw)} kW` });
    lines.push({ label: 'Blindleistungsbereitstellung cos φ = 0,9 (VDE-AR-N 4110)', value: '÷ 0,90' });
  } else if (d.mode === 'gewerbe') {
    kw = d.connectedKw * d.simultaneity;
    lines.push({ label: `Anschlussleistung ${f(d.connectedKw)} kW × Gleichzeitigkeit ${d.simultaneity.toFixed(2)}`, value: `${f(kw)} kW` });
  } else if (d.mode === 'speicher') {
    kw = d.storageKw; cos = 0.9;
    lines.push({ label: `Speicherleistung ${f(d.storageKw)} kW`, value: `${f(kw)} kW` });
    lines.push({ label: 'Blindleistungsbereitstellung cos φ = 0,9', value: '÷ 0,90' });
  }
  const generation = d.mode === 'pv' || d.mode === 'speicher';
  const kvaRaw = kw / cos;
  const kva = generation ? kvaRaw : kvaRaw * (1 + d.reservePercent / 100);
  if (!generation) {
    lines.push({ label: `Scheinleistung bei cos φ = ${cos.toFixed(2)}`, value: `${f(kvaRaw)} kVA` });
    lines.push({ label: `Reserve für Zuwachs +${d.reservePercent} %`, value: `${f(kva)} kVA` });
  }
  const max = KVA_STEPS[KVA_STEPS.length - 1];
  let count = Math.max(1, Math.ceil(kva / max));
  let recommendedKva = KVA_STEPS.find((s) => s * count >= kva) ?? max;
  if (count > 1) recommendedKva = KVA_STEPS.find((s) => s * count >= kva) ?? max;
  return { kw, kva, recommendedKva, count, loading: kva / (recommendedKva * count), lines };
}

export const NH_SUMMARY = NH_STRIPS;
