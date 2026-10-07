import { useStore } from '../state/store';
import { usePrint } from '../lib/io';
import { bom, summarySections } from '../domain/spec';
import { FloorPlan, SingleLine, SitePlan } from './Plans';
import { useCase } from '../data/usecases';
import { dateTimeDe } from '../lib/format';

/** Datenblatt – nur im Druck sichtbar (Browser-Druckdialog → „Als PDF speichern"). */
export function PrintSheet() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const { image, at } = usePrint();
  const uc = useCase(c.useCase);
  const sections = summarySections(c, d);
  const issues = d.findings.filter((f) => f.severity === 'error' || f.severity === 'warn');
  return (
    <div className="print-sheet">
      <header className="ps-head">
        <div><span className="brand-mark">GRÄPER</span></div>
        <div className="ps-title"><h1>{c.projectName || 'Stationskonfiguration'}</h1><p>{uc.label} · {d.geometry.title} · Stand {at ? dateTimeDe(at) : dateTimeDe(new Date().toISOString())}</p></div>
      </header>
      {image && <img className="ps-img" src={image} alt="3D-Ansicht der Station" />}
      <div className="ps-grid">
        {sections.map((s) => (
          <section key={s.title} className="ps-sec">
            <h2>{s.title}</h2>
            <table><tbody>{s.rows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
          </section>
        ))}
      </div>
      {issues.length > 0 && (
        <section className="ps-sec ps-break-avoid">
          <h2>Offene Punkte aus dem Technik-Check</h2>
          <ul>{issues.map((f) => <li key={f.id}><b>{f.severity === 'error' ? 'Klärung erforderlich: ' : 'Hinweis: '}{f.title}.</b> {f.text}</li>)}</ul>
        </section>
      )}
      <div className="ps-page"><FloorPlan c={c} d={d} /></div>
      {uc.electrical && <div className="ps-page"><SingleLine c={c} d={d} /></div>}
      <div className="ps-page"><SitePlan c={c} d={d} /></div>
      <section className="ps-sec ps-page">
        <h2>Stückliste und Leistungen</h2>
        <table className="ps-bom"><thead><tr><th>Pos.</th><th>Bezeichnung</th><th>Ausführung</th><th>Menge</th></tr></thead>
          <tbody>{bom(c, d).map((r) => <tr key={r.pos}><td>{r.pos}</td><td>{r.text}</td><td>{r.detail}</td><td>{r.qty}</td></tr>)}</tbody></table>
        <p className="ps-note">Planungsstand aus dem GRÄPER-Online-Konfigurator. Verbindlich sind ausschließlich Angebot und technische Klärung durch die GRÄPER Ahlhorn GmbH &amp; Co. KG, Ida-Gräper-Weg 1, 26197 Ahlhorn, Tel. +49 (0) 4435 303-0, info@graeper.de. Maßgebend sind die Technischen Anschlussbedingungen des zuständigen Netzbetreibers.</p>
      </section>
    </div>
  );
}
