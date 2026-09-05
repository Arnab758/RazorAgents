import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function RazorpaySettingsModal({ isOpen, onClose, razorpayConfig, setRazorpayConfig }) {
  const [mode, setMode] = useState(razorpayConfig?.mode || 'SANDBOX_SIMULATOR');
  const [keyId, setKeyId] = useState(razorpayConfig?.keyId || '');
  const [merchantVpa, setMerchantVpa] = useState(razorpayConfig?.merchantVpa || 'cloudgpu@razorpay');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setRazorpayConfig({
      mode,
      keyId: keyId.trim() || 'rzp_test_simulator',
      merchantVpa: merchantVpa.trim() || 'cloudgpu@razorpay'
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0c1424] border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md text-sm">
              R
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Razorpay Gateway Configuration</h3>
              <p className="text-[11px] text-slate-400 font-mono">Buildathon Live Mode Switcher</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-2">Checkout Gateway Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('SANDBOX_SIMULATOR')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'SANDBOX_SIMULATOR'
                    ? 'bg-blue-950/60 border-cyan-500/50 text-cyan-300 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="font-bold block text-white">Sandbox Simulator</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
                  Instant zero-key clearance with Soundbox chime. Perfect for fast judging demos.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('LIVE_TEST_KEY')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === 'LIVE_TEST_KEY'
                    ? 'bg-blue-950/60 border-cyan-500/50 text-cyan-300 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="font-bold block text-white">Custom Test Key</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">
                  Uses real Razorpay checkout.js with your own rzp_test_ key.
                </span>
              </button>
            </div>
          </div>

          {mode === 'LIVE_TEST_KEY' && (
            <div className="space-y-3 p-3 rounded-xl bg-slate-950 border border-slate-800 animate-in fade-in duration-200">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Razorpay Key ID (Test Mode)</label>
                <input
                  type="text"
                  placeholder="rzp_test_..."
                  value={keyId}
                  onChange={(e) => setKeyId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Key ID will be used by the official Razorpay Checkout SDK. Key Secret remains securely protected.
              </p>
            </div>
          )}

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Merchant VPA Address</label>
            <input
              type="text"
              value={merchantVpa}
              onChange={(e) => setMerchantVpa(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Used in NPCI-UAP token binding and agent payee whitelisting.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              NPCI-UAP Mandate Cap:
            </span>
            <span className="text-emerald-400 font-mono font-bold">₹25,000 / session</span>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Configuration Saved!</span>
              </>
            ) : (
              <span>Save & Apply Settings</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
