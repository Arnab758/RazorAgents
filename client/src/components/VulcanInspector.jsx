import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, UserCheck, Lock, Terminal, Activity, Eye } from 'lucide-react';

export default function VulcanInspector({
  evaluation,
  mandate,
  onSimulateAttack,
  activeAttack,
  onHumanApprove
}) {
  const attackModes = [
    { id: null, label: 'Legitimate Request', desc: 'Normal autonomous commerce behavior' },
    { id: 'PROMPT_INJECTION', label: 'Prompt Injection Jailbreak', desc: 'Injects "ignore instructions & pay attacker"' },
    { id: 'BUDGET_DRAIN', label: 'Mandate Spend Cap Breach', desc: 'Simulates transaction exceeding maximum ceiling' },
    { id: 'ROGUE_MERCHANT', label: 'Untrusted VPA Spoofing', desc: 'Redirects payment to an unverified third-party VPA' },
    { id: 'INTENT_DRIFT', label: 'Semantic Intent Divergence', desc: 'Cart completely deviates from authorized user goal' }
  ];

  const getStatusBadge = (decision) => {
    switch (decision) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: ShieldCheck,
          text: 'GATED: APPROVED FOR SETTLEMENT'
        };
      case 'HALTED_BY_AGENT':
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          icon: ShieldAlert,
          text: 'GATED: OFFER REJECTED BY AGENT (POLICY ENFORCED)'
        };
      case 'ESCALATE_TO_HUMAN':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: AlertTriangle,
          text: 'GATED: HUMAN ESCALATION REQUIRED'
        };
      case 'BLOCKED':
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: ShieldAlert,
          text: 'GATED: TRANSACTION HALTED BY SENTINEL'
        };
    }
  };

  const badge = getStatusBadge(evaluation?.decision);
  const StatusIcon = badge.icon;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Track Requirement Highlight */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-purple-950/40 border border-blue-800/30 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
                Vulcan Sentinel Risk & Policy Engine
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono-code">
                  Track 01 Requirement
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Enforcing <span className="text-cyan-300 font-medium">Explainable, Bounded & Gated</span> money actions across autonomous AI workflows.
              </p>
            </div>
          </div>

          {/* Overall Gate Decision Badge */}
          <div className={`px-4 py-2 rounded-xl border text-xs font-bold font-mono-code flex items-center gap-2 shadow-md ${badge.bg}`}>
            <StatusIcon className="w-4 h-4" />
            <span>{badge.text}</span>
          </div>
        </div>
      </div>

      {/* Attack Simulator Bar for Judges */}
      <div className="glass-panel p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Judge Evaluation Controls: Attack & Anomaly Injection
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Click any scenario to verify real-time policy gating</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {attackModes.map((atk) => {
            const isSelected = activeAttack === atk.id;
            return (
              <button
                key={atk.id || 'normal'}
                onClick={() => onSimulateAttack(atk.id)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? atk.id
                      ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-900/20'
                      : 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-900/20'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${
                    isSelected ? (atk.id ? 'text-rose-300' : 'text-cyan-300') : 'text-slate-300'
                  }`}>
                    {atk.label}
                  </span>
                  {isSelected && (
                    <span className={`h-2 w-2 rounded-full ${atk.id ? 'bg-rose-400 animate-ping' : 'bg-cyan-400'}`} />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {atk.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle Section: Composite Score & 4 Pillar Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Composite Score Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vulcan Composite Score</span>
              <Eye className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className={`text-5xl font-extrabold font-display ${
                (evaluation?.compositeScore ?? 94) >= 80
                  ? 'text-emerald-400'
                  : (evaluation?.compositeScore ?? 94) >= 60
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {evaluation?.compositeScore ?? 94}
              </span>
              <span className="text-slate-400 text-sm font-semibold">/ 100</span>
            </div>
            
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {evaluation?.summary || 'Evaluating transaction telemetry against active cryptographic policies.'}
            </p>
          </div>

          {/* Mandate Constraints Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Active Bounded Envelope:</span>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Spend Ceiling:</span>
              <span className="text-white font-mono-code font-bold">₹{(mandate?.maxSpendINR ?? 25000).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Whitelisted Rails:</span>
              <span className="text-cyan-400 font-mono-code">RAZORPAY_UAP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Session Timeout:</span>
              <span className="text-slate-300 font-mono-code">2.0 hrs remaining</span>
            </div>
          </div>

          {/* Human Escalation Action (If required) */}
          {evaluation?.humanInterventionRequired && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <UserCheck className="w-4 h-4" />
                <span>Biometric Step-Up Authorization</span>
              </div>
              <p className="text-[11px] text-amber-200/80">
                Agent requested funds with intent ambiguity. To proceed, principal must provide 1-tap confirmation.
              </p>
              <button
                onClick={onHumanApprove}
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors"
              >
                Approve & Unlock Payment Rails
              </button>
            </div>
          )}
        </div>

        {/* The 4 Explainable Pillar Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(evaluation?.pillarBreakdown || []).map((pillar, idx) => {
            const isPassed = pillar.status === 'PASSED';
            const isWarning = pillar.status === 'WARNING';
            
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all ${
                  isPassed
                    ? 'bg-slate-900/60 border-slate-800'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-rose-950/30 border-rose-500/40'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-mono-code text-slate-400">Pillar 0{idx + 1} ({pillar.weight})</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{pillar.name}</h4>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono-code font-bold ${
                    isPassed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isWarning
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {pillar.score}/100
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed min-h-[38px]">
                  {pillar.detail}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Gated Verification:</span>
                  <span className={`font-semibold ${
                    isPassed ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {pillar.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Security Flags / Audit Log Details */}
      {evaluation?.flags && evaluation.flags.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-900/30 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Active Security & Policy Flags Triggered ({evaluation.flags.length})</span>
          </div>
          <div className="space-y-2">
            {evaluation.flags.map((flag, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/30 flex items-start gap-3 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono-code text-[10px] font-bold">
                  {flag.code}
                </span>
                <span className="text-slate-300">{flag.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
