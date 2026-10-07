import type { BuildingKind, CompactStation, Config, MvField, RoofForm, RoomKind, SerieStation, Side, Trafostand, WalkInDoor, WalkInGrille } from './types';
import { compactById, serieById, trafostandById, WALKIN_CONSTR as K } from '../data/stations';
import { mvVendor, trafoRow, LV_DEVICE_SIZES } from '../data/electrical';
import { stripSlots, nextSize } from './calc';
import { uid } from './defaults';

export interface Opening {
  id: string; kind: 'door' | 'grille'; side: Side;
  c: number;                 // Mittelpunkt entlang der Wandachse (A/C: x, B/D: z)
  w: number; h: number; y0: number;
  leaves: 1 | 2;
  style: 'louver' | 'solid' | 'split' | 'v40' | 'v80';
  room: RoomKind | null;
  hinge: 'L' | 'R';
}
export interface RoomGeom { kind: RoomKind; x0: number; z0: number; x1: number; z1: number; access: Side; label: string }
export interface Item {
  kind: 'trafo' | 'ms' | 'ns' | 'fw' | 'zaehler';
  x: number; z: number; y: number;
  w: number; d: number; h: number;   // Breite (quer zur Blickrichtung), Tiefe, Höhe
  face: Side;                        // Richtung der Bedienfront
  room: number;
  clipped?: boolean;                 // passt rechnerisch nicht in den Raum
}
export interface Geometry {
  kind: BuildingKind;
  title: string; subtitle: string;
  x: number; z: number;
  hTotal: number; buried: number; hVisible: number;
  floorY: number; wallT: number; bodyTop: number;
  ventRing: number; roofT: number; roofOverhang: number;
  roofForm: RoofForm | 'zelt'; roofPitch: number;
  plinthTop: number;
  openings: Opening[];
  rooms: RoomGeom[];
  items: Item[];
  mvEntries: { side: Side; count: number };
  closedSides: Side[];
  clearL: number; clearW: number;
  station?: CompactStation; serie?: SerieStation; stand?: Trafostand;
  lvOnFront: boolean;
}

export const ROOM_LABEL: Record<RoomKind, string> = {
  trafo: 'Transformator', ms: 'Mittelspannung', ns: 'Niederspannung', fw: 'Fernwirktechnik', zaehler: 'Zähler', technik: 'Technikraum',
};

/* ---------- Abmessungen der Einbauten ---------- */

export function mvSize(c: Config) {
  const v = mvVendor(c.mv.vendorId);
  const w = c.mv.fields.reduce((s, f) => s + v.widths[f.type], 0);
  const hasLs = c.mv.fields.some((f) => f.type === 'LS' || f.type === 'UE');
  return { w, d: v.d, h: v.h + (hasLs && v.h < 150 ? 0 : 0), vendor: v };
}
export function fieldOffsets(fields: MvField[], vendorId: string) {
  const v = mvVendor(vendorId); let x = 0;
  return fields.map((f) => { const w = v.widths[f.type]; const o = { field: f, x, w }; x += w; return o; });
}
export function lvSize(c: Config, inLv: number) {
  const slots = stripSlots(c);
  const incomerA = nextSize(inLv, LV_DEVICE_SIZES);
  const incW = c.transformer.count === 0 ? 0 : incomerA <= 1000 ? 30 : incomerA <= 1600 ? 40 : incomerA <= 2500 ? 60 : 80;
  const meterW = c.lv.billingMeters * 30 + (c.lv.instrument !== 'ohne' ? 10 : 0);
  const base = slots * 10 + incW * Math.max(1, c.transformer.count) + meterW + (c.lv.compensationKvar > 0 ? 60 : 0);
  const enclosed = c.lv.design === 'gekapselt';
  const w = slots === 0 && c.transformer.count === 0 ? 0 : Math.round(enclosed ? Math.ceil((base * 1.15) / 40) * 40 : base);
  const d = enclosed ? (incomerA > 2500 ? 80 : 60) : incomerA > 2500 ? 60 : 35;
  const h = enclosed ? 200 : 170;
  return { w, d, h, slots, incomerA };
}

