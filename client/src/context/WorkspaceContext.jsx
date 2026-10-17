import React, { createContext, useContext, useState, useEffect } from 'react';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        const active = data.workspaces?.find(w => w._id === data.activeWorkspaceId) || data.workspaces?.[0];
        if (active) {
          setActiveWorkspace(active);
          setCurrency(active.settings?.currency || 'USD');
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const switchWorkspace = async (workspaceId) => {
    try {
      const res = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveWorkspace(data.workspace);
        setCurrency(data.workspace.settings?.currency || 'USD');
        showToast(`Switched to ${data.workspace.name}`);
        return true;
      }
    } catch (err) {
      showToast('Failed to switch workspace', 'error');
    }
    return false;
  };

  const updateCurrency = async (newCurrency) => {
    try {
      const res = await fetch('/api/workspaces/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': activeWorkspace?._id || ''
        },
        body: JSON.stringify({ currency: newCurrency })
      });
      if (res.ok) {
        setCurrency(newCurrency);
        setActiveWorkspace(prev => ({
          ...prev,
          settings: { ...prev?.settings, currency: newCurrency }
        }));
        showToast(`Currency updated to ${newCurrency}`);
      }
    } catch (err) {
      showToast('Failed to update currency', 'error');
    }
  };

  const resetDemoData = async () => {
    try {
      const res = await fetch('/api/workspaces/reset-demo', {
        method: 'POST',
        headers: { 'x-workspace-id': activeWorkspace?._id || '' }
      });
      if (res.ok) {
        showToast('Demo dataset successfully refreshed with 90-day records!');
        window.location.reload();
      }
    } catch (err) {
      showToast('Failed to reset demo dataset', 'error');
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        currency,
        loading,
        switchWorkspace,
        updateCurrency,
        resetDemoData,
        showToast,
        fetchWorkspaces
      }}
    >
      {children}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-error text-white'
              : 'bg-navy text-white border border-border'
          }`}
        >
          {toast.message}
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
