import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import CompletionProof, { IAttachment } from '../models/CompletionProof';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';
import ActivityLog from '../models/ActivityLog';
import { NotificationService } from '../services/notificationService';

// Helper: push to statusHistory with loose typing for mongoose subdocs
const pushStatusHistory = (booking: any, status: string, changedBy: any, note: string) => {
  booking.statusHistory.push({ status, changedAt: new Date(), changedBy, note });
};

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads/proofs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper to format booking details for notifications
const formatBookingDetails = (booking: any) => ({
  company: booking.company,
  date: booking.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  time: booking.time,
});

// @desc    Create completion proof (admin submits for review, superadmin auto-approves)
// @route   POST /api/completion-proofs
// @access  Private/Admin
export const createCompletionProof = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, serviceReport, signature } = req.body;

    // Validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if proof already exists for this booking
    const existingProof = await CompletionProof.findOne({ bookingId });
    if (existingProof) {
      return res.status(400).json({
        success: false,
        message: 'Completion proof already exists for this booking',
      });
    }

    // Validate service report
    let parsedServiceReport;
    try {
      parsedServiceReport = typeof serviceReport === 'string'
        ? JSON.parse(serviceReport)
        : serviceReport;
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service report format',
      });
    }

    if (!parsedServiceReport?.workPerformed) {
      return res.status(400).json({
        success: false,
        message: 'Work performed description is required',
      });
    }

    // Process uploaded files
    const attachments: IAttachment[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: `/uploads/proofs/${file.filename}`,
          uploadedAt: new Date(),
        });
      }
    }

    // Parse signature if provided
    let parsedSignature;
    if (signature) {
      try {
        parsedSignature = typeof signature === 'string'
          ? JSON.parse(signature)
          : signature;

        if (parsedSignature?.signatureData) {
          parsedSignature.signedAt = new Date();
        }
      } catch (e) {
        console.error('Failed to parse signature:', e);
      }
    }

    const isSuperAdmin = req.user!.role === 'superadmin';
    const proofStatus = isSuperAdmin ? 'approved' : 'pending_review';

    // Create completion proof
    const completionProof = await CompletionProof.create({
      bookingId,
      serviceReport: parsedServiceReport,
      attachments,
      signature: parsedSignature,
      completedBy: req.user!._id,
      completedByName: req.user!.name,
      completedAt: new Date(),
      status: proofStatus,
      // If superadmin, auto-approve with their details
      ...(isSuperAdmin && {
        reviewedBy: req.user!._id,
        reviewedByName: req.user!.name,
        reviewedAt: new Date(),
      }),
    });

    // Update booking status based on role
    const previousStatus = booking.status;
    if (isSuperAdmin) {
      // Superadmin: directly complete the booking
      booking.status = 'completed';
      booking.canReview = true;
    } else {
      // Admin/technician: move to pending review
      booking.status = 'pending_review';
    }
    booking.conclusion = parsedServiceReport.workPerformed;
    pushStatusHistory(booking, booking.status, req.user!._id,
      isSuperAdmin ? 'Booking completed with proof by superadmin' : 'Completion report submitted for review');
    await booking.save();

    const bookingDetails = formatBookingDetails(booking);

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: isSuperAdmin ? 'BOOKING_COMPLETED' : 'COMPLETION_REPORT_SUBMITTED',
        resourceType: 'booking',
        resourceId: booking._id.toString(),
        details: isSuperAdmin
          ? `Booking completed with proof for ${booking.company} (${bookingDetails.date} at ${booking.time}). Work: ${parsedServiceReport.workPerformed.substring(0, 100)}...`
          : `Completion report submitted for ${booking.company} (${bookingDetails.date} at ${booking.time}). Pending superadmin review.`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    // Send notifications
    try {
      if (isSuperAdmin) {
        // Notify the booking user about completion
        if (booking.userId) {
          await NotificationService.notifyBookingStatusChange(
            booking.userId,
            booking._id.toString(),
            previousStatus,
            'completed',
            bookingDetails
          );
        }
      } else {
        // Notify all superadmins about new report
        await NotificationService.notifySuperAdminsNewReport(
          booking._id.toString(),
          req.user!.name,
          bookingDetails
        );
      }
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: isSuperAdmin
        ? 'Booking completed with proof successfully'
        : 'Completion report submitted for review',
      data: {
        proof: completionProof,
        booking,
      },
    });
  } catch (error: any) {
    console.error('Error creating completion proof:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Approve a completion proof (superadmin only)
// @route   PUT /api/completion-proofs/:id/approve
// @access  Private/SuperAdmin
export const approveCompletionProof = async (req: AuthRequest, res: Response) => {
  try {
    const proof = await CompletionProof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Completion proof not found' });
    }

    if (proof.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a proof with status "${proof.status}"`,
      });
    }

    // Update proof
    proof.status = 'approved';
    proof.reviewedBy = req.user!._id as any;
    proof.reviewedByName = req.user!.name;
    proof.reviewedAt = new Date();
    proof.reviewFeedback = req.body.feedback || undefined;
    await proof.save();

    // Complete the booking
    const booking = await Booking.findById(proof.bookingId);
    if (booking) {
      const previousStatus = booking.status;
      booking.status = 'completed';
      booking.canReview = true;
      booking.conclusion = proof.serviceReport.workPerformed;
      pushStatusHistory(booking, 'completed', req.user!._id, 'Completion report approved by superadmin');
      await booking.save();

      const bookingDetails = formatBookingDetails(booking);

      // Notify the admin who submitted
      try {
        await NotificationService.notifyReportDecision(
          proof.completedBy,
          booking._id.toString(),
          'approved',
          bookingDetails,
          req.body.feedback
        );
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }

      // Notify the booking user about completion
      if (booking.userId) {
        try {
          await NotificationService.notifyBookingStatusChange(
            booking.userId,
            booking._id.toString(),
            previousStatus,
            'completed',
            bookingDetails
          );
        } catch (e) {
          console.error('Failed to notify user:', e);
        }
      }
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'COMPLETION_REPORT_APPROVED',
        resourceType: 'completion_proof',
        resourceId: proof._id.toString(),
        details: `Approved completion report for booking ${proof.bookingId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Completion report approved successfully',
      data: proof,
    });
  } catch (error: any) {
    console.error('Error approving completion proof:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Reject a completion proof (superadmin only)
// @route   PUT /api/completion-proofs/:id/reject
// @access  Private/SuperAdmin
export const rejectCompletionProof = async (req: AuthRequest, res: Response) => {
  try {
    const { feedback } = req.body;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required when rejecting a completion report',
      });
    }

    const proof = await CompletionProof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Completion proof not found' });
    }

    if (proof.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a proof with status "${proof.status}"`,
      });
    }

    // Update proof
    proof.status = 'rejected';
    proof.reviewedBy = req.user!._id as any;
    proof.reviewedByName = req.user!.name;
    proof.reviewedAt = new Date();
    proof.reviewFeedback = feedback.trim();
    await proof.save();

    // Revert booking to confirmed so admin can resubmit
    const booking = await Booking.findById(proof.bookingId);
    if (booking) {
      booking.status = 'confirmed';
      pushStatusHistory(booking, 'confirmed', req.user!._id, `Completion report rejected: ${feedback.trim().substring(0, 100)}`);
      await booking.save();

      const bookingDetails = formatBookingDetails(booking);

      // Notify the admin who submitted
      try {
        await NotificationService.notifyReportDecision(
          proof.completedBy,
          booking._id.toString(),
          'rejected',
          bookingDetails,
          feedback.trim()
        );
      } catch (e) {
        console.error('Failed to notify admin:', e);
      }
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'COMPLETION_REPORT_REJECTED',
        resourceType: 'completion_proof',
        resourceId: proof._id.toString(),
        details: `Rejected completion report for booking ${proof.bookingId}. Feedback: ${feedback.trim().substring(0, 200)}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Completion report rejected. Technician has been notified.',
      data: proof,
    });
  } catch (error: any) {
    console.error('Error rejecting completion proof:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Revise a rejected completion proof (admin resubmits)
// @route   PUT /api/completion-proofs/:id/revise
// @access  Private/Admin
export const reviseCompletionProof = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceReport, signature } = req.body;

    const proof = await CompletionProof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({ success: false, message: 'Completion proof not found' });
    }

    if (proof.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only rejected reports can be revised',
      });
    }

    // Save current state to revision history
    const proofObj = proof.toObject();
    (proof.revisionHistory as any[]).push({
      serviceReport: proofObj.serviceReport,
      attachments: proofObj.attachments,
      signature: proofObj.signature || undefined,
      rejectionFeedback: proof.reviewFeedback || '',
      revisedAt: new Date(),
      revisedBy: req.user!._id,
    });

    // Parse and update service report
    let parsedServiceReport;
    try {
      parsedServiceReport = typeof serviceReport === 'string'
        ? JSON.parse(serviceReport)
        : serviceReport;
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid service report format' });
    }

    if (!parsedServiceReport?.workPerformed) {
      return res.status(400).json({ success: false, message: 'Work performed description is required' });
    }

    proof.serviceReport = parsedServiceReport;

    // Handle new file uploads (replace attachments)
    if (req.files && Array.isArray(req.files) && (req.files as Express.Multer.File[]).length > 0) {
      const newAttachments: IAttachment[] = [];
      for (const file of req.files as Express.Multer.File[]) {
        newAttachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: `/uploads/proofs/${file.filename}`,
          uploadedAt: new Date(),
        });
      }
      proof.attachments = newAttachments as any;
    }

    // Parse signature if provided
    if (signature) {
      try {
        const parsedSignature = typeof signature === 'string'
          ? JSON.parse(signature)
          : signature;

        if (parsedSignature?.signatureData) {
          parsedSignature.signedAt = new Date();
          proof.signature = parsedSignature;
        }
      } catch (e) {
        console.error('Failed to parse signature:', e);
      }
    }

    // Reset review state
    proof.status = 'pending_review';
    proof.reviewedBy = undefined;
    proof.reviewedByName = undefined;
    proof.reviewedAt = undefined;
    proof.reviewFeedback = undefined;
    proof.completedBy = req.user!._id as any;
    proof.completedByName = req.user!.name;
    await proof.save();

    // Update booking status back to pending_review
    const booking = await Booking.findById(proof.bookingId);
    if (booking) {
      booking.status = 'pending_review';
      booking.conclusion = parsedServiceReport.workPerformed;
      pushStatusHistory(booking, 'pending_review', req.user!._id, 'Revised completion report resubmitted for review');
      await booking.save();

      const bookingDetails = formatBookingDetails(booking);

      // Notify superadmins about revised report
      try {
        await NotificationService.notifySuperAdminsNewReport(
          booking._id.toString(),
          req.user!.name,
          bookingDetails
        );
      } catch (e) {
        console.error('Failed to notify superadmins:', e);
      }
    }

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'COMPLETION_REPORT_REVISED',
        resourceType: 'completion_proof',
        resourceId: proof._id.toString(),
        details: `Revised and resubmitted completion report for booking ${proof.bookingId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Completion report revised and resubmitted for review',
      data: proof,
    });
  } catch (error: any) {
    console.error('Error revising completion proof:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get all proofs pending review (superadmin only)
// @route   GET /api/completion-proofs/pending-review
// @access  Private/SuperAdmin
export const getPendingReviewProofs = async (req: AuthRequest, res: Response) => {
  try {
    const proofs = await CompletionProof.find({ status: 'pending_review' })
      .populate('completedBy', 'name email')
      .populate('bookingId', 'company contactName contactEmail date time purpose product location')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: proofs.length,
      data: proofs,
    });
  } catch (error: any) {
    console.error('Error fetching pending review proofs:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get completion proof by booking ID
// @route   GET /api/completion-proofs/booking/:bookingId
// @access  Private
export const getCompletionProofByBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;

    const proof = await CompletionProof.findOne({ bookingId })
      .populate('completedBy', 'name email')
      .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      data: proof, // null if no proof exists for this booking
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get completion proof by ID
// @route   GET /api/completion-proofs/:id
// @access  Private
export const getCompletionProof = async (req: Request, res: Response) => {
  try {
    const proof = await CompletionProof.findById(req.params.id)
      .populate('completedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('bookingId');

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Completion proof not found',
      });
    }

    res.status(200).json({
      success: true,
      data: proof,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Update completion proof
// @route   PUT /api/completion-proofs/:id
// @access  Private/Admin
export const updateCompletionProof = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceReport, signature } = req.body;

    let proof = await CompletionProof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Completion proof not found',
      });
    }

    // Cannot edit approved proofs
    if (proof.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit an approved completion report',
      });
    }

    // Parse service report if provided
    if (serviceReport) {
      const parsedServiceReport = typeof serviceReport === 'string'
        ? JSON.parse(serviceReport)
        : serviceReport;

      proof.serviceReport = {
        ...proof.serviceReport,
        ...parsedServiceReport,
      };
    }

    // Handle new file uploads
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        proof.attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: `/uploads/proofs/${file.filename}`,
          uploadedAt: new Date(),
        });
      }
    }

    // Parse signature if provided
    if (signature) {
      const parsedSignature = typeof signature === 'string'
        ? JSON.parse(signature)
        : signature;

      if (parsedSignature?.signatureData) {
        proof.signature = {
          ...parsedSignature,
          signedAt: new Date(),
        };
      }
    }

    await proof.save();

    // Log activity
    try {
      await ActivityLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        userEmail: req.user!.email,
        action: 'COMPLETION_PROOF_UPDATED',
        resourceType: 'completion_proof',
        resourceId: proof._id.toString(),
        details: `Completion proof updated for booking ${proof.bookingId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.status(200).json({
      success: true,
      message: 'Completion proof updated successfully',
      data: proof,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Delete attachment from completion proof
// @route   DELETE /api/completion-proofs/:id/attachments/:filename
// @access  Private/Admin
export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { id, filename } = req.params;

    const proof = await CompletionProof.findById(id);

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Completion proof not found',
      });
    }

    // Find and remove attachment
    const attachmentIndex = proof.attachments.findIndex(a => a.filename === filename);

    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from array
    proof.attachments.splice(attachmentIndex, 1);
    await proof.save();

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
      data: proof,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get all completion proofs (for reporting)
// @route   GET /api/completion-proofs
// @access  Private/Admin
export const getAllCompletionProofs = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, completedBy, status } = req.query;

    let query: any = {};

    if (startDate && endDate) {
      query.completedAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    if (completedBy) {
      query.completedBy = completedBy;
    }

    if (status) {
      query.status = status;
    }

    const proofs = await CompletionProof.find(query)
      .populate('completedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('bookingId', 'company contactName date time')
      .sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      count: proofs.length,
      data: proofs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
