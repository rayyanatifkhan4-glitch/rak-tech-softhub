import React, { useState, useEffect } from 'react';
import { Search, LogOut, Building2, Star, Wifi, WifiOff, Clock, Layers, ChevronRight, Plus, Users, Shield, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { loadDatabase, saveDatabase } from '../utils/db';
import { initials, timeAgo } from '../utils/format';

const ENV_STYLES = {
  production: { bg:'rgba(59,130,246,0.15)',  border:'rgba(59,130,246,0.4)',  text:'#3b82f6',  label:'Production' },
  demo      : { bg:'rgba(245,158,11,0.15)',  border:'rgba(245,158,11,0.4)',  text:'#f59e0b',  label:'Demo' },
  testing   : { bg:'rgba(139,92,246,0.15)', border:'rgba(139,92,246,0.4)', text:'#8b5cf6',  label:'Testing' },
  archived  : { bg:'rgba(100,116,139,0.15)',border:'rgba(100,116,139,0.4)',text:'#64748b', label:'Archived' },
};

function WorkspaceCard({ workspace, membership, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const env      = ENV_STYLES[workspace.environment] || ENV_STYLES.production;
  const isOnline = workspace.serverMode === 'client' ? true : true;
  const moduleCount = (workspace.enabledModules || []).length;
  const lastOpened  = membership?.lastOpenedAt;

  return (
    <div
      onClick={() => onSelect(workspace.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background    : hovered ? 'rgba(30,41,59,0.9)' : 'rgba(15,23,42,0.8)',
        border        : `1px solid ${hovered ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius  : '16px',
        padding       : '24px',
        cursor        : 'pointer',
        transition    : 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
        transform     : hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow     : hovered ? '0 16px 40px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.2)',
        position      : 'relative',
        display       : 'flex',
        flexDirection : 'column',
        gap           : '16px',
      }}
    >
      {membership?.isFavorite && (
        <Star size={13} color='#f59e0b' fill='#f59e0b' style={{ position:'absolute', top:'16px', right:'16px' }} />
      )}

      <div style={{ display:'flex', alignItems:'flex-start', gap:'14px' }}>
        <img src="./logo.png" alt="RAKTechSoftHub Logo" style={{ width: '38px', height: '38px', objectFit: 'contain', flexShrink: 0, marginTop: '4px' }} />

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:'1rem', color:'#f1f5f9', marginBottom:'4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {workspace.name}
          </div>
          <div style={{ fontSize:'0.78rem', color:'#64748b', marginBottom:'6px' }}>
            {workspace.description || workspace.type}
          </div>
          <span style={{
            display      : 'inline-flex', alignItems:'center', gap:'4px',
            padding      : '2px 8px', borderRadius:'999px',
            fontSize     : '0.68rem', fontWeight:600,
            background   : env.bg, color:env.text, border:`1px solid ${env.border}`,
          }}>
            <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:env.text }} />
            {env.label}
          </span>
        </div>
      </div>

      <div style={{
        display       : 'flex',
        alignItems    : 'center',
        gap           : '16px',
        paddingTop    : '12px',
        borderTop     : '1px solid rgba(255,255,255,0.06)',
        fontSize      : '0.78rem',
        color         : '#64748b',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <Layers size={12} />
          <span>{moduleCount} modules</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          {isOnline ? <Wifi size={12} color='#10b981' /> : <WifiOff size={12} color='#f59e0b' />}
          <span style={{ color: isOnline ? '#10b981' : '#f59e0b' }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        {lastOpened && (
          <div style={{ display:'flex', alignItems:'center', gap:'5px', marginLeft:'auto' }}>
            <Clock size={11} />
            <span>{timeAgo(lastOpened)}</span>
          </div>
        )}
      </div>

      <div style={{
        position   : 'absolute',
        bottom     : '20px',
        right      : '20px',
        opacity    : hovered ? 1 : 0,
        transition : 'opacity 0.2s ease',
        color      : '#3b82f6',
      }}>
        <ChevronRight size={18} />
      </div>
    </div>
  );
}

export default function WorkspaceSelector() {
  const { currentUser, logout } = useAuth();
  const { availableWorkspaces, memberships, switchWorkspace, createWorkspace, reloadWorkspaces } = useWorkspace();

  const [search, setSearch]                 = useState('');
  const [showCreateModal, setShowCreate]    = useState(false);
  const [showAccessModal, setShowAccess]    = useState(false);
  
  // Modal states
  const [wsName, setWsName]                 = useState('');
  const [wsDesc, setWsDesc]                 = useState('');
  const [wsEnv, setWsEnv]                   = useState('production');

  // User access state
  const [dbUsers, setDbUsers]               = useState([]);
  const [dbMemberships, setDbMemberships]   = useState([]);
  const [saveStatus, setSaveStatus]         = useState('');

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // Load all users and memberships when User Access modal opens
  useEffect(() => {
    if (showAccessModal) {
      (async () => {
        const db = await loadDatabase();
        let users = db.users || [];
        if (!users || users.length === 0) {
          users = [{
            id: 'USR-001',
            username: 'admin',
            email: 'admin@raktech.com',
            name: 'System Administrator',
            role: 'super_admin',
            status: 'active'
          }];
        }
        setDbUsers(users);
        setDbMemberships(db.workspaceMemberships || []);
      })();
    }
  }, [showAccessModal]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    const newWs = {
      id: `WS-${Date.now().toString().slice(-4)}`,
      name: wsName.trim(),
      companyName: wsName.trim(),
      type: 'branch',
      environment: wsEnv,
      description: wsDesc.trim() || 'Custom workspace',
      status: 'active',
      enabledModules: [
        'dashboard','crm','sales','invoices','purchasing','inventory',
        'accounting','hr','ledgers','tasks','projects','warehouse',
        'support','marketing','reports','settings','docs'
      ]
    };

    await createWorkspace(newWs);
    setWsName('');
    setWsDesc('');
    setShowCreate(false);
  };

  const toggleUserWorkspaceAccess = (userId, workspaceId) => {
    setDbMemberships(prev => {
      const exists = prev.find(m => m.userId === userId && m.workspaceId === workspaceId);
      if (exists) {
        return prev.filter(m => !(m.userId === userId && m.workspaceId === workspaceId));
      } else {
        return [
          ...prev,
          {
            userId,
            workspaceId,
            role: 'member',
            status: 'active',
            isFavorite: false,
            lastOpenedAt: null
          }
        ];
      }
    });
  };

  const handleSaveAccess = async () => {
    setSaveStatus('Saving access permissions...');
    const db = await loadDatabase();
    await saveDatabase({ ...db, workspaceMemberships: dbMemberships });
    await reloadWorkspaces();
    setSaveStatus('Permissions saved successfully!');
    setTimeout(() => {
      setSaveStatus('');
      setShowAccess(false);
    }, 1000);
  };

  const filtered = availableWorkspaces.filter(ws =>
    !search || ws.name.toLowerCase().includes(search.toLowerCase()) ||
    ws.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight      : '100vh',
      background     : '#0a0f1e',
      display        : 'flex',
      flexDirection  : 'column',
      position       : 'relative',
      overflow       : 'hidden',
    }}>
      {/* Background decorations */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-10%', right:'-5%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)' }} />
        <div style={{ position:'absolute', bottom:'-15%', left:'-5%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize:'48px 48px' }} />
      </div>

      {/* Top bar */}
      <div style={{
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'space-between',
        padding        : '16px 32px',
        borderBottom   : '1px solid rgba(255,255,255,0.06)',
        position       : 'relative',
        zIndex         : 1,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <img src="./logo.png" alt="RAKTechSoftHub Logo" style={{ width: '22px', height: '22px', objectFit: 'contain', marginRight: '2px' }} />
          <span style={{ fontWeight:700, fontSize:'0.9rem', color:'#e2e8f0' }}>RAK Tech ERP</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {/* User info */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{
              width:'30px', height:'30px', borderRadius:'50%',
              background:'linear-gradient(135deg, #1d4ed8, #7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'0.7rem', fontWeight:700, color:'white',
            }}>
              {initials(currentUser?.name || 'U')}
            </div>
            <div>
              <div style={{ fontSize:'0.82rem', fontWeight:600, color:'#e2e8f0' }}>{currentUser?.name}</div>
              <div style={{ fontSize:'0.7rem', color:'#64748b' }}>{currentUser?.role?.replace(/_/g,' ')}</div>
            </div>
          </div>

          <div style={{ width:'1px', height:'30px', background:'rgba(255,255,255,0.1)' }} />

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              display:'flex', alignItems:'center', gap:'6px',
              padding:'7px 12px', borderRadius:'8px',
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
              color:'#94a3b8', fontSize:'0.8rem', cursor:'pointer',
              transition:'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.color='#f87171'; e.currentTarget.style.borderColor='rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#94a3b8'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex          : 1,
        display       : 'flex',
        flexDirection : 'column',
        alignItems    : 'center',
        padding       : '48px 32px',
        position      : 'relative',
        zIndex        : 1,
        maxWidth      : '900px',
        margin        : '0 auto',
        width         : '100%',
      }}>
        {/* Greeting */}
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <div style={{ fontSize:'0.82rem', color:'#3b82f6', fontWeight:600, letterSpacing:'0.06em', marginBottom:'8px' }}>
            WELCOME BACK
          </div>
          <h1 style={{
            margin        : 0,
            fontSize      : '2rem',
            fontWeight    : 800,
            color         : '#f1f5f9',
            letterSpacing : '-0.03em',
            lineHeight    : 1.1,
            marginBottom  : '10px',
          }}>
            {currentUser?.name?.split(' ')[0] || 'Hello'}
          </h1>
          <p style={{ margin:0, color:'#64748b', fontSize:'0.9rem' }}>
            Select a workspace to continue
          </p>
        </div>

        {/* Super Admin Control Action Bar */}
        {isSuperAdmin && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '32px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <Plus size={16} />
              Add New Workspace
            </button>

            <button
              onClick={() => setShowAccess(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.12)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
            >
              <Users size={16} />
              User Workspace Management
            </button>
          </div>
        )}

        {/* Search */}
        {availableWorkspaces.length > 3 && (
          <div style={{ width:'100%', maxWidth:'360px', position:'relative', marginBottom:'32px' }}>
            <Search size={15} color='#64748b' style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workspaces…"
              style={{
                width:'100%', padding:'10px 12px 10px 36px',
                background:'rgba(255,255,255,0.05)',
                border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'10px', color:'#e2e8f0', fontSize:'0.875rem',
                outline:'none', boxSizing:'border-box',
              }}
            />
          </div>
        )}

        {/* Workspaces grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#64748b' }}>
            No workspaces found.
          </div>
        ) : (
          <div style={{
            display             : 'grid',
            gridTemplateColumns : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap                 : '16px',
            width               : '100%',
          }}>
            {filtered.map(ws => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                membership={memberships.find(m => m.workspaceId === ws.id)}
                onSelect={switchWorkspace}
              />
            ))}
          </div>
        )}

        {!isSuperAdmin && (
          <div style={{ marginTop:'32px', textAlign:'center' }}>
            <span style={{ fontSize:'0.78rem', color:'#334155' }}>
              Contact your administrator to add workspaces
            </span>
          </div>
        )}
      </div>

      {/* ── Create Workspace Modal ─────────────────────────────────────────── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px', padding: '28px', maxWidth: '460px', width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)', color: '#f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Create New Workspace</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Workspace Name</label>
                <input
                  required
                  value={wsName}
                  onChange={e => setWsName(e.target.value)}
                  placeholder="e.g. Dubai Office / Warehouse B"
                  style={{
                    width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Description</label>
                <textarea
                  value={wsDesc}
                  onChange={e => setWsDesc(e.target.value)}
                  placeholder="Primary focus, department or location..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Environment</label>
                <select
                  value={wsEnv}
                  onChange={e => setWsEnv(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none'
                  }}
                >
                  <option value="production">Production</option>
                  <option value="demo">Demo / Training</option>
                  <option value="testing">Testing</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: '8px', background: '#2563eb', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage User Access Modal ────────────────────────────────────────── */}
      {showAccessModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px', padding: '28px', maxWidth: '700px', width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)', color: '#f1f5f9', maxHeight: '85vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>User Workspace Management</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Assign which workspaces each user is allowed to view and access.
                </p>
              </div>
              <button onClick={() => setShowAccess(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
              {dbUsers.map(user => (
                <div key={user.id} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', padding: '16px', marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{user.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>({user.username} - {user.role})</span>
                    </div>
                    {user.role === 'super_admin' && (
                      <span style={{ fontSize: '0.7rem', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', padding: '2px 8px', borderRadius: '99px' }}>
                        Super Admin (Full Access)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {availableWorkspaces.map(ws => {
                      const isAllowed = user.role === 'super_admin' || dbMemberships.some(m => m.userId === user.id && m.workspaceId === ws.id);
                      return (
                        <label
                          key={ws.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '6px 12px', borderRadius: '8px',
                            background: isAllowed ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isAllowed ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                            cursor: user.role === 'super_admin' ? 'default' : 'pointer',
                            fontSize: '0.82rem', color: isAllowed ? '#34d399' : '#94a3b8'
                          }}
                        >
                          <input
                            type="checkbox"
                            disabled={user.role === 'super_admin'}
                            checked={isAllowed}
                            onChange={() => toggleUserWorkspaceAccess(user.id, ws.id)}
                            style={{ accentColor: '#10b981', cursor: 'pointer' }}
                          />
                          {ws.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {saveStatus && (
              <div style={{ margin: '12px 0 0', fontSize: '0.85rem', color: '#10b981', textAlign: 'center' }}>
                {saveStatus}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <button
                onClick={() => setShowAccess(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={handleSaveAccess}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#10b981', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                Save Workspace Access
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
