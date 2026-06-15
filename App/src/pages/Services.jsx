import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Edit, X, Archive, AlertTriangle, RefreshCw } from 'lucide-react';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Services() {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'services'
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  // Editing targets
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  // Form states
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Hardware', price: '', stock: 0, minStock: 5, unit: 'piece' });
  const [newService, setNewService] = useState({ name: '', category: 'Digital', price: '', description: '' });
  const [adjustment, setAdjustment] = useState({ type: 'add', qty: '', reason: 'Manual Adjustment' });

  useEffect(() => {
    loadDatabase().then(data => {
      setServices(data.services || []);
      setProducts(data.products || []);
    });
  }, []);

  // --- Products (Inventory) Logic ---
  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      return alert('Product Name and Price are required.');
    }

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? { ...p, ...newProduct, stock: Number(newProduct.stock), minStock: Number(newProduct.minStock) } : p);
    } else {
      const added = {
        id: `P-${String(products.length + 1).padStart(3, '0')}`,
        ...newProduct,
        stock: Number(newProduct.stock),
        minStock: Number(newProduct.minStock)
      };
      updatedProducts = [...products, added];
    }

    setProducts(updatedProducts);
    const db = await loadDatabase();
    await saveDatabase({ ...db, products: updatedProducts });

    setShowProductModal(false);
    setEditingProduct(null);
    setNewProduct({ name: '', category: 'Hardware', price: '', stock: 0, minStock: 5, unit: 'piece' });
  };

  const handleEditProduct = (prod) => {
    setEditingProduct(prod);
    setNewProduct({
      name: prod.name,
      category: prod.category || 'Hardware',
      price: prod.price,
      stock: prod.stock || 0,
      minStock: prod.minStock || 5,
      unit: prod.unit || 'piece'
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, products: updated });
  };

  const handleAdjustStockSubmit = async () => {
    if (!adjustment.qty || isNaN(adjustment.qty) || Number(adjustment.qty) <= 0) {
      return alert('Please enter a valid quantity.');
    }

    const qtyDiff = adjustment.type === 'add' ? Number(adjustment.qty) : -Number(adjustment.qty);
    const updatedProducts = products.map(p => {
      if (p.id === adjustingProduct.id) {
        const nextStock = Math.max(0, (p.stock || 0) + qtyDiff);
        return { ...p, stock: nextStock };
      }
      return p;
    });

    setProducts(updatedProducts);

    // Save with audit log if we track transactions or logs, but simple stock update is required
    const db = await loadDatabase();
    await saveDatabase({ ...db, products: updatedProducts });

    setShowAdjustmentModal(false);
    setAdjustingProduct(null);
    setAdjustment({ type: 'add', qty: '', reason: 'Manual Adjustment' });
  };

  // --- Services Logic ---
  const handleSaveService = async () => {
    if (!newService.name || !newService.price) {
      return alert('Service Name and Price are required.');
    }

    let updatedServices;
    if (editingService) {
      updatedServices = services.map(s => s.id === editingService.id ? { ...s, ...newService } : s);
    } else {
      const added = {
        id: `S-${String(services.length + 1).padStart(3, '0')}`,
        ...newService
      };
      updatedServices = [...services, added];
    }

    setServices(updatedServices);
    const db = await loadDatabase();
    await saveDatabase({ ...db, services: updatedServices });

    setShowServiceModal(false);
    setEditingService(null);
    setNewService({ name: '', category: 'Digital', price: '', description: '' });
  };

  const handleEditService = (serv) => {
    setEditingService(serv);
    setNewService({
      name: serv.name,
      category: serv.category || 'Digital',
      price: serv.price,
      description: serv.description || ''
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, services: updated });
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Inventory & Catalog</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage hardware stock inventory and digital services pricing catalog.</p>
        </div>
        <div>
          {activeTab === 'inventory' ? (
            <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setNewProduct({ name: '', category: 'Hardware', price: '', stock: 0, minStock: 5, unit: 'piece' }); setShowProductModal(true); }}>
              <Plus size={18} /> Add Product
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => { setEditingService(null); setNewService({ name: '', category: 'Digital', price: '', description: '' }); setShowServiceModal(true); }}>
              <Plus size={18} /> Create Service
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-6)' }}>
        <button 
          onClick={() => setActiveTab('inventory')} 
          style={{ 
            padding: '8px 20px', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--border-color)', 
            background: activeTab === 'inventory' ? 'rgba(59, 130, 246, 0.15)' : 'transparent', 
            color: activeTab === 'inventory' ? 'white' : 'var(--text-secondary)', 
            cursor: 'pointer', 
            fontWeight: activeTab === 'inventory' ? '600' : '400',
            transition: 'all 0.15s ease'
          }}
        >
          Hardware Inventory ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('services')} 
          style={{ 
            padding: '8px 20px', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--border-color)', 
            background: activeTab === 'services' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', 
            color: activeTab === 'services' ? 'white' : 'var(--text-secondary)', 
            cursor: 'pointer', 
            fontWeight: activeTab === 'services' ? '600' : '400',
            transition: 'all 0.15s ease'
          }}
        >
          Services Catalog ({services.length})
        </button>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '500px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="input-group"><label className="input-label">Product Name</label><input className="input-field" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. CCTV Dome Camera" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="input-group"><label className="input-label">Category</label>
                  <select className="input-field" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    <option value="Hardware">Hardware</option><option value="IT Infrastructure">IT Infrastructure</option><option value="Consumables">Consumables</option><option value="Other">Other</option>
                  </select>
                </div>
                <div className="input-group"><label className="input-label">Unit of Measure</label><input className="input-field" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} placeholder="e.g. piece, meter" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="input-group"><label className="input-label">Stock Level</label><input type="number" className="input-field" disabled={!!editingProduct} value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} /></div>
                <div className="input-group"><label className="input-label">Min Stock Level</label><input type="number" className="input-field" value={newProduct.minStock} onChange={e => setNewProduct({...newProduct, minStock: e.target.value})} /></div>
              </div>
              <div className="input-group"><label className="input-label">Base Cost / Unit Price (Rs.)</label><input type="number" className="input-field" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="5500" /></div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-6)' }} onClick={handleSave}>{editingProduct ? 'Update Product' : 'Add Product'}</button>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '500px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>{editingService ? 'Edit Service Offer' : 'Create Service Offer'}</h2>
              <button onClick={() => setShowServiceModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="input-group"><label className="input-label">Service Name</label><input className="input-field" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} placeholder="e.g. Meta Lead Generation Campaign" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="input-group"><label className="input-label">Category</label>
                  <select className="input-field" value={newService.category} onChange={e => setNewService({...newService, category: e.target.value})} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    <option value="Digital">Digital / Creative</option><option value="Infrastructure">IT Services</option><option value="Consulting">Consulting</option>
                  </select>
                </div>
                <div className="input-group"><label className="input-label">Base Rate / Price (Rs.)</label><input type="number" className="input-field" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} placeholder="45000" /></div>
              </div>
              <div className="input-group"><label className="input-label">Service Description</label><textarea className="input-field" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} placeholder="Brief scope description..." rows="3" style={{ resize: 'none' }} /></div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-6)' }} onClick={handleSaveService}>{editingService ? 'Update Service' : 'Add Service'}</button>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '400px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>Adjust Stock</h2>
              <button onClick={() => setShowAdjustmentModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--sp-4)' }}>Product: <strong style={{ color: 'white' }}>{adjustingProduct?.name}</strong></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="input-group"><label className="input-label">Adjustment Type</label>
                <select className="input-field" value={adjustment.type} onChange={e => setAdjustment({...adjustment, type: e.target.value})} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  <option value="add">Add Stock (+)</option><option value="sub">Deduct Stock (-)</option>
                </select>
              </div>
              <div className="input-group"><label className="input-label">Quantity</label><input type="number" min="1" className="input-field" value={adjustment.qty} onChange={e => setAdjustment({...adjustment, qty: e.target.value})} placeholder="10" /></div>
              <div className="input-group"><label className="input-label">Reason / Reference</label><input className="input-field" value={adjustment.reason} onChange={e => setAdjustment({...adjustment, reason: e.target.value})} /></div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-6)' }} onClick={handleAdjustStockSubmit}>Process Adjustment</button>
          </div>
        </div>
      )}

      {/* Main Lists */}
      {activeTab === 'inventory' ? (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px var(--sp-4)' }}>Item ID</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Product Name</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Category</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Stock Status</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Base Price</th>
                <th style={{ padding: '12px var(--sp-4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isLow = (p.stock || 0) <= (p.minStock || 0);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: 'var(--sp-4)', fontWeight: '500' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Archive size={16} color="var(--accent-warning)" />
                        {p.id}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--sp-4)' }}>
                      <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{p.name}</div>
                    </td>
                    <td style={{ padding: 'var(--sp-4)' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-warning)' }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--sp-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '600', color: isLow ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                          {p.stock || 0} {p.unit || 'piece'}
                        </span>
                        {isLow && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '2px 6px', background: 'rgba(239,68,68,0.15)', color: 'var(--accent-danger)', fontSize: '0.7rem', borderRadius: '4px' }}>
                            <AlertTriangle size={10} /> Low Stock (Min: {p.minStock})
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--sp-4)', fontWeight: '500' }}>Rs. {Number(p.price).toLocaleString()}</td>
                    <td style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto' }} title="Adjust Stock" onClick={() => { setAdjustingProduct(p); setShowAdjustmentModal(true); }}>
                          <RefreshCw size={14} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto' }} onClick={() => handleEditProduct(p)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--accent-danger)' }} onClick={() => handleDeleteProduct(p.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>No products in stock inventory.</div>}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px var(--sp-4)' }}>Item ID</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Service Name</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Category</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Base Price</th>
                <th style={{ padding: '12px var(--sp-4)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: 'var(--sp-4)', fontWeight: '500' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag size={16} color="var(--accent-primary)" />
                      {s.id}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--sp-4)' }}>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{s.name}</div>
                    {s.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{s.description}</div>}
                  </td>
                  <td style={{ padding: 'var(--sp-4)' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)' }}>
                      {s.category}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--sp-4)', fontWeight: '500' }}>Rs. {Number(s.price).toLocaleString()}</td>
                  <td style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto' }} onClick={() => handleEditService(s)}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--accent-danger)' }} onClick={() => handleDeleteService(s.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {services.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>No services listed in catalog.</div>}
        </div>
      )}
    </div>
  );
}
