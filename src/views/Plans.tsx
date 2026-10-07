import type { ReactNode } from 'react';
import type { Config, MvField, Side } from '../domain/types';
import type { Derived } from '../domain/engine';
import { fieldOffsets, lvSize, ROOM_LABEL } from '../domain/layout';
import { MV_FIELD_TYPES, mvVendor } from '../data/electrical';
import { footprint, partitions } from '../lib/geom';
import { nf } from '../lib/format';

const BLUE = '#0063b0', INK = '#17212b', GREY = '#76818e';
const ITEM_FILL: Record<string, string> = { trafo: '#e7edf2', ms: '#dfeaf6', ns: '#eef0e2', fw: '#f2e9f6', zaehler: '#fbf1e1' };

function Dim({ x1, y1, x2, y2, label, off = 0, vertical }: { x1: number; y1: number; x2: number; y2: number; label: string; off?: number; vertical?: boolean }) {
  const t = 5;
  if (vertical) {
    const x = x1 + off;
    return (<g stroke={INK} strokeWidth={0.8} fill="none">
      <line x1={x1} y1={y1} x2={x} y2={y1} stroke={GREY} strokeDasharray="2 2" /><line x1={x2} y1={y2} x2={x} y2={y2} stroke={GREY} strokeDasharray="2 2" />
      <line x1={x} y1={y1} x2={x} y2={y2} /><line x1={x - t} y1={y1 + t} x2={x + t} y2={y1 - t} /><line x1={x - t} y1={y2 + t} x2={x + t} y2={y2 - t} />
      <text x={x + (off >= 0 ? 6 : -6)} y={(y1 + y2) / 2} fill={INK} stroke="none" fontSize={12} textAnchor="middle" transform={`rotate(-90 ${x + (off >= 0 ? 6 : -6)} ${(y1 + y2) / 2})`} dy={off >= 0 ? 10 : -3}>{label}</text>
    </g>);
  }
  const y = y1 + off;
  return (<g stroke={INK} strokeWidth={0.8} fill="none">
    <line x1={x1} y1={y1} x2={x1} y2={y} stroke={GREY} strokeDasharray="2 2" /><line x1={x2} y1={y2} x2={x2} y2={y} stroke={GREY} strokeDasharray="2 2" />
    <line x1={x1} y1={y} x2={x2} y2={y} /><line x1={x1 - t} y1={y + t} x2={x1 + t} y2={y - t} /><line x1={x2 - t} y1={y + t} x2={x2 + t} y2={y - t} />
    <text x={(x1 + x2) / 2} y={y - 5} fill={INK} stroke="none" fontSize={12} textAnchor="middle">{label}</text>
  </g>);
}
const Frame = ({ w, h, children, title, sub }: { w: number; h: number; children: ReactNode; title: string; sub?: string }) => (
  <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxHeight: '100%', fontFamily: 'Overpass Variable, Overpass, system-ui, sans-serif' }} role="img" aria-label={title}>
    <defs>
      <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#eceef1" /><line x1="0" y1="0" x2="0" y2="6" stroke="#8b939c" strokeWidth="1.1" /></pattern>
      <pattern id="sand" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#efe3c3" /><circle cx="2" cy="2" r=".9" fill="#b9a26f" /><circle cx="6" cy="5" r=".7" fill="#b9a26f" /></pattern>
      <pattern id="soil" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)"><rect width="10" height="10" fill="#e9dfd2" /><line x1="0" y1="0" x2="0" y2="10" stroke="#a88f74" strokeWidth=".8" /></pattern>
    </defs>
    <text x={18} y={26} fontSize={16} fontWeight={700} fill={INK}>{title}</text>
    {sub && <text x={18} y={44} fontSize={12} fill={GREY}>{sub}</text>}
    {children}
  </svg>
);

