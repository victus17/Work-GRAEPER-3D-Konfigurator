import { ExternalLink, Plus, Trash2, Wand2 } from 'lucide-react';
import { useStore } from '../state/store';
import { cx, Badge, Cards, Field, KV, Meter, Num, Section, Seg, Select, Toggle, Info } from '../ui/kit';
import { COMPACT_STATIONS, PROFESSIONAL, TRAFOSTAENDE, compactById, INDIVIDUAL } from '../data/stations';
import { FLOOR_BUILDS, FLOOR_FINISHES, ROOF_FORMS, WALL_BUILDS } from '../data/options';
import { useCase } from '../data/usecases';
import { ROOM_LABEL, walkInRooms } from '../domain/layout';
import type { RoomKind } from '../domain/types';
import { StepFindings } from './common';
import { nf } from '../lib/format';

function CompactList() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const update = useStore((s) => s.update);
  const ranked = d.ranking;
  return (
    <>
      <Toggle checked={c.building.autoSelect} onChange={(v) => update((x) => { x.building.autoSelect = v; })} label="Kleinste passende Station automatisch wählen" text="Bei jeder Änderung der Ausrüstung wird der Typ neu bestimmt." />
      <div style={{ marginTop: 10 }}>
        {ranked.map((r) => {
          const s = r.station, on = s.id === c.building.compactId;
          return (
            <button key={s.id} type="button" className={cx('stn', on && 'on', r.level === 'no' && 'no')} onClick={() => update((x) => { x.building.compactId = s.id; x.building.autoSelect = false; })}>
              <div className="stn-head">
                <span className="stn-name">{s.name}</span>
                {r.level === 'ok' && <Badge kind="ok">passt</Badge>}{r.level === 'warn' && <Badge kind="warn">mit Hinweisen</Badge>}{r.level === 'no' && <Badge kind="error">passt nicht</Badge>}
                {s.status === 'auslaufend' && <Badge kind="grey">auslaufend</Badge>}{s.status === 'angekuendigt' && <Badge kind="info">ab Q1/2027</Badge>}
                {on && c.building.autoSelect && <Badge kind="blue">automatisch</Badge>}
                <span className="stn-dims">{nf(s.x)} × {nf(s.z)} cm · {s.maxKva ? `bis ${nf(s.optKva ?? s.maxKva)} kVA` : 'ohne Trafo'}</span>
              </div>
              <div className="stn-claim">{s.claim}</div>
              <div className="stn-bars">
                <Meter value={r.usage.trafo} label="Trafo" right={s.maxKva ? `${nf(r.usage.trafo * 100)} %` : '–'} />
                <Meter value={r.usage.mv} label="MS" right={`${nf(r.usage.mv * 100)} %`} />
                <Meter value={r.usage.lv} label="NS" right={s.lv ? `${nf(r.usage.lv * 100)} %` : '–'} />
              </div>
              {r.reasons.length > 0 && (on || r.level !== 'ok') && <ul className="stn-reasons" style={{ margin: 0, padding: 0 }}>{r.reasons.slice(0, on ? 6 : 2).map((x, i) => <li key={i} className={x.level}>{x.text}</li>)}</ul>}
            </button>
          );
        })}
      </div>
    </>
  );
}

