import { create } from 'zustand';
import type { Config, StepId, UseCaseId } from '../domain/types';
import { defaultConfig } from '../domain/defaults';
import { applyFix, derive, normalize, type Derived } from '../domain/engine';
import { useCase } from '../data/usecases';

const KEY = 'graeper-konfigurator:v1';

export type ViewTab = '3d' | 'grundriss' | 'schaltplan' | 'aufstellung';
export type CameraPreset = 'iso' | 'front' | 'back' | 'left' | 'right' | 'top';
export type Scenery = 'studio' | 'standort' | 'baugrube';

export interface SavedEntry { id: string; name: string; savedAt: string; summary: string; config: Config }
export interface Toast { id: number; text: string; kind: 'ok' | 'info' | 'error' }

interface State {
  config: Config;
  derived: Derived;
  step: StepId;
  visited: StepId[];
  past: Config[]; future: Config[];
  // Ansicht
  viewTab: ViewTab;
  doorsOpen: boolean; xray: boolean; roofOff: boolean; showDims: boolean; showPerson: boolean;
  scenery: Scenery;
  camera: { preset: CameraPreset; nonce: number };
  // UI
  modal: null | 'laden' | 'teilen' | 'check' | 'hilfe' | 'glossar' | 'neu';
  glossaryTerm: string | null;
  toasts: Toast[];
  saved: SavedEntry[];
  // Aktionen
  update: (fn: (draft: Config) => void, opts?: { silent?: boolean }) => void;
  replace: (c: Config, opts?: { keepStep?: boolean }) => void;
  setUseCase: (id: UseCaseId) => void;
  fix: (action: string) => void;
  undo: () => void; redo: () => void;
  goto: (s: StepId) => void; next: () => void; prev: () => void;
  setView: (p: Partial<Pick<State, 'viewTab' | 'doorsOpen' | 'xray' | 'roofOff' | 'showDims' | 'showPerson' | 'scenery'>>) => void;
  setCamera: (preset: CameraPreset) => void;
  openModal: (m: State['modal'], term?: string | null) => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  saveLocal: (name?: string) => SavedEntry;
  deleteLocal: (id: string) => void;
  reset: () => void;
}

/** Fehlende Felder älterer Speicherstände mit Standardwerten auffüllen. */
export function mergeConfig(input: unknown): Config {
  const base = defaultConfig() as unknown as Record<string, unknown>;
  const merge = (a: Record<string, unknown>, b: unknown): Record<string, unknown> => {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return a;
    const out: Record<string, unknown> = { ...a };
    for (const [k, v] of Object.entries(b as Record<string, unknown>)) {
      if (!(k in a)) continue;
      const av = a[k];
      if (av && typeof av === 'object' && !Array.isArray(av) && v && typeof v === 'object' && !Array.isArray(v)) {
        // Wörterbuch-Felder (Zubehör, Leistungen) vollständig übernehmen
        out[k] = Object.keys(av as object).length === 0 ? { ...(v as object) } : merge(av as Record<string, unknown>, v);
      } else if (typeof av === typeof v || av === null) out[k] = v;
    }
    return out;
  };
  return normalize(merge(base, input) as unknown as Config);
}

function loadInitial(): { config: Config; step: StepId; visited: StepId[] } {
  try {
    const raw = localStorage.getItem(KEY + ':current');
    if (raw) {
      const p = JSON.parse(raw);
      const config = mergeConfig(p.config);
      const steps = useCase(config.useCase).steps;
      return { config, step: steps.includes(p.step) ? p.step : 'start', visited: Array.isArray(p.visited) ? p.visited : ['start'] };
    }
  } catch { /* defekter Speicherstand wird verworfen */ }
  return { config: normalize(defaultConfig()), step: 'start', visited: ['start'] };
}
function loadSaved(): SavedEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY + ':saved') ?? '[]'); } catch { return []; }
}
const persist = (s: Pick<State, 'config' | 'step' | 'visited'>) => {
  try { localStorage.setItem(KEY + ':current', JSON.stringify({ config: s.config, step: s.step, visited: s.visited })); } catch { /* Speicher voll/gesperrt */ }
};

export function summaryLine(c: Config, d: Derived): string {
  const t = c.transformer;
  const parts = [d.geometry.title];
  if (t.count > 0) parts.push(`${t.count > 1 ? t.count + ' × ' : ''}${t.powerKva.toLocaleString('de-DE')} kVA`);
  if (c.mv.fields.length) parts.push(c.mv.fields.map((f) => (f.type === 'UE' ? 'Ü' : f.type)).join(''));
  return parts.join(' · ');
}

let toastId = 1;
const initial = loadInitial();

