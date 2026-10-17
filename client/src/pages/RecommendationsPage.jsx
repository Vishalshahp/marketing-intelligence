import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Filter,
  Layers,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecommendationsPage() {
  const { activeWorkspace, currency } = useWorkspace();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const fetchRecs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recommendations', {
        headers: { 'x-workspace-id': activeWorkspace?._id || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, [activeWorkspace]);

  const filtered = recommendations.filter((r) =>
    severityFilter === 'ALL' ? true : r.severity === severityFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-navy tracking-tight">
              Production Heuristic Recommendations
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-light text-blue text-xs font-bold">
              {recommendations.length} Active
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Deterministic 5-tuple outputs mandated by Master Release Specification Section 05.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="inline-flex rounded-lg bg-surface border border-border p-1 text-xs">
          {['ALL', 'HIGH', 'MEDIUM', 'OPPORTUNITY'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                severityFilter === sev
                  ? 'bg-blue text-white shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* 5-Tuple Structure Guide */}
      <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3 text-muted">
          <Info className="w-4 h-4 text-teal shrink-0" />
          <span>
            Every diagnosis adheres to the strict 5-tuple structure: <strong className="text-navy">Observation</strong> → <strong className="text-navy">Evidence</strong> → <strong className="text-navy">Interpretation</strong> → <strong className="text-navy">Action to Consider</strong> → <strong className="text-navy">Analytical Limitation</strong>.
          </span>
        </div>
        <button
          onClick={fetchRecs}
          className="text-xs text-blue hover:text-blue-hover font-medium flex items-center space-x-1 shrink-0 ml-4"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-evaluate Rules</span>
        </button>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-5">
        {filtered.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-border p-12 text-center text-muted">
            No recommendations currently flagged for this filter. All campaigns within safe heuristic boundaries!
          </div>
        ) : (
          filtered.map((rec, idx) => {
            const isHigh = rec.severity === 'HIGH';
            const isMedium = rec.severity === 'MEDIUM';
            const isOpportunity = rec.severity === 'OPPORTUNITY';

            return (
              <div
                key={idx}
                className="bg-surface rounded-2xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header: Rule ID & Severity Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        isHigh
                          ? 'bg-error-light text-error border border-rose-200'
                          : isMedium
                          ? 'bg-warning-light text-warning border border-amber-200'
                          : 'bg-teal-light text-teal border border-teal-200'
                      }`}
                    >
                      {rec.severity}
                    </span>
                    <span className="font-mono text-xs font-semibold text-muted">
                      {rec.rule_id}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-navy">
                    Campaign: <span className="text-blue">{rec.campaign_name}</span>
                  </span>
                </div>

                {/* 1. Observation */}
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted block mb-1">
                    1. Observation
                  </span>
                  <p className="text-sm font-bold text-navy leading-snug">
                    {rec.observation}
                  </p>
                </div>

                {/* 2. Evidence Grid */}
                <div className="p-3.5 rounded-xl bg-canvas border border-border">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted block mb-2">
                    2. Mathematical Evidence
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {Object.entries(rec.evidence).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[10px] text-muted block uppercase font-medium">
                          {k.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono font-bold text-text">
                          {typeof v === 'number' ? (k.includes('spend') || k.includes('cpa') ? formatCurrency(v, currency) : v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Interpretation & 4. Action */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-surface border border-border">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-muted block mb-1">
                      3. Causal Interpretation
                    </span>
                    <p className="text-text leading-relaxed">{rec.interpretation}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-light/30 border border-blue/20">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-blue block mb-1">
                      4. Prescribed Action to Consider
                    </span>
                    <p className="text-navy font-medium leading-relaxed">{rec.action_to_consider}</p>
                  </div>
                </div>

                {/* 5. Limitation */}
                <div className="pt-2 border-t border-border/60 flex items-start space-x-2 text-[11px] text-muted">
                  <span className="font-semibold text-navy shrink-0">5. Limitation:</span>
                  <span className="italic">{rec.limitation}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
