import * as THREE from 'three';
import type {} from '@react-three/fiber';
import { useMemo } from 'react';
import type { Config } from '../domain/types';
import type { Item } from '../domain/layout';
import { fieldOffsets, lvSize } from '../domain/layout';
import { MV_FIELD_TYPES, mvVendor } from '../data/electrical';
import { textTexture, warningSign } from './textures';
import { faceRotation } from '../lib/geom';

/* Alle Maße in cm. Jedes Modell steht mit Unterkante auf y = 0, Bedienfront zeigt nach +z, Breite entlang x. */

const M = {
  tank: new THREE.MeshStandardMaterial({ color: '#7f8a86', metalness: 0.45, roughness: 0.5 }),
  fin: new THREE.MeshStandardMaterial({ color: '#86918d', metalness: 0.45, roughness: 0.5 }),
  porcelain: new THREE.MeshStandardMaterial({ color: '#d9d6cf', roughness: 0.35 }),
  copper: new THREE.MeshStandardMaterial({ color: '#c47a45', metalness: 0.85, roughness: 0.3 }),
  steel: new THREE.MeshStandardMaterial({ color: '#5d6266', metalness: 0.6, roughness: 0.45 }),
  core: new THREE.MeshStandardMaterial({ color: '#34393e', metalness: 0.5, roughness: 0.5 }),
  coil: new THREE.MeshStandardMaterial({ color: '#b8bdc0', roughness: 0.42 }),
  cabinet: new THREE.MeshStandardMaterial({ color: '#d5d7d3', roughness: 0.55, metalness: 0.15 }),
  cabinetDark: new THREE.MeshStandardMaterial({ color: '#c3c6c2', roughness: 0.6, metalness: 0.15 }),
  black: new THREE.MeshStandardMaterial({ color: '#25282b', roughness: 0.6 }),
  strip: new THREE.MeshStandardMaterial({ color: '#3a3e43', roughness: 0.55 }),
  fuse: new THREE.MeshStandardMaterial({ color: '#e7e2d3', roughness: 0.5 }),
  display: new THREE.MeshStandardMaterial({ color: '#0d2d3a', roughness: 0.2, emissive: '#0a4a60', emissiveIntensity: 0.6 }),
  led: new THREE.MeshStandardMaterial({ color: '#2fd36b', emissive: '#2fd36b', emissiveIntensity: 1.5 }),
  white: new THREE.MeshStandardMaterial({ color: '#f1f1ee', roughness: 0.5 }),
  rail: new THREE.MeshStandardMaterial({ color: '#4a4f54', metalness: 0.6, roughness: 0.5 }),
};
const colorMats = new Map<string, THREE.MeshStandardMaterial>();
const colorMat = (c: string) => { let m = colorMats.get(c); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }); colorMats.set(c, m); } return m; };
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

function B({ w, h, d, x = 0, y = 0, z = 0, m, cast = true }: { w: number; h: number; d: number; x?: number; y?: number; z?: number; m: THREE.Material; cast?: boolean }) {
  return <mesh geometry={useMemo(() => box(w, h, d), [w, h, d])} material={m} position={[x, y + h / 2, z]} castShadow={cast} receiveShadow />;
}
function Label({ text, w, y, z, color = '#ffffff', fg = '#17212b', h = 6 }: { text: string; w?: number; y: number; z: number; color?: string; fg?: string; h?: number }) {
  const { tex, aspect } = useMemo(() => textTexture(text, { bg: color, fg }), [text, color, fg]);
  const width = Math.min(w ?? h * aspect, h * aspect);
  return <mesh position={[0, y, z]}><planeGeometry args={[width, width / aspect]} /><meshBasicMaterial map={tex} transparent toneMapped={false} /></mesh>;
}

