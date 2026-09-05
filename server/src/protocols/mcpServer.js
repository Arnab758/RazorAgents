/**
 * RazorAgent MCP (Model Context Protocol) Tool Definitions
 * Enables any LLM agent to interact natively with Razorpay rails.
 */

export const mcpToolsDefinition = {
  server: {
    name: 'razorpay-agent-mcp',
    version: '1.0.0',
    description: 'Model Context Protocol Server for Bounded Autonomous Commerce on Razorpay Rails'
  },
  tools: [
    {
      name: 'discover_acp_merchants',
      description: 'Finds verified merchants offering Agentic Commerce Protocol (.well-known/agent-commerce.json) endpoints in India.',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Merchant category, e.g., cloud_compute, fintech_api, ai_tokens, travel'
          },
          minTrustScore: {
            type: 'number',
            description: 'Minimum KYC trust score required (0-100), default 90'
          }
        },
        required: []
      }
    },
    {
      name: 'get_merchant_catalog',
      description: 'Fetches real-time prices, inventories, and negotiable discount rules from a merchant ACP manifest.',
      inputSchema: {
        type: 'object',
        properties: {
          merchantUrl: {
            type: 'string',
            description: 'Merchant root URL hosting .well-known/agent-commerce.json'
          }
        },
        required: ['merchantUrl']
      }
    },
    {
      name: 'negotiate_cart_order',
      description: 'Initiates automated AI-to-AI price negotiation with the merchant sales agent.',
      inputSchema: {
        type: 'object',
        properties: {
          itemId: { type: 'string', description: 'Product SKU ID' },
          quantity: { type: 'number', description: 'Quantity requested' },
          targetDiscountPercent: { type: 'number', description: 'Proposed discount percentage' },
          buyerBudgetLimitINR: { type: 'number', description: 'Maximum budget ceiling for this transaction' }
        },
        required: ['itemId', 'quantity']
      }
    },
    {
      name: 'evaluate_sentinel_firewall',
      description: 'Pre-checks the transaction against Vulcan Sentinel risk policies (prompt injection, mandate spending limits, merchant trust).',
      inputSchema: {
        type: 'object',
        properties: {
          cartTotalINR: { type: 'number' },
          userIntent: { type: 'string' },
          agentReasoningTrace: { type: 'string' },
          mandateToken: { type: 'string' }
        },
        required: ['cartTotalINR', 'userIntent']
      }
    },
    {
      name: 'execute_bounded_checkout',
      description: 'Clears the autonomous transaction through Razorpay settlement rails, returning a verifiable cryptographic receipt.',
      inputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          amountINR: { type: 'number' },
          mandateToken: { type: 'string' },
          buyerAgentId: { type: 'string' }
        },
        required: ['amountINR', 'mandateToken']
      }
    }
  ]
};
