import type { Config, StepId, UseCaseId } from '../domain/types';
import { defaultConfig, defaultWalkIn, mvFields } from '../domain/defaults';

export interface UseCase {
  id: UseCaseId;
  label: string;
  short: string;
  text: string;
  icon: string;                 // lucide-Icon-Name
  group: 'energie' | 'sonder';
  electrical: boolean;          // Trafo/MS/NS werden konfiguriert
  steps: StepId[];
  bullets: string[];
  apply: (c: Config) => Config; // setzt praxisübliche Startwerte
}

const ALL: StepId[] = ['start', 'trafo', 'ms', 'ns', 'station', 'huelle', 'ausstattung', 'standort', 'abschluss'];
const BUILDING_ONLY: StepId[] = ['start', 'station', 'huelle', 'ausstattung', 'standort', 'abschluss'];

/** Ausgangszustand je Anwendung: Projekt-/Kontaktdaten und Standort bleiben erhalten. */
const base = (c: Config): Config => {
  const d = defaultConfig();
  return { ...d, projectName: c.projectName, projectNo: c.projectNo, contact: c.contact, site: c.site, demand: c.demand, envelope: c.envelope };
};

export const USE_CASES: UseCase[] = [
  {
    id: 'ortsnetz', group: 'energie', electrical: true, steps: ALL, icon: 'Home',
    label: 'Ortsnetzstation', short: 'Wohn- und Mischgebiete',
    text: 'Versorgung von Wohn- und Gewerbegebieten aus dem Mittelspannungsnetz – klassisch oder als digitale, fernüberwachte Ortsnetzstation.',
    bullets: ['Transformator 250–1.000 kVA', 'Ringkabelfelder + Trafofeld (z. B. KKT)', 'NH-Abgänge für das Niederspannungsnetz'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'ortsnetz';
      n.transformer = { ...n.transformer, powerKva: 630, ukPercent: 4 };
      n.mv = { ...n.mv, fields: mvFields('K', 'K', 'T'), protection: 'hh', faultIndicators: 'ksa' };
      n.lv = { ...n.lv, incomer: 'lasttrenner', nh00: 2, nh2: 8, nh3: 0, reserve: 2, streetLighting: true, tempPower: true, feederMonitoring: false };
      n.equipment = { ...n.equipment, telecontrol: 'vorbereitet', comm: 'lte450' };
      return n;
    },
  },
  {
    id: 'kundenstation', group: 'energie', electrical: true, steps: ALL, icon: 'Factory',
    label: 'Kunden- / Übergabestation', short: 'Gewerbe und Industrie',
    text: 'Kundeneigene Station nach VDE-AR-N 4110 mit Übergabe vom Netzbetreiber, Verrechnungsmessung und eigener Niederspannungsverteilung.',
    bullets: ['Transformator 400–2.500 kVA', 'Übergabe- und Messfeld nach TAB', 'Leistungsschalter-Einspeisung, Kompensation'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'kundenstation';
      n.transformer = { ...n.transformer, powerKva: 1000, ukPercent: 6, protection: 'dgpt2' };
      n.mv = { ...n.mv, fields: mvFields('K', 'K', 'T'), protection: 'hh', faultIndicators: 'ksa_richtung' };
      n.lv = { ...n.lv, incomer: 'leistungsschalter', nh00: 0, nh2: 4, nh3: 4, reserve: 2, billingMeters: 1, instrument: 'multimeter', tempPower: false, surgeProtection: true };
      n.equipment = { ...n.equipment, telecontrol: 'ohne', enimon: 'basis' };
      n.penetrations = { ...n.penetrations, lvCount: 8 };
      return n;
    },
  },
  {
    id: 'erzeugung', group: 'energie', electrical: true, steps: ALL, icon: 'Sun',
    label: 'Erzeugungsanlage', short: 'PV, Wind, BHKW',
    text: 'Einspeisestation für Photovoltaik-, Wind- und BHKW-Anlagen mit Schutz- und Fernwirktechnik nach den Anforderungen des Netzbetreibers.',
    bullets: ['Transformator 800–3.150 kVA', 'Leistungsschalter mit UMZ- und Q-U-Schutz', 'MS-Messfeld, Fernwirkanlage'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'erzeugung';
      n.transformer = { ...n.transformer, powerKva: 2500, ukPercent: 6, secondaryV: 800, vectorGroup: 'Dyn11', protection: 'dgpt2' };
      n.mv = { ...n.mv, fields: mvFields('K', 'K', 'M', 'LS'), protection: 'umz_qu', faultIndicators: 'ksa_richtung', motorDrives: true };
      n.lv = { ...n.lv, incomer: 'leistungsschalter', nh00: 0, nh1: 0, nh2: 0, nh3: 10, reserve: 2, billingMeters: 0, tempPower: false, surgeProtection: true, streetLighting: false };
      n.equipment = { ...n.equipment, telecontrol: 'steuerbar', comm: 'lte450', ups: true };
      n.penetrations = { ...n.penetrations, lvCount: 10, antenna: true };
      return n;
    },
  },
  {
    id: 'ladepark', group: 'energie', electrical: true, steps: ALL, icon: 'Zap',
    label: 'Ladeinfrastruktur', short: 'Ladeparks, Depots, Flotten',
    text: 'Stationslösung für Schnellladeparks und Betriebshöfe: hohe Niederspannungsströme, kompakte Stellfläche, Lastmanagement.',
    bullets: ['Transformator 630–3.150 kVA', 'Leistungsstarke NH3- bzw. Leistungsschalter-Abgänge', 'Verrechnungsmessung, Monitoring'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'ladepark';
      n.transformer = { ...n.transformer, powerKva: 1600, ukPercent: 6, protection: 'dgpt2' };
      n.mv = { ...n.mv, fields: mvFields('K', 'K', 'LS'), protection: 'umz', faultIndicators: 'ksa' };
      n.lv = { ...n.lv, incomer: 'leistungsschalter', nh00: 0, nh1: 0, nh2: 2, nh3: 8, reserve: 2, billingMeters: 1, tempPower: false, surgeProtection: true, feederMonitoring: true };
      n.equipment = { ...n.equipment, telecontrol: 'ueberwacht', enimon: 'smart', comm: 'lte' };
      n.penetrations = { ...n.penetrations, lvCount: 10 };
      return n;
    },
  },
  {
    id: 'speicher', group: 'energie', electrical: true, steps: ALL, icon: 'BatteryCharging',
    label: 'Batteriespeicher', short: 'BESS, Peak-Shaving, Inselnetz',
    text: 'Netzanschluss- und Trafostation für Batteriespeicher – vom Gewerbespeicher bis zur Großspeicheranlage in Containerbauweise.',
    bullets: ['Transformator 630–3.150 kVA, 690/800 V', 'Leistungsschalter mit UMZ- und Q-U-Schutz', 'Steuerungs- und Monitoringtechnik'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'speicher';
      n.transformer = { ...n.transformer, powerKva: 2000, ukPercent: 6, secondaryV: 690, vectorGroup: 'Dyn11', protection: 'dgpt2' };
      n.mv = { ...n.mv, fields: mvFields('K', 'K', 'M', 'LS'), protection: 'umz_qu', motorDrives: true, faultIndicators: 'ksa_richtung' };
      n.lv = { ...n.lv, incomer: 'leistungsschalter', nh00: 0, nh1: 0, nh2: 0, nh3: 4, acbFeeders: 1, reserve: 1, tempPower: false, surgeProtection: true };
      n.equipment = { ...n.equipment, telecontrol: 'steuerbar', ups: true, enimon: 'smart' };
      n.penetrations = { ...n.penetrations, lvCount: 8, antenna: true };
      return n;
    },
  },
  {
    id: 'schaltstation', group: 'energie', electrical: true, steps: ['start', 'ms', 'station', 'huelle', 'ausstattung', 'standort', 'abschluss'], icon: 'GitBranch',
    label: 'Schalt- / Übergabestation', short: 'ohne Transformator',
    text: 'Reine Mittelspannungs-Schaltstation, z. B. als Netzknoten, Schwerpunktstation oder Übergabe mit Verrechnungsmessung.',
    bullets: ['Bis 10 MS-Felder (begehbar)', 'Kompakt als HKP-E-Ü', 'Fernwirk- und Zählerraum'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'schaltstation';
      n.transformer = { ...n.transformer, count: 0 };
      n.mv = { ...n.mv, fields: mvFields('K', 'K', 'K', 'UE', 'M'), protection: 'umz', motorDrives: true, faultIndicators: 'ksa_richtung' };
      n.lv = { ...n.lv, nh00: 0, nh1: 0, nh2: 0, nh3: 0, reserve: 0, tempPower: false, streetLighting: false, instrument: 'ohne' };
      n.building = { ...n.building, compactId: 'hkp-e-ue' };
      n.equipment = { ...n.equipment, telecontrol: 'steuerbar', ups: true };
      n.penetrations = { ...n.penetrations, mvCount: 5, lvCount: 0, antenna: true };
      return n;
    },
  },
  {
    id: 'telekom', group: 'sonder', electrical: false, steps: BUILDING_ONLY, icon: 'RadioTower',
    label: 'Telekommunikation / PoP', short: 'Glasfaser, Datacenter',
    text: 'Einbruchhemmende, gedämmte Technikgebäude für Glasfaser-PoP, Vermittlungs- und Rechenzentrumstechnik.',
    bullets: ['Sandwich-Bauweise, beheiz- und klimatisierbar', 'Doppelboden, Ankerschienen', 'Türen RC3 nach DIN EN 1627'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'telekom';
      n.transformer = { ...n.transformer, count: 0 };
      n.mv = { ...n.mv, fields: [] };
      n.building = { ...n.building, kind: 'begehbar', security: 'rc3', doorMaterial: 'stahl', doorMonitoring: true, trafoRails: false,
        walkIn: { ...defaultWalkIn(), system: 'professional', lengthCm: 480, widthCm: 303, roomHeightCm: 260, cellarCm: 68, wall: 'sandwich', rooms: ['technik'], roomSplit: [1], floor: 'schaltwarte', roofInsulated: true } };
      n.equipment = { ...n.equipment, telecontrol: 'ohne', climate: true, heating: true };
      n.penetrations = { ...n.penetrations, mvCount: 0, lvCount: 2, fiber: 6, tempPower: 0 };
      return n;
    },
  },
  {
    id: 'gas', group: 'sonder', electrical: false, steps: BUILDING_ONLY, icon: 'Flame',
    label: 'Gas- / Wasserstoffstation', short: 'Regel-, Mess-, Verdichterstation',
    text: 'Stationsgebäude für Gasdruckregel- und Messanlagen nach DVGW G 491 – mit gasdicht getrennten Räumen und ableitfähigen Böden.',
    bullets: ['Gasdichte Raumtrennung', 'Ableitfähiger, funkenfreier Boden', 'Schallschutz und individuelle Fassade'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'gas';
      n.transformer = { ...n.transformer, count: 0 };
      n.mv = { ...n.mv, fields: [] };
      n.building = { ...n.building, kind: 'begehbar', gasTight: true, soundProtection: true, trafoRails: false,
        walkIn: { ...defaultWalkIn(), system: 'individual', lengthCm: 600, widthCm: 300, roomHeightCm: 260, cellarCm: 0, rooms: ['technik', 'technik'], roomSplit: [0.7, 0.3], floorFinish: 'ableitfaehig' } };
      n.equipment = { ...n.equipment, telecontrol: 'ueberwacht' };
      n.penetrations = { ...n.penetrations, mvCount: 0, lvCount: 2, tempPower: 0 };
      return n;
    },
  },
  {
    id: 'wasser', group: 'sonder', electrical: false, steps: BUILDING_ONLY, icon: 'Droplets',
    label: 'Pump- / Wasserstation', short: 'Wasserversorgung, Abwasser',
    text: 'Pumpstationen, Armaturenschacht- und Sonderbauwerke – wahlweise mit oder ohne Sohle, mit Edelstahltüren und lebensmittelgeeigneten Fliesen.',
    bullets: ['Mit oder ohne Sohle (Aufstellung über Bestand)', 'Edelstahltüren und -gitter', 'Rutschfeste Verfliesung, Gefälle zum Pumpensumpf'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'wasser';
      n.transformer = { ...n.transformer, count: 0 };
      n.mv = { ...n.mv, fields: [] };
      n.building = { ...n.building, kind: 'begehbar', doorMaterial: 'edelstahl', security: 'rc2', trafoRails: false,
        walkIn: { ...defaultWalkIn(), system: 'individual', lengthCm: 420, widthCm: 300, roomHeightCm: 245, cellarCm: 0, rooms: ['technik'], roomSplit: [1], floorFinish: 'fliesen' } };
      n.equipment = { ...n.equipment, telecontrol: 'ueberwacht', heating: true };
      n.penetrations = { ...n.penetrations, mvCount: 0, lvCount: 2, tempPower: 0 };
      return n;
    },
  },
  {
    id: 'trafostand', group: 'sonder', electrical: false, steps: ['start', 'station', 'standort', 'abschluss'], icon: 'Layers',
    label: 'Trafostand', short: 'Umspannwerk, Freilufttrafo',
    text: 'Dreiteiliger Fertigteil-Transformatorenstand mit öldichten Auffangwannen aus FD-Beton C 35/45 für große Freilufttransformatoren.',
    bullets: ['Auffangvolumen 53–63 m³ als Systemtyp', 'Monolithisch und fugenlos gefertigt', 'Individuelle Abmessungen möglich'],
    apply: (c) => {
      const n = base(c);
      n.useCase = 'trafostand';
      n.transformer = { ...n.transformer, count: 0 };
      n.mv = { ...n.mv, fields: [] };
      n.building = { ...n.building, kind: 'trafostand' };
      n.site = { ...n.site, unloading: 'autokran' };
      return n;
    },
  },
];

export const useCase = (id: UseCaseId) => USE_CASES.find((u) => u.id === id) ?? USE_CASES[0];

export const STEP_META: Record<StepId, { label: string; sub: string }> = {
  start: { label: 'Anwendung', sub: 'Einsatzzweck und Bedarf' },
  trafo: { label: 'Transformator', sub: 'Leistung, Spannung, Bauart' },
  ms: { label: 'Mittelspannung', sub: 'Schaltanlage und Schutz' },
  ns: { label: 'Niederspannung', sub: 'Verteilung und Messung' },
  station: { label: 'Station', sub: 'Baukörper und Maße' },
  huelle: { label: 'Gebäudehülle', sub: 'Türen, Fassade, Durchführungen' },
  ausstattung: { label: 'Ausstattung', sub: 'Fernwirktechnik und Zubehör' },
  standort: { label: 'Standort', sub: 'Lieferung, Aufstellung, Service' },
  abschluss: { label: 'Zusammenfassung', sub: 'Datenblatt und Anfrage' },
};
