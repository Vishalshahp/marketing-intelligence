import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Layers,
  Sparkles,
  Users,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  Building,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export default function Sidebar() {
  const { workspaces, activeWorkspace, switchWorkspace, currency, updateCurrency, resetDemoData } = useWorkspace();

  const navigation = [
    { name: 'Overview', href: '/app/overview', icon: LayoutDashboard },
    { name: 'Data Sources & CSV', href: '/app/data-sources', icon: UploadCloud },
    { name: 'Campaigns', href: '/app/campaigns', icon: Layers },
    { name: 'Recommendations', href: '/app/recommendations', icon: Sparkles },
    { name: 'Customer Segments', href: '/app/customer-segments', icon: Users },
    { name: 'Reports & Export', href: '/app/reports', icon: FileSpreadsheet },
    { name: 'Workspace Settings', href: '/app/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-navy text-white flex flex-col shrink-0 min-h-screen border-r border-navy-light/40 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-navy-light/40 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-blue flex items-center justify-center font-black text-white text-base">
            H
          </div>
          <div>
            <span className="font-bold tracking-tight text-white block text-sm">
              HEZAL PLATFORM
            </span>
            <span className="text-[10px] text-teal font-mono">v2.0.0 (Master)</span>
          </div>
        </Link>
      </div>

      {/* Workspace Selector */}
      <div className="px-4 py-3 border-b border-navy-light/30 bg-navy-light/20">
        <label className="text-[10px] font-semibold tracking-wider text-muted uppercase block mb-1">
          Active Workspace
        </label>
        <div className="relative">
          <select
            value={activeWorkspace?._id || ''}
            onChange={(e) => switchWorkspace(e.target.value)}
            className="w-full bg-navy-light text-white text-xs rounded-md pl-8 pr-6 py-2 appearance-none font-medium focus:outline-none focus:ring-1 focus:ring-blue border border-navy-light/60 cursor-pointer"
          >
            {workspaces.map((ws) => (
              <option key={ws._id} value={ws._id}>
                {ws.name} {ws.is_demo ? '(Demo)' : ''}
              </option>
            ))}
          </select>
          <Building className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5 pointer-events-none" />
          <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Currency Switcher */}
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="text-muted text-[11px]">Display Currency:</span>
          <div className="inline-flex rounded-md p-0.5 bg-navy-light border border-navy-light/50">
            {['USD', 'INR', 'EUR'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateCurrency(c)}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                  currency === c
                    ? 'bg-blue text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {c === 'USD' ? '$' : c === 'INR' ? '₹' : '€'} {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-navy-light/50'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Demo Quick Reset & System Badges */}
      <div className="p-4 border-t border-navy-light/40 space-y-3 bg-navy-light/10">
        <button
          onClick={resetDemoData}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-navy-light/60 hover:bg-navy-light text-gray-200 hover:text-white rounded text-xs font-medium border border-navy-light transition-colors"
          title="Refresh 90-Day Synthetic Dataset"
        >
          <RefreshCw className="w-3 h-3 text-teal" />
          <span>Refresh Demo Data</span>
        </button>

        <div className="pt-2 border-t border-navy-light/20 flex items-center justify-between text-[11px] text-muted">
          <Link
            to="/security-privacy"
            className="flex items-center space-x-1 hover:text-white transition-colors"
          >
            <ShieldCheck className="w-3 h-3 text-teal" />
            <span>Audit Spec</span>
          </Link>

          <Link
            to="/how-it-works"
            className="flex items-center space-x-1 hover:text-white transition-colors"
          >
            <span>Math Logic</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
