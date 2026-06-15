import React, { useState, useEffect } from 'react';
import { Plus, Truck, FileText, X, Trash2, Download, Search, Edit, Phone, Mail, Eye, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Purchases() {
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('vendors');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', company: '', email: '', phone: '', category: 'IT Supplies' });
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');

  // PO form
  const [poVendorId, setPOVendorId] = useState('');
  const [poVendorName, setPOVendorName] = useState('');
  const [poStatus, setPOStatus] = useState('Draft');
  const [poItems, setPOItems] = useState([]);
  const [poItemName, setPOItemName] = useState('');
  const [poItemQty, setPOItemQty] = useState(1);
  const [poItemRate, setPOItemRate] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    loadDatabase().then(data => {
      setVendors(data.vendors || []);
      setPurchaseOrders(data.purchaseOrders || []);
      setProducts(data.products || []);
    });
  }, []);

  // --- Vendors ---
  const handleSaveVendor = async () => {
    if (!newVendor.name) return alert('Vendor name is required.');
    const vendor = { ...newVendor, id: Date.now() };
    const updated = [vendor, ...vendors];
    setVendors(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, vendors: updated });
    setShowVendorModal(false);
    setNewVendor({ name: '', company: '', email: '', phone: '', category: 'IT Supplies' });
  };

  const handleDeleteVendor = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    const updated = vendors.filter(v => v.id !== id);
    setVendors(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, vendors: updated });
  };

  // --- PO Items ---
  const handleSelectProduct = (productId) => {
    setSelectedProductId(productId);
    if (productId === 'custom') {
      setPOItemName(''); setPOItemRate('');
    } else {
      const p = products.find(x => String(x.id) === String(productId));
      if (p) { setPOItemName(p.name); setPOItemRate(p.price); }
    }
  };

  const handleAddPOItem = () => {
    if (!poItemName) return alert('Enter item name.');
    if (!poItemRate || Number(poItemRate) <= 0) return alert('Enter valid rate.');
    setPOItems([...poItems, { id: Date.now(), name: poItemName, qty: Number(poItemQty), rate: Number(poItemRate), total: Number(poItemQty) * Number(poItemRate) }]);
    setPOItemName(''); setPOItemQty(1); setPOItemRate(''); setSelectedProductId('');
  };

  const handleSavePO = async () => {
    if (!poVendorName) return alert('Select or type vendor name.');
    if (poItems.length === 0) return alert('Add at least one item.');
    const grandTotal = poItems.reduce((s, i) => s + i.total, 0);
    const po = {
      id: `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      vendor: poVendorName,
      date: new Date().toLocaleDateString(),
      status: poStatus,
      amount: String(grandTotal),
      items: poItems.map(({ name, qty, rate, total }) => ({ name, qty, rate: String(rate), total: String(total) }))
    };
    const updatedPOs = [po, ...purchaseOrders];
    setPurchaseOrders(updatedPOs);

    // If paid, create expense transaction
    const db = await loadDatabase();
    let updatedTransactions = db.transactions || [];
    if (poStatus === 'Paid') {
      updatedTransactions = [{ id: Date.now(), type: 'expense', category: 'Purchase', description: `PO ${po.id} - ${poVendorName}`, amount: grandTotal, date: po.date }, ...updatedTransactions];
    }
    // Update product stock if Received or Paid
    let updatedProducts = db.products || [];
    if (poStatus === 'Received' || poStatus === 'Paid') {
      poItems.forEach(item => {
        const pIdx = updatedProducts.findIndex(p => p.name === item.name);
        if (pIdx !== -1) {
          updatedProducts[pIdx] = { ...updatedProducts[pIdx], stock: (updatedProducts[pIdx].stock || 0) + item.qty };
        }
      });
    }
    await saveDatabase({ ...db, purchaseOrders: updatedPOs, transactions: updatedTransactions, products: updatedProducts });
    setShowPOModal(false);
    setPOItems([]); setPOVendorName(''); setPOVendorId(''); setPOStatus('Draft');
  };

  const handleVendorSelect = (vendorId) => {
    setPOVendorId(vendorId);
    if (vendorId === 'custom') { setPOVendorName(''); }
    else { const v = vendors.find(x => String(x.id) === String(vendorId)); if (v) setPOVendorName(v.name); }
  };

  // PDF
  const generatePOPdf = (po, action = 'preview') => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(59, 130, 246);
    doc.text('RAK Tech Soft Hub', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 26);
    doc.setFontSize(16); doc.setTextColor(50);
    doc.text('PURCHASE ORDER', 14, 42);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`PO ID: ${po.id}`, 14, 49); doc.text(`Date: ${po.date}`, 14, 54);
    doc.text(`Status: ${po.status}`, 14, 59);
    doc.setFontSize(11); doc.setTextColor(20);
    doc.text('Vendor:', 14, 72); doc.setFontSize(13); doc.text(po.vendor, 14, 78);
    const items = po.items || [{ name: 'Items', qty: 1, rate: po.amount, total: po.amount }];
    autoTable(doc, { startY: 86, head: [['#', 'Item Description', 'Qty', 'Unit Rate', 'Total']], body: items.map((it, i) => [i + 1, it.name, it.qty, `Rs. ${Number(it.rate).toLocaleString()}`, `Rs. ${Number(it.total).toLocaleString()}`]), theme: 'grid', headStyles: { fillColor: [59, 130, 246] }, columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 90 }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 35, halign: 'right' }, 4: { cellWidth: 40, halign: 'right' } } });
    const fY = doc.lastAutoTable.finalY || 100;
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text('Total Amount:', 110, fY + 15); doc.setFontSize(14);
    doc.text(`Rs. ${Number(po.amount).toLocaleString()}`, 160, fY + 15, { align: 'right' });
    doc.setFontSize(11); doc.setTextColor(50);
    doc.text('_______________________', 14, fY + 40); doc.text('Authorized Signature', 14, fY + 46);
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
      setPreviewFileName(`${po.id}.pdf`);
      setShowPreview(true);
    }
  };

  const getStatusColor = (s) => { if (s === 'Paid') return { bg: 'rgba(16,185,129,0.15)', color: 'var(--accent-success)' }; if (s === 'Received') return { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)' }; if (s === 'Sent') return { bg: 'rgba(245,158,11,0.15)', color: 'var(--accent-warning)' }; return { bg: 'rgba(100,116,139,0.15)', color: 'var(--text-muted)' }; };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage vendors and purchase orders.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowVendorModal(true)}><Plus size={16} /> Add Vendor</button>
          <button className="btn btn-primary" onClick={() => { setShowPOModal(true); }}><Plus size={16} /> New Purchase Order</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-6)' }}>
        {['vendors', 'orders'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: activeTab === t ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === t ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: activeTab === t ? '600' : '400', transition: 'all 0.15s ease' }}>
            {t === 'vendors' ? `Vendors (${vendors.length})` : `Purchase Orders (${purchaseOrders.length})`}
          </button>
        ))}
      </div>

      {/* Vendor Modal */}
      {showVendorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '450px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>Add Vendor</h2>
              <button onClick={() => setShowVendorModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="input-group"><label className="input-label">Vendor / Company Name</label><input className="input-field" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} placeholder="e.g. Ali Electronics" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="input-group"><label className="input-label">Email</label><input className="input-field" value={newVendor.email} onChange={e => setNewVendor({ ...newVendor, email: e.target.value })} placeholder="vendor@mail.com" /></div>
                <div className="input-group"><label className="input-label">Phone</label><input className="input-field" value={newVendor.phone} onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} placeholder="+92 300..." /></div>
              </div>
              <div className="input-group"><label className="input-label">Category</label>
                <select className="input-field" value={newVendor.category} onChange={e => setNewVendor({ ...newVendor, category: e.target.value })} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  <option value="IT Supplies">IT Supplies</option><option value="Hardware">Hardware</option><option value="Office Supplies">Office Supplies</option><option value="Software">Software</option><option value="Services">Services</option><option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-6)' }} onClick={handleSaveVendor}>Save Vendor</button>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '800px', maxWidth: '100%', background: 'var(--bg-dark)', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-5)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck color="var(--accent-warning)" /> Create Purchase Order</h2>
              <button onClick={() => { setShowPOModal(false); setPOItems([]); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)', background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="input-group"><label className="input-label">Select Vendor</label>
                <select className="input-field" value={poVendorId} onChange={e => handleVendorSelect(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">-- Choose Vendor --</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  <option value="custom">-- Custom Vendor --</option>
                </select>
              </div>
              <div className="input-group"><label className="input-label">Status</label>
                <select className="input-field" value={poStatus} onChange={e => setPOStatus(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  <option value="Draft">Draft</option><option value="Sent">Sent</option><option value="Received">Received</option><option value="Paid">Paid</option>
                </select>
              </div>
              {poVendorId === 'custom' && (
                <div className="input-group" style={{ gridColumn: 'span 2' }}><label className="input-label">Vendor Name</label><input className="input-field" value={poVendorName} onChange={e => setPOVendorName(e.target.value)} placeholder="Enter vendor name" /></div>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 'var(--sp-6)' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-warning)', marginBottom: 'var(--sp-4)' }}>Add Item</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--sp-4)', alignItems: 'end' }}>
                <div className="input-group"><label className="input-label">Select Product</label>
                  <select className="input-field" value={selectedProductId} onChange={e => handleSelectProduct(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    <option value="">-- Choose Product --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Rs. {p.price})</option>)}
                    <option value="custom">-- Custom Item --</option>
                  </select>
                </div>
                <div className="input-group"><label className="input-label">Qty</label><input type="number" min="1" className="input-field" value={poItemQty} onChange={e => setPOItemQty(e.target.value)} /></div>
                <div className="input-group"><label className="input-label">Rate (Rs.)</label><input type="number" className="input-field" value={poItemRate} onChange={e => setPOItemRate(e.target.value)} placeholder="Price" /></div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}><label className="input-label">Item Name</label><input className="input-field" value={poItemName} onChange={e => setPOItemName(e.target.value)} placeholder="Item description" /></div>
                <button className="btn btn-outline" style={{ height: '42px', width: '100%' }} onClick={handleAddPOItem}><Plus size={16} /> Add Item</button>
              </div>
            </div>

            {poItems.length > 0 && (
              <div style={{ marginBottom: 'var(--sp-6)' }}>
                <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: 'var(--sp-3)' }}>PO Items ({poItems.length})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.2)' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}><th style={{ padding: '8px 12px' }}>Item</th><th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th><th style={{ padding: '8px 12px', textAlign: 'right' }}>Rate</th><th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th><th style={{ padding: '8px 12px', textAlign: 'center' }}>X</th></tr></thead>
                  <tbody>
                    {poItems.map(it => (
                      <tr key={it.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 12px', color: 'white' }}>{it.name}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{it.qty}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Rs. {it.rate.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '500', color: 'white' }}>Rs. {it.total.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}><button onClick={() => setPOItems(poItems.filter(x => x.id !== it.id))} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 'bold' }}>
                      <td colSpan="3" style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>Grand Total:</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--accent-warning)', fontSize: '1.1rem' }}>Rs. {poItems.reduce((s, i) => s + i.total, 0).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <button className="btn btn-outline" onClick={() => { setShowPOModal(false); setPOItems([]); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSavePO}>Save Purchase Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'vendors' ? (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Vendor Name</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Contact</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Category</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>{vendors.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: 'var(--sp-4)' }}><div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{v.name}</div></td>
                <td style={{ padding: 'var(--sp-4)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85rem' }}>
                    {v.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}><Mail size={12} />{v.email}</span>}
                    {v.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}><Phone size={12} />{v.phone}</span>}
                  </div>
                </td>
                <td style={{ padding: 'var(--sp-4)' }}><span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-warning)' }}>{v.category}</span></td>
                <td style={{ padding: 'var(--sp-4)', textAlign: 'right' }}><button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto', borderColor: 'rgba(239,68,68,0.4)', color: 'var(--accent-danger)' }} onClick={() => handleDeleteVendor(v.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
          {vendors.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>No vendors added yet. Click "Add Vendor" to get started.</div>}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>PO ID</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Vendor</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Date</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Amount</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Status</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr></thead>
            <tbody>{purchaseOrders.map(po => (
              <tr key={po.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: 'var(--sp-4)', fontWeight: '500', color: 'var(--text-primary)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={16} color="var(--accent-warning)" />{po.id}</div></td>
                <td style={{ padding: 'var(--sp-4)', color: 'var(--text-primary)' }}>{po.vendor}</td>
                <td style={{ padding: 'var(--sp-4)', color: 'var(--text-secondary)' }}>{po.date}</td>
                <td style={{ padding: 'var(--sp-4)', fontWeight: '500', color: 'white' }}>Rs. {Number(po.amount).toLocaleString()}</td>
                <td style={{ padding: 'var(--sp-4)' }}><span style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: '500', background: getStatusColor(po.status).bg, color: getStatusColor(po.status).color }}>{po.status}</span></td>
                <td style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => generatePOPdf(po, 'preview')}>
                      <Eye size={14} /> Preview
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }} onClick={() => generatePOPdf(po, 'print')}>
                      <Printer size={14} /> Print
                    </button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
          {purchaseOrders.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>No purchase orders yet.</div>}
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
