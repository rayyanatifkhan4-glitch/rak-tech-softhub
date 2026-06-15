import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, X, Mail, Phone, Trash2, Tag, User, Eye, Printer } from 'lucide-react';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');
  
  // New Invoice Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('Pending');
  
  // Current Item Form State (for adding line items)
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemRate, setItemRate] = useState('');
  
  // List of items in the invoice being created
  const [invoiceItems, setInvoiceItems] = useState([]);

  // Load data from database utility
  useEffect(() => {
    loadDatabase().then(data => {
      setInvoices(data.invoices || []);
      setClients(data.clients || []);
      setServices(data.services || []);
    });
  }, [showModal]); // Re-load databases whenever modal is opened

  // Auto-fill Client Details when client is selected
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

  // Auto-fill Service Details when service is selected
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

  // Add line item to the current invoice builder
  const handleAddItem = () => {
    if (!itemDescription) {
      return alert('Please enter item name/description.');
    }
    if (!itemRate || isNaN(itemRate) || Number(itemRate) <= 0) {
      return alert('Please enter a valid rate/price.');
    }
    if (!itemQty || isNaN(itemQty) || Number(itemQty) <= 0) {
      return alert('Please enter a valid quantity.');
    }

    const newItem = {
      id: Date.now(),
      name: itemDescription,
      qty: Number(itemQty),
      rate: Number(itemRate),
      total: Number(itemQty) * Number(itemRate)
    };

    setInvoiceItems([...invoiceItems, newItem]);
    
    // Reset item inputs
    setSelectedServiceId('');
    setItemDescription('');
    setItemQty(1);
    setItemRate('');
  };

  // Remove item from line items list
  const handleRemoveItem = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  // Save built invoice
  const handleSaveInvoice = () => {
    if (!clientName) {
      return alert('Please select a client or enter client name.');
    }
    if (invoiceItems.length === 0) {
      return alert('Please add at least one item/service to the invoice.');
    }

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
    
    // Save to server database
    loadDatabase().then(db => {
      saveDatabase({ ...db, invoices: updated });
    });
    
    // Reset state & close modal
    setShowModal(false);
    setInvoiceItems([]);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setSelectedClientId('');
    setInvoiceStatus('Pending');
  };

  // PDF Generation with autotable
  const generatePDF = (inv, action = 'preview') => {
    const doc = new jsPDF();
    
    // Header (Company Branding)
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Accent blue
    doc.text('RAK Tech Soft Hub', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 26);
    doc.text('Phone: +92 309 2003125 | Email: raktechsofthub@gmail.com', 14, 31);
    
    doc.setFontSize(16);
    doc.setTextColor(50);
    doc.text('INVOICE', 14, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Invoice ID: ${inv.id}`, 14, 52);
    doc.text(`Date: ${inv.date}`, 14, 57);
    
    // Client Details Section
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text('Billed To:', 14, 70);
    doc.setFontSize(13);
    doc.text(inv.client, 14, 76);
    
    doc.setFontSize(10);
    doc.setTextColor(80);
    let nextY = 82;
    if (inv.clientEmail) {
      doc.text(`Email: ${inv.clientEmail}`, 14, nextY);
      nextY += 5;
    }
    if (inv.clientPhone) {
      doc.text(`Phone: ${inv.clientPhone}`, 14, nextY);
      nextY += 5;
    }
    
    // Line Items Formatting
    const lineItems = inv.items || [
      { name: inv.packageDetails || 'Professional Services', qty: 1, rate: inv.amount, total: inv.amount }
    ];
    
    const tableBody = lineItems.map((item, index) => [
      index + 1,
      item.name,
      item.qty,
      `Rs. ${Number(item.rate).toLocaleString()}`,
      `Rs. ${Number(item.total || Number(item.qty) * Number(item.rate)).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      startY: nextY + 5,
      head: [['#', 'Service / Item Description', 'Qty', 'Unit Rate', 'Total Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 90 },
        2: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 40, halign: 'right' }
      }
    });
    
    const finalY = doc.lastAutoTable.finalY || 100;
    
    // Grand Total Box
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Amount Due:`, 110, finalY + 15);
    doc.setFontSize(14);
    doc.text(`Rs. ${Number(inv.amount).toLocaleString()}`, 160, finalY + 15, { align: 'right' });
    
    // Signatures
    doc.setFontSize(11);
    doc.setTextColor(50);
    
    // Authorized Signature (Company)
    doc.text('_______________________', 14, finalY + 45);
    doc.text('Authorized Signature', 14, finalY + 51);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('RAK Tech Soft Hub representative', 14, 55);
    
    // Receiver Signature
    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.text('_______________________', 130, finalY + 45);
    doc.text("Receiver's Signature", 130, finalY + 51);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Client/Representative', 130, finalY + 55);
    
    // Footer message
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Thank you for choosing RAK Tech Soft Hub for your business needs!', 14, finalY + 75);
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
      <header className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Create billing invoices with multiple service items.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Create Invoice
        </button>
      </header>

      {/* Modal for Invoice Creation */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '800px', maxWidth: '100%', background: 'var(--bg-dark)', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-md)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-5)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText color="var(--accent-primary)"/> Multi-Item Invoice Creation</h2>
              <button onClick={() => {
                setShowModal(false);
                setInvoiceItems([]);
              }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            {/* Part 1: Client & Invoice Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)', background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ gridColumn: 'span 2', fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: '-5px' }}>Client Info</h3>
              
              <div className="input-group">
                <label className="input-label">Select Saved Client</label>
                <select className="input-field" value={selectedClientId} onChange={e => handleClientSelect(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="custom">-- Custom Client (Type below) --</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Invoice Status</label>
                <select className="input-field" value={invoiceStatus} onChange={e => setInvoiceStatus(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Client Name</label>
                <input className="input-field" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Acme Corp" />
              </div>

              <div className="input-group">
                <label className="input-label">Client Email</label>
                <input type="email" className="input-field" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@example.com" />
              </div>

              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Client Phone</label>
                <input className="input-field" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+92 300 1234567" />
              </div>
            </div>

            {/* Part 2: Add Line Items Form */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 'var(--sp-6)' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', marginBottom: 'var(--sp-4)' }}>Add Billing Service / Item</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--sp-4)', alignItems: 'end' }}>
                <div className="input-group">
                  <label className="input-label">Select Predefined Service (Website Catalog)</label>
                  <select className="input-field" value={selectedServiceId} onChange={e => handleServiceSelect(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    <option value="">-- Choose Predefined Service --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Rs. {s.price})</option>
                    ))}
                    <option value="custom">-- Custom Item (Type below) --</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Quantity</label>
                  <input type="number" min="1" className="input-field" value={itemQty} onChange={e => setItemQty(e.target.value)} />
                </div>

                <div className="input-group">
                  <label className="input-label">Rate / Unit Price (Rs.)</label>
                  <input type="number" className="input-field" value={itemRate} onChange={e => setItemRate(e.target.value)} placeholder="Price" />
                </div>

                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label className="input-label">Item / Service Name</label>
                  <input className="input-field" value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="Service description / name" />
                </div>

                <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '42px', width: '100%' }} onClick={handleAddItem}>
                  <Plus size={16}/> Add Item
                </button>
              </div>
            </div>

            {/* Part 3: Currently Added Items Table */}
            <div style={{ marginBottom: 'var(--sp-6)' }}>
              <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: 'var(--sp-3)' }}>Invoice Line Items ({invoiceItems.length})</h3>
              {invoiceItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--sp-6)', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  No items added yet. Choose a service above to add it.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px 12px' }}>Description</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Rate</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px 12px', color: 'white' }}>{item.name}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{item.qty}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Rs. {item.rate}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '500', color: 'white' }}>Rs. {item.total}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button onClick={() => handleRemoveItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                              <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>Grand Total:</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                          Rs. {invoiceItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <button className="btn btn-outline" onClick={() => {
                setShowModal(false);
                setInvoiceItems([]);
              }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveInvoice}>
                Save & Create Invoice
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Invoices List */}
      <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Invoice ID</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Client</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Services / Items</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Date</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Amount</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Status</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => {
              // Backward compatibility check for single-service old invoices
              const items = inv.items || [
                { name: inv.packageDetails || 'Professional Services', qty: 1, rate: inv.amount, total: inv.amount }
              ];
              
              // Summarize services string
              const servicesString = items.map(i => i.name).join(', ');
              
              return (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: 'var(--sp-4)', fontWeight: '500', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--accent-primary)" />
                      {inv.id}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--sp-4)' }}>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{inv.client}</div>
                    {(inv.clientEmail || inv.clientPhone) && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                        {inv.clientEmail && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12}/>{inv.clientEmail}</span>}
                        {inv.clientPhone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/>{inv.clientPhone}</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: 'var(--sp-4)', color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={servicesString}>
                    {servicesString}
                  </td>
                  <td style={{ padding: 'var(--sp-4)', color: 'var(--text-secondary)' }}>{inv.date}</td>
                  <td style={{ padding: 'var(--sp-4)', fontWeight: '500', color: 'white' }}>Rs. {Number(inv.amount).toLocaleString()}</td>
                  <td style={{ padding: 'var(--sp-4)' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.8rem', 
                      fontWeight: '500',
                      background: getStatusBg(inv.status),
                      color: getStatusColor(inv.status)
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => generatePDF(inv, 'preview')}>
                        <Eye size={14} /> Preview
                      </button>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }} onClick={() => generatePDF(inv, 'print')}>
                        <Printer size={14} /> Print
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
