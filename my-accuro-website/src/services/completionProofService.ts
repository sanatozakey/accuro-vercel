import api from './api';

export interface ServiceReport {
  workPerformed: string;
  equipmentUsed?: string;
  issuesFound?: string;
  recommendations?: string;
}

export interface Attachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: string;
}

export interface Signature {
  signatureData: string;
  signedBy: string;
  signedAt: string;
}

export interface RevisionEntry {
  serviceReport: ServiceReport;
  attachments: Attachment[];
  signature?: Signature;
  rejectionFeedback: string;
  revisedAt: string;
  revisedBy: string;
}

export type CompletionProofStatus = 'pending_review' | 'approved' | 'rejected';

export interface CompletionProof {
  _id: string;
  bookingId: string | any;
  serviceReport: ServiceReport;
  attachments: Attachment[];
  signature?: Signature;
  completedBy: {
    _id: string;
    name: string;
    email: string;
  };
  completedByName: string;
  completedAt: string;
  // Review workflow fields
  status: CompletionProofStatus;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedByName?: string;
  reviewedAt?: string;
  reviewFeedback?: string;
  revisionHistory: RevisionEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompletionProofData {
  bookingId: string;
  serviceReport: ServiceReport;
  signature?: {
    signatureData: string;
    signedBy: string;
  };
  attachments?: File[];
}

class CompletionProofService {
  // Create completion proof with optional file uploads
  async createCompletionProof(data: CreateCompletionProofData): Promise<{
    success: boolean;
    message: string;
    data: { proof: CompletionProof; booking: any };
  }> {
    const formData = new FormData();
    formData.append('bookingId', data.bookingId);
    formData.append('serviceReport', JSON.stringify(data.serviceReport));

    if (data.signature) {
      formData.append('signature', JSON.stringify(data.signature));
    }

    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await api.post('/completion-proofs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get completion proof by booking ID
  async getByBookingId(bookingId: string): Promise<{
    success: boolean;
    data: CompletionProof;
  }> {
    const response = await api.get(`/completion-proofs/booking/${bookingId}`);
    return response.data;
  }

  // Get completion proof by ID
  async getById(id: string): Promise<{
    success: boolean;
    data: CompletionProof;
  }> {
    const response = await api.get(`/completion-proofs/${id}`);
    return response.data;
  }

  // Get all completion proofs
  async getAll(params?: {
    startDate?: string;
    endDate?: string;
    completedBy?: string;
    status?: string;
  }): Promise<{
    success: boolean;
    count: number;
    data: CompletionProof[];
  }> {
    const response = await api.get('/completion-proofs', { params });
    return response.data;
  }

  // Get proofs pending review (superadmin only)
  async getPendingReview(): Promise<{
    success: boolean;
    count: number;
    data: CompletionProof[];
  }> {
    const response = await api.get('/completion-proofs/pending-review');
    return response.data;
  }

  // Approve a completion proof (superadmin only)
  async approve(id: string, feedback?: string): Promise<{
    success: boolean;
    message: string;
    data: CompletionProof;
  }> {
    const response = await api.put(`/completion-proofs/${id}/approve`, { feedback });
    return response.data;
  }

  // Reject a completion proof (superadmin only)
  async reject(id: string, feedback: string): Promise<{
    success: boolean;
    message: string;
    data: CompletionProof;
  }> {
    const response = await api.put(`/completion-proofs/${id}/reject`, { feedback });
    return response.data;
  }

  // Revise a rejected completion proof (admin resubmits)
  async revise(id: string, data: CreateCompletionProofData): Promise<{
    success: boolean;
    message: string;
    data: CompletionProof;
  }> {
    const formData = new FormData();
    formData.append('bookingId', data.bookingId);
    formData.append('serviceReport', JSON.stringify(data.serviceReport));

    if (data.signature) {
      formData.append('signature', JSON.stringify(data.signature));
    }

    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await api.put(`/completion-proofs/${id}/revise`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Update completion proof
  async update(
    id: string,
    data: {
      serviceReport?: Partial<ServiceReport>;
      signature?: { signatureData: string; signedBy: string };
      attachments?: File[];
    }
  ): Promise<{
    success: boolean;
    message: string;
    data: CompletionProof;
  }> {
    const formData = new FormData();

    if (data.serviceReport) {
      formData.append('serviceReport', JSON.stringify(data.serviceReport));
    }

    if (data.signature) {
      formData.append('signature', JSON.stringify(data.signature));
    }

    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await api.put(`/completion-proofs/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Delete attachment
  async deleteAttachment(proofId: string, filename: string): Promise<{
    success: boolean;
    message: string;
    data: CompletionProof;
  }> {
    const response = await api.delete(`/completion-proofs/${proofId}/attachments/${filename}`);
    return response.data;
  }

  // Check if booking has completion proof
  async hasProof(bookingId: string): Promise<boolean> {
    try {
      const response = await this.getByBookingId(bookingId);
      return response.success && !!response.data;
    } catch {
      return false;
    }
  }
}

const completionProofService = new CompletionProofService();
export default completionProofService;
