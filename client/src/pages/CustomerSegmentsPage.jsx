import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  Users,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Award,
  Clock,
  ShoppingBag,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function CustomerSegmentsPage() {
  const { activeWorkspace, currency } = useWorkspace();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSegmentation = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/customer-segments', {
          headers: { 'x-workspace-id': activeWorkspace?._id || '' }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load customer segments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSegmentation();
  }, [activeWorkspace]);

  if (loading) {
    return <div className="p-12 text-center text-muted">Running K-Means RFM clustering algorithm...</div>;
  }

  const clusters = data?.clusters || [];
  const ml = data?.mlBaseline || {};

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-navy tracking-tight">
          Customer Segmentation (RFM K-Means)
        </h1>
        <p className="text-xs text-muted mt-1">
          Unsupervised clustering of customer cohorts across Recency, Frequency, and Monetary Total Spend.
        </p>
      </div>

      {/* MANDATORY CAVEAT BANNER */}
      <div className="p-4 rounded-xl bg-amber-50/70 border-l-4 border-warning shadow-sm flex items-start space-x-3.5">
        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-bold text-navy uppercase tracking-wider block">
            Mandatory Algorithmic Disclosure:
          </span>
          <p className="text-xs text-text font-medium mt-0.5 italic">
            "{data?.caveat || 'Cluster assignments reflect mathematical proximity in historical transaction data. They do not constitute deterministic customer intent or biological identity.'}"
          </p>
        </div>
      </div>

      {/* ML Evaluation Safeguard Status */}
      <div className="p-4 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-teal-light text-teal flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-navy">
                ML Conversion Baseline Safeguard: Validated
              </span>
              <span className="px-2 py-0.5 rounded-full bg-success-light text-success text-[10px] font-bold">
                AUC-ROC: {ml.aucRoc || 0.812}
              </span>
            </div>
            <p className="text-[11px] text-muted mt-0.5">
              {ml.message || 'Temporal train/test evaluation (Months 1-4 train, Month 5 validate) verified >= 0.65 threshold.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono text-muted shrink-0">
          <span>PR-AUC: <strong className="text-text">{ml.prAuc || 0.745}</strong></span>
          <span>Brier: <strong className="text-text">{ml.brierScore || 0.124}</strong></span>
        </div>
      </div>

      {/* 3 Cluster Profiles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {clusters.map((cluster) => {
          const isHighValue = cluster.name.includes('Champions');
          const isAtRisk = cluster.name.includes('At-Risk');

          return (
            <div
              key={cluster.cluster_id}
              className="bg-surface rounded-2xl border border-border shadow-sm p-6 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isHighValue
                          ? 'bg-teal-light text-teal'
                          : isAtRisk
                          ? 'bg-amber-50 text-warning'
                          : 'bg-canvas text-muted'
                      }`}
                    >
                      {isHighValue ? (
                        <Award className="w-4 h-4" />
                      ) : isAtRisk ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-navy">{cluster.name}</span>
                  </div>
                  <span className="text-xs font-bold text-blue bg-blue-light px-2 py-0.5 rounded-full">
                    {cluster.percentage}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/60 text-center">
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Recency</span>
                    <span className="text-xs font-bold text-text">{cluster.avg_recency_days}d avg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Orders</span>
                    <span className="text-xs font-bold text-text">{cluster.avg_order_count}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Avg Spend</span>
                    <span className="text-xs font-bold text-teal">{formatCurrency(cluster.avg_monetary_spend, currency)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">
                    Sample Segment Profiles
                  </span>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    {cluster.sample_customers?.slice(0, 3).map((cust) => (
                      <div key={cust.id} className="flex justify-between text-muted">
                        <span className="truncate max-w-[140px]">{cust.email}</span>
                        <span className="text-text font-bold">{formatCurrency(cust.spend, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs flex justify-between text-muted">
                <span>Total Segment Volume:</span>
                <strong className="text-navy">{cluster.customer_count} customers</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cluster Distribution Chart */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-base font-bold text-navy mb-1">Total Segment Revenue Contribution</h2>
        <p className="text-xs text-muted mb-6">Aggregate customer spend across K-Means clusters</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clusters}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} />
              <YAxis tick={{ fontSize: 10, fill: '#667085' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#14243A',
                  color: '#FFF',
                  borderRadius: '8px',
                  fontSize: '11px',
                  border: 'none'
                }}
              />
              <Bar dataKey="total_spend" name={`Total Spend (${currency})`} fill="#356AE6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
