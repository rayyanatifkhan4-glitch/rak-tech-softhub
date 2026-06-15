import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, X, Trash2, Download, FileText, CheckCircle2, AlertCircle, TrendingUp, Layers, DollarSign, Eye, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  
  const [activeTab, setActiveTab] = useState('crm'); // 'crm', 'quotations', 'pipeline'
  const [showClientModal, setShowClientModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');

  // New Client Form State
  const [newClient, setNewClient] = useState({ name: '', contact: '', email: '', phone: '', status: 'Lead', goAhead: 'Pending', pipelineStage: 'Lead' });

  // New Quotation Form State
  const [quoteClientId, setQuoteClientId] = useState('');
  const [quoteClientName, setQuoteClientName] = useState('');
  const [quoteClientEmail, setQuoteClientEmail] = useState('');
  const [quoteClientPhone, setQuoteClientPhone] = useState('');
  const [quoteItems, setQuoteItems] = useState([]);
  
  // Current Item Form State
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

  // --- CRM Directory Logic ---
  const handleSaveClient = async () => {
    if (!newClient.name) return alert('Company name is required');
    const client = {
      ...newClient,
      id: Date.now()
    };
    const updatedClients = [client, ...clients];
    setClients(updatedClients);
    
    const db = await loadDatabase();
    await saveDatabase({ ...db, clients: updatedClients });
    
    setShowClientModal(false);
    setNewClient({ name: '', contact: '', email: '', phone: '', status: 'Lead', goAhead: 'Pending', pipelineStage: 'Lead' });
  };

  const handleDeleteClient = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
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
        if (stage === 'Won') {
          goAhead = 'Approved';
          status = 'Active Client';
        } else if (stage === 'Lost') {
          goAhead = 'Rejected';
        } else if (stage === 'Proposal Sent' || stage === 'Negotiation') {
          goAhead = 'In Discussion';
        }
        return { ...c, pipelineStage: stage, goAhead, status };
      }
      return c;
    });
    setClients(updatedClients);
    const db = await loadDatabase();
    await saveDatabase({ ...db, clients: updatedClients });
  };

  // --- Quotation Form Logic ---
  const handleClientSelect = (clientId) => {
    setQuoteClientId(clientId);
    if (clientId === 'custom') {
      setQuoteClientName('');
      setQuoteClientEmail('');
      setQuoteClientPhone('');
    } else {
      const client = clients.find(c => String(c.id) === String(clientId));
      if (client) {
        setQuoteClientName(client.name);
        setQuoteClientEmail(client.email || '');
        setQuoteClientPhone(client.phone || '');
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

  const handleAddQuoteItem = () => {
    if (!itemDescription) return alert('Enter service description.');
    if (!itemRate || isNaN(itemRate) || Number(itemRate) <= 0) return alert('Enter a valid rate.');
    if (!itemQty || isNaN(itemQty) || Number(itemQty) <= 0) return alert('Enter a valid quantity.');

    const newItem = {
      id: Date.now(),
      name: itemDescription,
      qty: Number(itemQty),
      rate: Number(itemRate),
      total: Number(itemQty) * Number(itemRate)
    };

    setQuoteItems([...quoteItems, newItem]);
    setSelectedServiceId('');
    setItemDescription('');
    setItemQty(1);
    setItemRate('');
  };

  const handleSaveQuotation = async () => {
    if (!quoteClientName) return alert('Select or enter a client name.');
    if (quoteItems.length === 0) return alert('Add at least one item.');

    const grandTotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
    const quote = {
      id: `QT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client: quoteClientName,
      clientEmail: quoteClientEmail,
      clientPhone: quoteClientPhone,
      date: new Date().toLocaleDateString(),
      amount: String(grandTotal),
      status: 'Sent', // Sent, Approved, Rejected, Sales Order
      items: quoteItems.map(it => ({ name: it.name, qty: it.qty, rate: String(it.rate), total: String(it.total) }))
    };

    const updatedQuotations = [quote, ...quotations];
    setQuotations(updatedQuotations);

    const db = await loadDatabase();
    await saveDatabase({ ...db, quotations: updatedQuotations });

    // Close and reset
    setShowQuoteModal(false);
    setQuoteItems([]);
    setQuoteClientName('');
    setQuoteClientEmail('');
    setQuoteClientPhone('');
    setQuoteClientId('');
  };

  const handleConvertToSalesOrder = async (quote) => {
    // 1. Mark quote as 'Sales Order'
    const updatedQuotations = quotations.map(q => {
      if (q.id === quote.id) {
        return { ...q, status: 'Sales Order' };
      }
      return q;
    });
    setQuotations(updatedQuotations);

    // 2. Auto-generate matching invoice in Invoices
    const matchingInvoice = {
      id: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      client: quote.client,
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      date: new Date().toLocaleDateString(),
      amount: quote.amount,
      status: 'Pending',
      items: quote.items
    };
    const updatedInvoices = [matchingInvoice, ...invoices];
    setInvoices(updatedInvoices);

    // 3. Update client status to Active Client and pipeline to Won if matching
    const updatedClients = clients.map(c => {
      if (c.name === quote.client) {
        return { ...c, status: 'Active Client', goAhead: 'Approved', pipelineStage: 'Won' };
      }
      return c;
    });
    setClients(updatedClients);

    const db = await loadDatabase();
    await saveDatabase({ 
      ...db, 
      quotations: updatedQuotations, 
      invoices: updatedInvoices,
      clients: updatedClients
    });

    alert(`Converted successfully! Created invoice ${matchingInvoice.id} and set client status to Active.`);
  };

  const handleUpdateQuoteStatus = async (quoteId, newStatus) => {
    const updatedQuotations = quotations.map(q => {
      if (q.id === quoteId) return { ...q, status: newStatus };
      return q;
    });
    setQuotations(updatedQuotations);
    const db = await loadDatabase();
    await saveDatabase({ ...db, quotations: updatedQuotations });
  };

  // --- PDF Export ---
  const generateQuotePDF = (quote, action = 'preview') => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('RAK Tech Soft Hub', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 26);
    
    doc.setFontSize(16);
    doc.setTextColor(50);
    doc.text('SERVICES QUOTATION', 14, 42);
    
    doc.setFontSize(10);
    doc.text(`Quote ID: ${quote.id}`, 14, 49);
    doc.text(`Date: ${quote.date}`, 14, 54);
    
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text('Quotation Prepared For:', 14, 68);
    doc.setFontSize(13);
    doc.text(quote.client, 14, 74);
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    let nextY = 80;
    if (quote.clientEmail) { doc.text(`Email: ${quote.clientEmail}`, 14, nextY); nextY += 5; }
    if (quote.clientPhone) { doc.text(`Phone: ${quote.clientPhone}`, 14, nextY); nextY += 5; }
 
    const items = quote.items || [];
    autoTable(doc, {
      startY: nextY + 5,
      head: [['#', 'Description', 'Qty', 'Unit Rate', 'Total Amount']],
      body: items.map((it, idx) => [idx + 1, it.name, it.qty, `Rs. ${Number(it.rate).toLocaleString()}`, `Rs. ${Number(it.total).toLocaleString()}`]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
 
    const fY = doc.lastAutoTable.finalY || 120;
    doc.setFontSize(12);
    doc.text('Quoted Total:', 110, fY + 15);
    doc.setFontSize(14);
    doc.text(`Rs. ${Number(quote.amount).toLocaleString()}`, 195, fY + 15, { align: 'right' });
 
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('Terms: Valid for 30 days from date of quotation.', 14, fY + 35);
    doc.text('RAK Tech Soft Hub representative signature', 14, fY + 55);
    doc.text('_________________________________', 14, fY + 50);
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
      setPreviewFileName(`${quote.id}.pdf`);
      setShowPreview(true);
    }
  };

  // --- Filter and Search ---
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalLeads = clients.filter(c => c.status === 'Lead').length;
  const activeDeals = quotations.filter(q => q.status === 'Sent').length;
  const convertedWon = quotations.filter(q => q.status === 'Sales Order').length;
  const pipelineValue = quotations
    .filter(q => q.status === 'Sent')
    .reduce((sum, q) => sum + Number(q.amount || 0), 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sales Order': return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-success)' };
      case 'Approved': return { bg: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)' };
      case 'Sent': return { bg: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-warning)' };
      case 'Rejected': return { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-danger)' };
      default: return { bg: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-muted)' };
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Sales & CRM</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track lead pipeline, generate quotations and convert into sales orders.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowClientModal(true)}><Plus size={16} /> Add Contact</button>
          <button className="btn btn-primary" onClick={() => setShowQuoteModal(true)}><Plus size={16} /> New Quotation</button>
        </div>
      </header>

      {/* CRM Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        <div className="glass-panel" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)' }}><Layers size={20} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Leads</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{totalLeads}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-warning)' }}><TrendingUp size={20} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Quotations</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{activeDeals}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-success)' }}><CheckCircle2 size={20} /></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Won Sales Orders</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{convertedWon}</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)' }}><span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₨</span></div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pipeline Value</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>Rs. {pipelineValue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-6)' }}>
        {['crm', 'quotations', 'pipeline'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: '8px 20px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--border-color)', 
              background: activeTab === tab ? 'rgba(59, 130, 246, 0.15)' : 'transparent', 
              color: activeTab === tab ? 'white' : 'var(--text-secondary)', 
              cursor: 'pointer', 
              fontWeight: activeTab === tab ? '600' : '400',
              transition: 'all 0.15s ease'
            }}
          >
            {tab === 'crm' && `Contacts (${clients.length})`}
            {tab === 'quotations' && `Quotations (${quotations.length})`}
            {tab === 'pipeline' && 'Sales Pipeline'}
          </button>
        ))}
      </div>

      {/* Contact Modal */}
      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '450px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>New Client / Lead</h2>
              <button onClick={() => setShowClientModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="input-group"><label className="input-label">Company Name</label><input className="input-field" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="Acme Corp" /></div>
              <div className="input-group"><label className="input-label">Contact Person</label><input className="input-field" value={newClient.contact} onChange={e => setNewClient({...newClient, contact: e.target.value})} placeholder="John Doe" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="input-group"><label className="input-label">Email</label><input className="input-field" type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} placeholder="john@acme.com" /></div>
                <div className="input-group"><label className="input-label">Phone</label><input className="input-field" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} placeholder="+92 300..." /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="input-group"><label className="input-label">Type</label>
                  <select className="input-field" value={newClient.status} onChange={e => setNewClient({...newClient, status: e.target.value})} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    <option value="Lead">Lead</option><option value="Active Client">Active Client</option><option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="input-group"><label className="input-label">Initial Stage</label>
                  <select className="input-field" value={newClient.pipelineStage} onChange={e => setNewClient({...newClient, pipelineStage: e.target.value})} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    <option value="Lead">Lead</option><option value="Contacted">Contacted</option><option value="Proposal Sent">Proposal Sent</option><option value="Negotiation">Negotiation</option><option value="Won">Won</option><option value="Lost">Lost</option>
                  </select>
                </div>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-6)' }} onClick={handleSaveClient}>Save Contact</button>
          </div>
        </div>
      )}

      {/* Quotation Modal */}
      {showQuoteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '800px', maxWidth: '100%', background: 'var(--bg-dark)', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-5)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText color="var(--accent-primary)" /> Create Service Quotation</h2>
              <button onClick={() => { setShowQuoteModal(false); setQuoteItems([]); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)', background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="input-group"><label className="input-label">Select Saved Client</label>
                <select className="input-field" value={quoteClientId} onChange={e => handleClientSelect(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">-- Choose Contact --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.status})</option>)}
                  <option value="custom">-- Custom Client --</option>
                </select>
              </div>
              <div className="input-group"><label className="input-label">Client Name</label><input className="input-field" value={quoteClientName} onChange={e => setQuoteClientName(e.target.value)} placeholder="Company / Client Name" /></div>
              <div className="input-group"><label className="input-label">Client Email</label><input className="input-field" value={quoteClientEmail} onChange={e => setQuoteClientEmail(e.target.value)} placeholder="client@example.com" /></div>
              <div className="input-group"><label className="input-label">Client Phone</label><input className="input-field" value={quoteClientPhone} onChange={e => setQuoteClientPhone(e.target.value)} placeholder="+92 300..." /></div>
            </div>

            {/* Quote Items Add */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 'var(--sp-6)' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: 'var(--sp-4)' }}>Add Quotation Items</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--sp-4)', alignItems: 'end' }}>
                <div className="input-group"><label className="input-label">Predefined Service Catalog</label>
                  <select className="input-field" value={selectedServiceId} onChange={e => handleServiceSelect(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    <option value="">-- Choose Predefined Service --</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} (Rs. {s.price})</option>)}
                    <option value="custom">-- Custom Service Item --</option>
                  </select>
                </div>
                <div className="input-group"><label className="input-label">Quantity</label><input type="number" min="1" className="input-field" value={itemQty} onChange={e => setItemQty(e.target.value)} /></div>
                <div className="input-group"><label className="input-label">Rate (Rs.)</label><input type="number" className="input-field" value={itemRate} onChange={e => setItemRate(e.target.value)} placeholder="Price" /></div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}><label className="input-label">Item / Service Name</label><input className="input-field" value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="Service description / title" /></div>
                <button className="btn btn-outline" style={{ height: '42px', width: '100%' }} onClick={handleAddQuoteItem}><Plus size={16}/> Add Item</button>
              </div>
            </div>

            {quoteItems.length > 0 && (
              <div style={{ marginBottom: 'var(--sp-6)' }}>
                <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: 'var(--sp-3)' }}>Quotation Line Items</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.2)' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}><th style={{ padding: '8px 12px' }}>Description</th><th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th><th style={{ padding: '8px 12px', textAlign: 'right' }}>Rate</th><th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th><th style={{ padding: '8px 12px', textAlign: 'center' }}>X</th></tr></thead>
                  <tbody>
                    {quoteItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 12px', color: 'white' }}>{item.name}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{item.qty}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Rs. {item.rate.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '500', color: 'white' }}>Rs. {item.total.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}><button onClick={() => setQuoteItems(quoteItems.filter(x => x.id !== item.id))} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 'bold' }}>
                      <td colSpan="3" style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>Grand Total:</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>Rs. {quoteItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <button className="btn btn-outline" onClick={() => { setShowQuoteModal(false); setQuoteItems([]); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveQuotation}>Save & Send Quote</button>
            </div>
          </div>
        </div>
      )}

      {/* CRM Main Content tabs */}
      {activeTab === 'crm' && (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-6)' }}>
            <div className="input-group" style={{ margin: 0, width: '300px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search contacts..." 
                style={{ paddingLeft: '40px' }} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Company Name</th>
                  <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Contact Info</th>
                  <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Stage</th>
                  <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Type</th>
                  <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr key={client.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: 'var(--sp-4)' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{client.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{client.contact}</div>
                    </td>
                    <td style={{ padding: 'var(--sp-4)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' }}>
                        {client.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Mail size={12}/> {client.email}</div>}
                        {client.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Phone size={12}/> {client.phone}</div>}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--sp-4)' }}>
                      <select 
                        className="input-field" 
                        value={client.pipelineStage || 'Lead'} 
                        onChange={e => handleUpdateStage(client.id, e.target.value)}
                        style={{ padding: '4px 8px', width: '150px', margin: 0, fontSize: '0.85rem', background: 'rgba(15,23,42,0.9)' }}
                      >
                        <option value="Lead">Lead</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Proposal Sent">Proposal Sent</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td style={{ padding: 'var(--sp-4)' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: '500',
                        background: client.status === 'Active Client' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                        color: client.status === 'Active Client' ? 'var(--accent-success)' : 'var(--accent-primary)'
                      }}>
                        {client.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', minWidth: 'auto', borderColor: 'rgba(239,68,68,0.4)', color: 'var(--accent-danger)' }}
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>No contacts found.</div>}
          </div>
        </div>
      )}

      {activeTab === 'quotations' && (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px var(--sp-4)' }}>Quote ID</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Client</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Date</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Amount</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Status</th>
                <th style={{ padding: '12px var(--sp-4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(quote => (
                <tr key={quote.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--sp-4)', fontWeight: '500', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--accent-primary)" />
                      {quote.id}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--sp-4)', color: 'var(--text-primary)' }}>{quote.client}</td>
                  <td style={{ padding: 'var(--sp-4)', color: 'var(--text-secondary)' }}>{quote.date}</td>
                  <td style={{ padding: 'var(--sp-4)', fontWeight: '500' }}>Rs. {Number(quote.amount).toLocaleString()}</td>
                  <td style={{ padding: 'var(--sp-4)' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.8rem', 
                      fontWeight: '500',
                      background: getStatusColor(quote.status).bg,
                      color: getStatusColor(quote.status).color
                    }}>
                      {quote.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => generateQuotePDF(quote, 'preview')}>
                        <Eye size={14} /> Preview
                      </button>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }} onClick={() => generateQuotePDF(quote, 'print')}>
                        <Printer size={14} /> Print
                      </button>
                      {quote.status === 'Sent' && (
                        <>
                          <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleConvertToSalesOrder(quote)}>
                            Convert to SO
                          </button>
                          <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }} onClick={() => handleUpdateQuoteStatus(quote.id, 'Rejected')}>
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {quotations.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>No quotations generated yet.</div>}
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--sp-4)', overflowX: 'auto', paddingBottom: '20px' }}>
          {['Lead', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].map(stage => {
            const stageClients = clients.filter(c => (c.pipelineStage || 'Lead') === stage);
            return (
              <div key={stage} className="glass-panel" style={{ padding: 'var(--sp-4)', background: 'rgba(30, 41, 59, 0.4)', minWidth: '170px' }}>
                <h3 style={{ 
                  fontSize: '0.9rem', 
                  borderBottom: '2px solid', 
                  borderColor: stage === 'Won' ? 'var(--accent-success)' : stage === 'Lost' ? 'var(--accent-danger)' : 'var(--border-color)', 
                  paddingBottom: '8px',
                  marginBottom: 'var(--sp-4)',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{stage}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({stageClients.length})</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {stageClients.map(c => (
                    <div key={c.id} style={{ padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontWeight: '500', fontSize: '0.85rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{c.contact}</div>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                        {stage !== 'Won' && stage !== 'Lost' && (
                          <>
                            <button 
                              style={{ padding: '2px 4px', fontSize: '0.7rem', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-success)', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                              onClick={() => handleUpdateStage(c.id, 'Won')}
                            >
                              Won
                            </button>
                            <button 
                              style={{ padding: '2px 4px', fontSize: '0.7rem', background: 'rgba(239,68,68,0.15)', color: 'var(--accent-danger)', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                              onClick={() => handleUpdateStage(c.id, 'Lost')}
                            >
                              Lost
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {stageClients.length === 0 && <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '20px 0' }}>Empty</div>}
                </div>
              </div>
            );
          })}
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
