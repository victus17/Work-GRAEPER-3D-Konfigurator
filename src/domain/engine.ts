import type { Config, Finding, MvField, Severity, StepId } from './types';
import { calcElectrical, calcDemand, feederCount, stripSlots, type ElecCalc, type DemandResult } from './calc';
import { buildGeometry, lvSize, mvSize, walkInRooms, walkInDims, wallThickness, fwActive, autoDoors, type Geometry } from './layout';
import { fitCompact, rankCompact, rankSerie, walkInNeed, clampWalkIn, type FitResult, type SerieFit, type WalkInNeed } from './fit';
import { compactById, WALKIN_CONSTR as K, PROFESSIONAL, PLANTS } from '../data/stations';
import { HH_LIMIT_KVA, LS_RECOMMENDED_FROM_KVA, LV_MAX_A, MV_VENDORS, mvVendor, trafoRow, umForKv } from '../data/electrical';
import { CABLE_ENTRIES, SURFACES } from '../data/options';
import { SERIE_RAL } from '../data/ral';
import { useCase } from '../data/usecases';
import { mvFields, uid } from './defaults';

/* ---------- Gewichte ---------- */

export interface Weights {
  emptyT: number | null;       // Baukörper ohne E-Ausbau
  equipmentT: number;          // Trafo, MS, NS, Sonstiges
  totalT: number | null;       // Transportgewicht
  catalogMaxT: number | null;  // Katalogwert „mit E-Ausbau"
  concreteM3: number | null;
  parts: { label: string; kg: number }[];
}

export function calcWeights(c: Config, g: Geometry, e: ElecCalc): Weights {
  const parts: Weights['parts'] = [];
  const t = c.transformer;
  if (t.count > 0 && !t.customerSupplied) parts.push({ label: `${t.count} × Transformator ${t.powerKva} kVA`, kg: t.count * trafoRow(t.powerKva, t.type).kg });
  if (c.mv.fields.length > 0 && !c.mv.customerSupplied) parts.push({ label: `MS-Schaltanlage (${c.mv.fields.length} Felder)`, kg: c.mv.fields.reduce((s, f) => s + (f.type === 'M' ? 350 : f.type === 'LS' || f.type === 'UE' ? 220 : 150), 0) });
  if (t.count > 0 && !c.lv.customerSupplied) parts.push({ label: 'NS-Verteilung', kg: Math.round(120 + stripSlots(c) * 14 + (e.incomerA > 1600 ? 180 : 60)) });
  if (c.building.kind !== 'trafostand') parts.push({ label: 'Kabel, Kleinteile, Zubehör', kg: t.count > 0 ? 150 : 60 });
  const equipmentT = parts.reduce((s, p) => s + p.kg, 0) / 1000;
  const dens = c.building.concrete === 'normal' ? 2.45 : 1.95; // bewehrter Normal- bzw. GRÄPER-Leichtbeton (Richtwert)
  if (g.kind === 'kompakt' && g.station) {
    const emptyT = g.station.weightEmptyT * (c.building.concrete === 'normal' ? 1.16 : 1);
    return { emptyT, equipmentT, totalT: emptyT + equipmentT, catalogMaxT: g.station.weightEquippedT, concreteM3: +(emptyT / dens).toFixed(1), parts };
  }
  if (g.kind === 'begehbar') {
    const dm = walkInDims(c); const wt = wallThickness(c);
    const L = g.x / 100, B = g.z / 100;
    const structT = (c.building.walkIn.wall === 'sandwich' ? 0.19 : 0.12);
    const wallH = (g.bodyTop - g.plinthTop) / 100;
    const openArea = g.openings.reduce((s, o) => s + (o.w * o.h) / 10000, 0);
    const walls = (2 * (L + B) - 4 * (wt / 100)) * wallH * structT - openArea * structT;
    const roof = (L + 0.18) * (B + 0.18) * (K.roofSlab / 100) * (g.roofForm === 'flach' ? 1 : 1.25);
    const floor = (L - 0.24) * (B - 0.24) * (c.building.walkIn.floor === 'beton' ? K.floorSlab / 100 : 0.03);
    const nPart = g.rooms.length - 1;
    const part = nPart * (B - 0.24) * (dm.roomH / 100) * (K.partition / 100);
    const tub = dm.cellar > 0 ? L * B * (K.baseSlab / 100) + 2 * (L + B) * (dm.cellar / 100) * 0.14 + nPart * (B - 0.28) * (dm.cellar / 100) * 0.12 : L * B * (K.baseSlab / 100);
    const vol = walls + roof + floor + part + tub;
    const emptyT = vol * dens + (c.building.walkIn.wall === 'wdvs' ? 0.02 * 2 * (L + B) * wallH : 0);
    return { emptyT, equipmentT, totalT: emptyT + equipmentT, catalogMaxT: null, concreteM3: +vol.toFixed(1), parts };
  }
  return { emptyT: null, equipmentT, totalT: null, catalogMaxT: null, concreteM3: null, parts };
}

/* ---------- Baugrube / Gründung ---------- */

export interface Excavation {
  depth: number;                     // Aushubtiefe cm (inkl. Planum)
  bedThickness: number;              // Sand-/Splittbett cm
  bottomX: number; bottomZ: number;  // Sohle cm
  topX: number; topZ: number;        // Geländeoberkante cm
  volumeM3: number; bedM3: number; backfillM3: number;
  earthRingM: number;
  workSpace: number;
  notes: string[];
}

