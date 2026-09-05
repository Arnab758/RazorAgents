import React, { useState } from 'react';
import { ShieldCheck, Store, Terminal, BarChart3, Zap, Lock, Volume2, Sliders } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, razorpayConfig, onOpenSettings }) {
  const [isPlayingChime, setIsPlayingChime] = useState(false);

  const navItems = [
    { id: 'arena', label: 'Commerce Arena', icon: Zap, badge: 'Live AI Sim' },
    { id: 'sentinel', label: 'Vulcan Sentinel', icon: ShieldCheck, badge: 'Bounded & Gated' },
    { id: 'merchant', label: 'Merchant ACP Store', icon: Store, badge: '.well-known' },
    { id: 'mcp', label: 'MCP Dev Hub', icon: Terminal, badge: 'Claude / LLM' },
    { id: 'analytics', label: 'Agentic GMV', icon: BarChart3, badge: 'Audit Ledger' },
  ];

  const handleTestSoundbox = () => {
    setIsPlayingChime(true);
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12);
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.55);

      if ('speechSynthesis' in window) {
        setTimeout(() => {
          const text = 'Razorpay par 7,200 rupaye prapt hue. Autonomous settlement verified!';
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.05;
          utterance.pitch = 1.1;
          const voices = window.speechSynthesis.getVoices();
          const inVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('hi'));
          if (inVoice) utterance.voice = inVoice;
          utterance.onend = () => setIsPlayingChime(false);
          utterance.onerror = () => setIsPlayingChime(false);
          window.speechSynthesis.speak(utterance);
        }, 300);
      } else {
        setTimeout(() => setIsPlayingChime(false), 600);
      }
    } catch {
      setIsPlayingChime(false);
    }
  };

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

        {/* Interactive Actions & Status */}
        <div className="flex items-center gap-2">
          {/* Soundbox Test Trigger */}
          <button
            onClick={handleTestSoundbox}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono-code flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlayingChime
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Play Razorpay Soundbox audio confirmation"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isPlayingChime ? 'animate-bounce text-cyan-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Soundbox</span>
            {isPlayingChime && (
              <span className="flex gap-0.5 items-center">
                <span className="w-1 h-3 bg-cyan-400 animate-pulse"></span>
                <span className="w-1 h-4 bg-cyan-300 animate-pulse delay-75"></span>
                <span className="w-1 h-2 bg-cyan-400 animate-pulse delay-150"></span>
              </span>
            )}
          </button>

          {/* Gateway Settings / Test Key Selector */}
          <button
            onClick={onOpenSettings}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-mono-code text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure Razorpay Mode / Test Key"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xl:inline">
              {razorpayConfig?.mode === 'LIVE_TEST_KEY' ? 'LIVE TEST KEY' : 'SANDBOX SIM'}
            </span>
          </button>

          {/* Status Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono-code">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">RAZORPAY</span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>
        </div>

      </div>
    </header>
  );
}