/* ---------- Grundriss ---------- */
export function FloorPlan({ c, d }: { c: Config; d: Derived }) {
  const g = d.geometry;
  const W = 1000, H = 700;
  const leaf = (sides: Side[]) => Math.max(0, ...g.openings.filter((o) => o.kind === 'door' && sides.includes(o.side)).map((o) => o.w / o.leaves));
  const extX = g.x + 2 * Math.max(60, leaf(['B', 'D'])), extZ = g.z + 2 * Math.max(60, leaf(['A', 'C']));
  const s = Math.min((W - 160) / extX, (H - 200) / extZ);
  const cx = W / 2, cy = H / 2 + 15;
  const X = (x: number) => cx + x * s, Y = (z: number) => cy + z * s; // +z (Seite A) unten
  const t = g.wallT;
  if (g.kind === 'trafostand') {
    const st = g.stand!; const carrier = Math.min(420, st.l * 0.36);
    return (
      <Frame w={W} h={H} title={`Draufsicht ${st.name}`} sub={`${nf(st.l)} × ${nf(st.b)} cm · Auffangvolumen ${st.volumeM3} m³ · Wannenhöhe ${st.tubHeight} cm`}>
        <rect x={X(-g.x / 2)} y={Y(-g.z / 2)} width={g.x * s} height={g.z * s} fill="url(#hatch)" stroke={INK} />
        {[-1, 1].map((k) => <rect key={k} x={X(k > 0 ? carrier / 2 + 12 : -g.x / 2 + 25)} y={Y(-g.z / 2 + 25)} width={((g.x - carrier) / 2 - 37) * s} height={(g.z - 50) * s} fill="#fff" stroke={INK} />)}
        {[-1, 1].map((k) => <text key={`t${k}`} x={X((k * (carrier / 2 + g.x / 2)) / 2)} y={Y(0)} textAnchor="middle" fontSize={13} fill={GREY}>Auffangwanne mit Gitterrost</text>)}
        <text x={X(0)} y={Y(0)} textAnchor="middle" fontSize={13} fontWeight={600}>Trafoträger</text>
        <Dim x1={X(-g.x / 2)} y1={Y(g.z / 2)} x2={X(g.x / 2)} y2={Y(g.z / 2)} off={40} label={`${nf(g.x)} cm`} />
        <Dim x1={X(g.x / 2)} y1={Y(-g.z / 2)} x2={X(g.x / 2)} y2={Y(g.z / 2)} off={40} vertical label={`${nf(g.z)} cm`} />
      </Frame>
    );
  }
  const walls = [
    { x0: -g.x / 2, z0: g.z / 2 - t, x1: g.x / 2, z1: g.z / 2 }, { x0: -g.x / 2, z0: -g.z / 2, x1: g.x / 2, z1: -g.z / 2 + t },
    { x0: -g.x / 2, z0: -g.z / 2, x1: -g.x / 2 + t, z1: g.z / 2 }, { x0: g.x / 2 - t, z0: -g.z / 2, x1: g.x / 2, z1: g.z / 2 },
  ];
  const parts = partitions(g.rooms);
  const sideLabel = (side: Side, x: number, y: number) => (
    <g key={side}><circle cx={x} cy={y} r={11} fill={g.closedSides.includes(side) ? '#fff' : BLUE} stroke={BLUE} /><text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={g.closedSides.includes(side) ? BLUE : '#fff'}>{side}</text></g>
  );
  return (
    <Frame w={W} h={H} title={`Grundriss ${g.title}`} sub={`${g.subtitle} · Außenmaß ${nf(g.x)} × ${nf(g.z)} cm · Maßstab angepasst`}>
      <rect x={X(-g.x / 2)} y={Y(-g.z / 2)} width={g.x * s} height={g.z * s} fill="#fafbfc" />
      {walls.map((w, i) => <rect key={i} x={X(w.x0)} y={Y(w.z0)} width={(w.x1 - w.x0) * s} height={(w.z1 - w.z0) * s} fill="url(#hatch)" stroke={INK} strokeWidth={0.8} />)}
      {parts.map((p, i) => <rect key={`p${i}`} x={X(p.x0)} y={Y(p.z0)} width={(p.x1 - p.x0) * s} height={(p.z1 - p.z0) * s} fill="url(#hatch)" stroke={INK} strokeWidth={0.6} />)}
      {g.openings.map((o) => {
        const along = o.side === 'A' || o.side === 'C';
        const a0 = o.c - o.w / 2, a1 = o.c + o.w / 2;
        const out = o.side === 'A' || o.side === 'B' ? 1 : -1;
        const wallPos = o.side === 'A' ? g.z / 2 : o.side === 'C' ? -g.z / 2 : o.side === 'B' ? g.x / 2 : -g.x / 2;
        const cut = along
          ? <rect x={X(a0)} y={Y(o.side === 'A' ? g.z / 2 - t : -g.z / 2) - 0.5} width={o.w * s} height={t * s + 1} fill="#fff" />
          : <rect x={X(o.side === 'B' ? g.x / 2 - t : -g.x / 2) - 0.5} y={Y(a0)} width={t * s + 1} height={o.w * s} fill="#fff" />;
        if (o.kind === 'grille') {
          return <g key={o.id}>{cut}{along ? <line x1={X(a0)} x2={X(a1)} y1={Y(wallPos - (out * t) / 2)} y2={Y(wallPos - (out * t) / 2)} stroke={BLUE} strokeWidth={2} strokeDasharray="4 3" />
            : <line y1={Y(a0)} y2={Y(a1)} x1={X(wallPos - (out * t) / 2)} x2={X(wallPos - (out * t) / 2)} stroke={BLUE} strokeWidth={2} strokeDasharray="4 3" />}</g>;
        }
        const leaves = o.leaves === 2 ? [[a0, o.w / 2, 1], [a1, o.w / 2, -1]] : [[o.hinge === 'L' ? (along && o.side === 'C' ? a1 : a0) : (along && o.side === 'C' ? a0 : a1), o.w, o.hinge === 'L' ? 1 : -1]];
        return (
          <g key={o.id}>{cut}
            {leaves.map(([h0, lw, dir], i) => {
              const sign = (o.side === 'C' || o.side === 'B') && o.leaves === 1 ? -1 : 1;
              const tip = h0 + dir * sign * lw;
              if (along) {
                const yW = Y(wallPos), yO = Y(wallPos + out * lw);
                return <g key={i} stroke={BLUE} fill="none" strokeWidth={1.1}><line x1={X(h0)} y1={yW} x2={X(h0)} y2={yO} /><path d={`M ${X(h0)} ${yO} A ${lw * s} ${lw * s} 0 0 ${(dir * sign > 0) === (out > 0) ? 0 : 1} ${X(tip)} ${yW}`} strokeDasharray="3 3" /></g>;
              }
              const xW = X(wallPos), xO = X(wallPos + out * lw);
              return <g key={i} stroke={BLUE} fill="none" strokeWidth={1.1}><line x1={xW} y1={Y(h0)} x2={xO} y2={Y(h0)} /><path d={`M ${xO} ${Y(h0)} A ${lw * s} ${lw * s} 0 0 ${(dir * sign > 0) === (out > 0) ? 1 : 0} ${xW} ${Y(tip)}`} strokeDasharray="3 3" /></g>;
            })}
          </g>
        );
      })}
      {g.items.map((it, i) => {
        const f = footprint(it);
        const label = it.kind === 'trafo' ? `Trafo ${nf(c.transformer.powerKva)} kVA` : it.kind === 'ms' ? 'MS' : it.kind === 'ns' ? 'NSHV' : it.kind === 'fw' ? 'FW' : 'Zähler';
        return (
          <g key={i}>
            <rect x={X(f.x0)} y={Y(f.z0)} width={(f.x1 - f.x0) * s} height={(f.z1 - f.z0) * s} fill={ITEM_FILL[it.kind]} stroke={it.clipped ? '#c8321c' : '#5d6773'} strokeWidth={it.clipped ? 2 : 1} strokeDasharray={it.clipped ? '5 3' : undefined} />
            {it.kind === 'ms' && (() => {
              const offs = fieldOffsets(c.mv.fields, c.mv.vendorId); const tot = offs.reduce((a, o) => a + o.w, 0) || 1; const k = it.w / tot;
              const alongX = it.face === 'A' || it.face === 'C';
              return offs.map(({ field, x, w }, j) => {
                const ft = MV_FIELD_TYPES.find((q) => q.id === field.type)!;
                const p0 = -it.w / 2 + x * k, p1 = p0 + w * k;
                const flip = it.face === 'C' || it.face === 'B' ? -1 : 1;
                return alongX
                  ? <g key={j}><rect x={X(it.x + flip * (flip > 0 ? p0 : p1))} y={Y(f.z0)} width={w * k * s} height={(f.z1 - f.z0) * s} fill="none" stroke="#8fa6bd" strokeWidth={0.7} /><text x={X(it.x + flip * (p0 + p1) / 2)} y={Y(it.z) + 4} textAnchor="middle" fontSize={Math.min(12, w * k * s * 0.6)} fontWeight={700} fill={ft.color}>{ft.short}</text></g>
                  : (() => { const zc = it.z + (it.face === 'D' ? 1 : -1) * ((p0 + p1) / 2); return <g key={j}><rect x={X(f.x0)} y={Y(zc) - (w * k * s) / 2} width={(f.x1 - f.x0) * s} height={w * k * s} fill="none" stroke="#8fa6bd" strokeWidth={0.7} /><text x={X(it.x)} y={Y(zc) + 4} textAnchor="middle" fontSize={Math.min(12, w * k * s * 0.6)} fontWeight={700} fill={ft.color}>{ft.short}</text></g>; })();
              });
            })()}
            {it.kind !== 'ms' && <text x={X(it.x)} y={Y(it.z) + 4} textAnchor="middle" fontSize={Math.min(13, (f.x1 - f.x0) * s * 0.12 + 7)} fontWeight={600} fill={INK}>{label}</text>}
          </g>
        );
      })}
      {g.rooms.map((r, i) => <text key={`r${i}`} x={X((r.x0 + r.x1) / 2)} y={Y(r.z0) + 14} textAnchor="middle" fontSize={11} fill={GREY} fontWeight={600}>{r.label.toUpperCase()}</text>)}
      <Dim x1={X(-g.x / 2)} y1={Y(g.z / 2)} x2={X(g.x / 2)} y2={Y(g.z / 2)} off={46} label={`${nf(g.x)} cm`} />
      <Dim x1={X(g.x / 2)} y1={Y(-g.z / 2)} x2={X(g.x / 2)} y2={Y(g.z / 2)} off={46} vertical label={`${nf(g.z)} cm`} />
      {g.kind === 'begehbar' && g.rooms.map((r, i) => <Dim key={`d${i}`} x1={X(r.x0)} y1={Y(-g.z / 2)} x2={X(r.x1)} y2={Y(-g.z / 2)} off={-22} label={`${nf(r.x1 - r.x0)}`} />)}
      {sideLabel('A', X(-g.x / 2) - 22, Y(g.z / 2) + 22)}{sideLabel('C', X(-g.x / 2) - 22, Y(-g.z / 2) - 14)}{sideLabel('B', X(g.x / 2) + 22, Y(-g.z / 2) - 14)}{sideLabel('D', X(-g.x / 2) - 22, Y(0))}
      <g transform={`translate(18 ${H - 28})`} fontSize={11} fill={GREY}>
        <text>Seiten: ausgefüllt = mit Öffnungen, hell = geschlossene Seite · Türaufschlag nach außen · rot gestrichelt = Einbau passt nicht</text>
      </g>
    </Frame>
  );
}