/* ---------- Transformator ---------- */
export function Transformer({ w, d, h, dry, kva }: { w: number; d: number; h: number; dry: boolean; kva: number }) {
  if (dry) {
    const r = Math.min(w / 6.8, d / 2.3);
    const coilH = h * 0.6;
    return (
      <group>
        <B w={w * 0.96} h={7} d={d * 0.5} m={M.rail} />
        <B w={w * 0.96} h={h * 0.12} d={d * 0.42} y={7} m={M.core} />
        <B w={w * 0.96} h={h * 0.12} d={d * 0.42} y={7 + h * 0.12 + coilH} m={M.core} />
        {[-1, 0, 1].map((k) => (
          <group key={k} position={[(k * w) / 3.1, 7 + h * 0.12, 0]}>
            <mesh position={[0, coilH / 2, 0]} castShadow><cylinderGeometry args={[r, r, coilH, 40]} /><primitive object={M.coil} attach="material" /></mesh>
            <mesh position={[0, coilH / 2, 0]}><cylinderGeometry args={[r * 1.02, r * 1.02, 2, 40]} /><primitive object={M.core} attach="material" /></mesh>
            <B w={3} h={10} d={3} x={0} y={coilH + h * 0.12} z={r * 0.7} m={M.copper} />
          </group>
        ))}
        <B w={w * 0.7} h={2} d={2} y={h * 0.9} z={d * 0.3} m={M.copper} />
        {[-1.5, -0.5, 0.5, 1.5].map((k) => <B key={k} w={4} h={14} d={1.2} x={(k * w) / 5} y={h * 0.86} z={-d * 0.18} m={M.copper} />)}
        <Label text={`${kva} kVA`} y={7 + h * 0.18} z={d * 0.21 + 0.3} h={5} />
      </group>
    );
  }
  const tankW = w * 0.7, tankD = d * 0.58, tankH = Math.max(60, h - 36);
  const finCount = Math.max(6, Math.floor(tankW / 4.2));
  const finDepth = (d - tankD) / 2;
  return (
    <group>
      {[-1, 1].map((s) => <B key={s} w={w * 0.86} h={8} d={7} z={(s * d) / 4} m={M.rail} />)}
      <B w={tankW} h={tankH} d={tankD} y={8} m={M.tank} />
      {Array.from({ length: finCount }, (_, i) => -tankW / 2 + 2 + (i * (tankW - 4)) / (finCount - 1)).map((x) => [1, -1].map((s) => (
        <B key={`${x}${s}`} w={1.1} h={tankH * 0.9} d={finDepth} x={x} y={8 + tankH * 0.05} z={s * (tankD / 2 + finDepth / 2)} m={M.fin} />
      )))}
      {Array.from({ length: 5 }, (_, i) => -tankD / 2 + 4 + (i * (tankD - 8)) / 4).map((z) => [1, -1].map((s) => (
        <B key={`${z}${s}`} w={(w - tankW) / 2} h={tankH * 0.85} d={1.1} x={s * (tankW / 2 + (w - tankW) / 4)} y={8 + tankH * 0.07} z={z} m={M.fin} />
      )))}
      <B w={tankW + 4} h={3} d={tankD + 4} y={8 + tankH} m={M.tank} />
      {[-1, 0, 1].map((k) => (
        <group key={k} position={[(k * tankW) / 3.4, 11 + tankH, -tankD * 0.22]}>
          {Array.from({ length: 4 }, (_, i) => <mesh key={i} position={[0, 3 + i * 5, 0]} castShadow><cylinderGeometry args={[4.2 - i * 0.4, 4.6 - i * 0.4, 4, 18]} /><primitive object={M.porcelain} attach="material" /></mesh>)}
          <B w={1.6} h={5} d={1.6} y={22} m={M.copper} />
        </group>
      ))}
      {[-1.5, -0.5, 0.5, 1.5].map((k) => (
        <group key={k} position={[(k * tankW) / 4.6, 11 + tankH, tankD * 0.24]}>
          <mesh position={[0, 4, 0]} castShadow><cylinderGeometry args={[2.6, 3, 8, 16]} /><primitive object={M.porcelain} attach="material" /></mesh>
          <B w={5} h={9} d={1} y={8} m={M.copper} />
        </group>
      ))}
      <mesh position={[tankW * 0.36, 14 + tankH, 0]} castShadow><cylinderGeometry args={[3, 3, 6, 16]} /><primitive object={M.steel} attach="material" /></mesh>
      <Label text={`${kva} kVA`} y={8 + tankH * 0.62} z={tankD / 2 + finDepth + 0.4} h={6} color="#e9ecea" />
    </group>
  );
}