function CompactDetails() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const update = useStore((s) => s.update);
  const s = compactById(c.building.compactId);
  return (
    <Section title={`${s.name} – ${s.title}`} aside={<a className="btn sm ghost" href={s.page} target="_blank" rel="noreferrer">Produktseite <ExternalLink size={13} /></a>}>
      <div className="box" style={{ marginBottom: 10 }}>
        <KV rows={[
          ['Stationsmaße (L × B × H)', `${nf(s.x)} × ${nf(s.z)} × ${nf(s.h, 1)} cm`],
          ['Transformator', s.trafoMax ? `bis ${nf(s.maxKva)} kVA${s.optKva ? ` (optional ${nf(s.optKva)})` : ''} · max. ${s.trafoMax.l} × ${s.trafoMax.b} × ${s.trafoMax.h} cm` : '–'],
          ['MS-Anlage', `max. ${s.mv.maxFields} Felder · ${s.mv.box.w} × ${s.mv.box.h} × ${s.mv.box.d} cm${s.mv.metering ? ' · Messfeld möglich' : ''}`],
          ['NS-Verteilung', s.lv ? `max. ${s.lv.maxStrips} Leisten ${s.lv.stripNote}${s.lv.billing ? ' · Verrechnungsmessung möglich' : ''}` : '–'],
          ['Fernwirkraum', s.fw ? `${s.fw.box.w} × ${s.fw.box.h} × ${s.fw.box.d} cm${s.fw.optional ? ' (optional)' : ''}` : 'nein'],
          ['Bebaute Fläche / Aufstellfläche', `${nf(s.builtArea, 2)} / ${nf(s.installArea, 2)} m²`],
          ['Gewicht ohne / mit E-Ausbau', `${nf(s.weightEmptyT, 1)} t / ${nf(s.weightEquippedT, 1)} t`],
          ['Anhebeanker Dach / Station', `${s.anchorsRoof} / ${s.anchorsStation}`],
          ['Geschlossene Seiten', s.closedSides.length ? s.closedSides.join(', ') : 'keine'],
        ]} />
      </div>
      <ul className="small" style={{ margin: '0 0 10px', paddingLeft: 18, color: 'var(--ink-2)' }}>{s.features.map((f) => <li key={f}>{f}</li>)}</ul>
      {s.docs.length > 0 && <div className="chips" style={{ marginBottom: 12 }}>{s.docs.map((doc) => <a key={doc.url} className="chip" href={doc.url} target="_blank" rel="noreferrer">{doc.label} (PDF)</a>)}</div>}
      <Field label="Betonart" info="leichtbeton"><Seg value={c.building.concrete} onChange={(v) => update((x) => { x.building.concrete = v; })} options={[{ id: 'leicht', label: 'Leichtbeton' }, { id: 'normal', label: 'Normalbeton', disabled: !s.concreteOptions.includes('normal'), reason: 'Typ nur in Leichtbeton lieferbar' }]} /></Field>
      {s.fw?.optional && <Toggle checked={c.building.fwRoom} onChange={(v) => update((x) => { x.building.fwRoom = v; })} label="Fernwirkraum vorsehen" info="fernwirk" text={s.fw.reducesStripsTo ? `reduziert die NS-Verteilung auf ${s.fw.reducesStripsTo} Leisten` : 'zusätzlicher Schrank für Sekundärtechnik'} />}
      {s.ventRing > 0 && <p className="small muted">Mit Lüfterkranz ({s.ventRing} cm) für hohe Verlustleistungen. <Info term="luefterkranz" /></p>}
      <p className="small muted">Gesamtgewicht dieser Konfiguration ca. {nf(d.weights.totalT ?? 0, 1)} t (Katalogwert mit E-Ausbau {nf(s.weightEquippedT, 1)} t).</p>
    </Section>
  );
}

