// Database Service to handle local and local network syncing

const getMode = () => {
  // If running inside Capacitor / Mobile webview, default to standalone offline mode
  const isCapacitor = window.Capacitor !== undefined || 
                      (window.location.href.startsWith('http://localhost') === false && 
                       window.location.href.startsWith('file://'));
  return localStorage.getItem('erp_db_mode') || (isCapacitor ? 'standalone' : 'local');
};

const getServerIp = () => localStorage.getItem('erp_server_ip') || 'localhost';

const getBaseUrl = () => {
  const mode = getMode();
  if (mode === 'client') {
    return `http://${getServerIp()}:3010/api/db`;
  }
  return `http://localhost:3010/api/db`;
};

const collections = [
  'clients',
  'invoices',
  'tasks',
  'services',
  'vendors',
  'purchaseOrders',
  'products',
  'employees',
  'attendance',
  'salarySlips',
  'transactions',
  'quotations',
  'documents',
  'users',
  'workspaces',
  'workspaceMemberships',
  'projects',
  'projectTasks',
  'warehouses',
  'stockMovements',
  'tickets',
  'kbArticles',
  'campaigns',
  'auditLog',
  'notifications',
  'approvals',
  'backupHistory',
  'cmsPages',
  'appSettings'
];

export const loadDatabase = async () => {
  const mode = getMode();
  
  // Standalone offline-first mode
  if (mode === 'standalone') {
    const localData = {};
    collections.forEach(key => {
      localData[key] = JSON.parse(
        localStorage.getItem(`erp_cache_${key}`) || 
        localStorage.getItem(`erp_${key}`) || 
        '[]'
      );
    });
    return localData;
  }

  try {
    const res = await fetch(getBaseUrl());
    if (res.ok) {
      const data = await res.json();
      // Cache locally as backup in case server disconnects later
      const loadedData = {};
      collections.forEach(key => {
        if (data[key]) {
          localStorage.setItem(`erp_cache_${key}`, JSON.stringify(data[key]));
          loadedData[key] = data[key];
        } else {
          loadedData[key] = [];
        }
      });
      return loadedData;
    }
  } catch (err) {
    console.warn("Could not connect to database server. Using offline cache.", err);
  }

  // Fallback to local cache if server is offline
  const fallbackData = {};
  collections.forEach(key => {
    fallbackData[key] = JSON.parse(
      localStorage.getItem(`erp_cache_${key}`) || 
      localStorage.getItem(`erp_${key}`) || 
      '[]'
    );
  });
  return fallbackData;
};

export const saveDatabase = async (data) => {
  const payload = {};
  collections.forEach(key => {
    payload[key] = data[key] || [];
    // Update offline caches first
    localStorage.setItem(`erp_cache_${key}`, JSON.stringify(payload[key]));
    // Also write to traditional keys for backwards compatibility fallbacks
    localStorage.setItem(`erp_${key}`, JSON.stringify(payload[key]));
  });

  const mode = getMode();
  if (mode === 'standalone') {
    return true; // Local storage save complete, network sync bypassed
  }

  try {
    const res = await fetch(getBaseUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error("Could not sync with database server.", err);
    return false;
  }
};

