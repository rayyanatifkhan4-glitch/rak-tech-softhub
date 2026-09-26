import { app, BrowserWindow } from 'electron';
import path from 'path';
import http from 'http';
import fs from 'fs';
import crypto from 'crypto';

let mainWindow;
let dbServer;

// ─── Paths ────────────────────────────────────────────────────────────────────
const userDataPath = app.getPath('userData');
const dbPath       = path.join(userDataPath, 'database.json');
const tmpPath      = path.join(userDataPath, 'database.tmp.json');
const backupDir    = path.join(userDataPath, 'backups');

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

// ─── Constants ────────────────────────────────────────────────────────────────
const SCHEMA_VERSION = 2;
const MAX_PAYLOAD    = 10 * 1024 * 1024; // 10 MB
const MAX_BACKUPS    = 15;

// SHA-256 of 'admin123' — used only for initial DB seed, never transmitted
const DEFAULT_ADMIN_HASH = crypto.createHash('sha256').update('admin123').digest('hex');

const ALLOWED_COLLECTIONS = [
  'clients','invoices','tasks','services','vendors','purchaseOrders',
  'products','employees','attendance','salarySlips','transactions',
  'quotations','documents','users','workspaces','workspaceMemberships',
  'projects','projectTasks','warehouses','stockMovements','tickets',
  'kbArticles','campaigns','auditLog','notifications','approvals',
  'backupHistory','cmsPages','appSettings'
];

// ─── Backup ───────────────────────────────────────────────────────────────────
function backupDatabase() {
  try {
    if (!fs.existsSync(dbPath)) return null;
    const ts   = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(backupDir, `db-${ts}.json`);
    fs.copyFileSync(dbPath, dest);

    // Prune old backups (keep MAX_BACKUPS most recent)
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('db-') && f.endsWith('.json'))
      .sort().reverse();
    files.slice(MAX_BACKUPS).forEach(f => {
      try { fs.unlinkSync(path.join(backupDir, f)); } catch (_) {}
    });
    return dest;
  } catch (e) {
    console.warn('[Backup] Failed:', e.message);
    return null;
  }
}

// ─── Atomic Write ─────────────────────────────────────────────────────────────
function atomicWrite(data) {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(tmpPath, json, 'utf8');
  try {
    fs.renameSync(tmpPath, dbPath); // atomic on same filesystem
  } catch (_) {
    fs.copyFileSync(tmpPath, dbPath); // fallback
    try { fs.unlinkSync(tmpPath); } catch (_2) {}
  }
}

// ─── Read Database ────────────────────────────────────────────────────────────
function readDatabase() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    console.error('[DB] Read error:', e.message);
    return null;
  }
}

