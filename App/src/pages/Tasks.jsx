import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Clock } from 'lucide-react';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', client: '', status: 'todo', dueDate: '' });
  const [activeTab, setActiveTab] = useState('todo');

  useEffect(() => {
    loadDatabase().then(data => {
      setTasks(data.tasks || []);
      setClients(data.clients || []);
    });
  }, []);

  const handleCreateTask = async () => {
    if (!newTask.title) return alert('Title required');
    const task = { id: Date.now(), title: newTask.title, client: newTask.client || 'Internal', status: newTask.status || 'todo', dueDate: newTask.dueDate || 'Today' };
    const updated = [...tasks, task];
    setTasks(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, tasks: updated });
    setShowModal(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTasks(updated);
    const db = await loadDatabase();
    await saveDatabase({ ...db, tasks: updated });
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: 'var(--accent-purple)' },
    { id: 'in-progress', title: 'Progress', color: 'var(--accent-warning)' },
    { id: 'done', title: 'Done', color: 'var(--accent-success)' }
  ];

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 className="page-title">Tasks</h1></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /></button>
      </header>

      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--sp-4)', overflowX: 'auto' }}>
        {columns.map(col => (
          <button key={col.id} onClick={() => setActiveTab(col.id)} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: activeTab === col.id ? 'rgba(59,130,246,0.2)' : 'none', color: activeTab === col.id ? 'white' : 'gray', fontSize: '0.85rem' }}>
            {col.title} ({tasks.filter(t => t.status === col.id).length})
          </button>
        ))}
      </div>

      <div className="tasks-container">
        <div className="glass-panel" style={{ padding: '10px' }}>
          {tasks.filter(t => t.status === activeTab).map(task => (
            <div key={task.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '8px', borderLeft: `3px solid var(--accent-primary)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{task.title}</div>
                <button onClick={() => handleUpdateStatus(task.id, activeTab === 'todo' ? 'in-progress' : 'done')} style={{ background: 'none', border: 'none', color: 'var(--accent-success)' }}>&rarr;</button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'gray' }}>{task.client}</div>
            </div>
          ))}
          {tasks.filter(t => t.status === activeTab).length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>No tasks</div>}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', width: '400px', maxWidth: '100%', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}><h2>New Task</h2><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X/></button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input className="input-field" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="Title" />
              <select className="input-field" value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}>
                <option value="todo">To Do</option><option value="in-progress">Progress</option><option value="done">Done</option>
              </select>
              <button className="btn btn-primary" onClick={handleCreateTask}>Create</button>
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
