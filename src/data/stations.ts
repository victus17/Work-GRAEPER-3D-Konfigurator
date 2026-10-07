import type { CompactStation, DoorDef, RoomDef, SerieStation, Trafostand } from '../domain/types';

/**
 * GRÄPER-Kompaktstationen.
 * Quellen: Produktseiten www.graeper.de/kompaktstation/…, Broschüre „Produktportfolio Kompaktstationen" (Stand 08/2026),
 * Kundenzeichnungen (Grundriss/Ansichten) der jeweiligen Typen. Bei Abweichungen zwischen Website und Broschüre
 * wurde der vorsichtigere Wert übernommen. Alle Maße in cm.
 *
 * Koordinaten: Ursprung = Stationsmitte, x entlang Seite A/C, z entlang Seite B/D.
 * Seite A = +z (Front), B = +x (rechts), C = −z (Rückseite), D = −x (links).
 */

const G = 'https://www.graeper.de';
const doc = (label: string, path: string) => ({ label, url: G + path });
const d = (side: DoorDef['side'], c: number, w: number, h: number, y0: number, leaves: 1 | 2, style: DoorDef['style'], room: DoorDef['room'], optional?: 'fw'): DoorDef =>
  ({ side, c, w, h, y0, leaves, style, room, optional });
const r = (kind: RoomDef['kind'], x0: number, z0: number, x1: number, z1: number, access: RoomDef['access']): RoomDef =>
  ({ kind, x0, z0, x1, z1, access });

