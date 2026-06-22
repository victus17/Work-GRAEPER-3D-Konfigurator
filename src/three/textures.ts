import * as THREE from 'three';

/** Prozedurale Texturen (Canvas) – keine externen Bilddateien, damit der Konfigurator offline und ohne CDN läuft. */

const cache = new Map<string, THREE.Texture>();

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function makeTexture(key: string, size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, srgb = true): THREE.Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}
const grey = (v: number) => `rgb(${v},${v},${v})`;

/** Höhenkarte für Putzstrukturen (als bumpMap). grain: Korngröße in Pixeln. */
export function plasterBump(kind: 'reibe' | 'roll' | 'beton'): THREE.Texture {
  return makeTexture(`bump-${kind}`, 512, (ctx, s) => {
    const r = rng(kind === 'reibe' ? 11 : kind === 'roll' ? 23 : 37);
    ctx.fillStyle = grey(128); ctx.fillRect(0, 0, s, s);
    const n = kind === 'reibe' ? 9000 : kind === 'roll' ? 16000 : 5000;
    for (let i = 0; i < n; i++) {
      const x = r() * s, y = r() * s;
      const rad = kind === 'reibe' ? 1 + r() * 2.6 : kind === 'roll' ? 0.6 + r() * 1.3 : 0.5 + r() * 1.8;
      const v = 128 + (r() - 0.5) * (kind === 'beton' ? 70 : 200);
      ctx.fillStyle = grey(Math.max(0, Math.min(255, Math.round(v))));
      ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.283); ctx.fill();
    }
    if (kind === 'reibe') { // typische Reibespuren
      ctx.strokeStyle = 'rgba(70,70,70,.35)'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 420; i++) { const x = r() * s, y = r() * s, a = r() * 6.283, l = 5 + r() * 16; ctx.beginPath(); ctx.arc(x, y, l, a, a + 0.9); ctx.stroke(); }
    }
  }, false);
}

