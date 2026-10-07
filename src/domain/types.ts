/**
 * Zentrales Datenmodell des Stationskonfigurators.
 * Alle Längen in cm, Gewichte in kg bzw. t (siehe Feldnamen), Leistungen in kVA.
 */

export type UseCaseId =
  | 'ortsnetz' | 'kundenstation' | 'erzeugung' | 'ladepark' | 'speicher'
  | 'schaltstation' | 'telekom' | 'gas' | 'wasser' | 'trafostand';

export type Side = 'A' | 'B' | 'C' | 'D'; // A = Front (+Z), B = rechts (+X), C = Rückseite (−Z), D = links (−X)
export type RoomKind = 'trafo' | 'ms' | 'ns' | 'fw' | 'zaehler' | 'technik';

/* ---------- Elektrotechnik ---------- */

export type TrafoType = 'oel' | 'ester' | 'giessharz';
export interface TransformerCfg {
  count: number;                 // Anzahl Transformatoren
  powerKva: number;              // Bemessungsleistung je Transformator
  type: TrafoType;
  primaryKv: 10 | 20 | 30;       // Netznennspannung Oberspannung
  secondaryV: 400 | 690 | 800;   // Unterspannung
  ukPercent: 4 | 6;
  vectorGroup: 'Dyn5' | 'Dyn11' | 'Yzn5';
  ront: boolean;                 // regelbarer Ortsnetztransformator
  protection: 'thermometer' | 'dgpt2';
  vibrationDampers: boolean;
  customerSupplied: boolean;     // Beistellung durch Kunden
}

export type MvInsulation = 'sf6frei' | 'sf6' | 'luft';
export type MvFieldType = 'K' | 'T' | 'LS' | 'UE' | 'M' | 'LT';
export type MvProtection = 'ohne' | 'hh' | 'umz' | 'umz_qu';
export interface MvField { id: string; type: MvFieldType; }
export interface MvCfg {
  insulation: MvInsulation;
  vendorId: string;
  fields: MvField[];
  protection: MvProtection;      // Schutzkonzept Trafo-/Übergabeabgang
  ikKa: 16 | 20 | 25;            // Bemessungs-Kurzzeitstrom
  motorDrives: boolean;          // Motorantriebe (fernsteuerbar)
  faultIndicators: 'ohne' | 'ksa' | 'ksa_richtung';
  customerSupplied: boolean;
  meteringSupplied: boolean;     // Messfeld-Wandler durch Netzbetreiber beigestellt
}

export interface LvCfg {
  design: 'offen' | 'gekapselt';
  incomer: 'nh' | 'lasttrenner' | 'leistungsschalter';
  nh00: number; nh1: number; nh2: number; nh3: number;
  acbFeeders: number;            // Leistungsschalter-Abgänge (≥ 800 A)
  reserve: number;               // freie Leistenplätze
  instrument: 'ohne' | 'multimeter' | 'schleppzeiger';
  billingMeters: 0 | 1 | 2;      // Verrechnungsmessungen (Wandlermessung)
  ctSupplied: boolean;           // Stromwandler beigestellt
  feederMonitoring: boolean;     // Abgangsmessung / intelligente Leisten
  streetLighting: boolean;       // Straßenbeleuchtungsteil
  tempPower: boolean;            // Baustromanschluss
  generatorInlet: boolean;       // Notstrom-Einspeisung
  surgeProtection: boolean;      // Überspannungsschutz Typ 1+2
  compensationKvar: number;      // Blindleistungskompensation
  customerSupplied: boolean;
}

/* ---------- Baukörper ---------- */

export type BuildingKind = 'kompakt' | 'begehbar' | 'trafostand';
export type WalkInSystem = 'serie' | 'professional' | 'individual';
export type RoofForm = 'flach' | 'sattel' | 'walm' | 'pult' | 'tonne';
export type WallBuild = 'standard' | 'sandwich' | 'wdvs';
export type FloorBuild = 'beton' | 'system' | 'schaltwarte';
export type FloorFinish = 'ohne' | 'beschichtung' | 'fliesen' | 'dasag' | 'ableitfaehig';
export type DoorVent = 'ohne' | 'v40' | 'v80' | 'voll';

export interface WalkInDoor {
  id: string; side: Side;
  pos: number;                   // Mittelpunkt entlang der Wand, 0..1 (von links, Blick von außen)
  w: number; h: number;          // Lichtmaß cm
  leaves: 1 | 2;
  vent: DoorVent;
  hinge: 'L' | 'R';
}
export interface WalkInGrille { id: string; side: Side; pos: number; w: number; h: number; sill: number; }