/* ---------- Einpoliger Übersichtsschaltplan ---------- */
function FieldSymbol({ f, x, y0, y1, c }: { f: MvField; x: number; y0: number; y1: number; c: Config }) {
  const ft = MV_FIELD_TYPES.find((q) => q.id === f.type)!;
  const sw = (y: number, breaker?: boolean) => breaker
    ? <g><rect x={x - 7} y={y - 7} width={14} height={14} fill="#fff" stroke={INK} /><line x1={x - 5} y1={y - 5} x2={x + 5} y2={y + 5} stroke={INK} /><line x1={x + 5} y1={y - 5} x2={x - 5} y2={y + 5} stroke={INK} /></g>
    : <g><line x1={x} y1={y - 10} x2={x + 9} y2={y + 8} stroke={INK} strokeWidth={1.4} /><circle cx={x} cy={y + 10} r={1.8} fill={INK} /><line x1={x - 5} y1={y - 10} x2={x + 5} y2={y - 10} stroke={INK} /></g>;
  const earth = (y: number) => <g stroke={INK}><line x1={x} y1={y} x2={x - 16} y2={y} /><line x1={x - 16} y1={y} x2={x - 16} y2={y + 8} /><line x1={x - 22} y1={y + 8} x2={x - 10} y2={y + 8} /><line x1={x - 20} y1={y + 11} x2={x - 12} y2={y + 11} /><line x1={x - 18} y1={y + 14} x2={x - 14} y2={y + 14} /></g>;
  const ct = (y: number) => <g fill="none" stroke={INK}><circle cx={x} cy={y} r={6} /><circle cx={x} cy={y + 7} r={6} /></g>;
  return (
    <g>
      <line x1={x} y1={y0} x2={x} y2={y1} stroke={INK} strokeWidth={1.2} />
      <rect x={x - 22} y={y0 - 34} width={44} height={20} rx={4} fill={ft.color} />
      <text x={x} y={y0 - 20} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">{ft.short}</text>
      {f.type === 'K' && <>{sw(y0 + 34)}{earth(y0 + 66)}<path d={`M ${x - 6} ${y1 - 12} L ${x} ${y1} L ${x + 6} ${y1 - 12}`} fill="none" stroke={INK} /><text x={x} y={y1 + 16} textAnchor="middle" fontSize={10.5} fill={GREY}>Kabel</text></>}
      {f.type === 'T' && <>{sw(y0 + 34)}<rect x={x - 5} y={y0 + 62} width={10} height={24} fill="#fff" stroke={INK} /><line x1={x} y1={y0 + 62} x2={x} y2={y0 + 86} stroke={INK} />{earth(y0 + 98)}</>}
      {(f.type === 'LS' || f.type === 'UE') && <>{sw(y0 + 32)}{sw(y0 + 64, true)}{ct(y0 + 88)}<rect x={x + 14} y={y0 + 80} width={34} height={20} fill="#fff" stroke={INK} /><text x={x + 31} y={y0 + 94} textAnchor="middle" fontSize={9.5}>{c.mv.protection === 'umz_qu' ? 'I> QU' : 'I>'}</text><line x1={x + 6} y1={y0 + 91} x2={x + 14} y2={y0 + 91} stroke={INK} strokeDasharray="2 2" />{earth(y0 + 112)}</>}
      {f.type === 'M' && <>{sw(y0 + 34)}{ct(y0 + 66)}<circle cx={x} cy={y0 + 100} r={8} fill="#fff" stroke={INK} /><line x1={x - 4} y1={y0 + 100} x2={x + 4} y2={y0 + 100} stroke={INK} /><rect x={x + 14} y={y0 + 70} width={30} height={18} fill="#fff" stroke={INK} /><text x={x + 29} y={y0 + 83} textAnchor="middle" fontSize={9.5}>kWh</text></>}
      {f.type === 'LT' && <>{sw(y0 + 34)}<text x={x} y={y1 + 16} textAnchor="middle" fontSize={10.5} fill={GREY}>Kupplung</text></>}
    </g>
  );
}

