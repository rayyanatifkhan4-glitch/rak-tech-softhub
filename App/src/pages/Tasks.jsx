import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Clock, X, Trash2 } from 'lucide-react';
import { loadDatabase, saveDatabase } from '../utils/db';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', client: '', status: 'todo', dueDate: '' });

  useEffect(() => {
    loadDatabase().then(data => {
      setTasks(data.tasks || []);
      setClients(data.clients || []);
    });
  }, []);

  const handleCreateTask = async () => {
    if (!newTask.title) return alert('Task title is required.');
    
    const task = {
      id: Date.now(),
      title: newTask.title,
      client: newTask.client || 'Internal',
      status: newTask.status || 'todo',
      dueDate: newTask.dueDate || new Date().toLocaleDateString()
    };

    const updated = [...tasks, task];
    setTasks(updated);

    // Save to server database
    const db = await loadDatabase();
    await saveDatabase({ ...db, tasks: updated });

    setShowModal(false);
    setNewTask({ title: '', client: '', status: 'todo', dueDate: '' });
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTasks(updated);

    const db = await loadDatabase();
    await saveDatabase({ ...db, tasks: updated });
  };

  const handleDeleteTask = async (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);

      const db = await loadDatabase();
      await saveDatabase({ ...db, tasks: updated });
    }
  };

  const columns = [
    { id: 'todo', title: 'To Do', color: 'var(--accent-purple)' },
    { id: 'in-progress', title: 'In Progress', color: 'var(--accent-warning)' },
    { id: 'done', title: 'Done', color: 'var(--accent-success)' }
  ];

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track your project progress dynamically.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          New Task
        </button>
      </header>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="glass-panel" style={{ padding: 'var(--sp-6)', width: '450px', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h2>Create New Task</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="input-group">
                <label className="input-label">Task Title</label>
                <input className="input-field" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="E.g. Setup Routing Server" />
              </div>

              <div className="input-group">
                <label className="input-label">Client / Project</label>
                <select className="input-field" value={newTask.client} onChange={e => setNewTask({ ...newTask, client: e.target.value })} style={{ background: 'rgba(15,23,42,0.9)' }}>
                  <option value="">-- Internal Task --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
                <div className="input-group">
                  <label className="input-label">Column</label>
                  <select className="input-field" value={newTask.status} onChange={e => setNewTask({ ...newTask, status: e.target.value })} style={{ background: 'rgba(15,23,42,0.9)' }}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Due Date</label>
                  <input className="input-field" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} placeholder="E.g. Jun 15" />
                </div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--sp-6)' }} onClick={handleCreateTask}>
              Create Task
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-6)', alignItems: 'start' }}>
        {columns.map(col => (
          <div key={col.id} className="glass-panel" style={{ padding: 'var(--sp-4)', background: 'rgba(30, 41, 59, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: col.color }}></div>
                <h3 style={{ fontSize: '1rem', fontWeight: '500' }}>{col.title} ({tasks.filter(t => t.status === col.id).length})</h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              {tasks.filter(t => t.status === col.id).map(task => (
                <div key={task.id} className="glass-panel" style={{ 
                  padding: 'var(--sp-4)', 
                  borderLeft: `3px solid ${col.color}`,
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '4px', color: 'var(--text-primary)', maxWidth: '85%' }}>{task.title}</h4>
                    <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.6)', cursor: 'pointer', padding: 0 }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>{task.client}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {task.dueDate}
                    </div>

                    {/* Status Mover Quick Options */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {col.id !== 'todo' && (
                        <button 
                          style={{ padding: '2px 4px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer', borderRadius: '2px' }}
                          onClick={() => handleUpdateStatus(task.id, col.id === 'done' ? 'in-progress' : 'todo')}
                        >
                          &larr;
                        </button>
                      )}
                      {col.id !== 'done' && (
                        <button 
                          style={{ padding: '2px 4px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer', borderRadius: '2px' }}
                          onClick={() => handleUpdateStatus(task.id, col.id === 'todo' ? 'in-progress' : 'done')}
                        >
                          &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <button style={{ 
                width: '100%', 
                padding: '10px', 
                background: 'transparent', 
                border: '1px dashed var(--border-color)', 
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all var(--transition-fast)'
              }}
              onClick={() => {
                setNewTask({ ...newTask, status: col.id });
                setShowModal(true);
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = col.color; e.currentTarget.style.color = col.color; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Plus size={16} /> Add Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
