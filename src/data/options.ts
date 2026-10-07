import type { DoorVent, FloorBuild, FloorFinish, RoofForm, SurfaceId, WallBuild } from '../domain/types';

export const SURFACES: { id: SurfaceId; label: string; text: string; usesRal: boolean; walkInOnly?: boolean }[] = [
  { id: 'reibeputz', label: 'Reibeputz', text: 'GRÄPER-Standard: mineralischer Reibeputz in Serienfarbe oder beliebigem RAL-Ton.', usesRal: true },
  { id: 'rollputz', label: 'Rollputz', text: 'Feinere, gleichmäßige Putzstruktur – in allen RAL-Tönen.', usesRal: true },
  { id: 'waschbeton', label: 'Waschbeton', text: 'Wartungsfreie, recyclingfähige Oberfläche mit sichtbarem Korn.', usesRal: false },
  { id: 'klinker', label: 'Klinker / Riemchen', text: 'Riemchen- oder Echt-Klinker zur Anpassung an die umgebende Bebauung.', usesRal: false },
  { id: 'holz', label: 'Holzverkleidung', text: 'Vertikale Holzschalung – fügt sich in Wohngebiete und Grünanlagen ein.', usesRal: false },
  { id: 'metall', label: 'Metallpaneele', text: 'Vorgehängte Metallpaneele für Industrie- und Gewerbestandorte.', usesRal: true, walkInOnly: true },
  { id: 'naturstein', label: 'Naturstein', text: 'Natursteinverblendung für besonders hochwertige Standorte.', usesRal: false, walkInOnly: true },
];

export const CLINKER_TONES = [
  { id: 'rot' as const, label: 'Nordkap rot', hex: '#9a4a36' },
  { id: 'rotbunt' as const, label: 'Rot-bunt', hex: '#8b4a3a' },
  { id: 'anthrazit' as const, label: 'Anthrazit', hex: '#4a4744' },
  { id: 'sand' as const, label: 'Sandgelb', hex: '#c7a877' },
];

export const DESIGN_PRESETS = [
  { id: 'graeper', label: 'GRÄPER Blau', body: '9010', roof: '5017', plinth: '5017', door: 'eloxiert' as const, doorRal: '7035' },
  { id: 'kiesel', label: 'Kieselgrau klassisch', body: '7032', roof: '7016', plinth: '7032', door: 'ral' as const, doorRal: '6009' },
  { id: 'gruen', label: 'Tannengrün', body: '1015', roof: '6009', plinth: '6009', door: 'ral' as const, doorRal: '6009' },
  { id: 'anthrazit', label: 'Anthrazit modern', body: '7035', roof: '7016', plinth: '7016', door: 'ral' as const, doorRal: '7016' },
  { id: 'sepia', label: 'Sepia natur', body: '1015', roof: '8014', plinth: '8014', door: 'ral' as const, doorRal: '8014' },
];

export const WALL_BUILDS: { id: WallBuild; label: string; text: string; u: string }[] = [
  { id: 'standard', label: 'Einschalig (Leichtbeton)', text: '12 cm GRÄPER-Leichtbeton. Betauungshemmend, Schalldämmmaß R′w = 45,3 dB. Standard für Energiestationen.', u: 'Uw < 3,76 W/(m²K)' },
  { id: 'sandwich', label: 'Sandwich (gedämmt)', text: 'Tragschale, wärmebrückenfreie Dämmung und feste Betonvorsatzschale. Robust, hoher Feuerwiderstand – für temperaturempfindliche Technik.', u: 'gedämmt, wärmebrückenfrei' },
  { id: 'wdvs', label: 'WDVS (gedämmt)', text: 'Wärmedämmverbundsystem auf Betonwand – wirtschaftliche Dämmung für beheizte oder klimatisierte Räume.', u: 'gedämmt' },
];

export const ROOF_FORMS: { id: RoofForm; label: string; text: string; pitch: [number, number, number] }[] = [
  { id: 'flach', label: 'Flachdach', text: 'GRÄPER-Serienflachdach mit Attika – erfüllt Schall-, Wärme- und Feuerschutz sowie die Druckbelastung im Störlichtbogenfall.', pitch: [0, 0, 0] },
  { id: 'sattel', label: 'Satteldach', text: 'Aufgesetztes Satteldach, z. B. passend zur Wohnbebauung.', pitch: [15, 25, 45] },
  { id: 'walm', label: 'Walmdach', text: 'Allseitig geneigtes Dach für freistehende Standorte.', pitch: [15, 25, 40] },
  { id: 'pult', label: 'Pultdach', text: 'Einseitig geneigtes Dach – modern, günstig für PV-Belegung.', pitch: [5, 10, 20] },
  { id: 'tonne', label: 'Tonnendach', text: 'Gewölbtes Metalldach als gestalterischer Akzent.', pitch: [0, 0, 0] },
];

