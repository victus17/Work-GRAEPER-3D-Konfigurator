import { describe, expect, it } from 'vitest';
import { defaultConfig, mvFields } from '../src/domain/defaults';
import { applyFix, derive, normalize } from '../src/domain/engine';
import { calcElectrical, calcDemand } from '../src/domain/calc';
import { fitCompact, rankCompact, walkInNeed } from '../src/domain/fit';
import { COMPACT_STATIONS, compactById } from '../src/data/stations';
import { USE_CASES } from '../src/data/usecases';
import type { Config } from '../src/domain/types';

const cfg = (patch: (c: Config) => void = () => {}): Config => { const c = defaultConfig(); patch(c); return normalize(c); };

describe('Elektrische Berechnung', () => {
  it('630 kVA / 20 kV / 400 V', () => {
    const e = calcElectrical(cfg());
    expect(e.inHv).toBeCloseTo(18.19, 1);
    expect(e.inLv).toBeCloseTo(909.3, 0);
    expect(e.ikLvKa).toBeCloseTo(22.7, 1);       // In / uk = 909 A / 0,04
    expect(e.incomerA).toBe(1000);
    expect(e.hhFuseA).toBe(50);
    expect(e.lossFullKw).toBeCloseTo(5.14, 2);   // Ökodesign Stufe 2: 540 W + 4.600 W
  });
  it('2500 kVA mit uk 6 % liefert ca. 60 kA', () => {
    const e = calcElectrical(cfg((c) => { c.transformer.powerKva = 2500; c.transformer.ukPercent = 6; }));
    expect(e.inLv).toBeCloseTo(3608, 0);
    expect(e.ikLvKa).toBeCloseTo(60.1, 1);
    expect(e.incomerA).toBe(4000);
  });
  it('Bedarfsrechner Ladepark', () => {
    const d = calcDemand(cfg((c) => { c.demand.mode = 'ladepark'; c.demand.chargersDc = 8; c.demand.chargerDcKw = 300; c.demand.chargersAc = 0; }))!;
    expect(d.kw).toBeCloseTo(8 * 300 * 0.75, 0);
    expect(d.recommendedKva).toBe(2500);
    expect(d.loading).toBeLessThanOrEqual(1);
  });
  it('Bedarfsrechner teilt große Leistungen auf mehrere Transformatoren auf', () => {
    const d = calcDemand(cfg((c) => { c.demand.mode = 'pv'; c.demand.pvKwp = 8000; }))!;
    expect(d.count).toBe(3);
    expect(d.count * d.recommendedKva).toBeGreaterThanOrEqual(d.kva);
  });
});

describe('Stationswahl Kompaktstationen', () => {
  it('Katalog ist konsistent', () => {
    for (const s of COMPACT_STATIONS) {
      expect(s.h).toBeGreaterThan(s.buried + 150);
      for (const d of s.doors) {
        const len = d.side === 'A' || d.side === 'C' ? s.x : s.z;
        expect(Math.abs(d.c) + d.w / 2, `${s.name} Tür Seite ${d.side}`).toBeLessThanOrEqual(len / 2 - 5);
        expect(d.y0 + d.h, `${s.name} Türhöhe`).toBeLessThan(s.h - s.buried - s.ventRing - 8);
        expect(s.closedSides.includes(d.side), `${s.name} geschlossene Seite ${d.side}`).toBe(false);
      }
      for (const r of s.rooms) {
        expect(r.x0).toBeGreaterThanOrEqual(-s.x / 2); expect(r.x1).toBeLessThanOrEqual(s.x / 2);
        expect(r.z0).toBeGreaterThanOrEqual(-s.z / 2); expect(r.z1).toBeLessThanOrEqual(s.z / 2);
      }
    }
  });
  it('Standard-Ortsnetzstation 630 kVA KKT wählt eine kleine aktive Station', () => {
    const c = cfg();
    const best = rankCompact(c)[0];
    expect(best.level).not.toBe('no');
    expect(best.station.status).toBe('aktiv');
    expect(best.station.maxKva).toBeGreaterThanOrEqual(630);
    expect(c.building.compactId).toBe(best.station.id);
  });
  it('MKP scheitert an 8 Leistenplätzen, HKP-E-Ü am Transformator', () => {
    const c = cfg();
    expect(fitCompact(c, compactById('mkp')).level).toBe('no');
    expect(fitCompact(c, compactById('hkp-e-ue')).level).toBe('no');
  });
  it('3150 kVA lässt nur die GBÜ-R3 zu', () => {
    const c = cfg((x) => { x.transformer.powerKva = 3150; x.transformer.ukPercent = 6; x.mv.fields = mvFields('K', 'K', 'LS'); x.mv.protection = 'umz'; x.lv.nh00 = 0; x.lv.nh2 = 0; x.lv.nh3 = 10; });
    const ok = rankCompact(c).filter((r) => r.level !== 'no').map((r) => r.station.id);
    expect(ok).toEqual(['gbue-r3']);
    expect(c.building.compactId).toBe('gbue-r3');
  });
  it('Messfeld erfordert GBÜ-Typ bzw. HKP-E-Ü', () => {
    const c = cfg((x) => { x.mv.fields = mvFields('K', 'K', 'M', 'T'); });
    const ok = rankCompact(c).filter((r) => r.level !== 'no');
    expect(ok.length).toBeGreaterThan(0);
    expect(ok.every((r) => r.station.mv.metering)).toBe(true);
  });
  it('Zwei Transformatoren → keine Kompaktstation, Korrektur führt zur begehbaren Station', () => {
    const c = cfg((x) => { x.transformer.count = 2; x.mv.fields = mvFields('K', 'K', 'T', 'T'); });
    expect(rankCompact(c).every((r) => r.level === 'no')).toBe(true);
    const d = derive(c);
    const f = d.findings.find((x) => x.id === 's-none');
    expect(f?.fix?.action).toBe('station.walkin');
    const fixed = applyFix(c, f!.fix!.action);
    expect(fixed.building.kind).toBe('begehbar');
    expect(fixed.building.walkIn.rooms.filter((r) => r === 'trafo').length).toBe(2);
    expect(derive(fixed).findings.filter((x) => x.severity === 'error')).toEqual([]);
  });
});

