import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, X, Trash2, Download, Calendar, Users as UsersIcon, Clock, Briefcase, Eye, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadDatabase, saveDatabase } from '../utils/db';

const DEPARTMENTS = ['Development', 'Design', 'Marketing', 'Sales', 'HR', 'Admin', 'Support'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HR() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [salarySlips, setSalarySlips] = useState([]);
  const [activeTab, setActiveTab] = useState('employees');
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', designation: '', department: 'Development', salary: '', phone: '', joinDate: '' });
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState('');

  // Attendance
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attRecords, setAttRecords] = useState({});

  // Salary
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salaryEmpId, setSalaryEmpId] = useState('');

  useEffect(() => {
    loadDatabase().then(data => {
      setEmployees(data.employees || []);
      setAttendance(data.attendance || []);
      setSalarySlips(data.salarySlips || []);
    });
  }, []);

  // --- Employees ---
  const handleSaveEmp = async () => {
    if (!newEmp.name || !newEmp.salary) return alert('Name and salary required.');
    const emp = { ...newEmp, id: Date.now(), salary: Number(newEmp.salary) };
    const updated = [emp, ...employees];
    setEmployees(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, employees: updated });
    setShowEmpModal(false);
    setNewEmp({ name: '', designation: '', department: 'Development', salary: '', phone: '', joinDate: '' });
  };

  const handleDeleteEmp = async (id) => {
    if (!confirm('Delete this employee?')) return;
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, employees: updated });
  };

  // --- Attendance ---
  const handleOpenAttendance = () => {
    const existingForDate = attendance.filter(a => a.date === attDate);
    const records = {};
    employees.forEach(emp => {
      const existing = existingForDate.find(a => a.empId === emp.id);
      records[emp.id] = existing ? existing.status : 'Present';
    });
    setAttRecords(records);
    setShowAttModal(true);
  };

  const handleSaveAttendance = async () => {
    const newRecords = employees.map(emp => ({
      empId: emp.id,
      empName: emp.name,
      date: attDate,
      status: attRecords[emp.id] || 'Present'
    }));
    // Remove old records for this date and add new
    const updated = [...attendance.filter(a => a.date !== attDate), ...newRecords];
    setAttendance(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, attendance: updated });
    setShowAttModal(false);
  };

  // --- Salary ---
  const handleProcessSalary = async () => {
    if (!salaryEmpId) return alert('Select an employee.');
    const emp = employees.find(e => String(e.id) === String(salaryEmpId));
    if (!emp) return;

    const [year, month] = salaryMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthAtt = attendance.filter(a => a.empId === emp.id && a.date.startsWith(salaryMonth));
    const presentDays = monthAtt.filter(a => a.status === 'Present').length;
    const absentDays = monthAtt.filter(a => a.status === 'Absent').length;
    const leaveDays = monthAtt.filter(a => a.status === 'Leave').length;
    const workingDays = presentDays + absentDays + leaveDays || daysInMonth;
    const perDaySalary = emp.salary / workingDays;
    const deduction = Math.round(absentDays * perDaySalary);
    const netSalary = emp.salary - deduction;

    const slip = {
      id: Date.now(),
      empId: emp.id,
      empName: emp.name,
      department: emp.department,
      designation: emp.designation,
      month: salaryMonth,
      monthName: `${MONTH_NAMES[Number(month) - 1]} ${year}`,
      baseSalary: emp.salary,
      workingDays,
      presentDays,
      absentDays,
      leaveDays,
      deduction,
      netSalary,
      date: new Date().toLocaleDateString()
    };

    const updatedSlips = [slip, ...salarySlips];
    setSalarySlips(updatedSlips);

    // Create expense transaction
    const db = await loadDatabase();
    const txns = db.transactions || [];
    const expTxn = { id: Date.now() + 1, type: 'expense', category: 'Salaries', description: `Salary — ${emp.name} (${slip.monthName})`, amount: netSalary, date: new Date().toISOString().slice(0, 10) };
    await saveDatabase({ ...db, salarySlips: updatedSlips, transactions: [expTxn, ...txns] });
    setShowSalaryModal(false);
    setSalaryEmpId('');
  };

  const generateSlipPdf = (slip, action = 'preview') => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(59, 130, 246);
    doc.text('RAK Tech Soft Hub', 14, 18);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text('IT Infrastructure & Digital Creative Services', 14, 24);
    doc.setFontSize(16); doc.setTextColor(50);
    doc.text('SALARY SLIP', 14, 40);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Month: ${slip.monthName}`, 14, 47); doc.text(`Date: ${slip.date}`, 130, 47);
    doc.setFontSize(12); doc.setTextColor(30);
    doc.text(`Employee: ${slip.empName}`, 14, 60);
    doc.setFontSize(10); doc.setTextColor(80);
    doc.text(`Department: ${slip.department}`, 14, 66);
    doc.text(`Designation: ${slip.designation}`, 14, 72);
 
    autoTable(doc, {
      startY: 82,
      head: [['Description', 'Details']],
      body: [
        ['Base Salary', `Rs. ${slip.baseSalary.toLocaleString()}`],
        ['Working Days', slip.workingDays],
        ['Present Days', slip.presentDays],
        ['Absent Days', slip.absentDays],
        ['Leave Days', slip.leaveDays],
        ['Deductions (Absence)', `- Rs. ${slip.deduction.toLocaleString()}`],
        ['Net Salary', `Rs. ${slip.netSalary.toLocaleString()}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 80, halign: 'right' } }
    });
 
    const fY = doc.lastAutoTable.finalY || 120;
    doc.setFontSize(14); doc.setTextColor(16, 185, 129);
    doc.text(`Net Payable: Rs. ${slip.netSalary.toLocaleString()}`, 14, fY + 16);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text('_______________________', 14, fY + 35); doc.text('Authorized Signature', 14, fY + 41);
    doc.text('_______________________', 130, fY + 35); doc.text('Employee Signature', 130, fY + 41);
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
      setPreviewFileName(`Salary_${slip.empName}_${slip.monthName}.pdf`);
      setShowPreview(true);
    }
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">HR & Payroll</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage employees, attendance, and salaries.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowEmpModal(true)}><Plus size={16} /> Add Employee</button>
          <button className="btn btn-outline" onClick={handleOpenAttendance}><Calendar size={16} /> Mark Attendance</button>
          <button className="btn btn-primary" onClick={() => setShowSalaryModal(true)}><Download size={16} /> Process Salary</button>
        </div>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--sp-6)', marginBottom: 'var(--sp-8)' }}>
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}><UsersIcon size={24} /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Employees</p><h3 style={{ fontSize: '1.5rem' }}>{employees.length}</h3></div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--accent-success)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}><UserCheck size={24} /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Present Today</p><h3 style={{ fontSize: '1.5rem' }}>{attendance.filter(a => a.date === new Date().toISOString().slice(0, 10) && a.status === 'Present').length}</h3></div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: 'var(--accent-warning)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}><Briefcase size={24} /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Departments</p><h3 style={{ fontSize: '1.5rem' }}>{new Set(employees.map(e => e.department)).size}</h3></div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)', padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)' }}><Clock size={24} /></div>
          <div><p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Slips Generated</p><h3 style={{ fontSize: '1.5rem' }}>{salarySlips.length}</h3></div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-6)' }}>
        {['employees', 'salarySlips'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: activeTab === t ? 'rgba(59,130,246,0.15)' : 'transparent', color: activeTab === t ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: activeTab === t ? '600' : '400' }}>
            {t === 'employees' ? `Employees (${employees.length})` : `Salary Slips (${salarySlips.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'employees' ? (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Name</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Designation</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Department</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Salary (Rs.)</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Phone</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500', textAlign: 'right' }}>Action</th>
            </tr></thead>
            <tbody>{employees.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }} onMouseOver={ev => ev.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={ev => ev.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: 'var(--sp-4)' }}><div style={{ fontWeight: '500' }}>{e.name}</div>{e.joinDate && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Joined: {e.joinDate}</div>}</td>
                <td style={{ padding: 'var(--sp-4)', color: 'var(--text-secondary)' }}>{e.designation}</td>
                <td style={{ padding: 'var(--sp-4)' }}><span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-primary)' }}>{e.department}</span></td>
                <td style={{ padding: 'var(--sp-4)', fontWeight: '500' }}>Rs. {Number(e.salary).toLocaleString()}</td>
                <td style={{ padding: 'var(--sp-4)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{e.phone}</td>
                <td style={{ padding: 'var(--sp-4)', textAlign: 'right' }}><button className="btn btn-outline" style={{ padding: '6px', minWidth: 'auto', borderColor: 'rgba(239,68,68,0.4)', color: 'var(--accent-danger)' }} onClick={() => handleDeleteEmp(e.id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
          {employees.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>No employees yet.</div>}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Employee</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Month</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Base</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Deduction</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500' }}>Net Pay</th>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', fontWeight: '500', textAlign: 'right' }}>Download</th>
            </tr></thead>
            <tbody>{salarySlips.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }} onMouseOver={ev => ev.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={ev => ev.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: 'var(--sp-4)', fontWeight: '500' }}>{s.empName}</td>
                <td style={{ padding: 'var(--sp-4)', color: 'var(--text-secondary)' }}>{s.monthName}</td>
                <td style={{ padding: 'var(--sp-4)', color: 'var(--text-secondary)' }}>Rs. {s.baseSalary.toLocaleString()}</td>
                <td style={{ padding: 'var(--sp-4)', color: 'var(--accent-danger)' }}>-Rs. {s.deduction.toLocaleString()}</td>
                <td style={{ padding: 'var(--sp-4)', fontWeight: '600', color: 'var(--accent-success)' }}>Rs. {s.netSalary.toLocaleString()}</td>
                <td style={{ padding: 'var(--sp-4)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => generateSlipPdf(s, 'preview')}>
                      <Eye size={14} /> Preview
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }} onClick={() => generateSlipPdf(s, 'print')}>
                      <Printer size={14} /> Print
                    </button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
          {salarySlips.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>No salary slips generated yet.</div>}
        </div>
      )}

      {/* Add Employee Modal */}
      {showEmpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '500px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>Add Employee</h2>
              <button onClick={() => setShowEmpModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              <div className="input-group"><label className="input-label">Full Name</label><input className="input-field" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} placeholder="Ahmed Ali" /></div>
              <div className="input-group"><label className="input-label">Designation</label><input className="input-field" value={newEmp.designation} onChange={e => setNewEmp({ ...newEmp, designation: e.target.value })} placeholder="Sr. Developer" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              <div className="input-group"><label className="input-label">Department</label>
                <select className="input-field" value={newEmp.department} onChange={e => setNewEmp({ ...newEmp, department: e.target.value })} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="input-group"><label className="input-label">Monthly Salary (Rs.)</label><input type="number" className="input-field" value={newEmp.salary} onChange={e => setNewEmp({ ...newEmp, salary: e.target.value })} placeholder="80000" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
              <div className="input-group"><label className="input-label">Phone</label><input className="input-field" value={newEmp.phone} onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })} placeholder="+92 300..." /></div>
              <div className="input-group"><label className="input-label">Joining Date</label><input type="date" className="input-field" value={newEmp.joinDate} onChange={e => setNewEmp({ ...newEmp, joinDate: e.target.value })} /></div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-4)' }} onClick={handleSaveEmp}>Save Employee</button>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '550px', background: 'var(--bg-dark)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>Mark Attendance</h2>
              <button onClick={() => setShowAttModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="input-group"><label className="input-label">Date</label><input type="date" className="input-field" value={attDate} onChange={e => setAttDate(e.target.value)} /></div>
            {employees.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--sp-6)' }}>Add employees first.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'var(--sp-4)' }}>
                {employees.map(emp => (
                  <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontWeight: '500', color: 'white' }}>{emp.name}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['Present', 'Absent', 'Leave'].map(s => (
                        <button key={s} onClick={() => setAttRecords({ ...attRecords, [emp.id]: s })} style={{ padding: '4px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', cursor: 'pointer', background: attRecords[emp.id] === s ? (s === 'Present' ? 'rgba(16,185,129,0.3)' : s === 'Absent' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)') : 'transparent', color: attRecords[emp.id] === s ? 'white' : 'var(--text-secondary)' }}>{s}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-6)' }} onClick={handleSaveAttendance}>Save Attendance</button>
          </div>
        </div>
      )}

      {/* Process Salary Modal */}
      {showSalaryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '450px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>Process Salary</h2>
              <button onClick={() => setShowSalaryModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div className="input-group"><label className="input-label">Select Employee</label>
              <select className="input-field" value={salaryEmpId} onChange={e => setSalaryEmpId(e.target.value)} style={{ background: 'rgba(15,23,42,0.9)' }}>
                <option value="">-- Choose --</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name} (Rs. {Number(e.salary).toLocaleString()}/mo)</option>)}
              </select>
            </div>
            <div className="input-group"><label className="input-label">For Month</label><input type="month" className="input-field" value={salaryMonth} onChange={e => setSalaryMonth(e.target.value)} /></div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-4)' }} onClick={handleProcessSalary}>Generate Salary Slip</button>
          </div>
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
