import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import type { Config } from '../domain/types';
import { ralHex } from '../data/ral';
import { CLINKER_TONES } from '../data/options';
import { clinkerBump, clinkerMap, metalPanelBump, plasterBump, stoneMap, waschbetonMap, woodBump, woodMap, louverMap, repeated } from './textures';

export interface StationMaterials {
  wall: THREE.Material[];       // Gruppen lt. wallGeometry
  roof: THREE.MeshStandardMaterial;
  roofEdge: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  interior: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  door: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  ventRing: THREE.MeshStandardMaterial;
  tile: number;
}

export function doorColor(c: Config): { color: string; metalness: number; roughness: number } {
  const b = c.building;
  if (c.envelope.doorFinish === 'ral') return { color: ralHex(c.envelope.doorRal), metalness: 0.25, roughness: 0.5 };
  if (b.doorMaterial === 'edelstahl') return { color: '#cfd3d6', metalness: 0.85, roughness: 0.32 };
  if (b.doorMaterial === 'stahl') return { color: '#a3a8ab', metalness: 0.7, roughness: 0.45 };
  return { color: '#c3c7ca', metalness: 0.7, roughness: 0.38 };
}

export function useStationMaterials(c: Config, xray: boolean): StationMaterials {
  const e = c.envelope;
  const key = JSON.stringify([e, c.building.doorMaterial, xray]);
  const mats = useMemo(() => {
    const surf = e.surface;
    const opacity = xray ? 0.16 : 1;
    const common = { transparent: xray, opacity, depthWrite: !xray };
    let tile = 60;
    let body: THREE.MeshStandardMaterial;
    if (surf === 'waschbeton') { tile = 80; body = new THREE.MeshStandardMaterial({ map: waschbetonMap(), bumpMap: plasterBump('beton'), bumpScale: 1.2, roughness: 0.95, ...common }); }
    else if (surf === 'klinker') { tile = 100; body = new THREE.MeshStandardMaterial({ map: clinkerMap(e.clinkerTone), bumpMap: clinkerBump(), bumpScale: 1.6, roughness: 0.88, ...common }); }
    else if (surf === 'holz') { tile = 120; body = new THREE.MeshStandardMaterial({ map: woodMap(), bumpMap: woodBump(), bumpScale: 1.4, roughness: 0.8, ...common }); }
    else if (surf === 'naturstein') { tile = 150; body = new THREE.MeshStandardMaterial({ map: stoneMap(), bumpMap: plasterBump('beton'), bumpScale: 1, roughness: 0.9, ...common }); }
    else if (surf === 'metall') { tile = 200; body = new THREE.MeshStandardMaterial({ color: ralHex(e.bodyRal), bumpMap: metalPanelBump(), bumpScale: 1, metalness: 0.45, roughness: 0.45, ...common }); }
    else { tile = surf === 'rollputz' ? 50 : 60; body = new THREE.MeshStandardMaterial({ color: ralHex(e.bodyRal), bumpMap: plasterBump(surf === 'rollputz' ? 'roll' : 'reibe'), bumpScale: surf === 'rollputz' ? 0.8 : 1.6, roughness: 0.96, ...common }); }
    const raw = new THREE.MeshStandardMaterial({ color: '#a7a49e', bumpMap: plasterBump('beton'), bumpScale: 0.8, roughness: 0.95, ...common });
    const plinthColor = surf === 'klinker' ? CLINKER_TONES.find((t) => t.id === e.clinkerTone)!.hex : ralHex(e.plinthRal);
    const plinth = new THREE.MeshStandardMaterial({ color: plinthColor, bumpMap: plasterBump('reibe'), bumpScale: 1.4, roughness: 0.95, ...common });
    const interior = new THREE.MeshStandardMaterial({ color: e.interiorWhite ? '#e8e7e2' : '#aeaba5', roughness: 0.95, ...common });
    const top = raw.clone();
    const roof = new THREE.MeshStandardMaterial({ color: ralHex(e.roofRal), roughness: 0.7, metalness: 0.05, bumpMap: plasterBump('roll'), bumpScale: 0.4, transparent: xray, opacity: xray ? 0.12 : 1, depthWrite: !xray });
    const roofEdge = roof.clone();
    const dc = doorColor(c);
    const door = new THREE.MeshStandardMaterial({ color: dc.color, metalness: dc.metalness, roughness: dc.roughness });
    const frame = new THREE.MeshStandardMaterial({ color: new THREE.Color(dc.color).multiplyScalar(0.82), metalness: dc.metalness, roughness: dc.roughness + 0.05 });
    const ventRing = new THREE.MeshStandardMaterial({ color: '#b7bcc0', metalness: 0.65, roughness: 0.42, map: repeated(louverMap(), 6, 3), bumpMap: repeated(louverMap(), 6, 3), bumpScale: 2 });
    return {
      wall: [raw, plinth, body, interior, top], roof, roofEdge, concrete: raw, interior,
      floor: new THREE.MeshStandardMaterial({ color: c.building.walkIn.floor === 'beton' ? '#b9b6b0' : '#d2d5d8', roughness: 0.9 }),
      door, frame, dark: new THREE.MeshStandardMaterial({ color: '#2b2f33', roughness: 0.6 }), ventRing, tile,
    } satisfies StationMaterials;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, c.building.walkIn.floor]);
  useEffect(() => () => {
    [...mats.wall, mats.roof, mats.roofEdge, mats.floor, mats.door, mats.frame, mats.dark, mats.ventRing].forEach((m) => m.dispose());
  }, [mats]);
  return mats;
}
