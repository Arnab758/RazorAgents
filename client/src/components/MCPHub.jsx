import React, { useState } from 'react';
import { Play, Copy, Server } from 'lucide-react';

export default function MCPHub() {
  const [selectedTool, setSelectedTool] = useState('discover_acp_merchants');
  const [executionResult, setExecutionResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState('claude');
  const [copiedConfig, setCopiedConfig] = useState(false);

  const tools = [
    {
      name: 'discover_acp_merchants',
      desc: 'Discovers verified merchants publishing ACP manifests in India with KYC trust scores > 90.',
      params: { category: 'cloud_compute', minTrustScore: 90 },
      endpoint: '/api/catalog',
      method: 'GET',
      sampleResponse: {
        jsonrpc: '2.0',
        result: {
          merchants: [
            {
              merchant_id: 'rzp_merch_cloudgpu_0926',
              brand_name: 'CloudGPU.ai Technologies Pvt Ltd',
              trust_score: 98.4,
              vpa: 'cloudgpu@razorpay',
              settlement_rails: ['RAZORPAY_UPI_AUTOPAY', 'RAZORPAY_DIRECT_GATEWAY'],
              acp_endpoint: 'https://razoragents.os/.well-known/agent-commerce.json'
            }
          ]
        },
        id: 'mcp_call_001'
      }
    },
    {
      name: 'negotiate_cart_order',
      desc: 'Invokes AI-to-AI dynamic negotiation protocol against the merchant sales agent.',
      params: { itemId: 'sku_gpu_a100_40h', quantity: 1, targetDiscountPercent: 12 },
      endpoint: '/api/negotiate',
      method: 'POST',
      sampleResponse: {
        jsonrpc: '2.0',
        result: {
          status: 'CONSENSUS_REACHED',
          item: 'NVIDIA A100 SXM4 (40 GPU-Hours)',
          original_price: 7200,
          negotiated_price: 6480,
          savings_inr: 720,
          discount_percentage: 10,
          approved_by: 'Vulcan_Store_Agent_ACP_v1'
        },
        id: 'mcp_call_002'
      }
    },
    {
      name: 'evaluate_sentinel_firewall',
      desc: 'Validates spending limits, intent alignment, and prompt injection before money clearance.',
      params: { cartTotalINR: 6480, mandateMaxCapINR: 25000, userIntent: 'Procure GPU cluster for AI' },
      endpoint: '/api/sentinel/evaluate',
      method: 'POST',
      sampleResponse: {
        jsonrpc: '2.0',
        result: {
          decision: 'APPROVED',
          compositeScore: 96,
          gateAction: 'ALLOW_PAYMENT_CLEARANCE',
          pillars: {
            injectionFirewall: 100,
            boundedMandate: 100,
            merchantTrust: 98,
            intentDrift: 95
          }
        },
        id: 'mcp_call_003'
      }
    },
    {
      name: 'execute_bounded_checkout',
      desc: 'Dispatches signed mandate to Razorpay rails and returns verifiable cryptographic receipt.',
      params: { orderId: 'order_rzp_9841', amountINR: 6480, mandateToken: 'mnd_token_bounded_992' },
      endpoint: '/api/payments/settle',
      method: 'POST',
      sampleResponse: {
        jsonrpc: '2.0',
        result: {
          razorpay_payment_id: 'pay_rzp_7749102',
          npci_uap_ref: 'UAP-IN-A8F2',
          status: 'SUCCESS',
          cryptographic_signature: '7e2b19cf83d29a...f0a1',
          verifiable_hash: '9a8d7c6b5e4f3a21',
          settlement_timestamp: '2026-03-31T14:32:10Z'
        },
        id: 'mcp_call_004'
      }
    }
  ];

  const currentTool = tools.find(t => t.name === selectedTool) || tools[0];

  const handleTestCall = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      if (currentTool.name === 'discover_acp_merchants') {
        const res = await fetch('/api/catalog');
        if (res.ok) {
          const data = await res.json();
          setExecutionResult({
            jsonrpc: '2.0',
            result: {
              merchants: [
                {
                  merchant_id: 'rzp_merch_cloudgpu_0926',
                  brand_name: 'CloudGPU.ai Technologies Pvt Ltd',
                  trust_score: 98.4,
                  vpa: 'cloudgpu@razorpay',
                  catalog_items: data.catalog || []
                }
              ]
            },
            id: 'mcp_call_live_' + Date.now().toString().slice(-4)
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Live tool call falling back to schema simulation:', e);
    } finally {
      setIsExecuting(false);
    }

    // High fidelity fallback simulation
    setTimeout(() => {
      setExecutionResult(currentTool.sampleResponse);
      setIsExecuting(false);
    }, 450);
  };

  const configs = {
    claude: {
      name: 'claude_desktop_config.json',
      content: `{
  "mcpServers": {
    "razorpay-bounded-gateway": {
      "command": "npx",
      "args": ["-y", "@razorpay/agent-mcp-server"],
      "env": {
        "RAZORPAY_KEY_ID": "rzp_test_51LzV7g3p2x9k",
        "RAZORPAY_KEY_SECRET": "your_test_secret_here",
        "VULCAN_SENTINEL_MODE": "ENFORCED",
        "MANDATE_MAX_INR": "25000",
        "NPCI_UAP_COMPLIANCE": "TRUE"
      }
    }
  }
}`
    },
    cursor: {
      name: 'mcp.json (Cursor / Windsurf)',
      content: `{
  "mcpServers": {
    "razorpay-commerce": {
      "url": "http://localhost:3000/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer mnd_bounded_token_8849",
        "X-Razorpay-Mode": "LIVE_TEST"
      }
    }
  }
}`
    },
    python: {
      name: 'agent_procure.py (Python SDK)',
      content: `from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Initialize autonomous buyer agent on Razorpay bounded rails
async with stdio_client(StdioServerParameters(
    command="npx",
    args=["-y", "@razorpay/agent-mcp-server"],
    env={"RAZORPAY_KEY_ID": "rzp_test_demo", "MANDATE_MAX_INR": "25000"}
)) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        # Autonomous discovery & bounded settlement
        result = await session.call_tool("execute_bounded_checkout", {
            "orderId": "order_rzp_auto_01",
            "amountINR": 6480,
            "mandateToken": "mnd_bounded_session_8849"
        })
        print("Payment Cleared:", result.content)`
    },
    curl: {
      name: 'cURL (JSON-RPC 2.0)',
      content: `curl -X POST http://localhost:3000/api/sentinel/evaluate \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "${currentTool.name}",
    "params": ${JSON.stringify(currentTool.params)},
    "id": 1
  }'`
    }
  };

  const copyActiveConfig = () => {
    navigator.clipboard.writeText(configs[activeConfigTab].content);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900/90 to-blue-950/30 border border-purple-800/30 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono-code border border-purple-500/20">
                ANTHROPIC CLAUDE & OPEN PROTOCOL
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono-code border border-emerald-500/20">
                JSON-RPC 2.0
              </span>
            </div>
            <h2 className="text-lg font-bold font-display text-white mt-1.5 flex items-center gap-2">
              Model Context Protocol (MCP) Server for Razorpay
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Exposing standardized financial tools so any autonomous LLM agent (Claude, GPT, Gemini) can safely discover, negotiate, and transact on Razorpay rails within cryptographic boundaries.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono-code text-cyan-300">
            <Server className="w-3.5 h-3.5" />
            <span>razorpay-agent-mcp:v1.2</span>
          </div>
        </div>
      </div>

      {/* Main MCP Playground Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Tool Selector & Parameters (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-display">Exposed MCP Tools</h3>
            <span className="text-[10px] font-mono-code text-slate-400">4 Tools Active</span>
          </div>

          <div className="space-y-2">
            {tools.map(tool => {
              const isSelected = selectedTool === tool.name;
              return (
                <button
                  key={tool.name}
                  onClick={() => {
                    setSelectedTool(tool.name);
                    setExecutionResult(null);
                  }}
                  className={`w-full p-3 rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500/60 text-white shadow-md shadow-purple-950/40'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono-code font-bold text-cyan-400">{tool.name}</span>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{tool.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Test Call Button */}
          <button
            onClick={handleTestCall}
            disabled={isExecuting}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-purple-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isExecuting ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                <span>Invoking MCP Tool Rail...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate MCP Tool Call (`{currentTool.name}`)</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Input Schema & Output Inspector (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-white font-mono-code">Input Schema & Output Stream</span>
              <span className="text-[10px] text-emerald-400 font-mono-code bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                LIVE_RPC_STREAM
              </span>
            </div>

            {/* Input Arguments Box */}
            <div className="mt-3 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">Input Arguments (JSON-RPC):</span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono-code text-slate-300 overflow-x-auto">
                {JSON.stringify(currentTool.params, null, 2)}
              </pre>
            </div>

            {/* Execution Result Box */}
            <div className="mt-3 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">MCP Response Payload:</span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono-code text-cyan-300 overflow-x-auto min-h-[140px]">
                {executionResult
                  ? JSON.stringify(executionResult, null, 2)
                  : '// Click "Simulate MCP Tool Call" to execute live response payload'}
              </pre>
            </div>
          </div>

          {/* Quick Copy MCP Client Configs */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Export Ready:</span>
                {['claude', 'cursor', 'python', 'curl'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveConfigTab(tab)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono-code transition-colors cursor-pointer ${
                      activeConfigTab === tab
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={copyActiveConfig}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedConfig ? 'Copied to Clipboard!' : `Copy ${configs[activeConfigTab].name}`}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