export function waschbetonMap(): THREE.Texture {
  return makeTexture('waschbeton', 512, (ctx, s) => {
    const r = rng(5);
    ctx.fillStyle = '#8f8a80'; ctx.fillRect(0, 0, s, s);
    const tones = ['#b9b2a4', '#a39a8a', '#7d7568', '#c9c2b4', '#6d665b', '#a88f73', '#958d82', '#d6d0c5'];
    for (let i = 0; i < 5200; i++) {
      const x = r() * s, y = r() * s, rad = 2 + r() * 5;
      ctx.fillStyle = tones[Math.floor(r() * tones.length)];
      ctx.beginPath(); ctx.ellipse(x, y, rad, rad * (0.6 + r() * 0.5), r() * 3.14, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(40,36,30,.35)'; ctx.lineWidth = 0.7; ctx.stroke();
    }
  });
}

export function clinkerMap(tone: 'rot' | 'rotbunt' | 'anthrazit' | 'sand'): THREE.Texture {
  return makeTexture(`clinker-${tone}`, 512, (ctx, s) => {
    const r = rng(tone.length * 7 + 3);
    const pal: Record<string, string[]> = {
      rot: ['#9a4a36', '#a3513a', '#8d4230', '#a85a40', '#934634'],
      rotbunt: ['#8b4a3a', '#6f3b31', '#a05a40', '#5d3a34', '#b0684a', '#7c4a44'],
      anthrazit: ['#4a4744', '#55524e', '#3f3d3b', '#5e5a55', '#444140'],
      sand: ['#c7a877', '#d0b283', '#b99a6b', '#d8bd91', '#c2a26f'],
    };
    ctx.fillStyle = tone === 'anthrazit' ? '#8f8c86' : '#b9b3a6'; ctx.fillRect(0, 0, s, s);
    const rows = 16, bh = s / rows, bw = s / 4, joint = 3;
    for (let j = 0; j < rows; j++) {
      const off = j % 2 ? bw / 2 : 0;
      for (let i = -1; i < 5; i++) {
        const c = pal[tone][Math.floor(r() * pal[tone].length)];
        ctx.fillStyle = c; ctx.fillRect(i * bw + off + joint / 2, j * bh + joint / 2, bw - joint, bh - joint);
        ctx.fillStyle = `rgba(0,0,0,${r() * 0.12})`; ctx.fillRect(i * bw + off + joint / 2, j * bh + joint / 2, bw - joint, bh - joint);
      }
    }
  });
}
export function clinkerBump(): THREE.Texture {
  return makeTexture('clinker-bump', 512, (ctx, s) => {
    ctx.fillStyle = grey(60); ctx.fillRect(0, 0, s, s);
    const rows = 16, bh = s / rows, bw = s / 4, joint = 3;
    ctx.fillStyle = grey(210);
    for (let j = 0; j < rows; j++) { const off = j % 2 ? bw / 2 : 0; for (let i = -1; i < 5; i++) ctx.fillRect(i * bw + off + joint / 2, j * bh + joint / 2, bw - joint, bh - joint); }
  }, false);
}

export function woodMap(): THREE.Texture {
  return makeTexture('wood', 512, (ctx, s) => {
    const r = rng(77);
    const boards = 8, bw = s / boards;
    for (let i = 0; i < boards; i++) {
      const base = 150 + Math.floor(r() * 30);
      ctx.fillStyle = `rgb(${base + 20},${base - 28},${base - 78})`; ctx.fillRect(i * bw, 0, bw, s);
      for (let k = 0; k < 46; k++) {
        ctx.strokeStyle = `rgba(${70 + r() * 40},${40 + r() * 20},${15 + r() * 15},${0.08 + r() * 0.16})`; ctx.lineWidth = 0.6 + r() * 1.4;
        const x = i * bw + r() * bw; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + (r() - 0.5) * 8, s * 0.33, x + (r() - 0.5) * 8, s * 0.66, x + (r() - 0.5) * 4, s); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(30,18,8,.55)'; ctx.fillRect(i * bw, 0, 2.2, s);
    }
  });
}
export function woodBump(): THREE.Texture {
  return makeTexture('wood-bump', 256, (ctx, s) => {
    ctx.fillStyle = grey(200); ctx.fillRect(0, 0, s, s);
    const boards = 8, bw = s / boards; ctx.fillStyle = grey(20);
    for (let i = 0; i < boards; i++) ctx.fillRect(i * bw, 0, 2, s);
  }, false);
}

export function metalPanelBump(): THREE.Texture {
  return makeTexture('metal-bump', 256, (ctx, s) => {
    ctx.fillStyle = grey(200); ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = grey(40);
    for (let i = 0; i < 4; i++) ctx.fillRect((i * s) / 4, 0, 3, s);
    ctx.fillRect(0, 0, s, 2);
  }, false);
}

export function stoneMap(): THREE.Texture {
  return makeTexture('stone', 512, (ctx, s) => {
    const r = rng(99);
    ctx.fillStyle = '#6f6a62'; ctx.fillRect(0, 0, s, s);
    const tones = ['#b5ab98', '#a59c8c', '#c2b8a6', '#978f82', '#aaa08e', '#bdb09a'];
    let y = 0;
    while (y < s) {
      const h = 38 + Math.floor(r() * 34); let x = -Math.floor(r() * 60);
      while (x < s) {
        const w = 60 + Math.floor(r() * 90);
        ctx.fillStyle = tones[Math.floor(r() * tones.length)]; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},.04)`; ctx.fillRect(x + r() * w, y + r() * h, 3 + r() * 9, 2 + r() * 5); }
        x += w;
      }
      y += h;
    }
  });
}

export function grassMap(): THREE.Texture {
  return makeTexture('grass', 512, (ctx, s) => {
    const r = rng(404);
    ctx.fillStyle = '#7d9a5c'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 26000; i++) {
      const g = 110 + Math.floor(r() * 70);
      ctx.fillStyle = `rgba(${g - 50 + r() * 20},${g + 18},${g - 70},${0.35 + r() * 0.4})`;
      ctx.fillRect(r() * s, r() * s, 1 + r() * 1.6, 2 + r() * 4);
    }
  });
}
export function pavingMap(): THREE.Texture {
  return makeTexture('paving', 512, (ctx, s) => {
    const r = rng(8);
    ctx.fillStyle = '#8b8d8e'; ctx.fillRect(0, 0, s, s);
    const n = 8, c = s / n;
    for (let j = 0; j < n * 2; j++) for (let i = -1; i < n; i++) {
      const v = 158 + Math.floor(r() * 26);
      ctx.fillStyle = `rgb(${v},${v},${v - 4})`;
      ctx.fillRect(i * c + (j % 2 ? c / 2 : 0) + 1.5, (j * c) / 2 + 1.5, c - 3, c / 2 - 3);
    }
  });
}
export function soilMap(): THREE.Texture {
  return makeTexture('soil', 256, (ctx, s) => {
    const r = rng(15);
    ctx.fillStyle = '#7a644b'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 7000; i++) { const v = 90 + r() * 60; ctx.fillStyle = `rgba(${v + 20},${v},${v - 30},.5)`; ctx.fillRect(r() * s, r() * s, 1 + r() * 3, 1 + r() * 3); }
  });
}
export function sandMap(): THREE.Texture {
  return makeTexture('sand', 256, (ctx, s) => {
    const r = rng(16);
    ctx.fillStyle = '#d6c193'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) { const v = 190 + r() * 50; ctx.fillStyle = `rgba(${v},${v - 18},${v - 70},.5)`; ctx.fillRect(r() * s, r() * s, 1.2, 1.2); }
  });
}

/** Warnschild „Gefährliche elektrische Spannung" (W012) als Aufkleber. */
export function warningSign(): THREE.Texture {
  return makeTexture('warn', 256, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    const p = 14;
    ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(s / 2, p); ctx.lineTo(s - p, s - p - 16); ctx.lineTo(p, s - p - 16); ctx.closePath();
    ctx.fillStyle = '#f7c600'; ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(s * 0.55, s * 0.30); ctx.lineTo(s * 0.40, s * 0.55); ctx.lineTo(s * 0.50, s * 0.55); ctx.lineTo(s * 0.44, s * 0.78);
    ctx.lineTo(s * 0.62, s * 0.48); ctx.lineTo(s * 0.52, s * 0.48); ctx.closePath(); ctx.fill();
  });
}

/** Textschild (Feldbezeichnungen, Maßlabels). */
export function textTexture(text: string, opts: { bg?: string; fg?: string; bold?: boolean; pad?: number; radius?: number; border?: string } = {}): { tex: THREE.Texture; aspect: number } {
  /* JSON kodiert den aktuellen Wert als Text; Referenzen zwischen Objekten bleiben dabei nicht erhalten. */ const key = `txt-${text}-${JSON.stringify(opts)}`;
  const fs = 64, pad = opts.pad ?? 22;
  const probe = document.createElement('canvas').getContext('2d')!;
  const font = `${opts.bold === false ? 500 : 700} ${fs}px "Overpass Variable", Overpass, system-ui, sans-serif`;
  probe.font = font;
  const w = Math.ceil(probe.measureText(text).width) + pad * 2, h = fs + pad * 1.4;
  let tex = cache.get(key);
  if (!tex) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d')!;
    const rad = opts.radius ?? 18;
    ctx.beginPath(); ctx.roundRect(2, 2, w - 4, h - 4, rad);
    if (opts.bg !== 'none') { ctx.fillStyle = opts.bg ?? '#ffffff'; ctx.fill(); }
    if (opts.border) { ctx.lineWidth = 4; ctx.strokeStyle = opts.border; ctx.stroke(); }
    ctx.font = font; ctx.fillStyle = opts.fg ?? '#17212b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
    tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    cache.set(key, tex);
  }
  return { tex, aspect: w / h };
}

/** BoxGeometry, deren UVs in Kacheln (tile, Einheit wie die Maße) skaliert sind – gleichmäßige Texturdichte auf allen Flächen. */
export function boxWorldUV(w: number, h: number, d: number, tile: number): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const scale: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v;
    uv.setXY(i, (uv.getX(i) * scale[f][0]) / tile, (uv.getY(i) * scale[f][1]) / tile);
  }
  uv.needsUpdate = true;
  return g;
}

/** Lamellenstruktur für Lüftungstüren und -gitter (als Farb- und Reliefkarte). */
export function louverMap(): THREE.Texture {
  return makeTexture('louver', 128, (ctx, s) => {
    const n = 16, h = s / n;
    for (let i = 0; i < n; i++) {
      const g = ctx.createLinearGradient(0, i * h, 0, (i + 1) * h);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#e2e2e2'); g.addColorStop(0.78, '#8a8a8a'); g.addColorStop(1, '#3a3a3a');
      ctx.fillStyle = g; ctx.fillRect(0, i * h, s, h);
    }
  }, false);
}
/** Gitterrost (Trafostand). */
export function gratingMap(): THREE.Texture {
  return makeTexture('grating', 128, (ctx, s) => {
    ctx.fillStyle = '#2a2d30'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#9aa0a5';
    for (let i = 0; i < 8; i++) ctx.fillRect((i * s) / 8, 0, 3, s);
    for (let j = 0; j < 4; j++) ctx.fillRect(0, (j * s) / 4, s, 2);
  });
}
/** Kopie mit eigener Wiederholung (Texturen sind zwischengespeichert und werden geteilt). */
export function repeated(tex: THREE.Texture, rx: number, ry: number): THREE.Texture {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}
