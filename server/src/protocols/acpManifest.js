import crypto from 'crypto';

/**
 * Agentic Commerce Protocol (ACP) & NPCI-UAP Manifest Generator
 * Exposes /.well-known/agent-commerce.json for autonomous AI buyers.
 */

export const merchantCatalog = [
  {
    id: 'sku_gpu_a100_40h',
    name: 'NVIDIA A100 SXM4 (40 GPU-Hours)',
    category: 'cloud_compute',
    description: 'On-demand high-throughput cluster for LLM fine-tuning and inference. Dedicated 80GB VRAM instances.',
    unitPriceINR: 7200,
    inventory: 18,
    currency: 'INR',
    unit: 'cluster_block',
    maxNegotiableDiscountPercent: 15,
    minOrderQuantityForDiscount: 1,
    tierDiscounts: [
      { minQty: 1, discountPercent: 5 },
      { minQty: 2, discountPercent: 12 },
      { minQty: 4, discountPercent: 15 }
    ]
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
    maxNegotiableDiscountPercent: 10,
    minOrderQuantityForDiscount: 1,
    tierDiscounts: [
      { minQty: 1, discountPercent: 4 },
      { minQty: 2, discountPercent: 8 },
      { minQty: 3, discountPercent: 10 }
    ]
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
    maxNegotiableDiscountPercent: 20,
    minOrderQuantityForDiscount: 1,
    tierDiscounts: [
      { minQty: 1, discountPercent: 10 },
      { minQty: 2, discountPercent: 20 }
    ]
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
    maxNegotiableDiscountPercent: 12,
    minOrderQuantityForDiscount: 2,
    tierDiscounts: [
      { minQty: 2, discountPercent: 8 },
      { minQty: 5, discountPercent: 12 }
    ]
  }
];

export function getACPManifest(baseUrl = 'http://localhost:5000') {
  const catalogHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(merchantCatalog))
    .digest('hex');

  return {
    $schema: 'https://specs.agentic-commerce.org/v1/acp-manifest.json',
    protocol_version: 'ACP/1.0',
    npci_uap_compatible: true,
    ap2_x402_compliant: true,
    merchant: {
      id: 'rzp_merch_cloudgpu_0926',
      legal_name: 'CloudGPU India Technologies Pvt Ltd',
      brand_name: 'CloudGPU.ai',
      verified_by: 'Razorpay KYC & NPCI Directory',
      trust_score: 98.4,
      vpa: 'cloudgpu@razorpay',
      settlement_rail: 'RAZORPAY_INSTANT_SETTLEMENT',
      jurisdiction: 'IN'
    },
    capabilities: {
      agent_negotiation: true,
      ephemeral_tokenized_mandates: true,
      dynamic_discount_resolution: true,
      partial_fulfillment: false,
      instant_crypto_receipt: true
    },
    endpoints: {
      catalog: `${baseUrl}/.well-known/agent-commerce.json`,
      negotiate: `${baseUrl}/api/negotiate`,
      vulcan_precheck: `${baseUrl}/api/sentinel/evaluate`,
      execute_checkout: `${baseUrl}/api/payments/create-order`,
      verify_receipt: `${baseUrl}/api/payments/verify`
    },
    negotiation_parameters: {
      allowed_currencies: ['INR'],
      min_transaction_inr: 100,
      max_transaction_inr: 500000,
      timeout_seconds: 45,
      signature_algorithm: 'HMAC-SHA256'
    },
    catalog_signature: {
      sha256: catalogHash,
      timestamp: new Date().toISOString()
    },
    items: merchantCatalog
  };
}

export function addCatalogItem(newItem) {
  const item = {
    id: newItem.id || `sku_custom_${Date.now()}`,
    name: newItem.name,
    category: newItem.category || 'cloud_compute',
    description: newItem.description || 'Custom merchant inventory registered for autonomous agent commerce.',
    unitPriceINR: Number(newItem.unitPriceINR) || 1000,
    inventory: Number(newItem.inventory) || 10,
    currency: 'INR',
    unit: newItem.unit || 'unit',
    maxNegotiableDiscountPercent: Number(newItem.maxNegotiableDiscountPercent) || 15
  };
  merchantCatalog.unshift(item);
  return item;
}

