import { create } from 'zustand';
import type { Config } from '../domain/types';

/* ---------- Dateien ---------- */
export function download(name: string, content: string | Blob, mime = 'text/plain;charset=utf-8') {
  /* Der Blob kapselt die Daten zusammen mit ihrem MIME-Typ für Download oder Weiterverarbeitung. */ const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content;
  /* Die temporäre Objekt-URL verweist auf lokale Daten und muss nach der Nutzung freigegeben werden. */ const url = URL.createObjectURL(blob);
  /* Die Eigenschaften werden flach kopiert; verschachtelte Werte bleiben gemeinsame Referenzen. */ const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  /* Die Verzögerung ist eine Mindestwartezeit; ein belegter Ereignis-Loop kann den Aufruf später ausführen. */ setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export const safeName = (s: string) => (s || 'Station').replace(/[^\wäöüÄÖÜß-]+/g, '_').replace(/_+/g, '_').slice(0, 60);
export async function copyText(text: string): Promise<boolean> {
  try { /* Das Schreiben benötigt Browserberechtigung und kann deshalb als Promise fehlschlagen. */ await navigator.clipboard.writeText(text); return true; } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text }); document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  }
}

/* ---------- Teilen-Link (komprimiert im URL-Fragment, verlässt den Browser nicht) ---------- */
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));
export async function encodeConfig(c: Config): Promise<string> {
  /* JSON kodiert den aktuellen Wert als Text; Referenzen zwischen Objekten bleiben dabei nicht erhalten. */ const raw = new TextEncoder().encode(JSON.stringify(c));
  if (typeof CompressionStream !== 'undefined') {
    const buf = await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
    return 'z' + b64url(new Uint8Array(buf));
  }
  return 'j' + b64url(raw);
}
export async function decodeConfig(s: string): Promise<unknown> {
  const bytes = unb64url(s.slice(1));
  if (s[0] === 'z') {
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
    /* Serialisierte JSON-Daten werden hier wieder in JavaScript-Werte umgewandelt. */ return JSON.parse(new TextDecoder().decode(buf));
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

/* ---------- Server (optional – der Konfigurator funktioniert auch ohne) ---------- */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  /* Das Signal erlaubt kooperativen Abbruch; nur angeschlossene Operationen reagieren darauf. */ const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    /* fetch lehnt Netzwerkfehler ab; HTTP-Fehlercodes müssen über den Antwortstatus geprüft werden. */ const r = await fetch(path, { ...init, signal: ctl.signal, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`${r.status} ${await r.text().catch(() => '')}`.trim());
    return (await r.json()) as T;
  } finally { /* Ein noch ausstehender Timer wird verworfen, damit seine Aktion nicht nachträglich startet. */ clearTimeout(timer); }
}

/* ---------- Druck-Datenblatt ---------- */
export const usePrint = create<{ image: string | null; at: string | null; set: (image: string | null) => void }>((set) => ({
  image: null, at: null, set: (image) => set({ image, at: new Date().toISOString() }),
}));
