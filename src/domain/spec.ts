import type { Config } from './types';
import type { Derived } from './engine';
import { useCase } from '../data/usecases';
import { MV_FIELD_TYPES, mvVendor, TRAFO_TYPES } from '../data/electrical';
import { ACCESSORIES, CABLE_ENTRIES, DOOR_MATERIALS, FLOOR_BUILDS, FLOOR_FINISHES, ROOF_FORMS, SECURITY_LEVELS, SERVICES, SURFACES, WALL_BUILDS, CLINKER_TONES } from '../data/options';
import { ralLabel } from '../data/ral';
import { feederCount, stripSlots } from './calc';
import { ROOM_LABEL, walkInDims } from './layout';
import { fwActive } from './layout';
import { compactById } from '../data/stations';

const nf = (n: number, d = 0) => n.toLocaleString('de-DE', { maximumFractionDigits: d, minimumFractionDigits: d });
const yes = (b: boolean) => (b ? 'ja' : 'nein');
export const accOn = (c: Config, id: string) => c.equipment.accessories[id] ?? !!ACCESSORIES.find((a) => a.id === id)?.def;
export const svcOn = (c: Config, id: string) => c.site.services[id] ?? !!SERVICES.find((a) => a.id === id)?.def;
export const fieldCode = (c: Config) => c.mv.fields.map((f) => (f.type === 'UE' ? 'Ü' : f.type)).join('');

const TELECONTROL: Record<Config['equipment']['telecontrol'], string> = { ohne: 'ohne', vorbereitet: 'vorbereitet (Platz, Hilfsspannung)', ueberwacht: 'überwacht (Messen und Melden)', steuerbar: 'fernsteuerbar (Messen, Melden, Schalten)' };
const COMM: Record<Config['equipment']['comm'], string> = { lte: 'LTE/5G (öffentlich)', lte450: '450-MHz-Funknetz', glasfaser: 'Glasfaser', dsl: 'DSL', kunde: 'nach Vorgabe Kunde' };
const PROT: Record<Config['mv']['protection'], string> = { ohne: 'ohne', hh: 'HH-Sicherung (Lasttrennschalter-Sicherungs-Kombination)', umz: 'Leistungsschalter mit UMZ-Schutz', umz_qu: 'Leistungsschalter mit UMZ-, Entkupplungs- und Q-U-Schutz' };
const INCOMER: Record<Config['lv']['incomer'], string> = { nh: 'NH-Sicherungslasttrennschalter', lasttrenner: 'Lasttrennschalter', leistungsschalter: 'offener Leistungsschalter (ACB)' };

export interface SummarySection { title: string; rows: [string, string][] }

