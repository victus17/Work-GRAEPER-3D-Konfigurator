import { useStore } from '../state/store';
import { Field, KV, Section, Seg, Select, TextInput, Toggle, Info } from '../ui/kit';
import { ACCESS_CHECKS, DISTANCE_BANDS, SERVICES } from '../data/options';
import { PLANTS } from '../data/stations';
import { svcOn } from '../domain/spec';
import { StepFindings } from './common';
import { nf } from '../lib/format';

export function StepStandort() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const update = useStore((s) => s.update);
  const setView = useStore((s) => s.setView);
  const s = c.site, ex = d.excavation, lg = d.logistics;
  const groups = [...new Set(SERVICES.map((x) => x.group))];
  return (
    <>
      <Section title="Lieferort und Termin">
        <div className="row c3">
          <Field label="PLZ"><TextInput value={s.zip} onChange={(v) => update((x) => { x.site.zip = v.replace(/[^0-9]/g, '').slice(0, 5); })} placeholder="26197" /></Field>
          <div style={{ gridColumn: 'span 2' }}><Field label="Ort"><TextInput value={s.city} onChange={(v) => update((x) => { x.site.city = v; })} placeholder="Ahlhorn" /></Field></div>
        </div>
        <div className="row c2">
          <Field label="Wunschtermin (KW/Jahr)"><TextInput value={s.deliveryWeek} onChange={(v) => update((x) => { x.site.deliveryWeek = v; })} placeholder="z. B. KW 14/2027" /></Field>
          <Field label="Entfernung ab Werk"><Select value={s.distanceKm} onChange={(v) => update((x) => { x.site.distanceKm = v; })} options={DISTANCE_BANDS.map((b) => ({ id: b, label: b === 0 ? 'ab Werk (Selbstabholung)' : `bis ${b} km` }))} /></Field>
        </div>
        <Field label="Nächstgelegenes GRÄPER-Werk"><Select value={s.plantId} onChange={(v) => update((x) => { x.site.plantId = v; })} options={PLANTS.map((p) => ({ id: p.id, label: `${p.name}, ${p.city}` }))} /></Field>
      </Section>
      <Section title="Entladung und Gründung">
        <Field label="Entladung" info="bordkran" hint={lg.text}><Seg value={s.unloading} onChange={(v) => update((x) => { x.site.unloading = v; })} options={[{ id: 'bordkran', label: 'Lkw-Ladekran', disabled: c.building.kind !== 'kompakt' }, { id: 'autokran', label: 'Autokran' }, { id: 'bauseits', label: 'Bauseits' }]} /></Field>
        <Field label="Gründung" info="feinplanum"><Seg value={s.foundation} onChange={(v) => update((x) => { x.site.foundation = v; })} options={[{ id: 'sandplanum', label: 'Sandplanum' }, { id: 'streifen', label: 'Streifenfundament' }, { id: 'platte', label: 'Gründungsplatte' }]} /></Field>
        <div className="box">
          <KV rows={[
            ['Baugrube an OK Gelände', `${nf(ex.topX)} × ${nf(ex.topZ)} cm`],
            ['Baugrubensohle', `${nf(ex.bottomX)} × ${nf(ex.bottomZ)} cm`],
            ['Aushubtiefe', `${nf(ex.depth)} cm (davon ${ex.bedThickness} cm ${c.building.kind === 'kompakt' ? 'Sandbett' : 'Feinplanum'})`],
            ['Aushub / Wiederverfüllung', `ca. ${nf(ex.volumeM3, 1)} m³ / ${nf(ex.backfillM3, 1)} m³`],
            ['Transportgewicht', d.weights.totalT ? `ca. ${nf(d.weights.totalT, 1)} t` : '–'],
            ['Transportbreite', `${nf(lg.transportWidth)} cm${lg.oversize ? ' – Überbreite' : ''}`],
          ]} />
          <button type="button" className="btn sm" style={{ marginTop: 10 }} onClick={() => setView({ viewTab: 'aufstellung' })}>Baugrubenplan anzeigen</button>
          <button type="button" className="btn sm ghost" style={{ marginTop: 10, marginLeft: 6 }} onClick={() => setView({ viewTab: '3d', scenery: 'baugrube' })}>Baugrube in 3D</button>
        </div>
      </Section>
      <Section title="Umgebung">
        <Toggle checked={s.boundaryBuild} onChange={(v) => update((x) => { x.site.boundaryBuild = v; })} label="Aufstellung an Grundstücksgrenze / Gebäude" info="grenzbebauung" />
        <Toggle checked={s.residential} onChange={(v) => update((x) => { x.site.residential = v; })} label="Wohnbebauung in unmittelbarer Nähe" text="Prüfung von Schall und elektromagnetischen Feldern" />
        <Toggle checked={s.floodRisk} onChange={(v) => update((x) => { x.site.floodRisk = v; })} label="Hochwasser- / Überflutungsgefahr" />
      </Section>
      <Section title="Checkliste Baustelle" info="bordkran" text="Aus dem GRÄPER-Informationsblatt zur Stationsaufstellung – hilft, Verzögerungen am Liefertag zu vermeiden.">
        {ACCESS_CHECKS.map((a) => <Toggle key={a.id} checked={!!s.access[a.id]} onChange={(v) => update((x) => { x.site.access[a.id] = v; })} label={a.label} />)}
      </Section>
      {groups.map((g) => (
        <Section key={g} title={`Leistungen – ${g}`}>
          {SERVICES.filter((x) => x.group === g).map((x) => <Toggle key={x.id} checked={svcOn(c, x.id)} onChange={(v) => update((y) => { y.site.services[x.id] = v; })} label={x.label} text={x.text} />)}
        </Section>
      ))}
      <Section title="Bemerkungen"><textarea className="textarea" value={s.notes} placeholder="z. B. Zufahrt nur über Feldweg, Freileitung in der Nähe, besondere Termine …" onChange={(e) => update((x) => { x.site.notes = e.target.value; })} /></Section>
      <p className="small muted">Erdungsanlage: Ringerder ca. {ex.earthRingM} m um die Station. <Info term="ringerder" /></p>
      <StepFindings step="standort" />
    </>
  );
}
