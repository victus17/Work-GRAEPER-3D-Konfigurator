import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, Box, Camera, ChevronLeft, ChevronRight, DoorOpen, Eye, FilePlus, FolderOpen, HelpCircle, LayoutGrid, Link as LinkIcon, Network, PanelTop, PersonStanding, Redo2, Ruler, Save, Shovel, Trash2, Undo2, Upload, CheckCircle2, AlertTriangle, XCircle, Info as InfoIcon } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useStore, mergeConfig, summaryLine, type ViewTab, type CameraPreset } from './state/store';
import { STEP_META, useCase } from './data/usecases';
import { GLOSSARY } from './data/glossary';
import { cx, Badge, FindingList, Modal, SevIcon } from './ui/kit';
import { FloorPlan, SingleLine, SitePlan } from './views/Plans';
import { PrintSheet } from './views/PrintSheet';
import { StepStart } from './steps/StepStart';
import { StepTrafo } from './steps/StepTrafo';
import { StepMs } from './steps/StepMs';
import { StepNs } from './steps/StepNs';
import { StepStation } from './steps/StepStation';
import { StepHuelle } from './steps/StepHuelle';
import { StepAusstattung } from './steps/StepAusstattung';
import { StepStandort } from './steps/StepStandort';
import { StepAbschluss } from './steps/StepAbschluss';
import { api, copyText, decodeConfig, download, encodeConfig, safeName } from './lib/io';
import { dateTimeDe, nf } from './lib/format';
import type { StepId } from './domain/types';
import { capture } from './three/capture';

const Scene = lazy(() => import('./three/Scene'));

const STEPS: Record<StepId, () => ReactNode> = {
  start: StepStart, trafo: StepTrafo, ms: StepMs, ns: StepNs, station: StepStation, huelle: StepHuelle, ausstattung: StepAusstattung, standort: StepStandort, abschluss: StepAbschluss,
};
const LEADS: Record<StepId, string> = {
  start: 'Wählen Sie den Einsatzzweck – der Konfigurator setzt passende Startwerte und führt Sie Schritt für Schritt.',
  trafo: 'Leistung, Spannungen und Bauart des Transformators. Die Kennwerte werden sofort berechnet.',
  ms: 'Die Mittelspannungs-Schaltanlage verbindet die Station mit dem Netz des Netzbetreibers.',
  ns: 'Die Niederspannungs-Hauptverteilung verteilt die Energie auf die abgehenden Kabel.',
  station: 'Der Konfigurator wählt die passende Station und prüft, ob alle Geräte Platz finden.',
  huelle: 'Fassade, Farben, Türen und Kabeleinführungen – alles live in der 3D-Ansicht.',
  ausstattung: 'Digitalisierung, Monitoring und Stationszubehör.',
  standort: 'Lieferung, Aufstellung, Baugrube und Dienstleistungen rund um die Station.',
  abschluss: 'Prüfen Sie das Ergebnis, erzeugen Sie Unterlagen oder senden Sie eine Anfrage.',
};

function Header() {
  const { config, past, future, undo, redo, update, openModal, saveLocal, toast } = useStore(useShallow((s) => ({ config: s.config, past: s.past, future: s.future, undo: s.undo, redo: s.redo, update: s.update, openModal: s.openModal, saveLocal: s.saveLocal, toast: s.toast })));
  return (
    <header className="header">
      <a className="brand" href="https://www.graeper.de" target="_blank" rel="noreferrer" aria-label="GRÄPER Website">
        <span className="brand-mark">GRÄPER</span>
        <span className="brand-sub">Stationskonfigurator<small>Versorgungsstationen in 3D planen</small></span>
      </a>
      <div className="project"><input aria-label="Projektbezeichnung" value={config.projectName} onChange={(e) => update((x) => { x.projectName = e.target.value; })} /></div>
      <div className="header-actions">
        <button type="button" className="iconbtn" title="Rückgängig (Strg+Z)" disabled={!past.length} onClick={undo}><Undo2 size={18} /></button>
        <button type="button" className="iconbtn" title="Wiederholen (Strg+Umschalt+Z)" disabled={!future.length} onClick={redo}><Redo2 size={18} /></button>
        <button type="button" className="iconbtn" title="Neue Konfiguration" onClick={() => openModal('neu')}><FilePlus size={18} /></button>
        <button type="button" className="iconbtn" title="Konfiguration öffnen" onClick={() => openModal('laden')}><FolderOpen size={18} /></button>
        <button type="button" className="iconbtn" title="Im Browser speichern" onClick={() => { saveLocal(); toast('Konfiguration gespeichert'); }}><Save size={18} /></button>
        <button type="button" className="btn sm" onClick={() => openModal('teilen')}><LinkIcon size={15} /> Teilen</button>
        <button type="button" className="iconbtn" title="Hilfe und Glossar" onClick={() => openModal('hilfe')}><HelpCircle size={18} /></button>
      </div>
    </header>
  );
}

