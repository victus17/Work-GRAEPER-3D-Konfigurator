# Code-Orientierung · GRAEPER-3D-Konfigurator

Ausgewählte Dateien und Hinweise zum bestehenden Quellcode.

Diese Dokumentationsrunde wurde am 07.10.2026 erstellt. Die Commit-Autorendaten wurden auf Wunsch rückdatiert; sie belegen keine an diesen früheren Tagen ausgeführte Arbeit.

## Dateien
- `src/lib/geom.ts` — benannte Einheiten: `Partition`, `partitions`, `sideTransform`, `toU`, `faceRotation`, `footprint`, `roomFloorY`.
- `src/ui/kit.tsx` — benannte Einheiten: `cx`, `Info`, `Section`, `Field`, `LineField`, `Opt`, `Seg`, `Cards`.
- `src/steps/common.tsx` — benannte Einheiten: `StepFindings`.
- `src/domain/types.ts` — benannte Einheiten: `UseCaseId`, `Side`, `RoomKind`, `TrafoType`, `TransformerCfg`, `MvInsulation`, `MvFieldType`, `MvProtection`.
- `src/domain/engine.ts` — benannte Einheiten: `Weights`, `calcWeights`, `Excavation`, `calcExcavation`, `Logistics`, `calcLogistics`, `check`, `applyFix`.
- `src/views/PrintSheet.tsx` — benannte Einheiten: `PrintSheet`.
- `index.html` — HTML-Struktur und Einbindung der Oberfläche.
- `src/three/Station.tsx` — benannte Einheiten: `ViewOpts`, `Label3D`, `useLouverMaterial`, `Leaf`, `OpeningMesh`, `GrilleFill`, `Wall`, `Roof`.
- `src/steps/StepNs.tsx` — benannte Einheiten: `StepNs`.
- `src/steps/StepMs.tsx` — benannte Einheiten: `StepMs`.
- `src/three/Equipment.tsx` — benannte Einheiten: `B`, `Label`, `Transformer`, `Switchgear`, `LowVoltage`, `Cabinet`, `EquipmentItem`, `WarnSign`.
- `src/steps/StepHuelle.tsx` — benannte Einheiten: `DoorEditor`, `StepHuelle`.
- `src/domain/layout.ts` — benannte Einheiten: `Opening`, `RoomGeom`, `Item`, `Geometry`, `ROOM_LABEL`, `mvSize`, `fieldOffsets`, `lvSize`.
- `src/data/usecases.ts` — benannte Einheiten: `UseCase`, `USE_CASES`, `useCase`, `STEP_META`.
- `src/data/options.ts` — benannte Einheiten: `SURFACES`, `CLINKER_TONES`, `DESIGN_PRESETS`, `WALL_BUILDS`, `ROOF_FORMS`, `FLOOR_BUILDS`, `FLOOR_FINISHES`, `DOOR_SIZES`.
- `src/steps/StepStandort.tsx` — benannte Einheiten: `StepStandort`.
- `src/steps/StepStation.tsx` — benannte Einheiten: `CompactList`, `CompactDetails`, `WalkIn`, `StepStation`.
- `vite.config.ts` — Quellmodul; Details stehen direkt in der Datei.
- `src/domain/calc.ts` — benannte Einheiten: `ElecCalc`, `stripSlots`, `feederCount`, `nextSize`, `calcElectrical`, `DemandResult`, `calcDemand`, `NH_SUMMARY`.
- `src/data/glossary.ts` — benannte Einheiten: `GLOSSARY`.
- `src/data/electrical.ts` — benannte Einheiten: `KVA_STEPS`, `TrafoRow`, `TRAFO_OIL`, `TRAFO_DRY`, `trafoRow`, `TRAFO_TYPES`, `HH_FUSE`, `HH_LIMIT_KVA`.
- `src/styles/app.css` — Styles und Darstellungsregeln.

## Hinweise

Die Dateiübersicht bildet den vorhandenen Repository-Stand ab; sie ist keine Liste abgeschlossener Features.

Die inline ergänzten Kommentare erläutern vorhandenes Verhalten. Sie ändern keine Funktionen oder Algorithmen.
