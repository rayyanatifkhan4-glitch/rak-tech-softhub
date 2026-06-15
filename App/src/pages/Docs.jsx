import React, { useState, useEffect } from 'react';
import { Book, Folder, File, Plus, X, Download, Eye, Printer, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Docs() {
  const [documents, setDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // New Doc Form
  const [docName, setDocName] = useState('');
  const [docFolder, setDocFolder] = useState('Client Requirements');

  // Preview States
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [previewFileName, setPreviewFileName] = useState('');

  // Folders list
  const folders = [
    { name: 'Client Requirements', color: 'var(--accent-warning)' },
    { name: 'Technical Specs', color: 'var(--accent-primary)' },
    { name: 'Meeting Notes', color: 'var(--accent-purple)' },
  ];

  useEffect(() => {
    loadDatabase().then(data => {
      if (data.documents && data.documents.length > 0) {
        setDocuments(data.documents);
      } else {
        // Default seed documents
        const defaultDocs = [
          { id: 1, name: 'Acme Corp API Setup.pdf', folder: 'Client Requirements', date: '6/11/2026', size: '25 KB' },
          { id: 2, name: 'RAKTech Technical Agreement.pdf', folder: 'Technical Specs', date: '6/11/2026', size: '32 KB' },
          { id: 3, name: 'Q3 Financial Report.pdf', folder: 'Meeting Notes', date: '6/11/2026', size: '18 KB' },
        ];
        setDocuments(defaultDocs);
        saveDatabase({ ...data, documents: defaultDocs });
      }
    });
  }, []);

  // Generate a mock PDF dynamically based on the document name for previewing/printing
  const generateMockPDF = (docItem) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('RAK Tech Soft Hub', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 26);
    doc.text(`Folder: ${docItem.folder} | Date Created: ${docItem.date}`, 14, 31);
    
    // Divider
    doc.setDrawColor(220);
    doc.line(14, 35, 195, 35);
    
    doc.setFontSize(16);
    doc.setTextColor(50);
    doc.text(docItem.name.replace('.pdf', ''), 14, 48);
    
    doc.setFontSize(11);
    doc.setTextColor(80);
    
    // Dynamic text depending on document type
    if (docItem.name.includes('API')) {
      doc.text('1. API Authentication & Token Setup:', 14, 60);
      doc.setFontSize(10);
      doc.text('Integrate client systems with RAKTech LAN DB server using secure REST tokens.', 14, 66);
      doc.text('Tokens should be generated in the Admin Settings panel under the developer keys section.', 14, 72);
      
      doc.setFontSize(11);
      doc.text('2. Endpoint Reference Parameters:', 14, 82);
      doc.setFontSize(10);
      doc.text('Database sync runs over HTTP method POST and GET via /api/db on port 3010.', 14, 88);
      doc.text('Workstations can sync invoice amounts, leads, and payroll structures locally.', 14, 94);
    } else if (docItem.name.includes('Agreement')) {
      doc.text('TERMS & CONDITIONS OF SERVICE AGREEMENT', 14, 60);
      doc.setFontSize(10);
      doc.text('This agreement outlines services details between RAK Tech Soft Hub and its active clients.', 14, 66);
      doc.text('Payment terms: Net 30 days upon invoice receipt.', 14, 72);
      
      doc.text('Intellectual property: All custom developed software and source codes belong to client.', 14, 82);
      doc.text('Service guarantees: 99.9% uptime for localized databases network syncing modules.', 14, 88);
    } else {
      doc.text('FINANCIAL REPORT STATEMENT SUMMARY', 14, 60);
      doc.setFontSize(10);
      doc.text('Total Revenue: Calculated based on paid invoices in PKR.', 14, 66);
      doc.text('Total Expenses: Sum of vendor payouts and employee salary distributions.', 14, 72);
      doc.text('Retained Earnings: Net profits are forwarded to Balance Sheet reserves.', 14, 78);
    }
    
    // Signatures placeholders
    const finalY = 150;
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('_______________________', 14, finalY);
    doc.text('Authorized Signature', 14, finalY + 6);
    doc.text('_______________________', 130, finalY);
    doc.text('Client Signature', 130, finalY + 6);
    
    return doc;
  };

  const handleViewDoc = (docItem) => {
    const doc = generateMockPDF(docItem);
    const blobUrl = doc.output('bloburl');
    setPdfPreviewUrl(blobUrl);
    setPreviewFileName(docItem.name);
    setShowPreviewModal(true);
  };

  const handlePrintDoc = (docItem) => {
    const doc = generateMockPDF(docItem);
    const blobUrl = doc.output('bloburl');
    
    // Create hidden iframe and print directly
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
  };

  const handleUploadDoc = async () => {
    if (!docName) return alert('Please enter a document name.');
    
    const cleanName = docName.endsWith('.pdf') ? docName : `${docName}.pdf`;
    
    const newDocItem = {
      id: Date.now(),
      name: cleanName,
      folder: docFolder,
      date: new Date().toLocaleDateString(),
      size: `${Math.floor(Math.random() * 80) + 10} KB`
    };

    const updatedDocs = [newDocItem, ...documents];
    setDocuments(updatedDocs);

    const db = await loadDatabase();
    await saveDatabase({ ...db, documents: updatedDocs });

    setShowUploadModal(false);
    setDocName('');
  };

  const handleDeleteDoc = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    const updatedDocs = documents.filter(d => d.id !== id);
    setDocuments(updatedDocs);

    const db = await loadDatabase();
    await saveDatabase({ ...db, documents: updatedDocs });
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Documentation</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Store, view, and print important agency files.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} />
          Upload Document
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--sp-6)' }}>
        
        {/* Folders */}
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', alignSelf: 'start' }}>
          <h3 style={{ marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Folder size={20} color="var(--accent-warning)" />
            Folders
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {folders.map((folder, idx) => (
              <li key={idx}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--sp-3)', 
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Folder size={16} color={folder.color} />
                    {folder.name}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                    {documents.filter(d => d.folder === folder.name).length}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Files */}
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <h3 style={{ marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Book size={20} color="var(--accent-primary)" />
            Recent Documents
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {documents.map(doc => (
              <div key={doc.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 'var(--sp-4)',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                transition: 'border-color var(--transition-fast)'
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-highlight)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)' }}>
                    <File size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)' }}>{doc.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Folder: {doc.folder} | {doc.size}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto' }} title="View Document" onClick={() => handleViewDoc(doc)}>
                    <Eye size={14} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto', color: 'var(--accent-success)', borderColor: 'rgba(16,185,129,0.3)' }} title="Print Document" onClick={() => handlePrintDoc(doc)}>
                    <Printer size={14} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto', color: 'var(--accent-danger)', borderColor: 'rgba(239,68,68,0.3)' }} title="Delete Document" onClick={() => handleDeleteDoc(doc.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '450px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="input-group">
                <label className="input-label">Document Name</label>
                <input className="input-field" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Acme API Specifications" />
              </div>
              <div className="input-group">
                <label className="input-label">Select Folder</label>
                <select className="input-field" value={docFolder} onChange={e => setDocFolder(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  {folders.map((f, idx) => <option key={idx} value={f.name}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-6)' }} onClick={handleUploadDoc}>Save Document</button>
          </div>
        </div>
      )}

      {/* PDF Preview & Print Modal */}
      {showPreviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '850px', maxWidth: '100%', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Document Preview — {previewFileName}</h2>
              <button onClick={() => { setShowPreviewModal(false); setPdfPreviewUrl(null); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <iframe 
              src={pdfPreviewUrl} 
              title="PDF Preview"
              style={{ width: '100%', height: '60vh', border: 'none', background: 'white', borderRadius: 'var(--radius-sm)' }} 
            />

            <div style={{ display: 'flex', gap: 'var(--sp-4)', justifyContent: 'flex-end', marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
              <button className="btn btn-outline" onClick={() => {
                const link = document.createElement('a');
                link.href = pdfPreviewUrl;
                link.download = previewFileName;
                link.click();
              }}>
                Download PDF
              </button>
              <button className="btn btn-outline" style={{ color: 'var(--accent-success)', borderColor: 'rgba(16,185,129,0.4)' }} onClick={() => {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = pdfPreviewUrl;
                document.body.appendChild(iframe);
                iframe.onload = () => {
                  iframe.contentWindow.focus();
                  iframe.contentWindow.print();
                };
              }}>
                Print Document
              </button>
              <button className="btn btn-primary" onClick={() => {
                setShowPreviewModal(false);
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