function Rail() {
  const { config, step, visited, derived, goto, openModal } = useStore(useShallow((s) => ({ config: s.config, step: s.step, visited: s.visited, derived: s.derived, goto: s.goto, openModal: s.openModal })));
  const steps = useCase(config.useCase).steps;
  const cur = steps.indexOf(step);
  return (
    <nav className="rail" aria-label="Konfigurationsschritte">
      <div className="steps">
        {steps.map((s, i) => {
          const f = derived.findings.filter((x) => x.step === s);
          const flag = f.some((x) => x.severity === 'error') ? 'error' : f.some((x) => x.severity === 'warn') ? 'warn' : null;
          return (
            <button key={s} type="button" className={cx('step', s === step && 'active', visited.includes(s) && i < cur && 'done')} onClick={() => goto(s)} aria-current={s === step ? 'step' : undefined} title={STEP_META[s].label}>
              <span className="step-no">{i + 1}</span>
              <span className="step-text"><span className="step-label" style={{ display: 'block' }}>{STEP_META[s].label}</span><span className="step-sub">{STEP_META[s].sub}</span></span>
              <span className="step-flag-wrap">{flag && visited.includes(s) && <span className={cx('step-flag', flag)} />}</span>
            </button>
          );
        })}
      </div>
      <div className="rail-foot">
        <button type="button" className="checkcard" onClick={() => openModal('check')} title="Technik-Check">
          <span className="checkcard-title" style={{ color: derived.status === 'error' ? 'var(--err)' : derived.status === 'warn' ? 'var(--warn)' : 'var(--ok)' }}>
            <SevIcon s={derived.status} /><span>Technik-Check</span>
          </span>
          <span className="checkcard-counts">
            {derived.counts.error > 0 && <Badge kind="error">{derived.counts.error} offen</Badge>}
            {derived.counts.warn > 0 && <Badge kind="warn">{derived.counts.warn} {derived.counts.warn === 1 ? 'Hinweis' : 'Hinweise'}</Badge>}
            {!derived.counts.error && !derived.counts.warn && <Badge kind="ok">alles schlüssig</Badge>}
          </span>
        </button>
      </div>
    </nav>
  );
}

function Toolbar() {
  const v = useStore(useShallow((s) => ({ doorsOpen: s.doorsOpen, xray: s.xray, roofOff: s.roofOff, showDims: s.showDims, showPerson: s.showPerson, scenery: s.scenery, setView: s.setView, setCamera: s.setCamera, kind: s.derived.geometry.kind, title: s.config.projectName })));
  const cams: [CameraPreset, string][] = [['iso', '3D'], ['front', 'Vorn'], ['right', 'Rechts'], ['back', 'Hinten'], ['left', 'Links'], ['top', 'Oben']];
  return (
    <div className="toolbar">
      <div className="toolgroup">{cams.map(([p, l]) => <button key={p} type="button" className="tool" onClick={() => v.setCamera(p)}>{l}</button>)}</div>
      <div className="toolgroup">
        <button type="button" className={cx('tool', v.doorsOpen && 'on')} title="Türen öffnen" disabled={v.kind === 'trafostand'} onClick={() => v.setView({ doorsOpen: !v.doorsOpen })}><DoorOpen size={16} /></button>
        <button type="button" className={cx('tool', v.roofOff && 'on')} title="Dach ausblenden" onClick={() => v.setView({ roofOff: !v.roofOff })}><PanelTop size={16} /></button>
        <button type="button" className={cx('tool', v.xray && 'on')} title="Röntgenblick (Wände transparent)" onClick={() => v.setView({ xray: !v.xray })}><Eye size={16} /></button>
        <button type="button" className={cx('tool', v.showDims && 'on')} title="Maße" onClick={() => v.setView({ showDims: !v.showDims })}><Ruler size={16} /></button>
        <button type="button" className={cx('tool', v.showPerson && 'on')} title="Person als Größenvergleich" onClick={() => v.setView({ showPerson: !v.showPerson })}><PersonStanding size={16} /></button>
        <button type="button" className="tool" title="Bild speichern" onClick={() => { const img = capture.fn?.(); if (img) { const a = document.createElement('a'); a.href = img; a.download = `${safeName(v.title)}_3D.png`; a.click(); } }}><Camera size={16} /></button>
      </div>
      <div className="toolgroup">
        {([['studio', 'Studio'], ['standort', 'Standort'], ['baugrube', 'Baugrube']] as const).map(([id, l]) => <button key={id} type="button" className={cx('tool', v.scenery === id && 'on')} onClick={() => v.setView({ scenery: id })}>{l}</button>)}
      </div>
    </div>
  );
}

