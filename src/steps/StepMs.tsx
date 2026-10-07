import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useStore } from '../state/store';
import { cx, Field, Section, Seg, Select, Toggle, Badge, Info } from '../ui/kit';
import { MV_FIELD_TYPES, MV_VENDORS, mvVendor, umForKv } from '../data/electrical';
import type { MvFieldType } from '../domain/types';
import { mvFields, uid } from '../domain/defaults';
import { StepFindings } from './common';
import { nf } from '../lib/format';

const PRESETS: { label: string; text: string; fields: MvFieldType[] }[] = [
  { label: 'KKT', text: 'Ortsnetzstation im Ring', fields: ['K', 'K', 'T'] },
  { label: 'KKKT', text: 'mit Abzweig', fields: ['K', 'K', 'K', 'T'] },
  { label: 'KKLS', text: 'Leistungsschalter', fields: ['K', 'K', 'LS'] },
  { label: 'KK-M-LS', text: 'Kunde, MS-Messung', fields: ['K', 'K', 'M', 'LS'] },
  { label: 'KKK-Ü-M', text: 'Übergabestation', fields: ['K', 'K', 'K', 'UE', 'M'] },
  { label: 'KK-T-T', text: 'Zwei Transformatoren', fields: ['K', 'K', 'T', 'T'] },
];

