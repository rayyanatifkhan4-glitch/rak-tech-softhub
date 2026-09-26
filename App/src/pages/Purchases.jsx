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

  const handleSaveVendor = async () => {
    if (!newVendor.name) return alert('Name required');
    const vendor = { ...newVendor, id: Date.now() };
    const updated = [vendor, ...vendors];
    setVendors(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, vendors: updated });
    setShowVendorModal(false);
  };

  const handleAddPOItem = () => {
    if (!poItemName || !poItemRate) return alert('Required fields');
    setPOItems([...poItems, { id: Date.now(), name: poItemName, qty: Number(poItemQty), rate: Number(poItemRate), total: Number(poItemQty) * Number(poItemRate) }]);
    setPOItemName(''); setPOItemQty(1); setPOItemRate('');
  };

  const handleSavePO = async () => {
    if (!poVendorName || poItems.length === 0) return alert('Vendor and Items required');
    const grandTotal = poItems.reduce((s, i) => s + i.total, 0);
    const po = { id: `PO-${Date.now()}`, vendor: poVendorName, date: new Date().toLocaleDateString(), status: poStatus, amount: String(grandTotal), items: poItems };
    const updatedPOs = [po, ...purchaseOrders];
    setPurchaseOrders(updatedPOs);
    const db = await loadDatabase();
    await saveDatabase({ ...db, purchaseOrders: updatedPOs });
    setShowPOModal(false);
  };

  const handleVendorSelect = (vendorId) => {
    setPOVendorId(vendorId);
    if (vendorId === 'custom') setPOVendorName('');
    else { const v = vendors.find(x => String(x.id) === String(vendorId)); if (v) setPOVendorName(v.name); }
  };

  // FIX: handleDeleteVendor was referenced on line 92 but never defined
  const handleDeleteVendor = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    const updated = vendors.filter(v => v.id !== id);
    setVendors(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, vendors: updated });
  };


  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');

  const handleRemovePOItem = (id) => {
    setPOItems(poItems.filter(item => item.id !== id));
  };

  const generatePOPDF = (po, action = 'preview') => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('RAK Tech Soft Hub', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 26);
    doc.text('Phone: +92 309 2003125 | Email: raktechsofthub@gmail.com', 14, 31);
    doc.setFontSize(16);
    doc.setTextColor(50);
    doc.text('PURCHASE ORDER (PO)', 14, 45);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`PO Number: ${po.id}`, 14, 52);
    doc.text(`Date: ${po.date}`, 14, 57);
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text('Vendor Information:', 14, 70);
    doc.setFontSize(13);
    doc.text(po.vendor, 14, 76);
    doc.setFontSize(10);
    
    const lineItems = po.items || [];
    const tableBody = lineItems.map((item, index) => [
      index + 1, item.name, item.qty, `Rs. ${Number(item.rate).toLocaleString()}`, `Rs. ${Number(item.total).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      startY: 85,
      head: [['#', 'Item / Equipment', 'Qty', 'Unit Rate', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255] }
    });
    
    const finalY = doc.lastAutoTable.finalY || 100;
    doc.setFontSize(12);
    doc.text(`Total PO Amount:`, 110, finalY + 15);
    doc.setFontSize(14);
    doc.text(`Rs. ${Number(po.amount).toLocaleString()}`, 160, finalY + 15, { align: 'right' });
    doc.text('_______________________', 14, finalY + 45);
    doc.text('Prepared By', 14, finalY + 51);
    doc.text('_______________________', 130, finalY + 45);
    doc.text('Vendor Approval Signature', 130, finalY + 51);

    const blobUrl = doc.output('bloburl');
    if (action === 'print') {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = blobUrl;
      iframe.onload = () => { iframe.contentWindow.print(); };
    } else {
      setPdfPreviewUrl(blobUrl);
      setPreviewFileName(`${po.id}.pdf`);
      setShowPreview(true);
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">Purchases & POs</h1></div>
        <button className="btn btn-primary" onClick={() => activeTab === 'vendors' ? setShowVendorModal(true) : setShowPOModal(true)}>
          <Plus size={18} />
          <span>{activeTab === 'vendors' ? 'Add Vendor' : 'Create PO'}</span>
        </button>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--sp-4)', overflowX: 'auto' }}>
        {['vendors', 'orders'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: activeTab === t ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.03)', color: activeTab === t ? '#60a5fa' : '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
            {t === 'vendors' ? 'Vendors Directory' : 'Purchase Orders'}
          </button>
        ))}
      </div>

      {activeTab === 'vendors' ? (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: '#94a3b8' }}><th style={{ padding: '12px 15px' }}>Vendor</th><th style={{ padding: '12px 15px' }}>Category</th><th style={{ padding: '12px 15px', textAlign: 'right' }}>Action</th></tr></thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 15px' }}><div style={{ fontWeight: '600', color: '#f8fafc' }}>{v.name}</div><div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{v.phone || 'No phone'}</div></td>
                  <td style={{ padding: '12px 15px', fontSize: '0.88rem' }}>{v.category || 'General'}</td>
                  <td style={{ padding: '12px 15px', textAlign: 'right' }}><button onClick={() => handleDeleteVendor(v.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '5px', color: '#f87171' }}><Trash2 size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: '#94a3b8' }}>
                <th style={{ padding: '12px 15px' }}>PO ID / Vendor</th>
                <th style={{ padding: '12px 15px' }}>Date</th>
                <th style={{ padding: '12px 15px' }}>Total Amount</th>
                <th style={{ padding: '12px 15px' }}>Status</th>
                <th style={{ padding: '12px 15px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map(po => (
                <tr key={po.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 15px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.88rem', color: '#f8fafc' }}>{po.id}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{po.vendor}</div>
                  </td>
                  <td style={{ padding: '12px 15px', fontSize: '0.85rem' }}>{po.date}</td>
                  <td style={{ padding: '12px 15px', fontWeight: '600', color: '#a78bfa' }}>Rs. {Number(po.amount).toLocaleString()}</td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontWeight: 600 }}>
                      {po.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline" style={{ padding: '5px' }} onClick={() => generatePOPDF(po, 'preview')} title="Preview PO"><Eye size={16}/></button>
                      <button className="btn btn-outline" style={{ padding: '5px' }} onClick={() => generatePOPDF(po, 'print')} title="Print PO"><Printer size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Vendor Modal */}
      {showVendorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ padding: '24px', width: '450px', maxWidth: '100%', background: 'var(--surface-elevated, #1e293b)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Add New Vendor</h2>
              <button onClick={() => setShowVendorModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Vendor / Supplier Name *</label>
                <input className="input-field" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} placeholder="e.g. Computer City Pakistan" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Contact Phone</label>
                <input className="input-field" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} placeholder="+92 300 0000000" />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Category</label>
                <input className="input-field" value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})} placeholder="e.g. IT Supplies / Hardware" />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={handleSaveVendor}>Save Vendor</button>
            </div>
          </div>
        </div>
      )}

      {/* New Purchase Order (PO) Modal */}
      {showPOModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '850px', maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', background: 'var(--surface-elevated, #1e293b)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* PO Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.5)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                  <Truck size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#f8fafc', fontWeight: 600 }}>Create Purchase Order (PO)</h2>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Create purchase order for vendor equipment & supplies</p>
                </div>
              </div>
              <button onClick={() => setShowPOModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
            </div>

            {/* PO Modal Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Section 1: Vendor Details */}
              <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#a78bfa', fontSize: '0.88rem', fontWeight: 600 }}>
                  <Truck size={16} /> Section 1: Vendor & Order Information
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Select Vendor</label>
                    <select className="input-field" value={poVendorId} onChange={e => handleVendorSelect(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)' }}>
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      <option value="custom">+ Custom Vendor</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Vendor Name *</label>
                    <input className="input-field" value={poVendorName} onChange={e => setPOVendorName(e.target.value)} placeholder="e.g. Computer City" />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">PO Status</label>
                    <select className="input-field" value={poStatus} onChange={e => setPOStatus(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)' }}>
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Received">Received</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Add Items */}
              <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#60a5fa', fontSize: '0.88rem', fontWeight: 600 }}>
                  <Plus size={16} /> Section 2: Add Products / Equipment Items
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr auto', gap: '10px', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Item / Hardware Description *</label>
                    <input className="input-field" value={poItemName} onChange={e => setPOItemName(e.target.value)} placeholder="e.g. 2MP CCTV Camera or Cat6 Cable" />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Qty *</label>
                    <input type="number" min="1" className="input-field" value={poItemQty} onChange={e => setPOItemQty(e.target.value)} placeholder="1" />
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Unit Rate (Rs.) *</label>
                    <input type="number" min="0" className="input-field" value={poItemRate} onChange={e => setPOItemRate(e.target.value)} placeholder="e.g. 4500" />
                  </div>

                  <button className="btn btn-primary" style={{ height: '40px', padding: '0 16px', whiteSpace: 'nowrap' }} onClick={handleAddPOItem}>
                    <Plus size={16} /> Add Item
                  </button>
                </div>
              </div>

              {/* Section 3: PO Items Table */}
              <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Section 3: Order Line Items ({poItems.length})</span>
                  {poItems.length > 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>
                      Subtotal: Rs. {poItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                    </span>
                  )}
                </div>

                {poItems.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                    No items added yet. Type item details above and click <strong style={{ color: '#94a3b8' }}>"Add Item"</strong>.
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
                        {poItems.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px', fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 500 }}>{item.name}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '0.88rem' }}>{item.qty}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.88rem' }}>{Number(item.rate).toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 600, color: '#a78bfa' }}>{Number(item.total).toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                              <button onClick={() => handleRemovePOItem(item.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '5px', color: '#f87171', cursor: 'pointer' }} title="Remove Item">
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
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grand PO Total</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a78bfa' }}>
                  Rs. {poItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-outline" onClick={() => setShowPOModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSavePO} style={{ padding: '8px 20px', fontSize: '0.95rem' }}>
                  Save Purchase Order
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PDF Preview Modal for POs */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '850px', maxWidth: '100%', height: '85vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-elevated, #1e293b)', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Purchase Order Preview — {previewFileName}</h2>
              <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
            </div>
            <iframe src={pdfPreviewUrl} title="PO Preview" style={{ width: '100%', flex: 1, border: 'none', background: 'white' }} />
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline" onClick={() => setShowPreview(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .page-title { font-size: 1.2rem; }
        }
      `}</style>
    </div>
  );
}