export interface WalkInCfg {
  system: WalkInSystem;
  serieId: string;
  lengthCm: number; widthCm: number;
  roomHeightCm: number;          // lichte Raumhöhe
  cellarCm: number;              // lichte Kellerhöhe, 0 = ohne Keller
  wall: WallBuild;
  rooms: RoomKind[];             // Raumfolge von links nach rechts
  roomSplit: number[];           // Anteil der Räume an der lichten Länge (Summe 1)
  floor: FloorBuild;
  floorFinish: FloorFinish;
  roofForm: RoofForm;
  roofPitch: number;             // Grad
  roofInsulated: boolean;
  doors: WalkInDoor[];
  grilles: WalkInGrille[];
  doorsAuto: boolean;            // Türen/Gitter automatisch passend zur Raumaufteilung anordnen
  roofHood: boolean;             // Dachhaube
  gutter: boolean;               // Regenfallrohr
  modules: number;               // Anzahl gekoppelter Baukörper (Kombinationsgebäude)
}

export interface BuildingCfg {
  kind: BuildingKind;
  compactId: string;
  autoSelect: boolean;           // Station automatisch passend wählen
  walkIn: WalkInCfg;
  trafostandId: string;
  concrete: 'leicht' | 'normal';
  doorMaterial: 'alu' | 'stahl' | 'edelstahl';
  security: 'standard' | 'rc2' | 'rc3';
  panicLocks: boolean;
  lockSystem: 'pz' | 'doppel' | 'schwenkhebel';
  doorMonitoring: boolean;       // Verschlussüberwachung
  fire: 'ohne' | 'rei30' | 'rei90';
  soundProtection: boolean;
  gasTight: boolean;
  slopeInstall: boolean;         // Hangeinbau
  trafoRails: boolean;
  fwRoom: boolean;               // optionaler Fernwirkraum (GBÜ)
  ventRing: boolean;             // Lüfterkranz (falls optional)
}

export type SurfaceId = 'reibeputz' | 'rollputz' | 'waschbeton' | 'klinker' | 'holz' | 'metall' | 'naturstein';
export interface EnvelopeCfg {
  surface: SurfaceId;
  clinkerTone: 'rot' | 'rotbunt' | 'anthrazit' | 'sand';
  bodyRal: string; roofRal: string; plinthRal: string;
  doorFinish: 'eloxiert' | 'ral';
  doorRal: string;
  tubBlack: boolean; tubOilProof: boolean; interiorWhite: boolean;
  graffitiProtection: boolean;
}

export interface PenetrationCfg {
  mvCount: number; mvSystem: 'HSI150' | 'HSI90'; mvCover: string;
  lvCount: number; lvSystem: 'HSI150' | 'HSI90'; lvCover: string;
  tempPower: number; tempPowerSystem: 'graeper' | 'hauff';
  earthing: number;
  antenna: boolean;
  fiber: number;                 // LWL-/Steuerkabeleinführungen
}

/* ---------- Ausstattung / Digitalisierung ---------- */

export interface EquipmentCfg {
  telecontrol: 'ohne' | 'vorbereitet' | 'ueberwacht' | 'steuerbar';
  comm: 'lte' | 'lte450' | 'glasfaser' | 'dsl' | 'kunde';
  protocol: 'iec104' | 'iec61850' | 'modbus';
  ups: boolean;
  telecontrolSupplied: boolean;
  enimon: 'ohne' | 'basis' | 'smart';
  steuerbox14a: boolean;
  accessories: Record<string, boolean>;
  heating: boolean; lighting: boolean; climate: boolean;
}

/* ---------- Standort / Logistik / Service ---------- */

export interface SiteCfg {
  zip: string; city: string; deliveryWeek: string;
  distanceKm: number;            // Entfernung ab Werk (Staffel)
  plantId: string;
  unloading: 'bordkran' | 'autokran' | 'bauseits';
  foundation: 'sandplanum' | 'streifen' | 'platte';
  services: Record<string, boolean>;
  access: Record<string, boolean>;
  boundaryBuild: boolean;        // Grenzbebauung
  residential: boolean;          // Wohnbebauung in unmittelbarer Nähe
  floodRisk: boolean;
  notes: string;
}

export interface ContactCfg {
  company: string; name: string; role: string; email: string; phone: string;
  street: string; zip: string; city: string; message: string; consent: boolean;
  customerType: 'netzbetreiber' | 'stadtwerk' | 'industrie' | 'planer' | 'installateur' | 'projektierer' | 'sonstige';
}

