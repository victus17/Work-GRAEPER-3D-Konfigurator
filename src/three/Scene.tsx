import * as THREE from 'three';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useShallow } from 'zustand/react/shallow';
import { useStore, type CameraPreset } from '../state/store';
import { Station, Label3D, type ViewOpts } from './Station';
import type { Geometry } from '../domain/layout';
import type { Excavation } from '../domain/engine';
import { grassMap, pavingMap, repeated, sandMap, soilMap } from './textures';
import { nf } from '../lib/format';

import { capture } from './capture';

function Capture() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    capture.fn = () => { gl.render(scene, camera); return gl.domElement.toDataURL('image/png'); };
    return () => { capture.fn = null; };
  }, [gl, scene, camera]);
  return null;
}

function presetPose(preset: CameraPreset, g: Geometry, scenery: ViewOpts['scenery']) {
  const S = Math.max(g.x, g.z) / 100, H = Math.max(1.5, g.hVisible / 100);
  const target = new THREE.Vector3(0, scenery === 'baugrube' ? -0.2 : H * 0.42, 0);
  const dist = (S * 1.45 + H * 0.9 + 2.4) * (scenery === 'baugrube' ? 1.55 : 1.18);
  // Schrägansicht auf die Ecke mit den meisten Türen/Gittern
  let best = { sx: 1, sz: 1, score: -1 };
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const sides = [sx > 0 ? 'B' : 'D', sz > 0 ? 'A' : 'C'];
    const score = g.openings.filter((o) => sides.includes(o.side)).reduce((a, o) => a + (o.kind === 'door' ? 2 : 1), 0) + (sx > 0 && sz > 0 ? 0.5 : 0);
    if (score > best.score) best = { sx, sz, score };
  }
  const dir = {
    iso: new THREE.Vector3(best.sx, 0.62, best.sz * 1.3), front: new THREE.Vector3(0, 0.22, 1), back: new THREE.Vector3(0, 0.22, -1),
    left: new THREE.Vector3(-1, 0.22, 0), right: new THREE.Vector3(1, 0.22, 0), top: new THREE.Vector3(0, 1, 0.002),
  }[preset].normalize();
  return { pos: target.clone().add(dir.multiplyScalar(preset === 'top' ? dist * 1.15 : dist)), target };
}

function CameraRig({ g }: { g: Geometry }) {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const preset = useStore((s) => s.camera);
  const scenery = useStore((s) => s.scenery);
  const anim = useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; k: number } | null>(null);
  const first = useRef(true);
  const sizeKey = `${g.kind}|${Math.round(g.x / 50)}|${Math.round(g.z / 50)}|${Math.round(g.hVisible / 50)}`;
  useEffect(() => {
    if (!controls) return;
    const { pos, target } = presetPose(preset.preset, g, scenery);
    if (first.current) { camera.position.copy(pos); controls.target.copy(target); controls.update(); first.current = false; return; }
    anim.current = { p0: camera.position.clone(), p1: pos, t0: controls.target.clone(), t1: target, k: 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.nonce, sizeKey, scenery, controls]);
  useFrame((_, dt) => {
    const a = anim.current;
    if (!a || !controls) return;
    a.k = Math.min(1, a.k + dt / 0.75);
    const e = 1 - Math.pow(1 - a.k, 3);
    camera.position.lerpVectors(a.p0, a.p1, e);
    controls.target.lerpVectors(a.t0, a.t1, e);
    controls.update();
    if (a.k >= 1) anim.current = null;
  });
  return null;
}