// ─── Initialize & Migrate Database ───────────────────────────────────────────
function initializeDatabase() {
  let db    = null;
  let fresh = false;

  if (!fs.existsSync(dbPath)) {
    fresh = true;
    db    = {};
  } else {
    db = readDatabase();
    if (!db) {
      // Corrupted — try latest backup
      const backups = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('db-') && f.endsWith('.json'))
        .sort().reverse();
      if (backups.length > 0) {
        console.warn('[DB] Corrupted — restoring from backup:', backups[0]);
        db = JSON.parse(fs.readFileSync(path.join(backupDir, backups[0]), 'utf8'));
      } else {
        db    = {};
        fresh = true;
      }
    }
  }

  const now      = new Date().toISOString();
  let   migrated = false;

  // ── Meta block ──────────────────────────────────────────────────────────────
  if (!db.meta) {
    db.meta = {
      schemaVersion : SCHEMA_VERSION,
      companyName   : 'RAK Tech Soft Hub',
      companyId     : 'COMP-001',
      currency      : 'PKR',
      currencySymbol: 'Rs.',
      lastUpdatedAt : now,
      lastBackupAt  : '',
      createdAt     : now
    };
    migrated = true;
  } else if ((db.meta.schemaVersion || 1) < SCHEMA_VERSION) {
    db.meta.schemaVersion = SCHEMA_VERSION;
    migrated = true;
  }

  // ── Ensure all collections exist ────────────────────────────────────────────
  ALLOWED_COLLECTIONS.forEach(key => {
    if (!db[key]) { db[key] = []; migrated = true; }
  });

  // ── Seed default data (only if collection is empty) ─────────────────────────
  if (fresh || db.services.length === 0) {
    db.services = [
      { id:'S-001', name:'SEO Optimization',        category:'Digital', price:'50000',  description:'Search engine optimization to rank keywords and increase traffic.', workspaceId:'WS-001' },
      { id:'S-002', name:'Meta Ads Management',     category:'Digital', price:'75000',  description:'Meta/Facebook campaigns targeted at high-ROAS lead generation.',    workspaceId:'WS-001' },
      { id:'S-003', name:'Google Ads (PPC)',         category:'Digital', price:'60000',  description:'PPC advertising capturing high-intent search queries.',             workspaceId:'WS-001' },
      { id:'S-004', name:'Social Media Marketing',  category:'Digital', price:'40000',  description:'Full channel social media growth and content calendar management.', workspaceId:'WS-001' },
      { id:'S-005', name:'Web Design & Development',category:'Digital', price:'150000', description:'Modern, responsive conversion-focused web development.',            workspaceId:'WS-001' }
    ];
    migrated = true;
  }
  if (fresh || db.products.length === 0) {
    db.products = [
      { id:'P-001', name:'Network Cable (Cat6)', category:'Hardware', price:'150',   stock:500, minStock:50, unit:'meter', workspaceId:'WS-001' },
      { id:'P-002', name:'CCTV Camera (2MP)',    category:'Hardware', price:'8500',  stock:25,  minStock:5,  unit:'piece', workspaceId:'WS-001' },
      { id:'P-003', name:'Biometric Device',     category:'Hardware', price:'22000', stock:10,  minStock:3,  unit:'piece', workspaceId:'WS-001' }
    ];
    migrated = true;
  }
  if (fresh || db.clients.length === 0) {
    db.clients = [
      { id:1, name:'Acme Corp',       contact:'John Doe',   email:'john@acme.co',   phone:'+92 300 1234567', status:'Active Client', goAhead:'Approved',    pipelineStage:'Won',  workspaceId:'WS-001' },
      { id:2, name:'Stark Industries',contact:'Tony Stark', email:'tony@stark.com', phone:'+92 321 9876543', status:'Lead',          goAhead:'In Discussion',pipelineStage:'Lead', workspaceId:'WS-001' }
    ];
    migrated = true;
  }

  // ── Default workspace ────────────────────────────────────────────────────────
  if (db.workspaces.length === 0) {
    db.workspaces = [{
      id             : 'WS-001',
      name           : 'RAK Tech Soft Hub',
      companyName    : 'RAK Tech Soft Hub',
      type           : 'main',
      environment    : 'production',
      description    : 'Primary business workspace',
      logo           : '',
      currency       : 'PKR',
      currencySymbol : 'Rs.',
      timezone       : 'Asia/Karachi',
      dateFormat     : 'DD/MM/YYYY',
      status         : 'active',
      enabledModules : [
        'dashboard','crm','sales','invoices','purchasing','inventory',
        'accounting','hr','ledgers','tasks','projects','warehouse',
        'support','marketing','reports','settings','docs'
      ],
      createdAt      : now,
      updatedAt      : now
    }];
    migrated = true;
  }

  // ── Default admin user ───────────────────────────────────────────────────────
  if (db.users.length === 0) {
    db.users = [{
      id                : 'USR-001',
      username          : 'admin',
      email             : 'admin@raktech.com',
      name              : 'System Administrator',
      passwordHash      : DEFAULT_ADMIN_HASH,
      role              : 'super_admin',
      status            : 'active',
      createdAt         : now,
      updatedAt         : now,
      lastLoginAt       : null,
      mustChangePassword: false
    }];
    migrated = true;
  }

  // ── Default workspace membership ─────────────────────────────────────────────
  if (db.workspaceMemberships.length === 0) {
    db.workspaceMemberships = [{
      id          : 'WM-001',
      workspaceId : 'WS-001',
      userId      : 'USR-001',
      role        : 'super_admin',
      status      : 'active',
      isFavorite  : true,
      lastOpenedAt: now,
      createdAt   : now
    }];
    migrated = true;
  }

  // ── Migrate existing records to default workspace ────────────────────────────
  const collectionsToMigrate = [
    'clients','invoices','quotations','vendors','purchaseOrders','products',
    'services','employees','attendance','salarySlips','transactions','tasks','documents'
  ];
  let migCount = 0;
  collectionsToMigrate.forEach(col => {
    if (Array.isArray(db[col])) {
      db[col] = db[col].map(r => {
        if (!r.workspaceId) { migCount++; return { ...r, workspaceId: 'WS-001' }; }
        return r;
      });
    }
  });
  if (migCount > 0) {
    migrated = true;
    console.log(`[DB] Migrated ${migCount} records → workspaceId: WS-001`);
  }

  if (migrated) {
    db.meta.lastUpdatedAt = now;
    atomicWrite(db);
    console.log('[DB] Initialization complete (schema v' + SCHEMA_VERSION + ')');
  } else {
    console.log('[DB] No migration needed (schema v' + SCHEMA_VERSION + ')');
  }
}

