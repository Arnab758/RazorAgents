import React, { useState, useEffect } from 'react';
import { Store, Globe, CheckCircle2, Shield, Settings2, Code, Copy, ExternalLink, TrendingUp, DollarSign, Bot, Plus, PackagePlus, Sparkles, X, Check } from 'lucide-react';

export default function MerchantAdmin({ catalog, discountCap, setDiscountCap, agentDiscoveryActive, setAgentDiscoveryActive, onCatalogUpdated }) {
  const [stats, setStats] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // New SKU Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmittingSku, setIsSubmittingSku] = useState(false);
  const [skuSuccessMsg, setSkuSuccessMsg] = useState(null);
  const [newSku, setNewSku] = useState({
    name: 'Startup AI Advisory & Architecture Review',
    category: 'developer_services',
    unitPriceINR: 4500,
    inventory: 15,
    unit: 'session',
    maxNegotiableDiscountPercent: 12,
    description: '1-on-1 technical review of agentic payments, LLM guardrails, and compliance architecture.'
  });

  const manifestUrl = `${window.location.origin}/.well-known/agent-commerce.json`;

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/merchant/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch merchant stats:', err);
    }
  };

  const copyManifest = () => {
    navigator.clipboard.writeText(manifestUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCreateSku = async (e) => {
    e.preventDefault();
    setIsSubmittingSku(true);
    setSkuSuccessMsg(null);

    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSku)
      });
      const data = await res.json();
      if (data.success) {
        setSkuSuccessMsg(`Published "${data.item.name}" to .well-known/agent-commerce.json!`);
        setShowAddModal(false);
        if (onCatalogUpdated) onCatalogUpdated(data.catalog);
        setTimeout(() => setSkuSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to add SKU:', err);
    } finally {
      setIsSubmittingSku(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Value Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900/90 to-cyan-950/30 border border-emerald-800/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono-code border border-emerald-500/20">
            MERCHANT ONBOARDING RAIL
          </span>
          <h2 className="text-lg font-bold font-display text-white mt-1.5 flex items-center gap-2">
            Make Any Store "Agent-Transactable" in 60 Seconds
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Publish products to <code className="text-cyan-300 font-mono-code">.well-known/agent-commerce.json</code>. Autonomous buyers (Claude/Gemini/GPT) will instantly discover, negotiate within your margin boundaries, and settle over Razorpay.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={copyManifest}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono-code flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>{copiedUrl ? 'Copied URL!' : 'Copy Manifest URL'}</span>
          </button>
          <a
            href={manifestUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-cyan-900/20"
          >
            <span>View Raw ACP</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Success Notification */}
      {skuSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{skuSuccessMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Agentic GMV</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-display text-white mt-2">
            ₹{(stats?.agenticGmvINR ?? 684200).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +34.2% from AI buyer agents
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">AI Buyer Footfall</span>
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-display text-white mt-2">
            {stats?.totalAgentInteractions ?? 142}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Autonomous sessions logged</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Settlement Success</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-display text-white mt-2">
            {stats?.successfulSettlements ?? 128} <span className="text-sm font-normal text-slate-400">/ {stats?.totalAgentInteractions ?? 142}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cleared on Razorpay rails</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Vulcan Sentinel Blocks</span>
            <Shield className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-display text-rose-400 mt-2">
            {stats?.haltedByVulcanSentinel ?? 14}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Prompt injections prevented</p>
        </div>
      </div>

      {/* Configuration & Catalog Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Merchant Autonomous Policy Controls (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Settings2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-display">Autonomous Commerce Policies</h3>
          </div>

          {/* Toggle ACP Discovery */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-white">Agentic Discovery (ACP/1.0)</p>
              <p className="text-[11px] text-slate-400">Advertise catalog to autonomous crawler bots</p>
            </div>
            <button
              onClick={() => setAgentDiscoveryActive(!agentDiscoveryActive)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                agentDiscoveryActive ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                agentDiscoveryActive ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Automated AI Discount Cap Slider */}
          <div className="space-y-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Max Automated AI Discount Cap:</span>
              <span className="font-bold text-emerald-400 font-mono-code">{discountCap}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={discountCap}
              onChange={(e) => setDiscountCap(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Our AI Sales Agent will autonomously negotiate with buyer bots up to this margin ceiling without requiring human review.
            </p>
          </div>

          {/* Merchant Razorpay VPA & KYC Info */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono-code">Registered Payee Identity</span>
            <div className="flex justify-between">
              <span className="text-slate-400">Brand Name:</span>
              <span className="text-white font-medium">CloudGPU.ai</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Razorpay VPA:</span>
              <span className="text-cyan-400 font-mono-code">cloudgpu@razorpay</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Directory KYC:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono-code">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED (98.4/100)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Active Agent-Transactable Catalog (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white font-display">Published ACP Catalog</h3>
              <p className="text-[11px] text-slate-400">Visible to autonomous AI crawler agents</p>
            </div>
            
            <button
              onClick={() => setShowAddModal(!showAddModal)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New SKU</span>
            </button>
          </div>

          {/* Inline Add SKU Modal / Card */}
          {showAddModal && (
            <form onSubmit={handleCreateSku} className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-display">
                  <PackagePlus className="w-4 h-4" /> Register New Agent-Transactable SKU
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newSku.name}
                    onChange={(e) => setNewSku({ ...newSku, name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Category</label>
                  <select
                    value={newSku.category}
                    onChange={(e) => setNewSku({ ...newSku, category: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="cloud_compute">Cloud Compute</option>
                    <option value="developer_services">Developer Services / Consulting</option>
                    <option value="fintech_api">FinTech API License</option>
                    <option value="ai_tokens">AI Tokens</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Unit Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={newSku.unitPriceINR}
                    onChange={(e) => setNewSku({ ...newSku, unitPriceINR: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono-code focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Stock Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={newSku.inventory}
                    onChange={(e) => setNewSku({ ...newSku, inventory: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono-code focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Max Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={newSku.maxNegotiableDiscountPercent}
                    onChange={(e) => setNewSku({ ...newSku, maxNegotiableDiscountPercent: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono-code focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Product Description</label>
                <input
                  type="text"
                  value={newSku.description}
                  onChange={(e) => setNewSku({ ...newSku, description: e.target.value })}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingSku}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmittingSku ? (
                  <span>Publishing to ACP Manifest...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Publish SKU to .well-known/agent-commerce.json</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Catalog Listing */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {(catalog || []).map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.description}</p>
                  <p className="text-[10px] text-cyan-400 font-mono-code mt-1.5">
                    Stock: {item.inventory} units • Max AI Bargain: {item.maxNegotiableDiscountPercent}%
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold font-display text-white">
                    ₹{item.unitPriceINR.toLocaleString('en-IN')}
                  </span>
                  <span className="block text-[10px] text-slate-400">per {item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