export function calcExcavation(c: Config, g: Geometry): Excavation {
  const bed = g.kind === 'kompakt' ? 20 : 10;
  const work = 50;
  const depth = g.buried + bed;
  const slope = g.kind === 'kompakt' ? 50 : Math.round(depth / Math.tan((60 * Math.PI) / 180));
  const bottomX = g.x + 2 * work, bottomZ = g.z + 2 * work;
  const topX = bottomX + 2 * slope, topZ = bottomZ + 2 * slope;
  const A1 = (bottomX * bottomZ) / 1e4, A2 = (topX * topZ) / 1e4, h = depth / 100;
  const volumeM3 = depth > 0 ? (h / 3) * (A1 + A2 + Math.sqrt(A1 * A2)) : 0;
  const bedM3 = A1 * (bed / 100);
  const stationBelow = ((g.x * g.z) / 1e4) * (g.buried / 100);
  const notes: string[] = [];
  if (g.kind === 'kompakt') {
    notes.push('Feinplanum auf −75 cm: nach Nivellement planeben abgezogenes, verdichtetes Sandbett (mind. 20 cm, wie für großflächige Pflasterarbeiten).');
    notes.push('Arbeitsraum umlaufend mind. 50 cm; bei Anwendung des BDEW-Musterwortlauts TAB Mittelspannung vor Kabeleinführungen mind. 150 cm.');
  } else if (g.kind === 'begehbar') {
    notes.push('Feinplanum: nach Nivellement planeben abgezogener Feinsplitt 2/5 oder vergleichbar (± 1 cm). Gründung frostsicher herstellen.');
    notes.push('Unterkante Außenwand liegt mind. 4 cm über Oberkante fertiges Gelände. Böschungswinkel nach örtlichen Gegebenheiten (45° bei nichtbindigen, 60° bei steifen bindigen Böden).');
    if (g.buried > 60) notes.push('Bei Eingrabtiefen über 0,6 m ist bauseits ein Baugrubenzugang anzulegen; Wasserhaltung und Gebäudeeinmessung bauseits.');
  } else {
    notes.push('Gründung des Trafostands nach statischer Berechnung auf tragfähigem, frostsicherem Planum.');
  }
  notes.push('Die Aushubskizze geht von einer zulässigen Bodenpressung von 200 kN/m² aus – Baugrund örtlich und eigenverantwortlich prüfen.');
  return {
    depth, bedThickness: bed, bottomX, bottomZ, topX, topZ, volumeM3, bedM3,
    backfillM3: Math.max(0, volumeM3 - bedM3 - stationBelow),
    earthRingM: Math.ceil((2 * (g.x + g.z + 400)) / 100), workSpace: work, notes,
  };
}

/* ---------- Logistik ---------- */

export interface Logistics { transportWidth: number; oversize: boolean; escort: boolean; craneNeeded: boolean; pieces: number; text: string }
export function calcLogistics(c: Config, g: Geometry, w: Weights): Logistics {
  const tw = Math.min(g.x, g.z) + (g.kind === 'kompakt' ? 2 * g.roofOverhang : 0);
  const total = w.totalT ?? 0;
  const craneNeeded = total > 14 || g.kind !== 'kompakt';
  const pieces = g.kind === 'trafostand' ? 3 : c.building.walkIn.modules > 1 && g.kind === 'begehbar' ? c.building.walkIn.modules : 1;
  return {
    transportWidth: tw, oversize: tw > 255, escort: tw > 300, craneNeeded, pieces,
    text: craneNeeded ? 'Autokran erforderlich (Gewicht/Ausladung)' : 'Entladung mit GRÄPER-Lkw-Ladekran möglich (Abladegewicht 8–14 t, abhängig von der Ausladung)',
  };
}

/* ---------- Technik-Check ---------- */

const ORDER: Record<Severity, number> = { error: 0, warn: 1, info: 2, ok: 3 };
const nf = (n: number, d = 0) => n.toLocaleString('de-DE', { maximumFractionDigits: d, minimumFractionDigits: d });

