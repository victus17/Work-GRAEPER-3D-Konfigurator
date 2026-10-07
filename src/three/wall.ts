import * as THREE from 'three';

export interface Hole { u0: number; u1: number; v0: number; v1: number }

/**
 * Wandscheibe mit rechteckigen Öffnungen als eine Geometrie.
 * Lokale Koordinaten: u = x (−L/2 … L/2), v = y (yB … yT), Innenfläche z = 0, Außenfläche z = t.
 * Materialgruppen: 0 = Rohbeton (unter Gelände), 1 = Sockel, 2 = Fassade, 3 = Innenfläche, 4 = Wandkrone.
 * UV-Koordinaten in Weltmaß (u/tile, v/tile) – Texturen laufen über alle Wände ohne Versatz.
 */
export function wallGeometry(L: number, yB: number, yT: number, t: number, holes: Hole[], plinthTop: number, tile: number, endCaps: boolean): THREE.BufferGeometry {
  const G = Array.from({ length: 5 }, () => ({ p: [] as number[], n: [] as number[], uv: [] as number[] }));
  const v3 = (a: number[]) => new THREE.Vector3(a[0], a[1], a[2]);
  const quad = (gi: number, pts: number[][], normal: [number, number, number], uvs: number[][]) => {
    const [a, b, c] = pts.map(v3);
    const cr = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    let order = [0, 1, 2, 0, 2, 3];
    if (cr.dot(new THREE.Vector3(...normal)) < 0) order = [0, 2, 1, 0, 3, 2];
    for (const k of order) { G[gi].p.push(...pts[k]); G[gi].n.push(...normal); G[gi].uv.push(...uvs[k]); }
  };
  const groupFor = (v: number) => (v < 0 ? 0 : v < plinthTop ? 1 : 2);
  const hs = holes
    .map((h) => ({ u0: Math.max(-L / 2, h.u0), u1: Math.min(L / 2, h.u1), v0: Math.max(yB, h.v0), v1: Math.min(yT, h.v1) }))
    .filter((h) => h.u1 - h.u0 > 0.5 && h.v1 - h.v0 > 0.5);
  const uniq = (a: number[]) => [...new Set(a.map((x) => Math.round(x * 100) / 100))].sort((p, q) => p - q);
  const us = uniq([-L / 2, L / 2, ...hs.flatMap((h) => [h.u0, h.u1])]);
  const vs = uniq([yB, yT, ...[0, plinthTop].filter((v) => v > yB && v < yT), ...hs.flatMap((h) => [h.v0, h.v1])]);
  const inHole = (u: number, v: number) => hs.some((h) => u > h.u0 && u < h.u1 && v > h.v0 && v < h.v1);

  for (let j = 0; j < vs.length - 1; j++) {
    const v0 = vs[j], v1 = vs[j + 1], vc = (v0 + v1) / 2, gi = groupFor(vc);
    let start: number | null = null;
    for (let i = 0; i <= us.length - 1; i++) {
      const filled = i < us.length - 1 && !inHole((us[i] + us[i + 1]) / 2, vc);
      if (filled && start === null) start = us[i];
      if (!filled && start !== null) {
        const u0 = start, u1 = us[i];
        quad(gi, [[u0, v0, t], [u1, v0, t], [u1, v1, t], [u0, v1, t]], [0, 0, 1], [[u0 / tile, v0 / tile], [u1 / tile, v0 / tile], [u1 / tile, v1 / tile], [u0 / tile, v1 / tile]]);
        quad(3, [[u0, v0, 0], [u1, v0, 0], [u1, v1, 0], [u0, v1, 0]], [0, 0, -1], [[-u0 / tile, v0 / tile], [-u1 / tile, v0 / tile], [-u1 / tile, v1 / tile], [-u0 / tile, v1 / tile]]);
        start = null;
      }
    }
  }
  // Laibungen der Öffnungen
  for (const h of hs) {
    const r = (a: number) => a / tile;
    quad(2, [[h.u0, h.v1, 0], [h.u1, h.v1, 0], [h.u1, h.v1, t], [h.u0, h.v1, t]], [0, -1, 0], [[r(h.u0), 0], [r(h.u1), 0], [r(h.u1), r(t)], [r(h.u0), r(t)]]);
    if (h.v0 > yB + 0.5) quad(groupFor(h.v0 - 0.1), [[h.u0, h.v0, 0], [h.u1, h.v0, 0], [h.u1, h.v0, t], [h.u0, h.v0, t]], [0, 1, 0], [[r(h.u0), 0], [r(h.u1), 0], [r(h.u1), r(t)], [r(h.u0), r(t)]]);
    for (const [u, nx] of [[h.u0, 1], [h.u1, -1]] as const) {
      const bands = uniq([h.v0, h.v1, ...[0, plinthTop].filter((v) => v > h.v0 && v < h.v1)]);
      for (let k = 0; k < bands.length - 1; k++) {
        const a = bands[k], b = bands[k + 1];
        quad(groupFor((a + b) / 2), [[u, a, 0], [u, b, 0], [u, b, t], [u, a, t]], [nx, 0, 0], [[0, r(a)], [0, r(b)], [r(t), r(b)], [r(t), r(a)]]);
      }
    }
  }
  // Stirnseiten (sichtbare Gebäudeecken) und Wandkrone
  if (endCaps) {
    const bands = uniq([yB, yT, ...[0, plinthTop].filter((v) => v > yB && v < yT)]);
    for (const [u, nx] of [[-L / 2, -1], [L / 2, 1]] as const) {
      for (let k = 0; k < bands.length - 1; k++) {
        const a = bands[k], b = bands[k + 1];
        const off = (u + L / 2) / tile;
        quad(groupFor((a + b) / 2), [[u, a, 0], [u, b, 0], [u, b, t], [u, a, t]], [nx, 0, 0], [[off, a / tile], [off, b / tile], [off + t / tile, b / tile], [off + t / tile, a / tile]]);
      }
    }
  }
  quad(4, [[-L / 2, yT, 0], [L / 2, yT, 0], [L / 2, yT, t], [-L / 2, yT, t]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);

  const geo = new THREE.BufferGeometry();
  const P: number[] = [], N: number[] = [], UV: number[] = [];
  let offset = 0;
  G.forEach((g, gi) => {
    P.push(...g.p); N.push(...g.n); UV.push(...g.uv);
    const count = g.p.length / 3;
    if (count) geo.addGroup(offset, count, gi);
    offset += count;
  });
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  geo.computeBoundingSphere();
  return geo;
}

/** Profilform (u, v) entlang der x-Achse extrudiert, zentriert. Für Sattel-, Pult- und Tonnendach. */
export function extrudeAlongX(shape: THREE.Shape, length: number): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -length / 2);
  g.rotateY(Math.PI / 2); // lokales z → Welt x, lokales x → Welt −z
  return g;
}