/* ---------- Hilfsfunktionen Wandkoordinaten ---------- */

/** Position 0..1 (von links, Blick von außen) → Koordinate entlang der Wandachse. */
export function posToCoord(side: Side, pos: number, x: number, z: number): number {
  switch (side) {
    case 'A': return -x / 2 + pos * x;
    case 'C': return x / 2 - pos * x;
    case 'B': return z / 2 - pos * z;
    case 'D': return -z / 2 + pos * z;
  }
}
export function coordToPos(side: Side, c: number, x: number, z: number): number {
  switch (side) {
    case 'A': return (c + x / 2) / x;
    case 'C': return (x / 2 - c) / x;
    case 'B': return (z / 2 - c) / z;
    case 'D': return (c + z / 2) / z;
  }
}
export const sideLength = (side: Side, x: number, z: number) => (side === 'A' || side === 'C' ? x : z);
export const SIDE_LABEL: Record<Side, string> = { A: 'Front (A)', B: 'Rechts (B)', C: 'Rückseite (C)', D: 'Links (D)' };

function placeAtAccess(room: RoomGeom, w: number, d: number, inset = 3): { x: number; z: number; face: Side; clipped: boolean } {
  const cx = (room.x0 + room.x1) / 2, cz = (room.z0 + room.z1) / 2;
  const dx = room.x1 - room.x0, dz = room.z1 - room.z0;
  switch (room.access) {
    case 'A': return { x: cx, z: room.z1 - inset - d / 2, face: 'A', clipped: w > dx + 6 || d > dz + 12 };
    case 'C': return { x: cx, z: room.z0 + inset + d / 2, face: 'C', clipped: w > dx + 6 || d > dz + 12 };
    case 'B': return { x: room.x1 - inset - d / 2, z: cz, face: 'B', clipped: w > dz + 6 || d > dx + 12 };
    case 'D': return { x: room.x0 + inset + d / 2, z: cz, face: 'D', clipped: w > dz + 6 || d > dx + 12 };
  }
}

/* ---------- Kompaktstation ---------- */

export function fwActive(c: Config, s: CompactStation): boolean {
  if (!s.fw) return false;
  if (!s.fw.optional) return true;
  return c.building.fwRoom || c.equipment.telecontrol === 'ueberwacht' || c.equipment.telecontrol === 'steuerbar';
}

