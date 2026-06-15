import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  Wallet, 
  Truck, 
  Package, 
  UserCheck, 
  BookOpen, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft,
  AlertTriangle
} from 'lucide-react';
import { loadDatabase } from '../utils/db';

export default function Dashboard() {
  const navigate = useNavigate();

  // Financial Metrics States
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstandingReceivables: 0,
    totalLeads: 0,
    totalVendors: 0,
    lowStockCount: 0,
    employeeCount: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadDatabase().then(data => {
      const clientsList = data.clients || [];
      const invoicesList = data.invoices || [];
      const purchaseOrdersList = data.purchaseOrders || [];
      const transactionsList = data.transactions || [];
      const employeesList = data.employees || [];
      const productsList = data.products || [];

      // --- CALCULATE REVENUE ---
      // Revenue is paid invoices
      const revenue = invoicesList
        .filter(inv => inv.status === 'Paid')
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

      // Outstanding Receivables (unpaid invoices)
      const receivables = invoicesList
        .filter(inv => inv.status !== 'Paid')
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

      // --- CALCULATE EXPENSES ---
      // 1. Paid Purchase Orders
      const poExpenses = purchaseOrdersList
        .filter(po => po.status === 'Paid')
        .reduce((sum, po) => sum + Number(po.amount || 0), 0);
      
      // 2. Manual Transactions (Expenses)
      const manualExpenses = transactionsList
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const totalExpenses = poExpenses + manualExpenses;
      const netProfit = revenue - totalExpenses;

      // Low Stock products count
      const lowStock = productsList.filter(p => (p.stock || 0) <= (p.minStock || 0)).length;

      setMetrics({
        totalRevenue: revenue,
        totalExpenses: totalExpenses,
        netProfit: netProfit,
        outstandingReceivables: receivables,
        totalLeads: clientsList.filter(c => c.status === 'Lead').length,
        totalVendors: data.vendors?.length || 0,
        lowStockCount: lowStock,
        employeeCount: employeesList.length
      });

      // --- POPULATE ACTIVITIES ---
      const activities = [];
      
      // Recent Invoices
      invoicesList.slice(0, 3).forEach(inv => {
        activities.push({
          type: 'invoice',
          title: `Invoice ${inv.id} for ${inv.client} (${inv.status})`,
          amount: `Rs. ${Number(inv.amount).toLocaleString()}`,
          date: inv.date,
          color: 'var(--accent-primary)',
          timestamp: Date.now() - 3600000 // mock ordering helper
        });
      });

      // Recent Purchase Orders
      purchaseOrdersList.slice(0, 3).forEach(po => {
        activities.push({
          type: 'purchase',
          title: `Purchase Order ${po.id} to ${po.vendor} (${po.status})`,
          amount: `Rs. ${Number(po.amount).toLocaleString()}`,
          date: po.date,
          color: 'var(--accent-warning)',
          timestamp: Date.now() - 7200000
        });
      });

      // Recent Employees
      employeesList.slice(0, 2).forEach(emp => {
        activities.push({
          type: 'hr',
          title: `Employee registered: ${emp.name} (${emp.designation})`,
          amount: `Salary: Rs. ${Number(emp.salary).toLocaleString()}`,
          date: emp.joiningDate || new Date().toLocaleDateString(),
          color: 'var(--accent-pink)',
          timestamp: Date.now() - 10800000
        });
      });

      // Sort activities (here we can just sort by date, since date is string we try to parse or keep basic order)
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentActivities(activities.slice(0, 6));
    });
  }, []);

  // Module Configuration for Cards
  const modules = [
    {
      title: 'Sales & CRM',
      desc: 'Quotations, leads tracker & sales pipeline.',
      stats: `${metrics.totalLeads} Active Leads`,
      icon: <Users size={24} />,
      color: 'rgba(59, 130, 246, 0.15)',
      iconColor: 'var(--accent-primary)',
      path: '/sales'
    },
    {
      title: 'Purchases & Vendors',
      desc: 'Vendor directories, PO creation & billing.',
      stats: `${metrics.totalVendors} Active Vendors`,
      icon: <Truck size={24} />,
      color: 'rgba(245, 158, 11, 0.15)',
      iconColor: 'var(--accent-warning)',
      path: '/purchases'
    },
    {
      title: 'Inventory & Stock',
      desc: 'Hardware stock, units, price & digital services.',
      stats: metrics.lowStockCount > 0 ? `${metrics.lowStockCount} Low stock alerts!` : 'Stock level healthy',
      isWarning: metrics.lowStockCount > 0,
      icon: <Package size={24} />,
      color: 'rgba(139, 92, 246, 0.15)',
      iconColor: 'var(--accent-purple)',
      path: '/inventory'
    },
    {
      title: 'Accounting & Finance',
      desc: 'Profit margins, manual logs & transactions.',
      stats: `Net Profit: Rs. ${metrics.netProfit.toLocaleString()}`,
      icon: <Wallet size={24} />,
      color: 'rgba(16, 185, 129, 0.15)',
      iconColor: 'var(--accent-success)',
      path: '/accounting'
    },
    {
      title: 'HR & Payroll',
      desc: 'Employee logs, daily attendance & salary slips.',
      stats: `${metrics.employeeCount} Active Staff`,
      icon: <UserCheck size={24} />,
      color: 'rgba(236, 72, 153, 0.15)',
      iconColor: 'var(--accent-pink)',
      path: '/hr'
    },
    {
      title: 'Customer & Vendor Ledgers',
      desc: 'Generate account statements & payables summaries.',
      stats: `Receivables: Rs. ${metrics.outstandingReceivables.toLocaleString()}`,
      icon: <BookOpen size={24} />,
      color: 'rgba(6, 182, 212, 0.15)',
      iconColor: '#06b6d4',
      path: '/ledgers'
    }
  ];

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ marginBottom: 'var(--sp-6)' }}>
        <div>
          <h1 className="page-title">Tech ERP Suite</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to your business cockpit. LAN sync is online.</p>
        </div>
      </header>

      {/* Top financial metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 'var(--sp-4)',
        marginBottom: 'var(--sp-8)'
      }}>
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Total Revenue (Paid)</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '600', marginTop: 'var(--sp-1)' }}>Rs. {metrics.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Total Expenses</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '600', marginTop: 'var(--sp-1)' }}>Rs. {metrics.totalExpenses.toLocaleString()}</h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
            <Wallet size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Net Profit Position</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '600', marginTop: 'var(--sp-1)', color: metrics.netProfit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              Rs. {metrics.netProfit.toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}>
            <ArrowDownLeft size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Outstanding Receivables</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '600', marginTop: 'var(--sp-1)', color: 'var(--accent-warning)' }}>
              Rs. {metrics.outstandingReceivables.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.4rem', marginBottom: 'var(--sp-4)' }}>Quick Modules Launch</h2>
      
      {/* 6 Grid Module Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: 'var(--sp-4)',
        marginBottom: 'var(--sp-8)'
      }}>
        {modules.map((m, idx) => (
          <div 
            key={idx} 
            className="glass-panel" 
            onClick={() => navigate(m.path)}
            style={{ 
              padding: 'var(--sp-6)', 
              cursor: 'pointer',
              transition: 'transform var(--transition-fast), border-color var(--transition-fast)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = m.iconColor;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>{m.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px', lineHeight: '1.3' }}>{m.desc}</p>
              </div>
              <div style={{ backgroundColor: m.color, color: m.iconColor, padding: '10px', borderRadius: 'var(--radius-md)' }}>
                {m.icon}
              </div>
            </div>
            
            <div style={{ 
              marginTop: 'var(--sp-4)', 
              fontSize: '0.85rem', 
              fontWeight: '600', 
              color: m.isWarning ? 'var(--accent-danger)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {m.isWarning && <AlertTriangle size={14} />}
              {m.stats}
            </div>
          </div>
        ))}
      </div>

      {/* Two column layouts: Quick Actions & Recent Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 'var(--sp-6)' }}>
        
        {/* Quick Actions Panel */}
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <h3 style={{ marginBottom: 'var(--sp-4)', color: 'white' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
            <button className="btn btn-outline" style={{ height: '50px', justifyContent: 'flex-start', gap: '10px' }} onClick={() => navigate('/invoices')}>
              <Plus size={16} color="var(--accent-primary)" /> Create Invoice
            </button>
            <button className="btn btn-outline" style={{ height: '50px', justifyContent: 'flex-start', gap: '10px' }} onClick={() => navigate('/sales')}>
              <Plus size={16} color="var(--accent-primary)" /> Generate Quote
            </button>
            <button className="btn btn-outline" style={{ height: '50px', justifyContent: 'flex-start', gap: '10px' }} onClick={() => navigate('/purchases')}>
              <Plus size={16} color="var(--accent-warning)" /> New PO Order
            </button>
            <button className="btn btn-outline" style={{ height: '50px', justifyContent: 'flex-start', gap: '10px' }} onClick={() => navigate('/accounting')}>
              <Plus size={16} color="var(--accent-success)" /> Log Transaction
            </button>
          </div>
        </div>

        {/* Dynamic Activity Feed */}
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <h3 style={{ marginBottom: 'var(--sp-4)', color: 'white' }}>Live Activity Feed</h3>
          {recentActivities.length === 0 ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 'var(--sp-6)' }}>
              No recent records found in system.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              {recentActivities.map((act, index) => (
                <li key={index} style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: act.color, marginTop: '6px' }}></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>{act.title}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <span>{act.amount}</span>
                      <span>{act.date}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
