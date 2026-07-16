import { useState } from 'react';
import { CheckCircle2, ClipboardList, Copy, Download, FileJson, FileText, Link as LinkIcon, Mail, Printer, Save, Send, Table } from 'lucide-react';
import { useStore, summaryLine } from '../state/store';
import { Badge, Callout, Field, FindingList, KV, Section, Select, TextInput } from '../ui/kit';
import { bom, bomCsv, specText, summarySections } from '../domain/spec';
import { STEP_META, useCase } from '../data/usecases';
import { CUSTOMER_TYPES } from '../data/options';
import { api, copyText, download, safeName, usePrint } from '../lib/io';
import { capture } from '../three/capture';
import type { StepId } from '../domain/types';

export async function printDatasheet() {
  const st = useStore.getState();
  if (!capture.fn) { st.setView({ viewTab: '3d' }); /* Die Verzögerung ist eine Mindestwartezeit; ein belegter Ereignis-Loop kann den Aufruf später ausführen. */ await new Promise((r) => setTimeout(r, 1200)); }
  usePrint.getState().set(capture.fn ? capture.fn() : null);
  setTimeout(() => window.print(), 350);
}

export function StepAbschluss() {
  const c = useStore((s) => s.config);
  const d = useStore((s) => s.derived);
  const update = useStore((s) => s.update);
  const goto = useStore((s) => s.goto);
  const toast = useStore((s) => s.toast);
  const saveLocal = useStore((s) => s.saveLocal);
  const openModal = useStore((s) => s.openModal);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const uc = useCase(c.useCase);
  const ct = c.contact;
  const issues = d.findings.filter((f) => f.severity === 'error' || f.severity === 'warn');
  const byStep = uc.steps.map((s) => ({ s, list: issues.filter((f) => f.step === s) })).filter((x) => x.list.length);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ct.email);
  const valid = ct.company.trim() && ct.name.trim() && emailOk && ct.consent;
  const name = safeName(c.projectName);
  const setC = <K extends keyof typeof ct>(k: K, v: (typeof ct)[K]) => update((x) => { x.contact[k] = v; });

  const submit = async () => {
    setTried(true);
    if (!valid) { toast('Bitte Pflichtfelder ausfüllen', 'error'); return; }
    setSending(true);
    try {
      /* JSON kodiert den aktuellen Wert als Text; Referenzen zwischen Objekten bleiben dabei nicht erhalten. */ const r = await api<{ id: string }>('/api/inquiries', { method: 'POST', body: JSON.stringify({ contact: ct, config: c, summary: summaryLine(c, d), spec: specText(c, d), findings: issues.map((f) => `${f.severity}: ${f.title}`) }) });
      setSent(r.id); toast('Anfrage übermittelt');
    } catch {
      const body = `${summaryLine(c, d)}\n\nAnsprechpartner: ${ct.name}, ${ct.company}\nTelefon: ${ct.phone}\nE-Mail: ${ct.email}\n\n${ct.message}\n\nDie vollständige Konfiguration liegt als JSON-Datei bei (bitte anhängen).`;
      download(`${name}_Konfiguration.json`, JSON.stringify(c, null, 2), 'application/json');
      window.location.href = `mailto:vertrieb@graeper.de?subject=${encodeURIComponent(`Anfrage Stationskonfigurator: ${c.projectName}`)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
      toast('Server nicht erreichbar – E-Mail-Entwurf geöffnet, Konfiguration heruntergeladen', 'info');
    } finally { setSending(false); }
  };

  return (
    <>
      <Section title="Ergebnis">
        {d.counts.error > 0 ? (
          <Callout severity="error" title={`${d.counts.error} Punkt${d.counts.error > 1 ? 'e' : ''} verhindern eine schlüssige Konfiguration`}>Bitte die markierten Punkte prüfen. Eine Anfrage ist trotzdem möglich – GRÄPER klärt die offenen Fragen mit Ihnen.</Callout>
        ) : d.counts.warn > 0 ? (
          <Callout severity="warn" title="Konfiguration schlüssig – mit Hinweisen">{d.counts.warn} Hinweis{d.counts.warn > 1 ? 'e' : ''} sollten vor der Bestellung geklärt werden.</Callout>
        ) : <Callout severity="ok" title="Konfiguration technisch schlüssig">Alle Prüfungen bestanden. Sie können Unterlagen erzeugen oder direkt anfragen.</Callout>}
        {byStep.map(({ s, list }) => (
          <div key={s} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 4px' }}><b style={{ fontSize: 13 }}>{STEP_META[s as StepId].label}</b><button type="button" className="btn sm ghost" onClick={() => goto(s as StepId)}>zum Schritt</button></div>
            <FindingList findings={list} />
          </div>
        ))}
      </Section>
      <Section title="Zusammenfassung">
        {summarySections(c, d).map((s) => (
          <div key={s.title} className="box" style={{ marginBottom: 8 }}><div className="box-title">{s.title}</div><KV rows={s.rows} /></div>
        ))}
      </Section>
      <Section title="Stückliste" hint={`${bom(c, d).length} Positionen`}>
        <div className="box" style={{ padding: 0, overflow: 'auto', maxHeight: 280 }}>
          <table className="tbl"><thead><tr><th>Pos.</th><th>Bezeichnung</th><th className="r">Menge</th></tr></thead>
            <tbody>{bom(c, d).map((r) => <tr key={r.pos}><td>{r.pos}</td><td><b style={{ fontWeight: 600 }}>{r.text}</b><div className="small muted">{r.detail}</div></td><td className="r">{r.qty}</td></tr>)}</tbody></table>
        </div>
      </Section>
      <Section title="Unterlagen">
        <div style={{ display: 'grid', gap: 7 }}>
          <button type="button" className="btn" onClick={printDatasheet}><Printer size={16} /> Datenblatt drucken / als PDF speichern</button>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={() => download(`${name}_Leistungsbeschreibung.txt`, specText(c, d))}><FileText size={16} /> Leistungsbeschreibung</button>
            <button type="button" className="btn" onClick={async () => toast((await copyText(specText(c, d))) ? 'Leistungsbeschreibung kopiert' : 'Kopieren nicht möglich', 'ok')}><Copy size={16} /> kopieren</button>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={() => download(`${name}_Stueckliste.csv`, '﻿' + bomCsv(c, d), 'text/csv;charset=utf-8')}><Table size={16} /> Stückliste (CSV)</button>
            <button type="button" className="btn" onClick={() => download(`${name}_Konfiguration.json`, JSON.stringify(c, null, 2), 'application/json')}><FileJson size={16} /> Konfiguration (JSON)</button>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={() => { saveLocal(); toast('Konfiguration im Browser gespeichert'); }}><Save size={16} /> Speichern</button>
            <button type="button" className="btn" onClick={() => openModal('teilen')}><LinkIcon size={16} /> Link teilen</button>
            {d.geometry.station?.docs.map((doc) => <a key={doc.url} className="btn" href={doc.url} target="_blank" rel="noreferrer"><Download size={16} /> {doc.label}</a>)}
          </div>
        </div>
      </Section>
      <Section title="Unverbindliche Anfrage an GRÄPER" text="Ihre Konfiguration wird mit Leistungsbeschreibung an den GRÄPER-Vertrieb übermittelt. Sie erhalten ein Angebot bzw. einen Rückruf zur technischen Klärung.">
        {sent ? (
          <Callout severity="ok" title="Vielen Dank – Ihre Anfrage ist eingegangen.">Vorgangsnummer <b style={{ display: 'inline' }}>{sent}</b>. Eine Kopie Ihrer Unterlagen können Sie oben herunterladen.</Callout>
        ) : (
          <>
            <Field label="Ich bin"><Select value={ct.customerType} onChange={(v) => setC('customerType', v)} options={CUSTOMER_TYPES.map((t) => ({ id: t.id, label: t.label }))} /></Field>
            <div className="row c2">
              <Field label="Firma *"><TextInput value={ct.company} onChange={(v) => setC('company', v)} invalid={tried && !ct.company.trim()} autoComplete="organization" /></Field>
              <Field label="Ansprechpartner/in *"><TextInput value={ct.name} onChange={(v) => setC('name', v)} invalid={tried && !ct.name.trim()} autoComplete="name" /></Field>
              <Field label="E-Mail *"><TextInput type="email" value={ct.email} onChange={(v) => setC('email', v)} invalid={tried && !emailOk} autoComplete="email" /></Field>
              <Field label="Telefon"><TextInput type="tel" value={ct.phone} onChange={(v) => setC('phone', v)} autoComplete="tel" /></Field>
              <Field label="Funktion"><TextInput value={ct.role} onChange={(v) => setC('role', v)} /></Field>
              <Field label="Straße"><TextInput value={ct.street} onChange={(v) => setC('street', v)} autoComplete="street-address" /></Field>
              <Field label="PLZ"><TextInput value={ct.zip} onChange={(v) => setC('zip', v)} autoComplete="postal-code" /></Field>
              <Field label="Ort"><TextInput value={ct.city} onChange={(v) => setC('city', v)} autoComplete="address-level2" /></Field>
            </div>
            <Field label="Nachricht"><textarea className="textarea" value={ct.message} onChange={(e) => setC('message', e.target.value)} placeholder="Stückzahl, Rahmenvertrag, Fragen …" /></Field>
            <label className="toggle" style={{ borderBottom: 0 }}>
              <input type="checkbox" checked={ct.consent} onChange={(e) => setC('consent', e.target.checked)} />
              <span className="switch" />
              <span className="toggle-t" style={{ color: tried && !ct.consent ? 'var(--err)' : undefined }}>Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert und verarbeitet werden (Datenschutzerklärung der GRÄPER Ahlhorn GmbH &amp; Co. KG). Die Einwilligung kann jederzeit widerrufen werden. *</span>
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <button type="button" className="btn primary lg" disabled={sending} onClick={submit}><Send size={16} /> {sending ? 'Wird gesendet …' : 'Anfrage senden'}</button>
              <a className="btn ghost" href="mailto:vertrieb@graeper.de"><Mail size={16} /> vertrieb@graeper.de</a>
            </div>
            <p className="small muted" style={{ marginTop: 8 }}>Telefon +49 (0) 4435 303-0 · Pflichtfelder sind mit * markiert.</p>
          </>
        )}
      </Section>
      <p className="small muted"><ClipboardList size={13} style={{ verticalAlign: -2 }} /> Planungsstand ohne Gewähr. <Badge kind="grey">{summaryLine(c, d)}</Badge> <CheckCircle2 size={0} /></p>
    </>
  );
}