function Kpis() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const openModal = useStore((s) => s.openModal);
  const g = d.geometry, t = c.transformer;
  const st = g.station;
  const items: [string, ReactNode][] = [
    ['Station', g.title],
    ['Außenmaße L × B × H', <>{nf(g.x / 100, 2)} × {nf(g.z / 100, 2)} × {nf(g.hTotal / 100, 2)} <small>m</small></>],
  ];
  if (t.count > 0) items.push(['Leistung', <>{t.count > 1 ? `${t.count} × ` : ''}{nf(t.powerKva)} <small>kVA</small></>]);
  if (c.mv.fields.length) items.push(['MS-Felder', c.mv.fields.map((f) => (f.type === 'UE' ? 'Ü' : f.type)).join('')]);
  if (t.count > 0) items.push(['NS-Leisten', <>{d.elec.stripSlots}{st?.lv ? <small> / {st.lv.maxStrips}</small> : null}</>]);
  if (d.weights.totalT) items.push(['Gewicht', <>ca. {nf(d.weights.totalT, 1)} <small>t</small></>]);
  return (
    <div className="kpis">
      {items.map(([l, v]) => <div key={l} className="kpi"><div className="kpi-l">{l}</div><div className="kpi-v">{v}</div></div>)}
      <div className="kpi status"><button type="button" className="btn sm ghost" onClick={() => openModal('check')}>
        {d.status === 'error' ? <><XCircle size={16} color="var(--err)" /> {d.counts.error} offen</> : d.status === 'warn' ? <><AlertTriangle size={16} color="#cf8500" /> {d.counts.warn} {d.counts.warn === 1 ? 'Hinweis' : 'Hinweise'}</> : <><CheckCircle2 size={16} color="var(--ok)" /> schlüssig</>}
      </button></div>
    </div>
  );
}

function View() {
  const viewTab = useStore((s) => s.viewTab);
  const setView = useStore((s) => s.setView);
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const electrical = useCase(c.useCase).electrical;
  const tabs: [ViewTab, string, ReactNode][] = [['3d', '3D-Modell', <Box size={15} key="b" />], ['grundriss', 'Grundriss', <LayoutGrid size={15} key="g" />], ...(electrical ? [['schaltplan', 'Schaltplan', <Network size={15} key="n" />] as [ViewTab, string, ReactNode]] : []), ['aufstellung', 'Baugrube', <Shovel size={15} key="s" />]];
  return (
    <main className="view">
      <div className="view-tabs" role="tablist">{tabs.map(([id, l, ic]) => <button key={id} type="button" role="tab" aria-selected={viewTab === id} className={cx('view-tab', viewTab === id && 'active')} onClick={() => setView({ viewTab: id })}>{ic}{l}</button>)}</div>
      <div className="view-body">
        {viewTab === '3d' && (<>
          <Suspense fallback={<div className="view-2d" style={{ display: 'grid', placeItems: 'center', color: 'var(--ink-3)' }}>3D-Ansicht wird geladen …</div>}><Scene /></Suspense>
          <Toolbar />
          <div className="viewhint">Ziehen: drehen · Rechte Maustaste: verschieben · Mausrad: zoomen</div>
        </>)}
        {viewTab === 'grundriss' && <div className="view-2d"><FloorPlan c={c} d={d} /></div>}
        {viewTab === 'schaltplan' && <div className="view-2d"><SingleLine c={c} d={d} /></div>}
        {viewTab === 'aufstellung' && <div className="view-2d"><SitePlan c={c} d={d} /></div>}
      </div>
      <Kpis />
    </main>
  );
}

