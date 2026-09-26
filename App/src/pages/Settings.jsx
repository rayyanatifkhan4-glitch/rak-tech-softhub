import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Server, Monitor, Wifi, Database, UserCheck, Shield, ArrowRight } from 'lucide-react';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Settings() {
  const navigate = useNavigate();
  const [dbMode, setDbMode] = useState('local');
  const [serverIp, setServerIp] = useState('localhost');
  const [myIp, setMyIp] = useState('127.0.0.1');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Load current configuration
    const isCapacitor = window.Capacitor !== undefined || 
                        (window.location.href.startsWith('http://localhost') === false && 
                         window.location.href.startsWith('file://'));
    const savedMode = localStorage.getItem('erp_db_mode') || (isCapacitor ? 'standalone' : 'local');
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
      setSaveStatus('Success! Settings saved and database loaded.');
    } catch (e) {
      setSaveStatus('Settings saved. Fallback local database active.');
    }

    setTimeout(() => setSaveStatus(''), 4000);
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure user access control, roles, and network database sync settings.</p>
        </div>
      </header>

      {/* User Management & Access Control Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', maxWidth: '700px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(15,23,42,0.8))', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              User Accounts & Service Permissions (RBAC)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#94a3b8' }}>
              Create software users, assign roles (Admin, Manager, Staff), and grant module access
            </p>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/users')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', fontSize: '0.88rem' }}
        >
          Manage Users <ArrowRight size={16} />
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--sp-6)', maxWidth: '700px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--sp-4)', color: 'white' }}>
          <Database size={22} color="var(--accent-primary)" />
          Local & Network Database Configurations
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--sp-6)', lineHeight: '1.4' }}>
          Choose how Tech ERP stores and syncs your business documents. You can run it offline-first, connect to a central PC on the network, or set this PC as the main server.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          {/* Mode Selection */}
          <div className="input-group">
            <label className="input-label">Select Database Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '6px' }}>
              
              <button 
                onClick={() => setDbMode('standalone')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: 'var(--sp-4)',
                  background: dbMode === 'standalone' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: dbMode === 'standalone' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Database size={24} color={dbMode === 'standalone' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Standalone Offline</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Runs purely on this device. Best for standalone Mobile app.</span>
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
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>LAN Client (Sync)</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Syncs data over Wi-Fi with the main desktop server PC.</span>
              </button>

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
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Desktop Server</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Main Server hosting the file. (Desktop PC only)</span>
              </button>

            </div>
          </div>

          {/* Configuration Inputs */}
          {dbMode === 'standalone' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Database size={18} color="var(--accent-primary)" />
                <strong style={{ color: 'white', fontSize: '0.9rem' }}>Standalone Mode Active</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                This app runs fully offline and stores its database locally on this phone/device. You do not need any network connection to use the ERP.
              </p>
            </div>
          )}

          {dbMode === 'local' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Wifi size={18} color="var(--accent-success)" />
                <strong style={{ color: 'white', fontSize: '0.9rem' }}>Local Desktop Server Active</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                This PC acts as the central database manager. To connect your mobile app or other workstations to this server:
              </p>
              <ol style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '20px', margin: 0 }}>
                <li>Make sure this PC and the mobile device are on the same Wi-Fi network.</li>
                <li>In the mobile app, go to Settings &rarr; select <strong>LAN Client Mode</strong>.</li>
                <li>Enter this server IP address: <strong style={{ color: 'white' }}>{myIp}</strong></li>
              </ol>
            </div>
          )}

          {dbMode === 'client' && (
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
                Input the IP address displayed on your desktop server Settings page. Both your phone/PC and the server must be connected to the exact same local Wi-Fi router.
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
