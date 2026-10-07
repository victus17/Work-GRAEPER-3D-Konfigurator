/**
 * GRÄPER Stationskonfigurator – Server
 * Liefert die gebaute Oberfläche (dist/) aus und speichert geteilte Konfigurationen und Anfragen in SQLite (node:sqlite).
 * Start: npm run build && npm start   ·   Umgebungsvariablen siehe README.md
 */
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const DATA = resolve(process.env.DATA_DIR ?? join(root, 'data'));
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? '';
const WEBHOOK = process.env.INQUIRY_WEBHOOK_URL ?? '';
mkdirSync(join(DATA, 'outbox'), { recursive: true });

const db = new DatabaseSync(join(DATA, 'konfigurator.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS configurations (id TEXT PRIMARY KEY, name TEXT, config TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, company TEXT, name TEXT, email TEXT, phone TEXT,
    customer_type TEXT, summary TEXT, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'neu');
`);
const id = (n = 10) => randomBytes(n).toString('base64url').slice(0, n);
const MAX = 400_000;

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' }, bodyLimit: MAX });

// einfache Begrenzung gegen Missbrauch: max. 30 Schreibzugriffe je IP und Minute
const hits = new Map();
app.addHook('onRequest', async (req, reply) => {
  if (req.method !== 'POST') return;
  const now = Date.now(), key = req.ip, list = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(key, list);
  if (list.length > 30) return reply.code(429).send({ error: 'Zu viele Anfragen – bitte später erneut versuchen.' });
});
app.addHook('onSend', async (_req, reply, payload) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  return payload;
});

app.get('/api/health', async () => ({ ok: true, time: new Date().toISOString() }));

app.post('/api/configurations', async (req, reply) => {
  const { name, config } = req.body ?? {};
  if (!config || typeof config !== 'object' || config.schema !== 1) return reply.code(400).send({ error: 'Ungültige Konfiguration' });
  const key = id(10);
  db.prepare('INSERT INTO configurations (id, name, config, created_at) VALUES (?, ?, ?, ?)').run(key, String(name ?? '').slice(0, 200), JSON.stringify(config), new Date().toISOString());
  return { id: key };
});
app.get('/api/configurations/:id', async (req, reply) => {
  const row = db.prepare('SELECT name, config, created_at FROM configurations WHERE id = ?').get(String(req.params.id));
  if (!row) return reply.code(404).send({ error: 'Nicht gefunden' });
  return { name: row.name, createdAt: row.created_at, config: JSON.parse(row.config) };
});

app.post('/api/inquiries', async (req, reply) => {
  const b = req.body ?? {};
  const c = b.contact ?? {};
  const email = String(c.email ?? '');
  if (!c.company || !c.name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || c.consent !== true || !b.config) return reply.code(400).send({ error: 'Pflichtangaben fehlen' });
  const year = new Date().getFullYear();
  const key = `KA-${year}-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
  const created = new Date().toISOString();
  db.prepare('INSERT INTO inquiries (id, created_at, company, name, email, phone, customer_type, summary, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(key, created, String(c.company).slice(0, 200), String(c.name).slice(0, 200), email.slice(0, 200), String(c.phone ?? '').slice(0, 60), String(c.customerType ?? ''), String(b.summary ?? '').slice(0, 500), JSON.stringify(b));
  // Ablage für die Weiterverarbeitung (z. B. CRM-Import, Mail-Versand per Cron)
  writeFileSync(join(DATA, 'outbox', `${key}.json`), JSON.stringify({ id: key, createdAt: created, ...b }, null, 2));
  writeFileSync(join(DATA, 'outbox', `${key}_Leistungsbeschreibung.txt`), String(b.spec ?? ''));
  if (WEBHOOK) fetch(WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: key, createdAt: created, contact: c, summary: b.summary, findings: b.findings }) }).catch((e) => app.log.warn({ err: e }, 'Webhook fehlgeschlagen'));
  app.log.info({ id: key, company: c.company }, 'Neue Anfrage');
  return { id: key };
});

const admin = (req, reply) => {
  if (!ADMIN_TOKEN || req.headers['x-admin-token'] !== ADMIN_TOKEN) { reply.code(401).send({ error: 'Nicht berechtigt' }); return false; }
  return true;
};
app.get('/api/admin/inquiries', async (req, reply) => {
  if (!admin(req, reply)) return;
  return db.prepare('SELECT id, created_at, company, name, email, phone, customer_type, summary, status FROM inquiries ORDER BY created_at DESC LIMIT 500').all();
});
app.get('/api/admin/inquiries/:id', async (req, reply) => {
  if (!admin(req, reply)) return;
  const row = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(String(req.params.id));
  return row ? { ...row, payload: JSON.parse(row.payload) } : reply.code(404).send({ error: 'Nicht gefunden' });
});
app.patch('/api/admin/inquiries/:id', async (req, reply) => {
  if (!admin(req, reply)) return;
  const status = String(req.body?.status ?? '');
  if (!['neu', 'in Bearbeitung', 'angeboten', 'abgeschlossen'].includes(status)) return reply.code(400).send({ error: 'Ungültiger Status' });
  db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, String(req.params.id));
  return { ok: true };
});

const dist = join(root, 'dist');
if (existsSync(dist)) {
  // Gehashte Assets lange cachen, index.html nie (sonst kommen neue Versionen nicht an)
  await app.register(fastifyStatic, {
    root: dist, wildcard: true, cacheControl: false,
    setHeaders: (reply, path) => reply.header('Cache-Control', path.includes(`${'/'}assets${'/'}`) ? 'public, max-age=31536000, immutable' : 'no-cache'),
  });
  app.setNotFoundHandler((req, reply) => (req.url.startsWith('/api/') || req.url.startsWith('/assets/') ? reply.code(404).send({ error: 'Nicht gefunden' }) : reply.header('Cache-Control', 'no-cache').sendFile('index.html')));
} else {
  app.log.warn('dist/ fehlt – nur API aktiv. Für die Oberfläche zuerst „npm run build" ausführen oder „npm run dev" nutzen.');
}

app.listen({ port: PORT, host: HOST }).catch((e) => { app.log.error(e); process.exit(1); });
