import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AppContext = createContext(null);

let _toastId = 0;

export function AppProvider({ children }) {
  const [toasts,        setToasts]        = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [globalSearch,  setGlobalSearch]  = useState('');
  const [isSearchOpen,  setIsSearchOpen]  = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('erp_sidebar_collapsed') === 'true';
  });
  const [appLauncherOpen, setAppLauncherOpen] = useState(false);
  const [notifPanelOpen,  setNotifPanelOpen]  = useState(false);

  // ── Toasts ───────────────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 300);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error  : (msg, dur) => addToast(msg, 'error',   dur || 6000),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info   : (msg, dur) => addToast(msg, 'info',    dur),
  };

  // ── Notifications ─────────────────────────────────────────────────────────────
  const addNotification = useCallback((notif) => {
    const n = { id: Date.now(), read: false, createdAt: new Date().toISOString(), ...notif };
    setNotifications(prev => [n, ...prev].slice(0, 100)); // cap at 100
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('erp_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  const value = {
    // Toasts
    toasts,
    addToast,
    removeToast,
    toast,
    // Notifications
    notifications,
    unreadCount,
    addNotification,
    markNotificationRead,
    markAllRead,
    notifPanelOpen,
    setNotifPanelOpen,
    // Search
    globalSearch,
    setGlobalSearch,
    isSearchOpen,
    setIsSearchOpen,
    // Sidebar
    sidebarCollapsed,
    toggleSidebar,
    // App launcher
    appLauncherOpen,
    setAppLauncherOpen,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
}
