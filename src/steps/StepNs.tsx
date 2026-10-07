import { useStore } from '../state/store';
import { Field, KV, LineField, Meter, Num, Section, Seg, Toggle } from '../ui/kit';
import { NH_STRIPS } from '../data/electrical';
import { fwActive, lvSize } from '../domain/layout';
import { compactById } from '../data/stations';
import { StepFindings } from './common';
import { nf } from '../lib/format';

export function StepNs() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const update = useStore((s) => s.update);
  const lv = c.lv, e = d.elec;
  const size = lvSize(c, e.inLv);
  const st = c.building.kind === 'kompakt' ? compactById(c.building.compactId) : null;
  const maxStrips = st?.lv ? (fwActive(c, st) && st.fw?.reducesStripsTo ? st.fw.reducesStripsTo : st.lv.maxStrips) : null;
  return (
    <>
      <Section title="Bauart und Einspeisung">
        <Field label="Bauart" info="nsbauart"><Seg value={lv.design} onChange={(v) => update((x) => { x.lv.design = v; })} options={[{ id: 'offen', label: 'Offen (Gerüst)' }, { id: 'gekapselt', label: 'Gekapselt (Schrank)' }]} /></Field>
        <Field label="Trafoschalter / Einspeisung" info="einspeisung" hint={`Trafostrom ${nf(e.inLv)} A → Normgröße ${nf(e.incomerA)} A`}>
          <Seg value={lv.incomer} onChange={(v) => update((x) => { x.lv.incomer = v; })} options={[{ id: 'nh', label: 'NH-Lasttrennschalter' }, { id: 'lasttrenner', label: 'Lasttrennschalter' }, { id: 'leistungsschalter', label: 'Leistungsschalter' }]} />
        </Field>
      </Section>
      <Section title="Abgänge" info="nsleisten" hint={maxStrips ? `${size.slots} von ${maxStrips} Leistenplätzen` : `${size.slots} Leistenplätze`}>
        {maxStrips && <div style={{ marginBottom: 10 }}><Meter value={size.slots / maxStrips} label={`Belegung ${st!.name}`} right={`${size.slots} / ${maxStrips}`} /></div>}
        {NH_STRIPS.map((s) => (
          <LineField key={s.id} label={`${s.label} · ${s.amp} A`} sub={s.text}>
            <Num value={lv[s.id]} max={40} onChange={(v) => update((x) => { x.lv[s.id] = v; })} />
          </LineField>
        ))}
        <LineField label="Leistungsschalter-Abgänge" sub="ab 800 A, z. B. für Ladeparks, Speicher (4 Leistenplätze)"><Num value={lv.acbFeeders} max={8} onChange={(v) => update((x) => { x.lv.acbFeeders = v; })} /></LineField>
        <LineField label="Reserveplätze" sub="für spätere Erweiterungen"><Num value={lv.reserve} max={20} onChange={(v) => update((x) => { x.lv.reserve = v; })} /></LineField>
      </Section>
      <Section title="Messung">
        <Field label="Betriebsmessung"><Seg value={lv.instrument} onChange={(v) => update((x) => { x.lv.instrument = v; })} options={[{ id: 'ohne', label: 'ohne' }, { id: 'schleppzeiger', label: 'Schleppzeiger' }, { id: 'multimeter', label: 'Multifunktionsmessgerät' }]} /></Field>
        <Field label="Verrechnungsmessung (Wandlermessung)" info="wandler"><Seg value={lv.billingMeters} onChange={(v) => update((x) => { x.lv.billingMeters = v; })} options={[{ id: 0, label: 'keine' }, { id: 1, label: '1 Messung' }, { id: 2, label: '2 Messungen' }]} /></Field>
        {lv.billingMeters > 0 && <Toggle checked={lv.ctSupplied} onChange={(v) => update((x) => { x.lv.ctSupplied = v; })} label="Stromwandler vom Netzbetreiber beigestellt" />}
        <Toggle checked={lv.feederMonitoring} onChange={(v) => update((x) => { x.lv.feederMonitoring = v; })} label="Abgangsmessung (Sensorik je Abgang)" info="abgangsmessung" />
      </Section>
      <Section title="Zusatzausstattung">
        <Toggle checked={lv.streetLighting} onChange={(v) => update((x) => { x.lv.streetLighting = v; })} label="Straßenbeleuchtungsteil" text="Separater Abgang mit Schaltgerät für die öffentliche Beleuchtung" />
        <Toggle checked={lv.tempPower} onChange={(v) => update((x) => { x.lv.tempPower = v; })} label="Baustrom-/Notstromanschluss" info="baustrom" />
        <Toggle checked={lv.generatorInlet} onChange={(v) => update((x) => { x.lv.generatorInlet = v; })} label="Einspeisepunkt Notstromaggregat" text="Fest installierte Anschlussmöglichkeit mit Umschaltung" />
        <Toggle checked={lv.surgeProtection} onChange={(v) => update((x) => { x.lv.surgeProtection = v; })} label="Überspannungsschutz Typ 1+2" />
        <LineField label="Blindleistungskompensation" info="kompensation"><Num value={lv.compensationKvar} max={1000} step={25} unit="kvar" onChange={(v) => update((x) => { x.lv.compensationKvar = v; })} /></LineField>
        <Toggle checked={lv.customerSupplied} onChange={(v) => update((x) => { x.lv.customerSupplied = v; })} label="Beistellung der NS-Verteilung" info="beistellung" />
      </Section>
      <Section title="Auslegung">
        <div className="box"><KV rows={[
          ['Bemessungsstrom Einspeisung', `${nf(e.incomerA)} A`],
          ['Anfangs-Kurzschlusswechselstrom', `ca. ${nf(e.ikLvKa, 1)} kA`],
          ['Stoßkurzschlussstrom', `ca. ${nf(e.ipLvKa)} kA`],
          ['Summe Abgänge', `${nf(e.feederSumA)} A`],
          ['Breite der Verteilung (geschätzt)', `ca. ${nf(size.w)} cm`],
        ]} /></div>
      </Section>
      <StepFindings step="ns" />
    </>
  );
}