function Panel() {
  const { step, config, next, prev } = useStore(useShallow((s) => ({ step: s.step, config: s.config, next: s.next, prev: s.prev })));
  const steps = useCase(config.useCase).steps;
  const i = steps.indexOf(step);
  const Step = STEPS[step];
  return (
    <aside className="panel" aria-label="Konfiguration">
      <div className="panel-head">
        <div className="panel-kicker">Schritt {i + 1} von {steps.length}</div>
        <h1 className="panel-title">{STEP_META[step].label}</h1>
        <p className="panel-lead">{LEADS[step]}</p>
      </div>
      <div className="panel-scroll"><Step /></div>
      <div className="panel-foot">
        <button type="button" className="btn" disabled={i === 0} onClick={prev}><ChevronLeft size={16} /> Zurück</button>
        <span className="spacer" />
        {i < steps.length - 1 && <button type="button" className="btn primary" onClick={next}>Weiter: {STEP_META[steps[i + 1]].label} <ChevronRight size={16} /></button>}
      </div>
    </aside>
  );
}

/* ---------- Dialoge ---------- */
function Modals() {
  const { modal, openModal, config, derived, saved, replace, deleteLocal, reset, goto, toast } = useStore(useShallow((s) => ({ modal: s.modal, openModal: s.openModal, config: s.config, derived: s.derived, saved: s.saved, replace: s.replace, deleteLocal: s.deleteLocal, reset: s.reset, goto: s.goto, toast: s.toast })));
  const [link, setLink] = useState('');
  const [q, setQ] = useState('');
  const close = () => openModal(null);
  useEffect(() => {
    if (modal !== 'teilen') return;
    setLink('');
    (async () => {
      try { const r = await api<{ id: string }>('/api/configurations', { method: 'POST', body: JSON.stringify({ name: config.projectName, config }) }); setLink(`${location.origin}${location.pathname}?k=${r.id}`); }
      catch { setLink(`${location.origin}${location.pathname}#c=${await encodeConfig(config)}`); }
    })();
  }, [modal, config]);
  const glossary = useMemo(() => Object.entries(GLOSSARY).filter(([, g]) => !q || (g.title + g.text).toLowerCase().includes(q.toLowerCase())), [q]);
  if (!modal) return null;
  if (modal === 'neu') return (
    <Modal title="Neue Konfiguration" onClose={close} footer={<><button type="button" className="btn" onClick={close}>Abbrechen</button><button type="button" className="btn primary" onClick={() => { reset(); close(); toast('Neue Konfiguration begonnen', 'info'); }}>Neu beginnen</button></>}>
      <p>Die aktuelle Konfiguration wird verworfen. Gespeicherte Konfigurationen bleiben erhalten; mit „Rückgängig" lässt sich der Schritt aufheben.</p>
    </Modal>
  );
  if (modal === 'laden') return (
    <Modal title="Konfiguration öffnen" onClose={close}>
      {saved.length === 0 && <p className="muted">Noch keine Konfiguration in diesem Browser gespeichert.</p>}
      {saved.length > 0 && <table className="tbl"><thead><tr><th>Name</th><th>Inhalt</th><th>Gespeichert</th><th /></tr></thead><tbody>
        {saved.map((e) => <tr key={e.id}><td><b style={{ fontWeight: 650 }}>{e.name}</b></td><td className="small">{e.summary}</td><td className="small">{dateTimeDe(e.savedAt)}</td>
          <td className="r" style={{ whiteSpace: 'nowrap' }}><button type="button" className="btn sm" onClick={() => { replace(e.config); close(); toast(`„${e.name}" geöffnet`); }}>Öffnen</button> <button type="button" className="iconbtn" aria-label="Löschen" onClick={() => deleteLocal(e.id)}><Trash2 size={15} /></button></td></tr>)}
      </tbody></table>}
      <div className="divider" />
      <label className="btn"><Upload size={16} /> JSON-Datei importieren<input type="file" accept="application/json,.json" hidden onChange={async (ev) => {
        const f = ev.target.files?.[0]; if (!f) return;
        try { replace(mergeConfig(JSON.parse(await f.text()))); close(); toast('Konfiguration importiert'); } catch { toast('Datei konnte nicht gelesen werden', 'error'); }
      }} /></label>
    </Modal>
  );
  if (modal === 'teilen') return (
    <Modal title="Konfiguration teilen" onClose={close} footer={<button type="button" className="btn primary" disabled={!link} onClick={async () => { toast((await copyText(link)) ? 'Link kopiert' : 'Kopieren nicht möglich'); }}>Link kopieren</button>}>
      <p className="small muted" style={{ marginBottom: 8 }}>Wer den Link öffnet, sieht genau diese Konfiguration und kann darauf aufbauen. {link.includes('#c=') ? 'Die Daten stecken komprimiert im Link selbst.' : ''}</p>
      <textarea className="textarea" readOnly value={link || 'Link wird erzeugt …'} style={{ fontSize: 12, minHeight: 90 }} onFocus={(e) => e.target.select()} />
      <div className="divider" />
      <button type="button" className="btn sm" onClick={() => download(`${safeName(config.projectName)}_Konfiguration.json`, JSON.stringify(config, null, 2), 'application/json')}>Als JSON-Datei herunterladen</button>
    </Modal>
  );
  if (modal === 'check') {
    const steps = useCase(config.useCase).steps;
    return (
      <Modal title="Technik-Check" onClose={close} wide>
        <p className="small muted" style={{ marginBottom: 10 }}>{summaryLine(config, derived)} – geprüft werden Platzbedarf, Normen (DIN EN 62271-202, VDE-AR-N 4110, F-Gase-Verordnung), Schutzkonzept, Lüftung, Transport und Aufstellung.</p>
        {steps.map((s) => {
          const list = derived.findings.filter((f) => f.step === s);
          if (!list.length) return null;
          return <div key={s} style={{ marginBottom: 10 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><b>{STEP_META[s].label}</b><button type="button" className="btn sm ghost" onClick={() => { goto(s); close(); }}>zum Schritt</button></div><FindingList findings={list} /></div>;
        })}
      </Modal>
    );
  }
  return (
    <Modal title="Hilfe und Glossar" onClose={close} wide>
      <div className="row c2" style={{ marginBottom: 14 }}>
        <div className="box"><div className="box-title"><BookOpen size={16} /> So funktioniert der Konfigurator</div>
          <ol className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 3 }}>
            <li>Einsatzzweck wählen – passende Startwerte werden gesetzt.</li>
            <li>Schritte von oben nach unten durchgehen; jede Änderung erscheint sofort in 3D.</li>
            <li>Der Technik-Check meldet Konflikte und bietet Korrekturen per Klick an.</li>
            <li>Bei Kompaktstationen wählt der Konfigurator automatisch den kleinsten passenden Typ.</li>
            <li>Zum Schluss Datenblatt, Leistungsbeschreibung und Stückliste erzeugen oder anfragen.</li>
          </ol></div>
        <div className="box"><div className="box-title"><InfoIcon size={16} /> Gut zu wissen</div>
          <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 3 }}>
            <li>Das <HelpCircle size={12} />-Symbol erklärt Fachbegriffe in einfacher Sprache.</li>
            <li>Ihre Eingaben werden automatisch im Browser gesichert.</li>
            <li>Rückgängig: Strg+Z · Wiederholen: Strg+Umschalt+Z.</li>
            <li>Stationsdaten nach GRÄPER-Unterlagen (Stand 2026); verbindlich ist das Angebot.</li>
          </ul></div>
      </div>
      <input className="input" placeholder="Begriff suchen …" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 10 }} />
      <div style={{ columns: 2, columnGap: 18 }}>{glossary.map(([k, g]) => <div key={k} style={{ breakInside: 'avoid', marginBottom: 10 }}><b style={{ fontSize: 13.4 }}>{g.title}</b><div className="small" style={{ color: 'var(--ink-2)' }}>{g.text}</div></div>)}</div>
    </Modal>
  );
}

