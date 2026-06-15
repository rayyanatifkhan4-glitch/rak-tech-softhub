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
  // Assets
  'Cash/Bank': 'Asset',
  'Accounts Receivable (A/R)': 'Asset',
  'Inventory': 'Asset',
  // Liabilities
  'Accounts Payable (A/P)': 'Liability',
  // Revenue
  'Sales Revenue': 'Revenue',
  'Service Income': 'Revenue',
  // Expenses
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

  const [activeTab, setActiveTab] = useState('journal'); // 'journal', 'trial', 'profit-loss', 'balance-sheet'
  const [showModal, setShowModal] = useState(false);
  const [newTxn, setNewTxn] = useState({
    description: '',
    amount: '',
    debitAccount: 'Cash/Bank',
    creditAccount: 'Sales Revenue',
    date: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    loadDatabase().then(data => {
      setTransactions(data.transactions || []);
      setInvoices(data.invoices || []);
      setPurchaseOrders(data.purchaseOrders || []);
      setSalarySlips(data.salarySlips || []);
    });
  }, []);

  // --- Double-Entry Journal Builder ---
  // We generate the complete double entry book dynamically based on:
  // 1. Manual Journal Entries (from transactions collection)
  // 2. Invoices (Unpaid = Dr A/R Cr Sales; Paid = Dr Cash Cr Sales)
  // 3. Purchase Orders (Unpaid = Dr Purchases Cr A/P; Paid = Dr Purchases Cr Cash)
  // 4. Salaries processed (Dr Salaries Cr Cash)
  const getJournalEntries = () => {
    const journal = [];

    // 1. Manual entries
    transactions.forEach(t => {
      if (t.debitAccount && t.creditAccount) {
        // Double entry format
        journal.push({
          id: `M-${t.id}`,
          date: t.date,
          description: t.description,
          debitAccount: t.debitAccount,
          creditAccount: t.creditAccount,
          amount: Number(t.amount || 0),
          isManual: true,
          originalId: t.id
        });
      } else {
        // Legacy single entry format compatibility
        const isIncome = t.type === 'income';
        journal.push({
          id: `L-${t.id}`,
          date: t.date,
          description: t.description,
          debitAccount: isIncome ? 'Cash/Bank' : (t.category === 'Rent' ? 'Office Rent' : t.category === 'Utilities' ? 'Utilities' : t.category === 'Salaries' ? 'Salaries Expense' : t.category === 'Marketing' ? 'Marketing' : 'Miscellaneous Expense'),
          creditAccount: isIncome ? 'Sales Revenue' : 'Cash/Bank',
          amount: Number(t.amount || 0),
          isManual: true,
          originalId: t.id
        });
      }
    });

    // 2. Invoices (Sales)
    invoices.forEach(inv => {
      // If paid, goes to Cash/Bank. If pending, goes to Accounts Receivable.
      const debitAcc = inv.status === 'Paid' ? 'Cash/Bank' : 'Accounts Receivable (A/R)';
      journal.push({
        id: inv.id,
        date: inv.date,
        description: `Invoice ${inv.id} — Client: ${inv.client}`,
        debitAccount: debitAcc,
        creditAccount: 'Sales Revenue',
        amount: Number(inv.amount || 0),
        isManual: false
      });
    });

    // 3. Purchase Orders (Purchases)
    purchaseOrders.forEach(po => {
      const creditAcc = po.status === 'Paid' ? 'Cash/Bank' : 'Accounts Payable (A/P)';
      journal.push({
        id: po.id,
        date: po.date,
        description: `Purchase Order ${po.id} — Vendor: ${po.vendor}`,
        debitAccount: 'Purchases Cost',
        creditAccount: creditAcc,
        amount: Number(po.amount || 0),
        isManual: false
      });
    });

    // 4. Salary slips (Salaries)
    salarySlips.forEach(slip => {
      journal.push({
        id: `SAL-${slip.id}`,
        date: slip.date || new Date().toLocaleDateString(),
        description: `Salary processed — ${slip.empName} (${slip.monthName})`,
        debitAccount: 'Salaries Expense',
        creditAccount: 'Cash/Bank',
        amount: Number(slip.netSalary || 0),
        isManual: false
      });
    });

    // Sort by date descending
    return journal.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const allJournalEntries = getJournalEntries();

  // --- Account balances calculation ---
  const getAccountBalances = () => {
    const balances = {};
    Object.keys(ACCOUNTS).forEach(acc => {
      balances[acc] = { debit: 0, credit: 0, net: 0, type: ACCOUNTS[acc] };
    });

    allJournalEntries.forEach(entry => {
      const amt = entry.amount;
      if (balances[entry.debitAccount]) {
        balances[entry.debitAccount].debit += amt;
      }
      if (balances[entry.creditAccount]) {
        balances[entry.creditAccount].credit += amt;
      }
    });

    // Calculate net balances based on account type
    // Asset/Expense normal balance is Debit (Debit - Credit)
    // Liability/Revenue normal balance is Credit (Credit - Debit)
    Object.keys(balances).forEach(acc => {
      const type = balances[acc].type;
      if (type === 'Asset' || type === 'Expense') {
        balances[acc].net = balances[acc].debit - balances[acc].credit;
      } else {
        balances[acc].net = balances[acc].credit - balances[acc].debit;
      }
    });

    return balances;
  };

  const accountBalances = getAccountBalances();

  // Save Transaction
  const handleSaveTxn = async () => {
    if (!newTxn.description || !newTxn.amount) return alert('Description and amount are required.');
    if (newTxn.debitAccount === newTxn.creditAccount) {
      return alert('Debit and Credit accounts must be different.');
    }

    const txn = {
      id: Date.now(),
      description: newTxn.description,
      amount: Number(newTxn.amount),
      debitAccount: newTxn.debitAccount,
      creditAccount: newTxn.creditAccount,
      date: newTxn.date
    };

    const updated = [txn, ...transactions];
    setTransactions(updated);

    const db = await loadDatabase();
    await saveDatabase({ ...db, transactions: updated });

    setShowModal(false);
    setNewTxn({
      description: '',
      amount: '',
      debitAccount: 'Cash/Bank',
      creditAccount: 'Sales Revenue',
      date: new Date().toISOString().slice(0, 10)
    });
  };

  const handleDeleteTxn = async (originalId) => {
    if (!confirm('Are you sure you want to delete this transaction entry?')) return;
    const updated = transactions.filter(t => t.id !== originalId);
    setTransactions(updated);

    const db = await loadDatabase();
    await saveDatabase({ ...db, transactions: updated });
  };

  // Financial Calculations
  const totalDebitTrial = Object.values(accountBalances).reduce((sum, b) => sum + b.debit, 0);
  const totalCreditTrial = Object.values(accountBalances).reduce((sum, b) => sum + b.credit, 0);

  // Profit and Loss calculations
  const revenueAccounts = Object.keys(accountBalances).filter(acc => accountBalances[acc].type === 'Revenue');
  const expenseAccounts = Object.keys(accountBalances).filter(acc => accountBalances[acc].type === 'Expense');

  const totalRevenue = revenueAccounts.reduce((sum, acc) => sum + accountBalances[acc].net, 0);
  const totalExpense = expenseAccounts.reduce((sum, acc) => sum + accountBalances[acc].net, 0);
  const netProfit = totalRevenue - totalExpense;

  // PDF Reports
  const generateTrialBalancePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(59, 130, 246);
    doc.text('RAK Tech Soft Hub', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 26);
    
    doc.setFontSize(15); doc.setTextColor(50);
    doc.text('TRIAL BALANCE STATEMENT', 14, 40);
    doc.setFontSize(9); doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 46);

    const body = Object.keys(accountBalances).map(acc => [
      acc,
      accountBalances[acc].type,
      accountBalances[acc].debit > 0 ? `Rs. ${accountBalances[acc].debit.toLocaleString()}` : '-',
      accountBalances[acc].credit > 0 ? `Rs. ${accountBalances[acc].credit.toLocaleString()}` : '-'
    ]);

    body.push([
      'TOTAL',
      '',
      `Rs. ${totalDebitTrial.toLocaleString()}`,
      `Rs. ${totalCreditTrial.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Account Name', 'Type', 'Debit (Dr)', 'Credit (Cr)']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save('Trial_Balance.pdf');
  };

  const generateProfitLossPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(16, 185, 129);
    doc.text('RAK Tech Soft Hub', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 26);
    
    doc.setFontSize(15); doc.setTextColor(50);
    doc.text('PROFIT & LOSS STATEMENT', 14, 40);
    doc.setFontSize(9); doc.text(`Period Ending: ${new Date().toLocaleDateString()}`, 14, 46);

    const body = [
      ['REVENUE', ''],
      ...revenueAccounts.map(acc => [`  ${acc}`, `Rs. ${accountBalances[acc].net.toLocaleString()}`]),
      ['Total Revenue', `Rs. ${totalRevenue.toLocaleString()}`],
      ['', ''],
      ['EXPENSES', ''],
      ...expenseAccounts.map(acc => [`  ${acc}`, `Rs. ${accountBalances[acc].net.toLocaleString()}`]),
      ['Total Expenses', `Rs. ${totalExpense.toLocaleString()}`],
      ['', ''],
      ['NET PROFIT', `Rs. ${netProfit.toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Account Description', 'Amount (PKR)']],
      body: body,
      theme: 'plain',
      columnStyles: { 0: { cellWidth: 120 }, 1: { halign: 'right', cellWidth: 50 } }
    });

    doc.save('Profit_Loss_Statement.pdf');
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Double-Entry Accounting</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Full general ledger, double-entry trial balances and financial statements in PKR.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'trial' && (
            <button className="btn btn-outline" onClick={generateTrialBalancePDF}><Download size={16} /> Export Trial Balance</button>
          )}
          {activeTab === 'profit-loss' && (
            <button className="btn btn-outline" onClick={generateProfitLossPDF}><Download size={16} /> Export P&amp;L</button>
          )}
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Journal Entry</button>
        </div>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--accent-success)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}><TrendingUp size={24} /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Revenue</p><h3 style={{ fontSize: '1.4rem' }}>Rs. {totalRevenue.toLocaleString()}</h3></div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: 'var(--accent-danger)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}><TrendingDown size={24} /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Expenses</p><h3 style={{ fontSize: '1.4rem' }}>Rs. {totalExpense.toLocaleString()}</h3></div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: netProfit >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: netProfit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}><Scale size={24} /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Net Profit Position</p><h3 style={{ fontSize: '1.4rem', color: netProfit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>Rs. {netProfit.toLocaleString()}</h3></div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-6)' }}>
        {['journal', 'trial', 'profit-loss', 'balance-sheet'].map(tab => (
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
            {tab === 'journal' && `General Journal (${allJournalEntries.length})`}
            {tab === 'trial' && 'Trial Balance'}
            {tab === 'profit-loss' && 'Profit & Loss (P&L)'}
            {tab === 'balance-sheet' && 'Balance Sheet'}
          </button>
        ))}
      </div>

      {/* General Journal Tab */}
      {activeTab === 'journal' && (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px var(--sp-4)' }}>Date</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Description</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Debit Account (Dr)</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Credit Account (Cr)</th>
                <th style={{ padding: '12px var(--sp-4)', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px var(--sp-4)', textAlign: 'center' }}>X</th>
              </tr>
            </thead>
            <tbody>
              {allJournalEntries.map((entry, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: 'var(--sp-4)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{entry.date}</td>
                  <td style={{ padding: 'var(--sp-4)', color: 'white', fontWeight: '500' }}>
                    <div>{entry.description}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ref: {entry.id}</span>
                  </td>
                  <td style={{ padding: 'var(--sp-4)', color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{entry.debitAccount}</td>
                  <td style={{ padding: 'var(--sp-4)', color: 'var(--accent-warning)', fontSize: '0.9rem' }}>{entry.creditAccount}</td>
                  <td style={{ padding: 'var(--sp-4)', textAlign: 'right', fontWeight: '600' }}>Rs. {entry.amount.toLocaleString()}</td>
                  <td style={{ padding: 'var(--sp-4)', textAlign: 'center' }}>
                    {entry.isManual && (
                      <button onClick={() => handleDeleteTxn(entry.originalId)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', opacity: 0.6 }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allJournalEntries.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>No journal entries recorded.</div>}
        </div>
      )}

      {/* Trial Balance Tab */}
      {activeTab === 'trial' && (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px var(--sp-4)' }}>Account Title</th>
                <th style={{ padding: '12px var(--sp-4)' }}>Account Category</th>
                <th style={{ padding: '12px var(--sp-4)', textAlign: 'right' }}>Debit (Dr) Total</th>
                <th style={{ padding: '12px var(--sp-4)', textAlign: 'right' }}>Credit (Cr) Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(accountBalances).map((acc, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: 'var(--sp-4)', fontWeight: '500', color: 'white' }}>{acc}</td>
                  <td style={{ padding: 'var(--sp-4)', color: 'var(--text-secondary)' }}>{accountBalances[acc].type}</td>
                  <td style={{ padding: 'var(--sp-4)', textAlign: 'right', color: 'var(--accent-primary)' }}>
                    {accountBalances[acc].debit > 0 ? `Rs. ${accountBalances[acc].debit.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ padding: 'var(--sp-4)', textAlign: 'right', color: 'var(--accent-warning)' }}>
                    {accountBalances[acc].credit > 0 ? `Rs. ${accountBalances[acc].credit.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 'bold', fontSize: '1.05rem', borderTop: '2px solid var(--border-color)' }}>
                <td style={{ padding: '16px' }} colSpan="2">TOTAL</td>
                <td style={{ padding: '16px', textAlign: 'right', color: 'var(--accent-success)' }}>Rs. {totalDebitTrial.toLocaleString()}</td>
                <td style={{ padding: '16px', textAlign: 'right', color: 'var(--accent-success)' }}>Rs. {totalCreditTrial.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          {totalDebitTrial !== totalCreditTrial && (
            <div style={{ marginTop: '15px', color: 'var(--accent-danger)', display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
              <span>⚠️ Warning: Ledgers are unbalanced! Total Dr does not match Total Cr. Please inspect manual entries.</span>
            </div>
          )}
        </div>
      )}

      {/* Profit & Loss Tab */}
      {activeTab === 'profit-loss' && (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>Income Statement (P&amp;L)</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Revenue */}
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-success)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>REVENUE</h3>
              {revenueAccounts.map(acc => (
                <div key={acc} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{acc}</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>Rs. {accountBalances[acc].net.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontWeight: 'bold', borderTop: '1px dashed var(--border-color)' }}>
                <span>Total Revenue</span>
                <span style={{ color: 'var(--accent-success)' }}>Rs. {totalRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Expenses */}
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-danger)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>EXPENSES</h3>
              {expenseAccounts.map(acc => (
                <div key={acc} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{acc}</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>Rs. {accountBalances[acc].net.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontWeight: 'bold', borderTop: '1px dashed var(--border-color)' }}>
                <span>Total Expenses</span>
                <span style={{ color: 'var(--accent-danger)' }}>Rs. {totalExpense.toLocaleString()}</span>
              </div>
            </div>

            {/* Profit summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 12px', fontWeight: 'bold', background: 'rgba(255,255,255,0.02)', borderTop: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '1.1rem' }}>NET PROFIT POSITION</span>
              <span style={{ fontSize: '1.2rem', color: netProfit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>Rs. {netProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet Tab */}
      {activeTab === 'balance-sheet' && (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.3rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>Balance Sheet</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Assets */}
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>ASSETS</h3>
              {Object.keys(accountBalances).filter(acc => accountBalances[acc].type === 'Asset').map(acc => (
                <div key={acc} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{acc}</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>Rs. {accountBalances[acc].net.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontWeight: 'bold', borderTop: '1px dashed var(--border-color)', color: 'var(--accent-primary)' }}>
                <span>Total Assets</span>
                <span>Rs. {Object.keys(accountBalances).filter(acc => accountBalances[acc].type === 'Asset').reduce((sum, acc) => sum + accountBalances[acc].net, 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-warning)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>LIABILITIES</h3>
              {Object.keys(accountBalances).filter(acc => accountBalances[acc].type === 'Liability').map(acc => (
                <div key={acc} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{acc}</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>Rs. {accountBalances[acc].net.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontWeight: 'bold', borderTop: '1px dashed var(--border-color)', color: 'var(--accent-warning)' }}>
                <span>Total Liabilities</span>
                <span>Rs. {Object.keys(accountBalances).filter(acc => accountBalances[acc].type === 'Liability').reduce((sum, acc) => sum + accountBalances[acc].net, 0).toLocaleString()}</span>
              </div>
            </div>

            {/* Equity */}
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-purple)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>EQUITY</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Retained Earnings (Net Profit)</span>
                <span style={{ color: 'white', fontWeight: '500' }}>Rs. {netProfit.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontWeight: 'bold', borderTop: '1px dashed var(--border-color)', color: 'var(--accent-purple)' }}>
                <span>Total Equity</span>
                <span>Rs. {netProfit.toLocaleString()}</span>
              </div>
            </div>

            {/* Balance check */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 12px', fontWeight: 'bold', background: 'rgba(255,255,255,0.02)', borderTop: '2px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '1rem' }}>TOTAL LIABILITIES &amp; EQUITY</span>
              <span style={{ fontSize: '1.1rem', color: 'var(--accent-success)' }}>
                Rs. {(Object.keys(accountBalances).filter(acc => accountBalances[acc].type === 'Liability').reduce((sum, acc) => sum + accountBalances[acc].net, 0) + netProfit).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* New Journal Entry Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '500px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>Record Journal Entry</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="input-group">
                <label className="input-label">Date</label>
                <input type="date" className="input-field" value={newTxn.date} onChange={e => setNewTxn({ ...newTxn, date: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <input className="input-field" value={newTxn.description} onChange={e => setNewTxn({ ...newTxn, description: e.target.value })} placeholder="e.g. Received prepayment from client" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="input-group">
                  <label className="input-label">Debit Account (Dr)</label>
                  <select className="input-field" value={newTxn.debitAccount} onChange={e => setNewTxn({ ...newTxn, debitAccount: e.target.value })} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    {Object.keys(ACCOUNTS).map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Credit Account (Cr)</label>
                  <select className="input-field" value={newTxn.creditAccount} onChange={e => setNewTxn({ ...newTxn, creditAccount: e.target.value })} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    {Object.keys(ACCOUNTS).map(acc => <option key={acc} value={acc}>{acc}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Transaction Amount (Rs.)</label>
                <input type="number" className="input-field" value={newTxn.amount} onChange={e => setNewTxn({ ...newTxn, amount: e.target.value })} placeholder="15000" />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-6)' }} onClick={handleSaveTxn}>Post Journal Entry</button>
          </div>
        </div>
      )}
    </div>
  );
}