export function StepMs() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const update = useStore((s) => s.update);
  const mv = c.mv;
  const um = umForKv(c.transformer.primaryKv);
  const v = mvVendor(mv.vendorId);
  const total = mv.fields.reduce((s, f) => s + v.widths[f.type], 0);
  const vendors = MV_VENDORS.filter((x) => x.insulation === mv.insulation);
  const st = d.geometry.station;
  const move = (i: number, dir: -1 | 1) => update((x) => { const f = x.mv.fields; const j = i + dir; if (j < 0 || j >= f.length) return; [f[i], f[j]] = [f[j], f[i]]; });
  return (
    <>
      <Section title="Isolier- und Schalttechnik" info="sf6">
        <Seg value={mv.insulation} onChange={(val) => update((x) => { x.mv.insulation = val; const first = MV_VENDORS.find((q) => q.insulation === val && q.um.includes(um)) ?? MV_VENDORS.find((q) => q.insulation === val)!; x.mv.vendorId = first.id; })}
          options={[{ id: 'sf6frei', label: 'F-Gas-frei' }, { id: 'sf6', label: 'SF6 (nur > 24 kV)', disabled: um <= 24, reason: 'Seit 01.01.2026 bis 24 kV nicht mehr zulässig' }, { id: 'luft', label: 'Luftisoliert (AIS)' }]} />
        <div style={{ marginTop: 10 }}>
          <Field label="Fabrikat" hint={v.note}>
            <Select value={mv.vendorId} onChange={(val) => update((x) => { x.mv.vendorId = val; })} options={vendors.map((q) => ({ id: q.id, label: `${q.vendor} – ${q.product}${q.um.includes(um) ? '' : ` (nur ${q.um.join('/')} kV)`}`, disabled: !q.um.includes(um) }))} />
          </Field>
        </div>
        <div className="chips">
          <Badge kind="grey">{v.medium}</Badge>{v.tested && <Badge kind="ok">in GRÄPER-Stationen geprüft</Badge>}<Badge kind="grey">Um {um} kV</Badge>
        </div>
      </Section>
      <Section title="Feldanordnung" info="msfelder" hint={`${mv.fields.length} Felder · ca. ${nf(total)} cm breit`}>
        <div className="chips" style={{ marginBottom: 10 }}>
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="chip" title={p.text} onClick={() => update((x) => { x.mv.fields = mvFields(...p.fields); if (p.fields.includes('LS') && x.mv.protection === 'hh') x.mv.protection = 'umz'; if (!p.fields.includes('LS') && !p.fields.includes('UE') && x.mv.protection !== 'hh') x.mv.protection = 'hh'; })}>{p.label}</button>
          ))}
        </div>
        <div className="fields">
          {mv.fields.map((f, i) => {
            const ft = MV_FIELD_TYPES.find((q) => q.id === f.type)!;
            return (
              <div key={f.id} className="mvf" title={ft.text}>
                <div className="mvf-top" style={{ background: ft.color }} />
                <div className="mvf-code" style={{ color: ft.color }}>{ft.short}</div>
                <div className="mvf-name">{ft.label.split(' (')[0]}</div>
                <div className="mvf-w">{v.widths[f.type]} cm</div>
                <div className="mvf-actions">
                  <button type="button" aria-label="nach links" disabled={i === 0} onClick={() => move(i, -1)}><ChevronLeft size={14} /></button>
                  <button type="button" aria-label="entfernen" onClick={() => update((x) => { x.mv.fields.splice(i, 1); })}><Trash2 size={13} /></button>
                  <button type="button" aria-label="nach rechts" disabled={i === mv.fields.length - 1} onClick={() => move(i, 1)}><ChevronRight size={14} /></button>
                </div>
              </div>
            );
          })}
          <div className="mvf-add">
            {MV_FIELD_TYPES.map((ft) => <button key={ft.id} type="button" title={ft.text} onClick={() => update((x) => { x.mv.fields.push({ id: uid('f'), type: ft.id }); })}>+ {ft.short} {ft.label.split(' (')[0].replace('Trafofeld mit HH-Sicherung', 'Trafofeld')}</button>)}
          </div>
        </div>
        {st && <p className="small muted">Platz in {st.name}: max. {st.mv.maxFields} Felder, {st.mv.box.w} × {st.mv.box.h} × {st.mv.box.d} cm (B × H × T){st.mv.metering ? ', Messfeld möglich' : ''}.</p>}
        <div className="box" style={{ marginTop: 8 }}>
          {MV_FIELD_TYPES.map((ft) => <div key={ft.id} className="small" style={{ display: 'flex', gap: 8, padding: '2px 0' }}><b style={{ color: ft.color, width: 22 }}>{ft.short}</b><span><b style={{ fontWeight: 620 }}>{ft.label}</b> – {ft.text}</span></div>)}
        </div>
      </Section>
      <Section title="Schutz und Ausstattung">
        <Field label="Schutzkonzept Trafo-/Übergabeabgang" info={mv.protection === 'umz_qu' ? 'qu' : mv.protection === 'hh' ? 'hh' : 'umz'}>
          <Seg value={mv.protection} onChange={(val) => update((x) => { x.mv.protection = val; })} options={[{ id: 'hh', label: 'HH-Sicherung' }, { id: 'umz', label: 'UMZ' }, { id: 'umz_qu', label: 'UMZ + Q-U' }, { id: 'ohne', label: 'ohne' }]} />
        </Field>
        <div className="row c2">
          <Field label="Kurzzeitstrom" info="ik"><Seg value={mv.ikKa} onChange={(val) => update((x) => { x.mv.ikKa = val; })} options={[{ id: 16, label: '16 kA' }, { id: 20, label: '20 kA' }, { id: 25, label: '25 kA' }]} /></Field>
          <Field label="Kurzschlussanzeiger" info="ksa"><Seg value={mv.faultIndicators} onChange={(val) => update((x) => { x.mv.faultIndicators = val; })} options={[{ id: 'ohne', label: 'ohne' }, { id: 'ksa', label: 'Standard' }, { id: 'ksa_richtung', label: 'gerichtet' }]} /></Field>
        </div>
        <Toggle checked={mv.motorDrives} onChange={(val) => update((x) => { x.mv.motorDrives = val; })} label="Motorantriebe" info="motor" text="Voraussetzung für fernsteuerbare Stationen" />
        <Toggle checked={mv.customerSupplied} onChange={(val) => update((x) => { x.mv.customerSupplied = val; })} label="Beistellung der Schaltanlage" info="beistellung" />
        {mv.fields.some((f) => f.type === 'M') && <Toggle checked={mv.meteringSupplied} onChange={(val) => update((x) => { x.mv.meteringSupplied = val; })} label="Messwandler vom Netzbetreiber beigestellt" info="messfeld" />}
        <p className="small muted" style={{ marginTop: 8 }}>Feldbreiten sind Richtwerte der Hersteller. Welche Baukörper-/Schaltanlagen-Kombination störlichtbogengeprüft ist, bestätigt GRÄPER im Angebot. <Info term="iac" /></p>
      </Section>
      <StepFindings step="ms" />
    </>
  );
}