function compactGeometry(c: Config, inLv: number): Geometry {
  const s = compactById(c.building.compactId);
  const roofT = 11;
  const hVisible = s.h - s.buried;
  const bodyTop = hVisible - roofT - s.ventRing;
  const fwOn = fwActive(c, s);
  const openings: Opening[] = s.doors
    .filter((dd) => !dd.optional || fwOn)
    .map((dd, i) => ({ id: `d${i}`, kind: 'door', side: dd.side, c: dd.c, w: dd.w, h: dd.h, y0: dd.y0, leaves: dd.leaves, style: dd.style, room: dd.room, hinge: 'L' as const }));
  const rooms: RoomGeom[] = s.rooms
    .filter((r) => r.kind !== 'fw' || fwOn)
    .map((r) => ({ ...r, label: ROOM_LABEL[r.kind] }));
  const sill = (kind: RoomKind) => openings.find((o) => o.room === kind)?.y0 ?? 25;
  const items: Item[] = [];
  const t = c.transformer;
  rooms.forEach((room, ri) => {
    const dx = room.x1 - room.x0, dz = room.z1 - room.z0;
    if (room.kind === 'trafo' && t.count > 0) {
      const tr = trafoRow(t.powerKva, t.type);
      const alongX = dx >= dz;
      const face: Side = alongX ? (room.access === 'C' ? 'C' : 'A') : (room.access === 'D' ? 'D' : 'B');
      items.push({ kind: 'trafo', x: (room.x0 + room.x1) / 2, z: (room.z0 + room.z1) / 2, y: Math.max(6, sill('trafo') - 14), w: tr.l, d: tr.b, h: tr.h, face, room: ri,
        clipped: s.trafoMax ? tr.l > s.trafoMax.l || tr.b > s.trafoMax.b || tr.h > s.trafoMax.h : false });
    }
    if (room.kind === 'ms' && c.mv.fields.length > 0) {
      const m = mvSize(c);
      const p = placeAtAccess(room, m.w, m.d, 5);
      items.push({ kind: 'ms', x: p.x, z: p.z, y: sill('ms'), w: m.w, d: m.d, h: m.h, face: p.face, room: ri, clipped: m.w > s.mv.box.w + 1 || m.h > s.mv.box.h + 1 });
    }
    if (room.kind === 'ns' && s.lv && t.count > 0) {
      const l = lvSize(c, inLv);
      const w = Math.max(40, Math.min(l.w, s.lv.box.w));
      const p = placeAtAccess(room, w, Math.min(l.d, s.lv.box.d), 4);
      items.push({ kind: 'ns', x: p.x, z: p.z, y: sill('ns'), w, d: Math.min(l.d, s.lv.box.d), h: Math.min(170, s.lv.box.h), face: p.face, room: ri, clipped: l.w > s.lv.box.w + 1 });
    }
    if (room.kind === 'fw' && s.fw && c.equipment.telecontrol !== 'ohne') {
      const ext = (room.access === 'A' || room.access === 'C' ? dx : dz) - 6;
      const w = Math.min(s.fw.box.w, ext);
      const p = placeAtAccess(room, w, s.fw.box.d - 10, 12);
      items.push({ kind: 'fw', x: p.x, z: p.z, y: sill('fw') + 25, w, d: s.fw.box.d - 10, h: Math.min(s.fw.box.h, 120), face: p.face, room: ri });
    }
    if (room.kind === 'zaehler' && s.meterRoom) {
      const p = placeAtAccess(room, s.meterRoom.box.w - 20, s.meterRoom.box.d - 12, 10);
      items.push({ kind: 'zaehler', x: p.x, z: p.z, y: sill('zaehler') + 15, w: s.meterRoom.box.w - 20, d: s.meterRoom.box.d - 12, h: 110, face: p.face, room: ri });
    }
  });
  // GBÜ-Typen: optionaler Fernwirkschrank wird im MS-Raum an der Seitenwand montiert
  if (fwOn && s.fw?.optional && !rooms.some((r) => r.kind === 'fw') && c.equipment.telecontrol !== 'ohne') {
    const ms = rooms.findIndex((r) => r.kind === 'ms');
    if (ms >= 0) {
      const r = rooms[ms];
      items.push({ kind: 'fw', x: r.x1 - 16, z: (r.z0 + r.z1) / 2, y: 95, w: Math.min(60, r.z1 - r.z0 - 10), d: 22, h: 100, face: 'D', room: ms });
    }
  }
  return {
    kind: 'kompakt', title: s.name, subtitle: s.title,
    x: s.x, z: s.z, hTotal: s.h, buried: s.buried, hVisible, floorY: 20, wallT: 11, bodyTop,
    ventRing: s.ventRing, roofT, roofOverhang: s.roofOverhang, roofForm: s.roof === 'zelt' ? 'zelt' : s.roof === 'sattel' ? 'sattel' : 'flach', roofPitch: 3,
    plinthTop: 32, openings, rooms, items, mvEntries: s.mvEntries, closedSides: s.closedSides,
    clearL: s.x - 22, clearW: s.z - 22, station: s, lvOnFront: false,
  };
}

/* ---------- Begehbare Station ---------- */

export function walkInDims(c: Config) {
  const w = c.building.walkIn;
  if (w.system === 'serie') {
    const s = serieById(w.serieId);
    return { x: s.l, z: s.b, rooms: s.rooms, split: s.roomSplit, roomH: 245, cellar: 78, serie: s };
  }
  return { x: w.lengthCm, z: w.widthCm, rooms: w.rooms, split: w.roomSplit, roomH: w.roomHeightCm, cellar: w.cellarCm, serie: undefined };
}
export const wallThickness = (c: Config) => (c.building.walkIn.wall === 'sandwich' ? K.wallSandwich : c.building.walkIn.wall === 'wdvs' ? K.wallWdvs : K.wall);

