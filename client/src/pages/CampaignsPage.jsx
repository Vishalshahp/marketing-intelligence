import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  ExternalLink
} from 'lucide-react';

export default function CampaignsPage() {
  const { activeWorkspace, currency } = useWorkspace();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('ALL');
  const [sortBy, setSortBy] = useState('spend');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (channel !== 'ALL') params.append('channel', channel);
      if (search) params.append('search', search);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);

      const res = await fetch(`/api/campaigns?${params.toString()}`, {
        headers: { 'x-workspace-id': activeWorkspace?._id || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [activeWorkspace, channel, search, sortBy, sortOrder]);

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const selectedCampaigns = campaigns.filter(c => selectedIds.includes(c.campaign_id));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">Campaign Comparison & Matrix</h1>
          <p className="text-xs text-muted mt-1">
            Sortable cross-channel directory with multi-select comparison and deterministic KPI proofs.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <div className="inline-flex items-center space-x-2 bg-blue-light text-blue px-3 py-1.5 rounded-lg text-xs font-semibold">
            <span>{selectedIds.length} campaigns selected for comparison</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-muted hover:text-text ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by campaign name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-canvas border border-border rounded-lg pl-9 pr-3 py-2 text-text focus:outline-none focus:ring-1 focus:ring-blue"
            />
          </div>

          {/* Channel Filter */}
          <div className="inline-flex rounded-lg bg-canvas border border-border p-0.5 text-xs">
            {['ALL', 'META', 'GOOGLE', 'LINKEDIN'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  channel === ch ? 'bg-surface text-navy font-bold shadow-sm' : 'text-muted hover:text-text'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-muted font-medium">
          Showing {campaigns.length} campaigns
        </span>
      </div>

      {/* Multi-Select Comparison Modal / Drawer if 2+ selected */}
      {selectedCampaigns.length >= 2 && (
        <div className="p-5 bg-navy text-white rounded-2xl shadow-xl space-y-4 animate-in fade-in-50">
          <div className="flex items-center justify-between border-b border-navy-light/40 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-teal" />
              <span className="text-sm font-bold">Side-by-Side Comparison Matrix</span>
            </div>
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-300 hover:text-white"
            >
              Clear Selection
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCampaigns.map(c => (
              <div key={c.campaign_id} className="p-4 rounded-xl bg-navy-light/40 border border-navy-light space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-white leading-tight">{c.campaign_name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue text-white font-mono">{c.channel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-navy-light/40">
                  <div>
                    <span className="text-muted block">Spend</span>
                    <span className="font-bold">{formatCurrency(c.spend, currency)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">CTR</span>
                    <span className="font-bold">{c.ctr !== null ? formatPercent(c.ctr) : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Conversions</span>
                    <span className="font-bold">{c.conversions !== null ? formatNumber(c.conversions) : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted block">CPA</span>
                    <span className="font-bold">{c.cpa !== null ? formatCurrency(c.cpa, currency) : 'N/A'}</span>
                  </div>
                </div>
                <Link
                  to={`/app/campaigns/${c.campaign_id}`}
                  className="mt-2 block text-center py-1 rounded bg-teal/20 hover:bg-teal/30 text-teal text-xs font-semibold transition-colors"
                >
                  View Drill-down
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas text-navy border-b border-border font-bold">
              <tr>
                <th className="px-4 py-3.5 w-10">Select</th>
                <th
                  onClick={() => handleSort('campaign_name')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-canvas/80"
                >
                  <div className="flex items-center space-x-1">
                    <span>Campaign Name</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Channel</th>
                <th
                  onClick={() => handleSort('spend')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-canvas/80 text-right"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Spend</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-right">Impressions</th>
                <th className="px-4 py-3.5 text-right">Clicks</th>
                <th
                  onClick={() => handleSort('ctr')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-canvas/80 text-right"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>CTR</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-right">CPC</th>
                <th
                  onClick={() => handleSort('conversions')}
                  className="px-4 py-3.5 cursor-pointer hover:bg-canvas/80 text-right"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Conversions</span>
                    <ArrowUpDown className="w-3 h-3 text-muted" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-right">CPA</th>
                <th className="px-4 py-3.5 text-right">ROAS</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-5 py-8 text-center text-muted">
                    No campaigns matched the current filters.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const isSelected = selectedIds.includes(c.campaign_id);
                  return (
                    <tr
                      key={c.campaign_id}
                      onClick={() => navigate(`/app/campaigns/${c.campaign_id}`)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-light/30' : 'hover:bg-canvas/40'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={(e) => toggleSelect(c.campaign_id, e)}
                          className="text-muted hover:text-blue"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-navy max-w-xs truncate">
                        {c.campaign_name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.channel === 'META'
                              ? 'bg-blue/10 text-blue'
                              : c.channel === 'GOOGLE'
                              ? 'bg-teal/10 text-teal'
                              : 'bg-navy/10 text-navy'
                          }`}
                        >
                          {c.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-text text-right">
                        {formatCurrency(c.spend, currency)}
                      </td>
                      <td className="px-4 py-3.5 text-muted text-right">
                        {formatNumber(c.impressions)}
                      </td>
                      <td className="px-4 py-3.5 text-muted text-right">
                        {formatNumber(c.clicks)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-text text-right">
                        {c.ctr !== null ? formatPercent(c.ctr) : <span className="text-muted">N/A</span>}
                      </td>
                      <td className="px-4 py-3.5 text-muted text-right">
                        {c.cpc !== null ? formatCurrency(c.cpc, currency) : <span className="text-muted">N/A</span>}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-text text-right">
                        {c.conversions !== null ? formatNumber(c.conversions) : <span className="text-muted">Untracked</span>}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-text text-right">
                        {c.cpa !== null ? formatCurrency(c.cpa, currency) : <span className="text-muted">N/A</span>}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-teal text-right">
                        {c.is_revenue_tracked && c.roas !== null ? (
                          `${c.roas.toFixed(2)}x`
                        ) : (
                          <span className="text-muted text-[10px]">Untracked</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center text-blue hover:text-blue-hover text-xs font-semibold">
                          <span>Drill-down</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
