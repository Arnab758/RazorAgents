import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { getACPManifest, merchantCatalog, addCatalogItem } from './protocols/acpManifest.js';
import { razorpayService } from './services/razorpayService.js';
import { vulcanSentinel } from './services/vulcanSentinel.js';
import { negotiationEngine } from './services/negotiationEngine.js';
import { mcpToolsDefinition } from './protocols/mcpServer.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// In-memory stats for live demo cockpit
const merchantStats = {
  totalAgentInteractions: 142,
  agenticGmvINR: 684200,
  successfulSettlements: 128,
  haltedByVulcanSentinel: 14,
  averageNegotiatedDiscountPct: 9.4,
  recentTransactions: []
};

// 1. ACP Protocol Endpoint
app.get('/.well-known/agent-commerce.json', (req, res) => {
  const protocolBase = `${req.protocol}://${req.get('host')}`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(getACPManifest(protocolBase));
});

// 2. Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'RazorAgent OS',
    buildathon_track: 'Track 01 — AI Growth & Agentic Commerce',
    razorpay_mode: razorpayService.isLiveClient ? 'LIVE_KEY' : 'SANDBOX_SIMULATOR',
    version: '1.0.0'
  });
});

// 3. Catalog Listing & Dynamic Registration
app.get('/api/catalog', (req, res) => {
  res.json({
    success: true,
    catalog: merchantCatalog
  });
});