export function summarySections(c: Config, d: Derived): SummarySection[] {
  const g = d.geometry, e = d.elec, t = c.transformer, uc = useCase(c.useCase);
  const out: SummarySection[] = [];
  out.push({ title: 'Projekt', rows: [
    ['Projekt', c.projectName || '–'], ['Projektnummer', c.projectNo || '–'], ['Anwendung', uc.label],
    ['Standort', [c.site.zip, c.site.city].filter(Boolean).join(' ') || '–'], ['Wunschtermin', c.site.deliveryWeek || '–'],
  ] });
  const st: [string, string][] = [['Stationstyp', `${g.title} – ${g.subtitle}`], ['Außenmaße (L × B × H)', `${nf(g.x)} × ${nf(g.z)} × ${nf(g.hTotal, 1)} cm`],
    ['Höhe über Gelände', `${nf(g.hVisible + (g.kind === 'kompakt' ? 0 : 0), 1)} cm`], ['Einbautiefe', `${nf(g.buried)} cm`]];
  if (g.station) st.push(['Bebaute Fläche / Aufstellfläche', `${nf(g.station.builtArea, 2)} m² / ${nf(g.station.installArea, 2)} m²`]);
  if (c.building.kind === 'begehbar') {
    const w = c.building.walkIn, dm = walkInDims(c);
    st.push(['System', w.system === 'serie' ? 'System Serie' : w.system === 'professional' ? 'System Professional' : 'System Individual']);
    st.push(['Räume', dm.rooms.map((r) => ROOM_LABEL[r]).join(' | ')]);
    st.push(['Lichte Raumhöhe / Kellerhöhe', `${dm.roomH} cm / ${dm.cellar ? dm.cellar + ' cm' : 'ohne Keller'}`]);
    st.push(['Wandaufbau', WALL_BUILDS.find((x) => x.id === w.wall)!.label]);
    st.push(['Zwischenboden', `${FLOOR_BUILDS.find((x) => x.id === w.floor)!.label}, ${FLOOR_FINISHES.find((x) => x.id === w.floorFinish)!.label}`]);
    st.push(['Dach', `${ROOF_FORMS.find((x) => x.id === (w.system === 'serie' ? 'flach' : w.roofForm))!.label}${w.roofForm !== 'flach' && w.roofForm !== 'tonne' && w.system !== 'serie' ? ` ${w.roofPitch}°` : ''}${w.roofInsulated ? ', gedämmt' : ''}`]);
  }
  if (c.building.kind !== 'trafostand') st.push(['Beton', c.building.concrete === 'leicht' ? 'GRÄPER-Leichtbeton' : 'Normalbeton']);
  if (g.stand) st.push(['Auffangvolumen / Wannenhöhe', `${g.stand.volumeM3} m³ / ${g.stand.tubHeight} cm`]);
  st.push(['Gewicht ohne E-Ausbau', d.weights.emptyT ? `ca. ${nf(d.weights.emptyT, 1)} t` : '–'], ['Transportgewicht', d.weights.totalT ? `ca. ${nf(d.weights.totalT, 1)} t` : '–']);
  out.push({ title: 'Station', rows: st });
  if (uc.electrical && t.count > 0) out.push({ title: 'Transformator', rows: [
    ['Anzahl × Leistung', `${t.count} × ${nf(t.powerKva)} kVA`], ['Bauart', TRAFO_TYPES.find((x) => x.id === t.type)!.label + (t.ront ? ', regelbar (rONT)' : '')],
    ['Übersetzung', `${t.primaryKv} kV / ${t.secondaryV} V, ${t.vectorGroup}, uk = ${t.ukPercent} %`],
    ['Verluste (Ökodesign Stufe 2)', `P0 = ${nf(e.trafo.p0)} W, Pk = ${nf(e.trafo.pk)} W`],
    ['Bemessungsstrom OS / US', `${nf(e.inHv, 1)} A / ${nf(e.inLv)} A`], ['Kurzschlussstrom US-Klemmen', `ca. ${nf(e.ikLvKa, 1)} kA`],
    ['Trafoschutz', t.protection === 'dgpt2' ? 'Hermetikvollschutz DGPT2' : 'Zeigerthermometer'], ['Lieferung', t.customerSupplied ? 'Beistellung durch Kunden' : 'durch GRÄPER'],
  ] });
  if (uc.electrical && c.mv.fields.length) {
    const v = mvVendor(c.mv.vendorId);
    out.push({ title: 'Mittelspannung', rows: [
      ['Schaltanlage', `${v.vendor} ${v.product}`], ['Isolierung', v.medium], ['Felder', `${fieldCode(c)} (${c.mv.fields.length} Felder)`],
      ['Feldtypen', MV_FIELD_TYPES.filter((ft) => c.mv.fields.some((f) => f.type === ft.id)).map((ft) => `${c.mv.fields.filter((f) => f.type === ft.id).length} × ${ft.label}`).join(', ')],
      ['Schutz', PROT[c.mv.protection]], ['Bemessungs-Kurzzeitstrom', `${c.mv.ikKa} kA / 1 s`],
      ['Antriebe', c.mv.motorDrives ? 'Motorantriebe' : 'Handantriebe'], ['Kurzschlussanzeiger', c.mv.faultIndicators === 'ohne' ? 'ohne' : c.mv.faultIndicators === 'ksa' ? 'ja' : 'mit Richtungserkennung und Fernmeldung'],
      ['Lieferung', c.mv.customerSupplied ? 'Beistellung durch Kunden' : 'durch GRÄPER'],
    ] });
  }
  if (uc.electrical && t.count > 0) {
    const lv = c.lv;
    out.push({ title: 'Niederspannung', rows: [
      ['Bauart', lv.design === 'offen' ? 'offen, berührungsgeschützt (Gerüstbauweise)' : 'stahlblechgekapselt (Schranksystem)'],
      ['Einspeisung', `${INCOMER[lv.incomer]}, ${nf(e.incomerA)} A`],
      ['Abgänge', [lv.nh00 && `${lv.nh00} × NH00`, lv.nh1 && `${lv.nh1} × NH1`, lv.nh2 && `${lv.nh2} × NH2`, lv.nh3 && `${lv.nh3} × NH3`, lv.acbFeeders && `${lv.acbFeeders} × Leistungsschalter`].filter(Boolean).join(', ') || '–'],
      ['Leistenplätze', `${stripSlots(c)} (davon ${lv.reserve} Reserve)`],
      ['Messung', [lv.instrument !== 'ohne' && (lv.instrument === 'multimeter' ? 'Multifunktionsmessgerät' : 'Schleppzeiger-Amperemeter'), lv.billingMeters && `${lv.billingMeters} × Verrechnungsmessung (Wandler)`, lv.feederMonitoring && 'Abgangsmessung'].filter(Boolean).join(', ') || 'ohne'],
      ['Zusätze', [lv.streetLighting && 'Straßenbeleuchtung', lv.tempPower && 'Baustromanschluss', lv.generatorInlet && 'Notstromeinspeisung', lv.surgeProtection && 'Überspannungsschutz', lv.compensationKvar && `Kompensation ${lv.compensationKvar} kvar`].filter(Boolean).join(', ') || '–'],
    ] });
  }
  if (c.building.kind !== 'trafostand') {
    const surf = SURFACES.find((s) => s.id === c.envelope.surface)!;
    out.push({ title: 'Gebäudehülle', rows: [
      ['Fassade', `${surf.label}${surf.usesRal ? `, ${ralLabel(c.envelope.bodyRal)}` : c.envelope.surface === 'klinker' ? `, ${CLINKER_TONES.find((x) => x.id === c.envelope.clinkerTone)!.label}` : ''}`],
      ['Dach / Sockel', `${ralLabel(c.envelope.roofRal)} / ${ralLabel(c.envelope.plinthRal)}`],
      ['Türen und Gitter', `${DOOR_MATERIALS.find((x) => x.id === c.building.doorMaterial)!.label}, ${c.envelope.doorFinish === 'eloxiert' ? 'Naturfarbe' : ralLabel(c.envelope.doorRal)}`],
      ['Sicherheit', SECURITY_LEVELS.find((x) => x.id === c.building.security)!.label + (c.building.panicLocks ? ', Panikschlösser' : '') + (c.building.doorMonitoring ? ', Verschlussüberwachung' : '')],
      ['Kabeleinführungen', `${c.penetrations.mvCount} × MS (${CABLE_ENTRIES[c.penetrations.mvSystem].label}), ${c.penetrations.lvCount} × NS (${CABLE_ENTRIES[c.penetrations.lvSystem].label})`],
      ['Weitere Durchführungen', [c.penetrations.tempPower && `${c.penetrations.tempPower} × Baustrom`, c.penetrations.earthing && `${c.penetrations.earthing} × Erdung`, c.penetrations.antenna && 'Antenne', c.penetrations.fiber && `${c.penetrations.fiber} × LWL`].filter(Boolean).join(', ') || '–'],
      ['Bauphysik', [c.building.fire !== 'ohne' && c.building.fire.toUpperCase(), c.building.soundProtection && 'Schallschutz', c.building.gasTight && 'gasdicht', c.building.slopeInstall && 'Hangeinbau', c.envelope.graffitiProtection && 'Graffitischutz'].filter(Boolean).join(', ') || 'Standard'],
    ] });
    out.push({ title: 'Ausstattung', rows: [
      ['Fernwirktechnik', TELECONTROL[c.equipment.telecontrol] + (c.equipment.telecontrol !== 'ohne' ? `, ${COMM[c.equipment.comm]}, ${c.equipment.protocol === 'iec104' ? 'IEC 60870-5-104' : c.equipment.protocol === 'iec61850' ? 'IEC 61850' : 'Modbus TCP'}` : '')],
      ['Gesicherte Hilfsspannung', yes(c.equipment.ups)], ['Stationsmonitoring', c.equipment.enimon === 'ohne' ? 'ohne' : `EniMonTS ${c.equipment.enimon === 'basis' ? 'Basis' : 'Smart'}`],
      ['Zubehör', ACCESSORIES.filter((a) => accOn(c, a.id) && (!a.onlyElectrical || uc.electrical)).map((a) => a.label).join(', ') || '–'],
    ] });
  }
  out.push({ title: 'Standort und Logistik', rows: [
    ['Entladung', c.site.unloading === 'bordkran' ? 'Lkw-Ladekran' : c.site.unloading === 'autokran' ? 'Autokran' : 'bauseits'],
    ['Gründung', c.site.foundation === 'sandplanum' ? 'verdichtetes Sandplanum' : c.site.foundation === 'streifen' ? 'Streifenfundamente' : 'Gründungsplatte'],
    ['Baugrube (OK Gelände)', `${nf(d.excavation.topX)} × ${nf(d.excavation.topZ)} cm, Tiefe ${nf(d.excavation.depth)} cm`],
    ['Aushub (ca.)', `${nf(d.excavation.volumeM3, 1)} m³`], ['Transportbreite', `${nf(d.logistics.transportWidth)} cm${d.logistics.oversize ? ' (Überbreite)' : ''}`],
    ['Leistungen', SERVICES.filter((s) => svcOn(c, s.id)).map((s) => s.label).join(', ') || '–'],
  ] });
  return out;
}