export function check(c: Config, e: ElecCalc, g: Geometry, w: Weights, ranking: FitResult[], serieFits: SerieFit[], demand: DemandResult | null): Finding[] {
  const out: Finding[] = [];
  const add = (id: string, severity: Severity, step: StepId, title: string, text: string, fix?: Finding['fix']) => out.push({ id, severity, step, title, text, fix });
  const uc = useCase(c.useCase);
  const t = c.transformer; const mv = c.mv; const lv = c.lv;
  const steps = uc.steps;
  const has = (s: StepId) => steps.includes(s);

  /* Transformator */
  if (has('trafo') && t.count > 0) {
    if (t.powerKva >= 800 && t.ukPercent === 4)
      add('t-uk', 'warn', 'trafo', 'Kurzschlussspannung prüfen', `Transformatoren ab 800 kVA werden nach DIN EN 50588-1 üblicherweise mit uk = 6 % ausgeführt. Mit 4 % steigt der Kurzschlussstrom auf ca. ${nf(e.ikLvKa, 1)} kA.`, { label: 'uk = 6 % übernehmen', action: 'trafo.uk6' });
    if (demand && demand.kva > e.totalKva * 1.001)
      add('t-demand', 'warn', 'trafo', 'Transformator kleiner als ermittelter Bedarf', `Der Bedarfsrechner ergibt ${nf(demand.kva)} kVA, konfiguriert sind ${nf(e.totalKva)} kVA.`, { label: `${demand.count > 1 ? demand.count + ' × ' : ''}${nf(demand.recommendedKva)} kVA übernehmen`, action: 'trafo.demand' });
    if (t.type !== 'giessharz')
      add('t-whg', 'info', 'trafo', 'Gewässerschutz (WHG/AwSV)', `Die monolithische, öldichte Fundamentwanne nimmt die gesamte Isolierflüssigkeit auf (ca. ${nf(e.fluidLiters)} l). GRÄPER ist WHG-Fachbetrieb.`);
    if (t.count > 1 && c.building.kind === 'kompakt')
      add('t-multi', 'error', 'trafo', 'Begehbare Station erforderlich', 'Kompaktstationen nehmen genau einen Transformator auf. Für mehrere Transformatoren wird eine begehbare Station mit je einem Traforaum geplant.', { label: 'Begehbare Station planen', action: 'station.walkin' });
    if (t.count > 1)
      add('t-parallel', 'info', 'trafo', 'Mehrere Transformatoren', 'Bei Parallelbetrieb müssen Schaltgruppe, Übersetzung und uk übereinstimmen; der Kurzschlussstrom der NSHV addiert sich. Alternativ getrennte Sammelschienen mit Kuppelschalter und Verriegelung.');
    if (t.secondaryV !== 400)
      add('t-us', 'info', 'trafo', `Unterspannung ${t.secondaryV} V`, 'Sonderspannung für Wechselrichter-/Speicheranlagen: NS-Schaltgeräte und Sicherungen müssen für diese Bemessungsspannung ausgelegt sein; Eigenbedarf (230/400 V) über Hilfstransformator.');
    if (t.ront)
      add('t-ront', 'info', 'trafo', 'Regelbarer Ortsnetztransformator', 'rONT regeln die Niederspannung unter Last und erhöhen die Aufnahmefähigkeit des Netzes für PV, Wärmepumpen und Ladepunkte. Steuerung und Sensorik werden im Fernwirk-/NS-Raum untergebracht.');
  }

  /* Mittelspannung */
  if (has('ms')) {
    const um = umForKv(t.primaryKv);
    const vendor = mvVendor(mv.vendorId);
    const n = mv.fields.length;
    const feeders = mv.fields.filter((f) => f.type === 'T' || f.type === 'LS').length;
    const hasLs = mv.fields.some((f) => f.type === 'LS' || f.type === 'UE');
    if (n === 0) add('m-none', 'error', 'ms', 'Keine MS-Felder', 'Bitte mindestens ein Feld der Mittelspannungs-Schaltanlage anlegen.', { label: 'Standardanlage KKT anlegen', action: 'ms.default' });
    if (n > 0 && mv.insulation === 'sf6' && um <= 24)
      add('m-sf6', 'error', 'ms', 'SF6 bis 24 kV nicht mehr zulässig', 'Nach der EU-F-Gase-Verordnung 2024/573 dürfen neue Mittelspannungs-Schaltanlagen bis einschließlich 24 kV mit fluorierten Treibhausgasen seit dem 1. Januar 2026 nicht mehr in Betrieb genommen werden. GRÄPER hat das Portfolio vollständig auf SF6-freie Technik umgestellt.', { label: 'Auf SF6-freie Anlage umstellen', action: 'ms.sf6frei' });
    if (n > 0 && mv.insulation === 'sf6' && um > 24)
      add('m-sf6-36', 'info', 'ms', 'SF6 in der 36-kV-Ebene', 'Für Anlagen über 24 kV bis 52 kV gilt das Inbetriebnahmeverbot ab 1. Januar 2030. Bis dahin sind SF6-Anlagen zulässig, sofern keine geeignete Alternative verfügbar ist.');
    if (n > 0 && !vendor.um.includes(um))
      add('m-um', 'error', 'ms', 'Schaltanlage passt nicht zur Netzspannung', `${vendor.vendor} ${vendor.product} ist für ${vendor.um.join('/')} kV bemessen, das Netz erfordert Um = ${um} kV.`, { label: 'Passende Anlage wählen', action: 'ms.vendorAuto' });
    if (t.count > 0 && n > 0 && feeders < t.count)
      add('m-feeder', 'error', 'ms', 'Transformatorabgang fehlt', `Für ${t.count} Transformator${t.count > 1 ? 'en' : ''} ${feeders === 0 ? 'ist kein' : 'sind zu wenige'} Trafo- bzw. Leistungsschalterfeld(er) vorhanden.`, { label: 'Feld ergänzen', action: 'ms.addFeeder' });
    if (t.count > 0 && mv.protection === 'hh') {
      if (t.powerKva > HH_LIMIT_KVA[t.primaryKv])
        add('m-hh-limit', 'error', 'ms', 'HH-Sicherung nicht mehr möglich', `Bei ${t.primaryKv} kV sind Transformatoren über ${nf(HH_LIMIT_KVA[t.primaryKv])} kVA nicht mehr über HH-Sicherungen zu schützen. Erforderlich ist ein Leistungsschalterfeld mit UMZ-Schutz.`, { label: 'Leistungsschalter mit UMZ', action: 'ms.ls' });
      else if (t.powerKva >= LS_RECOMMENDED_FROM_KVA)
        add('m-hh-rec', 'warn', 'ms', 'Leistungsschalter empfohlen', `Ab ca. ${nf(LS_RECOMMENDED_FROM_KVA)} kVA verlangen viele Netzbetreiber einen Leistungsschalter mit UMZ-Schutz (TAB des Netzbetreibers prüfen). GRÄPER bietet ab 800 kVA ein Leistungsschalterfeld mit UMZ-Schutz an.`, { label: 'Leistungsschalter mit UMZ', action: 'ms.ls' });
      if (!mv.fields.some((f) => f.type === 'T') && n > 0)
        add('m-hh-field', 'error', 'ms', 'Trafofeld für HH-Sicherung fehlt', 'Das Schutzkonzept „HH-Sicherung" benötigt ein Trafofeld (T) mit Lasttrennschalter-Sicherungs-Kombination.', { label: 'Feld ergänzen', action: 'ms.addFeeder' });
    }
    if ((mv.protection === 'umz' || mv.protection === 'umz_qu') && n > 0 && !hasLs)
      add('m-umz-field', 'error', 'ms', 'UMZ-Schutz erfordert Leistungsschalter', 'Ein UMZ-Schutzgerät wirkt auf einen Leistungsschalter. Bitte ein Leistungsschalter- oder Übergabefeld vorsehen.', { label: 'Trafofeld durch Leistungsschalter ersetzen', action: 'ms.ls' });
    if ((c.useCase === 'erzeugung' || c.useCase === 'speicher') && mv.protection !== 'umz_qu' && n > 0)
      add('m-qu', 'warn', 'ms', 'Schutz für Erzeugungsanlagen', 'Erzeugungsanlagen und Speicher am Mittelspannungsnetz benötigen nach VDE-AR-N 4110 in der Regel einen übergeordneten Entkupplungsschutz und Q-U-Schutz am Netzanschlusspunkt.', { label: 'UMZ + Q-U-Schutz wählen', action: 'ms.qu' });
    if (c.useCase === 'kundenstation' && n > 0 && !mv.fields.some((f) => f.type === 'M') && lv.billingMeters === 0)
      add('m-mess', 'warn', 'ms', 'Keine Verrechnungsmessung vorgesehen', 'Kundenstationen benötigen eine Verrechnungsmessung – niederspannungsseitig (Wandlermessung) oder mittelspannungsseitig im Messfeld. Die Messart legt der Netzbetreiber fest.', { label: 'NS-Wandlermessung ergänzen', action: 'ns.billing' });
    if (t.count > 1 && n > 0 && !mv.fields.some((f) => f.type === 'M') && lv.billingMeters < t.count && (c.useCase === 'kundenstation' || c.useCase === 'ladepark'))
      add('m-mess2', 'info', 'ms', 'Messung bei mehreren Transformatoren', 'Bei mehreren Transformatoren wird üblicherweise mittelspannungsseitig gemessen (ein Messfeld statt je einer NS-Messung).');
    if (n > 0 && mv.fields.filter((f) => f.type === 'K').length < 2 && c.useCase === 'ortsnetz')
      add('m-ring', 'info', 'ms', 'Stichanschluss', 'Mit nur einem Kabelfeld wird die Station im Stich angeschlossen. Für die Einschleifung in einen Ring sind zwei Kabelfelder erforderlich.');
    if (c.equipment.telecontrol === 'steuerbar' && !mv.motorDrives && n > 0)
      add('m-motor', 'warn', 'ms', 'Fernsteuerung ohne Motorantriebe', 'Für fernsteuerbare Stationen müssen die Lasttrenn- bzw. Leistungsschalter mit Motorantrieben ausgerüstet sein.', { label: 'Motorantriebe ergänzen', action: 'ms.motor' });
    if (mv.ikKa > 20 && n > 0)
      add('m-ik', 'warn', 'ms', 'Störlichtbogenklassifizierung', 'Die GRÄPER-Stationen sind nach DIN EN 62271-202 mit IAC-AB 20 kA/1 s klassifiziert. Höhere Kurzschlussströme erfordern eine gesonderte Bewertung.');
    if (n > 0 && t.count > 0 && mv.protection === 'hh' && e.hhFuseA)
      add('m-fuse', 'info', 'ms', 'HH-Sicherung', `Richtwert für ${t.powerKva} kVA an ${t.primaryKv} kV: HH-Sicherungseinsätze ${String(e.hhFuseA).replace('.', ',')} A (Auswahltabelle des Sicherungsherstellers ist maßgebend).`);
  }

  /* Niederspannung */
  if (has('ns') && t.count > 0) {
    const maxA = lv.design === 'offen' ? LV_MAX_A.open : LV_MAX_A.enclosed;
    if (e.inLv > LV_MAX_A.enclosed)
      add('n-max', 'error', 'ns', 'Bemessungsstrom zu hoch', `Der Trafostrom von ${nf(e.inLv)} A übersteigt den größten Bemessungsstrom der NS-Schaltanlagen (6.300 A). Leistung aufteilen oder höhere Unterspannung wählen.`);
    else if (e.inLv > maxA)
      add('n-design', 'error', 'ns', 'Gekapselte NS-Schaltanlage erforderlich', `Offene Gerüstverteilungen werden bis ca. ${nf(LV_MAX_A.open)} A gebaut. Für ${nf(e.inLv)} A ist ein typgeprüftes Schranksystem (bis 6.300 A) erforderlich.`, { label: 'Gekapselte Bauweise wählen', action: 'ns.gekapselt' });
    if (lv.incomer === 'nh' && e.inLv > 1250)
      add('n-inc-nh', 'error', 'ns', 'NH-Einspeisung nicht möglich', `NH-Sicherungen sind bis 1.250 A (NH4a) verfügbar – der Trafostrom beträgt ${nf(e.inLv)} A.`, { label: 'Leistungsschalter wählen', action: 'ns.incomerLs' });
    else if (lv.incomer === 'lasttrenner' && e.inLv > 2500)
      add('n-inc-lt', 'warn', 'ns', 'Leistungsschalter als Einspeisung empfohlen', `Bei ${nf(e.inLv)} A wird die Einspeisung üblicherweise mit einem offenen Leistungsschalter (ACB) ausgeführt.`, { label: 'Leistungsschalter wählen', action: 'ns.incomerLs' });
    add('n-ik', e.ikLvKa > 50 ? 'warn' : 'info', 'ns', 'Kurzschlussfestigkeit der NSHV', `Anfangs-Kurzschlusswechselstrom an den Trafoklemmen ca. ${nf(e.ikLvKa, 1)} kA (Stoßstrom ca. ${nf(e.ipLvKa, 0)} kA)${t.count > 1 ? ' je Transformator' : ''}. Sammelschienen und Schaltgeräte müssen dafür bemessen sein (Bauartnachweis nach DIN EN IEC 61439).`);
    if (feederCount(c) === 0)
      add('n-none', 'warn', 'ns', 'Keine Abgänge', 'Die Niederspannungsverteilung hat noch keine Abgänge.');
    if (lv.billingMeters > 0)
      add('n-mess', 'info', 'ns', 'Verrechnungsmessung', `Halbindirekte Wandlermessung mit ${lv.ctSupplied ? 'vom Netzbetreiber beigestellten' : 'geeichten'} Stromwandlern (Übersetzung passend zu ${nf(e.incomerA)} A). Zählerplatz und Wandleranordnung nach TAB des Netzbetreibers.`);
    if (e.feederSumA > 0 && e.feederSumA < e.inLv * 0.6)
      add('n-util', 'info', 'ns', 'Abgänge decken den Trafostrom nicht ab', `Summe der Abgangsbemessungsströme ${nf(e.feederSumA)} A bei ${nf(e.inLv)} A Trafostrom – ggf. weitere Abgänge oder Reserveplätze vorsehen.`);
  }

  /* Station */
  if (c.building.kind === 'kompakt') {
    const cur = ranking.find((r) => r.station.id === c.building.compactId) ?? fitCompact(c, compactById(c.building.compactId));
    const best = ranking[0];
    const fix = best && best.level !== 'no' && best.station.id !== cur.station.id ? { label: `${best.station.name} übernehmen`, action: 'station.best' } : undefined;
    cur.reasons.forEach((r, i) => add(`s-fit-${i}`, r.level === 'no' ? 'error' : 'warn', 'station', r.level === 'no' ? `${cur.station.name} passt nicht` : `${cur.station.name}: Hinweis`, r.text, r.level === 'no' ? fix : undefined));
    if (cur.level === 'no' && (!best || best.level === 'no'))
      add('s-none', 'error', 'station', 'Keine Kompaktstation geeignet', 'Die gewählte Ausrüstung übersteigt die Möglichkeiten der Kompaktstationen. Eine begehbare Station (System Professional) bietet den nötigen Raum.', { label: 'Begehbare Station planen', action: 'station.walkin' });
    if (cur.level === 'ok')
      add('s-ok', 'ok', 'station', `${cur.station.name} passt`, 'Transformator, Mittel- und Niederspannung finden im gewählten Baukörper Platz.');
  } else if (c.building.kind === 'begehbar') {
    const wi = c.building.walkIn; const dm = walkInDims(c);
    const { rooms, clearW } = walkInRooms(c);
    if (wi.system === 'serie') {
      const f = serieFits.find((s) => s.serie.id === wi.serieId);
      f?.reasons.forEach((r, i) => add(`s-serie-${i}`, r.level === 'no' ? 'error' : 'warn', 'station', r.level === 'no' ? `${f.serie.name} passt nicht` : `${f.serie.name}: Hinweis`, r.text, r.level === 'no' ? { label: 'System Professional planen', action: 'station.professional' } : undefined));
    }
    if (uc.electrical) {
      const trafoRooms = rooms.filter((r) => r.kind === 'trafo').length;
      if (t.count > trafoRooms) add('s-rooms', 'error', 'station', 'Transformatorraum fehlt', `${t.count} Transformator(en), aber nur ${trafoRooms} Transformatorraum/-räume.`, { label: 'Raumaufteilung automatisch anpassen', action: 'station.autosize' });
      if (c.mv.fields.length > 0 && !rooms.some((r) => r.kind === 'ms')) add('s-msroom', 'error', 'station', 'Schaltraum fehlt', 'Für die MS-Schaltanlage ist kein Schaltraum vorgesehen.', { label: 'Raumaufteilung automatisch anpassen', action: 'station.autosize' });
      g.items.filter((i) => i.clipped).forEach((i, k) => {
        const what = i.kind === 'trafo' ? 'Transformator' : i.kind === 'ms' ? 'MS-Schaltanlage' : i.kind === 'ns' ? 'NS-Verteilung' : 'Zählerschrank';
        add(`s-clip-${k}`, i.kind === 'zaehler' ? 'warn' : 'error', 'station', `${what} findet keinen Platz`, `${what} (${nf(i.w)} × ${nf(i.d)} cm) passt mit den erforderlichen Abständen nicht in den Raum „${g.rooms[i.room]?.label}".`, { label: 'Maße automatisch ermitteln', action: 'station.autosize' });
      });
      const ms = g.items.find((i) => i.kind === 'ms');
      if (ms) {
        const nsFront = g.lvOnFront ? g.items.find((i) => i.kind === 'ns')?.d ?? 0 : 0;
        const aisle = clearW - ms.d - 8 - nsFront - (nsFront ? 4 : 0);
        if (aisle < 80) add('s-aisle', 'error', 'station', 'Bediengang zu schmal', `Vor der Schaltanlage verbleiben nur ${nf(aisle)} cm. Gänge in elektrischen Betriebsstätten müssen mindestens 80 cm breit sein (DIN VDE 0101-1).`, { label: 'Maße automatisch ermitteln', action: 'station.autosize' });
        else if (aisle < 100) add('s-aisle2', 'info', 'station', 'Bediengang', `Bediengang vor der Schaltanlage ${nf(aisle)} cm (Mindestmaß 80 cm nach DIN VDE 0101-1).`);
      }
      rooms.forEach((r, i) => {
        const hasDoor = g.openings.some((o) => o.kind === 'door' && (((o.side === 'A' || o.side === 'C') && o.c > r.x0 - 4 && o.c < r.x1 + 4) || (o.side === 'D' && i === 0) || (o.side === 'B' && i === rooms.length - 1)));
        if (!hasDoor) add(`s-door-${i}`, 'error', 'huelle', 'Raum ohne Tür', `Der Raum „${r.label}" (${i + 1}) hat keinen Zugang.`, { label: 'Türen automatisch anordnen', action: 'huelle.autodoors' });
      });
      if (t.count > 0) {
        const tr = trafoRow(t.powerKva, t.type);
        const tDoors = g.openings.filter((o) => o.kind === 'door' && o.room === 'trafo');
        if (tDoors.length > 0 && Math.max(...tDoors.map((o) => o.w)) < tr.b + 10)
          add('s-tdoor', 'warn', 'huelle', 'Trafotür zu schmal', `Der Transformator ist ca. ${tr.b} cm breit – die Tür des Traforaums sollte mindestens ${tr.b + 10} cm lichte Breite haben.`, { label: 'Türen automatisch anordnen', action: 'huelle.autodoors' });
        const free = g.openings.filter((o) => o.room === 'trafo').reduce((s, o) => s + ((o.kind === 'grille' ? o.w * o.h : o.style === 'v80' ? o.w * 160 : o.style === 'v40' ? o.w * 80 : o.style === 'louver' ? o.w * o.h : 0) / 1e4) * 0.5, 0) / Math.max(1, t.count);
        const forced = c.equipment.accessories['lueftung_thermo'] === true;
        const hood = c.building.walkIn.roofHood ? 0.32 : 0;
        const need = e.ventAreaM2 * 2.1 * (forced ? 0.5 : 1);
        if (free + hood < need * 0.9)
          add('s-vent', 'warn', 'huelle', 'Lüftungsquerschnitt knapp', `Je Traforaum werden für ca. ${nf(e.heatKw / t.count, 1)} kW Verlustwärme rund ${nf(need, 2)} m² freier Querschnitt (Zu- und Abluft) benötigt, vorhanden sind ca. ${nf(free + hood, 2)} m²${forced ? ' (mit Zwangsbelüftung)' : ''}. Größere bzw. weitere Gitter, Dachhaube oder thermostatgesteuerte Zwangsbelüftung vorsehen; die Erwärmungsprüfung erfolgt durch GRÄPER.`, forced ? undefined : { label: 'Zwangsbelüftung und Dachhaube ergänzen', action: 'huelle.vent' });
      }
    }
    if (dm.z > 363 || dm.x > 1200)
      add('s-ind', 'info', 'station', 'Großformat', 'Abmessungen oberhalb des Systems Professional werden als System Individual zentimetergenau geplant; monolithische Wanne bis 18 × 5 m.');
    if (c.building.walkIn.wall === 'standard' && (c.equipment.climate || c.useCase === 'telekom'))
      add('s-wall', 'warn', 'station', 'Dämmung empfohlen', 'Für klimatisierte bzw. temperaturempfindliche Technik wird die Sandwich-Bauweise mit wärmebrückenfreier Dämmung empfohlen.', { label: 'Sandwich-Bauweise wählen', action: 'station.sandwich' });
    if (c.useCase === 'gas' && !c.building.gasTight)
      add('s-gas', 'error', 'station', 'Gasdichte Raumtrennung erforderlich', 'Gasstationen nach DVGW-Arbeitsblatt G 491 erfordern die gasdichte Trennung der Räume untereinander.', { label: 'Gasdichtigkeit aktivieren', action: 'station.gastight' });
    add('s-wi', 'info', 'station', 'Planungsstand', 'Raumaufteilung und Einbauten sind ein Planungsvorschlag. Die verbindliche Projektierung (Statik, Erwärmung, Störlichtbogennachweis) erfolgt durch die GRÄPER-Ingenieure.');
  }

  /* Gebäudehülle */
  if (has('huelle') && c.building.kind !== 'trafostand') {
    const surf = SURFACES.find((s) => s.id === c.envelope.surface)!;
    if (surf.walkInOnly && c.building.kind === 'kompakt')
      add('h-surf', 'error', 'huelle', 'Oberfläche nur für begehbare Stationen', `${surf.label} wird bei Kompaktstationen nicht angeboten (möglich: Reibeputz, Rollputz, Waschbeton, Holz, Riemchen).`, { label: 'Reibeputz wählen', action: 'huelle.putz' });
    if (surf.usesRal && !SERIE_RAL.includes(c.envelope.bodyRal))
      add('h-ral', 'info', 'huelle', 'Sonderfarbton', `RAL ${c.envelope.bodyRal} gehört nicht zu den GRÄPER-Serienfarben – Ausführung im gesamten RAL-Spektrum ist möglich, ggf. gegen Mehrpreis.`);
    if (uc.electrical) {
      const cableFields = mv.fields.filter((f) => f.type === 'K' || f.type === 'UE').length;
      if (cableFields > c.penetrations.mvCount)
        add('h-mv', 'warn', 'huelle', 'Zu wenige MS-Kabeleinführungen', `${cableFields} Kabel-/Übergabefelder, aber nur ${c.penetrations.mvCount} MS-Durchführung(en). Je Feld wird ein Systemdeckel für drei Einleiterkabel benötigt.`, { label: `Auf ${cableFields} erhöhen`, action: 'huelle.mvcount' });
      const feeders = feederCount(c);
      const cover = CABLE_ENTRIES[c.penetrations.lvSystem].covers.find((x) => x.id === c.penetrations.lvCover);
      const per = cover?.id.startsWith('D7') ? 2 : cover?.id.startsWith('D6') ? 2 : cover?.id.startsWith('D3') ? 1.5 : 1;
      const needLv = Math.ceil(feeders / per);
      if (t.count > 0 && needLv > c.penetrations.lvCount)
        add('h-lv', 'warn', 'huelle', 'Zu wenige NS-Kabeleinführungen', `Für ${feeders} Abgänge werden etwa ${needLv} NS-Durchführungen benötigt, vorgesehen sind ${c.penetrations.lvCount}.`, { label: `Auf ${needLv} erhöhen`, action: 'huelle.lvcount' });
    }
    if ((c.equipment.comm === 'lte' || c.equipment.comm === 'lte450') && (c.equipment.telecontrol === 'ueberwacht' || c.equipment.telecontrol === 'steuerbar') && !c.penetrations.antenna)
      add('h-ant', 'warn', 'huelle', 'Antennendurchführung fehlt', 'Für die Funkanbindung der Fernwirktechnik wird eine Antennendurchführung benötigt.', { label: 'Antennendurchführung ergänzen', action: 'huelle.antenna' });
    if (c.building.security !== 'standard' && c.building.doorMaterial === 'alu')
      add('h-rc', 'info', 'huelle', 'Einbruchhemmende Türen', 'Geprüfte einbruchhemmende Türsysteme (RC2/RC3 nach DIN EN 1627) werden als doppelwandige Stahltüren ausgeführt.');
  }

  /* Ausstattung */
  if (has('ausstattung')) {
    if (c.equipment.telecontrol === 'steuerbar' && !c.equipment.ups)
      add('a-ups', 'warn', 'ausstattung', 'Gesicherte Hilfsspannung fehlt', 'Fernsteuerbare Stationen benötigen eine batteriegestützte Hilfsspannungsversorgung (z. B. 24 V DC), damit Schalthandlungen und Meldungen auch bei Netzausfall möglich sind.', { label: 'USV ergänzen', action: 'equip.ups' });
    if (c.equipment.enimon === 'smart' && c.lv.instrument === 'ohne' && t.count > 0)
      add('a-eni', 'info', 'ausstattung', 'EniMonTS Smart', 'Das Smart-Paket umfasst die Leistungsmessung der Niederspannung – die Messwandler werden in der NSHV vorgesehen.');
    if (c.useCase === 'ortsnetz' && c.equipment.telecontrol === 'ohne')
      add('a-digi', 'info', 'ausstattung', 'Digitalisierung vorbereiten', 'Netzbetreiber rüsten Ortsnetzstationen zunehmend mit Mess- und Fernwirktechnik aus (u. a. für § 14a EnWG). Ein Fernwirkraum bzw. die Vorbereitung erleichtert die spätere Nachrüstung.');
  }

  /* Standort */
  if (has('standort')) {
    const log = calcLogistics(c, g, w);
    if (c.site.unloading === 'bordkran' && log.craneNeeded)
      add('l-kran', 'error', 'standort', 'Autokran erforderlich', `Das Transportgewicht${w.totalT ? ` von ca. ${nf(w.totalT, 1)} t` : ''} übersteigt das Abladegewicht der GRÄPER-Lkw mit Ladekran (8–14 t).`, { label: 'Autokran einplanen', action: 'site.autokran' });
    if (log.oversize)
      add('l-breite', 'info', 'standort', 'Überbreite', `Transportbreite ca. ${nf(log.transportWidth / 100, 2)} m: genehmigungspflichtiger Großraumtransport${log.escort ? ' mit Begleitfahrzeug' : ''}. GRÄPER übernimmt Genehmigungen und Disposition.`);
    if (c.site.boundaryBuild && g.kind === 'kompakt' && g.closedSides.length === 0)
      add('l-grenze', 'warn', 'standort', 'Grenzbebauung', 'Der gewählte Typ besitzt keine geschlossene Seite. Für die Aufstellung an der Grundstücksgrenze eignen sich Typen mit geschlossener Rückwand.', ranking.some((r) => r.level !== 'no' && r.station.closedSides.length > 0) ? { label: 'Geeigneten Typ wählen', action: 'station.boundary' } : undefined);
    if (c.site.residential && t.count > 0) {
      add('l-schall', e.spl10m > 35 ? 'warn' : 'info', 'standort', 'Schallschutz', `Schallleistungspegel der Transformatoren ca. ${nf(e.lwa)} dB(A); in 10 m Abstand rechnerisch ca. ${nf(e.spl10m)} dB(A) (Freifeld, Richtwert). Nachtwerte nach TA Lärm: 35 dB(A) in reinen, 40 dB(A) in allgemeinen Wohngebieten. GRÄPER montiert Transformatoren auf Schwingungsdämpfern.`);
      add('l-emv', 'info', 'standort', 'Elektromagnetische Felder', 'Der Grenzwert der 26. BImSchV (100 µT bei 50 Hz) ist an Orten zum dauerhaften Aufenthalt einzuhalten. Die Niederspannungsseite sollte von Wohngebäuden abgewandt angeordnet werden.');
    }
    if (c.site.floodRisk)
      add('l-hw', 'warn', 'standort', 'Überflutungsgefährdeter Standort', 'Aufstellhöhe über dem Bemessungshochwasser wählen (ggf. erhöhte Gründung) und druckwasserdichte Kabeleinführungen vorsehen. Bitte im Bemerkungsfeld angeben.');
    if (c.building.slopeInstall)
      add('l-hang', 'info', 'standort', 'Hangeinbau', 'Bei Hangeinbau werden erdberührte Wandflächen abgedichtet und statisch für Erddruck nachgewiesen; Lüftungs- und Türöffnungen müssen frei bleiben.');
  }

  return out.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}

