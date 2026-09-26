import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, ShoppingCart, Package, BookOpen,
  Calculator, Users2, Kanban, Settings, FolderKanban, Warehouse, LifeBuoy,
  Megaphone, BarChart3, FileCheck, X
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const ALL_MODULES = [
  { key:'dashboard',   label:'Dashboard',    icon:LayoutDashboard, route:'/',            color:'#3b82f6' },
  { key:'crm',         label:'Sales & CRM',  icon:Users,           route:'/sales',       color:'#8b5cf6' },
  { key:'invoices',    label:'Invoices',     icon:FileText,        route:'/invoices',    color:'#06b6d4' },
  { key:'purchasing',  label:'Purchases',    icon:ShoppingCart,    route:'/purchases',   color:'#f59e0b' },
  { key:'inventory',   label:'Inventory',    icon:Package,         route:'/inventory',   color:'#10b981' },
  { key:'accounting',  label:'Accounting',   icon:Calculator,      route:'/accounting',  color:'#3b82f6' },
  { key:'ledgers',     label:'Ledgers',      icon:BookOpen,        route:'/ledgers',     color:'#6366f1' },
  { key:'hr',          label:'HR & Payroll', icon:Users2,          route:'/hr',          color:'#ec4899' },
  { key:'tasks',       label:'Tasks',        icon:Kanban,          route:'/tasks',       color:'#84cc16' },
  { key:'projects',    label:'Projects',     icon:FolderKanban,    route:'/projects',    color:'#f97316' },
  { key:'warehouse',   label:'Warehouse',    icon:Warehouse,       route:'/warehouse',   color:'#0ea5e9' },
  { key:'support',     label:'Support',      icon:LifeBuoy,        route:'/support',     color:'#ef4444' },
  { key:'marketing',   label:'Marketing',    icon:Megaphone,       route:'/marketing',   color:'#a855f7' },
  { key:'reports',     label:'Reports',      icon:BarChart3,       route:'/reports',     color:'#14b8a6' },
  { key:'docs',        label:'Documents',    icon:FileCheck,       route:'/docs',        color:'#94a3b8' },
  { key:'settings',    label:'Settings',     icon:Settings,        route:'/settings',    color:'#64748b' },
];

function ModuleTile({ module, enabled, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  const Icon = module.icon;

  return (
    <button
      onClick={() => enabled && onClick(module.route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={enabled ? module.label : `${module.label} — not enabled`}
      style={{
        display        : 'flex',
        flexDirection  : 'column',
        alignItems     : 'center',
        gap            : '8px',
        padding        : '16px 8px',
        borderRadius   : '12px',
        background     : hovered && enabled ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
        border         : `1px solid ${hovered && enabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
        cursor         : enabled ? 'pointer' : 'not-allowed',
        opacity        : enabled ? 1 : 0.35,
        transition     : 'all 0.15s ease',
        transform      : hovered && enabled ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{
        width        : '40px', height:'40px',
        borderRadius : '10px',
        background   : `${module.color}18`,
        border       : `1px solid ${module.color}30`,
        display      : 'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon size={18} color={enabled ? module.color : '#475569'} />
      </div>
      <span style={{
        fontSize  : '0.72rem',
        fontWeight: 600,
        color     : enabled ? '#94a3b8' : '#475569',
        textAlign : 'center',
        lineHeight: 1.2,
        maxWidth  : '70px',
      }}>
        {module.label}
      </span>
    </button>
  );
}

export default function AppLauncher() {
  const { appLauncherOpen, setAppLauncherOpen } = useAppContext();
  const { isModuleEnabled } = useWorkspace();
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (!appLauncherOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAppLauncherOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [appLauncherOpen, setAppLauncherOpen]);

  useEffect(() => {
    if (!appLauncherOpen) return;
    const handler = (e) => { if (e.key === 'Escape') setAppLauncherOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [appLauncherOpen, setAppLauncherOpen]);

  if (!appLauncherOpen) return null;

  const handleNavigate = (route) => {
    navigate(route);
    setAppLauncherOpen(false);
  };

  return (
    <div style={{
      position     : 'fixed',
      top          : '64px',
      left         : '56px',
      zIndex       : 500,
      animation    : 'slideDown 0.18s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div ref={ref} style={{
        background   : '#111827',
        border       : '1px solid rgba(255,255,255,0.1)',
        borderRadius : '16px',
        boxShadow    : '0 24px 64px rgba(0,0,0,0.6)',
        padding      : '16px',
        width        : '320px',
      }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', padding:'0 2px' }}>
          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b', letterSpacing:'0.06em' }}>
            MODULES
          </span>
          <button onClick={() => setAppLauncherOpen(false)} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', padding:'2px', display:'flex' }}>
            <X size={14} />
          </button>
        </div>

        {/* Module grid */}
        <div style={{
          display             : 'grid',
          gridTemplateColumns : 'repeat(4, 1fr)',
          gap                 : '6px',
        }}>
          {ALL_MODULES.map(mod => (
            <ModuleTile
              key={mod.key}
              module={mod}
              enabled={isModuleEnabled(mod.key) || mod.key === 'dashboard' || mod.key === 'settings'}
              onClick={handleNavigate}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
