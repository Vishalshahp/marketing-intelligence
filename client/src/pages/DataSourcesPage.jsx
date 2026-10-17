import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import ColumnMappingModal from '../components/ColumnMappingModal';
import { formatDate } from '../utils/formatters';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  FileText,
  Clock
} from 'lucide-react';

export default function DataSourcesPage() {
  const { activeWorkspace, showToast } = useWorkspace();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadPayload, setUploadPayload] = useState(null);

  const fileInputRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/imports/history', {
        headers: { 'x-workspace-id': activeWorkspace?._id || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch import history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeWorkspace]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast('Please upload a valid .csv file', 'error');
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/imports/upload', {
        method: 'POST',
        headers: { 'x-workspace-id': activeWorkspace?._id || '' },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload CSV');
      }

      const data = await res.json();
      setUploadPayload(data);
      setModalOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmMapping = async (mapping) => {
    if (!uploadPayload) return;

    try {
      const res = await fetch('/api/imports/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': activeWorkspace?._id || ''
        },
        body: JSON.stringify({
          filename: uploadPayload.filename,
          fileSize: uploadPayload.fileSize,
          rows: uploadPayload.rawContentSample,
          mapping
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to confirm import');
      }

      const result = await res.json();
      showToast(`Successfully imported ${result.insertedCount} rows with formula sanitization!`);
      setModalOpen(false);
      setUploadPayload(null);
      fetchHistory();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRollback = async (jobId) => {
    if (!confirm('Are you sure you want to roll back this imported batch? All associated daily metrics will be removed.')) {
      return;
    }

    try {
      const res = await fetch(`/api/imports/${jobId}`, {
        method: 'DELETE',
        headers: { 'x-workspace-id': activeWorkspace?._id || '' }
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Batch rolled back.');
        fetchHistory();
      } else {
        showToast('Failed to rollback batch', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">Data Ingestion Engine</h1>
          <p className="text-xs text-muted mt-1">
            Ingest Meta Ads, Google Ads, or custom CSV exports with automated column detection and formula injection defense.
          </p>
        </div>

        <a
          href="/api/imports/template"
          download="hezal_campaign_template.csv"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-surface hover:bg-canvas border border-border text-navy text-xs font-semibold shadow-sm transition-colors"
        >
          <Download className="w-4 h-4 text-blue" />
          <span>Download Standard CSV Template</span>
        </a>
      </div>

      {/* Upload Zone & Instructions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Dropzone */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border-2 border-dashed border-border hover:border-blue transition-colors p-8 text-center flex flex-col items-center justify-center relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadLoading}
          />
          <div className="w-14 h-14 rounded-2xl bg-blue-light text-blue flex items-center justify-center mb-4">
            {uploadLoading ? (
              <RefreshCw className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-base font-bold text-navy mb-1">
            {uploadLoading ? 'Inspecting CSV Structure...' : 'Drop your marketing CSV here or click to browse'}
          </h3>
          <p className="text-xs text-muted max-w-md mb-4">
            Supports Meta Ads exports, Google Ads campaign reports, LinkedIn campaign manager CSVs, or the standard Hezal format.
          </p>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-canvas border border-border text-[11px] text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-teal" />
            <span>Automatic Formula Sanitization Active (=, +, -, @)</span>
          </div>
        </div>

        {/* Audit Guidance Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-navy mb-2 flex items-center space-x-1.5">
              <FileSpreadsheet className="w-4 h-4 text-teal" />
              <span>Ingestion Guardrails</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-muted">
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue shrink-0 mt-1.5" />
                <span>
                  <strong className="text-text">Missing Revenue:</strong> If your export does not track conversions, leave the revenue column unmapped. ROAS will remain cleanly untracked.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0 mt-1.5" />
                <span>
                  <strong className="text-text">Mandatory Fields:</strong> Campaign Name, Spend, Clicks, and Impressions are required for deterministic math.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-navy shrink-0 mt-1.5" />
                <span>
                  <strong className="text-text">Formula Neutralization:</strong> Cells starting with mathematical operators are quoted to stop CSV payload injection.
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <span className="text-[11px] text-muted block">
              Workspace Isolation: Every uploaded row is strictly partitioned under <code className="text-navy font-mono">{activeWorkspace?.name}</code>.
            </span>
          </div>
        </div>
      </div>

      {/* Ingestion History Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-navy">Upload Batches & Validation Logs</h2>
            <p className="text-xs text-muted">Audit trail of previously ingested datasets</p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-1.5 rounded-lg hover:bg-canvas text-muted hover:text-text transition-colors"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas text-navy border-b border-border font-bold">
              <tr>
                <th className="px-5 py-3">File Name</th>
                <th className="px-5 py-3">Import Date</th>
                <th className="px-5 py-3">Rows</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Validation Details</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-muted">
                    No custom CSV files imported yet for this workspace. Upload your first dataset above or explore the pre-seeded demo records!
                  </td>
                </tr>
              ) : (
                history.map((job) => (
                  <tr key={job._id} className="hover:bg-canvas/30">
                    <td className="px-5 py-3.5 font-semibold text-navy flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue shrink-0" />
                      <span>{job.filename}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{formatDate(job.created_at)}</td>
                    <td className="px-5 py-3.5 font-mono text-text">{job.row_count} rows</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          job.status === 'COMPLETED'
                            ? 'bg-success-light text-success'
                            : job.status === 'FAILED'
                            ? 'bg-error-light text-error'
                            : 'bg-warning-light text-warning'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {job.validation_errors?.length > 0 ? (
                        <span className="text-warning flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{job.validation_errors.length} skipped row(s)</span>
                        </span>
                      ) : (
                        <span className="text-success flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>100% Validated</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRollback(job._id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs text-error hover:bg-error-light rounded-lg transition-colors"
                        title="Rollback batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Rollback</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Column Mapping Modal */}
      {uploadPayload && (
        <ColumnMappingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          filename={uploadPayload.filename}
          headers={uploadPayload.headers}
          previewRows={uploadPayload.previewRows}
          suggestedMapping={uploadPayload.suggestedMapping}
          detectedPreset={uploadPayload.detectedPreset}
          onConfirm={handleConfirmMapping}
        />
      )}
    </div>
  );
}
