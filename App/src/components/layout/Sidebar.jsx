import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, ShoppingCart, Package, BookOpen,
  Calculator, Users2, Kanban, Settings, FolderKanban, Warehouse, LifeBuoy,
  Megaphone, BarChart3, FileCheck, ChevronDown, ChevronRight,
  Activity, CreditCard, TrendingUp, Truck, ClipboardList, UserCheck,
  DollarSign, Briefcase, Headphones, Target, Lock
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { key:'dashboard', label:'Dashboard', icon:LayoutDashboard, route:'/' },
      { key:'dashboard', label:'Activity',  icon:Activity,        route:'/activity', stub:true },
    ]
  },
  {
    label: 'Sales',
    items: [
      { key:'crm',      label:'CRM & Clients',   icon:Users,       route:'/sales' },
      { key:'invoices', label:'Invoices',         icon:FileText,    route:'/invoices' },
      { key:'ledgers',  label:'Customer Ledgers', icon:BookOpen,    route:'/ledgers' },
    ]
  },
  {
    label: 'Procurement',
    items: [
      { key:'purchasing', label:'Vendors & POs', icon:ShoppingCart, route:'/purchases' },
    ]
  },
  {
    label: 'Inventory',
    items: [
      { key:'inventory', label:'Products & Services', icon:Package,   route:'/inventory' },
      { key:'warehouse', label:'Warehouses',           icon:Warehouse, route:'/warehouse', stub:true },
    ]
  },
  {
    label: 'Finance',
    items: [
      { key:'accounting', label:'Accounting',    icon:Calculator,  route:'/accounting' },
      { key:'accounting', label:'Journals',      icon:CreditCard,  route:'/accounting' },
    ]
  },
  {
    label: 'People',
    items: [
      { key:'hr', label:'Employees & HR', icon:Users2,   route:'/hr' },
      { key:'hr', label:'Payroll',        icon:DollarSign, route:'/hr' },
    ]
  },
  {
    label: 'Work',
    items: [
      { key:'tasks',    label:'Tasks Board', icon:Kanban,       route:'/tasks' },
      { key:'projects', label:'Projects',    icon:FolderKanban, route:'/projects', stub:true },
    ]
  },
  {
    label: 'Growth',
    items: [
      { key:'marketing', label:'Marketing', icon:Megaphone, route:'/marketing', stub:true },
    ]
  },
  {
    label: 'Support',
    items: [
      { key:'support', label:'Helpdesk', icon:LifeBuoy, route:'/support', stub:true },
    ]
  },
  {
    label: 'System',
    items: [
      { key:'docs',     label:'Documents',       icon:FileCheck, route:'/docs' },
      { key:'users',    label:'User Management', icon:UserCheck, route:'/users' },
      { key:'settings', label:'Settings',        icon:Settings,  route:'/settings' },
    ]
  },
];

