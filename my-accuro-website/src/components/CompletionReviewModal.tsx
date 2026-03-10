import React, { useState } from 'react';
import { X, Check, XCircle, FileText, Image as ImageIcon, Download, Clock, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import completionProofService, { CompletionProof } from '../services/completionProofService';
import toast from 'react-hot-toast';

interface CompletionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecision: () => void;
  booking: {
    _id: string;
    company: string;
    contactName: string;
    contactEmail: string;
    date: string;
    time: string;
    purpose: string;
    product: string;
    location: string;
  };
  proof: CompletionProof;
  darkMode?: boolean;
}

export function CompletionReviewModal({
  isOpen,
  onClose,
  onDecision,
  booking,
  proof,
  darkMode = false,
}: CompletionReviewModalProps): React.ReactElement | null {
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [approveFeedback, setApproveFeedback] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen) return null;

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const cardBgClass = darkMode ? 'bg-gray-700' : 'bg-gray-50';
  const inputBgClass = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

  const apiUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const handleApprove = async () => {
    setLoading(true);
    try {
      await completionProofService.approve(proof._id, approveFeedback || undefined);
      toast.success('Completion report approved. Booking marked as completed.');
      onDecision();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve report');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback for the rejection');
      return;
    }

    setLoading(true);
    try {
      await completionProofService.reject(proof._id, feedback.trim());
      toast.success('Completion report rejected. Technician has been notified.');
      onDecision();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject report');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className={`relative w-full max-w-3xl rounded-lg shadow-xl ${bgClass}`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${borderClass}`}>
            <div>
              <h2 className={`text-lg font-semibold ${textClass}`}>Review Completion Report</h2>
              <p className={`text-sm ${mutedClass}`}>
                {booking.company} - {new Date(booking.date).toLocaleDateString()} at {booking.time}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            {/* Submission Info */}
            <div className={`flex items-center gap-4 p-3 rounded-lg ${cardBgClass}`}>
              <User className={`h-5 w-5 ${mutedClass}`} />
              <div>
                <p className={`text-sm font-medium ${textClass}`}>
                  Submitted by {proof.completedByName}
                </p>
                <p className={`text-xs ${mutedClass}`}>
                  {formatDate(proof.completedAt)}
                  {proof.revisionHistory && proof.revisionHistory.length > 0 && (
                    <span className="ml-2 text-orange-500">
                      (Revision #{proof.revisionHistory.length})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Booking Details */}
            <div className={`p-4 rounded-lg ${cardBgClass}`}>
              <h3 className={`text-sm font-semibold mb-3 ${textClass}`}>Booking Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className={mutedClass}>Company:</span>
                  <p className={textClass}>{booking.company}</p>
                </div>
                <div>
                  <span className={mutedClass}>Contact:</span>
                  <p className={textClass}>{booking.contactName}</p>
                </div>
                <div>
                  <span className={mutedClass}>Purpose:</span>
                  <p className={textClass}>{booking.purpose}</p>
                </div>
                <div>
                  <span className={mutedClass}>Product:</span>
                  <p className={textClass}>{booking.product}</p>
                </div>
                <div>
                  <span className={mutedClass}>Location:</span>
                  <p className={textClass}>{booking.location}</p>
                </div>
                <div>
                  <span className={mutedClass}>Schedule:</span>
                  <p className={textClass}>{new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
                </div>
              </div>
            </div>

            {/* Service Report */}
            <div className={`p-4 rounded-lg ${cardBgClass}`}>
              <h3 className={`text-sm font-semibold mb-3 ${textClass}`}>Service Report</h3>
              <div className="space-y-3">
                <div>
                  <span className={`text-xs font-medium ${mutedClass}`}>Work Performed</span>
                  <p className={`text-sm mt-1 ${textClass} whitespace-pre-wrap`}>
                    {proof.serviceReport.workPerformed}
                  </p>
                </div>
                {proof.serviceReport.equipmentUsed && (
                  <div>
                    <span className={`text-xs font-medium ${mutedClass}`}>Equipment Used</span>
                    <p className={`text-sm mt-1 ${textClass} whitespace-pre-wrap`}>
                      {proof.serviceReport.equipmentUsed}
                    </p>
                  </div>
                )}
                {proof.serviceReport.issuesFound && (
                  <div>
                    <span className={`text-xs font-medium ${mutedClass}`}>Issues Found</span>
                    <p className={`text-sm mt-1 ${textClass} whitespace-pre-wrap`}>
                      {proof.serviceReport.issuesFound}
                    </p>
                  </div>
                )}
                {proof.serviceReport.recommendations && (
                  <div>
                    <span className={`text-xs font-medium ${mutedClass}`}>Recommendations</span>
                    <p className={`text-sm mt-1 ${textClass} whitespace-pre-wrap`}>
                      {proof.serviceReport.recommendations}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            {proof.attachments && proof.attachments.length > 0 && (
              <div className={`p-4 rounded-lg ${cardBgClass}`}>
                <h3 className={`text-sm font-semibold mb-3 ${textClass}`}>
                  Attachments ({proof.attachments.length})
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {proof.attachments.map((att, index) => (
                    <div key={index} className={`flex items-center gap-3 p-2 rounded border ${borderClass}`}>
                      {att.mimeType?.startsWith('image/') ? (
                        <img
                          src={`${apiUrl}${att.path}`}
                          alt={att.originalName}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : att.mimeType?.includes('pdf') ? (
                        <FileText className="h-10 w-10 text-red-500 flex-shrink-0" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-blue-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium truncate ${textClass}`}>{att.originalName}</p>
                        <p className={`text-xs ${mutedClass}`}>{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <a
                        href={`${apiUrl}${att.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-blue-500 hover:text-blue-600"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signature */}
            {proof.signature?.signatureData && (
              <div className={`p-4 rounded-lg ${cardBgClass}`}>
                <h3 className={`text-sm font-semibold mb-3 ${textClass}`}>Signature</h3>
                <div className="flex items-center gap-4">
                  <img
                    src={proof.signature.signatureData}
                    alt="Signature"
                    className="h-20 border rounded bg-white"
                  />
                  <div>
                    <p className={`text-sm ${textClass}`}>Signed by: {proof.signature.signedBy}</p>
                    {proof.signature.signedAt && (
                      <p className={`text-xs ${mutedClass}`}>{formatDate(proof.signature.signedAt)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Revision History */}
            {proof.revisionHistory && proof.revisionHistory.length > 0 && (
              <div className={`p-4 rounded-lg ${cardBgClass}`}>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center gap-2 text-sm font-semibold ${textClass} w-full`}
                >
                  <Clock className="h-4 w-4" />
                  Revision History ({proof.revisionHistory.length})
                  {showHistory ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>
                {showHistory && (
                  <div className="mt-3 space-y-3">
                    {proof.revisionHistory.map((rev, index) => (
                      <div key={index} className={`p-3 rounded border ${borderClass}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium ${mutedClass}`}>
                            Revision {index + 1} - {formatDate(rev.revisedAt)}
                          </span>
                        </div>
                        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-400">
                          <strong>Rejection reason:</strong> {rev.rejectionFeedback}
                        </div>
                        <p className={`text-xs ${mutedClass}`}>
                          <strong>Previous work performed:</strong> {rev.serviceReport.workPerformed?.substring(0, 200)}
                          {(rev.serviceReport.workPerformed?.length || 0) > 200 ? '...' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Approval Feedback (optional) */}
            {!showRejectForm && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                  Approval Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={approveFeedback}
                  onChange={(e) => setApproveFeedback(e.target.value)}
                  placeholder="Optional notes for the technician..."
                  className={`w-full px-3 py-2 rounded-md border ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500 text-sm`}
                />
              </div>
            )}

            {/* Rejection Form */}
            {showRejectForm && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  Rejection Feedback
                </h3>
                <p className="text-xs text-red-600 dark:text-red-400 mb-3">
                  This feedback will be sent to the technician so they know what to fix.
                </p>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Explain what needs to be corrected or updated..."
                  className={`w-full px-3 py-2 rounded-md border ${inputBgClass} ${textClass} focus:ring-2 focus:ring-red-500 text-sm`}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between p-4 border-t ${borderClass}`}>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {showRejectForm ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setFeedback('');
                    }}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={loading || !feedback.trim()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting...</>
                    ) : (
                      <><XCircle className="h-4 w-4 mr-1" />Confirm Rejection</>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    disabled={loading}
                    className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Approving...</>
                    ) : (
                      <><Check className="h-4 w-4 mr-1" />Approve</>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompletionReviewModal;
