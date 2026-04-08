import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Eye, Check, X, RefreshCw, Filter, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import quotationService, { Quotation, QuotationHistoryEntry } from '../services/quotationService';

interface QuotationDashboardProps {
  isInline?: boolean;
  darkMode?: boolean;
}

export function QuotationDashboard({ isInline = false, darkMode: propDarkMode }: QuotationDashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showSendQuoteModal, setShowSendQuoteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Send Quote form state
  const [quoteForm, setQuoteForm] = useState({
    totalAmount: '',
    validUntil: '',
    paymentTerms: '50% upon order, 50% upon delivery',
    deliveryTerms: '30-45 days from order confirmation',
    termsAndConditions: 'Prices are subject to change without notice. Delivery timeline may vary based on product availability.',
  });

  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    if (!isInline && user?.role !== 'admin' && user?.role !== 'superadmin') {
      navigate('/');
      return;
    }
    fetchQuotations();
  }, [user, navigate, filter, isInline]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await quotationService.getQuotations({ status: filter });
      setQuotations(response.data);
    } catch (error: any) {
      toast.error('Failed to load quotations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!selectedQuotation) return;

    if (!quoteForm.totalAmount || !quoteForm.validUntil) {
      toast.error('Please fill in total amount and valid until date');
      return;
    }

    try {
      await quotationService.sendQuote(selectedQuotation._id, {
        totalAmount: parseFloat(quoteForm.totalAmount),
        validUntil: quoteForm.validUntil,
        paymentTerms: quoteForm.paymentTerms,
        deliveryTerms: quoteForm.deliveryTerms,
        termsAndConditions: quoteForm.termsAndConditions,
      });

      toast.success('Quote sent successfully!');
      setShowSendQuoteModal(false);
      setSelectedQuotation(null);
      fetchQuotations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send quote');
    }
  };

  const handleReject = async () => {
    if (!selectedQuotation) return;

    try {
      await quotationService.rejectQuotation(selectedQuotation._id, rejectNotes);
      toast.success('Quotation rejected');
      setShowRejectModal(false);
      setSelectedQuotation(null);
      setRejectNotes('');
      fetchQuotations();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject quotation');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openSendQuoteModal = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    // Pre-fill form with previous values if re-quoting a declined quotation
    if (quotation.status === 'declined' && quotation.totalAmount) {
      setQuoteForm({
        totalAmount: quotation.totalAmount.toString(),
        validUntil: quotation.validUntil ? new Date(quotation.validUntil).toISOString().split('T')[0] : '',
        paymentTerms: quotation.paymentTerms || '50% upon order, 50% upon delivery',
        deliveryTerms: quotation.deliveryTerms || '30-45 days from order confirmation',
        termsAndConditions: quotation.termsAndConditions || 'Prices are subject to change without notice. Delivery timeline may vary based on product availability.',
      });
    } else {
      setQuoteForm({
        totalAmount: '',
        validUntil: '',
        paymentTerms: '50% upon order, 50% upon delivery',
        deliveryTerms: '30-45 days from order confirmation',
        termsAndConditions: 'Prices are subject to change without notice. Delivery timeline may vary based on product availability.',
      });
    }
    setShowSendQuoteModal(true);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      quoted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      declined: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={`${isInline ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900'} flex items-center justify-center py-12`}>
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className={isInline ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900 py-8'}>
      <div className={isInline ? '' : 'container mx-auto px-4'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quotation Management
            </h1>
          </div>
          <button
            onClick={fetchQuotations}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            {['all', 'pending', 'quoted', 'accepted', 'declined', 'rejected', 'expired'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {/* User filter */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <label className="text-sm text-gray-600 dark:text-gray-400">User:</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All users</option>
              {Array.from(
                new Map(
                  quotations.map((q) => [q.customerEmail, { email: q.customerEmail, name: q.customerName }])
                ).values()
              )
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.name} ({u.email})
                  </option>
                ))}
            </select>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: 'Pending', status: 'pending' },
            { label: 'Quoted', status: 'quoted' },
            { label: 'Accepted', status: 'accepted' },
            { label: 'Declined', status: 'declined' },
            { label: 'Rejected', status: 'rejected' },
            { label: 'Expired', status: 'expired' },
          ].map((stat) => {
            const count = quotations.filter((q) => q.status === stat.status).length;
            return (
              <div
                key={stat.status}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center"
              >
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quotations List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Quote #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {quotations
                .filter((q) => userFilter === 'all' || q.customerEmail === userFilter)
                .filter((q) => {
                  if (!userSearch.trim()) return true;
                  const s = userSearch.toLowerCase();
                  return (
                    q.customerName?.toLowerCase().includes(s) ||
                    q.customerEmail?.toLowerCase().includes(s) ||
                    q.company?.toLowerCase().includes(s)
                  );
                })
                .map((quotation) => (
                <tr key={quotation._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {quotation.quotationNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div>{quotation.customerName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{quotation.company}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {quotation.items.length} item(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(quotation.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(quotation.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {/* View button for all statuses */}
                      <button
                        onClick={() => {
                          setSelectedQuotation(quotation);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {/* Send Quote + Reject for pending */}
                      {quotation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openSendQuoteModal(quotation)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Send Quote"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedQuotation(quotation);
                              setShowRejectModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Reject"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      {/* Re-quote for declined */}
                      {quotation.status === 'declined' && (
                        <button
                          onClick={() => openSendQuoteModal(quotation)}
                          className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          title="Re-quote"
                        >
                          <RotateCcw className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {quotations.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No quotations found
            </div>
          )}
        </div>
      </div>

      {/* Send Quote Modal */}
      {showSendQuoteModal && selectedQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedQuotation.status === 'declined' ? 'Re-quote' : 'Send Quote'}
            </h2>
            {selectedQuotation.status === 'declined' && selectedQuotation.declineReason && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Customer decline reason:</p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">{selectedQuotation.declineReason}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Total Amount (PHP) *
                </label>
                <input
                  type="number"
                  value={quoteForm.totalAmount}
                  onChange={(e) => setQuoteForm({ ...quoteForm, totalAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Valid Until *
                </label>
                <input
                  type="date"
                  value={quoteForm.validUntil}
                  onChange={(e) => setQuoteForm({ ...quoteForm, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Payment Terms
                </label>
                <textarea
                  value={quoteForm.paymentTerms}
                  onChange={(e) => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Delivery Terms
                </label>
                <textarea
                  value={quoteForm.deliveryTerms}
                  onChange={(e) => setQuoteForm({ ...quoteForm, deliveryTerms: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Terms & Conditions
                </label>
                <textarea
                  value={quoteForm.termsAndConditions}
                  onChange={(e) => setQuoteForm({ ...quoteForm, termsAndConditions: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSendQuoteModal(false);
                  setSelectedQuotation(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuote}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {selectedQuotation.status === 'declined' ? 'Re-quote' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Reject Quotation
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Reason (optional)
                </label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Explain why this quotation is being rejected..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedQuotation(null);
                  setRejectNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Detail Modal */}
      {showViewModal && selectedQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quotation Details
              </h2>
              {getStatusBadge(selectedQuotation.status)}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Quote Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedQuotation.quotationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedQuotation.customerName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedQuotation.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedQuotation.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedQuotation.customerPhone}</p>
                </div>
                {selectedQuotation.totalAmount && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedQuotation.currency || 'PHP'} {selectedQuotation.totalAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedQuotation.validUntil && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Valid Until</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedQuotation.validUntil)}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items ({selectedQuotation.items.length})</p>
                <div className="border dark:border-gray-700 rounded-lg divide-y dark:divide-gray-700">
                  {selectedQuotation.items.map((item, idx) => (
                    <div key={idx} className="px-3 py-2 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                        {item.specifications && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.specifications}</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuotation.additionalRequirements && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Additional Requirements</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedQuotation.additionalRequirements}</p>
                </div>
              )}

              {selectedQuotation.declineReason && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Decline Reason</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">{selectedQuotation.declineReason}</p>
                </div>
              )}

              {/* Quotation History */}
              {selectedQuotation.quotationHistory && selectedQuotation.quotationHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quotation History</p>
                  <div className="border dark:border-gray-700 rounded-lg divide-y dark:divide-gray-700">
                    {selectedQuotation.quotationHistory.map((entry, idx) => (
                      <div key={idx} className="px-3 py-3">
                        <div className="flex justify-between items-start">
                          <div>
                            {entry.totalAmount && (
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Amount: {entry.currency || 'PHP'} {entry.totalAmount.toLocaleString()}
                              </p>
                            )}
                            {entry.quotedAt && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Quoted: {formatDate(entry.quotedAt)}
                              </p>
                            )}
                            {entry.validUntil && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Valid until: {formatDate(entry.validUntil)}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">Round {idx + 1}</span>
                        </div>
                        {entry.declineReason && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            Declined: {entry.declineReason}
                          </p>
                        )}
                        {entry.declinedAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Declined on: {formatDate(entry.declinedAt)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedQuotation(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
              {selectedQuotation.status === 'pending' && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openSendQuoteModal(selectedQuotation);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Send Quote
                </button>
              )}
              {selectedQuotation.status === 'declined' && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openSendQuoteModal(selectedQuotation);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
                >
                  Re-quote
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotationDashboard;
