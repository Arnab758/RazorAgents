import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AgentArena from './components/AgentArena';
import VulcanInspector from './components/VulcanInspector';
import MerchantAdmin from './components/MerchantAdmin';
import MCPHub from './components/MCPHub';
import AnalyticsView from './components/AnalyticsView';
import RazorpayModal from './components/RazorpayModal';
import { ShieldCheck, Zap, Lock, Terminal, CheckCircle2 } from 'lucide-react';

const defaultCatalog = [
  {
    id: 'sku_gpu_a100_40h',
    name: 'NVIDIA A100 SXM4 (40 GPU-Hours)',
    category: 'cloud_compute',
    description: 'On-demand high-throughput cluster for LLM fine-tuning and inference. Dedicated 80GB VRAM instances.',
    unitPriceINR: 7200,
    inventory: 18,
    currency: 'INR',
    unit: 'cluster_block',
    maxNegotiableDiscountPercent: 15
  },
  {
    id: 'sku_gpu_h100_20h',
    name: 'NVIDIA H100 Hopper (20 GPU-Hours)',
    category: 'cloud_compute',
    description: 'Next-gen FP8 tensor core instances with 3.2Tbps InfiniBand interconnect.',
    unitPriceINR: 11500,
    inventory: 9,
    currency: 'INR',
    unit: 'cluster_block',
    maxNegotiableDiscountPercent: 10
  },
  {
    id: 'sku_agent_gateway_sub',
    name: 'RazorAgent Enterprise Gateway (1 Mo)',
    category: 'fintech_api',
    description: 'Dedicated low-latency proxy with Vulcan Sentinel Risk Shield and 100k bounded agent transactions.',
    unitPriceINR: 4999,
    inventory: 999,
    currency: 'INR',
    unit: 'license',
    maxNegotiableDiscountPercent: 20
  },
  {
    id: 'sku_llm_inference_tokens_50m',
    name: 'Dedicated Llama 3.3 70B Tokens (50M)',
    category: 'ai_tokens',
    description: 'Zero-downtime serverless token pool with guaranteed 120 tokens/sec throughput.',
    unitPriceINR: 2800,
    inventory: 45,
    currency: 'INR',
    unit: 'token_pack',
    maxNegotiableDiscountPercent: 12
  }
];

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060a12] text-white flex items-center justify-center p-6">
          <div className="p-8 rounded-2xl bg-rose-950/40 border border-rose-500/50 max-w-lg space-y-4 text-center">
            <h2 className="text-xl font-bold text-rose-400">Application Initialization Warning</h2>
            <p className="text-xs text-slate-300 font-mono-code bg-black/50 p-3 rounded text-left overflow-auto max-h-40">
              {this.state.error?.message || String(this.state.error)}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white transition-colors"
            >
              Reload Cockpit
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('arena');
  const [catalog, setCatalog] = useState(defaultCatalog);
  const [evaluation, setEvaluation] = useState(null);
  const [activeAttack, setActiveAttack] = useState(null);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [merchantDiscountCap, setMerchantDiscountCap] = useState(15);
  const [agentDiscoveryActive, setAgentDiscoveryActive] = useState(true);

  const [mandate, setMandate] = useState({
    id: 'mnd_bounded_session_992',
    principal: 'Dev (Authorized Buyer)',
    maxSpendINR: 25000,
    remainingBalanceINR: 25000,
    whitelistedRails: ['RAZORPAY_UAP'],
    validHours: 2.0
  });

  useEffect(() => {
    // Fetch initial catalog from API
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.catalog) && data.catalog.length > 0) {
          setCatalog(data.catalog);
        }
      })
      .catch(err => console.error('Failed to load catalog:', err));

    // Run baseline Sentinel evaluation
    runSentinelPrecheck(null);
  }, []);

  const runSentinelPrecheck = async (attackType) => {
    try {
      const res = await fetch('/api/sentinel/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIntent: 'Procure GPU compute cluster within authorized budget cap and negotiate volume discount.',
          agentReasoningTrace: 'Agent verifying merchant ACP manifest and preparing order proposal.',
          cartTotalINR: 7200,
          cartItems: [{ category: 'cloud_compute', name: 'NVIDIA A100' }],
          mandate,
          targetMerchant: {
            vpa: 'cloudgpu@razorpay',
            trust_score: 98.4
          },
          simulationAttack: attackType
        })
      });
      const data = await res.json();
      if (data.success) {
        setEvaluation(data.evaluation);
      }
    } catch (err) {
      console.error('Sentinel precheck error:', err);
    }
  };

  const handleSimulateAttack = (attackId) => {
    setActiveAttack(attackId);
    runSentinelPrecheck(attackId);
  };

  const handleHumanApprove = () => {
    if (evaluation) {
      setEvaluation(prev => ({
        ...prev,
        decision: 'APPROVED',
        gateAction: 'HUMAN_OVERRIDE_APPROVED',
        humanInterventionRequired: false,
        summary: 'Transaction authorized via principal biometric step-up signature. Rails unlocked.'
      }));
      showToast('Biometric Authorization Confirmed: Rails Unlocked');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenRazorpay = (txData) => {
    // Before opening modal, verify Sentinel gate
    if (evaluation?.decision === 'BLOCKED') {
      showToast('Halted by Vulcan Sentinel: Resolve security flags before checkout');
      setActiveTab('sentinel');
      return;
    }
    if (evaluation?.decision === 'ESCALATE_TO_HUMAN') {
      showToast('Human Biometric Step-Up Required');
      setActiveTab('sentinel');
      return;
    }

    setPendingTransaction(txData);
    setIsRazorpayModalOpen(true);
  };

  const handleSettlementComplete = (receipt) => {
    setMandate(prev => ({
      ...prev,
      remainingBalanceINR: Math.max(0, prev.remainingBalanceINR - receipt.amount_inr)
    }));
    showToast(`Payment of ₹${receipt.amount_inr.toLocaleString('en-IN')} Cleared on Razorpay Rails`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#060a12] text-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-cyan-950 border border-cyan-500/50 text-cyan-200 text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Sub-Header Live Telemetry Bar */}
      <div className="border-b border-slate-800/60 bg-[#090e1a]/70 px-4 lg:px-8 py-2 text-xs">
        <div className="w-full mx-auto flex flex-wrap items-center justify-between gap-3 font-mono-code text-[11px]">
          
          <div className="flex items-center gap-4">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-cyan-400" />
              SESSION: <strong className="text-slate-200">{mandate.id}</strong>
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:flex items-center gap-1.5">
              REMAINING_CAP: <strong className="text-emerald-400">₹{mandate.remainingBalanceINR.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1.5">
              VULCAN_GATE: 
              <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                evaluation?.decision === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : evaluation?.decision === 'ESCALATE_TO_HUMAN'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {evaluation?.decision || 'CHECKING'}
              </span>
            </span>

            <span className="text-slate-400 hidden md:inline">•</span>
            <span className="text-slate-400 hidden md:inline">
              RAZORPAY_SETTLEMENT: <span className="text-cyan-400 font-bold">UAP-ENABLED</span>
            </span>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'arena' && (
          <AgentArena
            catalog={catalog}
            onOpenRazorpayModal={handleOpenRazorpay}
            onEvaluationUpdate={setEvaluation}
            mandate={mandate}
            setMandate={setMandate}
          />
        )}

        {activeTab === 'sentinel' && (
          <VulcanInspector
            evaluation={evaluation}
            mandate={mandate}
            onSimulateAttack={handleSimulateAttack}
            activeAttack={activeAttack}
            onHumanApprove={handleHumanApprove}
          />
        )}

        {activeTab === 'merchant' && (
          <MerchantAdmin
            catalog={catalog}
            discountCap={merchantDiscountCap}
            setDiscountCap={setMerchantDiscountCap}
            agentDiscoveryActive={agentDiscoveryActive}
            setAgentDiscoveryActive={setAgentDiscoveryActive}
            onCatalogUpdated={(newCat) => {
              setCatalog(newCat);
              showToast('✨ Published new SKU to .well-known/agent-commerce.json!');
            }}
          />
        )}

        {activeTab === 'mcp' && (
          <MCPHub />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}
      </main>

      {/* Razorpay Checkout Modal */}
      <RazorpayModal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        transactionData={pendingTransaction}
        onSettlementComplete={handleSettlementComplete}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] px-4 lg:px-8 py-5 text-xs text-slate-500">
        <div className="w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-display">RazorAgent OS</span>
            <span>—</span>
            <span>Built for Razorpay AI Buildathon 2026</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono-code text-[11px]">
            <span>ACP/1.0</span>
            <span>•</span>
            <span>NPCI-UAP</span>
            <span>•</span>
            <span>AP2/x402</span>
            <span>•</span>
            <span className="text-cyan-400 font-semibold">Track 01: AI Growth & Agentic Commerce</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
