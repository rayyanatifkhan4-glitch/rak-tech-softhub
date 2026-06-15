import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, Download, User, Users, ArrowUpRight, ArrowDownLeft, Wallet, Eye, Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadDatabase } from '../utils/db';

export default function Ledgers() {
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  
  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'vendors'
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');

  useEffect(() => {
    loadDatabase().then(data => {
      setClients(data.clients || []);
      setInvoices(data.invoices || []);
      setVendors(data.vendors || []);
      setPurchaseOrders(data.purchaseOrders || []);
    });
  }, []);

  // --- Calculations ---
  // Customers Summary
  const totalReceivables = invoices
    .filter(inv => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

  // Vendors Summary
  const totalPayables = purchaseOrders
    .filter(po => po.status !== 'Paid')
    .reduce((sum, po) => sum + Number(po.amount || 0), 0);

  // Get selected customer transactions
  const getCustomerLedgerData = () => {
    if (!selectedCustomerId) return [];
    const client = clients.find(c => String(c.id) === String(selectedCustomerId));
    if (!client) return [];

    // Filter invoices for this client
    // Invoices has client name
    const clientInvoices = invoices.filter(inv => inv.client === client.name);
    
    // Create entries for sales (invoices created) and receipts (invoices paid)
    const entries = [];
    clientInvoices.forEach(inv => {
      // Invoice entry (Sale)
      entries.push({
        date: inv.date,
        description: `Invoice Created: ${inv.items ? inv.items.map(i => i.name).join(', ') : 'Services'}`,
        refId: inv.id,
        type: 'sale',
        amount: Number(inv.amount || 0),
        status: inv.status
      });

      // Receipt entry (if paid)
      if (inv.status === 'Paid') {
        entries.push({
          date: inv.date, // assuming paid on same date/recorded date
          description: `Payment Received for ${inv.id}`,
          refId: inv.id,
          type: 'receipt',
          amount: Number(inv.amount || 0),
          status: 'Paid'
        });
      }
    });

    // Sort by date (assuming standard formats, or simple split compare)
    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Get selected vendor transactions
  const getVendorLedgerData = () => {
    if (!selectedVendorId) return [];
    const vendor = vendors.find(v => String(v.id) === String(selectedVendorId));
    if (!vendor) return [];

    // Filter POs for this vendor
    const vendorPOs = purchaseOrders.filter(po => po.vendor === vendor.name);

    const entries = [];
    vendorPOs.forEach(po => {
      // Purchase entry
      entries.push({
        date: po.date,
        description: `Purchase Order: ${po.items ? po.items.map(i => i.name).join(', ') : 'Goods'}`,
        refId: po.id,
        type: 'purchase',
        amount: Number(po.amount || 0),
        status: po.status
      });

      // Payment made entry (if paid)
      if (po.status === 'Paid') {
        entries.push({
          date: po.date,
          description: `Payment Made for ${po.id}`,
          refId: po.id,
          type: 'payment',
          amount: Number(po.amount || 0),
          status: 'Paid'
        });
      }
    });

    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Generate PDF Statement
  const generateCustomerStatementPDF = (client, entries, action = 'preview') => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('RAK Tech Soft Hub', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 26);
    
    doc.setFontSize(16);
    doc.setTextColor(50);
    doc.text('CUSTOMER ACCOUNT STATEMENT', 14, 42);
    
    // Client Info
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text('Statement For:', 14, 55);
    doc.setFontSize(13);
    doc.text(client.name, 14, 61);
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Email: ${client.email || 'N/A'}`, 14, 67);
    doc.text(`Phone: ${client.phone || 'N/A'}`, 14, 72);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 77);

    // Build Table
    let runningBal = 0;
    const body = entries.map((entry, index) => {
      if (entry.type === 'sale') {
        runningBal += entry.amount;
      } else {
        runningBal -= entry.amount;
      }
      return [
        index + 1,
        entry.date,
        entry.description,
        entry.refId,
        entry.type === 'sale' ? `Rs. ${entry.amount.toLocaleString()}` : '-',
        entry.type === 'receipt' ? `Rs. ${entry.amount.toLocaleString()}` : '-',
        `Rs. ${runningBal.toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: 85,
      head: [['#', 'Date', 'Description', 'Ref ID', 'Sales (Dr)', 'Receipts (Cr)', 'Balance']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
    });

    const finalY = doc.lastAutoTable.finalY || 120;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Current Outstanding Balance:`, 110, finalY + 15);
    doc.setFontSize(14);
    doc.text(`Rs. ${runningBal.toLocaleString()}`, 195, finalY + 15, { align: 'right' });

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text('Designed & Developed by RAK Tech Soft Hub Group', 105, 285, { align: 'center' });
    const blobUrl = doc.output('bloburl');
    if (action === 'print') {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframe.src = blobUrl;
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
    } else {
      setPdfPreviewUrl(blobUrl);
      setPreviewFileName(`${client.name}_statement.pdf`);
      setShowPreview(true);
    }
  };

  const generateVendorStatementPDF = (vendor, entries, action = 'preview') => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11); // Warning Orange
    doc.text('RAK Tech Soft Hub', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 26);
    
    doc.setFontSize(16);
    doc.setTextColor(50);
    doc.text('VENDOR ACCOUNT STATEMENT', 14, 42);
    
    // Vendor Info
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text('Statement For Vendor:', 14, 55);
    doc.setFontSize(13);
    doc.text(vendor.name, 14, 61);
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Email: ${vendor.email || 'N/A'}`, 14, 67);
    doc.text(`Phone: ${vendor.phone || 'N/A'}`, 14, 72);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 77);

    // Build Table
    let runningBal = 0;
    const body = entries.map((entry, index) => {
      if (entry.type === 'purchase') {
        runningBal += entry.amount;
      } else {
        runningBal -= entry.amount;
      }
      return [
        index + 1,
        entry.date,
        entry.description,
        entry.refId,
        entry.type === 'purchase' ? `Rs. ${entry.amount.toLocaleString()}` : '-',
        entry.type === 'payment' ? `Rs. ${entry.amount.toLocaleString()}` : '-',
        `Rs. ${runningBal.toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: 85,
      head: [['#', 'Date', 'Description', 'Ref ID', 'Purchases (Cr)', 'Payments (Dr)', 'Balance']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
    });

    const finalY = doc.lastAutoTable.finalY || 120;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Current Outstanding Payable:`, 110, finalY + 15);
    doc.setFontSize(14);
    doc.text(`Rs. ${runningBal.toLocaleString()}`, 195, finalY + 15, { align: 'right' });

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text('Designed & Developed by RAK Tech Soft Hub Group', 105, 285, { align: 'center' });
    const blobUrl = doc.output('bloburl');
    if (action === 'print') {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframe.src = blobUrl;
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
    } else {
      setPdfPreviewUrl(blobUrl);
      setPreviewFileName(`${vendor.name}_statement.pdf`);
      setShowPreview(true);
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Ledgers</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track customer account statements and vendor payable ledgers.</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)' }}>
            <ArrowDownLeft size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Customer Receivables</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'white', marginTop: '4px' }}>Rs. {totalReceivables.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)' }}>
            <ArrowUpRight size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Vendor Payables</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'white', marginTop: '4px' }}>Rs. {totalPayables.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' }}>
            <Wallet size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Net Net Position</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'white', marginTop: '4px' }}>Rs. {(totalReceivables - totalPayables).toLocaleString()}</div>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-6)' }}>
        <button 
          onClick={() => setActiveTab('customers')} 
          style={{ 
            padding: '8px 20px', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--border-color)', 
            background: activeTab === 'customers' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', 
            color: activeTab === 'customers' ? 'white' : 'var(--text-secondary)', 
            cursor: 'pointer', 
            fontWeight: activeTab === 'customers' ? '600' : '400',
            transition: 'all var(--transition-fast)'
          }}
        >
          Customer Ledgers
        </button>
        <button 
          onClick={() => setActiveTab('vendors')} 
          style={{ 
            padding: '8px 20px', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--border-color)', 
            background: activeTab === 'vendors' ? 'rgba(245, 158, 11, 0.15)' : 'transparent', 
            color: activeTab === 'vendors' ? 'white' : 'var(--text-secondary)', 
            cursor: 'pointer', 
            fontWeight: activeTab === 'vendors' ? '600' : '400',
            transition: 'all var(--transition-fast)'
          }}
        >
          Vendor Ledgers
        </button>
      </div>

      {/* Selection & Statements */}
      {activeTab === 'customers' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {/* Client Select */}
          <div className="glass-panel" style={{ padding: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-4)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', minWidth: '150px' }}>
              <Users size={20} />
              <span style={{ fontWeight: '500' }}>Select Customer:</span>
            </div>
            <select 
              className="input-field" 
              value={selectedCustomerId} 
              onChange={e => setSelectedCustomerId(e.target.value)}
              style={{ flex: 1, margin: 0, background: 'rgba(15,23,42,0.9)' }}
            >
              <option value="">-- Choose Customer --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedCustomerId && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    const client = clients.find(c => String(c.id) === String(selectedCustomerId));
                    if (client) generateCustomerStatementPDF(client, getCustomerLedgerData(), 'preview');
                  }}
                >
                  <Eye size={16} /> Preview Statement
                </button>
                <button 
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}
                  onClick={() => {
                    const client = clients.find(c => String(c.id) === String(selectedCustomerId));
                    if (client) generateCustomerStatementPDF(client, getCustomerLedgerData(), 'print');
                  }}
                >
                  <Printer size={16} /> Print Statement
                </button>
              </div>
            )}
          </div>

          {/* Ledger Table */}
          {selectedCustomerId ? (
            <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--sp-4)' }}>
                Account Statement — {clients.find(c => String(c.id) === String(selectedCustomerId))?.name}
              </h2>
              {getCustomerLedgerData().length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>
                  No transaction history found for this customer.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Description</th>
                      <th style={{ padding: '12px' }}>Ref ID</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Sales (Dr)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Receipts (Cr)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let currentBal = 0;
                      return getCustomerLedgerData().map((entry, idx) => {
                        if (entry.type === 'sale') currentBal += entry.amount;
                        else currentBal -= entry.amount;

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                            <td style={{ padding: '12px' }}>{entry.date}</td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{entry.description}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
                                {entry.refId}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-danger)' }}>
                              {entry.type === 'sale' ? `Rs. ${entry.amount.toLocaleString()}` : '-'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-success)' }}>
                              {entry.type === 'receipt' ? `Rs. ${entry.amount.toLocaleString()}` : '-'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                              Rs. {currentBal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              Select a customer above to view their statement.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          {/* Vendor Select */}
          <div className="glass-panel" style={{ padding: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-4)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warning)', minWidth: '150px' }}>
              <User size={20} />
              <span style={{ fontWeight: '500' }}>Select Vendor:</span>
            </div>
            <select 
              className="input-field" 
              value={selectedVendorId} 
              onChange={e => setSelectedVendorId(e.target.value)}
              style={{ flex: 1, margin: 0, background: 'rgba(15,23,42,0.9)' }}
            >
              <option value="">-- Choose Vendor --</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {selectedVendorId && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    const vendor = vendors.find(v => String(v.id) === String(selectedVendorId));
                    if (vendor) generateVendorStatementPDF(vendor, getVendorLedgerData(), 'preview');
                  }}
                >
                  <Eye size={16} /> Preview Statement
                </button>
                <button 
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}
                  onClick={() => {
                    const vendor = vendors.find(v => String(v.id) === String(selectedVendorId));
                    if (vendor) generateVendorStatementPDF(vendor, getVendorLedgerData(), 'print');
                  }}
                >
                  <Printer size={16} /> Print Statement
                </button>
              </div>
            )}
          </div>

          {/* Ledger Table */}
          {selectedVendorId ? (
            <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--sp-4)' }}>
                Account Statement — {vendors.find(v => String(v.id) === String(selectedVendorId))?.name}
              </h2>
              {getVendorLedgerData().length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>
                  No transaction history found for this vendor.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Description</th>
                      <th style={{ padding: '12px' }}>Ref ID</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Purchases (Cr)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Payments (Dr)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let currentBal = 0;
                      return getVendorLedgerData().map((entry, idx) => {
                        if (entry.type === 'purchase') currentBal += entry.amount;
                        else currentBal -= entry.amount;

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                            <td style={{ padding: '12px' }}>{entry.date}</td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{entry.description}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
                                {entry.refId}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-danger)' }}>
                              {entry.type === 'purchase' ? `Rs. ${entry.amount.toLocaleString()}` : '-'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-success)' }}>
                              {entry.type === 'payment' ? `Rs. ${entry.amount.toLocaleString()}` : '-'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                              Rs. {currentBal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              Select a vendor above to view their statement.
            </div>
          )}
        </div>
      )}
      {/* PDF Preview & Print Modal */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '850px', maxWidth: '100%', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Document Preview — {previewFileName}</h2>
              <button onClick={() => { setShowPreview(false); setPdfPreviewUrl(null); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <iframe 
              src={pdfPreviewUrl} 
              title="PDF Preview"
              style={{ width: '100%', height: '60vh', border: 'none', background: 'white', borderRadius: 'var(--radius-sm)' }} 
            />

            <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'flex-end', marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => {
                const link = document.createElement('a');
                link.href = pdfPreviewUrl;
                link.download = previewFileName;
                link.click();
              }}>
                <Download size={14} /> Download PDF
              </button>
              <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }} onClick={() => {
                const iframe = document.createElement('iframe');
                iframe.style.position = 'fixed';
                iframe.style.right = '0';
                iframe.style.bottom = '0';
                iframe.style.width = '0';
                iframe.style.height = '0';
                iframe.style.border = '0';
                document.body.appendChild(iframe);
                iframe.src = pdfPreviewUrl;
                iframe.onload = () => {
                  iframe.contentWindow.focus();
                  iframe.contentWindow.print();
                  setTimeout(() => {
                    document.body.removeChild(iframe);
                  }, 1000);
                };
              }}>
                <Printer size={14} /> Print
              </button>
              <button className="btn btn-primary" onClick={() => {
                setShowPreview(false);
                setPdfPreviewUrl(null);
              }}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
