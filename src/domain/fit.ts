import type { CompactStation, Config, RoomKind, SerieStation } from './types';
import { COMPACT_STATIONS, SERIE_STATIONS, PROFESSIONAL, INDIVIDUAL, WALKIN_CONSTR as K } from '../data/stations';
import { mvVendor, trafoRow, umForKv } from '../data/electrical';
import { calcElectrical, stripSlots, feederCount } from './calc';
import { fwActive, lvSize, mvSize } from './layout';

export type FitLevel = 'ok' | 'warn' | 'no';
export interface FitReason { level: FitLevel; text: string }
export interface FitResult {
  station: CompactStation;
  level: FitLevel;
  reasons: FitReason[];
  usage: { trafo: number; mv: number; lv: number };
  score: number;
}

const needsFwRoom = (c: Config) => c.equipment.telecontrol === 'ueberwacht' || c.equipment.telecontrol === 'steuerbar';

/** Prüft, ob eine Kompaktstation die gewählte elektrische Ausrüstung aufnehmen kann. */
export function fitCompact(c: Config, s: CompactStation): FitResult {
  const reasons: FitReason[] = [];
  const no = (text: string) => reasons.push({ level: 'no', text });
  const warn = (text: string) => reasons.push({ level: 'warn', text });
  const t = c.transformer;
  const usage = { trafo: 0, mv: 0, lv: 0 };

  // Transformator
  if (t.count > 1) no('Kompaktstationen nehmen genau einen Transformator auf – für mehrere Transformatoren eine begehbare Station wählen.');
  if (t.count === 0 && s.maxKva > 0) no('Typ ist als Transformatorstation ausgelegt; für Stationen ohne Transformator ist die HKP-E-Ü vorgesehen.');
  if (t.count >= 1 && s.maxKva === 0) no('Reine Schalt-/Übergabestation ohne Transformatorraum.');
  if (t.count === 1 && s.maxKva > 0) {
    usage.trafo = t.powerKva / s.maxKva;
    if (t.powerKva > s.maxKva) {
      if (s.optKva && t.powerKva <= s.optKva) warn(`${t.powerKva} kVA nur als Option möglich (Serie bis ${s.maxKva} kVA) – Erwärmung/Gehäuseklasse wird von GRÄPER geprüft.`);
      else no(`Transformator ${t.powerKva} kVA überschreitet die maximale Leistung von ${s.optKva ?? s.maxKva} kVA.`);
    }
    const tr = trafoRow(t.powerKva, t.type);
    if (t.type === 'giessharz') warn('Gießharztransformatoren werden üblicherweise in begehbaren Stationen eingesetzt (Kühlluftbedarf, Abmessungen).');
    if (s.trafoMax && t.powerKva <= (s.optKva ?? s.maxKva) && (tr.l > s.trafoMax.l || tr.b > s.trafoMax.b || tr.h > s.trafoMax.h))
      warn(`Typische Trafoabmessungen (${tr.l} × ${tr.b} × ${tr.h} cm) liegen über dem Stellplatz (${s.trafoMax.l} × ${s.trafoMax.b} × ${s.trafoMax.h} cm) – Fabrikat abstimmen.`);
    if (t.ront) warn('Regelbarer Ortsnetztransformator: Mehrmaße des Stufenschalters mit dem Trafostellplatz abgleichen.');
  }

  // Mittelspannung
  const v = mvVendor(c.mv.vendorId);
  const m = mvSize(c);
  const n = c.mv.fields.length;
  usage.mv = Math.max(n / s.mv.maxFields, m.w / s.mv.box.w);
  if (n > 0) {
    if (!v.compact) no(`${v.vendor} ${v.product} ist für Kompaktstationen nicht vorgesehen (Platzbedarf).`);
    if (n > s.mv.maxFields) no(`${n} MS-Felder – der Typ nimmt maximal ${s.mv.maxFields} Felder auf.`);
    else if (m.w > s.mv.box.w + 1) no(`MS-Anlage ${m.w} cm breit – Einbauraum nur ${s.mv.box.w} cm.`);
    if (v.compact && m.h > s.mv.box.h + 1) no(`MS-Anlage ${m.h} cm hoch – Einbauhöhe nur ${s.mv.box.h} cm.`);
    if (v.compact && m.d > s.mv.box.d + 1) warn(`MS-Anlage ${m.d} cm tief – Einbautiefe ${s.mv.box.d} cm, Ausführung abstimmen.`);
    if (c.mv.fields.some((f) => f.type === 'M') && !s.mv.metering) no('Ein MS-Messfeld ist bei diesem Typ nicht vorgesehen.');
    if (umForKv(t.primaryKv) === 36 && s.mv.box.h < 190) warn('36-kV-Schaltanlagen erfordern größere Einbauräume – Machbarkeit durch GRÄPER prüfen lassen.');
  } else if (t.count > 0) warn('Keine MS-Schaltanlage konfiguriert.');

  // Niederspannung
  const slots = stripSlots(c);
  const fwOn = fwActive(c, s);
  if (!s.lv) {
    if (t.count > 0 || feederCount(c) > 0) no('Typ besitzt keine Niederspannungsverteilung.');
  } else {
    const max = fwOn && s.fw?.reducesStripsTo ? s.fw.reducesStripsTo : s.lv.maxStrips;
    usage.lv = slots / max;
    if (slots > max) no(`${slots} Leistenplätze benötigt – maximal ${max} möglich${fwOn && s.fw?.reducesStripsTo ? ' (mit Fernwirkraum)' : ''}.`);
    if (s.lv.stripNote === 'Gr. 3' && c.lv.nh00 + c.lv.nh1 + c.lv.nh2 > 0) warn('NS-Verteilung dieses Typs ist für Leisten Gr. 3 (630 A) ausgelegt.');
    if (c.lv.billingMeters > 0 && !s.lv.billing) {
      if (s.fw) warn('Niederspannungsseitige Verrechnungsmessung ist bei diesem Typ nicht serienmäßig vorgesehen – Platz im NS-/Fernwirkraum abstimmen.');
      else no('Niederspannungsseitige Verrechnungsmessung ist bei diesem Typ nicht vorgesehen.');
    }
    if (c.lv.design === 'gekapselt') warn('Kompaktstationen werden mit offener, berührungsgeschützter NS-Verteilung ausgerüstet.');
    if (c.lv.compensationKvar > 0) warn('Kompensationsanlage findet in der Kompaktstation i. d. R. keinen Platz – extern oder begehbare Station vorsehen.');
  }

  // Sekundärtechnik
  if (needsFwRoom(c) && !s.fw) warn('Kein separater Fernwirkraum – Fernwirktechnik nur als Kleingerät im NS-Raum möglich.');
  if (c.site.boundaryBuild && s.closedSides.length === 0) warn('Keine geschlossene Seite – für Grenzbebauung sind HKP-E2, GKP-S4 oder GKP-S5 besser geeignet.');
  if (c.building.concrete === 'normal' && !s.concreteOptions.includes('normal')) warn('Typ wird ausschließlich in Leichtbeton gefertigt.');
  if (s.status === 'auslaufend') warn(s.statusNote ?? 'Auslaufender Typ.');
  if (s.status === 'angekuendigt') warn(s.statusNote ?? 'Typ ist angekündigt.');

  const level: FitLevel = reasons.some((r) => r.level === 'no') ? 'no' : reasons.some((r) => r.level === 'warn') ? 'warn' : 'ok';
  const statusPenalty = s.status === 'aktiv' ? 0 : s.status === 'auslaufend' ? 40 : 25;
  const fwBonus = c.equipment.telecontrol !== 'ohne' && s.fw && !s.fw.optional ? -3 : 0;
  const score = (level === 'no' ? 1000 : level === 'warn' ? 100 : 0) + reasons.filter((r) => r.level === 'warn').length * 12 + s.installArea + statusPenalty + fwBonus;
  return { station: s, level, reasons, usage, score };
}

