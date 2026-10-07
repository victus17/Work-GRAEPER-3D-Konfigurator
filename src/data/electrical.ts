import type { MvFieldType, MvInsulation, TrafoType } from '../domain/types';

/** Normleistungen Verteiltransformatoren (kVA). */
export const KVA_STEPS = [50, 100, 160, 250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150];

export interface TrafoRow {
  kva: number;
  p0: number;   // Leerlaufverluste W (Ökodesign Stufe 2)
  pk: number;   // Kurzschlussverluste W (Ökodesign Stufe 2)
  l: number; b: number; h: number; // typische Abmessungen cm (Richtwert)
  kg: number;   // Gesamtgewicht (Richtwert)
  fluidKg: number; // Isolierflüssigkeit kg (0 bei Gießharz)
  lwa: number;  // Schallleistungspegel dB(A) (Richtwert)
}

/**
 * Ölverteiltransformatoren, hermetisch, Um ≤ 24 kV.
 * Verluste: Verordnung (EU) Nr. 548/2014 i. d. F. (EU) 2019/1783, Stufe 2 (ab 01.07.2021): A0 −10 % / Ak.
 * Abmessungen/Gewichte: Richtwerte marktüblicher Geräte (herstellerabhängig, ±10 %).
 */
export const TRAFO_OIL: TrafoRow[] = [
  { kva: 50, p0: 81, pk: 750, l: 90, b: 60, h: 115, kg: 480, fluidKg: 110, lwa: 39 },
  { kva: 100, p0: 130, pk: 1250, l: 100, b: 65, h: 125, kg: 680, fluidKg: 160, lwa: 41 },
  { kva: 160, p0: 189, pk: 1750, l: 108, b: 70, h: 130, kg: 900, fluidKg: 200, lwa: 44 },
  { kva: 250, p0: 270, pk: 2350, l: 115, b: 76, h: 140, kg: 1250, fluidKg: 260, lwa: 47 },
  { kva: 400, p0: 387, pk: 3250, l: 120, b: 80, h: 150, kg: 1750, fluidKg: 350, lwa: 50 },
  { kva: 630, p0: 540, pk: 4600, l: 125, b: 85, h: 158, kg: 2400, fluidKg: 480, lwa: 52 },
  { kva: 800, p0: 585, pk: 6000, l: 158, b: 100, h: 160, kg: 2900, fluidKg: 580, lwa: 53 },
  { kva: 1000, p0: 693, pk: 7600, l: 168, b: 100, h: 170, kg: 3400, fluidKg: 680, lwa: 55 },
  { kva: 1250, p0: 855, pk: 9500, l: 180, b: 110, h: 178, kg: 4000, fluidKg: 800, lwa: 56 },
  { kva: 1600, p0: 1080, pk: 12000, l: 198, b: 125, h: 180, kg: 4900, fluidKg: 980, lwa: 58 },
  { kva: 2000, p0: 1305, pk: 15000, l: 205, b: 128, h: 180, kg: 5800, fluidKg: 1150, lwa: 60 },
  { kva: 2500, p0: 1575, pk: 18500, l: 210, b: 130, h: 180, kg: 6900, fluidKg: 1400, lwa: 63 },
  { kva: 3150, p0: 1980, pk: 23000, l: 220, b: 130, h: 210, kg: 8300, fluidKg: 1650, lwa: 64 },
];

/** Gießharz-Trockentransformatoren (IP00), Verluste Stufe 2 (A0 −10 % / Ak). Abmessungen: Richtwerte. */
export const TRAFO_DRY: TrafoRow[] = [
  { kva: 50, p0: 180, pk: 1500, l: 100, b: 62, h: 105, kg: 480, fluidKg: 0, lwa: 49 },
  { kva: 100, p0: 252, pk: 1800, l: 110, b: 67, h: 115, kg: 620, fluidKg: 0, lwa: 51 },
  { kva: 160, p0: 360, pk: 2600, l: 120, b: 67, h: 120, kg: 820, fluidKg: 0, lwa: 54 },
  { kva: 250, p0: 468, pk: 3400, l: 130, b: 70, h: 130, kg: 1100, fluidKg: 0, lwa: 57 },
  { kva: 400, p0: 675, pk: 4500, l: 140, b: 82, h: 145, kg: 1500, fluidKg: 0, lwa: 60 },
  { kva: 630, p0: 990, pk: 7100, l: 150, b: 85, h: 160, kg: 2000, fluidKg: 0, lwa: 62 },
  { kva: 800, p0: 1170, pk: 8000, l: 160, b: 90, h: 170, kg: 2400, fluidKg: 0, lwa: 64 },
  { kva: 1000, p0: 1395, pk: 9000, l: 165, b: 99, h: 180, kg: 2900, fluidKg: 0, lwa: 65 },
  { kva: 1250, p0: 1620, pk: 11000, l: 175, b: 99, h: 195, kg: 3400, fluidKg: 0, lwa: 67 },
  { kva: 1600, p0: 1980, pk: 13000, l: 185, b: 100, h: 210, kg: 4100, fluidKg: 0, lwa: 68 },
  { kva: 2000, p0: 2340, pk: 16000, l: 195, b: 128, h: 220, kg: 5000, fluidKg: 0, lwa: 70 },
  { kva: 2500, p0: 2790, pk: 19000, l: 210, b: 128, h: 230, kg: 5900, fluidKg: 0, lwa: 71 },
  { kva: 3150, p0: 3420, pk: 22000, l: 225, b: 128, h: 240, kg: 7200, fluidKg: 0, lwa: 74 },
];

