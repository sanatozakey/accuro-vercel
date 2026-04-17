import React, { useRef } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';

export interface QuotationReceiptItem {
  productName: string;
  quantity: number;
  specifications?: string;
}

interface QuotationReceiptProps {
  quotation: {
    quotationNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    company: string;
    items: QuotationReceiptItem[];
    additionalRequirements?: string;
    submittedAt: string;
  };
  onClose: () => void;
  darkMode?: boolean;
}

export function QuotationReceiptModal({ quotation, onClose, darkMode = false }: QuotationReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const submittedDate = new Date(quotation.submittedAt);
  const totalItems = quotation.items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation Receipt ${quotation.quotationNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; background: white; color: #1a1a1a; }
          .receipt { max-width: 560px; margin: 0 auto; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
          .logo { font-size: 28px; font-weight: 800; color: #1e40af; letter-spacing: -0.5px; }
          .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .badge { display: inline-block; margin-top: 12px; padding: 4px 16px; background: #dbeafe; color: #1e40af; font-size: 13px; font-weight: 600; border-radius: 99px; }
          .receipt-no { text-align: center; padding: 16px 0; font-size: 13px; color: #6b7280; }
          .receipt-no strong { color: #1a1a1a; }
          .section { padding: 16px 0; border-bottom: 1px solid #f3f4f6; }
          .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; align-items: baseline; padding: 3px 0; }
          .label { font-size: 13px; color: #6b7280; }
          .value { font-size: 13px; color: #1a1a1a; font-weight: 500; text-align: right; }
          .item { padding: 10px 0; border-bottom: 1px dashed #e5e7eb; }
          .item:last-child { border-bottom: none; }
          .item-name { font-size: 13px; font-weight: 600; color: #1a1a1a; }
          .item-qty { font-size: 12px; color: #6b7280; margin-top: 2px; }
          .item-specs { font-size: 11px; color: #6b7280; font-style: italic; margin-top: 4px; }
          .notes { font-size: 12px; color: #4b5563; background: #f9fafb; padding: 10px 12px; border-radius: 6px; margin-top: 8px; white-space: pre-wrap; }
          .footer { text-align: center; padding-top: 24px; border-top: 1px dashed #d1d5db; margin-top: 16px; }
          .footer p { font-size: 11px; color: #9ca3af; line-height: 1.6; }
          @media print { body { padding: 20px; } button { display: none !important; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const content = receiptRef.current;
    if (!content) return;
    const blob = new Blob(
      [
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Quotation ${quotation.quotationNumber}</title><style>
         body{font-family:system-ui,-apple-system,sans-serif;padding:40px;color:#1a1a1a;max-width:640px;margin:0 auto}
         .logo{font-size:28px;font-weight:800;color:#1e40af;text-align:center}
         .subtitle{font-size:12px;color:#6b7280;text-align:center;margin-top:4px;margin-bottom:16px}
         .badge{display:inline-block;padding:4px 16px;background:#dbeafe;color:#1e40af;font-size:13px;font-weight:600;border-radius:99px}
         .section{padding:16px 0;border-top:1px solid #e5e7eb}
         .section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:10px}
         .row{display:flex;justify-content:space-between;padding:3px 0;font-size:13px}
         .label{color:#6b7280}.value{color:#1a1a1a;font-weight:500}
         .item{padding:10px 0;border-bottom:1px dashed #e5e7eb}
         .item-name{font-weight:600}.item-qty{font-size:12px;color:#6b7280}
         .item-specs{font-size:11px;color:#6b7280;font-style:italic;margin-top:4px}
         .notes{font-size:12px;background:#f9fafb;padding:10px 12px;border-radius:6px;white-space:pre-wrap}
         </style></head><body>${content.innerHTML}</body></html>`,
      ],
      { type: 'text/html' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotation-${quotation.quotationNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="font-bold">Quotation Receipt</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div ref={receiptRef} className="receipt p-6">
            <div className="header">
              <div className="logo">accuro</div>
              <div className="subtitle">Beamex Instrumentation &amp; Calibration</div>
              <div style={{ marginTop: 12 }}>
                <span className="badge">Quotation Request</span>
              </div>
            </div>

            <div className="receipt-no">
              Reference: <strong>{quotation.quotationNumber}</strong>
              <br />
              {submittedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {' '}at{' '}
              {submittedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>

            <div className="section">
              <div className="section-title">Requested By</div>
              <div className="row"><span className="label">Name</span><span className="value">{quotation.customerName}</span></div>
              <div className="row"><span className="label">Email</span><span className="value">{quotation.customerEmail}</span></div>
              {quotation.customerPhone && (
                <div className="row"><span className="label">Phone</span><span className="value">{quotation.customerPhone}</span></div>
              )}
              <div className="row"><span className="label">Company</span><span className="value">{quotation.company}</span></div>
            </div>

            <div className="section">
              <div className="section-title">Items ({totalItems})</div>
              {quotation.items.map((item, idx) => (
                <div key={idx} className="item">
                  <div className="item-name">{item.productName}</div>
                  <div className="item-qty">Quantity: {item.quantity}</div>
                  {item.specifications && (
                    <div className="item-specs">Specs: {item.specifications}</div>
                  )}
                </div>
              ))}
            </div>

            {quotation.additionalRequirements && (
              <div className="section">
                <div className="section-title">Additional Requirements</div>
                <div className="notes">{quotation.additionalRequirements}</div>
              </div>
            )}

            <div className="footer">
              <p>
                Thank you for choosing Accuro. Our team will review your request and follow up
                with a detailed quotation.
              </p>
              <p style={{ marginTop: 6 }}>This receipt confirms your submission only.</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex gap-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuotationReceiptModal;
