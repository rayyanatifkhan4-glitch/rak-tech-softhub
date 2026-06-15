// Database Service to handle local and local network syncing

const getMode = () => localStorage.getItem('erp_db_mode') || 'local';
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
  'quotations'
];

export const loadDatabase = async () => {
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

