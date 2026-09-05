import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { merchantCatalog, getACPManifest } from './protocols/acpManifest.js';
import { negotiationEngine } from './services/negotiationEngine.js';
import { vulcanSentinel } from './services/vulcanSentinel.js';
import { razorpayService } from './services/razorpayService.js';

dotenv.config();

const server = new Server(
  {
    name: 'razorpay-agent-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 1. List MCP Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'discover_acp_merchants',
        description: 'Discovers verified merchants publishing ACP (.well-known/agent-commerce.json) manifests in India with KYC trust scores > 90.',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'e.g. cloud_compute, fintech_api' }
          }
        }
      },
      {
        name: 'get_merchant_catalog',
        description: 'Fetches real-time prices, SKU inventory, and margin discount rules from the merchant ACP manifest.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'negotiate_cart_order',
        description: 'Initiates autonomous AI-to-AI dynamic price bargaining using Gemini 3.6 Flash.',
        inputSchema: {
          type: 'object',
          properties: {
            userPrompt: { type: 'string', description: 'Principal user goal' },
            itemId: { type: 'string', description: 'Product SKU ID' },
            quantity: { type: 'number', description: 'Number of units' },
            buyerMaxBudgetINR: { type: 'number', description: 'Hard spending limit' }
          },
          required: ['userPrompt', 'itemId']
        }
      },
      {
        name: 'evaluate_sentinel_firewall',
        description: 'Evaluates transaction against Vulcan Sentinel LLM-as-a-judge security gates before clearance.',
        inputSchema: {
          type: 'object',
          properties: {
            userIntent: { type: 'string' },
            cartTotalINR: { type: 'number' }
          },
          required: ['userIntent', 'cartTotalINR']
        }
      },
      {
        name: 'execute_bounded_checkout',
        description: 'Settles payment on Razorpay rails and returns verifiable HMAC-SHA256 audit receipt.',
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            amountINR: { type: 'number' }
          },
          required: ['amountINR']
        }
      }
    ]
  };
});

// 2. Handle MCP Tool Invocations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'discover_acp_merchants': {
        const manifest = getACPManifest();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'SUCCESS',
                verified_merchants: [manifest.merchant]
              }, null, 2)
            }
          ]
        };
      }

      case 'get_merchant_catalog': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(merchantCatalog, null, 2)
            }
          ]
        };
      }

      case 'negotiate_cart_order': {
        const result = await negotiationEngine.runNegotiation({
          userPrompt: args.userPrompt,
          selectedItemId: args.itemId,
          quantity: args.quantity || 1,
          buyerMaxBudgetINR: args.buyerMaxBudgetINR || 25000
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'evaluate_sentinel_firewall': {
        const evalResult = await vulcanSentinel.evaluateTransaction({
          userIntent: args.userIntent,
          agentReasoningTrace: 'MCP tool evaluation',
          cartTotalINR: args.cartTotalINR,
          targetMerchant: { vpa: 'cloudgpu@razorpay', trust_score: 98 }
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(evalResult, null, 2)
            }
          ]
        };
      }

      case 'execute_bounded_checkout': {
        const receipt = await razorpayService.settleAutonomousPayment({
          orderId: args.orderId || `order_${Date.now()}`,
          amountINR: args.amountINR,
          buyerAgentId: 'claude_desktop_agent',
          merchantVpa: 'cloudgpu@razorpay',
          mandateToken: 'mnd_token_mcp_live'
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(receipt, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown MCP tool: ${name}`);
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Tool error: ${err.message}` }]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 [RazorAgent MCP Server] Live and listening on stdio transport.');
}

main().catch((error) => {
  console.error('Fatal MCP Server error:', error);
  process.exit(1);
});
