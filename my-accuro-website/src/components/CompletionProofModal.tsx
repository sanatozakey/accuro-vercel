import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Image, Trash2, Check, ChevronRight, ChevronLeft, Loader2, PenTool } from 'lucide-react';
import { Button } from './ui/button';
import completionProofService, { ServiceReport } from '../services/completionProofService';
import toast from 'react-hot-toast';

interface CompletionProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  booking: {
    _id: string;
    company: string;
    contactName: string;
    date: string;
    time: string;
    purpose: string;
    product: string;
  };
  darkMode?: boolean;
}

type Step = 'report' | 'attachments' | 'signature' | 'review';

const STEPS: Step[] = ['report', 'attachments', 'signature', 'review'];

const STEP_LABELS: Record<Step, string> = {
  report: 'Service Report',
  attachments: 'Attachments',
  signature: 'Signature',
  review: 'Review & Submit',
};

interface FileWithPreview extends File {
  preview?: string;
}

export function CompletionProofModal({
  isOpen,
  onClose,
  onComplete,
  booking,
  darkMode = false,
}: CompletionProofModalProps): React.ReactElement | null {
  const [currentStep, setCurrentStep] = useState<Step>('report');
  const [loading, setLoading] = useState(false);

  // Service Report state
  const [serviceReport, setServiceReport] = useState<ServiceReport>({
    workPerformed: '',
    equipmentUsed: '',
    issuesFound: '',
    recommendations: '',
  });

  // Attachments state
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature state
  const [signature, setSignature] = useState<string | null>(null);
  const [signedBy, setSignedBy] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).slice(0, 5 - files.length);
    const filesWithPreview = newFiles.map((file) => {
      const fileWithPreview = file as FileWithPreview;
      if (file.type.startsWith('image/')) {
        fileWithPreview.preview = URL.createObjectURL(file);
      }
      return fileWithPreview;
    });
    setFiles((prev) => [...prev, ...filesWithPreview].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Canvas signature methods
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = 'round';
    context.strokeStyle = darkMode ? '#ffffff' : '#000000';
    context.lineWidth = 2;
    contextRef.current = context;

    // Fill with white background
    context.fillStyle = darkMode ? '#374151' : '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [darkMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    setSignature(null);
    initializeCanvas();
  };

  React.useEffect(() => {
    if (currentStep === 'signature' && canvasRef.current) {
      initializeCanvas();
    }
  }, [currentStep, initializeCanvas]);

  const canProceed = (): boolean => {
    if (currentStep === 'report') {
      return serviceReport.workPerformed.trim().length > 0;
    }
    return true;
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    if (!serviceReport.workPerformed.trim()) {
      toast.error('Work performed description is required');
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        bookingId: booking._id,
        serviceReport,
        attachments: files,
      };

      if (signature && signedBy.trim()) {
        data.signature = {
          signatureData: signature,
          signedBy: signedBy.trim(),
        };
      }

      await completionProofService.createCompletionProof(data);
      toast.success('Booking completed with proof successfully');
      onComplete();
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create completion proof';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const inputBgClass = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className={`relative w-full max-w-2xl rounded-lg shadow-xl ${bgClass}`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${borderClass}`}>
            <div>
              <h2 className={`text-lg font-semibold ${textClass}`}>Complete Booking</h2>
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

          {/* Progress Steps */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${borderClass}`}>
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index < currentStepIndex
                      ? 'bg-green-500 text-white'
                      : index === currentStepIndex
                      ? 'bg-blue-500 text-white'
                      : darkMode
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm hidden sm:inline ${index === currentStepIndex ? textClass : mutedClass}`}>
                  {STEP_LABELS[step]}
                </span>
                {index < STEPS.length - 1 && (
                  <ChevronRight className={`h-4 w-4 mx-2 ${mutedClass}`} />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Step 1: Service Report */}
            {currentStep === 'report' && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Work Performed <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={serviceReport.workPerformed}
                    onChange={(e) => setServiceReport({ ...serviceReport, workPerformed: e.target.value })}
                    placeholder="Describe the work that was performed during this service..."
                    className={`w-full px-3 py-2 rounded-md border ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Equipment Used
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
                    Issues Found
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
                    Recommendations
                  </label>
                  <textarea
                    rows={2}
                    value={serviceReport.recommendations}
                    onChange={(e) => setServiceReport({ ...serviceReport, recommendations: e.target.value })}
                    placeholder="Any recommendations for the customer..."
                    className={`w-full px-3 py-2 rounded-md border ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Attachments */}
            {currentStep === 'attachments' && (
              <div className="space-y-4">
                <p className={`text-sm ${mutedClass}`}>
                  Upload photos or documents as proof of completion (optional, max 5 files)
                </p>

                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : darkMode
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Upload className={`h-10 w-10 mx-auto mb-3 ${mutedClass}`} />
                  <p className={textClass}>Drag and drop files here, or click to select</p>
                  <p className={`text-sm ${mutedClass}`}>
                    Images, PDFs, and documents up to 10MB each
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${borderClass}`}
                      >
                        <div className="flex items-center gap-3">
                          {file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : file.type.includes('pdf') ? (
                            <FileText className="h-10 w-10 text-red-500" />
                          ) : (
                            <Image className="h-10 w-10 text-blue-500" />
                          )}
                          <div>
                            <p className={`text-sm font-medium ${textClass}`}>{file.name}</p>
                            <p className={`text-xs ${mutedClass}`}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2 hover:bg-red-100 rounded-full text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Signature */}
            {currentStep === 'signature' && (
              <div className="space-y-4">
                <p className={`text-sm ${mutedClass}`}>
                  Capture customer signature for verification (optional)
                </p>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Signed By
                  </label>
                  <input
                    type="text"
                    value={signedBy}
                    onChange={(e) => setSignedBy(e.target.value)}
                    placeholder="Customer name..."
                    className={`w-full px-3 py-2 rounded-md border ${inputBgClass} ${textClass} focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Signature
                  </label>
                  <div className={`border rounded-lg overflow-hidden ${borderClass}`}>
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className={`w-full h-48 cursor-crosshair ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                      style={{ touchAction: 'none' }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className={`text-xs ${mutedClass}`}>
                      <PenTool className="inline h-3 w-3 mr-1" />
                      Draw signature above
                    </p>
                    <button
                      onClick={clearSignature}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 'review' && (
              <div className="space-y-4">
                <h3 className={`font-medium ${textClass}`}>Review Completion Details</h3>

                {/* Booking Info */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${textClass}`}>Booking</h4>
                  <p className={`text-sm ${mutedClass}`}>
                    {booking.company} - {booking.contactName}
                  </p>
                  <p className={`text-sm ${mutedClass}`}>
                    {new Date(booking.date).toLocaleDateString()} at {booking.time}
                  </p>
                </div>

                {/* Service Report Summary */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${textClass}`}>Service Report</h4>
                  <div className="space-y-2">
                    <div>
                      <span className={`text-xs ${mutedClass}`}>Work Performed:</span>
                      <p className={`text-sm ${textClass}`}>{serviceReport.workPerformed}</p>
                    </div>
                    {serviceReport.equipmentUsed && (
                      <div>
                        <span className={`text-xs ${mutedClass}`}>Equipment Used:</span>
                        <p className={`text-sm ${textClass}`}>{serviceReport.equipmentUsed}</p>
                      </div>
                    )}
                    {serviceReport.issuesFound && (
                      <div>
                        <span className={`text-xs ${mutedClass}`}>Issues Found:</span>
                        <p className={`text-sm ${textClass}`}>{serviceReport.issuesFound}</p>
                      </div>
                    )}
                    {serviceReport.recommendations && (
                      <div>
                        <span className={`text-xs ${mutedClass}`}>Recommendations:</span>
                        <p className={`text-sm ${textClass}`}>{serviceReport.recommendations}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments Summary */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${textClass}`}>Attachments</h4>
                  {files.length > 0 ? (
                    <p className={`text-sm ${mutedClass}`}>{files.length} file(s) attached</p>
                  ) : (
                    <p className={`text-sm ${mutedClass}`}>No attachments</p>
                  )}
                </div>

                {/* Signature Summary */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${textClass}`}>Signature</h4>
                  {signature && signedBy ? (
                    <div className="flex items-center gap-4">
                      <img src={signature} alt="Signature" className="h-16 border rounded" />
                      <p className={`text-sm ${mutedClass}`}>Signed by: {signedBy}</p>
                    </div>
                  ) : (
                    <p className={`text-sm ${mutedClass}`}>No signature captured</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between p-4 border-t ${borderClass}`}>
            <Button
              variant="outline"
              onClick={currentStepIndex === 0 ? onClose : handleBack}
              disabled={loading}
            >
              {currentStepIndex === 0 ? 'Cancel' : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </>
              )}
            </Button>

            {currentStep === 'review' ? (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Complete Booking
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompletionProofModal;
