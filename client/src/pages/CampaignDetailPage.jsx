import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatCurrency, formatPercent, formatNumber, formatDate } from '../utils/formatters';
import {
  ArrowLeft,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  Minus
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const { activeWorkspace, currency } = useWorkspace();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/campaigns/${id}`, {
          headers: { 'x-workspace-id': activeWorkspace?._id || '' }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load campaign drilldown:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, activeWorkspace]);

  if (loading) {
    return (
      <div className="p-12 text-center text-muted">
        Loading campaign deep-dive analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-lg font-bold text-navy mb-2">Campaign Not Found</h2>
        <Link to="/app/campaigns" className="text-blue hover:underline text-xs">
          Return to Campaigns Directory
        </Link>
      </div>
    );
  }

  const { campaign_name, channel, metrics, periodOverPeriod, dailyBreakdown } = data;
  const delta = periodOverPeriod?.delta || {};

  const renderDeltaBadge = (val, inverseGood = false) => {
    if (val === null || val === undefined) return <span className="text-muted text-xs">—</span>;
    const isPositive = val > 0;
    const isGood = inverseGood ? !isPositive : isPositive;

    return (
      <span
        className={`inline-flex items-center space-x-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
          isGood
            ? 'bg-success-light text-success'
            : 'bg-error-light text-error'
        }`}
      >
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{Math.abs(val)}%</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/app/campaigns"
          className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted hover:text-text shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-navy">{campaign_name}</h1>
            <span className="px-2 py-0.5 rounded bg-blue-light text-blue text-xs font-bold font-mono">
              {channel}
            </span>
          </div>
          <p className="text-xs text-muted">
            Internal ID: <code className="font-mono text-text">{id}</code> • {dailyBreakdown.length} days of recorded telemetry
          </p>
        </div>
      </div>

      {/* Period-over-Period Delta Cards */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-navy">Period-over-Period Performance Delta</h2>
            <p className="text-xs text-muted">Comparing current analytical window against prior equal duration</p>
          </div>
          <span className="text-xs font-mono text-muted">Window Midpoint Split</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-3 bg-canvas rounded-xl border border-border">
            <span className="text-[11px] text-muted block mb-1">Spend Trend</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{formatCurrency(periodOverPeriod.currentWindow.spend, currency)}</span>
              {renderDeltaBadge(delta.spend)}
            </div>
          </div>

          <div className="p-3 bg-canvas rounded-xl border border-border">
            <span className="text-[11px] text-muted block mb-1">CTR Delta</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {periodOverPeriod.currentWindow.ctr !== null ? formatPercent(periodOverPeriod.currentWindow.ctr) : 'N/A'}
              </span>
              {renderDeltaBadge(delta.ctr)}
            </div>
          </div>

          <div className="p-3 bg-canvas rounded-xl border border-border">
            <span className="text-[11px] text-muted block mb-1">Clicks Delta</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{formatNumber(periodOverPeriod.currentWindow.clicks)}</span>
              {renderDeltaBadge(delta.clicks)}
            </div>
          </div>

          <div className="p-3 bg-canvas rounded-xl border border-border">
            <span className="text-[11px] text-muted block mb-1">Conversions Delta</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {periodOverPeriod.currentWindow.conversions !== null ? formatNumber(periodOverPeriod.currentWindow.conversions) : 'N/A'}
              </span>
              {renderDeltaBadge(delta.conversions)}
            </div>
          </div>

          <div className="p-3 bg-canvas rounded-xl border border-border">
            <span className="text-[11px] text-muted block mb-1">CPA Delta</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {periodOverPeriod.currentWindow.cpa !== null ? formatCurrency(periodOverPeriod.currentWindow.cpa, currency) : 'N/A'}
              </span>
              {renderDeltaBadge(delta.cpa, true)}
            </div>
          </div>

          <div className="p-3 bg-canvas rounded-xl border border-border">
            <span className="text-[11px] text-muted block mb-1">ROAS Delta</span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {periodOverPeriod.currentWindow.roas !== null ? `${periodOverPeriod.currentWindow.roas.toFixed(2)}x` : 'Untracked'}
              </span>
              {renderDeltaBadge(delta.roas)}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Performance Time-series */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-base font-bold text-navy mb-1">Historical Daily Performance</h2>
        <p className="text-xs text-muted mb-6">Spend, Clicks, and Conversion tracking over time</p>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#667085' }} />
              <YAxis yAxisId="spend" tick={{ fontSize: 10, fill: '#667085' }} />
              <YAxis yAxisId="clicks" orientation="right" tick={{ fontSize: 10, fill: '#667085' }} />
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
              <Line
                yAxisId="spend"
                type="monotone"
                dataKey="spend"
                name={`Spend (${currency})`}
                stroke="#356AE6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="clicks"
                type="monotone"
                dataKey="clicks"
                name="Clicks"
                stroke="#16B8A6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="clicks"
                type="monotone"
                dataKey="conversions"
                name="Conversions"
                stroke="#9A5B00"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
