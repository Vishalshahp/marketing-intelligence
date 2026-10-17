import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatCurrency, formatPercent, formatNumber, formatDate } from '../utils/formatters';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  ShieldCheck,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function ReportsPage() {
  const { activeWorkspace, currency, showToast } = useWorkspace();
  const [channel, setChannel] = useState('ALL');
  const [dateRange, setDateRange] = useState('30'); // 7, 30, 90, ALL
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchReportSummary = async () => {
    try {
      setLoading(true);
      const payload = {
        format: 'json',
        channel
      };
      if (dateRange !== 'ALL') {
        const d = new Date();
        d.setDate(d.getDate() - parseInt(dateRange, 10));
        payload.start_date = d.toISOString().split('T')[0];
      }

      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': activeWorkspace?._id || ''
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setReportData(json);
      }
    } catch (err) {
      console.error('Failed to load report summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportSummary();
  }, [activeWorkspace, channel, dateRange]);

  const handleDownloadCSV = async () => {
    try {
      setExporting(true);
      const payload = {
        format: 'csv',
        channel
      };
      if (dateRange !== 'ALL') {
        const d = new Date();
        d.setDate(d.getDate() - parseInt(dateRange, 10));
        payload.start_date = d.toISOString().split('T')[0];
      }

      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': activeWorkspace?._id || ''
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hezal_report_${activeWorkspace?.name?.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Sanitized CSV exported successfully!');
      }
    } catch (err) {
      showToast('Failed to export CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">Audit & Executive Reports</h1>
          <p className="text-xs text-muted mt-1">
            Generate verifiable reports with documented metric definitions and sanitized spreadsheet downloads.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-navy hover:bg-canvas text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-muted" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={exporting}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue hover:bg-blue-hover text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Generating...' : 'Export Sanitized CSV'}</span>
          </button>
        </div>
      </div>

      {/* Scope Selector (Hidden in Print) */}
      <div className="no-print bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted" />
          <span className="font-semibold text-navy">Date Window:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-canvas border border-border rounded-md px-2.5 py-1 font-medium text-text focus:outline-none"
          >
            <option value="7">Past 7 Days</option>
            <option value="30">Past 30 Days</option>
            <option value="90">Past 90 Days</option>
            <option value="ALL">Entire Recorded History</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted" />
          <span className="font-semibold text-navy">Channel Scope:</span>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="bg-canvas border border-border rounded-md px-2.5 py-1 font-medium text-text focus:outline-none"
          >
            <option value="ALL">All Channels</option>
            <option value="META">Meta Ads Only</option>
            <option value="GOOGLE">Google Ads Only</option>
            <option value="LINKEDIN">LinkedIn Ads Only</option>
          </select>
        </div>

        <div className="ml-auto text-[11px] text-muted flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          <span>Formula defense active on export</span>
        </div>
      </div>

      {/* Report Document Container (Printable) */}
      <div className="bg-surface rounded-2xl border border-border p-8 shadow-sm space-y-8">
        {/* Document Header */}
        <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xl font-black text-navy tracking-tight">HEZAL MARKETING INTELLIGENCE</span>
              <span className="px-2 py-0.5 rounded bg-blue-light text-blue font-mono text-[10px] font-bold">
                OFFICIAL REPORT
              </span>
            </div>
            <p className="text-xs text-muted">
              Workspace: <strong className="text-navy">{activeWorkspace?.name}</strong> • Evaluated Currency: <strong className="text-navy">{currency}</strong>
            </p>
          </div>

          <div className="text-right text-xs text-muted font-mono">
            <span>Generated: {formatDate(new Date())}</span>
            <span className="block mt-0.5">Records Scoped: {reportData?.recordsCount || 0} rows</span>
          </div>
        </div>

        {/* Executive Summary Metrics Grid */}
        <div>
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
            1. Documented KPI Assertions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-canvas rounded-xl border border-border">
              <span className="text-[10px] text-muted block uppercase">Total Documented Spend</span>
              <span className="text-base font-bold text-navy">
                {formatCurrency(
                  reportData?.metrics?.reduce((s, m) => s + (m.spend || 0), 0) || 0,
                  currency
                )}
              </span>
            </div>

            <div className="p-3 bg-canvas rounded-xl border border-border">
              <span className="text-[10px] text-muted block uppercase">Total Verified Clicks</span>
              <span className="text-base font-bold text-navy">
                {formatNumber(
                  reportData?.metrics?.reduce((s, m) => s + (m.clicks || 0), 0) || 0
                )}
              </span>
            </div>

            <div className="p-3 bg-canvas rounded-xl border border-border">
              <span className="text-[10px] text-muted block uppercase">Total Conversions</span>
              <span className="text-base font-bold text-navy">
                {formatNumber(
                  reportData?.metrics?.reduce((s, m) => s + (m.conversions || 0), 0) || 0
                )}
              </span>
            </div>

            <div className="p-3 bg-canvas rounded-xl border border-border">
              <span className="text-[10px] text-muted block uppercase">Total Tracked Revenue</span>
              <span className="text-base font-bold text-teal">
                {formatCurrency(
                  reportData?.metrics?.reduce((s, m) => (m.is_revenue_tracked ? s + (m.revenue || 0) : s), 0) || 0,
                  currency
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Active Recommendations Section */}
        <div>
          <h2 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
            2. Heuristic Findings & Action Matrix ({reportData?.recommendations?.length || 0})
          </h2>
          <div className="space-y-3">
            {reportData?.recommendations?.map((r, i) => (
              <div key={i} className="p-3.5 bg-canvas rounded-xl border border-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy">[{r.rule_id}] {r.campaign_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface border border-border">
                    {r.severity}
                  </span>
                </div>
                <p className="text-muted">{r.observation}</p>
                <p className="text-blue font-medium pt-1">Action: {r.action_to_consider}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Disclaimer Footer */}
        <div className="pt-6 border-t border-border text-[11px] text-muted leading-relaxed">
          <strong className="text-navy">Auditing Protocol:</strong> All calculations in this report obey the division-by-zero boundary rules of Project Hezal Master Specification 2.0.0. Missing revenue fields are preserved as untracked to strictly avoid artificial $0 distortion.
        </div>
      </div>
    </div>
  );
}
