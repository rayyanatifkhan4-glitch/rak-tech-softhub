import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Monitor, Wifi, Database } from 'lucide-react';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Settings() {
  const [dbMode, setDbMode] = useState('local');
  const [serverIp, setServerIp] = useState('localhost');
  const [myIp, setMyIp] = useState('127.0.0.1');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Load current configuration
    const savedMode = localStorage.getItem('erp_db_mode') || 'local';
    const savedIp = localStorage.getItem('erp_server_ip') || 'localhost';
    
    setDbMode(savedMode);
    setServerIp(savedIp);

    // Get current machine local IP address using Node.js os module
    try {
      if (window.require) {
        const os = window.require('os');
        const interfaces = os.networkInterfaces();
        let foundIp = '';
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name]) {
            // Filter out 127.0.0.1 and IPv6 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
              foundIp = iface.address;
              break;
            }
          }
          if (foundIp) break;
        }
        if (foundIp) setMyIp(foundIp);
      }
    } catch (e) {
      console.warn("Could not retrieve local IP via Node.js", e);
    }
  }, []);

  const handleSaveSettings = async () => {
    localStorage.setItem('erp_db_mode', dbMode);
    localStorage.setItem('erp_server_ip', serverIp);
    
    setSaveStatus('Saving settings & syncing database...');
    
    // Sync with the database instantly to verify
    try {
      const data = await loadDatabase();
      await saveDatabase(data);
      setSaveStatus('Success! Settings saved and database synced.');
    } catch (e) {
      setSaveStatus('Settings saved, but failed to establish network sync. Fallback database loaded.');
    }

    setTimeout(() => setSaveStatus(''), 4000);
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure local and network database sync settings.</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: 'var(--sp-6)', maxWidth: '600px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-4)', color: 'white' }}>
          <Database size={22} color="var(--accent-primary)" />
          Local Network Database Configurations
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--sp-6)', lineHeight: '1.4' }}>
          By default, Tech ERP stores all database records locally on this computer. You can share this database with other computers on your Wi-Fi/local network by setting up one PC as the Server and others as Clients.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          {/* Mode Selection */}
          <div className="input-group">
            <label className="input-label">Select Database Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
              
              <button 
                onClick={() => setDbMode('local')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: 'var(--sp-4)',
                  background: dbMode === 'local' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: dbMode === 'local' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Server size={24} color={dbMode === 'local' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Local Mode (Main Server)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Database runs on this PC. Other PCs can connect to it.</span>
              </button>

              <button 
                onClick={() => setDbMode('client')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: 'var(--sp-4)',
                  background: dbMode === 'client' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: dbMode === 'client' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Monitor size={24} color={dbMode === 'client' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Client Mode (Connect)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Connects to the database hosted on your main server PC.</span>
              </button>

            </div>
          </div>

          {/* Configuration Inputs */}
          {dbMode === 'local' ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Wifi size={18} color="var(--accent-success)" />
                <strong style={{ color: 'white', fontSize: '0.9rem' }}>Database Server Active</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                This computer is acting as the central database repository. To connect other computers to this database:
              </p>
              <ol style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '20px', margin: 0 }}>
                <li>Install Tech ERP on your other computers.</li>
                <li>Go to Settings on the other computers and select <strong>Client Mode</strong>.</li>
                <li>Enter this computer's local IP address: <strong style={{ color: 'white' }}>{myIp}</strong></li>
              </ol>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Main Server IP Address</label>
                <input 
                  className="input-field" 
                  value={serverIp} 
                  onChange={e => setServerIp(e.target.value)} 
                  placeholder="E.g. 192.168.1.10" 
                />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Input the IP address displayed in Settings on your main database server PC. Ensure both PCs are connected to the same Wi-Fi/local network.
              </p>
            </div>
          )}

          {/* Action Button */}
          <button className="btn btn-primary" style={{ marginTop: 'var(--sp-2)', height: '45px' }} onClick={handleSaveSettings}>
            Save configurations
          </button>

          {/* Status Message */}
          {saveStatus && (
            <div style={{ 
              textAlign: 'center', 
              fontSize: '0.85rem', 
              color: saveStatus.includes('failed') ? 'var(--accent-danger)' : 'var(--accent-primary)',
              marginTop: '4px'
            }}>
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