export const trafoRow = (kva: number, type: TrafoType): TrafoRow => {
  const table = type === 'giessharz' ? TRAFO_DRY : TRAFO_OIL;
  const row = table.find((t) => t.kva === kva) ?? table.reduce((a, b) => (Math.abs(b.kva - kva) < Math.abs(a.kva - kva) ? b : a));
  if (type === 'ester') return { ...row, kg: Math.round(row.kg * 1.03), fluidKg: Math.round(row.fluidKg * 1.06) };
  return row;
};

export const TRAFO_TYPES: { id: TrafoType; label: string; short: string; text: string }[] = [
  { id: 'oel', label: 'Öltransformator (Mineralöl)', short: 'Öl', text: 'Standard in Orts- und Kundennetzen: kompakt, leise, wirtschaftlich. Die Fundamentwanne der Station dient als öldichte Auffangwanne (WHG).' },
  { id: 'ester', label: 'Ester-Transformator', short: 'Ester', text: 'Biologisch abbaubare Isolierflüssigkeit mit hohem Brennpunkt (> 300 °C, Klasse K). Sinnvoll in Wasserschutzgebieten, bei Gebäudenähe und erhöhten Brandschutzanforderungen.' },
  { id: 'giessharz', label: 'Gießharz-Trockentransformator', short: 'Gießharz', text: 'Ohne Isolierflüssigkeit, schwer entflammbar. Benötigt mehr Platz und Kühlluft – üblich in begehbaren Stationen und Gebäuden.' },
];

/** HH-Sicherungen – Richtwerte Bemessungsstrom (A) je Netzspannung; verbindlich ist die Auswahltabelle des Sicherungsherstellers. */
export const HH_FUSE: Record<10 | 20 | 30, Record<number, number>> = {
  10: { 50: 10, 100: 16, 160: 25, 250: 40, 400: 50, 630: 80, 800: 100, 1000: 125, 1250: 160 },
  20: { 50: 6.3, 100: 10, 160: 16, 250: 25, 400: 31.5, 630: 50, 800: 63, 1000: 80, 1250: 100, 1600: 125, 2000: 160 },
  30: { 50: 6.3, 100: 6.3, 160: 10, 250: 16, 400: 20, 630: 31.5, 800: 40, 1000: 50, 1250: 63, 1600: 80, 2000: 100 },
};
/** Größte Trafoleistung, bis zu der eine Lasttrennschalter-Sicherungs-Kombination üblich ist (kVA je Netzspannung). */
export const HH_LIMIT_KVA: Record<10 | 20 | 30, number> = { 10: 1250, 20: 2000, 30: 2000 };
/** Viele Netzbetreiber verlangen ab dieser Trafoleistung einen Leistungsschalter mit UMZ-Schutz (TAB prüfen). */
export const LS_RECOMMENDED_FROM_KVA = 1250;

/* ---------- Mittelspannungs-Schaltanlagen ---------- */

