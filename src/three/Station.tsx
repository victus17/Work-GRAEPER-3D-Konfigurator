import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import type { Config, Side } from '../domain/types';
import type { Derived } from '../domain/engine';
import type { Geometry, Opening } from '../domain/layout';
import { extrudeAlongX, hipRoof, wallGeometry, type Hole } from './wall';
import { useStationMaterials, doorColor, type StationMaterials } from './materials';
import { EquipmentItem, WarnSign } from './Equipment';
import { louverMap, repeated, textTexture, gratingMap, boxWorldUV, plasterBump } from './textures';
import { partitions, roomFloorY, sideTransform, toU } from '../lib/geom';
import { nf } from '../lib/format';

const SIDES: Side[] = ['A', 'B', 'C', 'D'];

export interface ViewOpts { doorsOpen: boolean; xray: boolean; roofOff: boolean; showDims: boolean; showPerson: boolean; scenery: 'studio' | 'standort' | 'baugrube' }

/* ---------- Beschriftung (Sprite, immer lesbar) ---------- */
export function Label3D({ text, position, height = 16, bg = '#ffffff', fg = '#17212b', border }: { text: string; position: [number, number, number]; height?: number; bg?: string; fg?: string; border?: string }) {
  const { tex, aspect } = useMemo(() => textTexture(text, { bg, fg, border }), [text, bg, fg, border]);
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial map={tex} depthTest={false} transparent toneMapped={false} />
    </sprite>
  );
}

/* ---------- Türen und Gitter ---------- */
function useLouverMaterial(c: Config, w: number, h: number) {
  const dc = doorColor(c);
  const mat = useMemo(() => {
    const map = repeated(louverMap(), Math.max(1, w / 120), h / 42);
    return new THREE.MeshStandardMaterial({ color: dc.color, metalness: dc.metalness * 0.8, roughness: dc.roughness + 0.1, map, bumpMap: map, bumpScale: 2.2 });
  }, [dc.color, dc.metalness, dc.roughness, w, h]);
  useEffect(() => () => { mat.map?.dispose(); mat.dispose(); }, [mat]);
  return mat;
}

function Leaf({ c, m, w, h, kind, t, hingeLeft, open, sign }: { c: Config; m: StationMaterials; w: number; h: number; kind: 'solid' | 'louver' | 'v40' | 'v80'; t: number; hingeLeft: boolean; open: boolean; sign: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const louver = useLouverMaterial(c, w, kind === 'louver' ? h : kind === 'v80' ? Math.min(80, h * 0.38) : Math.min(40, h * 0.3));
  const target = open ? (hingeLeft ? -1 : 1) * THREE.MathUtils.degToRad(102) : 0;
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, target, 6, dt); });
  const dir = hingeLeft ? 1 : -1;
  const faceMats = kind === 'louver' ? [m.door, m.door, m.door, m.door, louver, m.door] : m.door;
  const band = kind === 'v80' ? Math.min(80, h * 0.38) : Math.min(40, h * 0.3);
  return (
    <group ref={ref} position={[hingeLeft ? -0 : 0, 0, t - 1]}>
      <group position={[(dir * w) / 2, h / 2, -1.5]}>
        <mesh material={faceMats} castShadow receiveShadow><boxGeometry args={[w - 0.6, h, 3]} /></mesh>
        {(kind === 'v40' || kind === 'v80') && [h / 2 - band / 2 - 6, -h / 2 + band / 2 + 6].map((y) => (
          <mesh key={y} position={[0, y, 1.55]} material={louver}><planeGeometry args={[w - 12, band]} /></mesh>
        ))}
        <mesh position={[(-dir * w) / 2 + dir * 7, 0, 2.2]} material={m.dark}><boxGeometry args={[2.2, 16, 2]} /></mesh>
        {sign && <group position={[0, h / 2 - 22, 1.6]}><WarnSign size={15} /></group>}
      </group>
    </group>
  );
}

