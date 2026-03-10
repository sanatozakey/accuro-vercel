import React, { useState } from 'react';
import { X, Check, ChevronRight, ChevronLeft, Loader2, SkipForward, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import completionProofService, { ServiceReport } from '../services/completionProofService';
import toast from 'react-hot-toast';

interface Booking {
  _id: string;
  date: string;
  time: string;
  company: string;
  contactName: string;
  contactEmail?: string;
  purpose: string;
  product: string;
}

interface BulkCompletionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  bookings: Booking[];
  darkMode?: boolean;
}

interface CompletionResult {
  bookingId: string;
  company: string;
  status: 'completed' | 'pending_review' | 'skipped' | 'failed';
  error?: string;
}

export function BulkCompletionWizard({
  isOpen,
  onClose,
  onComplete,
  bookings,
  darkMode = false,
}: BulkCompletionWizardProps): React.ReactElement | null {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CompletionResult[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // Service Report state for current booking
  const [serviceReport, setServiceReport] = useState<ServiceReport>({
    workPerformed: '',
    equipmentUsed: '',
    issuesFound: '',
    recommendations: '',
  });

  const currentBooking = bookings[currentIndex];
  const totalBookings = bookings.length;
  const completedCount = results.filter(r => r.status === 'completed').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  const resetServiceReport = () => {
    setServiceReport({
      workPerformed: '',
      equipmentUsed: '',
      issuesFound: '',
      recommendations: '',
    });
  };

  const handleComplete = async () => {
    if (!serviceReport.workPerformed.trim()) {
      toast.error('Work performed description is required');
      return;
    }

    setLoading(true);
    try {
      const response = await completionProofService.createCompletionProof({
        bookingId: currentBooking._id,
        serviceReport,
      });

      const resultStatus = response?.data?.proof?.status === 'approved' ? 'completed' : 'pending_review';
      setResults(prev => [...prev, {
        bookingId: currentBooking._id,
        company: currentBooking.company,
        status: resultStatus,
      }]);

      toast.success(resultStatus === 'completed'
        ? `Completed: ${currentBooking.company}`
        : `Report submitted for review: ${currentBooking.company}`);
      moveToNext();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to complete booking';
      toast.error(message);
      setResults(prev => [...prev, {
        bookingId: currentBooking._id,
        company: currentBooking.company,
        status: 'failed',
        error: message,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setResults(prev => [...prev, {
      bookingId: currentBooking._id,
      company: currentBooking.company,
      status: 'skipped',
    }]);
    toast(`Skipped: ${currentBooking.company}`, { icon: '⏭️' });
    moveToNext();
  };

  const moveToNext = () => {
    resetServiceReport();
    if (currentIndex + 1 < totalBookings) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleFinish = () => {
    onComplete();
    onClose();
    // Reset state for next time
    setCurrentIndex(0);
    setResults([]);
    setShowSummary(false);
    resetServiceReport();
  };

  const handleCancel = () => {
    if (results.length > 0) {
      // Some bookings were processed, still call onComplete to refresh
      onComplete();
    }
    onClose();
    // Reset state
    setCurrentIndex(0);
    setResults([]);
    setShowSummary(false);
    resetServiceReport();
  };

  if (!isOpen || bookings.length === 0) return null;

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBgClass = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={handleCancel} />

        {/* Modal */}
        <div className={`relative w-full max-w-2xl rounded-lg shadow-xl ${bgClass}`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${borderClass}`}>
            <div>
              <h2 className={`text-lg font-semibold ${textClass}`}>
                {showSummary ? 'Completion Summary' : 'Complete Past Bookings'}
              </h2>
              {!showSummary && (
                <p className={`text-sm ${mutedClass}`}>
                  Booking {currentIndex + 1} of {totalBookings}
                </p>
              )}
            </div>
            <button
              onClick={handleCancel}
              className={`p-2 rounded-full hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Bar */}
          {!showSummary && (
            <div className={`px-6 pt-4`}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={mutedClass}>Progress</span>
                <span className={mutedClass}>
                  {completedCount} completed, {skippedCount} skipped
                </span>
              </div>
              <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${((currentIndex) / totalBookings) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {showSummary ? (
              /* Summary View */
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <Check className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className={`font-medium ${textClass}`}>Bulk Completion Finished</h3>
                    <p className={`text-sm ${mutedClass}`}>
                      {completedCount} of {totalBookings} bookings completed successfully
                    </p>
                  </div>
                </div>

                <div className={`border rounded-lg overflow-hidden ${borderClass}`}>
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${mutedClass}`}>
                          Company
                        </th>
                        <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${mutedClass}`}>
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {results.map((result, index) => (
                        <tr key={index}>
                          <td className={`px-4 py-2 text-sm ${textClass}`}>
                            {result.company}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {result.status === 'completed' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <Check className="h-3 w-3 mr-1" />
                                Completed
                              </span>
                            )}
                            {result.status === 'pending_review' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                <Check className="h-3 w-3 mr-1" />
                                Submitted for Review
                              </span>
                            )}
                            {result.status === 'skipped' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <SkipForward className="h-3 w-3 mr-1" />
                                Skipped
                              </span>
                            )}
                            {result.status === 'failed' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Failed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {skippedCount > 0 && (
                  <p className={`text-sm ${mutedClass}`}>
                    Note: Skipped bookings remain in their current state and will appear again next time.
                  </p>
                )}
              </div>
            ) : (
              /* Booking Form View */
              <div className="space-y-4">
                {/* Current Booking Info */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-medium ${textClass}`}>{currentBooking.company}</h3>
                      <p className={`text-sm ${mutedClass}`}>
                        {currentBooking.contactName} - {new Date(currentBooking.date).toLocaleDateString()} at {currentBooking.time}
                      </p>
                      <p className={`text-sm ${mutedClass}`}>
                        {currentBooking.purpose} | {currentBooking.product}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-white'} ${mutedClass}`}>
                      Past Due
                    </span>
                  </div>
                </div>

                {/* Service Report Form */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Work Performed <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={serviceReport.workPerformed}
                    onChange={(e) => setServiceReport({ ...serviceReport, workPerformed: e.target.value })}
                    placeholder="Describe the work that was performed during this service..."
                    className={`w-full px-3 py-2 rounded-md border ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Equipment Used <span className={mutedClass}>(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={serviceReport.equipmentUsed}
                    onChange={(e) => setServiceReport({ ...serviceReport, equipmentUsed: e.target.value })}
                    placeholder="List any equipment or tools used..."
                    className={`w-full px-3 py-2 rounded-md border ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Issues Found <span className={mutedClass}>(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={serviceReport.issuesFound}
                    onChange={(e) => setServiceReport({ ...serviceReport, issuesFound: e.target.value })}
                    placeholder="Document any issues discovered during service..."
                    className={`w-full px-3 py-2 rounded-md border ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Recommendations <span className={mutedClass}>(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={serviceReport.recommendations}
                    onChange={(e) => setServiceReport({ ...serviceReport, recommendations: e.target.value })}
                    placeholder="Any recommendations for the customer..."
                    className={`w-full px-3 py-2 rounded-md border ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <p className={`text-xs ${mutedClass}`}>
                  Tip: For full verification with attachments and signature, use the individual "Complete" button from the table.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between p-4 border-t ${borderClass}`}>
            {showSummary ? (
              <>
                <div />
                <Button onClick={handleFinish}>
                  <Check className="h-4 w-4 mr-1" />
                  Done
                </Button>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    disabled={loading}
                    className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                </div>
                <Button
                  onClick={handleComplete}
                  disabled={loading || !serviceReport.workPerformed.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing...
                    </>
                  ) : currentIndex + 1 < totalBookings ? (
                    <>
                      Complete & Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Complete Last
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkCompletionWizard;
