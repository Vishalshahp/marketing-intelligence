import React from 'react';
import Navbar from '../components/Navbar';
import { ArrowRight, CheckCircle, Calculator, ShieldCheck, Cpu, Database, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: '3-Tier CSV Ingestion & Sanitization',
      desc: 'CSV uploads are parsed via a streaming parser. Header signatures automatically recognize Meta Ads, Google Ads, or standard exports. A smart alias dictionary matches fields (e.g. "Amount spent" → spend). String inputs are scanned for dangerous leading formula triggers (=, +, -, @) and safely quoted.'
    },
    {
      num: '02',
      title: 'Deterministic KPI Boundary Math',
      desc: 'All core metrics are computed strictly using zero-latency boundary assertions. Clicks/impressions are guarded against division-by-zero errors. Crucially, missing revenue is marked as untracked (null) rather than $0, preventing artificial ROAS zeroing.'
    },
    {
      num: '03',
      title: 'Production 5-Tuple Heuristics',
      desc: 'Campaign data feeds into 4 deterministic diagnostic rules. Every recommendation generates a complete 5-tuple: Observation, Evidence (specific campaign metrics), Interpretation, Action to Consider, and Analytical Limitation.'
    },
    {
      num: '04',
      title: 'RFM K-Means Customer Clustering',
      desc: 'Customer-level cohorts are vectorized into [Recency, Frequency, ln(1 + Monetary Spend)] and grouped into High-Value Champions, At-Risk High Spenders, and Occasional Browsers, accompanied by mandatory statistical caveats.'
    }
  ];

  const formulaRows = [
    {
      metric: 'CTR (Click-Through Rate)',
      formula: '(clicks / impressions) * 100',
      condition: 'impressions > 0',
      edgeCase: 'If impressions <= 0, returns null (rendered as "N/A", never 0% or Infinity)'
    },
    {
      metric: 'CPC (Cost Per Click)',
      formula: 'spend / clicks',
      condition: 'clicks > 0',
      edgeCase: 'If clicks <= 0, returns null to strictly avoid division by zero'
    },
    {
      metric: 'CVR (Conversion Rate)',
      formula: '(conversions / clicks) * 100',
      condition: 'clicks > 0 && conversions is present',
      edgeCase: 'Distinguishes between 0 conversions (0.00%) vs untracked conversions (null)'
    },
    {
      metric: 'CPA (Cost Per Acquisition)',
      formula: 'spend / conversions',
      condition: 'conversions > 0',
      edgeCase: 'If conversions = 0 or null, returns null with label "No conversions recorded"'
    },
    {
      metric: 'ROAS (Return on Ad Spend)',
      formula: 'revenue / spend',
      condition: 'is_revenue_tracked == true && spend > 0',
      edgeCase: 'CRITICAL AUDIT RULE: Never substitute 0 for missing revenue. Untracked revenue hides ROAS.'
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-text flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Title */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-light text-teal text-xs font-semibold mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture & Calculation Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
            How Project Hezal Processes Marketing Data
          </h1>
          <p className="mt-4 text-base text-muted leading-relaxed">
            A comprehensive look at our deterministic mathematical model, multi-tier ingestion pipeline, and audit-grade 5-tuple recommendation engine.
          </p>
        </div>

        {/* 4 Steps Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((s) => (
            <div
              key={s.num}
              className="p-6 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="text-3xl font-black text-blue/30 block mb-2">{s.num}</span>
                <h3 className="text-base font-bold text-navy mb-2">{s.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mathematical Assertions Table */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8 mb-16">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-light text-blue flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy">Deterministic KPI Mathematical Assertions</h2>
              <p className="text-xs text-muted">Strict boundary handling mandated by Master Specification Section 4.1</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas text-navy border-b border-border font-bold">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Formula</th>
                  <th className="px-4 py-3">Boundary Condition</th>
                  <th className="px-4 py-3">Edge Case Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {formulaRows.map((row, i) => (
                  <tr key={i} className="hover:bg-canvas/30">
                    <td className="px-4 py-3 font-semibold text-navy">{row.metric}</td>
                    <td className="px-4 py-3 font-mono text-blue">{row.formula}</td>
                    <td className="px-4 py-3 font-mono text-muted">{row.condition}</td>
                    <td className="px-4 py-3 text-muted">{row.edgeCase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Revenue Rule Highlight */}
          <div className="mt-6 p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex items-start space-x-3 text-xs">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-navy">The Revenue Tracking Paradox:</span>
              <p className="text-muted mt-1 leading-relaxed">
                In many ad platforms, brand awareness and top-of-funnel lead generation campaigns do not record immediate purchase values.
                If a platform defaults missing values to $0, ROAS becomes 0.00x—falsely implying total marketing failure.
                Hezal formally separates <code className="bg-white px-1 py-0.5 rounded border border-amber-300">is_revenue_tracked: false</code> (untracked outcome) from <code className="bg-white px-1 py-0.5 rounded border border-amber-300">revenue: 0</code> ($0 earned despite conversion tracking).
              </p>
            </div>
          </div>
        </div>

        {/* 5-Tuple Recommendation Engine Architecture */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 md:p-8 mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-light text-teal flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy">5-Tuple Heuristic Rule Engine</h2>
              <p className="text-xs text-muted">Standardized structure ensuring mathematical auditability</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
            <div className="p-4 rounded-xl bg-canvas border border-border">
              <span className="block text-xs font-bold text-navy mb-1">1. Observation</span>
              <p className="text-[11px] text-muted">What statistical pattern was detected</p>
            </div>
            <div className="p-4 rounded-xl bg-canvas border border-border">
              <span className="block text-xs font-bold text-navy mb-1">2. Evidence</span>
              <p className="text-[11px] text-muted">Exact metrics & baseline comparison</p>
            </div>
            <div className="p-4 rounded-xl bg-canvas border border-border">
              <span className="block text-xs font-bold text-navy mb-1">3. Interpretation</span>
              <p className="text-[11px] text-muted">Causal marketing hypothesis</p>
            </div>
            <div className="p-4 rounded-xl bg-canvas border border-border">
              <span className="block text-xs font-bold text-navy mb-1">4. Action</span>
              <p className="text-[11px] text-muted">Recommended test or remediation</p>
            </div>
            <div className="p-4 rounded-xl bg-canvas border border-border">
              <span className="block text-xs font-bold text-navy mb-1">5. Limitation</span>
              <p className="text-[11px] text-muted">Explicit boundary caveats & nuances</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-6">
          <Link
            to="/app/overview"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue hover:bg-blue-hover text-white text-sm font-bold shadow-md transition-all"
          >
            <span>See the Engine in Action</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