export interface BomRow { pos: string; text: string; detail: string; qty: string }
export function bom(c: Config, d: Derived): BomRow[] {
  const rows: BomRow[] = []; let n = 0;
  const add = (text: string, detail: string, qty = '1 St.') => rows.push({ pos: String(++n).padStart(2, '0'), text, detail, qty });
  const g = d.geometry, t = c.transformer, uc = useCase(c.useCase);
  add(g.kind === 'trafostand' ? 'Fertigteil-Transformatorenstand' : g.kind === 'kompakt' ? 'Kompaktstation (Baukörper)' : 'Begehbares Stationsgebäude', `${g.title}, ${nf(g.x)} × ${nf(g.z)} × ${nf(g.hTotal, 1)} cm`);
  if (uc.electrical && t.count > 0) add('Verteiltransformator', `${nf(t.powerKva)} kVA, ${t.primaryKv}/${t.secondaryV / 1000} kV, ${t.vectorGroup}, uk ${t.ukPercent} %, ${TRAFO_TYPES.find((x) => x.id === t.type)!.short}${t.customerSupplied ? ' – Beistellung' : ''}`, `${t.count} St.`);
  if (uc.electrical && c.mv.fields.length) add('MS-Schaltanlage', `${mvVendor(c.mv.vendorId).product}, ${fieldCode(c)}${c.mv.customerSupplied ? ' – Beistellung' : ''}`);
  if (uc.electrical && t.count > 0) add('NS-Hauptverteilung', `${nf(d.elec.incomerA)} A, ${feederCount(c)} Abgänge, ${stripSlots(c)} Leistenplätze`);
  if (uc.electrical && t.count > 0 && accOn(c, 'ms_kabel')) add('MS-Kabelverbindung', 'Schaltanlage – Transformator, TE-geprüft', `${t.count} Satz`);
  if (uc.electrical && t.count > 0 && accOn(c, 'ns_kabel')) add('NS-Verbindung', 'Transformator – NSHV', `${t.count} Satz`);
  if (c.lv.billingMeters > 0) add('Verrechnungsmessung', `Wandlermessung${c.lv.ctSupplied ? ', Wandler beigestellt' : ''}`, `${c.lv.billingMeters} St.`);
  if (c.equipment.telecontrol !== 'ohne') add('Fernwirktechnik', `${TELECONTROL[c.equipment.telecontrol]}${c.equipment.telecontrolSupplied ? ' – Beistellung, Einbau durch GRÄPER' : ''}`);
  if (c.equipment.ups) add('Gesicherte Hilfsspannung', 'USV / Batterie 24 V DC');
  if (c.equipment.enimon !== 'ohne') add('Stationsmonitoring EniMonTS', c.equipment.enimon === 'basis' ? 'Basis-Paket' : 'Smart-Paket');
  if (c.equipment.steuerbox14a) add('Steuereinrichtung § 14a EnWG', 'Vorbereitung');
  if (c.building.kind !== 'trafostand') {
    add('Kabeleinführungen MS', CABLE_ENTRIES[c.penetrations.mvSystem].label + ' / ' + c.penetrations.mvCover, `${c.penetrations.mvCount} St.`);
    if (c.penetrations.lvCount) add('Kabeleinführungen NS', CABLE_ENTRIES[c.penetrations.lvSystem].label + ' / ' + c.penetrations.lvCover, `${c.penetrations.lvCount} St.`);
    ACCESSORIES.filter((a) => accOn(c, a.id) && (!a.onlyElectrical || (uc.electrical && t.count > 0))).forEach((a) => add(a.label, a.group));
  }
  SERVICES.filter((s) => svcOn(c, s.id)).forEach((s) => add(s.label, 'Leistung', 'pauschal'));
  return rows;
}

