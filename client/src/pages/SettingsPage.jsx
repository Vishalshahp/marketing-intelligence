import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  Settings,
  Building,
  DollarSign,
  Trash2,
  RefreshCw,
  ShieldAlert,
  CheckCircle,
  Database,
  Lock
} from 'lucide-react';

export default function SettingsPage() {
  const { activeWorkspace, currency, updateCurrency, resetDemoData, showToast } = useWorkspace();
  const [purging, setPurging] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handlePurge = async () => {
    if (!confirm(`Are you absolutely sure you want to PURGE all analytics data in workspace "${activeWorkspace?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setPurging(true);
      const res = await fetch('/api/workspaces/purge', {
        method: 'POST',
        headers: { 'x-workspace-id': activeWorkspace?._id || '' }
      });
      if (res.ok) {
        showToast('All workspace analytics data successfully purged.');
        window.location.reload();
      } else {
        showToast('Failed to purge workspace data', 'error');
      }
    } catch (err) {
      showToast('Error purging workspace data', 'error');
    } finally {
      setPurging(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      await resetDemoData();
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-navy tracking-tight">Workspace Settings</h1>
        <p className="text-xs text-muted mt-1">
          Manage currency standards, tenancy boundaries, and dataset lifecycle.
        </p>
      </div>

      {/* Tenancy & Currency Config */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-border pb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-light text-blue flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-navy">General Workspace Configuration</h2>
            <p className="text-xs text-muted">IDOR-scoped isolation boundary</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-text block mb-1.5">Workspace Name</label>
            <input
              type="text"
              readOnly
              value={activeWorkspace?.name || ''}
              className="w-full bg-canvas border border-border rounded-lg px-3 py-2 text-navy font-semibold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="font-semibold text-text block mb-1.5">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => updateCurrency(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text font-semibold focus:outline-none focus:ring-1 focus:ring-blue"
            >
              <option value="USD">$ USD - United States Dollar</option>
              <option value="INR">₹ INR - Indian Rupee</option>
              <option value="EUR">€ EUR - Euro</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-text block mb-1.5">Tenant Boundary ID (Internal)</label>
            <input
              type="text"
              readOnly
              value={activeWorkspace?._id || ''}
              className="w-full bg-canvas border border-border rounded-lg px-3 py-2 font-mono text-[11px] text-muted cursor-not-allowed"
            />
          </div>

          <div>
            <label className="font-semibold text-text block mb-1.5">Tenancy Type</label>
            <div className="px-3 py-2 bg-canvas border border-border rounded-lg flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-teal" />
              <span className="font-medium text-text">
                {activeWorkspace?.is_demo ? 'Preloaded Demo Workspace' : 'Isolated Production Tenant'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Refresh Control */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-navy mb-1 flex items-center space-x-1.5">
            <RefreshCw className="w-4 h-4 text-blue" />
            <span>Reset / Re-seed 90-Day Synthetic Dataset</span>
          </h2>
          <p className="text-xs text-muted max-w-lg">
            Regenerates the complete 540-record multi-channel telemetry and 120 customer cohorts tailored for faculty defense demonstrations.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-navy hover:bg-navy-light text-white text-xs font-semibold shadow transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Re-seed Demo Data'}</span>
        </button>
      </div>

      {/* Danger Zone: Data Purge */}
      <div className="bg-surface rounded-2xl border border-error/30 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 text-error">
          <ShieldAlert className="w-5 h-5" />
          <h2 className="text-sm font-bold">Danger Zone: Workspace Data Purge</h2>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Executes an immediate cascading deletion of all daily campaign metrics, uploaded import batches, and customer cohorts in this workspace. This guarantees zero-retention compliance under GDPR / CCPA.
        </p>

        <button
          onClick={handlePurge}
          disabled={purging}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-error hover:bg-rose-700 text-white text-xs font-semibold shadow transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{purging ? 'Purging Dataset...' : 'Purge All Workspace Data'}</span>
        </button>
      </div>
    </div>
  );
}