function WalkIn() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const update = useStore((s) => s.update);
  const fix = useStore((s) => s.fix);
  const w = c.building.walkIn;
  const { clearL, clearW } = walkInRooms(c);
  const kinds: RoomKind[] = ['ms', 'trafo', 'ns', 'fw', 'zaehler', 'technik'];
  return (
    <>
      <Section title="Produktlinie" info="systeme">
        <Cards value={w.system} onChange={(v) => update((x) => { x.building.walkIn.system = v; if (v === 'professional' && x.building.walkIn.cellarCm === 0) x.building.walkIn.cellarCm = 78; })} options={[
          { id: 'serie', label: 'System Serie', text: 'Fertig entwickelte Stationen mit festem Grundriss – meist ab Lager, kürzeste Lieferzeit.' },
          { id: 'professional', label: 'System Professional', text: 'Längen 3,60–12,00 m im 30-cm-Raster, fünf Breiten 2,54–3,63 m, alle Zwischenböden.' },
          { id: 'individual', label: 'System Individual', text: 'Zentimetergenaue Planung bis 18 × 5 m, freie Dachformen und Oberflächen.' },
        ]} />
      </Section>
      {w.system === 'serie' ? (
        <Section title="Serienstation wählen">
          {d.serieFits.map((f) => (
            <button key={f.serie.id} type="button" className={cx('stn', w.serieId === f.serie.id && 'on', f.level === 'no' && 'no')} onClick={() => update((x) => { x.building.walkIn.serieId = f.serie.id; x.building.walkIn.doorsAuto = true; })}>
              <div className="stn-head">
                <span className="stn-name">{f.serie.name}</span><Badge kind="grey">Typ {f.serie.typ}</Badge>
                {f.level === 'ok' && <Badge kind="ok">passt</Badge>}{f.level === 'warn' && <Badge kind="warn">Hinweis</Badge>}{f.level === 'no' && <Badge kind="error">passt nicht</Badge>}
                <span className="stn-dims">{nf(f.serie.l)} × {nf(f.serie.b)} cm</span>
              </div>
              <div className="stn-claim">{f.serie.note} {f.serie.mvFields202} MS-Felder, {f.serie.rooms.length} Raum/Räume.</div>
              {f.reasons.length > 0 && <ul className="stn-reasons" style={{ margin: 0, padding: 0 }}>{f.reasons.map((r, i) => <li key={i} className={r.level}>{r.text}</li>)}</ul>}
            </button>
          ))}
        </Section>
      ) : (
        <>
          <Section title="Abmessungen" aside={<button type="button" className="btn sm" onClick={() => fix('station.autosize')}><Wand2 size={14} /> Automatisch ermitteln</button>}>
            {w.system === 'professional' ? (
              <>
                <Field label="Länge" hint={`Raster ${PROFESSIONAL.lengthStep} cm, ${PROFESSIONAL.lengthMin}–${PROFESSIONAL.lengthMax} cm`}><Num value={w.lengthCm} min={PROFESSIONAL.lengthMin} max={PROFESSIONAL.lengthMax} step={PROFESSIONAL.lengthStep} unit="cm" width={64} onChange={(v) => update((x) => { x.building.walkIn.lengthCm = v; })} /></Field>
                <Field label="Breite"><Seg value={w.widthCm} onChange={(v) => update((x) => { x.building.walkIn.widthCm = v; })} options={PROFESSIONAL.widths.map((b) => ({ id: b, label: `${nf(b / 100, 2)} m` }))} /></Field>
                <div className="row c2">
                  <Field label="Lichte Raumhöhe"><Seg value={w.roomHeightCm} onChange={(v) => update((x) => { x.building.walkIn.roomHeightCm = v; })} options={PROFESSIONAL.roomHeights.map((h) => ({ id: h, label: `${h} cm` }))} /></Field>
                  <Field label="Lichte Kellerhöhe" info="keller"><Seg value={w.cellarCm} onChange={(v) => update((x) => { x.building.walkIn.cellarCm = v; })} options={PROFESSIONAL.cellarHeights.map((h) => ({ id: h, label: `${h}` }))} /></Field>
                </div>
              </>
            ) : (
              <div className="row c2">
                <Field label="Länge"><Num value={w.lengthCm} min={INDIVIDUAL.lengthMin} max={INDIVIDUAL.lengthMax} step={10} unit="cm" width={64} onChange={(v) => update((x) => { x.building.walkIn.lengthCm = v; })} /></Field>
                <Field label="Breite"><Num value={w.widthCm} min={INDIVIDUAL.widthMin} max={INDIVIDUAL.widthMax} step={5} unit="cm" width={64} onChange={(v) => update((x) => { x.building.walkIn.widthCm = v; })} /></Field>
                <Field label="Lichte Raumhöhe"><Num value={w.roomHeightCm} min={INDIVIDUAL.roomHeightMin} max={INDIVIDUAL.roomHeightMax} step={5} unit="cm" width={64} onChange={(v) => update((x) => { x.building.walkIn.roomHeightCm = v; })} /></Field>
                <Field label="Kellerhöhe (0 = ohne)" info="keller"><Num value={w.cellarCm} min={0} max={INDIVIDUAL.cellarMax} step={5} unit="cm" width={64} onChange={(v) => update((x) => { x.building.walkIn.cellarCm = v; })} /></Field>
              </div>
            )}
            <p className="small muted">Lichte Innenmaße ca. {nf(clearL)} × {nf(clearW)} cm. Bedarf laut Ausrüstung: {nf(d.need.lengthCm)} × {nf(d.need.widthCm)} cm.</p>
          </Section>
          <Section title="Raumaufteilung" hint="von links nach rechts (Ansicht Front)">
            {w.rooms.map((r, i) => (
              <div key={i} className="linefield">
                <span style={{ width: 22, fontWeight: 700, color: 'var(--ink-3)' }}>{i + 1}</span>
                <div style={{ flex: 1 }}><Select value={r} onChange={(v) => update((x) => { x.building.walkIn.rooms[i] = v; x.building.walkIn.doorsAuto = true; })} options={kinds.map((k) => ({ id: k, label: ROOM_LABEL[k] }))} /></div>
                <input type="range" min={8} max={90} value={Math.round(w.roomSplit[i] * 100)} aria-label="Raumanteil" style={{ width: 110 }} onChange={(e) => update((x) => { const s = x.building.walkIn.roomSplit; s[i] = Number(e.target.value) / 100; })} />
                <span className="small num" style={{ width: 54, textAlign: 'right' }}>{nf((clearL * w.roomSplit[i]))} cm</span>
                <button type="button" className="iconbtn" aria-label="Raum entfernen" disabled={w.rooms.length <= 1} onClick={() => update((x) => { x.building.walkIn.rooms.splice(i, 1); x.building.walkIn.roomSplit.splice(i, 1); x.building.walkIn.doorsAuto = true; })}><Trash2 size={15} /></button>
              </div>
            ))}
            <button type="button" className="btn sm" style={{ marginTop: 8 }} disabled={w.rooms.length >= 5} onClick={() => update((x) => { x.building.walkIn.rooms.push('technik'); x.building.walkIn.roomSplit.push(0.25); x.building.walkIn.doorsAuto = true; })}><Plus size={14} /> Raum hinzufügen</button>
          </Section>
          <Section title="Wandaufbau" info="wandaufbau"><Cards value={w.wall} onChange={(v) => update((x) => { x.building.walkIn.wall = v; })} options={WALL_BUILDS.map((b) => ({ id: b.id, label: b.label, text: b.text }))} /></Section>
          <Section title="Dach">
            <Cards cols={3} value={w.roofForm} onChange={(v) => update((x) => { x.building.walkIn.roofForm = v; if (v !== 'flach') x.building.walkIn.roofPitch = ROOF_FORMS.find((r) => r.id === v)!.pitch[1] || 0; })} options={ROOF_FORMS.map((r) => ({ id: r.id, label: r.label }))} />
            <p className="small muted" style={{ marginTop: 6 }}>{ROOF_FORMS.find((r) => r.id === w.roofForm)!.text}</p>
            {(w.roofForm === 'sattel' || w.roofForm === 'walm' || w.roofForm === 'pult') && (() => { const p = ROOF_FORMS.find((r) => r.id === w.roofForm)!.pitch; return <Field label="Dachneigung"><Num value={w.roofPitch} min={p[0]} max={p[2]} unit="°" onChange={(v) => update((x) => { x.building.walkIn.roofPitch = v; })} /></Field>; })()}
            <Toggle checked={w.roofInsulated} onChange={(v) => update((x) => { x.building.walkIn.roofInsulated = v; })} label="Gedämmtes Dach" />
            <Toggle checked={w.roofHood} onChange={(v) => update((x) => { x.building.walkIn.roofHood = v; })} label="Dachhaube (Abluft)" text="Zusätzlicher Abluftquerschnitt über dem Traforaum" />
            <Toggle checked={w.gutter} onChange={(v) => update((x) => { x.building.walkIn.gutter = v; })} label="Regenfallrohr mit freiem Ablauf" />
          </Section>
        </>
      )}
      <Section title="Zwischenboden" info="zwischenboden">
        <Cards value={w.floor} onChange={(v) => update((x) => { x.building.walkIn.floor = v; })} options={FLOOR_BUILDS.map((f) => ({ id: f.id, label: f.label, text: f.text }))} />
        <div style={{ marginTop: 10 }}><Field label="Bodenbelag"><Select value={w.floorFinish} onChange={(v) => update((x) => { x.building.walkIn.floorFinish = v; })} options={FLOOR_FINISHES} /></Field></div>
      </Section>
      <Section title="Beton"><Seg value={c.building.concrete} onChange={(v) => update((x) => { x.building.concrete = v; })} options={[{ id: 'leicht', label: 'Leichtbeton' }, { id: 'normal', label: 'Normalbeton' }]} /></Section>
    </>
  );
}

