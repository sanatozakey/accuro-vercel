import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Eye, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import quotationService, { Quotation } from '../services/quotationService';

export function CustomerQuotations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

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
            to="/products"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Request New Quote
          </Link>
        </div>

        {/* Quotations List */}
        {quotations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No quotations yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Browse our products and request a quotation to get started
            </p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {quotations.map((quotation) => (
              <div
                key={quotation._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-6"
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
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Requested: {formatDate(quotation.createdAt)}
                      </div>
                      <div>
                        {quotation.items.length} item(s) requested
                      </div>
                      {quotation.status === 'approved' && quotation.totalAmount && (
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400 mt-2">
                          Total: {formatCurrency(quotation.totalAmount, quotation.currency)}
                        </div>
                      )}
                      {quotation.status === 'approved' && quotation.validUntil && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Valid until: {formatDate(quotation.validUntil)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedQuotation(quotation)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 justify-center"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
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
                onClick={() => setSelectedQuotation(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Requested On</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(selectedQuotation.createdAt)}
                  </span>
                </div>
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved Details */}
              {selectedQuotation.status === 'approved' && (
                <div className="border dark:border-gray-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                    Approved Quotation
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

              {selectedQuotation.additionalRequirements && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Additional Requirements</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedQuotation.additionalRequirements}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedQuotation(null)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerQuotations;