/* ---------- MS-Schaltanlage ---------- */
export function Switchgear({ c, w, d, h }: { c: Config; w: number; d: number; h: number }) {
  const offs = fieldOffsets(c.mv.fields, c.mv.vendorId);
  const total = offs.reduce((s, o) => s + o.w, 0) || 1;
  const k = w / total;
  const air = mvVendor(c.mv.vendorId).insulation === 'luft';
  return (
    <group>
      <B w={w} h={6} d={d} m={M.black} />
      {offs.map(({ field, x, w: fw }) => {
        const cx = -w / 2 + (x + fw / 2) * k, ww = fw * k - 0.8;
        const ft = MV_FIELD_TYPES.find((t) => t.id === field.type)!;
        return (
          <group key={field.id} position={[cx, 0, 0]}>
            <B w={ww} h={h - 6} d={d} y={6} m={M.cabinet} />
            <B w={ww - 4} h={h * 0.34} d={0.8} y={10} z={d / 2 + 0.3} m={M.cabinetDark} />
            <B w={ww - 4} h={h * 0.16} d={0.8} y={h * 0.8} z={d / 2 + 0.3} m={M.cabinetDark} />
            <B w={2.2} h={h * 0.3} d={0.5} x={-ww / 2 + 4} y={h * 0.46} z={d / 2 + 0.6} m={colorMat(ft.color)} cast={false} />
            {field.type === 'M' ? (
              <>{[-1, 1].map((s) => <B key={s} w={ww * 0.32} h={h * 0.16} d={0.6} x={(s * ww) / 4.5} y={h * 0.5} z={d / 2 + 0.5} m={M.display} cast={false} />)}</>
            ) : (
              <>
                <B w={Math.min(12, ww * 0.4)} h={9} d={0.6} y={h * 0.56} z={d / 2 + 0.5} m={M.black} cast={false} />
                <mesh position={[0, h * 0.47, d / 2 + 0.7]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[2.2, 2.2, 1, 16]} /><primitive object={M.black} attach="material" /></mesh>
                {(field.type === 'LS' || field.type === 'UE') && <B w={Math.min(10, ww * 0.35)} h={6} d={0.6} y={h * 0.82} z={d / 2 + 0.9} m={M.display} cast={false} />}
                <B w={1.2} h={1.2} d={0.6} x={ww / 2 - 5} y={h * 0.68} z={d / 2 + 0.7} m={M.led} cast={false} />
              </>
            )}
            {air && <B w={ww - 8} h={h * 0.2} d={0.5} y={h * 0.18} z={d / 2 + 0.8} m={M.display} cast={false} />}
            <Label text={ft.short} y={h - 5} z={d / 2 + 0.9} h={5.5} color={ft.color} fg="#ffffff" />
          </group>
        );
      })}
    </group>
  );
}

/* ---------- NS-Verteilung ---------- */
export function LowVoltage({ c, w, d, h, inLv }: { c: Config; w: number; d: number; h: number; inLv: number }) {
  const lv = lvSize(c, inLv);
  if (c.lv.design === 'gekapselt') {
    const n = Math.max(1, Math.round(w / 60)); const cw = w / n;
    return (
      <group>
        <B w={w} h={8} d={d} m={M.black} />
        {Array.from({ length: n }, (_, i) => (
          <group key={i} position={[-w / 2 + cw * (i + 0.5), 0, 0]}>
            <B w={cw - 0.8} h={h - 8} d={d} y={8} m={M.cabinet} />
            <B w={1.5} h={14} d={1.4} x={cw / 2 - 6} y={h * 0.5} z={d / 2 + 0.6} m={M.black} cast={false} />
            {i === 0 && <B w={cw * 0.5} h={cw * 0.3} d={0.6} y={h * 0.7} z={d / 2 + 0.4} m={M.display} cast={false} />}
          </group>
        ))}
        <Label text="NSHV" y={h - 6} z={d / 2 + 0.8} h={6} />
      </group>
    );
  }
  // offene Gerüstbauweise mit NH-Sicherungslastschaltleisten
  const incW = lv.incomerA <= 1000 ? 30 : lv.incomerA <= 1600 ? 40 : lv.incomerA <= 2500 ? 60 : 80;
  const strips: { x: number; sw: number; kind: 'nh' | 'acb' }[] = [];
  let x = -w / 2 + incW + 4;
  const push = (n: number, sw: number, pitch: number, kind: 'nh' | 'acb' = 'nh') => { for (let i = 0; i < n; i++) { if (x + pitch > w / 2 + 0.5) return; strips.push({ x: x + pitch / 2, sw, kind }); x += pitch; } };
  push(c.lv.acbFeeders, 36, 40, 'acb'); push(c.lv.nh3, 9, 10); push(c.lv.nh2, 9, 10); push(c.lv.nh1, 9, 10); push(c.lv.nh00, 4.4, 5);
  const busY = [h * 0.66, h * 0.66 - 18.5, h * 0.66 - 37, h * 0.66 - 55.5].map((v) => Math.max(20, v));
  return (
    <group>
      {[-w / 2 + 1.5, w / 2 - 1.5].map((px) => <B key={px} w={3} h={h} d={d} x={px} m={M.steel} />)}
      <B w={w} h={h * 0.9} d={1} y={4} z={-d / 2 + 0.5} m={M.cabinetDark} />
      {busY.map((y) => <B key={y} w={w - 6} h={3} d={1} y={y} z={-d / 2 + 6} m={M.copper} />)}
      <group position={[-w / 2 + incW / 2 + 2, 0, 0]}>
        <B w={incW - 3} h={h * 0.78} d={d - 4} y={10} m={M.cabinet} />
        <B w={(incW - 3) * 0.5} h={14} d={1} y={h * 0.5} z={(d - 4) / 2 + 0.4} m={M.black} cast={false} />
        {c.lv.instrument !== 'ohne' && <B w={9.6} h={9.6} d={0.8} y={h * 0.72} z={(d - 4) / 2 + 0.4} m={M.display} cast={false} />}
      </group>
      {strips.map((s, i) => s.kind === 'acb' ? (
        <group key={i} position={[s.x, 0, 0]}>
          <B w={s.sw} h={h * 0.55} d={d - 6} y={h * 0.18} m={M.cabinet} />
          <B w={s.sw * 0.6} h={10} d={1} y={h * 0.44} z={(d - 6) / 2 + 0.4} m={M.black} cast={false} />
        </group>
      ) : (
        <group key={i} position={[s.x, 0, 0]}>
          <B w={s.sw} h={h * 0.64} d={9} y={h * 0.12} z={-d / 2 + 12} m={M.strip} />
          {[0.28, 0.48, 0.68].map((f) => <B key={f} w={s.sw * 0.7} h={6} d={1.4} y={h * f} z={-d / 2 + 17} m={M.fuse} cast={false} />)}
        </group>
      ))}
      <Label text="NSHV" y={h - 5} z={d / 2} h={6} />
    </group>
  );
}