describe('Regelwerk', () => {
  it('SF6 bei 20 kV wird als Fehler gemeldet und lässt sich korrigieren', () => {
    const c = cfg((x) => { x.mv.insulation = 'sf6'; x.mv.vendorId = 'siemens-8djh36'; });
    const d = derive(c);
    expect(d.findings.some((f) => f.id === 'm-sf6' && f.severity === 'error')).toBe(true);
    const fixed = applyFix(c, 'ms.sf6frei');
    expect(derive(fixed).findings.some((f) => f.id === 'm-sf6' || f.id === 'm-um')).toBe(false);
  });
  it('HH-Sicherung bei 2500 kVA / 10 kV ist unzulässig', () => {
    const c = cfg((x) => { x.transformer.powerKva = 2500; x.transformer.primaryKv = 10; x.transformer.ukPercent = 6; });
    const d = derive(c);
    expect(d.findings.some((f) => f.id === 'm-hh-limit')).toBe(true);
    const fixed = applyFix(c, 'ms.ls');
    expect(fixed.mv.fields.some((f) => f.type === 'LS')).toBe(true);
    expect(fixed.mv.protection).toBe('umz');
  });
  it('Alle Anwendungs-Startwerte sind fehlerfrei konfigurierbar', () => {
    for (const u of USE_CASES) {
      let c = normalize(u.apply(defaultConfig()));
      let d = derive(c);
      // angebotene Korrekturen anwenden (max. 6 Durchläufe)
      for (let i = 0; i < 6 && d.findings.some((f) => f.severity === 'error' && f.fix); i++) {
        c = applyFix(c, d.findings.find((f) => f.severity === 'error' && f.fix)!.fix!.action);
        d = derive(c);
      }
      expect(d.findings.filter((f) => f.severity === 'error').map((f) => `${u.id}: ${f.title} – ${f.text}`)).toEqual([]);
      expect(d.geometry.x).toBeGreaterThan(100);
    }
  });
  it('Gewichte liegen im Bereich der Katalogwerte', () => {
    for (const s of COMPACT_STATIONS.filter((x) => x.maxKva > 0)) {
      const c = cfg((x) => { x.building.autoSelect = false; x.building.compactId = s.id; x.transformer.powerKva = s.maxKva; x.transformer.ukPercent = 6; });
      const w = derive(c).weights;
      expect(w.totalT!, s.name).toBeGreaterThan(s.weightEmptyT);
      expect(w.totalT!, s.name).toBeLessThan(s.weightEquippedT * 1.15);
    }
  });
  it('Begehbare Station: Bedarfsermittlung liefert Rastermaße', () => {
    const c = cfg((x) => { x.transformer.powerKva = 1600; x.transformer.ukPercent = 6; x.transformer.count = 2; x.mv.fields = mvFields('K', 'K', 'LS', 'LS', 'M'); x.mv.protection = 'umz'; });
    const need = walkInNeed(c);
    expect(need.lengthCm % 30).toBe(0);
    expect([254, 282, 303, 342, 363]).toContain(need.widthCm);
    expect(need.roomKinds).toEqual(['ms', 'trafo', 'trafo']);
  });
  it('Baugrube Kompaktstation entspricht der GRÄPER-Aushubskizze (GKP-S5: 560 × 440 cm)', () => {
    const c = cfg((x) => { x.building.autoSelect = false; x.building.compactId = 'gkp-s5'; });
    const ex = derive(c).excavation;
    expect(ex.topX).toBe(560); expect(ex.topZ).toBe(440);
    expect(ex.depth).toBe(95);
  });
});
