import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// ── Contexts ──────────────────────────────────────────────────────────────────
import { AuthProvider,      useAuth }       from './contexts/AuthContext';
import { WorkspaceProvider, useWorkspace }  from './contexts/WorkspaceContext';
import { AppProvider,       useAppContext } from './contexts/AppContext';

// ── Layout ────────────────────────────────────────────────────────────────────
import Sidebar       from './components/layout/Sidebar';
import TopBar        from './components/layout/TopBar';
import AppLauncher   from './components/layout/AppLauncher';
import ToastContainer from './components/common/Toast';

// ── Screens ───────────────────────────────────────────────────────────────────
import Login             from './pages/Login';
import WorkspaceSelector from './pages/WorkspaceSelector';

// ── Pages (lazy for better startup performance) ───────────────────────────────
const Dashboard  = React.lazy(() => import('./pages/Dashboard'));
const Clients    = React.lazy(() => import('./pages/Clients'));
const Services   = React.lazy(() => import('./pages/Services'));
const Purchases  = React.lazy(() => import('./pages/Purchases'));
const Accounting = React.lazy(() => import('./pages/Accounting'));
const Invoices   = React.lazy(() => import('./pages/Invoices'));
const HR         = React.lazy(() => import('./pages/HR'));
const Ledgers    = React.lazy(() => import('./pages/Ledgers'));
const Tasks      = React.lazy(() => import('./pages/Tasks'));
const Docs       = React.lazy(() => import('./pages/Docs'));
const Settings   = React.lazy(() => import('./pages/Settings'));
const Users      = React.lazy(() => import('./pages/Users'));

// ── Access Denied Page ─────────────────────────────────────────────────────────
function AccessDenied({ moduleName }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'16px', textAlign: 'center' }}>
      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
        🔒
      </div>
      <h2 style={{ color:'#f87171', margin:0, fontSize: '1.5rem' }}>Access Restricted</h2>
      <p style={{ color:'#94a3b8', margin:0, fontSize:'0.95rem', maxWidth: '420px', lineHeight: 1.5 }}>
        You do not have permission to access the <strong>{moduleName}</strong> service. Please contact your system administrator to update your account access permissions.
      </p>
    </div>
  );
}

// ── Protected Route Guard ─────────────────────────────────────────────────────
function ProtectedRoute({ moduleKey, name, element }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(moduleKey)) {
    return <AccessDenied moduleName={name || moduleKey} />;
  }
  return element;
}

// ── Stub page for not-yet-built modules ───────────────────────────────────────
function ComingSoon({ name }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'12px' }}>
      <div style={{ fontSize:'2.5rem' }}>🚧</div>
      <h2 style={{ color:'#e2e8f0', margin:0 }}>{name}</h2>
      <p style={{ color:'#64748b', margin:0, fontSize:'0.9rem' }}>This module is coming soon.</p>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px' }}>
      <div style={{
        width:'32px', height:'32px', borderRadius:'50%',
        border:'2px solid rgba(59,130,246,0.2)',
        borderTopColor:'#3b82f6',
        animation:'spin 0.8s linear infinite',
      }} />
    </div>
  );
}

// ── Workspace shell ───────────────────────────────────────────────────────────
function WorkspaceShell() {
  const { sidebarCollapsed } = useAppContext();

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0a0f1e' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <TopBar />
        <AppLauncher />
        <main style={{
          flex      : 1,
          overflowY : 'auto',
          overflowX : 'hidden',
          padding   : '0',
          scrollbarWidth:'thin',
          scrollbarColor:'rgba(255,255,255,0.1) transparent',
        }}>
          <div style={{ padding:'20px', maxWidth:'1400px', margin:'0 auto' }}>
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                <Route path="/"           element={<Dashboard />} />
                <Route path="/sales"      element={<ProtectedRoute moduleKey="crm" name="CRM & Clients" element={<Clients />} />} />
                <Route path="/inventory"  element={<ProtectedRoute moduleKey="inventory" name="Products & Services" element={<Services />} />} />
                <Route path="/purchases"  element={<ProtectedRoute moduleKey="purchasing" name="Vendors & POs" element={<Purchases />} />} />
                <Route path="/accounting" element={<ProtectedRoute moduleKey="accounting" name="Accounting & Finance" element={<Accounting />} />} />
                <Route path="/invoices"   element={<ProtectedRoute moduleKey="invoices" name="Invoices" element={<Invoices />} />} />
                <Route path="/hr"         element={<ProtectedRoute moduleKey="hr" name="Employees & HR" element={<HR />} />} />
                <Route path="/ledgers"    element={<ProtectedRoute moduleKey="ledgers" name="Customer Ledgers" element={<Ledgers />} />} />
                <Route path="/tasks"      element={<ProtectedRoute moduleKey="tasks" name="Tasks Board" element={<Tasks />} />} />
                <Route path="/docs"       element={<ProtectedRoute moduleKey="docs" name="Documents" element={<Docs />} />} />
                <Route path="/settings"   element={<ProtectedRoute moduleKey="settings" name="Settings" element={<Settings />} />} />
                <Route path="/users"      element={<ProtectedRoute moduleKey="settings" name="User Management" element={<Users />} />} />
                {/* New modules (stubs) */}
                <Route path="/projects"   element={<ComingSoon name="Projects" />} />
                <Route path="/warehouse"  element={<ComingSoon name="Warehouse" />} />
                <Route path="/support"    element={<ComingSoon name="Support & Helpdesk" />} />
                <Route path="/marketing"  element={<ComingSoon name="Marketing" />} />
                <Route path="/reports"    element={<ComingSoon name="Analytics & Reports" />} />
                <Route path="/activity"   element={<ComingSoon name="Activity Feed" />} />
                {/* Catch-all */}
                <Route path="*"           element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Root route guard ──────────────────────────────────────────────────────────
function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  const { currentWorkspace, needsWorkspaceSelection, isLoading: wsLoading } = useWorkspace();

  if (isLoading || wsLoading) {
    return (
      <div style={{
        minHeight:'100vh', background:'#0a0f1e',
        display:'flex', alignItems:'center', justifyContent:'center', gap:'12px',
        flexDirection:'column',
      }}>
        <div style={{
          width:'40px', height:'40px', borderRadius:'10px',
          background:'linear-gradient(135deg, #1d4ed8, #7c3aed)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'0.9rem', fontWeight:800, color:'white',
        }}>RT</div>
        <div style={{ width:'24px', height:'24px', borderRadius:'50%', border:'2px solid rgba(59,130,246,0.2)', borderTopColor:'#3b82f6', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!isAuthenticated)        return <Login />;
  if (needsWorkspaceSelection) return <WorkspaceSelector />;

  return (
    <Routes>
      <Route path="/*" element={<WorkspaceShell />} />
    </Routes>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <WorkspaceProvider>
          <AppProvider>
            <AppRouter />
            <ToastContainer />
          </AppProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </Router>
  );
}
