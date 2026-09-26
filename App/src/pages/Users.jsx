import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, UserPlus, Shield, Key, Lock, CheckCircle2, XCircle, 
  Trash2, Edit3, Search, Filter, RefreshCw, Check, X, ShieldAlert, UserCheck
} from 'lucide-react';
import { loadDatabase, saveDatabase } from '../utils/db';
import { hashPassword, generateId } from '../utils/auth';
import { useAuth } from '../contexts/AuthContext';

const MODULE_LIST = [
  { key: 'crm',        label: 'CRM & Clients',      category: 'Sales',       icon: '💼' },
  { key: 'invoices',   label: 'Invoices',            category: 'Sales',       icon: '📄' },
  { key: 'ledgers',    label: 'Customer Ledgers',    category: 'Sales',       icon: '📖' },
  { key: 'purchasing', label: 'Vendors & POs',       category: 'Procurement', icon: '🛒' },
  { key: 'inventory',  label: 'Products & Services', category: 'Inventory',   icon: '📦' },
  { key: 'accounting', label: 'Accounting & Finance',category: 'Finance',     icon: '🧮' },
  { key: 'hr',         label: 'Employees & HR',      category: 'People',      icon: '👥' },
  { key: 'tasks',      label: 'Tasks Board',         category: 'Work',        icon: '📋' },
  { key: 'docs',       label: 'Documents',           category: 'System',      icon: '📑' },
  { key: 'settings',   label: 'Settings & Users',    category: 'System',      icon: '⚙️' },
];

const PRESETS = {
  super_admin: ['crm', 'invoices', 'ledgers', 'purchasing', 'inventory', 'accounting', 'hr', 'tasks', 'docs', 'settings'],
  administrator: ['crm', 'invoices', 'ledgers', 'purchasing', 'inventory', 'accounting', 'hr', 'tasks', 'docs', 'settings'],
  manager: ['crm', 'invoices', 'ledgers', 'purchasing', 'inventory', 'hr', 'tasks', 'docs'],
  sales_rep: ['crm', 'invoices', 'ledgers', 'tasks'],
  accountant: ['invoices', 'ledgers', 'purchasing', 'accounting', 'docs'],
  staff: ['tasks', 'docs']
};