/* ---------- Automatische Korrekturen ---------- */

const suitableVendor = (c: Config) => {
  const um = umForKv(c.transformer.primaryKv);
  const walk = c.building.kind !== 'kompakt';
  return MV_VENDORS.find((v) => v.um.includes(um) && (um > 24 || v.insulation === 'sf6frei') && (walk || v.compact || um > 24)) ?? MV_VENDORS[0];
};

export function applyFix(c: Config, action: string): Config {
  /* Die Kopie löst unterstützte Datenstrukturen von den Referenzen des ursprünglichen Objekts. */ const n: Config = structuredClone(c);
  const d = calcDemand(c);
  switch (action) {
    case 'trafo.uk6': n.transformer.ukPercent = 6; break;
    case 'trafo.demand': if (d) { n.transformer.powerKva = d.recommendedKva; n.transformer.count = d.count; } break;
    case 'ms.default': n.mv.fields = mvFields('K', 'K', n.transformer.count > 0 ? 'T' : 'K'); n.mv.protection = n.transformer.count > 0 ? 'hh' : 'ohne'; break;
    case 'ms.sf6frei': { n.mv.insulation = 'sf6frei'; const v = suitableVendor(n); n.mv.vendorId = v.insulation === 'sf6frei' ? v.id : 'neutral'; break; }
    case 'ms.vendorAuto': { const v = suitableVendor(n); n.mv.vendorId = v.id; n.mv.insulation = v.insulation; break; }
    case 'ms.addFeeder': {
      const need = Math.max(1, n.transformer.count) - n.mv.fields.filter((f) => f.type === 'T' || f.type === 'LS').length;
      const type = n.mv.protection === 'hh' ? 'T' : 'LS';
      for (let i = 0; i < Math.max(1, need); i++) n.mv.fields.push({ id: uid('f'), type });
      break;
    }
    case 'ms.ls': {
      let replaced = false;
      n.mv.fields = n.mv.fields.map((f): MvField => (f.type === 'T' ? ((replaced = true), { ...f, type: 'LS' }) : f));
      if (!replaced && !n.mv.fields.some((f) => f.type === 'LS' || f.type === 'UE')) n.mv.fields.push({ id: uid('f'), type: 'LS' });
      if (n.mv.protection === 'hh' || n.mv.protection === 'ohne') n.mv.protection = 'umz';
      break;
    }
    case 'ms.qu': {
      n.mv.protection = 'umz_qu';
      if (!n.mv.fields.some((f) => f.type === 'LS' || f.type === 'UE')) n.mv.fields = n.mv.fields.map((f): MvField => (f.type === 'T' ? { ...f, type: 'LS' } : f));
      if (!n.mv.fields.some((f) => f.type === 'LS' || f.type === 'UE')) n.mv.fields.push({ id: uid('f'), type: 'LS' });
      break;
    }
    case 'ms.motor': n.mv.motorDrives = true; break;
    case 'ns.billing': n.lv.billingMeters = 1; break;
    case 'ns.gekapselt': n.lv.design = 'gekapselt'; n.lv.incomer = 'leistungsschalter'; break;
    case 'ns.incomerLs': n.lv.incomer = 'leistungsschalter'; break;
    case 'station.best': { const r = rankCompact(n)[0]; if (r) { n.building.kind = 'kompakt'; n.building.compactId = r.station.id; n.building.autoSelect = true; } break; }
    case 'station.boundary': { const r = rankCompact(n).find((x) => x.level !== 'no' && x.station.closedSides.length > 0); if (r) { n.building.compactId = r.station.id; n.building.autoSelect = false; } break; }
    case 'station.walkin': case 'station.professional': case 'station.autosize': {
      const feeders = n.mv.fields.filter((f) => f.type === 'T' || f.type === 'LS').length;
      if (n.transformer.count > feeders && n.mv.fields.length) {
        const type = n.mv.protection === 'hh' ? 'T' : 'LS';
        for (let i = feeders; i < n.transformer.count; i++) n.mv.fields.push({ id: uid('f'), type });
      }
      const need = walkInNeed(n);
      n.building.kind = 'begehbar';
      const keep = n.building.walkIn.system === 'individual' && action === 'station.autosize';
      n.building.walkIn = { ...n.building.walkIn, system: keep ? 'individual' : 'professional', lengthCm: need.lengthCm, widthCm: Math.max(need.widthCm, keep ? n.building.walkIn.widthCm : 0), rooms: need.roomKinds, roomSplit: need.split, doorsAuto: true };
      if (n.building.walkIn.cellarCm === 0) n.building.walkIn.cellarCm = 78;
      break;
    }
    case 'station.sandwich': n.building.walkIn.wall = 'sandwich'; n.building.walkIn.roofInsulated = true; break;
    case 'station.gastight': n.building.gasTight = true; break;
    case 'huelle.autodoors': n.building.walkIn.doorsAuto = true; break;
    case 'huelle.putz': n.envelope.surface = 'reibeputz'; break;
    case 'huelle.mvcount': n.penetrations.mvCount = n.mv.fields.filter((f) => f.type === 'K' || f.type === 'UE').length; break;
    case 'huelle.lvcount': {
      const cover = n.penetrations.lvCover; const per = cover.startsWith('D7') || cover.startsWith('D6') ? 2 : cover.startsWith('D3') ? 1.5 : 1;
      n.penetrations.lvCount = Math.ceil(feederCount(n) / per); break;
    }
    case 'huelle.antenna': n.penetrations.antenna = true; break;
    case 'huelle.vent': n.building.walkIn.roofHood = true; n.equipment.accessories['lueftung_thermo'] = true; n.building.walkIn.doorsAuto = true; break;
    case 'equip.ups': n.equipment.ups = true; break;
    case 'site.autokran': n.site.unloading = 'autokran'; break;
  }
  return normalize(n);
}