export function StepStation() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const update = useStore((s) => s.update);
  const uc = useCase(c.useCase);
  const kind = c.building.kind;
  return (
    <>
      {kind !== 'trafostand' && (
        <Section title="Bauform">
          <Seg value={kind} onChange={(v) => update((x) => { x.building.kind = v; if (v === 'begehbar') x.building.walkIn.doorsAuto = true; })} options={[
            { id: 'kompakt', label: 'Kompaktstation', disabled: !uc.electrical, reason: 'Für diese Anwendung nur begehbar' },
            { id: 'begehbar', label: 'Begehbare Station' },
          ]} />
          <p className="small muted" style={{ marginTop: 6 }}>{kind === 'kompakt' ? 'Bedienung von außen, kleine Stellfläche, komplett anschlussfertig.' : 'Bedienung im Gebäude, Platz für mehrere Transformatoren und umfangreiche Technik.'} <Info term={kind === 'kompakt' ? 'kompaktstation' : 'begehbar'} /></p>
        </Section>
      )}
      {kind === 'kompakt' && <><Section title="Passende Kompaktstation" hint={`${d.ranking.filter((r) => r.level !== 'no').length} von ${COMPACT_STATIONS.length} Typen geeignet`}><CompactList /></Section><CompactDetails /></>}
      {kind === 'begehbar' && <WalkIn />}
      {kind === 'trafostand' && (
        <Section title="Trafostand wählen" text="Dreiteilige Fertigteil-Transformatorenstände aus öl- und wasserdichtem Beton C 35/45 (FD-Beton). Individuelle Abmessungen auf Anfrage.">
          <Cards value={c.building.trafostandId} onChange={(v) => update((x) => { x.building.trafostandId = v; })} options={TRAFOSTAENDE.map((t) => ({ id: t.id, label: t.name, text: `${nf(t.l)} × ${nf(t.b)} cm · Auffangvolumen ${t.volumeM3} m³ · Wannenhöhe ${t.tubHeight} cm` }))} />
        </Section>
      )}
      <StepFindings step="station" />
    </>
  );
}
