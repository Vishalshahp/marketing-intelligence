import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useWorkspace } from '../context/WorkspaceContext';
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AppLayout() {
  const { activeWorkspace, resetDemoData } = useWorkspace();
  const isDemo = activeWorkspace?.is_demo;

  return (
    <div className="flex min-h-screen bg-canvas text-text">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Minimal Notification Bar if Demo is Active */}
        {isDemo && (
          <div className="bg-navy text-white px-6 py-2 flex items-center justify-between text-xs border-b border-navy-light/40">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
              <span className="font-semibold text-gray-200">
                Sandbox Environment Active:
              </span>
              <span className="text-gray-300">
                You are inspecting the 90-day multi-channel demo dataset.
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={resetDemoData}
                className="text-teal hover:underline text-xs flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-seed Dataset</span>
              </button>
              <Link
                to="/"
                className="text-gray-300 hover:text-white text-xs flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Exit to Landing</span>
              </Link>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
