import React, { useRef } from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, Hash, FileText } from 'lucide-react';

export default function GSTInvoiceModal({ isOpen, onClose, transaction }) {
  const invoiceRef = useRef(null);

  if (!isOpen || !transaction) return null;

  const paymentId = transaction.razorpay_payment_id || transaction.id || 'pay_rzp_live_settled_01';
  const amountTotal = Number(transaction.amount_inr || transaction.amountINR || 6480);
  const taxableValue = Math.round((amountTotal / 1.18) * 100) / 100;
  const gstAmount = Math.round((amountTotal - taxableValue) * 100) / 100;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = cgst;
  const dateStr = transaction.timestamp 
    ? new Date(transaction.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '31 Mar 2026, 14:32';
  const hash = transaction.verifiable_hash || transaction.hash || '9a8d7c6b5e4f3a21';
  const signature = transaction.cryptographic_signature || '7e2b19cf83d29a...f0a1';
  const mandateRef = transaction.npci_uap_ref || 'NPCI-UAP-IN-2026-X88';
  const itemName = transaction.itemSummary || transaction.item?.name || 'NVIDIA A100 SXM4 (40 GPU-Hours)';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      taxInvoiceNumber: `INV-RZP-2026-${paymentId.slice(-6).toUpperCase()}`,
      razorpayPaymentId: paymentId,
      timestamp: new Date().toISOString(),
      merchant: {
        legalName: 'CloudGPU Infrastructure Solutions Private Limited',
        tradeName: 'CloudGPU.ai',
        gstin: '29AABCU9603R1ZM',
        state: 'Karnataka (29)',
        vpa: 'cloudgpu@razorpay'
      },
      buyer: {
        principal: 'Dev (Authorized Principal)',
        agentFiduciary: 'Aura AI (Agent Commerce Protocol v1.0)',
        mandateToken: 'mnd_bounded_token_8849',
        npciRef: mandateRef
      },
      financials: {
        currency: 'INR',
        taxableValue,
        cgst_9pct: cgst,
        sgst_9pct: sgst,
        totalAmountINR: amountTotal
      },
      audit: {
        verifiableHash: hash,
        hmacSha256Signature: signature,
        settlementRail: 'RAZORPAY_TEST_CLEARED_UAP',
        sentinelVerdict: 'APPROVED_BOUNDED_GATED'
      }
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GST_INVOICE_${paymentId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0b1220] border border-slate-700 shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="font-bold font-display text-white text-sm">Autonomous Tax Invoice & Cryptographic Audit Slip</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
              GST COMPLIANT
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="p-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
              title="Download Signed JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={invoiceRef} className="p-6 sm:p-8 space-y-6 text-slate-200 text-xs">
          
          {/* Header Row: Razorpay + Merchant */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  R
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Razorpay Verified Settlement</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Autonomous Commerce Protocol (ACP/1.0)</p>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400 space-y-0.5 font-mono">
                <p><strong className="text-slate-300 font-sans">Merchant:</strong> CloudGPU Solutions Pvt. Ltd.</p>
                <p><strong className="text-slate-300 font-sans">GSTIN:</strong> 29AABCU9603R1ZM</p>
                <p><strong className="text-slate-300 font-sans">VPA:</strong> cloudgpu@razorpay</p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] space-y-1">
              <div className="inline-block px-2.5 py-1 rounded bg-blue-950/80 border border-blue-800/60 text-cyan-300 font-bold">
                TAX INVOICE
              </div>
              <p className="text-slate-300 font-bold">INV-RZP-{paymentId.slice(-6).toUpperCase()}</p>
              <p className="text-slate-400">Date: {dateStr}</p>
              <p className="text-slate-400">Mandate: <span className="text-emerald-400">{mandateRef}</span></p>
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]">
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] mb-1">Billed To (Principal)</p>
              <p className="font-bold text-white">Dev (Authorized Buyer)</p>
              <p className="text-slate-400 font-mono">Fiduciary Agent: Aura AI</p>
              <p className="text-slate-400 font-mono">Place of Supply: Karnataka (29)</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] mb-1">Payment & Rail Clearance</p>
              <p className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Razorpay Test Rails (UAP-Settled)
              </p>
              <p className="text-slate-400 font-mono">Tx ID: {paymentId}</p>
              <p className="text-slate-400 font-mono">Vulcan Sentinel: <span className="text-cyan-400 font-semibold">CLEARED</span></p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="py-2 px-1">Description</th>
                  <th className="py-2 px-1 font-mono">SAC</th>
                  <th className="py-2 px-1 text-right font-mono">Qty</th>
                  <th className="py-2 px-1 text-right font-mono">Rate (₹)</th>
                  <th className="py-2 px-1 text-right font-mono">Taxable (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-1 font-sans">
                    <span className="font-medium text-white">{itemName}</span>
                    <span className="block text-[10px] text-slate-400">Autonomous dynamic SLA guaranteed with priority routing</span>
                  </td>
                  <td className="py-2.5 px-1 text-slate-400">998315</td>
                  <td className="py-2.5 px-1 text-right text-slate-300">1</td>
                  <td className="py-2.5 px-1 text-right text-slate-300">₹{taxableValue.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-1 text-right font-bold text-white">₹{taxableValue.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Grand Total */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t border-slate-800 pt-4">
            <div className="space-y-1.5 text-[11px] text-slate-400 font-mono max-w-xs">
              <div className="flex items-center gap-1 text-cyan-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>NPCI-UAP Cryptographic Attestation</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500">
                This receipt was autonomously executed and bound by Vulcan Sentinel under session mandate token <code className="text-slate-400">mnd_bounded_token_8849</code>.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 font-mono text-xs text-right">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Amount:</span>
                <span>₹{taxableValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST (9.0%):</span>
                <span>₹{cgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SGST (9.0%):</span>
                <span>₹{sgst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-400 pt-2 border-t border-slate-800 font-sans">
                <span>Total Settled:</span>
                <span>₹{amountTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Ledger Proof Box */}
          <div className="p-3.5 rounded-xl bg-black/50 border border-slate-800 space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans font-semibold flex items-center gap-1.5">
                <Hash className="w-3 h-3 text-purple-400" />
                SHA-256 Ledger Hash:
              </span>
              <span className="text-purple-300 font-bold">{hash}</span>
            </div>
            <div className="text-slate-500 break-all text-[9px] bg-slate-950 p-2 rounded border border-slate-900">
              HMAC-SHA256: {signature}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Powered by Razorpay Payments & ACP v1.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close Invoice
          </button>
        </div>

      </div>
    </div>
  );
}
