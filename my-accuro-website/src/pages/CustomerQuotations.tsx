import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Eye, Clock, CheckCircle, XCircle, Calendar, ChevronDown, ChevronUp, AlertCircle, ThumbsDown, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import quotationService, { Quotation } from '../services/quotationService';

type FilterTab = 'all' | 'pending' | 'quoted' | 'accepted' | 'declined' | 'rejected' | 'expired';

export function CustomerQuotations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchQuotations();
  }, [user, navigate]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await quotationService.getQuotations({});
      setQuotations(response.data);
    } catch (error: any) {
      toast.error('Failed to load quotations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotations = useMemo(() => {
    if (activeFilter === 'all') return quotations;
    return quotations.filter((q) => q.status === activeFilter);
  }, [quotations, activeFilter]);

  const quotedCount = useMemo(() => {
    return quotations.filter((q) => q.status === 'quoted').length;
  }, [quotations]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString()}`;
    }
    return `₱${amount.toLocaleString()}`;
  };

  const handleAcceptQuotation = async (id: string) => {
    try {
      setActionLoading(true);
      await quotationService.acceptQuotation(id);
      toast.success('Quotation accepted successfully!');
      await fetchQuotations();
      if (selectedQuotation && selectedQuotation._id === id) {
        const updated = (await quotationService.getQuotationById(id)).data;
        setSelectedQuotation(updated);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to accept quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeclineModal = (id: string) => {
    setDeclineTargetId(id);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleDeclineQuotation = async () => {
    if (!declineTargetId) return;
    try {
      setActionLoading(true);
      await quotationService.declineQuotation(declineTargetId, declineReason || undefined);
      toast.success('Quotation declined.');
      setShowDeclineModal(false);
      setDeclineTargetId(null);
      setDeclineReason('');
      await fetchQuotations();
      if (selectedQuotation && selectedQuotation._id === declineTargetId) {
        const updated = (await quotationService.getQuotationById(declineTargetId)).data;
        setSelectedQuotation(updated);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to decline quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'quoted':
        return <Send className="h-5 w-5 text-blue-600" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'declined':
        return <ThumbsDown className="h-5 w-5 text-orange-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      quoted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      declined: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status] || styles.expired}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your quotation is being reviewed by our team...';
      case 'quoted':
        return 'A quote has been prepared for you. Please review and accept or decline.';
      case 'accepted':
        return 'You have accepted this quotation.';
      case 'declined':
        return 'You declined this quotation. The admin may send a revised quote.';
      case 'rejected':
        return 'This quotation request could not be fulfilled.';
      case 'expired':
        return 'This quotation has expired.';
      default:
        return '';
    }
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'quoted', label: 'Quoted' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'declined', label: 'Declined' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'expired', label: 'Expired' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Quotations
            </h1>
          </div>
          <Link
            to="/request-quote"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
          >
            Request New Quote
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition relative ${
                activeFilter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
              {tab.key === 'quoted' && quotedCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {quotedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Quotations List */}
        {filteredQuotations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeFilter === 'all' ? 'No quotations yet' : `No ${activeFilter} quotations`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {activeFilter === 'all'
                ? 'Browse our products and request a quotation to get started'
                : 'There are no quotations with this status.'}
            </p>
            {activeFilter === 'all' && (
              <Link
                to="/products"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Browse Products
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuotations.map((quotation) => (
              <div
                key={quotation._id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-6 ${
                  quotation.status === 'quoted' ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(quotation.status)}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {quotation.quotationNumber}
                      </h3>
                      {getStatusBadge(quotation.status)}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-2">
                      {getStatusMessage(quotation.status)}
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Requested: {formatDate(quotation.createdAt)}
                      </div>
                      <div>
                        {quotation.items.length} item(s) requested
                      </div>
                      {(quotation.status === 'quoted' || quotation.status === 'accepted') && quotation.totalAmount && (
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400 mt-2">
                          Total: {formatCurrency(quotation.totalAmount, quotation.currency)}
                        </div>
                      )}
                      {(quotation.status === 'quoted' || quotation.status === 'accepted') && quotation.validUntil && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Valid until: {formatDate(quotation.validUntil)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedQuotation(quotation)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 justify-center"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    {quotation.status === 'quoted' && (
                      <>
                        <button
                          onClick={() => handleAcceptQuotation(quotation._id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => openDeclineModal(quotation._id)}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {quotation.status === 'accepted' && (
                      <Link
                        to={`/booking?quotationId=${quotation._id}&product=${encodeURIComponent(quotation.items[0]?.productName || '')}`}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium text-center"
                      >
                        Book a Meeting
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quotation Details
              </h2>
              <button
                onClick={() => { setSelectedQuotation(null); setShowHistory(false); }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Accepted Banner */}
            {selectedQuotation.status === 'accepted' && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-green-800 dark:text-green-200">Quotation Accepted</div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    You accepted this quotation{selectedQuotation.acceptedAt ? ` on ${formatDate(selectedQuotation.acceptedAt)}` : ''}.
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Header Info */}
              <div className="border-b dark:border-gray-700 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quotation Number</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedQuotation.quotationNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  {getStatusBadge(selectedQuotation.status)}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Requested On</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(selectedQuotation.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
                  {getStatusMessage(selectedQuotation.status)}
                </p>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Requested Items</h3>
                <div className="space-y-2">
                  {selectedQuotation.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</div>
                        {item.specifications && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.specifications}</div>
                        )}
                      </div>
                      {item.unitPrice && item.totalPrice && (
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatCurrency(item.unitPrice, selectedQuotation.currency)} ea.
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(item.totalPrice, selectedQuotation.currency)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quoted Details - Action needed */}
              {selectedQuotation.status === 'quoted' && (
                <div className="border-2 border-blue-400 dark:border-blue-500 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                    Quote Prepared - Your Action Needed
                  </h3>
                  {selectedQuotation.totalAmount && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(selectedQuotation.totalAmount, selectedQuotation.currency)}
                      </div>
                    </div>
                  )}
                  {selectedQuotation.validUntil && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Valid until: <span className="font-medium">{formatDate(selectedQuotation.validUntil)}</span>
                    </div>
                  )}
                  {selectedQuotation.paymentTerms && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Terms:</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedQuotation.paymentTerms}</div>
                    </div>
                  )}
                  {selectedQuotation.deliveryTerms && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Terms:</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedQuotation.deliveryTerms}</div>
                    </div>
                  )}
                  {selectedQuotation.termsAndConditions && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Terms & Conditions:</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{selectedQuotation.termsAndConditions}</div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleAcceptQuotation(selectedQuotation._id)}
                      disabled={actionLoading}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-center disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Accept Quotation'}
                    </button>
                    <button
                      onClick={() => openDeclineModal(selectedQuotation._id)}
                      disabled={actionLoading}
                      className="flex-1 px-6 py-3 border-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-semibold text-center disabled:opacity-50"
                    >
                      Decline Quotation
                    </button>
                  </div>
                </div>
              )}

              {/* Accepted Details */}
              {selectedQuotation.status === 'accepted' && (
                <div className="border dark:border-gray-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                    Accepted Quotation
                  </h3>
                  {selectedQuotation.totalAmount && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(selectedQuotation.totalAmount, selectedQuotation.currency)}
                      </div>
                    </div>
                  )}
                  {selectedQuotation.validUntil && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Valid until: {formatDate(selectedQuotation.validUntil)}
                    </div>
                  )}
                  {selectedQuotation.paymentTerms && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Terms:</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedQuotation.paymentTerms}</div>
                    </div>
                  )}
                  {selectedQuotation.deliveryTerms && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Terms:</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedQuotation.deliveryTerms}</div>
                    </div>
                  )}
                  {selectedQuotation.termsAndConditions && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Terms & Conditions:</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{selectedQuotation.termsAndConditions}</div>
                    </div>
                  )}
                  <div className="mt-4">
                    <Link
                      to={`/booking?quotationId=${selectedQuotation._id}&product=${encodeURIComponent(selectedQuotation.items[0]?.productName || '')}`}
                      className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                    >
                      Book a Meeting
                    </Link>
                  </div>
                </div>
              )}

              {/* Declined Details */}
              {selectedQuotation.status === 'declined' && (
                <div className="border dark:border-gray-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">
                    Declined Quotation
                  </h3>
                  {selectedQuotation.totalAmount && (
                    <div className="mb-3 opacity-60">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Previous Quote Amount:</span>
                      <div className="text-xl font-bold text-gray-500 dark:text-gray-400 line-through">
                        {formatCurrency(selectedQuotation.totalAmount, selectedQuotation.currency)}
                      </div>
                    </div>
                  )}
                  {selectedQuotation.declineReason && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Decline Reason:</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedQuotation.declineReason}</div>
                    </div>
                  )}
                  {selectedQuotation.declinedAt && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Declined on: {formatDate(selectedQuotation.declinedAt)}
                    </div>
                  )}
                </div>
              )}

              {/* Rejected */}
              {selectedQuotation.status === 'rejected' && selectedQuotation.adminNotes && (
                <div className="border dark:border-gray-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    Rejection Reason
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedQuotation.adminNotes}</p>
                </div>
              )}

              {/* Quotation History (re-quotation rounds) */}
              {selectedQuotation.quotationHistory && selectedQuotation.quotationHistory.length > 0 && (
                <div className="border dark:border-gray-700 rounded-lg">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Previous Quotes ({selectedQuotation.quotationHistory.length})
                    </h3>
                    {showHistory ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  {showHistory && (
                    <div className="px-4 pb-4 space-y-3">
                      {selectedQuotation.quotationHistory.map((entry, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm opacity-75">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Round {idx + 1}
                            </span>
                            {entry.quotedAt && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(entry.quotedAt)}
                              </span>
                            )}
                          </div>
                          {entry.totalAmount && (
                            <div className="text-gray-600 dark:text-gray-400">
                              Amount: {formatCurrency(entry.totalAmount, entry.currency || selectedQuotation.currency)}
                            </div>
                          )}
                          {entry.declineReason && (
                            <div className="text-orange-600 dark:text-orange-400 mt-1">
                              Decline reason: {entry.declineReason}
                            </div>
                          )}
                          {entry.paymentTerms && (
                            <div className="text-gray-500 dark:text-gray-400 mt-1">Payment: {entry.paymentTerms}</div>
                          )}
                          {entry.deliveryTerms && (
                            <div className="text-gray-500 dark:text-gray-400">Delivery: {entry.deliveryTerms}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedQuotation.additionalRequirements && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Additional Requirements</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedQuotation.additionalRequirements}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setSelectedQuotation(null); setShowHistory(false); }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Decline Quotation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to decline this quotation? You can optionally provide a reason.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining (optional)..."
              rows={3}
              className="w-full border dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeclineModal(false); setDeclineTargetId(null); setDeclineReason(''); }}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineQuotation}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerQuotations;