export const FLOOR_BUILDS: { id: FloorBuild; label: string; text: string }[] = [
  { id: 'beton', label: 'Betonzwischenboden', text: 'Sehr tragfähiger Betonboden mit Aussparungen und Einstiegsluken – Standard für Trafo- und Schalträume.' },
  { id: 'system', label: 'Systemboden (aufgeständert)', text: 'Aufgeständerter Systemzwischenboden für unterschiedliche Schaltanlagentypen – Kabel lassen sich frei führen.' },
  { id: 'schaltwarte', label: 'Schaltwarten-/Doppelboden', text: 'Flexibler Doppelboden mit herausnehmbaren Platten für Schaltwarten, Schrankreihen und IT-Technik.' },
];
export const FLOOR_FINISHES: { id: FloorFinish; label: string }[] = [
  { id: 'ohne', label: 'Beton geglättet' },
  { id: 'beschichtung', label: 'Staubbindende Beschichtung' },
  { id: 'fliesen', label: 'Fliesen (rutschfest)' },
  { id: 'dasag', label: 'DASAG-Betonwerksteinplatten' },
  { id: 'ableitfaehig', label: 'Ableitfähiger Belag' },
];

export const DOOR_SIZES = [
  { w: 100, h: 220 }, { w: 100, h: 230 }, { w: 110, h: 220 }, { w: 110, h: 230 }, { w: 125, h: 220 }, { w: 125, h: 230 },
  { w: 135, h: 220 }, { w: 150, h: 220 }, { w: 150, h: 230 }, { w: 175, h: 220 }, { w: 175, h: 230 }, { w: 200, h: 220 }, { w: 200, h: 230 },
];
export const DOOR_VENTS: { id: DoorVent; label: string }[] = [
  { id: 'ohne', label: 'Ohne Lüftung' },
  { id: 'v40', label: '40 cm Zu- und Abluft (oben/unten)' },
  { id: 'v80', label: '80 cm Zu- und Abluft (oben/unten)' },
  { id: 'voll', label: 'Volle Lüftungsfläche' },
];
export const GRILLE_SIZES = [
  { w: 30, h: 30.5 }, { w: 50, h: 51.5 }, { w: 100, h: 30.5 }, { w: 100, h: 42.5 }, { w: 100, h: 51.5 }, { w: 100, h: 81.5 },
  { w: 100, h: 99.5 }, { w: 120, h: 99.5 }, { w: 100, h: 200 }, { w: 120, h: 201.5 },
];

export const DOOR_MATERIALS = [
  { id: 'alu' as const, label: 'Aluminium', text: 'Eloxiert oder pulverbeschichtet, korrosionsfrei – Standard bei den meisten Kompaktstationen.' },
  { id: 'stahl' as const, label: 'Stahl, feuerverzinkt', text: 'Feuerverzinkt nach DIN EN ISO 1461, besonders robust – auf Wunsch mit Mehrschichtlackierung.' },
  { id: 'edelstahl' as const, label: 'Edelstahl', text: 'Für Wasserversorgung und aggressive Umgebung (z. B. Küste, Industrieatmosphäre).' },
];
export const SECURITY_LEVELS = [
  { id: 'standard' as const, label: 'Standard', text: 'Störlichtbogengeprüfte Türen mit Stocherschutz IP23D.' },
  { id: 'rc2' as const, label: 'Einbruchhemmend RC2', text: 'Geprüft nach DIN EN 1627 – Schutz gegen Gelegenheitstäter.' },
  { id: 'rc3' as const, label: 'Einbruchhemmend RC3 (WK3)', text: 'Geprüft nach DIN EN 1627 – üblich für TK-/PoP-Stationen und kritische Infrastruktur.' },
];

/** Hauff-Kabeldurchführungen (Systemdeckel lt. GRÄPER-Auswahl). */
export const CABLE_ENTRIES = {
  HSI150: { label: 'Hauff HSI150-K100', dia: 15, covers: [
    { id: 'D3/58', label: 'HSI150-D3/58 – 3 Kabel bis Ø 58 mm (MS-Einleiterkabel)' },
    { id: 'D7/33', label: 'HSI150-D7/33 – 7 Kabel bis Ø 33 mm' },
    { id: 'D1/110', label: 'HSI150-D1 – 1 Kabel/Rohr großer Durchmesser' },
    { id: 'blind', label: 'Blinddeckel (Reserve)' },
  ] },
  HSI90: { label: 'Hauff HSI90-K100', dia: 9, covers: [
    { id: 'D3/32', label: 'HSI90-D3/32 – 3 Kabel bis Ø 32 mm' },
    { id: 'D6/20', label: 'HSI90-D6/20 – 6 Kabel bis Ø 20 mm' },
    { id: 'D1/75', label: 'HSI90-D1/75 – 1 Kabel bis Ø 75 mm (NS-Vierleiterkabel)' },
    { id: 'blind', label: 'Blinddeckel (Reserve)' },
  ] },
};