/* ---------- Umgebung (Maße in cm) ---------- */
function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 90, 0]} castShadow><cylinderGeometry args={[9, 13, 180, 8]} /><meshStandardMaterial color="#6b5440" roughness={0.9} /></mesh>
      <mesh position={[0, 330, 0]} castShadow><icosahedronGeometry args={[150, 1]} /><meshStandardMaterial color="#5f8a4a" roughness={0.95} flatShading /></mesh>
    </group>
  );
}
function Ground({ g, ex, scenery }: { g: Geometry; ex: Excavation; scenery: ViewOpts['scenery'] }) {
  const grass = useMemo(() => repeated(grassMap(), 60, 60), []);
  const paving = useMemo(() => repeated(pavingMap(), (g.x + 300) / 120, (g.z + 300) / 120), [g.x, g.z]);
  const soil = useMemo(() => repeated(soilMap(), 6, 3), []);
  const sand = useMemo(() => repeated(sandMap(), ex.bottomX / 80, ex.bottomZ / 80), [ex.bottomX, ex.bottomZ]);
  const holeGeo = useMemo(() => {
    const s = new THREE.Shape(); const R = 6000;
    s.moveTo(-R, -R); s.lineTo(R, -R); s.lineTo(R, R); s.lineTo(-R, R); s.closePath();
    const h = new THREE.Path(); h.moveTo(-ex.topX / 2, -ex.topZ / 2); h.lineTo(-ex.topX / 2, ex.topZ / 2); h.lineTo(ex.topX / 2, ex.topZ / 2); h.lineTo(ex.topX / 2, -ex.topZ / 2); h.closePath();
    s.holes.push(h);
    const geo = new THREE.ShapeGeometry(s);
    const uv = geo.attributes.uv as THREE.BufferAttribute; const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 200, pos.getY(i) / 200);
    return geo;
  }, [ex.topX, ex.topZ]);
  const slopeGeo = useMemo(() => {
    const b = { x: ex.bottomX / 2, z: ex.bottomZ / 2 }, t = { x: ex.topX / 2, z: ex.topZ / 2 }, y0 = -ex.depth;
    const q = (p: number[][]) => [p[0], p[1], p[2], p[0], p[2], p[3]];
    const tris = [
      ...q([[-b.x, y0, b.z], [b.x, y0, b.z], [t.x, 0, t.z], [-t.x, 0, t.z]]),
      ...q([[b.x, y0, -b.z], [-b.x, y0, -b.z], [-t.x, 0, -t.z], [t.x, 0, -t.z]]),
      ...q([[b.x, y0, b.z], [b.x, y0, -b.z], [t.x, 0, -t.z], [t.x, 0, t.z]]),
      ...q([[-b.x, y0, -b.z], [-b.x, y0, b.z], [-t.x, 0, t.z], [-t.x, 0, -t.z]]),
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(tris.flatMap((v) => [(v[0] + v[2]) / 150, v[1] / 150]), 2));
    geo.computeVertexNormals();
    return geo;
  }, [ex]);
  if (scenery === 'studio') {
    return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow><circleGeometry args={[2600, 64]} /><meshStandardMaterial color="#e3e7eb" roughness={1} /></mesh>;
  }
  if (scenery === 'baugrube') {
    return (
      <group>
        <mesh geometry={holeGeo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><meshStandardMaterial map={grass} roughness={1} /></mesh>
        <mesh geometry={slopeGeo} receiveShadow><meshStandardMaterial map={soil} roughness={1} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -ex.depth + ex.bedThickness / 2, 0]} receiveShadow><boxGeometry args={[ex.bottomX, ex.bedThickness, ex.bottomZ]} /><meshStandardMaterial map={sand} roughness={1} /></mesh>
        <Label3D text={`Aushubtiefe ${nf(ex.depth)} cm · Sandbett ${ex.bedThickness} cm`} position={[0, 40, ex.topZ / 2 + 40]} height={18} bg="#7a644b" fg="#ffffff" />
        <Label3D text="Gelände ± 0,00" position={[ex.topX / 2 + 70, 12, 0]} height={15} />
      </group>
    );
  }
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow><planeGeometry args={[12000, 12000]} /><meshStandardMaterial map={grass} roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} receiveShadow><planeGeometry args={[g.x + 300, g.z + 300]} /><meshStandardMaterial map={paving} roughness={0.95} /></mesh>
      {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * (g.x + 306)) / 2, 4, (sz * (g.z + 306)) / 2]} castShadow receiveShadow>
          <boxGeometry args={[sx ? 8 : g.x + 314, 10, sz ? 8 : g.z + 314]} /><meshStandardMaterial color="#bdbbb5" roughness={0.9} />
        </mesh>
      ))}
      <Tree x={-g.x / 2 - 520} z={-g.z / 2 - 380} s={1.15} />
      <Tree x={g.x / 2 + 640} z={-g.z / 2 - 520} s={0.95} />
      <Tree x={g.x / 2 + 900} z={g.z / 2 + 300} s={1.25} />
    </group>
  );
}

export default function Scene() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const v = useStore(useShallow((s) => ({ doorsOpen: s.doorsOpen, xray: s.xray, roofOff: s.roofOff, showDims: s.showDims, showPerson: s.showPerson, scenery: s.scenery })));
  const opts: ViewOpts = useMemo(() => v, [v.doorsOpen, v.xray, v.roofOff, v.showDims, v.showPerson, v.scenery]); // eslint-disable-line react-hooks/exhaustive-deps
  const bg = opts.scenery === 'studio' ? 'linear-gradient(180deg,#f3f5f8 0%,#dfe4ea 100%)' : 'linear-gradient(180deg,#bcd7ef 0%,#dfeaf3 55%,#eef2f4 100%)';
  return (
    <div className="view-canvas" style={{ background: bg }}>
      <Canvas shadows dpr={[1, 2]} gl={{ preserveDrawingBuffer: true, antialias: true }} camera={{ fov: 35, near: 0.05, far: 400, position: [8, 5, 9] }}>
        <Suspense fallback={null}>
          {opts.scenery !== 'studio' && <fog attach="fog" args={['#e6eef4', 40, 120]} />}
          <hemisphereLight args={['#f1f6ff', '#8d8472', 1.15]} />
          <ambientLight intensity={0.25} />
          <directionalLight position={[7, 12, 8]} intensity={2.7} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
            shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-near={0.5} shadow-camera-far={60} />
          <directionalLight position={[-8, 6, -6]} intensity={0.55} />
          <group scale={0.01}>
            <Ground g={d.geometry} ex={d.excavation} scenery={opts.scenery} />
            <Station c={c} d={d} opts={opts} />
          </group>
          <OrbitControls makeDefault enableDamping dampingFactor={0.12} minDistance={1.5} maxDistance={45} maxPolarAngle={Math.PI * 0.495} />
          <CameraRig g={d.geometry} />
          <Capture />
        </Suspense>
      </Canvas>
    </div>
  );
}
