import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, X, Trash2, Download, FileText, CheckCircle2, AlertCircle, TrendingUp, Layers, DollarSign, Eye, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadDatabase, saveDatabase } from '../utils/db';
import { drawBrandedHeader, BRAND } from '../utils/documentBranding';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  
  const [activeTab, setActiveTab] = useState('crm');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');

  const [newClient, setNewClient] = useState({ name: '', contact: '', email: '', phone: '', status: 'Lead', goAhead: 'Pending', pipelineStage: 'Lead' });

  const [quoteClientId, setQuoteClientId] = useState('');
  const [quoteClientName, setQuoteClientName] = useState('');
  const [quoteClientEmail, setQuoteClientEmail] = useState('');
  const [quoteClientPhone, setQuoteClientPhone] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);
  
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState('');

  useEffect(() => {
    loadDatabase().then(data => {
      setClients(data.clients || []);
      setQuotations(data.quotations || []);
      setInvoices(data.invoices || []);
      setServices(data.services || []);
    });
  }, []);

  const handleSaveClient = async () => {
    if (!newClient.name) return alert('Company name is required');
    const client = { ...newClient, id: Date.now() };
    const updatedClients = [client, ...clients];
    setClients(updatedClients);
    const db = await loadDatabase();
    await saveDatabase({ ...db, clients: updatedClients });
    setShowClientModal(false);
    setNewClient({ name: '', contact: '', email: '', phone: '', status: 'Lead', goAhead: 'Pending', pipelineStage: 'Lead' });
  };

  const handleDeleteClient = async (id) => {
    if (!confirm('Are you sure?')) return;
    const updatedClients = clients.filter(c => c.id !== id);
    setClients(updatedClients);
    const db = await loadDatabase();
    await saveDatabase({ ...db, clients: updatedClients });
  };

  const handleUpdateStage = async (clientId, stage) => {
    const updatedClients = clients.map(c => {
      if (c.id === clientId) {
        let goAhead = c.goAhead;
        let status = c.status;
        if (stage === 'Won') { goAhead = 'Approved'; status = 'Active Client'; }
        else if (stage === 'Lost') { goAhead = 'Rejected'; }
        return { ...c, pipelineStage: stage, goAhead, status };
      }
      return c;
    });
    setClients(updatedClients);
    const db = await loadDatabase();
    await saveDatabase({ ...db, clients: updatedClients });
  };

  const handleClientSelect = (clientId) => {
    setQuoteClientId(clientId);
    if (clientId === 'custom') {
      setQuoteClientName(''); setQuoteClientEmail(''); setQuoteClientPhone('');
    } else {
      const client = clients.find(c => String(c.id) === String(clientId));
      if (client) { setQuoteClientName(client.name); setQuoteClientEmail(client.email || ''); setQuoteClientPhone(client.phone || ''); }
    }
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedServiceId(serviceId);
    if (serviceId === 'custom') { setItemDescription(''); setItemRate(''); }
    else {
      const service = services.find(s => String(s.id) === String(serviceId));
      if (service) { setItemDescription(service.name); setItemRate(service.price); }
    }
  };

  const handleAddQuoteItem = () => {
    if (!itemDescription) return alert('Enter description.');
    const newItem = { id: Date.now(), name: itemDescription, qty: Number(itemQty), rate: Number(itemRate), total: Number(itemQty) * Number(itemRate) };
    setQuoteItems([...quoteItems, newItem]);
    setItemDescription(''); setItemQty(1); setItemRate('');
  };

  const handleSaveQuotation = async () => {
    if (!quoteClientName) return alert('Enter client name.');
    const grandTotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
    const quote = {
      id: `QT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client: quoteClientName, clientEmail: quoteClientEmail, clientPhone: quoteClientPhone,
      date: new Date().toLocaleDateString(), amount: String(grandTotal), status: 'Sent',
      items: quoteItems.map(it => ({ name: it.name, qty: it.qty, rate: String(it.rate), total: String(it.total) }))
    };
    const updatedQuotations = [quote, ...quotations];
    setQuotations(updatedQuotations);
    const db = await loadDatabase();
    await saveDatabase({ ...db, quotations: updatedQuotations });
    setShowQuoteModal(false); setQuoteItems([]); setQuoteClientName('');
  };

  const handleConvertToSalesOrder = async (quote) => {
    const updatedQuotations = quotations.map(q => q.id === quote.id ? { ...q, status: 'Sales Order' } : q);
    setQuotations(updatedQuotations);
    const matchingInvoice = {
      id: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client: quote.client, clientEmail: quote.clientEmail, clientPhone: quote.clientPhone,
      date: new Date().toLocaleDateString(), amount: quote.amount, status: 'Pending', items: quote.items
    };
    const updatedInvoices = [matchingInvoice, ...invoices];
    setInvoices(updatedInvoices);
    const updatedClients = clients.map(c => c.name === quote.client ? { ...c, status: 'Active Client', goAhead: 'Approved', pipelineStage: 'Won' } : c);
    setClients(updatedClients);
    const db = await loadDatabase();
    await saveDatabase({ ...db, quotations: updatedQuotations, invoices: updatedInvoices, clients: updatedClients });
    alert(`Converted successfully! Invoice ${matchingInvoice.id} created.`);
  };

  const generateQuotePDF = (quote, action = 'preview') => {
    const doc = new jsPDF();
    
    // Official Branded Header with Logo, Direct Engineering Line, and Watermark
    drawBrandedHeader(doc, { pageNo: 1, totalPages: 1 });

    // Document Title Banner
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(124, 58, 237); // Brand Violet
    doc.text('OFFICIAL PROJECT QUOTATION', 14, 38);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Quote ID: ${quote.id}`, 14, 44);
    doc.text(`Valid Until: ${quote.date}`, 14, 49);
    doc.text(`Status: ${quote.status || 'Draft'}`, 196, 44, { align: 'right' });

    // Client Information Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 54, 182, 22, 2, 2, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('PROPOSED FOR (CLIENT / PROSPECT):', 18, 60);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(quote.client || 'Valued Client', 18, 66);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    let contactInfo = [];
    if (quote.clientEmail) contactInfo.push(`Email: ${quote.clientEmail}`);
    if (quote.clientPhone) contactInfo.push(`Phone: ${quote.clientPhone}`);
    doc.text(contactInfo.join('  |  ') || 'Digital & Infrastructure Growth Account', 18, 71);

    const lineItems = quote.items || [];
    const tableBody = lineItems.map((it, idx) => [
      idx + 1, it.name, it.qty, `Rs. ${Number(it.rate).toLocaleString()}`, `Rs. ${Number(it.total).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 81,
      head: [['#', 'Scope / Deliverables Description', 'Qty', 'Unit Rate', 'Total Amount (PKR)']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3.5 }
    });

    const finalY = doc.lastAutoTable.finalY || 120;
    
    // Total block
    const grandTotal = lineItems.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    doc.setFillColor(248, 250, 252);
    doc.rect(120, finalY + 6, 76, 16, 'F');
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(0.4);
    doc.rect(120, finalY + 6, 76, 16, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Estimated Project Total:', 124, finalY + 14);

    doc.setFontSize(12);
    doc.setTextColor(124, 58, 237);
    doc.text(`Rs. ${grandTotal.toLocaleString()}`, 192, finalY + 14, { align: 'right' });

    // Signatures & Acceptance
    const sigY = Math.min(finalY + 45, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(14, sigY, 70, sigY);
    doc.line(140, sigY, 196, sigY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Engineering Lead (RAKTechSoftHub)', 14, sigY + 5);
    doc.text('Client Proposal Approval', 140, sigY + 5);

    const blobUrl = doc.output('bloburl');
    if (action === 'print') {
      const iframe = document.createElement('iframe'); iframe.style.display = 'none'; document.body.appendChild(iframe);
      iframe.src = blobUrl; iframe.onload = () => iframe.contentWindow.print();
    } else { setPdfPreviewUrl(blobUrl); setPreviewFileName(`${quote.id}.pdf`); setShowPreview(true); }
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalLeads = clients.filter(c => c.status === 'Lead').length;
  const activeDeals = quotations.filter(q => q.status === 'Sent').length;
  const convertedWon = quotations.filter(q => q.status === 'Sales Order').length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sales Order': return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' };
      case 'Sent': return { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)' };
      default: return { bg: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-muted)' };
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">Sales & CRM</h1></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowClientModal(true)}><Plus size={16} /><span className="desktop-only">Contact</span></button>
          <button className="btn btn-primary" onClick={() => setShowQuoteModal(true)}><Plus size={16} /><span className="desktop-only">Quote</span></button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)' }}>
        <div className="glass-panel" style={{ padding: 'var(--sp-3)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Leads</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{totalLeads}</div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-3)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Quotes</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{activeDeals}</div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-3)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Won</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{convertedWon}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-4)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {['crm', 'quotations', 'pipeline'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 15px', borderRadius: '4px', border: '1px solid var(--border-color)', background: activeTab === tab ? 'rgba(59, 130, 246, 0.2)' : 'none', color: activeTab === tab ? 'white' : 'gray', fontSize: '0.85rem' }}>
            {tab === 'crm' ? 'Contacts' : tab === 'quotations' ? 'Quotes' : 'Pipeline'}
          </button>
        ))}
      </div>

      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ padding: '24px', width: '450px', maxWidth: '100%', background: 'var(--surface-elevated, #1e293b)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>New Contact / Lead</h2>
              <button onClick={() => setShowClientModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Company / Client Name *</label>
                <input className="input-field" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="e.g. Acme Corp" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Contact Person</label>
                <input className="input-field" value={newClient.contact} onChange={e => setNewClient({...newClient, contact: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Email</label>
                <input className="input-field" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} placeholder="john@acme.com" />
              </div>
              <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={handleSaveClient}>Save Contact</button>
            </div>
          </div>
        </div>
      )}

      {showQuoteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '800px', maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', background: 'var(--surface-elevated, #1e293b)', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.5)', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#f8fafc', fontWeight: 600 }}>Create New Quotation</h2>
              <button onClick={() => setShowQuoteModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
            </div>

            {/* Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#60a5fa', marginBottom: '14px' }}>Section 1: Client Information</div>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Select Client</label>
                    <select className="input-field" value={quoteClientId} onChange={e => handleClientSelect(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)' }}>
                      <option value="">-- Choose Client --</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      <option value="custom">+ Custom Client</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Client Name *</label>
                    <input className="input-field" value={quoteClientName} onChange={e => setQuoteClientName(e.target.value)} placeholder="Client Name" />
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#a78bfa', marginBottom: '14px' }}>Section 2: Add Quote Items</div>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Item / Service Description *</label>
                    <input className="input-field" value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="Description" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Qty *</label>
                    <input type="number" min="1" className="input-field" value={itemQty} onChange={e => setItemQty(e.target.value)} placeholder="1" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Rate (Rs.) *</label>
                    <input type="number" min="0" className="input-field" value={itemRate} onChange={e => setItemRate(e.target.value)} placeholder="Rate" />
                  </div>
                  <button className="btn btn-primary" style={{ height: '40px', padding: '0 16px' }} onClick={handleAddQuoteItem}>Add</button>
                </div>
              </div>

              <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px' }}>Section 3: Quote Items List ({quoteItems.length})</div>
                {quoteItems.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>No items added yet.</div>
                ) : (
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', color: '#94a3b8' }}><th style={{ padding: '8px' }}>Item</th><th style={{ padding: '8px', textAlign: 'center' }}>Qty</th><th style={{ padding: '8px', textAlign: 'right' }}>Rate</th><th style={{ padding: '8px', textAlign: 'right' }}>Total</th></tr></thead>
                    <tbody>
                      {quoteItems.map(it => (
                        <tr key={it.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px', fontSize: '0.88rem', color: '#f1f5f9' }}>{it.name}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}>{it.qty}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontSize: '0.85rem' }}>{Number(it.rate).toLocaleString()}</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#60a5fa' }}>{Number(it.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>
                Total: Rs. {quoteItems.reduce((s, i) => s + i.total, 0).toLocaleString()}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => setShowQuoteModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveQuotation}>Save Quote</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'crm' && (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid gray', fontSize: '0.85rem' }}><th style={{ padding: '10px' }}>Company</th><th style={{ padding: '10px' }}>Stage</th><th style={{ padding: '10px', textAlign: 'right' }}>Action</th></tr></thead>
            <tbody>
              {filteredClients.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}><div style={{ fontWeight: '600' }}>{c.name}</div><div style={{ fontSize: '0.75rem', color: 'gray' }}>{c.contact}</div></td>
                  <td style={{ padding: '10px' }}>
                    <select className="input-field" value={c.pipelineStage} onChange={e => handleUpdateStage(c.id, e.target.value)} style={{ padding: '2px', fontSize: '0.8rem', width: '100px' }}>
                      <option value="Lead">Lead</option><option value="Won">Won</option><option value="Lost">Lost</option>
                    </select>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}><button onClick={() => handleDeleteClient(c.id)} style={{ background: 'none', border: 'none', color: 'red' }}><Trash2 size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'quotations' && (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid gray', fontSize: '0.85rem' }}><th style={{ padding: '10px' }}>ID / Client</th><th style={{ padding: '10px' }}>Amount</th><th style={{ padding: '10px', textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}><div style={{ fontWeight: '600' }}>{q.id}</div><div style={{ fontSize: '0.75rem', color: 'gray' }}>{q.client}</div></td>
                  <td style={{ padding: '10px' }}>Rs. {Number(q.amount).toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline" style={{ padding: '4px' }} onClick={() => generateQuotePDF(q, 'preview')}><Eye size={14}/></button>
                      {q.status === 'Sent' && <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => handleConvertToSalesOrder(q)}>Won</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
          {['Lead', 'Proposal Sent', 'Won', 'Lost'].map(stage => (
            <div key={stage} className="glass-panel" style={{ minWidth: '200px', padding: '10px' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '10px', borderBottom: '1px solid gray' }}>{stage}</h3>
              {clients.filter(c => (c.pipelineStage || 'Lead') === stage).map(c => (
                <div key={c.id} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', marginBottom: '5px', borderRadius: '4px', fontSize: '0.8rem' }}>{c.name}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '10px' }}>
          <div className="glass-panel" style={{ padding: '20px', width: '100%', height: '100%', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><h2>Preview</h2><button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X/></button></div>
            <iframe src={pdfPreviewUrl} style={{ width: '100%', height: 'calc(100% - 60px)', border: 'none', background: 'white' }} />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .page-title { font-size: 1.2rem; }
        }
      `}</style>
    </div>
  );
}
