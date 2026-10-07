import { BatteryCharging, Factory, Flame, GitBranch, Droplets, Home, Layers, RadioTower, Sun, Zap, Check } from 'lucide-react';
import { USE_CASES } from '../data/usecases';
import { useStore } from '../state/store';
import { cx, Field, Num, Section, Seg, TextInput, Callout, KV } from '../ui/kit';
import { nf } from '../lib/format';
import type { DemandCfg } from '../domain/types';

const ICONS = { Home, Factory, Sun, Zap, BatteryCharging, GitBranch, RadioTower, Flame, Droplets, Layers } as const;

export function StepStart() {
  const c = useStore((s) => s.config);
  const demand = useStore((s) => s.derived.demand);
  const update = useStore((s) => s.update);
  const setUseCase = useStore((s) => s.setUseCase);
  const toast = useStore((s) => s.toast);
  const uc = USE_CASES.find((u) => u.id === c.useCase)!;
  const dm = c.demand;
  const setD = <K extends keyof DemandCfg>(k: K, v: DemandCfg[K]) => update((x) => { x.demand[k] = v; });
  return (
    <>
      <Section title="Projekt">
        <div className="row c2">
          <Field label="Projektbezeichnung"><TextInput value={c.projectName} onChange={(v) => update((x) => { x.projectName = v; })} placeholder="z. B. Ortsnetzstation Lindenweg" /></Field>
          <Field label="Projekt-/Kostenstellennr." hint="optional"><TextInput value={c.projectNo} onChange={(v) => update((x) => { x.projectNo = v; })} placeholder="z. B. P-2026-0815" /></Field>
        </div>
      </Section>
      <Section title="Wofür wird die Station gebraucht?" text="Die Auswahl setzt praxisübliche Startwerte. Alle Werte lassen sich in den folgenden Schritten anpassen.">
        {(['energie', 'sonder'] as const).map((grp) => (
          <div key={grp} style={{ marginBottom: 12 }}>
            <div className="muted small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', margin: '0 0 6px' }}>{grp === 'energie' ? 'Energieversorgung' : 'Weitere Stationsgebäude'}</div>
            <div className="uc-grid">
              {USE_CASES.filter((u) => u.group === grp).map((u) => {
                const I = ICONS[u.icon as keyof typeof ICONS] ?? Home;
                return (
                  <button key={u.id} type="button" className={cx('uc', c.useCase === u.id && 'on')} onClick={() => { if (u.id !== c.useCase) { setUseCase(u.id); toast(`Startwerte für „${u.label}" übernommen`, 'info'); } }}>
                    <span className="uc-icon"><I size={20} /></span>
                    <span><span className="uc-title">{u.label}</span><span className="uc-sub" style={{ display: 'block' }}>{u.short}</span></span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="box">
          <div className="box-title">{uc.label}</div>
          <p className="small" style={{ color: 'var(--ink-2)', marginBottom: 6 }}>{uc.text}</p>
          <ul className="small" style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 2 }}>
            {uc.bullets.map((b) => <li key={b} style={{ display: 'flex', gap: 6 }}><Check size={14} color="var(--ok)" style={{ marginTop: 2 }} />{b}</li>)}
          </ul>
        </div>
      </Section>
      {uc.electrical && uc.id !== 'schaltstation' && (
        <Section title="Leistungsbedarf ermitteln" info="kva" text="Sie kennen die Transformatorleistung nicht? Der Rechner schätzt sie aus Ihren Verbrauchern bzw. der Einspeiseleistung.">
          <Field label="Grundlage">
            <Seg value={dm.mode} onChange={(v) => setD('mode', v)} options={[
              { id: 'direkt', label: 'Bekannt' }, { id: 'haushalte', label: 'Wohngebiet' }, { id: 'ladepark', label: 'Laden' },
              { id: 'gewerbe', label: 'Gewerbe' }, { id: 'pv', label: 'PV' }, { id: 'speicher', label: 'Speicher' },
            ]} />
          </Field>
          {dm.mode === 'direkt' && <p className="small muted">Die Leistung wird direkt im Schritt „Transformator" gewählt.</p>}
          {dm.mode === 'haushalte' && (<div className="row c3">
            <Field label="Haushalte"><Num value={dm.households} onChange={(v) => setD('households', v)} max={2000} step={5} /></Field>
            <Field label="Wärmepumpen"><Num value={dm.heatPumps} onChange={(v) => setD('heatPumps', v)} max={2000} step={5} /></Field>
            <Field label="Wallboxen"><Num value={dm.wallboxes} onChange={(v) => setD('wallboxes', v)} max={2000} step={5} /></Field>
          </div>)}
          {dm.mode === 'ladepark' && (<div className="row c2">
            <Field label="DC-Ladepunkte"><Num value={dm.chargersDc} onChange={(v) => setD('chargersDc', v)} max={60} /></Field>
            <Field label="Leistung je DC-Punkt"><Num value={dm.chargerDcKw} onChange={(v) => setD('chargerDcKw', v)} min={50} max={1000} step={50} unit="kW" /></Field>
            <Field label="AC-Ladepunkte"><Num value={dm.chargersAc} onChange={(v) => setD('chargersAc', v)} max={200} /></Field>
            <Field label="Leistung je AC-Punkt"><Num value={dm.chargerAcKw} onChange={(v) => setD('chargerAcKw', v)} min={11} max={43} step={11} unit="kW" /></Field>
          </div>)}
          {dm.mode === 'gewerbe' && (<div className="row c2">
            <Field label="Installierte Leistung"><Num value={dm.connectedKw} onChange={(v) => setD('connectedKw', v)} max={20000} step={50} unit="kW" width={70} /></Field>
            <Field label="Gleichzeitigkeitsfaktor" hint="typisch 0,5–0,8"><Num value={dm.simultaneity} onChange={(v) => setD('simultaneity', v)} min={0.1} max={1} step={0.05} /></Field>
            <Field label="Leistungsfaktor cos φ"><Num value={dm.cosPhi} onChange={(v) => setD('cosPhi', v)} min={0.7} max={1} step={0.01} /></Field>
          </div>)}
          {dm.mode === 'pv' && <Field label="PV-Leistung (DC)"><Num value={dm.pvKwp} onChange={(v) => setD('pvKwp', v)} max={30000} step={100} unit="kWp" width={70} /></Field>}
          {dm.mode === 'speicher' && <Field label="Lade-/Entladeleistung"><Num value={dm.storageKw} onChange={(v) => setD('storageKw', v)} max={30000} step={100} unit="kW" width={70} /></Field>}
          {(dm.mode === 'haushalte' || dm.mode === 'ladepark' || dm.mode === 'gewerbe') && (
            <Field label="Reserve für künftigen Zuwachs"><Num value={dm.reservePercent} onChange={(v) => setD('reservePercent', v)} max={100} step={5} unit="%" /></Field>
          )}
          {demand && (
            <div className="box">
              <KV rows={demand.lines.map((l) => [l.label, l.value] as [string, string])} />
              <div className="divider" style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div className="muted small">Empfehlung</div>
                  <div style={{ fontWeight: 760, fontSize: 18 }}>{demand.count > 1 ? `${demand.count} × ` : ''}{nf(demand.recommendedKva)} kVA</div>
                  <div className="muted small">Bedarf ca. {nf(demand.kva)} kVA · Auslastung {nf(demand.loading * 100)} %</div>
                </div>
                <button type="button" className="btn primary" onClick={() => { update((x) => { x.transformer.powerKva = demand.recommendedKva; x.transformer.count = demand.count; if (demand.recommendedKva >= 800) x.transformer.ukPercent = 6; }); toast('Transformatorleistung übernommen'); }}>Übernehmen</button>
              </div>
            </div>
          )}
          {demand && <Callout severity="info">Überschlägige Ermittlung mit üblichen Gleichzeitigkeitsfaktoren. Für die verbindliche Auslegung sind Netzplanung bzw. TAB des Netzbetreibers maßgebend.</Callout>}
        </Section>
      )}
    </>
  );
}