app.post('/api/catalog', (req, res) => {
  try {
    const { name, category, unitPriceINR, inventory, maxNegotiableDiscountPercent, description, unit } = req.body;
    if (!name || !unitPriceINR) {
      return res.status(400).json({ success: false, error: 'Product name and price are required' });
    }
    const item = addCatalogItem({
      name,
      category,
      unitPriceINR,
      inventory,
      maxNegotiableDiscountPercent,
      description,
      unit
    });
    console.log(`✨ [Merchant Catalog] Registered new SKU: "${item.name}" (₹${item.unitPriceINR})`);
    res.json({
      success: true,
      item,
      catalog: merchantCatalog
    });
  } catch (err) {
    console.error('Error adding SKU:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Dual-Agent Dynamic Negotiation API (Standard Batch & Progressive Streaming)
app.post('/api/negotiate', async (req, res) => {
  try {
    const { userPrompt, selectedItemId, quantity, buyerMaxBudgetINR, buyerAggressiveness, humanInterjection } = req.body;
    merchantStats.totalAgentInteractions++;

    const negotiationResult = await negotiationEngine.runNegotiation({
      userPrompt,
      selectedItemId,
      quantity,
      buyerMaxBudgetINR,
      buyerAggressiveness,
      humanInterjection
    });

    res.json({
      success: true,
      data: negotiationResult
    });
  } catch (err) {
    console.warn('⚠️ [API /negotiate] Routing to resilient fallback engine:', err.message);
    try {
      const fallbackResult = negotiationEngine.fallbackDeterministicNegotiation(req.body);
      res.json({
        success: true,
        data: fallbackResult,
        failsafeActive: true
      });
    } catch (fatalErr) {
      console.error('Fatal fallback error:', fatalErr);
      res.status(500).json({ success: false, error: 'Internal negotiation service error' });
    }
  }
});

// Real-time Server-Sent Events (SSE) Stream for Live Turn-by-Turn Agentic Deliberation
app.post('/api/negotiate/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const { userPrompt, selectedItemId, quantity, buyerMaxBudgetINR, buyerAggressiveness, humanInterjection } = req.body;
    merchantStats.totalAgentInteractions++;

    const finalResult = await negotiationEngine.runNegotiation({
      userPrompt,
      selectedItemId,
      quantity,
      buyerMaxBudgetINR,
      buyerAggressiveness,
      humanInterjection,
      onTurnCallback: (turn) => {
        res.write(`data: ${JSON.stringify({ type: 'TURN', turn })}\n\n`);
      }
    });

    res.write(`data: ${JSON.stringify({ type: 'COMPLETE', data: finalResult })}\n\n`);
    res.end();
  } catch (err) {
    console.warn('SSE Stream Error, routing to fallback stream:', err.message);
    try {
      const fallbackResult = negotiationEngine.fallbackDeterministicNegotiation({
        ...req.body,
        onTurnCallback: (turn) => {
          res.write(`data: ${JSON.stringify({ type: 'TURN', turn })}\n\n`);
        }
      });
      res.write(`data: ${JSON.stringify({ type: 'COMPLETE', data: fallbackResult })}\n\n`);
    } catch (fallbackErr) {
      res.write(`data: ${JSON.stringify({ type: 'ERROR', error: fallbackErr.message })}\n\n`);
    }
    res.end();
  }
});

// 5. Vulcan Sentinel Evaluation (Explainable, Bounded, Gated)
app.post('/api/sentinel/evaluate', async (req, res) => {
  try {
    const {
      userIntent,
      agentReasoningTrace,
      cartTotalINR,
      cartItems,
      mandate,
      targetMerchant,
      simulationAttack,
      negotiationStatus,
      rejectionReason
    } = req.body;

    const evaluation = await vulcanSentinel.evaluateTransaction({
      userIntent,
      agentReasoningTrace,
      cartTotalINR,
      cartItems,
      mandate,
      targetMerchant,
      simulationAttack,
      negotiationStatus,
      rejectionReason
    });

    if (evaluation.decision === 'BLOCKED' || evaluation.decision === 'HALTED_BY_AGENT') {
      merchantStats.haltedByVulcanSentinel++;
    }

    res.json({
      success: true,
      evaluation
    });
  } catch (err) {
    console.error('Error in /api/sentinel/evaluate:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Razorpay Order Creation
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { amountINR, currency = 'INR', receipt, notes } = req.body;
    const result = await razorpayService.createOrder({ amountINR, currency, receipt, notes });
    res.json(result);
  } catch (err) {
    console.error('Error in /api/payments/create-order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Autonomous Settlement & Cryptographic Receipt Generation
app.post('/api/payments/settle', async (req, res) => {
  try {
    const { orderId, amountINR, buyerAgentId, merchantVpa, mandateToken, itemSummary } = req.body;

    const auditReceipt = await razorpayService.settleAutonomousPayment({
      orderId,
      amountINR,
      buyerAgentId: buyerAgentId || 'agent_claude_uap_01',
      merchantVpa: merchantVpa || 'cloudgpu@razorpay',
      mandateToken: mandateToken || 'mnd_token_bounded_992'
    });

    // Update real-time stats
    merchantStats.successfulSettlements++;
    merchantStats.agenticGmvINR += amountINR;
    merchantStats.recentTransactions.unshift({
      id: auditReceipt.razorpay_payment_id,
      amountINR,
      itemSummary: itemSummary || 'CloudGPU A100 Cluster Block',
      buyerAgentId: auditReceipt.buyer_agent_id,
      timestamp: auditReceipt.timestamp,
      hash: auditReceipt.verifiable_hash
    });

    if (merchantStats.recentTransactions.length > 20) {
      merchantStats.recentTransactions.pop();
    }

    res.json({
      success: true,
      receipt: auditReceipt
    });
  } catch (err) {
    console.error('Error in /api/payments/settle:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Verify Receipt Signature
app.post('/api/payments/verify', (req, res) => {
  try {
    const { receipt } = req.body;
    const isValid = razorpayService.verifyReceipt(receipt);
    res.json({ success: true, isValid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. MCP Server Tools Listing
app.get('/api/mcp/tools', (req, res) => {
  res.json(mcpToolsDefinition);
});

// 10. Merchant AI Analytics Telemetry
app.get('/api/merchant/stats', (req, res) => {
  res.json({
    success: true,
    stats: merchantStats
  });
});

// 11. Static Client Serving & SPA Fallback
const rootDist = path.resolve(process.cwd(), 'dist');
const clientWorkspaceDist = path.resolve(process.cwd(), 'client/dist');
const clientDist = fs.existsSync(path.join(rootDist, 'index.html'))
  ? rootDist
  : (fs.existsSync(path.join(clientWorkspaceDist, 'index.html')) ? clientWorkspaceDist : rootDist);

app.use(express.static(clientDist));
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<!doctype html><html><head><title>RazorAgent OS</title></head><body><div id="root">RazorAgent OS Live</div></body></html>');
  }
});

// Primary port 3000 ensures compatibility with the local AI Studio reverse proxy.
const PRIMARY_PORT = 3000;
const primaryServer = app.listen(PRIMARY_PORT, '0.0.0.0', () => {
  console.log(`\n========================================================`);
  console.log(`🚀 [RazorAgent OS] Server live at http://0.0.0.0:${PRIMARY_PORT}`);
  console.log(`🌐 ACP Manifest: http://localhost:${PRIMARY_PORT}/.well-known/agent-commerce.json`);
  console.log(`🛡️  Vulcan Sentinel: Active & Guarding Bounded Mandates`);
  console.log(`========================================================\n`);
});

primaryServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`ℹ️ Port ${PRIMARY_PORT} in use; listening on secondary or proxy.`);
  } else {
    console.warn(`Primary port notice:`, err.message);
  }
});

// Cloud Run Production Ingress Support:
// In deployed Cloud Run environments, Cloud Run routes traffic to process.env.PORT (typically 8080).
// Binding a listener on process.env.PORT satisfies Cloud Run container health checks.
// In the local dev container, port 8080 is managed by nginx, so EADDRINUSE is safely handled.
const CLOUD_RUN_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
let cloudRunServer = null;
if (CLOUD_RUN_PORT && CLOUD_RUN_PORT !== PRIMARY_PORT) {
  cloudRunServer = app.listen(CLOUD_RUN_PORT, '0.0.0.0', () => {
    console.log(`☁️  [Cloud Run Production] Ingress listener active on port ${CLOUD_RUN_PORT}`);
  });
  cloudRunServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`ℹ️ Port ${CLOUD_RUN_PORT} is already handled by proxy; port ${PRIMARY_PORT} serving.`);
    } else {
      console.warn(`⚠️ Cloud Run port listener note:`, err.message);
    }
  });
}

// Graceful termination for Cloud Run container lifecycle
const shutdown = () => {
  console.log('Stopping server gracefully...');
  primaryServer.close(() => {
    if (cloudRunServer) {
      cloudRunServer.close(() => process.exit(0));
    } else {
      process.exit(0);
    }
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