export const COMPACT_STATIONS: CompactStation[] = [
  {
    id: 'mkp', name: 'MKP', family: 'MKP', title: 'Mastfuß-Kompaktstation',
    claim: 'Die vielseitige Stationsproduktreihe für unterschiedlichste Leistungsanforderungen.',
    status: 'aktiv', x: 190, z: 216, h: 259.5, buried: 75, roofOverhang: 10, roof: 'zelt', ventRing: 0,
    maxKva: 630, optKva: 800, trafoMax: { l: 150, b: 100, h: 170 },
    mv: { maxFields: 3, box: { w: 105, h: 140, d: 80 }, metering: false },
    lv: { maxStrips: 5, stripNote: 'Gr. 1/2/3', box: { w: 55, h: 140, d: 40 }, billing: false },
    fw: null, meterRoom: null, tempPower: 2,
    weightEmptyT: 5.1, weightEquippedT: 8.5, concreteOptions: ['leicht', 'normal'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 20', anchorsStation: '4 × RD 42', builtArea: 4.10, installArea: 10.83,
    closedSides: ['C'],
    doors: [
      d('A', 0, 166, 140.7, 27, 2, 'split', 'ms'),
      d('B', -45, 87.5, 137.7, 28, 1, 'louver', 'trafo'),
      d('D', -45, 87.5, 137.7, 28, 1, 'louver', 'trafo'),
    ],
    rooms: [
      r('trafo', -86, -99, 86, 1, 'B'),
      r('ms', -86, 12, 19, 99, 'A'),
      r('ns', 26, 55, 86, 99, 'A'),
    ],
    mvEntries: { side: 'A', count: 3 },
    features: ['Kleinste Aufstellfläche im Programm (4,10 m² bebaut)', 'Trafozugang von zwei Seiten', 'Zeltdach'],
    docs: [doc('Kundenzeichnung', '/assets/images/MKP-630/MKP_Typ_G001_SB_Alu_24-B-0456.pdf'), doc('Hebeplan', '/assets/images/MKP-630/MKP_Hebeplan.pdf'), doc('Aushubskizze', '/assets/images/MKP-630/MKP_Aushubskizze.pdf')],
    page: G + '/kompaktstation/mkp',
  },
  {
    id: 'hkp-e', name: 'HKP-E', family: 'HKP', title: 'Intelligente Netz- und Übergabestation',
    claim: 'Die perfekte Station für das »Smart-Grid« der Zukunft.',
    status: 'aktiv', x: 350, z: 150, h: 257.5, buried: 75, roofOverhang: 9, roof: 'flach', ventRing: 0,
    maxKva: 630, trafoMax: { l: 125, b: 85, h: 160 },
    mv: { maxFields: 4, box: { w: 140, h: 140, d: 80 }, metering: false },
    lv: { maxStrips: 12, stripNote: 'Gr. 1/2/3', box: { w: 120, h: 140, d: 32 }, billing: false },
    fw: { box: { w: 130, h: 105, d: 35 }, optional: false }, meterRoom: null, tempPower: 2,
    weightEmptyT: 7.8, weightEquippedT: 11.4, concreteOptions: ['leicht', 'normal'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 20', anchorsStation: '4 × RD 42', builtArea: 5.25, installArea: 16.06,
    closedSides: ['C'],
    doors: [
      d('A', 25, 284, 144, 27, 2, 'split', 'ms'),
      d('B', -5, 87.5, 138, 30, 1, 'louver', 'trafo'),
      d('D', 0, 113, 138, 30, 1, 'solid', 'fw'),
    ],
    rooms: [
      r('fw', -165.5, -63, -128, 63, 'D'),
      r('ms', -116, -63, 23, 63, 'A'),
      r('trafo', 30, -63, 165.5, 15, 'B'),
      r('ns', 30, 22, 165.5, 63, 'A'),
    ],
    mvEntries: { side: 'A', count: 3 },
    features: ['Separater Fernwirkraum serienmäßig', 'Schmale Bauform (1,50 m) für Gehwege und Grünstreifen', 'Bedienung komplett von der Frontseite'],
    docs: [doc('Kundenzeichnung', '/assets/images/HKP-E/HKP-E_Typ_G001_SB_Alu_24-B-0460.pdf'), doc('Hebeplan', '/assets/images/HKP-E/HKP-E-Hebeplan-2025.pdf'), doc('Aushubskizze', '/assets/images/HKP-E/HKP-E-Aushubskizze_50cm_Arbeitsraum.pdf')],
    page: G + '/kompaktstation/hkp-e',
  },
  {
    id: 'hkp-e2', name: 'HKP-E2', family: 'HKP', title: 'Intelligente Netz- und Übergabestation',
    claim: 'Die perfekte Station für das »Smart-Grid« der Zukunft – bis 1.000 kVA.',
    status: 'aktiv', x: 350, z: 175, h: 285, buried: 75, roofOverhang: 9, roof: 'flach', ventRing: 0,
    maxKva: 1000, trafoMax: { l: 170, b: 100, h: 180 },
    mv: { maxFields: 3, box: { w: 125, h: 170, d: 80 }, metering: false },
    lv: { maxStrips: 18, stripNote: 'Gr. 1/2/3', box: { w: 180, h: 170, d: 35 }, billing: false },
    fw: { box: { w: 60, h: 100, d: 35 }, optional: true, reducesStripsTo: 10 }, meterRoom: null, tempPower: 2,
    weightEmptyT: 9.2, weightEquippedT: 14.0, concreteOptions: ['leicht'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 24', anchorsStation: '4 × RD 42', builtArea: 6.13, installArea: 14.12,
    closedSides: ['C', 'D'],
    doors: [
      d('A', -96.3, 131.3, 166.2, 32, 1, 'solid', 'ms'),
      d('A', 7.2, 63.6, 166.2, 32, 1, 'solid', 'fw', 'fw'),
      d('A', 103.5, 117.1, 166.2, 32, 1, 'louver', 'ns'),
      d('B', -18, 109, 166.2, 32, 1, 'louver', 'trafo'),
    ],
    rooms: [
      r('ms', -162, -75, -31, 75, 'A'),
      r('trafo', -23, -75, 164, 22, 'B'),
      r('fw', -25, 34, 39, 75, 'A'),
      r('ns', 45, 34, 162, 75, 'A'),
    ],
    mvEntries: { side: 'A', count: 3 },
    features: ['Zwei geschlossene Seiten – ideal für Grenzbebauung', 'Wahlweise mit Fernwirkraum (10 NS-Leisten) oder ohne (18 NS-Leisten)', 'Transformatoren bis 1.000 kVA auf 6,13 m²'],
    docs: [doc('Kundenzeichnung', '/assets/images/HKP-E2/HKP-E2_Kundenzeichnung.pdf'), doc('Hebeplan', '/assets/images/HKP-E2/HKP-E2_Hebeplan.pdf'), doc('Aushubskizze', '/assets/images/HKP-E2/HKP-E2_Aushubskizze.pdf')],
    page: G + '/kompaktstation/hkp-e2',
  },
  {
    id: 'hkp-e3', name: 'HKP-E3', family: 'HKP', title: 'Intelligente Netz- und Übergabestation',
    claim: 'Die nächste Ausbaustufe der HKP-Reihe mit vier Mittelspannungsfeldern.',
    status: 'angekuendigt', statusNote: 'Lieferbar ab Mitte Q1/2027 (lt. Produktportfolio 08/2026)',
    x: 370, z: 175, h: 285, buried: 75, roofOverhang: 9, roof: 'flach', ventRing: 0,
    maxKva: 1000, trafoMax: { l: 180, b: 105, h: 170 },
    mv: { maxFields: 4, box: { w: 145, h: 170, d: 80 }, metering: false },
    lv: { maxStrips: 18, stripNote: 'Gr. 1/2/3', box: { w: 180, h: 170, d: 35 }, billing: false },
    fw: { box: { w: 60, h: 170, d: 35 }, optional: true, reducesStripsTo: 10 }, meterRoom: null, tempPower: 2,
    weightEmptyT: 9.2, weightEquippedT: 13.7, concreteOptions: ['leicht'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 24', anchorsStation: '4 × RD 42', builtArea: 6.48, installArea: 14.04,
    closedSides: ['C', 'D'],
    doors: [
      d('A', -96.3, 151.3, 166.2, 32, 2, 'solid', 'ms'),
      d('A', 17.2, 63.6, 166.2, 32, 1, 'solid', 'fw', 'fw'),
      d('A', 113.5, 117.1, 166.2, 32, 1, 'louver', 'ns'),
      d('B', -18, 109, 166.2, 32, 1, 'louver', 'trafo'),
    ],
    rooms: [
      r('ms', -172, -75, -21, 75, 'A'),
      r('trafo', -13, -75, 174, 22, 'B'),
      r('fw', -15, 34, 49, 75, 'A'),
      r('ns', 55, 34, 172, 75, 'A'),
    ],
    mvEntries: { side: 'A', count: 4 },
    features: ['Vier MS-Felder bei gleicher Tiefe wie HKP-E2', 'Wahlweise mit oder ohne Fernwirkraum', 'Vorankündigung – Daten vorläufig'],
    docs: [],
    page: G + '/leistungen/versorgungsstationen/kompaktstationen',
  },
  {
    id: 'hkp-e-ue', name: 'HKP-E-Ü', family: 'HKP', title: 'Intelligente Übergabestation',
    claim: 'Die perfekte Übergabestation mit viel Platz für Schutz- und Fernwirktechnik.',
    status: 'aktiv', x: 350, z: 150, h: 257.5, buried: 75, roofOverhang: 9, roof: 'flach', ventRing: 0,
    maxKva: 0, trafoMax: null,
    mv: { maxFields: 7, box: { w: 270, h: 140, d: 80 }, metering: true },
    lv: null,
    fw: { box: { w: 130, h: 105, d: 35 }, optional: false },
    meterRoom: { box: { w: 140, h: 140, d: 35 }, optional: false }, tempPower: 0,
    weightEmptyT: 8.0, weightEquippedT: 9.4, concreteOptions: ['leicht', 'normal'], doorMaterialStd: 'stahl',
    anchorsRoof: '4 × RD 20', anchorsStation: '4 × RD 42', builtArea: 5.25, installArea: 23.66,
    closedSides: ['B'],
    doors: [
      d('A', 23.4, 280.8, 142.1, 27, 2, 'solid', 'ms'),
      d('C', 97, 137.1, 141.9, 27, 1, 'louver', 'zaehler'),
      d('D', 0, 110.2, 137.7, 30, 1, 'solid', 'fw'),
    ],
    rooms: [
      r('fw', -165.5, -63, -128, 63, 'D'),
      r('ms', -116, -19, 165, 63, 'A'),
      r('zaehler', 30, -63, 165.5, -27, 'C'),
    ],
    mvEntries: { side: 'A', count: 9 },
    features: ['Reine Schalt-/Übergabestation ohne Transformator', 'Bis 7 MS-Felder inkl. Verrechnungsmessung', 'Separater Fernwirk- und Zählerraum'],
    docs: [doc('Kundenzeichnung', '/assets/images/HKP-E-Ue/HKP-E-Ue_Typ_G001_SB_Stahl_24-B-0457.pdf'), doc('Hebeplan', '/assets/images/HKP-E-Ue/HKP-E-Ue-Hebeplan-2025.pdf'), doc('Aushubskizze', '/assets/images/HKP-E-Ue/HKP-E-Ue-Aushubskizze_50cm_Arbeitsraum.pdf')],
    page: G + '/kompaktstation/hkp-e-ü',
  },
  {
    id: 'gkp-s3', name: 'GKP-S3', family: 'GKP', title: 'Leichtbeton-Kompaktstation',
    claim: 'Die universell einsetzbare Netzstation, geprüft mit SF6-freier Schaltanlagentechnik.',
    status: 'aktiv', x: 285, z: 175, h: 250, buried: 75, roofOverhang: 9, roof: 'flach', ventRing: 0,
    maxKva: 630, optKva: 800, trafoMax: { l: 160, b: 105, h: 160 },
    mv: { maxFields: 4, box: { w: 140, h: 140, d: 80 }, metering: false },
    lv: { maxStrips: 16, stripNote: 'Gr. 1/2/3', box: { w: 160, h: 140, d: 30 }, billing: false },
    fw: null, meterRoom: null, tempPower: 2,
    weightEmptyT: 6.9, weightEquippedT: 10.5, concreteOptions: ['leicht', 'normal'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 20', anchorsStation: '4 × RD 42', builtArea: 4.99, installArea: 11.66,
    closedSides: ['A'],
    doors: [
      d('B', 19, 83.5, 137.8, 25, 1, 'louver', 'trafo'),
      d('C', 37.5, 169.7, 136.8, 25, 2, 'louver', 'ns'),
      d('D', 0, 153, 139.8, 25, 2, 'solid', 'ms'),
    ],
    rooms: [
      r('ms', -135, -77, -55, 77, 'D'),
      r('trafo', -48, -40, 128, 75, 'B'),
      r('ns', -47, -75, 123, -47, 'C'),
    ],
    mvEntries: { side: 'D', count: 3 },
    features: ['2022 erste störlichtbogengeprüfte Kompaktstation mit F-Gas-freier Schaltanlage', 'Verbesserte Gehäuseklasse', 'Eine geschlossene Längsseite'],
    docs: [doc('Kundenzeichnung 630 kVA', '/assets/images/GKP-S3/Kundenzeichnung_GKP-S3_630kVA.pdf'), doc('Kundenzeichnung 800 kVA', '/assets/images/GKP-S3/GKP-S3_Typ_G002_SB_ALU_24-B-0631.pdf'), doc('Produktflyer', '/assets/downloads/GKP-S3/20250707_Flyer-GKP-S3.pdf'), doc('Hebeplan', '/assets/images/GKP-S3/GKP-S3-Hebeplan-2025.pdf'), doc('Aushubskizze', '/assets/images/GKP-S3/GKP-S3-Aushubskizze_50cm_Arbeitsraum.pdf')],
    page: G + '/kompaktstation/gkp-s3',
  },
  {
    id: 'gkp-s4', name: 'GKP-S4', family: 'GKP', title: 'Leichtbeton-Kompaktstation',
    claim: 'Netzstation bis 1.000 kVA mit separatem Fernwirkraum.',
    status: 'aktiv', x: 310, z: 220, h: 284, buried: 75, roofOverhang: 9, roof: 'sattel', ventRing: 0,
    maxKva: 1000, trafoMax: { l: 170, b: 110, h: 180 },
    mv: { maxFields: 4, box: { w: 160, h: 170, d: 85 }, metering: false },
    lv: { maxStrips: 15, stripNote: 'Gr. 1/2/3', box: { w: 150, h: 170, d: 40 }, billing: false },
    fw: { box: { w: 60, h: 150, d: 32 }, optional: false }, meterRoom: null, tempPower: 2,
    weightEmptyT: 9.8, weightEquippedT: 14.4, concreteOptions: ['leicht', 'normal'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 20', anchorsStation: '4 × RD 42', builtArea: 6.82, installArea: 16.42,
    closedSides: ['C'],
    doors: [
      d('A', -34, 152, 158.8, 36, 2, 'louver', 'ns'),
      d('B', 0, 194.8, 158.8, 36, 2, 'solid', 'ms'),
      d('D', -37.5, 119.3, 173.9, 21, 1, 'louver', 'trafo'),
      d('D', 62, 70, 173.9, 21, 1, 'solid', 'fw'),
    ],
    rooms: [
      r('trafo', -142, -97, 43, 42, 'D'),
      r('ms', 52, -98, 140, 98, 'B'),
      r('ns', -110, 52, 43, 97, 'A'),
      r('fw', -142, 30, -110, 97, 'D'),
    ],
    mvEntries: { side: 'B', count: 4 },
    features: ['Separater Fernwirkraum (60 × 150 × 32 cm)', 'Geschlossene Rückseite für Grenzbebauung', 'Schaltanlagenhöhe bis 170 cm'],
    docs: [doc('Kundenzeichnung', '/assets/downloads/GKP-S4/GKP-S4_Typ_G001.pdf'), doc('Hebeplan', '/assets/images/GKP-S4/GKP-S4-Hebeplan-2025.pdf'), doc('Aushubskizze', '/assets/images/GKP-S4/GKP-S4-Aushubskizze_50cm_Arbeitsraum.pdf')],
    page: G + '/kompaktstation/gkp-s4-4',
  },
  {
    id: 'gkp-s5', name: 'GKP-S5', family: 'GKP', title: 'Leichtbeton-Kompaktstation',
    claim: 'Die neue Generation der Ortsnetzstation – mit Reserven für Fernwirk- und Messtechnik.',
    status: 'aktiv', x: 360, z: 240, h: 284, buried: 75, roofOverhang: 9, roof: 'sattel', ventRing: 0,
    maxKva: 1000, optKva: 1600, trafoMax: { l: 200, b: 130, h: 180 },
    mv: { maxFields: 5, box: { w: 190, h: 170, d: 85 }, metering: false },
    lv: { maxStrips: 20, stripNote: 'Gr. 1/2/3', box: { w: 200, h: 170, d: 40 }, billing: false },
    fw: { box: { w: 60, h: 150, d: 32 }, optional: false }, meterRoom: null, tempPower: 2,
    weightEmptyT: 11.6, weightEquippedT: 17.4, concreteOptions: ['leicht', 'normal'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 24', anchorsStation: '4 × RD 42', builtArea: 8.64, installArea: 21.30,
    closedSides: ['C'],
    doors: [
      d('A', -34, 202, 158.8, 36, 2, 'louver', 'ns'),
      d('B', 0, 214.8, 158.8, 36, 2, 'solid', 'ms'),
      d('D', -37.5, 139.3, 173.9, 21, 1, 'louver', 'trafo'),
      d('D', 72, 70, 173.9, 21, 1, 'solid', 'fw'),
    ],
    rooms: [
      r('trafo', -167, -107, 68, 52, 'D'),
      r('ms', 77, -108, 167, 108, 'B'),
      r('ns', -135, 62, 68, 107, 'A'),
      r('fw', -167, 40, -135, 107, 'D'),
    ],
    mvEntries: { side: 'B', count: 4 },
    features: ['Separater Fernwirkraum serienmäßig', 'Geschlossene Seite und innovatives Türkonzept – für Grenzbebauung geeignet', 'Bis 20 NS-Leisten und 5 MS-Felder', 'Optional bis 1.600 kVA'],
    docs: [doc('Kundenzeichnung', '/assets/images/GKP-S5/Kundenzeichnung_GKP-S5.pdf'), doc('Hebeplan', '/assets/images/GKP-S5/GKP-S5-Hebeplan-2025.pdf'), doc('Aushubskizze', '/assets/images/GKP-S5/GKP-S5-Aushubskizze_50cm_Arbeitsraum.pdf')],
    page: G + '/kompaktstation/gkp-s5',
  },
  {
    id: 'gbue-r2', name: 'GBÜ-R2', family: 'GBÜ', title: 'Leichtbeton-Kompaktstation',
    claim: 'Die leistungsstarke, universelle Netz- und Übergabestation für alle Anwendungen.',
    status: 'aktiv', x: 255, z: 310, h: 276, buried: 75, roofOverhang: 9, roof: 'sattel', ventRing: 0,
    maxKva: 1600, trafoMax: { l: 210, b: 130, h: 180 },
    mv: { maxFields: 6, box: { w: 195, h: 170, d: 80 }, metering: true },
    lv: { maxStrips: 20, stripNote: 'Gr. 1/2/3', box: { w: 210, h: 170, d: 35 }, billing: true },
    fw: { box: { w: 60, h: 120, d: 30 }, optional: true }, meterRoom: null, tempPower: 4,
    weightEmptyT: 9.2, weightEquippedT: 16.0, concreteOptions: ['leicht'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 20', anchorsStation: '4 × RD 42', builtArea: 7.91, installArea: 26.22,
    closedSides: [],
    doors: [
      d('A', 0, 209.7, 158.8, 30, 2, 'solid', 'ms'),
      d('C', 0, 209.7, 158.8, 30, 2, 'louver', 'ns'),
      d('B', -19.8, 124.7, 158.8, 30, 1, 'louver', 'trafo'),
      d('D', -19.8, 124.7, 158.8, 30, 1, 'louver', 'trafo'),
    ],
    rooms: [
      r('ns', -116, -144, 116, -101, 'C'),
      r('trafo', -116, -89, 116, 51, 'B'),
      r('ms', -116, 61, 116, 144, 'A'),
    ],
    mvEntries: { side: 'A', count: 5 },
    features: ['MS-Messfeld und niederspannungsseitige Verrechnungsmessung möglich', 'Durchgangsstation: MS vorn, Trafo mittig, NS hinten', 'Vier Baustromdurchführungen'],
    docs: [doc('Kundenzeichnung', '/assets/images/GBUe-R2/GBUe-R2_Typ_G001_SB_Alu_26-B-0232.pdf'), doc('Hebeplan', '/assets/images/GBUe-R2/GBUe-R2_Hebeplan_2025.pdf'), doc('Aushubskizze', '/assets/images/GBUe-R2/GBUe-R2_Aushubskizze_50cm_Arbeitsraum.pdf')],
    page: G + '/kompaktstation/gbü-r2',
  },
  {
    id: 'gbue-r2-lk', name: 'GBÜ-R2 mit Lüfterkranz', family: 'GBÜ', title: 'Leichtbeton-Kompaktstation',
    claim: 'Die GBÜ-R2 mit Lüfterkranz für Transformatoren bis 2.500 kVA.',
    status: 'aktiv', x: 255, z: 310, h: 330, buried: 75, roofOverhang: 9, roof: 'sattel', ventRing: 54,
    maxKva: 2500, trafoMax: { l: 210, b: 130, h: 180 },
    mv: { maxFields: 6, box: { w: 195, h: 170, d: 80 }, metering: true },
    lv: { maxStrips: 20, stripNote: 'Gr. 1/2/3', box: { w: 210, h: 170, d: 35 }, billing: true },
    fw: { box: { w: 60, h: 120, d: 30 }, optional: true }, meterRoom: null, tempPower: 4,
    weightEmptyT: 9.5, weightEquippedT: 16.3, concreteOptions: ['leicht'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 20', anchorsStation: '4 × RD 42', builtArea: 7.91, installArea: 26.22,
    closedSides: [],
    doors: [
      d('A', 0, 209.7, 158.8, 30, 2, 'solid', 'ms'),
      d('C', 0, 209.7, 158.8, 30, 2, 'louver', 'ns'),
      d('B', -19.8, 124.7, 158.8, 30, 1, 'louver', 'trafo'),
      d('D', -19.8, 124.7, 158.8, 30, 1, 'louver', 'trafo'),
    ],
    rooms: [
      r('ns', -116, -144, 116, -101, 'C'),
      r('trafo', -116, -89, 116, 51, 'B'),
      r('ms', -116, 61, 116, 144, 'A'),
    ],
    mvEntries: { side: 'A', count: 5 },
    features: ['Umlaufender Lüfterkranz für hohe Verlustleistungen', 'Bis 2.500 kVA auf 7,91 m² bebauter Fläche', 'MS-Messfeld und Verrechnungsmessung möglich'],
    docs: [doc('Kundenzeichnung', '/assets/images/GBUe-R2/GBUe-R2_Typ_G001_SB_Alu_26-B-0232_Luefterkranz.pdf'), doc('Hebeplan', '/assets/images/GBUe-R2/GBUe-R2_Hebeplan_2025.pdf'), doc('Aushubskizze', '/assets/images/GBUe-R2/GBUe-R2_Aushubskizze_50cm_Arbeitsraum.pdf')],
    page: G + '/kompaktstation/gbü-r2-mit-lüfterkranz',
  },
  {
    id: 'gbue-r3', name: 'GBÜ-R3', family: 'GBÜ', title: 'Leichtbeton-Kompaktstation mit Lüfterkranz',
    claim: 'Die stärkste GRÄPER-Kompaktstation bis 3.150 kVA für regenerative Energien und E-Mobilität.',
    status: 'aktiv', x: 280, z: 355, h: 351, buried: 75, roofOverhang: 9, roof: 'sattel', ventRing: 45,
    maxKva: 3150, trafoMax: { l: 220, b: 130, h: 210 },
    mv: { maxFields: 6, box: { w: 238, h: 192, d: 80 }, metering: true },
    lv: { maxStrips: 20, stripNote: 'Gr. 3', box: { w: 225, h: 192, d: 65 }, billing: true },
    fw: { box: { w: 70, h: 120, d: 30 }, optional: true }, meterRoom: { box: { w: 70, h: 120, d: 30 }, optional: true }, tempPower: 4,
    weightEmptyT: 10.7, weightEquippedT: 24.0, concreteOptions: ['leicht'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 24', anchorsStation: '4 × RD 42', builtArea: 9.94, installArea: 33.21,
    closedSides: [],
    doors: [
      d('A', 0, 238, 186.7, 25, 2, 'solid', 'ms'),
      d('C', 0, 238, 186.7, 25, 2, 'louver', 'ns'),
      d('B', -19.3, 140, 186.7, 25, 1, 'louver', 'trafo'),
      d('D', -19.3, 140, 186.7, 25, 1, 'louver', 'trafo'),
      d('B', 115, 70, 110, 95, 1, 'solid', 'fw', 'fw'),
    ],
    rooms: [
      r('ns', -128, -165, 128, -99, 'C'),
      r('trafo', -128, -87, 128, 73, 'B'),
      r('ms', -128, 83, 128, 165, 'A'),
    ],
    mvEntries: { side: 'A', count: 6 },
    features: ['Störlichtbogenqualifikation IAC-AB 20 kA/1 s nach DIN EN 62271-202', 'Schaltanlagenhöhen bis 190 cm', 'Fernwirk- und Zählerraum optional', 'Gewicht bis ca. 24 t mit E-Ausbau'],
    docs: [doc('Kundenzeichnung', '/assets/downloads/GBUE-R3/GBUe-R3_Typ_G001_SB_Alu_26-B-0162-2.pdf')],
    page: G + '/kompaktstation/gbue-r3-2',
  },
  {
    id: 'gbue-1600', name: 'GBÜ 1600', family: 'GBÜ', title: 'Leichtbeton-Kompaktstation',
    claim: 'Die platzsparende Netz- und Übergabestation – Vorgängerin der GBÜ-R2.',
    status: 'auslaufend', statusNote: 'Auslaufender Typ – für Neuprojekte GBÜ-R2 empfohlen',
    x: 250, z: 305, h: 266, buried: 75, roofOverhang: 9, roof: 'sattel', ventRing: 0,
    maxKva: 1600, trafoMax: { l: 210, b: 130, h: 180 },
    mv: { maxFields: 6, box: { w: 195, h: 165, d: 80 }, metering: true },
    lv: { maxStrips: 20, stripNote: 'Gr. 1/2/3', box: { w: 210, h: 160, d: 35 }, billing: true },
    fw: null, meterRoom: null, tempPower: 4,
    weightEmptyT: 8.1, weightEquippedT: 14.0, concreteOptions: ['leicht', 'normal'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 20', anchorsStation: '4 × RD 42', builtArea: 7.63, installArea: 25.6,
    closedSides: [],
    doors: [
      d('A', 0, 205, 152, 24, 2, 'solid', 'ms'),
      d('C', 0, 205, 152, 24, 2, 'louver', 'ns'),
      d('B', -19, 122, 152, 24, 1, 'louver', 'trafo'),
      d('D', -19, 122, 152, 24, 1, 'louver', 'trafo'),
    ],
    rooms: [
      r('ns', -114, -141, 114, -100, 'C'),
      r('trafo', -114, -88, 114, 50, 'B'),
      r('ms', -114, 60, 114, 141, 'A'),
    ],
    mvEntries: { side: 'A', count: 5 },
    features: ['Bewährte Bauform', 'MS-Messfeld und Verrechnungsmessung möglich'],
    docs: [doc('Kundenzeichnung', '/assets/images/GBUe-1600/GBUe_Typ_G001_SB_Alu_24-B-0450.pdf'), doc('Hebeplan', '/assets/images/GBUe-1600/GBUe1600-Hebeplan-2025.pdf'), doc('Aushubskizze', '/assets/images/GBUe-1600/GBUe1600-2000-Aushubskizze_50cm_Arbeitsraum.pdf')],
    page: G + '/kompaktstation/gbü-1600',
  },
  {
    id: 'gbue-2500', name: 'GBÜ 2500', family: 'GBÜ', title: 'Leichtbeton-Kompaktstation mit Lüfterkranz',
    claim: 'Die platzsparende Station bis 2.500 kVA – Vorgängerin der GBÜ-R2 mit Lüfterkranz.',
    status: 'auslaufend', statusNote: 'Auslaufender Typ – für Neuprojekte GBÜ-R2 mit Lüfterkranz empfohlen',
    x: 250, z: 305, h: 321, buried: 75, roofOverhang: 9, roof: 'sattel', ventRing: 55,
    maxKva: 2500, trafoMax: { l: 210, b: 130, h: 180 },
    mv: { maxFields: 6, box: { w: 195, h: 165, d: 80 }, metering: true },
    lv: { maxStrips: 20, stripNote: 'Gr. 1/2/3', box: { w: 210, h: 160, d: 35 }, billing: true },
    fw: null, meterRoom: null, tempPower: 4,
    weightEmptyT: 8.4, weightEquippedT: 16.0, concreteOptions: ['leicht', 'normal'], doorMaterialStd: 'alu',
    anchorsRoof: '4 × RD 20', anchorsStation: '4 × RD 42', builtArea: 7.63, installArea: 25.6,
    closedSides: [],
    doors: [
      d('A', 0, 205, 152, 24, 2, 'solid', 'ms'),
      d('C', 0, 205, 152, 24, 2, 'louver', 'ns'),
      d('B', -19, 122, 152, 24, 1, 'louver', 'trafo'),
      d('D', -19, 122, 152, 24, 1, 'louver', 'trafo'),
    ],
    rooms: [
      r('ns', -114, -141, 114, -100, 'C'),
      r('trafo', -114, -88, 114, 50, 'B'),
      r('ms', -114, 60, 114, 141, 'A'),
    ],
    mvEntries: { side: 'A', count: 5 },
    features: ['Lüfterkranz für hohe Verlustleistungen', 'MS-Messfeld und Verrechnungsmessung möglich'],
    docs: [doc('Kundenzeichnung', '/assets/images/GBUe-2500/GBUe_Typ_G001_SB_Alu_24-B-0451.pdf'), doc('Hebeplan', '/assets/images/GBUe-1600/GBUe1600-Hebeplan-2025.pdf'), doc('Aushubskizze', '/assets/images/GBUe-1600/GBUe1600-2000-Aushubskizze_50cm_Arbeitsraum.pdf')],
    page: G + '/kompaktstation/gbü-2500-2',
  },
];

export const compactById = (id: string) => COMPACT_STATIONS.find((s) => s.id === id) ?? COMPACT_STATIONS[0];

/**
 * Begehbare Stationen – System Serie (fertig entwickelte, i. d. R. lagermäßig abrufbare Typen).
 * Quelle: www.graeper.de/begehbare-stationsgebaeude/… (Stand 10/2026). Gesamthöhe 361 cm inkl. Keller.
 */
export const SERIE_STATIONS: SerieStation[] = [
  { id: 'ts-r0-332', name: 'TS-R0-332', typ: 'G001', kind: 'trafostation', l: 314, b: 254, h: 361, rooms: ['trafo', 'ms'], roomSplit: [0.46, 0.54],
    maxKva: 630, mvFields202: 3, mvFields312: 3, mvBox: { w: 139, d: 90, h: 220 }, wallArea: { w: 110, h: 220 },
    anchorsRoof: '4 × RD 24', anchorsStation: '4 × 20 t KK', note: 'Begehbare Trafostation mit max. 630 kVA.',
    page: G + '/begehbare-stationsgebaeude/begehbare-trafostation-5', drawing: G + '/assets/images/Station-254-x-314-TS-R0-332-G001/TS-R0-332_Typ_G001.pdf' },
  { id: 'ts-r0-378', name: 'TS-R0-378', typ: 'G001', kind: 'trafostation', l: 360, b: 254, h: 361, rooms: ['trafo', 'ms'], roomSplit: [0.48, 0.52],
    maxKva: 1000, mvFields202: 4, mvFields312: 3, mvBox: { w: 149, d: 90, h: 220 }, wallArea: { w: 110, h: 220 },
    anchorsRoof: '4 × RD 24', anchorsStation: '4 × 20 t KK', note: 'Begehbare Trafostation mit max. 1.000 kVA.',
    page: G + '/begehbare-stationsgebaeude/begehbare-trafostation', drawing: G + '/assets/images/Station-254-x-360-TS-R0-378_G001/TS-R0-378_Typ_G001.pdf' },
  { id: 'ts-r2-528', name: 'TS-R2-528', typ: 'G001', kind: 'trafostation', l: 510, b: 303, h: 361, rooms: ['ms', 'trafo'], roomSplit: [0.617, 0.383],
    maxKva: 1000, mvFields202: 5, mvFields312: 4, mvBox: { w: 178, d: 90, h: 220 }, wallArea: { w: 275, h: 220 },
    anchorsRoof: '4 × RD 30', anchorsStation: '4 × 20 t KK', note: 'Begehbare Trafostation mit max. 1.000 kVA.',
    page: G + '/begehbare-stationsgebaeude/begehbare-trafostation-4', drawing: G + '/assets/images/Station-303-x-510-TS-R2-528-G001/TS-R2-528_Typ_G001.pdf' },
  { id: 'ts-r2-648', name: 'TS-R2-648', typ: 'G001', kind: 'trafostation', l: 630, b: 303, h: 361, rooms: ['ms', 'trafo'], roomSplit: [0.72, 0.28],
    maxKva: 1600, mvFields202: 6, mvFields312: 6, mvBox: { w: 220, d: 90, h: 220 }, wallArea: { w: 380, h: 220 },
    anchorsRoof: '4 × RD 30', anchorsStation: '4 × 20 t KK', note: 'Begehbare Trafostation mit max. 1.600 kVA.',
    page: G + '/begehbare-stationsgebaeude/begehbare-trafostation-2', drawing: G + '/assets/images/Station-303-x-630-TS-R2-648-G001/TS-R2-648_Typ_G001.pdf' },
  { id: 'ts-r2-768', name: 'TS-R2-768', typ: 'G001', kind: 'trafostation', l: 750, b: 303, h: 361, rooms: ['ns', 'ms', 'trafo'], roomSplit: [0.2, 0.56, 0.24],
    maxKva: 1600, mvFields202: 10, mvFields312: 10, mvBox: { w: 346, d: 90, h: 220 }, wallArea: { w: 500, h: 220 },
    anchorsRoof: '8 × RD 30', anchorsStation: '4 × 20 t KK', note: 'Begehbare Trafostation mit max. 1.600 kVA, drei Räume.',
    page: G + '/begehbare-stationsgebaeude/begehbare-trafostation-3', drawing: G + '/assets/images/Station-303-x-750-TS-R2-768-G001/TS-R2-768_Typ_G001.pdf' },
  { id: 'sv-r1-438', name: 'SV-R1-438', typ: 'G002', kind: 'schaltstation', l: 420, b: 282, h: 361.5, rooms: ['ms'], roomSplit: [1],
    maxKva: 0, mvFields202: 9, mvFields312: 9, mvBox: { w: 376, d: 90, h: 200 }, wallArea: { w: 315, h: 200 },
    anchorsRoof: '4 × RD 30', anchorsStation: '4 × 20 t KK', note: 'Begehbare Schaltstation mit stirnseitigem Zugang, Schaltfelderbreite bis 376 cm.',
    page: G + '/begehbare-stationsgebaeude/282-cm-420-cm-3', drawing: 'https://www.graeper-gruppe.de/assets/downloads/282-x-420-SV-R1-438-Typ-G002/Kundenzeichnung.pdf' },
  { id: 'sv-bks', name: 'SV-BKS', typ: 'G101', kind: 'schaltstation', l: 310, b: 270, h: 361, rooms: ['ms'], roomSplit: [1],
    maxKva: 0, mvFields202: 6, mvFields312: 6, mvBox: { w: 260, d: 90, h: 200 }, wallArea: { w: 200, h: 200 },
    anchorsRoof: '4 × RD 24', anchorsStation: '4 × 20 t KK', note: 'Begehbare Schaltstation mit Antennendurchführung und zusätzlichen Ankerschienen zur Montage von Fernwirktechnik.',
    page: G + '/begehbare-stationsgebaeude/begehbare-station-2-cm-3-cm' },
];
export const serieById = (id: string) => SERIE_STATIONS.find((s) => s.id === id) ?? SERIE_STATIONS[0];

/** VK-Trafostände (3-teilige Fertigteil-Transformatorenstände für Freilufttransformatoren). */
export const TRAFOSTAENDE: Trafostand[] = [
  { id: 'vk-g002', name: 'VK-Trafostand Typ G002', l: 1061, b: 650, volumeM3: 63, tubHeight: 153, page: G + '/begehbare-stationsgebaeude/cm-cm-2-3', note: '3-teiliger Fertigteil-Transformatorenstand mit 63 m³ Auffangvolumen.' },
  { id: 'vk-g005', name: 'VK-Trafostand Typ G005', l: 1161, b: 750, volumeM3: 55, tubHeight: 118, page: G + '/begehbare-stationsgebaeude/cm-cm-2-6', note: '3-teiliger Fertigteil-Transformatorenstand mit 55 m³ Auffangvolumen.' },
  { id: 'vk-g006', name: 'VK-Trafostand Typ G006', l: 1061, b: 800, volumeM3: 53, tubHeight: 118, page: G + '/begehbare-stationsgebaeude/cm-cm-2-7', note: '3-teiliger Fertigteil-Transformatorenstand mit 53 m³ Auffangvolumen.' },
];
export const trafostandById = (id: string) => TRAFOSTAENDE.find((s) => s.id === id) ?? TRAFOSTAENDE[0];

/** System Professional: Rastermaße lt. GRÄPER (Längen 3,60–12,00 m im 30-cm-Raster, fünf Breiten). */
export const PROFESSIONAL = {
  widths: [254, 282, 303, 342, 363],
  lengthMin: 360, lengthMax: 1200, lengthStep: 30,
  roomHeights: [245, 260],
  cellarHeights: [68, 78, 98],
};
/** System Individual: zentimetergenau bis 18 × 5 m mit monolithischer Wanne. */
export const INDIVIDUAL = { lengthMin: 250, lengthMax: 1800, widthMin: 220, widthMax: 500, roomHeightMin: 220, roomHeightMax: 350, cellarMax: 150 };

/** Konstruktive Annahmen für begehbare Stationen (aus Kundenzeichnungen der Serie abgeleitet). */
export const WALKIN_CONSTR = {
  wall: 12,            // Außenwand Leichtbeton
  wallSandwich: 26,    // Tragschale + Dämmung + Vorsatzschale
  wallWdvs: 24,        // Wand + WDVS
  partition: 12,
  baseSlab: 12, floorSlab: 12, roofSlab: 14,
  plinthAboveGround: 4, // UK Außenwand min. 4 cm über OK Gelände
  roofOverhang: 9,
};

/** Fertigungs- und Servicestandorte (für Entfernungsstaffel). */
export const PLANTS = [
  { id: 'ahlhorn', name: 'GRÄPER Ahlhorn GmbH & Co. KG', city: '26197 Ahlhorn', lat: 52.89, lon: 8.21, phone: '+49 (0) 4435 303-0', mail: 'info@graeper.de' },
  { id: 'heiligengrabe', name: 'GRÄPER Heiligengrabe GmbH & Co. KG', city: '16909 Heiligengrabe', lat: 53.14, lon: 12.36, phone: '+49 (0) 33962 708-0', mail: 'info@graeper.de' },
  { id: 'tostedt', name: 'GRÄPER Tostedt GmbH & Co. KG', city: '21255 Tostedt', lat: 53.28, lon: 9.71, phone: '+49 (0) 4182 2840-0', mail: 'tostedt@graeper.de' },
  { id: 'marienfeld', name: 'GRÄPER Marienfeld GmbH & Co. KG', city: '33428 Marienfeld', lat: 51.95, lon: 8.28, phone: '+49 (0) 5247 9806-0', mail: 'marienfeld@graeper.de' },
];