export const useStore = create<State>((set, get) => ({
  config: initial.config,
  derived: derive(initial.config),
  step: initial.step,
  visited: initial.visited,
  past: [], future: [],
  viewTab: '3d', doorsOpen: false, xray: false, roofOff: false, showDims: true, showPerson: true,
  scenery: 'standort',
  camera: { preset: 'iso', nonce: 0 },
  modal: null, glossaryTerm: null, toasts: [], saved: loadSaved(),

  update: (fn) => {
    const prev = get().config;
    /* Die Kopie löst unterstützte Datenstrukturen von den Referenzen des ursprünglichen Objekts. */ const draft = structuredClone(prev);
    fn(draft);
    const config = normalize(draft);
    /* JSON kodiert den aktuellen Wert als Text; Referenzen zwischen Objekten bleiben dabei nicht erhalten. */ if (JSON.stringify(config) === JSON.stringify(prev)) return;
    const autoChanged = prev.building.kind === 'kompakt' && config.building.kind === 'kompakt' && prev.building.compactId !== config.building.compactId && draft.building.compactId === prev.building.compactId;
    set((s) => ({ config, derived: derive(config), past: [...s.past.slice(-49), prev], future: [] }));
    persist(get());
    if (autoChanged) get().toast(`Station automatisch angepasst: ${get().derived.geometry.title}`, 'info');
  },
  replace: (c, opts) => {
    const config = mergeConfig(c);
    const steps = useCase(config.useCase).steps;
    set((s) => ({ config, derived: derive(config), past: [...s.past.slice(-49), s.config], future: [], step: opts?.keepStep && steps.includes(s.step) ? s.step : 'start', visited: opts?.keepStep ? s.visited : [...steps] }));
    persist(get());
  },
  setUseCase: (id) => {
    const prev = get().config;
    const config = normalize(useCase(id).apply(prev));
    set((s) => ({ config, derived: derive(config), past: [...s.past.slice(-49), prev], future: [] }));
    persist(get());
  },
  fix: (action) => {
    const prev = get().config;
    const config = applyFix(prev, action);
    set((s) => ({ config, derived: derive(config), past: [...s.past.slice(-49), prev], future: [] }));
    persist(get());
    get().toast('Korrektur übernommen', 'ok');
  },
  undo: () => {
    const { past, config, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({ config: prev, derived: derive(prev), past: past.slice(0, -1), future: [config, ...future].slice(0, 50) });
    persist(get());
  },
  redo: () => {
    const { past, config, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({ config: next, derived: derive(next), past: [...past, config], future: future.slice(1) });
    persist(get());
  },
  goto: (step) => {
    set((s) => ({ step, visited: s.visited.includes(step) ? s.visited : [...s.visited, step] }));
    persist(get());
    document.querySelector('.panel-scroll')?.scrollTo({ top: 0 });
  },
  next: () => { const st = useCase(get().config.useCase).steps; const i = st.indexOf(get().step); if (i < st.length - 1) get().goto(st[i + 1]); },
  prev: () => { const st = useCase(get().config.useCase).steps; const i = st.indexOf(get().step); if (i > 0) get().goto(st[i - 1]); },
  setView: (p) => set(p),
  setCamera: (preset) => set((s) => ({ camera: { preset, nonce: s.camera.nonce + 1 }, viewTab: '3d' })),
  openModal: (modal, term = null) => set({ modal, glossaryTerm: term }),
  toast: (text, kind = 'ok') => {
    const id = toastId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, kind }] }));
    /* Die Verzögerung ist eine Mindestwartezeit; ein belegter Ereignis-Loop kann den Aufruf später ausführen. */ setTimeout(() => get().dismissToast(id), 4200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  saveLocal: (name) => {
    const { config, derived, saved } = get();
    const entry: SavedEntry = { id: Date.now().toString(36), name: name?.trim() || config.projectName || 'Konfiguration', savedAt: new Date().toISOString(), summary: summaryLine(config, derived), config };
    const list = [entry, ...saved.filter((e) => e.name !== entry.name)].slice(0, 40);
    set({ saved: list });
    try { localStorage.setItem(KEY + ':saved', JSON.stringify(list)); } catch { /* ignorieren */ }
    return entry;
  },
  deleteLocal: (id) => {
    const list = get().saved.filter((e) => e.id !== id);
    set({ saved: list });
    try { localStorage.setItem(KEY + ':saved', JSON.stringify(list)); } catch { /* ignorieren */ }
  },
  reset: () => {
    const config = normalize(defaultConfig());
    set((s) => ({ config, derived: derive(config), step: 'start', visited: ['start'], past: [...s.past.slice(-49), s.config], future: [] }));
    persist(get());
  },
}));

export const useConfig = () => useStore((s) => s.config);
export const useDerived = () => useStore((s) => s.derived);
