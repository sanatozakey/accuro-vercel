import React, { useState, useEffect } from 'react';
import { X, Check, XCircle, FileText, Package, Loader, Edit3, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import transactionProofService, { TransactionProof, TransactionItem } from '../services/transactionProofService';

interface TransactionReviewModalProps {
  bookingId: string;
  bookingDetails: {
    company: string;
    contactName: string;
    purpose: string;
    date: string;
    time: string;
  };
  onClose: () => void;
  onActionComplete: () => void;
  darkMode?: boolean;
}

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function TransactionReviewModal({
  bookingId,
  bookingDetails,
  onClose,
  onActionComplete,
  darkMode = false,
}: TransactionReviewModalProps) {
  const [proof, setProof] = useState<TransactionProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [editingItems, setEditingItems] = useState(false);
  const [editedItems, setEditedItems] = useState<TransactionItem[]>([]);

  useEffect(() => {
    fetchProof();
  }, [bookingId]);

  const fetchProof = async () => {
    try {
      setLoading(true);
      const res = await transactionProofService.getByBookingId(bookingId);
      setProof(res.data);
      setEditedItems(res.data.items || []);
    } catch (error) {
      toast.error('Failed to load transaction proof');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!proof) return;
    try {
      setActionLoading(true);
      // Save adjusted items first if edited
      if (editingItems) {
        await transactionProofService.adjustItems(proof._id, editedItems);
      }
      const res = await transactionProofService.approve(proof._id, feedback);
      toast.success('Transaction approved and inventory updated!');
      if (res.lowStockWarnings && res.lowStockWarnings.length > 0) {
        res.lowStockWarnings.forEach((warning: string) => {
          toast(`Low stock: ${warning}`, { icon: '⚠️', duration: 5000 });
        });
      }
      onActionComplete();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!proof) return;
    if (!feedback.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }
    try {
      setActionLoading(true);
      await transactionProofService.reject(proof._id, feedback);
      toast.success('Transaction proof rejected');
      onActionComplete();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updated = [...editedItems];
    updated[index] = {
      ...updated[index],
      quantity: Math.max(1, quantity),
      totalPrice: (updated[index].unitPrice || 0) * Math.max(1, quantity),
    };
    setEditedItems(updated);
  };

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${bgClass} rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
          <div>
            <h2 className={`text-xl font-bold ${textClass}`}>Review Payment Proof</h2>
            <p className={`text-sm ${mutedClass}`}>
              {bookingDetails.company} - {bookingDetails.purpose}
            </p>
          </div>
          <button onClick={onClose} className={`${mutedClass} hover:${textClass}`}>
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : proof ? (
          <div className="p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${mutedClass}`}>Status:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                proof.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                proof.status === 'approved' ? 'bg-green-100 text-green-800' :
                proof.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {proof.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-semibold ${textClass} flex items-center gap-2`}>
                  <Package className="h-4 w-4" />
                  Transaction Items
                </h3>
                {proof.status === 'pending_review' && (
                  <button
                    onClick={() => setEditingItems(!editingItems)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    {editingItems ? 'Done Editing' : 'Adjust Quantities'}
                  </button>
                )}
              </div>
              <div className={`border ${borderClass} rounded-lg overflow-hidden`}>
                {(editingItems ? editedItems : proof.items).map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 ${idx > 0 ? `border-t ${borderClass}` : ''}`}>
                    <div>
                      <span className={`font-medium ${textClass}`}>{item.productName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {editingItems ? (
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(idx, parseInt(e.target.value) || 1)}
                          className={`w-20 px-2 py-1 text-sm border ${borderClass} rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                        />
                      ) : (
                        <span className={mutedClass}>x{item.quantity}</span>
                      )}
                      {item.totalPrice ? (
                        <span className={`${textClass} font-medium min-w-[80px] text-right`}>
                          {proof.currency} {(editingItems ? (item.unitPrice || 0) * item.quantity : item.totalPrice).toLocaleString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
                <div className={`flex justify-between p-3 border-t ${borderClass} font-bold ${textClass}`}>
                  <span>Total</span>
                  <span>
                    {proof.currency} {(editingItems
                      ? editedItems.reduce((s, i) => s + (i.unitPrice || 0) * i.quantity, 0)
                      : proof.totalAmount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <h3 className={`font-semibold ${textClass} flex items-center gap-2 mb-2`}>
                <FileText className="h-4 w-4" />
                Uploaded Proofs ({proof.attachments.length})
              </h3>
              <div className="space-y-2">
                {proof.attachments.map((att, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 border ${borderClass} rounded-lg`}>
                    <div className="flex items-center gap-2">
                      <FileText className={`h-4 w-4 ${mutedClass}`} />
                      <span className={`text-sm ${textClass}`}>{att.originalName}</span>
                      <span className={`text-xs ${mutedClass}`}>({(att.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <a
                      href={`${API_URL}/uploads/proofs/${att.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Notes */}
            {proof.customerNotes && (
              <div>
                <h3 className={`font-semibold ${textClass} mb-1`}>Customer Notes</h3>
                <p className={`text-sm ${mutedClass}`}>{proof.customerNotes}</p>
              </div>
            )}

            {/* Review Actions */}
            {proof.status === 'pending_review' && (
              <div className="space-y-3">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Feedback (required for rejection, optional for approval)..."
                  rows={3}
                  className={`w-full px-3 py-2 text-sm border ${borderClass} rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {actionLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve & Deduct Inventory
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !feedback.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {actionLoading ? <Loader className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className={mutedClass}>No transaction proof found for this booking.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionReviewModal;
