import { useStore } from '../state/store';
import { cx, Cards, Field, KV, Num, Section, Seg, Toggle, Badge } from '../ui/kit';
import { KVA_STEPS, TRAFO_TYPES } from '../data/electrical';
import { StepFindings } from './common';
import { nf } from '../lib/format';

export function StepTrafo() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const update = useStore((s) => s.update);
  const t = c.transformer, e = d.elec;
  const maxCompact = Math.max(...d.ranking.filter((r) => r.station.maxKva > 0).map((r) => r.station.optKva ?? r.station.maxKva));
  return (
    <>
      <Section title="Bemessungsleistung" info="kva" hint={d.demand ? `Bedarf ca. ${nf(d.demand.kva)} kVA` : undefined}>
        <div className="chips" style={{ marginBottom: 10 }}>
          {KVA_STEPS.filter((k) => k >= 100).map((k) => (
            <button key={k} type="button" className={cx('chip', t.powerKva === k && 'on')} onClick={() => update((x) => { x.transformer.powerKva = k; if (k >= 800 && x.transformer.ukPercent === 4) x.transformer.ukPercent = 6; if (k <= 630 && x.transformer.ukPercent === 6 && x.useCase === 'ortsnetz') x.transformer.ukPercent = 4; })}>{nf(k)}</button>
          ))}
        </div>
        <div className="row c2">
          <Field label="Anzahl Transformatoren" hint={t.count > 1 ? 'Mehrere Transformatoren erfordern eine begehbare Station.' : `Kompaktstationen: 1 Transformator bis ${nf(maxCompact)} kVA`}>
            <Num value={t.count} min={1} max={4} onChange={(v) => update((x) => { x.transformer.count = v; })} />
          </Field>
          <Field label="Gesamtleistung"><div style={{ fontWeight: 760, fontSize: 20, paddingTop: 4 }}>{nf(e.totalKva)} kVA</div></Field>
        </div>
      </Section>
      <Section title="Bauart" info="trafotyp">
        <Cards value={t.type} onChange={(v) => update((x) => { x.transformer.type = v; })} options={TRAFO_TYPES.map((tt) => ({ id: tt.id, label: tt.label, text: tt.text }))} />
      </Section>
      <Section title="Spannungen und Kennwerte">
        <Field label="Oberspannung (Netz)" info="primary"><Seg value={t.primaryKv} onChange={(v) => update((x) => { x.transformer.primaryKv = v; })} options={[{ id: 10, label: '10 kV' }, { id: 20, label: '20 kV' }, { id: 30, label: '30 kV' }]} /></Field>
        <Field label="Unterspannung" info="secondary"><Seg value={t.secondaryV} onChange={(v) => update((x) => { x.transformer.secondaryV = v; })} options={[{ id: 400, label: '400 V' }, { id: 690, label: '690 V' }, { id: 800, label: '800 V' }]} /></Field>
        <div className="row c2">
          <Field label="Kurzschlussspannung" info="uk"><Seg value={t.ukPercent} onChange={(v) => update((x) => { x.transformer.ukPercent = v; })} options={[{ id: 4, label: '4 %' }, { id: 6, label: '6 %' }]} /></Field>
          <Field label="Schaltgruppe" info="schaltgruppe"><Seg value={t.vectorGroup} onChange={(v) => update((x) => { x.transformer.vectorGroup = v; })} options={[{ id: 'Dyn5', label: 'Dyn5' }, { id: 'Dyn11', label: 'Dyn11' }, { id: 'Yzn5', label: 'Yzn5' }]} /></Field>
        </div>
        <Field label="Trafoschutz" info="trafoschutz"><Seg value={t.protection} onChange={(v) => update((x) => { x.transformer.protection = v; })} options={[{ id: 'thermometer', label: 'Zeigerthermometer' }, { id: 'dgpt2', label: 'Vollschutz DGPT2' }]} /></Field>
        <Toggle checked={t.ront} onChange={(v) => update((x) => { x.transformer.ront = v; })} label="Regelbarer Ortsnetztransformator (rONT)" info="ront" text="Spannungsregelung unter Last für mehr PV, Wärmepumpen und Ladepunkte" />
        <Toggle checked={t.vibrationDampers} onChange={(v) => update((x) => { x.transformer.vibrationDampers = v; })} label="Schwingungsdämpfer" text="Reduziert die Körperschallübertragung um mindestens 3 dB" />
        <Toggle checked={t.customerSupplied} onChange={(v) => update((x) => { x.transformer.customerSupplied = v; })} label="Beistellung durch Kunden / Netzbetreiber" info="beistellung" />
      </Section>
      <Section title="Kennwerte" info="oekodesign" aside={<Badge kind="blue">Ökodesign Stufe 2</Badge>}>
        <div className="box">
          <KV rows={[
            ['Bemessungsstrom OS / US', `${nf(e.inHv, 1)} A / ${nf(e.inLv)} A`],
            ['Kurzschlussstrom an den US-Klemmen', `ca. ${nf(e.ikLvKa, 1)} kA`],
            ['Leerlauf- / Kurzschlussverluste', `${nf(e.trafo.p0)} W / ${nf(e.trafo.pk)} W`],
            ['Abwärme bei Volllast (gesamt)', `ca. ${nf(e.heatKw, 1)} kW`],
            ['Abmessungen L × B × H (Richtwert)', `${e.trafo.l} × ${e.trafo.b} × ${e.trafo.h} cm`],
            ['Gewicht (Richtwert)', `ca. ${nf(e.trafo.kg)} kg`],
            ...(t.type !== 'giessharz' ? [['Isolierflüssigkeit', `ca. ${nf(e.fluidLiters)} l`] as [string, string]] : []),
            ['Schallleistungspegel', `ca. ${nf(e.lwa)} dB(A)`],
          ]} />
        </div>
        <p className="small muted" style={{ marginTop: 6 }}>Abmessungen, Gewichte und Schallwerte sind herstellerabhängige Richtwerte; Verluste entsprechen den Grenzwerten der Verordnung (EU) 2019/1783.</p>
      </Section>
      <StepFindings step="trafo" />
    </>
  );
}
