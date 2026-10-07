import type { Side } from '../domain/types';
import type { Geometry, Item, RoomGeom } from '../domain/layout';

/** Trennwände zwischen benachbarten Räumen (aus den Lücken der Raumrechtecke abgeleitet). */
export interface Partition { x0: number; x1: number; z0: number; z1: number }
export function partitions(rooms: RoomGeom[]): Partition[] {
  const out: Partition[] = [];
  for (let i = 0; i < rooms.length; i++) for (let j = 0; j < rooms.length; j++) {
    if (i === j) continue;
    const a = rooms[i], b = rooms[j];
    const gx = b.x0 - a.x1, gz = b.z0 - a.z1;
    const oz0 = Math.max(a.z0, b.z0), oz1 = Math.min(a.z1, b.z1);
    const ox0 = Math.max(a.x0, b.x0), ox1 = Math.min(a.x1, b.x1);
    if (gx >= 2 && gx <= 26 && oz1 - oz0 > 10) out.push({ x0: a.x1, x1: b.x0, z0: oz0, z1: oz1 });
    if (gz >= 2 && gz <= 26 && ox1 - ox0 > 10) out.push({ x0: ox0, x1: ox1, z0: a.z1, z1: b.z0 });
  }
  return out;
}

/** Lage einer Außenwand: lokales u = entlang der Wand (von außen gesehen von links nach rechts), lokales z = 0 innen … t außen. */
export function sideTransform(side: Side, X: number, Z: number, t: number): { pos: [number, number, number]; rotY: number; len: number } {
  switch (side) {
    case 'A': return { pos: [0, 0, Z / 2 - t], rotY: 0, len: X };
    case 'C': return { pos: [0, 0, -Z / 2 + t], rotY: Math.PI, len: X };
    case 'B': return { pos: [X / 2 - t, 0, 0], rotY: Math.PI / 2, len: Z - 2 * t };
    case 'D': return { pos: [-X / 2 + t, 0, 0], rotY: -Math.PI / 2, len: Z - 2 * t };
  }
}
/** Wandkoordinate (x bzw. z) → lokales u der Wandansicht von außen. */
export const toU = (side: Side, c: number) => (side === 'A' || side === 'D' ? c : -c);

export const faceRotation = (face: Side) => (face === 'A' ? 0 : face === 'B' ? Math.PI / 2 : face === 'C' ? Math.PI : -Math.PI / 2);
/** Grundfläche eines Einbaus in Stationskoordinaten. */
export function footprint(it: Item): { x0: number; x1: number; z0: number; z1: number } {
  const alongX = it.face === 'A' || it.face === 'C';
  const wx = alongX ? it.w : it.d, wz = alongX ? it.d : it.w;
  return { x0: it.x - wx / 2, x1: it.x + wx / 2, z0: it.z - wz / 2, z1: it.z + wz / 2 };
}

/** Bodenhöhe je Raum (Kompaktstation: Höhe der Einbauten bzw. Türschwelle). */
export function roomFloorY(g: Geometry, roomIndex: number): number {
  if (g.kind === 'begehbar') return g.floorY;
  const items = g.items.filter((i) => i.room === roomIndex);
  if (items.length) return Math.min(...items.map((i) => (i.kind === 'fw' || i.kind === 'zaehler' ? i.y - 25 : i.y)));
  const r = g.rooms[roomIndex];
  const o = g.openings.find((op) => op.room === r.kind);
  return o ? o.y0 : g.floorY;
}