export function SingleLine({ c, d }: { c: Config; d: Derived }) {
  const W = 1000, H = 700;
  const fields = c.mv.fields;
  const t = c.transformer, e = d.elec;
  const pitch = Math.min(96, (W - 160) / Math.max(1, fields.length));
  const x0 = (W - pitch * Math.max(1, fields.length)) / 2 + pitch / 2;
  const busY = 120, fieldEnd = 270;
  const feederIdx = fields.map((f, i) => (f.type === 'T' || f.type === 'LS' ? i : -1)).filter((i) => i >= 0).slice(0, t.count);
  const trafoXs = feederIdx.length ? feederIdx.map((i) => x0 + i * pitch) : t.count > 0 ? [W / 2] : [];
  const lv = c.lv;
  const groups = [
    { n: lv.acbFeeders, label: 'LS-Abgang', a: '≥ 800 A' }, { n: lv.nh3, label: 'NH3', a: '630 A' }, { n: lv.nh2, label: 'NH2', a: '400 A' },
    { n: lv.nh1, label: 'NH1', a: '250 A' }, { n: lv.nh00, label: 'NH00', a: '160 A' },
  ].filter((q) => q.n > 0);
  const lvY = 470, lvX0 = 140, lvX1 = W - 120;
  const v = mvVendor(c.mv.vendorId);
  return (
    <Frame w={W} h={H} title="Einpoliger Übersichtsschaltplan" sub={`${t.count > 0 ? `${t.count} × ${nf(t.powerKva)} kVA · ` : ''}${t.primaryKv} kV${t.count > 0 ? ` / ${t.secondaryV} V` : ''} · MS-Anlage ${v.vendor} ${v.product} · ${c.mv.ikKa} kA`}>
      {fields.length > 0 ? (
        <>
          <line x1={x0 - pitch / 2 + 6} y1={busY} x2={x0 + (fields.length - 0.5) * pitch - 6} y2={busY} stroke={INK} strokeWidth={4} />
          <text x={x0 - pitch / 2} y={busY - 44} fontSize={11.5} fill={GREY}>Mittelspannung {t.primaryKv} kV</text>
          {fields.map((f, i) => <FieldSymbol key={f.id} f={f} c={c} x={x0 + i * pitch} y0={busY} y1={f.type === 'T' || f.type === 'LS' ? (feederIdx.includes(i) ? 300 : fieldEnd) : fieldEnd} />)}
        </>
      ) : <text x={W / 2} y={busY} textAnchor="middle" fill={GREY}>Keine Mittelspannungsfelder konfiguriert</text>}
      {trafoXs.map((tx, i) => (
        <g key={i}>
          {!feederIdx.length && <line x1={tx} y1={busY} x2={tx} y2={300} stroke={INK} strokeWidth={1.2} />}
          <circle cx={tx} cy={318} r={19} fill="none" stroke={INK} strokeWidth={1.4} /><circle cx={tx} cy={344} r={19} fill="none" stroke={INK} strokeWidth={1.4} />
          <text x={tx + 30} y={322} fontSize={11.5} fontWeight={700}>T{i + 1} · {nf(t.powerKva)} kVA</text>
          <text x={tx + 30} y={337} fontSize={10.5} fill={GREY}>{t.primaryKv}/{nf(t.secondaryV / 1000, 2)} kV · {t.vectorGroup} · uk {t.ukPercent} %</text>
          <text x={tx + 30} y={351} fontSize={10.5} fill={GREY}>{t.type === 'giessharz' ? 'Gießharz' : t.type === 'ester' ? 'Ester' : 'Öl'}{t.ront ? ' · rONT' : ''}</text>
          <line x1={tx} y1={363} x2={tx} y2={lvY} stroke={INK} strokeWidth={1.2} />
          {lv.incomer === 'leistungsschalter'
            ? <g><rect x={tx - 8} y={405} width={16} height={16} fill="#fff" stroke={INK} /><line x1={tx - 6} y1={407} x2={tx + 6} y2={419} stroke={INK} /><line x1={tx + 6} y1={407} x2={tx - 6} y2={419} stroke={INK} /></g>
            : lv.incomer === 'nh' ? <rect x={tx - 5} y={398} width={10} height={24} fill="#fff" stroke={INK} />
            : <g><line x1={tx} y1={398} x2={tx + 9} y2={416} stroke={INK} strokeWidth={1.4} /></g>}
          <text x={tx + 14} y={418} fontSize={10.5} fill={GREY}>{nf(e.incomerA)} A</text>
          {lv.billingMeters > i && <g><circle cx={tx} cy={440} r={6} fill="none" stroke={INK} /><rect x={tx - 58} y={432} width={36} height={17} fill="#fff" stroke={INK} /><text x={tx - 40} y={444} textAnchor="middle" fontSize={9.5}>kWh</text><line x1={tx - 22} y1={440} x2={tx - 6} y2={440} stroke={INK} strokeDasharray="2 2" /></g>}
        </g>
      ))}
      {t.count > 0 && (
        <>
          <line x1={lvX0} y1={lvY} x2={lvX1} y2={lvY} stroke={INK} strokeWidth={4} />
          {t.count > 1 && trafoXs.slice(1).map((tx, i) => { const mx = (trafoXs[i] + tx) / 2; return <g key={i}><rect x={mx - 7} y={lvY - 7} width={14} height={14} fill="#fff" stroke={INK} /><text x={mx} y={lvY - 12} textAnchor="middle" fontSize={10} fill={GREY}>Kupplung</text></g>; })}
          <text x={lvX0} y={lvY - 12} fontSize={11.5} fill={GREY}>Niederspannung {t.secondaryV} V · {lv.design === 'offen' ? 'offene Bauweise' : 'gekapselt'}</text>
          {(() => {
            const total = groups.reduce((a, q) => a + Math.min(q.n, 8), 0) + (lv.reserve ? 1 : 0) + (lv.streetLighting ? 1 : 0) + (lv.tempPower ? 1 : 0) + (lv.compensationKvar ? 1 : 0) + (lv.surgeProtection ? 1 : 0);
            const p = Math.min(34, (lvX1 - lvX0 - 30) / Math.max(1, total));
            let xx = lvX0 + 20; const out: ReactNode[] = [];
            groups.forEach((q, gi) => {
              const n = Math.min(q.n, 8), start = xx;
              for (let k = 0; k < n; k++) { out.push(<g key={`${gi}-${k}`}><line x1={xx} y1={lvY} x2={xx} y2={lvY + 70} stroke={INK} /><rect x={xx - 4} y={lvY + 18} width={8} height={20} fill="#fff" stroke={INK} /><path d={`M ${xx - 4} ${lvY + 62} L ${xx} ${lvY + 70} L ${xx + 4} ${lvY + 62}`} fill="none" stroke={INK} /></g>); xx += p; }
              out.push(<text key={`l${gi}`} x={(start + xx - p) / 2} y={lvY + 90} textAnchor="middle" fontSize={11} fontWeight={700}>{q.n} × {q.label}</text>, <text key={`a${gi}`} x={(start + xx - p) / 2} y={lvY + 104} textAnchor="middle" fontSize={10} fill={GREY}>{q.a}{q.n > 8 ? ' (gekürzt)' : ''}</text>);
              xx += p * 0.6;
            });
            const extra = (label: string, sym: ReactNode) => { out.push(<g key={label}><line x1={xx} y1={lvY} x2={xx} y2={lvY + 46} stroke={INK} />{sym}<text x={xx} y={lvY + 90} textAnchor="middle" fontSize={10} fill={GREY}>{label}</text></g>); xx += p * 1.6; };
            if (lv.streetLighting) extra('Str.-Bel.', <rect x={xx - 4} y={lvY + 18} width={8} height={20} fill="#fff" stroke={INK} />);
            if (lv.tempPower) extra('Baustrom', <circle cx={xx} cy={lvY + 50} r={5} fill="none" stroke={INK} />);
            if (lv.compensationKvar) extra(`${lv.compensationKvar} kvar`, <g stroke={INK}><line x1={xx - 8} y1={lvY + 46} x2={xx + 8} y2={lvY + 46} /><line x1={xx - 8} y1={lvY + 52} x2={xx + 8} y2={lvY + 52} /></g>);
            if (lv.surgeProtection) extra('ÜSS', <rect x={xx - 5} y={lvY + 30} width={10} height={16} fill="#fff" stroke={INK} />);
            if (lv.reserve) extra(`${lv.reserve} × Reserve`, <line x1={xx - 6} y1={lvY + 46} x2={xx + 6} y2={lvY + 46} stroke={INK} strokeDasharray="2 2" />);
            return out;
          })()}
        </>
      )}
      <text x={18} y={H - 20} fontSize={11} fill={GREY}>Vereinfachte Darstellung zur Abstimmung – kein Stromlaufplan. Ik an den US-Klemmen ca. {nf(e.ikLvKa, 1)} kA{t.count > 1 ? ' je Transformator' : ''}.</text>
    </Frame>
  );
}

