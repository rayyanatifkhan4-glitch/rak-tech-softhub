import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, ArrowUpRight, ArrowDownLeft, Eye, Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadDatabase } from '../utils/db';
import { formatCurrency } from '../utils/format';

export default function Ledgers() {
  const [clients,        setClients]        = useState([]);
  const [invoices,       setInvoices]       = useState([]);
  const [vendors,        setVendors]        = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [transactions,   setTransactions]   = useState([]);
  const [activeTab,      setActiveTab]      = useState('customers');
  const [selectedId,     setSelectedId]     = useState('');
  const [previewSrc,     setPreviewSrc]     = useState(null);

  useEffect(() => {
    loadDatabase().then(data => {
      setClients(data.clients || []);
      setInvoices(data.invoices || []);
      setVendors(data.vendors || []);
      setPurchaseOrders(data.purchaseOrders || []);
      setTransactions(data.transactions || []);
    });
  }, []);

  // ── Build customer ledger entries ─────────────────────────────────────────────
  const buildCustomerLedger = (clientId) => {
    const client = clients.find(c => String(c.id) === String(clientId));
    if (!client) return { client: null, entries: [], balance: 0 };

    const clientInvoices = invoices.filter(inv =>
      inv.client === client.name || inv.clientId === client.id
    );

    const entries = clientInvoices.map(inv => ({
      date       : inv.date,
      ref        : inv.id,
      description: `Invoice — ${inv.id}`,
      debit      : parseFloat(inv.amount) || 0, // amount owed
      credit     : inv.status === 'Paid' ? parseFloat(inv.amount) || 0 : 0, // amount received
      type       : 'invoice',
      status     : inv.status,
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let running = 0;
    const withBalance = entries.map(e => {
      running += e.debit - e.credit;
      return { ...e, balance: running };
    });

    return { client, entries: withBalance, balance: running };
  };

  // ── Build vendor ledger entries ────────────────────────────────────────────────
  const buildVendorLedger = (vendorId) => {
    const vendor = vendors.find(v => String(v.id) === String(vendorId));
    if (!vendor) return { vendor: null, entries: [], balance: 0 };

    const vendorPOs = purchaseOrders.filter(po => po.vendor === vendor.name || po.vendorId === vendor.id);

    const entries = vendorPOs.map(po => ({
      date       : po.date,
      ref        : po.id,
      description: `Purchase Order — ${po.id}`,
      debit      : parseFloat(po.amount) || 0,  // amount owed to vendor
      credit     : po.status === 'Paid' ? parseFloat(po.amount) || 0 : 0, // amount paid
      type       : 'po',
      status     : po.status,
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    let running = 0;
    const withBalance = entries.map(e => {
      running += e.debit - e.credit;
      return { ...e, balance: running };
    });

    return { vendor, entries: withBalance, balance: running };
  };

  // ── Summary KPIs ────────────────────────────────────────────────────────────────
  const totalReceivables = invoices.filter(inv => inv.status !== 'Paid').reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const totalPayables    = purchaseOrders.filter(po => po.status !== 'Paid').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  // ── Active ledger data ─────────────────────────────────────────────────────────
  const ledger = activeTab === 'customers'
    ? buildCustomerLedger(selectedId)
    : buildVendorLedger(selectedId);

  const entityName = activeTab === 'customers'
    ? ledger.client?.name || ''
    : ledger.vendor?.name  || '';

  const ledgerEntries = ledger.entries || [];

  // ── PDF generation ─────────────────────────────────────────────────────────────
  const generatePDF = () => {
    const doc  = new jsPDF('p', 'mm', 'a4');
    const type = activeTab === 'customers' ? 'Customer' : 'Vendor';
    doc.setFontSize(16);
    doc.text('RAK Tech Soft Hub', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${type} Ledger Statement`, 14, 26);
    doc.text(`Account: ${entityName}`, 14, 33);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);

    autoTable(doc, {
      startY   : 48,
      head     : [['Date', 'Reference', 'Description', 'Debit (Rs.)', 'Credit (Rs.)', 'Balance (Rs.)', 'Status']],
      body     : ledgerEntries.map(e => [
        e.date || '', e.ref || '', e.description || '',
        e.debit ? e.debit.toLocaleString() : '-',
        e.credit ? e.credit.toLocaleString() : '-',
        e.balance.toLocaleString(),
        e.status || '',
      ]),
      styles     : { fontSize: 9 },
      headStyles : { fillColor: [30, 64, 175] },
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Closing Balance: Rs. ${ledger.balance.toLocaleString()}`, 14, finalY);
    return doc;
  };

  const handlePreview = () => {
    if (!selectedId || ledgerEntries.length === 0) return;
    const doc  = generatePDF();
    const blob = doc.output('blob');
    setPreviewSrc(URL.createObjectURL(blob));
  };

  const handlePrint = () => {
    if (!selectedId || ledgerEntries.length === 0) return;
    const doc    = generatePDF();
    const blob   = doc.output('blob');
    const url    = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => { iframe.contentWindow.print(); };
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <div><h1 className="page-title">Ledgers</h1></div>
        {selectedId && ledgerEntries.length > 0 && (
          <div style={{ display:'flex', gap:'6px' }}>
            <button className="btn btn-outline" style={{ padding:'8px' }} onClick={handlePreview} title="Preview"><Eye size={15}/></button>
            <button className="btn btn-outline" style={{ padding:'8px' }} onClick={handlePrint}  title="Print"><Printer size={15}/></button>
          </div>
        )}
      </header>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-2)', marginBottom:'var(--sp-4)' }}>
        <div className="glass-panel" style={{ padding:'12px', textAlign:'center' }}>
          <div style={{ fontSize:'0.7rem', color:'gray', marginBottom:'4px' }}>Total Receivable</div>
          <div style={{ fontSize:'1.1rem', fontWeight:'700', color:'#10b981' }}>Rs.{totalReceivables.toLocaleString()}</div>
        </div>
        <div className="glass-panel" style={{ padding:'12px', textAlign:'center' }}>
          <div style={{ fontSize:'0.7rem', color:'gray', marginBottom:'4px' }}>Total Payable</div>
          <div style={{ fontSize:'1.1rem', fontWeight:'700', color:'#f59e0b' }}>Rs.{totalPayables.toLocaleString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'var(--sp-4)' }}>
        {['customers','vendors'].map(t => (
          <button key={t} onClick={() => { setActiveTab(t); setSelectedId(''); }} style={{ padding:'8px 12px', borderRadius:'4px', border:'1px solid var(--border-color)', background: activeTab===t ? 'rgba(59,130,246,0.2)' : 'none', color: activeTab===t ? 'white' : 'gray', fontSize:'0.85rem' }}>
            {t === 'customers' ? 'Customers' : 'Vendors'}
          </button>
        ))}
      </div>

      {/* Account selector */}
      <div className="glass-panel" style={{ padding:'12px', marginBottom:'var(--sp-3)' }}>
        <select
          className="input-field"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{ width:'100%' }}
        >
          <option value="">— Select {activeTab === 'customers' ? 'Customer' : 'Vendor'} —</option>
          {(activeTab === 'customers' ? clients : vendors).map(entity => (
            <option key={entity.id} value={entity.id}>{entity.name}</option>
          ))}
        </select>
      </div>

      {/* Ledger table */}
      {!selectedId ? (
        <div className="glass-panel" style={{ padding:'32px', textAlign:'center', color:'gray', fontSize:'0.85rem' }}>
          Select an account above to view its ledger
        </div>
      ) : ledgerEntries.length === 0 ? (
        <div className="glass-panel" style={{ padding:'32px', textAlign:'center', color:'gray', fontSize:'0.85rem' }}>
          No transactions found for <strong>{entityName}</strong>
        </div>
      ) : (
        <>
          {/* Account header */}
          <div style={{ marginBottom:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 4px' }}>
            <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{entityName}</span>
            <span style={{ fontSize:'0.8rem', color: ledger.balance > 0 ? '#f59e0b' : '#10b981' }}>
              Closing Balance: Rs.{Math.abs(ledger.balance).toLocaleString()} {ledger.balance > 0 ? '(Dr)' : '(Cr)'}
            </span>
          </div>

          <div className="glass-panel" style={{ overflowX:'auto', padding:'0' }}>
            <table style={{ width:'100%', minWidth:'600px', textAlign:'left', borderCollapse:'collapse', fontSize:'0.84rem' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.15)' }}>
                  {['Date','Reference','Description','Debit (Rs.)','Credit (Rs.)','Balance (Rs.)','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', color:'#94a3b8', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((entry, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding:'10px 12px', color:'#94a3b8', whiteSpace:'nowrap' }}>{entry.date}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', fontSize:'0.78rem' }}>{entry.ref}</td>
                    <td style={{ padding:'10px 12px' }}>{entry.description}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', color: entry.debit ? '#e2e8f0' : '#475569' }}>
                      {entry.debit ? entry.debit.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'right', color: entry.credit ? '#10b981' : '#475569' }}>
                      {entry.credit ? entry.credit.toLocaleString() : '—'}
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:600, color: entry.balance > 0 ? '#f59e0b' : '#10b981' }}>
                      {entry.balance.toLocaleString()}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{
                        fontSize:'0.72rem', fontWeight:600, padding:'2px 8px', borderRadius:'999px',
                        background: entry.status==='Paid' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        color: entry.status==='Paid' ? '#10b981' : '#f59e0b',
                      }}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PDF Preview modal */}
      {previewSrc && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', zIndex:1000, padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'12px' }}>
            <h2 style={{ color:'white', margin:0, fontSize:'1rem' }}>Ledger Preview — {entityName}</h2>
            <button onClick={() => { URL.revokeObjectURL(previewSrc); setPreviewSrc(null); }} style={{ background:'none', border:'none', color:'white', cursor:'pointer' }}><X size={20}/></button>
          </div>
          <iframe src={previewSrc} style={{ flex:1, borderRadius:'8px', border:'none' }} title="Ledger PDF" />
        </div>
      )}
    </div>
  );
}