export const MV_FIELD_TYPES: { id: MvFieldType; label: string; short: string; text: string; color: string }[] = [
  { id: 'K', label: 'Kabelfeld (Ringkabel)', short: 'K', text: 'Lasttrennschalter mit Erdungsschalter für die ein- und ausgehenden Ringkabel des Netzbetreibers.', color: '#0063b0' },
  { id: 'T', label: 'Trafofeld mit HH-Sicherung', short: 'T', text: 'Lasttrennschalter-Sicherungs-Kombination zum Schutz des Transformators.', color: '#e08a00' },
  { id: 'LS', label: 'Leistungsschalterfeld', short: 'LS', text: 'Vakuum-Leistungsschalter mit Schutzgerät (UMZ). Erforderlich bei großen Transformatoren und Erzeugungsanlagen.', color: '#cf3a23' },
  { id: 'UE', label: 'Übergabefeld', short: 'Ü', text: 'Übergabe-Leistungsschalter bzw. -Lasttrennschalter an der Eigentumsgrenze zwischen Netzbetreiber und Kunde.', color: '#7a4fb5' },
  { id: 'M', label: 'Messfeld', short: 'M', text: 'Luftisoliertes Feld mit Strom- und Spannungswandlern für die mittelspannungsseitige Verrechnungsmessung.', color: '#2e8b57' },
  { id: 'LT', label: 'Längstrennung / Kupplung', short: 'LT', text: 'Trennt die Sammelschiene in zwei Abschnitte, z. B. zwischen Netzbetreiber- und Kundenteil.', color: '#5d5b60' },
];
export const mvFieldType = (id: MvFieldType) => MV_FIELD_TYPES.find((f) => f.id === id)!;

export interface MvVendor {
  id: string; vendor: string; product: string;
  insulation: MvInsulation; medium: string;
  um: number[];                           // Bemessungsspannungen kV
  widths: Record<MvFieldType, number>;    // Feldbreite cm (Richtwert)
  h: number; d: number;                   // Höhe / Tiefe cm (Richtwert, Standardausführung)
  ir: number; ik: number;                 // Sammelschiene A / Kurzzeitstrom kA
  tested: boolean;                        // von GRÄPER als geprüfte Anlage genannt
  compact: boolean;                       // für Kompaktstationen geeignet
  note: string;
}

/**
 * Feldbreiten/Höhen sind Richtwerte lt. Herstellerunterlagen und dienen der Vorplanung.
 * GRÄPER nennt die Fabrikate als in den Stationen geprüft; welche Baukörper-/Schaltanlagen-Konstellation
 * typgeprüft ist, bestätigt der GRÄPER-Ansprechpartner.
 */
