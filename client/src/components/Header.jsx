import React from 'react';
import { ShieldCheck, Cpu, Store, Terminal, BarChart3, Zap, Lock } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, systemStatus }) {
  const navItems = [
    { id: 'arena', label: 'Commerce Arena', icon: Zap, badge: 'Live AI Sim' },
    { id: 'sentinel', label: 'Vulcan Sentinel', icon: ShieldCheck, badge: 'Bounded & Gated' },
    { id: 'merchant', label: 'Merchant ACP Store', icon: Store, badge: '.well-known' },
    { id: 'mcp', label: 'MCP Dev Hub', icon: Terminal, badge: 'Claude / LLM' },
    { id: 'analytics', label: 'Agentic GMV', icon: BarChart3, badge: 'Telemetry' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-xl px-4 lg:px-8 py-3.5 transition-all">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Track Info */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/40">
              <Zap className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                RazorAgent <span className="text-xs px-2 py-0.5 rounded-md font-mono-code bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">OS</span>
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 hidden sm:inline-flex items-center gap-1">
                <Lock className="w-3 h-3" /> ACP/1.0 • UAP
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="text-emerald-400 font-medium">Razorpay AI Buildathon 2026</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Track 01: AI Growth & Agentic Commerce</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-900/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono-code ${
                    isActive ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status Pill */}
        <div className="hidden xl:flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono-code">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">RAZORPAY_SANDBOX</span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
        </div>

      </div>
    </header>
  );
}