function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return <div className="toasts" aria-live="polite">{toasts.map((t) => <div key={t.id} className={cx('toast', t.kind)}><SevIcon s={t.kind === 'error' ? 'error' : t.kind === 'info' ? 'info' : 'ok'} size={17} />{t.text}</div>)}</div>;
}

export function App() {
  const replace = useStore((s) => s.replace);
  const toast = useStore((s) => s.toast);
  useEffect(() => {
    (async () => {
      const k = new URLSearchParams(location.search).get('k');
      const h = location.hash.startsWith('#c=') ? location.hash.slice(3) : null;
      try {
        if (k) { const r = await api<{ config: unknown }>(`/api/configurations/${encodeURIComponent(k)}`); replace(mergeConfig(r.config)); toast('Geteilte Konfiguration geöffnet', 'info'); }
        else if (h) { replace(mergeConfig(await decodeConfig(h))); toast('Geteilte Konfiguration geöffnet', 'info'); }
      } catch { toast('Geteilte Konfiguration konnte nicht geladen werden', 'error'); }
      if (k || h) history.replaceState(null, '', location.pathname);
    })();
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) useStore.getState().redo(); else useStore.getState().undo(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [replace, toast]);
  return (
    <>
      <div className="app"><Header /><Rail /><View /><Panel /></div>
      <Modals /><Toasts /><PrintSheet />
    </>
  );
}