export function rankCompact(c: Config): FitResult[] {
  return COMPACT_STATIONS.map((s) => fitCompact(c, s)).sort((a, b) => a.score - b.score);
}

/* ---------- Begehbare Stationen ---------- */

export interface WalkInNeed { roomKinds: RoomKind[]; roomLens: number[]; clearW: number; lengthCm: number; widthCm: number; split: number[] }

/** Ermittelt die kleinste sinnvolle Raumaufteilung für die gewählte Ausrüstung (Planungsansatz). */
export function walkInNeed(c: Config): WalkInNeed {
  const t = c.transformer;
  const e = calcElectrical(c);
  const m = mvSize(c); const l = lvSize(c, e.inLv);
  const kinds: RoomKind[] = []; const lens: number[] = [];
  let needW = 200;
  if (c.mv.fields.length > 0 || t.count > 0) {
    const both = m.w + (l.w > 0 && t.count > 0 ? l.w + 25 : 0) + 30;
    const front = Math.max(m.w + 30, l.w + 170);
    const sameWall = both <= 560 || t.count === 0;
    kinds.push('ms'); lens.push(Math.max(220, Math.ceil(sameWall ? both : front)));
    needW = Math.max(needW, m.d + 100 + (sameWall ? 0 : l.d + 10));
  }
  if (t.count > 0) {
    const tr = trafoRow(t.powerKva, t.type);
    for (let i = 0; i < t.count; i++) { kinds.push('trafo'); lens.push(Math.max(130, tr.b + 50)); }
    needW = Math.max(needW, tr.l + 60);
  }
  if (kinds.length === 0) { kinds.push('technik'); lens.push(336); }
  const sum = lens.reduce((a, b) => a + b, 0);
  const raw = sum + 2 * K.wall + (kinds.length - 1) * K.partition;
  const lengthCm = Math.min(PROFESSIONAL.lengthMax, Math.max(PROFESSIONAL.lengthMin, Math.ceil(raw / PROFESSIONAL.lengthStep) * PROFESSIONAL.lengthStep));
  const widthCm = PROFESSIONAL.widths.find((w) => w - 2 * K.wall >= needW) ?? PROFESSIONAL.widths[PROFESSIONAL.widths.length - 1];
  // Reserve dem Schaltraum zuschlagen
  const spare = lengthCm - raw;
  const adj = lens.map((x, i) => (i === 0 ? x + spare : x));
  const total = adj.reduce((a, b) => a + b, 0);
  return { roomKinds: kinds, roomLens: adj, clearW: needW, lengthCm, widthCm, split: adj.map((x) => x / total) };
}