/* ---------- Aufstellung / Baugrube ---------- */
export function SitePlan({ c, d }: { c: Config; d: Derived }) {
  const g = d.geometry, ex = d.excavation;
  const W = 1000, H = 700;
  const ringOff = 100;
  const spanX = ex.topX + 2 * 150, spanZ = ex.topZ + 2 * 150;
  const s = Math.min(470 / spanX, 520 / spanZ);
  const cx = 270, cy = 360;
  const X = (x: number) => cx + x * s, Y = (z: number) => cy + z * s;
  // Schnitt
  const sx0 = 560, sx1 = 975, sW = sx1 - sx0;
  const ss = Math.min(sW / (ex.topX + 120), 300 / (g.hVisible + ex.depth + 60));
  const scx = (sx0 + sx1) / 2, gy = 300;
  const SX = (x: number) => scx + x * ss, SY = (y: number) => gy - y * ss;
  return (
    <Frame w={W} h={H} title="Aufstellung und Baugrube" sub={`Grundlage: GRÄPER-Aushubskizze · Arbeitsraum ${ex.workSpace} cm · zul. Bodenpressung 200 kN/m²`}>
      <text x={40} y={78} fontSize={12.5} fontWeight={700}>Draufsicht</text>
      <rect x={X(-ex.topX / 2 - 100)} y={Y(-ex.topZ / 2 - 100)} width={(ex.topX + 200) * s} height={(ex.topZ + 200) * s} fill="none" stroke="#c9b28c" strokeDasharray="6 4" />
      <rect x={X(-ex.topX / 2)} y={Y(-ex.topZ / 2)} width={ex.topX * s} height={ex.topZ * s} fill="url(#soil)" stroke="#8c6f4e" />
      <rect x={X(-ex.bottomX / 2)} y={Y(-ex.bottomZ / 2)} width={ex.bottomX * s} height={ex.bottomZ * s} fill="url(#sand)" stroke="#a88f74" />
      <rect x={X(-g.x / 2)} y={Y(-g.z / 2)} width={g.x * s} height={g.z * s} fill="#dfe8f1" stroke={BLUE} strokeWidth={1.6} />
      <text x={X(0)} y={Y(0) + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={BLUE}>{g.title}</text>
      {g.kind !== 'trafostand' && <rect x={X(-g.x / 2 - ringOff)} y={Y(-g.z / 2 - ringOff)} width={(g.x + 2 * ringOff) * s} height={(g.z + 2 * ringOff) * s} fill="none" stroke="#2e8b57" strokeWidth={1.4} strokeDasharray="10 4 2 4" />}
      <Dim x1={X(-ex.topX / 2)} y1={Y(ex.topZ / 2)} x2={X(ex.topX / 2)} y2={Y(ex.topZ / 2)} off={150 * s + 18} label={`${nf(ex.topX)} cm`} />
      <Dim x1={X(-g.x / 2)} y1={Y(-g.z / 2)} x2={X(g.x / 2)} y2={Y(-g.z / 2)} off={-(ex.topZ - g.z) / 2 * s - 20} label={`${nf(g.x)}`} />
      <Dim x1={X(ex.topX / 2)} y1={Y(-ex.topZ / 2)} x2={X(ex.topX / 2)} y2={Y(ex.topZ / 2)} off={150 * s + 10} vertical label={`${nf(ex.topZ)} cm`} />
      {g.kind !== 'trafostand' && <text x={X(-g.x / 2 - ringOff)} y={Y(g.z / 2 + ringOff) + 14} fontSize={10.5} fill="#2e8b57">Ringerder ca. {ex.earthRingM} m, Abstand ca. 1 m</text>}
      <text x={X(-ex.topX / 2 - 100)} y={Y(-ex.topZ / 2 - 100) - 6} fontSize={10.5} fill="#8c6f4e">1 m tragfähiger Arbeitsstreifen</text>
      <text x={40} y={H - 92} fontSize={11} fill={GREY}><tspan fill="#a88f74">■</tspan> Sohle/Feinplanum  <tspan fill="#8c6f4e">■</tspan> Böschung  <tspan fill={BLUE}>■</tspan> Station  <tspan fill="#2e8b57">–·–</tspan> Erdung</text>

      <text x={sx0} y={78} fontSize={12.5} fontWeight={700}>Schnitt</text>
      <polygon points={`${SX(-ex.topX / 2 - 60)},${SY(0)} ${SX(-ex.topX / 2)},${SY(0)} ${SX(-ex.bottomX / 2)},${SY(-ex.depth)} ${SX(ex.bottomX / 2)},${SY(-ex.depth)} ${SX(ex.topX / 2)},${SY(0)} ${SX(ex.topX / 2 + 60)},${SY(0)} ${SX(ex.topX / 2 + 60)},${SY(-ex.depth - 40)} ${SX(-ex.topX / 2 - 60)},${SY(-ex.depth - 40)}`} fill="url(#soil)" stroke="#8c6f4e" />
      <rect x={SX(-ex.bottomX / 2)} y={SY(-g.buried)} width={ex.bottomX * ss} height={ex.bedThickness * ss} fill="url(#sand)" stroke="#a88f74" />
      <rect x={SX(-g.x / 2)} y={SY(g.hVisible)} width={g.x * ss} height={(g.hVisible + g.buried) * ss} fill="#dfe8f1" stroke={BLUE} strokeWidth={1.6} />
      <line x1={sx0 - 5} y1={SY(0)} x2={sx1 + 5} y2={SY(0)} stroke="#5f8a4a" strokeWidth={2} />
      <text x={sx1} y={SY(0) - 6} textAnchor="end" fontSize={11} fill="#5f8a4a">OK Gelände ± 0,00</text>
      <Dim x1={SX(-g.x / 2)} y1={SY(0)} x2={SX(-g.x / 2)} y2={SY(-g.buried)} off={-24} vertical label={`−${nf(g.buried)}`} />
      <Dim x1={SX(g.x / 2)} y1={SY(g.hVisible)} x2={SX(g.x / 2)} y2={SY(0)} off={28} vertical label={`+${nf(g.hVisible)}`} />
      <Dim x1={SX(-ex.bottomX / 2)} y1={SY(-ex.depth)} x2={SX(ex.bottomX / 2)} y2={SY(-ex.depth)} off={34} label={`Sohle ${nf(ex.bottomX)} cm`} />
      <text x={SX(0)} y={SY(-g.buried) + ex.bedThickness * ss / 2 + 4} textAnchor="middle" fontSize={10} fill="#7d6640">Sandbett {ex.bedThickness} cm</text>
      <foreignObject x={sx0 - 10} y={420} width={sW + 20} height={240}>
        <div style={{ fontSize: 11.5, color: INK, lineHeight: 1.45 }}>
          <b>Hinweise zur Gründung</b>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>{ex.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          <div style={{ marginTop: 6 }}>Aushub ca. {nf(ex.volumeM3, 1)} m³ · Sandbett ca. {nf(ex.bedM3, 1)} m³ · Wiederverfüllung ca. {nf(ex.backfillM3, 1)} m³</div>
        </div>
      </foreignObject>
      <text x={18} y={H - 20} fontSize={11} fill={GREY}>Erdaushub nur hinter der Baugrube lagern · Zufahrt für ca. 12 t Achslast · Schwenkbereich des Krans freihalten · {c.site.unloading === 'autokran' ? 'Autokran erforderlich' : 'Entladung mit Lkw-Ladekran'}</text>
    </Frame>
  );
}

export function lvWidth(c: Config, d: Derived) { return lvSize(c, d.elec.inLv).w; }
export const roomLabel = ROOM_LABEL;
