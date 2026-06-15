import { app, BrowserWindow } from 'electron';
import path from 'path';
import http from 'http';
import fs from 'fs';

let mainWindow;

// --- database local server setup ---
const dbPath = path.join(app.getPath('userData'), 'database.json');

// Initialize database file with default collections if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({
    clients: [
      { id: 1, name: 'Acme Corp', contact: 'John Doe', email: 'john@acme.co', phone: '+92 300 1234567', status: 'Active Client', goAhead: 'Approved' },
      { id: 2, name: 'Stark Industries', contact: 'Tony Stark', email: 'tony@stark.com', phone: '+92 321 9876543', status: 'Lead', goAhead: 'In Discussion' }
    ],
    invoices: [],
    tasks: [],
    services: [
      { id: 'S-001', name: 'SEO Optimization', category: 'Digital', price: '50000', description: 'Search engine optimization to rank keywords and increase traffic.' },
      { id: 'S-002', name: 'Meta Ads Management', category: 'Digital', price: '75000', description: 'Meta/Facebook campaigns targetted at high-ROAS lead generation.' },
      { id: 'S-003', name: 'Google Ads (PPC)', category: 'Digital', price: '60000', description: 'PPC advertising capturing high-intent search queries.' },
      { id: 'S-004', name: 'Social Media Marketing', category: 'Digital', price: '40000', description: 'Full channel social media growth and content calendar management.' },
      { id: 'S-005', name: 'Web Design & Development', category: 'Digital', price: '150000', description: 'Modern, responsive conversion-focused web development.' }
    ],
    vendors: [],
    purchaseOrders: [],
    products: [
      { id: 'P-001', name: 'Network Cable (Cat6)', category: 'Hardware', price: '150', stock: 500, minStock: 50, unit: 'meter' },
      { id: 'P-002', name: 'CCTV Camera (2MP)', category: 'Hardware', price: '8500', stock: 25, minStock: 5, unit: 'piece' },
      { id: 'P-003', name: 'Biometric Device', category: 'Hardware', price: '22000', stock: 10, minStock: 3, unit: 'piece' }
    ],
    employees: [],
    attendance: [],
    salarySlips: [],
    transactions: [],
    quotations: []
  }, null, 2));
} else {
  // Ensure backward compatibility — add new keys to existing DB if missing
  try {
    const existingData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    let updated = false;
    const newKeys = { vendors: [], purchaseOrders: [], products: [], employees: [], attendance: [], salarySlips: [], transactions: [], quotations: [] };
    for (const [key, defaultVal] of Object.entries(newKeys)) {
      if (!existingData[key]) {
        existingData[key] = defaultVal;
        updated = true;
      }
    }
    if (updated) {
      fs.writeFileSync(dbPath, JSON.stringify(existingData, null, 2));
    }
  } catch (e) {
    console.warn('Could not migrate database schema:', e);
  }
}

// Start local LAN Database API Server
const startDatabaseServer = () => {
  const server = http.createServer((req, res) => {
    // Set CORS Headers to allow requests from other LAN systems
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === '/api/db' && req.method === 'GET') {
      fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to read database file' }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        }
      });
    } else if (req.url === '/api/db' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          fs.writeFile(dbPath, JSON.stringify(parsed, null, 2), 'utf8', (err) => {
            if (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to save database file' }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            }
          });
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON data' }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
  });

  // Listen on port 3010 on all local network interfaces
  server.listen(3010, '0.0.0.0', () => {
    console.log('LAN database server is running on port 3010');
  });
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1000,
    minHeight: 650,
    title: 'Tech ERP — All-in-One Business Suite',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
  }

  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  startDatabaseServer(); // Start LAN server
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
