# Übergabe – GRÄPER Stationskonfigurator (Stand 05.10.2026, zweite Sitzung)

## Stand

Der Konfigurator ist funktionsfähig und im Browser getestet: alle 9 Schritte, 3D-Modell, Grundriss, Schaltplan, Baugrubenplan,
Technik-Check mit Korrekturen, Zusammenfassung, Exporte, Teilen-Link und Anfrage über den Server.
`npm run typecheck`, `npm test` (16 Tests) und `npm run build` laufen fehlerfrei. Bedienung und Betrieb: siehe README.md.

## Noch offen / zu prüfen

1. **Richtwerte verifizieren:** Trafo-Abmessungen/-Gewichte und HH-Sicherungen (`src/data/electrical.ts`) gegen `docs/recherche/trafo-ns-normen_UNGEPRUEFT.md` und Herstellerdaten abgleichen; MS-Feldbreiten je Fabrikat gegen Herstellerkataloge prüfen (Recherche dazu fehlt noch).
2. **Druck/PDF** des Datenblatts wurde nur im Aufbau geprüft, der Druckdialog selbst nicht – einmal in Chrome und Edge drucken.
3. **Mail-Versand der Anfragen** an die Konzerninfrastruktur anbinden (Webhook oder Ausgangsordner `data/outbox`).
4. **Originallogo** einsetzen (derzeit Schriftzug „GRÄPER" als Text).
5. Begehbare Stationen: Raumzuschnitt und Einbautenlage sind Planungsvorschläge; Lüftungsregel ist eine Faustformel.
6. Mobile Darstellung ist funktional, aber nicht feinoptimiert.

---

## Historie: Übergabe aus der ersten Sitzung

Auftrag: 3D-Online-Konfigurator für Versorgungsstationen der Firma GRÄPER (www.graeper.de), konzernweit einsetzbar,
deutschsprachig, Qualität eines Kauf-Tools. Der Auftraggeber hat kein Fachwissen im Stationsbau.

## Stand in einem Satz

Recherche, Stammdaten, Fachlogik, Zustandsverwaltung, Designsystem und Bedienelemente sind fertig und getestet.
**Die eigentliche Oberfläche (Schritte), die 3D-Darstellung, die 2D-Ansichten, die Zusammenfassung und der Server fehlen noch.**
`src/App.tsx` ist nur ein Platzhalter.

Prüfen: `npm run typecheck` (sauber), `npm test` (16 Tests grün), `npm run build` (läuft durch), `npm run dev` (Port 5173).

## Fertig

| Bereich | Datei | Inhalt |
|---|---|---|
| Datenmodell | `src/domain/types.ts` | `Config` und alle Katalogtypen |
| Stationskatalog | `src/data/stations.ts` | 13 Kompaktstationen (Maße, Grenzen, Türen, Räume, Gewichte, PDF-Links), 7 Serienstationen, 3 Trafostände, Raster System Professional/Individual, Werke |
| Elektrodaten | `src/data/electrical.ts` | Trafotabellen (Verluste Ökodesign Stufe 2), HH-Sicherungen, MS-Fabrikate mit Feldbreiten, NH-Leisten |
| Optionen | `src/data/options.ts`, `ral.ts`, `glossary.ts`, `usecases.ts` | Oberflächen, Türen, Gitter, Zubehör, Leistungen, 190 RAL-Töne, 47 Glossartexte, 10 Anwendungen mit Startwerten |
| Berechnung | `src/domain/calc.ts` | Ströme, Kurzschlussstrom, Verluste, Lüftung, Schall, Bedarfsrechner |
| Geometrie | `src/domain/layout.ts` | `buildGeometry()` liefert Außenmaße, Öffnungen, Räume und platzierte Einbauten für 3D und Grundriss; `autoDoors()` |
| Stationswahl | `src/domain/fit.ts` | `rankCompact()`, `fitSerie()`, `walkInNeed()` |
| Regelwerk | `src/domain/engine.ts` | `derive()`, `check()` (Technik-Check mit Korrekturvorschlägen), `applyFix()`, `normalize()`, Gewichte, Baugrube, Logistik |
| Zustand | `src/state/store.ts` | zustand-Store mit Rückgängig, lokalem Speichern, Ansichtszustand |
| Oberfläche | `src/styles/app.css`, `src/ui/kit.tsx`, `src/lib/format.ts` | komplettes Designsystem (CSS-Klassen für alle geplanten Bildschirme) und Bedienelemente |
| 3D-Vorarbeit | `src/three/textures.ts` | prozedurale Texturen, Warnschild, Textschilder, `boxWorldUV()` |
| Tests | `tests/engine.test.ts` | Berechnung, Katalogkonsistenz, Stationswahl, Regeln, Baugrube |

## Offen (in dieser Reihenfolge)

1. **3D** (`src/three/`): `parts.tsx` (Wandsegmente mit Öffnungen, Türen mit Lamellen und Öffnungsanimation, Maßlinien, Person),
   `equipment.tsx` (Transformator Öl/Gießharz, MS-Felder, NS-Verteilung, Fernwirk-/Zählerschrank),
   `Station.tsx` (Wanne, Wände, Lüfterkranz, Dachformen, Innenausbau), `Scene.tsx` (Canvas, Licht, Kamera-Presets, Screenshot).
   Alles wird aus `derived.geometry` gezeichnet. Modell in cm bauen und die Gruppe mit 0,01 skalieren.
2. **Schritte** (`src/steps/`): start, trafo, ms, ns, station, huelle, ausstattung, standort, abschluss. Reihenfolge je Anwendung steht in `useCase(id).steps`.
3. **Rahmen** (`src/App.tsx`): Kopfzeile, Schrittleiste links, Ansicht Mitte (Reiter 3D / Grundriss / Schaltplan / Aufstellung), Panel rechts, Kennzahlenleiste, Technik-Check-Dialog.
4. **2D-Ansichten** (`src/views/`): Grundriss (SVG, bemaßt), einpoliger Übersichtsschaltplan (SVG aus `mv.fields`, Trafo, NS-Abgängen), Baugrubenplan.
5. **Abschluss**: Datenblatt als Druckansicht (PDF über Browserdruck), Ausschreibungstext, JSON/CSV-Export, Teilen-Link, Anfrageformular.
6. **Server** (`server/index.mjs`): Fastify + `node:sqlite`; `POST/GET /api/configurations`, `POST /api/inquiries`, `GET /api/admin/inquiries` (Token), statische Auslieferung von `dist`. Frontend muss auch ohne Server funktionieren.
7. **README.md** und Fachkonzept mit Quellen.

## Konventionen, die der vorhandene Code voraussetzt

- Koordinaten: Ursprung Stationsmitte, x entlang Seite A/C, z entlang Seite B/D. A = Front (+z), B = rechts (+x), C = Rückseite (−z), D = links (−x). Gelände bei y = 0.
- Türposition `c` ist die Koordinate entlang der Wandachse (A/C: x, B/D: z). Für die Wandansicht von außen gilt: A u = c, B u = −c, C u = −c, D u = c.
- Blickrichtung der Einbauten (`Item.face`): A → Drehung 0, B → +90°, C → 180°, D → −90° um die Hochachse.
- Kompaktstationen: Gesamthöhe enthält 75 cm Einbautiefe. Begehbar: Einbautiefe = 12 + Kellerhöhe − 4 cm.
- Jede Änderung läuft über `useStore().update(draft => …)`; `normalize()` wählt bei `autoSelect` automatisch die kleinste passende Kompaktstation.
- Keine Preise im Tool (keine belastbaren Daten). Keine externen CDNs (Schrift über `@fontsource-variable/overpass`, Texturen prozedural).
- Logo: nur Schriftzug „GRÄPER" als Text. Die Originallogo-Datei muss GRÄPER selbst einsetzen.

## Datenqualität – wichtig

- **Aus GRÄPER-Quellen belegt:** Stationsmaße, maximale Trafoleistung, Einbauräume MS/NS/Fernwirk, Leistenzahlen, Gewichte, Anker, Flächen, Türmaße, Baugrubenmaße (Website, Broschüre Kompaktstationen 08/2026, Broschüre begehbare Stationen 06/2026, Kundenzeichnungen, Aushubskizzen).
- **Richtwerte aus eigenem Fachwissen, noch nicht gegen Herstellerunterlagen geprüft:** Trafo-Abmessungen und -Gewichte, HH-Sicherungstabelle, Feldbreiten/Höhen der MS-Fabrikate, Raumzuschnitte der begehbaren Stationen, Gewichtsschätzung begehbarer Stationen.
- `docs/recherche/trafo-ns-normen_UNGEPRUEFT.md` enthält eine begonnene Recherche (Siemens FITformer/GEAFOL-Daten, Driescher/Siemens/SIBA-Sicherungstabellen) mit Quellen. Sie wurde abgebrochen und ist **noch nicht in `electrical.ts` eingearbeitet**. Die Recherche zu den MS-Schaltanlagen-Fabrikaten wurde ohne Ergebnis abgebrochen.
- Bei Widerspruch Website/Broschüre wurde der vorsichtigere Wert genommen (MKP 5 statt 6 NS-Leisten, HKP-E-Ü 7 statt 8 Felder).
- GBÜ 1600 und GBÜ 2500 sind auf der Website als „auslaufend" markiert, HKP-E3 ist erst ab Mitte Q1/2027 lieferbar.

## Quellen

- https://www.graeper.de/leistungen/versorgungsstationen/kompaktstationen und …/begehbare-versorgungsstationen (Detailseiten je Typ mit PDF-Zeichnungen, Links stehen in `stations.ts`)
- https://www.graeper.de/assets/downloads/GRAe-Broschuere-Kompaktstationen.pdf, …/GRAe-Broschuere-Begehbare-Stationen.pdf
- https://www.graeper.de/assets/downloads/2603012-Kranausladung-Infoblatt-A4_lay.pdf (Baustellen-Checkliste)
- https://www.graeper.de/leistungen/normen-und-technikinfo
- https://konfigurator.graeper.de/ (bestehender 2D-Konfigurator; sein Umfang ist im Datenmodell abgedeckt)
