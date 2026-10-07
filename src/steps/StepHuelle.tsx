import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../state/store';
import { cx, Cards, Field, LineField, Num, RalPicker, Section, Seg, Select, Toggle, Info } from '../ui/kit';
import { CABLE_ENTRIES, CLINKER_TONES, DESIGN_PRESETS, DOOR_MATERIALS, DOOR_SIZES, DOOR_VENTS, GRILLE_SIZES, SECURITY_LEVELS, SURFACES } from '../data/options';
import { autoDoors, SIDE_LABEL } from '../domain/layout';
import { uid } from '../domain/defaults';
import type { Side } from '../domain/types';
import { StepFindings } from './common';
import { ralHex } from '../data/ral';

const SIDES: Side[] = ['A', 'B', 'C', 'D'];

function DoorEditor() {
  const c = useStore((s) => s.config);
  const update = useStore((s) => s.update);
  const w = c.building.walkIn;
  const takeOver = () => update((x) => { const a = autoDoors(x); x.building.walkIn.doors = a.doors; x.building.walkIn.grilles = a.grilles; x.building.walkIn.doorsAuto = false; });
  return (
    <Section title="Türen und Lüftungsgitter" hint="Position 0 % = links, Blick von außen">
      <Toggle checked={w.doorsAuto} onChange={(v) => (v ? update((x) => { x.building.walkIn.doorsAuto = true; }) : takeOver())} label="Automatisch passend zur Raumaufteilung anordnen" text="Ausschalten, um Türen und Gitter einzeln festzulegen" />
      {!w.doorsAuto && (
        <>
          {w.doors.map((dd, i) => (
            <div key={dd.id} className="box" style={{ margin: '8px 0', padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <b style={{ flex: 1, fontSize: 13 }}>Tür {i + 1}</b>
                <button type="button" className="iconbtn" aria-label="Tür entfernen" onClick={() => update((x) => { x.building.walkIn.doors.splice(i, 1); })}><Trash2 size={15} /></button>
              </div>
              <div className="row c2">
                <Field label="Seite"><Select value={dd.side} onChange={(v) => update((x) => { x.building.walkIn.doors[i].side = v; })} options={SIDES.map((s) => ({ id: s, label: SIDE_LABEL[s] }))} /></Field>
                <Field label="Lichtmaß"><Select value={`${dd.w}x${dd.h}`} onChange={(v) => update((x) => { const [a, b] = v.split('x').map(Number); x.building.walkIn.doors[i].w = a; x.building.walkIn.doors[i].h = b; x.building.walkIn.doors[i].leaves = a >= 150 ? 2 : 1; })} options={DOOR_SIZES.map((s) => ({ id: `${s.w}x${s.h}`, label: `${(s.w / 100).toFixed(2).replace('.', ',')} × ${(s.h / 100).toFixed(2).replace('.', ',')} m` }))} /></Field>
                <Field label="Lüftung"><Select value={dd.vent} onChange={(v) => update((x) => { x.building.walkIn.doors[i].vent = v; })} options={DOOR_VENTS} /></Field>
                <Field label="Anschlag"><Seg value={dd.hinge} onChange={(v) => update((x) => { x.building.walkIn.doors[i].hinge = v; })} options={[{ id: 'L', label: 'Links' }, { id: 'R', label: 'Rechts' }]} /></Field>
              </div>
              <Field label={`Position ${Math.round(dd.pos * 100)} %`}><input type="range" min={5} max={95} value={Math.round(dd.pos * 100)} style={{ width: '100%' }} onChange={(e) => update((x) => { x.building.walkIn.doors[i].pos = Number(e.target.value) / 100; })} /></Field>
            </div>
          ))}
          <button type="button" className="btn sm" onClick={() => update((x) => { x.building.walkIn.doors.push({ id: uid('d'), side: 'A', pos: 0.5, w: 100, h: 220, leaves: 1, vent: 'v40', hinge: 'L' }); })}><Plus size={14} /> Tür</button>
          {w.grilles.map((g, i) => (
            <div key={g.id} className="box" style={{ margin: '8px 0', padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><b style={{ flex: 1, fontSize: 13 }}>Lüftungsgitter {i + 1}</b><button type="button" className="iconbtn" aria-label="Gitter entfernen" onClick={() => update((x) => { x.building.walkIn.grilles.splice(i, 1); })}><Trash2 size={15} /></button></div>
              <div className="row c2">
                <Field label="Seite"><Select value={g.side} onChange={(v) => update((x) => { x.building.walkIn.grilles[i].side = v; })} options={SIDES.map((s) => ({ id: s, label: SIDE_LABEL[s] }))} /></Field>
                <Field label="Maß"><Select value={`${g.w}x${g.h}`} onChange={(v) => update((x) => { const [a, b] = v.split('x').map(Number); x.building.walkIn.grilles[i].w = a; x.building.walkIn.grilles[i].h = b; })} options={GRILLE_SIZES.map((s) => ({ id: `${s.w}x${s.h}`, label: `${s.w} × ${String(s.h).replace('.', ',')} cm` }))} /></Field>
                <Field label="Brüstungshöhe"><Num value={g.sill} max={200} step={5} unit="cm" onChange={(v) => update((x) => { x.building.walkIn.grilles[i].sill = v; })} /></Field>
                <Field label={`Position ${Math.round(g.pos * 100)} %`}><input type="range" min={5} max={95} value={Math.round(g.pos * 100)} style={{ width: '100%' }} onChange={(e) => update((x) => { x.building.walkIn.grilles[i].pos = Number(e.target.value) / 100; })} /></Field>
              </div>
            </div>
          ))}
          <button type="button" className="btn sm" style={{ marginLeft: 6 }} onClick={() => update((x) => { x.building.walkIn.grilles.push({ id: uid('g'), side: 'C', pos: 0.5, w: 100, h: 99.5, sill: 60 }); })}><Plus size={14} /> Lüftungsgitter</button>
        </>
      )}
    </Section>
  );
}

export function StepHuelle() {
  const c = useStore((s) => s.config);
  const update = useStore((s) => s.update);
  const e = c.envelope, b = c.building, p = c.penetrations;
  const surf = SURFACES.find((s) => s.id === e.surface)!;
  const walk = b.kind === 'begehbar';
  return (
    <>
      <Section title="Fassade">
        <Cards cols={2} value={e.surface} onChange={(v) => update((x) => { x.envelope.surface = v; })} options={SURFACES.map((s) => ({ id: s.id, label: s.label, text: s.text, disabled: !!s.walkInOnly && !walk, reason: 'nur bei begehbaren Stationen' }))} />
        {e.surface === 'klinker' && <div className="chips" style={{ marginTop: 10 }}>{CLINKER_TONES.map((t) => <button key={t.id} type="button" className={cx('chip', e.clinkerTone === t.id && 'on')} onClick={() => update((x) => { x.envelope.clinkerTone = t.id; })}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: t.hex, marginRight: 6 }} />{t.label}</button>)}</div>}
      </Section>
      <Section title="Farben" hint="RAL CLASSIC">
        <div className="chips" style={{ marginBottom: 8 }}>
          {DESIGN_PRESETS.map((pr) => (
            <button key={pr.id} type="button" className="chip" onClick={() => update((x) => { x.envelope.bodyRal = pr.body; x.envelope.roofRal = pr.roof; x.envelope.plinthRal = pr.plinth; x.envelope.doorFinish = pr.door; x.envelope.doorRal = pr.doorRal; })}>
              <span style={{ display: 'inline-flex', marginRight: 6, verticalAlign: -1 }}>{[pr.body, pr.plinth, pr.roof].map((r) => <span key={r} style={{ width: 9, height: 11, background: ralHex(r), border: '1px solid rgba(0,0,0,.15)' }} />)}</span>{pr.label}
            </button>
          ))}
        </div>
        {surf.usesRal && <RalPicker label="Fassade" value={e.bodyRal} onChange={(v) => update((x) => { x.envelope.bodyRal = v; })} />}
        <RalPicker label={b.kind === 'kompakt' ? 'Dach' : 'Dach / Attika'} value={e.roofRal} onChange={(v) => update((x) => { x.envelope.roofRal = v; })} />
        <RalPicker label="Sockel" value={e.plinthRal} onChange={(v) => update((x) => { x.envelope.plinthRal = v; })} />
        <Field label="Türen und Gitter"><Seg value={e.doorFinish} onChange={(v) => update((x) => { x.envelope.doorFinish = v; })} options={[{ id: 'eloxiert', label: b.doorMaterial === 'alu' ? 'Alu eloxiert' : 'Naturfarbe' }, { id: 'ral', label: 'RAL-Beschichtung' }]} /></Field>
        {e.doorFinish === 'ral' && <RalPicker label="Türen und Gitter" value={e.doorRal} onChange={(v) => update((x) => { x.envelope.doorRal = v; })} />}
      </Section>
      <Section title="Türen – Material und Sicherheit">
        <Cards value={b.doorMaterial} onChange={(v) => update((x) => { x.building.doorMaterial = v; })} options={DOOR_MATERIALS.map((m) => ({ id: m.id, label: m.label, text: m.text }))} />
        <div style={{ marginTop: 10 }}><Field label="Einbruchhemmung" info="rc"><Seg value={b.security} onChange={(v) => update((x) => { x.building.security = v; if (v !== 'standard' && x.building.doorMaterial === 'alu') x.building.doorMaterial = 'stahl'; })} options={SECURITY_LEVELS.map((s) => ({ id: s.id, label: s.id === 'standard' ? 'Standard' : s.id.toUpperCase(), text: s.text }))} /></Field></div>
        <Field label="Schließsystem"><Select value={b.lockSystem} onChange={(v) => update((x) => { x.building.lockSystem = v; })} options={[{ id: 'pz', label: 'Profilzylinder (Schließanlage des Betreibers)' }, { id: 'doppel', label: 'Doppelschließung Netzbetreiber / Kunde' }, { id: 'schwenkhebel', label: 'Schwenkhebelverschluss' }]} /></Field>
        <Toggle checked={b.panicLocks} onChange={(v) => update((x) => { x.building.panicLocks = v; })} label="Panikfunktion (DIN EN 179)" disabled={!walk} text={walk ? 'Öffnen von innen ohne Schlüssel' : 'nur bei begehbaren Stationen'} />
        <Toggle checked={b.doorMonitoring} onChange={(v) => update((x) => { x.building.doorMonitoring = v; })} label="Verschlussüberwachung" text="Magnet- und Riegelkontakte mit Meldung an Fernwirktechnik" />
      </Section>
      {walk && <DoorEditor />}
      <Section title="Kabel- und Wanddurchführungen" info="hsi">
        <LineField label="MS-Kabeleinführungen" sub={CABLE_ENTRIES[p.mvSystem].label}><Num value={p.mvCount} max={14} onChange={(v) => update((x) => { x.penetrations.mvCount = v; })} /></LineField>
        <div className="row c2" style={{ margin: '6px 0' }}>
          <Select value={p.mvSystem} onChange={(v) => update((x) => { x.penetrations.mvSystem = v; x.penetrations.mvCover = CABLE_ENTRIES[v].covers[0].id; })} options={[{ id: 'HSI150', label: 'HSI150' }, { id: 'HSI90', label: 'HSI90' }]} />
          <Select value={p.mvCover} onChange={(v) => update((x) => { x.penetrations.mvCover = v; })} options={CABLE_ENTRIES[p.mvSystem].covers.map((q) => ({ id: q.id, label: q.label }))} />
        </div>
        <LineField label="NS-Kabeleinführungen" sub={CABLE_ENTRIES[p.lvSystem].label}><Num value={p.lvCount} max={30} onChange={(v) => update((x) => { x.penetrations.lvCount = v; })} /></LineField>
        <div className="row c2" style={{ margin: '6px 0' }}>
          <Select value={p.lvSystem} onChange={(v) => update((x) => { x.penetrations.lvSystem = v; x.penetrations.lvCover = CABLE_ENTRIES[v].covers[0].id; })} options={[{ id: 'HSI150', label: 'HSI150' }, { id: 'HSI90', label: 'HSI90' }]} />
          <Select value={p.lvCover} onChange={(v) => update((x) => { x.penetrations.lvCover = v; })} options={CABLE_ENTRIES[p.lvSystem].covers.map((q) => ({ id: q.id, label: q.label }))} />
        </div>
        <LineField label="Baustromdurchführungen" info="baustrom"><Num value={p.tempPower} max={4} onChange={(v) => update((x) => { x.penetrations.tempPower = v; })} /></LineField>
        <div style={{ margin: '4px 0 8px' }}><Seg value={p.tempPowerSystem} onChange={(v) => update((x) => { x.penetrations.tempPowerSystem = v; })} options={[{ id: 'graeper', label: 'System GRÄPER' }, { id: 'hauff', label: 'Hauff BD 68-K2/100' }]} /></div>
        <LineField label="Erdungsdurchführungen"><Num value={p.earthing} max={6} onChange={(v) => update((x) => { x.penetrations.earthing = v; })} /></LineField>
        <LineField label="LWL-/Steuerkabeleinführungen"><Num value={p.fiber} max={12} onChange={(v) => update((x) => { x.penetrations.fiber = v; })} /></LineField>
        <Toggle checked={p.antenna} onChange={(v) => update((x) => { x.penetrations.antenna = v; })} label="Antennendurchführung" text="Für LTE-/450-MHz-Anbindung der Fernwirktechnik" />
      </Section>
      <Section title="Bauphysik und Schutz">
        <Field label="Feuerwiderstand" info="brandschutz"><Seg value={b.fire} onChange={(v) => update((x) => { x.building.fire = v; })} options={[{ id: 'ohne', label: 'Standard' }, { id: 'rei30', label: 'REI 30' }, { id: 'rei90', label: 'REI 90' }]} /></Field>
        <Toggle checked={b.soundProtection} onChange={(v) => update((x) => { x.building.soundProtection = v; })} label="Erhöhter Schallschutz" text="Schalldämmende Lüftungselemente, Verkleidung" />
        <Toggle checked={b.gasTight} onChange={(v) => update((x) => { x.building.gasTight = v; })} label="Gasdichte Ausführung" text="Gasdichte Trennung der Räume (DVGW G 491)" />
        <Toggle checked={b.slopeInstall} onChange={(v) => update((x) => { x.building.slopeInstall = v; })} label="Hangeinbau" />
        <Toggle checked={b.trafoRails} onChange={(v) => update((x) => { x.building.trafoRails = v; })} label="Trafofahrschienen" />
        <Toggle checked={e.graffitiProtection} onChange={(v) => update((x) => { x.envelope.graffitiProtection = v; })} label="Graffitischutz-Beschichtung" />
        <Toggle checked={e.tubBlack} onChange={(v) => update((x) => { x.envelope.tubBlack = v; })} label="Schwarzanstrich Wanne außen" />
        <Toggle checked={e.tubOilProof} onChange={(v) => update((x) => { x.envelope.tubOilProof = v; })} label="Ölfester Anstrich Wanne innen" />
        <Toggle checked={e.interiorWhite} onChange={(v) => update((x) => { x.envelope.interiorWhite = v; })} label="Innenanstrich weiß" />
        <p className="small muted" style={{ marginTop: 6 }}>Leichtbeton ist nicht brennbar (Baustoffklasse A1). Die erforderliche Feuerwiderstandsdauer ergibt sich aus Abständen und Brandschutzgutachten. <Info term="brandschutz" /></p>
      </Section>
      <StepFindings step="huelle" />
    </>
  );
}