function OpeningMesh({ o, c, m, t, open }: { o: Opening; c: Config; m: StationMaterials; t: number; open: boolean }) {
  const u = toU(o.side, o.c);
  const fw = 3.5;
  const frame = (
    <group position={[0, 0, t - 2]}>
      <mesh position={[-o.w / 2 + fw / 2, o.h / 2, 0]} material={m.frame}><boxGeometry args={[fw, o.h, 4]} /></mesh>
      <mesh position={[o.w / 2 - fw / 2, o.h / 2, 0]} material={m.frame}><boxGeometry args={[fw, o.h, 4]} /></mesh>
      <mesh position={[0, o.h - fw / 2, 0]} material={m.frame}><boxGeometry args={[o.w, fw, 4]} /></mesh>
      {o.kind === 'grille' && <mesh position={[0, fw / 2, 0]} material={m.frame}><boxGeometry args={[o.w, fw, 4]} /></mesh>}
    </group>
  );
  if (o.kind === 'grille') return <group position={[u, o.y0, 0]}>{frame}<GrilleFill c={c} w={o.w - 2 * fw} h={o.h - 2 * fw} t={t} /></group>;
  const iw = o.w - 2 * fw, ih = o.h - fw;
  const sign = o.room === 'trafo' || o.room === 'ms';
  const kindOf = (i: number): 'solid' | 'louver' | 'v40' | 'v80' =>
    o.style === 'split' ? (i === 0 ? 'solid' : 'louver') : o.style === 'louver' ? 'louver' : o.style === 'v40' ? 'v40' : o.style === 'v80' ? 'v80' : 'solid';
  return (
    <group position={[u, o.y0, 0]}>
      {frame}
      {o.leaves === 2 ? (
        <>
          <group position={[-iw / 2, 0, 0]}><Leaf c={c} m={m} w={iw / 2} h={ih} kind={kindOf(0)} t={t} hingeLeft open={open} sign={sign} /></group>
          <group position={[iw / 2, 0, 0]}><Leaf c={c} m={m} w={iw / 2} h={ih} kind={kindOf(1)} t={t} hingeLeft={false} open={open} sign={false} /></group>
        </>
      ) : (
        <group position={[(o.hinge === 'L' ? -1 : 1) * (iw / 2), 0, 0]}><Leaf c={c} m={m} w={iw} h={ih} kind={kindOf(0)} t={t} hingeLeft={o.hinge === 'L'} open={open} sign={sign} /></group>
      )}
    </group>
  );
}
function GrilleFill({ c, w, h, t }: { c: Config; w: number; h: number; t: number }) {
  const mat = useLouverMaterial(c, w, h);
  return <mesh position={[0, 3.5 + h / 2, t - 2.5]} material={mat} castShadow><boxGeometry args={[w, h, 2]} /></mesh>;
}