export function walkInRooms(c: Config): { rooms: RoomGeom[]; clearL: number; clearW: number; wallT: number } {
  const dm = walkInDims(c);
  const wallT = wallThickness(c);
  const n = dm.rooms.length;
  const clearL = dm.x - 2 * wallT - (n - 1) * K.partition;
  const clearW = dm.z - 2 * wallT;
  const sum = dm.split.reduce((a, b) => a + b, 0) || 1;
  let cx = -dm.x / 2 + wallT;
  const rooms: RoomGeom[] = dm.rooms.map((kind, i) => {
    const len = (clearL * (dm.split[i] ?? 1 / n)) / sum;
    const r: RoomGeom = { kind, x0: cx, x1: cx + len, z0: -dm.z / 2 + wallT, z1: dm.z / 2 - wallT, access: 'A', label: ROOM_LABEL[kind] };
    cx += len + K.partition;
    return r;
  });
  return { rooms, clearL, clearW, wallT };
}

const snapDoor = (min: number) => [100, 110, 125, 135, 150, 175, 200].find((w) => w >= min) ?? 200;

/** Standard-Anordnung von Türen und Lüftungsgittern passend zur Raumaufteilung. */
export function autoDoors(c: Config): { doors: WalkInDoor[]; grilles: WalkInGrille[] } {
  const dm = walkInDims(c);
  const { rooms } = walkInRooms(c);
  const t = c.transformer;
  const tr = t.count > 0 ? trafoRow(t.powerKva, t.type) : null;
  const doorH = dm.roomH >= 260 ? 230 : 220;
  const doors: WalkInDoor[] = []; const grilles: WalkInGrille[] = [];
  const insulated = c.building.walkIn.wall !== 'standard';
  rooms.forEach((r, i) => {
    const len = r.x1 - r.x0; const mid = (r.x0 + r.x1) / 2;
    if (r.kind === 'trafo') {
      const w = Math.min(snapDoor((tr?.b ?? 100) + 20), Math.max(100, Math.floor((len - 10) / 5) * 5));
      doors.push({ id: uid('d'), side: 'A', pos: coordToPos('A', mid, dm.x, dm.z), w, h: doorH, leaves: w >= 150 ? 2 : 1, vent: 'v80', hinge: 'L' });
      const big = (tr?.kva ?? 0) >= 630;
      const gw = Math.min(big ? 120 : 100, len - 20);
      // so viele Rückwandgitter wie für die Verlustwärme nötig sind und in die Raumlänge passen
      const lossKw = tr ? (tr.p0 + tr.pk) / 1000 + 0.0006 * tr.kva : 0;
      const needM2 = ((0.18 * lossKw) / Math.sqrt(1.5)) * 2.1;
      const doorFree = (w * 160 * 0.5) / 1e4;
      const perGrille = big ? (gw * 201.5 * 0.5) / 1e4 : (gw * 99.5 * 0.5) / 1e4;
      const fit = Math.max(1, Math.floor((len - 10) / (gw + 12)));
      const n = Math.min(fit, Math.max(1, Math.ceil((needM2 - doorFree) / perGrille)));
      for (let k = 0; k < n; k++) {
        const cx = r.x0 + (len * (k + 0.5)) / n;
        grilles.push({ id: uid('g'), side: 'C', pos: coordToPos('C', cx, dm.x, dm.z), w: gw, h: big ? 201.5 : 99.5, sill: big ? 12 : 60 });
      }
    } else {
      const w = r.kind === 'technik' && len > 300 ? 125 : 100;
      const cx = Math.min(r.x1 - w / 2 - 25, Math.max(r.x0 + w / 2 + 25, r.x1 - w / 2 - 40));
      const vent = insulated || r.kind === 'technik' ? 'ohne' : 'v40';
      doors.push({ id: uid('d'), side: 'A', pos: coordToPos('A', len < w + 60 ? mid : cx, dm.x, dm.z), w, h: doorH, leaves: 1, vent, hinge: i % 2 === 0 ? 'R' : 'L' });
      if (r.kind === 'technik' && c.useCase === 'gas') {
        grilles.push({ id: uid('g'), side: 'C', pos: coordToPos('C', mid, dm.x, dm.z), w: 50, h: 51.5, sill: 20 });
        grilles.push({ id: uid('g'), side: 'C', pos: coordToPos('C', mid, dm.x, dm.z), w: 50, h: 51.5, sill: 190 });
      }
    }
  });
  return { doors, grilles };
}

