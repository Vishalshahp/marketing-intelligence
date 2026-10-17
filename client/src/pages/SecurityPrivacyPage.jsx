import React from 'react';
import Navbar from '../components/Navbar';
import { ShieldCheck, Lock, AlertTriangle, FileSpreadsheet, Database, EyeOff, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SecurityPrivacyPage() {
  const securityFeatures = [
    {
      icon: FileSpreadsheet,
      title: 'Spreadsheet Formula Injection (CSV Injection)',
      threat: 'Malicious actors upload campaign names containing executable spreadsheet formulas such as =CMD|\' /C calc\'!A0 or =SUM(A1:A10). When an analyst exports metrics to CSV and opens it in Excel, the formula executes locally or exfiltrates confidential cells.',
      defense: 'All ingested text fields (campaign_name, channel, campaign_id) undergo formula sanitization. Any string starting with =, +, -, @, \\t, or \\r has a neutral leading single quote prepended prior to persistent database storage and report export.'
    },
    {
      icon: Database,
      title: 'Cross-Tenant Data Leakage & IDOR Prevention',
      threat: 'In multi-tenant SaaS environments, missing workspace boundaries on database queries allow an adversary to access another client\'s ad spend or customer data simply by enumerating sequential ID parameters.',
      defense: 'Enforced tenant-scoping middleware on every API route. All read/write database queries are forced through scoped query wrappers: { ...filter, workspace_id: req.workspaceId }. Direct Object Reference (IDOR) exploits are fundamentally prevented.'
    },
    {
      icon: EyeOff,
      title: 'Read-Only Intelligence Architecture',
      threat: 'Automated bidding bots and ad management tools with write credentials risk triggering accidental bid spikes, unauthorized campaign pauses, or account bans.',
      defense: 'Hezal is architected as an audit-first, read-only intelligence platform. It analyzes data, generates hypotheses, and prescribes experiments, but possesses zero write scopes to modify live ad campaigns or spend budgets in external ad networks.'
    },
    {
      icon: Lock,
      title: 'Complete Workspace Data Purge Protocol',
      threat: 'Data accumulation and privacy compliance (GDPR / CCPA) requiring verified right-to-be-forgotten execution across analytical databases.',
      defense: 'Any workspace administrator can instantly execute a complete cascading purge of imported campaign metrics, customer cohorts, and validation jobs with a single authenticated API call.'
    }
  ];

  return (
    <div className="min-h-screen bg-canvas text-text flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-light text-blue text-xs font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Integrity Standards</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-navy tracking-tight">
            Data Handling & Security Protocols
          </h1>
          <p className="mt-4 text-base text-muted leading-relaxed">
            Engineered to rigorous SaaS production standards from Day 1 to eliminate data-modeling vulnerabilities, spreadsheet exploits, and cross-tenant leakage.
          </p>
        </div>

        {/* Security Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {securityFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-canvas border border-border flex items-center justify-center text-navy shrink-0">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-navy">{feat.title}</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
                    <span className="font-semibold text-warning block mb-0.5">Identified Threat Vector:</span>
                    <p className="text-muted leading-relaxed">{feat.threat}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
                    <span className="font-semibold text-success block mb-0.5">Enforced Mitigation:</span>
                    <p className="text-muted leading-relaxed">{feat.defense}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Verification Code Box */}
        <div className="p-6 md:p-8 rounded-2xl bg-navy text-white shadow-xl mb-12">
          <div className="flex items-center justify-between mb-4 border-b border-navy-light/40 pb-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-error" />
              <span className="w-3 h-3 rounded-full bg-warning" />
              <span className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs font-mono text-gray-300 ml-2">sanitizer.js • Enforced Regex</span>
            </div>
            <span className="text-xs text-teal font-semibold">Active in Ingestion & Export</span>
          </div>
          <pre className="text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed">
{`// Neutralize leading characters (=, +, -, @, \\t, \\r) to prevent formula execution
export function sanitizeField(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  const dangerousPrefixes = ['=', '+', '-', '@', '\\t', '\\r'];
  if (trimmed.length > 0 && dangerousPrefixes.includes(trimmed[0])) {
    return "'" + trimmed; // Escape with neutral single quote
  }
  return trimmed;
}`}
          </pre>
        </div>

        <div className="text-center">
          <Link
            to="/app/data-sources"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue hover:bg-blue-hover text-white text-sm font-bold shadow-md transition-all"
          >
            <span>Test Ingestion with CSV Uploader</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
