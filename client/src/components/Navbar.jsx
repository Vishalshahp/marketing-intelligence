import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Shield, Cpu, ExternalLink, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { label: 'Overview', path: '/' },
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Security & Privacy', path: '/security-privacy' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-navy text-white border-b border-navy-light/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-blue flex items-center justify-center font-bold text-white shadow-md group-hover:bg-blue-hover transition-colors">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-none">
                HEZAL
              </span>
              <span className="text-[10px] tracking-wider text-muted font-medium uppercase">
                Marketing Intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white bg-navy-light'
                      : 'text-gray-300 hover:text-white hover:bg-navy-light/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/security-privacy"
            className="hidden sm:flex items-center space-x-1 text-xs text-gray-300 hover:text-white px-2.5 py-1.5 rounded border border-navy-light/60"
          >
            <Shield className="w-3.5 h-3.5 text-teal" />
            <span>Audit Proof</span>
          </Link>

          <Link
            to="/app/overview"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue hover:bg-blue-hover text-white text-sm font-semibold shadow-md transition-all transform active:scale-95"
          >
            <span>Launch Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