function walkInGeometry(c: Config, inLv: number): Geometry {
  const w = c.building.walkIn;
  const dm = walkInDims(c);
  const { rooms, clearL, clearW, wallT } = walkInRooms(c);
  const plinthTop = dm.cellar > 0 ? K.plinthAboveGround : 0;
  const buried = dm.cellar > 0 ? K.baseSlab + dm.cellar - K.plinthAboveGround : 0;
  const floorY = plinthTop + K.floorSlab;
  const bodyTop = floorY + dm.roomH;
  const roofT = K.roofSlab;
  const hVisible = bodyTop + roofT;
  const t = c.transformer;
  const tr = t.count > 0 ? trafoRow(t.powerKva, t.type) : null;
  const src = w.doorsAuto || (w.doors.length === 0 && w.grilles.length === 0) ? autoDoors(c) : { doors: w.doors, grilles: w.grilles };
  const roomAt = (side: Side, cc: number): RoomKind | null => {
    if (side === 'A' || side === 'C') return rooms.find((r) => cc >= r.x0 - 6 && cc <= r.x1 + 6)?.kind ?? null;
    return side === 'D' ? rooms[0]?.kind ?? null : rooms[rooms.length - 1]?.kind ?? null;
  };
  const openings: Opening[] = [
    ...src.doors.map((d): Opening => {
      const cc = posToCoord(d.side, d.pos, dm.x, dm.z);
      return { id: d.id, kind: 'door', side: d.side, c: cc, w: d.w, h: Math.min(d.h, dm.roomH - 8), y0: floorY, leaves: d.leaves,
        style: d.vent === 'voll' ? 'louver' : d.vent === 'v40' ? 'v40' : d.vent === 'v80' ? 'v80' : 'solid', room: roomAt(d.side, cc), hinge: d.hinge };
    }),
    ...src.grilles.map((g): Opening => {
      const cc = posToCoord(g.side, g.pos, dm.x, dm.z);
      return { id: g.id, kind: 'grille', side: g.side, c: cc, w: g.w, h: Math.min(g.h, dm.roomH - g.sill - 8), y0: floorY + g.sill, leaves: 1, style: 'louver', room: roomAt(g.side, cc), hinge: 'L' };
    }),
  ];
  const items: Item[] = [];
  let trafoIdx = 0; let lvOnFront = false;
  const hasNsRoom = rooms.some((r) => r.kind === 'ns');
  const m = mvSize(c); const l = lvSize(c, inLv);
  rooms.forEach((room, ri) => {
    const len = room.x1 - room.x0; const mid = (room.x0 + room.x1) / 2;
    if (room.kind === 'trafo' && tr && trafoIdx < t.count) {
      trafoIdx++;
      items.push({ kind: 'trafo', x: mid, z: 0, y: floorY, w: tr.l, d: tr.b, h: tr.h, face: 'B', room: ri, clipped: tr.b + 30 > len || tr.l + 40 > clearW });
    }
    if (room.kind === 'ms') {
      let cursor = room.x0 + 12;
      if (c.mv.fields.length > 0) {
        items.push({ kind: 'ms', x: cursor + m.w / 2, z: room.z0 + 8 + m.d / 2, y: floorY, w: m.w, d: m.d, h: m.h, face: 'A', room: ri, clipped: m.w > len - 12 });
        cursor += m.w + 25;
      }
      if (!hasNsRoom && l.w > 0 && t.count > 0) {
        if (cursor + l.w <= room.x1 - 8) {
          items.push({ kind: 'ns', x: cursor + l.w / 2, z: room.z0 + 4 + l.d / 2, y: floorY, w: l.w, d: l.d, h: l.h, face: 'A', room: ri });
        } else {
          lvOnFront = true;
          const doorW = openings.filter((o) => o.kind === 'door' && o.side === 'A' && o.room === 'ms').reduce((s, o) => s + o.w + 30, 0);
          items.push({ kind: 'ns', x: room.x0 + 12 + l.w / 2, z: room.z1 - 4 - l.d / 2, y: floorY, w: l.w, d: l.d, h: l.h, face: 'C', room: ri, clipped: l.w > len - 12 - doorW });
        }
      }
      if (c.equipment.telecontrol !== 'ohne') {
        items.push({ kind: 'fw', x: room.x1 - 14, z: room.z0 + 60, y: floorY + 60, w: 80, d: 25, h: 120, face: 'D', room: ri });
      }
      if (c.lv.billingMeters > 0 || c.mv.fields.some((f) => f.type === 'M')) {
        items.push({ kind: 'zaehler', x: room.x1 - 14, z: room.z0 + 60 + 100, y: floorY + 60, w: 80, d: 25, h: 110, face: 'D', room: ri, clipped: clearW < 250 });
      }
    }
    if (room.kind === 'ns' && l.w > 0 && t.count > 0) {
      items.push({ kind: 'ns', x: room.x0 + 10 + l.w / 2, z: room.z0 + 4 + l.d / 2, y: floorY, w: l.w, d: l.d, h: l.h, face: 'A', room: ri, clipped: l.w > len - 10 });
    }
  });
  const sysLabel = w.system === 'serie' ? `${dm.serie!.name} Typ ${dm.serie!.typ}` : w.system === 'professional' ? 'System Professional' : 'System Individual';
  return {
    kind: 'begehbar', title: sysLabel, subtitle: `Begehbare Station ${(dm.x / 100).toFixed(2).replace('.', ',')} × ${(dm.z / 100).toFixed(2).replace('.', ',')} m`,
    x: dm.x, z: dm.z, hTotal: hVisible + buried, buried, hVisible, floorY, wallT, bodyTop,
    ventRing: 0, roofT, roofOverhang: K.roofOverhang, roofForm: w.system === 'serie' ? 'flach' : w.roofForm, roofPitch: w.roofPitch,
    plinthTop, openings, rooms, items, mvEntries: { side: 'C', count: c.penetrations.mvCount }, closedSides: (['A', 'B', 'C', 'D'] as Side[]).filter((s) => !openings.some((o) => o.side === s)),
    clearL, clearW, serie: dm.serie, lvOnFront,
  };
}

function trafostandGeometry(c: Config): Geometry {
  const s = trafostandById(c.building.trafostandId);
  return {
    kind: 'trafostand', title: s.name, subtitle: `Auffangvolumen ${s.volumeM3} m³`,
    x: s.l, z: s.b, hTotal: s.tubHeight, buried: s.tubHeight - 15, hVisible: 15, floorY: 0, wallT: 20, bodyTop: 15,
    ventRing: 0, roofT: 0, roofOverhang: 0, roofForm: 'flach', roofPitch: 0, plinthTop: 15,
    openings: [], rooms: [], items: [], mvEntries: { side: 'A', count: 0 }, closedSides: [], clearL: s.l - 40, clearW: s.b - 40, stand: s, lvOnFront: false,
  };
}

export function buildGeometry(c: Config, inLv: number): Geometry {
  if (c.building.kind === 'trafostand') return trafostandGeometry(c);
  return c.building.kind === 'kompakt' ? compactGeometry(c, inLv) : walkInGeometry(c, inLv);
}
