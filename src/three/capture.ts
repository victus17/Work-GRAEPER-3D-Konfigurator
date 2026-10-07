/** Bildschirmfoto der 3D-Ansicht (für Datenblatt und Download). Getrennt von Scene.tsx, damit three.js erst bei Bedarf geladen wird. */
export const capture: { fn: null | (() => string) } = { fn: null };