/* ---------- Normalisierung (stille, nachvollziehbare Anpassungen) ---------- */

export function normalize(input: Config): Config {
  let c = input;
  const uc = useCase(c.useCase);
  const patchB = (p: Partial<Config['building']>) => { c = { ...c, building: { ...c.building, ...p } }; };
  if (!uc.electrical && (c.transformer.count !== 0 || c.mv.fields.length)) c = { ...c, transformer: { ...c.transformer, count: 0 }, mv: { ...c.mv, fields: [] } };
  if (c.useCase === 'trafostand' && c.building.kind !== 'trafostand') patchB({ kind: 'trafostand' });
  if (c.useCase !== 'trafostand' && c.building.kind === 'trafostand') patchB({ kind: uc.electrical ? 'kompakt' : 'begehbar' });
  if (!uc.electrical && c.building.kind === 'kompakt') patchB({ kind: 'begehbar' });
  if (c.building.kind === 'kompakt' && c.building.autoSelect) {
    const best = rankCompact(c)[0];
    if (best && best.level !== 'no' && best.station.id !== c.building.compactId) patchB({ compactId: best.station.id });
  }
  if (c.building.kind === 'begehbar') {
    const w = clampWalkIn(c);
    /* JSON kodiert den aktuellen Wert als Text; Referenzen zwischen Objekten bleiben dabei nicht erhalten. */ if (JSON.stringify(w) !== JSON.stringify(c.building.walkIn)) patchB({ walkIn: w });
  }
  // Begehbare Stationen und Trafostände werden grundsätzlich mit dem Autokran versetzt.
  if (c.building.kind !== 'kompakt' && c.site.unloading === 'bordkran') c = { ...c, site: { ...c.site, unloading: 'autokran' } };
  // Kompaktstationen über dem Abladegewicht der Lkw-Ladekrane (ca. 14 t) ebenfalls mit Autokran
  if (c.building.kind === 'kompakt' && c.site.unloading === 'bordkran') {
    const e = calcElectrical(c); const g = buildGeometry(c, e.inLv);
    if ((calcWeights(c, g, e).totalT ?? 0) > 14) c = { ...c, site: { ...c.site, unloading: 'autokran' } };
  }
  return c;
}