function NavItem({ item, isCollapsed }) {
  const { isModuleEnabled } = useWorkspace();
  const { hasPermission }   = useAuth();
  
  const permitted = hasPermission(item.key) || item.key === 'dashboard';
  const enabled   = (isModuleEnabled(item.key) || item.key === 'dashboard' || item.key === 'settings' || item.key === 'docs' || item.key === 'users') && permitted;
  const Icon      = item.icon;

  const base = {
    display      : 'flex',
    alignItems   : 'center',
    gap          : '9px',
    padding      : isCollapsed ? '8px' : '7px 10px',
    borderRadius : '8px',
    fontSize     : '0.82rem',
    fontWeight   : 500,
    cursor       : enabled ? 'pointer' : 'not-allowed',
    opacity      : enabled ? 1 : 0.38,
    transition   : 'all 0.12s ease',
    textDecoration:'none',
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    position     : 'relative',
  };

  if (!enabled) {
    return (
      <div style={{ ...base, color:'#475569' }} title={!permitted ? `${item.label} — Access Restricted` : `${item.label} — not enabled`}>
        <Icon size={16} style={{ flexShrink:0 }} />
        {!isCollapsed && <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>}
        {!permitted && <Lock size={12} style={{ marginLeft: 'auto', color: '#f87171' }} />}
      </div>
    );
  }

  return (
    <NavLink
      to={item.route}
      title={isCollapsed ? item.label : undefined}
      style={({ isActive }) => ({
        ...base,
        background  : isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
        color       : isActive ? '#60a5fa' : '#94a3b8',
        borderLeft  : isActive ? '2px solid #3b82f6' : '2px solid transparent',
      })}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#cbd5e1'; }}
      onMouseLeave={e => {
        const link = e.currentTarget;
        // NavLink doesn't expose isActive here, so check class or aria
        const active = link.classList.contains('active') || link.getAttribute('aria-current') === 'page';
        link.style.background = active ? 'rgba(59,130,246,0.15)' : 'transparent';
        link.style.color      = active ? '#60a5fa' : '#94a3b8';
      }}
    >
      <Icon size={16} style={{ flexShrink:0 }} />
      {!isCollapsed && (
        <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

function NavGroup({ group, isCollapsed, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: isCollapsed ? 0 : '4px' }}>
      {!isCollapsed && (
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display     : 'flex', alignItems:'center', justifyContent:'space-between',
            width       : '100%', padding:'5px 10px',
            background  : 'none', border:'none', cursor:'pointer',
            color       : '#475569', fontSize:'0.68rem', fontWeight:700,
            letterSpacing:'0.07em', textTransform:'uppercase',
            transition  : 'color 0.12s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color='#64748b'}
          onMouseLeave={e => e.currentTarget.style.color='#475569'}
        >
          <span>{group.label}</span>
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      )}

      {(open || isCollapsed) && (
        <div style={{
          display       : 'flex',
          flexDirection : 'column',
          gap           : '1px',
          paddingLeft   : isCollapsed ? 0 : '4px',
        }}>
          {group.items.map((item, i) => (
            <NavItem key={i} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      )}

      {/* Group divider in collapsed mode */}
      {isCollapsed && (
        <div style={{ height:'1px', background:'rgba(255,255,255,0.05)', margin:'8px 8px' }} />
      )}
    </div>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed } = useAppContext();

  return (
    <aside style={{
      width          : sidebarCollapsed ? '56px' : '220px',
      minWidth       : sidebarCollapsed ? '56px' : '220px',
      height         : '100vh',
      background     : '#0a0f1e',
      borderRight    : '1px solid rgba(255,255,255,0.07)',
      display        : 'flex',
      flexDirection  : 'column',
      transition     : 'width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow       : 'hidden',
      position       : 'sticky',
      top            : 0,
      flexShrink     : 0,
    }}>
      {/* Logo area */}
      <div style={{
        height         : '56px',
        display        : 'flex',
        alignItems     : 'center',
        padding        : sidebarCollapsed ? '0' : '0 16px',
        justifyContent : sidebarCollapsed ? 'center' : 'flex-start',
        borderBottom   : '1px solid rgba(255,255,255,0.07)',
        flexShrink     : 0,
        gap            : '10px',
      }}>
        <img src="./logo.png" alt="RAKTechSoftHub Logo" style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }} />
        {!sidebarCollapsed && (
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:'0.82rem', fontWeight:800, color:'#e2e8f0', whiteSpace:'nowrap' }}>
              RAK Tech ERP
            </div>
            <div style={{ fontSize:'0.6rem', color:'#475569', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>
              ENTERPRISE SUITE
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{
        flex       : 1,
        overflowY  : 'auto',
        overflowX  : 'hidden',
        padding    : '10px 8px',
        display    : 'flex',
        flexDirection:'column',
        gap        : '1px',
        scrollbarWidth:'thin',
        scrollbarColor:'rgba(255,255,255,0.1) transparent',
      }}>
        {NAV_GROUPS.map((group, i) => (
          <NavGroup
            key={i}
            group={group}
            isCollapsed={sidebarCollapsed}
            defaultOpen={i < 3} // first 3 groups open by default
          />
        ))}
      </nav>
    </aside>
  );
}