export function Cabinet({ w, d, h, label, meter }: { w: number; d: number; h: number; label: string; meter?: boolean }) {
  return (
    <group>
      <B w={w} h={h} d={d} m={meter ? M.white : M.cabinet} />
      <B w={1.2} h={10} d={1.2} x={w / 2 - 5} y={h * 0.5} z={d / 2 + 0.5} m={M.black} cast={false} />
      {meter ? [-1, 1].map((s) => <B key={s} w={w * 0.3} h={h * 0.22} d={0.6} x={(s * w) / 4.2} y={h * 0.55} z={d / 2 + 0.3} m={M.display} cast={false} />)
        : <B w={1.4} h={1.4} d={0.6} x={-w / 2 + 6} y={h * 0.85} z={d / 2 + 0.4} m={M.led} cast={false} />}
      <Label text={label} y={h - 6} z={d / 2 + 0.4} h={5} />
    </group>
  );
}

export function EquipmentItem({ it, c, inLv }: { it: Item; c: Config; inLv: number }) {
  const t = c.transformer;
  let node: React.ReactNode = null;
  if (it.kind === 'trafo') node = <Transformer w={it.w} d={it.d} h={it.h} dry={t.type === 'giessharz'} kva={t.powerKva} />;
  else if (it.kind === 'ms') node = <Switchgear c={c} w={it.w} d={it.d} h={it.h} />;
  else if (it.kind === 'ns') node = <LowVoltage c={c} w={it.w} d={it.d} h={it.h} inLv={inLv} />;
  else if (it.kind === 'fw') node = <Cabinet w={it.w} d={it.d} h={it.h} label="Fernwirk" />;
  else node = <Cabinet w={it.w} d={it.d} h={it.h} label="Zähler" meter />;
  return (
    <group position={[it.x, it.y, it.z]} rotation={[0, faceRotation(it.face), 0]}>
      {node}
      {it.clipped && <mesh position={[0, it.h / 2, 0]}><boxGeometry args={[it.w + 2, it.h + 2, it.d + 2]} /><meshBasicMaterial color="#e5332a" wireframe /></mesh>}
    </group>
  );
}

export function WarnSign({ size = 14 }: { size?: number }) {
  const tex = useMemo(() => warningSign(), []);
  return <mesh><planeGeometry args={[size, size]} /><meshBasicMaterial map={tex} transparent toneMapped={false} /></mesh>;
}
