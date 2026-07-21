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

## Hinweise
