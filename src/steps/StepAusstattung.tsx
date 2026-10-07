import { useStore } from '../state/store';
import { Cards, Field, Section, Seg, Toggle } from '../ui/kit';
import { ACCESSORIES } from '../data/options';
import { useCase } from '../data/usecases';
import { accOn } from '../domain/spec';
import { StepFindings } from './common';

export function StepAusstattung() {
  const c = useStore((s) => s.config);
  const update = useStore((s) => s.update);
  const q = c.equipment;
  const uc = useCase(c.useCase);
  const groups = [...new Set(ACCESSORIES.map((a) => a.group))];
  return (
    <>
      <Section title="Fernwirk- und Sekundärtechnik" info="fernwirk">
        <Cards cols={2} value={q.telecontrol} onChange={(v) => update((x) => { x.equipment.telecontrol = v; if (v === 'steuerbar') { x.equipment.ups = true; x.mv.motorDrives = true; } })} options={[
          { id: 'ohne', label: 'Ohne', text: 'Konventionelle Station' },
          { id: 'vorbereitet', label: 'Vorbereitet', text: 'Platz, Montageschiene und Hilfsspannung für spätere Nachrüstung' },
          { id: 'ueberwacht', label: 'Überwacht', text: 'Messwerte und Meldungen an die Leitstelle' },
          { id: 'steuerbar', label: 'Fernsteuerbar', text: 'Messen, Melden und Schalten aus der Leitstelle' },
        ]} />
        {q.telecontrol !== 'ohne' && (
          <div style={{ marginTop: 10 }}>
            <Field label="Kommunikation" info="lte450"><Seg value={q.comm} onChange={(v) => update((x) => { x.equipment.comm = v; })} options={[{ id: 'lte450', label: '450 MHz' }, { id: 'lte', label: 'LTE/5G' }, { id: 'glasfaser', label: 'Glasfaser' }, { id: 'dsl', label: 'DSL' }, { id: 'kunde', label: 'Vorgabe' }]} /></Field>
            <Field label="Protokoll"><Seg value={q.protocol} onChange={(v) => update((x) => { x.equipment.protocol = v; })} options={[{ id: 'iec104', label: 'IEC 60870-5-104' }, { id: 'iec61850', label: 'IEC 61850' }, { id: 'modbus', label: 'Modbus TCP' }]} /></Field>
            <Toggle checked={q.telecontrolSupplied} onChange={(v) => update((x) => { x.equipment.telecontrolSupplied = v; })} label="Fernwirkanlage wird beigestellt" info="beistellung" text="GRÄPER übernimmt Einbau und Verdrahtung" />
          </div>
        )}
        <Toggle checked={q.ups} onChange={(v) => update((x) => { x.equipment.ups = v; })} label="Gesicherte Hilfsspannung (USV / Batterie)" info="usv" />
        {uc.electrical && <Toggle checked={q.steuerbox14a} onChange={(v) => update((x) => { x.equipment.steuerbox14a = v; })} label="Vorbereitung Steuerung nach § 14a EnWG" info="p14a" />}
      </Section>
      <Section title="Stationsmonitoring EniMonTS" info="enimon">
        <Cards value={q.enimon} onChange={(v) => update((x) => { x.equipment.enimon = v; })} options={[
          { id: 'ohne', label: 'Ohne Monitoring' },
          { id: 'basis', label: 'EniMonTS Basis', text: 'Datenlogger EniRail, 3 Temperaturmessungen, Türkontakte, Webportal mit Standard-Dashboard' },
          { id: 'smart', label: 'EniMonTS Smart', text: 'zusätzlich NS-Leistungsmessung, Feuchte, Alarmmanagement, Schnittstellen, § 14a EnWG ready' },
        ]} />
      </Section>
      <Section title="Klima und Licht">
        <Toggle checked={q.lighting} onChange={(v) => update((x) => { x.equipment.lighting = v; })} label="Beleuchtung" />
        <Toggle checked={q.heating} onChange={(v) => update((x) => { x.equipment.heating = v; })} label="Heizung (Frost- und Betauungsschutz)" />
        <Toggle checked={q.climate} onChange={(v) => update((x) => { x.equipment.climate = v; })} label="Klimatisierung" text="Für Sekundär-, TK- und Batterietechnik" />
      </Section>
      {groups.map((g) => {
        const items = ACCESSORIES.filter((a) => a.group === g && (!a.onlyElectrical || (uc.electrical && c.transformer.count > 0)));
        if (!items.length) return null;
        return (
          <Section key={g} title={g === 'Elektroausbau' ? 'Weiterer Elektroausbau' : g === 'Sicherheit' ? 'Sicherheits- und Stationszubehör' : g === 'Klima' ? 'Klimatechnik' : 'Überwachung'}>
            {items.map((a) => <Toggle key={a.id} checked={accOn(c, a.id)} onChange={(v) => update((x) => { x.equipment.accessories[a.id] = v; })} label={a.label} text={a.text} />)}
          </Section>
        );
      })}
      <StepFindings step="ausstattung" />
    </>
  );
}
