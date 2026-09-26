import React, { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Edit, X, Archive, AlertTriangle, RefreshCw } from 'lucide-react';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Services() {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({ name: '', category: 'Hardware', price: '', stock: 0, minStock: 5, unit: 'pc' });
  const [newService, setNewService] = useState({ name: '', category: 'Digital', price: '', description: '' });
  const [adjustment, setAdjustment] = useState({ type: 'add', qty: '', reason: 'Manual' });

  useEffect(() => {
    loadDatabase().then(data => {
      setServices(data.services || []);
      setProducts(data.products || []);
    });
  }, []);

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) return alert('Name & Price required');
    let updated = editingProduct ? products.map(p => p.id === editingProduct.id ? { ...p, ...newProduct } : p) : [...products, { id: `P-${Date.now()}`, ...newProduct }];
    setProducts(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, products: updated });
    setShowProductModal(false);
  };

  const handleSaveService = async () => {
    if (!newService.name || !newService.price) return alert('Name & Price required');
    let updated = editingService ? services.map(s => s.id === editingService.id ? { ...s, ...newService } : s) : [...services, { id: `S-${Date.now()}`, ...newService }];
    setServices(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, services: updated });
    setShowServiceModal(false);
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">Inventory</h1></div>
        <button className="btn btn-primary" onClick={() => activeTab === 'inventory' ? setShowProductModal(true) : setShowServiceModal(true)}>
          <Plus size={18} />
        </button>
      </header>

      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-4)', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('inventory')} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: activeTab === 'inventory' ? 'rgba(59,130,246,0.2)' : 'none', color: activeTab === 'inventory' ? 'white' : 'gray', fontSize: '0.85rem' }}>Hardware</button>
        <button onClick={() => setActiveTab('services')} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: activeTab === 'services' ? 'rgba(59,130,246,0.2)' : 'none', color: activeTab === 'services' ? 'white' : 'gray', fontSize: '0.85rem' }}>Services</button>
      </div>

      {activeTab === 'inventory' ? (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid gray', fontSize: '0.85rem' }}><th style={{ padding: '10px' }}>Product</th><th style={{ padding: '10px' }}>Stock</th><th style={{ padding: '10px', textAlign: 'right' }}>Price</th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}><div style={{ fontWeight: '600' }}>{p.name}</div><div style={{ fontSize: '0.75rem', color: 'gray' }}>{p.category}</div></td>
                  <td style={{ padding: '10px' }}><span style={{ color: p.stock <= p.minStock ? 'red' : 'var(--accent-success)' }}>{p.stock} {p.unit}</span></td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>Rs.{p.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid gray', fontSize: '0.85rem' }}><th style={{ padding: '10px' }}>Service</th><th style={{ padding: '10px' }}>Category</th><th style={{ padding: '10px', textAlign: 'right' }}>Price</th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}><div style={{ fontWeight: '600' }}>{s.name}</div></td>
                  <td style={{ padding: '10px' }}>{s.category}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>Rs.{s.price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', width: '400px', maxWidth: '100%', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h2>New Product</h2><button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X/></button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input className="input-field" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Name" />
              <input type="number" className="input-field" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} placeholder="Stock" />
              <input type="number" className="input-field" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="Price" />
              <button className="btn btn-primary" onClick={handleSaveProduct}>Save</button>
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
