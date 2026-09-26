import React, { useState, useRef, useEffect } from 'react';
import {
  Menu, Search, Bell, ChevronDown, LogOut, Settings, User as UserIcon,
  Sun, Moon, Lock, ArrowLeftRight, LayoutGrid, Wifi, WifiOff, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAppContext } from '../../contexts/AppContext';
import { initials } from '../../utils/format';

function UserMenu({ onClose }) {
  const { currentUser, logout } = useAuth();
  const { currentWorkspace, switchWorkspace, availableWorkspaces } = useWorkspace();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { icon: UserIcon,       label: 'My Profile',       action: () => { onClose(); } },
    { icon: Settings,       label: 'Preferences',      action: () => { navigate('/settings'); onClose(); } },
    { divider: true },
    { icon: ArrowLeftRight, label: 'Switch Workspace',  action: () => { switchWorkspace(null); onClose(); } },
    { divider: true },
    { icon: LogOut,         label: 'Sign Out',          action: () => { logout(); }, danger: true },
  ];

  return (
    <div ref={menuRef} style={{
      position    : 'absolute',
      top         : '46px',
      right       : 0,
      background  : '#1e293b',
      border      : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      boxShadow   : '0 16px 48px rgba(0,0,0,0.5)',
      minWidth    : '200px',
      zIndex      : 1000,
      overflow    : 'hidden',
      animation   : 'slideDown 0.15s ease',
    }}>
      {/* User info header */}
      <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontWeight:600, fontSize:'0.85rem', color:'#f1f5f9' }}>{currentUser?.name}</div>
        <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:'2px' }}>{currentUser?.email}</div>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:'4px',
          marginTop:'6px', padding:'2px 7px', borderRadius:'999px',
          background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)',
          fontSize:'0.65rem', fontWeight:600, color:'#60a5fa', letterSpacing:'0.04em',
        }}>
          {currentUser?.role?.replace(/_/g,' ').toUpperCase()}
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding:'6px' }}>
        {items.map((item, i) =>
          item.divider ? (
            <div key={i} style={{ height:'1px', background:'rgba(255,255,255,0.06)', margin:'4px 0' }} />
          ) : (
            <button
              key={i}
              onClick={item.action}
              style={{
                display    : 'flex',
                alignItems : 'center',
                gap        : '9px',
                width      : '100%',
                padding    : '8px 10px',
                borderRadius:'8px',
                background : 'none',
                border     : 'none',
                color      : item.danger ? '#f87171' : '#94a3b8',
                fontSize   : '0.82rem',
                cursor     : 'pointer',
                textAlign  : 'left',
                transition : 'all 0.12s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = item.danger ? '#f87171' : '#e2e8f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = item.danger ? '#f87171' : '#94a3b8'; }}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default function TopBar() {
  const { currentUser, connectionOk } = useAuth();
  const { currentWorkspace }          = useWorkspace();
  const { toggleSidebar, unreadCount, setNotifPanelOpen, notifPanelOpen, setAppLauncherOpen, appLauncherOpen } = useAppContext();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchVal,    setSearchVal]    = useState('');

  return (
    <header style={{
      height          : '56px',
      background      : 'rgba(10,15,30,0.9)',
      borderBottom    : '1px solid rgba(255,255,255,0.07)',
      display         : 'flex',
      alignItems      : 'center',
      padding         : '0 16px',
      gap             : '12px',
      position        : 'sticky',
      top             : 0,
      zIndex          : 100,
      backdropFilter  : 'blur(12px)',
      flexShrink      : 0,
    }}>

      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', padding:'6px', borderRadius:'6px', display:'flex', alignItems:'center' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
        onMouseLeave={e => e.currentTarget.style.background='none'}
        title="Toggle sidebar (Ctrl+B)"
      >
        <Menu size={18} />
      </button>

      {/* App launcher */}
      <button
        onClick={() => setAppLauncherOpen(v => !v)}
        style={{
          background   : appLauncherOpen ? 'rgba(59,130,246,0.15)' : 'none',
          border       : appLauncherOpen ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
          color        : appLauncherOpen ? '#3b82f6' : '#64748b',
          cursor       : 'pointer', padding:'6px', borderRadius:'6px',
          display      : 'flex', alignItems:'center',
          transition   : 'all 0.15s ease',
        }}
        onMouseEnter={e => { if(!appLauncherOpen) e.currentTarget.style.background='rgba(255,255,255,0.07)'; }}
        onMouseLeave={e => { if(!appLauncherOpen) e.currentTarget.style.background='none'; }}
        title="App launcher"
      >
        <LayoutGrid size={18} />
      </button>

      {/* Workspace badge */}
      {currentWorkspace && (
        <div style={{
          display    : 'flex',
          alignItems : 'center',
          gap        : '7px',
          padding    : '4px 10px',
          borderRadius:'8px',
          background : 'rgba(255,255,255,0.05)',
          border     : '1px solid rgba(255,255,255,0.08)',
        }}>
          <img src="./logo.png" alt="RAKTechSoftHub Logo" style={{ width: '16px', height: '16px', objectFit: 'contain', marginRight: '2px' }} />
          <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#cbd5e1', maxWidth:'150px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {currentWorkspace.name}
          </span>
        </div>
      )}

      {/* Global search */}
      <div style={{ flex:1, maxWidth:'340px', position:'relative' }}>
        <Search size={14} color='#475569' style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
        <input
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          placeholder="Search anything… (Ctrl+K)"
          style={{
            width        : '100%',
            padding      : '7px 10px 7px 30px',
            background   : 'rgba(255,255,255,0.05)',
            border       : '1px solid rgba(255,255,255,0.08)',
            borderRadius : '8px',
            color        : '#e2e8f0',
            fontSize     : '0.82rem',
            outline      : 'none',
            boxSizing    : 'border-box',
            transition   : 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
      </div>

      {/* Spacer */}
      <div style={{ flex:1 }} />

      {/* Connection status */}
      <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.72rem' }}>
        {connectionOk === null
          ? <Loader2 size={12} color='#64748b' style={{ animation:'spin 1s linear infinite' }} />
          : connectionOk
            ? <Wifi size={12} color='#10b981' />
            : <WifiOff size={12} color='#f59e0b' />
        }
        <span style={{ color: connectionOk ? '#10b981' : connectionOk === false ? '#f59e0b' : '#64748b' }}>
          {connectionOk === null ? 'Connecting' : connectionOk ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Notifications */}
      <div style={{ position:'relative' }}>
        <button
          onClick={() => setNotifPanelOpen(v => !v)}
          style={{
            background   : notifPanelOpen ? 'rgba(59,130,246,0.15)' : 'none',
            border       : notifPanelOpen ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
            color        : '#94a3b8',
            cursor       : 'pointer', padding:'6px', borderRadius:'6px',
            display      : 'flex', alignItems:'center', position:'relative',
            transition   : 'all 0.15s ease',
          }}
          onMouseEnter={e => { if(!notifPanelOpen) e.currentTarget.style.background='rgba(255,255,255,0.07)'; }}
          onMouseLeave={e => { if(!notifPanelOpen) e.currentTarget.style.background='none'; }}
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position    : 'absolute', top:'2px', right:'2px',
              background  : '#ef4444',
              borderRadius: '999px',
              width       : '14px', height:'14px',
              fontSize    : '0.6rem', fontWeight:700, color:'white',
              display     : 'flex', alignItems:'center', justifyContent:'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* User avatar + menu */}
      <div style={{ position:'relative' }}>
        <button
          onClick={() => setUserMenuOpen(v => !v)}
          style={{
            display     : 'flex',
            alignItems  : 'center',
            gap         : '7px',
            background  : 'none',
            border      : '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            padding     : '5px 8px 5px 5px',
            cursor      : 'pointer',
            transition  : 'all 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.07)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}
        >
          <div style={{
            width:'26px', height:'26px', borderRadius:'50%',
            background:'linear-gradient(135deg, #1d4ed8, #7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'0.65rem', fontWeight:800, color:'white',
          }}>
            {initials(currentUser?.name || 'U')}
          </div>
          <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#cbd5e1', maxWidth:'100px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {currentUser?.name?.split(' ')[0]}
          </span>
          <ChevronDown size={13} color='#64748b' />
        </button>

        {userMenuOpen && <UserMenu onClose={() => setUserMenuOpen(false)} />}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-6px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </header>
  );
}