/* ---------- Außenwände ---------- */
function Wall({ side, g, c, m, opts }: { side: Side; g: Geometry; c: Config; m: StationMaterials; opts: ViewOpts }) {
  const t = g.wallT;
  const tr = sideTransform(side, g.x, g.z, t);
  const ops = g.openings.filter((o) => o.side === side);
  const holes: Hole[] = ops.map((o) => { const u = toU(side, o.c); return { u0: u - o.w / 2, u1: u + o.w / 2, v0: o.y0, v1: o.y0 + o.h }; });
  const plinth = g.kind === 'kompakt' ? g.plinthTop : g.floorY;
  /* JSON kodiert den aktuellen Wert als Text; Referenzen zwischen Objekten bleiben dabei nicht erhalten. */ const key = JSON.stringify([holes, tr.len, g.buried, g.bodyTop, t, plinth, m.tile]);
  const geo = useMemo(() => wallGeometry(tr.len, -g.buried, g.bodyTop, t, holes, plinth, m.tile, side === 'A' || side === 'C'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]);
  useEffect(() => () => geo.dispose(), [geo]);
  const entries = useMemo(() => {
    const p = c.penetrations;
    const list: { u: number; mv: boolean }[] = [];
    const mvSide = g.mvEntries.side;
    const nsSide = g.openings.find((o) => o.room === 'ns')?.side ?? (g.kind === 'kompakt' ? mvSide : 'C');
    const put = (n: number, mv: boolean) => { const pitch = Math.min(34, (tr.len - 60) / Math.max(1, n)); for (let i = 0; i < n; i++) list.push({ u: (i - (n - 1) / 2) * pitch + (mv ? -0 : 0), mv }); };
    if (mvSide === side && nsSide === side) { put(p.mvCount + p.lvCount, true); list.forEach((e, i) => (e.mv = i < p.mvCount)); }
    else { if (mvSide === side) put(p.mvCount, true); if (nsSide === side) put(p.lvCount, false); }
    return list;
  }, [c.penetrations, g, side, tr.len]);
  const entryY = g.kind === 'kompakt' ? -g.buried + 24 : -g.buried + 12 + Math.max(25, (g.buried - 12) / 2);
  return (
    <group position={tr.pos} rotation={[0, tr.rotY, 0]}>
      <mesh geometry={geo} material={m.wall} castShadow receiveShadow />
      {!opts.xray && ops.map((o) => <OpeningMesh key={o.id} o={o} c={c} m={m} t={t} open={opts.doorsOpen} />)}
      {opts.scenery === 'baugrube' && entries.map((e, i) => (
        <group key={i} position={[e.u, entryY, t + 0.4]}>
          <mesh><boxGeometry args={[22, 22, 0.8]} /><meshStandardMaterial color="#c8321c" roughness={0.6} /></mesh>
          <mesh position={[0, 0, 0.5]}><circleGeometry args={[8, 24]} /><meshStandardMaterial color={e.mv ? '#2b2f33' : '#4a5057'} /></mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------- Dach ---------- */
function Roof({ g, c, m }: { g: Geometry; c: Config; m: StationMaterials }) {
  const o = g.roofOverhang;
  const W = g.x + 2 * o, D = g.z + 2 * o;
  const y0 = g.bodyTop + g.ventRing;
  const form = g.roofForm;
  const pitchRad = THREE.MathUtils.degToRad(Math.max(3, g.roofPitch));
  const extra = useMemo(() => {
    if (g.kind === 'kompakt') {
      if (form === 'zelt') return hipRoof(W, D, 10);
      if (form === 'sattel') { const s = new THREE.Shape(); s.moveTo(-D / 2, 0); s.lineTo(D / 2, 0); s.lineTo(0, 4); s.closePath(); return extrudeAlongX(s, W); }
      return null;
    }
    if (form === 'sattel') { const h = (D / 2) * Math.tan(pitchRad); const s = new THREE.Shape(); s.moveTo(-D / 2, 0); s.lineTo(D / 2, 0); s.lineTo(0, h); s.closePath(); return extrudeAlongX(s, W); }
    if (form === 'pult') { const h = D * Math.tan(pitchRad); const s = new THREE.Shape(); s.moveTo(-D / 2, 0); s.lineTo(D / 2, 0); s.lineTo(D / 2, h); s.closePath(); return extrudeAlongX(s, W); }
    if (form === 'walm') return hipRoof(W, D, (Math.min(W, D) / 2) * Math.tan(pitchRad));
    if (form === 'tonne') {
      const sag = D * 0.14, r = (D * D / 4 + sag * sag) / (2 * sag), th = Math.asin((r - sag) / r);
      const s = new THREE.Shape(); s.moveTo(-D / 2, 0); s.lineTo(D / 2, 0); s.absarc(0, sag - r, r, th, Math.PI - th, false); s.closePath();
      return extrudeAlongX(s, W);
    }
    return null;
  }, [g.kind, form, W, D, pitchRad]);
  useEffect(() => () => extra?.dispose(), [extra]);
  const slab = useMemo(() => boxWorldUV(W, g.roofT, D, 100), [W, D, g.roofT]);
  const flatWalkIn = g.kind === 'begehbar' && form === 'flach';
  return (
    <group position={[0, y0, 0]}>
      <mesh geometry={slab} material={m.roof} position={[0, g.roofT / 2, 0]} castShadow receiveShadow />
      {extra && <mesh geometry={extra} material={m.roof} position={[0, g.roofT, 0]} castShadow receiveShadow />}
      {flatWalkIn && [[0, D / 2 - 3, W, 6], [0, -D / 2 + 3, W, 6]].map(([x, z, w, d], i) => <mesh key={i} material={m.roofEdge} position={[x, g.roofT + 4, z]} castShadow><boxGeometry args={[w, 8, d]} /></mesh>)}
      {flatWalkIn && [[W / 2 - 3, 0], [-W / 2 + 3, 0]].map(([x, z], i) => <mesh key={`s${i}`} material={m.roofEdge} position={[x, g.roofT + 4, z]} castShadow><boxGeometry args={[6, 8, D]} /></mesh>)}
      {c.building.kind === 'begehbar' && c.building.walkIn.roofHood && (
        <mesh position={[g.rooms.find((r) => r.kind === 'trafo') ? (g.rooms.find((r) => r.kind === 'trafo')!.x0 + g.rooms.find((r) => r.kind === 'trafo')!.x1) / 2 : 0, g.roofT + 14, 0]} material={m.frame} castShadow><boxGeometry args={[80, 28, 80]} /></mesh>
      )}
      {c.penetrations.antenna && (
        <group position={[g.x / 2 - 25, g.roofT + (extra && g.kind === 'kompakt' ? 4 : 0), -g.z / 2 + 25]}>
          <mesh position={[0, 35, 0]} castShadow><cylinderGeometry args={[1, 1.4, 70, 10]} /><meshStandardMaterial color="#e9ebec" /></mesh>
          <mesh position={[0, 4, 0]}><cylinderGeometry args={[5, 5, 8, 16]} /><meshStandardMaterial color="#5d6266" /></mesh>
        </group>
      )}
    </group>
  );
}

function VentRing({ g, m }: { g: Geometry; m: StationMaterials }) {
  if (!g.ventRing) return null;
  const mats = [m.ventRing, m.ventRing, m.dark, m.dark, m.ventRing, m.ventRing];
  return (
    <group position={[0, g.bodyTop + g.ventRing / 2, 0]}>
      <mesh material={mats} castShadow><boxGeometry args={[g.x - 6, g.ventRing, g.z - 6]} /></mesh>
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => <mesh key={`${sx}${sz}`} material={m.frame} position={[(sx * (g.x - 6)) / 2, 0, (sz * (g.z - 6)) / 2]}><boxGeometry args={[7, g.ventRing, 7]} /></mesh>)}
    </group>
  );
}

/* ---------- Innenraum ---------- */
function Interior({ g, c, d, m, opts }: { g: Geometry; c: Config; d: Derived; m: StationMaterials; opts: ViewOpts }) {
  const parts = useMemo(() => partitions(g.rooms), [g.rooms]);
  const showLabels = opts.roofOff || opts.xray;
  const bottom = g.kind === 'kompakt' ? -g.buried + 10 : -g.buried + 12;
  return (
    <group>
      {g.kind === 'begehbar' ? (
        <>
          <mesh material={m.concrete} position={[0, -g.buried + 6, 0]} receiveShadow><boxGeometry args={[g.x - 2, 12, g.z - 2]} /></mesh>
          <mesh material={m.floor} position={[0, g.floorY - 6, 0]} receiveShadow><boxGeometry args={[g.x - 2 * g.wallT, 12, g.z - 2 * g.wallT]} /></mesh>
        </>
      ) : g.rooms.map((r, i) => {
        const y = roomFloorY(g, i);
        return <mesh key={i} material={m.interior} position={[(r.x0 + r.x1) / 2, y - 3, (r.z0 + r.z1) / 2]} receiveShadow><boxGeometry args={[r.x1 - r.x0, 6, r.z1 - r.z0]} /></mesh>;
      })}
      {parts.map((p, i) => (
        <mesh key={i} material={m.interior} position={[(p.x0 + p.x1) / 2, (bottom + g.bodyTop) / 2, (p.z0 + p.z1) / 2]} castShadow receiveShadow>
          <boxGeometry args={[p.x1 - p.x0, g.bodyTop - bottom, p.z1 - p.z0]} />
        </mesh>
      ))}
      {g.items.map((it, i) => <EquipmentItem key={`${it.kind}${i}`} it={it} c={c} inLv={d.elec.inLv} />)}
      {showLabels && g.rooms.map((r, i) => <Label3D key={i} text={r.label} position={[(r.x0 + r.x1) / 2, g.bodyTop + 30, (r.z0 + r.z1) / 2]} height={14} bg="#0063b0" fg="#ffffff" />)}
    </group>
  );
}

/* ---------- Maßketten und Größenvergleich ---------- */
function DimLine({ a, b, label, offset }: { a: [number, number, number]; b: [number, number, number]; label: string; offset: [number, number, number] }) {
  const tick = (p: [number, number, number]): [number, number, number][] => [[p[0] - offset[0] * 0.25, p[1] - offset[1] * 0.25, p[2] - offset[2] * 0.25], [p[0] + offset[0] * 0.25, p[1] + offset[1] * 0.25, p[2] + offset[2] * 0.25]];
  const mid: [number, number, number] = [(a[0] + b[0]) / 2 + offset[0] * 0.5, (a[1] + b[1]) / 2 + offset[1] * 0.5 + 8, (a[2] + b[2]) / 2 + offset[2] * 0.5];
  return (
    <group>
      <Line points={[a, b]} color="#0f3d81" lineWidth={1.6} depthTest={false} renderOrder={9} />
      <Line points={tick(a)} color="#0f3d81" lineWidth={1.6} depthTest={false} renderOrder={9} />
      <Line points={tick(b)} color="#0f3d81" lineWidth={1.6} depthTest={false} renderOrder={9} />
      <Label3D text={label} position={mid} height={15} border="#0f3d81" />
    </group>
  );
}
function Dimensions({ g }: { g: Geometry }) {
  const off = 45, y = 2, top = g.hVisible + (g.roofForm !== 'flach' && g.kind === 'begehbar' ? 0 : 0);
  return (
    <group>
      <DimLine a={[-g.x / 2, y, g.z / 2 + off]} b={[g.x / 2, y, g.z / 2 + off]} offset={[0, 0, 20]} label={`${nf(g.x / 100, 2)} m`} />
      <DimLine a={[g.x / 2 + off, y, g.z / 2]} b={[g.x / 2 + off, y, -g.z / 2]} offset={[20, 0, 0]} label={`${nf(g.z / 100, 2)} m`} />
      {g.kind !== 'trafostand' && <DimLine a={[g.x / 2 + off, 0, g.z / 2 + off]} b={[g.x / 2 + off, top, g.z / 2 + off]} offset={[14, 0, 14]} label={`${nf(top / 100, 2)} m`} />}
    </group>
  );
}
function Person({ g }: { g: Geometry }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#5f7d99', roughness: 0.7 }), []);
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9b49a', roughness: 0.7 }), []);
  return (
    <group position={[-g.x / 2 - 85, 0, g.z / 2 + 70]} rotation={[0, Math.PI / 5, 0]}>
      {[-11, 11].map((x) => <mesh key={x} material={mat} position={[x, 44, 0]} castShadow><capsuleGeometry args={[7, 72, 6, 12]} /></mesh>)}
      <mesh material={mat} position={[0, 120, 0]} castShadow><capsuleGeometry args={[19, 42, 8, 16]} /></mesh>
      {[-27, 27].map((x) => <mesh key={x} material={mat} position={[x, 112, 0]} rotation={[0, 0, x > 0 ? 0.08 : -0.08]} castShadow><capsuleGeometry args={[5.5, 56, 6, 10]} /></mesh>)}
      <mesh material={skin} position={[0, 166, 0]} castShadow><sphereGeometry args={[11.5, 20, 16]} /></mesh>
      <mesh position={[0, 173, 0]}><sphereGeometry args={[12.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.2]} /><meshStandardMaterial color="#f2c230" roughness={0.5} /></mesh>
    </group>
  );
}

/* ---------- Trafostand ---------- */
function TrafoStand({ g }: { g: Geometry }) {
  const s = g.stand!;
  const H = s.tubHeight, top = 15, bot = top - H, wt = 25;
  const carrier = Math.min(420, s.l * 0.36);
  const basin = (s.l - carrier) / 2;
  const conc = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a9a69f', roughness: 0.95, bumpMap: plasterBump('beton'), bumpScale: 0.8 }), []);
  const grate = useMemo(() => { const t = repeated(gratingMap(), basin / 40, s.b / 40); return new THREE.MeshStandardMaterial({ map: t, metalness: 0.6, roughness: 0.5, transparent: true, opacity: 0.92 }); }, [basin, s.b]);
  return (
    <group>
      <mesh material={conc} position={[0, bot + 10, 0]} receiveShadow><boxGeometry args={[s.l, 20, s.b]} /></mesh>
      {[[0, s.b / 2 - wt / 2, s.l, wt], [0, -s.b / 2 + wt / 2, s.l, wt]].map(([x, z, w, d], i) => <mesh key={i} material={conc} position={[x, (bot + top) / 2, z]} castShadow receiveShadow><boxGeometry args={[w, H, d]} /></mesh>)}
      {[-s.l / 2 + wt / 2, s.l / 2 - wt / 2, -carrier / 2, carrier / 2].map((x, i) => <mesh key={`w${i}`} material={conc} position={[x, (bot + top) / 2, 0]} castShadow receiveShadow><boxGeometry args={[wt, H, s.b - 2 * wt]} /></mesh>)}
      <mesh material={conc} position={[0, (bot + top) / 2, 0]} castShadow receiveShadow><boxGeometry args={[carrier - wt, H, s.b - 2 * wt]} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[(k * carrier) / 4, top + 3, 0]} castShadow><boxGeometry args={[14, 6, s.b - 40]} /><meshStandardMaterial color="#4a4f54" metalness={0.6} roughness={0.5} /></mesh>)}
      {[-1, 1].map((k) => (
        <group key={`b${k}`} position={[k * (carrier / 2 + basin / 2), 0, 0]}>
          <mesh position={[0, bot + 21, 0]}><boxGeometry args={[basin - wt, 1, s.b - 2 * wt]} /><meshStandardMaterial color="#2a2c2e" /></mesh>
          <mesh material={grate} position={[0, top - 1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[basin - wt, s.b - 2 * wt]} /></mesh>
        </group>
      ))}
      <mesh position={[0, top + 6 + 210, 0]}><boxGeometry args={[Math.min(carrier * 0.95, 400), 420, Math.min(s.b * 0.62, 400)]} /><meshStandardMaterial color="#7f8a86" transparent opacity={0.22} depthWrite={false} /></mesh>
      <Label3D text="Freilufttransformator (nicht im Lieferumfang)" position={[0, top + 460, 0]} height={22} />
      <Label3D text={`Auffangvolumen ${s.volumeM3} m³`} position={[s.l / 2 - basin / 2, top + 40, 0]} height={18} bg="#0063b0" fg="#ffffff" />
    </group>
  );
}

/* ---------- Station gesamt ---------- */
export function Station({ c, d, opts }: { c: Config; d: Derived; opts: ViewOpts }) {
  const g = d.geometry;
  const m = useStationMaterials(c, opts.xray);
  if (g.kind === 'trafostand') return <group><TrafoStand g={g} />{opts.showDims && <Dimensions g={g} />}{opts.showPerson && <Person g={g} />}</group>;
  return (
    <group>
      {SIDES.map((s) => <Wall key={s} side={s} g={g} c={c} m={m} opts={opts} />)}
      <Interior g={g} c={c} d={d} m={m} opts={opts} />
      {!opts.roofOff && <><VentRing g={g} m={m} /><Roof g={g} c={c} m={m} /></>}
      {c.building.kind === 'begehbar' && c.building.walkIn.gutter && !opts.xray && (
        <mesh position={[-g.x / 2 - 5, g.bodyTop / 2, g.z / 2 - 14]} castShadow><cylinderGeometry args={[4.5, 4.5, g.bodyTop, 14]} /><meshStandardMaterial color="#9aa0a4" metalness={0.6} roughness={0.4} /></mesh>
      )}
      {opts.showDims && <Dimensions g={g} />}
      {opts.showPerson && <Person g={g} />}
    </group>
  );
}