/** Leistungsbeschreibung im Stil eines Ausschreibungstextes. */
export function specText(c: Config, d: Derived): string {
  const g = d.geometry, uc = useCase(c.useCase);
  const L: string[] = [];
  const h = (s: string) => { L.push('', s.toUpperCase(), '-'.repeat(Math.min(72, s.length))); };
  L.push(`LEISTUNGSBESCHREIBUNG – ${uc.label.toUpperCase()}`, `Projekt: ${c.projectName || '–'}${c.projectNo ? ` (${c.projectNo})` : ''}`, `Erstellt mit dem GRÄPER-Stationskonfigurator am ${new Date().toLocaleDateString('de-DE')}`);
  h('1 Allgemeines');
  if (g.kind === 'trafostand') {
    L.push(`Lieferung und Aufstellung eines dreiteiligen Fertigteil-Transformatorenstands ${g.title} aus flüssigkeitsdichtem Beton C 35/45 (FD-Beton), monolithisch und fugenlos gefertigt, bestehend aus Trafoträgerelement und zwei seitlichen öldichten Auffangwannen mit Gitterrostabdeckung. Auffangvolumen ${g.stand!.volumeM3} m³.`);
  } else {
    L.push(`Lieferung einer ${g.kind === 'kompakt' ? 'fabrikfertigen, nicht begehbaren Kompaktstation' : 'begehbaren Fertigteilstation'} Typ ${g.title} aus GRÄPER-${c.building.concrete === 'leicht' ? 'Leichtbeton' : 'Normalbeton'}, gefertigt und typgeprüft nach DIN EN 62271-202 (VDE 0671-202), Störlichtbogenqualifikation IAC-AB 20 kA/1 s bzw. Nachweis durch Ableitung, Schutzgrad IP23D.`);
    L.push(`Außenmaße (L × B × H): ${nf(g.x)} × ${nf(g.z)} × ${nf(g.hTotal, 1)} cm, Einbautiefe ${nf(g.buried)} cm. Monolithisch gefertigte, öl- und wasserdichte Fundamentwanne (WU-/FDE-Beton) als Auffangraum für die Isolierflüssigkeit des Transformators.`);
    if (g.station) L.push(`Maximale Transformatorleistung ${nf(g.station.maxKva)} kVA, max. ${g.station.mv.maxFields} MS-Felder${g.station.lv ? `, max. ${g.station.lv.maxStrips} NS-Leisten` : ''}${g.station.fw && fwActive(c, compactById(g.station.id)) ? ', separater Fernwirkraum' : ''}.`);
  }
  if (uc.electrical && c.transformer.count > 0) {
    const t = c.transformer, e = d.elec;
    h('2 Transformator');
    L.push(`${t.count} × Verteiltransformator ${nf(t.powerKva)} kVA, ${TRAFO_TYPES.find((x) => x.id === t.type)!.label}, ${t.type === 'giessharz' ? 'Innenraumausführung' : 'hermetisch geschlossen'}, Übersetzung ${t.primaryKv} kV ± 2 × 2,5 % / ${t.secondaryV} V, Schaltgruppe ${t.vectorGroup}, uk = ${t.ukPercent} %, Verluste nach Verordnung (EU) 548/2014 i. d. F. 2019/1783 Stufe 2 (P0 ≤ ${nf(e.trafo.p0)} W, Pk ≤ ${nf(e.trafo.pk)} W)${t.ront ? ', mit Laststufenschalter (regelbarer Ortsnetztransformator)' : ''}.`);
    L.push(`Trafoschutz: ${t.protection === 'dgpt2' ? 'Hermetikvollschutz (DGPT2) mit Verdrahtung auf Auslösung und Meldung' : 'Zeigerthermometer mit zwei Kontakten'}. Aufstellung auf Schwingungsdämpfern${t.customerSupplied ? '. Transformator wird bauseits beigestellt, Einbau durch GRÄPER.' : '.'}`);
  }
  if (uc.electrical && c.mv.fields.length) {
    const v = mvVendor(c.mv.vendorId);
    h('3 Mittelspannungs-Schaltanlage');
    L.push(`Fabrikfertige, typgeprüfte Mittelspannungs-Schaltanlage nach DIN EN 62271-200, ${v.medium}, Fabrikat ${v.vendor} ${v.product} oder gleichwertig, Bemessungsspannung ${c.transformer.primaryKv === 30 ? 36 : c.transformer.primaryKv === 20 ? 24 : 12} kV, Bemessungs-Kurzzeitstrom ${c.mv.ikKa} kA/1 s, IAC A FL ${c.mv.ikKa} kA/1 s.`);
    L.push(`Feldanordnung: ${fieldCode(c)}.`);
    c.mv.fields.forEach((f, i) => L.push(`  Feld ${i + 1}: ${MV_FIELD_TYPES.find((x) => x.id === f.type)!.label}`));
    L.push(`Schutzkonzept: ${PROT[c.mv.protection]}. ${c.mv.motorDrives ? 'Schaltgeräte mit Motorantrieben für Fernsteuerung.' : 'Handantriebe.'}${c.mv.faultIndicators !== 'ohne' ? ` Kurzschlussanzeiger${c.mv.faultIndicators === 'ksa_richtung' ? ' mit Richtungserkennung und Fernmeldekontakt' : ''} in den Kabelfeldern.` : ''}`);
    L.push('Teilentladungsgeprüfte MS-Kabelverbindung zwischen Schaltanlage und Transformator (DIN EN 60270).');
  }
  if (uc.electrical && c.transformer.count > 0) {
    const lv = c.lv;
    h('4 Niederspannungs-Hauptverteilung');
    L.push(`Niederspannungs-Schaltgerätekombination nach DIN EN IEC 61439-1/-2 mit Bauartnachweis, ${lv.design === 'offen' ? 'offene, berührungsgeschützte Gerüstbauweise mit 185-mm-Sammelschienensystem' : 'stahlblechgekapselte Schrankbauweise'}, Bemessungsstrom ${nf(d.elec.incomerA)} A, Kurzschlussfestigkeit ≥ ${nf(Math.ceil(d.elec.ikLvKa / 5) * 5)} kA.`);
    L.push(`Einspeisung: ${INCOMER[lv.incomer]}. Abgänge: ${[lv.nh00 && `${lv.nh00} × NH00 (160 A)`, lv.nh1 && `${lv.nh1} × NH1 (250 A)`, lv.nh2 && `${lv.nh2} × NH2 (400 A)`, lv.nh3 && `${lv.nh3} × NH3 (630 A)`, lv.acbFeeders && `${lv.acbFeeders} × Leistungsschalter`].filter(Boolean).join(', ') || 'keine'}; ${lv.reserve} Reserveplätze.`);
    if (lv.billingMeters) L.push(`${lv.billingMeters} × halbindirekte Verrechnungsmessung (Wandlermessung) nach TAB des Netzbetreibers${lv.ctSupplied ? ', Stromwandler beigestellt' : ''}.`);
    L.push('Stückprüfung, Dokumentation (Aufbau-, Übersichts-, Stromlauf- und Klemmenplan).');
  }
  if (g.kind !== 'trafostand') {
    h('5 Gebäudehülle und Ausbau');
    const surf = SURFACES.find((s) => s.id === c.envelope.surface)!;
    L.push(`Außenoberfläche: ${surf.label}${surf.usesRal ? ` im Farbton ${ralLabel(c.envelope.bodyRal)}` : ''}; Dach ${ralLabel(c.envelope.roofRal)}; Sockel ${ralLabel(c.envelope.plinthRal)}.`);
    L.push(`Türen und Lüftungsgitter aus ${DOOR_MATERIALS.find((x) => x.id === c.building.doorMaterial)!.label}, störlichtbogengeprüft, Stocherschutz IP23D, ${SECURITY_LEVELS.find((x) => x.id === c.building.security)!.label}${c.building.panicLocks ? ', Panikfunktion nach DIN EN 179' : ''}.`);
    L.push(`Kabeleinführungen: ${c.penetrations.mvCount} × MS und ${c.penetrations.lvCount} × NS, gas- und druckwasserdicht (System Hauff), ${c.penetrations.tempPower} × Baustromdurchführung, ${c.penetrations.earthing} × Erdungsdurchführung${c.penetrations.antenna ? ', Antennendurchführung' : ''}.`);
    const acc = ACCESSORIES.filter((a) => accOn(c, a.id) && (!a.onlyElectrical || (uc.electrical && c.transformer.count > 0)));
    if (acc.length) L.push(`Zubehör: ${acc.map((a) => a.label).join('; ')}.`);
  }
  h('6 Transport, Aufstellung und Leistungen');
  L.push(`Transport frei Baustelle, Entladung ${c.site.unloading === 'bordkran' ? 'mit Lkw-Ladekran' : c.site.unloading === 'autokran' ? 'mit Autokran' : 'bauseits'}, Aufstellung auf bauseits hergestelltem Feinplanum nach GRÄPER-Aushubskizze (Baugrube ca. ${nf(d.excavation.topX)} × ${nf(d.excavation.topZ)} cm, Tiefe ${nf(d.excavation.depth)} cm, zul. Bodenpressung 200 kN/m²).`);
  const svc = SERVICES.filter((s) => svcOn(c, s.id));
  if (svc.length) L.push(`Weitere Leistungen: ${svc.map((s) => s.label).join('; ')}.`);
  L.push('', 'Hinweis: Planungsstand aus dem Online-Konfigurator. Verbindliche Ausführung nach technischer Klärung und Angebot der GRÄPER Ahlhorn GmbH & Co. KG; maßgebend sind die TAB des zuständigen Netzbetreibers.');
  return L.join('\n');
}

export function bomCsv(c: Config, d: Derived): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return ['Pos;Bezeichnung;Ausführung;Menge', ...bom(c, d).map((r) => [r.pos, r.text, r.detail, r.qty].map(esc).join(';'))].join('\r\n');
}
