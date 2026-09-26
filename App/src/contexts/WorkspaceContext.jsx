import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadDatabase, saveDatabase } from '../utils/db';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

const ACTIVE_WS_KEY = 'erp_active_workspace';

export function WorkspaceProvider({ children }) {
  const { currentUser, isAuthenticated } = useAuth();

  const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
  const [currentWorkspace,    setCurrentWorkspace]    = useState(null);
  const [memberships,         setMemberships]         = useState([]);
  const [isLoading,           setIsLoading]           = useState(true);
  const [connectionStatus,    setConnectionStatus]    = useState('unknown'); // unknown|online|offline|syncing

  // ── Load workspace data when user is authenticated ────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      setAvailableWorkspaces([]);
      setCurrentWorkspace(null);
      setIsLoading(false);
      return;
    }

    (async () => {
      setIsLoading(true);
      try {
        const db         = await loadDatabase();
        let allWS        = db.workspaces || [];
        const allMembers = db.workspaceMemberships || [];

        // Fallback default workspaces if database does not have workspaces yet
        if (!allWS || allWS.length === 0) {
          allWS = [
            {
              id: 'WS-001',
              name: 'RAK Tech Soft Hub',
              companyName: 'RAK Tech Soft Hub',
              type: 'main',
              environment: 'production',
              description: 'Primary business workspace',
              status: 'active',
              enabledModules: [
                'dashboard','crm','sales','invoices','purchasing','inventory',
                'accounting','hr','ledgers','tasks','projects','warehouse',
                'support','marketing','reports','settings','docs'
              ]
            },
            {
              id: 'WS-002',
              name: 'RAK Tech Branch / Demo',
              companyName: 'RAK Tech Branch',
              type: 'branch',
              environment: 'demo',
              description: 'Secondary workspace for branch office / demo',
              status: 'active',
              enabledModules: [
                'dashboard','crm','sales','invoices','inventory','accounting'
              ]
            }
          ];
          await saveDatabase({ ...db, workspaces: allWS });
        }

        // Filter memberships for this user
        const userMemberships = allMembers.filter(
          m => m.userId === currentUser.id && m.status === 'active'
        );

        // Super admin sees all active workspaces; others see only their memberships
        let accessible;
        if (currentUser.role === 'super_admin') {
          accessible = allWS.filter(ws => ws.status !== 'archived');
        } else if (userMemberships.length > 0) {
          const wsIds = new Set(userMemberships.map(m => m.workspaceId));
          accessible  = allWS.filter(ws => wsIds.has(ws.id) && ws.status !== 'archived');
        } else {
          // Fallback if no membership explicit: give access to main workspace
          accessible = allWS.filter(ws => ws.id === 'WS-001');
        }

        setMemberships(userMemberships);
        setAvailableWorkspaces(accessible);

        // Try to restore last active workspace
        const savedId = localStorage.getItem(ACTIVE_WS_KEY);
        if (savedId) {
          const saved = accessible.find(ws => ws.id === savedId);
          if (saved) {
            setCurrentWorkspace(saved);
            setIsLoading(false);
            return;
          }
        }

        // Auto-select if only one workspace
        if (accessible.length === 1) {
          setCurrentWorkspace(accessible[0]);
          localStorage.setItem(ACTIVE_WS_KEY, accessible[0].id);
        }

        setConnectionStatus('online');
      } catch (e) {
        console.error('[Workspace] Load error:', e);
        setConnectionStatus('offline');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated, currentUser]);

  // ── Switch workspace ──────────────────────────────────────────────────────────
  const switchWorkspace = useCallback(async (workspaceId) => {
    const ws = availableWorkspaces.find(w => w.id === workspaceId);
    if (!ws) return;

    setCurrentWorkspace(ws);
    localStorage.setItem(ACTIVE_WS_KEY, workspaceId);

    // Update lastOpenedAt in membership
    try {
      const db      = await loadDatabase();
      const members = (db.workspaceMemberships || []).map(m =>
        m.userId === currentUser.id && m.workspaceId === workspaceId
          ? { ...m, lastOpenedAt: new Date().toISOString() }
          : m
      );
      await saveDatabase({ ...db, workspaceMemberships: members });
    } catch (e) {
      console.warn('[Workspace] Could not update lastOpenedAt:', e.message);
    }
  }, [availableWorkspaces, currentUser]);

  // ── Clear workspace on logout ─────────────────────────────────────────────────
  const clearWorkspace = useCallback(() => {
    setCurrentWorkspace(null);
    localStorage.removeItem(ACTIVE_WS_KEY);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const isModuleEnabled = useCallback((moduleKey) => {
    if (!currentWorkspace) return false;
    return (currentWorkspace.enabledModules || []).includes(moduleKey);
  }, [currentWorkspace]);

  const getMembership = useCallback((workspaceId) => {
    return memberships.find(m => m.workspaceId === workspaceId);
  }, [memberships]);

  const currentMembership = currentWorkspace
    ? getMembership(currentWorkspace.id)
    : null;

  // ── Reload workspaces ────────────────────────────────────────────────────────
  const reloadWorkspaces = useCallback(async () => {
    if (!currentUser) return;
    try {
      const db         = await loadDatabase();
      const allWS      = db.workspaces || [];
      const allMembers = db.workspaceMemberships || [];

      const userMemberships = allMembers.filter(
        m => m.userId === currentUser.id && m.status === 'active'
      );

      let accessible;
      if (currentUser.role === 'super_admin') {
        accessible = allWS.filter(ws => ws.status !== 'archived');
      } else if (userMemberships.length > 0) {
        const wsIds = new Set(userMemberships.map(m => m.workspaceId));
        accessible  = allWS.filter(ws => wsIds.has(ws.id) && ws.status !== 'archived');
      } else {
        accessible = allWS.filter(ws => ws.id === 'WS-001');
      }

      setMemberships(userMemberships);
      setAvailableWorkspaces(accessible);
    } catch (e) {
      console.error('[Workspace] Reload error:', e);
    }
  }, [currentUser]);

  // ── Create new workspace (Super Admin) ───────────────────────────────────────
  const createWorkspace = useCallback(async (newWS) => {
    try {
      const db = await loadDatabase();
      const workspaces = db.workspaces || [];
      const updated = [...workspaces, newWS];
      await saveDatabase({ ...db, workspaces: updated });
      await reloadWorkspaces();
      return true;
    } catch (e) {
      console.error('[Workspace] Create error:', e);
      return false;
    }
  }, [reloadWorkspaces]);

  const value = {
    currentWorkspace,
    availableWorkspaces,
    memberships,
    currentMembership,
    isLoading,
    connectionStatus,
    switchWorkspace,
    clearWorkspace,
    isModuleEnabled,
    getMembership,
    reloadWorkspaces,
    createWorkspace,
    needsWorkspaceSelection: isAuthenticated && !currentWorkspace && !isLoading,
    hasMultipleWorkspaces  : availableWorkspaces.length > 1
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
