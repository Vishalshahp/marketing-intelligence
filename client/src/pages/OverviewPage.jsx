import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import FreshnessBanner from '../components/FreshnessBanner';
import KPICard from '../components/KPICard';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import {
  DollarSign,
  Eye,
  MousePointer,
  Percent,
  Target,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Filter,
  BarChart2,
  PieChart as PieIcon,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { Link } from 'react-router-dom';

export default function OverviewPage() {
  const { activeWorkspace, currency } = useWorkspace();
  const [channel, setChannel] = useState('ALL');
  const [dateRange, setDateRange] = useState('90'); // 7, 30, 90
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [recommendationsCount, setRecommendationsCount] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (channel !== 'ALL') params.append('channel', channel);

      // Calculate start_date if filtering by 7 or 30 days
      if (dateRange !== 'ALL') {
        const d = new Date();
        d.setDate(d.getDate() - parseInt(dateRange, 10));
        params.append('start_date', d.toISOString().split('T')[0]);
      }

      const headers = { 'x-workspace-id': activeWorkspace?._id || '' };

      const [overviewRes, trendsRes, recsRes] = await Promise.all([
        fetch(`/api/metrics/overview?${params.toString()}`, { headers }),
        fetch(`/api/metrics/trends?${params.toString()}`, { headers }),
        fetch('/api/recommendations', { headers })
      ]);

      if (overviewRes.ok) {
        const ov = await overviewRes.json();
        setOverviewData(ov);
      }
      if (trendsRes.ok) {
        const tr = await trendsRes.json();
        setTrendsData(tr.trends || []);
      }
      if (recsRes.ok) {
        const recs = await recsRes.json();
        setRecommendationsCount(recs.count || 0);
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeWorkspace, channel, dateRange]);

  const kpis = overviewData?.kpis || {};
  const isRevTracked = kpis.is_revenue_tracked;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">Executive Intelligence Overview</h1>
          <p className="text-xs text-muted mt-1">
            Aggregated multi-channel performance across verified deterministic metrics.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex items-center space-x-2.5">
          {/* Channel Filter */}
          <div className="inline-flex rounded-lg bg-surface border border-border p-1 text-xs">
            {['ALL', 'META', 'GOOGLE', 'LINKEDIN'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  channel === ch ? 'bg-blue text-white shadow-sm' : 'text-muted hover:text-text'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs bg-surface border border-border rounded-lg px-3 py-1.5 font-medium text-text focus:outline-none focus:ring-1 focus:ring-blue"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Freshness Banner */}
      <FreshnessBanner
        lastSyncDate={overviewData?.freshness?.lastSyncDate}
        totalRecords={overviewData?.totalRecords}
      />

      {/* Active Recommendations Alert Banner if present */}
      {recommendationsCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue/10 via-surface to-canvas border border-blue/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-navy block">
                {recommendationsCount} Evidence-Linked Recommendations Available
              </span>
              <span className="text-[11px] text-muted">
                Heuristic rules flagged creative fatigue, zero-conversion bleed, and high-efficiency opportunities.
              </span>
            </div>
          </div>
          <Link
            to="/app/recommendations"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue hover:text-blue-hover shrink-0 ml-4"
          >
            <span>Review Actions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spend */}
        <KPICard
          title="Total Ad Spend"
          value={formatCurrency(kpis.spend, currency)}
          subtitle="Net verified multi-channel budget"
          icon={DollarSign}
        />

        {/* Impressions & Clicks */}
        <KPICard
          title="Ad Impressions"
          value={formatNumber(kpis.impressions)}
          subtitle={`${formatNumber(kpis.clicks)} clicks delivered`}
          icon={Eye}
        />

        {/* CTR with Boundary Assertion */}
        <KPICard
          title="Click-Through Rate (CTR)"
          value={kpis.ctr !== null ? formatPercent(kpis.ctr) : 'N/A'}
          subtitle="Clicks / Impressions"
          icon={Percent}
          boundaryNote={kpis.impressions <= 0 ? 'Impressions <= 0: Rendered as N/A' : null}
        />

        {/* CPC */}
        <KPICard
          title="Cost Per Click (CPC)"
          value={kpis.cpc !== null ? formatCurrency(kpis.cpc, currency) : 'N/A'}
          subtitle="Spend / Verified Clicks"
          icon={MousePointer}
          boundaryNote={kpis.clicks <= 0 ? 'Clicks = 0: Guarded against division-by-zero' : null}
        />

        {/* Conversions */}
        <KPICard
          title="Conversions"
          value={kpis.conversions !== null ? formatNumber(kpis.conversions) : 'Untracked'}
          subtitle={kpis.conversions !== null ? 'Attributed goal completions' : 'No conversion event mapping'}
          icon={Target}
          untracked={kpis.conversions === null}
        />

        {/* Conversion Rate (CVR) */}
        <KPICard
          title="Conversion Rate (CVR)"
          value={kpis.cvr !== null ? formatPercent(kpis.cvr) : 'N/A'}
          subtitle="Conversions / Clicks"
          icon={Percent}
          boundaryNote={kpis.conversions === null ? 'Conversions unmapped in dataset' : null}
        />

        {/* CPA */}
        <KPICard
          title="Cost Per Acquisition (CPA)"
          value={kpis.cpa !== null ? formatCurrency(kpis.cpa, currency) : 'N/A'}
          subtitle="Spend / Conversions"
          icon={DollarSign}
          boundaryNote={!kpis.conversions ? 'No conversions recorded' : null}
        />

        {/* ROAS (Strict Revenue Assertion) */}
        <KPICard
          title="Return on Ad Spend (ROAS)"
          value={isRevTracked && kpis.roas !== null ? `${kpis.roas.toFixed(2)}x` : 'Untracked'}
          subtitle={
            isRevTracked
              ? `Total Earned: ${formatCurrency(kpis.revenue, currency)}`
              : 'Audit Rule: Revenue not defaulted to $0'
          }
          icon={TrendingUp}
          untracked={!isRevTracked}
          boundaryNote={
            !isRevTracked ? 'Revenue column missing. Never defaulted to $0 to prevent skew.' : null
          }
        />
      </div>

      {/* Interactive Trends Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart: Spend & Conversions */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-navy">Performance Velocity & Volume</h2>
              <p className="text-xs text-muted">Daily spend paired with attributed conversion outcomes</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#356AE6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#356AE6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16B8A6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16B8A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#667085' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#667085' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#667085' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#14243A',
                    color: '#FFF',
                    borderRadius: '8px',
                    fontSize: '11px',
                    border: 'none'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="spend"
                  name={`Spend (${currency})`}
                  stroke="#356AE6"
                  fillOpacity={1}
                  fill="url(#spendGrad)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversions"
                  name="Conversions"
                  stroke="#16B8A6"
                  fillOpacity={1}
                  fill="url(#convGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Share Card */}
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-navy mb-1">Channel Budget Allocation</h2>
            <p className="text-xs text-muted mb-4">Spend distribution across ad networks</p>

            <div className="space-y-4">
              {overviewData?.channelBreakdown?.map((item) => {
                const totalSp = kpis.spend || 1;
                const pct = ((item.spend / totalSp) * 100).toFixed(1);
                return (
                  <div key={item.channel} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-navy">{item.channel}</span>
                      <span className="font-semibold text-text">
                        {formatCurrency(item.spend, currency)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-canvas overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.channel === 'META'
                            ? 'bg-blue'
                            : item.channel === 'GOOGLE'
                            ? 'bg-teal'
                            : 'bg-navy-light'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted">
                      <span>{formatNumber(item.clicks)} clicks</span>
                      <span>{formatNumber(item.conversions)} conv</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <Link
              to="/app/campaigns"
              className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-canvas hover:bg-surface text-navy font-semibold text-xs border border-border transition-colors"
            >
              <span>View All Campaigns & Deltas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