/* ---------- Gesamtableitung ---------- */

export interface Derived {
  elec: ElecCalc;
  demand: DemandResult | null;
  geometry: Geometry;
  weights: Weights;
  excavation: Excavation;
  logistics: Logistics;
  ranking: FitResult[];
  serieFits: SerieFit[];
  need: WalkInNeed;
  findings: Finding[];
  status: Severity;
  counts: Record<Severity, number>;
  nearestPlant: (typeof PLANTS)[number];
}

export function derive(c: Config): Derived {
  const elec = calcElectrical(c);
  const demand = calcDemand(c);
  const geometry = buildGeometry(c, elec.inLv);
  const weights = calcWeights(c, geometry, elec);
  const excavation = calcExcavation(c, geometry);
  const logistics = calcLogistics(c, geometry, weights);
  const ranking = rankCompact(c);
  const serieFits = rankSerie(c);
  const need = walkInNeed(c);
  const findings = check(c, elec, geometry, weights, ranking, serieFits, demand);
  const counts = { error: 0, warn: 0, info: 0, ok: 0 } as Record<Severity, number>;
  findings.forEach((f) => counts[f.severity]++);
  const status: Severity = counts.error ? 'error' : counts.warn ? 'warn' : 'ok';
  const nearestPlant = PLANTS.find((p) => p.id === c.site.plantId) ?? PLANTS[0];
  return { elec, demand, geometry, weights, excavation, logistics, ranking, serieFits, need, findings, status, counts, nearestPlant };
}

export { autoDoors, fwActive, lvSize, mvSize, PROFESSIONAL };
