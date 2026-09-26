import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, X, Mail, Phone, Trash2, Tag, User, Eye, Printer } from 'lucide-react';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { loadDatabase, saveDatabase } from '../utils/db';
import { drawBrandedHeader, BRAND } from '../utils/documentBranding';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');
  
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('Pending');
  
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState('');
  
  const [invoiceItems, setInvoiceItems] = useState([]);

  useEffect(() => {
    loadDatabase().then(data => {
      setInvoices(data.invoices || []);
      setClients(data.clients || []);
      setServices(data.services || []);
    });
  }, [showModal]);

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (clientId === 'custom') {
      setClientName('');
      setClientEmail('');
      setClientPhone('');
    } else {
      const client = clients.find(c => String(c.id) === String(clientId));
      if (client) {
        setClientName(client.name);
        setClientEmail(client.email || '');
        setClientPhone(client.phone || '');
      }
    }
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
    if (serviceId === 'custom') {
      setItemDescription('');
      setItemRate('');
    } else {
      const service = services.find(s => String(s.id) === String(serviceId));
      if (service) {
        setItemDescription(service.name);
        setItemRate(service.price);
      }
    }
  };

  const handleAddItem = () => {
    if (!itemDescription) return alert('Please enter item name.');
    if (!itemRate || isNaN(itemRate) || Number(itemRate) <= 0) return alert('Please enter a valid rate.');
    if (!itemQty || isNaN(itemQty) || Number(itemQty) <= 0) return alert('Please enter a valid qty.');

    const newItem = {
      id: Date.now(),
      name: itemDescription,
      qty: Number(itemQty),
      rate: Number(itemRate),
      total: Number(itemQty) * Number(itemRate)
    };

    setInvoiceItems([...invoiceItems, newItem]);
    setSelectedServiceId('');
    setItemDescription('');
    setItemQty(1);
    setItemRate('');
  };

  const handleRemoveItem = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  const handleSaveInvoice = () => {
    if (!clientName) return alert('Please select a client.');
    if (invoiceItems.length === 0) return alert('Add at least one item.');

    const grandTotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);

    const invoice = {
      id: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client: clientName,
      clientEmail: clientEmail,
      clientPhone: clientPhone,
      date: new Date().toLocaleDateString(),
      amount: String(grandTotal),
      status: invoiceStatus,
      items: invoiceItems.map(({ name, qty, rate, total }) => ({ name, qty, rate: String(rate), total: String(total) }))
    };

    const updated = [invoice, ...invoices];
    setInvoices(updated);
    
    loadDatabase().then(db => {
      saveDatabase({ ...db, invoices: updated });
    });
    
    setShowModal(false);
    setInvoiceItems([]);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setSelectedClientId('');
    setInvoiceStatus('Pending');
  };

  const generatePDF = (inv, action = 'preview') => {
    const doc = new jsPDF();
    
    // Official Branded Header with Logo, Direct Engineering Line, and Watermark
    drawBrandedHeader(doc, { pageNo: 1, totalPages: 1 });

    // Document Title Banner
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(124, 58, 237); // Brand Violet
    doc.text('COMMERCIAL INVOICE', 14, 38);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Invoice ID: ${inv.id}`, 14, 44);
    doc.text(`Issue Date: ${inv.date}`, 14, 49);
    doc.text(`Status: ${inv.status || 'Issued'}`, 196, 44, { align: 'right' });

    // Billed To Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 54, 182, 22, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('BILLED TO (CLIENT DETAILS):', 18, 60);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(inv.client || 'Valued Client', 18, 66);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    let contactInfo = [];
    if (inv.clientEmail) contactInfo.push(`Email: ${inv.clientEmail}`);
    if (inv.clientPhone) contactInfo.push(`Phone: ${inv.clientPhone}`);
    doc.text(contactInfo.join('  |  ') || 'Standard Business Account', 18, 71);

    const lineItems = inv.items || [{ name: inv.packageDetails || 'Engineering & Digital Services', qty: 1, rate: inv.amount, total: inv.amount }];
    const tableBody = lineItems.map((item, index) => [
      index + 1, item.name, item.qty, `Rs. ${Number(item.rate).toLocaleString()}`, `Rs. ${Number(item.total).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 81,
      head: [['#', 'Description / Service Item', 'Qty', 'Unit Rate', 'Amount (PKR)']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3.5 }
    });

    const finalY = doc.lastAutoTable.finalY || 120;
    
    // Total block
    doc.setFillColor(248, 250, 252);
    doc.rect(120, finalY + 6, 76, 16, 'F');
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(0.4);
    doc.rect(120, finalY + 6, 76, 16, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Total Amount Due:', 124, finalY + 14);

    doc.setFontSize(12);
    doc.setTextColor(124, 58, 237);
    doc.text(`Rs. ${Number(inv.amount).toLocaleString()}`, 192, finalY + 14, { align: 'right' });

    // Signatures
    const sigY = Math.min(finalY + 45, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(14, sigY, 70, sigY);
    doc.line(140, sigY, 196, sigY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Signature (RAKTechSoftHub)', 14, sigY + 5);
    doc.text("Client Acceptance & Signature", 140, sigY + 5);

    const blobUrl = doc.output('bloburl');
    if (action === 'print') {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = blobUrl;
      iframe.onload = () => { iframe.contentWindow.print(); };
    } else {
      setPdfPreviewUrl(blobUrl);
      setPreviewFileName(`${inv.id}.pdf`);
      setShowPreview(true);
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'Paid': return 'rgba(16, 185, 129, 0.15)';
      case 'Pending': return 'rgba(245, 158, 11, 0.15)';
      case 'Overdue': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(100, 116, 139, 0.15)';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'var(--accent-success)';
      case 'Pending': return 'var(--accent-warning)';
      case 'Overdue': return 'var(--accent-danger)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Invoices</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span className="desktop-only">Create Invoice</span>
        </button>
      </header>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '850px', maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', background: 'var(--surface-elevated, #1e293b)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.5)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#f8fafc', fontWeight: 600 }}>Create New Invoice</h2>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Fill client details and line items to generate an official invoice</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Section 1: Client & Invoice Meta */}
              <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#60a5fa', fontSize: '0.88rem', fontWeight: 600 }}>
                  <User size={16} /> Section 1: Client & Billing Information
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Select Saved Client</label>
                    <select className="input-field" value={selectedClientId} onChange={e => handleClientSelect(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)' }}>
                      <option value="">-- Choose Client --</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      <option value="custom">+ Custom / New Client</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Invoice Status</label>
                    <select className="input-field" value={invoiceStatus} onChange={e => setInvoiceStatus(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)' }}>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Client Name *</label>
                    <input className="input-field" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Acme Corporation" />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Client Email</label>
                    <input className="input-field" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@company.com" />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Client Phone</label>
                    <input className="input-field" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+92 300 1234567" />
                  </div>
                </div>
              </div>

              {/* Section 2: Add Services / Line Items */}
              <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa', fontSize: '0.88rem', fontWeight: 600 }}>
                    <Tag size={16} /> Section 2: Add Items / Services
                  </div>
                  {services.length > 0 && (
                    <div style={{ width: '220px' }}>
                      <select className="input-field" value={selectedServiceId} onChange={e => handleServiceSelect(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.78rem', background: 'rgba(15,23,42,0.8)' }}>
                        <option value="">-- Quick Add Service --</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name} (Rs.{s.price})</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Item / Service Description *</label>
                    <input className="input-field" value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="e.g. Web Development & LAN Setup" />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Qty *</label>
                    <input type="number" min="1" className="input-field" value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="1" />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Unit Rate (Rs.) *</label>
                    <input type="number" min="0" className="input-field" value={itemRate} onChange={e => setItemRate(e.target.value)} placeholder="e.g. 25000" />
                  </div>

                  <button className="btn btn-primary" style={{ height: '40px', padding: '0 16px', whiteSpace: 'nowrap' }} onClick={handleAddItem}>
                    <Plus size={16} /> Add Item
                  </button>
                </div>
              </div>

              {/* Section 3: Added Line Items Table */}
              <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Section 3: Invoice Line Items ({invoiceItems.length})</span>
                  {invoiceItems.length > 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>
                      Subtotal: Rs. {invoiceItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                    </span>
                  )}
                </div>

                {invoiceItems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                    No items added yet. Select a service above or type item details and click <strong style={{ color: '#94a3b8' }}>"Add Item"</strong>.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', color: '#94a3b8' }}>
                          <th style={{ padding: '8px 12px' }}>#</th>
                          <th style={{ padding: '8px 12px' }}>Item Description</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Rate (Rs.)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total (Rs.)</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceItems.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 500 }}>{item.name}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.88rem' }}>{item.qty}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.88rem' }}>{Number(item.rate).toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 600, color: '#60a5fa' }}>{Number(item.total).toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <button onClick={() => handleRemoveItem(item.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '5px', color: '#f87171', cursor: 'pointer' }} title="Remove Item">
                                <Trash2 size={14}/>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Fixed Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grand Total</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#38bdf8' }}>
                  Rs. {invoiceItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveInvoice} style={{ padding: '8px 20px', fontSize: '0.95rem' }}>
                  Save & Create Invoice
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
        <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <th style={{ padding: '15px' }}>Invoice / Client</th>
              <th style={{ padding: '15px' }}>Date</th>
              <th style={{ padding: '15px' }}>Amount</th>
              <th style={{ padding: '15px' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '15px' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{inv.id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{inv.client}</div>
                </td>
                <td style={{ padding: '15px', fontSize: '0.85rem' }}>{inv.date}</td>
                <td style={{ padding: '15px', fontWeight: '600' }}>Rs. {Number(inv.amount).toLocaleString()}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', background: getStatusBg(inv.status), color: getStatusColor(inv.status) }}>
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: '15px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" style={{ padding: '5px' }} onClick={() => generatePDF(inv, 'preview')}><Eye size={16}/></button>
                    <button className="btn btn-outline" style={{ padding: '5px' }} onClick={() => generatePDF(inv, 'print')}><Printer size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .page-title { font-size: 1.2rem; }
          .btn span { display: none; }
          .desktop-only { display: none; }
        }
      `}</style>
    </div>
  );
}