/** Walm- bzw. Zeltdach als geschlossene Fläche über einem Rechteck W × D (Fußpunkt y = 0). */
export function hipRoof(W: number, D: number, h: number): THREE.BufferGeometry {
  const alongX = W >= D;
  const L = alongX ? W : D, B = alongX ? D : W;
  const r = Math.max(0, (L - B) / 2);
  const p = (a: number, b: number, y: number) => (alongX ? [a, y, b] : [b, y, a]);
  const c1 = p(-L / 2, -B / 2, 0), c2 = p(L / 2, -B / 2, 0), c3 = p(L / 2, B / 2, 0), c4 = p(-L / 2, B / 2, 0);
  const r1 = p(-r, 0, h), r2 = p(r, 0, h);
  const tris = [c4, c3, r2, c4, r2, r1, c2, c1, r1, c2, r1, r2, c1, c4, r1, c3, c2, r2];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  const uv: number[] = []; tris.forEach((v) => uv.push(v[0] / 100, v[2] / 100));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  // Dreiecke so ausrichten, dass sie nach außen zeigen
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i), b = new THREE.Vector3().fromBufferAttribute(pos, i + 1), c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const centre = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    if (n.dot(new THREE.Vector3(centre.x, centre.y + 1, centre.z)) < 0) { pos.setXYZ(i + 1, c.x, c.y, c.z); pos.setXYZ(i + 2, b.x, b.y, b.z); }
  }
  geo.computeVertexNormals();
  return geo;
}