// ─── HTTP Server ──────────────────────────────────────────────────────────────
function startDatabaseServer() {

  dbServer = http.createServer((req, res) => {

    // CORS
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Workspace-Id');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // Parse path (strip query string)
    const pathname = req.url.split('?')[0];

    // ── GET /api/health ────────────────────────────────────────────────────────
    if (pathname === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status       : 'ok',
        schemaVersion: SCHEMA_VERSION,
        dbExists     : fs.existsSync(dbPath),
        backupCount  : fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).length,
        timestamp    : new Date().toISOString(),
        appVersion   : app.getVersion()
      }));
      return;
    }

    // ── GET /api/db  (full DB, backward compat) ────────────────────────────────
    if (pathname === '/api/db' && req.method === 'GET') {
      fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to read database' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        }
      });
      return;
    }

    // ── POST /api/db  (full DB replace, backward compat) ──────────────────────
    if (pathname === '/api/db' && req.method === 'POST') {
      let body = '', size = 0;
      req.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_PAYLOAD) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload exceeds 10 MB limit' }));
          req.destroy();
          return;
        }
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid DB shape');

          const bk  = backupDatabase();
          const now = new Date().toISOString();
          if (!parsed.meta) parsed.meta = {};
          parsed.meta.schemaVersion = SCHEMA_VERSION;
          parsed.meta.lastUpdatedAt = now;

          atomicWrite(parsed);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, timestamp: now, backedUpTo: bk }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message || 'Invalid JSON' }));
        }
      });
      return;
    }

    // ── GET /api/:collection ────────────────────────────────────────────────────
    const singleCollMatch = pathname.match(/^\/api\/([a-zA-Z0-9_]+)$/);
    if (singleCollMatch && req.method === 'GET') {
      const coll = singleCollMatch[1];
      if (!ALLOWED_COLLECTIONS.includes(coll)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unknown collection' }));
        return;
      }
      const db = readDatabase();
      if (!db) { res.writeHead(500); res.end(JSON.stringify({ error: 'DB unavailable' })); return; }
      const wsId     = req.headers['x-workspace-id'];
      const noFilter = ['users','workspaces','workspaceMemberships','appSettings'];
      let   data     = db[coll] || [];
      if (wsId && !noFilter.includes(coll)) {
        data = data.filter(r => !r.workspaceId || r.workspaceId === wsId);
      }
      // Exclude soft-deleted unless specifically requested
      data = data.filter(r => r.deletedAt === undefined || r.deletedAt === null);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    // ── POST /api/:collection ────────────────────────────────────────────────────
    if (singleCollMatch && req.method === 'POST') {
      const coll = singleCollMatch[1];
      if (!ALLOWED_COLLECTIONS.includes(coll)) {
        res.writeHead(404); res.end(JSON.stringify({ error: 'Unknown collection' })); return;
      }
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        try {
          const record = JSON.parse(body);
          const db     = readDatabase();
          if (!db) throw new Error('DB unavailable');
          if (!db[coll]) db[coll] = [];
          db[coll].push({ ...record, createdAt: new Date().toISOString() });
          db.meta.lastUpdatedAt = new Date().toISOString();
          backupDatabase();
          atomicWrite(db);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // ── PUT /api/:collection/:id ─────────────────────────────────────────────────
    const recordMatch = pathname.match(/^\/api\/([a-zA-Z0-9_]+)\/(.+)$/);
    if (recordMatch && req.method === 'PUT') {
      const [, coll, id] = recordMatch;
      if (!ALLOWED_COLLECTIONS.includes(coll)) {
        res.writeHead(404); res.end(JSON.stringify({ error: 'Unknown collection' })); return;
      }
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        try {
          const updates = JSON.parse(body);
          const db      = readDatabase();
          if (!db) throw new Error('DB unavailable');
          const idx = (db[coll] || []).findIndex(r => String(r.id) === String(id));
          if (idx === -1) { res.writeHead(404); res.end(JSON.stringify({ error: 'Record not found' })); return; }
          db[coll][idx] = { ...db[coll][idx], ...updates, updatedAt: new Date().toISOString() };
          db.meta.lastUpdatedAt = new Date().toISOString();
          backupDatabase();
          atomicWrite(db);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, record: db[coll][idx] }));
        } catch (e) {
          res.writeHead(400); res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // ── DELETE /api/:collection/:id  (soft delete) ──────────────────────────────
    if (recordMatch && req.method === 'DELETE') {
      const [, coll, id] = recordMatch;
      if (!ALLOWED_COLLECTIONS.includes(coll)) {
        res.writeHead(404); res.end(JSON.stringify({ error: 'Unknown collection' })); return;
      }
      try {
        const db  = readDatabase();
        if (!db) throw new Error('DB unavailable');
        const idx = (db[coll] || []).findIndex(r => String(r.id) === String(id));
        if (idx === -1) { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); return; }
        db[coll][idx] = { ...db[coll][idx], deletedAt: new Date().toISOString() };
        db.meta.lastUpdatedAt = new Date().toISOString();
        backupDatabase();
        atomicWrite(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    // ── 404 ──────────────────────────────────────────────────────────────────────
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found', path: pathname }));
  });

  dbServer.listen(3010, '0.0.0.0', () => {
    console.log('[Server] LAN database API running on port 3010');
  });

  dbServer.on('error', err => console.error('[Server] Error:', err.message));
}

// ─── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width          : 1440,
    height         : 900,
    minWidth       : 1100,
    minHeight      : 700,
    title          : 'RAK Tech ERP — Enterprise Business Suite',
    show           : false,
    backgroundColor: '#0f172a',
    webPreferences : {
      nodeIntegration  : true,
      contextIsolation : false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
  }

  mainWindow.setMenuBarVisibility(false);
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  initializeDatabase();
  startDatabaseServer();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (dbServer) dbServer.close(() => console.log('[Server] Closed gracefully'));
  if (process.platform !== 'darwin') app.quit();
});