export default function Users() {
  const { currentUser, isSuperAdmin, setCurrentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null); // null for new user
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'staff',
    status: 'active',
    permissions: ['tasks', 'docs']
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const db = await loadDatabase();
      let dbUsers = db.users || [];
      if (dbUsers.length === 0) {
        dbUsers = [{
          id: 'USR-001',
          username: 'admin',
          email: 'admin@raktech.com',
          name: 'System Administrator',
          passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
          role: 'super_admin',
          status: 'active',
          permissions: PRESETS.super_admin,
          createdAt: new Date().toISOString()
        }];
        await saveDatabase({ ...db, users: dbUsers });
      }
      setUsers(dbUsers);
    } catch (e) {
      console.error('Failed to load users', e);
    }
  };

  const handleOpenAddModal = () => {
    setEditUser(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'staff',
      status: 'active',
      permissions: [...PRESETS.staff]
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setEditUser(u);
    setFormData({
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      password: '',
      role: u.role || 'staff',
      status: u.status || 'active',
      permissions: Array.isArray(u.permissions) ? [...u.permissions] : [...(PRESETS[u.role] || PRESETS.staff)]
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleRolePresetSelect = (selectedRole) => {
    const defaultPerms = PRESETS[selectedRole] || PRESETS.staff;
    setFormData(prev => ({
      ...prev,
      role: selectedRole,
      permissions: [...defaultPerms]
    }));
  };

  const togglePermission = (key) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(key);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== key) };
      } else {
        return { ...prev, permissions: [...prev.permissions, key] };
      }
    });
  };

  const selectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: MODULE_LIST.map(m => m.key)
    }));
  };

  const deselectAllPermissions = () => {
    setFormData(prev => ({
      ...prev,
      permissions: []
    }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim()) {
      setErrorMsg('Full Name, Username, and Email are required.');
      return;
    }

    if (!editUser && !formData.password.trim()) {
      setErrorMsg('Password is required for new user.');
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase();
    
    // Check duplicates
    const duplicate = users.find(u => 
      u.username?.toLowerCase() === cleanUsername && (!editUser || u.id !== editUser.id)
    );
    if (duplicate) {
      setErrorMsg(`Username "${cleanUsername}" is already taken by another user.`);
      return;
    }

    try {
      const db = await loadDatabase();
      let updatedUsers = [...(db.users || users)];

      if (editUser) {
        // Edit existing
        updatedUsers = updatedUsers.map(u => {
          if (u.id === editUser.id) {
            const updated = {
              ...u,
              name: formData.name.trim(),
              username: cleanUsername,
              email: formData.email.trim(),
              role: formData.role,
              status: formData.status,
              permissions: formData.permissions,
              updatedAt: new Date().toISOString()
            };
            return updated;
          }
          return u;
        });

        // If editing current logged in user, update AuthContext state
        if (editUser.id === currentUser?.id) {
          setCurrentUser(prev => ({
            ...prev,
            name: formData.name.trim(),
            username: cleanUsername,
            email: formData.email.trim(),
            role: formData.role,
            status: formData.status,
            permissions: formData.permissions
          }));
        }
        setSuccessMsg(`User "${formData.name}" updated successfully.`);
      } else {
        // Create new
        const hashedPassword = await hashPassword(formData.password);
        const newUserObj = {
          id: generateId('USR'),
          name: formData.name.trim(),
          username: cleanUsername,
          email: formData.email.trim(),
          passwordHash: hashedPassword,
          role: formData.role,
          status: formData.status,
          permissions: formData.permissions,
          createdAt: new Date().toISOString()
        };
        updatedUsers.push(newUserObj);
        setSuccessMsg(`New user "${formData.name}" created successfully.`);
      }

      await saveDatabase({ ...db, users: updatedUsers });
      setUsers(updatedUsers);
      setShowModal(false);

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving user:', err);
      setErrorMsg('Failed to save user. Please try again.');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    try {
      const db = await loadDatabase();
      const newHash = await hashPassword(newPassword);
      const updatedUsers = (db.users || users).map(u => {
        if (u.id === resetTargetUser.id) {
          return { ...u, passwordHash: newHash, updatedAt: new Date().toISOString() };
        }
        return u;
      });
      await saveDatabase({ ...db, users: updatedUsers });
      setUsers(updatedUsers);
      setShowResetModal(false);
      setNewPassword('');
      setSuccessMsg(`Password for "${resetTargetUser.name}" reset successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setErrorMsg('Failed to reset password.');
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (userToDelete.role === 'super_admin' && users.filter(u => u.role === 'super_admin').length <= 1) {
      alert('Cannot delete the primary Super Admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${userToDelete.name}"?`)) {
      return;
    }

    try {
      const db = await loadDatabase();
      const updatedUsers = (db.users || users).filter(u => u.id !== userToDelete.id);
      await saveDatabase({ ...db, users: updatedUsers });
      setUsers(updatedUsers);
      setSuccessMsg(`User "${userToDelete.name}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      alert('Failed to delete user.');
    }
  };

  const toggleStatus = async (targetUser) => {
    if (targetUser.role === 'super_admin') {
      alert('Super Admin status cannot be deactivated.');
      return;
    }
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      const db = await loadDatabase();
      const updatedUsers = (db.users || users).map(u => 
        u.id === targetUser.id ? { ...u, status: newStatus } : u
      );
      await saveDatabase({ ...db, users: updatedUsers });
      setUsers(updatedUsers);
    } catch (e) {
      console.error('Failed to toggle status', e);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const totalUsers  = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const adminUsers  = users.filter(u => u.role === 'super_admin' || u.role === 'administrator').length;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={28} color="var(--accent-primary, #3b82f6)" />
            User Management & Access Control (RBAC)
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.88rem' }}>
            Manage software login accounts, assign roles, and grant granular service permissions
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px' }}>
          <UserPlus size={18} />
          Create New User
        </button>
      </header>

      {/* Success Notification Banner */}
      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px', padding: '12px 18px', color: '#34d399', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(15,23,42,0.6)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
            <UsersIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Accounts</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>{totalUsers}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(15,23,42,0.6)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Users</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>{activeUsers}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(15,23,42,0.6)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Administrators</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>{adminUsers}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', background: 'rgba(15,23,42,0.6)', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#64748b" />
          <input 
            className="input-field" 
            placeholder="Search by name, username or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ margin: 0 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="#64748b" />
            <select className="input-field" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ margin: 0, width: '150px', background: 'rgba(15,23,42,0.8)' }}>
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="administrator">Admin</option>
              <option value="manager">Manager</option>
              <option value="sales_rep">Sales Rep</option>
              <option value="accountant">Accountant</option>
              <option value="staff">Staff</option>
            </select>
          </div>

          <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ margin: 0, width: '130px', background: 'rgba(15,23,42,0.8)' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', background: 'rgba(15,23,42,0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 18px' }}>User Details</th>
                <th style={{ padding: '14px 18px' }}>Role</th>
                <th style={{ padding: '14px 18px' }}>Allowed Service Access</th>
                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No users found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const userPerms = Array.isArray(u.permissions) ? u.permissions : (PRESETS[u.role] || []);
                  const isSuper = u.role === 'super_admin';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                      
                      {/* User Info */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isSuper ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                            {u.name?.substring(0, 2).toUpperCase() || 'US'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.92rem' }}>{u.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                              <span>@{u.username}</span> • <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          background: isSuper ? 'rgba(168,85,247,0.15)' : u.role === 'administrator' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)',
                          color: isSuper ? '#c084fc' : u.role === 'administrator' ? '#60a5fa' : '#cbd5e1',
                          border: isSuper ? '1px solid rgba(168,85,247,0.3)' : u.role === 'administrator' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.1)'
                        }}>
                          {u.role ? u.role.replace(/_/g, ' ') : 'Staff'}
                        </span>
                      </td>

                      {/* Permissions Badges */}
                      <td style={{ padding: '14px 18px' }}>
                        {isSuper ? (
                          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Shield size={14} /> Full System Access (All Services)
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '350px' }}>
                            {userPerms.map(pkey => {
                              const moduleInfo = MODULE_LIST.find(m => m.key === pkey);
                              return (
                                <span key={pkey} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.72rem', color: '#e2e8f0' }}>
                                  {moduleInfo ? `${moduleInfo.icon} ${moduleInfo.label}` : pkey}
                                </span>
                              );
                            })}
                            {userPerms.length === 0 && <span style={{ fontSize: '0.75rem', color: '#f87171' }}>No Services Granted</span>}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button 
                          onClick={() => toggleStatus(u)}
                          disabled={isSuper}
                          style={{ background: 'transparent', border: 'none', cursor: isSuper ? 'not-allowed' : 'pointer' }}
                          title={isSuper ? 'Super admin status cannot be changed' : 'Click to toggle status'}
                        >
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: 600, 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: u.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: u.status === 'active' ? '#34d399' : '#f87171',
                            border: u.status === 'active' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)'
                          }}>
                            {u.status === 'active' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          
                          {/* Edit User & Permissions */}
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            onClick={() => handleOpenEditModal(u)}
                            title="Edit User & Access Permissions"
                          >
                            <Edit3 size={14} /> Edit Access
                          </button>

                          {/* Reset Password */}
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)' }}
                            onClick={() => { setResetTargetUser(u); setNewPassword(''); setShowResetModal(true); }}
                            title="Reset Password"
                          >
                            <Key size={14} />
                          </button>

                          {/* Delete User */}
                          {!isSuper && (
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
                              onClick={() => handleDeleteUser(u)}
                              title="Delete User Account"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User & Permissions Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '850px', maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', background: 'var(--surface-elevated, #1e293b)', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.5)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#f8fafc', fontWeight: 600 }}>
                    {editUser ? `Edit Access & User — ${editUser.name}` : 'Create New System User'}
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                    Define login credentials, system roles, and service permissions
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {errorMsg && (
                  <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', padding: '10px 14px', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
                    {errorMsg}
                  </div>
                )}

                {/* Section 1: User Profile & Credentials */}
                <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#60a5fa', marginBottom: '14px' }}>
                    Section 1: Account Credentials & Role
                  </div>
                  
                  <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Full Name *</label>
                      <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ali Ahmed" required />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Username (Login ID) *</label>
                      <input className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="e.g. ali.ahmed" required />
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Email Address *</label>
                      <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ali@company.com" required />
                    </div>

                    {!editUser && (
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">Initial Password *</label>
                        <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" required={!editUser} />
                      </div>
                    )}

                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">User Role</label>
                      <select className="input-field" value={formData.role} onChange={e => handleRolePresetSelect(e.target.value)} style={{ background: 'rgba(15,23,42,0.8)' }}>
                        <option value="super_admin">Super Admin (Full Control)</option>
                        <option value="administrator">Administrator</option>
                        <option value="manager">General Manager</option>
                        <option value="sales_rep">Sales Agent / Officer</option>
                        <option value="accountant">Accountant / Finance</option>
                        <option value="staff">Staff User (Restricted)</option>
                      </select>
                    </div>

                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Account Status</label>
                      <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ background: 'rgba(15,23,42,0.8)' }}>
                        <option value="active">Active (Can Login)</option>
                        <option value="inactive">Inactive (Disabled)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Service & Module Access Permissions */}
                <div style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#a78bfa' }}>
                        Section 2: Service & Module Access Control (Permissions)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                        Check which software services this user is allowed to view and manage
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={selectAllPermissions}>
                        Select All
                      </button>
                      <button type="button" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={deselectAllPermissions}>
                        Deselect All
                      </button>
                    </div>
                  </div>

                  {formData.role === 'super_admin' ? (
                    <div style={{ padding: '14px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', color: '#c084fc', fontSize: '0.85rem' }}>
                      <Shield size={16} style={{ display: 'inline', marginRight: '6px' }} />
                      Super Admins automatically have unrestricted access to all services and settings.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
                      {MODULE_LIST.map(mod => {
                        const isChecked = formData.permissions.includes(mod.key);

                        return (
                          <div 
                            key={mod.key} 
                            onClick={() => togglePermission(mod.key)}
                            style={{ 
                              padding: '12px', 
                              borderRadius: '8px', 
                              border: isChecked ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                              background: isChecked ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'space-between',
                              transition: 'all 0.12s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{mod.icon}</span>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isChecked ? '#f8fafc' : '#94a3b8' }}>
                                  {mod.label}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{mod.category}</div>
                              </div>
                            </div>

                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              border: isChecked ? '1px solid #3b82f6' : '1px solid #64748b',
                              background: isChecked ? '#3b82f6' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              marginLeft: 'auto'
                            }}>
                              {isChecked && <Check size={14} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.7)', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px' }}>
                  {editUser ? 'Save Access Changes' : 'Create User Account'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resetTargetUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '420px', maxWidth: '100%', background: 'var(--surface-elevated, #1e293b)', padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Reset Password — {resetTargetUser.name}</h2>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18}/></button>
            </div>
            
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">New Password *</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Enter new password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResetPassword}>Update Password</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