export const MV_VENDORS: MvVendor[] = [
  { id: 'neutral', vendor: 'Herstellerneutral', product: 'Planungsraster GRÄPER', insulation: 'sf6frei', medium: 'F-Gas-frei (Fabrikat nach Abstimmung)', um: [12, 24],
    widths: { K: 40, T: 40, LS: 50, UE: 50, M: 80, LT: 40 }, h: 140, d: 78, ir: 630, ik: 20, tested: true, compact: true,
    note: 'Vorplanung im 40-cm-Raster (Messfeld 80 cm). Das Fabrikat wird im Angebot festgelegt.' },
  { id: 'siemens-8djh-blue', vendor: 'Siemens', product: '8DJH 24 blue GIS', insulation: 'sf6frei', medium: 'Clean Air + Vakuumschalttechnik', um: [12, 24],
    widths: { K: 31, T: 43, LS: 43, UE: 50, M: 84, LT: 43 }, h: 140, d: 78, ir: 630, ik: 20, tested: true, compact: true,
    note: 'Gasisolierte Blockanlage mit natürlichem Isoliergas (Clean Air).' },
  { id: 'ormazabal-cgmzero', vendor: 'Ormazabal', product: 'cgm.zero24', insulation: 'sf6frei', medium: 'Natürliche Luft + Vakuumschalttechnik', um: [12, 24],
    widths: { K: 37, T: 47, LS: 48, UE: 48, M: 80, LT: 45 }, h: 140, d: 74, ir: 630, ik: 20, tested: true, compact: true,
    note: 'F-Gas-freie Anlage; Messfeld des gleichen Herstellers kombinierbar.' },
  { id: 'abb-safeplus-air', vendor: 'ABB', product: 'SafePlus Air', insulation: 'sf6frei', medium: 'Trockene Luft + Vakuumschalttechnik', um: [12, 24],
    widths: { K: 33, T: 33, LS: 33, UE: 33, M: 70, LT: 33 }, h: 134, d: 77, ir: 630, ik: 20, tested: true, compact: true,
    note: 'Kompakte Blockanlage, modular erweiterbar.' },
  { id: 'schneider-rmairset', vendor: 'Schneider Electric', product: 'RM AirSeT', insulation: 'sf6frei', medium: 'Reine Luft + Vakuum-Shunt-Technik', um: [12, 24],
    widths: { K: 40, T: 43, LS: 43, UE: 43, M: 85, LT: 43 }, h: 115, d: 71, ir: 630, ik: 20, tested: true, compact: true,
    note: 'Nachfolger der RM6 mit gleicher Grundfläche.' },
  { id: 'eaton-xiria', vendor: 'Eaton', product: 'XIRIA / XIRIA E', insulation: 'sf6frei', medium: 'Feststoff-/Luftisolation + Vakuumschalttechnik', um: [12, 24],
    widths: { K: 35, T: 35, LS: 35, UE: 50, M: 85, LT: 50 }, h: 131, d: 60, ir: 630, ik: 20, tested: true, compact: true,
    note: 'Seit jeher ohne SF6; XIRIA E als erweiterbare Einzelfelder inkl. Messfeld.' },
  { id: 'driescher-minex', vendor: 'Driescher Wegberg', product: 'MINEX® ABS® zero', insulation: 'sf6frei', medium: 'F-Gas-frei, metallgekapselt', um: [12, 24],
    widths: { K: 40, T: 45, LS: 50, UE: 50, M: 80, LT: 45 }, h: 140, d: 80, ir: 630, ik: 20, tested: true, compact: true,
    note: 'Anlage mit Störlichtbogen-Absorbersystem (ABS).' },
  { id: 'siemens-8djh36', vendor: 'Siemens', product: '8DJH 36', insulation: 'sf6', medium: 'SF6-isoliert (36 kV)', um: [36],
    widths: { K: 43, T: 50, LS: 59, UE: 59, M: 110, LT: 50 }, h: 160, d: 92, ir: 630, ik: 20, tested: true, compact: false,
    note: 'Für 30-kV-Netze; SF6 ist oberhalb 24 kV bis Ende 2029 für Neuanlagen zulässig.' },
  { id: 'abb-safeplus36', vendor: 'ABB', product: 'SafePlus 36', insulation: 'sf6', medium: 'SF6-isoliert (36 kV)', um: [36],
    widths: { K: 42, T: 42, LS: 42, UE: 42, M: 100, LT: 42 }, h: 193, d: 88, ir: 630, ik: 20, tested: true, compact: false,
    note: 'Für 30-kV-Netze, z. B. Wind- und PV-Parks.' },
  { id: 'luft', vendor: 'Herstellerneutral', product: 'Luftisolierte Schaltanlage (AIS)', insulation: 'luft', medium: 'Luftisoliert, metallgekapselt', um: [12, 24],
    widths: { K: 75, T: 75, LS: 75, UE: 75, M: 100, LT: 75 }, h: 225, d: 110, ir: 630, ik: 20, tested: false, compact: false,
    note: 'Klassische Einzelfeldanlage für begehbare Stationen; benötigt deutlich mehr Platz.' },
];
export const mvVendor = (id: string) => MV_VENDORS.find((v) => v.id === id) ?? MV_VENDORS[0];
export const umForKv = (kv: 10 | 20 | 30) => (kv === 10 ? 12 : kv === 20 ? 24 : 36);

/* ---------- Niederspannung ---------- */

/** Normgrößen Einspeise-/Trafoschalter (A). */
export const LV_DEVICE_SIZES = [250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6300];
/** NH-Sicherungslastschaltleisten im 185-mm-Sammelschienensystem. Ein Leistenplatz = 100 mm. */
export const NH_STRIPS = [
  { id: 'nh00' as const, label: 'NH00', amp: 160, slots: 0.5, text: 'bis 160 A – z. B. Straßenbeleuchtung, kleine Hausanschlüsse (2 Leisten je Platz)' },
  { id: 'nh1' as const, label: 'NH1', amp: 250, slots: 1, text: 'bis 250 A' },
  { id: 'nh2' as const, label: 'NH2', amp: 400, slots: 1, text: 'bis 400 A – Standard-Netzabgang im Ortsnetz' },
  { id: 'nh3' as const, label: 'NH3', amp: 630, slots: 1, text: 'bis 630 A – leistungsstarke Abgänge, Ladeinfrastruktur' },
];
export const ACB_FEEDER_SLOTS = 4;      // Platzbedarf je Leistungsschalter-Abgang in Leistenplätzen
export const DIRECT_METERING_MAX_A = 63; // darüber Wandlermessung

/** Größte in GRÄPER-Verteilungen genannte Bemessungsströme. */
export const LV_MAX_A = { open: 4000, enclosed: 6300 };
