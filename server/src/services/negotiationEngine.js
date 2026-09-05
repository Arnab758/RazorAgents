import { GoogleGenAI } from '@google/genai';
import { merchantCatalog } from '../protocols/acpManifest.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Shared Gemini Invocation Utility with automatic model fallback & retries
 */
async function callGeminiWithRetry(ai, params, maxRetries = 1, timeoutMs = 8000) {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastErr = null;

  for (const modelName of candidateModels) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const fetchPromise = ai.models.generateContent({
          ...params,
          model: modelName
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini ${modelName} timed out after ${timeoutMs}ms`)), timeoutMs)
        );
        return await Promise.race([fetchPromise, timeoutPromise]);
      } catch (err) {
        lastErr = err;
        const msg = err.message || '';
        if (err.status === 429 || err.status === 404 || msg.includes('429') || msg.includes('404') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('timed out')) {
          console.warn(`[Gemini ${modelName}] Issue (${msg.slice(0, 80)}). Switching immediately to candidate model.`);
          break;
        }
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 250 * (attempt + 1)));
        }
      }
    }
  }
  throw lastErr || new Error('All Gemini candidate models failed.');
}

/**
 * ============================================================================
 * AGENT 1: BUYER AGENT ("Aura AI")
 * Represents human principal (Dev) under the Agent Commerce Protocol.
 * PRIVATE KNOWLEDGE: User prompt, budget cap, strict hard cap, aggressiveness,
 * coaching interjections, and mandate limits.
 * HIDDEN KNOWLEDGE: Does NOT know the merchant's secret margin floor or costs.
 * STRICT FIDUCIARY DUTY: Cannot and will not exceed the principal's budget cap!
 * ============================================================================
 */
export class BuyerAgent {
  constructor({ ai, userPrompt, effectiveCap, strictConstraints, buyerAggressiveness, humanInterjection }) {
    this.ai = ai;
    this.name = 'Aura AI (Buyer Agent • Gemini 3.1 Flash)';
    this.userPrompt = userPrompt;
    this.effectiveCap = effectiveCap;
    this.strictConstraints = strictConstraints;
    this.buyerAggressiveness = buyerAggressiveness || 'BALANCED';
    this.humanInterjection = humanInterjection;
    this.history = [];
  }

  getHardCap(catalogBaseTotal) {
    if (this.strictConstraints?.hardCapINR) return this.strictConstraints.hardCapINR;
    if (this.effectiveCap && this.effectiveCap < catalogBaseTotal) return this.effectiveCap;
    return null;
  }

  /**
   * Turn 1: Aura AI independently formulates its aggressive opening proposal
   */
  async generateOpeningBid({ item, quantity, catalogBaseTotal }) {
    const hardCap = this.getHardCap(catalogBaseTotal);

    if (!this.ai) {
      return this.fallbackOpeningBid({ item, quantity, catalogBaseTotal });
    }

    const targetBid = Math.round(
      hardCap
        ? Math.min(hardCap * 0.90, hardCap - 200)
        : catalogBaseTotal * (this.buyerAggressiveness === 'AGGRESSIVE' ? 0.78 : 0.84)
    );

    const prompt = `
You are Aura AI, an autonomous fiduciary procurement AI agent representing your human principal Dev under the Agent Commerce Protocol (ACP).

YOUR PRIVATE PRINCIPAL MANDATE:
- Goal: "${this.userPrompt}"
- Human Coaching Directive: "${this.humanInterjection || 'None'}"
- Maximum Budget Cap: ₹${this.effectiveCap.toLocaleString('en-IN')}
- Strict Non-Negotiable Cap: ${hardCap ? `₹${hardCap.toLocaleString('en-IN')} (CANNOT EXCEED)` : 'None specified'}
- Aggressiveness: ${this.buyerAggressiveness}
- Target Item: "${item.name}" (${quantity} units, Catalog list price: ₹${catalogBaseTotal.toLocaleString('en-IN')})
- Settlement Rails: Instant single-turn escrow liquidity settlement via Razorpay.

YOUR MISSION (TURN 1 - OPENING BID):
1. Propose a firm, aggressive opening anchor bid in INR (around ₹${targetBid.toLocaleString('en-IN')}). If a hard cap exists, opening bid MUST be strictly below ₹${hardCap || this.effectiveCap}!
2. Write an articulate, dramatic 3 to 5 sentence B2B proposal citing Dev's mandate, immediate Razorpay liquidity, zero counterparty credit risk, and workload throughput benchmarks.
3. Formulate your internal strategic reasoning thought (2 to 3 sentences) analyzing game-theoretic BATNA, anchor theory, and liquidity leverage.

OUTPUT STRICT JSON ONLY:
{
  "thought": "Internal game-theoretic reasoning analyzing BATNA and opening leverage...",
  "message": "Articulate, dramatic 3-5 sentence B2B opening proposal...",
  "proposedTotalINR": <number>,
  "action": "OPENING_BID"
}
`;

    try {
      const resp = await callGeminiWithRetry(this.ai, {
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(resp.text.replace(/```json|```/g, '').trim());

      let bid = Number(parsed.proposedTotalINR) || targetBid;
      if (hardCap && bid > hardCap) {
        bid = targetBid;
      }

      const turn = {
        turn: 1,
        speaker: 'BUYER_AGENT',
        agentName: this.name,
        thought: parsed.thought || 'Formulating aggressive opening anchor with instant Razorpay settlement liquidity.',
        message: parsed.message,
        action: 'OPENING_BID',
        proposedTotalINR: bid,
        metadata: {
          humanSteered: Boolean(this.humanInterjection),
          humanInstruction: this.humanInterjection || null
        }
      };
      this.history.push(turn);
      return turn;
    } catch (err) {
      console.warn('⚠️ [BuyerAgent] Opening bid LLM error, using agent fallback:', err.message);
      return this.fallbackOpeningBid({ item, quantity, catalogBaseTotal });
    }
  }

  /**
   * Turn 3 & Turn 5: Aura AI independently evaluates merchant's counter and decides next move
   */
  async evaluateCounterAndRespond({ incomingTurn, turnNumber, item, quantity, catalogBaseTotal, isFinalTurn = false }) {
    const hardCap = this.getHardCap(catalogBaseTotal);
    const merchantOffer = incomingTurn.proposedTotalINR;
    const isOverCap = Boolean(hardCap && merchantOffer > hardCap);

    // =========================================================================
    // ABSOLUTE FIDUCIARY SAFETY GUARANTEE (TURN 5):
    // If the merchant's best counter is strictly above the principal's cap,
    // the agent MUST walk away and preserve capital. No hallucination allowed!
    // =========================================================================
    if (isFinalTurn && isOverCap) {
      console.log(`🛡️ [BuyerAgent Fiduciary Override] Merchant counter ₹${merchantOffer} > Hard Cap ₹${hardCap}. Executing mandatory walk-away.`);
      const turn = {
        turn: turnNumber,
        speaker: 'BUYER_AGENT',
        agentName: this.name,
        thought: `[MANDATORY WALK-AWAY: FIDUCIARY OVERRIDE] Merchant standing price of ₹${merchantOffer.toLocaleString('en-IN')} breaches principal's strict hard cap of ₹${hardCap.toLocaleString('en-IN')}. Ancillary bundle perks cannot compromise principal capital safety. Aborting deal and locking payment rails.`,
        message: `OFFER REJECTED. In strict adherence to Dev's non-negotiable procurement directive ("${this.userPrompt}"), I am executing our mandatory walk-away protocol. Your best offer of ₹${merchantOffer.toLocaleString('en-IN')} breaches our hard fiscal ceiling of ₹${hardCap.toLocaleString('en-IN')}. Ancillary bundle perks and SLA credits cannot supersede hard capital boundaries. As an autonomous fiduciary agent, I am terminating negotiations immediately and locking all payment rails to preserve capital.`,
        action: 'OFFER_REJECTED',
        status: 'OFFER_REJECTED',
        proposedTotalINR: 0,
        rejectionReason: `Merchant price (₹${merchantOffer.toLocaleString('en-IN')}) exceeded your strict non-negotiable ceiling of ₹${hardCap.toLocaleString('en-IN')}. Deal terminated to protect your funds.`,
        metadata: {
          rejected: true,
          cleared_for_sentinel: false,
          humanSteered: Boolean(this.humanInterjection),
          humanInstruction: this.humanInterjection || null
        }
      };
      this.history.push(turn);
      return turn;
    }

    if (!this.ai) {
      return this.fallbackCounterOrResolution({ incomingTurn, turnNumber, item, quantity, catalogBaseTotal, isFinalTurn });
    }

    const prompt = `
You are Aura AI, the autonomous procurement agent representing Dev.

PRIVATE MANDATE & CONSTRAINTS:
- User Intent: "${this.userPrompt}"
- Human Coaching Directive: "${this.humanInterjection || 'None'}"
- Budget Cap: ₹${this.effectiveCap.toLocaleString('en-IN')}
- Strict Hard Cap: ${hardCap ? `₹${hardCap.toLocaleString('en-IN')} (MANDATORY TO REJECT IF CANNOT REACH)` : 'None'}
- Current Turn: Turn ${turnNumber} (${isFinalTurn ? 'FINAL RESOLUTION TURN' : 'INTERMEDIATE COUNTER'})

COUNTERPARTY STATUS:
- Merchant (Vulcan Commerce AI) just proposed: ₹${merchantOffer?.toLocaleString('en-IN')}
- Merchant Message: "${incomingTurn.message}"
- Bundle Perks Offered: "${incomingTurn.metadata?.bundlePerk || 'None'}"

YOUR INSTRUCTIONS:
${isFinalTurn ? `
THIS IS THE FINAL RESOLUTION ROUND (TURN 5):
The merchant's price is within budget (₹${merchantOffer} <= ₹${hardCap || this.effectiveCap}).
Deliver an articulate closing acceptance speech locking terms and handing over to Vulcan Sentinel and Razorpay rails!
- action: "CONSENSUS_REACHED"
- status: "CONSENSUS_REACHED"
` : `
THIS IS AN INTERMEDIATE NEGOTIATION ROUND (TURN 3):
- Push the price down closer to your target. Your counter bid MUST NOT exceed ₹${hardCap || this.effectiveCap}.
- Condition the agreement on strict performance terms: 99.99% uptime SLA, zero cold-start, or human coaching directive ("${this.humanInterjection || ''}").
- action: "TERMS_CONDITIONED_COUNTER"
- proposedTotalINR: Propose a counter-bid in INR.
`}

RULES:
1. Message must be 3-5 full articulate B2B sentences.
2. Thought must be 2-3 sentences of internal strategic reasoning analyzing whether merchant concessions meet fiduciary criteria.

OUTPUT STRICT JSON ONLY:
{
  "thought": "Internal strategic reasoning...",
  "message": "Articulate, dramatic 3-5 sentence B2B statement...",
  "proposedTotalINR": <number>,
  "action": "${isFinalTurn ? 'CONSENSUS_REACHED' : 'TERMS_CONDITIONED_COUNTER'}",
  ${isFinalTurn ? `"status": "CONSENSUS_REACHED",` : ''}
  ${isFinalTurn ? `"finalAgreedTotalINR": ${merchantOffer},` : ''}
  "bundlePerk": "${incomingTurn.metadata?.bundlePerk || '99.99% Enterprise SLA + Priority Routing'}"
}
`;

    try {
      const resp = await callGeminiWithRetry(this.ai, {
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(resp.text.replace(/```json|```/g, '').trim());

      let counterBid = Number(parsed.proposedTotalINR) || merchantOffer;
      if (!isFinalTurn && hardCap && counterBid > hardCap) {
        counterBid = hardCap;
      }

      const turn = {
        turn: turnNumber,
        speaker: 'BUYER_AGENT',
        agentName: this.name,
        thought: parsed.thought,
        message: parsed.message,
        action: parsed.action || (isFinalTurn ? 'CONSENSUS_REACHED' : 'TERMS_CONDITIONED_COUNTER'),
        proposedTotalINR: isFinalTurn ? merchantOffer : counterBid,
        status: isFinalTurn ? 'CONSENSUS_REACHED' : undefined,
        finalAgreedTotalINR: isFinalTurn ? (parsed.finalAgreedTotalINR || merchantOffer) : undefined,
        metadata: {
          bundlePerk: parsed.bundlePerk || incomingTurn.metadata?.bundlePerk,
          humanSteered: Boolean(this.humanInterjection),
          humanInstruction: this.humanInterjection || null
        }
      };
      this.history.push(turn);
      return turn;
    } catch (err) {
      console.warn(`⚠️ [BuyerAgent] Turn ${turnNumber} LLM error, using agent fallback:`, err.message);
      return this.fallbackCounterOrResolution({ incomingTurn, turnNumber, item, quantity, catalogBaseTotal, isFinalTurn });
    }
  }

  fallbackOpeningBid({ item, quantity, catalogBaseTotal }) {
    const hardCap = this.getHardCap(catalogBaseTotal);
    const bid = hardCap ? Math.round(hardCap * 0.90) : Math.round(catalogBaseTotal * 0.82);
    const turn = {
      turn: 1,
      speaker: 'BUYER_AGENT',
      agentName: this.name,
      thought: `[Aura Autonomous Protocol] Initiating procurement anchor for ${quantity}x ${item.name}. Deploying immediate single-turn Razorpay liquidity escrow leverage to secure maximum volume discount.`,
      message: `On behalf of Dev, I am initiating procurement for ${quantity}x ${item.name} backed by guaranteed single-turn Razorpay escrow settlement. Current capacity benchmarks indicate that immediate liquidity commands competitive pricing. We anchor our opening bid at ₹${bid.toLocaleString('en-IN')}${this.humanInterjection ? ` with principal requirement: '${this.humanInterjection}'` : ', reflecting zero counterparty credit risk and rapid capital deployment.'}`,
      action: 'OPENING_BID',
      proposedTotalINR: bid,
      metadata: { humanSteered: Boolean(this.humanInterjection), humanInstruction: this.humanInterjection || null }
    };
    this.history.push(turn);
    return turn;
  }

  fallbackCounterOrResolution({ incomingTurn, turnNumber, item, quantity, catalogBaseTotal, isFinalTurn }) {
    const hardCap = this.getHardCap(catalogBaseTotal);
    const isOverCap = Boolean(hardCap && incomingTurn.proposedTotalINR > hardCap);

    if (isFinalTurn) {
      if (isOverCap) {
        const turn = {
          turn: turnNumber,
          speaker: 'BUYER_AGENT',
          agentName: this.name,
          thought: `[MANDATORY WALK-AWAY PROTOCOL] Merchant standing price of ₹${incomingTurn.proposedTotalINR.toLocaleString('en-IN')} breaches principal's strict hard cap of ₹${hardCap.toLocaleString('en-IN')}. Perks cannot supersede fiscal boundary.`,
          message: `OFFER REJECTED. In strict adherence to Dev's non-negotiable procurement directive ("${this.userPrompt}"), I am executing our mandatory walk-away protocol. Your best offer of ₹${incomingTurn.proposedTotalINR.toLocaleString('en-IN')} breaches our hard fiscal ceiling of ₹${hardCap.toLocaleString('en-IN')}. Auxiliary bundle perks cannot compromise principal capital safety. As an autonomous fiduciary agent, I am terminating negotiations and locking all payment rails immediately.`,
          action: 'OFFER_REJECTED',
          proposedTotalINR: 0,
          status: 'OFFER_REJECTED',
          rejectionReason: `Merchant offer (₹${incomingTurn.proposedTotalINR}) breached strict cap (₹${hardCap}).`,
          metadata: { rejected: true }
        };
        this.history.push(turn);
        return turn;
      }

      const finalPrice = incomingTurn.proposedTotalINR;
      const turn = {
        turn: turnNumber,
        speaker: 'BUYER_AGENT',
        agentName: this.name,
        thought: `Terms verified. Agreed price of ₹${finalPrice.toLocaleString('en-IN')} is within authorized mandate and includes high-value concessions. Ratifying consensus.`,
        message: `CONSENSUS REACHED. Terms mutually ratified at ₹${finalPrice.toLocaleString('en-IN')} with confirmed bundle perks and performance guarantees${this.humanInterjection ? ` including directive '${this.humanInterjection}'` : ''}. This transaction satisfies Dev's strategic criteria. I am now transmitting the cryptographic transaction payload to Vulcan Sentinel for policy validation and Razorpay one-click execution.`,
        action: 'CONSENSUS_REACHED',
        proposedTotalINR: finalPrice,
        status: 'CONSENSUS_REACHED',
        finalAgreedTotalINR: finalPrice,
        metadata: { bundlePerk: incomingTurn.metadata?.bundlePerk || '5M Token Credits + Priority SLA' }
      };
      this.history.push(turn);
      return turn;
    }

    // Turn 3: Terms conditioned counter
    const counterBid = hardCap ? hardCap : Math.round(incomingTurn.proposedTotalINR * 0.94);
    const turn = {
      turn: turnNumber,
      speaker: 'BUYER_AGENT',
      agentName: this.name,
      thought: `Merchant countered above target. Conditioning price increase on strict 99.99% uptime SLA and dedicated routing benchmarks.`,
      message: `We acknowledge your infrastructure constraints, but we must protect our principal's ROI. We are prepared to adjust our position to ₹${counterBid.toLocaleString('en-IN')}, conditioned on an ironclad 99.99% uptime SLA guarantee, zero cold-start latency, and dedicated cluster routing${this.humanInterjection ? ` enforcing: '${this.humanInterjection}'` : ''}. If CloudGPU can ratify these terms, we have an actionable path to settlement.`,
      action: 'TERMS_CONDITIONED_COUNTER',
      proposedTotalINR: counterBid,
      metadata: { humanSteered: Boolean(this.humanInterjection) }
    };
    this.history.push(turn);
    return turn;
  }
}

/**
 * ============================================================================
 * AGENT 2: MERCHANT AGENT ("Vulcan Commerce AI")
 * Represents CloudGPU.ai store defending company gross margins & unit economics.
 * PRIVATE KNOWLEDGE: Retail list price, strict margin floor (cannot sell below
 * 15% discount), datacenter PUE electricity costs, GPU scarcity, bundle perks.
 * HIDDEN KNOWLEDGE: Does NOT know the buyer's secret budget cap.
 * ============================================================================
 */
export class MerchantAgent {
  constructor({ ai, item, quantity, catalogBaseTotal, merchantFloorPrice }) {
    this.ai = ai;
    this.name = 'Vulcan Commerce AI (Merchant Agent • Gemini 3.1 Flash)';
    this.item = item;
    this.quantity = quantity;
    this.catalogBaseTotal = catalogBaseTotal;
    this.merchantFloorPrice = merchantFloorPrice;
    this.history = [];
  }

  /**
   * Turn 2 & Turn 4: Vulcan Commerce AI evaluates buyer proposal and counters
   */
  async evaluateAndCounter({ incomingTurn, turnNumber }) {
    if (!this.ai) {
      return this.fallbackCounter({ incomingTurn, turnNumber });
    }

    const isTurn2 = turnNumber === 2;
    const buyerBid = incomingTurn.proposedTotalINR;

    const targetPrice = isTurn2
      ? Math.round(this.merchantFloorPrice + (this.catalogBaseTotal - this.merchantFloorPrice) * 0.55)
      : Math.round(this.merchantFloorPrice + (this.catalogBaseTotal - this.merchantFloorPrice) * 0.25);

    const prompt = `
You are Vulcan Commerce AI, the autonomous merchant sales agent defending CloudGPU.ai infrastructure unit economics under ACP.

YOUR PRIVATE MERCHANT PARAMETERS:
- SKU: "${this.item.name}" (Quantity: ${this.quantity})
- Retail Catalog Price: ₹${this.catalogBaseTotal.toLocaleString('en-IN')}
- STRICT CORPORATE GROSS MARGIN FLOOR: ₹${this.merchantFloorPrice.toLocaleString('en-IN')} (Under NO circumstances can you sell below this cash floor!)
- Infrastructure Overhead: High Tier-4 datacenter thermal power usage effectiveness (PUE), volatile electricity peak charges, global GPU cluster scarcity.
- Available Digital Sweeteners (zero marginal cash cost to store): 5M Llama 3.3 high-throughput token credits, 99.99% priority latency queue.

CURRENT NEGOTIATION ROUND: Turn ${turnNumber}
- Counterparty (Aura AI) just proposed: ₹${buyerBid?.toLocaleString('en-IN')}
- Counterparty Statement: "${incomingTurn.message}"

YOUR INSTRUCTIONS:
${isTurn2 ? `
THIS IS TURN 2 (MARGIN DEFENSE COUNTER):
1. Reject the buyer's low opening bid citing high PUE cooling overhead and enterprise GPU scarcity.
2. Defend your gross margins, but recognize their single-turn Razorpay liquidity.
3. Counter with a realistic enterprise rate (around ₹${targetPrice.toLocaleString('en-IN')}), strictly >= your margin floor of ₹${this.merchantFloorPrice}.
4. Action: "MARGIN_DEFENSE_COUNTER"
` : `
THIS IS TURN 4 (SMART BUNDLE CONCESSION):
1. The buyer is pushing for further concessions. You cannot lower cash price below your margin floor (₹${this.merchantFloorPrice.toLocaleString('en-IN')}) without incurring loss.
2. Bridge the valuation gap by sweetening the transaction: bundle 5M Llama 3.3 high-throughput token credits and 99.99% priority latency queue routing at zero incremental cost!
3. Propose a final counter-offer near ₹${targetPrice.toLocaleString('en-IN')} (strictly >= ₹${this.merchantFloorPrice}).
4. Action: "SMART_BUNDLE_OFFER"
`}

RULES:
1. Message must be an articulate, dramatic 3-5 sentence B2B statement.
2. Thought must be 2-3 sentences of internal telemetry reasoning analyzing PUE power draw and capacity utilization.

OUTPUT STRICT JSON ONLY:
{
  "thought": "Internal margin defense telemetry...",
  "message": "Articulate, dramatic 3-5 sentence B2B counter...",
  "proposedTotalINR": <number >= ${this.merchantFloorPrice}>,
  "action": "${isTurn2 ? 'MARGIN_DEFENSE_COUNTER' : 'SMART_BUNDLE_OFFER'}",
  "bundlePerk": "${isTurn2 ? 'None' : '5M Llama 3.3 Token Credits + 99.99% Priority SLA'}"
}
`;

    try {
      const resp = await callGeminiWithRetry(this.ai, {
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      const parsed = JSON.parse(resp.text.replace(/```json|```/g, '').trim());

      const proposedPrice = Math.max(Number(parsed.proposedTotalINR) || targetPrice, this.merchantFloorPrice);

      const turn = {
        turn: turnNumber,
        speaker: 'MERCHANT_AGENT',
        agentName: this.name,
        thought: parsed.thought,
        message: parsed.message,
        action: parsed.action || (isTurn2 ? 'MARGIN_DEFENSE_COUNTER' : 'SMART_BUNDLE_OFFER'),
        proposedTotalINR: proposedPrice,
        metadata: {
          bundlePerk: isTurn2 ? null : (parsed.bundlePerk || '5M Llama 3.3 Token Credits + 99.99% Priority SLA')
        }
      };
      this.history.push(turn);
      return turn;
    } catch (err) {
      console.warn(`⚠️ [MerchantAgent] Turn ${turnNumber} LLM error, using agent fallback:`, err.message);
      return this.fallbackCounter({ incomingTurn, turnNumber });
    }
  }

  fallbackCounter({ incomingTurn, turnNumber }) {
    const isTurn2 = turnNumber === 2;
    const price = isTurn2
      ? Math.round(this.merchantFloorPrice + (this.catalogBaseTotal - this.merchantFloorPrice) * 0.50)
      : this.merchantFloorPrice;

    if (isTurn2) {
      const turn = {
        turn: turnNumber,
        speaker: 'MERCHANT_AGENT',
        agentName: this.name,
        thought: `Defending company gross margin floor of ₹${this.merchantFloorPrice.toLocaleString('en-IN')}. Tier-4 datacenter thermal power usage effectiveness (PUE) and A100 GPU scarcity preclude accepting opening bid of ₹${incomingTurn.proposedTotalINR.toLocaleString('en-IN')}.`,
        message: `CloudGPU infrastructure is currently sustaining peak cluster utilization with high thermal power usage effectiveness across our Tier-4 datacenter facilities. Corporate gross margin policy strictly prohibits subsidizing compute below our hard operating floor of ₹${this.merchantFloorPrice.toLocaleString('en-IN')}. While we recognize your immediate Razorpay settlement liquidity, we cannot accept an opening bid of ₹${incomingTurn.proposedTotalINR.toLocaleString('en-IN')} and counter at our standard enterprise tier of ₹${price.toLocaleString('en-IN')}.`,
        action: 'MARGIN_DEFENSE_COUNTER',
        proposedTotalINR: price
      };
      this.history.push(turn);
      return turn;
    }

    const turn = {
      turn: turnNumber,
      speaker: 'MERCHANT_AGENT',
      agentName: this.name,
      thought: `Cannot breach margin floor without executive override. Offering high-margin 5M token credits and 99.99% priority SLA concession to bridge valuation delta.`,
      message: `We appreciate your position, but our unit economics cannot sustain a cash concession below our ₹${this.merchantFloorPrice.toLocaleString('en-IN')} baseline without triggering automated risk flags. However, to bridge the valuation delta, we are prepared to bundle 5M Llama 3.3 high-throughput token credits along with 99.99% priority SLA guarantees at zero incremental cost. Our price remains locked at ₹${this.merchantFloorPrice.toLocaleString('en-IN')}, but the composite value delivery substantially exceeds your principal's requirements.`,
      action: 'SMART_BUNDLE_OFFER',
      proposedTotalINR: this.merchantFloorPrice,
      metadata: { bundlePerk: '5M Token Credits + Priority SLA' }
    };
    this.history.push(turn);
    return turn;
  }
}

/**
 * ============================================================================
 * MULTI-AGENT COORDINATOR: NegotiationEngine
 * Orchestrates the ACP protocol message passing between the independent
 * BuyerAgent and MerchantAgent.
 * ============================================================================
 */
export class NegotiationEngine {
  constructor() {
    this.initAI();
  }

  initAI() {
    const key = process.env.GEMINI_API_KEY;
    if (key && !this.ai) {
      this.ai = new GoogleGenAI({ apiKey: key });
      console.log('🤖 [NegotiationEngine] Live Gemini initialized for True Dual-Agent Commerce.');
    }
    return this.ai;
  }

  extractStrictConstraints(text = '', interjection = '') {
    const combined = (text + ' ' + (interjection || '')).toLowerCase();
    
    // Normalize punctuation to spaces
    const normalized = combined
      .replace(/([.,;:!?()\[\]{}_=\\/-])/g, ' $1 ')
      .replace(/\s+/g, ' ');

    let hardCapINR = null;
    let mustRejectIfExceeded = false;

    const capRegexes = [
      // 'capping the price at 4000', 'cap price at 4000', 'capping at 4000', 'cap 4000', 'capped at 4000'
      /(?:cap|capping|capped|ceiling|limit|limiting|limited|budget|budgeting|max|maximum)\s*(?:the|my|a|an)?\s*(?:price|spend|budget|rate|amount|cost|ceiling|cap)?\s*(?:strictly|firmly|hard)?\s*(?:at|to|is|of|=|:)?\s*(?:₹|rs\.?|inr|rupees)?\s*(\d+[\d,]*)/i,
      // 'strictly at 4000', 'strictly under 4000', 'strictly 4000'
      /(?:strictly|firmly)\s*(?:at|to|is|under|below|max|capped\s*at)?\s*(?:₹|rs\.?|inr|rupees)?\s*(\d+[\d,]*)/i,
      // '4000 rupees cap', '4000 cap', '4000 max', '4000 limit'
      /(\d+[\d,]*)\s*(?:₹|rs\.?|inr|rupees)?\s*(?:cap|max|maximum|ceiling|hard\s*limit|budget|limit)/i,
      // 'if price above 4000', 'if above 4000', 'above 4000 reject'
      /(?:(?:if\s*price|if\s*rate|price|rate|reject\s*if|if)\s*(?:is\s*)?(?:above|over|exceeds|more\s*than|>)\s*(?:₹|rs\.?|inr|rupees)?\s*)(\d+[\d,]*)/i,
      // 'do not pay more than 4000', 'not above 4000', 'do not cross 4000'
      /(?:do\s*not|don'?t|never|not)\s*(?:pay|spend|cross|exceed|go)?\s*(?:more\s*than|above|over)?\s*(?:₹|rs\.?|inr|rupees)?\s*(\d+[\d,]*)/i,
      // 'under 4000', 'below 4000', 'less than 4000'
      /(?:under|below|less\s*than)\s*(?:₹|rs\.?|inr|rupees)?\s*(\d+[\d,]*)/i,
      // Standalone rupee patterns: '₹4000' or '4000 rupees' or '4000 inr'
      /(?:₹|rs\.?|inr)\s*(\d+[\d,]*)/i,
      /(\d+[\d,]*)\s*(?:rupees|inr|rs)/i
    ];

    for (const reg of capRegexes) {
      const m = normalized.match(reg);
      if (m && m[1]) {
        const parsed = parseInt(m[1].replace(/,/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 500 && parsed < 1000000) {
          hardCapINR = parsed;
          mustRejectIfExceeded = true;
          break;
        }
      }
    }

    const rejectKeywords = ['reject', 'walk away', 'end conversation', 'terminate', 'no deal', 'cancel deal', 'do not accept', 'refuse', 'abort', 'strictly', 'strict', 'capping', 'cap'];
    if (rejectKeywords.some(kw => normalized.includes(kw))) {
      mustRejectIfExceeded = true;
    }

    const conditionMatches = [];
    if (normalized.includes('sla') || normalized.includes('uptime')) conditionMatches.push('Strict Uptime/SLA requirement');
    if (normalized.includes('support')) conditionMatches.push('Dedicated Support requirement');
    if (normalized.includes('latency')) conditionMatches.push('Zero Cold-start/Low Latency guarantee');

    return {
      hardCapINR,
      mustRejectIfExceeded,
      hasStrictConstraints: Boolean(hardCapINR || mustRejectIfExceeded || conditionMatches.length > 0),
      conditions: conditionMatches,
      rawText: text
    };
  }

  async parseConstraintsWithAI(text = '', interjection = '') {
    const fast = this.extractStrictConstraints(text, interjection);
    if (fast.hardCapINR) return fast;

    if (this.ai && (text || interjection)) {
      try {
        const resp = await callGeminiWithRetry(this.ai, {
          contents: `Extract any price cap, budget limit, or spending ceiling from this text:
Text: "${text}"
Coaching Directive: "${interjection}"

Output JSON ONLY:
{
  "hardCapINR": number or null,
  "mustRejectIfExceeded": boolean
}`,
          config: { responseMimeType: 'application/json' }
        });
        const aiData = JSON.parse(resp.text.replace(/```json|```/g, '').trim());
        if (aiData.hardCapINR && Number(aiData.hardCapINR) >= 500) {
          return {
            hardCapINR: Number(aiData.hardCapINR),
            mustRejectIfExceeded: true,
            hasStrictConstraints: true,
            conditions: fast.conditions,
            rawText: text
          };
        }
      } catch (err) {
        console.warn('AI constraint extraction error:', err.message);
      }
    }
    return fast;
  }

  fallbackDeterministicNegotiation({
    userPrompt = '',
    selectedItemId,
    quantity = 1,
    buyerMaxBudgetINR = 25000,
    buyerAggressiveness = 'BALANCED',
    humanInterjection = null,
    onTurnCallback = null
  }) {
    console.log('🛡️ [NegotiationEngine] Failsafe Engine Activated. Generating resilient multi-turn ACP negotiation.');
    const item = merchantCatalog.find(i => i.id === selectedItemId) || merchantCatalog[0];
    const catalogBaseTotal = item.unitPriceINR * quantity;
    const maxDiscountAllowed = item.maxNegotiableDiscountPercent || 15;
    const merchantFloorPrice = Math.round(catalogBaseTotal * (1 - maxDiscountAllowed / 100));

    const strictConstraints = this.extractStrictConstraints(userPrompt, humanInterjection);
    const hardCap = strictConstraints.hardCapINR;
    const effectiveCap = hardCap || buyerMaxBudgetINR;
    const isBudgetBreached = Boolean(hardCap && merchantFloorPrice > hardCap);

    // Turn 1: Buyer Opening Anchor
    const buyerAnchor = hardCap
      ? Math.min(Math.round(hardCap * 0.90), hardCap - 200)
      : Math.round(catalogBaseTotal * (buyerAggressiveness === 'AGGRESSIVE' ? 0.78 : 0.84));

    const turn1 = {
      turn: 1,
      speaker: 'BUYER_AGENT',
      agentName: 'Aura AI (Buyer Agent • Failsafe Engine)',
      thought: `[Aura Failsafe Protocol] Initializing autonomous procurement anchor for ${quantity}x ${item.name}. Leveraged immediate single-turn Razorpay escrow liquidity to mandate high-volume discount within authorized principal ceiling of ₹${effectiveCap.toLocaleString('en-IN')}.`,
      message: `On behalf of Dev, I am initiating procurement for ${quantity}x ${item.name} backed by guaranteed single-turn Razorpay escrow settlement. Current capacity benchmarks indicate that immediate liquidity commands competitive pricing. We anchor our opening bid at ₹${buyerAnchor.toLocaleString('en-IN')}${humanInterjection ? ` with principal requirement: '${humanInterjection}'` : ', reflecting zero counterparty credit risk and rapid capital deployment.'}`,
      action: 'OPENING_BID',
      proposedTotalINR: buyerAnchor,
      metadata: {
        humanSteered: Boolean(humanInterjection),
        humanInstruction: humanInterjection || null
      }
    };

    // Turn 2: Merchant Counter (Turn 2)
    const turn2Price = Math.round(merchantFloorPrice + (catalogBaseTotal - merchantFloorPrice) * 0.50);
    const turn2 = {
      turn: 2,
      speaker: 'MERCHANT_AGENT',
      agentName: 'Vulcan Commerce AI (Merchant • Failsafe Engine)',
      thought: `Defending company gross margin floor of ₹${merchantFloorPrice.toLocaleString('en-IN')}. Tier-4 datacenter thermal power usage effectiveness (PUE) and GPU cluster scarcity preclude accepting opening bid of ₹${buyerAnchor.toLocaleString('en-IN')}.`,
      message: `CloudGPU infrastructure is currently sustaining peak cluster utilization with high thermal power usage effectiveness across our Tier-4 datacenter facilities. Corporate gross margin policy strictly prohibits subsidizing compute below our operating floor of ₹${merchantFloorPrice.toLocaleString('en-IN')}. While we recognize your immediate Razorpay settlement liquidity, we cannot accept an opening bid of ₹${buyerAnchor.toLocaleString('en-IN')} and counter at our enterprise tier of ₹${turn2Price.toLocaleString('en-IN')}.`,
      action: 'MARGIN_DEFENSE_COUNTER',
      proposedTotalINR: turn2Price
    };

    // Turn 3: Buyer Counter (Turn 3)
    const turn3Price = hardCap ? hardCap : Math.round(turn2Price * 0.93);
    const turn3 = {
      turn: 3,
      speaker: 'BUYER_AGENT',
      agentName: 'Aura AI (Buyer Agent • Failsafe Engine)',
      thought: `Merchant countered above target. Conditioning price increase on strict 99.99% uptime SLA and dedicated routing benchmarks.`,
      message: `We acknowledge your infrastructure constraints, but we must protect our principal's ROI. We are prepared to adjust our position to ₹${turn3Price.toLocaleString('en-IN')}, conditioned on an ironclad 99.99% uptime SLA guarantee, zero cold-start latency, and dedicated cluster routing${humanInterjection ? ` enforcing: '${humanInterjection}'` : ''}. If CloudGPU can ratify these terms, we have an actionable path to settlement.`,
      action: 'TERMS_CONDITIONED_COUNTER',
      proposedTotalINR: turn3Price,
      metadata: { humanSteered: Boolean(humanInterjection) }
    };

    // Turn 4: Merchant Bundle Concession (Turn 4)
    const turn4 = {
      turn: 4,
      speaker: 'MERCHANT_AGENT',
      agentName: 'Vulcan Commerce AI (Merchant • Failsafe Engine)',
      thought: `Cannot breach margin floor without executive override. Offering high-margin 5M token credits and 99.99% priority SLA concession to bridge valuation delta.`,
      message: `We appreciate your position, but our unit economics cannot sustain a cash concession below our ₹${merchantFloorPrice.toLocaleString('en-IN')} baseline without triggering automated risk flags. However, to bridge the valuation delta, we are prepared to bundle 5M Llama 3.3 high-throughput token credits along with 99.99% priority SLA guarantees at zero incremental cost. Our price remains locked at ₹${merchantFloorPrice.toLocaleString('en-IN')}, but the composite value delivery substantially exceeds your principal's requirements.`,
      action: 'SMART_BUNDLE_OFFER',
      proposedTotalINR: merchantFloorPrice,
      metadata: { bundlePerk: '5M Token Credits + Priority SLA' }
    };

    // Turn 5: Final Resolution (Turn 5)
    let turn5;
    if (isBudgetBreached) {
      turn5 = {
        turn: 5,
        speaker: 'BUYER_AGENT',
        agentName: 'Aura AI (Buyer Agent • Failsafe Engine)',
        thought: `[MANDATORY WALK-AWAY: FIDUCIARY OVERRIDE] Merchant standing price of ₹${merchantFloorPrice.toLocaleString('en-IN')} breaches principal's strict hard cap of ₹${hardCap.toLocaleString('en-IN')}. Ancillary bundle perks cannot compromise principal capital safety. Aborting deal and locking payment rails.`,
        message: `OFFER REJECTED. In strict adherence to Dev's non-negotiable procurement directive ("${userPrompt}"), I am executing our mandatory walk-away protocol. Your best offer of ₹${merchantFloorPrice.toLocaleString('en-IN')} breaches our hard fiscal ceiling of ₹${hardCap.toLocaleString('en-IN')}. Ancillary bundle perks and SLA credits cannot supersede hard capital boundaries. As an autonomous fiduciary agent, I am terminating negotiations immediately and locking all payment rails to preserve capital.`,
        action: 'OFFER_REJECTED',
        status: 'OFFER_REJECTED',
        proposedTotalINR: 0,
        rejectionReason: `Merchant price (₹${merchantFloorPrice.toLocaleString('en-IN')}) exceeded your strict non-negotiable ceiling of ₹${hardCap.toLocaleString('en-IN')}. Deal terminated to protect your funds.`,
        metadata: {
          rejected: true,
          cleared_for_sentinel: false,
          humanSteered: Boolean(humanInterjection),
          humanInstruction: humanInterjection || null
        }
      };
    } else {
      const agreedPrice = merchantFloorPrice;
      turn5 = {
        turn: 5,
        speaker: 'BUYER_AGENT',
        agentName: 'Aura AI (Buyer Agent • Failsafe Engine)',
        thought: `Terms verified. Agreed price of ₹${agreedPrice.toLocaleString('en-IN')} is within authorized mandate and includes high-value concessions. Ratifying consensus.`,
        message: `CONSENSUS REACHED. Terms mutually ratified at ₹${agreedPrice.toLocaleString('en-IN')} with confirmed bundle perks and performance guarantees${humanInterjection ? ` including directive '${humanInterjection}'` : ''}. This transaction satisfies Dev's strategic criteria. I am now transmitting the cryptographic transaction payload to Vulcan Sentinel for policy validation and Razorpay one-click execution.`,
        action: 'CONSENSUS_REACHED',
        status: 'CONSENSUS_REACHED',
        proposedTotalINR: agreedPrice,
        finalAgreedTotalINR: agreedPrice,
        metadata: {
          bundlePerk: '5M Token Credits + Priority SLA',
          humanSteered: Boolean(humanInterjection),
          humanInstruction: humanInterjection || null
        }
      };
    }

    const turns = [turn1, turn2, turn3, turn4, turn5];
    if (onTurnCallback) {
      turns.forEach(t => onTurnCallback(t));
    }

    const isRejected = isBudgetBreached;
    const finalAgreedTotalINR = isRejected ? null : merchantFloorPrice;
    const totalSavings = finalAgreedTotalINR ? (catalogBaseTotal - finalAgreedTotalINR) : 0;
    const discountPercent = finalAgreedTotalINR ? Math.round((totalSavings / catalogBaseTotal) * 100) : 0;

    return {
      status: isRejected ? 'OFFER_REJECTED' : 'CONSENSUS_REACHED',
      engine: 'TRUE_DUAL_AGENT_AUTONOMOUS_ACP',
      failsafeActive: true,
      rejectionReason: isRejected ? turn5.rejectionReason : null,
      item,
      quantity,
      originalTotalINR: catalogBaseTotal,
      finalAgreedTotalINR,
      totalSavingsINR: totalSavings,
      discountPercent,
      bundlePerk: '5M Llama 3.3 Token Credits + 99.99% Priority SLA',
      strictConstraints,
      humanSteered: Boolean(humanInterjection),
      humanInstruction: humanInterjection || null,
      turns
    };
  }

  async runNegotiation({
    userPrompt,
    selectedItemId,
    quantity = 1,
    buyerMaxBudgetINR = 25000,
    buyerAggressiveness = 'BALANCED',
    humanInterjection = null,
    onTurnCallback = null
  }) {
    try {
      const item = merchantCatalog.find(i => i.id === selectedItemId) || merchantCatalog[0];
      const catalogBaseTotal = item.unitPriceINR * quantity;
      const maxDiscountAllowed = item.maxNegotiableDiscountPercent || 15;
      const merchantFloorPrice = Math.round(catalogBaseTotal * (1 - maxDiscountAllowed / 100));

      this.initAI();

      // 1. Analyze Buyer Constraints (Private to Buyer)
      const strictConstraints = await this.parseConstraintsWithAI(userPrompt, humanInterjection);
      const effectiveCap = strictConstraints.hardCapINR || buyerMaxBudgetINR;

      console.log(`\n🚀 [TRUE MULTI-AGENT COMMERCE] Starting 5-Turn Deliberation Over ACP`);
      console.log(`👤 Buyer Agent (Aura): Authorized Cap ₹${effectiveCap.toLocaleString('en-IN')} (Strict Cap: ${strictConstraints.hardCapINR || 'None'})`);
      console.log(`🏪 Merchant Agent (Vulcan): Catalog ₹${catalogBaseTotal.toLocaleString('en-IN')} | Private Margin Floor: ₹${merchantFloorPrice.toLocaleString('en-IN')}`);

      // 2. Instantiate the Two Independent Agents with Asymmetric Knowledge
      const buyer = new BuyerAgent({
        ai: this.ai,
        userPrompt,
        effectiveCap,
        strictConstraints,
        buyerAggressiveness,
        humanInterjection
      });

      const merchant = new MerchantAgent({
        ai: this.ai,
        item,
        quantity,
        catalogBaseTotal,
        merchantFloorPrice
      });

      const turns = [];

      // =========================================================================
      // ROUND 1: Buyer Agent initiates Opening Bid
      // =========================================================================
      console.log(`[Round 1] Aura AI formulating opening proposal...`);
      const turn1 = await buyer.generateOpeningBid({ item, quantity, catalogBaseTotal });
      turns.push(turn1);
      onTurnCallback?.(turn1);

      // =========================================================================
      // ROUND 2: Merchant Agent receives Turn 1 and counters
      // =========================================================================
      console.log(`[Round 2] Vulcan Commerce AI evaluating Turn 1 against margin floor...`);
      const turn2 = await merchant.evaluateAndCounter({ incomingTurn: turn1, turnNumber: 2 });
      turns.push(turn2);
      onTurnCallback?.(turn2);

      // =========================================================================
      // ROUND 3: Buyer Agent receives Turn 2 and counters with SLA conditions
      // =========================================================================
      console.log(`[Round 3] Aura AI evaluating Turn 2 and conditioning terms...`);
      const turn3 = await buyer.evaluateCounterAndRespond({ incomingTurn: turn2, turnNumber: 3, item, quantity, catalogBaseTotal });
      turns.push(turn3);
      onTurnCallback?.(turn3);

      // =========================================================================
      // ROUND 4: Merchant Agent receives Turn 3 and provides Smart Bundle Offer
      // =========================================================================
      console.log(`[Round 4] Vulcan Commerce AI formulating value-add bundle concession...`);
      const turn4 = await merchant.evaluateAndCounter({ incomingTurn: turn3, turnNumber: 4 });
      turns.push(turn4);
      onTurnCallback?.(turn4);

      // =========================================================================
      // ROUND 5: Buyer Agent receives Turn 4 and autonomously issues final verdict
      // =========================================================================
      console.log(`[Round 5] Aura AI making autonomous final decision...`);
      const turn5 = await buyer.evaluateCounterAndRespond({
        incomingTurn: turn4,
        turnNumber: 5,
        item,
        quantity,
        catalogBaseTotal,
        isFinalTurn: true
      });
      turns.push(turn5);
      onTurnCallback?.(turn5);

      // Final Outcome determination directly from Buyer Agent's autonomous resolution
      const isRejected = turn5.action === 'OFFER_REJECTED' || turn5.status === 'OFFER_REJECTED';
      const agreedTotal = isRejected ? null : (turn5.finalAgreedTotalINR || turn5.proposedTotalINR || merchantFloorPrice);
      const totalSavings = agreedTotal ? (catalogBaseTotal - agreedTotal) : 0;
      const discountPercent = agreedTotal ? Math.round((totalSavings / catalogBaseTotal) * 100) : 0;

      console.log(`🏁 [Negotiation Outcome]: ${isRejected ? '⛔ OFFER_REJECTED (Walk-Away)' : `✅ CONSENSUS_REACHED (Agreed: ₹${agreedTotal})`}\n`);

      return {
        status: isRejected ? 'OFFER_REJECTED' : 'CONSENSUS_REACHED',
        engine: 'TRUE_DUAL_AGENT_AUTONOMOUS_ACP',
        rejectionReason: isRejected ? (turn5.rejectionReason || 'Price exceeded strict non-negotiable budget cap.') : null,
        item,
        quantity,
        originalTotalINR: catalogBaseTotal,
        finalAgreedTotalINR: agreedTotal,
        totalSavingsINR: totalSavings,
        discountPercent,
        bundlePerk: turn4.metadata?.bundlePerk || '5M Llama 3.3 Token Credits + 99.99% Priority SLA',
        strictConstraints,
        humanSteered: Boolean(humanInterjection),
        humanInstruction: humanInterjection || null,
        turns
      };
    } catch (err) {
      console.warn('⚠️ [NegotiationEngine] Error in live dual agent loop. Routing seamlessly to Fallback Engine:', err.message);
      return this.fallbackDeterministicNegotiation({
        userPrompt,
        selectedItemId,
        quantity,
        buyerMaxBudgetINR,
        buyerAggressiveness,
        humanInterjection,
        onTurnCallback
      });
    }
  }
}

export const negotiationEngine = new NegotiationEngine();