export interface OptionItem { id: string; label: string; text?: string; group: string; def?: boolean; onlyElectrical?: boolean }

/** Zubehör und weiterer Elektroausbau (Umfang lt. GRÄPER-Konfigurator, ergänzt). */
export const ACCESSORIES: OptionItem[] = [
  { id: 'grundinstallation', group: 'Elektroausbau', label: 'Elektro-Grundinstallation', text: 'Beleuchtung, Schalter und Schutzkontaktsteckdose', def: true },
  { id: 'ms_kabel', group: 'Elektroausbau', label: 'MS-Kabelverbindung Schaltanlage – Transformator', text: 'Werkseitig gefertigt und teilentladungsgeprüft', def: true, onlyElectrical: true },
  { id: 'ns_kabel', group: 'Elektroausbau', label: 'NS-Verbindung Transformator – NSHV', text: 'EMV-optimierte Verlegung', def: true, onlyElectrical: true },
  { id: 'innenerde', group: 'Elektroausbau', label: 'Innenerdung / Potentialausgleich', text: 'Erdungssammelleitung mit Potentialausgleichsschiene', def: true },
  { id: 'thermo', group: 'Elektroausbau', label: 'Thermoschutz-Verdrahtung', text: 'Verdrahtung Trafoschutz auf Auslösung/Meldung', def: true, onlyElectrical: true },
  { id: 'zaehlerschrank', group: 'Elektroausbau', label: 'Einbau und Verdrahtung Zählerschrank', onlyElectrical: true },
  { id: 'messverdrahtung', group: 'Elektroausbau', label: 'Verdrahtung Verrechnungsmessung', onlyElectrical: true },
  { id: 'fw_einbau', group: 'Elektroausbau', label: 'Einbau beigestellter Fernwirkanlage' },
  { id: 'beistell', group: 'Elektroausbau', label: 'Einstellen von beigestelltem Material' },
  { id: 'trafoholm', group: 'Sicherheit', label: 'Trafoschutzholm', text: 'Abschrankung vor dem Transformator', def: true, onlyElectrical: true },
  { id: 'schilder', group: 'Sicherheit', label: 'Warn- und Hinweisschilder', text: 'Hochspannungswarnschilder, Verhaltensregeln, Erste Hilfe', def: true },
  { id: 'schaltplantasche', group: 'Sicherheit', label: 'Schaltplantasche', def: true },
  { id: 'uebersichtsplan', group: 'Sicherheit', label: 'Übersichtsschaltplan DIN A4', def: true, onlyElectrical: true },
  { id: 'handleuchte', group: 'Sicherheit', label: 'Handnotleuchte 3,5 h' },
  { id: 'ek_garnitur', group: 'Sicherheit', label: 'Erdungs- und Kurzschließgarnitur', text: 'inkl. Aufbewahrung', onlyElectrical: true },
  { id: 'betaetigungsstange', group: 'Sicherheit', label: 'Betätigungsstange für E-&-K-Garnitur', onlyElectrical: true },
  { id: 'spannungspruefer', group: 'Sicherheit', label: 'Hochspannungsprüfer 10/20 kV', onlyElectrical: true },
  { id: 'hh_sicherungen', group: 'Sicherheit', label: 'HH-Sicherungseinsätze (Satz)', text: 'Bemessungsstrom passend zum Transformator', onlyElectrical: true },
  { id: 'nh_griff', group: 'Sicherheit', label: 'NH-Sicherungsaufsteckgriff mit Stulpe', onlyElectrical: true },
  { id: 'isoliermatte', group: 'Sicherheit', label: 'Isolierende Schutzmatte', onlyElectrical: true },
  { id: 'feuerloescher', group: 'Sicherheit', label: 'CO₂-Feuerlöscher' },
  { id: 'heizung', group: 'Klima', label: 'Heizkörper mit Thermostat', text: 'Frostschutz und Betauungsvermeidung' },
  { id: 'lueftung_thermo', group: 'Klima', label: 'Thermostatgesteuerter Lüfter', text: 'Zwangsbelüftung bei hoher Verlustleistung' },
  { id: 'klima', group: 'Klima', label: 'Klimagerät bzw. Vorbereitung Klimatisierung', text: 'Für Sekundär-, TK- und Batterietechnik' },
  { id: 'rauchmelder', group: 'Überwachung', label: 'Rauchmelder' },
  { id: 'wasserwaechter', group: 'Überwachung', label: 'Wasserwächter (Kabelkeller)' },
  { id: 'tuerkontakt', group: 'Überwachung', label: 'Tür- und Riegelkontakte' },
];

