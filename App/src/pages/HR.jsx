import React, { useState, useEffect } from 'react';
import { Plus, UserCheck, X, Trash2, Download, Calendar, Users as UsersIcon, Clock, Briefcase, Eye, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { loadDatabase, saveDatabase } from '../utils/db';

const DEPARTMENTS = ['Dev', 'Design', 'Marketing', 'Sales', 'HR', 'Admin', 'Support'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HR() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [salarySlips, setSalarySlips] = useState([]);
  const [activeTab, setActiveTab] = useState('employees');
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showAttModal, setShowAttModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', designation: '', department: 'Dev', salary: '', phone: '', joinDate: '' });

  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attRecords, setAttRecords] = useState({});
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [salaryEmpId, setSalaryEmpId] = useState('');

  useEffect(() => {
    loadDatabase().then(data => {
      setEmployees(data.employees || []);
      setAttendance(data.attendance || []);
      setSalarySlips(data.salarySlips || []);
    });
  }, []);

  const handleSaveEmp = async () => {
    if (!newEmp.name || !newEmp.salary) return alert('Name and salary are required.');
    const emp = { ...newEmp, id: Date.now(), salary: Number(newEmp.salary), workspaceId: 'WS-001' };
    const updated = [emp, ...employees];
    setEmployees(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, employees: updated });
    setShowEmpModal(false);
    setNewEmp({ name: '', designation: '', department: 'Dev', salary: '', phone: '', joinDate: '' });
  };

  // ── FIX: handleDeleteEmp was previously referenced but never defined ──
  const handleDeleteEmp = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, employees: updated });
  };

  const handleSaveAttendance = async () => {
    const newRecords = employees.map(emp => ({
      empId: emp.id, empName: emp.name, date: attDate,
      status: attRecords[emp.id] || 'Present', workspaceId: 'WS-001'
    }));
    const updated = [...attendance.filter(a => a.date !== attDate), ...newRecords];
    setAttendance(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, attendance: updated });
    setShowAttModal(false);
  };

  const handleProcessSalary = async () => {
    if (!salaryEmpId) return alert('Select an employee.');
    const emp = employees.find(e => String(e.id) === String(salaryEmpId));
    if (!emp) return;

    // Calculate attendance for the month
    const monthAttendance = attendance.filter(
      a => a.empId === emp.id && a.date && a.date.startsWith(salaryMonth)
    );
    const workingDays  = new Date(Number(salaryMonth.split('-')[0]), Number(salaryMonth.split('-')[1]), 0).getDate();
    const presentDays  = monthAttendance.filter(a => a.status === 'Present').length;
    const absentDays   = monthAttendance.filter(a => a.status === 'Absent').length;
    const leaveDays    = monthAttendance.filter(a => a.status === 'Leave').length;
    const dailyRate    = emp.salary / workingDays;
    const deduction    = Math.round(absentDays * dailyRate);
    const netSalary    = emp.salary - deduction;
    const [year, mon]  = salaryMonth.split('-');
    const monthNames   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const slip = {
      id          : Date.now(),
      empId       : emp.id,
      empName     : emp.name,
      department  : emp.department,
      designation : emp.designation || '',
      month       : salaryMonth,
      monthName   : `${monthNames[Number(mon)-1]} ${year}`,
      baseSalary  : emp.salary,
      workingDays,
      presentDays : presentDays || workingDays,
      absentDays,
      leaveDays,
      deduction,
      netSalary,
      date        : new Date().toLocaleDateString(),
      workspaceId : 'WS-001',
    };
    const updated = [slip, ...salarySlips];
    setSalarySlips(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, salarySlips: updated });
    setShowSalaryModal(false);
    setSalaryEmpId('');
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">HR & Payroll</h1></div>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => setShowEmpModal(true)} title="Add Employee"><Plus size={16}/></button>
          <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => setShowAttModal(true)} title="Mark Attendance"><Calendar size={16}/></button>
          <button className="btn btn-primary" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => setShowSalaryModal(true)}>Payroll</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)' }}>
        <div className="glass-panel" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem' }}>Staff</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{employees.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem' }}>Present</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{attendance.filter(a => a.date === new Date().toISOString().slice(0, 10) && a.status === 'Present').length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-4)', overflowX: 'auto' }}>
        {['employees', 'salarySlips'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: activeTab === t ? 'rgba(59,130,246,0.2)' : 'none', color: activeTab === t ? 'white' : 'gray', fontSize: '0.85rem' }}>
            {t === 'employees' ? 'Employees' : 'Salaries'}
          </button>
        ))}
      </div>

      {activeTab === 'employees' ? (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
          <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid gray', fontSize: '0.85rem' }}><th style={{ padding: '10px' }}>Name / Dept</th><th style={{ padding: '10px' }}>Salary</th><th style={{ padding: '10px', textAlign: 'right' }}>Action</th></tr></thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}><div style={{ fontWeight: '600' }}>{e.name}</div><div style={{ fontSize: '0.75rem', color: 'gray' }}>{e.department}</div></td>
                  <td style={{ padding: '10px' }}>Rs.{e.salary.toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}><button onClick={() => handleDeleteEmp(e.id)} style={{ background: 'none', border: 'none', color: 'red' }}><Trash2 size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0' }}>
           <table style={{ width: '100%', minWidth: '500px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid gray', fontSize: '0.85rem' }}><th style={{ padding: '10px' }}>Employee</th><th style={{ padding: '10px' }}>Month</th><th style={{ padding: '10px' }}>Net Pay</th></tr></thead>
            <tbody>
              {salarySlips.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}>{s.empName}</td>
                  <td style={{ padding: '10px' }}>{s.monthName}</td>
                  <td style={{ padding: '10px' }}>Rs.{s.netSalary.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEmpModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', width: '400px', maxWidth: '100%', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h2>New Employee</h2><button onClick={() => setShowEmpModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X/></button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input className="input-field" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} placeholder="Name" />
              <input className="input-field" value={newEmp.designation} onChange={e => setNewEmp({...newEmp, designation: e.target.value})} placeholder="Designation" />
              <select className="input-field" value={newEmp.department} onChange={e => setNewEmp({...newEmp, department: e.target.value})}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="number" className="input-field" value={newEmp.salary} onChange={e => setNewEmp({...newEmp, salary: e.target.value})} placeholder="Salary" />
              <button className="btn btn-primary" onClick={handleSaveEmp}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showAttModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', width: '450px', maxWidth: '100%', background: 'var(--bg-dark)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h2>Attendance</h2><button onClick={() => setShowAttModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X/></button></div>
            <input type="date" className="input-field" value={attDate} onChange={e => setAttDate(e.target.value)} style={{ marginBottom: '15px' }} />
            {employees.map(emp => (
              <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>{emp.name}</span>
                <select value={attRecords[emp.id] || 'Present'} onChange={e => setAttRecords({...attRecords, [emp.id]: e.target.value})} style={{ background: 'black', color: 'white', padding: '5px' }}>
                  <option value="Present">P</option><option value="Absent">A</option><option value="Leave">L</option>
                </select>
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} onClick={handleSaveAttendance}>Save</button>
          </div>
        </div>
      )}

      {showSalaryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', width: '420px', maxWidth: '100%', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h2 style={{ margin:0, fontSize:'1rem' }}>Process Salary Slip</h2>
              <button onClick={() => setShowSalaryModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor:'pointer' }}><X/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize:'0.8rem', color:'gray', display:'block', marginBottom:'5px' }}>Employee</label>
                <select className="input-field" value={salaryEmpId} onChange={e => setSalaryEmpId(e.target.value)}>
                  <option value="">-- Select Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — Rs.{e.salary?.toLocaleString()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'gray', display:'block', marginBottom:'5px' }}>Month</label>
                <input type="month" className="input-field" value={salaryMonth} onChange={e => setSalaryMonth(e.target.value)} />
              </div>
              {salaryEmpId && (() => {
                const emp = employees.find(e => String(e.id) === String(salaryEmpId));
                const monthAtt = attendance.filter(a => a.empId === emp?.id && a.date?.startsWith(salaryMonth));
                const workingDays = new Date(Number(salaryMonth.split('-')[0]), Number(salaryMonth.split('-')[1]), 0).getDate();
                const presentDays = monthAtt.filter(a => a.status === 'Present').length;
                const absentDays  = monthAtt.filter(a => a.status === 'Absent').length;
                const deduction   = Math.round((absentDays / workingDays) * (emp?.salary || 0));
                const netSalary   = (emp?.salary || 0) - deduction;
                return (
                  <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:'8px', padding:'12px', fontSize:'0.85rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}><span style={{color:'gray'}}>Base Salary</span><span>Rs.{emp?.salary?.toLocaleString()}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}><span style={{color:'gray'}}>Working Days</span><span>{workingDays}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}><span style={{color:'gray'}}>Present / Absent</span><span>{presentDays} / {absentDays}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}><span style={{color:'#ef4444'}}>Deduction</span><span style={{color:'#ef4444'}}>-Rs.{deduction.toLocaleString()}</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'700', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'8px' }}><span>Net Salary</span><span style={{color:'#10b981'}}>Rs.{netSalary.toLocaleString()}</span></div>
                  </div>
                );
              })()}
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleProcessSalary}>Generate Salary Slip</button>
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