export interface DemandCfg {            // Bedarfsrechner (Schritt 1)
  mode: 'direkt' | 'haushalte' | 'ladepark' | 'pv' | 'gewerbe' | 'speicher';
  households: number; heatPumps: number; wallboxes: number;
  chargersDc: number; chargerDcKw: number; chargersAc: number; chargerAcKw: number;
  pvKwp: number; connectedKw: number; simultaneity: number; cosPhi: number;
  storageKw: number; reservePercent: number;
}

export interface Config {
  schema: 1;
  projectName: string;
  projectNo: string;
  useCase: UseCaseId;
  demand: DemandCfg;
  transformer: TransformerCfg;
  mv: MvCfg;
  lv: LvCfg;
  building: BuildingCfg;
  envelope: EnvelopeCfg;
  penetrations: PenetrationCfg;
  equipment: EquipmentCfg;
  site: SiteCfg;
  contact: ContactCfg;
}

/* ---------- Katalogtypen ---------- */

export interface DoorDef {
  side: Side;
  c: number;                     // Mittelpunkt entlang der Wand (A/C: x, B/D: z), Ursprung Stationsmitte
  w: number; h: number; y0: number;
  leaves: 1 | 2;
  style: 'louver' | 'solid' | 'split'; // split: linker Flügel geschlossen, rechter mit Lamellen
  room: RoomKind;
  optional?: 'fw';
}
export interface RoomDef {
  kind: RoomKind;
  x0: number; z0: number; x1: number; z1: number; // lichte Raumgrenzen (Stationskoordinaten)
  access: Side;
}
export interface Box3 { w: number; h: number; d: number }

export interface CompactStation {
  id: string;
  name: string;
  family: 'MKP' | 'HKP' | 'GKP' | 'GBÜ';
  title: string;
  claim: string;
  status: 'aktiv' | 'auslaufend' | 'angekuendigt';
  statusNote?: string;
  x: number; z: number; h: number;    // Außenmaße: x = Seite A/C, z = Seite B/D, h = Gesamthöhe inkl. Einbautiefe
  buried: number;                      // Einbautiefe unter Gelände
  roofOverhang: number;
  roof: 'flach' | 'zelt' | 'sattel';
  ventRing: number;                    // Höhe Lüfterkranz (0 = keiner)
  maxKva: number;                      // 0 = ohne Transformator
  optKva?: number;                     // optional höhere Leistung (Sonderprüfung)
  trafoMax: { l: number; b: number; h: number } | null;
  mv: { maxFields: number; box: Box3; metering: boolean };
  lv: { maxStrips: number; stripNote: string; box: Box3; billing: boolean } | null;
  fw: { box: Box3; optional: boolean; reducesStripsTo?: number } | null;
  meterRoom: { box: Box3; optional: boolean } | null;
  tempPower: number;
  weightEmptyT: number; weightEquippedT: number;
  concreteOptions: ('leicht' | 'normal')[];
  doorMaterialStd: 'alu' | 'stahl';
  anchorsRoof: string; anchorsStation: string;
  builtArea: number; installArea: number; // m²
  closedSides: Side[];                 // geschlossene Seiten (Grenzbebauung)
  doors: DoorDef[];
  rooms: RoomDef[];
  mvEntries: { side: Side; count: number };
  features: string[];
  docs: { label: string; url: string }[];
  page: string;
}

export interface SerieStation {
  id: string; name: string; typ: string;
  kind: 'trafostation' | 'schaltstation';
  l: number; b: number; h: number;     // Außenmaße Baukörper
  rooms: RoomKind[]; roomSplit: number[];
  maxKva: number;
  mvFields202: number; mvFields312: number;
  mvBox: Box3;                          // maximaler Platz MS-Anlage B x T x H
  wallArea: { w: number; h: number };   // zusätzliche Wandmontagefläche
  anchorsRoof: string; anchorsStation: string;
  note: string; page: string; drawing?: string;
}

export interface Trafostand {
  id: string; name: string; l: number; b: number; volumeM3: number; tubHeight: number; page: string; note: string;
}

/* ---------- Ergebnis-Typen des Regelwerks ---------- */

export type Severity = 'error' | 'warn' | 'info' | 'ok';
export interface Finding {
  id: string; severity: Severity; step: StepId; title: string; text: string;
  fix?: { label: string; action: string };
}
export type StepId = 'start' | 'trafo' | 'ms' | 'ns' | 'station' | 'huelle' | 'ausstattung' | 'standort' | 'abschluss';
