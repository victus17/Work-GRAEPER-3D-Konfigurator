import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, CheckCircle2, Info as InfoIcon, Minus, Plus, Search, X, XCircle, HelpCircle } from 'lucide-react';
import { GLOSSARY } from '../data/glossary';
import { RAL, ral, SERIE_RAL } from '../data/ral';
import type { Finding, Severity } from '../domain/types';
import { useStore } from '../state/store';

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

/* ---------- Info-Hilfe ---------- */
export function Info({ term, text, title }: { term?: string; text?: string; title?: string }) {
  const g = term ? GLOSSARY[term] : undefined;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const ref = useRef<HTMLButtonElement>(null);
  const place = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(window.innerWidth - 312, Math.max(8, r.left - 140));
    const top = r.bottom + 8 + 190 > window.innerHeight ? Math.max(8, r.top - 8 - 170) : r.bottom + 8;
    setPos({ left, top });
  };
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('mousedown', close); window.addEventListener('keydown', close); window.addEventListener('scroll', close, true);
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', close); window.removeEventListener('scroll', close, true); };
  }, [open]);
  if (!g && !text) return null;
  return (
    <>
      <button ref={ref} type="button" className="info-btn" aria-label={`Erklärung: ${g?.title ?? title ?? ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); place(); setOpen((o) => !o); }}>
        <HelpCircle size={15} />
      </button>
      {open && createPortal(<div className="pop" role="tooltip" style={pos}><b>{g?.title ?? title}</b>{g?.text ?? text}</div>, document.body)}
    </>
  );
}

/* ---------- Layout-Bausteine ---------- */
export function Section({ title, hint, text, info, children, aside }: { title: string; hint?: string; text?: string; info?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h3 className="section-title">{title}{info && <Info term={info} />}</h3>
        {aside ?? (hint && <span className="section-hint">{hint}</span>)}
      </div>
      {text && <p className="section-text">{text}</p>}
      {children}
    </section>
  );
}
export function Field({ label, info, hint, children }: { label: string; info?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">{label}{info && <Info term={info} />}</div>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}
export function LineField({ label, sub, info, children }: { label: string; sub?: string; info?: string; children: ReactNode }) {
  return (
    <div className="linefield">
      <div className="linefield-l"><span>{label}{sub && <small>{sub}</small>}</span>{info && <Info term={info} />}</div>
      {children}
    </div>
  );
}

/* ---------- Eingaben ---------- */
export interface Opt<T> { id: T; label: string; text?: string; badge?: ReactNode; disabled?: boolean; reason?: string }

export function Seg<T extends string | number | boolean>({ value, options, onChange }: { value: T; options: Opt<T>[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button key={String(o.id)} type="button" role="radio" aria-checked={o.id === value} className={cx(o.id === value && 'on')} disabled={o.disabled} title={o.reason ?? o.text} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}
export function Cards<T extends string | number>({ value, options, onChange, cols = 1 }: { value: T; options: Opt<T>[]; onChange: (v: T) => void; cols?: 1 | 2 | 3 }) {
  return (
    <div className={cx('cards', cols === 2 && 'c2', cols === 3 && 'c3')} role="radiogroup">
      {options.map((o) => (
        <button key={String(o.id)} type="button" role="radio" aria-checked={o.id === value} disabled={o.disabled} title={o.reason} className={cx('card', o.id === value && 'on', o.disabled && 'off')} onClick={() => onChange(o.id)}>
          <span className="card-title">{o.label}{o.badge}</span>
          {o.text && <span className="card-text">{o.text}</span>}
          {o.id === value && <Check size={16} className="card-check" />}
        </button>
      ))}
    </div>
  );
}
export function Num({ value, onChange, min = 0, max = 99, step = 1, unit, width }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string; width?: number }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => setTxt(String(value)), [value]);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const commit = (raw: string) => { const v = Number(raw.replace(',', '.')); if (Number.isFinite(v)) onChange(clamp(v)); else setTxt(String(value)); };
  return (
    <span className="stepper">
      <button type="button" aria-label="verringern" disabled={value <= min} onClick={() => onChange(clamp(+(value - step).toFixed(4)))}><Minus size={14} /></button>
      <input inputMode="decimal" value={txt} style={width ? { width } : undefined} onChange={(e) => setTxt(e.target.value)} onBlur={(e) => commit(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
      {unit && <span className="unit">{unit}</span>}
      <button type="button" aria-label="erhöhen" disabled={value >= max} onClick={() => onChange(clamp(+(value + step).toFixed(4)))}><Plus size={14} /></button>
    </span>
  );
}
export function Toggle({ checked, onChange, label, text, info, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; text?: string; info?: string; disabled?: boolean }) {
  return (
    <label className={cx('toggle', disabled && 'disabled')}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" />
      <span style={{ flex: 1 }}>
        <span className="toggle-l">{label} {info && <Info term={info} />}</span>
        {text && <span className="toggle-t" style={{ display: 'block' }}>{text}</span>}
      </span>
    </label>
  );
}
export function Select<T extends string | number>({ value, options, onChange }: { value: T; options: { id: T; label: string; disabled?: boolean }[]; onChange: (v: T) => void }) {
  const numeric = typeof value === 'number';
  return (
    <select className="select" value={String(value)} onChange={(e) => onChange((numeric ? Number(e.target.value) : e.target.value) as T)}>
      {options.map((o) => <option key={String(o.id)} value={String(o.id)} disabled={o.disabled}>{o.label}</option>)}
    </select>
  );
}
export function TextInput({ value, onChange, placeholder, type = 'text', invalid, autoComplete }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; invalid?: boolean; autoComplete?: string }) {
  return <input className={cx('input', invalid && 'invalid')} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />;
}

/* ---------- Anzeige ---------- */
export function Badge({ kind = 'grey', children }: { kind?: 'blue' | 'ok' | 'warn' | 'error' | 'grey' | 'info'; children: ReactNode }) {
  return <span className={cx('badge', kind)}>{children}</span>;
}
export const SevIcon = ({ s, size = 18 }: { s: Severity; size?: number }) =>
  s === 'error' ? <XCircle size={size} /> : s === 'warn' ? <AlertTriangle size={size} /> : s === 'ok' ? <CheckCircle2 size={size} /> : <InfoIcon size={size} />;

export function Callout({ severity, title, children, action }: { severity: Severity; title?: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className={cx('callout', severity)}>
      <SevIcon s={severity} />
      <div>{title && <b>{title}</b>}{children}{action && <div>{action}</div>}</div>
    </div>
  );
}
export function FindingList({ findings, compact }: { findings: Finding[]; compact?: boolean }) {
  const fix = useStore((s) => s.fix);
  if (!findings.length) return null;
  return (
    <div>
      {findings.map((f) => (
        <Callout key={f.id} severity={f.severity} title={f.title}
          action={f.fix && <button type="button" className="btn sm" onClick={() => fix(f.fix!.action)}>{f.fix.label}</button>}>
          {!compact || f.severity !== 'info' ? f.text : f.text}
        </Callout>
      ))}
    </div>
  );
}
export function Meter({ value, label, right }: { value: number; label?: string; right?: string }) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className="stn-bar">
      {label && <span><b style={{ fontWeight: 600 }}>{label}</b><em style={{ fontStyle: 'normal' }}>{right}</em></span>}
      <div className="meter"><i className={cx(value > 1.001 && 'error', value > 0.9 && value <= 1.001 && 'warn')} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return <dl className="kv">{rows.map(([k, v]) => [<dt key={k + 'k'}>{k}</dt>, <dd key={k + 'v'}>{v}</dd>])}</dl>;
}

/* ---------- Modal ---------- */
export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const id = useId();
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('modal', wide && 'wide')} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="modal-head"><h2 id={id}>{title}</h2><button type="button" className="iconbtn" aria-label="Schließen" onClick={onClose}><X size={19} /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>, document.body);
}

/* ---------- RAL-Auswahl ---------- */
export function RalPicker({ label, value, onChange, note }: { label: string; value: string; onChange: (code: string) => void; note?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const cur = ral(value);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const all = [...RAL.filter((c) => c.serie), ...RAL.filter((c) => !c.serie)];
    return s ? all.filter((c) => c.code.includes(s) || c.name.toLowerCase().includes(s)) : all;
  }, [q]);
  return (
    <div>
      <div className="ral-row">
        <span className="ral-swatch" style={{ background: cur.hex }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 620, fontSize: 13.3 }}>{label}</div>
          <div className="muted small">RAL {cur.code} {cur.name}{SERIE_RAL.includes(cur.code) ? ' · Serienfarbe' : ''}{note ? ` · ${note}` : ''}</div>
        </div>
        <button type="button" className="btn sm" onClick={() => setOpen((o) => !o)}>{open ? 'Schließen' : 'Ändern'}</button>
      </div>
      {open && (
        <div className="box" style={{ margin: '6px 0 10px' }}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search size={15} style={{ position: 'absolute', left: 9, top: 10, color: 'var(--ink-3)' }} />
            <input className="input" style={{ paddingLeft: 30 }} placeholder="RAL-Nummer oder Farbname suchen" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="ral-grid">
            {list.map((c) => (
              <button key={c.code} type="button" title={`RAL ${c.code} ${c.name}${c.serie ? ' (Serienfarbe)' : ''}`} className={cx('ral-cell', c.code === value && 'on', c.serie && 'serie')} style={{ background: c.hex }} onClick={() => onChange(c.code)} />
            ))}
          </div>
          <div className="muted small" style={{ marginTop: 7 }}>Weißer Punkt = GRÄPER-Serienfarbe. Bildschirmdarstellung nicht farbverbindlich.</div>
        </div>
      )}
    </div>
  );
}

/** Hält die Größe eines Elements aktuell (für SVG-Ansichten). */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    /* Größenänderungen werden am Element beobachtet und nicht nur am Browserfenster. */ const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}
