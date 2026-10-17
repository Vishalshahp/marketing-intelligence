import React from 'react';
import { Sparkles, Calendar, Info, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatDate } from '../utils/formatters';

export default function FreshnessBanner({ lastSyncDate, totalRecords }) {
  const { activeWorkspace } = useWorkspace();
  const isDemo = activeWorkspace?.is_demo;

  return (
    <div className="bg-surface rounded-xl border border-border p-4 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start space-x-3.5">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isDemo ? 'bg-amber-50 text-warning' : 'bg-teal-light text-teal'
          }`}
        >
          {isDemo ? <Sparkles className="w-5 h-5 text-warning" /> : <Calendar className="w-5 h-5 text-teal" />}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-text">
              {isDemo ? 'Active Workspace: Acme Global (Preloaded Demo)' : activeWorkspace?.name}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase ${
                isDemo
                  ? 'bg-warning-light text-warning border border-amber-200'
                  : 'bg-success-light text-success border border-emerald-200'
              }`}
            >
              {isDemo ? 'Synthetic Demo Data' : 'Live Workspace'}
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5 flex items-center space-x-2">
            <span>
              {totalRecords || 0} multi-channel daily records loaded
            </span>
            <span>•</span>
            <span>
              Last Record: {lastSyncDate ? formatDate(lastSyncDate) : 'Synchronized'}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 self-end md:self-auto">
        {isDemo ? (
          <Link
            to="/app/data-sources"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue text-white hover:bg-blue-hover shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import Your Own CSV</span>
          </Link>
        ) : (
          <Link
            to="/app/data-sources"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-canvas hover:bg-surface text-text transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5 text-muted" />
            <span>Upload Dataset</span>
          </Link>
        )}
      </div>
    </div>
  );
}
