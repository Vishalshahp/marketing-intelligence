import React, { useState } from 'react';
import { X, Check, AlertTriangle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function ColumnMappingModal({
  isOpen,
  onClose,
  filename,
  headers = [],
  previewRows = [],
  suggestedMapping = {},
  detectedPreset,
  onConfirm
}) {
  const [mapping, setMapping] = useState({
    date: suggestedMapping.date || '',
    campaign_name: suggestedMapping.campaign_name || '',
    campaign_id: suggestedMapping.campaign_id || '',
    channel: suggestedMapping.channel || '',
    spend: suggestedMapping.spend || '',
    impressions: suggestedMapping.impressions || '',
    clicks: suggestedMapping.clicks || '',
    conversions: suggestedMapping.conversions || '',
    revenue: suggestedMapping.revenue || '',
    leads: suggestedMapping.leads || ''
  });

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const targetFields = [
    { key: 'campaign_name', label: 'Campaign Name', required: true, desc: 'Name of the ad campaign' },
    { key: 'spend', label: 'Spend / Cost', required: true, desc: 'Ad spend in active currency' },
    { key: 'clicks', label: 'Clicks / Link Clicks', required: true, desc: 'Total outbound clicks' },
    { key: 'impressions', label: 'Impressions', required: true, desc: 'Total ad exposures' },
    { key: 'date', label: 'Date', required: false, desc: 'Reporting date (YYYY-MM-DD)' },
    { key: 'channel', label: 'Channel / Platform', required: false, desc: 'META, GOOGLE, LINKEDIN' },
    { key: 'conversions', label: 'Conversions / Orders', required: false, desc: 'Tracked purchases or outcomes' },
    { key: 'revenue', label: 'Revenue / Value', required: false, desc: 'Leave empty if untracked (prevents $0 skew)' },
    { key: 'campaign_id', label: 'Campaign ID', required: false, desc: 'External slug or identifier' },
    { key: 'leads', label: 'Leads', required: false, desc: 'Lead generation form fills' }
  ];

  const handleSelectChange = (key, val) => {
    setMapping(prev => ({ ...prev, [key]: val }));
  };

  const handleCommit = () => {
    if (!mapping.campaign_name || !mapping.spend || !mapping.clicks || !mapping.impressions) {
      alert('Please map all mandatory fields: Campaign Name, Spend, Clicks, and Impressions.');
      return;
    }
    setSubmitting(true);
    onConfirm(mapping);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50">
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-canvas/40">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-text">Verify & Map CSV Columns</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-light text-blue flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Detected: {detectedPreset || 'Smart Match'}</span>
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              File: <span className="font-mono text-text font-medium">{filename}</span> • Sanitizer active for spreadsheet formula injection defense.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-canvas text-muted hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Security Notice */}
          <div className="p-3.5 bg-canvas rounded-xl border border-border flex items-start space-x-3 text-xs text-text">
            <ShieldCheck className="w-4 h-4 text-teal shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-navy">CSV Injection Protection Active:</span>
              <p className="text-muted mt-0.5">
                All uploaded strings starting with dangerous formula triggers (<code className="text-error font-mono">= + - @ \t \r</code>) will be safely escaped to prevent remote spreadsheet execution.
              </p>
            </div>
          </div>

          {/* Mapping Grid */}
          <div>
            <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-3">
              Field Mappings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {targetFields.map((field) => {
                const selectedVal = mapping[field.key] || '';
                const isMatched = Boolean(selectedVal);
                return (
                  <div
                    key={field.key}
                    className={`p-3.5 rounded-xl border transition-all ${
                      field.required && !isMatched
                        ? 'border-warning/60 bg-amber-50/20'
                        : isMatched
                        ? 'border-border bg-surface'
                        : 'border-border/60 bg-canvas/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-text flex items-center space-x-1.5">
                        <span>{field.label}</span>
                        {field.required && (
                          <span className="text-[10px] text-error font-bold">*Required</span>
                        )}
                      </label>
                      {isMatched && (
                        <span className="text-[10px] text-success flex items-center space-x-0.5 font-medium">
                          <Check className="w-3 h-3" />
                          <span>Mapped</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted mb-2">{field.desc}</p>
                    <select
                      value={selectedVal}
                      onChange={(e) => handleSelectChange(field.key, e.target.value)}
                      className="w-full text-xs bg-canvas border border-border rounded-lg px-2.5 py-1.5 font-medium text-text focus:outline-none focus:ring-1 focus:ring-blue"
                    >
                      <option value="">-- Do not map --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Data Preview */}
          {previewRows.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-2">
                Sample Row Preview (First 3 Rows)
              </h3>
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-canvas text-muted border-b border-border font-semibold">
                    <tr>
                      {headers.slice(0, 6).map((h) => (
                        <th key={h} className="px-3 py-2">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {previewRows.slice(0, 3).map((row, idx) => (
                      <tr key={idx} className="hover:bg-canvas/30">
                        {headers.slice(0, 6).map((h) => (
                          <td key={h} className="px-3 py-2 font-mono text-muted">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-canvas/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted hover:text-text rounded-lg hover:bg-canvas transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleCommit}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-lg bg-blue hover:bg-blue-hover text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
          >
            <span>{submitting ? 'Sanitizing & Importing...' : 'Commit & Import Rows'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
