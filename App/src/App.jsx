import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CheckSquare, 
  BookOpen,
  Settings as SettingsIcon,
  Package,
  Truck,
  Wallet,
  UserCheck
} from 'lucide-react';
import './index.css';

// Import all pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients'; // Upgraded to Sales & CRM
import Services from './pages/Services'; // Upgraded to Inventory
import Purchases from './pages/Purchases';
import Accounting from './pages/Accounting';
import Invoices from './pages/Invoices';
import HR from './pages/HR';
import Ledgers from './pages/Ledgers';
import Tasks from './pages/Tasks';
import Docs from './pages/Docs';
import Settings from './pages/Settings';

function Sidebar() {
  const groups = [
    {
      title: 'BUSINESS',
      items: [
        { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={18} />, color: 'var(--accent-primary)' },
        { path: '/sales', name: 'Sales & CRM', icon: <Users size={18} />, color: 'var(--accent-primary)' },
        { path: '/purchases', name: 'Purchases & Vendors', icon: <Truck size={18} />, color: 'var(--accent-warning)' }
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        { path: '/inventory', name: 'Products & Stock', icon: <Package size={18} />, color: 'var(--accent-purple)' }
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { path: '/accounting', name: 'Accounting', icon: <Wallet size={18} />, color: 'var(--accent-success)' },
        { path: '/invoices', name: 'Invoices', icon: <FileText size={18} />, color: 'var(--accent-primary)' },
        { path: '/ledgers', name: 'Ledgers', icon: <BookOpen size={18} />, color: '#06b6d4' }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { path: '/tasks', name: 'Tasks', icon: <CheckSquare size={18} />, color: 'var(--accent-success)' },
        { path: '/hr', name: 'HR & Payroll', icon: <UserCheck size={18} />, color: 'var(--accent-pink)' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/docs', name: 'Documentation', icon: <BookOpen size={18} />, color: 'var(--text-muted)' }
      ]
    }
  ];

  return (
    <aside className="sidebar" style={{ width: '260px', height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
        <h2 style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.5rem' }}>
          Tech ERP
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>v2.0 — Business Suite</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0 0.75rem' }}>
        {groups.map((group, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '0.05em', paddingLeft: '0.75rem', marginBottom: '2px' }}>
              {group.title}
            </span>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  fontWeight: isActive ? '500' : '400',
                  borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                  transition: 'all var(--transition-fast)',
                  fontSize: '0.875rem'
                })}
              >
                <span style={{ color: item.color }}>{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: 'auto', padding: '1rem 0.75rem 0.5rem 0.75rem' }}>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            color: isActive ? 'white' : 'var(--text-secondary)',
            background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            fontWeight: isActive ? '500' : '400',
            borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
            transition: 'all var(--transition-fast)',
            fontSize: '0.875rem'
          })}
        >
          <SettingsIcon size={18} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, height: '100vh', paddingBottom: '0' }}>
          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sales" element={<Clients />} />
              <Route path="/inventory" element={<Services />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/accounting" element={<Accounting />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/hr" element={<HR />} />
              <Route path="/ledgers" element={<Ledgers />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
          <footer style={{ 
            padding: '1.5rem 0', 
            borderTop: '1px solid var(--border-color)', 
            textAlign: 'center', 
            fontSize: '0.85rem', 
            color: 'var(--text-muted)', 
            marginTop: '3rem',
            width: '100%'
          }}>
            Designed & Developed by <strong style={{ color: 'var(--accent-primary)' }}>RAK Tech Soft Hub Group</strong>
          </footer>
        </main>
      </div>
    </Router>
  );
}

export default App;
