import React, { useRef } from 'react';
import { X, Download, Printer, CheckCircle } from 'lucide-react';

interface FeeReceiptProps {
  booking: {
    _id: string;
    company: string;
    contactName: string;
    contactEmail: string;
    purpose: string;
    location?: string;
    product?: string;
    date: string;
    time: string;
    technicianFee: {
      amount: number;
      status: string;
      paidAt?: string;
      breakdown?: {
        purposeFee: number;
        locationFee: number;
        productFee: number;
      };
    };
    createdAt: string;
  };
  onClose: () => void;
  darkMode?: boolean;
}

export function FeeReceiptModal({ booking, onClose, darkMode = false }: FeeReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const fee = booking.technicianFee;
  const receiptNo = `ACR-${booking._id.slice(-8).toUpperCase()}`;
  const paidDate = fee.paidAt ? new Date(fee.paidAt) : new Date();
  const bookingDate = new Date(booking.date);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receiptNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 40px; background: white; color: #1a1a1a; }
          .receipt { max-width: 480px; margin: 0 auto; }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
          .logo { font-size: 28px; font-weight: 800; color: #1e40af; letter-spacing: -0.5px; }
          .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .badge { display: inline-block; margin-top: 12px; padding: 4px 16px; background: #dcfce7; color: #166534; font-size: 13px; font-weight: 600; border-radius: 99px; }
          .receipt-no { text-align: center; padding: 16px 0; font-size: 13px; color: #6b7280; }
          .receipt-no strong { color: #1a1a1a; }
          .section { padding: 16px 0; border-bottom: 1px solid #f3f4f6; }
          .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; margin-bottom: 10px; }
          .row { display: flex; justify-content: space-between; align-items: baseline; padding: 3px 0; }
          .label { font-size: 13px; color: #6b7280; }
          .value { font-size: 13px; color: #1a1a1a; font-weight: 500; text-align: right; }
          .total-section { padding: 20px 0; }
          .total-row { display: flex; justify-content: space-between; align-items: baseline; }
          .total-label { font-size: 16px; font-weight: 600; color: #1a1a1a; }
          .total-value { font-size: 24px; font-weight: 800; color: #1e40af; }
          .payment-method { text-align: center; padding: 16px; margin-top: 8px; background: #f0f9ff; border-radius: 8px; }
          .payment-method-text { font-size: 13px; color: #1e40af; font-weight: 500; }
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
    setTimeout(() => { printWindow.print(); }, 300);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action bar */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Payment Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'}`}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Receipt content */}
        <div className="p-6" ref={receiptRef}>
          <div className="receipt">
            {/* Header */}
            <div className="header" style={{ textAlign: 'center', paddingBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
              <div className="logo" style={{ fontSize: '28px', fontWeight: 800, color: '#1e40af' }}>ACCURO</div>
              <div className="subtitle" style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Beamex Calibration & Instrumentation Services</div>
              <div style={{ marginTop: '12px' }}>
                <span className="badge" style={{ display: 'inline-block', padding: '4px 16px', background: '#dcfce7', color: '#166534', fontSize: '13px', fontWeight: 600, borderRadius: '99px' }}>
                  PAID
                </span>
              </div>
            </div>

            {/* Receipt number */}
            <div className="receipt-no" style={{ textAlign: 'center', padding: '16px 0', fontSize: '13px', color: '#6b7280' }}>
              Receipt No: <strong style={{ color: '#1a1a1a' }}>{receiptNo}</strong>
              <br />
              Date: {paidDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Customer info */}
            <div className="section" style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div className="section-title" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '10px' }}>Customer Information</div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Name</span>
                <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>{booking.contactName}</span>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Email</span>
                <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>{booking.contactEmail}</span>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Company</span>
                <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>{booking.company}</span>
              </div>
            </div>

            {/* Booking details */}
            <div className="section" style={{ padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div className="section-title" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '10px' }}>Service Details</div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Service</span>
                <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>{booking.purpose}</span>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Date</span>
                <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>
                  {bookingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Time</span>
                <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>{booking.time}</span>
              </div>
            </div>

            {/* Total with matrix breakdown */}
            <div className="total-section" style={{ padding: '20px 0' }}>
              <div className="section-title" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: '10px' }}>Fee Breakdown</div>
              {fee.breakdown ? (
                <>
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Purpose ({booking.purpose})</span>
                    <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>PHP {Number(fee.breakdown.purposeFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Location ({booking.location || '—'})</span>
                    <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>PHP {Number(fee.breakdown.locationFee || 0).toFixed(2)}</span>
                  </div>
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Product ({booking.product || '—'})</span>
                    <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>PHP {Number(fee.breakdown.productFee || 0).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span className="label" style={{ fontSize: '13px', color: '#6b7280' }}>Technician Consultation Fee</span>
                  <span className="value" style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>PHP {fee.amount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#1a1a1a' }}>Total Paid</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#1e40af' }}>PHP {fee.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div style={{ textAlign: 'center', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 500 }}>Paid via GCash / QRPH</span>
            </div>

            {/* Footer */}
            <div className="footer" style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px dashed #d1d5db', marginTop: '16px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 1.6 }}>
                This is a system-generated receipt from Accuro.<br />
                For inquiries, contact support@accuro.com<br />
                Thank you for choosing Accuro!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
