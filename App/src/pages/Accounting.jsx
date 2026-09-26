import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  X, 
  Trash2, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  BarChart3, 
  BookOpen, 
  List,
  Scale
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadDatabase, saveDatabase } from '../utils/db';

const ACCOUNTS = {
  'Cash/Bank': 'Asset',
  'Accounts Receivable (A/R)': 'Asset',
  'Inventory': 'Asset',
  'Accounts Payable (A/P)': 'Liability',
  'Sales Revenue': 'Revenue',
  'Service Income': 'Revenue',
  'Purchases Cost': 'Expense',
  'Salaries Expense': 'Expense',
  'Office Rent': 'Expense',
  'Utilities': 'Expense',
  'Marketing': 'Expense',
  'Miscellaneous Expense': 'Expense'
};

export default function Accounting() {
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salarySlips, setSalarySlips] = useState([]);

  const [activeTab, setActiveTab] = useState('journal');
  const [showModal, setShowModal] = useState(false);
  const [newTxn, setNewTxn] = useState({
    description: '', amount: '', debitAccount: 'Cash/Bank', creditAccount: 'Sales Revenue', date: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    loadDatabase().then(data => {
      setTransactions(data.transactions || []);
      setInvoices(data.invoices || []);
      setPurchaseOrders(data.purchaseOrders || []);
      setSalarySlips(data.salarySlips || []);
    });
  }, []);

  const getJournalEntries = () => {
    const journal = [];
    transactions.forEach(t => {
      if (t.debitAccount && t.creditAccount) {
        journal.push({ id: `M-${t.id}`, date: t.date, description: t.description, debitAccount: t.debitAccount, creditAccount: t.creditAccount, amount: Number(t.amount || 0), isManual: true, originalId: t.id });
      } else {
        const isIncome = t.type === 'income';
        journal.push({ id: `L-${t.id}`, date: t.date, description: t.description, debitAccount: isIncome ? 'Cash/Bank' : 'Miscellaneous Expense', creditAccount: isIncome ? 'Sales Revenue' : 'Cash/Bank', amount: Number(t.amount || 0), isManual: true, originalId: t.id });
      }
    });
    invoices.forEach(inv => {
      journal.push({ id: inv.id, date: inv.date, description: `Inv ${inv.id} - ${inv.client}`, debitAccount: inv.status === 'Paid' ? 'Cash/Bank' : 'Accounts Receivable (A/R)', creditAccount: 'Sales Revenue', amount: Number(inv.amount || 0), isManual: false });
    });
    purchaseOrders.forEach(po => {
      journal.push({ id: po.id, date: po.date, description: `PO ${po.id} - ${po.vendor}`, debitAccount: 'Purchases Cost', creditAccount: po.status === 'Paid' ? 'Cash/Bank' : 'Accounts Payable (A/P)', amount: Number(po.amount || 0), isManual: false });
    });
    salarySlips.forEach(slip => {
      journal.push({ id: `SAL-${slip.id}`, date: slip.date || new Date().toLocaleDateString(), description: `Salary - ${slip.empName}`, debitAccount: 'Salaries Expense', creditAccount: 'Cash/Bank', amount: Number(slip.netSalary || 0), isManual: false });
    });
    return journal.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const allJournalEntries = getJournalEntries();
  const getAccountBalances = () => {
    const balances = {};
    Object.keys(ACCOUNTS).forEach(acc => { balances[acc] = { debit: 0, credit: 0, net: 0, type: ACCOUNTS[acc] }; });
    allJournalEntries.forEach(entry => {
      if (balances[entry.debitAccount]) balances[entry.debitAccount].debit += entry.amount;
      if (balances[entry.creditAccount]) balances[entry.creditAccount].credit += entry.amount;
    });
    Object.keys(balances).forEach(acc => {
      const type = balances[acc].type;
      if (type === 'Asset' || type === 'Expense') balances[acc].net = balances[acc].debit - balances[acc].credit;
      else balances[acc].net = balances[acc].credit - balances[acc].debit;
    });
    return balances;
  };

  const accountBalances = getAccountBalances();
  const handleSaveTxn = async () => {
    if (!newTxn.description || !newTxn.amount) return alert('Description and amount required.');
    const txn = { id: Date.now(), description: newTxn.description, amount: Number(newTxn.amount), debitAccount: newTxn.debitAccount, creditAccount: newTxn.creditAccount, date: newTxn.date };
    const updated = [txn, ...transactions];
    setTransactions(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, transactions: updated });
    setShowModal(false);
    setNewTxn({ description: '', amount: '', debitAccount: 'Cash/Bank', creditAccount: 'Sales Revenue', date: new Date().toISOString().slice(0, 10) });
  };

  const totalRevenue = Object.keys(accountBalances).filter(acc => accountBalances[acc].type === 'Revenue').reduce((sum, acc) => sum + accountBalances[acc].net, 0);
  const totalExpense = Object.keys(accountBalances).filter(acc => accountBalances[acc].type === 'Expense').reduce((sum, acc) => sum + accountBalances[acc].net, 0);
  const netProfit = totalRevenue - totalExpense;

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">Accounting</h1></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /><span className="desktop-only">Entry</span>
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)' }}>
        <div className="glass-panel" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Revenue</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>Rs.{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="glass-panel" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Expense</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>Rs.{totalExpense.toLocaleString()}</div>
        </div>
        <div className="glass-panel" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Net Profit</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: netProfit >= 0 ? 'var(--accent-success)' : 'red' }}>Rs.{netProfit.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-4)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {['journal', 'trial', 'profit-loss', 'balance-sheet'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: activeTab === tab ? 'rgba(59, 130, 246, 0.2)' : 'none', color: activeTab === tab ? 'white' : 'gray', fontSize: '0.8rem' }}>
            {tab === 'journal' ? 'Journal' : tab === 'trial' ? 'Trial' : tab === 'profit-loss' ? 'P&L' : 'Balance'}
          </button>
        ))}
      </div>

      {activeTab === 'journal' && (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid gray', fontSize: '0.8rem' }}><th style={{ padding: '10px' }}>Date</th><th style={{ padding: '10px' }}>Description</th><th style={{ padding: '10px' }}>Dr/Cr</th><th style={{ padding: '10px', textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {allJournalEntries.map((e, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '10px' }}>{e.date}</td>
                  <td style={{ padding: '10px' }}>{e.description}</td>
                  <td style={{ padding: '10px' }}><div style={{ color: 'var(--accent-primary)' }}>{e.debitAccount}</div><div style={{ color: 'var(--accent-warning)' }}>{e.creditAccount}</div></td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>Rs.{e.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(activeTab === 'profit-loss' || activeTab === 'balance-sheet') && (
        <div className="glass-panel" style={{ padding: '15px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>{activeTab === 'profit-loss' ? 'Profit & Loss' : 'Balance Sheet'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
             {/* Simple list view for statements on mobile */}
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Revenue</span><span>Rs.{totalRevenue.toLocaleString()}</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Expense</span><span>Rs.{totalExpense.toLocaleString()}</span></div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid gray', paddingTop: '5px' }}>
               <span>Net Result</span><span style={{ color: netProfit >= 0 ? 'var(--accent-success)' : 'red' }}>Rs.{netProfit.toLocaleString()}</span>
             </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '10px' }}>
          <div className="glass-panel" style={{ padding: '20px', width: '450px', maxWidth: '100%', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h2>New Entry</h2><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X/></button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="date" className="input-field" value={newTxn.date} onChange={e => setNewTxn({ ...newTxn, date: e.target.value })} />
              <input className="input-field" value={newTxn.description} onChange={e => setNewTxn({ ...newTxn, description: e.target.value })} placeholder="Description" />
              <select className="input-field" value={newTxn.debitAccount} onChange={e => setNewTxn({ ...newTxn, debitAccount: e.target.value })}>
                {Object.keys(ACCOUNTS).map(acc => <option key={acc} value={acc}>Dr: {acc}</option>)}
              </select>
              <select className="input-field" value={newTxn.creditAccount} onChange={e => setNewTxn({ ...newTxn, creditAccount: e.target.value })}>
                {Object.keys(ACCOUNTS).map(acc => <option key={acc} value={acc}>Cr: {acc}</option>)}
              </select>
              <input type="number" className="input-field" value={newTxn.amount} onChange={e => setNewTxn({ ...newTxn, amount: e.target.value })} placeholder="Amount" />
              <button className="btn btn-primary" onClick={handleSaveTxn}>Post Entry</button>
            </div>
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