export interface SerieFit { serie: SerieStation; level: FitLevel; reasons: FitReason[] }
export function fitSerie(c: Config, s: SerieStation): SerieFit {
  const reasons: FitReason[] = [];
  const t = c.transformer; const m = mvSize(c); const e = calcElectrical(c); const l = lvSize(c, e.inLv);
  if (t.count === 0 && s.kind === 'trafostation') reasons.push({ level: 'warn', text: 'Typ besitzt einen Transformatorraum, der unbelegt bliebe.' });
  if (t.count > 0 && s.kind === 'schaltstation') reasons.push({ level: 'no', text: 'Schaltstation ohne Transformatorraum.' });
  if (t.count > 1) reasons.push({ level: 'no', text: 'Serienstationen sind für einen Transformator ausgelegt – System Professional wählen.' });
  if (t.count === 1 && t.powerKva > s.maxKva && s.maxKva > 0) reasons.push({ level: 'no', text: `Transformator ${t.powerKva} kVA – Typ bis ${s.maxKva} kVA.` });
  const n = c.mv.fields.length;
  if (n > s.mvFields202) reasons.push({ level: 'no', text: `${n} MS-Felder – maximal ${s.mvFields202} Felder (DIN EN 62271-202).` });
  else if (n > s.mvFields312) reasons.push({ level: 'warn', text: `${n} MS-Felder nur gemäß DIN EN 62271-202 geprüft; nach Ableitungsnorm DIN EN 62271-312 maximal ${s.mvFields312}.` });
  if (m.w > s.mvBox.w) reasons.push({ level: 'no', text: `MS-Anlage ${m.w} cm breit – Stellfläche ${s.mvBox.w} cm.` });
  if (m.h > s.mvBox.h) reasons.push({ level: 'no', text: `MS-Anlage ${m.h} cm hoch – maximal ${s.mvBox.h} cm.` });
  if (t.count > 0 && l.w > s.wallArea.w) reasons.push({ level: 'warn', text: `NS-Verteilung ca. ${l.w} cm breit – zusätzliche Wandmontagefläche ${s.wallArea.w} cm.` });
  const level: FitLevel = reasons.some((r) => r.level === 'no') ? 'no' : reasons.some((r) => r.level === 'warn') ? 'warn' : 'ok';
  return { serie: s, level, reasons };
}
export const rankSerie = (c: Config) => SERIE_STATIONS.map((s) => fitSerie(c, s));

export function clampWalkIn(c: Config): Config['building']['walkIn'] {
  const w = { ...c.building.walkIn };
  if (w.system === 'professional') {
    w.widthCm = PROFESSIONAL.widths.reduce((a, b) => (Math.abs(b - w.widthCm) < Math.abs(a - w.widthCm) ? b : a));
    w.lengthCm = Math.min(PROFESSIONAL.lengthMax, Math.max(PROFESSIONAL.lengthMin, Math.round(w.lengthCm / PROFESSIONAL.lengthStep) * PROFESSIONAL.lengthStep));
    if (!PROFESSIONAL.roomHeights.includes(w.roomHeightCm)) w.roomHeightCm = w.roomHeightCm > 252 ? 260 : 245;
    if (w.cellarCm !== 0 && !PROFESSIONAL.cellarHeights.includes(w.cellarCm)) w.cellarCm = PROFESSIONAL.cellarHeights.reduce((a, b) => (Math.abs(b - w.cellarCm) < Math.abs(a - w.cellarCm) ? b : a));
    if (w.cellarCm === 0) w.cellarCm = 78;
  } else if (w.system === 'individual') {
    w.lengthCm = Math.round(Math.min(INDIVIDUAL.lengthMax, Math.max(INDIVIDUAL.lengthMin, w.lengthCm)));
    w.widthCm = Math.round(Math.min(INDIVIDUAL.widthMax, Math.max(INDIVIDUAL.widthMin, w.widthCm)));
    w.roomHeightCm = Math.round(Math.min(INDIVIDUAL.roomHeightMax, Math.max(INDIVIDUAL.roomHeightMin, w.roomHeightCm)));
    w.cellarCm = Math.round(Math.min(INDIVIDUAL.cellarMax, Math.max(0, w.cellarCm)));
  }
  if (w.rooms.length === 0) { w.rooms = ['technik']; w.roomSplit = [1]; }
  if (w.roomSplit.length !== w.rooms.length) w.roomSplit = w.rooms.map(() => 1 / w.rooms.length);
  const sum = w.roomSplit.reduce((a, b) => a + b, 0) || 1;
  w.roomSplit = w.roomSplit.map((x) => Math.max(0.08, x / sum));
  const s2 = w.roomSplit.reduce((a, b) => a + b, 0);
  w.roomSplit = w.roomSplit.map((x) => x / s2);
  return w;
}