export const SERVICES: OptionItem[] = [
  { id: 'transport', group: 'Lieferung', label: 'Transport zur Baustelle', text: 'inkl. Ladungssicherung und Transportgenehmigungen', def: true },
  { id: 'aufstellung', group: 'Lieferung', label: 'Aufstellung durch GRÄPER-Fachpersonal', text: 'Einheben in die vorbereitete Baugrube, Ausrichten', def: true },
  { id: 'besichtigung', group: 'Lieferung', label: 'Baustellenbesichtigung vorab', text: 'Zuwegung, Kranstellfläche und Ausladung werden vor Ort festgelegt' },
  { id: 'verkehr', group: 'Lieferung', label: 'Verkehrssicherung / Straßensperrung', text: 'Beantragung und Einrichtung nach RSA 21' },
  { id: 'tiefbau', group: 'Baustelle', label: 'Erdarbeiten und Baugrube', text: 'Aushub, Feinplanum, Verfüllung' },
  { id: 'erdung', group: 'Baustelle', label: 'Erdungsanlage', text: 'Ringerder / Tiefenerder inkl. Erdungsmessung und Protokoll' },
  { id: 'kabelzug', group: 'Baustelle', label: 'Kabelzug und Anschlussarbeiten', text: 'MS-Endverschlüsse, NS-Abgänge' },
  { id: 'inbetriebnahme', group: 'Inbetriebnahme', label: 'Inbetriebnahme-Begleitung', text: 'Prüfung, Schalthandlungen, Dokumentation' },
  { id: 'schutzpruefung', group: 'Inbetriebnahme', label: 'Schutzprüfung', text: 'Primär-/Sekundärprüfung der Schutzgeräte mit Protokoll' },
  { id: 'netzanmeldung', group: 'Inbetriebnahme', label: 'Unterstützung Netzanschlussverfahren', text: 'Abstimmung mit dem Netzbetreiber, Unterlagen nach VDE-AR-N 4110' },
  { id: 'rueckbau', group: 'Bestand', label: 'Rückbau und Entsorgung Altstation', text: 'inkl. zertifizierter SF6-Gas- und Altöl-Entsorgung' },
  { id: 'mietstation', group: 'Bestand', label: 'Miet-Trafostation für die Umbauzeit', text: 'Aus dem laufend verfügbaren Stationspool' },
  { id: 'notstrom', group: 'Bestand', label: 'Notstromaggregat für die Umbauzeit' },
  { id: 'wartung', group: 'Betrieb', label: 'Wartungsvertrag', text: 'Regelmäßige Inspektion und Wartung von Station, Schaltanlage und Transformator' },
  { id: 'einweisung', group: 'Betrieb', label: 'Einweisung des Betriebspersonals' },
];

/** Checkliste Baustelle – Inhalte aus dem GRÄPER-Informationsblatt „Stationsaufstellung, Baustellenbeschaffenheit und Kranausladung" (03/2026). */
export const ACCESS_CHECKS: OptionItem[] = [
  { id: 'achslast', group: 'Zufahrt', label: 'Zufahrt für ca. 12 t Achslast dauerhaft tragfähig' },
  { id: 'untergrund', group: 'Zufahrt', label: 'Tragfähiger Untergrund für Fahrzeug und Kranstandplatz (sonst Baggermatten)' },
  { id: 'schwenkbereich', group: 'Kran', label: 'Schwenkbereich des Krans frei von Hindernissen und Freileitungen' },
  { id: 'arbeitsstreifen', group: 'Kran', label: '1 m breiter, tragfähiger Arbeitsstreifen rund um die Baugrube' },
  { id: 'aushub', group: 'Baugrube', label: 'Erdaushub lagert hinter der Baugrube – Vorder- und Seitenbereiche frei' },
  { id: 'planum', group: 'Baugrube', label: 'Feinplanum nach Aushubskizze hergestellt und nivelliert' },
];

export const CUSTOMER_TYPES = [
  { id: 'netzbetreiber', label: 'Netzbetreiber / Energieversorger' },
  { id: 'stadtwerk', label: 'Stadtwerk' },
  { id: 'industrie', label: 'Industrie / Gewerbe' },
  { id: 'planer', label: 'Planungs- / Ingenieurbüro' },
  { id: 'installateur', label: 'Elektroinstallationsbetrieb' },
  { id: 'projektierer', label: 'Projektierer EE / Ladeinfrastruktur' },
  { id: 'sonstige', label: 'Sonstige' },
] as const;

export const DISTANCE_BANDS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];
