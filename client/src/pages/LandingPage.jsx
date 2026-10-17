import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Database,
  FileSpreadsheet
} from 'lucide-react';

export default function LandingPage() {
  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Read-Only Intelligence First',
      desc: 'Diagnoses ad spend, detects anomalies, and prescribes controlled experiments without altering budgets or live ad account states directly.'
    },
    {
      icon: Lock,
      title: 'CSV Injection Defense & Security',
      desc: 'Leading formula characters (=, +, -, @, \\t, \\r) are rigorously neutralized to stop Excel macro/formula exploits before storage and export.'
    },
    {
      icon: Cpu,
      title: 'Deterministic KPI Math',
      desc: 'Division-by-zero guards on CTR, CPC, CPA. Missing revenue is never substituted with 0, ensuring ROAS calculations remain mathematically honest.'
    },
    {
      icon: Sparkles,
      title: '5-Tuple Recommendation Engine',
      desc: 'Actionable recommendations formatted as Observation → Evidence → Interpretation → Action → Limitation for academic auditability.'
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-text flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-border bg-gradient-to-b from-surface via-surface to-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-light border border-blue/20 text-blue text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-blue animate-pulse" />
              <span>Project Hezal • Version 2.0.0 Master Release</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy tracking-tight leading-tight">
              Marketing Intelligence with Provable Mathematical Rigor
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted leading-relaxed">
              A high-precision analytical engine engineered for multi-channel ad performance (Meta, Google, LinkedIn).
              Built on deterministic KPI boundary proofs, CSV formula injection defense, and evidence-linked 5-tuple recommendations.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/app/overview"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-blue hover:bg-blue-hover text-white text-sm font-bold shadow-lg shadow-blue/20 transition-all transform active:scale-95"
              >
                <span>Launch Interactive Platform</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-surface hover:bg-canvas text-navy text-sm font-semibold border border-border shadow-sm transition-all"
              >
                <span>Explore Architectural Model</span>
              </Link>
            </div>

            {/* Quick Stats Banner */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-surface border border-border shadow-sm">
              <div>
                <span className="block text-2xl font-black text-navy">90 Days</span>
                <span className="text-xs text-muted">Synthetic Ad Data</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-teal">0% Skew</span>
                <span className="text-xs text-muted">Zero-Dividing Guards</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-blue">4 Rules</span>
                <span className="text-xs text-muted">5-Tuple Heuristics</span>
              </div>
              <div>
                <span className="block text-2xl font-black text-navy">Multi-Tenant</span>
                <span className="text-xs text-muted">IDOR Protected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Decision Matrix Section */}
      <section className="py-16 md:py-24 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
              Foundational Architectural Safeguards
            </h2>
            <p className="mt-3 text-sm text-muted">
              Resolving common data modeling paradoxes and eliminating ad performance ambiguities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-border bg-canvas/40 hover:bg-canvas transition-colors flex items-start space-x-4"
              >
                <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-blue shrink-0 shadow-sm">
                  <pillar.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy mb-1.5">{pillar.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Preview CTA */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to explore the intelligence platform?
          </h2>
          <p className="mt-3 text-sm text-gray-300 max-w-2xl mx-auto">
            Experience the pre-seeded multi-channel workspace, test CSV ingestion with real-time formula neutralization, and evaluate the heuristic recommendation cards.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              to="/app/overview"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue hover:bg-blue-hover text-white text-sm font-bold shadow-md transition-all"
            >
              <span>Explore Demo Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-surface border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-muted gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-navy">Project Hezal</span>
            <span>• Marketing Intelligence Platform</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/how-it-works" className="hover:text-text transition-colors">
              How It Works
            </Link>
            <Link to="/security-privacy" className="hover:text-text transition-colors">
              Security & Privacy
            </Link>
            <Link to="/app/overview" className="hover:text-text transition-colors">
              App Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
